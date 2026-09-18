# backlog 아카이브 — 2026-09

> 🔵 acklog.md에서 **종결된 항목**을 옮겨 둔 곳이다. 상한이 없다(AGENTS.md §9 — 배수구는
> 상한 없는 곳이어야 한다). 새 항목은 여기에 쓰지 않는다. 원본은 `.harness/memory/backlog.md`.
> 분리 사유: 2026-09-17 acklog.md가 상한의 **213%**가 되어 doctor가 세 번째로 분리를 요구했다.

---

## ⑮ `/memorial` 진입 분기 (09-07, wt131·132·134) — 🔴 wt135로 전제 자체가 사라짐

이 항목이 다루던 문제("부고장 삭제 후 orphan 추모관을 어디서 보나")는 **wt135(부고장·추모관
완전 분리)로 전제가 사라졌다** — 이제 추모관은 애초에 부고장과 무관하게 `/memorial`에서
독립적으로 만들고 지우므로, "orphan"이라는 개념 자체가 없다(모든 추모관이 처음부터
"부고장 유무와 무관한 자원"). wt134가 만든 `MyObituaryListPage.tsx`의 "부고장 없이 남은
추모관" 섹션은 wt135에서 제거했다 — `/memorial`이 이제 전체 목록을 보여준다.

✅ **닫음.** 이 항목은 이력만 남긴다. 후속 판단은 `00-13`·`07-03` 문서 갱신 쪽으로 이동 —
`walkthrough.md` wt135의 "다음 에이전트가 알아야 할 것"에 Opus 확인요청으로 적어둠.

---

## ⑰ `9c36db2` revert — 소유권 위반 + 스펙 어긋남 (09-16 Sonnet 발견)

`9c36db2`(9번 CounselingPage)가 `Co-Authored-By: Claude Opus 5`로 `eobomDev/`를 직접 수정한
것으로 드러나 되돌렸다(`git revert --no-commit`, 사람 확인 후 진행). 루트 `CLAUDE.md`가 명시한
"Opus는 코드를 짜지 않는다 — 08-25 실제 위반·전량 revert" 조항의 재발 사례.

**스펙과도 어긋났다** — `00-38` §8.2(줄709) 바텀시트 공통 규칙 대상은
`LoginModal·InquiryModal·SummaryModal·AddressSearchModal`(+기준 `MyPageFamilyDesignation`)이고,
CounselingPage 전용 행(§8.3 줄755)은 *"`TaxSimulatorModal`은 §8.2 바텀시트 공통 규칙 적용"* 이라
명시한다. 그런데 커밋은 정반대로 `ConsultRequestModal`을 바텀시트에 합류시키고
`TaxSimulatorModal`은 손대지 않았다. `_mockups/CounselingPage.html` 자체의 "승인 전 확인
체크포인트 ②"도 *"[ConsultRequestModal] 중앙 정렬 유지, 바텀시트로는 바꾸지 않음"* 이라 못박아
목업과도 모순 — 그 목업 승인 체크포인트 4개(배너 설명문 삭제·모달 방식·프로즈 축약·데스크톱
영향) 자체가 사람 승인 기록 없이 진행됐다.

**Sonnet이 스펙대로 재구현한 것**(revert 위에 재작성, tsc 0):
- `CounselingPage.tsx`: `repeat(auto-fill,minmax(...))` 인라인 그리드 → `.auto-grid`(§8.3 지시).
- `TaxSimulatorModal.tsx`: 인라인 스타일 → `.tax-sim-modal-backdrop/-panel`로 추출, 768px 이하
  바텀시트 5번째 멤버로 합류(`index.css` 기존 모달4종 미디어쿼리에 추가).
- `ConsultRequestModal.tsx`: 인라인 스타일 → `.consult-modal-backdrop/-panel`로 추출, 원래
  maxHeight/overflow가 아예 없어 7필드 폼이 잘리던 실제 버그를 `max-height:88dvh;overflow-y:auto`
  로 고치되(목업 체크포인트 ②의 수치), 바텀시트 그룹에는 합류시키지 않고 중앙 정렬 유지.
