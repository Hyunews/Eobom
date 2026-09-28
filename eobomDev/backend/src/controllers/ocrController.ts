import { Request, Response } from 'express';
import { verifyBearerToken } from './authController';
import { uploadPhotosMemory, MAX_PHOTO_SIZE_BYTES, MAX_PHOTO_COUNT } from '../config/uploadPhotos';
import { ClovaOcrProvider } from '../services/clovaOcrProvider';
import type { OcrProvider } from '../services/ocrProvider';
import { convertHeicToJpeg, resizeIfNeeded, getPdfPageCount } from '../services/imageConvert';

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

const todayKey = () => new Date().toISOString().slice(0, 10);

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

// 업로드 UI 노출 여부 조회 (`GET /api/ocr/status`) — 공개.
export const getOcrStatus = (_req: Request, res: Response) => {
  res.json({ status: 'success', data: { enabled: isOcrEnabled() } });
};

// 사진/PDF 업로드 → 텍스트 인식 (`POST /api/ocr/recognize`, multipart, field: photos, 최대 5개) —
// 로그인 필요. §9 P1 — F2·F3(요건 확인·근거 표시)는 하지 않는다. lines(box 포함)는 응답에
// 실어 보내되 프론트는 아직 쓰지 않는다(P2 설계용 확인).
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
          ? 'jpg·png·pdf·tiff·heic 파일만 올릴 수 있습니다.'
          : `업로드 중 오류가 발생했습니다. (파일당 최대 ${Math.round(MAX_PHOTO_SIZE_BYTES / 1024 / 1024)}MB · 최대 ${MAX_PHOTO_COUNT}장)`;
      return res.status(400).json({ status: 'error', message });
    }
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) {
      return res.status(400).json({ status: 'error', message: '사진을 선택해 주세요.' });
    }

    if (!checkAndIncrementDailyLimit(decoded.id)) {
      return res.status(429).json({ status: 'error', message: `하루 이용 횟수(${DAILY_LIMIT}회)를 다 쓰셨습니다. 내일 다시 시도해 주세요.` });
    }

    // §5 — 성공·실패 무관하게 버퍼는 이 함수 안에서만 산다. memoryStorage라 애초에 디스크에 쓴
    // 적이 없고, 응답 후 req.files의 buffer 참조가 사라져 GC 대상이 된다 — 별도 삭제 불필요.
    try {
      const texts: string[] = [];
      const lines: { text: string; box: { x: number; y: number }[] }[] = [];

      for (const file of files) {
        let buffer = file.buffer;
        let mimeType = file.mimetype.toLowerCase();

        if (mimeType === 'image/heic' || mimeType === 'image/heif') {
          buffer = await convertHeicToJpeg(buffer);
          mimeType = 'image/jpeg';
        }

        if (mimeType === 'application/pdf') {
          const pageCount = await getPdfPageCount(buffer);
          if (pageCount > MAX_PDF_PAGES) {
            return res.status(400).json({ status: 'error', message: `PDF는 최대 ${MAX_PDF_PAGES}쪽까지 올릴 수 있습니다(올리신 파일: ${pageCount}쪽).` });
          }
        } else {
          // §4.1 "크기 줄이기" — 서버 재확인. 브라우저가 이미 줄였으면 그대로 통과한다.
          buffer = await resizeIfNeeded(buffer);
        }

        const result = await provider.recognize(buffer, mimeType);
        texts.push(result.text);
        lines.push(...result.lines);
      }

      const text = texts.join('\n\n').trim();
      return res.json({ status: 'success', data: { text, lines } });
    } catch (error) {
      console.error('OCR 인식 실패:', error);
      return res.status(502).json({
        status: 'error',
        message: '사진 인식에 실패했습니다. 다른 사진으로 다시 시도하거나 아래 입력창에 직접 입력해 주세요.',
      });
    }
  });
};
