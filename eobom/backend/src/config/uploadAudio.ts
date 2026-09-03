import multer from 'multer';

// STT Ⓐ 파일 업로드 전용 — docs 06-04 §6.4-9-4 "디스크에 쓰지 않는다". 기존 config/upload.ts는
// diskStorage(시설 이미지·추모 사진용)이므로 그 설정을 재사용하지 않고 memoryStorage로 따로 둔다.
// 버퍼는 요청 처리 중에만 메모리에 있다가 응답과 함께 GC 대상이 된다 — 별도 삭제 로직이 필요 없다.

// 브라우저·OS마다 m4a의 mimetype 판정이 갈린다(흔히 audio/mp4로 온다) — 확장자를 함께 확인해
// 정상 파일을 mimetype 오탐으로 막지 않는다(§6.4-9-3 — m4a·mp3·wav 3종 모두 받아야 한다).
// 🔴 06-05 §5.5-4 — webm 추가. Chrome MediaRecorder 기본 출력이 audio/webm;codecs=opus라
// 없으면 직접 녹음(Ⓑ) 저장·폴백 업로드가 전부 반려된다.
const ALLOWED_MIME_TYPES = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/wave',
  'audio/mp4',
  'audio/x-m4a',
  'audio/m4a',
  'audio/aac',
  'audio/webm',
]);
const ALLOWED_EXTENSIONS = new Set(['.mp3', '.wav', '.m4a', '.webm']);

// §6.4-11-6-2 — Free 플랜 월 15분. 넉넉히 잡되(20MB ≈ 128kbps 기준 20분 안팎) 한 번의 업로드가
// 월 한도를 통째로 태우지 않게 보수적으로 둔다. 화면에 선택 전 표시(§6.4-9-3).
export const MAX_AUDIO_SIZE_BYTES = 20 * 1024 * 1024;

const storage = multer.memoryStorage();

export const uploadAudioMemory = multer({
  storage,
  limits: { fileSize: MAX_AUDIO_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    const dot = file.originalname.lastIndexOf('.');
    const ext = dot >= 0 ? file.originalname.slice(dot).toLowerCase() : '';
    if (!ALLOWED_MIME_TYPES.has(file.mimetype.toLowerCase()) && !ALLOWED_EXTENSIONS.has(ext)) {
      cb(new Error('INVALID_FILE_TYPE'));
      return;
    }
    cb(null, true);
  },
}).single('audio');
