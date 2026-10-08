#!/usr/bin/env node
// generate-api-doc.js — eobomDev/backend/src/app.ts의 app.use 마운트 + routes/*.ts의 router.get/post/put/patch/delete를 읽어
// docs/00_핵심플랫폼/00-04_기능_및_API_명세서.md §6-1의 "자동 생성" 구간(마커 사이)만 갱신한다.
// 마커 밖은 한 글자도 바꾸지 않는다. generate-db-doc.js와 같은 방식(구조·--check·마커 교체).
//
// 실행: node .harness/tools/generate-api-doc.js           (문서 갱신)
//       node .harness/tools/generate-api-doc.js --check   (문서가 코드와 다르면 종료코드 1 + 차이 요약)
// 의존성 없음(Node 내장 fs/path + 정규식) — npm install 없이 어디서나 실행.
//
// 표 칸: 메서드 | 전체 경로(마운트 접두+라우트 경로) | 인증 | 핸들러 | 라우트 파일 | 설명
//  - 인증 = 그 라우트에 걸린 미들웨어 이름 그대로. 라우트 인자 중 핸들러(마지막) 앞의 것들 + 파일 앞쪽의
//    `router.use(미들웨어)`(이후 선언된 모든 라우트에 걸린다). 없으면 "없음". app.ts 전역 미들웨어(cors·json 등)는 넣지 않는다.
//  - 핸들러 = 마지막 인자의 함수 이름. 인라인 함수면 "(인라인)".
//  - 설명 = 같은 줄 끝 `// 주석`, 없으면 바로 위 한 줄짜리 `// 주석`(여러 줄 블록의 끝 줄은 문장 조각이라 쓰지 않는다). 없으면 빈칸.
//  - 파싱 못 한 구문은 문서에 넣지 않고 표준 출력에 "⚠ 파싱 실패" 목록으로 낸다. 줄번호는 어디에도 출력하지 않는다.
// 표 형식을 바꾸면 이 문서를 가져다 쓰는 후속(보고서 R300 ⑤)도 같이 볼 것.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const SRC_DIR = path.join(ROOT, 'eobomDev', 'backend', 'src');
const APP_PATH = path.join(SRC_DIR, 'app.ts');
const ROUTES_DIR = path.join(SRC_DIR, 'routes');
const DOC_PATH = path.join(ROOT, 'docs', '00_핵심플랫폼', '00-04_기능_및_API_명세서.md');

const BEGIN_MARKER = '<!-- AUTO-GENERATED:BEGIN (generate-api-doc.js — 직접 수정 금지, 라우트 코드를 고치고 스크립트를 재실행할 것) -->';
const END_MARKER = '<!-- AUTO-GENERATED:END -->';

const METHODS = ['get', 'post', 'put', 'patch', 'delete'];
const failures = []; // { file, text }

// ── 1. 소스 스캐너 ─────────────────────────────────────────────────────

// text[start]가 `(` 일 때 짝이 맞는 `)`의 위치. 문자열·템플릿·주석을 건너뛴다. 못 찾으면 -1.
function findClose(text, start) {
  let depth = 0;
  let i = start;
  while (i < text.length) {
    const c = text[i];
    const n = text[i + 1];
    if (c === '/' && n === '/') { while (i < text.length && text[i] !== '\n') i++; continue; }
    if (c === '/' && n === '*') { const e = text.indexOf('*/', i + 2); if (e < 0) return -1; i = e + 2; continue; }
    if (c === "'" || c === '"') {
      i++;
      while (i < text.length && text[i] !== c) { if (text[i] === '\\') i++; i++; }
      i++;
      continue;
    }
    if (c === '`') { i = skipTemplate(text, i); if (i < 0) return -1; continue; }
    if (c === '(' || c === '[' || c === '{') depth++;
    else if (c === ')' || c === ']' || c === '}') { depth--; if (depth === 0) return i; }
    i++;
  }
  return -1;
}

// text[i]가 여는 백틱일 때 닫는 백틱 다음 위치(`${ }` 중첩 허용).
function skipTemplate(text, i) {
  i++;
  while (i < text.length) {
    if (text[i] === '\\') { i += 2; continue; }
    if (text[i] === '`') return i + 1;
    if (text[i] === '$' && text[i + 1] === '{') {
      let d = 0;
      while (i < text.length) {
        if (text[i] === '{') d++;
        else if (text[i] === '}') { d--; if (d === 0) { i++; break; } }
        i++;
      }
      continue;
    }
    i++;
  }
  return -1;
}

