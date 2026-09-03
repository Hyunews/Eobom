# 🧭 walkthrough.md — 구현 완료 보고 (Gemini ↔ Claude 교차 검토용)

> `claude_tasks.md`(살아있는 실무 로그)에서 완료된 사이클만 추려 정제한 문서.
> Gemini가 "기획대로 구현됐는지" 확인하는 용도. 최신 항목이 위로 오게 기록.
> 2026-08-07부터 5개 필드 고정 형식 사용 (`.harness/record.md` §1. 2026-08-10 이전엔 `roles.md` §3에 있었음).


> 🔴 **2026-09-02 — 판정이 끝난 옛 항목은 아카이브로 옮겼습니다.**
> [`walkthrough_아카이브_2608.md`](walkthrough_아카이브_2608.md)
> **아직 판정이 안 난 항목은 옮기지 않습니다** — 게이트는 이 파일 한 곳입니다(`AGENTS.md` §2).
> 아카이브 기준 = *판정 완료 && 최근 12건 밖*. 근거 → `.harness/_meta/크레딧_소모_실측_260902.md`
> 🔵 **2차 아카이빙(같은 날)** — wt 46~101 전량 판정 후 17건을 더 옮겼습니다(141KB → 43KB).
> 🔴 **작아졌다고 통독하지 않습니다.** `read-guard.js`가 이 파일을 **크기와 무관하게 이름으로**
> 막습니다 — 줄어든 크기를 근거로 여는 순간 아카이빙이 손해로 뒤집힙니다.

---
## 2026-09-03 (115) | [Sonnet] `00-35` §10.3 2.5단계 — `SectionTimingControl` 호출부 승격

- **근거 스펙**: `docs/00_핵심플랫폼/00-35_엔딩노트_페이지_구조_정리_명세서.md` §10.3 (2026-09-03 사람 승인, 착수 지시 그대로).
- **건드린 파일**: `eobom/frontend/src/pages/EndingNotePage.tsx`
- **결과**: `sectionBodies`의 LIFE_SUPPORT·FUNERAL·ASSET·DIGITAL_ACCOUNTS·INSURANCE·CONTACTS·WILL_LOCATION·ORGAN_DONATION 8곳 끝에서 `<SectionTimingControl section="..." family={family} grants={grants} onChange={(designationId, timing, grantId) => handleGrantChange('...', designationId, timing, grantId)} />`(6줄×8=48줄)를 전부 삭제하고, `SECTIONS.map` 렌더 루프의 `{sectionBodies[s.code]}` 바로 뒤에 `<SectionTimingControl section={s.code} family={family} grants={grants} onChange={(designationId, timing, grantId) => handleGrantChange(s.code, designationId, timing, grantId)} />` 1곳만 추가했다. grep 확인 결과 `SectionTimingControl` 호출은 파일 전체에 1곳만 남음(WILL_DRAFT는 순회 밖이라 미영향, §5.3 그대로). `SECTIONS`(constants.tsx) 8개 코드와 `SECTION_ALLOWED_TIMINGS` 8개 키가 정확히 일치함을 확인(§10.3 주의 3 — s.code 어긋남 없음). `npx tsc --noEmit`(frontend) 에러 0, `npm run build`(frontend) 통과 — 파일 817줄(기존 859줄 대비 −42줄, 청크 크기 경고 외 신규 경고 없음).
- **편차**: 없음.
- **다음 에이전트가 알아야 할 것**: 브라우저 실기동은 하지 않았다 — 사람이 §7 전체(0~8번, 특히 8번을 8섹션 전부)를 직접 진행할 예정(2026-09-03 사용자 지시, 크레딧 절약). 통과 확인 전까지 "완료"로 취급하지 않는다.

<!-- Gemini 판정 1줄: 대기 -->

## 2026-09-03 (114) | [Sonnet] `MyObituaryListPage` 삭제 안내문구 + 카드별 피드백 위치 수정

- **근거 스펙**: 전용 스펙 없음 — 사람 지시(2026-09-03, wt112 후속). (1)"삭제 버튼 클릭 시 부고장만 삭제된다는 설명이 떠야 함" (2)"여러개의 추모관 div가 있을 때, 해당 div 아래에 떠야 하는데 상위 div 하단에 떠" 두 건 대응.
- **건드린 파일**: `eobom/frontend/src/pages/MyObituaryListPage.tsx`
- **결과**: 삭제 확인 `window.confirm` 문구가 "부고장만 삭제됩니다. 추모관은 삭제되지 않고 그대로 유지됩니다."로 시작하도록 바꾸고(기존 되돌리기 없다는 경고는 그 뒤에 이어붙임), 전역 `shareFeedback: string` 상태를 카드 `id`를 함께 들고 다니는 `feedback: {id, message} | null`로 바꾸고, 렌더 위치를 `.map()` 바깥쪽 목록 하단에서 각 카드 안(`{feedback?.id === o.id && ...}`)으로 옮겨 카드별로 정확히 그 아래에 뜨도록 고쳤다. `shareObituary`·`copyMemorialAddress`·`deleteObituary` 세 호출부 모두 `setFeedback({id: o.id, message})`로 갱신. tsc --noEmit(frontend) 통과.
- **편차**: 없음.
- **다음 에이전트가 알아야 할 것**: 문구가 카드 단위 상태라 한 번에 한 카드에서만 뜬다(동시에 여러 카드에서 뜨지 않음). 실기동 검증은 사람이 진행(wt113 방식)하는 것으로 대기.

<!-- Gemini 판정 1줄: 대기 -->

## 2026-09-03 (113) | [Opus] 사람 실기동 검증 결과 기록 — wt108~111

- **근거 스펙**: `05-01` §6.1-1(`/m/:slug`) · `07-03` §7(공유 폴백 사다리) · `00-06` §8(`SCR-018`).
  wt108~111은 `tsc`·`build`만 통과한 채 walkthrough에 **"실기동 검증 대기"** 로 남아 있었다.
  2026-09-03 **사람이 직접 실기동**해 확인한 결과를 옮겨 적는다. 🔴 **검증 주체는 사람이고 Opus는 기록만 했다** — 아래 결과는 전언이므로, 재현 조건이 필요하면 사람에게 되묻는다.
- **건드린 파일**: 없음(코드·브라우저 조작 없음). 기록만 — 이 항목 + `.harness/memory/context.md`.
- **결과**:
  - **wt108 `/m/:slug`** — ✅ **배포(vercel) 기준 통과**: 헌화 카운트·방명록 정상 작동 확인.
    ❌ 단, **로컬에서 `/m/:slug` 진입 시 404 + "추모관을 찾을 수 없습니다"** 가 떴다(→ 편차).
    로컬 검증이 애초에 불가능했던 이유: **로컬에서 만든 부고장 링크를 카톡으로 보내도 수신 측은
    `vercel.app`(배포)로 접속**된다 — 공유 카드에 박히는 절대 URL이 배포 도메인이라서다.
  - **wt109 추모관 공유 버튼** — ❌ **공유 시트가 이상하게 뜸**. 그래서 추모관은 공유 대신
    **"주소 복사"** 로 바꾸기로 결정했고, 그 수정이 wt111이다(부고장은 카톡 공유 유지).
  - **wt110 `SCR-018` 내 부고장·추모관** — ✅ 목록 렌더링 · 공유 · 헤더를 통한 이동 모두 정상.
  - **wt111 공유 방식 분리** — ✅ **카톡 공유 정상 작동**.
    ❌ **클립보드 복사 완료 문구가 배포 페이지에서 안 뜬다**(dev에서는 뜬다) — 아래 참고.
- **편차**: 두 건이 **원인 미확정**이다. "없음"으로 덮지 않는다.
  1. **wt108 로컬 404** — 배포에서 같은 경로가 정상이므로 코드 결함보다 **로컬 DB에 그 `slug`의
     추모관 행이 없어서**일 가능성이 크다(카톡 링크가 배포로 가니 같은 데이터를 로컬에서 열 수 없다).
     🔴 다만 **확인한 것은 아니다.** 로컬 재현 조건이 서기 전까지 wt108은 **배포 기준으로만 통과**로 본다.
  2. **wt111 클립보드 토스트 미표시** — 🔵 **같은 날 wt114에서 잡혔다.** 처음엔 dev↔배포 환경
     요인(HTTPS·권한·`navigator.clipboard` 폴백)을 의심했는데 **틀렸다** — 전역 상태라 문구가
     목록 맨 아래(마지막 카드 밖)에 떴고, dev는 카드가 1개라 우연히 맞았던 것뿐이다.
     원인이 짐작과 달라 **`TS-003`으로 승격**했다(`트러블슈팅/TS-003_환경차이_오인_피드백_렌더위치.md`).
- **다음 에이전트가 알아야 할 것**:
  - 🔵 **앞으로 실기동 검증은 사람이 직접 한다**(2026-09-03 사람 지시, 크레딧 절약).
    에이전트는 `tsc`·`build`까지 하고 **"실기동 검증 대기"** 로 넘긴 뒤 멈춘다 — dev 서버를 띄우지 않는다.
  - 클립보드 토스트는 **사람이 Sonnet에게 직접 요청해 wt114로 해결**됐다(→ `TS-003`).
  - wt112(삭제 기능)·wt114는 이번 검증 범위 **밖**이다 — 여전히 실기동 대기.

<!-- Gemini 판정 1줄: 대기 -->

---
## 2026-09-03 (112) | [Sonnet] `MyObituaryListPage` 삭제 기능 신설 — 진행중/종료 버튼 분기

- **근거 스펙**: 전용 스펙 없음 — 사람 지시(2026-09-03, MyObituaryListPage 후속). "진행중일 경우 수정/삭제 버튼을 각각 두고, 종료된 부고장은 삭제 버튼만"이 요구 전문.
- **건드린 파일**: `eobom/backend/src/controllers/obituaryController.ts`(`deleteObituary` 신설), `eobom/backend/src/routes/obituaryRoutes.ts`(`DELETE /:id` 등록), `eobom/frontend/src/pages/MyObituaryListPage.tsx`(버튼 분기 + `deleteObituary` 핸들러)
- **결과**: "내가 만든 부고장" 목록에서 기존 단일 "관리" 버튼을 제거하고, `isClosed===false`면 "수정"(`/obituary?slug=`로 이동)+"삭제" 두 버튼을, `isClosed===true`면 "삭제" 버튼만 렌더하도록 분기했다. 삭제는 새 엔드포인트 `DELETE /api/obituaries/:id`를 호출하고(개설자 본인 확인 후 `prisma.obituary.delete`, 되돌리기 없음), 클릭 전 `window.confirm`으로 막는다(`handleCloseObituary`와 같은 패턴). Obituary만 지우고 Memorial·Deceased는 남겨둔다(ObituaryMourner는 schema.prisma의 `onDelete: Cascade`로 함께 정리). tsc --noEmit(frontend·backend) 통과.
- **편차**: 없음(전용 스펙이 없어 이번 구현이 곧 스펙이다). 다만 종료된 부고장도 완전 삭제 가능하게 한 것은 Memorial의 `closedAt`/`purgeAt` 소프트삭제·보존기간 정책(00-20 §8.1)과는 별개로, Obituary 단독 하드삭제로 구현했다 — 정책과 충돌 여부는 확인 필요.
- **다음 에이전트가 알아야 할 것**: 삭제는 부고장(Obituary)만 지우고 추모관(Memorial)은 남는다 — "부고장=봉투/추모관=목적지"(E안) 설계를 따른 것. 삭제 후에도 추모관 자체는 `/api/me/memorials` 쪽에서 계속 조회 가능하다. 실기동 검증 대기.

<!-- Gemini 판정 1줄: 대기 -->

## 2026-09-03 (111) | [Sonnet] `MyObituaryListPage` 공유 방식 분리 — 부고장 카톡 / 추모관 주소복사

- **근거 스펙**: 전용 스펙 없음 — 사람 지시(wt110 직후, 2026-09-03). 부고장 공유는 카카오톡
  링크로 연결돼야 하고, 추모관 쪽은 "공유" 대신 "주소 복사"로 바꿔 주소만 복사되게 하라는
  구체 지시. `07-03` §7 폴백 사다리(1순위 Kakao.Share→2순위 WebShare→3순위 복사)와
  `ObituaryPage.tsx`의 기존 구현 패턴을 그대로 재사용해 반영.
- **건드린 파일**: `eobom/frontend/src/pages/MyObituaryListPage.tsx`.
- **결과**:
  - 부고장 "공유" 버튼 — `shareViaWebShareApi` 단독 호출에서 `ObituaryPage.tsx`와 동일한
    3단 사다리(`shareViaKakao`→`shareViaWebShareApi`→`copyObituaryLink`)로 교체.
    `Kakao.Share.sendDefault`가 클릭 핸들러 안에서 동기 호출돼야 팝업 차단을 피하므로
    `ensureKakaoShareReady()`를 마운트 시 `useEffect`로 미리 불러둠. 카드 문구는 기존과
    동일하게 `formatObituaryCardTitle/Description` 재사용, 이미지는 `OBITUARY_CARD_IMAGE_URL`.
  - 추모관 쪽 버튼 — 이름을 "공유"→"주소 복사"로 바꾸고 아이콘도 `Share2`→`Copy`로 교체,
    동작도 공유 시트를 거치지 않고 `copyObituaryLink`만 호출하도록 단순화(`shareMemorial` →
    `copyMemorialAddress`로 이름 변경).
