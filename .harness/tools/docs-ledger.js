// docs 전수 대장 생성·점검기 — .harness/docs-audit/README.md 절차 0단계
//
// 사용법
//   node .harness/tools/docs-ledger.js build   → docs/의 모든 md 파일·모든 절(제목)을 도메인별 대장으로 만든다
//                                               이미 적은 판정은 보존한다(파일+제목이 같으면 이어 붙임)
//   node .harness/tools/docs-ledger.js check   → 도메인별 판정 채움률. 빈 칸이 있으면 목록을 보여 준다
//   node .harness/tools/docs-ledger.js check 03 → 한 도메인만
//
// 제외: docs/작업일지_및_기록/ (작업 기록 — 기획 정본 아님, 사람 결정 2026-09-29)
// 대장 파일: .harness/docs-audit/ledger_<도메인>.md  (표 한 줄 = 절 하나)
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const DOCS = path.join(ROOT, 'docs');
const OUT = path.join(ROOT, '.harness', 'docs-audit');
const EXCLUDE = ['작업일지_및_기록'];
const VERDICTS = ['유지', '갱신', '통합', '경위', '폐기', '색인', '묶음']; // 묶음 = build가 자동으로만 채움(본문 없는 절)

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
  if (top.endsWith('.md')) return '00'; // docs 바로 아래 색인 파일
  const m = /^(\d{2})_/.exec(top);
  return m ? m[1] : 'TS';
}

