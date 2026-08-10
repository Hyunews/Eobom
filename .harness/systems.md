# systems.md — 외부 시스템 명부

> **언제 읽나**: 외부 연동(OAuth·지도·공공데이터·DB·배포)을 건드리기 직전
>
> 여기저기 흩어져 있던 "이건 왜 안 되지" 항목을 한 곳에 모은 명부. 연동 상태가 바뀌면 **여기를 먼저 고친다.**

---

## 1. 인증 (소셜 로그인)

| 시스템 | 상태 | 비고 |
|---|---|---|
| 카카오 OAuth | ✅ 실연동 완료 | Passport 전략, 계정통합(User 1:N SocialAccount) 구현됨 |
| 네이버 OAuth | ✅ 실연동 완료 | 〃 |
| 구글 OAuth | ✅ 실연동 완료 | 〃 |

- 스펙 정본: `docs/00_핵심플랫폼/09_소셜로그인_및_계정통합_명세서.md`
- 시크릿: `eobom/backend/.env` (→ `security.md` §3)
- ⚠️ **프로덕션 콜백 URL 미등록** — 백엔드가 아직 배포되지 않아 실서비스 로그인 불가
- ⚠️ **로컬 콜백은 https 필수** — mkcert 도입 후 백엔드가 인증서 존재 시 HTTPS만 서빙(`server.ts`). http로 두면 인증 후 리다이렉트가 TLS 포트에 평문으로 들어가 `ERR_EMPTY_RESPONSE`(2026-08-10 실장애, 해결됨) — 3사 콘솔에 `https://localhost:5000/api/auth/<provider>/callback` 등록 완료.

## 2. 지도 / 위치

| 시스템 | 상태 | 비고 |
|---|---|---|
| 카카오맵 JS SDK | ✅ 활성 (2026-08-07 확인) | 등록 도메인에 로컬 LAN IP 추가함 (기존엔 localhost만 등록돼 있었음) |
| 카카오 로컬 API (장소검색) | ✅ 사용 중 | 시설 데이터 수집에 사용 |

- 키: `VITE_KAKAO_MAP_KEY`(`eobom/frontend/.env`) — 프론트 번들 노출, 도메인 제한 필수
- 활성화: 카카오 디벨로퍼 > 이어봄 앱 > 제품 설정 > 카카오맵 > ON
- ⚠️ **수집 한계**: 시/도 단위 검색 시 45건 API 캡으로 일부 지역 누락. 전수 수집은 시/군/구 단위 재검색 필요.

### 위치(Geolocation) 자동감지 — mkcert 로컬 HTTPS로 로컬 검증 가능해짐 ✅

브라우저 `navigator.geolocation`은 보안 컨텍스트(HTTPS/`localhost`)에서만 동작 — LAN IP를 http로
접속하면 차단되어 폴백(서울 서초, `frontend/config.ts`의 `GEOLOCATION_FALLBACK`)으로 떨어짐.
mkcert 도입 후 `https://localhost:5173`·`https://192.168.0.111:5173`에서 정상 동작 확인 완료.
⚠️ 주소창에 `https://` 반드시 명시(생략 시 http 시도 → 서버 거부, 버그 아님). 북마크 권장.

## 3. 공공데이터

| 시스템 | 상태 | 비고 |
|---|---|---|
| e하늘 장례식장 현황 OpenAPI | ❌ **배제** | 위치정보 포함 공공데이터 → 위치정보사업자 신고(방통위) 필요. 사용자가 아직 신고 대상 아님 |
| 보건복지부 봉안시설/자연장지 CSV | ✅ 사용 중 | `assets/` 에 원본 보관 |

- 법률 검토 정본: `docs/01_장례_묘지_매칭/12_공공데이터_및_API_상업적_이용_법률_검토서.md`
- ⚠️ 위 배제로 **Facility 가격·종교·하객수·평점은 전부 플레이스홀더**다. 실데이터 착각 금지.
- ⚠️ CSV 원본 오류(전남광주 45건) 2026-08-05 수정 완료. 재수집 시 재발 확인.

