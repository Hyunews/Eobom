// docs 전수 대장 생성·점검기 — .harness/docs-audit/README.md (절차 §1 · 세션 절차 §6)
//
// 사용법
//   node .harness/tools/docs-ledger.js build          → docs/의 모든 md 파일·모든 절(제목)을 도메인별 대장으로 만든다
//                                                      이미 적은 판정은 보존한다(파일+제목이 같으면 이어 붙임)
//   node .harness/tools/docs-ledger.js check [도메인]  → 판정 채움률 + 🔴판정 뒤 바뀐 문서 + 🔴사라진 절. 전부 0이어야 통과
//   node .harness/tools/docs-ledger.js fill <도메인> <판정.json>
//                                                    → 판정을 한 번에 적는다. JSON = { "03-02": { "26": ["갱신","근거","메모"] } }
//                                                      키 = 파일 이름 앞부분(유일해야 함) → 줄 번호 → [판정, 근거, 메모]
//   node .harness/tools/docs-ledger.js ack <도메인>    → 바뀐 문서를 다시 보고 판정을 고친 뒤, "지금 내용 기준으로 봤다"고 기준점을 새로 찍는다
//
// 제외: docs/작업일지_및_기록/ (작업 기록 — 기획 정본 아님, 사람 결정 2026-09-29)
// 대장 파일: .harness/docs-audit/ledger_<도메인>.md  (표 한 줄 = 절 하나)
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..', '..');
const DOCS = path.join(ROOT, 'docs');
const OUT = path.join(ROOT, '.harness', 'docs-audit');
const EXCLUDE = ['작업일지_및_기록'];
const VERDICTS = ['유지', '갱신', '통합', '경위', '폐기', '색인', '묶음']; // 묶음 = build가 자동으로만 채움(본문 없는 절)
const ORPHAN_HEAD = '## ⚠ 사라진 절의 판정';

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

