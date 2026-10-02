// docs 00-41 §5.1 — 사후 개봉 확인의 "운영시간만 세는" 시계. 접수는 24시간 받지만 사람이 확인하는
// 시간은 평일 9~17시(KST)뿐이라, 6시간(대외 약속)·1시간(내부 목표)을 이 시간만 세어 더한다.
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

// 대외 약속·내부 목표 — 운영시간 기준 분(00-41 §5.1).
export const DUE_OPERATING_MINUTES = 6 * 60;
export const TARGET_OPERATING_MINUTES = 60;

// 공휴일(대체공휴일 포함, 평일에 걸린 날만). 'YYYY-MM-DD' KST. 근로자의 날(5/1)은 법정 공휴일이 아니라 운영일이다.
// 🔴 연 1회 갱신한다(00-41 §5.1). 목록에 없는 해는 공휴일이 없는 것으로 계산되므로
// `HOLIDAYS_COVERED_THROUGH` 이후 접수분은 dueAt이 실제보다 짧게 잡힐 수 있다 — 매년 말 다음 해를 채울 것.
export const HOLIDAYS_COVERED_THROUGH = 2026;
export const HOLIDAYS: ReadonlySet<string> = new Set([
  // 2026
  '2026-01-01', // 신정
  '2026-02-16', '2026-02-17', '2026-02-18', // 설날 연휴
  '2026-03-02', // 삼일절(일) 대체
  '2026-05-05', // 어린이날
  '2026-05-25', // 부처님오신날(일) 대체
  '2026-06-03', // 제9회 전국동시지방선거
  '2026-08-17', // 광복절(토) 대체
  '2026-09-24', '2026-09-25', // 추석 연휴(26일은 토)
  '2026-10-05', // 개천절(토) 대체
  '2026-10-09', // 한글날
  '2026-12-25', // 성탄절
]);

// KST 벽시계 기준의 날짜 조각. Date의 UTC getter에 +9h를 얹어 읽는다(서버 로컬 타임존에 의존하지 않는다).
const kst = (d: Date) => new Date(d.getTime() + KST_OFFSET_MS);
const ymd = (k: Date): string => k.toISOString().slice(0, 10);

const isOperatingDay = (k: Date): boolean =>
  (OPERATING_HOURS.workdays as readonly number[]).includes(k.getUTCDay()) && !HOLIDAYS.has(ymd(k));

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
  throw new Error('운영일을 찾지 못했습니다(400일 초과) — HOLIDAYS 목록을 확인하세요.');
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
