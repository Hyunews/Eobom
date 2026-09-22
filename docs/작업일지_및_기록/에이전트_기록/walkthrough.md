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
> 🔴 **2026-09-22 — 3차 아카이빙**(549KB → 이 파일). 판정 완료 125건 → [`_아카이브_2609`](walkthrough_아카이브_2609.md)(9월분) ·
> [`_아카이브_2608`](walkthrough_아카이브_2608.md)(08-31분). 남은 것 = 판정 대기 + 판정 표기 없음. 기준 → `record.md` §2-1.

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

## 2026-09-11 (204) | [Sonnet] 전 페이지 모바일 검증 루프 ①`FarewellMessagePage` — 설명문 제거·줄글 축약 신규 기준 적용

- **근거 스펙**: 스펙 없음 — 2026-09-11 사람 직접 지시(전 페이지 모바일 검증 루프 재시작 지시에 첨부) "①모든 도메인 페이지 제목 아래 회색 설명문을 모바일에서 모두 없앤다 ②줄글을 최대한 축약/제거한다"를 목업(`_mockups/FarewellMessagePage.html`)으로 확인받고 승인. `06-05_유족메시지_보관함_도메인분리_기획서.md` §4.3과는 (3)에서 반대 방향(편차 참고).
- **건드린 파일**: `eobomDev/frontend/src/components/farewell/FarewellMobileView.tsx` · `eobomDev/frontend/src/components/farewell/FarewellNotice.tsx`
- **결과**:
  1) `FarewellMobileView.tsx`(구 34-36행) 제목 아래 설명문 `"가족 한 분 한 분께 따로 남기는 편지입니다. 완료해야 할 항목은 없습니다 — 생각날 때마다 남기세요."` 완전 삭제(모바일 전용 컴포넌트라 파일에서 통째로 제거, 데스크톱 `FarewellDesktopView.tsx`는 미변경).
  2) `FarewellMobileView.tsx` 빈 상태 안내문 `"편지를 남기려면 먼저 받으실 분을 가족으로 지정해 주세요. 수신자가 없으면 사후에도 전달되지 않습니다."` → `"받으실 분을 먼저 가족으로 지정해 주세요."`로 축약(사람 승인).
  3) `FarewellNotice.tsx`(Desktop·Mobile 공용) 고지문 `"여기에 남기신 글과 음성은 사망 확인 후 지정하신 분에게 전달됩니다. 재산 분배·상속에 관한 내용은 남기지 마세요 — 유언의 효력이 없고 유족 간 다툼의 씨앗이 됩니다."` → `"여기에 남기신 글과 음성은 사망 확인 후 지정하신 분에게 전달됩니다."`로 축약(사람이 "데스크탑과 모바일 환경 모두" 명시).
  `npx tsc --noEmit`·`npm run build`(eobomDev/frontend) 통과.
- **편차**: `FarewellNotice.tsx`의 "재산 분배·상속에 관한 내용은 남기지 마세요…" 문장은 `06-05` §4.3 원문에 있고 wt174에서 "원문 복원"한 이력이 있다 — 이번에 사람이 축약을 다시 직접 지시해 재차 삭제, §4.3과 구현이 다시 갈라진다. Opus가 §4.3을 이 축약본 기준으로 갱신할지 판단 필요.
- **다음 에이전트가 알아야 할 것**: 🆕 2026-09-11 사람 지시로 "①제목 아래 회색 설명문 모바일 제거 ②줄글 최대 축약" 2개 규칙이 22페이지 루프 전체의 공통 기준으로 확정됐다(단, 페이지마다 목업으로 개별 승인 필요 — 일괄 적용 금지). `.page-subtitle` 클래스(index.css:1000, ≤768px 자동 `display:none`)를 쓰는 페이지(CareGuidePage·EndingNotePage 등 8개 파일)는 이미 규정을 자동으로 만족하고 있어 손댈 것이 없다 — 인라인 style로 별도 설명문/줄글을 그린 컴포넌트만 페이지별로 개별 확인이 필요하다. 다음 = 2번 `CareGuidePage`부터 이 2규칙 기준으로 ①실측 재확인 후 순서대로 진행.

<!-- Gemini 판정 대기 -->

## 2026-09-11 (205) | [Sonnet] 전 페이지 모바일 검증 루프 ②`CareGuidePage` — 상속포기 배너 줄글 축약(모바일은 완전 제거)

- **근거 스펙**: 스펙 없음 — 2026-09-11 사람 직접 지시(wt204와 같은 루프, 규칙②줄글축약 적용). 최초 제안(문장만 축약)을 사람이 재수정 지시: "정정한다, 제목인 3개월 안에 결정해야한다는 내용과 중복되니 모바일에서는 ... 내용도 지운다."
- **건드린 파일**: `eobomDev/frontend/src/pages/CareGuidePage.tsx`
- **결과**: 상속포기 배너(§3.1) 문단 `"상속포기·한정승인 기한은 상속개시를 안 날로부터 3개월입니다. 지나면 채무를 그대로 물려받습니다."`를 `"상속포기·한정승인 기한은 상속개시를 안 날로부터 3개월입니다."`로 축약하고, `{!isMobile && (...)}`로 감싸 **모바일에서는 이 문단 자체를 렌더하지 않도록** 함(같은 배너의 `<h3>` 제목 "고인에게 빚이 있을 수 있다면, 3개월 안에 결정해야 합니다."와 내용이 겹친다는 사람 판단). 데스크톱은 축약본 문장만 그대로 노출. `npx tsc --noEmit`·`npm run build`(eobomDev/frontend) 통과.
- **편차**: 없음 — 사람 직접 지시 그대로 구현.
- **다음 에이전트가 알아야 할 것**: `CareGuidePage.tsx`의 `.page-subtitle`(149행) 설명문은 wt204 확인 시점에 이미 `.page-subtitle` 클래스로 모바일 자동 숨김 상태라 이번엔 안 건드렸다. 다음 = 3번 `EndingNotePage` — 이미 만들어둔 목업(`_mockups/EndingNotePage.html`, 목차 리스트+리더 모달 승인 대기 중)에 이번 2규칙(설명문 제거·줄글 축약)을 추가로 반영해 재확인 후 승인받을 것.

<!-- Gemini 판정 대기 -->

## 2026-09-11 (206) | [Sonnet] 전 페이지 모바일 검증 루프 ③`EndingNotePage` — 00-38 §8.1-2 적응형 분리(목차 리스트+리더 모달) + 줄글 축약

- **근거 스펙**: `docs/00_핵심플랫폼/00-38_적응형_모바일_UX_개편_명세서.md` §8.1-2(목업 방향 이미 확정) + 2026-09-11 사람 직접 지시(wt204·205와 같은 루프 — 줄글 축약). 사람이 `_mockups/EndingNotePage.html`(목차 리스트+리더 모달)을 "그대로 구현" 승인, 동의 안내문 축약은 별도 승인(가족 미지정 안내문은 원문 유지 선택).
- **건드린 파일**: `eobomDev/frontend/src/pages/EndingNotePage.tsx` · `eobomDev/frontend/src/index.css`
- **결과**:
  1) `EndingNotePage.tsx`에 `useIsMobile()` 도입. 모바일에서는 기존 `AccordionSection` 8개 스택 대신 `.ending-note-mobile-toclist`(제목+완료/미작성 배지 행, 탭하면 기존 `expandedSection` state를 세팅)를 렌더 — 그 state를 데스크톱은 "인라인 아코디언 펼침", 모바일은 "리더 모달 오픈 트리거"로 재해석해 공유한다(같은 `handleToggleSection`/`sectionState`/`savingState` 재사용, §6.2 상태는 부모 1벌 유지).
  2) 모바일에서 `expandedSection`이 있으면 `.ending-note-reader-overlay`(전체화면 시트) 마운트 — `sectionBodies[code]` + `SectionTimingControl` + 저장/취소 버튼(하단 고정). "한눈에 보기" 요약 모달과 같은 패턴(ESC로 닫기·body 스크롤 잠금)의 별도 `useEffect` 추가(`isMobile && expandedSection` 가드). 데스크톱 렌더 경로(`AccordionSection` map)는 그대로 — 변경 없음.
  3) 동의 안내 폴백 문구 `"이어봄은 회원님이 작성한 내용을 암호화하여 보관하며, 운영자는 내용을 열람하지 않습니다."` → `"작성 내용은 암호화 보관되며, 운영자는 열람하지 않습니다."`로 축약(데스크톱·모바일 공용). 가족 미지정 안내문(§10 Phase 2 #6)은 사람이 "그대로 유지" 선택해 미변경.
  4) `index.css`에 `.ending-note-mobile-toclist`·`-tocrow`·`.ending-note-status-pill`(`.done`/`.todo`)·`.ending-note-reader-overlay`·`-sheet`·`-head`·`-title`·`-body`·`-foot` 신설.
  `npx tsc --noEmit`·`npm run build`(eobomDev/frontend) 통과.
- **편차**: 동의 안내문의 실제 정본은 서버가 내려주는 `policyNotice`(`06-03` §5)이고 위 축약은 그 값이 아직 없을 때만 잠깐 보이는 프론트 폴백 문자열이다 — 서버 값 자체를 바꾸는 건 백엔드/`06-03` 소관이라 이번 프론트엔드 작업 범위 밖으로 남겨둔다.
- **다음 에이전트가 알아야 할 것**: 🔵 로그인 필요 화면(`00-29` §15)이라 에이전트가 직접 로그인해 검증할 수 없다 — 사람이 실기기로 ①목차 리스트 탭→리더 모달 오픈/닫기(ESC·바깥 클릭)②저장 성공 시 목차 배지가 "완료"로 바뀌는지③768↔769px 리사이즈 시 입력값이 유지되는지④데스크톱 1280px 아코디언 화면이 그대로인지 확인해야 한다(00-38 §11 DoD). 🟡 서버 `policyNotice` 문구를 이 축약본으로 맞출지는 `06-03` §5 소관 — Opus 판단 필요. 다음 = 4번 `ObituaryPage`(관리 모드는 wt179 완료·나머지만, Phase 3 재판정도 이 단계 ①에서 함께).

<!-- Gemini 판정 대기 -->

## 2026-09-11 (207) | [Sonnet] 전 페이지 모바일 검증 루프 ④`ObituaryPage`(개설 폼 본체) — §6.5 재판정 결과 ❌분리, 필드쌍 스택 + 줄글 축약

- **근거 스펙**: `docs/00_핵심플랫폼/00-38_적응형_모바일_UX_개편_명세서.md` §6.5 ⓒ·ⓓ·§8.2(재판정 대상, 관리 모드는 wt179에서 CSS만으로 이미 완료). 목업(`_mockups/ObituaryPage.html`)으로 사람 승인 — 단 "유족추가 부분은 현재의 폼을 유지한다"는 조건부.
- **건드린 파일**: `eobomDev/frontend/src/pages/ObituaryPage.tsx`
- **결과**:
  1) **§6.5 재판정 완료**: 개설 폼 본체는 화면 수·상태 기계 변화가 없는 순수 "배치" 변경이라 **❌ 분리하지 않음** — 이미 있는 `isMobile`(94행)로 인라인 style만 바꿨다. 00-38 §6.5 ⓓ의 사전 예측("배치 변경에 가깝다")이 실증됨.
  2) 상주 성함/관계 필드쌍(구 519-528행)과 계좌 은행명/예금주 필드쌍(구 565-568행) — `display:flex`에 `flexDirection: isMobile ? 'column' : 'row'` 추가, `flex:2`/`flex:1`은 `isMobile`일 때 `undefined`로 꺼서 세로 스택 시 폭이 100%가 되게 함. 데스크톱(`isMobile=false`)은 기존 가로 배치 그대로.
  3) 유족 추가 행(관계·성함·삭제버튼 3칸)은 **사람 지시로 미변경** — 기존 가로 배치 그대로 유지.
  4) 추모관 체크박스 설명 `"[선택] 이 부고장과 함께 추모관도 만들기 — 조문객이 온라인으로 헌화·방명록을 남길 수 있는 공간입니다. 나중에 '디지털 추모관' 화면에서 따로 만들 수도 있습니다."` → `"[선택] 추모관도 함께 만들기 — 헌화·방명록 공간(나중에 따로 만들기 가능)"`로 축약. 연락처 안내·계좌 경고·필수 동의 2건(허위신고·재공유)은 사람 지시로 미변경.
  `npx tsc --noEmit`·`npm run build`(eobomDev/frontend) 통과.
- **편차**: 없음 — 목업 체크포인트대로 구현하되 사람이 명시적으로 제외한 유족추가 행만 뺐다.
- **다음 에이전트가 알아야 할 것**: 관리 모드(부고장 있음, `obituaryRef`)의 수정 모달도 같은 `formCard`를 재사용하므로 이번 필드쌍 스택·문구 축약이 관리 모드 수정 화면에도 그대로 적용된다(같은 JSX 변수 공유, 의도된 결과). 🔵 로그인 필요 화면(`00-29` §15)이라 사람이 실기기로 ①360px에서 두 필드쌍이 세로로 스택되는지②768→1280 리사이즈 시 다시 가로로 돌아오는지③유족 추가 행이 기존 그대로인지 확인해야 한다. 다음 = 5번 `MyPage` — Phase 3 재판정(§6.5 ⓒ 기준)을 ①실측 단계에서 함께 판정할 것.

<!-- Gemini 판정 대기 -->

## 2026-09-11 | MyPage(모바일 검증 루프 5번) - §6.5 재판정 + 라벨/문구 정리

- **근거 스펙**: docs/00_핵심플랫폼/00-38_적응형_모바일_UX_개편_명세서.md §6.5 (c)(d) (Phase 3 착수 시 재판정). 라벨/문구 변경 3건은 사람 지시(즉흥, 스펙 문서 갱신은 [Opus] 몫으로 별도 요청 필요).
- **건드린 파일**: eobomDev/frontend/src/pages/MyPage.tsx
- **결과**: §6.5 재판정 결과 [X] 분리 불필요 확정(목업 _mockups/MyPage.html로 사람 승인, 코드 변경 없음이 원안). 이어서 사람 지시로 3건 구현: (1)stats 라벨 '상담 내역'->'상담', '문의 내역'->'문의', '내 부고장'->'부고장' (MyPage.tsx:161-163) (2)로그인 게이트 안내문 "예약 현황, 상담 내역, 엔딩노트 진행 상황을 한눈에 확인하세요." -> "부고장 현황, 상담 내역, 엔딩노트 진행 상황을 한눈에 확인하세요."(MyPage.tsx:123, 폐기된 "예약" 개념 제거) (3)"디지털 자산 정리" 행의 Badge status=preview("미리보기" 배지) 제거(MyPage.tsx:352 부근). tsc --noEmit -p eobomDev/frontend 통과(에러 0건).
- **편차**: 00-38 §8 표는 MyPage를 아직 "재판정 대기" 상태로 적어 두고 있다 - 이 항목으로 [X]분리 불필요로 확정됐으니 표 갱신 필요([Opus], docs/ 소유라 Sonnet이 직접 고치지 않음). context.md에 요청으로 남김.
- **다음 에이전트가 알아야 할 것**: 모바일 검증 루프 다음 차례는 6번 MyObituaryListPage(1.실측->2.목업->3.승인->4.구현, 공통 규칙 동일). "가족 지정" 모달(MyPageFamilyDesignation)의 바텀시트 전환은 이 루프와 별개 작업 항목(00-38 §8 표 "모달->바텀시트 공통 규칙")으로 남아 있음 - 착수 안 됨.

<!-- Gemini 판정 1줄: … -->

## 2026-09-11 | MyObituaryListPage(모바일 검증 루프 6번) - page-subtitle 추가 + 버튼 정렬 수정

- **근거 스펙**: docs/00_핵심플랫폼/00-38_적응형_모바일_UX_개편_명세서.md §6.5(c), §8 표(MyObituaryListPage는 이미 [X]분리불필요 확정 상태, 재판정 대상 아님). 버튼 정렬 건은 사람 지시로 실측 재점검 후 발견(즉흥, 스펙 문서에 명시 없음).
- **건드린 파일**: eobomDev/frontend/src/pages/MyObituaryListPage.tsx
- **결과**: (1) 규칙1 준수 - MyObituaryListPage.tsx:142 <p>에 className="page-subtitle" 추가(다른 8개 파일과 동일 패턴, index.css:1000-1006이 <=768px에서 display:none 처리). (2) "내가 만든 부고장" 카드의 이름/버튼 행(MyObituaryListPage.tsx:178)에서 justifyContent:'space-between' 제거하고 버튼 그룹 div(:193 부근)에 marginLeft:'auto' 추가 - 실브라우저(Chrome, 로컬 정적 서버로 재현 페이지 구동)에서 320/360/393/414/430/470/500/550/600px 8개 폭을 getBoundingClientRect로 정밀 측정해 검증. 수정 전: 320~430px(2버튼 케이스)·320~360px(1버튼 케이스)에서 이름 텍스트가 길어 버튼 그룹이 줄바꿈되면 justify-content:space-between이 "항목 1개인 줄은 좌측 정렬" 처리돼 버튼이 카드 왼쪽에 붙음(우측 여백 91~161px 남음). 수정 후: 320~600px 전 구간에서 wrap 여부와 무관하게 우측 오프셋 16px(카드 패딩과 동일)로 고정 확인. tsc --noEmit -p eobomDev/frontend 통과(에러 0건).
- **편차**: 없음(승인받은 목업 eobomDev/frontend/_mockups/MyObituaryListPage.html 그대로 구현).
- **다음 에이전트가 알아야 할 것**: 모바일 검증 루프 다음 차례는 7번 MyPageFamilyDesignation(모달) - 00-38 §8 표·부록의 "모달->바텀시트 공통 규칙"에 해당하며 LoginModal·InquiryModal·SummaryModal·AddressSearchModal까지 5개 모달에 적용되는 공통 규칙 작업이라 이번 페이지 건들보다 범위가 크다 - 착수 전 사람 확인 필요(이미 안내함). 검증에 쓴 재현 HTML은 스크래치패드에만 있고 프로젝트에는 남기지 않음(1회성 진단 도구).

<!-- Gemini 판정 1줄: … -->

## 2026-09-11 | MyObituaryListPage 후속수정 - 수정/삭제 버튼을 열기/공유와 병합(같은 크기)

- **근거 스펙**: 스펙 없음 - 즉흥 구현. 사람이 실기기 스크린샷(assets/obi_test.png, 360px)을 직접 확인하고 지시.
- **건드린 파일**: eobomDev/frontend/src/pages/MyObituaryListPage.tsx
- **결과**: 직전 항목(marginLeft:'auto' 우측정렬 수정)을 실기기로 확인한 결과, 이름/날짜 블록 + 36px 높이 버튼(--sp-4 패딩)이 360px에서 여전히 한 줄에 안 들어가 버튼이 아래로 떨어지는 현상은 남아 있었음. 사람 지시대로 근본 재구조화: 이름+상태(MyObituaryListPage.tsx:183 부근)와 날짜를 버튼 없는 단독 블록으로 되돌리고(더 이상 flex row로 감싸지 않음), 수정/삭제 버튼을 열기/공유 버튼과 같은 스타일(iconBtnStyle: height 32px, padding '0 0.6rem', fontSize var(--fs-caption))로 축소해 "부고장 [열기][공유]" 행(linkGroupStyle)에 그대로 이어붙임(순서: 부고장 라벨 - 열기 - 공유 - 수정(진행중일 때만) - 삭제). 삭제 버튼은 기존 danger 색상(border: state-danger-bg, color: state-danger-fg)만 유지. 결과적으로 이름/날짜 줄은 버튼과 폭을 다투지 않아 wrap이 필요 없어졌고, 합쳐진 버튼 줄은 폭이 부족하면 flexWrap으로 pill 목록처럼 자연스럽게 다음 줄로 흐름(justify-content 없음, space-between 계열 정렬 버그 재발 안 함). 크롬(로컬 정적 서버로 재현 페이지 구동)에서 320/360/393px 폭으로 scrollWidth/clientWidth 비교해 가로 스크롤 없음 확인. tsc --noEmit -p eobomDev/frontend 통과(에러 0건).
- **편차**: 직전 walkthrough 항목의 marginLeft:'auto' 수정은 이 항목으로 대체됨(코드상 완전히 제거됨) - 그 항목은 되돌리지 않고 이력만 남김.
- **다음 에이전트가 알아야 할 것**: MyObituaryListPage.tsx의 obituary 카드에서 "수정"/"삭제" 버튼은 이제 항상 iconBtnStyle 크기(32px)이고 열기/공유와 같은 줄(linkGroupStyle)에 있다 - 다시 별도 행으로 분리하거나 크기를 키우면 이번에 해결한 360px wrap 문제가 재발한다. _mockups/MyObituaryListPage.html도 최종안으로 갱신함. 다음 루프 차례는 7번 MyPageFamilyDesignation(모달, 바텀시트 공통규칙 5종) - 착수 방식 확인 대기 중.

<!-- Gemini 판정 1줄: … -->

## 2026-09-11 | MyObituaryListPage 후속수정2 - "부고장"/"추모관" 회색 라벨 제거

- **근거 스펙**: 스펙 없음 - 즉흥 구현. 사람 지시: "회색글씨 부고장 추모관 글자를 없앤다 버튼배열에 방해됨."
- **건드린 파일**: eobomDev/frontend/src/pages/MyObituaryListPage.tsx
- **결과**: 부고장 카드의 링크 행(MyObituaryListPage.tsx:195 부근)에서 `<span>부고장</span>`(width:3.4rem 고정폭 라벨) 제거, 추모관 카드의 링크 행(:276 부근)에서 `<span>추모관</span>` 제거. 두 라벨 다 제거 후 버튼(열기/공유/수정/삭제)이 행 맨 앞부터 바로 시작됨. tsc --noEmit -p eobomDev/frontend 통과(에러 0건).
- **편차**: 없음.
- **다음 에이전트가 알아야 할 것**: linkGroupStyle을 쓰는 두 행 모두 이제 라벨 없이 버튼만 있음. 모바일 검증 루프 6번(MyObituaryListPage) 관련 후속 조정은 이것으로 일단락. 다음 차례는 7번 MyPageFamilyDesignation(모달) - 착수 방식 확인 대기 중.

<!-- Gemini 판정 1줄: … -->

## 2026-09-11 | EndingNotePage - 모바일에 "한눈에 보기"(SummaryModal) 진입 버튼 없던 버그 수정

