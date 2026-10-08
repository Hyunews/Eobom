// 00-43 §10 — 접속기록 월간 점검(반자동). 8개 항목을 한 번에 조회하고 결과지(HTML)를 만든다.
// 🔴 읽기만 한다: 조회 전용 DB 계정(eobom_auditor)의 주소 OPS_AUDIT_DATABASE_URL 만 읽는다.
//    DATABASE_URL·DIRECT_URL·BACKUP_DATABASE_URL 로 폴백하지 않는다(없으면 실행 거부).
//    계정을 만드는 SQL 은 prisma/sql/create-auditor-role.sql — 이 스크립트는 만들지 않는다.
//
// 사용법:
//   npm run report:access-check                       지난달(한국 시간)
//   npm run report:access-check -- --month=2026-10    달 지정(점검이 늦어진 경우)
//   npm run report:access-check -- --out=<경로>       결과 파일 경로 지정(기본 ops-reports/접속기록점검_YYYY-MM.html)
// 🔴 결과지에는 IP·운영자 이름이 들어간다 — ops-reports/ 는 git 제외(.gitignore). 올리지 않는다.
//
// 조회 조건은 docs 00-43 §5 와 같다. §5 를 고치면 이 파일도 고친다(그 줄이 연결 고리).
// 다른 점: §5 는 now() 기준 "지난달"을 자동 계산하지만, 여기서는 대상 달의 시작·끝(한국 시간)을 인자로 넘긴다.

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

// ─────────────────────────────────────────────────────────────────────────────
// 기준값 — 🔴 한 곳. docs 00-22 부록 1-2 / 00-43 §5·§10.4 와 묶여 있다. 바꿀 때는 문서도 같이 고친다.
// ─────────────────────────────────────────────────────────────────────────────
export const LIMITS = {
  /** ③ 운영자 1명의 하루 열람·목록 조회 건수 — 초과(>)면 확인 필요. 00-22 부록 1-2 ③(초기값 50 · 첫 3개월 실측 뒤 조정) */
  dailyViewMax: 50,
  /** ⑥ 표별 가장 오래된 기록 일수 — 초과(>)면 파기 안 됨. 00-22 부록 1-2 ⑥ (접속기록 365 · 운영자 기록 730 · 오류 기록 90) */
  retentionDays: { AccessLog: 365, AdminAuditLog: 730, ErrorLog: 90 } as Record<string, number>,
  /** ⑧ 세 표 크기 합 — 초과(>)면 이상. 00-22 부록 1-2 ⑧ (300MB, pg_size_pretty 와 같은 1MB = 1024×1024바이트) */
  tableSizeMaxBytes: 300 * 1024 * 1024,
} as const;

export type Verdict = 'ok' | 'check' | 'issue';

