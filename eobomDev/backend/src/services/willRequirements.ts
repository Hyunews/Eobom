import type { OcrLine, OcrPage } from './ocrProvider';

// docs 06-06 §3.1·§5 — 자필증서 요건 확인(F2)과 근거 표시(F3)용 순수 함수.
// 입력·출력이 고정돼 있어 OCR 결과 JSON 픽스처로 회귀 검사를 돌린다(willRequirements.test.ts).
//
// 🔴 결과 문구는 사실만 — "유효·무효·적합·안전" 같은 말과 전체 합계를 쓰지 않는다(§3.1).
// 🔴 판정은 제안이다. 찾음/찾지 못함/판단 못 함 세 가지만 내고, 확인은 사람이 ⑨에서 직접 한다.

export type RequirementKey = 'date' | 'address' | 'name' | 'seal' | 'handwriting';
export type RequirementState = 'found' | 'missing' | 'unknown';

// 사진 위 사각형 — OCR에 실제로 보낸 이미지 기준 픽셀 좌표.
export interface RequirementBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RequirementItem {
  key: RequirementKey;
  state: RequirementState;
  evidence: string;
  page?: number; // 0부터 — 화면 표기는 +1쪽
  box?: RequirementBox;
}

export interface SealDetection {
  page: number;
  box: RequirementBox;
}

// detectSeal(sealDetect.ts)의 결과를 쪽별로 모은 것. analyzed=false = 이미지 분석을 못 한 입력(PDF).
export interface SealAnalysis {
  analyzed: boolean;
  grayscale: boolean; // 분석한 모든 쪽이 흑백에 가까움 — 인주 색을 볼 수 없다
  seals: SealDetection[];
}

export interface WillOcrInput {
  pages: OcrPage[];
}

// ───────────────────────── 공통: 쪽 글을 한 줄 문자열로 펴고, 글귀 위치 ↔ 박스를 되찾는다 ─────────────────────────

interface Span {
  start: number;
  end: number;
  line: OcrLine;
}

interface FlatPage {
  text: string;
  spans: Span[];
}

const flatten = (lines: OcrLine[], sep: string): FlatPage => {
  let text = '';
  const spans: Span[] = [];
  lines.forEach((line, i) => {
    if (i > 0) text += sep;
    const start = text.length;
    text += line.text;
    spans.push({ start, end: text.length, line });
  });
  return { text, spans };
};

const boxOf = (flat: FlatPage, start: number, end: number): RequirementBox | undefined => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const s of flat.spans) {
    if (s.end <= start || s.start >= end) continue;
    for (const p of s.line.box) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
  }
  if (!isFinite(minX)) return undefined;
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
};

const squash = (s: string) => s.replace(/\s+/g, ' ').trim();
const pageLabel = (page: number) => `${page + 1}쪽`;

interface Hit {
  page: number;
  text: string;
  key: string; // 같은 값끼리 묶기 위한 정규화 키
  box?: RequirementBox;
}

// ───────────────────────── 연월일 ─────────────────────────

const NUM_CHARS = '0-9〇零공영一二三四五六七八九十일이삼사오육칠팔구십';
const DIGIT: Record<string, number> = {
  '〇': 0, 零: 0, 공: 0, 영: 0,
  一: 1, 일: 1, 二: 2, 이: 2, 三: 3, 삼: 3, 四: 4, 사: 4, 五: 5, 오: 5,
  六: 6, 육: 6, 七: 7, 칠: 7, 八: 8, 팔: 8, 九: 9, 구: 9,
};

// "2026" · "二〇二六" · "이십팔" · "十二" → 숫자. 읽을 수 없으면 NaN.
const toNum = (raw: string): number => {
  const s = raw.replace(/\s+/g, '');
  if (/^\d+$/.test(s)) return parseInt(s, 10);
  const ten = s.search(/[십十]/);
  if (ten >= 0) {
    const head = s.slice(0, ten);
    const tail = s.slice(ten + 1);
    const tens = head ? DIGIT[head] : 1;
    const ones = tail ? DIGIT[tail] : 0;
    if (tens === undefined || ones === undefined || head.length > 1 || tail.length > 1) return NaN;
    return tens * 10 + ones;
  }
  let n = 0;
  for (const ch of s) {
    const d = /\d/.test(ch) ? parseInt(ch, 10) : DIGIT[ch];
    if (d === undefined) return NaN;
    n = n * 10 + d;
  }
  return n;
};

