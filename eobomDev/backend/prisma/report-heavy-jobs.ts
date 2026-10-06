// 06-04 §6.4-11-10-1 — 사진 인식·음성 변환 처리 결과 집계(조회 전용). 운영자가 기간별·결과별 건수와 평균 처리 시간을 본다.
// 🔴 읽기만 한다 — 아무것도 쓰지 않는다(백업·확인 불필요). 파일·인식 내용·이름·사용자는 애초에 기록에 없다.
//
// 사용법:
//   npm run report:heavy                  최근 30일, 종류·결과별
//   npm run report:heavy -- --days 7      최근 7일
//   npm run report:heavy -- --by day      하루(한국 날짜)씩 나누어
// 읽는 법: busy = 대기열 거절(503) · slow = 시간 초과(504) · error = 오류 · aborted = 화면 이탈.
//   음성 비동기 전환·대기 한도(2·10·30초)를 정할 근거 — "거절·시간 초과 비율"과 "음성 평균 처리 시간 ÷ 평균 음성 길이".

import prisma from '../src/config/prisma';
import { loadHeavyJobRows, summarizeHeavyJobs } from '../src/services/heavyJobLogService';
import { kstYmd } from '../src/utils/kst';

const arg = (name: string): string | undefined => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};

const sec = (ms: number | null) => (ms === null ? '-' : (ms / 1000).toFixed(1) + '초');
const KIND = { photo: '사진 인식', audio: '음성 변환' } as const;
const RESULT = { success: '성공', busy: '대기 거절(503)', slow: '시간 초과(504)', error: '오류', aborted: '화면 이탈' } as const;

const printSummary = (rows: Parameters<typeof summarizeHeavyJobs>[0], indent = '') => {
  const summary = summarizeHeavyJobs(rows);
  if (summary.length === 0) { console.log(`${indent}(기록 없음)`); return; }
  for (const kind of ['photo', 'audio'] as const) {
    const list = summary.filter((s) => s.kind === kind);
    if (!list.length) continue;
    const total = list.reduce((a, s) => a + s.count, 0);
    console.log(`${indent}[${KIND[kind]}] 총 ${total}건`);
    for (const s of list) {
      const pct = ((s.count / total) * 100).toFixed(1);
      console.log(
        `${indent}  ${RESULT[s.result].padEnd(10)} ${String(s.count).padStart(5)}건 (${pct}%)` +
          ` · 평균 대기 ${sec(s.avgWaitMs)} · 평균 처리 ${sec(s.avgWorkMs)} · 최대 처리 ${sec(s.maxWorkMs)}` +
          (kind === 'audio' && s.avgAudioSec !== null ? ` · 평균 음성 길이 ${s.avgAudioSec.toFixed(0)}초` : ''),
      );
    }
  }
};

async function main(): Promise<void> {
  const days = Number(arg('days') ?? 30);
  if (!Number.isFinite(days) || days <= 0) { console.error('--days는 1 이상의 숫자'); process.exit(1); }
  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  const rows = await loadHeavyJobRows(from, to);
  console.log(`=== 사진 인식·음성 변환 처리 결과 — 최근 ${days}일(${kstYmd(from)} ~ ${kstYmd(to)}) · 기록 ${rows.length}건 ===`);

  if (arg('by') === 'day') {
    const byDay = new Map<string, typeof rows>();
    for (const r of rows) {
      const key = kstYmd(r.createdAt);
      (byDay.get(key) ?? byDay.set(key, []).get(key)!).push(r);
    }
    for (const day of [...byDay.keys()].sort()) {
      console.log(`\n■ ${day}`);
      printSummary(byDay.get(day)!, '  ');
    }
  } else {
    console.log('');
    printSummary(rows);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