- **검증**: `npm run build`(frontend) 통과, 번들 527.54 kB(gzip 151.17 kB). 브라우저 실동작
  (카톡 공유 시트 노출, 클립보드 복사 문구)은 dev 서버를 띄우지 않아 미확인.
- **편차**: 없음 — 사람 지시 그대로.
- **다음 에이전트가 알아야 할 것**: 없음.

---
## 2026-09-03 (110) | [Sonnet] `SCR-018` 내 부고장·추모관 — 헤더 진입점 신설

- **근거 스펙**: `docs/00_핵심플랫폼/00-06_화면_설계서_및_와이어프레임.md` §8(`SCR-018`,
  2026-09-03 등재) — 개설자 본인의 부고장·추모관 목록 + 받은 링크 입력 화면. 서버 선행으로
  `GET /api/me/obituaries` 신설 지시(`07-03` §9 9-2 승격). 사람 지시(2026-09-02, "header의
  추모관 클릭 시 본인이 생성한 부고장에 접근 가능하도록" + "①목록 페이지 신설 ②헤더 연결")와
  Opus의 독립 스펙 발행이 같은 결론으로 수렴한 케이스.
- **건드린 파일**:
  - 신설: `eobom/backend/src/controllers/obituaryController.ts`(`listMyObituaries`),
    `eobom/frontend/src/pages/MyObituaryListPage.tsx`,
    `eobom/frontend/src/utils/memorialLink.ts`.
  - 수정: `eobom/backend/src/routes/meRoutes.ts`(`GET /obituaries` 등록),
    `eobom/frontend/src/components/home/EntryBoxes.tsx`(링크 파싱 로직을
    `memorialLink.ts`로 추출 — 동작 변화 없음, 홈 박스③ 그대로),
    `eobom/frontend/src/pages/ObituaryPage.tsx`(`?slug=` 쿼리 파라미터 지원),
    `eobom/frontend/src/components/Header.tsx`(`goToMemorialEntry`가 `/my-obituaries`로
    직접 이동 — 홈 스크롤 위치 기억용 로직 제거), `eobom/frontend/src/App.tsx`
    (`/my-obituaries` 라우트 등록).
- **결과**:
  - `GET /api/me/obituaries`(`obituaryController.listMyObituaries`) — `createdByUserId`로
    필터, `Obituary.memorial`(1:1, 개설 트랜잭션에서 denormalize된 `deceasedName`·
    `deceasedDeathDate`) include. 응답에 `slug`(부고장)·`memorialSlug`(추모관) 둘 다 포함,
    `isClosed`는 기존 `isObituaryClosed` 헬퍼(발인+3일 자동종료 포함) 재사용.
    `/api/me/memorials`(`listMyMemorials`)는 스펙이 명시적으로 "이미 충분한 별개 엔드포인트"로
    지정해 손대지 않음(중간에 확장 시도했다가 스펙 확인 후 원복).
  - `MyObituaryListPage.tsx` — 2단 레이아웃. ①목록: 행마다 고인명·사망일(또는 개설일)·
    진행/종료 상태 + 부고장(`/o/:slug`)·추모관(`/m/:slug`) 각각 별도의 열기+공유 버튼,
    "관리" 버튼은 `/obituary?slug=<obituarySlug>`(`SCR-013`)로. 공유는 새 메커니즘을 만들지
    않고 `utils/kakaoShare.ts`의 `shareViaWebShareApi`→`copyObituaryLink` 사다리를 재사용
    (부고장 공유는 `utils/obituaryCard.ts`의 `formatObituaryCardTitle/Description`으로 카드
    문구도 통일). ②받은 링크 입력: 기존 `EntryBoxes.tsx` 로직을 그대로 옮긴 것.
  - `ObituaryPage.tsx` — `useSearchParams`로 `?slug=`를 읽어 있으면 localStorage 포인터보다
    우선 사용. 서버가 `isOwner:true`를 준 경우에만 관리 폼을 채우는 기존 보안 모델(§5.3-2,
    2026-08-21 사고 재발방지)은 그대로 — 이 변경은 "어느 slug를 조회할지"만 바꾼다. 조회
    성공 시 localStorage 포인터를 방금 연 부고장으로 갱신(부고장 2개 이상일 때 마지막으로
    연 것이 이어지도록), 404 실패 시엔 `querySlug`가 기존 포인터와 다른 부고장을 가리켰을
    경우 포인터를 지우지 않음(멀쩡한 다른 부고장까지 날리지 않기 위함).
  - `Header.tsx` — "추모관" 메뉴가 홈 박스③이 아니라 `/my-obituaries`로 직접 이동. 이 메뉴는
    로그인 시에만 렌더돼 로그아웃 분기 불필요(스펙 명시). 홈 박스③(`EntryBoxes.tsx`)은
    동작 변경 없이 그대로 유지.
- **검증**: `npx tsc --noEmit -p .`(backend) 통과. `npm run build`(frontend) 통과, 번들
  527.63 kB(gzip 151.15 kB). 브라우저 실동작(목록 렌더링·공유 버튼·링크 입력·헤더 이동·
  `ObituaryPage` `?slug=` 딥링크)은 dev 서버를 띄우지 않아 미확인 — 실기동 검증 대기.
- **편차**: 없음 — `00-06` §8 그대로 구현. (참고: 최초 착수 시 `/api/me/memorials` 확장 +
  `MyMemorialsPage.tsx`라는 이름으로 시작했으나, 구현 도중 `00-06` §8이 발행된 것을 확인하고
  스펙 발행 전 상태로 원복 후 스펙대로 재작성함 — 최종 산출물은 편차 없음.)
- **다음 에이전트가 알아야 할 것**:
  - 스펙 §8.4에 명시된 아웃오브스코프(부고장 수정/종료는 기존 `SCR-013`에 있음, "추모관 개설"
    버튼은 `00-12` §6 모드 UX 확정 후, 별도 "추모관 목록" 계층은 현재 1:1 구조라 불필요)는
    이번에도 그대로 아웃오브스코프로 남겨둠 — 손대지 않음.
  - `docs/00_핵심플랫폼/00-06_화면_설계서_및_와이어프레임.md` 레지스트리의 `SCR-018` 구현
    상태(`*(미구현)*`)를 Opus가 갱신할 차례.

---
## 2026-09-02 (109) | [Sonnet] 추모관 링크 공유 버튼 — 사용자 UX 리포트 대응

- **근거 스펙**: 전용 스펙 없음 — 사용자 실사용 리포트("부고장을 받아 추모관에 들어간 사람이
  URL을 직접 복사하지 않는 이상 주소를 알 방법이 없음"). 기존 확정 패턴 재사용:
  `eobom/frontend/src/pages/ObituaryPage.tsx`(유족용 공유) · `utils/kakaoShare.ts`
  (07-03 §7 폴백 사다리 — WebShare API → 클립보드 복사). `05-01`에 방문자용 공유 버튼 항목이
  없어 그레이존이었으나, `05-01` §2.1 기본 공개범위가 이미 "링크를 아는 사람은 누구나 열람"이라
  복사 버튼이 새 노출 범위를 만들지 않는다고 판단해 스펙 확정 없이 구현.
- **건드린 파일**: `eobom/frontend/src/pages/MemorialLandingPage.tsx`.
- **결과**: `utils/kakaoShare.ts`의 `shareViaWebShareApi`·`copyObituaryLink`(둘 다 이름과 무관하게
  범용 — `url` 인자만 받음)를 그대로 import해 재사용. 근조 헤더 블록 바로 아래, 헌화 섹션 위에
  상시 노출 버튼 "이 추모관 링크 공유하기"(`Share2` 아이콘) 추가. 클릭 시 모바일은
  `navigator.share`(카톡 포함 OS 공유시트) 우선 시도, 실패/미지원 시 클립보드 복사로 폴백하고
  인라인 텍스트로 결과를 알린다(`alert()` 미사용, 1174ee9 이후 방침과 동일). Kakao SDK 피드
  공유(1순위)는 페이지 마운트 시 `ensureKakaoShareReady()`를 부르지 않으므로 이번 범위에서
  제외 — 2단계(WebShare→복사)만 얹었다.
- **검증**: `npm run build`(frontend) 통과, 번들 521.89 kB(gzip 150.03 kB).
  브라우저 실동작(모바일 공유시트 노출, 데스크톱 클립보드 복사 문구)은 dev 서버를 띄우지 않아
  미확인 — 사용자 확인 필요.
- **편차**: 없음(스펙 부재 건이라 편차 판단 대상 아님 — 위 "근거 스펙" 판단 근거 참고).
- **다음 에이전트가 알아야 할 것**:
  - 🟡 `05-01`에 이 버튼이 정식으로 기재돼 있지 않다. Opus가 `05-01` §6.1-1 구성표
    ("영정·고인명·생몰일 / 헌화 버튼 + 누적 수 / 방명록 / 사진 앨범 / 신고 링크")에
    "링크 공유" 항목을 추가해 SSOT로 정리할 필요가 있다.
  - `00-13`(공유 링크 모델 결정서)이 아직 미확정 상태다(`05-01` §2.1 각주). 이번 버튼은
    "이미 링크를 가진 사람의 재전파 편의"일 뿐 새 열람 경로를 만들지 않는다고 보고 진행했으나,
    `00-13`이 링크 모델을 더 폐쇄적으로(예: 1회성 토큰) 확정할 경우 이 버튼이 그 결정과
    충돌할 수 있어 `00-13` 확정 시 재검토 대상이다.

---
## 2026-09-02 (108) | [Sonnet] `/m/:slug` 실배선 — 오픈 블로커 해소(05-01 §6.1-1)

- **근거 스펙**: `docs/05_디지털_추모관/05-01_온라인_추모관_명세서.md` §6.1-1(컴포넌트 분리·범위) ·
  §4.1(공개 API·화이트리스트, `tributeCount` 추가) · §6.1(경로).
- **건드린 파일**: `eobom/backend/src/controllers/memorialController.ts` ·
  `eobom/frontend/src/pages/MemorialLandingPage.tsx`(신설) · `eobom/frontend/src/App.tsx`.
- **결과**:
  - `memorialController.ts` `getMemorialBySlug`: 응답에 `tributeCount`
    (`prisma.memorialTribute.count({ where: { memorialId: memorial.id } })`, `createTribute`와
    동일 쿼리) 추가. 화이트리스트 4필드(`deceasedName`·`deceasedDeathDate`·`portraitUrl`·
    `epitaph`)는 그대로 — 헌화자 목록·식별자는 넣지 않음. 스키마 변경·마이그레이션 없음(조회만).
  - `MemorialLandingPage.tsx` 신설 — `ObituaryLandingPage.tsx`와 동일 구조(껍데기 없는 랜딩 +
    `useParams`로 `slug` + 404 화면). `GET /api/memorials/:slug`·`GET .../guestbook`·
    `POST .../tributes`·`POST .../guestbook`·`POST .../report` 5개 공개 API를 raw `fetch`로 붙임
    (`ObituaryLandingPage.tsx`와 동일하게 `apiFetch` 미사용). 헌화 버튼+누적 수, 방명록
    목록+작성, 신고(2단계 인라인 확인 — `window.confirm`·`alert` 미사용) 구현. 사진 앨범은
    범위에서 제외(공개 조회 API 없음 + 로컬디스크 재배포 소실, `systems.md` §5).
  - `App.tsx`: `/m/:slug` 라우트(310행)를 `MemorialPage` → `MemorialLandingPage`로 교체.
    `/memorial`(409행, 앱 탭 · 예시 데이터 배너)은 `MemorialPage` 그대로 유지.
  - **검증**: `npx tsc --noEmit`(backend) 에러 0 · `npm run build`(frontend) 통과.
    브라우저 실동작(존재하지 않는 slug → 404, 실제 slug → 헌화/방명록 동작)은 dev 서버를 직접
    띄우지 않아 미확인 — 사용자 확인 필요.
- **편차**: 없음.
- **다음 에이전트가 알아야 할 것**:
  - 🔴 **실기동 미검증** — dev 서버(프론트+백엔드) 띄운 뒤 `/m/:slug`에서 없는 slug 404,
    실제 slug 헌화 카운트 증가, 방명록 작성 후 목록 반영을 브라우저로 확인할 것.
  - 헌화 중복(`P2002` → 409)·동결 추모관(`403`)·신고 확정(`report` → 즉시 `PRIVATE`) 3개 예외
    경로는 코드로는 처리했으나 실제 응답으로 검증되지 않았다.
  - 사진 앨범은 이번 범위에서 의도적으로 뺀 것 — `05-01` §6.1-1 표 그대로이며 누락이 아니다.

---
## 2026-09-02 (107) | [Sonnet] 🔴 소급 기록 — 세션 만료(401) alert→로그인모달 전환 + 후속 버그수정

- **근거 스펙**: 스펙 없음 — 사용자 버그 리포트 2건에 대한 즉흥 구현(`00-34` §6 세션만료 콜백
  인프라는 기존 스펙). 커밋 `1174ee9`·`dfb157d`가 게이트 기록 없이 커밋돼 있어 `git show`로
  확인 후 소급 기록.
- **건드린 파일**: `eobom/frontend/src/App.tsx` · `eobom/frontend/src/components/Header.tsx`.
- **결과**:
  - `1174ee9` — "사이트 오래 켜두면 로그인은 되어 있는데 백엔드 연결이 안 된다"는 리포트.
    원인: `handleLogout`의 `alert(notice || '로그아웃 되었습니다.')`가 탭이 백그라운드일 때
    브라우저가 표시를 미루며 JS 스레드를 그대로 붙잡아, `setCurrentUser(null)`은 이미 호출돼
    있어도 리렌더가 막혀 화면이 "로그인 상태"로 멈춰 보이는 것. `notice`가 있을 때(401 세션만료
    콜백)는 `alert` 대신 기존 회원가입 유도용 `openLoginModal({ notice })` 패턴(비차단)으로
    전환, 수동 로그아웃 버튼(`notice` 없음)은 `alert` 유지.
  - `dfb157d` — `1174ee9` 배포 직후 "엔딩노트 페이지에서 로그아웃 시 흰 화면 + React 에러
    #31(객체를 자식으로 렌더할 수 없음)" 리포트. 원인: `Header.tsx:139`
    `<button onClick={onLogout}>`이 클릭 `SyntheticEvent`를 그대로 `notice` 인자로 넘기고
    있었는데, `1174ee9` 이후 `notice`가 진짜로 모달 텍스트 자리에 렌더되면서 이벤트 객체를
    렌더하려다 크래시. `onClick={() => onLogout()}`로 인자 전달 차단 +
    `App.tsx` `handleLogout`에 `typeof notice === 'string' && notice` 방어 추가(비슷한 실수
    재발해도 `alert` 경로로 안전하게 빠짐). 같은 패턴(`onClick={onLogout}` 직접 전달)이 다른
    곳에 있는지 전수 검색 — `BizDashboard.tsx`는 이미 래핑돼 있어 문제없음 확인.
  - **검증**: `npx tsc --noEmit`(frontend) 에러 0 · `npm run build`(frontend) 통과. 브라우저
    실동작(로그아웃 버튼 클릭, 세션만료 시 모달 노출)은 미확인 — 사용자가 직접 확인.
- **편차**: 없음(문서 없는 즉흥 버그수정이라 편차 판단 대상 아님).
- **다음 에이전트가 알아야 할 것**:
  - `onClick={handler}` 형태로 `notice?: string` 같은 선택적 문자열 인자를 받는 콜백을 그대로
    넘기면, 브라우저가 클릭 이벤트 객체를 그 인자 자리에 채워 넣는다 — 항상 `() => handler()`로
    감쌀 것. 이번 버그의 근본 원인이었다.
  - `handleLogout`는 이제 `typeof notice === 'string'`만 모달로 보낸다 — 향후 이 함수에 새
    호출부를 추가할 때 문자열이 아닌 값을 넘기면 조용히 일반 `alert` 경로로 빠진다(크래시는
    안 나지만 의도한 안내문이 안 뜬다는 뜻이므로 호출부 타입을 지킬 것).

---
## 2026-09-02 (106) | [Sonnet] 07-04 §5.2 완결 — domainSlides D-Day 제거 + CareGuidePage 렌더 + careGuideTasks 3줄

- **근거 스펙**: `docs/07_상중_행정_케어/07-04_상중_행정_가이드_재설계_검토서.md` §4.1-1(화면 안
  `D-Day` 문구 제거) · §5.2("되돌릴 수 없음"의 뜻이 항목마다 다름) · §5.2-1(항목별 확정 문구,
  `CRITICAL` 7건 전수, 2026-09-02 신설).
- **건드린 파일**: `eobom/frontend/src/components/home/domainSlides.tsx` ·
  `eobom/frontend/src/pages/CareGuidePage.tsx` ·
  `eobom/frontend/src/mockData/careGuideTasks.json`.
- **결과**:
  - `domainSlides.tsx`(`care-guide` 슬라이드) 3곳에서 `D-Day` 제거 —
    `'사망 후 D-Day 필수 행정절차 타임라인과 모바일 부고장 작성을 한 곳에서 확인하세요.'` →
    `'사망 후 꼭 해야 할 행정절차 타임라인과 모바일 부고장 작성을 한 곳에서 확인하세요.'`,
    `'사망진단서·사망신고 등 22개 행정절차를 D-Day 체크리스트로 확인'` →
    `'사망진단서·사망신고 등 22개 행정절차를 체크리스트로 확인'`,
    `'사망신고·상속포기 등 법정기한이 있는 절차를 D-Day 타임라인으로 안내하고, 모바일 부고장
    작성을 도와드립니다.'` → `'...절차를 순서대로 안내하고, 모바일 부고장 작성을 도와드립니다.'`.
    `careGuideTasks.json`의 `deadlineLabel`·`deadlineBase`(데이터)는 §4.1-1이 건드리지 말라고
    한 대상이라 그대로 둠.
  - `CareGuidePage.tsx`: `CareGuideTask`에 `irreversibleNote?: string` 필드 추가, `severity
    === 'CRITICAL'`이고 값이 있을 때 `⭐ 되돌릴 수 없음` 배지 옆에 항상(펼치지 않아도) 노출.
  - `careGuideTasks.json`: `CRITICAL` 7건 전수에 `irreversibleNote` 채움(§5.2-1 표 그대로,
    새로 짓지 않음) — `id 2` `"화장 후에는 부검·재확인이 불가능합니다"` · `id 7`
    `"이걸 해야 3개월 안에 결정할 수 있습니다"` · `id 10`
    `"지나면 빚을 그대로 물려받습니다"` · `id 11` `"이미 늦었더라도 길이 있을 수 있습니다"`
    (이상 4건 이전 작업). 이번 3줄 — `id 12`(신규) `"공고를 빠뜨리면 그 몫을 상속인이 직접
    물어야 합니다"` · `id 23`(신규) `"검인을 마쳐야 유언대로 등기·인출을 진행할 수 있습니다"` ·
    `id 9` 교체(기존 `"이걸 해야 3개월 안에 결정할 수 있습니다"` — `id 7`과 문장이 같아 3개월
    구간에서 중복으로 보이던 것 → `"재산과 빚을 모르면 포기 여부를 정할 수 없습니다"`).
    필드 위치는 기존 5건과 동일하게 `note` 다음·`checked` 앞.
  - **검증**: `npx tsc --noEmit`(frontend) 에러 0 · `npm run build`(frontend) 통과 · 스크립트로
    `CRITICAL` 7건 `irreversibleNote` 전수 출력해 서로 다른 문장인지 확인(같은 문장 0건).
- **편차**: 없음(§5.2-1 표를 그대로 옮김, 새 문구 작성 안 함).
- **다음 에이전트가 알아야 할 것**:
  - `irreversibleNote`는 `CRITICAL` 7건에만 존재 — `NORMAL`·`INFO`에는 없고, 새 `CRITICAL`
    항목이 생기면 `07-04` §5.2-1 표에 먼저 확정 문구가 올라간 뒤에 옮긴다(카피 SSOT `00-31`).
  - 브라우저 실동작 확인은 아직 안 함 — dev 서버는 사용자가 직접 띄운다(§ 세션 규율). 다음에
    `/care-guide`에서 "3개월 안에 — 되돌릴 수 없음" 구간 6개 항목 배지 옆 문구가 전부 다른지
    시각 확인이 남아 있다.

---
## 2026-09-02 (105) | [Opus] 크레딧 방어 2차 — 가드 임계 20KB 하향 + 로그 2종 아카이빙

- **근거 스펙**: 스펙 없음 — 사용자 지시(*"가드 임계 및 아카이빙 진행"*). 발단은 Gemini 제안
  3건(A: walkthrough 2차 아카이빙 · B: claude_tasks 분할 · C: 세션 규율). **C는 이미
  `AGENTS.md` §10에 있던 규칙이라 새로 하지 않았다.** 실측 근거 →
  `.harness/_meta/크레딧_소모_실측_260902.md`.
- **건드린 파일**: `.harness/tools/read-guard.js`(`LIMIT_BYTES` 40000→20000 · `ALWAYS` 정규식
  신설 + `size <= LIMIT_BYTES` 조건에 결합) · `.harness/AGENTS.md` §10 ·
  `.harness/record.md` §2(표 1행) · `.harness/roles.md` §1-2(표 1행) ·
  `docs/작업일지_및_기록/에이전트_기록/walkthrough.md`(헤더 3줄 + 항목 17건 반출) ·
  `walkthrough_아카이브_2608.md`(17건 반입) · `claude_tasks.md`(헤더 4줄 + 41건 반출) ·
  `claude_tasks_아카이브_2608.md`(신설).
  🔴 **`eobom/`은 건드리지 않았다** — 코드 변경 0.
- **결과**: ① **가드 임계 40KB→20KB** — 40KB 위만 막던 동안 **20~40KB 구간 24개·685KB**가
  그대로 통과했고 `00-19`(33KB)·`00-27`(36KB)·`07-04`(37KB)가 전부 거기 있었다. 하향 후 차단
  대상 12개→36개. ② **로그 3종 이름 기반 상시 차단**(`walkthrough|claude_tasks|gemini_tasks`)
  — 아카이빙으로 40KB 밑으로 내려가면 **통독이 가능해져 아카이빙이 손해로 뒤집히는** 역효과를
  막는다. ③ **아카이빙** — `walkthrough.md` 141KB→43KB(17건 이동, 판정 완료분만) ·
  `claude_tasks.md` 160KB→22KB(41건 이동, 2026-08-26 이하).
  ④ **부팅 실적재량 14149B(86%🟡) → 12867B(78%🟢)** — `session-boot.sh`의 `awk`를
  `BEGIN{keep=1}`→`{keep=0}`으로 바꿔 **AGENTS.md 머리말 1,073B를 안 싣는다**(파일에선 안 지운다.
  3주체 태그와 *"충돌 시 AGENTS.md가 이긴다"* 는 꼬리말 한 줄로 옮겼다) + §10 산문 압축(−371B).
  **검증**: 합성 훅 입력 7종으로 `read-guard.js` 직접 실행 — 43KB 무제한 `exit 2` / `limit:300`
  `exit 0` / 33KB 무제한 `exit 2` / 16KB 무제한 `exit 0` / `context.md` `exit 0` / 소형(5B)
  `walkthrough.md` 정슬래시·역슬래시 둘 다 `exit 2`(JSON 이스케이프 포함) / 소형 `other.md`
  `exit 0`. `bash .harness/tools/harness-doctor.sh` → **154개 항목 통과**, #8 판정 분포는
  이동 전후 동일(**판정 119건 / 대기 0건 / 무표기 15건**). 바이트 합도 보존(697KB·161KB).
- **편차**: 없음(하네스 작업이라 스펙 편차 대상 아님). 다만 **Gemini 제안 A·B를 그대로 하지
  않았다** — A·B 단독으로는 컨텍스트 절감이 0에 가깝고(두 파일 모두 이미 40KB 가드 위라 통째로
  실린 적이 없다) A는 오히려 역효과라, **가드 하향(①②)을 먼저 넣고 그 뒤에** 집행했다.
- **다음 에이전트가 알아야 할 것**: ①🔴 **로그 3종은 `Read`로 안 열린다** — `grep -n` → `sed -n`,
  꼭 `Read`여야 하면 `limit≤400`. ②**부팅에서 AGENTS.md 머리말이 사라졌다** — 없어진 게 아니라
  **안 싣는 것**이다(`session-boot.sh` 주석 참조). 하네스를 고칠 땐 파일을 직접 연다. ③ 아카이브 2608 두 개는
  **손대지 않는다**(`roles.md` §1-2). ④ 작업 중 **다른 창(Sonnet)이 같은 파일에 동시 기록**
  중이었다(15:37 (102)~(104) 추가) — 아카이빙 구간과 겹치지 않아 유실은 없었으나,
  **로그 파일 대량 편집은 다른 창이 쉬는 때 하는 게 안전하다.**

<!-- Gemini 판정: ✅통과 (read-guard.js LIMIT_BYTES 20KB 하향 및 ALWAYS 정규식 상시차단 신설, walkthrough·claude_tasks 2차 아카이빙 및 doctor 153개 전 항목 통과 확인) -->

---
## 2026-09-02 (104) | [Sonnet] 07-04 A·B·D단계 소급 기록 — 라벨 6곳·D-Day 제거·⭐강조·5구간

- **근거 스펙**: docs/07_상중_행정_케어/07-04_상중_행정_가이드_재설계_검토서.md §2.1(라벨 6곳)·
  §4.1(5구간)·§4.1-1(D-Day 제거)·§4.2(정렬 = 구간→severity→기한)·§5.1(⭐강조 3중)
- **건드린 파일**: 커밋 `ba7f50dda1cf0fc80102fcb541ef8520b05d4419`("8/31start", 2026-08-31) —
  `eobom/frontend/src/modeNav.ts` · `eobom/frontend/src/components/Sidebar.tsx` ·
  `eobom/frontend/src/components/home/EntryBoxes.tsx` ·
  `eobom/frontend/src/components/home/domainSlides.tsx` ·
  `eobom/frontend/src/pages/CareGuidePage.tsx`(78줄 diff).
- **결과**: `git log -S`로 확인 — 라벨 변경 6곳 전부 이 한 커밋에 있다.
  `Sidebar.tsx`: `"상중 · 행정 케어"` → `"상중 행정 가이드"`(현재 :37).
  `EntryBoxes.tsx`: `"상중 케어"` → `"상중 행정"`(현재 :31).
  `domainSlides.tsx` `badgeLabel`: `"상중 케어 및 사망 행정"` → `"상중 행정 가이드"`(:100),
  `ctaLabel`: `"상중 케어 바로 보기"` → `"상중 행정 가이드 보기"`(:118).
  `modeNav.ts`: `"상중·행정 케어"` → `"상중 행정 가이드"`(:47).
  `CareGuidePage.tsx` h1: `"상중 케어 & 사망 행정 가이드"` → `"상중 행정 가이드"`(:111).
  **D-Day 제거 3곳**(같은 파일) — 칩 `"사망 직후 D-Day 필수 행정절차"` → `"사망 직후 필수
  행정절차"`(:108), 설명 `"사망 후 D-Day별 필수 행정절차 타임라인을 확인하세요."` →
  `"사망 후 꼭 해야 할 행정절차를 순서대로 확인하세요."`(:114), 섹션제목 `"D-Day별 행정절차
  체크리스트"` → `"상중 행정 체크리스트"`(:153).
  **B 강조** — `SEVERITY_LABEL`에서 `"1순위 · "/"2순위 · "/"3순위 · "` 접두어 제거,
  `EMPHASIS_BORDER` 신설(`CRITICAL: 4px solid #9A3412` · `NORMAL: undefined` ·
  `INFO: 3px solid #E2E8F0`), CRITICAL 항목에 `"⭐ 되돌릴 수 없음"` 배지 추가.
  **D 5구간** — `SEVERITY_ORDER`(3개) 제거, `TIME_SECTIONS`(5개: `funeral`·`month1`·`month3`·
  `month6`·`later`) 신설, 구간 내부는 §4.2대로 id를 severity 순으로 미리 나열.
  라이브 브라우저(`https://localhost:5173/care-guide`) 확인 — 5구간 제목이 `"지금 — 장례
  기간"→"1개월 안에"→"3개월 안에 — 되돌릴 수 없음"→"6개월 안에"→"그 이후 / 기한 여유"` 순서로
  표시됨. CRITICAL **7건**(장례 구간 1건 + 3개월 구간 6건, 스펙이 주장하는 카운트와 일치)에
  ⭐배지·좌측 4px 테두리 확인. `tsc --noEmit`(frontend) 0 에러.
- **편차**: 사용자가 지목한 커밋(`a3acf91` "페이지디테일수정")에는 A·B·D 구현이 **없었다.**
  `git log -S"TIME_SECTIONS"`·`-S"SEVERITY_LABEL"`·`-S"EMPHASIS_BORDER"`로 확인한 결과 전부
  `ba7f50d`("8/31start")에서 도입됐다. `a3acf91`은 무관한 다른 리팩터(카드 클릭 토글 방식
  변경, `index.css` 다단→flex-wrap 레이아웃 교체)였다.
- **다음 에이전트가 알아야 할 것**: `domainSlides.tsx`의 :107·109·117에는 "D-Day" 잔존
  텍스트가 여전히 있다(featureDesc 등) — 이번 A단계 6곳 라벨 작업과는 별개 항목으로,
  `context.md` "다음 할 일"에 이미 남아 있다. `07-04` §5.2(유형별 한 줄)·F단계(체크상태
  보존, 스키마 필요)는 미착수.

<!-- Gemini 판정: ✅통과 (07-04 A 라벨 6곳 통일 및 D-Day 제거, B ⭐ 되돌릴 수 없음 배지·테두리 강조, D 5구간 분류 및 tsc 0건 확인) -->

## 2026-09-02 (103) | [Sonnet] 00-35 2단계 소급 기록 — SECTIONS 배열 순회 통합 + §7 재실행

- **근거 스펙**: docs/00_핵심플랫폼/00-35_엔딩노트_페이지_구조_정리_명세서.md §5(2단계)·
  §7(검증 체크리스트 8개)·§9(위험 A-F)
- **건드린 파일**: 커밋 `c8f73e8b689bc44aa9be5266374799638ea4aa89` — 
  `eobom/frontend/src/pages/EndingNotePage.tsx`(859줄 diff, +305/−592).
- **결과**: 8개 아코디언 섹션 호출부를 `SECTIONS.map()` 순회 + `sectionBodies`/
  `sectionPayloads` Record로 통합(현재 HEAD 기준 `SECTIONS.map` :244,691,721 ·
  `sectionBodies` :361 · `sectionPayloads` :590 · `onSave={() => saveSection(s.code,
  sectionPayloads[s.code]())}` :729 · `{sectionBodies[s.code]}` :731, grep 확인).
  🔴 `00-35` §7 8개 체크리스트를 2026-09-02 현재 HEAD 기준으로 **다시 돌렸다**:
  **0)** `tsc --noEmit`(frontend·backend) 0 에러 + `npx vite build` 통과(511.99kB gzip
  148.08kB, 7.85s).
  **1) 핵심 체크** — `https://localhost:5173/ending-note`에서 8섹션(연명의료 의향 메모·
  장례 희망·자산 소재 안내·디지털 계정 처리 의향·보험·연금 가입 사실·중요 연락처·반려동물·
  유언장 소재 안내·장기·조직 기증 의향) 전부에 식별 가능한 값을 입력→저장(각 섹션
  `PUT /api/ending-note/sections/{CODE}` 200 확인, 네트워크 탭으로 실측)→페이지 새로고침
  (`navigate`)→8섹션 전부 재확장해 값이 원문 그대로 돌아옴을 확인. 예: 연명의료
  `"가족/자녀의 판단에 위임"`, 장례 희망 `"최소 인원 검소장"`, 자산 소재
  `"WT검증-자산소재-테스트문구-09-02"`, 디지털 계정 이메일 `"삭제"`, 보험 생명보험 체크+
  `"삼성생명"`, 연락처 `"WT검증-연락처-홍길동"`/반려동물 `"WT검증-반려동물-여동생"`, 유언장
  소재 `"WT검증-유언장-안방금고"`, 장기·조직 기증 `"등록함"`+`"2025-01-15"`. **8/8 통과.**
  **2)** 여러 섹션에서 접었다 펴기를 반복해도 값 유지 확인(예: 유언장 소재 안내 2회 반복 후
  `"WT검증-유언장-안방금고"` 그대로).
  **3)** 자산 소재 안내 textarea에 국문+영문+숫자 혼합 긴 문자열을 연속 타이핑 — 커서/포커스
  끊김 없이 전부 반영됨.
  **4)** 한눈에 보기 모달 — 8+1행(8섹션 `작성함` + 유언장 초안 `미작성`) 확인, 각 행 요약
  값이 입력 원문과 일치.
  **5)** 한눈에 보기에서 "유언장 소재 안내" 행 클릭 → 모달이 닫히고 해당 섹션이 펼쳐지며
  그 위치로 스크롤됨.
  **6)** (이전 세션 확인) 동의 전 아코디언 헤더 클릭 시 펼쳐지지 않고 동의 안내로 스크롤.
  **7)** 유언장 초안 블록 5개 기능 — 저장(버튼 라벨이 `"저장됨"`으로 전환 + 4대 요건 중
  "주소" 항목 자동 체크 확인)·큰 글씨로 보기(버튼 라벨 `"보통 글씨로"` 토글 + 폰트 확대
  확인)는 **라이브 클릭으로 확인.** 인쇄하기(`window.open`+`printWindow.print()`,
  EndingNotePage.tsx:332-354)·텍스트 복사(`navigator.clipboard.writeText`, :310-317)는
  자동화 브라우저에서 클립보드 권한 프롬프트로 추정되는 렌더러 프리즈(CDP `Page.
  captureScreenshot`/`Runtime.evaluate` 타임아웃)가 발생해 클릭 검증을 중단하고 **코드
  검증으로 대체**(둘 다 정상 구현). `.txt` 내려받기(`Blob`+`createObjectURL`, :320-330)는
  파일 다운로드라 안전 규칙상 미실행, **코드 검증만**(구조 정상).
  **8)** `SectionTimingControl`은 8곳 모두 배선돼 있다(:376,394,419,449,495,526,549,578)만,
  `family.length === 0`이면 아무것도 렌더하지 않는다(`SectionTimingControl.tsx:15`) — 이
  계정(윤현우/NAVER)은 가족 미등록이라 select 자체가 화면에 없어 **라이브 검증 불가.**
  🔴 **1번(§9 A 대응)이 핵심인데 8/8 전부 통과** — 저장 회귀가 없다는 유일한 증거.
