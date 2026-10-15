# context.md—지금 상태

> **3KB 초과 금지**(doctor). 할 일 목록 정본 = **업무판**. 여기엔 흐름·위치만.
> 끝난 항목·경위 → `memory/context_아카이브_2610.md`

🔒`pending-approvals.md`·`backlog.md`

## ▶ 다음 할 일

**업무판(정본)** https://claude.ai/artifact/HZUBGqnKnx6jFzuqK9HJPx — db `tasks`. 상태는 ArtifactData `update`(끝나면 "완료"). 답변에선 id 말고 **화면 제목**으로 부른다.

**주 흐름 = A안(10-07)**: Sonnet은 업무판 개발 순서, Opus는 docs 정리.
- ▶ **보고서 단계** — R910 v0.1(9쪽) **개발자 HTML 검토 대기**. 결정 대기 보고서(R500~R700) 재점검 = 결정이 바뀔 때만 정오, 나머지는 사장님 결정 직전 1회
- 🔜 [Sonnet] **디자인 작업 뒤**: 운영자 회원 상세 열람 사유 필수(`00-37` §7 #1, 10-15) · `PrivacyPage` 제7조 연락처 칸(`00-19` 제7조 편집자 주 10-15) · 공개 전 코드 묶음(`00-39` §3 명도 대비)
- 🔜 [Sonnet] 시설 태그 2분류(운영 주체·시설 종류) 걸러보기 + 데이터 정리 — `01-06` 10-15 개정
- walkthrough 10월분 아카이브 가능
- DB 복구 ✅ 10-15(`db-safety.md` §8) · 남음: `restore-db` 로컬 시험(오픈 전) · R310 v1.1 발행

- 🎨 **디자인 재설계 시안(10-14, 문서·코드 반영 전)** — 방향 A(편지·기록)+C 첫 화면. 랜딩 캔버스 https://claude.ai/artifact/BVhybr7ij2hmP8mupWeEvD (비교 A·B·C: …/PUqBtCt4d1YGip8YmfcTMq). 🔴 **디자인 작업이면 먼저 `C:\Users\kilak\Desktop\이어봄_디자인개편.md`(결정 정본)를 읽는다** · 진행 = 같은 곳 `이어봄_디자인시안_시트.html`(docs 아님). 1단계 생전 준비 ✅ 10-15 → 2단계 목록 확정 10-15(바탕화면 `이어봄_디자인_2단계_목록.md`) → 묶음 1(행정 가이드+유품 정리) Sonnet 그리기. 전 화면 시안(6단계 파트너·운영자 포함) → `00-39`·`00-40` 반영 → Sonnet

## 작업시트 ↔ 업무판

- 바탕화면 `이어봄_작업시트.html`(ROWS만 수정) = 문서 단계 큰 흐름 · 업무판 = 그날 개발·결정. 다르면 각자 쪽이 정본

## 규칙 요약(상세는 각 파일)

- 🔴 WSL git 금지 · 파기 `--confirm`·DB 초기화는 사람만(훅이 막음) · 문서 내용은 Edit/Write로만(예외 3종 = `docs-audit/README.md` §6-3)
- [사용자] 위치정보법 신고 = 유일한 게시 블로커(재촉 안 함) · [Gemini] 게이트 41건 대기(10-12 4건 완료) · Gemini `eobomDev/` 쓰기 = Antigravity deny로 차단(10-12, `GEMINI.md` §주의)

## 지금 막고 있는 것

- 🔴 `migrate-prod.bat` 오표시(10-15 바로가기 실행 시 node 못 찾음 → 반영 안 됐는데 "[O] 완료") → [Sonnet] 도구 수정. 운영 반영은 터미널로 ✅(54건)

- 🟡 이미지 로컬 디스크: 재배포 시 소실 → 추모관 사진 오픈 금지(systems §5)
- `Deceased` 미확정: 05·07 프리필(backlog③)
- 🟡 오픈 전: Footer 이메일 임시값(`config.ts` `CONTACT_EMAIL`) → 서비스용으로 교체 + `00-19` 제12조 같은 값(`07-02` §5.4-2)
