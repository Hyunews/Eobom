// 10단계 묶음 10-2 — 사진 읽기(유언장 사진 → 글자) 서버 응답 모양과 올리기 규칙.
// 지금 화면(`components/endingNote/WillPhotoUploadModal.tsx` · `WillPhotoResult.tsx`)에서 옮겼다. 정본 = 06-06 §4.1 · §6.

export type RequirementKey = 'date' | 'address' | 'name' | 'seal' | 'handwriting';
export type RequirementState = 'found' | 'missing' | 'unknown';

export interface RequirementBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WillRequirement {
  key: RequirementKey;
  state: RequirementState;
  evidence: string;
  /** 0부터 */
  page?: number;
  /** page 이미지(width×height) 기준 픽셀 좌표 */
  box?: RequirementBox;
}

export interface WillOcrPageInfo {
  text: string;
  width?: number;
  height?: number;
  /** 올린 파일 순서(사진 표시용 매핑) */
  fileIndex: number;
}

export interface WillOcrResponse {
  text: string;
  pages: WillOcrPageInfo[];
  requirements: WillRequirement[];
  /** 06-06 §5-2-2 — 보관을 요청한 경우에만 온다. stored=false면 message가 이유(10묶음 초과·저장 실패) */
  photo?: { stored: boolean; message?: string };
}

/** 부모가 메모리에만 들고 있는 마지막 인식 결과(06-06 §6 단계 5-1). 🔴 localStorage·sessionStorage·IndexedDB·서버 저장 금지 */
export interface RecentOcr {
  files: File[];
  result: WillOcrResponse;
  /** "인식된 글"에서 고친 쪽별 글. 없으면 서버가 준 글 그대로 */
  pageTexts?: string[];
}

export const REQUIREMENT_LABEL: Record<RequirementKey, string> = {
  date: '연월일',
  address: '주소',
  name: '성명',
  seal: '날인',
  handwriting: '전문 자서',
};
export const REQUIREMENT_STATE_LABEL: Record<RequirementState, string> = { found: '찾음', missing: '찾지 못함', unknown: '판단 못 함' };

export const MAX_FILES = 5;
// §4.1 용량(10-06 3차 결정) — 사진 1장 5MB · PDF 1개 20MB. 사진은 줄이기 "뒤" 크기로 잰다.
export const MAX_PHOTO_SIZE_MB = 5;
export const MAX_PDF_SIZE_MB = 20;
const MB = 1024 * 1024;
const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.pdf', '.heic', '.heif'];
export const isPdf = (f: File) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf');
// §4.1 "크기 줄이기" — 브라우저 우선 축소 기준.
const MAX_LONG_EDGE = 1960;

export const OCR_ERR = {
  format: 'jpg·png·heic·pdf 파일만 올릴 수 있습니다.',
  count: `사진은 최대 ${MAX_FILES}장까지 올릴 수 있습니다.`,
  mixed: 'PDF는 1개만 올릴 수 있고, 사진과 함께 올릴 수 없습니다.',
  photoSize: `사진 1장은 ${MAX_PHOTO_SIZE_MB}MB까지 올릴 수 있습니다.`,
  pdfSize: `PDF 파일은 ${MAX_PDF_SIZE_MB}MB까지 올릴 수 있습니다.`,
  fail: '사진 인식에 실패했습니다. 아래 입력창에 직접 입력해 주세요.',
};

// jpg·png만 캔버스로 긴 변 1,960px까지 축소한다(이미 기준 이하면 그대로). pdf·heic나 브라우저가 못 읽는 파일은
// 원본 그대로 서버로 보낸다(서버가 한 번 더 줄인다). 무엇이 실패하든 원본을 돌려준다 — 사용자에게 오류를 띄우지 않는다.
export const resizeImageIfNeeded = async (file: File): Promise<File> => {
  if (file.type !== 'image/jpeg' && file.type !== 'image/png') return file;
  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;
    if (Math.max(width, height) <= MAX_LONG_EDGE) {
      bitmap.close();
      return file;
    }
    const scale = MAX_LONG_EDGE / Math.max(width, height);
    const w = Math.round(width * scale);
    const h = Math.round(height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, file.type, 0.92));
    if (!blob) return file;
    return new File([blob], file.name, { type: file.type });
  } catch {
    return file;
  }
};

/** 올릴 파일 묶음 검사 — 문제 없으면 null. 크기는 줄인 뒤 파일로 잰다 */
export function validateOcrFiles(files: File[]): string | null {
  if (files.length > MAX_FILES) return OCR_ERR.count;
  if (files.some((f) => !ALLOWED_EXT.some((ext) => f.name.toLowerCase().endsWith(ext)))) return OCR_ERR.format;
  const pdfCount = files.filter(isPdf).length;
  if (pdfCount > 1 || (pdfCount === 1 && files.length > 1)) return OCR_ERR.mixed;
  if (files.some((f) => isPdf(f) && f.size > MAX_PDF_SIZE_MB * MB)) return OCR_ERR.pdfSize;
  if (files.some((f) => !isPdf(f) && f.size > MAX_PHOTO_SIZE_MB * MB)) return OCR_ERR.photoSize;
  return null;
}

export const sameFile = (a: File, b: File) => a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;

/** 보관한 사진 묶음(GET /api/will-photos) */
export interface VaultSet {
  id: string;
  createdAt: string;
  pageCount: number;
  mimes: string[];
}

export const MIME_EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'application/pdf': 'pdf' };
