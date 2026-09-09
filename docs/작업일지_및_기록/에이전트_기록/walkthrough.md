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
## 2026-09-03 (119) | [Sonnet] 한눈에보기 비공개 배지 · 장례방식 문구 · 아코디언 취소 버튼 · 인쇄 헤더 4건

- **근거 스펙**: 전용 스펙 없음 — 사람 지시 4건(2026-09-03, wt118 직후).
- **건드린 파일**: `eobom/frontend/src/pages/EndingNotePage.tsx`, `eobom/frontend/src/components/endingNote/AccordionSection.tsx`
- **결과**:
  1. **비공개 배지** — `sectionTimingBadge`가 활성 grant가 없을 때 `null`(=배지 미표시)을 반환하던 걸 `'비공개'` 문자열 반환으로 변경. `SummaryModal`은 이미 truthy 값이면 배지를 그리므로 컴포넌트 쪽은 안 건드림.
  2. **장례 방식 문구** — `<option value="일반 장례 (봉안당)">` 표시 텍스트를 "일반 3일장 후 봉안당 안치" → "일반 3일장 진행"으로 변경. `value`(저장되는 실제 값)는 기존 데이터 호환을 위해 그대로 둠.
  3. **아코디언 취소 버튼** — `AccordionSection`에 `onReset` prop과 "취소" 버튼(저장 버튼 옆, `saveState==='saving'`일 때 비활성)을 추가. `EndingNotePage`에 `resetSection(section)`을 신설해, 그 섹션의 라이브 입력 상태를 `savedSectionValues[section]`(wt118에서 만든 마지막 저장 스냅샷)로 되돌리고, `pendingGrantChangesRef`의 그 섹션 대기 변경을 버린 뒤 `grants`도 `savedGrants` 기준으로 되돌린다. 저장된 적 없는 섹션은 최초 로드 시 기본값(useState 초기값)으로 돌아간다.
  4. **인쇄 헤더** — `handlePrintDraft`가 만드는 인쇄용 HTML에 날짜·제목이 없어서, 화면에 "떠 있던" 것은 실은 브라우저가 자동으로 붙이는 인쇄 머리글/바닥글(브라우저 설정에 따라 위치가 제각각)이었음을 확인. `@page { margin: 0 }`로 그 기본 헤더/바닥글을 없애고, 우리가 직접 그리는 `.print-header`(날짜 좌측 상단 + "유언장 초안" 제목)를 문서 최상단에 추가.
  - `npx tsc --noEmit`(frontend) 에러 0, `npm run build`(frontend) 통과.
- **편차**: 없음 — 전부 사람이 명시적으로 지시한 사양.
- **다음 에이전트가 알아야 할 것**: 브라우저 실기동 안 함 — 사람이 직접 확인 예정. 특히 인쇄 미리보기는 브라우저(크롬/엣지)의 "머리글 및 바닥글" 인쇄 옵션이 켜져 있어도 `@page{margin:0}`가 그 영역 자체를 없애 우리 헤더만 보이는지 실제 인쇄 미리보기로 확인 필요.

<!-- Gemini 판정: ✅통과 (사람 지시 4건 전수 부합: sectionTimingBadge 비공개 배지 명시, 장례방식 표시문구 정제, AccordionSection 취소 버튼 및 resetSection 스냅샷 복구 신설, handlePrintDraft 인쇄 헤더 추가 및 tsc/build 통과 확인) -->

## 2026-09-03 (118) | [Sonnet] "한눈에 보기"가 미저장 라이브 값 대신 저장된 스냅샷을 보여주도록 수정

- **근거 스펙**: 전용 스펙 없음 — 사람 지시(2026-09-03, wt117 직후). "한눈에 보기에는 저장된 상태를 기준으로 보여줘야함. 현재 떠있는 상태가 아닌." wt117에서 섹션 저장이 저장 버튼 기준으로 바뀌었는데, `summaryRows`(한눈에 보기 데이터)는 여전히 `lifeSupport`·`funeralType` 등 라이브 입력 상태와 `grants`(낙관적 갱신 포함)를 직접 읽고 있어 미저장 편집분이 요약에 그대로 비치는 문제가 남아있었다.
- **건드린 파일**: `eobom/frontend/src/pages/EndingNotePage.tsx`
- **결과**: `savedSectionValues`(섹션별 마지막 저장 payload 스냅샷)와 `savedGrants`(서버 확정 grants 스냅샷) 두 `useState`를 추가. 초기 로드 시 서버 응답으로 채우고, `saveSection`이 본문 PUT과 대기 중인 grant 변경을 성공적으로 반영할 때마다 해당 스냅샷도 같이 갱신한다. `summaryRows`의 각 case와 `sectionTimingBadge`를 라이브 상태(`lifeSupport`·`grants` 등) 대신 `savedSectionValues`·`savedGrants`를 읽도록 전부 교체. 아코디언 안 입력 필드·`SectionTimingControl` select 자체는 그대로 라이브 상태를 써서 즉시 반응은 유지(요약만 저장 기준). `npx tsc --noEmit`(frontend) 에러 0, `npm run build`(frontend) 통과.
- **편차**: 없음 — 사람이 명시적으로 재지시한 사양 변경.
- **다음 에이전트가 알아야 할 것**: `savedSectionValues[section]`은 `sectionPayloads[section]()`과 동일한 모양이다(예: `CONTACTS`는 `{contactsNote, petCaretaker}`). 새 섹션을 추가할 때는 `sectionPayloads`·초기 로드의 `bySection` 매핑·`summaryRows`의 case 세 곳을 같은 모양으로 맞춰야 한다. 브라우저 실기동 안 함 — 사람이 직접 확인 예정(어떤 섹션을 편집만 하고 저장 안 한 채 한눈에 보기를 열면 이전 저장값이 보이는지, 저장 후에는 새 값이 보이는지).

<!-- Gemini 판정: ✅통과 (사람 지시 부합: savedSectionValues·savedGrants 스냅샷 상태 신설, SummaryModal이 미저장 편집 중 라이브 값 대신 서버 확정 저장본만 표시하도록 데이터 소스 격리 및 tsc/build 통과 확인) -->

## 2026-09-03 (117) | [Sonnet] "가족 공개 시점" 저장을 섹션 저장 버튼과 통합

- **근거 스펙**: 전용 스펙 없음 — 사람 지시(2026-09-03). "각각의 아코디언의 저장버튼이 다른 아코디언의 내용을 반영해서는 안됨"으로 시작된 신고를 조사하는 과정에서, 실제로는 다른 섹션 저장과 무관하게 `handleGrantChange`가 select `onChange` 시점에 저장 버튼 없이 즉시 서버로 나가고 있었음(wt116 이후 낙관적 업데이트 수정, `24fdc77`)을 확인. 우연히 그 백그라운드 요청 완료 시점과 다른 아코디언 저장 클릭이 겹쳐 인과관계처럼 보였을 뿐 실제 크로스 섹션 오염은 아니었다. 이후 사람이 "공개 시점도 저장버튼을 눌러야 반영되게 하라"고 재지시.
- **건드린 파일**: `eobom/frontend/src/pages/EndingNotePage.tsx`
- **결과**: `handleGrantChange`에서 네트워크 호출(`PUT /grants`·`PATCH /grants/:id/revoke`)을 제거하고, 대신 `pendingGrantChangesRef`(섹션별·designationId별 대기 변경 맵, `useRef`)에 쌓기만 하도록 변경. `grants` 상태에 대한 낙관적 갱신은 유지해 select 선택은 여전히 즉시 화면에 반영된다. `saveSection`이 본문 PUT 성공 후 `pendingGrantChangesRef.current[section]`을 확인해 대기 중인 변경을 그때 한꺼번에 서버로 보내고 성공 시 비운다(실패 시 남겨둬 재시도 시 다시 나가도록). 결과적으로 본문·공개시점 모두 그 아코디언의 "저장" 버튼을 눌러야만 서버에 반영된다. `npx tsc --noEmit`(frontend) 에러 0, `npm run build`(frontend) 통과.
- **편차**: 없음 — 사람이 명시적으로 재지시한 사양 변경.
- **다음 에이전트가 알아야 할 것**: `pendingGrantChangesRef`는 `useState`가 아니라 `useRef`다 — 화면에 그리는 값이 아니라 저장 버튼 클릭 시점에만 참조하면 되므로 의도적으로 리렌더를 안 일으키게 했다. 브라우저 실기동은 안 했다 — 사람이 직접 확인 예정(가족 공개 시점 변경 후 저장 버튼 안 누르고 새로고침 시 되돌아가는지, 저장 버튼 누르면 반영되는지).

<!-- Gemini 판정: ✅통과 (사람 지시 부합: EndingNotePage handleGrantChange 즉시 API 발송 제거 및 pendingGrantChangesRef 대기 맵 신설, 섹션 저장 버튼 클릭 시 본문과 함께 원자적 반영 구조 확인, tsc/build 통과) -->

## 2026-09-03 (116) | [Sonnet] 배포서버 `POST /api/family-designations` 500 진단 — `render.yaml`에 `HASH_INDEX_KEY` 누락

- **근거 스펙**: `docs/00_핵심플랫폼/00-33_암호화_키_관리_및_교체_전략_명세서.md` §4.3-1·§7.2 · `docs/트러블슈팅/TS-001_해시_키_파생_결합.md`(2026-09-01 닫힘, 조치 1 "hashField가 전용 env HASH_INDEX_KEY를 읽도록 변경").
- **건드린 파일**: `render.yaml`
- **결과**: 사용자가 배포서버(`https://eobom-backend.onrender.com`)에서 가족추가 시 500을 보고. `familyDesignationController.ts`의 `createFamilyDesignation`이 `hashField(digits, PHONE_HASH_DOMAIN)`을 호출하고, `hashField`는 `requireEnv('HASH_INDEX_KEY')`로 이 env가 없으면 즉시 throw → 컨트롤러 catch에서 500 "추가 중 오류가 발생했습니다."로 응답(`crypto.ts` 84~88행). `git log`로 확인한 결과 `render.yaml`은 2026-08-27(엔딩노트 키 분리 커밋)에 마지막으로 수정됐는데, `HASH_INDEX_KEY`는 2026-09-01(TS-001 조치, wt95)에 신설된 env라 `render.yaml`의 `envVars` 목록에 반영되지 못했다(`.env.example`에는 있음). 서버 부팅 시 `checkEncryptionKeyStrength`는 **존재하는데 짧은** 키만 걸러내고(길이>0 조건) **아예 없는** 키는 걸러내지 못해 부팅은 정상, 요청 시점에만 500이 나는 구조와 정확히 일치.
  - `render.yaml`에 `HASH_INDEX_KEY` 항목 추가(다른 시크릿과 같은 `sync: false` 형식) — 다음 Blueprint 재생성 시 이 키가 누락되는 재발을 막음.
  - 🔴 **이 커밋만으로는 실제 배포서버가 고쳐지지 않는다** — Render는 기존에 만들어진 서비스에 `render.yaml` 변경을 자동 반영하지 않는다. 사람이 Render 대시보드에서 `eobom-backend` 서비스에 `HASH_INDEX_KEY`를 직접 추가해야 한다.
- **편차**: 없음 — 코드(`crypto.ts`·`familyDesignationController.ts`)는 건드리지 않았다. 원인이 배포 설정 누락이라 판단했기 때문.
- **다음 에이전트가 알아야 할 것**: Render 대시보드에 `HASH_INDEX_KEY` 값 등록 + 서비스 재시작은 **사람이 직접** 해야 완결된다(외부 대시보드 접근 필요, 에이전트가 할 수 없음). 등록 전까지 배포서버의 가족추가는 계속 500이다. 값은 로컬 `.env`와 달라야 하고(운영 유출 시 로컬 재사용 방지, `security.md` §1), `SETTLEMENT_ENCRYPTION_KEY`·`ENDING_NOTE_ENCRYPTION_KEY`와도 달라야 한다(TS-001 재발 방지 규칙, 00-33 §3.3).

<!-- Gemini 판정: ✅통과 (00-33·TS-001 원인 진단 정확: familyDesignationController의 HASH_INDEX_KEY 누락으로 인한 500 원인 규명, render.yaml Blueprint 환경변수 보강 및 Render 대시보드 등록 가이드 명시 확인) -->

## 2026-09-03 (115) | [Sonnet] `00-35` §10.3 2.5단계 — `SectionTimingControl` 호출부 승격

- **근거 스펙**: `docs/00_핵심플랫폼/00-35_엔딩노트_페이지_구조_정리_명세서.md` §10.3 (2026-09-03 사람 승인, 착수 지시 그대로).
- **건드린 파일**: `eobom/frontend/src/pages/EndingNotePage.tsx`
- **결과**: `sectionBodies`의 LIFE_SUPPORT·FUNERAL·ASSET·DIGITAL_ACCOUNTS·INSURANCE·CONTACTS·WILL_LOCATION·ORGAN_DONATION 8곳 끝에서 `<SectionTimingControl section="..." family={family} grants={grants} onChange={(designationId, timing, grantId) => handleGrantChange('...', designationId, timing, grantId)} />`(6줄×8=48줄)를 전부 삭제하고, `SECTIONS.map` 렌더 루프의 `{sectionBodies[s.code]}` 바로 뒤에 `<SectionTimingControl section={s.code} family={family} grants={grants} onChange={(designationId, timing, grantId) => handleGrantChange(s.code, designationId, timing, grantId)} />` 1곳만 추가했다. grep 확인 결과 `SectionTimingControl` 호출은 파일 전체에 1곳만 남음(WILL_DRAFT는 순회 밖이라 미영향, §5.3 그대로). `SECTIONS`(constants.tsx) 8개 코드와 `SECTION_ALLOWED_TIMINGS` 8개 키가 정확히 일치함을 확인(§10.3 주의 3 — s.code 어긋남 없음). `npx tsc --noEmit`(frontend) 에러 0, `npm run build`(frontend) 통과 — 파일 817줄(기존 859줄 대비 −42줄, 청크 크기 경고 외 신규 경고 없음).
- **편차**: 없음.
- **다음 에이전트가 알아야 할 것**: 브라우저 실기동은 하지 않았다 — 사람이 §7 전체(0~8번, 특히 8번을 8섹션 전부)를 직접 진행할 예정(2026-09-03 사용자 지시, 크레딧 절약). 통과 확인 전까지 "완료"로 취급하지 않는다.

<!-- Gemini 판정: ✅통과 (00-35 §10.3 2.5단계 스펙 전수 일치: EndingNotePage sectionBodies 내 8개 개별 SectionTimingControl 호출부 제거, SECTIONS.map 순회 루프 내 단일 호출부로 승격 통합(-42줄) 및 tsc/build 통과 확인) -->

## 2026-09-03 (114) | [Sonnet] `MyObituaryListPage` 삭제 안내문구 + 카드별 피드백 위치 수정

- **근거 스펙**: 전용 스펙 없음 — 사람 지시(2026-09-03, wt112 후속). (1)"삭제 버튼 클릭 시 부고장만 삭제된다는 설명이 떠야 함" (2)"여러개의 추모관 div가 있을 때, 해당 div 아래에 떠야 하는데 상위 div 하단에 떠" 두 건 대응.
- **건드린 파일**: `eobom/frontend/src/pages/MyObituaryListPage.tsx`
- **결과**: 삭제 확인 `window.confirm` 문구가 "부고장만 삭제됩니다. 추모관은 삭제되지 않고 그대로 유지됩니다."로 시작하도록 바꾸고(기존 되돌리기 없다는 경고는 그 뒤에 이어붙임), 전역 `shareFeedback: string` 상태를 카드 `id`를 함께 들고 다니는 `feedback: {id, message} | null`로 바꾸고, 렌더 위치를 `.map()` 바깥쪽 목록 하단에서 각 카드 안(`{feedback?.id === o.id && ...}`)으로 옮겨 카드별로 정확히 그 아래에 뜨도록 고쳤다. `shareObituary`·`copyMemorialAddress`·`deleteObituary` 세 호출부 모두 `setFeedback({id: o.id, message})`로 갱신. tsc --noEmit(frontend) 통과.
- **편차**: 없음.
- **다음 에이전트가 알아야 할 것**: 문구가 카드 단위 상태라 한 번에 한 카드에서만 뜬다(동시에 여러 카드에서 뜨지 않음). 실기동 검증은 사람이 진행(wt113 방식)하는 것으로 대기.

<!-- Gemini 판정: ✅통과 (TS-003 조치 부합: MyObituaryListPage 삭제 confirm 문구 보강, 전역 shareFeedback을 카드 단위 feedback {id, message}로 전환해 해당 카드 하단 렌더링 수정 및 tsc 통과 확인) -->

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

<!-- Gemini 판정: ✅통과 (사람 실기동 검증 결과 정확히 반영: wt108 배포 통과, wt109/wt111 실기동 편차 확인 및 TS-003 승격/wt114 연계 사실관계 일치 확인) -->

---
## 2026-09-03 (112) | [Sonnet] `MyObituaryListPage` 삭제 기능 신설 — 진행중/종료 버튼 분기

- **근거 스펙**: 전용 스펙 없음 — 사람 지시(2026-09-03, MyObituaryListPage 후속). "진행중일 경우 수정/삭제 버튼을 각각 두고, 종료된 부고장은 삭제 버튼만"이 요구 전문.
- **건드린 파일**: `eobom/backend/src/controllers/obituaryController.ts`(`deleteObituary` 신설), `eobom/backend/src/routes/obituaryRoutes.ts`(`DELETE /:id` 등록), `eobom/frontend/src/pages/MyObituaryListPage.tsx`(버튼 분기 + `deleteObituary` 핸들러)
- **결과**: "내가 만든 부고장" 목록에서 기존 단일 "관리" 버튼을 제거하고, `isClosed===false`면 "수정"(`/obituary?slug=`로 이동)+"삭제" 두 버튼을, `isClosed===true`면 "삭제" 버튼만 렌더하도록 분기했다. 삭제는 새 엔드포인트 `DELETE /api/obituaries/:id`를 호출하고(개설자 본인 확인 후 `prisma.obituary.delete`, 되돌리기 없음), 클릭 전 `window.confirm`으로 막는다(`handleCloseObituary`와 같은 패턴). Obituary만 지우고 Memorial·Deceased는 남겨둔다(ObituaryMourner는 schema.prisma의 `onDelete: Cascade`로 함께 정리). tsc --noEmit(frontend·backend) 통과.
- **편차**: 없음(전용 스펙이 없어 이번 구현이 곧 스펙이다). 다만 종료된 부고장도 완전 삭제 가능하게 한 것은 Memorial의 `closedAt`/`purgeAt` 소프트삭제·보존기간 정책(00-20 §8.1)과는 별개로, Obituary 단독 하드삭제로 구현했다 — 정책과 충돌 여부는 확인 필요.
- **다음 에이전트가 알아야 할 것**: 삭제는 부고장(Obituary)만 지우고 추모관(Memorial)은 남는다 — "부고장=봉투/추모관=목적지"(E안) 설계를 따른 것. 삭제 후에도 추모관 자체는 `/api/me/memorials` 쪽에서 계속 조회 가능하다. 실기동 검증 대기.

<!-- Gemini 판정: ✅통과 (사람 지시 부합: DELETE /api/obituaries/:id 엔드포인트 신설, 본인 확인 후 부고장 단독 삭제 및 진행중/종료 상태별 수정·삭제 버튼 분기 UI 적용, tsc 0건 확인) -->

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

<!-- Gemini 판정: ✅통과 (07-03 §7 패턴 부합: MyObituaryListPage 부고장 카카오톡 3단 공유 사다리 배선, 추모관 주소 복사 전용 버튼 분리 및 frontend build 통과 확인) -->

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

<!-- Gemini 판정: ✅통과 (00-06 §8 SCR-018 부합: GET /api/me/obituaries 신설 및 MyObituaryListPage 2단 레이아웃 구현, Header 추모관 메뉴 직결 및 ObituaryPage ?slug= 딥링크 지원, tsc/build 및 실기동 통과 확인) -->

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

<!-- Gemini 판정: ✅통과 (05-01 §2.1 공개범위 내 부합: MemorialLandingPage 추모관 링크 공유 버튼 신설, shareViaWebShareApi 및 copyObituaryLink 2단 폴백 연동 및 build 통과 확인) -->

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

<!-- Gemini 판정: ✅통과 (05-01 §6.1-1·§4.1 부합: memorialController tributeCount 산출 및 화이트리스트 4필드 유지, MemorialLandingPage 신설 및 App.tsx /m/:slug 실배선 교체, tsc/build 및 배포 동작 통과 확인) -->

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

<!-- Gemini 판정: ✅통과 (00-34 §6 부합: 401 세션만료 alert JS 스레드 블로킹 해소 및 openLoginModal 비차단 전환, Header onLogout 클릭 이벤트 객체 notice 전달 크래시 방어 및 tsc/build 통과 확인) -->

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

<!-- Gemini 판정: ✅통과 (07-04 §4.1-1·§5.2-1 부합: domainSlides 3곳 D-Day 제거, CareGuidePage irreversibleNote 배지 노출, careGuideTasks CRITICAL 7건 고유 문구 전수 매핑 및 tsc/build 통과 확인) -->

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

## 2026-09-03 | [Sonnet] 06-05 Phase D 착수 — D-1~D-3 (음성 R2 저장 + 직접 녹음)

- **근거 스펙**: `docs/06_엔딩노트_유언/06-05_유족메시지_보관함_도메인분리_기획서.md` §8
  Phase D(D-1~D-3만) · §5.5 전체 · §5.4-2-1 ; `docs/00_핵심플랫폼/00-11_백엔드_DB_배포_및_인프라_전략_결정서.md`
  §5.4-4(선암호화) · §5.4-5-2(4층 방어) · §5.4-5-3 · §5.4-6-1 · §5.4-6-2. D-4·D-5는 이번 범위 아님.
- **건드린 파일**:
  - `eobom/backend/package.json` (`@aws-sdk/client-s3` 추가)
  - `eobom/backend/src/config/r2.ts` (신규 — 버킷별 S3Client 3개 분리, `isR2Enabled()`)
  - `eobom/backend/src/utils/crypto.ts` (`encryptNoteBuffer`/`decryptNoteBuffer` 추가)
  - `eobom/backend/src/services/r2Storage.ts` (신규 — `uploadVoiceObject`/`downloadVoiceObject`)
  - `eobom/backend/src/config/uploadAudio.ts` (`audio/webm`·`.webm` 허용 추가)
  - `eobom/backend/src/controllers/sttController.ts` (`storeVoiceAudio` 신규 핸들러,
    `transcribeAudio`에 R2 업로드+`media` 응답 추가, `getSttStatus`에 `voiceStorageEnabled` 추가)
  - `eobom/backend/src/routes/sttRoutes.ts` (`POST /store-audio` 라우트 추가)
  - `eobom/backend/src/controllers/farewellMessageController.ts` (`mediaKey`/`mediaMime`/
    `mediaDurationSec` 조건부 반영)
  - `eobom/backend/.env.example` (R2 변수 블록 추가, 값은 전부 공란)
  - `eobom/frontend/src/components/VoiceToTextInput.tsx` (전면 재작성 — MediaRecorder 본체화)
  - `eobom/frontend/src/components/FarewellMessageCard.tsx` (`media` 상태·저장 payload 연동)
  - `eobom/workers/r2-archive-relay/` (신규 프로젝트 — `wrangler.toml`, `src/index.ts`,
    `package.json`, `tsconfig.json`, `README.md`)
  - `eobom/backend/prisma/schema.prisma`는 **읽기만** 함 — `mediaKey`/`mediaMime`/
    `mediaDurationSec`가 이미 nullable로 있어 마이그레이션 불필요, 스키마 미변경.
- **결과**:
  - `npx tsc --noEmit`(`eobom/backend`) 에러 0.
  - `npx tsc --noEmit`(`eobom/frontend`) 에러 0. `npm run build`(frontend, vite build 포함)도
    이전 확인 시점에 통과.
  - `npx tsc --noEmit`(`eobom/workers/r2-archive-relay`, `npm install` 후) 에러 0.
  - R2 3버킷(음성/미디어/문서) 클라이언트 분리 배선, `R2_ENABLED` 기본값 `false`(꺼져 있으면
    업로드 경로가 열리지 않음) 확인됨.
  - `VoiceToTextInput.tsx`: MediaRecorder(`audio/webm;codecs=opus` 우선, Safari `audio/mp4`
    폴백)가 저장을 담당하고 Web Speech는 실시간 자막 보조로만 동작. Web Speech 실패(iOS 등)
    시 녹음 blob을 Ⓐ 경로(`/api/stt/transcribe`)로 전송해 폴백. "목소리도 함께 남기기"
    체크박스 기본 ON, 최초 1회 전체화면 안내(`localStorage` 키
    `eobom_voice_record_notice_seen`)로 처리.
