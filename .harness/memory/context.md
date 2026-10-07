# context.md—지금 상태

> **3KB 초과 금지**(doctor). 할 일 목록 정본 = **업무판**. 여기엔 흐름·위치만.
> 10-07 이전 경위 → `memory/context_아카이브_2610.md`

🔒`pending-approvals.md`·`backlog.md`

## ▶ 다음 할 일

**업무판(정본)** https://claude.ai/artifact/HZUBGqnKnx6jFzuqK9HJPx — db `tasks`. 상태는 ArtifactData `update`(끝나면 "완료"). 답변에선 id 말고 **화면 제목**으로 부른다.

**주 흐름 = A안(10-07)**: Sonnet은 업무판 개발 순서, Opus는 docs 정리 4단계로 복귀.
- ✅[Sonnet] 유언장 사진 보관 P4 구현(10-07·미커밋·tsc·npm test 437·build 통과) → ▶ 실화면 확인 [Opus]: 로컬 `.env` R2_WILL_* 4개·로컬 DB·운영 DB 마이그레이션·Render 변수 모두 ✅(10-07) · 남은 것 = 커밋·배포 후 실화면(R2 실업로드 포함)
- ▶[Claude:Opus] R600·R610 v1.2 재발행(대기열·m4a·음성 측정값)
- 🟡[Claude:Opus] docs 4단계 남은 것 = 월 1회 점검 관리계획 · plan.md 불일치 17줄
- ✅ 하네스 분리(10-07) — 경위는 `_meta/`, 종결 backlog는 `backlog_아카이브_2610.md`, 보류 본문은 `backlog_보류.md`

## 작업시트 ↔ 업무판

- 바탕화면 `이어봄_작업시트.html` = docs 정리·보고서 **큰 흐름**(ROWS만 수정)
- 업무판 = 그날그날 개발·결정. 둘이 다르면 개발은 업무판, 문서 단계는 작업시트

## 규칙 요약(상세는 각 파일)

- 🔴 WSL git 금지 · 파기 `--confirm`·DB 초기화는 사람만(훅이 막음) · 문서 내용은 Edit/Write로만
- [사용자] 위치정보법 신고 = 유일한 게시 블로커(재촉 안 함) · [Gemini] 게이트 45건 대기

## 지금 막고 있는 것

- 🟡 이미지 로컬 디스크: 재배포 시 소실 → 추모관 사진 오픈 금지(systems §5)
- 🟡 운영 R2: Render 변수 추가 전(사람) · Worker 분할 전송 미확인
- `Deceased` 미확정: 05·07 프리필(backlog③)
