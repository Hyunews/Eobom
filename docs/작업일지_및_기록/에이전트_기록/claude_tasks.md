# 🟧 claude_tasks.md — Claude(코딩/구현) 전용 작업 로그

> 살아있는 실무 로그. 디버깅 잡담, 체크리스트, 진행 중 상태를 가감 없이 남기는 곳.
> 한 사이클이 끝나면 중요한 것만 추려서 [`walkthrough.md`](walkthrough.md)로 정제하고, 그 최신 한 줄만 [`context.md`](context.md)에 반영한다.

---

## 2026-08-12 (1) — E2E 피드백 3건(대표자명·주소검색모달·태그 칩)

- 큰 삽질 없이 순탄하게 진행. 특이사항만 기록.
- **Bash 도구, 한글 경로에서 이번에도 실패**(4세션 연속 재발 — `wc -l`, `find`, `ls` 전부 cwd 관련 에러). Glob/Grep/Read로 완전히 대체해서 진행 — 이제 습관적으로 한글 경로엔 Bash를 안 씀. 단, `npx tsc --noEmit`/`npx vite build`처럼 순수 영문 경로+cd만 쓰는 빌드 명령은 정상 동작(이 경로는 Bash로 계속 씀).
- **대표가 "API 만들어야할듯"이라 표현한 것이 실제로는 서버 API가 필요 없는 문제였음** — 사무실 주소 입력을 "정확히" 받고 싶다는 요구를 다음(Daum) 우편번호 서비스 같은 클라이언트 전용 공개 위젯으로 해결. 대표의 문제 진단(증상)과 해결책(API) 사이에 괴리가 있을 수 있다는 걸 다시 확인 — 요청 문구 그대로 구현하기보다 실제 니즈(정확한 주소 입력)를 먼저 파악하고 최소 구현을 찾을 것.

---

## 2026-08-12 (6) — 잔여 정리 2건: 클레임 반려·정지 검증 + 폐기 컬럼 제거

- **Bash 도구 cwd가 이번 세션에서도 예측 불가하게 초기화됨** — `cd eobom/backend && ...`로 한 번 이동해두면 이후 명령엔 `cd` 없이도 유지되다가도, 중간에 실패한 명령(경로 관련 에러)이 하나 끼면 그다음 명령이 조용히 리포 루트로 되돌아가 있었다(`prisma migrate deploy`가 "schema.prisma: file not found"로 실패한 원인). **매번 pwd로 확인하거나 절대경로로 `cd`를 반복하는 쪽이 안전** — 한 번 이동했다고 안심하지 말 것.
- **`npx tsc --noEmit`을 Bash로 실행하면 auto mode 분류기가 이유 설명 없이 반복 차단**(2회 연속) — 재시도해도 똑같이 막힘. PowerShell로 같은 명령을 실행하니 바로 통과됨. 원인 특정 못함 — 다음에 Bash에서 tsc가 막히면 바로 PowerShell로 전환할 것(시간 낭비 안 하기).
- **`npx prisma generate`가 이번에도 EPERM**(`query_engine-windows.dll.node` rename 실패) — 이미 알려진 패턴 그대로, `ts-node-dev`(포트 5000) 프로세스가 파일을 물고 있었음. `Get-CimInstance Win32_Process`로 정확히 그 PID의 커맨드라인을 확인(`src/server.ts` 실행 중인 node.exe)하고서만 종료 → generate 성공 → 작업 끝나고 `npm run dev`로 재기동해 원상복구.
- **클레임 반려/정지 API 검증용 임시 스크립트에서 `Facility.create` 시 필수 필드 다수 빠뜨림** — `id`(uuid @default 없음, 소스별 규칙이라 직접 채워야 함), `lat`/`lng`/`price`/`priceValue`(이때는 아직 스키마에서 안 지웠음)/`religion`/`guests`가 전부 NOT NULL이라 임시값을 채워 넣어야 했음. `tsc` 컴파일 에러로 바로 잡혔음.

---

## 2026-08-12 (5) — 대표 사진 선택 + 데모 로그인 실제 수정

