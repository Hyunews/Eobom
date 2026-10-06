import prisma from '../config/prisma';
import { POLICY } from '../config/policy';
import type { HeavyKind } from './heavyQueue';

// docs 06-04 §6.4-11-10-1 — 사진 인식·음성 변환 처리 결과 건별 기록(HeavyJobLog). heavyJob.ts의 runHeavyJob이 건마다 한 번 부른다.
// 🔴 파일·인식 텍스트·이름·사용자 ID는 받지도 넣지도 않는다 — 종류·결과·시간·음성 길이뿐이다.
// 🔴 기록 실패는 삼킨다(콘솔 한 줄) — 사용자 응답은 정상이어야 한다. 기다리지도 않는다(응답 뒤에 쓰이는 fire-and-forget).

export type HeavyJobResultCode = 'success' | 'busy' | 'slow' | 'error' | 'aborted';

export type HeavyJobRecord = {
  kind: HeavyKind;
  result: HeavyJobResultCode;
  waitMs: number;
  workMs: number | null;
  audioSec: number | null;
};

export const recordHeavyJob = (r: HeavyJobRecord): void => {
  prisma.heavyJobLog
    .create({ data: { kind: r.kind, result: r.result, waitMs: Math.max(0, Math.round(r.waitMs)), workMs: r.workMs === null ? null : Math.max(0, Math.round(r.workMs)), audioSec: r.audioSec === null ? null : Math.round(r.audioSec) } })
    .catch((e) => console.error('처리 결과 기록 실패(무시):', e instanceof Error ? e.message : e));
};

// ─ 조회(운영자 — `npm run report:heavy`) ─ 기간별·결과별 건수와 평균 처리 시간.
export type HeavyJobSummaryRow = {
  kind: HeavyKind;
  result: HeavyJobResultCode;
  count: number;
  avgWaitMs: number;
  avgWorkMs: number | null; // 처리 시간이 있는 건만의 평균
  maxWorkMs: number | null;
  avgAudioSec: number | null; // 음성만
};

type Row = { kind: string; result: string; waitMs: number; workMs: number | null; audioSec: number | null };

const avg = (xs: number[]): number | null => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

// 순수 집계 — 종류·결과별로 묶는다(시험이 DB 없이 돌린다).
export const summarizeHeavyJobs = (rows: Row[]): HeavyJobSummaryRow[] => {
  const groups = new Map<string, Row[]>();
  for (const r of rows) {
    const key = `${r.kind}|${r.result}`;
    (groups.get(key) ?? groups.set(key, []).get(key)!).push(r);
  }
  const resultOrder = ['success', 'busy', 'slow', 'error', 'aborted'];
  return [...groups.entries()]
    .map(([key, list]) => {
      const [kind, result] = key.split('|') as [HeavyKind, HeavyJobResultCode];
      const works = list.map((x) => x.workMs).filter((x): x is number => x !== null);
      const secs = list.map((x) => x.audioSec).filter((x): x is number => x !== null);
      return {
        kind,
        result,
        count: list.length,
        avgWaitMs: avg(list.map((x) => x.waitMs)) ?? 0,
        avgWorkMs: avg(works),
        maxWorkMs: works.length ? Math.max(...works) : null,
        avgAudioSec: avg(secs),
      };
    })
    .sort((a, b) => (a.kind === b.kind ? resultOrder.indexOf(a.result) - resultOrder.indexOf(b.result) : a.kind.localeCompare(b.kind)));
};

export const loadHeavyJobRows = (from: Date, to: Date) =>
  prisma.heavyJobLog.findMany({ where: { createdAt: { gte: from, lt: to } }, select: { kind: true, result: true, waitMs: true, workMs: true, audioSec: true, createdAt: true } });

// ─ 파기(1년, 06-04 §6.4-11-10-1) ─ prisma/destroy-farewell-media.ts(사람이 --confirm으로 돌리는 배치)만 부른다.
// 기록은 createdAt 하나뿐인 조건으로 지운다(소유자·주체 단위 조건이 없다 — db-safety.md §3: where가 넓지 않다). 보관기간은 policy.ts `retention`.
const cutoff = (now: Date): Date => {
  const d = new Date(now);
  d.setUTCFullYear(d.getUTCFullYear() - POLICY.retention.heavyJobLogYears);
  return d;
};

export const countHeavyJobLogExpired = (now = new Date()) => prisma.heavyJobLog.count({ where: { createdAt: { lt: cutoff(now) } } });
export const purgeHeavyJobLogExpired = async (now = new Date()): Promise<number> =>
  (await prisma.heavyJobLog.deleteMany({ where: { createdAt: { lt: cutoff(now) } } })).count;
