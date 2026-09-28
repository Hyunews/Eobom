import convertHeic from 'heic-convert';
import sharp from 'sharp';
import { PDFDocument } from 'pdf-lib';

// docs 06-06 §4.1 — 전부 메모리 버퍼만 다룬다. 디스크에 쓰지 않는다(§5와 같은 원칙,
// audioConvert.ts와 같은 결).

// §4.1 "HEIC — 2차 방어" — 서버 메모리에서 jpg로 변환 후 OCR로 넘긴다.
export const convertHeicToJpeg = async (input: Buffer): Promise<Buffer> => {
  const output = await convertHeic({ buffer: input, format: 'JPEG', quality: 0.92 });
  return Buffer.from(output);
};

// §4.1 "크기 줄이기" — 긴 변이 1,960px를 넘으면 줄인다. 브라우저가 먼저 줄이므로(우선 경로)
// 여기서는 넘어온 값만 재확인한다 — 이미 기준 이하면 다시 인코딩하지 않는다(화질 손실 방지).
const MAX_LONG_EDGE = 1960;

export const resizeIfNeeded = async (input: Buffer): Promise<Buffer> => {
  const image = sharp(input);
  const metadata = await image.metadata();
  const { width, height } = metadata;
  if (!width || !height) return input;
  if (Math.max(width, height) <= MAX_LONG_EDGE) return input;

  return image
    .rotate() // EXIF 방향 정보를 반영해 회전한 뒤 저장(방향 태그만 있고 픽셀은 안 돌아간 채로 축소되는 사고 방지)
    .resize({ width: MAX_LONG_EDGE, height: MAX_LONG_EDGE, fit: 'inside', withoutEnlargement: true })
    .toBuffer();
};

// §4.1 "여러 장 상한" — PDF는 콘솔 한도 10쪽이지만 이어봄은 5쪽까지로 맞춘다.
export const getPdfPageCount = async (input: Buffer): Promise<number> => {
  const doc = await PDFDocument.load(input, { updateMetadata: false });
  return doc.getPageCount();
};
