// 한국 시간(KST, Asia/Seoul) 기준 날짜·시각 표기 — 화면에 시간을 보여줄 때는 전부 여기를 거친다(10-01 개발자 결정).
// 🔴 `d.getMonth()`·`toLocaleString()`을 직접 쓰지 않는다 — 시간대를 안 정하면 보는 사람 기기 설정을 따라 값이 달라진다.
// 서버가 주는 값은 UTC 시각(ISO 문자열)이고, 여기서 한국 시간으로 바꿔 보여준다. 입력이 잘못되면 빈 문자열.

const TZ = 'Asia/Seoul';

const fmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: TZ,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

type Parts = { y: string; m: string; d: string; h: string; mi: string };

const partsOf = (input: string | number | Date): Parts | null => {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return null;
  const p: Record<string, string> = {};
  for (const part of fmt.formatToParts(date)) p[part.type] = part.value;
  return { y: p.year, m: p.month, d: p.day, h: p.hour, mi: p.minute };
};

/** "2026-10-01" (sep 기본 '-') — sep '.'이면 "2026.10.01" */
export const formatKstDate = (input: string | number | Date, sep: '-' | '.' = '-'): string => {
  const p = partsOf(input);
  return p ? `${p.y}${sep}${p.m}${sep}${p.d}` : '';
};

/** "2026. 09. 04." — 유족 메시지 카드 표기 */
export const formatKstDateSpaced = (input: string | number | Date): string => {
  const p = partsOf(input);
  return p ? `${p.y}. ${p.m}. ${p.d}.` : '';
};

/** "2026-10-01 13:30" */
export const formatKstDateTime = (input: string | number | Date): string => {
  const p = partsOf(input);
  return p ? `${p.y}-${p.m}-${p.d} ${p.h}:${p.mi}` : '';
};

/** "9월 30일 14시 5분" — 마감·접수 시각 */
export const formatKstMonthDayTime = (input: string | number | Date): string => {
  const p = partsOf(input);
  return p ? `${Number(p.m)}월 ${Number(p.d)}일 ${Number(p.h)}시 ${Number(p.mi)}분` : '';
};

/** 오늘(한국 날짜) "2026-10-01" */
export const kstToday = (sep: '-' | '.' = '-'): string => formatKstDate(new Date(), sep);

/** 오늘(한국 날짜) "20261001" — 파일명용 */
export const kstTodayCompact = (): string => formatKstDate(new Date(), '-').replace(/-/g, '');