const DATE_PATTERNS: RegExp[] = [
  new RegExp(`([${NUM_CHARS}]{2,4})\\s*[년年]\\s*([${NUM_CHARS}]{1,3})\\s*[월月]\\s*([${NUM_CHARS}]{1,3})\\s*[일日]`, 'g'),
  /(\d{4})\s*[.\-/]\s*(\d{1,2})\s*[.\-/]\s*(\d{1,2})(?!\d)\s*\.?/g,
  // "단기 4347(서기 2014)년 8월 11일" — 연도 뒤 `년` 앞에 괄호 병기가 끼는 표기. 서기 연도를 쓴다(단기 숫자는 범위 밖).
  /[(（]\s*서기\s*(\d{4})\s*[)）]\s*[년年]\s*(\d{1,2})\s*[월月]\s*(\d{1,2})\s*[일日]/g,
];

const findDates = (flat: FlatPage, page: number): Hit[] => {
  const hits: Hit[] = [];
  for (const re of DATE_PATTERNS) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(flat.text))) {
      const y = toNum(m[1]);
      const mo = toNum(m[2]);
      const d = toNum(m[3]);
      if (!(y >= 1900 && y <= 2200 && mo >= 1 && mo <= 12 && d >= 1 && d <= 31)) continue;
      hits.push({ page, text: squash(m[0]), key: `${y}-${mo}-${d}`, box: boxOf(flat, m.index, m.index + m[0].length) });
    }
  }
  return hits;
};

const findYearMonthOnly = (flat: FlatPage, page: number): Hit | undefined => {
  const m = /(\d{4})\s*[년年]\s*(\d{1,2})\s*[월月](?!\s*\d{1,2}\s*[일日])/.exec(flat.text);
  if (!m) return undefined;
  return { page, text: squash(m[0]), key: `${m[1]}-${m[2]}` };
};

const checkDate = (pages: FlatPage[]): RequirementItem => {
  const all: Hit[] = [];
  pages.forEach((p, i) => all.push(...findDates(p, i)));

  const distinct = new Map<string, Hit>(); // 같은 날짜가 여러 번 나오면 마지막 것을 대표로
  for (const h of all) distinct.set(h.key, h);

  if (distinct.size === 1) {
    const h = [...distinct.values()][0];
    return { key: 'date', state: 'found', evidence: `"${h.text}" · ${pageLabel(h.page)}`, page: h.page, box: h.box };
  }
  if (distinct.size >= 2) {
    const list = [...distinct.values()];
    const last = list[list.length - 1];
    return {
      key: 'date',
      state: 'unknown',
      evidence: `날짜가 ${list.length}개 있음 · ${list.map((h) => `"${h.text}"`).join(' · ')}`,
      page: last.page,
      box: last.box,
    };
  }

  // "길일"이 날짜 자리에 있으면 연·월만 적혀 있어도 찾지 못함으로 본다(§3.1 — 사유 표시).
  for (let i = 0; i < pages.length; i += 1) {
    const m = /길일|吉日/.exec(pages[i].text);
    if (m) {
      return { key: 'date', state: 'missing', evidence: `"${m[0]}" 같은 표현만 있음 · ${pageLabel(i)} · 연월일 형식 아님` };
    }
  }
  for (let i = 0; i < pages.length; i += 1) {
    const ym = findYearMonthOnly(pages[i], i);
    if (ym) return { key: 'date', state: 'unknown', evidence: `"${ym.text}" · ${pageLabel(i)} · 일 없음` };
  }
  return { key: 'date', state: 'missing', evidence: '연월일 형식의 글귀를 찾지 못함' };
};

// ───────────────────────── 주소 ─────────────────────────

const SIDO =
  '(?:서울특별시|서울시|서울|부산광역시|부산시|부산|대구광역시|대구시|대구|인천광역시|인천시|인천|광주광역시|광주시|광주|대전광역시|대전시|대전|울산광역시|울산시|울산|세종특별자치시|세종시|세종|경기도|경기|강원특별자치도|강원도|강원|충청북도|충북|충청남도|충남|전북특별자치도|전라북도|전북|전라남도|전남|경상북도|경북|경상남도|경남|제주특별자치도|제주도|제주)';
const SIGUNGU = '(?:[가-힣]{1,6}[시군구]\\s*){1,2}';
const ROAD_NO = '[가-힣0-9]{1,10}(?:로|길)(?:\\d+번길)?\\s*(?:지하\\s*)?\\d+(?:-\\d+)?';
const LOT_NO = '[가-힣0-9]{1,8}[동리읍면가]\\s*(?:산\\s*)?\\d+(?:-\\d+)?';

// 군 지역은 시·군·구 뒤에 읍·면이 한 단계 더 온다("괴산군 괴산읍 동부리 551").
const EUP_MYEON = '(?:[가-힣]{1,6}[읍면]\\s*)?';

const ADDRESS_FULL = new RegExp(`${SIDO}\\s*${SIGUNGU}${EUP_MYEON}(?:${ROAD_NO}|${LOT_NO})`, 'g');
const ADDRESS_PARTIAL = new RegExp(`${SIDO}\\s*${SIGUNGU}${EUP_MYEON}[가-힣0-9]{0,12}`, 'g');