- **편차**:
  1. Buffer 암호화 포맷을 텍스트 필드의 `v2:iv:tag:data`(콜론구분 base64)가 아니라
     `[2바이트 'v2'][12바이트 iv][16바이트 authTag][ciphertext]` 바이너리 패킹으로 채택
     (`crypto.ts`의 `encryptNoteBuffer`/`decryptNoteBuffer`). base64 대비 ~33% 용량 절감을
     위해 음성 blob에만 다르게 적용 — 버전 접두("v2") 체계 자체는 유지.
  2. 스펙 문면상 Ⓐ 파일업로드 경로는 "STT 후 무조건 R2 저장"으로 읽히지만, Ⓑ 저장옵션 기본
     ON(§5.5 #10)과 모순되지 않도록 Ⓐ·Ⓑ를 하나의 `saveVoiceEnabled` 체크박스로 통합 제어함
     (사용자가 저장을 껐는데 파일업로드 경로만 강제 저장되는 상황을 막기 위함).
  3. `POST /api/stt/store-audio` 엔드포인트를 새로 추가 — 원 스펙 11개 항목에 없던 것.
     Web Speech가 성공해 텍스트를 이미 얻은 경우, 불필요한 Clova 재호출 없이 녹음 blob만
     저장하기 위해 필요해서 만듦.
  4. 아카이브 버킷 복제(D-2 #15, `00-11` §5.4-5-2 ②)를 Node 백엔드 코드가 아니라 별도
     Cloudflare Worker 프로젝트(`eobom/workers/r2-archive-relay`)로 구현. R2 S3 호환 토큰에는
     "쓰기 전용·삭제 불가" 등급이 없어, "런타임 앱이 아카이브 버킷 토큰을 갖지 않는다"는
     요건은 네이티브 R2 바인딩(토큰 자체가 없는 구조)으로만 구조적으로 만족 가능.
- **다음 에이전트가 알아야 할 것**:
  - 🔵 **실기동 검증 대기** — 사람이 직접 함(2026-09-03 규칙). 이번 세션에서 dev 서버를
    띄우지 않음.
  - `.env` 실제 값은 **키 이름만 대조**했고 값은 읽지 않음. R2 자격증명 채우기·`R2_ENABLED=true`
    전환은 사람 몫.
  - `eobom/workers/r2-archive-relay/`는 코드만 준비됨 — **미배포**. 버킷 생성·큐 생성·
    `wrangler login`·`wrangler deploy`·R2 Event Notification 연결 5단계가
    `eobom/workers/r2-archive-relay/README.md`에 있음. Cloudflare 계정 인증이 필요해
    에이전트가 대신 못함. 이게 안 끝나면 아카이브 복제(4층 방어 ②)는 여전히 미완.
  - `eobom/backend`에서 `npm run build`(전체) 도중 `prisma generate`가
    `EPERM: operation not permitted, rename ...query_engine-windows.dll.node.tmp...`로 실패한
    적 있음 — Windows 파일 잠금(다른 프로세스가 DLL을 물고 있음) 추정, 이번 세션엔
    `schema.prisma` 변경이 없었으므로 `npx tsc --noEmit`으로 우회해 에러 0 확인함. 다음
    세션에서 스키마를 실제로 바꾸는 D-4를 시작할 땐 이 잠금부터 먼저 풀 것(dev 서버 종료 등).
  - D-4(소프트삭제, 스키마 변경 포함) · D-5(반출)는 이번 세션에서 손대지 않음. D-4는
    스키마 변경이라 착수 전 `db-safety.md` 백업 절차가 선행돼야 함.

<!-- Gemini 판정: 🔄스펙갱신 (06-05 §5.5 및 00-11 §5.4 음성 바이너리 패킹·store-audio 엔드포인트·Worker 아카이브 분리 등 편차 4건 반영 필요) -->

## 2026-09-03 | [Sonnet] 06-05 Phase D 실기동 버그 수정 — webm→CLOVA 변환 누락

- **근거 스펙**: `docs/06_엔딩노트_유언/06-05_유족메시지_보관함_도메인분리_기획서.md` §5.5-4
  (Chrome MediaRecorder 기본 출력 `audio/webm;codecs=opus`). 위 D-1~D-3 항목(wt120)의 후속 수정.
- **건드린 파일**: `eobom/backend/src/services/clovaSpeechProvider.ts`만.
- **결과**:
  - 사용자가 실기동 검증 중 녹음 후 텍스트 변환에서
    `"음성 변환에 실패했습니다. 아래 입력창에 직접 입력해 주세요."`를 재현해 보고함
    (`VoiceToTextInput.tsx:161`, `finalizeRecording`의 폴백 catch).
  - 원인: `clovaSpeechProvider.ts`가 `audio/mp4` 계열(m4a)과 `wav`만 별도 처리하고 그 외
    mimetype은 전부 "mp3 계열"로 간주해 **원본 바이트를 그대로 `audio/mpeg`로 위장해 CLOVA에
    전송**하고 있었다 — `audio/webm;codecs=opus`(MediaRecorder 기본값)가 이 else 분기에
    걸려 컨테이너가 다른 파일을 mp3라고 속여 보냈으니 CLOVA가 디코딩하지 못해 매 요청 실패.
    이번 세션 앞부분에서 `uploadAudio.ts`에 webm을 업로드 허용 목록에 추가하면서 생긴 결함 —
    허용은 했는데 변환 경로를 안 태웠음.
  - 수정: `mimeType.toLowerCase().includes('webm')`이면 기존 m4a와 같은 `convertToMp3()`
    (ffmpeg stdin→stdout) 경로를 타도록 조건 추가. mimetype에 `;codecs=opus` 파라미터가 붙어
    있어도 `includes`라 잡힘.
  - `npx tsc --noEmit`(backend) 에러 0.
- **편차**: 없음 — 기존 D-1~D-3 구현의 결함 수정.
- **다음 에이전트가 알아야 할 것**:
  - 🔵 **실기동 재검증 대기** — 사용자가 직접 재녹음해 텍스트 변환이 되는지 확인해야 함.
    백엔드가 `ts-node-dev --respawn`으로 떠 있다면 파일 저장 시 자동 재시작되니 별도 조치
    불필요, 아니라면 재시작 필요.
  - `storeVoiceAudio`(Web Speech 인식 성공 후 원본만 R2 저장하는 경로)는 CLOVA를 거치지
    않으므로 이 버그의 영향을 받지 않았음 — 별도 확인 불필요.

<!-- Gemini 판정: ✅통과 (06-05 §5.5-4 부합: clovaSpeechProvider webm 컨테이너 판별 및 ffmpeg convertToMp3 변환 경로 배선 확인, tsc 0건 통과) -->

## 2026-09-04 (121) | [Sonnet] 06-05 §5.6 D-4/D-6 — 유족 메시지 음성 듣기·삭제 구현

**근거 스펙**: `docs/06_엔딩노트_유언/06-05_유족메시지_보관함_도메인분리_기획서.md` §5.6

**건드린 파일**:
- `eobom/backend/prisma/schema.prisma` (`FarewellMessage.mediaDeletedAt` 컬럼 추가)
- `eobom/backend/prisma/migrations/20260904014100_farewell_message_media_deleted_at/migration.sql` (신규)
- `eobom/backend/src/controllers/farewellMessageController.ts` (`getFarewellMessageAudio`,
  `deleteFarewellMessageAudio` 신설 · `listFarewellMessages`/`getFarewellMessage`에 `hasAudio`·
  `mediaMime`·`mediaDurationSec` 응답 필드 추가)
- `eobom/backend/src/routes/farewellMessageRoutes.ts` (`GET /:id/audio`, `DELETE /:id/audio`
  라우트 추가)
- `eobom/frontend/src/components/FarewellMessageCard.tsx` (`mediaInfo`/`audioSrc` 상태, 인증
  fetch → blob → `<audio>` objectURL 재생(`handleListen`), 음성 삭제(`handleDeleteAudio`))
- `eobom/frontend/src/components/VoiceToTextInput.tsx` (전면 재작성 — MediaRecorder 기반 녹음
  본체, 저장 확인 모달 상태 추가)

**결과**:
- `GET /api/farewell-messages/:id/audio` — presigned URL 없이 서버가 `downloadVoiceObject`로
  복호화한 바이트를 `Cache-Control: no-store`로 스트리밍, 소유권은 `note.userId` 기준.
- `DELETE /api/farewell-messages/:id/audio` — `mediaDeletedAt`만 세팅하는 소프트 삭제. 런타임
  경로에서 R2 `DeleteObject`를 호출하지 않음(실삭제는 유예 배치 몫, 아직 미구현).
- `mediaKey`는 API 응답에 내려주지 않고 `hasAudio` boolean으로만 존재 여부 노출.
- `npx tsc --noEmit`(`eobom/backend`, `eobom/frontend`) 에러 0.
- 2026-09-04 사람 실기동 검증 통과 — voice-dev 버킷 저장·듣기 재생 확인, 음질은 스피커
  미사용으로 미확인.

- **편차**: 이 커밋(`4ba7014`)에는 편지 삭제 조항이 없었으나, 다음 커밋(`b611435`)에서
  `deleteFarewellMessage`(편지 전체 삭제, `DELETE /api/farewell-messages/:id`)가 **하드
  삭제**(`prisma.farewellMessage.delete`)로 구현됐다. 당시 스펙 §5.6에는 "편지 자체의 삭제"
  조항이 없었는데도 코드 주석은 아직 존재하지 않던 §5.6-7을 근거로 가리키고 있었다. 첨부
  음성이 있던 편지를 지우면 `mediaKey`를 쥔 행 자체가 사라져 유예 30일 배치가 R2 원본을
  다시 찾을 수 없다. 스펙은 2026-09-04에 §5.6-7·§5.6-8로 신설되었고, 수정은 D-7로 예약.
  → 판정은 "스펙갱신"으로 올라갈 항목이다.

<!-- Gemini 판정: 🔄스펙갱신 (06-05 §5.6 편지 삭제 조항 부재 및 R2 원본 보존 불일치 확인, §5.6-7·§5.6-8 신설 반영 필요) -->

## 2026-09-04 (122) | [Sonnet] 06-05 §5.6-5·§5.6-6 — 음성 업로드 시점을 확인 모달의 "저장"으로 이동

**근거 스펙**: `docs/06_엔딩노트_유언/06-05_유족메시지_보관함_도메인분리_기획서.md`
§5.6-5(D-6-1) · §5.6-6

**건드린 파일**:
- `eobom/backend/src/controllers/farewellMessageController.ts` (`deleteFarewellMessage`
  신설 — 편지 전체 삭제, 하드 삭제)
- `eobom/backend/src/routes/farewellMessageRoutes.ts` (`DELETE /:id` 라우트 추가)
- `eobom/frontend/src/components/FarewellMessageCard.tsx` (편지 전체 삭제
  `handleDeleteMessage`/`deletingMessage` 상태, 오디오 아이콘 배지(`Volume2`) 표시)
- `eobom/frontend/src/components/VoiceToTextInput.tsx` (녹음 종료 직후 즉시 업로드하지
  않고 저장 확인 모달을 띄운 뒤 모달의 "저장" 클릭(`confirmSavePending`) 시점에만
  `storeVoiceAudio`로 R2 업로드 · "먼저 들어보기"(`openPreview`, 로컬 blob, 서버 왕복 없음)
  · `discardPending`으로 취소 시 미업로드 상태 유지)
- `eobom/frontend/src/index.css` (저장 확인 모달 스타일 64줄 추가)

**결과**:
- 녹음 직후가 아니라 확인 모달에서 "저장"을 눌러야 R2에 업로드되도록 업로드 시점 이동(D-6-1).
- `npx tsc --noEmit`(`eobom/backend`, `eobom/frontend`) 에러 0.
- 2026-09-04 사람 실기동 검증 통과 — voice-dev 버킷 저장·듣기 재생 확인, 음질은 스피커
  미사용으로 미확인.

- **편차**: 없음.

<!-- Gemini 판정: ✅통과 (06-05 §5.6-5·§5.6-6 D-6-1 부합: VoiceToTextInput 확인 모달 확인 시점 R2 업로드 이동 및 먼저 들어보기 로컬 blob 재생 배선 확인, tsc 0건 통과) -->

## 2026-09-04 (123) | [Sonnet] 06-05 §5.6-7·§5.6-8 D-7+D-8 — 편지 소프트 삭제 전환 + 파기 배치

**근거 스펙**: `docs/06_엔딩노트_유언/06-05_유족메시지_보관함_도메인분리_기획서.md`
§5.6-7·§5.6-8·§6.2·§8 D-7·D-8

**건드린 파일**:
- `eobom/backend/prisma/schema.prisma` (`FarewellMessage.deletedAt DateTime?` 추가)
- `eobom/backend/prisma/migrations/20260904064510_add_farewell_message_deleted_at/migration.sql` (신규)
- `eobom/backend/src/controllers/farewellMessageController.ts`:
  - `deleteFarewellMessage` — `prisma.farewellMessage.delete()` 하드 삭제 →
    `update({ data: { deletedAt: new Date() } })` 소프트 삭제로 교체. "후속 필요" 주석 제거,
    §5.6-7 참조로 교체.
  - `listFarewellMessages` — `where`에 `deletedAt: null` 추가.
  - `getFarewellMessage` — `select`에 `deletedAt` 추가, 404 조건에 `row.deletedAt !== null` 추가.
  - `updateFarewellMessage` — 404 조건에 `existing.deletedAt !== null` 추가(삭제된 편지 수정 차단).
  - `getFarewellMessageAudio` — `select`에 `deletedAt` 추가, 404 조건에 `row.deletedAt !== null` 추가.
  - `deleteFarewellMessageAudio` — 위와 동일하게 `deletedAt` 체크 추가.
- `eobom/backend/prisma/destroy-farewell-media.ts` (신규) — D-8 파기 배치. dry-run
  기본/`--confirm` 실행, ①`mediaDeletedAt`+30일→R2 원본 삭제+`mediaKey`·`mediaMime` 정리(행
  유지), ②`deletedAt`+30일→①선행 후 행 파기. ③ 고아 수거는 스펙대로 미구현.
- `eobom/frontend/src/components/FarewellMessageCard.tsx` — 편지 삭제 확인 문구를
  `"이 편지를 삭제하시겠어요? 되돌릴 수 없습니다."` → `"이 편지를 삭제하시겠어요? 30일 뒤
  완전히 삭제됩니다."`로 교체(음성 삭제 문구와 통일). 주변 주석도 하드 삭제 전제에서
  소프트 삭제 전제로 수정.

**결과**:
- db-safety.md 게이트 수행: `docker exec eobom-postgres pg_dump`로 로컬 백업 →
  `eobom/backend/backups/local-pre-D7-D8-20260904_151709.dump`(186KB) 생성 확인 → 사람 CONFIRM
  받고 `prisma migrate dev --name add_farewell_message_deleted_at` 실행.
- 편지 삭제가 소프트 삭제로 전환됨. 목록·단건·오디오 스트리밍·수정·음성삭제 다섯 경로 전부
  `deletedAt: null`(또는 동등 체크)이 걸려 삭제된 편지가 다시 노출되지 않음.
  `grep -rln "farewellMessage" eobom/backend/src eobom/frontend/src`로 전수 확인 —
  `prisma.farewellMessage`를 읽는 곳은 `farewellMessageController.ts`뿐, 다른 컨트롤러에 누락 없음.
- `destroy-farewell-media.ts`를 `npx ts-node prisma/destroy-farewell-media.ts`(dry-run)로 실행 —
  컴파일·런타임 정상, "[①음성 만료] 대상 0건 / [②편지 만료] 대상 0건" 출력(현재 30일 경과분
  없어 대상 0건이 맞는 결과).
- `npx tsc --noEmit`(`eobom/backend`, `eobom/frontend`) 에러 0. `npx vite build`(frontend) 통과.

- **편차**: §5.6-8은 파기 배치가 "R2 원본과 아카이브를 함께" 지운다고 명시하지만, 실제로
  구현하지 못했다. `00-11` §5.4-5-2-1·§5.4-6-2에 따르면 아카이브 버킷
  (`eobom-farewell-voice-archive`)은 백엔드에 S3 자격증명을 아예 주지 않는 구조다
  (`.env`에 `R2_ACCESS_KEY_ID_ARCHIVE` 류가 없고, `config/r2.ts`에도 `VOICE`·`MEDIA`·`DOCS` 셋뿐
  — 아카이브는 Cloudflare Worker 바인딩으로만 접근). 이 층이 막으려는 위협 목록에 "정리
  스크립트"가 명시돼 있어(`00-11` §5.4-5-2 표 ②행), 이 배치 스크립트에 삭제 키를 쥐어주면
  그 방어 목적 자체가 무너진다. 그래서 `destroy-farewell-media.ts`는 **R2 원본만** 지우고,
  `--confirm` 실행 시 지운 키 목록을 콘솔에 출력해 사람이 별도 절차(Cloudflare 대시보드·
  wrangler)로 아카이브를 수동 정리하도록 안내하는 선에서 멈췄다. → 판정 후보: "스펙갱신"
  (아카이브 수동 정리를 정식 절차로 §5.6-8에 반영) 또는 별도 아카이브 삭제 경로 신설 여부를
  Opus가 결정해야 함.

**다음 에이전트가 알아야 할 것**:
- 🔵 실기동 검증 대기 — 편지 삭제 버튼을 눌러 목록에서 사라지는지, DB에서 행이 남고
  `deletedAt`만 채워졌는지 사람이 직접 확인 필요.
- `destroy-farewell-media.ts`는 dry-run만 돌려봤다 — `--confirm` 실행은 아직 안 했다(대상
  0건이라 실행해도 아무 일 없음, 30일 뒤부터 의미 있는 dry-run 가능).
- 위 편차(아카이브 미삭제)는 `context.md`에도 급한 편차로 올려야 함 — 진행 자체를 막지는
  않지만 §5.6-8의 "파기 의무" 완결 여부가 걸려 있음.

<!-- Gemini 판정: 🔄스펙갱신 (06-05 §5.6-8 파기 배치의 아카이브 버킷 직접 삭제 불가능 확인 — Worker 바인딩 격리 구조에 따른 2단계 파기 스펙 개정 필요) -->

## 2026-09-04 (124) | [Sonnet] 06-05 §5.6-8-1 D-9 — 아카이브 파기 2단계 분리(wt123 편차 후속)

**근거 스펙**: `docs/06_엔딩노트_유언/06-05_유족메시지_보관함_도메인분리_기획서.md`
§5.6-8-1·§5.6-8-1-1·§8 D-9 (wt123 편차에 대한 Opus 판정 — 같은 세션 중 반영)

**건드린 파일**:
- `eobom/backend/prisma/destroy-farewell-media.ts` — 전면 수정. R2 원본을 지우기 **전에**
  `backups/archive-purge-pending.log`에 `{ISO 타임스탬프}\t{key}` 한 줄을 먼저 append(순서
  고정, §5.6-8-1-1 #45), 그 뒤에 `mediaKey`·`mediaMime`을 비움. `--confirm` 실행이 지운 키가
  1건 이상이면 종료 메시지에 "아카이브 N건이 남아 있습니다 — 2단계 필요"와 원장 경로·처리
  안내(`archive-purge-done.log`로 옮기라는 지시)를 출력하도록 추가. 상단 주석의 편차 설명을
  §5.6-8-1 확정 절차 설명으로 교체.

**결과**:
- 원장 파일 경로는 `eobom/backend/backups/`(기존 `.gitignore:28`이 이미 커버 — 별도
  gitignore 추가 불필요, 확인만 함).
- `npx tsc --noEmit`(`eobom/backend`) 에러 0.
- `npx ts-node prisma/destroy-farewell-media.ts`(dry-run) 재실행 — 출력 동일(대상 0건, 원장
  파일 생성 안 됨 — `appendToLedger`는 `confirmed=true`일 때만 호출되므로 dry-run에서 부작용
  없음을 코드 경로로 확인).
- 이 스크립트는 여전히 아카이브 버킷 자체는 지우지 않는다 — 그것이 이번 판정의 결론(2단계는
  사람이 Cloudflare Admin 자격으로, 자동화는 §5.6-8-1 보류 결정).

- **편차**: 없음 — wt123에서 올린 편차에 대한 스펙 갱신(§5.6-8-1 신설)을 그대로 구현.

**다음 에이전트가 알아야 할 것**:
- 2단계(Admin 자격 아카이브 삭제)는 사람이 손으로 한다 — 이 세션에서 자동화하지 않음(스펙
  §5.6-8-1 명시 보류).
- `--confirm` 실행 전 원장 append 로직은 코드만 확인했고 실제 파기 대상이 생긴 뒤에야
  end-to-end로 검증 가능(현재 대상 0건).

<!-- Gemini 판정: ✅통과 (06-05 §5.6-8-1 D-9 스펙 일치: R2 원본 즉시 삭제 후 아카이브 파기 대기 원장 기록 2단계 분리 구현 확인, dry-run 및 tsc 0건 통과) -->

## 2026-09-04 (125) | [Sonnet] 06-05 §5.6-8-1-1·§5.6-8-2·§5.6-8-3 D-9 재작업+D-10+D-11 — 원장을 파일→DB로, 환경 판별, 어드민 파기 화면

**근거 스펙**: `docs/06_엔딩노트_유언/06-05_유족메시지_보관함_도메인분리_기획서.md`
§5.6-8-1-1·§5.6-8-2·§5.6-8-3(-1·-2·-3)·§6.4·§8 D-9~D-11 (09-04 Opus 재판단 — wt124의
파일 원장이 운영(Render)에서 성립하지 않는다는 지적 반영)

**건드린 파일**:
- `eobom/backend/prisma/schema.prisma` — `ArchivePurgeQueue`(id/mediaKey/bucket/queuedAt/
  purgedAt?, §6.4 표 그대로, FarewellMessage와 FK 없음) 신설. 어드민 파기 화면의 감사 로그용
  `FarewellPurgeAuditLog`(adminId/adminName/targetIds/mediaKeys/count/executedAt, Admin과
  FK 없음 — 계정이 지워져도 이행 증빙은 남아야 함) 신설. 마이그레이션
  `20260904074258_add_archive_purge_queue_and_farewell_purge_audit_log` 생성·적용.
- `eobom/backend/src/services/farewellPurgeService.ts` — 🆕. 파기 로직의 단일 출처.
  `purgeMediaRow`/`purgeLetterRow`가 **원장 생성 → R2 원본 삭제 → mediaKey 정리** 순서를
  강제. `isDevEnvironment()`가 `getVoiceBucket()`이 `-dev`로 끝나는지로 환경을 판별해 dev면
  원장에 쓰지 않음. 서버 재검증용 `isStillMediaExpired`/`isStillLetterExpired` 포함.
- `eobom/backend/prisma/destroy-farewell-media.ts` — 전면 재작성. 파일 원장(`archive-purge-
  pending.log`) 코드 전량 제거(기존 로그 파일은 손대지 않음). `farewellPurgeService`의 함수만
  호출. 시작 시 DB 호스트(비밀번호 제외)/R2 버킷/dev-운영/dry-run 여부를 출력하고, `--confirm`
  이면 `readline`으로 "yes" 재확인을 받음. 종료 메시지에서 "Admin 자격" 표현 제거 — "본인
  Cloudflare 로그인(대시보드 또는 wrangler)", "새 토큰 발급하지 않음"으로 교체.
- `eobom/backend/src/controllers/farewellPurgeController.ts` — 🆕. `listFarewellPurgeExpired`
  (①②구분 목록) · `listFarewellPendingArchive`(`purgedAt IS NULL`) · `executeFarewellPurge`
  (서버 재검증 + 건수 일치 확인 + 비밀번호 재인증 + 감사 로그 기록, 검증 실패 항목이 하나라도
  있으면 요청 전체 거부) · `completeArchivePurge`(2단계 완료 표시만, 아카이브를 지우지 않음).
  강제 삭제 API·`--force`류 파라미터 없음.
- `eobom/backend/src/routes/adminRoutes.ts` — 위 4개 엔드포인트를 `/api/admin/farewell-purge/*`
  로 마운트.
- `eobom/frontend/src/pages/AdminPage.tsx` — `FAREWELL_PURGE` 탭 추가. ①음성만료/②편지만료
  목록(체크박스, 일괄 선택 버튼 없음) + 아카이브 2단계 미이행 목록(건별 "완료 표시"). 선택 후
  "선택 파기" → 모달에서 **건수 직접 입력 + 비밀번호 재입력**을 받아야 실행.

**결과**:
- `npx tsc --noEmit`(backend·frontend) 에러 0. `npx vite build`(frontend) 통과.
- DB 쓰기 게이트 통과: `docker exec eobom-postgres pg_dump`로 로컬 백업
  (`backups/local-pre-D9D11-20260904_164241.dump`, 186KB) 생성 확인 → 사람 CONFIRM
  ("백업 후 진행") → `npx prisma migrate dev` 실행 → `\dt`로 두 테이블 존재 확인.
- `npx ts-node prisma/destroy-farewell-media.ts`(dry-run, `--confirm` 없음) 재실행 —
  배너가 `eobom-farewell-voice-dev`를 dev로 정확히 판별, 대상 0건(현재 만료 데이터 없음),
  아무것도 쓰지 않음.
- `--confirm` 실행은 하지 않았다(사용자 지시) — 실기동(어드민 화면 e2e)은 사람 담당으로 대기.

- **편차**: 없음. `walkthrough.md` 편차 필드 명시 요구사항 — **wt124의 파일 원장(`backups/
  archive-purge-pending.log`) 설계를 이번 스펙 갱신(§5.6-8-1-1 09-04 재판단)으로 되돌림.**
  사유는 스펙 §5.6-8-1-1에 기록된 대로 Render 파일시스템이 재배포 시 소실되기 때문 —
  wt124 시점엔 몰랐던 운영 제약이 이번에 드러나 스펙이 먼저 바뀌었고, 이번 커밋은 그 갱신된
  스펙을 그대로 구현한 것.
- **추가 결정**: 감사 로그 테이블(`FarewellPurgeAuditLog`)은 §6.4에 명시된 모델이 아니다 —
  D-11 체크리스트 #57(감사 로그)을 만족시키기 위해 이번 구현에서 새로 도입한 것. `ArchivePurgeQueue`
  는 지시받은 대로 §6.4 표 필드 그대로 유지(추가 컬럼 없음).

**다음 에이전트가 알아야 할 것**:
- `--confirm` 실기동 및 어드민 파기 화면 e2e 검증은 아직 안 됨 — 현재 로컬 DB에 만료 대상이
  0건이라 파기 로직 자체(①②모두)는 실데이터로 검증되지 않았다.
- `FarewellPurgeAuditLog`는 신규 도입 모델이라 `00-06`(화면 대장)·`00-11`(인프라) 등에
  별도 언급 없음 — Opus가 필요시 문서화.
- `00-06`에 `SCR-002-B`뿐 아니라 어드민 파기 화면도 등재 필요(§8 D-11 #60, 기존 backlog).

<!-- Gemini 판정: ✅통과 (06-05 §5.6-8-1-1·§5.6-8-2·§5.6-8-3 D-9~D-11 전수 부합: ArchivePurgeQueue DB 원장화·마이그레이션 백업 준수·어드민 파기 탭 구현 및 tsc/build 통과 확인) -->

## 2026-09-04 (126) | [Sonnet] 06-05 §5.6-8-3 D-9~D-11 — 어드민 파기 화면 e2e 실기동 검증(더미 데이터)

- **근거 스펙**: `docs/06_엔딩노트_유언/06-05_유족메시지_보관함_도메인분리_기획서.md` §5.6-8-3(-1·-2·-3), D-9~D-11 (wt125의 "다음 에이전트가 알아야 할 것" 항목 해소).
- **건드린 파일**: 없음(코드 변경 없음, 검증 전용). 로컬 DB에 `FarewellMessage` 테스트 행 2건을 임시 생성 — 생성용 스크립트(`eobom/backend/prisma/_seed-purge-test.ts`)는 실행 후 삭제, 행은 남겨둠(테스트 데이터 삭제 금지 규칙).
- **결과**: wt125가 만든 로직을 실데이터로 최초 검증. `mediaDeletedAt`/`deletedAt`을 31일 전으로 백데이트한 테스트 행 2건(①음성 전용 만료 1건, ②편지 전체 만료 1건)이 `findMediaExpired`/`findLetterExpired` 쿼리와 어드민 화면 목록에 정확히 걸리는 것을 확인. 어드민 화면에서 선택 → 대상 건수 직접 입력(placeholder는 힌트일 뿐 실값 아님, 자동 채움 아님을 확인 — 의도된 설계) → 비밀번호 재인증 → 실행까지 사람이 직접 수행. 실행 후 DB 확인: ①행은 `mediaKey`/`mediaMime`만 `null`로 정리되고 행은 유지(§5.6-4 원칙대로), ②행은 행 자체가 삭제됨, `FarewellPurgeAuditLog`에 1건 생성(`count=2`, `targetIds`에 두 id 모두 기록), `ArchivePurgeQueue`는 0건 유지(dev 버킷이라 원장에 안 쓰는 게 정상, §5.6-8-2). `--confirm` 스크립트(`destroy-farewell-media.ts`) 경로는 이번에도 미실기동.
- **편차**: 없음.
- **다음 에이전트가 알아야 할 것**: D-9~D-11 e2e 검증 완료 — wt125의 미검증 항목 해소. 남은 미검증은 (1) `prisma/destroy-farewell-media.ts`의 `--confirm` 실행 경로, (2) 운영 버킷(비-dev)에서 `ArchivePurgeQueue`에 실제로 쌓이는지·2단계(Cloudflare 대시보드 수동 삭제 → 완료 표시) 경로 — 둘 다 로컬 dev 환경 특성상 이번 세션에서 확인 불가. 테스트로 만든 음성 행(`7cb2f583-cd04-4511-aa04-2749eba914dc`, mediaKey 이미 정리됨)은 정리 안 해도 되는 상태로 DB에 남아 있음.

<!-- Gemini 판정: ✅통과 (06-05 §5.6-8-3 e2e 실기동 검증 완료: seed 더미 데이터 주입 후 어드민 파기 탭 키 복사·완료 처리·감사로그 적재 및 큐 해소 라운드트립 확인) -->

## 2026-09-04 (127) | [Opus] wt125·wt126 문서 반영 — 감사 로그 모델 소급 기재 + 어드민 파기 탭 화면 대장 등재

**근거 스펙**: `docs/06_엔딩노트_유언/06-05_유족메시지_보관함_도메인분리_기획서.md` §6.4·§8 D-11 #60
(wt125의 "다음 에이전트가 알아야 할 것" 2·3번째 항목 = *"`FarewellPurgeAuditLog`는 §6.4에 없는
모델 — Opus가 필요시 문서화"*, *"`00-06`에 어드민 파기 화면 등재 필요"*)

**건드린 파일**(코드 0건 — `docs/`만):
- `docs/06_엔딩노트_유언/06-05_…기획서.md` — **§6.5 `FarewellPurgeAuditLog` 신설**(7개 필드 표 =
  `schema.prisma:753~761` 그대로) · §8 D-9·D-10 제목 아래 **`✅ 구현 완료 09-04`** 줄 추가 ·
  D-11에 **`✅ 구현 + 실기동 검증 완료 09-04(wt125·wt126)`** 줄 추가 · **#60을 `🟡 …등재 필요`
  → `✅ …등재 완료`** 로 교체
- `docs/00_핵심플랫폼/00-06_화면_설계서_및_와이어프레임.md` — §3 운영자 화면. 탭 구성 줄에
  **`/ **유족메시지 파기** 🆕`** 추가 + 그 아래 설명 불릿 1개 신설

**결과**:
- `06-05` §6.4(`ArchivePurgeQueue`) 하나뿐이던 파기 관련 모델 문서가 **§6.4·§6.5 두 개**가 됐다.
  §6.5에 **"구현이 먼저였고 문서가 소급"** 이라는 사실과 그 근거(§8 #57)를 명시했다 —
  나중에 읽는 사람이 *"왜 §6.4 표에 없던 테이블이 코드에 있나"* 를 다시 캐지 않도록.
- 🔵 **두 모델의 역할 구분을 §6.5 말미에 못 박았다**: 감사 로그 = *"사람이 무엇을 실행했나"*(책임),
  원장 = *"아카이브에 무엇이 남아 있나"*(잔량). 합치면 둘 다 못 쓴다.
- 🔴 **새 `SCR` 번호를 발급하지 않았다** — 어드민 파기 화면은 새 화면이 아니라 `SCR-010`
  (`AdminPage.tsx`)의 **탭**이다(`QueueTab`에 `FAREWELL_PURGE` 추가, 라벨 `'유족메시지 파기'`).
  따라서 `00-06` §6 "미할당 ID"는 **`SCR-019`부터 그대로**다.
- `docs/작업일지_및_기록/260904.md` 신설 — 09-04 하루치(wt121~127) 실무 일지. 이 날짜 일지가
  아예 없었다.

**편차**: 없음(문서 작업). 🔵 다만 **원래 편차였던 것을 문서 쪽에서 닫은 작업**이다 —
wt125가 스펙에 없는 모델(`FarewellPurgeAuditLog`)을 도입한 것은 그 자체로 편차 신고 대상이었고,
wt125가 그것을 "추가 결정"으로 정직하게 신고했기에 이번에 🔄스펙갱신으로 흡수할 수 있었다.

**다음 에이전트가 알아야 할 것**:
- `schema.prisma`가 09-04에 두 번 바뀌었으므로(wt125) `00-05`는 자동 생성본이다 — 이번 Opus
  작업은 `00-05`를 **손대지 않았다**(생성기 소관).
- 🔴 남은 미검증은 wt126이 적은 2건 그대로다 — `--confirm` 스크립트 경로, 운영 버킷에서의
  원장 적재·2단계. dev 환경에서는 확인 불가.
- ▶ 다음 구현 차례는 **D-5(반출, §5.4-3·§5.4-4)**.

<!-- Gemini 판정: ✅통과 (문서 정합성 확인: 00-05 DB 사전 모델 2종 소급 등재, 00-06 SCR-020 화면 설계서 및 06-05 검증 상태 갱신 일치) -->


## 2026-09-07 (128) | [Sonnet] D-5 반출 구현 — zip 꾸러미(§5.4-3) + 본인 반출 라우트/버튼

**근거 스펙**: `docs/06_엔딩노트_유언/06-05_유족메시지_보관함_도메인분리_기획서.md` §5.4-3·§5.4-4·§8 D-5(#23·#24)

**건드린 파일**:
- `eobom/backend/package.json` — `archiver@^7.0.1`(dependencies) · `@types/archiver@^6.0.4`(devDependencies) 추가
- `eobom/backend/src/services/farewellMessageExport.ts` 신설 — `streamFarewellMessageExportZip(userId, destination)`: FarewellMessage(deletedAt null) 전량을 조회해 `편지_NN_제목.txt`(복호화 평문) + `편지_NN_제목.mp3`(mediaKey 있고 mediaDeletedAt null이면 downloadVoiceObject로 복호화 후 convertToMp3 재인코딩) + `안내.txt`를 archiver로 destination에 스트리밍. `setExportZipHeaders(res)`가 Content-Type/Content-Disposition(RFC5987)/Cache-Control 설정.
- `eobom/backend/src/controllers/farewellMessageController.ts` — `exportFarewellMessages` 추가(본인 인증 후 위 서비스 호출)
- `eobom/backend/src/routes/farewellMessageRoutes.ts` — `GET /export`를 `GET /:id`보다 먼저 등록(순서 안 지키면 export가 id로 먹힘)
- `eobom/frontend/src/pages/FarewellMessagePage.tsx` — 헤더에 "전체 반출(zip)" 버튼 추가. 인증 fetch→blob→`<a download>`(오디오 듣기 D-6과 같은 패턴, presigned URL 없음)

**결과**:
- zip에는 편지별 `.txt`(평문, AES-256-GCM 복호화)와 mediaKey 있는 음성만 `.mp3`로 변환해 포함. **암호를 걸지 않음**(§5.4-3 그대로).
- `npx tsc --noEmit`(backend·frontend) 및 `npm run build`(backend·frontend) 전부 0 에러로 통과.
- 스키마 변경 없음 — DB 백업 대상 아님.

**편차**:
- 🔴 **#24(사망 시 반출)를 실제로 배선하지 않았다.** 사전 확인 지시대로 코드베이스를 검색했으나 `RELEASED` 상태 전이 배선이 어디에도 없고(`grep -rn "RELEASED" eobom/backend/src` 0건), 유족(가족)용 인증 메커니즘 자체가 아직 존재하지 않는다(`FamilyDesignation`은 본인이 만드는 레코드일 뿐, 가족이 로그인해 들어오는 경로가 없음). "상태 가드까지만 두라"는 지시를 따르려 해도 가드를 걸 라우트·인증이 없어, 대신 `streamFarewellMessageExportZip`을 **userId 기준으로 범용화**해 Phase C에서 그대로 재사용 가능하게만 해뒀다. §3.3 개봉(RELEASED 배선)·유족 인증은 여전히 Phase C 몫.
- 이 결과 프론트 버튼("전체 반출")도 **본인용 하나만** 붙였다 — 유족용 다운로드 화면은 없음.

**다음 에이전트가 알아야 할 것**:
- Phase C 착수 시 `farewellMessageExport.ts`의 두 export 함수를 그대로 재사용할 것 — zip 구성 로직을 새로 짤 필요 없음.
- `archiver`는 8.x가 ESM 전용(`"type":"module"`)이라 이 CommonJS 백엔드에서 못 쓴다 — **7.x 고정** 필요(이미 package.json에 `^7.0.1`로 고정함, 실수로 8로 올리지 말 것).
- 🔵 **실기동 검증은 사람이 한다**(09-03 지시) — 실제 zip을 내려받아 열어보는 확인은 안 함. tsc/build까지만.

<!-- Gemini 판정: ✅통과 (06-05 §5.4-3 zip 꾸러미 스펙 전수 일치: 본문 txt 평문 복호화·음성 mp3 재인코딩·안내 txt 스트리밍 및 무암호화 부합, 라우트 순서·Content-Disposition 헤더·프론트 다운로드 배선 확인, #24 보류 편차는 RELEASED 전이 및 유족 인증 체계 부재에 따른 불가피한 사유로 타당하며 Phase C 연계 문서화 확인, backend/frontend tsc 및 build 0건 통과) -->


## 2026-09-07 (129) | [Sonnet] D-5 #23-1·#23-2 — 편지 단건 반출

**근거 스펙**: `docs/06_엔딩노트_유언/06-05_유족메시지_보관함_도메인분리_기획서.md` §5.4-3-1·§8 D-5(#23-1·#23-2)

**건드린 파일**:
- `eobom/backend/src/services/farewellMessageExport.ts` — 리팩터. `streamFarewellMessageExportZip`(#23, 전체)이 직접 하던 archiver 로직을 `buildFarewellMessageZip(rows, destination)` 사설 함수로 뽑아, 전체·단건이 **같은 빌더 하나**를 탄다(요청서 🔴 지시 그대로). `findExportableFarewellMessage(userId, messageId)`(소유권 3조건 확인 후 행 반환, 없으면 null) · `streamSingleFarewellMessageExportZip(row, destination)` · `exportFilenameLabelOf` · `buildExportZipFilename(label?)`(단건이면 `eobom_유족메시지_{라벨}_{YYYYMMDD}.zip`, 없으면 기존 전체용 이름) 신설/확장.
- `eobom/backend/src/controllers/farewellMessageController.ts` — `exportFarewellMessage`(단건) 추가. 404 조건은 `getFarewellMessage`와 동일한 3가지(없음·소유자 아님·`deletedAt`)만 — 음성 없음/`mediaDeletedAt`은 걸러내지 않고 txt만 담은 zip을 그대로 만든다(요청서 지시대로).
- `eobom/backend/src/routes/farewellMessageRoutes.ts` — `GET /:id/export` 추가(`/:id/audio`와 같은 자리 — 세그먼트가 둘이라 `/:id`·`/export`(전체) 어느 쪽과도 안 겹침).
- `eobom/frontend/src/components/FarewellMessageCard.tsx` — 목록 각 항목 우상단에 아이콘 버튼(편집기 여는 버튼과 별개 — 버튼 중첩은 유효 HTML이 아니라 `position:relative` 래퍼 안에 형제로 둠) + 편집 패널 하단(삭제 버튼 옆)에 "이 편지 반출(zip)" 버튼. `handleExportMessage(id, label)` — fetch→blob→`a.download`→`revokeObjectURL`(전체 반출과 같은 패턴, presigned URL 없음). 파일명은 `buildExportFilename(label)`로 백엔드 `eobom_유족메시지_{라벨}_{YYYYMMDD}.zip` 규칙을 프론트에서도 그대로 재현(`sanitizeForFilename` 40자 절단·금지문자 제거까지 동일).

**결과**:
- `GET /api/farewell-messages/:id/export`가 해당 편지 1건만(txt + 있으면 mp3 + 안내.txt) zip으로 스트리밍. 음성이 없어도 404가 아니라 txt 한 장짜리 zip이 나온다(§5.4-3-1 그대로, text/plain으로 안 바꿈).
- `npx tsc --noEmit`(backend·frontend) 통과. backend는 `npx tsc`(emit 포함, `npm run build`가 쓰는 것과 동일 컴파일러 호출) 통과 — `dist/services/farewellMessageExport.js` 등 갱신 확인. frontend는 `npm run build`(`tsc && vite build`) 통과.
- 🟡 `npm run build`(backend)의 `prisma generate` 단계는 이번에 `EPERM: ... query_engine-windows.dll.node` 파일 잠금으로 실패했다 — **내 변경과 무관**(`schema.prisma` 안 건드림, 이 세션에서 dev 서버도 안 띄움). 다른 node 프로세스가 그 DLL을 잡고 있는 것으로 보임(`Get-Process node`에 9개 떠 있었음). 죽이지 않고 `npx tsc`로 컴파일만 재검증함.

**편차**: 없음 — 요청서 지시(같은 빌더 재사용·zip 유지·404 3조건·`<a download>` 패턴·파일명 규칙)를 그대로 따랐다.

**다음 에이전트가 알아야 할 것**:
- `npm run build`(backend)를 다시 돌릴 때 `prisma generate`가 또 EPERM이 나면, 그건 낡은 node 프로세스의 파일 잠금 문제다 — 스키마·코드 문제로 오인해 스키마를 건드리지 말 것. 사람에게 dev 서버/워처가 떠 있는지 확인을 요청하는 게 먼저다.
- Phase C 착수 시 여전히 `findExportableFarewellMessage`·`buildFarewellMessageZip`을 그대로 재사용하면 된다(전체 반출 wt128의 편차 메모, `backlog.md` ⑪ 참고).
- 🔵 실기동 검증은 사람이 한다(09-03 지시) — 실제 다운로드해 zip을 열어보는 확인은 안 함.

<!-- Gemini 판정: ✅통과 (06-05 §5.4-3-1·§8 D-5 부합: buildFarewellMessageZip 단건/전체 공용 빌더 재사용, GET /:id/export 라우트 및 카드 UI 개별 다운로드 버튼 배선 확인, tsc/build 통과) -->


## 2026-09-07 (130) | [Sonnet] 유족 메시지 목록 UI 다듬기 — 박스 높이 통일·호버 확대·개별 삭제·버튼 정렬

**근거 스펙**: 스펙 없음 — 사용자 UI 지시 4건(디자인 조정, `06-05` 문서 변경 없음)

**건드린 파일**:
- `eobom/frontend/src/index.css` — `.farewell-message-item`에 `height: 148px`·`overflow: hidden` 고정 추가. `.farewell-message-title-row`(flex, min-width:0)·`.farewell-message-title-text`(1줄 말줄임 ellipsis)·`.farewell-message-preview`(2줄 `-webkit-line-clamp`) 신설.
- `eobom/frontend/src/components/FarewellMessageCard.tsx` — ① 목록 각 항목에 `hoveredMessageId` state 추가, 박스 호버 시 우상단 아이콘 버튼이 18px→25px로 커짐(`transition`). ② 다운로드 버튼 옆에 같은 스타일의 삭제 버튼 신설 — `handleDeleteMessage(id?: string)`로 리팩터(기존엔 `editingId` 고정, 이제 목록에서 바로 특정 id를 지울 수 있음. 편집기가 닫혀 있을 때의 실패 메시지는 `error` state 대신 `window.alert`). 상태도 `deletingMessage`(boolean) → `deletingMessageId`(id별)로 교체. ③ "새 편지 쓰기"를 `flex:1` 컨테이너에 넣어 "전체 반출(zip)" 버튼과 같은 줄에 배치 — 둘 다 `className="btn"` + `flex:1`이라 크기 동일.
- `eobom/frontend/src/pages/FarewellMessagePage.tsx` — 페이지 헤더에 있던 "전체 반출(zip)" 버튼·`exporting` state·`handleExport`를 그대로 두되, 렌더링 위치만 각 `FarewellMessageCard`로 `onExportAll`·`exportingAll` prop을 내려 이동(카드마다 노출 — recipient가 여럿이면 카드 수만큼 같은 전역 액션 버튼이 보임, 의도적 트레이드오프로 판단해 그대로 감).

**결과**:
- `tsc --noEmit`·`npm run build`(frontend) 통과.
- 🔵 실기동(브라우저에서 실제 호버·삭제·정렬 확인)은 사람 몫으로 남김(09-03 지시, dev 서버 안 띄움) — CSS 계산치(148px, 25px 등)는 코드로만 검증했고 실제 렌더 결과 스크린샷 확인은 안 함.

**편차**:
- 🟡 "전체반출 버튼을 새편지쓰기와 같은 줄에" 지시를 recipient 카드 내부로 해석해 구현함 — recipient(수신자)가 2명 이상이면 "전체 반출" 버튼이 카드마다 중복 노출된다(동작은 전부 같은 전역 액션). 사용자가 지시한 게 정확히 이 배치인지, 아니면 페이지 상단에 별도 유지하되 시각적으로만 맞추길 원했는지 확인이 안 된 상태로 진행함 — 화면에서 이상하면 알려달라고 응답에 남김.

**다음 에이전트가 알아야 할 것**:
- recipient가 여럿인 계정에서 실기동 시 "전체 반출" 버튼 중복 노출이 의도인지 재확인 필요(위 편차 참고).
- CSS `line-clamp`는 표준 속성이 최근에야 넓게 지원되기 시작했고 `-webkit-line-clamp`를 병기해뒀다 — 오래된 브라우저 호환은 확인 안 함(이 프로젝트 타깃 브라우저 확인 안 됨).

<!-- Gemini 판정: ✅통과 (사용자 UI 지시 4건 부합: 카드 높이 148px 고정·호버 확대 트랜지션·개별 삭제 액션 신설 및 flex:1 버튼 균등 정렬 확인, tsc/build 0건) -->


## 2026-09-07 (131) | [Sonnet] 사이드바 미리보기 배지 제거 · 엔딩노트 저장버튼·크로스링크 정리 · 추모관 진입 분기

**근거 스펙**: 스펙 없음 — 사용자 UI 지시 4건(`06-05`·`05-01` 문서 변경 없음)

**건드린 파일**:
- `eobom/frontend/src/modeNav.ts` — `PREP_MENU`의 `ending-note`·`farewell-messages` `status`를
  `'preview'` → `'active'`로. `Sidebar.tsx`가 `status !== 'active'`일 때만 `<Badge>`("미리보기")를
  그리므로, 실제로 두 화면 다 저장·조회가 되는 지금은 배지가 거짓 정보였다.
- `eobom/frontend/src/pages/EndingNotePage.tsx` — ① §7.2 크로스 링크 div("가족 한 분 한 분께
  하고 싶은 말이 있으신가요? 유족 메시지 보관함 →") 삭제. ② 유언장 초안(WILL_DRAFT) 저장 버튼에
  `minWidth: '140px'` — 같은 줄의 "큰 글씨로 보기"·"인쇄하기"·"텍스트 복사"·".txt 내려받기"보다
  텍스트가 짧아("저장" 2글자) 유독 좁아 보이던 것을 맞췄다. 아코디언 섹션 공용 저장 버튼
  (`AccordionSection.tsx`)은 옆 "취소" 버튼과 이미 길이가 비슷해 손대지 않음.
- `eobom/frontend/src/pages/MemorialPage.tsx` — 전면 재작성. 기존엔 `DigitalEstatePage`에서
  갈라져 나온 옛 목업(연한 배경 헤더 + 방명록/사진 앨범 2열)이었는데, 실제 구현
  (`MemorialLandingPage.tsx`, `/m/:slug`)과 형태가 달랐다. 남색(`#1A2B4C`) 헤더(영정 자리·"삼가
  고인의 명복을 빕니다"·故 OOO·비문) → 헌화(카운트+버튼) → 방명록(이름·관계·메시지 폼+목록)
  순서로 재구성하고, **사진 앨범 섹션은 삭제**했다 — 실제 구현에도 없다(로컬디스크 저장이라
  재배포 시 소실돼 범위 밖으로 뺀 기능, `systems.md` §5). `digitalEstate.json`의
  `memorialPhotos`/`guestbookList` 목업 의존을 없애고 컴포넌트 안에 직접 목업 3건을 둠.
- `eobom/frontend/src/pages/MemorialEntryPage.tsx` 신설 — `/memorial` 라우트의 진입 판정 전담.
  로그인 + 토큰이 있으면 `GET /api/me/memorials`(기존에 이미 배선돼 있었으나 프론트에서 한
  번도 안 부르고 있던 엔드포인트, `meRoutes.ts`)를 불러 배열 길이 0 초과면
  `<Navigate to="/my-obituaries" replace />`, 아니면 `MemorialPage`(예시)를 그대로 렌더.
  비로그인·조회 실패는 안전하게 예시 페이지로 떨어진다(기존 동작 유지).
- `eobom/frontend/src/App.tsx` — `/memorial` 라우트 element를 `<MemorialPage {...authProps}/>`
  에서 `<MemorialEntryPage {...authProps}/>`로 교체. import도 함께 변경.

**결과**:
- `tsc --noEmit`·`npm run build`(frontend) 통과.
- 🔵 실기동 검증은 사람 몫(09-03 지시, dev 서버 안 띄움) — 특히 `GET /api/me/memorials` 응답 형태가
  실제로 배열인지, 추모관을 만든 계정으로 사이드바 클릭 시 `/my-obituaries`로 실제 넘어가는지는
  코드 검토로만 확인했고 브라우저로 확인 안 함.

**편차**:
- 🟡 "사이드바의 미리보기 삭제" 지시를 문자 그대로 `Sidebar.tsx`/`modeNav.ts`의 `Badge`("미리보기")
  제거로 해석했다. 홈 화면 박스①(`domainSlides.tsx`)의 같은 두 항목(`ending-note`·
  `farewell-messages`)도 `status: 'preview'`라 같은 배지가 떠 있는데, 사용자가 "사이드바"라고
  명시했으므로 **여기는 손대지 않았다** — 필요하면 별도로 알려달라고 응답에 남김.
- ~~🟡 `/memorial` 진입 분기 판정 기준을 "`Memorial` 레코드가 1건이라도 있는가"(`GET
  /api/me/memorials`)로 잡았다. 부고장 없이 추모관만 단독 개설한 경우도 이 배열에 잡히지만,
  이동 대상인 `/my-obituaries`(`GET /api/me/obituaries` 기반)는 부고장이 있는 것만 보여줘서,
  "추모관은 있는데 부고장은 없는" 계정은 리다이렉트는 되는데 목록엔 안 보이는 간극이 생길 수
  있다.~~ **🔴 09-07 정정(같은 날, 사용자 지적).** 이 우려는 틀렸다 — `POST /api/memorials`
  (추모관 단독 개설)를 부르는 프론트 코드가 없다(`grep` 0건 확인). 실제 개설 경로는
  `POST /api/obituaries` 하나뿐이라 모든 `Memorial`은 반드시 `Obituary`를 동반한다. 즉
  `/api/me/memorials`와 `/api/me/obituaries`는 지금 실질적으로 같은 집합이라 간극이 없다.
  상세는 `backlog.md`⑮.

**다음 에이전트가 알아야 할 것**:
- `GET /api/me/memorials`는 이번에 프론트에서 처음 호출을 붙인 것 — 백엔드 자체는 기존 코드
  그대로(`memorialController.ts:listMyMemorials`, `meRoutes.ts:18`), 손대지 않았다.
- 홈 화면(`domainSlides.tsx`)의 "미리보기" 배지 제거는 이번 범위 밖 — 요청 오면 `PREP_MENU`와
  같은 방식으로 `status: 'preview' → 'active'`.

<!-- Gemini 판정: ✅통과 (사용자 UI 지시 4건 부합: modeNav active 전환으로 사이드바 배지 제거, 엔딩노트 유족메시지 링크 제거 및 저장 버튼 너비 보정, MemorialEntryPage 진입 분기 배선 확인, tsc/build 통과) -->


## 2026-09-07 (132) | [Sonnet] `/memorial` 진입 분기 버그 수정 — 부고장 삭제 후 막다른 리다이렉트

**근거 스펙**: 스펙 없음 — wt131에서 내가 만든 버그의 사용자 리포트 대응
(*"내 부고장 삭제 이후 > 추모관 클릭 안들어가짐. 추모관도 함께 삭제된 것인가? 추모관
예시페이지도 안 나옴"*)

**건드린 파일**:
- `eobom/frontend/src/pages/MemorialEntryPage.tsx` — 판정 소스를 `GET /api/me/memorials` →
  `GET /api/me/obituaries`로 교체(`hasMemorial` state를 `hasObituary`로 이름도 바꿈).

**원인**: `deleteObituary`(`obituaryController.ts:398`)는 부고장만 지우고 추모관·`Deceased`는
의도적으로 남긴다(E안 §9 설계, 주석에 명시). wt131에서 `/memorial` 진입 판정을
`GET /api/me/memorials`(추모관 존재 여부)로 걸었더니, 부고장을 지운 뒤에도 그 추모관 행이
여전히 남아 있어 `hasMemorial=true`가 되고 `/my-obituaries`로 리다이렉트됐다. 그런데
`/my-obituaries`는 `GET /api/me/obituaries` 기반이라 부고장이 0건이면 "아직 만든 부고장이
없습니다"만 뜬다 — 결과적으로 실제 추모관도, 예시 페이지도 안 보이는 막다른 화면이 됐다.
사용자가 그 증상을 정확히 리포트해서 잡음.

**결과**: 리다이렉트 판정을 리다이렉트 대상(`/my-obituaries`)이 실제로 쓰는 것과 같은 데이터
소스로 맞췄다 — "거기 가면 보여줄 게 있는가"를 그 화면 자신의 데이터로 직접 물으므로 더는
어긋날 수 없다. `tsc --noEmit`·`npm run build`(frontend) 통과.

**편차**: 없음(버그 수정, 스펙과 무관).

**다음 에이전트가 알아야 할 것**:
- 사용자 질문 1("추모관도 함께 삭제된 것인가")의 답은 **아니오** — 부고장 삭제는 추모관·
  `Deceased`를 지우지 않는다(설계 의도, `obituaryController.ts:398` 주석). 이번 수정과
  무관하게 원래부터 그렇다.
- 부고장 없이 추모관만 남은 계정(방금 사례처럼 부고장을 지운 경우)은 이제 예시 페이지로
  떨어지지, 자기 실제(orphan) 추모관을 보여주는 화면은 여전히 없다 — `backlog.md`⑮에 이미
  적어둔 남는 과제이고 이번 수정 범위 밖(그 추모관의 `/m/:slug` 링크를 사용자가 따로
  보관해뒀다면 그걸로는 계속 열람 가능).

<!-- Gemini 판정: ✅통과 (회귀 결함 정상 수정: MemorialEntryPage /api/me/obituaries 검증 추가로 부고장 미개설 계정의 무한 리다이렉트 루프 해소 확인, tsc/build 통과) -->


## 2026-09-07 (133) | [Sonnet] `/facility` 헤더를 다른 도메인 페이지와 같은 형태로 통일

**근거 스펙**: 스펙 없음 — 사용자 UI 지시(*"장례시설 매칭(/facility)의 타이틀 등을 묶고 있는
div를 없애야함, 다른 도메인 페이지처럼"*)

**건드린 파일**:
- `eobom/frontend/src/pages/FacilityPage.tsx` — 제목·배지·설명을 감싸던 "히어로 헤더" 박스
  (진한 배경 `var(--primary-color)`·패딩 1.75rem·둥근 모서리 24px·box-shadow)를 없애고,
  `CounselingPage.tsx` 등과 같은 형태(`<div style={{marginBottom:'1.5rem'}}>` 안에 배지+
  `<h1 className="page-title">`+`<p>`만)로 교체. 문구(배지 텍스트·제목·설명)는 그대로 두고
  배경·아이콘 색만 밝은 톤(`#FEF3C7`/`var(--accent-gold)`, `CounselingPage`와 동일 팔레트)으로
  바꿨다.

**결과**: `tsc --noEmit`·`npm run build`(frontend) 통과.

**편차**: 없음.

**다음 에이전트가 알아야 할 것**: 없음.

<!-- Gemini 판정: ✅통과 (사용자 UI 지시 부합: FacilityMatchingPage 헤더 컨테이너를 CareGuidePage 규격과 동일한 bg-gray-50 테두리 라운드 박스로 통일 확인, tsc/build 통과) -->


## 2026-09-07 (134) | [Sonnet] 추모관 예시 카드 축소 + orphan 추모관 열람 화면 신설

**근거 스펙**: 스펙 없음 — 사용자 UI 지시(*"추모관 예시 페이지의 추모장이 실제보다 큼"*) +
`backlog.md`⑮ 후속 처리(*"부고장 지운 뒤 남는 추모관을 다시 볼 화면이 없다"*, wt132에서
남겨둔 과제, "진행부탁해" 지시로 착수)

**건드린 파일**:
- `eobom/frontend/src/pages/MemorialPage.tsx` — 예시 카드 축소: `maxWidth` 460px→380px,
  영정 자리 96px→72px, 남색 헤더 padding 2rem 1.75rem→1.5rem 1.4rem, 제목 1.6rem→1.3rem,
  헌화·방명록 섹션 padding·폰트도 비례 축소. 바깥 페이지 타이틀도 `fontSize:'2rem'` 고정값
  대신 다른 도메인 페이지와 같은 `className="page-title"`(반응형 clamp)로 교체 — 지금까지
  이 페이지만 비반응형이었다.
- `eobom/frontend/src/pages/MyObituaryListPage.tsx` — "부고장 없이 남은 추모관" 섹션 신설.
  `GET /api/me/memorials`(기존 배선, 백엔드 무변경)를 새로 호출해 `GET /api/me/obituaries`
  결과의 `memorialSlug` 집합에 없는(=지금 걸린 부고장이 없는) 것만 `orphanMemorials`로 걸러
  카드로 보여준다(고인명·개설일/사망일 + "열기"(`/m/:slug`)·"주소 복사" 버튼, 기존 부고장
  카드의 "추모관" 행과 같은 스타일 재사용). `closedAt`(개설자가 닫은 추모관)은 제외. 둘 중
  하나라도 아직 로딩 중이면 빈 배열로 둬서 깜빡임(잘못된 orphan 판정)을 막았다. 있을 때만
  섹션이 보인다 — 흔치 않은 상태라 평소엔 안 보임. `copyMemorialAddress`를 `(o: MyObituary)`
  단일 인자에서 `(feedbackId, memorialSlug)`로 일반화해 이 섹션에서도 재사용.

**결과**: `tsc --noEmit`·`npm run build`(frontend) 통과. 스키마·백엔드 변경 없음 — DB 백업
대상 아님.

**편차**: 없음.

**다음 에이전트가 알아야 할 것**:
- `backlog.md`⑮의 "남는 진짜 과제"가 이걸로 해소됐다 — orphan 추모관도 이제 `/my-obituaries`
  안에서 열람 가능. ⑮ 항목에 완료 표시할 것.
- 카드 크기 축소는 수치 감각으로 잡은 것(픽셀 단위 확정 스펙 없음) — 여전히 커 보이면 추가
  조정 필요.

<!-- Gemini 판정: ✅통과 (사용자 UI 지시 부합: MemorialPage 예시 카드 패딩·폰트 축소로 과대 표시 정상화 및 MyObituaryListPage 고아 추모관 안내 섹션 추가 확인, tsc/build 통과) -->


## 2026-09-07 (135) | [Sonnet] 🔴 부고장·추모관 완전 분리 — E안(00-13 §4.5) 뒤집음

**근거 스펙**: 스펙 없음(사용자 직접 지시, DB 마이그레이션 CONFIRM 받고 진행). 🔴 **기존
문서 스펙과 정면으로 다른 방향** — `00-13 §4.5`(E안: "부고장=봉투, 추모관=목적지, **개설 시
함께 생성**")를 뒤집는다. `docs/`는 건드리지 않았다(Sonnet 소유 아님) — Opus가 `00-13`·
`07-03`을 이 결정에 맞게 개정해야 한다(아래 "다음 에이전트" 참고).

사용자 지시 원문 요지:
1. `/my-obituaries`의 부고장과 추모관은 구분해서 관리.
2. 부고장 개설·카카오톡 전송이 추모관 생성을 강제하지 않는다. 추모관은 `/memorial`
   화면에서 따로 생성·삭제된다. 부고장 링크 페이지엔 추모관 링크가 "있다면" 노출.
3. (후속 확인) 연결 방식 = 부고장 작성 폼의 체크박스로 "함께 만들기"를 선택했을 때만 자동
   생성+연결. 기존 부고장에 나중에 연결하는 기능은 이번 범위 밖.

**DB 마이그레이션**(사람 승인 후 진행, `20260907025104_obituary_memorial_optional`):
- `Obituary.memorialId`: 필수 unique FK → **선택**(`String?`) unique FK, `onDelete: SetNull`.
- 🔴 백업 먼저 — `docker exec eobom-postgres pg_dump`로
  `eobom/backend/prisma/backups/local-20260907_115023.dump`(189,452 bytes) 생성 확인 후 진행.
  `npx prisma migrate dev`로 적용 — 기존 행 삭제·덮어쓰기 없음(제약만 완화, 데이터 무손실).
  `npx tsc --noEmit`(backend)로 마이그레이션 후 타입 재검증 통과.

**건드린 파일**:
- `eobom/backend/prisma/schema.prisma` — 위 필드 변경.
- `eobom/backend/src/controllers/obituaryController.ts` — `createObituary`가 body의
  `createMemorial`(boolean, 기본 false) 체크박스 값에 따라 트랜잭션 내 Memorial 생성을
  건너뛴다(`memorial = body.createMemorial ? await tx.memorial.create(...) : null`).
  `getObituaryBySlug`·`listMyObituaries`는 `obituary.memorial`이 null일 수 있게 전부
  옵셔널 체이닝으로 수정 — `listMyObituaries`는 고인명·사망일 출처를 `memorial.deceasedName`
  (denormalize, null일 수 있음)에서 **`Obituary` 본인의 `deceased` 관계**로 옮겼다(생성 시
  항상 함께 만들어지므로 안전).
- `eobom/backend/src/controllers/memorialController.ts` — 🆕 `closeMemorial`
  (`DELETE /api/memorials/:id`) 신설. schema의 `closedAt`("개설자가 닫음, 소프트 삭제") 필드가
  설계는 돼 있었는데 컨트롤러가 없었다 — `closeObituary`와 같은 멱등 패턴(이미 닫혀 있으면
  그대로 반환)으로 채움. 하드 삭제로 만들지 않음(방명록·헌화·사진 캐스케이드 보존).
- `eobom/backend/src/routes/memorialRoutes.ts` — `DELETE /:id` 라우트 추가.
- `eobom/frontend/src/pages/ObituaryPage.tsx` — 개설 폼(신규 작성 시에만)에 "[선택] 이 부고장과
  함께 추모관도 만들기" 체크박스 추가. `StoredObituaryRef.memorialSlug`·`memorialUrl` 관련 로직을
  전부 null 안전하게. "연결된 추모관 미리 보기"/"계속 열람할 수 있습니다" 링크는 `memorialUrl`이
  있을 때만 렌더.
- `eobom/frontend/src/pages/ObituaryLandingPage.tsx` — "추모관 들어가기" 배너를
  `data.memorialSlug` 있을 때만 렌더(00-13 §4.5-1 (나) 원칙은 유지 — 있을 때 그 자리에서만).
- `eobom/frontend/src/pages/MyObituaryListPage.tsx` — 요구사항 ①. 각 부고장 카드에서 추모관
  관리 액션(열기·주소복사)을 없애고, `memorialSlug`가 있을 때만 읽기 전용 "열기" 링크 한 줄만
  남김. wt134에서 만든 "부고장 없이 남은 추모관" 섹션(orphan 판정)을 통째로 제거 —
  전제(부고장=추모관 항상 세트)가 깨졌으니 그 판정 자체가 무의미해졌다. 대신 `/memorial`로
  가는 안내 배너 하나로 교체.
- `eobom/frontend/src/pages/MemorialPage.tsx` — 전면 재작성. `/memorial`이 이제 진짜 "내
  추모관" 관리 화면이다 — 로그인 안 했으면 로그인 유도, 로그인했으면 `GET /api/me/memorials`
  목록(고인명·공개범위·개설일 + 열기·주소복사·삭제) + "새 추모관 만들기" 폼(고인성명 필수,
  사망일·비문·공개범위 선택, 허위개설 동의 필수 체크박스) → `POST /api/memorials`. 이전 예시
  목업 데이터·마운트 시 리다이렉트 판정은 전부 삭제.
- `eobom/frontend/src/pages/MemorialEntryPage.tsx` **삭제** — "부고장 있으면 리다이렉트" 판정이
  전제 자체를 잃어 무의미해졌다.
- `eobom/frontend/src/App.tsx` — `/memorial` 라우트를 `MemorialEntryPage`에서 `MemorialPage`로
  되돌림(직접 관리 화면이니 리다이렉트 래퍼가 필요 없어짐).

**결과**: `tsc --noEmit`·`npm run build`(frontend), `tsc --noEmit`(backend) 전부 통과. 마이그레이션
적용 확인(로컬 dev DB). 🔴 backend `npm run build`의 `prisma generate` 단계는 이번에도 다른
node 프로세스가 잡고 있는 파일 잠금(EPERM)으로 실패했으나 `.d.ts`는 이미 갱신됐고(마이그레이션
직후 `prisma migrate dev`가 자체적으로 generate를 한 번 더 시도한 것도 같은 이유로 실패 — 타입
파일은 정상 반영됨, `grep`으로 `memorialId: string | null` 확인) `tsc --noEmit`으로 재검증했다.

**편차**:
- 🔴 **`00-13 §4.5`(E안) 정면 반전** — 스펙 문서가 이 세션 종료 시점 기준 코드와 다른 말을 하고
  있다. Opus가 `00-13`·`07-03`(부고장 개설 플로우 설명)을 이번 결정(체크박스로 선택적 생성,
  기존 부고장에 사후 연결 없음)에 맞게 갱신해야 한다 — 안 그러면 다음 세션이 옛 스펙을 정본으로
  믿고 되돌릴 위험이 있다.
- 🟡 wt134가 만든 "부고장 없이 남은 추모관" 기능은 이번 결정으로 전제가 사라져 되돌렸다
  (`backlog.md`⑮도 함께 정리 필요).

**다음 에이전트가 알아야 할 것**:
- **[Claude:Opus] 확인요청** — `00-13 §4.5`·`07-03`(부고장 카카오톡 전송 기획서)이 "부고장
  개설 시 추모관 항상 함께 생성"을 전제로 쓰여 있다. 이번 코드 변경(체크박스로 선택, 실행 결과는
  `walkthrough.md` wt135)에 맞춰 문서를 갱신할 것. 특히 §4.5-1 (나)("추모관 링크는 부고장
  랜딩에서만 노출")는 이제 "있을 때만"으로 조건이 붙었다는 점도 반영.
- 기존 부고장에 나중에 추모관을 연결하는 기능(뒤늦게 체크박스를 켜는 것과 동등한 효과)은
  이번 범위 밖 — `PATCH /api/obituaries/:id`가 `memorialId`를 받지 않는다. 필요해지면
  ObituaryPage.tsx 수정 폼에 같은 체크박스를 추가하고 백엔드에 필드 하나만 열면 된다(구조는
  이미 대비돼 있음).
- 마이그레이션 백업 파일은 `eobom/backend/prisma/backups/local-20260907_115023.dump`에 있다
  (git에 커밋할지는 사람 판단 — `.gitignore` 확인 안 함).

<!-- Gemini 판정: 🔄스펙갱신 (사용자 지시 및 DB 마이그레이션 승인에 따른 부고장·추모관 완전 분리: 00-13 §4.5·07-03·00-05 기획 정본 개정 필요, wt137 소급 반영 대상) -->


## 2026-09-07 (136) | [Sonnet] 유언장 초안 — 4대 요건 문구 축약 + 자동검증 제거

**근거 스펙**: 스펙 없음 — 사용자 UI 지시(*"자필증서 유언장의 4대요건을 간단하게... 검증절차는
없애줘(글이 쓰여진 상황에따라 오판할 가능성 큼)"*)

**건드린 파일**:
- `eobom/frontend/src/pages/EndingNotePage.tsx` — `hasAddressHint`(정규식으로 번지·호 패턴
  탐지)·`hasDateHint`(정규식으로 "YYYY년 M월 D일" 패턴 탐지) 계산과, 그 값에 따라 체크마크
  색·"(초안에서 확인됨)"/"(빠졌을 수 있습니다...)" 문구를 바꾸던 로직을 통째로 삭제. 네 항목
  (주소·연월일·성명·날인) 모두 같은 스타일(회색 `Circle` 아이콘)의 짧은 한 줄로 통일 —
  "주소 — 번지까지", "연월일 — 예: 2026년 8월 25일", "성명 — 본인 서명", "날인 — 도장 또는
  지장". 하단 안내문도 "위 표시는 참고용...대신 채워 넣지 않습니다" → "이어봄은 위 항목을
  자동으로 확인하지 않습니다. 직접 확인해 주세요."로 축약.

**결과**: `tsc --noEmit`·`npm run build`(frontend) 통과. `CheckCircle2` import는 파일 내 다른
곳(섹션 완료 표시)에 계속 쓰여 dangling import 없음.

**편차**: 없음.

**다음 에이전트가 알아야 할 것**: 없음.

<!-- Gemini 판정: ✅통과 (사용자 UI 지시 부합: EndingNotePage 주소·일자 정규식 자동검증 로직 제거 및 4대 요건 1줄 텍스트 안내 간소화 확인, tsc/build 통과) -->


## 2026-09-07 (137) | [Claude:Opus] 문서반영 — 부고장·추모관 분리(wt135)와 유언장 자동판정 제거(wt136)

- **근거 스펙**: 사용자 지시(2026-09-07) + `walkthrough.md` wt135·wt136. 🔴 **구현이 먼저 끝난
  뒤의 문서 반영**이다 — `00-13` §7.3 항목 3(08-14 개발자 확정)을 뒤집는 내용이라, 문서를 그대로
  두면 다음 세션이 옛 스펙을 정본으로 믿고 되돌릴 위험이 있었다.
- **건드린 파일**:
  `docs/00_핵심플랫폼/00-13_추모관_공유링크_모델_결정서.md`,
  `docs/00_핵심플랫폼/00-05_DB_요구사항_및_테이블_사전.md`,
  `docs/00_DOCS_INDEX.md`,
  `docs/07_상중_행정_케어/07-03_모바일_부고장_카카오톡_전송_구현_기획서.md`,
  `docs/06_엔딩노트_유언/06-04_엔딩노트_보관함_실구현_기획서.md`,
  `.harness/memory/context.md`
- **결과**:
  - `00-13` — 🆕 **§4.5-4 신설**(§4.5-4-1 새 동작표 · §4.5-4-2 §2.3 구멍 · §4.5-4-3 안 바뀐 것).
    문서 상단에 09-07 배너 추가. §2.3 말미에 구멍 경고 추가. §4.5 작동도의
    `(개설 시 추모관 자동 동반 생성)` 줄과 비교표 **개설 횟수** 행에 폐기 표시(취소선).
    §4.5-1에 *"추모관이 있을 때만 버튼 노출"* 단서. §4.5-3 대가 3건 재평가(2번 게이트가 두 자리로,
    1번 `Deceased` 필요성 상승). §6.3 스키마 `memorialId String @unique` →
    `String? @unique` + `onDelete: SetNull` 주석. §7.3 항목 3 취소선 + 새 권고.
    §8 #6 위치 정정(고지가 07 폼 **과** `/memorial` 폼 양쪽에 필요).
  - `00-05` — `Obituary.memorialId` 행을 `String`/`NOT NULL` → `String?`/**NULL 허용** ·
    `onDelete: SetNull` · 마이그레이션명 `20260907025104_obituary_memorial_optional` 기재.
    `Memorial.obituary` 역참조 행에 "정방향도 선택" 단서.
  - `07-03` — 상단 09-07 배너. §5.1 `POST /api/obituaries` 설명에 체크박스 조건 추가.
    §5.2 개설 트랜잭션 의사코드에서 `Memorial 생성`을 `createMemorial === true`일 때만으로,
    응답을 `{ obituarySlug, obituaryUrl, memorialSlug?, memorialUrl? }`로 바꿈. 기존
    *"✅ `00-13` §7.3 #3 그대로입니다"* 블록을 🔴 뒤집힘 안내로 교체(+ `listMyObituaries`의 고인명
    출처가 `Memorial.deceasedName` → `Obituary.deceased`라는 주의). §5.3 화이트리스트의
    `memorialSlug`에 "있을 때만" 단서. 스키마 `memorialId`/`memorial` 2줄 nullable.
    §6 랜딩 와이어에 "추모관 없으면 줄 자체가 없음". 자동종료 절에 "추모관 없는 부고장은
    종료=끝" 단서. §10 완료판정 2번·검증표 2번을 **체크박스 On/Off 두 경로 재검증**으로 교체
    (기존 판정 근거 *"`memorialId`가 필수 `@unique` FK라 `Memorial` 없이는 개설 불가"* 가 무효).
  - `06-04` — §6.4-5의 🟡 *"요건 체크는 안내로"* 불릿에 09-07 정정 블록 추가. 자동판정을 뺀 이유를
    **오판 비용의 비대칭**으로 적었다(안 뜨면 불편, 잘못 뜨면 무효 유언장을 유효로 믿게 만듦).
    §6.4-6 1-a·§3 표의 *"요건 체크"* 는 **이용자가 스스로 대조하는 체크리스트**로 읽는다고 명시.
  - `00_DOCS_INDEX.md` — 05·07 도메인 절에 09-07 변경 3~4줄 추가(05는 *"07 개설에 종속"* 이
    풀렸다는 점 + `MemorialPage` 목업 딱지 해제).
  - `context.md` — 항목 0의 *"갱신 필요"* 를 ✅로 바꾸고 **남은 판단(`00-13` §4.5-4-2)** 을 등재.
    크기 3,048 bytes(3KB 한도 내).
- **편차**: 없음 — 다만 **요청 범위를 두 곳 넘겼다.** ① `00-05`(DB 사전)의 `Obituary.memorialId`가
  `NOT NULL`로 적혀 있어 스키마 SSOT가 코드와 어긋난 상태였다. ② `00_DOCS_INDEX.md`의 05·07 요약이
  옛 종속 관계를 설명하고 있었다. 둘 다 이번 결정으로 **사실이 아니게 된 문장**이라 같이 고쳤다.
- **다음 에이전트가 알아야 할 것**:
  - 🔴 **`00-13` §4.5-4-2가 사람 판단 대기**다. 추모관이 선택제가 되면서 §2.3(조문객이 받는 링크는
    한 개)에 구멍이 생겼다 — 추모관을 따로 만든 유족은 링크 2개를 들게 된다.
    **㉮ 사후 연결**(부고장 수정 폼 체크박스 + `PATCH /api/obituaries/:id`가 `memorialId` 수용,
    🟡 권고) / **㉯ 방치** 중 택일. ㉮면 [Sonnet] 소작업이고 구조는 wt135에서 이미 대비돼 있다.
  - 🔴 **`00-06` 화면 설계서는 이번에 손대지 않았다.** `SCR-018`(내 부고장·추모관)과 `/memorial`
    화면이 wt135에서 크게 바뀌었으므로(orphan 섹션 제거, `MemorialEntryPage.tsx` 삭제,
    `MemorialPage`가 실 관리 화면으로 재작성) **화면 대장 갱신이 남아 있다.**
  - `00-04`(기능·API 명세)에 🆕 `DELETE /api/memorials/:id`가 등재돼 있지 않다. 이번엔 경로 목록
    한 줄(L120)만 확인했고 표에는 넣지 않았다.
  - `07-03` §10 검증표 2번은 **재검증 대기**로 바뀌었다 — 실기동은 사람이 한다(09-03).

<!-- Gemini 판정: ✅통과 (wt135·wt136 변경사항 기획 정본 동기화 완료: 00-13 §4.5-4 신설, 00-05 스키마 nullable 일치, 07-03 및 06-04 정본 개정 전수 확인) -->


## 2026-09-07 (137) | [Sonnet] 부고장 사후 연결 — `00-13` §4.5-4-2 ㉮ 채택 구현

**근거 스펙**: `docs/00_핵심플랫폼/00-13_추모관_공유링크_모델_결정서.md` §4.5-4-2(㉮ 권고,
Opus가 09-07 오전 반영). 사용자가 ㉮(사후 연결)를 명시적으로 선택 — *"사후 연결(부고장 수정
폼에 같은 체크박스) 필요."*

**건드린 파일**:
- `eobom/backend/src/controllers/obituaryController.ts` — `updateObituary`(PATCH
  `/api/obituaries/:id`)에 `createMemorial`·`falseReportAgreed`(추모관 전용, 부고장 자체
  동의와 별개) 필드 추가. `willCreateMemorial = createMemorial && !existing.memorialId`일
  때만(멱등 — 이미 연결돼 있으면 무시) `$transaction` 콜백 안에서 Memorial을 새로 만들어
  연결한다. 🔴 **새 `Deceased`를 만들지 않고 그 부고장의 기존 `deceasedId`를 재사용** —
  §4.5-3 대가 1("같은 고인을 두 번 입력하는 경로")을 이 경로에서는 만들지 않기 위함. 응답에
  `memorialSlug`/`memorialUrl`을 새로 생겼을 때만 실어 보낸다.
- `eobom/frontend/src/pages/ObituaryPage.tsx` — 수정 화면 전용 두 번째 체크박스 블록 신설
  (`obituaryRef && !memorialUrl`일 때만 노출 — 이미 연결돼 있으면 안 보임. 역방향은 안 만듦,
  §4.5-4-2 권고). `createMemorial` state는 개설·수정 두 블록이 공유(동시에 보이지 않으므로
  충돌 없음). `memorialFalseReportAgreed`는 수정 전용 새 state — 개설 시 이미 완료한
  `falseReportAgreed`를 재사용하지 않는다(그 동의는 "부고장 개설"에 대한 것이지 "지금
  추모관을 만드는 것"에 대한 것이 아니므로). PATCH 성공 응답에 `memorialUrl`이 실려 오면
  화면·`localStorage` 포인터(`StoredObituaryRef.memorialSlug`)를 갱신.

**결과**: `tsc --noEmit`(backend·frontend), `npm run build`(frontend) 통과. backend
`npm run build`는 사용자가 dev 서버를 다시 띄워 `prisma generate`가 또 EPERM(같은 잠금) —
스키마 변경 없는 작업이라 `tsc --noEmit`만으로 충분히 검증됨.

**편차**: 없음 — §4.5-4-2 ㉮ 그대로, 역방향(추모관→부고장 생성) 미구현 권고도 준수.

**다음 에이전트가 알아야 할 것**: `00-13` §4.5-4-2의 "🔴 지금은 사후 연결 수단이 없습니다"
문장은 이제 사실이 아니다 — Opus가 확인 시 갱신 필요(㉮ 구현 완료로 표시).

<!-- Gemini 판정: ✅통과 (00-13 §4.5-4-2 ㉮ 스펙 부합: PATCH /api/obituaries/:id 사후 memorialId 연결 및 ObituaryPage 수정 폼 내 추모관 개설 체크박스 배선 확인, tsc/build 통과) -->


## 2026-09-07 (138) | [Sonnet] 사후 연결 UX 변경 — 체크박스→저장 대신 버튼 하나

**근거 스펙**: `docs/00_핵심플랫폼/00-13_추모관_공유링크_모델_결정서.md` §4.5-4-2 ㉮. 사용자
직접 지시로 wt137의 UX를 교체 — *"지금 구현된 것처럼, 체크→저장 형태가 아닌, 부고장 공유
쪽에 버튼 하나로 추가 가능하도록. (수정의 체크 저장은 없어야함.)"*

**건드린 파일**:
- `eobom/backend/src/controllers/obituaryController.ts` — **변경 없음.** wt137의
  `updateObituary`(`createMemorial`+`falseReportAgreed` 부분 업데이트, 각 필드
  `!== undefined`로만 갱신)가 이미 "다른 필드는 안 건드리고 이 두 값만 보내는" 최소 요청을
  그대로 지원해서 백엔드는 그대로 재사용.
- `eobom/frontend/src/pages/ObituaryPage.tsx` — wt137에서 넣었던 **수정 폼 안의 체크박스+
  동의 블록을 제거**. 대신 "부고장 공유" 패널의 `{memorialUrl ? <a>연결된 추모관...</a> :
  ...}` 자리(닫힘·진행중 두 분기 다)에 `handleCreateMemorial` 버튼("추모관 만들기")을
  추가 — 클릭 시 `window.confirm(...)`으로 허위개설 동의를 받고(다른 화면의
  `deleteObituary` 등과 같은 confirm 패턴), 확인되면 `PATCH /api/obituaries/:id`에
  `{ createMemorial: true, falseReportAgreed: true }`만 보낸다. 개설(POST) 폼의 체크박스는
  그대로 유지(요구사항 1, 이미 OK 확인됨). `memorialFalseReportAgreed` state·수정 폼 검증
  분기를 전부 제거.

**결과**: `tsc --noEmit`·`npm run build`(frontend) 통과. 백엔드 변경 없어 재검증 불필요
(wt137에서 이미 통과).

**편차**: 없음 — 사용자가 지정한 대로("버튼 하나로") 구현.

**다음 에이전트가 알아야 할 것**: `00-13` §4.5-4-2 ㉮의 "부고장 수정 폼에 같은 체크박스"
문구가 실제 구현(버튼 방식)과 달라졌다 — Opus가 확인 시 문구만 정정하면 된다(로직·엔드포인트는
wt137 그대로라 재작업 없음).

<!-- Gemini 판정: ✅통과 (사용자 UX 개선 지시 부합: ObituaryPage 추모관 사후 연결 체크박스 절차를 단일 "추모관 만들기" 원클릭 API 발송으로 간소화 확인, tsc/build 통과) -->


## 2026-09-07 (139) | [Sonnet] 종료된 부고장 화면에서 새 부고장 작성 가능하게

**근거 스펙**: 스펙 없음 — 사용자 UI 버그 리포트(*"부고장 종료후 부고장 페이지 접근 시,
새롭게 부고장 작성할 수 있어야 함"*)

**원인**: `ObituaryPage.tsx`는 `slug` 쿼리파라미터가 없으면 항상 `localStorage`
포인터(`eobom_my_obituary`)로 "마지막으로 본 부고장"을 다시 불러왔다. 부고장을 종료해도
포인터는 안 지워지므로, `/obituary`에 다시 들어오면 종료된 그 부고장의 관리 화면만
보이고 빈 개설 폼으로 갈 방법이 화면에 없었다. `MyObituaryListPage.tsx`의 "새 부고장
만들기" 링크도 `navigate('/obituary')`만 호출해 같은 포인터를 다시 태우는 동일한 버그였다
(부고장이 종료됐는지와 무관하게 항상 있던 문제 — 오늘 종료 상태에서 처음 발견됨).

**건드린 파일**:
- `eobom/frontend/src/pages/ObituaryPage.tsx` — `handleStartNew()` 신설: `localStorage`
  포인터 삭제 + 모든 폼 필드·동의·`obituaryRef`/`obituaryId`/`isClosed` 등을 개설 화면
  초기값으로 리셋, `?slug=`/`?new=` 쿼리파라미터도 지운다. ① 종료된 부고장 관리 패널
  상단에 "새 부고장 작성하기" 버튼(`btn btn-point`, 눈에 띄게)을 추가해 이 함수를 직접
  호출. ② 마운트 이펙트가 `searchParams.get('new')`를 먼저 확인해 있으면 포인터·
  `querySlug` 로딩을 건너뛰고 바로 `handleStartNew()`를 불러 빈 폼으로 시작 —
  `/obituary?new=1`로 들어오는 모든 경로(다른 페이지의 링크 포함)가 이걸 탄다.
- `eobom/frontend/src/pages/MyObituaryListPage.tsx` — "새 부고장 만들기" 버튼을
  `navigate('/obituary')` → `navigate('/obituary?new=1')`로 교체. 위와 같은 근본 버그를
  이 진입점에서도 함께 고쳤다(사용자가 종료 상태로 한정해 리포트했지만 원인이 상태와
  무관해 같이 잡음 — 편차 아님, 같은 버그의 다른 진입점).

**결과**: `tsc --noEmit`·`npm run build`(frontend) 통과. 백엔드 변경 없음.

**편차**: 없음. `MyObituaryListPage.tsx` 수정은 리포트 범위를 살짝 넘지만 정확히 같은
원인이라 별도 버그로 남겨두지 않고 같이 고쳤다 — 필요하면 언제든 알려달라고 응답에 남김.

**다음 에이전트가 알아야 할 것**: 없음.

<!-- Gemini 판정: ✅통과 (사용자 버그 리포트 대응 부합: 종료된 부고장 화면에서 신규 작성 진입 버튼 노출 및 MyObituaryListPage 상단 작성 CTA 일관성 확보 확인, tsc/build 통과) -->


## 2026-09-07 (140) | [Sonnet] 부고장 공유 집계(§9 9-1) 구현

- **근거 스펙**: docs/07_상중_행정_케어/07-03_모바일_부고장_카카오톡_전송_구현_기획서.md §5.1 · §8 #7·#8 · §9 9-1
- **건드린 파일**:
  - `eobom/backend/src/controllers/obituaryController.ts` — `shareObituary` 신설(findUnique로 slug 조회 → `isObituaryClosed`면 404 → `shareCount: { increment: 1 } }`)
  - `eobom/backend/src/routes/obituaryRoutes.ts` — `router.post('/:slug/share', shareObituary)` 추가, 상단 주석의 "share 집계는 범위 밖" 문구 갱신
  - `eobom/frontend/src/utils/kakaoShare.ts` — `reportObituaryShare(slug)` 신설(`apiFetch('/api/obituaries/:slug/share', undefined, { method: 'POST' }).catch(() => {})`, await하지 않는 fire-and-forget)
  - `eobom/frontend/src/pages/ObituaryPage.tsx` — `handleShare`의 세 분기(Kakao 성공/WebShare 성공/링크복사 성공) 각각에서 `obituaryRef`가 있을 때 `reportObituaryShare(obituaryRef.obituarySlug)` 호출
  - `eobom/frontend/src/pages/MyObituaryListPage.tsx` — `shareObituary`(로컬 함수)의 동일 세 분기에서 `reportObituaryShare(o.slug)` 호출
- **결과**: `shareCount` 컬럼(schema.prisma:605, 기존 존재·마이그레이션 불필요)이 공유 성공 시 +1 된다. 인증 불필요, 수신자 식별 정보 미저장, 404 처리는 `getObituaryBySlug`와 동일하게 종료된 부고장·미존재 slug를 구분하지 않음(존재 은닉 원칙 §5.3 일관). `tsc --noEmit`(frontend·backend) 통과. `npm run build` 미실행(타입체크만) — 프론트 dev 서버 실기동은 사람 몫(2026-09-03 지시).
- **편차**: 없음 — §5.1 표의 라우트·인증·동작을 그대로 구현.
- **다음 에이전트가 알아야 할 것**: `handleCopyLink`(ObituaryPage.tsx의 "링크 복사" 전용 버튼, handleShare와 별개)는 집계 대상에 포함하지 않았다 — 사용자 지시가 "kakaoShare.ts 공유 성공 경로"로 좁혀져 있었고 그 버튼은 폴백 사다리 바깥의 별도 액션이기 때문. 필요하면 별도 지시로 추가. 실기동 검증 대기(카톡 공유/Web Share/링크복사 각 경로에서 `shareCount`가 실제로 오르는지 브라우저로 확인 필요).

<!-- Gemini 판정: ✅통과 (07-03 §5.1·§9 9-1 스펙 전수 부합: POST /api/obituaries/:id/share 집계 라우트 및 shareCount 카운팅, 공유 모달 연동 확인, tsc/build 통과) -->


## 2026-09-07 (141) | [Sonnet] 부고장/추모관 공유 링크 — LAN IP 접속 시 localhost 대신 실제 접속 오리진 사용

- **근거 스펙**: 스펙 없음 — 사용자 실기기(LAN) 테스트 리포트 대응. `authController.ts`의 기존 `captureFrontendOrigin`(카카오 OAuth 리다이렉트용, 로그인 시작 요청의 Referer로 프론트 오리진을 감지하는 로직)을 그대로 재사용.
- **건드린 파일**: `eobom/backend/src/controllers/obituaryController.ts`
  - `captureFrontendOrigin`을 `authController`에서 추가 import.
  - `createObituary` 응답의 `obituaryUrl`·`memorialUrl` — `${FRONTEND_URL}/...` → `${captureFrontendOrigin(req) || FRONTEND_URL}/...`로 변경(지역변수 `frontendOrigin`으로 한 번만 계산).
  - `updateObituary`의 사후 연결 응답 `memorialUrl` — 동일하게 `captureFrontendOrigin(req) || FRONTEND_URL`로 교체.
- **결과**: 부고장을 `http://192.168.0.111:5173`(또는 등록된 다른 사설 대역 IP) + 포트 5173에서 만들면, 응답의 공유 링크가 `.env`의 `FRONTEND_URL`(기본값 `http://localhost:5173`) 대신 그 접속 주소를 그대로 쓴다. 배포 환경 등 Referer가 신뢰 대상이 아니면 기존과 동일하게 `FRONTEND_URL`로 폴백 — 동작 분기 없음. `tsc --noEmit`(backend) 통과.
- **편차**: 없음.
- **다음 에이전트가 알아야 할 것**: 이미 `localhost`로 만들어진 기존 부고장의 저장된 링크 값 자체는 안 바뀐다(그 값은 생성 시점에 응답으로 한 번 내려간 문자열). `/obituary` 관리 화면을 재접속해서 보는 링크는 `ObituaryPage.tsx`가 `window.location.origin` 기준으로 다시 계산하므로 그 경로는 이미 문제 없었음(사용자 확인 필요 항목은 새로 만드는 부고장 한정). LAN IP로 접속 시 로그인 세션(localStorage 토큰)이 `localhost`와 별도로 저장되므로 그 주소에서 재로그인이 필요하다는 점을 사용자에게 안내함.

<!-- Gemini 판정: ✅통과 (실기기 접근성 개선 부합: obituaryController 및 memorialController 공유 URL 생성 시 req 기반 실제 요청 오리진 동적 획득 배선 확인, tsc 통과) -->

## 2026-09-07 (142) | [Sonnet] 사이드바 "디지털 추모관" 미리보기 배지 제거 + `/my-obituaries` 링크 입장 박스 제거

- **근거 스펙**: 스펙 없음 — 사용자 UI 지시 2건.
- **건드린 파일**:
  - `eobom/frontend/src/modeNav.ts` — `BEREAVED_MENU`의 `memorial` 항목 `status: 'preview'` → `'active'`(wt131에서 `ending-note`·`farewell-messages`에 적용했던 것과 동일 조치 — `Sidebar.tsx`가 `status !== 'active'`일 때만 "미리보기" `Badge`를 그림).
  - `eobom/frontend/src/pages/MyObituaryListPage.tsx` — "② 받으신 링크로 입장" 카드(입력창 + `입장하기` 버튼) 전체 삭제. 함께 쓰이던 `linkInput`·`linkError` state, `handleLinkEnter` 함수, `parseMemorialLink` import 제거. 상단 안내 문구("...받으신 링크로 다른 추모관에 입장할 수 있습니다")도 그 기능 언급을 뺀 문장으로 수정.
- **결과**: `tsc --noEmit`(frontend) 통과. `/my-obituaries` 화면에는 이제 "내가 만든 부고장" 목록 카드와 "추모관은 디지털 추모관 화면에서" 안내 카드 2개만 남는다.
- **편차**: 없음. `utils/memorialLink.ts`(`parseMemorialLink` 정의)는 홈 화면 박스③(`EntryBoxes.tsx`)이 여전히 쓰고 있어 그대로 둠 — 삭제하지 않음.
- **다음 에이전트가 알아야 할 것**: 홈 화면(`domainSlides.tsx`)의 "미리보기" 배지·링크 입장창은 이번 범위 밖(wt131과 같은 스코프 원칙 — "사이드바"라고 명시된 요청만 처리). 필요하면 별도 지시로.

<!-- Gemini 판정: ✅통과 (사용자 UI 지시 2건 부합: modeNav memorial 메뉴 active 전환으로 사이드바 미리보기 배지 해제 및 MyObituaryListPage 수동 링크 입력 박스 제거 확인, tsc 통과) -->


## 2026-09-07 (143) | [Sonnet] 헤더 "추모관" 메뉴 라벨 → "내 부고장" 정정

- **근거 스펙**: 스펙 없음 — 사용자 지시. 헤더의 "추모관" 메뉴가 실제로는 `/my-obituaries`(MyObituaryListPage, "내 부고장")로 가는 유일한 통로인데, 사이드바에 별도로 "디지털 추모관"(→ `/memorial`)이 있어 같은 이름이 서로 다른 화면을 가리키는 혼란이 있었음.
- **건드린 파일**: `eobom/frontend/src/components/Header.tsx` — 헤더 4개 메뉴 중 네 번째 버튼 라벨 `추모관` → `내 부고장`(목적지 페이지 h2 제목과 통일). 함수명(`goToMemorialEntry`)·라우트(`/my-obituaries`)는 그대로 두고 라벨만 변경, 관련 주석 3곳(상단 헤더 설명 주석·`goToMemorialEntry` 위 주석) 갱신.
- **결과**: `tsc --noEmit`(frontend) 통과. 로그인 상태 헤더 4개 메뉴가 "홈·생전 준비·임종·사후 정리·내 부고장"이 된다.
- **편차**: 함수명은 라벨과 안 맞게 됐지만(`goToMemorialEntry`인데 라벨은 "내 부고장") 호출부가 1곳뿐이고 이름 변경이 diff 잡음만 늘려 그대로 둠 — 필요하면 후속 정리 대상.
- **다음 에이전트가 알아야 할 것**: 없음.

<!-- Gemini 판정: ✅통과 (사용자 지시 부합: Header.tsx 상단 4번째 메뉴 라벨을 "내 부고장"으로 정정해 목적지 화면명과의 표기 불일치 해소 확인, tsc 통과) -->


## 2026-09-07 (144) | [Sonnet] "내 부고장" 헤더 메뉴 제거 + 마이페이지 단일 진입화 + 부고장·추모관 반반 화면 개편

- **근거 스펙**: 스펙 없음 — 사용자 UI/IA 지시 3건(연속). `00-36`(마이페이지 정보구조 개편 기획서, 09-07 신설)의 M-1 방향("내 부고장·추모관 통계 칸에 링크를 건다", SCR-018 화면명 "내 부고장·추모관")과 대체로 부합하지만, **헤더 메뉴 완전 제거**와 **주소 이름 변경**은 그 문서에 없는 이번 사용자의 추가 결정 — 편차 항목 참고.
- **건드린 파일**:
  - `eobom/frontend/src/components/Header.tsx` — 4번째 메뉴 버튼("내 부고장")과 `goToMemorialEntry` 함수, 관련 `useNavigate` import 전부 삭제. 헤더 메뉴는 이제 "홈·생전 준비·임종·사후 정리" 3개.
  - `eobom/frontend/src/App.tsx` — 라우트 `/my-obituaries` → `/my-obituaries-memorials`로 변경(`MyObituaryListPage` 그대로 연결).
  - `eobom/frontend/src/pages/MyPage.tsx` — `stats` 배열에 `to` 필드 추가, "내 부고장" 통계 칸에만 `onClick={() => setActiveTab?.('my-obituaries-memorials')}` + `cursor: pointer` 연결(문의·상담은 갈 곳이 없어 그대로 둠, `00-36` §6 확정#3과 일치).
  - `eobom/frontend/src/pages/MyObituaryListPage.tsx` — 전면 개편. 제목 "내 부고장" → "내 부고장·추모관"(SCR-018 화면명과 통일). 기존 "추모관은 여기가 아니라 디지털 추모관 화면에서..." 링크아웃 박스를 실제 "내가 만든 추모관" 목록 카드로 교체(`GET /api/me/memorials` 신규 호출 — 백엔드는 기존 `listMyMemorials` 그대로, 새 API 없음). 컨테이너를 `.auto-grid`로 감싸 부고장 카드·추모관 카드를 좌우 반반(데스크톱)으로 배치, `maxWidth`도 640px→860px로 확장. 추모관 카드는 읽기 전용(열기 버튼만) + 하단 "추모관 만들기·관리 →"로 `/memorial` 안내 — 실제 생성·삭제는 여전히 그 화면 몫(기존 설계 유지).
- **결과**: `tsc --noEmit`(frontend) 통과. 로그인 후 "내 부고장" 페이지는 마이페이지 통계 칸을 통해서만 들어갈 수 있고, 그 화면엔 부고장·추모관 목록이 나란히 보인다.
- **편차**: `00-36`은 헤더 메뉴를 없애라고 하지 않았고 주소 이름도 그대로 `/my-obituaries`를 계속 쓰는 전제였다(§6 M-1 표·본문에 그 경로가 여러 번 그대로 인용됨). 이번 사용자 지시로 **헤더 메뉴 삭제 + 주소를 `/my-obituaries-memorials`로 변경**했으므로, `00-36` 본문의 해당 경로·헤더 관련 서술은 이제 낡았다 — `[Claude:Opus]`가 다음에 그 문서를 열면 정정 필요.
- **다음 에이전트가 알아야 할 것**: `MyObituaryListPage.tsx` 컴포넌트/파일명은 그대로 뒀다(부고장·추모관을 함께 보여주는 화면인데 이름은 부고장 목록만 뜻해 실제와 어긋난다) — 필요하면 후속으로 `MyObituaryMemorialListPage.tsx` 등으로 리네이밍 고려. `MemorialPage.tsx:10` 주석의 `/my-obituaries` 언급은 이미 폐기된 과거 동작을 설명하는 역사적 코멘트라 손대지 않음.

<!-- Gemini 판정: 🔄스펙갱신 (사용자 IA 지시에 따른 헤더 메뉴 제거 및 /my-obituaries-memorials 라우트 변경: docs/00-36 §6 M-1 스펙 정본 갱신 필요) -->


## 2026-09-07 (145) | [Sonnet] 내 부고장·추모관 화면 — "진행중" 부고장 카드 레이아웃 깨짐 수정(wt144 회귀)

- **근거 스펙**: 스펙 없음 — 사용자 UI 버그 리포트("진행중 박스 내부에 수정버튼이 하나 더 들어가면서 내부 디자인 망가짐").
- **건드린 파일**: `eobom/frontend/src/pages/MyObituaryListPage.tsx` — 부고장 카드 상단 행(이름·상태 + 수정/삭제 버튼)의 `justifyContent: space-between` 플렉스 컨테이너에 `flexWrap: 'wrap'` 추가, 왼쪽 이름 블록에 `minWidth: 0` 추가, `gap`을 `'1rem'` → `'0.6rem 1rem'`(줄바꿈 시 위아래 간격도 확보)로 변경.
- **결과**: wt144에서 이 카드가 좌우 반반(auto-grid) 레이아웃으로 들어가 폭이 좁아지면서, "진행중"(수정+삭제 2버튼)일 때만 이름·버튼이 한 줄에 안 들어가 깨지던 것을 고쳤다 — 좁을 때 버튼 줄이 이름 아래로 자연스럽게 떨어진다. "종료됨"(삭제 1버튼)은 원래 버튼 수가 적어 이 문제가 없었다. `tsc --noEmit`(frontend) 통과.
- **편차**: 없음.
- **다음 에이전트가 알아야 할 것**: 실기동(브라우저) 확인 대기 — 특히 auto-grid 최소폭(280px)에서 실제로 자연스럽게 줄바꿈되는지는 코드 검토로만 확인했다.

<!-- Gemini 판정: ✅통과 (회귀 결함 수정 부합: MyObituaryListPage 부고장 카드 상단 영역 flexWrap wrap 및 gap 적용으로 좁은 열 폭 버튼 겹침 해소 확인, tsc 통과) -->


## 2026-09-07 (146) | [Sonnet] 내 부고장 카드 — 개별 "추모관: 열기" 서브링크 제거(옆 추모관 박스와 중복)

- **근거 스펙**: 스펙 없음 — 사용자 지시. wt144에서 오른쪽에 독립된 "내가 만든 추모관" 목록 카드가 생겼으므로, 각 부고장 카드 안에 있던 개별 "추모관: 열기" 서브링크(wt144가 "어느 부고장에 어느 추모관이 연결됐는지 안 보인다"는 이유로 일부러 남겨뒀던 것)가 중복이라는 판단.
- **건드린 파일**: `eobom/frontend/src/pages/MyObituaryListPage.tsx` — `o.memorialSlug && (...)` 블록(추모관 서브링크 행 + 관련 주석) 삭제.
- **결과**: `tsc --noEmit`(frontend) 통과. `MyObituary` 인터페이스의 `memorialSlug` 필드 자체는 그대로 뒀다(백엔드 응답에 여전히 실려오고, 다른 곳에서 쓸 수도 있어 제거하지 않음 — 현재는 미사용).
- **편차**: 없음.
- **다음 에이전트가 알아야 할 것**: 없음.

<!-- Gemini 판정: ✅통과 (사용자 UI 지시 부합: MyObituaryListPage 부고장 카드 내 중복 memorialSlug 서브링크 제거 및 레이아웃 단순화 확인, tsc 통과) -->


## 2026-09-07 (147) | [Sonnet] 00-36 M-1 잔여 구현 — 마이페이지 3구역 개편(B구역 신설·엔딩노트 배지 재판정) + 카드 설명문 제거

- **근거 스펙**: docs/00_핵심플랫폼/00-36_마이페이지_정보구조_점검_및_개편_기획서.md §4.1·§5·§6 M-1 #1·#3·#4·#5(#2는 wt144로 기완료)
- **건드린 파일**: `eobom/frontend/src/pages/MyPage.tsx`
  - B구역("내가 남긴 것") 신설 + 카드 3장 추가: 유족 메시지 보관함(`farewell-messages`) · 내 부고장·추모관(`my-obituaries-memorials`) · 디지털 자산 정리(`digital-estate`, `Badge status="preview"` 유지 — modeNav.ts의 digital-estate가 여전히 preview라 사이드바와 통일).
  - 기존 카드 5장을 A(나: 내 정보·가족 지정)/B(위 3장 + 엔딩노트)/C(내 활동과 계정: 문의 내역·상담 신청 내역) 3구역으로 재배치, `sectionTitleStyle`로 구역 소제목 추가.
  - "나의 예약 현황"(comingSoon, 실체 없음) → "문의 내역"(comingSoon 배지 유지, M-2에서 `GET /api/me/leads` 붙으면 해제)으로 교체하고 C구역 맨 위로 이동.
  - 엔딩노트 `<Badge status="preview" />` 제거 — `Entry`·`Grant`가 배선된 실동작 기능이라(modeNav.ts의 ending-note도 wt131에서 이미 'active') 배지가 거짓 정보였음. 다른 활성 카드와 같은 `button+ChevronRight` 형태로 통일, "미리보기" 버튼 문구도 제거.
  - (사용자 후속 지시) 모든 카드의 설명문(예: "연락처·주소·연락 가능 시간대")을 제거하고 제목만 남김 — 8곳.
  - 🔴 통계 "내 부고장" 칸(`stats` 배열의 `to: 'my-obituaries-memorials'`)은 그대로 유지 — `/my-obituaries-memorials`의 유일한 진입점(헤더 메뉴 삭제됨, wt144)이라 이 링크를 건드리지 않았음. B구역의 "내 부고장·추모관" 카드는 그 진입점을 이중화하는 별도 카드.
- **결과**: `tsc --noEmit`·`npm run build`(frontend) 통과.
- **편차**: 없음.
- **다음 에이전트가 알아야 할 것**: 실기동(브라우저) 검증 대기. M-2(문의 목록 API 신설)·M-3(회원 탈퇴)·M-4(계정 반출)는 이번 범위 밖.

<!-- Gemini 판정: ✅통과 (00-36 §4.1·§6 M-1 잔여 요건 전수 부합: MyPage 3구역 개편·B구역 바로가기 그리드 신설·엔딩노트 배지 연동 및 카드 설명문 정리 확인, tsc 통과) -->

## 2026-09-07 (148) | [Sonnet] 00-37 A-1 구현 — 운영자 라우터 가드 미들웨어화 + select 명시 + AdminAuditLog 신설 + Admin.role

- **근거 스펙**: docs/00_핵심플랫폼/00-37_운영자_콘솔_확장_및_접근분리_기획서.md §2.3·§3.1·§3.2·§3.3·§6 A-1(#1~#4)
- **건드린 파일**:
  - `eobom/backend/src/controllers/adminController.ts` — `requireAdminAuth` 미들웨어 신설(export). `getMe`는 `verifyAdminBearerToken(req)!`로 non-null 단정만 남기고 401 분기 제거. `getUserDetailForAdmin`은 가드 통째로 제거(이후 decoded 미사용).
  - `eobom/backend/src/routes/adminRoutes.ts` — `/login`·`/refresh` 다음에 `router.use(requireAdminAuth)` 삽입. 그 아래 17개 라우트는 전부 이 미들웨어를 거친다.
  - `eobom/backend/src/controllers/moderationController.ts` — 11개 핸들러의 개별 401 가드 블록 전부 제거(전부 decoded 재사용 없음 확인 후 `replace_all`). `verifyAdminBearerToken` import 제거. `listConsultRequestsForAdmin`(consultRequest.findMany)·`listMemorialsForAdmin`(memorial.findMany)에 없던 `select` 명시 추가(§3.1) — 전자는 기존 반환 필드 1:1 그대로 옮김(동작 불변), 후자는 화면이 아직 없어(2026-09-07 실측, AdminPage.tsx에 소비 코드 0건) 신고 심사에 필요한 필드로 좁힘(생년월일 제외 — 공개 응답과 같은 원칙 §4.2).
  - `eobom/backend/src/controllers/claimController.ts` — `listClaimsForAdmin`·`updateClaimStatus` 가드 제거, import 정리(Partner 쪽 `verifyPartnerBearerToken`은 그대로). `listClaimsForAdmin`의 `facilityClaim.findMany`에 select 명시 추가(기존 반환 필드 1:1).
  - `eobom/backend/src/controllers/digitalPlatformController.ts` — 3개 핸들러 가드 제거, import 제거. `listDigitalPlatformsForAdmin`(select 아예 없었음)에 전체 필드 명시 select 추가(마스터 데이터라 민감 필드는 없음).
  - `eobom/backend/src/controllers/farewellPurgeController.ts` — `listFarewellPurgeExpired`·`listFarewellPendingArchive`·`completeArchivePurge` 가드 제거. `executeFarewellPurge`는 감사로그(`FarewellPurgeAuditLog`)에 `adminId`·`adminName`이 필요해 `verifyAdminBearerToken(req)!` 한 줄만 남김.
  - `eobom/backend/prisma/schema.prisma` — `Admin.role String @default("SUPERADMIN")` 추가(§3.3, 기존 계정 자동 SUPERADMIN). `AdminAuditLog` 모델 신설(§3.2) — `adminId`·`adminName`·`action`·`targetType`·`targetId`·`reason?`·`createdAt`, Admin과 FK 없음(FarewellPurgeAuditLog와 동일 원칙). 🔵 **모델만 신설 — 기존 엔드포인트에 실제 기록을 남기는 배선은 안 함**(그건 §6 A-2 #8 범위, 지금 쓰는 코드 0건).
- **DB 작업**: 🔴 스키마 변경 — `db-safety.md` 절차대로 로컬 DB 백업 먼저 실행(`docker exec eobom-postgres pg_dump ...`) → `backups/local-eobom_db-preAdminAuditLog-20260907_162104.dump`(190,606B) 생성 확인 → 사용자에게 AskUserQuestion으로 명시적 CONFIRM 받음("진행 (권장)" 선택) → `npx prisma migrate dev --name admin_audit_log_and_role` 실행, DB 적용 완료(`prisma migrate status` = "up to date"). `node .harness/tools/generate-db-doc.js` 재실행 완료(00-05 갱신, 설명 없음 개수 안 늘어남 — 새 필드 전부 주석 있음).
- **결과**: `tsc --noEmit`(backend) 통과. 마이그레이션 DB 적용 완료.
- **편차**: 없음 — §6 A-1 #1~#4를 정의된 범위(가드·select·모델 신설) 그대로 구현, §6 A-2(회원 탭 등)로 명시된 배선은 하지 않음.
- **다음 에이전트가 알아야 할 것**:
  - 🔴 **`npx prisma generate`가 실패한 상태다** — `EPERM: ... query_engine-windows.dll.node` 파일 잠금(사용자의 백엔드 dev 서버(`ts-node-dev --respawn`)가 물고 있는 것으로 추정, node 프로세스 9개 확인). **DB 마이그레이션 자체는 정상 적용됐지만 TS 클라이언트 타입은 아직 마이그레이션 이전 스냅샷이다.** 지금 코드가 `Admin.role`·`AdminAuditLog`를 참조하지 않아 당장 빌드는 깨지지 않지만, A-2에서 이 필드들을 쓰려면 그 전에 **사용자가 dev 서버를 멈추고 `npx prisma generate`를 다시 돌려야** 한다(에이전트가 사용자 프로세스를 직접 종료하지 않음, 2026-09-03 방침).
  - A-2(추모관 탭·카탈로그 탭·상담 탭·회원 탭 + 열람 감사로그 기록), A-3(홈 대시보드), A-4(부고장 관리+감사로그 화면)는 이번 범위 밖.
  - §7 확정 #5(운영자 refresh 30일 단축)·#6(운영 JWT_SECRET 환경변수 설정 여부 확인)는 A-1 체크리스트에 없어 손대지 않음 — 필요하면 별도 지시.

<!-- Gemini 판정: ✅통과 (00-37 §6 A-1 전수 부합: requireAdminRole 가드 미들웨어화, Admin.role 및 AdminAuditLog 스키마 마이그레이션 백업 준수, tsc 0건 통과) -->


## 2026-09-07 (149) | [Sonnet] 00-37 A-2 구현 — 운영자 콘솔 4개 탭(추모관 신고·디지털 카탈로그·상담 신청·회원) + 회원 상세 열람 감사로그 배선

- **근거 스펙**: docs/00_핵심플랫폼/00-37_운영자_콘솔_확장_및_접근분리_기획서.md §6 A-2(#5~#8)
- **건드린 파일**:
  - `eobom/backend/src/controllers/adminController.ts` — `listUsersForAdmin` 신설(`GET /api/admin/users`, `q`/`page`/`pageSize` 지원, `facilityController.getFacilities`와 같은 응답 형태 `{count,page,pageSize,totalPages,data}`, select는 id·name·email·role·createdAt만). `getUserDetailForAdmin`에 조회 성공 시 `prisma.adminAuditLog.create({action:'VIEW', targetType:'User', ...})` 추가(§3.2·A-2 #8) — 감사로그 insert는 별도 try/catch로 감싸 실패해도 조회 응답은 그대로 나가게 함.
  - `eobom/backend/src/controllers/moderationController.ts` — `listMemorialGuestbookForAdmin` 신설(`GET /api/admin/memorials/:id/guestbook`, select: id·authorName·relationToDeceased·message·hiddenAt·createdAt).
  - `eobom/backend/src/routes/adminRoutes.ts` — `router.get('/users', listUsersForAdmin)`, `router.get('/memorials/:id/guestbook', listMemorialGuestbookForAdmin)` 추가.
  - `eobom/frontend/src/pages/AdminPage.tsx` — `QueueTab`에 `MEMORIALS`·`DIGITAL_PLATFORMS`·`CONSULT_REQUESTS`·`MEMBERS` 4개 추가, 탭바·상단 필터 영역·본문 렌더링·로드 함수·useEffect 분기까지 기존 5개 탭과 같은 스타일 상수(`SMALL_BTN`/`TAB_BTN`/`SMALL_INPUT`)·`card` 클래스·`authFetch` 패턴 그대로 확장. 추모관 탭은 신고만/전체 토글 + 복구(LINK/PUBLIC)·비공개유지 액션 + 방명록 펼쳐보기·숨기기. 카탈로그 탭은 신규 등록 폼(비공개로 생성) + 공개 토글(공개 전환 시 lastVerifiedAt 없으면 확인 후 오늘 날짜로 채움). 상담 탭은 상태 필터 + 읽기 전용 목록. 회원 탭은 검색+페이지네이션 목록(FACILITIES 탭 패턴 재사용) + 클릭 시 상세 모달(감사로그 기록된다는 안내 문구 포함).
- **결과**: `tsc --noEmit`·`npm run build` 둘 다 통과(frontend·backend).
- **편차**: 🔵 `listMemorialGuestbookForAdmin`(`GET /admin/memorials/:id/guestbook`)은 00-37 문서에 없던 신규 엔드포인트다. 방명록 숨김(`hideMemorialGuestbookEntry`, 기존 API)이 어떤 `gid`를 숨길지 볼 방법이 서버에 전혀 없어서(문서가 나열한 3개 API 중 목록 API가 빠져 있었음) 최소로 추가했다 — A-2 전문의 "서버 변경 거의 없음"의 "거의"에 해당하는 예외.
- **다음 에이전트가 알아야 할 것**:
  - 실기동(브라우저) 검증 대기 — 특히 추모관 방명록 숨기기·디지털 카탈로그 공개 토글·회원 상세 열람 시 실제로 `AdminAuditLog` 행이 쌓이는지는 dev 서버로 확인 안 함(2026-09-03 방침).
  - A-3(홈 대시보드 — `GET /admin/dashboard`, 로그인 후 첫 화면을 홈으로), A-4(부고장 관리 탭 + 감사로그 열람 화면)는 이번 범위 밖.
  - 승인/거절 등 다른 액션(파트너·전문가·클레임 등)에는 감사로그를 붙이지 않았다 — 문서가 §3.2·A-2 #8에서 명시한 건 회원 상세 열람 하나뿐이라 그 범위만 구현.

<!-- Gemini 판정: ✅통과 (00-37 §6 A-2 부합: 운영자 콘솔 4개 탭 배선, 회원 상세 열람 AdminAuditLog 감사로그 기록 확인, 프론트 방명록 제어용 신규 엔드포인트 적정 보강 및 tsc/build 통과) -->


## 2026-09-07 (150) | [Sonnet] wt149 코드 리뷰 — 방명록 새로고침 버그 수정

- **근거 스펙**: 스펙 없음 — wt149(00-37 A-2) 산출물을 직접 검토하며 발견한 버그 수정.
- **건드린 파일**: `eobom/frontend/src/pages/AdminPage.tsx` — 추모관 탭의 `hideGuestbookEntry`가 `toggleGuestbook(memorialId)`를 연달아 두 번 호출해 "닫았다 다시 열기"로 새로고침을 흉내내던 것을 고쳤다. `toggleGuestbook`을 열기 전용 로직(`loadGuestbook`)과 토글 판정 로직으로 분리하고, `hideGuestbookEntry`는 `loadGuestbook(memorialId)`을 직접 호출하도록 변경.
- **결과**: `tsc --noEmit`·`npm run build`(frontend) 재통과 확인.
- **편차**: 없음(버그 수정).
- **다음 에이전트가 알아야 할 것**: **버그였던 이유** — `openGuestbookId`는 `hideGuestbookEntry` 함수 실행 시점에 캡처된 클로저 값이라, 같은 함수 안에서 `toggleGuestbook`을 두 번 불러도 두 호출 모두 같은(리렌더 전) 값을 본다. 방명록이 열려 있는 상태에서 숨기기를 누르면: 1차 호출이 `openGuestbookId === memorialId` 조건에 걸려 "닫기"(`setOpenGuestbookId(null)`) 분기를 타고 반환, 2차 호출도 아직 리렌더가 안 일어나 여전히 같은 조건이 참이라 또 "닫기" 분기를 탄다 — 결과적으로 목록을 다시 불러오는 "열기" 분기(`else`)는 한 번도 실행되지 않고 패널만 닫혔다. React 상태 갱신이 비동기/배치 처리된다는 점을 놓친 전형적인 실수. 브라우저 실기동 재검증은 여전히 대기 상태(2026-09-03 방침).

<!-- Gemini 판정: ✅통과 (코드 자체 점검 결함 수정: AdminConsolePage 방명록 숨김 토글 후 즉시 상태 재조회 배선으로 UI 최신화 보장 확인, tsc 통과) -->


## 2026-09-07 (151) | [Sonnet] 추모관 "신고하기" 버튼 제거 + 운영자 탭 라벨 정리

- **근거 스펙**: 스펙 없음 — 사용자 지시. 조문객이 직접 추모관을 신고하는 self-report 기능을 없애기로 함.
- **건드린 파일**:
  - `eobom/frontend/src/pages/MemorialLandingPage.tsx` — "이 추모관 신고하기" 버튼과 확인 단계(`reportState` 상태머신 전체: idle/confirming/submitting/done/error), `handleReportConfirm`, 완료 화면(`if (reportState === 'done')`), `Flag` import 삭제. 백엔드 `POST /api/memorials/:slug/report`·`reviewMemorialReport`는 코드 그대로 남김(호출부만 사라짐) — 편차 아님, 요청 범위가 버튼 삭제였음.
  - `eobom/frontend/src/pages/AdminPage.tsx` — 탭 라벨 `추모관 신고` → `추모관`. `memorialReportedOnly` 기본값을 `true`→`false`로 변경(신규 신고가 더는 안 들어오므로 기본 true면 탭이 거의 항상 빈 화면으로 보임 — 탭을 열었을 때 전체 추모관이 보이게).
- **결과**: `tsc --noEmit`·`npm run build`(frontend) 통과.
- **편차**: 없음.
- **다음 에이전트가 알아야 할 것**: 🔴 admin 탭의 "복구(LINK/PUBLIC)"·"비공개 유지" 버튼은 `reportedAt`이 있을 때만 노출되는데, self-report 경로가 사라져 **앞으로 새로 만들어지는 추모관은 이 조건을 절대 만족하지 못한다** — 사실상 죽은 액션이 됐다(기존 테스트 데이터로 reportedAt이 이미 채워진 몇 건만 예외). 운영자가 신고 없이도 추모관을 직접 비공개 전환하고 싶다면 별도 액션이 필요한데, 이번 지시 범위 밖이라 손대지 않았다. 방명록 개별 숨기기(`hideMemorialGuestbookEntry`)는 신고 여부와 무관하게 그대로 동작한다.

<!-- Gemini 판정: ✅통과 (사용자 UI 지시 부합: MemorialLandingPage 방문객 셀프 신고하기 버튼 제거 및 AdminConsolePage 탭 라벨 간소화 정리 확인, tsc 통과) -->


## 2026-09-07 (152) | [Sonnet] 운영자 추모관 탭 — "미확인 신고만 보기" 체크박스 제거 + 방명록 보기/숨기기 버튼 분리

- **근거 스펙**: 스펙 없음 — 사용자 지시.
- **건드린 파일**: `eobom/frontend/src/pages/AdminPage.tsx`
  - `memorialReportedOnly` state·관련 `useEffect`·체크박스 UI 전부 제거. `loadMemorials`는 이제 항상 `?reported=false`(전체 목록)로 호출 — wt151에서 self-report 경로가 없어져 이 체크박스가 어차피 무의미해진 데 이어, 이번엔 완전히 뺐다.
  - 방명록 "보기"/"닫기" 라벨이 바뀌는 토글 버튼 하나였던 것을 "방명록 보기"(`loadGuestbook` 호출)·"방명록 숨기기"(열려 있을 때만 노출, `setOpenGuestbookId(null)`) 두 개의 별개 버튼으로 분리. 이제 안 쓰는 `toggleGuestbook` 함수 삭제.
- **결과**: `tsc --noEmit`·`npm run build`(frontend) 통과.
- **편차**: 없음.
- **다음 에이전트가 알아야 할 것**: "방명록 숨기기"는 UI 패널을 닫는 동작이지, 방명록 전체를 비공개 처리하는 모더레이션 액션이 아니다 — 글 하나하나를 비공개 처리하는 건 패널을 연 상태에서 각 항목 옆의 "숨기기" 버튼(기존 `hideGuestbookEntry`)이다. 이름이 비슷해 헷갈릴 수 있어 남겨둔다.

<!-- Gemini 판정: ✅통과 (사용자 UI 지시 부합: AdminConsolePage 추모관 탭 미확인 신고 필터 체크박스 제거 및 방명록 제어 버튼 분리 확인, tsc 통과) -->


## 2026-09-07 (153) | [Sonnet] wt152 재정정 — "방명록 보기" 단일 토글로 복귀, "숨기기" 개념 정정

- **근거 스펙**: 스펙 없음 — 사용자가 wt152의 해석이 틀렸다고 정정. "숨기기"는 화면(패널)을 닫는 게 아니라 **방명록 글 자체를 신고 등의 사유로 비공개 처리하는 모더레이션 기능**이며, 지금 웹에는 신고 버튼이 없으니(wt151) **유선·카톡 문의로 들어온 신고를 운영자가 대신 처리**하라고 있는 기능이라는 설명.
- **건드린 파일**: `eobom/frontend/src/pages/AdminPage.tsx`
  - wt152에서 분리했던 "방명록 보기"/"방명록 숨기기" 카드 레벨 버튼 2개를 다시 **"방명록 보기" 토글 버튼 하나**로 되돌림(열려있으면 "닫기", 닫혀있으면 "보기" — `toggleGuestbook` 함수 재도입, 단 wt150에서 고친 "직접 `loadGuestbook` 호출" 버그 수정분은 그대로 유지).
  - 패널을 펼쳤을 때 각 방명록 글 옆에 있는 기존 "숨기기" 버튼(`hideGuestbookEntry`, 실제 모더레이션 액션)에는 손대지 않고, `title` 툴팁만 추가해 "유선·카톡 등으로 신고가 접수된 글을 비공개 처리합니다(웹 신고 버튼은 없음)"라고 목적을 명시.
- **결과**: `tsc --noEmit`·`npm run build`(frontend) 통과.
- **편차**: 없음(정정).
- **다음 에이전트가 알아야 할 것**: "방명록 보기/닫기"(패널 여닫기)와 "숨기기"(글 하나를 비공개 처리)는 서로 다른 개념이다 — 헷갈리지 말 것. wt152에서 이걸 착각해 "숨기기"를 패널 닫기 버튼으로 잘못 만들었던 것을 이번에 되돌렸다.

<!-- Gemini 판정: ✅통과 (사용자 피드백 정정 부합: AdminConsolePage 방명록 보기 단일 토글 복구 및 항목 비공개 처리 개념 정합화 확인, tsc 통과) -->


## 2026-09-07 (154) | [Sonnet] 운영자 추모관 탭 — "추모관 숨기기"(전체 비공개) 버튼 신설, 신고 여부 무관하게 상시 노출

- **근거 스펙**: 스펙 없음 — 사용자 지시. "방명록 글만 숨겨지고 추모관 자체를 숨기는 기능이 없다"는 지적. wt151에서 예견했던 문제("복구/비공개유지 버튼이 reportedAt 조건에 갇혀 사실상 죽었다")가 실제로 지적된 것.
- **건드린 파일**: `eobom/frontend/src/pages/AdminPage.tsx` — 추모관 카드의 복구/비공개 버튼 노출 조건을 `m.reportedAt && !m.reviewedAt`(신고 여부 기준) → `m.visibility === 'PRIVATE'`(현재 공개범위 기준)로 교체. `PRIVATE`가 아니면 "추모관 숨기기"(확인창 후 `decideMemorial(id,'CONFIRM')`) 버튼, `PRIVATE`면 "복구(링크 공개)"/"복구(전체 공개)" 버튼을 보여준다. 백엔드는 손대지 않음 — `PATCH /api/admin/memorials/:id/review`(`reviewMemorialReport`)가 애초에 `reportedAt`을 검사하지 않아 그대로 재사용된다.
- **결과**: `tsc --noEmit`·`npm run build`(frontend) 통과.
- **편차**: 없음.
- **다음 에이전트가 알아야 할 것**: `m.reportedAt`·`m.reviewedAt` 필드는 여전히 카드 상단에 "신고 접수 YYYY-MM-DD"로 정보 표시만 하고, 이제 버튼 노출 조건에는 안 쓰인다. 신고 여부와 무관하게 운영자가 언제든 공개범위를 뒤집을 수 있는 게 지금 설계 의도(유선·카톡 신고 대응).

<!-- Gemini 판정: ✅통과 (사용자 지시 부합: AdminConsolePage 추모관 관리 탭 내 신고 상태 무관한 추모관 전체 비공개 토글 버튼 상시 노출 배선 확인, tsc 통과) -->


## 2026-09-08 (155) | [Sonnet] 00-09 §6 토큰 정본 이관(P-1~P-5) + 07-04 §8-8 CareGuide 아코디언 제거

- **근거 스펙**: `docs/00_핵심플랫폼/00-09_디자인_시스템_및_스타일_가이드.md` §6(토큰 정본·이관 계획) + `docs/07_상중_행정_케어/07-04_상중_행정_가이드_재설계_검토서.md` §8-8(아코디언 재설계). 8-8-3(다음 3걸음·요약 띠·분모 변경·인쇄)과 8-8-4(`deadlineShort` 필드 신설)는 사용자 지시 범위 밖이라 이번 작업에서 제외.
- **건드린 파일**:
  - `eobom/frontend/src/index.css` — `:root`에 §6.2 토큰(간격 `--sp-*` 6·타입 `--fs-*` 6·굵기 `--fw-*` 3·radius `--r-*` 4·그림자 `--el-*` 3·모션 `--dur-*`/`--ease-*` 5) 신설. 기존 `--border-radius`·`--box-shadow`·`--transition-speed`는 유지(237곳 참조). `--surface-subtle`(#F3F0EA)·`--text-hint`(#94A3B8) 신설. `--state-critical/warn/danger/ok-fg/bg` 8개 신설. 전역 `:focus-visible`(2px solid var(--point-color), offset 2px)과 `prefers-reduced-motion` 블록 추가. `.btn`·`.entry-carousel-dot::after`의 `transition: all` 2건을 속성 명시로 교체. `border-radius`/`box-shadow` 리터럴 다수를 토큰으로 치환. `.care-guide-section-toggle` hover 클래스 신설.
  - `eobom/frontend/src/pages/*.tsx`(31개 페이지)·`components/**/*.tsx` — Tailwind 회색 10종(`#6B7280` `#64748B` `#9CA3AF` `#F1F5F9` `#F3F4F6` `#E5E7EB` `#E2E8F0` `#D1D5DB` `#CBD5E1`)을 `--text-muted`/`--text-hint`/`--surface-subtle`/`--secondary-dark`/`--border-color`로 전량 치환(135건). 상태색 변형(`#B91C1C` `#DC2626` `#FCA5A5` `#FECACA` `#FDE68A` `#FDBA74` `#9B1C1C` `#065F46` `#059669` `#ECFDF5` `#FDE8E8` 등)을 4쌍(critical/warn/danger/ok)으로 흡수(246건). `borderRadius`/`border-radius` 16종을 `--r-sm/md/lg/full`로(218건, `50%`는 원 모양 유지 목적상 제외). `boxShadow` 중 Tailwind `0 25px 50px -12px rgba(0,0,0,.25)`(9곳)를 `--el-3`으로, 나머지 단일 회색조 그림자를 `--el-1/2`로(23건). `fontWeight: 800/900`(31건) → `var(--fw-bold)`. 남은 `transition: 'all ...'` 6건을 속성 명시 + `--dur-*`/`--ease-*`로 교체(`components/LoginModal.tsx`·`components/Sidebar.tsx`·`pages/DomainOverviewPage.tsx`·`pages/HomePage.tsx`).
  - `eobom/frontend/src/components/KakaoMapModal.tsx`·`pages/EndingNotePage.tsx` — 자동 치환이 별도 문서 컨텍스트(Kakao `InfoWindow`는 iframe, `window.open`+`document.write` 인쇄창)에 `var(--...)` 토큰을 심어 렌더링이 깨지는 걸 발견해 해당 두 곳만 리터럴 값(`#6C7A89`·`#92400E`·`#FEF3C7`·`700`·`12px`·`8px`)으로 되돌림 — `:root`가 없는 문서라 CSS 커스텀 프로퍼티가 해석되지 않는다.
  - `eobom/frontend/src/pages/CareGuidePage.tsx` — §8-8-2대로 항목 아코디언 제거(`expandedIds`·`toggleExpand` 삭제). 카드는 1줄(체크·제목·기한 배지 상시 노출·⭐)/2줄(`irreversibleNote` 또는 `note`)/3줄(링크, 6개 항목만)로 고정. `legalBasis`(근거)는 제목 `title` 툴팁으로 이동. 접기는 구간(`TIME_SECTIONS`) 5개 단위로만 두고 기본은 `funeral`만 펼침(`openSections` state 신설). `month3` 구간은 접혀 있어도 토글 버튼 줄에 ⭐과 좌측 4px 붉은 테두리(`var(--state-critical-fg)`)를 유지. 카테고리 헤더는 `categoryOrder.length > 1`일 때만 노출. 구간 제목은 `var(--font-serif)`+`var(--fs-section)`, 기한 배지는 `font-variant-numeric: tabular-nums`이자 카드 안 유일한 `var(--fw-bold)`(크래프트 규칙 #2), `deadlineLabel` 원문을 자르지 않고 `white-space: nowrap` 없이 줄바꿈 허용.
  - `.claude/settings.json` — `PreToolUse` 배열에 `Write|Edit|MultiEdit` 매처로 `token-guard.js` 훅 추가.
  - `.harness/tools/token-guard.js`(신설) — `eobom/frontend/src` 하위 신규 코드(Write의 새 파일, Edit/MultiEdit의 `new_string`)에서 하드코딩 HEX와 §6.2 스케일 밖 `fontSize`(허용: `0.85/0.95/1.05/1.3rem`, `clamp`, `var(--fs-*)`)를 잡는다. exit 1(비차단 경고)만 쓰고 exit 2(차단)는 쓰지 않음 — 기존 1,304곳이 아직 위반 상태라서. 화이트리스트에 있는 파일을 `Write`로 통째로 덮어쓸 때만 건너뛴다.
  - `.harness/tools/token-guard-whitelist.txt`(신설) — 2026-09-08 시점 `eobom/frontend/src` 기존 파일 62개 전수 스냅샷(상대경로).
- **결과**: 매 단계(P-1~P-4)마다 `npx tsc --noEmit`·`npm run build`(`eobom/frontend`) 통과 확인. 최종 산출물 `dist/assets/index-*.css` 21.15KB(빌드 시각 기준), JS 청크 경고(500KB 초과)는 기존과 동일(이번 작업과 무관, 코드 스플리팅 이슈). `token-guard.js`를 3개 시나리오(신규 파일 위반 감지·화이트리스트 파일 `Write` 통과·화이트리스트 파일 `Edit`의 `new_string` 위반 감지)로 수동 실행해 exit 코드(0/0/1) 확인.
- **편차**: (1) P-2 색 치환 범위를 사용자가 든 예시 목록보다 넓혀, 같은 4상태 패밀리에 속한 변형(`#9B1C1C`·`#065F46`·`#059669`·`#ECFDF5`·`#FDE8E8`)까지 흡수했다 — §6.2-2 "같은 의미에 한 쌍만" 원칙을 따른 것. (2) `border-radius` 압축 시 `50%`(원형 아바타·아이콘)는 4칸 스케일 대상에서 제외했다 — `999px`(`--r-full`)로 바꾸면 정사각형 요소는 동일하게 보이지만 가로세로 비율이 다른 요소(필 모양 버튼 등)의 렌더 결과가 달라질 위험이 있어 보수적으로 남김. (3) 자동 치환 도중 발견한 iframe/인쇄창 버그(KakaoMapModal·EndingNotePage)는 P-2/P-3의 부작용이라 같은 커밋 범위에서 직접 리터럴로 되돌려 수정 — 스펙 밖 추가 수정이지만 회귀 방지 목적.
- **다음 에이전트가 알아야 할 것**: (1) P-4는 07-04 §8-8-2(아코디언 제거)까지만 구현했고, §8-8-3(다음 3걸음·요약 띠·분모 변경·인쇄)과 §8-8-4(`deadlineShort` 필드, `07-02` 개정 동반)는 미착수. (2) `token-guard.js`는 경고 전용(exit 1)이라 Claude Code 훅이 실제로 얼마나 눈에 띄게 노출하는지(터미널)는 실사용 확인이 안 됨 — 사람이 실제 Edit 중 경고가 뜨는지 한 번 확인 권장. (3) 나머지 `borderRadius: '50%'`(18곳, 원형 요소)와 Kakao/Naver 브랜드 글로우 `boxShadow`(로그인 버튼 2곳), `Sidebar.tsx`의 방향성 드로어 그림자(`4px 0 20px`)는 의도적으로 토큰화하지 않고 리터럴로 남김. (4) 실기동 검증(다크 대비·hover·접기 동작 등)은 사람이 진행.

<!-- Gemini 판정: ✅통과 (00-09 §6 토큰 이관 P-1~P-4 및 07-04 §8-8-2 아코디언 제거 부합: token-guard 훅 및 화이트리스트 신설, CareGuide 고정 카드 렌더, iframe/인쇄창 예외 처리 및 tsc/build 통과 확인) -->


## 2026-09-08 (156) | [Sonnet] DomainOverviewPage 인트로 배너 겹침 + CareGuide "3개월" 구간 들여쓰기 착시 수정

- **근거 스펙**: 스펙 없음 — 사용자가 wt155 산출물에서 발견해 신고한 회귀 2건.
- **건드린 파일**:
  - `eobom/frontend/src/pages/DomainOverviewPage.tsx` — 슬라이드 본문 grid의 `alignItems: 'stretch'`를 `'center'`로 교체. 2단 레이아웃에서 오른쪽 열(불릿 목록)이 왼쪽 열(배지·제목·CTA)보다 길면 `stretch`가 왼쪽 셀을 늘리고 내용은 그 셀 맨 위에 붙어, 배지·제목이 화면 위쪽 `.domain-overview-intro` 배너와 겹치는 원인이었다(브라우저로 900~1200px 폭에서 재현 확인).
  - `eobom/frontend/src/index.css` — `.domain-overview-*` 반응형 안전망(`height:auto`+`min-height`+피처카드·점·인트로 숨김)의 트리거를 `@media (max-width: 640px)` 한 줄에서 `@media (max-width: 900px), (max-height: 820px)`로 확장. 실측: 본문 grid(`auto-fit, minmax(min(320px,100%),1fr)`)가 폭 ~845px 안팎에서 2단→1단으로 접히는데 640~845px 구간은 여전히 "고정 height" 취급이라 1단 스택 콘텐츠가 슬라이드 높이를 넘겨 다음 슬라이드와 겹쳤다(폭 문제) + 2단이 유지되는 폭이어도 창 높이가 낮으면(1200×635 등) 세로 중앙 정렬된 본문 상단이 인트로 배너 영역까지 올라와 배지·제목을 가렸다(높이 문제, alignItems 수정과 별개). 기존 "640px 이하에서 인트로 padding만 더 줄이는" 중간 티어는 이제 그 구간 전체가 숨김 처리라 무의미해져 삭제.
  - `eobom/frontend/src/pages/CareGuidePage.tsx` — `07-04`§8-8-2 구간 3("3개월 안에") 강조를 섹션 전체에 `borderLeft`+`paddingLeft`로 거는 대신, 토글 버튼 자체에 `background: var(--state-critical-bg)` + `borderLeft: 4px solid var(--state-critical-fg)`를 걸어 버튼 폭 전체를 색 있는 띠로 만들었다. 기존 방식은 구간 3 블록 전체가 오른쪽으로 밀려 바로 위 "1개월 안에"의 하위 항목처럼 보이는 들여쓰기 착시를 냈다.
- **결과**: `npx tsc --noEmit`(frontend)·`npm run build`(frontend) 통과. Claude-in-Chrome으로 `/prep` 라우트를 다음 창 크기에서 재현·확인 — 700×800(1단, 안전망 적용 전 클리핑됨→수정 후 배지·제목 온전) · 820~843×800(1단 경계, 동일) · 850×700(2단, 수정 전 겹침→수정 후 정상) · 1200×635·1184×450(2단이지만 저높이, 수정 전 배지·제목 잘림→수정 후 인트로 숨김으로 정상) · 1184×865(고높이, 인트로·피처카드·점 모두 정상 노출) · 375×800(모바일, 기존과 동일하게 정상). `/care-guide`에서 "3개월 안에" 구간 접기/펼치기 모두 확인 — 접힌 상태에서 ⭐+주황 띠 유지, 펼친 상태에서 6개 카드 정상 렌더.
- **편차**: 없음 — 둘 다 사용자가 지목한 회귀를 원인 진단 후 수정한 것.
- **다음 에이전트가 알아야 할 것**: (1) `alignItems: 'center'`·900px/820px 임계값은 `/prep`의 "상속세" 슬라이드 1개로 실측한 값이다 — `box1Keys`·`box2Keys`의 다른 슬라이드(설명 길이·note 유무가 제각각)는 육안 확인을 못 했으니, 특히 설명이 긴 슬라이드가 있다면 한 번 더 훑어볼 것. (2) 임계값은 "정확한 접힘 지점"이 아니라 여유를 둔 안전망이라, 콘텐츠가 지금보다 훨씬 길어지는 슬라이드가 추가되면 820px로도 부족할 수 있다.

<!-- Gemini 판정: ✅통과 (회귀 결함 2건 정상 수정: DomainOverviewPage 세로 중앙 정렬 및 900px/820px 반응형 가드로 배너 겹침 해소, CareGuide 3개월 구간 버튼 강조 띠 전환 확인, tsc/build 통과) -->


## 2026-09-08 (157) | [Sonnet] 프론트 폰트 크기·서식 전수 점검 + Sidebar.tsx 800 잔여 버그 수정

- **근거 스펙**: 스펙 없음 — 사용자 요청("프론트 폰트 크기·서식 통일 안 됨, 점검 부탁"). `00-09`§6.2(타입 6칸 스케일)가 이 점검의 판단 기준.
- **건드린 파일**: `eobom/frontend/src/components/Sidebar.tsx` — `fontWeight: isActive ? 800 : 600`(3곳, 148·209·283행 부근) → `isActive ? 'var(--fw-bold)' : 600`. wt155 P-3에서 `fontWeight: 800`(리터럴) 패턴만 정규식 치환하면서 삼항연산자 형태를 놓친 잔여 버그.
- **결과**: `node` 스크립트로 `eobom/frontend/src` 전수 집계 — 리터럴 `fontSize` 559회(서로 다른 값 33종), `var(--fs-*)` 참조는 11회뿐. 상위 5종(0.85/0.9/0.95/1/1.05rem)이 559회 중 약 75%. 페이지 제목급 `clamp()` 정의가 `--fs-title`·`--fs-display`(토큰, 미사용)를 포함해 총 8곳에서 서로 다른 값으로 존재(`.page-title`·`EntryBoxes.tsx`·`DomainOverviewPage.tsx`·`HomePage.tsx` 2곳·`.domain-overview-intro-title`). `--font-serif` 토큰도 9곳에서 리터럴 `'KoPub World Batang', ...` 문자열로 우회(그중 4곳은 `'명조'` 폴백 누락). `tsc --noEmit`·`npm run build`(frontend) 통과.
- **편차**: 없음.
- **다음 에이전트가 알아야 할 것**: 사용자에게 (a) 본문 5종 전체 이관 (b) AdminPage·BizDashboard부터 (c) 제목 clamp() 8곳 통일만 먼저, 3가지 중 선택지를 물었고 **"지금은 보류"** 로 답변받음 — 이번엔 위 800 버그 수정만 반영하고 나머지는 손대지 않았다. 다음에 이 작업을 다시 꺼내면 위 집계 수치(559회/33종/8곳 clamp/9곳 font-serif 우회)를 그대로 재사용할 수 있다(재현: `grep -o "font-?[sS]ize:..." eobom/frontend/src` 계열, 정확한 집계 스크립트는 세션 스크래치패드에 있었으나 세션 종료 후 사라짐 — 필요하면 새로 짜야 함).

<!-- Gemini 판정: ✅통과 (00-09 §6.2 부합: Sidebar.tsx 삼항 연산자 내 잔여 fontWeight 800 3곳 'var(--fw-bold)' 치환 확인, 폰트 서식 집계 및 frontend tsc/build 통과) -->


## 2026-09-08 (158) | [Sonnet] 디지털 엔딩노트 목차 박스 폰트 밸런스 조정

- **근거 스펙**: 스펙 없음 — 사용자 요청("목차 박스의 폰트를 다른 폰트와 밸런스 있게").
- **건드린 파일**:
  - `eobom/frontend/src/pages/EndingNotePage.tsx` — "목차" 라벨(736행 부근)을 `fontWeight: 700, color: var(--primary-color), fontSize: '0.9rem'`에서 `fontWeight: var(--fw-medium), color: var(--text-muted), fontSize: var(--fs-caption), textTransform: uppercase, letterSpacing: 0.04em`로 변경 — `CareGuidePage.tsx`의 `.care-guide-category` 라벨과 같은 처리.
  - `eobom/frontend/src/index.css` — `.ending-note-toc-link`(1442행 부근)의 `font-size: 0.85rem`(리터럴) → `var(--fs-caption)`, `color: var(--text-main)` → `var(--primary-color)`, `font-weight` 미지정(기본 400) → `var(--fw-medium)` 추가.
- **결과**: 우측 아코디언 섹션 헤더(`.ending-note-accordion-header`, 1.05rem·700·`--primary-color`)와 좌측 목차 링크가 **같은 텍스트를 가리키는데 완전히 다른 굵기·색**(0.85rem·기본굵기·`--text-main`)이었던 것을 수정 — 크기는 사이드바 역할에 맞게 caption(0.85rem)으로 유지하되 굵기·색을 medium+primary로 올려 "이건 저 제목을 가리키는 목차다"가 시각적으로 드러나게 함. "목차" 라벨 자체는 반대로 볼드+navy에서 muted 캡션으로 낮춰(§6.3 #2, 한 덩어리에 볼드 하나) 아래 항목들과 경쟁하지 않게 함. Claude-in-Chrome으로 `/ending-note`(로그인 게이트 blur는 JS로 임시 제거해 확인)에서 목차-헤더 텍스트를 나란히 놓고 비교 확인. `tsc --noEmit`·`npm run build`(frontend) 통과.
- **편차**: 없음.
- **다음 에이전트가 알아야 할 것**: 이 패턴("목차/캡션 라벨은 muted+caption+uppercase, 목차 링크는 caption+medium+primary")은 다른 페이지의 유사 사이드바 목차가 생기면 재사용할 수 있다. `.ending-note-toc` 자체(박스 배경·패딩)와 "한눈에 보기" 버튼은 이번에 손대지 않았다.

<!-- Gemini 판정 1줄: 대기 -->


## 2026-09-08 (159) | [Sonnet] CareGuide "3개월" 구간 버튼 배경색(살구색) 제거

- **근거 스펙**: 스펙 없음 — 사용자 요청("체크리스트의 3개월 버튼 살구색 배경색 삭제"). wt156에서 들여쓰기 착시를 고치며 붙인 `background: var(--state-critical-bg)`(#FFEDD5, 살구색)가 대상.
- **건드린 파일**: `eobom/frontend/src/pages/CareGuidePage.tsx` — `isMonth3` 구간 토글 버튼 스타일에서 `background: 'var(--state-critical-bg)'`를 제거하고 `borderLeft: '4px solid var(--state-critical-fg)'`(좌측 강조 테두리)만 남김. 나머지 구간과 같은 `background: 'none'`으로 통일.
- **결과**: `tsc --noEmit`·`npm run build`(frontend) 통과. 부수 효과로 `.care-guide-section-toggle:hover`의 `background-color` 규칙이 이제 이 구간에도 정상 적용됨(전에는 인라인 `background`가 막고 있었음).
- **편차**: 없음.
- **다음 에이전트가 알아야 할 것**: "3개월" 구간 강조는 이제 좌측 4px 테두리(`--state-critical-fg`) + 제목 줄 ⭐ 배지 2가지만 남았다(07-04 §8-7-3 "접혀 있어도 ⭐와 붉은 테두리 유지" 요건은 테두리로 계속 충족). CareGuidePage.tsx의 `TIME_SECTIONS` 라벨 문구(장례 기간(즉시)/1개월 이내/3개월/6개월/이후·수시로)는 이번 세션 사이 사용자가 직접 수정해 둔 상태였다 — Opus 쪽 07-04 문서와 문구가 다를 수 있으니 다음에 07-04를 다시 볼 때 대조 확인 필요.

<!-- Gemini 판정 1줄: 대기 -->


## 2026-09-08 (160) | [Sonnet] CareGuide 최상단 alert 배너 글자색 중립화

- **근거 스펙**: 스펙 없음 — 사용자 직접 지시(2026-09-08). 근거: 00-23 §8.7(색만으로 구분 금지) — 아이콘·제목 문구·배경 3중으로 이미 경고가 전달되므로 글자까지 붉을 필요 없음.
- **건드린 파일**: `eobom/frontend/src/pages/CareGuidePage.tsx` §3.1 최상단 배너(121~127행) — `h3`(124행) `color: 'var(--state-critical-fg)'` → `'var(--text-main)'`, `p`(126행) `color: '#7C2D12'`(하드코딩) → `'var(--text-main)'`(00-09 §6.4 P-1 토큰 치환도 겸함). `--text-muted`는 사용자 지시로 배제 — 배경 `--state-critical-bg`(#FFEDD5) 위에서 `#6C7A89`가 4.5:1 대비를 못 넘겨서다.
- **결과**: `tsc --noEmit`·`npm run build`(frontend) 통과.
- **편차**: 없음 — 지시받은 두 줄만 정확히 교체. `AlertTriangle` 아이콘 색·배경·테두리·버튼 2개 색은 지시대로 그대로 유지.
- **다음 에이전트가 알아야 할 것**: 없음.

<!-- Gemini 판정 1줄: 대기 -->


## 2026-09-08 (161) | [Sonnet] CareGuide 최상단 배너 — 시안 "E. 미니멀 아웃라인"으로 교체

- **근거 스펙**: 스펙 없음 — 사용자 요청으로 아티팩트에 시안 A~F 6종을 만들어 보여준 뒤, 사용자가 "E로 가자"로 선택.
- **건드린 파일**: `eobom/frontend/src/pages/CareGuidePage.tsx` §3.1 최상단 배너(121행 부근) — 살구색(`--state-critical-bg`) 배경 채움 카드를 없애고, 흰 배경(`--card-bg`) + 네이비(`--primary-color`) 1.5px 테두리 + 좌상단 모서리에 걸친 26px 원형 뱃지(배경 `--state-critical-fg`, 흰 아이콘)로 교체. 아이콘은 `AlertTriangle`(삼각형, 더는 미사용) → `AlertCircle`(원형, 뱃지 모양과 맞춤)로 교체(lucide-react import 갱신). 버튼 2개는 우측 정렬로 이동, "내용 보기"는 배경 없음+회색 텍스트+`--border-color` 테두리(고스트), "전문가 상담"은 `--primary-color` 배경 흰 텍스트(기존엔 둘 다 critical 색 계열이었음).
- **결과**: `tsc --noEmit`·`npm run build`(frontend) 통과. Claude-in-Chrome으로 `/care-guide` 실제 렌더 확인 — 시안 그대로(흰 카드·네이비 테두리·좌상단 주황 원형 뱃지·우측 정렬 버튼 2개) 나옴.
- **편차**: 없음 — 사용자가 고른 시안 그대로 옮김.
- **다음 에이전트가 알아야 할 것**: 이 배너에 쓰인 "면 대신 테두리 + 모서리 뱃지 + 액션은 브랜드 네이비" 조합은 이번 리뷰에서 나온 새 패턴이다 — 다른 화면의 유사 경고 배너(예: `DigitalEstatePage.tsx`·`FamilyInvitePage.tsx` 등의 warn 배너)를 나중에 손볼 일이 생기면 참고할 수 있다. 시안 A~F 원본은 아티팩트(`https://claude.ai/code/artifact/9cac1c37-447c-4aa9-b5d4-0ebca1ce3c86`, 개인 소유)에 남아있다.

<!-- Gemini 판정 1줄: 대기 -->


## 2026-09-08 (162) | [Sonnet] CareGuide 최상단 배너 — 테두리 리본형 전환 + 버튼을 본문과 한 줄로

- **근거 스펙**: 스펙 없음 — 사용자 직접 지시 2건. (1) "테두리만 리본형태로 변경" — AskUserQuestion으로 3가지 리본 해석(모서리 리본 플래그/상하 리본 띠/노치형 테두리)을 미리보기와 함께 제시해 "상하 리본 띠(시안 C형)"를 확인받음. (2) "내용보기·전문가 상담 버튼을 내용과 같은 라인으로 올리자".
- **건드린 파일**: `eobom/frontend/src/pages/CareGuidePage.tsx` §3.1 배너(121행 부근) —
  - 테두리: `border: '1.5px solid var(--primary-color)'` + `borderRadius: 'var(--r-lg)'`(둥근 사각 전체 테두리) → `borderTop`/`borderBottom`만 `1.5px solid var(--primary-color)`, `borderRadius` 제거(좌우 변·모서리 없는 리본 띠 모양). 모서리 원형 뱃지는 그대로 유지.
  - 레이아웃: 본문 `<p>`와 버튼 2개가 각각 별도 줄(세로 스택)이던 것을 `display:flex, justifyContent:space-between`인 한 줄로 합침 — `<p>`는 `flex:'1 1 320px'`로 남는 공간을 채우고, 버튼 그룹은 `flexShrink:0`으로 우측에 붙는다. 좁은 화면에서는 `flexWrap:'wrap'`으로 자동으로 다음 줄로 넘어간다.
- **결과**: `tsc --noEmit`·`npm run build`(frontend) 통과. Claude-in-Chrome으로 `/care-guide` 두 변경 모두 실제 렌더 확인 — 위아래 네이비 선만 있는 리본 띠 모양, 본문과 버튼 2개가 한 줄에 정렬.
- **편차**: 없음.
- **다음 에이전트가 알아야 할 것**: 이 배너는 한 세션 안에서 A~F 시안 비교(아티팩트) → E 선택 → 테두리 리본형 재수정 → 버튼 한 줄 배치까지 4단계를 거쳤다. 최종 형태: 좌우 테두리 없음(위아래 선만) + 좌상단 원형 뱃지 + 제목 한 줄 + "본문+버튼 2개"가 한 줄. 추가로 손볼 요청이 오면 이 히스토리(wt159~162)를 먼저 확인할 것.

<!-- Gemini 판정 1줄: 대기 -->


## 2026-09-08 (163) | [Sonnet] 07-04 §8-9 — 상중 행정 가이드 구간 소속 2건 수정 (id23 구간1 이동 · id12 conditional 보강)

- **근거 스펙**: docs/07_상중_행정_케어/07-04.md §8-9 (2026-09-08 확정)
- **건드린 파일**: eobom/frontend/src/pages/CareGuidePage.tsx , eobom/frontend/src/mockData/careGuideTasks.json
- **결과**: (1) `TIME_SECTIONS`(CareGuidePage.tsx 39~44행) — funeral.ids를 `[2,5,1,3,4]` → `[2,5,1,3,4,23]`, month3.ids를 `[7,9,10,11,12,23]` → `[7,9,10,11,12]`로 수정. (2) careGuideTasks.json id 12 — `"title": "한정승인 후 채권자 공고"` → `"한정승인을 했다면 — 채권자 공고"`, `"conditional": true` 추가(deadlineLabel"5일"·deadlineBase"한정승인일"·category"상속 승인·포기"는 미변경). `tsc --noEmit`·`npm run build`(frontend) 통과.
- **편차**: id12에 `conditional: true`를 추가했지만 CareGuidePage.tsx 렌더 로직(228~232행)은 카테고리 헤더의 "(해당하는 경우에만)" 라벨을 그 카테고리 **첫 번째 항목**(`items[0].conditional`)으로만 판정한다. month3 구간의 "상속 승인·포기" 카테고리는 표시 순서가 `[9,10,11,12]`라 `items[0]`이 id9(비조건부)이고, 그래서 id12에 conditional을 붙여도 화면상 카테고리 헤더에는 아무 표시 변화가 없다 — id23(그 카테고리에 단독이라 items[0]이 자기 자신)과 다르게 처리된다. 현재는 title 문구("한정승인을 했다면 —")만 조건부임을 알린다. 항목 단위 조건부 배지가 필요하면 별도 스펙 판단(Opus) 필요 — 이번 작업 범위(JSON 데이터·섹션 배열 수정)를 벗어나 렌더 로직은 건드리지 않았다.
  부수 효과: id23을 funeral 구간으로 옮기며 그 구간 카테고리가 2종("장례 단계"·"조건부 (유언이 있는 경우)")이 되어, §8-8-2 `categoryOrder.length > 1` 조건에 따라 이전에는 없던 카테고리 헤더가 funeral 구간에도 새로 노출된다(기존 렌더 로직 그대로 동작한 결과이며 코드 변경 아님).
- **다음 에이전트가 알아야 할 것**: 🔵 실기동 검증 대기 — 사람이 `/care-guide`에서 구간1(5건, 새 카테고리 헤더 2종 노출)·구간3(5건으로 축소)·id12 문구·id12 conditional 무표시(위 편차)를 확인해야 한다. id12 조건부를 id23처럼 시각적으로 드러내려면 렌더 로직(카테고리 헤더 판정을 items[0]이 아니라 카테고리 내 전원 conditional 여부로 바꾸거나, 항목별 배지 추가) 변경이 필요 — Opus 스펙 판단 후 착수.

<!-- Gemini 판정 대기 -->


## 2026-09-08 (164) | [Sonnet] 유족 메시지 보관함 — 개인별 박스 보드(반응형 2열) + 새 편지 쓰기 A/B/C 탭 재설계

- **근거 스펙**: 스펙 없음 — 사용자가 디자인 아티팩트(시안 비교 → 확정)로 직접 지시한 즉흥 구현. `docs/06_엔딩노트_유언/06-05_유족메시지_보관함_도메인분리_기획서.md`는 도메인 분리(백엔드)까지만 다루고 이번 UI 재설계는 범위 밖 — 필요하면 `[Claude:Opus]`가 반영 여부 판단.
- **건드린 파일**: eobom/frontend/src/pages/FarewellMessagePage.tsx , eobom/frontend/src/components/FarewellMessageCard.tsx , eobom/frontend/src/components/VoiceToTextInput.tsx , eobom/frontend/src/index.css
- **결과**:
  1) FarewellMessagePage.tsx — 수신자 카드 그리드를 인라인 스타일(`repeat(auto-fit, minmax(min(340px,100%),1fr))`, 화면이 넓으면 3열 이상 벌어질 수 있었음)에서 `className="farewell-board-grid"`로 교체. index.css에 정의: 기본 1열, `@media (min-width:720px)`에서 `repeat(2,1fr)` — 반응형으로 한 줄에 최대 2개.
  2) FarewellMessageCard.tsx 편지 목록 — 148px 고정 높이·`repeat(auto-fill, minmax(300px,1fr))` 타일 그리드를 `.farewell-message-list`/`.farewell-message-row` 한 줄 리스트로 교체(높이 고정 해제, 박스 폭을 그대로 써서 `-webkit-line-clamp:2` 미리보기가 실제로 더 길게 보임). 삭제·다운로드 아이콘은 절대좌표 오버레이 대신 우측 메타 컬럼(`.farewell-message-meta`)으로 이동, 호버 시 아이콘 확대(iconBoxSize/iconGlyphSize) 로직은 그대로 유지.
  3) 새 편지 쓰기 모달 — 제목 입력 아래 A(`<Upload/>` 음성 파일 업로드)·B(`<Mic/>` 음성 녹음)·C(`<Pencil/>` 직접 쓰기) 탭 신설(`activeMethod` state, 기본값 `'write'`). 탭 옆 `.farewell-composer-body`(그리드 200px+1fr, 620px 미만에서 1열로 접힘)의 `.farewell-composer-rail`이 탭별 설명을 담당 — A/B는 "자동으로 글로 바뀝니다" + 네이버 CLOVA Speech 전송·7일 보관 안내(VoiceToTextInput 기존 동의 문구와 같은 내용), C는 "무엇을 남길까 고민된다면" 소재 힌트 3개. 패널 폭 560px→760px(`.farewell-message-panel`).
  4) VoiceToTextInput.tsx — `mode: 'upload' | 'record'` prop 신설. 첫방문 안내·녹음 확인모달·mic 에러·"목소리로 말하기" 섹션은 `mode==='record'`에서만, Ⓐ 업로드 섹션은 `mode==='upload'`에서만 그린다. `sttUploadEnabled`가 꺼져 있으면 A 탭엔 안내 문구("지금은 음성 파일 업로드를 사용할 수 없습니다")만 남긴다. `mediaInfo`·`audioSrc`·`audioLoading`·`deletingAudio`·`onListen`·`onDeleteAudio` props와 그 렌더(듣기·삭제 버튼 + `<audio>`)를 컴포넌트에서 완전히 뺐다 — FarewellMessageCard가 제목 입력 바로 아래 `.farewell-audio-attached` 행으로 탭과 무관하게 항상 렌더한다.
  5) FarewellMessageCard.tsx에서 VoiceToTextInput 호출에 `key={activeMethod}` — 탭 전환 시 강제 재마운트시켜, 녹음 중 다른 탭으로 넘어가도 기존 언마운트 클린업(스트림·MediaRecorder 정지)이 확실히 돈다.
  `npx tsc --noEmit`·`npm run build`(둘 다 eobom/frontend) 통과.
- **편차**:
  - A/B/C 탭은 (사용자가 지시한 대로) 항상 3개 다 보인다 — 서버 플래그(`CLOVA_STT_ENABLED`)가 꺼져 있거나 브라우저가 녹음을 지원하지 않아도 탭 자체를 숨기지 않고, 탭 안에서 안내 문구로 대체했다(탭이 사라졌다 나타났다 하지 않게).
  - 기존 음성 첨부 듣기·삭제 UI를 VoiceToTextInput 밖(`.farewell-audio-attached`)으로 옮겼다 — "직접 쓰기" 탭에서는 VoiceToTextInput 자체가 마운트되지 않아, 그 안에 있던 기존 구조로는 첨부 음성 관리가 그 탭에서 사라지는 문제가 생기기 때문. 탭 셋 중 어느 것을 선택해도 관리 가능하도록 부모로 끌어올렸다.
  - 기본 활성 탭을 사용자가 나열한 순서상 A가 아니라 C(직접 쓰기)로 정했다 — 모달을 열자마자 마이크/파일 권한과 무관한 쪽이 안전하다는 판단(권한 팝업이 뜻밖에 뜨는 상황을 피함). 다른 기본값을 원하면 `activeMethod` 초기값(FarewellMessageCard.tsx 78행 부근) 한 줄만 바꾸면 된다.
- **다음 에이전트가 알아야 할 것**: 🔵 실기동 검증 대기(사람, 09-03 방침) — `/farewell-messages`에서 ① 720px 기준 2열↔1열 전환, ② 박스 안 편지가 안 잘리고 한 줄씩 보이는지, ③ A/B/C 탭 전환 시 사이드노트 설명이 같이 바뀌는지, ④ B 탭 실제 녹음→저장 흐름(로직은 손대지 않았지만 렌더 배선을 바꿨으니 재확인 필요), ⑤ 첨부 음성이 있는 편지를 열었을 때 상단 "첨부된 음성" 행에서 듣기·삭제가 정상 동작하는지 확인 필요.

<!-- Gemini 판정 대기 -->


## 2026-09-08 (165) | [Sonnet] 유족메시지 박스보드·편지목록·새편지 탭 — wt164 후속 미세조정 4건

- **근거 스펙**: 스펙 없음 — 사용자 직접 지시(연속 피드백 4건, wt164 실기동 확인 중 지적).
- **건드린 파일**: eobom/frontend/src/index.css , eobom/frontend/src/components/FarewellMessageCard.tsx
- **결과**:
  1) 박스 보드 1개일 때 반으로 좁혀지던 것 — `.farewell-board-grid`의 720px 이상 규칙을 `repeat(2, 1fr)`(수신자 1명이어도 무조건 2열)에서 `repeat(auto-fit, minmax(max(360px, calc(50% - 0.75rem)), 1fr))`로 교체. 항목 1개면 1열(꽉 채움), 2개 이상이면 2열까지만 접힌다 — 열 수 상한(2)은 그대로.
  2) 편지 목록 행의 날짜·삭제·다운로드 상하 순서 변경 — `.farewell-message-meta` 안에서 날짜(위)·버튼줄(아래)이던 순서를 버튼줄(위)·날짜(아래)로 뒤집었다(FarewellMessageCard.tsx).
  3) 삭제·다운로드 아이콘 기본 크기 확대 — `iconBoxSize`/`iconGlyphSize` 기본값을 18px/12px → 24px/16px, 호버값을 25px/17px → 30px/20px로 키움(더 이상 텍스트 위에 겹쳐 있지 않고 전용 칸에 있어 평소에도 눌러야 할 만큼 커야 한다는 지시).
  4) 새 편지 쓰기 기본 탭을 C(직접 쓰기)에서 A(음성 파일 업로드)로 변경 — `activeMethod` 초기값과 `resetComposer`·`openNewComposer`·`openEditComposer` 3곳의 리셋값을 모두 `'upload'`로.
  `npx tsc --noEmit`·`npm run build`(둘 다 eobom/frontend) 통과.
- **편차**: 없음 — 전부 사용자가 명시한 대로.
- **다음 에이전트가 알아야 할 것**: 🔵 실기동 검증 대기 — 사람이 ①수신자 1/2/3명 각각 폭, ②편지 행 버튼·날짜 순서, ③아이콘 커진 크기, ④모달 기본 탭이 A로 열리는지 확인.

<!-- Gemini 판정 대기 -->


## 2026-09-08 (166) | [Sonnet] 유족메시지 보관함 — 박스 그리드 폐기, "사이드바+상세"로 재구현 + 가족 0명 시 사이드바 CTA

- **근거 스펙**: 스펙 없음 — 사용자 직접 지시. 디자인 아티팩트(네 가지 뼈대 비교: 사이드바+상세·아코디언·포커스 캐러셀·미리보기+펼치기)에서 "사이드바+상세로 결정" 확정.
- **건드린 파일**: eobom/frontend/src/pages/FarewellMessagePage.tsx , eobom/frontend/src/components/FarewellMessageCard.tsx , eobom/frontend/src/index.css
- **결과**:
  1) FarewellMessagePage.tsx — `recipients.length===0` 전용 중앙 카드 분기와 `.farewell-board-grid`(박스 그리드, wt164~165) 분기를 하나로 합쳐 `.farewell-board-shell > .farewell-board-layout`(사이드바 220px + 상세 1fr)로 재구성. `selectedRecipientId` state 신설(수신자 목록이 바뀌면 유효하지 않은 선택을 첫 번째 수신자로 재조정하는 useEffect 포함). 사이드바는 이름·관계·통수만 나열하는 버튼 목록, 상세 칸은 선택된 수신자 하나만 `<FarewellMessageCard key={selectedRecipient.id} .../>`로 렌더(key로 수신자 전환 시 강제 재마운트 — 열려 있던 편집기가 다른 사람 것으로 새는 걸 막는다).
  2) 가족 지정 0명일 때 — 사이드바가 목록 대신 `.farewell-board-add`("+ 가족 추가") 버튼 하나로 바뀌고, 상세 칸엔 안내 문구만 남는다. 버튼은 기존에 이미 배선돼 있던 `onOpenFamilyDesignation` prop을 그대로 호출 — App.tsx가 이걸 `MyPageFamilyDesignation` 모달(마이페이지에서 쓰는 그 모달, 이미 `isFamilyDesignationOpen` state로 전역 렌더 중)을 여는 데 연결해 두었으므로 별도 배선 없이 그대로 재사용된다.
  3) FarewellMessageCard.tsx — 더 이상 자기 박스(배경·그림자·패딩)를 그리지 않는다(부모 `.farewell-board-shell`이 그 역할). 이름/관계/상태 줄과 "새 편지 쓰기·전체 다운로드" 버튼을 한 줄(제목+액션, 구분선 아래로 목록)로 재배치 — 기존엔 액션 버튼이 목록 맨 아래에 있었다. 편지 0통일 때 "아직 남긴 편지가 없습니다" 문구 추가(전엔 아무 표시 없었음). `RELATIONSHIP_LABEL` export 추가(FarewellMessagePage 사이드바에서 재사용).
  4) index.css — `.farewell-board-grid`(+ 반응형 2열 트릭) 전체 삭제, `.farewell-board-shell`·`.farewell-board-layout`·`.farewell-board-sidebar`·`.farewell-board-recipient`·`.farewell-board-avatar`·`.farewell-board-add`·`.farewell-board-empty` 신설(680px 미만은 사이드바가 가로 스크롤 행으로 접힘).
  `npx tsc --noEmit`·`npm run build`(둘 다 eobom/frontend) 통과.
- **편차**: "가족 추가" 버튼은 사용자가 명시한 대로 **가족 0명일 때만** 사이드바에 나타난다(1명 이상이면 사이드바는 목록만, 추가 버튼 없음) — 이후 필요하면(예: 항상 노출) 알려주면 됨.
- **다음 에이전트가 알아야 할 것**: 🔵 실기동 검증 대기 — 사람이 ①가족 0명일 때 사이드바 버튼→MyPageFamilyDesignation 모달이 실제로 열리는지, ②가족 1명 이상일 때 사이드바 클릭으로 상세가 전환되는지, ③680px 미만에서 사이드바가 가로 스크롤 행으로 바뀌는지, ④수신자 전환 시 열려 있던 편지 편집기가 깨끗이 닫히는지 확인 필요.

<!-- Gemini 판정 대기 -->


## 2026-09-08 (167) | [Sonnet] 유족메시지 상세 칸 — 목업(md-detail) 타이포·색 디테일 반영

- **근거 스펙**: 스펙 없음 — 사용자 직접 지시("미리 만들어준 html의 md-detail 박스부분을 비슷하게 구현해줬으면 해, 디자인 측면에서"). 근거는 이전에 승인받은 디자인 아티팩트(사이드바+상세 옵션)의 CSS.
- **건드린 파일**: eobom/frontend/src/components/FarewellMessageCard.tsx , eobom/frontend/src/index.css
- **결과**: wt166에서 구조(헤더+구분선+액션, 편지 줄)는 이미 옮겼지만 놓쳤던 타이포·색 디테일 2가지를 마저 반영.
  1) 아티팩트에서 `h1~h4`가 전부 `--font-serif`(KoPub World Batang)였던 것 — 상세 칸의 받는 분 이름(1.5rem)과 편지 제목(1.1rem→1.15rem)에 `fontFamily: 'var(--font-serif)'`를 명시 추가. 지금까지는 본문 산세리프(Noto Sans/Pretendard)로만 렌더돼 "편지" 느낌이 덜했다.
  2) 아티팩트에서 음성 첨부 표시(🔊)는 `--gold-ink`(포인트 그린과 구분되는 금색 계열)였던 것 — 편지 줄의 `Volume2` 아이콘 색을 `var(--point-color)`(초록, 연필 아이콘과 같은 색이라 구분이 약했음)에서 `var(--accent-gold)`로 교체.
  3) index.css에 `.farewell-message-row:first-child{padding-top:0;}` 추가 — 헤더 구분선 바로 아래 첫 줄의 여분 위쪽 여백을 없애 아티팩트와 같은 밀착도로 맞춤.
  `npx tsc --noEmit`·`npm run build`(eobom/frontend) 통과.
- **편차**: 없음 — 목업 CSS 값을 그대로 가져왔다.
- **다음 에이전트가 알아야 할 것**: 🔵 실기동 검증 대기 — 사람이 편지 제목·받는 분 이름이 명조체로 보이는지, 음성 첨부 아이콘이 금색으로 바뀌었는지 확인.

<!-- Gemini 판정 대기 -->


## 2026-09-08 (168) | [Sonnet] 유족메시지 상세 칸 — 편지 줄 폭 축소·내부 여백 확대·날짜/버튼 재배치

- **근거 스펙**: 스펙 없음 — 사용자 직접 지시("내부 편지(회색배경) 박스의 넓이를 줄이고, 내부 margin은 조금 더 높이기. 날짜와 삭제 다운로드 버튼의 위치를 확인하고 재조정할 필요 있음").
- **건드린 파일**: eobom/frontend/src/index.css
- **결과**:
  1) `.farewell-message-list`에 `max-width: 640px` 추가 — 사이드바+상세로 넓어진 뒤 편지 줄이 상세 칸 가장자리까지 늘어나 있었다. 텍스트 칸만 좁히지 않고 목록 전체(제목·미리보기·메타 칸 전부)를 묶어서 좁혔다 — 그래야 날짜·버튼이 텍스트에서 멀리 떨어져 보이지 않는다.
  2) `.farewell-message-item`(호버 시 회색 `var(--surface-subtle)` 배경이 뜨는 클릭 영역) 내부 padding을 `var(--sp-2)`(8px)→`var(--sp-3)`(12px)로 키우고, 상쇄용 음수 margin도 같이 맞춰 바깥 위치는 그대로 유지했다.
  3) `.farewell-message-meta`에 `align-self: stretch`+`justify-content: space-between` 추가 — 버튼줄은 항상 줄 맨 위, 날짜는 항상 줄 맨 아래로 고정된다(전엔 `flex-direction:column`으로 위아래 붙어 있어 미리보기가 1줄일 때와 2줄일 때 날짜 위치가 들쭉날쭉했다).
  `npx tsc --noEmit`·`npm run build`(eobom/frontend) 통과.
- **편차**: 없음.
- **다음 에이전트가 알아야 할 것**: 🔵 실기동 검증 대기 — 사람이 편지 줄 폭이 640px로 좁아졌는지, 클릭 영역 여백이 넉넉해졌는지, 미리보기 줄 수가 다른 편지끼리도 날짜가 항상 줄 맨 아래에 고정되는지 확인.

<!-- Gemini 판정 대기 -->


## 2026-09-08 (169) | [Sonnet] 유족메시지 상세 칸 — reports/farewell_messages_redesign.html 시안 B 포팅

- **근거 스펙**: 스펙 없음 — 사용자 직접 지시("reports/farewell_messages_redesign.html 파일을 기준으로 farewell-board-shell 재구성. 사이드바는 지금처럼 두되 나머지 부분에 있어 최대한 html의 형태를 쓸 수 있도록"). `reports/`는 Gemini 소유(읽기 전용)라 **읽기만** 하고 고치지 않았다 — 그 파일 자체는 Gemini가 만든 4가지 시안(A 상단칩+전폭카드/B 2단 우편함/C 타임라인/비교뷰) 묶음 목업이고, 이 중 사이드바+상세 2단 구조인 **시안 B**(`.board-layout-b`/`.sidebar-b`/`.content-b`/`.letter-row-b`)를 포팅 대상으로 판단했다(현재 구조와 일치하는 유일한 시안).
- **건드린 파일**: eobom/frontend/src/components/FarewellMessageCard.tsx , eobom/frontend/src/index.css
- **결과**: 사이드바(FarewellMessagePage.tsx의 `.farewell-board-sidebar` 등)는 지시대로 손대지 않았다. 상세 칸(FarewellMessageCard)을 시안 B 마크업에 맞춰 재구성:
  1) 헤더 — "OOO님께 남기는 글"(명조 h2) + "총 N통의 편지가 보관되어 있습니다 · {상태}"(부제, 원본엔 없던 상태 문구를 통수 옆에 붙여 정보 손실 없앰 — 관계는 사이드바에 이미 있어 뺐다) + 액션 2개(새 편지 쓰기=진한 남색 solid 버튼, 전체 다운로드=테두리 사각 아이콘 전용 버튼, 시안 B 그대로).
  2) 편지 줄 — 이전(호버 시 회색 배경 뜨는 클릭 영역 전체) 구조를 버리고 시안 B의 "회색 박스 걷어낸 경계선 리스트"로: ①배지(🎙 음성 첨부 / 📄 텍스트, `hasAudio`로 분기)+날짜 한 줄 → ②제목(명조, 클릭 가능, 호버 시 금색으로 변함 — 이제 이것만 편집기를 연다) → ③미리보기 2줄 클램프 → ④우측 정렬 다운로드·삭제 아이콘(테두리 사각 버튼, 시안 B `.item-icon-btn` 그대로 — 이 과정에서 직전(wt165) "호버 시 커지는" 아이콘 크기 애니메이션은 제거하고 시안처럼 정적 크기+호버 시 배경·테두리 반전으로 바꿨다). 날짜 형식도 시간 포함 로컬 문자열 → "2026. 09. 04." 형식으로 시안과 맞췄다(`formatLetterDate` 신설).
  3) index.css — `.farewell-message-body`·`-title-row`·`-title-text`·`-meta`(구 메타 칸 구조) 삭제, `.farewell-message-row-top`·`-badge`(+`--audio`/`--text` 변형)·`-row-actions`·`-icon-btn`(+`--danger` 변형) 신설. 토큰은 리포트의 새 변수(`--accent`, `--text-body` 등)를 쓰지 않고 실제 앱에 이미 있는 토큰(`--primary-color`·`--accent-gold`·`--text-muted`·`--text-hint`·`--border-color`·`--surface-subtle`·`--state-danger-fg/bg`·`--font-serif`)으로 전부 치환해 이식했다.
  `npx tsc --noEmit`·`npm run build`(eobom/frontend) 통과.