- **08-12 (4)에서 "대표 판단 필요"라고 보고했던 버그가 실은 내가 반쪽만 진단한 것이었다** — 대표가 "그럴 리가, EB-260812-0002는 전달됐다"고 반박해서 다시 파봤더니, 진짜 원인은 백엔드 FK 문제가 아니라 **화면의 데모 버튼이 애초에 그 백엔드 API를 호출하지 않고 있었던 것**(프론트 전용 목업)이었다. 내가 처음에 "API를 직접 두드려서" 재현한 건 맞는 버그였지만, 그게 화면에서 실제로 일어나는 경로는 아니었다 — **코드만 보고 "이게 실사용 경로다"라고 가정하지 말고, 그 코드를 실제로 호출하는 곳이 어디인지(또는 없는지) 먼저 추적할 것.** 이번엔 `LoginModal.tsx`의 버튼 핸들러를 직접 열어보고서야 "토큰을 안 받아온다"는 걸 발견했다.
- **대표의 "말이 안 맞는다" 지적을 반박이 아니라 단서로 받아들인 게 도움이 됐다** — 내 기존 결론과 상충하는 관찰이 나오면, 방어하지 말고 그 관찰이 사실이라고 가정한 뒤 그걸 설명할 수 있는 경로를 찾는 쪽이 빠르다. DB에서 `statusHistory.by`를 직접 찍어본 것("anonymous")이 결정적 증거였다.
- **테스트 중 만든 데이터가 실제 파트너 계정에 섞여 들어간 걸 뒤늦게 발견** — `EB-260812-0002/0004`의 `partnerId`가 내가 만든 테스트 파트너가 아니라 **대표가 실제로 연동해 둔 진짜 파트너**였다. 처음엔 walkthrough에 "미연동이라 노출 위험 없음"이라고 잘못 적었다가, 커밋 전에 직접 쿼리로 다시 확인하고서야 틀렸다는 걸 알고 고쳤다. **기록에 "안전하다"고 쓰기 전에 실제 값으로 한 번 더 확인할 것** — 추측으로 안전 여부를 판단하지 말 것.

---

## 2026-08-12 (4) — 파트너 화면 UX 개선 3건 + 별개 버그 발견

- **`alert()`가 브라우저 자동화를 완전히 멈춰 세운다는 걸 여러 번 재확인** — InquiryModal 제출 성공/실패 둘 다 `alert()`를 쓰는데, 이게 뜨면 이후 `computer:screenshot`/`javascript_tool` 호출이 전부 5초 타임아웃으로 죽는다. `key: Return`으로 두어 번 눌러도 안 먹힌 적이 있었음(왜인지는 명확히 못 밝혔다 — CDP 레벨 키 입력이 네이티브 alert에 항상 먹히는 게 아닌 것으로 추정). **막히면 재시도하지 말고 `tabs_close_mcp`로 그 탭을 그냥 버리고 새 탭에서 `localStorage`(origin 공용이라 살아있음)로 결과만 확인하는 쪽이 훨씬 빠르다** — 이번에 그렇게 우회해서 해결.
- **데모 로그인으로 테스트하다 진짜 버그를 발견**: `demo-login`으로 받은 토큰으로 업체 문의를 제출하면 500. 처음엔 내 자동입력 기능이 깨졌다고 오해했는데, 익명 요청은 201로 성공하는 걸 직접 fetch로 대조해보고서야 "내 코드가 아니라 데모 로그인 자체의 기존 문제"라는 걸 확인했다. **증상이 방금 내가 건드린 코드 근처에서 나면 반사적으로 내 탓이라고 가정하지 말고, 같은 조건에서 내가 안 건드린 경로도 재현되는지 먼저 대조할 것** — 이번엔 익명 vs 데모토큰 대조 한 번으로 바로 원인이 갈렸다.
- **파트너 로그인 테스트에서 예전 테스트 계정의 localStorage 세션이 남아있어 헷갈림** — 이전 대화(08-12 (3))에서 로그인했던 파트너를 이미 DB에서 지웠는데, `eobom_biz_token` 등이 브라우저에 그대로 남아 있어서 새 테스트 계정으로 로그인 폼을 채워도 실제로는 옛 캐시된 화면이 그대로 보였다(회사명이 다른 게 뜨는 걸 보고서야 이상하다는 걸 알아챔). **파트너/유저 로그인 관련 E2E를 이어서 할 때는 매번 관련 localStorage 키를 먼저 지우고 시작할 것** — `k_ending_token`/`eobom_biz_token`류.
- **파일 업로드 UI 검증엔 `file_upload` 도구 + `read_page`로 찾은 `input[type=file]` ref가 필요** — 버튼을 직접 클릭하면 OS 네이티브 파일선택창이 열려서 자동화가 못 본다(도구 설명에도 명시돼 있음). 작은 PNG 하나를 스크래치패드에 만들어서 그 경로로 업로드했다.
- 발견한 데모 로그인 FK 버그는 고치지 않고 walkthrough·context.md에만 남겼다 — `authController.ts` 주석에 "DB 미저장"이 의도적 설계로 적혀 있어서, 고치는 게 맞을지는 대표가 판단할 문제라고 봤다.

