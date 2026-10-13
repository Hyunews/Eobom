# context.md—지금 상태

> **3KB 초과 금지**(doctor). 할 일 목록 정본 = **업무판**. 여기엔 흐름·위치만.
> 끝난 항목·경위 → `memory/context_아카이브_2610.md`

🔒`pending-approvals.md`·`backlog.md`

## ▶ 다음 할 일

**업무판(정본)** https://claude.ai/artifact/HZUBGqnKnx6jFzuqK9HJPx — db `tasks`. 상태는 ArtifactData `update`(끝나면 "완료"). 답변에선 id 말고 **화면 제목**으로 부른다.

**주 흐름 = A안(10-07)**: Sonnet은 업무판 개발 순서, Opus는 docs 정리.
- ✅ **5단계 끝**(10-13, 색인 `e9c2873` Opus 확인 · 경위 README §1-5 끝) — 잔여 `[Sonnet]` 1건: 상세 카드 변경일 `%cs`(git 2.16 미지원) → `%cd --date=short` + `index` 재실행
- ✅ 리프레시 토큰 재발급 구현·실기동 확인(10-13, `00-34` §2.3-5). 별건: 사업자 화면 "리드를 찾을 수 없습니다" 1회(재현 안 됨, 재발 시 보고)
- ✅ 사업자 화면 모바일(10-13, `00-39` §5-0-1·2) — 실기동 확인 · 커밋 대기
- ✅ **6-A 00 경위 분리**(10-13, 1세션 · README §1 6행) — 00 38개 + 01~08 27개 → `docs/작업일지_및_기록/문서_경위/` · 00 1,421→1,036KB · 01~08 1,159→838KB · 커밋 대기
- ▶ **6-B 1회차 끝**(10-13) — 후보 도구 `docs-overlap.js` · 실측 중복 적음(글귀 25쌍) → **2~3세션** · 계획 = `docs-audit/README.md` §1-6 · 🔴 결정 ⑥(정본 기준) 대기 → 다음 B-2 추모관·부고 · Sonnet과 동시 진행 안 함(크레딧)
- 끝난 항목은 `context_아카이브_2610.md` 맨 위

## 작업시트 ↔ 업무판

- 바탕화면 `이어봄_작업시트.html` = docs 정리·보고서 **큰 흐름**(ROWS만 수정)
- 업무판 = 그날그날 개발·결정. 둘이 다르면 개발은 업무판, 문서 단계는 작업시트

## 규칙 요약(상세는 각 파일)

- 🔴 WSL git 금지 · 파기 `--confirm`·DB 초기화는 사람만(훅이 막음) · 문서 내용은 Edit/Write로만(예외: `docs-move-appendix.js` · `docs-catalog.js apply`)
- [사용자] 위치정보법 신고 = 유일한 게시 블로커(재촉 안 함) · [Gemini] 게이트 41건 대기(10-12 4건 완료) · Gemini `eobomDev/` 쓰기 = Antigravity deny로 차단(10-12, `GEMINI.md` §주의)

## 지금 막고 있는 것

- 🟡 이미지 로컬 디스크: 재배포 시 소실 → 추모관 사진 오픈 금지(systems §5)
- `Deceased` 미확정: 05·07 프리필(backlog③)
- 🟡 오픈 전: Footer 이메일 임시값(`config.ts` `CONTACT_EMAIL`) → 서비스용으로 교체 + `00-19` 제12조 같은 값(`07-02` §5.4-2)
