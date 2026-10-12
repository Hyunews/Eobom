// docs 5단계 도구 — 끊긴 참조 점검 · frontmatter 제안/삽입 · 자동 색인 · 참조 그래프 · 형식 점검
// 계획·결정 → .harness/docs-audit/README.md §1-5 (10-12 결정 ①B ②B ③A ④A ⑤A) · 태그 형식 §5
//
// 사용법
//   node .harness/tools/docs-catalog.js refs [--check]        → 끊긴 참조 점검. 결과 = .harness/docs-audit/refs.md (--check는 파일을 안 쓰고 끊김 0건인지만)
//   node .harness/tools/docs-catalog.js draft [--digest]      → 대장 → 문서별 frontmatter 제안. 결과 = frontmatter_draft.json + 검토표 frontmatter_draft.md
//                                                              topics는 사람이 읽고 정한 topics_proposal.json에서만 가져온다(키워드 규칙 아님, 결정 ②B)
//                                                              --digest = topics를 정할 때 읽는 요약(머리 인용문 + ## 제목)을 표준출력으로
//   node .harness/tools/docs-catalog.js apply <draft.json> [--yes]
//                                                            → 제안을 문서 맨 위에 삽입·갱신. 🔴 docs/ 75개 일괄 수정이라 --yes 없이는 건수만 보여 주고 멈춘다
//   node .harness/tools/docs-catalog.js index [--check]       → 색인 2파일의 AUTO-GENERATED 구간 생성(--check는 최신인지만)
//   node .harness/tools/docs-catalog.js graph                 → 참조 관계(문서별 참조함/참조됨 + 도메인 Mermaid)를 색인 생성 구간에 반영
//   node .harness/tools/docs-catalog.js check                 → frontmatter 형식 + index --check + refs --check + 결정대기 정합
//
// 대상: docs/ 아래 md 전부(작업일지_및_기록 제외 = docs-ledger.js와 같음). frontmatter를 붙이는 쪽은 색인 3개를 뺀 75개.
// 🔴 YAML 주석(#)을 frontmatter에 넣지 않는다 — 대장 도구가 제목으로 읽는다.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const DOCS = path.join(ROOT, 'docs');
const AUDIT = path.join(ROOT, '.harness', 'docs-audit');
const PENDING = path.join(ROOT, '.harness', 'memory', 'pending-approvals.md');
const EXCLUDE = ['작업일지_및_기록'];
const INDEX_FILES = ['00_DOCS_INDEX.md', '00_DOCS_INDEX_상세.md', '트러블슈팅/00_INDEX.md'];
const INDEX_MAIN = path.join(DOCS, '00_DOCS_INDEX.md');
const INDEX_DETAIL = path.join(DOCS, '00_DOCS_INDEX_상세.md');

const TYPES = ['기획서', '명세서', '결정서', '검토서', '조사서', '초안본문', '메모', '추적'];
const STATUSES = ['확정', '부분확정', '검토중', '결정대기', '폐기', '경위기록'];
const TOPICS = ['회원·인증', '가족연결', '사망·고인', '개인정보', '위치정보', '암호화·보안', '약관·처리방침', '법률쟁점', '수익·정산', '파트너', '전문가', '공공데이터', '외부연동', '인프라·배포', 'DB', 'API', '디자인', '모바일', '운영자', '파기·보존'];
const FM_KEYS = ['id', 'type', 'status', 'replaces', 'topics', 'reports']; // 결정 ①B — 문서에 쓰는 칸은 이 6개뿐
const DOMAINS = ['00', '01', '02', '03', '04', '05', '06', '07', '08'];

const rd = (p) => fs.readFileSync(p, 'utf8').replace(/^﻿/, '');
const rel = (p) => path.relative(DOCS, p).replace(/\\/g, '/');
const stripEmoji = (s) => s.replace(/[\p{Extended_Pictographic}️‍]/gu, '').replace(/\s+/g, ' ').trim();
const clip = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
const cellsOf = (ln) => ln.split(/(?<!\\)\|/).slice(1, -1).map((c) => c.trim());
const esc = (s) => String(s).replace(/\|/g, '\\|');

// ── frontmatter: 모든 줄이 `키: 값`인 맨 위 --- 블록만 frontmatter로 본다(문서가 --- 구분선으로 시작하는 경우와 구분)
const FM_RE = /^---\r?\n((?:[A-Za-z_]+:[^\r\n]*\r?\n)+)---[ \t]*(?:\r?\n|$)/;

function parseFm(text) {
  const m = FM_RE.exec(text);
  if (!m) return null;
  const fm = {};
  for (const ln of m[1].split(/\r?\n/)) {
    if (!ln) continue;
    const i = ln.indexOf(':');
    const k = ln.slice(0, i).trim();
    const v = ln.slice(i + 1).trim();
    fm[k] = v.startsWith('[') && v.endsWith(']') ? v.slice(1, -1).split(',').map((x) => x.trim()).filter(Boolean) : v;
  }
  return fm;
}

function fmText(fm) {
  const val = (v) => (Array.isArray(v) ? '[' + v.join(', ') + ']' : String(v));
  return '---\n' + FM_KEYS.map((k) => `${k}: ${val(fm[k] === undefined ? (['replaces', 'topics', 'reports'].includes(k) ? [] : '') : fm[k])}`).join('\n') + '\n---\n';
}

// ── 문서 읽기
function walk(dir) {
  let out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!EXCLUDE.includes(e.name)) out = out.concat(walk(p)); }
    else if (e.name.endsWith('.md')) out.push(p);
  }
  return out;
}

const idOfFile = (base) => { const m = /^(\d{2}-\d{2}|TS-\d{3})_/.exec(base); return m ? m[1] : null; };
const domainOfRel = (r) => { const t = r.split('/')[0]; const m = /^(\d{2})_/.exec(t); return m ? m[1] : t.startsWith('트러블슈팅') ? 'TS' : '00'; };
const domainOfId = (id) => (id.startsWith('TS') ? 'TS' : id.slice(0, 2));

// 부록 구간 시작 제목: `📎 부록: 경위…` · 색인의 `🔁 부록 A:` — 옛 번호가 그대로 남은 기록 구간(집계만, 실패로 안 침)
const ZONE_RE = /^[^\p{L}\p{N}]*부록(?:\s+[AB])?\s*:/u;
const AUTO_BEGIN = /<!--\s*AUTO-GENERATED:BEGIN/;
const AUTO_END = /<!--\s*AUTO-GENERATED:END/;