- **근거 스펙**: 스펙 없음 - 즉흥 구현. 사람이 모바일 검증 루프 7번(모달 바텀시트 작업) 착수 전 실측 질문에 답하는 대신 실기기 버그 리포트: "모바일 환경에서 SummaryModal 접근 통로 없음."
- **건드린 파일**: eobomDev/frontend/src/pages/EndingNotePage.tsx
- **결과**: 원인 확인 - "한눈에 보기" 트리거 버튼(EndingNotePage.tsx 원래 줄 783-791)이 `<aside className="ending-note-toc">` 안에만 있었고, 이 aside는 index.css에서 CSS로 모바일 숨김 처리됨(주석 "A3 - 데스크톱 좌측 섹션 목차 고정. 모바일은 CSS로 숨긴다"). 모바일 전용 목차 리스트(`.ending-note-mobile-toclist`, isMobile 분기)에는 이 버튼의 대응물이 전혀 없어 모바일에서 SummaryModal을 열 방법이 없었음. 수정: isMobile 분기를 Fragment로 감싸고, `.ending-note-mobile-toclist` 카드 아래에 데스크톱과 동일한 스타일(className="btn", ListChecks 아이콘, "한눈에 보기" 라벨)의 버튼을 추가해 `setSummaryOpen(true)`를 호출하게 함. 기존 `summaryTriggerRef`(모달 닫을 때 포커스 복귀용, EndingNotePage.tsx:280)를 이 새 버튼에도 똑같이 연결 - 데스크톱/모바일 중 하나만 렌더되므로 ref 충돌 없음. tsc --noEmit -p eobomDev/frontend 통과(에러 0건).
- **편차**: 없음.
- **다음 에이전트가 알아야 할 것**: 모바일 검증 루프 7번(모달→바텀시트 공통 규칙, MyPageFamilyDesignation 등 5종)은 착수 전 실측만 마친 상태 - SummaryModal이 이미 자체 ≤640px 전체화면 시트 대응(index.css:1948-1992, 2026-08-27 확정)이 있어 00-38의 새 바텀시트 규칙과 모양이 다르다는 점을 사람에게 확인 요청했으나, 사람이 이번엔 답 대신 실기기에서 발견한 버그 2건(이번 항목 + "ending-note 메모 모달 취소버튼 무반응")을 먼저 보고함. 이 항목으로 버그 1건 해결. 나머지 하나(취소 버튼)와 SummaryModal 바텀시트 여부 확정은 아직 열려 있음.

<!-- Gemini 판정 1줄: … -->

## 2026-09-11 | EndingNotePage - 모바일 리더 모달 "취소" 버튼이 안 닫히던 버그 수정

- **근거 스펙**: 스펙 없음 - 즉흥 구현. 사람 실기기 버그 리포트("ending-note의 메모 클릭 후 뜨는 모달에서 취소 버튼 반응 없음") + 확인 질문에 대한 답변("값 되돌리고 모달도 닫기").
- **건드린 파일**: eobomDev/frontend/src/pages/EndingNotePage.tsx
- **결과**: 원인 확인 - 모바일 리더 시트(`.ending-note-reader-sheet`, 섹션 탭 시 여는 전체 시트)의 "취소" 버튼은 `resetSection(expandedSection)`만 호출하고 시트를 닫지 않았음. 데스크톱 아코디언(`AccordionSection.tsx:41`)의 동일한 "취소" 버튼도 값만 되돌리고 안 접히는 것과 같은 동작이라 코드상 결함은 아니었으나, 모바일은 전체를 덮는 모달이라 안 닫히면 "반응 없음"으로 느껴짐(사람 확인 완료). 수정: 모바일 리더 시트의 취소 버튼 onClick에 `setExpandedSection(null)`을 추가해 값 되돌리기+시트 닫기를 함께 함(EndingNotePage.tsx 890행 부근). 데스크톱 AccordionSection의 취소 동작은 그대로 유지(안 접힘) - 이번 변경은 모바일 리더 시트에만 적용됨. tsc --noEmit -p eobomDev/frontend 통과(에러 0건).
- **편차**: 없음.
- **다음 에이전트가 알아야 할 것**: 이번 세션에서 발견된 실기기 버그 2건(SummaryModal 모바일 진입 통로 없음, 취소 버튼 무반응) 모두 해결됨. 모바일 검증 루프 7번(모달→바텀시트 공통 규칙, MyPageFamilyDesignation·LoginModal·InquiryModal·AddressSearchModal·SummaryModal)은 아직 착수 전 - SummaryModal이 이미 자체 ≤640px 전체화면 시트가 있어 00-38 새 규칙과 모양이 다른 문제가 미확정으로 남아 있음(사람에게 재확인 필요).

<!-- Gemini 판정 1줄: … -->

## 2026-09-11 | EndingNotePage - 모바일 "한눈에 보기" 진입 버튼 되돌림(사람 최종 결정)

- **근거 스펙**: 스펙 없음 - 즉흥 구현. 사람 지시: "모바일에서는 한눈에 보기가 없는게 나을거 같아 수정 부탁할게."
- **건드린 파일**: eobomDev/frontend/src/pages/EndingNotePage.tsx
- **결과**: 직전 항목(2026-09-11, "모바일에 한눈에 보기 진입 버튼 없던 버그 수정")에서 추가했던 모바일 전용 "한눈에 보기" 버튼(`.ending-note-mobile-toclist` 카드 아래 `<button ref={summaryTriggerRef} onClick={() => setSummaryOpen(true)}>`)을 제거하고 원래 구조(Fragment 없이 `.ending-note-mobile-toclist` 하나만)로 되돌림. 데스크톱 좌측 목차의 "한눈에 보기" 버튼(약 790행)은 그대로 유지 - 이 기능은 데스크톱 전용으로 확정됨. tsc --noEmit -p eobomDev/frontend 통과(에러 0건).
- **편차**: 없음 - 직전 항목의 "버그 수정"이 사람 재확인 후 "의도된 상태"로 뒤집힌 것. 직전 walkthrough 항목은 되돌리지 않고 이력만 남김.
- **다음 에이전트가 알아야 할 것**: "한눈에 보기"(SummaryModal)는 모바일에서 접근 불가가 최종 의도된 동작이다 - 다시 "버그"로 보고 진입 버튼을 추가하지 말 것. 이 결정으로 모바일 검증 루프 7번(모달→바텀시트 공통 규칙)에서 열려 있던 "SummaryModal을 00-38 바텀시트 규칙으로 통일할지" 질문은 무의미해짐 - 모바일에서 아예 안 열리므로 바텀시트 전환 대상에서 제외. 7번 대상은 이제 나머지 4개 모달(MyPageFamilyDesignation·LoginModal·InquiryModal·AddressSearchModal)로 좁혀짐.

<!-- Gemini 판정 1줄: … -->

## 2026-09-11 | 모달 4종 바텀시트 공통 규칙(모바일 검증 루프 7번) 구현 완료

- **근거 스펙**: docs/00_핵심플랫폼/00-38_적응형_모바일_UX_개편_명세서.md §8.2(MyPageFamilyDesignation 행 - 모달->바텀시트 전환, dvh 사용, --gutter-chrome) · §6.5 ⓒ(CSS만으로 충분, 별도 컴포넌트 분리 불필요). 사람 승인(목업 eobomDev/frontend/_mockups/Modals_BottomSheet.html).
- **건드린 파일**: eobomDev/frontend/src/index.css, eobomDev/frontend/src/components/mypage/MyPageFamilyDesignation.tsx, eobomDev/frontend/src/components/LoginModal.tsx, eobomDev/frontend/src/components/facility/InquiryModal.tsx, eobomDev/frontend/src/components/AddressSearchModal.tsx
- **결과**: index.css에 8개 클래스 신설(.myfamily-modal-backdrop/-panel, .login-modal-backdrop/-panel, .inquiry-modal-backdrop/-panel, .address-modal-backdrop/-panel) - 각각의 기본(비-모바일) 규칙은 기존 인라인 스타일 값을 그대로 옮긴 것(배경색·블러·z-index·데스크톱 maxWidth·padding 등 전부 동일, 시각적 회귀 없음). 그 아래 @media (max-width:768px) 블록 하나로 4개 backdrop 클래스에 align-items:flex-end+padding:0, 4개 panel 클래스에 max-width:none/width:100%/margin:0/border-radius:16px 16px 0 0/max-height:88dvh/overflow-y:auto/-webkit-overflow-scrolling:touch/padding-left,right:var(--gutter-chrome)/padding-top:1.4rem/padding-bottom:1.75rem를 동시 적용 - 이게 "공통 규칙"의 실체. 4개 TSX 파일은 각각 backdrop div와 panel div의 인라인 style 객체를 통째로 제거하고 className만 부여(onClick·ref 등 다른 prop은 그대로 유지). 부수 효과: LoginModal의 기존 max-height:90vh(모바일 주소창에 잘리는 문제)는 새 규칙의 max-height:88dvh가 소스 순서상 나중이라 자동으로 덮어씀 - vh->dvh 치환 완료. InquiryModal·AddressSearchModal은 원래 모바일에서 overflow 보호장치가 전혀 없었는데 이번에 같이 해결됨. tsc --noEmit -p eobomDev/frontend 통과(에러 0건). 구현 전 크롬(로컬 정적 서버로 동일 CSS 재현 페이지 구동)에서 320~398px 폭으로 getBoundingClientRect 측정 - 4개 다 bottomGap=0(바닥에 붙음)·border-radius 16px 16px 0 0·max-height 88dvh(~785px/892px 뷰포트)·padding-left 16px(--gutter-chrome)·overflow-y:auto 확인 완료.
- **편차**: SummaryModal(당초 5종 중 하나)은 별도 지시로 모바일 접근 자체를 없애기로 확정(이전 walkthrough 항목 참고)돼 이번 4종에서 제외 - 00-38이 원래 "모달 5종"이라 적은 것과 다름, 사람 확정 사항.
- **다음 에이전트가 알아야 할 것**: 모바일 검증 루프 7번(모달->바텀시트 공통 규칙) 완료. 00-38 §8 표·부록 순서상 다음은 부록 8개 페이지 중 첫 항목(§8.2 이후 목록, context.md 확인) - Phase 순서 목록 원문은 00-38 §Phase 순서 절 참고. AddressSearchModal의 다음 우편번호 위젯(420px 고정 height)이 이제 88dvh 안에서 스크롤 컨테이너에 들어가는데, 극단적으로 짧은 뷰포트(예: 가로모드)에서 위젯이 잘리는지는 실기기 확인 전까지 미검증.

<!-- Gemini 판정 1줄: … -->

## 2026-09-11 | FacilityPage(모바일 검증 루프 8번) - 실측 결과 이미 통과, 코드 변경 없음

- **근거 스펙**: docs/00_핵심플랫폼/00-38_적응형_모바일_UX_개편_명세서.md §8 표(FacilityPage, 이미 [X]분리불필요 확정, 재판정 대상 아님).
- **건드린 파일**: 없음(실측 결과 변경 불필요로 판정).
- **결과**: 규칙1(설명문 모바일 제거) 이미 준수 - FacilityPage.tsx:287 className="page-subtitle". 바로 아래 위치정보 상시고지문(:298)은 의도적으로 page-subtitle 미적용(00-21 §0.2-1 관련, 숨기면 안 되는 법적 고지 - 손대지 않음). 카드 그리드는 .grid(minmax(min(320px,100%),1fr))라 360px에서 자동 1열. 리스트형 카드 버튼(:707-723)은 이미 isMobile 삼항으로 라벨 제거+아이콘만(6번에서 적용한 것과 동일 패턴, 2026-09-10 사람이 선행 적용). 카드형 버튼(:856-890)은 flex:'1 1 0'+minWidth:100px+whiteSpace:nowrap로 폭 확보. 주소는 -webkit-line-clamp:2+minHeight 예약(:788-800)으로 카드 높이 정렬. 이미지 플레이스홀더는 hideImagePlaceholder(useIsMobile(480))로 ≤480px에서 렌더 자체 생략(:742). 모바일 전용 검색바+필터 바텀시트(:311-360, isFilterSheetOpen)가 이미 00-38 §8.2 바텀시트 개념(translateY 토글, 7번에서 구현한 CSS 클래스 방식과는 별개 구현)으로 존재 - 손댈 필요 없음. §6.5 재판정 불필요(재판정 대상 아니었음, ❌ 유지 확인만).
- **편차**: 없음.
- **다음 에이전트가 알아야 할 것**: FacilityReviewModal.tsx(facility/FacilityReviewModal.tsx:101)가 maxHeight:'85vh'(dvh 아님)를 쓰는 걸 발견했으나, 00-38이 지정한 "모달 5종/4종"(7번 대상) 목록에 없어 이번 루프 범위 밖으로 남겨둠 - 고치지 않음. 모바일 검증 루프 다음 차례는 9번 CounselingPage(§8 표 순서 ⑦ 나머지: CounselingPage·DigitalEstatePage, 둘 다 분리 없음).

<!-- Gemini 판정 1줄: … -->

## 2026-09-16 | 9번 CounselingPage 모바일 대응 재구현 (00-38 §8 표 ⑦) — 9c36db2 revert 후

- **근거 스펙**: `docs/00_핵심플랫폼/00-38_적응형_모바일_UX_개편_명세서.md` §8.3(줄755, CounselingPage 행) — "`minmax`·`repeat` 각 1곳 → `.auto-grid`. `TaxSimulatorModal`은 §8.2 바텀시트 공통 규칙 적용". §8.2(줄709)가 바텀시트 공통 규칙 대상으로 명시한 모달은 `LoginModal`·`InquiryModal`·`SummaryModal`·`AddressSearchModal`(+기준 `MyPageFamilyDesignation`)이고 `ConsultRequestModal`은 이 목록에 없다.
- **건드린 파일**: `eobomDev/frontend/src/pages/CounselingPage.tsx`, `eobomDev/frontend/src/components/counseling/TaxSimulatorModal.tsx`, `eobomDev/frontend/src/components/expert/ConsultRequestModal.tsx`, `eobomDev/frontend/src/index.css`. `_mockups/CounselingPage.html`은 삭제 상태로 둠.
- **결과**:
  1. `CounselingPage.tsx:176` 전문가 카드 그리드 — `style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(min(280px, 100%), 1fr))', gap:'1rem' }}` → `className="auto-grid"`.
  2. `TaxSimulatorModal.tsx` — 인라인 backdrop/panel 스타일을 `.tax-sim-modal-backdrop`/`.tax-sim-modal-panel`로 추출(`index.css`). 데스크톱 기본값은 원래 인라인 값과 동일(rgba(15,23,42,0.75) 배경·blur(8px)·zIndex 2200·maxWidth 560px·maxHeight 90vh). 768px 이하에서 기존 `.myfamily-modal-*`·`.login-modal-*`·`.inquiry-modal-*`·`.address-modal-*` 4종이 쓰던 `@media (max-width: 768px)` 바텀시트 블록(`align-items:flex-end`·`border-radius:16px 16px 0 0`·`max-height:88dvh`·`--gutter-chrome` 패딩)에 5번째로 합류.
  3. `ConsultRequestModal.tsx` — 인라인 backdrop/panel 스타일을 `.consult-modal-backdrop`/`.consult-modal-panel`로 추출. 원래 `maxHeight`/`overflow`가 전혀 없어 7필드 폼(이름·연락처·상담방식·일시·내용·동의문구·제출버튼)이 짧은 화면에서 하단 제출 버튼까지 스크롤이 안 닿던 실제 버그를 `max-height:88dvh; overflow-y:auto;`로 고침(목업 승인 체크포인트 ②의 수치를 그대로 씀). 바텀시트 미디어쿼리에는 합류시키지 않아 중앙 정렬을 모바일에서도 유지.
  4. `tsc --noEmit`(frontend·backend 각각) 에러 0. `npm run build`는 안 돌림.
  5. 실기동(360px·1280 회귀)은 사람이 하는 것 — 미검증.
- **편차**: `9c36db2`(같은 제목의 이전 커밋)를 `git revert --no-commit`으로 되돌리고 이 항목으로 다시 구현했다. 되돌린 이유·이전 구현이 스펙·목업과 어떻게 어긋났는지는 `backlog.md` ⑰에 상세 기록. 되돌려진 커밋에 있던 시뮬레이터 배너 `flexWrap` 수정·페이지 제목 모바일 축약(`useIsMobile`)·분야 필터 가로 스크롤은 `00-38` §8.3에 없는 항목이라 이번 재구현에 포함하지 않음(필요하면 별도로 다시 지시받아 처리).
- **다음 에이전트가 알아야 할 것**: 실기동 검증 대기(사람). `backlog.md` ⑰의 Gemini 판정도 별도로 남을 것 — 이 항목과 함께 확인.

<!-- Gemini 판정 1줄: 대기 -->

## 2026-09-16 | 9번 CounselingPage 후속 — 사용자 직접 지시 3건(줄글 정리·필터 슬라이드·제목 축약)

- **근거 스펙**: 스펙 없음 — 사용자 채팅 직접 지시. "1. 줄글 나열이 모바일 화면에서 지저분해서 정리필요. 2. 분야의 각 버튼을 슬라이드로 넘길 수 있도록 구현. 3. 제목 등 전문가 상담 으로 요약." (앞서 되돌린 `9c36db2`의 목업 `_mockups/CounselingPage.html` 개선안과 방향은 같지만, 이번엔 사람이 이 세션에 직접 낸 지시라 진위 문제가 없다 — 경위는 `backlog.md` ⑰.)
- **건드린 파일**: `eobomDev/frontend/src/pages/CounselingPage.tsx`, `eobomDev/frontend/src/components/counseling/TaxSimulatorModal.tsx`, `eobomDev/frontend/src/index.css`.
- **결과**:
  1. `CounselingPage.tsx` 시뮬레이터 배너 — 설명 문단 `<p>배우자·자녀 수 등 조건을 입력하면 예상 세액을 단계별로 계산해드립니다</p>` 삭제, 헤드라인 `<p>상속세, 대략 얼마나 나올까요?</p>`만 남김. CTA `간이 시뮬레이터 열기` → `계산하기`. `flexWrap:'wrap'` 안전장치 유지(극단적으로 좁은 화면 대비).
  2. `CounselingPage.tsx` 페이지 제목 — `useIsMobile()` 훅 도입, `{isMobile ? '전문가 상담' : '상속 · 법률 · 세무 비대면 전문가 상담'}`.
  3. `CounselingPage.tsx` 분야 선택 필터 — `flexWrap:'wrap'` → `flexWrap:'nowrap', overflowX:'auto', WebkitOverflowScrolling:'touch'`, 각 버튼에 `flexShrink:0, whiteSpace:'nowrap'` 추가(가로 슬라이드). `CareGuidePage`(§8.1-3①)와 동일 패턴.
  4. `TaxSimulatorModal.tsx` "계산 기준 및 참고사항" — 4개 `<p>` 문단(반영 항목·미반영 항목·법적 근거·면책)을 `<ul>` 3개 `<li>` + 굵은 경고 문단 1줄로 재구성. 수치·법적 근거 문구는 그대로 유지(삭제 없음), 형식만 문단→목록.
  5. `index.css` — `.counsel-sim-banner-cta`에 `@media (max-width: 768px) { flex-basis: 100%; justify-content: flex-end; }` 추가(헤드라인이 길어져도 CTA가 다음 줄로 안전하게 내려가도록).
  6. `tsc --noEmit`(frontend) 에러 0. `npm run build`는 안 돌림.
  7. 실기동(360px·1280 회귀)은 사람이 하는 것 — 미검증.
- **편차**: 없음(사용자 직접 지시 그대로 구현).
- **다음 에이전트가 알아야 할 것**: 실기동 검증 대기(사람). `backlog.md` ⑰가 이 항목으로 닫힘 — Gemini 판정 시 ⑰와 함께 확인.

<!-- Gemini 판정 1줄: 대기 -->

## 2026-09-16 | 9번 CounselingPage 2차 후속 — 배지 문구·헤드라인 폰트·필터 여백 (사용자 직접 지시)

- **근거 스펙**: 스펙 없음 — 사용자 채팅 직접 지시. "1. 변호사,세무사 1:1케어 > 전문가 상담 으로 변경. 2. 상속세,~나올까요? 부분의 폰트 키우기. 3. 분야 선택 버튼과 좌우스크롤간의 여백 너무 없이 딱붙어있음."
- **건드린 파일**: `eobomDev/frontend/src/pages/CounselingPage.tsx`.
- **결과**:
  1. 상단 배지 — `상속세 시뮬레이터 & 변호사 · 세무사 1:1 케어` → `상속세 시뮬레이터 & 전문가 상담`.
  2. 시뮬레이터 배너 헤드라인 `상속세, 대략 얼마나 나올까요?` — `fontSize` 미지정(기본 상속) → `var(--fs-lead)`(1.125rem)로 키움.
  3. 분야 선택 가로 스크롤 필터 — 버튼 사이 `gap` `0.5rem`→`0.6rem`, 스크롤 컨테이너에 `padding: '0.2rem 0.15rem 0.4rem'` 추가(기존엔 `paddingBottom`만 있어 좌우·위가 카드 경계에 딱 붙어 있었음).
  4. `tsc --noEmit`(frontend) 에러 0.
  5. 실기동은 사람 몫 — 미검증.
- **편차**: 없음(사용자 직접 지시 그대로 구현).
- **다음 에이전트가 알아야 할 것**: 실기동 검증 대기(사람). `backlog.md` ⑰ 계속.

<!-- Gemini 판정 1줄: 대기 -->

## 2026-09-16 | 9번 CounselingPage 3차 후속 — 필터 스크롤바-버튼 간 여백 확대 (사용자 직접 지시)

- **근거 스펙**: 스펙 없음 — 사용자 채팅 직접 지시. "가로 스크롤 자체와 버튼 사이의 공간을 말하는거임. 슬라이드 할때 뜨는 스크롤과 버튼 간의 공간!" (2차 후속에서 넣은 `paddingBottom: '0.4rem'`으로는 부족하다는 지적).
- **건드린 파일**: `eobomDev/frontend/src/pages/CounselingPage.tsx`.
- **결과**: 분야 선택 가로 스크롤 컨테이너의 `padding` 하단값을 `0.4rem` → `0.85rem`으로 키워 버튼 행과 (스크롤 시 나타나는) 스크롤바 사이 여백을 확대. 전체 세로 리듬 유지를 위해 바깥 `form-group`의 `marginBottom`은 `1.1rem` → `0.7rem`으로 줄여 상쇄(카드 하단 "전문가 카드 목록" 사이 총 간격은 이전과 비슷하게 유지). `tsc --noEmit` 에러 0.
- **편차**: 없음.
- **다음 에이전트가 알아야 할 것**: 실기동 검증 대기(사람) — 특히 이 패딩 값이 실제 브라우저(오버레이 스크롤바 vs 항상 표시 스크롤바)에서 충분한지 확인 필요.

<!-- Gemini 판정 1줄: 대기 -->

## 2026-09-16 | 9번 CounselingPage 4차 후속 — 시뮬레이터 배너 아이콘 크기 축소 (사용자 직접 지시)

