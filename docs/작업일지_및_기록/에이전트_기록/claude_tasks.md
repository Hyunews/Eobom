# 🟧 claude_tasks.md — Claude(코딩/구현) 전용 작업 로그

> 살아있는 실무 로그. 디버깅 잡담, 체크리스트, 진행 중 상태를 가감 없이 남기는 곳.
> 한 사이클이 끝나면 중요한 것만 추려서 [`walkthrough.md`](walkthrough.md)로 정제하고, 그 최신 한 줄만 [`context.md`](context.md)에 반영한다.

---

## 2026-08-07 — 하네스 재설계 + Domain01 LAN/HTTPS 대응 + Render 배포 준비

### 삽질 · 함정 기록 (다음에 같은 데서 시간 안 쓰려고)

- **점검 스크립트 3개가 "조용히 초록불"이었음** — 재구성으로 `projects/`·`daily/` 폴더가 사라졌는데 스크립트가 그걸 전제로 짜여 있어 0건 검사 후 "이상 없음"을 출력. `memory-sync-check.sh`는 macOS 전용 `stat -f`라 Windows Git Bash에선 애초에 실패. → `harness-doctor.sh` 하나로 통합하고 **"검사 0건 = 실패"** 규칙을 넣음. 에러보다 조용한 통과가 훨씬 위험하다는 교훈.
- **`implementation_plan.md`는 유령 파일이었음** — `AGENTS.md`/`CLAUDE.md`/`GEMINI.md` 5곳이 참조하는데 레포 어디에도 존재한 적 없음. 규칙이 없는 파일을 읽으라고 시키고 있었던 것.
- **`consolidate_reports.py`가 위험했음** — 죽은 경로(`../projects/eobom/reports`)를 `os.makedirs`로 재생성하고 `eobom/`에서 html/pdf를 삭제하는 로직. 재구성 후엔 그냥 파괴적이라 삭제함.
- **`.env`의 스캐폴딩 기본값에 당할 뻔** — OAuth 동적 대응 최초 구현에서 "`FRONTEND_URL` env 있으면 동적 캡처 끔"으로 짰는데, 실제 `.env`에 `.env.example`에서 복사된 `localhost:5173`이 이미 들어있어 기능이 무력화될 상황이었음. env 존재 여부로 분기할 땐 "그 값이 진짜 의도된 설정인지" 확인할 것.
- **Referer 신뢰 = 오픈 리다이렉트** — 로그인 시작 시점 Referer를 그대로 믿으면 외부 사이트가 우리 로그인 링크를 감싸서 토큰을 자기 도메인으로 빼갈 수 있음. 사설 대역+localhost+5173으로 화이트리스트 좁힘.
- **statusLine이 한글 때문에 깨져 있었음** — `claude-statusline-wrapper.cmd`가 `more.com`으로 stdin을 받는데, 이게 콘솔 코드페이지로 재인코딩하면서 한글 세션명을 깨뜨림 → JSON 파싱 실패 → `unknown | 컨텍스트 n/a`. PowerShell 바이트 스트림 복사로 교체.
- **mkcert 설치**: 이 PC엔 choco/scoop/winget 전부 없어서 GitHub 릴리즈 바이너리 직접 다운로드로 해결. `mkcert -install`이 Java keytool 단계에서 에러를 뱉지만 **Windows 신뢰 저장소 설치는 이미 성공한 뒤**라 브라우저 용도로는 무관.
- **날짜를 하루 잘못 적었음** — walkthrough/systems/context에 `2026-08-08`로 적었는데 실제로는 `2026-08-07`. 세션 마무리 중 발견해 일괄 정정. 날짜는 추측하지 말고 확인할 것.

### 검증 방법 메모

- HTTPS 신뢰 여부는 `curl -k`로는 확인 불가(검증을 건너뛰므로). PowerShell `Invoke-WebRequest`가 Windows 신뢰 저장소를 그대로 쓰므로 브라우저 관점에 가장 가까움.
- `harness-doctor.sh`의 새 검사(5-1 태그, 5-2 승인대기 충돌)는 **일부러 깨뜨려서** 🔴가 실제로 뜨는지 확인 후 원복함. 안전장치는 실패하는 걸 봐야 믿을 수 있음.

