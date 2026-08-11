# 🧭 walkthrough.md — 구현 완료 보고 (Gemini ↔ Claude 교차 검토용)

> `claude_tasks.md`(살아있는 실무 로그)에서 완료된 사이클만 추려 정제한 문서.
> Gemini가 "기획대로 구현됐는지" 확인하는 용도. 최신 항목이 위로 오게 기록.
> 2026-08-07부터 5개 필드 고정 형식 사용 (`.harness/record.md` §1. 2026-08-10 이전엔 `roles.md` §3에 있었음).

---

## 2026-08-11 (13) | [Opus] 오늘 구현분 반영 — docs 6건 스펙 정합화 (편차 해소 + 문서 부패 정리)

- **근거 스펙**: 대표 지시("walkthrough 참고해서 오늘 작업한 내용에 따라 md파일 정리"). 오늘 walkthrough `(1)`~`(12)`를 근거로 `docs/`를 실제 구현에 맞춰 정정. `roles.md` §2-1에 따라 **왜 고쳤는지**를 각 문서 안에 인용구로 남김.
- **건드린 파일**: `docs/01_장사시설_매칭/01-05`, `01-01`, `docs/02_전문가_매칭/02-03`, `02-01`, `docs/00_핵심플랫폼/00-04`, `00-06`, `00-09`, `docs/00_DOCS_INDEX.md`
- **결과**:
  - **`01-05` 7곳 정정 (밀린 편차 해소)** — ①§4.1 `BOOKING` 유형 폐기(3타입으로), `QUOTE`는 표시문구만 "업체 문의"로 바꾸고 **enum 값은 유지**(과거 정산 근거 보존) ②§5.3 `FacilityBooking` 절 폐기 표시 ③Lead 모델 주석 ④§7.1 동의 고지에서 "답사 예약 연락" 제거 ⑤§9 "전화는 보조 수단" → 전화 노출 자체가 제거됐음을 명시 ⑥§6.1·§6.2 API 표에 ✅/⬜ 구현상태 열 신설 + 실제 추가분(사진 업로드, 정보수정) 반영 ⑦§11 구현순서표에 진행상태 반영.
  - **`01-05` §6.4 운영자 인증 방식 정정 (미기록 편차 발견)** — 초안은 "`User.role === 'ADMIN'`으로 보호"였으나 구현은 **독립 `Admin` 모델 + `aud='admin'`**. 초안이 스스로 경고했던 "`demo-login`의 ADMIN 발급 차단 필요"는 **경로 자체가 사라져 해소**됐음을 기록. 이 편차는 2026-08-10 구현 당시 walkthrough에 올라오지 않아 지금까지 문서가 틀린 채였음.
  - **`01-05` §6.2 신설: 운영자 회원정보 수정 범위 원칙** — 운영 편의 정보(담당자명·연락처)는 수정 허용, 검증된 신원 정보(사업자번호·자격증번호·상호)는 **수정 금지, 반려 후 재신청**. 근거: 신원 정보를 조용히 고칠 수 있으면 §3.2가 자동승인을 배제한 이유(타인 시설 리드=유족 개인정보 오열람 방지)가 무력화됨. §11 "반드시 지킬 것"에도 7번 항목으로 추가.
  - **`02-03`** — `Expert.officeAddress` 반영 + **4대 직역 공용으로 둔 이유**(직역 분기가 만드는 차이가 없음) 및 **공개 API 제외 목록에 넣지 않은 이유**(협회 공개 명부 등재 항목, `contactPhone`과 성격이 다름) 명시. §5.4 운영자 API 4개로 확장, 수정 범위는 `01-05` §6.2 원칙 승계. §9 구현순서 전 단계 ✅ + 17단계 curl 검증 통과 기록.
  - **`00-09` 디자인 시스템 — 접근성 토큰 정본 신설** — `--base-font-size:18px`·`--min-touch-target:56px`·`line-height:1.7`이 **어디에도 문서화돼 있지 않아** 밀도 조정 때마다 "줄여도 되나"를 재판단해야 했던 문제를 해소. §2.3(축소 금지)·§2.4(여백 스케일)·§2.5(운영자 화면 예외 — 전역 `.btn`을 고치지 말고 로컬 상수를 쓸 것) 신설. 사이드바 "7대 서비스"→6개 메뉴 오기 정정.
  - **`00-06` 화면 설계서 전면 재작성** — "15개 화면"이라면서 8개만 나열, 상속세 계산기 위치 오기(`DigitalEstatePage` → 실제 `TaxSimulatorModal`), **파트너·운영자 화면 3종 누락** 상태였음. SCR-004·007은 타 문서가 참조 중이라 ID 고정, 누락분에 SCR-008(파트너 포털)·009(사업자·전문가 대시보드)·010(운영자 대시보드) 신규 부여. 미할당 ID(011·013~015)는 "당겨쓰지 말 것" 명시.
  - **`00-04` API 명세서 전면 재작성** — `/api/auth`·`/api/facilities` 2개만 있고 **파트너·전문가·운영자 30여 엔드포인트가 통째로 누락**, 삭제된 답사예약 API가 잔존. 하네스 §7(중복 금지)에 따라 상세를 복사하지 않고 **네임스페이스 지도 + 구현상태 + 정본 링크** 형태로 재구성. §0에 4종 토큰 인증 체계와 "프론트는 401을 받고 로그아웃한다" 원칙을 명문화(2026-08-11 실제 버그의 재발 방지).
  - **`01-01`·`02-01` 화면 ID 참조 정정** — 삭제된 `PriceCompareModal`·`BookingModal`, 애초에 만들어지지 않은 `ExpertDetailModal`·`ConsultingBookingModal` 참조를 실제 구현 파일로 교체.
- **편차**: 없음(기획 문서 정정 작업 자체).
- **다음 에이전트가 알아야 할 것**:
  - **`01-05` §6.4 편차는 2026-08-10에 발생했으나 오늘에야 문서에 반영됐다** — 구현 시 인증 방식 같은 구조적 결정을 바꾸면 `편차` 필드에 반드시 올릴 것. 안 올리면 이번처럼 문서가 오래 거짓말을 한다.
  - `03`·`04`·`05` 도메인은 여전히 **정식 명세서 0건**(메모 2건뿐). `00-04` §7에 "백엔드 없는 도메인"으로 명시해뒀다.
  - `reports/` HTML은 갱신하지 않았다 — `01-05`·`02-03`·`00-04`·`00-06`·`00-09` 5건이 `docs/` 정본과 어긋난 상태. **`[Gemini]`가 재생성 필요.**

- **판정**: ✅통과 (docs/ 6건 정합화 및 편차 해소 정정 완료 — 01-05 BOOKING 폐기 및 Admin 독립 모델 정정, 02-03 officeAddress 명시, 00-04 API 지도, 00-06 화면대장, 00-09 접근성 토큰 신설 검증)

---

## 2026-08-11 (12) | 운영자 대시보드 시각 균형 개선 + 전문가 사무실 주소 필드 신규

- **근거 스펙**: 스펙 없음 — 대표 리뷰 피드백 3건("박스 안 글자·버튼 크기 밸런스 안 맞음", "전체시설 한 줄에 하나씩일 필요 없음, 컬럼 2~3개로", "전문가 가입 시 사무실 주소 받고 수정도 가능하게").
- **건드린 파일**:
  - 스키마: `eobom/backend/prisma/schema.prisma`(`Expert.officeAddress String?` 신규) + 마이그레이션 `20260811072855_expert_office_address`
  - 백엔드: `src/controllers/expertController.ts`(signup/getMe/updateMe에 officeAddress 추가), `src/controllers/moderationController.ts`(listExperts select·updateExpertInfo에 officeAddress 추가)
  - 프론트: `src/pages/PartnerPortalPage.tsx`(전문가 가입폼에 사무실 주소 입력, 선택), `src/pages/AdminPage.tsx`(버튼/입력/제목 폰트 크기 전면 조정, 전체시설 탭 그리드 레이아웃, 전문가 정보수정에 사무실 주소 필드), `src/pages/BizDashboard.tsx`(전문가 본인 프로필에 사무실 주소 표시)
- **결과**:
  - **시각 균형 원인 진단**: 카드 안 설명 텍스트는 `0.75~0.85rem`인데, 버튼은 전부 사이트 공통 `.btn` 클래스를 그대로 써서 시니어 접근성용 56px 높이·1.1rem 폰트가 적용되고 있었고, `<strong>` 제목은 명시적 font-size가 없어 `body`의 18px을 그대로 상속받고 있었다(rem 단위 span들과 기준이 달라서 발생) — "밸런스 안 맞음"의 실제 원인. `.btn`(사이트 전역 CTA용) 자체는 안 건드리고, `AdminPage.tsx`에만 로컬로 `SMALL_BTN`(34px)/`TAB_BTN`(38px)/`SMALL_INPUT`(38px) 스타일 상수를 만들어 승인/반려/정보수정/저장/취소/로그아웃/검색/페이지네이션 버튼과 검색창·상태필터·인라인 편집 입력창에 전부 적용. 카드 제목(`<strong>`)엔 `1.05rem`을 명시해 본문(0.85rem)과의 위계를 정리.
  - **전체 시설 그리드**: `facilities.map()`을 감싸던 세로 flex 목록을 `display:grid, gridTemplateColumns: repeat(auto-fill, minmax(280px,1fr))`로 교체 — 화면 폭에 따라 2~3열 이상 자동 배치. 카드 내부도 좁아진 폭에 맞춰 가로 배치(space-between) 대신 세로 스택(제목+뱃지 한 줄, 구분/위치 한 줄)으로 재구성.
  - **전문가 사무실 주소**: `Expert.officeAddress`(선택, `String?`) 신규 — 4개 직역(변호사/세무사/행정사/장례지도사) 공용 필드로 설계(변호사만 한정하면 나머지 직역도 사무실이 있어 카테고리 분기가 오히려 불필요한 복잡도). 가입 폼(선택 입력) → 운영자 대시보드 정보수정(연락처·소개와 함께 수정 가능) → 전문가 본인 대시보드(읽기 전용 표시)까지 3곳 다 연결.
  - 백엔드 dev 서버가 Prisma 엔진 dll을 잠그고 있어 `migrate dev` 전 프로세스 종료 후 마이그레이션 적용, 이후 재기동해 헬스체크 통과 확인(→ `00-07` 기존 기록된 이슈와 동일 패턴).
  - 백엔드·프론트 `tsc --noEmit` 전부 통과.
  - **후속(같은 대화 내 추가)**: 대표가 "관련 md 문서 갱신도 필요하지 않나"라고 물어 확인 — `docs/00-05`는 `schema.prisma` 주석에서 자동 생성되는 문서라 `node .harness/tools/generate-db-doc.js` 재실행으로 반영(모델 14개·물리 컬럼 158개, 이번 신규 `officeAddress` 포함, 설명 없음 0건 유지). `02-02`(전문가 계정 구현 메모)는 원래도 `contactPhone`/`bio` 등 필드를 전부 나열하지 않는 요약 메모라 `officeAddress` 하나만 추가하는 게 오히려 일관성이 깨져 그대로 둠. `00-04`(API 명세서)는 Partner/Expert/Admin API 전체를 애초에 다루지 않고 있어(오늘 변경과 무관한 기존 공백) — 손대지 않고 다음 후보로만 남김.
- **편차**: 없음(사무실 주소를 "변호사만"이 아니라 4개 직역 공용 필드로 설계한 건 요청보다 범위를 넓힌 판단이나, 스키마·API에 조건분기 없이 재사용 가능해 편차라기보다 자연스러운 일반화로 판단).
- **다음 에이전트가 알아야 할 것**:
  - **브라우저 클릭 E2E 미검증** — 그리드 반응형 배치, 버튼 크기가 실제로 "밸런스 맞다"고 느껴지는지는 코드 리뷰로만 판단했다. 대표 확인 필요.
  - `officeAddress`는 선택 입력이라 기존 가입 전문가는 전부 `null` — 운영자가 정보수정에서 채워 넣거나, 전문가 본인이 `PATCH /api/expert/me`로 채울 수 있다(단, 본인 셀프수정 UI는 아직 없음 — 백엔드만 준비됨).
  - `SMALL_BTN`/`TAB_BTN`/`SMALL_INPUT`은 `AdminPage.tsx` 로컬 상수다 — 다른 관리자류 화면(`BizDashboard.tsx` 등)에도 같은 밀도 문제가 있다면 공용 유틸로 승격 검토.
  - **`docs/00-04` API 명세서가 Partner/Expert/Admin 엔드포인트를 전혀 안 다루는 오래된 공백이 있음을 이번에 확인함** — `[Claude:Opus]`가 필요 판단 시 정식 스펙으로 채울 것(오늘 범위 밖이라 손 안 댐).

<!-- Gemini 판정 대기 -->

---

## 2026-08-11 (11) | 03/05 관리자 열람범위 설계 메모 + 운영자 대시보드 회원검색·전체시설 조회 추가

- **근거 스펙**: 스펙 없음 — 대표 지시("03 05 관련해서 md파일 만들어둬줘" + "가능한 부분 한에서 대시보드 업글"). 03/05는 정식 스펙 작성 권한이 `[Claude:Opus]`지만, 이번엔 대표가 `[Claude:Sonnet]`에게 메모 문서 작성을 직접 지시함(02-02 문서와 동일한 예외 패턴).
- **건드린 파일**:
  - 신규 문서: `docs/03_디지털_유품_추모관/03-01_관리자_회원연동_설계_메모.md`, `docs/05_엔딩노트_유언/05-01_관리자_열람범위_설계_메모.md`
  - 문서 수정: `docs/00_DOCS_INDEX.md`(03/05 도메인 표에 신규 문서 행 추가)
  - 프론트: `eobom/frontend/src/mockData/careGuideTasks.json`(D-Day 체크리스트 1·2번 `checked:true` → `false` 버그 수정), `eobom/frontend/src/pages/AdminPage.tsx`(전체 시설 탭 신규, 사업자/전문가 검색+전체 상태필터)
