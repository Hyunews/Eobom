const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const DOCS_DIR = path.join(ROOT, 'docs');
const REPORTS_DIR = path.join(ROOT, 'reports');

// Mapping dictionary from docs relative path to reports relative path
const REPORT_MAPPINGS = [
  // 00. 핵심플랫폼
  { md: '00_핵심플랫폼/00-01_신규_6대_기획_아이디어_및_로드맵.md', html: '00_핵심플랫폼/00-01_이어봄_신규_6대_기획_아이디어_및_로드맵.html' },
  { md: '00_핵심플랫폼/00-02_이어봄_서비스_개요_및_기획서.md', html: '00_핵심플랫폼/00-02_이어봄_서비스_개요_및_기획서.html' },
  { md: '00_핵심플랫폼/00-03_시스템_아키텍처_및_흐름도.md', html: '00_핵심플랫폼/00-03_이어봄_시스템_아키텍처_및_흐름도.html' },
  { md: '00_핵심플랫폼/00-04_기능_및_API_명세서.md', html: '00_핵심플랫폼/00-04_이어봄_기능_및_API_명세서.html' },
  { md: '00_핵심플랫폼/00-05_DB_요구사항_및_테이블_사전.md', html: '00_핵심플랫폼/00-05_이어봄_DB_요구사항_및_테이블_사전.html', isDbDoc: true },
  { md: '00_핵심플랫폼/00-06_화면_설계서_및_와이어프레임.md', html: '00_핵심플랫폼/00-06_이어봄_화면_설계서_및_와이어프레임.html' },
  { md: '00_핵심플랫폼/00-07_구현_난관_및_기술_솔루션.md', html: '00_핵심플랫폼/00-07_이어봄_구현_난관_및_기술_솔루션.html' },
  { md: '00_핵심플랫폼/00-08_소셜로그인_및_계정통합_명세서.md', html: '00_핵심플랫폼/00-08_이어봄_소셜로그인_및_계정통합_명세서.html' },
  { md: '00_핵심플랫폼/00-09_디자인_시스템_및_스타일_가이드.md', html: '00_핵심플랫폼/00-09_이어봄_디자인_시스템_및_스타일_가이드.html' },
  { md: '00_핵심플랫폼/00-10_URL_라우팅_HistoryRouter_전환_구현_메모.md', html: '00_핵심플랫폼/00-10_이어봄_URL_라우팅_HistoryRouter_전환.html' },
  { md: '00_핵심플랫폼/00-11_백엔드_DB_배포_및_인프라_전략_결정서.md', html: '00_핵심플랫폼/00-11_이어봄_백엔드_DB_배포_및_인프라_전략_결정서.html' },
  { md: '00_핵심플랫폼/00-12_사망_이벤트_고인계정_유족연동_공통기반_기획서.md', html: '00_핵심플랫폼/00-12_이어봄_사망_이벤트_고인계정_유족연동_공통기반_기획서.html' },
  { md: '00_핵심플랫폼/00-13_추모관_공유링크_모델_결정서.md', html: '00_핵심플랫폼/00-13_이어봄_추모관_공유링크_모델_결정서.html' },

  // 01. 장사시설 매칭
  { md: '01_장사시설_매칭/01-01_장례_묘지_매칭_기능_명세서.md', html: '01_장사시설_매칭/01-01_장례_묘지_매칭_기능_명세서.html' },
  { md: '01_장사시설_매칭/01-02_공공데이터_및_API_상업적_이용_법률_검토서.md', html: '01_장사시설_매칭/01-02_공공데이터_및_API_상업적_이용_법률_검토서.html' },
  { md: '01_장사시설_매칭/01-03_장례_견적비교_데이터한계_극복_3대_기획안.md', html: '01_장사시설_매칭/01-03_이어봄_장례_견적비교_데이터한계_극복_3대_기획안.html' },
  { md: '01_장사시설_매칭/01-04_장례_답사예약_vs_직통전화_UX_및_수익모델_검토서.md', html: '01_장사시설_매칭/01-04_이어봄_장례_답사예약_vs_직통전화_검토보고서.html' },
  { md: '01_장사시설_매칭/01-05_장사시설_사업자회원_및_리드_수수료_정산_명세서.md', html: '01_장사시설_매칭/01-05_이어봄_장사시설_사업자회원_및_리드_수수료_정산_명세서.html' },
  { md: '01_장사시설_매칭/01-06_시설_태그_분류_체계_명세서.md', html: '01_장사시설_매칭/01-06_이어봄_시설_태그_분류_체계.html' },

  // 02. 전문가 매칭
  { md: '02_전문가_매칭/02-01_전문가상담_도메인_상업화_및_구체화_명세서.md', html: '02_전문가_매칭/02-01_이어봄_전문가상담_도메인_상업화_보고서.html' },
  { md: '02_전문가_매칭/02-02_전문가_계정_체계_구현_메모.md', html: '02_전문가_매칭/02-02_이어봄_전문가_계정_체계_구현_메모.html' },
  { md: '02_전문가_매칭/02-03_전문가_공개노출_및_상담신청_명세서.md', html: '02_전문가_매칭/02-03_이어봄_전문가_공개노출_및_상담신청_명세서.html' },

  // 03. 현물 유품 수거 (2026-08-12 재편 — 구 03_디지털_유품_추모관에서 분리)
  { md: '03_현물_유품_수거/03-01_현물_유품_수거_계정형태_보류_메모.md', html: '03_현물_유품_수거/03-01_이어봄_현물_유품_수거_계정형태_보류_메모.html' },

  // 04. 디지털 자산 정산 (구 03-02 분할본 — 계정 정리 축)
  { md: '04_디지털_자산_정산/04-01_디지털_계정_정리_명세서.md', html: '04_디지털_자산_정산/04-01_이어봄_디지털_계정_정리_명세서.html' },

  // 05. 디지털 추모관 (구 03-02 분할본 — 추모관 축 + 구 03-03)
  { md: '05_디지털_추모관/05-01_온라인_추모관_명세서.md', html: '05_디지털_추모관/05-01_이어봄_온라인_추모관_명세서.html' },
  { md: '05_디지털_추모관/05-02_디지털_추모관_도메인_기획서.md', html: '05_디지털_추모관/05-02_이어봄_디지털_추모관_도메인_기획서.html' },

  // 06. 엔딩노트 유언 (구 05)
  { md: '06_엔딩노트_유언/06-01_관리자_열람범위_설계_메모.md', html: '06_엔딩노트_유언/06-01_이어봄_관리자_열람범위_설계_메모.html' },

  // 07. 상중 행정 케어 — 문서 0건

  // 08. 비즈니스 분석 (구 06)
  { md: '08_비즈니스_분석/08-01_경쟁_서비스_분석_보고서.md', html: '08_비즈니스_분석/08-01_이어봄_경쟁_서비스_분석_보고서.html' },
];

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function mdTableToHtml(markdown) {
  const lines = markdown.trim().split('\n');
  if (lines.length < 2) return '';

  const parseRow = (line) => {
    const safeLine = line.replace(/\\\|/g, '___PIPE___');
    return safeLine.split('|').map(s => s.trim().replace(/___PIPE___/g, '|')).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
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
    row.forEach(cell => {
      let cellHtml = escapeHtml(cell)
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/PK/g, '<span class="tag pk">PK</span>')
        .replace(/FK → ([A-Za-z0-9_.]+)/g, '<span class="tag fk">FK → $1</span>')
        .replace(/UNIQUE/g, '<span class="tag uk">UNIQUE</span>')
        .replace(/✅/g, '<span class="tag green">✅ 구현</span>')
        .replace(/⬜/g, '<span class="tag gray">⬜ 계획</span>')
        .replace(/🔶/g, '<span class="tag orange">🔶 진행</span>');
      html += `<td>${cellHtml}</td>`;
    });
    html += '</tr>';
  });

  html += '</tbody></table></div>';
  return html;
}

