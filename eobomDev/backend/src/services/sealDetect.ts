import sharp from 'sharp';
import type { RequirementBox } from './willRequirements';

// docs 06-06 §3.1 날인 — 이미지 분석(OCR 아님). 붉은색(인주) 덩어리만 찾는다.
// 🔴 외부로 보내지 않는다 — 서버 메모리의 버퍼만 본다(§5). 검은 도장·흑백·흐린 사진은 못 찾는다
// (그래서 결과가 "찾지 못함"이어도 문구는 "검은 도장은 확인 못 함"을 함께 말한다).

const ANALYSIS_EDGE = 480; // 분석용 축소 — 긴 변 기준
const MIN_RED_PIXELS = 80; // 축소본 기준. 이보다 작은 붉은 점(펜 점·잡티)은 버린다
const MAX_ASPECT = 3.5; // 가늘고 긴 붉은 줄(밑줄·교정선)은 도장이 아니다
const MIN_FILL = 0.12;
const MAX_SIDE_RATIO = 0.45; // 화면 절반 가까이 되는 붉은 덩어리는 도장이 아니라 배경·인쇄물
const MAX_SEALS = 5;
const GRAYSCALE_CHROMA = 25;
const GRAYSCALE_MAX_COLORED_RATIO = 0.005;

export interface SealDetectResult {
  width: number; // 입력 이미지 크기(box 좌표의 기준)
  height: number;
  grayscale: boolean;
  seals: RequirementBox[];
}

const isRed = (r: number, g: number, b: number) => r >= 130 && r > g * 1.5 && r > b * 1.4;

// 3×3 팽창 — 글자 획이 갈라진 도장을 한 덩어리로 묶는다.
const dilate = (mask: Uint8Array, w: number, h: number): Uint8Array => {
  const out = new Uint8Array(mask.length);
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      let on = 0;
      for (let dy = -1; dy <= 1 && !on; dy += 1) {
        const yy = y + dy;
        if (yy < 0 || yy >= h) continue;
        for (let dx = -1; dx <= 1; dx += 1) {
          const xx = x + dx;
          if (xx >= 0 && xx < w && mask[yy * w + xx]) {
            on = 1;
            break;
          }
        }
      }
      out[y * w + x] = on;
    }
  }
  return out;
};

export const detectSeal = async (image: Buffer): Promise<SealDetectResult> => {
  const meta = await sharp(image).metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  if (!width || !height) return { width, height, grayscale: false, seals: [] };

  const { data, info } = await sharp(image)
    .resize({ width: ANALYSIS_EDGE, height: ANALYSIS_EDGE, fit: 'inside', withoutEnlargement: true })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const w = info.width;
  const h = info.height;
  const ch = info.channels;
  const red = new Uint8Array(w * h);
  let colored = 0;
  for (let i = 0; i < w * h; i += 1) {
    const r = data[i * ch];
    const g = data[i * ch + 1];
    const b = data[i * ch + 2];
    if (isRed(r, g, b)) red[i] = 1;
    if (Math.max(r, g, b) - Math.min(r, g, b) > GRAYSCALE_CHROMA) colored += 1;
  }
  const grayscale = colored / (w * h) < GRAYSCALE_MAX_COLORED_RATIO;

  // 팽창한 마스크로 덩어리를 묶고, 각 덩어리의 실제 붉은 픽셀 수·외곽 상자를 잰다.
  const grown = dilate(dilate(dilate(red, w, h), w, h), w, h); // 반경 3 — 획 사이 6px 틈까지 묶는다
  const seen = new Uint8Array(w * h);
  const found: { box: RequirementBox; count: number }[] = [];
  const stack: number[] = [];

  for (let start = 0; start < w * h; start += 1) {
    if (!grown[start] || seen[start]) continue;
    let minX = w;
    let minY = h;
    let maxX = 0;
    let maxY = 0;
    let count = 0;
    stack.push(start);
    seen[start] = 1;
    while (stack.length) {
      const p = stack.pop() as number;
      const x = p % w;
      const y = (p - x) / w;
      if (red[p]) {
        count += 1;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const np = ny * w + nx;
          if (grown[np] && !seen[np]) {
            seen[np] = 1;
            stack.push(np);
          }
        }
      }
    }
    if (count < MIN_RED_PIXELS) continue;
    const bw = maxX - minX + 1;
    const bh = maxY - minY + 1;
    if (Math.max(bw, bh) / Math.min(bw, bh) > MAX_ASPECT) continue;
    if (count / (bw * bh) < MIN_FILL) continue;
    if (bw > w * MAX_SIDE_RATIO || bh > h * MAX_SIDE_RATIO) continue;
    found.push({ box: { x: minX, y: minY, width: bw, height: bh }, count });
  }

  found.sort((a, b) => b.count - a.count);
  const scaleX = width / w;
  const scaleY = height / h;
  const seals = found.slice(0, MAX_SEALS).map(({ box }) => ({
    x: Math.round(box.x * scaleX),
    y: Math.round(box.y * scaleY),
    width: Math.round(box.width * scaleX),
    height: Math.round(box.height * scaleY),
  }));

  return { width, height, grayscale, seals };
};
