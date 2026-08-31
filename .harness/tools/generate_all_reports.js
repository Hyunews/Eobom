const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const DOCS_DIR = path.join(ROOT, 'docs');
const REPORTS_DIR = path.join(ROOT, 'reports');
const INDEX_HTML_PATH = path.join(REPORTS_DIR, 'index.html');

// Domain metadata configuration for the portal
const DOMAIN_CONFIG = {
  '00_핵심플랫폼': {
    title: '00. 공통 플랫폼 & 코어 기반',
    icon: '🌿',
    badgeClass: 'badge-primary',
    badgeText: '공통 플랫폼'
  },
  '01_장사시설_매칭': {
    title: '01. Domain 01: 장사시설 매칭 (장례·봉안·수목장)',
    icon: '🏛️',
    badgeClass: 'badge-primary',
    badgeText: '장사시설 매칭'
  },
  '02_전문가_매칭': {
    title: '02. Domain 02: 전문가 매칭 (변호사·세무사·행정사·장례지도사)',
    icon: '⚖️',
    badgeClass: 'badge-info',
    badgeText: '전문가 매칭'
  },
  '03_현물_유품_수거': {
    title: '03. Domain 03: 현물 유품 수거 & 특수 청소',
    icon: '📦',
    badgeClass: 'badge-warning',
    badgeText: '유품 수거'
  },
  '04_디지털_자산_정산': {
    title: '04. Domain 04: 디지털 자산 & 계정 정산',
    icon: '💻',
    badgeClass: 'badge-info',
    badgeText: '디지털 정산'
  },
  '05_디지털_추모관': {
    title: '05. Domain 05: 디지털 온라인 추모관',
    icon: '🕯️',
    badgeClass: 'badge-success',
    badgeText: '추모관'
  },
  '06_엔딩노트_유언': {
    title: '06. Domain 06: 엔딩노트 & 디지털 유언·유족 메시지',
    icon: '✍️',
    badgeClass: 'badge-primary',
    badgeText: '엔딩노트'
  },
  '07_상중_행정_케어': {
    title: '07. Domain 07: 상중 행정 케어 & 모바일 부고장',
    icon: '🛡️',
    badgeClass: 'badge-success',
    badgeText: '상중 행정'
  },
  '08_비즈니스_분석': {
    title: '08. Domain 08: 비즈니스 & 경쟁사 분석',
    icon: '📊',
    badgeClass: 'badge',
    badgeText: '경쟁 분석'
  }
};

