# context.md—지금 상태

> **3KB 초과 금지**(doctor). 할 일 목록 정본 = **업무판**. 여기엔 흐름·위치만.
> 끝난 항목·경위 → `memory/context_아카이브_2610.md`

🔒`pending-approvals.md`·`backlog.md`

## ▶ 다음 할 일

**업무판(정본)** https://claude.ai/artifact/HZUBGqnKnx6jFzuqK9HJPx — db `tasks`. 상태는 ArtifactData `update`(끝나면 "완료"). 답변에선 id 말고 **화면 제목**으로 부른다.

**주 흐름 = A안(10-07)**: Sonnet은 업무판 개발 순서, Opus는 docs 정리.
- ▶ **보고서 단계(10-13 개발자)** — ① 기능 상태 대장+용어집 ✅ 10-13(`이어봄_보고서/01_기능_상태_대장.md`·`02_용어집.md` — 모든 보고서가 기능 유무를 여기서 가져감) → 다음 **R910**. 운영 STT·OCR·R2 4개 `true`(10-13 개발자 확인) — CLOVA는 사장님 승인 전 운영 사용 중(`pending-approvals`). [Sonnet] 급하지 않음 1건 = STT 꺼질 때 녹음 탭 안내 문구(`06-04` §6.4-9-8-3). 결정 대기 보고서(R500~R700) 재점검 = 결정 항목·범위가 바뀔 때만 즉시(정오), 나머지는 사장님 결정 직전 1회 — 대조 도구(A안)는 그때 만든다. R600 정오표 v1.0 발행(10-13, `R600_인프라/정오_20261013/`)
- [Gemini] 🟡 walkthrough 10월분 판정 대기 62건 — 판정은 **walkthrough 칸에** 적을 것(10-13 9월분 120건 "판정 생략" 이관, 647→229KB, `record.md` §2-1). 판정 나면 아카이브 가능
- [Claude:Sonnet] 잔여: 상세 카드 변경일 `%cs` → `%cd --date=short`
- 끝난 항목(10-13 5단계·리프레시 토큰·사업자 모바일·6-A 포함)은 `context_아카이브_2610.md` 맨 위

## 작업시트 ↔ 업무판

- 바탕화면 `이어봄_작업시트.html` = docs 정리·보고서 **큰 흐름**(ROWS만 수정)
- 업무판 = 그날그날 개발·결정. 둘이 다르면 개발은 업무판, 문서 단계는 작업시트

## 규칙 요약(상세는 각 파일)

- 🔴 WSL git 금지 · 파기 `--confirm`·DB 초기화는 사람만(훅이 막음) · 문서 내용은 Edit/Write로만(예외 3종 = `docs-audit/README.md` §6-3)
- [사용자] 위치정보법 신고 = 유일한 게시 블로커(재촉 안 함) · [Gemini] 게이트 41건 대기(10-12 4건 완료) · Gemini `eobomDev/` 쓰기 = Antigravity deny로 차단(10-12, `GEMINI.md` §주의)

## 지금 막고 있는 것

- 🟡 이미지 로컬 디스크: 재배포 시 소실 → 추모관 사진 오픈 금지(systems §5)
- `Deceased` 미확정: 05·07 프리필(backlog③)
- 🟡 오픈 전: Footer 이메일 임시값(`config.ts` `CONTACT_EMAIL`) → 서비스용으로 교체 + `00-19` 제12조 같은 값(`07-02` §5.4-2)
