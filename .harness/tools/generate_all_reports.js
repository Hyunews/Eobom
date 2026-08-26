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

  { md: '00_핵심플랫폼/00-14_사장님_논의_안건_정리.md', html: '00_핵심플랫폼/00-14_이어봄_사장님_논의_안건_정리.html' },
  { md: '00_핵심플랫폼/00-15_회귀_테스트_도입_검토서.md', html: '00_핵심플랫폼/00-15_이어봄_회귀_테스트_도입_검토서.html' },
  { md: '00_핵심플랫폼/00-16_L3_사망확인_서류_검토서.md', html: '00_핵심플랫폼/00-16_이어봄_L3_사망확인_서류_검토서.html' },
  { md: '00_핵심플랫폼/00-17_개인정보_인증_및_국외이전_대응안.md', html: '00_핵심플랫폼/00-17_이어봄_개인정보_인증_및_국외이전_대응안.html' },
  { md: '00_핵심플랫폼/00-18_개인정보처리방침_및_이용약관_기획서.md', html: '00_핵심플랫폼/00-18_이어봄_개인정보처리방침_및_이용약관_기획서.html' },
  { md: '00_핵심플랫폼/00-19_개인정보처리방침_초안.md', html: '00_핵심플랫폼/00-19_이어봄_개인정보처리방침_초안.html' },
  { md: '00_핵심플랫폼/00-20_추모관_보존기간_및_폐쇄정책_검토서.md', html: '00_핵심플랫폼/00-20_이어봄_추모관_보존기간_및_폐쇄정책_검토서.html' },
  { md: '00_핵심플랫폼/00-21_서비스_이용약관_초안.md', html: '00_핵심플랫폼/00-21_이어봄_서비스_이용약관_초안.html' },
  { md: '00_핵심플랫폼/00-22_법적_요구사항_체크리스트.md', html: '00_핵심플랫폼/00-22_이어봄_법적_요구사항_체크리스트.html' },
  { md: '00_핵심플랫폼/00-23_메인화면_진입구조_개편_검토서.md', html: '00_핵심플랫폼/00-23_이어봄_메인화면_진입구조_개편_검토서.html' },
  { md: '00_핵심플랫폼/00-24_프론트엔드_UIUX_개선_제안서.md', html: '00_핵심플랫폼/00-24_이어봄_프론트엔드_UIUX_디자인_개선_보고서.html' },
  { md: '00_핵심플랫폼/00-25_인터페이스_템플릿_기술분석_및_메인적용방안.md', html: '00_핵심플랫폼/00-25_이어봄_인터페이스_템플릿_기술분석_및_메인적용_보고서.html' },
  { md: '00_핵심플랫폼/00-26_모드별_네비게이션_개편_검토서.md', html: '00_핵심플랫폼/00-26_이어봄_모드별_네비게이션_개편_검토서.html' },
  { md: '00_핵심플랫폼/00-27_생전_가족지정_및_유족연결_기획서.md', html: '00_핵심플랫폼/00-27_이어봄_생전_가족지정_및_유족연결_기획서.html' },
  { md: '00_핵심플랫폼/00-28_회원_프로필_정보수집_기획서.md', html: '00_핵심플랫폼/00-28_이어봄_회원_프로필_정보수집_기획서.html' },
  { md: '00_핵심플랫폼/00-29_모바일_대응_전략_검토서.md', html: '00_핵심플랫폼/00-29_이어봄_모바일_대응_전략_검토서.html' },
  { md: '00_핵심플랫폼/00-30_생애주기_연결모델_검토서.md', html: '00_핵심플랫폼/00-30_이어봄_생애주기_연결모델_검토서.html' },

  // 02. 전문가 매칭 — 생전 축 (2026-08-13 신설)
  { md: '02_전문가_매칭/02-04_전문가_매칭_생전_WellDying_축_기획서.md', html: '02_전문가_매칭/02-04_이어봄_전문가_매칭_생전_WellDying_축_기획서.html' },
  { md: '02_전문가_매칭/02-05_전문가_직역_확장_및_상황기반_진입_기획서.md', html: '02_전문가_매칭/02-05_이어봄_전문가_직역_확장_및_상황기반_진입_기획서.html' },

  // 06. 엔딩노트 — 법적 효력 (2026-08-13 신설)
  { md: '06_엔딩노트_유언/06-02_엔딩노트_법적효력_확보_방안_결정서.md', html: '06_엔딩노트_유언/06-02_이어봄_엔딩노트_법적효력_확보_방안_결정서.html' },
  { md: '06_엔딩노트_유언/06-03_엔딩노트_열람통제_및_예외열람_정책.md', html: '06_엔딩노트_유언/06-03_이어봄_엔딩노트_열람통제_및_예외열람_정책.html' },
  { md: '06_엔딩노트_유언/06-04_엔딩노트_보관함_실구현_기획서.md', html: '06_엔딩노트_유언/06-04_이어봄_엔딩노트_보관함_실구현_기획서.html' },
  { md: '06_엔딩노트_유언/06-05_유족메시지_보관함_도메인분리_기획서.md', html: '06_엔딩노트_유언/06-05_이어봄_유족메시지_보관함_도메인분리_기획서.html' },

  // 07. 상중 행정 케어 (2026-08-13 신설)
  { md: '07_상중_행정_케어/07-01_상중_행정_케어_도메인_기획서.md', html: '07_상중_행정_케어/07-01_이어봄_상중_행정_케어_도메인_기획서.html' },
  { md: '07_상중_행정_케어/07-02_사망후_법정기한_체크리스트_명세서.md', html: '07_상중_행정_케어/07-02_이어봄_사망후_법정기한_체크리스트_명세서.html' },
  { md: '07_상중_행정_케어/07-03_모바일_부고장_카카오톡_전송_구현_기획서.md', html: '07_상중_행정_케어/07-03_이어봄_모바일_부고장_카카오톡_전송_구현_기획서.html' },

  // 03. 현물 유품 수거 (2026-08-12 재편 — 구 03_디지털_유품_추모관에서 분리)
  { md: '03_현물_유품_수거/03-01_현물_유품_수거_계정형태_보류_메모.md', html: '03_현물_유품_수거/03-01_이어봄_현물_유품_수거_계정형태_보류_메모.html' },
  { md: '03_현물_유품_수거/03-02_현물_유품_수거_도메인_기획서.md', html: '03_현물_유품_수거/03-02_이어봄_현물_유품_수거_도메인_기획서.html' },
  { md: '03_현물_유품_수거/03-03_유품수거_업체_데이터_확보_방안_결정서.md', html: '03_현물_유품_수거/03-03_이어봄_유품수거_업체_데이터_확보_방안_결정서.html' },

  // 04. 디지털 자산 정산 (구 03-02 분할본 — 계정 정리 축)
  { md: '04_디지털_자산_정산/04-01_디지털_계정_정리_명세서.md', html: '04_디지털_자산_정산/04-01_이어봄_디지털_계정_정리_명세서.html' },
  { md: '04_디지털_자산_정산/04-02_생전위임_문서화_및_대행_가능범위_검토서.md', html: '04_디지털_자산_정산/04-02_이어봄_생전위임_문서화_및_대행_가능범위_검토서.html' },

  // 05. 디지털 추모관 (구 03-02 분할본 — 추모관 축 + 구 03-03)
  { md: '05_디지털_추모관/05-01_온라인_추모관_명세서.md', html: '05_디지털_추모관/05-01_이어봄_온라인_추모관_명세서.html' },
  { md: '05_디지털_추모관/05-02_디지털_추모관_도메인_기획서.md', html: '05_디지털_추모관/05-02_이어봄_디지털_추모관_도메인_기획서.html' },

  // 06. 엔딩노트 유언 (구 05)
  { md: '06_엔딩노트_유언/06-01_관리자_열람범위_설계_메모.md', html: '06_엔딩노트_유언/06-01_이어봄_관리자_열람범위_설계_메모.html' },

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

