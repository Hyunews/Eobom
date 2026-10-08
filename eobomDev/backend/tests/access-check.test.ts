// docs 00-43 §10.4 — 접속기록 점검 판정 함수 시험. DB 없이 가짜 결과로 0건 · 1건 · 기준 경계값을 본다.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  LIMITS, judgeCount, judgeNewIp, judgeGaps, judgeRetention, judgeMasking, judgeSize, monthRange, previousMonthKst, renderHtml,
} from '../prisma/report-access-check';

test('①②③ 0건은 이상 없음, 1건 이상은 확인 필요(판정은 담당자)', () => {
  assert.equal(judgeCount(0).verdict, 'ok');
  assert.deepEqual(judgeCount(1), { verdict: 'check', summary: '확인 필요 1건' });
  assert.equal(judgeCount(7).summary, '확인 필요 7건');
});

test('④ 대상 달 이전 기록이 0건이면 첫 점검 문구', () => {
  const first = judgeNewIp(3, 0);
  assert.equal(first.verdict, 'check');
  assert.match(first.note ?? '', /첫 점검 — 전부 표시됨\(정상\)/);
  assert.equal(judgeNewIp(0, 0).verdict, 'ok');
  const later = judgeNewIp(2, 120);
  assert.equal(later.note, undefined);
  assert.equal(later.summary, '확인 필요 2건');
});

test('⑤ 기록 끊긴 날 0일/1일', () => {
  assert.equal(judgeGaps(0).verdict, 'ok');
  assert.equal(judgeGaps(1).verdict, 'check');
  assert.match(judgeGaps(4).note ?? '', /개발자/);
});

test('⑥ 365/730/90 — 경계값은 정상, 하루 넘으면 이상', () => {
  const at = (a: number | null, b: number | null, c: number | null) => judgeRetention([
    { t: 'AccessLog', days: a }, { t: 'AdminAuditLog', days: b }, { t: 'ErrorLog', days: c },
  ]);
  assert.equal(at(365, 730, 90).verdict, 'ok');
  assert.equal(at(null, null, null).verdict, 'ok'); // 빈 표
  const bad = at(366, 730, 91);
  assert.equal(bad.verdict, 'issue');
  assert.deepEqual(bad.over, ['AccessLog', 'ErrorLog']);
  assert.match(bad.summary, /파기 배치 실행 필요/);
  assert.equal(at(365, 731, 90).over[0], 'AdminAuditLog');
});

test('⑦ 0건 이상 없음, 1건 이상 이상 있음', () => {
  assert.equal(judgeMasking(0).verdict, 'ok');
  assert.deepEqual(judgeMasking(2), { verdict: 'issue', summary: '이상 있음 2건' });
});

test('⑧ 300MB 이하 정상, 초과 이상', () => {
  assert.equal(judgeSize(0).verdict, 'ok');
  assert.equal(judgeSize(LIMITS.tableSizeMaxBytes).verdict, 'ok');
  assert.equal(judgeSize(LIMITS.tableSizeMaxBytes + 1).verdict, 'issue');
  assert.match(judgeSize(30 * 1024 * 1024).summary, /30\.0MB/);
});

test('기준값은 문서(00-22 부록 1-2)와 같다', () => {
  assert.equal(LIMITS.dailyViewMax, 50);
  assert.deepEqual(LIMITS.retentionDays, { AccessLog: 365, AdminAuditLog: 730, ErrorLog: 90 });
  assert.equal(LIMITS.tableSizeMaxBytes, 300 * 1024 * 1024);
});

test('대상 달의 시작·끝(한국 시간) 계산', () => {
  assert.deepEqual(monthRange('2026-10'), { ym: '2026-10', start: '2026-10-01 00:00:00', end: '2026-11-01 00:00:00', lastDay: '2026-10-31' });
  assert.equal(monthRange('2026-12')?.end, '2027-01-01 00:00:00');
  assert.equal(monthRange('2028-02')?.lastDay, '2028-02-29');
  assert.equal(monthRange('2026-13'), null);
  assert.equal(monthRange('2026-1'), null);
});

test('지난달은 한국 시간 기준 — UTC 로는 아직 전달이어도 한국은 새 달', () => {
  // 2026-11-01 00:30 KST = 2026-10-31 15:30 UTC → 한국은 11월이니 지난달 = 10월
  assert.equal(previousMonthKst(new Date('2026-10-31T15:30:00Z')), '2026-10');
  assert.equal(previousMonthKst(new Date('2027-01-05T00:00:00Z')), '2026-12');
});

test('결과지 — 메모·서명란이 있고 외부 자원이 없으며 이스케이프된다', () => {
  const html = renderHtml(
    { ym: '2026-10', start: '2026-10-01 00:00:00', lastDay: '2026-10-31' },
    [{ no: '①', title: '운영자 로그인 실패 · 잠금', verdict: 'check', summary: '확인 필요 1건', columns: ['시각', '운영자'], rows: [['2026-10-03 23:10:00', '<b>홍길동</b>']] }],
    '2026-11-03 09:00 (한국 시간)',
  );
  assert.match(html, /자동 판정은 참고용/);
  assert.match(html, /표 10/);
  assert.match(html, /표 11/);
  assert.match(html, /서명/);
  assert.ok(html.includes('&lt;b&gt;홍길동&lt;/b&gt;'));
  assert.doesNotMatch(html, /<script|<link|https?:\/\//);
});