// Known custom HTML filenames (to preserve clean backward-compatible URLs)
const KNOWN_HTML_NAMES = {
  '00_핵심플랫폼/00-01_신규_6대_기획_아이디어_및_로드맵.md': '00_핵심플랫폼/00-01_이어봄_신규_6대_기획_아이디어_및_로드맵.html',
  '00_핵심플랫폼/00-02_이어봄_서비스_개요_및_기획서.md': '00_핵심플랫폼/00-02_이어봄_서비스_개요_및_기획서.html',
  '00_핵심플랫폼/00-03_시스템_아키텍처_및_흐름도.md': '00_핵심플랫폼/00-03_이어봄_시스템_아키텍처_및_흐름도.html',
  '00_핵심플랫폼/00-04_기능_및_API_명세서.md': '00_핵심플랫폼/00-04_이어봄_기능_및_API_명세서.html',
  '00_핵심플랫폼/00-05_DB_요구사항_및_테이블_사전.md': '00_핵심플랫폼/00-05_이어봄_DB_요구사항_및_테이블_사전.html',
  '00_핵심플랫폼/00-06_화면_설계서_및_와이어프레임.md': '00_핵심플랫폼/00-06_이어봄_화면_설계서_및_와이어프레임.html',
  '00_핵심플랫폼/00-07_구현_난관_및_기술_솔루션.md': '00_핵심플랫폼/00-07_이어봄_구현_난관_및_기술_솔루션.html',
  '00_핵심플랫폼/00-08_소셜로그인_및_계정통합_명세서.md': '00_핵심플랫폼/00-08_이어봄_소셜로그인_및_계정통합_명세서.html',
  '00_핵심플랫폼/00-09_디자인_시스템_및_스타일_가이드.md': '00_핵심플랫폼/00-09_이어봄_디자인_시스템_및_스타일_가이드.html',
  '00_핵심플랫폼/00-10_URL_라우팅_HistoryRouter_전환_구현_메모.md': '00_핵심플랫폼/00-10_이어봄_URL_라우팅_HistoryRouter_전환.html',
  '00_핵심플랫폼/00-11_백엔드_DB_배포_및_인프라_전략_결정서.md': '00_핵심플랫폼/00-11_이어봄_백엔드_DB_배포_및_인프라_전략_결정서.html',
  '00_핵심플랫폼/00-12_사망_이벤트_고인계정_유족연동_공통기반_기획서.md': '00_핵심플랫폼/00-12_이어봄_사망_이벤트_고인계정_유족연동_공통기반_기획서.html',
  '00_핵심플랫폼/00-13_추모관_공유링크_모델_결정서.md': '00_핵심플랫폼/00-13_이어봄_추모관_공유링크_모델_결정서.html',
  '00_핵심플랫폼/00-14_사장님_논의_안건_정리.md': '00_핵심플랫폼/00-14_이어봄_사장님_논의_안건_정리.html',
  '00_핵심플랫폼/00-15_회귀_테스트_도입_검토서.md': '00_핵심플랫폼/00-15_이어봄_회귀_테스트_도입_검토서.html',
  '00_핵심플랫폼/00-16_L3_사망확인_서류_검토서.md': '00_핵심플랫폼/00-16_이어봄_L3_사망확인_서류_검토서.html',
  '00_핵심플랫폼/00-17_개인정보_인증_및_국외이전_대응안.md': '00_핵심플랫폼/00-17_이어봄_개인정보_인증_및_국외이전_대응안.html',
  '00_핵심플랫폼/00-18_개인정보처리방침_및_이용약관_기획서.md': '00_핵심플랫폼/00-18_이어봄_개인정보처리방침_및_이용약관_기획서.html',
  '00_핵심플랫폼/00-19_개인정보처리방침_초안.md': '00_핵심플랫폼/00-19_이어봄_개인정보처리방침_초안.html',
  '00_핵심플랫폼/00-20_추모관_보존기간_및_폐쇄정책_검토서.md': '00_핵심플랫폼/00-20_이어봄_추모관_보존기간_및_폐쇄정책_검토서.html',
  '00_핵심플랫폼/00-21_서비스_이용약관_초안.md': '00_핵심플랫폼/00-21_이어봄_서비스_이용약관_초안.html',
  '00_핵심플랫폼/00-22_법적_요구사항_체크리스트.md': '00_핵심플랫폼/00-22_이어봄_법적_요구사항_체크리스트.html',
  '00_핵심플랫폼/00-23_메인화면_진입구조_개편_검토서.md': '00_핵심플랫폼/00-23_이어봄_메인화면_진입구조_개편_검토서.html',
  '00_핵심플랫폼/00-24_프론트엔드_UIUX_개선_제안서.md': '00_핵심플랫폼/00-24_이어봄_프론트엔드_UIUX_디자인_개선_보고서.html',
  '00_핵심플랫폼/00-25_인터페이스_템플릿_기술분석_및_메인적용방안.md': '00_핵심플랫폼/00-25_이어봄_인터페이스_템플릿_기술분석_및_메인적용_보고서.html',
  '00_핵심플랫폼/00-26_모드별_네비게이션_개편_검토서.md': '00_핵심플랫폼/00-26_이어봄_모드별_네비게이션_개편_검토서.html',
  '00_핵심플랫폼/00-27_생전_가족지정_및_유족연결_기획서.md': '00_핵심플랫폼/00-27_이어봄_생전_가족지정_및_유족연결_기획서.html',
  '00_핵심플랫폼/00-28_회원_프로필_정보수집_기획서.md': '00_핵심플랫폼/00-28_이어봄_회원_프로필_정보수집_기획서.html',
  '00_핵심플랫폼/00-29_모바일_대응_전략_검토서.md': '00_핵심플랫폼/00-29_이어봄_모바일_대응_전략_검토서.html',
  '00_핵심플랫폼/00-30_생애주기_연결모델_검토서.md': '00_핵심플랫폼/00-30_이어봄_생애주기_연결모델_검토서.html',
  '01_장사시설_매칭/01-01_장례_묘지_매칭_기능_명세서.md': '01_장사시설_매칭/01-01_장례_묘지_매칭_기능_명세서.html',
  '01_장사시설_매칭/01-02_공공데이터_및_API_상업적_이용_법률_검토서.md': '01_장사시설_매칭/01-02_공공데이터_및_API_상업적_이용_법률_검토서.html',
  '01_장사시설_매칭/01-03_장례_견적비교_데이터한계_극복_3대_기획안.md': '01_장사시설_매칭/01-03_이어봄_장례_견적비교_데이터한계_극복_3대_기획안.html',
  '01_장사시설_매칭/01-04_장례_답사예약_vs_직통전화_UX_및_수익모델_검토서.md': '01_장사시설_매칭/01-04_이어봄_장례_답사예약_vs_직통전화_검토보고서.html',
  '01_장사시설_매칭/01-05_장사시설_사업자회원_및_리드_수수료_정산_명세서.md': '01_장사시설_매칭/01-05_이어봄_장사시설_사업자회원_및_리드_수수료_정산_명세서.html',
  '01_장사시설_매칭/01-06_시설_태그_분류_체계_명세서.md': '01_장사시설_매칭/01-06_이어봄_시설_태그_분류_체계.html',
  '02_전문가_매칭/02-01_전문가상담_도메인_상업화_및_구체화_명세서.md': '02_전문가_매칭/02-01_이어봄_전문가상담_도메인_상업화_보고서.html',
  '02_전문가_매칭/02-02_전문가_계정_체계_구현_메모.md': '02_전문가_매칭/02-02_이어봄_전문가_계정_체계_구현_메모.html',
  '02_전문가_매칭/02-03_전문가_공개노출_및_상담신청_명세서.md': '02_전문가_매칭/02-03_이어봄_전문가_공개노출_및_상담신청_명세서.html',
  '02_전문가_매칭/02-04_전문가_매칭_생전_WellDying_축_기획서.md': '02_전문가_매칭/02-04_이어봄_전문가_매칭_생전_WellDying_축_기획서.html',
  '02_전문가_매칭/02-05_전문가_직역_확장_및_상황기반_진입_기획서.md': '02_전문가_매칭/02-05_이어봄_전문가_직역_확장_및_상황기반_진입_기획서.html',
  '03_현물_유품_수거/03-01_현물_유품_수거_계정형태_보류_메모.md': '03_현물_유품_수거/03-01_이어봄_현물_유품_수거_계정형태_보류_메모.html',
  '03_현물_유품_수거/03-02_현물_유품_수거_도메인_기획서.md': '03_현물_유품_수거/03-02_이어봄_현물_유품_수거_도메인_기획서.html',
  '03_현물_유품_수거/03-03_유품수거_업체_데이터_확보_방안_결정서.md': '03_현물_유품_수거/03-03_이어봄_유품수거_업체_데이터_확보_방안_결정서.html',
  '04_디지털_자산_정산/04-01_디지털_계정_정리_명세서.md': '04_디지털_자산_정산/04-01_이어봄_디지털_계정_정리_명세서.html',
  '04_디지털_자산_정산/04-02_생전위임_문서화_및_대행_가능범위_검토서.md': '04_디지털_자산_정산/04-02_이어봄_생전위임_문서화_및_대행_가능범위_검토서.html',
  '05_디지털_추모관/05-01_온라인_추모관_명세서.md': '05_디지털_추모관/05-01_이어봄_온라인_추모관_명세서.html',
  '05_디지털_추모관/05-02_디지털_추모관_도메인_기획서.md': '05_디지털_추모관/05-02_이어봄_디지털_추모관_도메인_기획서.html',
  '06_엔딩노트_유언/06-01_관리자_열람범위_설계_메모.md': '06_엔딩노트_유언/06-01_이어봄_관리자_열람범위_설계_메모.html',
  '06_엔딩노트_유언/06-02_엔딩노트_법적효력_확보_방안_결정서.md': '06_엔딩노트_유언/06-02_이어봄_엔딩노트_법적효력_확보_방안_결정서.html',
  '06_엔딩노트_유언/06-03_엔딩노트_열람통제_및_예외열람_정책.md': '06_엔딩노트_유언/06-03_이어봄_엔딩노트_열람통제_및_예외열람_정책.html',
  '06_엔딩노트_유언/06-04_엔딩노트_보관함_실구현_기획서.md': '06_엔딩노트_유언/06-04_이어봄_엔딩노트_보관함_실구현_기획서.html',
  '06_엔딩노트_유언/06-05_유족메시지_보관함_도메인분리_기획서.md': '06_엔딩노트_유언/06-05_이어봄_유족메시지_보관함_도메인분리_기획서.html',
  '07_상중_행정_케어/07-01_상중_행정_케어_도메인_기획서.md': '07_상중_행정_케어/07-01_이어봄_상중_행정_케어_도메인_기획서.html',
  '07_상중_행정_케어/07-02_사망후_법정기한_체크리스트_명세서.md': '07_상중_행정_케어/07-02_이어봄_사망후_법정기한_체크리스트_명세서.html',
  '07_상중_행정_케어/07-03_모바일_부고장_카카오톡_전송_구현_기획서.md': '07_상중_행정_케어/07-03_이어봄_모바일_부고장_카카오톡_전송_구현_기획서.html',
  '07_상중_행정_케어/07-04_상중_행정_가이드_재설계_검토서.md': '07_상중_행정_케어/07-04_이어봄_상중_행정_가이드_재설계_검토서.html',
  '08_비즈니스_분석/08-01_경쟁_서비스_분석_보고서.md': '08_비즈니스_분석/08-01_이어봄_경쟁_서비스_분석_보고서.html'
};

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
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ''));
        i++;
      }
      const quoteContent = quoteLines.join('\n');
      html += `<blockquote>\n${genericMdToHtml(quoteContent, { isNested: true })}\n</blockquote>\n`;
      continue;
    }

    // Horizontal rules
    if (/^(\-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      html += '<hr class="divider">\n';
      i++;
      continue;
    }

    // Tables
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const tableLines = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }
      html += parseTable(tableLines) + '\n';
      continue;
    }

    // Headings
    if (line.startsWith('#')) {
      const match = line.match(/^(#{1,6})\s+(.*)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2].trim();
        if (level === 1 && isFirstH1) {
          isFirstH1 = false;
          i++;
          continue; // The primary title is handled in the page header template
        }
        html += `<h${level}>${formatInline(text)}</h${level}>\n`;
        i++;
        continue;
      }
    }

    // Unordered Lists
    if (/^\s*[-*+]\s+/.test(line)) {
      html += '<ul>\n';
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        const itemText = lines[i].replace(/^\s*[-*+]\s+/, '');
        html += `  <li>${formatInline(itemText)}</li>\n`;
        i++;
      }
      html += '</ul>\n';
      continue;
    }

    // Ordered Lists
    if (/^\s*\d+\.\s+/.test(line)) {
      html += '<ol>\n';
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        const itemText = lines[i].replace(/^\s*\d+\.\s+/, '');
        html += `  <li>${formatInline(itemText)}</li>\n`;
        i++;
      }
      html += '</ol>\n';
      continue;
    }

    // Empty lines
    if (!line.trim()) {
      i++;
      continue;
    }

    // Regular paragraphs
    const paraLines = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith('#') &&
      !lines[i].trim().startsWith('>') &&
      !lines[i].trim().startsWith('```') &&
      !(lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) &&
      !/^\s*[-*+]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i]) &&
      !/^(\-{3,}|\*{3,}|_{3,})$/.test(lines[i].trim())
    ) {
      paraLines.push(lines[i].trim());
      i++;
    }
    if (paraLines.length > 0) {
      html += `<p>${formatInline(paraLines.join(' '))}</p>\n`;
    } else {
      i++;
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
  <title>${escapeHtml(title)} | 이어봄(Eobom) 시각화 보고서</title>
  <link rel="stylesheet" href="../style.css">
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
      background-color: #e0e7ff;
      color: #3730a3;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 600;
      margin-bottom: 0.75rem;
    }
    h2 {
      color: #1e293b;
      font-size: 1.45rem;
      margin-top: 2rem;
      margin-bottom: 1rem;
      border-left: 4px solid #D4A359;
      padding-left: 0.75rem;
    }
    h3 {
      color: #334155;
      font-size: 1.2rem;
      margin-top: 1.5rem;
      margin-bottom: 0.75rem;
    }
    h4 {
      color: #475569;
      font-size: 1.05rem;
      margin-top: 1.25rem;
      margin-bottom: 0.5rem;
    }
    p {
      margin-bottom: 1rem;
      color: #475569;
    }
    ul, ol {
      margin-bottom: 1.25rem;
      padding-left: 1.5rem;
      color: #475569;
    }
    li {
      margin-bottom: 0.35rem;
    }
    blockquote {
      background-color: #f1f5f9;
      border-left: 4px solid #64748b;
      margin: 1.25rem 0;
      padding: 1rem 1.25rem;
      border-radius: 0 8px 8px 0;
    }
    blockquote p {
      margin: 0;
      color: #334155;
    }
    .table-container {
      overflow-x: auto;
      margin: 1.5rem 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      overflow: hidden;
    }
    th, td {
      padding: 0.75rem 1rem;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }
    th {
      background-color: #f8fafc;
      color: #1e293b;
      font-weight: 600;
      border-bottom: 2px solid #cbd5e1;
    }
    tr:last-child td {
      border-bottom: none;
    }
    tr:hover td {
      background-color: #f8fafc;
    }
    code {
      background-color: #f1f5f9;
      color: #0f172a;
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.85em;
    }
    pre {
      background-color: #0f172a;
      color: #f8fafc;
      padding: 1.25rem;
      border-radius: 8px;
      overflow-x: auto;
      margin: 1.25rem 0;
    }
    pre code {
      background-color: transparent;
      color: inherit;
      padding: 0;
    }
    .divider {
      border: 0;
      height: 1px;
      background: #e2e8f0;
      margin: 2.5rem 0;
    }
    .tag {
      display: inline-block;
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .tag.pk { background: #fee2e2; color: #991b1b; }
    .tag.fk { background: #e0e7ff; color: #3730a3; }
    .tag.uk { background: #fef3c7; color: #92400e; }
    .tag.green { background: #dcfce7; color: #166534; }
    .tag.red { background: #fee2e2; color: #991b1b; }
    .tag.orange { background: #ffedd5; color: #9a3412; }
    .tag.blue { background: #e0f2fe; color: #075985; }
    .tag.gold { background: #fef9c3; color: #854d0e; }
    .tag.warn { background: #fef3c7; color: #92400e; }
    .tag.gray { background: #f1f5f9; color: #475569; }
    .tag.pause { background: #f3e8ff; color: #6b21a8; }
    .tag.red-cross { background: #fee2e2; color: #991b1b; }
    .tag.blue-sync { background: #e0f2fe; color: #0369a1; }
    .tag.lock { background: #f1f5f9; color: #334155; }
    .tag.key { background: #fef3c7; color: #b45309; }

    @media print {
      @page {
        size: A4 portrait;
        margin: 15mm 12mm 15mm 12mm;
      }
      body {
        background-color: #ffffff !important;
        color: #000000 !important;
        font-size: 9.5pt !important;
        line-height: 1.4 !important;
      }
      .container {
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
        border-radius: 0 !important;
      }
      .nav-bar { display: none !important; }
      .header {
        margin-bottom: 1.2rem !important;
        padding-bottom: 0.8rem !important;
        border-bottom: 2px solid #1a2b4c !important;
        page-break-after: avoid !important;
        break-after: avoid !important;
      }
      .header h1 {
        font-size: 16pt !important;
        color: #1a2b4c !important;
        margin-bottom: 0.3rem !important;
      }
      .badge { display: none !important; }
      h2 {
        font-size: 12pt !important;
        margin-top: 1.2rem !important;
        margin-bottom: 0.6rem !important;
        page-break-after: avoid !important;
        break-after: avoid !important;
        border-left: 3px solid #d4a359 !important;
        padding-left: 0.5rem !important;
        color: #1a2b4c !important;
      }
      h3 {
        font-size: 10.5pt !important;
        margin-top: 1rem !important;
        margin-bottom: 0.4rem !important;
        page-break-after: avoid !important;
        break-after: avoid !important;
      }
      h4 {
        font-size: 9.5pt !important;
        margin-top: 0.8rem !important;
        margin-bottom: 0.3rem !important;
        page-break-after: avoid !important;
        break-after: avoid !important;
      }
      p {
        margin-bottom: 0.5rem !important;
        color: #222222 !important;
      }
      blockquote {
        background-color: #f8fafc !important;
        border-left: 3px solid #64748b !important;
        padding: 0.5rem 0.8rem !important;
        margin: 0.6rem 0 !important;
        font-size: 9pt !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      .table-container {
        margin: 0.8rem 0 !important;
        page-break-inside: auto !important;
        break-inside: auto !important;
      }
      table {
        font-size: 8pt !important;
        border: 1px solid #cbd5e1 !important;
        page-break-inside: auto !important;
        break-inside: auto !important;
      }
      thead {
        display: table-header-group !important;
      }
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

// ─────────────────────────────────────────────────────────────────────────────
// 🌟 1. Dynamic Auto-Discovery: Recursively scan docs/ for all Markdown specs
// ─────────────────────────────────────────────────────────────────────────────

function discoverAllDocSpecs() {
  const discovered = [];
  const entries = fs.readdirSync(DOCS_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name === '작업일지_및_기록' || entry.name.startsWith('.')) continue;

    const domainDir = path.join(DOCS_DIR, entry.name);
    const files = fs.readdirSync(domainDir, { withFileTypes: true });

    for (const f of files) {
      if (!f.isFile() || !f.name.endsWith('.md')) continue;

      const relMd = `${entry.name}/${f.name}`;
      let relHtml;

      if (KNOWN_HTML_NAMES[relMd]) {
        relHtml = KNOWN_HTML_NAMES[relMd];
      } else {
        // Auto-generate target HTML path for new/unmapped markdown files
        const baseName = path.basename(f.name, '.md');
        relHtml = `${entry.name}/${baseName}.html`;
      }

      const isDbDoc = relMd === '00_핵심플랫폼/00-05_DB_요구사항_및_테이블_사전.md';

      // Read markdown metadata (title & summary)
      const mdContent = fs.readFileSync(path.join(DOCS_DIR, relMd), 'utf-8');
      const lines = mdContent.split(/\r?\n/);
      
      let title = path.basename(f.name, '.md').replace(/^(\d{2}-\d{2})_/, '$1. ').replace(/_/g, ' ');
      let summary = '';

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('# ')) {
          title = line.replace(/^#\s+/, '').replace(/^[^\w가-힣\d]+\s*/, '').trim();
          break;
        }
      }

      // Extract brief summary from top blockquote or paragraph
      for (let i = 0; i < Math.min(lines.length, 30); i++) {
        const line = lines[i].trim();
        if (line.startsWith('>')) {
          const clean = line.replace(/^>\s*/, '').replace(/\*\*([^*]+)\*\*/g, '$1').trim();
          if (clean && !clean.startsWith('문서 성격') && !clean.startsWith('정본 관계')) {
            summary = clean.replace(/^문서\s*목적\s*:\s*/, '').replace(/^계기\s*:\s*/, '');
            break;
          }
        }
      }

      if (!summary) {
        for (let i = 0; i < Math.min(lines.length, 25); i++) {
          const line = lines[i].trim();
          if (line && !line.startsWith('#') && !line.startsWith('>') && !line.startsWith('-') && !line.startsWith('|')) {
            summary = line.replace(/\*\*([^*]+)\*\*/g, '$1');
            break;
          }
        }
      }

      if (summary.length > 90) {
        summary = summary.slice(0, 87) + '…';
      }

      discovered.push({
        domainKey: entry.name,
        relMd,
        relHtml,
        isDbDoc,
        title,
        summary: summary || '세부 기능 및 구현 명세서'
      });
    }
  }

  // Sort by domainKey and filename
  discovered.sort((a, b) => a.relMd.localeCompare(b.relMd, 'ko'));
  return discovered;
}

// ─────────────────────────────────────────────────────────────────────────────
// 🌟 2. Build Index Portal (reports/index.html) Automatically
// ─────────────────────────────────────────────────────────────────────────────

function generatePortalIndexHtml(specs) {
  const domainGroups = {};
  specs.forEach(s => {
    if (!domainGroups[s.domainKey]) domainGroups[s.domainKey] = [];
    domainGroups[s.domainKey].push(s);
  });

  const domainKeys = Object.keys(domainGroups).sort();
  const totalCount = specs.length;
  const todayStr = new Date().toISOString().slice(0, 10);

  let sectionsHtml = '';

  for (const dKey of domainKeys) {
    const config = DOMAIN_CONFIG[dKey] || {
      title: `${dKey}`,
      icon: '📁',
      badgeClass: 'badge-primary',
      badgeText: `${domainGroups[dKey].length}종 명세서`
    };

    const countText = `${domainGroups[dKey].length}종 명세 및 구현 보고서`;

    let cardsHtml = '';
    for (const spec of domainGroups[dKey]) {
      cardsHtml += `        <div class="report-card">
          <h4>${escapeHtml(spec.title)}</h4>
          <p>${escapeHtml(spec.summary)}</p>
          <a href="${escapeHtml(spec.relHtml)}" class="report-link">보고서 열람 ➔</a>
        </div>\n`;
    }

    sectionsHtml += `    <!-- ${dKey} -->
    <section class="domain-section">
      <div class="domain-title">
        <span>${config.icon} ${escapeHtml(config.title)} (\`${dKey}/\`)</span>
        <span class="badge ${config.badgeClass}">${countText}</span>
      </div>
      <div class="report-grid">
${cardsHtml}      </div>
    </section>\n\n`;
  }

  // Add 99.eobom_study section
  sectionsHtml += `    <!-- 99.eobom_study -->
    <section class="domain-section">
      <div class="domain-title">
        <span>🎓 99. 이어봄 풀스택 &amp; 시스템 아키텍처 마스터 교과서 (\`99.eobom_study/\`)</span>
        <span class="badge badge-primary">18개 챕터 부트캠프 마스터 과정</span>
      </div>
      <div class="report-grid">
        <div class="report-card" style="border-color: #38bdf8; background: #0f172a; color: #f8fafc;">
          <h4 style="color: #38bdf8;">📘 00. 전체 마스터 교과서 목차 포털</h4>
          <p style="color: #94a3b8;">5개 파트 18개 챕터의 전체 학습 로드맵, 진도율 체크 및 도메인 소스코드 파일 매핑 색인 포털입니다.</p>
          <a href="99.eobom_study/index.html" target="_blank" rel="noopener noreferrer" class="report-link" style="background: #38bdf8; color: #0b1120;">목차 포털 열기 ➔</a>
        </div>
        <div class="report-card">
          <h4>01. 서비스 전체 지도와 3단계 생애주기 모델</h4>
          <p>웰다잉/상례 문제 정의, 3단계 생애주기 모델, 00~07 도메인 번호 체계 및 EntryBoxes/DomainOverviewPage 실전 문법 해부.</p>
          <a href="99.eobom_study/01_service_map.html" target="_blank" rel="noopener noreferrer" class="report-link">01장 교과서 열람 ➔</a>
        </div>
        <div class="report-card pending">
          <h4>02. 기술 스택 &amp; 네트워크 인프라 조감도</h4>
          <p>React 18 + Node Express + PostgreSQL 3계층 아키텍처, 외부 연동 생태계 및 환경변수/Secret 관리 원칙.</p>
          <a href="#" class="report-link disabled">작성 예정 (2장)</a>
        </div>
      </div>
    </section>\n\n`;

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🌿 이어봄 (Eobom) 프로젝트 시각화 스펙 &amp; 보고서 통합 포털</title>
  <link rel="stylesheet" href="style.css">
  <style>
    .domain-section { margin-bottom: 45px; }
    .domain-title { font-size: 1.35rem; color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; }
    .report-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 18px; }
    .report-card { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.04); transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s; display: flex; flex-direction: column; justify-content: space-between; }
    .report-card:hover { transform: translateY(-3px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.08); border-color: #1A2B4C; }
    .report-card.pending { background: #f8fafc; border-style: dashed; }
    .report-card h4 { margin: 0 0 8px 0; color: #0f172a; font-size: 1.05rem; line-height: 1.4; }
    .report-card p { color: #64748b; font-size: 0.88rem; margin-bottom: 15px; line-height: 1.5; flex-grow: 1; }
    .report-link { display: inline-block; background: #1A2B4C; color: white; text-decoration: none; padding: 8px 14px; border-radius: 6px; font-size: 0.82rem; font-weight: bold; text-align: center; transition: background 0.2s; }
    .report-link:hover { background: #D4A359; }
    .report-link.pdf { background: #dc2626; }
    .report-link.pdf:hover { background: #b91c1c; }
    .report-link.disabled { background: #94a3b8; cursor: not-allowed; }
    .badge { display: inline-block; padding: 3px 9px; border-radius: 4px; font-size: 0.78rem; font-weight: 600; background: #e2e8f0; color: #475569; margin-left: 8px; }
    .badge-primary { background: #e0e7ff; color: #3730a3; }
    .badge-success { background: #dcfce7; color: #166534; }
    .badge-warning { background: #fef3c7; color: #92400e; }
    .badge-info { background: #e0f2fe; color: #075985; }
    .stats-bar { display: flex; gap: 15px; background: #f8fafc; padding: 12px 18px; border-radius: 8px; margin-bottom: 25px; border: 1px solid #e2e8f0; font-size: 0.9rem; color: #475569; flex-wrap: wrap; }
    .stats-item strong { color: #1A2B4C; font-size: 1.05rem; }
  </style>
</head>
<body>
  <header>
    <div class="header-container">
      <h1>🌿 이어봄 (Eobom) 시각화 보고서 통합 포털</h1>
      <p>Digital Ending &amp; Well-Dying Total Care Platform | Enterprise Specification Portal</p>
    </div>
  </header>

  <main class="container">
    <div class="stats-bar">
      <div class="stats-item">전체 도메인: <strong>${domainKeys.length + 1}개 영역</strong></div>
      <div class="stats-item">HTML 시각화 보고서: <strong>${totalCount}종 + 교과서 18장 전수 자동 연동</strong></div>
      <div class="stats-item">최종 동기화: <strong>${todayStr}</strong></div>
    </div>

    <!-- 🎓 이어봄 풀스택 & 시스템 아키텍처 마스터 교과서 배너 -->
    <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border: 1px solid #38bdf8; color: white; padding: 24px 28px; border-radius: 12px; margin-bottom: 25px; box-shadow: 0 8px 24px rgba(56,189,248,0.12); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px;">
      <div>
        <span style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid #38bdf8; padding: 4px 10px; border-radius: 4px; font-size: 0.75rem; font-weight: 800; text-transform: uppercase;">🎓 MASTER BOOTCAMP</span>
        <h3 style="font-size: 1.3rem; margin: 8px 0 4px 0; color: #fff; font-family: 'Pretendard', sans-serif; font-weight: 800;">📘 이어봄 풀스택 &amp; 시스템 아키텍처 완전정복 교과서</h3>
        <p style="font-size: 0.9rem; color: #94a3b8; margin: 0;">5개 파트 18개 챕터 전과정 실전 코드 &amp; 라인별 문법 해부 (React 18 · Node Express · Prisma · OAuth/JWT · 암호화 · 하네스)</p>
      </div>
      <div style="display: flex; gap: 10px; flex-wrap: wrap;">
        <a href="99.eobom_study/index.html" target="_blank" rel="noopener noreferrer" style="background: #38bdf8; color: #0b1120; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: 800; font-size: 0.92rem; box-shadow: 0 4px 12px rgba(56,189,248,0.3); transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
          교과서 목차 포털 열기 ➔
        </a>
        <a href="99.eobom_study/01_service_map.html" target="_blank" rel="noopener noreferrer" style="background: rgba(255,255,255,0.1); color: #f8fafc; border: 1px solid #475569; text-decoration: none; padding: 12px 18px; border-radius: 8px; font-weight: 700; font-size: 0.92rem; transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.2)'" onmouseout="this.style.background='rgba(255,255,255,0.1)'">
          01장 본문 읽기 ➔
        </a>
      </div>
    </div>

    <!-- 🌟 최신 랜딩페이지 디자인 프로토타입 (copy.md v1.0 기반) -->
    <div style="background: linear-gradient(135deg, #1A2B4C 0%, #2c426e 100%); color: white; padding: 24px 28px; border-radius: 12px; margin-bottom: 35px; box-shadow: 0 8px 24px rgba(26,43,76,0.15); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px;">
      <div>
        <span style="background: #D4A359; color: #1A2B4C; padding: 4px 10px; border-radius: 4px; font-size: 0.75rem; font-weight: 800; text-transform: uppercase;">✨ NEW PROTOTYPE</span>
        <h3 style="font-size: 1.3rem; margin: 8px 0 4px 0; color: #fff; font-family: 'KoPub Batang', serif;">🎨 신규 인터랙티브 랜딩페이지 (home_redesign)</h3>
        <p style="font-size: 0.9rem; color: #cbd5e1; margin: 0;">copy.md 정본 카피 + 실시간 A/B 카피 스위처 + 7대 기한 타임라인 + D-Day 단계별 여정 위젯 탑재</p>
      </div>
      <a href="home_redesign.html" style="background: #D4A359; color: #1A2B4C; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 800; font-size: 0.95rem; box-shadow: 0 4px 12px rgba(212,163,89,0.4); transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
        인터랙티브 랜딩 체험하기 ➔
      </a>
    </div>

${sectionsHtml}  </main>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 🌟 3. Main Execution Workflow
// ─────────────────────────────────────────────────────────────────────────────

function main() {
  console.log('🔍 docs/ 폴더 전체 동적 스캔(Auto-Discovery) 시작...');
  const specs = discoverAllDocSpecs();
  console.log(`📑 발견된 기획·명세서 마크다운 문서: 총 ${specs.length}종`);

  let generatedCount = 0;

  specs.forEach(spec => {
    const mdPath = path.join(DOCS_DIR, spec.relMd);
    const htmlPath = path.join(REPORTS_DIR, spec.relHtml);

    if (spec.isDbDoc) {
      // 00-05 DB doc is built by specialized script build_db_report.js
      require('./build_db_report.js');
      console.log(`[DB Doc] ${spec.relHtml} regenerated via build_db_report.js`);
      generatedCount++;
      return;
    }

    if (!fs.existsSync(mdPath)) {
      console.warn(`[Skip] Markdown file not found: ${mdPath}`);
      return;
    }

    const mdContent = fs.readFileSync(mdPath, 'utf-8');
    const bodyHtml = genericMdToHtml(mdContent);
    const fullHtml = buildFullHtmlPage(spec.title, '', bodyHtml);

    // Ensure target directory exists
    const targetDir = path.dirname(htmlPath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    fs.writeFileSync(htmlPath, fullHtml, 'utf-8');
    console.log(`[Generated] ${spec.relHtml}`);
    generatedCount++;
  });

  // Regenerate portal index.html automatically
  console.log('🌐 reports/index.html 포털 메인 자동 생성 중...');
  const indexHtml = generatePortalIndexHtml(specs);
  fs.writeFileSync(INDEX_HTML_PATH, indexHtml, 'utf-8');
  console.log('[Generated] reports/index.html');

  console.log(`\n🎉 [성공] 총 ${generatedCount}종의 HTML 보고서 및 포털 메인이 100% 자동 동기화되었습니다!`);
}

main();