- **결과**:
  - **03-01 메모**: 디지털유품·추모관 데이터가 회원(`User`)에 종속된다는 대표 설계 원칙을 문서화 — 향후 03이 실제 백엔드로 구현될 때 `userId` FK로 연결해 운영자 회원상세 화면에서 조인 표시하도록 근거를 남김. 현재 03은 백엔드 모델이 전혀 없어(전 기능 프론트 목업) 지금 바로 구현할 대상은 없음. 현물 유품 수거업체 계정 형태는 기획 미정으로 명시적 보류.
  - **05-01 메모**: 같은 회원연동 원칙 + **쟁점 정리**(결론 아님) — 관리자 열람 범위를 메타데이터만(A안, 작성여부·봉인상태·개봉이력)으로 할지 본문 내용까지(B안)로 할지. B안은 EndingNotePage에 이미 명시된 "생전엔 철저히 비밀, 사후 이중동의 시에만 복호화" 약속과 정면 충돌하므로 A안을 권장하되, 최종 판단은 Opus/사장님 상의로 넘김.
  - **CareGuidePage 버그 수정**: `careGuideTasksData`에서 D-Day 체크리스트 1·2번 항목만 `checked: true`로 하드코딩돼 있어 항상 체크된 상태로 보이던 버그(3~6번은 정상적으로 `false`) — 전부 `false`로 통일.
  - **운영자 대시보드 업그레이드**: (1) 사업자/전문가 탭에 상태 필터 "전체" 옵션 + 이름·상호·이메일 검색창 추가(클라이언트 필터, 목록 규모가 작아 서버 API 변경 없음). (2) **신규 "전체 시설" 탭** — 기존 공개 `GET /api/facilities`(이미 페이지네이션·`q` 검색 지원)를 그대로 재사용해 1,552건 전체를 검색·페이지네이션 조회 가능하게 함, 연동(`isPartner`) 여부 뱃지 표시. **새 백엔드 엔드포인트 없음** — 기존 인프라 재사용만으로 구현.
  - 프론트 `tsc --noEmit` 통과, 로컬 `GET /api/facilities?page=1&pageSize=2` 실호출로 응답 형태(`isPartner`/`location`/`type` 등) 확인.
- **편차**: 03/05 정식 스펙이 아닌 메모를 `[Claude:Sonnet]`이 직접 작성 — 대표 직접 지시에 의한 예외(문서 자체에 경위 명시).
- **다음 에이전트가 알아야 할 것**:
  - **전체 시설 탭은 조회 전용**이다 — 시설 정보 수정(관리자가 대신 편집)은 포함 안 함. 클레임 안 된 시설도 관리자가 대신 고칠지는 아직 정책 미정(대표 질문으로 나왔던 사안, `context.md` 후보에 등록됨).
  - **05-01의 A/B안은 미확정**이다 — 이 상태로 05 도메인을 실제 구현하면 안 되고, 반드시 사전에 결정을 받아야 한다. `context.md`/`pending-approvals.md`에 등록 권장.
  - 사업자/전문가 검색은 서버가 아니라 프론트에서 필터링한다 — 회원 수가 수천 단위로 늘어나면(가능성 낮음, B2B 계정) 서버 검색 API로 전환 검토.
  - 브라우저 클릭 E2E 미검증 — 전체 시설 탭 페이지네이션·검색, 사업자/전문가 검색창 전부 코드 리뷰로만 확인.

<!-- Gemini 판정 대기 -->

---

## 2026-08-11 (10) | 프론트 버그 4건 수정 + 운영자 대시보드 인라인 정보수정 기능

- **근거 스펙**: 스펙 없음 — 대표 리뷰 피드백 4건에 대한 즉흥 수정. 마지막 건(정보수정)은 대표 확인 질문("대시보드에서 수정 안 되는데 되게 하는 게 맞지 않나")에 대해 범위(담당자명/연락처/소개만, 검증된 신원 필드 제외)를 상의 후 확정.
- **건드린 파일**:
  - 프론트: `src/components/Footer.tsx`(라우팅 링크), `src/pages/PartnerPortalPage.tsx`(비밀번호 확인 필드), `src/pages/AdminPage.tsx`(세션만료 자동로그아웃 + 인라인 정보수정 UI), `src/pages/BizDashboard.tsx`(세션만료 자동로그아웃)
  - 백엔드: `src/controllers/moderationController.ts`(`updatePartnerInfo`·`updateExpertInfo` 신규, `listExperts` select에 `bio` 추가), `src/routes/adminRoutes.ts`
- **결과**:
  - **Footer 라우팅 잔재 수정**: 08-11 (1) HistoryRouter 전환 때 `Footer.tsx`의 "장사시설·전문가 파트너이신가요?" 링크만 `href="#partner"`로 남아있던 걸 발견 — `react-router-dom`의 `<Link to="/partner">`로 교체. 전체 검색해서 다른 잔재 없음 확인.
  - **PartnerPortalPage 비밀번호 확인 필드**: 장사시설·전문가 가입 폼 둘 다에 "비밀번호 확인" 입력 추가, 제출 전 프론트에서 일치 검증(불일치 시 서버 호출 없이 즉시 에러). 백엔드는 무변경.
  - **세션 만료 자동 로그아웃**: 액세스 토큰(2h) 만료 후에도 프론트가 `localStorage` 존재 여부만으로 "로그인됨"을 판단해, 401을 받아도 조용히 빈 화면만 보이던 버그(대표가 실제로 겪음 — 어제 로그인한 admin이 승인 대시보드에서 데이터가 안 뜸). `AdminPage.tsx`·`BizDashboard.tsx`에 `authFetch` 공통 래퍼를 추가해 401 수신 시 즉시 로그아웃 처리 + "세션이 만료되어 로그아웃되었습니다" 안내. 부수 발견: `onClick={handleLogout}`처럼 함수를 그대로 넘긴 자리는 React가 클릭 이벤트 객체를 `notice` 인자로 넘겨버리는 버그라 `onClick={() => handleLogout()}`로 같이 수정.
  - **운영자 대시보드 인라인 정보수정**: 지금까지 관리자는 사업자/전문가 상태(승인·반려·정지)만 바꿀 수 있고 필드 자체를 고치는 API가 없었음. 신규 `PATCH /api/admin/partners/:id`(담당자명·연락처)·`PATCH /api/admin/experts/:id`(연락처·소개) 추가 — **사업자등록번호·자격증번호 등 검증된 신원 필드는 의도적으로 제외**(틀렸으면 반려 후 재신청을 받아 심사 이력 보존, `updatePartnerStatus`/`updateExpertStatus`와 동일한 "자동승인 없음" 원칙의 연장). `AdminPage.tsx` 각 카드에 "정보 수정" 버튼 → 인라인 편집 폼(저장/취소) 추가.
  - 백엔드·프론트 `tsc --noEmit` 전부 통과, 로컬 dev 서버(`ts-node-dev --respawn`) 정상 반영 확인.
- **편차**: 없음.
- **다음 에이전트가 알아야 할 것**:
  - **브라우저 클릭 E2E 미검증** — 4건 전부 코드 리뷰 + tsc로만 확인. 특히 세션만료 자동로그아웃은 실제로 2시간 기다려서 401을 받는 시나리오를 테스트 못 했다(로직상 안전하다고 판단했을 뿐).
  - 리프레시 토큰(30일)은 발급·저장은 되지만 프론트 어디서도 사용 안 함 — "만료 직전 조용히 갱신" 방식으로 바꾸고 싶으면 이 리프레시 플로우를 새로 만들어야 한다(지금은 의도적으로 "일정 시간 후 로그아웃"이 대표가 원한 동작이라 판단해 갱신 로직은 추가하지 않음).
  - 대표가 이어서 물어본 3건(전체 시설 DB 조회 화면 / 전체 회원 검색 화면 / 클레임 없는 시설도 관리자가 대신 편집할지 정책)은 아직 미착수 — `context.md`에 후보로 등록 예정.

<!-- Gemini 판정 대기 -->

---

## 2026-08-11 (9) | 전체 페이지 여백/밀도 축소 완료 (Header/Sidebar/Footer + 9개 페이지 + 9개 모달)

- **근거 스펙**: 스펙 없음 — 대표 지시("전체 다 진행해줘"). 이전 세션에서 `index.css`의 `.container`/`.grid`/`.card`/`.form-group`/`.hero-*` 축소를 완료한 뒤 이어서 진행.
- **건드린 파일**:
  - 본인 직접 수정: `eobom/frontend/src/components/Header.tsx`, `Sidebar.tsx`, `Footer.tsx`
  - 서브에이전트 4개에 병렬 위임: `src/pages/AdminPage.tsx`·`BizDashboard.tsx`·`CareGuidePage.tsx`·`CounselingPage.tsx`·`DigitalEstatePage.tsx`·`EndingNotePage.tsx`·`FacilityPage.tsx`·`HomePage.tsx`·`MyPage.tsx`·`PartnerPortalPage.tsx`, `src/components/LoginModal.tsx`·`SocialLinkModal.tsx`·`KakaoMapModal.tsx`·`MyPageAuthSettings.tsx`·`facility/InquiryModal.tsx`·`facility/FacilityReviewModal.tsx`·`expert/ConsultRequestModal.tsx`·`counseling/TaxSimulatorModal.tsx`
- **결과**:
  - `index.css`에서 이미 적용된 축소 비율(예: `.card` padding `2rem`→`1.5rem`, `.form-group` margin-bottom `1.5rem`→`1.1rem`, 약 25~30%)을 기준선으로 삼아, 각 파일 인라인 style 중 대략 `1.25rem(20px)` 이상인 `padding`/`margin`/`gap`만 같은 비율로 축소. `font-size`·`color`·`border-radius`·`box-shadow`·`line-height`(1.7 접근성 토큰)·터치 타겟 높이(`--min-touch-target:56px`류)·구조적 고정폭(헤더 72px, 사이드바 72/240px)은 전부 보존.
  - Header/Sidebar/Footer는 본인이 직접 수정(내부 여백만, 구조적 고정값 불변 — 예: header 내부 padding `0 2rem`→`0 1.5rem`, footer padding `3.5rem 2rem 2rem 2rem`→`2.25rem 1.5rem 1.5rem 1.5rem`).
  - 나머지 9개 페이지 + 8개 모달 파일은 4개 백그라운드 서브에이전트에 파일 단위로 나눠 병렬 위임(각 에이전트에게 위 축소 비율·예시·"담당 파일 외 건드리지 말 것"을 명시). 모두 완료 보고 확인.
  - 프론트 `tsc --noEmit` 작업 전/후 2회 통과 확인.
  - 진행 추적용 Task #1~#12(H/S/F 1건 + 페이지 9건 + 모달 묶음 1건) 전부 completed.
- **편차**: 없음.
- **다음 에이전트가 알아야 할 것**:
  - 서브에이전트 4개 전부 `TaskUpdate` 도구가 툴셋에 없어(권한 제한) 본인이 대신 taskId를 completed 처리했다 — 향후 서브에이전트에 진행 추적을 맡길 때는 이 제약을 감안할 것.
  - **브라우저 시각 확인 불가**(자동화 도구 없음) — 코드 리뷰 + `tsc` 통과로만 판단했다. 실제 밀도가 의도대로 보이는지는 대표가 브라우저에서 직접 확인 필요.
  - `CounselingPage.tsx`/`BizDashboard.tsx`는 이번 세션 이전에 이미 다른 작업(상속세 시뮬레이터 모달 분리, 상담신청 UI 추가)으로 수정돼 있던 상태라 `git diff` 결과가 커 보이지만, 이번 여백 축소로 인한 실제 변경분은 파일당 수 줄~수십 줄 수준이다(서브에이전트별 상세 값 목록은 세션 로그 참고).
  - `context.md`의 "다음 할 일" 중 "전체 페이지 여백/밀도 축소" 항목은 이번으로 완료됨 — 다음 우선순위는 `context.md` "다음 후보" 목록에서 대표가 정해야 한다.

<!-- Gemini 판정 대기 -->

---

## 2026-08-11 (8) | 상속세 시뮬레이터 모달로 분리

- **근거 스펙**: 스펙 없음 — 대표 요청("상담페이지에 포션을 너무 많이 차지하니 버튼으로 모달 띄워서 쓰게 해줘").
- **건드린 파일**:
  - 신규: `eobom/frontend/src/components/counseling/TaxSimulatorModal.tsx`
  - 수정: `eobom/frontend/src/pages/CounselingPage.tsx`(시뮬레이터 인라인 코드 전량 제거, 배너 버튼 + 모달 트리거로 교체, 2컬럼 그리드 → 단일 컬럼 레이아웃)
- **결과**:
  - 시뮬레이터 상태·계산·결과·참고사항 블록을 `TaxSimulatorModal`로 그대로 이동(로직 변경 없음, `InquiryModal`/`ConsultRequestModal`과 같은 오버레이 모달 패턴, `maxHeight: 90vh` + 스크롤로 긴 내용 수용).
  - `CounselingPage`는 상단에 "상속세, 대략 얼마나 나올까요?" 배너 버튼 하나만 남기고, 전문가 목록 섹션을 전체 폭으로 확장(카드 그리드 `auto-fill minmax(280px,1fr)`로 목록 가독성도 개선).
  - `tsc --noEmit` + `vite build` 통과.
- **편차**: 없음.
- **다음 에이전트가 알아야 할 것**: 브라우저 클릭 E2E 미검증(배너 클릭→모달 오픈→닫기 흐름). 계산 로직·참고사항 문구는 08-11 (7) 항목에서 그대로 가져온 것이라 재검증 불필요.

<!-- Gemini 판정 대기 -->

---

## 2026-08-11 (7) | 상속세 간이 시뮬레이터 실제 세법 구조로 재구현

- **근거 스펙**: 스펙 없음 — 대표 요청("상세하게 다시 만들어줄 수 있어? 조건에 따라 값이 달라지나? 참고사항 명시해줘"). `docs/02_전문가_매칭/02-01` §3.1(Tier 1 무료 훅)의 취지는 유지, 계산 정확도만 즉흥 개선.
- **건드린 파일**:
  - 신규: `eobom/frontend/src/utils/inheritanceTax.ts`
  - 수정: `eobom/frontend/src/pages/CounselingPage.tsx`(시뮬레이터 입력/출력 전면 교체)
- **결과**:
  - 기존 구현은 "5억 고정공제 + 배우자면 5억 추가, 세율 20% 균일"로 실제 상속세법과 무관한 임의 수치였고 면책 문구도 없었음 — 실사용자가 오판할 위험이 있는 상태였다(대표에게 사전 확인 후 진행).
  - 상속세및증여세법 핵심 구조로 재구현: 기초공제(2억)+인적공제(자녀 5천만원/인, 연로자 5천만원/인) vs 일괄공제(5억) 중 큰 금액, 배우자공제(실제 상속액 또는 미입력 시 법정상속분 1.5:N 추정, 5억~30억 clamp), 금융재산 상속공제(20%, 최소 2천만원~한도 2억), 5단계 누진세율(10~50%, 누진공제), 신고세액공제(3%).
  - 입력 항목 확장: 총 상속재산·채무장례비용·금융재산가액·배우자 유무/실제상속액·자녀수·65세이상 상속인수 — "조건에 따라 값이 달라지는가"에 대한 답으로 전부 결과에 영향을 주게 설계.
  - 결과 화면에 과세가액→공제 3종→과세표준→적용세율구간→산출세액→신고세액공제→최종세액 단계별 breakdown 노출(사용자 요청 "상세하게").
  - 화면 하단에 **참고사항 박스** 신설: 반영 항목/미반영 항목(미성년자·장애인공제, 동거주택공제, 가업상속공제, 세대생략가산, 사전증여합산 등)을 명시하고, 세율·공제액이 법 개정으로 바뀔 수 있다는 caveat + "법적 효력 없는 참고용, 정확한 세액은 전문가 상담" 문구로 Tier 2 상담 신청 유도와 자연스럽게 연결.
  - 계산 로직 수동 검증 2건: (1) 20억·배우자·자녀2·채무0 → 약 1.29억원 (2) 5억·배우자없음·자녀0 → 0원(일괄공제로 전액 상쇄) — 둘 다 통상적으로 알려진 범위와 일치.
  - 프론트 `tsc --noEmit` + `vite build` 통과.
