// 06-04 §6.4-11-10-1 — 사진 인식·음성 변환 처리 결과 집계(조회 전용). 운영자가 기간별·결과별 건수와 평균 처리 시간을 본다.
// 🔴 읽기만 한다 — 아무것도 쓰지 않는다(백업·확인 불필요). 파일·인식 내용·이름·사용자는 애초에 기록에 없다.
//
// 사용법:
//   npm run report:heavy                  최근 30일, 종류·결과별
//   npm run report:heavy -- --days 7      최근 7일
//   npm run report:heavy -- --by day      하루(한국 날짜)씩 나누어
//   npm run report:heavy -- --target prod 운영 DB 조회(.env의 BACKUP_DATABASE_URL을 이 실행에서만 사용). 생략 = local
//   출력 첫 줄에 "대상: …"이 나온다(호스트·DB 이름만, 계정·비밀번호는 안 찍음). 절차 → .harness/db-safety.md §2-2
// 읽는 법: busy = 대기열 거절(503) · slow = 시간 초과(504) · error = 오류 · aborted = 화면 이탈.
//   음성 비동기 전환·대기 한도(2·10·30초)를 정할 근거 — "거절·시간 초과 비율"과 "음성 평균 처리 시간 ÷ 평균 음성 길이".

import 'dotenv/config';
import type { summarizeHeavyJobs as SummarizeFn } from '../src/services/heavyJobLogService';
import { kstYmd } from '../src/utils/kst';

const arg = (name: string): string | undefined => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};

// db-safety.md §2-2 — --target local(생략 시)|prod. prod는 BACKUP_DATABASE_URL을 이 실행에서만 DB 주소로 쓴다(.env 불변).
// prisma 클라이언트는 만들어질 때 DATABASE_URL을 읽으므로, 아래에서 정한 뒤에 동적으로 불러온다.
const LOCAL_HOST = /@(localhost|127\.0\.0\.1|host\.docker\.internal)/;

const resolveTarget = (): string => {
  const target = arg('target') ?? 'local';
  if (target !== 'local' && target !== 'prod') {
    console.error('--target은 local 또는 prod');
    process.exit(1);
  }
  if (target === 'prod') {
    const url = (process.env.BACKUP_DATABASE_URL ?? '').trim();
    if (!url) { console.error('BACKUP_DATABASE_URL 값이 없습니다(운영 Session pooler 주소) — 중단합니다.'); process.exit(1); }
    if (LOCAL_HOST.test(url)) { console.error('BACKUP_DATABASE_URL이 로컬 주소입니다 — 운영 주소가 아닙니다. 중단합니다.'); process.exit(1); }
    process.env.DATABASE_URL = url;
  }
  const url = process.env.DATABASE_URL ?? '';
  // 🔴 비밀번호·사용자명은 찍지 않는다 — 호스트와 DB 이름만.
  const m = url.match(/@([^/?]+)\/([^?]*)/);
  const where = m ? `${m[1]}/${m[2]}` : '(주소 읽기 실패)';
  return `대상: ${target === 'prod' ? '운영' : '로컬'} (${where})`;
};

const sec = (ms: number | null) => (ms === null ? '-' : (ms / 1000).toFixed(1) + '초');
const KIND = { photo: '사진 인식', audio: '음성 변환' } as const;
const RESULT = { success: '성공', busy: '대기 거절(503)', slow: '시간 초과(504)', error: '오류', aborted: '화면 이탈' } as const;

const printSummary = (summarize: typeof SummarizeFn, rows: Parameters<typeof SummarizeFn>[0], indent = '') => {
  const summary = summarize(rows);
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
  const targetLine = resolveTarget();
  // DATABASE_URL이 정해진 뒤에 불러온다(prisma 클라이언트가 만들어질 때 주소를 읽는다).
  const { loadHeavyJobRows, summarizeHeavyJobs } = await import('../src/services/heavyJobLogService');
  const prisma = (await import('../src/config/prisma')).default;
  prismaRef = prisma;
  console.log(targetLine);
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
      printSummary(summarizeHeavyJobs, byDay.get(day)!, '  ');
    }
  } else {
    console.log('');
    printSummary(summarizeHeavyJobs, rows);
  }
}

let prismaRef: { $disconnect: () => Promise<void> } | undefined;

main()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => prismaRef?.$disconnect());
