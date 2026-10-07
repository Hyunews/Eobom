# systems.md — 외부 시스템 명부

> **언제 읽나**: 외부 연동(OAuth·지도·공공데이터·DB·배포)을 건드리기 직전

---

## 1. 인증 (소셜 로그인)

| 시스템 | 상태 | 비고 |
|---|---|---|
| 카카오 OAuth | ✅ 실연동 완료 | Passport 전략, 계정통합(User 1:N SocialAccount) 구현됨 |
| 네이버 OAuth | ✅ 실연동 완료 | 〃 |
| 구글 OAuth | ✅ 실연동 완료 | 〃 |

- 스펙 정본: `docs/00_핵심플랫폼/00-08_소셜로그인_및_계정통합_명세서.md`
- 시크릿: `eobomDev/backend/.env` (→ `security.md` §3)
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

- 🔴 **증상이 코드 버그처럼 보인다** — SDK 초기화 `true`·전송 에러 없음·카드 도착·배포본 지도 정상은 **전부 무죄 증거가 아니다.** 경위 → `_meta/systems_경위.md`.
- ⚠️ **`Kakao.init()`의 `true`는 도메인 등록의 증거가 아니다** — 앱 키를 세팅할 뿐 도메인을 검증하지
  않는다. 검증은 카카오 서버가 공유를 처리할 때 일어난다.
- ⚠️ **이미 보낸 카드는 소급 복구되지 않는다** — 전송 시점에 링크가 굳는다. 등록 후 **새로 보내** 확인할 것.
- 링크용 웹 도메인은 **프론트(`https://eobom.vercel.app`)만** 넣는다. 백엔드는 링크 대상이 아니다.
- 키: `VITE_KAKAO_MAP_KEY`(`eobomDev/frontend/.env`) — 프론트 번들 노출, 도메인제한 필수
  - ⚠️ **지도와 공유는 같은 JavaScript 키**(앱 1개당 1개, 콘솔 키 이름 `Eobom_KakaoMap`은 식별용 라벨일 뿐).
    공유 쪽 코드는 `VITE_KAKAO_JS_KEY`를 읽으므로 **같은 값으로 한 줄 추가**한다(개명 금지 — `KakaoMapModal.tsx:57` 동반 수정 발생).
- 활성화: 카카오 디벨로퍼 > 이어봄앱 > 제품설정 > 카카오맵 > ON (**공유는 별도 활성화·검수 없음**)
- ⚠️ **카드 이미지는 카카오 서버가 직접 가져간다** — `localhost`·사설IP(`192.168.x.x`) URL은 **불가**.
  `OBITUARY_CARD_IMAGE_URL`은 **고정 공개 URL**(Vercel)이어야 한다(`07-03` §3.3-3).
- 🔴 **임시 터널(`trycloudflare.com` 등)은 쓰지 않는다 — 2026-08-20 계획에서 제외.**
  재시작할 때마다 주소가 바뀌어 **카카오 도메인 등록도 `.env`도 조용히 죽는다.**
  로컬은 `config.ts` 폴백(`현재호스트:5000`)을 쓰고, **외부 검증은 실배포로만** 한다.
  (경위 → `_meta/systems_경위.md`)
- 🔴 **카카오 장소검색은 시/도 단위 45건 캡**(15건×3쪽) — 장례식장 정본은 공공 API(§3), 카카오는 보강. 주소→좌표 지오코딩은 캡 없음. 실측 → `_meta/systems_경위.md`.

### 위치(Geolocation) 자동감지 — mkcert 로컬 HTTPS로 검증 가능 ✅

`navigator.geolocation`은 HTTPS/`localhost`에서만 동작 — http면 폴백(광주광산구,
`config.ts` `GEOLOCATION_FALLBACK`, 08-19 서울 서초에서 변경)으로 떨어짐. mkcert 후 5173 확인.
⚠️ 주소창에 `https://` 명시 필수(생략시 거부, 버그아님).