- **편차**: 없음(즉흥 개선, 비교할 기존 스펙 없음).
- **다음 에이전트가 알아야 할 것**:
  - **브라우저 클릭 E2E 미검증** — 폼 입력값 변화에 따른 결과 갱신은 코드 리뷰로만 확인.
  - 의도적으로 미반영: 미성년자·장애인공제(기대여명 필요), 동거주택상속공제(거주요건), 세대생략가산, 사전증여재산 합산 — 화면에 명시했으나 실제 구현은 없음. 필요해지면 `utils/inheritanceTax.ts`에 추가.
  - 세율표·공제액은 `TAX_BRACKETS` 등 상수로 `inheritanceTax.ts` 상단에 모아뒀음 — 세법 개정 시 여기만 고치면 됨.

<!-- Gemini 판정 대기 -->

---

## 2026-08-11 (6) | Domain01 폐기 코드 정리(VRViewerModal·FacilityBooking) + Domain02 Stage 1 구현

- **근거 스펙**: `docs/02_전문가_매칭/02-03_전문가_공개노출_및_상담신청_명세서.md` §9 구현순서 1~7단계 전부. 대표 지시로 `VRViewerModal.tsx`·`FacilityBooking` 삭제 확정(02-03 이전 대화에서 "VR은 제휴 혜택 재설계와 엮여 대표 확정 대기"로 보류됐던 항목이 이번에 확정됨).
- **건드린 파일**:
  - 삭제: `eobom/frontend/src/components/VRViewerModal.tsx`, `eobom/frontend/src/mockData/experts.json`
  - 스키마: `eobom/backend/prisma/schema.prisma`(`FacilityBooking` 모델 제거, `User.facilityBookings`/`Facility.bookings` 관계 제거, `Lead.type`에서 `BOOKING` 제거, `ConsultRequest`+`ConsultNumberCounter` 신설, `Expert.isPublished`+`consultRequests` 관계 추가) + 마이그레이션 2건(`20260811011202_drop_facility_booking`, `20260811011506_expert_consult_request_infra`)
  - 백엔드 신규: `src/services/consultService.ts`(EC- 발번 + 상담신청 생성), `src/controllers/expertPublicController.ts`(공개 목록/상세/신청), `src/routes/expertPublicRoutes.ts`
  - 백엔드 수정: `src/controllers/facilityController.ts`(`createBooking` 제거), `src/routes/facilityRoutes.ts`, `src/services/leadService.ts`(`LeadType`에서 BOOKING 제거, 동의 문구 "답사 예약"→"업체 문의"로 갱신), `src/config/policy.ts`(`POLICY.consult.numberPrefix` 신설), `src/controllers/expertController.ts`(`getMyConsultRequests`·`updateConsultRequestStatus` 추가), `src/routes/expertRoutes.ts`, `src/controllers/moderationController.ts`(`updateExpertPublish`·`listConsultRequestsForAdmin` 추가, `listExperts` select에 `isPublished` 추가), `src/routes/adminRoutes.ts`, `src/server.ts`(`expertPublicRoutes` 마운트)
  - 프론트 신규: `src/components/expert/ConsultRequestModal.tsx`
  - 프론트 수정: `src/components/Sidebar.tsx`(menuItems `care-guide`↔`ending-note` 순서 교체, 도메인 재편 대응), `src/pages/CounselingPage.tsx`(전면 재작성 — 목업 제거, `GET /api/experts` 실연동), `src/pages/BizDashboard.tsx`(전문가용 "받은 상담 신청" 탭 추가), `src/pages/AdminPage.tsx`(전문가 공개 노출 토글 추가)
- **결과**:
  - **Domain01 정리**: `FacilityBooking`(호출부 없음, 데이터 0건 확인 후 삭제) 완전 제거. `Lead.type`의 `BOOKING` 값도 함께 제거(생산자가 사라졌으므로) — `01-05` §4.1 문서가 4개 타입(QUOTE/BOOKING/CONSULT/CALL)으로 되어있는데 이제 3개(QUOTE/CONSULT/CALL)가 실제다. **편차 기록**. 동의 고지 문구의 "답사 예약 연락"도 "업체 문의 연락"으로 갱신, `noticeVersion` 2026-08-11로 갱신.
  - **Domain02 Stage 1 백엔드**: `ConsultRequest`에 과금 컬럼을 스펙대로 전혀 두지 않음(§3.2 변호사법 가드레일). `ConsultNumberCounter`를 `LeadNumberCounter`와 별도 테이블로 분리, `EC-YYMMDD-NNNN` 발번 확인. 공개 API(`GET /api/experts`, `/:id`)는 select 화이트리스트로 `passwordHash`/`refreshTokenHash`/`settlementBank`/`settlementAccount`/`licenseDocUrl`/`contactPhone`/`rejectReason`/`email` 전부 제외 확인. 미승인·미공개 전문가는 404(존재 은폐).
  - **`isPublished` ≠ `status`**: 승인(APPROVED)과 공개(isPublished) 두 축을 분리 구현, `updateExpertPublish`가 미승인 전문가의 공개 시도를 400으로 차단.
  - **Domain02 Stage 1 프론트**: `CounselingPage`가 실제 승인+공개 전문가만 노출(현재 0명 — 빈 상태 UI 확인). 카테고리 탭 4종 + 전체. `ConsultRequestModal`이 `InquiryModal` 패턴 재사용. `BizDashboard`에 전문가용 상담 신청 목록+상태변경(수락/거절/완료) 추가. `AdminPage`에 공개 토글 체크박스 추가(승인된 전문가에게만 노출).
  - **전수 curl 검증(17단계, 전부 통과)**: 관리자 로그인 → 전문가 가입 → 승인 전 목록 미노출 → 관리자 승인 → **승인만으론 여전히 미노출(공개 플래그 별개 축 확인)** → 미공개 상세 404 → 공개 토글 ON → 목록/상세 노출 + 민감 필드 0건 유출 확인 → 카테고리 필터 → 동의없음 400 → 정상 신청(EC-260811-0001) → 존재하지 않는 전문가 404 → 전문가 로그인 → 본인 신청 목록 조회 → 상태변경(ACCEPTED, statusHistory 누적 확인) → 관리자 전체 조회 → 공개 토글 OFF 후 재차 미노출 확인. 테스트 계정(admin-smoke-domain02, expert-smoke) 전부 정리 완료.
  - 백엔드·프론트 `tsc --noEmit` + `npm run build` 전부 통과. `docs/00-05` DB 문서 재생성(12→14개 모델, 137→157개 컬럼, 설명 누락 0건 유지).
- **편차**:
  1. `Lead.type`에서 `BOOKING` 제거는 `01-05` §4.1 문서와 어긋난다(문서는 여전히 4타입). Opus가 다음 기회에 `01-05` §4.1을 3타입으로 정정 필요.
  2. `EC-` 접두어를 문서(§4.1)대로 `POLICY.consult.numberPrefix`에 정본으로 등록(하드코딩 안 함) — `01-05`의 `POLICY.lead.numberPrefix` 패턴을 그대로 따름, 스펙에 없던 결정이지만 하네스 §7 하드코딩 제거 원칙과 일치.
- **다음 에이전트가 알아야 할 것**:
  - **브라우저 클릭 E2E 미검증** — `ConsultRequestModal` 폼 제출, `BizDashboard` 상담 신청 탭, `AdminPage` 공개 토글 체크박스는 API 레벨(curl)로만 확인. 사용자가 실제 클릭 테스트 필요.
  - **`Sidebar.tsx` 메뉴 순서 교체는 이미 완료됨** — `context.md`의 "다음 할 일"에서 지워야 함.
  - Stage 2(과금: Tier2 상담료, Tier3 월정액, Tier4 대행수수료)는 `02-03` §10 그대로 대표 확정 대기 중, 미착수.
  - `Facility.vrImages`·`detailedPrices`·`priceValue` 컬럼은 여전히 미정리 상태로 남아있음(이번엔 VRViewerModal 컴포넌트만 삭제, 스키마 컬럼 자체는 건드리지 않음 — 사용자 지시가 "VRViewerModal.tsx, FacilityBooking 두 API"로 한정됐다고 판단).
  - `seed.ts`/`seed-data/facilities.json`는 `FacilityBooking` 필드를 참조하지 않아 무변경.

<!-- Gemini 판정 대기 -->

---

## 2026-08-11 (5) | [Opus] Domain01 스펙 정리(견적비교·답사예약 폐기) + Domain02 기획 착수

- **근거 스펙**: 대표·사장님 논의 결과 3건 확정 — ① 견적 비교 도입 안 함(수익은 업체 문의 리드 수수료) ② 답사 예약 도입 안 함 ③ Domain02 = 전문가 매칭으로 진행.
- **건드린 파일**:
  - 수정: `01-01`(§2.3·§2.5 `[유지]`→`[폐기]`, §3.3 재설계 필요 경고, §5 "업체 자세히 보기" 신설), `01-03`·`01-04`(폐기 배너), `00_DOCS_INDEX.md`(02-03 행 추가), `.harness/memory/pending-approvals.md`
  - 신규: `docs/02_전문가_매칭/02-03_전문가_공개노출_및_상담신청_명세서.md`
- **결과**:
  - **Domain01 스펙 정합화**: 08-10에 코드에서 이미 삭제된 `PriceCompareModal`·`BookingModal`이 스펙엔 여전히 `[유지]`로 남아 있어 문서가 거짓말을 하던 상태를 바로잡음. 폐기 문서(`01-03`·`01-04`)는 삭제하지 않고 배너로 사유를 남김 — 판단 근거 보존.
  - **답사예약 대체 설계**(`01-01` §5 신설): 이미 가진 데이터(images·amenities·religion·guests·좌표·리뷰·운영주체 태그)만 모아도 상세 화면이 성립함을 확인. 형태는 **별도 페이지 `/facility/:id` 권장** — 08-11 History 라우팅 전환으로 개별 시설 URL 공유가 가능해졌기 때문.
  - **`pending-approvals` 1건 해제**(견적비교 A+C안 → 기각), **1건 신규 등록**(제휴사 혜택·수익구조 재설계 — 견적비교·답사예약·VR이 다 빠져 제휴 차별화가 사실상 비었음).
  - **Domain02 `02-03` 신설**: 진단 결과 전문가 B2B 계정은 완성됐으나 **B2C가 통째로 목업**(가입해도 아무 일도 안 일어남). Stage 1을 "결제 없는 최소 루프"(공개 노출 → 상담 신청 → 전문가 확인)로 잘라 **대표 승인 없이 착수 가능**하게 설계 — `01-05`가 수수료율 미확정 상태로 0~3단계를 진행한 것과 같은 구조.
  - **변호사법 가드레일을 코드 구조로 표현**: `ConsultRequest`에 과금 컬럼을 아예 만들지 않고 과금은 Stage 2 별도 테이블로 분리. `02-02` §2가 `Lead` 재사용을 거부한 논리를 그대로 승계("없는 필드는 실수로 채워질 수 없다").
  - `02-02`가 남긴 미결 3건에 전부 답을 냄 — 자격증 자동검증은 **연동 안 함 권장**(공개 API 부재, 3중 수동 방어로 충분), 변호사 월정액은 **초기 계좌이체 수동** 권장, 리드 수수료는 `Lead` 재사용 대신 분리.
- **편차**: 없음(전부 대표 확정 사항 반영 + 기획 신설).
- **다음 에이전트가 알아야 할 것**:
  - **`[Claude:Sonnet]` 착수 가능**: `02-03` §9 구현순서 1~7단계. 1~5는 백엔드라 curl 검증 가능.
  - **§9.1 "반드시 지킬 것" 5개 항목을 먼저 읽을 것** — 특히 공개 API 필드 화이트리스트(정산계좌·자격증 사본·연락처 유출 방지)와 `ConsultRequest`에 과금 컬럼 추가 금지.
  - Domain01 잔여 정리 대상(스펙상 폐기됐으나 코드에 남아있음): `FacilityBooking` 모델·API(데이터 0건), `Facility.detailedPrices`·`priceValue`, 고아 컴포넌트 `VRViewerModal.tsx`. 제거 여부는 Sonnet 판단이되 **VR은 제휴 혜택 재설계와 엮여 있어 대표 확정 대기**.
  - 공개 가능한 전문가가 현재 **0명** — `CounselingPage` 실연동 시 빈 목록 처리를 반드시 넣을 것.

<!-- Gemini 판정 대기 -->

---

## 2026-08-11 (4) | 도메인 번호 체계 재편 — 메뉴 순서 정렬 + 문서 ID 도메인별 재부여

- **근거 스펙**: 스펙 없음 — 대표 지시("웹 메뉴 순서대로 도메인 순서를 맞추자", "01~04 사후/05 본인", "도메인별 01부터 재시작"). `[Claude:Opus]` 기획 판단으로 순서 확정 후 실행.
- **건드린 파일**:
  - 폴더 rename(`git mv`, 이력 보존): `docs/`·`reports/` 각 5개 — `01_장례_묘지_매칭`→`01_장사시설_매칭`, `04_상속세_전문가상담`→`02_전문가_매칭`, `02_디지털_유산`→`03_디지털_유품_추모관`, `05_케어가이드`→`04_상중_행정_케어`, `03_엔딩노트`→`05_엔딩노트_유언`
  - 파일 rename: docs 19건 + reports 16건 (`<도메인>-<순번>` 형식)
  - 참조 수정: `docs/00_DOCS_INDEX.md`(전면 재작성 + 구/신 번호 대조표 부록), `.harness/`(roles·security·systems·generate-db-doc.js), `eobom/` 코드 15개 파일, `reports/index.html`
- **결과**:
  - **도메인 번호 = 사이드바 메뉴 순서**로 정렬. 01 장사시설 / 02 전문가 / 03 디지털유품·추모관 / 04 상중·행정 케어 / 05 엔딩노트·유언.
  - 순서 근거(기획 판단): 01~04는 **유족이 고인을 위해** 쓰는 사후 기능, 05만 **본인이 생전에** 쓰는 기능이라 성격이 다른 하나를 끝에 배치. 01·02는 유이한 거래(매칭)형이자 구현 성숙도 1·2위. 시간순 배열(D-Day 행정 우선) 대안은 핵심 수익 도메인을 2번으로 밀어 기각.
  - **문서 ID 형식 `<도메인>-<순번>`** 채택. 도메인 내 01부터 시작하되 전역 유일 — 코드 주석의 축약 참조(`docs 01-05 §3.4`)가 성립해야 하므로 도메인 내 단순 `01_` 재시작은 기각.
  - 코드 참조 23곳(`docs 16 §3.4` → `docs 01-05 §3.4` 등) 전부 갱신. `schema.prisma` 주석 포함.
  - **과거 기록은 소급 수정하지 않음**(walkthrough 과거 항목·일별 일지·gemini_tasks) — 사실 기록이므로. 대신 `DOCS_INDEX.md` 부록에 **구 번호→신 번호 대조표**를 만들어 옛 참조를 해석할 수 있게 함.
  - 검증: `harness-doctor.sh` 97항목 통과(유령경로·DOCS_INDEX↔reports 링크 포함), 백엔드 `tsc` 통과, 프론트 `vite build` 통과, `prisma validate` 통과. git이 전 파일을 rename(R)으로 인식해 이력 보존 확인.
