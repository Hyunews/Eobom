# backend/tests — 회귀 테스트와 보존하는 검증 스크립트

근거: `docs/00_핵심플랫폼/00-15` §5·§6(2026-09-30 개발자 결정).

## 규칙

1. **검증용 임시 스크립트는 지우지 않는다.** 앞으로 손으로 짠 HTTP 검증 스크립트는 여기에 남기고 커밋한다.
2. 빨간 테스트를 방치하지 않는다 — 고칠 수 없으면 지운다. 커버리지 목표는 세우지 않는다.
3. 테스트는 walkthrough 검증 게이트를 **대체하지 않는다**(`record.md`).
4. 테스트 데이터는 **가짜만**(`security.md` §2). 실제 개인정보·운영 덤프 금지.

## 돌리는 법

```
cd eobomDev/backend
npm test
```

`npm test`는 (a) 기존 단위 테스트 2개 (b) `tests/db-guard.test.ts` (c) `tests/auth-boundary.test.ts`를 돌린다.
러너는 Node 내장 `node:test` — 이미 쓰던 방식이고 의존성을 늘리지 않는다.

## 🔴 전용 테스트 DB

- 테스트는 **`TEST_DATABASE_URL`이 가리키는 DB에서만** 돈다. 없으면 `DATABASE_URL`로 **폴백하지 않고** 즉시 실패한다.
- **localhost가 아니거나 DB 이름이 `_test`로 끝나지 않으면** 시작 전에 실패한다(개발 DB `eobom_db`·운영 Supabase 차단).
  실제로 붙은 DB 이름도 시작 시 `SELECT current_database()`로 한 번 더 확인한다.
- `.env` 전체를 불러오지 않는다 — 읽는 건 `.env`의 `TEST_DATABASE_URL` 한 줄뿐이다.

### 처음 한 번(로컬)

```
# 1) 새 DB 생성 — 기존 eobom_db는 건드리지 않는다 (PowerShell)
"CREATE DATABASE eobom_test;" | docker exec -i eobom-postgres sh -c 'psql -U "$POSTGRES_USER" -d postgres'
# 2) backend/.env에 TEST_DATABASE_URL 추가 (.env.example 참고, DB 이름만 eobom_test)
# 3) 스키마 적용 — 마이그레이션이 늘면 다시 돌린다
npm run test:db:migrate
```

## CI

`.github/workflows/backend-test.yml` — push·PR마다 임시 Postgres 컨테이너(`eobom_test`)에서 위와 같은 순서로 돈다.
운영·Render·Supabase 비밀값은 쓰지 않고, 배포와 무관하다(실패해도 알림만).

## 새 보호 경로를 만들 때

`auth-boundary.test.ts`의 `PROTECTED` 표에 대표 경로를 한 줄 추가한다. 새 라우터를 `src/app.ts`에 마운트하면
"네임스페이스를 빠짐없이 덮는다" 테스트의 목록도 함께 고친다.
