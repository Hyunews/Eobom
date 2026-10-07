import { randomUUID } from 'crypto';
import type { OcrProvider, OcrResult, OcrLine, OcrBoxPoint, OcrPage } from './ocrProvider';
import { NoRecognizedTextError } from './heavyJob';

// docs 06-06 §4·§5 — NCP CLOVA OCR(General, 글자 추출) 연동. clovaSpeechProvider.ts와 같은
// 인증 방식(Invoke URL + Secret 헤더 하나) — 다만 헤더 이름이 다르다(X-OCR-SECRET).

const FORMAT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/tiff': 'tiff',
  'image/tif': 'tiff',
  'application/pdf': 'pdf',
};

interface ClovaOcrVertex {
  x?: number;
  y?: number;
}

interface ClovaOcrField {
  inferText?: string;
  lineBreak?: boolean;
  boundingPoly?: { vertices?: ClovaOcrVertex[] };
}

interface ClovaOcrImageResult {
  inferResult?: string;
  message?: string;
  fields?: ClovaOcrField[];
}

interface ClovaOcrResponse {
  images?: ClovaOcrImageResult[];
}

export class ClovaOcrProvider implements OcrProvider {
  async recognize(image: Buffer, mimeType: string, signal?: AbortSignal): Promise<OcrResult> {
    const invokeUrl = process.env.CLOVA_OCR_INVOKE_URL;
    const secret = process.env.CLOVA_OCR_SECRET;
    if (!invokeUrl || !secret) {
      throw new Error('CLOVA_OCR_INVOKE_URL / CLOVA_OCR_SECRET이 설정되지 않았습니다.');
    }

    const format = FORMAT_BY_MIME[mimeType.toLowerCase()];
    if (!format) {
      throw new Error(`CLOVA OCR이 지원하지 않는 형식입니다: ${mimeType}`);
    }

    const message = {
      version: 'V2',
      requestId: randomUUID(),
      timestamp: Date.now(),
      images: [{ format, name: 'will-draft' }],
    };

    const form = new FormData();
    form.append('message', JSON.stringify(message));
    // 06-05 clovaSpeechProvider.ts와 같은 이유 — Buffer를 BlobPart로 바로 넘기면 타입이 안 맞아
    // Uint8Array 사본으로 감싼다.
    form.append('file', new Blob([Uint8Array.from(image)], { type: mimeType }), `will-draft.${format}`);

    // NCP 콘솔의 General OCR Invoke URL은 이미 `/general`로 끝난다 — 그대로 붙여 넣어도, 그 앞까지만
    // 넣어도 동작하게 끝 슬래시를 떼고 `/general`이 없을 때만 붙인다(…/general/general 404 → 502 방지).
    const trimmedUrl = invokeUrl.trim().replace(/\/+$/, '');
    const endpoint = trimmedUrl.endsWith('/general') ? trimmedUrl : `${trimmedUrl}/general`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'X-OCR-SECRET': secret },
      body: form,
      signal,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`CLOVA OCR 요청 실패(${res.status}): ${errText.slice(0, 300)}`);
    }

    const data = (await res.json()) as ClovaOcrResponse;
    const images = Array.isArray(data.images) ? data.images : [];
    if (images.length === 0) {
      throw new Error('CLOVA OCR 응답에 인식 결과가 없습니다.');
    }

    const lines: OcrLine[] = [];
    const textParts: string[] = [];
    const pages: OcrPage[] = [];
    let currentLineParts: string[] = [];

    for (const img of images) {
      if (img.inferResult && img.inferResult !== 'SUCCESS') {
        // 글자가 하나도 없는 사진은 CLOVA가 FAILURE + ENGN-001 NO_TEXT로 거절한다(10-07 b13 실측) — 연결 오류가 아니다.
        if (/NO_TEXT/.test(img.message ?? '')) throw new NoRecognizedTextError('사진에서 인식된 글자가 없습니다.');
        throw new Error(`CLOVA OCR 처리 실패: ${img.inferResult} ${img.message ?? ''}`.trim());
      }
      // P2 — 응답의 images[] 하나가 곧 한 쪽이다(PDF는 쪽마다 하나씩 온다). 쪽별로 따로 모은다.
      const pageLines: OcrLine[] = [];
      const pageTextParts: string[] = [];
      for (const field of img.fields ?? []) {
        const text = field.inferText ?? '';
        if (!text) continue;
        const box: OcrBoxPoint[] = (field.boundingPoly?.vertices ?? []).map((v) => ({ x: v.x ?? 0, y: v.y ?? 0 }));
        lines.push({ text, box });
        pageLines.push({ text, box });
        currentLineParts.push(text);
        if (field.lineBreak) {
          textParts.push(currentLineParts.join(' '));
          pageTextParts.push(currentLineParts.join(' '));
          currentLineParts = [];
        }
      }
      if (currentLineParts.length > 0) {
        textParts.push(currentLineParts.join(' '));
        pageTextParts.push(currentLineParts.join(' '));
        currentLineParts = [];
      }
      pages.push({ text: pageTextParts.join('\n').trim(), lines: pageLines });
    }

    const text = textParts.join('\n').trim();
    if (!text) {
      throw new NoRecognizedTextError('사진에서 인식된 글자가 없습니다.');
    }
    return { text, lines, pages };
  }
}