export interface ItemResult {
  no: string;
  title: string;
  /** ok = 이상 없음 · check = 확인 필요(담당자가 본인 확인 등) · issue = 이상 있음 */
  verdict: Verdict;
  summary: string;
  /** 표로 보여줄 자료(없으면 생략). 값은 이미 글자로 바뀐 상태 */
  columns?: string[];
  rows?: string[][];
  note?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// 판정 함수 — DB 없이 시험한다(tests/access-check.test.ts)
// ─────────────────────────────────────────────────────────────────────────────

/** ①②③ — 0건 → 이상 없음 · 1건 이상 → 확인 필요 N건. 판정은 담당자 */
export const judgeCount = (n: number): { verdict: Verdict; summary: string } =>
  n === 0 ? { verdict: 'ok', summary: '이상 없음' } : { verdict: 'check', summary: `확인 필요 ${n}건` };

/** ④ — 대상 달 이전 기록이 0건이면 전부 "처음 보는 IP"로 나온다(첫 점검) */
export const judgeNewIp = (newIpRows: number, priorIpRecords: number): { verdict: Verdict; summary: string; note?: string } => {
  if (priorIpRecords === 0) {
    return {
      verdict: newIpRows === 0 ? 'ok' : 'check',
      summary: newIpRows === 0 ? '이상 없음' : `확인 필요 ${newIpRows}건`,
      note: '첫 점검 — 전부 표시됨(정상). 운영자마다 본인 접속 장소가 맞는지 확인받고 IP 목록을 메모에 남긴다.',
    };
  }
  return { ...judgeCount(newIpRows) };
};

/** ⑤ — 접속기록이 0건인 날 */
export const judgeGaps = (days: number): { verdict: Verdict; summary: string; note?: string } =>
  days === 0
    ? { verdict: 'ok', summary: '이상 없음' }
    : {
        verdict: 'check',
        summary: `확인 필요 ${days}일`,
        note: '공개 전에는 이용이 없는 날일 수 있다. 개발자가 "그날 서버 중단 여부"를 확인하는 칸.',
      };

/** ⑥ — days 가 null(표가 비어 있음)이면 이상 없음. 기준 이하(≤)면 이상 없음 */
export const judgeRetention = (
  tables: { t: string; days: number | null }[],
): { verdict: Verdict; summary: string; over: string[] } => {
  const over = tables
    .filter((r) => r.days !== null && LIMITS.retentionDays[r.t] !== undefined && r.days > LIMITS.retentionDays[r.t])
    .map((r) => r.t);
  return over.length === 0
    ? { verdict: 'ok', summary: '이상 없음', over }
    : { verdict: 'issue', summary: `이상 있음 — 파기 배치 실행 필요 (${over.join(' · ')})`, over };
};

/** ⑦ — 전화번호·이메일 모양 건수 */
export const judgeMasking = (n: number): { verdict: Verdict; summary: string } =>
  n === 0 ? { verdict: 'ok', summary: '이상 없음' } : { verdict: 'issue', summary: `이상 있음 ${n}건` };

/** ⑧ — 세 표 합계가 기준 이하(≤)면 이상 없음 */
export const judgeSize = (totalBytes: number): { verdict: Verdict; summary: string } => {
  const text = `합계 ${fmtBytes(totalBytes)}`;
  return totalBytes <= LIMITS.tableSizeMaxBytes
    ? { verdict: 'ok', summary: `이상 없음 (${text})` }
    : { verdict: 'issue', summary: `이상 있음 (${text} · 기준 ${fmtBytes(LIMITS.tableSizeMaxBytes)})` };
};

// ─────────────────────────────────────────────────────────────────────────────
// 날짜·글자 도우미
// ─────────────────────────────────────────────────────────────────────────────

const pad2 = (n: number) => String(n).padStart(2, '0');

export function fmtBytes(b: number): string {
  if (b >= 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)}MB`;
  if (b >= 1024) return `${(b / 1024).toFixed(0)}kB`;
  return `${b}B`;
}

/** createdAtKst 칸은 "한국 벽시계 값이 그대로 든 timestamp" — UTC 로 읽으면 한국 시각 글자가 된다 */
const fmtKstCol = (d: Date | null): string => (d ? d.toISOString().slice(0, 19).replace('T', ' ') : '-');
const fmtDay = (d: Date): string => d.toISOString().slice(0, 10);

/** "2026-10" → 대상 달의 시작·끝(한국 시간, 끝은 다음 달 1일 0시 — 미포함). 형식이 틀리면 null */
export function monthRange(ym: string): { ym: string; start: string; end: string; lastDay: string } | null {
  const m = /^(\d{4})-(\d{2})$/.exec(ym);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  if (mo < 1 || mo > 12) return null;
  const ny = mo === 12 ? y + 1 : y;
  const nm = mo === 12 ? 1 : mo + 1;
  const lastDate = new Date(Date.UTC(ny, nm - 1, 0)).getUTCDate();
  return {
    ym,
    start: `${y}-${pad2(mo)}-01 00:00:00`,
    end: `${ny}-${pad2(nm)}-01 00:00:00`,
    lastDay: `${y}-${pad2(mo)}-${pad2(lastDate)}`,
  };
}

/** 아직 끝나지 않은 달(이번 달·미래)이면 false — 끝나기 전에 점검하면 남은 날이 전부 "기록 끊김"으로 나온다 */
export function isMonthFinished(ym: string, now: Date = new Date()): boolean {
  const r = monthRange(ym);
  if (!r) return false;
  const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
  return r.end <= kstNow;
}

/** 날짜 목록을 한 줄에 perRow개씩 묶는다(결과지가 길어지지 않게) */
export function chunkDates(days: string[], perRow = 6): string[][] {
  const rows: string[][] = [];
  for (let i = 0; i < days.length; i += perRow) rows.push([days.slice(i, i + perRow).join(' · ')]);
  return rows;
}

/** 한국 시간 기준 "지난달" */
export function previousMonthKst(now: Date = new Date()): string {
  const k = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  let y = k.getUTCFullYear();
  let m = k.getUTCMonth(); // 0-based → 이번 달 - 1 = 지난달의 1-based 값
  if (m === 0) { y -= 1; m = 12; }
  return `${y}-${pad2(m)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 조회 — §5 ①~⑧ 과 같은 조건. 모두 SELECT. message 본문은 가져오지 않는다(⑦)
// ─────────────────────────────────────────────────────────────────────────────

type Tx = Pick<PrismaClient, '$queryRaw' | '$executeRawUnsafe'>;

const num = (v: unknown): number => Number(v);

export async function runChecks(tx: Tx, range: { start: string; end: string; lastDay: string }): Promise<ItemResult[]> {
  const { start, end } = range;
  const items: ItemResult[] = [];

  // ① 운영자 로그인 실패·잠금
  const r1 = await tx.$queryRaw<{ t: Date; name: string; action: string; ip: string | null }[]>`
    SELECT "createdAtKst" AS t, "adminName" AS name, action, ip FROM "AdminAuditLog"
    WHERE action IN ('LOGIN_FAIL','LOCKED')
      AND "createdAtKst" >= ${start}::timestamp AND "createdAtKst" < ${end}::timestamp
    ORDER BY 1`;
  items.push({
    no: '①', title: '운영자 로그인 실패 · 잠금', ...judgeCount(r1.length),
    columns: ['시각', '운영자', '행동', 'IP'],
    rows: r1.map((r) => [fmtKstCol(r.t), r.name, r.action, r.ip ?? '-']),
  });

  // ② 업무시간 밖(한국 22시~다음 날 7시)
  const r2 = await tx.$queryRaw<{ t: Date; name: string; action: string; tt: string; tid: string; ip: string | null }[]>`
    SELECT "createdAtKst" AS t, "adminName" AS name, action, "targetType" AS tt, "targetId" AS tid, ip FROM "AdminAuditLog"
    WHERE (EXTRACT(HOUR FROM "createdAtKst") >= 22 OR EXTRACT(HOUR FROM "createdAtKst") < 7)
      AND "createdAtKst" >= ${start}::timestamp AND "createdAtKst" < ${end}::timestamp
    ORDER BY 1`;
  items.push({
    no: '②', title: '업무시간 밖 활동 (한국 시간 22시~7시)', ...judgeCount(r2.length),
    columns: ['시각', '운영자', '행동', '대상', 'IP'],
    rows: r2.map((r) => [fmtKstCol(r.t), r.name, r.action, `${r.tt} ${r.tid}`, r.ip ?? '-']),
  });

  // ③ 하루 열람·목록 조회 건수 초과
  const r3 = await tx.$queryRaw<{ name: string; day: Date; n: bigint }[]>`
    SELECT "adminName" AS name, "createdAtKst"::date AS day, count(*) AS n FROM "AdminAuditLog"
    WHERE action IN ('VIEW','LIST')
      AND "createdAtKst" >= ${start}::timestamp AND "createdAtKst" < ${end}::timestamp
    GROUP BY 1, 2 HAVING count(*) > ${LIMITS.dailyViewMax} ORDER BY 3 DESC`;
  items.push({
    no: '③', title: `하루 ${LIMITS.dailyViewMax}건 초과 열람`, ...judgeCount(r3.length),
    columns: ['운영자', '날짜', '건수'],
    rows: r3.map((r) => [r.name, fmtDay(r.day), String(num(r.n))]),
  });

  // ④ 처음 보는 IP
  const r4 = await tx.$queryRaw<{ ip: string; name: string; first: Date; n: bigint }[]>`
    SELECT ip, "adminName" AS name, min("createdAtKst") AS first, count(*) AS n FROM "AdminAuditLog"
    WHERE ip IS NOT NULL
      AND "createdAtKst" >= ${start}::timestamp AND "createdAtKst" < ${end}::timestamp
      AND ip NOT IN (SELECT ip FROM "AdminAuditLog" WHERE ip IS NOT NULL AND "createdAtKst" < ${start}::timestamp)
    GROUP BY 1, 2 ORDER BY 3`;
  const prior = await tx.$queryRaw<{ n: bigint }[]>`
    SELECT count(*) AS n FROM "AdminAuditLog" WHERE ip IS NOT NULL AND "createdAtKst" < ${start}::timestamp`;
  const j4 = judgeNewIp(r4.length, num(prior[0]?.n ?? 0));
  items.push({
    no: '④', title: '처음 보는 장소(IP)에서의 접속', ...j4,
    columns: ['IP', '운영자', '처음 나타난 시각', '건수'],
    rows: r4.map((r) => [r.ip, r.name, fmtKstCol(r.first), String(num(r.n))]),
  });

  // ⑤ 기록이 끊긴 날
  const r5 = await tx.$queryRaw<{ day: Date }[]>`
    SELECT d::date AS day FROM generate_series(
      ${start}::timestamp, ${end}::timestamp - interval '1 day', interval '1 day') d
    WHERE NOT EXISTS (SELECT 1 FROM "AccessLog" a WHERE a."createdAtKst"::date = d::date)`;
  items.push({
    no: '⑤', title: '기록이 끊긴 날 (접속기록 0건)', ...judgeGaps(r5.length),
    columns: ['날짜'],
    rows: chunkDates(r5.map((r) => fmtDay(r.day))),
  });

  // ⑥ 오래된 기록이 제때 지워지는지 — 대상 달과 무관하게 지금 기준(수기 §5 ⑥ 과 같다)
  const r6 = await tx.$queryRaw<{ t: string; days: number | null }[]>`
    SELECT 'AccessLog' AS t, (now()::date - min("createdAt")::date)::int AS days FROM "AccessLog"
    UNION ALL SELECT 'AdminAuditLog', (now()::date - min("createdAt")::date)::int FROM "AdminAuditLog"
    UNION ALL SELECT 'ErrorLog', (now()::date - min("createdAt")::date)::int FROM "ErrorLog"`;
  const j6 = judgeRetention(r6);
  items.push({
    no: '⑥', title: '오래된 기록 파기 (표별 가장 오래된 기록)', verdict: j6.verdict, summary: j6.summary,
    columns: ['표', '가장 오래된 기록(일 전)', '기준(이하면 정상)'],
    rows: r6.map((r) => [r.t, r.days === null ? '(기록 없음)' : String(r.days), String(LIMITS.retentionDays[r.t] ?? '-')]),
    note: '이 항목은 대상 달이 아니라 실행한 날 기준이다.',
  });

  // ⑦ 오류 기록 속 개인정보 모양 — 🔴 message 는 조회하지 않는다(건수와 시각·오류 종류만)
  const r7 = await tx.$queryRaw<{ t: Date; name: string }[]>`
    SELECT "createdAtKst" AS t, "errorName" AS name FROM "ErrorLog"
    WHERE (message ~ '01[0-9]-?[0-9]{3,4}-?[0-9]{4}'
           OR message ~ '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}')
      AND "createdAtKst" >= ${start}::timestamp AND "createdAtKst" < ${end}::timestamp
    ORDER BY 1`;
  items.push({
    no: '⑦', title: '오류 기록에 개인정보(전화·이메일 모양)', ...judgeMasking(r7.length),
    columns: ['시각', '오류 종류'],
    rows: r7.map((r) => [fmtKstCol(r.t), r.name]),
    note: r7.length ? '내용은 싣지 않는다. 개발자에게 시각만 전한다. 그 기록을 직접 지우지 않는다.' : undefined,
  });

  // ⑧ 기록 표 크기
  const r8 = await tx.$queryRaw<{ name: string; bytes: bigint; live: bigint }[]>`
    SELECT relname AS name, pg_total_relation_size(relid)::bigint AS bytes, n_live_tup::bigint AS live
    FROM pg_stat_user_tables WHERE relname IN ('AccessLog','ErrorLog','AdminAuditLog') ORDER BY relname`;
  const total = r8.reduce((a, r) => a + num(r.bytes), 0);
  items.push({
    no: '⑧', title: '기록 표 크기', ...judgeSize(total),
    columns: ['표', '크기', '행 수(추정)'],
    rows: r8.map((r) => [r.name, fmtBytes(num(r.bytes)), String(num(r.live))]),
    note: r8.length < 3 ? `표 ${r8.length}개만 조회됨 — 조회 권한 확인 필요` : undefined,
  });

  return items;
}

// ─────────────────────────────────────────────────────────────────────────────
// 결과지(HTML) — 외부 글꼴·스크립트 없음. 인쇄 A4 1~2쪽
// ─────────────────────────────────────────────────────────────────────────────

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const VERDICT_TEXT: Record<Verdict, string> = { ok: '이상 없음', check: '확인 필요', issue: '이상 있음' };

export function renderHtml(range: { ym: string; start: string; lastDay: string }, items: ItemResult[], generatedAt: string): string {
  const period = `${range.start.slice(0, 10)} ~ ${range.lastDay}`;

  const summaryRows = items
    .map(
      (it) => `<tr class="v-${it.verdict}"><td class="c">${it.no}</td><td>${esc(it.title)}</td><td>${esc(it.summary)}</td>` +
        `<td class="judge">□ 이상 없음 &nbsp;□ 이상 있음</td></tr>`,
    )
    .join('\n');

  const detail = items
    .filter((it) => (it.rows && it.rows.length > 0) || it.note)
    .map((it) => {
      const table = it.rows && it.rows.length
        ? `<table class="data"><thead><tr>${it.columns!.map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>` +
          it.rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('') +
          `</tbody></table>`
        : '';
      const note = it.note ? `<p class="note">${esc(it.note)}</p>` : '';
      const confirm = it.no >= '①' && it.no <= '④' && it.rows?.length
        ? `<p class="note">확인 방법: 해당 운영자 본인에게 그 시각·장소의 접속이 맞는지 묻고, 위 판정 칸에 적는다.</p>`
        : '';
      return `<section><h3>${it.no} ${esc(it.title)} — ${esc(it.summary)}</h3>${table}${note}${confirm}</section>`;
    })
    .join('\n');

  const checklist = [
    '점검 기록에 점검일 · 점검자 · 대상 기간을 적었다',
    '①~④ 확인 대상을 운영자 본인에게 확인하고 판정 칸에 적었다',
    '⑤~⑧ 자동 결과를 읽었고, 이상 있음 · 확인 필요는 개발자에게 전했다',
    '이상이 있으면 조치(사유 확인 · 계정 정지 · 유출 여부 판단)를 시작하고 아래 메모에 적었다',
    '서명 후 이 결과지를 2년 보관한다 (저장소(git)에 올리지 않는다)',
  ]
    .map((t) => `<li>□ ${esc(t)}</li>`)
    .join('\n');

  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>접속기록 월간 점검 결과지 ${esc(range.ym)}</title>
<style>
  @page { size: A4; margin: 14mm; }
  body { font-family: "Malgun Gothic", "Apple SD Gothic Neo", sans-serif; font-size: 11px; color: #111; margin: 0 auto; max-width: 190mm; padding: 8px; line-height: 1.5; }
  h1 { font-size: 17px; margin: 0 0 4px; }
  h2 { font-size: 13px; margin: 16px 0 6px; border-bottom: 1px solid #333; padding-bottom: 2px; }
  h3 { font-size: 11.5px; margin: 10px 0 4px; }
  .meta { margin: 0 0 4px; }
  .warn { margin: 4px 0 8px; padding: 4px 8px; border: 1px solid #333; font-weight: bold; }
  table { border-collapse: collapse; width: 100%; margin: 4px 0; }
  th, td { border: 1px solid #555; padding: 3px 5px; text-align: left; vertical-align: top; }
  th { background: #eee; }
  td.c { text-align: center; width: 24px; }
  td.judge { white-space: nowrap; width: 150px; }
  .v-check td:nth-child(3), .v-issue td:nth-child(3) { font-weight: bold; }
  .note { margin: 2px 0 6px; color: #333; }
  ul.check { list-style: none; padding: 0; margin: 4px 0; }
  ul.check li { margin: 2px 0; }
  .memo { border: 1px solid #555; height: 90px; }
  table.sign td { height: 30px; }
  section, tr { break-inside: avoid; }
</style>
</head>
<body>
<h1>접속기록 월간 점검 결과지</h1>
<p class="meta">대상 기간(한국 시간): <b>${esc(period)}</b> &nbsp;·&nbsp; 생성: ${esc(generatedAt)}</p>
<p class="warn">자동 판정은 참고용입니다. 최종 판정 · 서명은 개인정보 담당자가 합니다.</p>

<h2>1. 항목별 결과</h2>
<table>
<thead><tr><th class="c">#</th><th>항목</th><th>자동 결과</th><th>담당자 판정</th></tr></thead>
<tbody>
${summaryRows}
</tbody>
</table>

<h2>2. 확인 대상 · 상세</h2>
${detail || '<p>표시할 목록이 없습니다.</p>'}

<h2>3. 점검 체크리스트 (표 10)</h2>
<ul class="check">
${checklist}
</ul>

<h2>4. 특이사항 메모 (표 11)</h2>
<div class="memo"></div>

<h2>5. 확인</h2>
<table class="sign">
<tbody>
<tr><th style="width:90px">점검일</th><td></td><th style="width:90px">대상 기간</th><td>${esc(period)}</td></tr>
<tr><th>점검자</th><td></td><th>서명</th><td></td></tr>
</tbody>
</table>
</body>
</html>
`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 실행
// ─────────────────────────────────────────────────────────────────────────────

const argEq = (name: string): string | undefined => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : undefined;
};

const fail = (msg: string): never => {
  console.error(msg);
  process.exit(1);
};

async function main(): Promise<void> {
  // 🔴 OPS_AUDIT_DATABASE_URL 만. 없으면 다른 주소로 폴백하지 않고 거부한다.
  const url = (process.env.OPS_AUDIT_DATABASE_URL ?? '').trim();
  if (!url) {
    return fail('OPS_AUDIT_DATABASE_URL 값이 없습니다 — 중단합니다.\n점검 전용 계정(eobom_auditor)의 주소만 쓸 수 있고, DATABASE_URL 등 다른 주소로 대신하지 않습니다.');
  }

  const ym = argEq('month') ?? previousMonthKst();
  const range = monthRange(ym);
  if (!range) return fail('--month 는 YYYY-MM 형식 (예: --month=2026-10)');
  if (!isMonthFinished(range.ym)) {
    return fail(`${range.ym} 은(는) 아직 끝나지 않은 달입니다 — 끝난 달만 점검할 수 있습니다(지난달 ${previousMonthKst()}).`);
  }

  // 🔴 비밀번호·계정은 찍지 않는다 — 호스트와 DB 이름만.
  const m = url.match(/@([^/?]+)\/([^?]*)/);
  console.log(`대상: ${m ? `${m[1]}/${m[2]}` : '(주소 읽기 실패)'} · 점검 달: ${range.ym}`);

  const prisma = new PrismaClient({ datasources: { db: { url } }, log: [] });
  try {
    const items = await prisma.$transaction(
      async (tx) => {
        // ① 조회 전용 트랜잭션 — 첫 문장이어야 한다(BEGIN READ ONLY 와 같다)
        await tx.$executeRawUnsafe('SET TRANSACTION READ ONLY');
        const ro = await tx.$queryRaw<{ v: string }[]>`SELECT current_setting('transaction_read_only') AS v`;
        if (ro[0]?.v !== 'on') throw new Error('조회 전용 트랜잭션을 열지 못했습니다');

        // ② 관리자 계정이면 거부 — "User" 표를 읽을 수 있으면 점검 전용 계정이 아니다
        const priv = await tx.$queryRaw<{ who: string; can: boolean }[]>`
          SELECT current_user::text AS who, has_table_privilege(current_user, '"User"', 'SELECT') AS can`;
        if (priv[0]?.can) {
          throw new RefuseError('점검 전용 계정이 아닙니다 — "User" 표를 읽을 수 있는 계정입니다. OPS_AUDIT_DATABASE_URL 을 eobom_auditor 주소로 바꾸세요.');
        }
        console.log(`접속 계정: ${priv[0]?.who} (조회 전용 확인됨)`);

        return runChecks(tx, range);
      },
      { timeout: 120_000, maxWait: 15_000 },
    );

    const outPath = path.resolve(argEq('out') ?? path.join(__dirname, '..', 'ops-reports', `접속기록점검_${range.ym}.html`));
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    const generatedAt = `${new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 16).replace('T', ' ')} (한국 시간)`;
    fs.writeFileSync(outPath, renderHtml(range, items, generatedAt), 'utf8');

    for (const it of items) console.log(`${it.no} ${it.title.padEnd(34)} ${VERDICT_TEXT[it.verdict]} — ${it.summary}`);
    console.log(`\n결과지: ${outPath}\n🔴 IP·운영자 이름이 들어 있다 — git에 올리지 않는다(ops-reports/ 는 제외됨).`);
  } catch (e) {
    if (e instanceof RefuseError) return fail(e.message);
    // 쿼리 오류 메시지에는 값이 섞일 수 있어 종류만 찍는다
    console.error('점검 실패:', e instanceof Error ? e.message.split('\n').slice(-3).join(' ').slice(0, 300) : String(e));
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

class RefuseError extends Error {}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
