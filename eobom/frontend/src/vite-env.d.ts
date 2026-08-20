/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_KAKAO_MAP_KEY: string;
  // 카카오톡 공유 SDK용(07-03 §3.2). 앱이 하나라 지도 키와 같은 값이지만 용도가 달라
  // 이름을 분리해 둔다 — 나중에 지도와 공유를 다른 앱으로 나눌 때 값만 바꾸면 된다.
  readonly VITE_KAKAO_JS_KEY: string;
  // 비워두면 config.ts가 `현재호스트:5000`으로 폴백한다(로컬 개발 기본값).
  // 백엔드 배포 후 그 주소를 넣는다. ⚠️ 임시 터널 주소를 넣지 말 것 — 재시작 시 죽는다.
  readonly VITE_BACKEND_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
