# 🟧 claude_tasks.md — Claude(코딩/구현) 전용 작업 로그

> 살아있는 실무 로그. 디버깅 잡담, 체크리스트, 진행 중 상태를 가감 없이 남기는 곳.
> 한 사이클이 끝나면 중요한 것만 추려서 [`walkthrough.md`](walkthrough.md)로 정제하고, 그 최신 한 줄만 [`context.md`](context.md)에 반영한다.

> 🔴 **2026-09-02 — 2026-08-26 이하 41건은 아카이브로 옮겼습니다.**
> [`claude_tasks_아카이브_2608.md`](claude_tasks_아카이브_2608.md) (160KB → 22KB)
> 분리 기준 = *날짜*뿐이다. 이 로그엔 게이트 판정이 없어서 옮겨도 잃는 게 없다.
> 🔴 **작아졌다고 통독하지 않습니다** — `read-guard.js`가 이 파일을 이름으로 막습니다.

---

## 2026-08-31 (31) — `EndingNotePage` 인쇄 날인 칸 — `window.print()` 검증 우회 `[Sonnet]`

**`handlePrintDraft`는 실클릭으로 검증하면 안 된다**: 이 함수는 `printWindow.print()`를
호출해 OS 네이티브 인쇄 대화상자를 띄운다. alert/confirm과 마찬가지로 모달성 다이얼로그라
claude-in-chrome 자동화가 멈출 위험이 있어 처음부터 버튼을 누르지 않기로 함. 대신
`handlePrintDraft`가 만드는 것과 똑같은 HTML/CSS 문자열을 뽑아서, 이미 열려 있는 탭에
`javascript_tool`로 `document.open()`→`document.write(...)`→`document.close()`를 직접
실행해 렌더링만 재현 — 실제 인쇄 대화상자 없이 스크린샷으로 레이아웃을 확인할 수 있었다.
같은 패턴(문서 내부 `window.open`+`.print()` 조합)이 다른 페이지에도 있으면 이 우회법을
재사용할 것.

## 2026-08-31 (30) — `CareGuidePage` 가로 배치·화살표 전용 펼치기 `[Sonnet]`

**다단(columns)의 "위→아래 우선" 채움 순서가 사용자 기대와 반대였다**: 08-19 13차에서
CSS Grid → 다단으로 바꾼 이유가 "짧은 카테고리 아래 빈 공간"이었는데, 이번엔 반대로
카테고리 수가 적은 구간(예: 신고·조회·상속 승인·포기·조건부 3개)에서 가로 여백이 남는데도
옆으로 안 가고 전부 세로로 쌓이는 문제로 지적받음 — 다단은 첫 단을 다 채운 뒤에야 다음
단으로 넘어가는 신문 레이아웃이라, 첫 단 안에 다 들어가 버리면 나머지 단은 아예 안 쓰인다.
flex-wrap으로 교체(가로 여유 있으면 옆으로, 없으면 다음 줄)해서 해결 — 요구사항이 "가로
여유가 있으면 나열"이라는 것부터 CSS Grid/flex 쪽 문제였지 다단으로는 애초에 못 맞추는
요구사항이었다.

**`toggleExpand(id, e)` → `toggleExpand(id)`로 시그니처를 바꾸면서 호출부·부수 코드가 흩어져
있었다**: 카드 전체 클릭 펼치기를 없애면서 각 자식 요소(체크박스·버튼 2개·외부링크)에 걸려
있던 `stopPropagation()`이 전부 죽은 코드가 됐다 — 카드 자체가 더 이상 안 눌리니 막을 확산이
없음. Grep으로 `stopPropagation`·`toggleExpand(t.id, e)` 잔존 여부를 검색해 누락 없이
정리했는지 확인. tsc는 여분 인자를 허용해서(구 시그니처 호출도) 컴파일 에러로는 안 잡혔을
것 — 타입 통과만으로 "다 고쳤다" 판단하지 말 것.

## 2026-08-31 (29) — 04-01 §8 1단계 A(`DigitalCleanupItem` 스키마) — 백업·generate 삽질 `[Sonnet]`

**`backup-db.ps1`을 그대로 쓰면 엉뚱한 DB를 백업할 뻔했다**: 지시문은 "`backup-db.ps1` 실행"
이었지만, 스크립트를 먼저 읽어보니 `.env`의 `BACKUP_DATABASE_URL`(운영 Supabase)을 최우선으로
읽는다. 실제 마이그레이션 대상은 로컬 Docker(`eobom-postgres`, 5433)인데 그대로 돌렸다면
"운영을 백업하고 로컬에 무방비로 스키마 변경"이 됐을 것 — `db-safety.md` §2가 정확히 이 함정을
경고하고 있어서 발견. 대신 같은 문서의 "로컬" 절차(`docker exec ... pg_dump`)로 직접 백업.

