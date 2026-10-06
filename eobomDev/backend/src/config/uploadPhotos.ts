import multer from 'multer';

// docs 06-06 §4.1·§5 — 유언장 사진 업로드 전용. uploadAudio.ts와 같은 이유로 memoryStorage —
// 디스크에 쓰지 않는다. 버퍼는 요청 처리 중에만 살고, 응답과 함께 GC 대상이 된다.

// jpg·png·pdf + heic(서버에서 jpg로 변환 후 넘김, §4.1). tiff는 10-06 3차 결정으로 뺐다.
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/pdf',
  'image/heic',
  'image/heif',
]);
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.pdf', '.heic', '.heif']);

// §4 용량(10-06 3차 결정) — 사진(jpg·png·heic) 1장 5MB · PDF 1개 20MB.
// multer 한도는 둘 중 큰 쪽(20MB)이고, 받은 뒤 형식별로 다시 확인한다(checkUploadSet).
export const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;
export const MAX_PDF_SIZE_BYTES = 20 * 1024 * 1024;
// §4.1·§7 #7 — 사진 5장(또는 PDF 1개, 컨트롤러에서 페이지 수 별도 확인).
export const MAX_PHOTO_COUNT = 5;

const MB = 1024 * 1024;
export const PHOTO_TOO_LARGE_MESSAGE = `사진 1장은 ${MAX_PHOTO_SIZE_BYTES / MB}MB까지 올릴 수 있습니다.`;
export const PDF_TOO_LARGE_MESSAGE = `PDF 파일은 ${MAX_PDF_SIZE_BYTES / MB}MB까지 올릴 수 있습니다.`;
export const PDF_ONLY_ONE_MESSAGE = 'PDF는 1개만 올릴 수 있고, 사진과 함께 올릴 수 없습니다.';
export const INVALID_TYPE_MESSAGE = 'jpg·png·pdf 파일만 올릴 수 있습니다.';

interface UploadedFileInfo {
  mimetype: string;
  originalname: string;
  size: number;
}

export const isPdfUpload = (file: Pick<UploadedFileInfo, 'mimetype' | 'originalname'>): boolean =>
  file.mimetype.toLowerCase() === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf');

// 받은 뒤 재확인 — 대기열에 들어가기 전에 부른다. 문제가 없으면 null, 있으면 400 문구.
export const checkUploadSet = (files: UploadedFileInfo[]): string | null => {
  const pdfCount = files.filter(isPdfUpload).length;
  if (pdfCount > 1 || (pdfCount === 1 && files.length > 1)) return PDF_ONLY_ONE_MESSAGE;
  for (const f of files) {
    if (isPdfUpload(f)) {
      if (f.size > MAX_PDF_SIZE_BYTES) return PDF_TOO_LARGE_MESSAGE;
    } else if (f.size > MAX_PHOTO_SIZE_BYTES) {
      return PHOTO_TOO_LARGE_MESSAGE;
    }
  }
  return null;
};

// multer의 LIMIT_FILE_SIZE는 어느 파일인지 알려주지 않는다 — fileFilter가 마지막으로 본 형식을 기억해 문구를 고른다.
const LAST_KIND = Symbol('lastUploadKind');
export const limitSizeMessage = (req: object): string =>
  (req as Record<symbol, string>)[LAST_KIND] === 'pdf' ? PDF_TOO_LARGE_MESSAGE : PHOTO_TOO_LARGE_MESSAGE;

const storage = multer.memoryStorage();

export const uploadPhotosMemory = multer({
  storage,
  limits: { fileSize: MAX_PDF_SIZE_BYTES, files: MAX_PHOTO_COUNT },
  fileFilter: (req, file, cb) => {
    const dot = file.originalname.lastIndexOf('.');
    const ext = dot >= 0 ? file.originalname.slice(dot).toLowerCase() : '';
    if (!ALLOWED_MIME_TYPES.has(file.mimetype.toLowerCase()) && !ALLOWED_EXTENSIONS.has(ext)) {
      cb(new Error('INVALID_FILE_TYPE'));
      return;
    }
    (req as unknown as Record<symbol, string>)[LAST_KIND] = isPdfUpload(file) ? 'pdf' : 'photo';
    cb(null, true);
  },
}).array('photos', MAX_PHOTO_COUNT);