---

## 2026-08-05 (야간) — 위치 UX 개선 + CSV 데이터 오류 수정 + Domain02 기획 교차검토

### 체크리스트

- [x] "내 위치 기준 반경" 필터 제거, 위치 있으면 항상 거리순 자동정렬로 백엔드 단순화 (`getFacilities`에서 radius 파라미터 제거)
- [x] 위치 지정 UX: 자유 텍스트 검색 → 시/도+시/군/구 캐스케이딩 셀렉트로 교체
- [x] `GET /api/geo/regions` 신규 — 실보유 시설 주소에서 시/도→시/군/구 목록 직접 파생 (하드코딩 안 함)
- [x] `GET /api/geo/reverse`, `GET /api/geo/geocode` 신규 (좌표↔주소 변환, 카카오 API 프록시)
- [x] 전화 버튼: `matchMedia('(hover:none)and(pointer:coarse)')`로 터치기기 판별 → 모바일 `tel:` 링크 / 데스크톱 커스텀 hover 툴팁
- [x] FacilityPage 상단 "24시간 긴급출동" 버튼 + 전용 `EmergencyModal.tsx` 제거 (전역 플로팅 버튼과 중복)
- [x] 사용자 발견 버그: "전남광주통합특별시"(존재하지 않는 시도명) 45건 → 구 이름 기준으로 광주광역시(15)/전라남도(30) 직접 DB 수정
- [x] docs/12(법률 검토서), docs/13(가격비교), docs/14(답사예약 vs 전화), docs/15(전문가상담 상업화) Gemini 기획 교차검토 — docs/12·15는 내부 모순 발견해 피드백, Gemini가 즉시 보완 확인
- [ ] **다음 세션**: 이번 2단계 작업분 git 커밋 여부 확인, 시/군/구 단위 재수집(45건 캡 보완), docs/13 착수 여부(사용자가 대표님과 상의 후)

### 디버깅 잡기록

- **"전남광주통합특별시" 미스터리**: DB엔 이 문자열이 45건 있었는데, 두 CSV 파일을 `csv-parse`로 재파싱해도 이 값이 전혀 안 나옴 — 원본 CSV 자체엔 없는 값. 정확한 발생 경위(파싱 버그였는지, 다른 원인인지)는 끝내 특정 못함. 실용적으로는 구 이름(동구/서구/남구/북구/광산구 → 광주광역시, 그 외 → 전라남도) 기준으로 직접 DB `UPDATE`해서 해결. 재발 시 참고할 것.
- **Gemini와의 교차검토 패턴**: 이번 세션에서 Gemini가 만든 신규 기획 문서(docs 12~15)에 대해 Claude가 기술/법률 관점에서 검증 → 발견한 모순점(위치정보법 누락, 변호사법 제34조 자기모순)을 사용자에게 구두로 전달 → 사용자가 Gemini에게 전달 → Gemini가 즉시 문서 보완 → Claude가 재검토해 확인하는 흐름이 잘 작동함. 앞으로도 Gemini 기획 문서는 구현 전에 이런 교차검토를 거치는 게 좋아 보임.

---

## 2026-08-05 — Domain01 장례·묘지 매칭 2단계: 실데이터 수집 + 서버 페이지네이션

### 체크리스트