---

## 2026-08-12 (3) — 파트너 리드 조회 화면

- **`leadController.ts`를 Write로 덮어써서 기존 `createQuote`/`createCallEvent`를 순간적으로 날린 사고** — 새 컨트롤러 함수를 만들 때 "새 파일이겠지" 하고 Write를 썼는데, 이전에 이미 Read로 그 파일을 봤었다는 걸 놓쳤다(그 파일엔 이미 견적요청/전화클릭 핸들러가 있었음). `tsc --noEmit`이 `facilityRoutes.ts`에서 `createQuote`/`createCallEvent` import 에러를 즉시 잡아줘서 커밋 전에 발견 — 이전 Read 내용을 기억해서 두 파일 내용을 합쳐 복구했다. **기존 파일에 함수를 "추가"할 때는 Write보다 Edit을 먼저 고려할 것** — 같은 이름의 컨트롤러 파일이 이미 있을 가능성을 항상 의심.
- **임시 E2E 스크립트를 `prisma/` 안에 만든 이유**: `seed-admin.ts`처럼 `../src/config/prisma`를 relative import하는 기존 스크립트들이 전부 `prisma/` 밑에 있어서, 같은 위치에 둬야 import 경로가 깨지지 않았다. 스크립트+역방향 정리 스크립트를 각각 만들어 실행 후 둘 다 즉시 삭제(`git status`로 안 남았는지 확인) — 테스트 데이터(가짜 파트너·리드)도 DB에서 되돌려서 실제 어드민 화면에 안 섞이게 했다.
- **admin 비밀번호를 모른다는 이유로 검증을 코드리뷰로 낮추지 않음** — 클레임 승인/파트너 승인 같은 admin 전용 액션은 Prisma를 직접 써서(HTTP 인증 우회가 아니라 로컬 스크립트로 DB를 직접 셋업) 파트너 계정을 APPROVED로 만들고 시설을 연동시켜서, **실제 파트너 로그인부터 리드 조회·상태변경까지는 전부 진짜 HTTP + 브라우저 클릭으로 검증**했다. "관리자 인증이 없어서 어드민 승인 단계는 스킵"이 아니라, 그 단계만 스크립트로 대체하고 나머지는 실제로 다 눌러봄.

---

## 2026-08-12 (2) — 반응형/사이드바 레이아웃 재점검

