# context.md—지금 상태

> **3KB 초과 금지**(doctor). 할 일 목록 정본 = **업무판**. 여기엔 흐름·위치만.
> 끝난 항목·경위 → `memory/context_아카이브_2610.md`

🔒`pending-approvals.md`·`backlog.md`

## ▶ 다음 할 일

**업무판(정본)** https://claude.ai/artifact/HZUBGqnKnx6jFzuqK9HJPx — db `tasks`. 상태는 ArtifactData `update`(끝나면 "완료"). 답변에선 id 말고 **화면 제목**으로 부른다.

**주 흐름 = A안(10-07)**: Sonnet은 업무판 개발 순서, Opus는 docs 정리.
- ▶ **보고서 단계** — R910 v0.1(9쪽) **개발자 HTML 검토 대기**. 결정 대기 보고서(R500~R700) 재점검 = 결정이 바뀔 때만 정오, 나머지는 사장님 결정 직전 1회
- ▶ 시설 태그: 데이터 정리 로컬·운영 ✅ 10-15 · `01-06` 반영 ✅ · 남음 = 코드 푸시·배포 후 운영 화면 "공설+봉안당" 확인
- walkthrough 10월분 아카이브 가능
- DB 복구 ✅ 10-15(`db-safety.md` §8) · 남음: `restore-db` 로컬 시험(오픈 전) · R310 v1.1 발행

- 🎨 **디자인 개편** — 🔴 **먼저 `C:\Users\kilak\Desktop\이어봄_디자인개편.md`(결정 정본)를 읽는다** · 진행 = 같은 곳 `이어봄_디자인시안_시트.html` · 단계별 결정 = `이어봄_디자인_N단계_목록.md`. 시안 1~6단계 ✅ · 7단계 docs ✅(새 문서 `00-44`·`00-45`) → ▶ **8단계 구현 = 묶음 0~13, 정본 `00-44` §9-4**(브랜치 `redesign` · 미리보기 `/preview/…`) · 묶음 0~4 ✅ 10-22(편차 판정·사람 실기동까지, 경위 = walkthrough) → 묶음 5 사후 정리 코드·빌드 ✅ 10-22(`/preview/care-guide`·`pickup`·`digital-estate`·`facility`·`facility/:id`·`obituary` + 서버 `GET /api/facilities/:id/detail`, 실기동 대기 · walkthrough 편차 ①~⑮ **Opus 판정 대기**) → 커밋 ✅ 10-22(`8cb4a87`·`603ef15`) → 편차 판정 ✅ 10-22(스펙갱신, 00-44 §6-8 움직임 신설) → 시설 API 전화번호 제거 ✅ `main` `45bd490` · 디지털 정산 재구성 ✅ 10-22(판 2-20 · docs `04-01` §0.2·§0.2-0 · 구현 `2706f24` · Opus 대조 편차 없음 · 실기동 ✅ · 부제 나안 1줄 커밋 대기) → 묶음 6 조문객 코드·빌드 ✅ 10-22(`/preview/visitor/…` 4곳 + 서버 방명록 `mine`, 실기동 대기) → 편차 판정 ✅ 10-22(스펙갱신: 부품 선택 3종) · 실기동 ✅ 10-22(`005a999` 기준) → ▶ **Sonnet 부품 보정 `RdLoginGate`·`RdState`·`RdNotice` → 바뀐 3곳만 눈 확인 → 묶음 7**
## 작업시트 ↔ 업무판

- 바탕화면 `이어봄_작업시트.html`(ROWS만 수정) = 문서 단계 큰 흐름 · 업무판 = 그날 개발·결정. 다르면 각자 쪽이 정본

## 규칙 요약(상세는 각 파일)

- 🔴 WSL git 금지 · 파기 `--confirm`·DB 초기화는 사람만(훅이 막음) · 문서 내용은 Edit/Write로만(예외 3종 = `docs-audit/README.md` §6-3)
- [사용자] 위치정보법 신고 = 유일한 게시 블로커(재촉 안 함) · [Gemini] reports 81종 전수 갱신 완료(10-21) · wt 2건 판정 완료(10-21) · Gemini `eobomDev/` 쓰기 = Antigravity deny로 차단(10-12, `GEMINI.md` §주의)

## 지금 막고 있는 것

- 🟡 이미지 로컬 디스크: 재배포 시 소실 → 추모관 사진 오픈 금지(systems §5)
- `Deceased` 미확정: 05·07 프리필(backlog③)
- 🟡 오픈 전: Footer 이메일 임시값(`config.ts` `CONTACT_EMAIL`) → 서비스용으로 교체 + `00-19` 제12조 같은 값(`07-02` §5.4-2)
