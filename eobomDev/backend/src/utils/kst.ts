// 한국 시간(KST, UTC+9) 기준 날짜·시각 표기 — 사람이 읽거나 파일·번호에 박히는 시간은 전부 여기를 거친다(10-01 개발자 결정).
// 🔴 `d.getDate()`·`d.getMonth()`·`toISOString().slice(0, 10)`을 직접 쓰지 않는다 — 서버(Render)는 UTC로 돌아서
//    한국 시간 0~9시에 날짜가 하루 전으로 나온다. 한국은 서머타임이 없어 +9시간 고정이다.
// 순수 함수(DB·env를 건드리지 않는다). 시각 계산·비교·저장은 그대로 UTC 시각(Date)이고, 이 파일은 "글자로 바꿀 때"만 쓴다.

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const pad = (n: number, len = 2) => String(n).padStart(len, '0');

// Date를 한국 시각의 벽시계 값으로 옮겨 getUTC*로 읽는다.
const shifted = (d: Date): Date => new Date(d.getTime() + KST_OFFSET_MS);

/** "2026-10-01" */
export const kstYmd = (d: Date = new Date()): string => {
  const s = shifted(d);
  return `${s.getUTCFullYear()}-${pad(s.getUTCMonth() + 1)}-${pad(s.getUTCDate())}`;
};

/** "20261001" — 파일명용 */
export const kstYmdCompact = (d: Date = new Date()): string => kstYmd(d).replace(/-/g, '');

/** "261001" — 접수번호용(프로젝트 표준 YYMMDD) */
export const kstYymmdd = (d: Date = new Date()): string => kstYmdCompact(d).slice(2);

/** "2026-10-01T13:30:34.654+09:00" — 같은 순간을 한국 시간 표기로. new Date(...)로 다시 읽으면 같은 시각이다. */
export const kstIso = (d: Date = new Date()): string => {
  const s = shifted(d);
  const date = `${s.getUTCFullYear()}-${pad(s.getUTCMonth() + 1)}-${pad(s.getUTCDate())}`;
  const time = `${pad(s.getUTCHours())}:${pad(s.getUTCMinutes())}:${pad(s.getUTCSeconds())}.${pad(s.getUTCMilliseconds(), 3)}`;
  return `${date}T${time}+09:00`;
};
