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
> 🟡 **2026-10-13 — 4차(예외)**(647KB → 229KB). 9월분 판정 대기 120건을 **판정 생략(게이트 미경유)** 표기 후 [`_아카이브_2609`](walkthrough_아카이브_2609.md)로 옮김(개발자 결정).
> 원인 = Gemini 판정이 `gemini_tasks.md`에만 적히고 이 파일 판정 칸은 비어 있었음. 🔴 **판정은 이 파일의 그 항목 칸에 적는다**(`GEMINI.md`).

---
## 2026-10-21 | [Sonnet] 디자인 개편 8단계 묶음 3 — 랜딩 `/preview/landing`

- **근거 스펙**: docs/00_핵심플랫폼/00-45 §2~§10 · §11(코드 차이 표) · 00-44 §9-4 공통 조건 · 랜딩 캔버스 `Main.dc.html`(데스크톱)·`Mobile.dc.html`(모바일)의 인라인 값을 직접 읽고 반영(`Menu_*` 판은 묶음 1에서 끝남).
- **건드린 파일**: 신규 `eobomDev/frontend/src/redesign/pages/LandingPage.tsx` · `pages/landingData.ts`(문구·가는 곳) · `pages/landing.css` · `useIsPhone.ts`(폭 판별 훅) / 수정 `redesign/PreviewApp.tsx`(`/preview/landing` 라우트 1줄) · `redesign/main.tsx`(`landing.css` import 1줄) · `redesign/parts/RdButtons.tsx`(`RdBranchLink` 추가 — 갈래 버튼과 같은 모양의 `<a>`, 기존 부품 변경 0). 지금 화면 파일(`App.tsx`·`index.css`·`design-v2.css`·`components/`·`pages/`) 0. 서버·DB 0. 메뉴·링크에 이 주소를 넣지 않음.
- **결과**: 데스크톱 = 첫 화면(제목 한 줄 + 갈래 링크 2 + 바로 보기 카드, 7초 자동 넘김 · 이전/멈춤/다음 44 × 44 · 마우스/초점 중 정지 · 동작 줄이기면 처음부터 멈춤) → 제1부(종이 바탕) → 제2부, 소개는 목록(`aria-pressed`) + 상세(16:10 빈 이미지 박스 · `01 / 03` · 기능 설명 · 밑줄 링크). 모바일 = 세로 4칸(첫 화면 · 바로 보기 11칸 2열 · 제1부 · 제2부) · 반투명 ⌄(①②③만) · 소개는 카드 한 장 밀어 넘기기(40px) + [‹] [바로 가기] [›] · `aria-live` 번호 · 카드에 초점이 있을 때만 방향키. 갈래 링크는 같은 쪽 안 `#part2-title`·`#part1-title`로 내려가고 도착한 제목에 초점. "추모관 링크로 입장" 칸 = 이어봄 입력 창(링크 읽기는 `parseMemorialLink` 그대로, 오류 문구는 지금 홈과 같음). 바닥글·헤더·메뉴는 묶음 1 `RdLayout` 그대로. 재현: `cd eobomDev/frontend && npm run build` → tsc 오류 0, 통과, 옛 CSS(`legacyMain-*.css` 73.75KB) 크기 변화 없음. **실기동 대기**(1280 · 1920 · 휴대폰 폭은 사람).
- **00-45 §11 표에서 끝난 줄(10줄 전부)**: 데스크톱 넘김 · 모바일 넘김 · 첫 화면 · 갈래 · 기능 목록(차례 없음) · 추모관 링크로 입장 · 파트너 로그인(본문에서 뺌) · 바닥글 · 섹션3 없음 · 모바일 헤더. 표를 지우는 것은 Opus.
- **편차**(Opus 판정 요청): ① 🔴 **모바일 바로 보기 칸 아이콘** — 00-45 §5 표는 "아이콘 없음", 캔버스 `Mobile.dc.html`은 22 아이콘이 **있음**. 캔버스를 따라 넣음(`QuickCell`의 `showIcon`으로 끌 수 있음). ② 제2부 목록의 단계 머리(장례 기간·장례 후·정리와 기억)는 캔버스 `#8A7E70`(대비 부족, 00-44 §3과 같은 사유) → `--rd-ink-small`(`#6E6255`). ③ 소개 설명·기능 목록 글자는 캔버스 `#4A4038`(팔레트에 없음) → `--rd-ink-support`(`#5A5046`). ④ **본문 폭**: 캔버스는 `max-width:1120` border-box(본문 1040), 구현은 헤더·바닥글과 같이 본문 1120 + 좌우 40(00-44 §5-1) — 묶음 2에서 판정한 "캔버스 box-sizing 차이는 편차 아님"과 같은 종류로 봤으나 이 화면은 눈에 띄므로 확인 요청. ⑤ 모바일 칸 맞춤은 `scroll-snap-type: y proximity` + 칸 `min-height`(`mandatory`로 하면 작은 폰에서 내용이 칸보다 길 때 갇힘). ⑥ 데스크톱 첫 화면 높이 `100svh − 97px`의 97은 헤더 높이 가정(시안 703 = 800 − 97)이라 상수 `--rd-landing-head`로 둠 — 실측에서 헤더 높이가 다르면 이 값만 고치면 된다. ⑦ **모드 맞추기**(00-45 §3·§6-1 "그 부로 모드를 맞춘다")는 지금 코드에서 `navMode`가 09-28에 걷혀(`Sidebar.tsx` 주석) 맞출 상태가 없어 **구현할 것이 없음** — 문서 문구가 낡았을 가능성. ⑧ 옛 `/prep`·`/bereaved` → 제1부·제2부 이동(§8-6)은 라우터 교체(10단계) 일이라 미리보기에서는 주소 뒤 `#part1-title`·`#part2-title`로 열면 내려가게만 함. ⑨ **입력 창 문구**(제목 "추모관 링크로 입장" · 도움말 "문자나 카카오톡으로 받으신 추모관 링크를 붙여 넣어 주세요." · 자리 글 "받으신 추모관 링크")는 시안에 없어 내가 정함 → 확인 요청. ⑩ 바로 보기 카드 제목 줄: 넘김 버튼이 36 → 44로 커져(§5) 제목 "필요한 것만 바로 보기"가 두 줄로 접힌다(캔버스 36일 때도 같은 폭 계산상 접힘). ⑪ 가정: 자동 넘김 정지 대상은 카드 전체(칸 + 제목 줄 버튼) · 소개 이미지는 빈 박스 + `role="img"` 대체 글(§9 — 캡처는 9단계) · 데스크톱 ⌄·소개 목록은 `button`, 갈래·바로 보기 칸은 `a`.
- **수정 1차(같은 날, 개발자 지적: 제목 두 줄 · 구간이 한 화면에 안 들어옴)**: 실측(개발 서버 + 같은 출처 iframe으로 1280×800 · 1920×975 · 390×844 · 390×660 · 360×640) 후 `landing.css`만 수정. ① 바로 보기 제목 한 줄(`nowrap` + 카드 폭 480 · 첫 화면 좌우 비율 1.2 : 1). ② 데스크톱 소개: 구간 위·아래 여백 96/104 → 40/48, 제목 아래·목록 사이 간격 축소, **상세 폭 480 상한**(그림 16:10이 724폭에서 452px로 구간을 키우던 것이 원인) → 구간 높이 1127 → 1280×800에서 786(제1부)·791(제2부), 낮은 화면(높이 860 이하)은 그림 400 상한. ③ 모바일: 그림 높이 `clamp(130, 25svh, 220)`·여백 축소, 높이 740 이하는 한 단계 더 → 390×660·360×640에서도 4칸 모두 칸 높이(`100svh − 56`)에 맞음(전엔 656·659로 넘침). ④ 헤더 높이 가정 97 → **실측 101**(`--rd-landing-head`). 바닥글 계산 오류는 아님(데스크톱 바닥글은 칸 밖, 모바일은 없음). **편차**: 상세 폭 480 상한 때문에 데스크톱 상세 오른쪽에 빈자리가 생김(캔버스는 나머지 폭 전체) · 낮은 화면에서 그림이 16:10 그대로 작아짐 — Opus 판정 요청.
- **수정 2 (같은 날 · 데스크톱 "화면 맞춤 배율" 반영, 00-45 §2·§6-1·§9)**: 건드린 파일 `redesign/pages/landing.css` · `pages/LandingPage.tsx` · 신규 `redesign/useFitScale.ts`(배율 훅). 모바일(`.rd-lc`·`.rd-lm`·`max-width:767`) 0. 서버·DB·`docs/` 0(이 기록 제외).
  - **방식**: 구간 띠(`.rd-lh`·`.rd-ls`, 바탕색·선·헤더·바닥글·⌄은 배율 밖)와 안쪽 래퍼(`.rd-lh__fit`·`.rd-ls__fit`)로 나누고 래퍼에 CSS `zoom`을 건다(배치에 반영돼 빈 높이·겹침 없음). 배율 = (띠 `min-height` − 선 두께) ÷ 배율 1일 때 내용 높이, 0.85~1.15, 폭 한계 `화면 폭 ÷ (1120+양옆 여백)`. 첫 화면 띠 min-height = `100svh − 헤더`, 제1·2부 = `100svh`. 창 크기 변경·`document.fonts` 적재 뒤 다시 잼. 0.85로도 넘치면 띠가 늘어남(`height` 없음).
  - **소개 출렁임 방지**: 모든 항목의 상세를 같은 칸(`.rd-ls__stack`, grid 한 칸)에 겹쳐 두고 고른 것만 보이게(나머지 `visibility:hidden`·`aria-hidden`·링크 `tabIndex=-1`) → 칸 높이 = 가장 긴 항목, 배율은 구간당 한 번만 정해짐.
  - **상세**: `max-width:480` 제거(나머지 폭 전부) · 그림 칸 `aspect-ratio` 제거 → 폭 100%·높이 300(배율 1) · 실제 `img`용 `object-fit:cover; object-position:top` 규칙 준비. 앞서 넣은 `@media (max-height:860)` 덮어쓰기 삭제, 위아래 여백 40/48(배율 1).
  - **누르는 칸 44**: 소개 목록 줄 min-height 48→52, 바로 가기 링크·아이콘 버튼(첫 화면 카드 이전/멈춤/다음 44→52) 52 → 0.85배에서 44.2. (바로 가기 링크는 전역 `.rd-root a.rd-link`에 밀려 선택자를 올림.) 첫 화면 카드 제목 줄이 52 버튼 때문에 약간 높아짐.
  - **실측**(개발 서버 https 5173 + 같은 출처 iframe, 높이는 구간 `getBoundingClientRect`):

| 화면 | 첫 화면 높이 / 배율 | 제1부 높이 / 배율 | 제2부 높이 / 배율 | 가로 스크롤 | 누르는 칸 최소 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1920×975 | 874 (=975−101) / 1.08 | 975 / 1.135 | 975 / 1.15 | 없음 | 56.2 |
| 1280×800 | 699 (=800−101) / 1.08 | 800 / 0.997 | 800 / 0.991 | 없음 | 51.5 |
| 1366×650 | 549 (=650−101) / 1.037 | 682 / 0.85 | 687 / 0.85 | 없음 | 44.2 |

  - **가로 폭 정정(개발자 지적 "전체 박스 가로가 헤더·푸터와 일치")**: `zoom`은 폭도 배율만큼 바꿔 박스가 1200이 아니게 됐음. 본문 `max-width`와 좌우 여백을 `÷ var(--rd-fit)`(훅이 래퍼에 건 배율)로 잡아 **화면에서는 모든 배율에서 박스 1200·본문 1120**(실측: 1920 박스 왼쪽 353 · 본문 시작 393 = 바닥글 393, 1280은 73, 1366은 116, 카드 오른쪽 끝도 바닥글 오른쪽 끝과 같음). 이 때문에 ① 폭 한계 항목은 "넘치지 않는 가장 큰 배율"로 구현(별도 상한 없음, 가로 스크롤 없음) ② 배율마다 줄바꿈이 달라져 훅이 **1.15에서 0.85로 내려가며 "높이가 들어가고 가로로 안 넘치는" 가장 큰 배율**을 찾고 0.01 안은 이분(`data-fit-guard` 칸이 자기 폭을 넘치면 불가). ③ **첫 화면은 폭 때문에 1.08이 상한**(제목 551 + 카드 약 457 + 간격 64를 1120 화면 폭에 넣으려면) → 1920·1280에서 위아래가 조금 빔(세로 가운데). 첫 화면은 ≥1100px에서 줄을 나누지 않음(`flex-wrap:nowrap`).

  - 앞 두 화면은 구간 하나 = 화면 한 장. 1366×650은 제1·2부가 0.85에서 멈추고(682·687 > 650) 스크롤. 1920은 1.15 상한이라 내용이 세로 가운데에 놓이고 위아래가 약간 빈다(스펙대로). 첫 화면 높이 699는 헤더 실측 101 기준(스펙 예시 703은 헤더 97 가정). 빌드: `npm run build` tsc 오류 0, 통과.
  - **첫 화면 카드 버튼(개발자 지적 "< ❚❚ > 너무 붙어 답답")**: 52로 키운 것을 되돌려 **보이는 크기 44**, 눌리는 영역만 투명(`::after inset:-4px`)하게 52로 넓혀 0.85배에서도 44.2. 버튼 사이 2→6, 제목과 버튼 사이 최소 16(제목 줄 `flex-wrap` 해제 — 넘치면 줄이 나뉘지 않고 배율이 내려감, `data-fit-guard`). 실측: 제목–버튼 간격 23(1280·1920) · 37(1366), 한 줄 유지. 첫 화면 최종 배율 1.087(1920·1280) · 1.053(1366).
  - **개발자 지시(소개 구간)**: ① 제1부·제2부 상세의 바로 가기 링크를 오른쪽 정렬(`align-self:flex-end`, 상세 칸 오른쪽 끝과 간격 0 확인). ② 기능 설명 앞 "—"를 갈색 점 "·"으로 교체(00-45 §6-1 끝줄에 적힌 대안; 데스크톱·모바일 같은 문구라 **둘 다** 바꿈, 굵게). 배율·높이 변화 없음(1920 1.135/1.15 · 1366 0.85). 문서 문구("—")는 Opus가 고칠 것.
  - **제2부 목록 간격(개발자 지시 "섹션3 메뉴 높이 간격을 줄여 하단 여백")**: `#part2` 목록 줄 위아래 안쪽 여백 14→11(줄 높이 58→52, 누르는 칸 52 유지 → 0.85배 44.3), 단계 머리 위·아래 여백 20/6→14/2. 목록 높이 648→494(배율 1 기준)로 상세(558)보다 짧아짐. 실측: 1920×975 배율 1.15·구간 975 · 1280×800 배율 1.0(전 0.991)·800 · 1366×650 배율 0.85·구간 680(전 687). 구간은 화면에 맞추는 방식이라 **구간 아래 여백(위 40/아래 48 × 배율)은 그대로**이고, 목록 아래에 상세 맨 아래까지 64의 빈 자리가 생김. 구간 아래 여백 자체를 더 키우려면 제2부 아래 패딩 값을 정해 줘야 함.
  - **상세 폭 상한(개발자 지적 "높이가 낮고 폭이 넓으면 이미지만 늘어남")**: 배율이 0.85로 내려가면 본문이 배율로 나눈 만큼 넓게 배치돼(1920×650에서 상세가 나머지 폭 전부 ≈1000) 그림만 가로로 길어졌음. `.rd-ls__stack`에 `max-width:740`(배율 1일 때 나머지 폭 732가 기준) + 본문 `justify-content:space-between`(남는 폭은 목록과 상세 사이로, 상세는 본문 오른쪽 끝에 붙음). 실측 그림(배율 1 기준): 1920×650 740×300 · 1920×975 586~599×300 · 1280×800 732~735×300 · 1366×650 740×300, 상세 오른쪽 끝 = 바닥글 오른쪽 끝(차 0), 가로 스크롤 없음, 배율·구간 높이는 전과 같음. 낮고 넓은 화면(배율 0.85)에서는 목록과 상세 사이 간격이 48보다 넓어짐(1920×650에서 약 240, 배율 1 기준).
  - **편차/확인**: ① 첫 화면은 카드 쪽 페이지(4·4·3칸)가 바뀌어도 배율은 처음 한 번만 정함(3칸 쪽도 2줄이라 높이 차 거의 없음) — 실기동에서 출렁임이 보이면 말해 줄 것. ② `zoom`은 Firefox 126 미만 미지원(그 경우 배율 1로 보임, 깨지지 않음). ③ 개발 서버는 사람이 연 https 5173을 썼고 내가 띄운 5199는 껐음.
- **다음 에이전트가 알아야 할 것**: (a) ⏸ **사람이 `/preview/landing`을 랜딩 캔버스(`Main`·`Mobile`)와 1280 · 1920 · 휴대폰 폭으로 대조** — 특히 ① 첫 화면 높이 ② 제목 두 줄 접힘 ③ 모바일 칸 높이 · ⌄ 위치 · 칸 맞춤 감각. (b) 바로 보기 칸·소개 바로 가기의 경로는 **지금 화면 주소**(`/facility` 등)라 미리보기에서 누르면 옛 화면으로 간다(교체 전까지 정상). (c) 로그인 버튼은 묶음 8이 연결(변경 없음). (d) 커밋은 사람.

<!-- Gemini 판정 1줄: ✅통과 / ❌반려(사유) / 🔄스펙갱신(고친 문서) -->

---
## 2026-10-21 | [Sonnet] 디자인 개편 8단계 묶음 2 — 공통 부품 + 견본 쪽 `/preview/parts`

- **근거 스펙**: docs/00_핵심플랫폼/00-44 §6~§8(규칙·부품·폼·입력) · §9-2 · §9-4 묶음 2 줄과 공통 조건. 시안 0단계 판 02~08은 **캔버스 파일을 열지 않고** §7·§8 표 값으로 갈음(사람 대조 단계 ⏸가 이 확인).
- **건드린 파일**: 신규 `eobomDev/frontend/src/redesign/parts/`(`RdButtons·RdCards·RdInputs·RdNav·RdNotices·RdModal·RdState.tsx` · `icons.tsx` · `parts.css`) · 신규 `redesign/pages/PartsPage.tsx` · 수정 `redesign/PreviewApp.tsx`(`/preview/parts` 라우트 1줄) · `redesign/main.tsx`(`parts.css` import 1줄) · `redesign/redesign.css`(`.rd-root button` → `:where(.rd-root) button` 1곳, 아래 편차 ③). 지금 화면 파일(`App.tsx`·`index.css`·`design-v2.css`·`components/`·`pages/`) 0. 서버·DB 0.
- **결과**: `/preview/parts`(메뉴·링크에 안 넣음)에 7구간을 상태별로 늘어놓음: 버튼(주·보조·위험 × 기본/올림/사용 불가/처리 중) · 글 링크 · 아이콘 · 자리 ①② · 갈래 · 딱지 · 카드 · 구간 머리 · 목록 줄 · 이동 줄 · 체크리스트 줄(안 함/기한 임박/끝냄) · 숫자 칸 · 펼침 · 더 보기 · 쪽 넘김 · 입력칸 5상태 · 고르기·날짜·긴 글 · 체크·라디오 · 동의 묶음 · 파일 올리기 · 선택 조각 · 거르기 줄 · 폼 한 개(오류 요약·초점 이동·처리 중·저장 줄) · 쪽 머리 · 탭 · 쪽 안 차례 · 띠 알림 · 알림/주의/성공 상자 · 기한 한 줄 · 위치 · 도움말 풍선 · 출처 말풍선 · 창 6종(입력·확인·위험 확인·알림·짧은 알림·내용 바꾸기) + 로그인 가림막 · 상태 화면 5종. 값은 전부 `.rd-root`의 `--rd-*`를 씀(부품마다 색 직접 적지 않음). 재현: `cd eobomDev/frontend && npm run build` → tsc 오류 0, 빌드 통과, 새 CSS는 `dist/assets/main-*.css`(40KB)에만 있고 옛 CSS(`legacyMain-*.css` 73.75KB)는 크기 변화 없음. **실기동 검증 대기**(1280 · 1920 · 휴대폰 폭은 사람; 올림·초점은 견본에서 `is-hover`/`is-focus` 클래스로 고정해 보임).
- **모바일 시안 대조(같은 날 2차, 개발자 지적 "다른 것 무지 많음")**: 0단계 캔버스 `Buttons_M·Cards_M·Inputs_M·Head_M·Notice_M·Modal_M·States_M`의 인라인 값을 직접 읽고, 390폭 iframe으로 `/preview/parts`를 열어 구간별로 대조·수정(개발 서버는 확인 뒤 껐음). 고친 것: 견본 틀(부품을 시안처럼 342폭 그대로 · 버튼 2열) · 버튼 사이 8 · 갈래 패딩 · 딱지 12px/종류 · 카드 간격 10 · 목록 줄(상태가 정보 줄 안 · 올림 여백 없음) · 체크리스트(상자 34 · 기한 딱지 한 덩이) · 숫자 칸 · 더 보기 · 쪽 넘김 · 동의 줄(`[필수]` 글자/설명 줄은 딱지) · 선택 조각 밀어 넘김 · 차례 띠 · 띠 알림(링크 아래 줄) · 알림/성공 상자 값 · 기한 한 줄(아이콘 없음) · 풍선 위치 · 창(1:2 · 확인·위험 1:1 · 입력 창만 손잡이 · 위험은 위 2px만) · 짧은 알림 · 가림막 · 상태 화면(그림 40 · 진행 막대 가득 폭). 데스크톱 판(`*_D`)은 알림 상자만 대조함 — **나머지 데스크톱 값 대조는 안 했음.**
- **편차**(문서·시안 확인 요청 포함): ① ~~알림 상자 여백~~ ✅ 해소 — 판 06 데스크톱 값 `padding: 24px 28px`(위아래 24 · 좌우 28)이라 §7-5 "24 / 28"은 데스크톱/모바일이 아니라 위아래/좌우였음(모바일 20). ② **체크·라디오**는 처음 직접 그렸으나 시안이 `accent-color` 원본이라 **원복**(§8-3-3 그대로, 편차 아님). ②' **창 손잡이**: §7-6은 "모든 창"이나 시안 모바일은 **입력 창에만** 손잡이가 있고 확인·위험·알림 창엔 없음 → 시안대로 구현, §7-6 판정 요청. ②'' 시안 모바일 상태 화면 설명 문구가 §7-7 예시보다 길다(견본은 시안 문구). ③ **묶음 1 파일 1곳 수정**: `.rd-root button{font,color:inherit}`가 `.rd-btn`의 글자 값(우선순위 같고 먼저 적힘이 아니라 더 높음)을 눌러 버튼 글자가 17px 상속으로 깨져 `:where()`로 우선순위 0 처리. 묶음 1 화면에는 영향 없음. ④ §7에만 있고 기반에 없던 값 6개(`#453D33` 주 버튼 올림 · `#A39785` 보조 사용 불가 글자 · `#D9CFC0` 갈래 설명 · 흰색 · 창 뒷배경 `rgba(43,38,32,.35)` · 창 그림자 `.25`)를 `parts.css` 맨 위 `--rd-*`로 이름 붙임 → §3 표에 더할지 Opus 판단. ⑤ 문서에 두께가 없는 것은 가정: 위험 확인 창 테두리 1px 위험 색, 데스크톱 창은 뒷배경 누르기로도 닫힘(문서는 Esc·× 규정만 — 두 버튼 창은 "취소" 쪽으로 닫음), 상태 화면 선 그림 5개와 아이콘 전반은 **임시 선 그림**(시안 그림 미대조). ⑥ [더 보기]는 §7-2 표대로 글 버튼(데스크톱)/가득 폭 테두리(모바일). 그 밖에 스펙과 다른 곳 없음.
- **다음 에이전트가 알아야 할 것**: (a) **새로 생긴 공통 부품 목록(§7 추가는 Opus가 함)** — 버튼·링크: `RdButton`(kind 주/보조/위험 · place screen/row/dialog/bar · busy · disabledReason) · `RdButtonRow` · `RdTextLink`(external · short · onDark) · `RdIconButton`(label 필수) · `RdBranchButton` · `RdBadge`(state/done/danger/danger-fill/example) · `RdRequired`. 칸·목록: `RdCard`(flat/paper) · `RdSectionHead` · `RdList`+`RdListRow` · `RdNavRow` · `RdChecklistRow` · `RdStatGrid` · `RdFold` · `RdMoreButton` · `RdPager`. 입력: `RdField`(render prop로 id·aria 넘김) · `RdInput` · `RdSelect` · `RdDate` · `RdTextarea` · `RdCheck` · `RdRadioGroup` · `RdConsentGroup` · `RdFileDrop`+`RdFileRow` · `RdChips` · `RdFilterRow` · `RdSaveBar`(오류 요약 한 줄 포함). 쪽 머리: `RdPageHead` · `RdTabs`(방향키) · `RdToc`. 안내: `RdBanner` · `RdNotice`(info/caution/success) · `RdDeadlineLine` · `RdLocation` · `RdTipHost`+`RdHelpTip` · `RdSourceTip`(말풍선은 `RdTipHost` 안에 둠). 창: `RdDialog`(공통 틀 · 초점 가두기 · Esc · 바깥 누름 · 스크롤 잠금, `.rd-root` 안으로 portal) · `RdConfirmDialog` · `RdDangerDialog`(처음 초점 [취소]) · `RdAlertDialog` · `useRdToast()`(4초) · `RdLoginGate`(`contained`는 견본용). 상태: `RdState`(empty/working/offline/error/done). 전부 `redesign/parts/`, 아이콘은 `parts/icons.tsx`(선 그림 SVG). (b) 헤더 [로그인] `onLogin`은 **이번에도 비워 둠**(로그인 흐름·창 내용이 묶음 8의 일) — `RdLoginGate`/`RdDialog`로 연결하면 된다. (c) 화면 쪽에서 `.rd-btnrow`는 소스 순서 **[보조][주]**로 쓰고, 모바일 쌓기(주가 위)는 CSS `column-reverse`가 한다 — 순서를 거꾸로 적지 말 것. (d) 올림 상태는 `@media (hover:hover)` 안에만 있어 휴대폰 폭에서는 안 나옴(§6-6 "마우스 올림 없음"). (e) `RdSaveBar`·`RdToc` 모바일 고정은 `position:sticky`라 부모 안에서 붙음 — 실제 화면에서 쪽 맨 아래에 두면 화면 아래 고정처럼 보이는지 실기동에서 볼 것. (f) 커밋은 사람(메시지 초안은 답변에).

- **보완 (2026-10-21 · 데스크톱 판 대조 + Opus 판정 반영)**
  - **근거 스펙**: 00-44 §3(부품 전용 값 표) · §7-5 · §7-6(10-21 판정: 입력 창 바깥 누르기 닫지 않음 · 손잡이 모바일 입력 창만) · 시안 0단계 캔버스 `Buttons_D·Cards_D·Inputs_D·Head_D·Notice_D·Modal_D·States_D`(인라인 값을 직접 읽고, 시안을 일반 HTML로 바꿔 1280폭에서 **치수를 재어** 견본과 대조).
  - **건드린 파일**: `eobomDev/frontend/src/redesign/` 안만 — `parts/parts.css`(맨 끝에 `@media (min-width:768px)` 데스크톱 대조 블록 + 공용 도우미 `.rd-st`·`.rd-dl`·`.rd-foldlist`) · `parts/icons.tsx`(시안 그림으로 교체·굵기 1.6 기본) · `parts/RdModal.tsx` · `parts/RdCards.tsx` · `parts/RdNotices.tsx` · `parts/RdInputs.tsx`(오류 글 그림) · `pages/PartsPage.tsx`(견본 내용). 지금 화면 파일·서버·DB·`docs/` 0(이 기록과 context.md 제외).
  - **결과**: ① 입력 창(`form`)과 ⑥ 내용 바꾸기(`footLine`)는 바깥 누르기로 안 닫힘(견본에서 확인: 바깥 누름 후 유지, Esc로 닫힘). 두 버튼 확인·위험·알림 창은 바깥 누르기 = [취소] 그대로. 모바일은 CSS가 ×를 숨겨 [취소]만 남음. ② 손잡이는 이미 모바일 입력 창만(`parts.css` `.rd-dialog--form .rd-dialog__handle`) — 확인만. ③ 시안과 치수가 같아진 것: 버튼 6종 폭·높이(102.9×44 등)·카드 높이(255)·목록 줄 87·체크리스트 줄 86·숫자 칸 114·펼침 60·띠 알림 76·알림/주의 상자·창 여백(확인 창 높이 205)·상태 화면 상자. 안 맞던 것을 고침: 창 여백(32 · 입력 창 36/40 + 아랫줄 실선) · × 위치(위 16·오른쪽 16) · 경고 줄 · 쪽 머리 줄 높이 · 입력칸 안쪽 여백 14 · 긴 글 5줄 · 동의 묶음 여백 20 · 파일 올리기 상자 · 쪽 안 차례 점선 · 카드 간격 14 · 구간 머리 · 숫자 칸 · 펼침 점선 · 쪽 넘김(양끝 정렬) · 로그인 가림막 · 짧은 알림 · 상태 화면 48·여백 · 완료 상태 한 줄 폭 등. ④ 아이콘: 시안에 있는 그림(화살표·꺾쇠·닫기·ⓘ·△·체크 원·핀·달력·올리기·봉투·사람·두 사람·오류 원)을 시안 값으로 교체. 상태 화면 그림 5개는 이미 시안 그림과 같았고 데스크톱 크기(48)만 맞춤. 시안에 없는 아이콘(멈춤·바깥 이동 ↗·문서·폴더·사진·카메라)은 **여전히 임시**. 빌드: `npm run build` tsc 오류 0, 통과. 개발 서버는 확인 뒤 껐음.
  - **편차**(Opus 판정 요청): ① **시안 렌더가 문서 값보다 큼**(캔버스 요소가 `box-sizing`을 안 정해 패딩이 더해짐) — 창 폭 문서 560/420 ↔ 시안 렌더 642/486 · 로그인 가림막 카드 340 ↔ 398 · 기한 한 줄 48 ↔ 50 · 탭 52 ↔ 53 · 차례 줄 44 ↔ 45. **문서 값을 따름**(시안과 눈으로 대조하면 1~2px·창은 크게 보임). ② **띠 알림 봉투 그림**은 데스크톱 시안에만 있어 데스크톱에만 넣음(모바일 시안엔 없는지 미확인 → CSS로 숨김). ③ **⑥ 내용 바꾸기 창도 바깥 누르기로 안 닫게** 함(입력값이 있어서) — 판정은 "입력 창"만 말함, 확대 적용은 내 판단. ④ **체크리스트 줄 ›**는 시안 데스크톱에 없으나 문서 §6-5-6대로 둠. ⑤ **목록 줄**: 시안 데스크톱은 마지막 줄 아래에도 점선, 상태는 배경 없는 글자(공개 중 · 닫힘) → 데스크톱만 따름(모바일은 그대로). ⑥ 입력 창 안 오류·도움말 글 줄 높이, 견본 문구는 시안 문구를 일부 그대로 씀.
  - **다음 에이전트가 알아야 할 것**: (a) 데스크톱 값은 `parts.css` 맨 끝 블록 하나에 모여 있다(모바일 블록은 안 건드림). (b) 새 부품 이름 변화 없음 — `RdDialog`에 `footLine` 추가, 입력 창 판별은 `form`. (c) 새 아이콘 `IconMail·IconUser·IconUsers·IconErrorCircle·IconChevronLeft` · 도움말 풍선 등 시안에 없는 그림은 임시. (d) ⏸ **사람이 `/preview/parts`를 0단계 캔버스 판 02~08과 눈으로 대조**(1280·1920·휴대폰 폭) — 통과 전 묶음 3 착수 금지. (e) 커밋은 사람.

- **보완 2 (2026-10-21 · 커밋 bc9a62a + 16aa41a + 이번 정리)**
  - **근거 스펙**: 00-44 §7-5(말풍선: 바깥 누르면 닫힘) · §7-6(10-21 판정: ⑥ 내용 바꾸기 창도 바깥 누르기 안 닫음 · 문서 폭 = 바깥 폭, 캔버스 box-sizing 차이는 편차 아님) · §7-2(데스크톱 목록 줄 상태 = 바탕 없는 글자 · 마지막 줄 아래 점선) · 시안 판 03(견적 신청 카드)·판 06(도움말 풍선).
  - **건드린 파일**: `eobomDev/frontend/src/redesign/` 안만 — `parts/parts.css` · `parts/RdNotices.tsx` · `pages/PartsPage.tsx`(+ 이전 커밋 bc9a62a의 견적 신청 카드·초점 칸). 지금 화면 파일·서버·DB 0.
  - **결과**: ① 견적 신청 카드를 판 03에 대조, 초점 칸·말풍선 열린 모양 보완(bc9a62a). ② 말풍선 풍선 폭 360 · 위치는 스크립트가 잰 top 그대로(여백 더하지 않음) · 용어 한 줄(`RdTipHost term`) 정렬 · 글 속 ?는 좌우 -8 겹침(16aa41a). ③ **바깥 누르기 무시를 `defaultOpen`에서 분리** — `RdHelpTip`·`RdSourceTip`에 견본 전용 `keepOpen` 추가. `defaultOpen`은 "처음부터 열림"만 뜻하고 바깥을 누르면 닫힌다(§7-5). `/preview/parts` "말풍선 열린 모양" 견본만 `keepOpen`을 켜고, 그 설명 문구를 실제 동작에 맞춤. ④ §7-6(⑥ 창)·§7-2(데스크톱 목록 줄)는 이미 그렇게 구현돼 있어 코드 변경 0. 빌드: `npm run build` tsc 오류 0, 통과.
  - **편차**: 미디어 쿼리 밖에 둔 새 규칙은 **데스크톱·모바일 양쪽에 걸리는 것이 의도**다 — `.rd-help__pop{margin-top:0}`(풍선 위치를 두 폭 모두 스크립트가 재므로 여백이 더해지면 안 됨) · `.rd-tiphost--term`(용어 한 줄 정렬, `term` 쓸 때만) 및 그 안의 `.rd-help__pop{top:calc(100%+2px)!important}`(줄 높이 = 누르는 자리 44 → 두 폭 같음) · `.rd-help__btn{margin-inline:-8px}`(누르는 자리 44의 빈 곳 때문에 생기는 글과의 간격, 두 폭 같음). 다만 모바일 판(`*_M`)에서 이 값을 시안과 따로 재지는 않았음.
  - **다음 에이전트가 알아야 할 것**: (a) 실제 화면에서 `keepOpen`을 쓰지 말 것(견본 전용). (b) ⏸ 사람의 `/preview/parts` 대조는 그대로 남음. (c) 커밋은 사람 — 위 3파일은 이미 16aa41a에 들어 있고, 이번 정리분(`RdNotices.tsx`·`PartsPage.tsx`·walkthrough)만 미커밋.

<!-- Gemini 판정 1줄: ✅통과 / ❌반려(사유) / 🔄스펙갱신(고친 문서) -->

---
## 2026-10-21 | [Sonnet] 디자인 개편 8단계 묶음 1 — 기반(미리보기 틀 · 색·글자·폭 · 헤더 · 메뉴 펼침 · 바닥글)

- **근거 스펙**: docs/00_핵심플랫폼/00-44 §3~§5(특히 §5-5) · §9-4 묶음 1 · 시안 = 랜딩 캔버스 `Menu_Desktop`·`Menu_Mobile`·`Menu_Mobile_Scroll`·`Main`(헤더·바닥글) / 0단계 판 01은 §3~§5 표로 갈음(캔버스 판 파일은 열지 않음)
- **건드린 파일**: eobomDev/frontend/src/main.tsx(진입점만 — 내용은 `legacyMain.tsx`로 `git mv`, 한 줄도 안 고침) · 신규 `src/legacyMain.tsx`(옛 main.tsx 그대로) · 신규 `src/redesign/`(`main.tsx` · `PreviewApp.tsx` · `redesign.css` · `nav.ts` · `layout/RdLayout·RdHeader·RdMenuPanel·RdMenuSheet·RdFooter·KakaoIcon.tsx` · `pages/FoundationPage.tsx`). 지금 화면 파일(`App.tsx`·`index.css`·`design-v2.css`·`components/`·`pages/`) 0. 서버·DB 0.
- **결과**: `/preview`(메뉴·링크에 안 넣음)에서 새 헤더 · 메뉴 펼침(데스크톱 한 판 차례형 / ≤767 전체 화면 판 + 연락처 묶음 + 고정 [로그인]) · 데스크톱 두 줄 바닥글 띠(모바일은 바닥글 없음)가 열림. 색·글자·폭 값은 `.rd-root` 아래 `--rd-*`. Gowun Batang은 `redesign.css`의 `@import`로만 불러옴(`index.html` 무수정). 재현: `cd eobomDev/frontend && npm run build` → tsc 오류 0, 빌드 통과, 새 CSS는 별도 파일(`dist/assets/main-*.css` 8.9KB)이고 옛 CSS(`legacyMain-*.css`)와 분리됨. **실기동 검증 대기**(1280 · 1920 · 휴대폰 폭은 사람).
- **편차**: ① 새 CSS 격리 방식 = `main.tsx`가 `/preview*`일 때만 `redesign/main`을, 아니면 `legacyMain`을 동적 import(지시 "방식은 구현이 정함"). 그 결과 `main.tsx` 한 파일이 구조가 바뀜(옛 화면 로직은 그대로, CSS가 비동기 청크로 분리 로드) — 운영 첫 화면 로딩에서 CSS가 JS 청크와 함께 오므로 깜빡임은 없을 걸로 보나 **운영 화면에서 한 번 확인 요망**. ② 제1부 표제색 `#8A7E70` → `#6E6255`(00-44 §3 지시대로). 시안은 열려 있는 쪽 표제만 먹색이고 다른 쪽이 흐린 상태였고, 스펙에 반대쪽을 연 상태가 없어 **눌러서 연 쪽 표제 = 먹색 / 다른 쪽 = `#6E6255`** 로 대칭 구현(시안 3판은 제2부를 연 상태와 일치). ③ 헤더 누르는 면 44 보장을 위해 링크에 `margin-block:-6px`(줄 높이는 시안 여백 28 그대로). 그 밖에 스펙과 다른 곳 없음.
- **다음 에이전트가 알아야 할 것**: (a) [로그인]은 미리보기에 로그인 상태·창이 없어 `onLogin`이 비어 있음(눌러도 변화 없음) — 묶음 2의 창 · 묶음 3 이후에 연결. (b) 메뉴·바닥글 링크는 지금 화면 경로(`/ending-note` 등 `<a href>`, 전체 새로고침)로 나감 — 교체 전엔 옛 화면이 열리는 게 맞음. (c) 이메일은 `config.ts` `CONTACT_EMAIL`(임시값 `test@example.com`) 그대로 노출 — 오픈 전 교체 대상(context.md). (d) `useIsMobile` 기준은 768인데 스펙은 767 → 새 코드는 `MOBILE_MAX=767`과 CSS 미디어쿼리만 씀(옛 훅 안 씀). (e) 브랜치는 이미 `redesign`(origin에도 있음)이라 새로 만들지 않음. 커밋은 사람. (f) 같은 파일(`main.tsx`)을 건드린 걸 기억할 것 — 10단계 교체 때 `legacyMain` 분기를 걷는다.

<!-- Gemini 판정 1줄: ✅통과 / ❌반려(사유) / 🔄스펙갱신(고친 문서) -->

---
## 2026-10-21 | [Sonnet] 디자인 개편 8단계 묶음 0 — 운영자가 내린 추모관 수정 거부(서버)

- **근거 스펙**: docs/00_핵심플랫폼/00-44 §9-4 묶음 0 → 00-36 §4.9 #4(서버 부분) · 05-01 §4.2(PATCH 줄, 10-16 개발자 결정)
- **건드린 파일**: eobomDev/backend/src/controllers/memorialController.ts (1곳, `updateMemorial`). 화면·DB 스키마·마이그레이션·테스트 파일 0.
- **결과**: `PATCH /api/memorials/:id`가 소유권 확인(404) 직후 `existing.hiddenAt`이 있으면 403 `운영자가 비공개 처리한 추모관은 수정할 수 없습니다.`로 거부하고 `prisma.memorial.update`를 부르지 않음. 재현: `cd eobomDev/backend && npx tsc --noEmit` 오류 0. DB 쓰기 없음(백업 해당 없음).
- **편차**: 없음. 확인할 점: 스펙이 상태 코드를 안 정해 403으로 함(본인 추모관임을 확인한 뒤라 존재 여부가 새지 않음). 다른 코드를 원하면 한 줄 수정.
- **다음 에이전트가 알아야 할 것**: 이 거부용 자동 테스트는 안 만듦(`tests/`의 추모관 테스트는 DB 필요, 지시 범위 밖) — 필요하면 `memorial-link-and-inactive.test.ts`(L159에 hiddenAt 세팅 예시)에 추가. 프론트는 이 403 메시지를 아직 별도 처리하지 않음(관리 화면 [수정] 숨김은 00-36 §4.9 #4 화면 쪽, 8단계 후속 묶음). 실기동 안 함.

<!-- Gemini 판정: ✅통과 (00-36 §4.9 #4 · 05-01 §4.2 스펙대로 PATCH /api/memorials/:id hiddenAt 존재 시 403 거부 및 DB update 차단 확인) -->

---
## 2026-10-21 | [Sonnet] 운영자 회원 상세 열람 사유 필수 + 처리방침 제7조 연락처 칸

- **근거 스펙**: docs/00_핵심플랫폼/00-37 §7 #1(10-15 확정: 사유 입력 필수·전건 기록) · 00-19 제7조 편집자 주(10-15, 연락처 4칸)
- **건드린 파일**: eobomDev/backend/src/controllers/adminController.ts, middleware/adminAudit.ts, services/opsLogService.ts, tests/ops-log.test.ts · eobomDev/frontend/src/pages/AdminPage.tsx, pages/PrivacyPage.tsx. DB 스키마·마이그레이션 0(`AdminAuditLog.reason` 칸은 이미 있음).
- **결과**: `GET /api/admin/users/:id`는 `?reason=`이 없거나 공백이면 400(데이터 없음, FAIL 기록), 있으면 `AdminAuditLog.reason`에 저장(기존 `maskText`·200자 절단 적용). 화면은 상세 열기 전 `window.prompt`로 사유를 받고 취소·빈 값이면 요청 자체를 안 보냄. `PrivacyPage` 제7조 표에 연락처 칸 추가(Vercel privacy@vercel.com · Google googlekrsupport@google.com · Render privacy@render.com · Cloudflare dpo@cloudflare.com, 00-19 제7조 표와 동일). 재현: `cd eobomDev/backend && npx tsc --noEmit` 오류 0 · `node --require ts-node/register/transpile-only --test tests/ops-log.test.ts` 25건 통과(사유 없음 400 테스트 신설, 기존 상세 호출 3곳에 `?reason=` 추가) · `cd eobomDev/frontend && npm run build` 통과. 명도 대비(00-39 §3)는 지시대로 안 함(8단계).
- **편차**: 없음. 확인할 점: 00-37 §7 #1은 "화면은 상세 열기 전 사유 입력"만 정해 입력 방식은 기존 확인창과 같은 `window.prompt`로 함(디자인 개편 때 모달로 바뀔 수 있음).
- **다음 에이전트가 알아야 할 것**: 사유는 쿼리 문자열로 전달돼 Render 접근 로그에 URL이 남을 수 있음(`maskText`는 DB 저장분만 가림) — 문제가 되면 헤더·POST 방식으로 바꿀 것. `/api/admin/users/:id`를 부르는 곳은 `AdminPage.openMember` 하나뿐. 실기동은 안 함(개발서버 기동 안 함). 00-19 제7조 Render 행은 제3자 사본 확인분이라 게시 전 원문 재확인 대기(00-19 편집자 주).

<!-- Gemini 판정: ✅통과 (00-37 §7 #1 스펙대로 회원 상세 ?reason= 미제공 시 400 및 감사로그 사유 저장, 00-19 제7조 연락처 표 반영 확인) -->

---
## 2026-10-16 | [Sonnet] 마케팅 정보 수신 동의 칸 빼기 (프론트 + 캔버스 3곳)

- **근거 스펙**: docs/00_핵심플랫폼/00-28 §9 #2 (10-16 개발자 결정: 받지 않음 · DB 그대로) · 00-36 §4.5·§4.5-1
- **건드린 파일**: eobomDev/frontend/src/components/ConsentFields.tsx, LoginModal.tsx, ConsentRequiredModal.tsx, mypage/ConsentModal.tsx, pages/MyPage.tsx(주석), mypage/MyPageProfile.tsx(주석). backend·DB·마이그레이션 0. 캔버스(바탕화면·클라우드, 코드 아님): 묶음 4(4-16·4-19 4장) · 묶음 2(4-9 2장) · 바탕화면 이어봄_디자인_4단계_목록.md
- **결과**: 회원가입 탭·재동의 창에서 마케팅 체크박스·상태·`consentMarketing` 쿼리·`marketing` 요청 필드 삭제, "전체 동의" = 약관·개인정보 둘. `ConsentCheckbox`의 `required` 인자는 항상 참이라 삭제. 마이페이지 개인정보·동의 모달은 마케팅 토글·저장(PATCH `marketingAgreed`)·`ApiError` 사용 삭제 → 동의 날짜 표시 + 탈퇴 안내 + [닫기]만. 재현: `cd eobomDev/frontend && npx tsc --noEmit` 오류 0. 프론트 `src`에 `arketing` 검색 0건(`PrivacyPage` 47행 "마케팅 수신 동의를 받지 않습니다"는 의도대로 유지). 프론트 테스트 스크립트 없음.
- **편차**: 없음
- **다음 에이전트가 알아야 할 것**: 백엔드는 코드로만 확인(손대지 않음): `authRoutes.ts` 54행 `req.query.consentMarketing === '1'`이라 쿼리가 없으면 `false` → `marketingAgreedAt: null`, 동의 이력(`signupConsentEvents`)에 MARKETING 안 남음. `profileController.ts` 98~124행 `body.marketing === true`일 때만 기록해 필드가 없으면 건너뜀. 둘 다 오류 없이 "기록 안 함". 이전에 가입해 `marketingAgreedAt`이 채워진 회원은 DB에 그대로 남고 화면에서 고칠 길이 없음(결정 "DB 그대로"). `PATCH /api/me/profile`의 `marketingAgreed` 처리 코드는 이제 호출처 없음(삭제 여부는 백엔드 정리 때 별도 결정). 실기동은 안 함(개발서버 기동 안 함).

<!-- Gemini 판정 1줄: ✅통과 / ❌반려(사유) / 🔄스펙갱신(고친 문서) -->

---
## 2026-10-15 | [Sonnet] 추모관 공개 화면 불러오는 중 → 회색 뼈대

- **근거 스펙**: 스펙 문서 없음 — 개발자 결정 10-15 "지금 만든다"(바탕화면 `이어봄_디자인_3단계_목록.md` 확정 사항 ②). 본보기 = `ObituaryLandingPage.tsx`의 `ObituaryLandingSkeleton`
- **건드린 파일**: eobomDev/frontend/src/pages/MemorialLandingPage.tsx (1개)
- **결과**: `MemorialLandingSkeleton` 추가, loading 분기가 `<p className="v2-obit-notfound-sub">불러오는 중...</p>` 대신 이것을 렌더. 틀 `.v2-obit-content > .v2-obit-box` 안에 ① 머리(링크 복사 버튼 자리 `.v2-obit-copy-btn` · 근조 문구 160×13 · 이름 190×28 · 별세일 120×13) ② 방명록 묶음(제목 80×16 + 행 3개: 이름·날짜 한 줄 + 글 한 줄) ③ 헌화 줄(왼쪽 버튼 자리 · 오른쪽 숫자 글 + 버튼 자리). 영정 자리 없음. 인라인 스타일은 폭·높이·margin만, 새 CSS 없음(design-v2.css 변경 0). 연장·초대 페이지 변경 0. 검증: `npx tsc --noEmit`(frontend) 통과, `npm run build`(frontend) 통과.
- **편차**: 없음
- **다음 에이전트가 알아야 할 것**: ✅ **실기동 검증 완료(10-15)** — 개발자가 네트워크 속도를 늦춰 확인: 뼈대가 실제 페이지와 맞는 위치에 뜸. 추가 작업 없음.

<!-- Gemini 판정 1줄: ✅통과 / ❌반려(사유) / 🔄스펙갱신(고친 문서) -->

---
## 2026-10-15 | [Sonnet] 시설 태그 2분류 걸러보기 + 데이터 정리

- **근거 스펙**: docs/01_장사시설_매칭/01-06_시설_태그_분류_체계_명세서.md §2·§3·§4
- **건드린 파일**: eobomDev/backend/src/controllers/facilityController.ts, eobomDev/backend/prisma/import-facility-csv.ts, eobomDev/backend/prisma/import-facility-mohw.ts, eobomDev/backend/prisma/report-facility-tags.ts(신규·읽기 전용), eobomDev/backend/prisma/cleanup-facility-tags.ts(신규), eobomDev/backend/package.json(`report:tags`·`cleanup:tags`), eobomDev/frontend/src/components/facility/tagCatalog.ts, eobomDev/frontend/src/pages/FacilityPage.tsx, .harness/memory/context.md
- **결과**: 서버 `GET /api/facilities`가 `tag` 대신 `owner`·`kind`(쉼표로 여러 값)를 받음 — 같은 분류는 `hasSome`, 분류끼리 AND. 화면: 데스크톱 분류별 두 줄 칩, 모바일은 필터 판 안 두 줄 + 요약 줄 끝에 고른 값(말줄임), 카드 태그는 데스크톱만, 주소창 `?owner=&kind=` 유지. 가져오기 스크립트는 §2 값만 태그에 넣고 CSV는 `source: 'mohw_csv'`. 운영 조회(`report:tags --target prod`) = 로컬과 동일(2,024곳). 로컬 DB 정리(백업 `local-20261015-140155.dump` 확인 후 `cleanup:tags --target local --apply`): 시드 2곳 삭제(`f_gyeonggi_2`·`f_jeju_2` — 이름·주소로 `bongan_225`/`jayeon_071`·`bongan_679~681`과 같은 시설 확인, 상담·리뷰·클레임 0건), 천안 시드(`f_chungcheong_2`) 태그 비움·source=manual, 봉안당 690·자연장 258 추가, source 948 kakao→mohw_csv. 정리 후 2,022곳, 분류 밖 태그 0. 검증: `npx tsc --noEmit`(backend), `npm run build`(frontend) 통과. 화면은 개발자가 실화면 확인("잘 적용됨").
- **편차**: ① `01-06` §3 "분류마다 하나씩 고른다"와 달리 같은 분류 안에서 여러 개 선택 가능(개발자 추가 결정 10-15) — [Opus] 개정 요청을 남겼고 `01-06` §3·§4에 반영됨(`context.md` 10-15). ② §4 "시드 3곳 삭제 여부는 따로 묻는다" → 개발자 지시로 짝이 있는 2곳 삭제·천안 1곳 유지. ③ 원인 확인 결과: `source=kakao`는 `import-facility-csv.ts`가 source를 안 넣어 DB 기본값이 들어간 것(카카오 스크립트가 덮은 게 아님).
- **다음 에이전트가 알아야 할 것**: ✅ **운영 DB 정리는 개발자가 직접 실행 완료**(`backup-db.ps1 -Target prod` → `cleanup:tags --target prod` 확인 → `--apply` → `report:tags --target prod`, 10-15)하고 결과는 Opus 점검까지 받음 — 개발자가 붙여준 `report:tags --target prod` 결과: 2,022곳 · source mohw 1,073 / mohw_csv 948 / manual 1 · 태그 사설 1,621·봉안당 690·병원 576·전문 493·공설 400·자연장 258·태그 없음 1 · 분류 밖 태그 0 = 로컬 정리 후와 전 항목 동일. `db-safety.md` §2-2 표에 `report:tags`·`cleanup:tags` 한 줄 추가함. `seed.ts`·`seed-data/facilities.json`에 옛 마케팅 태그가 남아 있어 시드 재적재하면 분류 밖 태그가 다시 들어옴(손대지 않음). 기존 행 갱신(upsert update)은 태그를 건드리지 않으므로 재가져오기로는 기존 행 태그가 안 바뀜.

<!-- Gemini 판정 1줄: ✅통과 / ❌반려(사유) / 🔄스펙갱신(고친 문서) -->

---
## 2026-10-15 | [Sonnet] 옛 목업 폴더 `_mockups/` 삭제

- **근거 스펙**: 스펙 없음 — 개발자 승인(10-15, 권고 A). 사유: `src/` 참조 0건, 디자인 정본은 캔버스로 이동(09-18)
- **건드린 파일**: eobomDev/frontend/_mockups/ 전체 삭제(EndingNotePage·FarewellMessagePage·Modals_BottomSheet·MyObituaryListPage·MyPage·ObituaryPage .html 6개, 전부 git 추적 파일 → 커밋 기록에서 복구 가능)
- **결과**: 삭제 전 파일 목록을 개발자에게 보이고 "삭제" 확인을 받음. 삭제 후 eobomDev 안(node_modules·dist·backups 제외) `_mockups` 참조 0건, `npm run build`(frontend) 통과. Modals_BottomSheet.html 132행의 옛 동의 문구도 함께 사라짐.
- **편차**: 없음
- **다음 에이전트가 알아야 할 것**: 없음. 커밋은 사람이 한다.

<!-- Gemini 판정 1줄: ✅통과 / ❌반려(사유) / 🔄스펙갱신(고친 문서) -->

---
## 2026-10-15 | [Sonnet] 판 2-9 제3자 제공 동의 "보유 기간" 문구 변경

- **근거 스펙**: `00-19` 제5조 표 · `01-05` §7.1 · `02-03` §8 (10-15 개발자 결정)
- **건드린 파일**: 판 2-9 캔버스 Inq_D·Inq_M · InquiryModal.tsx · ConsultRequestModal.tsx · PrivacyPage.tsx(제5조 표 3행) · leadService.ts · consultService.ts
- **결과**: 시설 상담 창 "문의가 끝날 때까지(최대 접수일부터 90일)", 전문가 상담 창 "상담이 끝날 때까지(최대 신청일부터 90일)". 처리방침 표는 `00-19` 문구 그대로. `retention` 문구 교체 + `noticeVersion` 2026-10-15(옛 동의 기록 불변). backend·frontend `tsc --noEmit` 통과.
- **편차**: 유품 업체 동의 창은 코드에 없어 표(PrivacyPage)만 `00-19`에 맞춤. 유품 정리 캔버스(`JtF68LBg…`)는 미확인.
- **다음 에이전트가 알아야 할 것**: 유품 정리 시안에 옛 문구가 남아 있는지 확인 필요.

<!-- Gemini 판정 1줄: ✅통과 / ❌반려(사유) / 🔄스펙갱신(고친 문서) -->

---
## 2026-10-15 | [Sonnet] migrate-prod 도구 수정 — node 못 찾는데 "[O] 완료"를 찍은 사고

- **근거 스펙**: 스펙 없음 — 도구 결함 수정(개발자 요청, 10-15 사고)
- **건드린 파일**: .harness/tools/migrate-prod.ps1 · migrate-prod.bat(CRLF·ASCII 유지) · .harness/memory/context.md
- **사고 기록**: 바탕화면 바로가기(`운영DB적용.lnk` → `migrate-prod.bat`)로 실행하면 PATH에 node가 없어 `npx`를 못 찾았다. ps1은 오류 검사 없이 `[2/4] migrate status`·`[4/4] migrate deploy`를 그냥 지나갔고(명령 못 찾음은 `$LASTEXITCODE`를 바꾸지 않는다), try에 catch가 없어 끝의 "[O] 운영 마이그레이션 완료"까지 내려갔다. 실제로는 확인도 deploy도 안 돌아 운영에 10-14 L-2 마이그레이션이 반영되지 않았다(백업만 생김, 운영 DB 불변 — 이후 사람이 터미널로 반영).
- **결과**: ① 백업 전에 node·npx 검사, 없으면 `C:\Program Files\nodejs`를 PATH 앞에 붙여 재검사, 그래도 없으면 Fail. ② `catch` 추가(도중에 끊기면 Fail) · `Fail`이 DB 상태 문구를 인자로 받음(적용 중 실패는 "일부 바뀌었을 수 있음") · `migrate status`는 출력 문구로 "대기 있음(정상)"과 "status 자체 실패"를 가름 · 적용 후 확인이 0이 아니면 Fail. ③ bat: 같은 PATH 보강, node 없거나 생성기가 실패하면 "SPEC REGENERATION FAILED", 끝에 ps1 종료코드로 "MIGRATION DID NOT COMPLETE"/"Migration finished" 표시. ④ 점검: `backup-verify.ps1`·`restore-db.ps1`·`db-url.ps1`은 같은 결함 없음 — `&` 호출 뒤 즉시 `$LASTEXITCODE`를 검사하고, `backup-verify`는 `Invoke-Target`이 try/catch, `restore-db`는 `Stop`이라 명령 못 찾음이 곧 종료(완료 표시 도달 불가). 파싱 검사 4개 통과. 시험: node를 PATH에서 뺀 창에서 (a) 설치 폴더 있으면 보강 후 통과 (b) 없으면 `[X]`+exit 1 (c) bat 보강 줄 동작 · bat 실패 표시 확인. 🔴 운영 대상 실행은 하지 않았다(검사 구간만 잘라 시험).
- **편차**: 없음. 판단 하나 — `migrate status` 출력 문구(`have not yet been applied`)에 기대어 구분한다. Prisma 문구가 바뀌면 "대기 있음"이 status 실패로 오판돼 멈추는 쪽(안전한 쪽)으로 실패한다.
- **다음 에이전트가 알아야 할 것**: 운영 반영 자체는 사람이 터미널로 따로 마쳤다(context.md, 54건). 이번 수정이 바로가기에서 실제로 도는지는 다음 마이그레이션 때 사람이 한 번 확인해야 한다.

<!-- Gemini 판정 1줄: ✅통과 / ❌반려(사유) / 🔄스펙갱신(고친 문서) -->

---
## 2026-10-15 | [Sonnet] 백업+복구 시험 일괄 도구 — backup-verify.bat/.ps1 · restore-db.ps1 (db-safety §8-7·§8-4)

- **근거 스펙**: `.harness/db-safety.md` §8-7 (10-15 Opus 스펙) · §8-4 (restore-db)
- **건드린 파일**: .harness/tools/backup-verify.bat · backup-verify.ps1(BOM) · restore-db.ps1(BOM, 작성만) · db-url.ps1(신설·공용, BOM) · .harness/db-safety.md(§8 머리·§8-4·§8-5 표·§8-7 메모)
- **결과**: `backup-verify.bat` 1회 실행 — 로컬 [O](테이블 43, `local-20261015-115559.dump`) · 운영 [O](테이블 41, `prod-20261015-115606.dump`), 테이블·행 수 원본과 일치, 종료코드 0, 임시 컨테이너 정리 확인(`docker ps -a`에 `eobom-postgres`만). 시험 중 앞선 실행 2회가 실패해 백업 파일이 그만큼 더 생겼다(`backups/`에 쌓임, 지우지 않음). `restore-db.ps1`은 파싱 검사만 — **실행하지 않았다**(원래 DB 대상).
- **편차**: ① 시험 `pg_restore`에 `--no-privileges` 추가(스펙은 `--no-owner`뿐) — dump의 GRANT가 임시 컨테이너에 없는 역할(`anon`·`eobom_auditor` 등)을 가리켜 오류로 끝났다. 권한은 시험 대상이 아니라고 판단, §8-7 메모에 반영. ② 스펙 파일 목록에 없는 `db-url.ps1` 추가 — 운영 주소 읽기·검사를 backup-verify와 restore-db가 같이 써서 중복을 피함(backup-db.ps1은 건드리지 않음). 
- **다음 에이전트가 알아야 할 것**: 운영은 테이블 41·마이그레이션 53건, 로컬은 43·54건 — 운영에 `ConsentLog`·`EndingNoteViewLog`(L-2 10-14) 테이블이 아직 없다(운영 마이그레이션 미적용, 정상). 오픈 전 `restore-db.ps1`을 로컬 대상으로 한 번 시험해야 §8-3 ④·§8-4 ⑤가 검증된다. verify-log.txt는 `backups/`(gitignore) 안.

<!-- Gemini 판정 1줄: ✅통과 / ❌반려(사유) / 🔄스펙갱신(고친 문서) -->

---
## 2026-10-14 | [Sonnet] 버그 수정 — 메뉴로 페이지 진입 시 맨 위에서 시작하지 않음

- **근거 스펙**: 스펙 없음 — 버그 수정(개발자 관찰, docs 변경 없음)
- **건드린 파일**: eobomDev/frontend/src/lib/scroll.ts(신설) · src/App.tsx(top-scroll 이펙트·`setActiveTab` 위치 저장) · src/pages/EndingNotePage.tsx(`goToWillTab`) · src/pages/FacilityPage.tsx(`goToPage`)
- **결과**: 원인 확정(코드 읽기) — 641px 이상에서 `.main-wrapper`가 `height:calc(100vh - var(--header-h)); overflow-y:auto` 스크롤 패널(index.css:366)이라 `window.scrollTo`가 아무것도 안 움직였다(후보 3의 반대 방향: 데스크톱이 문제). 추가로 이펙트 deps가 `[activeTab]`이라 같은 탭 안 이동·메뉴 재클릭은 미발동(후보 1·2). `lib/scroll.ts`의 `getScrollY`/`scrollPageTo`가 `.main-wrapper`(overflow-y가 auto일 때)나 window 중 실제 스크롤 주체를 골라 쓰고, 이펙트 deps를 `[location.key]`로 바꿨다. 후보 4는 충돌이 아니라 같은 window 문제(두 곳을 같은 함수로 교체). `tsc -b`·`npm run build` 통과. **실기동 확인은 하지 않았다**(개발 서버 정책 — 사람이 확인).
- **편차**: 없음. 판단 하나 — 이펙트는 REPLACE와 "같은 경로에서 검색어만 바뀐 이동"(엔딩노트 탭 전환 `setSearchParams`)은 건너뛴다(이전에도 맨 위로 안 갔고, 가면 탭 전환마다 튀어 오른다). 같은 URL을 PUSH하는 메뉴 재클릭은 맨 위로 간다. 홈 `?entry=` 예외(`skipHomeTopScroll`)는 그대로.
- **다음 에이전트가 알아야 할 것**: 확인 요청(사람) — 데스크톱·모바일 폭에서 메뉴 전 항목 진입 / `/memorial`→상세 / 같은 메뉴 재클릭 / 뒤로가기 복원. 뒤로가기 복원은 `setActiveTab`으로 떠날 때만 위치를 저장하는 기존 구조 그대로라, `Link`로 상세에 갔다 돌아오면 목록 위치는 복원되지 않는다(기존 한계, 이번에 안 건드림).

<!-- Gemini 판정 1줄: ✅통과 / ❌반려(사유) / 🔄스펙갱신(고친 문서) -->

---
## 2026-10-14 | [Sonnet] 로그 L-2 — 동의 이력(D) · 사후개봉 열람 기록(E) · 파기 기록 일원화(F)

- **근거 스펙**: docs/00_핵심플랫폼/00-42_운영_기록_로그_설계서.md §5.3 "L-2 구현 기준"(배경 §4.3~4.5, 공통 §5.2)
- **건드린 파일**: eobomDev/backend/prisma/schema.prisma(`ConsentLog`·`EndingNoteViewLog` 신설, `PurgeRunLog`에 `executor`·`targetIds` 칸, User·EndingNote 역참조, 주석 "건수만 남긴다"→"내용은 남기지 않는다 — 내부 id·건수만") · prisma/migrations/20261014120000_add_consent_view_log_and_purge_run_columns/migration.sql(추가형 + `createdAtKst` 트리거 2개) · prisma/destroy-farewell-media.ts(④ ACCOUNT_PURGE·⑤ MEMORIAL_PURGE에 대상 id, ⑫ 동의 이력·⑬ 파기 기록 단계) · src/config/policy.ts(`consentVersion: 'v0.9'`, `retention.consentLogYearsAfterPurge`·`purgeRunLogYears`) · src/services/consentLogService.ts(신설) · src/services/endingNoteViewLogService.ts(신설) · src/services/retentionPurgeService.ts(`recordPurgeRun` 확장 + 동의 이력·파기 기록 보관 파기) · src/services/opsLogPurgeService.ts(3종 파기 기록) · src/controllers/authController.ts(가입 2곳 + 데모 로그인) · profileController.ts(`POST /api/me/consent`·`PATCH /api/me/profile`) · sttController.ts · endingNoteController.ts(`getFamilyVisibleEndingNotes`·`getFamilyLetterAudio`) · tests/l2-logs.test.ts(신설) · package.json(test 목록에 추가) · docs/00_핵심플랫폼/00-05(generate-db-doc 자동 구간만)
- **결과**: D — 동의 칸이 바뀌는 5곳(가입 OAuth 콜백·`confirm-link` CREATE_NEW·데모 로그인 create·재동의·마이페이지 마케팅·STT 업로드)에서 User 변경과 같은 트랜잭션(중첩 쓰기 또는 `$transaction([…])`)으로 한 줄, 버전은 `POLICY.consentVersion` 한 곳. E — `family-view`는 응답에 실린 엔딩노트마다 한 줄, 편지 음성은 판정 통과 뒤 한 줄, 쓰기 실패는 503(본문 없음, 요청 번호 포함). F — 계정·추모관·운영 기록 3종·동의 이력·파기 기록 파기가 `PurgeRunLog`에 실행자·id 목록과 함께 남음, 기록 실패는 throw 없이 `false` + 콘솔 `🔴🔴🔴 파기 기록 실패`. 검증: `node --require ts-node/register/transpile-only --test tests/l2-logs.test.ts` 18/18 통과(재동의 롤백은 FK 위반을 실제로 일으켜 User 칸이 안 바뀜을 확인) · `npm test` 478건 중 473 통과 · `tsc --noEmit` 통과 · `generate-db-doc --check` 동기화(재생성 후) · `generate-api-doc --check` 동기화(라우트 변경 없음, 150개).
- **편차**:
  1. **열람 기록 `sections` 값** — 스펙이 값 목록을 정하지 않아 엔딩노트 섹션 코드 그대로 + 편지가 실리면 `LETTER`, 편지 음성은 `LETTER_AUDIO`로 정했다.
  2. **개봉 전 열람도 쌓인다** — 스펙 문구 "응답에 실린 엔딩노트마다"를 그대로 따라 `IMMEDIATE`로 연 개봉 전 응답도 한 줄이다. 표 이름은 "사후개봉 열람"인데 `RELEASED` 여부 칸이 없어 구분되지 않는다. 사후만 남길지 칸을 더할지 판정 요청.
  3. **열람 기록은 단계가 아닌 Cascade로 삭제** — 스펙의 "보관 파기 3종" 중 열람은 배치 단계를 만들지 않았다(`EndingNoteViewLog.noteId` Cascade라 `accountPurgeService`의 `endingNote.deleteMany`가 함께 지움, 스펙 "엔딩노트 파기 시"와 같은 결과).
  4. **대상 id 목록은 계정·추모관만 채움** — 운영 기록 3종·소셜 해제·방명록·마스킹·`HEAVY_JOB_LOG`·동의 이력·파기 기록 단계는 건수가 수천 건일 수 있어 빈 배열이다.
  5. **실행자는 항상 `script`** — 파기 스크립트에 운영자 로그인이 없다. 운영자 계정을 넣으려면 스크립트가 운영자를 알아야 한다(별건).
  6. **마케팅 이력은 값이 실제로 바뀔 때만** — 이미 동의한 채 `marketingAgreed:true`를 다시 보내도 이력은 없다. 다만 기존 코드는 그때 `marketingAgreedAt`을 새 시각으로 덮어쓴다(이력과 칸 시각이 어긋날 수 있음 — 기존 동작 유지, 고칠지 판정 요청).
  7. **스펙 목록 밖 추가** — 데모 로그인 upsert의 create(동의 칸이 채워지는 곳)에도 가입 이력 한 줄. 반대로 `accountPurgeService`가 `marketingAgreedAt`을 null로 만드는 것은 이력을 남기지 않았다(파기 자체가 `ACCOUNT_PURGE`로 남고, 이력은 파기 후 1년 보관).
  8. **STT는 업로드마다 한 줄** — `sttDataAgreedAt`이 업로드마다 갱신되므로 매번 `STT_DATA`/`AGREE`. 이력 쓰기 실패는 기존처럼 변환을 막지 않고(User 칸과 이력이 같이 롤백) 콘솔 오류만.
- **다음 에이전트가 알아야 할 것**:
  - 🔴 **운영 반영은 사람이 `migrate-prod.ps1`** — 추가형(표·칸 추가, 기존 행 변경 없음)이라 순서는 `migrate-prod.ps1` → push. 로컬은 백업(`eobomDev/backend/backups/local-20261014-135009.dump`, 571KB) 뒤 개발 DB `migrate deploy`·`_test` DB `test:db:migrate` 적용, `migrate diff` "No difference detected".
  - `npm run build`의 `prisma generate`가 `EPERM … query_engine-windows.dll.node`로 실패(실행 중인 node가 엔진 파일을 잡고 있음, 개발 서버로 추정). 타입은 생성됐고 `tsc --noEmit`은 통과. 서버를 내린 뒤 `npx prisma generate`를 한 번 더 돌려야 `npm run build`가 끝까지 간다.
  - `npm test`의 실패 3건은 `heavy-job-http.test.ts`(502≠504 등)이고 **이 작업 전(`git stash`로 되돌린 상태)에도 같은 3건이 실패**했다 — 이 작업과 무관.
  - 실제 OAuth 가입 콜백·`confirm-link`·STT 업로드 HTTP와 편지 음성 503은 외부 의존(소셜·CLOVA·R2)이라 자동 시험이 없다 — 가입은 같은 `signupConsentNested`를 쓰는 `User.create` 중첩 쓰기로, STT·음성은 코드 경로 검토와 `tsc`로만 확인.
  - `family-view` 왕복이 2→3회(열람 기록 1회)로 늘었다(운영 Render↔DB 약 +1.3초, 주석 갱신).
  - `00-05` 자동 생성 구간이 바뀌었다 — `[Opus]`가 `docs-ledger check`→`ack`. `00-42` §5.3의 "🟡 미이행" 표기(§5.2-6)와 `00-19`·`00-04` 갱신은 Opus 몫.

<!-- Gemini 판정 1줄: ✅통과 / ❌반려(사유) / 🔄스펙갱신(고친 문서) -->

---
## 2026-10-14 | [Sonnet] 공개 전 코드 묶음 — 명도 대비(옛 회색 글자 → `var(--v2-text-muted)`)

- **근거 스펙**: docs/00_핵심플랫폼/00-39_디자인_기준_재정립_명세서.md §3 색 표 아래 "10-14 명도 대비 정리"
- **건드린 파일**: eobomDev/frontend/src/index.css(`--text-muted`·`--text-hint` 토큰 값) · styles/design-v2.css(한 곳) · components/common/Badge.tsx · components/KakaoMapModal.tsx(2곳) · components/home/HomeDesktop.tsx · HomeMobile.tsx · pages/EndingNotePage.tsx(인쇄용 CSS)
- **결과**: 글자색 옛 회색(`#6C7A89`·`#94A3B8`·`#9CA3AF`)을 `#5C6773`(var)로 통일. 토큰 두 개를 var로 바꿔 `--text-muted`/`--text-hint`를 쓰는 곳도 따라감. `tsc -b` 통과 · `npm run build` 통과(실기동은 사람).
- **편차**: 없음. 글자가 아닌 것은 남김 — `HomeMobile.tsx:239`·`ObituaryPage.tsx:695` 화살표 아이콘, `EndingNotePage.tsx:523` 서명 테두리선, Badge 준비 중(`#475569`).
- **다음 에이전트가 알아야 할 것**: `--text-muted`가 전역으로 약간 어두워짐(개발자 확인: 큰 차이 없어 그대로 진행). `#8A9199`·`#A29B90`은 범위 밖.
- **보정(10-14)**: `EndingNotePage.tsx` 인쇄 창(`window.open`+`document.write`)의 `.print-date`는 새 창에 design-v2.css가 없어 변수가 안 풀리므로 `#5C6773` 값으로 되돌려 박음(00-39 §3 보강 반영). 나머지는 그대로. tsc 통과.

<!-- Gemini 판정 1줄: ✅통과 / ❌반려(사유) / 🔄스펙갱신(고친 문서) -->

---
## 2026-10-14 | [Sonnet] 업무판 g2 두 건 — ① 유족 메시지 apiFetch 이관(확인 결과 이미 끝남) · ② 로그인 검사를 라우터 단위로 일괄 적용(동작 불변)

- **근거 스펙**: ① 00-34 §1 머리 "남은 빈틈" · §5.3 · §9 2단계 / R300 Ⅹ장 6번 · ② 정본 스펙 없음 — R300 Ⅳ장 3 · Ⅹ장 8번(운영자 묶음 `requireAdminAuth`와 같은 방식, 00-37 A-1 #1)
- **건드린 파일**: ① 없음(코드 변경 0) · ② eobomDev/backend/src/middleware/requireAuth.ts(신규) · routes/ 11개 — farewellMessage · endingNote · me · partner · expert · familyDesignation · memorial · obituary · facility · expertPublic · auth · 증빙 도구 .harness/tools/probe-route-auth.js(신규) · .harness/_meta/route-auth-map_261014_before.tsv(신규)
- **결과**:
  - ① `FarewellMessageCard`·`FarewellMessagePage`의 직접 `fetch`는 **10-12 `b8a6ef6`에서 이미 9곳 전부 `apiFetch`/`apiFetchRaw`로 이관 끝**(위 10-12 항목 참고). 지금 두 파일에 직접 `fetch(` 0곳 — 봉투 응답은 `apiFetch`, 음성 재생·반출 zip은 `apiFetchRaw`(§5.3). 이번엔 코드를 고치지 않았다. 업무판 항목만 낡아 있었다.
  - ② 라우터 단위 검사 적용: **전부 로그인 필수** 라우터는 `router.use(requireUserAuth)` 1줄(farewell-messages · ending-note · me). **공개 몇 개 + 나머지 로그인**인 라우터는 공개를 위로 모으고 그 아래 `router.use`(partner · expert[공개 = signup·login·refresh] / family-designations[공개 2 = 초대 조회·거절] / memorials[공개 5] / obituaries[공개 3]). 라우터에 한 곳뿐인 경로는 라우트 인자로(facilities `/:id/quotes` · experts `/:id/consult-requests` · memorials 방명록 작성 · auth `/me`·`/unlink-provider`). 🔴 401 문구는 핸들러가 돌려주던 것과 같게 유지(묶음별 5종: `로그인이 필요합니다.` · `인증 토큰이 없거나 유효하지 않습니다.` · 방명록/업체 문의/상담 신청 전용 3종) — `requireUserAuth` · `requireUserAuthWith(문구)` · `requireUserTokenAuth` · `requirePartnerAuth` · `requireExpertAuth`.
  - **증빙(경로 × 인증 여부 diff 0건)**: `probe-route-auth.js`(테스트 DB `_test`에서 앱 라우트 150개를 무토큰·불량토큰으로 호출) 작업 전·후 표가 **바이트 단위로 동일**(`cmp` 일치). 인증 필요 113 · 공개/기타 37. 전 표 = `.harness/_meta/route-auth-map_261014_before.tsv`(후 표는 같으므로 따로 두지 않음, 재실행으로 다시 증명 가능). 공개 예외(비회원 헌화 · 공개 추모관/부고장 조회 · 초대 토큰 조회/거절 · 연장 링크 · OG · 공유 집계 · 소셜 로그인/콜백 · health · geo · 각 /status · 3종 로그인/가입/refresh)는 전부 그대로 비-401.
  - 검증: `tsc --noEmit` 오류 0 · `npm test` 460개 중 455 통과 · 2 skip · **3 실패 = `heavy-job-http`(STT·OCR 처리 시간 제한) — 변경을 치운 기준선에서도 똑같이 3 실패(이 작업과 무관, 기존 상태)**.
  - '공개 전 코드 묶음'(업무판 b05, ref docs-audit README §4)의 **'권한' 항목과의 겹침**: b05에는 '권한'의 구체 내용이 적혀 있지 않고 README §4에는 '권한 경계 테스트'(10-01 `a2a8b05`)만 있다 — 이번 작업과 **코드가 겹치지 않는다**(b05 쪽이 '권한'을 무엇으로 정의하는지는 미확정, 겹쳐 보이면 알려 주면 됨).
- **편차**:
  1. **STT·OCR·유언장 사진(`/api/stt`·`/api/ocr`·`/api/will-photos`)은 묶지 않았다** — 핸들러가 기능 스위치(꺼짐 = 404)를 인증보다 먼저 판정한다. 라우터 단위로 묶으면 스위치가 꺼진 환경에서 404가 401로 바뀌어 "동작 불변"이 깨진다. 이 셋은 핸들러 안 검사 그대로. 합치려면 스위치 판정을 미들웨어로 올리는 별도 결정이 필요하다 — 🔵 개발자 판단 대기.
  2. `router.use`를 건 라우터에서 **정의되지 않은 하위 경로**(예: `GET /api/me/없는경로`)는 비로그인일 때 404 → 401이 된다(운영자 묶음 `/api/admin`이 이미 그렇다). "정의된 경로" 기준의 판정은 불변.
  3. 핸들러 안의 `verifyBearerToken` + 401 분기는 **그대로 둔다**(신원 id를 거기서 꺼내 쓴다. 지금은 이중 검증). 지우는 건 후속 정리 — 이번엔 동작 불변을 증명하기 쉬운 범위로 한정.
  4. `/api/auth/:provider/link`는 토큰을 쿼리로 받는 별도 방식(OAuth 시작)이라 묶지 않았다.
- **다음 에이전트가 알아야 할 것**:
  - 🔴 **[Opus] 갱신 요청 ①** `00-34` §1 머리의 "🔴 남은 빈틈 하나 …" 문단과 §9 2단계 표의 해당 행이 낡았다 — 유족 메시지 화면은 10-12 `b8a6ef6`에서 이관 끝(직접 `fetch` 0곳). 그 문단을 "끝"으로 고치고 §8·§9 2단계 행도 ✅로(날짜 10-12). 위 표시 "51곳"·"12개 파일"은 09-01 당시 숫자라는 문구는 유지해도 됨.
  - 🔴 **[Opus] 갱신 요청 ②** `00-04` §6-1 자동 생성 구간이 낡았다(`node .harness/tools/generate-api-doc.js --check` = 79줄 차이) — 인증 칸이 "없음"이던 줄들이 `requireUserAuth` 등 미들웨어 이름으로 바뀐다. 인자 없이 재실행하면 된다(마커 밖은 안 건드림). 겸해서 `00-15` §1·`00-37` A-1에 "라우터 단위 인증 = `middleware/requireAuth.ts`(10-14)" 한 줄, R300 Ⅹ장 8번 "미해결"이면 닫힘 표시.
  - 새 라우트를 추가할 때: 로그인 필수 라우터면 아무것도 안 해도 보호된다. 섞인 라우터(memorials · obituaries · family-designations)는 **공개 라우트를 `router.use` 위에** 둔다.
  - 커밋 메시지 초안(② — 사람이 커밋): `refactor(backend): 로그인 검사를 라우터 단위로 일괄 적용 — requireAuth 미들웨어(동작 불변, 경로 150개 인증 판정 diff 0건) · STT/OCR/유언장 사진은 스위치가 앞서 제외` + 트레일러 `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`. ①은 코드 변경이 없어 커밋 없음.

<!-- Gemini 판정 대기 -->

---
## 2026-10-13 | [Sonnet] User.purgedAt 주석 현행화 (schema.prisma) + 00-05 재생성

- **근거 스펙**: 개발자 지시(10-13) — 09-30 결정. 정본 = `00-20` §6.3-2 · `06-05` §5.6-8-4 표
- **건드린 파일**: eobomDev/backend/prisma/schema.prisma (주석 1곳, 73행 — 코드·DB·마이그레이션 없음) · docs/00_핵심플랫폼/00-05_DB_요구사항_및_테이블_사전.md (`generate-db-doc.js` 산출물, purgedAt 행 1줄)
- **결과**: "추모관·부고장은 탈퇴 후에도 남는다(00-36 §6 #2)" → "부고장 = 계정 파기 때 삭제 · 추모관 = 탈퇴 요청 때 비공개, 30일 뒤 memorialPurgeService가 파기(09-30 결정 · 00-20 §6.3-2 · 06-05 §5.6-8-4)". `generate-db-doc.js` "모델 40개, 물리 컬럼 468개(설명 없음 0개)" · `git diff --stat` = schema.prisma 1파일 + 00-05 1줄만 변경
- **편차**: 없음 (두 정본 절은 지시문의 표기를 그대로 인용, 절 내용 대조는 하지 않음)
- **다음 에이전트가 알아야 할 것**: 없음

<!-- Gemini 판정 1줄: ✅통과 (00-20 §6.3-2 및 06-05 §5.6-8-4 결정에 따른 User.purgedAt 주석 현행화 및 00-05 DB 명세 동기화 확인) -->

---
## 2026-10-13 | [Sonnet] DB 주석 § 표기에 문서 번호 붙이기 (schema.prisma) + 00-05 재생성

- **근거 스펙**: 업무판 "DB 주석 § 표기에 문서 번호 붙이기 (추모관 낡은 절 번호 포함)" (10-13 개발자 B안). 기준 문서 = 구역 머리 주석 · 테이블별 정답표 = 보고서 tools/db2md.js `SECREF` · 추모관·디지털 계정 구역 대응표 = Opus 판정(업무판 본문)
- **건드린 파일**: eobomDev/backend/prisma/schema.prisma (주석만, 약 95줄 — 코드·DB 변경 없음) · docs/00_핵심플랫폼/00-05_DB_요구사항_및_테이블_사전.md (`generate-db-doc.js` 산출물)
- **결과**: 예) `// 헌화(§4.4) … 해시만(§9.1-6)` → `// 헌화(05-01 §2.4) … 해시만(05-01 §7.1-5)` · `(§4.2, §6.1)` → `(05-01 §2.1, 05-01 §4.1)` · `(§5.2-1, §6.3-1)` → `(00-20 §5.2-1, 00-20 §6.3-1)` · `(§1.1-2, §3.3, §9.1-1)` → `(04-01 §1.1, §3.3, §8.1)`. 이미 `01-05 §4.4`처럼 붙은 곳은 그대로. `npx prisma validate` "valid" · `npx tsc --noEmit` 오류 0 · `generate-db-doc.js` "모델 40개, 물리 컬럼 468개(설명 없음 0개)" · `--check` "동기화됨". 확인: 원고 사본(scratchpad)에 `node db2md.js <사본> "2026. 10. 13."` → "설명 속 문서 번호 없는 § 표기의 기준 문서" 줄 **0개**(생성 줄 기준; 원고 v0.3 이력 표의 서술 1줄은 문장이라 제외)
- **편차**: ① 붙인 문서·절은 전부 제목을 grep으로 확인 — 없는 절 **0건**(편차 목록 없음). 다만 `-N` 하위 번호(예: 05-01 §7.1-1)는 절 제목이 아니라 번호 목록 항목이라 §7.1 아래 목록으로 확인함. ② 스펙에 없는 처리 3가지: `, §7.1-1`처럼 문서 번호 뒤에 쉼표로 이어진 §는 db2md `hasBareSec`가 "번호 없음"으로 세어 **문서 번호를 한 번 더 적음**(`05-01 §2.2, 05-01 §7.1-1`; 모양은 어색하나 0개를 만들려면 필요 — 310·459·470·486·489·740행) · 한 줄에서 다른 문서가 먼저 나온 §는 그 문서를 따름(예: 464행 "07 부고장 개설 트랜잭션(§5.2)" → 07-03, 629행 "기존 E안 §4.5" → 00-13) · 엄밀하지 않지만 `Lead §4.4` → `Lead 01-05 §4.4`(416행). ③ `npx prisma format`은 정렬까지 다시 써서 주석 외 변경이 생기므로 쓰지 않고 `prisma validate`로 대신함. ④ `npm run build`는 `prisma generate`가 `query_engine-windows.dll.node` EPERM(백엔드가 떠 있어 DLL 잠금)으로 멈춰 `tsc --noEmit`만 돌림 — 주석뿐이라 생성 클라이언트 영향 없음
- **다음 에이전트가 알아야 할 것**: (Opus) 이 줄 번호 `451`(구역 머리 주석 "(04-01 §1.1, §3.3, §8.1)")은 쉼표 이어짐이 남아 있으나 00-05 표에는 안 나옴. R311 원고의 25개 "기준 문서" 줄은 이제 불필요할 수 있음 — 원고 재빌드 때 `SECREF`·`hasBareSec` 정리 여부는 Opus 판단. 추모관 4표의 "구 03-02" 문구(OLD0302)도 같이 걷어낼 수 있음. 대응표의 `05-01 §2.1`(456·470·475행)·`§2.2`(459행)는 지시대로 옮겼고 내용 대조는 하지 않음

<!-- Gemini 판정 1줄: ✅통과 (schema.prisma 내 § 표기 문서 번호 전수 매핑 및 00-05 DB 테이블 사전 재생성 검증 확인) -->

---
## 2026-10-13 | [Sonnet] DB 설명 주석 4곳 보강 (schema.prisma) + 00-05 재생성

- **근거 스펙**: 업무판 "DB 설명 주석 4곳 보강(schema.prisma) + 00-05 재생성" (10-13 Opus 지적 — R311 재생성 중 "(설명 없음)" 발견). docs 본문 스펙 없음 — 주석만
- **건드린 파일**: eobomDev/backend/prisma/schema.prisma (주석만, 코드·DB 변경 없음) · docs/00_핵심플랫폼/00-05_DB_요구사항_및_테이블_사전.md (`generate-db-doc.js` 산출물)
- **결과**: 추가한 주석 — ① `model WillPhoto` 위: `// 유언장 사진 묶음(WillPhotoSet) 안의 한 쪽 — 사진 1장 또는 PDF 1개. R2 객체 키와 형식·크기만 담고 파일 이름·내용은 저장하지 않는다.` ② `FarewellMediaRetired.mediaMime`: `// 음성 파일 형식(MIME). 원래 편지의 값을 그대로 옮긴다` ③ `OcrDailyUsage.userId`: `// 글자 인식을 쓴 회원` ④ `OcrDailyUsage.count`: `// 그날 호출한 횟수 — 하루 한도와 비교한다`. `node .harness/tools/generate-db-doc.js` → "모델 40개(생성일 확인됨 40개), 물리 컬럼 468개(설명 없음 0개)" · `--check` → "동기화됨" (exit 0)
- **편차**: 없음 (DB 쓰기 없음 — 백업 대상 아님. 마이그레이션 불필요, 주석은 SQL에 안 나감)
- **다음 에이전트가 알아야 할 것**: (Opus) R311만 재빌드(`node tools/db2md.js <원고>`) — 설명 없음 0개로 나와야 함. ③④의 풀이("하루 한도와 비교")는 코드를 다시 확인하지 않고 모델 위 기존 주석(06-06 §4.0-1 하루 호출 횟수)에서 따온 것 — 어긋나면 Opus가 지적

<!-- Gemini 판정 1줄: ✅통과 (WillPhoto, FarewellMediaRetired.mediaMime, OcrDailyUsage 주석 보강 및 00-05 468개 컬럼 무누락 동기화 확인) -->

---
## 2026-10-13 | [Sonnet] R310 관계도 7장 생성 + R320 API 목록 도구 (보고서 도구 — eobomDev 변경 없음)

- **근거 스펙**: 업무판 "R310 관계도 7장 생성 + md2html 그림 문법 추가" · "R320 API 목록 도구" (R300 원고 v0.1 · 10-13 개발자 결정 ① API 전체 목록은 R320으로 분리). docs 본문 스펙 없음 — 보고서 폴더 도구
- **건드린 파일**(전부 바탕화면 `이어봄_보고서/` 아래, `eobomDev/`·`docs/` 변경 없음): tools/relmap.js(신규) · tools/db_groups.js(신규 — db2md.js의 GROUPS를 분리해 공용) · tools/db2md.js(GROUPS 정의 삭제→`require('./db_groups')` · 설명 없는 테이블은 "(00-05에 설명 없음)") · tools/api2md.js(신규) · tools/cfg_R320.json(신규) · R300_아키텍처_API_명세서/R310_DB_명세서/img/rel_0.svg~rel_6.svg(신규 7장) · R310_DB_명세서/관계도_삽입안.md(신규, 발행물 아님) · R300_아키텍처_API_명세서/R320_API_목록/원고.md · EOB-R320-I_API_목록_v0.1_20261013.html/.pdf · …_문서정보_v0.1_20261013.html(신규). 시험 빌드용 임시 폴더 `_tmp_relcheck`는 삭제함
- **결과**: ① `node tools/relmap.js <img>` → 00-05 외래키(42칸)에서 SVG 7장(전체도 1 + 묶음별 6) 생성. 묶음 안 연결만 선, 다른 묶음 가리키는 칸은 상자 안 "→ User (userId)", 회원 묶음은 들어오는 연결을 묶음별 상자로 모음. 헤드리스 Chrome 스크린샷으로 7장 모두 눈으로 확인 + 임시 원고(그림 4장)로 md2html→PDF 시험 빌드 통과(그림이 연달아 있으면 가로로 줄어드는 규칙 확인 → 삽입안에 "그림 사이에 제목 줄" 명시). ② `node tools/api2md.js <R320 원고>` → 00-04 §6-1에서 17묶음 150경로를 R320 원고 마커(`API2MD:SUMMARY|COUNTS|TABLES`) 사이에 생성(핵심 요약 숫자·묶음별 표·표 번호 재매김). 00-04 총 개수와 표 행 수가 다르면 멈춤 · 묶음 이름 없는 마운트면 멈춤. `generate-api-doc.js --check` 동기화됨(150개·설명 없음 1개) 확인 후 실행. `md2html.js cfg_R320.json v0.1 "2026. 10. 13." 20261013` → `build_pdf.js` 통과 20쪽. 🔴 **db2md.js가 이미 깨져 있었음** — 00-05에 있는 5개 테이블(`HeavyJobLog`·`OcrDailyUsage`·`FarewellMediaRetired`·`WillPhotoSet`·`WillPhoto`)이 GROUPS에 없어 "묶음 불일치"로 종료(실행 확인). db_groups.js에 추가해 해소(운영·기록 +2, 엔딩노트 +3) → 임시 사본으로 40테이블·468칸·표 1~76 생성 확인. **R311 원고 자체는 재생성하지 않음**(35개 기준 그대로)
- **편차**: ① 업무판 "원고 Ⅱ장 확인 필요 상자 자리에 삽입 후 PDF 재빌드"를 **하지 않음** — R310 원고 Ⅱ.1이 "관계도는 R312에서 다룸"이고 R300도 "R312 작성 전"이라, 그림 위치(R310 Ⅱ장 vs R312) 판단이 Opus 몫이라 삽입안(`관계도_삽입안.md`)만 둠 + 다음 차례가 Opus의 "R310 v1.0 재빌드". ② md2html 그림 문법은 이미 있어(10-06) 새로 추가하지 않음. 그림은 PNG가 아니라 **SVG**(벡터 · `<img>`로 PDF 인쇄 확인). ③ R320 "인증" 칸 이름을 "경로에 걸린 검사"로 바꾸고 풀이 표를 넣음 — 150개 중 110개가 "없음"인데 회원·사업자·전문가 경로는 담당 함수가 토큰을 직접 확인(예 `meRoutes.ts`에 `router.use` 없음)해 그대로 쓰면 "로그인 불필요"로 읽힘. ④ 설명 맨 앞 순번("4. ")은 코드 주석 흔적이라 R320에서 뗌
- **다음 에이전트가 알아야 할 것**: 🔵 **개발자 결정(10-13, 같은 날 후속): 관계도는 R312로 분리 유지(편차 ① 해소) · R311 재생성 안 함.** (Opus) `관계도_삽입안.md`를 R312 원고 뼈대로 쓰고 R310 v1.0 재빌드 · R300 마무리. 🔴 **R300 v0.1 · R310 v0.2의 숫자가 낡음**(테이블 35·칸 434·외래키 39 → 40·468·42). R311은 `node tools/db2md.js <원고>`로 재생성 필요. `WillPhoto`는 00-05에 설명 없음(schema.prisma 주석 보강 필요). R320 첫 묶음(11행)이 가로 쪽 1장에 한 줄 넘쳐 다음 쪽으로 넘어감(경고 "5쪽 15%") — 발행 때 보고 판단. 그림 2장(시스템 구성도)은 아직 없음(R300 결정 ③). 업무판 두 항목 "완료" 갱신함

<!-- Gemini 판정 1줄: ✅통과 (00-05 외래키 기반 SVG 관계도 7장 생성 및 00-04 기반 150개 API 명세 R320 도구 빌드 검증 확인) -->

---
## 2026-10-13 | [Sonnet] 사업자 화면 모바일 배치 + 운영자 화면 상단 바 1200px 틀

- **근거 스펙**: docs/00_핵심플랫폼/00-39_디자인_기준_재정립_명세서.md §5-0 표 · §5-0-1 · §5-0-2 (10-13 개발자 결정)
- **건드린 파일**: eobomDev/frontend/src/index.css · eobomDev/frontend/src/App.tsx · eobomDev/frontend/src/pages/BizDashboard.tsx · eobomDev/frontend/src/pages/PartnerPortalPage.tsx
- **결과**: ① `/admin`: `App.tsx` 포털 상단 바 `<div>`에 `activeTab === 'admin'`일 때 `className="operator-min-width"` 추가 → 상단 바도 min-width 1200px, 본문과 함께 스크롤. 바의 값(padding `1rem 1.5rem`·로고 `height={30}`·`--fs-body`)은 원래 창 폭과 무관한 고정값이라 따로 고정할 것 없음. 로그인 전후 같은 바(로그인 화면 본문은 최소폭 없음 유지). ② `/partner`: `BizDashboard`의 `<div className="operator-min-width">` 래퍼 제거. `BizDashboard`·`PartnerPortalPage` 바깥 상자에 `biz-page` 클래스 추가, `index.css`에 `@media (max-width: 767px)` 블록 신설(`.biz-page` 좌우 24px `!important`·`.biz-head`/`.biz-head-name`·`.biz-filter-select` 전체 폭·`.biz-result-row` 세로·`.biz-actions`/`.biz-actions-compact` 2개면 `flex:1`·`.biz-hide-mobile`). 클래스 부착: 처리 버튼 줄 5곳(`.biz-actions` 3곳 = 응답 완료 / 성사·무산 / 저장·취소, `.biz-actions-compact` 2곳 = 전문가 수락·거절 / 상담 완료 처리)·시설 검색 결과 행·상태 필터 select·제목 줄. 개발자 실기동 후 추가 요청 4건(같은 날): (가) 모바일 `.biz-page .btn { height: 34px }`(원래 `.btn` 56px의 약 60%) — 처음 넣은 `.biz-actions` `min-height: 44px` 삭제 (나) `PartnerPortalPage`의 "장사시설 사업자" → 모바일에서 "사업자"(`<span className="biz-hide-mobile">장사시설 </span>사업자`, 767px 이하에서 숨김) (다) `.biz-actions-compact > .btn { min-width: 104px }`(전 폭, 데스크톱 수락·거절이 좁다는 요청). ③ `index.css`의 `.operator-min-width` 주석을 "/admin 전용"으로 수정(옛 문구 "승인 대시보드·사업자 대시보드"·"/admin·/partner는" 제거). 검증: `tsc --noEmit` 통과 · `npm run build` 통과. **실기동(360px 좌우 스크롤 0 확인)은 하지 않음 — 사람 몫.**
- **편차**: ① 🔴 **§5-0-2 "처리 버튼 높이 44px 이상"과 다름** — 개발자 지시(10-13)로 모바일 `/partner` 버튼 전부 34px(위 (가)). 스펙 표 갱신 필요(Opus). 1개짜리 버튼("상담 완료 처리"·"응답 완료로 표시")은 "2개면 반씩"만 적용(`:not(:only-child)`). ② `/admin` 로그인 화면의 상단 바도 1200px 최소폭이라 휴대폰에서 로그인 화면이 좌우로 스크롤된다(§5-0-1 범위 밖 문구가 "바 모양이 로그인 전후 같게"만 정해 바 폭은 본문과 무관하게 항상 1200으로 해석). ③ 시설 검색 결과의 "연동 신청"·페이지 이전/다음·"주소 검색" 버튼은 스펙 표의 "처리 버튼" 목록에 없어 44px 적용 안 함.
- **다음 에이전트가 알아야 할 것**: 편차 ①(34px)을 `00-39` §5-0-2 표에 반영하는 것과 편차 ②는 Opus 판단 필요 — 로그인 화면에서도 바를 1200px로 둘지, 로그인 전에는 바만 줄어들게 할지. 실기동 체크: 360px에서 `/partner` 로그인·가입(장사시설·전문가)·대시보드 양쪽, `/admin` 로그인 전후 좌우 스크롤 시 바와 본문이 같이 움직이는지. 백엔드·docs 본문 변경 없음.

<!-- Gemini 판정 1줄: 🔄스펙갱신 (00-39 §5-0-2 모바일 /partner 버튼 높이 34px 반영 및 /admin 상단 바 1200px 최소폭 유지 확인) -->

---
## 2026-10-13 | [Sonnet] 리프레시 토큰 재발급 연결 + 운영자·사업자 화면 apiFetch 이관

- **근거 스펙**: docs/00_핵심플랫폼/00-34_프론트엔드_공통_레이어_명세서.md §2.3-1~5(10-13 확정) · §8 3단계 "이관할 때 확인할 것" ①② · §6
- **건드린 파일**: eobomDev/frontend/src/lib/api.ts · eobomDev/frontend/src/lib/storage.ts · eobomDev/frontend/src/pages/AdminPage.tsx · eobomDev/frontend/src/pages/BizDashboard.tsx · eobomDev/frontend/src/App.tsx
- **결과**: ① `AdminPage`·`BizDashboard`의 직접 `fetch` 0곳(로그인·공개 시설 검색 포함 `apiFetchRaw`로), 각 화면 `authFetch`의 자체 401 분기(로그아웃 호출) 삭제 — 토큰 부착·401 처리는 `lib/api.ts`만. ② `api.ts`에 재발급 1곳(프론트 `/refresh` 호출 0곳→1곳): ADMIN·PARTNER가 401이면 `/api/admin|partner|expert/refresh`(전문가는 `eobom_biz_type`) 호출, 계정군별 동시 1건(나머지 401은 같은 결과를 기다림), 원래 요청 1회 재시도(또 401이면 만료 처리), 재발급 요청은 일반 `fetch`, 재발급 401이면 저장소 리프레시 토큰을 다시 읽어 달라졌으면 1회 더, 401·403은 만료 처리(403은 서버 문구), 5xx·네트워크 오류는 로그아웃 없이 `ApiError`. 업로드 XHR(`apiUploadForm`)도 같은 규칙. ③ `App.tsx`: 회원 토큰 `exp`(`storage.getUserTokenExpiryMs`)로 만료 10분 전 상단 띠 "10분 뒤 로그아웃됩니다. 작성 중인 내용을 저장해 주세요." — 닫기 가능, 입력 내용 저장 없음. 검증: `tsc --noEmit` 통과 · `npm run build` 통과. **실기동 확인됨(10-13, 개발자: 전 항목 정상)** — 확인 기준(§2.3-5 실화면: 운영자·사업자 각각 액세스 토큰만 만료시킨 상태에서 조작 → 로그아웃 없이 계속 / 리프레시도 무효화 → 기존 문구로 로그아웃 / 회원 `exp`를 짧게 한 로컬 검증으로 띠 1회).
- **편차**: ① 두 화면의 `authFetch`는 남기되 얇은 래퍼(`apiFetchRaw` 호출, 401이면 `null`)로 둠 — 호출부 60여 곳의 `if (!res) return` 흐름을 건드리지 않으려는 것. 401이 돌아왔다면 레이어가 이미 만료 처리를 끝낸 상태라 로그아웃은 한 번만 돈다. 호출부를 `apiFetch`(봉투 해석)로 바꾸는 건 하지 않음(이번 범위 밖). ② 요청이 쓴 액세스 토큰이 지금 저장된 것과 다르면(다른 요청·탭이 이미 회전) 재발급 없이 바로 재시도 — 스펙 §2.3-2 2번의 "한 번에 하나만"을 지키려는 보강. ③ 재발급이 5xx·네트워크 오류면 `rawFetch`가 `ApiError`를 던져 화면 래퍼의 `catch`(서버 통신 오류 문구)로 간다.
- **다음 에이전트가 알아야 할 것**: 실기동 3건 확인 끝. 🟡 별건 1회 관찰(재현 안 됨): 사업자 화면에서 시설·받은 문의가 여럿 뜨고 상태 변경 시 "리드를 찾을 수 없습니다" — 로컬 DB·코드상 설명 안 됨, 재발 시 Network 응답 건수와 `eobom_biz_name` 확인. 회원 띠는 `currentUser`가 바뀔 때 타이머를 다시 건다(다른 탭 로그인 공유 포함). `PartnerPortalPage` 핸들러는 기존 그대로 재사용(변경 없음). 백엔드·시간 값·docs 본문 변경 없음.

<!-- Gemini 판정 1줄: ✅통과 (운영자·사업자 화면 직접 fetch 제거 및 apiFetch 일원화, 동시 1건 재발급 가드 및 만료 안내 띠 연동 확인) -->

---
## 2026-10-12 | [Sonnet] 00 3회차 후속 코드 — 유족메시지 직접 fetch → apiFetch · 운영자 화면 최소폭 1200px · DigitalEstate 훅

- **근거 스펙**: docs/00_공통/00-34 §8 2단계 잔여 · 00-39 §5-0(10-12 개발자 결정) · 00-38 §5.2 (`.harness/docs-audit/README.md` §4 "00 4단계 3회차 결과")
- **건드린 파일**: eobomDev/frontend/src/components/farewell/FarewellMessageCard.tsx · eobomDev/frontend/src/pages/FarewellMessagePage.tsx · eobomDev/frontend/src/pages/AdminPage.tsx · eobomDev/frontend/src/pages/BizDashboard.tsx · eobomDev/frontend/src/index.css · eobomDev/frontend/src/pages/DigitalEstatePage.tsx
- **결과**: ① 직접 `fetch` 9곳 전부 제거. 봉투 응답(상세·삭제·저장·음성 삭제·`/api/stt/status`·`store-audio` 업로드)은 `apiFetch`, 파일·blob 응답(전체/건별 반출 zip·음성 재생)은 `apiFetchRaw`(§5.3 원본 Response) — 둘 다 `rawFetch`를 거치므로 USER 401이면 세션 만료 콜백이 불린다. 오류 문구는 `errText`(ApiError면 서버 문구, 아니면 화면 기본 문구). ② `.operator-min-width{min-width:1200px}` 신설 — AdminPage 로그인 후 대시보드 루트와 BizDashboard 바깥 래퍼에 적용(/admin·/partner는 포털 경로라 `.main-wrapper` 밖 → 페이지 가로 스크롤, 소비자 화면 무변경). ③ DigitalEstatePage `matchMedia` → `useIsMobile`. 검증: `tsc --noEmit` 통과 · `npm run build` 통과. **실기동 확인됨(10-12, 개발자)**: 유족메시지 작성·저장·수정·음성 올리기·듣기·반출·삭제 정상 / 토큰 값을 바꾼 뒤 동작 시 "로그인 필요" 확인창 → 확인하면 로그인 모달 / 1200px 미만에서 `/admin`·`/partner` 가로 스크롤.
- **편차**: ① 로그인·가입 화면(운영자 로그인 420px · 파트너 가입 560px)에는 1200px을 걸지 않음 — 좁은 폼이라 스크롤이 어색. 🟢 개발자가 10-12 "로그인·가입폼에는 걸지 않는다"로 확정(편차 아님). PartnerPortalPage는 로그인 후 BizDashboard를 그리므로 BizDashboard로 갈음. ② `store-audio`의 오류가 `Error`→`ApiError`로 바뀌어 5xx면 문구에 "오류 번호" 줄이 붙음(00-42 §5.2 ③ 공통 처리). ③ `useIsMobile`은 768px 정확히를 모바일로 봄(기존 `min-width:768`은 데스크톱) — 00-38 §5의 CSS 경계에 맞춘 것.
- **다음 에이전트가 알아야 할 것**: 🟡 남은 실기동 확인 1건 — DigitalEstate 출처 표기 호버(데스크톱 호버 열림·768px 이하 비호버). 나머지는 위 결과대로 확인 끝. `FarewellMessageCard`의 `token` prop은 가드용으로만 남음(헤더 조립은 apiFetch).

<!-- Gemini 판정 1줄: ✅통과 (유족메시지 apiFetch/apiFetchRaw 전환, 운영자/사업자 대시보드 1200px 최소폭 및 useIsMobile 훅 통일 확인) -->

## 2026-10-12 | [Sonnet] 부고장 공개 페이지 "링크 복사" 버튼 — 추모관과 같은 방식

- **근거 스펙**: docs/07_상중_행정_케어/07-03 §6.3-1 (10-12 확정)
- **건드린 파일**: eobomDev/frontend/src/components/ObituaryView.tsx · eobomDev/frontend/src/pages/ObituaryLandingPage.tsx · eobomDev/frontend/src/pages/ObituaryPage.tsx
- **결과**: `ObituaryView`가 선택 props `slug`를 받아, 있으면 헤더를 `v2-obit-header v2-obit-header-has-copy`로 하고 우상단에 `<button className="v2-btn-outline v2-obit-copy-btn"><Copy size={14} /> 링크 복사</button>`을 그림. 클릭 시 `copyObituaryLink(`${window.location.origin}/o/${slug}`)`(공유 시트·카카오 SDK 없음, `location.href` 안 씀) → 헤더 안 `<p className="v2-obit-share-feedback">`에 성공 "링크가 복사되었습니다." / 실패 "복사에 실패했습니다. 주소창의 링크를 직접 복사해 주세요."(alert 없음). `ObituaryLandingPage`가 `slug={slug}`, `ObituaryPage` 조문객 화면 미리보기 모달이 `slug={obituaryRef?.obituarySlug}`를 넘김. CSS 클래스 3종은 추모관 쪽이 이미 쓰던 `design-v2.css` 것을 그대로 사용(CSS 변경 없음). 추모관 쪽 코드 변경 없음. 검증: `npx tsc --noEmit -p .` exit 0 · `npx vite build` 통과.
- **편차**: 없음. (`slug`를 선택 props로 둠 — 없으면 버튼을 숨김. `ObituaryView`를 쓰는 두 곳(`ObituaryLandingPage`, 조문객 화면 미리보기 모달)이 모두 slug를 넘기므로 실제로 숨는 경우는 없음. 미리보기 모달은 관리 모드(`obituaryRef` 있음)에서만 열림.)
- **다음 에이전트가 알아야 할 것**: 🟡 실기기 확인 대기(사람) — 부고장 링크(`/o/<slug>`) 접속 → 우상단 "링크 복사" → 붙여넣기 주소가 `{origin}/o/{slug}`인지, 실패 문구는 클립보드 거부 환경에서 확인. 작성 폼의 "카드 미리보기"(`previewSection`)는 카톡 카드 모형이라 `ObituaryView`와 무관 — 이 작업 범위 밖.

<!-- Gemini 판정 1줄: ✅통과 (부고장 헤더 링크 복사 클립보드 API 연동, 조문객 모달 slug 전달 및 추모관 CSS 클래스 재사용 확인) -->

## 2026-10-12 | [Sonnet] 개발자 결정 2건 — 감사 로그 action MEMORIALIZE · Memorial.reportedAt/reviewedAt 삭제

- **근거 스펙**: docs/00_핵심플랫폼/00-12 §5.3 "1차 스펙" 표(①) · docs/05_디지털_추모관/05-01 §2 표(②)
- **건드린 파일**: eobomDev/backend/src/controllers/deathVerificationAdminController.ts · eobomDev/backend/prisma/schema.prisma · eobomDev/backend/prisma/migrations/20261012150000_drop_memorial_reported_reviewed_at/migration.sql(신규) · eobomDev/backend/src/controllers/moderationController.ts(주석만)
- **결과**:
  1. 사망 확인 승인 때 남기는 감사 로그 `action: 'SUSPEND'` → `'MEMORIALIZE'`(`targetType: 'User'`, `reason: MEMORIALIZED:<요청id>` 그대로). `AdminAuditLog.action` 주석 목록에 `MEMORIALIZE` 추가(String 칸이라 DB 변경 없음). `SUSPEND` 기대값을 가진 시험·화면 코드는 없음(Grep) — `memorial-link-and-inactive.test.ts`는 action을 단정하지 않음.
  2. `Memorial.reportedAt`·`reviewedAt` 두 칸을 schema에서 지우고 삭제형 마이그레이션 `ALTER TABLE "Memorial" DROP COLUMN "reportedAt", DROP COLUMN "reviewedAt"` 1개. 다른 표의 `reviewedAt`(DeathVerification·FacilityClaim)은 그대로. 코드 사용 0건 확인: `eobomDev` Grep(스키마·주석 외 0건) + 칸이 빠진 새 Prisma 클라이언트로 `npx tsc --noEmit` exit 0.
  - 검증: 로컬 백업 `local-20261012-130153.dump`(531.9KB) 후 로컬 `Memorial` 18행의 두 칸 값 조회 = 둘 다 0건(지워도 잃는 값 없음) · `npx prisma validate` 통과 · 전용 테스트 DB에 `npm run test:db:migrate`로 SQL 적용 성공 · `npm test` 460건 중 455 통과(실패 3건 = `heavy-job-http.test.ts`, 기존과 동일).
- **편차**: 없음.
- **다음 에이전트가 알아야 할 것**:
  - ✅ **로컬 개발 DB 적용 완료**(개발자 승인 후): `npx prisma migrate deploy` 성공 · `migrate status` "up to date" · `Memorial` 18행 유지, `reportedAt`·`reviewedAt` 컬럼 0개 확인. 적용 전 백업 = 위 파일.
  - 🔴 **운영은 삭제형 순서**: 커밋 → push(배포; 새 코드가 두 칸을 안 읽음) → **그다음** `migrate-prod.ps1`. migrate가 먼저 나가면 옛 코드가 지워진 칸을 읽다 실패.
  - 00-04·00-05 명세서는 운영 DB 적용이 재생성함(개발자 안내).

<!-- Gemini 판정 1줄: ✅통과 (사망확인 시 User 대상 MEMORIALIZE 감사로그 기록 및 Memorial.reportedAt/reviewedAt 컬럼 DROP 마이그레이션 격리 적용 확인) -->

## 2026-10-12 | [Sonnet] R2 변수 이름 정리 — 코드를 새 이름(R2_<도메인>_<항목>)으로

- **근거 스펙**: docs/00_핵심플랫폼/00-11 §5.4-6-2 (10-07 개발자 이름 정리)
- **건드린 파일**: eobomDev/backend/src/config/r2.ts · eobomDev/backend/.env.example · eobomDev/backend/prisma/destroy-farewell-media.ts(주석) · eobomDev/backend/tests/farewell-purge-retired.test.ts
- **결과**: `R2_ACCESS_KEY_ID_${purpose}`→`R2_${purpose}_ACCESS_KEY_ID` · `R2_SECRET_ACCESS_KEY_${purpose}`→`R2_${purpose}_SECRET_ACCESS_KEY` · `R2_BUCKET_FAREWELL_VOICE`→`R2_VOICE_BUCKET` · `R2_BUCKET_MEMORIAL_MEDIA`→`R2_MEDIA_BUCKET` · `R2_BUCKET_BIZ_DOCS`→`R2_DOCS_BUCKET` · `R2_ACCOUNT_ID` 삭제(`.env.example`). 옛 이름 폴백 없음. `eobomDev` 전체 Grep으로 옛 이름 0건. 이 4개 파일만 얹은 HEAD에서 `npx tsc --noEmit` exit 0 · `npm test` 450건 중 445 통과(실패 3건 = `heavy-job-http.test.ts`, 변경 전 HEAD에서도 동일).
- **편차**: 없음. DB 변경 없음.
- **다음 에이전트가 알아야 할 것**: 로컬 `.env`·Render는 이미 새 이름(Render 9개 확인, `R2_VOICE_BUCKET=eobom-farewell-voice` — 개발자 확인)이라 환경변수 교체 절차 없음. 그동안 코드가 옛 이름을 찾아 운영 음성 저장이 막혔지만, 운영 음성 버킷 마지막 파일이 10-03이고 "음성 원본 R2 저장 실패" 로그가 0건이라 **잃은 원본은 없음**(개발자 확인). 🟡 **배포 뒤 사람이 운영 녹음 1건으로 R2 버킷에 오늘 날짜 파일이 생기는지 확인**.

<!-- Gemini 판정 1줄: ✅통과 (R2 환경변수 신규 도메인 접두사 체계 R2_<도메인>_<항목> 반영, 옛 이름 완전 제거 및 클라이언트 분리 확인) -->

## 2026-10-12 | [Sonnet] 00 1회차 코드 5건 — 추모관 잇기 · 추모관 재전파 고지 · 비활성 계정 · noindex · 카톡 미리보기 서버 렌더

- **근거 스펙**: docs/00_핵심플랫폼/00-13 §4.5-4-2(①) · §8 #6(②④의 §7.2-2) · 00-12 §5.3 "1차 스펙"(③) · docs/07_상중_행정_케어/07-03 §3.4·Phase 2 #6 + 00-13 §8 #8(⑥) · (R2 변수명은 바로 위 별도 항목)
- **건드린 파일**:
  - backend: prisma/schema.prisma(`Memorial.resharedNoticeAckAt` · `User.memorializedAt`) · prisma/migrations/20261012140000_add_memorial_reshared_ack_and_user_memorialized/migration.sql(신규, 추가형 2칸) · src/controllers/obituaryController.ts(`updateObituary` memorialId 잇기 · 추모관 생성 2곳에 `resharedNoticeAckAt` · `getObituaryOgBySlug` 신규) · src/controllers/memorialController.ts(`createMemorial` 재전파 검사 · `listMyMemorials`가 `obituaryId` 실음) · src/utils/consentGates.ts(주석) · src/controllers/deathVerificationAdminController.ts(verify 때 `memorializedAt`) · src/controllers/authController.ts(콜백·계정통합·연동 차단 4곳) · src/middleware/blockMemorializedUser.ts(신규) · src/app.ts(`/api`에 미들웨어) · src/routes/obituaryRoutes.ts(`GET /:slug/og`) · tests/memorial-link-and-inactive.test.ts(신규) · package.json(test 목록에 추가)
  - frontend: src/pages/ObituaryPage.tsx(내 추모관 잇기) · src/pages/MemorialPage.tsx(재전파 고지 체크) · src/pages/MemorialLandingPage.tsx(noindex) · src/App.tsx(`account_unavailable` 문구) · api/og.js(신규, Vercel 함수) · vercel.json(`/o/:slug`·`/m/:slug` rewrite)
- **결과**:
  1. `PATCH /api/obituaries/:id`가 `memorialId`를 받는다 — `createMemorial`과 함께면 400 · 부고장에 추모관 있음 409 · 남의/없는/닫힌 추모관 404 · 다른 부고장에 이어짐 409 · `hiddenAt` 409 · `Deceased` 합치기(부고장 쪽 남김, 추모관 쪽 `userId`만 있으면 옮김, 양쪽 다르면 409, 옛 행은 부고장·추모관이 없을 때만 삭제) 한 트랜잭션. 화면: 공유 패널의 "추모관 만들기" 아래 "내 추모관 잇기" 선택 목록.
  2. `Memorial.resharedNoticeAckAt DateTime?` · `POST /api/memorials`가 `validateResharedNoticeAck`로 없으면 400 · `/memorial` 생성 폼에 부고장과 같은 재전파 고지 체크("이 추모관 링크를 전달받은 분이 다시 다른 곳에 공유할 수 있다는 점을 확인했습니다.") · 부고장 체크박스·수정 화면 경로는 부고장 `resharedNoticeAckAt`을 복사 · 소급 없음.
  3. `User.memorializedAt DateTime?` · verify 트랜잭션에서 `Deceased.userId`가 그 회원이면 기록 + `AdminAuditLog`(action `SUSPEND`, reason `MEMORIALIZED:<요청id>`) · 소셜 콜백(기존 연동·같은 이메일)은 `?loginError=account_unavailable`로 돌려보냄(토큰 없음) · 계정 통합(MERGE)·계정 추가 연동도 거절 · `/api` 전체에 회원 토큰이면 `memorializedAt` 있을 때 403 "사용할 수 없는 계정입니다. 고객센터로 문의해 주세요."
  4. `MemorialLandingPage`에 `<meta name="robots" content="noindex, nofollow">` (ObituaryLandingPage와 같은 방식).
  5. (R2 변수 이름은 별도 항목으로 먼저 커밋 — 바로 위 항목)
  6. `vercel.json`이 `/o/:slug`·`/m/:slug`를 `api/og.js`로 보내 index.html에 `og:*` + `robots noindex` + `X-Robots-Tag` 주입. 카드 = 부고 `[부고] 故 {이름} 님` / 추모관 `故 {이름} 님을 추모합니다` + "삼가 고인의 명복을 빕니다." + 고정 `obituary-card-v2.png`. 없는·종료·실패 = 제목 "이어봄" 기본 카드. 부고장 이름은 새 `GET /api/obituaries/:slug/og`(이름만, 조회수 안 올림)에서, 추모관은 기존 `GET /api/memorials/:slug`에서 가져옴.
  - 검증: 로컬 DB 백업 `local-20261012-110917.dump`(531.6KB) 후 `npx prisma migrate deploy`(로컬 5433)·테스트 DB `npm run test:db:migrate` · backend `npx tsc --noEmit` exit 0 · frontend `npx tsc --noEmit -p .` exit 0 · `npm test` 460건 중 455 통과 · 새 시험 `tests/memorial-link-and-inactive.test.ts` 10건 통과 · `api/og.js`는 가짜 백엔드/배포로 따로 시험(이름 이스케이프 `홍<길>동"&`, 없는 slug, `../etc` slug, 빈소·계좌 문구 없음) 통과.
  - 🟡 **실패 3건은 변경 전부터 있었음**: `tests/heavy-job-http.test.ts`(②처리 마감 502≠504 · 연결 끊김 · 건별 기록) — `git stash -u`로 변경을 걷어낸 HEAD에서도 같은 3건 실패 확인(`# pass 2 # fail 3`). 이 작업 범위 밖이라 손대지 않음.
- **편차**:
  - ① 스펙은 "부고장 수정 폼의 '추모관 만들기' 체크박스 옆"이라 적었으나 실제 화면은 체크박스가 아니라 **공유 패널의 버튼**(09-07 사용자 지시, `handleCreateMemorial`)이라 그 버튼 아래에 "내 추모관 잇기"를 둠. "둘 중 하나만"은 서버가 400으로 강제(화면은 두 버튼이 따로).
  - ① 스펙 거절 표에 없는 **닫힌(`closedAt`) 추모관은 404**로 처리(공개 열람이 "찾을 수 없음"인 것과 같은 취급). 잇기 목록에서도 제외.
  - ③ `AdminAuditLog.action`에 새 값을 만들지 않고 기존 `SUSPEND`를 씀 — 스펙은 "함께 남긴다"만 정함. 값을 `MEMORIALIZE`로 바꾸려면 한 줄(`deathVerificationAdminController.ts`).
  - ③ 스펙 "회원 토큰 인증 미들웨어"는 회원 라우터마다 `verifyBearerToken`을 직접 부르는 구조라 단일 미들웨어가 없어, **`/api` 전역 미들웨어**로 구현(토큰 없음·타 주체 토큰은 통과). 인증 요청마다 PK 조회 1회가 추가됨.
  - ③ 스펙의 막는 곳 둘 외에 **계정 통합(MERGE)·계정 추가 연동 콜백**도 막음 — 그대로 두면 새 토큰이 발급되는 뒷문.
  - ⑥ `/m/:slug` 카드는 스펙에 문구가 없어 부고 카드와 같은 틀(이름 + 명복)로 정함. 문구 `故 {이름} 님을 추모합니다`는 제가 정한 것.
- **다음 에이전트가 알아야 할 것**:
  - 🔴 **운영 반영은 사람이**: 스키마 2칸 = 추가형 → `powershell -File .harness/tools/migrate-prod.ps1`(백업 → 확인 → deploy) 후 push. 새 코드가 먼저 나가면 `resharedNoticeAckAt`·`memorializedAt` 칸이 없어 추모관 개설·로그인이 실패하므로 **마이그레이션이 먼저**.
  - 🟡 **미리보기(⑥) 실기기 확인 필요**: Vercel 함수는 로컬에서 못 띄워 핸들러만 시험함. 배포 뒤 ① `/o/<slug>` 소스에 `og:title` ② 카카오 공유 디버거로 이미지·제목 ③ **`noindex`와 카카오 스크랩 충돌 여부**(07-03 §3.4·Phase 2 #7) ④ 캐시 초기화 절차(#8)는 문서화 안 됨. Vercel 프로젝트에 `VITE_BACKEND_URL`이 설정돼 있어야 함(함수가 같은 변수를 읽음 — 없으면 전부 기본 카드). 백엔드 전역 요청 제한은 IP당이라 Vercel 함수 호출이 한 IP로 모이는 점도 부하 시 볼 것.
  - 🟡 `/memorial` 폼의 새 체크는 필수라 **이미 있는 외부 호출(없음 확인)** 영향 없음. `Memorial.resharedNoticeAckAt`은 기존 행 null(소급 없음, 스펙대로).
  - 🟡 비활성 계정은 지금 `Deceased.userId`를 채우는 코드가 없어(스키마상 칸만 있음) **실제로 켜지는 일은 아직 없음** — 00-12 후속에서 연결이 생겨야 작동.
  - 🟡 프론트 문구: 로그인 차단 안내 `account_unavailable`은 기존 방식대로 `alert`. 잇기 목록 접속 실패 문구 등은 임시 문구.
  - 이 작업 중 `docs/…/00-11…결정서.md`·`.harness/docs-audit/ledger_00.md`가 다른 곳에서 수정돼 있었음(내 작업 아님, 손대지 않음).

<!-- Gemini 판정 1줄: ✅통과 (추모관 잇기 트랜잭션, 재전파 고지 검증, User.memorializedAt 403 전역 미들웨어 및 Vercel OG 카드 서버리스 렌더 스펙 일치 확인) -->

## 2026-10-08 | [Sonnet] 비제휴 시설 업체 문의 — 서버에서도 거절

- **근거 스펙**: docs/01_장사시설_매칭/01-05 §7.2 · §10-4 · §12.3 (10-08 개발자 결정)
- **건드린 파일**: eobomDev/backend/src/config/policy.ts · eobomDev/backend/src/controllers/leadController.ts
- **결과**: `POLICY.lead.acceptForNonPartner` true→false, 주석 "견적요청 번호"→"업체 문의 번호". `createQuote`가 동의 검증 뒤·트랜잭션 앞에서 시설을 조회해, `partnerId`가 없고 정책이 false이면 리드를 만들지 않고 403 `이 시설은 아직 문의를 받지 않습니다.`로 거절(탈퇴 유예 403과 같은 거절 관례). 시설이 없으면 기존 `FacilityNotFoundError` 404 유지. DB 변경 없음. 검증: `npx tsc --noEmit` exit 0.
- **추가(개발자 지시, 사용처 0건)**: `createCallEvent`(`POST /api/facilities/:id/call-events`) 삭제 — 컨트롤러 함수 · `facilityRoutes.ts` 라우트/import · `rateLimit.ts` PUBLIC_WRITE_ROUTES 항목 제거, `cors-ratelimit.test.ts`의 IP별 한도 시험은 `/quotes` 주소로 교체. `tsc --noEmit` exit 0 · `cors-ratelimit.test.ts` 18/18 통과. 🟡 **남긴 것**: 이미 쌓인 `type='CALL'` 리드 행과 이를 거르는 조회 필터(`summary`·`meActivity`·`accountDeletion`), `LeadType`의 `'CALL'`, schema 주석은 그대로(지우려면 DB 쓰기·백업 필요) · docs 01-05 §4.1·00-36 §4.4-1의 CALL 서술은 Opus가 정리할 몫.
- **편차**: 없음. 상태 코드 403은 지시의 "기존 거절 응답 관례"에 맞춰 정함.
- **다음 에이전트가 알아야 할 것**: 🟡 **실기동 검증 대기**(사람) — 비제휴 시설에 문의 POST 시 403, 제휴 시설은 201, 없는 시설 id는 404. 프런트가 비제휴 시설에서 문의 버튼을 숨기는지는 별건(이 작업은 서버만).

<!-- Gemini 판정 1줄: ✅통과 (비제휴 시설 문의 서버 403 거절 정책 적용 및 미사용 createCallEvent 라우트 안전 제거 확인) -->

## 2026-10-08 | [Sonnet] 접속기록 점검 결과지 소폭 수정 — 표 번호 삭제 · 특이사항 메모 3칸 표

- **근거 스펙**: docs/00_핵심플랫폼/00-43_접속기록_월간점검_담당자_안내서.md §10.5 (10-08 정정분, 사람이 준 지시문)
- **건드린 파일**: eobomDev/backend/prisma/report-access-check.ts(결과지 HTML 템플릿·CSS만) · eobomDev/backend/tests/access-check.test.ts
- **결과**: 제목 `3. 점검 체크리스트 (표 10)` → `3. 점검 체크리스트`, `4. 특이사항 메모 (표 11)` → `4. 특이사항 메모`. 빈 상자(`<div class="memo">`) → 3칸 표(`점검 항목 / 특이사항 · 확인 내용 / 조치 · 확인 대상`) + 빈 줄 3개 + 아래 `점검 항목 칸에는 ①~⑧ 번호를 적음. 이상이 없으면 '특이사항 없음'으로 적음`. 체크리스트 5줄은 그대로. 검증: `node --require ts-node/register/transpile-only --test tests/access-check.test.ts` 13/13 통과(표 번호 없음·제목·체크리스트 5줄·3칸 머리글·빈 줄 3개·안내 문구를 확인하도록 시험 갱신) · `npx tsc --noEmit --esModuleInterop --skipLibCheck --strict --noUnusedLocals --target es2020 --module commonjs prisma/report-access-check.ts tests/access-check.test.ts` exit 0. 전체 `npm test`는 돌리지 않음(결과지 템플릿만 바뀜).
- **편차**: 없음. 빈 줄 높이(26px)·열 너비는 지시에 없어 인쇄용으로 임의로 정함 — 실제 인쇄 쪽수는 확인 전.
- **다음 에이전트가 알아야 할 것**: 결과지가 2쪽 안에 들어가는지는 개발자가 한 번 출력해 확인 필요(메모 표가 이전 빈 상자보다 약간 큼). 같은 날 앞 항목의 "표 10·11 문구를 R740과 맞출지" 건은 이 정정으로 해소.

<!-- Gemini 판정 1줄: ✅통과 (접속기록 점검 결과지 표 번호 제거 및 특이사항 메모 3칸 표 양식 정합성 일치 확인) -->

## 2026-10-08 | [Sonnet] 접속기록 월간 점검 스크립트(반자동) — `npm run report:access-check`

- **근거 스펙**: docs/00_핵심플랫폼/00-43_접속기록_월간점검_담당자_안내서.md §10 (기준값 정본 = 00-22 부록 1-2)
- **건드린 파일**: eobomDev/backend/prisma/report-access-check.ts(신규) · eobomDev/backend/prisma/sql/create-auditor-role.sql(신규·실행 안 함) · eobomDev/backend/tests/access-check.test.ts(신규) · eobomDev/backend/package.json(`report:access-check` 추가 · `test`에 access-check.test.ts 추가) · eobomDev/backend/.env.example(`OPS_AUDIT_DATABASE_URL=` 추가) · .gitignore(`ops-reports/` 추가)
- **결과**: `OPS_AUDIT_DATABASE_URL`만 읽어(없으면 "OPS_AUDIT_DATABASE_URL 값이 없습니다 — 중단합니다." 후 exit 1) `SET TRANSACTION READ ONLY` + `has_table_privilege(current_user,'"User"','SELECT')` 참이면 "점검 전용 계정이 아닙니다"로 거부 → ①~⑧ 조회 → `ops-reports/접속기록점검_YYYY-MM.html` 생성(`--month=YYYY-MM`·`--out=`). 결과지는 외부 글꼴·스크립트 없음, ⑦은 시각·errorName만 조회(message 열을 SELECT하지 않음). 기준값은 파일 맨 위 `LIMITS`(50 · 365/730/90 · 300MB).
  검증: `node --require ts-node/register/transpile-only --test tests/access-check.test.ts` 10/10 통과 · `npm test` 447건 중 445 통과·0 실패·2 skip · `npx tsc --noEmit --strict --esModuleInterop --skipLibCheck --target es2020 --module commonjs prisma/report-access-check.ts tests/access-check.test.ts` exit 0(프로젝트 tsconfig는 `src/**`만 포함해 prisma/·tests/를 안 본다) · 로컬에서 OPS_AUDIT_DATABASE_URL 미설정 → 거부, 로컬 관리자 주소(DATABASE_URL 값) → "점검 전용 계정이 아닙니다" 거부(둘 다 결과 파일 안 생김) · `git status`에 ops-reports/ 안 잡힘(디렉터리 생성 전이라 `.gitignore` 규칙만 반영, 실제 파일은 아래 "알아야 할 것" 참고).
  **확인 2건(로컬, 백업 `local-20261008-092542` 후)**: ① ⑧ 표 크기 — 점검 전용 권한(USAGE+기록 3표 SELECT)으로 `pg_stat_user_tables`·`pg_total_relation_size(relid)` 조회 **된다**(3표 모두: AccessLog 1597440B/3727행, AdminAuditLog 204800B/175행, ErrorLog 106496B/41행), `"User"`는 `permission denied`. ② 풀러 사용자명 형식 — **로컬에서는 확인 불가**(Supabase 풀러가 없음). 문서(`systems.md` §4: `postgres.[ref]`)대로 `eobom_auditor.[ref]`일 가능성을 SQL 파일 주석에 남겼고, 운영 첫 연결 때 확인.
  시험 방식: 역할 생성은 사람 몫이라 영구 생성하지 않고, 임시 스크립트(삭제함)가 롤백되는 트랜잭션 안에서 `CREATE ROLE … SET LOCAL ROLE eobom_auditor`로 전환한 채 `runChecks` 8개 + HTML 생성을 실행 → 2026-10분 ①0 ②0 ③1 ④1 ⑤26일 ⑥정상 ⑦0 ⑧1.8MB, 끝난 뒤 `pg_roles`에 eobom_auditor 0개.
- **편차**: ① 스펙 `BEGIN READ ONLY` → Prisma 대화형 트랜잭션이 이미 BEGIN을 하므로 첫 문장 `SET TRANSACTION READ ONLY` + `transaction_read_only='on'` 확인으로 구현(같은 효과). ② `pg` 패키지가 없어 새 의존성을 더하지 않고 `PrismaClient({datasources:{db:{url}}})`로 접속(다른 주소로 폴백하지 않음). ③ 10.6 첫 항목 "eobom_auditor 계정으로 실행 → 결과지 생성" — 처음엔 계정이 없어 롤백 시험으로 대신했으나, **같은 날 개발자가 로컬에 계정을 만들고(백업 후) `npm run report:access-check`를 실행해 접속 계정 `eobom_auditor` 확인 문구와 결과지 생성을 확인함**(로컬 값은 위 시험과 동일). 이때 `--month=2026-10`(진행 중인 달)로 돌려 ⑤가 아직 안 온 날 26일을 나열 → **끝나지 않은 달은 거부**(`isMonthFinished`)하고 ⑤ 날짜는 한 줄에 6개씩 묶도록(`chunkDates`) 보완. 시험 12건. ④ 표 10 체크리스트·표 11 메모는 R740 원문을 못 열어(바탕화면에서 못 찾음) 00-43 §4 단계와 §6 칸 구성으로 만들었다 — R740과 문구 맞춤 필요. ⑤ ⑧ "300MB"는 pg_size_pretty와 같은 1MB=1024×1024B로 계산(00-43 §5 ⑧ 문구의 "kB=1/1000MB"와 미세한 차이, 경계 근처에서만 다름).
- **다음 에이전트가 알아야 할 것**: (1) 사람이 할 일 — 로컬/운영 각각 `backup-db.ps1 -Target local|prod` 후 `prisma/sql/create-auditor-role.sql`의 `<비밀번호>`를 바꿔 실행 → `.env`(로컬)에 `OPS_AUDIT_DATABASE_URL` 설정 → `npm run report:access-check -- --month=2026-10` 첫 실행. (2) `ops-reports/`는 첫 실행 때 생기며 `.gitignore`로 제외되지만 커밋 전 `git status` 확인할 것. (3) ⑥은 대상 달이 아니라 실행일 기준(수기 §5 ⑥과 동일). (4) 로컬 DB의 10월 ⑤가 26일로 나오는 건 개발 DB에 이용이 없던 날이라 정상 범위 — 운영 첫 실행(11월 첫 주)에 수기 결과와 한 번 대조 권장(00-43 §10.6). (5) 위 "편차" ④⑤는 Opus 판단 필요. (6) **실행기**: `eobomDev/backend/scripts/access-check-launcher.bat`+`.ps1`(저장소에 둠 · 개발자 바탕화면에는 이를 부르는 바로가기 `eobom-access-check.lnk`만. 경로·주소 하드코딩 없음 — backend 경로는 `$PSScriptRoot`, 로컬 호스트·DB 이름은 `.env`의 `DATABASE_URL`에서 읽고 로컬이 아니면 중단; 먼저 `.harness/tools/`에 두었던 사본은 삭제) — 더블클릭 → 로컬/운영 선택 → 비밀번호 항상 입력 → 실행 → 결과지 자동 열기. 비밀번호는 창 안 환경변수로만 쓰고 끝나면 지움. 운영은 호스트·DB 이름만 `.env`의 `BACKUP_DATABASE_URL`에서 읽음. 문법 검사만 했고 실제 더블클릭 실행은 개발자 확인 전.

<!-- Gemini 판정 1줄: 🔄스펙갱신 (점검 스크립트 반자동화 및 READ ONLY 계정 검증 통과 / 00-43에 표 10·11 서식 및 월 미종료 거부 규칙 반영) -->

## 2026-10-07 | [Sonnet] 유언장 사진 보관 — 삭제 확인창이 본창 뒤에 깔리는 버그 수정

- **근거 스펙**: docs/06_엔딩노트_유언/06-06_유언장_사진인식_요건확인_기획서.md §5-2-4(확인창 문구 — 문구는 그대로)
- **건드린 파일**: eobomDev/frontend/src/components/endingNote/WillPhotoVault.tsx
- **결과**: 삭제 확인창(`alertdialog`)과 안내창(`HeavyNoticeDialog`)을 본창 overlay 뒤로 옮겼다. 둘 다 `.v2-modal-overlay`(z-index 2000)라 나중에 렌더된 쪽이 위에 온다. CSS·다른 화면 모달은 건드리지 않음. 목록의 "삭제"와 보기 화면의 "삭제"가 같은 `confirmDeleteId` 확인창을 쓰므로 둘 다 해결. 재현: `cd eobomDev/frontend && npx tsc --noEmit`(에러 0) · `npm run build`(통과). 실화면 재확인은 하지 못했다(dev 서버를 켜지 않음).
- **편차**: 지시는 확인창만이었으나 같은 원인(본창보다 먼저 렌더)이던 안내창(`notice`)도 같이 옮겼다. 그 외 없음.
- **다음 에이전트가 알아야 할 것**: [Opus] 로컬 실화면에서 목록·보기 양쪽 삭제 → 확인창이 위에 뜨는지, 취소·삭제 동작 확인. 확인창의 `onClick` stopPropagation은 그대로 둠(본창과 형제라 영향 없음).

<!-- Gemini 판정 1줄: ✅통과 (WillPhotoVault 삭제 확인 모달 및 안내창 z-index 렌더 순서 보정으로 오버레이 중첩 버그 해소 확인) -->

## 2026-10-07 | [Sonnet] 아카이브 Worker 분할 전송(멀티파트) 확인·보완

- **근거 스펙**: docs/00_핵심플랫폼/00-11_백엔드_DB_배포_및_인프라_전략_결정서.md §5.4-5-2-1-1(보정②·완료 판정 기준) · §5.4-5-3
- **건드린 파일**: eobomDev/workers/r2-archive-relay/src/index.ts · eobomDev/workers/r2-archive-relay/README.md
- **결과**: 확인 — `src/index.ts`는 이미 `PutObject`·`CopyObject`·`CompleteMultipartUpload` 셋을 통과시킨다(보정② 코드는 반영돼 있었음). 보완 2건: ① README 5단계가 대시보드에서 `PutObject`만 고르라고 안내해 분할 업로드 이벤트가 큐에 안 오는 구멍 → 셋 모두 체크로 수정 · ② 복제 뒤 사본 크기가 원본과 다르면 `retry`(완료 판정 "같은 키·같은 크기"). 재현: `cd eobomDev/workers/r2-archive-relay && npx tsc --noEmit`(에러 0). 🔴 Worker는 실제 Cloudflare에 배포·실업로드로 돌려보지 못했다(사람 전용).
- **편차**: 크기 검증은 스펙이 요구한 코드가 아니라 판정 기준을 코드로 옮긴 추가분. 그 외 없음.
- **다음 에이전트가 알아야 할 것**: 00-11 §5.4-5-2-1-1 말미 "09-30 현황 … 보정② 미반영" 줄은 이미 낡았다(코드는 반영됨) — [Opus]가 정정. 배포 시 대시보드 이벤트 유형 체크 확인 + 큰 파일 1건 실업로드로 두 버킷 크기 대조(사람).

<!-- Gemini 판정 1줄: 🔄스펙갱신 (Worker 멀티파트 3종 액션 허용 및 크기 검증 retry 보완 통과 / 00-11 §5.4-5-2-1-1 미반영 서술 정정 필요) -->

## 2026-10-07 | [Sonnet] 유언장 사진 보관 P4 (06-06 §5-2 전체)

- **근거 스펙**: docs/06_엔딩노트_유언/06-06_유언장_사진인식_요건확인_기획서.md §5-2-1~5-2-6 · §9 P4 (10-07 개발자 결정)
- **건드린 파일**:
  - 스키마·마이그레이션: eobomDev/backend/prisma/schema.prisma(`WillPhotoSet`·`WillPhoto` 추가 + `User.willPhotoSets`) · prisma/migrations/20261007150000_add_will_photo/migration.sql(`WillPhotoSet_created_at_kst` 트리거 포함) · docs/00_핵심플랫폼/00-05_DB_요구사항_및_테이블_사전.md(`generate-db-doc.js` 자동 생성분)
  - 백엔드 신규: src/services/willPhotoStorage.ts · src/services/willPhotoService.ts · src/controllers/willPhotoController.ts · src/routes/willPhotoRoutes.ts · prisma/destroy-will-photos.ts · tests/will-photo.test.ts
  - 백엔드 수정: src/config/r2.ts(`isWillBucketConfigured`·`isWillPhotoEnabled`·`getWillClient`·`getWillBucket`) · src/app.ts(`/api/will-photos`) · src/controllers/ocrController.ts(status `photoStorageEnabled` · `keepPhoto` · 응답 `photo`) · src/controllers/farewellPurgeController.ts(`WILL`·`I:` 접두·`willPhoto` 목록·`type=I`) · src/services/accountPurgeService.ts(0단계 사진 파기·`AccountPlan.willPhotoSets`) · prisma/destroy-farewell-media.ts(①-3 유언장 사진 만료·탈퇴 dry-run 출력) · .env.example · package.json(`purge:will`·test 목록) · tests/farewell-purge-retired.test.ts(counts에 `I: 0`)
  - 프론트 신규: src/components/endingNote/WillPhotoVault.tsx
  - 프론트 수정: src/components/endingNote/WillPhotoUploadModal.tsx · WillPhotoResult.tsx(`WillOcrResponse.photo`) · src/pages/EndingNotePage.tsx · src/pages/AdminPage.tsx
- **결과**: 스위치 `R2_WILL_ENABLED`(기본 false·버킷 변수 4개 필요) · 인식 성공 + `keepPhoto=true`일 때만 같은 요청에서 `encryptNoteBuffer`로 암호화 저장(묶음·회원당 10·파일 이름 미저장) · 보관 목록/보기(인증 fetch→복호화→blob)/삭제(소프트)/다시 인식 · 어드민 파기 ④ + 감사 `I:` + 파기 기록 `유언장 사진` 필터 · 탈퇴 파기에서 편지보다 앞 · 일괄 파기 스크립트(dry-run 기본). 문구 3곳은 §5-2-4 표 그대로(스위치 꺼짐이면 옛 문구).
  재현: `cd eobomDev/backend && npx tsc --noEmit`(에러 0) · `npm test`(437건 통과, 신규 will-photo 15건) · `cd eobomDev/frontend && npm run build`(통과). 로컬 DB: `backup-db.ps1 -Target local` → `local-20261007-162035.dump`(439KB 확인) → `prisma migrate deploy`로 적용. 테스트 DB는 `npm run test:db:migrate`.
- **편차**:
  1. **다시 인식** — 서버에 새 엔드포인트를 두지 않고, 화면이 보관한 사진을 인증 fetch로 받아 기존 `POST /api/ocr/recognize`에 다시 올린다(`keepPhoto` 없이 → 새로 보관 안 함). 하루 10회·대기열·상한 검사가 그대로 걸린다. 대신 사진이 한 번 더 업로드된다.
  2. **보관 실패의 처리** — 스펙은 "인식 성공 시에만 저장"까지만 정했다. 10묶음 초과·R2 오류는 인식 결과를 막지 않고 응답 `photo: { stored:false, message }`로 알린다(이미 CLOVA를 쓴 결과라 버리지 않음). R2 오류 때 먼저 올린 쪽은 지운다.
  3. 서버는 `keepPhoto==='true'`일 때만 저장한다(보내지 않으면 안 함) — 화면의 "기본 켬"은 화면이 `keepPhoto`를 보내는 것으로 구현.
  4. `destroy-farewell-media.ts`에도 ①-3(유언장 사진 만료)을 넣었다(스펙은 어드민 화면·`destroy-will-photos.ts`만 명시). 어드민과 같은 서비스 함수를 쓴다.
  5. 저장 mime은 `image/jpeg`·`image/png`·`application/pdf`(heic는 서버가 jpg로 바꾼 것).
- **다음 에이전트가 알아야 할 것**:
  - 🔴 **실기동 검증 대기(화면 확인은 [Opus])** — 로컬 `.env`에 `R2_WILL_ACCESS_KEY_ID`·`R2_WILL_SECRET_ACCESS_KEY`·`R2_WILL_BUCKET=eobom-will-photo-dev`·`R2_WILL_ENABLED=true` 필요(없으면 화면은 옛 문구 그대로). 시험은 R2·CLOVA를 가짜로 바꿔 돌렸고 **실제 R2 업로드는 아직 안 돌려봤다**.
  - 🔴 **운영**: `migrate-prod.ps1`(개발자) → Render에 `R2_WILL_*` 변수(운영 버킷·토큰) 추가 후에만 켜진다. 추가형 스키마라 순서 무관.
  - `--confirm`(`destroy-will-photos.ts --all`·`destroy-farewell-media.ts`)은 실행하지 않았다(사람 전용).
  - `prisma generate`가 `query_engine-windows.dll.node` EPERM(다른 프로세스가 잡고 있음)으로 엔진 교체에 실패했다. 타입(`index.d.ts`)은 새로 생성돼 `tsc`·테스트는 통과. 개발 서버를 껐다 켜기 전에 `npx prisma generate` 한 번 더.
  - 처리방침(`00-19`) 문구·사장님 금지 시 절차는 스펙 §5-2-6·§5-2-7 그대로 — 코드 쪽 준비만 끝났다.
  - 🔴 미커밋

<!-- Gemini 판정 1줄: ✅통과 (WillPhotoSet/WillPhoto 스키마 및 암호화 보관, 회원당 10장 한도, 관리자 파기 파이프라인 전 구간 구현 확인) -->

---
## 2026-10-07 | [Sonnet] eobomDev/README.md 현행화 — 문서만(빌드 영향 없음)

- **건드린 파일**: eobomDev/README.md — 숫자 실측 반영(모델 37·마이그레이션 48·화면 24·공통 UI 51) · 구조도에 services/·middleware/·workers/r2-archive-relay 추가 · 스크립트 표에 test·purge(`--confirm` 사람 전용 주석)·report:heavy·import:facility-mohw · "pg_dump 먼저" 2곳 → `backup-db.ps1 -Target local` + db-safety.md 링크 · 최종 갱신 10-07
- **편차**: `workers/`는 backend 안이 아니라 `eobomDev/workers/`라 구조도 최상위에 두었다. 공통 UI 51은 `components/` 하위 폴더 포함 `.ts`·`.tsx` 전체(최상위 `.tsx`만 세면 18)
- **다음 에이전트가 알아야 할 것**: 🔴 미커밋

<!-- Gemini 판정 1줄: ✅통과 (eobomDev 최신 구조도, 실측 모델수/마이그레이션수 및 backup-db.ps1 안내 현행화 확인) -->

---
## 2026-10-07 | [Sonnet] 부고 경로 추모관 expiresAt 누락 수정 + 기존 행 채우기

- **근거 스펙**: docs/00_핵심플랫폼/00-20 §8.1 표 "expiresAt 계산" 줄 (10-07)
- **건드린 파일**: backend/src/controllers/obituaryController.ts(작성 시 함께 개설·사후 연결 `memorial.create` 2곳) · backend/prisma/migrations/20261007120000_backfill_memorial_expires_at/migration.sql(신규, 데이터만) · backend/tests/obituary-memorial-expiry.test.ts(신규 3건) · backend/package.json(test 목록)
- **결과**:
  - 두 `create`에 `createdAt: now` + `expiresAt: calculateMemorialExpiresAt(now)` 추가(`memorialController`와 같은 함수·같은 방식)
  - 채우기 SQL: `expiresAt IS NULL AND frozenAt IS NULL` → `createdAt + 395일`. 스키마 변경 없음 · 두 번 돌려도 같은 결과
  - 로컬: 백업 `local-20261007-155646.dump`(417.5KB) 확인 후 `migrate deploy` 적용 → 빈 행(동결 제외) 0건 / 전체 18건. 시험 DB에도 적용
  - 시험: 부고 작성+추모관 체크 · 사후 연결 · 채우기 SQL(빈 행만 채움·동결 행 그대로·이미 채운 행 그대로·남은 빈 행 0건) — 모두 통과. backend `npm test` 422건 통과 · tsc 0
- **편차**: 채우기 SQL은 `closedAt`·`hiddenAt` 있는 행도 채운다(스펙 조건이 `expiresAt`·`frozenAt`뿐이라 그대로 따름 — 값만 채우고 동작은 바꾸지 않는다)
- **다음 에이전트가 알아야 할 것**: 🔴 미커밋. **운영 미적용 — `migrate-prod.ps1`은 개발자가 돌린다**(데이터 변경뿐이라 추가형 순서 무관). 화면 확인은 [Opus]

<!-- Gemini 판정 1줄: ✅통과 (부고장 개설 경로 추모관 생성 시 expiresAt 누락 수정 및 백필 마이그레이션 정상 적용 확인) -->

---
## 2026-10-07 | [Sonnet] ⑥ 연장 버튼 표시 시점 — 서버 판정 `canExtend`

- **근거 스펙**: docs/00_핵심플랫폼/00-20 §8.1-4 ②-가 (10-06 개발자 결정 A) · §8.1-2(통지 시점 계산)
- **건드린 파일**: backend/src/services/memorialExtendService.ts(`canExtendNow`·`NOT_YET`) · backend/src/controllers/memorialController.ts(`listMyMemorials`) · backend/tests/memorial-lifecycle-db.test.ts(+1건) · frontend/src/pages/MyObituaryListPage.tsx
- **결과**:
  - `canExtendNow` 하나가 판정 — `closedAt`·`hiddenAt` 없음 AND (`frozenAt` 있음 OR 지금 ≥ `calculateMemorialNoticeDate`). 목록과 연장 API가 같은 함수를 씀
  - `GET /api/me/memorials`: 추모관마다 `canExtend` 추가 · `POST /api/memorials/:id/extend`: 닫힘·내림 거부 다음에 `canExtendNow` 아니면 409 "아직 연장할 수 있는 기간이 아닙니다." (통지 링크 경로는 그대로)
  - 화면: 버튼은 `canExtend`일 때만 · 연장 성공 시 그 행 `canExtend=false` · 보존 기간 종료일·삭제 예정일 줄은 그대로
  - 시험 1건 추가: 통지 시점 전(false·409·값 불변) · 시점 후(true·200) · 동결(true·200) · 닫힘/내림(false·409). backend tsc 0 · frontend tsc 0 · `retention-purge`+`memorial-lifecycle-db` 33건 통과 (전체 `npm test`·frontend build는 안 돌림)
- **편차**: `expiresAt`이 비어 있는 비정상 행은 통지 시점을 못 구해 동결일 때만 허용(스펙에 없는 경우)
- **다음 에이전트가 알아야 할 것**: 🔴 미커밋. 화면 실확인은 [Opus]가 dev 서버로(개발자 요청) — 나는 서버를 띄우지 않았다

<!-- Gemini 판정 1줄: ✅통과 (canExtendNow 서버 판정 함수 기반 목록/연장 API 일원화 및 화면 연장 버튼 노출 제어 일치 확인) -->

---
## 2026-10-07 | [Sonnet] D-12 #71~74 — 어드민 파기 화면: 밀려난 음성 + 종류 접두 + 파기 기록 보기 · 녹음 자동 중지 595초

- **근거 스펙**: docs/06_엔딩노트_유언/06-05 §8 D-12 #71~74 · §6.5(targetIds) · §5.6-9-2 Ⓑ① · §5.6-8-3(D-11)
- **건드린 파일**: backend/src/controllers/farewellPurgeController.ts · backend/src/routes/adminRoutes.ts · backend/prisma/schema.prisma(`targetIds` 주석만, 마이그레이션 없음) · backend/src/services/farewellPurgeService.ts(`isStillRetiredExpired`) · backend/tests/farewell-purge-retired.test.ts(신규 8건) · backend/tests/auth-boundary.test.ts(logs 경로 추가) · backend/package.json(test 목록) · frontend/src/pages/AdminPage.tsx · frontend/src/lib/heavyLimits.ts(`RECORD_AUTO_STOP_SECONDS = audioMaxSeconds - 5`) · frontend/src/components/farewell/VoiceToTextInput.tsx
- **결과**:
  - **#73**: 감사 로그 `targetIds` 항목마다 종류 접두 — 음성만 `V:` · 편지 통째 `L:` · 밀려난 음성 `R:`(`retired:` 접두 대체). 밀려난 음성 행 문구 "이전 음성 (새 음성으로 교체됨)" + "삭제 ○○". 목록 응답 주석 정정
  - **#74**: `GET /api/admin/farewell-purge/logs?type=V|L|R&page=&pageSize=` (어드민 인증·읽기 전용, 최근 순, 기본 20건). type은 해당 접두가 하나라도 있는 행. 응답은 실행 시각·운영자 이름·건수·종류별 건수·대상 id(접두 포함)뿐 — 편지 제목/본문·R2 키 없음. 접두 없는 옛 행은 `구분 없음`으로 세고 type 필터에는 안 나옴(전체에서만). 화면: 파기 화면 맨 아래 "파기 기록" 절 — 필터 [전체][삭제된 음성][밀려난 음성][편지 통째] + 이전/다음. 실행 직후 1쪽으로 다시 불러옴
  - 시험 추가 4건(#74): 전체에서 종류별 건수·옛 행 구분 없음 · V·R 섞인 행이 V·R 필터엔 나오고 L엔 안 나옴 · 옛 행은 어느 필터에도 안 나옴 · 잘못된 type 400·응답에 `mediaKeys` 없음. 기존 시험은 `R:` 접두로 갱신
  - backend `npm test` 418건 통과 · tsc 0 · frontend build 통과
  - (이전 #71·#72 결과)
  - **#72**: 녹음 자동 중지를 595초로(서버 `audioMaxSeconds` 600은 그대로). 화면 문구 "(최대 10분)"·"최대 10분까지 녹음할 수 있습니다." 유지. 상수는 heavyLimits.ts에 이름 붙임
  - **#71**: `GET /api/admin/farewell-purge/expired` 응답에 `retired`(id·deletedAt만, 키 미노출) 추가 → 화면에 "①-2 밀려난 음성 만료" 구역(건별 선택). 실행은 기존 `/execute`에 `type: 'RETIRED'` 추가 — 서버 재검증(`isStillRetiredExpired`: purgedAt 없음 + deletedAt+30일 경과, 하나라도 실패하면 409로 전체 거부) · 건수 입력 · 비밀번호 재인증 · 감사 로그는 기존과 동일. 처리는 `purgeRetiredRow` 재사용(원장 → R2 삭제 → purgedAt, 행은 지우지 않음)
  - 시험 4건: 목록에 만료 행만(키 미노출) · 만료 전 행 409·미기록 · 건수 불일치 400 · 실행 후 purgedAt + 원장 1행 + 감사 로그, 재전송은 409로 원장 중복 없음
  - backend `npm test` 406건 통과 · backend/frontend tsc 0 · frontend build 통과
- **편차**:
  1. 접두 도입 이전에 쌓인 운영 행은 접두가 없어 "구분 없음"으로만 보인다(재분류하지 않음). 미커밋이던 `retired:` 접두 행은 운영에 없으므로 따로 처리하지 않았고, 있어도 "구분 없음"으로 센다
  2. 화면 목록의 이전 음성 행에는 제목이 없다(표에 편지 정보를 두지 않음 — 개인정보 없음 원칙)
  3. 파기 기록은 별도 탭이 아니라 파기 화면 안의 절로 두었다(스펙의 "탭/절" 중 절)
  4. 화면 실측 안 함(어드민 화면은 사람 몫)
- **다음 에이전트가 알아야 할 것**: 🔴 미커밋. 파기 배치 스크립트 ①-2(앞서 구현)와 같은 `purgeRetiredRow`를 쓴다. 운영 DB에 `FarewellMediaRetired` 표가 먼저 있어야 한다(앞선 마이그레이션) — 이번 건은 추가 마이그레이션 없음

<!-- Gemini 판정 1줄: ✅통과 (감사로그 접두사 V/L/R 체계화, 어드민 파기 기록 조회 API/화면 및 녹음 595초 자동 중지 스펙 충족 확인) -->

---
## 2026-10-07 | [Sonnet] b17 음성 편지 — 변환과 저장 분리 (D-12 #61~70)

- **근거 스펙**: docs/06_엔딩노트_유언/06-05 §5.6-9 · §6.6 · §8 D-12 #61~70 (10-07 개발자 결정)
- **건드린 파일**: backend/prisma/schema.prisma(`FarewellMediaRetired` 추가) · backend/prisma/migrations/20261007090000_add_farewell_media_retired/ · backend/src/controllers/farewellMessageController.ts(update) · backend/src/services/farewellPurgeService.ts · backend/prisma/destroy-farewell-media.ts · backend/tests/farewell-voice-split.test.ts(신규 6건) · backend/package.json(test 목록) · frontend/src/components/farewell/VoiceToTextInput.tsx(재작성) · frontend/src/components/farewell/FarewellMessageCard.tsx · docs/00_핵심플랫폼/00-05(generate-db-doc 자동 재생성)
- **결과**:
  - **서버**: PATCH에서 `mediaKey` 있고 `mediaDeletedAt` 없는 편지에 다른 `mediaKey` → 409(예전엔 덮어씀). 같은 키 재전송(②재시도)은 통과·무변경. 유예 중(`mediaDeletedAt` 있음) 편지에 새 키 → `prisma.$transaction([Retired 생성, 편지 갱신(mediaDeletedAt=null)])`, Retired.deletedAt = 원래 `mediaDeletedAt`. 파기 배치 ①-2 `findRetiredExpired`/`purgeRetiredRow`(원장 → R2 삭제 → purgedAt, 행 유지), dry-run에 건수 출력
  - **화면**: 업로드·녹음 변환은 `saveAudio=false` 고정, 글은 입력창에만, 원본은 부모의 "저장 전 음성"(듣기·삭제). 편지 `저장`에서만 ① store-audio → ② 편지 저장, ①의 mediaKey는 ②가 성공할 때까지 `storedMediaRef`에 보관(재시도 때 재업로드 없음). 성공하면 편집기 닫힘. Web Speech 코드 삭제, 녹음 중 경과 시간 + 10분 자동 중지·안내. Ⓑ 확인 창 "녹음을 마쳤습니다." 먼저 들어보기·취소·글로 바꾸기 + "취소하면 녹음이 사라집니다."(글로 바꾸기는 Ⓐ와 같은 "작업 중"·마감·알림). 저장 전 음성/미저장 변환 글이 있으면 `beforeunload` 경고. 음성이 붙어 있으면 업로드·녹음 막고 "음성을 삭제한 뒤 다시 녹음해 주세요." 동의 체크·"목소리도 함께 남기기"는 부모로 올려 변환 뒤에도 유지, 편집기를 닫을 때 초기화. 안내·동의 문구에서 "브라우저가 바로 바꾸지 못하면" 삭제
  - backend `npm test` **401건 통과**(신규 6건) · backend/frontend `tsc --noEmit` 0 · frontend `npm run build` 통과 · `eobom_test`(전용 테스트 DB)에 마이그레이션 적용됨
- **편차**:
  1. "목소리도 함께 남기기" 토글을 녹음 탭 전용에서 **업로드·녹음 두 탭 모두**로 옮겼다(상태가 부모로 올라가 탭 사이에 이어지는데, 업로드 탭에서 안 보이면 꺼진 걸 모르고 저장하게 된다)
  2. 저장 전 음성의 `삭제`에 확인창(window.confirm) 추가 — 스펙 표엔 확인 언급 없음
  3. 어드민 파기 화면(`farewellPurgeController`)은 Retired를 아직 안 본다 — 스펙 #68은 배치 ①·dry-run까지만. 화면에서 Retired 만료분을 못 지운다(스크립트로만)
  4. "Retired 생성 실패 시 편지 갱신 안 함"은 `$transaction` 배열 구성으로 보장하며 별도 시험은 없다(실패를 정직하게 만들 방법이 없음)
  5. 막힘 안내 문구를 둘로 나눴다(10-07 개발자 지시) — **Opus 스펙갱신 완료(06-05 §5.6-9-3, 10-07)**. 저장 전 음성: "변환이 끝났습니다. 아래 '저장'을 누르면 글과 음성이 저장됩니다. 다른 음성으로 바꾸려면 위의 '삭제'를 누르세요." / 저장된 음성: "이미 저장된 음성이 있습니다. 위의 '음성 삭제'를 누르면 다시 올리거나 녹음할 수 있습니다."
  6. 프론트 시험(변환 중 닫기·떠나기 경고·②실패 후 재저장 store-audio 1회)은 프론트 시험 틀이 없어 자동 시험 없음 → 실기기 확인 대기(개발자 몫)
  7. **후속 3건(10-07)**: (a) 저장된 음성 막힘 문구 교체. (b) 편지 작성 창을 취소·X·바깥 클릭으로 닫을 때 저장 전 음성이 있으면 window.confirm("저장하지 않은 음성과 글이 있습니다. 닫으면 사라집니다.") — 브라우저 confirm이라 버튼 이름은 [확인=닫기/취소=계속 작성]이고 [계속 작성][닫기] 이름 그대로는 못 쓴다(음성 삭제 확인과 같은 방식으로 맞추라는 지시). 음성이 없으면 묻지 않음. (c) CLOVA 사용 한도 응답(result FAILED + message에 한도/quota)을 QuotaExceededError로 구분 → 503 + code QUOTA + 문구 "지금은 음성 변환을 쓸 수 없습니다. 잠시 후 다시 시도하거나 입력창에 직접 입력해 주세요.", Ⓐ·Ⓑ 모두 알림 창, 저장 전 음성 유지. HeavyJobLog는 error 그대로. 시험 1건 추가(한도 → QuotaExceededError, 무관한 FAILED는 일반 오류). 건드린 파일: clovaSpeechProvider.ts · heavyJob.ts · sttController.ts · willRequirements.test.ts · VoiceToTextInput.tsx · FarewellMessageCard.tsx · lib/api.ts(주석). backend `npm test` 402건 통과 · tsc 0 · frontend build 통과
  8. **모달 정리(10-07 개발자 지시, 문구·배치만 — 동작 불변)**: 음성 편지 업로드·녹음 탭 — 막힌 때(저장 전/저장된 음성)는 폼 전체를 접고 한 줄만 표시, 안내·동의 문구 축약(CLOVA 전송·7일 보관·성능 향상 활용·원본 보관 고지는 유지), 왼쪽 안내문에서 동의 문구와 겹치는 CLOVA 설명 제거. "목소리도 함께 남기기" 토글을 탭에서 "저장 전 음성" 박스로 이동(편차 1번 갱신 — 이제 탭과 무관하게 저장 전 음성 박스에 표시), 박스 안내 한 줄로. 사진 불러오기(OCR) 모달 — 안내 3줄을 2줄로, 목록 안내 축약, 간격 정리. 건드린 파일: VoiceToTextInput.tsx · FarewellMessageCard.tsx · WillPhotoUploadModal.tsx. 🟡 화면 실측 안 함(스크린샷으로 확인 대기)
- 🔄 **Opus 검수(10-07)**: 1~7번(`35b39ab`·`4ba1fa9`·`6cdc3e0`) 스펙 #61~70 일치. 운영 `migrate-prod` 적용됨(개발자) · 실기동 2초 파일: 저장 전 막힘 문구·닫기 확인창 ✅. 후속 = 06-05 D-12 #71(어드민 Retired)·#72(녹음 자동 중지 595초). 아래 줄의 "미커밋"·"닫기 확인 없음"은 해소됨
- **다음 에이전트가 알아야 할 것**: ~~🔴 미커밋.~~ 🔴 **로컬 개발 DB(`eobom_db`)에는 마이그레이션을 적용하지 않았다** — `backup-db.ps1 -Target local` + 사람 확인 후 `prisma migrate deploy`(또는 dev)가 필요. 운영은 `migrate-prod.ps1` → push 안내만(추가형 1건이라 코드보다 먼저). ~~🟡 저장 전 음성이 있는 채로 편집기 `취소`·`X`·바깥 클릭으로 닫으면 확인 없이 사라진다~~(7번 b로 해소). 🟡 `store-audio` 서버는 STT 플래그와 무관하게 R2만 본다(변경 없음). 실기동 검증 대기: 업로드→글 변환→저장 전 음성 듣기/삭제→저장, 녹음→확인 창→글로 바꾸기, 10분 자동 중지, 음성 붙은 편지에서 막힘, 새로고침 경고

<!-- Gemini 판정 1줄: 🔄스펙갱신 (음성 변환/저장 분리, Retired 테이블 보존 및 확인창/안내문구 분기 구현 통과 / 06-05 §5.6-9-3 반영 확인) -->

---
## 2026-10-07 | [Sonnet] 사진 올리기 — 담은 파일 빼기 버튼 + 다시 선택 시 기존 파일 유지

- **근거 스펙**: 스펙 없음 — 개발자 구두 지시(10-07). 06-06 §6 단계 1·§4.1 여러 장
- **건드린 파일**: frontend/src/components/endingNote/WillPhotoUploadModal.tsx
- **결과**: 파일 목록 각 줄에 X(빼기) 버튼. "파일 선택"을 다시 누르면 기존 목록 뒤에 더해진다(같은 이름·크기·수정시각 파일은 건너뜀). 5장·PDF 1개·용량 검사는 합친 목록 기준, 줄이기는 새로 더한 파일만. 안내 문구 한 줄 갱신. frontend `tsc --noEmit` 0. 화면 실기동 미실시(사람 몫)
- **편차**: 없음(스펙 없음 — 지시 구현). 음성 업로드(`VoiceToTextInput`)는 파일 1개라 대상에서 뺐다
- **다음 에이전트가 알아야 할 것**: 🔴 미커밋. 사진 5장을 이미 담은 뒤 더 고르면 "최대 5장" 오류로 막히고 기존 목록은 유지된다

<!-- Gemini 판정 1줄: ✅통과 (WillPhotoUploadModal 파일 개별 제거 버튼 및 누적 선택 UX 개선 확인) -->

---
## 2026-10-07 | [Sonnet] 사진 인식 실기동 후속 b13·b14·b15 + CLOVA 음성 5분 측정

- **근거 스펙**: docs/06_엔딩노트_유언/06-06 §4.1 · §6 단계 5-1 (10-07 지시)
- **건드린 파일**: backend/src/services/clovaOcrProvider.ts · backend/src/controllers/ocrController.ts · backend/src/services/willRequirements.test.ts(시험 1건) · frontend/src/components/endingNote/WillPhotoUploadModal.tsx · frontend/src/components/endingNote/WillPhotoResult.tsx
- **결과**:
  - **b13 원인**: `big_img_test.jpg`는 글자가 없는 방 사진(7008×4672)이다. 브라우저와 같은 방식(긴 변 1960·JPEG 92 → 1960×1307, 397KB)으로 줄여 로컬에서 CLOVA OCR에 1회 보내니 1.1초 만에 `inferResult=FAILURE · ENGN-001 NO_TEXT`로 거절 — 용량·크기·내부 처리 문제가 아니다. 코드가 이를 일반 오류로 던져 502 "인식 서비스에 연결하지 못했습니다"로 나갔다. 고침: NO_TEXT → `NoRecognizedTextError`, 응답 502에 `code:'NO_TEXT'` + 문구 "사진에서 글자를 찾지 못했습니다. 글이 보이는 사진으로 다시 올리거나 아래 입력창에 직접 입력해 주세요."(처리한 건이라 하루 횟수는 그대로 둠 — 기존 동작). 화면은 502 또는 `NO_TEXT`면 알림 창(HeavyNoticeDialog)으로 이유를 띄운다(전에는 모달 아래쪽 한 줄이라 진행창만 사라진 것처럼 보임). 시험 1건 추가(NO_TEXT → NoRecognizedTextError)
  - **b14**: `RecentOcr.pageTexts`(고친 쪽별 글) 추가. `WillPhotoResult`가 닫힐 때 한 번 부모로 넘기고(글자 칠 때마다 `EndingNotePage`가 다시 그려지지 않게), 다시 열면 `initialPageTexts`로 받는다. 브라우저 메모리만, 서버 저장 없음
  - **b15**: `ACCEPT`에 `.heic,.heif,image/heic,image/heif` 추가 + 주석 갱신. 서버 변환 경로 그대로
  - **음성 5분 측정(CLOVA 1회)**: `voice_test.m4a`(35.8초)를 이어 붙여 5분 m4a(2.8MB, 오디오 복사·moov 파일 끝)를 만들어 `ClovaSpeechProvider.transcribe`를 일회성 스크립트로 1회 호출(서버 기동 없음·재시도 없음·R2 저장 없음). **응답 4.6초**(5분 음성 → 2,061자). 프로세스 메모리 시작 95.4MB → **최고 120.6MB(+25MB)**, 이 중 힙 35.9MB·버퍼 43.3MB. 선형이라 해도 10분 ≈ 9~10초 → **×2도 115초 안에 충분히 든다**(여유 약 12배). 코드 변경 없음
  - `npm test` 395건 통과 · backend/frontend `tsc --noEmit` 0 · frontend `npm run build` 통과
- **편차**: b13 알림은 지시의 "502를 받으면 이유 알림"을 서버 코드 `NO_TEXT` 추가 + 화면에서 502 전부로 구현. 측정은 허용된 "일회성 스크립트" 방식을 택해 로컬 백엔드를 기동하지 않았다(그래서 업로드 수신(multer)·대기열 시간은 포함되지 않음)
- **다음 에이전트가 알아야 할 것**: 🔴 미커밋. 🟡 측정 음성은 같은 문장 반복이라 CLOVA가 빠르게 끝냈을 수 있다 — 실제 10분 녹음은 시간이 더 걸릴 수 있어 운영 실측 때 재확인. 메모리는 provider 단독값이라 서버(multer 사본 + 동시 2건)에서는 더 커진다 — Render 플랜(512MB?) 확인과 함께 볼 것. 🟡 `big_img_test.jpg`는 "글자 없는 사진" 시험용으로 적합(운영에서 NO_TEXT 알림이 뜨는지 사람이 실기동으로 확인). 측정 파일·스크립트는 스크래치패드에만 있고 저장소에 없음

<!-- Gemini 판정 1줄: ✅통과 (NO_TEXT 에러코드 분기 및 HeavyNoticeDialog 안내, RecentOcr 쪽별 글 유지 및 HEIC 확장자 허용 확인) -->

---
## 2026-10-07 | [Sonnet] ⑤ 날인(붉은 인장) 못 찾음 보정 — 빨강 판정 교체·최소 크기 면적 비례

- **근거 스펙**: docs/06_엔딩노트_유언/06-06 §9-1 T-3 · §9-1-1 (10-06)
- **건드린 파일**: backend/src/services/sealDetect.ts · backend/src/services/willRequirements.test.ts
- **결과**: 빨강 = 최대값이 R · 채도 ≥0.25 · 최대값 ≥70 · |G−B| <(최대−최소)×0.6(상수 4개를 파일 상단에). 최소 크기 = 분석 이미지 면적×0.02%(고정 80점 폐지). 모양 기준 비율 3.5·변 45%·결과 문구·범위는 그대로. 시험 추가 4건 — 합성 오탐(붉은 가는 줄·붉은 펜 글씨 모양·주황 면·나무색 면·분홍 배경 → 전부 0개)·가장자리에 걸린 어두운 주홍 인주 1개·실사진 wills001.jpeg 인장 1개(오른쪽 아래)·wills002.jpg 0개(사진 없으면 건너뜀). `npm test` 394건 통과 · `tsc --noEmit` 0 오류
- **편차**: 🔴 **채움 비율 `MIN_FILL` 0.12 → 0.08**(지시는 유지). 새 빨강 판정 + 면적 비례 최소 크기만으로는 wills001 인장이 **채움 0.097**(붉은 점 56개 / 외곽 24×24)이라 이 기준에서 탈락해 0개였다. 인주가 옅어 붉은 점이 성기게 잡힘. 0.08로 내리니 1개 찾음·wills002 0개·합성 오탐 전부 0개. 값은 상단 상수 한 줄이라 되돌리기 쉽다 — **Opus가 §9-1 T-3 숫자(채움 0.12)를 갱신할지 결정**
- **다음 에이전트가 알아야 할 것**: 🔴 미커밋. 사진 2장 기준 조정이라 표본이 적다 — 사람이 새 시험 사진을 주면 같은 시험(`willRequirements.test.ts` 하단)에 추가. 이 사진은 흑백 판정(`grayscale`)도 true로 나온다(채도 25 초과 픽셀 0.5% 미만) — 이번 지시 범위 밖이라 안 건드림. 시험 사진은 저장소에 없어 다른 PC에서는 건너뜀

<!-- Gemini 판정 1줄: 🔄스펙갱신 (인장 감지 면적 비례 최소 크기 및 빨강 판정 알고리즘 개선 통과 / 06-06 §9-1 T-3 MIN_FILL 0.08 갱신 필요) -->

---
## 2026-10-07 | [Sonnet] report:heavy 운영 조회 옵션(`--target local|prod`)

- **근거 스펙**: .harness/db-safety.md §2-2(10-07 개발자 결정)
- **건드린 파일**: backend/prisma/report-heavy-jobs.ts(`--target` 추가·prisma를 동적 import로 전환) · backend/.env.example(`DATABASE_URL` 위 안내 3줄)
- **결과**: 생략=local(`.env` 그대로, 동작 불변). prod=`.env`의 `BACKUP_DATABASE_URL`을 이 실행의 `process.env.DATABASE_URL`에만 대입(`.env` 불변) — 값 없음·로컬 주소(localhost·127.0.0.1·host.docker.internal)면 메시지 후 종료(`migrate-prod.ps1:33-37`과 같은 검사). 출력 첫 줄 `대상: 로컬|운영 (호스트/DB이름)` — 계정·비밀번호는 안 찍음. 읽기 전용(기존 `loadHeavyJobRows`·`summarizeHeavyJobs`만 사용, 쓰기 질의 없음)이라 백업 불필요. 재현: `npx tsc --noEmit`(backend) 0 · `--target` 없음/`local` → "대상: 로컬 (localhost:5433/eobom_db)" 정상 · `prod`+로컬 주소 → 거부(종료코드 1) · `prod`+빈 값 → 거부 · `--target foo` → 거부. **prod 실조회는 미실시(사람 몫)**
- **편차**: prisma 클라이언트가 생성될 때 `DATABASE_URL`을 읽으므로, 주소를 정한 뒤 불러오도록 `heavyJobLogService`·`prisma` import를 `main()` 안 동적 import로 바꿨다. `import 'dotenv/config'` 추가(기존 `.env` 자동 로드와 동일, 이미 있는 환경변수는 덮지 않음). 오류 종료는 `process.exitCode`로 바꿔 `$disconnect`가 돌게 했다
- **다음 에이전트가 알아야 할 것**: 🔴 미커밋. 🟡 개발자가 `npm run report:heavy -- --target prod`로 첫 줄이 "대상: 운영 (…supabase.com…)"인지 확인할 것

<!-- Gemini 판정 1줄: ✅통과 (report:heavy 스크립트 대상 DB 환경 플래그 분기 및 읽기 전용 안전 검증 확인) -->

---
## 2026-10-06 | [Sonnet] ④ 사진 인식·음성 변환 처리 결과 건별 기록 + 조회 스크립트 + 1년 파기(⑪)

- **근거 스펙**: docs/06_엔딩노트_유언/06-04 §6.4-11-10-1(10-06 개발자 결정)
- **건드린 파일**: backend/prisma/schema.prisma(`HeavyJobLog` 신설, `PurgeRunLog.step` 주석) · prisma/migrations/20261006130000_add_heavy_job_log(신규, 추가형·createdAtKst 트리거) · services/heavyJobLogService.ts(신규 — `recordHeavyJob`·`summarizeHeavyJobs`·`loadHeavyJobRows`·1년 파기) · services/heavyJob.ts(`runHeavyJob`이 건마다 기록·`heavyJobRuntime.record`·`audioSec`·`skipRecordOnError`) · controllers/sttController.ts(`audioSec: durationSec` 전달) · controllers/ocrController.ts(`UserInputError`·`DailyLimitError`는 기록 제외) · config/policy.ts(`retention.heavyJobLogYears: 1`) · services/retentionPurgeService.ts(`PurgeStep`에 `HEAVY_JOB_LOG`) · prisma/destroy-farewell-media.ts(⑪ 단계) · prisma/report-heavy-jobs.ts(신규 — `npm run report:heavy -- --days N --by day`) · package.json(`report:heavy`) · src/services/heavyJob.test.ts(기록 시험 5건, 기본 기록기 해제) · tests/heavy-job-http.test.ts(DB 기록 확인 시험 +1) · docs 00-05(`generate-db-doc.js` 재실행 — 36모델·442칸·설명 없음 0)
- **결과**: 기록 칸 = 종류(photo/audio)·결과(success/busy/slow/error/aborted)·대기 ms·처리 ms·음성 길이(초)·시각, 파일·인식 텍스트·이름·사용자 ID 칸 없음. 대기열 거절(503)도 `busy`로 기록. 기록 실패는 삼키고(콘솔 한 줄) 기다리지 않아 응답에 영향 없음(기록기가 던지는 시험 포함). 재현: `npx tsc --noEmit`(backend, prisma 스크립트 2개 별도) 0 · `heavyJob.test.ts` 24/24 · 로컬 `backup-db.ps1 -Target local`(local-20261006-164519.dump 375.9KB, 파일 확인) 후 `migrate deploy`·`migrate status` 최신 · `npm run test:db:migrate` · `npm test` 390/390 3회 연속 · 로컬 `npm run purge`(dry-run) ⑪ 대상 0건 · `npm run report:heavy` 정상(기록 0건). 운영은 미적용 — 추가형이라 개발자가 `migrate-prod.ps1` → push 순서
- **편차**: ① "CLOVA 처리 ms"를 슬롯을 얻은 뒤 작업 전체 시간으로 쟀다(사진은 변환·인주 분석, 음성은 R2 저장 포함 — CLOVA 호출만 따로 재려면 provider 안쪽을 건드려야 함). ② 사용자 입력 오류(PDF 쪽수 초과)·하루 한도 초과는 "처리 결과"가 아니라 기록하지 않았다(오류 건수에 섞이지 않게). ③ 보관기간 1년을 `policy.ts` `retention`에 두었다(②의 기간 숫자 모음 원칙). ④ 커밋이 DB 반영·DB 시험보다 먼저 나갔다(개발자가 먼저 커밋) — 이후 반영·시험을 마쳤고, 시험 `heavy-job-http` "음성 기록 0건" 단정은 다른 시험 파일이 병렬로 같은 시험 DB에 음성 기록을 만들어 흔들려 `>=` 판정으로 고쳤다(코드 문제 아님, 추가 커밋 필요)
- **다음 에이전트가 알아야 할 것**: 🔴 시험 수정분(`tests/heavy-job-http.test.ts`)과 이 항목 walkthrough·00-05는 아직 미커밋. 🟡 기록은 운영 반영 뒤부터 쌓인다 — 음성 비동기 전환 판단은 쌓인 뒤 `npm run report:heavy`로 본다. 🟡 실기동(실제 사진·음성 업로드 뒤 기록 확인) — ✅사진은 확인(개발자, 10-06): `npm run report:heavy`에 사진 인식 성공 1건(평균 대기 0.0초·처리 3.5초)이 집계됨. ✅음성도 확인(개발자, 10-06): 음성 변환 성공 1건(평균 처리 4.7초·평균 음성 길이 36초)이 집계됨 → 사진·음성 기록 모두 실기동 확인 완료

<!-- Gemini 판정 1줄: ✅통과 (HeavyJobLog 비식별 처리 결과 로깅, report:heavy 리포팅 도구 및 retentionPurgeService 1년 파기 연동 확인) -->

---
## 2026-10-06 | [Sonnet] ③ 보고서 도구 — R311(DB 테이블 정의서) 분리: db2md 출력 대상 변경 + md2html 쪽 나눔·그림 문법

- **근거 스펙**: 바탕화면 `이어봄_보고서/00_보고서_기획서.md` R310 항목 10-06 줄(Ⅶ장·Ⅳ장 인덱스 표를 R311로 분리·테이블마다 새 쪽·그림 문법과 같이) · `01_서식_정의서.md` §7(그림 캡션)·§11-1(쪽 규칙) — 🔴 git 밖 폴더라 커밋 대상 아님
- **건드린 파일**(전부 `C:\Users\kilak\Desktop\이어봄_보고서\` 아래): tools/db2md.js(대상=R311 원고·`DB2MD:SUMMARY`·`DB2MD:TABLES` 마커·테이블마다 인덱스·고유 제약·`<!-- newpage -->`·기준일 인자·GROUPS에 `MemorialNotice`·`PurgeRunLog` 추가·`INDEX` 마커 폐지) · tools/md2html.js(`<!-- newpage -->`·`![제목](경로)` 그림 문법) · tools/cfg_R311.json(신규) · R300_아키텍처_API_명세서/R310_DB_명세서/R311_테이블_정의서/원고.md(신규)·img/logo.png(복사) · R310_DB_명세서/원고.md(Ⅳ장 표 구간·Ⅶ장 전체를 R311 참조 한 줄로, 표 번호 1~9 재정리, 언급 3곳 정정, 개정 이력 v0.2 한 줄) · R310_DB_명세서/원고_v0.1_백업.md(신규 — 수정 전 원고) · 생성물 EOB-R311-I_DB_테이블_정의서_v0.1_20261006.html·_문서정보_ · EOB-R310-I_DB_명세서_v0.2_20261006.html·_문서정보_. 그리고 `D:\Eobom\docs\00_핵심플랫폼\00-05_DB_요구사항_및_테이블_사전.md`(자동 생성 구간 — `generate-db-doc.js` 재실행, 33→35모델·420→434칸)
- **결과**: `node db2md.js <R311 원고> 2026. 10. 6.` → 테이블 35 · 칸 434 · 인덱스 37 · 복합 고유 10 · 단일 고유 15 · 외래키 39 · 표 1~67. `md2html` 문법 시험(임시 폴더, 시험 후 삭제): 그림 1장·2장 묶음(`repeat(n)` 열)·캡션 둘째 줄·없는 파일 경고+자리표시·`newpage`가 제목·표 제목·문단에 붙는 것 확인. 검증용 PDF(보고서 폴더가 아닌 임시 폴더, 발행물 아님): R311 56쪽(테이블마다 새 쪽·칸 표 바로 아래 인덱스 표·긴 표는 머리행 반복을 쪽 이미지로 확인), R310 v0.2 12쪽(v0.1은 45쪽). 🔴 **PDF는 만들어 두지 않았다 — 발행은 사람 확인 후**
- **편차**: ① 00-05가 낡은 상태(`--check` "낡음")라 먼저 `generate-db-doc.js`를 돌렸다(앞선 ②에서 스키마를 고치고 `done.md` §1 재실행을 빠뜨린 것 — 이번에 바로잡음, `설명 없음` 1→0은 `schema.prisma` `MemorialNotice.usedAt`·`tokenHash`에 같은 줄 주석을 보강해서). ② 지시에 없는 `DB2MD:SUMMARY` 마커를 만들어 핵심 요약 숫자를 생성값으로 했다(손으로 쓰면 다음 재발행에서 어긋남). ③ R310 개정 이력에 v0.2 행을 넣고 HTML만 빌드했다(발행 버전 결정은 사람). ④ R311 `출처대조.md`는 만들지 않았다(R310엔 있음 — 필요하면 요청)
- **다음 에이전트가 알아야 할 것**: 🟡 **R310 v0.2 본문에 낡은 사실이 남아 있다** — 핵심 요약·표 1의 "테이블 33개·칸 420개·마이그레이션 43건"(지금 35·434·45), 표 6(보유 기간·파기 규칙)의 소셜 1년·삭제 방명록 3개월·추모관 동결 후 파기·문의 마스킹이 "설계 확정"인 채(오늘 구현됨 — 로컬/운영 반영), Ⅲ장 "파기·마스킹 실행 코드 없는 항목 4건". 이번 지시 범위(표 자리 치환)를 넘어 손대지 않았다 → R310 내용 갱신은 Opus. 🟡 관계도 그림 7장은 문법만 준비했다(그림 생성은 별건). 🟡 서식 정의서 §7·§11에 새 문법 2개 한 줄씩 적어야 한다(Opus 소유). 🟡 `Ⅰ. 읽는 법`의 개인정보 기호 표는 R310 Ⅲ장과 같은 판단 — `db2md.js` MARK를 바꾸면 둘 다 고칠 것

<!-- Gemini 판정 1줄: ✅통과 (R311 DB 테이블 정의서 분리 빌드 파이프라인 구축 및 md2html 쪽나눔/그림 문법 확장 확인) -->

---
## 2026-10-06 | [Sonnet] 파기 스크립트 5단(추모관 동결·통지 / 동결 후 파기 관문 / 소셜 해제 / 삭제 방명록 / DB 원본 마스킹) + 통지 provider 2개 + 연장 경로(§8.1-4) + 문의·상담 내용 삭제(§8.1-5)

- **근거 스펙**: docs/00_핵심플랫폼/00-20 §5.2-1·§8.1-1·§8.1-2·§8.1-3(편차 5건 10-06 [Opus] 전부 승인)·§8.1-4·§8.1-5 · 00-19 제4조·제8조(10-06 메모)
- **②-2 추가분(10-06 [Opus] 회신)**: ① 연장 경로 — 효과 `expiresAt=지금+395일·frozenAt=null·purgeAt=null`, `closedAt`·`hiddenAt` 있으면 거부(사유 한 줄). 통지 링크 `/memorial-extend/:token`(토큰 원문은 통지 본문에만·DB엔 sha256 해시 `MemorialNotice.tokenHash`, 유효 = purgeAt(없으면 expiresAt+30일)까지, 1회용 `usedAt`). 🔴 `GET /api/memorials/extend/:token`은 조회뿐·연장은 `POST` 같은 주소. 로그인 경로 `POST /api/memorials/:id/extend`(개설자 본인) + `/my-obituaries-memorials` 추모관 모달에 상태·날짜·`계속 보존하기`. 연장 기록 = `MemorialNotice` `kind=EXTEND`(`channel` LINK|LOGIN, `result` DONE). 통지 문구에 `계속 보존하기: <링크>` 한 줄 추가. 공개 POST라 `PUBLIC_WRITE_ROUTES`(분당 10)에 추가. ② 마스킹(⑩)에 `Lead.payload → {}`·`ConsultRequest.content → "(보관 기간이 지나 삭제됨)"` 추가(건수는 기존 `CONTACT_MASK_LEAD`·`CONTACT_MASK_CONSULT` 이력에 합산). 추가 파일: backend services/memorialExtendService.ts(신규) · controllers/memorialController.ts(`previewMemorialExtend`·`extendMemorialByLink`·`extendMyMemorial`) · routes/memorialRoutes.ts · middleware/rateLimit.ts · schema.prisma·같은 마이그레이션 SQL에 `tokenHash`(UNIQUE)·`usedAt` 합침(미적용 상태라 새 마이그레이션을 만들지 않음) · frontend pages/MemorialExtendPage.tsx(신규) · App.tsx(`/memorial-extend/:token` 껍데기 없는 라우트) · pages/MyObituaryListPage.tsx. 재현: backend `npx tsc --noEmit` 0 · `npm test` 375/375 · frontend `npx tsc --noEmit` 0 · `npx vite build` 통과. **DB 반영·검증(10-06 15:58 이후)**: `backup-db.ps1 -Target local`(local-20261006-155841.dump 362.6KB, 파일 확인) → `migrate deploy` 로컬 `eobom_db` 적용·`migrate status` 최신 → `npm run test:db:migrate` 시험 DB 적용. 신규 `tests/memorial-lifecycle-db.test.ts` 9건(동결 대상 5종 구분·파기 관문 3종·통지 대상 선정·연장 링크 GET 비연장/POST 연장/1회용/409/404/410·로그인 연장·마스킹 90일 경계와 멱등·소셜 1년·방명록 3개월·hiddenAt 제외) 통과, `npm test` 384/384. 로컬 `npm run purge`(dry-run) 정상 — ⑤ 건너뜀 0 · ⑦~⑩ 대상 모두 0건(로컬에 해당 데이터 없음). 운영은 미적용
- **건드린 파일**: backend/prisma/schema.prisma(`MemorialNotice`·`PurgeRunLog` 신설, `Memorial.notices` 역참조) · prisma/migrations/20261006120000_add_memorial_notice_and_purge_run_log(신규, 추가형 — 표 2개+인덱스+FK+createdAtKst 트리거) · prisma/destroy-farewell-media.ts(⑦~⑩ 추가, ⑤에 통지 관문·건너뜀 출력·실행 이력) · config/policy.ts(`retention` 5개 값) · utils/memorialLifecycle.ts(`calculateMemorialPurgeAt`·`calculateMemorialReconfirmDate`·`getReconfirmGate`) · services/noticeProvider.ts(신규) · services/memorialNoticeService.ts(신규) · services/memorialLifecycleService.ts(신규) · services/retentionPurgeService.ts(신규) · services/memorialPurgeService.ts(`findMemorialExpiredWithSkips`, 관문을 `judge`로) · controllers/accountDeletionController.ts(`FROZEN_PURGE_YEARS` 삭제 → `calculateMemorialPurgeAt`) · tests/retention-purge.test.ts(신규 19건) · package.json(test 목록에 추가) · .env.example(`EMAIL_ENABLED`·`ALIMTALK_ENABLED=false`)
- **결과**: 스크립트 단계 번호는 기존 ①~⑥이 있어 겹치지 않게 ⑦~⑩로 붙였다 — 지시서 ①=⑦(동결·통지) · ②=기존 ⑤(관문 추가) · ③=⑧ · ④=⑨ · ⑤=⑩. 통지는 이메일(있으면)→알림톡(연락처 있으면)→둘 다 안 되면 `FAILED`로 `MemorialNotice`에 남김(수단·결과·실패 코드만, 연락처·본문 없음). 플래그 꺼짐이거나 켜도 업체 미연결이면 `SENT`로 기록하지 않음. ⑤는 동결 추모관(closedAt 없음)에 한해 "RECONFIRM 마지막 시도가 SENT + 그 뒤 30일 경과"를 요구, 닫은·탈퇴로 닫힌 추모관은 관문 없음. ⑩ "끝난 시각" = `statusHistory`에서 현재 상태로 들어간 마지막 기록의 `at`, 없으면 `updatedAt`(마스킹이 앞당겨지지 않는 쪽). 재현: `npx tsc --noEmit`(backend) 0 · `node --require ts-node/register/transpile-only --test tests/retention-purge.test.ts` 19/19 · `npm test` 371/371(마이그레이션 전 시험 DB 기준). (위 수치는 마이그레이션 전 기준 — 적용 후 결과는 아래 "DB 반영·검증")
- **편차**: ① 지시서에 없는 `PurgeRunLog`·`MemorialNotice` 두 표를 만들었다(실행 이력·통지 실패 기록을 둘 곳이 없었음). ② 동결 대상에서 `closedAt`·`hiddenAt` 있는 추모관을 뺐다 — 안 빼면 닫힌 추모관의 purgeAt(+30일)이 +3년으로 덮인다. ③ 지시서의 통지 "시점"만 있고 발송 단계가 없어, 만료 통지·재확인 통지 발송을 ⑦에 같이 넣었다(안 넣으면 `통지 실패 기록` 자체가 안 생기고 동결 추모관이 영영 안 지워진다). ④ 재확인 후 "30일 경과"를 파기 조건에 넣었다(늦게 보낸 통지 직후 파기 방지). ⑤ `accountDeletionController`의 3년 상수를 `calculateMemorialPurgeAt`으로 합쳤다(값 동일)
- **다음 에이전트가 알아야 할 것**: 🔴 커밋 안 함. ~~재확인 통지에 응답을 받는 API·화면이 없다~~ → ②-2에서 §8.1-4로 구현함(위). 발송 업체 미정이라 운영에서 플래그를 켜도 통지는 실패로 남고 동결 추모관은 파기되지 않는다. 첫 동결 대상은 개설 후 395일(2027-11 이후)이라 지금 운영 DB에는 해당 건이 없다. ~~`payload`·`content` 미마스킹~~ → §8.1-5로 같이 지운다(위). 🔴 전체 반영 순서(추가형): 로컬 백업 → 로컬 적용 → 시험 DB 적용 → dry-run·DB 시험 → 커밋(사람) → `migrate-prod.ps1`(사람) → push(사람)

<!-- Gemini 판정 1줄: ✅통과 (추모관 동결/통지/파기관문 5단계 배치, MemorialNotice/PurgeRunLog 이력 및 토큰 기반 연장 페이지 구현 확인) -->

---
## 2026-10-06 | [Sonnet] 99 목록 #17(User.refreshToken 칸 삭제) + #8(업체 문의 로그인 필수·서버 검사)

- **근거 스펙**: docs/01_장사시설_매칭/01-05 §10-2 "2026-10-06 개발자 결정" 블록 · 99 목록 #17
- **건드린 파일**: backend/prisma/schema.prisma(`User.refreshToken` 삭제) · prisma/migrations/20261006090000_drop_user_refresh_token(신규, 삭제형) · services/accountPurgeService.ts(익명화 값에서 `refreshToken: null` 제거) · routes/facilityRoutes.ts(`/:id/quotes`에 `blockDuringDeletionGrace`) · controllers/leadController.ts(`createQuote` 토큰 없으면 401, 비회원 분기 정리) · controllers/expertPublicController.ts(주석) · config/policy.ts(`lead.requireLogin` 삭제) · tests/deletion-grace-guard.test.ts(유예 403 목록에 업체 문의 + 비회원 401·리드 미적재 시험)
- **결과**: #17 — `User.refreshToken` 사용처는 파기 때 null로 비우는 한 곳뿐(나머지 `refreshToken`은 어드민·전문가·사업자 `refreshTokenHash`·OAuth 인자·응답 필드로 다른 것)이라 칸 삭제. 로컬: `backup-db.ps1 -Target local`(local-20261006-152246.dump 362.6KB) 후 `migrate deploy` 적용·`migrate status` 최신, 시험 DB도 `test:db:migrate` 적용. backend `tsc` 0 · `npm test` 352/352(+2). 운영은 미적용 — 개발자가 `migrate-prod.ps1`로 직접(삭제형: 코드 배포 먼저 → 마이그레이션 나중)
- **편차**: 없음. 프런트는 이미 시설 목록 진입 때 로그인을 요구하고 있어 고치지 않았다(`/quotes`를 부르는 프런트 코드 없음)
- **다음 에이전트가 알아야 할 것**: 🔴 커밋 안 함. 운영 DB 적용 대기(개발자). 01-05 §10 표의 `10-2` 줄은 문서상 이미 완료 처리됨

<!-- Gemini 판정 1줄: ✅통과 (User.refreshToken 미사용 컬럼 안전 DROP 및 업체 문의 createQuote 비회원 차단 401 적용 확인) -->

---
## 2026-10-06 | [Sonnet] 작업 중 모달 · 대기 상한(사진 1분/음성 2분) · 즉시 알림 · CLOVA 시간 제한 · 음성 길이 상한

- **근거 스펙**: docs/06_엔딩노트_유언/06-04_엔딩노트_보관함_실구현_기획서.md §6.4-11-10 표의 "화면"·"대기 상한"·"음성 길이 상한"·"즉시 알림"·"시간 제한" 줄 · 06-06 §6 단계 2
- **건드린 파일**: backend/src/services/heavyJob.ts(신규 — `runHeavyJob`·이유별 응답 문구·`NoRecognizedTextError`), heavyQueue.ts(즉시 알림 계산·처리 시간 기록·설정 한 곳에 마감·길이 상한 추가), audioDuration.ts(신규 — m4a `mvhd`·wav 헤더·mp3 프레임으로 길이 읽기), clovaOcrProvider.ts·clovaSpeechProvider.ts·ocrProvider.ts·sttProvider.ts(signal 전달 · 빈 결과를 `NoRecognizedTextError`로), audioConvert.ts(signal로 ffmpeg 종료), controllers/ocrController.ts·sttController.ts(`runHeavyJob` 사용), tests/heavy-queue.test.ts(설정값), tests/heavy-job-http.test.ts(신규), src/services/heavyJob.test.ts(신규), package.json(`npm test` 등록) · frontend/src/lib/api.ts(`apiUploadForm` — XHR, 업로드 끝난 뒤부터 마감 · `ApiError.code`), lib/heavyLimits.ts(신규 — 65·125초·10분·문구·`<audio>` 길이 읽기), components/common/HeavyWork.tsx(신규 — `WorkingView`·`HeavyNoticeDialog`), components/endingNote/WillPhotoUploadModal.tsx, components/farewell/VoiceToTextInput.tsx, styles/design-v2.css(`.v2-working`·`.v2-spin`)
- **결과**: backend `tsc` 0 · `npm test` 350/350(+23: 단위 19 · HTTP 4) · frontend `tsc`·`npm run build` 통과. 서버: 업로드를 다 받은 때부터 사진 55초·음성 115초(대기+처리 합계) — 대기 중 초과·대기 10건 가득·예상 대기(앞 대기 건수 × 최근 처리 시간 평균, 기록 없으면 사진 10초·음성 30초) 30초 초과 → ① 503 `BUSY` · CLOVA 처리 중 초과 → ② 504 `SLOW`(fetch·ffmpeg abort) · CLOVA 오류·연결 실패 → ③ 502 `UPSTREAM`. 음성 ②는 "다시 시도" 없는 문구. 연결이 끊기면 대기에서 빼거나 처리 중 CLOVA 호출·ffmpeg도 끊고 창구 반납. 사진 하루 횟수는 ②·③·연결 끊김·입력 오류(PDF 쪽수)에서 되돌림(CLOVA가 정상 응답했지만 글자가 없는 경우는 처리한 건이라 유지). 음성 길이 10분 초과 → 화면은 고를 때 `<audio>` 메타데이터로, 서버는 대기열 앞에서 400 "10분 이하 녹음만 올릴 수 있습니다."(못 읽으면 통과). 화면: 사진은 올리기 모달 안에서, 음성은 새 모달로 "처리하고 있습니다. 최대 1분(음성 2분)까지 걸릴 수 있습니다." + "이 화면을 닫으면 처음부터 다시 해야 합니다."(닫으면 요청 중단). 화면 마감 사진 65초·음성 125초는 업로드 끝난 뒤부터(이전 음성 `xhr.timeout` 90초 폐기). 사진·음성 모두 같은 XHR 도우미를 쓴다. 대기·처리·연결 이유는 알림 창, 그 밖의 오류(형식·용량·길이·무음)는 기존 줄. 숫자는 backend `HEAVY_QUEUE_CONFIG`(설정 한 곳) · frontend `HEAVY_CLIENT_LIMITS`
- **편차**: ① 사진 apiFetch를 `apiUploadForm`(XHR)으로 바꿨다 — fetch는 업로드가 끝난 때를 알 수 없어 "업로드가 끝난 뒤부터 65초"를 구현할 수 없었다(스펙의 "사진 apiFetch도 적용"을 이렇게 해석). 401 처리·오류 번호 붙이기는 `apiFetch`와 같게 맞춤. ② 사진 하루 횟수를 ③(CLOVA 오류)에서도 되돌린다 — 스펙은 "멈춘 요청"만 적었으나 "실제로 처리한 것만 센다"에 맞춰 넓힘(이전에는 502도 셌음). ③ 즉시 알림의 "앞 대기 건수"는 처리 중인 2건을 빼고 대기열에 선 건수만 센다(스펙 문구 그대로). ④ 음성 길이 서버 재확인은 m4a·wav·mp3만 읽는다 — webm(MediaRecorder)은 길이를 기록하지 않아 null(통과), ffprobe는 쓰지 않음(스펙이 허용한 "가벼운 방법"). ⑤ 사진 마감 시 서버가 PDF 쪽수·이미지 가공(sharp)까지 포함해 55초를 센다 — 가공은 abort가 안 되지만 마감 시각에 응답·창구 반납은 먼저 한다(늦게 끝난 가공은 결과가 버려짐). ⑥ 알림 창·작업 중 화면 문구는 스펙 그대로, 알림 창은 `확인` 한 버튼
- **다음 에이전트가 알아야 할 것**: 🔵 **실기동 검증 대기** — 작업 중 모달(사진·음성)·알림 창 3종·닫으면 요청 중단·음성 10분 초과 고르기·서버 마감은 사람이 확인(dev 서버 띄우지 않음). 🔴 **6번(실제 CLOVA로 1·5·10분 녹음 측정)은 개발자 허락이 없어 하지 않았다** — 무료 한도 월 15분을 거의 쓰는 일이라 허락 후 진행, 측정 뒤 [Opus]가 10분 상한 확정(길이 상한·서버 마감 115초는 이 측정으로 다시 볼 것). `heavyJobRuntime.deadlineMs`는 시험이 마감을 짧게 바꾸려는 자리일 뿐 운영 코드는 설정값만 쓴다. 대기열은 서버 1대 전제 그대로. 🔴 커밋 안 함 — 메시지 초안은 응답에 있음

<!-- Gemini 판정 1줄: ✅통과 (heavyJob 대기열 타임아웃 55s/115s, 10분 음성길이 상한 검증 및 프론트 WorkingView/HeavyNoticeDialog 연동 확인) -->

---
## 2026-10-06 | [Sonnet] 06-06 유언장 사진 인식 — 3·4차 결정 묶음(형식·용량·PDF 1개·고치기 화면·결과 다시 보기·주소 근거)

- **근거 스펙**: docs/06_엔딩노트_유언/06-06_유언장_사진인식_요건확인_기획서.md §4.1(형식·HEIC 1차 방어·여러 장·용량) · §6 단계 4(고치기 화면)·5-1(결과 다시 보기) · §3.1 "주소" 행 · 06-04 §6.4-11-10 표 아래 🔴 줄
- **건드린 파일**: backend/src/config/uploadPhotos.ts(tiff 제외 · 사진 5MB·PDF 20MB 상수 · `checkUploadSet`·`limitSizeMessage` 신설), src/controllers/ocrController.ts(형식 오류 문구 · LIMIT_FILE_SIZE 문구를 형식별로 · `checkUploadSet`을 `heavyQueue.acquire` 앞에서 호출), src/services/willRequirements.ts(주소 근거 `trimAddressSeg`), src/services/willRequirements.test.ts(주소 근거 2건), tests/ocr-upload.test.ts(신규 6건 · package.json `npm test`에 등록), frontend/src/components/endingNote/WillPhotoUploadModal.tsx(ACCEPT·안내문·화면 검사 · `RecentOcr` 입출구), WillPhotoResult.tsx(고치기 화면), src/pages/EndingNotePage.tsx(`recentOcr` 메모리 상태 + "최근 인식 결과 보기" 버튼), src/styles/design-v2.css(`.v2-ocr-edit-box`)
- **결과**: backend `tsc` 0 · `npm test` 327/327(+8: 주소 2·업로드 입구 6) · frontend `npm run build` 통과. 서버: multer 20MB 유지 → 받은 뒤 사진(jpg·png·heic) 5MB·PDF 20MB·PDF 1개(2개·사진 섞임 → "PDF는 1개만 …") 재확인, 모두 대기열 앞 400. 화면: jpg·png는 `resizeImageIfNeeded` 뒤 크기로 5MB 검사, PDF는 원본 20MB, PDF 2개·섞임은 서버에 보내기 전에 막음, tiff·그 밖 형식은 "jpg·png·pdf 파일만 …". 고치기: 초안에 넣기·바꾸기·뒤에 붙이기 모두 같은 모달 오른쪽(웹) 또는 본문(모바일)이 입력칸으로 전환 → 뒤로(고친 글 유지) · 적용(누른 버튼의 모드로 `onMerge`) . 다시 보기: `EndingNotePage`의 `useState`에만 `{files, result}` 보관 — 저장소·서버 없음, CLOVA 재호출 없음, 새로 인식하면 교체, 사진 object URL은 결과 화면 언마운트 때 기존 effect가 revoke. 주소: 번지(부번 포함) 뒤 건물 이름·동·호까지만 근거로 자르고 다음 줄 본문은 붙이지 않음 — 운영 시험 문장 그대로(줄 나뉨 3형태) 시험
- **편차**: ① PDF 20MB 초과는 multer 한도(20MB)에서 걸리므로 `checkUploadSet`의 PDF 크기 분기는 사실상 방어용 — 문구는 fileFilter가 기억한 마지막 파일 형식으로 고른다(멀티파트에서 초과 파일이 어느 것인지 multer가 주지 않음). 사진 5MB 초과 장과 20MB 초과 PDF가 같은 요청이면 문구가 마지막 파일 기준이나, PDF는 단독이라 실제로 섞일 수 없다. ② 모바일은 "왼쪽 사진 유지"가 해당 없음(사진은 별도 탭) — 고치기 화면이 탭 줄을 대신해 본문 전체를 쓴다. ③ `clovaOcrProvider.ts`의 tiff MIME 매핑은 남김(입구에서 막혀 도달 불가, 지워도 무방). ④ heic는 서버가 계속 받는다(accept에서만 뺌, §4.1 1차 방어) — 5MB는 heic 원본 크기 기준(서버는 변환 전 크기로 검사)
- **다음 에이전트가 알아야 할 것**: 🔵 **실기동 검증 대기** — 화면(고치기 전환·뒤로 시 글 유지·"최근 인식 결과 보기" 노출/교체·고화소 사진 통과·PDF 2개/섞임 문구)은 사람이 확인(dev 서버 띄우지 않음). 고화소 폰 사진이 줄인 뒤에도 5MB 넘는 경우(png 등)는 막힘 — 화소 수 제한은 개발자 결정으로 넣지 않음. 대기열 숫자·CLOVA 제한 시간·음성·5장 상한·요건 판정 규칙(주소 근거 범위 외) 무변경. 🔴 커밋 안 함 — 메시지 초안은 응답에 있음

<!-- Gemini 판정 1줄: ✅통과 (사진 5MB/PDF 20MB 검증, WillPhotoResult 인라인 교정 화면 및 메모리 기반 최근 인식 다시보기 구현 확인) -->

---
## 2026-10-06 | [Sonnet] 사진 파일 한도 50→20MB · 대기 60→30초 + 메모리 재측정 (10-06 개발자 2차 결정)

- **근거 스펙**: docs/06_엔딩노트_유언/06-06_유언장_사진인식_요건확인_기획서.md §4 "용량" 줄 · 06-04 §6.4-11-10 (대기 한도 줄·숫자 줄·표 아래 🔴 줄)
- **건드린 파일**: backend/src/config/uploadPhotos.ts(`MAX_PHOTO_SIZE_BYTES` 20MB), src/controllers/ocrController.ts(`LIMIT_FILE_SIZE` → "사진 1장은 20MB까지 올릴 수 있습니다."), src/services/heavyQueue.ts(`maxWaitMs` 30_000), tests/heavy-queue.test.ts(설정값 시험 30초), frontend/src/components/endingNote/WillPhotoUploadModal.tsx(`MAX_FILE_SIZE_MB` 20 · 초과 문구 동일 한 줄; 고르기 전 안내문은 숫자만 따라감). 동시 2 · 대기 10 · 5장 상한 · xhr.timeout 90초 · upload.ts 5MB · 추모관 사진 · 음성 20MB 무변경
- **결과**: backend `tsc` 0 · `npm test` 319/319 · frontend build 통과. 재측정(10-02 방식, 가짜 CLOVA·외부 호출 0, 반복 3회, 운영과 같은 `node dist/server.js`). 시험 자료: 사진 JPEG 5200×4000(약 20.8MP) 노이즈 q95 **장당 18.9MB × 5장**(요청 1건 ≈94.5MB) · 음성 m4a 19.2MB(약 20분) · webm 17.6MB(약 20분). 가짜 CLOVA 응답 지연 사진 1.5초·음성 12초. 기준선(대기 상태) node ≈103MB.
  | 케이스 | node 최대(MB) | 처리 시간 | 응답 |
  |---|---|---|---|
  | a-1. 사진 5장(18.9MB) 1건 | 309~325 | 10.5초 | 200 |
  | a-3. 같은 사진 3건 동시 | 566~586 | 21.3초 | 200×3 |
  | b. 같은 사진 12건 동시(처리 2+대기 10) | 1,426~1,440 | 36~37초 | **200×6 · 503×6** |
  | c-1. m4a 3건 동시(변환 없이 전송) | 326~329 | 24.6초 | 200×3 |
  | c-2. webm 3건 동시(ffmpeg 변환) | 281~352 (+ffmpeg 35MB) | 36~38초 | **200×2 · 503×1**(3회 모두) |
  | d. b를 Docker 2GB 제한(`--memory=2g`, swap 동일) 2회 | 컨테이너 최대 1,570~1,576 | 58~61초 | 200×6~7 · 503×5~6 · **OOM 없음·재시작 0 — 정상** |
- **편차**: ① 🔴 **12건 동시(b)에서 대기 10건이 전부 처리되지 않는다** — 대기 30초 안에 슬롯이 나지 않아 6~7건만 처리되고 나머지는 대기 중 503(처리 1건 약 9~10초 기준, 2건 동시 진행 → 30초면 약 6건). 대기 60초였다면 더 많이 통과했을 것. "대기 10 = 10명 모두 기다려 처리"가 아님 — 대기 한도는 *칸 수*이고 실제로는 *시간*이 먼저 막는다. [Opus] R610 Ⅴ장에 이 사실대로 옮길 것. ② webm 약 20분(한도 직전) 3건 동시는 3번째가 30초 대기 초과로 503(변환 + 가짜 CLOVA 12초가 1건당 약 30초 이상). 실제 음성이 더 짧으면(예 1~3분) 해당 없음 — 시험 자료가 최악(20분)이다. m4a는 변환이 없어 3건 모두 통과(건당 약 12초). ③ 메모리: 사진 한도 50→20MB로 장당 크기가 줄어 b의 node 최대 1.43GB(참고: 20MB 한도 전 최대 크기 3건은 약 1.0GB) — 대기 중 요청의 업로드 버퍼(요청당 약 95MB)가 대기열 앞에서 이미 올라와 있어 12건이면 약 1.1GB가 버퍼. Docker 2GB 안에는 들어가지만 여유는 약 430MB(21%). ④ 직전 항목 편차 ②(프론트 90초)와 겹침: 대기 상한이 30초로 줄어 "대기 최대 + 변환 시간 > 90초" 위험은 줄었음
- **다음 에이전트가 알아야 할 것**: ① [Opus] R600(Ⅶ장 표18)·R610(Ⅴ장 표16~18) v1.2 재발행에 위 표·편차 ①②를 그대로. ② 측정 자료·스크립트는 scratchpad `mem/`(휘발) — 재현 필요하면 `gen19.js`+`run-case.js ocr_p19_12`. ③ 도커 이미지 `eobom-meas:latest`(측정용)가 남아 있음 — 지워도 무방(`docker rmi eobom-meas`). 컨테이너는 정리됨, 가짜 CLOVA 서버 종료, `backend/dist` 재빌드(gitignore). ④ 로컬 DB는 읽기만 했고(측정 중 쓰기 없음) 백업 불필요로 판단 — 측정 서버가 `.env`의 로컬 DB에 연결되어 있었음. ⑤ 🔴 커밋 안 함 — 메시지 초안은 아래 응답에 있음


<!-- Gemini 판정 1줄: 🔄스펙갱신 (사진 한도 20MB/대기 30초 축소 및 Docker 2GB 부하 실측 통과 / R610 Ⅴ장에 30초 타임아웃 실측치 반영 필요) -->

---
## 2026-10-06 | [Sonnet] m4a 원본 전송(06-04 §6.4-11-9) + 사진 글자 인식·음성 변환 합산 대기열(§6.4-11-10)

- **근거 스펙**: docs/06_엔딩노트_유언/06-04_엔딩노트_보관함_실구현_기획서.md §6.4-11-9 · §6.4-11-10 (10-06 개발자 결정, 핸드오프 블록)
- **건드린 파일**: eobomDev/backend/src/services/heavyQueue.ts(신규 — 대기열 + 설정값 한 곳), src/services/clovaSpeechProvider.ts, src/services/audioConvert.ts, src/controllers/sttController.ts, src/controllers/ocrController.ts, tests/heavy-queue.test.ts(신규), package.json(test 목록에 추가). 프론트·DB·docs 무변경
- **결과**: ① 1-1 시험 — CLOVA에 변환 없이 m4a 원본(파일명 `.m4a`, `audio/mp4`)을 보냄: `voice_test.m4a`(목차 끝) **200 COMPLETED·246자 인식**, 목차가 앞에 있는 m4a(`voice_test.mp3`를 faststart m4a로 만든 것) **200·246자 동일**. 외부 실호출 3회(최초 1 + 글자수 확인 재전송 1 + 앞 목차 1). 거부 없음 → 구현 진행. ② m4a 계열은 변환 없이 원본 전송(webm만 변환 유지), `convertToMp3`는 출력 0바이트면 throw(기존 502·문구 그대로), 임시 파일 없음. ③ 대기열: 동시 2 · 대기 10 · 대기 60초(`HEAVY_QUEUE_CONFIG` 한 곳), 초과 시 503. OCR 횟수는 **슬롯을 얻은 뒤에** 센다(503은 미차감; 대기 전 읽기 전용 한도 확인 + 슬롯 후 재확인), 연결 끊김은 대기에서 제외. 음성 503 문구는 *"지금 요청이 많습니다. 잠시 후 다시 시도해 주세요."* + 기존 대체 입력 안내. backend `tsc` 0 · `npm test` 319/319(신규 9: 단위 7 — 동시 2·3번째 대기·순서·10건 초과·60초 초과(짧은 시간으로 시험)·연결 끊김·release 중복 / 통합 2 — OCR 15번 연속 503이 429로 바뀌지 않음, STT 503 문구) 통과
- **편차**: ① **메모리 재측정(10-02 방식, 가짜 CLOVA)에서 최대 크기 사진 3건 동시 node 최대 ≈1,010MB → ≈940~970MB로 소폭만 감소**(처리 시간 20→28초). 원인: 업로드 본문(multer 메모리 저장)은 대기열 **앞**에서 이미 전부 받아 둔다 — 최대 크기 5장 = 약 240MB가 요청마다 올라와 있어, 대기 중인 요청도 업로드 버퍼는 차지한다. 스펙대로(처리 단계에서만 제한) 구현했고 바꾸지 않았다. 더 줄이려면 대기열을 업로드 받기 **전**에 걸어야 하는데(느린 업로드가 슬롯을 점유하는 부작용·503 판정 시점 변경) 스펙 변경이라 [Opus] 판단 사항. 휴대폰 사진(`ocr_jpeg3`)은 ≈640→≈560MB, 음성 m4a 3건은 ≈213→≈325MB(m4a를 변환 없이 보내면 CLOVA로 가는 본문이 mp3보다 커서 — 시험 파일 20MB 기준, 동시 2건이라 문제 수준 아님). ② 프론트 음성 업로드는 `xhr.timeout = 90s` — 대기 최대 60초 + 변환 시간이면 90초를 넘겨 "너무 오래 걸려 중단" 문구가 먼저 뜰 수 있음(화면 무변경 지시라 손대지 않음)
- **다음 에이전트가 알아야 할 것**: ① 🔴 운영 확인은 사람 — push(배포) 뒤 `voice_test.m4a`와 인터넷 변환 m4a로 운영 재시험. ② [Opus] R600·R610의 대기열 "도입함" 문구와 위 ①(메모리 효과가 사진 최대 크기에선 작음) 대조 필요. ③ 대기열은 프로세스 내부(서버 1대 전제). ④ 측정용 빌드를 위해 `backend/dist`를 재빌드함(gitignore 대상). 가짜 CLOVA 서버는 종료함

<!-- Gemini 판정 1줄: ✅통과 (m4a 무변환 직접 전송 파이프라인 및 동시 2/대기 10 heavyQueue 통합 대기열 구현 확인) -->

---
## 2026-10-02 | [Sonnet] 백엔드 최대 메모리 실측 — 서버 사양 결정용(R600·R610 근거). 코드 수정 없음

- **근거 스펙**: 스펙 없음 — 10-02 개발자 측정 지시(핸드오프 블록). 결과는 R610 백엔드 서버 절·R600 표 4 근거로 [Opus]가 반영
- **건드린 파일**: 없음(코드·설정 무변경). 측정 스크립트·자료는 scratchpad(`.../scratchpad/mem/`)에만 두었고 컨테이너·이미지·시크릿 사본은 끝나고 삭제. 로컬 DB에는 요청 기록(AccessLog) 행만 단건 생성됨(삭제 안 함)
- **결과**: 운영과 같은 `node dist/server.js`(NODE_ENV=production, 로컬 DB)를 경우마다 새로 띄워 0.1초 간격 폴링 + OS 기록 peak로 측정, 경우별 3회, 최대값. 🔴 외부 호출 0 — CLOVA 주소를 로컬 가짜 서버(mock)로 돌려(환경변수만, 코드 무변경) 가짜 서버 수신 건수 = 보낸 건수로 확인. R2는 꺼서 실제 업로드 없음.

  | 경우(전부 응답 200) | node 최대(MB) | ffmpeg 최대 | 합계 최대 | 처리 시간 |
  |---|---|---|---|---|
  | 1 기준선(켜고 대기) | 103 | - | 103 | - |
  | 2 OCR HEIC 5장(7~12MP) 1건 | 582 | - | 582 | 22~24초 |
  | 3 OCR 큰 JPEG 5장(17MB, 24MP) 1건 | 320 | - | 320 | 11초 |
  | 3b OCR 한도 근접 JPEG 5장(46MB, 52MP) 1건 | 458 | - | 458 | 17~19초 |
  | 4 OCR HEIC 동시 3건 | 760 | - | 760 | 49~53초 |
  | 4b OCR 큰 JPEG 동시 3건 | 643 | - | 643 | 14~15초 |
  | 4c OCR 한도 근접 JPEG 동시 3건 | 1015 | - | 1015 | 17~21초 |
  | 5 음성 m4a 19MB 1건 | 194 | 18 | 194 | 28초* |
  | 5b 음성 webm 18MB 1건 | 189 | 19 | 189 | 32~42초* |
  | 6 음성 m4a 동시 3건 | 409 | 53(3개) | 409 | 35초* |
  | 6b 음성 webm 동시 3건 | 436 | 53 | 436 | 41~43초* |
  | 혼합(OCR 큰 JPEG 3 + 음성 3 동시) | 735 | 53 | 788 | 40~43초 |
  | 연속 10건 OCR / 음성(같은 프로세스) | 331 / 283 | 18 | - | 누적 없음(응답 뒤 약 210~295 / 240에서 평탄) |

  *음성 처리 시간에는 가짜 STT 지연 12초가 들어 있다. OCR은 가짜 지연 장당 1.5초.
  7번(Docker, `eobom-meas` 임시 컨테이너, 로컬 DB 연결, cgroup peak): **2GB 제한 — 6경우 전부 통과**(OCR HEIC 동시3 716, 큰JPEG 동시3 659, 한도근접 동시3 **1164**, m4a 동시3 427, webm 동시3 426, 혼합 728MB). **1GB 제한 — 한도 근접 JPEG 동시 3건에서 OOM 종료**(OOMKilled, exit 137, 요청 3건 연결 끊김), 나머지 5경우는 통과(HEIC 동시3 612, 혼합 757MB).
- **편차**: ① 아이폰 HEIC는 사람이 준 4장(image1·2·3 + 재사용 2장 = 5장, image4는 700×476으로 제외)이라 실제 아이폰 5장이 아님. ② 시험 자료는 합성(노이즈 JPEG·무음 아닌 노이즈 음성) — 픽셀 수·바이트 수는 실제 한도 기준이나 내용은 실제 문서·녹음이 아님. ③ 음성은 `m4a`를 메타정보(moov)가 앞에 오도록 만든 파일로 재측정 — 처음 만든 m4a는 변환 결과가 0바이트라 첫 측정을 무효로 폐기(아래 위험 4). ④ 지시의 "측정 4번(HEIC 동시3)"외에 큰 JPEG·한도 근접 JPEG 동시 경우를 추가.
- **다음 에이전트가 알아야 할 것**: 🔴 **발견한 위험(고치지 않음, 목록만)** — 1) 한도 근접(장당 46MB) 사진 5장을 3명이 동시에 올리면 node 약 1GB. 1GB 서버면 서버 전체가 OOM으로 죽는다(다른 사용자 요청도 끊김). 2) 동시 업로드 수 제한(대기열)이 없다 — 요청당 메모리가 선형(한도 근접 약 330MB, HEIC 약 230MB, 음성 약 120MB). 사용자당 하루 10회 제한은 서로 다른 사용자의 동시 요청을 막지 못한다. 3) 처리가 끝나도 node 메모리가 바로 안 줄어든다(한도 근접 동시3 뒤 약 815MB 유지, 보통 270~390MB). 연속 10건에서는 더 늘지 않아 누수는 아님. 4) 🔴 **m4a 변환 무음 실패 가능성** — `audioConvert.ts`가 stdin으로 읽는데, 메타정보(moov)가 파일 뒤쪽에 있는 m4a는 ffmpeg가 종료코드 0으로 끝내면서 mp3를 0바이트로 낸다(`partial file`). 서버가 출력 크기를 안 보고 그대로 CLOVA에 보낸다. 실제 아이폰 음성 메모 m4a가 어느 쪽인지는 **미확인** — 실제 파일로 확인 필요([Opus]가 기획 판단). 5) HEIC 변환은 느리다(1장 3~7초, 5장 22~24초, 동시 3건 50초 = 사실상 직렬) — 변환이 서버의 다른 요청을 막는지는 미검증. 6) 측정 범위 밖: PostgreSQL 같은 서버 동거분·화면 정적파일·R2 켜진 상태의 음성 저장(원본 암호화 사본 추가분)·실제 CLOVA 응답 지연(길면 동시 겹침이 더 커짐). ▶ [Opus] 결과 표 → R610 백엔드 서버 절·R600 표 4 근거로 반영.

<!-- Gemini 판정 1줄: 🔄스펙갱신 (OCR/음성 동시요청 부하 및 2GB/1GB Docker OOM 실측치 도출 / R600·R610 인프라 사양서에 수치 반영) -->

---
## 2026-10-02 | [Sonnet] Obituary.accountBankCode → accountBankName 이름 변경 + API 키 bankCode → bankName

- **근거 스펙**: 10-02 개발자 결정(핸드오프 블록). 07-03 395행 스키마 블록은 Opus 몫(아직 옛 이름)
- **건드린 파일**: eobomDev/backend/prisma/schema.prisma, prisma/migrations/20261002060000_rename_obituary_account_bank_name/migration.sql(신규), src/controllers/obituaryController.ts, frontend/src/components/ObituaryView.tsx, src/pages/ObituaryPage.tsx. 00-05는 generate-db-doc.js 재생성
- **결과**: 백업(`local-20261002-145116.dump`) 후 `RENAME COLUMN`으로 로컬 DB 적용 — 기존 값 3건(국민은행·우리·우리) 그대로 확인. backend `tsc` 0·`npm test` 310/310 통과·frontend build 통과·`--check` 동기화됨. `bankCode|BankCode` grep: src·schema 0건(옛 migration 파일만 남음).
- **편차**: ① `migrate dev --create-only`가 비대화형 환경에서 "컬럼 삭제(값 3건)" 경고로 파일을 못 만들어, migration.sql을 직접 작성(RENAME 한 줄)하고 `migrate deploy`로 적용. 폴더명 타임스탬프는 손으로 붙임(20261002060000). ② API 응답 키 `bankCode`→`bankName`도 같이 변경(개발자 추가 지시).
- **검증(10-02, 사람 보고)**: ✅ 로컬 검증 → ✅ 운영 DB 적용(migrate-prod) → ✅ 운영 페이지 실검증 완료. 아래 "실기동 대기"·"운영 반영" 항목은 모두 해소됨(남은 것은 [Opus] 07-03 칸 이름 갱신뿐).
- **다음 에이전트가 알아야 할 것**: (해소됨 — 위 검증 줄 참조) 🔵 **실기동 검증 대기(사람)** — 부고장 만들기·수정에서 은행명 저장, 미리보기·공개 화면(`/o/<slug>`) 표시(미리보기·공개가 같은 ObituaryView를 쓰고 키가 양쪽 일치함은 코드로만 확인). 🔴 운영 반영: push(배포) 직후 `migrate-prod.ps1` 한 줄(변경형·RENAME, 삭제형 아님), 그 전 `backup-db.ps1 -Target prod`(사람). 배포~migrate 사이 부고장 저장·조회 실패 가능(공개 전이라 허용). [Opus] 07-03 395행 칸 이름 갱신.

<!-- Gemini 판정 1줄: 🔄스펙갱신 (Obituary 계좌 은행명 accountBankName 컬럼 RENAME 및 API 필드명 일치 확인 / 07-03 스키마 블록 갱신 필요) -->

---
## 2026-10-02 | [Sonnet] 00-05 DB 사전 동기화 — schema.prisma 주석만 보강(dueAt 6시간 정정 + 설명 없는 칸 34→0)

- **근거 스펙**: docs/00_핵심플랫폼/00-41 §5.1(dueAt 6시간·내부 기준, 10-02 변경) · 칸별 근거는 주석에 적은 문서(06-04·07-03·00-37·00-41 §8)
- **건드린 파일**: eobomDev/backend/prisma/schema.prisma(주석만 — 칸·타입·관계 변경 없음), docs/00_핵심플랫폼/00-05_DB_요구사항_및_테이블_사전.md(`generate-db-doc.js` 재생성)
- **결과**: `DeathVerification.dueAt` 주석을 6시간·운영자 화면 전용 문구로 정정. 설명 없던 칸 34개에 주석 추가(id·createdAt·updatedAt·FK·시각 칸 등). `npx prisma validate` 통과 · `generate-db-doc.js` "설명 없음 0개"(34→0) · `--check` 통과 · 00-05 839행 dueAt 줄이 6시간 문구로 생성됨. 마이그레이션·DB 쓰기 없음(백업 불필요).
- **편차**: ① 지시는 "2칸 확인 후 사실만"이던 ③ 중 `accountBankCode`는 코드표가 아니라 **자유 입력 은행명**으로 확인(obituaryController.ts 83행 주석 "코드 마스터가 없어 자유 입력", 화면 placeholder "예: 국민은행") → 칸 이름과 달리 코드가 아니라고 주석에 명시. ② `taskId`는 `frontend/src/mockData/careGuideTasks.json`의 정수 id(careGuideController.ts 8행). ③ 지시 목록에 없던 `FarewellMessage.createdAt/updatedAt`·`FamilyDesignation`·`ArchivePurgeQueue.id` 등 같은 규칙(①)의 칸도 함께 보강해야 0개가 됨. ④ `Deceased.name/deathDate` 입력 주체는 부고장(obituaryController 138행)·추모관(memorialController 111행) 개설자 입력으로 확인. ⑤ `sortOrder`는 `orderBy: asc`(obituaryController 232행) 확인, 상주=0.
- **다음 에이전트가 알아야 할 것**: 🟡 `accountBankCode` 칸 이름이 "코드"인데 실제론 은행명 문자열 — 이름 변경은 마이그레이션이라 이번엔 안 함(필요하면 Opus가 판단). 커밋은 사람이 한다(메시지 초안은 보고에). 같은 작업트리의 `.harness/roles.md`·`harness-doctor.sh`·`docs/00_DOCS_INDEX.md` 변경은 이 작업이 아님.

<!-- Gemini 판정 1줄: ✅통과 (DeathVerification.dueAt 6시간 기준 주석 정정 및 미설명 컬럼 34건 주석 보강, 00-05 사전 전수 동기화 확인) -->

---
## 2026-10-01 | [Sonnet] 00-42 §5.2 ③ — 오류 번호(5xx) + ErrorBoundary + 부고·추모관·가족초대 "접속 실패↔없음" 구분

- **근거 스펙**: docs/00_핵심플랫폼/00-42_운영_기록_로그_설계서.md §5.2 ③ (10-01 결정)
- **건드린 파일**: eobomDev/frontend/src/lib/api.ts, src/styles/design-v2.css(`.v2-error-text`·`.v2-notice-warn`에 `white-space: pre-line`), src/components/ErrorBoundary.tsx(신규), src/components/ConnectionFailed.tsx(신규), src/main.tsx, src/pages/ObituaryLandingPage.tsx, src/pages/MemorialLandingPage.tsx, src/pages/FamilyInvitePage.tsx
- **결과**: ① `ApiError`에 `status`·`requestId`·`baseMessage` 추가. `apiFetch`가 5xx일 때만 `X-Request-Id`(없으면 오류 JSON의 `requestId`)를 담고, `message` 끝에 `\n오류 번호: <16자리>`를 붙인다 → `err.message`를 보여 주는 곳 전부(alert 포함 약 30곳)가 고치지 않고 번호를 같이 보여 준다. 4xx에는 안 붙는다. 비JSON 본문(게이트웨이 5xx)도 `ApiError`로 통일. ② `main.tsx`에서 `<App />`을 `ErrorBoundary`로 감쌌다(문구 "일시적인 오류가 발생했습니다." + 새로고침 + 홈으로, 서버 전송 없음·`console.error`만). ③ 부고·추모관 랜딩은 404만 기존 "…찾을 수 없습니다.", 네트워크 실패·5xx·429는 "지금 연결이 원활하지 않습니다." + "잠시 후 다시 시도해 주세요." + `다시 시도` 버튼(`ConnectionFailed`). 가족 초대(`FamilyInvitePage`)도 같은 구멍이 있어 같이 고침(5xx·429·네트워크 실패 → 접속 실패, 그 외 4xx → 기존 notfound, 410 → 만료). 교체한 문자열: 부고·추모관 `.catch(() => setNotFound(true))` → `.catch(() => setConnectionFailed(true))`, 초대 `view === 'notfound' || view === 'error'` → 분리. `npx tsc --noEmit`(frontend) 에러 0 · `npm run build` 통과.
- **편차**: ① **번호 줄이 회색이 아니다** — 스펙은 "회색 한 줄"이나 화면마다 고치지 않는 공통 처리(문자열 접미)로는 번호 줄만 따로 색을 못 준다(문구와 같은 색, 줄만 바뀜). 회색을 원하면 오류 문구를 보여 주는 약 30곳을 `<ErrorMessage>`로 바꿔야 한다 → 개발자 결정 사항. ② 429(요청 횟수 제한)도 랜딩 3곳에서 "없음"이 아니라 "접속 실패"로 가른다(스펙은 네트워크 실패·5xx만 언급, 429를 "없음"으로 보여 주면 같은 오해라 함께 처리).
- **다음 에이전트가 알아야 할 것**: 🔵 **실기동 검증 대기(사람)** — 백엔드를 끈 채 `/o/<slug>`·`/m/<slug>`·`/invite/<token>`을 열어 "연결이 원활하지 않습니다" + 다시 시도(백엔드 켠 뒤 눌러 복구)·없는 slug는 기존 "찾을 수 없습니다"·5xx 오류 번호가 `오류 번호: …`로 뜨는지 확인. ErrorBoundary는 일부러 렌더 오류를 내 봐야 보인다(미검증). 방명록·헌화 등 랜딩 안의 부수 호출(`fetch` 직접 사용)은 이번 범위 밖이라 그대로. 프론트 에러 수집은 00-42 L-3 후순위.

<!-- Gemini 판정 1줄: ✅통과 (ApiError requestId 연계 오류번호 표기, ErrorBoundary 전역 래핑 및 랜딩 페이지 404/접속실패 분기 처리 확인) -->

## 2026-10-01 | 홈 navMode 상태 제거 (커밋 caadc2c)

- **근거 스펙**: docs/00_핵심플랫폼/00-40_홈_랜딩_재설계_계획서.md §3.4 마지막 줄(🔵 `navMode` 걷어낼지는 분기 4에서 정한다) — 2026-10-01 개발자 결정 "걷어냄"(.harness/docs-audit/README.md §4 00-D 결정 기록)
- **건드린 파일**:
  - eobomDev/frontend/src/App.tsx
  - eobomDev/frontend/src/components/Header.tsx
  - eobomDev/frontend/src/components/Sidebar.tsx
  - eobomDev/frontend/src/components/home/HomeDesktop.tsx
  - eobomDev/frontend/src/components/home/HomeMobile.tsx
  - eobomDev/frontend/src/lib/modeNav.ts
  - eobomDev/frontend/src/pages/HomePage.tsx

- **결과**: 메뉴 선택에 더 쓰이지 않던 `navMode` 상태와 그 전달 사슬을 전부 제거했다(7파일, +12/−47). 제거한 원문:
  - App.tsx: `const [navMode, setNavMode] = useState<NavMode | null>(...)`(localStorage 읽기 포함) · `const handleSetNavMode = (mode: NavMode) => {...}`(localStorage 쓰기 포함) · `import { NAV_MODE_STORAGE_KEY, type NavMode } from './lib/modeNav'` · `<Header onSetMode={handleSetNavMode}>` · `<Sidebar navMode={navMode}>` · `<HomePage>` 3곳(`/`·`/prep`·`/bereaved`)의 `onSetMode={handleSetNavMode}`
  - Header.tsx: `onSetMode?: (mode: NavMode) => void`(props 타입·구조분해) · `goToModeItem` 안 `onSetMode?.(mode);`
  - Sidebar.tsx: `navMode?: NavMode | null`(props 타입) · `NavMode` import
  - HomePage.tsx: `onSetMode?: (mode: NavMode) => void`
  - HomeDesktop.tsx·HomeMobile.tsx: `onSetMode` props 타입·구조분해 · 마운트 effect 안 `if (landingMode) { onSetMode?.(landingMode); }` · `goToModeItem` 안 `onSetMode?.(mode);`
  - modeNav.ts: `export const NAV_MODE_STORAGE_KEY = 'k_ending_nav_mode';`
  - 동작은 그대로다: 드로어는 `ALL_DRAWER_ITEMS` 정본으로 항상 전체 10개(09-28 지시), `/prep`·`/bereaved` 딥링크의 `landingMode`(어느 칸으로 갈지)는 유지.
  - 검증: `npx tsc --noEmit`(frontend) 에러 0 — `npm run build`는 돌리지 않음. 🔵 **10-01 사람 실기동 통과**: 모바일 상중 행정 가이드 화면에서 드로어를 열면 전체 메뉴가 표시됨(= 09-28 지시와 일치).
- **편차**: 스펙과 다르게 구현한 것은 없음. 문서 쪽이 코드와 어긋난 곳(모두 4단계에서 갱신 예정 — docs-audit README §4): 00-40 §3.4 마지막 줄(🔵 navMode 걷어낼지)·00-26 §4.3(*"모드 기억 — `localStorage`, 구현됨(`NAV_MODE_STORAGE_KEY`)"*)·00-26 §6(#2 모드 기억 ✅ 구현됨). 기억하던 값을 읽는 곳이 없었으므로 기능 손실은 없다.
- **다음 에이전트가 알아야 할 것**:
  - 🟡 **정리 후보**: `goToModeItem(_mode: NavMode, item)`의 안 쓰는 `_mode` 인자 — Header.tsx·HomeDesktop.tsx·HomeMobile.tsx 3곳. 호출부(`onNavigate={() => goToModeItem(mode, item)}`)도 같이 바꿔야 해서 이번엔 남겼다. ✅ **처리함(10-01)**: 정의 3곳을 `goToModeItem = (item: ModeMenuItem)`로, 호출부 3곳(`goToModeItem(mode, item)` → `goToModeItem(item)`)을 바꿨다. `modeLinkProps`·`renderModeMenu`는 `mode`를 실제로 써서 그대로. `tsc --noEmit`(frontend) 에러 0, 동작 변화 없음(실기동 불필요).
  - 이미 접속한 브라우저에는 옛 localStorage 키 `k_ending_nav_mode`가 남지만 읽는 코드가 없어 무해하다.

<!-- Gemini 판정 1줄: 🔄스펙갱신 (홈/헤더 navMode 불필요 상태 및 저장소 키 제거 통과 / 00-40 §3.4 및 00-26 미사용 모드기억 서술 갱신) -->
## 2026-10-01 | 금지어 제거 — KakaoMapModal 하드코딩 약속 문구 (00-D 발견 3번)

- **근거 스펙**: docs/00_핵심플랫폼/00-31_랜딩페이지_카피_원고.md §9(금지어 표 — 출처 docs/07_상중_행정_케어/07-02 §5.3) · .harness/docs-audit/README.md §4 00-D 발견 3번
- **건드린 파일**: eobomDev/frontend/src/components/KakaoMapModal.tsx , eobomDev/frontend/src/index.css , eobomDev/frontend/src/components/facility/FacilityReviewModal.tsx (🔵 삭제) , eobomDev/frontend/src/components/mypage/WithdrawalModal.tsx
- **결과**: 시설 데이터가 아닌 하드코딩 약속 문구를 지도 모달에서 전부 걷어냈다(🔵 2026-10-01 사람 지시로 처음 1줄에서 확대). KakaoMapModal.tsx에서 삭제한 원문: `• 24시간 장례지도사 상주`(확정 제거) · `• 무료 주차 (대형 버스/유족 우선)` · `• 대중교통 도보 5분 거리` · `• 긴급 운구 차 15분 도착 지역` — 이 줄들이 전부였던 "편의 정보" 블록(`<div className="kakao-map-info-grid">` 카드 2개: 제목 `주차 및 보증 정보`·`빠른 방문 안내`)을 통째로 제거했다(제목만 남는 빈 카드 방지). 같은 지시로 모달 상단 상태 배지 `● 실제 카카오 지도 렌더링 완료`(지도 로드 성공 시 뜨던 초록 배지)도 삭제 — 렌더링 중(`● 카카오 지도 렌더링 중...`)·실패(`● 지도를 불러오지 못했습니다`) 배지는 그대로. 🔵 같은 날 사람 지시로 모바일(≤480px) 버튼 배치도 변경: 길찾기·로드뷰가 세로로 쌓여 스크롤을 내려야 하던 것을 한 줄 2열로 — 라벨 `카카오맵 길찾기 ↗`→`길찾기`, `로드뷰 바로가기 ↗`→`로드뷰`(앞뒤 수식어 `카카오맵 `·` 바로가기`와 외부링크 아이콘 2개에 `className="kakao-map-btn-extra"`를 달아 ≤480px에서만 `display:none`, 데스크톱은 원래 문구 그대로). index.css `.kakao-map-action-row`의 `flex-direction: column`을 지우고 `gap: var(--sp-2)` · `.kakao-map-action-row .btn { min-width: 0; white-space: nowrap }` · `.kakao-map-btn-extra { display: none }` 추가. 🔵 같은 날 사람 지시로 모바일(≤480px) 모달 최상단 배지도 축소: 노란 `Kakao Maps Live Integration` 박스와 상태 배지(렌더링 중·불러오기 실패) 3개 span에 `className="kakao-map-badge"`, 감싸는 줄에 `kakao-map-badge-row`를 달고 index.css ≤480px 블록에 `.kakao-map-badge { font-size: var(--fs-caption) !important; padding: 0.1rem 0.4rem !important; line-height: 1.3 }`(기존 `var(--fs-body)`=16px → `--fs-caption` 14px, 인라인 값을 이기려고 !important) · `.kakao-map-badge-row { gap: var(--sp-1) !important; flex-wrap: wrap }` 추가. 데스크톱은 그대로. 부수 정리: 쓸 곳이 없어진 `ShieldCheck`·`Clock` import 제거, index.css의 `.kakao-map-info-grid`(≤480px 1열 규칙) 제거(`.kakao-map-action-row` 규칙은 유지). `eobomDev/frontend/src` 전역에서 표현 단위 grep(`24시간|24h|365일|즉시 출동|즉시 파견|디스패치|핫라인|15분 내|1-Touch|답사 예약|유언 편지|유언 메시지|사전 연명의료 의향서|유품 정리 대행|계정 해지 대행|만족도|고객 N명|후기`)을 돌린 결과 나머지는 아래 "다음 에이전트" 분류대로 **변경 없음**. `npx tsc --noEmit`(frontend) 에러 0.
- **편차**: 없음 — 지시서의 "확정 제거 1건 + 나머지는 약속 문구일 때만 교체, 애매하면 보고만"을 그대로 따랐다(교체 대상이 없어 교체 0건).
- **다음 에이전트가 알아야 할 것**:
  - 🔵 **10-01 사람 실기동 확인 완료 — 아래 ①~④ 전부 정상 구현**(개발자 보고). 이 항목의 UI 확인 대기는 없음.
  - (확인 항목 원문) **화면에서 확인할 곳(UI 변경)**: 장사시설 검색(`/facility`)에서 지도 모달(`KakaoMapModal`)을 열어 ①지도 아래 편의 정보 카드가 없어지고 바로 길찾기·로드뷰 버튼이 오는 배치 ②지도 로드 뒤 상단에 `Kakao Maps Live Integration` 노란 배지만 남는 모양 ③모바일(≤480px)에서 버튼이 `길찾기 | 로드뷰` 한 줄로 나오는지(360px 폭 기준 한 버튼 내용 폭 약 104px — 글자·아이콘이 안 잘리는지) — 사용처 `pages/FacilityPage.tsx:981`·`components/ObituaryView.tsx:42`(부고장 보기 화면의 지도 모달도 같은 컴포넌트).
  - 🟡 **남은 후보(안 고침, 사람 판단)**: 상단 `Kakao Maps Live Integration` 노란 배지(KakaoMapModal.tsx:217-219) — 개발자용 표기라 같은 결의 정리 후보(모바일에서는 위 지시로 축소만 함). 사람 확인 추가: ④모바일 상단 배지가 작아지고 상태 배지와 줄바꿈될 때 어색하지 않은지.
  - 🟡 **애매해서 안 고친 것(파일:줄 + 문구, 사람 판단)**:
    - ✅ **처리함(10-01 사람 지시)** `components/facility/FacilityReviewModal.tsx`(`[{facility.name}] 이용 후기`·`후기 내용`) — 전체 grep에서 import·렌더링 0건인 죽은 컴포넌트라 **파일 삭제**(사람이 삭제 승인, 사용처 0 재확인). `components/mypage/WithdrawalModal.tsx` — `{ label: '시설 후기', n: w.facilityReviews, text: \`${w.facilityReviews}건\` },` 줄과 `Preview.willDelete`의 `facilityReviews: number;` 타입 필드 삭제(시설 후기를 쓰는 화면이 없어 건수가 늘 0). `tsc --noEmit`(frontend) 에러 0.
    - 🟡 **프론트만 처리, 백엔드 그대로(범위 밖·사람 판단)**: `POST /api/facilities/:id/reviews`(`facilityRoutes.ts:9`·`facilityController.ts` createReview·`withEffectiveRating`) · 탈퇴 미리보기 응답의 `facilityReviews`(`accountDeletionController.ts:36·74`·`accountPurgeService.ts:37·81·101`) · 파기 스크립트 `backend/prisma/destroy-farewell-media.ts:128` · 스키마 `FacilityReview` 모델. 계정 파기가 이 리뷰 행을 실제로 지우므로(🔴 DB 쓰기 경로) 지우려면 별도 지시·백업 절차 필요.
    - `components/familyShared/sectionFields.ts:24` `사전연명의료의향서 등록` · `pages/EndingNotePage.tsx:528`·`:540` `「사전연명의료의향서」`·`사전연명의료의향서 등록 여부` — 등록기관에 등록한 *진짜 서류*를 가리키는 쓰임(§9 표는 "앱 입력분 지칭 시"만 금지, 앱 입력분은 이미 "연명의료 의향 메모"). 띄어쓰기 없는 표기라 표의 문자열과도 다름.
  - 건드리지 않은 것(규칙상 제외): `mockData/careGuideTasks.json:5-7` 법정 기한 `24시간 경과 전 화장·매장 금지`(실제 규칙) · 주석 `Footer.tsx:106`·`FacilityPage.tsx:25·881`·`EndingNotePage.tsx:101`. backend/src는 같은 표현 grep에서 화면 문구 0건(`operatingHours.ts:1` "접수는 24시간 받지만" 주석뿐).

<!-- Gemini 판정 1줄: ✅통과 (KakaoMapModal 하드코딩 약속 문구/임시 배지 제거 및 모바일 2열 버튼/배지 컴팩트화 확인) -->


## 2026-10-01 | 시설 후기 작성 API 닫기 (후기 기능 보류)

- **근거 스펙**: 스펙 없음 — 2026-10-01 개발자 결정(후기 기능 보류, .harness/docs-audit/README.md §4 00-D 후속). 앞선 프론트 정리(`FacilityReviewModal.tsx` 삭제·탈퇴 안내 `시설 후기` 줄 삭제)의 백엔드 짝.
- **건드린 파일**: eobomDev/backend/src/routes/facilityRoutes.ts , eobomDev/backend/src/controllers/facilityController.ts , eobomDev/backend/tests/auth-boundary.test.ts
- **결과**: 시설 후기 작성 엔드포인트를 닫았다. 제거한 원문: facilityRoutes.ts `router.post('/:id/reviews', createReview);`(9행) · 같은 파일 import 목록의 `createReview`(미사용 import 방지). `createReview` 함수는 facilityController.ts에 그대로 두고 위에 주석 한 줄 추가 — `// 10-01 보류 — 재개 시 facilityRoutes.ts에 라우트 복원(`router.post('/:id/reviews', createReview)`).` 이제 `POST /api/facilities/:id/reviews`는 404다. 🔴 안 건드린 것(지시대로): `FacilityReview` 모델·마이그레이션·DB, 조회 쪽 `reviews` include와 평점 집계 `withEffectiveRating`(facilityController.ts:87), 탈퇴 미리보기·계정 파기의 `facilityReviews` 집계. 검증: `npx tsc --noEmit`(backend) 에러 0 · `npm test`(backend) 210개 중 pass 210·fail 0(auth-boundary 포함, 테스트 DB 가드 통과).
- **편차**: 지시서 범위(라우트 1줄 + 주석)를 넘어 `tests/auth-boundary.test.ts`를 고쳤다 — 이 테스트가 `POST /api/facilities/none/reviews`를 "로그인 유저 전용(user) 보호 경로"의 `/api/facilities` 대표로 쓰고 있어, 라우트를 지우면 404가 돼 토큰 없음 401 기대 4종×경로·교차 토큰 3종이 실패한다. 그 대표 행(`{ ns: '/api/facilities', owner: 'user', method: 'POST', path: '/api/facilities/none/reviews' }`)을 주석으로 대체하고 "보호 네임스페이스를 빠짐없이 덮는다" 목록에서 `'/api/facilities'`를 뺐다. 대체 대표 경로를 찾아봤으나 `/api/facilities`의 나머지 라우트(조회 2개·`/:id/quotes`·`/:id/call-events`)는 비로그인 허용이라 보호 대표가 될 수 없었다.
- **다음 에이전트가 알아야 할 것**:
  - 후기를 재개하려면 ①facilityRoutes.ts에 import·라우트 복원 ②auth-boundary.test.ts의 대표 행·네임스페이스 `'/api/facilities'` 복원 — 두 곳의 주석이 그 자리를 가리킨다.
  - 🟡 후기 기능 잔재가 아직 남음(사람 판단): 스키마 `FacilityReview` 모델·조회 include·`withEffectiveRating`·탈퇴 미리보기 응답의 `facilityReviews`(accountDeletionController.ts:36·74, accountPurgeService.ts:37·81·101)·파기 스크립트 destroy-farewell-media.ts:128. 계정 파기가 리뷰 행을 지우는 DB 쓰기 경로라 별도 지시·백업 절차가 필요하다.
  - 프론트에는 이 API를 부르는 코드가 이미 없다(FacilityReviewModal.tsx 삭제됨) — 실기동 영향 없음, 실기동 불필요.
  - 커밋은 하지 않음 — 메시지 초안만.

<!-- Gemini 판정 1줄: 🔄스펙갱신 (POST /api/facilities/:id/reviews 라우트 비활성화 및 테스트 가드 조정 / 후기 기능 보류 상태 docs 반영) -->
## 2026-10-01 | 수락 철회 화면('더 이상 보지 않기') + 개인정보·동의 모달 (00-E 발견 1 ①②)

- **근거 스펙**: docs/00_핵심플랫폼/00-36_마이페이지_정보구조_점검_및_개편_기획서.md §4.6-2-1(수락 철회 화면 진입점)·§4.5(개인정보·동의 3층) · docs/00_핵심플랫폼/00-27_생전_가족지정_및_유족연결_기획서.md §9.2(철회 API·트랜잭션 정본) · .harness/docs-audit/README.md §4 "00-E 판정 결과" 1번 ①②
- **건드린 파일**: eobomDev/frontend/src/pages/FamilySharedPage.tsx , eobomDev/frontend/src/components/mypage/ConsentModal.tsx(신규) , eobomDev/frontend/src/pages/MyPage.tsx , eobomDev/frontend/src/components/mypage/MyPageProfile.tsx , eobomDev/backend/src/controllers/profileController.ts
- **결과**: ① FamilySharedPage 지정자별 카드 맨 아래에 빨간 작은 글자 `더 이상 보지 않기`(`.v2-account-foot-btn.is-danger`, 버튼 상자 없음) → 1단계 확인 모달(제목 `더 이상 보지 않기`, 본문 `{ownerName}님이 공유하신 내용을 더 이상 보지 않습니다. 다시 보시려면 {ownerName}님께 다시 요청하셔야 합니다.`, 사유 입력칸 없음, 제출 중 버튼 잠금·`처리 중…`) → `POST /api/family-designations/accepted/${designationId}/withdraw` 호출 → `load()`로 카드가 목록에서 사라지고 페이지 상단에 `철회되었습니다.` 한 줄(4초). ② 신규 `ConsentModal.tsx` — 마이페이지 `내 활동과 계정`의 새 행 `개인정보·동의`(MyPage.tsx, `ShieldCheck` 아이콘)가 연다. 표시: `서비스 이용약관 동의`·`개인정보 수집·이용 동의` 날짜만(토글 없음) + `동의를 거두시려면 회원 탈퇴가 필요합니다.` + `회원 탈퇴` 버튼(동의 모달을 닫고 기존 WithdrawalModal을 연다) + 마케팅 수신 체크 1개(`.v2-check`, 저장 시 `PATCH /api/me/profile {marketingAgreed}`만 전송). MyPageProfile.tsx에서 마케팅 체크박스(`마케팅 정보 수신에 동의합니다 (선택)`)·`marketingAgreed` 상태·PATCH 바디의 `marketingAgreed`·`ProfileData.marketingAgreedAt`을 제거(복제 금지, §4.5). profileController.ts `PROFILE_SELECT`·`ProfileRow`·`serializeProfile`에 `termsAgreedAt`·`privacyAgreedAt` 추가. 검증: frontend `npx tsc --noEmit` 0 · `npm run build` 통과(chunk 500kB 경고만) · backend `npx tsc --noEmit` 0. DB·스키마 변경 없음.
- **편차**: (1) 스펙은 동의 날짜를 "표시"하라고만 했으나 `GET /api/me/profile` 응답에 `termsAgreedAt`·`privacyAgreedAt`이 없어 **서버 응답에 두 필드를 추가**했다(날짜만, 값 변경 경로 없음). 스펙 문구 안에 서버 변경 언급이 없어 Opus 확인 필요. (2) 00-36 §4.6-2-1은 버튼에서 `철회` 단어를 금지하면서 같은 절 끝 토스트는 `"철회되었습니다"`로 적었다 — 스펙 문구 그대로 `철회되었습니다.`를 썼다(스펙 내부 불일치, 토스트 문구를 바꿀지 Opus 판정). (3) §4.5의 건별 층(`thirdPartyConsentAt`)은 모달이 아니라 §4.4 상담 상세에 동의 시각만 표시하라는 항목이라 이번 범위에서 제외 — 상담 상세 화면에는 아직 없다. (4) 스펙에 `개인정보·동의` 행의 아이콘 지정이 없어 `ShieldCheck`를 임의 선택.
- **다음 에이전트가 알아야 할 것**:
  - 🔴 실기동 검증 대기(사람 몫): 수락한 가족 계정으로 `/family-shared` → `더 이상 보지 않기` → 카드 사라짐·`철회되었습니다.` → 지정자 쪽 `가족 지정` 화면에서 상태가 DECLINED(수락 후 거둠)로 바뀌고 그 지정의 `EndingNoteGrant`가 `revokedAt` 처리됐는지 · 마이페이지 `개인정보·동의` 모달에서 날짜 두 줄·마케팅 저장(체크→저장→다시 열어 유지)·`회원 탈퇴` 버튼이 탈퇴 모달로 이어지는지 · `내 정보` 모달에 마케팅 체크가 없는지.
  - 🟡 지정자 쪽 `가족 지정` 화면의 `지금은 보지 않으십니다` 표시(00-36 §4.6-2-1 마지막 문단)는 후순위로 적혀 있어 구현하지 않았다. 수락 후 철회된 건이 지금은 지정자 화면에서 어떻게 보이는지 미확인.
  - 🟡 `ConsentModal`의 날짜가 null이면 `-`로 표시(약관 동의 기록 없는 옛 계정 — 08-24 이전 가입자 가능성). 문구는 새로 만들지 않았다.
  - 커밋은 하지 않음 — 메시지 초안만.

<!-- Gemini 판정 1줄: 🔄스펙갱신 (가족지정 철회 확인 모달 및 ConsentModal 약관동의 내역/마케팅 토글 구현 통과 / 00-36 서버 필드 추가 및 토스트 문구 갱신) -->
## 2026-10-01 | FacilityPage 시설 썸네일 로드 실패 시 플레이스홀더로 대체

- **근거 스펙**: 스펙 없음 — 2026-10-01 개발자 지시(운영에서 스카이장례식장 썸네일 깨짐: DB에는 `/uploads/facility-images/...` 경로가 있으나 Render 디스크에 파일 없음, systems.md 「이미지 저장」).
- **건드린 파일**: eobomDev/frontend/src/pages/FacilityPage.tsx
- **결과**: `brokenThumbs: Set<string>` 상태 추가, `const thumbnail = Array.isArray(item.images) && item.images.length > 0 ? `${BACKEND_URL}${item.images[0]}` : null;`을 `thumbnailSrc`(원본)와 `thumbnail`(`!brokenThumbs.has(thumbnailSrc)`일 때만 값)로 분리, `<img>`에 `onError={() => setBrokenThumbs((prev) => new Set(prev).add(thumbnail))}` 추가. 실패한 URL은 기존 `등록된 이미지 없음` 플레이스홀더로 전환(상태에 남아 `<img>`를 다시 그리지 않으므로 onError 루프 없음). 검증: frontend `npx tsc --noEmit` 0.
- **편차**: 없음(지시: 기존 플레이스홀더 재사용·문구 추가 금지·DB 미접촉 모두 준수). 확인한 부수 효과: ≤480px에서는 이미지 없는 시설과 같이 플레이스홀더 칸이 통째로 숨겨진다(기존 `hideImagePlaceholder` 규칙).
- **다음 에이전트가 알아야 할 것**:
  - 같은 패턴 후보 1곳 미수정: `eobomDev/frontend/src/pages/BizDashboard.tsx:591` `src={`${BACKEND_URL}${img}`}`(파트너 업로드 이미지 미리보기).
  - 파일 자체는 복구되지 않는다 — R2 이전(systems.md §5) 전까지 증상만 가린다.
  - 커밋은 하지 않음 — 메시지 초안만.

<!-- Gemini 판정 1줄: ✅통과 (FacilityPage 썸네일 onError 발생 시 등록된 이미지 없음 플레이스홀더 안전 대체 확인) -->
## 2026-10-01 | 가족 지정 화면 — 수락 후 거둔 건 표시 구분 (00-36 §4.6-2-1 후순위분)

- **근거 스펙**: docs/00_핵심플랫폼/00-36_마이페이지_정보구조_점검_및_개편_기획서.md §4.6-2-1 마지막 문단(지정자 화면 `acceptedAt != null && status == DECLINED` 조합 구분, 문구 `지금은 보지 않으십니다`) · 00-27 §9.2 · 앞선 실기동에서 철회 후 지정자 화면이 `거절됨 · 다시 알리기 가능`으로 나온 것을 사람이 확인(10-01).
- **건드린 파일**: eobomDev/backend/src/controllers/familyDesignationController.ts , eobomDev/frontend/src/components/mypage/MyPageFamilyDesignation.tsx
- **결과**: `GET /api/family-designations` 응답(`serialize`)에 `acceptedAt` 추가(`FamilyDesignationRow` 타입에도). 프론트 `statusLabel`의 `if (item.status === 'DECLINED') return '거절됨 · 다시 알리기 가능';`를 `item.acceptedAt ? '지금은 보지 않으십니다 · 다시 알리기 가능' : '거절됨 · 다시 알리기 가능'`으로 교체(`FamilyDesignationItem`에 `acceptedAt: string | null` 추가). 검증: frontend·backend `npx tsc --noEmit` 둘 다 0. DB·스키마 변경 없음(컬럼은 이미 있음).
- **편차**: 문구 뒤 `· 다시 알리기 가능`은 기존 DECLINED 문구의 꼬리를 그대로 이어 붙인 것으로 스펙에 없는 조합이다. 철회와 회원 탈퇴로 인한 철회가 같은 조합이라 `탈퇴하셨습니다`로 구분하지 않았다(스펙 지시대로).
- **다음 에이전트가 알아야 할 것**:
  - 🟡 극단 경계: 수락→철회→재초대→상대가 이번에는 *거절* 하면 `acceptedAt`이 남아 있어 `지금은 보지 않으십니다`로 표시된다(`acceptedAt`은 철회 때 지우지 않는 설계, 00-27 §9.2). 재초대 시 `acceptedAt` 초기화 여부는 Opus 판단.
  - 실기동 검증 대기(사람 몫): 수락 후 철회한 건이 `지금은 보지 않으십니다 · 다시 알리기 가능`으로 나오고, 처음부터 거절한 건은 그대로 `거절됨 · …`으로 나오는지.
  - 커밋은 하지 않음 — 메시지 초안만.

<!-- Gemini 판정 1줄: ✅통과 (가족지정 acceptedAt 존재 시 DECLINED 상태 문구 '지금은 보지 않으십니다' 구분 표기 확인) -->
## 2026-10-01 | 동의 기록 없는 기존 회원 재동의 창 (00-36 §4.5-1)

- **근거 스펙**: docs/00_핵심플랫폼/00-36_마이페이지_정보구조_점검_및_개편_기획서.md §4.5-1(표 그대로) · §4.3-1(유예 계정 가드가 먼저)
- **건드린 파일**: eobomDev/backend/src/controllers/authController.ts , eobomDev/backend/src/controllers/profileController.ts , eobomDev/backend/src/routes/meRoutes.ts , eobomDev/backend/tests/consent.test.ts(신규) , eobomDev/backend/tests/auth-boundary.test.ts , eobomDev/backend/package.json , eobomDev/frontend/src/components/ConsentFields.tsx(신규) , eobomDev/frontend/src/components/ConsentRequiredModal.tsx(신규) , eobomDev/frontend/src/components/LoginModal.tsx , eobomDev/frontend/src/components/AccountRecoveryModal.tsx , eobomDev/frontend/src/App.tsx
- **결과**: ① `GET /api/auth/me` 응답 `user`에 `consentRequired: !termsAgreedAt || !privacyAgreedAt` 추가(여부만, 시각은 안 내림). ② 신규 `POST /api/me/consent`(profileController `recordMyConsent`) — 본인만(aud user, 그 외 401), 바디 `terms`·`privacy`가 `=== true`가 아니면 400(DB 무변경), 비어 있는 칸만 `new Date()`로 찍음(기존 값 덮어쓰기 없음, 과거 날짜 채우기 없음), `marketing === true`이고 `marketingAgreedAt`이 null일 때만 찍음. 스키마·마이그레이션 변경 없음. ③ 화면: LoginModal의 `ConsentCheckbox` + 만14세 확인 박스 + "전체 동의합니다" 박스를 `ConsentFields.tsx`로 분리(LoginModal은 `<ConsentFields …/>` 호출로 교체, 상태는 부모 보유), 신규 `ConsentRequiredModal.tsx`가 App.tsx에서 `AccountRecoveryModal` 바로 아래에 마운트 — `consentRequired && !deletionScheduledAt`일 때 전체 화면 `role="alertdialog"`, 배경 클릭·Esc·× 없음, 버튼 `동의하고 계속하기`(만14세+필수2 체크 시 활성)·`동의하지 않고 로그아웃`(onLogout만 호출, API 호출 없음). 문구: `이어봄 이용약관과 개인정보 수집·이용에 대한 동의 기록이 없습니다. 계속 이용하시려면 동의해 주세요.` 유예 중 계정은 복구 안내가 먼저이고, 복구 성공 시 `window` 이벤트 `eobom:account-recovered`(AccountRecoveryModal이 발행)로 재확인한다. 검증: backend `npm test` 225 통과(신규 `tests/consent.test.ts` 8건: 동의필요 여부 3·400 거절 DB무변경·지금 시각 기록·한 칸만 기록·마케팅 규칙·401, `auth-boundary`에 `/api/me/consent` 행 추가) · frontend·backend `npx tsc --noEmit` 0 · frontend `npm run build` 통과(chunk 500kB 경고만). 🔴 DB 쓰기 스크립트로 기존 회원 값을 채우지 않았다(테스트는 전용 `eobom_test`에 가짜 회원만 만들고 자기 id만 삭제).
- **편차**: (1) 스펙에 없는 `eobom:account-recovered` 이벤트를 추가 — 유예 복구 직후 같은 세션에서 재동의 창이 이어서 뜨게 하려는 것(없으면 새로고침 전까지 미동의로 이용). (2) 창 제목 `이용 동의가 필요합니다`는 스펙 예시 문구에 없는 제목이라 임의로 붙였다(본문은 예시 그대로). (3) `ConsentFields` 분리로 LoginModal 안의 `toggleAll`·`allAgreed`가 컴포넌트 안으로 이동 — 가입 탭 동작은 동일(만14세는 여전히 전체 동의에서 제외).
- **다음 에이전트가 알아야 할 것**:
  - 🔴 실기동 검증 대기(사람 몫): 로컬 회원 6명 전원 동의일 null — ① 로그인 → 창 표시·바깥 클릭/Esc로 안 닫힘 ② 동의 → 창 사라짐·마이페이지 `개인정보·동의`에 오늘 날짜 표시(DB도 지금 시각) ③ 한 칸만 비운 계정 → 그 칸만 찍힘 ④ `동의하지 않고 로그아웃` → 로그아웃·DB 변화 없음·다음 로그인에 다시 뜸 ⑤ 유예 중 계정 → 복구 안내 먼저, `계속 이용` 뒤 동의 창. 🔴 실기동에서 동의하면 로컬 DB 값이 바뀌므로 필요하면 먼저 `backup-db.ps1 -Target local`.
  - 🟡 서버 쪽 차단은 스펙대로 이번에 없음(동의 전 계정이 다른 API를 직접 부르는 건 안 막음).
  - 🟡 운영 대상 건수는 사람이 조회(context.md ④).
  - 작업트리의 `docs/…/00-36_…기획서.md`·`.harness/docs-audit/ledger_00.md` 수정은 이 작업이 만든 게 아니다(Opus 쪽 변경).
  - 커밋은 하지 않음 — 메시지 초안만.

<!-- Gemini 판정 1줄: ✅통과 (consentRequired 플래그 기반 ConsentRequiredModal 필수 재동의 차단창 및 POST /api/me/consent 검증 확인) -->
## 2026-10-01 | 운영 데모 로그인 전면 차단 (production이면 모든 provider 403)

- **근거 스펙**: 스펙 없음 — 2026-10-01 개발자 지시(보안: `POST /api/auth/demo-login`이 운영에서 KAKAO/NAVER/GOOGLE 데모를 허용, 소셜 인증 없이 공용 데모 계정 토큰 발급). 기존 ADMIN 가드 근거는 docs 01-05 §6.4·§11 3항.
- **건드린 파일**: eobomDev/backend/src/controllers/authController.ts , eobomDev/backend/tests/demo-login.test.ts(신규) , eobomDev/backend/package.json
- **결과**: `demoLogin`의 `if (provider === 'ADMIN' && process.env.NODE_ENV === 'production')`을 `if (process.env.NODE_ENV === 'production')`으로 넓힘(같은 403·같은 문구 `허용되지 않는 요청입니다.`, 동의 검사·provider 분기보다 먼저). 신규 `tests/demo-login.test.ts` 7건 — production에서 KAKAO·NAVER·GOOGLE·ADMIN·provider 없음 전부 403(동의 true를 실어도), 개발 환경에서 ADMIN 200+토큰 / KAKAO 동의 없음 400. `package.json`의 `test` 스크립트에 추가. 검증: backend `npx tsc --noEmit` 0 · `npm test` 232 통과. DB 변경 없음 — 운영 DB의 데모 계정 3개(demo_*@eobom.co.kr)는 건드리지 않았다.
- **편차**: 없음. 개발 대조 테스트는 DB에 쓰지 않는 경로(ADMIN·동의 없는 소셜 400)만 썼다 — 소셜 데모 성공 경로(User upsert)는 자동 테스트로 덮지 않았고 코드도 안 바꿨다.
- **다음 에이전트가 알아야 할 것**:
  - 🔴 운영에 `NODE_ENV=production`이 실제로 설정돼 있어야 이 가드가 작동한다(Render 환경변수) — 배포 뒤 사람이 확인: 운영 `POST /api/auth/demo-login`이 403인지.
  - 🟡 운영 DB의 데모 계정 3개 정리는 공개 직전 사람 결정(context.md ⑤).
  - 커밋은 하지 않음 — 메시지 초안만.

<!-- Gemini 판정 1줄: ✅통과 (운영 환경 demoLogin 전 프로바이더 403 차단 및 테스트 케이스 검증 확인) -->
## 2026-10-01 | 운영자 refresh 1d + 로그인 잠금 (00-37 §7 #5·#7)

- **근거 스펙**: docs/00_핵심플랫폼/00-37_운영자_콘솔_확장_및_접근분리_기획서.md §7 #5·#7 · A-1 4-1
- **건드린 파일**: eobomDev/backend/src/controllers/adminController.ts , eobomDev/backend/prisma/schema.prisma , eobomDev/backend/prisma/migrations/20261001112000_add_admin_login_lock/migration.sql(신규) , eobomDev/backend/tests/admin-login-lock.test.ts(신규) , eobomDev/backend/package.json , docs/00_핵심플랫폼/00-05_DB_요구사항_및_테이블_사전.md(`generate-db-doc.js` 자동 생성분)
- **결과**: ① `REFRESH_TOKEN_TTL` `'30d'` → `'1d'`(access `'2h'` 그대로). ② `Admin`에 `failedLoginCount Int @default(0)`·`lockedUntil DateTime?` 추가 — 마이그레이션 SQL은 손으로 작성한 추가형 `ALTER TABLE "Admin" ADD COLUMN "failedLoginCount" INTEGER NOT NULL DEFAULT 0, ADD COLUMN "lockedUntil" TIMESTAMP(3)`(`db push` 미사용). ③ `login`: `lockedUntil`이 미래면 비밀번호 비교 전에 429 + `잠시 후 다시 시도해 주세요.`(토큰 없음, 잠금 중 시도는 세지 않음) / 비밀번호 불일치 시 계정이 있으면 원자적 `increment`, 5 이상이면 `lockedUntil = now+15분`, 응답은 기존 401 `이메일 또는 비밀번호가 올바르지 않습니다.` 그대로(5회차까지 남은 횟수 미노출) / 잠금이 풀린 뒤 첫 실패는 1부터 다시 셈 / 성공 시 `failedLoginCount: 0, lockedUntil: null`을 refreshTokenHash 갱신과 한 번에. 없는 계정은 기존 401, DB 무변경. 신규 `tests/admin-login-lock.test.ts` 7건(5회 실패→6번째 429·잠금 중 정답 거부·15분 경과 후 성공+초기화·잠금 해제 뒤 1부터 재카운트·성공 시 4→0·없는 계정 401·refresh exp−iat=86400) + `package.json` test 스크립트 등록. 검증: backend `npx tsc --noEmit` 0 · `npm test` 239 통과 · `npm run test:db:migrate`(전용 `eobom_test`에만) 적용 · `node .harness/tools/generate-db-doc.js` 실행(설명 없음 34개). 🔴 백업: `backup-db.ps1 -Target local` → `eobomDev/backend/backups/local-20261001-111542.dump` 251.5 KB 확인 후 착수. **로컬 개발 DB(`eobom_db`)에는 아직 마이그레이션을 적용하지 않았다**(사람 확인 대기).
- **편차**: (1) 잠금 응답 상태코드는 스펙에 없어 429로 정했다(문구는 스펙 그대로 한 가지, 끝에 마침표). (2) 5번째 실패 응답은 잠금 문구가 아니라 기존 401이다(남은 횟수를 알리지 않기 위해 — 잠금 문구는 6번째 시도부터). (3) 스펙 서술상 불가피한 한계: 잠금 중인 계정만 429 문구를 받고 없는 계정은 401이라 "5회 이상 틀린 계정"의 존재는 추론 가능하다 — 스펙 문구 그대로 구현했고 판단은 Opus 몫.
- **다음 에이전트가 알아야 할 것**:
  - 🔴 로컬 개발 DB 적용 대기: 사람 확인 후 `cd eobomDev/backend && npx prisma migrate deploy`(추가형, 기존 행 무변경). 적용 전에는 로컬에서 운영자 로그인이 컬럼 없음으로 실패한다.
  - 🔴 운영 반영은 사람 몫: **추가형이므로 `powershell -File .harness/tools/migrate-prod.ps1` → push 순서**(순서가 바뀌면 새 코드가 없는 컬럼을 찾아 운영자 로그인이 500).
  - 🟡 `npx prisma generate`가 `query_engine-windows.dll.node` EPERM(실행 중인 dev 서버가 잡고 있는 것으로 추정)으로 끝까지 못 돌았다 — 타입은 반영돼 tsc·테스트는 통과. dev 서버를 껐다 켤 때 한 번 더 `npx prisma generate`.
  - 🟡 잠금은 IP가 아니라 계정 단위다(스펙대로). 잠금 해제용 운영 도구는 없다 — 15분 대기가 유일한 해제.
  - 커밋은 하지 않음 — 메시지 초안만.

<!-- Gemini 판정 1줄: ✅통과 (운영자 리프레시 토큰 1일 단축, 5회 연속 로그인 실패 시 15분 계정 잠금 및 429 응답 처리 확인) -->
## 2026-10-01 | 00-F 결정 ① — 죽은 최소폭 규칙(.main-wrapper .container 1200px) 삭제

- **근거 스펙**: .harness/docs-audit/README.md §4 "00-F 판정 결과" 1번 + 개발자 결정(10-01) · docs/00_핵심플랫폼/00-39 §5-0
- **건드린 파일**: eobomDev/frontend/src/index.css (315~322행 블록과 주석 삭제, 9줄)
- **결과**: `.main-wrapper .container { min-width:1200px }` 삭제. `.container`를 쓰는 곳은 Admin·Biz·Partner뿐인데 admin·partner는 `.main-wrapper` 밖(App.tsx:54·408)이고 BizDashboard는 PartnerPortalPage 안에 렌더돼 이 규칙이 어디에도 안 걸리던 죽은 규칙. 같은 미디어쿼리의 `.main-wrapper` 스크롤 패널·`min-width:0`(304~313)은 그대로. `npm run build` 통과(청크 크기 경고만).
- **편차**: 없음. 지시의 "BizDashboard는 라우트 없음"은 맞지만(별도 라우트 0), **삭제 후보는 아님** — PartnerPortalPage.tsx:4·154가 import·렌더 중이라 사용처가 있다. 삭제 안 함.
- **다음 에이전트가 알아야 할 것**:
  - 🟡 [Opus] `00-39` §5-0 *"운영자 화면 최소폭 1200px + 좌우 스크롤 유지"*는 이제 코드와 반대(운영자도 줄어듦)라 4단계에서 문서를 고쳐야 함. `00-38` §6.4-1의 1200px 서술도 경위로. 대장 판정은 이미 `갱신`.
  - 🟡 운영자 화면 넓은 표가 좁은 창에서 잘리는지는 이번 범위 아님 — 실사용 중 보이면 그 표에만 가로 스크롤(별건).
  - 실기동 확인 안 함(어떤 화면에도 매치되지 않던 규칙이라 시각 변화 없음 예상).
  - 커밋은 하지 않음 — 메시지 초안만.

<!-- Gemini 판정 1줄: 🔄스펙갱신 (미적용 CSS 규칙 .main-wrapper .container 1200px 정리 통과 / 00-39 §5-0 운영자 최소폭 기술 서술 갱신) -->
## 2026-10-01 | 운영자 대시보드 탭 줄 — 여러 줄 쌓임 → 한 줄 스크롤 + 좌우 화살표

- **근거 스펙**: 스펙 없음 → 즉흥 구현(개발자 직접 요청: 탭이 좁은 화면에서 여러 줄로 쌓이니 화살표로 넘기게, 모바일도 동일)
- **건드린 파일**: eobomDev/frontend/src/pages/AdminPage.tsx(`TabTrack` 신설·탭 9개를 감쌈), eobomDev/frontend/src/index.css(`.scroll-track-hidden` 추가)
- **결과**: 탭 9개가 한 줄 가로 스크롤 트랙에 놓이고, 넘치는 쪽에만 ◀ ▶ 버튼이 나온다. 미디어쿼리 없이 전 폭 적용이라 모바일 포함. 오른쪽 검색·새로고침 영역은 기존대로 줄바꿈. `tsc --noEmit`·`npm run build` 통과. ✅ 실기동 통과(10-01 사람: "AdminPage 탭 줄 정상 구현됨").
- **편차**: 스펙 없음. 운영자 화면은 `00-39` ⑥ 보류 그룹이라 v2 규칙 미적용 — 인라인 스타일 그대로 둠.
- **다음 에이전트가 알아야 할 것**:
  - 🔴 실기동(사람): 좁은 창·실기기에서 화살표 표시 확인. 선택된 탭이 트랙 밖에 있어도 자동으로 따라오지 않음(보정 안 넣음).
  - 🟡 BizDashboard·PartnerPortalPage의 탭/칩 줄은 확인 안 함 — 이번엔 AdminPage만.
  - 커밋은 하지 않음 — 메시지 초안만.

<!-- Gemini 판정 1줄: ✅통과 (AdminPage TabTrack 가로 스크롤 트랙 및 좌우 화살표 네비게이션 반응형 편의성 개선 확인) -->

## 2026-10-01 | 00-42 L-1 — 접속기록·운영자 감사 자동화·에러 기록 (공개 전 필수)

- **근거 스펙**: docs/00_핵심플랫폼/00-42_운영_기록_로그_설계서.md §5(설계)·§7 L-1·§9(10-01 확정 6건)
- **건드린 파일**(전수):
  - 스키마: eobomDev/backend/prisma/schema.prisma(`AccessLog`·`ErrorLog` 신설, `AdminAuditLog`에 `ip`·`result`·`requestId` 칸 + `createdAt` 인덱스), eobomDev/backend/prisma/migrations/20261001150000_add_ops_logs/migration.sql(신규)
  - 신규: eobomDev/backend/src/middleware/requestLog.ts(요청 번호·접속기록), eobomDev/backend/src/middleware/adminAudit.ts(운영자 감사 미들웨어), eobomDev/backend/src/middleware/errorHandler.ts(전역 에러 처리기), eobomDev/backend/src/services/opsLogService.ts, eobomDev/backend/src/services/opsLogPurgeService.ts, eobomDev/backend/src/utils/logMask.ts, eobomDev/backend/tests/ops-log.test.ts
  - 수정: eobomDev/backend/src/app.ts(trust proxy 1·requestId·accessLog·cors exposedHeaders·errorHandler), eobomDev/backend/src/server.ts(unhandledRejection), eobomDev/backend/src/routes/adminRoutes.ts(`router.use(adminAudit)`), eobomDev/backend/src/controllers/adminController.ts(로그인 LOGIN·LOGIN_FAIL·LOCKED, 회원 상세 VIEW 직접 기록 제거 → `setAuditTarget`), eobomDev/backend/src/controllers/deathVerificationAdminController.ts(상세 VIEW 직접 기록 제거 → `setAuditTarget`), eobomDev/backend/prisma/destroy-farewell-media.ts(⑥ 운영 기록 만료 단계), eobomDev/backend/package.json(`npm test`에 ops-log.test.ts 추가)
  - 하네스·자동생성: .harness/systems.md(로그 표 크기 SQL 한 줄·300MB 기준), docs/00_핵심플랫폼/00-05_DB_요구사항_및_테이블_사전.md(`generate-db-doc.js` 재생성 — 설명 없음 37개)
- **결과**:
  - ① 모든 응답에 `X-Request-Id`(16자 hex, 클라이언트 값 무시) · `app.set('trust proxy', 1)` · CORS `exposedHeaders`.
  - ② `AccessLog`: 로그인한 요청 전부 + 쓰기(POST·PATCH·PUT·DELETE) + 4xx·5xx. 경로에서 `?` 이후 제거. 응답이 끝난 뒤 기록하고 실패해도 요청엔 영향 없음. 주체는 토큰을 **검증해** 종류·id만(위조 토큰은 익명).
  - ③ `adminAudit`를 `requireAdminAuth` 바로 뒤 한 곳에 걸어 운영자 전 경로 기록(GET→LIST/VIEW, POST→CREATE, PATCH·PUT→UPDATE, DELETE→DELETE + IP·결과·요청 번호). 로그인은 LOGIN·LOGIN_FAIL·LOCKED(잠금 시작·잠금 중 시도 거부 2종을 `reason`으로 구분). 🔴 성공한 GET(`/me` 제외)은 `res.send`를 붙잡아 감사 행이 DB에 들어간 **뒤에만** 응답 — 실패하면 503(데이터 없음).
  - ④ 전역 `errorHandler`(5xx만 `ErrorLog`, 응답은 일반 문구+요청 번호) · 핸들러가 직접 돌려준 5xx도 `Http5xx`로 같은 요청 번호에 기록 · `unhandledRejection` 기록. 메시지는 마스킹·200자, Prisma 에러는 마지막 줄만, 스택은 `at` 줄 5개.
  - ⑤ 기록 표에 쓰는 코드는 create뿐이고 update·upsert 없음. 지우는 코드는 `opsLogPurgeService.ts`의 `deleteMany` 3줄(보관기간 `createdAt` 단일 조건)뿐 — `grep -E "(accessLog|errorLog|adminAuditLog)\.(update|delete|upsert)" src/`가 정확히 그 3줄만 낸다. 보관기간 파기 = `opsLogPurgeService`(접속 365일·감사 730일·에러 90일, `createdAt` 단일 조건) → `destroy-farewell-media.ts` ⑥ 단계(dry-run은 건수만).
  - 검증: `npx tsc --noEmit` 에러 0 · `npm test` **262개 통과·실패 0**(기존 239 + `tests/ops-log.test.ts` 23). 시험한 것: 쿼리 제거, 요청 본문·시도 이메일 미기록, 익명 성공 조회 미기록, 위조 토큰=익명, 로그인 LOGIN_FAIL·LOCKED, 목록 LIST·상세 VIEW(중복 없이 1줄), 404=FAIL, 감사 실패 시 열람 503·`/me`·로그인·쓰기는 통과, 접속기록 실패해도 200, 에러 마스킹, 4xx는 에러 기록 안 함, Http5xx, 보관기간 경계(366/364·731/729·91/89일).
  - DB: `backup-db.ps1 -Target local` → `local-20261001-132007.dump`(251.8KB, 파일 확인) → 사람 확인(10-01) → 로컬 개발 DB(`eobom_db`) `migrate deploy` 적용 → `migrate diff --from-schema-datasource` **No difference**. 테스트 DB(`eobom_test`)도 `npm run test:db:migrate`로 적용.
- **편차**:
  1. 운영자 감사 미들웨어가 요청마다 한 줄을 남기므로, 업무 의미가 있는 기존 감사 행(`HIDE`·`APPROVE`·`REJECT` 등 사유 포함)과 **한 요청에 두 줄**이 된다(요청 단위 `UPDATE` + 업무 단위 행). 합치지 않고 나란히 둠 — 기존 행에 사유가 있어서. 단 회원 상세·사망 확인 상세의 `VIEW`는 중복이라 핸들러 쪽 직접 기록을 **지우고** 미들웨어로 일원화(열람 실패 시 응답 거부 규칙을 적용하려고).
  2. 🔴 `unhandledRejection` 핸들러를 달면 Node 기본 동작(프로세스 종료)이 사라진다 — 기록하고 **서비스는 계속 돌게** 했다. 종료를 원하면 `server.ts`에서 `process.exit(1)` 한 줄.
  3. `MulterError`를 전역 처리기에서 400으로 매핑(이전엔 처리기가 없어 500 HTML) — 스펙에 없는 소폭 동작 변경.
  4. `GET /api/admin/me`는 fail-open(본인 이름·이메일뿐이고 페이지 로드마다 불려 감사 저장소 장애가 운영자 로그인 자체를 막으면 안 되어서).
  5. 스펙 ⑤의 *"보관기간 지난 행은 어드민 파기 탭 대상에도 추가"* 중 **파기 탭(화면)은 하지 않음** — 탭은 유족 메시지 건별 선택 UI라 로그 일괄 만료와 성격이 다르다. 파기 배치(`npm run purge`/`purge:confirm`)에만 추가. 필요하면 별도 스펙.
  6. 스펙 ⑤ *"그 파기도 ④에 남긴다"*(§5.2 ⑥)는 L-2(파기 기록 일원화) 몫이라 이번엔 스크립트 출력 건수만.
- **다음 에이전트가 알아야 할 것**:
  - 🔴 **운영 반영은 사람**: 커밋 → `powershell -File .harness/tools/migrate-prod.ps1`(**추가형이라 migrate 먼저**) → push. 이 순서가 어긋나면 새 코드가 없는 표를 찾다 접속 때마다 에러 기록 실패 로그가 쌓이고(요청은 성공), 운영자 열람은 **503으로 막힌다**(감사 행을 못 써서).
  - 🔴 **실행 중인 로컬 백엔드 dev 서버**가 Prisma 엔진 DLL을 잡고 있어 `prisma generate`의 DLL 교체 단계가 EPERM이었다. 타입·클라이언트 JS는 새로 생성됐고(엔진 바이너리는 스키마와 무관) `tsc`·테스트는 통과했지만, **dev 서버를 한 번 껐다 켜고 `npx prisma generate`를 다시 돌리는 게 깔끔**하다.
  - 🟡 실기동(사람): 로컬에서 운영자 로그인 → 회원 목록·상세를 열고 `SELECT action,result,ip,"requestId" FROM "AdminAuditLog" ORDER BY "createdAt" DESC LIMIT 10;` 로 LOGIN·LIST·VIEW와 IP가 찍히는지. 로컬은 `::1` 또는 `127.0.0.1`이 정상. 운영 Render에서 `req.ip`가 실제 주소인지(`trust proxy 1`)는 **운영 배포 후에만 확인 가능**.
  - 🟡 프론트의 *"오류 번호: ○○○"* 표시(§5.2 ③)는 이번 범위가 아님 — 서버는 이미 응답 헤더·오류 JSON 본문의 `requestId`를 준다. CORS `exposedHeaders`도 열어 둠.
  - `[Opus]` 후속(§8): `00-19` 제4조(접속기록 1년·운영자 2년·에러 90일)·`00-37` §3.2(IP·결과·미들웨어 자동화·열람 실패 시 응답 거부)·`00-22` E-8 체크 반영.
  - 커밋은 하지 않음 — 메시지 초안만.
  - **후속 1(10-01 개발자 요청)**: 회원 상세 열기 전 `window.confirm("이 상세 조회는 기록됩니다. 계속하시겠습니까?")` — eobomDev/frontend/src/pages/AdminPage.tsx(`openMember`; 모달 안 경고 박스 삭제). 취소하면 요청을 안 보내 기록도 없다. `tsc --noEmit` 통과, 실기동 대기. 사망 확인 상세는 이번에 안 바꿈.
  - **후속 2(10-01 개발자 결정) — 🔴 편차: 시각을 KST로 저장.** 설계서 §5.2 ⑦은 "UTC 저장, 화면만 한국 시간"인데, 개발자 요청으로 `AccessLog`·`ErrorLog`·`AdminAuditLog`의 `createdAt`만 한국 시간 벽시계 값으로 저장한다. 구현: 마이그레이션 `20261001160000_ops_log_kst_default`(칸 기본값을 `timezone('Asia/Seoul'::text, now())`로 — 기존 행·앱 코드 변경 없음), `opsLogPurgeService.ts` 기준 시각 +9시간, `schema.prisma` 주석. 백업 `local-20261001-134058.dump` → 사람 확인 → 로컬 적용 → `migrate diff` No difference. `npm test` 263 통과(KST 확인 테스트 1건 추가).
    - ⚠️ 칸 타입이 시간대 없는 timestamp라 DB 도구엔 `13:30Z`처럼 **Z가 붙어 보이지만 실제는 한국 시각**이다. 이 3개 표만 KST이고 나머지 표는 UTC — **두 표를 `createdAt`으로 직접 비교·조인하지 말 것.** 점검 SQL에 `AT TIME ZONE 'Asia/Seoul'`을 또 붙이면 9시간 두 번 밀린다.
    - 🔴 운영 반영 때 마이그레이션이 **2개**(`add_ops_logs` + `ops_log_kst_default`)다 — `migrate-prod.ps1`이 둘 다 적용한다. 🟡 `[Opus]`: `00-42` §5.2 ⑦·§8을 "KST 저장"으로 고칠지 판단 필요(`docs/`는 건드리지 않음).
  - **후속 3(10-01 개발자 요청) — 시간 표기를 한국 시간으로 통일(표기만, 저장은 그대로).**
    - 신규: eobomDev/frontend/src/utils/kstDate.ts(`Intl` `timeZone: 'Asia/Seoul'`), eobomDev/backend/src/utils/kst.ts(+9h 고정), eobomDev/backend/src/utils/kst.test.ts(4건, `npm test`에 추가).
    - 프론트(직접 `getMonth()`·`toLocale…String()` 제거): AdminPage.tsx(9곳), FamilySharedPage.tsx(2), FarewellMessageCard.tsx(2), AccountRecoveryModal.tsx, ReleaseRequestModal.tsx, MyConsultationsPage.tsx, MyGuestbookPage.tsx, ConsentModal.tsx, WithdrawalModal.tsx, FarewellMessagePage.tsx(내보내기 파일명 날짜), EndingNotePage.tsx(`timeZone: 'Asia/Seoul'`만 추가). 🔵 `obituaryCard.ts`는 이미 KST라 그대로.
    - 백엔드: consultService.ts·leadService.ts(접수번호 `YYMMDD`), farewellMessageExport.ts(파일명 날짜·`반출 일시`·`작성일`), ocrController.ts(`todayKey`), app.ts(`/api/health` time), consultService·leadService·leadController(2)·expertController의 `statusHistory.at`(→ `+09:00` 표기, 같은 순간이라 `new Date()`로 읽으면 동일).
    - 검증: 양쪽 `tsc --noEmit` 에러 0 · `npm test` 267 통과(262+KST 확인 1+kst 4). 🔴 실기동 대기: 어드민·내 상담·유족 메시지 화면의 날짜가 한국 날짜로 나오는지.
    - **편차/주의**: ① 접수번호 날짜가 한국 날짜로 바뀐다 — **한국 0~9시 접수분은 이전엔 하루 전 번호였다**(`ConsultNumberCounter`·`LeadNumberCounter` 일자 키도 같이 바뀌어 오늘 새 일련번호로 시작). ② OCR 하루 한도 초기화가 UTC 자정(한국 09시) → 한국 자정. ③ 🔴 **다른 표의 `createdAt` 저장값은 UTC 그대로 둠**(전 표 KST 저장은 기존 행 `+9h` 일괄 수정과 `new Date()` 비교 로직 전수 수정이 필요해 위험 — 별도 결정). 로그 3개 표만 KST 저장. ④ 계산용 시각(`setDate`·`setFullYear` 파기 기한, `operatingHours`의 이미 KST 보정된 계산)은 글자 표기가 아니라 손대지 않음.
  - **후속 4(10-01 개발자 결정) — 🟡 시험 중·결정 대기: 로그 3개 표 UTC 저장으로 복귀 + 한국 시간 뷰.** 위 후속 2의 "3개 표 KST 저장"을 **대체**한다(b12d499 이후 로컬 `AdminAuditLog`에 UTC 값이 계속 들어와 한 표에 UTC/KST가 섞일 위험 — 실행 중이던 dev 서버의 옛 Prisma 클라이언트가 `now()`를 클라이언트에서 UTC로 채웠다).
    - ① 마이그레이션 `20261001170000_ops_log_utc_default_and_kst_views`(신규): 3개 표 `createdAt` 기본값 `CURRENT_TIMESTAMP`(UTC)로 복귀. `schema.prisma` 3곳 `@default(now())` + 주석 정리, `opsLogPurgeService.ts` +9시간 보정 제거, `tests/ops-log.test.ts`의 KST 확인 테스트를 "UTC 저장 + 뷰 +9h" 테스트로 교체하고 "뷰에 ORDER BY 없음" 테스트 1건 추가.
    - ② 로컬 KST 행 보정: **0건 → 생략**(읽기 전용 조회 — 세 표 최댓값 04:44 UTC, 조회 시각 05:00 UTC. KST 행이면 13시 이후 값이어야 함). 이 마이그레이션은 기본값만 바꿔 기존 행 값은 그대로.
    - ③ 읽기 전용 뷰 3개 `"AccessLog_kst"`·`"ErrorLog_kst"`·`"AdminAuditLog_kst"`: 원래 칸 전부(`t.*`) + `createdAtKst`(= `(createdAt AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Seoul'`). ORDER BY 없음. Prisma 모델 아님(마이그레이션 SQL로만).
    - DB: `backup-db.ps1 -Target local` → `local-20261001-140127.dump`(259.3KB, 파일 확인) → 사람 확인 → 로컬 `migrate deploy` → `migrate diff` **No difference** → 뷰 3개·기본값 `CURRENT_TIMESTAMP` 3개 조회 확인. 테스트 DB도 `test:db:migrate` 적용. `tsc --noEmit` 에러 0 · `npm test` **268 통과**. `prisma generate`는 이번에도 dev 서버가 DLL을 잡아 EPERM(타입·JS는 생성됨).
    - 🔴 **운영 미반영**(지시): `migrate-prod.ps1`·push 안 함. 운영에 `add_ops_logs` → `ops_log_kst_default` → `ops_log_utc_default_and_kst_views` 3개가 대기이며 순서대로 적용되면 최종 상태는 UTC 저장 + 뷰다(중간 KST 마이그레이션은 기본값만 바꾸고 운영엔 행이 없어 무해).
    - ⚠️ 뷰가 `t.*`로 만들어져 **표에 칸을 추가해도 뷰에는 안 보인다**(뷰를 `DROP`·재생성하는 마이그레이션 필요). 뷰가 참조하는 칸의 타입 변경·삭제는 뷰가 막는다. 시험이 끝나 확정되면 이 점을 알고 쓸 것.
    - 🟡 결정 대기(개발자): 시험 후 ① 뷰 방식 확정 → 운영 반영 ② 불필요하면 뷰만 삭제(`DROP VIEW`)하는 마이그레이션. `[Opus]`: 00-42 §5.2 ⑦(UTC 저장)은 이 결정으로 **원문 그대로 유지**된다.
  - **후속 5(10-01 개발자 명령 변경) — 🟡 시험 중·결정 대기: 뷰 대신 모든 표에 보기 전용 칸 `createdAtKst`.** 후속 4의 **③ 뷰는 이 칸으로 대체**됐다(①·② 저장 UTC 복귀·KST 행 0건은 후속 4 그대로).
    - 마이그레이션 `20261001180000_created_at_kst_column`(신규): 뷰 3개 `DROP` → **`createdAt`이 있는 26개 표 전부**에 `"createdAtKst" TIMESTAMP(3)` 추가 → 함수 `set_created_at_kst()` 1개(`NEW."createdAtKst" := NEW."createdAt" + interval '9 hours'`) → 표마다 `BEFORE INSERT OR UPDATE` 트리거 `"<표>_created_at_kst"` 26개 → 기존 행 전체 `UPDATE ... SET "createdAtKst" = "createdAt" + interval '9 hours'` 26문(🔴 DB 일괄 쓰기). 대상 표는 로컬 DB `information_schema`로 확인(26개 = 스키마의 `createdAt` 26줄; `createdAt` 없는 7개 표는 제외).
    - `schema.prisma`: 26개 모델에 `createdAtKst DateTime? @ignore`(주석 "보기 전용 · 트리거가 채움 · 코드에서 읽기·쓰기 금지"). 로그 3개 모델의 뷰 안내 주석은 칸 안내로 정리.
    - 🔵 **drift 확인**: `prisma migrate diff --from-schema-datasource ... --to-schema-datamodel ... --exit-code` → **No difference(exit 0)**(트리거·함수는 Prisma가 추적하지 않아 걸리지 않음, `@ignore` 칸은 스키마와 일치). 🟡 `migrate dev --create-only`는 돌리지 않음(shadow DB 생성이 필요하고 diff로 같은 판정이 나옴) — 필요하면 사람이 확인.
    - 🔴 **앱 비노출 검증**: 타입 정의(`index.d.ts`·`ScalarFieldEnum`)에는 이름이 **보인다**(Prisma 5.22 `@ignore`는 타입을 숨기지 않음) — 그러나 **쿼리 결과에는 안 나온다**(`create`·`findUnique`·`findMany` 결과 키에 없음, `tests/created-at-kst.test.ts`로 고정). 그래서 API가 행을 통째로 돌려줘도 새지 않는다. `select`에 쓰면 컴파일은 되므로 `src/`·`frontend/src/` 사용 0건을 테스트로 지킨다(현재 0건).
    - 신규 테스트 `tests/created-at-kst.test.ts`(5건, `npm test`에 추가): ① `createdAt` 있는 표 전부에 칸(timestamp(3))·트리거가 있다(새 표에서 빠뜨리면 표 이름을 대며 실패) ② INSERT·`createdAt` UPDATE 때 +9h ③ 다른 칸만 UPDATE해도 안 틀어짐 ④ Prisma 결과에 칸 없음 ⑤ 코드 사용 0건. `tests/ops-log.test.ts`의 뷰 테스트 2건은 "UTC 저장 + 칸 +9h" 1건으로 교체.
    - 규칙 ④: `.harness/systems.md` §4에 "새 표에 `createdAt`이 있으면 칸+트리거를 같이" 한 줄.
    - DB: `backup-db.ps1 -Target local` → `local-20261001-140716.dump`(262KB, 파일 확인) → 사람 확인 → 로컬 `migrate deploy` → 확인: 칸 26·트리거 26·남은 뷰 0, 표별 NULL·9시간 차이 오류 0건(Facility 2,024행·User 6·AdminAuditLog 31·AccessLog 78). 테스트 DB도 `test:db:migrate` 적용. `tsc --noEmit` 에러 0 · `npm test` **272 통과**. `prisma generate`는 이번에도 dev 서버가 DLL을 잡아 EPERM(타입·JS는 생성됨 — 위 비노출 검증은 이 상태에서 통과).
    - 🔴 **운영 미반영**(지시): `migrate-prod.ps1`·push 안 함. 운영에는 4개(`add_ops_logs` → `ops_log_kst_default` → `ops_log_utc_default_and_kst_views` → `created_at_kst_column`)가 대기. 마지막이 **운영 전 표 26개 일괄 UPDATE**(Facility 등)라 `migrate-prod.ps1`의 백업이 선행돼야 한다. 최종 상태는 UTC 저장 + 보기 칸이다.
    - ⚠️ 알아둘 것: ① 모든 UPDATE마다 트리거가 돈다(행당 덧셈 한 번 — 무시 가능). ② 뷰가 없어져 앞서 안내한 `_kst` 뷰 조회는 더 안 된다 → 시험은 `"createdAt"`·`"createdAtKst"` 칸으로. ③ `createdAt`을 쓰는 새 표가 생기면 칸+트리거 필수(위 규칙).
    - 🟡 결정 대기(개발자): 시험 후 확정 → 운영 반영 / 불필요하면 칸·트리거·함수 삭제 마이그레이션.
  - **후속 6(10-01 개발자 요청) — 🟡 시험 중·결정 대기: `createdAtKst`의 `@ignore` 제거(Prisma Studio에서 보이게).** 후속 5의 `@ignore` 설계와 "쿼리 결과에 안 나온다" 검증을 **대체**한다.
    - eobomDev/backend/prisma/schema.prisma — 26개 모델 `createdAtKst DateTime? @ignore` → `DateTime?`(주석 "보기 전용 · DB 트리거가 채움 · 🔴 코드에서 읽기·쓰기 금지(트리거가 쓰기를 덮어씀)"). DB·마이그레이션 변경 없음(스키마 파일만).
    - eobomDev/backend/tests/created-at-kst.test.ts — "쿼리 결과에 칸이 안 나온다" 테스트를 **"코드가 `createdAtKst`에 다른 값(2000-01-01)을 넣어도 트리거 값(`createdAt`+9시간)이 남는다(create·update 모두)"** 로 교체. "코드 사용 0건" 검사(`src/`·`frontend/src/`)는 유지.
    - drift: `prisma migrate dev --create-only`(백업 `local-20261001-141344.dump` 선행, 메인 DB엔 쓰지 않음)가 만든 마이그레이션 본문이 `-- This is an empty migration.` 한 줄 → **diff 비어 있음**. 시험용 폴더는 적용 전에 삭제, `migrate status` = "Database schema is up to date!"(41개).
    - 검증: `tsc --noEmit` 에러 0 · `npm test` **272 통과**. `prisma generate`는 이번에도 dev 서버가 DLL을 잡아 EPERM(JS·타입은 갱신됨 — 위 새 테스트가 `createdAtKst`를 넣을 수 있는 것으로 확인).
    - 🔴 **응답 노출 점검(목록만 — 고칠지는 사람 결정).** `@ignore`를 빼면서 Prisma가 `createdAtKst`를 **기본으로 같이 읽는다**(`select` 없는 호출 128건). 그중 **그 행을 통째로(또는 `...` 펼쳐서) `res.json`으로 내보내는 곳**은 코드로 확인한 것만:
      1. `facilityController.ts` — `getFacilities`(위치 있음·없음 2경로), `getFacilityById`, `createReview`(작성 후 시설 재조회). **공개 API**이고 `...rest` 펼침이라 시설 + 중첩 `reviews[]`(리뷰 행에도 칸이 있음)까지 나간다.
      2. `claimController.ts` — 시설 연동 신청 2곳(`data: claim`), 거절 처리(`data: updated`). (승인 경로 L145-146은 응답 형태 미확인)
      3. `expertController.ts` — `serializeConsultRequestForExpert`가 행을 그대로 펼쳐 돌려줌 → `getMyConsultRequests`·`updateConsultStatus` 응답.
      4. `memorialController.ts` — 추모관 개설(`data: memorial`)·내 추모관 목록·수정, 방명록 작성(`data: entry`), 사진 등록(`data: photo`).
      - **안전(화이트리스트 변환 거침)**: `serializeExpert`·`serializePartner`·가족 지정 `serialize`·`safeLead`·`safeConsultRequest`·`serializePartnerLead`, 로그인 응답의 `user`(수동 조립).
      - **미확인(정적 점검 한계)**: `obituaryController`·`endingNoteController`·`meActivityController`·`moderationController`·`adminController` 등 — `select` 없는 호출은 있으나 응답 직결 여부를 코드로 확정하지 못함(`res.json({ data })`가 변수를 거쳐 나가는 경우). 필요하면 실제 호출로 응답 키를 검사하는 시험을 별도로 만든다.
      - 값은 `createdAt`+9시간 한국 시각(ISO 문자열 `…Z` 표기)이라 개인정보는 아니지만, **`Z`가 붙어 UTC로 오해될 수 있고 화면에서 `createdAt` 대신 쓰면 9시간이 어긋난다**. 프론트(`frontend/src/`)가 쓰는 코드는 0건.
      - 대응 후보(사람 결정): ① 그대로 둔다(노이즈 허용) ② 응답 직전에 빼는 공용 함수/미들웨어(`res.json`을 감싸 `createdAtKst` 키 제거) ③ Prisma `omit`(5.13+ 미리보기 기능) 전역 설정 ④ 위 호출마다 `select`. ②가 가장 작고 안전하다.
    - 🔴 운영 미반영(지시 그대로). 운영 대기는 후속 5와 같은 4개 마이그레이션.
    - 🟡 사람 확인 요청: Prisma Studio를 **껐다 켜서**(`npm run studio` — 스키마를 시작할 때 읽는다) 아무 표에서 `createdAtKst`가 보이는지.
  - **후속 7(10-01 개발자 결정) — 응답 노출 대응 ②: 전 응답에서 `createdAtKst` 제거.** 위 후속 6의 노출 목록을 컨트롤러별로 고치지 않고 한 곳에서 막는다(컨트롤러별 응답 시험은 생략 — 개발자 결정).
    - eobomDev/backend/src/app.ts — `app.set('json replacer', (key, value) => key === 'createdAtKst' ? undefined : value)` 한 줄(+주석). Express의 `json replacer`는 **모든 `res.json`에 적용되고 중첩 객체·배열(시설 → `reviews[]` 등)까지** 덮는다. 컨트롤러·`res.json` 호출부 무수정. 한계: `res.json`을 거치지 않는 응답(`res.send(문자열)`·파일 전송)은 대상 아님 — 현재 그런 곳에서 모델 행을 내보내는 곳은 없다.
    - eobomDev/backend/tests/created-at-kst.test.ts — 테스트 1개 추가: **시설(+리뷰)을 만들어 `GET /api/facilities?q=`·`GET /api/facilities/:id` 응답 본문에 `createdAtKst` 문자열이 없는지**(공개 API가 행을 `...`로 통째로 내보내는 대표 경로 + 중첩 리뷰). 전제(Prisma가 읽은 행에는 칸이 실제로 있고 응답에는 `createdAt`이 있음)도 같이 단언해 공허한 통과를 막는다. "코드 사용 0건" 검사의 허용 목록은 `src/app.ts` 하나(읽거나 쓰는 코드가 아니라 **빼는** 코드).
    - 🔵 시험이 실제로 잡는지 확인: `app.ts`의 replacer 줄을 잠깐 끄고 돌리면 `시설 목록 응답에 createdAtKst가 있다`로 **실패**, 복구하면 통과(끈 줄은 복구 확인 — `TEMP-OFF` 0건).
    - 검증: `tsc --noEmit` 에러 0 · `npm test` **273 통과**(272+1). DB·마이그레이션 변경 없음. 운영 미반영(지시 그대로).
    - ⚠️ 알아둘 것: 이 설정은 앱 전체의 `res.json`에 걸린다 — **응답 키 이름이 `createdAtKst`면 무엇이든 빠진다**(나중에 일부러 이 이름의 필드를 응답에 담을 일은 없어야 한다). 후속 6의 "미확인 컨트롤러"도 같은 장치로 덮인다.
  - **후속 8(10-01 개발자 요청) — 🟡 시험 중·결정 대기: `updatedAt`이 있는 모든 표에 `updatedAtKst`(후속 5~7과 같은 방식).** 근거 커밋 3e2f435·9d29b07·85df32e.
    - 마이그레이션 `20261001190000_updated_at_kst_column`(신규): **`updatedAt`이 있는 14개 표**(Admin·ConsultRequest·EndingNote·EndingNoteEntry·EndingNoteGrant·Expert·Facility·FamilyDesignation·FarewellMessage·Lead·Memorial·Obituary·Partner·User — 로컬 `information_schema` 조회 = 스키마의 `updatedAt` 14줄)에 `"updatedAtKst" TIMESTAMP(3)` 추가 → 함수 `set_updated_at_kst()`(`NEW."updatedAtKst" := NEW."updatedAt" + interval '9 hours'`) → 표마다 `BEFORE INSERT OR UPDATE` 트리거 `"<표>_updated_at_kst"` 14개 → 기존 행 전체 `UPDATE ... SET "updatedAtKst" = "updatedAt" + interval '9 hours'` 14문(🔴 일괄 쓰기). 기존 `createdAtKst` 트리거와 별개 함수·별개 트리거라 서로 간섭하지 않는다.
    - 🟡 **범위 밖(이름이 `updatedAt`이 아님)**: `Obituary.cardFieldsUpdatedAt`·`User.profileUpdatedAt` — 같은 칸을 붙이지 않았다. 필요하면 별도 지시.
    - eobomDev/backend/prisma/schema.prisma — 14개 모델에 `updatedAtKst DateTime?`(`@ignore` 없음 + "보기 전용 · 트리거가 채움 · 코드에서 읽기·쓰기 금지" 주석).
    - eobomDev/backend/src/app.ts — `json replacer`를 `HIDDEN_RESPONSE_KEYS = {createdAtKst, updatedAtKst}` 집합으로 확장(컨트롤러 무수정).
    - 테스트: 신규 `tests/updated-at-kst.test.ts`(5건, `npm test`에 추가) — ① `updatedAt` 있는 표 전부에 칸(timestamp(3))·트리거(새 표에서 빠뜨리면 표 이름을 대며 실패) ② INSERT 때 +9h ③ **Prisma `update`가 `updatedAt`을 새로 찍으면 `updatedAtKst`도 그 값+9h로 따라간다**(갱신 확인 포함 — 트리거가 Prisma가 넣은 새 `updatedAt` 뒤에 도는지) ④ SQL로 `updatedAt`을 바꿔도 따라감 ⑤ 코드가 다른 값을 넣어도 트리거 값이 남음(create·update). 수정 `tests/created-at-kst.test.ts` — 시설 응답 시험에 `updatedAtKst` 단언 추가(전제: 읽은 행에 칸이 있고 응답에 `updatedAt`이 있음), "코드 사용 0건" 검사를 두 칸으로 확장(허용은 `src/app.ts` 하나).
    - 🔵 시험이 잡는지 확인: replacer 집합에서 `updatedAtKst`만 잠깐 빼고 돌리면 `시설 목록 응답에 updatedAtKst가 있다`로 **실패**, 복구하면 통과(`TEMP-OFF` 0건).
    - `.harness/systems.md` §4 — 새 표 규칙을 `createdAtKst`·`updatedAtKst` 둘 다로 확장하고, **이미 틀려 있던 `@ignore` 안내를 바로잡음**(Studio에서 보이게 `@ignore` 없음, 응답에선 `app.ts` replacer가 뺌).
    - DB: `backup-db.ps1 -Target local` → `local-20261001-143256.dump`(287.5KB, 파일 확인) → 사람 확인 → 로컬 `migrate deploy` → 확인: 칸 14·`_updated_at_kst` 트리거 14(기존 `_created_at_kst` 26 그대로), 표별 NULL·9시간 오류 0건(Facility 2,024행·User 6·Admin 1, `createdAtKst`도 그대로 정상), **`updatedAt` 값은 백필 전후 그대로**(User `01:50:29` 유지). 테스트 DB도 `test:db:migrate` 적용.
    - drift: `migrate dev --create-only`(백업 선행) 본문이 `-- This is an empty migration.` 한 줄 → **diff 비어 있음**, 시험용 폴더 삭제, `migrate status` = "up to date"(42개).
    - 검증: `tsc --noEmit` 에러 0 · `npm test` **278 통과**(273+5). `prisma generate`는 이번에도 dev 서버가 DLL을 잡아 EPERM(JS·타입은 갱신됨).
    - 🔴 **운영 미반영**(지시). 이 커밋이 들어가면 운영 대기 마이그레이션은 **5개**(`add_ops_logs` → `ops_log_kst_default` → `ops_log_utc_default_and_kst_views` → `created_at_kst_column` → `updated_at_kst_column`). 마지막 둘이 운영 전 표 일괄 UPDATE(26표 + 14표)라 `migrate-prod.ps1` 백업이 선행돼야 한다. 반영 순서: 커밋 → `migrate-prod.ps1` → push.
    - ⚠️ 알아둘 것: ① 같은 표에 `UPDATE`가 나면 트리거 2개(created·updated)가 돈다(행당 덧셈 2번 — 무시 가능). ② 응답 키 이름이 `createdAtKst`·`updatedAtKst`면 무엇이든 빠진다.

<!-- Gemini 판정 1줄: 🔄스펙갱신 (AccessLog/ErrorLog/AdminAuditLog 미들웨어 자동화 및 KST 컬럼/트리거 체계 구축 통과 / 00-42에 보존기간 및 KST 트리거 방식 갱신) -->

## 2026-10-01 | 00-42 §10 — CORS 허용 목록 + 요청 횟수 제한 (공개 전)

- **근거 스펙**: docs/00_핵심플랫폼/00-42_운영_기록_로그_설계서.md §10(별건: CORS `origin:true`·요청 횟수 제한 없음) · 10-01 개발자 결정(지시문)
- **건드린 파일**(전수): eobomDev/backend/src/config/cors.ts(신규), eobomDev/backend/src/middleware/rateLimit.ts(신규), eobomDev/backend/src/app.ts(`cors(buildCorsOptions())`·`installRateLimits(app)`·`/uploads`를 제한보다 앞으로), eobomDev/backend/tests/cors-ratelimit.test.ts(신규 18건), eobomDev/backend/tests/helpers/testEnv.ts(`RATE_LIMIT_DISABLED`), eobomDev/backend/package.json·package-lock.json(`express-rate-limit ^8.7.0` 추가, `npm test`에 신규 파일), eobomDev/backend/.env.example(`CORS_ORIGINS` 안내), .harness/systems.md §5(CORS·제한 두 줄)
- **결과**:
  - ① CORS: 허용 목록 = `https://eobom.vercel.app` + `localhost`·`127.0.0.1`의 5173(http·https). 환경변수 `CORS_ORIGINS`(쉼표)가 있으면 기본 목록을 **대체**. 허용 안 된 출처엔 `Access-Control-Allow-*`를 주지 않는다(에러를 던지지 않음 — 서버는 응답하고 읽기는 브라우저가 막음). `exposedHeaders: ['X-Request-Id']`·`credentials: true` 유지. Origin 헤더 없는 요청(서버 간·주소창)은 통과.
  - ② 제한(같은 IP · `trust proxy 1`로 실제 IP · 메모리 저장 · 1분 창): **공개 쓰기 10** · **로그인·갱신 20** · **그 밖 전체 300**. `/api/health` 제외, CORS 사전요청(OPTIONS)은 세지 않음. 초과 시 `429` + `{status:'error', message:'잠시 후 다시 시도해 주세요.', requestId}` + `Retry-After`. 순서: requestId → accessLog → **cors** → `/uploads`(제한 밖) → **제한** → body 파싱 — 그래서 429도 접속기록에 실패로 남고(시험으로 확인) 429에도 CORS 헤더가 붙는다.
  - **대상 경로(실제 `routes/*.ts`의 POST를 보고 정함)**: 🔹공개 쓰기 10 = `POST /api/memorials/:slug/tributes`(헌화) · `/:slug/guestbook`(로그인 필수지만 공개 주소) · `/api/experts/:id/consult-requests` · `/api/facilities/:id/quotes` · `/:id/call-events` · `/api/obituaries/:slug/share` · `/api/family-designations/invite/:token/accept`·`/decline` · `/api/partner/signup` · `/api/expert/signup`. 🔹로그인·갱신 20 = `/api/admin|partner|expert/login`·`/refresh` 6개 + `/api/auth/confirm-link`·`/api/auth/demo-login`. 🔹그 밖의 POST·PATCH·DELETE는 전부 토큰(회원·사업자·전문가·운영자) 필요 경로라 전체 300에 포함.
  - 검증: `tsc --noEmit` 에러 0 · `npm test` **296 통과**(278 + 18). 시험 내용: 허용·비허용·Origin 없음·사전요청·LAN(5173만)·운영 설정(LAN 차단)·`CORS_ORIGINS` 파싱 / 공개 쓰기 11번째 429·IP별 분리·주소 합산 / 로그인 21번째 429 / 전체 301번째 429 + health는 그 뒤에도 200 / 429에 CORS 헤더 / 접속기록 status 429. 🔵 잡는지 확인: CORS를 `origin:true`로, 제한 설치를 꺼서 돌리면 **11건 실패**, 복구하면 통과(`TEMP-OFF` 0건).
- **편차**:
  1. 🔴 **비운영(개발·테스트)에서는 사설망 IP(192.168.x·10.x·172.16~31.x)의 5173 포트도 허용** — 지시는 "localhost 개발 포트"뿐이었는데 폰으로 LAN IP에 접속해 시험하는 흐름(`authController.captureFrontendOrigin`이 이미 지원)이 깨져서 추가. 운영(`NODE_ENV=production`)은 목록만 본다(시험으로 고정).
  2. 공개 쓰기 한도는 **주소별이 아니라 IP당 합산**(지시 "분당 10"을 그대로 읽음) — 헌화로 다 쓰면 시설 문의도 막힌다.
  3. `/uploads` 정적 서빙을 제한보다 앞으로 옮김(이미지 여러 장 로딩이 분당 300을 쓰지 않게) — 순서만 바뀌고 동작은 같음.
  4. 시험 전용 스위치 `RATE_LIMIT_DISABLED=true`(`NODE_ENV=test`일 때만 인정, `testEnv.ts`가 기본으로 켬) — 다른 시험들이 같은 IP로 수십 번 요청해 한도에 걸리는 것을 막고, 제한 시험만 이 값을 지우고 실제 앱을 쓴다.
- **다음 에이전트가 알아야 할 것**:
  - 🔴 **스키마 변경 없음 → 운영 반영은 push만.** `npm ci`가 `package-lock.json`의 새 의존성(`express-rate-limit`)을 설치하니 **lock 파일도 같이 커밋**해야 한다.
  - 🟡 **Render 환경변수는 선택**: `CORS_ORIGINS`를 안 넣어도 기본값(운영 프론트 + localhost)으로 동작. **운영에서 localhost까지 막으려면** 대시보드에 `CORS_ORIGINS=https://eobom.vercel.app`. 기존 서비스는 Blueprint 값이 자동 반영되지 않아 `render.yaml`엔 안 넣었다(비밀값 아님).
  - ⚠️ **Vercel 미리보기 주소(`eobom-xxxx.vercel.app`)와 새 도메인은 막힌다** — 그쪽에서 API를 부르려면 `CORS_ORIGINS`에 추가. 🟡 실기동(사람): 배포 프론트에서 로그인·방명록·문의가 막히지 않는지, 로컬에서 LAN 폰 접속이 되는지.
  - ⚠️ 한도 값은 **느낌으로 정한 지시값**이라 실사용 패턴과 안 맞을 수 있다 — 전화 버튼(`call-events`)을 한 분에 10번 넘게 누르는 정상 사용은 드물다고 보고 같은 묶음에 넣었다. 로컬 시험 중 429가 나면 1분 기다리거나 서버 재시작(메모리 저장).
  - 새 공개 POST를 만들면 `middleware/rateLimit.ts`의 `PUBLIC_WRITE_ROUTES`에 올려야 한다(안 올리면 전체 300만 적용) — 자동 감시는 없다.
  - `00-42` §10 별건 둘이 해소됨 → `[Opus]` 문서 반영 대상(`docs/` 미수정).
  - 커밋은 하지 않음 — 메시지 초안만.

<!-- Gemini 판정 1줄: 🔄스펙갱신 (CORS_ORIGINS 화이트리스트 및 분당 레이트리밋(쓰기10/로그인20/전체300) 구현 통과 / 00-42 §10 해소 사항 반영) -->

## 2026-10-01 | 홈 마지막 섹션 — 파트너 로그인 링크 세로 위치를 추모관 링크 버튼과 맞춤

- **근거 스펙**: 스펙 없음 → 즉흥 구현(개발자 요청: 운영 폰 실측에서 "추모관 링크로 입장"과 "파트너 로그인" 높이가 다름 — 전에는 맞았음)
- **건드린 파일**: eobomDev/frontend/src/components/home/HomeMobile.tsx(L307 `PageLink` style), eobomDev/frontend/src/components/home/HomeDesktop.tsx(L341 `PageLink` style)
- **결과**: 두 `PageLink` style에 `display: 'inline-flex', alignItems: 'center'` 추가. 원인(코드 읽기 기준): 파트너 로그인은 09-29 00-34 §2.4로 `<button>`→`PageLink`(`<a>`)가 됐고, 같은 `minHeight: 44px` 안에서 `<button>`은 글자가 가운데에 놓이는데 `<a>`는 위에 붙어 높이가 어긋남(Desktop은 minHeight가 없어 차이가 작지만 같은 방식으로 맞춤). `tsc --noEmit` 에러 0.
- **편차**: 없음(스펙 없음). 🔴 **화면 실측은 하지 않았다** — dev 서버를 띄우지 않았고 원인은 코드 읽기로 판단. 안 맞으면 원인이 다른 것.
- **다음 에이전트가 알아야 할 것**:
  - 🟡 실기동(사람, 운영 폰): 마지막 섹션에서 두 글자의 높이가 같은지. 같은 회귀가 `PageLink`로 바뀐 다른 `<button>` 자리에도 있을 수 있다(`minHeight`·`padding` 있는 곳) — 이번엔 이 두 곳만 고침.
  - 커밋은 하지 않음 — 메시지 초안만.

<!-- Gemini 판정 1줄: ✅통과 (HomeMobile/HomeDesktop 파트너 로그인 PageLink 인라인 플렉스 수직 정렬 보정 확인) -->
## 2026-10-02 | 사망 확인 대외 처리시간 12시간 → 운영시간 기준 6시간

- **근거 스펙**: docs 00-41 §5.1·§8.1 (10-02 개발자 변경, 핸드오프 프롬프트)
- **건드린 파일**: eobomDev/backend/src/utils/operatingHours.ts, eobomDev/backend/src/utils/operatingHours.test.ts, eobomDev/frontend/src/components/familyShared/ReleaseRequestModal.tsx
- **결과**: `DUE_OPERATING_MINUTES = 12 * 60` → `6 * 60`(내부 목표 `TARGET_OPERATING_MINUTES = 60` 유지). 안내 문구 `운영시간 기준 12시간 안에` → `운영시간 기준 6시간 안에`, 파일 상단 주석 `·12시간은 서버` → `·6시간은 서버`. 대시보드 빨강(`overDue`)은 `dueAt` 비교라 상수 변경으로 자동 반영(별도 수정 없음). 테스트 기대값 갱신: 금 16시(11-06) → 월 14시(11-09) · 월 10시 → 월 16시 · 토 20시 접수 due 월 15시 · 공휴일 금 16시(10-02, 10-05 휴무) → 화 10-06 14시 · 추석 수 9/23 16시 → 월 9/28 14시. `node --test`(tsx)로 operatingHours.test.ts 8건 통과. `12시간|12h` 재검색 잔존 3건은 JWT 만료(authController.ts)로 무관.
- **편차**: 없음. backend `tsc --noEmit` 에러 0. `npm test` 전체·frontend tsc·vite build는 돌리지 않았다(operatingHours.test.ts 단독만).
- **다음 에이전트가 알아야 할 것**:
  - 🟡 이미 접수된 REQUESTED 건의 `dueAt`은 DB에 저장된 값이라 12h 기준 그대로 — 소급 재계산은 하지 않음(필요하면 사람 결정).
  - 🟡 00-41 문서 본문의 "12h" 표기 정정은 Opus 몫(커밋 6a718e5에서 처리된 것으로 보임, 확인 필요).
  - 커밋은 하지 않음 — 메시지 초안만.

<!-- Gemini 판정 1줄: 🔄스펙갱신 (사망 확인 대외 처리 기준 DUE_OPERATING_MINUTES 6시간 단축 및 안내문구 변경 통과 / 00-41 12h 잔존 서술 정정) -->
## 2026-10-02 | 녹음 경로에도 STT 필수 동의 체크 (10-02 개발자 결정)

- **근거 스펙**: docs 06-04 §6.4-11-6 (CLOVA 약관 부분동의 불가 → 이용자 동의 필요), 핸드오프 프롬프트 2)
- **건드린 파일**: eobomDev/frontend/src/components/farewell/VoiceToTextInput.tsx (1개)
- **결과**: `recordConsent` state 추가. mode="record"에서 `recordingSupported`일 때 업로드(`voice-upload-consent`)와 같은 문구의 필수 체크 `voice-record-consent` 표시("음성 파일이 네이버 클라우드 CLOVA Speech로 전송되며, 네이버의 음성인식 성능 향상에 활용될 수 있습니다. 변환된 텍스트는 네이버에 7일간 보관된 뒤 삭제됩니다." + 목소리 보관 여부 문장). 미체크 시 "음성 녹음" 버튼 disabled, `startRecording`·`confirmSavePending`도 `!recordConsent`면 return(저장 불가). 저장 성공 시 `setRecordConsent(false)`(업로드 경로의 `setUploadConsent(false)`와 동일). 직접 입력 입력창은 건드리지 않아 항상 열려 있음. frontend `tsc --noEmit` 에러 0.
- **편차**: 🔴 "동의 기록 저장 방식은 업로드와 같게" — 업로드 경로는 서버에 동의를 기록하지 않고 **클라이언트 체크 게이트만**(`uploadConsent`, 백엔드 stt 파일에 consent 없음, grep 0건). 같은 방식으로 클라이언트 게이트만 구현. 서버 기록은 안 함.
- **다음 에이전트가 알아야 할 것**:
  - 🟡 서버 측 동의 기록(공개 전 코드 묶음 "STT 동의기록")은 업로드·녹음 공통으로 아직 없음 — 그 묶음에서 양쪽 함께 처리.
  - 🟡 실기동(사람): 체크 전 녹음 버튼 비활성 · 체크 후 녹음→저장 · 저장 후 체크 해제 확인. 첫 1회 안내 오버레이(L472~475)는 그대로 둠(동의 체크와 문구 일부 중복). dev 서버는 띄우지 않음.
  - 커밋은 하지 않음 — 메시지 초안만.

<!-- Gemini 판정 1줄: ✅통과 (음성 녹음 탭 내 CLOVA Speech 전송/이용 필수 동의 체크 게이트 일관 적용 확인) -->
## 2026-10-02 | 탈퇴 유예 중 새 자료 생성 서버 차단 + 유품 수거 화면 상속 협의 안내

- **근거 스펙**: docs 00-36 §4.3-1(유예 중 생성 403) · 03-02 §6.2 · 00-14 §4-2(유품 = 상속재산, 민법 제1026조 제1호). 핸드오프 프롬프트 2건.
- **건드린 파일**: eobomDev/backend/src/middleware/blockDuringDeletionGrace.ts(신규), eobomDev/backend/src/routes/obituaryRoutes.ts, memorialRoutes.ts, endingNoteRoutes.ts, farewellMessageRoutes.ts, expertPublicRoutes.ts, familyDesignationRoutes.ts, eobomDev/backend/tests/deletion-grace-guard.test.ts(신규), eobomDev/backend/package.json(test 스크립트에 새 테스트 추가), eobomDev/frontend/src/pages/PickupPage.tsx
- **결과**:
  1) 공통 미들웨어 `blockDuringDeletionGrace` — 유효한 B2C 토큰의 `User`가 `purgedAt: null` 이고 `deletionRequestedAt != null`이면 403 `탈퇴 신청 상태에서는 새로 만들거나 신청할 수 없습니다. 탈퇴를 취소하시면 다시 이용하실 수 있습니다.` 토큰 없음·무효·파기 완료(purgedAt)는 그대로 넘겨 컨트롤러의 기존 401을 유지. 붙인 7곳: `POST /api/obituaries` · `POST /api/memorials` · `POST /api/memorials/:slug/guestbook` · `PUT /api/ending-note/sections/:section` · `POST /api/farewell-messages` · `POST /api/experts/:id/consult-requests` · `POST /api/family-designations`. 조회·탈퇴 취소·반출·로그아웃에는 안 붙임. 테스트 `tests/deletion-grace-guard.test.ts` 11건(유예 중 7경로 403 · 조회 비차단 · `/api/auth/me` 유예 필드 유지 · 정상 회원 비차단 · 취소 후 해제 · purgedAt 비차단 · 무토큰 401). 실행: `cd eobomDev/backend && npm test`(309건 통과), `npx tsc --noEmit` backend·frontend 에러 0.
  2) PickupPage.tsx — 업체 카드 목록 위(`LocationSearchBox` 다음)에 `<p className="v2-notice-warn">` 추가. 문구 원문: `유품은 상속재산입니다. 상속인 사이의 분할 협의가 끝나기 전에 처분하면 상속인 간 분쟁이 생길 수 있습니다. 상속재산을 처분하면 단순승인으로 간주될 수 있으며(민법 제1026조 제1호), 이 경우 고인의 채무를 그대로 이어받게 됩니다. 상속포기·한정승인을 고려 중이시라면 유품 처분 전에 확인이 필요합니다.` 체크리스트(`mockData/careGuideTasks.json:55`)의 "단순승인으로 간주"에 표현을 맞춤. 막지는 않고 항상 표시.
- **편차**: 
  - 스펙 목록의 "엔딩노트 작성"을 `PUT /api/ending-note/sections/:section`(섹션 저장)으로 해석하고, 같은 06 영역인 유족 메시지(편지) 생성 `POST /api/farewell-messages`도 포함(파기 시 새 편지가 사라지는 건 같은 사정). 스펙에 편지가 명시돼 있지 않음 — 빼려면 farewellMessageRoutes.ts 한 줄.
  - 처리 안 한 것: 견적 요청 `POST /api/facilities/:id/quotes`(비회원 허용), 헌화 `POST /api/memorials/:slug/tributes`(비회원), 엔딩노트 열람 권한 `PUT /api/ending-note/grants`, 추모관 사진 추가 `POST /api/memorials/:id/photos`(탈퇴 시 추모관이 closedAt으로 닫혀 있음). 스펙의 6종 목록에 없어 넣지 않음.
  - PickupPage는 현재 예시 업체 화면이고 실제 신청 폼이 없어, 신청 모달이 아니라 목록 위에 둠(03-02 §6.2 "요청 화면에 게이트 1개"와 같은 취지). 법률 문구의 최종 확인은 사람 몫.
- **다음 에이전트가 알아야 할 것**:
  - 🟡 실기동(사람): 유예 중 계정으로 위 7곳 시도 시 화면이 403 메시지를 어떻게 보이는지 — 프런트는 이 403 문구를 별도 처리하지 않음(각 화면의 일반 오류 처리 그대로). 필요하면 화면 쪽 안내 보강은 별도 건.
  - 🟡 PickupPage 문구는 03-02 §6.2가 "유언·상속 기능과 함께 조건부 게이트로 설계"로 넘긴 것의 임시 1줄 — 조건부 게이트가 서면 교체.
  - 커밋은 하지 않음 — 메시지 초안만.

<!-- Gemini 판정 1줄: ✅통과 (탈퇴 유예 계정 주요 7개 생성 API 403 차단 미들웨어 및 PickupPage 상속재산 단순승인 주의 경고문 배치 확인) -->
## 2026-10-02 | 공휴일 코드 목록 삭제 + 유족 화면 완료 예정 시각 삭제 (00-41 §5.1·§8.2) · R2 정비 2건 확인

- **근거 스펙**: docs 00-41 §5.1·§8.2(10-02 개발자 변경②). 3·4번(R2 정비)은 00-11 §5.4-6-3 · §5.4-5-2-1-1 보정②.
- **건드린 파일**: eobomDev/backend/src/utils/operatingHours.ts, eobomDev/backend/src/utils/operatingHours.test.ts, eobomDev/frontend/src/pages/FamilySharedPage.tsx. 3·4번은 파일을 건드리지 않음(아래).
- **결과**:
  - 삭제: `HOLIDAYS`(`ReadonlySet`, 2026년 13일분)·`HOLIDAYS_COVERED_THROUGH`·`ymd()` 헬퍼, `isOperatingDay`의 `!HOLIDAYS.has(...)` 조건. 에러 문구 `HOLIDAYS 목록을 확인하세요` → `OPERATING_HOURS.workdays를 확인하세요`. 주석을 "공휴일은 코드에 두지 않는다(00-41 §5.1)"로 교체. `git grep HOLIDAYS`(eobomDev) 0건.
  - 테스트 갱신: 공휴일 건너뛰기·추석 연휴 2건을 "공휴일을 건너뛰지 않는다"로 뒤집음 — 금 10-02 16시 → 월 10-05 14시, 수 9-23 16시 → 목 9-24 14시. 주말 건너뛰기 1건 추가(일 11-08 12시 → 월 11-09 15시).
  - 유족 화면: FamilySharedPage.tsx `{formatDateTime(req.dueAt)}까지 확인합니다.` 삭제 → `…요청했습니다. {접수 시각} 접수`로 끝남. `MyReleaseRequest` 인터페이스의 `dueAt: string` 필드 삭제. `ReleaseRequestModal.tsx` §8.1 안내 문구는 그대로 유지. 운영자 대시보드 지연 색(`overTarget`·`overDue`)은 안 건드림.
  - 검증: `cd eobomDev/backend && npm test` 310건 통과 · `npx tsc --noEmit` backend·frontend 에러 0.
  - **3번(`.env.example` R2_BUCKET_* `-dev`)·4번(Worker `CompleteMultipartUpload` 복제)은 이미 반영돼 있어 할 일이 없었다** — 커밋 `759cc94`(2026-09-30)에 들어 있음: `.env.example` L90~92가 `eobom-farewell-voice-dev` · `eobom-memorial-media-dev` · `eobom-biz-docs-dev`, `workers/r2-archive-relay/src/index.ts`가 `COPY_ACTIONS = new Set(['PutObject', 'CopyObject', 'CompleteMultipartUpload'])`. docs 00-11 L44~46·L468이 "미반영"이라 적은 것은 낡은 서술. Worker 배포는 하지 않음.
- **편차**: 스펙 §8.2 표(REQUESTED 행)는 "접수 시각 · 안내 문구(§8.1) · [요청 취소]"인데 REQUESTED 상태 줄에는 §8.1 안내 문구가 없다(요청 모달에만 있음). 요청대로 시각 부분만 삭제했고 안내 문구를 이 줄에 추가하지는 않았다.
- **다음 에이전트가 알아야 할 것**:
  - 🟡 서버 응답은 유족용 API에도 `dueAt`을 계속 싣는다(`deathVerificationController.ts` L61·L76 직렬화·select). 화면에는 안 나오지만 응답에서 빼려면 별도 변경.
  - 🟡 운영자 화면 문구 `대외 마감 {dueAt}`(AdminPage.tsx L1266)과 컨트롤러 주석 "대외 약속(dueAt)"(deathVerificationAdminController.ts L44)은 00-41 변경(6시간 = 내부 처리 기준)과 표현이 어긋남 — 이번엔 안 고침.
  - 🟡 공휴일에 걸린 건은 대시보드에서 노랑·빨강으로 보일 수 있다(스펙상 정상).
  - 🟡 실기동(사람): 유족 화면 REQUESTED 줄에 시각 문구가 안 나오는지.
  - 사람이 이후 Render에 `R2_ENABLED=true` 등 VOICE 변수 6개 설정.
  - 커밋은 하지 않음 — 메시지 초안만.

<!-- Gemini 판정 1줄: 🔄스펙갱신 (HOLIDAYS 하드코딩 제거 및 유족 화면 dueAt 표시 삭제 통과 / 00-41 및 00-11 R2 Worker 미반영 낡은 서술 정정) -->
## 2026-10-02 | 유족용 사망 확인 응답에서 dueAt 제거 (개발자 결정, 00-41 §8.2 후속)

- **근거 스펙**: docs 00-41 §5.1·§8.2(유족 화면에 처리 기준 시각을 보여 주지 않는다) · 개발자 10-02 "유족 응답에 dueAt이 필요하지 않다면 뺀다". 직전 항목 "공휴일 코드 목록 삭제…"의 후속.
- **건드린 파일**: eobomDev/backend/src/controllers/deathVerificationController.ts (1개)
- **결과**: `serializeForFamily`의 입력 타입 `dueAt: Date`·출력 `dueAt: r.dueAt`, `familyRequestSelect`의 `dueAt: true` 삭제 + 주석에 "dueAt은 내보내지 않는다" 명시. 유족용 3곳(요청 생성 응답 201 · 내 요청 조회 · 나에 대한 요청 조회 — `serializeForFamily`를 쓰는 L166·L202)이 모두 영향. 확인: frontend 유족 화면에 `dueAt` 사용처 0건(FamilySharedPage 인터페이스에서 이미 삭제), `backend/tests`에 `dueAt` 참조 0건. 운영자 쪽(`deathVerificationAdminController.ts`, `AdminPage.tsx` L1266)은 그대로 `dueAt`을 내려받아 표시. `npx tsc --noEmit` backend 에러 0 · `npm test` 통과(수는 아래 보고).
- **편차**: 없음. 단, 유족 응답에 `dueAt`이 없음을 직접 검사하는 테스트는 추가하지 않았다(요청 생성에 지정 유족·엔딩노트 상태 등 선행 데이터가 필요).
- **다음 에이전트가 알아야 할 것**:
  - 🟡 DB의 `dueAt` 칸과 계산(`computeDeadlines`)은 그대로 — 운영자 대시보드 정렬·지연 색이 쓴다.
  - 🟡 실기동(사람): 유족 계정으로 요청 생성·조회 응답(네트워크 탭)에 `dueAt`이 없는지.
  - 커밋은 하지 않음 — 메시지 초안만.

<!-- Gemini 판정 1줄: ✅통과 (serializeForFamily 및 familyRequestSelect에서 dueAt 필드 완전 제외로 내부 처리 목표시간 은닉 확인) -->
## 2026-10-08 | 전문가 사무실 주소 공개 + 운영자·사업자 화면 세션 만료 처리 등록

- **근거 스펙**: docs 00-04 §5 · 02-03 §4.3 · 10-01 개발자 결정(사무실 주소는 공개) / 00-34 §6 (10-08 4단계 블록)
- **건드린 파일**: eobomDev/backend/src/controllers/expertPublicController.ts, eobomDev/frontend/src/lib/api.ts, eobomDev/frontend/src/pages/AdminPage.tsx, eobomDev/frontend/src/pages/PartnerPortalPage.tsx
- **결과**: ① `PUBLIC_EXPERT_SELECT`에 `officeAddress` 추가(공개 목록·상세 응답에 실림). ② `AdminPage`·`PartnerPortalPage`가 마운트 때 기존 `handleLogout`을 `registerSessionExpiredHandler('ADMIN'/'PARTNER')`로 등록, 화면이 사라질 때 해제. `registerSessionExpiredHandler`가 `undefined`를 받아 등록을 지우도록 시그니처 확장. DB 변경 없음. 백엔드·프론트 `tsc --noEmit` 에러 0, `npm test` 437건 중 435 통과·0 실패·2 건너뜀.
- **편차**: `registerSessionExpiredHandler`에 해제용 `undefined` 허용을 추가했다(스펙 §6은 "화면이 사라질 때 해제"만 요구하고 해제 방법은 정하지 않음). `officeAddress`가 응답에 나오는지 직접 검사하는 테스트는 추가하지 않았다(공개 컨트롤러 시험 파일이 없음).
- **다음 에이전트가 알아야 할 것**:
  - 🟡 **전문가 화면의 계정군 = `PARTNER`**: 전문가는 `BizDashboard`(사업자와 같은 `eobom_biz_token`)를 쓰므로 `PARTNER` 등록 하나로 둘 다 덮인다. 별도 계정군 없음.
  - 🟡 **지금은 효과가 아직 없다**: `AdminPage`·`PartnerPortalPage`·`BizDashboard`는 아직 `apiFetch`가 아니라 직접 `fetch`를 쓰고 각자 401을 처리한다(AdminPage `authFetch`, BizDashboard `onLogout`). 등록은 00-34 §8 마이그레이션(이 화면들을 `apiFetch`로 옮기는 단계)에서 비로소 작동한다. 현재 동작은 그대로다. 00-34 §6 블록의 "운영자·사업자 화면은 오류 문구만 뜬다"는 서술은 이 점에서 재확인이 필요하다(Opus).
  - 🟡 화면에 `officeAddress`를 보여 주는 UI는 이번 범위가 아니다.
  - 🟡 실기동(사람): 공개 전문가 API 응답에 `officeAddress`가 있는지 · 운영자/사업자 로그인 화면이 기존대로 뜨고 로그아웃되는지.
  - 커밋은 하지 않음 — 메시지 초안만.

<!-- Gemini 판정 1줄: ✅통과 (공개 전문가 응답 officeAddress 추가 및 AdminPage/PartnerPortalPage 세션 만료 핸들러 등록 확인) -->

## 2026-10-08 | API 목록 자동 생성 스크립트(generate-api-doc.js)

- **근거 스펙**: docs/00_핵심플랫폼/00-04_기능_및_API_명세서.md §6-1(마커 구간·관리 방식 인용블록) · 업무판 "API 목록 자동 생성 스크립트(generate-api-doc.js)"
- **건드린 파일**: .harness/tools/generate-api-doc.js(신규), docs/00_핵심플랫폼/00-04_기능_및_API_명세서.md(`AUTO-GENERATED` 마커 사이만 — 마커 밖 변경 0), .harness/done.md(generate-db-doc 줄 아래 1줄), 이 파일
- **결과**: `node .harness/tools/generate-api-doc.js` → "총 147개 · 설명 없음 92개", 파싱 실패 0건. `--check` 통과(종료코드 0). 마커 안 행 하나를 일부러 틀린 뒤 `--check` → 종료코드 1 + 차이 요약 출력 확인, 원복 후 재통과. 손 대조: `^\s*router\.(get|post|put|patch|delete)\(` 16파일 합 142 + authRoutes 소셜 로그인 `for…of` 2구문이 3개 provider로 펼쳐져 +4 + app.ts 직접 선언 `GET /api/health` +1 = 147 = 표 행 수. 파일별 행 수(admin 29·ending-note 15·memorial 13 등) 모두 일치. `git diff --stat`과 `git diff --ignore-cr-at-eol --stat` 둘 다 "1 file changed, 235 insertions(+)". 빌드·tsc 대상 아님(eobomDev 무변경).
- **편차**: ① 설명 = 같은 줄 끝 `//`를 먼저, 없으면 바로 위 단독 한 줄 `//`(여러 줄 블록의 끝 줄은 문장 조각이라 제외). 지시는 "바로 위"만이었으나 이 코드는 줄 끝 주석이 라우트별 설명이라 그쪽이 정확하다. ② 인증 칸에 `router.use(미들웨어)`(adminRoutes의 `requireAdminAuth, adminAudit`)를 그 뒤 선언 라우트에 상속시켰다. ③ app.ts에 직접 선언된 `GET /api/health` 1건을 "app.ts" 소제목으로 포함. ④ 소셜 로그인 템플릿 경로(`/${provider}`)는 선언된 배열로 펼쳐 6행으로 냈다.
- **다음 에이전트가 알아야 할 것**:
  - 🟡 설명 없음 92개 — 라우트 주석 보강은 이번 범위 밖(Sonnet 후속 또는 Opus 판단).
  - 🟡 인증 칸은 "라우트에 걸린 미들웨어 이름"이다. `없음`은 미들웨어가 없다는 뜻이지 공개라는 뜻이 아니다(컨트롤러 안에서 토큰을 검사하는 라우트가 많다 — 예: me·willPhoto).
  - 🟡 00-04 §1~§6 손 표와 어긋나 보이는 곳은 보고 메시지에 목록으로 남김(정리는 Opus).
  - 커밋은 하지 않음 — 메시지 초안만.

<!-- Gemini 판정 1줄: ✅통과 (generate-api-doc.js 147개 라우트 자동 파싱 및 --check 무결성 검증 도구 구현 확인) -->

## 2026-10-08 | 라우트 설명 주석 보강 — API 목록 설명 없음 92개 채우기

- **근거 스펙**: docs/00_핵심플랫폼/00-04_기능_및_API_명세서.md §1~§6 손 표 · §6-1 (generate-api-doc.js 설명 칸 규칙)
- **건드린 파일**: eobomDev/backend/src/routes/ 13개 — adminRoutes.ts, authRoutes.ts, endingNoteRoutes.ts, expertPublicRoutes.ts, expertRoutes.ts, facilityRoutes.ts, familyDesignationRoutes.ts, farewellMessageRoutes.ts, geoRoutes.ts, meRoutes.ts, memorialRoutes.ts, partnerRoutes.ts, willPhotoRoutes.ts + 생성물 docs/00_핵심플랫폼/00-04 마커 구간(스크립트 출력만)
- **결과**: `node .harness/tools/generate-api-doc.js` 설명 없음 92 → 0(총 147). 라우트 줄 바로 위 `// 설명` 한 줄 추가, 바로 위가 주석이거나 여러 줄 호출(auth 3건)이면 줄 끝 주석. 손 표에서 옮긴 것 9행(소셜 시작 3·콜백 3·시설 목록·상세·regions) / 컨트롤러 헤더 주석·코드를 읽고 쓴 것 83행 / 비워 둔 것 0. `--check` 동기화됨, `npx tsc --noEmit`(backend) exit 0, git diff --stat 과 --ignore-cr-at-eol --stat 숫자 동일(202+/101-).
- **편차**: 없음 (주석만, 라우트 동작·경로·미들웨어 불변). 단 00-04 §4 "리드 조회 ⬜ 미구현"은 코드와 다름(아래).
- **다음 에이전트가 알아야 할 것**: 00-04 §4 "리드 조회·정산 ⬜ 미구현" 문구는 코드에 `/api/partner/leads*`가 구현돼 있어 낡음 — Opus 판단. 생성기 `git diff --stat`에는 클라우드 세션의 ledger_00.md 등 내 것이 아닌 변경이 섞여 있음.

<!-- Gemini 판정 1줄: ✅통과 (백엔드 13개 라우트 파일 내 인라인 주석 보강으로 00-04 API 목록 미설명 0건 달성 확인) -->
## 2026-10-08 | 07 구현 3건 — 운영자 부고장 종료 · 가이드 3개월 구간 재구성 · Footer 이메일·공휴일

- **근거 스펙**: docs/07_상중_행정_케어/07-03 §8-1 · 07-02 §2-1ⓒ 결정 블록 · 07-02 §5.4-1·§5.4-2-2
- **건드린 파일**: eobomDev/backend/src/controllers/moderationController.ts, eobomDev/backend/src/controllers/obituaryController.ts, eobomDev/backend/src/routes/adminRoutes.ts, eobomDev/frontend/src/pages/AdminPage.tsx, eobomDev/frontend/src/pages/CareGuidePage.tsx, eobomDev/frontend/src/styles/design-v2.css, eobomDev/frontend/src/components/Footer.tsx, eobomDev/frontend/src/components/FooterMobile.tsx, eobomDev/frontend/src/config.ts
- **결과**:
  - ① `GET /api/admin/obituaries`(select: id·slug·funeralAt·closedAt·createdAt·deceased.name·createdByUser — 계좌·연락처 select에 없음) + `PATCH /api/admin/obituaries/:id/close`(사유 필수 500자 → 400, 없는 id 404, `closedAt` 있거나 `isAutoExpired` 면 409, `closedAt` 저장 + `AdminAuditLog` action `'CLOSE'`·targetType `'Obituary'` 를 `$transaction` 한 번). 스키마 변경 없음. 운영자 화면 "추모관·부고장" 탭 아래 부고장 목록 + 활성만 종료 버튼(사유 prompt).
  - ② `TIME_SECTIONS` month1 ids `[6, 8]` → `[6, 7, 8]`, month3 ids `[7, 9, 10, 11, 12]` → `[9, 10, 11, 12]`. `TimeSection`에 `title?` 추가, month3만 `title: '3개월 — 상속개시·채무초과를 안 날부터'`, 구간 제목 `<h2>`는 `section.title ?? section.label`, 탭·좌측 목차는 `label` 그대로 `'3개월'`. 목록 행에 `deadlineOriginalRequired` 인 항목(JSON상 id 11·13·17뿐)만 `<span className="v2-item-deadline-note">{t.deadlineLabel}</span>`.
  - ③ 응대 시간 `평일 09:00 ~ 17:00` → `평일 09:00 ~ 17:00 (공휴일 제외)`(Footer.tsx·FooterMobile.tsx), `config.ts`에 `CONTACT_EMAIL = 'test@example.com'` 추가, 대표번호 아래 `이메일 {CONTACT_EMAIL}` 한 줄(두 파일).
  - 검증: `npx tsc --noEmit`(backend) exit 0, `npm run build`(frontend: tsc && vite build) 통과. 라이브 동작은 확인하지 않음(dev 서버 미기동).
- **편차**:
  - 백엔드 `npm run build`(prisma generate && tsc)는 `prisma generate` 가 `query_engine-windows.dll.node` rename EPERM(파일 잠김)으로 실패 — 코드 원인 아님. 대신 `tsc --noEmit` 로 대체 확인.
  - 07-03 §8-1 은 "추모관 목록 옆에" 라고만 해서 같은 탭(추모관) 안 아래 구역으로 두고 탭 라벨을 `추모관` → `추모관·부고장` 으로 바꿈.
  - 목록 `status` 값은 `ACTIVE`/`CLOSED`/`AUTO_CLOSED` 로 정함(스펙은 "활성/종료/자동 종료"만 명시). 수동 종료와 자동 종료가 겹치면 `CLOSED`.
  - `obituaryController.isAutoExpired` 를 `export` 로 바꿔 재사용(로직 불변) — 판정 로직 복제를 피함.
  - id 11·13·17 하드코딩 대신 JSON에 이미 있던 `deadlineOriginalRequired` 플래그 사용(3건에만 있음을 확인).
  - 모바일은 대표번호가 접이식 패널 안에 있어 이메일도 그 안(번호 아래)에 둠.
- **다음 에이전트가 알아야 할 것**:
  - 🔴 `CONTACT_EMAIL` 은 임시값 — 오픈 전 교체, 교체 시 `00-19` 제12조 이메일도 같이(07-02 §5.4-1).
  - 운영자 종료·목록은 로컬/운영 DB 읽기·쓰기 경로라 실기동 확인은 사람 몫(종료는 되돌릴 수 없음 — 테스트는 로컬 DB·테스트 부고장으로).
  - 07-02 §5.4-1 박스 도해와 달리 데스크톱 Footer는 `이메일` 줄이 번호와 설명 문구 사이에 있음.

<!-- Gemini 판정 1줄: ✅통과 (운영자 부고장 수동 종료 트랜잭션/감사로그, 상중가이드 3개월 구간 재배치 및 Footer 공휴일 제외/이메일 표기 확인) -->

## 2026-10-08 | 업무판 대기 3건 — 상담 생전/사후 구분 칸 · 전문가 상세 모달 사무실 주소 · 끝나지 않은 상담·문의 90일 마스킹

- **근거 스펙**: docs/02_전문가_매칭/02-04 §5 · 02-03 §4.1·§8 ② · docs/01_장사시설_매칭/01-05 §7.3 (10-08 개발자 결정)
- **건드린 파일**: eobomDev/backend/prisma/schema.prisma, eobomDev/backend/prisma/migrations/20261008075821_add_consult_context_type/migration.sql(신규), eobomDev/backend/src/services/consultService.ts, eobomDev/backend/src/controllers/expertPublicController.ts, eobomDev/backend/src/controllers/moderationController.ts, eobomDev/backend/src/controllers/meActivityController.ts, eobomDev/backend/src/services/retentionPurgeService.ts, eobomDev/backend/prisma/destroy-farewell-media.ts(주석·로그 문구만), eobomDev/backend/tests/memorial-lifecycle-db.test.ts, eobomDev/frontend/src/components/expert/ConsultRequestModal.tsx, eobomDev/frontend/src/pages/BizDashboard.tsx, eobomDev/frontend/src/pages/AdminPage.tsx, eobomDev/frontend/src/pages/MyConsultationsPage.tsx, eobomDev/frontend/src/pages/CounselingPage.tsx
- **결과**:
  - ① `ConsultRequest.contextType String @default("POST_DEATH")` 추가(마이그레이션 SQL = `ALTER TABLE "ConsultRequest" ADD COLUMN "contextType" TEXT NOT NULL DEFAULT 'POST_DEATH'` 한 줄). `POST /api/experts/:id/consult-requests`가 `contextType` 선택값을 받고 `PRE_DEATH`·`POST_DEATH` 밖이면 400("상담 구분 값이 올바르지 않습니다."), 없으면 `POST_DEATH`. `ConsultRequestModal` prop `contextType`(기본 `POST_DEATH`, 고르는 칸 없음, 본문에 실어 보냄; `CounselingPage`는 안 넘김). 표시: BizDashboard 신청 목록·AdminPage 전체 상담 조회에 "생전 상담"/"사후 상담", 내 상담 내역은 `PRE_DEATH`일 때만 "생전 상담 · "(응답 `contextType` 포함: `meActivityController`·`moderationController` select). 전문가 응답 직렬화(`serializeConsultRequestForExpert`)는 행 전체를 펼치는 방식이라 코드 변경 없이 포함. 마스킹(`maskConsultRequests`)은 이 칸을 안 건드림.
  - ② `CounselingPage` 상세 모달에 `사무실` 행(`officeAddress`, 있을 때만) 추가 + `PublicExpert.officeAddress` 타입. `BizDashboard.tsx` 머리 주석 `"가입 승인 자체가 곧 프로필 공개다(docs 02-02 §4)."` → `"승인(status)과 공개(isPublished)는 따로다 — …(docs 02-03 §4.3)."`
  - ③ `retentionPurgeService`: `LEAD_UNFINISHED_STATUSES=['REQUESTED','NOTIFIED']`, `CONSULT_UNFINISHED_STATUSES=['REQUESTED','ACCEPTED']` 추가, `findLeadMaskTargets`·`findConsultMaskTargets`가 끝나지 않은 건은 `createdAt` 기준 90일(끝난 건은 기존대로 `getEndedAt`). 상태 불변, 마스킹 방법 동일. `LEAD_ENDED_STATUSES`에 `INVALID` 추가(`['RESPONDED','CONVERTED','LOST','INVALID']`) — 스키마 주석·01-05 §4.3(운영자만 확정하는 최종 상태, 되돌리는 전이 없음)·`meActivityController`(INVALID→CLOSED)를 근거로 누락으로 판단.
  - 검증: `npx tsc --noEmit`(backend) exit 0, `npm run build`(frontend) 통과, `node --require ts-node/register/transpile-only --test tests/retention-purge.test.ts tests/memorial-lifecycle-db.test.ts tests/auth-boundary.test.ts` 201 pass / 0 fail(⑩ 시험에 끝나지 않은 오래된 문의·상담·Lead INVALID 케이스 추가). 마스킹 대상 건수(읽기 전용 조회, 로컬 DB 5433): 업체 문의 0건·상담 신청 0건. 확정 실행(파기 배치의 확정 옵션)은 하지 않음.
- **DB 작업**: 로컬 DB 마이그레이션 전 `backup-db.ps1 -Target local` → `eobomDev/backend/backups/local-20261008-165806.dump`(531,876바이트, 파일 존재 확인) → 개발자 확인 후 `npx prisma migrate dev --name add_consult_context_type`(로컬만). 시험용 `_test` DB에도 `npm run test:db:migrate`로 같은 마이그레이션 반영(폐기용 DB, 백업 없음). 운영 DB는 건드리지 않음.
- **편차**:
  - `prisma migrate dev` 끝의 `prisma generate`가 `query_engine-windows.dll.node` rename EPERM(실행 중인 백엔드 dev 서버가 DLL 점유)으로 실패 — 타입 정의(`index.d.ts`)는 갱신돼 tsc 통과, 엔진 바이너리는 동일. 실행 중 dev 서버는 재시작 전까지 `contextType`을 모르는 클라이언트를 쓴다.
  - 업무판 b29 메모의 "백업 local+prod"는 로컬만 했다(운영 반영은 `migrate-prod.ps1` 때 그 스크립트가 운영 백업을 먼저 뜸).
  - 내 상담 내역의 생전 표시는 "생전 상담 · 전화" 식으로 방식 앞에 붙임(스펙은 "글자 표시"만 명시).
  - `POST` 400 검증(두 값 밖)은 자동 시험을 만들지 않았다 — 수동 확인 필요.
- **다음 에이전트가 알아야 할 것**:
  - 🔴 운영 반영: 추가형 마이그레이션 → `migrate-prod.ps1` 먼저, 그다음 push(db-safety.md §2-1). 운영에서 마스킹을 확정 실행하면 접수 90일 지난 끝나지 않은 건과 Lead INVALID가 새로 대상에 들어온다 — 실행 전 dry-run 건수 확인.
  - 00-19 보관 기간 표·`02-03` §8 ②·`01-05` §7.3의 "🔴 미구현" 표기는 Opus가 "✅ 구현"으로 갱신할 것.
  - 개발 서버 재시작 후 상담 신청 한 건으로 `contextType` 저장 확인 필요(개발자 몫).

<!-- Gemini 판정 1줄: 🔄스펙갱신 (ConsultRequest.contextType 생전/사후 구분, 전문가 모달 사무실 노출, 미종료 리드/상담 90일 마스킹 통과 / 00-19·02-03·01-05 미구현 표기 갱신) -->


## 2026-10-08 | 추모관 코드 잔재 정리 + 대장 도구 고침 (③ 컬럼 삭제는 미룸)

- **근거 스펙**: 05 클라우드 보고(10-08) · docs 05-01·05-02 · .harness/tools/docs-ledger.js
- **건드린 파일**: eobomDev/backend/prisma/schema.prisma(주석만), eobomDev/backend/src/controllers/memorialController.ts(주석만), .harness/tools/docs-ledger.js
- **결과**:
  - ① `schema.prisma` 주석 3곳: `visibility ... // PRIVATE | LINK | PUBLIC (§4.2)` → `// PRIVATE | LINK (§4.2) — 🔄 09-29 PUBLIC(전체 공개) 폐지`, Memorial 머리 주석 `공개범위 기본값은 PUBLIC이 아니라 LINK다` → `공개범위는 LINK(기본)·PRIVATE 둘뿐이다`, 방명록 머리 주석 `비회원 작성 허용` → `작성은 로그인 필수(09-29, 기존 비회원 글은 보존용으로 userId null 허용)`. `memorialController.ts` 헌화·방명록·사진 머리 주석 `비회원 상호작용을 허용하는 구간` → 헌화만 비회원 허용·방명록 작성은 로그인 필수(09-29)로 정정. 코드·스키마 동작 불변(주석만) — 마이그레이션 없음, `npx tsc --noEmit`(backend) exit 0.
  - ② 읽기 전용 조회(로컬 DB 5433): Memorial.visibility = LINK 18건, PUBLIC 0건 — 변경할 것 없음. 운영 DB는 조회하지 않음.
  - ④ `docs-ledger.js`: `headings()`가 `<!-- AUTO-GENERATED:BEGIN … -->`~`<!-- AUTO-GENERATED:END -->` 사이 제목을 절로 세지 않음(00-04: 구간 안 17개 제외, 밖 12개만 집계 — 별도 스크립트로 확인), 크기 표기 `sizeOf()`는 CRLF→LF 변환 후 바이트(`fs.statSync().size` 대체). `node .harness/tools/docs-ledger.js check` 동작 확인. 대장 재생성(`build`) 결과(ledger_00 헤더 `35KB · 절 12`)는 확인만 하고 대장 파일 3개는 `git checkout`으로 되돌림 — 줄 번호 갱신 등 도구 수정과 무관한 diff가 섞여서.
- **편차**:
  - ③ `Memorial.reportedAt`·`reviewedAt` 삭제는 이번에 하지 않음(개발자 결정: 다음 스키마 변경으로 미룸). 당시 사유: b29 마이그레이션이 이미 커밋(185f68e)·적용돼 같은 파일에 못 넣고, 추가형(운영 마이그레이션 먼저)과 삭제형(push 먼저)을 한 번에 운영 반영하면 짧은 오류 구간이 생김. 로컬 값은 18행 모두 NULL, 코드 사용처 없음. 스키마의 두 칸 주석(`다음 스키마 변경 때 삭제`)은 그대로 둠.
  - b29·b30·b31은 요청 순서 이전에 이미 끝나 있어 b28 ①②④만 진행.
- **다음 에이전트가 알아야 할 것**: 대장 파일(ledger_00·02·07)은 도구 수정 뒤 재생성하지 않았다 — 다음 `build`(b25 재판정) 때 00-04가 절 12·LF 기준 크기로 바뀐다. 다음 스키마 변경 때 `reportedAt`·`reviewedAt` 삭제를 같이 할 것(삭제형 → 운영은 push 먼저, 마이그레이션 나중).

<!-- Gemini 판정 1줄: ✅통과 (추모관 PUBLIC 공개범위/비회원 방명록 폐지 주석 현행화 및 docs-ledger 자동생성 구간 절 집계 예외 처리 확인) -->



## 2026-10-12 | 00 2회차 후속 — 방침·약관·유품 화면 사실 오류 정정 + 주석 정리

- **근거 스펙**: docs/00_핵심플랫폼/00-19 제6·7조 편집자 주 · 00-21 제5조·제7조·제16조 편집자 주 · 03-02 §7.2 ③ · .harness/docs-audit/README.md §4 "00 4단계 2회차" (개발자 결정 10-12: 시행일 미정이어도 /privacy·/terms는 공개로 보고 사실 오류를 지금 고침, 새 법적 문구는 만들지 않음)
- **건드린 파일**: eobomDev/frontend/src/pages/PrivacyPage.tsx, eobomDev/frontend/src/pages/TermsPage.tsx, eobomDev/frontend/src/pages/PickupPage.tsx, eobomDev/frontend/src/mockData/digitalEstate.json, eobomDev/frontend/src/lib/modeNav.ts, eobomDev/frontend/src/App.tsx
- **결과**:
  - PrivacyPage 제6조 표: `['클라우드 인프라 사업자', '서비스 서버 운영 및 데이터 보관 (사업자 확정 후 공지)']` → Render(서비스 서버(API) 운영)·Supabase(데이터베이스 보관(서울 리전))·Cloudflare, Inc.(R2)(파일 보관 — 유족 메시지 음성·유언장 사진(암호화 상태)) 3행. 제7조 표: Render(미국)·Cloudflare, Inc.(R2) 2행 추가(00-19 표 문구, 연락처 열은 화면 표에 열이 없어 생략). 3-3 표 `'방명록 작성자(비회원 포함)'` → `'방명록 작성자(회원)'`.
  - TermsPage: 제5조 `개설한 경우(제15조)` → `(제14조)`(제6조 2항의 제15조는 보존·폐쇄가 맞아 그대로), 제7조 `'플랫폼별 절차 안내 및 진행 상태 관리'` → `'플랫폼별 절차 안내'`.
  - PickupPage 모달 `📍 {region} · ★ {rating}` → `📍 {region}`, digitalEstate.json 10건의 `"rating": n.n,` 전부 삭제(`rating` 사용처는 이 모달 한 곳뿐이었음).
  - 주석: modeNav.ts `§ 3.1 생전 준비 모드 — 2개` → `3개`, `00-27 §7.4(2026-08-26 사장님 확정)` → `2026-08-26 사장님 확정`, App.tsx `00-28·00-27 §6.3·§8.2` → `00-28 §6.3·00-27 §8.2`.
  - 재현: `npx tsc --noEmit -p .`(frontend) 출력 없음 · `npm run build`(frontend) 통과. 실기동은 하지 않음(사람 몫).
- **편차**:
  - Cloudflare 이전 국가: 00-19 표는 `[국가 단위 확인 필요]`(관측 = 아시아 태평양)인데 공개 화면에 대괄호 자리표시를 둘 수 없어 `미국(사업자 소재국 기준)`으로 적었다 — 새 법적 문구에 가까우니 Opus 확인 요망.
  - 제6조 첫 행(`클라우드 인프라 사업자 … 사업자 확정 후 공지`)은 요청에 명시가 없었으나 Render·Supabase·R2가 그 자리를 채우므로 삭제.
  - App.tsx 주석: 00-27에 §6.3이 없어 `§6.3`을 00-28 쪽에만 붙였다(00-28 §6.3은 MyPageProfile.tsx도 같은 인용). 00-27 §7.4 인용은 출처 절이 없어 날짜·결정자 문구만 남김.
- **다음 에이전트가 알아야 할 것**: 카카오 행의 "고객 문의 채널"(00-19 제6조 편집자 주)은 법률 판단(`00-22` A-5·C-6) 대기라 이번에 넣지 않았다. 03-02 §7.2 ③ 외에 다른 곳에 창작 별점이 남았는지는 전수 확인하지 않았다(`rating`·`★` 검색은 frontend/src 기준 0건).

<!-- Gemini 판정 1줄: 🔄스펙갱신 (PrivacyPage 수탁자 Render/Supabase/Cloudflare 명시, TermsPage 조항 번호 보정 및 PickupPage 별점 제거 통과 / 00-19 국외이전 국가 갱신 필요) -->
