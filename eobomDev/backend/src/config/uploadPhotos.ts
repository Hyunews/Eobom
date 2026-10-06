import multer from 'multer';

// docs 06-06 §4.1·§5 — 유언장 사진 업로드 전용. uploadAudio.ts와 같은 이유로 memoryStorage —
// 디스크에 쓰지 않는다. 버퍼는 요청 처리 중에만 살고, 응답과 함께 GC 대상이 된다.

// CLOVA OCR이 받는 4개 + heic(서버에서 jpg로 변환 후 넘김, §4.1).
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/tiff',
  'image/tif',
  'application/pdf',
  'image/heic',
  'image/heif',
]);
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.tif', '.tiff', '.pdf', '.heic', '.heif']);

// §4 용량 — 장당 20MB 이하(사진·PDF 공통, 10-06 2차 결정).
export const MAX_PHOTO_SIZE_BYTES = 20 * 1024 * 1024;
// §4.1·§7 #7 — 사진 5장(또는 PDF 1개, 컨트롤러에서 페이지 수 별도 확인).
export const MAX_PHOTO_COUNT = 5;

const storage = multer.memoryStorage();

export const uploadPhotosMemory = multer({
  storage,
  limits: { fileSize: MAX_PHOTO_SIZE_BYTES, files: MAX_PHOTO_COUNT },
  fileFilter: (_req, file, cb) => {
    const dot = file.originalname.lastIndexOf('.');
    const ext = dot >= 0 ? file.originalname.slice(dot).toLowerCase() : '';
    if (!ALLOWED_MIME_TYPES.has(file.mimetype.toLowerCase()) && !ALLOWED_EXTENSIONS.has(ext)) {
      cb(new Error('INVALID_FILE_TYPE'));
      return;
    }
    cb(null, true);
  },
}).array('photos', MAX_PHOTO_COUNT);