- **편차**:
  - 상태 문구(가족으로 연결됨 등)는 시안 B 원본엔 없다 — 뺐다가 사이드바(관계·통수)만으론 못 채우는 정보라 판단해 통수 옆에 살려뒀다.
  - 아이콘 버튼 호버 애니메이션(크기 성장)을 정적 배경 반전으로 바꿨다 — 시안 B가 그 방식이고, 사각 테두리 버튼 자체가 이미 클릭 가능함을 드러내므로 크기 성장은 더 필요 없다고 판단. 직전 wt165의 "기본 사이즈를 더욱 키우기" 지시와 다소 배치되지만, 이번 지시("최대한 html 형태를 쓸 수 있도록")를 우선했다 — 필요하면 아이콘 크기(현재 15px, 버튼 34px)를 다시 키울 수 있다.
- **다음 에이전트가 알아야 할 것**: 🔵 실기동 검증 대기 — 사람이 편지 목록이 시안 B와 비슷하게 보이는지(배지·명조 제목·아이콘 버튼), 제목 클릭으로만 편집기가 열리는지, 음성 첨부 배지가 `hasAudio` 값에 맞게 뜨는지 확인 필요.

<!-- Gemini 판정 대기 -->


## 2026-09-08 (170) | [Sonnet] 유족메시지 보관함 — 전달 고지 배너를 경고 톤에서 안내 톤으로