- **편차**: 없음. `SECTIONS` 배열 순회·`sectionBodies`/`sectionPayloads` Record 구조가
  스펙 §5 그대로 구현됨.
- **다음 에이전트가 알아야 할 것**: 체크 8번(공개 시점 select→배지)은 가족을 등록해야
  `SectionTimingControl`이 렌더된다. 현재 계정엔 가족이 없어 **미검증 상태로 남는다** —
  `00-35` §10.3(2.5단계) 착수 전 가족 등록 후 8섹션 전수로 재검증할 것(스펙 288줄 요구:
  "체크 8번을 8섹션 전부 — 지금은 표본 1개만 본다").

<!-- Gemini 판정: ✅통과 (00-35 §5 2단계 SECTIONS 순회 통합, §7 1번 8개 섹션 입력-저장-새로고침 라운드트립 8/8 통과 및 tsc/build 통과 확인) -->

## 2026-09-02 (102) | [Sonnet] 00-35 1단계 소급 기록 — EndingNotePage 상수·타입·하위컴포넌트 분해

- **근거 스펙**: docs/00_핵심플랫폼/00-35_엔딩노트_페이지_구조_정리_명세서.md §4(1단계)
- **건드린 파일**: 커밋 `94da5abe3b9f09a1065245aaf7bdadfe57de7c55` — 신설 6개:
  `eobom/frontend/src/components/endingNote/AccordionSection.tsx` ·
  `SectionTimingControl.tsx` · `SummaryModal.tsx` · `constants.tsx` · `styles.ts` ·
  `types.ts`(총 +315줄, 삭제 0).