function formatInline(text) {
  if (!text) return '';
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([\s\S]+?)\*\*/g, '<strong>$1</strong>')
    .replace(/~~([\s\S]+?)~~/g, '<del>$1</del>')
    .replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
    .replace(/\[([\s\S]+?)\]\(([^)]+)\)/g, '<a href="$2" class="md-link">$1</a>')
    .replace(/PK/g, '<span class="tag pk">PK</span>')
    .replace(/FK → ([A-Za-z0-9_.]+)/g, '<span class="tag fk">FK → $1</span>')
    .replace(/UNIQUE/g, '<span class="tag uk">UNIQUE</span>')
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

    // Fenced code blocks
    if (line.trim().startsWith('```')) {
      const lang = line.trim().slice(3).trim();
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      html += `<pre><code${lang ? ` class="language-${lang}"` : ''}>${escapeHtml(codeLines.join('\n'))}</code></pre>\n`;
      continue;
    }

    // Blockquotes (contiguous lines starting with >)
    if (line.trim().startsWith('>')) {
      const quoteLines = [];
      let alertClass = '';
      while (i < lines.length && (lines[i].trim().startsWith('>') || (lines[i].trim() !== '' && quoteLines.length > 0 && lines[i].startsWith('  ')))) {
        let content = lines[i].trim();
        if (content.startsWith('>')) {
          content = content.replace(/^>\s?/, '');
        }
        quoteLines.push(content);
        i++;
      }
      const rawFirst = quoteLines.find(l => l.trim().length > 0) || '';
      if (rawFirst.includes('⚠️') || rawFirst.includes('[!WARNING]')) alertClass = 'warn';
      else if (rawFirst.includes('🔴') || rawFirst.includes('[!CAUTION]')) alertClass = 'danger';
      else if (rawFirst.includes('✅') || rawFirst.includes('🔵')) alertClass = 'info';

      const innerHtml = genericMdToHtml(quoteLines.join('\n'), { isNested: true });
      html += `<blockquote class="info-quote${alertClass ? ' ' + alertClass : ''}">\n${innerHtml}</blockquote>\n`;
      continue;
    }

    // Tables
    if (line.trim().startsWith('|')) {
      const tableLines = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }
      html += parseTable(tableLines) + '\n';
      continue;
    }

    // Lists (unordered, ordered, task list)
    const taskMatch = line.match(/^(\s*)[-*+]\s+\[([ xX])\]\s+(.*)$/);
    const unordMatch = line.match(/^(\s*)[-*+]\s+(.*)$/);
    const ordMatch = line.match(/^(\s*)\d+\.\s+(.*)$/);

    if (taskMatch || unordMatch || ordMatch) {
      const isOrdered = !taskMatch && ordMatch;
      const tag = isOrdered ? 'ol' : 'ul';
      html += `<${tag}>\n`;

      while (i < lines.length) {
        const cur = lines[i];
        const tMatch = cur.match(/^(\s*)[-*+]\s+\[([ xX])\]\s+(.*)$/);
        const uMatch = cur.match(/^(\s*)[-*+]\s+(.*)$/);
        const oMatch = cur.match(/^(\s*)\d+\.\s+(.*)$/);

        if (tMatch) {
          const checked = tMatch[2].toLowerCase() === 'x';
          html += `<li class="task-item${checked ? ' checked' : ''}"><span class="task-box${checked ? ' checked' : ''}">${checked ? '☑' : '☐'}</span> ${formatInline(tMatch[3])}</li>\n`;
          i++;
        } else if (uMatch && !isOrdered) {
          html += `<li>${formatInline(uMatch[2])}</li>\n`;
          i++;
        } else if (oMatch && isOrdered) {
          html += `<li>${formatInline(oMatch[2])}</li>\n`;
          i++;
        } else {
          break;
        }
      }

      html += `</${tag}>\n`;
      continue;
    }

    // Headings
    if (line.startsWith('# ')) {
      if (isFirstH1) {
        isFirstH1 = false;
        i++;
        continue;
      }
      html += `<h1>${formatInline(line.slice(2))}</h1>\n`;
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      const headingText = line.slice(3);
      const shouldBreak = /^(?:[⚡🔗💰🏢📋🕐]\s*)?(2|3|4|6|8|9)\./.test(headingText.trim());
      if (shouldBreak && !options.isNested) {
        html += `<div class="page-break"></div>\n<h2 class="section-title">${formatInline(headingText)}</h2>\n`;
      } else {
        html += `<h2 class="section-title">${formatInline(headingText)}</h2>\n`;
      }
      i++;
      continue;
    }
    if (line.startsWith('### ')) {
      html += `<h3 class="subsection-title">${formatInline(line.slice(4))}</h3>\n`;
      i++;
      continue;
    }
    if (line.startsWith('#### ')) {
      html += `<h4 class="h4-title">${formatInline(line.slice(5))}</h4>\n`;
      i++;
      continue;
    }
    if (line.startsWith('##### ')) {
      html += `<h5 class="h5-title">${formatInline(line.slice(6))}</h5>\n`;
      i++;
      continue;
    }

    // Dividers
    if (line.trim() === '---' || line.trim() === '***' || line.trim() === '___') {
      html += '<hr class="divider"/>\n';
      i++;
      continue;
    }

    // Blank lines
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Contiguous paragraph lines
    const pLines = [];
    while (i < lines.length) {
      const cur = lines[i];
      if (cur.trim() === '' ||
          cur.trim().startsWith('```') ||
          cur.trim().startsWith('>') ||
          cur.trim().startsWith('|') ||
          cur.match(/^(\s*)[-*+]\s+/) ||
          cur.match(/^(\s*)\d+\.\s+/) ||
          cur.match(/^#{1,6}\s+/) ||
          cur.trim() === '---' || cur.trim() === '***' || cur.trim() === '___') {
        break;
      }
      pLines.push(cur.trim());
      i++;
    }
    if (pLines.length > 0) {
      const pText = pLines.join('\n');
      html += `<p>${formatInline(pText).replace(/\n/g, '<br/>\n')}</p>\n`;
    }
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
    .h5-title {
      font-size: 0.95rem;
      color: var(--text-muted);
      margin: 0.8rem 0 0.4rem 0;
      font-weight: 700;
    }
    .info-quote {
      background: #F8FAFC;
      border-left: 4px solid var(--accent);
      padding: 1.2rem 1.5rem;
      margin: 1.5rem 0;
      border-radius: 8px;
      font-size: 0.95rem;
      color: #334155;
    }
    .info-quote.warn {
      background: #FFFBEB;
      border-left-color: #F59E0B;
      color: #92400E;
    }
    .info-quote.danger {
      background: #FEF2F2;
      border-left-color: #EF4444;
      color: #991B1B;
    }
    .info-quote.info {
      background: #EFF6FF;
      border-left-color: #3B82F6;
      color: #1E40AF;
    }
    .info-quote .section-title {
      font-size: 1.25rem;
      margin: 0.5rem 0 1rem 0;
      border-left: none;
      padding-left: 0;
    }
    .info-quote .subsection-title {
      font-size: 1.1rem;
      margin: 0.8rem 0 0.5rem 0;
    }
    .info-quote .table-container {
      margin: 0.8rem 0;
      background: #FFFFFF;
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
      line-height: 1.5;
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
      font-size: 0.78rem;
      font-weight: 700;
      line-height: 1.3;
      vertical-align: middle;
      margin: 0 0.15rem;
    }
    .tag.green { background-color: #DCFCE7; color: #166534; border: 1px solid #BBF7D0; }
    .tag.gray { background-color: #F1F5F9; color: #475569; border: 1px solid #E2E8F0; }
    .tag.orange { background-color: #FFEDD5; color: #9A3412; border: 1px solid #FED7AA; }
    .tag.red { background-color: #FEE2E2; color: #991B1B; border: 1px solid #FECACA; }
    .tag.blue { background-color: #DBEAFE; color: #1E40AF; border: 1px solid #BFDBFE; }
    .tag.gold { background-color: #FEF3C7; color: #92400E; border: 1px solid #FDE68A; }
    .tag.warn { background-color: #FEF3C7; color: #B45309; border: 1px solid #FDE68A; }
    .tag.pause { background-color: #EDE9FE; color: #5B21B6; border: 1px solid #DDD6FE; }
    .tag.red-cross { background-color: #FFE4E6; color: #9F1239; border: 1px solid #FECDD3; }
    .tag.blue-sync { background-color: #E0F2FE; color: #0369A1; border: 1px solid #BAE6FD; }
    .tag.lock, .tag.key { background-color: #F3E8FF; color: #6B21A8; border: 1px solid #E9D5FF; }
    .tag.pk { background-color: #FEE2E2; color: #991B1B; font-family: monospace; }
    .tag.fk { background-color: #DBEAFE; color: #1E40AF; font-family: monospace; }
    .tag.uk { background-color: #DCFCE7; color: #166534; font-family: monospace; }
    .task-item {
      list-style: none;
      display: flex;
      align-items: baseline;
      gap: 0.5rem;
      margin-bottom: 0.4rem;
    }
    .task-box {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1.1rem;
      height: 1.1rem;
      border: 1.5px solid #94A3B8;
      border-radius: 4px;
      font-size: 0.75rem;
      color: #64748B;
      background: #FFFFFF;
      flex-shrink: 0;
      user-select: none;
    }
    .task-box.checked {
      background: var(--primary);
      border-color: var(--primary);
      color: #FFFFFF;
      font-weight: bold;
    }
    .task-item.checked {
      color: #64748B;
    }
    del {
      color: #94A3B8;
      text-decoration: line-through;
    }
    .md-link {
      color: var(--accent);
      text-decoration: underline;
      font-weight: 500;
    }
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
    @page {
      size: A4 portrait;
      margin: 15mm 14mm 18mm 14mm;
    }
    @media print {
      html, body {
        background-color: #ffffff !important;
        color: #1e293b !important;
        font-size: 9.5pt !important;
        line-height: 1.5 !important;
        padding: 0 !important;
        margin: 0 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .container {
        max-width: 100% !important;
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        border: none !important;
        box-shadow: none !important;
        background: transparent !important;
        border-radius: 0 !important;
      }
      .nav-bar { display: none !important; }
      .header {
        border-bottom: 2px solid var(--accent) !important;
        padding-bottom: 0.6rem !important;
        margin-bottom: 1.2rem !important;
        page-break-after: avoid !important;
        break-after: avoid !important;
      }
      h1 {
        font-size: 17pt !important;
        line-height: 1.3 !important;
        margin-bottom: 0.4rem !important;
        color: var(--primary) !important;
      }
      .badge {
        font-size: 8pt !important;
        padding: 0.2rem 0.6rem !important;
        background-color: var(--primary) !important;
        color: #ffffff !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .section-title {
        font-size: 12.5pt !important;
        margin: 1.2rem 0 0.6rem 0 !important;
        padding-left: 0.5rem !important;
        border-left: 4px solid var(--secondary) !important;
        page-break-after: avoid !important;
        break-after: avoid !important;
      }
      .subsection-title {
        font-size: 10.5pt !important;
        margin: 1rem 0 0.5rem 0 !important;
        page-break-after: avoid !important;
        break-after: avoid !important;
      }
      .h4-title {
        font-size: 9.5pt !important;
        margin: 0.8rem 0 0.3rem 0 !important;
        page-break-after: avoid !important;
        break-after: avoid !important;
      }
      .info-quote {
        background: #f8fafc !important;
        border-left: 3px solid var(--accent) !important;
        padding: 0.6rem 0.8rem !important;
        margin: 0.6rem 0 !important;
        font-size: 9pt !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        border-radius: 4px !important;
      }
      .table-container {
        margin: 0.6rem 0 1rem 0 !important;
        border: 1px solid #cbd5e1 !important;
        border-radius: 6px !important;
        overflow: visible !important;
        page-break-inside: auto !important;
        break-inside: auto !important;
      }
      table {
        width: 100% !important;
        font-size: 8.5pt !important;
        border-collapse: collapse !important;
      }
      thead { display: table-header-group !important; }
      tr {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      th {
        background-color: #1a2b4c !important;
        color: #ffffff !important;
        padding: 0.45rem 0.65rem !important;
        font-size: 8.5pt !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      td {
        padding: 0.45rem 0.65rem !important;
        border-bottom: 1px solid #e2e8f0 !important;
      }
      .tag {
        font-size: 7pt !important;
        padding: 0.1rem 0.35rem !important;
        border-radius: 4px !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .divider {
        margin: 1rem 0 !important;
        border-top: 1px solid #e2e8f0 !important;
      }
      .page-break {
        page-break-before: always !important;
        break-before: page !important;
      }
      ul, ol { margin-bottom: 0.5rem !important; }
      li { page-break-inside: avoid !important; break-inside: avoid !important; }
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