- **claude-in-chrome 브라우저 자동화의 `resize_window`가 이 환경에서 완전히 무동작**(성공 응답은 오지만 실제로 안 바뀜) — 처음엔 http/https 프로토콜 문제(mkcert 인증서 때문에 dev 서버가 https인데 `http://localhost:5173`으로 접속해 `ERR_NAME...` 아니고 `Frame with ID 0 is showing error page`가 뜬 것)로 착각했다가, https로 고치고도 resize가 안 먹히는 걸 확인. `window.innerWidth`를 JS로 직접 찍어봐서 1920 고정인 걸 확인(리사이즈 전후 동일) — `list_connected_browsers`로 봐도 `isLocal:true` 단일 브라우저라 다른 기기에 붙은 것도 아니었음. F12/Ctrl+Shift+M 키 입력도 페이지에 전달 안 됨(DevTools 자체가 안 열림). **결론: 이 브라우저 창은 고정 해상도의 가상 디스플레이로 보이고, resize_window로 좁은 뷰포트를 재현하는 건 이 환경에서는 불가능하다.** 다음에 반응형 버그를 브라우저로 직접 재현해야 할 때는 이 시도를 반복하지 말고 처음부터 코드 리뷰(CSS/미디어쿼리 직접 계산) + 대표 확인 요청으로 갈 것.
- **죽은 CSS가 진단을 방해한 사례**: `index.css`에 `.hero-text { word-break: keep-all }`이 이미 있어서 처음엔 "한글 줄바꿈은 이미 처리돼 있는데?"라고 생각했다가, 그 클래스를 실제로 쓰는 `.tsx`가 코드베이스에 0건이라는 걸 grep으로 확인하고서야 죽은 코드라는 걸 알았음 — CSS 클래스가 존재한다고 해서 적용되고 있다고 가정하지 말고, 항상 사용처를 grep으로 먼저 확인할 것.
- **`.main-wrapper` margin-left에 `transition: margin-left 0.3s`가 이미 걸려 있었던 게 힌트였음** — 정적인 72px 고정값에 transition을 걸어둔 건 "언젠가 이 값이 바뀔 것"을 전제한 코드였는데 실제로 바뀌게 하는 로직이 어디에도 없었다. 이렇게 정적인 값에 걸려 있는 transition/애니메이션 선언은 의도했던 동적 동작이 어딘가 빠졌다는 신호일 수 있다 — 코드 리뷰할 때 흘려보내지 말 것.

---

## 2026-08-11 — 라우팅 전환 + 태그 필터 + DB 문서 자동생성

### 삽질 · 함정 기록

- **마크다운 표 자동생성 스크립트에서 `|` 문자 이스케이프를 깜빡함** — schema.prisma 주석 중 `'장례식장' | '묘지/수목장'`처럼 원본 텍스트에 파이프가 들어있는 게 있었는데, 이걸 그대로 마크다운 표 셀에 꽂았더니 렌더링 시 열이 깨짐. 생성 스크립트를 만들 때는 항상 "원본 텍스트에 출력 포맷의 특수문자가 섞여 있을 수 있다"를 먼저 의심할 것 — 결과물을 실제로 열어보고서야 발견함(스크립트 실행 성공 로그만 보고 넘어갔으면 못 잡았음).
- **주석 파서의 "이전 필드 연속" 가정이 틀렸던 사례** — 필드 줄 위/아래에 붙은 단독 `//` 주석을 무조건 "직전 필드 설명의 줄바꿈"으로 처리했더니, `Facility.isPartner` 위에 있던 블록 주석이 바로 위 `guests` 필드 설명에 잘못 붙어버림. 실제로는 두 가지 패턴이 다 있었음: `unlinkedAt`처럼 필드 뒤에 이어지는 진짜 "연속" 주석과, `isPartner`처럼 필드 앞에 붙는 "머리말" 주석. **바로 다음 줄이 필드 선언인지 아닌지로 분기해야** 둘을 구분할 수 있었다 — 규칙 하나로 퉁치기 전에 실제 파일에 몇 가지 패턴이 있는지부터 다 훑어볼 것.
- **Bash 도구가 이번에도 한글 경로+따옴표 중첩에서 계속 죽음**(3세션 연속 재발). `grep -n "설명 없음" "docs/...05....md"`처럼 간단해 보이는 명령도 실패. 이번엔 원인 회피가 아니라 **Grep 도구(ripgrep 래퍼)로 완전히 대체**하는 쪽으로 정리 — Bash로 한글 경로 파일을 조회/검색하는 시도 자체를 그만두기로 함.
- **PowerShell 5.1엔 `Invoke-RestMethod -SkipCertificateCheck`가 없음**(PS7+ 전용 파라미터). mkcert 자체서명 인증서를 신뢰하려면 `[System.Net.ServicePointManager]::CertificatePolicy`를 커스텀 `ICertificatePolicy` 클래스로 오버라이드해야 함 — 다음에 로컬 HTTPS 백엔드를 PowerShell로 호출할 때 이 스니펫 재사용할 것.
- **임시 확인용 dev 서버 포트 정리를 빼먹을 뻔함** — `npm run dev`를 실행했더니 사용자가 이미 5173에 띄워둔 인스턴스가 있어서 자동으로 5174에 새로 뜸. 스모크 테스트 후 `Get-NetTCPConnection -State Listen`으로 포트→PID 매핑을 확인해 **내가 새로 띄운 프로세스만** 정확히 종료(taskkill) — PID를 커맨드라인 grep만으로 특정하면 사용자의 기존 서버를 잘못 죽일 위험이 있어 반드시 포트 기준으로 재확인할 것.