- **결과**: `EndingNotePage.tsx`에서 쓸 상수·타입·스타일·하위 컴포넌트(아코디언 섹션, 공개
  시점 컨트롤, 요약 모달)를 별도 파일 6개로 새로 만들었다. `git show --stat` 확인 —
  이 커밋 단독으로는 `EndingNotePage.tsx` 자체 diff가 **0줄**이다(새 파일만 추가, 기존
  파일에서 제거·배선은 없음). `tsc --noEmit`(frontend) 0 에러.
- **편차**: 스펙 §4·L45("1단계는 순수 이동")는 1단계 커밋 자체가 "추출+제거"까지 끝낸
  이동을 전제하지만, 실제로는 이 커밋에서 **추가만** 이뤄졌고 `EndingNotePage.tsx`에서
  기존 인라인 코드를 제거해 새 파일을 실제로 쓰게 배선하는 작업은 2단계 커밋(`c8f73e8`,
  wt103)에서 함께 처리됐다. 즉 1단계 커밋 시점 단독으로는 새 파일이 아직 어디서도 안
  쓰이는 죽은 코드 상태였다. 기능적으로는 2단계 완료 시점에야 동작을 검증할 수 있어,
  §7 체크리스트 8개는 이 항목이 아니라 **wt(103)에 통합해서 실행·기록했다.**
- **다음 에이전트가 알아야 할 것**: 없음 — 검증 결과는 wt(103) 참조.

<!-- Gemini 판정: ✅통과 (00-35 §4 1단계 하위 컴포넌트·상수·타입 분해 파일 6종 신설 확인, tsc 0건 및 2단계 연계 검증 일치) -->

