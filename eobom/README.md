# 🌿 이어봄 (Eobom) — 디지털 엔딩 & 웰다잉 토탈 케어 플랫폼

> **K-Ending 프로젝트 소스코드 저장소** (React + Vite + TypeScript)

---

## 📁 디렉터리 및 프로젝트 구조

```text
eobom/
├── frontend/                # 🌟 최신 웹사이트 소스코드 (React 18 + Vite 5 + TS)
│   ├── public/              # 이미지 등 정적 리소스
│   ├── src/
│   │   ├── components/      # Header, Sidebar, Footer, FloatingEmergency, LoginModal 등
│   │   ├── pages/           # HomePage, FacilityPage, CounselingPage, DigitalEstatePage 등 6개 화면
│   │   ├── App.tsx          # 앱 메인 엔트리 및 상태/탭 전환 관리
│   │   ├── main.tsx         # React 앱 진입점
│   │   └── index.css        # 글로벌 디자인 시스템 및 CSS 변수
│   ├── index.html           # 앱 HTML 템플릿
│   └── package.json         # 패키지 명세
├── backend/                  # Express + Passport + Prisma 백엔드 API 서버
└── README.md                # 본 안내 문서
```

---

## 🔗 기획서 및 문서 연동 안내

본 소스코드의 **시스템 기획서, 와이어프레임, API 명세서, 서비스 배경 PDF 문서**는 지식/메모리 볼트인 `.harness` 내에 보관되어 있습니다.

* **웹 기획서 및 명세 (HTML)**: [`../.harness/projects/eobom/specs/index.html`](../.harness/projects/eobom/specs/index.html)
* **기획 배경 PDF 문서**: [`../.harness/projects/eobom/`](../.harness/projects/eobom/)
* **프로젝트 컨텍스트 및 할 일**: [`../.harness/projects/eobom/context.md`](../.harness/projects/eobom/context.md)

---

## 🚀 프론트엔드 실행 방법 (Quick Start)

### 1. 프론트엔드 폴더로 이동
```bash
cd eobom/frontend
```

### 2. 개발 서버 실행
```bash
npm run dev
```

### 3. 브라우저 접속
터미널에 표시된 `http://localhost:5173/` 주소로 접속하시면 구현된 최신 웹 앱을 확인하실 수 있습니다.

---

## 🚀 백엔드 실행 방법 (Quick Start)

### 1. 백엔드 폴더로 이동
```bash
cd eobom/backend
```

### 2. 개발 서버 실행
```bash
npm run dev
```

터미널에 표시된 `http://localhost:5000/` 주소에서 API 서버가 기동됩니다.