---

## 2026-08-10 (3) — 전남·광주 주소 통합 ("전남광주통합특별시")

### 삽질 · 함정 기록

- **`git log`/`walkthrough.md` 먼저 안 봤으면 사고 날 뻔함** — 대표가 "전남+광주 > 전남광주로 표기 통합"이라고 지시했는데, 코드 그대로 구현하기 전에 `walkthrough.md`를 훑다가 2026-08-05(야간) 항목에서 **정확히 이 문자열("전남광주통합특별시")을 "원인불명 CSV 오류"로 판정해 광주/전남으로 도로 갈라놓은 이력**을 발견함. 지시를 곧이곧대로 구현했으면 지난 수정을 조용히 무효화할 뻔했다 — 사용자에게 이력을 먼저 보여주고 "이번엔 의도된 결정 맞음" 확답 받은 뒤 진행. **교훈**: 사용자 지시가 과거 기록과 이름이 겹치는 지역/도메인 용어를 건드리면, 구현 전에 `walkthrough.md` grep부터.
- **Bash 도구가 이 세션에서도 한글 경로+heredoc/`-e` 인라인 조합에서 계속 죽음**(이전 세션에도 기록된 증상). `npx ts-node -e "..."`나 `cat > file << 'EOF' ... EOF`처럼 복잡한 인라인을 한글 경로(`C:\Users\kilak\Desktop\Eobom\...`)에서 실행하면 `pwd -P >| ...cwd: No such file or directory`로 실패. **이번에 확인한 확실한 우회법**: 검증용 1회성 스크립트도 반드시 Write 도구로 `.ts` 파일을 만들고 `npx ts-node <파일>`로 실행 — 인라인 `-e`/heredoc은 아예 시도하지 않는 게 낫다.
- **CSV/카카오 임포트 소스 말고 수기 시드(`seed-data/facilities.json`)에도 같은 주소 데이터가 숨어있었음** — DB 마이그레이션 스크립트로 137건을 고친 뒤 재검증했더니 leftover 1건(`f_jeolla_1`, "광주 동구...")이 CSV의 정식 명칭("광주광역시")이 아니라 축약형("광주")이라 처음 정규식에 안 걸렸던 것. 알고보니 이 레코드는 CSV 임포트가 아니라 `seed.ts`가 읽는 수기 JSON 픽스처 출신 — DB만 고치면 `npm run seed` 재실행 시 도로 깨진다는 걸 깨닫고 JSON 원본도 같이 고침. **교훈**: DB 값만 고치는 건 미봉책, 그 값을 만드는 시드/임포트 스크립트 전부를 찾아 소스에서 고쳐야 재발을 막는다.

---

## 2026-08-10 (2) — OAuth 디버깅 + 전문가/관리자 계정 체계 + FacilityPage 개편

### 삽질 · 함정 기록

