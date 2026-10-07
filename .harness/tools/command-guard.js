// PreToolUse 훅(Bash·PowerShell) — 에이전트가 돌리면 안 되는 명령을 실행 전에 막는다(2026-10-07 개발자 지시).
// 배경: Sonnet이 README 문구를 Bash 명령 안에 넣었다가 백틱(`npm run …`)이 명령 치환으로 실행됐다.
//       작업 폴더가 eobomDev/라 package.json이 없어 전부 실패했을 뿐, backend/였다면 `npm run purge:confirm`(실제 파기)이 돌 수 있었다.
// 막는 것:
//   ① 지우는 명령 — purge:confirm · purge·destroy-* … --confirm · prisma migrate reset · --force-reset  (사람이 터미널에서 직접 한다)
//   ② Bash에서 실행되는 백틱 — 작은따옴표 안·따옴표 친 heredoc(<<'EOF') 본문·\` 는 안전하므로 통과.
//      PowerShell은 백틱이 이스케이프 문자라 ②를 검사하지 않는다.
// 사람이 `!` 로 직접 치는 명령은 이 훅을 거치지 않는다.

let input = '';
process.stdin.on('data', (c) => (input += c));
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input.replace(/^﻿/, '').trim() || '{}'); // PowerShell 파이프는 BOM을 붙인다
    const cmd = (data.tool_input && data.tool_input.command) || '';
    if (!cmd) return;

    const danger = [
      [/purge:confirm/, '파기 확정(purge:confirm)'],
      [/(purge|destroy)[\s\S]*--confirm/, '파기 스크립트 --confirm(purge·destroy-*)'],
      [/migrate\s+reset/, 'prisma migrate reset(DB 전체 초기화)'],
      [/--force-reset/, '--force-reset(DB 전체 초기화)'],
    ].find(([re]) => re.test(cmd));
    if (danger) {
      return deny(`🔴 ${danger[1]}는 에이전트가 실행하지 않는다 — 실제로 지운다. 사람에게 명령을 알려주고 직접 돌리게 한다(AGENTS.md §1, db-safety.md).`);
    }

    if (data.tool_name === 'Bash' && hasLiveBacktick(cmd)) {
      return deny('🔴 Bash 명령에 실행될 백틱(`…`)이 있다 — 셸이 그 안을 명령으로 실행한다(10-07 사고). 문서 내용은 Edit/Write로 고치고, 꼭 셸이어야 하면 작은따옴표나 <<\'EOF\' heredoc을 쓴다.');
    }
  } catch {
    // 훅 오류로 작업이 막히면 안 된다 — 조용히 통과
  }
});

function deny(reason) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: reason },
  }));
}

// 작은따옴표 밖의 이스케이프 안 된 백틱이 있으면 true. 따옴표 친 heredoc 본문은 먼저 걷어낸다.
function hasLiveBacktick(cmd) {
  const stripped = cmd.replace(/<<-?\s*(['"])(\w+)\1[^\n]*\n[\s\S]*?\n\s*\2\s*(?=\n|$)/g, ' ');
  let single = false;
  for (let i = 0; i < stripped.length; i++) {
    const ch = stripped[i];
    if (single) { if (ch === "'") single = false; continue; }
    if (ch === '\\') { i++; continue; }
    if (ch === "'") { single = true; continue; }
    if (ch === '`') return true;
  }
  return false;
}
