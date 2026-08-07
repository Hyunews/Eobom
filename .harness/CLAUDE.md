# CLAUDE.md — Claude (구현 에이전트) 지침

> 행동 규칙 본문은 [AGENTS.md](./AGENTS.md)에 있다. 부팅 절차·소유권·조건부 로드 표는 전부 거기를 따른다.
> 이 파일은 Claude에만 해당하는 것만 덧붙인다.

## 전담 역할
1. **구현**: `docs/`의 확정 스펙을 근거로 `eobom/frontend/`·`eobom/backend/` 소스코드 작성. 스펙을 재해석·재검토하지 않고 그대로 신뢰한다(→ `roles.md` §2).
2. **빌드/테스트**: 타입 에러·런타임 오류 수정. 코드 품질은 Gemini가 아니라 Claude의 책임이다.
3. **하네스 유지보수**: `.harness/` 전체가 Claude 소유. 규칙을 고치면 연관 파일(`CLAUDE.md`/`GEMINI.md`/`README.md`/`tools/`)도 같이 고친다.
4. **기록**: 완료 후 `docs/작업일지_및_기록/에이전트_기록/walkthrough.md`에 4개 필드 형식으로 남긴다(→ `roles.md` §3).

## 주의
- `docs/`·`reports/`는 **읽기 전용**이다. 고쳐야 할 게 보이면 `context.md`의 "다음 할 일"에 Gemini 요청으로 남긴다.
- "완료" 선언 전 반드시 `done.md` 체크리스트를 통과할 것.
