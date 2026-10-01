// 한국 시간 표기 — 서버가 UTC로 돌아도 한국 날짜가 나와야 한다(특히 한국 0~9시).
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { kstIso, kstYmd, kstYmdCompact, kstYymmdd } from './kst';

describe('kst 표기', () => {
  it('UTC로는 전날 15시지만 한국은 다음 날 0시 — 날짜가 한국 기준으로 넘어간다', () => {
    const d = new Date('2026-09-30T15:00:00.000Z'); // KST 2026-10-01 00:00
    assert.equal(kstYmd(d), '2026-10-01');
    assert.equal(kstYmdCompact(d), '20261001');
    assert.equal(kstYymmdd(d), '261001');
  });

  it('UTC 14:59:59는 아직 한국 같은 날 23:59', () => {
    assert.equal(kstYmd(new Date('2026-09-30T14:59:59.999Z')), '2026-09-30');
  });

  it('연말·연초 경계', () => {
    assert.equal(kstYmd(new Date('2026-12-31T15:00:00.000Z')), '2027-01-01');
    assert.equal(kstYymmdd(new Date('2026-12-31T15:00:00.000Z')), '270101');
  });

  it('kstIso: +09:00 표기이고 다시 읽어도 같은 순간', () => {
    const d = new Date('2026-10-01T04:30:34.654Z');
    assert.equal(kstIso(d), '2026-10-01T13:30:34.654+09:00');
    assert.equal(new Date(kstIso(d)).getTime(), d.getTime());
  });
});