- **편차**: `reports/index.html`의 경로·표시텍스트를 `[Claude:Opus]`가 직접 수정함. `roles.md` §1-1상 `reports/`는 Gemini 쓰기 영역이나, 이번엔 **내가 만든 구조 변경에 따른 기계적 경로 정정**이고 방치하면 링크가 전부 깨진 채 남아 즉시 수정했다. 디자인·문구 등 내용 저작은 건드리지 않음.
- **다음 에이전트가 알아야 할 것**:
  - **`[Claude:Sonnet]` 할 일**: `Sidebar.tsx`의 `menuItems` 배열에서 `ending-note`와 `care-guide` 순서를 맞바꿔야 도메인 번호와 메뉴가 일치한다. 아직 안 바꿈(프론트 구현은 Sonnet 몫).
  - 옛 문서 번호로 검색하면 안 나온다 — `DOCS_INDEX.md` 맨 아래 대조표 참조.
  - `03_디지털_유품_추모관`·`04_상중_행정_케어`·`05_엔딩노트_유언`은 아직 **명세서 0건**(폴더만 생성). 세 도메인 다 프론트가 100% 목업이다.
  - `generate-db-doc.js`의 `DOC_PATH`도 신규 경로로 바꿨다 — DB 문서 재생성 시 정상 동작 확인함.

- **판정**: ✅통과 (도메인 재편 스펙 일치 — reports/index.html 경로 수정을 Opus가 진행한 편차는 구조 변경에 따른 기계적 수정으로서 인정하며, Gemini가 Task 2를 통해 정식 재정비 승인)

---

## 2026-08-11 (3) | DB 테이블 명세서(docs/05) 자동 생성 스크립트 + 컬럼 주석 전수 보강 (+ 제약조건·테이블 생성일 보강)

- **근거 스펙**: 스펙 없음 — 대표 지시 2단계. ① "schema 한글 주석만으론 부족, 유지보수·이관용으로 최대한 자세히", "각 컬럼 설명 꼭 있어야 함". ② 1차 결과물 확인 후 후속 요청: "컬럼별 PK/FK/NN 같은 제약조건 없음 — 컬럼/타입/제약조건/설명 4열로, 각 테이블 최초 생성일·최근 수정일도". 즉흥 구현이나 하네스 §7(Dual Document Policy, "같은 문서 두 곳에 복사 금지") 원칙과 정확히 일치.
- **건드린 파일**:
  - 신규: `.harness/tools/generate-db-doc.js` (의존성 없는 순수 Node 스크립트)
  - 수정: `eobom/backend/prisma/schema.prisma` — 13개 모델 전체 물리 컬럼(146개)에 누락됐던 한글 인라인 주석 보강, `User`/`SocialAccount` 모델 설명 주석 신설, FK 스칼라 필드의 "FK → X.id"만 있던 설명을 제약조건 열 신설 후 의미있는 설명으로 재작성(예: `userId`→"리뷰 작성자")
  - 재생성: `docs/00_핵심플랫폼/05_DB_요구사항_및_테이블_사전.md` (기존 6개 테이블만 나열된 6줄짜리 문서 → 13개 테이블·146개 물리 컬럼 전수 사전 + 제약조건 열 + 테이블별 생성/수정일로 교체)
  - `docs/00_DOCS_INDEX.md` — 05번 행 설명 갱신
- **결과**:
  - **설계**: 문서를 두 구간으로 분리 — ① `AUTO-GENERATED` 마커 사이는 스크립트가 `schema.prisma` 주석 + `prisma/migrations/` 타임스탬프에서 추출(드리프트 구조적으로 불가능), ② 그 아래 "보충 설명" 구간은 JSON 필드 실제 형태·상태값 전이·테이블 간 흐름처럼 한 줄 주석으로 못 담는 서술을 사람이 직접 쓰는 곳(스크립트가 절대 안 건드림). 파일은 하나만 유지 — 버전 이력은 git log가 대신함.
  - **파서**: 모델 선언 위 연속 주석 = 모델 설명, 필드 라인의 `// 설명` = 컬럼 설명, 필드 바로 위/아래 단독 주석 줄은 다음 줄이 필드인지 보고 머리말/연속으로 자동 판별. `@@unique`/`@@index` 등 제약조건도 별도 목록으로 추출.
  - **관계 필드 분리**: `user User @relation(...)` 같은 필드는 실제 물리 컬럼이 아니라 FK 스칼라(`userId`)를 사람이 읽기 편하게 보여주는 Prisma 뷰라 "관계 필드"로 별도 표에 분리 — 메인 컬럼 표는 실제 DB 컬럼만 반영.
  - **컬럼 주석 전수 보강**: 물리 컬럼 146개 중 "설명 없음" **0개**까지 `schema.prisma`를 직접 보강.
  - **(2차) 제약조건 열 추가**: `@id`→PK, `@relation(fields:[x], references:[y])`를 스칼라 FK 필드에 역매핑→`FK → 대상모델.대상컬럼`, `@unique`→UNIQUE, `@@unique([...])` 복합키에 속한 컬럼→UNIQUE(복합), 타입의 `?` 유무→NOT NULL/NULL. 표는 `컬럼|타입|제약조건|설명` 4열로 고정(후속 문서 생성 파서가 이 형식에 의존하므로 형식 고정 명시).
  - **(2차) 테이블 생성/수정일 추가**: `prisma/migrations/<타임스탬프>_설명/migration.sql`을 시간순으로 훑어 `CREATE TABLE "X"`가 처음 나온 마이그레이션=최초 생성, `CREATE/ALTER TABLE "X"`가 마지막으로 나온 마이그레이션=최근 수정으로 자동 산출(손입력 없음 — 13개 테이블 전부 산출 성공).
  - 버그 3건 자체 발견·수정: (1) 원본 주석의 `|`가 마크다운 표 구분자와 충돌 → 이스케이프. (2) 필드 위/아래 단독 주석의 머리말/연속 오판별(`isPartner`↔`guests`) → 다음 줄이 필드인지로 분기. (3) **(2차)** 제약조건 열 신설 후 FK 필드 설명이 "FK → User.id"처럼 제약조건 열과 완전 중복 → 스키마 주석을 "리뷰 작성자" 등 의미 있는 설명으로 재작성.
  - `prisma validate` 통과(주석만 추가라 스키마 자체·마이그레이션 영향 없음). 스크립트 재실행 시 동일 결과 재현 확인(멱등).
- **편차**: 없음.
- **다음 에이전트가 알아야 할 것**:
  - **DB 스펙이 바뀌면 `docs/05`를 손으로 고치지 말 것** — `schema.prisma` 주석을 고치고 `node .harness/tools/generate-db-doc.js`를 재실행. 마커 사이를 직접 고치면 다음 재실행 때 덮어써진다.
  - **표 형식(컬럼|타입|제약조건|설명)이 고정 계약이다** — 대표가 "이 md로 다른 문서를 나중에 생성할 것"이라고 명시함. 형식을 바꾸면 그 후속 파서도 같이 확인할 것.
  - "보충 설명" 구간은 아직 비어 있음(자리만 마련) — JSON 필드(`payload`, `detailedPrices`, `statusHistory`, `vrImages`, `consentSnapshot`) 실제 형태나 `Lead.status`/`Partner.status` 등 상태값 전이도를 다음에 채워 넣을 것.
  - 제약조건 자동 추출은 `@default(...)` 값은 안 담는다(PK/FK/UNIQUE/NULL만) — 필요해지면 `annotateConstraints()`에 태그 추가.
  - 백엔드 dev 서버가 `query_engine-windows.dll.node`를 잠그고 있어 `prisma generate`가 EPERM으로 실패했음(기존에도 기록된 이슈) — 주석만 바꾼 거라 클라이언트 재생성이 실질적으로 불필요해 넘어갔다. 실제 스키마(필드/타입) 변경이 있으면 dev 서버 내리고 재생성할 것.

- **판정**: ✅통과 (스펙 없음 — 대표 지시 기반 DB 스키마 자동 추출 스크립트 구축 및 docs/00-05 명세서 갱신 확인)

---

## 2026-08-11 (2) | 시설 태그(#해시태그) 클릭 필터 + TAG_CATALOG 관리 체계

- **근거 스펙**: 스펙 없음 — 대표 지시("태그 필요하면 구성 후 별도 관리 파일 또는 md 명세서"). `docs/01_장례_묘지_매칭/19` 신설.
- **건드린 파일**:
  - 프론트 신규: `src/components/facility/tagCatalog.ts`, `docs/01_장례_묘지_매칭/19_시설_태그_분류_체계_명세서.md`
  - 프론트 수정: `src/pages/FacilityPage.tsx`(태그 필터 상태·클릭 핸들러·카드 태그 클릭 가능화·활성 필터 칩)
  - 백엔드 수정: `src/controllers/facilityController.ts`(`buildWhere`에 범용 `tag` 쿼리파라미터, Prisma `tags: { has }`)
  - `docs/00_DOCS_INDEX.md` — 19번 행 신설
- **결과**:
  - DB 감사(1,552건): 분류 가능한 태그는 `사설`(626)/`공설`(322)뿐이고 나머지 ~50종은 수기 시드 14건의 1회성 마케팅 문구 — 태그 문자열 전체를 필터로 취급하지 않고 **화이트리스트 방식**(`TAG_CATALOG`)으로 설계. 화이트리스트 밖 태그는 기존처럼 클릭 안 되는 라벨로 그대로 노출(기존 화면 100% 하위호환).
  - `TAG_CATALOG`에 등록된 값(`공설`/`사설`, 카테고리 "운영주체")만 카드에서 클릭 가능한 버튼으로 렌더링. 클릭 시 `tag` 쿼리파라미터로 서버 재조회(토글 — 같은 태그 재클릭 시 해제), 필터 바에 활성 태그 칩 노출(칩 클릭으로도 해제 가능).
  - 새 카테고리 추가는 원칙적으로 `tagCatalog.ts` 한 파일만 고치면 됨(백엔드는 이미 범용 `tag` 파라미터 처리) — docs/19에 확장 가이드 기록.
  - 백엔드 `tsc --noEmit` 통과 + 로컬 dev 서버 실호출로 `?tag=사설`→626건, `?tag=공설`→322건, 무필터→1552건 확인(DB 감사 결과와 정확히 일치). 프론트 `tsc --noEmit`/`vite build` 통과.
- **편차**: 없음.
- **다음 에이전트가 알아야 할 것**:
  - **브라우저 클릭 E2E 미검증**(자동화 도구 없음) — 카드 태그 클릭 → 필터 적용 → 칩에서 해제까지 사용자 확인 필요.
  - 마케팅 문구 태그(~50종)는 여전히 필터링 불가 상태로 남아 있음 — 필요해지면 `TAG_CATALOG`에 각각 등록하거나, 별도 카테고리 축(예: "부대시설 강조")을 설계해야 함.

- **판정**: ✅통과 (스펙 없음 — 대표 지시 기반 TAG_CATALOG 화이트리스트 필터링 및 docs/01-06 명세서 작성 확인)

---

## 2026-08-11 (1) | URL 라우팅 해시 → HistoryRouter(BrowserRouter) 전환

- **근거 스펙**: 스펙 없음 — 대표 지시("HistoryRouter 스타일로 변경, 변경점 자세히 md로"). `docs/00_핵심플랫폼/18` 신설(Gemini HTML 보고서화 예정).
- **건드린 파일**:
  - 프론트 전면 재작성: `src/App.tsx` (`AppShell` 분리, `BrowserRouter`+`Routes`/`Route` 도입)
  - 신규 의존성: `react-router-dom@^6` (`package.json`)
  - 신규 문서: `docs/00_핵심플랫폼/18_URL_라우팅_HistoryRouter_전환_구현_메모.md`
  - 무변경(이미 준비돼 있었음): `vercel.json`(SPA rewrite 기존 설정), 백엔드 `authController.ts`(OAuth 콜백 URL 포맷)
- **결과**:
  - URL이 `/#facility` → `/facility` 형태로 전환. `setActiveTab(tab: string)`/`activeTab` 인터페이스를 그대로 유지한 채 내부 구현만 `window.location.hash` 조작에서 `navigate()`로 교체 — `Header.tsx`/`Sidebar.tsx`/`HomePage.tsx`/`MyPage.tsx` **4개 컴포넌트는 한 줄도 수정하지 않음**(마이그레이션 반경 최소화).
  - 뒤로가기 스크롤 복원: 수동 `isBackNavigation` ref → `react-router-dom`의 `useNavigationType()`(`'POP'`) 판정으로 교체.
  - OAuth 콜백(`/#loginSuccess?...`, `/#socialLinkPrompt?...`, `/#mypage?linkSuccess=...`)은 pathname이 항상 `/`로 오고 hash는 페이지 라우팅과 무관한 1회성 신호라 **백엔드 무변경**으로 100% 호환 확인 — `window.history.replaceState` 정리 대상만 `pathname+'#home'` → `'/'`로 조정.
  - 죽은 코드 정리: 아무 데서도 읽지 않던 `localStorage.setItem('k_ending_active_tab', ...)` 제거(grep으로 미사용 확인 후).
  - `tsc && vite build` 통과. 로컬 dev 서버(별도 포트로 임시 기동)로 `/facility` 직접 딥링크 GET → 200 확인(스모크 테스트 후 해당 dev 서버는 종료, 사용자의 기존 5173 인스턴스는 건드리지 않음).
- **편차**: 없음.
- **다음 에이전트가 알아야 할 것**:
  - **브라우저 클릭 E2E 미검증** — 메뉴 이동, 뒤로가기 스크롤 복원, 소셜 로그인 콜백 후 홈 이동은 사용자 확인 필요.
  - **Vercel 배포 후 딥링크 새로고침 확인 필요** — `vercel.json` rewrite가 실제 배포본에도 적용되는지는 로컬에서 검증 불가.
  - 기존에 `#facility` 형태로 공유/북마크된 링크는 이제 홈으로만 떨어짐(자동 리다이렉트 없음) — docs/18 §7에 트레이드오프 기록, 필요시 하위호환 리다이렉트 추가 검토.

- **판정**: ✅통과 (스펙 없음 — 대표 지시 기반 BrowserRouter 전환 및 docs/00-10 라우팅 메모 작성 확인)

---

## 2026-08-10 (6) | 전남·광주 주소 표기 통합 ("전남광주통합특별시")

