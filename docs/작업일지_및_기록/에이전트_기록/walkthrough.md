# 🧭 walkthrough.md — 구현 완료 보고 (Gemini ↔ Claude 교차 검토용)

> `claude_tasks.md`(살아있는 실무 로그)에서 완료된 사이클만 추려 정제한 문서.
> Gemini가 "기획대로 구현됐는지" 확인하는 용도. 최신 항목이 위로 오게 기록.
> 2026-08-07부터 5개 필드 고정 형식 사용 (`.harness/record.md` §1. 2026-08-10 이전엔 `roles.md` §3에 있었음).

---

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

<!-- Gemini 판정 1줄: ✅통과 / ❌반려(사유) / 🔄스펙갱신(고친 문서) -->

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

<!-- Gemini 판정 1줄: ✅통과 / ❌반려(사유) / 🔄스펙갱신(고친 문서) -->

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

<!-- Gemini 판정 대기 -->

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

<!-- Gemini 판정 대기 -->

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

<!-- Gemini 판정 대기 -->

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

<!-- Gemini 판정 대기 -->

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

<!-- Gemini 판정 대기 -->

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

<!-- Gemini 판정 대기 -->

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

<!-- Gemini 판정 대기 -->

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

<!-- Gemini 판정 대기 -->

---

## 2026-08-26 (78) | [Sonnet] Render 배포본 CLOVA STT 환경변수 누락 진단·해소

- **근거 스펙**: 스펙 없음 — walkthrough(77)의 "🔴 미검증: CLOVA_STT_ENABLED=true 실측" 후속
  진단 작업. 사용자가 "유족메시지 보관함 > 업로드는 구현 안됨"이라고 보고해 시작.
- **건드린 파일**: `render.yaml` — `CLOVA_STT_ENABLED`·`CLOVA_SPEECH_INVOKE_URL`·
  `CLOVA_SPEECH_SECRET` 3개를 `sync: false`로 추가(값은 안 들어감, Render 대시보드 문서화용).
- **결과**:
  - 1차 증상(로컬)은 버그가 아니라 의도된 게이팅이었다 — `GET /api/stt/status`가 로컬에서
    `{enabled:false}`를 반환해 업로드 UI가 정상적으로 숨겨진 것(06-04 §6.4-9-5).
  - 사용자가 로컬 `.env`를 고치고 재시작했다는데도 여전히 `false` — `netstat`로 5000번 포트를
    잡은 프로세스(PID)의 시작 시각(`wmic`)이 `.env` 저장 시각보다 15분 앞서 있음을 확인해,
    `ts-node-dev`가 `.env` 변경은 감시하지 않아 실제로는 재시작되지 않았음을 진단(코드 저장
    자동재시작과 진짜 프로세스 재시작을 구분하지 못한 것).
  - 사용자가 실제로는 **배포본(Render)**을 확인 중이라고 정정 — `https://eobom-backend.onrender.com
    /api/stt/status`를 직접 curl해 여기서도 `false`임을 확인. `render.yaml`의 `envVars` 목록을
    읽어 `CLOVA_*` 3개가 **처음부터 아예 선언된 적이 없다**는 것을 근본 원인으로 특정 —
    로컬 개발 중 `.env`에만 넣고 Render Blueprint에 반영을 빠뜨린 것.
  - 사용자가 Render 대시보드에 3개 값을 직접 등록 → 재배포 후 `/api/stt/status` → `{enabled:true}`
    확인(`curl`). **사용자가 배포본에서 실제 m4a 업로드→텍스트 변환까지 실기기로 확인 완료** —
    walkthrough(77)에 남겼던 미검증 항목이 이걸로 해소됨.
- **편차**: 없음.
- **판정**: ✅통과 (Render 배포 환경변수 누락 해소, `/api/stt/status` 활성화 및 실기기 m4a 업로드→STT 변환 실측 확인 / `render.yaml` 동기화 완료)

---

## 2026-08-26 (77) | [Sonnet] 06-05 Phase B — 유족 메시지 보관함 저장 + STT 이관

- **근거 스펙**: `docs/06_엔딩노트_유언/06-05_유족메시지_보관함_도메인분리_기획서.md` §6(데이터 모델)·
  §8 Phase B(구현 단계) · `06-04_엔딩노트_보관함_실구현_기획서.md` §6.4-2(정정, 08-26)·§6.4-11(STT
  provider 재사용) — `[Claude:Opus]` 핸드오프 지시(2026-08-26).
- **건드린 파일**:
  - `eobom/backend/prisma/schema.prisma` — `EndingNote`·`FarewellMessage` 모델 신설, `User.endingNote`·
    `FamilyDesignation.farewellMessages` 역관계 추가
  - `eobom/backend/prisma/migrations/20260826072515_add_ending_note_and_farewell_message/` — 마이그레이션
  - `eobom/backend/src/controllers/farewellMessageController.ts` — 신설(list/get/create/update, 전부 본인 것만)
  - `eobom/backend/src/routes/farewellMessageRoutes.ts` — 신설
  - `eobom/backend/src/server.ts` — `/api/farewell-messages` 라우트 등록
  - `eobom/frontend/src/components/VoiceToTextInput.tsx` — 신설. `EndingNotePage.tsx`의 Ⓐ(파일 업로드)·
    Ⓑ(직접 녹음) STT UI를 그대로 추출
  - `eobom/frontend/src/components/FarewellMessageCard.tsx` — 신설. 수신자별 편지 목록(미리보기)+
    작성/수정 편집기, `VoiceToTextInput` 내장, 저장 전 확인 게이트(06-04 §6.4-5)
  - `eobom/frontend/src/pages/FarewellMessagePage.tsx` — Phase A 골격을 실제 저장(GET/POST/PATCH)으로 교체
  - `eobom/frontend/src/pages/EndingNotePage.tsx` — ⑨에서 Ⓐ·Ⓑ STT 코드 전부 제거(타이핑 전용으로 축소),
    고지 문구에 "마음을 전하고 싶으시면 유족 메시지 보관함을 이용해 주세요." 한 줄 추가
  - `eobom/backend/test-audio/`(`.gitkeep`·`README.md`) — 신설
  - `.gitignore` — `eobom/backend/test-audio/*` 무시 규칙 추가
  - `docs/00_핵심플랫폼/00-05_DB_요구사항_및_테이블_사전.md` — `node .harness/tools/generate-db-doc.js`
    재생성(모델 26개, 설명 없음 26개 — 신설 필드 주석 보강 후 30개→26개로 정리)
  - `eobom/backend/backups/eobom_pre_farewellmessage_20260826_162332.dump` — 마이그레이션 전 Supabase
    (운영) `pg_dump` 백업(458KB, TOC 684건, `pg_restore --list`로 정상 아카이브 확인)
- **결과**:
  - 로컬 Docker DB(`eobom_db`, 5433)에 `prisma migrate dev`로 마이그레이션 적용 완료. `npx tsc --noEmit`
    프론트/백엔드 각 0 에러. `npm run build`(frontend, vite)까지 통과. 백엔드 `npm run build`는 내부
    `prisma generate`가 사용자의 기존 dev 서버 프로세스가 잡고 있는 `query_engine-windows.dll.node`
    rename에서 EPERM으로 실패 — 코드 문제 아님(client 자체는 `prisma migrate dev` 시점에 이미 정상
    재생성되어 index.js/d.ts에 `EndingNote`·`FarewellMessage` 반영 확인됨). 사용자가 백엔드 dev
    서버를 재시작하면 해소된다.
  - 실행 중인 로컬 백엔드(포트 5000, HTTPS)에 실제 로그인 유저(`d3718f3e-201b-43dc-bc4b-4a9b938d2cd6`)
    JWT로 POST/GET/PATCH `/api/farewell-messages` 전부 실측: 작성→목록(미리보기)→단건조회(전문)→수정→
    재조회(수정 반영) 확인. `psql`로 DB 직접 조회해 `bodyEnc`가 `iv:authTag:ciphertext` 형태(평문
    아님)임을 확인. 남의 `recipientId`와 존재하지 않는 `recipientId` 둘 다 동일한 "받으실 분을 찾을
    수 없습니다" 404로 응답해 구분되지 않음을 확인.
  - Claude in Chrome으로 `https://localhost:5173/farewell-messages`·`/ending-note` 실제 렌더 확인:
    보관함 카드 목록·편지 미리보기·클릭 시 전문 로드→수정 편집기(취소/수정 저장) 정상 동작. 엔딩노트
    ⑨에는 마이크·업로드 UI가 전혀 없고 타이핑 textarea + 4대요건 체크 + 신규 고지 문구만 남은 것을
    스크린샷으로 확인.
  - 🔴 **미검증**: `CLOVA_STT_ENABLED=true`로 켠 로컬에서 실제 m4a 업로드→CLOVA 변환→편지 저장까지의
    전 구간은 이번 세션에서 실행하지 않았다. 플래그를 켜려면 `.env` 수정 + 백엔드 재시작이 필요해
    사용자 소관으로 남겨뒀다.
- **편차**:
  1. 스펙(§8 Phase B #6)은 컨트롤러·라우트만 언급했으나, 실제 편집 UX(수정 시 전문 로드)에는
    단건 조회가 필요해 `GET /api/farewell-messages/:id`(본인에게만 전문)를 추가했다 — §7.1
    완료판정 "목록은 미리보기까지만"과 상충하지 않고, 그 문장이 전제하는 "전문은 단건 조회"를
    구현한 것이다.
  2. 삭제(DELETE) API는 만들지 않았다 — 완료판정이 "저장·수정"까지만 요구했고, 06 도메인은
    로그·보존 원칙이 엄격해 삭제 정책이 정해지지 않은 채로 임의로 만들지 않는 것이 안전하다고
    판단했다.
  3. 편지 1건당 길이 상한을 20,000자로 임의 설정했다(§10 항목4 "두되 넉넉히"만 있고 숫자는 미확정
    — 정식 값은 사람 확정 사항으로 남는다).
- **다음 에이전트가 알아야 할 것**:
  - 로컬 DB에 테스트 데이터 2건이 남아있다(`FarewellMessage` id `46a80859…`·`fd6a3b2a…`, 수신자
    `d4eb2235…`) — 기능 검증용으로 만든 것이라 배치 정리 때 같이 지울 것(사용자 지시: 테스트
    데이터는 발견 즉시 지우지 않고 나중에 한 번에 정리 — `[[feedback_batch_cleanup_test_data]]`).
  - `eobom_pre_farewellmessage_20260826_162332.dump`는 이번 마이그레이션 직전 시점의 운영 Supabase
    스냅샷이다 — 다음 마이그레이션에는 새 시점 백업이 별도로 필요하다.
  - `CLOVA_STT_ENABLED=true` 실측(m4a→텍스트→편지 저장)은 아직 아무도 해보지 않았다 —
    `context.md` 블로커에도 동일하게 남겨둠.
  - 백엔드 `npm run build`가 이번 세션 종료 시점에 EPERM으로 실패한 상태일 수 있다 — 사용자가
    dev 서버를 재시작하면 사라지는 일시적 파일 잠금이며 코드 결함이 아니다.

- **판정**: ✅통과 (유족 메시지 보관함 DB 모델·마이그레이션·AES-256-GCM 암호화 저장 API 및 프론트 UI 구현 확인 / 엔딩노트 ⑨ 서식형 분리 정상 반영 / 후속 (78)을 통해 미검증 STT 실측 해소 확인)

---

## 2026-08-26 (76) | [Sonnet] STT Ⓐ 파일 업로드 실구현 — NCP CLOVA Speech

- **근거 스펙**: `docs/06_엔딩노트_유언/06-04_엔딩노트_보관함_실구현_기획서.md` §6.4-9(업로드 계약·
  파이프라인·provider 경계) · §6.4-11(NCP CLOVA Speech 확정·약관·동의 3종·환경변수·도메인 설정·
  m4a) — 2026-08-26 사장님 착수 지시. 사용자가 6개 항목으로 직접 지시.
- **건드린 파일**:
  - `eobom/backend/.env.example` — `CLOVA_SPEECH_INVOKE_URL`·`CLOVA_SPEECH_SECRET`·
    `CLOVA_STT_ENABLED` 자리표시자 3줄.
  - `eobom/backend/package.json` — `ffmpeg-static@5.3.0` 의존성 추가(npm 레지스트리에서 설치,
    Windows용 `ffmpeg.exe` 프리빌트 바이너리 자동 다운로드 확인).
  - `eobom/backend/src/config/uploadAudio.ts` — 신설. `multer.memoryStorage()`, m4a·mp3·wav
    허용, 20MB 상한.
  - `eobom/backend/src/services/sttProvider.ts` — 신설. `SttProvider` 인터페이스.
  - `eobom/backend/src/services/audioConvert.ts` — 신설. ffmpeg stdin→stdout 스트림 mp3 변환.
  - `eobom/backend/src/services/clovaSpeechProvider.ts` — 신설. `ClovaSpeechProvider implements
    SttProvider`.
  - `eobom/backend/src/controllers/sttController.ts` — 신설. `getSttStatus`·`transcribeAudio`.
  - `eobom/backend/src/routes/sttRoutes.ts` — 신설.
  - `eobom/backend/src/server.ts` — `/api/stt` 라우트 마운트.
  - `eobom/frontend/src/pages/EndingNotePage.tsx` — ⑨ 섹션에 업로드 UI 추가(state·핸들러·JSX),
    `BACKEND_URL` import 추가.
  - `docs/작업일지_및_기록/에이전트_기록/walkthrough.md`(이 항목)·`claude_tasks.md`·`260826.md`·
    `.harness/memory/context.md`.
- **결과**:
  - **환경변수(항목1)**: `.env.example`에 자리표시자만(실값 없음). 개발자가 이미 `eobom/backend/.env`에
    실제 Invoke URL·Secret·`CLOVA_STT_ENABLED=false`를 넣어둔 상태를 확인(값은 읽지도 커밋하지도
    않음, `.env`는 `.gitignore`로 이미 추적 제외).
  - **서버 파이프라인(항목2)**: `multer.memoryStorage()`(기존 `config/upload.ts`의 diskStorage
    재사용 안 함, 신규 `config/uploadAudio.ts`). 컨트롤러는 `facilityMediaController.ts`와 같은
    패턴으로 multer를 라우트가 아니라 컨트롤러 안에서 수동 호출해, 플래그·인증 체크가 업로드
    파싱보다 먼저 돈다. `SttProvider` 인터페이스(`transcribe(audio: Buffer, mimeType: string):
    Promise<string>`)로 경계를 두고 `ClovaSpeechProvider`가 구현. m4a류 mimetype
    (`audio/mp4`·`audio/x-m4a`·`audio/m4a`·`audio/aac`)은 CLOVA의 실제 m4a 지원 여부와 무관하게
    항상 `audioConvert.ts`(ffmpeg-static, `spawn` stdin/stdout 파이프, `-i pipe:0 ... pipe:1`)로
    mp3 변환 후 업로드 — 임시 파일 없음. `eobom/backend/uploads/`에 절대 쓰지 않음(memoryStorage
    자체가 디스크에 안 쓴다).
  - **🔴 실측 확인 3건(항목3, scratchpad 테스트 스크립트 + 실제 커밋 코드 `ClovaSpeechProvider`를
    `ts-node`로 직접 호출해 재확인 — 개발자가 이미 넣어둔 실 Invoke URL/Secret으로 라이브 호출)**:
    - **① Object Storage 결과 경로 낙하 여부** — ✅ **떨어지지 않음, 실측 확인.**
      `completion:'sync'` + 직접 업로드(`/recognizer/upload`) 조합에서 응답 JSON이
      `"resultToObs":false`를 그대로 echo했다(요청에서 명시하지 않았는데도 이 조합의 기본값이
      false). 버킷을 NCP 콘솔에서 직접 열어보지는 못했지만(콘솔 접근 권한 없음), API가 스스로
      보고하는 처리 설정으로 확인했다 — 수명주기 즉시 삭제 규칙은 그래서 **필수는 아니지만
      추가 안전망으로 걸어두는 것을 권장**(문서가 이미 권고한 대로).
    - **② m4a 지원** — ✅ **CLOVA의 실제 지원 여부를 확인할 필요 자체가 없어짐.** m4a를 항상
      ffmpeg로 mp3 변환 후 올리는 설계라, 실제 m4a 컨테이너 파일(ffmpeg `-c:a aac` 생성) →
      `convertToMp3()`(stdin/stdout 파이프) → mp3 15,776바이트 → CLOVA 업로드 → `200
      COMPLETED`까지 실측 재현했다.
    - **③ KMS 버킷 CLOVA 접근 권한** — 🟡 **①의 결과로 무의미해짐(moot).** `resultToObs:false`
      라 애초에 버킷에 접근을 시도하지 않으므로 권한 문제가 발생할 여지 자체가 없다. 다만
      "버킷에 아무것도 안 쌓이는지"를 NCP 콘솔에서 눈으로 한 번 확인하는 건 여전히 권장(내가
      할 수 없는 부분).
    - **🔴 실측 중 발견해 실제 코드에 반영한 버그 2건(문서에 없던 것)**: (a) `params`를
      `Blob(...,{type:'application/json'})`로 감싸 보내면 CLOVA가 항상
      `"Invalid params: params"` 400을 반환한다 — **일반 문자열 필드**(`form.append('params',
      JSON.stringify(...))`)로 보내야 정상 파싱된다. (b) 콘솔에서 "화자 인식 끔"으로 설정해도
      요청 파라미터에 `diarization:{enable:false}`를 **명시적으로 넣지 않으면** `"speaker
      detect is off"` 400이 난다 — 콘솔 설정이 요청 기본값에 자동 반영되지 않는다. 둘 다 고치고
      나서 실제 CLOVA 응답 스키마(`text`·`segments[].text`·`result:'COMPLETED'`)까지 실측으로
      확인해 파싱 로직을 맞췄다.
  - **업로드 계약(항목4)**: m4a·mp3·wav, 최대 20MB(클라이언트·서버 양쪽 검증). 선택 전 화면에
    포맷·용량 상한과 "무료 한도가 짧으니 10~30초로 먼저 테스트" 안내. 업로드/변환 단계는
    `XMLHttpRequest`(fetch는 업로드 진행률을 못 줌)로 `xhr.upload.onload` 이후를 "글로 바꾸는
    중…"으로 구분 표시.
  - **UI(항목5)**: 새 화면 없음 — `EndingNotePage.tsx` 기존 ⑨ 섹션 안, Ⓑ(직접 녹음) 바로 아래에
    구분선을 두고 삽입. `sttUploadEnabled`(마운트 시 `GET /api/stt/status` 조회)가 false면 블록
    전체 미렌더 — provider·플래그와 무관하게 버튼만 뜨는 사고 방지(서버도 플래그 꺼지면
    `/transcribe`가 404를 반환해 이중 방어). 동의 체크박스는 컴포넌트 상태로만 존재해 **매번**
    false로 시작(세션 간 기억 없음), 지정된 문구를 순서 그대로(불리한 문장 먼저) 사용, 바로
    아래에 "동의하지 않으셔도 직접 녹음과 직접 입력으로 초안을 만드실 수 있습니다" 배치. "본인
    음성만" 명시 + 검증 약속 문구 없음. 정확도 보증 문구 전혀 없음. 성공 시 결과 텍스트를 Ⓑ와
    동일한 방식으로 `draftText`에 그대로 이어붙이고(다듬지 않음) `draftConfirmed`를 리셋 —
    이후 편집·4대요건 안내·인쇄·복사·`.txt`·미저장 고지는 전부 기존 로직 재사용. 실패·타임아웃
    시 에러 메시지에 "직접 녹음이나 위 입력창에 직접 입력해 이어서 작성해 주세요"를 포함(이미
    같은 화면 위쪽에 그 입력 수단들이 있다).
  - **산출물 성격(항목6)**: 서명란·"유언장" 표현 추가 없음 — 기존 STT 섹션 하단의 4대요건
    안내·"직접 손으로 옮겨 쓰십시오"·⑨ 사후 미전달 고지를 그대로 재사용(새 화면이 아니므로
    자동으로 상속됨). **저장(1-b)은 착수하지 않음** — `EndingNoteEntry` 모델·마이그레이션 전부
    미착수, `EndingNotePage.tsx:299`의 "이 초안은 저장되지 않습니다" 문구도 그대로 참이라
    손대지 않음.
  - **명령 재현**: `npx tsc --noEmit -p .`(frontend) 에러 0. `npx tsc --noEmit`(backend) 에러 0.
    `npm run build`(frontend) 통과. `npx ts-node --transpile-only`로 커밋될 실제
    `ClovaSpeechProvider`를 임시 스크립트(`src/__stt_manual_test.ts`, 검증 직후 삭제·미커밋)로
    직접 호출 → `"음성에서 인식된 내용이 없습니다"`(무음 사인파 입력이므로 기대한 정상 동작) —
    이는 인증·업로드·변환·응답 파싱 전 구간이 실제로 살아 있다는 증거다(실제 발화 정확도는
    마이크가 없는 환경이라 검증 불가, 아래 참고).
- **편차**:
  - 🔴 **문서(§6.4-11-6-2)의 "콘솔 도메인 설정(화자 인식 끔)이 이미 반영돼 있다"는 전제가
    실측으로 반증됐다** — 요청 파라미터에 `diarization.enable:false`를 명시하지 않으면 매
    요청이 400으로 거부된다. 콘솔 설정은 UI 표시값일 뿐 API 기본 동작에 자동 반영되지 않는
    것으로 보인다(정확한 사유는 NCP 쪽 사양이라 확인 대상으로 남긴다). 코드에는 명시적으로
    끄도록 반영했고, 이 발견 자체를 주석과 이 항목에 남긴다.
  - CLOVA 응답의 정확한 필드 스키마(`params` 인코딩 방식 포함)는 문서에 없어 **실측으로 직접
    확정**했다 — `AGENTS.md` §6(빨리 바뀌는 정보는 확인 전 단정 금지)에 따라 구현 전 문서만
    보고 추측하지 않고 실제 API 호출로 검증한 뒤 코드를 확정했다.
  - 업로드 UI에서 "업로드 중"과 "변환 중"을 구분하기 위해 `fetch` 대신 `XMLHttpRequest`를
    썼다 — 스펙이 요구한 3단계 구분(§6.4-9-3)을 만족하려면 업로드 진행률 이벤트가 필요했고,
    `fetch`는 요청 바디 업로드 진행률을 아직 제공하지 않는다.
- **다음 에이전트가 알아야 할 것**:
  - 🔴 **실제 한국어 발화 정확도는 검증하지 못했다** — 이 환경엔 마이크·음성 합성 수단이
    없어 무음 사인파로만 파이프라인(인증·업로드·변환·파싱)을 확인했다. 개발자가 본인 음성으로
    실제 파일을 올려 텍스트 품질을 확인해야 한다(§6.4-9-8-3 "검증은 개발자 본인 음성으로만"과도
    합치함 — 무료 월 15분 한도 안에서 10~30초 샘플로).
  - `CLOVA_STT_ENABLED`는 로컬 `.env`에서 `false`로 그대로 뒀다(사용자 확인) — 실사용자에게
    열려면 §6.4-11-6 ⓐ(이용자 동의 화면, 이번에 구현 완료)만으로 충분한지, 아니면 `00-19`
    처리방침에 학습 활용·7일 보관·CLOVA 위탁을 실제로 반영(§6.4-11-5 #3, `[Opus]` 소관)한
    뒤에 켤지는 사람의 판단이 필요하다 — 코드는 준비됐지만 **플래그를 켜는 결정은 하지 않았다.**
  - `User.sttDataAgreedAt`(동의 증적)은 이번에 추가하지 않았다 — 스펙(§6.4-11-6-1)이 "실사용
    공개 시점에 1-b(텍스트 저장)와 함께"로 명시했고, 1-b 자체가 다음 사이클이라 지금은 필요
    없다. **플래그를 켜기 전에 반드시 먼저 추가할 것** — 개인정보보호법상 동의 입증책임은
    처리자에게 있다(§6.4-11-6-1 원문 경고).
  - 실제 라이브 API 호출로 CLOVA 서버 쪽에 요청 로그(및 §6.4-11-2의 7일 보관 규칙에 따라
    변환된 텍스트 — 이번엔 전부 빈 문자열)가 몇 건 남았다 — 개발자 본인 계정·본인 테스트용
    도메인이라 문제는 아니지만, 무료 월 15분 한도 중 합계 약 15~20초를 이번 검증에 썼다.

- **판정**: ✅통과 (NCP CLOVA Speech STT 파일 업로드 파이프라인 실구현, 메모리 스트림 변환, 파라미터 규격 보정 및 예외 처리 완료 / 이후 (78)에서 실기기 변환 실측까지 종결 확인)

---

## 2026-08-26 (75) | [Sonnet] 홈 섹션2 박스③④(추모관·파트너) 높이·헤더 크기를 박스①②와 통일

- **근거 스펙**: 스펙 없음 — 사용자가 대화에서 직접 지시. *"추모관 파트너의 마우스오버 하지
  않았을 때의 높이가 작음. 1,2 박스처럼 300px로 수정해줘. 또한 그에 맞게 박스 안의 내용 또한
  앞의 박스와 통일되어야 할거야."*
- **건드린 파일**:
  - `eobom/frontend/src/index.css` — `.entry-box-secondary`(200px) 삭제, `.entry-box-primary`
    (300px)로 흡수. 관련 주석 2곳 정정.
  - `eobom/frontend/src/components/home/EntryBoxes.tsx` — `box3Card`(추모관)·`box4Card`(파트너)
    의 `className`을 `entry-box-secondary`→`entry-box-primary`로, `BoxHeader`의 `size="sm"`
    (아이콘 48px·제목 1.3rem)을 제거해 기본값 `"lg"`(아이콘 64px·제목 1.5rem)로, 아이콘 glyph
    크기를 24→32로 — 박스①②(`box1Card`·`box2Card`)와 동일하게 맞춤.
- **결과**: 호버 전(collapsed) 상태의 박스③④ 카드 최소 높이가 200px→300px로 박스①②와 같아짐.
  `BoxHeader` 아이콘 원(48px→64px)·제목 폰트(1.3rem→1.5rem)도 동일해져, 헤더의 시각적 무게가
  4개 박스 전부 통일됨. 박스③(링크 입력+버튼)·박스④(파트너 로그인 행+안내문)의 **기능적
  내용은 그대로 유지** — 칩 목록(box1Keys·box2Keys)은 실제로 연결된 하위 도메인이 있는
  박스①②에만 있는 것이 맞아서 억지로 만들지 않았다(아래 편차 참고). `.entry-carousel-track`
  의 `align-items:flex-start` 관련 주석에서 이제 사라진 `.entry-box-secondary` 언급 제거.
  `npx tsc --noEmit -p .`·`npm run build`(frontend) 둘 다 통과, `dist/assets/index-BGNaAzuH.css
  16.06 kB`·`index-ovidmX-a.js 482.12 kB`(레이아웃/문자열 변경뿐이라 크기 변화 미미).
- **편차**:
  - 박스③④의 `RevealContent` 내부에 박스①②식 "칩 목록 + 자세히 보기 버튼(상단 보더)" 패턴을
    추가하지 않았다 — 지시가 "내용을 통일"하라고 했지만, 박스③(링크 입력창)·박스④(파트너
    로그인 행)는 이미 각자 실제 동작하는 기능 UI를 갖고 있어 칩 목록으로 바꿀 대상이 없다.
    "통일"을 헤더 크기·카드 높이(시각적 무게)로 해석했고, 기능이 다른 두 카드에 억지 칩을
    만들어 넣지는 않았다 — 사용자가 원하는 게 그 이상(예: 박스③④에도 하단 구분선+버튼 형태의
    풋터를 넣는 것)이라면 확인 후 추가할 수 있다.
- **다음 에이전트가 알아야 할 것**:
  - 🔴 **브라우저 실기동 미검증** — 로컬 dev 서버가 꺼져 있어(`localhost:5173` 000 응답) 캐러셀
    ①②③④ 페이지 전환·호버 펼침이 실제로 300px 기준으로 나란히 보이는지 눈으로 확인 못 했다.
    배포본(`eobom.vercel.app`)도 이번 커밋 반영 전 버전이라 대조 불가했다. 다음 확인 필요.
    이 세션은 dev 서버를 사용자 쪽에서만 기동하는 운용 방식이라 직접 띄우지 않았다.

- **판정**: ✅통과 (박스③④ 카드 최소 높이 300px 상향 및 BoxHeader size="lg" 통일 확인 / 이후 박스③④ 세로 중앙 정렬 스타일 보강까지 정합화 완료)

---

## 2026-08-26 (74) | [Sonnet] 발신번호 · 가족초대 카카오공유+성함대조 · 초대CTA · `06-05` Phase A

- **근거 스펙**: `00-14` §11-2(발신번호) · `00-27` §9.1-4·§9.1-4-1·§9.1-4-2·§9.1-4-3(2026-08-26
  사장님 확정, 카카오 공유·데스크톱 폴백·수락완료 CTA·성함 대조) · `06-05` §7·§8(Phase A 골격,
  2026-08-26 사장님 도메인 슬라이드 2개 분리 확정). 사용자가 5개 작업을 한 사이클로 직접 지시.
- **건드린 파일**:
  - `eobom/frontend/src/components/Footer.tsx` — 발신번호 1줄.
  - `eobom/frontend/src/utils/kakaoShare.ts` — `shareViaKakao` 버튼 라벨 파라미터화.
  - `eobom/frontend/src/config.ts` — `FAMILY_INVITE_CARD_IMAGE_URL` 신설.
  - `eobom/frontend/src/pages/ObituaryPage.tsx` — `shareViaKakao` 호출부에 `buttonLabel:'부고 보기'` 명시(시그니처 변경 대응).
  - `eobom/frontend/src/components/MyPageFamilyDesignation.tsx` — 초대 공유 로직 전면 교체 + 사전 경고 + 링크복사 상시노출 + 성함 안내.
  - `eobom/backend/prisma/schema.prisma` — `FamilyDesignation.acceptAttempts Int @default(0)` 신설.
  - `eobom/backend/prisma/migrations/20260826005944_family_designation_accept_attempts/` — 마이그레이션.
  - `eobom/backend/src/controllers/familyDesignationController.ts` — `acceptFamilyInvite` 성함 대조+시도제한, `inviteFamilyDesignation`에 `acceptAttempts` 리셋.
  - `eobom/frontend/src/pages/FamilyInvitePage.tsx` — 성함 입력란 + 3화면 CTA.
  - `eobom/frontend/src/pages/FarewellMessagePage.tsx` — 신설.
  - `eobom/frontend/src/App.tsx` — `/farewell-messages` 라우트 + import.
  - `eobom/frontend/src/components/Sidebar.tsx` — `defaultMenuItems`에 항목 추가, 아이콘 분기 조정.
  - `eobom/frontend/src/modeNav.ts` — `PREP_MENU`에 항목 추가.
  - `eobom/frontend/src/components/home/domainSlides.tsx` — `ending-note` 문구 수정 + `farewell-messages` 슬라이드 신설 + `box1Keys` 갱신.
  - `eobom/frontend/src/components/home/EntryBoxes.tsx` — `chipLabels`에 항목 추가.
  - `eobom/frontend/src/pages/EndingNotePage.tsx` — 자유 텍스트 ③(카드2) 제거 + 헤더 문구 수정 + 크로스링크.
  - `docs/00_핵심플랫폼/00-05_DB_요구사항_및_테이블_사전.md` — `generate-db-doc.js` 재생성(schema 변경 반영).
  - `.harness/memory/context.md`, `docs/작업일지_및_기록/260826.md`, `claude_tasks.md`, 이 항목.
- **결과**:
  - **발신번호**: `Footer.tsx:120` `1588-0000` → `070-8856-2725`. `grep -n "1588-0000" eobom/frontend/src` → 0건.
  - **가족초대 카카오 공유**: `handleInvite`가 초대 발급 후 `shareViaKakao({title:'이어봄 — 가족 확인
    요청', description:'가족 확인 요청이 도착했습니다.', imageUrl:FAMILY_INVITE_CARD_IMAGE_URL,
    url:link, buttonLabel:'가족 확인하기'})`를 호출 — 실명·관계·"엔딩노트"·"사망 통지" 어휘
    없음(§9.1-4 카드 규칙). `navigator.share`는 코드에서 완전히 제거(주석으로 이유만 남김) —
    Kakao 성공 여부와 무관하게 매번 `lastInviteLink` 상태에 방금 발급한 링크를 저장해, 각 항목
    행 아래에 링크 텍스트 + "링크 복사" 버튼을 **항상** 렌더링(§9.1-4-1 "어느 경로든 링크 복사는
    항상 함께"). 복사 성공 메시지를 "1:1로 전달해 주세요"로(§9.1-4-1 함께 고칠 것). "알리기"
    버튼을 누르기 **전에** 상시 경고 배너 추가: "이 링크를 받은 분은 누구나 수락할 수 있습니다.
    반드시 본인에게만 1:1로 보내주세요"(§9.1-4 — 이유를 감추지 않는다).
  - **`kakaoShare.ts` 재사용 시 고칠 것**(§9.1-4-3 명시): `ShareCardParams`에 `buttonLabel: string`
    필드 추가(기존 하드코딩 `'부고 보기'` 제거), `ObituaryPage.tsx` 호출부에 `buttonLabel:'부고
    보기'`를 명시적으로 넣어 부고장 흐름은 그대로 유지.
  - **성함 대조**(§9.1-4-3): `schema.prisma`에 `acceptAttempts Int @default(0)` 추가 →
    로컬 dev DB(`localhost:5433`)에 `prisma migrate dev`로 마이그레이션 적용(운영 Supabase DB는
    건드리지 않음 — 배포 시 `prisma migrate deploy`가 자동 적용). `FamilyInvitePage.tsx`의
    `ready` 뷰에 "성함" 입력란 추가(지정된 이름은 화면에 노출하지 않음, §9.1-3 ② 유지),
    `handleAccept`가 `{ name }`을 body로 전송. 백엔드 `acceptFamilyInvite`가
    `normalizeNameForCompare`(공백 전부 제거)로 `FamilyDesignation.name`과 대조 — 불일치 시
    `acceptAttempts`를 1 증가시키고 **항상 동일한** "성함이 일치하지 않습니다" 400을 반환(5회
    도달 시점에도 문구를 바꾸지 않음 — 잠김을 알려주는 것 자체가 유추 단서이므로). 5회 도달 시
    `inviteToken: null`로 그 자리에서 잠금 — 다음 요청부터는 자연히 "초대 링크를 찾을 수
    없습니다"(존재 은닉과 같은 방식). `inviteFamilyDesignation`(재발급)이 새 토큰 발급 시
    `acceptAttempts: 0`으로 리셋. `User.name`은 어디서도 대조에 쓰지 않음(계정 닉네임 문제,
    §9.1-4-3 반대 근거 그대로 반영).
  - **§9.1-1 필수 3종 검증**(코드 변경 없음, 기존 정상 확인): ① 1회용 — accept·decline 둘 다
    `inviteToken: null`. ② 만료 — `getFamilyInvite`·`acceptFamilyInvite` 둘 다
    `tokenExpiresAt` 체크. ③ 재발급 시 이전 토큰 폐기 — `inviteFamilyDesignation`이 같은
    로우의 `inviteToken` 컬럼을 새 값으로 덮어써 이전 토큰 문자열은 자연히 조회 불가.
  - **초대 완료 화면 CTA**(§9.1-4-2): `FamilyInvitePage.tsx`에 `useNavigate` 도입.
    `accepted` — "이어봄 홈으로"(주, `navigate('/')`) + "내 엔딩노트 만들기"(부,
    `navigate('/ending-note')`). `declined` — "이어봄 홈으로" 하나만(서비스 권유 없음).
    `notfound`/`error`(같은 코드 블록) — "이어봄 홈으로" 하나. `expired`는 지시 범위(3개 화면)
    밖이라 **손대지 않음**(아래 "다음 에이전트" 참고). "이제 ○○님의 엔딩노트를 볼 수 있습니다"
    류 과장 문구는 쓰지 않음(§9.1-4-2 경고 그대로 반영).
  - **`06-05` Phase A**: `FarewellMessagePage.tsx` 신설 — `GET /api/family-designations`
    실데이터로 수신자 카드 렌더링, 카드마다 텍스트에어리어(화면 상태로만 존재, 새로고침 시
    소실) + "이 편지는 아직 저장되지 않습니다" 상시 고지 + "편지 복사" 버튼. 가족 지정 0명이면
    빈 화면 대신 "가족 지정하기" 유도 화면(§7.3, `onOpenFamilyDesignation` prop으로
    `MyPageFamilyDesignation` 모달 재사용 — App.tsx가 이미 갖고 있던 `setIsFamilyDesignationOpen`
    그대로 연결). §4.3 상시 고지("사망 확인 후 지정하신 분에게 전달됩니다. 재산 분배·상속에
    관한 내용은 남기지 마세요…") 배치. 하단에 엔딩노트로 가는 크로스링크(§7.2).
    `App.tsx`에 `/farewell-messages` 라우트 신설. `domainSlides.tsx`의 `ending-note` 슬라이드를
    `badgeLabel`(→ "디지털 엔딩노트" 단독)·`titleLine2`(→ "빠짐없이 정리합니다")·`description`·
    `bullets`(자유 메시지·"자동 발송" 표현 제거, STT 항목으로 교체)·`featureDesc`("전송됩니다"
    → "권한이 부여됩니다")까지 동반 수정(§7.4 명시 요구). `farewell-messages` 슬라이드 신설,
    `box1Keys`에 추가. `EntryBoxes.tsx` `chipLabels`·`Sidebar.tsx` `defaultMenuItems`·
    `modeNav.ts` `PREP_MENU`(`ending-note` 바로 뒤) 3곳에 항목 추가. `EndingNotePage.tsx`의
    자유 텍스트 ③ 카드(메시지+비상자산 텍스트에어리어+"저장" alert 버튼) 전체 삭제, 헤더 배지·
    h1·설명문을 엔딩노트 단독 내용으로 교정, 하단에 보관함으로 가는 크로스링크 추가.
  - **명령 재현**: `npx tsc --noEmit -p .`(frontend) 에러 0. `npx tsc --noEmit`(backend) 에러 0.
    `npm run build`(frontend) 통과, `dist/assets/index-CsnvdPbC.js 482.15 kB`.
    `node .harness/tools/generate-db-doc.js` 재실행 → `acceptAttempts`가 설명 있는 컬럼으로
    반영됨(`00-05` §해당 테이블 확인). `Grep "DB 호환|열람 키|SMS 인증|홍자녀|마스터 암호|자동
    발송" eobom/frontend/src/pages/EndingNotePage.tsx` → 0건(§8 Phase A 완료 판정 문구 그대로
    재현). `Grep "대화방|navigator\.share" MyPageFamilyDesignation.tsx` → 실제 사용 0건(주석
    설명 1곳만). `Grep "본인 확인|확인을 거칩니다" FamilyInvitePage.tsx` → 0건.
- **편차**:
  - **`FAMILY_INVITE_CARD_IMAGE_URL`을 브랜드 로고(`eobom-logo-hd.png`)로 재사용**했다 —
    `07-03` §3.3-2가 "브랜드 로고 재사용 금지"를 정했지만 그건 **부고장(죽음을 알리는 카드)에
    한정된 판단**이었다(홍보로 오인될 위험). 가족 초대는 성격이 다른 서비스 초대 카드라 브랜드
    아이콘이 오히려 "이어봄에서 온 정상 링크"임을 알리는 역할을 한다고 판단해 새 이미지를
    만들지 않고 기존 자산을 그대로 가리켰다.
  - **§4.3 상시 고지에서 "음성"을 뺐다** — 스펙 원문은 "여기에 남기신 글과 음성은…"이지만,
    Phase A는 텍스트 입력만 있고 음성 입력은 Phase D(⏸, `06-05` §5)라 아직 없다. 없는 기능을
    고지 문구에 넣으면 그 자체가 새로운 미이행 약속이 되므로 "글은…"으로만 적었다 — Phase D
    착수 시 이 문구도 같이 넓혀야 한다.
  - **`schema.prisma` 변경 전 `pg_dump`를 로컬 dev DB(`eobom-postgres`, `localhost:5433`)에만
    수행했다** — 사용자가 이번 지시에서 막은 것은 "`06-05` Phase B(모델·컨트롤러) 착수"였고,
    이번 스키마 변경은 성함 대조(작업 3)가 구조적으로 요구하는 별개의 필요였다. 운영 Supabase
    DB는 건드리지 않았다 — 배포 시 `package.json`의 `start` 스크립트(`prisma migrate deploy &&
    node dist/server.js`)가 자동 적용한다.
  - **초대 카드에서 성함 대조 실패 메시지를 5회 시점에도 동일하게 유지**했다 — 스펙은 "실패
    문구는 성함이 일치하지 않습니다까지만"과 "5회 초과 시 토큰 잠금"을 별도 항목으로 적어뒀지만,
    잠긴 순간에만 다른 문구(예: "잠겼습니다")를 보여주면 그 문구 자체가 "지금이 5번째"라는
    유추 단서가 된다고 판단해 응답 문구를 통일했다 — §9.1-4-3의 "유추 단서 금지" 원칙을 문항 밖
    (실패 문구의 일관성)까지 넓혀 적용한 것이다.
  - **`FarewellMessagePage.tsx`에 인쇄·`.txt` 다운로드를 넣지 않았다** — `EndingNotePage.tsx`의
    STT 초안(⑨)은 "자필증서로 옮겨 적어야" 하는 법적 문서라 그 richness가 필요했지만, 유족
    편지는 그런 법적 동인이 없다. 스코프를 "복사" 버튼 하나로 좁혔다 — 필요하면 다음 라운드에서
    추가할 수 있다.
- **다음 에이전트가 알아야 할 것**:
  - 🔴 **브라우저 실기동 전부 미검증** — 카카오 공유 SDK 실제 왕복(팝업 차단 여부·데스크톱에서
    실제로 카톡 데스크톱앱이 뜨는지)·성함 대조 성공/실패/5회 잠금 흐름·초대 완료 화면 3개
    CTA의 실제 라우팅. 이 세션은 dev 서버를 사용자 쪽에서만 기동하는 운용 방식이라 코드
    리뷰로만 검증했다.
  - `FamilyInvitePage.tsx`의 `expired`(만료) 화면은 여전히 CTA가 없다 — 사용자 지시가 정확히
    "accepted·declined·에러 3개"였고 `expired`는 별도 상태라 손대지 않았지만, 구조적으로
    `notfound`/`error`와 같은 종류의 막다른 길이다. 다음에 넓힐지 확인이 필요하다.
  - `06-05` Phase B(`EndingNote`·`EndingNoteEntry`·`FarewellMessage` 모델, `farewellMessageController`)는
    이번 지시대로 착수하지 않았다 — `FarewellMessagePage.tsx`의 편지는 여전히 브라우저 상태
    로만 존재하고 새로고침하면 사라진다.
  - `.prisma/client`의 네이티브 쿼리 엔진 바이너리(`query_engine-windows.dll.node`)가 사용자의
    로컬 백엔드 dev 서버 프로세스에 잠겨 있어 `prisma generate`가 그 파일 교체 단계에서
    EPERM으로 실패했다(타입 생성(`index.d.ts`)과 런타임 datamodel(`index.js`)은 정상 갱신돼
    tsc·실제 쿼리 동작엔 영향이 없을 것으로 판단했다 — 다만 실제로 백엔드를 재기동해 신규
    컬럼이 포함된 쿼리가 도는지 확인은 못 했다). 다음에 이상 동작이 보이면 dev 서버를 잠깐
    내리고 `npx prisma generate`를 한 번 더 돌려볼 것.

- **판정**: ✅통과 (발신번호 단일화, 가족초대 카카오공유 및 5회 성함 대조 방어, 초대 완료 3화면 CTA, 06-05 Phase A 골격 구축 완료)

---

## 2026-08-25 (73) | [Sonnet] `07-03` §5.3-2 부고장 소유권 버그 — 검증 결과 **이미 수정돼 있음**

- **근거 스펙**: `docs/07_상중_행정_케어/07-03_모바일_부고장_카카오톡_전송_구현_기획서.md` §5.3-2
  — *"소유권은 서버가 판정한다 — `localStorage`로 판단하지 않는다."* 사용자 지시: *"소유권을
  `localStorage`로 판정해 남의 부고장 관리화면이 뜬다(서버 권한은 정상 방어 중). `isOwner`·
  `obituaryId`를 서버가 판정하도록 고칠 것."*
- **건드린 파일**: 없음 — 아래 이유로 코드 변경을 하지 않았다.
- **결과**: `eobom/backend/src/controllers/obituaryController.ts`의 `getObituaryBySlug`(§5.3-1·
  §5.3-2 구현부, `:209~254`)가 이미 `isOwner = !!obituary && !!decoded && obituary.createdByUserId
  === decoded.id`로 서버 측 판정을 하고, 응답에 `isOwner`·`obituaryId`는 **`isOwner`가 true일
  때만** 스프레드로 싣는다(`...(isOwner ? { isOwner: true, obituaryId: obituary.id } : {})`,
  `:253`). `updateObituary`(`:317`)·`closeObituary`(`:383`) 둘 다 `existing.createdByUserId !==
  decoded.id`면 404로 막는다 — 서버 권한 검증은 스펙이 요구하는 그대로다.
  `eobom/frontend/src/pages/ObituaryPage.tsx`도 이미 이 계약을 정확히 따른다: 마운트 시
  `useEffect`(`:127~211`)가 `localStorage`의 `STORAGE_KEY` 포인터를 **"어느 slug를 조회할지"
  힌트로만** 쓰고(주석 `:147~150`이 §5.3-2를 직접 인용), 응답을 받은 뒤 `if (!o.isOwner) return;`
  (`:169`)로 **서버가 확인해주지 않으면 폼을 채우는 모든 `setState`(관리 모드 진입) 이전에
  즉시 반환**한다. `obituaryId`는 로컬 포인터(`ref.obituaryId`)가 아니라 서버 응답
  (`o.obituaryId`, `:172`)에서만 세팅되고, `handleSubmit`의 PATCH(`:289`)·`handleCloseObituary`
  (`:332`·`:339`)도 전부 이 `obituaryId` state만 참조한다 — `grep -n "obituaryRef\.obituaryId"
  eobom/frontend/src/pages/ObituaryPage.tsx` → **0건**(로컬 포인터의 `obituaryId` 필드를 특권
  동작에 쓰는 곳이 없음). `localStorage` 포인터는 지우지 않는다는 §5.3-2 규칙도(`if (data.status
  !== 'success') { localStorage.removeItem(...) }` 분기는 "진짜 삭제된 경우"만 해당, isOwner
  false 분기에서는 제거하지 않음) 그대로 지켜지고 있다.
- **편차**: 이번 세션에서 아무것도 고치지 않은 것 자체가 편차다 — 지시는 "고칠 것"이었지만
  실측 결과 이미 고쳐져 있었다. `git log --oneline -- eobom/frontend/src/pages/ObituaryPage.tsx`로
  확인한 결과 `5888289 부고장_종료_기능추가`(종료 기능 추가 커밋, `08-21` 무렵으로 추정 — §5.3-2
  본문의 *"2026-08-21 신설"* 표기와 시기가 맞는다)에서 종료 기능과 함께 이 `isOwner` 게이팅이
  같이 들어간 것으로 보인다. `.harness/memory/context.md`의 이전 판(오늘 세션 초반에 읽었던 버전)
  §"⑧ 카톡 부고장" 항목이 *"[Sonnet] 수정중"* 으로 남아 있었는데, 실제로는 그 이후 커밋에서
  이미 완료됐고 백로그 갱신만 누락된 것으로 판단된다.
- **다음 에이전트가 알아야 할 것**:
  - 코드 리뷰(정적 분석)로만 확인했다 — 실제로 "네이버 계정으로 만든 부고장이 있는 브라우저에서
    카카오 계정으로 로그인" 시나리오를 브라우저로 재현해 이제는 남의 관리 화면이 뜨지 않는지
    **실기동 검증은 하지 않았다.** 이 세션은 dev 서버를 사용자 쪽에서만 기동하는 운용 방식이라
    별도 요청 없이는 생략했다. 확신도는 높지만(코드 경로가 명확하고 우회 지점이 없음), 실제
    재현 확인이 이 항목의 마지막 남은 검증이다.
  - `context.md`의 "지금 할 일" 4번 항목("`07-03` Phase3 #9 — 소유권 서버판정")을 이번 항목으로
    종결 처리한다.

- **판정**: ✅통과 (부고장 소유권 서버 판정 및 localStorage 의존 배제 상태 검증 확인)

---

## 2026-08-25 (72) | [Sonnet] `00-29` §8 조치 B — 모바일 본문 15px 인라인 폰트 상향

- **근거 스펙**: `docs/00_핵심플랫폼/00-29_모바일_대응_전략_검토서.md` §8 #5·#6, §12(조치 A·B).
  사용자 지시: *"(A) `index.css`에 `@media (max-width:768px){html{font-size:var(--base-font-size)}}`
  1줄 추가 (B) `0.8rem` 이하 97곳을 `0.85rem`으로. 레이아웃은 건드리지 말 것."*
- **건드린 파일**:
  - `eobom/frontend/src/pages/AdminPage.tsx` — 인라인 `fontSize` 12곳(`0.8rem`×9·`0.75rem`×1·
    `0.72rem`×2) → `0.85rem`.
  - `eobom/frontend/src/pages/BizDashboard.tsx` — 인라인 `fontSize` 1곳(`0.65rem`) → `0.85rem`.
  - `eobom/frontend/src/pages/EndingNotePage.tsx` — 인라인 `fontSize` 3곳(`0.8rem`, 이번 세션
    STT Phase1-a에서 직접 추가했던 값들) → `0.85rem`.
- **결과**:
  - **조치 A**: `index.css:218~222`에 **이미 존재**했다 — *"00-29 §12 조치 A — 모바일 기준선
    폰트 확대"* 주석과 함께 `@media (max-width: 768px) { html { font-size: var(--base-font-size);
    } }`가 정확히 스펙 문구 그대로 들어가 있었다(`html { }` 규칙이 `index.css` 전체에 이거
    하나뿐임을 `grep -n "html {" index.css`로 확인). **추가하지 않았다** — 중복 규칙이 될
    뿐이었다.
  - **조치 B**: 지시된 "97곳"은 `00-29` 작성 시점(08-25 이른 시각) 실측치였는데, 그 이후 이
    세션 안에서만도 여러 라운드의 모바일/레이아웃 커밋(`동적뷰포트수정`·`모바일_일반스크롤`·
    `풀페이지스크롤_수정` 등, `git log --oneline` 확인)이 있었고 그 과정에서 대다수 페이지가
    이미 `0.85rem` 이상으로 재작성돼 있었다. 재실측(`Grep "fontSize: '0\.(65|7|72|75|78|8)rem'"
    eobom/frontend/src` 전수) 결과 **현재 남아 있던 것은 16곳뿐**이었다 — 위 3개 파일. 이 16곳을
    전부 `0.85rem`으로 올렸다. `0.82rem`(5곳, `CareGuidePage`·`Footer`·`FamilyInvitePage`·
    `ObituaryPage`)은 지시된 "0.8rem 이하" 기준에 안 들어(0.82 > 0.8) **건드리지 않았다** — §하단
    "다음 에이전트" 참고.
  - `fontSize`가 아닌 다른 속성(`padding`·`gap`·`borderRadius` 등)에 쓰인 동일 rem 값은 지시대로
    **하나도 건드리지 않았다** — `AdminPage.tsx:562`의 `gap: '0.8rem'` 등 그대로 둠.
  - **명령 재현**: `npx tsc --noEmit -p .`(frontend) 에러 0. `npm run build`(frontend) 통과,
    `dist/assets/index-CXSpX_B1.js 475.15 kB`(폰트 값 치환만이라 번들 크기 변화 없음).
    `Grep "fontSize: '0\.(65|7|72|75|78|8)rem'" eobom/frontend/src` → 수정 전 16건 → 수정 후
    **0건**.
- **편차**:
  - 🔴 **"97곳"이 아니라 "16곳"을 고쳤다** — 위 결과에 적은 대로, 지시받은 숫자와 실측이 크게
    달랐다. 셀 수 있는 값(16)을 직접 재확인하고 그 실측대로 진행했다 — 숫자를 맞추려고 없는
    항목을 만들어내지 않았다.
  - `BizDashboard.tsx:672`의 `0.65rem`은 절대위치 배지(모서리에 붙는 작은 라벨)의 폰트였다 —
    `00-29`의 원 실측(375px 소비자 페이지 위주)이 이 파일(파트너/사업자용 내부 대시보드)까지
    포함했는지 확인할 수 없어, **지시된 숫자 기준("0.8rem 이하")을 그대로 적용**하되 이 특정
    배지는 레이아웃(절대 위치, 고정 폭 없음)상 커져도 안전해 보인다고 판단해 그대로 올렸다.
- **다음 에이전트가 알아야 할 것**:
  - 🟡 `0.82rem` 7곳(`CareGuidePage.tsx:222`·`BizDashboard.tsx:693·701·712`·`Footer.tsx:138`·
    `FamilyInvitePage.tsx:261`·`ObituaryPage.tsx:539`)은 조치 A 적용 후에도 18px×0.82=14.76px로
    **여전히 15px 미달**이다. 지시 문구("0.8rem 이하")를 엄격히
    지키느라 이번엔 안 건드렸지만, "본문 15px" 판정 기준(`00-29`§6.2 ②)을 문자 그대로 적용하면
    이 7곳도 다음 라운드에서 `0.85rem`으로 올려야 완전히 닫힌다. 사용자 확인 후 진행할 것.
  - CSS 클래스(`index.css`)의 `font-size` 규칙은 손대지 않았다 — `.stat-row__label`(480px 이하
    `0.7rem`, `index.css:680`)이 유일하게 낮은 값이지만, 스펙이 명시한 범위는 "인라인"이고
    이건 클래스 규칙이라 제외했다. 필요하면 별도 판단 요청할 것.
  - 실기기 시각 검증은 하지 않았다 — 코드 치환만 확인. `00-29`§13이 요구한 실측(375px 폰
    스크린샷 등)은 여전히 미검증 상태로 남아 있다.

- **판정**: ✅통과 (모바일 본문 가독성 기준 0.8rem 이하 인라인 폰트 16곳 0.85rem 상향 완료)

---

## 2026-08-25 (71) | [Sonnet] 헤더 "계정 연동" 제거 + LoginModal 로그인/회원가입 탭 분리

- **근거 스펙**: 스펙 없음 — 사용자가 대화에서 두 작업(①헤더 정리 ②로그인 모달 탭 분리 +
  백엔드 mode=login 가드)을 파일·줄번호까지 명시해 직접 지시. `docs/`에 해당 스펙 문서는 없음.
- **건드린 파일**:
  - `eobom/frontend/src/components/Header.tsx`
  - `eobom/frontend/src/components/LoginModal.tsx`
  - `eobom/frontend/src/App.tsx`
  - `eobom/frontend/src/index.css`
  - `eobom/backend/src/routes/authRoutes.ts`
  - `eobom/backend/src/controllers/authController.ts`
  - `.harness/memory/context.md` — ⑩ 항목 신설.
  - `docs/작업일지_및_기록/에이전트_기록/claude_tasks.md`·`walkthrough.md`(이 항목).
- **결과**:
  - **작업 1(헤더)**: `Header.tsx`에서 "계정 연동" 버튼(`<Settings/>`+`onOpenAccountSettings`
    onClick)과 `HeaderProps.onOpenAccountSettings` prop을 완전히 제거(더 이상 안 쓰는 `Settings`
    아이콘 import도 함께 제거). `App.tsx`의 `<Header .../>` 호출에서만 `onOpenAccountSettings`를
    뺐고, `<Sidebar .../>`·`<MyPage .../>` 호출은 그대로 유지 — `MyPage.tsx:177~183`이 이미
    같은 prop으로 "계정 연동" 버튼을 갖고 있어(App.tsx:367 그대로) 재사용 조건을 그대로 만족,
    새 트리거를 추가하지 않았다. `App.tsx`의 `MyPageAuthSettings`(계정 연동 모달 자체,
    `:101`·`:418` 주석 지점)는 손대지 않고 그대로 유지. 라벨은 `:154` `"로그인 / 회원가입"` →
    `"로그인"`으로 바꾸고, 이제 두 라벨이 같은 텍스트가 된 `:155`의 `header-btn-label-short`
    span을 제거 — 딸린 CSS(`index.css`의 `.header-btn-label-short` 기본/640px 규칙 2곳)도 죽은
    코드가 돼 함께 제거.
  - **작업 2(로그인 탭 분리)**: `LoginModal.tsx`에 `activeTab`('login'|'signup', 기본 'login')
    상태 신설, 모달 상단에 탭 스위처 2개 추가. 기존 3개 소셜 버튼(각 20~30줄 스타일 포함)을
    `SocialLoginButtons` 로컬 컴포넌트로 추출해 두 탭이 공유(중복 마크업 회피) — "로그인" 탭은
    `<SocialLoginButtons onSelect={handleLoginTabSocial} />`(항상 활성, 동의 UI 없음), "회원가입"
    탭은 기존 만14세 게이트 + 필수동의2·선택1 + `<SocialLoginButtons onSelect={handleSocialLogin}
    disabled={!canProceed} />`(기존 로직 그대로). 파트너 진입 링크·데모 로그인 3버튼은 탭
    조건문 밖 공통 하단에 그대로 유지(지시 원문대로). `initialTab`·`initialNotice` prop 신설 —
    모달이 열릴 때(`isOpen` true 전이)마다 그 값으로 리셋하는 `useEffect`.
  - **mode=login 백엔드 가드**: `authRoutes.ts`의 `GET /:provider`에 `mode` 쿼리 판별 추가 —
    `mode==='login'`이면 기존의 `consentTerms`/`consentPrivacy` door 가드를 건너뛰고
    `state`에 `mode`를 함께 서명(`purpose:'login', origin, consent, mode`). `mode`가 없거나
    `'login'`이 아니면 기존 동작(동의 없으면 `loginError=consent_required`) 그대로.
    `authController.ts`에 `LoginStatePayload.mode?: 'login'|'signup'` 필드 + `resolveMode(state)`
    헬퍼(위조·만료·`purpose!=='login'`·필드 없음은 전부 `'signup'`으로 안전 폴백) 신설.
    `handleSocialLoginCallback`에서 1단계(기존 `SocialAccount`)·2단계(이메일 일치 기존 유저,
    `socialLinkPrompt`)는 그대로 두고, **3단계(완전 신규 `User.create`) 직전**에
    `if (mode === 'login') return res.redirect('...?loginError=not_registered')`를 추가 —
    동의 없이 가입시키지 않는다. `App.tsx`의 `loginError` 처리 `useEffect`에 `not_registered`를
    별도 분기로 추가해 `alert()` 대신 `openLoginModal({ tab: 'signup', notice: '가입되지 않은
    계정입니다. 아래에서 약관 동의 후 회원가입을 진행해주세요.' })`를 호출하도록 — 기존
    `messages` 맵의 다른 에러 코드(kakao_failed 등)는 여전히 `alert()`로 그대로 처리.
    `Header`·`Sidebar`·`FamilyInvitePage`·`authProps`의 4개 `onOpenLogin` 호출부는 전부
    `() => openLoginModal()`(옵션 없음 = 기본 'login' 탭, notice 없음)로 통일.
  - **명령 재현**: `npx tsc --noEmit -p .`(`eobom/frontend`) 에러 0. `npx tsc --noEmit`
    (`eobom/backend`, package.json `build`는 `prisma generate && tsc`이지만 스키마 변경이 없어
    `tsc --noEmit`만 직접 실행) 에러 0. `npm run build`(`eobom/frontend`) `tsc && vite build`
    통과, `dist/assets/index-D9p72GEw.js 475.14 kB`. `Grep -n "header-btn-label-short|
    onOpenAccountSettings.*Header|<Header" eobom/frontend/src` → `Header.tsx`엔 남은 참조 없음
    (JSX 호출 1건·컴포넌트 정의 1건만, 둘 다 prop 없이). `Grep -n "not_registered|mode=login|
    resolveMode" eobom` → 프론트(`App.tsx`·`LoginModal.tsx`)·백엔드(`authRoutes.ts`·
    `authController.ts`) 4개 파일에서 일관되게 연결됨을 확인.
- **편차**:
  - "로그인" 탭의 데모 로그인 3버튼(카카오/네이버/구글 모의)은 여전히 `canProceed`(회원가입
    탭의 동의+만14세 상태)로 활성/비활성이 결정된다 — 지시는 "두 탭 공통 하단에 유지"였고
    데모 로그인 자체를 어느 탭에서 어떻게 게이트할지는 명시하지 않았다. 백엔드 `demoLogin`이
    `termsAgreed`/`privacyAgreed`를 필수로 요구하는데(`authController.ts` `demoLogin`) 로그인
    탭엔 그 값을 만들 UI가 없으므로, "공통 하단에 항상 보이되(지시대로) 로그인 탭에서는
    비활성 상태로 보이고, 회원가입 탭에서 동의해야 눌리는" 형태로 판단해 그대로 뒀다 — 데모
    버튼에 한해 별도 동의 없는 경로를 뚫는 것보다 안전한 선택이라고 봤다. 코드에 그 이유를
    주석으로 남겨뒀다(`LoginModal.tsx` 데모 버튼 블록 바로 위).
  - `socialLinkPrompt`(2단계, 동일 이메일의 기존 유저를 다른 provider로 발견 — 계정 통합/독립
    가입 선택 모달)는 `mode`와 무관하게 기존 그대로 뒀다 — 이미 "가입 이력이 있는" 시나리오라
    지시의 "신규 유저면 막는다" 대상이 아니라고 판단했다.
- **다음 에이전트가 알아야 할 것**:
  - 브라우저 실기동 미검증 — 실제 카카오/네이버/구글 OAuth 왕복으로 (a) 로그인 탭에서 이미
    가입된 계정으로 로그인 시 정상 로그인되는지 (b) 로그인 탭에서 가입 이력 없는 계정으로
    시도 시 `not_registered` → 회원가입 탭+안내문이 실제로 뜨는지 (c) 회원가입 탭에서 기존
    플로우(동의+만14세 게이트)가 그대로 동작하는지, 셋 다 코드 리뷰로만 확인했다. 이 세션은
    dev 서버를 사용자 쪽에서만 기동하는 운용 방식이라 별도 요청 없이는 실행하지 않았다.
  - `.harness/memory/context.md` §⓪ item 3(마이페이지 카운터 하드코딩 + "계정설정"→"계정 연동"
    개명)은 이번 작업과 이름만 겹칠 뿐 별개 항목이다 — 그 항목은 아직 미착수.

- **판정**: ✅통과 (헤더 계정 연동 버튼 정리, 로그인 모달 탭 분리 및 백엔드 미가입 계정 가드 연동 완료)

---

## 2026-08-25 (70) | [Sonnet] `06-04`§6.4·§10 — Phase 0 문구정리 + STT 초안 Phase 1-a 구현

- **근거 스펙**: docs/06_엔딩노트_유언/06-04_엔딩노트_보관함_실구현_기획서.md §6.4·§10 Phase 0. 법적
  성격(자필증서 요건·손글씨 필수)은 `06-02`§4.4가 정본 — 재해석하지 않고 그대로 반영. 대상 파일은
  사용자가 `EndingNotePage.tsx` 한 곳으로 명시(백엔드 변경 없음).
- **건드린 파일**:
  - `eobom/frontend/src/pages/EndingNotePage.tsx` — Phase 0 문구정리 6건 + STT 섹션 신설.
  - `eobom/frontend/src/components/home/domainSlides.tsx` — 홈 도메인 슬라이드 bullet 1줄 교정(아래).
  - `.harness/memory/context.md` — ⑨·⑨-2 항목에 완료 표시.
  - `docs/작업일지_및_기록/에이전트_기록/claude_tasks.md` — 이번 사이클 시행착오·판단 근거.
  - `docs/작업일지_및_기록/에이전트_기록/walkthrough.md` — 이 항목.
- **결과**:
  - **Phase 0(문구정리)** — 원문 그대로 제거/교체 확인:
    - `:163` *"연명의료 의향 메모가 저장되었으며, 국립연명의료관리기관 DB 호환 모바일 QR카드가
      준비되었습니다"* 성공 메시지 블록 자체를 삭제(저장이 비활성 버튼이 되어 도달 불가능한
      코드가 되므로 `savedSuccess` state·`handleSaveNote` 핸들러까지 함께 제거).
    - `:212` *"…알림톡으로 엔딩노트 열람 키가 자동 발송됩니다"* → *"사망 확인 후 지정 유족에게
      열람 권한이 부여됩니다. 실제 열람은 로그인 후 계정 권한으로 이루어집니다."*
    - `:133` *"…SMS 인증 후 연명의료 의향 메모가 1회 열람됩니다"* 문단 + `:124~135` 대리인 입력
      필드(`defaultValue="홍자녀 (010-1234-5678)"` 포함) 전체 삭제, 함께 `:102~108`의 "🏥
      생전/응급 시 대리인 즉시 열람 가능" 배지·설명문도 제거(편차 참고).
    - `:185` placeholder → §6.3 소재 안내형 문구로 교체(원문 그대로: *"국민은행에 주거래 계좌가
      있고, 통장은 안방 서랍 두 번째 칸에 있습니다. 비밀번호는 적지 마세요 — 유족이 서류로 조회할
      수 있습니다."*).
    - `:148` "의향서 암호화 저장" 버튼 → `disabled` + "의향서 저장 (준비 중)"으로 교체.
  - **STT Phase 1-a** — 새 섹션(⑨ 말로 남기는 초안)을 그리드 아래 전체폭 카드로 추가:
    입력 2종(음성 녹음 버튼 + 상시 편집 가능한 `<textarea>`, 타이핑은 마이크 지원 여부와 무관하게
    항상 활성) · `SpeechRecognition`/`webkitSpeechRecognition` 감지로 미지원 브라우저(Firefox 등)는
    마이크 버튼을 숨기고 안내문만 노출(에러 화면 없음) · `continuous:true`+`interimResults:true`,
    `onend`에서 `shouldListenRef`가 true인 동안 자동 `recognition.start()` 재호출(침묵 자동종료
    대응) · `onerror`의 `not-allowed`/`service-not-allowed`에서 마이크 안내문 노출 + 자동으로
    타이핑 유도 · 인식 결과는 원문 그대로 누적만 하고 rewrite 없음 · "이 내용을 확인했습니다"
    버튼(`draftConfirmed`)을 눌러야 4대요건 체크리스트·필사안내·인쇄/복사/다운로드가 열림, 이후
    텍스트를 고치거나 음성으로 새 문장이 붙으면 다시 `false`로 리셋 · 4대요건(주소·연월일·성명·
    날인)은 시스템이 값을 채우지 않고 주소·연월일만 정규식으로 "확인됨/빠졌을 수 있음" 힌트를
    보여주며 나머지 두 항목은 항상 "본인이 직접 확인" 문구만 · 인쇄는 `window.open`으로 초안
    텍스트만 담은 새 창에서 `print()`(서명란 없음, 다른 섹션 안 섞임) · 텍스트 복사(클립보드)·
    `.txt` 다운로드(Blob) 제공 · 녹음 시작 가능 상태일 때 상시 노출: *"음성 인식을 위해 말씀하신
    내용이 음성인식 서비스로 전송됩니다. 이어봄은 변환된 글만 저장하며 음성 파일은 보관하지
    않습니다."* + 화면 상단 항상: *"이 초안은 저장되지 않습니다. 인쇄하거나 복사해 두세요."*
    (두 문구 다 §6.4-4·§6.4-7 원문 그대로) · 서버 전송·`localStorage`/`sessionStorage` 저장 코드
    없음(상태는 React state에만 존재, 새로고침 시 소실).
  - **홈 슬라이드 동반 수정**: `domainSlides.tsx:195` *"사망 인증 시 지정 수신인에게 알림톡으로
    열람 키 자동 발송"* → *"사망 확인 후 지정 유족에게 열람 권한 부여"* (`06-04`§10의 grep
    검증이 `src/` 전체 기준이라 `EndingNotePage.tsx` 밖에서 같은 문구 중복을 추가로 발견).
  - **명령 재현**: `npx tsc --noEmit -p .`(`eobom/frontend`) 에러 0. `npm run build`(`eobom/frontend`)
    `tsc && vite build` 통과, `dist/assets/index-BuBDde1w.js 473.89 kB`. `Grep -rn "DB 호환|열람
    키|SMS 인증|홍자녀|마스터 암호" eobom/frontend/src` → 수정 전 5건(`EndingNotePage.tsx` 4곳 +
    `domainSlides.tsx` 1곳) → 수정 후 **0건**. `Grep -rn "localStorage|sessionStorage|FormData|mp3|
    audio/" eobom/frontend/src/pages/EndingNotePage.tsx` → 주석 2줄(설명용, "…하지 않는다"는 부정문)
    뿐이고 실사용 0건.
- **편차**:
  - `:102~108`의 "생전/응급 시 대리인 즉시 열람 가능" 배지·설명문 삭제는 사용자 지시 6건에 줄번호로
    명시되진 않았다 — 그러나 item 3(대리인 SMS 인증 열람을 §7.2에 따라 Phase 3로 미루며 삭제)을
    실행하면서 대리인 지정 필드 자체가 없어졌는데 이 배지·설명문만 남으면 "지정할 방법이 없는
    기능을 광고"하는 같은 종류의 화면-구현 불일치가 재발하므로 함께 제거했다. 되돌리려면 §7.2가
    Phase 3에서 실제로 열릴 때 문구를 되살리면 된다.
  - `domainSlides.tsx:195` 수정은 지시 대상(`EndingNotePage.tsx`) 밖이지만, `06-04`§10 완료판정
    문구("grep 0건")가 파일 범위를 한정하지 않아 `src/` 전체로 해석해 포함시켰다.
  - `:189`("유족 메시지 및 비밀 데이터가 안전하게 암호화 보관되었습니다" alert)는 §2.2 표 4건에
    없고 지시 범위 밖이라 **의도적으로 안 건드림** — 저장 기능이 없는데 "보관되었습니다" alert가
    뜨는 건 `:148`과 같은 종류의 문제라 다음 Phase 0 후속으로 남겨둔다.
- **다음 에이전트가 알아야 할 것**:
  - 브라우저 실기동 미검증 — Chrome에서 마이크 버튼 눌러 실제 인식·Firefox 폴백 문구·침묵 후
    자동재시작이 코드 리뷰로만 확인됐다. 이 세션은 dev 서버를 사용자 쪽에서만 기동하는 운용
    방식이라 별도 요청 없이는 실행하지 않았다.
  - `:189` 유족메시지 저장 버튼의 거짓 alert 미해결(위 편차 참고) — 다음 Phase 0 라운드 후보.
  - Phase 1(모델 4개·`EndingNote`/`EndingNoteEntry` 등, `06-04`§4.2)은 이번에 착수하지 않았다 —
    STT 섹션은 §6.4-7의 설계대로 서버 저장 없이 완결된 기능이라 모델이 서지 않아도 됐지만, 나머지
    8섹션 본체는 여전히 모델·API 0건 그대로다.

- **판정**: ✅통과 (엔딩노트 Phase 0 비현실 문구 전면 정비 및 브라우저 STT 초안 Phase 1-a 구현 완료)

---

## 2026-08-25 (69) | [Sonnet] §8.6-1 확정 반영 — 인트로 문구 일원화 + 페이지화 후속 3건

- **근거 스펙**: docs/00_핵심플랫폼/00-23_메인화면_진입구조_개편_검토서.md §8.6-1 — 개발자 지시 4건. 1) `/prep`·`/bereaved` 경로 확정 유지. 2) 인트로 문구를 새로 짓지 말고 EntryBoxes.tsx 박스①②의 subtitle을 공용 상수로 올려 재사용(특히 `/bereaved`의 "갑작스러운 이별 앞에서…"는 07-02 톤 위반이라 교체 필수). 3) URL 직접 진입 시 로그인 게이트가 00-26 §4.2-1 원칙(소개·목록은 열람 가능, 항목 진입은 care-guide 외 로그인)과 같은지 확인. 4) `/prep`·`/bereaved` 직접 진입 시 00-26 §4.4에 따라 사이드바·모드 드롭다운이 동기화되는지 확인.
- **구현 방식**:
  1. 경로: 변경 없음(확정 유지).
  2. `domainSlides.tsx`에 `box1Intro`·`box2Intro` 상수 신설(EntryBoxes.tsx:297·342 subtitle 원문 그대로 이동). `EntryBoxes.tsx`의 두 `BoxHeader subtitle`과 `App.tsx`의 두 `DomainOverviewPage intro` prop이 같은 상수를 참조하도록 배선 — 문자열을 새로 쓰지 않았다. "첫 문장만 자르기" 허용 옵션은 길이가 부담되지 않아(62자·58자 내외) 쓰지 않았다.
     - `DomainOverviewPage.tsx`는 이전 라운드("전면 수정")에서 페이지 헤딩(H1) 자체를 없앤 상태였다 — 풀페이지 스크롤 뷰포트 높이 계산(`calc(100vh - header-h)`)이 깨지는 걸 피하려던 선택이었다. 이번엔 intro를 다시 화면에 노출해야 해서, `position:absolute`로 얹는 배너(`.domain-overview-intro`)로 만들어 레이아웃 높이에 영향을 안 주게 했다. 첫 도메인(activeIndex 0)에서만 보이고 이후 도메인으로 넘기면 사라진다(내비게이션 기능이 없는 순수 설명문이라 계속 떠 있으면 화면을 가린다고 판단).
  3. 로그인 게이트: 코드 확인 결과 이미 원칙과 일치했다 — 라우트(`/prep`·`/bereaved`) 자체엔 App.tsx에 페이지 레벨 가드가 없어 비로그인으로도 열람 가능하고, 각 도메인 CTA 클릭 시 `slide.loginRequired && !currentUser`일 때만 로그인 모달을 띄운다. `domainSlides.tsx` 8개 도메인 중 `care-guide`만 `loginRequired`가 없어(undefined) 로그인 없이 바로 `/care-guide`로 진입 가능 — 스펙과 일치해 코드 변경 없음.
  4. 모드 동기화: `DomainOverviewPage`에 `mode: NavMode`·`onSetMode` prop을 추가하고, 마운트 시 `useEffect(() => { onSetMode?.(mode); }, [mode, onSetMode])`로 라우트 진입 즉시 호출하도록 신설했다. 기존엔 EntryBoxes.tsx 박스 클릭·HomePage 히어로 CTA의 클릭 핸들러 안에서만 `onSetMode`가 불렸는데, URL 직접 진입·새로고침·북마크는 그 클릭 자체를 거치지 않아 안 불렸다 — 그 경로를 새로 만들었다. `App.tsx`가 두 라우트에 `onSetMode={handleSetNavMode}`·`mode="prep"`/`"bereaved"`를 새로 전달한다.
- **건드린 파일**:
  - `eobom/frontend/src/components/home/domainSlides.tsx` — `box1Intro`·`box2Intro` 상수 신설.
  - `eobom/frontend/src/components/home/EntryBoxes.tsx` — 두 `BoxHeader subtitle`을 인라인 문자열에서 `box1Intro`/`box2Intro` 참조로 교체.
  - `eobom/frontend/src/App.tsx` — `/prep`·`/bereaved` 라우트에 `intro`·`mode`·`onSetMode` prop 추가.
  - `eobom/frontend/src/pages/DomainOverviewPage.tsx` — `intro`·`mode`·`onSetMode` prop 추가, 마운트 시 `onSetMode` 호출 useEffect 신설, `.domain-overview-intro` 배너 렌더링 추가(첫 도메인에서만 노출).
  - `eobom/frontend/src/index.css` — `.domain-overview-intro`/`-title`/`-text` 규칙 신설(데스크톱·640px 이하 둘 다).
- **결과**: `npx tsc --noEmit -p .`·`npm run build`(frontend) 둘 다 통과. grep으로 두 인트로 문자열이 `domainSlides.tsx`의 상수 선언부 각 1곳에만 있고 다른 곳엔 리터럴로 중복되지 않음을 확인. `care-guide`를 제외한 7개 도메인 전부 `loginRequired: true`임을 domainSlides.tsx 재확인. 실기기/브라우저 시각 확인은 이번 라운드에서 하지 않았다 — 이 세션은 dev 서버를 사용자 쪽에서만 기동하는 운용 방식이라, 이번엔 별도 요청이 없어 생략했다.
- **편차**:
  - 🔴 항목 3(로그인 게이트)은 코드 검토만으로 기존 구현이 스펙과 이미 일치함을 확인했고, 실기기/브라우저로 "비로그인 상태에서 `/prep`·`/bereaved` 직접 접근 → care-guide 카드만 게이트 없이 진입" 시나리오를 직접 재현 검증하지는 않았다. 판단이 필요한 모호함은 없었으므로(코드가 명확히 스펙대로 분기됨) 별도 구현 변경은 하지 않았다.
  - intro 배너를 "첫 도메인에서만 노출"로 설계한 것은 스펙에 명시되지 않은 판단이다 — 모든 도메인에서 계속 떠 있게 할 수도 있었으나, 화살표·점 인디케이터와 달리 내비게이션 기능이 없는 순수 설명문이라 오래 남으면 슬라이드 콘텐츠와 시각적으로 경합할 것으로 판단해 이렇게 정했다. 다른 노출 방식을 원하면 조정이 필요하다.
- **다음 에이전트가 알아야 할 것**:
  - `DomainOverviewPage.tsx`는 "전면 수정" 라운드에서 여러 차례 반복 수정을 거쳤다(오버레이 폐지 → 일반 페이지 → 풀페이지 스크롤 재도입 → Footer를 컨테이너 내부 마지막 섹션으로 편입 → 휠 민감도 조정) — 이번 항목 이전의 그 과정은 walkthrough.md에 기록돼 있지 않다(대화로만 진행됨). 필요하면 별도로 소급 기록을 요청할 것.
  - intro 배너(`.domain-overview-intro`)의 실기기 시각 검증(레이아웃 겹침 여부 등)이 아직 없다 — 점 인디케이터(`.domain-overview-dots`, 우측 세로 중앙)와의 좌우 충돌 가능성은 낮다고 판단했지만(배너는 좌측 상단, 점은 우측 중앙) 실측 확인을 권장한다.

- **판정**: ⚠️조건부 통과 (인트로 문구 일원화·모드 동기화 코드 반영 및 tsc·build 통과 확인 / 로그인 게이트는 코드 검토로 기존 일치 확인, 실기기 재현 검증 없음 / intro 배너 시각 검증 없음)

---

## 2026-08-25 (68) | [Sonnet] 모바일 전용 — 에필로그·Footer를 독립된 풀페이지 2개로 분리

- **근거 스펙**: (67) 배포 후 사용자 확인 — "바운스백 문제 해결 확인." 이어서 신규 요청: "웹 모바일 환경에 한해서 섹션3을 풀페이지 전체로 두고, footer만 따로 풀페이지화 할 수 있는가?" — 데스크톱은 지금처럼 한 화면에 같이 보이는 걸 유지하고, 모바일에서만 에필로그와 Footer를 각자 독립된 풀스크린 스냅 섹션으로 나눠 달라는 요청.
- **구현 방식**: DOM 구조(래퍼 div + 자식 `<section>` 2개)는 폭과 무관하게 항상 동일하게 두고, CSS 미디어쿼리로 "누가 스냅 대상인가"만 바꿨다 — 모바일 전용으로 아예 다른 컴포넌트 트리를 렌더링하는 대신, 이미 (67)에서 검증된 "높이를 콘텐츠에 맞게 풀고 scroll-snap-align:start는 유지" 패턴을 새 구조에 그대로 재적용했다.
  - **기본(데스크톱, ≥641px)**: `.epilogue-footer-wrapper`가 기존 `.fullpage-section`과 동일하게 고정 높이(`calc(100vh/100dvh - header)`)·`overflow-y:auto`·유일한 스냅 대상(`scrollSnapAlign:'start'`, 인라인) 역할을 그대로 한다. 두 자식 `<section>`(`.home-epilogue-section`·`.home-footer-section`)은 스냅 관련 속성이 전혀 없어 그냥 안의 콘텐츠 블록일 뿐이다 — 지금까지의 데스크톱 화면과 동일.
  - **640px 이하(모바일)**: 래퍼는 `scroll-snap-align:none !important`로 스냅 대상 자리에서 빠지고 `height:auto`(그냥 흘려보내는 컨테이너)가 된다. 대신 두 자식이 각자 `scroll-snap-align:start`(CSS로만 부여, 인라인 충돌 없어 `!important` 불필요) + `min-height: calc(100vh/100dvh - header)`를 받아 독립된 풀페이지가 된다. `height`는 고정하지 않고 `min-height`만 걸어서, Footer처럼 한 화면보다 콘텐츠가 긴 경우 (67)에서 검증된 "마지막 섹션은 스냅 지점까지만 딱 맞고 그 이후는 자유 스크롤" 동작이 그대로 적용된다.
- **건드린 파일**:
  - `eobom/frontend/src/pages/HomePage.tsx` — "[섹션 2] 에필로그 & 푸터" 블록을 `<section className="fullpage-section fullpage-section--fluid">` 하나에서 `<div className="epilogue-footer-wrapper">` + 자식 `<section className="home-epilogue-section">`·`<section className="home-footer-section">` 구조로 재작성. 내부 콘텐츠(배지·h2·p·`<Footer/>`)는 손대지 않음.
  - `eobom/frontend/src/index.css` — `.fullpage-section--fluid` 설명 주석을 "엔트리박스 섹션 전용"으로 좁혀 정정(에필로그+Footer는 더 이상 이 클래스를 안 씀). `.epilogue-footer-wrapper`(기본 + 640px 이하 스냅 해제) 및 `.home-epilogue-section`/`.home-footer-section`(640px 이하 스냅+min-height 부여) 규칙 신설.
  - `docs/작업일지_및_기록/에이전트_기록/walkthrough.md` — 이 항목.
- **결과**(`claude-in-chrome`, 같은 오리진 iframe 2개를 동시에 띄워 모바일(390px)·데스크톱(1200px)을 나란히 비교 — `resize_window` 대신 (67)에서 정착시킨 방법):
  - **데스크톱(1196px 실측)**: `.epilogue-footer-wrapper` `scroll-snap-align:start`(유일한 스냅 대상), 높이 811px. 자식 둘은 `scroll-snap-align:none`, 높이 각각 523px·288px — **합이 811px로 래퍼 전체와 정확히 일치** = 지금까지와 똑같이 한 화면에 같이 들어감을 수치로 확인.
  - **모바일(386px 실측)**: `.epilogue-footer-wrapper` `scroll-snap-align:none`(스냅 대상 아님). 자식 둘 다 `scroll-snap-align:start`, 각각 높이 832px(= 그 폭에서의 뷰포트-헤더 min-height, 두 섹션 다 콘텐츠가 그 안에 들어가 floor 값 그대로) — **독립된 풀페이지 2개로 정확히 분리**됨을 확인.
  - 두 프레임 다 `scrollWidth === clientWidth`(가로 오버플로 0).
  - `npx tsc --noEmit`·`npm run build`(frontend) 둘 다 통과.
- **편차**: 없음.
- **다음 에이전트가 알아야 할 것**:
  - 이번 실측은 특정 폭(모바일 386px·데스크톱 1196px) 스냅샷이다 — **실제 스크롤 제스처로 4단계(히어로→엔트리박스→에필로그→Footer)를 전부 순서대로 타고 내려가 보는 것**은 (63)·(65)·(67)과 마찬가지로 이 자동화 환경에서 재현 못 했다(터치 모멘텀 스냅 판정 자체를 시뮬레이션할 수 없다는 반복된 한계). 다음 실기기 확인에서 이 4단계 전체를 한 번에 봐 줄 것 — 특히 새로 생긴 엔트리박스→에필로그 전환, 에필로그→Footer 전환 둘 다.
  - `sections`(HomePage.tsx, `[hero, entry-boxes, footer]` 3개 고정)·점 인디케이터·`handleWheel`(데스크톱 전용)은 이번에 손대지 않았다 — 모바일에서 논리적으로는 이제 스냅 지점이 4개지만 JS는 여전히 3개로 안다. 점 인디케이터·화살표는 이미 640px 이하에서 숨겨져 있어((64)) 영향이 안 보이고, `handleWheel`은 터치가 아니라 마우스 휠 전용이라 모바일 터치 스크롤과 무관하다 — 그래서 지금은 문제가 없지만, 나중에 모바일에서도 점 인디케이터를 다시 보여주자는 요청이 오면 그때는 `sections` 배열이나 인덱스 계산 로직을 4단계에 맞게 손봐야 한다.

- **판정**: ⚠️조건부 통과 / 🔄스펙전환 대기 (데스크톱 1섹션·모바일 2섹션 DOM/CSS 분리 의도대로 반영 확인 / 다만 모바일 가변 높이와 mandatory 스냅의 구조적 충돌로 인한 바운스백 문제는 (62 Opus)에서 `00-23` §5.4-1 모바일 네이티브 스크롤 전환 결정이 내려졌으므로, 향후 모바일 네이티브 스크롤 정리 시 불필요한 스냅 코드 정합화 필요 / tsc·build 통과)

---

## 2026-08-25 (67) | [Sonnet] 섹션2→3 바운스백 재수정 + 섹션2 덜그럭거림 + 최소 280px 폭 지원

- **근거 스펙**: 사용자 직접 피드백 — "섹션1→2: 문제 해결됨. 섹션2→3: 바운스백 발생. +추가) 섹션2가 화면 전체에 담기지 못해 달그락거리면서 위아래로 움직일 수 있는 상황. +추가) 최소 디스플레이 가로 픽셀 280으로 잡아줘."
- **원인 분석 및 조치**:
  1. **섹션2→3 바운스백 재발**: (63)에서 마지막 섹션(에필로그+Footer)의 `scroll-snap-align`을 `none`으로 지웠던 게 원인으로 재판단했다 — "뒤에 스냅할 대상이 없으니 안 걸어도 된다"는 논리였는데, `mandatory` 스냅에서는 오히려 섹션3이 "유효한 스냅 후보가 아예 아니게" 돼 스크롤이 이전 유효 지점(섹션2)으로 되돌아가는 바운스백을 낳았다. `scroll-snap-align: start`를 되살리면 섹션3의 "맨 위"가 유효한 스냅 목표가 되어 거기까지는 깔끔히 스냅되고, 그 지점을 넘어서는(콘텐츠가 더 있는) 스크롤은 뒤에 스냅할 게 없으니 자유롭게 흐른다 — (65)에서 시도했던 "컨테이너 전체를 proximity로" 접근보다 실제 스펙 동작에 맞는 방식으로 판단해 이렇게 바꿨다.
  2. **섹션2 "덜그럭거림"**: 엔트리박스 섹션도 실기기 폭에 따라 콘텐츠가 고정 높이(뷰포트-헤더)를 근소하게 넘을 수 있는데, 그 섹션 자체에 `overflowY:'auto'`가 걸려 있어 안쪽 overflow 스크롤과 바깥 스냅 스크롤이 스크롤 제스처를 서로 가로채려 들어 흔들리는 느낌을 냈다. (63)에서 마지막 섹션에만 적용했던 "높이를 콘텐츠에 맞게 자동으로 늘리는" 처리를 엔트리박스 섹션에도 똑같이 적용해서, 애초에 안쪽에 넘칠 콘텐츠가 없게(overflow 자체가 발생 안 하게) 만들었다. 클래스명을 `.fullpage-section--tail`(마지막 섹션 전용이라는 의미)에서 `.fullpage-section--fluid`(콘텐츠에 맞춰 늘어난다는 의미)로 일반화해 두 섹션이 공유한다.
  3. **최소 280px 폭 지원**: `claude-in-chrome`에서 iframe(width:280px, 같은 오리진이라 `contentDocument` 직접 접근 가능 — `resize_window`가 이 세션에서 여전히 신뢰 불가라 대안으로 씀)을 만들어 실측, 두 가지 실제 가로 오버플로를 확인·수정했다.
     - **헤더**: 로그인 버튼("로그인" 텍스트, (64)에서 추가)과 로고(아이콘+"이어봄 Eobom" 워드마크, 480px 이하 0.8배 축소해도 ~146px)가 합쳐 278px 뷰포트에서 33px 오버플로. `EobomLogo.tsx`에 `className="eobom-logo-text"` 추가하고, 기존 480px 브레이크포인트(`.header-logo-wrap` scale(0.8)) 재사용해 그 폭에서 워드마크 텍스트를 숨기고 아이콘만 남김(`!important` 필요 — 인라인 `style={{display:'flex'}}`가 있어서, 이번엔 처음부터 붙여서 씀).
     - **그리드 minmax 고정값**: `.grid`(index.css, 320px)·`Footer.tsx`(260px)·`CounselingPage.tsx`(280px)·`EndingNotePage.tsx`(320px)·`BoxDetailOverlay.tsx`(320px)·`MemorialPage.tsx`(300px·130px) 전부 `minmax(Npx, 1fr)` 고정값이 한 트랙 최소폭을 강제해 280px보다 넓으면 무조건 가로 스크롤을 냈다. 이미 이 프로젝트에 있던 해법(`.auto-grid`·`ObituaryPage.tsx`가 쓰는 `minmax(min(Npx, 100%), 1fr)` 패턴, "기존 minmax(340px,1fr) 고정값은 375px에서 가로 스크롤 유발"이라는 선례 주석)을 그대로 적용했다. `AdminPage.tsx`의 동일 패턴은 00-09 §2.5(운영자 화면 밀도 우선) 기존 제외 방침에 따라 이번에도 손대지 않음.
- **건드린 파일**:
  - `eobom/frontend/src/index.css` — `.fullpage-section--tail`→`.fullpage-section--fluid`로 일반화·재작성(scroll-snap-align 제거 규칙 삭제, overflow-y:visible 추가), 관련 설명 주석 갱신. `.grid` minmax 수정. `.header-logo-wrap .eobom-logo-text` 480px 이하 숨김 규칙 추가.
  - `eobom/frontend/src/pages/HomePage.tsx` — 엔트리박스 섹션에 `fullpage-section--fluid` 클래스 추가, 마지막 섹션 클래스명 `--tail`→`--fluid` 변경, 관련 주석 갱신.
  - `eobom/frontend/src/components/EobomLogo.tsx` — 워드마크 wrapper div에 `className="eobom-logo-text"` 추가.
  - `eobom/frontend/src/components/Footer.tsx`, `eobom/frontend/src/pages/CounselingPage.tsx`, `eobom/frontend/src/pages/EndingNotePage.tsx`, `eobom/frontend/src/components/home/BoxDetailOverlay.tsx`, `eobom/frontend/src/pages/MemorialPage.tsx`(2곳) — `minmax(Npx, 1fr)` → `minmax(min(Npx, 100%), 1fr)`.
  - `docs/작업일지_및_기록/에이전트_기록/walkthrough.md` — 이 항목.
- **결과**(`claude-in-chrome`, iframe 280px 실측):
  - `document.documentElement.scrollWidth === clientWidth === 278`(가로 스크롤 0) — 헤더 로고 텍스트 숨김 전에는 `scrollWidth 311 vs clientWidth 263`(48px 초과, 로그인 버튼이 33px 튀어나온 게 주범)이었던 것과 대조 확인.
  - 세 스냅 섹션(0/1/2) 전부 이 폭에서 가로 오버플로 0 확인(스크롤 위치를 각 섹션 시작으로 옮겨가며 재측정).
  - `fullpage-section--fluid` 두 섹션 모두 `getBoundingClientRect().height === scrollHeight`(안쪽에 남는 overflow 없음), `scroll-snap-align: start` 정상 복원 확인.
  - `npx tsc --noEmit`·`npm run build`(frontend) 둘 다 통과.
  - 🔴 **섹션2→3 바운스백이 실제로 없어졌는지는 이번에도 실기기 검증을 못 했다** — CSS 스냅 동작(mandatory + 이제는 유효한 스냅 대상인 섹션3)은 이론과 스펙상으로는 맞지만, 이 자동화 환경(iframe 트릭)은 스크롤 위치를 `scrollTo()`로 즉시 대입하는 것만 확인 가능하고, 실제 터치 제스처 도중의 스냅 판정(모멘텀·중간 정지 등)은 재현 못 한다 — (65)에서도 같은 한계를 겪었다.
- **편차**: 없음.
- **다음 에이전트가 알아야 할 것**:
  - 🔴 **섹션2→3 바운스백은 이번이 세 번째 수정 시도다(63→65→67).** 다음 실기기 확인에서도 재발하면, CSS `scroll-snap-align`/`scroll-snap-type` 조합만으로는 이 정확한 케이스(마지막 섹션이 콘텐츠 초과분만큼 자유 스크롤돼야 하는 상황)를 이 실기기 브라우저가 스펙대로 처리하지 않는다는 뜻일 수 있다 — 그때는 JS로 터치 제스처 종료 시점에 직접 보정하는 방식(데스크톱 `handleWheel`과 비슷한 역할을 터치용으로 별도 구현)을 진지하게 검토할 것.
  - 280px 실측은 HomePage(+ Header/Footer/EobomLogo/EntryBoxes 등 그 안에서 쓰는 공용 컴포넌트)와, `minmax(Npx,1fr)` 그리드가 있던 나머지 5개 페이지/컴포넌트에 한정했다 — **사이트 전체(20여 개 페이지)를 280px 기준으로 전수 감사하지는 않았다.** 이번에 못 찾은 다른 형태의 고정폭 요소(고정 px width 버튼, min-width 등)가 다른 페이지에 남아있을 수 있다.
  - `resize_window`가 이 세션에서 계속 불안정해서, 이번엔 같은 오리진 iframe(`iframe.src`+`contentDocument`)으로 임의 폭을 강제하는 방법을 새로 썼다 — `resize_window`보다 훨씬 안정적이었다. 다음에도 좁은 폭 검증이 필요하면 이 방법을 먼저 시도할 것.

- **판정**: ✅부분 통과 (280px 최소폭 대응 `minmax(min(Npx, 100%), 1fr)` 5개 파일 반영 및 헤더 로고 워드마크 오버플로 해소 확인 / `.fullpage-section--fluid` 도입 확인 / ⚠️ 단, 섹션2→3 바운스백은 CSS mandatory 스냅과 가변 높이 간의 구조적 모순으로 인해 실기기에서 잔존 확인되어 이후 (62 Opus)에서 정책 전환됨 / build·tsc 0건 통과)

---

## 2026-08-25 (66) | [Sonnet] 캐러셀 터치 스와이프가 수직 스크롤을 가로채던 버그 수정

- **근거 스펙**: 사용자 직접 피드백 — "섹션1→2: 풀페이지 휠 느슨해서 중간에 멈추게 할 수 있음(현재). 섹션2→3: 풀페이지 휠 작동 안 하는 듯함, 또한 엔트리 박스 자체가 위아래로 움직여서 모바일 환경에서 휠 굴리기 어려움."
- **원인 분석**: `EntryBoxes.tsx`의 캐러셀 스와이프 감지(`handleTouchStart`/`handleTouchEnd`, `.entry-carousel-viewport`)가 **수평 이동량(deltaX)만 보고 수직 이동량(deltaY)은 아예 안 봤다** — `deltaX`가 40px만 넘으면 무조건 `goPrev`/`goNext`로 페이지를 넘겼다. 그런데 풀페이지 스크롤(섹션2→3 등)을 하려고 카드 위에서 아래로 스와이프하는 엄지 동작은 실제로는 순수 수직이 아니라 대각선이 섞이기 쉽고, 그 수평 성분이 40px를 넘으면 카드가 갑자기 옆 페이지로 튕겨 넘어갔다 — "카드가 위아래로 움직여서 휠 굴리기 어렵다"는 증상과, 엔트리박스 영역을 지나 섹션3으로 넘어가려는 스크롤 제스처가 카드 전환에 뺏겨 "휠이 작동 안 하는 듯"한 증상 둘 다 이 하나의 버그로 설명된다. 섹션1→2(히어로→엔트리박스) 전환의 "느슨함"은 엔트리박스 카드 영역 밖에서도 발생할 수 있는 별개 이슈로 보이며 이번엔 원인을 못 찾음(아래 "다음 에이전트" 참고).
- **건드린 파일**: `eobom/frontend/src/components/home/EntryBoxes.tsx` — `touchStartYRef` 추가, `handleTouchStart`가 Y좌표도 기록, `handleTouchEnd`가 `Math.abs(deltaX) <= Math.abs(deltaY)`이면(수직이 수평보다 크거나 같으면) 조기 반환해 페이지 전환을 아예 안 하도록 수정. 기존 40px 임계값(`threshold`)은 그대로 유지.
- **결과**: `npx tsc --noEmit`·`npm run build`(frontend) 둘 다 통과. `claude-in-chrome`에서 `Touch`/`TouchEvent` 생성자로 합성 터치 이벤트를 `.entry-carousel-viewport`에 직접 `dispatchEvent`해 로직을 검증했다(이 자동화 환경은 실제 터치스크린이 없어 `computer` 도구의 마우스 기반 동작으로는 `onTouchStart`/`onTouchEnd`가 아예 안 불림 — 합성 이벤트가 유일한 검증 수단):
  - 수직 위주 스와이프(deltaX=50 — 기존 40px 임계값은 넘음, deltaY=120으로 수직이 훨씬 큼) → 페이지 안 바뀜(수정 전이었다면 deltaX만 보고 페이지가 넘어갔을 상황).
  - 수평 위주 스와이프(deltaX=-80, deltaY=10) → 정상적으로 다음 페이지로 전환됨(기존 스와이프 내비게이션 회귀 없음 확인).
- **편차**: 없음.
- **다음 에이전트가 알아야 할 것**:
  - 🔴 **섹션1→2(히어로→엔트리박스) "느슨해서 중간에 멈춤" 문제는 이번에 원인을 못 찾았다.** 이 전환은 엔트리박스 카드 영역 밖(히어로 배경)에서도 시작될 수 있어 이번에 고친 캐러셀 터치 버그와 무관할 가능성이 높다 — `scroll-snap-type: y mandatory`가 실제 모바일 브라우저에서 100% 강제되지 않는 건 알려진 플랫폼 한계이기도 하다(빠른 플릭이 중간에 새 터치로 끊기는 경우 등). 다음 라운드에서 여전히 재현되면, CSS만으로는 한계가 있을 수 있어 `scrollend` 이벤트를 듣고 JS로 정확한 섹션 경계까지 보정 스크롤하는 방식(데스크톱의 `handleWheel`과 비슷한 역할을 터치에도 만드는 것)을 검토할 것 — 이번엔 반복된 회귀 위험 때문에 시도 안 함.
  - 이번 수정으로 (63)~(65)에서 반복 보고된 "섹션2→3 바운스백/안 움직임" 문제도 상당 부분 해소됐을 것으로 추정하지만, 실제 원인이 캐러셀 터치 가로채기였다면 그렇다는 것이고, `scroll-snap-type`(현재 `mandatory`, (65)에서 되돌림) 자체의 문제가 일부 남아있을 가능성도 배제 못 한다 — 다음 실기기 확인에서 섹션2→3 전환도 같이 재확인 필요.

- **판정**: ✅통과 (`EntryBoxes.tsx` 수직 이동량 우세 시(`Math.abs(deltaX) <= Math.abs(deltaY)`) 스와이프 조기 반환 처리 확인 / 세로 스크롤 제스처의 가로 캐러셀 오인식 방지 정상 동작 / 풀페이지 스냅 폐지 이후에도 캐러셀 자체 필수 로직으로 유지 확인 / tsc·build 0건 통과)

---

## 2026-08-25 (65) | [Sonnet] (64) 재지적 대응 — `scroll-snap-type: proximity` 되돌림(회귀 수정)

- **근거 스펙**: 사용자 직접 피드백 — "풀페이지 휠 자체가 전체적으로 무너진 느낌 이상하게 작동됨." (64)에서 640px 이하 `.home-scroll-container`에 `scroll-snap-type: y proximity !important`를 건 것이 원인으로 추정.
- **원인**: `scroll-snap-type`은 컨테이너 전체에 걸리는 값이라, 섹션1(엔트리박스)→마지막 섹션(꼬리) 전환의 바운스백만 노리고 낮췄는데 섹션0(히어로)↔섹션1(엔트리박스) 전환의 스냅감까지 같이 느슨해졌다 — "특정 전환만 고친다"는 원래 의도보다 넓은 범위에 영향을 준 것이 회귀 원인.
- **건드린 파일**:
  - `eobom/frontend/src/index.css` — `.home-scroll-container { scroll-snap-type: y proximity !important; }` 규칙 삭제, 되돌린 이유를 설명하는 주석으로 대체. `.fullpage-section--tail`(마지막 섹션 높이 auto + `scroll-snap-align:none`, (63)에서 추가)은 그대로 유지 — 이건 마지막 섹션 하나에만 좁게 걸리는 값이라 이번 회귀와 무관하다고 판단해 손대지 않음.
  - `eobom/frontend/src/pages/HomePage.tsx` — 스크롤 컨테이너 위 주석을 "proximity로 낮춘다"→"되돌렸다"로 정정(코드 자체는 원래도 `scrollSnapType:'y mandatory'`만 있었고 안 바뀜, 인라인 스타일은 (64)에서도 안 건드렸었다 — 주석만 최신화).
- **결과**(`claude-in-chrome`, 데스크톱 폭에서 확인 — 이번엔 640px 이하 재현이 아니라 "되돌리기가 제대로 됐는지"만 확인하면 되므로 좁은 뷰포트 불필요):
  - `getComputedStyle(container).scrollSnapType` → `"y mandatory"` 확인(더 이상 `proximity` 아님).
  - 실제 휠 스크롤 3틱으로 히어로→엔트리박스 전환 시 섹션 경계에 정확히 맞춰 스냅되는 것을 스크린샷으로 확인(전환 후 카드가 잘리거나 중간에 걸치는 현상 없음) — 회귀 이전(정상) 동작으로 복원됨을 확인.
  - `npx tsc --noEmit`·`npm run build`(frontend) 둘 다 통과.
- **편차**: 없음(코드 되돌리기).
- **다음 에이전트가 알아야 할 것**:
  - 🔴 **섹션1→마지막 섹션(꼬리) 전환 시 바운스백 문제((63)에서 최초 발견)가 재발했을 가능성이 있다.** proximity를 되돌렸으므로 `.fullpage-section--tail`의 `scroll-snap-align:none` 단독으로 그 문제를 막아주는지 다음 실기기 확인에서 최우선으로 봐야 한다. 만약 여전히 바운스백이 있다면, **컨테이너 전체가 아니라 이 전환 하나에만 국한된 해결책**이 필요하다 — 예를 들면 JS로 섹션1→마지막 섹션 전환 순간에만 일시적으로 `scroll-snap-type`을 껐다가 전환이 끝나면 되돌리는 방식, 또는 애초에 이 특정 전환만 JS 터치 핸들러로 명시적으로 처리하는 방식(현재 `handleWheel`은 데스크톱 전용이고 터치에는 관여 안 함) 등을 검토할 것 — **컨테이너 전체에 스냅 완화를 거는 방식은 이번에 확인했듯 다른 전환들을 망가뜨리므로 다시 쓰지 말 것.**
  - (64)의 나머지 4건(스크롤 힌트 숨김·점 인디케이터 숨김·로그인 버튼 짧은 라벨·로그인 모달 스크롤)은 이번 재지적과 무관해 보이며 그대로 유지했다 — 문제가 있었다면 사용자가 함께 언급했을 것으로 판단.

- **판정**: ✅통과 (컨테이너 전역 `scroll-snap-type: proximity` 적용에 따른 섹션 0↔1 스냅감 훼손 회귀 복구 확인 / `mandatory` 원상복구 및 주석 최신화 확인 / tsc·build 0건 통과)

---

## 2026-08-25 (64) | [Sonnet] (63) 실기기 확인 후 5건 수정 — 스크롤 힌트·점 인디케이터·바운스백·로그인 버튼·로그인 모달

- **근거 스펙**: 사용자 직접 피드백(2026-08-25, (63) 실기기 확인 후) — ① "웹에서 효과적이던 상하 화살표가 모바일에서 거슬림." ② "섹션2→3으로 내리려는데 다시 섹션2로 복귀됨." ③ "오른쪽 점 세 개 표시가 화면을 가림." ④ "로그인 버튼이 출구처럼 보임." ⑤ "로그인 모달이 화면보다 커서 제대로 안 나옴."
- **건드린 파일**:
  - `eobom/frontend/src/pages/HomePage.tsx` — 우측 점 인디케이터 div에 `className="home-section-dots"`, 스크롤 컨테이너 div에 `className="home-scroll-container"` 추가(스타일은 안 건드림, 클래스 훅만).
  - `eobom/frontend/src/index.css`
    - `.scroll-hint--in-viewport`(HomePage 전용 — BoxDetailOverlay는 이 modifier를 안 씀) 640px 이하 `display:none`(①).
    - `.home-scroll-container` 640px 이하 `scroll-snap-type: y proximity !important`(② — 인라인 `style={{scrollSnapType:'y mandatory'}}` 때문에 `!important` 필요, `.sidebar`·(62)의 `.chip-row`와 같은 패턴).
    - `.home-section-dots` 640px 이하 `display: none !important`(③ — 처음엔 `!important` 없이 넣었다가 `getComputedStyle`이 여전히 `flex`를 반환하는 걸 실측으로 발견, 인라인 `style={{display:'flex'}}` 때문 — **같은 세션에서 세 번째로 반복된 실수**, 아래 "다음 에이전트" 참고).
    - `.header-btn-label-short` 신설(기본 `display:none`, 640px 이하 `display:inline`).
  - `eobom/frontend/src/components/Header.tsx` — 로그인 버튼에 `<span className="header-btn-label-short">로그인</span>` 추가(기존 `header-btn-label`의 전체 텍스트 "로그인 / 회원가입"는 그대로 유지, 640px 이하에서만 짧은 텍스트로 교체 — ④, 아이콘만 남아 "출구"처럼 보이던 문제를 라벨 복원으로 해결. 전체 텍스트를 그대로 두면 375px에서 폭 계산상 넘칠 것으로 추정돼 짧은 버전을 새로 만듦).
  - `eobom/frontend/src/components/LoginModal.tsx` — 배경 오버레이에 `overflowY:'auto'`, 모달 카드에 `maxHeight:'90vh'`+`overflowY:'auto'`+`WebkitOverflowScrolling:'touch'` 추가(⑤ — 기존엔 카드 높이 제한이 전혀 없어 콘텐츠가 뷰포트보다 크면 위아래가 화면 밖으로 잘려 나가고 배경에 스크롤도 없어 도달 불가능했음).
  - `docs/작업일지_및_기록/에이전트_기록/walkthrough.md` — 이 항목.
- **결과**(`claude-in-chrome`, 500~580px 폭 확보해 실측):
  - `--header-h`·`.home-section-dots`(`display:none`, `!important` 수정 후 재확인)·`.header-btn-label-short`(`display:inline`, 텍스트 "로그인")·`.header-btn-label`(`display:none`) 전부 `getComputedStyle`로 의도한 값 확인.
  - **로그인 모달**: `maxHeight` 계산값 531px(뷰포트 590px의 90%)·`overflowY:auto` 확인, 실제로 스크롤해서 동의 체크박스 3개→소셜 로그인 3종→파트너 링크→데모 버튼까지 전부 화면 안에서 도달 가능한 것을 스크린샷으로 확인.
  - **`.home-scroll-container`의 `scroll-snap-type`**: 🔴 이 브라우저(User-Agent `Chrome/151.0.0.0` — 실존하지 않는 미래 버전, 이 자동화 도구 전용 빌드로 추정)의 CSSOM이 `proximity` 값을 직렬화(serialize)하지 않는 버그/특이 동작을 확인했다. `CSS.supports('scroll-snap-type','y proximity')`는 `true`를 반환하고(문법상 유효) `style.setProperty('scroll-snap-type','y proximity')` 직후 `cssText`를 읽으면 `"scroll-snap-type: y;"`로 strictness 키워드가 사라진 채 나온다(순수 CSSOM 테스트로 재현, `mandatory`는 정상 직렬화됨 — `proximity`만 이 현상). **실제 스크롤 동작이 정말 proximity로 적용되는지, 아니면 이 직렬화 버그가 적용 자체도 막는지는 확인 못 했다** — 데스크톱에서는 `handleWheel`(HomePage.tsx)이 wheel 이벤트를 완전히 가로채(`preventDefault`) 네이티브 CSS 스냅 자체가 아예 개입하지 않아(휠 한 번 = `container.scrollTo(정확히 다음 섹션 배수)`로만 이동, 실측으로 확인: 5틱 스크롤 후 `scrollTop`이 정확히 `2×clientHeight`), 이 자동화 환경에서는 애초에 CSS `scroll-snap-type`이 실제로 관여하는 상황(터치 스크롤)을 재현할 수 없었다.
  - `npx tsc --noEmit`·`npm run build`(frontend) 둘 다 통과.
- **편차**: 없음.
- **다음 에이전트가 알아야 할 것**:
  - 🔴 **이 코드베이스에서 인라인 `style={{ display: ... }}`가 있는 요소를 CSS 미디어쿼리로 숨기려 할 때마다 `!important`를 까먹는 실수가 이번 세션에서만 세 번 반복됐다** — `.chip-row`((62)), `.home-section-dots`(이번). 매번 "규칙은 넣었는데 `getComputedStyle`로 찍어보니 안 먹힘"이라는 같은 패턴으로 발견했다. **앞으로 인라인 `style` prop이 있는 JSX 요소를 CSS class로 오버라이드할 때는 처음부터 `!important`를 붙이고 시작하거나, 최소한 커밋 전에 `getComputedStyle`로 실제 적용 여부를 확인할 것** — "규칙이 스타일시트에 존재한다"와 "실제로 적용된다"는 다른 확인이다.
  - 🔴 **`.home-scroll-container`의 `scroll-snap-type: y proximity`가 실제 터치 스크롤에서 바운스백을 막아주는지는 미검증 상태다.** 다음에 실기기(또는 진짜 모바일 에뮬레이션이 되는 환경)에서 가장 먼저 확인해야 한다 — 안 먹히면 대안으로 (a) `scroll-snap-type`을 아예 `none`으로 낮추고 점 인디케이터/스와이프만으로 섹션 이동을 처리하거나, (b) 마지막 섹션 진입 시 JS로 `scroll-snap-type`을 일시적으로 끄는 방법을 검토할 것.
  - 이번 세션에서 `resize_window`가 다시 간헐적으로 동작했다((63)에서는 5번 연속 실패했었는데 이번엔 몇 번 재시도 후 500~580px을 얻어냈다) — 여전히 예측 불가능하니 매번 `window.innerWidth`로 실제 폭을 확인하고 시작할 것.
  - LoginModal.tsx와 비슷한 구조(내부 스크롤 없는 고정 카드)를 쓰는 다른 모달(`ConsultRequestModal.tsx`·`InquiryModal.tsx`·`FacilityReviewModal.tsx`·`TaxSimulatorModal.tsx` 등)도 콘텐츠가 길면 같은 문제를 겪을 수 있다 — 이번엔 사용자가 지목한 LoginModal만 고쳤고 나머지는 확인 안 함.

- **판정**: ✅통과 (640px 이하 스크롤 힌트·점 인디케이터 숨김 및 `!important` 적용 확인 / 로그인 버튼 짧은 라벨 분기 추가 확인 / `LoginModal.tsx` `maxHeight: 90vh` 및 스크롤 부여로 오버플로 해소 확인 / tsc·build 0건 통과)

---

## 2026-08-25 (63) | [Sonnet] 헤더 높이 모바일 축소 + 마지막 섹션(에필로그+Footer) 스냅 해제

- **근거 스펙**: 사용자 직접 피드백(2026-08-25, (62) 이후) — ① "모바일에서 헤더 높이 너무 높아서 자리 많이 차지." ② "섹션3(에필로그)과 Footer가 웹에서는 한 페이지에 자연스럽게 보이는데 모바일에서는 스크롤해야 하고, 그 경계가 이도저도 아닌 모호한 상태." ③ "섹션2(엔트리박스) 페이지가 전체페이지보다 살짝 큼 — 헤더 높이 설정 후 재확인 필요."
- **원인 분석 및 실측**(`claude-in-chrome`, `resize_window`로 569px 폭 확보 후 `window.innerWidth`/`getComputedStyle`/`getBoundingClientRect`로 직접 측정 — (62)에서 남긴 "스크린샷 픽셀 크기만 믿지 말 것" 교훈 적용):
  - `--header-h`가 640px 이하 모바일에서도 데스크톱과 동일한 85px 고정값이었다. 이 토큰은 `.fullpage-section`(HomePage 풀페이지 스냅 섹션) 높이 계산(`calc(100vh - var(--header-h))`)에도 그대로 쓰여, 헤더가 클수록 스냅 섹션의 가용 높이가 줄어드는 구조.
  - 헤더 높이만 64px로 낮춘 상태에서 재측정: **섹션0(히어로)·섹션1(엔트리박스, 사용자 표현 "섹션2")은 overflow 0** — ③은 헤더 높이 조정만으로 해소 확인.
  - **섹션2(에필로그+Footer, 사용자 표현 "섹션3+Footer")는 여전히 overflow 396px**(섹션 높이 531px, 실제 콘텐츠 927px) — `Footer.tsx`의 3열 그리드(`auto-fit, minmax(260px,1fr)`)가 좁은 폭에서 1열로 접히며 세로로 크게 길어지는 게 근본 원인. 헤더 21px 절약으로는 못 메우는 격차라 별도 처리가 필요했다(②).
- **건드린 파일**:
  - `eobom/frontend/src/index.css`
    - 기존 `@media (max-width:640px)` 헤더 블록에 `:root { --header-h: 64px; }` 추가(데스크톱 85px은 그대로 — A안 재구성 확정값이라 안 건드림).
    - `.fullpage-viewport,.fullpage-section` 높이 규칙 뒤에 `.fullpage-section--tail` 신설 — 640px 이하에서 `height: auto; min-height: calc(100vh/100dvh - var(--header-h)); scroll-snap-align: none !important;`. 마지막 섹션이라 뒤에 스냅할 대상이 없으므로, 고정 높이 스냅에 억지로 맞추는 대신 콘텐츠 높이만큼 자연스럽게 늘어나는 일반 스크롤 꼬리로 바꿔 "경계 모호함" 문제 자체를 없앴다(`scroll-snap-align`은 HomePage.tsx 인라인 `style={{scrollSnapAlign:'start'}}`가 있어 `!important` 필요 — (62)에서 겪은 것과 같은 패턴).
  - `eobom/frontend/src/pages/HomePage.tsx` — 마지막 `<section>`(에필로그+Footer)의 `className`을 `"fullpage-section"` → `"fullpage-section fullpage-section--tail"`로 변경(스타일 인라인은 안 건드림, 클래스 하나만 추가).
  - `docs/작업일지_및_기록/에이전트_기록/walkthrough.md` — 이 항목.
- **결과**:
  - `npx tsc --noEmit`·`npm run build`(frontend) 둘 다 통과.
  - 헤더 높이 64px 적용 + 섹션0·섹션1 overflow 0은 569px 실측으로 **확인 완료**.
  - `.fullpage-section--tail` 규칙은 컴파일된 스타일시트에 정확한 선택자·`!important`·640px 조건으로 등록돼 있고 `<section>` DOM에 클래스도 정상 부여된 것을 `document.styleSheets` 순회 + `className` 조회로 **확인**했다.
  - 🔴 다만 **이 CSS가 실제로 브라우저에서 마지막 섹션을 자유 스크롤로 바꿔주는지는 실제 좁은 뷰포트에서 스크롤 동작까지는 재현 못 했다** — 이번 세션 후반부에 `resize_window`가 완전히 응답을 멈춰(같은 폭 요청을 5번 연속 시도해도 매번 1920×975로 고정) 새 탭을 계속 새로 만들어도 좁은 뷰포트를 다시 확보하지 못했다. (62)에서 이미 검증했던 것과 동일한 방식(정적 규칙 검사 + 셀렉터/DOM 확인)으로 대체 확인.
- **편차**: 없음.
- **다음 에이전트가 알아야 할 것**:
  - 🔴 **`resize_window`가 이번 세션 후반부부터 완전히 먹통이 됐다(새 탭을 만들어도 항상 1920×975로 고정).** (62)에서는 같은 도구로 500~842px 사이를 여러 번 성공적으로 얻어냈었다 — 이 세션 안에서도 신뢰도가 시간에 따라 변한다는 뜻. 다음에 이 도구를 쓸 때는 몇 번 시도해서 안 되면 바로 포기하고 정적 검증(컴파일된 CSS 규칙 텍스트 + DOM className 대조)으로 넘어갈 것 — 이번처럼 5번 이상 반복 시도는 비효율적이었다.
  - **`.fullpage-section--tail`의 실제 스크롤 동작(스냅이 안 걸리고 자연스럽게 꼬리처럼 이어지는지, 위로 다시 스크롤할 때 섹션1로 잘 스냅되는지)은 다음 세션에서 좁은 뷰포트를 확보하는 즉시 가장 먼저 확인해야 한다** — 정적 규칙 확인만으로는 `scroll-snap-type: y mandatory`(컨테이너, HomePage.tsx 인라인)와의 상호작용이 실제로 매끄러운지까지는 보장 못 한다(이론상으로는 마지막 스냅포인트 이후 자유 스크롤이 되는 게 표준 동작이지만 브라우저 실측 필요).
  - 배포 후 375px 실기기 재확인도 여전히 밀려 있다((59)부터 누적) — 이번 로컬 변경분까지 합쳐서 한 번에 확인하는 게 나을 것.

- **판정**: ✅통과 (모바일 `--header-h: 64px` 축소로 가용 화면 높이 확보 확인 / `.fullpage-section--tail` 에필로그+Footer 높이 auto 조정 확인 / tsc·build 0건 통과)

---

## 2026-08-25 (62) | [Sonnet] `claude-in-chrome` 실기동 검증 — `.chip-row` `!important` 누락 발견·수정

- **근거 스펙**: 사용자 지시 — "(61) 커밋 전에 `claude-in-chrome`으로 먼저 점검해줘." (61)의 `.chip-row { display: none; }`가 실제로 브라우저에서 적용되는지 검증하는 과정에서 버그를 발견해 같은 자리에서 수정.
- **검증 방법**: `npm run dev`(사용자가 이미 실행 중이던 서버, `vite.config.ts`의 `.certs/` 인증서 존재로 **HTTPS**로 뜬다 — `http://localhost:5173`은 빈 응답(curl 52)만 오고 실제로는 `https://localhost:5173`이어야 접속됨, 이번에 처음 확인). `resize_window`로 390px 요청 시 실제 적용 폭이 500~1562px 사이로 들쭉날쭉했다(이 환경의 알려진 한계 — 아래 "다음 에이전트" 참고) — 매번 `window.innerWidth`를 JS로 직접 재확인해 실제로 767px 이하가 됐을 때만 판단 근거로 썼다(스크린샷 픽셀 크기만 보고 모바일이라 착각하면 안 됨, 처음엔 이 착각으로 오판할 뻔했다).
- **발견한 문제**: `EntryBoxes.tsx`의 `ChipRow` div가 `className="chip-row"`와 **동시에** `style={{ display: 'flex', ... }}` 인라인 스타일을 갖고 있었다. 인라인 스타일은 `!important` 없는 외부 클래스 규칙보다 항상 우선하므로, (61)이 추가한 `.chip-row { display: none; }`는 조용히 무시되고 있었다 — `getComputedStyle`로 직접 찍어보고서야 `display: flex`가 나오는 걸 발견(같은 파일 `.sidebar { display: none !important; }`가 이미 겪은 것과 동일한 패턴, 그때는 주석으로 남겨뒀는데 이번 칩 작업 때 그 교훈을 놓쳤다).
- **건드린 파일**: `eobom/frontend/src/index.css` — `.chip-row { display: none; }` → `.chip-row { display: none !important; }` + 원인·근거 주석 추가.
- **결과**: 수정 후 500px 폭(`window.matchMedia('(max-width:767px)').matches === true` 확인된 상태)에서 `getComputedStyle(chip).display === 'none'`, `getComputedStyle(arrow).display === 'none'` 둘 다 확인. 스크린샷으로 3개 구간 육안 확인:
  - **히어로**: 문단(연한 회색) 대비 양호, 사진은 우하단에만 은은하게 보임 — 정상.
  - **엔트리박스②(임종·사후 정리)**: 칩 없이 헤더+부제목만, 박스①과 높이가 거의 같고 캐러셀 점 인디케이터·아래 화살표까지 스크롤 없이 한 화면에 다 들어옴 — (59)~(61)이 겪던 "화면 밖으로 밀림" 문제 해소 확인.
  - **에필로그+Footer**: 배경 사진이 거의 안 보일 정도로 옅게 눌려 있고 `var(--text-muted)` 문단·Footer 텍스트 대비 양호 — (60)에서 고친 게 그대로 유효함을 재확인(사용자가 "마지막 섹션은 좋다"고 한 것과 일치).
  - `document.documentElement.scrollWidth === clientWidth === 500` — 가로 스크롤 없음.
  - `npx tsc --noEmit`·`npm run build`(frontend) 둘 다 통과.
- **편차**: 없음(스펙 문서 변경 아님).
- **다음 에이전트가 알아야 할 것**:
  - 🔴 **이 환경의 `resize_window`는 신뢰할 수 없다.** 요청한 폭(예: 390px)과 실제 `window.innerWidth`가 전혀 다르게 나온다(같은 390 요청에 658 또는 1562가 나오는 등 재현성 없음, 원인 미확정 — OS 디스플레이 배율 추정이나 확인 못 함). **스크린샷 픽셀 크기만 보고 "좁아 보이니 모바일이겠지"라고 판단하면 안 된다** — 이번에 실제로 그렇게 오판할 뻔했다. 매번 `window.innerWidth`/`matchMedia`를 JS로 직접 찍어 실제 폭을 확인한 뒤에만 결과를 신뢰할 것. 새 탭을 만들고 `resize_window` → `navigate` 순서로 한 번에 시도했을 때 간헐적으로 767px 이하가 나왔다(이번엔 500px 성공) — 안 되면 탭을 닫고 새로 만들어 재시도.
  - **로컬 dev 서버는 `https://localhost:5173`다, `http://`가 아니다** — `eobom/.certs/`에 mkcert 인증서가 있으면 `vite.config.ts`가 자동으로 HTTPS를 켠다(위치 API 때문, README 참고). `http://localhost:5173`으로 접속 시도하면 빈 응답만 오고 조용히 실패한다(TLS 포트에 평문 HTTP를 보내는 상황이라 curl은 "Empty reply", 브라우저는 에러 페이지).
  - 데스크톱 Chrome은 `resize_window`로 폭을 줄여도 `@media(hover:hover)`가 여전히 참으로 잡힌다(마우스 있는 환경이라) — 그래서 `EntryBoxes.tsx`의 `RevealContent`가 실제 터치 기기처럼 "항상 펼쳐진" 상태를 재현하지 못하고 계속 접힌 채로 보인다("자세히 보기" 버튼이 안 보이는 이유). 칩 숨김처럼 폭 기반 미디어쿼리만 걸린 항목은 이 도구로 검증 가능하지만, hover 유무에 좌우되는 항목(펼침 여부 자체)은 이 방법으로 실기기와 다르게 나온다는 걸 감안할 것.

- **판정**: ✅통과 (`claude-in-chrome` 실기동 기반 `.chip-row` 인라인 `style` 우선순위 충돌 발견 및 `!important` 오버라이드 보정 확인 / 모바일 엔트리박스 카드 화면 밀림 방지 확인 / tsc·build 0건 통과)

---

## 2026-08-25 (61) | [Sonnet] (60) 배포 후 재지적 대응 — 캐러셀 화살표 모바일 숨김 + 히어로 스크림 진하게

- **근거 스펙**: 사용자 직접 피드백((60) 커밋·배포 후 실기기 확인, 2026-08-25) — ① "엔트리 박스가 화면에 다 나오지 못함. 좌우 화살표 및 여백이 너무 많은 공간 차지 → 웹과는 다른 방식의 출력이 필요해 보임." ② "마지막 섹션은 좋은 투명도를 가지고 있음(=(60)의 `.duo-photo-scrim` 수정이 유효했다는 확인). 첫 화면(장례가 끝이 아니었습니다)의 배경 투명도 문제 여전함" — 즉 히어로 섹션(`.hero-photo-scrim`)은 (60)에서 안 건드려 그대로 남아있던 문제.
- **원인 분석**:
  - `.entry-carousel`은 데스크톱과 동일하게 좌우 화살표(56px 터치 타겟) 2개 + `gap:1rem`을 모바일에서도 그대로 썼다. 375px 폭에서 화살표 2개+gap만 약 148px를 차지해 실제 카드 폭이 지나치게 좁아졌다(체감상 "화면에 다 못 나옴").
  - `.hero-photo-scrim`은 (60)에서 `.duo-photo-scrim`만 고치고 히어로 쪽은 빠뜨렸다 — 768px 이하 0.68, 480px 이하 0.58(오히려 더 옅음, 좁을수록 대비가 더 필요하다는 방향과 반대)로 남아 있어 `.hero-content-card`의 연한 회색(`#6C7A89`) 문단이 사진 위에서 계속 잘 안 보였다.
- **건드린 파일**:
  - `eobom/frontend/src/index.css`
    - `.entry-carousel-arrow` 480px 블록 뒤에 `@media (max-width: 767px)` 신설 — 화살표 `display: none`, `.entry-carousel-viewport` 좌우 padding을 `clamp(0.75rem,4vw,4rem)`에서 `0.5rem` 고정으로 축소. 모바일은 스와이프(`EntryBoxes.tsx`의 기존 `handleTouchStart`/`handleTouchEnd`)+점 인디케이터로만 페이지 이동(로직 변경 없음, 화살표는 DOM엔 남아있고 CSS로만 숨김 — 클릭 핸들러·ref 그대로라 767px 초과로 리사이즈되면 다시 나타남).
    - `.hero-photo-scrim` — 768px 이하 0.68→0.88, 480px 이하 0.58→0.92로 상향(480이 768보다 더 진하도록 방향도 바로잡음, `.duo-photo-scrim`과 같은 처리).
- **결과**: `npx tsc --noEmit -p .`(frontend) 통과. `npm run build`(frontend) 통과(4.22s, 에러 없음). 브라우저 실기동 검증은 안 함 — 이번에도 로컬 변경분, 배포 후 재확인 필요.
- **편차**: 없음.
- **다음 에이전트가 알아야 할 것**:
  - 🔴 **배포 후 재확인 필요 — 이번이 세 번째 라운드다((59)→(60)→(61)).** 매번 배포 후 사용자가 실기기로 확인하고서야 다음 문제가 드러났다. 다음 배포 후에는 가능하면 이 에이전트가 먼저(사용자 재지적 전에) `claude-in-chrome`으로 375px 뷰포트를 흉내 내 히어로·엔트리박스 캐러셀·에필로그 세 구간을 스크린샷으로 직접 확인하는 게 낫다 — 지금까지는 전부 코드 추론에만 의존했다.
  - 화살표를 `display:none`으로만 숨겼기 때문에 767px 이하에서도 `.entry-carousel-arrow`의 클릭 핸들러(`goPrev`/`goNext`)·`prevArrowRef`/`nextArrowRef`는 그대로 살아있다 — 키보드 방향키(`handleCarouselKeyDown`)는 화살표 가시성과 무관하게 계속 동작하므로 접근성 경로는 안 끊겼다.

- **판정**: ✅통과 (767px 이하 캐러셀 화살표 숨김 및 패딩 축소로 모바일 카드 폭 가용 공간 확보 확인 / 키보드 접근성 유지 확인 / `.hero-photo-scrim` 0.88/0.92 상향으로 문단 대비 가독성 확보 확인 / tsc·build 0건 통과)

---

## 2026-08-25 (60) | [Sonnet] 조치 A·B 배포 직후 모바일 재지적 대응 — 박스② 칩 숨김 + duo-scrim 진하게

- **근거 스펙**: 사용자 직접 피드백(2026-08-25, (59) 직후) — "모바일 화면에서 정상출력안됨. 특히 엔트리박스2(임종 및 사후정리)가 내용 많아서 아래로 길어지면서 문제 발생" + "섹션1의 배경이 더 옅어야할 것 같아. 연한 글자는 잘 안보임."
- **원인 분석**:
  - `EntryBoxes.tsx`의 `RevealContent`(칩+CTA)는 `@media(hover:hover)`에서만 접혀 있고, 767px 이하(호버 없는 기기)는 항상 펼쳐진 채로 렌더된다. 박스②(`box2Keys` 7개)는 칩이 7개라 모바일 폭에서 3줄 이상으로 줄바꿈되고, (59)의 조치 A(루트 폰트 +12.5%)까지 겹치면서 카드 높이가 `.fullpage-section`의 뷰포트 고정 높이(스크롤 스냅 1페이지)를 넘어서 콘텐츠가 화면 밖으로 밀려나는 문제로 추정.
  - `.duo-photo-scrim`(진입4박스+에필로그 공용 배경, "섹션1"로 지칭)은 모바일에서도 사진이 상당히 비치는 그라데이션/고정값이었는데, `Footer.tsx`(배경 투명)와 에필로그 문단이 자체 배경 없이 이 스크림 위에 `var(--text-muted)`(연한 회색) 글자로 바로 얹혀 있어 대비가 부족했다.
- **건드린 파일**:
  - `eobom/frontend/src/components/home/EntryBoxes.tsx` — `ChipRow`의 wrapper div에 `className="chip-row"` 추가(스타일 변경 없음, 훅 지점만 추가).
  - `eobom/frontend/src/index.css` — `@media (max-width: 767px) { .entry-boxes-grid {...} }` 블록에 `.chip-row { display: none; }` 추가(칩은 "자세히 보기" 오버레이 슬라이드에 동일 항목이 있어 정보 손실 아님). `.duo-photo-scrim`의 768px 그라데이션 7개 stop과 480px 고정값을 전반적으로 한 단씩 더 진하게(불투명하게) 올림(0.62~0.97 → 0.78~0.99, 0.82 → 0.9).
  - `docs/작업일지_및_기록/에이전트_기록/walkthrough.md` — 이 항목.
- **결과**: `npx tsc --noEmit -p .`(frontend) 통과. `npm run build`(frontend) 통과(5.32s, 에러 없음). 브라우저 실기동 검증은 안 함 — 로컬 변경분이라 배포 후 재확인 필요.
- **편차**: 없음(스펙 문서 변경 아님, 사용자 직접 신고에 대한 즉시 대응).
- **다음 에이전트가 알아야 할 것**:
  - 🔴 **배포 후 375px 실측 필요.** `.chip-row` 숨김으로 박스②가 한 화면 안에 들어오는지, `.duo-photo-scrim` 강화로 Footer·에필로그 문단 대비가 개선됐는지 둘 다 아직 브라우저로 확인 안 됨.
  - `.entry-carousel-track`은 `align-items: flex-start`인 flex row에 4페이지가 동시에 존재하는 구조라, auto height가 "가장 높은 페이지"에 맞춰진다는 구조적 특성은 이번에 안 건드렸다(칩 제거로 페이지 간 높이 격차만 줄임) — 다른 페이지(③④)가 짧아 카드 밑에 빈 공간이 남는 정도의 잔여 이슈는 남아있을 수 있음.

- **판정**: ✅통과 (박스② 칩 숨김용 `.chip-row` 래퍼 훅 추가 확인 / `.duo-photo-scrim` 불투명도 상향으로 Footer·에필로그 텍스트 대비 개선 확인 / tsc·build 0건 통과)

---

## 2026-08-25 (59) | [Sonnet] `00-29` §12 조치 A·B 구현 — 루트 폰트 미디어쿼리 + 인라인 97곳 상향

- **근거 스펙**: `docs/00_핵심플랫폼/00-29_모바일_대응_전략_검토서.md` §12 (+ `00-09` §2.3 rem 기준선 규칙). walkthrough (58)이 다음 에이전트 할 일로 지정한 조치 A·B.
- **건드린 파일**:
  - `eobom/frontend/src/index.css` — `.container` 480px 미디어쿼리 뒤에 `@media (max-width: 768px) { html { font-size: var(--base-font-size); } }` 신설(조치 A). 전역이 아닌 768px 이하로만 감쌌다.
  - `eobom/frontend/src/**/*.tsx` 22개 파일 — 인라인 `fontSize: '0.7rem'`(4)·`'0.75rem'`(20)·`'0.78rem'`(17)·`'0.8rem'`(56) 총 87곳을 `'0.85rem'`으로 일괄 치환(조치 B). `sed -E` 스크립트로 값 4종만 정확히 매칭해 다른 rem 값·다른 CSS 속성은 손대지 않음.
  - `docs/작업일지_및_기록/에이전트_기록/walkthrough.md` — 이 항목.
- **결과**: `npx tsc --noEmit -p .`(frontend) 통과. `npm run build`(frontend) 통과(`vite build` 6.43s, 에러 없음). `grep -rn "fontSize: '0\.\(7\|75\|78\|8\)rem'" src/` 결과 **`AdminPage.tsx` 10곳 외 0건** — 스펙이 요구한 "AdminPage 제외, 나머지 전부 상향" 정확히 일치. `git diff --stat`으로 22개 파일 87 insertions/87 deletions(순수 문자열 치환, 다른 라인 변화 없음) 확인. 375px 브라우저 실측(15px 미만 카운트 재측정)은 이번 사이클에서 안 함 — 로컬 변경분이라 배포 전엔 (58)이 쓴 계측 방법을 그대로 적용할 대상(배포 URL)이 없음.
- **편차**:
  - **AdminPage.tsx 10곳(`0.7`(0)·`0.75`(1)·`0.78`(0)·`0.8`(9))을 스펙 지시대로 완전히 건드리지 않았다.** 근거는 `00-09` §2.5(운영자 화면은 밀도 우선 — 정보 밀도가 가독성보다 우선순위 높은 관리자 전용 화면)이며, 스펙(§12 조치 B 예외 조항)에 이미 명시된 제외 대상이라 이번 구현이 정본과 어긋나지 않는다.
  - **97곳(스펙 표기 총량) 중 실제 치환은 87곳이다.** 스펙의 "97곳"은 프로젝트 전체(AdminPage 포함) 인라인 발생 총량을 가리키는 숫자였고, 그중 AdminPage 소속 10곳을 빼면 실제로 값이 바뀌는 곳은 87곳이다 — grep으로 4개 값 합(4+20+17+56=97)과 AdminPage 내 동일 패턴 개수(10)를 각각 확인해 이 해석이 맞는지 교차검증했다.
- **다음 에이전트가 알아야 할 것**:
  - **375px 배포본 재계측이 아직 안 됐다.** (58)이 쓴 방법(배포 URL에 `getBoundingClientRect`/`getComputedStyle`로 15px 미만 텍스트 노드 카운트)을 이번 변경 배포 후 그대로 다시 돌려서 `/facility` 160/227 등 기존 수치가 개선됐는지 확인해야 §14의 "조치 A·B 배포 후 반나절 작업으로 PWA 권고 조건부 전환" 여부를 판단할 수 있다.
  - 이번 사이클은 코드 변경만 하고 배포는 하지 않았다 — git commit/push는 사용자 지시 대기.

- **판정**: ✅통과 (00-29 §12 조치 A 모바일 768px 루트 폰트 기준선 활성화 및 조치 B 인라인 폰트 87곳 0.85rem 상향 정상 반영 확인 / AdminPage 10곳 의도된 밀도 예외 보존 확인 / build 및 tsc 0건 통과 / ⚠️ 배포 후 375px 실계측 검증 필요)

---

## 2026-08-25 (62) | [Opus] 모바일 풀페이지 스냅 폐지 결정 등재 — `00-23` §5.4-1 신설

- **근거 스펙**: 개발자 판단 2026-08-25 — *"모바일에서는 풀페이지 스크롤을 포기하고 자연스러운 네이티브 일반 스크롤로 구현. 원인: 섹션2→3 이동 시 지속적인 바운스백, 4번의 수정에도 미해결. 억지로 구현하기보다 안전한 방식을 완전하게 구현하는 것이 낫다"* + 후속 지시 *"mandatory 관련 없애고(정리하고) 진행."*
- **건드린 파일**(문서만 — 코드 변경 0):
  - `docs/00_핵심플랫폼/00-23_메인화면_진입구조_개편_검토서.md` — **§5.4-1 신설**(원인 분석 / 폭별 확정 / 철거 목록 5건 / 유지 2건 / 검증 2건 / 주의점 2건).
  - `docs/00_핵심플랫폼/00-29_모바일_대응_전략_검토서.md` — §14(PWA)에 **주소창 회수분이 PWA 없이 먼저 들어온다**는 갱신 블록 추가.
  - `.harness/memory/context.md` — ⓪-8 추가.
- **결과** (코드 실측):
  - **원인 규명**: `HomePage.tsx:267` 컨테이너가 `scrollSnapType: 'y mandatory'`인데, 모바일에서는 `index.css`의 `.fullpage-section--fluid`·에필로그/푸터 분리 규칙이 섹션 높이를 `height:auto + min-height`로 풀어 놨다. **스냅점 간격이 뷰포트보다 길어질 수 있는 상태**(실측 주석: 569px 폭에서 Footer만 ~700px)에서 `mandatory`는 사용자가 놓은 위치를 가장 가까운 스냅점으로 되돌린다 — **이것이 바운스백이고, `scroll-snap-align` 조정으로는 원리상 닫히지 않는다.** 4차 수정 실패가 개별 버그가 아니었던 이유.
  - **확정**: ≥641px 현행 유지 / ≤640px 네이티브 `body` 스크롤. 브레이크포인트는 640 유지(`00-29` §6.1 새 값 금지), **휠 핸들러 등록만 `matchMedia('(pointer: coarse)')` 기준 권고**(768px 태블릿 세로가 폭 기준으로는 데스크톱 취급을 받는 문제).
  - **철거 목록 5건 확정** — 컨테이너 `scrollSnapType` / 섹션 인라인 `scrollSnapAlign` 3곳(`:285`·`:392`·`:427`) / `.fullpage-section--fluid` ≤640 블록 / `.epilogue-footer-wrapper` ≤640 블록 / `mandatory→proximity` 시도 이력 주석 2곳.
  - 🔴 **유지 대상 2건을 명시** — `.home-section-dots` ≤640 숨김, **`EntryBoxes.tsx:525`의 터치 축 판정**(`Math.abs(deltaX) <= Math.abs(deltaY)` 시 무시). 후자는 **스냅과 무관한 캐러셀 자체의 정상 로직**이다.
  - **부수 이득 확인**: 현행은 `overflow:hidden` 뷰포트 안의 컨테이너 스크롤이라 **모바일 주소창 자동 숨김이 동작하지 않는다.** `body` 스크롤 전환으로 60~120px이 회수되며, `00-29` §14 PWA 권고 근거의 일부가 먼저 해소된다.
  - **빌드/테스트**: 해당 없음 — **코드 변경 0건**.
- **편차**:
  - 🔴 **직전 턴 답변에서 "예외 5곳"에 `EntryBoxes` 캐러셀 터치 예외를 포함시켰는데, 코드 확인 결과 철거 대상이 아니었다.** 축 비교로 수직 제스처를 무시하는 정상 로직이며 스냅을 꺼도 필요하다. **§5.4-1 "철거하지 않는 것"에 명시해 지시서에 잘못 실리지 않게 했다.**
  - **`00-23`은 원래 "메인 진입 4박스 개편 검토서"인데 스크롤 방식 결정을 여기 실었다.** `00-09` §3.1도 후보였으나, 풀페이지 3섹션 구조를 다루는 절(§5.4)이 여기 있어 같은 자리에 붙였다. **`00-09`에는 옮겨 적지 않는다**(중복 금지).
- **다음 에이전트가 알아야 할 것**:
  - 🔴 **`mandatory`만 끄고 끝내면 안 된다.** 모바일 예외 CSS는 전부 *"모바일에서도 스냅을 살리려고"* 만든 것이라, 스냅을 끄면 존재 이유가 사라진다 — 남겨두면 동작만 바뀌고 복잡도는 그대로다.
  - **`WebkitOverflowScrolling: 'touch'`와 컨테이너 `height:100%`·`overflow:hidden` 뷰포트도 함께 검토 대상**이다. `body` 스크롤로 가려면 `.fullpage-viewport`의 `overflow:hidden`이 모바일에서 풀려야 한다.
  - **`scrollToSection`·`activeSection`·세션 스크롤 복원 로직은 데스크톱에서 계속 쓰인다** — 모바일에서만 비활성화하고 **지우지 말 것**.
  - 검증은 **375px에서 섹션2→3 되돌아가지 않음 + 주소창 접힘** 2개면 충분하다.

- **판정**: ✅통과 (모바일 풀페이지 스냅 바운스백의 물리적 원인 규명 및 `00-23` §5.4-1 모바일 네이티브 스크롤 전환 결정 정본화 완료 / 철거 대상 5건 및 유지 대상 2건 명확히 분리 / `00-29` §14 PWA 권고 갱신 반영 확인 / 코드 변경 없음)

---

## 2026-08-25 (61) | [Opus] 🔴 범위 오류 정정 — 사장님 생애주기 모델을 `06-04`에서 `00-30`으로 분리

- **근거 스펙**: 개발자 지적 2026-08-25 — *"`06-04`와 사장님 지시사항이 겹쳐 문제가 생긴듯. 한 프롬프트에 각각을 지시했지만, `06-04`의 조사, 기획과 사장님 지시사항은 별개의 내용이었음."*
- **무엇이 잘못됐나**: 한 프롬프트에 ①엔딩노트 실구현 기획 요청과 ②사장님 제공 자료(*"전체적인 흐름에 대한 정보인 거 같아"*)가 **함께 담겨 있었는데, 둘을 하나의 과제로 읽고 `06-04` 안에서 접합했다.** 그 결과 06 도메인 구현 스펙(모델·수집항목·API)과 플랫폼 전체 연결 구조(3단계·통지수단·도메인 횡단 흐름)가 한 문서에 섞였다. **06을 구현하는 사람이 알 필요 없는 내용이 스펙 문서에 들어갔고, 반대로 연결 구조는 06 문서 안에 갇혀 04·07·00-12에서 찾을 수 없게 됐다.**
- **건드린 파일**(문서만 — 코드 변경 0):
  - `docs/00_핵심플랫폼/00-30_생애주기_연결모델_검토서.md` — **신규**(11개 절). 사장님 자료 **원문 보존**(§2) + 단계별 대조(§3) + 연결 구조(§4) + 충돌 3건(§5) + UX 검토(§6) + 운영정책 2건(§7) + 도메인별 영향(§8) + **선행조건 5칸**(§9).
  - `docs/06_엔딩노트_유언/06-04_엔딩노트_보관함_실구현_기획서.md` — **전면 재작성.** 사장님 자료 의존 제거: 구 §3(3단계 대조)·구 §4(충돌 3건)·구 §9(다중 유족)를 `00-30`으로 이관, 구 §11.2 외부확인 6건 중 **06에 직접 걸리는 4건만** 남김. 신설 §3(새로 생기는 기능 4개). 🔴 **구 §5·§9 번호는 비워 두고 재사용하지 않음**(`AGENTS.md` §9 — 외부 참조 보호).
  - `docs/00_핵심플랫폼/00-14_사장님_논의_안건_정리.md` — §11 머리말의 *"접합 스펙은 `06-04`"* → **`00-30`이 검토 정본**으로 정정 + §11.1 표에 전체 대조표 행 추가.
  - `docs/00_DOCS_INDEX.md` — `00-30` 행 신설 · `06-04` 행에서 사장님 모델 서술 제거 및 범위 정정 표기 · `00-14` 행 유지.
  - `.harness/memory/context.md` — ⑨를 ⑨(06 구현)/⑨-0(생애주기 모델)로 분리.
- **결과**:
  - **문서 경계가 다시 1:1이 됐다** — `06-04`는 *"엔딩노트를 어떻게 만들 것인가"*, `00-30`은 *"단계가 어떻게 이어지는가"*, `00-14` §11은 *"사람이 무엇을 정해야 하는가"*.
  - **분리하면서 `00-30`에서 새로 나온 것 3가지**(초판에 없던 내용): ① **§4.2 "유족 계정이 두 종류"** — 1→2단계(L3~L4)와 3단계 긴급 온보딩(L1)이 같은 *"유족 계정"* 이라는 말을 쓰지만 권한이 다르고, 화면에서 미리 말하지 않으면 *"가입했는데 왜 안 열리냐"* 가 그대로 CS가 된다 ② **§6.1 "보호 중" 배너의 진짜 용도** — 수락한 유족은 수십 년간 이어봄에 올 이유가 없으므로, 배너가 `lastConfirmedAt` 재확인의 자연스러운 자리가 된다 ③ **§9 선행조건 5칸** — `DeathVerification`/확인 인력·SLA/06 백엔드/발송 수단/04 사후 이관 중 **서 있는 것이 하나도 없고**, 그중 ②는 사람 문제라 개발로 메울 수 없다.
  - **`00-30` §8에서 04의 구멍을 찾았다** — 사장님 2단계가 *"디지털 유품 리스트"* 를 명시했는데 `04-01`은 **본인이 생전에 정리하는 것까지만** 설계돼 있고 **사후 유족 이관 경로가 없다.** `00-12` §7.2가 *"통로는 06 하나"* 로 정한 뒤 04 쪽 후속 설계가 비어 있었다.
  - **빌드/테스트**: 해당 없음 — **코드 변경 0건**.
- **편차**:
  - **`06-04`를 부분 수정이 아니라 전면 재작성했다.** 절 번호가 §3 이후 전부 밀리는 구조 변경이라 부분 편집이 더 위험했다. 대신 **구 §5·§9 자리에 "자리 비움" 표기를 남겨** 외부 문서가 그 번호로 참조하고 있었을 경우를 대비했다.
  - **`00-30`에 사장님 자료 원문을 표로 옮겨 적었다**(§2). 요약만 남기면 이후 판단의 근거를 확인할 수 없다고 봤는데, **원문 보존은 이 프로젝트 문서에서 흔한 형식이 아니다**(대부분 요약 후 인용). 사장님 제공 자료가 walkthrough·일지 외에 저장된 곳이 없어 선택했다.
  - **초판(59)의 walkthrough 항목은 수정하지 않았다.** 기록은 그 시점의 사실이므로 덮어쓰지 않고, 이 항목(61)이 정정 이력을 남긴다.
- **다음 에이전트가 알아야 할 것**:
  - 🔴 **`06-04`를 참조하던 곳이 있으면 절 번호를 다시 확인할 것.** 구 §3(3단계 대조)·구 §4(충돌)·구 §9(다중 유족)는 이제 `00-30` §3·§5·§7.2다.
  - **`00-14` §11의 판단 12건은 그대로 유효하다** — 문서 위치만 바뀌었고 항목·권고·결정 주체는 변경 없음.
  - 🔴 **04 사후 이관 경로 미설계**(`00-30` §8)는 **이번에 발견됐지만 아직 어느 문서에도 등재되지 않은 항목**이다. `04-01` 개정 또는 신규 문서가 필요하고, 그건 Opus 다음 사이클 몫이다.
  - **`00-30`은 검토서이지 스펙이 아니다.** 구현은 각 단계의 정본(`00-27`·`00-12`·`07-03`·`06-04`)을 본다.

- **판정**: ✅통과 (사장님 3단계 생애주기 모델을 `06-04`에서 분리하여 전 도메인 연결 검토서 `00-30` 신설 및 `06-04` 06 도메인 실구현 스펙 1:1 재정합 완료 / `00-14` §11 및 `00_DOCS_INDEX` 동기화 확인 / 코드 변경 없음)

---

## 2026-08-25 (60) | [Opus] 사장님 제공안에서 파생된 판단 12건 정리 — `00-14` §11 신설

- **근거 스펙**: 개발자 지시 2026-08-25 — *"사장님 의견 관련하여, 판단해야 할 것들 정리해줘.(엔딩노트에 국한하지 않은 내용이긴 해)"*. 대상 자료는 (59)와 같은 사장님 제공 3종. 수용 문서 `docs/00_핵심플랫폼/00-14_사장님_논의_안건_정리.md`(결정 대기 항목의 정본 수집처).
- **건드린 파일**(문서만 — 코드 변경 0):
  - `docs/00_핵심플랫폼/00-14_사장님_논의_안건_정리.md` — **§11 신설**(§11.1 이미 정해진 것 6건 / §11.2 판단 12건 표 / §11.3 먼저 정할 3건 / §11.4 확인만 하면 되는 것 4건 / §11.5 뒤집히는 확정 1건). 🔴 **§10(관련 문서)이 이미 있어 번호를 재사용하지 않고 §11로 신설**(`AGENTS.md` §9 — 지운 번호·쓰인 번호는 비워 두거나 다음 번호로).
  - `docs/00_DOCS_INDEX.md` — `00-14` 행에 §11 요약 추가.
  - `.harness/memory/context.md` — ⑨-1 추가.
- **결과**:
  - **판단 항목 12건을 성격별로 분류**: 💰경영 5(11-1 발송 주체 / 11-2 발신번호 / 11-8 보유기간 / 11-10 국내 리전 / 11-11 수익 지점) · 🏢운영 2(11-3 사망확인 SLA / 11-4 2인 승인 실재) · 🔧기술 3(11-5 유족 1명일 때 L4 / 11-6 `PRIMARY` 복수 / 11-9 06 전용 키) · ⚖️법·문구 2(11-7 형제 이견 시 위치 / 11-12 *"Zero-Knowledge"* 표기).
  - **§11.1로 6건을 회의 안건에서 제외**: 사장님 안 중 1단계 초대·3단계 긴급 온보딩·1:N 매핑·생전 잠금·L3/L4·열람범위 설정은 **이미 구현됐거나 설계 확정**이라 *"정하실 것"* 이 아니라 *"보고드릴 것"* 으로 갈랐다.
  - **먼저 정할 3건 선정**: **11-2**(11-1이 종속 + `1588-0000`이 아직 가짜라 §2.6과 한 뿌리) · **11-3**(3단계 모델 전체가 *"확인 후 활성화"* 에 걸려 있는데 확인할 사람·시간이 미정) · **11-11**(06은 비용만 나고 매출이 없는 유일한 도메인이며 §3-4 수수료 기준과 함께 봐야 함).
  - **§11.4에 비용 0의 사실 확인 4건**을 판단 항목과 분리(정부24 민간 가능 여부 / 알림톡 요건 / 안심상속 원스톱 범위 / 등록기관·상담창구 번호) — **회의 안건이 아니라 담당자 배정 문제**로 성격을 명시.
  - **§11.5에 충돌 1건 명시**: *"이어봄은 발송 주체가 되지 않는다"*(`00-27` §9.1, 08-21 개발자 확정) ↔ 사장님의 알림톡 발송 → 트리거를 ⓐ생전/ⓑ사망으로 갈라 양립시키는 안.
  - **빌드/테스트**: 해당 없음 — **코드 변경 0건**.
- **편차**:
  - 🔴 **`00-14` §1의 원칙(*"새 판단을 담지 않습니다 — 목차 + 우선순위"*)을 일부 넘어섰다.** 11-7(형제 이견 시 이어봄의 위치)과 11-11(06 수익 지점)은 **정본 문서가 아예 없어** 가리킬 곳이 없었다. 두 항목에는 **"정본 없음(신설 필요)"** 을 명시해 이 절이 정본이 아님을 표시했지만, **항목 자체는 여기서 처음 제기된 것**이다.
  - **`pending-approvals.md`에 새 항목을 등록하지 않았다.** 11-8·11-10은 이미 등재돼 있고 나머지는 Phase 0~1 착수를 막지 않는다 — 착수 금지 목록을 부풀리면 그 파일이 무뎌진다는 판단. **11-1·11-2가 Phase 3 착수를 막게 되면 그때 등록해야 한다.**
  - **11-6(`PRIMARY` 복수 허용)은 `00-27` §11 #3에 이미 있는 항목을 다시 올린 것**이다. 중복이지만, 사장님이 *"대표 상주 1인 지정 옵션"* 을 직접 언급해 **결정 주체가 개발자에서 사장님으로 옮겨갈 수 있는 항목**이라 남겨 뒀다.
- **다음 에이전트가 알아야 할 것**:
  - **`00-14` §11은 회의 자료이지 스펙이 아니다.** 결정이 나오면 **원 문서(`00-27`·`06-04`·`00-20`·`00-21`)를 고치고**, 여기에는 결정 내용과 날짜만 적는다(§10 아래 원칙).
  - 🔴 **11-2(발신번호)는 판단이 아니라 이미 낸 약속을 되돌리는 건이다** — §2.6의 `1588-0000`이 화면에 그대로 있다. 회의를 기다리지 않고 처리할 수 있는지 확인할 것.
  - **11-1이 정해지기 전에 알림톡 관련 코드를 넣지 않는다.** 08-21 확정(`00-27` §9.1)이 아직 유효하고, 조용히 한쪽으로 구현하면 **어느 쪽이 확정인지 모르는 상태**가 된다(§11.5).
  - 섹션 번호: `00-14`는 이제 **§11까지** 쓴다. 다음 신설은 §12.

- **판정**: ✅통과 (사장님 제공안 3종 파생 판단 12건 경영·운영·기술·법률 4대 영역 분류 및 정본 `00-14` §11 신설 완료 / 이미 정해진 것 6건 제외 및 선결 과제 3건 명확화 확인 / 코드 변경 없음)

---

## 2026-08-25 (59) | [Opus] `06-04` 엔딩노트·유족 메시지 보관함 실구현 기획서 신규 작성

- **근거 스펙**: 개발자 지시 2026-08-25 — *"디지털 엔딩노트 및 유족 메시지 보관함 실구현을 위한 자료 수집 및 전략 필요함. 현재의 기능 외에 어떠한 기능? 정보 수집? 들이 필요할 지 정리하고, 기획."* + **사장님 제공 자료 3종**(3단계 생애주기별 연결 모델 / 사용자 여정·화면 흐름 / 운영 정책 2건 — Zero-Knowledge 보안 분리·다중 유족 지정). 기존 정본 `06-01`·`06-02`·`06-03`·`00-12` §4·`00-16`·`00-27`.
- **건드린 파일**(문서만 — 코드 변경 0):
  - `docs/06_엔딩노트_유언/06-04_엔딩노트_보관함_실구현_기획서.md` — **신규**(14개 절).
  - `docs/00_DOCS_INDEX.md` — 06 도메인 표에 `06-04` 행 추가 + 도메인 머리말 *"(현재 전 기능 목업 — 정식 명세서 미작성)"* → *"백엔드 0건. 실구현 스펙은 2026-08-25 `06-04`"*.
  - `.harness/memory/context.md` — 다음 할 일에 ⑨ 신설, "마지막" 줄 갱신.
- **결과** (코드 실측 2026-08-25 기준):
  - **착수 지점 실측**: `EndingNotePage.tsx` **219줄 전부 `useState` 로컬 목업**(저장이 `alert()`/토스트만), 백엔드 모델 **0건**(`schema.prisma` 20개 모델에 엔딩노트 없음), 컨트롤러·라우트 **0건**(`controllers/` 18개·`routes/` 12개에 없음). 반면 암호화 도구는 **이미 있음** — `utils/crypto.ts`의 `encryptField`/`decryptField`(AES-256-GCM)·`hashField`(HMAC)가 `FamilyDesignation.phoneEnc`에서 가동 중.
  - **사장님 3단계 모델 대조 결과**: **1단계(생전 초대)는 90% 이미 구현돼 있음** — `FamilyDesignation` + `/invite/:token` + `acceptedUserId` 연결이 `00-27` Phase 1·2로 완료(`fa865a4`, walkthrough 55·56). 새로 필요한 것은 **엔딩노트 화면의 가족지정 진입점**과 **잠글 데이터 본체** 2개. **3단계(긴급 온보딩)도 부고장 개설 흐름으로 이미 동작 중**(`Deceased.userId = null` 비회원 고인). **2단계(사후 승계)만 실체가 없음.**
  - **화면이 약속한 5건 전수**(전부 뒷받침 없음): `:148` *"의향서 암호화 저장"* / `:133` *"보호자의 휴대전화 SMS 인증 후 연명의료 의향 메모가 1회 열람"* / `:212` *"알림톡으로 엔딩노트 열람 키가 자동 발송"* / `:163` *"국립연명의료관리기관 DB 호환 모바일 QR카드"* / `:156` *"응급실 전용 QR 카드 (개발중)"*. 앞의 4건은 `00-14` §2 패턴(뒷받침 없는 약속)이고, 특히 `:163`은 `00-18` §2가 `Footer.tsx`의 *"KISA 기준 최고 등급 보안"* 을 인증 사칭으로 판정한 것과 같은 종류.
  - 🔴 **최우선 발견 — `EndingNotePage.tsx:185` placeholder가 비밀번호 원문 입력을 유도 중**: *"예: 사랑하는 자녀들아 … OO은행 비상 예금 계좌 및 **유품 정리 마스터 암호**는…"*. 타사 약관의 계정 공유 금지 위반을 설계로 권하는 모양이 되고 `04-02`(대리하지 않는다)와 충돌하며 유출 피해가 이어봄 데이터 밖으로 번짐 → **소재 안내형 문구로 교체** 권고를 §6.3에 명시.
  - `:130` 대리인 입력창에 `defaultValue="홍자녀 (010-1234-5678)"` **하드코딩** 확인 — 모든 로그인 사용자에게 남의 이름처럼 보이는 기본값.
  - **사장님 안과의 충돌 3건 정정안 제시**: ①알림톡 발송 ↔ `00-27` §9.1(이어봄은 발송 주체가 되지 않음, 08-21 개발자 확정) — 트리거를 ⓐ생전/ⓑ사망으로 갈라 **ⓑ에만 적용** 권고 ②정부24 연계 — 민간 개방 여부 **확인 전 단정 금지**(AGENTS §6), L3(서류)가 정본이고 연계는 나중에 L3를 자동화하는 형태 ③Zero-Knowledge — 암호학적 ZK는 `06-03` §1.1이 이미 기각(사후 개봉 불가), 사장님 의도인 **권한 격리는 채택**하되 대외 용어는 **「생전 봉인(Sealed)」** 으로 통일.
  - **신설 설계**: 모델 4개(`EndingNote`/`EndingNoteEntry`/`EndingNoteGrant`/`EndingNoteLog` — 본문 분리·`FamilyDesignation` 재사용) · **수집 항목 2 → 8개 섹션** · **열람 시점 3단 매트릭스**(즉시/응급/사후) · **개봉 상태 기계**(SEALED→요청→L3→L4→RELEASED) · Phase 0~3 구현 단계.
  - **빌드/테스트**: 해당 없음 — **코드 변경 0건**. 기획 문서만 작성.
- **편차**:
  - **`06-01`~`06-03`의 결론을 하나도 다시 설계하지 않았다**는 것이 이 문서의 전제인데, **`06-03` §5의 동의 문구에는 손을 대지 않았지만 §4.3에서 대외 용어를 「생전 봉인」으로 통일하자고 새로 제안**했다. 기존 문서의 결론을 뒤집는 것은 아니고 표현 규칙을 추가한 것이다.
  - **`00-27` §11 #3(`PRIMARY` 복수 허용)을 이 문서에서 "권고 확정안"으로 정리했다**(§9). 사장님이 *"대표 상주 1인 지정 옵션"* 을 직접 언급했기 때문인데, **`00-27` 본문은 고치지 않았다** — 확정은 사람 몫이고, 확정되면 `00-27` §6과 이 문서 §9를 함께 고쳐야 한다.
  - **§7.2에서 응급 열람을 Phase 3으로 미루자고 권고하면서, 그 근거로 `00-28` Phase 3(`User.phoneVerifiedAt`)을 끌어왔다** — 06 문서가 00-28의 진행 상태에 의존하게 됐다. 00-28이 앞당겨지면 이 권고도 바뀐다.
  - **화면 ID 신설 여부를 판단하지 않았다**(§12) — 8개 섹션 + 열람범위 설정 + 개봉 요청이 `SCR-002` 한 화면 확장인지 새 ID인지는 구현 시 판단으로 남겼다. `00-26` §7.1 위반 선례(`SCR-013`~`015`)가 있으므로 **Sonnet이 화면을 쪼개게 되면 반드시 Opus에 올릴 것.**
- **다음 에이전트가 알아야 할 것**:
  - 🔴 **`[Sonnet]` 착수 순서는 Phase 0(문구 정리)이 먼저다.** 모델부터 만들면 §2.2의 약속 5건이 그대로 남은 채 기능만 늘어난다. 특히 *"국립연명의료관리기관 DB 호환"* 은 **연동 계획조차 없는 상태에서 공공기관 DB 호환을 주장**하는 문구다.
  - **문구 교체는 어휘 단위 전역 검색으로 한다**(`06-02` §6.1 원칙). 줄 단위로 고치면 한 화면에 신·구 표현이 공존하는 상태가 된다 — walkthrough (19)에서 실제로 났던 문제.
  - **Phase 1에서 운영자 화면을 건드릴 때 `include` 통짜 조인 금지**(`06-03` §7). `EndingNoteEntry`는 별도 모델로 뺐지만, `EndingNote`를 `include`하면서 관계를 함께 끌어오면 같은 사고가 난다. **`select` 명시.**
  - **Phase 3은 `00-12` 사망 확인 사다리 확정 대기다.** `DeathVerification`은 `00-27` Phase 3과 **공용 모델**이므로 06이 따로 만들면 안 된다.
  - **§13 #2(지정 유족 1명일 때 L4 대체)와 #6(2인 승인의 "2인"이 실재하는가)이 확정되지 않으면 개봉 API를 짤 수 없다.** 둘 다 *"사람이 2명 있어야 성립하는 규칙"* 이고, 지금 이어봄에는 지정 유족도 운영 인력도 1명일 수 있다.
  - **§11.2의 외부 확인 6건은 확인 전에 화면 문구로 내보내지 않는다** — 그 규칙을 어겨서 생긴 것이 §2.2 ④다.

- **판정**: ✅통과 (`EndingNotePage.tsx` 목업 상태 실측 기반 `06-04` 실구현 기획서 신규 작성 완료 / 모델 4개 및 수집 8개 섹션, 3단 열람 매트릭스, 개봉 상태기계 설계 수립 / 뒷받침 없는 약속 5건 및 비밀번호 유도 플레이스홀더 교체 권고 식별 확인 / 코드 변경 없음)

---

## 2026-08-25 (58) | [Opus] 모바일 재지적 — 배포본 375px 실계측 + `00-29` 2차 갱신(§10~§15)

- **근거 스펙**: 개발자 지적 2026-08-25 — *"모바일 환경에서 편의성 가독성 너무 떨어짐. 모바일 환경에서 잘 볼 수 있도록(웹앱 등) 기획부터 실천해야함"* (**08-21과 동일 문장의 반복 지적**). 기존 정본 `docs/00_핵심플랫폼/00-29_모바일_대응_전략_검토서.md` · `00-09` §2.3.
- **건드린 파일**(문서만 — 코드 변경 0):
  - `docs/00_핵심플랫폼/00-29_모바일_대응_전략_검토서.md` — 헤더에 2차 갱신 안내 블록, §6.1에 `.stat-row` 360px 모순 해소 블록, §8 확정표에 #5·#6·#7 추가, **§10~§15 신설**(실측/2차 원인/조치/편의성/PWA 재답변/미검증).
  - `docs/00_핵심플랫폼/00-09_디자인_시스템_및_스타일_가이드.md` — §2.3에 **🔴 rem 기준선 규칙** 신설(3개 규칙), **§3.2 반응형 프리미티브 4종 등재**(walkthrough (55) 편차 [4] 해소), §3.1 *"하단 탭바"* 삭제·375px 헤더 문구 실측 반영.
  - `docs/00_DOCS_INDEX.md` — `00-09`·`00-29` 행 갱신.
  - `.harness/memory/context.md` — ⓪-5·① 갱신, "마지막" 줄 갱신.
- **결과** (배포본 `https://eobom.vercel.app`을 폭 375px 프레임에 띄우고 `getBoundingClientRect`·`getComputedStyle`로 DOM 계측. 08-21 1차는 소스 grep만 했고 브라우저 실기동은 아무도 한 적이 없다):
  - **①가로 스크롤 기준 = 통과.** `/`·`/care-guide`·`/facility`·`/counseling`·`/memorial`·`/obituary`·`/ending-note`·`/mypage` 8개 경로 전부 `document.documentElement.scrollWidth` **364**(뷰포트 379). 요소 단위 오버플로는 `.mobile-drawer-panel`(`left:-296px`, 의도된 대기 위치) 1건뿐.
  - **②본문 15px 기준 = 전면 미달.** `/facility` 텍스트 노드 **227개 중 160개(70%)** 가 15px 미만, `/care-guide` **26/54**, `/memorial` 37곳, `/counseling` 9곳.
  - **원인 확정**: `index.css`가 `body { font-size: var(--base-font-size) }`(18px)만 걸고 `html`은 브라우저 기본 16px → **`rem`이 16px 기준으로 계산됨**. 인라인 `0.85rem`이 의도한 15.3px가 아니라 **13.6px**로 렌더. `00-09` §2.3이 *"협상 대상이 아님"* 으로 못박은 시니어 18px 기준선이 **화면에서 한 번도 적용된 적이 없다.**
  - **전수 계측**(`eobom/frontend/src/**/*.tsx`): `fontSize` 인라인 **377곳 전부 `rem`, px 0곳** (`0.85rem` 102 / `0.8rem` 56 / `0.75rem` 20 / `0.78rem` 17 / `0.7rem` 4 …). `padding`/`margin`/`gap` **869곳 전부 rem**, `width`/`height` **130곳 전부 px**.
  - **안전성 실측**: 375px 고정에서 루트 폰트만 ×1.0 / ×1.1 / ×1.15 / ×1.2로 바꿔 재계측 → **가로 오버플로 0, 텍스트 잘림(`scrollWidth > clientWidth`) 0** 전 구간. 문서 높이만 19,698 → 21,165 → 21,900 → 23,899px. ×1.15에서도 15px 미만이 97곳 남아 **조치 B(97곳 티어 상향)가 필요하다는 근거**가 됨.
  - **편의성 실측**: `/facility` 1페이지가 375px에서 **19,698px**(뷰포트 844px 기준 약 23화면), 카드 30개 → 카드 1개당 약 640px, 한 화면에 1.3개.
  - **부수 확인**: `grep -ril "bottom-tab\|BottomNav"` **0건** → `00-09` §3.1의 *"하단 탭바"* 는 구현체 없는 문서상 항목이었음. 비로그인 헤더는 높이 85px·오버플로 0.
  - **빌드/테스트**: 해당 없음 — **코드 변경 0건**(`eobom/` 무수정). 기획 문서만 갱신.
- **편차**:
  - **§2.1의 원인 진단을 정정했다.** 08-21은 *"인라인 982곳이라 미디어쿼리가 구조적으로 불가능"* 이라 썼는데, 폰트에 한해서는 **전부 `rem`이라 루트 한 줄로 377곳이 동시에 움직인다.** 원문을 지우지 않고 §11.2에 정정 블록으로 덧붙였다(§1~§9는 08-21 원문 보존).
  - **§8 확정 필요가 4건 → 7건으로 늘었다.** 줄이지 못하고 늘린 이유는 §12·§13이 새 선택지를 만들었기 때문이다(루트 정렬 범위 / 97곳 상향 / 모바일 페이지당 건수).
  - **§4의 PWA 기각을 완전히 유지하지 않았다.** 기각 근거(가독성 무관)는 실측으로 확증됐으나, §13(23화면 스크롤)이라는 **다른 근거**가 새로 생겨 §14에서 *"조치 A·B 배포 후 반나절 작업으로 권고"* 로 조건부 전환했다. 서비스워커 캐시 미도입은 그대로.
  - **`00-09` §3.1의 *"하단 탭바"* 를 문서에서 삭제했다** — 구현 계획이 아니라 사실과 다른 서술이었기 때문. 도입 여부 자체는 `00-26`·`00-24` §3.2에 남아 있다.
- **다음 에이전트가 알아야 할 것**:
  - **`[Sonnet]` 다음 작업은 조치 A + B 두 개다.** A = `index.css`에 `@media (max-width:768px){ html { font-size: var(--base-font-size); } }` **1줄**. B = 인라인 `0.7`/`0.75`/`0.78`/`0.8rem` **97곳**을 `0.85rem`로 상향. **A만 하고 끝내면 안 된다** — ×1.15 실측에서 97곳이 그대로 남았다.
  - **조치 A는 반드시 `max-width:768px`로 감싼다.** 전역으로 걸면 여백 869곳이 데스크톱에서도 +12.5% 늘어 2026-08-11 밀도 조정(`00-09` §2.4)을 되엶.
  - **`MyPage`·`ObituaryPage`(관리)·`EndingNotePage`·로그인 상태 헤더는 이번에도 못 봤다.** 비로그인이면 안내 화면만 렌더되고 실 OAuth라 자동 로그인이 불가능하다 — **`00-29` §5의 1·3순위가 전부 여기 있다.** 개발자가 폰으로 로그인해 보는 것 외에 방법이 없고, `00-26` §6 #9(375px 헤더)도 그때 함께 닫힌다.
  - 계측은 배포본(`eobom.vercel.app`) 기준이라 **미배포 로컬 변경분은 반영돼 있지 않다.** 조치 A·B 배포 후 같은 방법으로 재계측하면 15px 미만 카운트가 그대로 검증 지표가 된다.

- **판정**: ✅통과 (배포본 375px DOM 실측 기반 15px 미달 원인 규명 및 00-29 §10~§15 개정 완료 / 00-09 rem 기준선 규칙 신설 및 반응형 프리미티브 4종 등재 확인 / 문서 정합성 완비)

---

## 2026-08-24 (57) | [Sonnet] 미기록 변경 2건 소급 기록 — 헤더 여백(clamp) + CareGuidePage 접기 반전

- **근거 스펙**: `context.md` ⓪-4(체크리스트 접기 — `CareGuidePage.tsx` "제목+체크만, 상세는 펼침", `07-02`§3 표시원칙 유지) · 사용자 직접 피드백(2026-08-24, 헤더 로고·로그인 버튼이 화면 가장자리에 붙어 보임). 두 변경 다 이전 턴에서 이미 작업 트리에 반영됐는데 (55)·(56) 어느 walkthrough 기록에도 안 남아 있었다 — 게이트 통과 파일 목록과 작업 트리가 어긋난 상태였다는 걸 이번에 발견해 소급으로 남긴다.
- **건드린 파일**:
  - `eobom/frontend/src/index.css` — `.header-inner`의 `padding`을 고정 `1.5rem`에서 `clamp(1.5rem, 4vw, 4.5rem)`으로 변경(640px 이하는 기존 `0.85rem` 오버라이드 그대로 유지). 이번에 주석도 정정(아래 편차 참고).
  - `eobom/frontend/src/pages/CareGuidePage.tsx` — 카드 `onClick`을 `toggleTask`(체크)에서 `toggleExpand`(펼치기)로 반전. 체크박스에 자체 `onChange={() => toggleTask(t.id)}` + `onClick={(e) => e.stopPropagation()}`를 추가해 체크는 체크박스로만 가능하게 분리. 기한 배지(`t.deadlineLabel` 등)·확인필요 배지를 기본 렌더에서 `isExpanded` 블록 안으로 이동 — 기본 상태는 체크박스+제목 한 줄만 남음. `toggleExpand` 함수의 낡은 주석도 정정(아래 편차 참고).
  - **스키마 변경 없음.**
- **결과**: `npx tsc --noEmit`(frontend) 통과 — 두 파일 모두 이 로그 작성 시점 기준 최신 상태에서 재확인. `CareGuidePage.tsx`는 카드 전체 클릭 시 펼침만 토글되고(체크 안 됨), 체크박스 클릭 시 체크만 토글되고 펼침은 안 바뀌는 것을 코드 경로로 확인(두 핸들러 모두 `stopPropagation`으로 상호 간섭 차단). `index.css`는 넓은 화면일수록 헤더 좌우 여백이 커지고 640px 이하에서는 기존 좁은 값으로 복귀하는 구조를 코드로 확인.
- **편차**:
  - **(55)의 [2] 서술을 이번 변경이 뒤집는다.** (55)는 "23항목 전부 기본은 체크박스+기한배지+확인필요배지+제목 한 줄"이라고 적었는데, 이번 변경은 기한·확인필요 배지 2종을 펼침 안으로 옮겨 기본 노출을 "체크박스+제목"만 남겼다. 방향이 반대로 보이지만 `context.md` ⓪-4("제목+체크만, 상세는 펼침")이 정본이라, **이번 변경이 정본에 더 가깝다** — (55) 시점 구현이 정본과 어긋나 있었던 쪽.
  - 같이 정정한 낡은 주석 2건(요청받은 항목): ① `CareGuidePage.tsx`의 `toggleExpand` 주석이 "카드 전체에 `toggleTask`가 걸려 있다"라고 썼는데 지금은 카드 전체가 `toggleExpand`다 — 화살표 버튼이 카드 안에 중첩돼 있어 `stopPropagation`이 없으면 클릭이 버블링돼 `toggleExpand`가 두 번 불린다(펼침→접힘, 아무 일도 안 일어난 것처럼 보임)는 실제 이유로 바꿔 적음. ② `index.css` `.header-inner` 주석이 "640px/480px 이하는 아래 미디어쿼리가 덮어씀"이라고 썼는데, 실제로 `.header-inner` padding 오버라이드는 640px 한 곳(`:666` 부근)뿐이고 480px 미디어쿼리는 로고 `scale`·사용자명 폭만 건드린다 — 정정.
  - 🔴 **이번 로그 작성 중 새로 발견한 사안(이 항목의 직접 범위 밖)**: `context.md` ⓪-7 — *"메뉴 추모관 링크입력 → 하지 말 것. `00-13`§4.5-1 (나)로 확정 — 정규경로는 부고장 안 버튼"*. 그런데 같은 세션의 다른 작업(Header.tsx의 "추모관" 메뉴 항목, 이 (57) 항목과는 별개 커밋 범위)이 정확히 이 금지된 경로 — 헤더 메뉴 클릭 → 홈의 박스③(추모관 링크 입력창)으로 이동 — 를 구현하고 그 스크롤 버그를 디버깅하는 중이었다. **문서 확정 사항과 최근 작업 방향이 충돌한다.** 이 walkthrough 항목 자체의 작업(헤더 여백·체크리스트 접기)과는 무관하지만, 발견한 시점에 기록해 둔다. 사용자에게 별도로 알림.
- **다음 에이전트가 알아야 할 것**:
  - 🔴 **`context.md` ⓪-7 충돌 — 사용자에게 직접 확인함(2026-08-24), 최종 결론 아님.** `Header.tsx`의 `goToMemorialEntry`(및 `EntryBoxes.tsx`/`HomePage.tsx`의 관련 변경분)가 금지된 "메뉴→추모관 링크입력" 경로를 구현 중이라고 알리고 [유지/되돌리기] 중 선택을 물었다. 사용자 답변: **"우선 더 나은 안이 있을 것 같아서 Opus와 상의할 예정"** — 즉 **"이 결정을 의도적으로 뒤집는다"는 승인이 아니라 "지금 당장은 코드를 손대지 말고 Opus 사이클에서 대안을 논의하겠다"는 뜻**이다. 그래서 코드는 되돌리지 않고 이번 사이클에서 그대로 뒀다 — 다음 Opus 사이클이 `context.md` ⓪-7을 갱신하거나(재승인) `00-13`§4.5-1(나)의 "부고장 안 버튼" 경로로 대체 설계를 낼 때까지, **이 기능(헤더 "추모관" 메뉴)은 잠정 상태**로 취급할 것 — Sonnet이 임의로 확정 처리하면 안 됨.
  - `CareGuidePage.tsx`의 접기/펼치기·체크박스 분리 동작과 헤더 여백(`clamp`) 둘 다 브라우저 실기동 확인은 여전히 안 됨 — 코드 경로·타입체크로만 확인.
  - 이번처럼 "작업 트리엔 있는데 walkthrough엔 없는" 미기록 변경이 또 있을 수 있다 — 다음 담당자가 `git status`/`git diff`와 최근 walkthrough 항목들을 대조해 볼 가치가 있다.

- **판정**: ✅통과 (헤더 clamp 반응형 여백 및 CareGuidePage 카드 펼침/체크박스 이벤트 분리 소급 기록 확인 / 낡은 주석 2건 정정 및 context.md ⓪-7 잠정 상태 명시 확인 / tsc 0건 통과)

---

## 2026-08-24 (56) | [Sonnet] `context.md` ④-2 회귀 수정 + ②-0 착수 — LoginModal 공용화 + 만14세 게이트

- **근거 스펙**: `context.md` ④-2(08-24 오후 회귀 — `FamilyInvitePage.tsx:87`이 동의쿼리 없이 `/api/auth/:provider`를 직접 호출해, 같은 날 오후에 추가된 동의 라우트가드에 100% 튕겨 초대수락 로그인이 전면 불가해짐) · `context.md` ②-0 · `00-19_개인정보처리방침_초안.md` §9-2-1(만 14세 이상 자기신고 게이트 구현 요구 4항 — ①LoginModal 게이트 ②약관동의와 분리 ③저장 금지 ④데모 버튼도 게이트).
- **건드린 파일**:
  - 프론트(수정): `eobom/frontend/src/pages/FamilyInvitePage.tsx`(자체 소셜 버튼 3개 + `handleSocialLogin` 제거, `FamilyInvitePageProps`로 `currentUser`·`onOpenLogin` 수신, 초대 토큰을 `sessionStorage`에 먼저 심고 공용 모달을 여는 `handleOpenLogin`으로 대체, "로그인하고 계속하기" 단일 버튼) · `eobom/frontend/src/App.tsx`(`/invite/:token` 라우트에 `currentUser={currentUser} onOpenLogin={() => setIsLoginOpen(true)}` 전달, `loginError` 메시지 맵에 `consent_required` 추가) · `eobom/frontend/src/components/LoginModal.tsx`(`ageConfirmed` state 신설 — `agreedTerms`/`agreedPrivacy`/`agreedMarketing`/`toggleAll` 클러스터와 코드·화면 모두 분리된 별도 체크박스, `canProceed = agreedTerms && agreedPrivacy && ageConfirmed`로 소셜 3버튼 + 데모 3버튼 공통 게이트)
  - **스키마 변경 없음** — 이번 사이클은 프론트 전용(백엔드는 앞선 (55) 이후 사이클에서 이미 동의 필드를 추가해둔 상태 그대로).
- **결과**:
  - **①(회귀 수정)** — `grep -n "handleSocialLogin\|api/auth" FamilyInvitePage.tsx` 결과 자체 OAuth 호출 0건. 미로그인 상태에서 "로그인하고 계속하기" 클릭 → `sessionStorage.setItem('eobom_pending_invite_token', token)`(§9.1-2 기존 복귀 로직 그대로 보존) → `onOpenLogin()` → App.tsx `isLoginOpen=true` → 공용 `LoginModal`이 뜬다(App.tsx에서 `LoginModal`은 라우트 분기 삼항 바깥이라 초대 화면에서도 항상 마운트돼 있음, 코드 위치 재확인). 데모 로그인은 페이지 리다이렉트가 없어 예전 방식(`sessionStorage.getItem` 1회성 읽기)으론 재렌더가 안 걸렸는데, `currentUser`를 App.tsx state에서 props로 내려받는 구조로 바꿔 `handleMockSocialLogin`의 `onLoginSuccess`+`onClose` 호출 → App.tsx `setCurrentUser` → prop 변경 → `FamilyInvitePage` 리렌더 → 수락/거절 버튼 전환까지 코드 경로로 확인(`authToken`도 `useState` 없이 렌더마다 `sessionStorage`를 즉시 재조회하도록 그대로 둬서 같은 재렌더에 함께 최신화됨).
  - **②(만14세 게이트, 착수분)** — `ageConfirmed`는 `toggleAll` 함수 본문(`setAgreedTerms`/`setAgreedPrivacy`/`setAgreedMarketing` 3줄)에 포함되지 않음(요구2 코드 확인) — 전체동의를 눌러도 만14세 체크는 안 바뀐다. 화면도 이용약관 박스(`backgroundColor: var(--secondary-color)`)와 분리된 별도 테두리 박스로 그 위에 렌더. `grep -n "ageConfirmed" LoginModal.tsx` 결과 `handleSocialLogin`의 `URLSearchParams`·`handleMockSocialLogin`의 `JSON.stringify` 어디에도 안 실림 — 백엔드로 전송 자체를 안 해 요구3(저장 금지)을 코드 구조로 충족. `canProceed`에 결합해 소셜 3버튼(`disabled` + 래퍼 `pointerEvents:'none'`)과 데모 3버튼(같은 `canProceed` 참조) 전부 동일 게이트(요구1·4).
  - **빌드**: `npx tsc --noEmit`(frontend) 통과 — App.tsx·FamilyInvitePage.tsx·LoginModal.tsx 수정마다 반복 실행, 전 구간 통과.
- **편차**:
  - 브라우저 실기동(초대 링크를 실제로 열어 로그인 모달이 뜨는지, 데모 로그인 후 화면이 수락/거절로 바뀌는지, 만14세 체크박스 클릭 반응) 미검증 — 타입 체크와 코드 경로 추적으로만 확인했다. `context.md` ④-2가 이미 "초대화면 실 소셜버튼 클릭은 실 OAuth라 로컬 검증 불가"를 전제하고 있어 그 부분은 이번에도 동일한 제약.
  - `context.md`·`00-19` 문서 자체는 구현 중 수정하지 않음(`roles.md` §2 원칙) — ②-0을 ✅로 표시하거나 ④-2의 회귀 하위 항목을 지우는 편집은 다음 Opus 사이클 몫으로 남김.
  - 만14세 체크박스 문구·모달 내 위치(제목 바로 아래, 동의 박스보다 위)는 `00-19` §9-2-1이 정확한 문구·위치를 못박지 않아 이번에 임의로 정함 — "본인은 만 14세 이상입니다 / 이어봄은 만 14세 미만 아동의 가입을 받지 않습니다"로 작성.
- **다음 에이전트가 알아야 할 것**:
  - `context.md` ②-0 뒤에 이어지는 "E-5(a) 본문화, E-5(b)·E-6은 v1.1 전(`00-18`§8.4)"는 이번 범위 밖 — 손대지 않음.
  - 브라우저 실기동(①②모두) 여전히 미검증 — 다음 담당자가 `npm run dev`로 `/invite/:token`을 직접 열어 로그인 모달·만14세 체크박스·데모 로그인 후 재렌더를 눈으로 확인할 것.
  - `LoginModal`의 필수 게이트가 3종(이용약관·개인정보·만14세)으로 늘었다 — 앞으로 이 모달에 체크박스를 더 추가할 일이 있으면, "필수 동의 클러스터(`toggleAll`에 포함)"인지 "완전히 별도 게이트(`ageConfirmed`처럼 분리)"인지부터 판단해야 한다(`00-19` §9-2-1 요구2가 그 경계를 가르는 실제 판례다).

- **판정**: ✅통과 (초대수락 로그인 회귀 해소 확인 — LoginModal 공용 호출 및 pending_invite_token 컨텍스트 보존 / 00-19 §9-2-1 만14세 자기신고 게이트 4대 요구사항 충족 및 백엔드 미전송 격리 확인 / tsc 0건 통과 / ⚠️ 단, 브라우저 실기동은 미검증 상태이므로 실기기 확인 권장)

---

## 2026-08-21 (54) | [Sonnet] `07-03` §5 — 부고장 로딩 지연 계측 + 스켈레톤 UI

- **근거 스펙**: `07-03` §5(부고장 조회 지연) 개발자 지시 — 실측 `/api/health`(DB 미사용) ~165ms vs `/api/obituaries/:slug`(DB 사용) ~1,500ms, 원인은 Render(오리건)↔Supabase(서울) 인프라 왕복(이번 범위 밖, `render.yaml`·`pending-approvals.md`). 이번 범위는 "그 제약 안에서 왕복 횟수를 줄이고 체감을 개선하는 것" — A(계측)·B(왕복 줄이기, 조건부)·C(스켈레톤 UI, 무조건).
- **건드린 파일**: `eobom/frontend/src/index.css`(`.skeleton-block` + `@keyframes skeletonPulse` 신설) · `eobom/frontend/src/pages/ObituaryLandingPage.tsx`(`ObituaryLandingSkeleton` 신설, `loading` 분기 교체) · `eobom/frontend/src/pages/ObituaryPage.tsx`(`ObituaryManageSkeleton` 신설, `loading` 분기 교체). `eobom/backend/src/config/prisma.ts`는 계측을 위해 `log: ['query']`로 **일시** 수정했다가 측정 직후 원상복구했다(`git diff`로 잔여 변경 없음 확인). **스키마 변경 없음.**
- **결과**:
  - **A(계측)** — `prisma.ts`에 `new PrismaClient({ log: ['query'] })`를 임시로 넣고 로컬 백엔드(`npm run dev`, Docker DB)를 띄운 뒤, 데모 로그인(GOOGLE)으로 부고장 하나를 만들고 `curl -sk https://localhost:5000/api/obituaries/{slug}`를 **단독 호출**해 그 사이 찍힌 SQL만 잘라냈다. 결과: **총 5개 쿼리** — ① `Obituary` `findUnique`(메인) ② `Deceased` 관계 `SELECT`(`IN ($1)`) ③ `Memorial` 관계 `SELECT` ④ `ObituaryMourner` 관계 `SELECT` ⑤ `Obituary` `UPDATE`(`viewCount`+1, fire-and-forget). **읽기 쿼리 4개**(①~④, `include` 3개가 각각 별도 쿼리로 갈라짐 — 지시가 예상한 그대로) + **쓰기 1개**(⑤, 지시대로 손대지 않음).
  - **B(왕복 줄이기, 조건부)** — 읽기 쿼리 4개로 "4회 이상" 조건에 해당해 `relationJoins` preview 기능을 검토했다. **결론: 적용 보류.** 이유는 아래 편차 참고.
  - **C(스켈레톤 UI, 무조건 적용)** — `ObituaryLandingPage.tsx`(조문객이 카톡 링크로 처음 보는 화면)와 `ObituaryPage.tsx`(유족 관리 화면) 둘 다 `loading` 분기를 "불러오는 중" 텍스트에서 **실제 레이아웃과 같은 자리·크기의 회색 블록**(근조 헤더/빈소·발인 로우/상주 로우/추모관 바 — 관리 화면은 폼 5칸 + 카드 미리보기 + 공유 버튼 2개)으로 교체. 기존 `.animate-pulse`(지도 핀용, `scale` 포함)는 사각 블록에 안 맞아 재사용하지 않고 `opacity`만 바뀌는 `.skeleton-block`/`skeletonPulse`를 새로 만들었다.
  - **빌드**: `npx tsc --noEmit`(backend) 통과 · `npm run build`(backend) — **최초 1회 `EPERM: ... query_engine-windows.dll.node` 실패**(원인: 이번 세션에서 여러 차례 백그라운드로 띄웠던 `npm run dev`(backend) 중 정리가 안 된 좀비 `node.exe` 프로세스 6쌍(12개)이 해당 DLL을 잠그고 있었음 — `Get-CimInstance Win32_Process`로 커맨드라인 확인 후 전부 `taskkill`, 무관한 `chrome-devtools-mcp` 프로세스 4개는 안 건드림) → 재시도 통과 · `npx tsc --noEmit -p .`(frontend) 통과 · `npm run build`(frontend) 통과.
- **편차**:
  - 🔵 **B를 보류했다 — 지시된 조건부 경로 그대로다(스펙 위반이 아니라 스펙이 요구한 판단).** `relationJoins`는 `generator client { previewFeatures = [...] }`로 켜는 **스키마 전역** 플래그다. 실제 JOIN 사용(`relationLoadStrategy: 'join'`)은 쿼리 단위로 켤 수 있지만, **기능 자체를 켜는 순간 이 앱의 다른 22개 모델·모든 관계 쿼리가 같은 preview 엔진 동작으로 넘어간다.** 이 프로젝트는 Prisma 5.22.0(최신 7.9.1과 격차 큼)에 회귀 테스트가 없다(`00-15` 근거) — 지시가 명시한 "전역 영향 시 보류" 조건에 정확히 해당해 적용하지 않았다. 대안으로 이 조회 하나만 raw SQL JOIN으로 손수 짜는 방법도 있지만(전역 영향 없음), **지시받은 도구는 `relationJoins`뿐이라 임의로 다른 기법을 새로 들이지 않았다** — 필요하면 다음 사이클에서 판단할 것.
  - 검증 중 이번 세션이 쌓아둔 **좀비 백엔드 프로세스 12개를 정리**했다 — 지시받은 작업은 아니지만 빌드 자체가 막혀 있어(`EPERM`) 불가피했다. `chrome-devtools-mcp` 등 무관한 프로세스는 커맨드라인을 먼저 확인하고 건드리지 않았다.
- **다음 에이전트가 알아야 할 것**:
  - **왕복 4→1 단축은 아직 안 됐다.** `relationJoins`를 GA(Prisma 메이저 업그레이드) 이후 다시 검토하거나, 이 조회 하나에 한해 raw SQL JOIN을 손으로 짜는 방법을 고려할 것 — 후자는 전역 영향이 없지만 타입 안정성을 잃는다는 트레이드오프가 있다.
  - 스켈레톤은 **레이아웃 자리만** 잡는다 — 실제 필드 유무(예: 익명 조회엔 없는 `계좌`·`장지` 등)에 맞춰 동적으로 칸 수를 바꾸지 않는다(로딩 시점엔 알 수 없으므로 의도적으로 고정 3~5칸).
  - ⚠️ 브라우저 실기동(스켈레톤이 실제로 먼저 보이고 실데이터로 자연스럽게 전환되는지 육안 확인)은 여전히 안 함 — 코드·계측 수치로만 검증했다.

- **판정**: ✅통과 (07-03 §5 부고장 조회 쿼리 5건 실측 계측 확인 / relationJoins 전역 영향에 따른 보류 판단 타당 / ObituaryLandingPage 및 ObituaryPage 스켈레톤 UI 적용 및 build·tsc 0건 통과 / ⚠️ 브라우저 실기동 미검증)

---

## 2026-08-24 (55) | [Sonnet] 개발자 점검 7건 구현(1~4) + `00-27` Phase 2(5) — 5개 섹션 한 사이클

- **근거 스펙**: `context.md` ⓪(개발자 점검 7건 분류) · `00-29_모바일_대응_전략_검토서.md` §5·§6·§8 · `00-27` §9.1(공유 버튼·초대 링크, 2026-08-21 개발자 확정) · `00-19`(생년월일 미수집, 손대지 않음). 개발자 지시 — MyPage 하드코딩 제거(1) · CareGuidePage 접기(2) · 로그인 속도(3) · 00-29 모바일 반응형(4) · 00-27 Phase 2 초대 링크(5, "⑧ 부고장 isOwner 서버 판정(§5.3-2) 완료 후 시작" 조건부 — (53)에서 이미 완료돼 있어 바로 착수).
- **건드린 파일**:
  - 백엔드(신규): `eobom/backend/src/controllers/summaryController.ts`
  - 백엔드(수정): `eobom/backend/src/routes/meRoutes.ts`(`GET /summary` 추가) · `eobom/backend/src/controllers/authController.ts`(소셜 로그인 기존회원 분기 `$transaction` 병합 + 불필요 `include` 제거) · `eobom/backend/src/controllers/familyDesignationController.ts`(`inviteFamilyDesignation`·`getFamilyInvite`·`acceptFamilyInvite`·`declineFamilyInvite` 4종 + `serialize`에 `tokenExpiresAt`·`declinedAt` 추가) · `eobom/backend/src/routes/familyDesignationRoutes.ts`(4개 라우트 추가)
  - 프론트(신규): `eobom/frontend/src/pages/FamilyInvitePage.tsx`
  - 프론트(수정): `eobom/frontend/src/pages/MyPage.tsx`(3칸 카운터 실데이터·엔딩노트 배지·예약현황 배지·"계정 연동"·`.stat-row`) · `eobom/frontend/src/components/Header.tsx`(라벨·로고 래퍼 클래스) · `eobom/frontend/src/components/Sidebar.tsx`(라벨) · `eobom/frontend/src/pages/CareGuidePage.tsx`(접기/펼치기) · `eobom/frontend/src/App.tsx`(warm-up fetch, `/invite/:token` 라우트+로그인 복귀 소비) · `eobom/frontend/src/components/MyPageFamilyDesignation.tsx`(알리기·공유 버튼, 상태 라벨) · `eobom/frontend/src/index.css`(00-29 §6.1 프리미티브 4개 + 375px 헤더 압축) · `eobom/frontend/src/pages/ObituaryPage.tsx`·`CounselingPage.tsx`·`FacilityPage.tsx`(`.page-title`/`.auto-grid` 적용)
  - **스키마 변경 없음** — `git status --short eobom/backend/prisma`로 확인(00-27 Phase 2 컬럼 6개는 Phase 1 마이그레이션에 이미 존재).
- **결과** (로컬 Docker DB against 백엔드를 직접 띄워 curl/PowerShell로 검증 — 세션 중 Docker Desktop이 꺼져 있어 재기동함):
  - **[1] MyPage**: `GET /api/me/summary` 실호출 → `{"leadCount":3,"consultCount":1,"obituaryCount":2}` — 실제 계정 활동 건수와 일치. 3칸을 `$transaction([...])`으로 1왕복 처리(순차 3회였다면 ~4초, 이제 1왕복). "계정 설정"→"계정 연동" 3곳(MyPage.tsx·Header.tsx·Sidebar.tsx) + 관련 주석 2곳까지 전부 치환(`grep -rn "계정 설정"` 결과 UI 텍스트 0건, docs 과거 기록만 남음 — 06-02 §6.1 재발 방지).
  - **[2] CareGuidePage**: 23항목 전부 기본은 체크박스+기한배지+확인필요배지+제목 한 줄, `note`·근거·바로가기 3종은 `expandedIds: Set<number>`로 펼침. chevron 버튼에 `e.stopPropagation()` 적용(카드 전체 `onClick=toggleTask`와 분리 확인). 각 카드에 `breakInside: 'avoid'` 추가(다단에서 펼친 카드가 단 경계에서 안 쪼개지게).
  - **[3] 로그인 속도**: `authController.ts` 기존회원 분기 — `user.update`(+ 조건부 `socialAccount.update`)를 `$transaction([...])`으로 묶어 연동해제 복구 케이스를 3왕복(find+update+update)→2왕복(find+transaction)으로 줄임. 안 쓰던 `include: { user: true }`도 제거. `App.tsx`에 `fetch('/api/health').catch(()=>{})` 최초 마운트 1회 추가(무음 warm-up). **⚠️ 실측 전/후 왕복시간은 못 남겼다** — 데모 로그인은 이 코드 경로(`handleSocialLoginCallback`)를 안 타서(별도 `demoLogin` 함수) 로컬에서 재현할 수단이 없었다. 실제 카카오/네이버/구글 로그인으로만 검증 가능 — 다음 담당자 확인 필요.
  - **[4] 00-29 모바일**: `index.css`에 `.page-title`·`.auto-grid`·`.stat-row`·`.stack-sm` 4개 프리미티브 신설(기존 480/640/768 브레이크포인트만 사용). §5 우선순위 1(MyPage)·2(CareGuidePage 제목)는 완료, 3(ObituaryPage)은 관리 화면 그리드 2곳 교체 완료, 4(FacilityPage·CounselingPage)는 페이지 제목만 교체(그리드 정밀 감사는 미완료). 375px 헤더(`context.md` ①) — 로고+햄버거+모드칩+사용자칩을 직접 합산해보니(로고 SVG 56.7px+워드마크 텍스트 실측 근사 ~177.6px 등) 기존 640px 압축만으로는 375px에서 여전히 초과 추정돼, 480px에서 로고 `scale(0.8)`+사용자명 `max-width` 44px로 추가 압축 — **실제 375px 뷰포트 렌더링 확인은 못 함(계산 추정)**, 다음 담당자가 실기기/DevTools로 확정 필요.
  - **[5] `00-27` Phase 2**: 계정 A(KAKAO)로 가족 "동생" 등록 → `POST .../invite` → `inviteToken` 발급(`tokenExpiresAt` = 정확히 +30일 확인) → **익명**으로 `GET /invite/:token` 조회 → 응답에 `designatorName`(A의 이름)·`relationship`·`scope`만 있고 **연락처 없음** 확인 → 계정 B(NAVER)로 로그인 후 `.../accept` → DB 직접 조회로 `status:"ACCEPTED"`·`acceptedUserId`=B의 id·`inviteToken:null`(1회용 무효화) 확인. 이어서: 무효화된 토큰 재조회 **404**, 이미 ACCEPTED인 지정 재초대 **400**, 존재하지 않는 토큰 **404**, 별도 지정 하나를 **로그인 없이 거절**(`declinedAt` 기록, `status:"DECLINED"`) 후 **재초대 성공**(새 토큰 발급, 이전 토큰은 여전히 404) — 완료 판정 문구("A 등록→공유→B 가입→수락 시 acceptedUserId=B, 토큰 재사용 거부") 전부 실측 통과.
  - **빌드**: `npx tsc --noEmit`(backend, 각 섹션마다 반복 실행) 통과 · `npm run build`(backend) 통과 · `npx tsc --noEmit -p .`(frontend, 반복 실행) 통과 · `npm run build`(frontend) 통과.
- **편차**:
  - **[4] `.stat-row`의 360px 2단 접기를 구현하지 않았다.** `00-29` §6.1 표는 "≤480px 축소, ≤360px 1열"을 요구하지만, 같은 절 마지막 줄 및 이번 지시 4-1이 재차 "브레이크포인트는 기존 480/640/768만, 네 번째 값 금지"를 못박아 **문서 내부 모순**이었다. 더 구체적·최신인 지시 쪽을 따라 480 하나로 접었다(375px에서 3열 유지 + 폰트 축소만으로 가로 스크롤 없음, §6.2 판정 기준은 통과하는 걸로 계산). `00-29`를 고치는 건 Opus 몫이라 문서는 그대로 뒀다 — §6.1 표의 360px 언급을 삭제하거나 예외로 명시할지 검토 필요.
  - **[4] §7의 "00-09에 클래스 4개 등재"를 하지 않았다** — docs/는 구현 중 안 고친다는 원칙(`roles.md` §2)에 따라 코드만 만들고 등재는 다음 Opus 사이클로 남겼다.
  - **[4] 우선순위 4(FacilityPage·CounselingPage)는 페이지 제목만 교체하고 그리드·카드 레이아웃은 못 봤다** — 시간 배분상 5(00-27 Phase 2)까지 이번 사이클에 다 넣어야 해서, "375px 가로 스크롤 없음" 정밀 검증까지는 못 갔다.
  - **[3] 왕복시간 실측이 없다** — 위 결과 참고. 이론상 절감치(회당 ~1.3초 × 최대 1회)만 코드 구조로 담보했다.
- **다음 에이전트가 알아야 할 것**:
  - **브라우저 실기동(클릭·화면 확인)은 전 섹션 공통으로 안 함** — API 레벨(curl/PowerShell)과 코드 리뷰로만 검증했다. 특히 [2] 펼치기/접기 UI, [4] 375px 실제 렌더, [5] `navigator.share` 실제 공유 시트·초대 화면 소셜 로그인 버튼 클릭은 전부 미확인.
  - [3] 실 소셜 로그인(카카오/네이버/구글 중 하나)으로 로그인 콜백 왕복시간을 실측해 walkthrough에 추가해야 §완료 판정이 완전히 닫힌다.
  - [4] `00-09`에 반응형 프리미티브 4개 등재 필요(Opus). `.stat-row` 360px 모순도 `00-29`에서 정리 필요.
  - [4] FacilityPage·CounselingPage의 나머지 인라인 그리드·고정폭 값(§2.2 표 기준)은 미감사 — §5 우선순위 4를 마저 끝내려면 여기부터.
  - [5] Phase 3(`DeathVerification`, `FamilyDesignation`→`BereavedRelation` 승격)은 여전히 범위 밖. `FamilyInvitePage.tsx`의 소셜 로그인 버튼은 데모 로그인이 아니라 **실제 OAuth**(`/api/auth/kakao` 등)로 연결돼 있어 로컬에서 버튼 클릭 자체는 검증하지 못했다(경로 존재만 코드로 확인).
  - Docker Desktop이 이번 세션 중간에 꺼져 있었다(재부팅 추정) — 다시 켜고 `eobom-postgres` 컨테이너를 수동으로 `docker start` 했다. 다음에도 로컬 DB 접근 전에 `docker ps` 먼저 확인할 것.

- **판정**: ✅통과 (MyPage $transaction 실데이터 집계 및 "계정 연동" 치환 확인 / CareGuidePage 23항목 접기·다단 방어 확인 / 00-27 Phase 2 초대 링크 발급·수락·1회성 무효화 실측 통과 / 00-29 반응형 4대 프리미티브 반영 / 프론트·백엔드 build 및 tsc 0건 통과 / ⚠️ 브라우저 실기동 미검증)

---

## 2026-08-21 (53) | [Sonnet] `07-03` §5.3-1·§5.3-2 — 부고장 관리화면 교차계정 노출 사고 수정

- **근거 스펙**: `07-03` §5.3-1(개설자 본인은 종료 후에도 조회 가능 — 화이트리스트에 `isOwner`·`obituaryId` 본인 전용 추가)·§5.3-2(소유권은 서버가 판정 — `localStorage`로 판단 금지)·§6.2-3(종료가 연락처·계좌 노출의 유일한 실효 완화). 개발자 지시 계기: *"네이버 계정으로 만든 부고장이 있는 브라우저에서 카카오 계정으로 로그인했더니, 남의 부고장 관리 화면이 그대로 떴다."* — 서버 권한 검증(`createdByUserId`)은 정상, 화면 진입 조건만 결함.
- **건드린 파일**: `eobom/backend/src/controllers/obituaryController.ts`(`getObituaryBySlug` 응답에 `isOwner === true`일 때만 `isOwner: true`·`obituaryId` 추가) · `eobom/frontend/src/pages/ObituaryPage.tsx`(마운트 `useEffect`를 `data.isOwner === true`로만 관리 모드 진입하도록 재작성, 새 `obituaryId` state 도입해 `handleSubmit`(PATCH)·`handleCloseObituary`가 `localStorage`가 아니라 서버 응답값만 쓰도록 교체). **스키마 변경 없음** — `git status --short eobom/backend/prisma`로 확인.
- **결과** (로컬 Docker DB against 백엔드를 이번 세션에서 직접 띄워, **계정 2개로 실제 교차 로그인**한 절차를 curl/PowerShell로 재현 — 원문 그대로):
  1. 데모 로그인 NAVER(계정 A) → `POST /api/obituaries`로 부고장 개설 → `obituarySlug: e4250629fb1105e353435c070297d4fe`, `obituaryId: bad1c060-d707-4d5c-a087-0e3b6c26d59f`.
  2. 데모 로그인 KAKAO(계정 B, **같은 세션에서 별도 로그인** — 사고 재현) → `GET /api/obituaries/{A의 slug}`를 **B의 토큰으로** 호출 → `status:"success"`(고인 성명 등 공개 데이터는 정상 응답 — §5.3 화이트리스트 자체는 원래도 공개)이지만 **응답 객체에 `isOwner` 키·`obituaryId` 키가 아예 없음**(`PSObject.Properties.Name -contains` 검사로 부재 확인, `null`도 아니고 키 자체가 없음) — §5.3-1이 요구한 정확히 그 형태.
  3. 익명(토큰 없음)으로 같은 slug 조회 → 동일하게 `isOwner`·`obituaryId` 키 없음.
  4. **A(진짜 주인) 토큰으로 재조회** → `isOwner: True`, `obituaryId`가 1번에서 만들어진 값과 **정확히 일치**.
  5. **A의 서버 제공 `obituaryId`로 종료(`PATCH /api/obituaries/{obituaryId}/close`)** 성공 → 종료 후 **익명 조회는 404**, **A 본인 조회는 200 + `isClosed:true`·`isOwner:true`** — (51)에서 미검증으로 남겼던 §9 #9 실기동을 여기서 같이 닫음.
  - 프론트 코드는 `grep obituaryRef\.obituaryId` 결과 0건 — `handleSubmit`(PATCH)·`handleCloseObituary` 둘 다 서버가 준 `obituaryId` state만 참조하도록 완전히 교체됐음을 코드로 확인(§5.3-2 §8 요구 — `localStorage`의 `obituaryId` 없이도 동작해야 함).
  - **빌드**: `npx tsc --noEmit`(backend) 통과 · `npm run build`(backend) 통과 · `npx tsc --noEmit -p .`(frontend) 통과 · `npm run build`(frontend) 통과.
  - 검증에 쓴 로컬 백엔드는 `taskkill`로 종료, 남은 프로세스 없음.
- **편차**: 없음 — 지시된 A·B 작업(백엔드 화이트리스트 2필드, 프론트 `isOwner` 게이팅 + `obituaryId` 서버 소싱)을 문구 그대로 구현했다. "구현자가 판단하지 않는 것" 4개(익명 응답 불변·서버 권한 완화 금지·`GET /api/me/obituaries` 미생성·`sessionStorage` 미이전)도 전부 지켰다 — 새 라우트를 하나도 안 만들었고 `verifyBearerToken`/`createdByUserId` 비교 로직은 손대지 않았다.
- **다음 에이전트가 알아야 할 것**:
  - **브라우저 실기동(클릭 기반)은 여전히 안 함** — 위 절차는 프론트가 실제로 보내는 것과 동일한 헤더·엔드포인트로 API를 직접 호출해 검증한 것이지, 화면에서 "아직 부고장이 없습니다"가 실제로 렌더링되는 것을 눈으로 본 것은 아니다. 코드 상으로는 `if (!o.isOwner) return;`이 `setObituaryRef`·폼 채우기 전부를 감싸고 있어 논리적으로는 맞지만, 실제 화면 확인은 남아 있다.
  - `07-03` §9 #9의 "이어서" 요청(종료 실기동)은 위 절차 5번으로 API 레벨에서는 닫혔다 — 문서의 `⚠️ 브라우저 실기동 미검증`(925행 근처, (51) 관련 롤업)은 여전히 화면 클릭 기준으로는 미검증 상태로 남겨둔다.
  - `00-28` Phase 2는 이번 사이클 때문에 뒤로 밀렸다 — 이 항목이 처리된 뒤 이어서 진행하면 된다.

- **판정**: ✅통과 (07-03 §5.3-1·§5.3-2 부고장 관리화면 교차계정 노출 차단 확인 — 서버 isOwner/obituaryId 본인 한정 화이트리스트 및 소유권 서버 소싱 / 계정 2개 교차 로그인 API 실측 검증 통과 / build·tsc 0건 통과 / ⚠️ 브라우저 실기동 미검증)

---

## 2026-08-21 (52) | [Sonnet] `00-28` Phase 2 (6번까지) — 문의·상담 폼 프로필 연락처 재사용

- **근거 스펙**: `00-28` §6.4(prefill은 클라이언트가 채우지 않는다 — `useProfileContact` 플래그)·§6.4-1(기존 `localStorage` prefill 제거)·§8 Phase 2(순서 변경 — 6번 먼저, 5번은 이번 범위 밖)·§2(스냅샷 원칙). 개발자 지시로 A(`useProfileContact`)·B(`saveToProfile`)·C(프론트 두 폼 동일 적용)·D(`localStorage` prefill 제거)의 구체 요구사항이 추가로 주어짐.
- **건드린 파일**: `eobom/backend/src/utils/applicantContact.ts`(신규 — `resolveApplicantContact`·`ProfileContactMissingError`) · `eobom/backend/src/controllers/leadController.ts`(`createQuote`에 `useProfileContact`·`saveToProfile` 처리 추가) · `eobom/backend/src/controllers/expertPublicController.ts`(`submitConsultRequest`에 동일 처리 추가) · `eobom/frontend/src/hooks/useProfileContact.ts`(신규 — `GET /api/me/profile` 조회 + 체크박스 상태 공용 훅) · `eobom/frontend/src/components/facility/InquiryModal.tsx`(`LAST_APPLICANT_KEY` localStorage prefill 완전 삭제 + 1회 정리 코드 + 체크박스 2개) · `eobom/frontend/src/components/expert/ConsultRequestModal.tsx`(동일 체크박스 2개 신규 추가 — 기존엔 prefill 자체가 없었음). **스키마 변경 없음** — `git status --short eobom/backend/prisma`로 마이그레이션 미생성 확인.
- **결과** (로컬 Docker DB against 백엔드 `npm run dev`를 이번 세션에서 직접 띄워 API를 curl/PowerShell로 실제 호출해 검증 — 절차와 원문 그대로):
  1. 데모 로그인(KAKAO) → `PATCH /api/me/profile {"contactPhone":"010-1111-2222"}` → `GET /api/me/profile` 응답이 `"contactPhone":"010-****-2222"`로 마스킹됨 확인.
  2. `POST /api/facilities/kakao_1619199420/quotes {"useProfileContact":true,"thirdPartyConsent":true,"payload":{...}}` → `leadNo:"EB-260821-0001"`. **DB 직접 조회**(`prisma.lead.findUnique`)로 `applicantPhone:"01011112222"`, `applicantName:"카카오 테스트회원"` — 값 자체를 안 보냈는데도 서버가 프로필에서 정확히 복사해 넣음을 확인.
  3. 같은 유저로 `PATCH /api/me/profile {"contactPhone":"010-3333-4444"}` 실행 후 **`EB-260821-0001`을 다시 조회** → `applicantPhone`은 여전히 `"01011112222"`(변경 전 값) — **§2 스냅샷 불변 원칙이 실제로 지켜짐을 확인.**
  4. `saveToProfile:true`로 `applicantPhone:"010-9999-8888"` 제출 → `GET /api/me/profile`이 `"contactPhone":"010-9999-8888"`(마스킹 안 됨, **버그**)로 응답 — 원인 규명 후 즉시 수정(아래 편차 참고), 서버 재기동 후 재검증(`010-7777-6666` 입력 → `"010-****-6666"` 정상 마스킹, 해당 Lead의 `applicantPhone`은 `"010-7777-6666"`(원문 그대로) 확인 — 정책대로 스냅샷은 원문, 프로필만 정규화).
  5. 프로필에 연락처가 없는 유저(GOOGLE 데모)로 `useProfileContact:true` 제출 → `400`(`ProfileContactMissingError`) 확인.
  6. 비로그인(토큰 없음) + `useProfileContact:true` + 이름/연락처 미입력 제출 → `400`("이름과 연락처는 필수") — 플래그가 무시되고 기존 필수값 검증으로 정상 폴백함을 확인.
  7. `POST /api/experts/d75681e8-2f33-4034-bb60-3f143772f233/consult-requests {"useProfileContact":true,...}` → `requestNo:"EC-260821-0001"`. DB 조회로 `applicantPhone:"01077776666"` — `createQuote`와 동일하게 동작함을 확인(§C "두 폼 동일" 요구사항).
  - **빌드**: `npx tsc --noEmit`(backend, 버그 수정 전후 2회) 통과 · `npm run build`(backend) 통과 · `npx tsc --noEmit -p .`(frontend) 통과 · `npm run build`(frontend) 통과.
  - `grep -rn "LAST_APPLICANT_KEY\|eobom_last_applicant"`로 저장/복원 로직이 완전히 사라지고 1회성 `localStorage.removeItem`만 남았음을 확인.
  - 검증에 쓴 로컬 백엔드·임시 조회 스크립트는 세션 종료 전 전부 종료·삭제(`taskkill`, `rm _verify_check_lead.js`) — 남은 프로세스 없음.
- **편차**:
  - 🔴 **검증 중 실제 버그를 발견해 고쳤다.** `saveToProfile` 최초 구현이 `resolveApplicantContact`가 돌려준 `applicantPhone`(비-프로필 분기에서는 `bodyPhone.trim()` — 하이픈 등 원문 그대로)을 **정규화 없이 그대로 `User.contactPhone`에 썼다.** 이러면 `maskPhone`(11자리 숫자만 가정)이 하이픈 섞인 13자 문자열엔 안 걸려 **평문이 그대로 응답에 노출**된다(§6.1 위반). `Lead.applicantPhone`/`ConsultRequest.applicantPhone`은 원래부터(Phase 2 이전) 원문을 그대로 저장하는 기존 동작이라 그쪽은 안 건드렸고, **`User.contactPhone`에 쓰는 지점에서만 `normalizePhone`을 추가로 걸었다**(`leadController.ts`·`expertPublicController.ts` 둘 다).
  - 지시 B의 "6번, `saveToProfile:true`면 이름·연락처를 `User.contactPhone`·`profileUpdatedAt`에 반영한다"에서, **목적어(이름·연락처)와 실제 나열된 대상 컬럼(`contactPhone`·`profileUpdatedAt`)이 어긋난다** — `User.name`은 대상 컬럼 목록에 없었다. **목록을 문자 그대로 따라 `User.name`은 덮어쓰지 않았다.** 급하게 입력한 문의 폼 이름으로 계정 전체에 쓰이는 이름을 바꾸는 건 목록에 없는 더 큰 부작용이라 보수적으로 해석했다 — 의도와 다르면 정정 바란다.
  - 지시에 없던 것 둘을 추가했다: ① 두 컨트롤러가 완전히 같은 로직을 쓰도록 `utils/applicantContact.ts` 공용 함수로 뺐다(복붙이면 나중에 두 폼이 갈릴 수 있어서). ② 프론트도 같은 이유로 `hooks/useProfileContact.ts` 공용 훅으로 뺐다. ③ "다음에도 쓸 수 있게 내 정보에 저장" 체크박스는 로그인 상태에서만 노출되게 했다(비로그인은 저장할 프로필이 없으므로) — §6.4 원문엔 이 조건이 명시돼 있지 않다.
  - 순서 지시대로 **5번(온보딩)은 만들지 않았다** — 이번 범위는 6번까지.
- **다음 에이전트가 알아야 할 것**:
  - 🔵 **5번(가입 직후 온보딩)은 "6번이 실기동 검증된 뒤 판단"하기로 한 항목** — 이번 결과(위 절차)로 6번 실기동 검증은 API 레벨에서 끝났으나, **브라우저에서 체크박스가 실제로 보이고/비활성화되는지(눈으로 보는 실기동)는 아직 안 했다** — 5번 착수 전에 먼저 확인 권장.
  - `Lead.applicantPhone`/`ConsultRequest.applicantPhone`은 **여전히 사용자가 타이핑한 원문 그대로**(하이픈 포함 가능) 저장된다 — Phase 2 이전부터의 기존 동작이라 이번에 정규화하지 않았다. `User.contactPhone`만 숫자만 저장 규칙을 따른다. 이 비대칭이 낯설게 느껴질 수 있는데, 의도한 것이다(스냅샷 원문 보존 vs 프로필 정규화).
  - ⚠️ 브라우저 실기동(체크박스 렌더링·비활성화·마스킹 표시가 실제 화면에서 보이는지)은 여전히 미검증 — API 레벨 검증만 했다.

- **판정**: ✅통과 (00-28 Phase 2 시설문의·상담신청 프로필 연락처 prefill 및 saveToProfile 적용 확인 / User.contactPhone 정규화 누락 버그 자체 수정 및 스냅샷 불변성 유지 확인 / build·tsc 0건 통과 / ⚠️ 브라우저 실기동 미검증)

---

## 2026-08-21 (51) | [Sonnet] `07-03` Phase 3 #9 — 부고장 종료(수동 + 발인 3일 자동)

- **근거 스펙**: `07-03` §6.2-3(연락처·계좌 노출을 실제로 막는 유일한 완화책)·§6.2-4(발인+3일 자동 종료, N=3 확정)·§5.3(GET 화이트리스트)·§9 #9(Phase 3 로드맵: "마이페이지 수동 종료 버튼(눈에 띄게) + 발인+3일 자동 종료, 조회 시점 판정으로 구현, 스케줄러 안 들임"). 개발자 지시: *"Phase3 부고장 종료 기능 구현해줘."*
- **건드린 파일**: `eobom/backend/prisma/schema.prisma`(`Obituary.closedAt`에 설명 주석 추가 — 필드·타입 변경 없음, 마이그레이션 없음) · `eobom/backend/src/controllers/obituaryController.ts`(`AUTO_CLOSE_DAYS`·`isAutoExpired`·`isObituaryClosed` 신설, 기존 `findViewableObituaryBySlug` 제거하고 `getObituaryBySlug`에 인라인 + 본인 예외 처리, `closeObituary` 신규) · `eobom/backend/src/routes/obituaryRoutes.ts`(`PATCH /:id/close` 추가, 머리말 주석 갱신) · `eobom/frontend/src/pages/ObituaryPage.tsx`(`isClosed`·`closedAt`·`isClosing` state, GET 요청에 소유자 토큰 추가, `handleCloseObituary`, "부고장 종료" 버튼 + 종료 시 배너 UI).
- **결과**:
  - **자동 종료 판정**: `isAutoExpired(funeralAt)`이 `funeralAt`을 KST 벽시계로 옮겨 "발인일" 달력 날짜를 구하고, 그 날짜+3일의 KST 자정을 UTC로 환산해 `Date.now()`와 비교. 스케줄러·배치 없음 — `getObituaryBySlug` 조회 시점에만 계산(§9 #9 요구사항 그대로). Node 스크립트로 경계값 4건 직접 검증(자정 전 `false`, 자정 정각·직후 `true`, 발인이 KST 23:50인 늦은 케이스도 같은 cutoff로 계산됨) — 파일은 커밋 대상 아닌 임시 스크래치패드에서 실행 후 삭제하지 않고 세션 임시 디렉터리에 남아 있음(레포 밖).
  - **수동 종료**: `PATCH /api/obituaries/:id/close`(개설자만) — `closedAt`을 지금 시각으로 1회만 세팅, 이미 닫혀 있으면 그대로 반환(버튼 두 번 눌러도 안전, 되돌리기 없음).
  - **개설자 예외 조회**: `getObituaryBySlug`가 `Authorization` 헤더로 본인 확인이 되면(선택 — 없어도 기존 공개 조회 그대로) 닫혀 있어도 404 대신 `isClosed`·`closedAt`을 실어 보여준다. 익명 조회는 여전히 닫히면 즉시 404(§5.3 존재 은닉 원칙 그대로) — 이 분기에선 `isClosed`가 항상 `false`라 새로 노출한 두 필드가 공개 노출 표면을 넓히지 않는다.
  - 프론트 `ObituaryPage.tsx`("내 부고장 관리")에 빨간 "부고장 종료" 버튼(확인창 포함)을 공유 패널 하단에, 종료 후에는 공유 버튼들 대신 "종료됨" 배너 + 추모관 링크만 보이도록 분기.
  - **빌드**: `npx tsc --noEmit`(backend) 통과 · `npm run build`(backend: `prisma generate && tsc`) 통과 · `npx tsc --noEmit -p .`(frontend) 통과 · `npm run build`(frontend: `tsc && vite build`) 통과. `git status --short eobom/backend/prisma/migrations`로 마이그레이션 미생성 확인.
- **편차**:
  - `07-03` §9 #9는 한 항목에 "종료"·"공유 집계"·"마이페이지 목록" 셋을 같이 적어뒀지만, 개발자 지시가 명시적으로 "종료 기능"으로 좁혀져 있어 **그것만 구현했다.** `shareCount` 컬럼은 이미 스키마에 있으나 증가시키는 코드는 여전히 없고, 부고장 전용 마이페이지 목록 화면도 만들지 않았다 — 기존 `ObituaryPage.tsx`("내 부고장 관리")가 사실상 그 자리를 대신하고 있어 종료 버튼을 거기 붙였다.
  - **§5.3 GET 화이트리스트에 없던 `isClosed`·`closedAt`을 추가**했고, **개설자 본인에 한해 종료된 뒤에도 404를 우회**하도록 `getObituaryBySlug`를 바꿨다. 둘 다 스펙 문서에 문장으로 명시되진 않았지만, §9 #9("마이페이지에 종료 버튼")가 성립하려면 필연적으로 필요한 조치라 판단해 추가했다(버튼을 누르려면 종료된 뒤에도 그 부고장을 볼 수 있어야 한다). 익명 조회 경로·존재 은닉 원칙은 그대로 뒀다.
  - 기존 `findViewableObituaryBySlug` 헬퍼를 지우고 `getObituaryBySlug`에 로직을 인라인했다 — 본인 예외가 붙으면서 "조회 + 필터"를 분리된 순수 함수로 유지하기가 어색해졌기 때문. `isObituaryClosed`만 별도 헬퍼로 남겼다.
- **다음 에이전트가 알아야 할 것**:
  - **되돌리기(재오픈) API가 없다** — 수동 종료도, 발인을 다시 미래로 고쳐서 자동 종료를 피하는 것도 스펙엔 없는 부작용일 뿐 의도한 기능은 아니다(query-time 판정 설계상 자연히 그렇게 되는 것뿐).
  - **공유 집계·마이페이지 목록은 여전히 미구현**이다 — §9 #9의 나머지 조각.
  - ⚠️ **브라우저 실기동 미검증** — 특히 "부고장 종료" 버튼을 실제로 눌러 랜딩(`/o/:slug`)이 익명으로는 404, 개설자 본인 화면에서는 "종료됨" 배너로 계속 보이는지 실기기로 확인 필요.

- **판정**: ✅통과 (07-03 Phase 3 #9 부고장 수동 종료 PATCH 및 KST 기준 발인+3일 자동 종료 쿼리타임 판정 로직 확인 / 종료 후 익명 404 및 본인 예외 조회 분기 확인 / build·tsc 0건 통과 / ⚠️ 브라우저 실기동 미검증)

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

<!-- Gemini 판정 1줄: ✅통과 / ❌반려(사유) / 🔄스펙갱신(고친 문서) -->

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

<!-- Gemini 판정 1줄: ✅통과 / ❌반려(사유) / 🔄스펙갱신(고친 문서) -->

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

<!-- Gemini 판정 1줄: ✅통과 / ❌반려(사유) / 🔄스펙갱신(고친 문서) -->

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

<!-- Gemini 판정 1줄: ✅통과 / ❌반려(사유) / 🔄스펙갱신(고친 문서) -->

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

<!-- Gemini 판정 1줄: ✅통과 / ❌반려(사유) / 🔄스펙갱신(고친 문서) -->

---

## 2026-08-20 (45) | [Opus] 모바일 부고장 카카오톡 전송 구현 기획서(`07-03`) 신규 작성

- **근거 스펙**: `00-13` §4.5 E안(부고장=봉투/추모관=목적지, 배포 링크 1개)·§7.2-2(OG 서버 렌더)·§7.3(신 권고 8항)·§8(미확정 #3·#6·#7·#8) · `00-12` §2.1(`Deceased`) · `05-01` §2.3(개설 게이트)·§4.1(화이트리스트 404) · `05-02` §3.2-1(3분 개설) · `07-01` §2.2·§3.2 · `systems.md` §2·§4·§5. 개발자 지시: *"카카오톡으로 부고장 전송하기 실제 개발에 기획 짜줘. 시스템 구현에 관한 기획."*
- **건드린 파일**: `docs/07_상중_행정_케어/07-03_모바일_부고장_카카오톡_전송_구현_기획서.md`(신규) · `docs/00_DOCS_INDEX.md`(07 섹션 표에 `07-03` 행 1줄 추가, 172~173행 아래) · `docs/작업일지_및_기록/에이전트_기록/walkthrough.md`(이 항목).
- **결과**:
  - **코드는 건드리지 않았다**(기획 단계). 착수 지점을 코드로 실측해 §1.1에 표로 고정: `ObituaryPage.tsx:20-30`이 `alert('💬 [개발중] 카카오톡 부고장 공유 API 연동 기능 개발 중입니다.')` 상태이고, 백엔드 `obituaryController`·`obituaryRoutes` **0건**, `schema.prisma`에 `Obituary`·`Deceased` **없음**(`Memorial`까지만 존재), 프론트 카카오 SDK는 `KakaoMapModal.tsx:64`의 지도 SDK(`dapi.kakao.com/v2/maps/sdk.js`) 하나뿐 — **공유 SDK 미도입** 확인.
  - **§2에서 "카톡 전송"의 정체를 3방식으로 갈라 A(카카오톡 공유 `Kakao.Share`)를 채택하고 B(알림톡/친구톡)를 배제**했다. 배제 근거 3개 중 1개는 신규 논점 — **조문객은 이어봄과 거래관계가 없어 알림톡 "정보성 메시지" 요건 충족이 불확실**하다(⚠️ 표기, §10 #5로 법률 검토 이월).
  - **§3에서 미리보기 카드 경로를 2개로 분리**(①공유 버튼=`Kakao.Share`에 코드로 카드 지정 → **OG 불필요** / ②URL 재전파=**카카오 스크랩이라 OG 필수**). 이 분리로 **Phase 1이 백엔드 배포에 묶이지 않게** 됐다.
  - **§3.3에서 충돌 1건을 발견해 해소**: `feed` 템플릿은 `content.imageUrl`이 필수인데 `00-13` §8-8은 영정 제외 권고 → 🟡 **이어봄 공용 근조 이미지 고정**. 부수 효과로 **이미지 스토리지 전환(`00-11`) 대기 없이 진행 가능**.
  - **§3.4에서 `00-13` §7.2-2의 원 권고(백엔드가 `/o/*` 렌더)를 배포 구조 근거로 수정**: 프론트는 Vercel·백엔드는 Render라 부고 링크가 `onrender.com`으로 나가면 신뢰도가 무너지므로 🟡 **Vercel 서버리스 함수 + `vercel.json` rewrite** 권고.
  - §4 스키마 정본화: `Deceased`(07 필요 최소 범위) + `Obituary` + **`ObituaryMourner` 신설**(부고 관행상 관계별 다수 표기 — `00-13` §6.3 초안에 없던 것) + `Memorial.deceasedId` FK 추가 마이그레이션(⚠️ `pg_dump` 선행 명시). §4.4에 **두 slug 파생 금지**를 코드 주석 수준으로 고정.
  - §5.2에서 개설을 `Deceased`+`Memorial`+`Obituary` **한 트랜잭션**으로 정의하고, ⚠️ **동의 검증을 공용 함수로 추출하지 않으면 `POST /api/memorials`의 게이트를 우회하는 뒷문이 생긴다**는 구현 주의를 명시.
  - §7 폴백 사다리 4단(SDK→Web Share→**링크 복사 상시 노출**→sms) + ⚠️ `sendDefault`는 클릭 핸들러 내 동기 호출이라 **부고장 생성과 공유 버튼을 분리**해야 팝업 차단을 피한다는 제약 기록.
  - **[같은 세션 후속] §2.4 전면 개정** — 개발자 질문(*"대화방이 없는 상대(개인)에게는 내 친구목록에서 선택해서 발송하는 기능 가능한가"*)에 답하며 C안 배제 근거를 교체했다. ①**A안이 띄우는 것은 대화방 목록이 아니라 카카오톡 공유 대상 선택 화면이고 채팅 탭·친구 탭이 함께 있어 그 기능이 이미 포함**돼 있다. ②🔴 **친구 목록 API(`GET /v1/api/talk/friends`)·친구 메시지 발송 API는 "해당 앱에 카카오 로그인한 적 있는 친구"만 대상**이라 **부고 수신자 대부분(비회원)이 목록에 안 뜬다** — 검수를 다 통과해도 **수신자를 이어봄 회원으로 제한하는 열화판**이 된다. 기존 §2.4의 배제 근거(*"검수·비즈앱 요건이 걸려 이점이 없다"*)보다 이쪽이 결정적이라 §2.4-1로 승격. ③§2.4-2에 남는 빈틈(카톡 미사용 조문객·기존 대화방 붙여넣기·나에게 보내기)을 §7 폴백 사다리로 매핑.
  - **[같은 세션 후속] 🔴 확정 필요 #1·#2 개발자 확정 → §3.3 전면 개정 + §10 2건 종결.** ①**조의금 계좌 = 도입 확정.** 개발자 답변이 *"노출 o"* 였으나 **"항상 노출"이 아니라 "기능 도입 + 기본 OFF 유족 토글"로 해석해 진행**(조의금을 사양하는 유족이 실재 + `00-13` §6.3 사기 표적 경고) — **해석을 명시하고 이견 시 정정 요청**함. ②**카드 영정 = 2단계 확정.** *"넣으면 문제가 생기냐"* 는 질문에 **문제를 3층으로 갈라 답**했다: 🔴**스토리지 미전환이 결정적**(`systems.md` §5 — 로컬 디스크라 재배포 시 소실 → **이미 뿌려진 카톡 카드가 일제히 깨짐**) / 🟡**카카오 캐시 잔존**(부고장 닫아도 카드 이미지 회수 불가) / ⚪**법적 리스크는 낮음**(개인정보보호법은 "살아 있는 개인"을 규율하므로 **고인 사진 자체는 법상 개인정보가 아님**). → **1차 근조 이미지 고정 / `00-11` 스토리지 전환 후 `portraitShareEnabled` 토글**(계좌와 동일 패턴, 기본 OFF, 켤 때 *"카카오 서버에 남으며 회수 불가"* 고지). **`00-13` §8-8을 "영정 제외"에서 "조건부 허용"으로 재해석해 해소** — `00-13` 손볼 때 반영 필요. §4.2 스키마에 `portraitShareEnabled` 추가, §8 #3-1 신설, §9에 **Phase 3+ (스토리지 전환 이후)** 블록 신설.
  - **[같은 세션 후속] 개발자가 부고장 양식 확정 → §6.2 재작성(§6.2-1~-3 신설) + §10 #3 종결.** 지정 항목은 **고인 성함 / 상주 성함 / 빈소 위치 / 마음전하실곳(토글) / 연락처** 5개이고 *"추가할 것이 있으면 알아서 판단"* 을 위임받았다. ①🟡 **발인 일시 추가를 권고** — 빈소만 있고 발인이 없으면 조문객이 *"언제까지 가면 되는지"* 를 모르고, **카톡 링크는 며칠씩 떠돌아 이미 끝난 장례식에 찾아가는 사람이 생긴다.** 부수적으로 **부고장 수명(§10 #4)을 판단할 유일한 기준**이다. 별세 일시도 함께 권고(부고 첫 문장 관행 + 랜딩 `故 ○○○ (~2026.08.20)` 표기, `Deceased.deathDate` 기존 필드). ②**호실·입관·장지·유족 추가는 스키마 유지 + 화면에서만 접음**(지우면 나중에 마이그레이션 필요). ③**"토글 혹은 체크?" → 토글로 확정하되 근거를 바꿈** — 토글의 진짜 기능은 켜고 끄기가 아니라 **경고를 띄울 자리를 만드는 것**이다(입력=노출 방식엔 붙일 자리가 없음). 그래서 **연락처는 입력=노출(별도 토글 없음) / 계좌는 명시적 토글 + 켤 때 재전파 경고**로 갈랐다. ④🔴 **§6.2-3에 "보안 연극" 경고 명시** — `tel:` 버튼으로 감싸도 **번호는 페이지 소스에 그대로 남으므로 보호가 아니다.** 실효 완화는 **부고장 종료 시 함께 404** 하나뿐이라 Phase 3 #9(종료 버튼)의 중요도를 올렸다. ⑤§4.2에 `contactPhone` 추가하되 **암호화하지 않음**(입력=공개가 전제라 DB값과 공개값이 항상 같다 — 계좌는 기본 OFF라 꺼진 값이 DB에 쌓이므로 암호화가 막는 위협이 실재하지만 연락처는 없다). ⑥§5.3 화이트리스트에서 *"❌ 상주 연락처"* → **포함**으로 뒤집고, `portraitUrl`을 조건부 항목으로 추가.
  - **[같은 세션 후속] 발인 일시 승인 → 필수 4개 확정 + §6.2-4 신설 + §10 #4 권고 변경.** 개발자 답변 *"발인 일시 넣자..!"*. ①§6.2 필수를 3개→**4개**(고인 성함·상주 성함·빈소 위치·발인 일시), §4.2 `funeralAt`을 **`DateTime?` → `DateTime`(non-null)**, §5.2 개설 검증에 필수 4개 체크 추가. **별세 일시는 승인 대상이 아니었으므로 선택(접어둠)으로 내림** — 없어도 `故 ○○○`로 성립. ②🔵 **§6.2-4 신설 — 발인이 필수가 되면서 §10 #4 권고가 "수동 종료만" → "발인 + N일 자동 종료 + 수동 조기 종료"로 바뀜.** 근거: §6.2-3이 *"연락처·계좌 노출의 실효 완화는 종료 하나뿐"* 이라 했는데 **수동만 두면 유족이 잊었을 때 연락처·계좌가 실린 페이지가 무기한 살아남는다.** 이전엔 발인이 선택이라 자동 계산이 불가능했다. ⚠️ **`00-13` §4.3의 phase 전환 트리거 문제를 다시 여는 것이 아님을 명시** — 거기서 문제였던 건 한 레코드가 성격을 바꾸는 사건이고 E안은 레코드를 둘로 나눠 그걸 없앴다(§4.5-2). 여기 것은 **부고장 레코드 하나의 만료**일 뿐이고 추모관은 계속 산다. ③§9 Phase 3 #9에 자동 종료를 **배치가 아니라 조회 시점 판정**(`findViewableMemorialBySlug` 패턴에 `funeralAt + N < now()` 추가)으로 못박음 — **스케줄러를 새로 들이지 않는다.** **남은 결정은 N값 하나**(§10 #4).
  - **[같은 세션 후속] N=3일 확정 + "노출" 정의 질문 → §5.4·§5.4-1 신설.** ①**N = 3일 확정** — `발인일 + 3일 자정` 자동 종료. §6.2-4·§9 #9·§10 #4 반영, **§10 #4 종결**. ②개발자 질문(*"노출이라는 게 사용자가 웹에 접속했을 때, 한번 입력하고 남아있는 걸 의미하나"*)에 답해 **§5.4 신설** — 화면이 둘(**입력=`/obituary` 유족만 / 노출=`/o/{slug}` 조문객**)이고 "노출"은 항상 후자를 가리킨다. 입력값은 **서버 DB `Obituary` 레코드**에 저장되므로 기기를 바꿔도 남고 마이페이지에서 수정 가능하며, **slug가 그대로라 수정이 조문객 페이지에 즉시 반영**된다. ③🔴 **그 질문이 미처 못 본 결함 하나를 드러냈다 — §5.4-1 신설**: **이미 뿌려진 카톡 카드는 공유 시점 스냅샷이라 바뀌지 않는다.** 빈소를 고쳐도 단톡방 카드엔 옛 빈소가 남고, **카드만 보고 안 누른 사람은 틀린 곳으로 간다.** 하필 §3.2가 카드 설명란에 넣기로 한 **빈소·발인이 가장 자주 바뀌는 정보**다. 카드에서 빼는 안은 **§3에서 카드를 중요하게 다룬 이유가 사라져** 기각하고, 🟡 **갱신 안내로 해결**: (a)수정 시 *"이미 보낸 카드에는 반영되지 않습니다. 다시 공유해 주세요"* + 그 자리에 공유 버튼, (b)랜딩 상단 **최종 수정 시각** 표시. §9 Phase 1 #3에 반영. ⚠️ **§3.4의 카카오 스크랩 캐시와는 다른 문제**임을 명시(스크랩 캐시는 *URL 붙여넣기로 생긴 카드*, 이건 *공유 버튼으로 이미 전송된 메시지* — **캐시 초기화로 해결 안 됨**).
  - **[같은 세션 후속] §5.4-1 대응안 확정 → §5.4-2 신설(책임 경계 + 트리거 필드 목록).** 개발자 지시: *"링크의 경우에는 자동 수정 good. 카톡 메시지 같은 경우에는 수정 사항 발생 시 이용자가 다시 보내든지 하는 방식으로 알아서 해야 함."* ①**경계 확정 — 페이지=시스템 자동 / 이미 보낸 카드=유족이 재공유.** 이건 선택이 아니라 **구조적 강제**임을 명시했다(이어봄이 정정 메시지를 대신 보내려면 B안이어야 하는데, A안에서 **이미 나간 메시지는 유족의 카톡 안에 있다**). 다만 **"알려주는 데까지"는 시스템 의무** — 유족이 수정 사실을 모르면 조치할 수 없다. ②🔴 **안내 트리거 필드 목록을 표로 못박음**(구현자 판단 금지): **띄움 = 고인 성함(`title`)·빈소·호실·발인(`description`)** / **안 띄움 = 연락처·계좌·입관·장지·유족 추가·별세 일시.** 근거: *"연락처만 고쳤는데 '다시 공유하세요'가 뜨면 유족은 뭐가 잘못됐나 싶어 불필요하게 또 뿌린다."* ③§4.2에 **`cardFieldsUpdatedAt DateTime?` 신설** — ⚠️ **`updatedAt`으로 대체 불가**(연락처만 고쳐도 바뀌므로 안내가 오작동). ④🟡 **재공유 카드 `·변경` 표기 제안**(`[부고·변경] 故 ○○○ 님`) — 재공유하면 단톡방에 카드가 2장 쌓이는데 바쁜 방에서는 어느 게 최신인지 헷갈린다. **카드 제목 생성 함수 조건문 1개**이고 §3.2·§6.2 미리보기와 포맷터를 공유하므로 세 곳이 자동 일치. **개발자 승인 대기 상태**(제안으로 올렸고 "불필요하면 뺀다"고 밝힘).
  - **[같은 세션 후속 · Sonnet 1차 구현물 점검 후] §3.3-2·3.3-3·3.3-4 신설 + 계좌 Phase 3→1 이동 + Phase 0 상태 갱신.** ①🔴 **카드 이미지에 `eobom-logo-hd.png`가 물려 있는 것을 발견**(`config.ts:56`) — Phase 0 ⓒ 미완 탓이나 **임시 대체물로 로고를 고른 것 자체가 문제**다. 부고 카드는 랜딩보다 넓게 퍼지므로 `00-13` §7.2-2(*"조의 화면에 서비스 메뉴가 붙으면 광고로 읽힌다"*)가 더 세게 적용되고, **유족이 상업 서비스를 홍보하는 것처럼 보인다.** → **§3.3-2 신설**(역할 3가지 + 규격: 가로 2:1·중립 그래픽·**브랜드 요소 일체 금지**·`public/` 배치, 근조 이미지 확보 전 **실사용 금지**). ②🔴 **§3.3-3 신설 — `OBITUARY_CARD_IMAGE_URL`이 `window.location.origin` 기반이라 로컬에서 카드 이미지가 안 뜬다.** 카드 생성 시 **카카오 서버가 imageUrl을 직접 가져가므로** `localhost`·사설IP는 불가. **고정 공개 URL(Vercel)로 교체**할 것. 도메인 등록과는 별개 문제(*"SDK를 쓸 수 있는가"* vs *"카카오가 파일에 닿는가"*). **프론트는 이미 배포돼 있어 ⓓ(백엔드 배포)를 안 기다려도 된다.** ③**§3.3-4 신설** — 작성 폼 미리보기와 실제 발송이 **같은 상수 하나**를 보므로 *"미리보기에 로고가 보인다 = 실제로도 로고가 나간다"*. ④🔴 **내 스펙 결함 정정 — 조의금 계좌 토글을 Phase 3 #10 → Phase 1 #6으로 이동.** §6.2가 개발자 지정 5개 항목에 넣어뒀는데 §9만 Phase 3에 둬서 **그대로 두면 1차 오픈에 계좌 없이 나갔다.** 구현은 내 문서를 정확히 따른 것이라 Sonnet 잘못이 아니다. 스키마·백엔드·랜딩은 이미 완료, **작성 폼 토글+암호화 연결만 남음.** ⑤**§6.2-3에 "연락처·계좌는 카드에 넣지 않는다" 원칙 추가** — 카드에 박으면 *"종료 시 404"* 완화가 무력화된다(**단톡방 카드의 번호는 회수 불가**). *"카드는 문 앞까지, 민감 정보는 문 안에서."* ⑥**Phase 0 표를 상태 표로 교체** — ⓐ✅완료(JS SDK 도메인 3건: `eobom.vercel.app`·`localhost:5173`·`192.168.0.111:5173`) / ⓑ🟡키 보유(**지도와 공유는 같은 JS 키** — `.env`에 같은 값으로 **한 줄 추가**, 개명은 `KakaoMapModal.tsx:57` 동반수정이라 금지) / ⓒ🔴미완 / ⓓ🔴미완. `.harness/systems.md` §2도 함께 갱신(구 *"localhost:5173 포트 고정"* 제약 해소 + 카드 이미지 사설IP 불가 경고).
  - **[같은 세션 후속] §9 Phase 1 완료 판정을 1개 → 4개로 확장** — ⚠️ 공유창 **친구 탭에서 대화방 없는 개인 선택 시 카드 도달**(카카오톡 앱 UI라 버전 의존이므로 문서로 단정하지 않고 실기기 검증으로 넘김) · SDK 강제 실패 시 링크 복사 폴백 동작 추가.
  - §9 Phase 0~3(Phase 0은 전부 사용자 작업이자 차단 요소 — Vercel 도메인 등록·JS 키·근조 이미지·백엔드 배포), §10 🔴 확정 필요 6건(#3 상주 연락처 노출·#4 부고장 수명은 **신규**, #1·#2·#6은 `00-13` §8 미확정 승계).
  - **빌드/테스트 없음** — 코드 변경이 0건이다.
- **편차**: ①`00-13` §7.2-2가 *"백엔드가 `/o/*`·`/m/*` 두 경로만 렌더하는 것이 가장 싸다"* 고 한 것을 **Vercel 서버리스 권고로 바꿨다**(§3.4) — 그 문장이 쓰인 08-14 시점엔 프론트/백엔드 배포처가 갈린 상태(`systems.md` §5)가 판단에 반영되지 않았다. ②`00-13` §6.3의 `Obituary` 스키마 초안에 `ObituaryMourner`·`funeralHallAddr`·`facilityId`·`accountEnabled`·`resharedNoticeAckAt`·`shareCount`를 **추가**했다(초안은 "07 기획서로 옮길 때 정본화"라고 명시돼 있어 범위 내). ③`00-13` §4.5-3이 요구한 `Deceased` 전면 도입 대신 **07이 필요한 최소 범위만** 정의했다(`DeathVerification`·`BereavedRelation`·`PreDeathDirective` 제외) — `00-12`가 아직 미확정이라 전면 도입은 이 문서 권한 밖이다.
- **다음 에이전트가 알아야 할 것**:
  - ✅ **§10 #1·#2·#3이 2026-08-20 전부 확정됨**(위 후속 참고). **남은 것은 #4(부고장 수명·Phase 3)·#5(알림톡 법률검토·별도 트랙)·#6(조문 로그인·Phase 2)뿐이며 Phase 1을 막는 것은 없다** → **Phase 0(외부 설정)만 끝나면 [Sonnet] 착수 가능.**
  - ✅ **발인 일시는 2026-08-20 승인됨** — 필수 4개 확정. **별세 일시는 미승인이라 선택(접어둠)** 상태이니 임의로 필수화하지 말 것.
  - ✅ **§10 #4 종결 — N = 3일**(`발인일 + 3일 자정`). **§10에서 🔴로 남은 것은 #5(알림톡 법률검토·별도 트랙)·#6(조문 로그인·Phase 2)뿐이다.**
  - 🔴 **§5.4-1(카톡 카드 스냅샷)은 구현 시 잊기 쉬운 항목이다** — 수정 화면에 "다시 공유" 유도가 없으면 **유족은 고쳤다고 믿는데 조문객은 옛 정보를 본다.** Phase 1 #3에 넣어뒀다. **트리거 필드는 §5.4-2 표 그대로 쓰고 임의로 넓히지 말 것**(넓히면 유족이 불필요하게 재공유한다).
  - ✅ **§5.4-2의 `·변경` 표기는 2026-08-20 승인됨** — `cardFieldsUpdatedAt != null`이면 카드 `title`에 `·변경`을 붙인다. 카드 제목 생성은 **§3.2(카톡 카드)·§6.2(작성 폼 미리보기)와 반드시 같은 포맷터**를 쓸 것 — 갈라놓으면 세 곳이 어긋난다.
  - 🔴 **`00-13` §8-7·§8-8이 이 문서의 확정으로 해소됐다 — `00-13` 표에 아직 반영 안 됨.** 특히 §8-8은 *"성명까지, 영정 제외"* 로 남아 있는데 실제 결론은 **"조건부 허용(스토리지 전환 후 유족 토글)"** 이다. [Opus] 재정합 필요.
  - 🔴 **`portraitShareEnabled`는 `00-11` 스토리지 전환 전까지 화면에 노출조차 하지 말 것.** 켜면 재배포 시 이미 배포된 카톡 카드가 전부 깨진다.
  - 🔴 **선행 차단 2개**: `Deceased` 미도입 · 백엔드 미배포(`systems.md` §5). 후자는 Phase 2·3 전체를 막는다.
  - ⚠️ **실측 미검증 2건**: `noindex`와 카카오 스크랩이 양립하는지(§3.4) · `feed` 템플릿 `imageUrl` 필수 여부. 둘 다 문서가 아니라 실기기로 확인해야 하며 Phase 2 판정 기준에 넣어뒀다.
  - `07-01` §2.3·§8 #1은 *"부고장은 07에 남는다"* 까지만 반영돼 있고 **구현 기획이 생겼다는 사실은 아직 안 적혀 있다** — 다음 `07-01` 손볼 때 `07-03` 링크 추가할 것.
  - `reports/` HTML 보고서 미작성(인덱스에 *(미작성)* 표기) → `[Gemini]` 요청 대상.

- **판정**: ✅통과 (07-03 모바일 부고장 카카오톡 전송 구현 기획서 신설 완료, Kakao.Share 및 Vercel OG 셸 설계 타당성 확인, Obituary/ObituaryMourner 스키마 및 카드 스냅샷 책임 경계 정립 확인, 00_DOCS_INDEX 및 07-03 HTML 보고서 생성 완료)

---

## 2026-08-19 (44) | [Sonnet] 03 무심사 확정 후속(문구 수정) + 375px 헤더 오버플로 재발 수정

- **근거 스펙**: `docs/03_현물수거/03-02` §6.1·§8 #10(03은 무심사 — "추천·검증·엄선" 등 신뢰 함의 문구 금지) · `00-26` §6 #9(375px 헤더 오버플로, walkthrough (34)·(36)·(43) 3회 이월).
- **건드린 파일**: `eobom/frontend/src/pages/PickupPage.tsx`(38행) · `eobom/frontend/src/components/Header.tsx`(모드 드롭다운 트리거 버튼·래퍼 div에 `className="header-mode-trigger"`/`"header-mode-wrap"` 추가) · `eobom/frontend/src/index.css`(`@media (max-width:480px)` 블록에 `.header-mode-wrap{margin-left:0.3rem}`·`.header-mode-trigger{padding:0.4rem 0.5rem;gap:0}` 신설).
- **결과**:
  - 문구: `"지역 기반 현물 유품 정리 전문 업체 추천"` → `"지역 기반 현물 유품 정리 전문 업체 연결"`(원문 그대로 치환, 이 1건만). `Grep "추천"` 전체 `eobom/frontend/src` 결과 `SocialLinkModal.tsx`(무관한 로그인 병합 옵션) 1건만 남음 — `PickupPage.tsx`·`domainSlides.tsx` 등 03 관련 파일 0건 확인. `domainSlides.tsx:78`의 02(전문가상담) `"분야별 검증된 변호사·세무사"`는 **의도적으로 손대지 않음**(지시사항 그대로 — 02는 실제 승인 심사 SCR-010 존재).
  - 헤더 오버플로: (43)에서 모드 드롭다운을 로고 옆에 `flexShrink:0`으로 고정 배치하면서 375px에서 다시 넘치던 것을, 모바일 미디어쿼리에서 트리거 버튼 좌우 패딩(`0.75rem`→`0.5rem`)·아이콘-라벨 간격(`0.35rem`→`0`, 라벨은 기존 `.header-mode-chip-label`로 이미 숨김)·좌측 여백(`0.6rem`→`0.3rem`)을 압축해 쉐브론 아이콘만 남도록 수정.
  - `npx tsc --noEmit`(frontend) 에러 0.
  - 🔴 **브라우저 실기동 미검증** — `netstat`으로 확인 결과 5173 포트에 `node.exe`(PID 40148)가 LISTENING 상태였으나 `curl http://localhost:5173/`이 "Empty reply from server"로 응답 없음(walkthrough (37) 편차⑤가 기록한 것과 동일한 좀비 vite 프로세스 패턴으로 추정). 사용자가 직접 `npm run dev`를 재기동해 375px에서 헤더 겹침·넘침 여부 확인 필요 — 하네스 규칙상 dev 서버를 직접 기동하지 않음.
- **편차**: 없음(둘 다 명시적 지시 범위 내 구현).
- **다음 에이전트가 알아야 할 것**: 375px 실측 검증이 안 됐다 — 사용자 확인 전까지 §6 #9를 "해소 완료"로 닫지 말 것. 검증 시 `header.scrollWidth === header.clientWidth`(walkthrough (36) 방식)로 재현 가능.

- **판정**: ✅통과 (03 무심사 원칙에 따른 "추천" 문구 정정 및 모바일 미디어쿼리 헤더 모드 트리거 여백 압축 코드 반영 확인 / tsc 0건 통과 / ⚠️ 단, 375px 화면 실기동 렌더링은 미검증 상태이므로 브라우저 실측 확인 필요)

---

## 2026-08-19 (43) | [Sonnet] 헤더 모드 드롭다운 재구현(로고 옆, 3항목 즉시 전환) + 생전준비에서 디지털 정산 제거

- **근거 스펙**: 스펙 문서 없음 — 개발자 채팅 즉석 지시(walkthrough (38)~(42)와 같은 연속 세션). 대조 정본: `00-26` §4.4(모드 칩 — 중앙 배치·클릭 시 홈 이동만, 이번 건으로 편차) · §3.1(생전 준비 도메인 표, 이번 건으로 편차).
- **건드린 파일**: `eobom/frontend/src/components/Header.tsx`(전면 재작성 — `useState`/`useRef`/`useEffect` 기반 드롭다운 신설, 로고 바로 오른쪽 배치, 바깥클릭·Esc로 닫힘) · `eobom/frontend/src/App.tsx`(`<Header>`에 `onSetMode={handleSetNavMode}` prop 추가, `navMode={isHomeRoute ? null : navMode}` → `navMode={navMode}`로 변경해 홈에서도 드롭다운 노출) · `eobom/frontend/src/modeNav.ts`(`PREP_MENU`에서 `{ id: 'digital-estate', ... }` 항목 삭제, `MODE_LABELS.bereaved`를 `'유가족'` → `'임종 및 사후 정리'`로 변경) · `eobom/frontend/src/components/home/EntryBoxes.tsx`(`box1Keys` 배열에서 `'digital-estate'` 제거, `['counseling', 'ending-note', 'digital-estate']` → `['counseling', 'ending-note']`).
- **결과**: `npx tsc --noEmit`(frontend) 에러 0. 드롭다운 항목 3개(생전 준비/임종 및 사후 정리/게스트) 클릭 시 `onSetMode` 호출 후 해당 모드 `MODE_MENUS[mode]`에서 `status==='active'`인 첫 항목의 `id`로 `setActiveTab` 이동(생전 준비→`counseling`, 임종 및 사후 정리→`care-guide`), 게스트는 실제 화면이 없어 `home`으로 이동. 라벨에서 "모드" 글자 제거(`{MODE_LABELS[navMode]} 모드` → `{modeMenuLabel}`, `modeMenuLabel = navMode ? MODE_LABELS[navMode] : '메뉴'`). `PREP_MENU`는 이제 `ending-note`·`counseling` 2개.
- **편차**: ①`00-26` §4.4가 정의한 "클릭 시 홈으로 보내 4박스에서 다시 고르게 하는 칩" 설계를 폐기하고 실제 드롭다운(3항목 즉시 전환)으로 교체 — 개발자 직접 지시. ②모드 칩을 홈에서 숨기던 처리(`isHomeRoute ? null : navMode`, walkthrough (36) 편차③)를 되돌려 홈에서도 항상 노출되게 함 — 드롭다운이 이제 "지금 모드 표시"가 아니라 "어디서든 즉시 모드 전환"이 목적이라 홈에서 숨길 이유가 없어짐. ③`00-26` §3.1 "생전 준비 3개(02·04·06)"이 2개(04·06만)로 줄어듦 — 개발자 직접 지시("디지털 정산은 생전 준비에 불필요"). ④`MODE_LABELS.bereaved` 라벨 변경은 `00-02` §3.2 라벨 정본과 대조 안 함(대조 결과는 [Opus] 확인 필요).
- **다음 에이전트가 알아야 할 것**: `00-26` §4.4·§3.1, `00-02` §3.2(유가족 라벨)가 이번 편차 4건과 어긋난다 — [Opus] 재정합 필요. 게스트 드롭다운 항목은 아직 실제 목적지가 없어 홈으로만 보낸다(박스③ Guest 자체가 `comingSoon` 비활성 고정 상태, walkthrough (36) 참고) — Guest 실제 기능이 생기면 `Header.tsx`의 `handleSelectMode`도 같이 고칠 것.

- **판정**: 🔄스펙갱신(docs/00-26 §3.1·§4.4 및 docs/00-02 §3.2 모드 드롭다운 전환·생전메뉴 2개 축소·라벨 변경 재정합 필요)

---

## 2026-08-19 (42) | [Sonnet] 페이지 상단 배지 "아이콘이름 & 아이콘이름 |" 프리픽스 전체 제거

- **근거 스펙**: 스펙 문서 없음 — 개발자 직접 지시("불필요한 내용"). 도메인 5개 전수 적용 지시.
- **건드린 파일**: `eobom/frontend/src/pages/CareGuidePage.tsx`, `eobom/frontend/src/pages/CounselingPage.tsx`, `eobom/frontend/src/pages/DigitalEstatePage.tsx`, `eobom/frontend/src/pages/EndingNotePage.tsx`, `eobom/frontend/src/pages/FacilityPage.tsx`.
- **결과**: 상단 뱃지 문구에서 아이콘을 말로 설명하는 접두어를 제거했다(원문 그대로) — `"체크리스트 & 쉴드 | 사망 직후 D-Day 필수 행정절차"` → `"사망 직후 D-Day 필수 행정절차"`, `"손 & 저울 | 상속세 시뮬레이터 & 변호사 · 세무사 1:1 케어"` → `"상속세 시뮬레이터 & 변호사 · 세무사 1:1 케어"`, `"스마트폰 & 하트 | SNS / 클라우드 계정 정산"` → `"SNS / 클라우드 계정 정산"`, `"노트 & 열쇠 | 유족에게 남기는 메시지 작성 & 256-bit AES 암호화 금고"` → `"유족에게 남기는 메시지 작성 & 256-bit AES 암호화 금고"`, `"집 & 나뭇잎 | 봉안당·수목장 맞춤 검색 및 장례식장 맞춤 매칭"` → `"봉안당·수목장 맞춤 검색 및 장례식장 맞춤 매칭"`. `Grep "&amp;.{1,10}\|"` 전체 소스 0건 확인. `npx tsc --noEmit` 에러 0.
- **편차**: 없음.
- **다음 에이전트가 알아야 할 것**: 없음.

- **판정**: ✅통과 (5대 도메인 페이지 상단 배지 프리픽스 텍스트 전수 제거 확인 / tsc 0건 통과)

---

## 2026-08-19 (41) | [Sonnet] CareGuidePage 체크리스트 UX 개선 — 부고장 잔재 제거 + CSS 다단(columns) 레이아웃

- **근거 스펙**: `docs/07_상중_행정_케어/07-02_사망후_법정기한_체크리스트_명세서.md`(항목·순위 정본, 레이아웃은 스펙 없음 — 개발자 즉석 지시 3회 반복 조정: grid 2열 → grid auto-fill 카테고리 헤더 풀스팬 → grid 칸반 컬럼 → 최종 CSS 다단).
- **건드린 파일**: `eobom/frontend/src/pages/CareGuidePage.tsx`(전면 재작성 — `MessageSquare` import·부고장 카드 마크업 완전 삭제, 2열 그리드 래퍼 제거해 체크리스트 전체 폭 사용, `SEVERITY_ORDER.map` 내부를 `category`별로 그룹핑(`byCategory: Map<string, CareGuideTask[]>`)해 `className="care-guide-columns"`/`className="care-guide-category"`로 렌더) · `eobom/frontend/src/index.css`(`.care-guide-columns{ columns: 300px 3; column-gap: 1rem }`, `.care-guide-category{ break-inside: avoid; margin: 0 0 1rem }` 신설).
- **결과**: `npx tsc --noEmit` 에러 0. 카테고리(신고·조회/장례 단계/상속 승인·포기/세금/명의·자산/연금·보험/조건부) 블록이 CSS 다단 레이아웃으로 브라우저가 자동으로 단 높이를 맞춰 배치 — 항목 수가 적은 카테고리(1~2건)와 많은 카테고리(3~4건)가 섞여도 특정 단 아래 빈 공간이 크게 남지 않음(사용자 확인: "잘 작동됨"). 화면 폭에 따라 1~3단 자동 반응형(`columns: 300px 3` 숏핸드).
- **편차**: 없음 — 사용자가 명시적으로 순차 요청한 3단계 개선(2단 그리드 → 카테고리 풀스팬 지적 → 칸반 컬럼 지적 → 다단 여백 지적 → 최종 CSS columns)의 마지막 단계.
- **다음 에이전트가 알아야 할 것**: `.care-guide-category`가 multicol 컨테이너의 **직계 자식**이며 `display:flex`를 주지 않은 순수 block이다 — Chromium이 `display:flex` 직계 자식에서 `break-inside:avoid`를 무시하는 버그가 있어 의도적으로 그렇게 만들었다(카드 목록용 `flex` 래퍼는 그 안쪽 한 단계 더 깊이 있음). 이 구조를 건드릴 때 직계 자식에 `display:flex`를 다시 주지 말 것.

- **판정**: ✅통과 (CareGuidePage.tsx 부고장 분리에 따른 잔재 제거 확인 / CSS columns 기반 반응형 다단 레이아웃 및 Chromium 렌더링 방어 구조 확인 / tsc 0건 통과)

---

## 2026-08-19 (40) | [Sonnet] 4박스 오버레이 — 브라우저 뒤로가기 시 같은 박스·슬라이드로 복원

- **근거 스펙**: 스펙 문서 없음 — 개발자 직접 지시("오버레이에서 이동하기 클릭 후 페이지 넘어감. 뒤로가기 눌렀을 때 보던 오버레이로 그대로 돌아오게 할 수 없는가").
- **건드린 파일**: `eobom/frontend/src/components/home/EntryBoxes.tsx`(로컬 `useState<'box1'|'box2'|null>` 제거, `react-router-dom`의 `useSearchParams`로 대체 — `openBox`/`rawSlideIndex`를 URL 쿼리(`?entry=box1&slide=N`)에서 파생, `handleBox1Click`/`handleBox2Click`/`closeOverlay`/`handleSlideChange` 전부 `setSearchParams(..., { replace: true })`로 구현) · `eobom/frontend/src/components/home/BoxDetailOverlay.tsx`(`onSlideChange?: (index:number)=>void` prop 추가해 `handleWheel`·`goTo`에서 호출, CTA 버튼 `onClick`에서 `slide.tab`이 있으면 더 이상 `onClose()`를 호출하지 않도록 변경 — 다른 화면으로 이동할 때만 해당).
- **결과**: `npx tsc --noEmit` 에러 0. 사용자 확인("잘 작동 됨") — 박스 열기/슬라이드 이동은 `replace`라 히스토리를 늘리지 않고, CTA로 다른 라우트로 이동(`push`)할 때 직전 URL(`?entry=box1&slide=N`)이 히스토리에 그대로 남아 브라우저 뒤로가기 시 같은 박스·슬라이드로 오버레이가 재오픈됨.
- **편차**: 없음 — 순수 프론트 UX 개선, 스펙 문서 대상 아님.
- **다음 에이전트가 알아야 할 것**: 없음.

- **판정**: ✅통과 (react-router-dom useSearchParams 기반 ?entry=boxN&slide=N 쿼리 파생 및 브라우저 뒤로가기 시 오버레이 상태 복원 정상 동작 확인 / tsc 0건 통과)

---

## 2026-08-19 (39) | [Sonnet] 임종·사후정리 도메인 재구성 — 모바일 부고장 분리 + 유품수거·디지털추모관 실체화 + 메뉴 순서 확정

- **근거 스펙**: 스펙 문서 없음 — 개발자 직접 지시(메뉴 순서: 상중케어·장사시설·전문가상담·모바일부고장·유품수거·디지털정산·디지털추모관 확정 + "디지털 유품~ 서비스 현재 3개로 나누어진 거 분리").
- **건드린 파일**:
  - 신규: `eobom/frontend/src/pages/ObituaryPage.tsx`, `eobom/frontend/src/pages/PickupPage.tsx`, `eobom/frontend/src/pages/MemorialPage.tsx`
  - 재작성: `eobom/frontend/src/pages/CareGuidePage.tsx`(모바일 부고장 폼 전체 삭제, "작성하러 가기" 버튼만 남김), `eobom/frontend/src/pages/DigitalEstatePage.tsx`(3서브탭[digital/physical/memorial] 중 `digital`만 남김, `activeSubTab` state 및 서브탭 UI 전체 삭제)
  - 수정: `eobom/frontend/src/App.tsx`(`/obituary`·`/pickup`·`/memorial` 라우트 3개 추가) · `eobom/frontend/src/components/home/domainSlides.tsx`(`obituary` 신규 슬라이드 추가, `pickup`·`memorial`을 `status:'comingSoon'`→`'preview'`로 변경 + `tab` 필드 추가, `digital-estate.badgeLabel`을 `'디지털 자산 · 계정 정산'`→`'디지털 정산'`으로 변경) · `eobom/frontend/src/components/home/EntryBoxes.tsx`(`box2Keys`를 `['care-guide','facility','counseling','obituary','pickup','digital-estate','memorial']` 순서로 확정, `chipLabels`에 `obituary` 추가·`digital-estate` 라벨 정정) · `eobom/frontend/src/modeNav.ts`(`BEREAVED_MENU`에 `obituary` 추가 + 같은 순서로 재배열, `pickup`·`memorial`을 `comingSoon`→`preview`로 변경) · `eobom/frontend/src/components/Sidebar.tsx`(`defaultMenuItems`의 digital-estate 라벨 정정) · `eobom/frontend/src/pages/CareGuidePage.tsx`(`LINK_LABEL['digital-estate']`를 `'디지털 자산 정리로 →'`→`'디지털 정산으로 →'`로 변경).
- **결과**: `npx tsc --noEmit` 에러 0. `PickupPage`(`/pickup`)는 지역 업체 예시 데이터 + "예시" 배지, `MemorialPage`(`/memorial`)는 헌화·방명록·사진 앨범 데모 — 둘 다 기존 `DigitalEstatePage`의 서브탭 코드를 그대로 옮긴 것(신규 기능 아님, 노출 위치만 바뀜). `DigitalEstatePage`(`/digital-estate`)는 이제 계정 정산 신청 하나만 남음. 4박스 오버레이·사이드바 모두 새 순서 반영 확인.
- **편차**: 🔴 **`00-26` §7.1 "새 화면 ID는 만들지 않는다" 정면 위반** — `obituary`·`pickup`·`memorial` 3개 신규 라우트/페이지 컴포넌트 신설. `pickup`·`memorial`은 원래 `domainSlides.tsx`에 `status:'comingSoon'`으로만 존재했지 실제 화면이 없었는데(00-23 §3 실측 당시엔 진짜 없었음), `DigitalEstatePage`의 서브탭에는 예시 데이터로 이미 구현돼 있었다는 걸 이번에 발견해 `preview`로 정정·분리했다 — **`00-23`·`00-26`이 근거로 삼은 "실체 없음" 전제 자체가 이번 발견으로 틀렸다는 뜻**. 🔴 `00-26` §3.2 유가족 메뉴가 6개→7개로 늘고 순서도 재배열됨.
- **다음 에이전트가 알아야 할 것**: [Opus] `00-23`(§3 실측표) 및 `00-26`(§3.2·§7.1)이 이번 발견·변경과 정면으로 어긋난다 — pickup/memorial이 "실체 없음"이 아니라 "예시 데이터로 이미 구현돼 있었고 이번에 정식 노출로 전환됨"으로 재정합 필요. 세 페이지 모두 실제 제휴 업체/추모관 데이터는 없다는 사실은 각 페이지 상단 배너로 계속 고지 중(00-14 §2.2 원칙 유지).

- **판정**: 🔄스펙갱신(docs/00-26 §3.2·§7.1 및 docs/00-23 §3 도메인 분리·화면 신설·7개 메뉴 순서 재정합 필요)

---

## 2026-08-19 (38) | [Sonnet] 로그인 게이트 정합화 — 박스①②·사이드바 loginRequired 불일치 3건 수정

- **근거 스펙**: `00-26` §4.2-1(①④만 로그인, ②③ 없음 — 이번 건으로 편차) · §7.3(②유가족·③Guest 진입에 로그인 금지, 07 열람은 어느 경로로도 로그인 없이 가능해야 함 — care-guide만 예외로 유지). 사용자 실사용 중 발견("생전 준비 > 전문가 상담 이동하기 > 로그인창 없이 들어가짐").
- **건드린 파일**: `eobom/frontend/src/components/home/domainSlides.tsx`(`counseling`·`facility`에 `loginRequired: true` 추가[박스① CTA 버그 수정] — `care-guide`는 예외로 `loginRequired` 없음 유지) · `eobom/frontend/src/modeNav.ts`(`PREP_MENU`의 `digital-estate`·`counseling`, `BEREAVED_MENU`의 `facility`·`counseling`·`digital-estate`에 `loginRequired: true` 추가 — 기존엔 오버레이 CTA만 게이트가 걸리고 사이드바 클릭은 그냥 통과되던 불일치).
- **결과**: `npx tsc --noEmit` 에러 0. 재현: `BoxDetailOverlay.tsx`의 CTA `onClick`이 `slide.loginRequired && !currentUser`일 때 `onOpenLogin?.()`만 호출하고 라우트 이동 안 함(기존엔 `counseling`에 이 필드가 없어 `!currentUser`여도 통과됐음) — `Sidebar.tsx`의 `handleModeItemClick`도 동일 조건으로 동작하도록 동기화.
- **편차**: `00-26` §4.2-1 "②는 로그인 없음"을 뒤집어 facility·counseling·digital-estate·obituary·pickup·memorial 전부 로그인 필수로 전환(개발자 직접 지시, "모든 버튼이 다 그렇게 작동해야 하니") — **`care-guide`(07 열람)만 §7.3·07-02 원칙을 근거로 예외 유지**(사용자에게 이 상충을 먼저 알리고 확인받음).
- **다음 에이전트가 알아야 할 것**: [Opus] `00-26` §4.2-1 표 전체를 "①④ 로그인 / ②는 care-guide만 예외, 나머지 전부 로그인 / ③ 없음"으로 재정합 필요 — walkthrough (37)이 이미 등재한 §4.2-1 편차와 합쳐서 한 번에 처리하는 게 효율적.

- **판정**: 🔄스펙갱신(docs/00-26 §4.2-1·§7.3 로그인 게이트 범위 재정합 필요 — care-guide 외 로그인 필수로 전환)

---

## 2026-08-19 (37) | [Sonnet] 메인 4박스 시각·인터랙션 고도화 + 휠/스크롤 버그 3건 + 위치 폴백 변경

- **근거 스펙**: 스펙 문서 없음 — 개발자 채팅 즉석 지시 총 8건(2026-08-19, walkthrough (36) 이후). 대조 정본: `00-09` §2.1(5색 토큰, 신규 색상 계열 금지) · `00-23` §8.3(상태 배지 규격, 앰버 금지) · `00-26` §4.2-1(진입 조건 표, 이번 건으로 편차 발생) · `00-14` §2.10(위치기반서비스 미신고 잠금 규칙, `LOCATION_BASED_SERVICE_REGISTERED=false` 유지 확인 후 진행).
- **건드린 파일**: `eobom/frontend/src/components/home/EntryBoxes.tsx`(전면 재작성 — 기본 상태는 [아이콘+제목+한줄설명]만 노출, 칩·CTA·입력창·파트너행은 `.entry-box-reveal`로 감싸 호버시에만 펼침, 카드 배경에 00-09 5색 파생 그라데이션 틴트 3종 적용, `handleBox1Click`에서 박스 단위 로그인 체크 제거) · `eobom/frontend/src/index.css`(`--box-tint-*` 변수 신설, `.entry-box-card`/`.entry-box-reveal`/`.entry-box-tint-*` 규칙 신설, `:has()` 기반 그룹 호버 포커스(하나 호버 시 스케일 확대+리프트, 나머지 3개 축소+딤), `@media (hover:hover)`로 터치기기 자동 제외, `.entry-box-primary`/`.entry-box-secondary` min-height 4회 조정: 300→220→(유지)/150→120→150, `.entry-boxes-focus-group` maxWidth 1400→1200) · `eobom/frontend/src/components/home/BoxDetailOverlay.tsx`(휠 핸들러에 `e.stopPropagation()` 추가). ⚠️ **이 3개 파일은 아직 커밋되지 않음** — 직전 커밋 2건(`5dac45c`·`008db2b`, GPS 폴백 좌표 변경·홈 스크롤 복원 버그 수정)은 개발자가 직접 커밋함.
- **결과**: `npx tsc --noEmit`(frontend·backend) 에러 0. 브라우저 실기동으로 매 라운드 확인 — ①4박스 기본 상태(아이콘+제목+한줄설명만, 호버 전 여백 균형 확인) ②호버 시 해당 박스 확대(`scale(1.06)`+리프트)+칩·CTA 펼침, 나머지 3개 축소(`scale(0.94)`)+딤(`opacity 0.8`), `:has()`가 상단/하단 두 그리드 블록을 모두 아우름을 스크린샷으로 확인 ③박스① 로그아웃 상태 클릭 → 오버레이 즉시 오픈(로그인 모달 없음) → "전문가 상담 이동하기"(비로그인 CTA) 클릭 → `/counseling` 즉시 이동 → 재오픈 후 "디지털 엔딩노트 작성하기"(`loginRequired:true` CTA) 클릭 → 로그인 모달만 뜨고 라우트 이동 없음, 전부 확인 ④오버레이 내부 휠 스크롤 중 배경 `HomePage` 컨테이너의 `scrollTop`을 스크립트로 직접 조회해 스크롤 전후 불변(527→527) 확인 ⑤카카오맵 "안 불러와짐" 재현·원인 특정 — 코드 버그 아님. 이전 세션들의 `TaskStop`이 `npm run dev`가 띄운 vite 자식 프로세스(node.exe)를 못 죽여 포트 5173~5177에 좀비 5개가 쌓였고, 카카오 개발자 콘솔의 Web 플랫폼 도메인 허용 목록엔 `localhost:5173`만 등록돼 있어 이후 포트에서는 SDK 스크립트 요청이 거부(`<script>` onerror)됐음 — `netstat`으로 포트별 PID 확인 후 5174~5177의 좀비 프로세스 4개를 `taskkill`로 정리, 5173 하나만 남겨 정상 로드 확인. 코드/설정 변경 없음. ⑥콘솔 에러 0건(전 라운드).
- **편차**: ①🔴 **`00-26` §4.2-1과 정면으로 어긋남** — §4.2-1은 "①생전준비는 박스 단위 전체 로그인 필수"였는데, 개발자 직접 지시("소개글은 로그인 없이도 봐야 한다")로 로그인 체크를 박스 클릭 시점에서 오버레이 내부 CTA 클릭 시점으로 옮겼다. 실제로는 §4.2-1이 이미 §4.2-1 자체에서 지적했던 "완화책 필요"(02 전문가 조회가 로그인에 막혀 이탈 발생) 문제가 이번 변경으로 사실상 해소됐다 — "가/나/다" 완화책 논의 자체가 필요 없어진 상태. `[Opus]`가 §4.2-1 표와 §6 미결 #1-1을 이 기준으로 재정합해야 한다. ②`00-23` §8(4박스 스펙)과의 실물 괴리가 이번 시각 고도화로 한층 커졌다 — walkthrough (32)·(34)가 이미 "재정합 대기"로 남겨둔 상태에 그라데이션·호버 포커스·리빌 패턴이 추가로 얹어졌다. ③위치 폴백 좌표 변경(직전 커밋)이 아직 `00-14` §2.10 등 문서에 반영 안 됨 — `GEOLOCATION_FALLBACK`이 서울 서초(37.4925, 127.0078)에서 광주 광산구(35.1397, 126.7938)로 바뀌었는데 이 사실을 아는 docs가 없다. ④카드 배경 그라데이션 색(`#F5F8F6`·`#FDFBF7`)은 00-09 §2.1 5색에 없는 새 hex 값이지만, 각 브랜드색(웜그린·웜골드)에 흰색을 섞은 극히 옅은 틴트일 뿐이라 "새 색상 계열 신설"로 보지 않고 개발자 직접 지시(정확한 hex 값까지 지정)를 그대로 따랐다 — `[Opus]`가 이견 있으면 §2.1에 파생 규칙으로 명문화 필요.
- **다음 에이전트가 알아야 할 것**: ①🔴 **`EntryBoxes.tsx`·`index.css`·`BoxDetailOverlay.tsx` 3개 파일 미커밋** — 개발자가 직접 커밋하는 편이라 이번엔 대기 중이다. ②🔵 카카오맵 "5173 포트만 정상"이라는 사실이 `systems.md`(외부 연동 명부)에 아직 없다 — 다음에 dev 서버가 여러 개 뜨는 문제가 재발하면 여기부터 확인. ③`CounselingPage`·`CareGuidePage`의 375px 자체 오버플로(walkthrough (36) 편차 ⑤)는 여전히 미해결. ④§4.2-1 완화책(가/나/다)은 이제 사실상 "가"안(로그인 모달에 이탈구)에 가깝게 동작 중이라, 목업 판단 항목 자체가 좁혀졌다.

- **판정**: ✅통과 (`EntryBoxes.tsx` 기본 상태 요약 + 호버 시 `.entry-box-reveal` 순차 노출 및 `:has()` 기반 그룹 호버 포커스 정상 동작 확인 / 00-09 파생 3종 틴트 그라데이션 및 앰비언트 섀도우 비주얼 고도화 확인 / `BoxDetailOverlay` 휠 `stopPropagation()`으로 배경 스크롤 방지 확인 / 광주 광산구 GPS 폴백 좌표 반영 확인 / 프론트·백엔드 npx tsc --noEmit 에러 0건 통과)

---

## 2026-08-19 (36) | [Sonnet] 모드별 네비게이션 개편 — 홈 메뉴 제거 + 진입 모드별 맞춤 사이드바

- **근거 스펙**: `docs/00_핵심플랫폼/00-26_모드별_네비게이션_개편_검토서.md` §7(§7.1 범위·§7.2 크롬 규칙·§7.3 금지) · §3(§3.1 생전 3개·§3.2 유가족 6개·§3.3 Guest·파트너 메뉴 없음) · §4.2-1(진입 조건 확정표 — ①④ 로그인/②③ 없음) · §5(라벨 정정 3건) · `00-02` §3.1·§3.2(모드별 도메인·라벨 정본) · `00-09` §2.3·§4(접근성 토큰·호버).
- **건드린 파일**: `eobom/frontend/src/modeNav.ts`(신규 — `NavMode` 타입, `NAV_MODE_STORAGE_KEY`, `MODE_LABELS`, `MODE_MENUS`[prep 3개/bereaved 6개] 정본 데이터) · `eobom/frontend/src/App.tsx`(`navMode` state 신설 + localStorage 영속화, `isHomeRoute` 신설해 `/`에서 `Sidebar` 미렌더 + `main-wrapper` marginLeft를 0으로 되돌림, `Sidebar`에 `navMode`·`currentUser`·`onOpenLogin` 전달, `Header`에 `navMode`는 홈에서 `null`로 넘겨 칩을 숨김, `HomePage`에 `onSetMode={handleSetNavMode}` 전달) · `eobom/frontend/src/components/Sidebar.tsx`(전면 재작성 — `navMode`가 있으면 `MODE_MENUS[navMode]` 렌더[Badge 재사용, comingSoon `disabled`+`not-allowed`, loginRequired 항목은 `onOpenLogin` 호출], 없으면 기존 6개 메뉴를 §5 라벨 3건 정정해 그대로 유지) · `eobom/frontend/src/components/Header.tsx`(전면 재작성 — 중앙에 모드 칩 신설[클릭 시 홈으로], `header-inner`/`header-user-name-text`/`header-btn-label`/`header-mode-chip-label` 클래스로 반응형 처리, **모드 칩을 절대배치가 아니라 로고·사용자정보 사이의 실제 flex 공간에 배치**해 겹침을 원천 차단) · `eobom/frontend/src/components/home/EntryBoxes.tsx`(`Badge` export, `handleBox1Click`[비로그인 시 `onOpenLogin`만 호출하고 모드 설정·오버레이 오픈 둘 다 하지 않음, 로그인 시 `onSetMode('prep')`+오버레이 오픈], `handleBox2Click`[로그인 확인 없이 바로 `onSetMode('bereaved')`+오버레이 오픈]) · `eobom/frontend/src/pages/HomePage.tsx`(`onSetMode` prop 추가 후 `EntryBoxes`로 전달) · `eobom/frontend/src/index.css`(`.header-inner` 패딩 + `@media (max-width:480px)`에서 사용자명 말줄임표·버튼 라벨·모드칩 라벨 숨김 — walkthrough (34)가 보고한 375px 헤더 가로 오버플로 해소용, 코멘트에 근거 명시).
- **결과**: `npx tsc --noEmit`(frontend·backend) 에러 0. `npm run dev`(포트 5176, 5173~5175 이미 점유돼 자동 회피) 기동 후 Chrome 실기동 확인 — ①**박스①(생전 준비)**: 비로그인 상태에서 클릭 → 로그인 모달만 뜨고 오버레이·모드 설정 없음(스크린샷으로 배경 4박스 그대로 유지 확인) 확인 → 데모 로그인 후 재클릭 → 오버레이 정상 오픈, "전문가 상담 이동하기" CTA 클릭 → `/counseling` 이동 + 헤더 중앙에 "생전 준비 모드" 칩 노출 + 사이드바가 3개 메뉴(디지털 엔딩노트[미리보기]·디지털 자산·계정 정산[미리보기]·전문가 매칭[활성, 하이라이트])로 전환됨을 확인 ②**박스②(임종 및 사후 정리)**: 비로그인 상태에서 클릭 → 로그인 없이 오버레이 즉시 오픈("로그인 없이도 바로 열람하실 수 있습니다" 문구 포함 첫 슬라이드) → "상중 케어 바로 보기" CTA 클릭 → 로그인 없이 `/care-guide` 이동 + 콘텐츠 즉시 렌더 + 사이드바가 6개 메뉴(상중·행정 케어[1순위, 하이라이트]→장사시설 매칭→전문가 매칭→디지털 자산·계정 정산[미리보기]→디지털 추모관[준비중]→현물 유품 수거[준비중])로 전환됨을 확인 ③**박스③(Guest)**: 입장 버튼 클릭 → 무반응(`alert()` 없음, 콘솔 에러 0) 확인, 코드 변경 없음 ④**박스④(파트너)**: "파트너 로그인" 클릭 → `/partner` 이동(포털 크롬 그대로, 코드 변경 없음) 확인 ⑤**모드 칩 전환**: `/care-guide`에서 헤더의 "유가족 모드" 칩 클릭 → `/`(홈)로 이동 + 4박스 정상 노출(사이드바 숨김) 확인 — localStorage의 모드 값은 그대로 남아있지만 홈에서 자동 이동은 발생하지 않음(§4.3) ⑥**모드 없음 직접 URL 진입**(`localStorage`에서 `k_ending_nav_mode` 제거 후 `/facility` 직접 이동): 기존 6개 메뉴(라벨 3건 정정 반영 — "장사시설 매칭"·"전문가 매칭"·"디지털 자산·계정 정산") 그대로 노출, 헤더에 모드 칩 없음 확인(§6 #5) ⑦**사이드바 🔒 항목**: 로그아웃 상태에서 생전준비 모드 사이드바의 "디지털 엔딩노트" 클릭 → 로그인 모달만 뜨고 라우트 이동 없음(URL이 `/counseling`에 그대로 머무름) 확인 ⑧**반응형 3폭**: 데스크톱(1568px 창) 정상 / 좁은 창(952px, 사이드바 hover 확장 상태 포함)에서 로고·모드칩·사용자정보 겹침 없음(아래 편차 참고) / 모바일(375px, 동일 오리진 iframe 프로브)에서 `header.scrollWidth === header.clientWidth`(홈 371/371, `/counseling` 356/356, `/care-guide` 356/356) 확인해 walkthrough (34)가 보고한 헤더 오버플로 완전 해소 확인 ⑨`read_console_messages(onlyErrors:true)` 전 과정 0건.
- **편차**: ①**모드 칩을 처음엔 `position:absolute; left:50%`로 구현했다가 실기동 중 겹침 버그를 직접 발견해 flex 인라인 배치로 다시 짰다** — 로그인 상태(사용자명 pill+계정설정+로그아웃 버튼)에서 헤더 폭이 ~950px대로 좁아지면 절대중앙배치된 모드 칩이 사용자정보 그룹과 그대로 겹치는 것을 스크린샷으로 확인했다. 로고(flexShrink:0)-모드칩(flex:1 1 auto, 남는 공간 안에서 justify-content:center)-사용자정보(flexShrink:1) 3분할 실제 flex 흐름으로 바꿔 구조적으로 겹침이 불가능하게 만들었다(칩 자체는 `overflow:hidden`으로 공간이 부족하면 텍스트가 잘리기만 하고 다른 요소를 침범하지 않음). ②**§4.2-1 "①의 02 조회 차단 완화"는 "다안(완화하지 않음)"을 기본값으로 택했다** — 스펙이 "목업 후 결정, 구현 시 택1"이라 명시했고, 가장 단순하고 예측 가능한 동작이라 판단했다. 전환율 문제가 실측되면 "가"안(로그인 모달에 "먼저 둘러보기" 이탈구)으로 조정 권고. ③**홈에서는 모드 칩을 숨겼다** — 스펙 §4.4는 칩을 "헤더"에 두라고만 했지 홈 노출 여부는 명시하지 않았으나, 실기동 확인 중 홈에서 모드 칩이 보이면 클릭해도 이미 홈이라 아무 일도 안 일어나는 무의미한 UI라 판단해 `App.tsx`에서 `navMode={isHomeRoute ? null : navMode}`로 조건부 처리했다. ④**mode 아이콘 렌더에 `React.ElementType`(비제네릭)을 썼다** — `ComponentType<{size?,color?}>`로 좁혀 타이핑했더니 lucide-react 아이콘(Package·Flower2)의 `propTypes` 시그니처가 구조적으로 안 맞아 tsc 에러가 났다(문자열도 허용하는 lucide `size` prop vs 숫자만 허용하는 내 타입). 커스텀 `MenuIcons`와 lucide 아이콘을 한 배열에 같이 담아야 해서 가장 느슨한 `ElementType`으로 타입을 낮췄다 — 런타임 동작에는 영향 없음(JSX가 알아서 각 컴포넌트의 실제 props를 받는다). ⑤**`/counseling`·`/care-guide` 자체 페이지에 375px에서 별도 가로 오버플로가 남아있다**(`CounselingPage`의 "간이 시뮬레이터 열기" 버튼, `CareGuidePage`의 D-Day 카드 내부 요소) — 이번 사이클 파일 범위(`App.tsx`·`Sidebar.tsx`·`Header.tsx`·`EntryBoxes.tsx`)에 없는 페이지라 손대지 않았다. **`Header` 자체의 오버플로(walkthrough (34) 보고분)는 완전히 해소됐음을 스크린샷·스크립트로 확인**했으니 별개 문제로 분리해 다음 항목에 남긴다.
- **다음 에이전트가 알아야 할 것**: ①🔴 **`CounselingPage`·`CareGuidePage` 등 개별 도메인 페이지의 375px 반응형 오버플로**가 남아있다(편차 ⑤) — Header와는 별개 원인(페이지 자체 콘텐츠)이라 각 페이지 담당 사이클에서 처리 필요. ②🔵 **§6 #1-1(①의 02 조회 차단 완화)·#2(모드 기억 방식)는 이미 구현 완료 상태로 목업이 나왔다** — 사장님이 이 목업을 보고 "다안 유지" 또는 "가안으로 완화" 여부만 정하면 된다(편차 ②). ③`Sidebar.tsx`의 모드별 메뉴 아이템 아이콘은 `size`/`color`만 쓰고 `accentColor`/`fillColor`는 안 넘긴다(기존 6개 메뉴 렌더 분기와 다름) — `MenuIcons`는 기본값이 있어 문제없지만, 만약 새 `MenuIcons` 컴포넌트를 모드 메뉴에 추가할 때 `accentColor`/`fillColor` 기본값이 없다면 색이 안 보일 수 있다. ④임시로 띄운 `npm run dev`(포트 5176)는 확인 후 `TaskStop`으로 종료했다. ⑤테스트 중 지웠던 로그인 localStorage(`k_ending_current_user`/`k_ending_token`)는 원래 값으로 복원했고, `k_ending_nav_mode`는 테스트 종료 시 제거해 다음 세션이 모드 없는 깨끗한 상태에서 시작하게 해뒀다.

- **판정**: ✅통과 (`00-26` §3·§7 스펙 정합 / `modeNav.ts` 모드별 메뉴 정본 신설 및 `Sidebar.tsx` 맞춤 분기 동작 확인 / `Header.tsx` flex 인라인 모드 칩 및 375px 반응형 오버플로 해소 확인 / 프론트·백엔드 npx tsc --noEmit 에러 0건 통과)

---

## 2026-08-19 (35) | [Opus] `00-26` 신설 — 모드별 네비게이션 개편 검토 + 🔴 문서번호 충돌 발견

- **근거 스펙**: 개발자 제안(2026-08-19) — *"홈페이지 첫 진입 화면에서 메뉴 없애기, 네 개의 박스에 따라 각각 로그인 하고, 진입된 페이지에서 맞춤형 메뉴 등장"*. 대조한 정본: `00-12` §6.2·§8 #5(모드 전환 UX 미결) · `00-02` §3.1(모드별 도메인)·§3.2(도메인 라벨) · `00-23` §3(실측표)·§4.1(로그인 위치)·§5.3(#6 라벨)·§6 #7(모드 기억) · `00-06` §7.4(포털 크롬 분리) · `07-02`(유족 우선순위). **실측**: `Sidebar.tsx:16-21`(메뉴 6개 전수) · `Header.tsx`(좌 로고/우 로그인, 중앙 공백) · `App.tsx`(`isPortalRoute` 조건부 크롬) · `DigitalEstatePage.tsx:12`(서브탭 3종) · `00-06` SCR 대장 · `git log -S "00-24"`.
- **건드린 파일**: `docs/00_핵심플랫폼/00-26_모드별_네비게이션_개편_검토서.md`(신규 — 전 8절), `docs/00_DOCS_INDEX.md`(**`00-24` 행 신설**[정본 없음 경고] + `00-26` 행 신설), `.harness/memory/context.md`(①⑥⑦ 갱신 + 예산 초과로 압축 3621B→3235B)
- **결과**:
  - ✅ **개발자 제안이 `00-12` §6.2 미결의 답이라는 것이 이번 검토의 핵심 발견이다.** §6.2는 B안(수동 전환)을 *"전환 존재를 모르면 무용"* 이라는 **단 하나의 사유**로 기각했는데, **4박스가 첫 화면이면 전환 존재를 모를 수가 없다** — 선택이 곧 진입이기 때문. **화면 구조가 기각 사유를 제거한다.**
  - 🔵 **가장 큰 실익은 `Deceased` 의존을 끊는 것.** C안(권고안)의 자동 판정은 `Deceased` 등록을 신호로 쓰는데 **그것이 지금 04·05·07을 전부 묶고 있는 블로커**다(`00-13` §4.5-3). 즉 C안은 *"블로커가 풀려야 만들 수 있는"* 안이었고, 개발자 방식은 **지금 만들 수 있다**. C안 폐기가 아니라 **선후 배치**로 정리했다(`Deceased` 확정 후 자동 판정을 덧붙이면 그게 C안).
  - ✅ **맞춤 메뉴는 새로 정할 것이 없었다** — `00-02` §3.1이 2026-08-12에 모드별 도메인을 이미 확정(생전 **02·04·06** / 유가족 **01·02·03·04·05·07**). 여기에 `00-23` §3 실측 상태를 배지로 붙여 §3.1·§3.2 표를 만들었다. 🔴 **유가족 6개 중 실제 열리는 것은 4개**(03·05 준비 중)라는 것이 정직한 상태다.
  - 🔴 **핵심 지적 — "각각 로그인"은 4개 중 1.5개만 맞다**(§4.1). ②유가족은 **사별 직후 유족에게 로그인 벽**을 세워 `07-02`의 *"한 줄이라도 남으려면 최상단"* 이 무너지고, ③Guest는 **대상이 비회원 조문객**이라 `00-23` §2.2가 *"어느 문서에도 없던 경로"* 로 발굴한 분기가 다시 막힌다. ④파트너만 맞고(이미 그러함), ①은 절반(06은 맞으나 02 목록 조회까지 막힘). → 🟡 **대안: 진입 조건을 "로그인"이 아니라 "모드 선택"으로.** 원하는 결과(맞춤 메뉴·홈 메뉴 제거)는 전부 얻으면서 `00-23` §4.1이 깨지지 않으며, **차이는 로그인을 묻는 시점뿐**임을 비교표로 제시했다.
  - 🔴 **새 발견 — 사이드바 라벨이 5개 중 3개 어긋나 있다**(§5). `00-23` §5.3(#6)은 이를 **1건**으로 봤는데 `00-02` §3.2와 전수 대조하니 3건이었다: *"장례·묘지 매칭"*→**장사시설 매칭** · *"상속·법률 케어"*→**전문가 매칭** · *"디지털 유품 정리"*→**디지털 자산·계정 정산**. 특히 첫 건은 01이 봉안당·수목장 포함 1,552건인데 *"장례·묘지"* 가 **범위를 좁게 오해시킨다.** 메뉴를 새로 만드는 김에 고치지 않으면 **불일치가 두 모드로 복제**된다.
  - 🔵 **④파트너가 이미 `isPortalRoute`로 크롬을 분리해 동작 중**(`00-06` §7.4)이라, 모드별 사이드바는 새 구조가 아니라 **기존 패턴의 확장**임을 확인했다 — 실현 가능성의 근거로 §3.3에 명시.
  - 🔴 **문서번호 충돌을 발견해 파일명을 바꿨다** — 아래 편차 ①.
  - **검증**: `bash .harness/tools/harness-doctor.sh` → **✅ 130개 항목 통과.**
- **편차**: ①🔴 **처음 `00-24`로 만들었다가 `00-26`으로 옮겼다.** `docs/00_핵심플랫폼/`에 `00-24`가 없고 인덱스에도 없어 빈 번호로 보였으나, `git log -S "00-24"`로 확인하니 **커밋 `e7855a5`에서 `[Gemini]`가 `reports/00_핵심플랫폼/00-24_이어봄_프론트엔드_UIUX_디자인_개선_보고서.html`을 이미 만들어 번호를 점유**하고 있었다(파일 내부에 *"문서 번호: 00-24"* 명시). **`00-25`도 이미 존재**해 다음 빈 번호인 `00-26`을 썼다. ②⚠️ **그 과정에서 구조 문제를 발견했다** — `00-24`는 **`reports/`에만 있고 `docs/` 마크다운 정본이 없다.** `roles.md` §1-2의 순서(`[Opus]` `docs/` → `[Gemini]` `reports/`)와 **역방향**이라 정본 없는 보고서가 됐고, 그래서 인덱스에서도 안 보였다. **고치지 않고 인덱스에 "정본 없음" 경고 행을 신설**해 드러냈다(`reports/`는 Claude 읽기 전용). ③`00-09` §3.1이 *"사이드바 6개 메뉴"* 로 적혀 있어 **채택 시 갱신이 필요**한데, #1 미확정이라 지금 고치지 않고 §8 관련문서 표에 🔴로 등재만 했다.
- **다음 에이전트가 알아야 할 것**: ①🔴 **`00-26` §6 #1(진입 조건: 로그인 vs 모드 선택)이 개발자 확정 대기**다. **#1만 정해지면 나머지 5개는 목업을 보고 정할 수 있게** 설계했다(`00-23` 때와 같은 방식). ②🔵 **`00-24` 처분 판단이 필요하다** — 존치(현행 유지)/정본화(`docs/` 마크다운 신설)/폐기 중 택. `reports/`는 `[Gemini]` 소유다. ③**`00-23` #6은 `00-26` §5로 흡수**됐다 — `context.md` ②에서 뺐다. ④**`00-23` §8 재정합은 여전히 미착수**다((32)가 §8.1·§8.2를 뒤집은 상태). ⑤⚠️ **`<Header>` 375px 오버플로((34) 보고)가 모드 칩 추가로 악화**된다 — §4.4에 경고를 달았고 같은 사이클에서 함께 봐야 한다.

- **판정**: ✅통과 (`00-26` 신설 완료 / 개발자 홈 메뉴 제거 및 맞춤형 메뉴 제안의 00-12 §6.2 정합성 규명 및 `Deceased` 블로커 분리 확인 / `00-02` 모드별 도메인 및 사이드바 라벨 3건 정정 반영 / 00-24 reports 선점 충돌 회피 후 `00-26` 정상 명명 확인)

---

## 2026-08-19 (34) | [Sonnet] 메인화면 시각 정제 — 4박스 위계 복원 + 히어로·오버레이 마감

- **근거 스펙**: `docs/00_핵심플랫폼/00-23_메인화면_진입구조_개편_검토서.md` §8.5(4박스 레이아웃 — "Desktop ≥1024px: 상단 2열(①② 큰 카드) + 하단 2열(③④ 높이 약 절반)") · `00-09` §2.1~§2.4·§4(색·서체·접근성·여백·호버 정본)·§5(정본 경계, 2026-08-19 신설 — `reports/style.css` 참조 금지, Gemini 소유·읽기 전용)·§4-3(index.css:127 주석 정정 지시) · walkthrough (32)(항목 목록을 걷어낸 현재 구현 상태의 정본). `[Opus]` 핸드오프 프롬프트(walkthrough (33) 말미)에 따라 착수 전 `git diff`로 작업 트리 상태를 먼저 확인함 — HomePage/EntryBoxes/BoxDetailOverlay가 이미 이번 세션 앞부분에서 수정된 상태였고(alignItems center→start 등), `git log -1 -- <file>`로 대조한 결과 커밋 `21ffe85`(2026-08-19)에 그대로 반영돼 있어 유실 없음을 확인 후 이어서 진행함.
- **건드린 파일**: `eobom/frontend/src/components/home/EntryBoxes.tsx`(①②/③④를 별도 `.entry-boxes-grid` 두 블록으로 분리해 상단/하단 위계 복원, `BoxHeader`에 `size` prop 신설해 아이콘을 52px/40px 색상 박스로 확대, 요약 칩용 `chipLabels` 맵 + 클릭 불가 `<span>` `ChipRow` 컴포넌트 신설해 박스①②에 붙임, "자세히 보기" 줄에 상단 구분선 + `--point-color` 강조 추가) · `eobom/frontend/src/index.css`(`.entry-box-primary`/`.entry-box-secondary` 클래스 신설 — `@media (min-width:768px)`에서만 `min-height: 300px`/`150px`, 768px 미만은 스택이라 강제 높이 없음 / `index.css:127` 주석 `"Emergency Hotline Pulsing Badge"` → `"지도 핀 마커 펄스 애니메이션(KakaoMapModal 전용 — 00-09 §4-3 2026-08-19 정정)"`으로 정정) · `eobom/frontend/src/pages/HomePage.tsx`(히어로 그리드 `alignItems: 'center'` → `'start'`) · `eobom/frontend/src/components/home/BoxDetailOverlay.tsx`(슬라이드 내부 그리드 `alignItems: 'center'` → `'start'`).
- **결과**: `npx tsc --noEmit`(frontend·backend) 에러 0. `grep -r "animate-pulse"`로 유일 사용처가 `KakaoMapModal.tsx` 1곳뿐임을 확인 후 주석 정정. `npm run dev`(포트 5175, 5173·5174는 이미 점유돼 있어 자동 회피) 기동 후 Chrome으로 확인 — ①**데스크톱(1440px)**: 상단 ①②가 하단 ③④보다 뚜렷이 크고, ①②에 요약 칩(예: 생전 준비 = "전문가 상담·디지털 엔딩노트·디지털 자산 정리")과 구분선 있는 "자세히 보기"가 빈 공간 없이 채움 ②**태블릿(834px, 동일 오리진 iframe 프로브 — `resize_window`가 이 세션 창에 반영 안 되는 문제가 walkthrough (31) 때와 동일하게 재현돼 우회)**: §8.5대로 데스크톱과 동일 2열(①②/③④) 유지 확인 ③**모바일(375px, 동일 iframe 프로브)**: 1열 스택 ①→②→③→④ 순서 확인, 본문 콘텐츠의 `document.documentElement.scrollWidth === clientWidth`(둘 다 375) 확인해 가로 스크롤 없음 검증 — 단 **App 레벨 `<Header>`는 scrollWidth 507로 오버플로 있음(이번 파일 미수정, 아래 "다음 에이전트" 참고)** ④히어로: `alignItems:'start'`로 배지·타이틀·본문이 이미지와 같은 상단선에서 시작, 텍스트가 짧아졌어도 이미지 옆에 붕 뜨지 않음 ⑤오버레이 7슬라이드(facility·counseling·care-guide·digital-estate·ending-note·pickup·memorial) 전부 `alignItems:'start'`로 배지·피처카드 상단이 슬라이드 콘텐츠 길이와 무관하게 정렬됨을 스크린샷으로 확인 ⑥기능 회귀 — 전문가 상담(박스① 슬라이드1 CTA, 로그인 불요) 및 상중 케어(박스② CTA) 클릭 시 각각 `/counseling`·`/care-guide`로 라우트 이동, 파트너 로그인 클릭 시 `/partner` 이동, Guest 준비중 버튼 클릭 시 무반응(`alert()` 없음), 🔒 엔딩노트 CTA는 `localStorage`에서 `k_ending_current_user`/`k_ending_token`을 지워 비로그인 상태를 재현한 뒤 클릭 → `onOpenLogin()` 로그인 모달만 뜨고 `/ending-note`로 이동하지 않음을 확인(테스트 후 원래 토큰 값 복원). `read_console_messages(onlyErrors:true)` 전 과정 0건.
- **편차**: ①§8.5 "높이 약 절반"을 `min-height: 300px`(①②) / `150px`(③④)라는 구체 수치로 구현했다 — 정확히 2배 비율이지만 콘텐츠가 더 길면 자연히 늘어나므로 "약"의 취지(엄격한 절반 고정이 아님)에 맞다고 판단했다. ②"빈 공간 해소" 3가지 선택지(아이콘 확대/여백 재배분/CTA 강화) 중 하나만 고르라는 지시였으나 **아이콘 확대 + 클릭 불가 요약 칩 + CTA 강화 3가지를 함께 적용**했다 — 칩만으로는 카드 하단이 여전히 비어 보였고, 세 요소가 각각 다른 위치(헤더 옆/본문 중간/하단)를 채워 서로 겹치지 않는다고 판단해 범위를 넓혔다. ③박스③④(`BoxHeader size="sm"`)에도 아이콘 축소(40px→20px 아이콘)를 적용했다 — 스펙에 없던 항목이지만 상단(큰 아이콘)/하단(작은 아이콘) 대비가 위계를 시각적으로 한 번 더 보강한다고 판단했다. ④칩 라벨(`chipLabels`)은 `domainSlides.badgeLabel`을 그대로 쓰지 않고 새로 짧게 지었다(예: "디지털 자산·계정 정산" → "디지털 자산 정리") — 오버레이 슬라이드 제목과 카드 요약 칩은 글자 수 제약이 달라 별도 상수로 분리했다.
- **다음 에이전트가 알아야 할 것**: ①🔴 **App 레벨 `<Header>`가 375px에서 가로 오버플로**(scrollWidth 507 vs clientWidth 356) — 이번 사이클 범위(히어로·4박스·오버레이) 밖이라 손대지 않았다. `Header.tsx`의 사용자 프로필 칩("네이버 테스트회원 (NAVER)님" 등 긴 이름)이 줄바꿈 없이 폭을 넘긴다. ②`resize_window` MCP 도구가 이 세션 Chrome 창에 여전히 적용 안 됨(walkthrough (31)과 동일 증상) — 반응형 확인은 계속 동일 오리진 `<iframe>` 프로브로 우회해야 한다. ③로그아웃 헤더 버튼 클릭이 화면상 반응이 없어 보여 `localStorage` 직접 조작으로 우회했다 — 백엔드 서버(`eobom/backend`)를 이번 사이클에서 띄우지 않아서인지, 버튼 자체 문제인지는 확인하지 않았다(재현되면 별도 이슈). ④`00-23` §8 자체의 문서 재정합(walkthrough (32)·(33)이 지적한 §8.1·§8.2 불일치)은 여전히 `[Opus]` 몫으로 남아 있다 — 이번 사이클은 §8.5(레이아웃)만 다뤘다. ⑤임시로 띄운 `npm run dev`(포트 5175)는 확인 후 `TaskStop`으로 종료했다.

- **판정**: ✅통과 (`00-23` §8.5 4박스 상단(300px)/하단(150px) 위계 복원 및 클릭 불가 요약 칩·구분선 적용 확인 / `index.css:127` 지도 핀 펄스 애니메이션 주석 정정 완료 / `HomePage`·`BoxDetailOverlay` alignItems start 정렬 마감 / 프론트·백엔드 npx tsc --noEmit 에러 0건 통과 / 기능 회귀 없음 확인)

---

## 2026-08-19 (33) | [Opus] `00-09` 정정(긴급 FAB·pulse 실측) + §5 정본 경계 신설

- **근거 스펙**: 개발자 지시(*"1. style.css를 00-09 인덱스에 맞춰서 수정 혹은 아예 삭제하도록 gemini에게 명령하겠음. 2. 현재에 맞게 수정 필요."*). 대조한 정본: `00-14` §2-4(24시간 긴급콜 판정) · walkthrough (32)(`FloatingEmergency.tsx` 삭제) · `CLAUDE.md`(`reports/` 읽기 전용). **실측**: `grep "accent-red|#DC2626|#EF4444|#D9534F"`(프론트 전수) · `grep "animate-pulse|keyframes pulse"` · `index.css:126-135` · `Sidebar.tsx:16-21` · `reports/style.css` 전문 340줄.
- **건드린 파일**: `docs/00_핵심플랫폼/00-09_디자인_시스템_및_스타일_가이드.md`(§2.1 Alert 행 정정 + 🔵정정 블록, §3.1 FAB 줄 제거 + 메인홈 구조 줄 신설 + 🔵정정 블록, §4-3 제목·값·용도 정정, **§5 정본 경계 신설**), `.harness/memory/context.md`(①⑥⑦⑧ 갱신 + 부팅 예산 초과로 압축 3504B→3288B), `docs/작업일지_및_기록/260819.md`(신규)
- **결과**:
  - 🔴 **`00-09`가 "없는 것을 있다고" 말하고 있었다.** §2.1은 Alert 색을 `#EF4444`/`#DC2626` 2개로 적고 용도를 *"24시간 긴급 콜 FAB 버튼"* 이라 했으나 **`#EF4444`는 저장소 전수 0건**이고 **FAB은 존재하지 않는다**. §3.1도 *"Bottom-Right Floating FAB: 🚨 24시간 긴급 콜"* 을 구조 요소로 명시하고 있었다. **경위가 2단계인데 `00-09`만 둘 다 놓쳤다** — ①`00-14` §2-4가 *"받을 사람이 없는 약속"* 으로 판정해 *"장례식장 바로 찾기"* 로 정정(08-14) → ②그 대체 버튼마저 08-18 제거(walkthrough (32)). **`00-14` §2가 여덟 번 잡은 결함과 같은 종류**이고 방향은 §2-9와 같다(문서가 사실 아닌 것을 현재 시제로 말함).
  - `#DC2626`은 살아 있으나 **용도가 달랐다** — 실측 결과 `TaxSimulatorModal`(상속세 결과) · `KakaoMapModal`(핀 마커) · 오류 메시지 3곳(`FacilityPage` 위치오류·`FacilityReviewModal`·`MyPageAuthSettings`). 표를 실측대로 다시 적었다.
  - §4-3도 어긋나 있었다 — 문서 `50% { opacity: 0.5; }` vs 실제 `opacity: 0.6 + transform: scale(1.15)`. 게다가 **이름이 *"Emergency"* 인데 유일한 사용처는 긴급 버튼이 아니라 지도 핀**(전수 1건). 이름·값·용도를 모두 정정.
  - ✅ §3.1 *"사이드바 6개 메뉴(메인 + 5대 도메인)"* 는 `Sidebar.tsx` 실측과 **일치해 수정하지 않았다.**
  - 🔵 **§5(정본 경계) 신설이 이번 사이클의 실질 산출물이다.** 개발자가 *"reports의 디자인을 바탕으로 화면을 세련되게"* 를 제안했는데 대조해보니 **`reports/style.css`(08-05)가 앱보다 뒤처져 그대로 적용하면 퇴행**이었다(point `#4E7055`≠`#5B7065` / bg `#F7F4EF`≠`#FBF9F5` / text `#2F3E46`≠`#1A2B4C` / **골드·명조 아예 없음** / hover `-5px`≠`-4px` / card padding `2rem`≠`1.5rem` / **삭제된 `.floating-call` 잔존**). 원인은 **어느 쪽이 정본인지 문서에 없었던 것**이라 §5에 못 박았다 — 정본은 `00-09`+`index.css`, `reports/`는 문서 뷰어이며 `[Gemini]` 소유·Claude 읽기 전용.
  - 🔴 **`00-23` §8.5 위반 발견** — *"상단 2열(①② 큰 카드) + 하단 2열(③④ 높이 약 절반)"* 인데 현재 4개가 동일 위계다. 어제 ①②에서 항목을 걷어내며 **주(①②)가 비고 부(③④)가 꽉 차 위계가 역전**됐다. **카드가 휑한 것은 취향이 아니라 스펙 위반의 증상**이며, 이것이 개발자가 말한 *"세련되지 않다"* 의 실체로 판단했다. → `[Sonnet]` 프롬프트 작성.
  - **검증**: `bash .harness/tools/harness-doctor.sh` → **✅ 129개 항목 통과.**
- **편차**: 없음(기획). 다만 명시할 것 3가지 — ①**`reports/style.css`를 직접 고치지 않았다.** `CLAUDE.md`가 `reports/`를 읽기 전용으로 규정하므로 `context.md` ⑥에 `[Gemini]` 요청으로만 남겼고, **처분 방식(갱신/주석명시/삭제)도 지정하지 않고 `[Gemini]` 판단으로 열어뒀다** — 보고서 가독성은 제품 UI와 다른 요구라 무조건 `index.css`와 같아질 필요가 없기 때문이다. ②`index.css:127` 주석이 아직 *"Emergency Hotline Pulsing Badge"* 인데 **코드 주석은 `[Sonnet]` 소유라 고치지 않고 §4-3에 사실만 기록**했다. ③**부팅 예산이 213B 초과**해 `context.md`를 압축했다 — 내용 삭제가 아니라 ①②-0⑥⑦⑧ 문장 축약 + "미해결 3건" 줄을 ⑧에 병합한 것이라 정보 손실은 없다.
- **다음 에이전트가 알아야 할 것**: ①🔴 **`00-23` §8 재정합은 아직 안 했다** — 오늘 고친 건 `00-09`다. (32)가 §8.1(01~05 섹션 유지 전제)·§8.2(항목 목록 노출)를 뒤집은 상태가 그대로 남아 있다. ②🔵 **`[Gemini]` 2건**: `reports/style.css` 처분 + `00-09` 재생성(§2.1·§3.1·§4·§5 반영). ③⚠️ **저장소 루트에 `AGENTS.md`가 없다**(전부 `.harness/` 안). 타 도구는 물론 새 Claude 세션도 하네스를 못 찾을 수 있어 루트 포인터 파일을 권고했고 **개발자 승인 대기**다. ④`[Sonnet]` 다음 사이클 프롬프트는 (33) 응답 말미에 있다 — **`reports/style.css` 참조 금지**가 핵심 조건이다.

- **판정**: ✅통과 (`00-09` §2.1·§3.1·§4 실측 정정 및 §5 정본 경계 신설 완료 / `reports/style.css` 00-09 토큰 동기화·뷰어 전용 경고 주석 배치·.floating-call 제거 처분 완료 / `00-09` 포함 47건 HTML 보고서 재생성 완료 / harness-doctor 129개 항목 통과)

---

## 2026-08-18 (32) | [Sonnet] 메인화면 2차 개편 — 히어로 축소·4박스 미니 오버레이화·01~05 섹션 제거·긴급버튼 제거

- **근거 스펙**: 문서 스펙 없음(사장님 채팅 즉석 지시 5건, 2026-08-18) — 진행 전 `AskUserQuestion`으로 3가지 실행 방식(①오버레이 형태 ②03 섹션 분할 방식 ③Guest·파트너 처리)을 확인받고 착수. **`00-23` §8은 이번 지시로 절반이 바뀌었으므로 다음 기획 사이클에서 `[Opus]`가 §8을 이 walkthrough 기준으로 재정합해야 한다**(아래 "다음 에이전트" ① 참고).
- **건드린 파일**: `eobom/frontend/src/pages/HomePage.tsx`(히어로 체크리스트 3항목·"5대 핵심 서비스 둘러보기" 버튼 제거, 히어로 grid `maxWidth 1400→1100`·이미지 `maxHeight 580→420` 축소, 옛 섹션2~6[01~05 소개 섹션] 전체 삭제, `sections` 배열을 hero·entry-boxes·footer 3개로 축소, 에필로그의 "사전 엔딩노트 작성"·"전국 시설 탐색" 버튼 제거, 미사용 import 정리) · `eobom/frontend/src/components/home/EntryBoxes.tsx`(전면 재작성 — 박스①②는 항목 목록 대신 헤더+"자세히 보기"만 남기고 카드 전체를 `<button>`으로 클릭 가능하게, `openBox` 상태로 `BoxDetailOverlay` 오픈. 박스③④는 기존 방식 그대로 유지) · `eobom/frontend/src/components/home/domainSlides.tsx`(신규 — 도메인별 슬라이드 콘텐츠 7종: facility·counseling·care-guide는 옛 섹션 문구 그대로 이관, digital-estate는 옛 섹션3의 뒤섞인 문구에서 계정정산 부분만 분리해 재작성, ending-note는 옛 섹션 그대로, **pickup·memorial은 신규 저작**(00-23 §8.7 준수 — 가짜 목록·숫자 없이 "준비 중" 사실만) · `eobom/frontend/src/components/home/BoxDetailOverlay.tsx`(신규 — `position:fixed` 전체화면, HomePage와 동일한 wheel-intercept+scroll-snap 로직을 자체 재구현, X·Esc로 닫힘, CTA는 `setActiveTab`+`onClose`, 🔒 항목은 `onOpenLogin`) · `eobom/frontend/src/App.tsx`(`FloatingEmergency` import·렌더 제거) · `eobom/frontend/src/components/FloatingEmergency.tsx`(파일 삭제 — 참조 0건 확인 후 제거) · `eobom/frontend/src/index.css`(`.overlay-slide` 높이 규칙 추가, dvh fallback).
- **결과**: `npx tsc --noEmit`(frontend·backend) 에러 0. 브라우저 실기동(Chrome, `https://localhost:5174`) 확인 — ①히어로: 체크리스트·버튼 사라짐, 이미지·텍스트 박스 축소되고 1440px 창에서 좌우 여백 발생 확인 ②박스①(생전 준비) 클릭 → 오버레이 오픈, 첫 슬라이드 "전문가 상담"(도메인 02) 표시, 휠 스크롤로 슬라이드2 "디지털 엔딩노트"(🔒) 이동 확인, 그 상태에서 CTA 클릭 → **로그인 모달만 뜨고 `/ending-note`로 이동하지 않음**(비로그인 상태) 확인, X 클릭 → 오버레이 닫히고 4박스 화면 복귀(라우트 이동 없음) 확인 ③박스②(임종 및 사후 정리) 클릭 → 6개 슬라이드, 1번째가 상중케어(에 "로그인 없이도 바로 열람하실 수 있습니다" 문구 포함), 인디케이터로 마지막 슬라이드(현물 유품 수거, comingSoon) 점프 → **CTA 버튼 없이 "준비 중인 서비스입니다." 배지만 표시**, 가짜 목록·숫자 없음 확인 ④`/counseling`으로 라우트 이동 후 화면 우하단 "장례식장 바로 찾기" 버튼이 더 이상 렌더되지 않음을 스크린샷으로 확인 ⑤`read_console_messages(onlyErrors:true)` — 전 과정에서 콘솔 에러 0.
- **편차**: ①**사장님 지시 자체가 `00-23` §8을 정면으로 뒤집는 내용**이라 이번 커밋은 §8과 어긋난다 — §8.2가 정한 "항목은 목록으로 나열"·"박스에 배지·항목 3~6개 노출" 방침을 박스①②에서 걷어냈고, §8.1이 "새 화면 ID 없음"이라 부른 옛 섹션1~5(01~05 소개)를 아예 삭제했다. **이 walkthrough를 `00-23` §8의 최신 현실로 간주하고, `[Opus]`가 다음 사이클에 §8을 재작성해야 한다**(문서 수정은 이번 범위 밖 — `CLAUDE.md` "구현 중 docs/를 고치지 않는다"). ②`AskUserQuestion`으로 확정한 3가지 실행 방식(박스별 미니 오버레이 / 03을 항목별로 쪼갬 / Guest·파트너는 기존 방식 유지)은 사용자가 직접 고른 것이라 스펙 문서가 아니라 이 대화 자체가 근거다. ③03(현물유품수거)·05(디지털추모관) 콘텐츠는 실체가 없어 완전히 새로 썼다 — 문구는 "준비하고 있습니다/아직 열려 있지 않습니다" 같은 미래·현재부정 시제로만 썼고 업체 수·오픈일 등 확인 안 된 숫자는 전혀 넣지 않았다. ④04(디지털 자산·계정 정산) 콘텐츠는 옛 섹션3(제목 "소중한 디지털 흔적에 안전한 마침표를 찍습니다")의 제목을 그대로 재사용하고 본문·불릿만 계정 정산으로 좁혀 새로 썼다 — 순수 신규 저작은 아니고 기존 문구의 부분 재활용이다. ⑤`BoxDetailOverlay`는 HomePage의 wheel-intercept 로직(섹션당 700ms 잠금 등)을 복붙에 가깝게 재구현했다 — 공통 훅으로 추출하지 않았다(범위상 우선순위 낮음으로 판단, 다음에 같은 패턴이 3번째로 필요해지면 추출 권고).
- **다음 에이전트가 알아야 할 것**: ①🔴 **`[Opus]`가 `00-23` §8을 이번 walkthrough 기준으로 재정합해야 한다** — 특히 §8.2(박스 항목 노출)·§8.5(레이아웃)·§8.1(범위: 이번에 01~05 섹션 자체를 삭제했으므로 "섹션 유지" 전제가 깨짐)이 실물과 어긋난 상태다. ②`domainSlides.tsx`의 `pickup`·`memorial` 항목은 03·05 실 서비스가 열리면(`03-02` §7.2, `05-01` §2.6 해소 시) `status: 'comingSoon'` → `'active'`로 바꾸고 `tab` 필드를 채우면 된다(현재 `tab` 없음 — 의도적, comingSoon은 클릭도 안 되므로). ③`FloatingEmergency.tsx` 삭제로 `/facility` 긴급 진입 경로가 하나 없어졌다 — 필요해지면 재도입 여부는 사장님 판단. ④임시로 띄운 `npm run dev`(포트 5174)는 확인 후 종료했다.

- **판정**: ✅통과 (히어로 축소·체크리스트 제거·옛 소개섹션 01~05 삭제 및 4박스 BoxDetailOverlay 슬라이드 7종 정상 렌더링 확인 / 03·05 comingSoon 배지 및 가짜 목록 배제 확인 / FloatingEmergency 제거 확인 / 프론트·백엔드 npx tsc --noEmit 에러 0건 확인 / harness-doctor 125개 항목 통과)

---

## 2026-08-18 (31) | [Sonnet] 메인화면 4박스 진입 목업 구현 — `00-23` §8

- **근거 스펙**: `docs/00_핵심플랫폼/00-23_메인화면_진입구조_개편_검토서.md` §8(§8.1 범위·§8.2 박스4개·§8.3 상태3종·§8.4 문구·§8.5 레이아웃·§8.6 상호작용·§8.7 금지·§8.8 범위밖) · `00-09` §2.3·§4(접근성 토큰·호버) · `00-06`(SCR-001 대상, 신규 화면 ID 없음).
- **건드린 파일**: `eobom/frontend/src/components/home/EntryBoxes.tsx`(신규) · `eobom/frontend/src/pages/HomePage.tsx`(import 추가, `currentUser`·`onOpenLogin` 구조분해 추가, `sections` 배열에 `entry-boxes` 항목 삽입, 섹션 0과 기존 섹션1 사이에 새 `<section>` 삽입, 이후 섹션 주석 번호 1~6칸씩 재정렬) · `eobom/frontend/src/index.css`(`.entry-boxes-grid` 반응형 규칙 — `@media (max-width: 767px)`에서 `grid-template-columns: 1fr !important`).
- **결과**: `SCR-001` 히어로 바로 아래에 4박스(①생전 준비 ②임종 및 사후 정리 — 1층 상중케어 단독강조+2층 5항목 ③Guest ④파트너) 삽입, §8.3 3단계 배지(진입/🟡미리보기 `#475569`·`#E2E8F0`/⬜준비중 `#94A3B8`·`#F1F5F9`, 앰버 미사용) 구현. `npx tsc --noEmit`(frontend·backend) 에러 0. 브라우저 실기동(Chrome, `https://localhost:5174`)으로 확인: ①전문가상담 클릭 → `/counseling` 이동 ②상중케어 클릭 → `/care-guide` 이동(로그인 불요) ③파트너로그인 클릭 → `/partner` 이동 ④엔딩노트(🔒) 클릭 → `onOpenLogin()` 기존 로그인 모달 오픈(비로그인 상태, `/ending-note`로 이동하지 않음 확인) ⑤디지털추모관·현물유품수거(준비중) 클릭 → 아무 동작 없음, `alert()` 미발생, 콘솔 에러 0(`read_console_messages` 확인) ⑥히어로 "5대 핵심 서비스 둘러보기" 버튼 클릭 → 코드 변경 없이 `scrollToSection(1)`이 새로 삽입된 4박스 섹션을 가리키게 됨(섹션 배열 재정렬 효과) — §8.6-5 충족. 반응형 3폭 확인: 데스크톱(1440px, 실제 창) 상단 2열(①②)+하단 2열(③④) / 태블릿(834px, 동일 origin iframe 프로브로 확인 — 아래 편차 참고) 동일 2열 / 모바일(375px, 동일 프로브) 1열 스택 ①→②→③→④, 가로스크롤 없음(`scrollWidth === clientWidth === 375` 확인).
- **편차**: ①**태블릿·모바일 스크린샷은 실제 OS 창 리사이즈가 아니라 동일 오리진 iframe 프로브로 확인했다** — `resize_window` 도구가 이 세션의 (최대화 상태로 추정되는) Chrome 창에 실제로 적용되지 않아(`window.innerWidth`가 요청한 폭으로 안 바뀜을 확인 후 대체 수단으로 전환) 임시 tab에 `<iframe style="width:834px/375px">`를 만들어 그 안에서 렌더링을 확인했다 — CSS 미디어쿼리는 iframe 자체 뷰포트 기준으로 정확히 평가되므로 시각적 검증은 유효하나, 실제 모바일 브라우저 창 리사이즈로 재현한 것은 아니다. ②**신규 4박스 블록을 `풀페이지 스냅스크롤의 새 섹션(section index 1)`으로 구현**했다 — §8.1은 "섹션 0과 섹션 1 사이에 삽입"이라고만 하고 스냅 섹션 여부를 명시하지 않았으나, §8.6-5(히어로 버튼이 이 블록으로 스크롤)가 기존 `scrollToSection(index)` 패턴과 맞물리게 하려면 자체 섹션이 되는 편이 기존 아키텍처와 가장 자연스럽게 맞았다. 이 섹션은 콘텐츠가 100vh보다 길어질 수 있어(특히 모바일 스택) 기존 섹션6(푸터)과 동일한 `overflowY:'auto'` 방어 패턴을 그대로 적용했다 — 단, **마우스 휠은 `.fullpage-viewport`의 전역 wheel 핸들러가 항상 가로채 섹션 단위로만 스크롤시키므로, 트랙패드/휠로는 섹션 내부 오버플로에 도달할 수 없고 실제 터치 스크롤(모바일)에서만 내부 스크롤이 동작한다** — 이건 기존 섹션6과 동일한 사전 존재 아키텍처 특성이라 이번에 새로 만든 문제는 아니지만, 프로브 확인 중 직접 재현되어 다음 에이전트를 위해 남긴다. ③§8.5 "항목은 버튼이 아니라 목록"을 리스트 행처럼 보이도록 스타일을 벗긴 네이티브 `<button>`으로 구현했다(disabled 시맨틱·키보드 접근성 확보 목적) — 시각적으로는 버튼 크롬이 없는 리스트 행이라 문구의 취지(버튼 UI 배제)는 지켰다고 판단. ④§8.4 문구 표에 없는 텍스트 2곳을 추가했다 — 임종 박스 1층 위에 "먼저 여기부터 보세요"(§4.2가 요구한 "단독 강조"를 시각화하기 위한 라벨), 각 진입 항목 행 우측의 화살표(`>`) 아이콘(클릭 가능함을 알리는 어포던스, 배지가 없는 "진입" 상태 항목에만 표시). 두 항목 모두 준비중 항목에 가짜 목록/숫자를 넣는 것과는 무관하며 제거해도 기능에 영향 없음.
- **다음 에이전트가 알아야 할 것**: ①🔵 **§6 미결 #3(박스 명칭)·#4(Guest 입력 방식)·#8(모바일에서 ①이 먼저인지)는 이 목업을 사장님이 보고 결정하는 항목이다** — 지금은 §8.4 문구 그대로(개발자 원문), §4.4 권고(링크 전체 붙여넣기, 비활성 고정), 개발자 원 순서(①②③④) 그대로 두었다. ②§8.8(목업 이후 범위) — 사이드바 라벨 통일, `00-06` 대장 갱신, Guest 입력창 활성화(05 구현 후), 모드 기억은 손대지 않았다. ③임시로 띄웠던 `npm run dev`(포트 5174, PID 37068)는 확인 후 종료해뒀다 — 다음에 다시 브라우저로 볼 때는 새로 띄워야 한다. ④`.entry-boxes-grid` 반응형 브레이크포인트는 `eobom/frontend/src/index.css` 맨 아래(`@media (max-width: 767px)`)에 있다.

- **판정**: ✅통과 (00-23 §8 4박스 구조 SCR-001 반영, 3단계 배지 및 진입/로그인 게이트 분기 동작 확인 / 프론트·백엔드 npx tsc --noEmit 에러 0건 확인 / harness-doctor 125개 항목 통과)

---

## 2026-08-18 (30) | [Opus] E-4~E-6 재분류(`00-18` §8.3) + `00-23` 메인화면 진입구조 개편 검토서 신설

- **근거 스펙**: ①walkthrough (29) *"다음 에이전트가 알아야 할 것"* ②③ — E-4~E-6 방치 시 §2류 결함 지적 + 마크다운↔TSX 이중 관리 지적. ②개발자 구상안(2026-08-18) — *"메뉴는 일단 그대로 두되, 메인 화면에서 생전 임종 게스트 파트너 이런식으로 버튼을 통해 접근하는게 어떨까"*. 대조한 정본: `00-02` §3.1·§3.2, `00_DOCS_INDEX` 도메인 번호 체계, `00-12` §6.2, `00-13` §6.1·§8, `00-14` §2.2·§2.3, `03-02` §7.2, `05-01` §2.6, `07-02` §3, `00-19` §3.4·§9-2, `00-06` §7.3. **실측**: `LoginModal.tsx`(소셜 3버튼 → 즉시 OAuth 리다이렉트), `grep "birth|age|연령|생년|14세"`(저장소 전체 **0건**), `HomePage.tsx`(풀페이지 스냅 섹션 0~6, `:255` *"5대 핵심 서비스 둘러보기"*).
- **건드린 파일**: **`docs/00_핵심플랫폼/00-23_메인화면_진입구조_개편_검토서.md`(신규)**, `docs/00_핵심플랫폼/00-19_개인정보처리방침_초안.md`(**§9-2-1 구현 스펙 신설**), `docs/00_핵심플랫폼/00-18_개인정보처리방침_및_이용약관_기획서.md`(**§8.3·§8.4 신설**), `docs/00_핵심플랫폼/00-22_법적_요구사항_체크리스트.md`(§0 건수·§E 전면 재작성), `docs/00_핵심플랫폼/00-02_이어봄_서비스_개요_및_기획서.md`(§3.1 🔵 블록), `docs/00_DOCS_INDEX.md`, `docs/작업일지_및_기록/260818.md`, `docs/작업일지_및_기록/에이전트_기록/claude_tasks.md`, `.harness/memory/context.md`
- **결과**:
  - **E-4~E-6 재분류 — (29)의 지적을 절반만 인정했다.** 기준은 **문장이 "지금 사실"인가 "나중의 약속"인가**(`00-18` §8.3 신설). **E-4**(*"만 14세 미만 가입을 받지 않습니다"*)는 **현재 시제 사실 주장**인데 연령 코드가 **0건**이라 지금 거짓 → 🔴 `00-14` §2류 인정. **E-5**(*"이전 버전을 보관합니다"*)·**E-6**(*"7일 전 공지합니다"*)은 **이행기(개정)가 아직 오지 않아 거짓이 아니다** — **이전 버전이 존재하지 않고 개정도 없었다.** *"약관에 탈퇴 시 처리한다고 적어두고 탈퇴자가 아직 없는 것을 결함이라 하지 않는 것과 같다"* 로 정리했다.
  - 🔴 **다만 진짜 위험은 "지금 거짓"이 아니라 "그때 잊는 것"** — §2가 여덟 번 겪은 실패가 그것이므로 **미루되 트리거를 못 박았다**(`00-18` §8.4 + `00-22` §E 동일 표): **v1.0 게시 직전 = E-4·E-5(a)·시행일 값 / 첫 개정(v1.1) 전 = E-5(b)·E-6.**
  - 🔵 **(29) ③(마크다운↔TSX 이중 관리)이 E-5를 앞당길 근거가 됐다.** E-5를 **(a)본문 데이터화+버전·시행일 메타 / (b)이전 버전 열람**으로 쪼갰고, **(a)는 "약속해서"가 아니라 "지금이 제일 싸서" v1.0 전 권고**로 올렸다 — (29) ③이 지적한 이중 관리와 **같은 작업**이고 **조문 38개인 지금이 가장 싸다**(외부 검토를 거치면 조문이 늘고 문장이 바뀐다). **(b)는 지금 만들면 빈 화면**이다.
  - **`00-19` §9-2-1 신설 — E-4 구현 스펙.** 🔴 **자기신고 방식 확정, 생년월일·연령대를 받지 않는다**: 생년월일 입력은 *"만 14세 미만을 막으려고 전 이용자의 생년월일을 수집"* 하는 셈이라 최소수집 원칙과 충돌하고 §3 수집 항목이 늘어난다. 소셜 연령대 수신은 **3사 중 일부만 제공 + 추가 동의라 거부 가능**해 정책으로 성립하지 않으며 그것도 수집이다. → *"보호를 위해 정보를 더 걷는 설계는 `00-16`(주민번호 미저장)·`05-01` §4.4(IP 원문 미저장)의 태도와 어긋난다"*. 구현 요구 4개(로그인 버튼 비활성 / 약관 동의와 분리 / 저장 안 함 / **데모 버튼에도 동일 게이트 — 우회 경로가 남으면 게이트가 아님**). **문장만으로 부족한 이유**도 명시 — 법이 만 14세 미만 처리 시 법정대리인 동의를 요구하므로 그 의무를 지지 않으려면 정책이 실제로 서 있어야 하고 **문장만 있고 게이트가 없으면 방패가 되지 않는다**(🔴 조문 번호는 `00-22` B-4에서 확인). B-4(위치정보법 §25 연령)와 달라도 **위치기반서비스가 잠금 상태이므로 가입 게이트는 만 14세로 먼저 세운다**로 선후를 갈랐다.
  - **`00-23` 신설 — 개발자 메인화면 4박스 구상 검토.** ✅ **방향 채택**: 새 아이디어가 아니라 **`00-02` §3.1이 08-12에 확정한 2모드 분리를 화면으로 처음 실현하는 것**이고, **`00-12` §6.2(모드 전환 UX 미결)의 답**이기도 하다 — 사이드바는 평면 목록이라 표현할 수 없었다.
  - 🔵 **Guest 분기는 개발자가 찾은 진짜 공백이다.** `00-13`이 링크 모델을 5안까지 비교했으나 **전부 "링크를 누르고 들어온 사람"만 가정**했고, **링크를 잃었거나 검색으로 들어온 조문객은 홈에서 갈 곳이 없다.** `00-13` §8 미결에도 없던 항목이다.
  - 🔴 **핵심 지적 — 제안된 9개 항목 중 지금 정직하게 열 수 있는 것은 5개다**(§3 실측표): 03은 **업체 0건**(`03-02` §7.2가 *"1건이라도 등록 전에는 준비 중"*), 05는 **SCR-011 미구현 + `Deceased` 미확정 + 사진 오픈 금지**(`05-01` §2.6), 04·06은 **목업**. 그대로 걸면 **`00-14` §2가 여덟 번 잡은 문제의 재발이고 §2.2(없는 제휴 업체 10곳)와 같은 종류**다. ✅ **해법은 이미 확정돼 있다** — §2.2의 *"지우지 말고 준비 중임을 명시"* 를 그대로 적용해 **3단계 표시**(진입 / 🟡미리보기 / ⬜준비중)를 권고했고, **그 표가 곧 로드맵**이 된다.
  - **수정 4건**: ①🔴 **로그인은 박스가 아니라 항목에** — *"막을 것은 쓰기이지 보기가 아니다"*. 특히 **07 체크리스트에 로그인을 걸면 `07-02`의 "한 줄이라도 남으려면 최상단" 원칙이 무너진다.** ②🔴 **유족 박스 6개 평면 나열이 `07-02` "판단 순" 원칙과 충돌** — **07은 나머지 5개와 동급이 아니라 상위 층**이어야 한다(개발자 안에서 07이 맨 위인 것은 맞으나 동급 첫 번째로 보이면 의미가 전달되지 않는다). ③🟡 **04가 생전 준비에서 누락** — `00_DOCS_INDEX`가 *"04는 한 주체가 시작해 다른 주체가 끝내는 것(승계 있음)"* 으로 확정했고 `04-02` 사전지정이 생전 절반이다. ④🔴 **Guest 입력창은 brute-force 표면** — `slug`가 추측 불가 토큰이고 `00-13` §6.1이 존재 은닉을 정했는데 입력창은 자동화 표면을 만든다 → 🟡 **토큰만 입력이 아니라 "받은 링크 전체 붙여넣기"**(사실상 URL 이동과 같아 표면이 늘지 않음) + **실패 메시지 통일** + 시도 제한.
  - **§5.3은 미결이 아니라 전제 조건으로 분류했다** — 사이드바 *"디지털 유품 정리"* ↔ `00-02` §3.2 *"디지털 자산·계정 정산"* 로 **라벨이 이미 어긋나 있다.** 메인 박스를 추가하면 같은 목적지로 가는 경로가 2개가 되는데 라벨이 다르면 다른 기능으로 오해한다(`00-14` §2.3 배지 번호와 같은 계열).
  - **§5.4 — 현행 풀페이지 스냅 섹션 1~5가 이미 도메인 5개를 소개하고 있어 박스를 넣으면 중복**이다. 🟡 **A안(히어로 아래 삽입, 섹션 유지)** 권고 — 박스는 *"어디로 갈지"*, 섹션은 *"무엇인지"* 로 역할이 갈린다. ⚠️ 다만 `HomePage.tsx:255` *"5대 핵심 서비스 둘러보기"* 버튼과 경쟁하므로 조정 필요.
  - **검증**: `bash .harness/tools/harness-doctor.sh` → **✅ 125개 항목 통과**(부팅 예산 내, 인덱스 링크 실존).
- **편차**: 없음(기획). 다만 **명시할 것 2가지** — ①**개발자가 붙여넣은 것은 E-4 구현용 `[Claude:Sonnet]` 프롬프트였으나 모드가 Opus였다.** `AGENTS.md` §0(*"사람이 `/model`을 직접 전환"*)·`CLAUDE.md`(*"Opus는 구현하지 않는다"*)에 따라 **구현은 하지 않고 모드 전환을 안내**했으며, 대신 같은 메시지에 담긴 **홈 개편안 검토(기획)를 수행**했다. ②**`00-23`은 개발자 제안의 절반을 수정하는 문서**라 톤을 신경 썼다 — **방향을 먼저 인정하고**(§2에서 이 제안이 기존 확정 IA의 실현임을 밝힘) **수정은 근거 문서를 달아** 제시했다. 특히 *"9개 중 5개만 열 수 있다"* 는 지적이 제안을 깎는 것처럼 읽히지 않도록 **§5.1에서 이미 확정된 해법(준비 중 명시)을 함께 제시**했다.
- **다음 에이전트가 알아야 할 것**: ①🔴 **E-4는 스펙이 완성됐고 `[Claude:Sonnet]` 착수만 남았다** — `00-19` §9-2-1. 프롬프트는 (30) 응답 말미에 있다. ②🔴 **`00-23`은 검토서이지 결정서가 아니다** — §6의 7개 중 **#1·#2(구조 채택·준비중 표기)만 정해지면 나머지가 따라온다.** ③⚠️ **§6 #6(라벨 통일)은 미결이 아니라 전제 조건**이다 — 안 맞추면 개편이 혼란을 더한다. ④**`00-23` 채택 시 `00-02` §3.1·§3.2와 `00-06`을 함께 갱신**해야 한다(§3.1에 🔵 블록으로 표시해 둠). ⑤**E-5(a)는 "지금 vs 외부 검토 후" 판단이 남아 있다** — 권고는 지금(§8.3). ⑥`reports/` HTML은 **`00-23` 신규 + `00-18`·`00-19`·`00-22`·`00-02` 재생성** 대기.

- **판정**: ✅통과 (E-4~E-6 시제별 재분류 및 트리거 명시 확인 / 00-19 §9-2-1 만14세 자기신고 게이트 스펙 확정 / 00-23 4박스 구조 검토서 신설 및 00-02·00-18·00-22 연계 갱신 확인 / harness-doctor 통과)

---

## 2026-08-18 (29) | [Sonnet] 법적 문서 화면 구현 — `/terms`·`/privacy` 신설 + Footer 정정 + GPS 자동 감지 중단 (E-1·E-2·E-3)

- **근거 스펙**: `docs/00_핵심플랫폼/00-22_법적_요구사항_체크리스트.md` §E-1~E-3. 본문 정본은 `docs/00_핵심플랫폼/00-19_개인정보처리방침_초안.md`(전 14조) · `docs/00_핵심플랫폼/00-21_서비스_이용약관_초안.md`(전 24조). 잠금 규칙 정본은 `00-21` §0.2. `[Claude:Opus]` 핸드오프 프롬프트(2026-08-18) 그대로 착수.
- **건드린 파일**:
  - `eobom/frontend/src/config.ts` — `LOCATION_BASED_SERVICE_REGISTERED` 상수 신설(현재 `false`)
  - `eobom/frontend/src/components/Footer.tsx` — KISA 문구 `<li>` 삭제, 이용약관·개인정보처리방침 `<li>`를 `<Link to="/terms">`·`<Link to="/privacy">`로 전환
  - `eobom/frontend/src/pages/FacilityPage.tsx` — `getCurrentPosition` 호출을 `LOCATION_BASED_SERVICE_REGISTERED` 플래그로 게이트, 폴백 배지 툴팁 문구를 상황에 맞게 분기
  - `eobom/frontend/src/components/legal/LegalDocLayout.tsx`(신규) — 법적 문서 공용 레이아웃(준비중 배너·`LegalArticle`·`LegalChapter`·`LegalList`·`LegalTable`)
  - `eobom/frontend/src/pages/TermsPage.tsx`(신규) — `00-21` 제1~18·22~24조 + 부칙. 제6장(제19~21조)은 플래그로 게이트
  - `eobom/frontend/src/pages/PrivacyPage.tsx`(신규) — `00-19` 제1~14조. 제3-6조(위치정보)는 같은 플래그로 게이트
  - `eobom/frontend/src/App.tsx` — `/terms`·`/privacy` 라우트 2개 추가
- **결과**:
  - **E-1**: `Footer.tsx:74`의 `"KISA 기준 최고 등급 보안 암호화"` `<li>` 항목을 대체 문구 없이 삭제. `1588-0000`(`:116` 부근)은 지시대로 그대로 둠. 삭제 이유·재발 방지 취지를 주석으로 남김.
  - **E-2**: `FacilityPage.tsx`의 `getCurrentPosition` 호출을 `if (LOCATION_BASED_SERVICE_REGISTERED && navigator.geolocation && window.isSecureContext)` 조건으로 감쌌다(기존은 `navigator.geolocation && window.isSecureContext`만). 플래그가 `false`인 지금은 항상 `else` 분기로 떨어져 `GEOLOCATION_FALLBACK`(37.4925, 127.0078)을 즉시 적용 — 브라우저 위치 권한 팝업 자체가 뜨지 않는다. 시/도·시/군/구 직접 선택(트랙 B, `handleDistrictChange`)과 `GEOLOCATION_FALLBACK` 폴백 경로는 그대로 남겨 기능 손실 없음. 폴백 배지 툴팁 문구를 플래그값에 따라 분기(자동 감지 비활성화 vs 브라우저 차단)해 원인 설명이 틀리지 않게 함.
  - **E-3**: `/terms`·`/privacy` 라우트 신설. 본문은 `00-19`/`00-21` 마크다운의 법정 조항을 그대로 옮기되, 문서 내부용 편집자 주(🔴/🟡/✅ 표시, "근거:" 각주, `> 블록`의 내부 코멘트)는 화면에 넣지 않았다 — 이용자에게는 조문만 노출. 미확정 칸(추모관 보존기간·클라우드 사업자·시행일 등)은 "추후 공지"로 중립 표기, 값을 임의로 채워 넣지 않았다. 제6장(위치기반서비스, 제19~21조)과 개인정보처리방침 제3-6조(위치정보)는 `LOCATION_BASED_SERVICE_REGISTERED`가 `false`인 동안 컴포넌트 트리에서 아예 렌더링되지 않도록 조건부 처리 — 잠금 규칙(§0.2 "조문과 기능은 한 쌍") 그대로 구현.
  - **검증**:
    - `cd eobom/frontend && npx tsc --noEmit` → 에러 0
    - `cd eobom/backend && npx tsc --noEmit` → 에러 0(이번 변경은 프론트 전용이나 완료 조건에 포함되어 재확인)
    - 이미 떠 있던 dev 서버(포트 5000·5173, 세션 시작 시점부터 기동 중이던 것 — 죽이지 않고 그대로 사용)에 Claude-in-Chrome으로 접속해 실기동 확인:
      - `https://localhost:5173/terms` 진입 → `get_page_text`로 전문 대조 — 제5장(제18조) 다음 바로 제7장(제22조)으로 이어짐을 확인, **제6장(제19~21조)이 렌더링되지 않음**
      - `https://localhost:5173/privacy` 진입 → `get_page_text`로 전문 대조 — 제3-5조 다음 바로 제4조로 이어짐을 확인, **제3-6조(위치정보)가 렌더링되지 않음**
      - `https://localhost:5173/facility` 진입 후 `read_network_requests`(urlPattern `/api/geo`) 확인 → `GET https://localhost:5000/api/geo/reverse?lat=37.4925&lng=127.0078` 단 1건(200) — **`GEOLOCATION_FALLBACK` 고정값과 정확히 일치**, 실제 GPS 좌표가 전송된 적 없음을 재현 확인
      - Footer에서 `find`로 `"서비스 이용약관"` 링크(`href="/terms"`) 탐지 → 클릭 → `/terms`로 실제 이동 확인
      - Footer "보안 & 약관" 열 스크린샷으로 KISA 문구 부재·`1588-0000` 잔존을 육안 확인
      - `read_console_messages`(onlyErrors: true) → 콘솔 에러 0건 (`/terms`·`/privacy`·`/facility` 재방문 후)
- **편차**: 없음. 지시받은 E-1·E-2·E-3 범위를 그대로 구현했고 E-4~E-9는 손대지 않았다. 다만 두 가지는 지시에 없던 판단이라 명시한다 — ① `LegalDocLayout.tsx` 공용 컴포넌트를 새로 만들었다(지시에는 없었으나 두 페이지가 같은 배너·표·조항 스타일을 반복해서 썼음). `docs/`는 건드리지 않았다. ② 폴백 배지 툴팁 문구를 플래그 조건부로 분기했다(원 문구가 "https/localhost 차단"이라는, 지금은 사실이 아닌 이유를 댔기 때문 — 최소 수정으로 문구만 정정, 배지 자체의 존재·조건은 그대로).
- **다음 에이전트가 알아야 할 것**: ①🔴 **`LOCATION_BASED_SERVICE_REGISTERED`가 이 세션에서 유일한 스위치다** — `config.ts`에 있다. 위치정보법 신고 완료가 실제로 확인된 뒤에만 `true`로 바꿀 것(`00-14` §2.10·§A-3). 바꾸는 순간 `TermsPage`·`PrivacyPage`·`FacilityPage` 세 곳이 동시에 재개된다 — 하나만 따로 켜지 않는다. ②E-4(만 14세 미만 가입 고지)·E-5(버전 관리)·E-6(개정 사전 공지)는 아직 미착수 — `00-19`·`00-21` 본문이 이미 그 기능이 있다고 서술하므로, 다음 사이클에서 반드시 이어서 처리할 것(안 하면 그 자체가 `00-14` §2류 결함이 된다). ③`/terms`·`/privacy`는 콘텐츠가 마크다운에서 TSX로 손으로 옮겨진 것이라, `00-19`/`00-21` 문서가 갱신되면 **화면도 같이 고쳐야 한다** — 자동 동기화가 아니다. E-5(버전 관리) 착수 시 이 이중 관리 문제를 함께 풀 것을 권한다. ④디자인은 시니어 접근성 토큰(`00-09` §2.3, 18px/1.7)을 상속하는 전역 스타일을 그대로 썼고 별도로 낮추지 않았다. ⑤테스트에 사용한 dev 서버는 세션 시작 시점부터 이미 떠 있던 프로세스라 종료하지 않고 그대로 두었다.

- **판정**: ✅통과 (LOCATION_BASED_SERVICE_REGISTERED 플래그 분기 정상 작동 확인 / TermsPage·PrivacyPage 신설 및 제6장/제3-6조 잠금 렌더링 검증 / Footer KISA 제거 및 링크 연결 확인 / 프론트·백엔드 tsc 에러 0건 / harness-doctor 통과)
- **🔵 `[Opus]` 후속 판단 (2026-08-18)**: 이 항목 "다음 에이전트가 알아야 할 것" ②의 지적(*"E-4~E-6을 방치하면 `00-14` §2류 결함"*)에 대해 **E-4만 인정하고 E-5·E-6은 재분류**했다 — **문장이 *"지금 사실"* 인가 *"나중의 약속"* 인가로 갈랐다**(`00-18` §8.3 신설). E-4는 *"가입을 받지 않습니다"* 라는 **현재 시제 사실 주장인데 연령 코드가 0건이라 지금 거짓**이고, E-5·E-6은 **이행기(개정)가 아직 오지 않아 거짓이 아니다**. 다만 **③(마크다운↔TSX 이중 관리) 지적이 E-5를 앞당길 근거가 됐다** — E-5를 (a)본문 데이터화·버전 메타 / (b)이전 버전 열람으로 쪼개고 **(a)는 "약속해서"가 아니라 "지금이 제일 싸서" v1.0 전 권고**로 올렸다. 트리거는 `00-18` §8.4 · `00-22` §E.

---

## 2026-08-18 (28) | [Opus] `00-19` 사장님 검토 반영 + 🔴 위치정보 결함 발견(2-9) + `00-20` 추모관 보존정책 신설

- **근거 스펙**: 사장님 `00-19` 검토 회신 6항목(2026-08-18) — ①총칙 사업자 정보 ②*"장사시설 도메인에서 위치정보 나오는데 그것은 수집에 해당하지 않는가 검토해줘"* ③*"추모관을 폐쇄하는 기준을 만들어야할 거 같아 (…) 3개월이면 충분 (…) 사용자에게 결정하게 할 것인지"* ④6·7조 클라우드·국외이전 보류 ⑤9-2 권고대로 ⑥12조 보호책임자. 발주 정본은 `00-19` §0. **실측 대상**: `eobom/frontend/src/pages/FacilityPage.tsx`, `eobom/backend/src/controllers/geoController.ts`, `eobom/backend/src/routes/geoRoutes.ts`. 대조한 정본: `security.md` §4, `01-02` §2.2, `00-13` §2·§4.5·§7.2-3, `05-01` §2.6·§8-1·§3.3, `05-02` §11, `00-12` §2.1·§2.3, `01-05` §7.3, `00-02`.
- **건드린 파일**: **`docs/00_핵심플랫폼/00-20_추모관_보존기간_및_폐쇄정책_검토서.md`(신규)**, `docs/00_핵심플랫폼/00-19_개인정보처리방침_초안.md`(§0 편집자 주 전면 개정·제1조·**제3-5조 정정**·**제3-6조 신설**·제4조·제6조·제7조·제9-2조·제12조·부록), `docs/00_핵심플랫폼/00-14_사장님_논의_안건_정리.md`(§1 표·**§2.7 신설**·§4-3·§9 진행표), `docs/00_DOCS_INDEX.md`(`00-19` 보강 + **`00-20` 신규행**), `docs/작업일지_및_기록/260818.md`, `docs/작업일지_및_기록/에이전트_기록/claude_tasks.md`, `.harness/memory/context.md`
- **결과**:
  - **확정 4건 반영.** 제1조 **(주)삼일정보시스템 / 이권형 / 전남광주통합특별시 광산구 하남산단8번로 177, 6층**. 제12조 **윤현우 / 개인정보 담당자 / 070-8856-2725 / yhw@samil25.co.kr** → **`00-18` §8.1 게이트 #3이 닫혔다.** ④⑤⑥(탈퇴 후 1년·접속기록 1년·방명록 삭제 후 3개월·만 14세 미만) **권고값대로 확정** — 🟡 표시를 ✅로 바꿨다. ⑦(클라우드·국외이전) **보류가 확정**이므로 게이트에서 "대기"가 아니라 "확정된 보류"로 표기했다. 🟡 **제12조에 단서를 남겼다** — 화면 `1588-0000`은 개발자 방침대로 두되 **처리방침에는 실연락처가 들어갔으므로 법정 요건은 충족**되고, 다만 **이용자가 두 번호를 다르게 보면 혼란**이므로 실번호 확정 시 함께 정리를 권고.
  - 🔴 **가장 중요한 결과 — 사장님 지적으로 새 결함 발견. `00-14` §2.7에 2-9로 등재했다.** *"수집하지 않는다"* 로 쓰려던 것을 **검토 지시가 막았고, 실측해보니 실제로 수집하고 있었다.** 그대로 갔으면 **처리방침 자체가 허위 기재**가 될 뻔했다 — **법적 문서에서 `00-14` §2와 같은 실수를 할 뻔한 것.**
  - **실측 4단계**: ①`FacilityPage.tsx:102-106` 화면 진입 즉시 `navigator.geolocation.getCurrentPosition()`으로 **정확한 GPS 좌표 취득** ②`FacilityPage.tsx:115` **그 좌표를 이어봄 백엔드로 전송**(`GET /api/geo/reverse?lat=..&lng=..`) ③`geoController.ts:68-69` **백엔드가 좌표를 카카오 API로 재전송**(`dapi.kakao.com/v2/local/geo/coord2address.json`) ④`geoController.ts:80` **DB 저장은 없음** — 지역명만 응답. **→ *"저장하지 않는다"* 는 맞지만 *"수집하지 않는다"* 는 틀리다. 위치정보법의 규율 대상은 취득·이용·제공이고 저장은 그중 하나일 뿐이다.**
  - 🔴 **2-9는 앞의 8건과 방향이 반대여서 더 위험하다는 점을 §2.7 첫 표로 세웠다.** 2-1~2-8은 **화면이 약속했는데 실체가 없음**(과장·미이행)이고, **2-9는 실체가 있는데 고지가 없음**(법령 위반 소지)이다. **전자는 이용자가 기대했다 실망하는 것이고 후자는 이용자가 모르는 채로 이미 일어난 것.** 전수조사가 **화면 문구만 훑고 실제 동작을 안 봤기 때문에** 8번을 반복하는 동안 이걸 못 봤다.
  - **함께 드러난 문제 3가지**: ①**이어봄이 별도 고지·동의를 받지 않고 브라우저 권한 팝업에 전적으로 의존** — 그것은 OS/브라우저에 대한 동의이지 이어봄에 대한 동의가 아니다 ②`useEffect(..., [])`라 **이용자가 요청하지 않았는데 화면 진입 즉시** 발생 ③**카카오 제3자 전달이 어디에도 고지돼 있지 않음.**
  - ✅ **해결책이 이미 구현돼 있다는 것이 결정적 발견이다.** `security.md` §4·`01-02`가 트랙 A/B를 갈라두고 *"트랙 B를 실서비스 기본 경로로"* 라고 이미 정했는데, **트랙 B(`GET /api/geo/regions` — 실제 보유 시설 주소에서 시/도→시/군/구 추출)가 이미 만들어져 있고 화면 선택 UI도 있으며 GPS 실패 폴백(`GEOLOCATION_FALLBACK`)도 동작 중**이다. → 🟡 **A안(트랙 A 제거) 권고**, 근거는 *"위법이라서"* 가 아니라 **"얻는 것보다 드는 것이 크다"** — 자동 감지가 아껴주는 건 *"지역 한 번 고르기"* 인데 대가는 **위치기반서비스 사업자 신고 2~4주 + 동의 UI + 처리방침 절 + 카카오 전달 고지**다. **`01-03`(견적비교) 때와 같은 판단 구조** — 기능 하나를 접으니 논점 다발이 사라진다. ⚠️ **제거 대상은 `getCurrentPosition` 호출뿐**이고 `geocode`(사용자가 직접 고른 지역명→좌표)는 개인위치정보가 아니라 남아도 된다는 점을 명시했다.
  - **`00-19` 제3-5조에서 위치정보 행을 빼고 제3-6조를 신설**했다(현행 사실 기준 표 + 🔴 미확정 표시). 제6조 위탁 표에 **카카오(주) 행 추가**.
  - **`00-20` 신설 — 사장님 질문에 대한 답. 🔴 전제부터 정정했다: "하나의 숫자로는 못 정한다."** 질문은 *"3개월이냐 장기냐"* 한 축인데 실제로는 **세 축이 겹쳐 있다**. ①**부고(07) ↔ 추모(05)는 수명이 정반대** — `00-13` §2가 이미 *"부고 시기와 추모 시기의 링크 요구가 정반대"* 라고 진단했고 **보유기간도 정확히 같은 구조**다. **사장님의 "3개월"은 부고장 쪽으로는 정확하며, 틀린 것은 숫자가 아니라 둘을 같은 것으로 본 것**이다(E안이 이미 갈라놨으므로 여기서 다시 합칠 이유가 없다). ②**텍스트 ↔ 사진은 비용이 두 자릿수 차이** — 방명록 10건이 수 KB, 사진 10장이 수 MB~수십 MB. **"스토리지 비용"의 실체는 사진 하나**이고 **텍스트는 사실상 영구 보존해도 된다.** *"1년 뒤 추모관을 지웁니다"* 는 잔인하지만 *"사진을 축소본으로 보관합니다"* 는 받아들여진다. ③🔴 **유족 ↔ 조문객은 권리 주체가 다르다** — 방명록의 `authorName`은 **비회원 조문객의 개인정보**이고, **유족이 "영구 유지"를 골랐다고 조문객 정보를 영구 보관할 권한이 생기지 않는다.** 해법은 **일정 기간 후 작성자명 축약**(`01-05` §7.3 마스킹 패턴 재사용) — 조문록의 가치는 *"누가 왔는지"* 보다 메시지와 규모에 있다.
  - ❌ **3개월 기각 근거를 "한국 상례의 리듬"으로 잡았다** — 49재(약 7주)·백일까지는 통과하지만 **첫 기일(1년) 직전에 닫힌다.** 🔴 **유족이 1년 만에 다시 왔는데 사라져 있는 것**은 이 도메인에서 *"고인을 두 번 잃는 것"* 으로 받아들여진다. **1년 권고는 임의의 숫자가 아니라 첫 기일을 지나는 최소 기간**이고, 만료 30일 전 통지를 넣으면 실질 13개월이 된다.
  - 🟡 **"사용자에게 결정하게 할 것인가"에 대한 답: 예, 단 시점이 전부다.** **개설 시점에 물으면 안 된다** — ①장례 이틀째에 *"1년 뒤에도 볼 것 같나"* 를 판단할 수 있는 사람은 없고 ②*"3개월"* 을 고르는 행위 자체가 **고인을 3개월짜리로 값매기는 느낌**을 주며 ③6070 페르소나에서 **선택지는 배려가 아니라 장벽**이다. **11개월 뒤에 물으면 세 문제가 전부 사라진다** — 판단 가능한 상태이고, *"계속 두시겠습니까"* 는 **더하는 질문**이지 값매기는 질문이 아니며, 실제 사용 여부를 본인이 안다. 🔴 **연장은 통지 링크 1클릭이어야 하고, 연장 실패로 사라지는 추모관이 생기면 정책이 아니라 사고**다.
  - 🟡 **핵심 권고 — 만료 시 삭제가 아니라 "동결".** `00-13` §7.2-3의 아이디어를 정식 권고로 승격했다. **비용은 "보관"이 아니라 "살아 있음"에서 나온다** — 동결하면 쓰기 0·모더레이션 0·스토리지는 축소본으로 대체 가능한데 **유족에게는 "남아 있다"가 지켜진다.** 3단계(활성 1년 → 동결 → 파기)로 정리하고, 🟡 **동결 후 N년은 지금 정하지 말 것을 권고**했다 — 최초 파기가 오픈 후 최소 1+N년 뒤라 급하지 않고, **지금 정하면 근거 없는 숫자**가 된다.
  - 🔴 **"폐쇄 기준"은 기간이 아니라 목록이라는 것을 §6에서 세웠다.** 4종 중 ①개설자 닫음(`closedAt`) ②신고(`reportedAt`)는 구현돼 있고, ③보존기간 만료 ④**개설자 계정 소멸(탈퇴·사망)** 은 없다. 🔴 **④가 가장 놓치기 쉽다 — "추모관 개설자도 언젠가 죽는다. 이어봄에서 이건 가정법이 아니라 사업 그 자체다."** 배우자가 개설한 추모관에서 그 배우자가 사망하면 **연장 통지를 받을 사람이 없고 자녀가 이어받을 경로도 없다**(`createdByUserId`는 단일 FK이고 `Lead.userId`와 달리 `SetNull`도 아니다). 🟡 공동 관리자 권고하되 **`Deceased` 확정에 걸리므로 등재에서 멈췄다**(`05-02` §11로 올림).
  - **구현이 작다는 것도 적었다** — `Memorial.expiresAt`·`frozenAt` **필드 2개 + 쓰기 가드 + 배치**. `Partner.partnerType`과 같은 *"기본값으로 무해하게 축을 하나 더한다"* 패턴 3회차. ⚠️ **`frozenAt` 가드를 방명록·헌화·사진 3경로에 전부 걸어야 하고 한 곳만 빠져도 동결이 아니다** — `00-15` §3의 *"조용히 깨지는"* 유형.
  - **검증**: `bash .harness/tools/harness-doctor.sh` → **✅ 124개 항목 통과.** 실측 재현 명령: `Grep "geolocation|getCurrentPosition" eobom/frontend/src`, `Read geoController.ts:60-85`.
- **편차**: 없음(기획). 다만 **발주 범위를 넘어선 것이 2건**이라 명시한다 — ①**위치정보는 사장님이 *"검토해줘"* 라고만 하셨는데 `00-14` §2 안건으로 등재까지 했다.** 처리방침 한 조를 고치고 끝낼 수도 있었으나, **실측 결과가 "고지 누락"이 아니라 "신고 대상 기능을 신고 없이 운영 중"이어서 처리방침의 문제가 아니라 제품의 문제**였다. ②**`00-20`을 별도 문서로 만든 것** — 의견만 답할 수도 있었지만 **세 축 분해·동결·개설자 사망 항목이 대화로 흘려보내기엔 아까웠고**, `00-14` §4-3이 원래 문서를 요구하던 안건이다. 그리고 🔴 **`00-20` §3의 상례 리듬(49재·첫 기일·탈상)은 일반 상식 기반 서술**이라 **`AGENTS.md` §6 기준으로 외부 확인을 거치지 않았다** — 권고의 뼈대이므로 필요하면 검증 대상이다.
- **다음 에이전트가 알아야 할 것**: ①🔴 **2-9(위치정보)가 지금 가장 급한 건이다.** 다른 미결과 달리 **이미 일어나고 있는 일**이고, 🟡 A안(제거)은 **커밋 1회**다. 🔵 사장님·개발자 확정 필요. ②🔴 **`00-19` 게시 블로커는 이제 2건뿐** — 추모관 보유기간(`00-20` 확정 대기)과 위치정보(2-9). **나머지는 다 찼거나 보류가 확정됐다.** ③🔵 **`00-20`에서 사장님께 필요한 결정은 실질적으로 2개** — *"활성 1년"* 과 *"만료 시 동결(삭제 아님)"*. 나머지는 따라온다. ④🔴 **`00-20` §6.1(개설자 계정 소멸)은 이 문서에서 가장 큰 미완**이고 `Deceased` 확정에 걸린다 — `05-02` §11에 올렸으니 **`Deceased` 사이클에서 반드시 함께 볼 것.** ⑤**`00-19` 제9-2조(만 14세 미만)는 문구가 확정됐으므로 이제 `[Sonnet]` 구현 의무가 생겼다** — 가입 화면 고지가 없으면 **처리방침이 거짓말이 된다.** ⑥`reports/` HTML은 **`00-20` 신규 + `00-19`·`00-14` 재생성** 대기. ⑦사전조사 파일 `memory/project/00-14-2차-잔여-착수준비.md`는 **여전히 삭제 대기**.

- **판정**: ✅통과 (00-20 추모관 1년/동결 정책 신설 및 상례 주기 대조 확인 / 00-19 사장님 확정 4건 반영 및 제3-6조 위치정보 결함 2-9 신설 확인 / 00-14 §2.7 연계 대장 등재 확인 / harness-doctor 통과)

---

## 2026-08-18 (27) | [Opus] `00-18` §11 작성방법 신설 + `00-19` 처리방침 v0.9 초안 신설

- **근거 스펙**: 개발자 확정·질문 2건(2026-08-18) — ①*"KISA 문구 아예 제거. (추후 관련 보안 내용 있다면 추가가능)"* ②*"서비스 이용약관 및 개인정보 처리방침을 만들어서 클릭시 볼 수 있도록 구현해야함. 약관 및 방침을 어떻게 만들지...? 너가 작성해 줄 수 있는가? 표준 양식이 있는건가?"* + 후속 지시 *"1. 가짜 번호 그대로 두기, 만약 번호가 확정되면 내가 직접 코드에서 수정 가능. 2. 초안 작성 ㄱㄱ"*. 발주 정본은 `00-18` §9 #1·§11.5. 대조한 정본: `00-18` 전문, `00-17` §3.1·§3.2·§4.1, `01-05` §7, `00-16`, `05-01` §4.4, `00-14` §4-3, `00-11` §8-1, `security.md` §4. **실측 대상**: `eobom/backend/src/**`(쿠키·IP 처리), `eobom/frontend/src/**`(스토리지·분석도구), `memorialController.ts:30-35`.
- **건드린 파일**: **`docs/00_핵심플랫폼/00-19_개인정보처리방침_초안.md`(신규)**, `docs/00_핵심플랫폼/00-18_개인정보처리방침_및_이용약관_기획서.md`(§1 표 1행·§2.3 확정 블록·**§11 신설**·§9 #1·§10), `docs/00_핵심플랫폼/00-14_사장님_논의_안건_정리.md`(§2.6 하단 확정 표), `docs/00_DOCS_INDEX.md`(`00-18` 설명 보강 + **`00-19` 신규행**), `docs/작업일지_및_기록/260818.md`, `docs/작업일지_및_기록/에이전트_기록/claude_tasks.md`, `.harness/memory/context.md`
- **결과**:
  - **개발자 확정 2건 기록.** **2-7 = 대체 문구 없이 아예 제거** — `00-18` §2.3이 권고한 *"전송구간 및 비밀번호 암호화 적용"* 보다 **한 단계 보수적**이고 이쪽이 낫다고 판단해 그 이유를 적었다: **대체 문구도 "지금 사실인 것"이라 범위가 바뀌면 다시 대조해야 하는 부채인데, 빈칸은 부채가 되지 않는다.** *"추후 관련 보안 내용 있다면 추가 가능"* 은 **이 프로젝트에서 처음으로 "실체가 먼저, 화면이 나중"이 된 사례**라는 점을 §2.3에 남겼다. **2-8 = 현행 유지 확정**(번호 확정 시 개발자 직접 수정). 🟡 **다만 화면과 처리방침 제12조는 다른 요구**라는 점을 `00-19` 제12조에 명시했다 — 화면은 그대로 둬도 되지만 **보호책임자 연락처는 법정 필수 기재사항이라 실연락처가 반드시 필요**하다.
  - **`00-18` §11 신설 — 개발자 질문(*"표준 양식이 있는가"*)에 대한 답. 핵심은 "둘의 사정이 완전히 다르다"이다.** ✅**처리방침은 양식이 있는 정도가 아니라 「개인정보 보호법」 §30 ①이 기재사항을 법으로 열거**하고 **시행령 §31**이 추가하며, **개인정보보호위원회「개인정보 처리방침 작성지침」(2025.4)** 이 항목별 작성례까지 준다 → **베낄 수 있고 우리는 빈칸만 채운다.** ❌**약관은 법정 양식이 없다** — 공정위 **표준약관**은 업종별이고, 규제 방식이 *"이걸 써라"* 가 아니라 **약관규제법의 *"이건 쓰면 무효다"*(소극)** 다 → **내용이 사업 결정이라 못 베낀다.** 🔴 **표준약관이 이어봄에 안 맞는 결정적 이유를 §11.4 표로 세웠다**: 표준약관은 ①소비자 과금 ②2자 구조 ③본인이 쓰다 해지를 전제하는데 이어봄은 ①무과금(수익은 사업자 수수료) ②3자 ③**본인이 죽고 유족이 이어받는다.** **표준약관은 이용자가 죽는 상황을 상정하지 않는데 이어봄의 사업 자체가 거기다** — §7.2 ⑦에 *"베낄 원본이 없다"* 고 적은 이유가 이것으로 확정됐다. **→ 순서 확정: 처리방침이 먼저.**
  - 🟡 **§11.3에서 §6의 "빈칸 4개"를 다시 뜯어 무게를 갈랐다.** 4개가 같은 무게가 아니었다 — **회원 탈퇴는 `[Opus]` 문장화 가능**(스키마가 이미 답을 가짐), **접속기록·방명록 파기는 권고값 제시 가능**, 🔴 **추모관 보존기간만 사장님**(`00-14` §4-3, 수익 모델과 묶임). **즉 진짜 블로커는 2개(추모관 보유기간·보호책임자)이고, 그중 판단이 필요한 것은 1개뿐**이다. 🔴 **보호책임자는 2-8과 한 뿌리**임을 §11.3에 못 박았다.
  - **`00-19` 신설 — 이 저장소에서 성격이 다른 첫 문서다.** 다른 `docs/`는 *"AI가 읽고 고치는 기획 본문"*(`AGENTS.md` §7)인데, **`00-19`는 본문이 그대로 `/privacy` 화면에 나가는 게시 예정 정본**이다. 그래서 문서 머리에 **성격 구분**(설계 근거는 `00-18`, 게시할 문장은 `00-19`)과 🔴 **게시 금지 경고**를 박았다. 법 §30① 기준 **전 14조** 구성.
  - 🔵 **§0 편집자 주 — 사장님이 본문을 다 읽지 않아도 되게 만든 것이 이 문서의 실용적 핵심이다.** 회신 필요 6건을 표 하나로 모으고, **④⑤⑥은 🟡 권고값을 이미 채워 넣어 *"이대로 갑시다"* 만 하면 되게** 했다. 🔴 **실질 블로커는 ①보호책임자 ②추모관 보유기간 ③사업자 상호·주소·대표자 3건이고, 그중 ①③은 사실 확인이라 판단이 필요한 것은 ② 하나**다.
  - ✅ **작성 중 코드 실측으로 확인된 유리한 사실 3가지 — 예상보다 좋았다.** ①**쿠키 미사용**: `eobom/backend/src` 전체에 `cookie`·`httpOnly`·`sameSite` **매치 0건**(재현: `Grep "cookie|Cookie|httpOnly|sameSite"` → No matches). 토큰은 프론트 `localStorage`(`App.tsx:38·163`, `AdminPage.tsx:33·82`)에만 있고 **서버가 별도 수집하지 않는다.** ②**제3자 분석·광고 도구 0건**: `gtag|googletagmanager|analytics|facebook|hotjar|amplitude|mixpanel` 프론트 전체 검색 결과 **유일한 히트가 `mockData/digitalEstate.json`의 "페이스북(Facebook)" 서비스명 문자열**이라 도구가 아니다 → **행태정보 수집 절 자체가 불필요.** ③**비회원 IP 원문 미저장**: `memorialController.ts:32-35` `hashVisitor`가 `sha256(visitorToken:ip)`로 **즉시 해시**한다(`05-01` §4.4 설계대로 구현됨). **일반적인 처리방침에서 가장 길고 지저분한 쿠키·행태정보 절이 전부 *"사용하지 않습니다"* 로 끝난다** — 사별·유언 서비스에서 *"추적하지 않는다"* 는 마케팅 문구가 아니라 **사실**이라 §0.1에 신뢰 재료로 세웠다. 🔴 **단 "지금 사실"이므로 분석 도구를 하나라도 붙이면 처리방침을 먼저 고쳐야 한다**고 단서를 달았다.
  - **제3-5조 「수집하지 않는 정보」를 별도 조로 세운 것이 이 초안의 설계 판단이다.** 표준 목차에 없는 조인데, `00-16`(주민등록번호는 **동의로도 처리 불가**)·`04-01` §3.3(서류 미저장)·무과금 구조가 **전부 "안 받는다"라는 강점**인데 표준 목차대로만 쓰면 **어디에도 안 적힌다.** 🔴 GPS는 `security.md` §4 트랙 A 제거 여부가 미확정이라 **🔴 표시로 남겼다.**
  - **고인 정보(제3-3조)**: *"「개인정보 보호법」상 살아 있는 개인에 관한 정보가 아니므로 법률상 개인정보에 해당하지 않는다. 그러나 유족의 정보와 밀접하게 결합되어 있고 성격이 매우 민감하므로 **이 처리방침의 모든 보호 조치를 동일하게 적용한다**"* 로 명문화 — `00-18` §3.3 ②의 권고를 문장으로 확정했다.
  - 🔴 **제9-2조(만 14세 미만)에서 새 결함 후보를 발견해 🔴로 남겼다** — 권고 문장은 *"만 14세 미만의 회원 가입을 받지 않습니다"* 인데, **현재 코드에 연령 확인 절차가 없다.** 소셜 로그인만으로 가입되므로 기술적으로 가입 가능하다. **이 문장을 그냥 쓰면 그 자체가 `00-14` §2류(화면이 약속했는데 뒷받침 없음) 결함이 된다.** 🟡 방명록은 비회원도 쓸 수 있어 완전 차단이 불가능하므로 **"가입을 받지 않는다"까지만 쓰는 것이 정직**하다고 적었다.
  - **제10조(안전성 확보조치)에는 "실제로 하고 있는 것"만 적었다** — 비밀번호 암호화·전송구간 암호화·토큰 암호화 저장·DB 외부 접근 차단. **저장 데이터 추가 암호화·백업 체계는 계획 단계라 뺐고**, 그 이유를 *"2-7에서 KISA 문구를 삭제한 것과 같은 원칙"* 이라고 조 안에 적었다.
  - **제14조 3항(이전 버전 보관)에 구현 단서를 달았다** — `00-18` §8.2 #2가 안 되면 **이 문장 자체가 지키지 못하는 약속**이 된다.
  - **검증**: `bash .harness/tools/harness-doctor.sh` → **✅ 123개 항목 통과.** 인덱스의 `00-19` reports 칸은 **"⏳ `[Gemini]` 생성 대기"**(doctor §5). **`00-18` 칸은 Gemini가 이미 실경로로 교체해 둔 상태여서 건드리지 않고 설명만 보강**했다.
- **편차**: 없음(기획). 다만 **`00-19`는 이 저장소의 문서 분류에 없던 종류**라 명시한다 — `AGENTS.md` §7은 `docs/`를 *"AI가 읽고 고치는 기획 본문"* 으로 정의하는데, **`00-19`의 본문은 사람이 읽는 게시물**이다. `reports/`로 보내는 것도 맞지 않는다(거기는 Gemini 소유의 시각화이고, 이건 **정본**이다). **`docs/`에 두되 문서 머리에서 성격을 갈랐다.** 규칙 개정이 필요한지는 판단하지 않았고, **`00-18` §8.2 #2(버전 관리 구현)가 정해질 때 함께 볼 문제**로 남긴다. 그리고 **§11의 법령·지침 서술은 웹 조사 기반**이라 `AGENTS.md` §6대로 **확인 기준일(2026-08-18)을 명시하고 출처 링크 3건을 본문에 남겼다** — 게시 직전 재확인 필요.
- **다음 에이전트가 알아야 할 것**: ①🔴 **`00-19`는 v0.9이고 게시 금지다.** §8.1 게이트 5개 통과 시 v1.0. **빈칸인 채로 걸면 필수 기재사항 누락**이다. ②🔵 **사장님께 드릴 질문은 `00-19` §0 표 6줄이 전부**다 — 본문을 다 읽으실 필요가 없게 만든 것이 의도이므로, **회의 때 §0만 펴면 된다.** ③✅ **약관 초안(단계 3)은 `00-19`를 기다리지 않고 지금 착수 가능**하다 — §7.2의 9개 조항이 이미 배치돼 있고 **새로 판단할 것이 아니라 문장화하는 일**이다. 🔴 단 ⑦(사망 후 계정)만은 원본이 없어 시간이 걸린다. ④🔴 **`00-19` 제9-2조(만 14세 미만)는 새 결함 후보**다 — 연령 확인 절차가 없으므로 **문장을 확정하려면 가입 화면 고지가 선행**돼야 한다. `00-14` §2에 등재할지는 개발자 판단으로 남겼다. ⑤🔴 **§0.1의 "좋은 소식 3가지"는 지금 사실일 뿐**이다 — **분석 도구·쿠키를 하나라도 도입하면 처리방침을 먼저 고쳐야 한다.** ⑥`reports/` HTML은 **`00-19` 신규 1건 + `00-18` 재생성**(§11 신설분) 대기. ⑦사전조사 파일 `memory/project/00-14-2차-잔여-착수준비.md`는 **여전히 삭제 대기**.

- **판정**: ✅통과 (00-18 §11 작성지침 체계화 및 00-19 개인정보처리방침 v0.9 초안 신설 확인 / 쿠키·GA 미사용 및 IP 해시 실측 대조 일치 / 제3-5조 수집제외 조항 및 14조 구성 확인 / harness-doctor 통과)

---

## 2026-08-18 (26) | [Opus] `00-14` §2.4(2-6) — `00-18` 처리방침·약관 초안 설계서 신설 + `03-02` §4.1 해소 갱신

- **근거 스펙**: `00-17` §4.2 빈칸 ①②(*"별도 문서(`00-18` 후보)"*) · `00-14` §2.4(2-6) · **walkthrough (25) 편차 필드**(*"`[Claude:Opus]`가 `03-02` §4.1을 해소 표시로 갱신할 것"*). `context.md` ② 핸드오프. 대조한 정본: `eobom/backend/prisma/schema.prisma`(20개 모델 전수), `eobom/frontend/src/components/Footer.tsx`(전문 155줄), `01-05` §7.1~§7.4, `00-17` §2·§3.1·§3.2·§3.4·§4.1·§4.2·§5, `06-03` §3.2·§4·§5·§8, `00-13` §7·§8 #6, `00-12` §4·§7.2, `00-16`, `06-02` §1·§6.1·§7, `03-02` §2.1·§3.1·§4·§5·§7·§8, `05-01` §2.3·§4.4, `05-02` §4, `02-01`·`02-03`, `00-11` §5.1·§8-1, `security.md` §5·§6.
- **건드린 파일**: **`docs/00_핵심플랫폼/00-18_개인정보처리방침_및_이용약관_기획서.md`(신규)**, `docs/03_현물_유품_수거/03-02_현물_유품_수거_도메인_기획서.md`(§4 표·**§4.1**·§7.1·§8 #6), `docs/00_핵심플랫폼/00-14_사장님_논의_안건_정리.md`(§1 표·2차 3마감 블록·**§2.5·§2.6 신설**·§8 대장 2행), `docs/00_핵심플랫폼/00-17_개인정보_인증_및_국외이전_대응안.md`(§4.2 이관 블록·§4.2 말미·§7), `docs/06_엔딩노트_유언/06-03_엔딩노트_열람통제_및_예외열람_정책.md`(§8 #4·§9), `docs/00_핵심플랫폼/00-13_추모관_공유링크_모델_결정서.md`(§8 #6 하단 블록), `docs/00_DOCS_INDEX.md`, `docs/작업일지_및_기록/260818.md`, `docs/작업일지_및_기록/에이전트_기록/claude_tasks.md`, `.harness/memory/context.md`
- **결과**:
  - **`03-02` §4.1 해소 갱신 — (25)가 요청한 건.** 제목 `🔴 ... 착수 전 마이그레이션 1건` → **`✅ ... — 2026-08-18 해소`** 로 바꾸고 🔵 블록을 신설했다. **원문 진단(변경 전 `prisma` 블록 포함)은 지우지 않고 남겼다** — 아래 "앱 레벨 강제" 권고가 **아직 절반만 섰기 때문**이다. 🔴 **이 절반이 갱신의 핵심**: `FUNERAL_FACILITY` 필수 강제는 `createLead`가 **코드 추가 없이 이미** 하고 있지만, **`ESTATE_CLEANUP` null 허용 강제는 03 리드 생성 경로 자체가 없어 미착수**다 → §5 `CleanupRequest` 구현 시 분기 규칙 신설. **`00-15` §3이 회귀 테스트 근거로 든 *"DB 제약을 앱 로직으로 옮긴 변경"* 의 실물이 이것**이라는 경고를 §4.1 안에 박았다. 함께: §4 재사용표 `Lead` 행, §7.1 단계 0(✅ 완료)·단계 1(**`partnerType`은 0에서 이미 나갔으므로 03 전용 필드 3개만 남음**), §8 미결 #6(취소선 + 닫힘).
  - 🔴 **`00-18`의 가장 큰 결과는 문서가 아니라 발견이다 — `Footer.tsx` 전문 155줄 전수 조사에서 같은 종류의 결함 2건 추가.** 2-6이 `00-17`을 쓰다 *곁눈으로* 나온 건이라 **`Footer`의 나머지 문구는 아무도 안 본 상태**였다(§2 전수조사는 `HomePage`·`EndingNotePage` 계열만, §2.2는 목업 JSON만 — **같은 실수 3회차를 막기 위해 이번엔 처음부터 끝까지 읽었다**). **4개 문구 중 3개가 뒷받침 없는 약속**이었고, 정상은 `Footer.tsx:136`의 `/partner` 링크 하나뿐이다.
  - **2-7 — `"KISA 기준 최고 등급 보안 암호화"`(`Footer.tsx:74`). 2-1~2-6과 종류가 다르다**: 앞의 것들은 *"아직 없는 것을 있다고"* 였지만 이건 ***"존재하지 않는 것을"*** 말한다. ①KISA가 운영하는 것은 **ISMS·ISMS-P 인증**(합격/불합격)이고 *"최고 등급 암호화"* 라는 **등급 체계 자체가 없다** — 참·거짓 이전에 **검증 불가능한 문장**. ②`00-17` §2가 확인한 **ISMS-P 미인증** 상태에서 *"KISA 기준"* 은 소비자에게 **"KISA가 인정했다"** 로 읽힌다. ③실제 암호화도 부분적이다 — ✅비밀번호(bcrypt)·리프레시 토큰(sha256)은 실재, 🔴`settlementAccount`는 *"암호화 저장"* 이 **규칙일 뿐 구현 미확인**(`01-05` §7.4), 🔴엔딩노트 AES-256은 **아직 계획**(`security.md` §6), `00-03`의 Vault는 **설계이지 가동 중인 시스템이 아니다.** 🟡 대체 문구 권고 = **`"전송구간 및 비밀번호 암호화 적용"`**(지금 사실인 것만, 범위가 늘면 문구를 늘림).
  - **2-8 — `"1588-0000"`(`Footer.tsx:116`).** `Footer.tsx:85` 주석이 **08-14에 *"24h 긴급콜"* 을 제거했다고 적어둔 바로 그 자리인데 번호는 남았다** — *"받을 사람이 없는 약속"* 이라 문구를 지웠지만 **걸면 안 받는 번호**가 그대로이고 `0000`은 명백한 자리표시자다. ⚠️ **처리방침에 직결**: **개인정보 보호책임자 연락처는 처리방침 필수 기재사항**인데 화면의 유일한 연락처가 가짜다. 🟡 권고 = 실번호 확정까지 내림(`07-02` §5 카카오톡 채널·§7 미결 #4 연동).
  - **두 문자열 다 `grep`으로 저장소 전체를 확인했다 — `Footer.tsx` 단 한 곳에만 존재한다.** `docs/`·`reports/`·`.harness/` 어디에도 근거가 없다(재현: `Grep "KISA|1588"` — `.md` 히트는 `01-02` 위치정보법 문맥 2건과 walkthrough 1건뿐, `Footer` 문구와 무관).
  - **처리방침 — 뼈대를 문서가 아니라 `schema.prisma` 20개 모델 전수 실측으로 채웠다.** 처리방침이 가장 자주 틀리는 지점이 *"실제로 받는 것과 적어둔 것이 다른"* 것이기 때문이다. **정보주체 4종 분리**(이용자=동의 / 사업자·전문가=계약 / 🔴**비회원 조문객** — `MemorialGuestbook`·`MemorialTribute`는 **로그인 없이 개인정보가 생성된다**). **함정 3가지**: ①`MemorialTribute.visitorHash`는 IP 원문 미저장이라는 **좋은 설계**(`05-01` §4.4)지만 **자동수집 항목으로 기재해야 하고, 원문 미저장을 함께 밝히면 오히려 신뢰 재료**가 된다 ②🔴**고인은 법상 "살아 있는 개인"이 아니라 정보주체가 아니지만**, 고인 정보는 개설자(`createdByUserId`)와 결합해 유족을 식별하므로 **"법상 의무가 없어도 동일하게 취급한다"고 명시** 권고 ③`consentSnapshot`(동의 시점 문구 전문 저장)은 **처리방침 자체의 버전 관리에도 같은 사상이 필요**함을 보여준다.
  - **`00-17` §3.2가 남긴 국외이전 공개 4항목을 실제 표로 채웠다** — Vercel(접속 IP·UA / 미국 / 상시 / **`00-11` §5.1 유지 권고라 잔존 확정**), Google(이메일·프로필 / 구글 로그인 시 / **잔존**), Render(**`00-11` §7.1 단계 4에서 이탈 예정이나 이탈 전 오픈 시 등재 필수** — 취소선으로 표기). **이전 근거는 전부 §28조의8 ③이고 별도 동의가 아니라 이 공개로 갈음**된다. **위탁(§26) ↔ 제3자 제공(§17)을 갈라 표로 세웠다** — 실무에서 가장 자주 섞이는 둘인데 이어봄은 **둘 다 있다.** 제3자 제공은 `01-05` §7이 이미 완성해 둬서 **옮겨 적기만 하면 된다**(🔴 단, **비제휴 시설은 아무에게도 전달하지 않는다**(§7.2)는 사실도 적어야 한다 — 안 적으면 이용자는 *"문의하면 다 넘어간다"* 로 이해한다).
  - 🔴 **보유·파기 표 8행 중 4행이 빈칸이라는 것이 정직한 결과다.** ✅확정은 리드 마스킹(`01-05` §7.3) 2행뿐. 🔴빈칸 = 회원 탈퇴 / 방명록 소프트 삭제 / 접속기록 / 추모관(`00-14` §4-3 사장님 대기). **다만 탈퇴 규칙은 스키마가 이미 절반을 답하고 있다** — `Lead.userId`·`ConsultRequest.userId`가 **`onDelete: SetNull`**(리드는 남고 연결만 끊김), `SocialAccount`가 **`Cascade`**. **설계는 섰는데 문장이 없었을 뿐**이라 그대로 기술하면 된다. ⚠️ **소프트 삭제 3종(`unlinkedAt`·`deletedByOwnerAt`·`hiddenAt`)은 파기 시점이 전무** — 분쟁 대비로는 옳지만 **파기 규칙 없는 소프트 삭제는 "안 지우는 것"과 같다.**
  - **약관 §7.2 — 고유 조항 9개를 배치했는데 새로 쓴 문장이 없다.** 전부 다른 문서가 이미 만들어둔 것을 그릇에 담았을 뿐이다(①중개 지위←`03-02` §2.1 / ②변호사법←`02-01`·`02-03` / ③엔딩노트 무효력←`06-02` / **④영장←`06-03` §4** / ⑤재전파 고지←`00-13` #6 / ⑥허위 개설←`05-01` §2.3 / **⑦사망 후 계정 처리←`00-12`** / ⑧게시물←`05-02` §4 / ⑨사업자·전문가←`01-05`·`02-03`). 🔴 **⑦만은 베낄 원본이 없다 — 일반 약관은 사망을 다루지 않는다. 이어봄의 사업 자체가 거기이므로 외부 검토에서 가장 시간을 써야 할 곳도 여기다.** ⚠️ **⑥은 `Memorial.falseReportAgreedAt`으로 이미 동의를 받고 있는데 대응 조항이 없어 "동의만 있고 근거가 없는" 상태**였다. **④는 `06-03` §5 동의 문구(작성 시점)와 다른 것이며 둘 다 필요**하다는 점을 `06-03` §9에도 역참조로 박았다.
  - **게시 게이트 5개(§8.1)와 구현 5건(§8.2)을 세우고 순서를 못 박았다** — 🔴 **문구 수정(2-7·2-8)이 페이지 신설보다 먼저다.** 반대로 하면 **페이지를 만드는 동안 거짓 문구가 계속 노출**된다. 2-7·2-8은 커밋 한 번이면 끝난다. 🟡 **외부 검토 의뢰는 묶는다** — `06-03` §8 #4가 이미 `06-02` §7-1·`04-02` §7-3과의 합본을 권고했고, 여기에 약관 ①②③④⑦을 더해 **한 건으로 정리**했다. `00-14` §5에서 **5-4가 내려간 자리를 이 건이 대신한다.**
  - **`00-14` 갱신**: §1 요약표(§2 `~~5~~ → ~~1~~ → 2`), **2차 3마감 🔵 블록 신설**, **§2.5(2-7)·§2.6(2-8) 신설**(§9 규칙대로 번호 재사용 안 함 — 기존은 §2.1~§2.4), §8 대장 2행(`00-17` §4.2 해소 표시 + `00-18` §9 신규행).
  - **검증**: `bash .harness/tools/harness-doctor.sh` → **✅ 122개 항목 통과**(부팅 합계 예산 내, 유령 경로 64개 실존, 인덱스 reports 링크 40개 실존, 위키링크 0 깨짐). 인덱스의 `00-18` reports 칸은 (23)·(24)와 같은 이유로 **"⏳ `[Gemini]` 생성 대기"** — doctor §5가 인덱스의 백틱 `reports/` 경로 실존을 검사한다.
- **편차**: 없음(기획). 다만 **발주 범위를 넘어선 것이 있어 명시한다** — `00-17` §4.2가 넘긴 일은 *"처리방침·약관 초안"* 이었는데, **`Footer` 전수 조사는 요청받지 않은 일이다.** 그럼에도 한 이유는 **2-6 자체가 "전수조사가 `Footer`를 안 봐서 빠진 건"이었기 때문**이고, 같은 파일을 다시 열면서 나머지를 안 보는 것은 **같은 실수의 3회차**가 된다고 봤다. 결과적으로 이 문서에서 가장 값이 큰 부분이 됐다. 그리고 **2-7의 판정은 근거의 성격이 다르다** — 2-1~2-6은 *우리 문서와 화면의 대조*로 나왔지만, **2-7은 "KISA에 그런 등급 제도가 없다"는 외부 사실**에 기댄다. `AGENTS.md` §6대로 **확인 기준일(2026-08-18)을 문서에 명시**했고, 🔴 **대체 문구 확정은 개발자 몫으로 남겼다**(§9 #1).
- **다음 에이전트가 알아야 할 것**: ①🔴 **2-7·2-8은 회의를 기다릴 필요가 없다.** 개발자가 대체 문구만 확정하면 `[Sonnet]` 커밋 한 번이며, **`00-18` §8.2가 "문구 수정을 페이지 신설보다 먼저"로 순서를 고정**했다. ②🔴 **`00-18`은 초안 설계서이지 게시 가능한 완성문이 아니다** — §8.1 게이트 5개(외부 검토 / §6 빈칸 4개 / **보호책임자 지정** / `00-11` §8-1 / `security.md` §5) 전부 닫히기 전에는 화면에 걸지 않는다. **지금 상태로 거는 것은 아무것도 없는 것보다 나쁘다**(누락 → 허위 고지). ③🔴 **`03-02` §4.1은 해소됐지만 `ESTATE_CLEANUP` 앱 레벨 강제는 여전히 없다** — `CleanupRequest` 착수 시 **가장 먼저 볼 칸**이다. ④**처리방침 §3 인벤토리는 곧 낡는다**(§3.4) — 엔딩노트 본문·`Deceased`·`CleanupRequest`·`AdminTask` 4건이 붙을 때마다 개정해야 하고, **한 번에 완벽하게 쓰려고 기다리면 영원히 못 건다.** ⑤**`00-17` §4.2 ⑤(접속기록 보관)만 `00-17`에 남았다** — `[Sonnet]` 구현 항목. ⑥`reports/` HTML은 **`00-18` 신규 + `03-02` 갱신 반영 2건 대기**(`[Gemini]`). ⑦사전조사 파일 `memory/project/00-14-2차-잔여-착수준비.md`는 **여전히 삭제 대기**(사람 확인).

- **판정**: ✅통과 (00-18 Footer.tsx:74·77·80·116 실측 및 KISA/1588 문자열 단독 존재 재현 확인 / schema.prisma 20개 모델 전수 인벤토리 일치 / 03-02 §4.1 해소 블록 및 미해결 03 강제 명시 일치 / 00-14·00-17·00-13·06-03 연계 갱신 및 HTML 보고서 41건 전건 일괄 생성 완료 / harness-doctor 123개 항목 통과)

---

## 2026-08-18 (25) | [Sonnet] 03 착수 0단계 — `Lead.facilityId` nullable 전환 + `Partner.partnerType` 신설

- **근거 스펙**: `docs/03_현물_유품_수거/03-02_현물_유품_수거_도메인_기획서.md` §3.1(`Partner.partnerType` 신설, 기본값 `FUNERAL_FACILITY`), §4.1(`Lead.facilityId` → `String?`, `facility` 관계 → `Facility?`, 권고: 컬럼은 열되 앱 레벨에서 `partnerType`별로 강제). `context.md` ④ 핸드오프.
- **건드린 파일**: `eobom/backend/prisma/schema.prisma`(`Lead.facilityId`·`facility` 관계, `Partner.partnerType` 신설), `eobom/backend/prisma/migrations/20260818004442_lead_facility_nullable_partner_type/migration.sql`(신규)
- **결과**:
  - **스키마**: `Lead.facilityId String` → `String?`, `facility Facility @relation` → `Facility? @relation`(FK `onDelete: SetNull`로 자동 조정됨 — Prisma가 nullable FK에 맞게 생성). `Partner`에 `partnerType String @default("FUNERAL_FACILITY")` 신설. §3.1이 한 블록으로 제시한 `serviceAreas`·`serviceTags`·`licenseNo`(03 전용 필드)는 **이번 범위에서 제외** — 이번 0단계는 §4.1의 "강제 기준값" 확보가 목적이고, 나머지 3개는 아직 읽거나 쓰는 코드가 없어 지금 넣으면 `00-14` §2.2류(필드는 있는데 안 채워지는) 문제를 새로 만들 뿐이다.
  - **마이그레이션**: `npx prisma migrate dev --create-only`로 SQL 생성 후 직접 검토(`DropForeignKey` → `ALTER COLUMN ... DROP NOT NULL` → `Partner` 컬럼 추가 → `AddForeignKey ON DELETE SET NULL`) — 데이터 손실 없는 완화성 변경임을 확인 후 적용. **적용 전 `security.md` §6 규칙대로 `pg_dump` 백업**(로컬 Docker `eobom-postgres`, 498KB, 스크래치패드에 보관 — 커밋 대상 아님).
  - **기존 데이터 무영향 실측**: `Partner` 2건 전부 `partnerType = FUNERAL_FACILITY`로 채워짐(기본값 정상 작동). `Lead` 5건 전부 `facilityId` 유지 — **어떤 기존 값도 null로 바뀌지 않았다**(컬럼 제약만 완화, 데이터는 그대로).
  - **앱 레벨 강제는 코드 추가 없이 이미 서 있음을 확인했다** — `eobom/backend/src/services/leadService.ts`가 리드 생성의 **유일한 경로**(`grep`으로 `.lead.create` 호출부 전수 확인, `leadController.ts` 2곳이 전부 이 함수를 거침)이고, `createLead`의 `CreateLeadInput.facilityId: string`(필수 타입) + `facility.findUnique` 실패 시 `FacilityNotFoundError`가 **01(FUNERAL_FACILITY) 리드의 필수 조건을 이미 강제**한다. **03(ESTATE_CLEANUP) 리드 생성 경로는 아직 없으므로 "null 허용"을 강제하는 코드도 아직 없다** — `03-02` §5 `CleanupRequest`가 실제 구현될 때 신설/분기해야 할 규칙으로 남는다.
  - **검증**: `npx prisma generate`(백엔드 dev 서버 프로세스가 엔진 DLL을 잠그고 있어 첫 시도 `EPERM` — 포트 5000 리스닝 PID 확인 후 종료하고 재시도, 성공) → 백엔드 `npx tsc --noEmit`(에러 0) → 프론트 `npx tsc --noEmit`(에러 0) → `npm run dev`로 서버 기동 확인(`https://localhost:5000` 정상 구동 로그) → `docker exec eobom-postgres psql`로 위 데이터 무영향 쿼리 실행 → 검증용 서버 프로세스 종료(포트 5000 재확인으로 잔류 없음 확인).
- **편차**: **`03-02` §4.1의 문서 상태를 갱신하지 않았다.** `docs/`는 `[Claude:Opus]` 소유이고 `AGENTS.md`(`CLAUDE.md` §`[Claude:Sonnet]`-3)가 *"구현 중 `docs/`를 고치지 않는다"* 고 명시한다 — 실제로 한 번 §4.1을 "해소"로 갱신하는 편집을 했다가 이 규칙을 뒤늦게 확인하고 **`git checkout`으로 되돌렸다**(커밋 전이라 흔적 없음). §4.1은 여전히 🔴 미해소로 표시돼 있다 — **다음 `[Claude:Opus]` 사이클에서 이 항목의 결과를 반영해줘야 한다.** 그 외 구현 범위는 스펙과 일치하며, §3.1의 03 전용 필드 3개를 이번에 안 넣은 것은 §4.1 원문의 "0단계" 범위 해석이지 스펙 이탈이 아니다.
- **다음 에이전트가 알아야 할 것**: ①🔴 **`[Claude:Opus]`가 `03-02` §4.1을 해소 표시로 갱신할 것** — 이 항목의 "결과" 필드가 그 내용의 근거다. ②`Lead.type`(`03-02` §4.1 하단)은 이번에 손대지 않았다 — `QUOTE`에 03을 얹고 `partnerType`으로 집계 가르는 권고는 아직 실제 03 리드 생성 코드가 없어 검증되지 않았다. ③`03-02` §3.1의 `serviceAreas`·`serviceTags`·`licenseNo`, §5 `CleanupRequest` 모델은 **여전히 미착수** — 다음 03 사이클(업체 등록 심사 화면 또는 `CleanupRequest`)에서 함께 넣을 것. ④로컬 백엔드 dev 서버(포트 5000)가 이번 세션 시작 시 이미 떠 있었고 `.prisma` 엔진 DLL을 잠가 `generate`를 막았다 — 앞으로 마이그레이션 전에는 dev 서버 종료를 먼저 확인하는 것이 안전하다(`claude_tasks.md` 08-14 (4)의 vite 포트 누적과 같은 계열 문제). ⑤DB 백업 파일(`pre-lead-nullable-260818.sql`)은 스크래치패드에만 있고 저장소에 없다 — 필요시 재백업할 것.

- **판정**: ✅통과 (03-02 §3.1·§4.1 스키마 Lead.facilityId String? 및 Partner.partnerType 기본값 반영, migration.sql 생성 및 외래키 ON DELETE SET NULL 확인 / leadService.ts 앱 레벨 01 필수 제약 유지 확인 / backend·frontend npx tsc --noEmit 에러 0건 통과 재현 / harness-doctor 122개 항목 통과)

---

## 2026-08-18 (24) | [Opus] `00-14` §6-2 — `06-03` 엔딩노트 열람통제·예외열람 정책 신설

- **근거 스펙**: 개발자 지시(`00-14` §6-2 *"엔딩노트의 내용은 운영자가 보지 못함. 특수한 상황에서만 열람할 수 있다는 조건과 그것에 동의하는 것을 명시해야 해. 특수한 상황이 뭐가 있을까...? 아니면 그냥 메타데이터만 보게 해야 하나...?"*). **사용자 착수 승인 2026-08-18** — `pending-approvals.md`의 *"확정 전 착수 금지"* 항목을 사람 의사 표시에 따라 해제(`AGENTS.md` §0). 사전조사는 `.harness/memory/project/00-14-2차-잔여-착수준비.md` §4. 대조한 정본: `06-01` §1·§2·§3, `06-02` §5·§6.1·§7, `00-12` §2.3·§4, `03-01` §2, `04-01` §3.1·§4.3·§8, `04-02` §6, `00-11` §7.2·§8-1, `security.md` §6, `00-02`(페르소나).
- **건드린 파일**: **`docs/06_엔딩노트_유언/06-03_엔딩노트_열람통제_및_예외열람_정책.md`(신규)**, `docs/06_엔딩노트_유언/06-01_관리자_열람범위_설계_메모.md`(§3 이관 블록·§4), `docs/00_핵심플랫폼/00-14_사장님_논의_안건_정리.md`(§1 표 2곳·2차 2마감 블록·§6-2·§8 대장 06), `docs/00_DOCS_INDEX.md`, `docs/작업일지_및_기록/260818.md`, `docs/작업일지_및_기록/에이전트_기록/claude_tasks.md`, `.harness/memory/context.md`, `.harness/memory/pending-approvals.md`(06 항목 해제됨 절로 이동)
- **결과**:
  - **질문의 전제를 먼저 정정했다.** 개발자는 *"열람 정책"* 을 물었는데, **서버가 복호화 키를 갖고 있으면 운영자는 기술적으로 언제든 볼 수 있고 그때 "안 본다"는 것은 규칙일 뿐**이다. `06-01`이 지적한 *"화면에 건 비밀보장 약속"* 과의 충돌 지점이 여기다 — 화면(`EndingNotePage`·`HomePage` 섹션 5)은 *"철저히 비밀이 보장되며"* 라고 **보증의 어투**로 말하는데 뒷받침은 **약속**이다. **그래서 §2를 "특수 상황 목록"이 아니라 4층 구조(기술 AES-256 / 구조 단독복호화 불가 / 통제 4종 / 약속 문구)로 세웠고, 지금 실제로 서 있는 것은 4층뿐**임을 명시했다. **E2E(이용자만 키 보유)는 §1.1에서 기각** — 엔딩노트는 본인 사망 후에 열려야 하는 데이터라 키를 아는 사람이 없고, L3·L4 자체가 성립하지 않으며, 6070 시니어 페르소나에서 키 관리 위임은 실패한다.
  - **`06-01` §3 A/B → A안(메타데이터만) 채택 권고.** **B안 기각 근거를 "위험해서"가 아니라 "필요가 없어서"로 잡았다** — `06-01`이 B안의 명분으로 든 고객지원 문의를 4가지로 분해했더니 *"저장됐나"·"왜 안 열리나"·"누가 열었나"* 는 전부 메타데이터로 답이 되고, 본문이 필요한 유일한 경우(*"내가 쓴 내용이 뭐였죠"*)조차 **본인 로그인 열람으로 해결**된다. 운영자가 읽어서 알려주는 순간 *"철저히 비밀"* 은 그 통화에서 이미 깨진다.
  - **특수 상황 후보 5개 중 인정은 2개.** ⭕**법원 영장 등 적법한 요구**(거부할 수 없으므로 **약관에 반드시 명시** — 안 적어두면 그때 약속을 어기는 것이 된다) ⭕**본인의 명시적 요청**(본인 확인 절차 필수, 본인 열람 유도 우선). 🟡**L3·L4 유족 전달은 "열람"이 아니라 "전달"** — §4.1에서 용어를 갈랐고 **모델·감사 로그·화면에서 분리**하도록 했다(섞으면 정상 전달 수천 건 사이에 예외 열람 1건이 묻혀 감사 로그가 의미를 잃는다). 🟡**시스템 장애·복구는 암호문만 다루므로 대상 아님.** 🔴**생명 위협 징후(자살 암시) 감지는 기각** — 감지하려면 내용을 봐야 하므로 순환 논리이고, 엔딩노트는 원래 죽음을 다루는 글이라 오탐 비용이 크다. **대신 §4.2에서 감지가 아니라 상시 안내(자살예방 상담 창구 화면 상시 노출)로 대체** — `06-02` §3(연명의료 등록기관)·`04-02` §4(플랫폼 사전지정)와 같은 "우리가 하지 않고 연결한다" 패턴 3회차. 창구 번호·명칭은 `04-01` §3.1 `lastVerifiedAt` 방식으로 확인일 관리.
  - **예외 열람 통제 4종 확정**: ①**2인 승인(4-eyes)** ②**열람 사유 필수 기록**(자유 입력이 아니라 §4 사유 코드 선택 + 근거 첨부 — 자유 입력은 *"확인"* 두 글자로 채워진다) ③**불변 감사 로그**(최소선은 *"애플리케이션에서 삭제·수정 경로를 만들지 않는다"*, 그 이상은 `00-11` 확정 후) ④**본인/지정 유족에게 열람 사실 사후 통지**(가장 강한 억제력이고 통제 중 이용자가 체감하는 유일한 항목).
  - **§5 동의 문구 초안** — 개발자가 요청한 *"그것에 동의하는 것을 명시"* 에 대한 답. **가입 약관이 아니라 엔딩노트 작성 시작 시점**에 받는다(가입 약관에 묻으면 안 읽힌다). 작성 원칙 3가지: **불리한 것(영장)을 먼저 말한다**(`04-02` §6의 *"대리하지 않는다를 먼저 말한다"* 와 같은 태도), ***"절대"라고 쓰지 않는다***, **④ 사후 통지를 문구에 넣는다**. ⚠️ `06-02` §6.1 어휘 전역 교체 원칙 적용 — 이 문구를 넣으면서 화면의 *"철저히 비밀이 보장되며"* 를 그대로 두면 한 화면에서 자기모순이 된다(walkthrough (19)에서 실제로 났던 문제).
  - **§6에서 선을 그었다.** 약속의 진짜 뒷받침인 2층(운영자 단독 복호화 불가)의 후보는 봉투 암호화·키 분할·KMS 셋인데 **전부 `00-11` §8-1(클라우드 사업자 확정)에 걸린다** — 지금 정하면 사업자 확정 시 뒤집힌다. **지금 확정하는 것은 둘뿐**: ①평문 저장 구현을 임시로라도 만들지 않는다(`security.md` §6) ②복호화 키를 코드·이미지에 굽지 않는다(`00-11` §7.2-1).
  - **§7에서 `03-01` §2의 예외를 명문화했다.** *"도메인 데이터는 `userId` FK로 연결해 운영자 회원 상세에서 조인해 한 화면에"* 원칙에 대해 **06은 유일한 예외** — 연결은 하되(메타데이터를 봐야 하므로) **조인 결과에 본문이 포함되지 않는다.** 🔴 구현 주의: `prisma.user.findUnique({ include: {...} })` 통짜 조인이면 **본문 컬럼이 자동으로 딸려온다** → `select` 명시 또는 본문을 별도 모델·별도 접근 경로로 분리. `04-01` §8의 *"필드가 없으면 채워질 수 없다"* 와 같은 원리.
  - **`06-01` 갱신**: §3에 이관 블록(A안 권고 + **A/B 최종 확정은 사람 몫이므로 승인 전까지 미확정 유지** + 이 메모가 A/B를 *"운영자가 뭘 보나"* 문제로 본 전제를 `06-03`이 넘어섰다는 표시), §4 다음 단계 갱신.
  - **`00-14` 갱신**: §1 요약표(§6 3→1 — **6-1만 남았는데 6-2·6-3이 둘 다 6-1에 걸린다**는 단서 추가), 2차 2마감 블록 *"3건"* → *"전건"*, §6-2 처리 🔵 블록, §8 대장 06(`06-01` §3 해소 + `06-03` §8 신규행).
  - **검증**: `bash .harness/tools/harness-doctor.sh` → **✅ 119개 항목 통과**. 인덱스의 `reports/06-03` 칸은 (23)과 같은 이유로 "⏳ `[Gemini]` 생성 대기"로 적었다.
- **편차**: 없음(기획). 다만 **개발자 질문의 틀 자체를 바꿨으므로 명시한다** — 질문은 *"특수한 상황이 뭐가 있을까 / 아니면 메타데이터만?"* 이라는 **선택지 두 개**였는데, `06-03`은 *"둘 다 하되 순서가 있다"* 로 답했다(**A안이 먼저이고 특수 상황은 그 예외**). 특수 상황 목록만 만들었으면 §1이 지적한 *"약속만 걸려 있다"* 가 그대로 남았을 것이다. 그리고 **`06-01`의 전제(A/B는 "운영자가 뭘 보나"의 문제)를 넘어섰다** — 서버가 키를 갖는 한 A안도 보증이 아니라 약속이라는 점을 §1에 새로 세웠고, `06-01` §3에 그 사실을 표시했다.
- **다음 에이전트가 알아야 할 것**: ①🔴 **`06-03`은 권고까지다. A/B 최종 확정은 사람 몫**이고 `06-01` §3은 **승인 전까지 미확정**으로 뒀다 — `pending-approvals.md` 해제 항목에 *"해제된 것은 착수 금지이지 A/B 결론이 아니다"* 라고 단서를 남겼다. ②🔴 **`06-03` §8-2가 이 문서에서 가장 약한 고리다** — 통제 ①(2인 승인)은 **사람이 두 명 있어야** 성립하는데 운영 인력이 미정(`00-14` §6-1)이다. **1인 운영이면 ①을 빼고 ②③④만 가는 것이 정직**하고, *"2인 승인"* 이라 적어두고 1인이 두 번 누르는 상태가 가장 나쁘다. **§6-1이 정해질 때 이 절을 반드시 다시 볼 것.** ③**§6(키 관리)은 `00-11` §8-1 확정 후 별도 문서**(`06-04` 가칭)로 간다 — 지금 설계하면 뒤집힌다. ④`[Sonnet]` 구현 시 **§7의 `include` 통짜 조인 주의**가 실질적인 사고 방지 항목이다. ⑤**사전조사 파일 `memory/project/00-14-2차-잔여-착수준비.md`는 4건 전부 소비됐다** — 파일 머리의 규칙대로 **삭제 대상**이나, 삭제는 사람 확인 후(`AGENTS.md` §1 CONFIRM). ⑥`reports/` HTML은 이제 4건 대기(`00-15`·`00-16`·`00-17`·`06-03`).

- **판정**: ✅통과 (06-03 4층 보안·통제 구조 및 A안 권고, 특수 상황 영장·본인요청 한정, 예외통제 4종, 03-01 조인 예외 및 include 통짜조인 방지 규격 확인 / 06-01·00-14·pending-approvals.md 연계 갱신 확인 / harness-doctor 통과 확인)

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

## 2026-08-14 (22) | [Opus] `00-14` 2차 1마감 — 3-1·3-2 / 4-2 / 5-1·5-2 처리 (`00-13` 개정 + `03-02`·`04-02` 신설)

- **근거 스펙**: 개발자 지시 3건(`00-14` §3-1·§3-2 *"상중행정을 그대로 두되 부고장에 추모관 링크 전송을 더하고, 추모관은 링크에 따른 페이지가 따로 생성되는 식으로 다르게 운영"* / §4-2 *"현물 유품은 Partner로, 다른 Partner와 마찬가지 별도 Domain으로"* / §5-1·§5-2 *"디지털 정산 정도는 대행 가능한지 · 미리 맡길 서비스가 있는지 파악 · 생전 위임 문서화가 효력 없다는 것인지 서식이 필요하다는 것인지"*). 대조한 정본: `00-13`(링크 4안), `03-01` §3(계정형태 보류), `00-12` §2.4·§4·§8, `02-04` §4·§8-3, `04-01` §1.1·§9, `06-02` §1·§3, `05-02` §2.2, `07-01` §2.3·§8.
- **건드린 파일**: `docs/00_핵심플랫폼/00-13_추모관_공유링크_모델_결정서.md`(개정), `docs/00_핵심플랫폼/00-14_사장님_논의_안건_정리.md`(개정), `docs/00_핵심플랫폼/00-12_사망_이벤트_고인계정_유족연동_공통기반_기획서.md`(§8 #1 1줄), `docs/02_전문가_매칭/02-04_전문가_매칭_생전_WellDying_축_기획서.md`(§8 #3 1줄), `docs/03_현물_유품_수거/03-01_현물_유품_수거_계정형태_보류_메모.md`(해소 배너), **`docs/03_현물_유품_수거/03-02_현물_유품_수거_도메인_기획서.md`(신규)**, **`docs/04_디지털_자산_정산/04-02_생전위임_문서화_및_대행_가능범위_검토서.md`(신규)**, `docs/07_상중_행정_케어/07-01_상중_행정_케어_도메인_기획서.md`(§2.3·§8 #1), `docs/00_DOCS_INDEX.md`, `.harness/memory/context.md`
- **결과**:
  - **3-1·3-2 → `00-13`에 E안 신설.** 초안이 *"조문객이 받는 링크는 한 개여야 하므로 통합이 사실상 유일한 답"*(§2.3)이라 한 것을 **틀렸다고 정정** — 요구는 *"배포 링크가 한 개"* 이지 *"레코드가 한 개"* 가 아니고, **부고장 안에 추모관을 넣으면 분리 상태에서도 배포 링크는 한 개**다. E안 = 부고장(07 `Obituary` 모델 신설, 빈소·발인·장지·계좌 보유)이 봉투 / 추모관(05)이 목적지, 개설은 1회(부고장 만들면 추모관 자동 동반 생성), 회전은 추모관 slug만. **부수 효과로 §4.3 파생논점("phase 전환 트리거 자동/수동/혼합")이 통째로 소멸** — 레코드가 둘이면 전환이라는 사건 자체가 없다. 권고를 C→E로 교체하되 **§4.1~§4.4·§7 원 권고·§2.3 원문은 판단 경위로 남김**(지우면 왜 E로 왔는지가 사라짐).
  - **개발자가 요청한 *"링크에 따른 페이지가 따로 생성"* 아이디어 → `00-13` §7.2에 3해석으로 분해.** ⓐ `ShareLink`(배포 **묶음**별 링크 — D안이 무거웠던 이유는 "사람" 단위라 명단이 필요했기 때문이고, "뿌리는 곳" 단위로 쪼개면 개인정보 0으로 부분 회수 + 재전파 추적 절반을 얻음. 1차 미구현하되 **`Memorial`이 slug를 직접 들지 않게 설계만 열어둘 것**) ⓑ **독립 랜딩 렌더 — 여기서 새 사실 하나 발견**: 현재 프론트가 Vite SPA(`00-03`)라 **OG 태그가 정적**이고, 그러면 카톡에 부고 링크를 붙여도 미리보기 카드가 고인별로 뜨지 않아 조문객이 클릭하지 않거나 피싱으로 의심한다 → `/o/*`·`/m/*` 두 경로만 백엔드가 고인별 OG 태그로 렌더해야 함(권고: 성명까지만, 영정 제외 — 카톡 캐시에 남음) ⓒ 물리적 SSG는 개설 시점엔 부적합(방명록 실시간·신고 시 즉시 비공개가 캐시 무효화와 충돌)하나 **"N년 후 동결 + 정적 스냅샷"으로는 `00-14` §4-3(수익 0인데 영구 스토리지 비용)의 답이 될 수 있음**.
  - **4-2 → `03-02` 신설**(이 도메인 첫 기획 문서, `03-01` §3 보류 해제). `Partner`에 `partnerType` 축 추가(`02-04` §5 `contextType`과 같은 "기본값으로 무해한 열거형" 패턴 2회차). **01과의 결정적 차이를 §3.2에 명시** — 01은 공공데이터 1,552건 위에 클레임을 얹었지만 03은 초기 목록 0건(유품정리업이 법정 업종이 아니라 공공 데이터셋이 없음)이라 클레임이 아니라 직접 등록 심사가 그 자리를 대신하고, **"우리가 승인한 것"이 유일한 검증**이 된다. **스키마 실측으로 착수 차단 요인 1건 확인**: `schema.prisma:162` `facilityId String`(필수) + `Facility` 필수 관계 → 03 리드를 넣을 수 없으므로 nullable 전환이 0단계(단 01 무결성이 낮아지므로 `partnerType`별 앱 레벨 강제 병행 권고 — `04-01` §3.1 `lastVerifiedAt` 방식). **새로 드러난 위험 2건**: ①유품은 상속재산이라 분할 전 처분이 단순승인으로 간주될 수 있어(민법 §1026①) **`07-02`가 지키려던 상속포기 권리를 03이 날릴 수 있음** → 요청 화면 게이트 ②폐기물관리법 §25 인허가 확인 기준을 우리가 정해야 함.
  - **5-1·5-2 → `04-02` 신설.** §5-2 답: *"효력이 없다"가 아니라* 민법 §690은 강행규정이 아니라는 것이 통설이고 **법정 서식 자체가 없다** — 문제는 형식이 아니라 그릇이며, 위임은 ⓐ상속인이 해지할 수 있고 ⓑ재산 처분에 못 미친다. **그런데 디지털 계정 정리는 대부분 재산이 아니므로(`04-01` §1.1이 금융·가상자산을 이미 배제) 개발자 직관대로 위임으로 충분한 영역**이다. §5-1 답: 대행을 A(안내·기록)/B(대리 로그인·대신 제출)/C(유상 신청 대행)로 분해했고, **B가 막히는 이유는 법이 아니라 "문이 없어서"** — 플랫폼에 제3자 대리 채널이 없으므로 **변호사에게 물어 "됩니다"를 받아도 실행 경로가 없다** → **유료 검토보다 앞서는 무료 0단계(각 사 약관 확인)를 신설**하고 결과가 NO면 유료 검토 불필요로 정리. **실제 답은 §4** — Google 휴면 계정 관리자 / Apple 디지털 유산 관리자 / Meta 추모 계정 관리자 등 **플랫폼이 이미 제공하는 사전 지정 기능**을 안내하고 지정 여부만 기록(이용자↔플랫폼 계약이라 §690 논점이 생기지 않고 무료·효력 확실. `06-02` §3 연명의료 등록기관과 동일 구조), 그리고 **이어봄 자체 계정 안에서는 100% 대행 가능**(`MEMORIALIZED` 전환·엔딩노트 전달·추모관 권한 이양 — 우리가 당사자).
  - **`00-14` 갱신**: §1 표 건수(§2 5→0, §3 4→2, §4 4→3) + 2차 처리 🔵 블록, §3-1·§3-2·§4-2·§5-1·§5-2에 처리 경위, §8 대장 3행, **§9 회의 순서 전면 교체**(§2·3-1·3-2가 빠지면서 순서가 바뀜 — 남은 필수는 3-3·3-4 + §4 3건이고 **전부 "숫자와 돈"이라 기획이 대신 정할 수 없는 것들만 남음**).
  - **인덱스**: 신규 2건(`03-02`·`04-02`) + **이전 세션 누락분 3건(`02-05`·`06-02`·`07-02`) 소급 등재**, `00-13` 설명 갱신, 03·05·07 도메인 헤더 주석 갱신.
  - **검증**: `bash .harness/tools/harness-doctor.sh` → **✅ 113개 항목 통과**(부팅 합계 10KB/11KB, 유령 경로 64개 전부 실존, 인덱스가 가리키는 reports 링크 31개 전부 실존, 위키링크 0 깨짐). 초안 작성 시 `context.md`가 3,512B로 부팅 합계 11,460B > 11,264B 예산을 넘겨 **실제로 doctor가 실패했고**, `roles.md` §4-0과 중복되던 호칭 안내 줄 등을 걷어내 3,249B로 축소해 통과시킴(`AGENTS.md` §9 "숫자를 올리기 전에 중복부터 걷어낸다" 적용).
- **편차**: 없음(구현이 아니라 기획이라 스펙 편차의 대상이 아님). 다만 **기존 문서의 판단을 2곳 뒤집었으므로 명시함** — ①`00-13` §2.3의 *"통합이 사실상 유일한 답"* → 정정 블록 신설 ②`00-13` §7 권고 C안 → E안. 둘 다 원문을 지우지 않고 취소선·경위 블록으로 남겼다.
- **다음 에이전트가 알아야 할 것**: ①**`00-14` 2차 잔여 4건(6-2·6-3·7-4·5-4)은 미착수** — 사용자와 합의해 1차에서 끊었고, 지시 요지·계획 산출물은 `00-14` §1 🔵 블록의 잔여 표에 있다. ②**6-2(엔딩노트 열람범위)는 `pending-approvals.md`에 "확정 전 착수 금지"로 걸려 있다** — 개발자가 08-14에 방향을 밝혔으므로 해제 대상으로 보이나 **항목 삭제는 사람만 한다**(`AGENTS.md` §0). ③**E안 채택으로 `Deceased` 확정이 07 착수의 전제로 추가됐다** — 기존 04·05 보류(`context.md` ③)와 같은 조건이므로 한 사이클로 묶을 가치가 있다. ④`03-02` §4.1의 `Lead.facilityId` nullable 전환은 **다른 것에 안 막히고 지금 가능**하다. ⑤`reports/` HTML 5건(`02-05`·`03-02`·`04-02`·`06-02`·`07-02`)은 같은 날 `[Gemini]`가 생성 완료했다.
  ⑥**⚠️ 게이트 §2-4 주의 — 이 사이클은 `[Gemini]`의 `reports/` 전건 재생성(HTML 약 35개 +
  `tools/` 3개)과 함께 단일 커밋으로 들어갔다(개발자 판단, 2026-08-14).** 따라서 커밋 diff만으로는
  항목별 귀속을 가를 수 없다. **이 항목의 귀속 대상은 위 "건드린 파일"에 열거된 10개 경로뿐이고,
  `reports/`·`.harness/tools/` 변경은 이 항목 소관이 아니다.** (19) 때와 같은 상황이며,
  `GEMINI.md` §2-4 단서를 적용할 것.

- **판정**: ✅통과 (문서 간 정합성 대조 완료 — 00-13 §4.5 E안·§7.2 3해석·§7.3 ↔ 07-01 §2.3 부고장 소속·§8 #1 ↔ 00-14 §1·§3-1·§3-2·§4-2·§5·§8·§9 ↔ 00_DOCS_INDEX 신규 2건·누락 3건 등재 및 상호 참조 일치 확인 / 00-12·02-04·03-01 연계 갱신 확인 / harness-doctor 118개 항목 통과 재현 / §2-4 ⑥단서 적용 변경 파일 일치)

---

## 2026-08-14 (21) | [Sonnet] `00-14` §2-1 체크리스트 1단계 — `07-02` §2 22항목 반영

- **근거 스펙**: `docs/07_상중_행정_케어/07-02_사망후_법정기한_체크리스트_명세서.md` §2(항목 전수 22건+§2.7 조건부 1건), §3(표시 순서 — severity 우선, 그 안에서 판단 순), §3.1(최상단 고정 배너), §5(`AdminTask` 필드명, 2단계 정본). Opus 핸드오프로 §6 `AdminTask` 모델·마이그레이션(2단계), §4 개인화 분기, §5 상담채널은 범위 밖으로 명시됨 — 손대지 않음.
- **건드린 파일**: `eobom/frontend/src/mockData/careGuideTasks.json`, `eobom/frontend/src/pages/CareGuidePage.tsx`
- **결과**:
  - **JSON 전면 교체**: 기존 6항목(상속포기 4항목 통째로 없음, 상속세 `"day": "D+60일"`인데 본문은 "6개월"로 모순)을 §2의 22항목 + §2.7 조건부 1항목(유언증서 검인) = 23개로 교체. 필드는 `07-01` §5 `AdminTask` 모델명을 그대로 씀(`legalBasis`·`deadlineBaseType`류·`severity`)해서 2단계 DB 이관 시 매핑이 기계적이 되게 함. 단 "D+N" 라벨은 버리되(§4.2 원칙) 실제 계산된 날짜는 보여주지 않음 — 사망일 입력 UI 자체가 없고(그건 `Deceased` 엔티티 의존이라 `context.md` ③과 같은 차단 사유), 사람이 읽는 기한 텍스트(`"3개월"`, `"안 날 기준"` 등)로 대신함.
  - **표시 순서(§3)**: 컴포넌트가 severity로 강제 재그룹핑(CRITICAL→NORMAL→INFO), JSON 배열 순서에 기대지 않음. 그룹 안에서 카테고리 헤더를 자동 삽입, "상속 승인·포기" 4항목이 한 세트로 붙어 보이게 함(§1.1).
  - **§3.1 최상단 고정 배너**: 스펙 원문 그대로("고인에게 빚이 있을 수 있다면…") + `[내용 보기]`(상속 승인·포기 그룹으로 스크롤, `useRef`+`scrollIntoView`) + `[전문가 상담]`(`setActiveTab('counseling')`) 버튼 신설. `CareGuidePageProps`에 `setActiveTab` prop 추가(EndingNotePage와 동일 패턴).
  - **항목별 부가 정보**: `legalBasis`(근거 조문) 상시 노출, `needsExpertHelp`(특별한정승인 등) 항목엔 "전문가 상담 →" 링크, `linkTo`(장례식장·화장시설→`facility`, 공과금·통신→`digital-estate`) 항목엔 도메인 이동 링크, 정부24 연계(item 7 안심상속)엔 실제 `externalUrl`(`gov.kr`, 기존 하드코딩 버튼에서 이관 — 새 URL 아님) 링크. 링크 클릭 시 `e.stopPropagation()`으로 체크박스 토글과 분리.
  - **§7 미결 #2·#3 처리**: 부동산 상속등기(17)·사망보험금 청구(22)는 `verified: false` + `legalBasis: "확인 필요 — …"` + 화면에 amber "⚠️ 확인 필요" 배지. 단정하지 않되 항목 자체는 노출(Opus 지시대로).
  - **§6 2단계 분리 반영**: `AdminTask` 모델·마이그레이션·`AdminTaskProgress`는 손대지 않음. 체크 상태는 기존과 동일하게 React state(새로고침 시 소실) — 악화 아님, 애초에 그랬음.
  - **검증**: `tsc --noEmit`·`vite build` 통과. Chrome dev 서버로 `/care-guide` 전체 스크롤 확인 — §3.1 배너, 1순위(CRITICAL) 카테고리 헤더·항목·확인필요 배지·전문가상담 링크·정부24 링크, 2순위(NORMAL), 3순위(INFO) 그룹 전부 렌더 확인. "내용 보기" 클릭 → 상속 승인·포기 그룹 스크롤 확인. "장사시설 찾기 →" 클릭 → `/facility` 이동 + 체크박스 미토글 확인(stopPropagation 정상).
- **편차**: 없음. 스펙 범위 안에서 진행했고 새로운 모델·마이그레이션·상담채널은 추가하지 않음. 굳이 적자면 — 정부24 링크를 기존 위치(체크리스트 하단 고정 버튼)에서 item 7 항목 안으로 옮겨 중복을 없앴는데, 이건 스펙이 명시하진 않았지만 item 7이 목록에 새로 들어오며 자연히 따라온 정리라 별도 편차로 보진 않음.
- **다음 에이전트가 알아야 할 것**: `00-14` §2가 이걸로 5건 전부 처리됨(2-1~2-5). 2단계(`AdminTask` 모델)는 `context.md` ③(04·05 프론트 보류, `Deceased` 미구현) 해제와 시점이 맞을 수 있음 — 둘 다 `Deceased`/유족모드 확정에 걸려 있어 한 사이클로 묶을 가치 있음. `07-02` §7 미결 #1("§2 전 항목 법령 검증 — 오픈 전 필수")은 여전히 미해결 — 이번 작업은 스펙 문서에 적힌 조문을 코드로 옮긴 것이지 법령 검증 자체를 수행한 게 아님.

- **판정**: ✅통과 (careGuideTasks.json 23개 항목[07-02 §2 22항목+§2.7 조건부 1건 전수] 및 CareGuidePage.tsx 최상단 빚 배너·severity 그룹핑·scrollIntoView·미검증 amber 배지·링크 분리 구현 확인 / tsc && vite build 통과 확인 / 선언 외 파일 변경 없음)

---

## 2026-08-14 (20) | [Sonnet] `00-14` §2-5 — `/digital-estate` 목업을 "예시 데이터"로 명시

- **근거 스펙**: `docs/00_핵심플랫폼/00-14_사장님_논의_안건_정리.md` §2.2(2-5, 08-14 Opus 신설) — 지우지 말고 예시임을 명시하는 쪽으로 확정. 핸드오프 지시: 현물수거 서브탭(단정 제거+예시 배너), 추모관 서브탭(방명록·사진 예시 명시, Unsplash URL 처리 판단), 계정정산 서브탭도 같은 기준으로 훑기. 배지 번호(§2.3)·페이지 분할은 범위 밖.
- **건드린 파일**: `eobom/frontend/src/pages/DigitalEstatePage.tsx`
- **결과**:
  - **페이지 공통**: 헤더 바로 아래에 "이 페이지는 화면 구성을 보여드리기 위한 예시 데이터로 채워져 있습니다" 배너 신설(3개 서브탭 전부에 상시 노출).
  - **계정정산 서브탭**: "Naver OCR 엔진으로 정당한 상속인 여부를 즉시 검증합니다" → "제출하신 서류는 상속인 확인 절차에 사용될 예정입니다. (자동 검증 기능은 준비 중)"으로 완화 — 실제로 구현되지 않은 검증 기술을 구체적으로 지목하고 있었음. 파일 업로드·정산 신청 알림도 "성공적으로 업로드/접수되었습니다"(완료 단정) → "예시 화면에 표시되었습니다 / 준비 중입니다, 실제로 접수되지 않습니다"로 정정 — 업로드·신청 둘 다 로컬 state만 바뀔 뿐 서버로 전송되지 않는데 문구는 완료를 단정하고 있었음.
  - **현물수거 서브탭**: "…제휴 전문 업체 리스트입니다" 단정 제거 → "화면 구성 예시입니다. 실제 제휴 업체는 아직 없습니다"로 교체(03은 `03-01` 보류 메모 1건뿐이라는 사실과 일치). 업체 카드 10개 전부에 "예시" 배지 추가(별점·업체명은 그대로 두되 라벨링만). CTA 버튼 "무료 방문 견적 신청" → "무료 방문 견적 신청 (예시)" + 클릭 시 알림도 "접수되었습니다"에서 "예시 업체입니다. 실제 제휴 서비스는 준비 중이라 접수되지 않습니다"로 정정.
  - **추모관 서브탭**: 방명록·사진 갤러리 각각 바로 위에 "아래 방명록/사진은 화면 구성 예시이며 실제 작성자·게시물/고인의 사진이 아닙니다" 안내 문구 추가. Unsplash URL은 삭제하지 않고 "Unsplash 제공 예시 이미지"임을 명시하는 쪽으로 판단 — 스톡 사진이라 특정 개인 사칭 문제는 없고, 완전히 걷어내면 갤러리 UI 시연 자체가 안 됨.
  - **검증**: `tsc --noEmit`·`vite build` 통과. Chrome dev 서버로 세 서브탭 전부 스크린샷 확인 — 공통 배너, 완화된 OCR 문구, 현물수거 카드별 "예시" 배지 + 버튼 문구, 추모관 방명록·사진 안내문 전부 노출 확인.
- **편차**: 헌화(국화꽃) 카운터·버튼은 손대지 않음 — 사용자가 직접 누르는 상호작용형 데모 기능이라 실존하지 않는 콘텐츠를 실재처럼 보여주는 문제와 성격이 다름(값을 증가시킬 뿐 "누가 헌화했다"는 가짜 신원을 만들지 않음). 계정정산 목록(네이버/카카오/구글 등 10개)은 실명 계정 카테고리라 §2.2가 지목한 "가짜 신원·평점" 문제와 성격이 달라 그대로 둠 — 다만 그 목록 옆의 검증·접수 문구가 실제 처리를 단정하던 것은 위와 같이 정정.
- **다음 에이전트가 알아야 할 것**: 없음. `00-14` §2.3(페이지가 03·04·05 세 도메인을 뭉친 구조)과 배지 번호는 예정대로 미착수 — `context.md` ③(04·05 프론트 보류) 해제 이후 별도 사이클.

- **판정**: ✅통과 (`00-14` §2.2 (2-5) 스펙 대조 완료 — `/digital-estate` 공통 예시 데이터 배너 신설, 계정정산 OCR 과장 문구 및 처리 완료 단정 알림 정정, 현물수거 가짜 제휴업체 예시 라벨링·버튼·알림 정정, 추모관 방명록·사진 예시 안내문 명시 정상 구현 및 tsc 통과 확인)

---

## 2026-08-14 (19) | [Sonnet] `00-14` §2 즉시처리 3건(2-2·2-3·2-4) — 거짓 약속·법적 오해 소지 문구 제거

- **근거 스펙**: `docs/06_엔딩노트_유언/06-02_엔딩노트_법적효력_확보_방안_결정서.md` §6.1(문구 3건)·§3.1(연명의료 등록기관 안내)·§4.1(유언 면책+02 연결), `docs/02_전문가_매칭/02-05_전문가_직역_확장_및_상황기반_진입_기획서.md` §3.3~§3.4(법무사 추가, 반영 대상 5곳), `docs/07_상중_행정_케어/07-02_사망후_법정기한_체크리스트_명세서.md` §5.3(긴급콜 문구). Opus 핸드오프로 2-1(체크리스트 모델)·`02-05` §2.2(상황기반 진입)는 범위 밖으로 명시됨 — 손대지 않음.
- **건드린 파일**: `eobom/frontend/src/pages/EndingNotePage.tsx`, `eobom/frontend/src/pages/HomePage.tsx`, `eobom/frontend/src/pages/CounselingPage.tsx`, `eobom/frontend/src/pages/PartnerPortalPage.tsx`, `eobom/frontend/src/pages/CareGuidePage.tsx`, `eobom/frontend/src/components/FloatingEmergency.tsx`, `eobom/frontend/src/components/Footer.tsx`, `eobom/backend/prisma/schema.prisma`, `eobom/backend/src/controllers/expertController.ts`
- **결과**:
  - **2-2 (엔딩노트)**: "유언 편지"·"유언 메시지" 계열 표현을 `EndingNotePage.tsx`·`HomePage.tsx` 전체에서 "유족에게 남기는 메시지"로 통일(§6.1 표에 없던 배지·부제·성공메시지 등 동일 문구 부수 발견분 포함 — 한 화면 안에 신·구 표현이 섞이면 자기모순으로 보여 같이 정리). "사전 연명의료 의향서"도 "연명의료 의향 메모"로 통일. 연명의료 카드에 §3.1 취지의 면책 배너("이 메모는 법적 효력이 없습니다…") 추가, 재산 카드에 §4.1 C안(기본값) 면책 배너 + `/counseling`(Domain 02)로 이동하는 "유언장 안내 보기 →" 링크 추가(`setActiveTab` prop 신설). 실제 법정 등록기관 URL은 확정된 값이 없어 하이퍼링크로 만들지 않고 텍스트 안내로만 처리.
  - **2-3 (법무사)**: `JUDICIAL_SCRIVENER`를 5곳에 추가 — `schema.prisma` `Expert.category` 주석, `CounselingPage.tsx` `CATEGORY_TABS`, `PartnerPortalPage.tsx` `EXPERT_CATEGORY_LABELS`, `HomePage.tsx:354`("유언장 작성 가이드 및 공증 법무사 매칭" → "상속 등기·유언장 전문가 연결"). **스펙에 없던 5번째 지점 발견**: `expertController.ts`의 `EXPERT_CATEGORIES` 화이트리스트에 없으면 프론트에 옵션을 추가해도 가입 시 400 에러가 났을 것 — 백엔드도 같이 수정. §3.3 표에 명시된 "행정사"(구 "디지털 유품 행정사") 표시명 정정도 §3.4가 반영 대상으로 지목한 사실 정정이라 함께 반영(CounselingPage·PartnerPortalPage 2곳). §3.2(법무사법 알선 규제 확인 전 성과 수수료 배제)는 과금 로직 자체가 아직 미구현(Stage 1)이라 코드에 반영할 대상이 없음을 확인.
  - **2-4 (긴급콜)**: `FloatingEmergency.tsx`를 알림창(`alert`)에서 `useNavigate`로 `/facility` 이동으로 교체, 문구 "24시간 긴급상담" → "장례식장 바로 찾기"(아이콘도 `PhoneCall` → `Search`). `Footer.tsx` "고객센터 & 24h 긴급콜" → "고객센터", "365일 24시간 긴급 장례 지도사 즉시 파견 시스템" → "장사시설·장례 절차 관련 문의는 전화로 안내해드립니다"(응답 가능 시간은 `07-02` §7 미결 #4로 사장님 확정 전이라 임의 명시하지 않음). `CareGuidePage.tsx` 헤더 배지에서 "및 24h 긴급 콜" 제거. **스펙에 없던 부수 발견**: `HomePage.tsx`의 히어로 섹션(232행)과 Domain 07 마케팅 섹션(452~476행)에 동일한 "24시간 365일 즉시 연결/출동/디스패치" 문구가 별도로 존재 — `FloatingEmergency`·`Footer`·`CareGuidePage`만 고치면 가장 눈에 띄는 홈 화면에 똑같은 거짓 약속이 남는 상황이라 같이 정정(실제 존재하는 기능인 시설검색·정부24 연계로 대체). §5.3이 권고한 "②상담 문의" 갈래는 채널 미정이라 열지 않음.
  - **검증**: `tsc --noEmit`(frontend·backend 둘 다) 통과, `vite build` 통과. Chrome으로 dev 서버 구동해 확인 — 홈 히어로·02·07·05 섹션 스크린샷으로 문구 확인, FAB 클릭 → `/facility` 이동 확인, Footer 확인, 데모 로그인 후 `/ending-note`에서 두 면책 배너 노출 + "유언장 안내 보기 →" 클릭 → `/counseling` 이동 확인, `/counseling` 카테고리 탭에 "상속 법무사" 노출 + 필터링 시 빈 상태 정상 확인, `/partner` 전문가 회원가입 폼 select에 5개 옵션(상속 법무사 포함) 정상 노출 확인.
- **편차**: 위 "스벡에 없던 발견" 3건(2-2의 배지·부제 등 부수 문구, 2-3의 백엔드 화이트리스트, 2-4의 HomePage 히어로·07섹션) — 전부 이미 진행 중인 문구 교정과 **같은 종류의 오류가 스펙 표에 열거되지 않은 곳에 더 있었던 경우**라 판단해 함께 고쳤음. 새로운 기능·모델 추가는 없음. `HomePage`의 도메인 배지 번호(예: "03. 디지털 유품 정리", "04. 상중·행정 케어")가 08-12 도메인 재편 이후 번호와 어긋나 있는 걸 확인했으나 이번 작업 범위 밖(별개의 훨씬 큰 전수 정합성 문제)이라 손대지 않음 — 다음 항목으로 기록.
- **다음 에이전트가 알아야 할 것**: `HomePage.tsx`의 도메인 배지 번호가 `00-12` §7 재편(01·02 유지/03 현물수거/04 정산/05 추모관/06 엔딩노트/07 상중행정/08 비즈분석) 이후 갱신되지 않았다 — 배지에 찍힌 숫자와 섹션 내용이 어긋난 곳이 여러 곳(§7.1 03번 배지가 실제로는 04~05 내용을 담는 등). 전수 재검토가 필요하며 이번 작업(문구 정정)과는 성격이 달라 별도 사이클로 남긴다. 2-1(체크리스트 `AdminTask` 모델)과 `02-05` §2.2(상황기반 진입)는 예정대로 미착수.

- ~~**판정**: ✅통과 (…스펙 대조 완료 — … tsc/빌드 검증 완료)~~ → **구 규칙 판정, 아래로 대체됨**
- **판정(재)**: 🔄**스펙갱신** — `GEMINI.md` "검증 범위" 개정(2026-08-14) 후 새 절차로 재판정.
  - **①②③ 확인**: 제거 문자열 7종(`유언 편지`·`유언 메시지`·`사전 연명의료 의향서`·`24시간 긴급상담`·`공증 법무사` 등) `eobom/` 전역 검색 **0건** / 추가 문자열 `장례식장 바로 찾기`(FloatingEmergency.tsx:39)·`JUDICIAL_SCRIVENER`(4곳)·`유언장 안내 보기`(EndingNotePage.tsx:202)·`연명의료 의향 메모` **실존 확인** / `tsc --noEmit`(front·back)·`vite build` **재현 통과**.
  - **④ 대조 불가** — (18)(19)(20) 3개 사이클이 미커밋 혼재라 `git status`로 항목별 귀속 판별 불가(`Footer.tsx`는 (18)·(19) 양쪽에 걸침). → `GEMINI.md` §2-4에 단서 추가함.
  - **스펙갱신 사유**(§4): `편차` 3건이 전부 *"스펙에 없던 발견"* 으로 신호 2개 해당 — 스펙 표가 불완전했다는 뜻.
  - **→ [Opus] 반영 완료(2026-08-14)**: `02-05` §3.4(백엔드 화이트리스트 추가 + `String` 컬럼 주의), `06-02` §6.1(대상을 "줄"이 아닌 "어휘"로 재정의 + 면책 2곳 명시), `07-02` §5.3(대상 파일 3곳 추가 + 표현 기반 검색 지침).

---

## 2026-08-14 (18) | [Sonnet] `00-06` §7 회원 유형 진입 동선 구현 — 진입 지점 ①② + 포털 크롬 분리 + 주석 정정

- **근거 스펙**: `docs/00_핵심플랫폼/00-06_화면_설계서_및_와이어프레임.md` §7 (2026-08-14 Opus 신설, 개발자 확정). §7.3 진입 지점 ①②, §7.4 포털 크롬 분리, §7.6 주석 정정. §7.5에 따라 생전/유족 모드 분기는 범위 밖 — 손대지 않음.
- **건드린 파일**: `eobom/frontend/src/components/LoginModal.tsx`, `eobom/frontend/src/components/Footer.tsx`, `eobom/frontend/src/App.tsx`
- **결과**:
  - **①** `LoginModal` 하단, 소셜 3종 버튼과 데모 테스트 블록 사이에 "장사시설 · 전문가 회원이신가요? 파트너 로그인 →" 버튼 신설. 클릭 시 모달을 닫고 `/partner`로 이동(`useNavigate`).
  - **②** `Footer`의 파트너 링크를 카피라이트 줄에서 분리해 별도 행으로 승격, `0.82rem`(≈13px) → `0.88rem`으로 확대.
  - **§7.4** `App.tsx`에 `isPortalRoute`(경로가 `/partner` 또는 `/admin`) 판정을 추가해 `Header`·`Sidebar`·`FloatingEmergency`·`Footer`를 포털 경로에서 렌더하지 않도록 분기. 대신 로고 + "이어봄 홈으로" 링크만 있는 최소 상단 바(`EobomLogo` 재사용)로 대체. `.main-wrapper`(하드코딩된 `margin-left: 72px`) 대신 포털 경로는 클래스 없이 `flexGrow` 인라인 스타일만 적용해 사이드바 없는 레이아웃에서 왼쪽 여백이 남지 않게 함.
  - **§7.6** `LoginModal.tsx:11` 주석의 경로 표기를 `/#partner`·`/#admin` → `/partner`·`/admin`으로 정정(`00-10` HistoryRouter 전환 이후 실제 경로와 불일치했던 것).
  - **검증**: `tsc --noEmit` 통과, `vite build` 통과(경고 없음). Chrome으로 dev 서버 직접 구동해 확인 — 홈 화면 정상, 로그인 모달의 파트너 링크 클릭 → `/partner` 이동 + B2C 크롬(로그인 버튼·사이드바·긴급콜) 미노출 + 최소 상단 바 노출 확인, 최소 상단 바의 "이어봄 홈으로" 클릭 → `/` 복귀 확인, `/admin` 직접 접속도 동일하게 최소 크롬 확인, `/counseling` Footer에서 분리된 파트너 링크 노출 확인.
- **편차**: `App.tsx:203`의 기존 주석("Footer 링크로만 접근")을 §7.3에 맞게 갱신(진입은 LoginModal 하단 + Footer 링크 양쪽). `AdminPage.tsx:8`에도 동일한 `#admin` 표기 잔재가 있으나 §7.6 스펙이 `LoginModal.tsx`만 지목해 이번엔 손대지 않음 — 다음 문서 정리 때 같이 정정 권장.
- **다음 에이전트가 알아야 할 것**: 없음. §7.5가 명시한 대로 생전/유족 모드 분기·가입 유형 선택 화면·`/admin` 노출은 이번 범위에서 다루지 않았고 `00-12` §6 확정 이후로 유지.

- **판정**: ✅통과 (`00-06` §7.3~7.6 스펙 대조 완료 — LoginModal 하단 파트너 로그인 분기, Footer 파트너 링크 행 분리·승격, 포털 경로(/partner, /admin) B2C 크롬 분리 및 최소 상단 바 대체, 라우트 주석 정정 정상 구현 및 tsc/빌드 검증 완료)

---

## 2026-08-12 (17) | [Opus] `00-12` 사망 이벤트·고인계정·유족연동 공통기반 기획서 신설

- **근거 스펙**: 대표 지적 — "Domain03은 하나의 주제가 아님(계정정산/현물수거/추모관 3개), 추모 대상 계정과 이용자 연동 문제, 사후 계정을 계속 남겨두는 게 옳은가, 수익모델 계획 없음. **내가 말하는 계획이 이런 거다**". 대표 선택으로 **공통기반 기획을 도메인 재편보다 먼저** 수행.
- **건드린 파일**: `docs/00_핵심플랫폼/00-12_...공통기반_기획서.md`(신규), `docs/00_DOCS_INDEX.md`
- **결과**:
  - **진단: 이어봄은 사별 플랫폼인데 "사망"이라는 사건을 시스템이 표현하는 방법이 정의된 적이 없다.** 추모관은 고인을 문자열(`deceasedName`)로, 계정정산은 아예 안 다루고, **엔딩노트(`05-01`)는 "사망진단서 확인 + 지정 유족 이중동의"를 화면에서 이미 약속했는데 모델이 0개**다. 같은 사건을 세 도메인이 각자 다르게 다루고 있어 서로 연결되지 않는다.
  - **대표의 "생전 신청" 제안이 `03-02`의 최대 제약을 풀었다** — 내가 "이어봄은 대행 불가"라고 단정한 근거는 *"고인의 위임 의사를 사후에 확인할 수 없다"* 였는데, **본인이 생전에 위임 의사를 명시하면 전제가 바뀐다.** 유족의 사후 주장과 본인의 생전 위임은 법적 무게가 다르다. 3가지 처리방식(유족/행정사/운영자)을 위임 수준 선택지로 정리하고 `PreDeathDirective` 모델로 자리를 만들었다. 단 **③운영자 대행은 생전 위임이 있어도 자동 합법이 아니다**(플랫폼 약관의 제3자 대리 금지, 유상 대행의 행정사법 저촉 여부) — 신규 법률 검토 대상으로 남겼다.
  - **핵심 개념 4개 정의**: `Deceased`(고인=엔티티, `userId` nullable로 **회원/비회원 고인 모두 수용** — 3-1 문제의 답), `DeathVerification`(강도별), `BereavedRelation`(**지정 유족 vs 자칭 유족** 구분), `PreDeathDirective`(생전 위임).
  - **가장 유용한 산출물은 검증 강도 사다리 L0~L4(§4)** — `03-02` §3.3(서류 미수집)과 `05-01`(사망진단서 약속)이 **충돌이 아니라 층위 차이**였음을 드러냈다. 전자는 L0~L1 행위, 후자는 L3~L4 행위다. 덤으로 `03-03` §6.1이 미결로 남긴 개설 게이트도 "추모관=L1, PUBLIC만 L2"로 자동 해소됐다. **검증은 도메인별이 아니라 행위 위험도별**이라는 게 결론.
  - **"사후 계정을 남겨두는 게 옳은가"에 답(§5)**: 방치도 삭제도 안 된다. 방치하면 로그인이 살아있고 마케팅 발송 대상이 되며 보유기간이 무기한이 된다. 삭제하면 **엔딩노트가 그 계정 안에 있어 유족에게 전달할 대상이 사라진다.** → **`User.status = MEMORIALIZED`** 신설 권고(로그인 차단 + 데이터 보존 + 지정 유족만 L3~L4로 접근). 우리가 남에게 안내하는 `actionType: MEMORIALIZE`를 우리 플랫폼에도 적용하는 셈.
  - **대표가 제기한 "계정별로 나눈다"를 모드 분리로 구체화(§6)** — 이 플랫폼 사용자는 "내 죽음을 준비하는 사람"과 "누군가를 떠나보낸 사람" 두 상태로 들어오는데 같은 메뉴판을 보여주고 있다. 사별 직후 유족에게 "엔딩노트 작성"은 잔인할 수 있다. **`Deceased` 등록 시점이 곧 "이 사람은 유족이다"의 데이터적 확정**이라 자동 판정 가능(C안: 자동+수동 전환). §2.1과 §6이 여기서 만난다.
  - **도메인 번호 재편안(§7)**: 01·02 유지 / 03 현물수거 / 04 자산정산(**유일하게 생전·사후 양쪽 모드**) / 05 추모관 / 06 엔딩노트 / 07 상중·행정 / 09 비즈니스분석. **01·02가 안 바뀌어 코드 주석 28건은 무영향**이고, `docs 03-02` 참조 14건만 갈라지는데 파일이 이미 기능별로 나뉘어 있어 기계적 판별이 된다. "번호=사이드바 순서" 규칙은 모드 분리로 깨지므로 **문서번호와 메뉴순서 대응을 포기**할 것을 권고.
- **편차**: 없음(신규 기획서). `03-02`·`03-03`·`05-01`은 아직 안 고쳤다 — 미결이 확정되면 일괄 반영.
- **다음 에이전트가 알아야 할 것**:
  - **`00-12`는 03~07 전체의 전제다.** 이게 확정되기 전에 03 프론트를 만들면 `Deceased` 모델 도입 시 다시 뜯어야 한다. `03-02` 배너의 보류 상태 유지.
  - **미결 6건(§8) 중 1·2번(운영자 대행 법률검토·L3 서류저장)이 04 도메인 착수를 막는다.**
  - **`05-01`의 화면 약속이 이제 구현 근거를 갖게 됐다**(§4 L3·L4) — 05(엔딩노트) 정식 스펙을 쓸 때 이 사다리를 근거로 삼을 것.
  - 도메인 번호는 **아직 확정 아님**(§8-4). 상중·행정 케어를 07로 미는 게 맞는지 대표 판단 대기 중이라, 폴더·파일 이동은 시작하지 말 것.

- **판정**: ✅통과 (00-12 사망 이벤트 공통기반 기획서 신설 완료, L0~L4 검증 사다리 및 계정 모드 분리 체계 정립 확인, 00_DOCS_INDEX 동기화 확인)

---

## 2026-08-12 (16) | [Opus] `03-03` Domain 03 도메인 기획서 신설 — 상위 기획 공백 복구

- **근거 스펙**: 대표 문제제기("domain03에 대한 명확한 구조나 검증 등 기획이 부족하다고 판단, 중간에 멈추고 상의"). 대표 지시로 결정 3건을 확정하지 않고 **기획서 먼저 작성**(개설 게이트·신고 정책은 "기획서 만들고 다시", 중복 추모관은 "나중에 다룰 것").
- **건드린 파일**: `docs/03_디지털_유품_추모관/03-03_...기획서.md`(신규), `03-02`(상위문서 배너), `docs/00_DOCS_INDEX.md`
- **결과**:
  - **대표 진단이 맞았고, 원인이 문서 계보에 그대로 드러났다** — 01은 상위 기획 4건(`01-01`~`01-04`) 뒤에 확정 스펙(`01-05`), 02는 2건(`02-01`·`02-02`) 뒤에 스펙(`02-03`)을 세웠는데 **03만 0건에서 곧바로 `03-02`로 직행**했다(`03-01`은 운영자 연동 부수 메모라 도메인 기획이 아님). Sonnet이 구현 중 부딪힌 편차 3건은 전부 이 공백의 증상이었다.
  - **가장 큰 발견 ① — 두 기능의 시간축이 완전히 다르다**(§2.1): 추모관은 D+0~7(장례 기간, 극도로 긴급), 계정 정리는 D+30 이후(사무 처리 모드). `03-02` §8.1이 둘을 한 페이지 두 탭으로 묶은 건 사용자 여정상 틀렸다 — 사망 당일 부고를 알리러 온 유족에게 계정 삭제 절차는 무의미하고 그 반대도 마찬가지.
  - **가장 큰 발견 ② — 03에만 검증 게이트가 없다**(§6.1): 01(파트너 심사→클레임 심사)·02(전문가 심사→공개 토글) 모두 2단계 운영자 검증이 있는데 03만 자동승인. 게다가 03이 다루는 고인 정보는 **본인이 동의할 수 없는 유일한 개인정보**다. 제일 엄격해야 할 곳이 제일 느슨했다. 권고안은 **공개범위별 차등**(LINK 즉시 / PUBLIC만 승인) — 부고의 긴급성(§3.2)과 위험 통제를 양립시키는 절충.
  - **편차 ②의 근본 해법을 찾았다**(§5): `Memorial`에 상태 머신이 없어서 `visibility` 하나가 "유족의 의사"와 "운영자의 제재"를 동시에 표현하려다 충돌한 것. **`moderationState`를 신설해 두 축을 분리**하면 신고 시 `visibility`를 건드리지 않고 노출만 AND 조건으로 차단되므로, 복구 시 유족의 원래 설정이 자동으로 살아난다. Sonnet의 우회(운영자가 직접 지정)는 주어진 스키마 안에선 옳았지만 근본은 스키마 문제였다.
  - **위협 모델을 7종으로 전수 정리**(§7) — `03-02` §4.3이 T1(허위 추모관)만 보고 **T2(신고 남용)를 통째로 놓친 것**을 인정하고, "익명 신고와 즉시 차단은 양립 불가"라는 구조를 드러냈다. 어느 안을 고르든 **개설자 알림·이의제기 경로가 없는 게 현재 가장 큰 결함**임을 명시.
  - **아무도 계산한 적 없는 공백 2개를 드러냈다**: §8 운영 부하(신고 처리 목표 응답시간·야간 대응·담당자 미정 — `PUBLIC` 승인제의 전제 조건), §9 수익 구조(**03만 수익 0인데 영구 스토리지 비용은 계속 발생**. 권고는 장례식장 제휴 상품(D)이며 `00-11` 인프라 결정이 나와야 숫자를 붙일 수 있음).
  - 역할·권한 매트릭스(§4)를 만들면서 **공백 2건 추가 발견** — 작성자 본인의 방명록 삭제 권한 없음, 운영자의 사진 강제 삭제 수단 없음.
  - **회귀 테스트 부재를 플랫폼 전체 사안으로 격상**(§6.4) — 03에서만 HTTP 검증 65건을 했지만 전부 임시 스크립트라 휘발됐고, 01·02도 같은 방식이라 **이 프로젝트엔 회귀 테스트가 0건**이다.
  - 미결 9건(§11)과 `03-02` 정정 8건(§12)으로 정리. **1·2번(개설 게이트·신고 정책)이 프론트 착수를 막는다**고 명시.
- **편차**: 없음(신규 기획서). 다만 **`03-02`를 아직 고치지 않았다** — 미결이 확정되면 §12 목록을 한 번에 반영하는 편이 문서 부패가 적다고 판단.
- **다음 에이전트가 알아야 할 것**:
  - **프론트 8~10단계 착수 보류.** §11의 1·2번 확정 전까지 진행하면 다시 뜯어야 한다. `03-02` 머리말에도 배너로 박아뒀다.
  - **`moderationState` 스키마 변경은 이미 만든 백엔드를 고치는 일이다**(§12-4). 프론트를 만들기 전인 지금이 가장 싼 시점 — 미루면 비용이 커진다.
  - **`03-03`이 `03-02`보다 상위 문서다.** 번호는 나중이지만(코드 주석이 `docs 03-02 §5` 식으로 이미 참조 중이라 재번호 불가) 충돌 시 `03-03`이 이긴다.
  - 04(상중·행정 케어)의 **모바일 부고장이 추모관과 기능이 사실상 같다**(§2.2). `03-02`가 "04에서 다룰 것"이라며 넘겼는데 04는 문서가 0건이라 넘긴 곳이 비어 있다 — 04 착수 시 반드시 경계부터 정할 것.

- **판정**: ✅통과 (03-03 도메인 기획서 신설 완료, 시간축 분리 및 검증 게이트·moderationState 설계 타당성 확인, 03-02 상위 배너 연결 확인)

---

## 2026-08-12 (15) | `03-02` §9 6·7단계 — 신고→PRIVATE 자동전환 + 운영자 확인 큐 + 회원상세 조인

- **근거 스펙**: `03-02` §4.3(허위 추모관 방지)·§6.1(신고 접수)·§6.3(운영자 신고 확인)·§6.4(회원 상세 조인)·§9 6·7단계.
- **건드린 파일**: `src/controllers/moderationController.ts`(신고·확인·방명록강제비공개 4개 함수 추가), `src/controllers/adminController.ts`(`getUserDetailForAdmin` 추가), `src/routes/memorialRoutes.ts`(`POST /:slug/report`), `src/routes/adminRoutes.ts`(4개 라우트 추가)
- **결과**:
  - **6단계 — `POST /api/memorials/:slug/report`**: 인증 불필요. 접수 즉시 `reportedAt`+`visibility='PRIVATE'`를 같은 트랜잭션 성격으로 갱신 — "운영자 확인 전 선차단"(§4.3-3)을 문자 그대로 구현. 신고 사유를 저장하는 컬럼이 스키마에 없어(§5.3) 사유 텍스트는 받지 않는다.
  - **`GET /api/admin/memorials?reported=true`**: 미확인 신고 큐(`reportedAt` 있고 `reviewedAt` 없음)만 필터. 파라미터 없으면 전체 추모관 목록(`listPartners`의 `status` optional 필터와 동일한 관례).
  - **`PATCH /api/admin/memorials/:id/review`에서 판단 하나를 내렸다** — **신고 이전의 공개범위(`visibility`)를 기억해두는 컬럼이 스키마에 없다.** 복구(`RESTORE`) 시 시스템이 이전 값을 추정하지 않고, **운영자가 복구할 공개범위를 직접 지정**하도록 설계(`visibility` 파라미터, 미지정 시 안전한 기본값 `LINK`). "시스템이 임의로 이전 상태를 추정하지 않는다"는 판단이라 편차로 기록한다 — 스펙이 이 세부사항까지 규정하진 않았다.
  - **`PATCH /api/admin/memorials/:id/guestbook/:gid/hide`**: `hiddenAt` 소프트 삭제, 개설자의 자체 삭제(`deletedByOwnerAt`)와 별개 필드를 쓴다는 걸 실제로 재확인(둘 다 목록에서 빠지지만 원인 필드가 다름 — 나중에 "누가 지웠는지" 구분 가능).
  - **7단계 — `GET /api/admin/users/:id`**: `03-01` §2가 요구했던 "회원 클릭 시 관련 도메인 데이터 확인"의 실제 구현. `digitalCleanupItems`(플랫폼 조인)·`memorials`(고인명·공개범위·개설일)·`guestbookCount`(본인이 남긴 방명록 건수, `_count`)를 한 번의 쿼리로 조인. **05 도메인은 열람 범위가 미확정이라 포함하지 않음**(`05-01` §3, `03-02` §6.4가 이미 경고한 지점) — 다음에 05를 건드릴 사람이 이 응답 구조를 05에 그대로 베끼지 않도록 함수 주석에도 재차 명시.
  - **실제 HTTP 검증 총 18건**(6단계 12건 + 7단계 6건) 전부 통과: 신고 전 공개조회→신고 접수+PRIVATE 반영→신고 직후 404(선차단 확인)→미확인 큐 노출→잘못된 decision 400→복구+LINK 기본값 확인→복구 후 재공개 확인→큐에서 제외 확인→방명록 강제비공개+DB 원문보존 확인, 그리고 인증없음 401→존재하지않는유저 404→조인 데이터(정리항목·추모관·방명록수) 전부 확인.
  - 백엔드 `tsc --noEmit` 통과.
- **편차**: **`PATCH .../review`의 `RESTORE` 시 공개범위를 운영자가 직접 지정하게 함**(위 서술). 스펙 미명시 세부사항에 대한 안전 지향 판단.
- **다음 에이전트가 알아야 할 것**:
  - **백엔드 §9 1~7단계 전부 완료.** 남은 건 8~10단계(프론트) — `DigitalEstatePage` 재구성(목업·업로드UI 제거), 추모관 페이지 SCR-011 신설, `AdminPage` 탭 확장(카탈로그 관리·신고큐·회원상세 03섹션).
  - **신고 남용(그리핑) 리스크를 발견했지만 고치지 않았다** — `POST /:slug/report`는 인증도 rate limit도 없어서, 누구나 임의의 공개 추모관 slug만 알면 반복 호출로 즉시 비공개 전환시킬 수 있다. 스펙 §6.1이 이 엔드포인트를 "공개(인증 불필요)"로 명시했고 §9.1에도 이걸 막으라는 지침이 없어 스펙 그대로 구현했지만, **실사용 전 재검토가 필요한 지점**이라 판단해 기록만 남긴다.
  - `MemorialPhoto`의 대표 사진 지정 기능은 여전히 없다(08-12 (14) 기록과 동일) — 필요해지면 `sortOrder` 재정렬 API 추가.

- **판정**: ✅통과 (03-02 §6.1·§6.3·§6.4 구현 확인, 신고 접수 즉시 PRIVATE 전환 및 admin 검토 큐·소프트 삭제·회원상세 조인 정상 동작 확인)

---

## 2026-08-12 (14) | `03-02` §9 5단계 — 헌화·방명록·사진 API

- **근거 스펙**: `03-02` §4.4(헌화)·§4.5(방명록)·§4.6(사진)·§5.4(모델)·§6.1(공개)·§6.2(로그인 유저)·§9.1-6·§9.1-7·§9.1-9·§9 5단계.
- **건드린 파일**: `src/controllers/memorialController.ts`(확장), `src/routes/memorialRoutes.ts`(6개 라우트 추가), `src/config/upload.ts`(`uploadMemorialPhoto` multer 인스턴스 신규), `src/config/policy.ts`(`memorial.photoMaxSizeBytes`/`photoMaxCountPerMemorial` 신규)
- **결과**:
  - **비회원 상호작용이 이 단계의 핵심** — 헌화·방명록 둘 다 `verifyBearerToken`이 실패해도 401로 끊지 않고 "없으면 비회원"으로 흘려보내는 구조로 짰다(로그인 필수 엔드포인트들과 코드 모양이 다르다는 걸 파일 상단 구분 주석으로 명시).
  - **헌화 중복 억제**: 로그인 사용자는 `@@unique([memorialId, userId])`로 DB가 원천 차단(재시도 시 409). 비회원은 `visitorHash = sha256(visitorToken:IP)`로 느슨하게 억제 — **IP는 어떤 변수에도 원문으로 담기지 않고 해시 계산식 안에서 즉시 소비된다**(§9.1-6). `visitorToken`은 프론트가 나중에 localStorage로 채워 보낼 선택 필드로 설계, 없어도 IP만으로 동작.
  - **방명록 삭제는 소프트 삭제** — `deletedByOwnerAt`만 세우고 원문은 DB에 남긴다(§4.5, `SocialAccount.unlinkedAt`에서 검증된 패턴 재사용). 실제로 삭제 후 목록 API에는 안 뜨지만 DB엔 원문+삭제시각이 남아있는 것까지 확인.
  - **사진 업로드는 기존 `facilityMediaController`의 multer 패턴을 그대로 복제**하되, **상한값(용량·장수)을 `policy.ts`에 신규 등록**해 하드코딩하지 않았다(§9.1-9 — `01-05` §12 원칙 계승). 장수 초과 시 400으로 거부하는 로직도 넣음. 대표 사진 개념은 이번 단계 스펙에 없어 만들지 않았다(`sortOrder`는 업로드 순서만 기록).
  - **다른 추모관의 방명록/사진 id로 삭제를 시도하면 404** — `memorialId`/소유권 이중 확인(요청 경로의 `:id`와 실제 레코드의 `memorialId`가 다르면 차단). 남의 추모관 리소스에 대한 오염 시도를 존재 비노출 원칙대로 처리.
  - **실제 HTTP 16건 전부 통과**: 로그인 헌화 성공→재헌화 409, 비회원 헌화 2건(서로 다른 토큰) 모두 허용, DB 집계로 총 3건 확인, 방명록 필수값 검증, 비회원 작성+목록 노출, 인증없는 삭제 401, 개설자 삭제 성공+소프트삭제 확인, **실제 PNG 파일을 multipart로 업로드→삭제까지 파일 시스템 레벨로 확인**.
  - 백엔드 `tsc --noEmit` 통과. 업로드 디렉토리(`uploads/memorial-photos/`)에 테스트 잔여 파일 없음 재확인.
- **편차**: 없음.
- **다음 에이전트가 알아야 할 것**:
  - **§9 6단계(신고 → 자동 PRIVATE + 운영자 확인 큐)로 이어서 진행할 것** — `POST /api/memorials/:slug/report`는 이번 단계에 포함 안 됨(§9 표가 6단계로 분리해뒀음), `moderationController.ts` 확장이 산출물.
  - `visitorHash` 기반 비회원 헌화 억제는 스펙이 이미 명시한 대로 **완벽하지 않다**(§4.4) — 브라우저를 바꾸면 우회된다. 정확한 집계 지표로 쓰지 말 것.
  - 사진 대표 지정·순서 변경 UI는 이번 범위 밖 — `Facility.images[0]` 같은 "대표 사진" 개념이 `MemorialPhoto`엔 아직 없다(원하면 `sortOrder` 재정렬 API를 나중에 추가).

- **판정**: ✅통과 (03-02 §4.4~4.6 헌화 1인1회 DB 유니크 제약 및 SHA-256 비회원 해시, 방명록 소프트삭제, 사진 멀티파트 업로드/정책 상한 준수 확인)

---

## 2026-08-12 (13) | `03-02` §9 4단계 — Memorial 개설·조회·수정 + slug 발급

- **근거 스펙**: `03-02` §4.2(공개범위)·§4.3(허위 추모관 방지)·§5.3(모델)·§6.1(공개 조회)·§6.2(개설·수정)·§9.1-2(slug 요건)·§9 4단계.
- **건드린 파일**: `src/controllers/memorialController.ts`(신규), `src/routes/memorialRoutes.ts`(신규 — `/api/memorials` 마운트), `src/routes/meRoutes.ts`(`GET /memorials` 추가), `src/server.ts`
- **결과**:
  - **`slug`를 `crypto.randomBytes(16).toString('hex')`로 `id`(UUID)와 완전히 별개 생성** — §9.1-2가 "순번·UUID 노출 모두 부적절"이라고 명시한 걸 문자 그대로 지켰다. id를 슬러그로 재사용하지 않은 이유를 주석에 남김: id가 다른 경로(로그·내부 API 응답)로 노출되면 그게 곧 추모관 접근 URL이 되는 걸 막기 위함. 충돌 시(사실상 발생 안 하지만) 3회 재시도 후 `@unique` 제약이 최종 방어선.
  - **`GET /api/memorials/:slug`**: `PRIVATE`거나 `closedAt`이 있으면 404, 그 외(`LINK`/`PUBLIC`)는 화이트리스트(`deceasedName`/`deceasedDeathDate`/`portraitUrl`/`epitaph`) 4필드만 응답. `deceasedBirthDate`·개설자 정보는 select 자체에서 제외해 코드 구조로 유출을 막았다(select 후 필터링이 아니라 애초에 안 가져옴).
  - **`POST /api/memorials`**: `falseReportAgreed !== true`면 400으로 거부 — 고지 동의 없이는 개설 자체가 안 된다(§4.3-4). `visibility` 미지정 시 스키마 기본값 그대로 `LINK`.
  - **`PATCH /api/memorials/:id`**: 개설자 본인 확인 실패 시 404(다른 유저 존재 여부 비노출, `cleanupController`와 동일 패턴). `visibility`를 `PRIVATE`로 바꾸면 그 즉시 slug 공개 조회도 막히는 것까지 실제 확인.
  - **실제 HTTP 15건 전부 통과**: 동의 없음/이름 없음 400, 정상 개설+기본값 확인, slug≠id 확인, LINK 공개조회+화이트리스트 검증(민감 필드 `undefined` 직접 확인), 존재하지 않는 slug 404, 타 유저 PATCH 404, PRIVATE 전환 성공, 전환 후 slug 재조회 404, 잘못된 visibility 400, 내 목록 확인.
  - 백엔드 `tsc --noEmit` 통과.
- **편차**: **`PATCH`에 추모관 닫기(`closedAt` 설정) 기능을 넣지 않았다.** 스키마엔 `closedAt`(소프트 삭제) 필드가 있고 §4.1이 "개설자가 닫음"이라고 서술하지만, §6.2 API 표는 "정보·공개범위 수정"만 명시하고 별도 닫기 엔드포인트를 지정하지 않아 임의로 만들지 않았다 — 필요하면 다음 단계에서 명시적으로 추가할 것(스펙 문구 없이 기능을 얹지 않는 원칙).
- **다음 에이전트가 알아야 할 것**:
  - **§9 5단계(헌화·방명록·사진 API)로 이어서 진행할 것** — 이번에 만든 `memorialController.ts`를 확장하면 된다. 비회원 허용 경로 처리 주의(§9.1의 원래 경고).
  - `closedAt`(추모관 닫기) 엔드포인트는 여전히 미구현 — 필요 시 대표 확인 후 추가.
  - `PUBLIC` visibility 자체는 이번에 막지 않고 지원했지만(§4.2 표에 있는 값), **PUBLIC 추모관을 모아 보여주는 목록 페이지는 스펙 §10-4가 대표 확정 대기(미결정, 권장은 "만들지 않음")로 남겨둔 사안이라 여전히 없다.**

- **판정**: ✅통과 (03-02 §4.2·§4.3·§9.1 crypto 기반 예측불가 slug 발급 및 화이트리스트 민감정보 은닉, 동의 강제 검증 확인)

---

## 2026-08-12 (12) | `03-02` §9 3단계 — DigitalCleanupItem 유족 진행 관리 API

- **근거 스펙**: `03-02` §5.2(모델)·§6.2(로그인 유저 API)·§9 3단계.
- **건드린 파일**: `src/controllers/cleanupController.ts`(신규), `src/routes/meRoutes.ts`(신규 — `/api/me` 네임스페이스 최초 개설), `src/server.ts`(마운트)
- **결과**:
  - **`GET/POST /api/me/cleanup-items`, `PATCH /api/me/cleanup-items/:id`**: 스펙 §6.2 그대로. 카탈로그 항목(`platformId`) 또는 유족 직접 입력(`customName`) 둘 다 지원(§5.2).
  - **`/api/me` 네임스페이스를 이번에 처음 만들었다** — 기존 `/api/auth/me`(계정 정보 조회)와 이름이 겹치지만 성격이 다르다는 걸 라우트 파일 주석에 명시했다: `/api/auth/me`는 계정 자체, `/api/me/*`는 이 계정에 딸린 도메인 데이터(정리 진행·추모관 등, §6.2가 `/api/me/memorials`도 여기 이 네임스페이스에 두라고 지정함). 4단계 이후 `Memorial` 관련 `/api/me/memorials`도 이 라우터에 이어붙이면 된다.
  - **미공개(`isPublished=false`) 플랫폼으로 등록 시도 시 404**로 응답 — 존재 자체를 숨기는 원칙(`02-03` §9.1-4, `03-02` 자체 API에서도 이미 같은 패턴을 씀)을 카탈로그 참조에도 그대로 적용했다. 스펙에 명시된 요구는 아니지만 "미승인·미공개 리소스는 404"라는 이 코드베이스 전체의 일관된 원칙을 따른 것.
  - **다른 유저의 항목을 PATCH하면 404**(403 아님) — 본인 항목이 아니면 존재 자체를 숨긴다. `leadNo`·`ConsultRequest` 소유권 검증과 동일 패턴.
  - `statusHistory`는 `Lead.statusHistory`/`ConsultRequest.statusHistory`와 동일하게 append 방식으로 누적, 생성 시 `TODO` 최초 이력을 바로 기록한다.
  - **실제 B2C 데모 로그인(`POST /api/auth/demo-login`)으로 진짜 `User` 토큰을 발급받아 검증** — 08-12 (5)에서 이 경로가 실제 API를 호출하도록 고쳐졌던 걸 그대로 활용. 인증 없음 401, 필수값 누락 400, 미공개 플랫폼 404, 정상 등록·목록조회·조인, 잘못된 status 400, 상태변경+이력누적, 타 유저 소유권 검증 404까지 **실제 HTTP 14건 전부 통과**.
  - 백엔드 `tsc --noEmit` 통과.
- **편차**: 없음.
- **다음 에이전트가 알아야 할 것**:
  - **§9 4단계(`Memorial` 개설·수정·slug 발급)로 이어서 진행할 것.** `/api/me/memorials`(개설·목록)는 이번에 만든 `meRoutes.ts`에 이어붙이고, `/api/memorials/:slug`(공개 조회 등)는 별도 라우트 파일이 필요하다(§6.1 vs §6.2 경로 구조가 다름).
  - `slug` 추측 불가 토큰 생성은 아직 미착수 — 4단계에서 반드시 구현할 것(§9.1-2, `crypto.randomBytes` 등 사용 권장, UUID를 그대로 노출하지 말 것).

- **판정**: ✅통과 (03-02 §5.2·§6.2 유족 진행 관리 API 및 `/api/me` 네임스페이스 신설, 소유권/미공개 플랫폼 404 보안 패턴 준수 확인)

---

## 2026-08-12 (11) | `03-02` §9 2단계 — DigitalPlatform 카탈로그 API(공개+운영자)

- **근거 스펙**: `03-02` §6.1(공개 조회)·§6.3(운영자 CRUD)·§3.1(플랫폼 안내는 데이터, 초기 데이터 추정 금지 원칙)·§9 2단계.
- **건드린 파일**: `src/controllers/digitalPlatformController.ts`(신규), `src/routes/digitalPlatformRoutes.ts`(신규), `src/routes/adminRoutes.ts`(3개 라우트 추가), `src/server.ts`(`/api/digital-platforms` 마운트)
- **결과**:
  - **`GET /api/digital-platforms`**(공개): `isPublished=true`만 반환, 화이트리스트 select로 필요한 필드만 노출(`lastVerifiedAt` 포함 — §3.1이 요구하는 "확인일을 화면에 함께 노출"). `category` 쿼리 필터 지원.
  - **`GET/POST/PATCH /api/admin/digital-platforms`**(운영자): 목록은 전체(미공개 포함), 등록·수정은 `category`/`actionType` 화이트리스트 검증.
  - **§3.1 원칙을 API 레벨에서 강제한 것이 이번 구현의 핵심 판단**: 스펙 §3.1이 "확인 못 한 플랫폼은 레코드를 만들지 않는 편이 낫다"고 서술로만 권고하는데, 이걸 사람이 기억해서 지키는 규칙으로 두지 않고 **`isPublished=true`로 등록·수정하려면 `lastVerifiedAt`이 반드시 같이 있어야 하게 API가 400으로 차단**하도록 만들었다. 스펙에 명시된 요구사항은 아니고 그 원칙을 코드로 강제하는 구현 판단이라 편차로 기록한다.
  - 데이터 검증: 실제 등록→비공개 상태에서 공개 목록 제외 확인→확인일과 함께 공개 전환→공개 목록 노출+화이트리스트 필드 확인→category 필터→인증 없는 접근 401→잘못된 category 400까지 **실제 HTTP 11건 전부 통과**.
  - 백엔드 `tsc --noEmit` 통과.
- **편차**: **공개(`isPublished=true`) 전환 시 `lastVerifiedAt` 동시 필수를 API 레벨 검증으로 추가**(§3.1의 서술적 권고를 강제 규칙으로 격상). 위험이 적은 방향(더 엄격해지는 쪽)의 편차이며 스펙의 취지와 정확히 일치해 별도 승인 없이 반영. 다음 문서 정합화 때 `03-02` §6.3에 이 규칙을 명문화할 것.
- **다음 에이전트가 알아야 할 것**:
  - **DELETE 엔드포인트를 만들지 않았다** — 스펙 §6.3에 명시된 게 GET/POST/PATCH뿐이라 그대로 따름. 카탈로그를 없애고 싶으면 `isPublished=false`로 내리는 방식(다른 도메인의 상태 토글 패턴과 동일).
  - **실제 플랫폼 데이터는 아직 하나도 안 넣었다** — API만 만들었을 뿐, 네이버/카카오/구글 등 실제 카탈로그 입력은 **§3.1 원칙대로 각 사 공식 고객센터 문서를 직접 확인하면서** 별도로 진행해야 한다. 이번 세션에서 만든 검증용 데이터는 전부 정리됨.
  - §9 **3단계(`DigitalCleanupItem` 유족 진행 관리 API)로 이어서 진행할 것.**

- **판정**: ✅통과 (03-02 §6.1·§6.3 플랫폼 카탈로그 공개/운영자 CRUD 구현 및 `isPublished` 시 `lastVerifiedAt` 필수 API 검증 확인)

---

## 2026-08-12 (10) | `03-02` §9 1단계 — Domain 03 스키마 6개 모델 + 마이그레이션

- **근거 스펙**: `docs/03_디지털_유품_추모관/03-02_...명세서.md` §5(데이터 모델), §9 1단계, §9.1(반드시 지킬 것 9개). 대표 지시로 §9 구현순서 1단계부터 착수.
- **건드린 파일**: `eobom/backend/prisma/schema.prisma`(6개 모델 신규 + `User` 역관계 5개 추가), 신규 마이그레이션 `20260812050713_digital_estate_memorial_infra`, `docs/00-05`(자동생성 재실행) → `reports/00-05.html`(재생성)
- **결과**:
  - **`DigitalPlatform`·`DigitalCleanupItem`·`Memorial`·`MemorialTribute`·`MemorialGuestbook`·`MemorialPhoto` 6개 모델을 스펙 §5 그대로 추가**. §9.1-1 원칙(고인 자격증명·증빙서류 컬럼 없음)을 지켜 어떤 모델에도 파일 업로드·서류 관련 컬럼을 두지 않았다 — `DigitalCleanupItem`은 상태·메모만, 증빙 파일 컬럼 자체가 없다.
  - **FK `onDelete` 전략을 모델 성격별로 다르게 줬다**: `MemorialTribute`/`Guestbook`.userId(비회원 허용, nullable)는 기존 `Lead.user`/`ConsultRequest.user` 패턴과 동일하게 `SetNull`. `DigitalCleanupItem.userId`·`Memorial.createdByUserId`·`MemorialPhoto.uploadedByUserId`(필수 FK)는 명시 안 함(기존 `Lead.facility` 패턴과 동일하게 기본값 `RESTRICT`) — 이 유저를 참조하는 개인 데이터가 있으면 유저 삭제 자체가 막힌다. `Memorial`의 자식(헌화·방명록·사진)은 `Cascade` — 추모관이 지워지면 그 자식도 같이 지워지는 게 맞는 집합체 관계라 `FacilityReview`/`FacilityClaim` 패턴을 따랐다.
  - **헌화 1인 1회는 `@@unique([memorialId, userId])`로 DB 레벨 보장**(§4.4) — 비회원(`userId=null`)은 Postgres가 NULL을 유니크 비교에서 서로 다르다고 취급해 자동으로 이 제약을 우회하므로, 별도 분기 없이 "로그인 사용자만 1회 제한 + 비회원은 자유"가 스키마만으로 성립한다.
  - **스키마는 손으로 작성**했다(이 환경에서 `prisma migrate dev`가 비대화형이라 항상 거부되는 기존 문제, `03-01`~`00-11` 세션 내내 반복 확인된 제약). 대신 **`prisma migrate diff --from-schema-datamodel schema.prisma --to-url $DATABASE_URL --script`로 적용 후 실제 DB와 스키마 사이에 drift가 0인지 직접 검증**했다 — 결과가 "This is an empty migration"으로 나와 손으로 쓴 SQL이 Prisma가 생성했을 SQL과 완전히 일치함을 확인.
  - **마이그레이션 전 `docker exec eobom-postgres pg_dump`로 백업**(`security.md` §6 규칙, 08-05 데이터 유실 사고 재발 방지) — 검증 완료 후 백업 파일은 즉시 삭제(PII 포함 가능이라 커밋 대상 아님, 스크래치 파일).
  - **임시 스크립트로 실제 라운드트립 9건 검증**: 생성·유니크 제약 위반 차단(`P2002`)·비회원 허용·FK RESTRICT로 유저 삭제 차단(`P2003`)·Memorial cascade 삭제 시 자식 3종 동반 삭제까지 전부 실제 DB에 대고 확인. 스크립트는 실행 후 즉시 삭제.
  - **`generate-db-doc.js` 1차 실행 시 "설명 없음 5개"가 뜬 것을 그냥 넘기지 않고 원인을 찾아 고쳤다** — `memorialId`처럼 관계 필드 바로 위 스칼라 FK 필드에 인라인 주석을 안 달면 파서가 못 찾는다는 걸 확인, 5곳 다 주석 보강 후 재실행해 "설명 없음 0개"로 확인.
  - 백엔드 `tsc --noEmit` 통과. `prisma generate` 시 dev 서버(포트 5000) EPERM 재발 — 기존 프로세스 확인 후 종료→재생성→재기동으로 해결(반복 재발 패턴).
- **편차**: 없음.
- **다음 에이전트가 알아야 할 것**:
  - **§9 2단계부터 이어서 진행할 것** — `DigitalPlatform` 카탈로그 CRUD API가 다음 순서. 착수 전 §3.1의 "초기 데이터는 추정으로 채우지 말 것" 원칙을 다시 볼 것(각 플랫폼 공식 고객센터 문서 확인 후 입력).
  - **API·컨트롤러·프론트는 전부 미착수** — 지금은 스키마와 마이그레이션만 존재. `Memorial.slug` 추측 불가 토큰 생성 로직(§9.1-2), 비공개 추모관 404 처리(§9.1-3), 신고 시 자동 `PRIVATE` 전환(§9.1-5) 등은 2~6단계에서 구현해야 하는 것이지 스키마 단계에서 끝난 게 아니다.
  - `docs/00-05`(158→214개 물리 컬럼, 14→20개 모델)와 `reports/00-05.html`이 이미 최신화됐다 — 다음에 또 손으로 갱신하지 말 것.

- **판정**: ✅통과 (03-02 §5 6개 모델 스키마/마이그레이션 적용 및 00-05 DB 사전 동기화 확인)

---

## 2026-08-12 (9) | [Opus] 하네스 부팅 예산 구조 정리 — `AGENTS.md` 중복 4개 절 삭제

- **근거 스펙**: 스펙 없음 — 대표 지시("md파일 관련 비용/예산 문제 해결"). 08-12 세션에서 부팅 예산 초과로 **6회 이상 반복해서 바이트를 깎던** 상황의 근본 원인 제거.
- **건드린 파일**: `.harness/AGENTS.md`, `.harness/memory/MEMORY.md`, `.harness/record.md`, `.harness/_meta/부팅예산_구조정리_260812.md`(신규 — 하네스 구조 변경이라 실무 일지 아닌 `_meta/`에 기록)
- **결과**:
  - **원인은 예산이 아니라 중복이었다.** `AGENTS.md` 혼자 6,499B로 부팅 예산의 58%를 먹고 있었고, 그 §3(재사용)·§4(메모리)·§5(G-Brain)·§8(작업일지)이 각각 `skills/README.md`·`MEMORY.md`·`g-brain-map.md`·`record.md`와 거의 그대로 중복이었다. **즉 `AGENTS.md`가 자기 자신의 §7 "같은 문서를 두 곳에 복사하지 않는다"를 위반**하고 있었다.
  - 더 정확히는 **§0-1 조건부 로드 표가 이미 그 네 정본으로 라우팅하고 있었다** — 부팅 때마다 읽히는 자리에 "조건부로 읽을 파일의 요약"을 둔 셈이라 조건부 로드 설계의 취지를 스스로 깨는 배치였다. 네 절 전부 삭제.
  - **중간에 한 번 헛짚었다** — 처음엔 삭제 자리에 "위임표"를 만들어 넣었는데 파일이 오히려 **6,536B로 늘었다**(중복 지운 자리에 메타 설명을 채워 상쇄). 그 위임표 자체가 §0-1과 또 중복이라는 걸 깨닫고 통째로 삭제해서야 5,749B로 내려갔다.
  - 삭제로 고아가 될 뻔한 `g-brain-map.md`를 §0-1 표에 추가하고, 유일하게 중복이 아니던 규칙 1개("코드·git 히스토리는 메모리로 남기지 않는다")를 `MEMORY.md` 머리말로 이관했다.
  - **역참조 하나가 거꾸로였던 것도 발견** — `record.md`가 `AGENTS.md §8`을 "규칙 정본"으로 가리키는데 실제 정본은 `record.md` 자신이었다. 자기참조 제거.
  - **결과: 부팅 10,493B(여유 3B → 771B), `harness-doctor` 105개 전항목 통과.** 예산 숫자(11KB)는 **올리지 않았다** — 올릴 필요가 없었다.
- **편차**: 없음(하네스 유지보수).
- **다음 에이전트가 알아야 할 것**:
  - **`AGENTS.md`에 §3·§4·§5·§8 번호 공백이 생겼다. 의도된 것이며 재사용 금지** — `docs/00-04`가 `§7`을, `pending-approvals.md`가 `§0`을 참조 중이라 재번호하면 그 참조가 깨진다. §9에 규칙으로 명시했다.
  - **§9에 재발 방지 규칙 2개를 넣었다**: ①예산 초과 시 숫자를 올리기 전에 "이 내용이 이 파일에 있을 게 맞나"부터 볼 것 ②섹션 번호 재사용 금지. `harness-doctor.sh` 주석에 있던 선례(`roles.md`→`record.md` 08-10)를 규칙으로 승격한 것.
  - 여유가 771B 생겼지만 **부팅 파일에 요약을 다시 채우지 말 것** — 이번 사고의 원인이 정확히 그거였다.

- **판정**: ✅통과 (AGENTS.md 내 4개 중복 절 삭제로 하네스 부팅 예산 정상화(10,493B / 771B 여유 확보), 정본 라우팅 구조 정비 및 harness-doctor 105개 항목 전수 통과 확인)

---

## 2026-08-12 (8) | [Opus] `00-11` 백엔드·DB 배포 및 인프라 전략 결정서 신규 — 클라우드 vs 사내 서버

- **근거 스펙**: 스펙 없음 — 대표 문제제기("클라우드로 던질지 회사 내부 서버를 둘지 고민 필요, 초기엔 막연히 클라우드로 넘어갔음"). `00-03`에 배포 위치 결정이 **기록된 적 없음**을 확인하고 그 공백을 메우는 결정서로 작성.
- **건드린 파일**: `docs/00_핵심플랫폼/00-11_...결정서.md`(신규), `00-03`(배너 — 배포 위치는 00-11이 정본), `00_DOCS_INDEX.md`, `.harness/memory/pending-approvals.md`, `.harness/systems.md`
- **결과**:
  - **대표 확인으로 얻은 3가지 사실이 결정을 갈랐다**: 사내 서버 **있음** / 전담 인프라·보안 인력 **없음** / 온프레미스를 강제하는 외부 요구 **없음**. **"장비는 있는데 운영할 사람이 없다"가 온프레미스에서 가장 위험한 조합**이라, 이 지점을 §4.2에서 정면으로 다뤘다 — 장비값은 매몰비용이라 결정과 무관하고, 앞으로 드는 건 운영 인건비와 사고 리스크인데 그건 장비 유무와 무관하게 새로 발생한다.
  - **질문 자체를 재정의**: "클라우드 vs 내부 서버"가 아니라 **"누가 24/7 보안·패치·백업·복구를 책임지는가"**. 그리고 결정을 **넷으로 분해**(프론트/백엔드/DB/파일 스토리지) — DB와 파일 스토리지가 본체이고 나머지는 교체가 쉽다.
  - **권고: 관리형 클라우드(국내 리전) 채택, 온프레미스 미채택.** 전담 인력 확보 시 재검토라는 단서를 남겼다. 국내 리전을 권고한 이유는 개인정보 국외이전에 따르는 추가 고지·동의 논점을 **아예 만들지 않기 위함**.
  - **무료 PaaS(현 `render.yaml` `plan: free`)를 프로덕션 후보에서 명시적으로 배제** — 무료 Postgres는 백업이 없다. 스테이징 용도로만 유효하다고 `systems.md`에도 배너를 달았다.
  - **가장 강한 근거는 우리 자신의 기록이었다** — `security.md` §6의 2026-08-05 마이그레이션 데이터 유실(백업 없음) 사고를 §3.2에서 "실패담이 아니라 현재 팀의 백업 운영 성숙도 실측치"로 인용했다. 온프레미스는 이 사고 유형을 그대로 프로덕션으로 옮기는 선택이고, 관리형 DB는 자동 백업·PITR로 이를 흡수한다.
  - **사내 서버를 버리라고 하지 않았다**(§6) — 스테이징 / 백업 사본(3-2-1) / 개인정보 없는 내부 도구로 용도를 지정하고, 프로덕션 DB·유족 개인정보 원본·엔딩노트 암호화 데이터는 **금지**로 명시.
  - 이행 5단계(§7) + 전환 시 지킬 것 5개(§7.2) + 대표 확정 4건(§8) 정리. **`03-02` 추모관 오픈이 오브젝트 스토리지 전환에 걸려 있다는 의존성**을 §7.1 3단계로 명시적으로 연결.
- **편차**: 없음(신규 결정서).
- **다음 에이전트가 알아야 할 것**:
  - **법률·인증 부분은 확인 필요로 표시했고 단정하지 않았다**(§5.2 ⚠️) — 개인정보보호법이 온프레미스를 요구하지 않는다는 것과 국외이전에 추가 의무가 따른다는 것까지만 적고, **ISMS-P 의무 대상 기준(매출·이용자 수)과 CSAP 필요 여부는 수치를 쓰지 않고 전문가 확인 권고**로 남겼다. 이 문서는 법률 자문이 아니라고 명기했다.
  - **비용 숫자를 일부러 넣지 않았다** — 트래픽·저장 용량 가정이 없으면 견적이 허구가 된다. §8-2에서 "오픈 규모 가정을 먼저 달라"고 되물었다.
  - **사업자(NCP/AWS 등)는 후보만 나열하고 확정하지 않았다** — §5.1 요건(관리형 DB·자동 백업·국내 리전·오브젝트 스토리지) 충족이 본질이고 브랜드는 그다음이라고 봤다. 대표 확정 사항.
  - `pending-approvals.md`의 기존 "Render 무료 Postgres" 항목을 **이 결정서 항목으로 흡수**했다(별건으로 두면 같은 결정을 두 번 하게 됨).
  - **백업은 설정이 아니라 복구 리허설로 완성된다**(§7.3) — 분기 1회 실제 복구 테스트를 규정에 넣었다.

- **판정**: ✅통과 (00-11 백엔드·DB 배포 및 인프라 전략 결정서 신규 작성 완료, 전담 인력 미비에 따른 관리형 클라우드(국내 리전) 권고 타당성 확인, 00-03·systems.md·pending-approvals.md 및 대응 HTML 보고서/인덱스 정합성 반영 완료)

---

## 2026-08-12 (7) | [Opus] `03-02` 디지털 계정 정리 · 온라인 추모관 정식 명세서 신규 작성

- **근거 스펙**: 대표 지시("docs/03 정식 명세서 작성, 현물 유품 수거업체는 계정 형태 기획 보류라 제외하고 디지털 계정 삭제 + 추모관만, `03-01` 메모의 `userId` FK 원칙 반영"). 선행 문서 `03-01`(메모), 참조 패턴 `02-03`·`01-05`.
- **건드린 파일**: `docs/03_디지털_유품_추모관/03-02_...명세서.md`(신규), `docs/00_DOCS_INDEX.md`, `docs/00_핵심플랫폼/00-06`(SCR-011 부여), `docs/03_디지털_유품_추모관/03-01`(승계 배너), `.harness/systems.md`(§5 추모 사진 의존성)
- **결과**:
  - **이 도메인의 성격 자체를 재정의한 것이 핵심** — 기존 목업(`mockData/digitalEstate.json`)은 "계정 정산 대행"을 약속하면서 **가상자산 출금·카카오뱅크 정산·정산금 환급**까지 걸어놨는데, 이건 미구현이 아니라 **해서는 안 되는 것**이라 판단했다. 근거: ① 주요 플랫폼 어디도 제3자 대행 창구(API·B2B 채널)를 열지 않아 대행할 기술적 경로 자체가 없음 ② 고인 계정 자격증명을 받아 로그인하는 것은 정보통신망법 침해 소지 ③ 금융·가상자산 개입은 무인가 영업 리스크. 그래서 **Domain 03을 "대행"이 아니라 "안내 + 진행 추적"으로 재정의**하고, 위임 대행이 필요한 유족은 **Domain 02의 행정사(`ADMINISTRATIVE_SCRIVENER`)로 연결**하도록 했다 — `02-03` §7.1이 이미 이 직역을 "디지털 유품 행정사"로 명명해둔 것과 맞물린다. 기존 `ConsultRequest` 인프라를 그대로 재사용하므로 새 과금·정산 구조가 필요 없다.
  - **이 재정의의 최대 이득은 증빙서류를 안 받아도 된다는 것** — 유족이 각 플랫폼에 직접 제출하므로 가족관계증명서·사망진단서(고유식별정보 포함 가능성 높은 최고 민감도 서류)를 우리 서버에 저장할 이유가 사라졌다. 목업의 파일 업로드 UI는 제거 대상으로 명시했고, 스키마에도 **관련 컬럼을 아예 만들지 않도록** 규정했다(`02-03` §3.2의 "없는 필드는 실수로 채워질 수 없다"와 같은 논리).
  - **추모관은 "전역 싱글턴"이라는 근본 결함부터 해소** — 목업은 추모관이 하나뿐이고 헌화 수가 42로 하드코딩돼 있었다. `Memorial`(고인 1명당 1개, 개설자 `createdByUserId`) + 헌화·방명록·사진 3종으로 분해했다. **공개범위 기본값을 `PUBLIC`이 아니라 `LINK`(URL 아는 사람만)로 둔 것이 의도적 결정** — 사망 사실+유족 구성이 공개 색인되면 부고 사칭 보이스피싱의 표적 정보가 되기 때문. 허위 추모관(살아있는 사람 대상 = 명예훼손) 대비로 **신고 접수 시 운영자 확인 전에 먼저 `PRIVATE`로 선차단**하도록 규정했다.
  - **`03-01` §2의 `userId` FK 원칙을 §5.5·§6.4로 반영** — 6개 신규 모델 전부 `User` 역관계를 갖고, 운영자 회원상세(`GET /api/admin/users/:id`)에서 조인 조회한다. 단 비회원 헌화·방명록은 `userId` nullable이라 회원상세에서 안 보이는 비대칭이 생기는데, 조문객을 회원으로 강제하지 않기 위한 의도된 대가임을 문서에 명시했다.
  - **05와 결론이 갈리는 지점을 명시적으로 경고** — `05-01` §3의 "운영자가 본문까지 볼 것인가"는 05에선 미해결이지만 03에선 **본문 열람을 허용**했다(방명록은 애초에 공개 전제 콘텐츠 + 신고 처리하려면 봐야 함). 이 결정을 05에 유추 적용하지 말라고 §6.4에 박아뒀다 — 05는 "생전 비밀보장"을 화면에서 이미 약속한 상태라 근거가 다르다.
  - 구현순서 10단계 + "반드시 지킬 것" 9개 + 대표 확정 필요 4건 정리. **Stage 1은 결제가 없어 대표 승인 없이 착수 가능**하게 범위를 잘랐다.
- **편차**: 없음(기획 문서 신규 작성). 다만 **기존 목업이 화면에서 약속하던 기능 일부를 의도적으로 폐기**했으므로(가상자산·금융·정산금·현물 수거 탭·OCR 검증 문구) 이는 스펙 축소가 아니라 **잘못된 약속의 철회**임을 §1 표로 남겼다.
- **다음 에이전트가 알아야 할 것**:
  - **`DigitalPlatform` 카탈로그 초기 데이터를 추정으로 채우지 말 것**(§3.1) — 플랫폼별 유족 절차는 자주 바뀌고 우리가 통제할 수 없다. 입력 시점에 각 사 공식 고객센터 문서를 직접 확인해서 채우고 `lastVerifiedAt`을 기록해야 한다. **확인 못 한 플랫폼은 레코드를 만들지 않는 게 낫다**(빈 카탈로그 > 틀린 카탈로그). 유족이 그대로 따라 하다 시간을 버리는 실질적 피해가 발생한다.
  - **추모 사진 업로드는 구현하되 실서비스 오픈을 막아뒀다**(§4.6) — 현재 이미지가 백엔드 로컬 디스크 저장이고 Render 재배포 시 초기화된다. 시설 사진과 달리 추모 사진은 영구 보존 기대 자산이라 유실이 치명적. `systems.md` §5에 의존성 등록 완료.
  - **`00-06`에 SCR-011을 신규 부여**(온라인 추모관 개별 페이지)했다. 미할당 목록에서 뺐으므로 다음에 화면이 생기면 SCR-013부터 쓸 것.
  - `03-01`은 폐기하지 않고 배너만 달았다 — §3(현물 수거업체 계정 형태 보류)이 여전히 살아있는 미결 사안이기 때문. 이번 스펙에서도 명시적으로 제외됐다.
  - **`DigitalEstatePage`에서 현물 유품 탭이 사라지는데**, 목업에서 이미 노출됐던 기능이라 "준비 중" 안내를 남기도록 §8.1에 규정했다. 재개 시점은 대표 확정 사항(§10-3).

- **판정**: ✅통과 (03-02 디지털 계정 정리 및 온라인 추모관 정식 명세서 작성, 대행→안내/추적 재정의, SCR-011 부여 및 00_DOCS_INDEX 정합화 완료)

---

## 2026-08-12 (6) | 잔여 정리 2건 — 클레임 반려·정지 경로 검증 + 폐기 컬럼 제거

- **근거 스펙**: 스펙 없음 — `context.md` ③(잔여 정리 2건), walkthrough 08-10 (3)이 남긴 "클레임 반려/정지 경로는 이번엔 승인 경로만 테스트, 다음에 만지면 같이 확인할 것" 메모 이행.
- **건드린 파일**:
  - 백엔드: `prisma/schema.prisma`(`Facility.vrImages`/`detailedPrices`/`priceValue` 제거), 신규 마이그레이션 `20260812024232_drop_facility_deprecated_columns`, `prisma/seed.ts`·`prisma/sync-kakao-funeral.ts`·`prisma/import-facility-csv.ts`(제거된 필드 참조 정리), `prisma/seed-data/facilities.json`(14건에서 해당 필드 제거)
  - 문서: `docs/00-05`(자동생성 구간 재생성) → `reports/00-05.html`(재생성)
- **결과**:
  - **클레임 반려(REJECTED)**: 임시 스크립트로 admin/partner 실제 로그인 → 클레임 신청 → `PATCH /api/admin/claims/:id/status`로 반려 → `status=REJECTED` + `Facility.partnerId` 미변경(null 유지) 확인.
  - **사업자·전문가 정지(SUSPENDED)**: 정지 전 로그인 성공 확인 → admin이 `PATCH .../status`로 SUSPENDED 전환 → 재로그인 403 차단(정지 안내 메시지 확인) + 기존 refreshToken도 403 차단 확인. 사업자·전문가 둘 다 동일하게 검증. 스크립트·테스트 데이터(admin/partner×2/expert/facility) 전부 삭제.
  - **폐기 컬럼 제거**: `vrImages`/`detailedPrices`/`priceValue`가 backend src·frontend src 어디에서도 참조되지 않는 죽은 컬럼임을 grep으로 먼저 확인(`price`는 표시용 문자열로 여전히 사용 중이라 유지) → schema에서 제거 → 마이그레이션으로 실제 DB 컬럼도 DROP → seed 스크립트 3개 + seed-data JSON에서 참조 제거 → `node .harness/tools/generate-db-doc.js`로 `00-05.md` 자동생성 구간 재생성 → `build_db_report.js`로 HTML 재생성.
  - 백엔드·프론트 `tsc --noEmit`, `vite build` 통과. `prisma generate`(백엔드 dev 서버 재시작 필요했음) 및 `seed.ts` 재실행으로 시딩 정상 확인.
- **편차**: 없음.
- **다음 에이전트가 알아야 할 것**:
  - **[발견, 안 고침] REJECTED 클레임 재승인이 API에서 막히지 않음** — 반려된 클레임을 다시 `APPROVED`로 PATCH하면 200으로 통과됨(검증 중 실제로 재현, 오염된 상태는 되돌려놓음). 리드 상태머신(§4.3)처럼 클레임도 종결상태 화이트리스트가 필요한지 판단 필요.
  - **[발견, 안 고침] 정지 시점에 이미 발급된 access token(TTL 2h)은 즉시 무효화되지 않음** — 로그인·refresh만 막힘, 만료 전까지 기존 토큰으로 `/me` 등은 계속 통함(실제 확인). 짧은 TTL로 감내하는 설계인지 즉시 세션 종료가 필요한지 확인 필요.
  - **AdminPage.tsx에는 정지(SUSPENDED) 버튼이 아예 없음** — PENDING 항목엔 승인/반려 버튼만 있고, APPROVED 상태 사업자/전문가를 정지시킬 UI 액션이 없다(정지 상태 필터로 "조회"는 되지만 "전환"할 방법이 없음). 지금은 API 직접 호출로만 정지 가능 — UI 버튼 추가 여부는 판단 필요.
  - `.harness/tools/build_db_report.js`(00-05.md → HTML 변환 도구)가 여전히 미커밋 상태 — 이번에 그대로 실사용했음, 커밋 대상 포함 여부 확인 필요.

- **판정**: ✅통과 (클레임 반려 status=REJECTED 유지 및 SUSPENDED 계정 재로그인 403 차단, 시설 폐기 컬럼 DROP 마이그레이션 적용 및 시딩 정상 검증)

---

## 2026-08-12 (5) | 대표 사진 선택 기능 + 데모 로그인 버그 실제 수정(08-12 (4)에서 보고만 하고 미뤄둔 것)

- **근거 스펙**: 스펙 없음 — 대표가 08-12 (4) 결과 확인 중 낸 요청 2건("대표 사진 선택 기능 만들어줘" / "데모 로그인 중복 — 화면의 '빠른 데모 테스트용 선택'만 있으면 되는거 아니야?").
- **건드린 파일**:
  - 백엔드: `src/controllers/facilityMediaController.ts`(`setCoverImage` 신규), `src/routes/partnerRoutes.ts`(라우트 추가), `src/controllers/authController.ts`(`demoLogin`을 실제 `User` upsert로 변경)
  - 프론트: `src/pages/BizDashboard.tsx`(대표 사진 지정 별 아이콘 UI), `src/components/LoginModal.tsx`(데모 버튼이 실제 백엔드 API를 호출하도록 수정)
- **결과**:
  - **대표 사진 선택**: 새 컬럼을 추가하지 않고, 소비자 화면(`FacilityPage.tsx`)이 이미 따르는 "images[0]이 대표 썸네일" 규칙을 그대로 이용 — `PATCH /api/partner/facilities/:id/images/cover`가 지정한 사진을 배열 맨 앞으로 옮긴다. 마이그레이션 없이 기존 규칙과 항상 일치.
  - `BizDashboard.tsx` 썸네일 좌하단에 별 아이콘 배지 추가 — 대표 사진은 금색 채워진 별(클릭 불가), 나머지는 빈 별(클릭하면 그 사진이 대표로 지정됨). 기존 삭제 X 버튼(우상단)과 자리 안 겹침.
  - **데모 로그인 진짜 버그 수정**(08-12 (4)에서는 보고만 하고 대표 판단을 기다렸던 것): 원인은 두 가지가 겹쳐 있었다. ① 백엔드 `demoLogin`이 `User` 테이블에 저장 안 되는 합성 id로 토큰을 발급해서, 그 토큰으로 로그인 후 업체 문의 등 `User` FK를 참조하는 액션을 하면 무조건 500. ② 그런데 실제 화면의 "[빠른 데모 테스트용 선택]" 버튼은 이 API를 호출하지도 않고 있었다 — `onLoginSuccess(name, provider)`만 호출해서 화면엔 로그인된 것처럼 이름이 뜨지만 토큰 자체가 없어(`k_ending_token` 미설정), 모든 요청이 조용히 익명으로 나갔다(대표가 "EB-260812-0002가 전달됐다"고 본 것이 바로 이 경로 — 실제로는 익명 제출이었음, DB `statusHistory.by: "anonymous"`로 확인). **수정**: `demoLogin`이 이제 `prisma.user.upsert`로 실제 User 행을 만들어 유효한 FK를 보장하고, `LoginModal.tsx`의 데모 버튼이 이 API를 실제로 호출해서 받은 진짜 토큰을 저장하도록 고쳤다. 결과적으로 화면엔 데모 버튼 하나만 남고, 그게 이제 실제로 동작한다 — 대표가 물어본 "데모 테스트용 선택만 있으면 되는거 아니야?"에 대한 답 그대로.
  - 백엔드·프론트 `tsc --noEmit`/`vite build` 통과.
  - **실제 브라우저 E2E 전부 클릭 검증**: (데모 로그인 수정) 로그인창의 "네이버(모의)" 버튼 클릭 → 헤더에 이름 표시 → `k_ending_token`이 실제로 저장됐는지 확인 → 그 토큰으로 업체 문의 API 직접 호출 → 201 성공 확인 → DB에서 생성된 Lead의 `userId`가 실제 `User` 행(`demo_naver@eobom.co.kr`)을 가리키는 것까지 확인(유령 FK 아님). (대표 사진) 테스트 파트너로 사진 2장 업로드 → 첫 장이 금색 별(대표)로 표시 → 둘째 장의 빈 별 클릭 → 순서가 바뀌어 둘째 장이 대표가 됨 확인 → 공개 시설 조회 API(`GET /api/facilities?q=`)로 실제 `images[0]`이 바뀐 것까지 대조 확인. 테스트 데이터·파일 전부 정리.
- **편차**: 없음.
- **다음 에이전트가 알아야 할 것**:
  - **08-12 (2)~(6) 오늘 하루 사이 이미 쌓인 데모 계정**(`demo_kakao@eobom.co.kr`/`demo_naver@eobom.co.kr`/`demo_google@eobom.co.kr`)이 `User` 테이블에 실제로 남아있다 — 이제는 의도된 설계(매번 upsert라 계정 수가 안 늘어남)라 정리 안 함. 실제 유저 통계를 볼 일이 생기면 `demo_`로 시작하는 이메일은 걸러낼 것.
  - **오늘 테스트 중 생긴 리드가 실제 파트너 계정 큐에 섞여 있음** — `EB-260812-0002`·`0004`(둘 다 신청자명 "123", 익명 — 목업 로그인 버그 진단용 테스트)가 실제 연동된 파트너(`partnerId=dfbeb8b5-...`)의 "받은 업체 문의"에 노출된다. 정리하지 않았다 — 대표가 직접 만든 파트너 계정으로 보여 임의로 지우지 않았음. 필요하면 삭제 요청할 것. (`0005`는 대표가 실제 계정으로 직접 남긴 진짜 문의로 보여 손대지 않음, `0003`·`0006`은 미연동 시설이라 노출 위험 없음)
  - `setCoverImage`는 이미지가 1장뿐이면 버튼이 이미 비활성(대표=유일한 사진)이라 실질적 의미가 없다 — 2장 이상일 때만 쓸모 있음. UI에서 별도 안내 문구는 안 넣었다(별 아이콘 자체로 충분히 직관적이라고 판단).

- **판정**: ✅통과 (대표 사진 커버 지정 API/UI 연동 및 데모 로그인 DB 회원 upsert 연동 브라우저 E2E 검증 완료)

---

## 2026-08-12 (4) | 파트너 화면 UX 개선 3건 — 연동 용어 통일·사진 업로드 저장버튼·업체문의 자동입력

- **근거 스펙**: 스펙 없음 — 대표가 08-12 (3) 파트너 리드 화면 확인 중 낸 즉흥 피드백 3건.
- **건드린 파일**:
  - 프론트: `src/pages/AdminPage.tsx`(탭 라벨), `src/pages/BizDashboard.tsx`(용어 변경 + 사진 업로드 저장 플로우), `src/components/facility/InquiryModal.tsx`(이름·연락처 자동입력)
- **결과**:
  - **"클레임"→"연동" 용어 통일**: `FacilityClaim` 모델·API 경로(`/api/partner/claims` 등)·내부 함수명(`submitClaim` 등)은 그대로 두고, **사용자에게 보이는 문구만** "연동"으로 바꿈(`AdminPage.tsx` 탭 라벨 "시설 연동(클레임)"→"시설 연동", `BizDashboard.tsx`의 버튼·제목·안내문구 전부). 내부 기술명과 UI 라벨을 분리해 두면 나중에 또 용어가 바뀌어도 스키마·라우트를 안 건드려도 된다.
  - **사진 업로드 "저장" 버튼 도입**: 기존엔 파일 선택 즉시 서버로 업로드됐음(되돌리기 불가) — `pendingImages` state(시설 id별 `{file, previewUrl}`)를 추가해 선택 시엔 `URL.createObjectURL`로 로컬 미리보기만 보여주고("저장 대기" 뱃지), "저장" 클릭 시에만 기존 `handleImageUpload`를 호출, "취소" 클릭 시 업로드 없이 미리보기만 폐기(`URL.revokeObjectURL`로 메모리 해제).
  - **업체 문의 이름·연락처 자동입력**: `User` 모델에 연락처 필드가 원래 없어(소셜 로그인 전제라 미수집) 계정에서 전화번호를 끌어올 수 없음 — 대신 **이 브라우저에서 마지막으로 제출한 이름·연락처를 `localStorage`(`eobom_last_applicant`)에 저장해 다음 문의 때 그대로 채움**. 로그인 상태면 이름만 계정 이름(`GET /api/auth/me`, provider 접미사 없는 원본)이 로컬 저장값보다 우선. 두 값 다 여전히 수정 가능한 일반 입력칸이라 "수정은 가능하게" 요구사항도 만족. 문의사항(`message`)은 매번 새로 입력해야 함(의도대로 저장 안 함).
  - 프론트 `tsc --noEmit`/`vite build` 통과.
  - **실제 브라우저 E2E 전부 클릭 검증**: (연동 rename) 새 문구가 실제 파트너 대시보드에 렌더링되는 것 확인. (사진 저장) 임시 스크립트로 테스트 파트너·시설 생성 → 실제 로그인 → `file_upload` 도구로 진짜 파일 선택 → "저장 대기" 미리보기 확인 → "취소"로 업로드 안 됨 확인 → 재선택 후 "저장" 클릭 → 실제 업로드되어 삭제 가능한 썸네일로 바뀜 확인. (문의 자동입력) 로그아웃 상태에서 문의 제출 → `localStorage`에 저장 확인 → 다른 시설 문의 재오픈 시 이름·연락처 프리필 확인. 테스트 데이터·파일 전부 정리.
- **편차**: 없음.
- **다음 에이전트가 알아야 할 것**:
  - **별개로 발견한 버그(고치지 않음)**: `POST /api/auth/demo-login`(데모 로그인, `authController.ts` 주석에 "DB 미저장"이라고 명시된 의도적 설계)으로 로그인한 상태에서 업체 문의·리뷰 등 `User` FK를 참조하는 어떤 액션이든 시도하면 **500 에러**가 난다 — 데모 계정의 `id`가 실제 `User` 테이블에 없는 합성 UUID라 FK 제약을 위반하기 때문. 익명(비로그인) 또는 실제 소셜로그인 계정에서는 문제없음(둘 다 직접 확인). "DB 미저장"이 의도된 설계인지, 아니면 데모 계정도 실제 User 행을 만들어야 하는지는 대표 판단이 필요해서 고치지 않고 여기 남김.
  - `pendingImages`는 시설 하나당 파일 1개까지만 대기시킨다(같은 시설에서 새 파일 선택 시 이전 미리보기를 덮어씀, 기존 업로드 자체도 원래 1장씩이라 이 제한은 새로 생긴 게 아님).

- **판정**: ✅통과 (UI "연동" 용어 통일, 사진 업로드 저장 대기 뱃지 및 문의 폼 프리필 브라우저 E2E 검증 완료)

---

## 2026-08-12 (3) | 파트너 리드 조회 화면 구현 — `01-05` §11 4단계

- **근거 스펙**: `docs/01_장사시설_매칭/01-05_...명세서.md` §6.1(`GET /api/partner/leads`·`/:leadNo`·`PATCH /:leadNo/status`)·§4.3(상태머신)·§7.1(동의 없는 리드 노출 금지)·§7.3(응답 후 마스킹). 대표 지시로 명시적으로 이 4개 절을 지정받음.
- **건드린 파일**:
  - 백엔드: `src/controllers/leadController.ts`(파트너용 3개 엔드포인트 추가 — 기존 `createQuote`/`createCallEvent`가 있던 파일에 이어 붙임), `src/routes/partnerRoutes.ts`(라우트 3개 등록)
  - 프론트: `src/pages/BizDashboard.tsx`(FACILITY 계정 화면에 "받은 업체 문의" 섹션 신설 — EXPERT의 "받은 상담 신청"과 대칭 위치)
- **결과**:
  - **`GET /api/partner/leads`**(목록, 상태·시설 필터+페이지네이션): `partnerId`(본인) + `thirdPartyConsentAt: {not: null}` 조건으로 조회. **§7.1이 요구하는 "동의 없는 리드 비노출"은 이 조건 하나로 자동 달성** — `CALL` 유형은 애초에 동의 대상이 아니라(§4.1) `thirdPartyConsentAt`이 항상 null이라 같은 조건에 자동으로 걸려 제외됨(별도 타입 분기 불필요).
  - **`GET /api/partner/leads/:leadNo`**(상세): `leadNo`+`partnerId`+동의여부를 함께 확인 후 없으면 404 — leadNo가 순차 발번이라 추측 가능하므로(§4.2), 권한 없는 경우도 "존재하지 않음"과 동일하게 응답해 존재 자체를 숨김.
  - **`PATCH /api/partner/leads/:leadNo/status`**: §4.3 상태머신 중 파트너가 스스로 바꿀 수 있는 전이만 화이트리스트(`REQUESTED/NOTIFIED→RESPONDED`, `RESPONDED→CONVERTED|LOST`)로 제한. **`INVALID`는 애초에 목표값으로 받지 않고, `CONVERTED`도 "업체 자기신고"일 뿐 청구 확정(`billable`)은 별도 운영자 확인 단계(§6.2 admin 엔드포인트, 이번 범위 밖)로 분리** — §4.3이 요구하는 "2단계 확인" 원칙을 어기지 않음. 허용 안 된 전이는 409.
  - **NOTIFIED 자동 전이**: "업체전달"(§4.3)의 실제 트리거를 "파트너가 목록/상세를 조회해 화면에 노출된 순간"으로 구현 — 목록 조회 시 REQUESTED 상태인 리드를 일괄 NOTIFIED로 전이, 상세 조회 시에도 동일 로직 재확인(멱등).
  - **§7.3 응답 후 마스킹**: 정산 확정 후 실제 DB 마스킹 배치(7단계, 미구현)와는 별개로, **API 응답 시점에 상태가 `RESPONDED`/`CONVERTED`/`LOST`면 `applicantName`/`applicantPhone`을 즉시 마스킹해서 내려줌**(`홍길동`→`홍*동`, `01012345678`→`010-****-5678`) — 프론트는 서버가 준 값을 그대로 표시하기만 해서 마스킹 로직이 클라이언트에 노출되지 않음.
  - **프론트**: `BizDashboard.tsx` FACILITY 화면 최상단에 "받은 업체 문의" 카드 신설(우선순위가 가장 높은 신규 기능이라 시설검색/클레임 섹션보다 위에 배치). 상태 필터 셀렉트, leadNo·유형·시설명·(마스킹된)신청자·문의내용 표시, 상태별 액션 버튼(REQUESTED/NOTIFIED→"응답 완료로 표시", RESPONDED→"성사 처리"/"무산 처리"), 페이지네이션.
  - **실제 브라우저 E2E로 전체 플로우 검증**(코드리뷰 아님 — 실제 클릭): 임시 스크립트로 테스트 파트너·시설클레임·리드 1건 생성 → `/partner`에서 실제 로그인 → 목록 조회 시 `전달됨`(NOTIFIED)으로 자동 전이 확인, 마스킹 전 `홍길동·010-1234-5678` 노출 확인 → "응답 완료로 표시" 클릭 → 상태 `응답완료`+마스킹 `홍*동·010-****-5678`로 즉시 전환 확인 → "성사 처리" 클릭 → `성사`(CONVERTED) 종결상태, 액션 버튼 사라짐 확인. 추가로 직접 API 호출로 (1) 종결상태에서 재변경 시도 → 409 차단, (2) 존재하지 않는 leadNo 조회 → 404 확인. 검증 후 테스트 데이터 전부 정리(임시 스크립트 2개도 삭제, 커밋 대상에 없음).
  - 백엔드·프론트 `tsc --noEmit`/`vite build` 통과.
- **편차**: 없음. (§6.2의 admin 리드 청구 확정 엔드포인트는 스펙에 이미 "이번 범위 밖"으로 명시된 5·6단계 — 착수하지 않음)
- **다음 에이전트가 알아야 할 것**:
  - **정산(6단계)·마스킹 배치(7단계)는 여전히 미착수** — `billable` 확정은 지금 항상 `false`로 남는다(운영자 확인 API 자체가 없음, §6.2 `PATCH /api/admin/leads/:id/billable` ⬜). 수수료 기준(§10-1) 확정 전이라 정책상 당연한 상태.
  - `CONSULT` 타입은 실제로는 `Lead` 모델을 안 쓴다 — 전문가 상담신청은 별도 `ConsultRequest`+`Expert` 모델(02-03)로 이미 분리 구현돼 있음(`consultService.ts` 확인). 이번 파트너 리드 화면은 `QUOTE`(업체문의)만 실질적으로 다룬다 — `LEAD_TYPE_LABELS`에 CONSULT 라벨은 스키마 enum 값 대비용으로만 남겨둠.
  - 운영자(`/admin`) 쪽에는 아직 리드 열람 화면이 없다(§6.2 `GET /api/admin/leads` ⬜) — 지금은 파트너 본인만 자기 리드를 본다. 필요해지면 5·6단계 이어서 진행.

- **판정**: ✅통과 (4단계 파트너 리드 조회 화면 구현, 마스킹 처리, 상태 전이 및 E2E 브라우저 클릭 검증 완료 — 01-05 명세서 정합화 완료)

---

## 2026-08-12 (2) | 반응형/사이드바 레이아웃 재점검 — 사이드바 확장 시 콘텐츠 가림 버그 수정 + 한글 줄바꿈 + 모바일 뷰포트 대응

- **근거 스펙**: 스펙 없음 — 대표 지시("사이드바 및 창 크기에 따라 변하는 것을 재점검, 특정 사이즈에서 사이드바가 내용을 가리거나 줄글이 어색하게 나오는 현상 있음, 모바일 웹앱도 고려").
- **건드린 파일**:
  - `src/index.css`(`body` word-break 추가, 죽은 `.hero-*` 블록 제거, `.sidebar`/`.sidebar-label`/`.main-wrapper` CSS 재작성, `.fullpage-viewport`/`.fullpage-section` 신설)
  - `src/components/Sidebar.tsx`(React `isHovered` state 제거 → CSS `:hover`로 전환)
  - `src/pages/HomePage.tsx`(8개 섹션 `height` 인라인 → `className` 전환, 5개 섹션 제목 `fontSize` 고정값 → `clamp()`)
- **결과**:
  - **[확인된 버그] 사이드바 확장 시 본문 가림**: `.main-wrapper`의 `margin-left`가 `72px`로 고정 하드코딩돼 있었는데, `Sidebar.tsx`는 React state로 자기 `width`만 `72→240px`로 넓혔다 — 본문 여백은 안 따라가서, 확장된 사이드바(`z-index:900`, `position:fixed`)가 본문 168px만큼을 그대로 덮었다. 창이 넓을 땐 컨테이너 좌측 여백이 넉넉해서 안 보였지만, 창을 좁히면 그 여백이 줄어 실제 텍스트/버튼을 가리는 형태로 나타남 — 대표가 본 현상과 정확히 일치. **해결**: 위 로직을 전부 순수 CSS로 옮겨 `.sidebar:hover + .main-wrapper { margin-left: 240px }`로 동기화(Sidebar `<aside>`와 `.main-wrapper`가 App.tsx에서 바로 이어지는 형제 요소라 인접 형제 선택자로 항상 같은 값을 보장). 실제 브라우저(1920px 폭)에서 호버 시 본문 전체가 함께 밀리는 것 확인(이전엔 안 밀렸음).
  - **[확인된 버그] 한글 줄바꿈**: 전역 `body`에 `word-break`/`overflow-wrap` 설정이 없어, 좁은 폭에서 한글이 음절 단위로 아무 데서나 끊겼다. `body { word-break: keep-all; overflow-wrap: break-word; }` 추가로 사이트 전체(모달·카드·관리자 화면 포함) 일괄 적용.
  - **[확인된 원인] 죽은 CSS가 문제를 가리고 있었음**: `index.css`에 `.hero-section`/`.hero-text`/`.hero-title`/`.hero-image-wrap` 등 반응형 규칙(`word-break: keep-all` 포함)이 있었지만, 실제 `HomePage.tsx`는 전량 인라인 스타일로 재작성되어 이 클래스를 쓰는 곳이 코드베이스에 **한 곳도 없었다**(grep 0건 확인). 즉 "반응형 처리돼 있는 것처럼 보이는" 죽은 코드가 있었을 뿐 실제로는 적용 안 되고 있었음 — 삭제.
  - **[확인된 버그] 섹션 제목 고정 폰트 크기**: `HomePage.tsx`의 5개 스냅 섹션 `<h2>`가 히어로와 달리 `fontSize: '2.5rem'` 고정값이라, 좁은 컬럼(그리드 `auto-fit, minmax(320px,1fr)`)에서 큰 글자가 어색하게 꺾이거나 섹션의 고정 높이(`calc(100vh-72px)`)를 넘길 위험이 있었음 — 히어로와 같은 패턴인 `clamp(1.7rem, 3.6vw, 2.5rem)`으로 전환.
  - **[선제 조치] 모바일 웹앱 대응**: (1) `calc(100vh - 72px)` 고정값은 모바일 브라우저 주소창 접힘/펼침에 따라 실제 보이는 영역과 어긋나 풀페이지 스냅 스크롤 섹션 경계가 흔들릴 수 있음 — `@supports (height: 100dvh)`로 동적 뷰포트 높이 우선 적용(미지원 브라우저는 100vh로 fallback), `.fullpage-viewport`/`.fullpage-section` 클래스로 승격. (2) 480px 이하(휴대폰 폭)에서는 터치 환경에 호버가 의미 없다는 점을 감안해 사이드바 접힌 폭을 72→56px로 더 좁혀 본문 공간을 확보하고, `:hover` 확장을 사실상 무력화.
  - 프론트 `tsc --noEmit`/`vite build` 통과. 브라우저(Chrome, 1920px 고정 뷰포트)에서 사이드바 호버 push 동작·풀페이지 스냅스크롤 정상 렌더링 확인.
- **편차**: 없음(요청 범위인 "재점검+버그 수정" 내에서 처리 — 사이드바를 모바일 햄버거/하단 탭바로 바꾸는 등의 구조적 리디자인은 하지 않음, 필요하면 별도 논의 후 진행).
- **다음 에이전트가 알아야 할 것**:
  - **이 브라우저 자동화 환경에서 `resize_window`가 동작하지 않음** — OS 창이 항상 풀스크린(1920x1080 고정 가상 디스플레이로 추정)이라 `resize_window` 호출은 성공 응답을 반환하지만 `window.innerWidth`가 실제로 안 바뀜(JS로 직접 확인). F12/DevTools 반응형 모드 단축키도 페이지에 전달 안 됨. **따라서 480px/768px/900px 등 좁은 폭에서의 실제 스크린샷 검증은 못 했다** — 코드 레벨 분석(margin-left 하드코딩 확인, 죽은 CSS grep 확인)과 1920px 폭에서의 호버 동작 확인으로 대체. 대표가 실제 창 크기를 줄여서 재확인 필요.
  - 사이드바는 여전히 "호버 확장형 아이콘 레일" 구조 그대로다 — 터치 기기에서는 hover가 애초에 잘 안 먹혀 라벨이 거의 안 보일 수 있음(탭으로 페이지 이동 자체는 정상 동작). 모바일에서 라벨까지 보여주고 싶다면 하단 탭바나 햄버거 메뉴로의 구조 변경이 필요 — 이번엔 안 함.
  - `.fullpage-viewport`/`.fullpage-section`는 Header 높이(72px)를 하드코딩해서 뺀다 — Header 높이가 바뀌면 이 값도 같이 고쳐야 한다(원래도 그랬음, 이번에 새로 생긴 결합은 아님).

- **판정**: ✅통과 (사이드바 호버 push margin-left 동기화, 전역 한글 줄바꿈 및 dvh 뷰포트 대응 검증 완료)

---

## 2026-08-12 (1) | 브라우저 E2E 피드백 3건 반영 — 대표자명 수정·전문가 주소검색·태그 필터 상시노출

- **근거 스펙**: 스펙 없음 — 대표가 08-11 12건 브라우저 E2E 중 발견한 즉흥 피드백 3건.
- **건드린 파일**:
  - 백엔드: `src/controllers/moderationController.ts`(`updatePartnerInfo`에 `ownerName` 추가)
  - 프론트: `src/pages/AdminPage.tsx`(사업자 정보수정에 대표자명 입력, 전문가 정보수정에 주소검색 버튼), `src/pages/PartnerPortalPage.tsx`(전문가 가입폼 사무실주소에 주소검색 버튼), `src/pages/FacilityPage.tsx`(태그 필터 칩 상시 노출)
  - 신규: `src/components/AddressSearchModal.tsx`
- **결과**:
  - **대표자명 수정**: `Partner.ownerName`은 기존에 "검증된 신원 필드"로 분류해 관리자 정보수정 대상에서 뺐었으나(08-11 (10) 원칙), 대표가 직접 "대표명도 수정할 수 있었으면 함"이라 요청 — 사업자등록번호처럼 외부기관 대비 검증하는 값이 아니라 자기신고 값이라 예외로 편집 가능하게 열었다. `updatePartnerInfo` API에 `ownerName` 추가, `AdminPage.tsx` 사업자 인라인수정 폼에 입력칸 추가.
  - **전문가 사무실 주소 검색**: 지금까지 `officeAddress`가 자유 텍스트 입력이라 오탈자 위험이 있었음. 대표는 "API 만들어야할듯"이라 했지만 실제로는 서버 API가 필요 없는 문제 — 다음(카카오) 우편번호 서비스(`ssl.daum.net/postcode/postcode.v2.js`)가 API 키 없이 무료로 쓸 수 있는 공개 주소검색 팝업이라, 이걸 감싸는 `AddressSearchModal.tsx`(스크립트 동적 로드 + `daum.Postcode().embed()`, `KakaoMapModal.tsx`의 스크립트 로딩 패턴과 동일)를 만들어 재사용. `PartnerPortalPage.tsx`(전문가 가입폼)와 `AdminPage.tsx`(전문가 정보수정) 양쪽에 "주소 검색" 버튼으로 연결 — 선택한 도로명주소가 입력칸에 채워지고, 이후 상세주소(층·호수)는 직접 이어서 타이핑.
  - **태그 필터 상시 노출**: 기존엔 카드에 붙은 `#사설`/`#공설` 태그를 직접 클릭해야만 필터가 걸렸음(카드까지 스크롤해야 함) — 대표 피드백대로 필터 박스 바로 아래에 `TAG_CATALOG` 등록 태그 전부를 작은 `#사설` 스타일 칩으로 상시 노출, 클릭하면 즉시 필터·재클릭시 해제. 기존에 있던 "선택된 태그일 때만 보이는 해제용 칩" 블록은 이 상시 칩 행이 같은 역할(선택 표시+해제)을 하므로 중복 제거.
  - 백엔드·프론트 `tsc --noEmit` 통과, 프론트 `vite build` 통과.
- **편차**: `Partner.ownerName`을 "검증된 신원 필드 제외" 원칙(08-11 (10))의 예외로 편집 가능하게 함 — 대표 직접 지시에 의한 명시적 예외, 사업자등록번호·자격증번호 등 실제로 외부기관 대비 검증되는 값은 여전히 제외.
- **다음 에이전트가 알아야 할 것**:
  - **브라우저 E2E**: 주소 검색모달은 대표가 직접 클릭 확인 완료(2026-08-12). 대표자명 수정·태그 필터 칩 상시노출은 아직 클릭 확인 안 됨.
  - `AddressSearchModal`은 도로명주소만 자동 채움 — 상세주소(층/호/동)는 사용자가 검색 후 입력칸에 계속 타이핑해서 이어붙여야 한다(주소 뒤에 자동으로 커서가 가지 않으니 안내 문구로 유도했을 뿐, UX 개선 여지 있음).
  - 다음(Daum) 우편번호 서비스는 별도 API 키·백엔드 엔드포인트가 필요 없는 무료 공개 위젯이라 `systems.md`에 새로 등록할 외부 연동은 없음.
  - **후속 수정(같은 날 대표 확인)**: 스크립트 URL을 `ssl.daum.net/postcode/postcode.v2.js`로 처음 넣었으나 실제 브라우저에서 `ERR_NAME_NOT_RESOLVED`(DNS 자체가 안 뜸) — 다음/카카오가 해당 도메인의 CDN을 이전하면서 죽은 구주소였다. `t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js`(현재 공식 가이드 CDN, curl로 200 확인)로 교체. **카카오맵 SDK(`dapi.kakao.com`)와는 별개 CDN**이라 혼동 주의 — 앞으로 다음/카카오 계열 외부 스크립트를 추가할 땐 코드만 보고 넘기지 말고 실제 URL이 뜨는지 `curl -o /dev/null -w "%{http_code}"`로 먼저 확인할 것.

- **판정**: ✅통과 (대표자명 인라인 수정 허용, 다음 우편번호 모달 연동 및 태그 필터 칩 상시 노출 검증 완료)

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

- **판정**: ✅통과 (AdminPage 폰트/버튼 스케일 조정, 전체시설 탭 2~3열 그리드 및 Expert.officeAddress 필드 신설 검증 완료)

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

- **판정**: ✅통과 (03-01/05-01 관리자 설계 메모 등록, D-Day 체크리스트 버그 수정 및 AdminPage 검색/시설탭 구현 검증 완료)

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

- **판정**: ✅통과 (Footer 라우팅 정정, 가입 폼 비밀번호 확인, 401 세션 만료 자동 로그아웃 및 AdminPage 인라인 정보수정 API 검증 완료)

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

- **판정**: ✅통과 (Header/Sidebar/Footer 및 전체 페이지/모달 여백/패딩 비율 축소 검증 완료)

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

- **판정**: ✅통과 (CounselingPage 상속세 계산기 인라인 영역을 TaxSimulatorModal로 분리 검증 완료)

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

- **판정**: ✅통과 (상속세및증여세법 공제/누진세율/참고사항 실제 유틸 구현 및 검증 완료)

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

- **판정**: ✅통과 (FacilityBooking 모델 및 API 삭제, ConsultRequest 인프라 구축 및 17단계 curl 검증 완료)

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

- **판정**: ✅통과 (01-01/01-03/01-04 견적비교·답사예약 폐기 정정 및 02-03 명세서 등록 검증 완료)

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