// "(주소) …" · "주소: …" 라벨이 있으면 그 뒤 글귀(다음 "(내용)" 같은 라벨 앞까지)를 주소 후보로 본다.
// 손글씨는 시·군·구가 잘못 읽히는 일이 잦다(실측: "괴산군" → "과산운"). 라벨이 주소 자리를 알려 주므로,
// 시·도 글귀와 번호가 붙은 행정 단위(읍·면·동·리·로·길 + 숫자)가 함께 있으면 글자가 조금 틀려도 찾음으로 본다 —
// 읽힌 글귀를 근거로 그대로 보여 주므로 틀린 글자는 사람이 본다(판정은 제안).
const ADDRESS_LABEL = /[(（]\s*주소\s*[)）]|주\s*소\s*[:：]/g;
const NEXT_LABEL = /[(（][가-힣]{1,6}[)）]/;
const ADMIN_UNIT_NO = /[가-힣0-9]{1,8}(?:로|길|동|리|가|읍|면)\s*(?:산\s*)?\d+/;

const findLabeledAddress = (pages: FlatPage[]): Hit | undefined => {
  let last: Hit | undefined;
  pages.forEach((p, page) => {
    ADDRESS_LABEL.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = ADDRESS_LABEL.exec(p.text))) {
      const from = m.index + m[0].length;
      const rest = p.text.slice(from, from + 80);
      const next = NEXT_LABEL.exec(rest);
      const seg = (next ? rest.slice(0, next.index) : rest).trim();
      if (!new RegExp(SIDO).test(seg) || !ADMIN_UNIT_NO.test(seg)) continue;
      const start = p.text.indexOf(seg, from);
      last = { page, text: squash(seg), key: seg.replace(/\s/g, ''), box: boxOf(p, start, start + seg.length) };
    }
  });
  return last;
};

const checkAddress = (pages: FlatPage[]): RequirementItem => {
  const labeled = findLabeledAddress(pages);
  if (labeled) {
    return { key: 'address', state: 'found', evidence: `"${labeled.text}" · ${pageLabel(labeled.page)} · "(주소)" 다음 글귀`, page: labeled.page, box: labeled.box };
  }

  const full: Hit[] = [];
  pages.forEach((p, page) => {
    ADDRESS_FULL.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = ADDRESS_FULL.exec(p.text))) {
      full.push({ page, text: squash(m[0]), key: squash(m[0]).replace(/\s/g, ''), box: boxOf(p, m.index, m.index + m[0].length) });
    }
  });

  const distinct = new Map<string, Hit>();
  for (const h of full) distinct.set(h.key, h);
  if (distinct.size >= 1) {
    const list = [...distinct.values()];
    const last = list[list.length - 1];
    if (list.length === 1) {
      return { key: 'address', state: 'found', evidence: `"${last.text}" · ${pageLabel(last.page)}`, page: last.page, box: last.box };
    }
    // 유언장 본문에 재산 주소가 함께 있을 수 있다 — 어느 것이 유언자 주소인지는 사람이 고른다.
    return {
      key: 'address',
      state: 'unknown',
      evidence: `주소가 ${list.length}개 있음 · 표시는 마지막 것 "${last.text}" · ${pageLabel(last.page)}`,
      page: last.page,
      box: last.box,
    };
  }

  for (let i = 0; i < pages.length; i += 1) {
    ADDRESS_PARTIAL.lastIndex = 0;
    const m = ADDRESS_PARTIAL.exec(pages[i].text);
    if (m) return { key: 'address', state: 'unknown', evidence: `"${squash(m[0])}" · ${pageLabel(i)} · 번지 없음` };
  }
  return { key: 'address', state: 'missing', evidence: '시·도부터 시작하는 주소를 찾지 못함' };
};

// ───────────────────────── 성명 ─────────────────────────

// 같은 길이에서 한 글자만 다른 글귀 — "비슷한 글귀만 있음"(§3.1 판단 못 함).
const findNearName = (text: string, name: string): string | undefined => {
  if (name.length < 2) return undefined;
  for (let i = 0; i + name.length <= text.length; i += 1) {
    const cand = text.slice(i, i + name.length);
    let diff = 0;
    for (let k = 0; k < name.length; k += 1) if (cand[k] !== name[k]) diff += 1;
    if (diff === 1 && /^[가-힣]+$/.test(cand)) return cand;
  }
  return undefined;
};

interface NameResult {
  item: RequirementItem;
  page?: number;
  box?: RequirementBox;
}

