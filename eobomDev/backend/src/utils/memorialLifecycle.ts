// 추모관 보존기간·만료 통지 계산(00-20 §5.2-2·§8.1-2 확정, 00-22 E-9). 값은 config/policy.ts가
// 정본 — 여기는 순수 계산 함수만 둔다(동결·통지·파기는 prisma/destroy-farewell-media.ts가 부른다).

import { POLICY } from '../config/policy';

const DAY_MS = 24 * 60 * 60 * 1000;
const addDays = (date: Date, days: number): Date => new Date(date.getTime() + days * DAY_MS);

// 활성 만료 시점 = 기준일 + activeDays(395일). 연장도 같은 함수를 "연장한 날"로 다시 호출한다
// — 남은 기간에 이어붙이지 않고 그날로부터 다시 395일이다(§5.2-2).
export const calculateMemorialExpiresAt = (from: Date): Date => addDays(from, POLICY.memorial.activeDays);

// 동결 시각 + 3년 = 완전 파기 예정 시각(00-20 §5.2-1). 탈퇴 취소 때 purgeAt을 되돌리는 경로도 같은 값을 쓴다.
export const calculateMemorialPurgeAt = (frozenAt: Date): Date => {
  const d = new Date(frozenAt);
  d.setUTCFullYear(d.getUTCFullYear() + POLICY.retention.memorialPurgeAfterFreezeYears);
  return d;
};

// 재확인 통지 가능 시점 = purgeAt − 30일(00-20 §5.2-1). 이 시점 이후에 보낸 통지만 "재확인"으로 친다.
export const calculateMemorialReconfirmDate = (purgeAt: Date): Date =>
  addDays(purgeAt, -POLICY.retention.memorialReconfirmDaysBeforePurge);

// 동결 추모관(개설자가 닫지 않은 것)의 파기 관문 — 00-20 §5.2-1 "통지가 닿지 않으면 파기하지 않는다".
// 통과 조건: [purgeAt−30일, 이후] 안에 보낸 RECONFIRM 중 가장 최근 시도가 SENT이고, 그 시각이 지금−30일 이전이다
// (늦게 보냈으면 그날부터 30일을 기다린다 — 통지 직후 파기하지 않는다).
// 개설자가 직접 닫았거나 탈퇴로 닫힌 추모관(closedAt 있음)은 본인이 정한 파기라 이 관문을 쓰지 않는다 — 호출하는 쪽이 가른다.
export type NoticeAttempt = { kind: string; result: string; createdAt: Date };

export const getReconfirmGate = (
  purgeAt: Date,
  notices: NoticeAttempt[],
  now: Date,
): { passed: boolean; reason: string } => {
  const windowStart = calculateMemorialReconfirmDate(purgeAt).getTime();
  const inWindow = notices
    .filter((n) => n.kind === 'RECONFIRM' && n.createdAt.getTime() >= windowStart)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  if (inWindow.length === 0) return { passed: false, reason: '재확인 통지를 아직 안 보냄' };
  const latest = inWindow[0];
  if (latest.result !== 'SENT') return { passed: false, reason: '통지 실패 기록(마지막 재확인 시도가 실패)' };
  if (latest.createdAt.getTime() > now.getTime() - POLICY.retention.memorialReconfirmDaysBeforePurge * DAY_MS) {
    return { passed: false, reason: '재확인 통지 후 30일이 아직 안 지남' };
  }
  return { passed: true, reason: '' };
};

// 만료 통지일 = "만료 N일 전"이 아니라 "첫 기일 + 7일"(§5.2-2). deceasedDeathDate가 있으면
// 사망일+372일(=첫 기일+7일), 없으면 createdAt+368일(사망일을 개설일−3일로 본 값)을 기준으로 삼는다.
export const calculateMemorialNoticeDate = (
  memorial: { deceasedDeathDate: Date | null; createdAt: Date },
  expiresAt: Date,
): Date => {
  const { deceasedDeathDate, createdAt } = memorial;

  const anniversary = deceasedDeathDate ? addDays(deceasedDeathDate, 365) : addDays(createdAt, 362);
  let noticeDate = deceasedDeathDate ? addDays(deceasedDeathDate, 372) : addDays(createdAt, 368);

  // 가드 ① — 통지일이 기일 당일이거나 그 이전이면 "곧 기일인데 없어진다"는 압박이 된다.
  // 기일 + 7일로 미룬다(§4.2).
  if (noticeDate.getTime() <= anniversary.getTime()) {
    noticeDate = addDays(anniversary, 7);
  }

  // 가드 ② — 통지 후 연장할 시간이 14일이 안 되면 통지가 통지 구실을 못한다.
  // 만료 14일 전으로 당긴다.
  if (expiresAt.getTime() - noticeDate.getTime() < 14 * DAY_MS) {
    noticeDate = addDays(expiresAt, -14);
  }

  return noticeDate;
};