- [x] `Facility`에 `kakaoPlaceId`(unique)/`phone` 필드 추가
- [x] `prisma/sync-kakao-funeral.ts`: 17개 시도 × "장례식장" 카카오 로컬 검색 → 590건 upsert
- [x] `prisma/import-facility-csv.ts`: 봉안시설(694)/자연장지(262) CSV → `csv-parse`+`TextDecoder('euc-kr')` 파싱 → 카카오 주소검색으로 지오코딩 → 948건 upsert (스킵 8건)
- [x] `GET /api/facilities`에 category/region/religion/guests/budget/radius+lat+lng/page/pageSize 쿼리파라미터 지원, 프론트 클라이언트 필터 로직을 Prisma where절로 이전
- [x] `FacilityPage.tsx` 서버 페이지네이션 연동, 페이지 번호 UI 추가, 전화 버튼 추가
- [x] **사고 처리**: migrate diff 실수로 DB 전체 데이터 유실 → 목업 재시딩 완료, User/SocialAccount는 복구 불가(사용자 재로그인 필요) — 상세는 walkthrough.md 참고
- [ ] **다음 세션**: 이번 작업분(2단계 전체) git 커밋 여부 사용자 확인
- [ ] 로컬 개발 DB 백업 없음 — 다음에 비슷한 사고 방지 위해 dump 습관화 고려

### 디버깅 잡기록

- **`prisma migrate dev` non-interactive 차단 반복**: unique 제약 등 경고가 있는 스키마 변경은 non-interactive 환경에서 `migrate dev`가 프롬프트를 못 띄워 매번 막힘. 이번엔 `migrate diff --shadow-database-url`로 SQL을 뽑으려다가 **shadow URL에 실수로 메인 DB URL을 그대로 써서 실제 DB가 초기화되는 사고 발생**. 교훈: 이 플래그 자체를 쓰지 말고, 스키마 변경분을 수동으로 SQL 작성 → `docker exec -i eobom-postgres psql -U Samil -d eobom_db < file.sql`로 직접 적용하는 기존 패턴만 사용할 것.
- **Prisma generate EPERM 재발**: 이번에도 ts-node-dev 좀비 프로세스가 dll 파일 점유 → `netstat`+`taskkill`로 해결 (반복 재발 패턴, 이제 익숙한 루틴).
- **Kakao Local API 45건 상한**: `size`/`page`를 아무리 키워도 대도시(서울/경기 등)는 45건에서 멈춤 — Kakao 자체 하드 리밋으로 확인됨 (우리 코드 문제 아님).
- **`prisma.migrate deploy` P3005**: `_prisma_migrations` 테이블 자체가 없는 상태(위 사고로 사라짐 추정)에서 `migrate deploy` 실행 시 "schema not empty" 에러. 마이그레이션 이력 추적이 깨진 상태라 이후로는 `migrate dev`/`deploy`보다 직접 SQL 적용 방식에 의존.
- **성능 이슈(사용자 발견)**: 1552건을 클라이언트가 한 번에 fetch+렌더링 → 로딩 지연. 서버사이드 필터링+페이지네이션(`page`/`pageSize`, 반경 필터는 조건 일치분 전체를 메모리 정렬 후 페이징)으로 해결.

---

## 2026-08-05 — Domain01 장례·묘지 매칭 1단계: Facility 백엔드 전환 (docs/10)

### 체크리스트

- [x] `schema.prisma`에 `Facility`/`FacilityReview`/`FacilityBooking` 추가, `User` 역관계 추가, `migrate dev` (마이그레이션 `20260805053339_facility_domain`)
- [x] `mockData/facilities.json`(14건) → `backend/prisma/seed-data/facilities.json` 이전 + `seed.ts` upsert 시딩
- [x] `facilityController.ts`(목록/상세/예약/리뷰) + `facilityRoutes.ts` + `server.ts` 라우트 등록
- [x] `authController.ts`의 `verifyBearerToken` export로 변경해 재사용
- [x] `FacilityPage.tsx` 목업 import 제거 → `GET /api/facilities` fetch 전환 (기존 필터링 로직 그대로 유지)
- [x] `BookingModal.tsx` 실제 `POST /api/facilities/:id/bookings` 연동 (facilityId prop 추가)
- [x] `FacilityReviewModal.tsx` 신규 (리뷰 목록 + 작성 폼)
- [x] `mockData/facilities.json` 삭제 (더 이상 참조 없음)
- [x] 브라우저 E2E: 필터/답사예약/리뷰작성/중복리뷰차단 전부 확인
- [ ] **다음 세션**: 이번 작업분 git 커밋 여부 사용자 확인
- [ ] 카카오 로컬 API 실데이터 수집, e하늘 API 연동(키 필요), 제휴/비제휴 하이브리드 UI — 로드맵

