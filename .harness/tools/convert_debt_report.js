const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..', '..');
const mdPath = path.join(ROOT_DIR, '.harness', '_meta', '기술부채_외부지적_점검_260831.md');
const outHtmlPath = path.join(ROOT_DIR, 'reports', '기술부채_외부지적_점검_260831.html');

if (!fs.existsSync(mdPath)) {
  console.error('File not found:', mdPath);
  process.exit(1);
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatInline(text) {
  let res = escapeHtml(text);
  res = res.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  res = res.replace(/~~([^~]+)~~/g, '<del>$1</del>');
  res = res.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  res = res.replace(/`([^`]+)`/g, '<code>$1</code>');
  res = res.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  return res
    .replace(/✅/g, '<span class="tag green">✅</span>')
    .replace(/🔴/g, '<span class="tag red">🔴</span>')
    .replace(/🟡/g, '<span class="tag orange">🟡</span>')
    .replace(/🔵/g, '<span class="tag blue">🔵</span>')
    .replace(/⭐/g, '<span class="tag gold">⭐</span>')
    .replace(/⚠️/g, '<span class="tag warn">⚠️</span>')
    .replace(/⬜/g, '<span class="tag gray">⬜</span>')
    .replace(/🔶/g, '<span class="tag orange">🔶</span>')
    .replace(/⏸️|⏸/g, '<span class="tag pause">⏸️</span>')
    .replace(/❌/g, '<span class="tag red-cross">❌</span>')
    .replace(/🔄/g, '<span class="tag blue-sync">🔄</span>')
    .replace(/🔒/g, '<span class="tag lock">🔒</span>')
    .replace(/🔑/g, '<span class="tag key">🔑</span>');
}

function parseTable(lines) {
  if (lines.length < 2) return '';
  const parseRow = (line) => {
    let inCode = false;
    let chars = [];
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '`') inCode = !inCode;
      if (line[i] === '|' && (inCode || (i > 0 && line[i-1] === '\\'))) {
        chars.push('___PIPE___');
      } else {
        chars.push(line[i]);
      }
    }
    const safe = chars.join('');
    return safe.split('|')
      .map(s => s.trim().replace(/___PIPE___/g, '|').replace(/\\\|/g, '|'))
      .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
  };

  const headers = parseRow(lines[0]);
  const aligns = parseRow(lines[1]).map(d => {
    d = d.trim();
    if (d.startsWith(':') && d.endsWith(':')) return 'center';
    if (d.endsWith(':')) return 'right';
    return 'left';
  });
  const rows = lines.slice(2).map(parseRow);

  let html = '<div class="table-container"><table><thead><tr>';
  headers.forEach((h, idx) => {
    const align = aligns[idx] || 'left';
    html += `<th style="text-align:${align};">${formatInline(h)}</th>`;
  });
  html += '</tr></thead><tbody>';

  rows.forEach(row => {
    html += '<tr>';
    row.forEach((cell, idx) => {
      const align = aligns[idx] || 'left';
      html += `<td style="text-align:${align};">${formatInline(cell)}</td>`;
    });
    html += '</tr>';
  });

  html += '</tbody></table></div>';
  return html;
}

function genericMdToHtml(md, options = {}) {
  const lines = md.split(/\r?\n/);
  let html = '';
  let i = 0;
  let isFirstH1 = !options.isNested;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim().startsWith('```')) {
      const lang = line.trim().slice(3).trim();
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++;
      html += `<pre><code${lang ? ` class="language-${lang}"` : ''}>${escapeHtml(codeLines.join('\n'))}</code></pre>\n`;
      continue;
    }

    if (line.trim().startsWith('>')) {
      const quoteLines = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ''));
        i++;
      }
      const quoteContent = quoteLines.join('\n');
      html += `<blockquote>\n${genericMdToHtml(quoteContent, { isNested: true })}\n</blockquote>\n`;
      continue;
    }

    if (/^(\-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      html += '<hr class="divider">\n';
      i++;
      continue;
    }

    if (line.trim().startsWith('|') && lines[i + 1] && lines[i + 1].includes('|') && lines[i + 1].includes('---')) {
      const tableLines = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }
      html += parseTable(tableLines) + '\n';
      continue;
    }

    if (line.startsWith('#')) {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2];
        if (level === 1 && isFirstH1) {
          isFirstH1 = false;
          i++;
          continue;
        }
        html += `<h${level}>${formatInline(text)}</h${level}>\n`;
        i++;
        continue;
      }
    }

    if (/^\s*[-*+]\s+/.test(line)) {
      const listItems = [];
      while (i < lines.length && (/^\s*[-*+]\s+/.test(lines[i]) || /^\s{2,}/.test(lines[i]))) {
        if (/^\s*[-*+]\s+/.test(lines[i])) {
          listItems.push(lines[i].replace(/^\s*[-*+]\s+/, ''));
        } else {
          listItems[listItems.length - 1] += ' ' + lines[i].trim();
        }
        i++;
      }
      html += '<ul>\n' + listItems.map(item => `  <li>${formatInline(item)}</li>`).join('\n') + '\n</ul>\n';
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const listItems = [];
      while (i < lines.length && (/^\s*\d+\.\s+/.test(lines[i]) || /^\s{2,}/.test(lines[i]))) {
        if (/^\s*\d+\.\s+/.test(lines[i])) {
          listItems.push(lines[i].replace(/^\s*\d+\.\s+/, ''));
        } else {
          listItems[listItems.length - 1] += ' ' + lines[i].trim();
        }
        i++;
      }
      html += '<ol>\n' + listItems.map(item => `  <li>${formatInline(item)}</li>`).join('\n') + '\n</ol>\n';
      continue;
    }

    if (!line.trim()) {
      i++;
      continue;
    }

    let pText = line;
    i++;
    while (i < lines.length && lines[i].trim() &&
           !lines[i].startsWith('#') &&
           !lines[i].trim().startsWith('>') &&
           !lines[i].trim().startsWith('```') &&
           !lines[i].trim().startsWith('|') &&
           !/^\s*[-*+]\s+/.test(lines[i]) &&
           !/^\s*\d+\.\s+/.test(lines[i]) &&
           !/^(\-{3,}|\*{3,}|_{3,})$/.test(lines[i].trim())) {
      pText += ' ' + lines[i].trim();
      i++;
    }
    html += `<p>${formatInline(pText)}</p>\n`;
  }

  return html;
}

