# context.md — well-dying-web 프로젝트 컨텍스트

> 이 문서는 `well-dying-web` 프로젝트의 상태와 메타데이터를 관리하는 포인터 파일입니다.

---

## 📍 프로젝트 기본 정보

* **프로젝트명**: 디지털 엔딩 & 웰다잉(Well-Dying) 토탈 케어 정보 플랫폼
* **실제 소스코드 경로**: [`well-dying-web`](../../well-dying-web)
* **최신 웹사이트 구현체**: [`well-dying-web/frontend`](../../well-dying-web/frontend) (React + Vite + TypeScript)
* **기획서 및 명세 문서**: [`specs/`](specs/index.html) (HTML/CSS 시스템 명세 및 와이어프레임)
* **기술 스택**: 
  * Frontend: React 18 + Vite 5 + TypeScript + Lucide Icons
  * Backend: Node.js + Express + TypeScript (예정)
* **현재 진행 단계**: React + Vite 최신 웹 애플리케이션 프론트엔드 6대 영역 및 모달/사이드바 구현 완료

---

## ⏳ 프로젝트 할 일 (TODO)

- [x] `well-dying-web/` 폴더 구조 생성
- [x] HTML 기획서 및 시스템 흐름도 구축 (`specs/` 폴더)
- [x] 프론트엔드 React + Vite 데모 웹페이지 5대 영역 뼈대 스캐폴딩
- [ ] 백엔드 Express API 서버 구축 및 개별 기능 연동 (다음 단계)


---

## 🚧 결정 대기 및 핵심 아키텍처 규칙

* **엔딩노트 열람 권한 이원화 메커니즘**:
  - **생전/응급용 (사전 연명의료 의향서)**: 중태/의식불명 발생 시 의료진 및 지정 대리인(주보호자 SMS 인증)이 생전에 즉시 열람 및 제출 가능 (추후 백엔드 개발 시 `qrcode.react` 라이브러리 또는 보건복지부 국립연명의료관리기관/정부24 API 연동).
  - **사후 전용 (자산 금고 & 유언 메시지)**: 유족의 사망진단서 OCR 인증 및 임종 검증 완료 후 지정 수신인에게 복호화 키 및 메시지 공개.
* **모의 데이터 관리 명과 구조**:
  - 실제 DB/API 데이터와 혼동을 피하기 위해 모든 시연용 모의 데이터는 [`well-dying-web/frontend/src/mockData/`](../../well-dying-web/frontend/src/mockData/) 폴더에 JSON 파일로 모듈화하여 관리.

---

## 📌 주요 히스토리

* **2026-07-29**: 
  - 프로젝트 포인터 생성 및 HTML 기반 기획서 구축 시작.
  - React+Vite 프론트엔드 전체 UI/UX 가로폭 유연화 및 사이드바 정리.
  - 전파용 모의 데이터 `src/mockData/` 전면 확장 (전국 8대 권역 22개 식장/수목장, 10인 전문가, 10개 계정/업체/추모관).
  - **사전 연명의료 의향서 생전 응급 대리인 열람 & 모바일 응급 QR카드** 기획 메커니즘 확정 및 UI 반영.
