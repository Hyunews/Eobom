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

- 스펙 정본: `docs/00_핵심플랫폼/00-08_소셜로그인_및_계정통합_명세서.md`
- 시크릿: `eobom/backend/.env` (→ `security.md` §3)
- ⚠️ **프로덕션 콜백 URL 미등록** — 백엔드가 아직 배포되지 않아 실서비스 로그인 불가
- ⚠️ **로컬 콜백은 https 필수** — 인증서 존재 시 백엔드가 HTTPS만 서빙(`server.ts`). http로 두면 `ERR_EMPTY_RESPONSE`(08-10 실장애, 해결). 3사 콘솔에 `https://localhost:5000/api/auth/<provider>/callback` 등록 완료.

## 2. 지도 / 위치

| 시스템 | 상태 | 비고 |
|---|---|---|
| 카카오맵 JS SDK | ✅ 활성(08-19 재확인) | 등록 도메인 3건(↓) |
| 카카오 로컬 API(장소검색) | ✅ 사용중 | 시설 데이터 수집에 사용 |
| **카카오톡 공유 JS SDK** | ✅ **동작 확인(08-21)** | 부고장(`07-03` §3.2). `t1.kakaocdn.net/kakao_js_sdk` — **지도(`dapi.kakao.com`)와 별개 스크립트** |

- 🔵 **08-20 갱신 — JavaScript SDK 도메인 3건 등록**(구 "localhost:5173 포트 고정" 제약 해소):
  `https://eobom.vercel.app` · `https://localhost:5173` · `https://192.168.0.111:5173`(LAN 테스트)

### 🔴 카카오 도메인 등록은 **두 군데**다 (2026-08-21, 3일 소요된 함정)

**둘 다 채워야 카톡 공유가 완성된다. 하나만 하면 조용히 반쪽으로 동작한다.**

| 등록 위치 | 무엇을 좌우하나 | 안 하면 |
|---|---|---|
| [앱 설정] > [플랫폼] > Web > **사이트 도메인** | SDK 실행·지도·카드 **전송** | 지도·공유 자체가 안 됨 |
| **제품 링크 관리 > 웹 도메인** | 카드에 **붙는 링크** | 🔴 **카드는 멀쩡히 도착하는데 탭해도 아무 반응 없음** |

- 🔴 **증상이 코드 버그처럼 보인다** — 08-21에 이것 때문에 3일을 코드에서 헤맸다. 진단 전 과정은
  `claude_tasks.md` (20). **아래 4개는 전부 정상으로 나오므로 무죄 증거가 되지 못한다:**
  `isInitialized() === true` · `sendDefault` 에러 없음 · 카드 도착 · **배포본에서 지도 정상 표시**.
- ⚠️ **`Kakao.init()`의 `true`는 도메인 등록의 증거가 아니다** — 앱 키를 세팅할 뿐 도메인을 검증하지
  않는다. 검증은 카카오 서버가 공유를 처리할 때 일어난다.
- ⚠️ **이미 보낸 카드는 소급 복구되지 않는다** — 전송 시점에 링크가 굳는다. 등록 후 **새로 보내** 확인할 것.
- 링크용 웹 도메인은 **프론트(`https://eobom.vercel.app`)만** 넣는다. 백엔드는 링크 대상이 아니다.
- 키: `VITE_KAKAO_MAP_KEY`(`eobom/frontend/.env`) — 프론트 번들 노출, 도메인제한 필수
  - ⚠️ **지도와 공유는 같은 JavaScript 키**(앱 1개당 1개, 콘솔 키 이름 `Eobom_KakaoMap`은 식별용 라벨일 뿐).
    공유 쪽 코드는 `VITE_KAKAO_JS_KEY`를 읽으므로 **같은 값으로 한 줄 추가**한다(개명 금지 — `KakaoMapModal.tsx:57` 동반 수정 발생).
- 활성화: 카카오 디벨로퍼 > 이어봄앱 > 제품설정 > 카카오맵 > ON (**공유는 별도 활성화·검수 없음**)
- ⚠️ **카드 이미지는 카카오 서버가 직접 가져간다** — `localhost`·사설IP(`192.168.x.x`) URL은 **불가**.
  `OBITUARY_CARD_IMAGE_URL`은 **고정 공개 URL**(Vercel)이어야 한다(`07-03` §3.3-3).
- 🔴 **임시 터널(`trycloudflare.com` 등)은 쓰지 않는다 — 2026-08-20 계획에서 제외.**
  재시작할 때마다 주소가 바뀌어 **카카오 도메인 등록도 `.env`도 조용히 죽는다.**
  실제로 08-19~20 사이 `VITE_BACKEND_URL`이 터널을 가리키고 있었고, 프론트 `.env`에서 제거했다.
  로컬은 `config.ts` 폴백(`현재호스트:5000`)을 쓰고, **외부 검증은 실배포로만** 한다.
  (`00-07` §도 Cloudflare Tunnel을 *"개발 서버가 진짜 인터넷에 노출되는 위험"* 으로 이미 지적)
