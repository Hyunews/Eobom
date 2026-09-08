#!/usr/bin/env node
/* PreToolUse(Write|Edit) 가드 — 00-09 §6.4 P-5 드리프트 차단.
 * eobomDev/frontend/src 하위 신규 코드에서 하드코딩 HEX와 §6.2 스케일 밖 fontSize를 잡는다.
 * 🔴 기존 1,304곳은 아직 위반 상태라 차단이 아니라 경고로 시작한다(exit 1 — 비차단).
 * 화이트리스트(token-guard-whitelist.txt)에 있는 파일을 Write로 통째로 덮어쓸 때만 건너뛴다.
 * Edit의 new_string은 화이트리스트 여부와 무관하게 항상 검사한다 — 그게 "신규 코드"다.
 * 되돌리려면 .claude/settings.json의 이 PreToolUse 블록을 지운다. */
const fs = require('fs');
const path = require('path');

const SRC_MARKER = /eobomDev[\\/]frontend[\\/]src[\\/]/;
const HEX_RE = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})\b/g;
// §6.2 6칸 스케일. 리터럴로 이 값을 써도 var(--fs-*) 미사용은 여전히 드리프트지만,
// 우선은 스케일 "밖" 값만 잡는다 — 안쪽 리터럴은 P-4 이관 대상으로 남겨둔다.
const ALLOWED_REM = new Set(['0.85', '0.95', '1.05', '1.3']);
const FONT_SIZE_RE = /font-?[sS]ize:\s*['"]?(\d+(?:\.\d+)?)(rem|px)/g;

function loadWhitelist() {
  const p = path.join(__dirname, 'token-guard-whitelist.txt');
  let raw = '';
  try { raw = fs.readFileSync(p, 'utf8'); } catch (e) { return new Set(); }
  const set = new Set();
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    set.add(t.replace(/\\/g, '/'));
  }
  return set;
}

function relSrcPath(filePath) {
  const norm = filePath.replace(/\\/g, '/');
  const m = norm.match(/eobomDev\/frontend\/src\/(.+)$/);
  return m ? m[1] : null;
}

function findViolations(content) {
  const violations = [];
  const hexMatches = content.match(HEX_RE);
  if (hexMatches) {
    const uniq = [...new Set(hexMatches)].slice(0, 8);
    violations.push(`하드코딩 HEX ${hexMatches.length}건: ${uniq.join(', ')}`);
  }

  const offScale = [];
  let m;
  FONT_SIZE_RE.lastIndex = 0;
  while ((m = FONT_SIZE_RE.exec(content))) {
    const [full, value, unit] = m;
    if (unit === 'rem' && ALLOWED_REM.has(value)) continue;
    offScale.push(`${value}${unit}`);
  }
  if (offScale.length > 0) {
    const uniq = [...new Set(offScale)].slice(0, 8);
    violations.push(`스케일 밖 fontSize ${offScale.length}건: ${uniq.join(', ')} (허용: ${[...ALLOWED_REM].join('/')}rem, clamp·var(--fs-*))`);
  }

  return violations;
}

let raw = '';
try { raw = fs.readFileSync(0, 'utf8'); } catch (e) { process.exit(0); }
let j; try { j = JSON.parse(raw); } catch (e) { process.exit(0); }

const toolName = j.tool_name;
if (toolName !== 'Write' && toolName !== 'Edit' && toolName !== 'MultiEdit') process.exit(0);

const ti = j.tool_input || {};
const fp = ti.file_path;
if (!fp || !SRC_MARKER.test(fp)) process.exit(0);
if (!/\.(tsx?|css)$/i.test(fp)) process.exit(0);

const whitelist = loadWhitelist();
const relPath = relSrcPath(fp);

let contentsToCheck = [];
if (toolName === 'Write') {
  const isWhitelisted = relPath && whitelist.has(relPath);
  if (isWhitelisted) process.exit(0); // 기존 파일 전면 재작성 — 기존 위반과 구분 안 됨, 건너뜀
  contentsToCheck = [ti.content || ''];
} else if (toolName === 'Edit') {
  contentsToCheck = [ti.new_string || ''];
} else if (toolName === 'MultiEdit') {
  contentsToCheck = (ti.edits || []).map((e) => e.new_string || '');
}

const allViolations = [];
for (const content of contentsToCheck) {
  allViolations.push(...findViolations(content));
}
if (allViolations.length === 0) process.exit(0);

const msg = [
  `\u{1F7E1} 토큰 드리프트 경고(비차단) — ${fp}`,
  ...allViolations.map((v) => '  - ' + v),
  '',
  '00-09 §6.2 토큰(색·타입)을 쓴다: index.css :root의 --text-muted/--state-*/--fs-* 등.',
  '기존 파일을 고치는 중이라 이미 있던 값이면 이 경고는 무시해도 된다(1,304곳 기존 부채,',
  'P-4 이관 대상). 화이트리스트: .harness/tools/token-guard-whitelist.txt',
].join('\n');
process.stderr.write(msg);
process.exit(1); // 비차단 — 경고만