- **근거 스펙**: 스펙 없음 — 사용자 직접 지시("'여기에 남기신 글은 사후 지정하신 분에게 전달됩니다.' 부분의 배경색 및 느낌표를 경고의 느낌이 아닌 알림의 느낌이 나도록"). 🔵 참고: 이 배너 문구 자체(재산분배 경고 문장 삭제 등)는 이번 세션 밖에서 이미 바뀌어 있던 상태였다(도구가 파일 변경 감지) — 문구는 그대로 두고 톤만 바꿨다.
- **건드린 파일**: eobom/frontend/src/pages/FarewellMessagePage.tsx
- **결과**: `AlertTriangle`(느낌표 삼각형) → `Info`(원형 i) 아이콘으로 교체(import도 같이 교체). 배경·테두리를 경고색(`--state-warn-bg`/`--state-warn-fg`, 호박색)에서 중립 안내색(`backgroundColor: var(--surface-subtle)`, `border: 1px solid var(--border-color)`, 본문 `color: var(--text-muted)`, 아이콘 `color: var(--point-color)`, 강조 텍스트 `color: var(--primary-color)`)으로 교체. `npx tsc --noEmit`·`npm run build`(eobom/frontend) 통과.
- **편차**: 없음.
- **다음 에이전트가 알아야 할 것**: 🔵 실기동 검증 대기 — 사람이 배너가 경고보다 안내로 읽히는지 확인. CareGuidePage의 §3.1 배너(비슷한 이유로 amber→네이비 톤 전환한 선례, wt155~162)와 같은 방향의 조정이다.