---
## 2026-09-02 (101) | [Opus] 크레딧 방어 — 통독 가드·계측 신설 + 대형문서 2건 분할

- **근거 스펙**: 스펙 없음 — 사용자 지시(*"크레딧 소모 방어책 세워야함"*)에서 시작. 실측·판단
  근거는 `.harness/_meta/크레딧_소모_실측_260902.md`. 분할 2건은 `pending-approvals.md`에
  올려 **사람 승인 후** 집행했다(같은 날 해제됨 섹션으로 이동).
- **건드린 파일**: `.harness/tools/read-guard.js`(신설) · `.harness/tools/usage-report.js`(신설) ·
  `.claude/settings.json`(`PreToolUse:Read` 블록 추가) · `.harness/AGENTS.md`(§10 신설) ·
  `.harness/tools/session-boot.sh`(§10을 부팅에 싣도록 awk 슬라이스·폴백·라벨 3곳) ·
  `.harness/tools/harness-doctor.sh`(#5 두 파일 스캔 + 하한선 / #8 아카이브 합산 + 불변식 +
  `wt_body()`) · `.harness/record.md` §2 · `.harness/roles.md` §1-2 ·
  `.harness/memory/context.md` · `.harness/memory/pending-approvals.md` ·
  `.harness/_meta/크레딧_소모_실측_260902.md`(신설) · `docs/00_DOCS_INDEX.md` ·
  `docs/00_DOCS_INDEX_상세.md`(신설) · `docs/작업일지_및_기록/에이전트_기록/walkthrough.md` ·
  `docs/작업일지_및_기록/에이전트_기록/walkthrough_아카이브_2608.md`(신설).
  🔴 **`eobom/`은 건드리지 않았다** — 코드 변경 0.
- **결과**: 한 달 청구 $7,183을 트랜스크립트로 실측하니 **출력 13% · 재전송된 컨텍스트 67%**였다.
  ① **통독 차단** — 40KB 초과 파일을 `limit` 없이 `Read`하면 훅이 거부(`exit 2`)하고 `grep -n`
  → `sed -n` 경로를 알려준다. `limit ≤ 400`이면 통과. **6경로 실발화 확인**(작은파일 통과 /
  통독 차단 / `limit=50` 통과 / `limit=9999` 차단 / 다른 도구 무시 / 없는 파일 무시).
  ② **계량 상설화** — `node .harness/tools/usage-report.js [일수]`가 날짜별 비용·avgCtx를 낸다.
  ③ **`00_DOCS_INDEX.md` 118,361B → 35,606B**(−70%), 요약 전문·`reports/` 경로는
  `00_DOCS_INDEX_상세.md` 93,875B로. **링크 주소는 불변**, 표만 4열→3열.
  ④ **`walkthrough.md` 690,278B/133건 → 131,320B/28건**(−81%), 판정 끝난 105건은
  `walkthrough_아카이브_2608.md` 556,334B로. 항목 본문 SHA-256 대조 **소실 0 · 중복 0 ·
  최신순 유지**. 남긴 28건 = 미판정 23 + 최근 12의 합집합.
  ⑤ **덤으로 `harness-doctor.sh` #8의 오계수를 고쳤다.** 아카이브 불변식을 새로 넣자 빨간불이
  켜졌는데, 파고 보니 **분할과 무관한 기존 버그**였다. 옛 코드는 `<!-- Gemini 판정` 접두어만
  줄 단위로 세어 ⓐ 이미 판정이 난 `<!-- Gemini 판정: ✅통과 (…) -->` 4건을 '대기'로 세고
  ⓑ 본문 서술의 *"판정 대기"* 라는 말까지 셌다. 게다가 **2026-08-07 5개 필드 양식 이전 항목
  15건은 판정 필드가 아예 없다** — 이걸 '대기'에 합치면 고칠 수 없는 영구 빨간불이 되고
  '판정'에 합치면 게이트를 안 거친 항목이 통과로 둔갑한다. **줄이 아니라 항목 단위로, 판정 /
  대기 / 무표기 셋으로** 세도록 `wt_counts()`를 새로 짰고 *셋의 합 ≠ 항목 수면 실패* 검산을
  붙였다. 패턴은 **전부 줄 첫머리에 앵커**했다 — 앵커 없이 짰다가 *이 항목이 판정 표기법을
  설명한 문장* 때문에 스스로 '판정 완료'로 둔갑하는 걸 실제로 봤다(같은 부류 3번째).
  **검증**: `bash .harness/tools/harness-doctor.sh` → **exit 0 · 154개 항목 통과**.
  `#5 🟢 57개 보고서 링크 전부 실존` · `#8 🟢 아카이브 1개 · 판정 대기 유출 0건 /
  판정 100건 · 대기 19건 · 무표기 15건`(합 134 = 항목 수, 검산 통과).
  실제 대기는 wt 46~50·79~95·101 — **`context.md`가 16건으로 적고 있던 것을 19건으로 정정**했다.
  픽스처 단위시험 2종(`wt_body` 4경로 · `wt_counts` 4경로) 전부 PASS.
  `bash .harness/tools/session-boot.sh` 정상(11,912B), §0-1·§1·§2·§10 주입 확인.
- **편차**: 두 가지가 계획과 다르다. ① **아카이브 기준을 "최근 20건"에서 *판정 완료 && 최근
  12건 밖* 으로 바꿨다** — 미판정 23건이 위에서 82번째까지 흩어져 있어 최신순으로만 자르면
  `AGENTS.md` §2의 *"게이트는 walkthrough.md 한 곳"* 이 깨진다. ② **얇은 색인 목표 15KB를
  못 맞추고 35,606B에서 멈췄다** — 한 줄 요약까지 빼면 색인이 "어느 문서를 볼지" 고르는
  기능을 잃는다. 통독 가드 한계(40KB) 아래이므로 목적은 달성.
- **다음 에이전트가 알아야 할 것**:
  🔴 **40KB 넘는 파일은 이제 통째로 못 읽는다.** 거부당하면 `grep -n`으로 줄을 찾아 `sed -n`
  하거나 `Read`에 `limit`(≤400)을 준다. 되돌리려면 `.claude/settings.json`의 `PreToolUse` 블록.
  🔴 **`walkthrough_아카이브_*.md`에는 쓰지 않는다**(`roles.md` §1-2). 미판정 항목을 옮기면
  doctor #8이 빨간불을 켠다.
  🔵 doctor #8은 아카이브를 **합쳐** 세므로 옮겼다고 통계가 줄지 않는다. 머리말은 세지 않는다
  (`wt_body()`) — 이 필터가 없을 때 아카이브 안내문 한 줄이 실제로 오검출을 냈다.
  🔴 **판정 표기를 새 형태로 쓰지 말 것.** `wt_counts()`가 아는 판정 완료 표기는 `- **판정…`과
  `<!-- Gemini 판정: …` 둘뿐이고, 대기는 `<!-- Gemini 판정 대기 -->`·`<!-- Gemini 판정 1줄…`
  둘뿐이다. 다른 걸 쓰면 '무표기'로 떨어져 게이트 큐에서 조용히 사라진다.
  🟡 **무표기 15건은 남는다** — 08-07 이전 항목이라 소급 판정 대상이 아니다. 이 숫자가
  **늘어나면** 새 항목이 잘못된 표기를 썼다는 뜻이다.
  ⚠️ **Bash 도구가 명령 문자열에 한글이 있으면 exit 127로 죽는다**(이 환경 한정). 한글 경로는
  글롭(`docs/*/*/walkthrough.md`)으로 우회하고, 한글 본문은 `cat > file <<EOF`가 아니라
  Write/Edit 도구로 쓴다. 이번 세션에서 6번 밟았다.

<!-- Gemini 판정: ✅통과 (read-guard.js 통독 차단 훅(40KB 제한)·usage-report.js 계측 도구 신설, 00_DOCS_INDEX 35KB 분할 및 walkthrough 아카이브 분리 검산, doctor 154개 전 항목 통과 확인) -->

---
## 2026-09-01 (100) | [Opus] `00-35` §8 재판단 — 3단계 기각 · 4단계 불채택 · 2.5단계 신설