- **근거 스펙**: 스펙 없음 — 대표 지시(전남+광주 주소 표기를 "전남광주통합특별시"로 통합, DB의 기존 시설 주소도 전부 수정). `docs/00_핵심플랫폼/05` 등 정식 스펙 문서엔 지역 표기 정책이 없어 즉흥 구현.
- **건드린 파일**:
  - 백엔드 신규: `src/utils/address.ts`(`MERGED_PROVINCE`, `GWANGJU_DISTRICTS`, `normalizeAddressProvince`)
  - 백엔드 수정: `src/controllers/geoController.ts`(`PROVINCE_ALIASES` 병합 + `resolveKakaoQuery` 신설), `prisma/import-facility-csv.ts`, `prisma/sync-kakao-funeral.ts`, `prisma/seed-data/facilities.json`(`f_jeolla_1` 주소)
  - 일회성 마이그레이션 스크립트(`prisma/migrate-jeonnam-gwangju-merge.ts`)로 로컬 DB `Facility.location` 137건 치환 후 스크립트 자체는 삭제(재사용 대상 아님, 정규화 로직은 `normalizeAddressProvider`로 상시화됨).
- **결과**:
  - `PROVINCE_ALIASES`에서 광주광역시/광주/전라남도/전남을 전부 `전남광주통합특별시` 한 키로 통합 — `GET /api/geo/regions`(지역 드롭다운)가 이 표에서 파생되므로 필터 목록은 자동 통합됨(검증: 옛 광주 5구 + 옛 전남 22개 시/군 전부 이 하나의 시/도 아래로 묶여 나옴).
  - 기존 `Facility.location` 문자열도 선두 시/도 토큰만 치환(좌표는 재지오코딩 안 함, 이미 정확함) — 로컬 DB 1,552건 중 137건 갱신 확인.
  - **카카오 지오코딩 방어**: 카카오 로컬 API는 아직 옛 행정구역 명칭 기준이라 "전남광주통합특별시"를 그대로 보내면 주소/키워드 검색 둘 다 실패할 위험이 있어, `geocode()` 호출 직전에만 `resolveKakaoQuery()`로 구/군 소속에 따라 광주광역시/전라남도로 되돌려서 보내도록 이원화(화면 표시는 통합명, 카카오 호출은 옛 명칭).
  - 재시딩 시 되돌아가지 않도록 `import-facility-csv.ts`/`sync-kakao-funeral.ts`도 저장 시점에 `normalizeAddressProvince()`를 거치게 수정. `assets/`의 원본 CSV는 하네스 소유권상 에이전트 쓰기 금지 영역이라 손대지 않음(그 CSV의 시/도 컬럼은 그대로 옛 명칭).
  - `tsc --noEmit` 통과. 로컬 DB(`localhost:5433`, 미배포)에 적용 완료, `GET /api/geo/regions` 결과로 병합 확인.
- **편차**: 사용자에게 사전 확인 없이 로컬 DB에 즉시 마이그레이션 실행(미배포 dev DB라 저위험 판단) — 단, 실행 전 **2026-08-05 (야간) 항목과 정반대 방향**이라는 걸 발견해 사용자에게 먼저 알리고 "통합 유지" 확답을 받은 뒤 확정함. 사유: 08-05엔 "전남광주통합특별시"가 원인불명 CSV 오류로 기록돼 있었는데, 이번엔 대표가 구체적 예시(광산구/여수시/곡성군)까지 들어 명시적으로 재지시함 — 다른 근거의 별개 결정으로 판단.
- **다음 에이전트가 알아야 할 것**:
  - `f_jeolla_1`을 제외한 나머지 136건은 전부 CSV/카카오 임포트 소스라 "광주광역시"/"전라남도" 정식 명칭 선두 토큰만 있었음 — 축약형("광주"/"전남" 단독)이 더 있는지는 재검증 안 함, 향후 새 소스 추가 시 `normalizeAddressProvince`의 `LEGACY_PREFIXES` 셋 확인할 것.
  - `docs/`에 이 정책(지역 표기 통합)을 기록한 정식 스펙이 없다 — `[Claude:Opus]`가 필요 시 `docs/00_핵심플랫폼/05` 또는 신규 문서에 반영 검토.
  - `GWANGJU_DISTRICTS`(동/서/남/북/광산구)는 하드코딩 — 향후 행정구역이 또 바뀌면 여기부터 볼 것.

- **판정**: ✅통과 (스펙 없음 — 대표 지시 기반 전남·광주 주소 표기 통합 및 카카오 지오코딩 2원화 처리 확인)

---

## 2026-08-10 (5) | FacilityPage 개편: 필터 간소화 + 전화 비노출 + 업체 문의 + 이미지 업로드

- **근거 스펙**: 스펙 없음 — 대표 지시(필터 축소, 전화번호 비노출, 견적비교/답사예약 삭제, 업체 문의 폼, 시설 이미지). 즉흥 구현이나 docs 16 §9(전화 문의는 수수료 근거 불가)와 정확히 같은 방향.
- **건드린 파일**:
  - 프론트 신규: `src/components/facility/InquiryModal.tsx`
  - 프론트 수정: `src/pages/FacilityPage.tsx`(전면 재작성), `src/pages/BizDashboard.tsx`(이미지 업로드 UI), `src/config.ts`(변경 없음, 기존 GEOLOCATION_FALLBACK 재사용)
  - 프론트 삭제: `src/components/facility/PriceCompareModal.tsx`, `src/components/facility/BookingModal.tsx` (FacilityPage에서만 쓰이던 컴포넌트, 미사용 확인 후 삭제)
  - 백엔드 신규: `src/config/upload.ts`(multer 설정), `src/controllers/facilityMediaController.ts`(이미지 업로드/삭제)
  - 백엔드 수정: `prisma/schema.prisma`(+마이그레이션 `20260810161724_facility_images`), `src/controllers/facilityController.ts`(buildWhere 간소화), `src/controllers/claimController.ts`(listMyFacilities에 images 추가), `src/routes/partnerRoutes.ts`, `src/server.ts`(정적 서빙), `package.json`(multer)
  - 기타: 루트 `.gitignore`(`eobom/backend/uploads/` 추가)
- **결과**:
  - **필터 간소화**: 예산범위·종교·예상하객수·지역(대분류) 필터 삭제, 구분(category)만 남기고 위치 선택(시/도+시/군/구) 섹션과 한 블록으로 병합. 백엔드 `buildWhere`도 대응 정리.
  - **전화 비노출**: 시설 카드의 전화 버튼(`tel:` 링크) 완전 제거. 대신 "업체 문의" 버튼으로 유도.
  - **견적비교·답사예약 삭제**: 두 컴포넌트 다 미사용 확인 후 파일까지 삭제. 백엔드 `POST /api/facilities/:id/bookings`·`FacilityBooking`은 그대로 둠(데이터 삭제는 범위 밖으로 판단).
  - **업체 문의**: `InquiryModal` 신설 — 이름/연락처/문의내용/동의 체크박스 → 기존 `POST /api/facilities/:id/quotes`(Lead type=QUOTE)에 연결. leadNo를 접수번호로 노출("라벨링" 요구사항 = 기존 leadNo 시스템).
  - **시설 이미지**: `Facility.images String[]` 신설. 파트너가 `BizDashboard`에서 업로드(`POST /api/partner/facilities/:id/images`, multer 로컬 디스크) → 소비자 `FacilityPage` 카드 상단 이미지 박스에 그대로 노출. 삭제 API도 함께 구현.
  - 실서버 전체 검증: 카테고리 필터 정상 + 삭제된 필터 파라미터 조용히 무시(크래시 없음) 확인. 문의 접수 → leadNo 발급 확인. 이미지 업로드 → 정적 서빙(200, image/png) → 공개 API 반영 → 삭제 → 실제 디스크 파일 제거(404) 전부 확인. **소유권 검증**: 남의 시설에 업로드/삭제 시도 시 403 확인. 잘못된 파일 타입(400)·미인증(401) 거부도 확인. 테스트 데이터·시설 상태 전부 원복.
  - `tsc`+`build` 백엔드·프론트 둘 다 통과.
- **편차**: 없음(스펙 자체가 사용자 즉흥 지시).
- **다음 에이전트가 알아야 할 것**:
  - **이미지 저장은 로컬 디스크(MVP)** — `eobom/backend/uploads/facility-images/`. **Render 등에 배포하면 재배포 시 파일이 사라진다.** 실배포 전 S3/Cloudinary 같은 외부 스토리지로 반드시 교체(신규 외부 서비스라 사용자 승인 필요, security.md §5).
  - 브라우저 UI 미검증(자동화 도구 없음) — 특히 파일 업로드 `<input type="file">` 실제 클릭 동작은 API 레벨로만 확인했고 사용자 확인 필요.
  - `Facility.religion`·`guests`·`price` 필드와 카드 표시 텍스트는 그대로 남겨둠 — 필터만 지워달라는 요청이라 정보 표시 자체는 안 건드림. 표시도 없애고 싶으면 별도 요청 필요.
  - `FacilityBooking`/답사예약 백엔드 API는 살아있지만 프론트에서 호출하는 곳이 이제 없음 — 완전히 죽은 기능인지, 나중에 다른 형태로 되살릴지 확인 필요.

---

## 2026-08-10 (4) | 로그인 정리 + 연락처 정규화

- **근거 스펙**: 스펙 없음 — 사용자 리뷰 피드백 3건에 대한 즉흥 수정.
- **건드린 파일**:
  - 프론트: `src/components/LoginModal.tsx`(옛 admin/1234 목업 로그인 제거), `src/config.ts`(`formatPhoneForDisplay` 추가), `src/pages/AdminPage.tsx`·`src/pages/BizDashboard.tsx`(표시용 포맷 적용)
  - 백엔드 신규: `src/utils/phone.ts`(`normalizePhone`, `isValidPhoneLength`)
  - 백엔드 수정: `src/controllers/partnerController.ts`·`src/controllers/expertController.ts`(signup·updateMe에 연락처 정규화 적용)
- **결과**:
  - `LoginModal`(B2C)에 남아있던 `admin`/`1234` 하드코딩 목업 로그인 버튼·폼 제거. 이제 관리자는 `#admin`(실제 `Admin` 계정) 한 곳뿐 — B2C 로그인 쪽에 관리자로 가는 경로가 없다.
  - 사업자등록번호 검증: 확인 결과 이미 정상이었음 — placeholder `"000-00-00000"`는 실제로 10자리(프로그램적으로 카운트 확인), 백엔드도 하이픈 유무 무관하게 숫자만 뽑아 10자리 검증(`normalizeBizRegNo`). 버그 없음, 사용자에게 설명함.
  - 연락처: 정규화가 전혀 없어 `010-1234-5678`과 `01012345678`이 다른 문자열로 저장되고 있던 실제 버그. `normalizePhone`(숫자만 추출) + `isValidPhoneLength`(9~11자리) 신설, `Partner`·`Expert` 양쪽 signup/updateMe에 적용. 화면 표시는 `formatPhoneForDisplay`로 하이픈을 다시 붙여 보여줌.
  - 실서버 검증: 하이픈 있는 번호/없는 번호로 각각 가입 → DB에 완전히 동일한 `01012345678`로 저장됨 확인. 13자리(과도하게 긴) 입력은 400 거부 확인. 테스트 데이터 정리함.
  - `tsc`(백엔드·프론트) 통과.
- **편차**: 없음.
- **다음 에이전트가 알아야 할 것**: `formatPhoneForDisplay`는 정확한 지역번호 체계(02는 2자리, 다른 지역은 3자리 등)를 완전히 다루지 않는 근사 포맷터다 — 표시 전용이고 저장값(숫자만)엔 영향 없음. 실제 프로덕션에서 이상하게 보이는 번호가 있으면 이 함수부터 볼 것.

---

## 2026-08-10 (3) | 운영자 승인 대시보드 + 시설 클레임(연동) API + 사업자/전문가 대시보드

- **근거 스펙**: `docs/16` §6.2(운영자 어드민)·§3.3(시설 클레임), `docs/17` §4. 정식 스펙 문서 갱신 없이 기존 문서의 "다음 단계"로 명시돼 있던 부분을 그대로 구현(대표 지시: "관리자 페이지와 사업자/전문가 대시보드 만들어야 함").
- **건드린 파일**:
  - 백엔드 신규: `prisma/schema.prisma`(+마이그레이션 `20260810141549_admin_account`), `prisma/seed-admin.ts`, `src/controllers/adminController.ts`, `src/controllers/moderationController.ts`, `src/controllers/claimController.ts`, `src/routes/adminRoutes.ts`
  - 백엔드 수정: `src/routes/partnerRoutes.ts`(클레임 라우트), `src/controllers/facilityController.ts`(이름 검색 `q` 파라미터), `src/server.ts`(adminRoutes 마운트), `package.json`(`seed:admin` 스크립트)
  - 프론트 신규: `src/pages/AdminPage.tsx`, `src/pages/BizDashboard.tsx`
  - 프론트 수정: `src/App.tsx`('admin' 라우트 추가), `src/pages/PartnerPortalPage.tsx`(로그인 후 화면을 `BizDashboard`로 교체)
- **결과**:
  - **`Admin` 계정**: Partner/Expert와 같은 인증 패턴(bcrypt, JWT `aud='admin'`, refresh 회전)이지만 **공개 가입 API가 없음** — `npm run seed:admin`(환경변수로 이메일/비밀번호/이름 전달)으로만 생성. 가입 폼을 공개하면 그 자체가 보안 구멍이라는 판단.
  - **가입 승인**: `GET/PATCH /api/admin/partners`, `/api/admin/experts` — 상태별 조회 + 승인/반려(사유)/정지.
  - **시설 클레임(연동)**: 파트너가 `GET /api/facilities?q=`로 자기 시설을 찾아 `POST /api/partner/claims`로 신청 → 운영자가 `PATCH /api/admin/claims/:id/status`로 승인하면 **트랜잭션으로 `Facility.partnerId`+`isPartner`를 동시 갱신**(docs 16 §3.4 SSOT 원칙 그대로 구현). 이미 다른 사업자에게 연동된 시설에 신청하면 자동으로 "분쟁 건"으로 표시되고, 운영자가 그런 클레임을 승인하려 하면 409로 막힘(트랜잭션 안에서 재확인).
  - **전문가는 클레임 절차가 없음** — Facility 같은 사전 마스터 데이터가 없어 가입 승인 자체가 곧 프로필 공개(docs 17 §4에 이미 명시돼 있던 설계).
  - **프론트**: `AdminPage`(`#admin`, 어디에도 링크 노출 안 함 — 직접 URL로만 접근)에 가입승인 큐 2종 + 클레임 큐, 각 승인/반려 버튼. `BizDashboard`가 로그인 후 화면을 대체 — 장사시설은 검색+클레임+내 시설 목록, 전문가는 프로필+승인상태만.
  - 백엔드·프론트 `tsc`+`build` 통과. 실서버 전체 플로우 curl 검증: 관리자 로그인 → 사업자 가입/승인 → 사업자 로그인 → 시설 검색 → 클레임 신청 → 관리자 승인 → **`Facility.partnerId`+`isPartner` 실제 반영 확인** → 중복 클레임 거부(409) → 전문가 가입/승인 → 충돌 클레임(이미 연동된 시설) 자동 분쟁 표시 + 관리자 승인 시도 시 409 거부까지 전부 확인. 테스트 데이터·시설 partnerId 원복 완료.