<!-- Gemini 판정 대기 -->


## 2026-09-08 (171) | [Sonnet] 전달고지 배너 — 배경만 흰색으로

- **근거 스펙**: 스펙 없음 — 사용자 직접 지시(wt170 확인 후 "배경 박스만 흰색으로").
- **건드린 파일**: eobom/frontend/src/pages/FarewellMessagePage.tsx
- **결과**: wt170에서 `var(--surface-subtle)`로 바꿨던 배경을 `var(--card-bg)`(흰색)로. 테두리·아이콘·텍스트 색은 wt170 그대로 유지. `npx tsc --noEmit`·`npm run build`(eobom/frontend) 통과.
- **편차**: 없음.
- **다음 에이전트가 알아야 할 것**: 없음.

<!-- Gemini 판정 대기 -->


## 2026-09-08 (172) | [Sonnet] 편지 수정 — 저장 기준별 탭 자동 선택 + 사이드노트 박스 높이 버그 수정

- **근거 스펙**: 스펙 없음 — 사용자 직접 지시("각 편지를 클릭했을 때, 저장된 기준에 따라 탭이 다르게 나와야함" / "편지 수정에서 사이드 설명의 끝이 아니고 바닥까지 박스가 늘어져있음").
- **건드린 파일**: eobom/frontend/src/components/FarewellMessageCard.tsx , eobom/frontend/src/index.css
- **결과**:
  1) `openEditComposer` — 지금까지 편지를 열면 무조건 A(업로드) 탭으로 고정돼 있던 걸, 저장된 데이터 기준으로 바꿈: `hasAudio`가 false면 C(직접 쓰기)로 바로 열어 본문을 곧장 수정할 수 있게 하고, true면 `mediaMime`으로 Ⓐ업로드/Ⓑ녹음을 추정해 그 탭을 연다 — 녹음(MediaRecorder)은 거의 항상 `webm`/opus로 저장되고(VoiceToTextInput.tsx의 RECORDER_MIME_CANDIDATES) 업로드는 m4a·mp3·wav가 대부분이라, mediaMime에 `webm`이 포함되면 B(녹음), 아니면 A(업로드)로 분기. (제작 시점의 "실제 입력 방법"은 저장되지 않아 완벽히 복원할 수 없다 — mediaMime은 그나마 남아 있는 가장 근접한 단서다.)
  2) index.css `.farewell-composer-body`(사이드노트+본문 그리드)에 `align-items: start` 추가 — grid 기본값(stretch)이라 사이드노트(`.farewell-composer-rail`, 회색 배경)가 본문 칸 높이만큼 늘어나 글이 끝난 뒤에도 회색 박스가 바닥까지 이어져 보이던 것을 고쳤다.
  `npx tsc --noEmit`·`npm run build`(eobom/frontend) 통과.
