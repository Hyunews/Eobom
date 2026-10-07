# 새 표에 한국 시간 보기 칸(createdAtKst·updatedAtKst) 붙이기

> 언제 쓰나: `createdAt`·`updatedAt`이 있는 **새 표를 만드는 마이그레이션**을 쓸 때.
> 2026-10-07 `systems.md` §4에서 글자 그대로 옮김. 빠뜨리면 `tests/created-at-kst.test.ts`·`tests/updated-at-kst.test.ts`가 표 이름을 대며 실패한다.

## 절차

- 🔴 **새 표에 `createdAt`이 있으면 `createdAtKst`, `updatedAt`이 있으면 `updatedAtKst` 칸 + 트리거를 같이 만든다**(10-01): DB를 열었을 때 한국 시간을 보는 보기 전용 칸이다(저장은 UTC). 마이그레이션에 `ADD COLUMN "createdAtKst" TIMESTAMP(3)` + `CREATE TRIGGER "<표>_created_at_kst" BEFORE INSERT OR UPDATE ON "<표>" FOR EACH ROW EXECUTE FUNCTION set_created_at_kst();` (`updatedAt`은 `"updatedAtKst"` · `"<표>_updated_at_kst"` · `set_updated_at_kst()`), `schema.prisma`엔 `createdAtKst DateTime?`·`updatedAtKst DateTime?`(Studio에서 보이게 `@ignore` 없음). **앱 코드에서 읽기·쓰기 금지** — 응답에선 `app.ts`의 `json replacer`가 두 키를 뺀다. 빠뜨리면 `tests/created-at-kst.test.ts`·`tests/updated-at-kst.test.ts`가 표 이름을 대며 실패한다.
