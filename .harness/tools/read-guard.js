#!/usr/bin/env node
/* PreToolUse(Read) 가드 — 큰 파일 통독 차단.
 * 근거: _meta/크레딧_소모_실측_260902.md — 한 달 비용의 67%가 캐시읽기(= 재전송된 컨텍스트)다.
 * 한 번 읽은 파일은 그 세션 남은 모든 턴에 다시 실린다. 40KB 한글 문서(약 13K토큰)를
 * 200턴 남기고 열면 2.6M 캐시읽기 토큰 = Opus 기준 약 4달러. 통독 한 번의 값이다.
 * 되돌리려면 .claude/settings.json의 PreToolUse 블록을 지운다. */
const fs = require('fs');
const LIMIT_BYTES = 20000;   // 이 크기를 넘으면 limit 없는 Read 차단
const MAX_LINES   = 400;     // limit 이 값 이하면 통과

/* 🔴 크기와 무관하게 항상 차단 (2026-09-02) — 아카이빙으로 임계 아래로 내려가도
 * 통독하면 안 되는 로그. 아카이빙 뒤 "이제 작아졌으니 열어도 된다"가 되면
 * 아카이빙이 오히려 손해가 된다. */
const ALWAYS = /(?:^|[\\/])(?:walkthrough|claude_tasks|gemini_tasks)\.md$/i;

let raw = '';
try { raw = fs.readFileSync(0, 'utf8'); } catch (e) { process.exit(0); }
let j; try { j = JSON.parse(raw); } catch (e) { process.exit(0); }
if (j.tool_name !== 'Read') process.exit(0);

const ti = j.tool_input || {};
const fp = ti.file_path;
if (!fp) process.exit(0);
if (/\.(png|jpe?g|gif|webp|svg|pdf|ipynb)$/i.test(fp)) process.exit(0);

let size = 0;
try { size = fs.statSync(fp).size; } catch (e) { process.exit(0); }
if (size <= LIMIT_BYTES && !ALWAYS.test(fp)) process.exit(0);

const lim = ti.limit;
if (typeof lim === 'number' && lim > 0 && lim <= MAX_LINES) process.exit(0);

const kb = (size / 1024).toFixed(0);
const tok = Math.round(size / 3 / 1000);
const msg = [
  '\u{1F534} 통독 차단 — ' + fp + ' 는 ' + kb + 'KB(약 ' + tok + 'K 토큰)다.',
  '지금 열면 이 세션 남은 모든 턴에 계속 실려 재전송된다(한 달 비용의 67%가 이것이다).',
  '',
  '대신 이렇게 한다:',
  '  1) grep -n "찾는말" 파일          <- 위치부터 찾는다',
  '  2) sed -n \'120,260p\' 파일        <- 필요한 절만 뜬다',
  '  3) 정말 Read여야 하면 offset/limit(' + MAX_LINES + '줄 이하)을 붙인다',
  '',
  '전문이 꼭 필요하다고 판단하면 사람에게 이유를 말하고 승인을 받는다.'
].join('\n');
process.stderr.write(msg);
process.exit(2);
