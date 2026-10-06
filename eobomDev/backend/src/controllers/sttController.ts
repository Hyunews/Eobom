import { Request, Response } from 'express';
import { verifyBearerToken } from './authController';
import { uploadAudioMemory, MAX_AUDIO_SIZE_BYTES } from '../config/uploadAudio';
import { ClovaSpeechProvider } from '../services/clovaSpeechProvider';
import type { SttProvider } from '../services/sttProvider';
import { isR2Enabled } from '../config/r2';
import { uploadVoiceObject } from '../services/r2Storage';
import { HEAVY_QUEUE_CONFIG } from '../services/heavyQueue';
import { runHeavyJob, heavyFailureResponse, NoRecognizedTextError } from '../services/heavyJob';
import { getAudioDurationSec } from '../services/audioDuration';

// docs 06-04 §6.4-9·§6.4-11 — STT Ⓐ 파일 업로드. Ⓑ(직접 녹음, Web Speech API)는 프론트에서
// 브라우저가 직접 처리하고 이 컨트롤러를 거치지 않는다 — 이 파일은 Ⓐ 전용이다.

// §6.4-9-8-3·§6.4-11-5 — 기능 플래그. 기본값 false. provider 배선이 살아 있어도 플래그가
// 꺼져 있으면 아무도 호출할 수 없다 — "화면이 약속했는데 뒷받침이 없다"(§2.2 패턴)를
// 서버 쪽에서도 한 번 더 막는 안전망이다(프론트는 /status로 이 값을 물어 업로드 UI 자체를 숨긴다).
const isSttEnabled = () => process.env.CLOVA_STT_ENABLED === 'true';

// §6.4-9-5 — SttProvider 경계. provider가 바뀌면 이 한 줄만 바뀐다.
const provider: SttProvider = new ClovaSpeechProvider();

// 업로드 UI 노출 여부 조회 (`GET /api/stt/status`) — 공개. 플래그 값 자체는 비밀이 아니다.
// voiceStorageEnabled를 같이 내려 프론트가 "목소리도 함께 남기기" 옵션 자체를 R2_ENABLED와
// 별개로 숨길지 판단하게 한다(STT와 저장은 서로 다른 플래그다) — 06-05 §8 D-1.
export const getSttStatus = (_req: Request, res: Response) => {
  res.json({
    status: 'success',
    data: { enabled: isSttEnabled(), voiceStorageEnabled: isR2Enabled() },
  });
};