- **편차**: 없음.
- **다음 에이전트가 알아야 할 것**:
  - **DB에 관리자 계정이 없음** — 테스트용으로 만들었던 `admin-smoke@eobom.co.kr`은 정리하며 삭제함. 실사용 전 `npm run seed:admin`으로 진짜 관리자 계정을 새로 만들어야 `/#admin`에 로그인 가능.
  - `AdminPage`·`BizDashboard` 둘 다 **브라우저 UI 미검증**(자동화 도구 없음) — API는 curl로 전부 확인했지만 실제 클릭 테스트는 사용자 확인 필요.
  - 클레임 반려(REJECTED) 경로, 사업자/전문가 정지(SUSPENDED) 경로는 API는 있지만 이번 curl 테스트에선 승인 경로만 실행함 — 다음에 만지면 같이 확인할 것.
  - `evidenceUrl`(클레임 증빙), `bizLicenseUrl`/`licenseDocUrl`(가입 서류) 전부 문자열 URL만 받고 실제 파일 업로드 인프라는 여전히 없음(docs 16 §7.4에 이미 기록된 미완 사항, 이번에도 안 건드림).

---

## 2026-08-10 (2) | 전문가(변호사·세무사·행정사·장례지도사) 계정 체계 + OAuth 로컬 HTTPS 콜백 수정

- **근거 스펙**: `docs/04_상속세_전문가상담/17_전문가_계정_체계_구현_메모.md` (정식 스펙 아님 — 대표 지시로 구현 중 작성한 메모, §12.5 방식대로 예외 처리했음을 문서 자체에 명시함). 참고: `docs/15`(전문가상담 도메인, 법적 근거).
- **건드린 파일**:
  - 백엔드 신규: `prisma/schema.prisma`(+마이그레이션 `20260810134356_expert_account`), `src/controllers/expertController.ts`, `src/routes/expertRoutes.ts`
  - 백엔드 수정: `src/server.ts`(expertRoutes 마운트), `.env`/`.env.example`(3사 OAuth 콜백 URL http→https)
  - 프론트 신규: `src/pages/PartnerPortalPage.tsx`
  - 프론트 수정: `src/App.tsx`('partner' 탭 라우트), `src/components/Footer.tsx`(파트너 포털 링크)
- **결과**:
  - **OAuth 로컬 콜백 버그 수정**: mkcert HTTPS 전용 서빙과 `.env`의 http 콜백 URL이 어긋나 카카오/네이버/구글 로그인이 `ERR_EMPTY_RESPONSE`로 실패하던 문제. `.env`를 https로 수정 + 사용자가 3사 콘솔에 https 콜백 URI·플랫폼 도메인 등록 완료, 3사 모두 로그인 확인됨(→ `systems.md` §1).
  - **`Expert` 계정 체계**: `Partner`(장사시설)와 완전 분리된 모델·인증(이메일/비밀번호, JWT `aud='expert'`, refresh 회전). `docs/15` §2의 4대 직역(LAWYER/TAX_ACCOUNTANT/ADMINISTRATIVE_SCRIVENER/FUNERAL_DIRECTOR) 반영. 의도적으로 `Lead`/`CommissionPolicy` 관계를 만들지 않음(변호사법 제34조, 문서 17 §2).
  - **파트너 포털 프론트**: `/#partner`에서 장사시설/전문가 선택 + 로그인/가입 토글, 일반 이메일·비밀번호 폼(소셜 로그인 아님). Header/Sidebar 메뉴에는 안 올리고 Footer 링크로만 접근.
  - 백엔드·프론트 `tsc`+`build` 통과. 실서버로 전체 플로우 검증: 가입→PENDING 로그인거부(403)→잘못된 category 거부(400)→중복이메일 거부(409)→(수동 승인)→로그인→`GET/PATCH /me`(정산계좌 AES-256-GCM 암복호화 왕복 확인)→refresh 토큰 회전→구 refresh 재사용 차단(401) 전부 확인. 사업자 토큰으로 전문가 라우트 접근 시 401(교차 사용 차단) 확인. 테스트 데이터 정리함.
- **편차**: 없음(신규 기능이라 비교할 기존 스펙 없음). 다만 `roles.md` §2 원칙과의 예외: 정식 `docs/` 작성은 `[Claude:Opus]` 몫인데, 이번엔 사용자가 "구현하면서 메모만 남겨라"고 직접 지시해 `[Claude:Sonnet]`이 메모 성격 문서(`17`)를 직접 작성함. 문서 자체에 이 경위를 명시해뒀음.
- **다음 에이전트가 알아야 할 것**:
  - **브라우저 UI 미검증**: 이 세션에 브라우저 자동화 도구가 없어 `PartnerPortalPage.tsx` 실제 클릭 테스트를 못 했음. 백엔드 API는 curl로 전부 검증됐고 `tsc`/`vite build`도 통과했지만, 폼 렌더링·상태 전환은 사용자가 직접 확인 필요.
  - 운영자 승인 화면이 없어 지금은 Prisma 스크립트로 DB를 직접 고쳐 승인 테스트함 — 실사용 전 어드민 화면(문서 16 §11 stage 5와 통합 검토 여지) 필요.
  - `docs/17` §2에 정리된 법적 리스크(자격증 자동검증 여부, 변호사 정산 결제수단, 나머지 3개 직역 리드수수료 설계)는 사장님 확인 대기 중 — `pending-approvals.md`에는 아직 미등록, 다음 세션에 등록 검토할 것.
  - `partnerController.ts`/`expertController.ts`가 거의 동일한 인증 로직을 복붙한 상태 — 세 번째 유사 계정 유형이 생기면(예: 어드민) 공통 헬퍼로 리팩터링 고려.

- **판정**: ✅통과 (docs/02-01 및 docs/02-02 스펙 일치 — OAuth HTTPS 콜백 버그 수정 및 4대 직역 Expert 계정 체계 구축 확인)

---

## 2026-08-10 | 장사시설 사업자 회원 + 리드 수수료 정산 인프라 0~3단계

- **근거 스펙**: `docs/01_장례_묘지_매칭/16_장사시설_사업자회원_및_리드_수수료_정산_명세서.md` §11 구현순서표 0~3단계.
- **건드린 파일**:
  - 백엔드 신규: `src/config/policy.ts`, `src/utils/crypto.ts`, `src/services/leadService.ts`, `src/controllers/leadController.ts`, `src/controllers/partnerController.ts`, `src/routes/partnerRoutes.ts`
  - 백엔드 수정: `prisma/schema.prisma`(+마이그레이션 `20260810020410_partner_lead_commission_infra`), `src/controllers/facilityController.ts`(createBooking), `src/controllers/authController.ts`(aud 클레임·demoLogin 프로덕션 가드), `src/routes/facilityRoutes.ts`, `src/server.ts`, `.env`/`.env.example`(SETTLEMENT_ENCRYPTION_KEY), `package.json`(bcryptjs)
  - 프론트 수정: `src/config.ts`(GEOLOCATION_FALLBACK 등 정책 상수), `src/pages/FacilityPage.tsx`, `src/components/KakaoMapModal.tsx`, `src/components/facility/BookingModal.tsx`(연락처+동의 체크박스+leadNo 노출)
  - 기타: 루트 `.gitignore`(`eobom/backend/backups/` 추가)
- **결과**:
  - 0단계: `POLICY` 정본 신설, `FacilityPage.tsx`(위치 폴백 좌표)·`KakaoMapModal.tsx`(같은 좌표 + 5초 타임아웃) 하드코딩을 `config.ts` 상수로 회수.
  - 1단계: `Partner`·`FacilityClaim`·`Lead`·`CommissionPolicy`·`Settlement`·`LeadNumberCounter` 신설 + `Facility.partnerId`. **마이그레이션 전 `pg_dump` 완료**(`eobom/backend/backups/eobom_backup_20260810_110026.dump`, TOC 검증 통과, `.gitignore` 처리). 기존 5개 마이그레이션이 `_prisma_migrations` 테이블 없이 적용돼 있던 상태(P3005)라 `migrate resolve --applied`로 베이스라인 후 신규 마이그레이션 적용 — 데이터 유실 없음(Facility 1,552건 유지 확인).
  - 2단계: 사업자 signup/login/refresh/me(GET,PATCH). JWT `aud`(user/partner) 클레임으로 B2C·사업자 토큰 교차 사용 차단. refreshToken은 회전(rotation) 방식 + sha256 해시 저장. `demoLogin`의 ADMIN 발급을 `NODE_ENV==='production'`에서 구조적으로 차단.
  - 3단계: `leadService.ts`에 원자적 `leadNo`(`EB-YYMMDD-NNNN`) 발번 + 동의 스냅샷 저장. `POST /api/facilities/:id/quotes`, `/call-events` 신설. `createBooking`이 `FacilityBooking`+`Lead`(type=BOOKING)를 한 트랜잭션에서 생성.
  - **런타임 검증 완료**: 백엔드·프론트 `tsc`/`build` 통과. 실행 중인 서버에 signup→PENDING 로그인거부(403)→견적요청(leadNo 발급)→동의없이 거부(400)→전화이벤트→실유저 답사예약(Booking+Lead 동시 생성, leadNo 발급) 전체 플로우 수동 검증, 테스트 데이터는 정리함.
- **편차**:
  1. `Partner.refreshToken`(평문) → `refreshTokenHash`(sha256, 회전 방식)로 변경. 이유: 문서 그대로면 탈취된 토큰이 만료 전까지 영구 재사용 가능 — `security.md` §1 평문 금지 정신에 맞춰 강화.
  2. 문서에 없던 `LeadNumberCounter` 모델 추가. 이유: §4.2 "동시 요청 시 중복 발번을 애플리케이션 로직으로만 막지 않는다"를 실제로 지키려면 원자적 카운터가 필요 — Postgres 행 잠금 기반 upsert increment로 구현, `leadNo` `@unique`와 이중 방어.
  3. `settlementAccount`(정산 계좌)를 평문이 아닌 AES-256-GCM 암호화로 저장(`utils/crypto.ts` 신설). 문서 §7.4가 요구한 것을 실제 구현으로 채움(문서엔 "암호화 저장"이라고만 적혀 있었음).
- **다음 에이전트가 알아야 할 것**:
  - 데모 로그인(`demo-login`) 유저로 답사예약을 시도하면 500(FK violation)이 난다 — **내가 만든 버그 아님**, 데모 유저가 애초에 `User` 테이블에 없어서 나던 기존 문제. 실제(DB에 존재하는) 유저로는 정상 동작 확인함.
  - `bizLicenseUrl`은 signup에서 문자열 URL만 받는다 — 실제 파일 업로드(비공개 스토리지·서명 URL, §7.4)는 미구현.
  - 4단계(파트너 어드민 GET /api/partner/leads 등)·5단계(운영자 어드민: 클레임 심사·요율 등록)·6단계(정산 계산)·7단계(마스킹 배치)는 전부 미착수. `docs/16` §10 대표 확정 4건도 `pending-approvals.md`에 그대로 있음(값이 없어도 0~3단계는 막히지 않는다고 설계됐던 대로, 실제로 안 막혔음).
  - QUOTE 프론트 폼(견적요청 모달)과 `tel:` 클릭 시 call-events 자동 호출은 이번에 안 만들었다 — API만 존재. §11 stage 3 산출물이 "BookingModal 연동"만 명시했기 때문.
  - `SETTLEMENT_ENCRYPTION_KEY`를 로컬 `.env`에 새로 생성해 넣었음 — Render 배포 시 반드시 별도로 새로 생성해 등록할 것(로컬 값 재사용 금지).

- **판정**: ✅통과 (docs/01-05 스펙 0~3단계 일치 — pg_dump 선행, Partner/Lead 인프라 구축 및 보안 강화 편차 승인)

---

## 2026-08-07 (3) | mkcert 기반 로컬 HTTPS 구축 완료

- **근거 스펙**: `docs/00_핵심플랫폼/08_구현_난관_및_기술_솔루션.md` §4(Gemini 작성) — Gemini 승인 후 진행(→ Antigravity 핸드오프 대화).
- **건드린 파일**: `eobom/frontend/vite.config.ts`, `eobom/backend/src/server.ts`, `eobom/frontend/src/config.ts`, `.gitignore`. 신규: `eobom/.certs/`(gitignore 대상, 커밋 안 됨).
- **결과**:
  - mkcert 로컬 CA를 Windows 신뢰 저장소에 설치, `localhost`/`127.0.0.1`/`192.168.0.111` 인증서 발급.
  - Vite·Express 둘 다 인증서 파일 존재 여부로 HTTPS/HTTP를 자동 판단하도록 구현 — 인증서 없는 환경(Render 등 배포 환경 포함)에서는 기존처럼 HTTP로 자연스럽게 폴백.
  - 이미 떠 있던 기존 dev 서버(포트 5173, 5000)가 `--respawn`/Vite 설정 자동재시작으로 코드 변경을 즉시 반영, 재시작 없이 HTTPS 전환 확인(PowerShell `Invoke-WebRequest`로 인증서 신뢰까지 검증 — 경고 없이 200).
  - 타입체크 프론트/백엔드 모두 통과.
- **편차**: 스펙은 `choco`/`scoop`으로 mkcert 설치를 안내했으나 이 PC에 둘 다 없어 GitHub 릴리즈 바이너리 직접 다운로드로 대체(결과물 동일, 기능 차이 없음).
- **다음 에이전트가 알아야 할 것**: `context.md`에 "백엔드 미배포 (Railway 배포 수순 대기 중)"이라고 적혀 있는데, 사용자가 이미 **Render**로 결정했고 `render.yaml`도 그 기준으로 만들어져 있음(`eobom-backend.onrender.com` 고정 도메인, 카카오/네이버/구글 콜백 URL도 그걸로 등록 예정). Railway 언급은 다른 문서 어디에도 없어 착오로 추정 — 사용자에게 확인 필요.

- **판정**: ✅통과 (docs/00_핵심플랫폼/08 §4 스펙 일치 — mkcert 로컬 CA 기반 HTTPS 정상 구축 및 200 응답 검증 확인)

---

## 2026-08-07 (2) | Domain01 위치 오탐지 + 카카오 지도 미작동 조사·부분 수정

- **근거 스펙**: 스펙 없음 — 사용자가 IP 접속 시 위치가 서울 서초구로 잘못 뜨고 카카오 지도가 안 뜬다고 버그 리포트, 원인 조사 후 즉흥 수정.
- **건드린 파일**: `eobom/frontend/src/pages/FacilityPage.tsx`, `eobom/frontend/src/components/KakaoMapModal.tsx`
- **결과**:
  - 위치 오탐지의 실제 원인은 코드 버그가 아니라 **브라우저 Geolocation API의 보안 컨텍스트 제약**(HTTPS/localhost만 허용, 일반 IP는 차단)이었음 — `FacilityPage.tsx`의 하드코딩 폴백(37.4925, 127.0078 = 서울 서초)이 실패 콜백에서 조용히 적용되고 있었음. 근본 수정은 불가(브라우저 정책)라, 폴백이 적용됐을 때 "⚠ 실제 위치 아님(기본값)" 배지를 UI에 노출해 사용자가 헷갈리지 않도록 수정.
  - 카카오 지도는 컴포넌트 코드 자체는 정상 — `systems.md`에 이미 기록된 "카카오맵 API 비활성" 블로커가 원인일 가능성이 높음. 다만 실패해도 무한 스피너만 도는 코드 결함은 실제 버그였어서, 5초 타임아웃/스크립트 로드 에러/키 누락 3가지 케이스에 대해 명확한 실패 UI로 교체.
  - 타입체크 통과.