## 4. 데이터베이스

| 항목 | 값 |
|---|---|
| 로컬 컨테이너 | Docker `eobom-postgres` |
| 포트 | **5433** (기본 5432 아님) |
| ORM | Prisma |
| 접속 문자열 | `eobom/backend/.env`의 `DATABASE_URL` |

- 주요 모델: `User`·`Facility`·`FacilityBooking`·`Partner`·`Lead` 등(전체는 `schema.prisma`)
- `Facility` 실데이터 1,552건 적재됨 (서버 페이지네이션 브라우저 검증 완료)
- ⚠️ 2026-08-05 마이그레이션 실수로 데이터 유실 사고 有. 스키마 변경 전 `pg_dump` 필수(→ `security.md` §6)

## 5. 배포

| 대상 | 상태 | 비고 |
|---|---|---|
| 프론트엔드 | ✅ 배포됨 | `https://eobom.vercel.app/` |
| 백엔드 | 🟡 **배포 준비 완료, 미실행** | Render 선택함(→ 아래). `render.yaml` 작성 완료, 사용자가 대시보드에서 Blueprint 생성 필요 |
| 저장소 | private | `github.com/Hyunews/Eobom` |

### 백엔드 배포 — Render (2026-08-07 결정)

**사용자 결정: 우선 Render 무료 티어로 배포, Oracle Cloud 등 다른 대안은 추후 재검토.**

- 설정: 레포 루트 `render.yaml`(Blueprint) — `eobom/backend`가 `rootDir`, Postgres 포함
- 도메인 고정: `https://eobom-backend.onrender.com`(render.yaml `name` 필드)
- ⚠️ **무료 Postgres 30일 후 만료**(14일 유예, 백업 없음) — ~2026-09-07 결정 필요, pending-approvals.md 등록됨.
- ⚠️ 무료 웹서비스는 15분 미사용 시 슬립.
- 배포 후: (1) 3사 콘솔 콜백 재등록 (2) Vercel env `VITE_BACKEND_URL` (3) 시설 시딩(`npm run seed`) (4) 이미지 스토리지 교체(위 참고).

### 로컬 LAN(폰 실기기) OAuth — 백엔드 배포로 대체됨

PC/폰 다른 네트워크라 보류(2026-08-07). 동적 IP 코드는 구현 완료, 배포되면 무의미해짐.

### 시설 이미지 저장 — ⚠️ 배포 전 필수 교체 (2026-08-10)

파트너 업로드 사진이 백엔드 로컬 디스크(`eobom/backend/uploads/`)에 저장된다. Render는 재배포 시
디스크 초기화 → **이미지 전부 소실.** 실배포 전 S3 등으로 교체 필수(신규 외부 연동, 승인 필요).

## 6. 미구현 / 대기

- **제휴(`isPartner`) 배지 UI**: 필드는 있으나 최상단 고정·VR 게이팅 미구현.
- **360° VR 뷰**: 파노라마 이미지 미확보로 비활성화(코드 제거됨).
- **카카오 연결해제 웹훅**: 외부(카카오 계정에서 직접 연동해제·탈퇴)에서 끊겨도 DB 미반영 — 카카오 콘솔 경고 중(2026-08-10). `SocialAccount.unlinkedAt` 로직 재사용, 요청 검증은 공식 문서 확인 후 착수.

> 사람 승인 대기 항목(예: 가격비교 docs/13)은 여기 안 적는다 → `pending-approvals.md`가 정본.

---

> **갱신 규칙**: 연동 상태가 바뀌면 `context.md` 블로커 섹션이 아니라 **이 파일을 먼저** 고친다. `context.md`에는 "지금 당장 막고 있는 것"만 한두 줄 남긴다.
