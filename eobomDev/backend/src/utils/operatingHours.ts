// docs 00-41 §5.1 — 사후 개봉 확인의 "운영시간만 세는" 시계. 접수는 24시간 받지만 사람이 확인하는
// 시간은 평일 9~17시(KST)뿐이라, 6시간(처리 기준)·1시간(내부 목표)을 이 시간만 세어 더한다.
// 6시간은 내부 처리 기준이다 — 유족 화면에는 보이지 않고(00-41 §8.2) 운영자 대시보드 정렬·지연 색에만 쓴다.
// 🔵 나중에 바꿀 수 있게 값은 아래 상수 한 곳에 둔다(개발자 09-30 지시).

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const MIN_MS = 60 * 1000;

export const OPERATING_HOURS = {
  openHour: 9, // 09:00 KST
  closeHour: 17, // 17:00 KST
  // 0=일 … 6=토. 평일만.
  workdays: [1, 2, 3, 4, 5],
} as const;

// 처리 기준(dueAt)·내부 목표(targetAt) — 운영시간 기준 분(00-41 §5.1).
export const DUE_OPERATING_MINUTES = 6 * 60;
export const TARGET_OPERATING_MINUTES = 60;

// 🔴 공휴일은 코드에 두지 않는다(00-41 §5.1, 2026-10-02 개발자 변경②) — 평일이면 운영일로 센다.
// 공휴일에 걸린 건은 운영자 대시보드에서 노랑·빨강으로 보여도 정상이며, 공휴일 처리는 운영자가 판단한다.

// KST 벽시계 기준의 날짜 조각. Date의 UTC getter에 +9h를 얹어 읽는다(서버 로컬 타임존에 의존하지 않는다).
const kst = (d: Date) => new Date(d.getTime() + KST_OFFSET_MS);

const isOperatingDay = (k: Date): boolean => (OPERATING_HOURS.workdays as readonly number[]).includes(k.getUTCDay());

// KST 하루의 시작(00:00 KST)을 나타내는 Date.
const startOfKstDay = (d: Date): Date => {
  const k = kst(d);
  return new Date(Date.UTC(k.getUTCFullYear(), k.getUTCMonth(), k.getUTCDate()) - KST_OFFSET_MS);
};

const at = (dayStart: Date, hour: number): Date => new Date(dayStart.getTime() + hour * 60 * MIN_MS);

// `from` 이후(포함) 처음 오는 "운영 중인 순간". 운영시간 안이면 그대로, 밖이면 다음 운영일 openHour.
const nextOperatingInstant = (from: Date): Date => {
  let day = startOfKstDay(from);
  for (let i = 0; i < 400; i++) {
    if (isOperatingDay(kst(day))) {
      const open = at(day, OPERATING_HOURS.openHour);
      const close = at(day, OPERATING_HOURS.closeHour);
      if (from.getTime() < open.getTime()) return open;
      if (from.getTime() < close.getTime()) return from;
    }
    day = new Date(day.getTime() + DAY_MS);
  }
  throw new Error('운영일을 찾지 못했습니다(400일 초과) — OPERATING_HOURS.workdays를 확인하세요.');
};

// `from`부터 운영시간만 `minutes`분 센 시각. 접수가 운영시간 밖이면 다음 운영일 9시부터 센다.
// 예) 금 16:00 + 6h → 금 1h(16~17) + 월 5h = 월 14:00.
export const addOperatingMinutes = (from: Date, minutes: number): Date => {
  let cursor = nextOperatingInstant(from);
  let remaining = minutes;
  for (let i = 0; i < 400; i++) {
    const close = at(startOfKstDay(cursor), OPERATING_HOURS.closeHour);
    const available = Math.round((close.getTime() - cursor.getTime()) / MIN_MS);
    if (remaining <= available) return new Date(cursor.getTime() + remaining * MIN_MS);
    remaining -= available;
    cursor = nextOperatingInstant(close);
  }
  throw new Error('운영시간 계산이 끝나지 않았습니다.');
};

export const computeDeadlines = (requestedAt: Date): { dueAt: Date; targetAt: Date } => ({
  dueAt: addOperatingMinutes(requestedAt, DUE_OPERATING_MINUTES),
  targetAt: addOperatingMinutes(requestedAt, TARGET_OPERATING_MINUTES),
});
