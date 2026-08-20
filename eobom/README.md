# 🌿 이어봄 (Eobom) — 소스코드

> 디지털 엔딩 & 웰다잉 토탈 케어 플랫폼. React 18 + Vite 5 + TypeScript / Express + Prisma + PostgreSQL
> **최종 갱신**: 2026-08-20

---

## ⚠️ 먼저 읽을 것 — 두 번 겪은 실장애

| # | 함정 | 결과 |
| :---: | :--- | :--- |
| 1 | **주소창에 `https://`를 명시해야 한다** | `eobom/.certs/`에 mkcert 인증서가 있으면 **백엔드·프론트 모두 HTTPS만 서빙**한다. `http://`로 접속하면 TLS 포트에 평문이 들어가 **`ERR_EMPTY_RESPONSE`** — 버그가 아니다(2026-08-10 실장애) |
| 2 | **DB 포트는 `5433`이다** | 기본값 5432가 **아니다**. Docker 컨테이너가 `5433 → 5432`로 매핑돼 있다 |

두 항목의 정본은 `.harness/systems.md` §1·§4다.

---

## 📁 구조

```text
eobom/
├── frontend/                 # React 18 + Vite 5 + TS
│   ├── public/               # 정적 리소스 (로고, obituary-card.png 등)
│   ├── src/
│   │   ├── components/       # 공통 UI 18개 (Header, Sidebar, KakaoMapModal, LoginModal …)
│   │   ├── pages/            # 화면 16개 (Home, Facility, Counseling, Obituary,
│   │   │                     #           ObituaryLanding, Memorial, Pickup, CareGuide …)
│   │   ├── utils/            # kakaoShare, obituaryCard 등
│   │   ├── config.ts         # 환경변수·상수 (VITE_* 키, 타임아웃)
│   │   ├── App.tsx           # 라우팅 + 레이아웃
│   │   └── index.css         # 디자인 시스템 CSS 변수
│   └── .env.example
├── backend/                  # Express + Passport + Prisma + JWT
│   ├── prisma/
│   │   ├── schema.prisma     # 모델 23개 — DB 스키마 정본
│   │   ├── migrations/       # 🔴 마이그레이션 16개. 이게 있어야 DB 재현이 된다
│   │   └── seed-data/        # 시설 시드 (복지부 CSV·facilities.json)
│   ├── src/
│   │   ├── controllers/      # 도메인별 요청 처리
│   │   ├── routes/           # 라우터
│   │   ├── config/           # prisma, passport, policy, upload
│   │   └── utils/            # crypto(AES-256-GCM), phone, address
│   └── .env.example
└── .certs/                   # mkcert 로컬 HTTPS 인증서 (git 제외)
```

---

## 🚀 처음 세팅하기

### 1. DB 띄우기 (Docker)

```bash
docker ps --filter "name=eobom-postgres"     # 이미 있으면 그대로 사용
```

컨테이너가 없다면 PostgreSQL 15로 만들고 **호스트 포트를 5433**에 맵핑한다.

### 2. 백엔드

```bash
cd eobom/backend
npm install
cp .env.example .env          # 값 채우기 (DATABASE_URL·JWT_SECRET·OAuth 3사)
npx prisma migrate deploy     # 마이그레이션 16개 적용 → 스키마 생성
npx prisma generate
npm run dev                   # https://localhost:5000
```

| 스크립트 | 용도 |
| :--- | :--- |
| `npm run seed` | 시설 시드 (`facilities.json`) |
| `npm run seed:admin` | 운영자 계정 — **공개 가입 API가 없어 이 스크립트로만 만든다** |
| `npm run import:facility-csv` | 복지부 봉안시설·자연장지 CSV 적재 |
| `npm run sync:kakao-funeral` | 카카오 로컬 API로 장례식장 수집 (⚠️ 시/도 45건 캡 — `systems.md` §2) |
| `npm run studio` | Prisma Studio |

> 🔴 **스키마를 바꾸기 전에는 반드시 `pg_dump`.** 2026-08-05에 마이그레이션 실수로
> `User`·`SocialAccount`를 백업 없이 잃은 이력이 있다(`.harness/security.md` §6).

### 3. 프론트엔드

```bash
cd eobom/frontend
npm install
cp .env.example .env          # VITE_KAKAO_MAP_KEY · VITE_KAKAO_JS_KEY
npm run dev                   # https://localhost:5173  ← https 필수(위 함정 #1)
```

> ⚠️ **포트 5173을 지켜야 한다.** 카카오 JS SDK는 **등록된 도메인에서만** 동작한다.
> 좀비 vite 프로세스가 5173을 물고 있으면 5174~로 밀리고 SDK가 거부한다 —
> 등록 도메인 목록은 `.harness/systems.md` §2.

---

## 📚 문서

이 저장소는 소스코드와 기획 문서가 함께 있다. **코드를 고치기 전에 해당 도메인 문서를 먼저 본다.**

| 대상 | 위치 |
| :--- | :--- |
| **기획 SSOT 목차** | [`../docs/00_DOCS_INDEX.md`](../docs/00_DOCS_INDEX.md) |
| **DB 테이블 사전** | [`../docs/00_핵심플랫폼/00-05_DB_요구사항_및_테이블_사전.md`](../docs/00_핵심플랫폼/00-05_DB_요구사항_및_테이블_사전.md) — `schema.prisma`에서 **자동 생성**(`node .harness/tools/generate-db-doc.js`) |
| **외부 연동 상태** | [`../.harness/systems.md`](../.harness/systems.md) — OAuth·카카오·DB·배포 |
| **지금 할 일** | [`../.harness/memory/context.md`](../.harness/memory/context.md) |
| **에이전트 규칙** | [`../.harness/AGENTS.md`](../.harness/AGENTS.md) |
| 사람이 보는 HTML 보고서 | `../reports/` — 🔴 **git 커밋 제외·로컬 전용**(`docs/`에서 재생성) |

---

## 🔧 스키마를 바꿨다면

```bash
cd eobom/backend
# 0. pg_dump 먼저!
npx prisma migrate dev --name <변경_요약>
node ../../.harness/tools/generate-db-doc.js   # 00-05 테이블 사전 갱신
```

> **`00-05`는 손으로 고치지 않는다.** `schema.prisma`의 주석이 곧 문서의 설명란이므로,
> 설명을 남기려면 **스키마에 주석을 단다.**