- **근거 스펙**: 스펙 없음 — 사용자 채팅 직접 지시. "계산기 아이콘이 차지하는 영역이 너무 큼(추측컨대 div가 가진 여백이 좌우로 큰듯)."
- **건드린 파일**: `eobomDev/frontend/src/pages/CounselingPage.tsx`.
- **결과**: 시뮬레이터 배너의 아이콘 원(circle) `44px`→`38px`, 내부 `Calculator` 아이콘 `size={22}`→`size={20}`(비율 유지, 22/44=50%→20/38≈53%), 원과 헤드라인 사이 `gap`을 `var(--sp-4)`(16px)→`var(--sp-3)`(12px)로 줄임. 브라우저(1280px)에서 확대 스크린샷으로 축소 확인. `tsc --noEmit`(frontend) 에러 0.
- **편차**: 없음.
- **다음 에이전트가 알아야 할 것**: 실기동 검증 대기(사람) — 이번엔 브라우저 리사이즈 도구가 500px 밑으로 안정적으로 안 내려가 모바일 폭에서 재확인은 못 함(1280px에서만 육안 확인). 360px 등 좁은 폭에서 비율이 괜찮은지 마지막 확인 필요.

<!-- Gemini 판정 1줄: 대기 -->

## 2026-09-17 | 10번 DigitalEstatePage(모바일 검증 루프 마지막) — 실측 후 h1 page-title 클래스 누락 1건 수정

- **근거 스펙**: `docs/00_핵심플랫폼/00-38_적응형_모바일_UX_개편_명세서.md` §8.3(줄756, DigitalEstatePage 행 — "§4.5 치환 효과가 가장 큰 화면") + §8.3 그룹 공통행(줄753 — "그리드 → 1열 카드 스트림").
- **건드린 파일**: `eobomDev/frontend/src/pages/DigitalEstatePage.tsx`.
- **결과**: 실측 먼저 — §4.5(0.7~0.98rem 소형 리터럴 치환) 대상 `fontSize` 리터럴은 이 파일에 **0건**(이미 전부 `var(--fs-body)`이거나 `1.02rem`/`1.1rem`/`2rem`으로 DoD 기준선 위, 별도 전역 작업에서 선반영된 것으로 보임). 그리드(:74, `repeat(auto-fit, minmax(min(280px,100%),1fr))`)는 `auto-fit`이라 이미 좁은 화면에서 1열로 자동 접혀 기능상 문제없어 그대로 둠(FacilityPage 8번이 통과한 것과 같은 판단). 대신 `<h1>`(:133)이 다른 4개 페이지(CounselingPage·FacilityPage·CareGuidePage·ObituaryPage·MemorialPage)와 달리 `className="page-title"` 없이 `fontSize:'2rem'`을 고정값으로 박아둔 것을 발견 — 좁은 화면(`clamp(1.4rem, 5vw, 2rem)`의 하한 없이 항상 32px)에서 375px 가로 스크롤·줄바꿈 위험. `className="page-title"` 추가 + 인라인 `fontSize` 제거로 수정(데스크톱 렌더는 동일, `clamp` 상한이 2rem이라 시각 차이 없음). `tsc --noEmit`(frontend) 에러 0. 1280px 브라우저에서 회귀 확인(시각 동일).
- **편차**: 없음. `.btn`류 인라인 `height:'40px'/'42px'`(`--min-touch-target` 56px 미달)는 CounselingPage 등 여러 페이지에 이미 널리 퍼진 기존 패턴이라 이번 범위에서 손대지 않음 — `backlog.md` §4.5-5 터치타깃 Phase 3 몫.
- **다음 에이전트가 알아야 할 것**: 실기동 검증 대기(사람) — 특히 360px에서 `page-title` 클래스 추가 후 제목이 실제로 줄어드는지 확인. **00-38 §8 표 ⑦(모바일 검증 루프, 09-11 시작)이 이 항목으로 13개 전부 완료** — `context.md` 2번 갱신 필요([Opus]에게 §8 표 상태 갱신 요청도 함께).

<!-- Gemini 판정 1줄: 대기 -->

## 2026-09-17 | 00-38 Phase 4 착수 — HomePage·ObituaryLandingPage·MemorialLandingPage·FamilyInvitePage·PrivacyPage·TermsPage

- **근거 스펙**: `docs/00_핵심플랫폼/00-38_적응형_모바일_UX_개편_명세서.md` §8.4(그룹4 — 홈·랜딩형, 줄805~811) + §8.5(부록 판정, 줄813~829, 2026-09-17 Opus 확정) + §4.1(여백 토큰) + §4.3(--lh-reader) + §5.2(useIsMobile 훅 통일).
- **건드린 파일**: `eobomDev/frontend/src/components/legal/LegalDocLayout.tsx`, `eobomDev/frontend/src/pages/FamilyInvitePage.tsx`, `eobomDev/frontend/src/pages/MemorialLandingPage.tsx`, `eobomDev/frontend/src/pages/ObituaryLandingPage.tsx`. `HomePage.tsx`는 실측만 하고 변경 0(아래 참고).
- **결과**:
  1. `HomePage.tsx` — §4.5(소형 rem) 리터럴 0건. §5.2가 요구한 `EntryBoxes.tsx`의 `useIsMobile(767)` 전환은 이미 완료돼 있었고(주석에 §5.2 명시), `HomePage.tsx` 자체의 `useIsMobile(640)`+ref미러링도 문서(줄395)가 "통과, 스펙갱신 불요"로 이미 판정해 둔 상태. 좌우 거터 관련 raw px 패딩도 없음(레이아웃은 `00-23`이 정본이라 이번 범위 밖). **변경 0.**
  2. `ObituaryLandingPage.tsx`·`MemorialLandingPage.tsx`·`FamilyInvitePage.tsx` — 셋 다 App.tsx 레이아웃 밖 독립 페이지로 동일한 `pageShellStyle`/`shellStyle` 패턴을 쓰고 있었고, 좌우 여백이 `padding: '2.5rem 1rem'`로 raw 리터럴(16px)이었다. `1rem` → `var(--gutter-chrome)`로 토큰화(값은 16px로 동일 — `--gutter-chrome`과 정확히 일치해 시각 변화 없음). `FamilyInvitePage.tsx`는 §8.5가 Phase 4에 편입시킨 부록 1순위.
  3. `PrivacyPage.tsx`·`TermsPage.tsx` — 두 페이지 다 공용 컴포넌트 `LegalDocLayout.tsx`(`LegalDocLayout`/`LegalArticle`/`LegalList`/`LegalTable`)를 쓰고 있어, 그 컴포넌트 한 곳만 고치면 두 페이지에 전부 적용된다. 본문 wrapper `lineHeight: 1.8` → `lineHeight: 'var(--lh-reader)'`(1.9), `LegalList`의 `lineHeight: 1.85` → 동일 토큰으로 통일. `.container` 거터는 이미 클래스로 적용돼 있어 손댈 것 없었음. 페이지 파일 자체는 변경 0(전부 공용 컴포넌트에서 처리).
  4. `tsc --noEmit`(frontend) 에러 0. `npm run build` 통과(청크 경고는 기존 것, 이번 변경과 무관).
  5. 실기동(360px·1280 회귀)은 사람이 하는 것 — 미검증.
- **편차**: 없음(스펙이 지시한 "토큰·거터만" 원칙을 그대로 따름 — 세 랜딩형 페이지·`HomePage` 레이아웃 구조는 손대지 않았고, 부록 판정에 따라 `FamilyInvitePage`만 추가로 Phase 4에 포함시켰다).
- **다음 에이전트가 알아야 할 것**: 🔴 **이번 작업 중 심각한 줄바꿈(CRLF) 오염을 발견해 별도로 처리·기록함 — `backlog.md` 신규 항목(⑱) 참고, 사람 확인 필요.** 실기동은 사람 몫으로 미검증. Phase 4 본체(그룹4)는 이걸로 끝 — 다음은 §8.5 순서상 `DomainOverviewPage`·`PickupPage`("다음" 판정, `00-23` 정본과 맞물림) 또는 Opus 판단에 따른 후속.

<!-- Gemini 판정 1줄: 대기 -->

## 2026-09-17 | 00-38 §8.5 부록 마지막 — DomainOverviewPage 실측, 변경 0

- **근거 스펙**: `docs/00_핵심플랫폼/00-38_적응형_모바일_UX_개편_명세서.md` §8.5(줄825, 🔴착수 판정) + §8.5-1(줄837~850, 착수 시 함정 — `HomePage` 규칙과 반대: 모바일 스냅 유지, `.domain-overview-*` 별도 클래스, 휠 핸들러는 `matchMedia('(pointer: coarse)')`로 판정하고 §5.2 L376이 이미 "건드리지 않는다"로 확정) + §4(토큰) + 원칙 3(탈박스화)·원칙 4(크롬 감량).
- **건드린 파일**: 없음(실측 결과 변경 불필요로 판정).
- **결과**:
  1. §8.5-1이 지정한 함정(스냅 유지·클래스 분리·`pointer:coarse` 판정)은 코드 자체(`DomainOverviewPage.tsx:7~15,64~71` 주석)가 이미 명시적으로 "HomePage 규칙과 공유하면 안 된다"고 밝혀두고 있고, 실제로도 그렇게 구현돼 있어 **손대지 않았다**(지시대로).
  2. §4.5(소형 rem 리터럴): `fontSize` 전수 확인 — `'1.05rem'`·`'1.3rem'`뿐, 전부 DoD 기준선(16px) 위. 0건.
  3. §4.1(거터): `.domain-overview-slide`의 모바일(≤900px) 좌우 패딩은 **이미 09-11에 고쳐져 있었다**(`index.css:935~940` 주석 — "하드코딩 1.2rem이 사이트 표준 거터(--gutter-page)보다 8.8px 좁았다"는 사람 실기기 리포트로 `var(--gutter-page)`로 토큰화 완료). 데스크톱 기본값(`padding: 1.5rem 2.2rem`, ≤900px 미디어쿼리 밖)은 모바일 거터 토큰 대상이 아니라 그대로 둠.
  4. 원칙 3(탈박스화): 피처 카드(`:299~352`)가 단일 테두리·단일 그림자 — 박스-in-박스 없음.
  5. 원칙 4(크롬 감량): 인트로 배너(`.domain-overview-intro`)가 이미 ≤900px에서 숨김 처리(`index.css:962~964`, "배지·제목·CTA를 가린다"는 08-27 지적으로 이미 닫힌 항목) — 첫 화면 콘텐츠까지 크롬 단수가 과하지 않음.
  6. `box1Intro`/`box2Intro` 공유 상수 확인(사용자 요청) — `domainSlides.tsx`에서 export된 동일 상수를 `EntryBoxes.tsx`(`subtitle` prop, :281·:326)와 `App.tsx`의 `DomainOverviewPage` 라우트 wiring(`intro` prop, :399·:403)이 **똑같이 import해서 쓴다** — 별도 사본이 없어 두 화면이 어긋날 수 없는 구조. 문제 없음.
  7. `tsc --noEmit`(frontend) 에러 0. `npm run build` 통과.
- **편차**: 없음.
- **다음 에이전트가 알아야 할 것**: 이걸로 **00-38 §8.5 착수 3건(FamilyInvitePage·PrivacyPage·TermsPage·DomainOverviewPage — 실제로는 4개 파일)이 전부 끝났다.** `PickupPage`는 §8.5가 🟡"다음"(도메인 03 `CleanupRequest` 백엔드 선행 필요)으로 이미 확정해 손대지 않음 — 지시대로 보류. `AdminPage`·`BizDashboard`·`PartnerPortalPage`는 ⏸보류 확정. **00-38 전체(§8 표 13개 + §8.5 부록 4개)가 이걸로 마무리** — `context.md`·`00-38` 문서의 남은 진행 상태 갱신은 [Opus] 몫.

<!-- Gemini 판정 1줄: 대기 -->

## 2026-09-17 | 00-38 §11.1 1차 실측 후속 — UX 3건 + 공통 2건 수정 (Opus 360px 실측 기반)

- **근거 스펙**: `docs/00_핵심플랫폼/00-38_적응형_모바일_UX_개편_명세서.md` §11.1 ⓑ(우선 3건)·ⓒ(공통 반복). Opus가 2026-09-17 `eobom.vercel.app`을 360px iframe에 띄워 `getBoundingClientRect` 실측한 결과.
- **건드린 파일**: `eobomDev/frontend/src/index.css`(`.chip-track` 클래스 신설), `eobomDev/frontend/src/pages/CareGuidePage.tsx`, `eobomDev/frontend/src/pages/CounselingPage.tsx`, `eobomDev/frontend/src/components/Footer.tsx`, `eobomDev/frontend/src/components/FooterMobile.tsx`.
- **결과**:
  1. **①가로 스크롤바(실측 15px)** — `.chip-track`(index.css 신설)에 `scrollbar-width:none` + `::-webkit-scrollbar{display:none}` 추가, `CareGuidePage.tsx`·`CounselingPage.tsx`의 칩 트랙에 `className="chip-track"` 적용. **09-16 대응(paddingBottom 0.3→0.85rem)은 증상 대응이었던 게 맞아 되돌림** — `CounselingPage.tsx` paddingBottom을 `0.85rem`→`0.3rem`으로 원복.
  2. **②칩 트랙 갇힘(실측 left=52px·width=241px/360px)** — `.chip-track`에 `margin-left/right: calc(-1 * (var(--gutter-page) + 1.5rem))` + 같은 값의 `padding-left/right`로 부모(.container 28px + 카드 1.5rem)의 이중 패딩을 뚫고 엣지투엣지로 흘림. `≤359px`(`--gutter-page-sm`) 구간도 같은 방식으로 맞춰 DoD #1(가로 오버플로 0)이 그 구간에서 깨지지 않게 함.
  3. **③care-guide 체크박스(실측 20×20px 5개)** — `24×24px`로 확대(`CareGuidePage.tsx` 모바일 체크리스트 행만, 데스크톱 카드형은 범위 밖이라 미변경). 행 자체는 이미 `role="checkbox"`+`minHeight:var(--min-touch-target)`(56px)+`onClick`으로 행 전체가 토글 대상이었다(§9.2 기 구현) — 추가 변경 불필요.
  4. **④CTA 38px→44px, 필터 칩 35~42px→44px** — `CareGuidePage.tsx`의 "내용 보기"·"전문가 상담" 버튼 `height:'38px'`→`'44px'`. `CareGuidePage.tsx`·`CounselingPage.tsx` 필터 칩 버튼에 `minHeight:'44px'` + `display:inline-flex; alignItems:center` 추가.
  5. **⑤푸터 약관·개인정보 링크 29px→44px** — `Footer.tsx`(데스크톱)와 **`FooterMobile.tsx`(모바일 전용 별도 컴포넌트 — 실기기가 실제로 렌더하는 건 이쪽이라 이것도 같이 고쳐야 10개 화면이 닫힌다, 처음엔 놓쳤다가 로컬 검증 중 발견)** 둘 다 `minHeight:'44px'` 추가.
  6. **로컬 검증**(사람이 배포본 360px 재측정을 대신하지 않음 — 그 앞단 sanity check): dev 서버(`localhost:5173`, `getBoundingClientRect`/`getComputedStyle`)에서 `/care-guide`·`/counseling` 500px 폭 확인 —
     `.chip-track`: `offsetHeight-clientHeight=0`(스크롤바 숨김 확인, 기존 15px) · `rect.left=0, width≈485/500px`(엣지투엣지 확인, 기존 left=52·width=241/360) · `scrollbarWidth:'none'` 확인.
     체크박스 `24×24px` 확인. CTA·칩 버튼 `height=44px` 확인. `Footer`·`FooterMobile` 링크 `height=44px` 확인(데스크톱 1280px·모바일 500px 둘 다).
  7. `tsc --noEmit`(frontend) 에러 0. `npm run build` 통과.
- **편차**: DoD #8(데스크톱 회귀 0) 관련 — `CareGuidePage.tsx`의 CTA 버튼(`height 38→44px`)은 `!isMobile` 조건 없이 데스크톱에서도 함께 렌더돼 데스크톱 높이도 6px 커진다. 스펙 §11(DoD #8 표)이 명시한 예외("접근성 수정처럼 모바일과 무관하게 옳은 변경은 허용하되 walkthrough에 미리 적는다")에 해당해 사전 고지로 여기 남긴다 — 픽셀 동결 위반이 아니라 의도된 예외.
- **다음 에이전트가 알아야 할 것**: 🔴 **정식 재측정은 사람 몫** — 배포 후 §11.1과 같은 방식(360px iframe + `getBoundingClientRect`)으로 재측정해 수치를 walkthrough에 적어야 DoD ⓑ①②③·ⓒ가 공식적으로 닫힌다(위 6번은 로컬 dev 서버 sanity check일 뿐, 배포본 재측정을 대신하지 않음). `/facility` 주소 링크 24px 등 ⓒ의 나머지 항목(이번 지시 범위 밖)은 아직 안 건드림.

<!-- Gemini 판정 1줄: 대기 -->

## 2026-09-17 | 00-38 §11.1 후속 — 배포본 실측 확인 완료(Sonnet, 사용자 요청으로 직접 수행)

- **근거 스펙**: §11.1과 같은 방식(`getBoundingClientRect`/`getComputedStyle`), 단 대상은 **배포본**(`eobom.vercel.app`, commit `8a81806`).
- **건드린 파일**: 없음(측정만).
- **방법**: 브라우저 자동화로 `eobom.vercel.app`에 직접 접속, 뷰포트 폭을 최대한 좁혀 측정(이 환경의 창 최소폭 제약으로 **정확히 360px는 못 만들고 500px에서 측정** — 500px도 모바일 브레이크포인트(768px) 안쪽이라 스타일 자체는 360px와 동일. 1280px 데스크톱도 함께 확인).
- **결과 — ①②③④⑤ 전부 배포본에서 확인**:
  1. **①스크롤바** `/counseling`·`/care-guide` `.chip-track` `offsetHeight-clientHeight = 0`(기존 15px). `scrollbarWidth:'none'` 확인.
  2. **②칩 트랙 엣지투엣지** 두 페이지 다 `rect.left = 0, width ≈ 485px`(뷰포트 500px 기준, 기존 left=52·width=241/360). `marginLeft:'-52px'` 확인.
  3. **③체크박스** `/care-guide` `24×24px` 확인(기존 20×20). 행(`role="checkbox"`) 높이 120px(≥56px 기준 통과, 콘텐츠가 여러 줄이라 최소값 이상).
  4. **④CTA·칩 44px** `/care-guide` "내용 보기"·"전문가 상담" 44px 확인. `/care-guide` 칩 8개 전부 44px, `/counseling` 칩 44px 확인.
  5. **⑤Footer 링크 44px** `/counseling`에서 확인(500px 폭에서 자동 확인됨 — 이 폭에서는 데스크톱 `Footer.tsx`가 렌더). `/care-guide`에서 모바일 아코디언(`FooterMobile.tsx`, "약관 · 대표번호 안내 보기") 토글을 실제로 열어 링크 2개 `44px` 확인 — 두 컴포넌트 다 살아있음을 별도로 확인.
  6. **DoD #1(가로 오버플로 0)** 회귀 없음 — `/counseling`·`/care-guide` 500px에서 `scrollWidth(485) ≤ innerWidth(500)`, 1280px 데스크톱에서도 `scrollWidth(1264) = innerWidth(1264)`.