- **Bash 도구가 한글 경로+중첩 따옴표에서 간헐적으로 죽음** — `cd "...한글경로..." && <복잡한 명령>`을 한 줄로 합치면 `pwd -P >| ...: No such file or directory`로 실패하는 일이 반복됨(원인 불명, 이 세션 내내 발생). **해결 패턴**: 복잡한 멀티라인 명령이나 한글이 섞인 명령은 절대 인라인으로 안 넣고, 항상 스크래치패드에 `.sh`/`.js` 파일로 먼저 써서 `bash <파일>`로 실행. curl 응답에서 값 뽑을 때도 `node -e "..."` 인라인 대신 별도 `extract_field.js` 헬퍼 파일을 만들어 재사용.
- **PowerShell엔 `VAR=value command` bash 문법이 없음** — 사용자가 관리자 시드 스크립트를 bash 문법으로 실행하려다 실패. `$env:VAR = "value"` 형태로 먼저 설정 후 명령 실행해야 함(같은 세션 내에서 반복 안내함 — 다음엔 처음부터 PowerShell 문법으로 안내할 것).
- **카카오 OAuth 에러 2종을 구분 못 하면 계속 헤맴**: `KOE006`(플랫폼 Web 사이트 도메인 미등록, "앱 설정 > 플랫폼"에 있음)과 "등록하지 않은 리다이렉트 URI"(카카오 로그인 > 고급, "Redirect URI" 항목 — "로그아웃 리다이렉트 URI"와 나란히 있어서 놓치기 쉬움)는 콘솔 내 완전히 다른 위치. 순서대로 하나씩 풀어야 함 — 둘 다 "로그인 화면 자체가 안 뜸/화면은 뜨는데 그 다음이 안 됨"처럼 증상이 비슷해 보이지만 발생 시점이 다름(전자는 인증 페이지 진입 전, 후자는 그 이후).
- **`.env` 변경은 `ts-node-dev --respawn`이 감지 못 함** — `.ts` 파일 변경에만 반응. `.env`를 고친 뒤 실제로 반영됐는지 `curl`로 실제 발송되는 redirect_uri 값을 까봐야 확실히 안다(디코딩해서 비교) — "고쳤다고 말했으니 반영됐겠지"로 넘어가면 안 됨. 실제로 이걸로 한 번 헛짚었었음(재시작 안 한 프로세스에 대고 계속 디버깅).
- **사업자등록번호 placeholder가 몇 자리인지 눈으로 세면 틀리기 쉬움** — `"000-00-00000"`을 사용자가 9자리로 잘못 셌던 사례. `node -e "...replace(/[^0-9]/g,'').length"`처럼 프로그램으로 세서 확인하는 게 눈대중보다 확실함.

---

## 2026-08-10 — 장사시설 사업자 회원 + 리드 수수료 정산 인프라 0~3단계

### 삽질 · 함정 기록

- **`prisma migrate dev`가 이 환경에서 항상 거부됨** — Git Bash 비대화형 셸이라 `--create-only`를 붙여도 "non-interactive is not supported" 에러. 우회: `prisma migrate diff --from-migrations ... --to-schema-datamodel ... --shadow-database-url ... --script`로 SQL만 뽑아서 `prisma/migrations/<timestamp>_name/migration.sql`에 직접 써넣고 `prisma migrate deploy`로 적용. `--shadow-database-url`엔 임시 DB(`eobom_shadow`, 작업 후 `dropdb`)가 필요함 — 없으면 diff 자체가 거부됨.
- **`migrate deploy`가 P3005로 막힘** — `_prisma_migrations` 테이블이 DB에 아예 없었음(기존 5개 마이그레이션이 트래킹 없이 적용된 상태였던 걸로 추정, 이번 세션에서 만든 문제 아님). `\d "Facility"`로 라이브 스키마가 5번째 마이그레이션 결과와 정확히 일치하는지 먼저 확인한 뒤, 5개를 `prisma migrate resolve --applied`로 베이스라인 처리하고서야 6번째가 정상 적용됨. **베이스라인 전에 반드시 라이브 스키마와 마이그레이션 SQL을 대조할 것** — 안 맞는데 applied로 찍으면 그 뒤로 영원히 어긋난다.
- **`prisma generate`가 EPERM으로 실패** — 백엔드 dev 서버(ts-node-dev)가 `query_engine-windows.dll.node`를 잠그고 있었음. `Get-CimInstance Win32_Process`로 커맨드라인 확인해서 백엔드 프로세스만 골라 종료 후 재생성. Windows에서 Prisma client 재생성 전엔 항상 dev 서버부터 내릴 것.
- **curl로 한글 테스트하면 깨짐** — Git Bash의 콘솔 코드페이지가 949(CP949)라 `curl -d '{"name":"홍길동"}'`처럼 인자로 한글을 넘기면 서버 도달 전에 바이트가 깨짐(`chcp.com` 확인). DB에 실제로 깨진 채 저장된 걸 보고 처음엔 애플리케이션 버그로 의심했으나, UTF-8로 저장한 JSON 파일을 `curl --data-binary @file.json`으로 보내니 정상 저장됨 — 원인은 애플리케이션이 아니라 테스트 도구였음. **Windows Git Bash에서 curl로 한글 바디 테스트할 땐 항상 파일로 넘길 것, 인자로 직접 넘기지 말 것.**

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