- `_mockups/CounselingPage.html`은 삭제 상태로 둠(잘못된 방향으로 설계돼 오해 소지).

**의도적으로 안 건드린 것**(당시): 되돌려진 커밋에 있던 시뮬레이터 배너 `flexWrap` 수정·페이지
제목 모바일 축약(`useIsMobile`)·분야 필터 가로 스크롤 CSS는 `00-38` §8.3에 없는 항목이고, 커밋에
달려 있던 "09-16 사람 지시(재점검)" 코멘트의 진위를 이 세션에서 확인할 수 없었다(Opus가
직접 짠 코드라 실제 사람 지시였는지 불명).

✅ **09-16 후속 — 사용자가 채팅으로 직접 3건 재지시, 구현 완료.** "① 줄글 나열이 모바일에서
지저분 ② 분야 버튼 슬라이드로 넘기게 ③ 제목 '전문가 상담'으로 요약." 이번엔 사람이 이 세션에
직접 낸 지시라 진위 문제가 없다 — 위에서 안 건드리기로 했던 그 3건을 Sonnet이 구현:
- `CounselingPage.tsx`: 시뮬레이터 배너 설명문(`<p>배우자·자녀 수 등…</p>`) 삭제, CTA
  "간이 시뮬레이터 열기"→"계산하기"(목업 개선안과 동일). 제목 `useIsMobile`로 "전문가 상담" 축약.
  분야 필터 `flexWrap:nowrap + overflowX:auto`(CareGuidePage §8.1-3① 패턴)로 가로 슬라이드.
- `TaxSimulatorModal.tsx`: "계산 기준 및 참고사항" 4문단 프로즈 → `<ul>` 3항목 + 굵은 경고
  1줄로 정리(수치·법적 근거는 전부 유지, 형식만 문단→목록). 목업 승인 체크포인트 ③에 해당하던
  항목 — 이제 사람이 직접 승인.
- `index.css`: `.counsel-sim-banner`/`.counsel-sim-banner-cta`(768px 이하 flex-basis:100%
  안전장치) 재추가.
- `tsc --noEmit`(frontend) 에러 0. 실기동은 사람 몫으로 미검증.

