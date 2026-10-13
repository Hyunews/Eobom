// 00 ↔ 도메인 중복 후보 찾기(docs 정리 6-B, 10-13) — 판정은 사람/Opus가 한다. 이 도구는 후보만 뽑는다.
// 사용: node .harness/tools/docs-overlap.js [--min 0.1] [--top 400]
// 방법: 절(제목~다음 제목) 단위로 본문을 정규화 → 글자 6-gram 집합 → 00 절 × (01~08·TS) 절 쌍마다
//       겹침률 = 공통 / 작은 쪽 크기. 여러 절에 흔히 나오는 조각(상투어·표 머리)은 뺀다.
// 결과: .harness/docs-audit/overlap.md (docs/ 수정 없음)
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const DOCS = path.join(ROOT, 'docs');
const OUT = path.join(ROOT, '.harness', 'docs-audit', 'overlap.md');
const EXCLUDE = ['작업일지_및_기록'];
const N = 6;            // 글자 n-gram
const MIN_CHARS = 150;  // 이보다 짧은 절은 비교 안 함
const COMMON = 12;      // 이 수보다 많은 절에 나오는 조각은 상투어로 보고 뺀다

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? Number(args[i + 1]) : d; };
const MIN = opt('--min', 0.1);
const TOP = opt('--top', 400);

function walk(dir) {
  let out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!EXCLUDE.includes(e.name)) out = out.concat(walk(p)); }
    else if (e.name.endsWith('.md')) out.push(p);
  }
  return out;
}
function domainOf(rel) {
  const top = rel.split(/[\\/]/)[0];
  if (top.endsWith('.md')) return 'IDX'; // 색인 파일 — 원래 남의 내용을 요약하므로 제외
  const m = /^(\d{2})_/.exec(top);
  return m ? m[1] : 'TS';
}
const idOf = (f) => (/^(\d{2}-\d{2}|TS-\d{3})/.exec(path.basename(f)) || [, path.basename(f, '.md')])[1];

