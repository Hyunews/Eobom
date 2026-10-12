// 경위 절 이동기 — 절(제목~다음 제목 직전)을 문서 끝 "## 📎 부록: 경위"로 원문 그대로 옮긴다.
// 사용: node mv.js spec.json   (spec 안의 line = 지금 파일 기준 제목 줄 번호)
// spec = { file, intro?, groups:[{label, items:[{line, stub?}]}] }
//   stub(문자열) = 본문에 제목을 남기고 그 아래를 stub으로 바꾼다(코드가 절 번호를 가리킬 때)
const fs = require('fs');
const spec = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const src = fs.readFileSync(spec.file, 'utf8');
const crlf = src.includes('\r\n');
const L = src.replace(/\r\n/g, '\n').split('\n');
// 제목 줄(코드 블록 밖)
const heads = [];
let fence = false;
L.forEach((ln, i) => {
  if (/^\s*```/.test(ln)) { fence = !fence; return; }
  if (!fence && /^#{1,6}\s/.test(ln)) heads.push(i);
});
const APPX = L.findIndex((ln) => /^## 📎 부록: 경위/.test(ln));
const endOf = (i) => {
  const nx = heads.find((h) => h > i);
  let e = nx === undefined ? L.length : nx;
  if (APPX >= 0 && i < APPX && e > APPX) e = APPX;
  return e; // exclusive
};
const drop = new Set();
const replaceAt = {}; // body start index -> stub lines
let appendix = [];
for (const g of spec.groups) {
  appendix.push('', `### ${g.label}`, '');
  for (const it of g.items) {
    if (it.from) { // 줄 범위 이동(제목 없는 블록) — from~to(포함)
      const a = it.from - 1, b = it.to - 1;
      if (it.title) appendix.push(it.title, '');
      appendix.push(...L.slice(a, b + 1), '');
      for (let k = a; k <= b; k++) drop.add(k);
      if (typeof it.stub === 'string') replaceAt[a] = it.stub.split('\n');
      continue;
    }
    const i = it.line - 1;
    if (!heads.includes(i)) throw new Error(`제목 아님: ${it.line} ${L[i]}`);
    const e = endOf(i);
    let block = L.slice(i, e);
    // 본문에 제목을 남기는 절은 부록 사본 제목에 "(원문)"을 붙여 같은 제목 두 개를 피한다(대장이 파일+제목으로 짝지음)
    if (typeof it.stub === 'string') block[0] = block[0] + ' (원문)';
    while (block.length && block[block.length - 1].trim() === '') block.pop();
    while (block.length && block[block.length - 1].trim() === '---') { block.pop(); while (block.length && block[block.length - 1].trim() === '') block.pop(); }
    appendix.push(...block, '');
    const from = typeof it.stub === 'string' ? i + 1 : i;
    for (let k = from; k < e; k++) drop.add(k);
    if (typeof it.stub === 'string') replaceAt[i + 1] = ['', ...it.stub.split('\n'), ''];
  }
}
const out = [];
L.forEach((ln, k) => {
  if (replaceAt[k] && drop.has(k)) out.push(...replaceAt[k]);
  else if (replaceAt[k]) out.push(...replaceAt[k]);
  if (!drop.has(k)) out.push(ln);
});
// stub이 제목 바로 뒤 본문 첫 줄 자리일 때 그 줄이 drop돼도 넣는다
Object.keys(replaceAt).forEach((k) => { if (+k >= L.length) out.push(...replaceAt[k]); });
while (out.length && out[out.length - 1].trim() === '') out.pop();
if (APPX < 0) {
  out.push('', '---', '', '## 📎 부록: 경위', '');
  if (spec.intro) out.push(...spec.intro.split('\n'));
}
out.push(...appendix);
while (out.length && out[out.length - 1].trim() === '') out.pop();
// 연속 빈 줄 3개 이상 → 2개
const fin = [];
out.forEach((ln) => { if (ln.trim() === '' && fin.length >= 2 && fin[fin.length - 1].trim() === '' && fin[fin.length - 2].trim() === '') return; fin.push(ln); });
fs.writeFileSync(spec.file, fin.join(crlf ? '\r\n' : '\n') + (crlf ? '\r\n' : '\n'));
console.log(`ok ${spec.file}: ${L.length} → ${fin.length}줄, 이동 ${spec.groups.reduce((a, g) => a + g.items.length, 0)}절`);