const mdContent = fs.readFileSync(mdPath, 'utf-8');
const bodyHtml = genericMdToHtml(mdContent);

const fullHtml = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🛠️ 기술부채 — 외부 지적(Gemini 3.7 Flash) 점검 (2026-08-31) | 이어봄 보고서</title>
  <link rel="stylesheet" href="style.css">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.6;
      color: #333333;
      background-color: #f8fafc;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 1000px;
      margin: 2rem auto;
      background: #ffffff;
      padding: 2.5rem 3rem;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
    }
    .nav-bar {
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #e2e8f0;
    }
    .nav-link {
      display: inline-flex;
      align-items: center;
      color: #64748b;
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 500;
      transition: color 0.2s;
    }
    .nav-link:hover {
      color: #1A2B4C;
    }
    .header {
      margin-bottom: 2.5rem;
      border-bottom: 2px solid #1A2B4C;
      padding-bottom: 1.5rem;
    }
    .header h1 {
      color: #1A2B4C;
      font-size: 2.1rem;
      margin: 0 0 0.5rem 0;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .header .subtitle {
      color: #64748b;
      font-size: 1.05rem;
      margin: 0;
    }
    .badge {
      display: inline-block;
      padding: 0.25rem 0.6rem;
      font-size: 0.8rem;
      font-weight: 600;
      border-radius: 4px;
      background-color: #e2e8f0;
      color: #475569;
      margin-bottom: 0.75rem;
    }
    h2 {
      color: #1e293b;
      font-size: 1.5rem;
      margin-top: 2rem;
      margin-bottom: 1rem;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 0.5rem;
    }
    h3 {
      color: #334155;
      font-size: 1.2rem;
      margin-top: 1.5rem;
      margin-bottom: 0.75rem;
    }
    p {
      margin-bottom: 1rem;
      color: #334155;
    }
    .table-container {
      overflow-x: auto;
      margin: 1.5rem 0;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.95rem;
    }
    th, td {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #e2e8f0;
    }
    th {
      background-color: #f8fafc;
      font-weight: 600;
      color: #475569;
    }
    tr:last-child td {
      border-bottom: none;
    }
    tr:hover td {
      background-color: #f8fafc;
    }
    blockquote {
      margin: 1.5rem 0;
      padding: 1rem 1.25rem;
      background-color: #f1f5f9;
      border-left: 4px solid #1A2B4C;
      border-radius: 0 8px 8px 0;
      color: #475569;
    }
    blockquote p:last-child {
      margin-bottom: 0;
    }
    code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.875em;
      background-color: #f1f5f9;
      padding: 0.2em 0.4em;
      border-radius: 4px;
      color: #0f172a;
    }
    pre {
      background-color: #0f172a;
      color: #f8fafc;
      padding: 1.25rem;
      border-radius: 8px;
      overflow-x: auto;
      margin: 1.5rem 0;
    }
    pre code {
      background-color: transparent;
      padding: 0;
      color: inherit;
      font-size: 0.9rem;
    }
    ul, ol {
      margin-bottom: 1.5rem;
      padding-left: 1.5rem;
      color: #334155;
    }
    li {
      margin-bottom: 0.5rem;
    }
    .tag {
      font-size: 0.85em;
      padding: 0.15em 0.4em;
      border-radius: 4px;
      font-weight: 600;
      display: inline-block;
    }
    .tag.green { background: #dcfce7; color: #166534; }
    .tag.red { background: #fee2e2; color: #991b1b; }
    .tag.orange { background: #ffedd5; color: #9a3412; }
    .tag.blue { background: #e0e7ff; color: #3730a3; }
    .tag.gold { background: #fef9c3; color: #854d0e; }
    .tag.warn { background: #fef3c7; color: #92400e; }
    .tag.gray { background: #f1f5f9; color: #475569; }
    .tag.red-cross { background: #ffe4e6; color: #be123c; }
    .tag.blue-sync { background: #e0f2fe; color: #0369a1; }
    .tag.lock, .tag.key { background: #f3e8ff; color: #6b21a8; }
    .divider {
      border: 0;
      height: 1px;
      background: #e2e8f0;
      margin: 2rem 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="nav-bar">
      <a href="index.html" class="nav-link">← 보고서 메인 포털로 돌아가기</a>
    </div>
    <div class="header">
      <span class="badge">🛠️ 기술 부채 &amp; 외부 지적 대조 점검 보고서</span>
      <h1>기술부채 — 외부 지적(Gemini 3.7 Flash) 점검 (2026-08-31)</h1>
      <p class="subtitle">코드 실측 대조(1,157개 인라인 스타일·51개 fetch 파편화), A/B/C군 분류 및 현실적 개선 로드맵</p>
    </div>
    ${bodyHtml}
  </div>
</body>
</html>`;

fs.writeFileSync(outHtmlPath, fullHtml, 'utf-8');
console.log('Successfully created:', outHtmlPath);