// 절 나누기 — 코드 울타리 밖 제목 기준 · AUTO-GENERATED 구간과 `부록: 경위` 이후는 뺀다
function sections(file) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  const out = [];
  let cur = null, fence = false, gen = false, stop = false;
  lines.forEach((ln, i) => {
    if (stop) return;
    if (/<!--\s*AUTO-GENERATED:BEGIN/.test(ln)) { gen = true; return; }
    if (/<!--\s*AUTO-GENERATED:END/.test(ln)) { gen = false; return; }
    if (gen) return;
    if (/^\s*```/.test(ln)) { fence = !fence; if (cur) cur.body.push(ln); return; }
    const m = !fence && /^(#{1,6})\s+(.*)$/.exec(ln);
    if (m) {
      if (/^## 📎 부록: 경위/.test(ln)) { stop = true; return; }
      cur = { line: i + 1, title: m[2].trim(), body: [] };
      out.push(cur);
    } else if (cur) cur.body.push(ln);
  });
  return out;
}
// 정규화 — 마크다운 기호·링크 주소·공백·문장부호 제거(내용 글자만 남김)
function norm(s) {
  return s
    .replace(/\]\([^)]*\)/g, ']')
    .replace(/`[0-9]{2}-[0-9]{2}`|TS-\d{3}|§[\d\-.]+/g, '') // 상호 참조 표기는 내용이 아님
    .replace(/[^\p{L}\p{N}]/gu, '')
    .toLowerCase();
}
function shingles(t) {
  const s = new Set();
  for (let i = 0; i + N <= t.length; i++) s.add(t.slice(i, i + N));
  return s;
}

const secs = [];
for (const f of walk(DOCS)) {
  const rel = path.relative(DOCS, f);
  const dom = domainOf(rel);
  if (dom === 'IDX') continue;
  for (const s of sections(f)) {
    const t = norm(s.body.join('\n'));
    if (t.length < MIN_CHARS) continue;
    secs.push({ id: idOf(f), dom, line: s.line, title: s.title, len: t.length, sh: shingles(t), raw: s.body });
  }
}

// 조각 → 절 번호 역색인 · 흔한 조각 제거
const inv = new Map();
secs.forEach((s, k) => { for (const g of s.sh) { let a = inv.get(g); if (!a) inv.set(g, (a = [])); a.push(k); } });
const pairs = new Map();
for (const [, list] of inv) {
  if (list.length > COMMON) continue;
  const zs = list.filter((k) => secs[k].dom === '00');
  const ds = list.filter((k) => secs[k].dom !== '00');
  if (!zs.length || !ds.length) continue;
  for (const a of zs) for (const b of ds) { const key = a * 100000 + b; pairs.set(key, (pairs.get(key) || 0) + 1); }
}
const rows = [];
for (const [key, common] of pairs) {
  const a = secs[Math.floor(key / 100000)], b = secs[key % 100000];
  const ratio = common / Math.min(a.sh.size, b.sh.size);
  if (ratio >= MIN && common >= 40) rows.push({ a, b, common, ratio });
}
rows.sort((x, y) => y.common * y.ratio - x.common * x.ratio);

// 겹치는 원문 한 줄(사람이 바로 알아보게) — 00 쪽에서 상대 절과 가장 많이 겹치는 줄
function sample(a, b) {
  let best = '', score = 0;
  for (const ln of a.raw) {
    const t = norm(ln);
    if (t.length < 20) continue;
    let c = 0, n = 0;
    for (let i = 0; i + N <= t.length; i++) { n++; if (b.sh.has(t.slice(i, i + N))) c++; }
    const sc = c / n;
    if (sc > score) { score = sc; best = ln.trim(); }
  }
  return best.replace(/\|/g, '\\|').slice(0, 90);
}

// 00 문서 × 도메인 집계
const mat = new Map();
for (const r of rows) {
  const k = r.a.id; if (!mat.has(k)) mat.set(k, new Map());
  const m = mat.get(k); m.set(r.b.id, (m.get(r.b.id) || 0) + 1);
}

// 문서 쌍 주제 유사도 — 문서 전체 글자 3-gram TF-IDF 코사인 + 상호 참조 수(00→도메인 · 도메인→00)
// 글귀는 달라도 같은 주제를 두 곳에서 설명하는 경우(풀어 쓴 중복)를 잡기 위한 신호
const docs = new Map(); // id → { dom, tf: Map, text }
for (const f of walk(DOCS)) {
  const dom = domainOf(path.relative(DOCS, f));
  if (dom === 'IDX') continue;
  const body = sections(f).map((s) => s.title + '\n' + s.body.join('\n')).join('\n');
  const t = norm(body), tf = new Map();
  for (let i = 0; i + 3 <= t.length; i++) { const g = t.slice(i, i + 3); tf.set(g, (tf.get(g) || 0) + 1); }
  docs.set(idOf(f), { dom, tf, body, kb: Math.round(Buffer.byteLength(body) / 1024) });
}
const df = new Map();
for (const d of docs.values()) for (const g of d.tf.keys()) df.set(g, (df.get(g) || 0) + 1);
const D = docs.size;
for (const d of docs.values()) {
  let n = 0; d.v = new Map();
  for (const [g, c] of d.tf) { const w = (1 + Math.log(c)) * Math.log(D / df.get(g)); if (w > 0) { d.v.set(g, w); n += w * w; } }
  d.norm = Math.sqrt(n);
}
const cos = (a, b) => { let s = 0; const [x, y] = a.v.size < b.v.size ? [a, b] : [b, a]; for (const [g, w] of x.v) { const u = y.v.get(g); if (u) s += w * u; } return s / (a.norm * b.norm || 1); };
const cites = (from, to) => (from.match(new RegExp('`' + to.replace('-', '\\-') + '`', 'g')) || []).length;
const docPairs = [];
for (const [ia, a] of docs) if (a.dom === '00') for (const [ib, b] of docs) if (b.dom !== '00') {
  const c = cos(a, b);
  if (c >= 0.07) docPairs.push({ ia, ib, c, ab: cites(a.body, ib), ba: cites(b.body, ia), a, b });
}
docPairs.sort((x, y) => y.c - x.c);

const today = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
const L = [];
L.push('# 00 ↔ 도메인 중복 후보 (6-B · 자동 생성)', '');
L.push(`> \`node .harness/tools/docs-overlap.js\` · ${today} · 겹침률 ≥ ${MIN} · 공통 조각 ≥ 40 · 비교 절 ${secs.length}개(00 ${secs.filter((s) => s.dom === '00').length}) · 색인 2파일·경위 부록·자동 생성 구간 제외`);
L.push('> 🔴 **후보일 뿐이다** — 같은 사실을 양쪽이 인용하는 것(정상)과 본문이 통째로 겹치는 것(정리 대상)을 판정에서 가른다. 판정 기록 = 아래 표의 `판정` 칸을 Opus가 채운다.', '');
L.push(`## 0. 문서 쌍 주제 유사도 (코사인 ≥ 0.07 · ${docPairs.length}쌍)`, '', '> 글귀가 아니라 **주제**가 겹치는 정도. 상호 참조가 많은데 유사도도 높으면 "한쪽이 정본·다른 쪽이 요약"일 가능성이 크다.', '', '| # | 00 문서(KB) | 도메인 문서(KB) | 유사도 | 00→도메인 참조 | 도메인→00 참조 | 판정 |', '|---|---|---|---|---|---|---|');
docPairs.forEach((p, i) => L.push(`| ${i + 1} | \`${p.ia}\`(${p.a.kb}) | \`${p.ib}\`(${p.b.kb}) | ${p.c.toFixed(2)} | ${p.ab} | ${p.ba} | |`));
L.push('', `## 1. 00 문서별 집계 (후보 쌍 ${rows.length}개)`, '', '| 00 문서 | 쌍 수 | 겹치는 문서(쌍 수) |', '|---|---|---|');
[...mat.entries()].sort((x, y) => [...y[1].values()].reduce((p, q) => p + q) - [...x[1].values()].reduce((p, q) => p + q))
  .forEach(([k, m]) => L.push(`| \`${k}\` | ${[...m.values()].reduce((p, q) => p + q)} | ${[...m.entries()].sort((x, y) => y[1] - x[1]).map(([d, c]) => `\`${d}\`(${c})`).join(' ')} |`));
L.push('', `## 2. 후보 쌍 (상위 ${Math.min(TOP, rows.length)})`, '', '| # | 00 쪽 | 도메인 쪽 | 겹침률 | 공통 | 겹치는 줄(00 쪽) | 판정 |', '|---|---|---|---|---|---|---|');
const cell = (s) => `\`${s.id}\`:${s.line} ${s.title.replace(/\|/g, '\\|').slice(0, 40)}`;
rows.slice(0, TOP).forEach((r, i) => L.push(`| ${i + 1} | ${cell(r.a)} | ${cell(r.b)} | ${r.ratio.toFixed(2)} | ${r.common} | ${sample(r.a, r.b)} | |`));
fs.writeFileSync(OUT, L.join('\n') + '\n');
console.log(`✓ ${path.relative(ROOT, OUT)} — 비교 절 ${secs.length}개 · 후보 쌍 ${rows.length}개 · 00 문서 ${mat.size}개`);