function headings(file) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  const out = [];
  let fence = false;
  lines.forEach((ln, i) => {
    if (/^\s*```/.test(ln)) { fence = !fence; return; }
    if (fence) return;
    const m = /^(#{1,6})\s+(.*)$/.exec(ln);
    if (m) out.push({ line: i + 1, level: m[1].length, title: m[2].replace(/\|/g, '\\|').trim() });
  });
  if (!out.length) out.push({ line: 1, level: 0, title: '(제목 없음 — 파일 전체)' });
  // 묶음 = 제목 바로 아래가 다음 제목까지 빈 줄·구분선뿐인 절(하위 절을 묶기만 함) — 판정할 본문이 없다
  out.forEach((h, j) => {
    const end = j + 1 < out.length ? out[j + 1].line - 1 : lines.length;
    h.container = h.level > 0 && lines.slice(h.line, end).every((l) => /^\s*(-{3,})?\s*$/.test(l));
  });
  return out;
}

const esc = (s) => s.replace(/\|/g, '\\|');
const key = (file, title) => file + '::' + title;

function parseLedger(p) {
  const kept = new Map();
  if (!fs.existsSync(p)) return kept;
  for (const ln of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    if (!ln.startsWith('| `')) continue;
    const cells = ln.split(/(?<!\\)\|/).slice(1, -1).map((c) => c.trim());
    // | 파일 | 줄 | 절 | 판정 | 근거 | 메모 |
    const file = cells[0].replace(/`/g, '');
    // 들여쓰기(&nbsp;)를 먼저 벗기고 #을 벗긴다 — 순서가 반대면 ##·### 절의 판정이 build 때 사라진다(09-29 실제 발생)
    const title = cells[2].replace(/^\s*(&nbsp;)*/, '').replace(/^(#+\s*|·\s*)/, '').trim();
    kept.set(key(file, title), { verdict: cells[3] || '', basis: cells[4] || '', memo: cells[5] || '' });
  }
  return kept;
}

function build() {
  fs.mkdirSync(OUT, { recursive: true });
  const byDomain = {};
  for (const f of walk(DOCS).sort()) {
    const rel = path.relative(DOCS, f).replace(/\\/g, '/');
    (byDomain[domainOf(rel)] = byDomain[domainOf(rel)] || []).push({ rel, heads: headings(f), size: fs.statSync(f).size });
  }
  const summary = [];
  for (const [dom, files] of Object.entries(byDomain).sort()) {
    const p = path.join(OUT, `ledger_${dom}.md`);
    const kept = parseLedger(p);
    let rows = 0, filled = 0;
    const body = [];
    body.push(`# 대장 ${dom} — docs 전수 판정`);
    body.push('');
    body.push('> 🔴 이 파일은 `node .harness/tools/docs-ledger.js build`가 만든다. **판정·근거·메모 칸만** 손으로 채운다(다시 build해도 보존됨).');
    body.push(`> 판정 값: ${VERDICTS.map((v) => '`' + v + '`').join(' · ')} — 정의는 \`README.md\` §2.`);
    body.push('');
    for (const { rel, heads, size } of files) {
      body.push(`## \`${rel}\` (${Math.round(size / 1024)}KB · 절 ${heads.length})`);
      body.push('');
      body.push('| 파일 | 줄 | 절 | 판정 | 근거 | 메모 |');
      body.push('|---|---:|---|---|---|---|');
      for (const h of heads) {
        const k = kept.get(key(rel, h.title.replace(/\\\|/g, '\\|'))) || kept.get(key(rel, h.title)) || { verdict: '', basis: '', memo: '' };
        // 본문 없는 절은 자동으로 `묶음`(사람 결정 09-29). 손으로 다른 판정을 적어 두었으면 그대로 둔다
        if (h.container && (!k.verdict || k.verdict === '유지' && k.basis.startsWith('제목만'))) {
          k.verdict = '묶음'; k.basis = '자동 — 본문 없음(하위 절만 묶음)';
        }
        const indent = h.level > 1 ? '&nbsp;'.repeat((h.level - 1) * 2) : '';
        body.push(`| \`${rel}\` | ${h.line} | ${indent}${'#'.repeat(h.level)} ${h.title} | ${k.verdict} | ${k.basis} | ${k.memo} |`);
        rows++; if (k.verdict) filled++;
      }
      body.push('');
    }
    fs.writeFileSync(p, body.join('\n'), 'utf8');
    summary.push({ dom, files: files.length, rows, filled });
  }
  console.log('도메인 | 파일 | 절 | 판정됨');
  for (const s of summary) console.log(`${s.dom} | ${s.files} | ${s.rows} | ${s.filled}`);
  const t = summary.reduce((a, s) => ({ files: a.files + s.files, rows: a.rows + s.rows, filled: a.filled + s.filled }), { files: 0, rows: 0, filled: 0 });
  console.log(`합계 | ${t.files} | ${t.rows} | ${t.filled}`);
}

function check(only) {
  const files = fs.readdirSync(OUT).filter((f) => /^ledger_.+\.md$/.test(f)).sort();
  let bad = 0;
  for (const f of files) {
    const dom = f.slice(7, -3);
    if (only && only !== dom) continue;
    const rows = fs.readFileSync(path.join(OUT, f), 'utf8').split(/\r?\n/).filter((l) => l.startsWith('| `'));
    const empty = [], invalid = [];
    for (const r of rows) {
      const c = r.split(/(?<!\\)\|/).slice(1, -1).map((x) => x.trim());
      const v = c[3];
      if (!v) empty.push(`${c[0]}:${c[1]} ${c[2]}`);
      else if (!VERDICTS.some((x) => v.startsWith(x))) invalid.push(`${c[0]}:${c[1]} 판정="${v}"`);
    }
    const pct = rows.length ? Math.round(((rows.length - empty.length) / rows.length) * 100) : 100;
    console.log(`${dom}: ${rows.length - empty.length}/${rows.length} (${pct}%)${invalid.length ? ` · 잘못된 판정 ${invalid.length}` : ''}`);
    if (only) { empty.forEach((e) => console.log('  빈 칸 ', e)); invalid.forEach((e) => console.log('  ⚠ ', e)); }
    bad += empty.length + invalid.length;
  }
  if (bad) { console.log(`❌ 미판정·오류 ${bad}건 — 100%가 되어야 다음 단계`); process.exitCode = 1; }
  else console.log('✅ 전부 판정됨');
}

const [cmd, arg] = process.argv.slice(2);
if (cmd === 'build') build();
else if (cmd === 'check') check(arg);
else console.log('사용법: node .harness/tools/docs-ledger.js build | check [도메인]');