// 괄호 안쪽 문자열을 최상위 쉼표로 나눈다(주석 제거). 인자 배열 반환.
function splitArgs(inner) {
  const args = [];
  let depth = 0;
  let cur = '';
  let i = 0;
  while (i < inner.length) {
    const c = inner[i];
    const n = inner[i + 1];
    if (c === '/' && n === '/') { while (i < inner.length && inner[i] !== '\n') i++; continue; }
    if (c === '/' && n === '*') { const e = inner.indexOf('*/', i + 2); i = e < 0 ? inner.length : e + 2; continue; }
    if (c === "'" || c === '"') {
      const s = i;
      i++;
      while (i < inner.length && inner[i] !== c) { if (inner[i] === '\\') i++; i++; }
      i++;
      cur += inner.slice(s, i);
      continue;
    }
    if (c === '`') {
      const e = skipTemplate(inner, i);
      const end = e < 0 ? inner.length : e;
      cur += inner.slice(i, end);
      i = end;
      continue;
    }
    if (c === '(' || c === '[' || c === '{') depth++;
    else if (c === ')' || c === ']' || c === '}') depth--;
    if (c === ',' && depth === 0) { args.push(cur.trim()); cur = ''; i++; continue; }
    cur += c;
    i++;
  }
  if (cur.trim()) args.push(cur.trim());
  return args;
}

// 소스에서 `obj.method(` 로 시작하는 구문을 순서대로 뽑는다. 줄 맨 앞(들여쓰기 허용)에서 시작하는 것만 — 주석 안의 언급은 걸러진다.
function scanCalls(text, objName, methods) {
  const re = new RegExp(`^[ \\t]*${objName}\\.(${methods.join('|')})\\s*\\(`, 'gm');
  const calls = [];
  let m;
  while ((m = re.exec(text))) {
    const open = m.index + m[0].length - 1;
    const close = findClose(text, open);
    const start = m.index + m[0].search(/\S/);
    if (close < 0) { calls.push({ method: m[1], start, args: null, raw: text.slice(start, start + 80) }); continue; }
    const raw = text.slice(start, close + 1);
    calls.push({ method: m[1], start, end: close + 1, args: splitArgs(text.slice(open + 1, close)), raw });
  }
  return calls;
}