- **편차**: 없음. 정확한 360px 측정이 아니라 500px로 대체한 점만 위 "방법"에 명시.
- **다음 에이전트가 알아야 할 것**: **§11.1 ⓑ①②③·ⓒ 일부(CTA·칩·Footer)가 배포본에서 전부 닫혔다.** 정확한 360px 재측정(및 §11.1이 다룬 나머지 DoD 항목 — #2·#4·#7 등 이번에 손 안 댄 것들)은 여전히 Opus의 다음 1차 실측 갱신이나 사람의 실기기 확인 몫으로 남는다.

<!-- Gemini 판정 1줄: 대기 -->

## 2026-09-18 | [Sonnet] 00-39 그룹① 대표 `/care-guide` 재구현 — 사이드바 폐지·헤더 드롭다운·문서형 레이아웃

- **근거 스펙**: `docs/00_핵심플랫폼/00-39_디자인_기준_재정립_명세서.md` §3~§7·§9(그룹① 대표 = care-guide).
- **건드린 파일**: `eobomDev/frontend/src/pages/CareGuidePage.tsx`(전면 재작성), `eobomDev/frontend/src/styles/design-v2.css`(신규), `eobomDev/frontend/src/lib/legalLink.ts`(신규), `eobomDev/frontend/src/components/Header.tsx`, `eobomDev/frontend/src/components/Sidebar.tsx`, `eobomDev/frontend/src/main.tsx`, `eobomDev/frontend/src/index.css`.
- **결과**:
  1. **인라인 스타일 0개** — `CareGuidePage.tsx`의 기존 `style={{}}` 56개를 전부 `design-v2.css`의 `.v2-*` 클래스로 치환(`grep -c "style=" CareGuidePage.tsx` = 0). `index.css`(기존 토큰과 얽힘)에 넣지 않고 새 파일로 분리, `:root`에 `--v2-*` 토큰(§3 색·§4 글자·§5 레이아웃 값)을 독립 선언.
  2. **레이아웃** — 좌측 기한별 목차 236px(`--v2-toc-width`, 데스크톱 sticky) + 읽기 폭 764px 고정(`--v2-reading-width`), `.container`(120px 패딩·1200px min-width 강제) 미사용으로 우회.
  3. **목록** — `.v2-item-row`: 체크박스+제목+기한만(설명문 제거, §6-1). 체크박스 클릭만 완료 처리, 제목 클릭은 모달 오픈(§6-8·9, 별도 핸들러). CRITICAL은 제목 위 12px 빨간 글자 "되돌릴 수 없음"(색 배지 대신, 규칙5). 기한은 우측 정렬 회색.
  4. **모달** — `.v2-modal`: 제목·기한·근거 세 줄만(규칙10), 해설·조언 문장 없음(규칙11 — 기존 `note`/`irreversibleNote` 표시 로직 삭제, 필드 자체는 JSON에 유지). 모바일은 CSS가 같은 마크업을 바텀시트(`align-items:flex-end`, 하단 닫기 버튼)로 전환.
  5. **법령 링크(§6-14)** — `legalLink.ts`의 `getLegalLink()`가 우선순위 3단을 구현: ①기관 특정 3건(정부24 id7·안심상속 id9·18은 `gov.kr`, e하늘 id4는 실제 URL 미확인이라 라벨만 노출) ②법령 13건은 `https://www.law.go.kr/법령/{법령명}/{제N조}` 생성(`§`→`제N조`, 항 `①②③` 제거) ③근거 없는 6건(id 1·3·17·19·21·22)은 줄 생략.
  6. **구간 이동(§7)** — 웹 좌측 목차·모바일 상단 가로 탭이 같은 `TIME_SECTIONS` 5구간을 공유(`IntersectionObserver`로 `activeSectionKey` 동기화). 기존 데스크톱 아코디언(구간 접기)·모바일 카테고리 칩 필터는 전부 제거 — §1 확정("A 문서형")에 맞춰 상시 펼침 문서 스크롤 구조로 교체.
  7. **헤더 드롭다운(규칙3)** — `Header.tsx`의 "생전 준비"/"임종·사후 정리" 버튼에 `.hdr-mode-panel` 호버(+`:focus-within`) 드롭다운 추가, 항목은 `modeNav.ts`(`MODE_MENUS`) 그대로, `status:'preview'`는 "준비 중" 배지. `Sidebar.tsx`의 데스크톱 `<aside className="sidebar">`(72px 호버 확장 바) 전체 삭제 — 모바일 드로어(햄버거)는 그대로 둠. `index.css`의 `.sidebar`/`.sidebar:hover`/`.main-wrapper` margin-left 로직 삭제.
  8. **🔴 사람 확정 사항(2026-09-18, 세션 중 질문)** — 사이드바 삭제로 비로그인 사용자가 내비게이션 수단을 완전히 잃는 문제를 발견해 확인 요청 → "헤더 드롭다운을 항상 노출(권장)"으로 확정. `Header.tsx`의 `{currentUser && (...)}` 게이트를 제거해 메뉴 자체는 로그인 여부와 무관하게 항상 노출, 개별 항목 클릭 시에만 `loginRequired`면 로그인 모달로 게이트(Sidebar가 쓰던 것과 같은 패턴).
  9. `npx tsc --noEmit`(frontend) 에러 0, `npm run build`(frontend) 통과(청크 크기 경고만, 기존에도 있던 것).
- **편차**:
  - **행 CTA 버튼 삭제** — 기존 목록 행의 "장사시설 찾기 →"·"전문가 상담 →"·"정부24 바로가기" 인라인 버튼(6개 항목)을 전부 뺐다. §6-1이 "한 줄은 제목+기한이 전부"를 웹·모바일 공통으로 못박았고, §6.4 규칙10이 모달을 3줄로 캡핑해 이 CTA들을 모달에도 넣을 자리가 없다. 대신 헤더 드롭다운(`BEREAVED_MENU`)이 facility·counseling·digital-estate를 항상 노출하므로 중복 진입점으로 판단해 제거 — 스펙에 명시된 결정은 아니라 편차로 남긴다.
  - **`--header-h`(85px/58px) 미변경** — §5 표는 76px/50px을 명시하지만, 이 토큰은 홈 풀페이지 스냅 섹션 등 care-guide 밖 전역 레이아웃에도 쓰여 블래스트 반경이 이 작업 범위를 넘는다고 판단해 손대지 않았다. 다음 그룹(⑤ 홈) 작업 시 재검토 필요.
  - **e하늘 장사정보시스템(id4) 링크 없음** — 실제 URL을 실측하지 못해 라벨만 표시(href 없음). §6-14 순위1은 "그 사이트로" 링크를 요구하므로 완전한 스펙 이행은 아니다.
- **다음 에이전트가 알아야 할 것**: 🔴 **실기동 검증 대기** — 브라우저로 열어보지 않았다. 특히 (a) 헤더 드롭다운 호버/포커스 동작, (b) 모바일 바텀시트 모달, (c) IntersectionObserver 기반 목차 활성 상태, (d) 법령 링크 실제 클릭 결과(law.go.kr 조문 단위 정확도)는 사람 확인 필요. e하늘 실제 URL을 확인하면 `legalLink.ts`의 `INSTITUTION_LINKS[4].href`를 채울 것. 00-39 §9.1 표대로면 다음은 같은 그룹①의 나머지 4개(facility·counseling·pickup·my-obituaries, 시안 불필요)에 이번 `.v2-*` 클래스를 그대로 적용하는 것.

<!-- Gemini 판정 1줄: 대기 -->

## 2026-09-18 | [Sonnet] care-guide 후속 — 모바일 배너 제거·구간 탭 전환식·구간 제목 굵기 (사용자 직접 지시)

- **근거 스펙**: 전용 스펙 없음 — 위 항목(00-39 그룹① care-guide 재구현) 직후 사용자 직접 지시 2건.
- **건드린 파일**: `eobomDev/frontend/src/pages/CareGuidePage.tsx`, `eobomDev/frontend/src/styles/design-v2.css`.
- **결과**:
  1. **모바일 상속 배너 제거** — "(모바일 환경 한정) 고인에게 빚~ 내용보기·전문가 상담 버튼까지 전부 삭제" 지시. `design-v2.css`의 `@media (max-width:767px)`에 `.v2-callout { display:none; }` 추가(기존엔 제목+버튼만 남기고 설명문만 숨기던 상태였음 — 이번엔 통째로 숨김). 웹은 그대로 노출.
  2. **모바일 구간 탭 = 스크롤 앵커 → 전환식** — "기한버튼 눌렀을 때 내려가는 게 아니라 각각의 것들이 뜰 수 있도록, 모든 것을 한 페이지에 담지 않는다" 지시. `CareGuidePage.tsx`의 각 `.v2-section`에 `activeSectionKey`와 일치할 때만 `is-active-section` 클래스를 추가하고, `design-v2.css` 모바일 미디어쿼리에 `.v2-section{display:none} .v2-section.is-active-section{display:block}` 추가 — 탭을 누르면 그 구간 하나만 렌더된 것처럼 보이고 나머지는 DOM엔 있지만 안 보인다. 데스크톱은 변경 없음(좌측 목차 스크롤 스파이 그대로).
  3. **구간 제목 굵기** — "장례 기간 (즉시)" 같은 구간 제목이 허전하다는 지적에 3가지 시안(좌측 포인트 컬러바/굵기만 올리기/옅은 배경 밴드)을 제시했고 "굵기만 올리기"로 확정. `.v2-section-title`의 `font-weight`를 600→700(크기·서체는 그대로).
  4. `npx tsc --noEmit`(frontend) 에러 0, `npm run build`(frontend) 통과.
- **편차**: 없음 — 전부 사용자가 명시적으로 지시했거나 제시한 시안 중 직접 고른 것.
- **다음 에이전트가 알아야 할 것**: 🔴 **실기동 검증 대기**(위 항목과 동일 사유, dev 서버 미기동). 모바일 구간 전환은 CSS `display:none/block` 토글이라 애니메이션 없이 즉시 전환된다 — 실기기에서 딱딱하게 느껴지면 트랜지션 추가를 고려할 것(이번엔 지시 범위 밖이라 손대지 않음). `.v2-section`을 나머지 4개 화면(facility 등)에 이식할 때 이 모바일 표시/숨김 규칙도 함께 따라간다는 점 유의.

<!-- Gemini 판정 1줄: 대기 -->

## 2026-09-18 | [Sonnet] care-guide 후속 2 — 모바일 페이지 제목·구간 제목 위계 정리 (사용자 직접 지시)

- **근거 스펙**: 전용 스펙 없음 — 사용자 직접 지시. "모바일 화면에서도 상중행정가이드 제목과 장례기간(분류?제목) 간의 폰트 사이즈 및 굵기 조정 필요", "상중 행정 가이드 제목 굵기 더 높일 필요 있음."
- **건드린 파일**: `eobomDev/frontend/src/styles/design-v2.css`.
- **원인**: 직전 항목에서 구간 제목(`.v2-section-title`) `font-weight`를 600→700으로 올렸는데, 모바일에서 페이지 제목(27px/600)과 구간 제목(24px/700)의 크기 차가 3px뿐이라 더 굵은 구간 제목이 오히려 페이지 제목보다 도드라져 보이는 역전이 생겼다.
- **결과**: `--v2-fs-section-title-mobile: 18px` 신설 후 `@media(max-width:767px)`에 `.v2-section-title { font-size: var(--v2-fs-section-title-mobile) }` 추가(데스크톱은 24px 그대로). `.v2-page-title`의 `font-weight`를 600→700으로 올려(전 breakpoint 공통 규칙) 구간 제목과 굵기를 맞추고, 모바일 기준 27px(제목) vs 18px(구간)로 크기 격차를 벌려 위계를 재확립. `npx tsc --noEmit`(frontend) 에러 0, `npm run build`(frontend) 통과.
- **편차**: 없음 — 사용자가 명시적으로 지시.
- **다음 에이전트가 알아야 할 것**: 🔴 실기동 검증 대기(dev 서버 미기동, 위 항목들과 동일). 데스크톱은 이번 변경의 영향을 받지 않는다(구간 제목 24px는 그대로, 페이지 제목만 700으로 전 breakpoint 공통 상향). 실기기에서 봤을 때도 위계가 충분한지 확인 필요.

<!-- Gemini 판정 1줄: 대기 -->

## 2026-09-18 | [Sonnet] 00-39 그룹① 나머지 3개 — PickupPage·MyObituaryListPage·CounselingPage에 `.v2-*` 클래스 적용

- **근거 스펙**: `docs/00_핵심플랫폼/00-39_디자인_기준_재정립_명세서.md` §9.1("①은 시안 없이 바로 구현할 수 있다 — facility·counseling·pickup·my-obituaries"). 대표(care-guide)에서 뽑은 `styles/design-v2.css`의 `.v2-*` 클래스를 이어 썼다.
- **건드린 파일**: `eobomDev/frontend/src/pages/PickupPage.tsx`, `eobomDev/frontend/src/pages/MyObituaryListPage.tsx`, `eobomDev/frontend/src/pages/CounselingPage.tsx`, `eobomDev/frontend/src/styles/design-v2.css`, `eobomDev/frontend/src/components/Header.tsx`(배지 클래스명 정리).
- **결과**:
  1. **공용 클래스 신설**(`design-v2.css`) — `.v2-content`(좌측 목차 없는 화면도 764px 읽기 폭 고정), `.v2-list-row`/`.v2-list-main`/`.v2-list-title`/`.v2-list-meta`(체크박스 없는 일반 목록 행), `.v2-badge-neutral`(기존 `.hdr-mode-badge`를 이 이름으로 통합 — Header.tsx도 같이 갱신), `.v2-empty`/`.v2-error-text`(빈 상태·에러 문구), `.v2-notice`/`.v2-notice-warn`(안내·경고 배너), `.v2-filter-row`/`.v2-select`(지역 필터 셀렉트), `.v2-chip-row`/`.v2-chip`(가로 스크롤 칩, 모든 화면에서 노출 — 모바일 전용인 `.v2-mobile-tab`과 구분), `.v2-banner`/`.v2-banner-title`/`.v2-banner-cta`(중립색 진입 배너), `.v2-btn-primary`(urgent 대신 point색 CTA), `.v2-modal-actions`(모달 내 버튼 그룹, flex+gap), `.v2-two-col`(2단 목록, 768px 미만 1단), `.v2-desktop-only`/`.v2-mobile-only`(문구 자체가 바뀌는 자리를 JS 분기 없이 CSS로 전환). `.v2-btn-outline`/`.v2-btn-solid`/`.v2-btn-primary` 공통으로 `display:inline-flex` 추가(아이콘+텍스트 정렬).
  2. **PickupPage** — 카드형 업체 그리드(`.card`, 그림자)를 `.v2-list-row` 목록으로 교체, 클릭 시 모달(지역·평점·태그·"무료 방문 견적 신청" CTA). 인라인 56→0(정확히는 기존 전체를 v2 클래스로).
  3. **MyObituaryListPage** — 좌우 2단 카드(부고장/추모관)를 `.v2-two-col` + `.v2-list-row`로 교체. 행 액션(열기·공유·수정·삭제)은 §6-8·9(체크/안내 분리)와 같은 원리로 행 클릭 → 모달 안으로 이동(기존엔 행에 4개 버튼이 늘어서 있었음).
  4. **CounselingPage** — 전문가 카드 그리드를 `.v2-list-row` 목록으로 교체(제목=이름, 우측=분야), `licenseOrg`·`specialties`·`bio`는 모달로. 분야 필터 칩은 `.v2-chip-row`(모든 화면 노출)로, 시뮬레이터 배너는 `.v2-banner`(중립색 리본형)로. `useIsMobile` 훅 제거 — 모바일 축약 제목("전문가 상담")은 `.v2-desktop-only`/`.v2-mobile-only` CSS 토글로 대체.
  5. `npx tsc --noEmit`(frontend) 에러 0, `npm run build`(frontend) 통과(3개 파일 각각 개별 확인 + 최종 통합 확인).
- **편차**:
  - **행 내 상세정보를 전부 모달로 이동** — §6-1(목록은 제목+기한만)을 그대로 이어 쓴 결과, 각 페이지의 부가 정보(평점·태그·자격·소개·상태·일자)가 전부 클릭 후 모달에서만 보인다. 스펙이 이 3개 화면을 위해 별도로 이렇게 정하진 않았고, care-guide 패턴을 문자 그대로 확장한 판단이다.
  - **FacilityPage(968줄) 제외** — 카드/리스트 뷰 전환, 썸네일, 카카오맵·상담 버튼 직접 노출, 모바일 필터 바텀시트 등 09-10에 사람이 여러 차례 직접 지시해 다듬은 기능이 많아, care-guide 패턴으로 그대로 바꾸면 실질적 기능 후퇴가 된다고 판단해 사람에게 범위를 확인 요청 → **"이번엔 보류"**로 확정. 손대지 않았다.
- **다음 에이전트가 알아야 할 것**: 🔴 실기동 검증 대기(dev 서버 미기동). FacilityPage는 다음에 별도로 범위(①색·타이포만 교체 vs ②전면 재구성)를 다시 정하고 진행할 것 — 이번 세션에서 옵션만 제시했고 사람이 보류를 택했다. `.v2-badge-neutral`로 이름을 바꾼 배지 클래스를 쓰는 곳이 늘면(Header.tsx 외) 한 곳(design-v2.css)만 고치면 된다.

<!-- Gemini 판정 1줄: 대기 -->

## 2026-09-18 | [Sonnet] 그룹① 실기동 피드백 반영 — Pickup·MyObituaryList·Counseling 8건 + 목업 2건

- **근거 스펙**: 전용 스펙 없음 — 사람이 위 항목들을 실기동 확인 후 화면별 직접 지시.
- **건드린 파일**: `eobomDev/frontend/src/pages/PickupPage.tsx`, `eobomDev/frontend/src/pages/CounselingPage.tsx`, `eobomDev/frontend/src/pages/MyObituaryListPage.tsx`, `eobomDev/frontend/src/styles/design-v2.css`.
- **결과**:
  1. **공통 CSS 버그 수정** — `.v2-list-title`에 `min-width:0`·`overflow:hidden`·`text-overflow:ellipsis`·`white-space:nowrap` 추가. 원인: `flex:1`인데 축소 제약이 없어 좁은 화면(모바일)에서 제목이 줄바꿈되고 있었다(Pickup 업체명 2줄 문제, 1-4a). 공용 클래스라 세 화면 모두에 적용됨.
  2. **`/pickup`** — ⓐ "예시 데이터로 채워져 있습니다..." 경고 문단(`.v2-notice-warn`) 삭제(1-2, "예시" 배지·CTA "(예시)"·alert는 00-14 §2.2 최소 고지로 유지) ⓑ 위치 고지 문구를 두 문장→한 문장으로 축약(1-4b) ⓒ FacilityPage 수준으로 위치·검색 UX 보강(1-3) — `locationName`/`isLocationFallback` 상태 신설(위치 미확인 시 `GEOLOCATION_FALLBACK` 표시), 지역 선택을 draft/적용 분리(검색 버튼으로 확정, GPS 자동감지는 즉시 적용), 업체명·지역 자유 검색창 추가. 🔴 업체(vendors) 데이터에 좌표가 없어 거리순 정렬은 만들지 않았다(표시·필터만 FacilityPage와 동등, 정렬은 다름 — 편차 참조).
  3. **`/my-obituarylist`** — 목록과 "새 부고장 만들기"/"추모관 만들기·관리" 버튼 사이 `margin-top:16px`(`.v2-list-footer-btn`) 추가(2-1).
  4. **`/counseling`** — ⓐ 시뮬레이터 배너(`.v2-banner`) 안쪽 여백 20px→28px(3-1) ⓑ 전문가 행 전체를 `role="button"`으로 클릭 가능하게(기존엔 이름 부분만 버튼이었음, 3-4) ⓒ 데스크톱만 "이름 / 분야" 한 줄 + 우측에 간단소개(`bio`) 추가, 모바일은 기존 그대로(`.v2-desktop-only`/`.v2-mobile-only` 토글, 3-3).
  5. **디자인 목업 2건 발행**(캔버스, 시안 확정 전) — /pickup 업체 카드 2열 확대안 3종(A 심플 카드 / B 사진 자리 포함 / C 가로 확장형), 상속세 계산기 모달 재구성 2종(A 입력·결과 2단 / B 구간 구분+참고사항 접기). 실제 코드는 아직 안 바꿈 — 사람이 방향을 고르면 그때 구현.
  6. `npx tsc --noEmit`(frontend) 에러 0, `npm run build`(frontend) 통과.
- **편차**:
  - **Pickup 거리순 정렬 없음** — "facility처럼 검색 기능 필요" 지시를 표시(위치명·기본값 배지)·필터(지역 draft/적용)·자유 검색까지는 그대로 따랐지만, FacilityPage의 거리순 정렬(haversine)은 vendors 목업 데이터에 좌표가 없어 구현하지 않았다. 좌표를 추가하지 않는 한 정렬은 못 맞춘다.
  - **3-2(계산기 모달 재구성)·1-1(Pickup 카드 확대)은 코드 미반영** — 사람이 "목업 필요"라고 명시해 실제 페이지는 그대로 두고 캔버스 시안만 냈다.
  - **3-4 괄호 메모("모달 내 지역 정보, 가입시 받아놔야 함")는 구현하지 않음** — 전문가 회원가입 흐름·DB 스키마에 지역 필드를 추가해야 하는 별도 작업이라 이번 범위 밖으로 판단, `context.md`에 다음 할 일로 남긴다.
- **다음 에이전트가 알아야 할 것**: 🔴 실기동 검증 대기. 목업 캔버스(Artifact, 사람 소유)에서 방향을 고르면: Pickup은 A/B/C 중 하나로 `PickupPage.tsx`의 `.v2-list-row` 블록을 카드 그리드로 교체, 계산기는 A/B 중 하나로 `TaxSimulatorModal.tsx`를 재구성(이 컴포넌트는 아직 구 토큰 체계라 v2 클래스로 옮길지도 같이 정할 것). 전문가 프로필에 지역(region) 필드가 없다 — 3-4 요구사항을 실제로 채우려면 회원가입 폼·`PublicExpert` 타입·백엔드 스키마 3곳을 함께 바꿔야 한다.

<!-- Gemini 판정 1줄: 대기 -->

## 2026-09-18 | [Sonnet] Pickup 카드형 시안 A 채택 구현 + Counseling 후속 3건

- **근거 스펙**: 전용 스펙 없음 — 사람이 목업 캔버스에서 "시안 A 선택"(Pickup) + 직접 지시 3건(Counseling).
- **건드린 파일**: `eobomDev/frontend/src/pages/PickupPage.tsx`, `eobomDev/frontend/src/pages/CounselingPage.tsx`, `eobomDev/frontend/src/styles/design-v2.css`.
- **결과**:
  1. **Pickup 시안 A 채택** — 사람이 "save한 기준으로"라고 해 캔버스를 다시 읽어(`Artifact` read → `seed-canvas.mjs --extract`) `Main.dc.html`(시안 A)의 저장된 상태를 확인한 결과, 원래 목업에 있던 "예시" 배지·★평점·태그 칩을 카드 면에서 직접 지워두고 CTA 버튼 문구도 "무료 방문 견적 신청"→"견적 신청"으로 줄여 놓았다(사람이 편집기에서 저장). 이 저장된 형태를 그대로 실제 코드에 옮겼다: `.v2-list-row` 목록 → `.v2-card-grid`(2열, 모바일 1열) + `.v2-card`(테두리만, 그림자 없음). 카드 면 = 제목·지역(📍만, 평점 없음)·CTA뿐. 제목 클릭 시 기존 모달(지역·평점·태그·정식 CTA)이 그대로 열린다 — 평점·태그·"예시" 배지는 모달로 이동, 카드의 "견적 신청" 버튼은 모달을 거치지 않고 바로 같은 alert를 띄우는 지름길.
  2. **Counseling 후속 3건**(직접 지시) — ⓐ `.v2-banner`(계산기 진입 배너) 내부 간격을 28px→44px(패딩)·16px→28px(요소 간 gap)로 대폭 확대 ⓑ 전문가 행의 "이름 / 분야" 표기에서 "/" 구분자 삭제(공백만 유지) ⓒ "상속 변호사" 같은 분야 텍스트(`.v2-list-inline-meta`) 폰트 크기를 이름과 같던 19px→15px(`--v2-fs-support`)로 축소.
  3. `npx tsc --noEmit`(frontend) 에러 0, `npm run build`(frontend) 통과.
- **편차**: 없음 — Pickup은 사람이 캔버스에서 직접 편집·저장한 상태를 그대로 코드화했고, Counseling 3건은 문구 그대로 구현.
- **다음 에이전트가 알아야 할 것**: 🔴 실기동 검증 대기. **my-obituarylist는 사람이 "통과"로 확정 — 추가 변경 없음.** 상속세 계산기 모달(TaxA/TaxB) 재구성은 아직 미결 — 다음에 방향을 고르면 `TaxSimulatorModal.tsx`에 반영. 캔버스를 다시 읽을 땐 `Artifact` action:"read"(파일 미지정) → 결과가 가리키는 로컬 파일을 `seed-canvas.mjs --extract --to <새 빈 폴더>`로 풀어야 사람이 편집기에서 직접 고친 내용까지 반영된다(처음 발행한 내 작업 파일을 그대로 믿으면 사람이 캔버스에서 지운 요소가 남아있는 채로 구현하게 된다 — 이번에 실제로 그랬다).

<!-- Gemini 판정 1줄: 대기 -->

## 2026-09-18 | [Sonnet] 상속세 계산기 모달 A형(입력·결과 2단) 재구성 — `00-39` §8 #7

- **근거 스펙**: `docs/00_핵심플랫폼/00-39_디자인_기준_재정립_명세서.md` §8 #7("A형 채택")·§6.8(폼·입력 확정값 — 높이 44/48px·글자 16px·라벨/보조문구 13px·항목 간 16px).
- **건드린 파일**: `eobomDev/frontend/src/components/counseling/TaxSimulatorModal.tsx`, `eobomDev/frontend/src/styles/design-v2.css`, `eobomDev/frontend/src/index.css`, `docs/00_핵심플랫폼/00-39_디자인_기준_재정립_명세서.md`(§6.7 표 등재 — 사용자가 이번 채팅에서 직접 지시).
- **결과**:
  1. `design-v2.css`에 `.v2-field`(라벨+입력+보조문구를 세로로 묶는 flex column, gap 6px) · `.v2-field label`(13px, `--v2-fs-label`) · `.v2-field-hint`(13px, `--v2-text-muted`) 신설. `.v2-select`/`.v2-input`은 기존 필터 행 용도와 상자 스타일(높이·패딩·글자)을 공유하도록 남기되, 값 자체를 §6.8 확정값(패딩 `0 12px`→`0 14px`, 글자 `--v2-fs-support`(15px)→`16px`)으로 갱신하고 767px 이하 `height:48px` 미디어쿼리를 추가했다. `flex-basis`(행 안 배치 비율)는 `.v2-filter-row .v2-select`/`.v2-filter-row .v2-input`으로 스코프를 좁혀, `.v2-field`(세로 flex) 안에서 가로축 flex-basis가 세로 높이를 침범하지 않게 했다.
  2. `TaxSimulatorModal.tsx` — 옛 `.form-group`/`.form-label`/`.form-input`(index.css:619, 52px) 8곳 전부를 `.v2-field`+`<label>`+`.v2-input`+`.v2-field-hint`로 교체. 폼 전체를 `.v2-two-col`(768px 미만 1단)로 감싸 왼쪽=입력 폼(계산 버튼 포함), 오른쪽=결과(계산 전에는 `.v2-empty` 안내 문구)로 분리 — A형("입력·결과 2단").
  3. `index.css` `.tax-sim-modal-panel` `max-width` 560px→680px — 2단이 나란히 놓일 폭 확보(스펙에 수치 지정 없음, 이번 구현 판단).
  4. `docs/00-39` §6.7 표에 `.v2-field`/`.v2-input`/`.v2-field-hint` 행 추가(사용자 지시).
  5. `npx tsc --noEmit`(frontend) 에러 0, `npm run build`(frontend) 통과.
- **편차**:
  - `.tax-sim-modal-panel` 폭을 680px로 늘린 것 — §8 #7은 A형 채택과 입력 칸 축소만 확정했고 모달 폭은 스펙에 없다. 2단이 560px 안에서는 각 칸이 좁아져 폭을 넓혔다.
  - `.v2-input`/`.v2-select`(필터 행용, `PickupPage.tsx`)의 글자 16px·패딩 14px·모바일 높이 48px 변경 — §6.8이 이 클래스명을 그대로 재사용하라고 지시했고 파일 상단 주석("정본은 design-v2.css")도 이를 뒷받침해 공유 정의를 새 확정값으로 갱신했다. `PickupPage.tsx` 코드는 건드리지 않았지만 시각적으로 검색창 글자가 15px→16px로 커진다(부작용, 실기동에서 확인 필요).
- **다음 에이전트가 알아야 할 것**: 🔴 실기동 검증 대기(dev 서버 미기동, 모바일 767px 이하 1단 전환·바텀시트 배치 실기기 확인 필요). `00-39` §9.2가 예고한 대로 그룹②(폼) 첫 시안 `obituary`가 `.v2-field`/`.v2-input`/`.v2-field-hint`를 그대로 물려받을 차례다.

<!-- Gemini 판정 1줄: 대기 -->

## 2026-09-18 | [Sonnet] 계산기 모달 A형 실기동 버그 수정 — 입력 칸이 커져 결과가 찌그러짐

- **근거 스펙**: 스펙 없음 — 사용자가 위 항목을 실기동 확인 후 직접 신고("조건 입력 부분이 너무 커서 예상 결과가 찌그러져나옴").
- **건드린 파일**: `eobomDev/frontend/src/styles/design-v2.css`, `eobomDev/frontend/src/components/counseling/TaxSimulatorModal.tsx`.
- **결과**:
  1. **원인**: `.v2-two-col`이 `grid-template-columns: 1fr 1fr`였는데, 그리드 아이템의 기본 `min-width`는 `auto`(내용의 min-content)라 입력 칸(끊기지 않는 내용)이 지분 1fr보다 커지면 그리드가 그쪽에 더 내주고 결과 칸을 그만큼 줄인다 — 전형적인 CSS 그리드 `1fr` 함정.
  2. `design-v2.css:592` `.v2-two-col`의 `grid-template-columns`를 `1fr 1fr` → `minmax(0, 1fr) minmax(0, 1fr)`로 수정 — 두 칸의 최소폭을 0으로 고정해 실제로 반반이 되게 함. `.v2-two-col`을 같이 쓰는 `MyObituaryListPage.tsx`(사람 "통과" 확정 화면)도 영향권이나, 비율은 그대로 1:1이라 시각적 퇴행은 없다.
  3. `TaxSimulatorModal.tsx`의 `Row` 컴포넌트 — 좁아진 결과 칸에서 긴 라벨(예: "신고세액공제 (3%, 기한 내 신고 가정)")과 값이 한 줄 안에서 서로 밀어내며 찌그러지던 것을, 라벨은 `minWidth:0`으로 줄바꿈 허용·값은 `flexShrink:0`+`whiteSpace:'nowrap'`으로 고정해 라벨만 여러 줄로 접히고 값은 항상 온전한 한 줄로 보이게 함.
  4. `npx tsc --noEmit`(frontend) 에러 0, `npm run build`(frontend) 통과.
- **편차**: 없음 — 신고된 증상 재현·원인 규명 후 그 원인만 고쳤다.
- **다음 에이전트가 알아야 할 것**: 🔴 실기동 재확인 대기 — 이번엔 dev 서버 없이 코드 레벨로만 원인을 고쳤으니, 사람이 실제 화면에서 결과 칸이 더 이상 찌그러지지 않는지 확인 필요.

<!-- Gemini 판정 1줄: 대기 -->

## 2026-09-18 | [Sonnet] 계산기 모달 입력 칸 세로 길이 축소 — 결과 칸과 높이 맞춤

- **근거 스펙**: 스펙 없음 — 사용자 실기동 직접 지시("산출결과 말고 입력하는곳의 높이가 전체적으로 줄었으면 해. 그래야 산출결과랑 높이가 맞을듯").
- **건드린 파일**: `eobomDev/frontend/src/components/counseling/TaxSimulatorModal.tsx`.
- **결과**:
  1. "채무 및 장례비용"과 "그중 순수 금융재산가액" 두 필드를 각자 전체 폭 한 줄(`.v2-field` 2개, 세로로 88px씩 총 176px+간격16px)로 두던 것을, "자녀 수 / 65세 이상 상속인 수"와 같은 패턴으로 한 줄에 나란히(`flex:1` 2개) 배치 — 필드 수 6→5, 세로 한 줄(약 88px)+간격(16px) 절감.
  2. 같은 줄에 들어가며 폭이 절반(약 296px→142px)으로 줄어든 두 보조문구(`.v2-field-hint`)를 줄바꿈 없이 들어가도록 축약: "고인의 채무, 장례비 등 (과세가액에서 차감)" → "과세가액에서 차감", "총 상속재산 중 예금·보험·주식 등 (부동산 제외, 금융재산공제 계산용)" → "부동산 제외". 계산 로직·§6.8 확정값(높이 44/48px·글자 16px·라벨/보조문구 13px·항목 간 16px)은 손대지 않았다 — 줄인 것은 **행 수**뿐이다.
  3. `npx tsc --noEmit`(frontend) 에러 0, `npm run build`(frontend) 통과.
- **편차**: 보조문구 문구 축약 — §6.8이 확정한 것은 폰트 크기(13px)뿐이고 문구 자체는 스펙에 없어 이번 요청(높이 축소)에 맞춰 축약했다. 원래 문구가 담던 사실(과세가액 차감·부동산 제외)은 그대로 유지, 길이만 줄임.
- **다음 에이전트가 알아야 할 것**: 🔴 실기동 재확인 대기. 대략 계산으로는 여전히 입력 칸이 결과 칸보다 다소 길 수 있다(라디오·조건부 배우자 상속액 필드 등 나머지 4개 줄은 그대로) — 사람이 실제 화면에서 보고 "아직 더 줄여야" 하면 다음 후보는 "배우자 유무"(46px, 라디오뿐)를 다른 짧은 필드와 한 줄로 묶는 것.

<!-- Gemini 판정 1줄: 대기 -->

## 2026-09-18 | [Sonnet] 계산기 모달 실기동 — 입력 칸이 결과 칸을 침범하는 진짜 원인 발견·수정

- **근거 스펙**: 스펙 없음 — 사용자가 "제발 줄글 줄바꿈좀 안되게해줘" + "실제 화면을 너가 열어서 보고 정렬이나 줄바꿈같은 디테일 놓치지마"라고 직접 지시. dev 서버를 띄우고 `claude-in-chrome`으로 실제 화면을 열어 재현·진단·수정까지 했다(이례적 — 평소엔 dev 서버를 안 띄우는데, 이번엔 사람이 명시적으로 "네가 직접 열어봐라"고 지시).
- **건드린 파일**: `eobomDev/frontend/src/styles/design-v2.css`.
- **결과**:
  1. **진짜 원인**: 앞서 두 차례(wt 없음, 이번 세션 앞 2건) 고친 것과 별개로 남아있던 문제. `<input>`은 내용이 비어 있어도 브라우저가 주는 자체 min-content 폭(number 타입은 스피너 포함 약 220px)이 있고, flex/grid 부모가 칸을 줄여도 이 값이 이겨서 좁은 칸(2단 배치한 "채무 및 장례비용"/"그중 순수 금융재산")에서 입력 상자가 제 칸(약 136px)을 뚫고 옆으로 넘쳤다. 실측(DevTools `getBoundingClientRect`): 입력 실제 폭 225px, 두 번째 칸이 x=885~1110까지 뻗어 결과 칸 영역(x=972.5~)까지 침범 — 화면에서 "찌그러짐/겹침"으로 보인 실체.
  2. `.v2-input`/`.v2-select`에 `width:100%; min-width:0` 추가, `.v2-field`에 `min-width:0` 추가 — 입력 칸이 부모가 준 폭을 그대로 따르게 고정(더 이상 자기 마음대로 폭을 넓히지 않음).
  3. 실기동 검증(dev 서버 `localhost:5174`, `claude-in-chrome`로 직접 열어봄): `/counseling` → 계산기 모달 → 기본값·전부 0·총자산 150억 세 가지 입력으로 계산 실행. 세 경우 다 입력 칸과 결과 칸이 겹치지 않고, 긴 라벨(`신고세액공제 (3%, 기한 내 신고 가정)` 등)은 2줄로 자연스럽게 접히되 숫자 값은 항상 한 줄(`Row` 컴포넌트의 `whiteSpace:'nowrap'`, 앞선 항목에서 이미 적용)로 유지됨을 스크린샷으로 확인. 좌우 칸 높이도 육안으로 거의 비슷하게 맞음.
  4. `npx tsc --noEmit`(frontend) 에러 0, `npm run build`(frontend) 통과.
  5. 확인 후 이번 세션에서 띄운 dev 서버(포트 5174)는 종료. 사람이 원래 띄워두고 쓰던 5173 인스턴스는 건드리지 않음.
- **편차**: 없음 — 신고된 증상을 실제 화면에서 재현하고 진단해 원인만 고쳤다.
- **다음 에이전트가 알아야 할 것**: `.v2-input`/`.v2-select`에 `width:100%`가 생겨서, `.v2-filter-row`(PickupPage) 등 flex 행 안에서 쓰는 다른 자리에서도 동일 클래스를 쓴다 — 그쪽은 `flex-basis`가 메인축(가로)을 결정해 `width:100%`가 실질적 영향은 없지만, 새로 이 클래스를 쓰는 자리가 생기면 이 상호작용을 염두에 둘 것. 실기동 재검증은 이번에 직접 했으니 완료 — 이 항목은 재확인 대기가 아니다.

<!-- Gemini 판정 1줄: 대기 -->

## 2026-09-18 | [Sonnet] 계산기 모달 결과 칸 라벨 줄바꿈 — 3차 지적 후 실기동으로 직접 잡음

- **근거 스펙**: 스펙 없음 — 사용자 3차 직접 지시("산출 결과의 내용중 줄바꿈되는 부분 있으니 점검!! 폰트를 줄이던 입력 되는 부분의 폭을 줄이던 해서 처리해" + 후속 "데탑 환경에서 모달 자체를 넓히던가"). dev 서버(`localhost:5174`)를 다시 띄우고 `claude-in-chrome`으로 직접 열어 재현·수정·검증까지 했다.
- **건드린 파일**: `eobomDev/frontend/src/components/counseling/TaxSimulatorModal.tsx`, `eobomDev/frontend/src/styles/design-v2.css`, `eobomDev/frontend/src/index.css`.
- **결과**:
  1. **재현**: 결과 칸(288.5px 폭)에서 `Row`는 라벨+값이 한 줄(`justifyContent:space-between`)을 나눠 쓰는데, 값(예: "- 50,000 만원")이 고정폭을 먼저 차지해 라벨이 실제로 쓸 수 있는 폭은 그보다 훨씬 좁았다. "기초공제/일괄공제(큰 금액)"·"신고세액공제 (3%, 기한 내 신고 가정)" 같은 긴 라벨이 그 좁은 폭에서 2줄로 접혀 지저분해 보였다(줌 스크린샷으로 확인).
  2. 세 가지를 동시에 적용(사용자가 준 선택지 "폰트 줄이기/입력 폭 줄이기" + 직접 제안한 "모달 자체를 넓히기"를 다 반영): ① `index.css` `.tax-sim-modal-panel` `max-width` 680px→800px(데스크톱만, 모바일은 100%라 무관) ② `design-v2.css`에 `@media (min-width:768px) { .tax-sim-two-col { grid-template-columns: minmax(0,0.85fr) minmax(0,1.15fr); } }` 신설 — 입력:결과 비율을 결과 쪽으로 기울임(모바일 1단 규칙과 충돌 안 하게 `min-width` 미디어쿼리 안에 가둠) ③ `TaxSimulatorModal.tsx` 결과 `Row` 목록의 `fontSize`를 `var(--fs-body)`(16px)→`14px`로, 가장 긴 라벨 3개를 축약: "기초공제/일괄공제(큰 금액)"→"기초·일괄공제(큰 금액)", "배우자공제 (법정상속분 추정)"→"배우자공제(추정)", "적용 최고세율 구간"→"최고세율 구간", "신고세액공제 (3%, 기한 내 신고 가정)"→"신고세액공제(3%)".
  3. **실기동 검증**: 기본값·큰 금액(총자산 150억) 두 케이스 모두 스크린샷+줌으로 라벨·값 전부 한 줄에 들어가는 것 확인. `상속세, 대략 얼마나 나올까요?` 배너부터 모달 열기 → 계산 → 결과까지 실제 클릭으로 재현.
  4. `npx tsc --noEmit`(frontend) 에러 0, `npm run build`(frontend) 통과.
  5. 확인 후 이번 세션 dev 서버(포트 5174) 종료. 사람이 쓰던 5173 인스턴스는 안 건드림.
- **편차**: 라벨 문구 축약 3건 — §6.8이 정한 것은 폰트 크기뿐이라 스펙 위반은 아니지만, 법적 고지성 문구(예: "법정상속분 추정")를 줄인 것이라 명시. 원래 담던 사실은 "계산 기준 및 참고사항" 하단 블록에 그대로 남아 있어 정보 손실은 없다.
- **다음 에이전트가 알아야 할 것**: 없음 — 이번엔 재현부터 수정·검증까지 실기동으로 직접 끝냈다. 사용자가 이 항목에서만 세 차례 재지적했던 만큼, 다음에 이 모달을 또 건드릴 땐 반드시 dev 서버로 직접 열어보고 결과 칸 줄바꿈부터 확인할 것.

<!-- Gemini 판정 1줄: 대기 -->

## 2026-09-18 | [Sonnet] 계산기 모달 좌/우 박스 높이 불일치 — 실측 대신 구조적으로 고정, 향후 방침 변경

- **근거 스펙**: 스펙 없음 — 사용자 4차 직접 지시("좌/우 박스가 각각 있는데 현재 높이 안맞음"). 같은 지시에서 사용자가 **앞으로의 작업 방식 자체를 바꿈**: "이번이 마지막이고, 앞으로는 실측은 하지 않고, 무조건 Design에 연결해서 그걸로 한다. 무조건이야. 꼭." — 이번 건은 실측(dev 서버+스크린샷) 없이 CSS만으로 구조적으로 고쳤다.
- **건드린 파일**: `eobomDev/frontend/src/styles/design-v2.css`, `eobomDev/frontend/src/components/counseling/TaxSimulatorModal.tsx`. (개인 메모리 `feedback_design_tool_over_live_testing.md` 신설·`feedback_dev_server_policy.md` 갱신은 이 저장소 밖이라 diff에 안 잡힘 — 참고용으로만 기록.)
- **결과**:
  1. **왜 이전 수정들이 근본 해결이 아니었나**: 지금까지 폰트·폭·라벨 축약으로 "대략 맞춰본" 것이라, 입력값이 바뀌어 내용 줄 수가 달라지면 다시 안 맞을 수 있는 미봉책이었다. 이번엔 내용량과 무관하게 항상 맞도록 그리드 정렬 자체를 고쳤다.
  2. `design-v2.css`의 `@media (min-width:768px) { .tax-sim-two-col { ... } }`에 `align-items: stretch` 추가 — 그리드 행 높이가 더 큰 쪽(보통 입력 칸) 기준으로 정해지고, 짧은 쪽이 그 높이까지 늘어난다(그리드 표준 동작, `.v2-two-col` 기본값 `align-items:start`를 이 모달에서만 덮어씀).
  3. `.tax-sim-result-box`(`height:100%; box-sizing:border-box;`) 신설, `TaxSimulatorModal.tsx`의 결과 색상 박스(배경색·둥근모서리·좌측 강조선 `div`)에 이 클래스 적용 — 부모(그리드가 늘려준 칸)의 늘어난 높이를 실제로 채운다. 빈 상태(`.v2-empty` 문구)는 배경 박스가 없어 손대지 않음.
  4. `npx tsc --noEmit`(frontend) 에러 0, `npm run build`(frontend) 통과. **이번엔 dev 서버를 띄우지 않았다** — 사용자가 방금 금지한 실측 없이, CSS 그리드의 `align-items:stretch` 표준 동작으로 결과를 보장한다(내용이 늘거나 줄어도 두 칸 높이가 같다는 것이 측정이 아니라 구조로 보장됨).
  5. **개인 메모리에 방침 변경 저장**: 앞으로 레이아웃/디자인 작업은 dev 서버 실측이 아니라 `design` 스킬(캔버스)을 정본으로 삼는다.
  6. 후속 지시("그에 맞게 산출 결과 내의 폰트 크기나 줄간격 등을 알아서 조절해야지") — 박스가 늘어난 만큼 내용이 위쪽에 몰리고 아래가 비는 문제를, 정확한 여백 픽셀을 추측하는 대신 `.tax-sim-result-box`를 `display:flex; flexDirection:'column'; justifyContent:'space-between'`으로 바꿔 해결. 위쪽(제목+세부 내역)과 아래쪽("최종 예상 상속세액")을 두 그룹으로 나눠, 늘어난 높이가 얼마든 그 사이 여백이 자동으로 채운다 — "최종 세액"이 박스 맨 아래 고정되는 효과. 세부 내역 줄 간격도 0.3rem→0.5rem으로 넓혀 14px 축소 폰트에 맞춰 숨통을 줌. `npx tsc --noEmit`·`npm run build`(frontend) 통과, 이번에도 dev 서버 미기동.
- **편차**: 없음.
- **다음 에이전트가 알아야 할 것**: 🔴 **중요 — 이 프로젝트에서 UI 레이아웃 작업은 이제 dev 서버 실측이 아니라 `design` 스킬(Claude Design 캔버스)을 먼저 쓰고 그걸 정본으로 구현한다.** `.harness/` 문서(`AGENTS.md` 등)에는 아직 이 규칙이 정식 반영 안 됨 — 개인 메모리에만 있으니 `[Claude:Opus]`가 다음에 정식 문서화할지 검토할 것. 이번 수정은 실기동 확인을 안 했으니(방침상) 사람이 눈으로 한 번 봐 주는 게 안전하다 — 단 "봐달라"는 요청이지 "네가 실측해서 고쳐달라"는 요청이 아니다.

<!-- Gemini 판정 1줄: 대기 -->

## 2026-09-21 | [Sonnet] 헤더 모드 드롭다운 — 클릭 후 고정 제거·버튼 클릭 시 첫 항목으로 이동 (사용자 직접 지시)

- **근거 스펙**: `docs/00_핵심플랫폼/00-39_디자인_기준_재정립_명세서.md` §6-3(헤더 드롭다운) · 사용자 직접 지시("호버했다가 다른 쪽으로 움직이면 잘 닫히나, 클릭하면 고정되는 현상 제거. 메뉴 자체 클릭 시 첫 번째 페이지로")
- **건드린 파일**: `eobomDev/frontend/src/styles/design-v2.css`, `eobomDev/frontend/src/components/Header.tsx`
- **결과**:
  1. `design-v2.css`: `.hdr-mode:focus-within .hdr-mode-panel` → `.hdr-mode:has(:focus-visible) .hdr-mode-panel`. 마우스 클릭으로 생긴 포커스로는 패널이 열려 있지 않고, 키보드 Tab 이동일 때만 유지(접근성 보존).
  2. `Header.tsx`: `goToEndingNote`·`goToCareGuide` 삭제 → `goToModeFirst(mode) = goToModeItem(mode, MODE_MENUS[mode][0])` 신설, 두 트리거 `onClick`을 `() => goToModeFirst('prep')` / `() => goToModeFirst('bereaved')`로 교체. 이동 대상은 이전과 같은 `ending-note` / `care-guide`(`modeNav.ts` 첫 항목).
  3. `npx tsc --noEmit -p .`(frontend) 에러 0. 사람이 실기동 확인 후 커밋(`c2e9899`).
- **편차**: 없음. 부작용 1건 — 트리거 클릭에도 첫 항목의 `loginRequired` 게이트가 적용된다(비로그인이 "생전 준비"를 누르면 로그인 모달. "임종·사후 정리"는 `care-guide`가 게이트 없음이라 그대로 이동).
- **다음 에이전트가 알아야 할 것**: 메뉴 항목을 클릭한 직후 마우스가 패널 위에 있으면 패널은 마우스가 벗어날 때까지 남는다(즉시 닫으려면 React 상태가 필요해 넣지 않음).

<!-- Gemini 판정 1줄: 대기 -->

## 2026-09-21 | [Sonnet] 00-39 그룹② 대표 `obituary` 재구현 — 입력|미리보기 2단(sticky)·필드별 오류·체크 행·폼 모달

- **근거 스펙**: `docs/00_핵심플랫폼/00-39_디자인_기준_재정립_명세서.md` §6.8(폼·입력)·§9.1(그룹② 대표=`obituary`) · 시안 = Design 캔버스 `https://claude.ai/artifact/QnsvwHQ2VcdTQncwJdoS7F`(W1·W2·M1·M2·W3·M3) · 사용자 직접 지시 다수(아래 결과 ⑤)
- **건드린 파일**: `eobomDev/frontend/src/pages/ObituaryPage.tsx`, `eobomDev/frontend/src/components/ObituaryView.tsx`, `eobomDev/frontend/src/styles/design-v2.css`
- **결과**:
  1. `ObituaryPage.tsx` 폼: `formCard`를 파일 상단에 신설한 `FormField`·`FormSection` + `.v2-form*` 클래스로 재작성. 브라우저 기본 검증(`required`) 대신 `<form noValidate>` + `fieldErrors` 상태 + `FIELD_ERROR_ORDER`로 칸별 오류(붉은 테두리 + 칸 아래 문장)·제출 실패 시 첫 오류 칸 포커스. 옛 `requiredMissing` 삭제. 필수는 라벨 옆 붉은 "필수"(`.v2-req`), 선택은 `.v2-opt`. 토글·동의는 `.v2-check` 44px 행. 접힘 "선택 정보"는 `.v2-more`.
  2. 레이아웃: 페이지 껍데기 `.container` → `.v2-page` / `.v2-page-head`(제목 `.v2-page-title`). 개설 전 화면 `.auto-grid` → `.v2-form-shell.is-2col`(입력 560px | 미리보기 열 `.v2-form-aside`, `position: sticky; top: 24px` — 스크롤 컨테이너가 `.main-wrapper`라 헤더 높이를 더하지 않음). ≤767px는 옆 열이 숨고 폼 안 `.v2-form-preview-inline`(확인 사항 앞)에 나온다.
  3. 수정 모달: 인라인 스타일 오버레이 → `.v2-modal-overlay` + `.v2-modal.is-form`(X 버튼 제거, [취소][수정 사항 저장], 저장 중 `저장 중…` 비활성). 모바일은 기존 규칙대로 바텀시트.
  4. 미리보기 카드: `previewCard`를 `.v2-kakao-stage`/`.v2-kakao-card`(+`kakaoCard` 변수)로 클래스화. 관리 모드 라벨 "카카오톡 카드 미리보기"를 stage 안쪽 맨 위로 옮겨 오른쪽 공유 패널과 위쪽 맞춤. 제목 폴백 정정 — `formatObituaryCardTitle`이 이름이 비어도 `[부고] 故  님`을 돌려줘 `cardTitle || '[부고] 故 ○○○ 님'`이 죽은 코드였다 → `deceasedName.trim() ? cardTitle : '[부고] 故 ○○○ 님'`. 개설 전 미리보기 제목 밑 회색 안내 문단은 두지 않음.
  5. 사용자 직접 지시 반영: 카톡 버튼 `btn btn-point` → 인라인 `#FEE500`/글자 `#191919`; "추모관 만들기" 2곳에 `width: '100%'`; 공유 패널 순서를 `조문객 화면 미리보기` → `링크 복사`로 교체(복사 문구 `copyFeedback`은 링크 복사 줄 아래); 링크 주소 문자열 박스(`{obituaryUrl}` 표시 div) 삭제; `Heart` import 삭제.
  6. `ObituaryView.tsx`: `Row`의 줄 높이 불일치 수정 — 라벨 칸에 `lineHeight` 없음·링크가 `inline-flex`+12px 아이콘이라 그 줄만 커짐 → `ROW_LINE_HEIGHT = 1.5`·`rowLinkStyle` 신설, 값 칸을 flex(가운데 정렬·`columnGap 0.6rem`·줄바꿈), `padding 0.6rem → 0.75rem`. 첫 그룹(빈소·입관·발인·장지) `marginBottom: '1.2rem'` 삭제. 문구 삭제 1건: `최종 수정: {…} · 정보는 유족이 언제든 바꿀 수 있습니다.` → `최종 수정: {…}`(→ 스펙 범위 안, Opus 확인).
  7. `design-v2.css`: `.v2-form-shell`·`.v2-form-aside`·`.v2-form`·`.v2-form-section`·`.v2-form-row`·`.v2-req`·`.v2-opt`·`.v2-check`·`.v2-more*`·`.v2-form-submit`·`.v2-kakao-*`·`.v2-modal.is-form`·`.v2-icon-btn` 등 약 390줄 추가(폼 안 조정은 `.v2-form` 하위로 한정해 계산기·필터의 `.v2-input`은 영향 없음).
  8. `npx tsc --noEmit -p .`(frontend) 에러 0, `npm run build`(frontend) 통과. 🔴 dev 서버 미기동(방침) — 사람이 실기동 확인 후 커밋(`1abc82f`).
- **편차**:
  - `00-39` §5(읽기 폭 764px)의 예외 — 입력|미리보기 2단이 1048px(560+48+440). 사용자 지시("입력/미리보기 양쪽 구성이 핵심")이며 Opus가 §5-1로 등재.
  - §6.8 표와 다른 값 2건을 시안 확인 요청으로 제시하고 사람이 이의 없이 진행: 라벨색 `#5C6773`(표는 `#A29B90`, 대비 약 2.6:1이라 입력 라벨로 읽기 어려움)·입력 테두리 `#B9B3AA`(`.v2-input` 기본은 `#D8D2C8`, 폼 안에서만 덮어씀).
  - 🔴 조문객 미리보기 모달 고지 두 번째 줄 `수정하면 이 화면은 바로 바뀌지만, 이미 보낸 카카오톡 카드는 바뀌지 않습니다.`를 **사용자 지시로 삭제**했으나 이는 `07-03` §6.4 ⓓ(§5.4-2 책임 경계) 위반이었다 → 다음 항목에서 복구.
- **다음 에이전트가 알아야 할 것**: `ObituaryManageSkeleton`(로딩 스켈레톤)은 옛 카드 모양 그대로라 새 폼과 조금 다르다(미조정). `ObituaryPage.tsx`가 작업 중 CRLF로 바뀌어 있어 커밋본(LF) 기준으로 LF 정규화했다(`git ls-files --eol` → `i/lf w/lf`). Design 캔버스에는 "카드 미리보기" 제목 밑 회색 설명 삭제분이 반영 안 돼 있다(구현이 정본).

<!-- Gemini 판정 1줄: 대기 -->

## 2026-09-21 | [Sonnet] 07-03 §6.4 ⓓ 고지 복구 — 조문객 화면 미리보기 모달 상단 두 번째 줄

- **근거 스펙**: `docs/07_상중_행정_케어/07-03_모바일_부고장_카카오톡_전송_구현_기획서.md` §6.4 ⓓ(2026-09-21 확인 절) + §5.4-2(책임 경계) · Opus 핸드오프("두 번째 줄 복구, `ObituaryView` 문구 삭제는 스펙 범위 안이라 그대로")
- **건드린 파일**: `eobomDev/frontend/src/pages/ObituaryPage.tsx`
- **결과**:
  1. 미리보기 모달 상단 고지 `<p>`: `조문객에게 보이는 화면입니다.` → `조문객에게 보이는 화면입니다.<br />` + `수정하면 이 화면은 바로 바뀌지만, 이미 보낸 카카오톡 카드는 바뀌지 않습니다.`(§6.4 ⓓ 코드블록과 글자 그대로 일치).
  2. `ObituaryView.tsx`의 `· 정보는 유족이 언제든 바꿀 수 있습니다.` 삭제는 그대로 둠(지시).
  3. `npx tsc --noEmit -p .`(frontend) 에러 0.
  4. 이 수정은 별도 커밋이 아니라 Opus의 문서 커밋 `2f76263`에 함께 들어갔다(작업 트리 변경이 그 커밋에 묶임) — `git show HEAD:eobomDev/frontend/src/pages/ObituaryPage.tsx`에서 두 줄 모두 확인.
- **편차**: 없음.
- **다음 에이전트가 알아야 할 것**: 같은 날 사용자 지시("이 문장 삭제")가 스펙 §6.4 ⓓ와 충돌했다 — 기획 문서에 명시된 고지는 사용자 구두 지시보다 먼저 스펙 확인이 필요하다. 문서 커밋에 코드가 묶여 들어간 점은 게이트가 파일 목록으로 대조할 때 참고.

<!-- Gemini 판정 1줄: 대기 -->

## 2026-09-21 | [Sonnet] 카톡 부고 알리기 버튼 아이콘 교체 + 마이페이지 "디지털 정산" 개명 + mypage 시안 아이콘 (사용자 직접 지시)

- **근거 스펙**: 스펙 없음 — 사용자 직접 지시 3건(① 카톡 부고 알리기 버튼 아이콘을 푸터의 말풍선처럼 ② mypage 시안: 상담=편지비행기·문의(카카오톡)=말풍선 ⑦ "디지털 자산 정리 > 디지털 정산"). 개명은 `modeNav.ts`의 `digital-estate` 라벨("디지털 정산")과 맞추는 것.
- **건드린 파일**: `eobomDev/frontend/src/pages/ObituaryPage.tsx`, `eobomDev/frontend/src/pages/MyPage.tsx`, `.harness/memory/backlog.md`(⑲ 신설), `.harness/memory/context.md`(포인터 1줄). Design 캔버스(`https://claude.ai/artifact/FmacNUuzKECyG5bQfzxx8q` v3)는 저장소 밖.
- **결과**:
  1. `ObituaryPage.tsx`: lucide import `Send` → `MessageCircle`, 버튼 `<Send size={16} /> 카카오톡으로 부고 알리기` → `<MessageCircle size={16} /> …`(`Footer.tsx`·`FooterMobile.tsx`의 "카카오톡으로 문의하기"와 같은 아이콘). `Send`는 이 파일에서 그 한 곳뿐이었다.
  2. `MyPage.tsx`: 행 라벨 `디지털 자산 정리` → `디지털 정산`(+ 주석 1줄).
  3. mypage 시안(캔버스): 상담 통계·"상담 신청 내역" 행 = `Send`(편지비행기), 문의 통계·"문의 내역" 행 = `MessageCircle`(말풍선), "디지털 정산" 개명.
  4. `npx tsc --noEmit -p .`(frontend) 에러 0. 🔴 `MyPage.tsx`가 작업 트리에서 CRLF(커밋본 LF)여서 LF로 정규화 — `git diff --stat` 5줄.
  5. 사용자 지시 나머지 6건(③ 카톡 문의 집계·연결 ④ 상담 내역 페이지 ⑤ 회원 탈퇴 ⑥ 개인정보 동의 on/off ⑧ 나에게 공유된 엔딩노트 ⑨ 내가 수락한 가족 지정)은 스펙·결정이 필요해 구현하지 않고 `backlog.md` ⑲에 코드 사실과 함께 남겼다.
- **편차**: 없음. 단 `MyPage.tsx`의 실제 통계·행 아이콘(상담=`MessageCircle`·문의=`Send`)은 시안과 반대인 채로 뒀다 — 시안 확정 뒤 구현할 때 함께 바꾼다(코드 주석의 "InquiryModal·CounselingPage 아이콘 재사용" 근거도 그때 정정).
- **다음 에이전트가 알아야 할 것**: `docs/`에 "디지털 자산 정리" 표기가 남아 있을 수 있다(Opus 몫, 미확인). ⑲의 결정이 나오기 전에는 mypage 구현에 착수하지 않는다.

<!-- Gemini 판정 1줄: 대기 -->

## 2026-09-21 | [Sonnet] 00-36 M-1.5 — 마이페이지 그룹② 허브형 재구성 + "나에게 공유된 것"(SCR-020) 신설

- **근거 스펙**: `docs/00_핵심플랫폼/00-36_마이페이지_정보구조_점검_및_개편_기획서.md` §4.1(구조도)·§4.4~§4.6·§5 M-1.5(5-1~5-4) · `00-39` §6(훑는 목록)·§6.8-1 규칙 21 · Opus 핸드오프(M-1.5 5개 + 캔버스 v4). 시안: Design 캔버스 `https://claude.ai/artifact/FmacNUuzKECyG5bQfzxx8q` v4(마이페이지 웹·모바일 + SCR-020 S1~S4).
- **건드린 파일**: `eobomDev/frontend/src/pages/MyPage.tsx`(전면 재작성), `eobomDev/frontend/src/pages/FamilySharedPage.tsx`(신설), `eobomDev/frontend/src/App.tsx`, `eobomDev/frontend/src/styles/design-v2.css`, `eobomDev/frontend/src/config.ts`, `eobomDev/frontend/src/components/Footer.tsx`, `eobomDev/frontend/src/components/FooterMobile.tsx`, `.harness/memory/backlog.md`, `.harness/memory/context.md`. 서버 변경 0건.
- **결과**:
  1. **5-1** 통계 `문의` 칸 삭제(`stats` 배열에서 `{ label: '문의', value: 0, Icon: Send }` 제거 → 상담·부고장 2칸). 행 `문의 내역`(`comingSoon` 배지·`disabled`) → `카카오톡으로 문의하기`(`<a target="_blank" rel="noreferrer">`, `MessageCircle` 아이콘, 배지·숫자 없음). URL은 푸터와 같은 값을 `config.ts`의 `KAKAO_CHANNEL_CHAT_URL`로 뽑아 `Footer.tsx`·`FooterMobile.tsx`도 그 상수를 쓰게 했다(하드코딩 `"https://pf.kakao.com/_LVxdxaX/chat"` 2곳 → 상수, 동작 동일).
  2. **5-2** C구역 `나에게 공유된 것` — 행 `나를 가족으로 지정한 분`(`Inbox`) → 신설 라우트 `/family-shared`(`App.tsx`) → `FamilySharedPage`(SCR-020). `GET /api/ending-note/family-view`를 `apiFetch`로 호출해 지정자별 구간(`{ownerName} 님` + `지정 관계 · {관계}`) + 열람 가능 섹션 행 + 섹션 열람 모달(`.v2-modal`)을 그린다. 빈 상태 `아직 공유받은 것이 없습니다.` 한 줄(권유 문구 없음), 지정자는 있고 섹션이 없으면 `지금 볼 수 있는 항목이 없습니다.` 표시 필드는 응답에 있는 것뿐 — 연락처·이메일·다른 수락자·POSTMORTEM 섹션은 응답에 없어 그릴 수 없다. 모달 값은 `FUNERAL.funeralType`·`CONTACTS.contactsNote/petCaretaker` 두 섹션만 해석(IMMEDIATE 허용 섹션, `constants.tsx` `SECTION_ALLOWED_TIMINGS`).
  3. **5-3** D구역 `내 활동과 계정` 맨 아래 `로그아웃` 행(`LogOut`) — `MyPage`에 `onLogout` prop 추가, `App.tsx`가 `onLogout={() => handleLogout()}` 전달(기존 `alert('로그아웃 되었습니다.')` 경로 그대로).
  4. **5-4** 아이콘 — 상담(통계 칸·`상담 신청 내역` 행) = `Send`, 카카오톡 문의 = `MessageCircle`.
  5. **스킨 전환(00-39)**: 옛 `.container` + 남색 그라데이션 히어로 + 그림자 패널(`panelStyle` 등 인라인 41곳)을 `.v2-page`/`.v2-content`(764px)·`.v2-profile`·`.v2-stat-row`·`.v2-hub-section`·`.v2-nav-row` 클래스로 교체(`design-v2.css` 약 200줄 추가). 프로필은 이름이 페이지 제목(`.v2-page-title`), 계정 연동은 웹 글자 버튼·모바일 아이콘 버튼. 비회원 화면도 `.v2-empty` + `.v2-btn-primary`로 정리. 라벨 `디지털 정산` 유지.
  6. `npx tsc --noEmit -p .`(frontend) 에러 0, `npm run build`(frontend) 통과(1540 modules, built in 6.21s). 🔴 dev 서버 미기동(방침) — 실기동은 사람이 확인.
- **편차**:
  - **금색 카메라 배지 삭제** — 프로필 사진 우하단 `title="프로필 사진 변경 (개발중)"` 배지(동작 없음)와 `--accent-gold` MEMBER 배지·엔딩노트 아이콘 색을 시안(v3)에서 제거했고 사용자 이의가 없어 구현도 같게 했다. `00-36` §4.1은 프로필 카드를 "현행 유지"라 적었으나 이는 내용(이름·사진·계정 연동)이라 판단.
  - 핸드오프 5-1은 "C구역 `문의 내역`"이라 썼으나 `00-36` §4.1 구조도·표는 그 행이 **D구역**(`내 활동과 계정`)이라 구조도를 따랐다.
  - **SCR-020에 `scope`(주 연락자/열람자)와 수락한 날짜가 없다** — `family-view` 응답에 그 필드가 없고 M-1.5는 서버 0건이라 표시하지 못했다. `00-36` §4.6-1이 요구하는 항목이므로 서버 응답 확장(M-2 범위로 볼지)을 Opus가 정해야 한다. 지정 관계는 응답의 `relationship`을 그대로 썼다(지정자가 나를 어떻게 지정했는지의 뜻인지 문구는 Opus 확인 필요).
  - 구조도(§4.1)에 있으나 이번 범위 밖이라 **그리지 않은 행**: `내가 남긴 방명록`(M-2)·`개인정보·동의`·`내 데이터 반출`·`회원 탈퇴`(M-3)·`내 상담 내역`(M-2 — 현재 `상담 신청 내역` 행이 `counseling`을 여는 오연결 그대로). 캔버스 v4에는 완성 구조로 그려 놓았다.
- **다음 에이전트가 알아야 할 것**: `index.css`의 `.stat-row` 계열·`Badge`(`EntryBoxes`)는 마이페이지에서 안 쓰게 됐다(다른 화면 사용 여부 미확인 — 지우지 않음). `SCR-020`의 `scope`·수락일·수락 철회(§4.6-2, `POST /api/family-designations/accepted/:id/withdraw`)는 서버 작업 뒤에 같은 화면에 붙인다. 캔버스는 사람이 편집기에서 `Main.dc.html` 래퍼에 `width:1362px;height:1055px`를 붙여 둔 상태였으나 내용 변경은 없어 v4가 덮어썼다.

<!-- Gemini 판정 1줄: 대기 -->

## 2026-09-21 | [Sonnet] 모달 배경(오버레이) 클릭으로 닫기 — 전 모달 공통 (사용자 직접 지시)

- **근거 스펙**: 스펙 없음 — 사용자 직접 지시("공통사항. 모달이 떴을 때, 모달 밖 클릭 시 모달 닫히도록"). `00-39` §6.8-1 규칙 21(폼 모달은 X가 아니라 하단 [취소]로 닫는다)과는 충돌하지 않는다 — 닫는 수단을 **추가**하는 것.
- **건드린 파일**: `eobomDev/frontend/src/utils/backdropClose.ts`(신설), 그리고 모달 19곳 — `components/`: `AddressSearchModal`·`KakaoMapModal`·`LoginModal`·`SocialLinkModal`·`counseling/TaxSimulatorModal`·`endingNote/SummaryModal`·`expert/ConsultRequestModal`·`facility/FacilityReviewModal`·`facility/InquiryModal`·`farewell/FarewellMessageCard`·`mypage/MyPageAuthSettings`·`mypage/MyPageFamilyDesignation`·`mypage/MyPageProfile` / `pages/`: `CareGuidePage`·`CounselingPage`·`PickupPage`·`MyObituaryListPage`·`FamilySharedPage`·`ObituaryPage`(수정 모달·조문객 미리보기 모달 2곳).
- **결과**:
  1. 공용 헬퍼 `backdropCloseProps(onClose)` — 배경 `<div>`에 `{...backdropCloseProps(onClose)}`를 펼친다. **`pointerdown` 대상과 `click` 대상이 모두 배경 자신일 때만** 닫는다.
  2. **배경 클릭으로 안 닫히던 10곳**(`TaxSimulatorModal`·`ConsultRequestModal`·`FacilityReviewModal`·`InquiryModal`·`KakaoMapModal`·`LoginModal`·`SocialLinkModal`·`MyPageAuthSettings`·`MyPageFamilyDesignation`·`MyPageProfile`)에 신규 적용. 인라인 스타일 오버레이 5곳은 `style` 앞에 spread 한 줄 삽입.
  3. **이미 닫히던 9곳**(`AddressSearchModal` `onClick={onClose}` · `SummaryModal`/`FarewellMessageCard`의 `e.target === e.currentTarget` 검사 · `CareGuidePage`·`CounselingPage`·`PickupPage`·`MyObituaryListPage`(2곳)·`FamilySharedPage`·`ObituaryPage`(2곳)의 `onClick={() => …}`)는 같은 헬퍼로 교체 — 기존 방식은 **패널 안에서 글자를 드래그하다 배경에서 마우스를 놓으면 click이 배경에 나가 닫혔다**(유족 편지 작성기에서는 쓰던 글이 사라진다). `FarewellMessageCard`는 `!saving` 가드를 그대로 유지: `{...backdropCloseProps(() => { if (!saving) resetComposer(); })}`.
  4. `npx tsc --noEmit -p .`·`npm run build`(frontend) 통과. 🔴 dev 서버 미기동 — 실기동은 사람이 확인.
  5. 줄바꿈: 커밋본이 LF인 파일은 LF로, `TaxSimulatorModal.tsx`는 커밋본이 CRLF라 CRLF로 저장 — `git diff --stat` 파일당 2~5줄.
- **편차**: 없음. 단 손대지 않은 것: `AdminPage`의 확인·상세 모달 2곳(이미 `onClick`으로 닫히며 `!purgeSubmitting` 가드가 있어 운영자 화면이라 뒀다)·`EndingNotePage`의 섹션 리더 오버레이(이미 닫힘)·`FacilityPage` 모바일 필터 시트(별도 배경 요소, 이미 닫힘)·`Sidebar` 드로어. 이 4곳은 드래그 오작동 가능성이 남아 있다.
- **다음 에이전트가 알아야 할 것**: 새 모달을 만들 때 오버레이에 `onClick`을 직접 달지 말고 `backdropCloseProps`를 쓴다. 🟡 폼 모달(로그인·상담 신청·업체 상담·내 정보 등)은 이제 배경을 잘못 눌러도 입력하던 값이 사라진다 — 지시대로 구현했으나 입력값이 있을 때 닫기 확인을 둘지는 Opus가 정할 일이다.

<!-- Gemini 판정 1줄: 대기 -->

## 2026-09-21 | [Sonnet] 00-36 M-2 — 내 상담 내역(SCR-019)·family-view 확장·내 방명록 API

- **근거 스펙**: `docs/00_핵심플랫폼/00-36_마이페이지_정보구조_점검_및_개편_기획서.md` §4.4(내 상담 내역)·§4.6-1-1(family-view 확장·확정 문구)·§5 M-2 #6·#7·#7-1·#7-2·§6 #8 · `00-39` §6(훑는 목록)·`.v2-modal` · Opus 핸드오프(M-2 착수). 스키마 변경·DB 쓰기 0건(전부 SELECT).
- **건드린 파일**: `eobomDev/backend/src/controllers/meActivityController.ts`(신설), `eobomDev/backend/src/routes/meRoutes.ts`, `eobomDev/backend/src/controllers/endingNoteController.ts`, `eobomDev/frontend/src/pages/MyConsultationsPage.tsx`(신설), `eobomDev/frontend/src/pages/FamilySharedPage.tsx`, `eobomDev/frontend/src/pages/MyPage.tsx`, `eobomDev/frontend/src/App.tsx`, `eobomDev/frontend/src/styles/design-v2.css`, `.harness/memory/context.md`.
- **결과**:
  1. **`GET /api/me/leads`**·**`GET /api/me/consult-requests`**(`meActivityController.ts`, `meRoutes.ts`에 등록) — 둘 다 `where: { userId: decoded.id }`(토큰의 값만 사용), `select`로 컬럼 화이트리스트, `orderBy createdAt desc`, `take 100`. 내리는 것: Lead=`leadNo`→`no`·`type`·`facility.name`→`facilityName`·요약·`statusGroup`·`thirdPartyConsentAt`·`createdAt` / ConsultRequest=`requestNo`→`no`·`channel`·`expert.name`→`expertName`·`categorySnapshot`→`category`·요약·`statusGroup`·`thirdPartyConsentAt`·`createdAt`. **내리지 않는 것**(select에 없음): `billable`·`billedAmount`·`commissionPolicyId`·`settlementId`·`disputeReason`·`partnerId`·`applicantName`·`applicantPhone`·`payload` 원문·`statusHistory`. 상태 4단계 접기: Lead `REQUESTED·NOTIFIED→RECEIVED`/`RESPONDED→IN_PROGRESS`/`CONVERTED→DONE`/`LOST·INVALID→CLOSED`, ConsultRequest `REQUESTED→RECEIVED`/`ACCEPTED→IN_PROGRESS`/`COMPLETED→DONE`/`CANCELLED·INVALID→CLOSED`(모르는 값은 `RECEIVED`). payload 요약: `CALL`→`전화 문의 버튼을 누름`, 그 외→`payload.message`만 읽어 60자 절단(모르는 키는 읽지 않음). ConsultRequest 요약은 `content` 60자 절단.
  2. **`GET /api/me/guestbook-entries`** — `MemorialGuestbook where { userId, deletedByOwnerAt: null, hiddenAt: null }`, 본문·관계·작성일 + `memorial {slug, deceasedName, isClosed}`. 🔴 삭제 엔드포인트는 만들지 않았다(§6 #8 미정).
  3. **`family-view` 확장·왕복 축소**(`endingNoteController.getFamilyVisibleEndingNotes` 함수 전체 교체): 응답에 `scope`(`PRIMARY|VIEWER`)·`acceptedAt` 추가, 그 외 필드는 늘리지 않음(연락처·`priority` 없음). 질의 `1 + 3n`회 → **2회(n과 무관)** — ① `familyDesignation.findMany`에 `user.endingNote`·`endingNoteGrants(IMMEDIATE·미철회)` 관계 조인 ② `endingNoteEntry.findMany`를 `OR [{noteId, section in [...]}]` 한 번. 노트 없는 지정은 예전처럼 응답에서 제외, `WILL_DRAFT` 재차단 유지, `orderBy acceptedAt asc` 추가.
  4. **프런트** — 신설 `MyConsultationsPage.tsx`(`/my-consultations`, `App.tsx` 라우트): 두 API를 `Promise.allSettled`로 병렬 호출해 `createdAt` 최신순 한 목록, 행 = 제목(시설명 또는 `비제휴 업체` / 전문가명+직역)·`방식 · 신청일`·상태(접수됨/진행 중/완료/종료)·›, 행 클릭 → `.v2-modal`(접수번호·방식·신청일·상태·내용·제3자 제공 동의 시각), 빈 상태 `아직 신청하신 상담이 없습니다.` + `상담 신청` 버튼. `MyPage.tsx` 행 `상담 신청 내역`(→`counseling`) → **`내 상담 내역`(→`my-consultations`)**. `FamilySharedPage.tsx`: 제목 줄 오른쪽 `지정 관계 · {관계}` → `나를 {관계}로 지정 · {주 연락자|열람자}`(받침 판정 `withRo`), 구간 아래 `{YYYY-MM-DD} 수락함`, `scope`·`acceptedAt`은 선택 필드(옛 응답 호환). `design-v2.css`에 `.v2-nav-row-text`·`.v2-nav-row-sub`·`.v2-hub-foot` 추가.
  5. 검증: `npx tsc --noEmit -p .`(backend·frontend 각각) 에러 0, `npm run build`(frontend) 통과. **스모크**(임시 스크립트 `_smoke_m2.ts`, 실행 뒤 삭제 — 저장소에 없음): 존재하지 않는 `userId` 토큰으로 컨트롤러 4개 직접 호출 → 전부 `200 {"status":"success","data":[]}`, 인증 없이 `listMyLeads` → `401`(쿼리가 런타임에서 유효함을 확인). 🔴 **개발 DB에 수락된 가족 지정(`status=ACCEPTED`)이 0건이라 `family-view`의 데이터 있는 경로(조인·OR 조회·응답 모양)는 실행해 보지 못했다** — 타입체크로만 검증.
- **편차**:
  - 핸드오프 3번은 API만 적어 **내가 남긴 방명록 화면·마이페이지 행은 만들지 않았다**(스펙에 화면(SCR)이 없고, 눌러도 갈 곳 없는 행을 만들지 않는 원칙). API만 소비자 없이 존재한다.
  - 전화 문의(`type=CALL`)는 "버튼을 누른 기록"이지 접수된 상담이 아닌데 `00-36` §4.4가 목록에 넣도록 해서 넣었고 상태는 항상 `접수됨`이다 — 사실과 어긋난 표시일 수 있어 Opus 확인이 필요하다(요약은 `전화 문의 버튼을 누름`으로 사실대로 적음).
  - 응답 필드명은 `no`(접수번호)·`statusGroup` 등 스펙에 명시가 없어 내가 정했다(`leadNo`/`requestNo`를 `no`로 통일).
  - 목록 상한 100건(스펙에 없음) — 페이지네이션은 없다.
  - SCR-019는 Design 캔버스 시안 없이 `00-39` 훑는 목록 규칙을 그대로 적용했다(캔버스에 없음).
- **다음 에이전트가 알아야 할 것**: M-3(회원 탈퇴)은 스키마 변경이라 `backup-db.ps1` → 파일 확인 → 사람 CONFIRM → migrate → `generate-db-doc.js` 순서. `family-view`의 `1 + 3n → 2회` 개선은 데이터 있는 실측을 못 했으니 사람이 지정 2건 이상 계정으로 응답 시간과 응답 모양(`scope`·`acceptedAt` 포함, 연락처 없음)을 한 번 확인할 것.

<!-- Gemini 판정 1줄: 대기 -->

## 2026-09-21 | [Sonnet] M-2 후속 3건 — CALL 제외·SCR-021 내가 남긴 방명록·SCR-019 잘림 표시 (00-36 §4.4-1·§4.7·§6 #9)

- **근거 스펙**: `docs/00_핵심플랫폼/00-36_마이페이지_정보구조_점검_및_개편_기획서.md` §4.4-1(CALL 제외)·§4.7(SCR-021)·§6 #9(100건 잘림) · `docs/01_장사시설_매칭/01-05_장사시설_사업자회원_및_리드_수수료_정산_명세서.md` §4.1(CALL=익명 이벤트·기본 비청구) · Opus 핸드오프. 스키마 변경·DB 쓰기 0건.
- **건드린 파일**: `eobomDev/backend/src/controllers/leadController.ts`, `eobomDev/backend/src/controllers/meActivityController.ts`, `eobomDev/backend/src/controllers/summaryController.ts`, `eobomDev/frontend/src/pages/MyConsultationsPage.tsx`, `eobomDev/frontend/src/pages/MyGuestbookPage.tsx`(신설), `eobomDev/frontend/src/pages/MyPage.tsx`, `eobomDev/frontend/src/App.tsx`, `.harness/memory/context.md`.
- **결과**:
  1. **CALL 제외**: ① 적재 — `leadController.createCallEvent`에서 `const decoded = verifyBearerToken(req);`를 지우고 `userId: decoded?.id ?? null` → `userId: null`(항상 익명). ② 조회 — `meActivityController.listMyLeads`의 `where`를 `{ userId: decoded.id }` → `{ userId: decoded.id, type: { not: 'CALL' } }`. ③ 기존 행 미수정(`updateMany` 안 씀). 카톡 상담은 Lead에 얹지 않았다. **문서에 없는 추가 1건**: `summaryController.getMySummary`의 `prisma.lead.count`에도 `type: { not: 'CALL' }`를 넣었다 — 안 넣으면 마이페이지 통계 "상담 n"에는 기존 CALL 행이 세이고 목록에는 안 보여 숫자와 목록이 어긋난다. CALL 잔재 정리: `summarizeLeadPayload`에서 CALL 분기·인자 `type` 삭제, `MyConsultationsPage.LEAD_TYPE_LABEL`에서 `CALL: '전화 문의'` 삭제.
  2. **SCR-021**: `MyGuestbookPage.tsx`(`/my-guestbook`, `App.tsx` 라우트) — `GET /api/me/guestbook-entries`(M-2에서 만든 것, `deletedByOwnerAt`·`hiddenAt` 제외·`userId` 일치)를 호출, 행 = 추모관 고인 성함(`<Link to="/m/:slug">` 행 전체)·내 글 한 줄(말줄임 `.v2-nav-row-sub`)·작성일. 빈 상태 `아직 남기신 글이 없습니다.` 한 줄(권유 없음). 🔴 읽기 전용 — 삭제 버튼·문구 없음. `MyPage.tsx` `내가 남긴 것` 구간에 행 `내가 남긴 방명록`(`PenLine`, `go('my-guestbook')`) 추가.
  3. **잘림 표시**: 서버가 세 목록 모두 `take: LIST_LIMIT + 1`(101건)로 읽어 내려주고, 프런트가 100건만 그린다. 101건째가 왔으면(또는 상담 두 목록을 합쳐 100건 초과) 목록 끝에 `최근 100건까지만 표시됩니다.`(`.v2-hub-foot`). "정확히 100건인 사람에게 없는 잘림을 알리지 않기 위해" 한 건 더 읽는 방식을 골랐다. 같은 처리를 SCR-021에도 적용(스펙은 SCR-019만 명시).
  4. 검증: `npx tsc --noEmit -p .`(backend·frontend) 에러 0, `npm run build`(frontend) 통과. 스모크(임시 `_smoke_m2b.ts`, 실행 뒤 삭제 — SELECT만): 개발 DB에서 `type='CALL'` 행 **0건**(`userId` 있는 것도 0), `type != CALL & userId 있음` 5건, 필터 쿼리(`type: { not: 'CALL' }`) 정상 실행. 🔴 dev 서버 미기동 — 화면 실기동은 사람이 확인.
  5. 캔버스 `https://claude.ai/artifact/FmacNUuzKECyG5bQfzxx8q` v7 — SCR-019(웹·모바일, 잘림 줄 포함)·SCR-021(웹·모바일) 아트보드 4장 추가(기존 아트보드·인덱스 키 보존, 새 항목만 추가).
- **편차**:
  - `getMySummary` 필터 추가(위 1)는 스펙에 명시가 없는 확장이다 — 통계와 목록의 일관성 때문이며 Opus 확인 필요.
  - 잘림 표시를 스펙의 "100건 초과"에 맞추려고 서버 응답이 최대 **101건**이 됐다(스펙의 "100건 상한" 문구와 미세하게 다름). 프런트가 100건으로 자른다.
  - 화면(SCR-019 보완·SCR-021)은 개발 DB에 방명록 테스트 글이 없어 실제 렌더를 보지 못했다.
- **다음 에이전트가 알아야 할 것**: M-3(회원 탈퇴)의 스키마 변경은 **두 개** — `User`(`deletionRequestedAt`·`deletionScheduledAt`) + `MemorialGuestbook`(`deletedByAuthorAt`)를 **한 번의 마이그레이션**으로. 순서: `backup-db.ps1` → 파일 생성 확인 → 사람 CONFIRM → migrate → `generate-db-doc.js`. SCR-021 삭제 버튼과 `DELETE /api/me/guestbook-entries/:id`(개설자용과 분리)는 그 마이그레이션 뒤에 켠다.

<!-- Gemini 판정 1줄: 대기 -->

## 2026-09-21 | [Sonnet] 마이페이지 후속 — 방명록 작성 시 로그인 토큰 누락 수정·구간 순서 변경·로그아웃/회원 탈퇴 최하단 한 줄 (사용자 직접 지시)

- **근거 스펙**: 스펙 없음 — 사용자 직접 지시 3건(① 내 부고장·추모관과 디지털 정산 위치 변경 ② 방명록을 남겼는데 "내가 남긴 방명록"에 안 뜸 ③ 로그아웃·회원 탈퇴를 작은 글자 최하단 한 줄, "내 활동과 계정"과 별개, 탈퇴는 빨간 글자). 관련: `00-36` §4.7(SCR-021)·§4.3(회원 탈퇴).
- **건드린 파일**: `eobomDev/frontend/src/pages/MemorialLandingPage.tsx`, `eobomDev/frontend/src/pages/MyPage.tsx`, `eobomDev/frontend/src/styles/design-v2.css`. Design 캔버스 `https://claude.ai/artifact/FmacNUuzKECyG5bQfzxx8q` v8(저장소 밖).
- **결과**:
  1. **방명록 미표시 원인 = 프런트가 로그인 토큰을 안 실어 보냄.** `MemorialLandingPage.handleGuestbookSubmit`이 plain `fetch(..., { headers: { 'Content-Type': 'application/json' } })`였다 → 백엔드 `createGuestbookEntry`는 `verifyBearerToken(req)`가 성공해야 `userId`를 저장하는데 토큰이 없어 **로그인한 채 쓴 글도 `userId=null`(비회원 글)** 로 저장 → `GET /api/me/guestbook-entries`(`userId` 일치)에 안 잡힘. 수정: `fetch` → `apiFetchRaw('/api/memorials/${slug}/guestbook', 'USER', { method: 'POST', body })`(토큰이 있으면 `Authorization`이 붙고, 없으면 예전처럼 비회원 글). 백엔드 변경 없음. 진단: 개발 DB `MemorialGuestbook` 6건 전부 `userId` null(SELECT, 임시 스크립트 `_smoke_gb.ts` 실행 뒤 삭제).
  2. **위치 변경**: `MyPage.tsx` `내가 남긴 것` 구간에서 `내 부고장 · 추모관`과 `디지털 정산`의 순서를 맞바꿈(엔딩노트 → 유족 메시지 보관함 → **디지털 정산 → 내 부고장·추모관** → 내가 남긴 방명록).
  3. **로그아웃·회원 탈퇴**: `내 활동과 계정` 구간의 `로그아웃` 행 삭제(`LogOut` import 삭제), 구간 밖 최하단에 `.v2-account-foot`(위 1px 선·가운데 정렬 한 줄) + `.v2-account-foot-btn`(13px 글자, 터치 타깃 44px 유지)로 `로그아웃`(보조 글자색)·`회원 탈퇴`(`.is-danger` 빨간 글자). `회원 탈퇴`는 M-3 흐름이 없어 `.v2-modal`로 "회원 탈퇴 기능을 준비하고 있습니다." + 닫기만 띄운다(`backdropCloseProps` 적용).
  4. 캔버스 v8: 위 순서·최하단 한 줄 반영(마이페이지 웹·모바일).
  5. `npx tsc --noEmit -p .`(frontend) 에러 0, `npm run build`(frontend) 통과. 🔴 dev 서버 미기동 — 실기동은 사람이 확인.
- **편차**: `회원 탈퇴` 버튼이 아직 실제 탈퇴 흐름이 아니다(M-3 선행: 스키마 변경·백업·CONFIRM) — "준비 중" 모달로 대신했고, 눌러도 아무 일 없는 버튼을 피하려는 임시 처리다. 사용자 지시 1번("위치 변경")을 두 행의 **순서 맞바꿈**으로 해석했다.
- **다음 에이전트가 알아야 할 것**: 🔴 **이미 남긴 방명록 글은 회원 글로 복구되지 않는다** — 저장 시점에 작성자를 식별할 값이 남지 않았다(`userId=null`, 작성자명은 자유 입력). 수정 배포 뒤 **새로 남긴 글**부터 "내가 남긴 방명록"에 뜬다. 🟡 같은 원인의 인접 버그: `handleTribute`(헌화)도 plain `fetch`라 토큰이 안 간다 — 로그인 사용자 1인 1회 보장(`@@unique([memorialId, userId])`)이 실제로는 작동하지 않는다. 이번엔 지시 범위 밖이라 손대지 않았다.

<!-- Gemini 판정 1줄: ✅통과 (MemorialLandingPage.tsx에 apiFetchRaw 적용 확인 / MyPage.tsx 구간 순서 및 .v2-account-foot 최하단 버튼 배치 확인 / 프런트엔드 빌드 재현 통과) -->

## 2026-09-21 | [Sonnet] M-3 회원 탈퇴(30일 유예·소프트 삭제) + 내 방명록 본인 삭제 + 헌화 1인 1회(localStorage) + 최하단 줄 정렬

- **근거 스펙**: `docs/00_핵심플랫폼/00-36_마이페이지_정보구조_점검_및_개편_기획서.md` §4.3(4단계 확인 흐름)·§4.7-1(내 글 삭제)·§5 M-3 #10~#12·`docs/06_엔딩노트_유언/06-05_유족메시지_보관함_도메인분리_기획서.md` §5.4-2·§5.4-2-1(소프트 삭제=시각 필드)·§5.6-8 ④ · `.harness/db-safety.md` §2 · `00-39` 규칙 18·19·21 · Opus 핸드오프 + 사용자 지시(최하단 줄 오른쪽 정렬·구분선 제거, 헌화 1인 1회는 localStorage).
- **건드린 파일**: `eobomDev/backend/prisma/schema.prisma`, `eobomDev/backend/prisma/migrations/20260921050000_account_deletion_and_guestbook_author_delete/migration.sql`(신설), `eobomDev/backend/src/controllers/accountDeletionController.ts`(신설), `eobomDev/backend/src/controllers/meActivityController.ts`, `eobomDev/backend/src/controllers/memorialController.ts`, `eobomDev/backend/src/controllers/authController.ts`, `eobomDev/backend/src/routes/meRoutes.ts`, `eobomDev/frontend/src/components/mypage/WithdrawalModal.tsx`(신설), `eobomDev/frontend/src/components/AccountRecoveryModal.tsx`(신설), `eobomDev/frontend/src/pages/MyPage.tsx`, `eobomDev/frontend/src/pages/MyGuestbookPage.tsx`, `eobomDev/frontend/src/pages/MemorialLandingPage.tsx`, `eobomDev/frontend/src/App.tsx`, `eobomDev/frontend/src/styles/design-v2.css`, `docs/00_핵심플랫폼/00-05_DB_요구사항_및_테이블_사전.md`(`generate-db-doc.js` 자동 생성), `.harness/memory/context.md`.
- **결과**:
  1. **DB 절차(`db-safety.md` §2)**: 대상 = 로컬 Docker `eobom-postgres`(`localhost:5433`·`eobom_db`, `.env` DATABASE_URL로 확인). 🔴 `backup-db.ps1`은 `BACKUP_DATABASE_URL`(운영 Supabase)을 뜨므로 쓰지 않고 §2 표의 로컬 명령(`docker exec eobom-postgres pg_dump -U Samil eobom_db -Fc` → `docker cp`)으로 백업 → `prisma/backups/local-20260921_132135.dump` 252,076B 생성 확인, `pg_restore --list` 203항목·`User`/`MemorialGuestbook`/`Lead` 등 TABLE DATA 포함 확인. **사람 CONFIRM 받음**(AskUserQuestion "승인 — migrate deploy 실행") → `npx prisma migrate deploy` → `20260921050000_…` 1개 적용("All migrations have been successfully applied"). 검증: `information_schema.columns`에 `User.deletionRequestedAt`·`User.deletionScheduledAt`·`MemorialGuestbook.deletedByAuthorAt` 3개(전부 `timestamp`, nullable), `_prisma_migrations`에 finished, 적용 뒤 행 수 User 6·MemorialGuestbook 7·Lead 8(변경 0)·새 컬럼 채워진 행 0건. `npx prisma generate`, `node .harness/tools/generate-db-doc.js`("모델 31개, 물리 컬럼 358개") 실행. 🔴 `migrate diff`(shadow DB)는 08-05 사고 원인이라 쓰지 않았고 SQL은 손으로 작성(`ALTER TABLE … ADD COLUMN` 3개), 검증은 `prisma validate`(DB 접속 없음).
  2. **스키마**: `User.deletionRequestedAt DateTime?`·`deletionScheduledAt DateTime?`(요청+30일), `MemorialGuestbook.deletedByAuthorAt DateTime?`. 상태 문자열을 새로 만들지 않았다(06-05 §5.4-2-1).
  3. **API 4개 + 1**: `GET /api/me/deletion-preview`(건수만 — 지워지는 것: 편지·그중 음성·엔딩노트 섹션·부고장·방명록·시설 후기·가족 지정 / 남는 것: 추모관·이미 접수된 상담·문의(`Lead`는 `type != CALL`), `$transaction` 한 왕복, 본문 없음) · `POST /api/me/deletion-request`(시각 두 개만 찍음, 이미 요청된 계정은 재요청해도 **연장하지 않고** 기존 값 반환, `update`는 `where: { id }` 한 행) · `DELETE /api/me/deletion-request`(두 시각 비움 = 복구) · `DELETE /api/me/guestbook-entries/:id`(`deletedByAuthorAt`만 찍는 소프트 삭제, `findFirst {id, userId, deletedByAuthorAt: null}`로 소유 확인 후 그 id만 갱신, 없는 글·남의 글·이미 지운 글은 같은 404, 개설자용 `DELETE /api/memorials/:id/guestbook/:gid`와 분리) · `GET /api/auth/me` 응답에 `deletionRequestedAt`·`deletionScheduledAt` 추가(조회만 — **비우지 않는다**). 조회 필터: `listMyGuestbookEntries`·공개 `listGuestbook`에 `deletedByAuthorAt: null` 추가. 🔴 런타임에서 행·파일·객체를 지우는 코드 0건.
  4. **프런트**: `WithdrawalModal`(마이페이지 `회원 탈퇴` → ① 지워지는 것(0건 항목 숨김)+남는 것 고지 ② 반출 안내(현재 내려받을 수 있는 것은 유족 메시지 보관함 zip뿐 → 보관함 이동 버튼) ③ 30일 유예 고지 ④ `.v2-check` 동의 + `.v2-btn-solid`(누르면 `처리 중…`·잠김, 규칙 19) → 완료 화면(`YYYY-MM-DD까지 보관`) → 확인 시 로그아웃). `AccountRecoveryModal`(App.tsx 전역): 로그인 후 `/api/auth/me`에 `deletionScheduledAt`이 있으면 **배경 클릭으로 닫히지 않는** 복구 안내 — `계속 이용`(=`DELETE /api/me/deletion-request`)·`로그아웃`(탈퇴 유지) 둘뿐, 로그인만으로는 자동 복구되지 않는다. `MyGuestbookPage`: 행 오른쪽 `삭제` 버튼(`.v2-nav-row-wrap`+`.v2-row-action`) → 확인 모달 → 성공 시 목록에서 제거. `MyPage`의 "준비 중" 임시 모달 삭제.
  5. **사용자 지시 2건**: ① `.v2-account-foot` 오른쪽 정렬(`justify-content: flex-end`)·위 구분선(`border-top`) 삭제·`margin-top` 64→48px(캔버스 v9 반영) ② 헌화(`MemorialLandingPage.handleTribute`) — 로그인 정보는 계속 보내지 않고, 1인 1회 제한을 `localStorage`(`eobom_tributed_{slug}`)에 저장: 성공·409 시 표시, 다시 열면 `duplicate` 상태로 버튼 비활성, 성공 직후 `done` 상태(`헌화하셨습니다.`). 저장소가 막힌 환경은 `try/catch`로 조용히 넘어가 제한만 없어진다.
  6. 검증: `npx tsc --noEmit -p .`(backend·frontend 각각) 에러 0, `npm run build`(frontend) 통과. 스모크(임시 `_smoke_m3.ts`, 실행 뒤 삭제): 실제 사용자로 `deletion-preview` 200(`willDelete` 전부 0, `willRemain.memorials` 4·`consultations` 0), 인증 없음 401, 없는 사용자 404(preview·request·cancel), 없는 방명록 id 삭제 404, `guestbook-entries` 200, `auth/me`에 두 필드(null) 포함. 🔴 **쓰기 경로(`deletion-request` POST/DELETE 성공, 방명록 본인 삭제 성공)는 실행해 보지 않았다** — 기존 사용자 행을 덮어쓰는 것이라 CONFIRM 범위이고 테스트 사용자를 새로 만들어 남기고 싶지 않았다(§4). 타입체크·404 경로까지만 확인했으니 사람이 실기동에서 한 번 눌러 볼 것.
- **편차**:
  - 🔴 **파기 배치 ④(`06-05` §5.6-8 ④ — `deletionScheduledAt < now`인 회원의 계정 파기)는 구현하지 않았다.** 스펙상 별도 실행 스크립트(`--confirm` 없으면 dry-run·사람 승인·R2 원본/아카이브 2단계)이고 M-3 #10~#12 범위 밖으로 판단했다. 그래서 지금은 **"30일 뒤 삭제됩니다"라고 안내하지만 그 삭제를 수행하는 코드가 없다** — `06-05` §5.4-2가 경고한 "쓴 대로 동작해야 한다"에 걸리므로 다음 작업으로 반드시 필요하다.
  - `00-36` §4.3 문구 *"30일 안에는 로그인만 하면 되돌릴 수 있습니다"*는 M-3 본문의 *"'계속 이용'을 눌러야 비운다"*와 충돌해서, 화면 문구는 후자를 따라 *"30일 안에 다시 로그인해 '계속 이용'을 선택하면 탈퇴 신청이 취소됩니다"*로 썼다.
  - 유예 중인 계정도 서버 API는 그대로 쓸 수 있다(복구 안내는 프런트 모달이 막을 뿐) — 서버 쪽 차단은 스펙에 없어 만들지 않았다.
  - 이번 화면들(WithdrawalModal·AccountRecoveryModal·삭제 확인)은 Design 캔버스 시안 없이 `00-39` 규칙 18·19·21과 `.v2-modal`을 그대로 적용했다.
- **다음 에이전트가 알아야 할 것**: ① 파기 배치 ④ 스크립트(`destroy-farewell-media.ts` 패턴 — dry-run 기본·`--confirm`·그 회원의 ①② 먼저) ② `prisma/backups/local-20260921_132135.dump`는 커밋하지 않은 상태의 미추적 파일이다(직전 `local-20260907_115023.dump`는 커밋돼 있다 — 개발 DB 사용자 이메일 등이 들어 있으니 커밋 여부는 사람이 정할 것) ③ 헌화는 이제 로그인 정보를 안 보내므로 `@@unique([memorialId, userId])`는 실질적으로 쓰이지 않는다(사용자 확인: "큰 문제 아님") ④ 방명록을 로그인 상태로 새로 써야 `내가 남긴 방명록`에 뜬다(이미 쌓인 `userId=null` 글은 복구 불가).

<!-- Gemini 판정 1줄: ✅통과 (schema.prisma 3개 컬럼 및 migration SQL 실존 확인 / 4개 엔드포인트 meRoutes 등록 및 obituaries·memorials willRemain 귀속 확인 / WithdrawalModal·AccountRecoveryModal·MyGuestbookPage 삭제 UI 실장 확인 / backend tsc 및 frontend build 재현 통과) -->

## 2026-09-22 | [Sonnet] FacilityPage v2 이관(00-39 §8 #5) + §5 레이아웃 값 개정(전 화면)

- **근거 스펙**: docs/00_핵심플랫폼/00-39_디자인_기준_재정립_명세서.md §8 #5(facility 겉모양만 v2로, 구조·기능·그림자·호버 불변) · §6-1-1(카드 허용, 그림자+호버는 규칙으로 안 정함) · §6.1 규칙2(본문 읽기폭 고정 — 이번에 사람 지시로 실질 대체됨, 아래 편차 참고) · Opus 핸드오프(옛값→새값 대응표 확인 요청) + 사람 직접 지시 다수(세션 중 여러 차례 정정).
- **건드린 파일**: eobomDev/frontend/src/pages/FacilityPage.tsx, eobomDev/frontend/src/styles/design-v2.css. 캔버스 "장사시설 페이지 시안 — v2 통일"(https://claude.ai/artifact/LVbmAGMkxY38JvfRhMsqsK)은 최종적으로 **기각**(사람 지시 — CareGuidePage 실측을 정본으로 재작업).
- **결과**:
  1. **색·서체·글자크기 토큰 교체**(§8 #5) — var(--primary-color)→var(--v2-text-main), var(--point-color)→var(--v2-point), var(--text-muted)→var(--v2-text-muted), var(--card-bg)→var(--v2-bg), var(--secondary-color)→var(--v2-selected-bg), 검색창·페이지버튼 테두리→var(--v2-btn-border), 필터 상자 테두리→var(--v2-divider-strong). var(--accent-gold)·var(--state-warn-*)는 거리·상단 배지에서 걷어내고(경고가 아니라 정보) var(--v2-text-faint)+중립 배경으로, "실제 위치 아님" 경고는 진짜 경고라 state-warn-* 유지. var(--fs-body)→var(--v2-fs-support)(15px) 일괄, 부제만 var(--v2-fs-body)(17px), 카드/리스트 제목(시설명)은 var(--v2-fs-item-title)(19px)/모바일 -mobile(17px), var(--fs-caption)은 문맥별로 15px 또는 13px(var(--v2-fs-label)). 제목 className을 page-title→v2-page-title, 감싸는 div를 v2-page-head로 교체(CareGuidePage와 동일 클래스).
     🔴 **의도적으로 안 건드린 곳**: .form-select·.form-input·.form-label(전역 공용 클래스, 여기서 인라인으로 색을 얹으면 :focus 테두리가 죽는다) · className="btn btn-primary"인데 배경색이 인라인으로 없는 버튼(검색·적용하고 검색·상담 버튼의 배경 — .btn-primary:hover가 인라인에 가려 사라지는 걸 피함, 크기만 v2로 바꿈). 새 클래스 .v2-tag(카드 안 태그, 선택 상태 표현용) 1개 추가 — 기존 .v2-badge-neutral(칠해진 고정 배지)로는 선택 강조를 표현 못 해 사람이 4번째 예외로 승인.
  2. **여백·폭 표준화**(§5, 전 화면 영향) — --v2-gutter-web 40→80px, --v2-gutter-mobile 20→24px, .v2-page padding 48/40/96→96/80/96(모바일 24/20/64→32/24/72). .v2-content 폭을 var(--v2-reading-width)(764px 고정)에서 calc(var(--v2-toc-width) + var(--v2-reading-width) + 48px)(1048px, .v2-page-head와 동일)로 — "제목 박스와 본문 박스 폭이 다르다"는 지적에서 시작해 care-guide처럼 맞춤(care-guide는 .v2-guide-shell이 처음부터 같은 계산식이라 원래 맞아 있었음). .v2-card-grid(pickup 등)를 고정 2열→auto-fit minmax(min(320px,100%),1fr)(facility의 .grid와 동일 패턴)로 바꿔 1048px에서 자동 3열.
     실측(dev서버, getBoundingClientRect): /facility·/pickup 제목 y좌표 181px로 동일, 제목·본문 박스 폭 둘 다 1048px, 카드 그리드 열 수 둘 다 3, pickup 카드 폭 336px.
  3. **facility 카드 크기 축소** — 카드 이미지 박스 160→120px, 필터 상자 안쪽 여백 1.1rem→0.9rem·칸 간격 1.2rem→0.9rem. §5 개정으로 폭이 764→1048px(2→3열)로 다시 넓어졌지만 값은 유지(카드 폭이 336px 안팎으로 비슷해 문제 없음) — 관련 주석 4곳(FacilityPage.tsx:297·299·416·765)을 1048px·3열 기준으로 정정.
  4. 검증: 매 단계 npx tsc --noEmit -p .·npm run build(frontend) 통과. dev서버 임시 기동(작업 종료 시마다 kill)으로 CareGuidePage·PickupPage·CounselingPage 실제 렌더와 비교해 색·크기·폭을 맞췄다(design 캔버스 대신 실기동 대조를 쓴 이유는 캔버스가 실제 화면과 상당히 달랐던 것으로 09-22 세션 중 확인됨 — 아래 편차 참고). 🔴 로그인 필요 화면 없음, DB 쓰기 0건.
- **편차**:
  - 🔴 **캔버스를 정본으로 안 썼다.** 처음 캔버스로 시안을 만들었는데(그림자 카드+배지+태그 칩+세그먼트 토글 등 새 시각 요소 다수) 사람이 "다른 페이지와 통일성이 없다"고 지적, dev서버로 /pickup·/counseling 실측해보니 실제 화면은 훨씬 밋밋했다(채운 배지 없음, 세그먼트 토글 없음, 필드 라벨 없음). 결국 사람이 캔버스 자체를 기각하고 "먼저 옛값→새값 대응표를 보여달라"로 방식을 바꿨다. feedback_design_tool_over_live_testing(09-18, "무조건 Design 캔버스")과 결이 다른 예외 사례 — Design 캔버스가 실제 구현된 화면과 크게 벌어질 수 있다는 반례로 메모리 갱신 검토 필요.
  - 🔴 **§6.1 규칙2(본문 읽기폭 고정) 사실상 무력화.** .v2-content를 764→1048px로 바꾼 것은 이 규칙(체크리스트·법정문구 화면도 넓은 화면을 안 채운다)과 정면 충돌한다. 사람이 "전화면 다 푼다"고 명시적으로 확정했으나(09-22), 문서(00-39 §6.1)는 아직 그 문구 그대로다 — Opus가 규칙2를 삭제/수정할지 판단 필요.
  - 카드 안 태그용 신설 클래스 .v2-tag는 §6.7 클래스 등재 대상이나 아직 문서에 없다.
  - .form-select/.form-input/.form-button류의 배경색은 이번에 안 바꿨다 — facility의 검색창·"검색" 버튼 등 일부는 여전히 옛 primary-color 계열로 남아 있다(§8 #5 완전 이관은 아님, 위 1번 참고).
- **다음 에이전트가 알아야 할 것**:
  1. 00-39 문서 갱신 필요 3건 — ① §5 수치(gutter-web/mobile·.v2-page padding·.v2-content 폭 계산식·.v2-card-grid auto-fit) ② §6.1 규칙2 문구(읽기폭 고정 원칙과 이번 결정의 관계 정리) ③ §6.7 클래스 등재에 .v2-tag 추가.
  2. .v2-content 폭 확대로 다른 8개 화면(DigitalEstatePage·MyGuestbookPage·MyPage·MyConsultationsPage·FamilySharedPage·MyObituaryListPage·PickupPage·CounselingPage)도 영향권이다 — 이번에 각 화면 내부까지 실기동으로 훑지는 못했다. 특히 여러 줄 문단이 있는 화면이 새로 생기면 764px(var(--v2-reading-width))로 개별 캡을 씌울 것(이번 점검에서 9개 화면 모두 해당 없음 확인됨 — .v2-do-list 등 목록류는 제외 대상).
  3. facility 실기동 검증 대기 — 이번 세션은 dev서버 임시 기동+즉시 종료로 스냅샷만 비교했고, 사람의 실제 화면 확인은 아직이다.

<!-- Gemini 판정 1줄: 대기 -->

## 2026-09-22 | [Sonnet] memorial v2 이관(00-39 §9.1 그룹① 편입) — 완료

- **근거 스펙**: docs/00_핵심플랫폼/00-39_디자인_기준_재정립_명세서.md §9.1(2026-09-22 개발자 지시로 `memorial`이 그룹⑦ 미정 → 그룹① 목록·체크리스트로 편입) · §6.7(목록 클래스) · §6.8·§6.8-1(폼 클래스, 그룹② 대표 `obituary`에서 확정) · §6.4(안내 모달).
- **건드린 파일**: eobomDev/frontend/src/pages/MemorialPage.tsx (전면 재작성). CSS 신규 클래스 없음 — 기존 §6.7·§6.8 클래스만 재사용.
- **결과**:
  1. **목록** — `MyObituaryListPage.tsx`(my-obituaries)의 행·모달 패턴을 그대로 적용: `.v2-page`/`.v2-page-head`/`.v2-content`/`.v2-list-row`/`.v2-list-main`/`.v2-list-title`/`.v2-list-meta`/`.v2-row-chevron`. 공개범위(`VISIBILITY_LABEL`)는 상태(진행중/종료) 표시가 아니라서 `.v2-status-active`가 아닌 `.v2-list-inline-meta`(중립 회색, MyObituaryListPage 밖에서는 처음 쓴 조합이나 §6.7에 이미 있는 기존 클래스)로 달았다.
  2. **만들기 폼** — 접이식 인라인 폼(기존 UX 유지, 별도 화면·모달로 옮기지 않음)을 §6.8·§6.8-1 클래스로 재작성: `.v2-form`/`.v2-form-section.is-plain`/`.v2-field`/`.v2-input`/`.v2-select`/`.v2-check`. 폭은 옆 미리보기가 없어 `.v2-form-shell`(1048px) 대신 모달 폼과 같은 560px로 직접 캡(규칙 21의 폼 모달 폭과 통일). 필수(성함·허위개설 동의)는 `.v2-req`, 선택(사망일·추모문구)은 `.v2-opt`. 오류는 브라우저 기본 검증 대신 칸별 `.v2-error-text` + 폼 위 요약 한 줄(`확인이 필요한 항목이 N개 있습니다`) + 첫 오류 칸 포커스(규칙 17). 제출 버튼은 상태를 글자로 말한다(`만드는 중…`, 규칙 19).
  3. **삭제 확인** — `window.confirm` 제거, `WithdrawalModal.tsx`의 단계형 확인 패턴을 빌려 목록 행 클릭 → 상세 모달(`modalStep: 'detail'`, 열기·주소복사·삭제) → 삭제 버튼 → 같은 모달 안에서 `confirm-delete` 단계(사실만 진술, 해설 없음)로 전환 → 커밋 버튼만 `.v2-btn-solid`(urgent 빨강), 나머지는 `.v2-btn-outline`. 삭제 진행 중에는 배경 클릭으로 안 닫히게 `closeModal`에서 `deletingId` 가드.
  4. 옛 토큰(`--primary-color`·`--point-color`·`--card-bg`·`--secondary-color`·`--text-muted`·`--fs-*`·`--sp-*` 등) 전량 제거, `page-title`/`page-subtitle` 클래스도 `.v2-page-title`/`.v2-page-subtitle`로 교체. 장식 배지("온라인 추모 공간")와 제목 아이콘은 뺐다 — my-obituaries·counseling 등 이미 이관된 그룹① 화면 어디에도 그런 배지가 없어 규칙 5(긴급도 배지 금지)와 같은 결로 판단.
  5. 기능은 그대로: 만들기(POST /api/memorials)·삭제(DELETE, 소프트)·주소복사(copyObituaryLink)·공개범위 3종. 백엔드 변경 없음.
  6. 검증: `npx tsc --noEmit -p .`·`npm run build`(frontend) 통과. dev 서버는 기동 확인만(응답 200 미확인 — HTTPS 자체서명 인증서로 curl 실패, 즉시 kill) 하고 렌더 스크린샷 대조는 안 했다 — 사람 실기동 확인 정책(dev 서버는 사람이 직접 확인) 때문에 여기서 멈춤.
  7. **사람 피드백 반영(같은 날)** — ⓐ "새 추모관 만들기" 버튼을 좌측 정렬에서 우측 정렬로(감싸는 `flex`+`justify-content: flex-end`). ⓑ 부제 "조문객이 온라인으로 헌화·방명록을 남길 수 있는 공간입니다. 부고장과 별개로 여기서 직접 만들고 지웁니다."가 *"AI가 만든 md파일 내용 같다"*는 지적 — 두 번째 문장(부고장과의 내부 분리 로직 설명, 사용자에게 불필요)을 통째로 빼고 "조문객이 헌화·방명록을 남길 수 있는 추모 공간입니다."로 축약([[feedback_no_ai_tone_ui_copy]] 09-22 추가 지적과 같은 신호 — 화면 문구에 내부 설계 이유를 옮기지 않는다).
- **편차**:
  - 🔴 **만들기 폼을 모달이 아니라 인라인으로 유지**했다. 규칙 21("수정은 새 화면이 아니라 모달")은 문언상 *수정*에 대한 것이고 *만들기*는 명시가 없어, 기존 UX(목록 위 인라인 확장 카드)를 유지하는 쪽으로 판단했다 — 사람이 다른 판단을 하면 `.v2-modal.is-form`(560px)로 옮기면 된다.
  - 삭제 확인 문구가 §6.4 규칙 10(안내 모달은 세 줄: 제목·기한·근거)을 문자 그대로 따르지 않는다 — §6.4는 법정기한 안내 모달용이라 확인/취소 모달에는 기계적으로 안 맞았고, 대신 규칙 11(해설·조언 없이 사실만)의 정신만 가져와 결과(링크 무효화)와 남는 것(방명록·헌화)만 진술했다.
- **다음 에이전트가 알아야 할 것**:
  1. 00-39 §9.1 표(465·471·473행)가 아직 "🟡 memorial 남음"으로 돼 있다 — Opus가 이 완료를 반영해야 함(Sonnet은 docs/ 쓰기 금지).
  2. `memorial` 완료로 그룹① 4개(care-guide·counseling·pickup·my-obituaries) + facility + memorial = 전부 v2 이관 완료. 남은 그룹은 ②(ending-note·farewell-messages 미착수)·③·④·⑤·⑥(보류).
  3. 사람 실기동 검증 대기(만들기 폼 제출 흐름·삭제 2단계 모달 실제 클릭 확인 안 됨).

<!-- Gemini 판정 1줄: 대기 -->

## 2026-09-22 | [Sonnet] 사람 직접 지시 4건 — 사이드바 배지 제거·검색창 통일·04-01 §0.2-0 카드 문구·memorial 아이콘

- **근거 스펙**: docs/04_디지털_자산_정산/04-01_디지털_계정_정리_명세서.md §0.2-0(2026-09-22 개발자 승인 — STEP1 카드 화면 문구 확정 표) · 사람 직접 지시 3건(사이드바 배지·검색창 통일·버튼 아이콘, 문서 근거 없음).
- **건드린 파일**: eobomDev/frontend/src/lib/modeNav.ts, eobomDev/frontend/src/pages/DigitalEstatePage.tsx, eobomDev/frontend/src/pages/FacilityPage.tsx, eobomDev/frontend/src/pages/PickupPage.tsx, eobomDev/frontend/src/pages/MemorialPage.tsx. 신규: eobomDev/frontend/src/components/LocationSearchBox.tsx.
- **결과**:
  1. **사이드바 "준비 중" 배지 제거** — `modeNav.ts`의 `pickup`·`digital-estate` `status`를 `'preview'` → `'active'`로. 둘 다 로그인·API 없이 정적 콘텐츠(vendors 목업·계정 찾기 안내)로 완결돼 있어 wt131·wt135(ending-note·memorial)와 같은 조치.
  2. **facility 검색창 기준으로 pickup 검색창 통일 + 모듈화**(사람 지시) — `LocationSearchBox.tsx` 신설. FacilityPage가 §8 #5로 그대로 두던 옛 `.form-select`/`.form-input`/`.form-label`/`.btn.btn-primary` 박스(배경·테두리·그림자 있는 카드, "위치: X" 헤딩+MapPin 아이콘, 기본값 배지, 시/도·시/군/구 셀렉트, 라벨 붙은 검색어 입력, 검색 버튼)를 그대로 컴포넌트로 뽑아 양쪽 페이지가 재사용한다. facility는 `구분`(카테고리) 셀렉트를 `extraField`로 끼워 넣고, pickup은 생략. PickupPage가 쓰던 `.v2-filter-row`/`.v2-select`/`.v2-input`/`.v2-btn-primary`와 별도의 "📍 현재 위치" 줄(`.v2-location-line`)은 걷어내고 이 박스 하나로 합쳤다.
  3. **04-01 §0.2-0 구현** — `DigitalEstatePage.tsx`의 `DISCOVERY_STEPS` 카드 3장(기관 줄·웹 설명·모바일 설명·3번 카드 제목)을 §0.2-0 표 그대로 교체. `DiscoveryStep`에 `deadlineLabel` 필드를 추가해 아래 줄 라벨을 카드마다 다르게(신청 기한 / 결과 확인 / 처리 기간, 고정 "기한" 제거). 3번 카드의 옛 `provider`("1-B에서 확인된 카드사에 개별 청구")가 화면에 내부 번호 `1-B`를 그대로 노출하고 있던 것을 발견해 표대로 `"각 카드사"`로 고쳤다(§0.2-0 규칙 ① 위반 수정). `step.id`(`1-A`·`1-B`·`1-B-1`)는 React `key`로만 쓰이고 화면에는 안 나가는 것을 확인.
  4. **MemorialPage "새 추모관 만들기" 버튼에 `Plus` 아이콘 추가**(사람 지시 — 원래 코드에 있던 아이콘을 v2 재작성 때 뺐던 것 복원, ObituaryPage.tsx "새 부고장 작성하기"와 같은 패턴).
  5. 검증: `npx tsc --noEmit -p .`·`npm run build`(frontend) 매 단계 통과.
- **편차**:
  - 🔴 **`LocationSearchBox`가 00-39 §9.1 흐름과 반대 방향이다.** 그룹①(facility·pickup 포함)은 옛 클래스 → `.v2-*` 클래스로 이관하는 게 지금까지 방향이었는데, 이번 지시는 반대로 pickup을 facility의 옛 `.form-select`/`.form-input`/`.btn` 스타일로 되돌렸다. 사람이 이 화면에 한해 직접 지시한 것이라 그대로 구현했다 — `00-39` §6.7 클래스 표에 이 역행이 반영돼야 하는지는 Opus 판단 필요.
- **다음 에이전트가 알아야 할 것**:
  1. `LocationSearchBox`는 현재 facility·pickup 2곳에서만 쓴다. 다른 위치 검색 화면이 생기면 이 컴포넌트를 먼저 확인할 것.
  2. 04-01 §0.2-1(사실 오류 3건)은 이미 이전 세션에서 코드에 반영돼 있었다(주석에 "2026-09-22 §0.2-1 정정" 기존 존재) — 이번엔 §0.2-0(화면 문구) 부분만 새로 했다.
  3. 사람 실기동 검증 대기 — 사이드바 배지 제거·검색창 두 화면·04-01 카드 3장 실제 렌더 확인 안 됨.

<!-- Gemini 판정 1줄: 대기 -->