**Git Bash의 자동 경로 변환이 `docker exec` 안의 `/tmp/local.dump`까지 건드렸다**: 첫 시도에서
`pg_dump: could not open output file "C:/Users/.../Temp/local.dump"` 에러 — MSYS가 unix
스타일 인자를 통째로 윈도우 경로로 치환한 것. `MSYS_NO_PATHCONV=1`을 pg_dump 명령에만 걸어
해결. 단, 같은 플래그를 `docker cp`의 **목적지**(윈도우 경로)에도 걸면 이번엔 반대로 깨진다
(`"C:\\c\\Users\\..."`처럼 이중 변환) — `docker cp`는 플래그 없이 그냥 돌려야 목적지 경로가
정상 변환됐다. 원인이 같은 문제의 반대 방향이라 헷갈리기 쉬움, 다음에 또 이 패턴 나오면
"컨테이너 쪽 인자만 NO_PATHCONV, 호스트 쪽 인자는 그대로"로 기억할 것.

**`prisma generate`가 `EPERM`으로 실패** — 마이그레이션 자체(`migrate dev`)는 성공했는데 바로
뒤에 자동으로 도는 `generate`가 `query_engine-windows.dll.node`를 rename하지 못함. 원인은
사용자가 이미 띄워둔 백엔드 dev 서버(포트 5000)가 그 dll을 물고 있던 것 — 내가 서버를 죽이지
않고(메모리 규칙) 사용자에게 "잠깐 멈춰달라"고 요청, 멈춘 뒤 `prisma generate` 재실행해 해결.

## 2026-08-31 (27) — 04-01 0단계·0-b단계, 지시된 줄번호가 이미 틀려있던 경우 `[Sonnet]`

**0단계 지시가 가리킨 `EndingNotePage.tsx:185`가 실제로는 무관한 코드**(`SectionTimingControl`
관련) — placeholder 관련 텍스트 전체를 Grep으로 훑어도(40·845·856·943·974·984·1011·1117행) 비밀번호
입력을 유도하는 문구가 하나도 없었다. 지시문이 틀렸다고 그냥 넘기지 않고, `04-03`·`06-04`
문서에서 원문("OO은행 비상 예금 계좌 및 유품 정리 마스터 암호는…")을 찾아 `git log -p --
eobom/frontend/src/pages/EndingNotePage.tsx`를 스크래치패드로 뽑아 grep — 커밋 `eb1db97`
("엔딩노트 아코디언 전환 + Phase 1 저장")에서 해당 블록(`vaultSecret` textarea 통째로)이
이미 삭제된 걸 확인. 이번 세션 이전, 무관한 커밋에서 이미 해소된 문제였다 — 코드 변경 없이
투명하게 "이미 해결됨, 근거는 이 커밋"으로 보고.

**0-b단계 URL을 추측하지 않고 WebSearch로 선검증**: 안심상속 원스톱·금감원 상속인
금융거래조회 URL 둘 다 유족을 잘못된 페이지로 보낼 위험이 있어(추모 대상 사용자층), 코드에
넣기 전에 `WebSearch`로 공식 URL을 먼저 확인(`gov.kr/portal/onestopSvc/safeInheritance`,
`fss.or.kr/fss/cvpl/inhCerEc/main.do?menuNo=200010`). 삽입 후 `javascript_tool`로
`a[target="_blank"] href` 값을 직접 읽어 원본과 문자열 대조까지 마침.

