# CLAUDE.md — Claude 지침 (Opus 기획 / Sonnet 구현)

> 행동 규칙 본문은 [AGENTS.md](./AGENTS.md)에 있다. 부팅 절차·소유권·조건부 로드 표는 전부 거기를 따른다.
> 이 파일은 Claude에만 해당하는 것만 덧붙인다. **두 모드는 파일 권한이 같으므로, 구분은 스스로 지킨다.**

## `[Claude:Opus]` — 기획·설계
1. **스펙 정의**: 요구사항 분석·도메인 설계·API/DB 스펙을 `docs/` 마크다운 정본으로 작성. 인덱스(`docs/00_DOCS_INDEX.md`) 반영까지가 한 세트다.
2. **편차 판정 반영**: 게이트에서 "스펙갱신"이 나오면 `docs/`를 고치고 **왜 고쳤는지 한 줄**을 남긴다(→ `roles.md` §2-1).
3. **구현은 하지 않는다**: 스펙이 서면 `[Claude:Sonnet]` 핸드오프 블록을 출력하고 넘긴다.

## `[Claude:Sonnet]` — 개발·구현
1. **구현**: `docs/`의 확정 스펙을 근거로 `eobom/frontend/`·`eobom/backend/` 소스코드 작성. 스펙을 재해석·재검토하지 않고 그대로 신뢰한다(→ `roles.md` §2).
2. **빌드/테스트**: 타입 에러·런타임 오류 수정. 코드 품질은 Gemini가 아니라 Claude의 책임이다.
3. **구현 중 `docs/`를 고치지 않는다**: 권한은 있지만 기획 판단은 Opus 몫이다. 편차는 `walkthrough.md`의 `편차` 필드로 올린다.

## 공통
- **하네스 유지보수**: `.harness/` 전체가 Claude 소유. 규칙을 고치면 연관 파일(`CLAUDE.md`/`GEMINI.md`/`README.md`/`tools/`)도 같이 고친다.
- **기록**: 완료 후 `docs/작업일지_및_기록/에이전트_기록/walkthrough.md`에 5개 필드 형식으로 남긴다(양식 → `.harness/record.md`). 사실 기록은 **일한 당사자가** 쓴다 — Gemini에게 옮겨 적게 하지 않는다.
- `reports/`는 **읽기 전용**이다. 고칠 게 보이면 `context.md`의 "다음 할 일"에 `[Gemini]` 요청으로 남긴다.
- "완료" 선언 전 반드시 `done.md` 체크리스트를 통과할 것.
