// docs 06-06 §5 — provider 경계. STT의 SttProvider(sttProvider.ts)와 같은 이유로 분리한다 —
// 업체가 바뀌어도 이 경계 위쪽(업로드 UI·검증·파기·고지·⑨ 합류)은 그대로 둘 수 있다.
//
// box는 P2(요건 확인 F2·F3, 근거 표시)를 위한 자리다 — P1은 text만 쓰고 box는 채워서 넘기기만
// 한다(09-28 사람 지시 — "글자 위치 필드가 오는지만 확인"). CLOVA OCR General 응답은
// `fields[].boundingPoly.vertices`(사각형 네 꼭짓점)로 내려온다 — 실제 호출로 확인한 값은
// 아니고(P0 문서·NCP 콘솔 스펙 기준), 사람과 실호출 검증 시 이 타입과 맞는지 대조할 것.
export interface OcrBoxPoint {
  x: number;
  y: number;
}

export interface OcrLine {
  text: string;
  box: OcrBoxPoint[];
  // P2 §3.1 전문 자서 — 업체가 손글씨/인쇄체 구분을 주면 채운다. CLOVA General은 주지 않아 비어 있다
  // (그러면 요건 확인은 `판단 못 함` 고정).
  handwritten?: boolean;
}

// 이미지 한 장(=쪽 하나)의 인식 결과. width/height는 box 좌표의 기준 = OCR에 실제로 보낸 이미지 크기.
// PDF 쪽은 크기를 알 수 없어 비어 있다(§6-1 — PDF는 사진 표시·테두리 없음).
export interface OcrPage {
  text: string;
  lines: OcrLine[];
  width?: number;
  height?: number;
}

export interface OcrResult {
  text: string;
  lines: OcrLine[];
  pages: OcrPage[];
}

export interface OcrProvider {
  recognize(image: Buffer, mimeType: string): Promise<OcrResult>;
}