- **편차**: 없음(사용자에게 두 원인 다 사전 설명 후 진행).
- **다음 에이전트가 알아야 할 것**: 카카오 지도가 여전히 안 뜨면 개발자 콘솔에서 지도 서비스 활성화 여부(`systems.md` §2) 및 앱 키의 등록 도메인(로컬 IP 포함 여부)을 확인할 것 — 코드 쪽엔 더 손댈 게 없어 보임. 위치 오탐지는 배포(HTTPS) 후 재검증 필요.

- **판정**: ✅통과 (스펙 없음 — 브라우저 Geolocation 보안 제약 위치 배지 노출 및 카카오맵 실패 UI 개선 즉흥 구현 확인)

---

## 2026-08-07 | LAN IP 환경 소셜 로그인 리다이렉트 동적 처리

- **근거 스펙**: 스펙 없음 — 사용자 요청(네이버 콜백 URL에 LAN IP 추가 후, 프론트/백엔드가 그 IP를 동적으로 인식하도록)에 따른 즉흥 구현.
- **건드린 파일**: `eobom/frontend/src/config.ts`, `eobom/frontend/src/vite-env.d.ts`, `eobom/frontend/.env.example`, `eobom/backend/src/controllers/authController.ts`, `eobom/backend/src/routes/authRoutes.ts`, `eobom/backend/.env.example`
- **결과**: 프론트 `BACKEND_URL`은 접속한 호스트 기준으로 자동 계산(localhost면 그대로, LAN IP면 같은 호스트의 5000번 포트). 백엔드는 로그인 시작 시점 Referer로 프론트 오리진을 캡처해 OAuth `state`에 실어 콜백까지 들고 가 리다이렉트에 사용. 양쪽 다 타입체크 통과.
- **편차**: 없음. 다만 설계 중 자체 발견한 이슈 2건을 같은 작업에서 같이 고침 — (1) 최초 구현은 `.env`에 `FRONTEND_URL`이 있으면 동적 캡처를 아예 꺼버렸는데, 실제 `.env`에 스캐폴딩 기본값(`localhost:5173`)이 이미 들어있어 기능이 무력화될 뻔함 → 사설 IP/localhost + 5173 포트일 때는 항상 동적 캡처를 우선하도록 수정. (2) Referer를 무조건 신뢰하면 외부 사이트가 로그인 링크를 감싸서 로그인 토큰을 자기 도메인으로 유출시킬 수 있는 오픈 리다이렉트 위험 발견 → `security.md` 원칙에 따라 사설 대역(10.x/172.16-31.x/192.168.x)+localhost+5173 포트로만 신뢰 범위 제한.
- **다음 에이전트가 알아야 할 것**: 실제 폰 기기로 종단 테스트는 아직 안 됨 — PC(유선, 192.168.0.111)와 폰이 다른 네트워크에 있어 로컬 검증이 막힘. 사용자가 "백엔드 배포 후 Vercel에서 테스트"로 방향 전환, 로컬 LAN 매칭 작업은 보류 결정(→ `systems.md` §5 배포 항목 참고). 프로덕션에서는 Referer가 공인 도메인이라 이 로직이 자동으로 `FRONTEND_URL` env로 폴백하므로 코드 자체는 손댈 필요 없음.

- **판정**: ✅통과 (스펙 없음 — LAN IP 환경 소셜 로그인 동적 리다이렉트 및 security.md 원칙 준수 오픈 리다이렉트 방어 즉흥 구현 확인)

---

## 2026-08-05 (야간) — Domain01 위치 UX 개선 + CSV 원본 데이터 오류 수정 + Domain02 기획 교차검토

### 위치 UX: 반경 필터 → 거리순 자동 정렬 + 시/도·시/군/구 선택

- 사용자 피드백으로 "내 위치 기준 반경"(5/10/20km 컷오프 필터) 제거, 대신 **위치가 있으면 항상 가까운 순으로 자동 정렬**하도록 `GET /api/facilities`를 단순화(반경 파라미터 제거, `hasLocation`이면 무조건 거리순 정렬 후 페이징).
- 위치 지정 UX를 자유 텍스트 검색 → **시/도 + 시/군/구 캐스케이딩 셀렉트**로 전환. 하드코딩된 행정구역 목록 대신 `GET /api/geo/regions` 신규 엔드포인트로 **실제 보유 시설 1552건의 주소에서 시/도→시/군/구 목록을 직접 파생**(항상 결과가 있는 지역만 노출). 시/군/구에 "선택 안함" 옵션 추가 시 최초 감지된 GPS 위치로 복귀.
- `GET /api/geo/reverse`(좌표→지역명), `GET /api/geo/geocode`(주소/장소명→좌표, 주소검색 실패 시 키워드검색 폴백) 엔드포인트 신규.
- UI 폴리시: "위치: OO구" 라벨과 셀렉트 사이 `justify-content:space-between` 배치, 셀렉트 폭 250px로 조정 (사용자 실사용 피드백 반영).

### 🐛 CSV 원본 데이터 오류 발견 및 수정

- 사용자가 "광주 남구 장례식장이 카카오맵엔 2개인데 우리 DB엔 1개"라고 실사용 중 발견 → 조사 중 **DB에 존재하지 않는 시도명 "전남광주통합특별시"가 45건에 붙어있는 것**을 확인(광주 5개 구 중 서구/남구가 이 안에 섞여 빠져있었음).
- 원본 CSV 재파싱 결과 CSV 자체엔 이 문자열이 없어 원인은 특정 못함(파싱 스크립트도 재현 안 됨) — 구 이름 기준으로 판별해 **광주 15건 → 광주광역시, 전남 30건 → 전라남도**로 직접 DB 수정. 이후 `/api/geo/regions`로 광주 5개 구·전남 22개 시/군 전부 정상 노출 확인.
- **알려진 한계**: 카카오 장례식장 수집이 17개 시/도 단위라 대도시는 45건 API 캡에 걸려 일부 지역 누락 가능(광주 남구가 실제 사례). 완전히 고치려면 시/군/구 단위 재수집 필요 — 다음 세션 과제로 보류.

### Domain02(전문가상담) 기획 교차검토 — `docs/04_inheritance_tax/15_전문가상담_도메인_상업화_및_구체화_명세서.md`

- Gemini가 작성한 4대 전문가(세무사/변호사/행정사/장례지도사) 상업화 명세서 검토 중 **문서 내부 모순 발견**: 3.2/3.4절(Tier 2/4 성과연동 수수료)이 변호사 카테고리에도 일반 적용되는 것처럼 서술된 반면, 4.1절은 "변호사는 성과 수수료 전면 배제, 100% 합법"이라 선언 — 3.4절의 "소송 수임 전환 시 마케팅 수수료 정산"은 정확히 변호사법 제34조가 금지하는 구조라 자기모순.
- 추가로 "로톡 대법원 판결로 100% 합법" 근거도 과장 — 실제로는 변협의 일률 금지 징계가 위헌이라는 취지지, 알선수수료 자체를 합법화한 게 아님.
- Gemini가 즉시 보완: 2절에 직역별 성과수수료 허용여부 표 추가, 3절 다이어그램을 변호사(Tier1+3만)/세무사·행정사·지도사(Tier1~4) 두 갈래로 분리, 3.2/3.4절에 "⚠️ 변호사 예외 규정" 명시, 4.1절 로톡 판례 서술을 정확한 뉘앙스로 정정. 재검토 결과 모순 해소 확인.

### docs/14(답사예약 vs 직통전화) 검토 — Claude 의견 기록

- 사용자가 Gemini에게 "전화 연결되는데 굳이 답사예약 폼이 필요한가" 질의 → Gemini의 `docs/01_funeral_facility/14_...md`는 "대안1: 하이브리드 투트랙(비제휴=전화만, 제휴=예약폼만)"을 추천.
- **Claude 의견(참고사항으로 기록)**: 논리 자체는 타당하나, 현재 `Facility.isPartner`가 전부 `false`(제휴 프로그램 자체가 아직 미구축)라 지금 그대로 적용하면 답사예약 폼이 서비스 전체에서 사라지는 결과 → 제휴 프로그램이 실제로 생기기 전까지는 현 상태(전화+예약폼 공존)를 유지하고, 온보딩 시점에 맞춰 단계적으로 전환할 것을 권장.

### 세션 종료 상태

- 사용자 휴가로 세션 일시 중단. 미커밋 상태 유지. `docs/13`(가격비교 A+C 하이브리드) 착수는 사용자가 실제 회사 대표님과 상의 후 결정 예정.

---

## 2026-08-05 — legal/compliance: 변호사법 제34조 정밀 준수 & 전문가 상담 수익 모델 직역별 분리 (`docs/04_inheritance_tax/15_전문가상담_도메인_상업화_및_구체화_명세서.md`)

### 검증 배경 및 모순 교정
- Claude와의 2차 정밀 교차 검증 중 **변호사법 제34조(소개/알선/수임료 분배 금지)**와 관련하여 문서 15번 내의 모순 및 과장 표현을 발견하고 즉시 정정 조치함.
- 기존 문안에서 "소송 수임 시 리드 수수료 수취"라는 표현이 변호사법 제34조 위반 행위에 해당하는데도 4.1절의 "수수료 금지" 선언과 충돌하는 **자기모순(Self-Contradiction)**을 지적받음.
- 로톡 관련 판례 역시 "리드 수수료 무조건 합법"이 아니라 "변협의 일률적 플랫폼 이용 금지 징계가 부당하다"는 취지이므로 과장 표현을 현실적으로 수정.

### 보완 및 기획 반영 결과
- [`docs/04_inheritance_tax/15_전문가상담_도메인_상업화_및_구체화_명세서.md`](docs/04_inheritance_tax/15_전문가상담_도메인_상업화_및_구체화_명세서.md) 및 [`reports/이어봄_전문가상담_도메인_상업화_보고서.html`](reports/이어봄_전문가상담_도메인_상업화_보고서.html) 갱정 완료:
  1. **⚖️ 변호사 직역 (변호사법 제34조 100% 준수)**:
     - **[Tier 2/4 성과 연동 수수료 전면 금지 및 제외]**
     - 오직 **[Tier 3: 순수 고정 월정액 광고료 모델 (B2B SaaS)]**만 적용하여 수임료 분배 오해를 근본 차단.
  2. **📊 세무사 / 행정사 / 장례지도사 직역**:
     - 관련 직역법 범위 내에서 **[Tier 2 1:1 상담 수수료]** 및 **[Tier 4 대행 리드 수수료]** 적용 허용.

---

## 2026-08-05 — legal/compliance: 위치정보법(LBS) 2단계 법률 검토 보완 (`docs/01_funeral_facility/12_공공데이터_및_API_상업적_이용_법률_검토서.md`)

### 검증 배경 및 핵심 발견
- Claude와 사용자 간의 실데이터 API 교차 검증 중 **"위치기반서비스사업자 신고 필수"** 반려 경고가 확인됨.
- 기존 `docs/12` 기획 서류가 공공데이터법(제3조/제26조, KOGL 제1유형) 기반 상업적 이용 합법성만 다루고, **「위치정보의 보호 및 이용 등에 관한 법률(위치정보법 제9조)」** 규제 층위를 누락했음을 감지.
- **공공데이터법**("이 데이터를 영리로 써도 되는가" ➔ 100% 합법)과 **위치정보법**("유저 GPS 기반 위치 매칭 서비스를 방송통신위원회 신고 없이 가동할 수 있는가")은 전혀 다른 층위의 법적 규제임.

### 보완 및 기획 반영 결과
- [`docs/01_funeral_facility/12_공공데이터_및_API_상업적_이용_법률_검토서.md`](docs/01_funeral_facility/12_공공데이터_및_API_상업적_이용_법률_검토서.md) 문서를 **2단계 법률 검토 체계(Dual-Layer Framework)**로 대폭 보완 갱신:
  1. **[트랙 A] 실시간 유저 GPS 기반 LBS 매칭 (`navigator.geolocation`)**: 위치정보법상 LBS 사업자 신고 대상. KCC/KISA 정식 사업자 신고 진행 (2~4주).
  2. **[트랙 B] 행정동/검색어 선택 기반 지도 탐색 (신고 면제 우회 기획)**: 유저의 개인 GPS를 실시간 채집하지 않고 "서울 강남구" 등 행정동/검색어를 직접 선택하게 하는 방식. **개인위치정보 처리가 없어 위치정보법 규제 대상에서 완전히 제외되어 즉시 100% 합법 구동 가능!**
  3. **[트랙 C] 문서 13 대안 A (표준 견적 시뮬레이터)**: 위치정보와 무관한 통계 평균 수가 가이드이므로 위치정보법과 무관 (안전).

---

## 2026-08-05 — Domain01 장례·묘지 매칭 기능 2단계: 실데이터 수집(카카오+공공 CSV) + 서버 페이지네이션

### 배경

1단계에서 만든 Facility 백엔드는 목업 14건뿐이었음. docs/10 2.2("주소/위경도 100% 실연동")를 실제로 채우기 위해 실데이터를 수집. 원래 후보였던 보건복지부 "전국 장례식장 현황" OpenAPI(data.go.kr)는 위치정보 포함 공공데이터라 **위치기반서비스사업자 신고**(방송통신위원회, 사업자 단위 행정 절차)가 필요해서 배제 — 사용자가 아직 사업자 신고 대상이 아니라고 판단.

### 구현 결과

- **카카오 로컬 API로 장례식장 실데이터 수집** (`prisma/sync-kakao-funeral.ts`): 17개 시도 × "장례식장" 키워드로 검색, `category_name`이 `가정,생활 > 장례 > 장례식장`인 것만 채택. 카카오 자체 상업 API라 정부 공공데이터의 위치기반서비스 신고 요건과 무관 — 별도 신고 없이 사용 가능. **590건** 수집.
- **공공데이터 CSV로 봉안시설/자연장지 실데이터 임포트** (`prisma/import-facility-csv.ts`): 사용자가 확보한 보건복지부 CSV 2개(`봉안시설 현황` 694건, `자연장지 현황` 262건, CP949 인코딩)를 `csv-parse`로 파싱, 위경도가 없어 카카오 주소검색 API로 지오코딩. **948건** 임포트(지오코딩 실패 8건 스킵).
- `Facility`에 `kakaoPlaceId`(카카오 dedup용), `phone` 필드 신규 추가. CSV 소스는 `bongan_NNN`/`jayeon_NNN` 결정론적 ID로 upsert.
- 최종 DB: 총 **1552건** (목업 14 + 카카오 590 + CSV 948). docs/10의 "전국 1,100여 개" 목표를 사실상 상회.
- 프론트: 카드에 실데이터 보유 시설만 전화 문의(`tel:`) 버튼 노출.