function loadDocs() {
  return walk(DOCS).sort().map((abs) => {
    const r = rel(abs);
    const base = path.basename(abs, '.md');
    const text = rd(abs);
    const fmMatch = FM_RE.exec(text);
    const lines = text.split(/\r?\n/);
    const start = fmMatch ? fmMatch[0].split(/\r?\n/).length - 1 : 0; // frontmatter 뒤 첫 줄의 0-based 위치
    const isIndex = INDEX_FILES.includes(r);
    const heads = [];
    const flags = new Array(lines.length).fill(''); // '' 본문 · 'skip' 코드블록/생성구간 · 'zone' 부록 구간
    let fence = false, gen = false, zone = false;
    for (let i = start; i < lines.length; i++) {
      const ln = lines[i];
      if (AUTO_BEGIN.test(ln)) { gen = true; flags[i] = 'skip'; continue; }
      if (AUTO_END.test(ln)) { gen = false; flags[i] = 'skip'; continue; }
      if (gen) { flags[i] = 'skip'; continue; }
      if (/^\s*```/.test(ln)) { fence = !fence; flags[i] = 'skip'; continue; }
      if (fence) { flags[i] = 'skip'; continue; }
      const m = /^(#{1,6})\s+(.*)$/.exec(ln);
      if (m) {
        const level = m[1].length;
        const title = m[2].trim();
        if (level <= 2 && zone && !ZONE_RE.test(title)) zone = false;
        if (level <= 2 && ZONE_RE.test(title)) zone = true;
        heads.push({ line: i + 1, level, title, zone });
      }
      flags[i] = zone ? 'zone' : '';
    }
    return { abs, rel: r, base, id: isIndex ? null : idOfFile(base), isIndex, text, lines, start, heads, flags, fm: parseFm(text) };
  });
}

// 제목 앞 번호(1. · 4.2 · 5-2 · §3) → 비교용 `4-2` 꼴
function secNum(title) {
  const m = /^[^\p{L}\p{N}§]*§?\s*(\d+(?:[.\-]\d+)*)/u.exec(title);
  return m ? m[1].replace(/\./g, '-') : null;
}

// GitHub식 앵커: 소문자 · 문자/숫자/공백/-/_ 만 남기고 공백→-
function slug(title) {
  return title.toLowerCase().replace(/<[^>]+>/g, '').replace(/[^\p{L}\p{N}\s\-_]/gu, '').trim().replace(/\s/g, '-');
}
function anchorsOf(doc) {
  const seen = new Map(), out = new Set();
  for (const h of doc.heads) {
    let s = slug(h.title);
    const n = seen.get(s) || 0;
    seen.set(s, n + 1);
    out.add(n ? `${s}-${n}` : s);
  }
  return out;
}

// ══════════════════════════════════════════════════════════════
// refs — 끊긴 참조 점검
// ══════════════════════════════════════════════════════════════
const ID_RE = /(?<![\d\-])(`)?(\d{2}-\d{2}|TS-\d{3})(?![\d])(`)?/g;
const SEC_RE = /§\s*(\d+(?:[.\-]\d+)*)((?:\s*[·,~\/]\s*(?:§\s*\d+(?:[.\-]\d+)*|\d+\.\d+(?:[.\-]\d+)*))*)/g;
const EXTERNAL_BEFORE = /(\.md|\.js|\.sh|systems|security|db-safety|roles|done|record|AGENTS|README|CLAUDE|backlog|context|MEMORY)[`'"\s의]*$/;
const LINK_RE = /\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

function collectRefs(docs) {
  const byId = new Map(docs.filter((d) => d.id).map((d) => [d.id, d]));
  const byRel = new Map(docs.map((d) => [d.rel, d]));
  // 부록의 "### 처음 §3." 제목도 §3 대상으로 인정(4단계에서 본문 절을 부록으로 옮긴 것 — 세션 1-b)
  const headNums = (h) => {
    const m = /^처음\s*§\s*(\d+(?:[.\-]\d+)*)/.exec(h.title.replace(/^[^\p{L}\p{N}§]*/u, ''));
    return [secNum(h.title), m && m[1].replace(/\./g, '-')].filter(Boolean);
  };
  const nums = new Map(docs.map((d) => [d, new Set(d.heads.filter((h) => h.level >= 2).flatMap(headNums))]));
  const R = { link: [], id: [], sec: [], external: 0, edges: new Map() }; // 각 항목 {doc,line,zone,status,note,text}
  const verdictSec = (target, n) => {
    const have = nums.get(target);
    if (have.has(n)) return ['ok', ''];
    const parts = n.split('-');
    for (let k = parts.length - 1; k >= 1; k--) if (have.has(parts.slice(0, k).join('-'))) return ['weak', `${parts.slice(0, k).join('-')}까지만 있음`];
    return ['broken', `§${n} 절 없음`];
  };
  for (const doc of docs) {
    for (let i = doc.start; i < doc.lines.length; i++) {
      const flag = doc.flags[i];
      if (flag === 'skip') continue;
      const zone = flag === 'zone';
      const ln = doc.lines[i];
      const text = clip(ln.trim(), 70);
      // 색인 2파일의 § 는 집계만(5단계에서 카드로 다시 생성됨 — 10-13 개발자 결정 B안)
      const push = (kind, status, note) => R[kind].push({ doc, line: i + 1, zone: zone || (kind === 'sec' && doc.isIndex), status, note, text });

      // ① md 링크 — 인라인 코드는 지우고 본다
      const noCode = ln.replace(/`[^`]*`/g, (s) => ' '.repeat(s.length));
      for (const m of noCode.matchAll(LINK_RE)) {
        const href = m[1];
        if (/^(https?:|mailto:|tel:|data:)/.test(href)) continue;
        let [file, anchor] = href.split('#');
        try { file = decodeURI(file); } catch (e) { /* 그대로 */ }
        let target = doc;
        if (file) {
          const abs = path.resolve(path.dirname(doc.abs), file);
          if (!fs.existsSync(abs)) { push('link', 'broken', `파일 없음: ${file}`); continue; }
          target = byRel.get(rel(abs)) || null;
        }
        if (anchor && target) {
          let a = anchor; try { a = decodeURIComponent(anchor); } catch (e) { /* 그대로 */ }
          if (!anchorsOf(target).has(a.toLowerCase())) { push('link', 'broken', `#앵커 없음: ${a}`); continue; }
        }
        push('link', 'ok', '');
      }

      // ② ID · ③ § — 위치순으로 훑어 § 를 가장 가까운 앞 ID에 붙인다(ID 없으면 같은 문서)
      const toks = [];
      for (const m of ln.matchAll(ID_RE)) {
        const id = m[2];
        if (!(id.startsWith('TS') || DOMAINS.includes(id.slice(0, 2)))) continue; // 09-30 · 10-12 같은 날짜
        const wrapped = !!(m[1] && m[3]);
        const before = m.index + m[0].length;
        const followedBySec = /^\s?§/.test(ln.slice(before));
        if (!wrapped && !(followedBySec && !id.startsWith('TS'))) { if (!id.startsWith('TS')) continue; }
        toks.push({ t: 'id', id, start: m.index, end: before });
      }
      for (const m of ln.matchAll(SEC_RE)) {
        const nums2 = [m[1], ...[...(m[2] || '').matchAll(/\d+(?:[.\-]\d+)*/g)].map((x) => x[0])];
        toks.push({ t: 'sec', nums: nums2.map((x) => x.replace(/\./g, '-')), start: m.index, end: m.index + m[0].length });
      }
      toks.sort((a, b) => a.start - b.start);
      let cur = null;
      for (const tk of toks) {
        if (tk.t === 'id') {
          cur = { id: tk.id, end: tk.end };
          const target = byId.get(tk.id);
          if (!target) { push('id', 'broken', `문서 없음: ${tk.id}`); continue; }
          push('id', 'ok', '');
          if (!zone && doc.id && tk.id !== doc.id) {
            const e = R.edges.get(doc.id) || new Map();
            e.set(tk.id, (e.get(tk.id) || 0) + 1);
            R.edges.set(doc.id, e);
          }
          continue;
        }
        const gap = cur ? ln.slice(cur.end, tk.start) : null;
        const attached = cur && /^[\s`*)\]]*(?:(?:의|에서|에|참조|→|:)\s*)?$/.test(gap);
        let target, label;
        if (attached) { target = byId.get(cur.id); label = cur.id; }
        else {
          // 법령 조문(§28조의8 · "개인정보보호법 §19 ①" · §18~§21)과 날짜(§10-02)는 문서 절이 아니다
          const near = ln.slice(Math.max(0, tk.start - 40), tk.start), after = ln.slice(tk.end, tk.end + 6);
          if (EXTERNAL_BEFORE.test(near.slice(-30)) || /^\s*(조|[①-⑩])/.test(after) || /(보호법|정보법|사업법|시행령|조문|제\d+조)[^§]*$/.test(near) || /(법|KISO)[\s(（]*$/.test(near)) { R.external++; continue; }
          // 세션 1-b: ID 없는 § 는 같은 줄에서 그 § 앞쪽에 나온 마지막 문서 ID의 절로 본다(없을 때만 같은 문서)
          if (cur) { target = byId.get(cur.id); label = cur.id; }
          else if (!doc.id) { R.external++; continue; } // 색인 파일 안 ID 없는 § 는 대상 불명
          else { target = doc; label = doc.id; }
        }
        if (!target) continue; // 없는 문서는 ② 에서 이미 잡음
        for (const n of tk.nums) {
          if (/-0\d/.test(n) || Number(n.split('-')[0]) >= 100) { R.external++; continue; } // §08-14 · §10-02 = 날짜 (절 번호는 0으로 시작하는 둘째 칸을 안 쓴다)
          let [st, note] = verdictSec(target, n);
          // 세션 1-c: 붙지 않은 § 가 앞쪽 ID 문서에 없고 참조하는 문서 자신에 있으면 자기 문서 절(정상)
          if (st !== 'ok' && !attached && doc.id && target !== doc && verdictSec(doc, n)[0] === 'ok') st = 'ok';
          push('sec', st, st === 'ok' ? '' : `${label} ${note}`);
        }
        if (attached) cur.end = tk.end;
      }
    }
  }
  return R;
}

// 고치지 않기로 한 끊김(인용문 속 표기) — 파일 경로 일부 + 줄 텍스트 일부가 맞으면 실패로 안 친다
const KNOWN_QUOTES = [{ file: '00-22_', has: '§2류', why: 'walkthrough 인용문 속 "§2류"(10-13 Opus 결정: 인용이라 고치지 않음)' }];
const knownOf = (x) => KNOWN_QUOTES.find((q) => x.doc.rel.includes(q.file) && x.text.includes(q.has));

function writeRefs(R, docs, writeFile) {
  const kinds = [['link', 'md 링크'], ['id', '문서 ID'], ['sec', '§ 절 번호']];
  const cnt = (k, f) => R[k].filter(f).length;
  const out = [];
  out.push('# refs — 끊긴 참조 점검');
  out.push('');
  out.push('> 🔴 `node .harness/tools/docs-catalog.js refs`가 만든다 — 손으로 고치지 않는다. 고칠 곳은 아래 목록의 **문서 본문**이다.');
  out.push('> 끊김 = 대상 없음(파일·앵커·문서 ID·절 번호) · 약함 = 상위 절만 있음 · **부록 안**(`📎 부록: 경위` · 색인 부록 A/B 옛 번호 대조표)은 집계만 하고 실패로 안 친다.');
  out.push('');
  out.push('## 요약');
  out.push('');
  out.push('| 구분 | 본문 전체 | 정상 | 약함 | 끊김 | 부록·색인 § 안(집계만) |');
  out.push('|---|---:|---:|---:|---:|---:|');
  let tb = 0, tw = 0;
  for (const [k, name] of kinds) {
    const body = R[k].filter((x) => !x.zone);
    const b = body.filter((x) => x.status === 'broken' && !knownOf(x)).length, w = body.filter((x) => x.status === 'weak').length;
    tb += b; tw += w;
    out.push(`| ${name} | ${body.length} | ${body.length - b - w} | ${w} | ${b} | ${R[k].length - body.length} |`);
  }
  out.push('');
  out.push(`대상 문서 ${docs.length}개 · 대상 불명이라 건너뛴 § ${R.external}건(\`AGENTS.md §1\` 같은 코드·하네스 문서 절, 색인 안 ID 없는 §). **본문 끊김 ${tb}건 · 약함 ${tw}건**`);
  for (const [status, title, hint] of [['broken', '끊김', '대상이 없다 — 문서에서 고친다'], ['weak', '약함', '상위 절까지만 있다 — 더 구체적인 절로 고칠지 판단']]) {
    out.push('');
    out.push(`## ${title} — ${hint}`);
    const rows = [];
    for (const [k, name] of kinds) for (const x of R[k]) if (!x.zone && x.status === status && !knownOf(x)) rows.push({ ...x, name });
    if (!rows.length) { out.push(''); out.push('없음'); continue; }
    const by = new Map();
    for (const x of rows) { const key = x.doc.rel; (by.get(key) || by.set(key, []).get(key)).push(x); }
    for (const [file, list] of [...by.entries()].sort()) {
      out.push('');
      out.push(`### \`${file}\` (${list.length})`);
      out.push('');
      for (const x of list.sort((a, b) => a.line - b.line)) out.push(`- L${x.line} [${x.name}] ${x.note} — ${esc(x.text)}`);
    }
  }
  const known = [...R.link, ...R.id, ...R.sec].filter((x) => !x.zone && x.status === 'broken' && knownOf(x));
  if (known.length) { out.push(''); out.push('## 알려진 예외 — 실패로 안 침'); out.push(''); for (const x of known) out.push(`- \`${x.doc.rel}\` L${x.line} — ${knownOf(x).why}`); }
  out.push('');
  if (writeFile) fs.writeFileSync(path.join(AUDIT, 'refs.md'), out.join('\n'), 'utf8');
  return { broken: tb, weak: tw, known };
}

function cmdRefs(args) {
  const docs = loadDocs();
  const R = collectRefs(docs);
  const check = args.includes('--check');
  const { broken, weak, known } = writeRefs(R, docs, !check);
  const kinds = ['link', 'id', 'sec'].map((k) => `${k} ${R[k].filter((x) => !x.zone).length}`).join(' · ');
  console.log(`refs: 본문 참조 ${kinds} · 끊김 ${broken} · 약함 ${weak}${known.length ? ` · 알려진 예외 ${known.length}건(${known.map((x) => x.doc.rel.split('/').pop().slice(0, 5) + ' L' + x.line).join(', ')} 인용 — 고치지 않음)` : ''}${check ? '' : ' → .harness/docs-audit/refs.md'}`);
  if (check && broken) { console.log('❌ 끊긴 참조 있음 — `refs`로 목록을 만들어 문서에서 고칠 것'); process.exitCode = 1; }
  return { R, docs, broken, weak };
}

// ══════════════════════════════════════════════════════════════
// draft — 대장 → frontmatter 제안
// ══════════════════════════════════════════════════════════════
function readLedgers() {
  const byFile = new Map(); // 파일 → [{line, title, verdict, basis, memo}]
  for (const f of fs.readdirSync(AUDIT).filter((x) => /^ledger_.+\.md$/.test(x)).sort()) {
    const text = rd(path.join(AUDIT, f));
    for (const ln of text.split(/\r?\n/)) {
      if (!ln.startsWith('| `')) continue;
      const c = cellsOf(ln);
      const file = c[0].replace(/`/g, '');
      if (!byFile.has(file)) byFile.set(file, []);
      byFile.get(file).push({ line: Number(c[1]), title: c[2], verdict: c[3] || '', basis: c[4] || '', memo: c[5] || '' });
    }
  }
  return byFile;
}

function pendingIds() {
  if (!fs.existsSync(PENDING)) return new Set();
  const m = /## 대기 중([\s\S]*?)(?:\n## |$)/.exec(rd(PENDING));
  const ids = new Set();
  if (!m) return ids;
  // 항목이 *다루는* 문서만 — `— 문서ID` 또는 `→ 문서ID` 로 시작하는 표기(본문 속 단순 인용은 뺀다)
  for (const x of m[1].matchAll(/(?:—|→)\s*`(\d{2}-\d{2}|TS-\d{3})`/g)) ids.add(x[1]);
  return ids;
}

const TYPE_EXACT = { 기획서: '기획서', 명세서: '명세서', 결정서: '결정서', 검토서: '검토서', 조사서: '조사서', 메모: '메모', 초안: '초안본문' };
const TYPE_GUESS = { 계획서: '기획서', 제안서: '기획서', 로드맵: '기획서', 설계서: '명세서', 사전: '명세서', 와이어프레임: '명세서', 흐름도: '명세서', 가이드: '명세서', 안내서: '메모', 정리: '메모', 솔루션: '메모', 목업: '메모', 체크리스트: '추적', 원고: '초안본문', 대응안: '검토서', 방안: '검토서', 보고서: '조사서' };

function proposeType(doc) {
  const suffix = doc.base.split('_').pop();
  if (TYPE_EXACT[suffix]) return { type: TYPE_EXACT[suffix], sure: true, note: `끝말 "${suffix}"` };
  return { type: TYPE_GUESS[suffix] || '메모', sure: false, note: `끝말 "${suffix}" — 규칙 밖, 제안` };
}

function titleOf(doc) {
  const h1 = doc.heads.find((h) => h.level === 1);
  return h1 ? stripEmoji(h1.title).replace(/^(\d{2}-\d{2}|TS-\d{3})\.?\s*/, '') : doc.base;
}

function replacesMap(docs) {
  // 색인 부록 A 대조표(구 문서 → 신 문서) + 통합 표지(표지가 가리키는 새 정본이 표지 번호를 이어받음)
  const map = new Map(); // 신 ID → [{old, src}]
  const add = (nw, old, src) => { if (!map.has(nw)) map.set(nw, []); if (!map.get(nw).some((x) => x.old === old)) map.get(nw).push({ old, src }); };
  // 세션 1-b(10-12 Opus 검토): 색인 부록 A·B(옛 번호)는 지금 쓰는 다른 문서 ID와 겹쳐서 replaces에 넣지 않는다 — 통합 표지 출처만
  for (const d of docs) {
    if (!d.id) continue;
    const head = d.lines.slice(d.start, d.start + 14).join('\n');
    if (!/통합 표지|표지 파일/.test(head)) continue;
    const m = /(?:→|로|으로|는)\s*\[?`?(\d{2}-\d{2})`?/.exec(head) || /`(\d{2}-\d{2})`\s*(?:으)?로 통합/.exec(head) || /정본은\s*\[?`?(\d{2}-\d{2})/.exec(head);
    if (m && m[1] !== d.id) add(m[1], d.id, `통합 표지(${d.id})`);
  }
  return map;
}

function proposeStatus(doc, rows, pend, head) {
  const first = rows && rows.length ? rows.slice().sort((a, b) => a.line - b.line)[0] : null;
  const fv = first ? first.verdict : '';
  if (/통합 표지|표지 파일/.test(head) || fv.startsWith('폐기')) return { status: '폐기', why: /통합 표지|표지 파일/.test(head) ? '머리에 통합 표지 표시' : `대장 첫 줄 판정 "${fv}"` };
  // 첫 줄(H1) 판정이 "경위"여도 머리말 안내만 경위로 내린 문서가 있다(05-02) — 근거·메모가 문서 전체를 말할 때만 문서째 경위로 본다
  if ((fv.startsWith('경위') || /📎/.test(fv)) && /문서째|문서 전체|전체가 경위|전체 = 경위/.test(first.basis + ' ' + first.memo)) return { status: '경위기록', why: `대장 첫 줄 판정 "${fv}" + 근거에 문서 전체 표시` };
  if (pend.has(doc.id)) return { status: '결정대기', why: 'pending-approvals.md 대기 중 항목' };
  const hit = (rows || []).filter((r) => r.memo.includes('결정대기'));
  // 10-12 개발자 결정(B안): 대장 메모에만 "결정대기"가 있는 문서는 확정으로 두고, pending-approvals.md에 있는 문서만 결정대기
  if (hit.length) return { status: '확정', why: `그 외(대장 메모 "결정대기" ${hit.length}줄은 절 단위라 문서 status에 안 올림)` };
  return { status: '확정', why: '그 외(기본값)' };
}

function reportsOf(rows) {
  const set = new Set();
  for (const r of rows || []) for (const m of r.memo.matchAll(/\bR\d{3}\b/g)) set.add(m[0]);
  return [...set].sort();
}

function ledgerTopics(rows) {
  const set = new Set();
  for (const r of rows || []) for (const m of r.memo.matchAll(/topics:\s*([^R·]*?)(?=\s+R\d{3}|\s*·\s|$)/g)) set.add(m[1].trim());
  return [...set].filter(Boolean).join(' / ');
}

function digest(docs, ledgers) {
  const out = [];
  for (const d of docs.filter((x) => x.id)) {
    const quote = [];
    let seenH1 = false, started = false;
    for (let i = d.start; i < d.lines.length && quote.length < 4; i++) {
      const ln = d.lines[i];
      if (/^#\s/.test(ln)) { seenH1 = true; continue; }
      if (!seenH1) continue;
      if (ln.startsWith('>')) { started = true; quote.push(ln.replace(/^>\s?/, '')); }
      else if (started && ln.trim()) break;
    }
    const heads = d.heads.filter((h) => h.level === 2 && !h.zone).map((h) => clip(stripEmoji(h.title), 44));
    const hint = ledgerTopics(ledgers.get(d.rel));
    out.push(`## ${d.id} ${titleOf(d)}`);
    out.push(`> ${clip(stripEmoji(quote.join(' ')), 260)}`);
    out.push(`## 제목: ${heads.slice(0, 24).join(' | ')}${heads.length > 24 ? ` …(+${heads.length - 24})` : ''}`);
    if (hint) out.push(`참고(대장 topics): ${clip(hint, 120)}`);
    out.push('');
  }
  return out.join('\n');
}

function cmdDraft(args) {
  const docs = loadDocs();
  const ledgers = readLedgers();
  if (args.includes('--digest')) { console.log(digest(docs, ledgers)); return; }
  const pend = pendingIds();
  const repl = replacesMap(docs);
  const propPath = path.join(AUDIT, 'topics_proposal.json');
  const proposal = fs.existsSync(propPath) ? JSON.parse(rd(propPath)) : {};
  const ovPath = path.join(AUDIT, 'draft_overrides.json'); // 사람이 정한 칸 덮어쓰기: { "06-03": { "type": "결정서", "why": "..." } }
  const overrides = fs.existsSync(ovPath) ? JSON.parse(rd(ovPath)) : {};
  const target = docs.filter((d) => d.id); // 색인 3개는 id가 없어 자동 제외 → 75개
  const out = {};
  const bad = [];
  for (const d of target) {
    const rows = ledgers.get(d.rel);
    const head = d.lines.slice(d.start, d.start + 14).join('\n');
    const ty = proposeType(d);
    const ov = overrides[d.id] || {};
    if (ov.type) { ty.type = ov.type; ty.sure = true; ty.note = `수동값(draft_overrides.json) — ${ov.why || ''}`; }
    const st = proposeStatus(d, rows, pend, head);
    const p = proposal[d.id] || { topics: [], basis: '' };
    for (const t of p.topics) if (!TOPICS.includes(t)) bad.push(`${d.id} topics "${t}" — 20개 목록에 없음`);
    const flags = [];
    if (!ty.sure) flags.push('type 확인');
    if (st.status !== '확정') flags.push(`status ${st.status}`);
    if (!p.topics.length) flags.push('topics 빈 문서');
    out[d.id] = {
      file: d.rel,
      fm: { id: d.id, type: ty.type, status: st.status, replaces: (repl.get(d.id) || []).map((x) => x.old), topics: p.topics, reports: reportsOf(rows) },
      meta: { title: titleOf(d), memoOnlyPending: !!st.memoOnly, typeNote: ty.note, typeSure: ty.sure, statusWhy: st.why, replacesSrc: (repl.get(d.id) || []).map((x) => `${x.old}←${x.src}`), topicsBasis: p.basis, ledgerTopics: ledgerTopics(rows), flags },
    };
  }
  if (bad.length) { console.log('❌ topics_proposal.json 오류:\n  ' + bad.join('\n  ')); process.exitCode = 1; return; }
  fs.writeFileSync(path.join(AUDIT, 'frontmatter_draft.json'), JSON.stringify(out, null, 2) + '\n', 'utf8');

  // 검토표 — 결정대기·폐기·경위기록 행과 type 확인 필요 행을 맨 위로
  const ids = Object.keys(out);
  const prio = (e) => e.meta.flags.some((f) => f.startsWith('status') || f === 'type 확인');
  const top = ids.filter((i) => prio(out[i])), rest = ids.filter((i) => !prio(out[i]));
  const byStatus = {};
  for (const i of ids) byStatus[out[i].fm.status] = (byStatus[out[i].fm.status] || 0) + 1;
  const emptyTopics = ids.filter((i) => !out[i].fm.topics.length).length;
  const row = (i) => {
    const e = out[i];
    return `| \`${i}\` | ${esc(clip(e.meta.title, 30))} | ${e.fm.type}${e.meta.typeSure ? '' : ' ❓'} | ${e.fm.status} | ${e.fm.replaces.join(', ')} | ${e.fm.topics.join(', ')} | ${e.fm.reports.join(', ')} | ${esc(e.meta.topicsBasis)} |`;
  };
  const md = [];
  md.push('# frontmatter 제안 — 검토표');
  md.push('');
  md.push('> 🔴 `node .harness/tools/docs-catalog.js draft`가 만든다(손으로 고치지 않음 — 고칠 값은 `frontmatter_draft.json` 또는 `topics_proposal.json`에서). 문서에 쓰는 칸 = `id·type·status·replaces·topics·reports` 6개(결정 ①B).');
  md.push('> type ❓ = 끝말이 규칙 밖이라 제안값 · status 근거는 아래 "근거" 표 · topics 근거 = 읽은 절 이름(결정 ②B).');
  md.push('');
  md.push('## 요약');
  md.push('');
  const memoOnly = ids.filter((i) => out[i].meta.memoOnlyPending).length;
  md.push(`- 문서 ${ids.length}개(색인 3개 제외) · status: ${STATUSES.filter((s) => byStatus[s]).map((s) => `${s} ${byStatus[s]}`).join(' · ')} (결정대기 중 pending-approvals 등재 ${(byStatus['결정대기'] || 0) - memoOnly} · 대장 메모만 근거 ${memoOnly}) · type 확인 필요 ${ids.filter((i) => !out[i].meta.typeSure).length} · topics 빈 문서 ${emptyTopics} · replaces 있는 문서 ${ids.filter((i) => out[i].fm.replaces.length).length} · reports 있는 문서 ${ids.filter((i) => out[i].fm.reports.length).length}`);
  md.push('');
  const head = '| ID | 제목 | type | status | replaces | topics | reports | topics 근거(절) |\n|---|---|---|---|---|---|---|---|';
  md.push(`## 1. 먼저 볼 행 (${top.length}) — status가 결정대기·폐기·경위기록이거나 type 확인 필요`);
  md.push('');
  md.push(head);
  for (const i of top.sort((a, b) => STATUSES.indexOf(out[b].fm.status) - STATUSES.indexOf(out[a].fm.status) || a.localeCompare(b))) md.push(row(i));
  md.push('');
  md.push('### status 근거');
  md.push('');
  md.push('| ID | status | 근거 | type 근거 | replaces 출처 |');
  md.push('|---|---|---|---|---|');
  for (const i of top) md.push(`| \`${i}\` | ${out[i].fm.status} | ${esc(out[i].meta.statusWhy)} | ${esc(out[i].meta.typeNote)} | ${esc(out[i].meta.replacesSrc.join(' · '))} |`);
  md.push('');
  md.push(`## 2. 나머지 (${rest.length}) — status 확정`);
  md.push('');
  md.push(head);
  for (const i of rest) md.push(row(i));
  const withRepl = ids.filter((i) => out[i].fm.replaces.length && !top.includes(i));
  if (withRepl.length) {
    md.push('');
    md.push('### replaces 출처 (나머지 중)');
    md.push('');
    for (const i of withRepl) md.push(`- \`${i}\`: ${out[i].meta.replacesSrc.join(' · ')}`);
  }
  md.push('');
  fs.writeFileSync(path.join(AUDIT, 'frontmatter_draft.md'), md.join('\n'), 'utf8');
  console.log(`draft: ${ids.length}개 · status ${STATUSES.filter((s) => byStatus[s]).map((s) => `${s} ${byStatus[s]}`).join(' · ')} · type 확인 ${ids.filter((i) => !out[i].meta.typeSure).length} · topics 빈 문서 ${emptyTopics} → frontmatter_draft.json · frontmatter_draft.md`);
}

// ══════════════════════════════════════════════════════════════
// apply — 제안을 문서 맨 위에 삽입·갱신 (🔴 docs/ 일괄 수정 · --yes 필요)
// ══════════════════════════════════════════════════════════════
function cmdApply(args) {
  const file = args.find((a) => !a.startsWith('--'));
  if (!file) { console.log('사용법: node .harness/tools/docs-catalog.js apply <draft.json> [--yes]'); process.exitCode = 1; return; }
  const draft = JSON.parse(rd(path.resolve(file)));
  const ids = Object.keys(draft);
  const errors = [];
  for (const id of ids) {
    const e = draft[id];
    if (!fs.existsSync(path.join(DOCS, e.file))) errors.push(`${id}: 파일 없음 ${e.file}`);
    if (e.fm.id !== id) errors.push(`${id}: fm.id 불일치`);
    const miss = formErrors(e.fm, e.file);
    miss.forEach((m) => errors.push(`${id}: ${m}`));
  }
  if (errors.length) { console.log('❌ 제안 형식 오류:\n  ' + errors.join('\n  ')); process.exitCode = 1; return; }
  if (!args.includes('--yes')) {
    console.log(`apply: ${ids.length}개 문서 맨 위에 frontmatter를 넣는다 — docs/ 일괄 수정이라 사람 확인(CONFIRM) 뒤 --yes 를 붙여 다시 실행. (아직 아무것도 안 썼다)`);
    return;
  }
  let n = 0;
  for (const id of ids) {
    const abs = path.join(DOCS, draft[id].file);
    const raw = fs.readFileSync(abs, 'utf8');
    const bom = raw.startsWith('﻿') ? '﻿' : '';
    let body = raw.replace(/^﻿/, '');
    const crlf = body.includes('\r\n');
    body = body.replace(FM_RE, ''); // 이미 있으면 갈아끼움
    let block = fmText(draft[id].fm);
    if (crlf) block = block.replace(/\n/g, '\r\n');
    fs.writeFileSync(abs, bom + block + body, 'utf8');
    n++;
  }
  console.log(`apply: ${n}개 문서에 frontmatter 삽입 — 이어서 docs-ledger.js build → check, docs-catalog.js check`);
}

// ══════════════════════════════════════════════════════════════
// 색인 · 그래프 (AUTO-GENERATED 구간)
// ══════════════════════════════════════════════════════════════
const marker = (name) => ({ b: `<!-- AUTO-GENERATED:BEGIN docs-catalog:${name} (docs-catalog.js — 직접 수정 금지, 문서 frontmatter를 고치고 index를 재실행) -->`, e: '<!-- AUTO-GENERATED:END -->', re: new RegExp(`<!--\\s*AUTO-GENERATED:BEGIN docs-catalog:${name}\\b[^>]*-->`) });

function gitDate(r) {
  try { return execFileSync('git', ['log', '-1', '--format=%cs', '--', path.join('docs', r)], { cwd: ROOT, encoding: 'utf8' }).trim() || '-'; } catch (e) { return '-'; }
}

function reportPath(id, dom) {
  const dir = path.join(ROOT, 'reports', dom === 'TS' ? '' : fs.existsSync(path.join(ROOT, 'reports')) ? (fs.readdirSync(path.join(ROOT, 'reports')).find((x) => x.startsWith(dom + '_')) || '') : '');
  if (!fs.existsSync(dir)) return null;
  const f = fs.readdirSync(dir).find((x) => x.startsWith(id + '_') && x.endsWith('.html'));
  return f ? path.relative(ROOT, path.join(dir, f)).replace(/\\/g, '/') : null;
}

function buildBlocks(docs, R) {
  const targets = docs.filter((d) => d.id);
  const incoming = new Map();
  for (const [from, m] of R.edges) for (const [to, c] of m) { if (!incoming.has(to)) incoming.set(to, new Map()); incoming.get(to).set(from, c); }
  const fmOf = (d) => d.fm || {};
  const blocks = {};
  const join = (m) => [...m.entries()].sort().map(([k, c]) => `\`${k}\`${c > 1 ? `×${c}` : ''}`).join(' ') || '-';

  const pend = targets.filter((d) => fmOf(d).status === '결정대기');
  blocks['index-pending'] = [`**결정대기 문서 ${pend.length}개**`, '', ...pend.map((d) => `- \`${d.id}\` ${titleOf(d)}`)].join('\n');

  for (const dom of DOMAINS) {
    const list = targets.filter((d) => domainOfId(d.id) === dom);
    const rows = ['| ID | 문서 | 제목 | 종류 | 상태 | topics | 참조됨 |', '|---|---|---|---|---|---|---:|'];
    for (const d of list) {
      const f = fmOf(d);
      rows.push(`| \`${d.id}\` | [${d.base}.md](${encodeURI(d.rel)}) | ${esc(titleOf(d))} | ${f.type || ''} | ${f.status || ''} | ${(f.topics || []).join(', ')} | ${incoming.has(d.id) ? incoming.get(d.id).size : 0} |`);
    }
    blocks[`index-D${dom}`] = rows.join('\n');
  }

  const names = {};
  for (const d of targets) { const t = d.rel.split('/')[0]; names[domainOfId(d.id)] = t.replace(/^\d{2}_/, '').replace(/_/g, ' '); }
  const pair = new Map();
  for (const [from, m] of R.edges) for (const to of m.keys()) {
    const a = domainOfId(from), b = domainOfId(to);
    if (a === b || !DOMAINS.includes(a) || !DOMAINS.includes(b)) continue;
    pair.set(`${a}>${b}`, (pair.get(`${a}>${b}`) || 0) + 1);
  }
  blocks['index-graph'] = ['```mermaid', 'flowchart LR', ...DOMAINS.map((dm) => `  D${dm}["${dm} ${names[dm] || ''}"]`), ...[...pair.entries()].sort().map(([k, c]) => { const [a, b] = k.split('>'); return `  D${a} -->|${c}| D${b}`; }), '```', '', '화살표 = 앞 도메인 문서가 뒤 도메인 문서를 인용(문서 쌍 수 · 부록 제외)'].join('\n');

  for (const dom of [...DOMAINS, 'TS']) {
    const list = targets.filter((d) => domainOfId(d.id) === dom);
    const cards = [];
    for (const d of list) {
      const f = fmOf(d);
      const rp = reportPath(d.id, dom);
      cards.push(`### ${d.id} · ${titleOf(d)}`);
      cards.push('');
      cards.push(`- 종류 ${f.type || '-'} · 상태 ${f.status || '-'} · 변경 ${gitDate(d.rel)} · topics ${(f.topics || []).join(', ') || '-'}`);
      if ((f.replaces || []).length) cards.push(`- 대체: ${f.replaces.map((x) => '`' + x + '`').join(' ')}`);
      cards.push(`- 절: ${d.heads.filter((h) => h.level === 2 && !h.zone).map((h) => clip(stripEmoji(h.title), 40)).join(' · ') || '-'}`);
      cards.push(`- 참조함: ${R.edges.has(d.id) ? join(R.edges.get(d.id)) : '-'}`);
      cards.push(`- 참조됨: ${incoming.has(d.id) ? join(incoming.get(d.id)) : '-'}`);
      if (rp) { cards.push(''); cards.push(`보고서 \`${rp}\``); }
      cards.push('');
    }
    blocks[`cards-D${dom}`] = cards.join('\n');
  }
  return blocks;
}

function splice(text, name, content) {
  const mk = marker(name);
  const m = mk.re.exec(text);
  if (!m) return null;
  const from = m.index + m[0].length;
  const endAt = text.indexOf('<!-- AUTO-GENERATED:END -->', from);
  if (endAt < 0) return null;
  return text.slice(0, m.index) + mk.b + '\n' + content + '\n' + text.slice(endAt);
}

function applyBlocks(blocks, write, only) {
  const res = { stale: [], missing: [] };
  for (const file of [INDEX_MAIN, INDEX_DETAIL]) {
    let text = rd(file);
    const crlf = text.includes('\r\n');
    text = text.replace(/\r\n/g, '\n');
    let changed = false;
    for (const [name, content] of Object.entries(blocks)) {
      if (only && !only(name)) continue;
      const isMain = !name.startsWith('cards-');
      if (isMain !== (file === INDEX_MAIN)) continue;
      const next = splice(text, name, content);
      if (next === null) { res.missing.push(`${path.basename(file)}: ${name}`); continue; }
      if (next !== text) { res.stale.push(`${path.basename(file)}: ${name}`); text = next; changed = true; }
    }
    if (write && changed) fs.writeFileSync(file, crlf ? text.replace(/\n/g, '\r\n') : text, 'utf8');
  }
  return res;
}

function cmdIndex(args, onlyGraph) {
  const docs = loadDocs();
  const R = collectRefs(docs);
  const blocks = buildBlocks(docs, R);
  const check = args.includes('--check');
  const only = onlyGraph ? (n) => n === 'index-graph' || n.startsWith('cards-') : null; // graph = 그래프 + 카드의 참조함/참조됨
  const res = applyBlocks(blocks, !check, only);
  if (res.missing.length) console.log(`⚠ 마커 없음(${res.missing.length}): ${res.missing.slice(0, 6).join(' · ')}${res.missing.length > 6 ? ' …' : ''}`);
  if (check) {
    if (res.stale.length || res.missing.length) { console.log(`❌ 색인이 최신이 아님(${res.stale.length}구간 다름 · 마커 없음 ${res.missing.length}) — \`index\` 재실행`); process.exitCode = 1; }
    else console.log('✅ 색인 최신');
    return res;
  }
  console.log(`${onlyGraph ? 'graph' : 'index'}: ${res.stale.length}구간 갱신${res.missing.length ? ` · 마커 없음 ${res.missing.length}` : ''}`);
  return res;
}

// ══════════════════════════════════════════════════════════════
// check
// ══════════════════════════════════════════════════════════════
function formErrors(fm, file) {
  const e = [];
  for (const k of Object.keys(fm)) if (!FM_KEYS.includes(k)) e.push(`허용 안 되는 칸 "${k}"(문서에 쓰는 칸은 ${FM_KEYS.join('·')})`);
  for (const k of FM_KEYS) if (fm[k] === undefined) e.push(`칸 없음: ${k}`);
  if (file) { const id = idOfFile(path.basename(file)); if (fm.id !== id) e.push(`id "${fm.id}" ≠ 파일명 "${id}"`); }
  if (fm.type !== undefined && !TYPES.includes(fm.type)) e.push(`type "${fm.type}" 허용 값 아님`);
  if (fm.status !== undefined && !STATUSES.includes(fm.status)) e.push(`status "${fm.status}" 허용 값 아님`);
  for (const k of ['replaces', 'topics', 'reports']) if (fm[k] !== undefined && !Array.isArray(fm[k])) e.push(`${k}는 [..] 목록이어야 함`);
  for (const t of Array.isArray(fm.topics) ? fm.topics : []) if (!TOPICS.includes(t)) e.push(`topics "${t}" — 20개 목록에 없음`);
  for (const r of Array.isArray(fm.reports) ? fm.reports : []) if (!/^R\d{3}$/.test(r)) e.push(`reports "${r}" — R100 꼴이 아님`);
  return e;
}

function cmdCheck() {
  const docs = loadDocs();
  let bad = 0;
  const targets = docs.filter((d) => d.id);
  const noFm = [], formBad = [];
  for (const d of targets) {
    if (!d.fm) { noFm.push(d.rel); continue; }
    const hasHash = FM_RE.exec(d.text)[1].split(/\r?\n/).some((l) => /#/.test(l.replace(/^[^:]*:/, '')));
    const errs = formErrors(d.fm, d.rel);
    if (hasHash) errs.push('frontmatter에 # 포함(YAML 주석 금지)');
    errs.forEach((m) => formBad.push(`${d.rel}: ${m}`));
  }
  console.log(`frontmatter: ${targets.length - noFm.length}/${targets.length}개 있음 · 형식 오류 ${formBad.length}`);
  noFm.slice(0, 5).forEach((x) => console.log('  없음 ', x));
  if (noFm.length > 5) console.log(`  … 외 ${noFm.length - 5}개`);
  formBad.slice(0, 20).forEach((x) => console.log('  ⚠ ', x));
  bad += noFm.length + formBad.length;

  const saved = process.exitCode;
  process.exitCode = 0;
  cmdIndex(['--check']);
  if (process.exitCode) bad++;
  process.exitCode = 0;
  cmdRefs(['--check']);
  if (process.exitCode) bad++;
  process.exitCode = saved;

  // 결정대기인데 대기 목록·대장 어디에도 없으면 경고(결정 났는데 안 고친 것)
  const pend = pendingIds();
  const ledgers = readLedgers();
  for (const d of targets) {
    if (!d.fm || d.fm.status !== '결정대기') continue;
    const inLedger = (ledgers.get(d.rel) || []).some((r) => r.memo.includes('결정대기'));
    if (!pend.has(d.id) && !inLedger) console.log(`  ⚠ ${d.id} status 결정대기인데 pending-approvals.md·대장에 없음 — 결정 났으면 status를 고칠 것`);
  }
  if (bad) { console.log(`❌ 처리할 것 ${bad}건`); process.exitCode = 1; } else console.log('✅ 통과');
}

// ══════════════════════════════════════════════════════════════
// seed — 색인 2파일에 마커를 처음 심는다(한 번만). 기존 도메인 표·상세 절은 생성 구간으로 대체, 손 칸은 보존.
// ══════════════════════════════════════════════════════════════
function cmdSeed(args) {
  const dry = args.includes('--dry');
  const mk = (name) => { const m = marker(name); return `${m.b}\n(생성 전 — \`index\` 실행)\n${m.e}`; };
  const keep = [];

  // 1) 00_DOCS_INDEX.md
  let t = rd(INDEX_MAIN);
  const crlf1 = t.includes('\r\n');
  t = t.replace(/\r\n/g, '\n');
  if (/AUTO-GENERATED:BEGIN/.test(t)) { console.log('이미 마커가 있음 — seed 건너뜀(index만 실행)'); return; }
  let lines = t.split('\n');
  const dropped = [];
  // 도메인 표: "### … NN." 제목 아래 첫 표(헤더 `| 문서 ID |`)를 마커로 교체
  for (const dom of DOMAINS) {
    const h = lines.findIndex((l) => new RegExp(`^###\\s+\\S+\\s+${dom}\\.`).test(l));
    if (h < 0) { console.log(`⚠ 도메인 ${dom} 제목 못 찾음`); continue; }
    const s = lines.findIndex((l, i) => i > h && /^\|\s*문서 ID\s*\|/.test(l));
    if (s < 0) { console.log(`⚠ 도메인 ${dom} 표 못 찾음`); continue; }
    let e = s;
    while (e + 1 < lines.length && /^\|/.test(lines[e + 1])) e++;
    dropped.push(`표 ${dom}: ${e - s - 1}행(L${s + 1}-${e + 1})`);
    lines.splice(s, e - s + 1, ...mk(`index-D${dom}`).split('\n'));
  }
  // 결정대기 목록(맨 위 — 머리 안내 다음 첫 `---` 앞) · 그래프(도메인 인덱스 제목 앞)
  const sep = lines.findIndex((l) => /^---\s*$/.test(l));
  lines.splice(sep, 0, ...mk('index-pending').split('\n'), '');
  const top = lines.findIndex((l) => /^##\s+\S+\s+도메인별 기획 마크다운 문서 인덱스/.test(l));
  lines.splice(top, 0, '## 🔗 도메인 관계 그래프', '', ...mk('index-graph').split('\n'), '', '---', '');
  keep.push(`${path.basename(INDEX_MAIN)} 남는 손 칸(마커 밖 ## / ### 제목):`);
  lines.forEach((l, i) => { if (/^#{1,3}\s/.test(l)) keep.push(`  L${i + 1} ${l.slice(0, 60)}`); });
  keep.push(`  + 머리 안내 · 도메인별 머리 인용문(> …) · TS 표(트러블슈팅) · 부록 A·B 표`);
  const outMain = lines.join('\n');

  // 2) 00_DOCS_INDEX_상세.md — 머리 안내(첫 `---`까지) 보존, 그 뒤 문서별 절 전부를 도메인 카드 구간으로 교체
  let d = rd(INDEX_DETAIL);
  const crlf2 = d.includes('\r\n');
  d = d.replace(/\r\n/g, '\n');
  const dl = d.split('\n');
  const cut = dl.findIndex((l) => /^---\s*$/.test(l));
  const oldSecs = dl.filter((l) => /^## /.test(l)).length;
  const head = dl.slice(0, cut + 1);
  const body = [];
  for (const dom of [...DOMAINS, 'TS']) body.push('', dom === 'TS' ? '## 트러블슈팅' : `## 도메인 ${dom}`, '', ...mk(`cards-D${dom}`).split('\n'));
  const outDetail = [...head, ...body, ''].join('\n');
  keep.push(`${path.basename(INDEX_DETAIL)} 남는 손 칸: 머리 안내 L1-${cut + 1} (읽는 법·read-guard 경고) · 버려지는 문서별 절 ${oldSecs}개(git 이력에 남음 — 결정 ⑤)`);

  console.log(dropped.length + '개 표 교체 → ' + dropped.join(' · '));
  keep.forEach((x) => console.log(x));
  if (dry) { console.log('(--dry — 쓰지 않음)'); return; }
  fs.writeFileSync(INDEX_MAIN, crlf1 ? outMain.replace(/\n/g, '\r\n') : outMain, 'utf8');
  fs.writeFileSync(INDEX_DETAIL, crlf2 ? outDetail.replace(/\n/g, '\r\n') : outDetail, 'utf8');
  console.log('seed: 마커 21개 삽입 완료 — 이어서 index → graph → index --check → check');
}

const [cmd, ...rest] = process.argv.slice(2);
if (cmd === 'seed') cmdSeed(rest);
else if (cmd === 'refs') cmdRefs(rest);
else if (cmd === 'draft') cmdDraft(rest);
else if (cmd === 'apply') cmdApply(rest);
else if (cmd === 'index') cmdIndex(rest);
else if (cmd === 'graph') cmdIndex(rest, true);
else if (cmd === 'check') cmdCheck();
else console.log('사용법: node .harness/tools/docs-catalog.js refs [--check] | draft [--digest] | apply <draft.json> [--yes] | index [--check] | graph | check');
