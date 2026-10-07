// Stop 훅 — 마지막 어시스턴트 답변이 영어로 쓰였으면 막고 한국어로 다시 쓰게 한다(2026-10-07 개발자 지시).
// 배경: CLAUDE.md "한국어로만 답한다"가 있는데도 짧은 확인 답변이 영어로 나간 일이 한 세션에 3번 있었다.
// 판정: 코드 블록·인라인 코드·URL·경로·대문자 식별자(R2_VOICE_BUCKET 등)를 뺀 본문에서
//       한글 글자 수 대비 영문 글자 수를 잰다. 영문이 70% 이상이고 글자가 40자 이상이면 차단.
// 무한 반복 방지: stop_hook_active(이미 이 훅 때문에 다시 쓴 턴)면 통과시킨다.
const fs = require('fs');

let input = '';
process.stdin.on('data', (c) => (input += c));
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input.replace(/^﻿/, '').trim() || '{}'); // PowerShell 파이프는 BOM을 붙인다
    if (data.stop_hook_active) return;
    const text = lastAssistantText(data);
    if (!text) return;

    const body = text
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/`[^`]*`/g, ' ')
      .replace(/https?:\/\/\S+/g, ' ')
      .replace(/[A-Za-z]:\\\S+|\S*\/\S*/g, ' ')
      .replace(/\b[A-Z0-9_]{2,}\b/g, ' ');
    const hangul = (body.match(/[가-힣]/g) || []).length;
    const latin = (body.match(/[A-Za-z]/g) || []).length;
    if (hangul + latin < 40) return;
    if (latin / (hangul + latin) < 0.7) return;

    process.stdout.write(JSON.stringify({
      decision: 'block',
      reason: '방금 답변이 영어로 작성됐다. CLAUDE.md 규칙은 "한국어로만 답한다"이다. 같은 내용을 한국어로 다시 써라(변수 이름·코드·경로는 그대로 둔다). 사과는 한 줄이면 충분하다.',
    }));
  } catch {
    // 훅 오류로 답변이 막히면 안 된다 — 조용히 통과
  }
});

function lastAssistantText(data) {
  if (typeof data.last_assistant_message === 'string') return data.last_assistant_message;
  if (!data.transcript_path || !fs.existsSync(data.transcript_path)) return '';
  const lines = fs.readFileSync(data.transcript_path, 'utf8').trim().split('\n');
  for (let i = lines.length - 1; i >= 0; i--) {
    let row;
    try { row = JSON.parse(lines[i]); } catch { continue; }
    if (row.type === 'user' && !isToolResult(row)) return ''; // 이번 턴에 텍스트 답변이 없으면 검사하지 않음
    if (row.type !== 'assistant') continue;
    const content = row.message && row.message.content;
    const texts = Array.isArray(content) ? content.filter((c) => c.type === 'text').map((c) => c.text) : [];
    if (texts.length) return texts.join('\n');
  }
  return '';
}

function isToolResult(row) {
  const c = row.message && row.message.content;
  return Array.isArray(c) && c.some((x) => x.type === 'tool_result');
}