- ⚠️ 시/도단위 검색시 45건캡으로 일부지역 누락. 전수수집은 시/군/구 재검색 필요.
- 🔴 08-19: 좀비 vite가 5174~5177 점유→dev서버 밀림→미등록포트라 SDK거부. `netstat`+`taskkill`로
  정리, 재발시 5173 비었는지 먼저 확인.

### 위치(Geolocation) 자동감지 — mkcert 로컬 HTTPS로 검증 가능 ✅

`navigator.geolocation`은 HTTPS/`localhost`에서만 동작 — http면 폴백(광주광산구,
`config.ts` `GEOLOCATION_FALLBACK`, 08-19 서울 서초에서 변경)으로 떨어짐. mkcert 후 5173 확인.
⚠️ 주소창에 `https://` 명시 필수(생략시 거부, 버그아님).

## 3. 공공데이터

| 시스템 | 상태 | 비고 |
|---|---|---|
| e하늘 장례식장 현황 OpenAPI | ❌ **배제** | 위치정보 포함 공공데이터 → 위치정보사업자 신고(방통위) 필요. 사용자가 아직 신고 대상 아님 |
| 보건복지부 봉안시설/자연장지 CSV | ✅ 사용 중 | `assets/` 에 원본 보관 |

- 법률 검토 정본: `docs/01_장사시설_매칭/01-02_공공데이터_및_API_상업적_이용_법률_검토서.md`
- ⚠️ 위 배제로 **Facility 가격·종교·하객수·평점은 전부 플레이스홀더**다. 실데이터 착각 금지.
- ⚠️ CSV 원본 오류(전남광주 45건) 2026-08-05 수정 완료. 재수집 시 재발 확인.

## 4. 데이터베이스

### 🔴 Supabase 설정 — Data API·RLS는 **끈다** (2026-08-20 결정)

Security 3항목(**Data API · 자동 테이블 노출 · 자동 RLS**)을 **전부 OFF**로 두었다. 생성 화면의 경고
*"Client libraries need Data API…"* 는 **무시해도 된다** — `supabase-js` 의존성·호출 0건(08-20 실측)이고
DB 접근은 **Prisma 한 경로**뿐이다. RLS는 Data API를 막는 장치라 그게 꺼지면 보호 대상 자체가 없다.

- **구조가 다르다**: 이어봄은 `브라우저 → Express → Prisma → Postgres`이고, Data API는
  `브라우저 → PostgREST → Postgres`다. 인증도 Passport+JWT 자체 구현이라 Supabase Auth를 안 쓴다.
- ⚠️ **Data API를 켜면 공개 응답 화이트리스트가 통째로 우회된다** — `05-01` §4.1·`07-03` §5.3이
  일부러 뺀 `deceasedBirthDate`·암호화 계좌 필드까지 REST로 조회 가능해진다.
- 🔴 **언젠가 Data API를 켜야 한다면 RLS를 먼저 켜라.** 순서가 반대면 테이블이 그대로 열린다.
- ⚠️ 대시보드 로그의 `pg_pgrst_no_exposed_schemas does not exist`는 **정상**(08-27). Data API를 껐으니
  PostgREST 노출 스키마가 0개라 나는 로그다. 🔴 **이걸 없애려고 Data API를 켜지 말 것.**

### 🔴 리전 = Seoul (변경 불가)

`00-17` §3.3 — *"해외 리전이 위법이라서"가 아니라 **논점 자체를 만들지 않으려고**"*.
서울이면 개인정보처리방침의 국외이전 공개 항목이 아예 필요 없어진다.
**Supabase는 프로젝트 생성 후 리전을 바꿀 수 없다.**


| 항목 | 값 |
|---|---|
| 로컬 컨테이너 | Docker `eobom-postgres` |
| 포트 | **5433** (기본 5432 아님) |
| ORM | Prisma |
| 접속 문자열 | `eobom/backend/.env`의 `DATABASE_URL` |

- 주요 모델: `User`·`Facility`·`FacilityBooking`·`Partner`·`Lead` 등(전체는 `schema.prisma`)
- `Facility` 실데이터 1,552건 적재됨 (서버 페이지네이션 브라우저 검증 완료)
- 🔴 **데이터 유실 2회**(08-05 마이그레이션 · 08-27 정리 스크립트). **DB에 쓰기 전 백업이 규칙이며
  스키마 변경만이 아니다** — 트리거·금지패턴·순서는 **`db-safety.md`가 정본**
