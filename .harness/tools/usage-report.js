#!/usr/bin/env node
/* 크레딧 실측 — transcript(.jsonl)의 usage 필드를 날짜별로 합산한다.
 *   node .harness/tools/usage-report.js          최근 10일
 *   node .harness/tools/usage-report.js 30       최근 30일
 *   node .harness/tools/usage-report.js 30 sess  세션별 상위도 함께
 *
 * 🔴 avgCtx(호출당 평균 컨텍스트)가 이 표의 핵심이다. 비용 = avgCtx x 메시지수 x 단가.
 *    150K 넘으면 그 세션은 이미 비싸다 — 통독한 파일이 있는지 본다.
 * 단가는 공개 정가(달러/MTok) 기준 추정치다. 청구서와 정확히 같지 않다(구독제·할인 미반영).
 * 경위·기준 -> _meta/크레딧_소모_실측_260902.md
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

const DIR = path.join(os.homedir(), '.claude', 'projects', 'C--Users-kilak-Desktop-Eobom');
const PRICE = {
  opus:   { in: 15, out: 75, cw: 18.75, cr: 1.5 },
  sonnet: { in: 3,  out: 15, cw: 3.75,  cr: 0.3 },
  haiku:  { in: 1,  out: 5,  cw: 1.25,  cr: 0.1 },
};
const DAYS = parseInt(process.argv[2], 10) || 10;
const WANT_SESS = process.argv[3] === 'sess';

function family(m) {
  if (!m) return null;
  if (/opus/.test(m)) return 'opus';
  if (/sonnet/.test(m)) return 'sonnet';
  if (/haiku/.test(m)) return 'haiku';
  return null;
}

if (!fs.existsSync(DIR)) { console.error('transcript 디렉토리 없음: ' + DIR); process.exit(1); }

const byDay = {}, bySess = {};
for (const f of fs.readdirSync(DIR).filter(x => x.endsWith('.jsonl'))) {
  let lines;
  try { lines = fs.readFileSync(path.join(DIR, f), 'utf8').split('\n'); } catch (e) { continue; }
  for (const L of lines) {
    if (!L.trim()) continue;
    let j; try { j = JSON.parse(L); } catch (e) { continue; }
    const u = j.message && j.message.usage;
    if (!u) continue;
    const fam = family(j.message.model);
    if (!fam) continue;
    const p = PRICE[fam];
    const day = (j.timestamp || '').slice(0, 10);
    if (!day) continue;
    const cr = u.cache_read_input_tokens || 0, cw = u.cache_creation_input_tokens || 0;
    const it = u.input_tokens || 0, ot = u.output_tokens || 0;
    const cost = it / 1e6 * p.in + ot / 1e6 * p.out + cw / 1e6 * p.cw + cr / 1e6 * p.cr;
    const d = byDay[day] || (byDay[day] = { c: 0, cr: 0, cw: 0, out: 0, n: 0, crC: 0, cwC: 0, outC: 0 });
    d.c += cost; d.cr += cr; d.cw += cw; d.out += ot; d.n++;
    d.crC += cr / 1e6 * p.cr; d.cwC += cw / 1e6 * p.cw; d.outC += ot / 1e6 * p.out;
    const sid = f.replace('.jsonl', '');
    const s = bySess[sid] || (bySess[sid] = { c: 0, n: 0, cr: 0, day: day, m: {} });
    s.c += cost; s.n++; s.cr += cr; s.m[fam] = 1;
    if (day > s.day) s.day = day;
  }
}

const days = Object.keys(byDay).sort().slice(-DAYS);
console.log('날짜        메시지  avgCtx(K)  $캐시읽기  $캐시쓰기  $출력   $합계');
let T = 0, Tcr = 0, Tcw = 0, Tout = 0;
for (const k of days) {
  const d = byDay[k];
  T += d.c; Tcr += d.crC; Tcw += d.cwC; Tout += d.outC;
  const ctx = d.cr / d.n / 1e3;
  const flag = ctx > 150 ? ' \u{1F534}' : ctx > 100 ? ' \u{1F7E1}' : '';
  console.log(k + String(d.n).padStart(8) + ctx.toFixed(0).padStart(11) +
    ('$' + d.crC.toFixed(0)).padStart(11) + ('$' + d.cwC.toFixed(0)).padStart(11) +
    ('$' + d.outC.toFixed(0)).padStart(8) + ('$' + d.c.toFixed(0)).padStart(8) + flag);
}
console.log('-'.repeat(66));
const pct = x => (x / T * 100).toFixed(0) + '%';
console.log('합계 $' + T.toFixed(0) + '  (' + days.length + '일, 하루평균 $' + (T / days.length).toFixed(0) + ')');
console.log('  캐시읽기 $' + Tcr.toFixed(0) + ' ' + pct(Tcr) +
            '  캐시쓰기 $' + Tcw.toFixed(0) + ' ' + pct(Tcw) +
            '  출력 $' + Tout.toFixed(0) + ' ' + pct(Tout));
console.log('\u{1F535} 캐시읽기 비중이 60%를 넘으면 만들어낸 것보다 들고 다닌 값이 크다는 뜻이다.');

if (WANT_SESS) {
  console.log('\n세션 상위 10 (최근 ' + DAYS + '일)');
  console.log('마지막날짜  세션      메시지  avgCtx(K)  모델           $');
  const cut = days[0] || '';
  Object.entries(bySess).filter(([, v]) => v.day >= cut)
    .sort((a, b) => b[1].c - a[1].c).slice(0, 10)
    .forEach(([sid, v]) => console.log(
      v.day + '  ' + sid.slice(0, 8) + String(v.n).padStart(8) +
      (v.cr / v.n / 1e3).toFixed(0).padStart(11) + '  ' +
      Object.keys(v.m).join('+').padEnd(14) + '$' + v.c.toFixed(0)));
}