**레거시 카탈로그를 안 건드리기로 한 판단**: `DigitalEstatePage.tsx`의 기존 블록(업로드·"정산
신청" 목업)이 "정산" 문구를 그대로 쓰고 있어 지시문의 "정산 쓰지 말 것"과 표면적으로 충돌하는
것처럼 보였지만, `04-01` §8 표에 전면 개편(Step 5)이 별도 단계로 이미 분리돼 있어 이번
스코프(0-b)는 새 섹션만 추가하고 레거시는 그대로 뒀다 — 코드 주석으로 경계를 남겨 다음
에이전트가 "왜 정산이 아직 남아있지"라고 헷갈리지 않게 함.

## 2026-08-28 (26) — Footer 카톡 전환, 사용자 dev 서버(5173) 무응답 삽질 `[Sonnet]`

**브라우저 검증하려는데 사용자가 이미 띄워둔 `localhost:5173`이 매번 "연결이 예기치 않게
닫힘"으로 실패**: `Get-NetTCPConnection`으로 포트 리스닝 자체는 확인됐고(node PID 3860),
claude-in-chrome `navigate`도 "Frame with ID 0 is showing error page"를 반환. PowerShell
`Invoke-WebRequest`·Bash `curl` 둘 다 동일하게 실패해서 처음엔 이 세션의 네트워킹 자체가
막힌 줄 알았다 — 나중에 별도 포트(4174)에서 재현해보고서야 원인을 깨달았다(아래).

**대체 경로로 `npm run build` + `npx vite preview --port 4174`를 새로 띄웠는데 이것도
"연결이 예기치 않게 닫힘"**: listener는 뜨는데(`Get-NetTCPConnection`에 4174 확인) 매번
동일한 에러. 이번엔 백그라운드 프로세스의 stdout 로그 파일을 직접 열어봤더니
`➜ Local: https://localhost:4174/` — **HTTPS였다.** `http://`로 계속 때리고 있었던 것.
`curl -sk https://127.0.0.1:4174/`로 바꾸자 바로 200. **원래 5173도 같은 이유였을
가능성이 높다**(vite.config에 https 설정이 있는 듯) — 굳이 재확인은 안 했다, 사용자의
dev 서버 창을 건드리고 싶지 않았기 때문. 결과적으로 5173 무응답은 이번 작업과 무관한
"내가 프로토콜을 잘못 짚었다"였을 가능성이 크지만, 확실하지 않아 walkthrough(88)에는
"원인 불명"으로 정직하게 남겼다.

**중간에 세션이 usage limit로 한 번 끊겼다** — 그 시점에 백그라운드로 띄워둔 4174 preview
프로세스가 `killed` 상태로 정리됐다(harness가 아니라 시스템이 정리한 것으로 보임). 재개
후 그냥 다시 띄웠다 — 문제 없음.

**검증 끝나고 4174 프로세스 정리**: `run_in_background`로 띄운 프로세스라 `TaskStop`
대신(과거 피드백 — TaskStop이 vite 자식 프로세스를 못 죽인 전례) `Get-NetTCPConnection`
으로 PID를 직접 찾아 `Stop-Process -Force`로 종료. 종료 후 포트 재확인까지 했다. 사용자의
원래 5173 프로세스(PID 3860)는 손대지 않았다.

**모바일 뷰 확인은 iframe 주입 트릭 재사용**: `window.claude`... 아니, `javascript_tool`로
375×700 iframe을 `document.body`에 주입 후 `contentWindow.scrollTo`로 iframe 내부를
바닥까지 내려서 캡처. `computer` 도구의 `zoom` action은 `region`이 페이지 CSS 픽셀이
아니라 뭔가 다른 좌표계를 쓰는지 "Region exceeds viewport boundaries"로 실패했다 — 대신
그냥 `screenshot` action으로 전체 화면을 찍고 iframe 부분만 눈으로 확인했다.

---

## 2026-08-28 (25) — 추모관 동결 필드 구현·검증 `[Sonnet]`

**`prisma migrate dev` 이후 `prisma generate`가 `EPERM`으로 실패**: `query_engine-windows.dll.node`
를 `.tmp*` → 실제 파일명으로 rename하는 단계에서 "operation not permitted". 두 번 재시도해도
동일. `node_modules/.prisma/client/index.d.ts`를 열어보니 `expiresAt`·`frozenAt`·`purgeAt` 타입은
이미 반영돼 있었다 — TS 코드 생성 단계는 성공했고, 실패한 건 네이티브 바이너리 교체뿐. Windows에서
파일이 잠긴 채로 rename을 시도하면 나는 전형적인 증상이라(다른 프로세스가 그 dll을 열어둔 상태),
아마 실행 중이던 backend dev 서버가 원인으로 추정된다(사용자가 dev 서버를 직접 관리하므로 이번엔
강제로 죽이지 않고 그대로 뒀다). 검증 스크립트를 돌려보니 기존 엔진 바이너리로도 쿼리가 정상
동작해 기능상 블로커는 아니었다 — walkthrough(87)에 "다음에 dev 서버 잠깐 멈추고 재실행" 메모.

**동작 검증 방식**: 백엔드는 dev 서버를 내가 띄우지 않는 게 이 프로젝트 규칙이라(과거 피드백 —
TaskStop이 자식 프로세스를 못 죽여서), `curl`로 실제 HTTP 엔드포인트를 때리는 대신
`eobom/backend/_verify_00_20_scratch.ts`를 임시로 만들어 `ts-node --transpile-only`로 실행 —
①순수 계산 함수(`calculateMemorialExpiresAt`·`calculateMemorialNoticeDate`)를 고정 날짜로
어서션 5개, ②`createTribute`·`createGuestbookEntry` 컨트롤러 함수를 mock `Request`/`Response`로
직접 호출해 동결/활성 추모관 양쪽에서 상태코드까지 확인. 첫 실행에서 `hashVisitor`가
`req.socket.remoteAddress`를 읽다가 mock에 `socket`이 없어 500이 났다 — 내 코드 버그가 아니라
mock이 부실했던 것, `socket: { remoteAddress: '127.0.0.1' }` 추가하고 재실행해서 11개 전부 PASS.
`addMemorialPhoto`는 `multer` 미들웨어가 끼어 있어 mock으로 재현하지 않고 코드 리뷰로만 확인(같은
`isMemorialFrozen()` 헬퍼, 같은 위치). 검증 끝나고 스크립트 파일은 지웠지만 **DB에 만든 테스트
행(`Deceased` 1건, `Memorial` 2건 + 헌화·방명록 각 1건)은 `db-safety.md` §4에 따라 지우지
않고 남겼다** — `context.md` 배치정리 목록에 추가.

**`policy.ts` 상수 이름**: 사용자 지시문은 `MEMORIAL_ACTIVE_DAYS`·
`MEMORIAL_NOTICE_AFTER_ANNIVERSARY_DAYS`(SCREAMING_SNAKE_CASE, `00-20` §8.1-2 원문과 동일)였는데
기존 `policy.ts`는 `POLICY.memorial.photoMaxSizeBytes`처럼 단일 객체 + camelCase 관례였다.
관례를 깨지 않고 `POLICY.memorial.activeDays`/`noticeAfterAnniversaryDays`로 넣되, 주석에
지시받은 상수 이름을 그대로 적어 검색 가능하게 해뒀다.

---

## 2026-08-28 (24) — "한눈에 보기" 모달 브라우저 검증 삽질 `[Sonnet]`

**데모 로그인 버튼이 안 눌리던 이유**: `LoginModal.tsx`의 "카카오(모의)" 버튼이 "로그인" 탭에서는
`pointerEvents: 'none'`으로 죽어 있다(`canProceed`가 회원가입 탭의 동의 게이트에 걸려 있어서 —
코드 주석에 이미 설명돼 있었는데 처음엔 안 읽고 좌표만 계속 바꿔가며 클릭 재시도를 했다). 콘솔
에러도 없고 네트워크 요청도 안 잡혀서 처음엔 원인을 몰랐다 — `read_network_requests`로 "요청
자체가 안 나간다"를 확인하고 나서야 컴포넌트 코드를 열어봤다. "회원가입" 탭으로 전환 → 체크박스
2개(만14세·전체동의) 체크 → 그제서야 데모 버튼이 눌림. **교훈**: 클릭이 반응 없으면 좌표를 의심하기
전에 `pointerEvents`/`disabled` 같은 조건부 상태부터 콘솔·네트워크로 확인할 것.

**`browser_batch` 안에서 클릭 직후 스크린샷이 계속 30초 타임아웃**: 거의 매번 "클릭 → 즉시
스크린샷"으로 묶으면 `Page.captureScreenshot`이 타임아웃 났다. 페이지가 실제로 멈춘 건 아니고
(네트워크 요청은 정상적으로 나가고 있었다), 클릭→wait(2초)→스크린샷으로 나누면 항상 성공했다.
좌표 재사용 문제도 겹쳤다 — `browser_batch`의 좌표는 배치 시작 전 스크린샷 기준이라, 아코디언이
펼쳐지며 스크롤이 자동으로 일어난 뒤에는 이전 스크린샷의 좌표가 전부 어긋난다(엉뚱한 요소를
클릭하게 됨). 클릭 → 스크린샷을 자주 끊어서 매번 새 좌표를 확인하는 편이 느리지만 확실했다.

**모바일 뷰포트 재현**: `resize_window`가 계속 "bounds must be 50% within visible screen"으로
실패했다. `window.screenLeft/screenTop`을 찍어보니 `-32000`(창이 최소화 상태일 때 Windows가
주는 값) — 이 세션의 Chrome 창 자체가 최소화돼 있어 리사이즈 도구가 못 먹혔다. 과거 walkthrough에
남아있던 "390px iframe 트릭"을 그대로 재사용해 `document.body`에 `width:375px` iframe을
주입하는 방식으로 우회 — sessionStorage는 같은 origin의 iframe과 최상위 프레임이 공유하므로
로그인 세션도 그대로 넘어갔다.

**검증 후 정리는 db-safety.md대로**: 검증 중 실제로 만들어진 `EndingNoteEntry`(FUNERAL)를
이번엔 지우지 않고 그대로 남겨뒀다 — walkthrough(85) "다음 에이전트가 알아야 할 것"에 위치를
남김. 08-27 사고 이후 처음 겪은 "테스트 데이터 지울까 말까" 상황인데, 이번엔 새로 만든 규칙을
실제로 지켰다.

---

## 2026-08-27 (23) — 모바일 드로어 "계정 연동" 잔존 버튼 `[Sonnet]`

사용자 제보로 시작 — 08-25에 헤더에서 "계정 연동" 버튼을 빼고 마이페이지 전용으로 정리했다는
`Header.tsx:134` 주석을 먼저 찾았고, 같은 UI 조각이 `Sidebar.tsx`의 모바일 드로어(480px 이하
햄버거 메뉴)에도 복제돼 있었는데 그날 그쪽은 안 고쳤던 걸 확인. grep으로 `onOpenAccountSettings`
쓰는 곳이 그 버튼 하나뿐임을 먼저 확인하고 나서 prop까지 통째로 걷어냄 — 반쪽만 지우면
`Settings` import·prop 타입만 죽은 채로 남는다.

---

## 2026-08-27 (22) — 엔딩노트 Phase 2 구현 중 삽질, 특히 삭제 사고 `[Sonnet]`

**🔴 테스트 정리 중 실수로 기존 데이터 삭제**: Phase 2 검증(가족 초대→수락→grant→family-view
전체 플로우를 실 서버로 돌림)을 마친 뒤 테스트 데이터를 지우면서
`prisma.familyDesignation.deleteMany({ where: { userId: OWNER_ID } })`를 썼다. 이번에 만든 건
1건뿐인데 실제로는 3건이 삭제됐다 — `카카오 테스트회원` 계정에 **이전부터 있던 가족 지정 2건**이
같이 지워진 것. `deleteMany` 호출 직후 반환된 `{count: 3}`을 보고서야 알아챘다(먼저 `count`를
확인하지 않고 성공만 확인했다면 놓쳤을 것). `familyDesignation.findMany()`로 전체를 다시 조회해
남은 게 1건(다른 계정 소유)뿐임을 확인 → 사용자에게 즉시 보고. **교훈**: Phase 1 때 `EndingNote`를
같은 방식(`where: { userId }`)으로 지운 건 안전했다(그 계정에 EndingNote가 아예 없었으니까) —
이번엔 그 판단을 다른 모델(`FamilyDesignation`)에 그대로 옮겨 적용한 게 문제였다. **모델마다
"이 계정에 내가 만든 것 말고 이미 뭐가 있는지"를 따로 확인해야 한다** — 방금 만든 게 몇 건인지
알고 있다면 `deleteMany`가 아니라 **그 id들만 배열로 넘겨 지워야** 안전하다.

**가족 초대 흐름을 API로 통째로 재현**: Grant 검증에는 실제로 수락된(ACCEPTED) 가족이 필요해서,
`POST /api/family-designations` → `POST .../invite` → (다른 유저 토큰으로) `POST
/invite/:token/accept`까지 3단계를 스크립트 하나에서 순서대로 호출했다. 성함 대조
(`acceptFamilyInvite`가 `FamilyDesignation.name`과 body의 `name`을 비교)를 몰랐다면 400을
받고 헤맸을 텐데, 컨트롤러 코드를 먼저 읽어둬서 바로 맞는 이름을 넣었다.

**정책 위반 케이스를 먼저 테스트**: grant API를 만들고 나서 "정상 케이스"보다 "거부돼야 하는
케이스"부터 스크립트에 넣었다(①에 IMMEDIATE, ②에 EMERGENCY, ⑨에 아무 timing). 전부 400이
나오는 걸 먼저 확인한 다음에 정상 케이스를 시도 — 검증 순서를 이렇게 잡으니 "그냥 다 통과되는
게 아닌가"라는 의심을 먼저 지울 수 있어서 이후 정상 케이스 통과가 더 믿을 만했다.

---

## 2026-08-27 (21) — 엔딩노트 Phase 1 구현 중 삽질 `[Sonnet]`

**Prisma generate EPERM 락**: 스키마 수정 후 `npx prisma generate`가
`EPERM: operation not permitted, rename ...query_engine-windows.dll.node.tmpXXXX -> ...query_engine-windows.dll.node`
로 계속 실패. 4~5회 재시도해도 동일 — 원인은 백엔드 dev 서버(`ts-node-dev --respawn`)가 이미
로드해 둔 Prisma 쿼리 엔진 dll을 Windows가 잠가서(파일 rename 불가). `tasklist`로는 어느 PID가
범인인지 특정이 안 됨(node.exe 프로세스 11개, 전부 구분 불가). 개발 서버를 내가 직접 죽이지
않는 게 방침이라 사용자에게 "백엔드 터미널 잠깐 멈췄다가 다시 켜달라"고 요청 → 사용자가
포트 5000을 내렸다고 알려준 직후 재시도하니 즉시 성공. **교훈**: 스키마 변경 세션에서 이 락을
만나면 원인을 더 추적하지 말고 바로 사용자에게 dev 서버 재시작을 요청하는 게 빠르다.

**아코디언 리렌더 버그**: 처음엔 `AccordionSection`을 `EndingNotePage` 컴포넌트 함수 몸통
안에서 `const AccordionSection: React.FC<...> = (...) => {...}`로 정의했다. 동작은 하는데,
React가 매 렌더마다 새 함수 identity를 새 컴포넌트 타입으로 취급해서 부모 state가 바뀔 때마다
(텍스트박스 한 글자 입력 포함) 그 서브트리를 통째로 언마운트→재마운트한다 — 즉 입력창에
글자를 치면 매 키 입력마다 포커스가 날아가는 버그. 코드 리뷰 중 자체 발견, 사용자 제보 아님.
`cardStyle`·`cardTitleStyle`·`saveButtonLabel`과 함께 모듈 최상위로 끌어올리고 필요한 값
(expanded/completed/saveState/onToggle)을 전부 props로 내려주는 방식으로 수정. 이후 8개
섹션 각각의 `<AccordionSection>` 호출부에 `expanded={expandedSection === 'CODE'}` 등을
일일이 명시해야 해서 JSX가 길어졌지만 안전한 쪽을 택함.

**API 수동 검증 방법**: 이 세션의 Bash 도구가 한글 경로(`docs/작업일지_및_기록/...`)나
멀티라인 heredoc/변수치환이 섞인 명령에서 간헐적으로 `exit 127`(`... No such file or
directory`, 사실상 도구 자체의 cwd 북마크 파일 쓰기 실패로 보임)을 내는 문제가 반복됐다.
`curl -H "Authorization: Bearer $TOKEN"` 같은 멀티라인 스크립트가 매번 깨져서, 대신 Node
스크립트(`https.request`, TOKEN을 JS 문자열 리터럴로 하드코딩)를 임시 파일로 만들어 실행하는
방식으로 우회 — 셸 따옴표 이스케이프 문제를 완전히 피할 수 있어 훨씬 안정적이었다. JWT는
`jsonwebtoken.sign({..., aud:'user'}, process.env.JWT_SECRET)`으로 기존 DB의 실제 유저
id를 넣어 직접 발급(OAuth 로그인 없이 인증 우회 — 로컬 dev DB 대상 한정, 운영에서는 절대 이
방법 쓰지 말 것). 테스트 후 생성된 `EndingNote`/`EndingNoteEntry` 행은 `deleteMany`로 정리.

**`generate-db-doc.js` 코멘트 파싱 특성**: `schema.prisma`에서 한 필드의 `// 주석`을 여러 줄에
걸쳐 이어 쓰면(다음 줄도 `//`로 시작) 어떤 경우엔 전부 캡처되고(`releaseTiming`) 어떤 경우엔
첫 줄만 캡처되고 끊긴다(`recipientId` — 바로 다음 줄이 관계 필드 선언이라 그런 듯, 스크립트
소스는 안 읽어봄). 안전하게 가려면 **한 줄로 길게 쓰는 편이 낫다** — 여러 줄로 쪼개고 싶으면
생성된 `00-05` 문서를 실제로 열어서 잘림 여부를 확인할 것.
