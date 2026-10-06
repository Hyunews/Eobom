import { Request, Response } from 'express';
import { verifyBearerToken } from './authController';
import { uploadPhotosMemory, MAX_PHOTO_COUNT, MAX_PDF_SIZE_BYTES, INVALID_TYPE_MESSAGE, limitSizeMessage, checkUploadSet } from '../config/uploadPhotos';
import { ClovaOcrProvider } from '../services/clovaOcrProvider';
import type { OcrProvider } from '../services/ocrProvider';
import sharp from 'sharp';
import prisma from '../config/prisma';
import { kstYmd } from '../utils/kst';
import { convertHeicToJpeg, resizeIfNeeded, normalizeOrientation, getPdfPageCount } from '../services/imageConvert';
import { detectSeal } from '../services/sealDetect';
import { runHeavyJob, heavyFailureResponse, NoRecognizedTextError } from '../services/heavyJob';
import { checkWillRequirements } from '../services/willRequirements';
import type { OcrPage } from '../services/ocrProvider';
import type { SealDetection } from '../services/willRequirements';

// docs 06-06 §5·§9 P1 — 유언장 사진 인식. sttController.ts와 같은 구조(플래그 → 인증 →
// multer 수동 호출 → 파이프라인 → 버퍼 폐기).

// §5 — 기능 플래그. 기본값 false, provider가 없는 상태로 버튼을 노출하지 않는다(§5 마지막 줄).
const isOcrEnabled = () => process.env.CLOVA_OCR_ENABLED === 'true';

// §5 — OcrProvider 경계. provider가 바뀌면 이 한 줄만 바뀐다.
const provider: OcrProvider = new ClovaOcrProvider();

const MAX_PDF_PAGES = 5; // §4.1 — PDF는 콘솔 한도 10쪽이지만 이어봄은 5쪽까지.
const DAILY_LIMIT = 10; // §7 #8 — 사용자당 하루 10회.

// 🔴 P1 한정 임시 구현 — 인메모리 카운터다. 서버 재시작·다중 인스턴스에서는 리셋된다.
// DB에 테이블을 새로 만들려면 마이그레이션(CONFIRM 대상)이 필요해 P1 범위를 벗어난다 —
// 남용 방지용 1차 가드로 충분하다고 보고 우선 이렇게 둔다. 실사용 노출 전 재검토 필요(walkthrough 기록).
const dailyCallCounts = new Map<string, { date: string; count: number }>();

const todayKey = () => kstYmd(); // 하루 한도가 한국 자정에 초기화된다(이전엔 UTC 자정 = 한국 오전 9시)

// 대기열에 들어가기 전 읽기 전용 확인 — 이미 한도를 다 쓴 사용자가 대기만 차지하지 않게 한다.
const isDailyLimitReached = (userId: string): boolean => {
  const entry = dailyCallCounts.get(userId);
  return !!entry && entry.date === todayKey() && entry.count >= DAILY_LIMIT;
};

const checkAndIncrementDailyLimit = (userId: string): boolean => {
  const today = todayKey();
  const entry = dailyCallCounts.get(userId);
  if (!entry || entry.date !== today) {
    dailyCallCounts.set(userId, { date: today, count: 1 });
    return true;
  }
  if (entry.count >= DAILY_LIMIT) return false;
  entry.count += 1;
  return true;
};

// 10-06 — 서버 마감(55초)·연결 오류로 멈춘 요청은 하루 횟수를 되돌린다(실제로 처리한 것만 센다).
const refundDailyCall = (userId: string) => {
  const entry = dailyCallCounts.get(userId);
  if (entry && entry.date === todayKey() && entry.count > 0) entry.count -= 1;
};

// 작업 안에서 낸 "이용자 입력 문제"(400) · "하루 횟수 소진"(429) — 연결 오류(③)와 구분한다.
class UserInputError extends Error {}
class DailyLimitError extends Error {}

// 업로드 UI 노출 여부 조회 (`GET /api/ocr/status`) — 공개.
export const getOcrStatus = (_req: Request, res: Response) => {
  res.json({ status: 'success', data: { enabled: isOcrEnabled() } });
};