🔄 **2026-09-10 GPS 자동감지 ON**(wt188). 상수가 **둘로 갈렸다** — `LOCATION_FEATURE_ENABLED`(`true`,
`VITE_LOCATION_FEATURE=false`로 되돌림)=기능 / `LOCATION_LEGAL_PUBLISHED`(`false`)=`00-21` 제6장·
`00-19` 제3-6조. 🔴 **구 `LOCATION_BASED_SERVICE_REGISTERED`는 없다** — 코드에서 찾지 말 것.
- 적용: `FacilityPage`(거리 정렬) · 🆕 `PickupPage`(지역 필터 기본값). 🔴 **조문객 화면엔 안 쓴다.**
- 🔴 **좌표를 서버에 저장하지 않는다**(요청 파라미터로만).
- ⚠️ **`getCurrentPosition`에 옵션 필수**(`timeout:8000·maximumAge:300000·enableHighAccuracy:false`).
  timeout 기본이 **무한**이라 팝업을 무시하면 **콜백이 둘 다 안 불려** `위치 확인 중...`에 고정된다
  (목록은 뜨므로 **조용히 반쪽**). ⚠️ **거부는 브라우저가 기억**한다 → `permissions.query`로 `denied` 선판정.
- 🔴 **미신고 처리 기간**이다. 대가·조건 3개는 **`00-21` §0.2-1 정본** — ✅ 3개 다 충족(09-10).
  🔵 **권한 팝업 앞 고지**(`FacilityPage.tsx:294`·`PickupPage.tsx:110`)는 **폴백 배지와 별개**다 —
  배지는 *실패한 뒤*, 고지는 *묻기 전에*. 둘 중 하나를 지우면 조건 2가 깨진다.

## 3. 공공데이터

| 시스템 | 상태 | 비고 |
|---|---|---|
| 🆕 **보건복지부 보건·복지현황 전국 장례식장 현황** (`ODMS_DATA_04_1`) | ✅ **정본(09-09 확정)** | **승인 완료** 2026-08-07~2028-08-07 · 일일 10,000 · **XML 전용** · 기준일 2026-04-01 · **1,080건**. 🔴 신고필증 없이 승인됨 → `01-02` §2.2 |
| e하늘 장례식장 현황 OpenAPI | ❌ **배제** | 위치정보 포함 공공데이터 → 위치정보사업자 신고(방통위) 필요. 사용자가 아직 신고 대상 아님. 🔵 **위 행과 다른 데이터셋** — 이 판정은 그대로 유효 |
| 보건복지부 봉안시설/자연장지 CSV | ✅ 사용 중 | `assets/` 에 원본 보관 |

- 법률 검토 정본: `docs/01_장사시설_매칭/01-02_공공데이터_및_API_상업적_이용_법률_검토서.md`
- ⚠️ **`price`·`religion`·`rating`은 여전히 플레이스홀더**다. 실데이터 착각 금지.
  🔵 **09-09 갱신 — `phone`·`location`·`tags`(공설/사설·운영종류)·`amenities`(식당/매점/주차장/
  유족대기실/장애인편의시설)는 공공 실데이터로 바뀐다**(장례식장 한정). `guests`는 `mtaCnt`/`ehrCnt`가
  빈소수·안치구수인데 🔴 **어느 쪽이 빈소수인지 명세 대조 전까지 채우지 않는다.**
- 🔴 **수신 함정(09-09 겪음)**: `str += chunk`로 이어붙이면 **chunk 경계에서 한글이 깨진다**
  (`전북특별자치도`→`전��…`). `Buffer.concat().toString('utf8')`. **원본 문제가 아니다.**
- ⚠️ **페이지당 500건 상한**(`numOfRows=1000`도 500) · `type=json`은 **에러 응답** → XML 고정.
- 🔴 **고유 관리번호 없음** → `sourceRef`=`시도|시군구|시설명`. 매칭은 **전화 > sourceRef > 이름**
  (카카오=통용명/공공=법인명이라 이름 단독은 431/601).

## 4. 데이터베이스

### 🔴 Supabase 설정 — Data API·RLS는 **끈다** (2026-08-20 결정)

Security 3항목(Data API·자동 테이블 노출·자동 RLS) **전부 OFF**. DB 접근은 Prisma 한 경로뿐이고, 켜면 공개 응답 화이트리스트가 통째로 우회된다. 이유·구조 비교 → `_meta/systems_경위.md`.