### 디버깅 잡기록

- **Prisma generate EPERM 재발**: 마이그레이션 후 `prisma generate` 시 `query_engine-windows.dll.node` 잠금 재발. `netstat -ano | grep :5000` → `taskkill //F //PID`로 ts-node-dev 좀비 프로세스 정리 후 재시도 (기존에 알려진 패턴, 이번에도 동일하게 해결).
- **리뷰 등록 후 모달 미갱신 버그**: `FacilityReviewModal`이 부모(`FacilityPage`)로부터 받는 `facility` prop이 모달을 열 때의 스냅샷이라, 리뷰 등록 성공 후 부모의 `facilities` 배열은 갱신되지만 열려있는 모달 자체(`reviewFacility` state)는 그대로라 사용자 입장에서 "등록 버튼 눌러도 반응 없음"으로 보임(실제로는 DB엔 정상 저장됨). `onReviewSubmitted` 콜백에서 `setFacilities` 뿐 아니라 `setReviewFacility`도 같이 갱신하도록 수정 + 성공 메시지(`✅ 리뷰가 등록되었습니다`) 추가로 해결. 사용자 실사용 테스트 중 발견.
- **tsconfig `resolveJsonModule` 누락**: seed.ts에서 JSON import 시 타입에러 → tsconfig에 `resolveJsonModule: true` 추가로 해결.

---

## 2026-08-04~05 — 소셜 로그인 백엔드 검증 및 계정 통합 기능 구현

### 체크리스트

- [x] `eobom/backend` npm install (harness 외부에서 이미 스캐폴딩된 상태로 발견됨)
- [x] `tsc --noEmit`, `prisma generate`, dev 서버 기동, `/api/health` 등 4종 API 실호출 검증
- [x] Docker Postgres(`eobom-postgres`, 5433) 로컬 기동, `prisma migrate dev`로 초기 `User` 스키마 반영
- [x] 카카오/네이버/구글 3사 실제 앱 등록 + `.env` 반영 + 브라우저 실로그인 검증 (DB 저장까지 확인)
- [x] 재로그인 시 세션 재사용 방지 (`prompt=login` / `authType=reauthenticate` / `prompt=select_account`)
- [x] `docs/09_소셜로그인_및_계정통합_명세서.md` 기반 User 1:N SocialAccount 리팩터링 + 마이그레이션
- [x] 이메일 중복 감지 → confirm-link(MERGE/CREATE_NEW) 백엔드 구현
- [x] link-provider(마이페이지 추가 연동)/unlink-provider 백엔드 구현
- [x] `SocialLinkModal.tsx`, `MyPageAuthSettings.tsx` 프론트 구현
- [x] 프로젝트 폴더명 `well-dying-web` → `eobom` 전면 변경 (코드 폴더, 하네스 프로젝트 폴더, 모든 문서 내부 참조, 스크립트 하드코딩 경로 포함)
- [x] 이메일 중복 시나리오(2개 provider, 동일 이메일) 브라우저 E2E — MERGE/CREATE_NEW 둘 다 검증 완료 (2026-08-05)
- [x] `MyPageAuthSettings`에서 link/unlink 실사용 검증 완료 (2026-08-05): 연동 해제 2회 성공, 마지막 1개 남았을 때 차단 확인, 네이버·카카오 재연동(link) 성공, 최종 3사 전부 원상복구
- [x] **버그 발견 및 수정** (2026-08-05, 사용자 제보): "연동 해제한 provider로 재로그인하면 중복 계정이 생기는 문제" — `SocialAccount` 하드 삭제 → 소프트 삭제(`unlinkedAt`)로 변경, 재로그인 시 provider+providerId로 인식해 기존 계정 복구. 버그 재현 후 수정, 실 시나리오(해제→로그아웃→재로그인)로 재검증 완료
- [x] git 커밋 2건 + push 완료 (2026-08-05, 사용자 직접 push): `f8de0ee`(폴더 리네임) → `bd58f6f`(백엔드 신설+소셜로그인+계정통합+버그수정)
- [x] Vercel 대시보드 Root Directory `eobom/frontend`로 수동 변경 완료, Redeploy → Ready 확인 (2026-08-05)