// 사진/PDF 업로드 → 텍스트 인식 (`POST /api/ocr/recognize`, multipart, field: photos, 최대 5개) —
// 로그인 필요. §9 P2 — F2·F3(요건 확인·근거 표시): 응답의 requirements(항목 5개)와 pages(쪽별 글·
// 크기)를 화면이 쓴다. lines(box 원본)는 더 이상 내려보내지 않는다 — 좌표는 requirements[].box에만 담긴다.
export const recognizeWillPhotos = (req: Request, res: Response) => {
  if (!isOcrEnabled()) {
    return res.status(404).json({ status: 'error', message: '사진 인식 기능이 비활성화되어 있습니다.' });
  }
  const decoded = verifyBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '로그인이 필요합니다.' });
  }

  uploadPhotosMemory(req, res, async (err) => {
    if (err) {
      const message =
        err.message === 'INVALID_FILE_TYPE'
          ? INVALID_TYPE_MESSAGE
          : (err as { code?: string }).code === 'LIMIT_FILE_SIZE'
            ? limitSizeMessage(req)
            : `업로드 중 오류가 발생했습니다. (사진 최대 ${MAX_PHOTO_COUNT}장 · PDF 1개 ${Math.round(MAX_PDF_SIZE_BYTES / 1024 / 1024)}MB까지)`;
      return res.status(400).json({ status: 'error', message });
    }
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) {
      return res.status(400).json({ status: 'error', message: '사진을 선택해 주세요.' });
    }

    // 🔴 형식별 용량·PDF 1개 재확인 — 대기열(heavyQueue.acquire) 앞에서 끝낸다(10-06 3·4차 결정).
    const setError = checkUploadSet(files);
    if (setError) return res.status(400).json({ status: 'error', message: setError });

    const limitReached = () =>
      res.status(429).json({ status: 'error', message: `하루 이용 횟수(${DAILY_LIMIT}회)를 다 쓰셨습니다. 내일 다시 시도해 주세요.` });
    if (isDailyLimitReached(decoded.id)) return limitReached();

    // §6.4-11-10 — 음성 변환과 합산한 동시 처리 제한 + 시간 제한(업로드를 다 받은 때부터 55초, 대기 + 처리 합계).
    // 대기 한도·예상 대기를 넘기면 즉시 503(①), 처리 중 마감이면 504(②), CLOVA 오류·연결 실패면 502(③).
    // 🔴 횟수는 슬롯을 얻은 뒤에 센다 — 503으로 돌려보낸 요청은 하루 횟수에서 빼지 않는다.
    //    멈춘 요청(② ③ · 연결 끊김)은 이미 센 횟수를 되돌린다.
    let counted = false;
    const outcome = await runHeavyJob(res, 'photo', async (signal) => {
      // 대기하는 사이 같은 사용자의 다른 요청이 한도를 채웠을 수 있어 여기서 다시 센다.
      if (!checkAndIncrementDailyLimit(decoded.id)) throw new DailyLimitError();
      counted = true;

      // §5 — 성공·실패 무관하게 버퍼는 이 함수 안에서만 산다. memoryStorage라 애초에 디스크에 쓴
      // 적이 없고, 응답 후 req.files의 buffer 참조가 사라져 GC 대상이 된다 — 별도 삭제 불필요.
      const texts: string[] = [];
      const pages: OcrPage[] = [];
      const seals: SealDetection[] = [];
      let imageAnalysisComplete = true; // PDF가 하나라도 끼면 인주 분석을 못 한 쪽이 생긴다
      let allGrayscale = true;

      const pageFile: number[] = []; // 쪽 → 올린 파일 순서(화면이 어느 사진을 그릴지)

      for (const [fileIndex, file] of files.entries()) {
        let buffer = file.buffer;
        let mimeType = file.mimetype.toLowerCase();

        if (mimeType === 'image/heic' || mimeType === 'image/heif') {
          buffer = await convertHeicToJpeg(buffer);
          mimeType = 'image/jpeg';
        }

        const isPdf = mimeType === 'application/pdf';
        if (isPdf) {
          const pageCount = await getPdfPageCount(buffer);
          if (pageCount > MAX_PDF_PAGES) {
            throw new UserInputError(`PDF는 최대 ${MAX_PDF_PAGES}쪽까지 올릴 수 있습니다(올리신 파일: ${pageCount}쪽).`);
          }
        } else {
          // §4.1 "크기 줄이기" — 서버 재확인. 브라우저가 이미 줄였으면 그대로 통과한다.
          // P2 — 박스 좌표가 화면에 그려지는 사진과 같은 방향을 보도록 EXIF 방향을 먼저 반영한다.
          buffer = await normalizeOrientation(buffer);
          buffer = await resizeIfNeeded(buffer);
        }

        signal.throwIfAborted(); // 마감·연결 끊김 뒤에는 다음 파일을 시작하지 않는다
        const result = await provider.recognize(buffer, mimeType, signal);
        texts.push(result.text);

        if (isPdf || result.pages.length !== 1) {
          // 쪽 크기를 모르므로 박스 없이 글만 돌려준다(§6-1 PDF). 인주 분석도 하지 않는다.
          imageAnalysisComplete = false;
          allGrayscale = false;
          pages.push(...result.pages);
          result.pages.forEach(() => pageFile.push(fileIndex));
        } else {
          // 🔴 F2 날인(§3.1) — 이미지 분석. 외부로 보내지 않고 이 버퍼만 본다.
          const seal = await detectSeal(buffer);
          const pageIndex = pages.length;
          pages.push({ ...result.pages[0], width: seal.width, height: seal.height });
          pageFile.push(fileIndex);
          seals.push(...seal.seals.map((box) => ({ page: pageIndex, box })));
          if (!seal.grayscale) allGrayscale = false;
        }
      }

      const text = texts.join('\n\n').trim();

      // 🔴 F2 성명 — 계정에 등록된 이름과 비교한다. 데모 토큰처럼 DB에 없으면 토큰의 name을 쓴다.
      const user = await prisma.user.findUnique({ where: { id: decoded.id }, select: { name: true } }).catch(() => null);
      const userName = user?.name ?? (typeof decoded.name === 'string' ? decoded.name : null);

      const requirements = checkWillRequirements(
        { pages },
        { analyzed: imageAnalysisComplete, grayscale: allGrayscale && seals.length === 0, seals },
        userName,
      );

      // §5·§7 #3 — 사진도 결과도 저장하지 않는다. 화면이 쪽 사진을 그리려면 크기(width/height)만 필요하고,
      // 이미지는 브라우저에 이미 있는 것을 쓴다. 글은 쪽별로 나눠 보낸다("인식된 글" 탭).
      return {
        text,
        pages: pages.map((p, i) => ({ text: p.text, width: p.width, height: p.height, fileIndex: pageFile[i] })),
        requirements,
      };
    }, {
      // §6.4-11-10-1 건별 기록 — 사용자 입력 문제(쪽수 초과)·하루 한도는 "처리 결과"가 아니라 기록하지 않는다(오류 건수에 섞이지 않게).
      skipRecordOnError: (e) => e instanceof UserInputError || e instanceof DailyLimitError,
    });

    if (outcome.ok) return res.json({ status: 'success', data: outcome.value });

    if (outcome.reason === 'aborted') {
      if (counted) refundDailyCall(decoded.id);
      return; // 연결 끊김 — 응답할 상대가 없다
    }
    if (outcome.reason === 'busy') {
      const f = heavyFailureResponse('photo', 'busy');
      return res.status(f.status).json(f.body);
    }
    if (outcome.reason === 'slow') {
      if (counted) refundDailyCall(decoded.id);
      const f = heavyFailureResponse('photo', 'slow');
      return res.status(f.status).json(f.body);
    }

    const error = outcome.error;
    if (error instanceof DailyLimitError) return limitReached();
    if (error instanceof UserInputError) {
      if (counted) refundDailyCall(decoded.id);
      return res.status(400).json({ status: 'error', message: error.message });
    }
    console.error('OCR 인식 실패:', error);
    if (error instanceof NoRecognizedTextError) {
      // CLOVA는 정상 응답했지만 글자가 없다 — 처리한 건이라 횟수는 그대로 둔다.
      return res.status(502).json({
        status: 'error',
        message: '사진 인식에 실패했습니다. 다른 사진으로 다시 시도하거나 아래 입력창에 직접 입력해 주세요.',
      });
    }
    if (counted) refundDailyCall(decoded.id);
    const f = heavyFailureResponse('photo', 'upstream');
    return res.status(f.status).json(f.body);
  });
};