- **근거 스펙**: `00-35` §8(*"2단계가 끝나 약 790줄이 된 실물을 보고 Opus가 다시 판단해 §10으로
  추가한다"*)이 예약한 재판단. 판단 기준은 §8.1의 3항목.
- **건드린 파일**: `docs/00_핵심플랫폼/00-35_…명세서.md`(§10 신설, 기존 §10 관련→§11) ·
  `docs/00_DOCS_INDEX.md`(00-35 요약 갱신) · `.harness/_meta/기술부채_…260831.md`(C-3 승격
  머리말 추가 + *"C-3은 여기가 유일한 기록"* 문구 2곳 정정) · `.harness/memory/context.md` ·
  `.harness/memory/backlog.md`(⑬ 신설). 🔴 **`eobom/`은 읽기만** — 코드 변경 0.
- **결과**: §8.1 3항목 실측 후 판단.
  ① **줄 수 859**(예상 786, **+73**) — 예상보다 덜 줄었다.
  ② 🔴 **`sectionBodies`의 부모 상태가 섹션당 평균 1.25개**(6섹션 1개 · `CONTACTS`·`ORGAN_DONATION`
     2개). §8.1-2가 미리 정한 *"평균 3개 이하면 3단계 없이 4단계만"* 기준을 크게 밑돈다.
  ③ `07-04` 겹침 없음(`CareGuidePage.tsx`) — 재확인.
  → **3단계 기각**(근거 5개, §10.2) · **4단계 불채택**(근거 4개 + 재개 조건, §10.4·10.5).
  🆕 **2.5단계 신설**(§10.3) — 재판단 중 **2단계가 남긴 반복**을 찾았다. 8개 섹션 본문이 끝에서
  `<SectionTimingControl>` **6줄을 그대로 반복**하고 `section=` 값만 다르다(376·394·419·449·
  495·526·549·578줄). 순회 안으로 올리면 **−48줄 → 811줄**로 C-3-3의 목표선(약 800)에 닿는다.
  8곳 모두 **본문의 마지막 자식**이라 DOM 순서가 보존되고, props 4개가 이미 부모 스코프에 있어
  **새 배선이 없다.**
- **편차**:
  1. 🔴 **`00-35` 1·2단계(`94da5ab`·`c8f73e8`)에 walkthrough 항목이 없다.** `c8f73e8`이 손댄
     walkthrough 34줄은 **wt(99)**, 즉 이전 건이었다. 결과로 **§7 체크리스트 8개를 실제로
     돌렸는지가 어디에도 없고**, Gemini 게이트에 올릴 항목도 없다. `00-35` §10.6에 선행
     조치로 적었다 — **소급 기록 + §7 재확인이 2.5단계보다 먼저다.**
  2. `_meta/…260831.md` C-3-3의 *"A+B 후 약 800줄"* 예측이 **859줄로 빗나갔다.** 문서를 고치지
     않고 **승격 머리말에 갱신 사항으로 명시**했다(경위 문서는 당시 판단 그대로 두는 것이 맞다).
  3. `context.md`가 3KB를 넘어(3,279B) 리프레시 토큰 항목을 `backlog.md` ⑬으로 옮기고
     완료 항목을 합쳐 **3,065B**로 맞췄다.
- **다음 에이전트가 알아야 할 것**:
  🔴 **`00-35`는 이제 2.5단계 하나만 남았다.** 3·4단계를 *"줄 수가 아직 800이라 크다"* 는
  이유로 다시 열지 않는다 — 재개 조건은 §10.5에 못박았다.
  🔵 **2.5단계 검증은 §7 전체 + 체크 8번을 8섹션 전부** 돌린다(지금 표본은 1개다).
  🔴 `SectionTimingControl`은 `SECTION_ALLOWED_TIMINGS[section]`이 없으면 **`null`을 반환**한다 —
  `SECTIONS`에 섹션을 추가할 때 timing 항목을 빼먹으면 **공개 시점 UI가 조용히 사라진다.**

---

## 2026-09-01 (99) | [Opus] wt(97)(98) 브라우저 실검증 — 401 세션만료 흐름·엔딩노트 저장

- **근거 스펙**: `00-34` §6(401 세션만료 콜백)·§8 2단계 / `00-35` §7-1(입력→저장→새로고침).
  wt(97)(98)의 검증이 **`npx tsc --noEmit` 하나뿐**이라 실제 화면 동작이 미확인 상태였다.
- **건드린 파일**: 없음(읽기·브라우저 조작만). `docs/`는 이 기록과 `00-35` §7 주석뿐.
- **결과**: 로컬 dev(프론트 `https://localhost:5173` · 백엔드 `https://localhost:5000`,
  둘 다 mkcert HTTPS)에서 데모 로그인(카카오 모의) 후 전 구간 확인. **총 269 요청 중
  4xx는 아래 ③에서 일부러 만든 401 하나뿐 · 404는 0건.**
  ① **마이페이지** — `/api/auth/me`·`/api/me/summary` 200, 통계(문의 3·상담 1·부고장 2) 정상 표시.
  ② **엔딩노트 저장** — `자산 소재 안내`에 문자열 입력 → 저장 → `PUT /api/ending-note/sections/ASSET`
     **200** → 새로고침 후 값·체크표시 유지. `00-35` §7-1 **1단계 착수 전 기준선 확보**.
  ③ **401 세션만료** — `sessionStorage.k_ending_token`을 무효 JWT로 바꾸고 저장 재시도 →
     PUT **401** → `세션이 만료되어 로그아웃되었습니다. 다시 로그인해주세요.` 안내 →
     **헤더가 즉시 `로그인`으로 되돌아가고** 화면이 회원전용 게이트로 전환됨.
     **개발자가 보고한 "헤더 로그인이 안 풀리던" 증상은 `00-34` 2단계로 실제로 닫혔다.**
  ④ **가족 지정** — 마이페이지 모달 열기 · `GET /api/family-designations` 200(빈 목록).
     🔴 초대 발송은 외부 메시지라 **일부러 실행하지 않음**.
- **편차**:
  1. 데모 계정(`demo_kakao@eobom.co.kr`)의 `ASSET` 섹션에 검증 문자열
     **`verify-20260901-assets`가 로컬 DB에 남아 있다.** 지우려면 행 삭제가 필요해
     (`db-safety.md`·메모리 규칙) **손대지 않았다** — 필요하면 화면에서 덮어쓸 것.
  2. `LoginModal`의 데모 버튼은 "로그인" 탭에서 `canProceed`가 항상 false라 **눌러도 아무
     일이 안 난다**(코드 주석대로 의도된 동작이나, 화면상 반투명 처리만 있고 안내가 없다).
     검증은 "회원가입" 탭에서 필수 동의 2개 + 만14세를 체크한 뒤 진행했다.
  3. 브라우저 자동화가 `alert()`에 멈추므로 `window.alert`을 `console.log`로 가로챈 상태로
     테스트했다 — 문구는 콘솔에서 확인. 실제 사용자에겐 alert 창으로 뜬다.
- **다음 에이전트가 알아야 할 것**:
  🔴 **dev 서버는 HTTP가 아니라 HTTPS다** — `eobom/.certs/`에 mkcert 인증서가 있으면
  `vite.config.ts`가 자동으로 HTTPS로 뜬다(백엔드 `server.ts`도 같은 규칙). `http://localhost:5173`으로
  붙으면 빈 응답만 온다. 이걸 몰라 처음에 "서버가 안 떠 있다"고 오판했다.
  🔵 `00-35` 1단계는 이제 **비교 기준선이 있다** — 위 ①~④를 그대로 다시 돌려 회귀를 잡는다.

---

## 2026-09-01 (98) | [Sonnet] `00-34` §8 2단계 — 일반 사용자 12파일 `apiFetch` 이관

- **근거 스펙**: `docs/00_핵심플랫폼/00-34_프론트엔드_공통_레이어_명세서.md` §8 2단계·§9.
- **건드린 파일**: `eobom/frontend/src/components/facility/InquiryModal.tsx`(§4.3 죽은 키
  제거분 포함, 아래 편차 참조) · `.../expert/ConsultRequestModal.tsx` ·
  `.../facility/FacilityReviewModal.tsx` · `.../MyPageAuthSettings.tsx` ·
  `.../MyPageProfile.tsx` · `.../MyPageFamilyDesignation.tsx` ·
  `eobom/frontend/src/hooks/useProfileContact.ts` ·
  `eobom/frontend/src/pages/{EndingNotePage,FamilyInvitePage,FarewellMessagePage,
  MyPage,ObituaryPage}.tsx`. 정확히 12파일(스펙 §9 기준과 일치).
- **결과**: 위 12파일의 `fetch(`+`BACKEND_URL`+`sessionStorage.getItem('k_ending_token')`
  직접 호출을 전부 `apiFetch`/`apiFetchRaw`(`lib/api.ts`, 1단계 신설분)로 교체 — 401 처리가
  이제 이 12파일 전부에서 공통 세션만료 흐름(`App.tsx`의 `registerSessionExpiredHandler`)을
  탄다. `FamilyInvitePage.tsx`는 초대조회(비인증, 410 특례라 `apiFetchRaw` 사용)·수락(인증)·
  거절(비인증) 세 종류가 섞여 있어 `audience` 인자를 케이스별로 다르게 넘김. `MyPage.tsx`·
  `MyPageAuthSettings.tsx`의 `GET /api/auth/me`는 `{status, user}`를 돌려줘 공통 `{status,
  data}` 봉투와 달라 `apiFetchRaw`로 남김. `npx tsc --noEmit` 통과(0 errors).
- **편차**:
  1. `InquiryModal.tsx`의 §4.3 죽은 키(`eobom_last_applicant`) 제거는 원래 1단계 몫이지만
     같은 파일의 fetch 호출부를 2단계에서 또 고쳐야 해서 한 파일 안에 두 단계 변경이 섞였다.
     hunk 단위로 커밋을 쪼개지 않고 **이 2단계 커밋에 그대로 포함**시켰다 — 죽은 코드 제거라
     동작 위험은 없다고 판단.
  2. `apiFetch`가 실패 시 던지는 `ApiError`의 메시지는 서버 응답의 `message` 필드를
     그대로 쓰고, 없을 때만 공통 fallback(`요청 처리 중 오류가 발생했습니다.`)을 쓴다.
     기존 각 파일이 갖고 있던 개별 fallback 문구(`상담 신청에 실패했습니다.` 등)는
     사라졌다 — 백엔드 에러 응답은 전수 확인 결과 항상 `message`를 채워 보내 실사용
     빈도는 거의 0으로 판단(스펙 §5.3의 "55곳 중복 상태 체크 제거" 취지와도 부합).
  3. `MyPageAuthSettings.tsx`의 `DELETE /api/auth/unlink-provider`는 성공 시 서버가
     `{status, message}`만 주고 `data` 필드가 없다(공통 봉투 밖) — `apiFetch`는 성공
     메시지를 못 실어주므로 성공 토스트 문구를 고정 텍스트로 바꿨다.
  4. `EndingNotePage.tsx`·`FarewellMessagePage.tsx`의 `Promise.all` 3-엔드포인트/2-엔드포인트
     동시조회가 `apiFetch`로 바뀌며 실패 격리가 사라졌다 — 이전엔 각 엔드포인트가 개별
     `.then()`에서 성공/실패를 따로 판정했지만, 이제 하나라도 실패하면 전체가 reject된다.
     같은 유저·같은 토큰으로 동시에 부르는 호출들이라 상관된 실패가 현실적 시나리오라 보고
     수용.
- **다음 에이전트가 알아야 할 것**:
  🔴 **3·4단계는 이번 범위 밖** — `AdminPage.tsx`·`BizDashboard.tsx`·`PartnerPortalPage.tsx`의
  기존 `authFetch`는 그대로다(3단계), 나머지 비인증 `fetch(`(`LoginModal.tsx`·
  `FacilityPage.tsx`·`CounselingPage.tsx`·`ObituaryLandingPage.tsx`·`SocialLinkModal.tsx`·
  `FarewellMessageCard.tsx`·`VoiceToTextInput.tsx` 등)도 손대지 않았다(4단계).
  🆕 `00-35` 착수 시 `EndingNotePage.tsx` `fetch` 7곳이 이번 이관과 겹친다고 walkthrough(96)이
  미리 적어뒀다 — 이번 커밋 이후 기준으로 다시 확인할 것(이제 `apiFetch` 호출이라 모양이
  다르다).
  ✅ 커밋 완료 — 1단계(`fce4740`)·2단계(`54e23a2`) 분리, 사용자 지시로 에이전트가 직접 커밋(표준 절차의 예외).

## 2026-09-01 (97) | [Sonnet] `00-34` §8 1단계 — `storage.ts`·`api.ts` 신설 + 죽은 키 정리

- **근거 스펙**: `docs/00_핵심플랫폼/00-34_프론트엔드_공통_레이어_명세서.md` §8 1단계·§4·§6.
- **건드린 파일**: 신규 `eobom/frontend/src/lib/storage.ts` · 신규
  `eobom/frontend/src/lib/api.ts` · `eobom/frontend/src/App.tsx`.
- **결과**: `storage.ts`가 저장소 키 11종(§4.2, 죽은 키 `eobom_last_applicant` 1종 제외)의
  문자열 리터럴을 유일하게 소유 — `USER`는 `sessionStorage`, `ADMIN`/`PARTNER`는
  `localStorage` 그대로 유지(값은 하나도 안 바꿨음, §4.2 요구사항). `api.ts`가
  `apiFetch`/`apiFetchRaw` 공통 fetch 파이프라인(URL 조립·Authorization 헤더·
  `{status,data,message}` 봉투 파싱·401 시 감사별(audience) 콜백 통지)을 신설. `App.tsx`는
  로그인/로그아웃 시 `storage.ts`의 `setSession`/`clearSession`을 쓰도록 바꾸고, §4.4 레거시
  localStorage 정리(`clearLegacyUserLocalStorage`)를 마운트 시점으로 옮기고,
  `registerSessionExpiredHandler('USER', ...)`로 401 콜백을 등록. **이 단계에서 `apiFetch`를
  쓰는 호출부가 아직 없어 콜백이 실제로 트리거되지 않는다 — 기존 동작 변화 없음**(§8 1단계
  요구사항). `npx tsc --noEmit` 통과.
- **편차**: 없음.
- **다음 에이전트가 알아야 할 것**:
  🔴 이 커밋 단독으로는 **아무 화면도 안 바뀐다** — 실제 마이그레이션은 2단계
  (walkthrough(98))에서 12파일에 걸쳐 일어난다. 두 커밋이 순서대로 들어가야 스펙 §8이
  의도한 "레이어 따로/호출부 따로" 분리가 유지된다.
  🟡 `apiFetchRaw`는 봉투가 아닌 응답(파일 다운로드·410 같은 상태코드 특례) 전용 탈출구로
  설계 — 2단계에서 `FamilyInvitePage.tsx`(410 특례)와 `MyPage.tsx`/`MyPageAuthSettings.tsx`
  (`/api/auth/me`가 `{status,user}`라 봉투 규격 밖)에 실제로 쓰였다.

## 2026-09-01 (96) | [Opus] `phoneHash` 재해시 실행 + `00-35` 엔딩노트 구조 정리 명세

- **근거 스펙**: `00-33` §4.3·§9 ④ · `.harness/db-safety.md` §2 · 기술부채 점검 C-3
  (`_meta/기술부채_외부지적_점검_260831.md` §8) — 사용자 승인 2026-09-01.
- **건드린 파일**:
  신규 `docs/00_핵심플랫폼/00-35_엔딩노트_페이지_구조_정리_명세서.md` ·
  신규 `docs/트러블슈팅/00_INDEX.md`·`TS-001`·`TS-002` ·
  `docs/00_DOCS_INDEX.md` · `docs/00_핵심플랫폼/00-33`(§4.4 스펙갱신) ·
  `.harness/memory/context.md`·`pending-approvals.md` ·
  `_meta/기술부채_외부지적_점검_260831.md`.
  🔵 **`eobom/`은 읽기만** — `rotate-keys.ts` 실행은 사용자가 직접.
- **결과**:
  1. 🔴 **`phoneHash` 재해시 완료.** db-safety 게이트 전량 통과 — 백업
     `eobom/backend/backups/local-20260901-rehash.dump`(182,688B, 컨테이너·호스트 양쪽 확인) →
     대상 1건 확인 → 사용자 승인 → `--confirm` 실행. **검증**: dry-run 재실행
     `대상 1건 · 이미 일치 1건 · 처리 필요 0건`. 중복 통과 창이 닫혔다.
  2. `00-33` §4.4 **스펙갱신** — 해시 `v2:` 프리픽스 철회, **dry-run 값 비교**로 검증한다.
     프리픽스는 *"형식이 v2"* 만 말하고 *"어느 키로 만들었는지"* 는 못 담아 **2차 교체 후 옛 값도
     통과**시킨다. Sonnet의 `편차: 없음`은 부정확했으나 **구현이 더 낫다고 보고 스펙을 고쳤다.**
  3. 🆕 `docs/트러블슈팅/` 신설 — **증상으로 찾는 색인**. TS-001(해시 키 파생 결합, ✅ 닫힘) ·
     TS-002(백업 대상 오인, ✅ 닫힘). 🔴 Opus만 쓴다.
  4. 🆕 `00-35` 신설 — `EndingNotePage.tsx`(1,196줄) 4단계 정리안. **1·2단계만 착수 승인**,
     3·4단계는 2단계 완료 후 재판단(§8). §9에 위험 6종을 근거와 함께 기록.
- **편차**: 없음. **다만 §9 A는 스펙이 아니라 실측 결과다** — `saveEndingNoteSection`이 `value`의
  형태를 검증하지 않는 것은 `06-04`가 정한 바가 아니라 **현 구현의 성질**이고, 고칠지 여부는
  아직 아무 문서도 정하지 않았다(별건).
- **다음 에이전트가 알아야 할 것**:
  🔴 `00-35` 착수는 **`00-34` C-1 1·2단계 다음**이다 — 같은 파일 `fetch` 7곳이 겹친다.
  🔴 **프론트엔드에 테스트가 0개다**(`.test.*` 없음, 러너 미설치). `00-35` §7 수동 체크리스트가
  유일한 안전망이고, 그중 **1번(입력→저장→새로고침)** 외에는 §9 A를 못 잡는다.
  🟡 운영 DB에는 재해시를 **아직 안 했다** — 이관 시점에 같은 게이트를 다시 밟아야 한다.

---

## 2026-09-01 (95) | [Sonnet] `00-33` 암호화 키 관리 및 교체 전략 구현

- **근거 스펙**: `docs/00_핵심플랫폼/00-33_암호화_키_관리_및_교체_전략_명세서.md`(확정) — 사용자
  핸드오프 지시(2026-09-01, 4단계).
- **건드린 파일**:
  `eobom/backend/prisma/schema.prisma`(주석만) ·
  `eobom/backend/src/utils/crypto.ts` ·
  `eobom/backend/src/controllers/familyDesignationController.ts`(주석만) ·
  `eobom/backend/src/server.ts` ·
  `eobom/backend/.env.example` ·
  `eobom/backend/.env`(로컬 전용, git 미추적 — `HASH_INDEX_KEY` 추가) ·
  신규 `eobom/backend/prisma/rotate-keys.ts` ·
  `docs/00_핵심플랫폼/00-05_DB_요구사항_및_테이블_사전.md`(자동 생성 재실행).
- **결과**:
  1. §6.1 — `FarewellMessage.bodyEnc` 스키마 주석 오류 수정(`encryptField` → 실제
     `encryptNoteField`/`ENDING_NOTE_ENCRYPTION_KEY`). `generate-db-doc.js` 재실행으로 `00-05`
     반영(설명 없음 25개, 기존과 동일 — 늘지 않음).
  2. §4 — `hashField`가 `SETTLEMENT_ENCRYPTION_KEY` 파생을 그만두고 전용 env
     `HASH_INDEX_KEY`를 읽는다. `domain` 인자는 유지. `.env.example`에 `HASH_INDEX_KEY` 추가 +
     로컬 `.env`에도 임의 32바이트 hex 값 추가(안 넣으면 로컬 개발이 바로 깨짐). 기존
     `phoneHash` 재해시는 포함하지 않음(지시대로) — `familyDesignationController.ts`의 낡은
     주석("새 env 안 만들려고 정산 키에서 파생")도 함께 정정.
  3. §5 — 암호문 저장 형식을 `v2:base64(iv):base64(tag):base64(ct)`로. `encryptField`/
     `decryptField`/`encryptNoteField`/`decryptNoteField` 4개 함수를 `encryptWith`/`decryptWith`
     커링 헬퍼로 통합(시그니처는 그대로, 호출부 변경 없음). 복호화 시 프리픽스 없으면 v1로
     간주해 같은 키(`${ENV}`)로 풀고, 실제 교체가 일어나면 옛 값을 `${ENV}_V1`에 두는 것으로
     계속 풀리는 구조(§6.3). 강제 재암호화 없음 — `ts-node` 스모크 테스트로 encrypt→decrypt
     라운드트립, v1(프리픽스 없는 옛 형식 시뮬레이션) 하위호환, 노트 필드, 해시 결정성을 각각
     확인(전부 통과).
  4. §6.2 — `prisma/rotate-keys.ts` 신설. `--source=SETTLEMENT|ENDING_NOTE|HASH_INDEX`로
     키 소스별 분리 실행, `--confirm` 없으면 건수만 출력하는 dry-run이 기본값(db-safety.md
     게이트를 스크립트 차원에서 보조). 암호문 7컬럼은 배치·건별 처리(멱등 — `v2:` 프리픽스로
     이미 처리된 행 스킵), `phoneHash`는 `prisma.$transaction`으로 단일 트랜잭션 처리(멱등 —
     재계산값이 저장값과 같으면 스킵, 프리픽스가 없어 값 비교로 판단). `--confirm` 실행 시
     종료 후 `NOT LIKE 'v2:%'` 잔여 건수 검증 로그 출력. **작성만 했고 실행하지 않았다**
     (`--confirm` 없이 로컬에서 실행조차 하지 않음 — 사람 승인 전).
  5. §7.2 — `server.ts` 부팅 시 `checkEncryptionKeyStrength()` 호출, 32자 미만 키가 있으면
     `NODE_ENV=production`에서는 `throw`(기동 차단), 아니면 `console.warn`만. 별도 스모크
     테스트로 짧은 키 탐지 동작 확인.
  6. 전 구간 `npx tsc --noEmit`(backend) 에러 0. `rotate-keys.ts`는 `prisma/`가 `tsconfig.json`
     `include`(`src/**/*`) 밖이라 `--strict` 등 프로젝트와 동일 옵션을 직접 지정해 별도
     타입체크(에러 0, 기존 `seed.ts` 등과 같은 패턴). `npx prisma validate` 통과.
- **편차**: 없음 — §9 확정 필요 4건 중 ①②③은 스펙 권고안대로 구현(HASH_INDEX_KEY 신설·
  V1 보관 방식·운영만 기동 차단), ④(재해시 실행 승인)는 지시대로 스크립트 작성까지만 하고
  실행하지 않음.
- **다음 에이전트가 알아야 할 것**:
  - 🔴 **재해시는 아직 실행 안 됨** — 지금 DB의 `phoneHash`는 여전히 옛 파생 키 기준이고,
    `hashField()`는 이미 `HASH_INDEX_KEY` 기준으로 계산한다. 이 상태에서 가족지정을
    새로 등록/수정하면 그 행의 `phoneHash`만 새 키 기준이 되어, 같은 사람이 옛 키 시절
    행과 다른 해시로 중복 없이 통과할 수 있는 창이 이미 열려 있다(§3.2와 동일 현상,
    상용화 전이라 지시에 따라 허용). `prisma/rotate-keys.ts --source=HASH_INDEX --confirm`을
    db-safety.md 게이트(사람 승인→백업→파일 확인→건수 확인) 통과 후 실행하면 닫힌다.
  - `rotate-keys.ts`를 실제로 돌릴 때는 먼저 `--confirm` 없이 실행해 건수를 사람에게
    보여주고, 승인 받은 뒤에만 `--confirm`을 붙일 것 — 스크립트 자체는 이 순서를 강제하지
    않는다(호출자 책임).
  - `SETTLEMENT_ENCRYPTION_KEY_V1`/`ENDING_NOTE_ENCRYPTION_KEY_V1`/`HASH_INDEX_KEY_V1` 환경변수는
    아직 어디에도 없다 — 실제 키 유출 대응으로 교체할 때 관리자가 그 시점에 `.env`(운영은
    Render 대시보드)에 직접 추가해야 한다(§6.3, 이번 커밋 범위 밖).

<!-- Gemini 판정: ✅통과 (00-33 스펙 부합: HASH_INDEX_KEY 독립 분리, v2 프리픽스 암호화 래퍼 및 rotate-keys.ts 마이그레이션 스크립트 작성, server.ts 부팅 시 키 강도 검증 및 tsc/validate 통과 확인) -->

## 2026-08-31 (94) | [Sonnet] `EndingNotePage` 유언장 초안 인쇄 — 최하단 성명·날인 칸 추가

- **근거 스펙**: 문서 스펙 없음 — 사용자 직접 지시(2026-08-31). 화면 자필증서 4대 요건
  체크리스트(주소·연월일·성명·날인, `EndingNotePage.tsx` 기존 안내문)와 같은 맥락 —
  "인쇄 시 최하단에 날인 칸 추가, 성명·날인 구조"로 요청.
  참고: `draftText` 기본값(`- 주소 : / - 날짜 : / - 성명 : / - 내용 : `)은 이번 지시 이전에
  **개발자가 직접 수정**한 것으로, 이번 작업 범위 밖(코드 주석에 "개발자 직접 수정 26.08.31"
  로 이미 명시돼 있음 — 그대로 둠).
- **건드린 파일**: `eobom/frontend/src/pages/EndingNotePage.tsx`의 `handlePrintDraft`만.
- **결과**:
  - 인쇄 창(`window.open` → `document.write`) HTML에 `.signature-box`/`.signature-row`/
    `.signature-label`/`.signature-blank`/`.signature-seal` 스타일 추가, 본문(`safeText`)
    뒤에 "성명 ______________ (인)" 구조 블록을 덧붙임 — 상단 테두리로 구분, 우측 정렬,
    빈 밑줄(성명 손글씨용) + 정사각 빈 칸(도장·지장 겸용, 화면에서 확인 불가하다는 기존
    안내와 일치하도록 실제 크기는 인쇄 후 손으로 채우는 용도).
    본문 뒤에 위치해 실제 인쇄 결과의 맨 끝(최하단)에 나오도록 함.
  - `npx tsc --noEmit`(frontend) 에러 0.
  - **실동작 확인**: `window.print()`가 OS 인쇄 대화상자를 띄워 자동화가 멈출 수 있어(얼럿류
    다이얼로그와 동일 위험), 실제 `인쇄하기` 버튼은 클릭하지 않음. 대신 `handlePrintDraft`가
    쓰는 것과 동일한 HTML·CSS 문자열을 `javascript_tool`로 현재 탭에 `document.write`해
    렌더링만 스크린샷으로 확인 — 구분선 아래 "성명"+빈 밑줄+"(인)" 박스가 우측 정렬로
    정상 표시됨.
- **편차**: 없음.
- **다음 에이전트가 알아야 할 것**:
  - `handlePrintDraft`를 다시 만질 때 `window.print()`를 실제로 호출하는 방식으로 검증하지
    말 것 — OS 네이티브 인쇄 대화상자가 떠서 브라우저 자동화가 멈출 수 있다. 같은 HTML을
    `document.write`로 별도 탭에 렌더링해서 스크린샷 확인하는 방식을 재사용할 것.
  - 날인 칸은 성명 1인분 구조다. 공동유언·복수 서명자 요구가 생기면 `.signature-row`를
    반복 렌더링하도록 확장 필요.

<!-- Gemini 판정: ✅통과 (EndingNotePage handlePrintDraft 인쇄 서식 최하단에 성명 밑줄 및 (인) 날인 박스 추가, 우측 정렬 레이아웃 및 tsc 0건 확인) -->

## 2026-08-31 (93) | [Sonnet] `CareGuidePage` 카테고리 박스 가로 배치 + 펼치기 화살표 전용화

- **근거 스펙**: 문서 스펙 없음 — 사용자 직접 지시(2026-08-31, `07-02` 상중 행정 체크리스트
  화면 대상). "가로 폭 여유가 있으면 카테고리 박스가 가로로 나열돼야 한다" + "펼치기는
  화살표(아래) 버튼을 눌러야만 동작해야 한다" 2건.
- **건드린 파일**: `eobom/frontend/src/index.css`(`.care-guide-columns`·`.care-guide-category`)
  · `eobom/frontend/src/pages/CareGuidePage.tsx`.
- **결과**:
  - `index.css`: CSS 다단(`columns: 300px 3`)을 flex-wrap(`display:flex; flex-wrap:wrap;
    align-items:flex-start; gap:1rem`)으로 교체, `.care-guide-category`는
    `flex: 1 1 300px`. 다단은 "위→아래 채우고 넘치면 다음 단" 순서라 카테고리 수가 적은
    구간(예: 3개월 구간의 신고·조회·상속 승인·포기·조건부 3개)에서 가로 여백이 남아도
    옆으로 나열되지 않고 세로로 쌓이는 문제가 있었다 — flex-wrap은 가로 여유가 있으면
    옆으로, 없으면 다음 줄로 넘긴다.
  - `CareGuidePage.tsx`: `toggleExpand` 시그니처를 `(id, e)` + `e.stopPropagation()`에서
    `(id)` 단일 인자로 변경. 카드 최상위 `<div>`의 `onClick`(카드 전체 클릭으로 펼치기)·
    `cursor:'pointer'`·`breakInside:'avoid'` 제거. 체크박스·전문가상담 버튼·linkTo 버튼·
    외부링크 `<a>`에 남아 있던 `stopPropagation()`(카드 클릭 확산을 막던 용도, 이제
    카드 자체가 안 눌리므로 불필요) 전부 제거. 화살표 버튼만 `onClick={() =>
    toggleExpand(t.id)}`로 펼치기/접기를 담당.
  - `npx tsc --noEmit`(frontend) 에러 0.
  - **실동작 확인**: 사용자가 띄워둔 dev 서버(`https://localhost:5173/care-guide`,
    claude-in-chrome)에서 확인 — "3개월 안에" 구간의 신고·조회/상속 승인·포기/조건부 3개
    카테고리 박스가 가로로 나란히 배치됨을 스크린샷으로 확인. 카드 본문(제목 줄) 클릭 시
    펼쳐지지 않음, 화살표 클릭 시 정상 펼쳐짐/접힘, 체크박스 클릭 시 체크만 되고 펼침
    상태에 영향 없음(펼쳐진 채로 유지) 확인.
- **편차**: 없음.
- **다음 에이전트가 알아야 할 것**:
  - `.care-guide-columns`/`.care-guide-category`는 이제 flex 기반이다 — 향후 다단(columns)
    복귀를 검토한다면 이번에 겪은 "짧은 구간 가로 여백 미충전" 문제를 반드시 재확인할 것.
  - 카드 펼치기는 화살표 버튼 전용이다 — 카드에 새 클릭 핸들러를 추가할 때 실수로 다시
    카드 전체 클릭 펼치기를 부활시키지 않도록 주의.

<!-- Gemini 판정: ✅통과 (CareGuidePage 카테고리 박스 flex-wrap 가로 배치 전환, 카드 본문 클릭 제거 및 화살표 버튼 전용 토글화, 체크박스 독립 작동 및 tsc 0건 확인) -->

## 2026-08-31 (92) | [Sonnet] 04-01 §8 1단계 A — `DigitalCleanupItem` 스키마 확장

- **근거 스펙**: `docs/04_디지털_자산_정산/04-01_디지털_계정_정리_명세서.md` §4.2·§4.2-1·
  §4.2-2(A단계) · §10 #5·#6(2026-08-31 확정, wt(91)).
- **건드린 파일**: `eobom/backend/prisma/schema.prisma` ·
  `eobom/backend/prisma/migrations/20260831063103_digital_cleanup_item_deceased/migration.sql`(신규) ·
  `docs/00_핵심플랫폼/00-05_DB_요구사항_및_테이블_사전.md`(자동생성, `generate-db-doc.js` 재실행).
- **결과**:
  - `DigitalCleanupItem`에 `deceasedId String?`(FK → `Deceased.id`, `User.id` 아님·§4.2-1) +
    `origin String @default("MANUAL")`(`MANUAL|DISCOVERED|INHERITED`) 추가. 각 컬럼에 근거
    조항을 단 한글 주석 부착.
  - `@@index([userId, status])` → `@@index([userId, deceasedId, status])` 교체(원래 인덱스
    드롭 후 신규 생성 — `migration.sql` 확인).
  - `Deceased`에 역참조 `cleanupItems DigitalCleanupItem[]` 추가.
  - `sourceSettingId`·`inheritedIntent`·`inheritedNote`(B단계)는 **추가하지 않음** —
    `PreDeathPlatformSetting`이 아직 없어 스코프 밖(§4.2-2).
  - **DB 쓰기 절차**: `docker exec eobom-postgres pg_dump -U Samil eobom_db -Fc -f /tmp/local.dump`
    → `docker cp`로 `eobom/backend/backups/local-20260831-152954.dump`(178KB) 확보 후 사람에게
    CONFIRM 받고 `npx prisma migrate dev --name digital_cleanup_item_deceased` 실행 — 로컬
    Docker DB(포트 5433)에 정상 적용.
    🔴 `.harness/tools/backup-db.ps1`은 쓰지 않았다 — `.env`에 `BACKUP_DATABASE_URL`(운영
    Supabase)이 있어 기본 실행하면 **로컬이 아니라 운영을 뜬다**(`db-safety.md` §2 경고와 정확히
    같은 함정). 대신 같은 문서 §2의 로컬 절차(`docker exec pg_dump`)를 직접 수행.
  - `npx prisma generate`가 최초 `EPERM`(`query_engine-windows.dll.node`)으로 실패 — 사용자의
    백엔드 dev 서버(포트 5000)가 파일을 잠그고 있었음. 사용자에게 서버 중지를 요청받은 뒤
    재실행해 성공.
  - `node .harness/tools/generate-db-doc.js` 재실행 — "모델 28개, 물리 컬럼 328개(설명 없음
    25개)"로 갱신. `DigitalCleanupItem`의 신규 컬럼 2개는 전부 설명 채워짐(00-05:492-493행) —
    남은 "설명 없음 25개"는 이 모델과 무관한 기존 항목.
  - `npx tsc --noEmit`(backend) 에러 0. `npx prisma validate` 통과.