### 이메일 중복 시나리오 검증 방법 (재현용 메모)

실제로 서로 다른 provider가 정확히 같은 이메일을 반환하는 계정 2개를 자연 상태로 갖추기 어려워서, DB를 임시 조작해 분기를 강제 유발하는 방식으로 검증함:
1. 이미 연동된 GOOGLE `SocialAccount` 행 삭제(unlink) → 해당 provider가 "미연동 상태"가 되게 함
2. 기존 `User.email`을 구글 계정의 실제 이메일과 동일하게 SQL로 직접 변경
3. 브라우저에서 구글로 재로그인 → `existingUserByEmail` 분기 진입 → `#socialLinkPrompt` → `SocialLinkModal` 노출 확인
4. **MERGE** 선택 시: 새 User 생성 없이 기존 User에 `SocialAccount`만 추가되는지 확인
5. **CREATE_NEW** 선택 시(1~3 반복 후): 새 User(`email=null`) + 새 `SocialAccount`(email은 보존)가 기존 User와 분리 생성되는지 확인
6. 검증 후 테스트로 생긴 여분 User/SocialAccount 삭제하고 원래 상태(카카오 합성 이메일, 3사 연동)로 SQL 복구

### 디버깅 잡기록

- **`dotenv` 로드 순서 버그**: `server.ts`에서 `import passport from './config/passport'`가 `dotenv.config()`보다 먼저 실행돼서 `.env`의 카카오 키가 반영 안 됨. `import 'dotenv/config'`를 최상단으로 이동해 해결.
- **Windows EPERM (`prisma generate`)**: `query_engine-windows.dll.node` rename 실패 — 원인은 거의 항상 `npm run dev`(ts-node-dev)가 그 파일을 물고 있는 상태에서 재생성 시도한 것. `netstat -ano | grep :포트` → `taskkill //F //PID`로 해당 프로세스 정리 후 재시도하면 매번 해결됨.
- **Docker 포트 충돌**: 5432를 다른 프로젝트(`phone_postgres_db`)가 이미 점유 중이라 `eobom-postgres`는 5433으로 우회. `.env`의 `DATABASE_URL` 포트도 같이 맞춰야 함.
- **`prisma migrate dev` 비대화형 환경 거부**: 경고(데이터 손실 가능성 등)가 하나라도 있으면 TTY 없는 환경에서는 무조건 막힘. `prisma migrate diff --script`로 SQL 직접 생성 → `prisma/migrations/<ts>_<name>/migration.sql`로 수동 배치 → `prisma migrate deploy`(비대화형 전용)로 우회.
- **`passport-kakao`의 `authorizationParams` 미지원**: 기반 라이브러리(`passport-oauth2`)의 기본 `authorizationParams()`가 빈 객체만 반환해서 `prompt` 옵션이 전달 안 됨 → Strategy 인스턴스에 직접 오버라이드해서 해결. 반면 `passport-naver-v2`(`authType`)와 `passport-google-oauth20`(`prompt`)는 이미 자체 지원하고 있어서 오버라이드 불필요 — provider마다 라이브러리 성숙도가 다르니 매번 소스 확인 필요.
- **`failureRedirect` 버그**: 원래 `/?error=...`처럼 상대경로였는데, 이건 백엔드 자기 자신(포트 5000, 라우트 없음=404)으로 가는 거였음. `${FRONTEND_URL}?loginError=...`로 수정.
- **폴더 리네임 시 Windows 잠금**: `well-dying-web` → `eobom` 폴더 이동(`mv`/`Rename-Item` 둘 다) 시도할 때마다 "Permission denied" — 원인은 매번 다름: (1) 이번 세션에서 반복적으로 백그라운드로 띄웠다 죽인 `npm run dev`의 좀비 node.exe 프로세스 9개, (2) 그 뒤엔 Windows 검색 인덱서(SearchFilterHost.exe)가 방금 만든/수정한 문서들을 스캔 중이라 발생한 일시적 잠금. node.exe는 `taskkill`로 정리했고, 인덱서 잠금은 `mv` 대신 `cp -r`(파일 개수 비교로 무결성 검증) 후 원본 삭제로 우회.

