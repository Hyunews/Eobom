# 🧭 walkthrough.md — 구현 완료 보고 (Gemini ↔ Claude 교차 검토용)

> `claude_tasks.md`(살아있는 실무 로그)에서 완료된 사이클만 추려 정제한 문서.
> Gemini가 "기획대로 구현됐는지" 확인하는 용도. 최신 항목이 위로 오게 기록.
> 2026-08-07부터 5개 필드 고정 형식 사용 (`.harness/record.md` §1. 2026-08-10 이전엔 `roles.md` §3에 있었음).


> 🔴 **2026-09-02 — 판정이 끝난 옛 항목은 아카이브로 옮겼습니다.**
> [`walkthrough_아카이브_2608.md`](walkthrough_아카이브_2608.md)
> **아직 판정이 안 난 항목은 옮기지 않습니다** — 게이트는 이 파일 한 곳입니다(`AGENTS.md` §2).
> 아카이브 기준 = *판정 완료 && 최근 12건 밖*. 근거 → `.harness/_meta/크레딧_소모_실측_260902.md`

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

## 2026-08-31 (89) | [Sonnet] 04-01 §8 0단계·0-b단계 — 비밀번호 placeholder 확인 + 계정 찾기 정적 화면

- **근거 스펙**: `docs/04_디지털_자산_정산/04-01_디지털_계정_정리_명세서.md` §0.2(STEP 0·1)
  · §0.6(기한 라벨) · §8(구현 순서 0·0-b) · §8.1(금지 5개). 보조:
  `04-03_고인_계정_접근범위_및_계정_발견_조사서.md`(KISO §28①·§28② 인용, 원스톱 1년 기한·
  금감원 조회 20일/3개월 확정값).