const checkName = (ocrPages: OcrPage[], userName: string | null | undefined): NameResult => {
  const name = (userName ?? '').replace(/\s+/g, '');
  if (!name) return { item: { key: 'name', state: 'unknown', evidence: '계정에 등록된 이름이 없어 비교하지 못함' } };

  const flats = ocrPages.map((p) => flatten(p.lines, ''));
  // 서명은 끝 쪽에 있으므로 뒤에서부터 찾는다.
  for (let i = flats.length - 1; i >= 0; i -= 1) {
    const at = flats[i].text.lastIndexOf(name);
    if (at >= 0) {
      const box = boxOf(flats[i], at, at + name.length);
      return {
        item: { key: 'name', state: 'found', evidence: `"${name}" · ${pageLabel(i)} · 계정 이름과 같음`, page: i, box },
        page: i,
        box,
      };
    }
  }
  for (let i = flats.length - 1; i >= 0; i -= 1) {
    const near = findNearName(flats[i].text, name);
    if (near) {
      return { item: { key: 'name', state: 'unknown', evidence: `"${near}" · ${pageLabel(i)} · 계정 이름과 한 글자 다름` } };
    }
  }
  return { item: { key: 'name', state: 'missing', evidence: '계정 이름과 같은 글귀를 찾지 못함' } };
};

// ───────────────────────── 날인 ─────────────────────────

const NO_RED_SEAL = '붉은 인주 자국 없음 · 검은 도장은 확인 못 함';

const center = (b: RequirementBox) => ({ x: b.x + b.width / 2, y: b.y + b.height / 2 });

const checkSeal = (ocr: WillOcrInput, seal: SealAnalysis, name: NameResult): RequirementItem => {
  if (seal.seals.length === 0) {
    if (!seal.analyzed) return { key: 'seal', state: 'unknown', evidence: 'PDF는 도장 자국을 확인하지 않음' };
    if (seal.grayscale) return { key: 'seal', state: 'unknown', evidence: '흑백 사진이라 인주 색을 확인 못 함' };
    return { key: 'seal', state: 'missing', evidence: NO_RED_SEAL };
  }

  if (name.box !== undefined && name.page !== undefined) {
    const page = ocr.pages[name.page];
    const limit = 0.3 * Math.max(page.width ?? 0, page.height ?? 0) || 300;
    const nc = center(name.box);
    let best: { s: SealDetection; dist: number } | undefined;
    for (const s of seal.seals) {
      if (s.page !== name.page) continue;
      const c = center(s.box);
      const dist = Math.hypot(c.x - nc.x, c.y - nc.y);
      if (!best || dist < best.dist) best = { s, dist };
    }
    if (best && best.dist <= limit) {
      return { key: 'seal', state: 'found', evidence: `붉은 인주 자국 · ${pageLabel(best.s.page)} · 성명 근처`, page: best.s.page, box: best.s.box };
    }
    const first = seal.seals[0];
    return {
      key: 'seal',
      state: 'unknown',
      evidence: `붉은 인주 자국 있음 · ${pageLabel(first.page)} · 성명 근처는 아님`,
      page: first.page,
      box: first.box,
    };
  }

  const first = seal.seals[0];
  return {
    key: 'seal',
    state: 'unknown',
    evidence: `붉은 인주 자국 있음 · ${pageLabel(first.page)} · 성명 위치를 몰라 근처 여부는 확인 못 함`,
    page: first.page,
    box: first.box,
  };
};

// ───────────────────────── 전문 자서 ─────────────────────────

const checkHandwriting = (ocr: WillOcrInput): RequirementItem => {
  const lines = ocr.pages.flatMap((p) => p.lines);
  const flagged = lines.filter((l) => typeof l.handwritten === 'boolean');
  if (lines.length === 0 || flagged.length !== lines.length) {
    return { key: 'handwriting', state: 'unknown', evidence: '손글씨·인쇄 글자 구분 못 함' };
  }
  const hand = lines.filter((l) => l.handwritten).length;
  if (hand === lines.length) return { key: 'handwriting', state: 'found', evidence: '전체가 손글씨로 인식됨' };
  if (hand === 0) return { key: 'handwriting', state: 'missing', evidence: '전체가 인쇄된 글자로 인식됨' };
  return { key: 'handwriting', state: 'unknown', evidence: '인쇄된 글자가 섞여 있음' };
};

// ───────────────────────── 진입점 ─────────────────────────

export const checkWillRequirements = (
  ocr: WillOcrInput,
  seal: SealAnalysis,
  userName: string | null | undefined,
): RequirementItem[] => {
  const spaced = ocr.pages.map((p) => flatten(p.lines, ' '));
  const name = checkName(ocr.pages, userName);
  return [
    checkDate(spaced),
    checkAddress(spaced),
    name.item,
    checkSeal(ocr, seal, name),
    checkHandwriting(ocr),
  ];
};