// 줄바꿈 차이(CRLF/LF)는 내용 변경으로 치지 않는다
const shaOf = (file) => crypto.createHash('sha1').update(fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n')).digest('hex').slice(0, 10);

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

const key = (file, title) => file + '::' + title;
const cellsOf = (ln) => ln.split(/(?<!\\)\|/).slice(1, -1).map((c) => c.trim());
// 사람이 적은 판정인가(자동 `묶음`은 아님)
const isHand = (v) => !!v && !v.startsWith('묶음');

function parseLedger(p) {
  const kept = new Map(), shas = new Map();
  if (!fs.existsSync(p)) return { kept, shas };
  for (const ln of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const h = /^## `(.+?)` .*<!-- sha:([0-9a-f]+) -->/.exec(ln);
    if (h) { shas.set(h[1], h[2]); continue; }
    if (!ln.startsWith('| `')) continue;
    const cells = cellsOf(ln);
    // | 파일 | 줄 | 절 | 판정 | 근거 | 메모 |
    const file = cells[0].replace(/`/g, '');
    // 들여쓰기(&nbsp;)를 먼저 벗기고 #을 벗긴다 — 순서가 반대면 ##·### 절의 판정이 build 때 사라진다(09-29 실제 발생)
    const title = cells[2].replace(/^\s*(&nbsp;)*/, '').replace(/^(#+\s*|·\s*)/, '').trim();
    kept.set(key(file, title), { file, line: cells[1], title, verdict: cells[3] || '', basis: cells[4] || '', memo: cells[5] || '' });
  }
  return { kept, shas };
}

function build(ackDomain, quiet) {
  fs.mkdirSync(OUT, { recursive: true });
  const byDomain = {};
  for (const f of walk(DOCS).sort()) {
    const rel = path.relative(DOCS, f).replace(/\\/g, '/');
    (byDomain[domainOf(rel)] = byDomain[domainOf(rel)] || []).push({ rel, heads: headings(f), size: fs.statSync(f).size, sha: shaOf(f) });
  }
  const summary = [];
  for (const [dom, files] of Object.entries(byDomain).sort()) {
    const p = path.join(OUT, `ledger_${dom}.md`);
    const { kept, shas } = parseLedger(p);
    const used = new Set();
    let rows = 0, filled = 0;
    const body = [];
    body.push(`# 대장 ${dom} — docs 전수 판정`);
    body.push('');
    body.push('> 🔴 이 파일은 `node .harness/tools/docs-ledger.js build`가 만든다. **판정·근거·메모 칸만** 손으로 채운다(다시 build해도 보존됨). 한 번에 적기는 `fill`(README §6).');
    body.push(`> 판정 값: ${VERDICTS.map((v) => '`' + v + '`').join(' · ')} — 정의는 \`README.md\` §2. 제목 옆 \`sha\` = 판정한 때의 문서 내용 지문(바뀌면 \`check\`가 잡는다).`);
    body.push('');
    for (const { rel, heads, size, sha } of files) {
      const rowsOf = heads.map((h) => {
        const k = { ...(kept.get(key(rel, h.title)) || { verdict: '', basis: '', memo: '' }) };
        if (kept.has(key(rel, h.title))) used.add(key(rel, h.title));
        // 본문 없는 절은 자동으로 `묶음`(사람 결정 09-29). 손으로 다른 판정을 적어 두었으면 그대로 둔다
        if (h.container && (!k.verdict || (k.verdict === '유지' && k.basis.startsWith('제목만')))) {
          k.verdict = '묶음'; k.basis = '자동 — 본문 없음(하위 절만 묶음)';
        }
        return { h, k };
      });
      // 기준점: 사람이 판정한 파일이면 판정 당시 지문을 유지한다(ack 때만 새로 찍음). 아직 안 봤으면 현재 지문
      const judged = rowsOf.some(({ k }) => isHand(k.verdict));
      const base = judged && shas.get(rel) && ackDomain !== dom ? shas.get(rel) : sha;
      body.push(`## \`${rel}\` (${Math.round(size / 1024)}KB · 절 ${heads.length}) <!-- sha:${base} -->`);
      body.push('');
      body.push('| 파일 | 줄 | 절 | 판정 | 근거 | 메모 |');
      body.push('|---|---:|---|---|---|---|');
      for (const { h, k } of rowsOf) {
        const indent = h.level > 1 ? '&nbsp;'.repeat((h.level - 1) * 2) : '';
        body.push(`| \`${rel}\` | ${h.line} | ${indent}${'#'.repeat(h.level)} ${h.title} | ${k.verdict} | ${k.basis} | ${k.memo} |`);
        rows++; if (k.verdict) filled++;
      }
      body.push('');
    }
    // 🔴 제목이 바뀌거나 지워진 절의 판정은 버리지 않고 맨 아래에 모은다 — 조용히 사라지면 판정한 일이 헛수고가 된다
    const orphans = [...kept.entries()].filter(([k, v]) => !used.has(k) && isHand(v.verdict));
    if (orphans.length) {
      body.push(ORPHAN_HEAD + ' — 문서에서 제목이 바뀌었거나 지워짐. 새 절로 옮겨 적은 뒤 이 줄을 지운다');
      body.push('');
      body.push('| 파일 | 줄 | 절 | 판정 | 근거 | 메모 |');
      body.push('|---|---:|---|---|---|---|');
      for (const [, v] of orphans) body.push(`| \`${v.file}\` | ${v.line} | ${v.title} | ${v.verdict} | ${v.basis} | ${v.memo} |`);
      body.push('');
    }
    fs.writeFileSync(p, body.join('\n'), 'utf8');
    summary.push({ dom, files: files.length, rows, filled, orphans: orphans.length });
  }
  if (quiet) return; // check가 부를 때는 표를 찍지 않는다 — 도구 출력도 컨텍스트다(AGENTS.md §10)
  console.log('도메인 | 파일 | 절 | 판정됨 | 사라진 절');
  for (const s of summary) console.log(`${s.dom} | ${s.files} | ${s.rows} | ${s.filled} | ${s.orphans}`);
  const t = summary.reduce((a, s) => ({ files: a.files + s.files, rows: a.rows + s.rows, filled: a.filled + s.filled }), { files: 0, rows: 0, filled: 0 });
  console.log(`합계 | ${t.files} | ${t.rows} | ${t.filled}`);
}

function check(only) {
  build(null, true); // 문서가 바뀌었을 수 있으니 대장을 먼저 최신으로
  const files = fs.readdirSync(OUT).filter((f) => /^ledger_.+\.md$/.test(f)).sort();
  let bad = 0;
  for (const f of files) {
    const dom = f.slice(7, -3);
    if (only && only !== dom) continue;
    const text = fs.readFileSync(path.join(OUT, f), 'utf8');
    const [main, orphanPart = ''] = text.split(ORPHAN_HEAD);
    const rows = main.split(/\r?\n/).filter((l) => l.startsWith('| `'));
    const orphans = orphanPart.split(/\r?\n/).filter((l) => l.startsWith('| `'));
    const empty = [], invalid = [];
    const handFiles = new Set();
    for (const r of rows) {
      const c = cellsOf(r);
      const v = c[3];
      if (!v) empty.push(`${c[0]}:${c[1]} ${c[2].replace(/&nbsp;/g, '')}`);
      else if (!VERDICTS.some((x) => v.startsWith(x))) invalid.push(`${c[0]}:${c[1]} 판정="${v}"`);
      if (isHand(v)) handFiles.add(c[0].replace(/`/g, ''));
    }
    // 판정 뒤 바뀐 문서 — 판정한 파일의 지문이 지금 내용과 다르면
    const stale = [];
    for (const m of main.matchAll(/^## `(.+?)` .*<!-- sha:([0-9a-f]+) -->/gm)) {
      if (handFiles.has(m[1]) && shaOf(path.join(DOCS, m[1])) !== m[2]) stale.push(m[1]);
    }
    const pct = rows.length ? Math.round(((rows.length - empty.length) / rows.length) * 100) : 100;
    const extra = [invalid.length && `잘못된 판정 ${invalid.length}`, stale.length && `🔴판정 뒤 바뀐 문서 ${stale.length}`, orphans.length && `🔴사라진 절 ${orphans.length}`].filter(Boolean).join(' · ');
    console.log(`${dom}: ${rows.length - empty.length}/${rows.length} (${pct}%)${extra ? ' · ' + extra : ''}`);
    if (only) empty.forEach((e) => console.log('  빈 칸 ', e));
    invalid.forEach((e) => console.log('  ⚠ ', e));
    stale.forEach((e) => console.log(`  🔴 판정 뒤 바뀜: ${e} — git diff로 바뀐 절만 다시 보고 판정 고친 뒤 \`ack ${dom}\``));
    orphans.forEach((l) => { const c = cellsOf(l); console.log(`  🔴 사라진 절: ${c[0]}:${c[1]} ${c[2]} (${c[3]}) — 대장 맨 아래 표에서 새 절로 옮겨 적을 것`); });
    // 아직 손대지 않은 도메인의 빈 칸은 전체 점검에서 실패로 치지 않는다(판정 중인 도메인만 100% 요구)
    const started = handFiles.size > 0;
    bad += invalid.length + stale.length + orphans.length + (only || started ? empty.length : 0);
  }
  if (bad) { console.log(`❌ 처리할 것 ${bad}건 — 0이 되어야 그 도메인이 끝난 것`); process.exitCode = 1; }
  else console.log('✅ 통과');
}

function fill(dom, jsonPath) {
  const p = path.join(OUT, `ledger_${dom}.md`);
  if (!fs.existsSync(p)) throw new Error(`대장 없음: ${p} — 먼저 build`);
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8').replace(/^﻿/, '')); // 윈도우 편집기가 붙이는 BOM 제거
  const lines = fs.readFileSync(p, 'utf8').split(/\r?\n/);
  const files = [...new Set(lines.filter((l) => l.startsWith('| `')).map((l) => cellsOf(l)[0].replace(/`/g, '')))];
  const want = new Map(); // "파일::줄" → [판정, 근거, 메모]
  for (const [prefix, byLine] of Object.entries(data)) {
    const hit = files.filter((f) => path.basename(f).startsWith(prefix));
    if (hit.length !== 1) throw new Error(`"${prefix}" 에 맞는 파일이 ${hit.length}개 — 유일한 앞부분을 쓸 것`);
    for (const [ln, v] of Object.entries(byLine)) {
      if (!VERDICTS.slice(0, -1).some((x) => String(v[0]).startsWith(x))) throw new Error(`${prefix}:${ln} 판정 "${v[0]}" 은 쓸 수 없음(묶음은 자동 전용)`);
      want.set(hit[0] + '::' + ln, v);
    }
  }
  const e = (s) => String(s || '').replace(/(?<!\\)\|/g, '\\|');
  let n = 0;
  const out = lines.map((l) => {
    if (!l.startsWith('| `')) return l;
    const c = l.split(/(?<!\\)\|/);
    const k = c[1].trim().replace(/`/g, '') + '::' + c[2].trim();
    const v = want.get(k);
    if (!v) return l;
    want.delete(k); n++;
    return c.slice(0, 4).join('|') + `| ${e(v[0])} | ${e(v[1])} | ${e(v[2])} |`;
  });
  fs.writeFileSync(p, out.join('\n'), 'utf8');
  console.log(`적음 ${n}건`);
  if (want.size) { for (const k of want.keys()) console.log('  ⚠ 대장에 없는 줄:', k); process.exitCode = 1; }
}

const [cmd, a1, a2] = process.argv.slice(2);
if (cmd === 'build') build();
else if (cmd === 'check') check(a1);
else if (cmd === 'fill' && a1 && a2) fill(a1, a2);
else if (cmd === 'ack' && a1) { build(a1, true); console.log(`${a1}: 기준점을 지금 내용으로 새로 찍음`); }
else console.log('사용법: node .harness/tools/docs-ledger.js build | check [도메인] | fill <도메인> <판정.json> | ack <도메인>');
