// 8단계 새 화면의 날짜·시각 표기 — 00-44 §6-3-11. 공용 utils/kstDate.ts는 옛 화면이 쓰므로 건드리지 않고 이 쪽에 둔다(10단계 교체 때 합친다).
// 한국 시간(Asia/Seoul) 기준 "10월 13일 15:20"(24시 · 쌍점). 입력이 잘못되면 빈 문자열.

const fmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Seoul',
  hourCycle: 'h23',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

export const formatRdMonthDayTime = (input: string | number | Date): string => {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return '';
  const p: Record<string, string> = {};
  for (const part of fmt.formatToParts(date)) p[part.type] = part.value;
  return `${Number(p.month)}월 ${Number(p.day)}일 ${p.hour}:${p.minute}`;
};
