import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addOperatingMinutes, computeDeadlines } from './operatingHours';

// 입력·기대값은 전부 KST(+09:00)로 적는다. 2026-11은 공휴일이 없는 달이라 요일 계산만 검증하고,
// 2026-10-05(개천절 대체공휴일)로 공휴일 건너뛰기를 따로 검증한다.
const kst = (s: string) => new Date(`${s}+09:00`);
const iso = (d: Date) => new Date(d.getTime() + 9 * 3600 * 1000).toISOString().slice(0, 16);

test('금요일 16시 접수 → 6h는 다음 주 월요일 14시 (00-41 §5.1)', () => {
  assert.equal(iso(computeDeadlines(kst('2026-11-06T16:00:00')).dueAt), '2026-11-09T14:00');
});

test('월요일 10시 접수 → 6h는 월요일 16시 (00-41 §5.1)', () => {
  assert.equal(iso(computeDeadlines(kst('2026-11-09T10:00:00')).dueAt), '2026-11-09T16:00');
});

test('내부 목표 1h — 운영시간 안 접수는 한 시간 뒤', () => {
  assert.equal(iso(computeDeadlines(kst('2026-11-09T10:00:00')).targetAt), '2026-11-09T11:00');
});

test('토요일 밤 접수는 월요일 9시부터 센다', () => {
  const r = computeDeadlines(kst('2026-11-07T20:00:00'));
  assert.equal(iso(r.targetAt), '2026-11-09T10:00');
  assert.equal(iso(r.dueAt), '2026-11-09T15:00'); // 월 9~15시 6h
});

test('평일 17시 이후·9시 이전 접수', () => {
  assert.equal(iso(addOperatingMinutes(kst('2026-11-09T18:00:00'), 60)), '2026-11-10T10:00');
  assert.equal(iso(addOperatingMinutes(kst('2026-11-09T08:00:00'), 60)), '2026-11-09T10:00');
});

test('17시를 넘기는 경우 남은 시간이 다음 운영일로 이월', () => {
  assert.equal(iso(addOperatingMinutes(kst('2026-11-09T16:30:00'), 60)), '2026-11-10T09:30');
});

test('공휴일(2026-10-05 대체공휴일)은 건너뛴다 — 금 16시 접수가 화요일 14시', () => {
  assert.equal(iso(computeDeadlines(kst('2026-10-02T16:00:00')).dueAt), '2026-10-06T14:00');
});

test('추석 연휴(9/24·9/25) 다음 평일 처리', () => {
  // 수 9/23 16:00 접수 → 수 1h + (목·금 휴무, 토·일) + 월 5h → 9/28 14:00
  assert.equal(iso(computeDeadlines(kst('2026-09-23T16:00:00')).dueAt), '2026-09-28T14:00');
});