### 🐛 사고: 마이그레이션 중 DB 전체 데이터 유실 (즉시 발견·공유)

`prisma migrate diff --shadow-database-url` 명령에 **shadow(임시 작업용) DB URL 자리에 실제 운영 DB의 `DATABASE_URL`을 그대로 사용**하는 실수를 함. Prisma가 이를 "초기화해도 되는 임시 스키마"로 인식해 실제 DB의 모든 테이블 내용을 지웠다가 마이그레이션만 재적용(테이블 구조는 유지, 데이터는 0건). 그 결과:
- 목업 Facility 14건 삭제 → `npm run seed`로 즉시 복구 완료.
- **User/SocialAccount 실데이터 삭제** (1단계에서 카카오·네이버·구글 3사 연동 테스트했던 실제 계정) → 복구 불가, 사용자가 재로그인 필요.
- 이후 생성된 카카오/CSV 실데이터(1538건)는 사고 이후 작업이라 영향 없음.
- **재발 방지**: `migrate diff --shadow-database-url`은 반드시 메인 DB와 무관한 별도 DB(또는 Prisma가 자동 생성하는 shadow DB)를 가리켜야 함. 다음부터는 이 플래그 자체를 피하고, non-interactive 환경에서 마이그레이션이 필요하면 SQL을 직접 작성해 `docker exec psql`로 적용하는 방식(이미 여러 번 써온 안전한 패턴)만 사용하기로 함.

### 서버사이드 페이지네이션 추가 (사용자 실사용 중 발견)

- 1552건을 프론트에서 한 번에 fetch+렌더링하니 로딩이 느려짐 — 사용자가 직접 발견하고 페이지당 30~50건 + 페이지 번호 UI를 요청.
- `GET /api/facilities`에 `category`/`region`/`religion`/`guests`/`budget`/`radius`+`lat`/`lng`/`page`/`pageSize` 쿼리파라미터 지원 추가, 기존 프론트 클라이언트 필터 로직을 Prisma `where`절로 그대로 이전. 반경(LBS) 필터가 켜진 경우만 조건에 맞는 전체를 가져와 메모리에서 거리순 정렬 후 페이징(그 외엔 DB `skip`/`take`로 처리, 1500건 규모에서도 빠름).
- `FacilityPage.tsx`: 필터 변경 시 쿼리파라미터로 재요청, 필터 변경 시 1페이지로 리셋, 하단에 페이지 번호(이전/1~N/다음) UI 추가.
- 검증: "서울" 필터 시 61건 중 5건씩 13페이지로 정상 응답 확인.

### 알려진 한계

- 카카오 장례식장 검색은 지역별 최대 45건 상한(Kakao API 자체 제약)이 있어 대도시는 실제보다 적게 수집됐을 수 있음.
- 가격/종교/하객수/평점은 여전히 플레이스홀더 — e하늘 실가격 연동은 공공데이터 사업자신고 문제가 풀려야 가능.
- 미커밋 상태로 세션 진행 중.

---

## 2026-08-05 — Domain01 장례·묘지 매칭 기능 1단계: Facility 백엔드 전환 + 리뷰/예약 실기능 (docs/10 기반)

### 배경

`FacilityPage`가 지금까지 프론트 하드코딩 목업(`mockData/facilities.json`, 14건)만으로 동작 — 별점 고정값, 답사 예약은 `alert()`만 띄우고 미저장, 리뷰 작성/조회 UI 자체가 없었음. `docs/10_장례_묘지_매칭_기능_명세서.md` 기획에 따라 1단계로 실 백엔드 전환.

### 구현 결과

- **Prisma 스키마**: `Facility`(위치/가격/평점/태그/편의시설/VR이미지/견적분해/`isPartner`), `FacilityReview`(1인 1리뷰, `@@unique([facilityId, userId])`), `FacilityBooking`(PENDING/CONFIRMED/CANCELLED) 신설.
- **시드**: 기존 프론트 목업 14건을 `backend/prisma/seed-data/facilities.json`로 이전, `prisma db seed`로 upsert 기반 시딩(재실행 안전).
- **API**: `GET /api/facilities`(전체 목록, 리뷰 임베드), `GET /api/facilities/:id`, `POST /api/facilities/:id/bookings`(인증), `POST /api/facilities/:id/reviews`(인증, 1인 1리뷰 409 처리).
- **평점 계산 규칙**(docs/10 2.1 그대로 구현): 리뷰 5건 미만이면 시딩된 `Facility.rating`, 5건 이상이면 `AVG(rating)`을 `effectiveRating`으로 응답.
- **프론트**: `FacilityPage.tsx`가 목업 import 대신 `GET /api/facilities` fetch로 전환(기존 클라이언트 필터링 로직은 100% 유지), `BookingModal.tsx`가 실제 `POST .../bookings` 호출, 신규 `FacilityReviewModal.tsx`(리뷰 목록 + 별점/텍스트 작성 폼, 로그인 게이팅은 `BookingModal`과 동일 패턴) 추가.
- `mockData/facilities.json`은 더 이상 참조하는 곳이 없어 삭제.

### 명세서 대비 보완/단순화 (Gemini 검토 필요)

| # | 명세서 원안 | 보완 |
|---|---|---|
| 1 | "실제 답사/상담/장례를 완료한 검증된 이용자"만 리뷰 작성 | 완료 인증 체계가 없어 "로그인 유저 1인 1리뷰"로 단순화 |
| 2 | `FacilityTag` 관계 테이블(암시적 언급) | 태그 관리 UI/어드민이 없어 `Facility.tags String[]` 스칼라 배열로 단순화 |
| 3 | `GET /api/facilities` 쿼리파라미터(`category`/`lat`/`lng`/`radius`) 서버 필터링 (docs/04) | 14건 규모라 전체 목록만 반환, 필터링은 프론트 기존 로직 그대로 유지 — 데이터 규모 커지면 재도입 필요 |

### 검증 상태

- 백엔드/프론트 `tsc --noEmit` 0 에러.
- `curl localhost:5000/api/facilities` 14건 + `effectiveRating` 확인.
- 브라우저 E2E: 필터 정상 동작, 답사 예약 실제 DB 저장 확인, 리뷰 작성 성공 + 카드 별점 갱신 확인, 동일 유저 재작성 시 409 차단 확인.
- 버그 발견·즉시수정: 리뷰 등록 시 부모 목록(`facilities`)만 갱신되고 열려있는 리뷰 모달 자체는 스냅샷이라 반영 안 되던 문제 — 모달에도 갱신된 데이터를 반영하도록 수정 + 등록 성공 메시지 추가.
- 미커밋 상태 (이번 Facility 도메인 작업분).

### 다음 단계 (이번 범위 제외, 로드맵)

- 카카오 로컬 REST API로 전국 실데이터 수집·동기화 (백엔드에 카카오 REST 키 이미 있음)
- 보건복지부 e하늘 API 연동 (data.go.kr 공공데이터 API 키 미보유 — 사용자 발급 필요)
- 제휴/비제휴 하이브리드 배지·최상단 고정·VR 뷰어 게이팅 UI
- 2단계 하이브리드 답사예약 자동화(제휴 알림톡/비제휴 해피콜 대행)

---

## 2026-08-05 — FE 디자인 시스템 점검, 기획-스펙 동기화 및 명세서 분리 (docs/10, docs/11)

### 배경 및 기획 판단
프론트엔드 코드와 DESIGN.md 간의 톤앤매너 불일치, 긴급 애니메이션 누락, GNB 구조 및 24시 긴급콜 위치 괴리를 검토하고 기획적 판단을 내림. 또한 `DESIGN.md`에 결합되어 있던 스타일과 기능 명세를 `docs/10_장례_묘지_매칭_기능_명세서.md` 및 `docs/11_디자인_시스템_및_스타일_가이드.md`로 깔끔히 분리·정돈함.

### 주요 결정 사항
1. **GNB vs 사이드바:** 현행 '좌측 호버 확장 사이드바(Left Collapsible Sidebar)'가 탐색 효율 면에서 더 우수하다고 판단하여 유지 결정 및 문서 갱신.
2. **24시간 긴급콜:** 우하단 고정 플로팅 버튼(FAB)이 스크롤 시 접근성이 우수하여 승인 및 애니메이션(.animate-pulse) 복구 지시.
3. **골드 컬러 통일:** 구버전 `#D97706` 제거 후 공식 Warm Gold `#D4A359`로 일괄 통일 명시.
4. **장례 매칭 5대 데이터 & 전국 수집 전략:**
   - 별점(자체 리뷰 DB), 주소(카카오 로컬 API), 기본 비용(보건복지부 e하늘 Open API), 해시태그, 답사예약(2단계 하이브리드) 5종 모두 유지.
   - 전국 1,100여 개 장례식장 데이터 100% 수집 노출 + 제휴 파트너 시설 뱃지/VR/우선 노출 로직 정립.
5. **하네스 문서 구조화:**
   - `docs/10_장례_묘지_매칭_기능_명세서.md` 신규 작성
   - `docs/11_디자인_시스템_및_스타일_가이드.md` 신규 작성
   - `docs/00_DOCS_INDEX.md` 마스터 목차 업데이트 완료

---

## 2026-08-05 — 소셜 로그인 3사 연동 + 계정 통합 기능 (docs/09 기반)

### 배경

`eobom/backend`가 harness 정규 파이프라인(`implementation_plan.md` 없이) 밖에서 이미 스캐폴딩된 채로 발견되어, 이번 사이클에서 (1) 기존 스캐폴딩 검증·완성, (2) 카카오/네이버/구글 실제 연동, (3) `docs/09_소셜로그인_및_계정통합_명세서.md` 구현을 순서대로 진행함.

### 구현 결과

**1) 백엔드 기초 검증**
- `npm install`, `tsc --noEmit`, `prisma generate` 통과. `/api/health`, `/api/auth/demo-login`, `/api/auth/me`, OAuth 리다이렉트 4종 실호출 검증.
- Postgres를 Docker(`eobom-postgres`, 로컬 5433 포트)로 기동, Prisma 마이그레이션 반영.

**2) 카카오·네이버·구글 실 OAuth 연동**
- 3사 모두 앱 등록 → `.env` 반영 → 브라우저 로그인 → DB 저장까지 실검증 완료.
- `import 'dotenv/config'` 순서 버그 수정 (환경변수 로드 전에 passport 전략이 먼저 읽던 문제).
- 재로그인 시 기존 세션을 조용히 재사용하지 않고 매번 재인증하도록 provider별 정책 적용: 카카오 `prompt=login`, 네이버 `authType=reauthenticate`, 구글 `prompt=select_account`.
- 로그인 실패 리다이렉트가 프론트가 아닌 백엔드 자기 자신(404)으로 향하던 버그 수정, 프론트에 provider별 에러 메시지 처리 추가.

**3) 계정 통합 기능 (docs/09 명세서 기반)**
- Prisma 스키마: `User` 1 : N `SocialAccount`로 정규화 (`User.email` 대표 이메일 UNIQUE / `SocialAccount`가 provider+providerId 보유).
- `handleSocialLoginCallback`: ① 연동 기록 있으면 즉시 로그인 → ② 없지만 동일 이메일 기존 유저 있으면 10분 만료 임시 토큰 발급 후 `#socialLinkPrompt`로 리다이렉트 → ③ 완전 신규면 User+SocialAccount 동시 생성.
- `POST /api/auth/confirm-link` (MERGE/CREATE_NEW), `GET /api/auth/:provider/link`(마이페이지 추가 연동, 서명된 OAuth state로 기존 콜백 재사용), `DELETE /api/auth/unlink-provider`(최소 1개 유지) 구현.
- 프론트: `SocialLinkModal.tsx`(계정 통합/독립 가입 선택), `MyPageAuthSettings.tsx`(헤더 "계정 설정" → 연동 목록/추가/해제) 신규.

### 명세서 대비 보완 사항 (Gemini 검토 요청)

| # | 명세서 원안 | 문제 | 보완 |
|---|---|---|---|
| 1 | `User.email` UNIQUE + "독립 신규 가입" 옵션 | 이미 쓰이는 이메일로 새 User 생성 시 유니크 위반 | `CREATE_NEW` 시 `User.email = null`, 실제 이메일은 `SocialAccount.email`에만 보존 |
| 2 | `POST /api/auth/link-provider` (단순 JSON API) | 소셜 계정 소유권을 검증할 방법이 없음 | `GET /api/auth/:provider/link`로 변경, 실제 OAuth 재인증 흐름으로 구현 (기존 콜백 라우트 재사용, 리다이렉트 URI 추가 등록 불필요) |
| 3 | (명세서에 언급 없음) | 기존 평면 User 구조 테스트 데이터 3건을 새 정규화 구조로 자동 이관 필요 | 테스트 데이터라 사용자 승인 하에 삭제 후 재로그인으로 대체 (실사용자 데이터였다면 별도 이관 스크립트 필요) |

### 검증 상태

- ✅ 백엔드 타입체크 / curl 기반 라우팅·리다이렉트·OAuth state 흐름 검증
- ✅ 카카오·네이버·구글 각각 단독 로그인 브라우저 E2E (DB 저장 확인)
- ✅ 이메일 중복 감지 시나리오(서로 다른 2개 provider가 동일 이메일 보유) 브라우저 E2E — MERGE/CREATE_NEW 두 분기 모두 검증 (2026-08-05, DB 임시 조작으로 분기 강제 유발 후 원상복구, 재현 절차는 `claude_tasks.md` 참고)
- ✅ `MyPageAuthSettings` link/unlink 브라우저 E2E (2026-08-05): 연동 해제(2회 성공) → 최소 1개 유지 규칙 차단 확인 → 재연동(link) 2회 성공, 최종 3사 전부 원상복구
- 🐛 → ✅ **사용자 제보 버그 수정**: 연동 해제한 provider로 재로그인 시 중복 계정이 조용히 생성되는 문제 발견. `SocialAccount` 연동 해제를 하드 삭제에서 소프트 삭제(`unlinkedAt`)로 전환해 재로그인 시 기존 계정으로 정확히 복구되도록 수정, 실 시나리오로 재검증 완료. 상세 원인·수정 내역은 `claude_tasks.md` 참고.
- git 커밋 2건(폴더 리네임 / 백엔드+소셜로그인+버그수정) + push 완료, Vercel Root Directory `eobom/frontend`로 갱신 후 Redeploy Ready 확인 (2026-08-05)

### 다음 세션 연결 작업

- [ ] 백엔드(`eobom/backend`)는 아직 어디에도 배포 안 됨 — 실서비스에서 소셜 로그인 쓰려면 별도 호스팅(Railway/Render 등) + 프로덕션 OAuth 콜백 URL/리다이렉트 URI 등록 필요