- 🔴 **언젠가 Data API를 켜야 한다면 RLS를 먼저 켜라.** 순서가 반대면 테이블이 그대로 열린다.
- ⚠️ 대시보드 로그의 `pg_pgrst_no_exposed_schemas does not exist`는 **정상**(08-27). Data API를 껐으니
  PostgREST 노출 스키마가 0개라 나는 로그다. 🔴 **이걸 없애려고 Data API를 켜지 말 것.**

### 🔴 리전 = Seoul (변경 불가)

`00-17` §3.3 — 국외이전 논점을 만들지 않으려고 서울. 🔴 **Supabase는 생성 후 리전 변경 불가.**


| 항목 | 값 |
|---|---|
| 로컬 컨테이너 | Docker `eobom-postgres` |
| 포트 | **5433** (기본 5432 아님) |
| ORM | Prisma |
| 접속 문자열 | `eobomDev/backend/.env`의 `DATABASE_URL` |

- 모델 37개(10-07) — 전체는 `schema.prisma` · 사전은 `00-05`(자동 생성). `FacilityBooking`은 08-11 삭제됨
- 🔴 **DB 쓰기 전 백업 — `db-safety.md`가 정본**(유실 2회).
- 🔵 **백업**: `powershell -File .harness/tools/backup-db.ps1 -Target local|prod`(08-27 신설 — pg_dump가 이 PC에 없어 Docker로 돈다.
  🔴 `-Target` 필수·기본값 없음, 09-30). `eobomDev/backend/backups/`에 `prod-`/`local-` 접두사로 저장(gitignore).
  `-Target prod`엔 `.env`의 **`BACKUP_DATABASE_URL`** 필요 — `DIRECT_URL`은 로컬 Docker DB이고 폴백하지 않는다.
  🔴 **Supabase 접속 3종**: ✅ **Session pooler `aws-0-ap-northeast-2.pooler.supabase.com:5432`** /
  Direct `db.[ref].supabase.co`는 **IPv6 전용**이라 Docker 해석 실패 / Transaction `:6543`은 pg_dump 불가.
  🔴 pooler 유저명은 **`postgres.[ref]`** — `postgres`면 *"password authentication failed"* 가 떠
  **원인이 비밀번호처럼 보인다**. 🔴 클라이언트 **`postgres:17-alpine`**(15·16은 version mismatch).
  ⚠️ 비밀번호의 `#@/?%:` 는 퍼센트 인코딩(`#`는 뒤가 잘림). ⚠️ 같은 시크릿을 `.env`에 두 벌 두지 말 것.
- 🔴 **새 표에 `createdAt`·`updatedAt`이 있으면 한국 시간 보기 칸 + 트리거를 같이 만든다**(10-01) — 절차 `skills/kst-보기칸-추가.md`. 빠뜨리면 시험이 표 이름을 대며 실패한다.
- 🔴 **로그 표 크기 확인(월 1회 점검 때 · 00-42 §6)**: `SELECT relname, pg_size_pretty(pg_total_relation_size(oid)) AS size, n_live_tup FROM pg_class c JOIN pg_stat_user_tables s ON s.relid=c.oid WHERE relname IN ('AccessLog','ErrorLog','AdminAuditLog');` — Supabase 무료는 DB 500MB, 넘으면 **읽기 전용**이 돼 가입·저장이 멈춘다. **세 표 합계 300MB 넘으면** 유료 전환·보관 단축·외부 이전 중 고른다(10-01 운영 DB 0.03GB).

## 5. 배포

| 대상 | 상태 | 비고 |
|---|---|---|
| 프론트엔드 | ✅ 배포됨 | `https://eobom.vercel.app/` |
| 백엔드 | ✅ **배포됨** (2026-08-20) | `https://eobom-backend.onrender.com` — `/api/health` 200 실측 |
| 저장소 | 🔴 **PUBLIC**(10-07 확인) | `github.com/Hyunews/Eobom` — `security.md` §5 |

