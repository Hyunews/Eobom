// 전용 테스트 DB 가드 — 순수 함수(env·DB를 건드리지 않는다). testEnv.ts가 쓰고, db-guard.test.ts가 시험한다.
// 00-15 §6 ②: 개발 DB(eobom_db)·운영 Supabase를 가리키면 테스트 시작 자체를 거부한다.

export class TestDbGuardError extends Error {}

export function assertTestDatabaseUrl(url: string | undefined): string {
  if (!url || !url.trim()) {
    throw new TestDbGuardError(
      'TEST_DATABASE_URL이 없습니다. 테스트는 전용 DB에서만 돕니다(DATABASE_URL로 폴백하지 않음). ' +
        'backend/.env에 TEST_DATABASE_URL=postgresql://…@localhost:5433/eobom_test 를 넣으세요(.env.example 참고).'
    );
  }
  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    throw new TestDbGuardError('TEST_DATABASE_URL을 URL로 읽을 수 없습니다.');
  }
  const host = parsed.hostname;
  if (host !== 'localhost' && host !== '127.0.0.1') {
    throw new TestDbGuardError(`TEST_DATABASE_URL의 호스트가 로컬이 아닙니다(${host}) — 운영·원격 DB에서는 테스트를 돌리지 않습니다.`);
  }
  const dbName = decodeURIComponent(parsed.pathname.replace(/^\//, ''));
  if (!dbName.endsWith('_test')) {
    throw new TestDbGuardError(`TEST_DATABASE_URL의 DB 이름이 '_test'로 끝나지 않습니다(${dbName}) — 개발 DB를 시험하지 않습니다.`);
  }
  return url.trim();
}
