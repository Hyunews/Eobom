const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const MD_PATH = path.join(ROOT, 'docs', '00_핵심플랫폼', '00-05_DB_요구사항_및_테이블_사전.md');
const HTML_PATH = path.join(ROOT, 'reports', '00_핵심플랫폼', '00-05_이어봄_DB_요구사항_및_테이블_사전.html');

const mdContent = fs.readFileSync(MD_PATH, 'utf-8');

function mdTableToHtml(markdown) {
  const lines = markdown.trim().split('\n');
  if (lines.length < 2) return '';
  
  const parseRow = (line) => {
    const safeLine = line.replace(/\\\|/g, '___PIPE___');
    const cells = safeLine.split('|').map(s => s.trim().replace(/___PIPE___/g, '|')).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
    return cells;
  };

  const headers = parseRow(lines[0]);
  const rows = lines.slice(2).map(parseRow);

  let html = '<div class="table-container"><table><thead><tr>';
  headers.forEach(h => {
    html += `<th>${escapeHtml(h)}</th>`;
  });
  html += '</tr></thead><tbody>';

  rows.forEach(row => {
    html += '<tr>';
    row.forEach((cell, idx) => {
      let cellHtml = escapeHtml(cell)
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/PK/g, '<span class="tag pk">PK</span>')
        .replace(/FK → ([A-Za-z0-9_.]+)/g, '<span class="tag fk">FK → $1</span>')
        .replace(/UNIQUE/g, '<span class="tag uk">UNIQUE</span>')
        .replace(/NOT NULL/g, '<span class="tag nn">NOT NULL</span>')
        .replace(/NULL/g, '<span class="tag null">NULL</span>');
      html += `<td>${cellHtml}</td>`;
    });
    html += '</tr>';
  });

  html += '</tbody></table></div>';
  return html;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function convertMdToHtml(md) {
  const lines = md.split(/\r?\n/);
  let html = '';
  let inTable = false;
  let tableBuffer = [];
  let inCode = false;
  let codeBuffer = [];
  let inModelCard = false;
  const models = [];

  // First pass to extract model names for TOC
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('### ')) {
      const title = lines[i].slice(4).replace(/`([^`]+)`/g, '$1').trim();
      let desc = '';
      if (lines[i + 1] && lines[i + 1].startsWith('> ')) {
        desc = lines[i + 1].slice(2).replace(/`([^`]+)`/g, '$1').trim();
      }
      models.push({ name: title, desc });
    }
  }

  // Generate TOC HTML
  let tocHtml = `<div class="toc-container" id="toc-top">
    <div class="toc-header">
      <span class="toc-title">📋 빠른 테이블 인덱스 (총 ${models.length}개 모델)</span>
      <span class="toc-subtitle">클릭 시 해당 DB 테이블 위치로 스무스 이동합니다.</span>
    </div>
    <div class="toc-grid">`;

  models.forEach((m, idx) => {
    const slug = m.name.replace(/[^a-zA-Z0-9_]/g, '');
    tocHtml += `
      <a href="#model-${slug}" class="toc-item">
        <span class="toc-num">${idx + 1}</span>
        <div class="toc-text">
          <span class="toc-name">${escapeHtml(m.name)}</span>
          ${m.desc ? `<span class="toc-desc">${escapeHtml(m.desc.slice(0, 35))}${m.desc.length > 35 ? '...' : ''}</span>` : ''}
        </div>
      </a>`;
  });
  tocHtml += `</div></div>\n`;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('```')) {
      if (inCode) {
        html += `<pre><code>${escapeHtml(codeBuffer.join('\n'))}</code></pre>\n`;
        codeBuffer = [];
        inCode = false;
      } else {
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      codeBuffer.push(line);
      continue;
    }

    if (line.trim().startsWith('|')) {
      inTable = true;
      tableBuffer.push(line);
      continue;
    } else if (inTable) {
      html += mdTableToHtml(tableBuffer.join('\n')) + '\n';
      tableBuffer = [];
      inTable = false;
    }

    if (line.startsWith('# ')) {
      if (inModelCard) { html += '</div>\n'; inModelCard = false; }
      html += `<h1>${escapeHtml(line.slice(2))}</h1>\n`;
      // Inject TOC right after section 2 or header
    } else if (line.startsWith('## ')) {
      if (inModelCard) { html += '</div>\n'; inModelCard = false; }
      const secTitle = line.slice(3);
      html += `<h2 class="section-title">${escapeHtml(secTitle)}</h2>\n`;
      if (secTitle.includes('테이블·컬럼 사전')) {
        html += tocHtml;
      }
    } else if (line.startsWith('### ')) {
      if (inModelCard) { html += '</div>\n'; }
      inModelCard = true;
      const title = line.slice(4).replace(/`([^`]+)`/g, '$1').trim();
      const slug = title.replace(/[^a-zA-Z0-9_]/g, '');
      html += `<div class="model-card" id="model-${slug}">
        <div class="model-card-header">
          <h3 class="model-title">📦 ${escapeHtml(title)}</h3>
          <a href="#toc-top" class="back-to-top">↑ 목차로 이동</a>
        </div>\n`;
    } else if (line.startsWith('> ')) {
      html += `<blockquote class="info-quote">${escapeHtml(line.slice(2)).replace(/`([^`]+)`/g, '<code>$1</code>')}</blockquote>\n`;
    } else if (line.startsWith('**최초 생성**')) {
      html += `<p class="meta-info">💡 ${escapeHtml(line).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')}</p>\n`;
    } else if (line.startsWith('- ')) {
      html += `<ul><li>${escapeHtml(line.slice(2)).replace(/`([^`]+)`/g, '<code>$1</code>')}</li></ul>\n`;
    } else if (line.trim() === '---') {
      if (inModelCard) { html += '</div>\n'; inModelCard = false; }
      html += `<hr class="divider"/>\n`;
    } else if (line.trim() === '') {
      // blank line
    } else {
      let formatted = escapeHtml(line)
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      html += `<p>${formatted}</p>\n`;
    }
  }

  if (inTable) {
    html += mdTableToHtml(tableBuffer.join('\n')) + '\n';
  }
  if (inModelCard) {
    html += '</div>\n';
  }

  return html;
}

const bodyContent = convertMdToHtml(mdContent);

const fullHtml = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>이어봄 - DB 요구사항 및 테이블 사전 (Prisma Schema)</title>
  <style>
    :root {
      --gov-navy: #1e3a8a;
      --gov-dark: #0f172a;
      --gov-slate: #334155;
      --primary: #1e3a8a;
      --secondary: #5B7065;
      --accent: #D4A359;
      --bg: #e2e8f0;
      --surface: #FFFFFF;
      --text: #0f172a;
      --text-muted: #64748B;
      --border: #CBD5E1;
      --code-bg: #0F172A;
      --code-text: #F8FAFC;
      --paper-width: 960px;
    }
    html {
      scroll-behavior: smooth;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: "Pretendard", -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Malgun Gothic", "맑은 고딕", sans-serif;
      background-color: var(--bg);
      color: var(--text);
      line-height: 1.75;
      padding: 40px 20px 80px;
      -webkit-font-smoothing: antialiased;
    }

    /* 상단 플로팅 툴바 */
    .utility-bar {
      max-width: var(--paper-width);
      margin: 0 auto 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(255, 255, 255, 0.92);
      backdrop-filter: blur(8px);
      padding: 10px 18px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      border: 1px solid #cbd5e1;
    }
    .utility-bar .back-btn {
      color: var(--gov-slate);
      text-decoration: none;
      font-size: 13.5px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .utility-bar .back-btn:hover {
      color: var(--gov-navy);
    }
    .utility-actions {
      display: flex;
      gap: 8px;
    }
    .btn-action {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      color: var(--gov-slate);
      padding: 5px 12px;
      border-radius: 5px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .btn-action:hover {
      background: var(--gov-navy);
      color: #ffffff;
      border-color: var(--gov-navy);
    }

    /* 공문서 페이퍼 본체 */
    .document-page {
      max-width: var(--paper-width);
      margin: 0 auto;
      background: #ffffff;
      padding: 60px 65px 80px;
      border-radius: 4px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.03);
      position: relative;
      border: 1px solid #d1d5db;
    }

    /* 공문서 최상단 메타 (오로지 날짜와 문서번호만 표기 - 결재X, 기안부서X, 문서등급X) */
    .doc-meta-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 14px;
      margin-bottom: 12px;
      border-bottom: 1px solid #cbd5e1;
      font-size: 13.5px;
    }
    .meta-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .meta-label {
      color: #64748b;
      font-weight: 600;
    }
    .meta-val {
      color: #1e293b;
      font-weight: 700;
    }

    /* 문서 타이틀 구역 */
    .doc-header-area {
      border-top: 2px solid var(--gov-dark);
      border-bottom: 2px solid var(--gov-dark);
      padding: 24px 10px;
      margin: 15px 0 35px;
      text-align: center;
    }
    .doc-main-title {
      font-size: 24px;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.35;
      letter-spacing: -0.02em;
      word-break: keep-all;
    }
    .doc-sub-title {
      font-size: 14.5px;
      color: #475569;
      margin-top: 10px;
      font-weight: 500;
      letter-spacing: -0.01em;
      line-height: 1.5;
    }

    .section-title {
      font-size: 1.4rem;
      color: var(--gov-navy);
      margin: 2.5rem 0 1.2rem 0;
      padding-bottom: 8px;
      border-bottom: 1.5px solid var(--gov-slate);
      font-weight: 700;
    }
    
    /* TOC Quick Navigation */
    .toc-container {
      background: linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%);
      border: 1px solid #CBD5E1;
      border-radius: 16px;
      padding: 1.5rem;
      margin: 1.5rem 0 2.5rem 0;
      box-shadow: 0 4px 12px rgba(26, 43, 76, 0.04);
    }
    .toc-header {
      margin-bottom: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }
    .toc-title {
      font-size: 1.1rem;
      font-weight: 800;
      color: var(--primary);
    }
    .toc-subtitle {
      font-size: 0.85rem;
      color: var(--text-muted);
    }
    .toc-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 0.75rem;
    }
    .toc-item {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      background: #FFFFFF;
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 0.75rem;
      text-decoration: none;
      color: var(--text);
      transition: all 0.2s ease;
    }
    .toc-item:hover {
      border-color: var(--accent);
      transform: translateY(-2px);
      box-shadow: 0 4px 10px rgba(212, 163, 89, 0.2);
    }
    .toc-num {
      background: var(--primary);
      color: #FFFFFF;
      font-weight: 700;
      font-size: 0.8rem;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 0.1rem;
    }
    .toc-text {
      display: flex;
      flex-direction: column;
    }
    .toc-name {
      font-weight: 700;
      font-size: 0.92rem;
      color: var(--primary);
    }
    .toc-desc {
      font-size: 0.78rem;
      color: var(--text-muted);
      margin-top: 0.15rem;
      line-height: 1.3;
    }

    .model-card {
      background: #FAFAFC;
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 1.8rem;
      margin-bottom: 2.2rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.02);
      scroll-margin-top: 2rem;
    }
    .model-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.8rem;
    }
    .model-title {
      font-size: 1.35rem;
      color: var(--primary);
      font-weight: 700;
    }
    .back-to-top {
      font-size: 0.82rem;
      color: var(--secondary);
      text-decoration: none;
      font-weight: 600;
      padding: 0.3rem 0.7rem;
      background: #FFFFFF;
      border: 1px solid var(--border);
      border-radius: 8px;
      transition: all 0.2s ease;
    }
    .back-to-top:hover {
      background: var(--primary);
      color: #FFFFFF;
    }
    .info-quote {
      background: #F1F5F9;
      border-left: 4px solid var(--accent);
      padding: 0.8rem 1.2rem;
      margin: 0.8rem 0 1.2rem 0;
      border-radius: 4px;
      font-size: 0.95rem;
      color: #334155;
    }
    .meta-info {
      font-size: 0.88rem;
      color: var(--text-muted);
      margin-bottom: 1rem;
    }
    code {
      background: #EFF6FF;
      color: #1D4ED8;
      padding: 0.15rem 0.4rem;
      border-radius: 6px;
      font-family: 'Fira Code', Consolas, monospace;
      font-size: 0.88rem;
    }
    pre {
      background: var(--code-bg);
      color: var(--code-text);
      padding: 1.2rem;
      border-radius: 12px;
      overflow-x: auto;
      margin: 1rem 0;
      font-family: 'Fira Code', Consolas, monospace;
      font-size: 0.9rem;
    }
    pre code {
      background: transparent;
      color: inherit;
      padding: 0;
    }
    .table-container {
      overflow-x: auto;
      margin: 1rem 0 1.5rem 0;
      border-radius: 12px;
      border: 1px solid var(--border);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;
      background: #FFFFFF;
    }
    th {
      background-color: var(--primary);
      color: #FFFFFF;
      padding: 0.75rem 0.9rem;
      text-align: left;
      font-weight: 600;
    }
    td {
      padding: 0.75rem 0.9rem;
      border-bottom: 1px solid var(--border);
      color: #334155;
    }
    tr:last-child td {
      border-bottom: none;
    }
    tr:nth-child(even) {
      background-color: #F8FAFC;
    }
    .tag {
      display: inline-block;
      padding: 0.15rem 0.45rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 700;
    }
    .tag.pk { background-color: #FEE2E2; color: #991B1B; }
    .tag.fk { background-color: #DBEAFE; color: #1E40AF; }
    .tag.uk { background-color: #DCFCE7; color: #166534; }
    .tag.nn { background-color: #F1F5F9; color: #475569; }
    .tag.null { background-color: #FEF3C7; color: #92400E; }
    .doc-footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #cbd5e1;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12.5px;
      color: #64748b;
    }
    .doc-footer-logo {
      font-weight: 800;
      color: var(--gov-navy);
      font-size: 14px;
      letter-spacing: -0.01em;
    }

    @media print {
      body {
        background-color: #ffffff !important;
        padding: 0 !important;
      }
      .utility-bar { display: none !important; }
      .document-page {
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
        border: none !important;
        border-radius: 0 !important;
      }
    }
  </style>
</head>
<body>

  <!-- 상단 보조 네비게이션 툴바 -->
  <div class="utility-bar">
    <a href="../index.html" class="back-btn">
      <span>←</span> 보고서 포털 메인으로 돌아가기
    </a>
    <div class="utility-actions">
      <button type="button" class="btn-action" onclick="window.print()">🖨️ 공문서 인쇄 / PDF 저장</button>
      <button type="button" class="btn-action" onclick="document.body.style.fontSize='16px'">가+</button>
      <button type="button" class="btn-action" onclick="document.body.style.fontSize='14.5px'">가-</button>
    </div>
  </div>

  <!-- 메인 공문서 페이퍼 본체 -->
  <article class="document-page">

    <!-- 1. 문서 헤더 정보 (결재X, 기안부서X, 문서등급X - 오로지 날짜와 문서번호만 표기) -->
    <div class="doc-meta-bar">
      <div class="meta-item"><span class="meta-label">문서번호:</span> <span class="meta-val">이어봄-00-05</span></div>
      <div class="meta-item"><span class="meta-label">등록일자:</span> <span class="meta-val">2026. 09. 22.</span></div>
    </div>

    <!-- 2. 문서 제목 영역 -->
    <header class="doc-header-area">
      <h1 class="doc-main-title">이어봄 DB 요구사항 및 테이블 사전 (14개 스키마)</h1>
      <p class="doc-sub-title">eobom_db (PostgreSQL + Prisma ORM) 전체 14개 핵심 테이블의 데이터 컬럼 사전 및 관계 명세</p>
    </header>

    ${bodyContent}

    <!-- 3. 문서 하단 종결부 -->
    <footer class="doc-footer">
      <div class="doc-footer-logo">🌿 이어봄(Eobom) 토탈 라이프케어 플랫폼</div>
      <div>SSOT 정본 최신화 완료 (v1.0)</div>
    </footer>

  </article>

</body>
</html>`;

fs.writeFileSync(HTML_PATH, fullHtml, 'utf-8');
console.log('Successfully regenerated HTML report with TOC index at:', HTML_PATH);