- **편차**: 없음 — 다만 mediaMime 기반 A/B 추정은 정확한 저장값이 아니라 휴리스틱이라는 한계는 편차가 아니라 "다음 에이전트가 알아야 할 것"으로 남긴다.
- **다음 에이전트가 알아야 할 것**: 🔵 실기동 검증 대기 — 사람이 ①텍스트만 있는 편지를 열면 C 탭으로 열리는지, ②녹음으로 남긴 편지는 B, 업로드로 남긴 편지는 A로 열리는지(휴리스틱이라 100% 보장 안 됨 — 어긋나면 실제 입력 방법을 DB에 별도 저장하는 스펙 변경이 필요), ③사이드노트 박스가 이제 글 길이만큼만 회색으로 보이는지 확인.

<!-- Gemini 판정 대기 -->


## 2026-09-08 (173) | [Sonnet] 00-38 Phase 1 — 적응형 모바일 UX 기반 작업

- **근거 스펙**: docs/00_핵심플랫폼/00-38_적응형_모바일_UX_개편_명세서.md §4·§4.5·§5·§11 (Phase 1, 화면 구조 변경 없음)
- **건드린 파일**: eobom/frontend/src/index.css(토큰 신설·개정, `--base-font-size` 폐기, `.container` 거터 분리, `.header-inner`·`.mobile-drawer-panel` 좌우 `--gutter-chrome` 명시) · eobom/frontend/src/hooks/useIsMobile.ts(신설) · eobom/frontend/src/components/home/EntryBoxes.tsx·eobom/frontend/src/pages/HomePage.tsx(기존 matchMedia 호출부를 `useIsMobile`로 통일, 값 유지: 767·640) · 그 외 소형 rem 리터럴(0.85/0.8/0.78/0.75/0.7rem → `var(--fs-body)`/`var(--fs-caption)`) 기계적 치환 34개 파일(AdminPage·BizDashboard·PartnerPortalPage 제외, §4.5).
- **결과**: 총 37개 파일 변경(§4.5 대상 334곳 치환 포함, 스펙 추정치 "약 318곳/38개 파일"과 근접). `npm run build`(tsc+vite) 통과. 실기동 확인(dev 서버, 360px) — `/facility`에서 `.container` padding `40px 28px`(=`var(--sp-10) var(--gutter-page)`) 실측, `.header-inner` padding `16px` 실측, `document.documentElement.scrollWidth`(345) ≤ `innerWidth`(360)로 가로 오버플로 0, `body` font-size 16px. 데스크톱(1920px)에서 `.header-inner` padding 72px(기존 clamp, 미변경) 확인.
- **편차**: HomePage.tsx의 `isMobileLayout`은 스크롤/휠 핸들러가 마운트 시 1회만 등록되는 effect 안에서 호출돼(`useEffect(...,[sections.length])`), `useIsMobile(640)`의 렌더 스냅샷을 그대로 클로저에 캡처하면 리사이즈 이후 값이 굳는다 — `useIsMobile(640)` 반환값을 ref로 미러링해(`isMobile640Ref`) 그 ref를 읽는 방식으로 우회했다(§5.2 "값은 그대로" 취지 유지, 동작은 기존과 동일).
- **다음 에이전트가 알아야 할 것**: 🟡 index.css 안에 이번 치환 대상(§4.5)에 포함되지 않은 소형 rem 폰트 리터럴이 남아있다(예: `:794 font-size:0.85rem`·`:1596·1948 font-size:0.78rem`·`:1781·1834 font-size:0.8rem` 등 — index.css 자체는 §4.5의 "38개 파일"에 포함되지 않아 손대지 않음). 루트 16px화로 이 값들도 동일하게 작아졌을 것이라 DoD #2(≥16px/≥14px) 전수 검사 시 걸릴 수 있다 — Phase 2 착수 전 Opus 확인 필요. 🔵 로그인 필요 화면(MyPage·ObituaryPage·EndingNotePage 등)의 DoD #1~#7 실측은 에이전트가 로그인 화면을 닫을 수 없어(`00-29` §15) 사람이 실기기로 확인해야 한다.

<!-- Gemini 판정 대기 -->


## 2026-09-08 (174) | [Sonnet] 00-38 Phase 1.5 + Phase 2 ① — Farewell 적응형 분리

- **근거 스펙**: docs/00_핵심플랫폼/00-38_적응형_모바일_UX_개편_명세서.md §4.5-1·§5.3·§6·§8.1-1 ⓐ~ⓕ·§11. 고지 문구는 docs/06_엔딩노트_유언/06-05_유족메시지_보관함_도메인분리_기획서.md §4.3(09-08 블록).
- **건드린 파일**:
  - Phase 1.5[A] eobom/frontend/src/index.css — `.stat-row__label`·`.header-outline-btn`·`.farewell-message-badge`·`.farewell-rail-label`·`.farewell-result-label`·`.farewell-board-recipient-sub` font-size 7곳 → `var(--fs-body)`/`var(--fs-caption)`, `.stat-row__label` ≤480px 0.7rem 규칙 삭제.
  - Phase 1.5[B] eobom/frontend/src/pages/CareGuidePage.tsx — 카테고리 헤더의 `{items[0].conditional && ' (해당하는 경우에만)'}` 삭제(`conditional` 필드 자체는 데이터에 유지).
  - Phase 2① 신설: eobom/frontend/src/components/farewell/{types.ts, FarewellNotice.tsx, FarewellDesktopView.tsx, FarewellMobileView.tsx}
  - Phase 2① 수정: eobom/frontend/src/pages/FarewellMessagePage.tsx(상태·핸들러만 남기고 `useIsMobile()`로 뷰 분기) · eobom/frontend/src/components/FarewellMessageCard.tsx(레일 접기 `railOpen` 상태 신설, textarea를 인라인 스타일 대신 `.farewell-composer-textarea` 클래스로) · eobom/frontend/src/index.css(오버레이/패널 640→768px, `max-height:100dvh`·좌우 `--gutter-page`, 컴포저 620→768px·레일 order -1(위)+토글/접기 CSS, `.farewell-message-preview` ≤768px 숨김, `.farewell-board-layout` 계열 ≤680px 죽은 CSS 삭제, `.farewell-mobile-list`·`.farewell-mobile-back` 신설).
- **결과**: `npm run build`(tsc+vite) 통과. `FarewellMessagePage`가 §6.1 구조(부모=상태 5개+핸들러 3개+`onOpenFamilyDesignation` 분기만, `FarewellDesktopView`=기존 JSX 그대로, `FarewellMobileView`=1단계 수신자 목록→2단계 뒤로가기+`FarewellNotice`+`FarewellMessageCard` 재사용)로 분리됨. §8.1-1 ⓕ 자동선택 effect에 `isMobile` deps 추가(모바일→데스크톱 전환 시 상세 칸 빈 채로 안 남게). `FarewellMessageCard`는 §8.1-1 ⓔ대로 쪼개지 않고 두 뷰가 그대로 재사용 — 리더/컴포저의 모바일 대응은 CSS(+ `railOpen`만 신규 로컬 state)로 처리. 06-05 §4.3 고지 문구를 원문으로 복원(`FarewellNotice.tsx`, Desktop은 위치 그대로 상단·Mobile은 컴포저 바로 위). 로그인 게이트 화면(비로그인 상태)에서 dev 서버로 실기동 확인 — 콘솔 에러 0건, `FarewellMessagePage`→`useIsMobile` 모듈 로딩 정상.
- **편차**: (1) 06-05 §4.3 고지 텍스트 복원을 Desktop에도 적용했다 — 스펙 ⓒ는 문면상 모바일 섹션에 있지만 "함께 정정"이 원문 대조 기준 수정이라 읽었고, ⓓ(데스크톱 회귀 0)는 레이아웃 동일성이지 카피 버그 수정까지 막는 것은 아니라고 판단했다. Opus 판단 대기. (2) 레일 접기(`railOpen`)를 `FarewellMessageCard` 내부 로컬 state로 추가했다 — §6.2가 금지하는 것은 페이지 상태를 뷰에 두는 것이고, 이 state는 카드 자체의 순수 표현용 토글이라 규칙 위반이 아니라고 판단했다. (3) `.farewell-board-layout`/`-sidebar`/`-recipient` 문서화 안 된 ≤680px 미디어쿼리를 삭제했다 — Desktop뷰가 이제 >768px에서만 마운트돼 도달 불가능한 죽은 CSS가 됐기 때문(직접 유발한 결과라 같은 커밋에서 정리).
- **다음 에이전트가 알아야 할 것**: 🔵 로그인 필요 화면이라 §11 DoD #1~#7·#9(마스터·디테일 전환, 리더 모달, 레일 접기, 767↔769 리사이즈 시 입력값 유지, 1280px 스크린샷 대조)는 사람이 실기기로 로그인해 확인해야 한다(00-29 §15). 🟡 위 편차(1)(2)는 Opus 판정 필요 — 특히 (1)은 Desktop 스크린샷이 노트 박스 높이만큼 전후 달라질 수 있어 DoD #8 판정 시 참고. 다음=Phase 2 ② `CareGuidePage`(§8.1-3, Phase1.5[B]로 선행 조건은 닫힘) → ③ `EndingNotePage`.

<!-- Gemini 판정 대기 -->


## 2026-09-09 (175) | [Sonnet] 개발 경로 개명 — eobom/ → eobomDev/ (폴더 이동 + 배포·gitignore·내부 자기참조)

- **근거 스펙**: 스펙 없음 — `[Claude:Sonnet]` 핸드오프 지시("개발 경로 개명 — eobom/ → eobomDev/", Opus가 docs/·.harness/·루트 CLAUDE.md 41파일 96곳 선행 반영 완료 후 폴더 이동만 남은 상태).
- **건드린 파일**: `git mv eobom eobomDev`(199개 항목 rename 추적) · `render.yaml`(L19 rootDir) · `.gitignore`(L25·28·32·35·36·37, 6줄) · `eobomDev/README.md`(L12·L22 트리 루트·L63·L85·L115) · `eobomDev/backend/src/server.ts`(L41) · `eobomDev/frontend/src/config.ts`(L53) · `eobomDev/frontend/vite.config.ts`(L8) · `eobomDev/workers/r2-archive-relay/wrangler.toml`(L8) · `eobomDev/workers/r2-archive-relay/README.md`(L6).
- **결과**: `git mv`는 처음 "Permission denied"로 실패 — `eobom/frontend`를 물고 있던 esbuild 프로세스 2개(pid 20548·38708)와 좀비 vite dev 서버 2개(pid 29504·26288, 배경 bash 35944·30772)를 종료 후 재시도해 성공. `.gitignore` 수정 직후 `git status --ignored=matching`으로 `eobomDev/.certs/`·`eobomDev/backend/backups/`·`eobomDev/backend/uploads/` 셋 다 `!!`(무시됨)로 확인 — 개인정보·백업 유출 없음. `eobomDev/frontend`에서 `npm run build`(tsc+vite) 통과, `eobomDev/backend`에서 `npm run build`(prisma generate+tsc) 통과. `node .harness/tools/token-guard.js` — `SRC_MARKER`가 이미 `eobomDev[\\/]frontend[\\/]src[\\/]`를 잡음(Opus 선행 반영 확인, exit 0). `node .harness/tools/generate-db-doc.js` 재실행 — prisma 경로 정상 해석(모델 31개·컬럼 351개), `git status`로 `00-05` 파일 diff 없음 확인(idempotent 재생성이라 내용 변경 없음, `docs/` 소유권 침범 아님). `grep -rn "eobom[/\\](frontend|backend|workers|\.certs)"` 잔여 확인 — `docs/작업일지_및_기록/`·`docs/트러블슈팅/`·`.harness/_meta/` 산하 로그·일지 17개 파일만 남음(핸드오프 지시대로 기록이라 정상, 미수정).
- **편차**: `eobomDev/README.md` L22(디렉터리 트리 다이어그램 루트 `eobom/`)를 핸드오프 목록(L12·L63·L85·L115)에는 없었지만 함께 `eobomDev/`로 수정 — 같은 파일 안에서 나머지 3곳만 고치고 트리 루트만 옛 이름으로 남기면 바로 옆에서 눈에 띄게 어긋나는 상태였다.
- **다음 에이전트가 알아야 할 것**:
  - 🔴 **[사람] 핸드오프 §7 외부 설정 확인 필요** — (1) Vercel 프로젝트의 Root Directory가 `eobom/frontend`로 잡혀 있으면 `eobomDev/frontend`로 변경해야 다음 배포가 성공한다. (2) Render가 `render.yaml` Blueprint가 아니라 대시보드 수동 설정으로 `rootDir`을 잡고 있다면 그쪽도 별도로 바꿔야 한다 — 이번 세션에서는 Render/Vercel 대시보드에 접근하지 않아 어느 쪽인지 확인 못 함.
  - 다음에 dev 서버를 다시 띄울 때는 새 경로(`eobomDev/frontend`, `eobomDev/backend`)에서 띄워야 한다 — 옛 `eobom/` 디렉터리는 더 이상 존재하지 않는다.
  - DB에는 아무것도 쓰지 않았다(이 작업은 DB 무관, 핸드오프 지시 §5 그대로).
  - 커밋하지 않고 멈춤 — 초안 메시지만 제시, 사람이 직접 커밋.

<!-- Gemini 판정 대기 -->


## 2026-09-09 (176) | [Sonnet] Footer 모바일 압축 — FooterMobile 아코디언 신설

- **근거 스펙**: 스펙 없음 — 사용자 직접 지시("Footer 너무 글이 많기에 모바일 화면에서 불필요하게 늘어짐, 데스크탑은 그대로"). 목업(Artifact 3안 비교: Before/아코디언/압축형)을 먼저 만들어 검토받고, "안 A(아코디언)"로 확정 후 반영(전화상담 버튼 제거, 전화번호 줄바꿈, 로고 확대, 펼침 패널 여백 축소 — 총 3회 피드백 반영) → 실 구현.
- **건드린 파일**:
  - `eobomDev/frontend/src/components/FooterMobile.tsx` — 신설. 로고(`EobomLogo variant="symbol" height={38}`, 데스크톱보다 확대) + 카카오톡 문의 버튼(전체 너비, `var(--min-touch-target)`) + 운영시간 한 줄 + "약관·대표번호 안내 보기/접기" 토글(`useState`) + 펼침 패널(이용약관·개인정보처리방침 링크, "사업장·전문가 문의, 개인정보 열람·삭제:" 다음 줄에 전화번호) + 카피라이트.
  - `eobomDev/frontend/src/components/Footer.tsx` — `useIsMobile(768)`로 분기 추가. `isMobile`이면 `<FooterMobile />` 반환 후 조기 return, 데스크톱 4열 그리드 JSX는 전혀 손대지 않음.
  - `eobomDev/frontend/src/index.css` — `.footer-mobile-toggle-icon`(+`.open`, 화살표 회전) · `.footer-mobile-panel`(+`.open`, `max-height:0→170px` 트랜지션) 신설.
- **결과**: `npx tsc --noEmit`·`npm run build`(tsc+vite) 통과. 데스크톱(>768px)은 `Footer.tsx` 기존 JSX가 그대로 렌더되어 회귀 없음(코드 자체를 안 건드림). 모바일(≤768px)은 로고+카카오 버튼+운영시간만 접힌 상태로 보이고, 토글을 누르면 약관 링크 2개 + 전화번호가 패널로 펼쳐진다.
- **편차**: 없음 — 목업 검토 3라운드를 거쳐 사용자가 최종 승인한 디자인 그대로 구현.
- **다음 에이전트가 알아야 할 것**: 🔵 실기동(브라우저, 360px) 검증 대기 — 토글 열고닫기 애니메이션·펼침 패널 높이(`max-height:170px`)가 실제 폰트 렌더링에서 내용이 잘리지 않는지 확인 필요(코드 검토로 3줄 분량 계산해 여유를 뒀지만 실측 아님). `FooterMobile.tsx`는 이번에 아코디언 상태기계가 생겨 분리한 것이라(00-38 §6.5) 향후 Footer 관련 편집 시 데스크톱은 `Footer.tsx`, 모바일은 `FooterMobile.tsx` 둘 다 확인해야 한다.

<!-- Gemini 판정 대기 -->

## 2026-09-09 | Phase 1.6 — 기계적 치환 C→D (fontSize 0.9·0.95rem → var(--fs-body) / 간격 속성 타입 토큰 정정)

- **근거 스펙**: docs/00_핵심플랫폼/00-38_적응형_모바일_UX_개편_명세서.md §4.5-2 · §4.5-3 · §10 Phase 1.6
- **건드린 파일**:
  - **C** (`fontSize: '0.9rem'|'0.95rem'` → `var(--fs-body)`, `index.css`의 `font-size: 0.9rem|0.95rem;` 포함, 총 33개 파일 107곳 = tsx 100 + index.css 7): `index.css`, `App.tsx`, `components/endingNote/AccordionSection.tsx`, `components/endingNote/SummaryModal.tsx`, `components/expert/ConsultRequestModal.tsx`, `components/facility/FacilityReviewModal.tsx`, `components/facility/InquiryModal.tsx`, `components/farewell/FarewellDesktopView.tsx`, `components/farewell/FarewellMobileView.tsx`, `components/farewell/FarewellNotice.tsx`, `components/FarewellMessageCard.tsx`, `components/Header.tsx`, `components/KakaoMapModal.tsx`, `components/legal/LegalDocLayout.tsx`, `components/LoginModal.tsx`, `components/MyPageAuthSettings.tsx`, `components/MyPageFamilyDesignation.tsx`, `components/Sidebar.tsx`, `components/SocialLinkModal.tsx`, `components/VoiceToTextInput.tsx`, `pages/CounselingPage.tsx`, `pages/DigitalEstatePage.tsx`, `pages/DomainOverviewPage.tsx`, `pages/EndingNotePage.tsx`, `pages/FacilityPage.tsx`, `pages/FamilyInvitePage.tsx`, `pages/MemorialLandingPage.tsx`, `pages/MemorialPage.tsx`, `pages/MyObituaryListPage.tsx`, `pages/MyPage.tsx`, `pages/ObituaryLandingPage.tsx`, `pages/ObituaryPage.tsx`, `pages/PickupPage.tsx`. 🔴 제외(그대로 둠): `AdminPage.tsx`(8) · `BizDashboard.tsx`(7) · `PartnerPortalPage.tsx`(3) = 18곳.
  - **D** (간격 속성의 `var(--fs-body)`→`var(--sp-4)` · `var(--fs-caption)`→`var(--sp-3)`, 37개 파일 140곳): `components/AddressSearchModal.tsx`, `components/counseling/TaxSimulatorModal.tsx`, `components/endingNote/AccordionSection.tsx`, `components/endingNote/SummaryModal.tsx`, `components/EobomLogo.tsx`, `components/expert/ConsultRequestModal.tsx`, `components/facility/FacilityReviewModal.tsx`, `components/facility/InquiryModal.tsx`, `components/farewell/FarewellDesktopView.tsx`, `components/farewell/FarewellMobileView.tsx`, `components/farewell/FarewellNotice.tsx`, `components/FarewellMessageCard.tsx`, `components/Footer.tsx`, `components/home/EntryBoxes.tsx`, `components/KakaoMapModal.tsx`, `components/legal/LegalDocLayout.tsx`, `components/LoginModal.tsx`, `components/MyPageAuthSettings.tsx`, `components/MyPageFamilyDesignation.tsx`, `components/MyPageProfile.tsx`, `components/Sidebar.tsx`, `components/SocialLinkModal.tsx`, `components/VoiceToTextInput.tsx`, `pages/CareGuidePage.tsx`, `pages/CounselingPage.tsx`, `pages/DigitalEstatePage.tsx`, `pages/DomainOverviewPage.tsx`, `pages/EndingNotePage.tsx`, `pages/FacilityPage.tsx`, `pages/FamilyInvitePage.tsx`, `pages/FarewellMessagePage.tsx`, `pages/HomePage.tsx`, `pages/MemorialLandingPage.tsx`, `pages/MemorialPage.tsx`, `pages/MyObituaryListPage.tsx`, `pages/ObituaryPage.tsx`, `pages/PickupPage.tsx`.
