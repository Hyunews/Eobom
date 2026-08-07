# history.md — 이어봄 프로젝트 주요 진행 이력

> 이 문서는 `eobom` 프로젝트의 과거 세션 진행 이력을 보관하는 아카이브 로그입니다.

---

## 📌 주요 히스토리

* **2026-07-29**: 하네스 연동, HTML 스펙 문서 5종, React+Vite 프론트엔드 구축, 8대 피드백 반영.
* **2026-07-30**: 세션 ID 저장, 소스코드 롤백, 보고서 단일화.
* **2026-07-31**:
  - Domain 01 카카오맵 API 연동 착수 (SDK 로드 → 디벨로퍼 활성화 대기).
  - 실제 장례식장 14개 GPS 데이터 반영 (facilities.json).
  - 360° VR 기능 비활성화 (실제 파노라마 이미지 미확보).
  - 5대 코드 품질 정비: 모달 분리(29KB→15KB), API키 단일화, 하네스 동기화, 스펙 링크 수정, DESIGN.md 정합.
* **2026-08-04**: (harness 외부에서 진행되어 발견) `eobom/backend/` 신규 생성 — 소셜 로그인 API 스캐폴딩, git untracked 상태로 발견. Claude 세션이 재확인 후 인수.
* **2026-08-04~05**: 백엔드 검증(설치/타입체크/API 실호출), 로컬 Postgres 구축, 카카오/네이버/구글 실 OAuth 연동, `docs/00_핵심플랫폼/09` 기반 계정 통합(User 1:N SocialAccount) 구현 완료. 상세 내용은 [`walkthrough.md`](walkthrough.md), 디버깅 로그는 [`claude_tasks.md`](claude_tasks.md) 참고. 다음 세션 연결 작업도 두 문서에 체크리스트로 정리됨.
* **2026-08-05**: `EobomLogo.tsx` 심볼마크를 PM 레퍼런스(`Design_Logo.png`)와 더 가깝게 만들려는 시도(SVG 재작성 v1~v3, PNG 크롭 에셋, 사용자 제공 자동트레이싱 SVG 검토) 진행했으나 전부 원본 대비 만족스럽지 않아 **최초 상태로 롤백**. 원인은 원본이 작은 래스터 이미지뿐이라 정확한 벡터화가 어려움 — PM/디자이너로부터 진짜 벡터 원본(Figma/AI/SVG export) 받으면 재작업 예정. `frontend/public/eobom-logo-lockup.png` 등 관련 산출물 정리 완료.
