// 추모관 보존기간·만료 통지 계산(00-20 §5.2-2·§8.1-2 확정, 00-22 E-9). 값은 config/policy.ts가
// 정본 — 실제 발송/동결/파기 배치는 이번 범위 밖이며, 여기는 순수 계산 함수만 둔다.

import { POLICY } from '../config/policy';

const DAY_MS = 24 * 60 * 60 * 1000;
const addDays = (date: Date, days: number): Date => new Date(date.getTime() + days * DAY_MS);

// 활성 만료 시점 = 기준일 + activeDays(395일). 연장도 같은 함수를 "연장한 날"로 다시 호출한다
// — 남은 기간에 이어붙이지 않고 그날로부터 다시 395일이다(§5.2-2).
export const calculateMemorialExpiresAt = (from: Date): Date => addDays(from, POLICY.memorial.activeDays);

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