const literalOf = (s) => {
  const m = s.match(/^(['"])(.*)\1$/s);
  return m ? m[2] : null;
};

// 같은 줄 끝 `// …`, 없으면 바로 위 단독 한 줄 `// …`.
function describe(text, call) {
  const lineEnd = text.indexOf('\n', call.end);
  const tail = text.slice(call.end, lineEnd < 0 ? text.length : lineEnd);
  const tm = tail.match(/^\s*;?\s*\/\/\s*(.*?)\s*$/);
  if (tm && tm[1]) return tm[1];

  const lineStart = text.lastIndexOf('\n', call.start - 1) + 1;
  const lines = text.slice(0, lineStart).split('\n'); // 마지막 원소는 빈 문자열(= 현재 줄 앞)
  const above = (lines[lines.length - 2] || '').trim();
  const above2 = (lines[lines.length - 3] || '').trim();
  if (above.startsWith('//') && !above2.startsWith('//')) {
    const t = above.replace(/^\/\/\s*/, '').trim();
    if (t && !/^[─—\-_=]{5,}$/.test(t)) return t;
  }
  return '';
}

// ── 2. app.ts: 마운트 + 직접 선언 라우트 ─────────────────────────────

function parseApp() {
  const text = fs.readFileSync(APP_PATH, 'utf-8').replace(/\r\n/g, '\n');
  const imports = {}; // 변수명 -> routes 파일 이름(확장자 없음)
  for (const m of text.matchAll(/^import\s+(\w+)\s+from\s+['"]\.\/routes\/(\w+)['"]/gm)) imports[m[1]] = m[2];

  const events = []; // 소스 순서: { type: 'mount'|'route', ... }
  for (const c of scanCalls(text, 'app', ['use', ...METHODS])) {
    if (!c.args) { failures.push({ file: 'app.ts', text: c.raw }); continue; }
    const first = c.args[0] !== undefined ? literalOf(c.args[0]) : null;
    if (c.method === 'use') {
      if (first === null) continue; // app.use(cors()) 같은 전역 미들웨어 — 경로 마운트가 아니다
      const target = c.args[c.args.length - 1];
      if (imports[target]) events.push({ type: 'mount', pos: c.start, prefix: first, file: imports[target] });
      else if (/^\w+$/.test(target || '')) failures.push({ file: 'app.ts', text: c.raw });
      // app.use('/uploads', express.static(...)) 같은 정적 서빙은 엔드포인트 목록 대상이 아니다
      continue;
    }
    if (first === null) { failures.push({ file: 'app.ts', text: c.raw }); continue; }
    events.push({ type: 'route', pos: c.start, call: c, text, method: c.method, path: first });
  }
  return { events, imports };
}

// ── 3. routes/*.ts ────────────────────────────────────────────────────

function expandPath(text, call, rawPath) {
  const lit = literalOf(rawPath);
  if (lit !== null) return [lit];
  const tm = rawPath.match(/^`(.*)`$/s);
  if (!tm) return null;
  const vars = [...tm[1].matchAll(/\$\{(\w+)\}/g)].map((x) => x[1]);
  if (vars.length !== 1) return null;
  const v = vars[0];
  // 바로 앞쪽의 `for (const v of NAME)` + `const NAME = ['a','b']` 로 펼친다
  const before = text.slice(0, call.start);
  const loops = [...before.matchAll(new RegExp(`for\\s*\\(\\s*const\\s+${v}\\s+of\\s+(\\w+)\\s*\\)`, 'g'))];
  if (!loops.length) return null;
  const arr = text.match(new RegExp(`const\\s+${loops[loops.length - 1][1]}\\s*=\\s*\\[([^\\]]*)\\]`));
  if (!arr) return null;
  const values = [...arr[1].matchAll(/['"]([^'"]+)['"]/g)].map((x) => x[1]);
  if (!values.length) return null;
  return values.map((val) => tm[1].replace(`\${${v}}`, val));
}

const isFnArg = (s) => /^(async\s+)?(\([^)]*\)|\w+)\s*(:[^=]+)?=>/.test(s) || /^(async\s+)?function\b/.test(s);
const nameOf = (s) => (isFnArg(s) ? '(인라인)' : s.replace(/\s+/g, ' '));

function parseRouteFile(fileBase) {
  const file = `${fileBase}.ts`;
  const full = path.join(ROUTES_DIR, file);
  if (!fs.existsSync(full)) { failures.push({ file, text: '마운트된 라우트 파일이 없음' }); return []; }
  const text = fs.readFileSync(full, 'utf-8').replace(/\r\n/g, '\n');

  const all = scanCalls(text, 'router', ['use', ...METHODS]);
  const inherited = []; // 지금까지 선언된 router.use(미들웨어)
  const rows = [];
  for (const c of all) {
    if (!c.args) { failures.push({ file, text: c.raw }); continue; }
    if (c.method === 'use') {
      if (c.args.length && c.args.every((a) => literalOf(a) === null && !/^`/.test(a))) {
        for (const a of c.args) inherited.push(nameOf(a));
      } else failures.push({ file, text: c.raw });
      continue;
    }
    if (c.args.length < 2) { failures.push({ file, text: c.raw }); continue; }
    const paths = expandPath(text, c, c.args[0]);
    if (!paths) { failures.push({ file, text: c.raw.split('\n')[0] + ' …' }); continue; }
    const handler = nameOf(c.args[c.args.length - 1]);
    const mws = [...inherited, ...c.args.slice(1, -1).map(nameOf)];
    const desc = describe(text, c);
    for (const p of paths) rows.push({ method: c.method.toUpperCase(), routePath: p, auth: mws.length ? mws.join(', ') : '없음', handler, file, desc });
  }
  return rows;
}

// ── 4. 렌더링 ──────────────────────────────────────────────────────────

const joinPath = (prefix, p) => {
  const j = `${prefix}/${p}`.replace(/\/{2,}/g, '/');
  return j.length > 1 ? j.replace(/\/$/, '') : j;
};
const esc = (s) => s.replace(/\|/g, '\\|');

function build() {
  failures.length = 0;
  const { events } = parseApp();
  const sections = []; // { title, rows }
  const appSection = { title: '`app.ts` — 앱에 직접 선언한 경로', rows: [] };
  const mountedFiles = new Set();

  for (const ev of events) {
    if (ev.type === 'mount') {
      mountedFiles.add(ev.file);
      const rows = parseRouteFile(ev.file).map((r) => ({ ...r, fullPath: joinPath(ev.prefix, r.routePath) }));
      sections.push({ title: `\`routes/${ev.file}.ts\` — 마운트 \`${ev.prefix}\``, rows });
    } else {
      if (!sections.includes(appSection)) sections.push(appSection);
      const handler = nameOf(ev.call.args[ev.call.args.length - 1]);
      const mws = ev.call.args.slice(1, -1).map(nameOf);
      appSection.rows.push({
        method: ev.method.toUpperCase(), fullPath: joinPath('', ev.path), auth: mws.length ? mws.join(', ') : '없음',
        handler, file: 'app.ts', desc: describe(ev.text, ev.call),
      });
    }
  }
  // routes/에 있는데 app.ts가 마운트하지 않는 파일
  for (const f of fs.readdirSync(ROUTES_DIR).filter((n) => n.endsWith('.ts')).sort()) {
    if (!mountedFiles.has(f.replace(/\.ts$/, ''))) failures.push({ file: f, text: 'app.ts에 마운트가 없음' });
  }

  const total = sections.reduce((n, s) => n + s.rows.length, 0);
  const noDesc = sections.reduce((n, s) => n + s.rows.filter((r) => !r.desc).length, 0);

  const parts = [`**총 ${total}개 · 설명 없음 ${noDesc}개**`, ''];
  for (const s of sections) {
    parts.push(`#### ${s.title}`, '', '| 메서드 | 전체 경로 | 인증 | 핸들러 | 라우트 파일 | 설명 |', '|---|---|---|---|---|---|');
    for (const r of s.rows) {
      parts.push(`| ${r.method} | \`${r.fullPath}\` | ${esc(r.auth)} | \`${r.handler}\` | \`${r.file}\` | ${esc(r.desc)} |`);
    }
    parts.push('');
  }
  return { generated: parts.join('\n').trimEnd(), total, noDesc, sections };
}

// ── 5. 메인 ────────────────────────────────────────────────────────────

function summarizeDiff(a, b) {
  const A = a.split('\n');
  const B = b.split('\n');
  const setA = new Set(A);
  const setB = new Set(B);
  const removed = A.filter((l) => !setB.has(l));
  const added = B.filter((l) => !setA.has(l));
  const lines = [`문서 ${A.length}줄 → 코드 기준 ${B.length}줄 · 문서에만 있음 ${removed.length}줄 · 코드에만 있음 ${added.length}줄`];
  removed.slice(0, 10).forEach((l) => lines.push(`  - ${l.slice(0, 120)}`));
  added.slice(0, 10).forEach((l) => lines.push(`  + ${l.slice(0, 120)}`));
  if (removed.length > 10 || added.length > 10) lines.push('  …(이하 생략)');
  return lines.join('\n');
}

function main() {
  const { generated, total, noDesc } = build();
  const doc = fs.readFileSync(DOC_PATH, 'utf-8');
  const beginIdx = doc.indexOf(BEGIN_MARKER);
  const endIdx = doc.indexOf(END_MARKER);
  if (beginIdx === -1 || endIdx === -1 || endIdx < beginIdx) {
    console.error(`마커를 찾지 못함: ${path.relative(ROOT, DOC_PATH)} (AUTO-GENERATED:BEGIN/END)`);
    process.exit(2);
  }
  const block = `${BEGIN_MARKER}\n\n${generated}\n\n${END_MARKER}`;
  const output = doc.slice(0, beginIdx) + block + doc.slice(endIdx + END_MARKER.length);

  if (failures.length) {
    console.log(`⚠ 파싱 실패 ${failures.length}건:`);
    failures.forEach((f) => console.log(`  - ${f.file}: ${f.text.replace(/\s+/g, ' ').slice(0, 140)}`));
  }

  if (process.argv.includes('--check')) {
    // 개행은 정규화해서 비교한다(generate-db-doc.js와 같은 이유).
    const norm = (s) => s.replace(/\r\n/g, '\n');
    if (norm(doc) !== norm(output)) {
      const current = norm(doc.slice(beginIdx, endIdx + END_MARKER.length));
      console.error(`낡음: ${path.relative(ROOT, DOC_PATH)} — 라우트 코드와 다릅니다. 인자 없이 다시 실행하세요.`);
      console.error(summarizeDiff(current, norm(block)));
      process.exit(1);
    }
    console.log(`동기화됨: ${path.relative(ROOT, DOC_PATH)} (총 ${total}개 · 설명 없음 ${noDesc}개)`);
    return;
  }

  fs.writeFileSync(DOC_PATH, output, 'utf-8');
  console.log(`생성 완료: 총 ${total}개 · 설명 없음 ${noDesc}개 -> ${path.relative(ROOT, DOC_PATH)}`);
}

main();