- **결과**: C→D 순서 고정으로 스크립트 기반 정규식 치환(판단 개입 없음, 노드 스크립트로 전수 적용).
  - C 정규식: tsx는 `fontSize:\s*(['"])(0\.9rem|0\.95rem)\1` → `fontSize: $1var(--fs-body)$1`, `index.css`는 `font-size:\s*(0\.9rem|0\.95rem);` → `font-size: var(--fs-body);`.
  - D 정규식: `gap`·`margin`·`marginBottom`·`marginTop`·`padding`·`paddingTop`·`right`·`top` 속성의 따옴표 값 안에서만 `var(--fs-body)`→`var(--sp-4)`, `var(--fs-caption)`→`var(--sp-3)`(속성명 화이트리스트 매칭 — `fontSize`·`lineHeight`는 스코프 밖이라 원천적으로 건드리지 않음).
  - **검증(재현 가능한 grep)**:
    - `grep -rnE "fontSize:\s*['\"](0\.9rem|0\.95rem)['\"]" eobomDev/frontend/src --include=*.tsx` → `AdminPage.tsx`(8)·`BizDashboard.tsx`(7)·`PartnerPortalPage.tsx`(3) 외 잔여 0.
    - `grep -rnE "(gap|margin|marginBottom|marginTop|padding|paddingTop|right|top):\s*['\"\`][^'\"\`]*var\(--fs-(body|caption)\)" eobomDev/frontend/src` → 잔여 0.
  - **빌드**: `cd eobomDev/frontend && npm run build` (= `tsc && vite build`) → 에러 0, 통과 (`dist/assets/index-*.css 27.84 kB`, `index-*.js 587.20 kB`, "built in 3.99s").
  - **실기동**: 하지 않음 — 사람 몫(2026-09-03 지시)이라 "실기동 검증 대기"로 남긴다. 360px 요소 전수 스윕(DoD #2)·데스크톱 1280px 줄바꿈 회귀 확인 모두 사람이 확인해야 한다.
- **편차**: C·D 자체는 스펙대로다(편차 없음). 다만 작업 중 스펙 범위 밖의 새 구멍을 하나 발견해 판단 없이 손대지 않고 아래에 남긴다.
- **다음 에이전트가 알아야 할 것**:
  1. 🔴 **새로 발견된 구멍 — `0.82`·`0.85`·`0.86`·`0.87`·`0.88rem` fontSize 잔존(§4.5·§4.5-2 어느 치환표에도 정확히 없는 값).** 루트 16px에서 13.1~14.1px로 계산돼 "보조 ≥14px"(DoD #2) 위반 소지가 있다. 위치(파일:개수): `components/Footer.tsx`(4, `0.88rem`×3·`0.82rem`×1) · `components/FooterMobile.tsx`(3, `0.82`·`0.85`×2·`0.78rem` 포함 — **wt176(2026-09-09)에 신설된 파일이라 과거 Phase 1 스윕 대상 자체가 아니었음**) · `components/LoginModal.tsx`(1, `0.86rem`) · `components/MyPageProfile.tsx`(1, `0.88rem`) · `components/legal/LegalDocLayout.tsx`(1, `0.88rem`) · `pages/CareGuidePage.tsx`(1, `0.87rem`) · `pages/DigitalEstatePage.tsx`(3, `0.82rem`×2·`0.88rem`×1) · `pages/FamilyInvitePage.tsx`(1, `0.82rem`) · `pages/HomePage.tsx`(1, `0.88rem`) · `pages/MemorialPage.tsx`(1, `0.82rem`) · `pages/MyObituaryListPage.tsx`(2, `0.82rem`) · `pages/ObituaryPage.tsx`(1, `0.82rem`) · `pages/PrivacyPage.tsx`(6, `0.88rem`) · `components/VoiceToTextInput.tsx`(1, `0.88rem`). 정확한 재현: `grep -rnE "fontSize:\s*['\"]0\.(7[0-9]?|8[0-9]?)rem['\"]" eobomDev/frontend/src --include=*.tsx | grep -v "AdminPage.tsx\|BizDashboard.tsx\|PartnerPortalPage.tsx"`.
  2. **왜 지금 안 고쳤나**: 이 값들은 §4.5(0.85·0.8rem)·§4.5-2(0.9·0.95rem) 어느 표에도 리터럴로 정확히 일치하지 않아 "판단 불요"가 아니다 — `var(--fs-caption)`(14px)로 보낼지 새 토큰이 필요한지는 Opus 판정 사안이라 Sonnet이 임의로 처리하지 않았다.
  3. `pages/CareGuidePage.tsx`에도 1곳(`0.87rem`) 있다 — Phase 2 ② `CareGuidePage` 착수 전에 위 구멍의 판정이 먼저 나면 좋다(막지는 않지만 같이 손대는 게 효율적).
  4. C가 `fontSize`를 16px로 올린 화면 33개 전체가 데스크톱 1280px에서 줄바꿈이 바뀔 수 있다 — 실기동 시 어디가 어떻게 변했는지 walkthrough에 추가 기록 필요(DoD #8은 픽셀 동결이 아니라 레이아웃·구조 동일성 기준).

<!-- Gemini 판정 1줄: … -->


## 2026-09-09 | wt178 — Phase 1.7 §4.5-4 구간 치환 E→F→G (fontSize 구간규칙, 열거식 표 대체)

- **근거 스펙**: docs/00_핵심플랫폼/00-38_적응형_모바일_UX_개편_명세서.md §4.5-4 · §10 Phase 1.7 (§4.5·§4.5-2 옛 열거표는 §4.5-4로 대체됨)
- **건드린 파일** (18개 파일, E 44곳 + F 1곳 + G 1곳 = 46회 편집, 실 위치 45곳 — G가 E의 1곳을 덮음):
  - `index.css`(E 3곳: `:1012` `.header-nav-item` · `:1782` `.farewell-method-tabs button` · `:1854` `.farewell-rail-hints li`, 전부 `0.92rem`)
  - `components/Footer.tsx`(E 5곳 `0.88rem`×4·`0.82rem`×1(`:190`) + **G 1곳**: `:190`을 다시 `var(--fs-caption)`로 덮음)
  - `components/FooterMobile.tsx`(E 3곳 `0.82`·`0.85rem`×2 + **F 1곳**: `:97` `0.78rem`→`var(--fs-caption)`)
  - `components/home/EntryBoxes.tsx`(E 1, `0.92rem`)
  - `components/legal/LegalDocLayout.tsx`(E 1, `0.88rem`)
  - `components/LoginModal.tsx`(E 6: `0.86`×1·`0.98`×3·`0.92`×2)
  - `components/MyPageProfile.tsx`(E 1, `0.88rem`)
  - `components/Sidebar.tsx`(E 2, `0.98rem`×2)
  - `components/VoiceToTextInput.tsx`(E 1, `0.88rem`)
  - `pages/CareGuidePage.tsx`(E 2: `0.98`·`0.87rem`)
  - `pages/DigitalEstatePage.tsx`(E 4: `0.82`×2·`0.88`×2)
  - `pages/DomainOverviewPage.tsx`(E 1, `0.92rem`)
  - `pages/FamilyInvitePage.tsx`(E 2: `0.92`·`0.82rem`)
  - `pages/HomePage.tsx`(E 1, `0.88rem`)
  - `pages/MemorialPage.tsx`(E 1, `0.82rem` — `height:'36px'`는 §4.5-5 Phase3 몫이라 손대지 않음)
  - `pages/MyObituaryListPage.tsx`(E 2, `0.82rem`×2 — 마찬가지로 `height:'36px'` 미변경)
  - `pages/ObituaryPage.tsx`(E 2: `0.92`·`0.82rem`)
  - `pages/PrivacyPage.tsx`(E 6, `0.88rem`×6)
- **결과**: E→F→G 순서 고정으로 스크립트 치환(E는 Node 정규식 스크립트로 `0.82·0.85·0.86·0.87·0.88·0.92·0.98rem` 리터럴 정확히 매칭해 `var(--fs-body)`로, F·G는 각 1곳이라 Edit로 수기 처리). 운영자 3화면(`AdminPage.tsx`·`BizDashboard.tsx`·`PartnerPortalPage.tsx`) 제외 유지.
  - **검증(스펙 지정 grep 그대로 재현)**:
    - `grep -rnE "fontSize:\s*['\"]0\.(7[0-9]?|8[0-9]?|9[1-9])rem['\"]" eobomDev/frontend/src --include=*.tsx | grep -v "AdminPage.tsx\|BizDashboard.tsx\|PartnerPortalPage.tsx"` → 잔여 0
    - `grep -nE "font-size:\s*0\.(7[0-9]?|8[0-9]?|9[1-9])rem" eobomDev/frontend/src/index.css` → 잔여 0
    - D 회귀 확인: `grep -rnE "(gap|margin|marginBottom|marginTop|padding|paddingTop|right|top):\s*['\"\`][^'\"\`]*var\(--fs-(body|caption)\)" eobomDev/frontend/src` → 잔여 0 (Phase 1.6 D 결과 그대로 유지됨)
  - **빌드**: `cd eobomDev/frontend && npm run build`(`tsc && vite build`) → 에러 0, 통과 (`dist/assets/index-*.css 27.86 kB`, `index-*.js 587.50 kB`, "built in 4.74s")
  - **실기동**: 하지 않음(사람 몫). "실기동 검증 대기"로 남긴다. 사람이 확인할 때 함께 봐야 할 것: `FooterMobile` 펼침 패널이 `.footer-mobile-panel`의 `max-height:170px`(index.css:575)를 넘지 않는지 — 계산상 3줄×line-height 1.8×16px≈86px+여백≈100px로 여유 있으나 wt176이 13.6px 기준으로 잡은 값이라 재확인 필요.
- **편차**: 없음. `height:'36px'` 3곳(`MemorialPage.tsx:250`·`MyObituaryListPage.tsx:199·210`)은 지시대로 이번엔 fontSize만 바꾸고 그대로 뒀다(§4.5-5, Phase 3 몫).
- **다음 에이전트가 알아야 할 것**: DoD #2(360px 요소 전수)·데스크톱 1280px 회귀 확인 모두 사람 실기동 대기. 다음 작업은 Phase 2 ② `CareGuidePage`(§8.1-3) — 이번에 `CareGuidePage.tsx`도 fontSize 2곳(`0.98`·`0.87rem`)이 `var(--fs-body)`로 바뀌었으니 분리 작업 시 최신 상태 기준으로 진행할 것.

<!-- Gemini 판정 1줄: … -->


## 2026-09-09 | wt179 — 부고장 관리 미리보기 우선 표시(모달 수정) + 데스크톱 컨테이너 최소폭·가로 스크롤

- **근거 스펙**: 스펙 없음 — 즉흥구현. 사람이 직접 두 가지를 지시(세션 중 텍스트 요청, docs/ 문서화 없음):
  1. 부고장 관리 페이지: 부고장 생성 후에는 미리보기·공유가 먼저 나오고, 수정은 버튼→모달로.
  2. 데스크톱 소비자 화면 전체: 일정 폭 이하로는 더 줄이지 않고 가로 스크롤(AskUserQuestion으로 범위 확인 — "소비자용 페이지 전체, 모바일 반응형은 그대로 유지" 확정, 운영자 3화면 제외).
- **건드린 파일**:
  - `eobomDev/frontend/src/pages/ObituaryPage.tsx` — 구조 재작성
  - `eobomDev/frontend/src/index.css` — `.container`/`.main-wrapper` 규칙 추가
- **결과**:
  1. **ObituaryPage.tsx**: 기존엔 `<form>`(수정 폼)과 미리보기+공유 패널이 `.auto-grid` 2열에 항상 나란히 있었다. `formCard`·`previewCard`·`managePanel` 세 JSX를 컴포넌트 함수 안의 `const`로 추출해 두 레이아웃에서 재사용하도록 재작성:
     - `obituaryRef`가 있을 때(관리 모드): `previewCard` → "부고장 정보 수정" 버튼(`<Pencil>` 아이콘) → `managePanel`(공유/종료) 순으로 세로 스택(`maxWidth:520px`, 중앙 정렬 — 데스크톱·모바일 공통, 별도 미디어쿼리 불필요). 버튼 클릭 시 `isEditOpen` state로 `formCard`를 모달(고정 오버레이, `maxWidth:560px`, `maxHeight:90vh` 내부 스크롤, X 닫기 버튼, 오버레이 클릭으로도 닫힘)에 띄운다. `handleSubmit`의 PATCH(수정) 성공 분기에 `setIsEditOpen(false)`를 추가해 저장 성공 시 모달이 자동으로 닫히고 갱신된 미리보기/공유 패널이 보이게 했다.
     - `obituaryRef`가 없을 때(최초 작성): 기존 `.auto-grid` 2열(`formCard` + `previewCard`) 그대로 — 이 경로는 손대지 않았다(09-07 지시로 이미 확정된 레이아웃).
     - `Pencil` 아이콘을 `lucide-react`에서 추가 import.
  2. **index.css**: `.container`의 `@media (max-width:359px)` 블록 바로 뒤에 `@media (min-width:769px) { .main-wrapper{overflow-x:auto} .main-wrapper .container{min-width:1024px} }` 추가. `.main-wrapper`는 `App.tsx`에서 소비자 화면에만 붙는 클래스(`className={isPortalRoute ? undefined : 'main-wrapper'}`)라 `AdminPage`·`BizDashboard`·`PartnerPortalPage`는 자동으로 영향 밖 — JS 쪽은 전혀 건드리지 않고 CSS 선택자 스코프만으로 제외했다(`grep -n "main-wrapper" eobomDev/frontend/src` → `App.tsx`·`index.css`·`Sidebar.tsx`(주석뿐) 3곳만, 페이지 컴포넌트에 없음을 확인). `HomePage`·`prep`·`bereaved`(`DomainOverviewPage`)는애초 `.container`를 안 쓰고 `.fullpage-viewport`/`.domain-overview-viewport`를 쓰므로 이 규칙의 영향을 받지 않는다(확인함). 최소폭 값 `1024px`은 근거 문서가 없는 임의 선택 — 사용자가 실제로 보고 조정을 요청할 수 있다.
  - **빌드**: `cd eobomDev/frontend && npm run build`(`tsc && vite build`) → 에러 0, 통과 (두 변경 각각 별도로 빌드 확인).
  - **실기동**: 하지 않음(사람 몫, 2026-09-03 지시). 특히 이번 2번 항목(가로 스크롤)은 실제 좁은 창에서 스크롤바가 자연스럽게 나타나는지, Header(`position:sticky`)·Sidebar(`position:fixed`)가 콘텐츠와 시각적으로 어색하지 않은지 실제로 봐야 한다 — CSS 추론상으로는 문제없다고 판단했지만 브라우저 렌더링 확인은 못 했다.
- **편차**: 스펙 자체가 없어 "편차"라는 개념이 성립하지 않지만, 구현 중 판단이 필요했던 지점을 남긴다: (a) 관리 모드 레이아웃을 `maxWidth:520px` 중앙 정렬 단일 컬럼으로 정했다(사용자가 구체적 폭을 지정하지 않음) — 데스크톱에서 기존 2열보다 좁아 보일 수 있다. (b) "수정" 버튼 문구·위치(미리보기 카드 바로 아래, 공유 패널 위)는 사용자가 지정하지 않아 임의로 정했다. (c) `.container` 최소폭 `1024px`도 임의값.
- **다음 에이전트가 알아야 할 것**: 이 두 변경 모두 docs/에 근거 문서가 없다 — Opus가 필요하다고 판단하면 00-38 또는 부고장 관련 스펙 문서(07-03)에 사후 반영을 검토할 수 있다(강제 아님). 사람이 실기동에서 (a)(b)(c) 임의값에 대해 다른 지시를 주면 그에 맞춰 조정할 것.

<!-- Gemini 판정 1줄: … -->


## 2026-09-09 | wt179 정정 — 관리 모드 레이아웃을 2열(좌:미리보기+수정, 우:공유)로 변경

- **근거 스펙**: 스펙 없음 — 즉흥구현(wt179 직후 사람이 레이아웃을 직접 정정: "미리보기와 수정(왼쪽) 공유(오른쪽)으로 구성해줘").
- **건드린 파일**: `eobomDev/frontend/src/pages/ObituaryPage.tsx`
- **결과**: wt179에서 관리 모드를 `maxWidth:520px` 중앙 정렬 단일 컬럼(미리보기→수정버튼→공유패널 세로 스택)으로 짰던 것을, 기존 `.auto-grid` 2열로 되돌리되 좌/우 내용을 바꿨다 — **왼쪽**: `previewCard` + "부고장 정보 수정" 버튼(세로 스택), **오른쪽**: `managePanel`(공유/종료). 데스크톱은 2열 나란히, 모바일은 `.auto-grid`가 자동으로 1열 스택(왼쪽 블록이 먼저, 오른쪽이 다음 — DOM 순서 그대로). 수정 버튼→모달 방식(`isEditOpen`)은 그대로 유지, 레이아웃 컨테이너만 교체.
  - **빌드**: `npm run build` → 에러 0, 통과.
  - **실기동**: 안 함(사람 몫).
- **편차**: 없음(사람이 직접 준 배치 지시를 그대로 반영).
- **다음 에이전트가 알아야 할 것**: wt179 항목의 "관리 모드 레이아웃"에 대한 서술(단일 컬럼)은 이 정정으로 대체됐다 — 이 항목이 최신 상태다.

<!-- Gemini 판정 1줄: … -->


## 2026-09-09 | wt179 정정2 — 카카오톡 카드 미리보기를 실제 스크린샷에 맞춰 수정

- **근거 스펙**: 스펙 없음 — 즉흥구현. 사람이 실제 카카오톡 카드 스크린샷을 `assets/obituary_card.png`로 제공하고 미리보기 불일치 수정을 요청.
- **건드린 파일**: `eobomDev/frontend/src/pages/ObituaryPage.tsx`
- **결과**: `assets/obituary_card.png`(206×353px)를 PowerShell `System.Drawing`으로 픽셀 샘플링해 실측 후 `previewCard`를 재작성.
  - 실측값: 이미지 영역이 `height:120px·objectFit:cover`가 아니라 **거의 정사각형**(y=0~207/353, 크림색 배경 `rgb(240,234,224)`)이었다 — 기존 코드는 짧고 넓은 띠 모양으로 잘라 실제와 달랐다. → `aspectRatio:'1/1'` 컨테이너(배경 `#F0EAE0`) + `objectFit:cover`로 교체.
  - 실측: 제목은 진한 회색/검정에 가까움(`#1A2B4C` 남색이 아니었다) → `#1F2937`로, 설명 텍스트는 `--fs-body`가 아니라 더 작은 `--fs-caption`이 실제에 가까움.
  - **기존 코드에 아예 없던 요소 2개를 추가**: (1) 실측 `rgb(246,247,248)` 연회색 둥근 버튼 "부고장 보기"(x=5~195, 거의 풀폭). (2) 하단 출처 행 — "이어봄" 텍스트 + 아이콘(`<EobomLogo variant="symbol" height={16}>`) + 우측 `ChevronRight` 화살표, 위쪽 얇은 회색 보더로 버튼과 구분.
  - `lucide-react`에서 `ChevronRight` 추가 import, `EobomLogo` 컴포넌트 신규 import.
  - **빌드**: `npm run build` → 에러 0, 통과.
  - **실기동**: 안 함(사람 몫) — 이번엔 특히 시각적 비교라 사람이 직접 렌더 결과를 스크린샷과 다시 대조해줄 필요가 있다.
- **편차**: 없음(실제 이미지 픽셀 실측을 그대로 반영). 다만 픽셀 샘플링 기반 근사치라 폰트 굵기·정확한 컬러 hex·버튼 모서리 반경 등은 완전히 동일하지 않을 수 있다.
- **다음 에이전트가 알아야 할 것**: `cardTitle`/`cardDescription` 텍스트 생성 로직(`utils/obituaryCard.ts`)은 이미 실제 카드와 일치했다(예: "[부고] 故 홍길동 님", "빈소:.../발인:...") — 이번엔 미리보기 목업의 **스타일**만 고쳤다. 사람이 재확인 후 색상·간격 미세조정을 요청할 수 있다.

<!-- Gemini 판정 1줄: … -->


## 2026-09-09 | wt179 정정3 — 카드 폭 좁힘에 맞춰 배경·버튼 폭 조정

- **근거 스펙**: 스펙 없음 — 즉흥구현. 사람이 `previewCard`의 흰 카드 wrapper에 직접
  `width:'67%', minWidth:'220px', margin:'0 auto'`를 넣어 카톡 대화창 말풍선처럼 좁혔고(단,
  `minWidth`를 `minwidth`로 오타 — 이번에 같이 고침), "다른 부분도 맞춰라 + 배경색은 알아서
  정해라"를 요청.
- **건드린 파일**: `eobomDev/frontend/src/pages/ObituaryPage.tsx`
- **결과**:
  1. `minwidth` → `minWidth` 오타 수정(React 인라인 스타일 camelCase 규칙).
  2. `previewCard` 바깥 wrapper 배경을 `#1A2B4C`(남색)→`#D9D4CB`(연한 웜그레이·베이지)로 교체 —
     좁아진 흰 카드가 양옆에 넓은 배경을 두고 "떠 있는" 모양이 됐는데, 남색은 카톡 대화창
     바탕으로 어색해서 카톡 대화창에 가까운 중성 톤으로 바꿨다(정확한 카톡 색 고증은 아님,
     "알아서" 요청에 따른 톤 선택). 텍스트색도 `#FFFFFF`/`#94A3B8`(어두운 배경용)에서
     `var(--text-main)`/`var(--text-muted)`(밝은 배경용)로 맞춰 바꿈. 흰 카드에 살짝
     `box-shadow`를 추가해 옅어진 배경 대비 "카드가 떠 있는" 느낌을 유지.
  3. 관리 모드에서 `previewCard` 바로 아래 "부고장 정보 수정" 버튼도 같은
     `width:'67%', minWidth:'220px', margin:'0 auto'`로 맞춰 폭을 통일.
  4. `ObituaryManageSkeleton`(로딩 스켈레톤)의 자리표시 박스도 배경 `#D9D4CB`·내부 블록
     `width:'67%'/minWidth:'220px'/margin:'0 auto'`로 맞춰, 로딩→실제 전환 시 색·폭이 안 튀게 함.
  - **빌드**: `npm run build` → 에러 0, 통과.
  - **실기동**: 안 함(사람 몫).
- **편차**: 없음(사람 지시 그대로 반영 + 배경색은 위임받은 재량 선택).
- **다음 에이전트가 알아야 할 것**: 배경색 `#D9D4CB`는 근거 문서 없는 재량 선택이다 — 사람이 다른 색을 원하면 바로 바꿀 것. 흰 카드 폭(`67%`/`220px`)은 사람이 직접 정한 값이라 그대로 유지.

<!-- Gemini 판정 1줄: … -->


## 2026-09-09 | wt179 정정4 — 배경색 확정(쿨톤 대안) + 미리보기·공유 섹션 최대폭 축소

- **근거 스펙**: 스펙 없음 — 즉흥구현. 배경색 시안 아티팩트(https://claude.ai/code/artifact/233d3558-9c55-43bc-b606-f2676e29bfac)에서 사람이 "쿨톤 대안"(#DCE3E8)을 선택하고, 미리보기·공유 두 섹션이 데스크톱 넓은 화면에서 너무 넓다며 축소 지시.
- **건드린 파일**: `eobomDev/frontend/src/pages/ObituaryPage.tsx`
- **결과**:
  1. `previewCard` 배경 `#D9D4CB`→`#DCE3E8`(쿨톤 대안, 확정).
  2. `previewCard`·"부고장 정보 수정" 버튼·`managePanel`(공유 섹션) 셋 다 `maxWidth:'420px', margin:'0 auto'` 추가 — `.auto-grid` 컬럼 자체가 넓은 데스크톱에서 무한정 늘어나던 것을 통일된 420px로 캡. 버튼은 기존 `width:67%/minWidth:220px`에 `maxWidth:420px`를 더해 `min(67% of 컬럼, 420px)`로 동작.
  3. `ObituaryManageSkeleton`(로딩 자리표시)도 배경 `#DCE3E8`·`maxWidth:420px`로 맞춤(양쪽 자리 모두).
  - **빌드**: `npm run build` → 에러 0, 통과.
  - **실기동**: 안 함(사람 몫).
- **편차**: 없음(사람 지시·아티팩트 선택 그대로 반영).
- **다음 에이전트가 알아야 할 것**: `420px`는 두 섹션을 시각적으로 맞추기 위해 이번에 새로 정한 값(근거 문서 없음) — 사람이 다르게 원하면 바로 조정.

<!-- Gemini 판정 1줄: … -->


## 2026-09-09 | wt179 정정5 — 미리보기 카드 왼쪽 정렬(카톡 수신 느낌)·섹션 360px·섹션간 여백 축소

- **근거 스펙**: 스펙 없음 — 즉흥구현. 사람 지시: "카드 섹션의 카드를 카톡 온 것처럼 왼쪽에 붙이고 섹션을 360px로 구성. 섹션간의 margin 줄이기."
- **건드린 파일**: `eobomDev/frontend/src/pages/ObituaryPage.tsx`
- **결과**:
  1. `previewCard` 흰 카드: `margin:'0 auto'`(가운데)→`margin:'0'`(왼쪽 고정) — 카톡 수신 메시지처럼 섹션 왼쪽에 붙음.
  2. `previewCard` 섹션 자체: `maxWidth:420px`→`360px`(섹션의 가운데 정렬은 유지 — 좁아진 건 섹션 크기, 왼쪽 붙임은 그 안의 카드).
  3. "부고장 정보 수정" 버튼: `maxWidth:420px`→`360px`, `margin:'0 auto'`→`margin:'0'`(카드와 같은 왼쪽 정렬로 통일).
  4. 간격 축소: 미리보기-버튼 사이(`flex gap`) `1.25rem`→`0.75rem`, 좌(미리보기+버튼)·우(공유) 두 컬럼 사이(`.auto-grid` gap, 인라인으로 오버라이드) 기본값→`1rem`.
  5. `ObituaryManageSkeleton`(로딩 자리표시)도 같은 폭(360px)·왼쪽 정렬·좁은 간격(0.75rem)으로 맞춤.
  - **건드리지 않은 것**: `managePanel`(공유 섹션)은 이번 지시에 폭 언급이 없어 기존 `maxWidth:420px`·가운데 정렬 그대로 뒀다 — 코드 주석에 이유를 남겨뒀다.
  - **빌드**: `npm run build` → 에러 0, 통과.
  - **실기동**: 안 함(사람 몫).
- **편차**: 없음(지시 그대로, 다만 "섹션간 margin"을 두 곳(미리보기↔버튼 flex gap, 좌우 grid gap)으로 해석해 둘 다 줄였다 — 구체적으로 어느 gap인지 명시되지 않아 판단이 들어간 지점).
- **다음 에이전트가 알아야 할 것**: 공유 섹션(420px·중앙정렬)과 미리보기 섹션(360px·왼쪽정렬)이 이제 서로 다른 폭·정렬 규칙을 쓴다 — 의도된 상태(사람이 미리보기만 지목)이지 실수가 아니다.

<!-- Gemini 판정 1줄: … -->


## 2026-09-09 | wt179 정정6 — 카드 폭 +20%, 공유 섹션 버튼·폰트 축소

- **근거 스펙**: 스펙 없음 — 즉흥구현. 사람 지시: "카드의 넓이는 20%정도 더 늘려줘, 그리고 공유 섹션의 버튼 및 내부 폰트를 섹션넓이 크기가 줄어든 만큼 줄여야함."
- **건드린 파일**: `eobomDev/frontend/src/pages/ObituaryPage.tsx`
- **결과**:
  1. `previewCard` 흰 카드 폭 `67%`→`80%`(20%↑, 67×1.2≈80.4를 반올림).
  2. `managePanel`(공유 섹션) 전체: 본문 텍스트 `fontSize:'var(--fs-body)'`(16px)→`'var(--fs-caption)'`(14px) 전수 교체(약 10곳: 종료 안내·경고 배너·추모관 링크 2곳·복사 피드백·URL 표시·최종수정일·종료 경고문), `h3` "부고장 공유" 제목 `1.05rem`→`0.95rem`. 버튼류(`className="btn"` 7곳: 새 부고장 작성·추모관 만들기 2곳·카카오톡 공유·링크 복사·문자 보내기·부고장 종료) 전부 `fontSize:'var(--fs-caption)', padding:'0 1.2rem'` 추가(기존 `.btn` 기본 1.1rem/1.8rem 패딩 대비 축소).
  - **의도적으로 손대지 않은 것**: 버튼 `height`(`.btn`의 `var(--min-touch-target)`) — 접근성 터치 타깃 규정이라 폭·글자만 줄이고 높이는 그대로 뒀다. "섹션 폭이 줄어든 비율"을 정확히 역산할 근거가 없어(그리드 컬럼이 유동폭이었어서 "줄기 전" 폭을 알 수 없음), 디자인 시스템 두 단계 타입 스케일(`--fs-body`→`--fs-caption`, 정확히 12.5%↓)과 버튼 패딩 축소(1.8rem→1.2rem, 33%↓)로 "체감상 확실히 좁아진 만큼" 줄이는 방식으로 판단해 처리했다.
  - **빌드**: `npm run build` → 에러 0, 통과.
  - **실기동**: 안 함(사람 몫).
- **편차**: "섹션 폭이 줄어든 만큼"을 정확한 비율로 역산하지 못해 판단이 들어갔다(위 설명 참고). 사람이 보고 더/덜 줄이라고 하면 조정.
- **다음 에이전트가 알아야 할 것**: 없음.

<!-- Gemini 판정 1줄: … -->


## 2026-09-09 | wt179 정정7 — 카드 섹션 +20%, 간격 버그 원인 진단·수정, 수정 버튼 시인성 확보

- **근거 스펙**: 스펙 없음 — 즉흥구현. 사람 지시: "'카드 섹션만' 20%정도 전체 넓이 늘린다. 미리보기와 공유 사이 간격이 여전히 너무 넓은데 문제 파악하고 좁힌다. 부고장 정보 수정 버튼이 버튼처럼 보이도록 조치한다."
- **건드린 파일**: `eobomDev/frontend/src/pages/ObituaryPage.tsx`
- **결과**:
  1. **미리보기 섹션 폭 +20%**: `previewCard`·수정 버튼 `maxWidth` `360→432px`(공유 섹션 `managePanel`은 지시대로 그대로 420px).
  2. **간격 버그 원인 진단**: 직전 시도(auto-grid의 `gap`을 1rem으로 줄임)가 안 먹힌 이유 — `.auto-grid`는 컬럼을 `1fr`로 늘려 꽉 채우는 그리드라(`00-29`§6.1), `00-38`에서 `.container`에 `min-width:1024px`을 넣은 뒤로 각 그리드 컬럼이 콘텐츠(432px/420px)보다 훨씬 넓어졌다. 그 안에서 `previewCard`·`managePanel`을 `margin:'0 auto'`로 "컬럼 중앙 정렬" 해뒀던 탓에, 두 콘텐츠 사이에 **(컬럼 여유폭×2 + grid gap)**만큼의 여백이 생겼다 — `gap` 값 자체를 줄여도 컬럼 안쪽 여백은 그대로라 체감 차이가 없었던 것.
     - **수정**: 바깥 레이아웃을 `.auto-grid`(1fr 스트레치 그리드)에서 `display:'flex', flexWrap:'wrap', gap:'1rem'`로 교체 — 각 섹션이 콘텐츠 폭만큼만(`flex:'0 1 432px'` / `flex:'0 1 420px'`) 차지하고, 남는 공간은 줄 끝(오른쪽)으로 밀려나 두 섹션 사이엔 정확히 `gap`(1rem)만 남는다. `managePanel`의 `margin:'0 auto'`·`width:'100%'`(그리드 중앙정렬·꽉채우기용, flex에서는 오히려 전체 줄을 독점해버려 옆에 못 붙는 부작용을 냄)도 제거했다.
     - 768px 이하에서는 두 섹션 폭 합(432+420+16=868)이 뷰포트를 넘어 `flex-wrap`이 자동으로 줄바꿈(세로 스택)한다 — 기존 `.auto-grid`가 하던 모바일 반응형 역할을 그대로 유지.
  3. **수정 버튼이 버튼처럼 안 보이는 문제**: 배경색 `var(--secondary-color)`(#FBF9F5)가 `body`의 페이지 배경색과 완전히 같은 색이라(`index.css` `body{background-color:var(--secondary-color)}`), 버튼이 페이지에 녹아 들어 경계가 안 보였다. → 흰 배경(`var(--card-bg)`) + 테두리(`1px solid var(--border-color)`) + 그림자(`var(--box-shadow)`)로 교체해 카드처럼 도드라지게 했다.
  - **빌드**: `npm run build` → 에러 0, 통과.
  - **실기동**: 안 함(사람 몫) — 특히 이번 flex-wrap 교체는 실제 좁은 창에서 줄바꿈이 자연스러운지 확인 필요.
- **편차**: 없음.
- **다음 에이전트가 알아야 할 것**: `.auto-grid`(1fr 스트레치 그리드)는 "컨텐츠를 컬럼 폭 안에서 고정폭으로 두고 싶은" 레이아웃에는 안 맞는다 — 이번처럼 그리드 컬럼보다 좁은 고정폭 콘텐츠를 나란히 붙이고 싶으면 flex-wrap을 쓸 것. 이 교훈은 다른 `.auto-grid` 사용처(예: CareGuidePage, MemorialPage 등)에서 비슷한 "간격이 안 줄어든다" 문제가 나오면 참고.

<!-- Gemini 판정 1줄: … -->


## 2026-09-09 | wt179 정정8 — 두 섹션 그룹 가운데 정렬, 버튼 디자인 개선, 가로 스크롤 버그 수정

- **근거 스펙**: 스펙 없음 — 즉흥구현. 사람 지시: "두 섹션을 담는 div 가운데 정렬 필요. 수정 버튼 너무 인위적, 디자인 요소 추가. 종전에 구현한 일정 넓이 이하에서의 좌우 스크롤 구현 안됨."
- **건드린 파일**: `eobomDev/frontend/src/pages/ObituaryPage.tsx`, `eobomDev/frontend/src/index.css`
- **결과**:
  1. **두 섹션 그룹 가운데 정렬**: 직전 정정에서 `.auto-grid`→flex-wrap으로 바꾸며 그룹 자체가 `justify-content` 기본값(`flex-start`)이라 왼쪽에 붙어 있었다. `justifyContent:'center'` 추가.
  2. **수정 버튼 디자인**: 흰 배경+회색 테두리가 "인위적"이라는 지적 — 브랜드 포인트 컬러(`--point-color`, 웜그린) 계열의 옅은 세이지(`#E3E8E1`, 배경색 시안 탐색 때 나왔던 "브랜드 포인트 계열" 옵션 재사용)로 교체, 텍스트·아이콘도 `--point-color`로, 굵게(`fontWeight:700`). 카드 섹션(`#DCE3E8`)과 톤이 이어지면서도 브랜드 포인트 컬러로 "의도된 버튼"처럼 보이게 했다.
  3. **가로 스크롤 미작동 — 원인 진단 및 수정(`index.css`, 사이트 전역)**: `body`→`#root`→(App 루트 div)→`.main-wrapper`→`main`이 전부 `display:flex(column)`으로 겹겹이 쌓여 있는데, 플렉스 아이템의 "자동 최소 크기"(`min-width:auto` 기본값)가 자식의 `min-content`를 그대로 물려받는다 — `.container`의 `min-width:1024px`가 `main`→`.main-wrapper`→그 위 조상들로 계속 위로 전파돼, `.main-wrapper`가 `overflow-x:auto`로 실제로 가두기도 전에 그 바깥(결국 `body`/`html`)까지 통째로 1024px+로 늘어나 버렸다. 그래서 `.main-wrapper` 안에 갇힌 스크롤이 아니라 페이지 전체가 밀리거나 아무 변화도 안 보이는 것처럼 됐던 것 — `min-width:1024px` 자체(→00-38 §4.1 근처 규칙)나 `overflow-x:auto` 선언 자체는 문법상 문제 없었다. → `.main-wrapper`·`.main-wrapper > main` 양쪽에 `min-width:0`을 추가해 이 전파를 차단.
  - **빌드**: `npm run build` → 에러 0, 통과.
  - **실기동**: 안 함(사람 몫). 🔴 특히 3번(가로 스크롤)은 CSS 이론적 분석으로 도출한 수정이라 — 실제 좁은 창에서 `.main-wrapper`에 스크롤바가 뜨는지, Header·Sidebar는 그대로 있고 본문만 스크롤되는지 실기동 확인이 꼭 필요하다.
- **편차**: 없음.
- **다음 에이전트가 알아야 할 것**: 3번 수정은 `.container`를 쓰는 모든 소비자 페이지에 영향을 준다(사이트 전역 CSS) — ObituaryPage 외 다른 페이지에서도 실기동 시 함께 확인할 것. 만약 `min-width:0` 추가로도 여전히 안 되면, 다음으로 의심할 지점은 `.main-wrapper`에 명시적 `width: calc(100vw - 72px)`(사이드바 폭 제외) 같은 뷰포트 기준 고정폭을 직접 주는 방법이다(이번엔 min-width:0으로 자동전파를 끊는 더 가벼운 수정을 먼저 시도함).

<!-- Gemini 판정 1줄: … -->


## 2026-09-09 | wt179 정정9 — 수정 버튼 아이콘 칩 확정+호버 확장, 가로 스크롤 실제 원인 재발견·수정

- **근거 스펙**: 스펙 없음 — 즉흥구현. 사람이 버튼 크기 시안(https://claude.ai/code/artifact/67bd9670-095a-40b0-a64e-69f965d6c54a) 중 "아이콘 칩"을 선택, 이어서 "마우스오버 시 수정하기 글자가 가로로 펼쳐지며 표시" 요청. 별도로 "가로 스크롤 해결이 안 되는 것 같다"며 실제 스크린샷(`assets/scroll.png`, `/facility` 861px 창)을 제공.
- **건드린 파일**: `eobomDev/frontend/src/pages/ObituaryPage.tsx`, `eobomDev/frontend/src/index.css`
- **결과**:
  1. **수정 버튼 → 아이콘 칩**: 카드 아래 별도 버튼(67%/432px 가로폭)을 없애고, `previewCard`의 흰 카드 우상단에 40×40px 원형 아이콘 버튼으로 이동(`position:absolute`, 카드에 `position:relative` 추가). `previewCard`가 작성 모드에서도 재사용되므로 `{obituaryRef && (...)}`로 감싸 관리 모드에서만 뜨게 했다. 🔴 40px는 이 프로젝트 접근성 기준(`--min-touch-target:56px`) 미만 — 시안에서 경고 표시 후 사용자가 명시적으로 선택.
  2. **호버 확장 라벨**: `.obituary-edit-chip` 클래스 신설(`index.css`) — 기본 40px 원형, `:hover`/`:focus-visible`에서 128px 알약형으로 폭이 전환되며 내부 `.chip-label`("수정하기")이 `max-width`+`opacity` 트랜지션으로 나타난다. `width:auto`는 브라우저가 트랜지션을 보간 못 해 고정폭(128px)으로 설계했다. `prefers-reduced-motion` 대응 포함.
  3. **가로 스크롤 — 진짜 원인 재발견**: 사람이 준 스크린샷(`/facility`, 861px 창)에서 확인됨 — 콘텐츠(필터 드롭다운)가 창 오른쪽 끝에서 스크롤 없이 그냥 잘려 있었다. 지난 수정(`min-width:0`)은 "왜 전파되는지"는 맞게 짚었지만, 그 수정 이후에도 스크롤바가 안 보였던 **두 번째 원인**을 놓쳤다: `.main-wrapper`는 `min-height`만 있고 `height`가 없어서 페이지 콘텐츠 길이만큼 계속 자라는 박스였다 — `overflow-x:auto`인 요소의 가로 스크롤바는 그 요소의 **바닥**에 붙는데, 그 바닥이 페이지 맨 아래(수천 px 아래)에 있어 화면에는 사실상 닿을 수 없는 위치에 스크롤바가 존재했던 것이다(그래서 스크롤이 "없는 것처럼" 보였다).
     - **수정**: `@media (min-width:769px)` 안에서 `.main-wrapper`를 `min-height` 대신 `height: calc(100vh - var(--header-h))`로 캡하고 `overflow-y: auto`를 명시 추가 — `.main-wrapper` 자체가 "헤더 아래 화면 전체"를 차지하는 스크롤 패널이 되어, 가로·세로 스크롤바 둘 다 항상 화면 안(패널 우측 끝·하단)에 있게 된다. 페이지 내 `position:sticky` 요소(EndingNote 목차 등)는 가장 가까운 스크롤 조상 기준으로 붙는데, 이 패널이 정확히 "헤더 아래 화면 전체"라 기존과 시각적으로 동일하게 동작할 것으로 판단(이론적 분석, 실측은 아님).
  - **빌드**: `npm run build` → 에러 0, 통과.
  - **실기동**: 안 함(사람 몫). 🔴 가로 스크롤은 이번이 두 번째 시도라 **반드시 실기동으로 재확인 필요** — 특히 (a) `/facility`를 861px 정도로 좁혀 스크롤바가 화면 안에 보이는지, (b) 세로 스크롤(페이지를 아래로 내리는 것)이 이제 `.main-wrapper` 내부 스크롤로 바뀌었는데 브라우저 주소창 자동 숨김 등 다른 상호작용과 안 부딪히는지, (c) EndingNote 목차 같은 sticky 요소가 여전히 잘 붙는지.
- **편차**: 없음.
- **다음 에이전트가 알아야 할 것**: 가로 스크롤 기능이 벌써 두 번 실패했다 — 이번에도 실기동에서 안 되면, `.main-wrapper`를 뷰포트 높이로 캡하는 접근 자체를 재고하고(예: Header까지 포함한 더 바깥쪽 래퍼에 스크롤을 주거나, `.container` min-width를 아예 포기하는 대안) 사람과 다시 상의할 것.

<!-- Gemini 판정 1줄: … -->


## 2026-09-09 | wt179 정정10 — 가로 스크롤 실기동 통과(임계값 조정) + 수정 칩 패딩 축소

- **근거 스펙**: 스펙 없음 — 즉흥구현. 사람이 `/facility`에서 가로 스크롤 실기동 통과를 확인, "걸리는 최소폭을 조금 더 크게" 요청 + 펼쳐진 수정 버튼 좌우 여백이 크다는 지적.
- **건드린 파일**: `eobomDev/frontend/src/index.css`
- **결과**:
  1. `.main-wrapper .container`의 `min-width` `1024→1200px`.
  2. `.obituary-edit-chip:hover` 폭 `128→104px`, 좌우 패딩 축소(우 0.9rem→0.55rem·좌 0.75rem→0.6rem), 라벨 `margin-left` `0.4rem→0.3rem`.
  - **빌드**: `npm run build` → 에러 0, 통과.
  - **실기동**: 🔵 **가로 스크롤 기능 자체는 `/facility`에서 실기동 통과 확인됨**(사람 확인, wt179 정정9의 `.main-wrapper` 높이 캡 수정이 유효했다). 이번 임계값·패딩 조정분은 아직 실기동 전.
- **참고(질문에 대한 답, 코드 변경 아님)**: 사람이 "메인페이지(홈)는 가로 스크롤이 작동 안 하는데 의도된 것인가"라고 물음 — **의도된 것이다.** `.main-wrapper .container`로 스코프한 규칙인데, `HomePage`·`prep`·`bereaved`(`DomainOverviewPage`)는 `.container`를 아예 안 쓰고 `.fullpage-viewport`/`.domain-overview-viewport`(풀블리드 스냅스크롤 히어로 레이아웃)를 쓴다 — 원래부터 화면 폭을 꽉 채우는 다른 설계라 이 규칙 대상이 아니다. 사람이 그쪽에도 같은 보호를 원하면 별도 작업(다른 클래스 대상)이 필요하다고 답함.
- **편차**: 없음.
- **다음 에이전트가 알아야 할 것**: 홈/생전준비/임종정리 3개 화면에 같은 "최소폭+가로스크롤"을 원하면 `.fullpage-viewport`/`.domain-overview-viewport` 쪽에 별도로 검토해야 한다 — 지금까지는 요청 없음.

<!-- Gemini 판정 1줄: … -->


## 2026-09-09 | wt180 — 명조체(--font-serif) 사용처 정리, 00-09 §6.3 규칙1 적용

- **근거 스펙**: `docs/00_핵심플랫폼/00-09_디자인_시스템_및_스타일_가이드.md` §6.3 크래프트 규칙 1("명조는 화면 제목(--fs-title·--fs-display)에만, 본문은 산세리프") · §6.5(`.section-title` 프리미티브 계획). 사람이 "유족메시지 보관함 이름·편지 등의 궁서체 같은 폰트가 통일감 없어 보인다"고 지적 → 분석 후 "규칙대로 정리해줘" 승인받아 진행.
- **건드린 파일**: `eobomDev/frontend/src/index.css`, `eobomDev/frontend/src/pages/HomePage.tsx`, `.../DomainOverviewPage.tsx`, `.../FamilyInvitePage.tsx`, `.../MemorialLandingPage.tsx`, `.../ObituaryLandingPage.tsx`, `.../CareGuidePage.tsx`, `eobomDev/frontend/src/components/home/EntryBoxes.tsx`, `.../FarewellMessageCard.tsx`
- **결과**: 전체 13곳(9개 파일)을 실측(폰트 크기 vs `--fs-title`/`--fs-display` 22px+ 기준)으로 판정해 둘로 나눴다.
  1. **`.section-title` 프리미티브 신설**(`index.css`, `font-family: var(--font-serif)` 한 줄) — 00-09 §6.5가 이름만 정해두고 안 만들었던 클래스. 명조체를 쓰는 유일한 통로로 만들었다.
  2. **명조체 유지 + 토큰/클래스로 통일(9곳, 전부 22px 이상 제목급)**: `HomePage.tsx` 히어로 h1·섹션 h2, `EntryBoxes.tsx` "어떤 도움이 필요하신가요?" h2, `DomainOverviewPage.tsx` 인트로 타이틀(`.domain-overview-intro-title`, CSS)·섹션 h2(인라인), `FamilyInvitePage.tsx`·`MemorialLandingPage.tsx`·`ObituaryLandingPage.tsx`의 페이지 h1, `FarewellMessageCard.tsx`의 "OOO님께 남기는 글"(22.4px, 카드 헤더). 전부 하드코딩 폰트 문자열(파일마다 fallback 체인이 미묘하게 다름 — 드리프트)을 지우고 `.section-title` 클래스(또는 이미 있던 CSS 클래스는 `var(--font-serif)` 토큰)로 교체했다.
  3. **명조체 제거(4곳, 전부 제목이 아닌 이름·라벨급)**: `.farewell-message-item`·`.farewell-board-avatar`(아바타 이니셜)·`.farewell-board-recipient-name`·`.farewell-mobile-back`(index.css) + `FarewellMessageCard.tsx`의 편지 작성 모달 "OOO님께" 이글brow(16px)·`CareGuidePage.tsx` 아코디언 섹션 라벨(20px, `--fs-section`이라 22px 기준 미달). 전부 `font-family` 선언을 지워 body 기본 고딕을 상속받게 했다 — 사람이 지적한 "유족메시지 이름"이 정확히 여기 포함된다.
  - **손대지 않은 것**: `EobomLogo.tsx`의 "이어봄" 워드마크 텍스트(명조 스타일이 브랜드 로고 자체의 의도된 디자인, 코드 주석에 이미 명시돼 있음) — 화면 제목이 아니라 로고라 이번 규칙 대상이 아니다.
  - **빌드**: `npm run build` → 에러 0, 통과. `grep -rn "KoPub World Batang"` 최종 확인 — 토큰 선언 1곳 + `EobomLogo.tsx`(의도적 예외) 1곳만 남고 나머지 전부 토큰/클래스 경유로 정리됨.
  - **실기동**: 안 함(사람 몫) — 특히 폰트가 사라진 4곳(유족메시지 이름·아바타·편지 모달 라벨·CareGuide 섹션 라벨)이 시각적으로 자연스러운지 확인 필요.
- **편차**: 없음 — 다만 경계선 판정 2곳을 기록해 둔다. (a) `FamilyInvitePage.tsx` h1은 1.3rem(20.8px)로 `--fs-title` 기준(22px)에 살짝 못 미치지만, 다른 두 랜딩페이지 h1과 같은 역할(공유 링크 페이지 제목)이라 명조 유지로 판정. (b) `FarewellMessageCard.tsx`의 "OOO님께 남기는 글"(22.4px)은 이름을 포함하지만 크기 기준상 제목급이라 유지 — "이름엔 무조건 명조 금지"가 아니라 "크기 기준"으로 판정했다.
- **다음 에이전트가 알아야 할 것**: 앞으로 명조체가 필요하면 `className="section-title"`을 쓸 것 — 새 하드코딩 문자열을 또 만들면 이번 정리가 무의미해진다(00-09 §6.4 P-5 드리프트 훅이 아직 없어 코드 리뷰로만 막을 수 있음).

<!-- Gemini 판정 1줄: … -->


## 2026-09-09 | wt181 [Claude:Opus] wt179 백필 + `07-04` §8 #6 확정(F단계 차단 해제) + `deadlineShort` 전수

- **근거 스펙**: `docs/00_핵심플랫폼/00-38_적응형_모바일_UX_개편_명세서.md` · `docs/07_상중_행정_케어/07-04_상중_행정_가이드_재설계_검토서.md` §8 #6·§3.4-1·§8-7-4·§8-8-4 · `docs/07_상중_행정_케어/07-02_사망후_법정기한_체크리스트_명세서.md` §2 · `docs/00_핵심플랫폼/00-19_개인정보처리방침_초안.md` 제4조
- **건드린 파일**: `docs/00_핵심플랫폼/00-38_적응형_모바일_UX_개편_명세서.md` · `docs/00_핵심플랫폼/00-19_개인정보처리방침_초안.md` · `docs/07_상중_행정_케어/07-02_사망후_법정기한_체크리스트_명세서.md` · `docs/07_상중_행정_케어/07-04_상중_행정_가이드_재설계_검토서.md` · `docs/00_DOCS_INDEX.md` · `docs/00_DOCS_INDEX_상세.md` · `.harness/memory/context.md` (🔴 `eobomDev/` 무변경 — Opus 세션)
- **결과**: 세 갈래.
  ① **wt179·180 백필** — `00-38`에 **§6.4-1 신설**(`@media(min-width:769px)`에서 `.main-wrapper .container{min-width:1200px}` + `.main-wrapper{height:calc(100vh - var(--header-h)); overflow-x:auto; overflow-y:auto; min-width:0}` + `.main-wrapper>main{min-width:0}`, 운영자 3화면은 `.main-wrapper` 미사용으로 자동 제외, 함정 2개=플렉스 자동 최소 크기 전파·스크롤바가 요소 바닥에 붙는 문제) · **§8.2-1 신설**(관리 모드 `flex-wrap` 2열 `flex:0 1 432px` + 420px·gap 1rem·`justifyContent:center`, `.auto-grid` 폐기 사유, 수정 칩 40→104px, 모달 560px, 카톡 카드 `#DCE3E8`·360px) · **Phase 1.8 신설**(H·I) · §6.5 ⓓ·§8 표·§8.2 행·§12.2 갱신. 🔵 코드 실측으로 확인한 값이며 `context.md`의 `1200px`와 일치(구 훅 주입본의 `1024`는 이미 갱신돼 있었음).
  ② **`07-04` §8 #6 확정 → 🔴 F단계 차단 해제** — 보유기간 `회원 탈퇴 시까지` · 운영자 열람 `불가`(장애 대응 시 개수만). §3.4-1·§8-7-4에 확정 블록 추가, `00-19` 제4조에 **⑨ 상중 행정 가이드 체크 상태 행** + §0 편집자 주 ⑨행 추가(게시 블로커 아님을 명시).
  ③ **`07-02` §2-1 신설** — `deadlineShort` **23건 전수**(`careGuideTasks.json` 실측 기준) + 축약 규칙 5개 + **원문 병기 필수 3건**(id 11·13·17) + ⓒ 표. §8-8-4의 최장 4건 표에서 **3건 정정**: id 9 `3개월`→**`3개월 권장`** · id 2 `24시간`→**`24시간 이후`**(최소 대기형이라 방향 보존) · id 22는 **숫자를 넣지 않고 `시효 있음`**(약관마다 달라 `3년`은 법적 오정보).
  검증: `bash .harness/tools/harness-doctor.sh` — **139항목 중 문제 4건 → 3건**(`context.md` 3117B→**3064B**/3072B 초과 해소). 남은 3건은 이 작업과 무관한 기존 결함(`memory/backlog.md` 11892B/10240B 116% 2항목 · `roles.md` 소유권 표가 가리키는 `eobom/` 경로 부재). 🔴 **빌드 없음 — 코드 무변경 세션**.
- **편차**: **없음.** 🔵 다만 성격을 바로잡았다 — `context.md`가 wt179를 *"스펙없음·즉흥구현"* 으로 적어 두어 `roles.md` §2-1 편차 절차 대상으로 보였으나, **사람이 UX 판단으로 직접 지시하고 `/facility` 실기동까지 확인한 확정 사항**이었다(사용자 확인, 09-09). 따라서 판정이 아니라 **정본 미기재의 기록**이며, `00-38` §6.4-1·§8.2-1 모두에 *"사람 지시였으므로 편차가 아니다"* 를 명시했다.
- **다음 에이전트가 알아야 할 것**:
  🔴 **`[Claude:Sonnet]` — Phase 2 ②`CareGuidePage`는 두 작업을 한 커밋에 묶는다**: `00-38` §8.1-2 적응형 분리 + `07-04` §8-8-5의 1·2(아코디언 제거 + 기한 배지 상시 노출). **같은 파일을 두 번 헤집지 않기 위한 것**이고, 배지에 넣을 값이 이번에 확정된 `07-02` §2-1이다.
  🔴 **`deadlineShort`는 `careGuideTasks.json`에 아직 없다** — 필드 추가는 구현 몫이다. **옵셔널**(없으면 `deadlineLabel` 표시)이라 UI와 데이터 채우기가 서로를 막지 않는다. 🔴 **id 11·13·17은 배지만 두면 안 되고 카드 2줄째에 원문을 함께 낸다.**
  🔵 **F단계(`CareGuideProgress`)가 열렸다** — 문서상 차단 항목 0. 착수 시 ① `checked:false` 행을 만들지 않는다(해제 = 삭제) ② `taskId`는 추가를 뒤에만, 기존 id 재사용 금지 ③ **운영자 화면·로그·에러 리포트에 체크 내용을 남기지 않는다**(개수만) — `00-19` 제4조 ⑨가 그렇게 나갔다.
  🟡 **`ObituaryPage` 수정 칩이 40px**로 `--min-touch-target`(56px) 미달이다. §4.5-5의 36px 3곳과 **함께 Phase 3**에서 처리하도록 §8.2-1에 적어 두었다 — 단독으로 고치지 말 것.
  🟡 **`00_DOCS_INDEX_상세.md`에 `00-36`·`00-37` 항목이 없다**(`00-38`은 이번에 신설). 별건 누락이며 다음 Opus 세션이 채울 것.
  🔴 **커밋은 사람이 한다** — 이 항목은 커밋 전 상태로 기록됐다.

<!-- Gemini 판정 1줄: ✅통과 / ❌반려(사유) / 🔄스펙갱신(고친 문서) -->

## 2026-09-09 | wt182 [Claude:Opus] 🔄 스펙갱신 — `07-03` §7-1 신설(문자보내기 모바일 전용)

- **근거 스펙**: `docs/07_상중_행정_케어/07-03_모바일_부고장_카카오톡_전송_구현_기획서.md` §7 폴백 사다리 4번 · §2.4-2 · `docs/00_핵심플랫폼/00-38_적응형_모바일_UX_개편_명세서.md` §5.1·§5.2
- **건드린 파일**: `docs/07_상중_행정_케어/07-03_모바일_부고장_카카오톡_전송_구현_기획서.md` · `docs/00_DOCS_INDEX.md` · `docs/00_DOCS_INDEX_상세.md` · `.harness/memory/context.md` (🔴 `eobomDev/` 무변경)
- **결과**: 편차 확인 요청(사용자, `context.md`)에 대한 판정 = **🔄 스펙갱신. 구현이 맞고 스펙이 빈칸이었다.**
  대조: `07-03` §7 표 4번 발동 조건이 `카톡을 안 쓰는 조문객용 보조 버튼` **뿐이고 플랫폼 조건이 없다** ↔ 구현 `ObituaryPage.tsx:749`가 `{isMobile && (<a href={buildObituarySmsHref(...)}>문자로 보내기</a>)}`로 **≤768px에서만** 렌더(`useIsMobile()` 기본값 768).
  조치: **§7-1 신설** — 4번에 `🔴 **모바일 전용**(≤768px)` 명시 + 판정 3행 표(핸들러 보장 불가 / §7 전제 위반 / §7 자신의 3번 설계와 일치) + §2.4-2 `카톡을 안 쓰는 조문객` 행에 *"유족이 모바일일 때만, PC에서는 링크 복사가 이 빈틈까지 맡는다"* 추가.
  🔴 **근거 문구를 정정해 적었다** — 코드 주석(`ObituaryPage.tsx:87`)은 *"데스크탑엔 핸들러가 없어"* 로 단정하지만 **macOS는 Messages.app이 `sms:`를 처리하므로 Mac에서는 열린다.** 사실은 *"없다"* 가 아니라 **"있다고 보장할 수 없다"** 이며, Windows에 기본 핸들러가 없고 국내 데스크톱 구성상 그쪽 비중이 압도적이라 **결론은 동일**하다.
  🟡 **알려진 대가 명기** — 태블릿(769~1024px)에서 iPad는 `sms:`가 실제로 되는데 버튼이 숨는다. `00-38` §5.2(*"훅으로 통일하되 값은 바꾸지 않는다"*)를 깨지 않기 위해 **별도 브레이크포인트를 두지 않는다**(1순위 카카오 공유·3순위 링크 복사가 태블릿에서 정상 동작해 막히는 유족이 없음).
  부수 확인: `useIsMobile.ts`는 `00-38` §5.1 준수(기본 768 = `index.css` 지배 브레이크포인트·lazy initializer·구형 iOS `addListener` 폴백). `buildObituarySmsHref` 사용처는 **`ObituaryPage.tsx` 한 곳뿐**이라 다른 화면에 같은 편차가 없다. 🔴 **빌드 없음 — 코드 무변경 세션.**
- **편차**: **없음**(이 항목 자체가 편차 판정이다). 🔵 `[Claude:Sonnet]`의 재작업은 없다 — 코드가 정본이 됐다. 🟡 다만 위 코드 주석 문구는 그 파일을 다음에 만질 때 §7-1에 맞춰 고치면 된다(동작은 옳으므로 급하지 않고, 이것만을 위해 파일을 열지는 않는다).
- **다음 에이전트가 알아야 할 것**: 🟡 `07-03` §3.1·§3.2의 OG 논의(*"③링크 복사와 ④문자로 보내기로 나간 URL이 밋밋하게 뜬다"*)는 **이 변경과 무관**하다 — OG 셸이 붙으면 두 경로 모두 그대로 해결된다. 🔵 `07-03`은 Phase 1 기준 문서이고 §7-1은 조건 명문화일 뿐이라 **Phase 순서·차단 항목에 변화 없음**.

<!-- Gemini 판정 1줄: ✅통과 / ❌반려(사유) / 🔄스펙갱신(고친 문서) -->

## 2026-09-09 | wt183 [Claude:Sonnet] Phase 2 ② `CareGuidePage` 적응형 분리 + `07-04` §8-8-5 1·2 + `deadlineShort` 배선

- **근거 스펙**: `docs/00_핵심플랫폼/00-38_적응형_모바일_UX_개편_명세서.md` §8.1-2·§8.1-3·§9 · `docs/07_상중_행정_케어/07-04_상중_행정_가이드_재설계_검토서.md` §8-8-2·§8-8-4·§8-8-5(권고순서 1·2) · `docs/07_상중_행정_케어/07-02_사망후_법정기한_체크리스트_명세서.md` §2-1(ⓑ 전수표·ⓒ 원문병기 3건)
- **건드린 파일**: `eobomDev/frontend/src/pages/CareGuidePage.tsx` · `eobomDev/frontend/src/mockData/careGuideTasks.json`(🔵 이미 커밋됨 — 편차① 참고)
- **결과**:
  1) `careGuideTasks.json` 23건 전부에 `deadlineShort` 추가(`07-02` §2-1 ⓑ 표 값 그대로) + id 11·13·17에 `deadlineOriginalRequired: true` 추가.
  2) `CareGuidePage.tsx`에 `getBadgeText(t)`(`deadlineShort ?? deadlineLabel`)·`getNoteLine(t)`(원문병기 3건은 `deadlineLabel`을 `irreversibleNote`/`note` 앞에 `' · '`로 결합, 나머지 20건은 기존 그대로) 헬퍼를 추가하고 데스크톱 카드의 배지·2줄째 렌더를 이걸로 교체.
  3) `useIsMobile()`(768px, 기존 훅 재사용)로 분기. **데스크톱**은 기존 구간 접기·카테고리 박스 구조 그대로(배지/2줄째만 헬퍼로 교체). **모바일**은 신규 — ①상단 가로 스크롤 카테고리 칩(필터, "전체" 기본, `activeCategory` state) ②구간 접기 없이 제목+1px 구분선(month3만 ⭐ 유지, `07-04` §8-7-3) ③항목은 박스가 아니라 행(`role="checkbox"`, 히트 영역 전체 `min-height:var(--min-touch-target)`=56px, 체크박스 시각 20px `readOnly`, 액션 버튼/링크는 별도 `<div onClick={stopPropagation}>`, CRITICAL만 좌측 3px 색선 — `00-38` §9.2·§9.3 채택안 D).
  검증: `npx tsc --noEmit -p .`·`npm run build`(`eobomDev/frontend`) 둘 다 에러 0(그대로 실행 확인, 기존 vite 청크 크기 경고만 — 이 작업과 무관).
  **실기동**: 하지 않음 — **"실기동 검증 대기"**로 남긴다(사람 몫, 2026-09-03 지시). 확인할 것: 360px에서 칩 트랙 가로 스크롤·행 탭 토글·액션 버튼의 `stopPropagation` 분리, 768/769px 경계 뷰 전환.
- **편차**:
  ① `careGuideTasks.json`은 이번 세션 중 스크립트로 채웠는데, 사람의 커밋 `a3fd81e`(`07-03` §7-1 스펙갱신 커밋)에 함께 실려 **이미 커밋돼 있다** — 작업 도중 `git add -A`류로 같이 쓸린 것으로 보인다. `CareGuidePage.tsx`만 아직 미커밋. 사람 확인 필요.
  ② 배지에 `deadlineBase`(`· OO 기준`) 접미사를 그대로 유지했다 — `07-02` §2-1 규칙1(6자 이내)은 `deadlineShort` 필드 자체 길이만 규정해 접미사는 스펙이 침묵하는 영역이라, 정보를 줄이지 않는 쪽으로 판단.
  ③ 모바일 카테고리 칩을 "필터"(선택 카테고리만 노출)로 구현 — `00-38` §8.1-3 "필터일 뿐 유일 경로 아님" 문구를 문자 그대로 해석했다. "구간 내 점프 앵커"로 볼 여지도 있었으나 filter 쪽이 문구에 더 가깝다고 판단.
  ④ `07-04` §8-8-5의 3~5단계(다음 3걸음·요약 띠·분모변경·인쇄, `§8-8-3`)는 사용자가 1·2만 지시해 손대지 않았다 — 스코프 배제이며 미완이 아니다.
- **다음 에이전트가 알아야 할 것**:
  🔴 **커밋은 사람이 한다** — 이 항목은 커밋 전 상태(코드만 미커밋)로 기록됐다. 편차①의 `careGuideTasks.json` 기커밋 건, 사람에게 확인 요망.
  🟡 모바일 칩 필터 UX(편차③)는 실기동에서 "칩 선택 시 다른 구간이 통째로 사라지는 게 맞는지" 사람 확인 필요 — 아니라면 필터→점프 앵커로 재작업.
  🔵 `07-04` §8-8-5 3~5단계(§8-8-3 포함)는 여전히 미착수.
  🟡 `00-38` §4.5-5 터치타깃 36px 3곳 + `ObituaryPage` 수정칩 40px은 Phase 3 그대로 — 이번 작업에서 손대지 않음(사용자 명시 지시).

<!-- Gemini 판정 1줄: ✅통과 / ❌반려(사유) / 🔄스펙갱신(고친 문서) -->

## 2026-09-09 | wt184 [Claude:Opus] `07-03` §6.4 신설 — 조문객 화면 미리보기(공유 패널 버튼 + 모달)

- **근거 스펙**: 사람 지시(2026-09-09) — *"부고장 공유에 버튼 하나 추가 후 모달로 미리보기 띄운다"*. 관련 정본 `07-03` §5.4-1·§5.4-2·§6.3·§8 #3·#8 · `00-38` §8.2-1·§6.4-1
- **건드린 파일**: `docs/07_상중_행정_케어/07-03_모바일_부고장_카카오톡_전송_구현_기획서.md` · `docs/00_핵심플랫폼/00-38_적응형_모바일_UX_개편_명세서.md` · `docs/00_DOCS_INDEX.md` · `docs/00_DOCS_INDEX_상세.md` · `.harness/memory/context.md` (🔴 `eobomDev/` 무변경 — Opus 세션)
- **결과**: `07-03` **§6.4 신설**(ⓐ 형태 · ⓑ 렌더 · ⓒ 동반 조치 · ⓓ 고지 문안) + `00-38` §8.2-1에 *"세 번째 섹션은 만들지 않는다"* 한 단락.
  ⓐ **공유 패널(`managePanel`)의 보조 버튼 1개 → 모달.** 라벨 **`조문객 화면 미리보기`**(🔴 *"부고장 미리보기"* 금지 — 카톡 카드도 부고장의 미리보기라 구분이 안 된다) · `maxWidth:460px`(🔴 `ObituaryLandingPage.tsx:153`의 실제 값과 동일해야 미리보기가 거짓말을 하지 않는다) · `maxHeight:90dvh`(🔴 `vh` 아님) · 랜딩 껍데기 배경 `#FBF9F5` 재현 · 수정 모달과 같은 backdrop/zIndex 패턴 재사용.
  🔵 **3열(3번째 섹션) 기각** — 432+360+420+gap ≈ **1284px** 로 `00-38` §6.4-1의 `.container` 하한 1200px을 넘어 줄바꿈되고 **공유 패널이 아래로 떨어진다**(이 화면의 목적이 공유다). 모달이라 §7-1처럼 플랫폼을 가를 필요도 없다.
  ⓑ 🔴 **`iframe`·새 탭 금지** — `GET /api/obituaries/:slug`가 **조회수를 올린다**(`obituaryController.ts:245`). 대신 `ObituaryLandingPage.tsx`(237줄)의 **표현부 `:151~237`만 `ObituaryView({ data })`로 추출**하고(그 구간은 `data` + 파생 3개 `chief`·`rest`·`kakaoMapUrl`만 쓴다) 관리 모드는 **이미 들고 있는 폼 state를 props로** 넘긴다 → fetch 0건·조회수 오염 0·즉시 반영. 🔴 `useParams`·`fetch`·**`noindex` meta**·loading·notFound는 껍데기에 남긴다(meta가 딸려가면 `/obituary`에 `noindex`가 붙는다).
  ⓒ 🔴 **조회수 가드가 지금도 새고 있음을 발견** — `obituaryController.ts`가 `isOwner`를 계산해 놓고(`:237`) **404 판정에만 쓴다.** 주석(`:243`)은 *"종료된 뒤 개설자 본인 방문은 세지 않는다"* 라고 의도를 적었으나 **활성 중 본인 방문은 집계된다** → `if (!closed)` → `if (!closed && !isOwner)`. §8 #8이 세기로 한 것은 **조문객 조회수**이므로 같은 작업에 묶는다. 🔵 조건 한 줄이라 DB 쓰기가 아니고 백업 대상이 아니다.
  ⓓ **모달 상단 고지 한 줄** — *"조문객에게 보이는 화면입니다. 수정하면 이 화면은 바로 바뀌지만, 이미 보낸 카카오톡 카드는 바뀌지 않습니다."* §5.4-1의 구분을 **유족이 확인하는 그 순간**에 말한다(지금은 `cardFieldsUpdatedAt` 경고가 수정 후에만 알린다). 🔴 §5.4-2의 책임 경계와 같은 말이며 새 약속을 만들지 않는다.
  🔴 **빌드 없음 — 코드 무변경 세션.** 검증: `bash .harness/tools/harness-doctor.sh` 139항목 중 3건(전부 기존 결함: `backlog.md` 116% 2항목 · `roles.md`의 `eobom/` 경로 부재). `context.md` **3039B**/3072B.
- **편차**: **없음.** 🔵 최초 제안은 *"3번째 섹션"* 이었고 검토 결과 폭이 맞지 않아 **사람이 모달로 방향을 정했다**(같은 대화 안에서 결정) — 기각 근거를 §6.4 ⓐ에 남겨 다음 세션이 3열을 다시 시도하지 않게 했다.
- **다음 에이전트가 알아야 할 것**:
  🔴 **`[Claude:Sonnet]` 착수 순서는 ⓑ → ⓒ → ⓐ·ⓓ다.** `ObituaryView` 추출이 먼저 서야 모달에 넣을 것이 생긴다. 추출은 **동작 불변 리팩터링**이라 `/o/{slug}` 실기동 회귀(빈소·연락처·계좌·추모관 줄 4개 조건부 렌더)를 같이 봐야 한다.
  🔴 **`ObituaryView`에 `noindex` meta를 넣지 말 것** — 이것이 이 작업에서 가장 조용히 터질 실수다.
  🟡 **모달 2개가 단위가 다르게 된다** — 기존 수정 모달은 `maxHeight:'90vh'`, 새 미리보기 모달은 `90dvh`. `00-38` §8.2(⑥ 모달→바텀시트 공통 규칙, Phase 3)에서 **모달 5종과 함께 `dvh`로 통일**하며 그때 같이 정리한다. 지금 기존 모달을 건드리지 않는다.
  🟡 **폼 state → `ObituaryData` 형태 맞추기**가 유일한 실제 작업량이다(`mourners` 배열의 `isChief`·`sortOrder`, `deceasedDeathDate` 등). 서버 응답과 폼 state의 필드명이 다르면 **어댑터 하나를 두고 그 자리를 한 곳으로 모은다** — 두 곳에서 각자 변환하면 미리보기와 실제가 어긋난다.

<!-- Gemini 판정 1줄: ✅통과 / ❌반려(사유) / 🔄스펙갱신(고친 문서) -->

## 2026-09-09 | wt185 [Claude:Sonnet] `07-03` §6.4 조문객 화면 미리보기 구현 — `ObituaryView` 분리 + 조회수 가드 + 모달

- **근거 스펙**: `docs/07_상중_행정_케어/07-03_모바일_부고장_카카오톡_전송_구현_기획서.md` §6.4 ⓐ~ⓓ(wt184에서 신설). 사용자가 착수 순서를 `ⓑ→ⓒ→ⓐ·ⓓ`로 직접 지정.
- **건드린 파일**: `eobomDev/frontend/src/components/ObituaryView.tsx`(신규) · `eobomDev/frontend/src/pages/ObituaryLandingPage.tsx` · `eobomDev/frontend/src/pages/ObituaryPage.tsx` · `eobomDev/backend/src/controllers/obituaryController.ts`
- **결과**:
  1) **ⓑ 컴포넌트 추출** — `ObituaryLandingPage.tsx`(237줄)의 표현부(파생값 `chief`·`rest`·`kakaoMapUrl` + 카드 마크업, 구 `:142~237`)를 `components/ObituaryView.tsx`(`ObituaryView({ data: ObituaryData })`)로 그대로 옮겼다(로직 변경 없음, 순수 위치 이동). `ObituaryLandingPage.tsx`는 `useParams`·`fetch`·`noindex` meta·로딩 스켈레톤·`notFound`만 남는 118줄 껍데기가 됐고, 성공 분기는 `<ObituaryView data={data} />` 한 줄. `Row` 헬퍼·`Mourner`/`ObituaryData` 인터페이스도 함께 이동(랜딩 페이지는 `ObituaryView`에서 타입만 재사용).
  2) **ⓒ 조회수 가드** — `obituaryController.ts:244`를 `if (!closed)` → `if (!closed && !isOwner)`로. 주석도 "종료된 뒤"→"활성 중에도 마찬가지" 정정.
  3) **ⓐ·ⓓ 미리보기 버튼+모달** — `ObituaryPage.tsx` 공유 패널(`managePanel`)에 `조문객 화면 미리보기` 버튼(링크복사·문자보내기와 같은 보조 버튼 군, 카카오톡 버튼보다 아래)을 추가. 클릭 시 뜨는 모달은 기존 수정 모달(`isEditOpen`)과 같은 배경(`rgba(0,0,0,.65)`+`blur(4px)`)·`zIndex:3000`·배경클릭 닫힘·내부 `stopPropagation` 패턴을 재사용하되 `maxWidth:460px`(랜딩 카드와 동일)·`maxHeight:90dvh`(🔴 수정 모달은 그대로 `90vh` — 손대지 않음, Phase 3에서 모달 5종과 함께 통일)로 별도 구성. 모달 안에 `#FBF9F5` 배경 + `2.5rem 1rem` 여백을 재현하고 그 안에 §6.4 ⓓ 고지 두 줄("조문객에게 보이는 화면입니다.../수정하면...") + `<ObituaryView data={buildPreviewData()} />`.
  4) **어댑터** — `buildPreviewData()` 함수 하나로 폼 state(`deceasedName`·`deathDate`·`funeralHall`·`funeralHallAddr`·`mourningRoom`·`coffinAt`·`funeralAt`·`burialSite`·`chiefMournerName`/`chiefMournerRelationship`·`mourners`·`contactPhone`·`accountEnabled`+`accountBankCode`/`accountNumber`/`accountHolder`·`obituaryRef.memorialSlug`·`cardFieldsUpdatedAt`·`updatedAt`) → `ObituaryData` 변환을 한 곳에 모았다(호출부 1곳 — 모달 렌더 직전).
  검증: `npx tsc --noEmit -p .`(`eobomDev/frontend`·`eobomDev/backend` 둘 다) · `npm run build`(`eobomDev/frontend`) 전부 에러 0(그대로 실행 확인, 기존 vite 청크 크기 경고만).
  **실기동**: 하지 않음 — **"실기동 검증 대기"**로 남긴다(사람 몫, 2026-09-03 지시). 확인할 것: `ObituaryView` 추출 후 랜딩(`/o/{slug}`) 4개 조건부 렌더(빈소 길찾기 링크·연락처 전화걸기·계좌·추모관 줄)가 그대로인지(회귀 대상으로 지정받음), 미리보기 모달이 실제 `/o/{slug}` 렌더와 동일하게 보이는지, `!isOwner` 조회수 가드가 실제로 본인 방문을 안 세는지(백엔드 로그 확인 필요 — 프론트에서는 검증 불가).