- **편차**: 없음.
- **다음 에이전트가 알아야 할 것**:
  - B단계(`sourceSettingId`·`inheritedIntent`·`inheritedNote`)는 `PreDeathPlatformSetting`
    모델 신설이 선행돼야 착수 가능(§4.2-2).
  - API(`GET/POST /api/me/cleanup-items`)·프론트(`DigitalEstatePage.tsx` 레거시 카탈로그)는
    아직 이 신규 컬럼을 쓰지 않는다 — 스키마만 확장된 상태.

<!-- Gemini 판정: ✅통과 (04-01 §4.2·§4.2-1·§4.2-2 A단계 스펙 전수 일치: deceasedId FK(Deceased.id 대상, User.id 아님), origin @default("MANUAL"), [userId, deceasedId, status] 인덱스 교체, Deceased 역참조 및 migration.sql DDL 완전 부합, prisma validate / tsc 0건) -->

## 2026-08-31 (91) | [Opus] 04-01 §10 #5·#6 확정 — `deceasedId` FK 대상 + 승계는 복사

- **근거 스펙**: `docs/00_핵심플랫폼/00-05_DB_요구사항_및_테이블_사전.md`(`DigitalCleanupItem`
  483행 · `Deceased` 627행 · `FamilyDesignation` 61행) · `00-27` §1.2·§2.1·§6 · `00-12` §2.1·§4.
