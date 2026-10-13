// 경위 부록 분리기(docs 정리 6-A, 10-13 개발자 A안) — 문서 끝 `## 📎 부록: 경위` 절을 원문 그대로
// `docs/작업일지_및_기록/문서_경위/<번호>_경위.md`로 옮기고, 본문에는 제목 + 안내 한 줄만 남긴다.
// 사용: node .harness/tools/docs-split-appendix.js [--dry] 00-14 00-23 …   (명령에는 문서 번호만 — 문서 내용은 넣지 않는다, AGENTS.md §1)
// - 옮기는 범위 = 그 제목 줄 ~ 파일 끝. 부록이 없거나 둘 이상이면 건너뜀
// - 옮긴 블록 안의 상대 링크는 새 위치 기준으로 다시 쓰고, `(#앵커)`는 옮긴 블록 안 제목이 아니면 본문 파일을 가리키게 고친다
// - 대장(docs-ledger)은 이 폴더의 제목을 "옮겨 간 절"로 알아본다(사라진 절로 세지 않음)
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const DOCS = path.join(ROOT, 'docs');
const OUTDIR = path.join(DOCS, '작업일지_및_기록', '문서_경위');
const EXCLUDE = ['작업일지_및_기록'];
const HEAD_RE = /^## 📎 부록: 경위/;
const today = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); // KST

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const ids = args.filter((a) => !a.startsWith('--'));
if (!ids.length) { console.log('사용법: node .harness/tools/docs-split-appendix.js [--dry] <문서번호>…'); process.exit(1); }

function walk(dir) {
  let out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!EXCLUDE.includes(e.name)) out = out.concat(walk(p)); }
    else if (e.name.endsWith('.md')) out.push(p);
  }
  return out;
}
const all = walk(DOCS);
const posix = (p) => p.replace(/\\/g, '/');
const encLink = (p) => posix(p).replace(/ /g, '%20'); // 한글 경로는 그대로(원문으로 읽히게) — 공백만 인코딩
// GitHub 앵커 규칙(근사) — 옮긴 블록 안을 가리키는 앵커인지 가리는 데만 쓴다
const slug = (t) => t.trim().toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu, '').replace(/\s/g, '-');

let fail = 0;
for (const id of ids) {
  const hits = all.filter((f) => path.basename(f).startsWith(id + '_'));
  if (hits.length !== 1) { console.log(`✗ ${id}: 맞는 문서 ${hits.length}개`); fail++; continue; }
  const file = hits[0];
  const src = fs.readFileSync(file, 'utf8');
  const crlf = src.includes('\r\n');
  const L = src.replace(/\r\n/g, '\n').split('\n');
  const heads = []; // [줄, 레벨]
  let fence = false;
  L.forEach((ln, i) => {
    if (/^\s*```/.test(ln)) { fence = !fence; return; }
    const m = !fence && /^(#{1,6})\s/.exec(ln);
    if (m) heads.push([i, m[1].length]);
  });
  const ap = heads.filter(([i]) => HEAD_RE.test(L[i]));
  if (ap.length !== 1) { console.log(`✗ ${id}: '부록: 경위' 제목 ${ap.length}개 — 건너뜀`); fail++; continue; }
  const a = ap[0][0];
  // 부록은 파일 끝까지다 — docs-move-appendix.js가 늘 끝에 붙였고, 안의 `##`·`#`는 옮겨 둔 원문 장이다(10-13 00 전수 확인)
  const e = L.length;
  let block = L.slice(a + 1, e);
  while (block.length && /^\s*(-{3,})?\s*$/.test(block[block.length - 1])) block.pop();
  while (block.length && block[0].trim() === '') block.shift();
  if (!block.length) { console.log(`✗ ${id}: 부록이 비어 있음 — 건너뜀`); fail++; continue; }

  const outFile = path.join(OUTDIR, `${id}_경위.md`);
  if (fs.existsSync(outFile)) { console.log(`✗ ${id}: 이미 있음 ${posix(path.relative(ROOT, outFile))}`); fail++; continue; }

  // 옮긴 블록의 링크 다시 쓰기
  const own = new Set(block.filter((l) => /^#{1,6}\s/.test(l)).map((l) => slug(l.replace(/^#+\s*/, ''))));
  own.add(slug(L[a].replace(/^#+\s*/, '')));
  const toMain = encLink(path.relative(OUTDIR, file));
  let nRel = 0, nAnc = 0;
  fence = false;
  block = block.map((ln) => {
    if (/^\s*```/.test(ln)) { fence = !fence; return ln; }
    if (fence) return ln;
    return ln.replace(/(\[[^\]]*\]\()([^)\s]+)/g, (m, pre, href) => {
      if (/^(https?:|mailto:|tel:|data:)/.test(href)) return m;
      if (href.startsWith('#')) {
        let anc = href.slice(1); try { anc = decodeURIComponent(anc); } catch (x) { /* 그대로 */ }
        if (own.has(anc.toLowerCase())) return m;
        nAnc++; return pre + toMain + href;
      }
      const [f, anc] = href.split('#');
      let fd = f; try { fd = decodeURI(f); } catch (x) { /* 그대로 */ }
      const abs = path.resolve(path.dirname(file), fd);
      nRel++; return pre + encLink(path.relative(OUTDIR, abs)) + (anc !== undefined ? '#' + anc : '');
    });
  });

  const h1 = L.find((l) => /^# /.test(l));
  const title = h1 ? h1.replace(/^#\s+/, '') : path.basename(file, '.md');
  const outLines = [
    `# ${id} 경위 — ${title}`,
    '',
    `> 본문: [\`${path.basename(file)}\`](${toMain}) · 본문 끝 \`부록: 경위\`를 원문 그대로 옮김(${today}, docs 정리 6-A). 본문의 "부록 경위 A·B…" 표기는 아래 같은 이름의 절을 가리킵니다.`,
    '',
    L[a],
    '',
    ...block,
  ];
  const stub = ['', `→ 원문은 [\`문서_경위/${id}_경위.md\`](${encLink(path.relative(path.dirname(file), outFile))})로 옮겼습니다(${today}). 본문의 "부록 경위 A·B…" 표기는 그 파일의 같은 이름 절입니다.`];
  const main = [...L.slice(0, a + 1), ...stub];
  while (main.length && main[main.length - 1].trim() === '') main.pop();
  const nl = crlf ? '\r\n' : '\n';
  const kb = (s) => (Buffer.byteLength(s) / 1024).toFixed(0) + 'KB';
  const outText = outLines.join(nl) + nl, mainText = main.join(nl) + nl;
  console.log(`${dry ? '[dry] ' : ''}✓ ${id}: 본문 ${kb(src)} → ${kb(mainText)} · 경위 ${kb(outText)} · 옮긴 줄 ${e - a - 1} · 링크 다시 씀 ${nRel} · 앵커→본문 ${nAnc}`);
  if (dry) continue;
  fs.mkdirSync(OUTDIR, { recursive: true });
  fs.writeFileSync(outFile, outText);
  fs.writeFileSync(file, mainText);
}
if (fail) process.exitCode = 1;
