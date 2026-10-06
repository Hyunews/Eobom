// docs 06-04 §6.4-9-5 — provider 경계. 업체 선정이 늦어져도 이 경계 위쪽(업로드 UI·검증·파기·
// 고지·초안 합류)은 먼저 세울 수 있고, 나중에 provider를 교체할 때(§6.4-9-8-2 ⓑ 로컬 provider 등)
// 구현체 하나만 바뀐다.
export interface SttProvider {
  // signal — 서버 마감·연결 끊김 때 외부 호출·변환을 멈추기 위해 넘긴다(06-04 §6.4-11-10 시간 제한).
  transcribe(audio: Buffer, mimeType: string, signal?: AbortSignal): Promise<string>;
}
