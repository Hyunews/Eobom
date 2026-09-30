// 전용 테스트 DB 가드 시험 — DB가 필요 없다. 가드가 뚫리면 테스트가 개발·운영 DB를 건드릴 수 있으므로 가드 자체를 시험한다.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { assertTestDatabaseUrl, TestDbGuardError } from './helpers/dbGuard';

const ok = 'postgresql://u:p@localhost:5433/eobom_test?schema=public';

describe('assertTestDatabaseUrl', () => {
  it('localhost + _test 로 끝나는 DB는 통과', () => {
    assert.equal(assertTestDatabaseUrl(ok), ok);
    assert.doesNotThrow(() => assertTestDatabaseUrl('postgresql://u:p@127.0.0.1:5432/x_test'));
  });
  it('없거나 빈 값이면 거부(DATABASE_URL 폴백 없음)', () => {
    assert.throws(() => assertTestDatabaseUrl(undefined), TestDbGuardError);
    assert.throws(() => assertTestDatabaseUrl('   '), TestDbGuardError);
  });
  it('개발 DB 이름(eobom_db)이면 거부', () => {
    assert.throws(() => assertTestDatabaseUrl('postgresql://u:p@localhost:5433/eobom_db?schema=public'), TestDbGuardError);
  });
  it('원격 호스트면 이름이 _test여도 거부(운영 Supabase 차단)', () => {
    assert.throws(() => assertTestDatabaseUrl('postgresql://u:p@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres_test'), TestDbGuardError);
    assert.throws(() => assertTestDatabaseUrl('postgresql://u:p@db.abc.supabase.co:5432/eobom_test'), TestDbGuardError);
  });
  it('_test가 이름 중간에만 있으면 거부', () => {
    assert.throws(() => assertTestDatabaseUrl('postgresql://u:p@localhost:5433/eobom_test_backup'), TestDbGuardError);
  });
  it('URL이 아니면 거부', () => {
    assert.throws(() => assertTestDatabaseUrl('not a url'), TestDbGuardError);
  });
});