- 🔴 **CORS는 허용 목록**(10-01, `00-42` §10) — 기본 `https://eobom.vercel.app` + 로컬 5173(`config/cors.ts`). **Vercel 미리보기 주소·새 도메인에서 API를 부르면 막힌다** → Render 환경변수 `CORS_ORIGINS`에 쉼표로 추가(값을 쓰면 기본 목록을 *대체*하니 운영 주소도 같이 적을 것). 비밀값 아님·`render.yaml`엔 안 넣음(기존 서비스는 대시보드 값이 기준).
- 🔴 **요청 횟수 제한**(같은 IP·메모리·단일 인스턴스): 공개 쓰기 10 · 로그인/갱신 20 · 전체 300 / 분, `/api/health` 제외. 넘으면 429 *"잠시 후 다시 시도해 주세요."* — 경로 목록은 `middleware/rateLimit.ts`(새 공개 POST를 만들면 거기 올릴 것). 로컬 시험 중 429가 나면 1분 기다리거나 서버 재시작.

### 백엔드 배포 — Render 웹서비스 + Supabase DB (2026-08-20 실행)

⚠️ 인프라 전략 정본은 **`docs/00_핵심플랫폼/00-11_백엔드_DB_배포_및_인프라_전략_결정서.md`**.
**DB는 Render Postgres가 아니라 Supabase**(§4) — `render.yaml`의 `databases:` 블록은 제거했다.

- 설정: 레포 루트 `render.yaml`(Blueprint), `eobomDev/backend`가 `rootDir`
- 🔴 **`NODE_ENV=production` + 빌드는 `npm ci --include=dev && npm run build`**(10-01). `NODE_ENV=production`이면
  npm이 devDependencies(`typescript`·`prisma`·`@types/*`)를 빼고 설치해 빌드가 깨진다(`TS5108` — 다른 버전 `tsc`가 잡힘).
  `NODE_ENV`는 빼면 안 된다 — 운영 데모 로그인 차단(`authController.ts` demoLogin)이 이 값으로 동작한다(10-01 운영 403 확인).
- 🔴 **리전 = `oregon`(미국), DB는 서울** — DB 타는 API ~1.5초 + **국외이전 문제**(오픈 블로커 → `pending-approvals.md` 인프라). `render.yaml` `region:`은 생성 후 변경 불가(없으면 조용히 oregon). 실측·판단 → `_meta/systems_경위.md`.
- 🔴 **push해도 운영 DB는 안 바뀐다**(09-30부터) — `start`에서 `prisma migrate deploy`를 뺐다.
  운영 스키마 변경 절차는 **`db-safety.md` §2-1**.
- ⚠️ 무료 웹서비스는 **15분 슬립** — 첫 요청이 수십 초 걸린다(부고 링크 첫 방문자가 그대로 겪는다)
  🆕 10-01 대응: 외부 감시 서비스가 `GET /api/health`(`app.ts:72`)를 **5~10분 간격**으로 호출(사람 설정). 무료 750시간/월 안(무료 서비스 1개일 때만).
  익명 GET 성공이라 접속기록에 안 쌓인다(`00-42` §5.1). 🔴 `/api/health`는 **DB를 안 건드림** → Supabase 무료 **7일 무사용 일시정지**는 못 막는다.
- 🔵 **정정(08-27)**: 암호화 키는 **로컬과 운영이 다른 값**이다(옛 지시 *"같은 값"* 은 폐기).
  같으면 로컬 `.env` 유출 = 운영 데이터 유출. **운영 덤프를 로컬에서 못 여는 것이 정상**이고
  그게 `security.md` §1을 강제한다. 🔴 `render.yaml` 주석도 같이 볼 것.
  ✅ **운영 `ENDING_NOTE_ENCRYPTION_KEY`는 Render 환경변수에 있다**(09-30 사람 확인). 🔴 **Render에만 있으면
  사본 0개** — 서비스·계정을 잃으면 운영 엔딩노트·편지·음성을 **아무도 영원히** 못 연다. 오프라인 사본(비밀번호 관리자 등) 권고.
- **배포 후 잔여**: (1)3사 콘솔 콜백 재등록 (2)Vercel `VITE_BACKEND_URL` + 재배포 (3)시설 시딩
  (4)이미지 스토리지 교체(아래)

### 이미지 저장 — ⚠️ 배포 전 필수 교체 (2026-08-10)

업로드 사진이 백엔드 로컬 디스크(`eobomDev/backend/uploads/`)에 저장된다. Render는 재배포 시 디스크
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