- 🔵 **백업**: `powershell -File .harness/tools/backup-db.ps1`(08-27 신설 — pg_dump가 이 PC에 없어 Docker로 돈다).
  `eobom/backend/backups/`에 `prod-`/`local-` 접두사로 저장(gitignore). 운영 백업엔 `.env`의
  **`BACKUP_DATABASE_URL`** 필요 — `DIRECT_URL`은 로컬 Docker DB다.
  🔴 **Supabase 접속 3종**: ✅ **Session pooler `aws-0-ap-northeast-2.pooler.supabase.com:5432`** /
  Direct `db.[ref].supabase.co`는 **IPv6 전용**이라 Docker 해석 실패 / Transaction `:6543`은 pg_dump 불가.
  🔴 pooler 유저명은 **`postgres.[ref]`** — `postgres`면 *"password authentication failed"* 가 떠
  **원인이 비밀번호처럼 보인다**. 🔴 클라이언트 **`postgres:17-alpine`**(15·16은 version mismatch).
  ⚠️ 비밀번호의 `#@/?%:` 는 퍼센트 인코딩(`#`는 뒤가 잘림). ⚠️ 같은 시크릿을 `.env`에 두 벌 두지 말 것.

## 5. 배포

| 대상 | 상태 | 비고 |
|---|---|---|
| 프론트엔드 | ✅ 배포됨 | `https://eobom.vercel.app/` |
| 백엔드 | ✅ **배포됨** (2026-08-20) | `https://eobom-backend.onrender.com` — `/api/health` 200 실측 |
| 저장소 | private | `github.com/Hyunews/Eobom` |

### 백엔드 배포 — Render 웹서비스 + Supabase DB (2026-08-20 실행)

⚠️ 인프라 전략 정본은 **`docs/00_핵심플랫폼/00-11_백엔드_DB_배포_및_인프라_전략_결정서.md`**.
**DB는 Render Postgres가 아니라 Supabase**(§4) — `render.yaml`의 `databases:` 블록은 제거했다.

- 설정: 레포 루트 `render.yaml`(Blueprint), `eobom/backend`가 `rootDir`
- 🔴 **리전 = `oregon`(미국). 백엔드와 DB가 태평양을 사이에 두고 있다**(08-21 실측):
  `/api/health` ~165ms vs **DB 타는 API ~1,500ms**. ⚠️ 리전은 `render.yaml`의 `region:`으로만 정해지고
  **생성 후 변경 불가** — 없으면 조용히 `oregon`이 된다.
  🔴 **성능보다 국외이전이 크다** — `00-17` §3.3이 Supabase를 서울로 잡은 것이 **백엔드가 미국이라
  무효**다(STT 음성도 미국을 먼저 거친다). → `pending-approvals.md` 인프라(오픈 블로커).
  🔵 08-21 판단: 싱가포르로 안 옮기고 국내 전환 시 한 번에.
- ⚠️ 무료 웹서비스는 **15분 슬립** — 첫 요청이 수십 초 걸린다(부고 링크 첫 방문자가 그대로 겪는다)
- 🔵 **정정(08-27)**: 암호화 키는 **로컬과 운영이 다른 값**이다(옛 지시 *"같은 값"* 은 폐기).
  같으면 로컬 `.env` 유출 = 운영 데이터 유출. **운영 덤프를 로컬에서 못 여는 것이 정상**이고
  그게 `security.md` §1을 강제한다. 🔴 `render.yaml` 주석도 같이 볼 것.
- **배포 후 잔여**: (1)3사 콘솔 콜백 재등록 (2)Vercel `VITE_BACKEND_URL` + 재배포 (3)시설 시딩
  (4)이미지 스토리지 교체(아래)

### 이미지 저장 — ⚠️ 배포 전 필수 교체 (2026-08-10)

업로드 사진이 백엔드 로컬 디스크(`eobom/backend/uploads/`)에 저장된다. Render는 재배포 시 디스크
초기화 → **이미지 전부 소실.** 실배포 전 S3 등으로 교체 필수(신규 외부 연동, 승인 필요).
**추모 사진도 여기 묶인다** — 스토리지 교체 전 추모관 오픈 금지(`05-01` §2.6).

## 6. 미구현 / 대기

- **로컬 LAN(폰) OAuth**: 보류(백엔드 배포로 대체) · **제휴 배지 UI**: 필드만 있고 미구현 ·
  **360° VR**: 파노라마 미확보로 비활성화.
- **카카오 연결해제 웹훅**: 카카오에서 직접 해제해도 DB 미반영 — 콘솔 경고 중(08-10).
  `SocialAccount.unlinkedAt` 재사용, 요청 검증은 공식 문서 확인 후.

> 사람 승인 대기 항목(예: 가격비교 docs/13)은 여기 안 적는다 → `pending-approvals.md`가 정본.

---

> **갱신 규칙**: 연동 상태가 바뀌면 `context.md` 블로커 섹션이 아니라 **이 파일을 먼저** 고친다. `context.md`에는 "지금 당장 막고 있는 것"만 한두 줄 남긴다.