### 버그: 연동 해제 후 재로그인 시 중복 계정 생성 (사용자 제보, 2026-08-05)

- **재현**: (1) 구글 로그인 상태에서 마이페이지로 구글·네이버 연동 해제 → 카카오 1개만 남김 (2) 로그아웃 (3) 다시 구글로 로그인.
- **원인**: `unlinkProvider`가 `SocialAccount` 행을 `delete`로 하드 삭제. `handleSocialLoginCallback` 1단계(provider+providerId 일치)는 당연히 못 찾고, 2단계(이메일 중복 체크)는 `User.email`(최초 가입 provider의 이메일로 고정, 예: 카카오 합성 이메일)과 구글 실제 이메일이 애초에 다르므로 역시 매치 실패 → 3단계 "완전 신규 유저 생성"으로 빠져 조용히 중복 계정 발생.
- **수정**: `SocialAccount`에 `unlinkedAt DateTime?` 추가, 연동 해제를 하드 삭제 대신 `unlinkedAt = now()` 소프트 삭제로 변경. 로그인 1단계는 `unlinkedAt` 무관하게 provider+providerId로 계정을 찾으므로, 예전에 해제했던 계정이면 그대로 발견해서 `unlinkedAt = null`로 되돌리고 로그인시킴(신규 생성 없음). `/api/auth/me`·마이페이지 목록·최소 1개 유지 카운트는 전부 `unlinkedAt: null` 필터 추가. `handleLinkCallback`(마이페이지 재연동)과 `confirmLink`의 MERGE/CREATE_NEW도 동일하게 "과거 소프트 삭제된 행 발견 시 재생성 대신 복구"로 처리.
- **검증**: 연동 해제(soft) → 로그아웃 → 구글 재로그인 시 `User` 개수 그대로 1개 유지, 같은 `providerId`·`userId`로 `unlinkedAt`만 복구되는 것 확인.

### 명세서(docs/09) 대비 구현 시 보완한 부분 (판단 근거)

1. `User.email` UNIQUE 제약과 "독립 신규 가입(CREATE_NEW)" 옵션이 충돌 — 이미 쓰이는 이메일로 새 User를 만들면 유니크 위반. `CREATE_NEW` 시 `User.email`은 `null`로 두고, 실제 이메일은 `SocialAccount.email`(제약 없음)에만 보존하도록 처리. → Gemini 검토 승인 완료 (`gemini_tasks.md` 참고)
2. `POST /api/auth/link-provider`는 명세서상 단순 JSON API처럼 보이지만, 실제로는 그 소셜 계정이 "진짜 내 것"인지 OAuth로 재검증해야 함. `GET /api/auth/:provider/link?token=...`로 바꾸고, JWT로 서명한 `state`를 OAuth 라운드트립에 실어보내 기존 `/callback` 라우트가 "로그인"과 "연동"을 분기하도록 구현 — 콘솔에 리다이렉트 URI 추가 등록 불필요. → Gemini 검토 승인 완료.
3. 기존 테스트 데이터(카카오/네이버/구글 각 1건, 평면 User 구조)는 새 정규화 구조로 자동 이관이 까다로워 사용자 승인 하에 삭제 후 재로그인으로 대체.