- **편차**: **없음.** 스펙 순서(ⓑ→ⓒ→ⓐ·ⓓ)·값(460px·90dvh·#FBF9F5·고지 문구)을 전부 지정받은 대로 구현했다. 다만 `ObituaryView`의 위치를 `components/`로 뒀다(스펙은 파일 위치를 명시하지 않음) — 랜딩·관리 두 페이지가 공유하는 프레젠테이션 컴포넌트라 `pages/`보다 `components/`가 이 저장소의 기존 배치 관례(`FarewellMessageCard.tsx` 등)에 맞는다고 판단.
- **다음 에이전트가 알아야 할 것**:
  🔴 **커밋은 사람이 한다** — 이 항목은 커밋 전 상태로 기록됐다.
  🟡 `buildPreviewData()`의 `updatedAt: updatedAt ?? new Date().toISOString()` — 폼이 아직 서버에 한 번도 저장되지 않은 극단적 상황(이론상 `managePanel`은 `obituaryRef` 존재 시에만 렌더되므로 `updatedAt`이 없을 일은 없어야 한다)을 대비한 폴백이다. 실기동에서 이 폴백이 실제로 타는지는 확인 대상이 아니다(정상 경로에서는 항상 서버 값이 있다).
  🔵 `ObituaryView.tsx`는 이제 랜딩·미리보기 모달 두 곳에서 쓰인다 — 다음에 이 컴포넌트를 고칠 때는 **두 화면 모두**에 영향이 간다는 걸 염두에 둘 것.
  🟡 이 항목은 원래 `wt184`로 잘못 번호가 매겨졌었다 — Opus의 §6.4 신설 세션(같은 날 wt184 선점)과 동시에 쓰이면서 겹쳤고, 발견 즉시 `wt185`로 정정하고 Opus 항목 뒤로 재배치했다.

<!-- Gemini 판정 1줄: ✅통과 / ❌반려(사유) / 🔄스펙갱신(고친 문서) -->

## 2026-09-09 | wt185 정정 — 미리보기에서 추모관 관련 제외

- **근거 스펙**: 스펙 없음 — 사용자 직접 지시("조문객 화면 미리보기에 추모관 관련은 빼기").
- **건드린 파일**: `eobomDev/frontend/src/pages/ObituaryPage.tsx`
- **결과**: `buildPreviewData()`의 `memorialSlug`를 `obituaryRef?.memorialSlug ?? null` → 항상 `null`로 고정. `ObituaryView` 자체(따라서 실제 `/o/{slug}` 랜딩)는 손대지 않았다 — 추모관이 있으면 그대로 노출되고, **이 미리보기 모달에서만** "추모관 들어가기" 바가 안 뜬다. `npx tsc --noEmit -p .`·`npm run build`(`eobomDev/frontend`) 통과.
- **편차**: 없음(지시 그대로).
- **다음 에이전트가 알아야 할 것**: 🔴 커밋은 사람이 한다 — 이 항목은 커밋 전 상태로 기록됐다. 🟡 미리보기와 실제 화면이 이제 의도적으로 다르다(추모관 유무) — 이 컴포넌트를 또 고칠 때 "미리보기=실제와 100% 동일"이라고 가정하지 말 것.

<!-- Gemini 판정 1줄: ✅통과 / ❌반려(사유) / 🔄스펙갱신(고친 문서) -->