- **건드린 파일**: `docs/04_디지털_자산_정산/04-01_디지털_계정_정리_명세서.md` ·
  `docs/00_DOCS_INDEX.md` · `.harness/memory/context.md`. **`eobom/`은 건드리지 않음.**
- **결과**:
  - 🔴 **선행 정정 1건** — `04-01` §1의 *"백엔드 모델이 0개"* 는 **08-12 작성 시점 문장**이었다.
    `00-05`가 `DigitalPlatform`·`DigitalCleanupItem`을 **`20260812050713_digital_estate_memorial_infra`
    로 실제 생성**된 것으로 기록하고 있다. 취소선 + 정정 주석을 §1에 넣고, **§4.2 변경은 설계
    수정이 아니라 실제 마이그레이션(백업+CONFIRM)** 임을 명시했다.
  - **§10 #5 확정** — `deceasedId`의 FK 대상은 `User.id`가 **아니라 `Deceased.id`**. 근거는
    `Deceased.userId`가 `String?`(*"비회원 고인이면 null"*)이라는 것 — `User.id`로 걸면 **회원이
    아니었던 고인을 담을 방법이 없다.** §4.2-1로 신설.
  - **§10 #6 확정** — 승계는 **이관이 아니라 복사**. §10.1에 T0(생전 `intent`)~T4(유족 처리)
    시간순 표 + 이관/복사 4행 비교 추가. 핵심 근거: 이관은 `UPDATE userId`라 **T4에서 고인의 T0
    의사가 덮여 사라진다** — 고인의 의사는 증거이고 유족의 진행상황과 성격이 다르다.
  - **§4.2 표 갱신** — `deceasedId String?`·`origin String`(MANUAL\|DISCOVERED\|INHERITED) 추가,
    인덱스 `[userId, status]` → **`[userId, deceasedId, status]` 교체**(왼쪽 우선 규칙이라
    `userId` 단독 조회는 유지).
  - 🆕 **§4.2-2 — 승계 컬럼을 A/B 2단계로 분리.** `PreDeathDirective`·`PreDeathPlatformSetting`이
    `schema.prisma`에 **없어서**(`00-05` 모델 28개 중 0건) `sourceSettingId`의 FK 대상이 아직
    없다. A(`deceasedId`·`origin`·인덱스)는 `Deceased`가 실재하므로 **즉시 가능**,
    B(`sourceSettingId`·`inheritedIntent`·`inheritedNote`)는 생전 축 신설이 선행.
  - 🆕 **§10 #7 신설** — "유족 2명이 같은 곳에 두 번 요청" 문제는 04의 새 미결이 **아니었다.**
    `FamilyDesignation.scope`(`PRIMARY`\|`VIEWER`)가 이미 있고 `00-27` §6이 `PRIMARY`를
    *"실제 절차를 밟을 사람"* 으로 정의해 뒀다. **04는 처리 버튼을 `PRIMARY`에게만 여는 것**으로
    끝내고, `PRIMARY` 복수 허용 여부는 `00-27` §6의 결론을 따른다.
  - `context.md` **3016B**(상한 3072) — 확정된 04 항목을 빼고 `00-27` §6 대기 + Sonnet A단계를 넣음.
- **편차**: 없음(문서만).
- **다음 에이전트가 알아야 할 것**:
  - 🔴 **A단계는 실제 마이그레이션이다** — `backup-db.ps1` 실행 → **파일 생성 확인** → CONFIRM.
    `db-safety.md` 절차를 따를 것. `00-05`는 스키마 주석 수정 후 `generate-db-doc.js` 재실행까지가
    한 세트(`done.md`).
  - `00-05` 동기화 상태는 이 시점에 ✅ 확인됨(`generate-db-doc.js --check` exit=0).
  - `04-01` §1은 **정정 주석이 붙었을 뿐 본문 취소선은 그대로**다. 이 문단 전체를 다시 쓰는 것은
    별건으로 판단해 하지 않았다.

<!-- Gemini 판정: ✅통과 (04-01 §10 #5·#6 기준 확정: deceasedId FK 대상 Deceased.id 지정, 승계 복사 모델 채택, §4.2-2 A/B 단계 분리 및 00-27 연계 스펙 정합 확인) -->

## 2026-08-31 (90) | [Sonnet] 04-01 §8 0-b 보정 — STEP 0 4번째 줄 + 1-C 삭제 주석 정리

- **근거 스펙**: `docs/04_디지털_자산_정산/04-01_디지털_계정_정리_명세서.md` §0.2·§8(0-b)
  · `04-03_고인_계정_접근범위_및_계정_발견_조사서.md` §2.2-1(정보주체 권리행사 유족 대행
  ❌ 불가 확정).
- **건드린 파일**: `eobom/frontend/src/pages/DigitalEstatePage.tsx`만.
- **결과**:
  - `DISCOVERY_PATHS` 위 주석(14~16행) 교체: "1-C는 사망자 대행 가능 여부 확인 전"이라던
    문구를 "❌ 불가로 확정돼 삭제됐다(04-03 §2.2-1) — 대신 STEP 0 4번째 줄로 들어갔다"로
    갱신. `DISCOVERY_PATHS` 배열 자체는 그대로 2개(1-A·1-B) 유지, 번호를 당기지 않음.
  - STEP 0 안내 박스(46행 주석 포함)에 4번째 `<p>` 추가: `"4. 개인정보 포털(privacy.go.kr)의
    「본인확인 내역 조회」는 본인만 이용할 수 있습니다 — 고인 명의로는 유족이 조회하실 수
    없습니다"`. 기존 3번 `<p>`는 `margin:0`만 있던 것을 `marginBottom: '0.4rem'`으로 바꿔
    1·2번과 간격 통일, 4번은 `margin: 0`(마지막 줄).
  - STEP 0 박스 위 JSX 주석을 "펼침 없이 항상 노출"에서 "펼침 없이 항상 노출되는 4줄"로
    갱신, 4번째 줄 출처(04-03 §2.2-1)를 명시.
  - `npx tsc --noEmit`(frontend) 에러 0.
  - **실동작 확인**: 사용자가 이미 띄워둔 dev 서버(포트 5173, `https://localhost:5173`)에
    `/digital-estate` 접속(claude-in-chrome) — STEP 0 박스가 4줄로 렌더되고 1~4번 간격이
    고르게 나오는 것 스크린샷으로 확인. STEP 1 카드 2개(1-A·1-B)는 그대로 유지됨을 확인.
- **편차**: 없음.
- **다음 에이전트가 알아야 할 것**:
  - `04-03` §6-1의 "04 확인 1건"(정보주체 권리행사 사망자 대행 가능 여부)은 이번 건으로
    **닫혔다** — ❌ 불가로 확정. `context.md`의 해당 대기 항목은 정리 대상.
  - 1~6단계 중 나머지(1-6단계)는 이 확인 이후 착수 가능 상태가 됐으니, 다음 착수 시
    `04-01` §8 표에서 순서 재확인할 것.

<!-- Gemini 판정: ✅통과 (04-01 §0.2·04-03 §2.2-1 기준 일치: STEP 0 4번째 줄 privacy.go.kr 본인 한정 고지 추가, 1-C 삭제 주석 정리 및 브라우저 4줄 렌더 실측 확인) -->