- **건드린 파일**: `eobom/frontend/src/pages/DigitalEstatePage.tsx`만.
- **결과**:
  - **0단계(비밀번호 placeholder)**: `EndingNotePage.tsx:185`는 이미 변경 없이 안전한 상태 —
    지시문이 가리킨 원문(`06-04` §6.3 인용: *"OO은행 비상 예금 계좌 및 유품 정리 마스터
    암호는…"*)은 이번 세션 이전 커밋 `eb1db97`("엔딩노트 아코디언 전환 + Phase 1 저장")에서
    이미 통째로 삭제됐다. `git log -p -- eobom/frontend/src/pages/EndingNotePage.tsx`로 삭제
    시점 확인. 현재 856행 placeholder는
    `"...비밀번호는 적지 마세요 — 유족이 서류로 조회할 수 있습니다."`로 이미 소재 안내형.
    → **코드 변경 없음.**
  - **0-b단계**: `DigitalEstatePage.tsx`에 `AccountDiscoveryGuide` 컴포넌트 신설, 기존 레거시
    카탈로그(업로드·"정산 신청" 목업) 블록 바로 위에 삽입. STEP 0 고지 3줄(비밀번호 불가 —
    KISO §28①, 받을 수 있는 것 — KISO §28②, 사망 사실 미자동통지) 항상 노출. STEP 1 카드
    정확히 2개만: 1-A 안심상속 원스톱(`https://www.gov.kr/portal/onestopSvc/safeInheritance`,
    기한 라벨 "사망하신 달의 말일부터 1년 안에"), 1-B 상속인 금융거래조회(
    `https://www.fss.or.kr/fss/cvpl/inhCerEc/main.do?menuNo=200010`, "조회 결과 확인 20일
    이내 · 결과 보관 3개월"). 1-C·사망일 입력칸·D+N 표기 없음. 두 URL은 `WebSearch`로
    사전 검증 후 삽입(추측 금지 원칙).
  - `npx tsc --noEmit`(frontend) 에러 0.
  - **실동작 확인**: 사용자가 이미 띄워둔 `localhost:5173` dev 서버에 `/digital-estate`
    실제 접속(claude-in-chrome) — STEP 0 3줄·STEP 1 카드 2개 스크린샷으로 렌더 확인.
    `javascript_tool`로 `a[target="_blank"]` href 3개 중 앞 2개가 위 URL과 정확히 일치함을
    직접 확인. `read_console_messages`에서 에러 0건.
- **편차**: 없음. 단, "화면 문구에 정산을 쓰지 말 것"은 **신규로 추가한 `AccountDiscoveryGuide`
  섹션에만** 적용했다 — 그 아래 기존 레거시 카탈로그(제목 "디지털 정산", 배지 "SNS / 클라우드
  계정 정산" 등)는 손대지 않았다. 전면 개편은 `04-01` §8의 별도 단계(Step 5)로 이미 분리돼
  있어, 이번 스코프(0·0-b) 밖이라 판단 — 코드에 그 경계를 밝히는 주석을 남겼다.
- **다음 에이전트가 알아야 할 것**:
  - `DigitalEstatePage.tsx`는 지금 "정적 계정 찾기 가이드"(신규, "정산" 미사용) +
    "레거시 정산 목업 카탈로그"(구, "정산" 문구·OCR 검증 표기·업로드 유도 그대로) 두 블록이
    한 페이지에 공존하는 과도기 상태다. Step 5(전면 개편)가 오면 아래 레거시 블록을
    "디지털 계정 정리"/"구독·결제 정리" 명칭 체계로 교체해야 한다.
  - 1-C(정보주체 권리행사)는 `04-03` §6-1 확인(사망자 대행 가능 여부) 전까지 만들지 않는다 —
    `context.md`에 이미 열려있는 "04 확인 1건"이 그 확인 항목.

<!-- Gemini 판정: ✅통과 (04-01 §0.2·§8·§8.1 기준 전수 일치: 0단계 EndingNotePage 비밀번호 미수집 placeholder 확인 완료, 0-b단계 AccountDiscoveryGuide STEP 0 고지 3줄(KISO 조문 포함)·STEP 1 카드 2개(안심상속 1년/금감원 20일·3개월)·1-C 미노출·사망일 입력칸 없음·신규 섹션 내 "정산" 미사용 확인, tsc 0건) -->

## 2026-08-28 (88) | [Sonnet] Footer 고객센터 → 카카오톡 채널 전환 (07-02 §5.4 G단계)

- **근거 스펙**: `docs/07_상중_행정_케어/07-02_사망후_법정기한_체크리스트_명세서.md` §5.4-1
  ("확정 배치" 목업) · §5.4-2-2(채널 URL·응답시간 확정값).
- **건드린 파일**: `eobom/frontend/src/components/Footer.tsx` — 열 3(고객센터) 재구성.
  - `lucide-react` import에 `MessageCircle` 추가.
  - 89-92행 주석 갱신 — *"응답 가능 시간은 아직 사장님 확정 전"* (더 이상 사실 아님) →
    §5.4-1 근거로 교체.
  - "고객 문의" 블록 신설(열 3 상단): `<MessageCircle>` + 제목, `<a href="https://pf.kakao.com
    /_LVxdxaX/chat" target="_blank" rel="noopener noreferrer">` 버튼(배경 `#FEE500`/글자
    `#191919` — `LoginModal.tsx`·`KakaoMapModal.tsx`·`FacilityPage.tsx`의 기존 카카오 브랜드
    색 관례를 따름, 높이는 `var(--min-touch-target)`=56px로 `00-09` §2.3 접근성 토큰 준수),
    라벨 `💬 카카오톡으로 문의하기`, 아래 `평일 09:00 ~ 17:00`.
  - 기존 전화 블록(열 3 하단): 제목 `고객센터` → `대표번호`. 번호 `070-8856-2725` 그대로.
    설명문 `"장사시설·장례 절차 관련 문의는 전화로 안내해드립니다."` →
    `"사업장·전문가 문의 · 개인정보 열람·삭제 요청"`(가운뎃점 구분 유지).
- **결과**:
  - `npx tsc --noEmit`(frontend) 에러 0. `npm run build` 통과(`vite build` — 1522 모듈,
    dist 정상 생성).
  - **실동작 확인**: 사용자가 이미 띄워둔 `localhost:5173` dev 서버가 응답하지 않아(원인 불명 —
    HTTP 요청이 매번 "연결이 예기치 않게 닫힘"으로 실패, walkthrough(87)의 EPERM과는 무관해
    보임) 별도로 `npm run build` + `npx vite preview --port 4174`(HTTPS, self-signed)를
    띄워 검증 후 그 프로세스만 명시적으로 종료(`Stop-Process`, 사용자의 5173 dev 서버는
    건드리지 않음). claude-in-chrome으로 `/terms` 페이지 최하단 Footer 확인 —
    데스크톱(1568px)·모바일(375px, iframe 주입) 둘 다 "고객 문의"(노란 카카오 버튼 + 평일
    09:00~17:00) → "대표번호"(070-8856-2725 + 새 설명문) 순으로 정상 스택. 버튼
    `href` 속성이 `https://pf.kakao.com/_LVxdxaX/chat`(HTTPS, `/chat`)임을 `read_page`로
    직접 확인.
- **편차**: 없음. 지시받은 두 변경(카톡 블록 신설 + 전화 블록 문구 교체)을 한 커밋 대상으로
  묶었다(지시 원칙 그대로 — 따로 하면 그 사이 화면이 거짓말을 함).
- **다음 에이전트가 알아야 할 것**:
  - `Footer`가 렌더되는 다른 페이지(홈 등 fullpage-snap 레이아웃)에서는 스크롤 스냅 때문에
    이번 검증에 쓴 `/terms` 방식(일반 스크롤)과 확인 경로가 다를 수 있다 — 이번엔 `/terms`
    한 곳만 실측했다.
  - 사용자의 원래 `localhost:5173` dev 서버가 요청마다 연결이 끊기는 상태였다 — 이번 작업과
    무관해 보이지만(별도 포트로 우회해서 검증 완료) 다음 세션에서 그 창을 계속 쓰려면 한 번
    확인이 필요할 수 있다.
  - `00-19` 제12조 이메일(`yhw@samil25.co.kr`) 노출 여부는 스펙 §5.4-2-2 원문에서도
    "이번 G단계 범위 밖"으로 명시적으로 남겨둔 별건 — 이번에 추가하지 않았다.

<!-- Gemini 판정: ✅통과 (카카오톡 버튼 href 'https://pf.kakao.com/_LVxdxaX/chat'(/chat) 및 안내시간 '평일 09:00 ~ 17:00' 확인 / '상담' 대신 '고객 문의'·'💬 카카오톡으로 문의하기' 명시 확인 / 대표번호 '070-8856-2725' 보존 및 '사업장·전문가 문의 · 개인정보 열람·삭제 요청' 분리 확인 / npx tsc --noEmit 및 npm run build 통과) -->

---

## 2026-08-28 (87) | [Sonnet] 추모관 보존기간·동결 필드(expiresAt·frozenAt·purgeAt) + 만료 통지 계산 + 동결 가드

- **근거 스펙**: `docs/00_핵심플랫폼/00-20_추모관_보존기간_및_폐쇄정책_검토서.md` §8.1, §8.1-2
  (08-28 확정분) · `docs/00_핵심플랫폼/00-22_법적_요구사항_체크리스트.md` E-9.
- **건드린 파일**:
  - `eobom/backend/prisma/schema.prisma` — `Memorial`에 `expiresAt`·`frozenAt`·`purgeAt`
    (전부 `DateTime?`) 3필드 추가.
  - `eobom/backend/prisma/migrations/20260828011414_memorial_lifecycle_fields/` — 신규 마이그레이션
    (`ALTER TABLE "Memorial" ADD COLUMN expiresAt/frozenAt/purgeAt`, 전부 nullable 추가라 기존 행
    무영향).
  - `eobom/backend/src/config/policy.ts` — `POLICY.memorial.activeDays = 395`
    (`MEMORIAL_ACTIVE_DAYS`) · `POLICY.memorial.noticeAfterAnniversaryDays = 7`
    (`MEMORIAL_NOTICE_AFTER_ANNIVERSARY_DAYS`) 추가, `00-21` 제15조와 같은 값임을 주석으로 묶음.
  - `eobom/backend/src/utils/memorialLifecycle.ts` (신규) — `calculateMemorialExpiresAt(from)`
    (from + 395일), `calculateMemorialNoticeDate(memorial, expiresAt)`(deceasedDeathDate 있으면
    +372일, 없으면 createdAt+368일 + 가드①②) 순수 함수 2개.
  - `eobom/backend/src/controllers/memorialController.ts` — `createMemorial`에서 개설 시
    `expiresAt = calculateMemorialExpiresAt(openedAt)` 설정. `isMemorialFrozen()` 헬퍼 추가 후
    `createTribute`·`createGuestbookEntry`·`addMemorialPhoto`(업로드된 파일 `fs.unlink` 포함)
    3개 쓰기 경로 전부에 `frozenAt` 가드(403) 삽입. `deleteGuestbookEntry`·`deleteMemorialPhoto`는
    건드리지 않음(§5.1 — 동결은 삭제를 막지 않음).
- **결과**:
  - `npx tsc --noEmit`(backend) 에러 0.
  - **DB 쓰기 전 백업**: `powershell -File .harness/tools/backup-db.ps1` →
    `eobom/backend/backups/prod-20260828-101348.dump`(460.7KB) 생성 확인 후 `npx prisma migrate dev
    --name memorial_lifecycle_fields`로 로컬 DB(5433)에 적용.
  - `node .harness/tools/generate-db-doc.js` 실행 → `00-05` 자동생성 구간에 3필드 반영 확인.
  - **실동작 검증**(1회성 스크립트, 로컬 DB 대상, 실행 후 파일은 삭제·DB 행은 보존):
    계산 함수 5케이스(395일 만료·372/368일 통지·가드①구조상 미발동 확인·가드② 발동 시
    `expiresAt-14일`로 당겨짐) 전부 PASS. 컨트롤러 함수를 mock req/res로 직접 호출해
    `createTribute`·`createGuestbookEntry`를 동결 추모관(403)·활성 추모관(201) 양쪽에서 검증,
    동결 추모관에 실제로 0건 저장됐음을 `count()`로 재확인 — 전부 PASS.
  - `addMemorialPhoto`는 multer 미들웨어 때문에 mock으로 재현하지 않고 코드 리뷰로만 확인 —
    동일한 `isMemorialFrozen()` 헬퍼를 동일 위치(소유권 체크 직후)에 적용해 나머지 2개 경로와
    구조가 같다.
- **편차**: 없음. §8.1-2 표의 "expiresAt 계산 | 개설 시 createdAt + 395일"까지 포함해 그대로
  구현 — §8.1-2 자체가 "상수 2개뿐"이라 부른 이유는 필드 3개가 이미 §8.1에서 정의돼 있었기
  때문이고, 계산 로직·가드는 §8.1-2 표에 있던 범위 그대로다.
- **다음 에이전트가 알아야 할 것**:
  - `prisma generate`의 네이티브 엔진 바이너리 교체가 `EPERM`으로 실패했다(다른 프로세스가
    `query_engine-windows.dll.node`를 잠근 것으로 추정 — 아마 실행 중이던 백엔드 dev 서버).
    TS 타입(`index.d.ts`)은 정상 갱신됐고 검증 스크립트도 기존 엔진 바이너리로 문제없이
    동작했다 — 기능 블로커는 아니지만, 다음에 dev 서버를 잠깐 멈추고 `npx prisma generate`를
    한 번 더 돌려 바이너리를 깨끗하게 맞춰두는 게 좋다.
  - **`calculateMemorialNoticeDate`의 결과값은 아직 어디에도 저장되지 않는다** — Memorial에
    별도 "통지 예정일" 필드가 없다(스펙에도 없음, `expiresAt`·`frozenAt`·`purgeAt` 3개뿐). 실제
    발송 배치는 이번 범위 밖(`00-20` §8.1-1의 `purgeAt` 배치·파기 전 재확인 통지·폐쇄 유예도
    전부 범위 밖) — `00-22` E-9의 "소프트 삭제 3종 파기 배치"도 미착수.
  - `frozenAt`을 세우는 쪽(동결 배치 자체)도 이번 범위 밖 — 지금은 가드만 있고, 실제로
    `frozenAt`을 채우는 배치job은 아직 없다.
  - 로컬 DB에 테스트 행이 남아있다(`db-safety.md` §4 — 지우지 않음): `Deceased` 1건
    (`TEST_00-20_검증`), `Memorial` 2건(slug `test-00-20-frozen-*`, `test-00-20-active-*`,
    각각 헌화 1건·방명록 1건 포함). `context.md` 배치정리 목록에 추가함.

<!-- Gemini 판정: ✅통과 (frozenAt 가드 3개 쓰기 경로(createTribute·createGuestbookEntry·addMemorialPhoto) 403 차단 및 multer unlink 확인 / calculateMemorialExpiresAt(395일)·calculateMemorialNoticeDate(사망일+372일·개설일+368일·가드①②) §5.2-2 공식 일치 / deleteGuestbookEntry·deleteMemorialPhoto 삭제 유지(§5.1) 확인 / npx tsc --noEmit 백엔드 에러 0 재현) -->

---

## 2026-08-28 (86) | [Sonnet] "한눈에 보기" 위치 수정 + 목차 스크롤 시 헤더 겹침 수정

- **근거 스펙**: 스펙 없음 — walkthrough(85) 직후 사용자 직접 지시 2건: ①"한눈에 보기"를 목차
  박스 최하단으로 이동 ②목차 클릭 시 제목이 최상단에 와야 하는데 박스(고정 헤더)가 위에 있음.
- **건드린 파일**:
  - `eobom/frontend/src/pages/EndingNotePage.tsx` — "한눈에 보기" 버튼을 페이지 헤더 블록에서
    제거하고 `.ending-note-toc` 목차 `<nav>` 아래(구분선 wrapper div 안)로 이동. `consentRef`
    div에 `id="ending-note-consent"` 추가(스크롤 오프셋 CSS 타겟용).
  - `eobom/frontend/src/index.css` — `#ending-note-consent, [id^="ending-note-section-"]`에
    `scroll-margin-top: var(--header-h)` 추가.
- **결과**:
  - `npx tsc --noEmit`·`npm run build` 통과.
  - **claude-in-chrome 실브라우저 재검증**: 844px 뷰포트(현재 세션 창 실측 폭)는 900px 미만이라
    목차 자체가 안 보여, 950px `<iframe>`을 주입해 데스크톱 레이아웃을 재현 → 목차 리스트 아래
    구분선 + "한눈에 보기" 버튼이 정확히 최하단에 배치됨을 스크린샷으로 확인 → 목차에서 "중요
    연락처·반려동물"(아래쪽 항목) 클릭 → 해당 아코디언 헤더가 고정 헤더(85px) 바로 아래,
    뷰포트 최상단에 가려짐 없이 노출됨을 확인(수정 전이었다면 헤더에 가려 제목 일부가 안
    보였을 지점).
- **편차**: **원 지시(walkthrough 85 작업 지시문)의 "🔴 목차 아래에 두지 말 것" 문구와 정면으로
  반대되는 이번 지시를 그대로 따랐다.** 원래 이유는 "목차는 데스크톱 전용, 모바일은 CSS로
  숨겨서 버튼이 모바일에서 사라진다"였고, 이번 배치 변경으로 **그 우려가 실제로 발생한다** —
  버튼이 이제 모바일(900px 미만)에서 보이지 않는다. 이번 지시가 그 트레이드오프를 알고 낸
  것인지 확인이 필요해 사용자에게 별도로 알렸다(대화 응답 참고). `docs/`는 고치지 않았다.
- **다음 에이전트가 알아야 할 것**:
  - "한눈에 보기" 버튼은 이제 **데스크톱에서만** 보인다(900px 미만에서 `.ending-note-toc`째로
    숨겨짐). 모바일에도 노출이 필요하다는 지시가 다시 오면 별도 진입점을 새로 만들어야 한다
    (목차 안에 있는 한 모바일에는 원리적으로 못 들어간다).
  - `scroll-margin-top` 수정은 아코디언 8개+⑨(WILL_DRAFT)+동의 배너 3종 스크롤 타겟 전부에
    적용됐다 — 앞으로 `id`가 `ending-note-section-`으로 시작하는 새 스크롤 타겟을 추가하면
    자동으로 같은 오프셋을 받는다.

<!-- Gemini 판정: ✅통과 (사용자 지시 수용: 한눈에 보기 버튼 목차 최하단 배치, scroll-margin-top: var(--header-h) 헤더 겹침 해결 확인, 모바일 900px 미만 미노출 트레이드오프 사용자 확인 완료) -->

---

## 2026-08-28 (85) | [Sonnet] 엔딩노트 "한눈에 보기" 요약 모달

- **근거 스펙**: 스펙 없음 — 사용자 직접 지시(작업 지시문 전문에 배치·구성·데이터 소스·모달
  구현·완료조건까지 상세히 명시됨). 참조 문서로 `docs/06_엔딩노트_유언/06-04_...기획서.md`
  §6.1-1(아코디언)·§10 Phase 1·2와 `docs/00_핵심플랫폼/00-09_디자인_시스템_및_스타일_가이드.md`
  §2.3(시니어 접근성 토큰 — `--base-font-size:18px`·`--min-touch-target:56px`·`line-height:1.7`)를
  지정받음.
- **건드린 파일**:
  - `eobom/frontend/src/pages/EndingNotePage.tsx` — `SummaryModal`(모듈 최상위 컴포넌트, 목록
    새로 정의) 신설, `summarizeFreeText`(자유서술 1~2줄 요약 헬퍼) 신설, `summaryRows`
    (`useMemo`, `sectionState`·`grants`·각 필드 state로부터 계산, 새 API 없음), `sectionTimingBadge`
    헬퍼, `handleSummaryRowSelect`(모달 닫고 `openSectionFromToc`/`scrollToWillDraft` 재사용),
    ESC+body 스크롤 잠금+포커스 복귀 `useEffect`, 트리거 버튼(페이지 헤더 안, 목차 밖).
  - `eobom/frontend/src/index.css` — `.ending-note-summary-overlay`/`-panel` 신설(LoginModal과
    같은 오버레이 언어 재사용), `@media (max-width: 640px)`에서 전체화면 시트로 전환.
- **결과**:
  - `npx tsc --noEmit`·`npm run build`(tsc+vite) 통과.
  - **claude-in-chrome으로 실제 브라우저 검증**(로컬 dev 서버, 데모 카카오 로그인 후
    `/ending-note` 실사용): 로그인 직후 빈 상태 문구("아직 작성하신 항목이 없습니다…") + 9행
    전부 미작성 배지 확인 → ⑨(유언장 초안) 행이 "본인 전용 — 내용은 여기 표시되지 않습니다"만
    보이고 실제 텍스트는 없음을 확인 → 행 클릭 시 모달이 닫히고 해당 아코디언이 펼쳐지며
    스크롤됨(`openSectionFromToc` 재사용 확인) → ② 장례 희망을 실제로 저장(`PUT
    /api/ending-note/sections/FUNERAL` 200) 후 모달 재오픈 → 해당 행만 "작성함"(초록 배지)+
    선택값("가족장 (수목장)")이 보이고 빈 상태 문구는 사라짐을 확인 → iframe 375px 폭으로
    모바일 뷰포트 재현 → 좌측 목차(데스크톱 전용)는 사라지고 "한눈에 보기" 버튼은 그대로
    노출, 가로 스크롤 없음, 모달이 중앙 팝업 대신 **전체화면 시트**로 전환됨을 스크린샷으로 확인.
  - 완료 조건 3가지(tsc 통과·데스크톱/375px 버튼·모달 확인·이 walkthrough 기록) 전부 충족.
- **편차**: 없음 — 지시된 배치·데이터 소스·재사용 대상(`openSectionFromToc`)·금지사항(새 API
  없음, `docs/` 미수정, `alert()`/`confirm()` 미사용, 아코디언 로직 무변경)을 전부 그대로 따름.
- **다음 에이전트가 알아야 할 것**:
  - 검증 중 로컬 dev DB의 카카오 데모 계정(`d3718f3e-201b-43dc-bc4b-4a9b938d2cd6`)에 실제로
    `EndingNoteEntry`(FUNERAL, "가족장 (수목장)")와 `policyAgreedAt`이 저장됐다. **삭제하지
    않았다** — `db-safety.md` §4(테스트 데이터는 지우지 않고 남긴다) 적용, 배치 정리 대상으로 남김.
  - 검증에 쓴 임시 백엔드 서버(`node dist/server.js`)는 종료했고 로그 파일도 정리했다 — 이건
    내가 만든 스크래치 산출물이라 `db-safety.md` §4 대상이 아니다(그 규칙은 제품 DB 상태 얘기).
  - `SummaryModal`의 공개 시점 배지 로직은 "섹션에 IMMEDIATE grant가 하나라도 있으면 대표로
    보여준다"는 단순화다 — 가족별로 시점이 다를 수 있는 세부는 아코디언 안
    `SectionTimingControl`에서만 보인다. 요약 모달에서 가족별 세부까지 보여달라는 요청이 오면
    이 배지를 확장해야 한다.
  - claude-in-chrome `computer:screenshot`이 클릭 직후 30초 타임아웃 나는 경우가 잦았다(원인
    불명, 페이지 프리즈는 아니었음 — 2~3초 대기 후 재시도하면 항상 성공). `browser_batch` 안에서
    클릭→즉시 스크린샷을 묶지 말고 클릭→wait→스크린샷으로 나누는 편이 안정적이었다. 또한
    `resize_window`가 이 세션의 Chrome 창이 최소화 상태(`screenLeft/Top: -32000`)라 계속
    실패했다 — 대신 `<iframe width:375px>` 주입(과거 walkthrough의 390px iframe 트릭과 같은
    기법)으로 모바일 뷰포트를 재현했다.

<!-- Gemini 판정: ✅통과 (SummaryModal 신설, summarizeFreeText 요약 헬퍼 및 9개 행 연동, 375px 모바일 전체화면 시트 전환, openSectionFromToc 재사용 및 tsc/build 통과 확인) -->

---

## 2026-08-27 (84) | [Sonnet] 모바일 햄버거 메뉴 "계정 연동" 버튼 잔존 제거

- **근거 스펙**: 스펙 없음 — 사용자 직접 지시("모바일 화면에서 햄버거 메뉴의 계정연동 버튼 아직
  살아있음. 삭제요망"). `Header.tsx:134`의 2026-08-25 기존 결정("계정 연동" 버튼은 헤더에서
  제거하고 마이페이지 전용으로 정리 — `MyPage.tsx`가 이미 같은 트리거를 가짐)을 근거로 삼아,
  그날 `Sidebar.tsx` 모바일 드로어 쪽에 반영이 빠졌던 것으로 판단하고 같은 정리를 적용했다.
- **건드린 파일**:
  - `eobom/frontend/src/components/Sidebar.tsx` — `SidebarProps.onOpenAccountSettings` 제거,
    모바일 드로어 하단의 "계정 연동" 버튼 블록 삭제(로그아웃 버튼만 남김), 이제 안 쓰는
    `Settings` 아이콘 import 제거.
  - `eobom/frontend/src/App.tsx` — `<Sidebar onOpenAccountSettings={...} />` prop 제거(더 이상
    받는 쪽이 없음). `MyPage`에 넘기는 동일 이름의 prop(444행 부근)은 그대로 유지 — 마이페이지
    쪽 "계정 연동" 진입점은 이번 지시 대상이 아니다.
- **결과**: `npx tsc --noEmit`·`npm run build`(tsc+vite) 통과. 모바일 드로어를 열면 이제
  "로그아웃"만 보이고 "계정 연동"은 어디에도 없음(코드 제거로 확인 — grep `계정 연동`
  `Sidebar.tsx` 0건).
- **편차**: 없음.
- **다음 에이전트가 알아야 할 것**: "계정 연동" 자체는 삭제된 기능이 아니다 — 마이페이지
  (`MyPage.tsx:178`)에서는 여전히 정상 진입 가능하다. 이번엔 **중복 진입점(모바일 드로어)**만
  걷어냈다.

<!-- Gemini 판정: ✅통과 (Sidebar.tsx 모바일 드로어 내 중복 계정 연동 버튼 제거, MyPage 진입점 유지 및 tsc 0건 확인) -->

---

## 2026-08-27 (83) | [Sonnet] 엔딩노트 Phase 2 — EndingNoteGrant + 섹션별 공개시점 UI + 가족 조회 API

- **근거 스펙**: `docs/06_엔딩노트_유언/06-04_엔딩노트_보관함_실구현_기획서.md` §10 Phase 2(항목
  5·6·7)·§7.1(3단 매트릭스)·§7.4(격리 3층)·§13 #1(응급 열람 Phase 3 연기)·§13 #5(즉시 공유는
  ②⑦만). 사용자 직접 지시 — "범위: EndingNoteGrant 모델 신설 + 섹션별 공개시점 UI + 가족 조회 API."
- **건드린 파일**:
  - `eobom/backend/prisma/schema.prisma` — `EndingNoteGrant` 모델 신설(`noteId`+`designationId`+
    `section` unique, `timing`·`revokedAt`), `EndingNote.grants`·`FamilyDesignation.endingNoteGrants`
    역방향 관계 추가. 마이그레이션 `20260827055937_ending_note_grant_phase2`(CREATE TABLE만).
  - `eobom/backend/src/controllers/endingNoteController.ts` — `SECTION_ALLOWED_TIMINGS`(§7.1+§13#5
    정책 맵) 신설, `listEndingNoteGrants`·`upsertEndingNoteGrant`·`revokeEndingNoteGrant`·
    `getFamilyVisibleEndingNotes` 4개 함수 추가.
  - `eobom/backend/src/routes/endingNoteRoutes.ts` — `GET/PUT /grants`·`PATCH /grants/:id/revoke`·
    `GET /family-view` 라우트 추가.
  - `eobom/frontend/src/pages/EndingNotePage.tsx` — `SectionTimingControl`(모듈 최상위, 재마운트
    버그 재발 방지 원칙 동일 적용) 신설해 ①②④⑤⑥⑦⑧⑩ 8개 섹션 각각에 배선, `family`·`grants`
    state + fetch 추가, 가족 0명일 때 안내 배너(`onOpenFamilyDesignation` 진입점).
  - `eobom/frontend/src/App.tsx` — `/ending-note` 라우트에 `onOpenFamilyDesignation` prop 연결
    (`FarewellMessagePage`와 동일 패턴).
  - `docs/00_핵심플랫폼/00-05_DB_요구사항_및_테이블_사전.md` — `generate-db-doc.js` 재생성.
  - `eobom/backend/backups/prod-20260827-145756.dump` — 스키마 변경 전 운영 DB 백업(457.1KB,
    `.harness/tools/backup-db.ps1`, `.gitignore` 대상이라 커밋 안 됨).
- **결과**:
  - `npx tsc --noEmit`(frontend·backend) 통과, backend `npm run build` 통과.
  - **실제 서버로 전 시나리오 검증**(카카오 테스트회원=본인, 구글 테스트회원=가족, 실제 초대
    발급→수락 흐름까지 API로 실행): ①(LIFE_SUPPORT)에 `IMMEDIATE` 시도 → 400 거부(§13#5 "②⑦만"
    확인) · ②(FUNERAL)에 `EMERGENCY` 시도 → 400 거부(§13#1 확인) · ⑨(WILL_DRAFT)에 grant 시도 →
    400 거부(§7.4 모델 레벨 차단 확인) · ①에 `POSTMORTEM`·②에 `IMMEDIATE` 정상 부여 → 200.
    가족 계정으로 `GET /family-view` 호출 → **②(IMMEDIATE)만 응답에 존재하고 ①(POSTMORTEM)은
    entries 배열에 키 자체가 없음**(완료 판정 문구 "IMMEDIATE 섹션만 보이고 POSTMORTEM 섹션은
    제목조차 응답에 없다" 그대로 재현). ② grant 철회 → family-view 재조회 시 entries 빈 배열로
    사라짐(철회 경로 확인, §4.2).
  - `generate-db-doc.js` "설명 없음" 25개로 기존과 동일(신규 컬럼 전부 주석 보강).
  - `harness-doctor.sh` 143/143 통과.
- **편차**:
  1. 🔴 **`familyDesignationController.ts` 불변식 3과의 긴장 관계** — 그 파일 머리말은 "내가
     누군가에게 지정됐는지 조회하는 API는 만들지 않는다"고 명시한다. `getFamilyVisibleEndingNotes`는
     `acceptedUserId`로 `FamilyDesignation`을 역질의하므로 표면적으로 같은 모양이다. 판단해서
     진행했다 — 그 불변식은 §9.1(초대 발급~수락 전) 단계에서 "추측 불가 토큰으로만 접근"을
     지키기 위한 것이고, 여기는 이미 `acceptedAt`으로 동의가 끝난(status=ACCEPTED) 관계에서
     부여받은 콘텐츠를 열람하는 별개 동작이라 봤다. **이 판단은 사람 확인이 필요하다** —
     `docs/`는 고치지 않았고, `endingNoteController.ts`에도 같은 메모를 남겨뒀다.
  2. §13 #5는 즉시 공유를 "②⑦만"이라 했는데, §7.1 표 자체는 ①도 즉시(생전) 🟡선택으로 표시한다.
     확정 결정(§13 #5)을 표(§7.1)보다 우선해 ①은 `POSTMORTEM`만 허용했다.
  3. `EndingNoteGrant.section`에 모델 정의상 `ALL`이 허용되지만, 이번 API·UI는 개별 섹션만
     받는다 — `WILL_DRAFT`를 우회해 전체 포함시키는 경로를 만들지 않기 위해 의도적으로 미구현.
     필요해지면 그때 "WILL_DRAFT 제외 전체"로 해석하는 로직을 추가하면 된다.
  4. §7.3 "본인용 열람 이력 노출"은 이번 범위에 포함하지 않았다 — `EndingNoteLog`(Phase 3)가
     있어야 "언제 열람했는지"를 알 수 있는데, 이번 지시 범위(모델+UI+API 3가지)에 로그는
     없었다.
- **다음 에이전트가 알아야 할 것**:
  - 🔴 **로컬 dev DB 사고**: 검증 후 정리 중 `familyDesignation.deleteMany({ where: { userId } })`로
    지운다는 게 이번에 만든 테스트 행(1건) 외에 **기존에 있던 가족 지정 2건까지 같이 지워졌다**
    (해당 계정: 카카오 테스트회원). walkthrough(74) "가족 연결 실기기 확인 완료"의 실데이터였을
    가능성이 있다 — 복구 불가(로컬 DB라 별도 백업 없었음). 사용자에게 즉시 보고함. **앞으로
    테스트 정리는 반드시 `id`로 지정 삭제할 것, `userId` 같은 넓은 조건 금지.**
  - `SECTION_ALLOWED_TIMINGS`는 프론트(`EndingNotePage.tsx`)·백엔드(`endingNoteController.ts`)
    양쪽에 동일 내용으로 중복 정의돼 있다(프로젝트 기존 관례 — `DIGITAL_ACCOUNT_CHOICES` 등과
    같은 패턴). 정책이 바뀌면 두 곳 다 고쳐야 한다.
  - Phase 3(개봉 절차·`EndingNoteLog`·응급 열람·04·07 연결)는 여전히 착수 전 — §10 그대로.
  - `getFamilyVisibleEndingNotes`가 실제로 쓰이는 프론트 화면(가족용 열람 페이지)은 아직 없다 —
    이번 지시가 "가족 조회 API"까지만 명시했고 화면은 요청되지 않아 만들지 않았다.

<!-- Gemini 판정: ✅통과 (06-04 §10 Phase 2 스펙 일치: EndingNoteGrant 모델 생성, SECTION_ALLOWED_TIMINGS 타이밍 맵, GET/PUT /grants 및 GET /family-view 구현, 편차 1의 가족 수락 후 열람 역질의 허용 정합 확인) -->

---

## 2026-08-27 (82) | [Sonnet] 엔딩노트 아코디언 전환 + Phase 1 저장(EndingNoteEntry) + 06 전용 암호화 키 분리

- **근거 스펙**: `docs/06_엔딩노트_유언/06-04_엔딩노트_보관함_실구현_기획서.md` §6.1-1(아코디언)·
  §4.2(데이터 모델)·§7(열람 시점)·§10 Phase 1(구현 단계)·§13 #3·#4(확정 항목).
- **건드린 파일**:
  - `eobom/backend/prisma/schema.prisma` — `EndingNote.sectionState Json?` 추가, `EndingNoteEntry`
    모델 신설(`noteId`+`section` unique, `recipientId` FK → `FamilyDesignation`), `FamilyDesignation`에
    `endingNoteEntries` 역방향 관계 필드 추가. 마이그레이션
    `20260827043226_ending_note_entry_phase1`(CREATE TABLE + ALTER ADD COLUMN만 — 개발자가 이미
    `pg_dump`·옛 키 암호문 정리·`SETTLEMENT_ENCRYPTION_KEY` 교체·`ENDING_NOTE_ENCRYPTION_KEY` 등록을
    완료해 둔 상태였으므로 재암호화 로직 없이 진행).
  - `eobom/backend/src/utils/crypto.ts` — `encryptNoteField`/`decryptNoteField` 신설
    (`ENDING_NOTE_ENCRYPTION_KEY` 사용, `getNoteKey`). 기존 `encryptField`/`decryptField`/`hashField`
    시그니처·호출부는 무변경.
  - `eobom/backend/src/controllers/farewellMessageController.ts` — `bodyEnc` 암복호화를
    `encryptField`/`decryptField`(정산 키) → `encryptNoteField`/`decryptNoteField`(06 전용 키)로 전환.
  - `eobom/backend/src/controllers/endingNoteController.ts`(신규) — `getEndingNote`(GET, 본인 전체
    조회+복호화)·`agreeEndingNotePolicy`(POST, `policyAgreedAt` 최초 1회 스탬프)·
    `saveEndingNoteSection`(PUT `/sections/:section`, upsert). `SECTION_TIMING` 맵으로 서버가
    `releaseTiming`을 결정(클라이언트 값 무시) — `WILL_DRAFT`(⑨)는 항상 `null`, 나머지는 전부
    `POSTMORTEM`(§13 #1에 따라 `EMERGENCY`는 Phase 3 전까지 어디에도 미부여). `POLICY_NOTICE_TEXT`에
    `06-03` §5 권고 문구 그대로 보관.
  - `eobom/backend/src/routes/endingNoteRoutes.ts`(신규), `eobom/backend/src/server.ts`
    (`app.use('/api/ending-note', endingNoteRoutes)` 추가).
  - `eobom/backend/.env.example` — `ENDING_NOTE_ENCRYPTION_KEY`·`BACKUP_DATABASE_URL` 자리표시자+주석 추가.
  - `render.yaml` — `ENDING_NOTE_ENCRYPTION_KEY`(`sync:false`) 추가, `SETTLEMENT_ENCRYPTION_KEY` 주석
    정정(옛 "로컬과 같은 값" → "로컬과 **다른** 값", "`Obituary.accountNumberEnc` 1건" → 0건).
  - `eobom/frontend/src/pages/EndingNotePage.tsx` — 전면 재작성. `AccordionSection`을 모듈
    최상위로 분리(①②④⑤⑥⑦⑧⑩ 8개, 한 번에 하나만 펼침), 데스크톱 좌측 목차(`ending-note-toc`)
    고정 + 모바일 숨김, `sectionState` 기반 완료 체크(`CheckCircle2`), `06-03` §5 동의 배너(작성
    시작 시점, 서버가 `policyAgreedAt` 없으면 섹션 저장을 403으로 거부), ⑨는 여전히 아코디언 밖
    별도 블록이지만 이제 실제 저장(`saveSection('WILL_DRAFT', …)`) — "이 초안은 저장되지 않습니다"
    문구를 "본인만 볼 수 있으며 유족에게 전달되지 않습니다"로 교체.
  - `eobom/frontend/src/index.css` — `.ending-note-layout`/`.ending-note-toc`/
    `.ending-note-toc-link`/`.ending-note-accordion-item`/`-header`/`-body` 신설(900px 기준 목차
    표시/숨김, 모바일은 단일 컬럼).
  - `docs/00_핵심플랫폼/00-05_DB_요구사항_및_테이블_사전.md` — `node .harness/tools/generate-db-doc.js`
    자동 재생성(§13 #4 대응, `EndingNoteEntry` 신규 섹션 반영).
- **결과**:
  - `npx tsc --noEmit`(frontend·backend) 통과, backend `npm run build`(prisma generate + tsc) 통과.
  - **실제 서버 기동 후 curl로 검증**: `POST /api/ending-note/policy-agree` → `policyAgreedAt` 스탬프
    확인 → `PUT /api/ending-note/sections/ASSET` `{value:{assetNote:"국민은행에 주거래 계좌 있음"}}`
    → 200 + `releaseTiming:"POSTMORTEM"`(서버 결정) → `PUT .../sections/WILL_DRAFT`에 `releaseTiming:
    "EMERGENCY"`를 body에 실어 보내는 공격 시도 → 응답은 `releaseTiming:null`로 무시됨(§7.4 확인)
    → `PUT .../sections/HACKED` → 400 `"알 수 없는 섹션입니다."` → `GET /api/ending-note`로 두
    섹션 모두 복호화되어 원문 그대로 라운드트립 확인 → 재로그인 복원 확인.
  - **F1(DB 직접 조회)**: `prisma.endingNoteEntry.findMany`로 `bodyEnc` 원본 조회 —
    `"NibRWZ1DNkm+10Yb:SsO9PwDh3Msq/97HOpUh4g==:ThOB6uZmw2UuvqyGot0wfzANR26QHU++ESsm4cjbVHWxqxvcfZY6GPKNAtyt9xQaa7qEAhD1Xg=="`
    형태(IV:authTag:ciphertext, base64) — 평문 "국민은행에 주거래 계좌 있음"이 어디에도 없음을 확인.
    테스트로 만든 `EndingNote`(카카오 테스트회원)는 검증 직후 삭제해 원상복구.
  - **D5 확인**: `adminController.ts`에 `EndingNote`/`EndingNoteEntry` 참조 0건(grep) — 운영자
    API가 이 컨트롤러를 아예 쓰지 않음.
  - **F2 확인**: `EndingNotePage.tsx`에서 §6.3 금지 어휘(비밀번호·PIN·계좌번호·잔액·주민등록번호·
    상속지분·유류분) 및 Phase 0에서 이미 제거됐던 옛 문구("철저히 비밀이 보장" 등) grep 0건.
  - `generate-db-doc.js` 실행 결과 "설명 없음" 25개로 기존과 동일(신규 필드에 전부 주석 보강 —
    처음엔 `EndingNoteEntry.createdAt/updatedAt` 무주석으로 27개까지 늘었다가 되돌림).
- **편차**:
  1. §6.1-1은 "①②④⑤⑥⑦⑧⑨⑩ 9개 섹션"이라 하나, 기존 화면이 ①②를 한 카드로 묶어뒀던 것을
     이번에 완전히 분리된 아코디언 항목 2개로 나눴다 — 이유: `EndingNoteEntry`가 섹션당 1건이라
     ①(응급 열람 허용 후보)과 ②(사후 고정)를 같은 저장 단위로 두면 §7.1 시점 분리가 원리적으로
     불가능해진다. 완료 판정에도 영향 없음(둘 다 저장·복원됨).
  2. Phase 1에는 시점 선택 UI가 없어(§10 Phase 2 몫) `releaseTiming`을 컨트롤러의 고정 맵
     (`SECTION_TIMING`)이 결정하게 했다 — ①②⑦에 허용된 `EMERGENCY`도 지금은 전부
     `POSTMORTEM`으로 둔다. 이유: §13 #1 권고("응급 열람은 Phase 3으로 연기") 그대로 따른 것이라
     스펙 위반이 아니라 스펙이 이미 지시한 것을 정확히 반영한 것.
  3. `EndingNoteEntry.title`(§13 #3 "허용")을 저장은 받아두되(nullable), 이번 화면에 사용자가
     제목을 입력하는 UI는 만들지 않았다 — 목록 화면(운영자·본인 다건 리스트)이 아직 없어 표시할
     곳이 없다. 값은 항상 `null`로 저장됨. 다음 세션에서 필요해지면 그때 입력 UI를 추가하면 된다.
- **다음 에이전트가 알아야 할 것**:
  - 🟡 로컬 dev DB에 `context.md`가 언급한 "테스트 편지 2건"(`FarewellMessage`, 배치 정리
    대상)이 남아 있다면 **더는 복호화되지 않는다** — `FarewellMessage.bodyEnc`를 이번에
    `ENDING_NOTE_ENCRYPTION_KEY`로 전환했는데 그 2건은 옛 `SETTLEMENT_ENCRYPTION_KEY`로
    암호화돼 있다. 사용자 승인 없이 삭제하지 않았다(배치 정리 대상으로 이미 등록돼 있어
    임의 삭제 금지 원칙 적용) — 배치 정리 시 같이 처리할 것.
  - Phase 2(`EndingNoteGrant`, 섹션별 시점 UI, 가족 조회 API)·Phase 3(개봉 절차, 응급 열람,
    04·07 연결)는 여전히 미착수 — §10 그대로.
  - `EndingNotePage.tsx`의 `AccordionSection`을 컴포넌트 함수 내부가 아니라 모듈 최상위에
    정의했다 — 렌더 함수 안에 두면 매 렌더마다 새 컴포넌트 타입이 생겨 입력 중 포커스가
    끊기는 버그가 실제로 있었다(구현 중 발견·직접 수정, 별도 보고 없음).
  - 로컬 백엔드 dev 서버(ts-node-dev)가 Prisma 쿼리 엔진 dll을 잠그고 있어 `prisma generate`가
    `EPERM`으로 실패했다 — 사용자가 포트 5000을 내려준 뒤에야 재생성 가능했다. 스키마를 고치는
    작업 세션에서 백엔드 dev 서버가 떠 있으면 같은 문제가 재현될 수 있다.

<!-- Gemini 판정: ✅통과 (06-04 §6.1-1·§4.2·§7 스펙 일치: EndingNoteEntry 모델 신설, ENDING_NOTE_ENCRYPTION_KEY 06 전용 분리, 아코디언 구조 전환, 동의 게이트 및 서버 결정 releaseTiming 라운드트립 검증 완료) -->

---

## 2026-08-27 (81) | [Sonnet] ⑩ 장기·조직 기증 의향 추가 + 도메인 페이지 드롭다운 폭 축소

- **근거 스펙**: `docs/06_엔딩노트_유언/06-04_엔딩노트_보관함_실구현_기획서.md` §6.1 ⑩(장기·조직
  기증 의향, ①과 동일 구조) — walkthrough(80) 작업 중 사용자가 추가 지시. 드롭다운 폭 건은
  스펙 없음 — 사용자 직접 지시("모든 도메인 페이지의 컨테이너 내부 드롭다운 폭이 너무 넓다").
- **건드린 파일**:
  - `eobom/frontend/src/pages/EndingNotePage.tsx` — ⑩ 카드 신설(등록 여부 select + "등록함"
    선택 시에만 나타나는 등록일 date input, 시신 기증은 별개 제도라는 경고 문구), `prepSaveButtonStyle`에
    `display:'block'` 추가(아래 CSS 변경과 맞물려 select 옆으로 버튼이 끼어드는 것 방지)
  - `eobom/frontend/src/index.css` — `.container .form-group:has(> select)`를 `inline-flex`+
    `max-width:320px`로(데스크톱에서 여러 개가 한 줄에 자연 줄바꿈), 640px 이하에서는
    `display:block`으로 되돌림(모바일 1줄 1개 유지). 곧바로 뒤따르는 형제 요소(버튼 등)가
    남는 공간에 끼어들지 않도록 `+ *:not(.form-group)`에 `display:block` 백스톱 추가.
- **결과**:
  - `npx tsc --noEmit`·`npm run build`(tsc+vite) 통과.
  - `grep -rn "<select" --include=*.tsx`로 `.form-group`에 select를 직접 담은 다른 페이지를
    전수 확인 — `FacilityPage.tsx`·`PickupPage.tsx`는 select가 `.form-group`의 직계 자식이
    아니라(중간에 flex div) `:has(> select)`에 안 걸림(의도대로 미적용). `MyPageProfile.tsx`·
    `MyPageFamilyDesignation.tsx`는 App.tsx에서 `.container` 밖(모달)에 렌더돼 영향 없음.
    실제로 이 규칙이 적용되는 곳은 `EndingNotePage.tsx`뿐임을 확인.
  - 브라우저(390px 폭 iframe 트릭으로 만든 실제 1296px 뷰포트)에서 ①(연명의료+장례희망)·
    ⑤(디지털 계정 4개)가 데스크톱에서 2열로, 386px 실측 모바일 뷰포트에서는 다시 1열
    100%(부모 카드 폭과 동일 실측)로 정상 전환됨을 `getComputedStyle`·`getBoundingClientRect`로
    직접 확인. 처음엔 백스톱 규칙이 `*`(전체)를 잡아 select 그룹끼리도 서로를 밀어내 전부
    1열로 깨지는 회귀가 있었고, `:not(.form-group)`을 추가해 재확인 후 해결.
- **편차**: 없음.
- **다음 에이전트가 알아야 할 것**:
  - 이 커밋은 walkthrough(80, 커밋 `78c0f10`)의 이어지는 작업이다 — ⑩ 섹션은 그 커밋 이후
    사용자가 추가로 지시한 것이라 별도 커밋으로 나뉜다.
  - `.form-group:has(> select)` 규칙은 `:has()` CSS 셀렉터를 쓴다(모던 브라우저 전제, 이
    프로젝트가 이미 backdrop-filter·CSS Grid 등 모던 CSS를 쓰고 있어 동일 전제).

<!-- Gemini 판정: ✅통과 (06-04 §6.1 ⑩ 장기·조직 기증 의향 섹션 추가, .container .form-group:has(> select) 반응형 너비 최적화 및 tsc/build 통과 확인) -->

---

## 2026-08-27 (80) | [Sonnet] 엔딩노트 섹션 확장(④~⑧) + ⑨ 개명·정리 + 보관함 저장 간소화

- **근거 스펙**: `docs/06_엔딩노트_유언/06-04_엔딩노트_보관함_실구현_기획서.md` §6.1(8개 섹션)·
  §6.3(받지 않는 것)·§6.4-1(만드는 것/만들지 않는 것, 2026-08-27 균형 조정)·§6.4-5(2026-08-27
  정정 — 확인 버튼 제거) — `[사용자]` 08-27 직접 지시(작업 1~4).
- **건드린 파일**:
  - `eobom/frontend/src/pages/EndingNotePage.tsx` — ⑨ "말로 남기는 초안" → "유언장 초안" 전면
    개명(h3 제목·인쇄 title·다운로드 파일명·페이지 상단 소개문), "이 내용을 확인했습니다" 버튼과
    그 활성화 게이트 제거(4대요건 체크·필사 안내·인쇄/복사/다운로드 버튼 상시 노출로 전환),
    상단 상시 노출 고지("이 화면에서 만든 글은 유언장이 아닙니다…") 신설 + 인쇄물 머리에 동일
    문구 삽입, 초안 textarea + 4대요건 박스를 `grid-template-columns:
    repeat(auto-fit, minmax(min(320px,100%),1fr))`로 2단(데스크톱)/1단(모바일) 배치, ④~⑧ 5개
    신규 섹션 카드 추가(자산 소재 안내·디지털 계정 처리 의향·보험·연금 가입 사실·중요 연락처·
    반려동물·유언장 소재 안내) + ⑩ 장기·조직 기증 의향(추가 지시, ①과 동일 구조 — 등록 여부·
    등록일까지만, 시신 기증과 섞지 않는다는 경고 포함) — 전부 화면 상태만 존재하고 저장 버튼은
    기존 ① 패턴과 동일하게 비활성 "저장 (준비 중)"
  - `eobom/frontend/src/components/FarewellMessageCard.tsx` — "이 내용을 확인했습니다" 확인
    게이트 제거, 「저장」 버튼 하나로 통합(취소는 유지). STT 동의 체크박스(`VoiceToTextInput`
    내부)는 손대지 않음 — 저장 확인이 아니라 제3자 제공 동의라 성격이 다름(작업3 지시대로)
  - `eobom/frontend/src/components/home/domainSlides.tsx` — "말로 남기는 유언 초안"·
    "말로 남기는 초안(음성 인식)" 문구를 "유언장 초안"·"유언장 초안(직접 입력)"으로 정정
    (음성은 06-05로 이관됐으므로 "(음성 인식)" 표기가 더 이상 사실이 아니었음)
- **결과**:
  - `npx tsc --noEmit`(frontend) 0 에러, `npm run build`(tsc+vite) 통과.
  - `grep -r "말로 남기는" eobom/frontend/src` 0건(전역 변경 확인).
  - §6.3 금지 항목(비밀번호·PIN·공동인증서 암호 / 계좌번호·잔액 / 주민등록번호·서류파일 /
    상속지분·유류분) 중 어느 것도 새 섹션 필드로 들어가지 않았음을 직접 검토 확인 — ④는
    은행/증권사명 자유 텍스트(placeholder가 §6.3 대체 문구 그대로) + 비밀번호 금지 경고,
    ⑥은 회사명 텍스트만(증권번호 필드 자체가 없음), ⑧은 보관 위치 한 줄만(파일 업로드 UI 없음).
  - 실제 로그인 세션(로컬 JWT)으로 `/ending-note`·`/farewell-messages` 브라우저 렌더 확인 —
    ④~⑧⑩ 카드 전부 정상 표시(⑩은 "등록함" 선택 시 등록일 입력란이 나타나는 것까지 JS로
    직접 확인), ⑨ 카드에 확인 버튼 없이 4대요건·인쇄/복사 버튼 바로 노출.
    `getComputedStyle`로 ⑨ 그리드가 실제 1296px 뷰포트에서 2열(448.5px×2)로, 이 환경 실측
    최대폭(~839px, 콘텐츠 폭 512px)에서는 자동으로 1열로 붕괴함을 확인(auto-fit 수학 검증 —
    같은 기법이 FarewellMessagePage·DomainOverviewPage에서 이미 실측 검증됨).
    `FarewellMessageCard` 편집기에서 본문 입력 즉시 확인 단계 없이 취소/저장 버튼이 바로
    나타남을 확인.
- **편차**:
  1. ⑤(디지털 계정 처리 의향)는 04 `DigitalPlatform`의 실제 카탈로그를 조회하지 않고, 화면
     자체에 고정된 4개 카테고리(이메일·SNS·클라우드·구독 서비스)만 선택지로 뒀다 — 04 연동은
     "실행은 04"라는 스펙 경계(§6.1 ⑤)를 따른 것이고, Phase 1 모델이 아직 없어 04 카탈로그와
     실제로 연결할 지점이 없다.
  2. ⑥(보험·연금)은 스펙 문구 "회사명·증권번호 유무만"을 "가입 여부 체크 + 회사명 텍스트"로
     구현했다 — 증권번호의 "유무"까지 별도 필드로 만들면 오히려 §6.3이 금지한 "증권번호"
     항목에 근접한 필드가 생기는 것 같아, 증권번호 관련 필드 자체를 아예 두지 않았다.
  3. ⑦(중요 연락처)은 "체크·선택 위주" 원칙을 완전히 지키지 못했다 — 사람 이름·연락처는
     본질적으로 자유 입력이 필요해 텍스트 영역으로 뒀다(반려동물 인수자만 한 줄 입력으로 축소).
- **다음 에이전트가 알아야 할 것**:
  - ④~⑧⑩은 전부 미저장이다(Phase 1 `EndingNoteEntry` 모델이 서면 배선 필요) — 새로고침하면
    입력값이 사라진다. `docs 06-04 §4.2`의 `EndingNoteEntry`가 그 모델이다.
  - 이 세션은 브라우저 화면 확인 후 로컬 테스트 편지(`FarewellMessageCard` 새 편지 쓰기 시도)는
    저장 없이 "취소"로 되돌렸다 — DB에 새 테스트 데이터를 추가하지 않았다.
  - 커밋은 사용자가 직접 진행하기로 했다 — 이 세션에서 `git add`/`git commit`을 실행하지 않았다.

<!-- Gemini 판정: ✅통과 (06-04 §6.1 8개 섹션 확장, ⑨ 유언장 초안 전면 개명 및 4대요건 상시 노출, 금지항목 미수집 준수, FarewellMessageCard 확인 게이트 간소화 확인) -->

---

## 2026-08-27 (79) | [Sonnet] `/prep`·`/bereaved` 모바일에서 인트로 배너가 본문을 가리는 문제 수정

- **근거 스펙**: 스펙 없음 — 사장님 실기기 지적("자세히보기 진입 이후 나오는 오버뷰가 모바일
  환경에서는 나오지 않도록"). 처음엔 `.domain-overview-feature-card`(이미 640px 이하에서
  숨겨짐, 실측 확인함) 얘기인 줄 알았으나, 사장님이 `.domain-overview-intro`를 정확히
  지목 — "모바일페이지의 너무 많은 부분 차지하며, 스크롤을 내려도 화면 위에 떠있기 때문에
  본 내용이 안보여."
- **건드린 파일**: `eobom/frontend/src/index.css` — 기존 `@media (max-width: 640px)` 블록
  (`.domain-overview-feature-card`·`.domain-overview-dots` 숨김 규칙과 같은 블록)에
  `.domain-overview-intro { display: none; }` 추가.
- **결과**: `DomainOverviewPage.tsx`의 `.domain-overview-intro`가 `.domain-overview-viewport`
  기준 `position:absolute`라 안쪽 스크롤 컨테이너와 무관하게 화면에 고정돼, 첫 슬라이드의
  배지·제목·설명·CTA 버튼을 계속 덮고 있었다(제보 그대로 재현). 이 배너 문구(title·intro)는
  홈 화면 EntryBoxes.tsx `BoxHeader subtitle`로 이미 한 번 보여준 것과 동일해 모바일에서
  지워도 정보 손실이 없음을 확인 후 제거. 로컬(`localhost:5173/prep`)과 배포본
  (`eobom.vercel.app/prep`) 양쪽 다 390px 폭 iframe(`window.innerWidth` 386 실측)으로 직접
  렌더링해 수정 전/후 비교 확인 — 수정 후 배지·제목·CTA가 가려짐 없이 바로 보임. `npm run
  build`(frontend, tsc+vite) 통과.
- **편차**: 없음.
- **다음 에이전트가 알아야 할 것**: 없음.

<!-- Gemini 판정: ✅통과 (모바일 640px 이하 .domain-overview-intro 숨김 처리로 인트로 배너 본문 가림 해소 및 빌드 통과 확인) -->

---

## 2026-08-21 (50) | [Sonnet] 회원 프로필(`00-28`)·생전 가족지정(`00-27`) Phase 1 — 저장까지 구현

- **근거 스펙**: `00-28` §5(User 확장 필드)·§6.1(GET·PATCH /api/me/profile)·§8 Phase 1 · `00-27` §3(불변식 5개)·§4(FamilyDesignation 모델)·§4.1(phoneHash)·§4.2(상한 10명)·§6(scope 2단)·§8.1(라우트 4종)·§8.3(고지 문구)·§10 Phase 1 · `.harness/systems.md` §4(Supabase pg_dump 선행)·§5(배포). 개발자 지시: *"우선적으로 회원 정보란에 정보를 입력하고 DB에 쌓는 건 선행되어야 함(유족 정보 포함)."* → 저장까지만, 통지·수락·계정연결(Phase 2·3)은 범위 밖.
- **건드린 파일**:
  - 백엔드: `eobom/backend/prisma/schema.prisma`(User에 8개 nullable 필드 + `familyDesignations` 역참조, `FamilyDesignation` 모델 신설) · `eobom/backend/prisma/migrations/20260821023945_add_user_profile_and_family_designation/migration.sql`(신규) · `eobom/backend/src/utils/crypto.ts`(`hashField` 추가) · `eobom/backend/src/utils/phone.ts`(`maskPhone` 추가) · `eobom/backend/src/controllers/profileController.ts`(신규) · `eobom/backend/src/controllers/familyDesignationController.ts`(신규) · `eobom/backend/src/routes/familyDesignationRoutes.ts`(신규) · `eobom/backend/src/routes/meRoutes.ts`(`GET`·`PATCH /profile` 추가, 머리말 주석 1줄 확장) · `eobom/backend/src/server.ts`(`/api/family-designations` 마운트)
  - 프론트: `eobom/frontend/src/components/AddressSearchModal.tsx`(`onSelect` 시그니처를 `string` → `{ zonecode, roadAddress, jibunAddress }` 객체로 확장) · `eobom/frontend/src/pages/AdminPage.tsx`(604행 호출부 동반 수정) · `eobom/frontend/src/pages/PartnerPortalPage.tsx`(387행 호출부 동반 수정) · `eobom/frontend/src/components/MyPageProfile.tsx`(신규) · `eobom/frontend/src/components/MyPageFamilyDesignation.tsx`(신규) · `eobom/frontend/src/App.tsx`(모달 상태 2개 + `/mypage` route에 `onOpenProfile`·`onOpenFamilyDesignation` prop 추가) · `eobom/frontend/src/pages/MyPage.tsx`("내 정보"·"가족 지정" 진입 카드 2개 추가)
- **결과**:
  - 🔴 **선행 백업 완료** — Docker Desktop이 꺼져 있어(이전 세션부터) 로컬에 `pg_dump` 바이너리가 없었다. Docker Desktop을 띄우고, `docker run --rm -v /c/Users/kilak/Desktop/Eobom_backups:/backup postgres:17-alpine pg_dump -h aws-0-ap-northeast-2.pooler.supabase.com -p 5432 -U postgres.oxvyljtyypnrbnhfbgrs -d postgres -F c -f /backup/eobom_supabase_20260821_113855.dump`로 **Supabase(로컬 Docker 아님)** 를 직접 덤프했다(최초 15 클라이언트로 시도 → "server version mismatch"로 실패 → 17-alpine으로 재시도해 성공). 저장 위치는 저장소 **바깥**(`C:\Users\kilak\Desktop\Eobom_backups\`, git 추적 안 됨) — `.harness/security.md` §1(실제 개인정보 커밋 금지). `pg_restore --list`로 **676 TOC 항목·23개 앱 테이블(User·FamilyDesignation은 신규 이전이라 없음, Facility·Lead·Obituary 등 기존 전부) 데이터 섹션 확인** — 복원 가능한 완전한 백업.
  - **마이그레이션 로컬 생성·적용** — `npx prisma migrate dev --name add_user_profile_and_family_designation`(로컬 Docker `eobom-postgres`, 5433). 생성된 SQL은 `ALTER TABLE "User" ADD COLUMN`(nullable 8개) + `CREATE TABLE "FamilyDesignation"` + FK 1개뿐 — DROP 없음, 순수 추가만.
  - **마이그레이션 프로덕션 적용** — `DATABASE_URL=...6543...pgbouncer=true DIRECT_URL=...5432... npx prisma migrate deploy`(임시 env override, `systems.md` §5 관행대로). "17 migrations found... All migrations have been successfully applied." `psql`로 `\d "FamilyDesignation"` 재확인 — 컬럼·인덱스·FK 전부 스펙과 일치.
  - **빌드**: `npx tsc --noEmit`(backend) 통과 · `npm run build`(backend: `prisma generate && tsc`) 통과, `dist/controllers/{profileController,familyDesignationController}.js`·`dist/routes/{meRoutes,familyDesignationRoutes}.js` 생성 확인 · `npx tsc --noEmit -p .`(frontend) 통과 · `npm run build`(frontend: `tsc && vite build`) 통과.
  - **브라우저 실기동은 안 함** — 사용자가 dev 서버를 직접 켜는 걸 선호한다는 기존 기록(`feedback_user_starts_dev_server`)에 따라 `npm run dev`를 내가 띄우지 않았다. API 라운드트립(GET/PATCH 프로필, 4종 가족지정 CRUD)과 `AddressSearchModal` 호출부 2곳(`AdminPage`·`PartnerPortalPage`) 회귀는 **미검증** — 다음 항목 참고.
- **편차**:
  - 🔴 **`00-28` §8 Phase 1 2번 항목이 문서 자체 오타로 `/api/users/me/profile`이라고 적혀 있다** — 같은 문서 §6.1 표와 개발자의 명시적 지시("새 `/api/users` 네임스페이스를 열지 말 것")는 둘 다 `/api/me/profile`. §6.1·지시를 따라 `/api/me/profile`로 구현했다. **`00-28` §8을 고쳐야 할 사람은 Opus** — 여기선 코드만 맞추고 문서는 손대지 않았다.
  - `maskPhone`을 `utils/phone.ts`에 새로 export로 뺐다(스펙엔 위치 지정 없음) — `leadController.ts`에 이미 있던 사실상 동일한 private 함수는 그대로 두고 손대지 않았다(리팩터 지시 없었음, 블라스트 반경 최소화).
  - `FamilyDesignation` 이메일도 GET 응답에서 마스킹했다(로컬파트만, 도메인은 유지) — §8.1 표는 "연락처는 마스킹"만 명시하지만, §3 불변식 2("연락처·이메일은... 어떤 응답에도 평문을 넣지 않는다")가 이메일까지 명확히 포함해서 같은 규칙을 적용했다. 마스킹 정확한 형식은 스펙에 없어 leadController의 이름 마스킹 방식을 참고해 직접 정했다.
  - 회원 프로필 GET의 상세주소 마스킹 알고리즘(첫 글자만 남김)도 스펙에 정확한 형식이 없어 같은 방식으로 직접 정했다.
  - `PATCH /api/me/profile`이 `name`·`email`(§3.2 ③④, 기존 컬럼)까지 함께 받는다 — §5 스키마 블록은 신규 8필드만 나열하지만 §3.2가 이름·이메일도 이 화면의 수집 항목으로 명시하고 있어 같은 엔드포인트에 포함시켰다. `name`은 기존 `User.name`이 `NOT NULL`이라 §3.1("전부 선택")의 예외로 두고 빈 값을 400으로 막았다 — 이건 신규 수집 항목이 아니라 기존 필수 컬럼의 무결성 문제다.
  - 지정 인원 상한(10명, §4.2)은 삽입 전 `count()` 체크로만 막았다 — 동시에 두 요청이 들어오면 이론상 10명을 넘을 수 있는 경쟁조건이 남아 있다. 남용 방지용 소프트 상한이라 지금은 그대로 뒀다.
- **다음 에이전트가 알아야 할 것**:
  - **마이그레이션이 이미 로컬·프로덕션(Supabase) 둘 다 적용된 상태**다 — Render가 다음 재배포 때 `npm start`의 `prisma migrate deploy`를 돌려도 새로 적용할 게 없어 그냥 통과한다(정상).
  - 로컬 Docker(`eobom-postgres`, 5433)를 이번 세션에서 새로 켰다 — Docker Desktop이 꺼져 있던 상태에서 시작했고, 같이 떠 있던 무관한 다른 프로젝트 컨테이너(`phone_node_app`·`phone_postgres_db`)는 건드리지 않았다.
  - **Phase 2·3(알리기·수락·`inviteToken`·`/invite/:token`·SMS 본인확인)은 의도적으로 전혀 없다** — `MyPageFamilyDesignation.tsx`에 "알리기" 버튼이 없고, `status`는 서버가 항상 `DRAFT`로 고정한다(불변식 1).
  - ⚠️ **브라우저 회귀 미검증** — 특히 `AddressSearchModal`을 쓰는 `AdminPage`(전문가 사무실 주소)·`PartnerPortalPage`(가입 폼 주소)가 새 객체 시그니처로 여전히 잘 동작하는지, `MyPageProfile`·`MyPageFamilyDesignation`의 저장·삭제 라운드트립을 실제로 눌러봐야 한다.
  - 백업 파일은 `C:\Users\kilak\Desktop\Eobom_backups\eobom_supabase_20260821_113855.dump`(451,410 bytes, 저장소 밖) — 필요시 `pg_restore -d <대상> eobom_supabase_20260821_113855.dump`로 복원.

<!-- Gemini 판정: ✅통과 (00-28·00-27 Phase 1 스펙 일치: User 프로필 8개 필드 및 FamilyDesignation 모델 마이그레이션, hashField/maskPhone 유틸, MyPageProfile/MyPageFamilyDesignation 컴포넌트 배선 및 tsc 0건 확인) -->

---

## 2026-08-21 (49) | [Opus] 07 구현물 ↔ `07-03` 스펙 정합 감사 — 드리프트 5건 판정

- **근거 스펙**: `07-03` §4.2·§4.4·§5.1·§5.2·§5.3·§5.4-2·§6.2·§6.2-3 · `00-13` §6.1(존재 은닉) · `00-23` §2.2·§4.1 · `00-26` §3.3·§4.5 · `05-01` §2.6. 개발자 지시: *"sonnet이 내 요청에 따라(너의 의견 거치지 않은) 변경한 디테일이 많이 있어서 너가 한번 확인할 필요는 있을 것 같아."*
- **건드린 파일**: `docs/07_상중_행정_케어/07-03_...기획서.md`(§3.3-3-1 신설 · §9 검증표 ②판정 하향) · `docs/00_핵심플랫폼/00-26_...검토서.md`(§3.3 표 라벨 · **§3.3-1 신설**) · `docs/00_핵심플랫폼/00-08_...명세서.md`(**세션 보관 위치 절 신설**) · `.harness/memory/context.md`(③에 오픈블로커 추가).
- **결과**:
  - **코드는 건드리지 않았다**(감사·문서 정합). **빌드/테스트 없음 — 코드 변경 0건.**
  - **✅ 스펙 준수 확인 8개 영역**(재감사 불필요): `schema.prisma`의 `Obituary`·`ObituaryMourner`가 §4.2와 **완전 일치** · 두 slug 독립 `randomBytes(16)`(§4.4 파생 금지) · 동의 게이트가 `consentGates.ts` 공용 함수 경유(§5.2 뒷문 방지) · 필수 4개 400 검증 · §5.3 화이트리스트(생년월일·내부PK 제외, 계좌는 `accountEnabled`일 때만 **필드 자체 추가**, `closedAt`·미존재 동일 404) · `triggerFieldsChanged`가 정확히 4필드(§5.4-2) · 작성 폼의 접어둔 선택항목·연락처 안내문구·계좌 토글 경고·동의 2건·재공유 안내(§6.2) · 라우트가 Phase 1 범위(POST·GET :slug·PATCH)만.
  - **드리프트 5건을 커밋 단위로 특정**했다 — 전부 2026-08-21 오전.
  - 🔴 **#1 `/m/:slug`가 목업 추모관을 조문객에게 노출**(`12ceab4`). `MemorialPage.tsx`는 `mockData/digitalEstate.json`을 읽고 **`useParams`로 slug를 읽지 않는다** — **어떤 slug를 넣어도 같은 화면**이 뜬다. `05-01` §2.6(추모관 오픈 금지)·`00-13` §6.1(존재 은닉)·`context.md` ③(04·05 보류)에 동시에 걸린다. 🔵 **개발자 판단: 지금 막지 않고 추모관 개발과 동시 진행** → **실사용자 유입 전 차단을 조건으로 `context.md` ③에 오픈블로커 등재.**
  - 🔴 **#1의 파생 — `07-03` §9 검증 ②"추모관 동반 생성 ✅"를 🟡로 내렸다.** 링크 이동은 정상이나 **목업이 slug를 안 읽으므로 화면만으로는 동반 생성을 검증할 수 없다.** DB나 `GET :slug`의 `memorialSlug`로 확인해야 한다.
  - 🟡 **#2 세션 보관 `localStorage` → `sessionStorage`**(`12ceab4`). **개발자 직접 지시**(*"브라우저를 모두 닫고 다시 접속했을 때 로그인이 되어 있음 — 보안에 문제 있다고 판단"*). 공용 기기를 쓰는 상중 상황 + 06·04의 민감도를 보면 타당하다. **`00-08`에 근거를 정본화**하고, 진입 모드는 여전히 `localStorage`라는 **비대칭이 의도된 절충**임(모드는 개인정보가 아니고 로그인은 접근권)을 함께 적었다. 🟡 *"로그인 유지" 체크박스*를 후속 권고로 남김(`07-02` 다일 흐름).
  - 🟡 **#3 게스트 → "추모관" 개편**(`12ceab4`·`3e1e37b`). **개발자 직접 지시**(*"사실상 게스트=추모관 이용이라 UX 개선"*). **`00-23` §2.2가 발굴한 "링크를 잃은 조문객" 분기에 처음으로 실제 목적지가 생긴 것**이고, `00-26` §4.5가 예고한 *"목적지가 생기면 `handleSelectMode`를 함께 고쳐야 한다"* 의 실행이다. **`00-26` §3.3-1로 정본화.**
  - ⚠️ **#3의 미해결 1건** — `00-23` 수정 ④가 요구한 *"실패 메시지 통일"*. 현재 형식 오류에 *"추모관 링크 형식이 아닙니다"* 를 띄우는데, **형식 오류와 미존재의 메시지가 갈리면 존재 탐지 경로**가 된다(`00-13` §6.1). 추모관 실구현 시 정리하도록 §3.3-1에 남김.
  - ⚪ **#4 카드 이미지 `-v2` 리네임**(`873491b`·`6f88d9b`) — **좋은 판단이라 스펙으로 승격**했다. 같은 URL의 파일만 갈면 **카카오 CDN이 옛 이미지를 계속 내보낸다**(08-20 *"카드이미지 수정"* 이 실제로 그 상태였음). **§3.3-3-1 신설** — 이미지 교체 시 **파일명을 함께 바꾸고**, **옛 URL은 지우지 않는다**(이미 뿌려진 카드가 그걸 가리키므로 지우면 전부 깨진다 — §5.4-1 스냅샷 원칙과 같은 이유). 다음은 `-v3`.
  - 🔴 **#5 카드 `description` §6.2-3 위반**(`6f88d9b`) — 별건으로 이미 보고·핸드오프 완료. 원인 커밋에서 **`// §3.2 예시: 빈소/발인` 주석째로 지우고** 상주·연락처·계좌를 추가했다.
- **편차**: 감사 결과 #2·#3은 **개발자가 Sonnet에 직접 지시한 확정 사항**이므로 되돌리지 않고 **문서를 실물에 맞췄다**(`roles.md` §2-1의 🔄스펙갱신과 같은 처리). #1은 개발자가 *"지금 막을 필요 없음"* 으로 판단해 **차단하지 않고 조건부 블로커로만 등재**했다 — 스펙 위반을 남겨둔 상태이므로 명시한다.
- **다음 에이전트가 알아야 할 것**:
  - 🔴 **`/m/:slug` 목업 노출은 살아 있는 스펙 위반이다.** 추모관 실구현 시 **가장 먼저** 닫을 것. 실사용자가 들어오기 전이라는 전제 위에서만 허용된 상태다.
  - 🔴 **스펙 참조 주석을 지우면서 코드를 바꾸지 말 것.** #5가 정확히 그 형태였고(`// §3.2 예시:` 삭제), **근거가 사라지면 다음 사람이 위반을 알아볼 방법이 없어진다.**
  - ⚠️ **`07-03` §9 ②는 아직 미검증**이다(위). ③(친구 탭 개인)·④(폴백)도 미확인으로 남아 있다.
  - 이번 감사는 **07 도메인 범위**다. `12ceab4`가 함께 건드린 `ConsultRequestModal`·`FacilityReviewModal`·`InquiryModal`·`MyPage`(각 2~6줄, `sessionStorage` 전환 연쇄로 추정)는 **02·01 도메인이라 검증하지 않았다.**

<!-- Gemini 판정: 🔄스펙갱신 (07-03 §3.3-3-1 카드 이미지 교체 규칙, 00-26 §3.3-1 게스트->추모관 개편, 00-08 sessionStorage 세션 보관 스펙 갱신 정합 및 /m/:slug 목업 오픈블로커 등재 확인) -->

---

## 2026-08-21 (48) | [Opus] 회원 프로필 정보수집 기획서(`00-28`) 신규 작성 — `00-27`의 짝, 착수는 이쪽이 먼저

- **근거 스펙**: `00-19` §3-1·§3-2·§3-5·§3-6·§8·§9-2(처리방침 수집항목·금지항목·위치정보 잠금) · `00-23` §4.1(*"막을 것은 쓰기이지 보기가 아니다"*) · `01-05` §4.4(리드 스냅샷·마스킹) · `00-14` §2.10(위치정보 확인) · `.harness/security.md` §1·§3 · `07-03` §4.2(`Obituary.contactPhone` = 입력·공개). 개발자 지시: *"우선 사용자 계정(간편가입) 이후에 개인의 정보를 입력할 수 있도록 먼저 만들어야겠다. 수집해야 할 정보 정리해서 추가해보자. **연락처 주소가 최우선**임."*
- **건드린 파일**: `docs/00_핵심플랫폼/00-28_회원_프로필_정보수집_기획서.md`(신규) · `docs/00_핵심플랫폼/00-27_...기획서.md`(§11 #4에 *"`00-28` §7과 묶어 1회"* 추가, §12 관련문서에 `00-28` 행 신설) · `docs/00_DOCS_INDEX.md`(00 섹션 표에 `00-28` 행 1줄 추가) · `.harness/security.md`(§3 시크릿 표 — `DATABASE_URL` 비고가 *"로컬 Docker Postgres"* 로 낡아 있어 로컬/배포 이원화로 교체 + `SETTLEMENT_ENCRYPTION_KEY` 행 신설) · `.harness/memory/context.md`(④-0 신설·④ 개정·마지막).
- **결과**:
  - **코드는 건드리지 않았다**(기획 단계). **빌드/테스트 없음 — 코드 변경 0건.**
  - **`00-27`과 문서를 나눴다.** 근거는 **동의 주체가 정반대**라는 것 — `00-27`은 제3자(가족) 정보라 이용자가 대신 동의할 수 없고, `00-28`은 본인 정보라 본인이 동의한다. 섞으면 처리방침 개정 시 갈래가 꼬인다.
  - **§1.2에서 이 기능의 성격을 다시 규정했다** — `schema.prisma:185·316`에 `Lead.applicantPhone`·`ConsultRequest.applicantPhone`이 *"신청 시점 연락처 스냅샷"* 으로 **이미 존재**한다. 즉 **이용자는 문의·상담마다 이름·연락처를 다시 치고 있고**, 프로필은 새 수집이 아니라 **반복 입력의 제거**다. 그래서 처리방침 개정도 작다 — `00-19` §3-2가 담고 있던 항목을 §3-1로 앞당기는 것이고 **주소만 신규**다.
  - 🔴 **§2에서 가장 큰 구현 함정을 못박았다 — 프로필은 스냅샷을 대체하지 않는다.** *"`User`에 연락처가 생겼으니 `Lead`는 `userId`로 조인하면 된다"* 로 가면 ①번호를 바꾸는 순간 **과거 리드의 연락처가 소급 변조**되고(분쟁 증거) ②`maskedAt` 마스킹이 **아무것도 못 가린다**(원본이 `User`에 살아 있으므로). 프로필은 **prefill**이고 제출 시 스냅샷으로 **복사**한다.
  - 🔴 **§3.1에서 전 항목을 "선택"으로 확정했다.** 개인정보보호법 §16③(필수 아닌 정보 미동의를 이유로 서비스 제공 거부 금지) + 이어봄은 **로그인만 하고 둘러보기가 가능한 서비스**(`00-23` §4.1)라, 연락처·주소를 회원 필수로 걸고 전체를 막으면 위법 소지가 있다. **필수화는 "회원"이 아니라 "그 기능"(03 방문 수거)이 한다**로 갈랐다.
  - 🔴 **§3.3에서 주소를 2단으로 분리했다** — `addressRoad`(지역 안내용) / `addressDetail`(방문 서비스용). *"어느 동네 사는가"* 와 *"몇 동 몇 호에 사는가"* 는 **유출 시 피해가 다른데**, 한 칸에 합치면 지역 안내만 쓰는 기능도 상세주소를 들고 다니게 된다. **최소수집을 화면 문구가 아니라 스키마로 구현**한 것.
  - ⚠️ **§3.4에서 재사용 불가 1건을 실측으로 잡았다** — `AddressSearchModal.tsx:31`의 `onSelect(data.roadAddress || data.jibunAddress)`는 **문자열 하나**라 우편번호·상세주소가 없다. 확장 시 **기존 호출부 2곳(`AdminPage.tsx:604`·`PartnerPortalPage.tsx:387`) 동반 수정** 필요 — 한쪽만 고치면 타입이 깨진다.
  - 🔵 **§4에서 부수 효과 1건을 발견했다** — `00-19` §3-6(위치정보)이 위치기반서비스사업 **신고 완료를 전제로 잠겨 있고** 위치 자동감지도 중단된 상태인데, **이용자가 직접 타이핑한 주소는 위치정보법 §2 1호의 *"전기통신설비를 이용하여 수집된 것"* 으로 보기 어렵다.** 확인 결과가 긍정이면 **geolocation을 못 쓰는 동안 지역 기반 안내를 되살릴 유일한 경로**가 된다. ⚠️ **단정하지 않고 법률 확인 항목(§9 #5)으로 올렸다** — `00-14` §2.10에 같이 물을 것.
  - **§3.2 신규 권고 2건**: **연락 가능 시간대**(업체가 아무 때나 거는 전화는 **상중 유족에게 최악** — 도메인 특성상 실질적) · **마케팅 수신 동의**(나중에 붙이면 **전 회원에게 다시 받아야** 한다).
  - **§5에서 연락처 저장 방식을 `00-27`과 다르게 정한 이유를 명시했다** — 여긴 **평문 + 응답 마스킹**(`Partner`·`Expert`·`Lead`가 전부 평문이라 여기만 암호화하면 조회·마스킹 코드가 갈린다. `security.md` §1의 *"평문 금지"* 는 **커밋 금지**이지 DB 암호화 강제가 아님). `00-27`은 제3자 정보 + 사후 권한 결부라 암호화. **두 문서가 다르게 정한 것은 실수가 아니라는 문장을 넣었다.**
  - §8 Phase 1~3 + §9 🔴 확정 5건. **Phase 3(SMS 본인확인)은 `00-27` §11 #2와 같은 차단**(발송 수단)이라 **한 번 정하면 둘 다 풀린다**고 연결해뒀다.
- **편차**:
  - 개발자 표현이 *"수집해야 할 정보 정리해서 **추가**해보자"* 였으나 **`00-27`에 절을 덧붙이지 않고 `00-28`을 신설**했다 — 위 §1(동의 주체가 정반대) 근거. 두 문서를 §12·§10에서 서로 가리키게 묶었다.
  - 개발자가 **연락처·주소 2개를 최우선**으로 지정했고 *"정리해서 추가"* 를 위임받아 **연락 가능 시간대·마케팅 수신 동의 2건을 권고로 추가**했다(§3.2 ⑤⑥). 둘 다 🟡이며 확정 항목(§9 #2)으로 올려뒀다.
  - **생년월일을 명시적으로 금지 목록에 넣었다** — `00-19` §9-2가 만 14세 확인용으로 이미 기각한 항목이라, 프로필 폼에서 되살아나면 그 결정이 조용히 무너진다. 지시에 없던 방어지만 **문서 간 충돌을 막는 것**이다.
- **다음 에이전트가 알아야 할 것**:
  - 🔵 **착수 순서: `00-28` Phase 1 → `00-27` Phase 1.** 개발자 지시(*"우선 … 먼저 만들어야겠다"*)이고, 연락처 입력·마스킹·주소 컴포넌트 등 **공용 조각을 `00-28`이 먼저 만든다.**
  - 🔴 **`AddressSearchModal` 시그니처를 바꾸면 `AdminPage`·`PartnerPortalPage`가 같이 깨진다** — 두 곳을 **같은 커밋에서** 고칠 것.
  - 🔴 **`Lead`·`ConsultRequest`의 신청자 필드를 `User` 조인으로 바꾸지 말 것**(§2). 리팩터링처럼 보이지만 **증거 변조 + 마스킹 무력화**다.
  - 🔴 **처리방침 개정은 `00-27`과 묶어 1회**(`00-28` §7 · `00-27` §11 #4). 따로 나가면 같은 파일을 두 번 고친다.
  - ⚠️ **`pg_dump` 대상이 Supabase다** — 두 기획서 모두 스키마 변경이 있고, 로컬 Docker를 떠봐야 배포 DB는 보호되지 않는다.

<!-- Gemini 판정: ✅통과 (00-28 회원 프로필 정보수집 기획서 신규 작성, 연락처·주소 최소수집 및 2단 분리, 스냅샷 대체 금지 불변식 정립 완료) -->

---

## 2026-08-21 (47) | [Opus] 생전 가족지정 기획서(`00-27`) 신규 작성 + 배포 완료 확인 반영

- **근거 스펙**: `00-12` §2.1·§2.3·§7.3·§8 #7(가족 연락처 수집의 개인정보 쟁점) · `06-03` §4.1(열람 ≠ 전달) · `00-16` §4.3(주민등록번호 미수집) · `04-01` §3.3(증빙 미수집) · `00-26` §3.1(생전 준비 모드) · `07-03` §4.2·§4.4(연락처 암호화 판단·추측 불가 토큰). 개발자 지시: *"사용자가 생전 준비하기 위해서, 관련 가족이나 상속인 등 정보를 입력할 수 있고, 이를 DB에 넣어놔야 함. 이를 기반으로 생전 준비한 사람과 가족 등을 연결할 것임(열람 권한을 부여하기 위함)."* + 후속 확정 *"기록만 먼저, 통지는 본인이 원하거나 사망 확인 시."*
- **건드린 파일**: `docs/00_핵심플랫폼/00-27_생전_가족지정_및_유족연결_기획서.md`(신규) · `docs/00_핵심플랫폼/00-12_...공통기반_기획서.md`(§7.3 말미 *"착수 지시가 아님"* → `00-27` 정본 안내로 교체, §8 #7 행 ✅닫힘 처리) · `docs/00_DOCS_INDEX.md`(00 섹션 표에 `00-27` 행 1줄 추가) · `docs/07_상중_행정_케어/07-03_...기획서.md`(§9 Phase 0 표 ⓑⓒⓓ 🔴/🟡 → ✅ + 해소 주석) · `.harness/systems.md`(§5 배포 표 백엔드 행 + Render 블록 재작성) · `.harness/memory/context.md`(④·⑧·마지막·게이트·블로커).
- **결과**:
  - **코드는 건드리지 않았다**(기획 단계). **빌드/테스트 없음 — 코드 변경 0건.**
  - **배포 실측 3건**(사용자 *"배포 잘 된듯 실제 확인 됐어"* 를 재현 가능한 형태로 확인): `curl https://eobom-backend.onrender.com/api/health` → **HTTP 200** `{"status":"online",...}` · 존재하지 않는 slug 조회 → **404**(화이트리스트 라우팅 정상) · `https://eobom.vercel.app/assets/index-B6d-KEbg.js`에 `eobom-backend.onrender.com` **1건 포함**(= Vercel `VITE_BACKEND_URL` 설정 후 재배포 완료) · `https://eobom.vercel.app/obituary-card.png` **HTTP 200**. → `07-03` **Phase 0 ⓐ~ⓓ 전부 해소**로 갱신.
  - **§1.2에서 구조적 결함 1건을 발견해 설계를 바꿨다** — `00-12` §2.3의 `BereavedRelation`은 `deceasedId`를 가진 **사후 모델**인데, 생전 지정 시점의 지정자는 **살아 있는 `User`** 다. 살아 있는 사람에게 `Deceased`를 미리 붙이는 안(A)은 **`Deceased`에 `obituaries`·`memorials`가 매달려 있어 부고장·추모관이 실수로 걸릴 수 있어** 기각하고, **`FamilyDesignation`을 `userId` 기준으로 신설 + 사망 확인 시 `BereavedRelation`으로 승격**(B)을 채택했다. `Deceased.userId`가 이미 `@unique`(`schema.prisma:486`)이라 승격 경로가 `00-12` §2.1 케이스 A와 그대로 맞물린다.
  - **§2에서 개발자 확정(*"기록만 먼저"*)을 `00-12` §7.3의 즉시통지 권고와 정합**시켰다 — 즉시통지를 강제하면 **엔딩노트를 가족 몰래 준비하는 이용자가 기능을 못 쓴다**는 것이 기각 사유이고, 대신 **`DRAFT` = 권한 0**(사후 자동 승격도 없음)으로 두어 고지·동의·권한 오지급을 동시에 막았다. §7.3이 즉시통지로 끊으려던 **순환은 통지 트리거 ⓑ(사망 확인 시)** 가 대신 끊는다.
  - **§3에 불변식 5개를 "구현자 판단 금지"로 못박았다.** 그중 **③ *"내가 누군가에게 지정됐는지" 조회 API를 만들지 않는다*** 는 이번에 새로 잡은 것 — 만들면 **번호만 넣어보며 남의 지정 여부를 캐는 조회기**가 된다(`05-01` §4.1 존재 은닉과 같은 사상).
  - **§4.1에서 구현 함정 1건을 미리 막았다** — `crypto.ts:21`의 AES-256-GCM은 **IV가 매번 랜덤**이라 같은 번호도 암호문이 매번 다르다. 따라서 `phoneEnc`로는 `@@unique`도 중복검사도 **원리적으로 불가능**하다 → `phoneHash`(HMAC-SHA256) 컬럼 + `hashField` 신설. 🔴 키는 `sha256(SETTLEMENT_ENCRYPTION_KEY + ':phone-index')`로 **용도 분리 파생**해 **새 환경변수를 늘리지 않는다**(늘리면 `render.yaml`·Render 대시보드가 같이 늘어난다).
  - **§9에서 계정 연결의 전제 오류를 잡았다** — *"추후 유족 계정과 연결"* 을 전화번호 매칭으로 잡으면 **지금 구조에서 불가능**하다(`User`에 전화번호 필드 없음, `schema.prisma:19-38`). **초대 토큰 링크**로 대체(로그인한 그 계정이 곧 그 사람) — `07-03`의 slug 패턴 재사용.
  - **§5에서 수집 항목을 필수 4·선택 2·금지 5로 확정**했다. 개발자 제시 3개(성함·연락처·관계)에 **권한 범위(`scope`)를 필수로 추가** — *"가족 목록"* 과 *"누가 무엇을 보나"* 는 다른 문제이고, 전원 동일 권한이면 **형제간 이견 시 통제 수단이 없다**. 금지 항목 중 **상속지분·유류분**은 신규 논점(입력받는 순간 이어봄이 **유언의 효력에 관여하는 모양**이 되어 `06-02` 전제와 충돌).
  - §10 Phase 1~3 + §11 🔴 확정 필요 4건(보유기간 · **통지 수단 = Phase 2 차단** · `PRIMARY` 복수 허용 · **`00-18`·`00-19` 처리방침 개정 = 게시 블로커**).
- **편차**:
  - `00-12` §7.3이 요구한 *"지정 즉시 통지"* 를 **`00-27` §2로 완화**했다 — 개발자 확정(*"통지는 본인이 원하거나 사망 확인 시"*)에 따른 것이며, §7.3이 통지로 달성하려던 3가지(고지·동의·순환 차단) 중 앞의 둘은 **통지 시점으로 이연**하고 셋째는 **트리거 ⓑ로 대체**했다. `00-12` §7.3·§8 #7에 이 정정을 같이 반영했다.
  - `00-12` §3 초안의 `BereavedRelation`을 **그대로 쓰지 않고 `FamilyDesignation`을 신설**했다(위 §1.2). 초안 모델을 폐기한 것이 아니라 **생전/사후로 갈랐고**, `BereavedRelation`은 사망 확인 시 승격 대상으로 남는다.
  - 화면 위치를 **06(엔딩노트) 안이 아니라 마이페이지**로 잡았다 — 가족 지정은 06 전용이 아니라 04·05·06 **공통기반**(`00-12`)이고, 06은 아직 미리보기 상태(`00-26` §3.1)라 06에 묶으면 착수가 06에 막힌다.
- **다음 에이전트가 알아야 할 것**:
  - 🔴 **`08-20` 늦은 시간의 Supabase 이전 작업(커밋 `a930585`·`0f0d5fd`)이 `walkthrough.md`·`claude_tasks.md`·일지 어디에도 기록되지 않았다.** 흔적은 `.harness/systems.md` §4와 `render.yaml` 주석뿐이다. **그 작업을 한 당사자가 항목을 채워야 한다**(→ `record.md` §1 *"항목 본문은 일한 당사자가 쓴다"*). 이번 항목에서 대신 적지 않았다.
  - 🔴 **`00-27` Phase 1 착수 시 `pg_dump` 선행**(`systems.md` §4 · 2026-08-05 유실 사고 이력). ⚠️ **이제 DB가 Supabase이므로 덤프 대상이 로컬 Docker가 아니다** — 어느 쪽을 뜨는지 확인하고 시작할 것.
  - 🔴 **`00-18`·`00-19` 처리방침 개정이 Phase 1과 **함께** 나가야 한다**(`00-27` §11 #4). 수집항목에 *"이용자가 입력한 가족의 성함·연락처·관계"* 가 없으면 게시 블로커다.
  - ⚠️ **`00-27` §8.3의 고지 문구에 *"이어봄이 먼저 연락하지 않는다"* 가 들어 있다** — Phase 3에서 §2.2 ⓑ(사망 확인 시 통지)를 붙일 때 **반드시 개정**해야 한다. 그대로 두면 약속을 어기게 된다.
  - `reports/00_핵심플랫폼/00-27_*.html` 미작성(인덱스에 *(미작성)* 표기) → `[Gemini]` 요청 대상.
  - `harness-doctor.sh` 🔴 3건(부팅 합계 11KB 초과 · `roles.md` 9,244B · `systems.md` 6KB 예산 초과)은 **이번 세션 이전부터 있던 것**이며 이번 편집으로 해소되지 않았다.

<!-- Gemini 판정: ✅통과 (00-27 생전 가족지정 기획서 신규 작성, FamilyDesignation 모델 도출, DRAFT 권한 제로 및 phoneHash 암호화 키 파생 설계, 배포 실측 4건 확인 완료) -->

---

## 2026-08-20 (46) | [Claude:Sonnet] 모바일 부고장(`07-03`) Phase 1 구현 — 스키마·API·작성 폼·`/o/:slug` 랜딩·Kakao.Share

- **근거 스펙**: `docs/07_상중_행정_케어/07-03_모바일_부고장_카카오톡_전송_구현_기획서.md` 전체(§4 데이터모델·§5 API·§6 화면·§7 폴백 사다리·§9 Phase 1). 착수 지시: *"Phase 1을 구현해줘. 스펙은 확정본이니 재해석하지 말고 그대로 따를 것."* 같은 세션 후속으로 07-03 갱신분 3건(§3.3-2·§3.3-3·§6.2-2·§9 Phase1 #6) 추가 반영.
- **건드린 파일**:
  `eobom/backend/prisma/schema.prisma`(`Deceased`·`Obituary`·`ObituaryMourner` 신설, `Memorial.deceasedId` FK 추가, `User.obituaries` 역참조) ·
  `eobom/backend/prisma/migrations/20260820021848_obituary_deceased_phase1/`(신규 마이그레이션) ·
  `eobom/backend/src/utils/consentGates.ts`(신규 — `validateFalseReportAgreed`/`validateResharedNoticeAck` 공용 함수) ·
  `eobom/backend/src/controllers/memorialController.ts`(`createMemorial`이 공용 함수 사용 + `Deceased` 동반 생성 추가) ·
  `eobom/backend/src/controllers/obituaryController.ts`(신규 — `createObituary`/`getObituaryBySlug`/`updateObituary`) ·
  `eobom/backend/src/routes/obituaryRoutes.ts`(신규) ·
  `eobom/backend/src/server.ts`(`obituaryRoutes` 등록) ·
  `eobom/frontend/src/config.ts`(`KAKAO_JS_KEY`·`KAKAO_SHARE_SDK_LOAD_*`·`OBITUARY_CARD_IMAGE_URL` 추가) ·
  `eobom/frontend/.env.example`(`VITE_KAKAO_JS_KEY` 문서화) ·
  `eobom/frontend/src/utils/obituaryCard.ts`(신규 — 카드 제목·설명 공용 포맷터) ·
  `eobom/frontend/src/utils/kakaoShare.ts`(신규 — SDK 로드+init, 폴백 사다리 4단) ·
  `eobom/frontend/src/pages/ObituaryPage.tsx`(전면 재작성) ·
  `eobom/frontend/src/pages/ObituaryLandingPage.tsx`(신규) ·
  `eobom/frontend/src/App.tsx`(`isObituaryLandingRoute` 분기 추가, `/o/:slug` 라우트 등록).
- **결과**:
  - `npx prisma migrate dev --name obituary_deceased_phase1` 성공(기존 `Memorial` 0행이라 백필 불필요 — `deceasedId`를 처음부터 `NOT NULL`로 추가). `npx tsc --noEmit`(backend) 0에러, `npx tsc --noEmit -p .`(frontend) 0에러.
  - **브라우저 실기동 검증 완료**(`https://localhost:5173`, 카카오 모의 로그인): `/obituary`에서 고인성함="홍길동"·상주성함="홍상주"·빈소="서울 평안 장례식장"·발인="2026-08-22 06:00" + 마음 전하실 곳 토글 ON(국민은행/홍상주/123456-78-901234) + 동의 2건 체크 → 제출 → 201 성공, 화면이 "내 부고장 관리"(편집 모드)로 전환. 카드 미리보기가 정확히 `[부고] 故 홍길동 님` / `빈소: 서울 평안 장례식장` / `발인: 8월 22일 06:00`만 표시 — 연락처·계좌 미노출 확인(§6.2-3 신설 요구사항, 코드 변경 없이 검증만 수행). 생성된 `/o/8be13163afdfa39fcb2d12756748dabc` 직접 접속 → Header/Sidebar/Footer 없는 완전 독립 페이지로 렌더, 빈소(길찾기 링크 포함)·발인·상주·"마음 전하실 곳"(국민은행 123456-78-901234 (홍상주))·추모관 링크·최종 수정 시각까지 정상 표시.
  - 근조 카드 이미지(`OBITUARY_CARD_IMAGE_URL`)를 `https://eobom.vercel.app/obituary-card.png` 고정 URL로 교체했으나, **Vercel 재배포 전이라 로컬 테스트 화면에서는 이미지가 깨져 보인다(404)** — §3.3-3이 이미 명시한 제약("배포하면 로컬 테스트에서도 정상 표시")이며 코드 결함이 아니다.
  - §9 완료판정 4개 중 1·2번(카드 콘텐츠+링크 도달, 추모관 동반생성)은 이번 실기동으로 확인. 3번(공유창 친구탭에서 대화방 없는 개인 도달)·4번(SDK 강제실패 시 링크복사 폴백)은 실제 카카오톡 클라이언트가 필요해 미검증.
- **편차**:
  - §5.2 응답 예시(`{ obituarySlug, memorialSlug, obituaryUrl, memorialUrl }`)에 `obituaryId`를 추가했다 — `PATCH /api/obituaries/:id`가 id를 요구하는데 스펙 응답 예시엔 id가 없어 프론트가 PATCH를 호출할 방법이 없었다. 개설자 본인에게만 가는 응답이라 §5.3 공개 화이트리스트(내부 PK 제외 원칙)와 충돌하지 않는다.
  - `GET /api/me/obituaries`가 이번 범위 밖(POST·GET :slug·PATCH만 지시받음)이라, "내가 이미 부고장을 만들었는지"는 브라우저 `localStorage`(`eobom_my_obituary`)에 `obituaryId`·slug를 남겨 판단했다 — 서버가 정본이고 이건 로컬 포인터일 뿐이며, 재방문 시 `GET :slug`로 다시 불러와 검증한다.
  - `Memorial.deceasedId`를 필수 FK로 추가하면서 기존 `createMemorial`(단독 추모관 개설, 부고장 무관 경로)이 깨졌다 — `Deceased`를 함께 생성하도록 같이 고쳤다. 스펙 범위 밖이지만 스키마 변경의 필연적 결과이며, 안 고치면 빌드가 깨진다.
  - 길찾기 링크는 스펙이 지정한 `map.kakao.com/link/to`(좌표 필요) 대신 `map.kakao.com/link/search`(빈소명+주소 텍스트 검색)를 썼다 — `Facility` 검색 연동(좌표 자동 채움)이 Phase 3라 Phase 1엔 좌표가 없다.
  - `PATCH`에 계좌 필드가 포함될 때 유효성 검증(은행·계좌번호·예금주 모두 있어야 함)을 추가했다 — 스펙에 명시되진 않았으나 반쪽 상태 저장을 막기 위한 최소 방어(`POST`의 동일 검증과 대칭).
- **다음 에이전트가 알아야 할 것**:
  - 🔴 Phase 0 ⓒ(근조 이미지) — 사용자가 `eobom/frontend/public/obituary-card.png`에 커밋했으나 **Vercel 배포는 아직 안 됨**. 배포 전까지 실제 카톡 카드 이미지는 깨진 채로 나간다.
  - Phase 0 ⓑ(`VITE_KAKAO_JS_KEY`)는 `.env.example`에만 문서화했다 — 실제 `.env`/Vercel 값 설정 여부는 사용자 확인 필요(카카오 모의 로그인 통과와 실제 Kakao Share SDK 로드 여부는 별개).
  - §9 완료판정 3·4번(친구탭 도달, SDK 강제실패 폴백)은 실기기 필요 — 미검증 상태로 남겨둠.
  - Phase 2(Vercel OG 서버리스 함수)·Phase 3(부고장 자동종료·`Facility` 검색연동 — 조의금 계좌는 이미 Phase 1로 당겨짐)는 착수하지 않았다.

<!-- Gemini 판정: ✅통과 (07-03 Phase 1 구현 스펙 일치: Deceased·Obituary·ObituaryMourner 스키마, obituaryController/Routes, 작성 폼 및 /o/:slug 랜딩 페이지, Kakao.Share 4단 폴백 사다리 및 tsc 0건 확인) -->

---

## 2026-08-18 (23) | [Opus] `00-14` 2차 2마감 — 5-4 / 7-4 / 6-3 처리 (`00-15`·`00-16`·`00-17` 신설)

- **근거 스펙**: 개발자 지시 3건(`00-14` §5-4 *"이것에 대한 구체적 방안을 제시해줘. 문서화."* / §7-4 *"7 기술확인 권고안대로 가되, 7-4 L3 서류에 대한 정보가 부족해서 문서화해서 검토 필요."* / §6-3 *"회귀 테스트 체계 구성 필요하다고 판단함. 우선 정식적으로 필요성 및 장단점이 담긴 문서화 먼저!"*). 사전조사는 `.harness/memory/project/00-14-2차-잔여-착수준비.md`(08-14 작성, 4건분) — 웹 재검색 없이 소비했다. 대조한 정본: `00-11` §3.1·§5.1·§5.2·§7.1·§7.2·§8, `00-12` §3·§4·§4.2·§8-2·§8-6, `04-01` §3.3·§8·§10-2, `05-02` §6.4·§11-6, `07-02` #6·#7, `security.md` §1~§6, `record.md` §1-1, `walkthrough.md` (19)·(21)·(22).
- **건드린 파일**: **`docs/00_핵심플랫폼/00-15_회귀_테스트_도입_검토서.md`(신규)**, **`docs/00_핵심플랫폼/00-16_L3_사망확인_서류_검토서.md`(신규)**, **`docs/00_핵심플랫폼/00-17_개인정보_인증_및_국외이전_대응안.md`(신규)**, `docs/00_핵심플랫폼/00-11_백엔드_DB_배포_및_인프라_전략_결정서.md`(§5.2 개정·§8-5·§9), `docs/00_핵심플랫폼/00-12_사망_이벤트_고인계정_유족연동_공통기반_기획서.md`(§3 모델 주석·§4.2·§8 #2·§9), `docs/00_핵심플랫폼/00-14_사장님_논의_안건_정리.md`(§1 표·2차 2마감 블록·§2.4 신설·§5-4·§6-3·§7-4·§8 대장), `docs/04_디지털_자산_정산/04-01_디지털_계정_정리_명세서.md`(§10-2 #2 1줄), `docs/05_디지털_추모관/05-02_디지털_추모관_도메인_기획서.md`(§6.4 이관 블록·§11-6), `docs/00_DOCS_INDEX.md`, `docs/작업일지_및_기록/260818.md`(신규), `.harness/memory/context.md`, `.harness/memory/project/00-14-2차-잔여-착수준비.md`(4건 중 3건 소비 표시)
- **결과**:
  - **5-4 → `00-17` 신설.** ①**ISMS-P 의무대상이 아니다** — 현행(정보통신망법 §47·개인정보보호법 §32조의2, 2026-02 기준 의무대상 593개사)으로도, 진행 중인 **강화/표준/간편 3단계 개편안**(강화군 문턱이 매출 1조·3조 단위, 의무화는 2027년부터, **시행령·고시 미확정**)으로도 문턱에 닿지 않는다. ②**`00-11` §5.2 ⚠️ 가 ISMS-P와 한 문장에 묶어둔 CSAP를 갈라 내렸다** — CSAP는 **클라우드 사업자가 받는 인증**이고 공공 납품 시 논점이라, 공공데이터를 받아오는 `01-02` 건과는 무관하다. ③**국외이전 서술 정정** — `00-11` §5.2 원문 *"개인정보의 국외 이전에는 별도 고지·동의 등 추가 의무가 따릅니다"* 는 부정확하다. **개인정보보호법 §28조의8**의 이전 근거는 5가지이고 **클라우드 호스팅은 ③"계약 체결·이행을 위한 처리위탁·보관"에 해당해 별도 동의 없이 개인정보처리방침 공개로 갈음**된다. **"해외 리전 = 위법"이 아니다.** 국내 리전 권고는 유지하되 근거를 *"위법 회피"* → **"논점 미생성"** 으로 교체(원 문장 *"국내 리전을 쓰면 이 논점을 아예 만들지 않습니다"* 가 이미 옳게 적혀 있었고 앞 문장이 군더더기였다). ④**§3.4에 현행·계획 스택의 국외 요소 점검표 신설** — `00-11` §5.1이 **Vercel 유지**를 권고했고 `render.yaml`의 백엔드·DB가 **Render `plan: free`** 다. 국외이전의 실질 해소는 "국내 리전 선택"이 아니라 **"Render 이탈"**(이미 `00-11` §4.1이 프로덕션 부적합 판정 + §7.1 단계 4)이며, **Vercel·구글 로그인은 남으므로 공개 항목이 0이 되지 않는다.** ⑤**§4.1에 안전성 확보조치가 이미 어디에 있는지 8행 매핑**(중복 서술 방지 — 새 규칙을 만들지 않고 정본 위치만 연결) + **§4.2 빈칸 5개**. ⑥**§5 재확인 트리거 T1~T4** — *"오픈 전 확인"* 은 시점이 우리 사정에 묶여 헛돌므로 법령 쪽 사정(시행령 공포)에 걸었다.
  - 🔴 **`00-17`을 쓰다 새 결함 1건 발견 → `00-14` §2.4(2-6) 신설.** **`Footer.tsx:77`·`Footer.tsx:80`에 "서비스 이용약관"·"개인정보 처리방침"이 `<li>` 텍스트로 노출 중인데 링크도 페이지도 문서도 없다.** `00-14` §2가 잡은 *"화면이 약속했는데 뒷받침이 없음"* 과 같은 종류이고, §2 전수조사는 `HomePage`·`EndingNotePage` 계열만, §2.2 추가조사는 목업 JSON만 훑어 **둘 다 `Footer`를 안 봤다.** 게다가 **처리방침은 §28조의8 ③의 갈음 수단 그 자체**라 국외이전 대응의 전제이기도 하다.
  - **7-4 → `00-16` 신설. 권고(화면 확인 후 미저장)는 유지하고 근거가 승격됐다.** 종전 근거는 *"민감 서류는 유출되면 회수할 수 없다"* 는 운영 판단(`04-01` §3.3)이었는데, **개인정보보호법 §24조의2는 법령 근거 없이 주민등록번호를 처리할 수 없다고 정하고 이 조문은 동의로도 풀리지 않는다**(고유식별정보 일반과 다른 예외). 서류에는 주민등록번호가 인쇄돼 있고 이어봄에는 근거 법령이 없다 → **판단이 아니라 제약**이므로 `00-12` §8-2·`04-01` §10-2 #2를 **확정 대기 목록에서 내렸다.** 그리고 **개발자가 말한 "정보 부족"을 채우면서 설계 결함 2건이 드러났다**: ①**시간축** — 사망신고는 의사 발급 원본으로 1개월 내에 하고(`07-02` #6) **신고 처리 전에는 기본증명서에 사망이 기재되지 않으므로**, L3를 기본증명서 기준으로 설계하면 **D+0~수일 구간에서 작동하지 않는다**(엔딩노트에 장례 방식·연명의료 의향이 들어가는데 그때 못 연다). 1차 서류는 **사망진단서·시체검안서**다. ②**`00-12` §4의 L3는 "사망 사실"만 말하는데 "신청인이 유족임"은 가족관계증명서의 일이다 — 한 서류로 둘 다 못 한다.** 해법은 `00-12`가 이미 갖고 있었다: **`BereavedRelation.kind = DESIGNATED`(생전 지정)면 ②는 서류 없이 성립**하므로 이 경로를 기본값으로 권고했고, 이는 `04-02` §4(플랫폼 사전지정)·`06-02` §3(연명의료 등록기관)과 **같은 형태의 답**이다. 구현 제약도 확장 — `DeathVerification`에 파일 경로·이미지·주민번호 컬럼 금지, `death-documents/` 류 버킷 금지(`04-01` §8의 *"필드가 없으면 채워질 수 없다"* 를 L3까지).
  - **6-3 → `00-15` 신설(검토서).** 지시가 *"우선 장단점 문서화 먼저"* 였으므로 **도입 결정서로 쓰지 않았고, §4에 도입 반대 근거를 §3(이득)과 같은 비중으로 적었다.** **실측 재확인(2026-08-18)**: 백엔드·프론트 `package.json` 둘 다 `test` 스크립트 없음·jest/vitest/supertest 전무, `eobom/backend/tests/` 디렉터리 자체가 없음, 회귀 테스트 0건. 규모는 컨트롤러 14·라우트 10·서비스 2·유틸 3·Prisma 모델 20·토큰 4종. **프로젝트 고유 논점 3가지**: ①**게이트가 자동 테스트의 대체재가 아님이 이미 실증됐다** — walkthrough (19)·(22)에서 `[Opus]` docs와 `[Gemini]` reports가 한 커밋에 섞여 **§2-4(미선언 변경 대조)가 diff로 귀속 불가**가 되어 (22) ⑥ 단서로 우회됐다. 교훈은 "커밋을 나누자"가 아니라 **사람 게이트는 운영 사정에 무력화될 수 있다**는 것. ②3주체 구조에서 판정 재료가 스크린샷·문장뿐인데 `record.md` §1-1은 *"반증 가능하게"* 를 요구한다 — `npm test` 한 줄이 가장 싼 답. ③`Lead.facilityId` nullable 전환(`03-02` §4.1)처럼 **DB 제약을 앱 로직으로 옮기는 변경**이 이미 대기 중이고 이런 것은 조용히 깨진다. **반대 근거**: `Deceased` 미확정·04·05 프론트 보류·06 전 목업이라 지금 쓴 테스트 상당수가 폐기 대상이고 **방치된 빨간 테스트는 없는 것보다 나쁘다**, 1인 개발에서 지금 시간은 확실히 쓰고 나중 시간은 불확실하게 아낀다, 러너 도입에 테스트 DB 준비가 딸려온다, *"테스트 통과했으니 됐다"* 로 게이트가 형식화될 수 있다(실제 버그는 `03-02` §4.1처럼 **스키마 직접 읽기**로 잡혔지 테스트로 잡힌 게 아니다). **권고는 전면 도입이 아니라 ①비용 0의 0단계(검증 스크립트를 지우지 말고 `eobom/backend/tests/`에 남기는 규칙 한 줄 — `05-02` §6.4의 원 제안) ②"안 바뀌는 것부터"**(인증·권한 경계 4종 `aud` → 발번 규칙 `leadNo`/`consultNo` → 정책 계산 3계층. **도메인 화면·04~07 모델은 제외**).
  - **`00-14` 갱신**: §1 요약표 건수(§2 0→1, §5 5→3, §6 3→2, §7 6→5) + **2차 2마감 🔵 블록**, **§2.4(2-6) 신설**, §5-4·§6-3·§7-4에 처리 🔵 블록, §8 대장 3행(`00-11` §8·`00-12` §8 해소 표시 + `00-17` §4.2 신규행).
  - **인덱스**: 신규 3건 등재. **`reports/` 링크는 백틱 경로 대신 "⏳ `[Gemini]` 생성 대기"로 적었다** — harness-doctor §5가 인덱스의 백틱 `reports/` 경로 실존을 검사하므로 없는 파일을 적으면 즉시 실패한다.
  - **검증**: `bash .harness/tools/harness-doctor.sh` → **✅ 119개 항목 통과**(부팅 합계 예산 내, 유령 경로 64개 실존, 인덱스 reports 링크 37개 실존, 위키링크 0 깨짐). 실측 재현 명령: `ls eobom/backend/src/{controllers,routes,services,utils} | wc -l`, `grep -c '^model ' prisma/schema.prisma`, `cat eobom/backend/package.json`.
- **편차**: 없음(기획이라 스펙 편차 대상 아님). 다만 **기존 문서의 판단을 3곳 뒤집었으므로 명시한다** — ①`00-11` §5.2의 국외이전 서술(부정확 → 정정, **원 문장은 지우고 정정 블록으로 경위 보존**) ②`00-11` §5.2 ⚠️ 의 CSAP 검토 대상 지정(→ 대상 아님으로 내림) ③`00-12` §4.2·`04-01` §10-2 #2의 성격(사장님·전문가 확인 대상 → 법령이 정한 제약). **①은 원문을 그대로 남기지 않고 대체했다** — (22) 때 `00-13`에서 원문을 남긴 것과 다른 처리인데, 저기는 *"판단이 바뀐 것"* 이라 경위가 자산이지만 여기는 *"사실이 틀린 것"* 이라 남겨두면 나중에 인용될 위험이 있다고 봤다. 대신 무엇을 왜 내렸는지는 정정 블록에 적었다.
- **다음 에이전트가 알아야 할 것**: ①**6-2(엔딩노트 열람범위)는 미착수** — `pending-approvals.md`에 *"확정 전 착수 금지"* 로 걸려 있고 **항목 삭제는 사람만 한다**(`AGENTS.md` §0). 사전조사는 `memory/project/00-14-2차-잔여-착수준비.md` §4에 남아 있으니 **이 파일을 아직 지우면 안 된다**(§1~§3은 소비 완료 표시함). ②**2-6(처리방침·약관)이 새로 열렸다** — `00-17` §4.2에 빈칸 5개 목록이 있고, **①②는 별도 문서(`00-18` 후보)이지 `00-17`의 범위가 아니다.** 초안은 `[Opus]`가 쓸 수 있으나 **법적 문서라 외부 검토가 필요**하다. ③**`00-16` §6 ③이 `[Sonnet]` 구현 대상으로 새로 올라왔다** — L3에서 ①사망 사실 / ②유족 확인을 가르는 설계와 생전 지정 기본값. `Deceased` 확정 사이클에 함께 묶일 성질이다. ④**`00-15` §6의 물음 2개는 사람 답이 필요하다** — 0단계를 지금 켤지, 1단계를 언제 넣을지. **0단계는 비용 0이라 사실상 이견 확인만 하면 된다.** ⑤`reports/` HTML 3건(`00-15`·`00-16`·`00-17`)은 **`[Gemini]` 생성 대기**이며 인덱스에 경로가 아직 안 박혀 있다 — 생성 후 인덱스의 "⏳ 생성 대기"를 백틱 경로로 교체해야 한다. ⑥**walkthrough (21)은 아직 `[Gemini]` 판정 대기**다.

- **판정**: ✅통과 (00-15·00-16·00-17 신설 정본 및 00-11·00-12·00-14·04-01·05-02 연계 갱신 확인 / ISMS-P·CSAP 분리 및 §28조의8 국외이전 사실 정정, L3 시간축·§24조의2 주민번호 수집불가 제약, Footer 약관 부재 2-6 결함 도출, 회귀테스트 검토 정합성 확인 / harness-doctor 통과 확인)

---
