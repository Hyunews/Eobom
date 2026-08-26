import { Request, Response } from 'express';
import { verifyBearerToken } from './authController';
import { uploadAudioMemory, MAX_AUDIO_SIZE_BYTES } from '../config/uploadAudio';
import { ClovaSpeechProvider } from '../services/clovaSpeechProvider';
import type { SttProvider } from '../services/sttProvider';

// docs 06-04 §6.4-9·§6.4-11 — STT Ⓐ 파일 업로드. Ⓑ(직접 녹음, Web Speech API)는 프론트에서
// 브라우저가 직접 처리하고 이 컨트롤러를 거치지 않는다 — 이 파일은 Ⓐ 전용이다.

// §6.4-9-8-3·§6.4-11-5 — 기능 플래그. 기본값 false. provider 배선이 살아 있어도 플래그가
// 꺼져 있으면 아무도 호출할 수 없다 — "화면이 약속했는데 뒷받침이 없다"(§2.2 패턴)를
// 서버 쪽에서도 한 번 더 막는 안전망이다(프론트는 /status로 이 값을 물어 업로드 UI 자체를 숨긴다).
const isSttEnabled = () => process.env.CLOVA_STT_ENABLED === 'true';

// §6.4-9-5 — SttProvider 경계. provider가 바뀌면 이 한 줄만 바뀐다.
const provider: SttProvider = new ClovaSpeechProvider();

// 업로드 UI 노출 여부 조회 (`GET /api/stt/status`) — 공개. 플래그 값 자체는 비밀이 아니다.
export const getSttStatus = (_req: Request, res: Response) => {
  res.json({ status: 'success', data: { enabled: isSttEnabled() } });
};

// 음성 파일 업로드 → 텍스트 변환 (`POST /api/stt/transcribe`, multipart, field: audio) — 로그인 필요.
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
          ? 'm4a·mp3·wav 파일만 업로드할 수 있습니다.'
          : `업로드 중 오류가 발생했습니다. (최대 ${Math.round(MAX_AUDIO_SIZE_BYTES / 1024 / 1024)}MB)`;
      return res.status(400).json({ status: 'error', message });
    }
    const file = req.file;
    if (!file) {
      return res.status(400).json({ status: 'error', message: '음성 파일을 선택해 주세요.' });
    }

    // §6.4-9-4 — 성공·실패 무관하게 버퍼는 여기서만 산다. memoryStorage라 애초에 디스크에 쓴
    // 적이 없고, 이 함수가 끝나면 req.file.buffer 참조가 사라져 GC 대상이 된다 — 별도 삭제 불필요.
    try {
      const text = await provider.transcribe(file.buffer, file.mimetype);
      return res.json({ status: 'success', data: { text } });
    } catch (error) {
      console.error('STT 변환 실패:', error);
      return res.status(502).json({
        status: 'error',
        message: '음성 변환에 실패했습니다. 직접 녹음이나 아래 입력창에 직접 입력해 이어서 작성해 주세요.',
      });
    }
  });
};