function genericMdToHtml(md) {
  const lines = md.split(/\r?\n/);
  let html = '';
  let inTable = false;
  let tableBuffer = [];
  let inCode = false;
  let codeBuffer = [];

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
      html += `<h1>${escapeHtml(line.slice(2))}</h1>\n`;
    } else if (line.startsWith('## ')) {
      html += `<h2 class="section-title">${escapeHtml(line.slice(3))}</h2>\n`;
    } else if (line.startsWith('### ')) {
      html += `<h3 class="subsection-title">${escapeHtml(line.slice(4))}</h3>\n`;
    } else if (line.startsWith('#### ')) {
      html += `<h4 class="h4-title">${escapeHtml(line.slice(5))}</h4>\n`;
    } else if (line.startsWith('> ')) {
      let blockquoteText = escapeHtml(line.slice(2))
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      html += `<blockquote class="info-quote">${blockquoteText}</blockquote>\n`;
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      let listText = escapeHtml(line.slice(2))
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      html += `<ul><li>${listText}</li></ul>\n`;
    } else if (line.trim() === '---') {
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

  return html;
}

function buildFullHtmlPage(title, subtitle, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} - 이어봄 기획 명세서</title>
  <style>
    :root {
      --primary: #1A2B4C;
      --secondary: #5B7065;
      --accent: #D4A359;
      --bg: #FBF9F5;
      --surface: #FFFFFF;
      --text: #1E293B;
      --text-muted: #64748B;
      --border: #E2E8F0;
      --code-bg: #0F172A;
      --code-text: #F8FAFC;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      line-height: 1.65;
      padding: 2rem 1rem;
    }
    .container {
      max-width: 1140px;
      margin: 0 auto;
      background-color: var(--surface);
      padding: 3rem;
      border-radius: 24px;
      box-shadow: 0 20px 40px rgba(26, 43, 76, 0.08);
      border: 1px solid var(--border);
    }
    .header {
      border-bottom: 3px solid var(--accent);
      padding-bottom: 1.5rem;
      margin-bottom: 2.5rem;
    }
    .badge {
      display: inline-block;
      background-color: var(--primary);
      color: #FFF;
      font-size: 0.85rem;
      font-weight: 700;
      padding: 0.3rem 0.8rem;
      border-radius: 20px;
      margin-bottom: 0.8rem;
    }
    h1 {
      font-size: 2.1rem;
      color: var(--primary);
      margin-bottom: 0.5rem;
      font-weight: 800;
    }
    .subtitle {
      color: var(--text-muted);
      font-size: 1.05rem;
    }
    .section-title {
      font-size: 1.5rem;
      color: var(--primary);
      margin: 2.5rem 0 1.2rem 0;
      padding-left: 0.8rem;
      border-left: 5px solid var(--secondary);
      font-weight: 700;
    }
    .subsection-title {
      font-size: 1.25rem;
      color: var(--primary);
      margin: 1.8rem 0 0.8rem 0;
      font-weight: 700;
    }
    .h4-title {
      font-size: 1.05rem;
      color: var(--secondary);
      margin: 1.2rem 0 0.6rem 0;
      font-weight: 700;
    }
    .info-quote {
      background: #F1F5F9;
      border-left: 4px solid var(--accent);
      padding: 0.9rem 1.2rem;
      margin: 1rem 0;
      border-radius: 6px;
      font-size: 0.95rem;
      color: #334155;
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
      margin: 1rem 0 1.5rem 0;
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
      margin: 1.2rem 0 1.8rem 0;
      border-radius: 12px;
      border: 1px solid var(--border);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.92rem;
      background: #FFFFFF;
    }
    th {
      background-color: var(--primary);
      color: #FFFFFF;
      padding: 0.8rem 1rem;
      text-align: left;
      font-weight: 600;
    }
    td {
      padding: 0.8rem 1rem;
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
    .tag.green { background-color: #DCFCE7; color: #166534; }
    .tag.gray { background-color: #F1F5F9; color: #475569; }
    .tag.orange { background-color: #FFEDD5; color: #9A3412; }
    .tag.pk { background-color: #FEE2E2; color: #991B1B; }
    .tag.fk { background-color: #DBEAFE; color: #1E40AF; }
    .tag.uk { background-color: #DCFCE7; color: #166534; }
    p { margin-bottom: 0.9rem; color: #334155; }
    ul, ol { margin-bottom: 1rem; padding-left: 1.4rem; color: #334155; }
    li { margin-bottom: 0.4rem; }
    .divider {
      border: none;
      border-top: 1px solid var(--border);
      margin: 2.5rem 0;
    }
    .nav-bar {
      margin-bottom: 2rem;
      display: flex;
      gap: 1rem;
      align-items: center;
    }
    .nav-link {
      color: var(--primary);
      text-decoration: none;
      font-weight: 600;
      font-size: 0.95rem;
    }
    .nav-link:hover {
      color: var(--accent);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="nav-bar">
      <a href="../index.html" class="nav-link">← 보고서 메인 포털로 돌아가기</a>
    </div>
    <div class="header">
      <span class="badge">SSOT 정본 동기화 완료</span>
      <h1>${escapeHtml(title)}</h1>
      ${subtitle ? `<p class="subtitle">${escapeHtml(subtitle)}</p>` : ''}
    </div>
    ${bodyHtml}
  </div>
</body>
</html>`;
}

console.log('Starting full HTML report regeneration from docs...');

let generatedCount = 0;

REPORT_MAPPINGS.forEach(mapping => {
  const mdPath = path.join(DOCS_DIR, mapping.md);
  const htmlPath = path.join(REPORTS_DIR, mapping.html);

  if (mapping.isDbDoc) {
    // 00-05 DB doc is built by specialized script build_db_report.js
    require('./build_db_report.js');
    console.log(`[DB Doc] ${mapping.html} regenerated via build_db_report.js`);
    generatedCount++;
    return;
  }

  if (!fs.existsSync(mdPath)) {
    console.warn(`[Skip] Markdown file not found: ${mdPath}`);
    return;
  }

  const mdContent = fs.readFileSync(mdPath, 'utf-8');
  const lines = mdContent.split(/\r?\n/);
  
  let title = path.basename(mapping.md, '.md');
  let subtitle = '';

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('# ')) {
      title = lines[i].slice(2).trim();
      break;
    }
  }

  const bodyHtml = genericMdToHtml(mdContent);
  const fullHtml = buildFullHtmlPage(title, subtitle, bodyHtml);

  // Ensure target directory exists
  const targetDir = path.dirname(htmlPath);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  fs.writeFileSync(htmlPath, fullHtml, 'utf-8');
  console.log(`[Generated] ${mapping.html}`);
  generatedCount++;
});

console.log(`\nSuccessfully regenerated ${generatedCount} HTML reports in reports/!`);
