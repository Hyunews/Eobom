// 4단계 보조 도구 — 대장(ledger_XX.md)·plan.md를 한글 명령 없이 다룬다(Bash에 한글을 넣으면 실행 안 됨).
// 사용:
//   node .harness/tools/docs-ledger-helper.js rows <도메인> <문서ID> [all]   — 그 문서의 판정·근거·메모(기본: 경위·묶음·폐기 제외)
//   node .harness/tools/docs-ledger-helper.js empty <도메인>                  — 판정 빈 절 + "사라진 절" 표
//   node .harness/tools/docs-ledger-helper.js mkfill <도메인> <out.json>      — 빈 절을 경위로 채울 fill 입력 생성(부록 머리·"(원문)" 사본용)
//   node .harness/tools/docs-ledger-helper.js replan <시작ID> <끝ID(제외)> <keep.md> — plan.md에서 시작ID~끝ID 직전 문서 표를 keep.md로 교체
//      keep.md 안의 __TOTAL__·__DONE__은 원래 줄 수·처리 줄 수로 바뀐다(남긴 줄 = keep.md에서 "| `" 로 시작하는 행)
//   예: rows 00 00-30 · empty 00 · mkfill 00 C:/…/fill.json · replan 00-30 00-99 C:/…/keep.md
// 🔴 mkfill 결과는 그대로 fill하지 말고 열어 보고 고칠 것 — 본문 stub 절은 경위가 아니라 유지/갱신이다.
const fs = require('fs');
const path = require('path');
const AUDIT = path.join(__dirname, '..', 'docs-audit');
const [, , cmd, a1, a2, a3] = process.argv;
const ledger = (d) => fs.readFileSync(path.join(AUDIT, `ledger_${d}.md`), 'utf8').split(/\r?\n/);
const cells = (ln) => ln.split('|').map((s) => s.trim());

function* rowsOf(d) {
  let van = false;
  for (const ln of ledger(d)) {
    if (ln.startsWith('## ')) { van = /사라진/.test(ln); continue; }
    if (ln.startsWith('| `')) yield { van, c: cells(ln), ln };
  }
}

if (cmd === 'rows') {
  const all = a3 === 'all';
  for (const { van, c } of rowsOf(a1)) {
    if (van || !c[1].includes('/' + a2 + '_')) continue;
    if (!all && /^(경위|묶음|폐기)/.test(c[4])) continue;
    console.log(`${c[2]} [${c[4]}] ${c[3].replace(/&nbsp;/g, '').slice(0, 60)}\n   근거: ${c[5]}\n   메모: ${c[6]}`);
  }
} else if (cmd === 'empty') {
  for (const { van, c, ln } of rowsOf(a1)) {
    if (van) { console.log('사라진 절: ' + ln.slice(0, 300)); continue; }
    if (!c[4]) console.log(`${(c[1].match(/(\d\d-\d\d|TS-\d+)/) || [c[1]])[0]} ${c[2]} ${c[3].replace(/&nbsp;/g, '').slice(0, 70)}`);
  }
} else if (cmd === 'mkfill') {
  const out = {};
  for (const { van, c } of rowsOf(a1)) {
    if (van || c[4]) continue;
    const id = (c[1].match(/(\d\d-\d\d|TS-\d+)/) || [])[1];
    if (!id) continue;
    const t = c[3].replace(/&nbsp;/g, '');
    const v = /부록: 경위/.test(t)
      ? ['경위', '4단계 경위 부록 머리 — 본문에서 옮긴 원문 모음', '']
      : ['경위', '4단계 본문에서 옮긴 원문 — 본문엔 지금 사실 또는 요약만 남김', ''];
    (out[id] = out[id] || {})[c[2]] = v;
  }
  fs.writeFileSync(a2, JSON.stringify(out, null, 1));
  console.log(Object.entries(out).map(([k, v]) => `${k}:${Object.keys(v).length}`).join(' ') || '빈 절 없음');
} else if (cmd === 'replan') {
  const p = path.join(AUDIT, 'plan.md');
  const s = fs.readFileSync(p, 'utf8'); const crlf = s.includes('\r\n');
  const L = s.split(/\r?\n/);
  const isDoc = (l, id) => l.startsWith('### `') && l.includes('/' + id + '_');
  const a = L.findIndex((l) => isDoc(l, a1));
  let b = L.findIndex((l, i) => i > a && isDoc(l, a2));
  if (a < 0) throw new Error('시작 문서 없음: ' + a1);
  if (b < 0) b = L.findIndex((l, i) => i > a && l.startsWith('## ')); // 끝ID가 없으면 다음 도메인 머리까지
  const rows = L.slice(a, b).filter((l) => /^\| \d+ \|/.test(l)).length;
  const keep = fs.readFileSync(a3, 'utf8').split(/\r?\n/);
  const kept = keep.filter((l) => l.startsWith('| `')).length;
  L.splice(a, b - a, ...keep.map((l) => l.replace('__TOTAL__', rows).replace('__DONE__', rows - kept)));
  fs.writeFileSync(p, L.join(crlf ? '\r\n' : '\n'));
  console.log({ 시작줄: a + 1, 끝줄: b, 원래줄: rows, 남김: kept, 처리: rows - kept });
} else {
  console.log(fs.readFileSync(__filename, 'utf8').split('\n').slice(1, 10).join('\n'));
}