// 음성 파일 업로드 → 텍스트 변환 (`POST /api/stt/transcribe`, multipart, field: audio,
// 선택 필드 saveAudio='false'로 저장을 끌 수 있다. 기본은 저장) — 로그인 필요.
export const transcribeAudio = (req: Request, res: Response) => {
  if (!isSttEnabled()) {
    return res.status(404).json({ status: 'error', message: 'STT 업로드 기능이 비활성화되어 있습니다.' });
  }
  const decoded = verifyBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '로그인이 필요합니다.' });
  }

  uploadAudioMemory(req, res, async (err) => {
    if (err) {
      const message =
        err.message === 'INVALID_FILE_TYPE'
          ? 'm4a·mp3·wav·webm 파일만 업로드할 수 있습니다.'
          : `업로드 중 오류가 발생했습니다. (최대 ${Math.round(MAX_AUDIO_SIZE_BYTES / 1024 / 1024)}MB)`;
      return res.status(400).json({ status: 'error', message });
    }
    const file = req.file;
    if (!file) {
      return res.status(400).json({ status: 'error', message: '음성 파일을 선택해 주세요.' });
    }

    // §6.4-11-10 음성 길이 상한 — 서버 재확인(대기열 앞). 길이를 못 읽는 파일은 통과(서버 시간 제한이 막는다).
    const durationSec = getAudioDurationSec(file.buffer);
    if (durationSec !== null && durationSec > HEAVY_QUEUE_CONFIG.audioMaxSeconds) {
      return res.status(400).json({ status: 'error', message: `${Math.round(HEAVY_QUEUE_CONFIG.audioMaxSeconds / 60)}분 이하 녹음만 올릴 수 있습니다.` });
    }

    // §6.4-11-10 — 사진 글자 인식과 합산한 동시 처리 제한 + 시간 제한(업로드를 다 받은 때부터 115초, 대기 + 처리 합계).
    // 대기 한도·예상 대기를 넘기면 즉시 503(①), 처리 중 마감이면 504(②), CLOVA 오류·연결 실패면 502(③).
    // §6.4-9-4 — 성공·실패 무관하게 버퍼는 여기서만 산다. memoryStorage라 애초에 디스크에 쓴
    // 적이 없고, 이 함수가 끝나면 req.file.buffer 참조가 사라져 GC 대상이 된다 — 별도 삭제 불필요.
    const outcome = await runHeavyJob(res, 'audio', async (signal) => {
      const text = await provider.transcribe(file.buffer, file.mimetype, signal);

      // 06-05 §8 D-2 #14 — STT 후 원본 blob도 R2에 남긴다. saveAudio='false'가 명시된 경우
      // (Ⓑ에서 "목소리도 함께 남기기"를 끈 상태로 폴백한 경우)에만 건너뛴다.
      let media: { mediaKey: string; mediaMime: string } | undefined;
      const saveAudio = req.body?.saveAudio !== 'false';
      if (isR2Enabled() && saveAudio) {
        try {
          const { mediaKey } = await uploadVoiceObject(file.buffer);
          media = { mediaKey, mediaMime: file.mimetype };
        } catch (uploadError) {
          // 저장 실패가 변환 성공 응답을 막지는 않는다 — 텍스트는 이미 얻었다.
          console.error('음성 원본 R2 저장 실패:', uploadError);
        }
      }

      return { text, ...(media ? { media } : {}) };
    }, { audioSec: durationSec }); // §6.4-11-10-1 건별 기록에 음성 길이(초)를 넘긴다 — 못 읽었으면 null

    if (outcome.ok) return res.json({ status: 'success', data: outcome.value });
    if (outcome.reason === 'aborted') return; // 연결 끊김 — 응답할 상대가 없다
    if (outcome.reason === 'busy' || outcome.reason === 'slow') {
      const f = heavyFailureResponse('audio', outcome.reason);
      return res.status(f.status).json(f.body);
    }

    console.error('STT 변환 실패:', outcome.error);
    if (outcome.error instanceof NoRecognizedTextError) {
      // CLOVA는 정상 응답했지만 내용이 없다(무음·잡음) — 연결 실패(③)가 아니다.
      return res.status(502).json({
        status: 'error',
        message: '음성 변환에 실패했습니다. 직접 녹음이나 아래 입력창에 직접 입력해 이어서 작성해 주세요.',
      });
    }
    const f = heavyFailureResponse('audio', 'upstream');
    return res.status(f.status).json(f.body);
  });
};

// 06-05 §8 D-3 — 직접 녹음(Ⓑ)에서 Web Speech 인식이 이미 성공한 경우, 변환 없이 원본 blob만
// R2에 저장한다 (`POST /api/stt/store-audio`, multipart, field: audio) — 로그인 필요.
// CLOVA_STT_ENABLED와 무관하게 R2_ENABLED만 본다 — 변환을 하지 않으므로 STT 플래그와는
// 별개의 기능이다.
export const storeVoiceAudio = (req: Request, res: Response) => {
  if (!isR2Enabled()) {
    return res.status(404).json({ status: 'error', message: '음성 저장 기능이 비활성화되어 있습니다.' });
  }
  const decoded = verifyBearerToken(req);
  if (!decoded) {
    return res.status(401).json({ status: 'error', message: '로그인이 필요합니다.' });
  }

  uploadAudioMemory(req, res, async (err) => {
    if (err) {
      const message =
        err.message === 'INVALID_FILE_TYPE'
          ? 'm4a·mp3·wav·webm 파일만 올릴 수 있습니다.'
          : `업로드 중 오류가 발생했습니다. (최대 ${Math.round(MAX_AUDIO_SIZE_BYTES / 1024 / 1024)}MB)`;
      return res.status(400).json({ status: 'error', message });
    }
    const file = req.file;
    if (!file) {
      return res.status(400).json({ status: 'error', message: '음성 파일을 선택해 주세요.' });
    }

    try {
      const { mediaKey } = await uploadVoiceObject(file.buffer);
      return res.json({ status: 'success', data: { media: { mediaKey, mediaMime: file.mimetype } } });
    } catch (error) {
      console.error('음성 원본 R2 저장 실패:', error);
      return res.status(502).json({ status: 'error', message: '음성 저장에 실패했습니다.' });
    }
  });
};