✅ **09-17 마감 — 사람 실기동 확인 완료.** 이후 미세조정 2건 추가 반영: 배지 문구
"변호사·세무사 1:1 케어"→"전문가 상담"(배너와 통일) · 배너 헤드라인 `fontSize` 미지정→
`var(--fs-lead)`로 확대 · 분야 필터 스크롤 컨테이너 여백 확대(버튼-스크롤바 간 체감 간격
`paddingBottom` `0.3rem`→`0.85rem`) · 시뮬레이터 아이콘 원 `44px`→`38px`(비율 유지, "영역이
너무 큼" 지적 반영). 전부 `tsc` 에러 0, walkthrough 09-16·09-17 항목에 기록됨. **⑰ 닫음.**

<!-- Gemini 판정 대기 -->

---

## ⑱ CRLF 오염 — 측정 상세 (2026-09-17, 본문은 backlog.md에 요약으로 남음)

> 🔵 결론과 사람 판단 요청은 `backlog.md` ⑱에 있다. 여기는 **근거 수치**만 보관한다.


**경위**: 09-16 세션 초반 `core.autocrlf`가 로컬에 `true`로 켜져 있던 것을 발견해 `false`로
껐다(Claude 메모리 `wsl-git-forbidden` 참고 — 저장소 밖이라 위키링크로 걸지 않는다). 그런데 그 끄기 작업 **이전에** 이미 여러 커밋이
`autocrlf=true`인 채로 만들어졌고, 그 시점 작업 트리 파일이 전부 CRLF로 체크아웃돼 있던 상태에서
커밋된 탓에 **일부 파일의 git 커밋 자체에 CRLF가 그대로 박혔다**(정상이라면 `autocrlf=true`가
add 시점에 LF로 되돌렸어야 하는데, 이 환경에서는 그렇게 안 됐다 — 원인 미상, 재현 필요시 확인).

**피해 범위(확인됨)** — `fa4547d`(10번수정)·`5b2d95b`(9번 CounselingPage 재구현) 커밋이 건드린
5개 소스 파일의 **HEAD 블롭 자체**가 CRLF다:
`eobomDev/frontend/src/index.css`(해당 커밋 diff가 "5441줄 변경"으로 찍힘 — 실제 의미있는 변경은
수십 줄 수준이었는데 전체 파일이 두 번 다시 쓰인 것처럼 보임) ·
`eobomDev/frontend/src/pages/CounselingPage.tsx`(472줄) ·
`eobomDev/frontend/src/components/counseling/TaxSimulatorModal.tsx`(374줄) ·
`eobomDev/frontend/src/pages/DigitalEstatePage.tsx`(396줄) ·
`eobomDev/frontend/src/components/expert/ConsultRequestModal.tsx`.
`.harness/memory/*.md`(context·backlog)와 `walkthrough.md`는 **오염 안 됨**(확인함, LF 유지).

**영향**: 코드 자체(런타임 동작)는 멀쩡하다 — `tsc`·`npm run build` 전부 통과했고 이 세션에서
실제로 브라우저에 띄워 확인도 했다. **오염된 것은 git 히스토리의 diff 가독성뿐**이다 —
`git show fa4547d`·`git blame`이 실제 변경과 무관한 줄을 대량으로 걸어 보여준다. `record.md`가
요구하는 "반증 가능한 결과"(건드린 파일·정확한 변경 내용)가 그 두 커밋에 한해 사실상 깨졌다.

**이번 세션에서 한 것**: Phase 4 작업 중 똑같은 일이 **또** 일어나려는 걸 잡았다 — 편집한 4개
파일(`LegalDocLayout.tsx`·`FamilyInvitePage.tsx`·`MemorialLandingPage.tsx`·`ObituaryLandingPage.tsx`)
의 작업 트리 사본이 전부 CRLF로 떠 있어(각 파일 HEAD 블롭은 LF) 그대로 뒀으면 5번째 오염
커밋이 될 뻔했다. PowerShell `[System.IO.File]::ReadAllText/WriteAllText`로 4개 파일을 **LF로
재정규화**(내용은 그대로, 줄바꿈만) → `git diff`가 실제 변경분(13줄 추가/5줄 삭제)만 보여주는
것으로 확인. **Phase 4 커밋은 깨끗하다.**

🔴 **닫힌 5개 파일은 그대로 뒀다** — 이미 커밋된 히스토리를 건드리는 건 사람 판단 영역이라
(`AGENTS.md` §4 에스컬레이션 — "되돌리기 어려운 것"에 가깝다) 임의로 정규화 커밋을 만들지 않았다.

🔄 **2026-09-17 `[Opus]` 재측정 — 위 경위·범위 2건을 정정한다**(본문은 기록으로 남긴다).

**① 경위 정정** — *"`core.autocrlf`가 `true`로 켜져 있던 것을 발견해 `false`로 껐다"* 는 반대다.
09-16 세션이 한 것은 **repo-local에 `true`를 넣은 것**이다(그 전에는 local 설정이 아예 없었고,
`C:\ProgramData\Git\config`의 `true`만 있어 WSL이 못 봤다 — WSL 88건 vs Windows 19건). 지금
`.git/config`는 **`false`** 이므로 **09-17에 누군가 `true`→`false`로 바꾼 것**이다.
🔴 `false`면 작업 트리의 CRLF가 **그대로 커밋된다** — 끄는 쪽이 오염을 부르는 방향이다.

**② 범위 정정 — "5개 파일"이 아니다.** `git cat-file`로 HEAD 블롭을 직접 세면
🔴 **285개 중 177개(62%)가 이미 CRLF**다. `index.css`는 `b6e2f70`(09-11, 문제의 세션들보다
앞선다)부터 **계속 CRLF**였고 `README.md`는 `ba93691`부터 그렇다. 즉 **09-16·09-17 커밋이
오염을 만든 것이 아니라, 원래 CRLF이던 파일을 그대로 유지한 것**이다.
🔵 *"`index.css` diff가 5441줄"* 도 이 커밋들이 만든 현상이 아니다 — 블롭은 앞뒤 커밋 모두 CRLF다
(2649 → 2693 → 2716 → 2727). **보는 쪽의 `autocrlf` 값에 따라 diff가 요동친 것**에 가깝다.

**그래서 권장 1(5개 파일만 재정규화)은 부분 처방이다.** 62%가 CRLF인 상태에서 5개만 LF로 바꾸면
혼재가 더 심해진다. 🔴 **전면 재정규화 1회** 아니면 **현상 유지** 중 하나를 골라야 하고, 어느 쪽이든
**권장 2(`.gitattributes`)가 먼저**다 — 그게 없으면 세션마다 `autocrlf`가 뒤집히는 일이 또 생긴다
(09-16 `true` → 09-17 `false`가 실제로 그랬다). 🟡 `.sh`는 LF여야 하므로 `* text=auto eol=lf`로
일괄 지정하되 `*.ps1 text eol=crlf`만 예외로 두는 편이 안전하다.

**권장(사람 확인 후 진행)**:
1. 위 5개 파일을 LF로 재정규화하는 **별도 커밋**(내용 변경 없음, 순수 줄바꿈 — 메시지에
   명시해 향후 `git blame`이 헷갈리지 않게 한다).
2. 재발 방지 — 저장소 루트에 `.gitattributes` 신설: `* text=auto eol=lf` (또는 최소
   `*.ts *.tsx *.css *.md text eol=lf`). 이러면 `core.autocrlf` 로컬 설정과 무관하게 커밋되는
   내용이 항상 LF로 강제된다 — 09-16·09-17에 두 번 겪은 이 사고 유형의 근본 차단.
3. (2)를 넣으면 첫 커밋 시 `git add --renormalize .`가 필요할 수 있다(대량 diff 예상 — 미리
   경고하고 진행).

<!-- Gemini 판정 대기 -->

---

## ⑫ 인프라 리전 — 실측 근거 (08-28 이관)

> **결정 본체는 `pending-approvals.md`다. 여기엔 근거만 둔다** — 근거는 매 세션 실려 다닐 이유가 없다.

**08-21 오픈 블로커 승격 사유 — 원론이 아니라 실측이다.**
현 배포는 **백엔드 Render `oregon`(미국) ↔ DB Supabase 서울**로 갈려 있다.

| 실측 | 값 |
|---|---|
| `/api/health`(DB 미사용) | ~165ms |
| `/api/obituaries/:slug`(DB 사용) | **~1,500ms** — 차이 1.3초가 태평양 왕복 |
| 무료 웹서비스 15분 슬립 | 🔴 **조문객이 새벽에 카톡 링크를 처음 누르면 수십 초 흰 화면** |
| 국외이전 | 🔴 **개인정보가 미국에서 처리됨** — `00-17` §3.3이 DB를 서울로 잡아 *"논점을 안 만들려"* 한 목적이 **백엔드가 미국이라 무효화**. `00-19` 제7조 재검토 |

⚠️ Render 리전은 `render.yaml`의 `region:` 필드로만 정해지고(생성 화면에 없음) **생성 후 변경 불가**.
🔵 **08-21 개발자 판단: 싱가포르 미이전** — 지연만 줄고 국외이전은 그대로라 두 번 일하게 된다.
