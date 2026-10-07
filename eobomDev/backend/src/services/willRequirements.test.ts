import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { checkWillRequirements } from './willRequirements';
import type { RequirementItem, RequirementKey, SealAnalysis } from './willRequirements';
import type { OcrLine, OcrPage } from './ocrProvider';
import { detectSeal } from './sealDetect';

// docs 06-06 §9 P2 — 테스트 사진 묶음 회귀 검사. 실호출이 아니라 OCR 결과 JSON 픽스처로 돌린다.
// 실사진은 저장소에 넣지 않는다(합성 이미지는 sharp로 즉석에서 만든다).
// 실행: npm test

// 글귀 목록 → 세로로 쌓은 가짜 OCR 쪽. 한 글귀 = 한 줄 = 한 박스(x 20~, y 40씩 아래로, 높이 30).
const page = (texts: string[], extra: Partial<OcrPage> = {}): OcrPage => {
  const lines: OcrLine[] = texts.map((text, i) => {
    const x = 20;
    const y = 40 + i * 40;
    const w = text.length * 20;
    return { text, box: [{ x, y }, { x: x + w, y }, { x: x + w, y: y + 30 }, { x, y: y + 30 }] };
  });
  return { text: texts.join('\n'), lines, width: 800, height: 1000, ...extra };
};

const NO_SEAL: SealAnalysis = { analyzed: true, grayscale: false, seals: [] };

const run = (pages: OcrPage[], userName: string | null = '홍길동', seal: SealAnalysis = NO_SEAL) =>
  checkWillRequirements({ pages }, seal, userName);

const pick = (items: RequirementItem[], key: RequirementKey) => items.find((i) => i.key === key) as RequirementItem;

// ── 연월일 ──
for (const [label, text, y] of [
  ['년월일', '2026년 9월 28일', '2026년 9월 28일'],
  ['점 표기', '2026. 9. 28.', '2026. 9. 28.'],
  ['붙여 쓴 표기', '2026년9월28일', '2026년9월28일'],
  ['한자 숫자', '二〇二六年 九月 二十八日', '二〇二六年 九月 二十八日'],
] as const) {
  test(`연월일 — ${label}: 찾음 + 근거 박스`, () => {
    const d = pick(run([page(['유언장', text, '홍길동'])]), 'date');
    assert.equal(d.state, 'found');
    assert.ok(d.evidence.includes(y.replace(/\s+/g, ' ').trim()), d.evidence);
    assert.equal(d.page, 0);
    assert.ok(d.box);
  });
}

test('연월일 — 단기 + (서기 …)년 병기: 서기 연도로 찾음', () => {
  const d = pick(run([page(['단기', '4347(서기', '2014)년', '8월', '11일'])]), 'date');
  assert.equal(d.state, 'found');
  assert.match(d.evidence, /2014\)년 8월 11일/);
  assert.ok(d.box);
  assert.equal(pick(run([page(['단기4347(서기2014)년8월11일'])]), 'date').state, 'found');
});

test('연월일 — 연·월만 있음: 판단 못 함', () => {
  const d = pick(run([page(['2026년 9월'])]), 'date');
  assert.equal(d.state, 'unknown');
  assert.match(d.evidence, /일 없음/);
});

test('연월일 — "길일" 표현: 찾지 못함 + 사유', () => {
  const d = pick(run([page(['2026년 9월 길일'])]), 'date');
  assert.equal(d.state, 'missing');
  assert.match(d.evidence, /길일/);
});

test('연월일 — 날짜가 두 개: 판단 못 함', () => {
  const d = pick(run([page(['2026년 9월 28일', '2026년 10월 1일'])]), 'date');
  assert.equal(d.state, 'unknown');
});

test('연월일 — 같은 날짜가 두 번 나와도 하나로 센다', () => {
  const d = pick(run([page(['2026년 9월 28일']), page(['2026년 9월 28일'])]), 'date');
  assert.equal(d.state, 'found');
  assert.equal(d.page, 1); // 마지막 등장을 대표로
});

test('연월일 — 없음: 찾지 못함', () => {
  assert.equal(pick(run([page(['나 홍길동은 유언한다.'])]), 'date').state, 'missing');
});

test('연월일 — 범위 밖 값(13월)은 날짜로 세지 않는다', () => {
  assert.equal(pick(run([page(['2026년 13월 40일'])]), 'date').state, 'missing');
});

// ── 주소 ──
test('주소 — 도로명 + 번호: 찾음', () => {
  const a = pick(run([page(['서울특별시', '중구', '세종대로', '110'])]), 'address');
  assert.equal(a.state, 'found');
  assert.match(a.evidence, /서울특별시 중구 세종대로 110/);
  assert.ok(a.box);
});

test('주소 — 지번(동 + 번지): 찾음', () => {
  assert.equal(pick(run([page(['경기도 수원시 영통구 영통동 1000-2'])]), 'address').state, 'found');
});

test('주소 — 도로명 번길·지하: 찾음', () => {
  assert.equal(pick(run([page(['부산광역시 해운대구 해운대해변로264번길 12'])]), 'address').state, 'found');
});

test('주소 — 군 + 읍·면 + 리 + 번지: 찾음', () => {
  const a = pick(run([page(['(주소)', '충북', '괴산군', '괴산읍', '동부리', '551'])]), 'address');
  assert.equal(a.state, 'found');
  assert.match(a.evidence, /충북 괴산군 괴산읍 동부리 551/);
});

// 실호출 실측(09-29, assets_test01.jpg) — 손글씨라 "괴산군"이 "과산운", "551"이 "55/"로 읽힌 실제 토큰.
const REAL_TOKENS = ['유언장', '(괴롭게)', '(주소)', '충북', '과산운', '과산읍', '동부리55/', '(내용)', '내가', '죽거든', '장례수를', '단기4347(서기', '2014)년', '8월11일', '임', '각수', '(', ')', 'NEWSis('];

test('주소 — "(주소)" 라벨 뒤 글귀: 시·군·구가 잘못 읽혀도 찾음(근거에 읽힌 글귀 그대로)', () => {
  const a = pick(run([page(REAL_TOKENS)]), 'address');
  assert.equal(a.state, 'found');
  assert.match(a.evidence, /충북 과산운 과산읍 동부리55\//);
  assert.ok(a.box);
});

// 운영 시험(10-06) — "주소 :" 한 줄 뒤 본문이 근거에 붙어 나오던 결함.
test('주소 — 근거는 번지·동·호에서 끝나고 다음 줄 본문을 붙이지 않는다', () => {
  const body = ['본인 정현수는 다음과 같이 유언한다.', '1. 본인의 재산 중 다음 부동산은 처인 000에게'];
  const want = '서울 강남구 삼성동 000 아파트 101동 101호';
  for (const lines of [
    ['주소 : 서울 강남구 삼성동 000 아파트 101동 101호', ...body],
    ['주소 :', '서울 강남구', '삼성동 000', '아파트', '101동', '101호', ...body],
    [`주소 : ${want} ${body.join(' ')}`], // 한 줄로 읽힌 경우
  ]) {
    const a = pick(run([page(lines)]), 'address');
    assert.equal(a.state, 'found');
    assert.ok(a.evidence.startsWith(`"${want}"`), a.evidence);
    assert.ok(!a.evidence.includes('본인'), a.evidence);
    assert.ok(a.box);
  }
});

test('주소 — 건물 이름·동·호 없이 번지에서 끝나는 줄도 다음 줄을 붙이지 않는다', () => {
  const a = pick(run([page(['(주소) 경기도 수원시 영통구 영통동 1000-2', '(내용) 나는'])]), 'address');
  assert.equal(a.state, 'found');
  assert.ok(a.evidence.startsWith('"경기도 수원시 영통구 영통동 1000-2"'), a.evidence);
});

test('주소 — 라벨이 있어도 시·도나 번호가 없으면 라벨 규칙으로는 찾지 않는다', () => {
  assert.notEqual(pick(run([page(['(주소)', '괴산읍', '(내용)', '내가'])]), 'address').state, 'found');
  assert.notEqual(pick(run([page(['(주소)', '충북', '괴산군', '(내용)'])]), 'address').state, 'found');
});

test('실측 토큰 — 성명 "임 각수"(띄어 읽힘)는 계정 이름 임각수와 같음, 날짜도 찾음', () => {
  const r = run([page(REAL_TOKENS)], '임각수');
  assert.equal(pick(r, 'name').state, 'found');
  assert.equal(pick(r, 'date').state, 'found');
  assert.equal(pick(run([page(REAL_TOKENS)], '홍길동'), 'name').state, 'missing');
});

test('주소 — 군 + 읍까지만: 판단 못 함(번지 없음)', () => {
  assert.equal(pick(run([page(['충북', '괴산군', '괴산읍'])]), 'address').state, 'unknown');
});

test('주소 — 동네 이름까지만: 판단 못 함(번지 없음)', () => {
  const a = pick(run([page(['서울특별시 중구 신당동'])]), 'address');
  assert.equal(a.state, 'unknown');
  assert.match(a.evidence, /번지 없음/);
});

test('주소 — 시·도가 없음: 찾지 못함', () => {
  assert.equal(pick(run([page(['세종대로 110'])]), 'address').state, 'missing');
});

test('주소 — 서로 다른 주소가 둘: 판단 못 함, 표시는 마지막', () => {
  const a = pick(run([page(['서울특별시 중구 세종대로 110', '부산광역시 해운대구 해운대로 200'])]), 'address');
  assert.equal(a.state, 'unknown');
  assert.match(a.evidence, /해운대로 200/);
});

// ── 성명 ──
test('성명 — 계정 이름과 같음: 찾음(마지막 쪽 우선)', () => {
  const n = pick(run([page(['나 홍길동은']), page(['유언자', '홍길동'])]), 'name');
  assert.equal(n.state, 'found');
  assert.equal(n.page, 1);
  assert.match(n.evidence, /계정 이름과 같음/);
  assert.ok(n.box);
});

test('성명 — 이름이 여러 토큰으로 쪼개져도 찾는다', () => {
  assert.equal(pick(run([page(['홍', '길동'])]), 'name').state, 'found');
});

test('성명 — 한 글자 다른 글귀만: 판단 못 함', () => {
  const n = pick(run([page(['유언자 홍길둥'])]), 'name');
  assert.equal(n.state, 'unknown');
  assert.match(n.evidence, /한 글자 다름/);
});

test('성명 — 없음: 찾지 못함', () => {
  assert.equal(pick(run([page(['유언자 김철수'])]), 'name').state, 'missing');
});

test('성명 — 계정에 이름이 없음: 판단 못 함', () => {
  assert.equal(pick(run([page(['홍길동'])], null), 'name').state, 'unknown');
  assert.equal(pick(run([page(['홍길동'])], ''), 'name').state, 'unknown');
});

// ── 날인 ──
// 이름 줄 = 세 번째 줄(y 120~150) → 중심 (약 80, 135). 800×1000 기준 근처 한도 300px.
const sealAt = (x: number, y: number, p = 0): SealAnalysis => ({
  analyzed: true,
  grayscale: false,
  seals: [{ page: p, box: { x, y, width: 60, height: 60 } }],
});

test('날인 — 붉은 인주 없음: 찾지 못함 + 검은 도장 한계 문구', () => {
  const s = pick(run([page(['유언장', '2026년 9월 28일', '홍길동'])]), 'seal');
  assert.equal(s.state, 'missing');
  assert.match(s.evidence, /검은 도장은 확인 못 함/);
  assert.equal(s.box, undefined);
});

test('날인 — 인주가 성명 근처: 찾음 + 박스', () => {
  const s = pick(run([page(['유언장', '2026년 9월 28일', '홍길동'])], '홍길동', sealAt(150, 110)), 'seal');
  assert.equal(s.state, 'found');
  assert.ok(s.box);
});

test('날인 — 인주는 있으나 성명에서 멂: 판단 못 함', () => {
  const s = pick(run([page(['유언장', '2026년 9월 28일', '홍길동'])], '홍길동', sealAt(700, 900)), 'seal');
  assert.equal(s.state, 'unknown');
});

test('날인 — 성명을 못 찾았으면 근처 여부를 못 봄: 판단 못 함', () => {
  const s = pick(run([page(['유언장', '2026년 9월 28일'])], '홍길동', sealAt(150, 110)), 'seal');
  assert.equal(s.state, 'unknown');
});

test('날인 — 흑백 사진: 판단 못 함', () => {
  const s = pick(run([page(['홍길동'])], '홍길동', { analyzed: true, grayscale: true, seals: [] }), 'seal');
  assert.equal(s.state, 'unknown');
  assert.match(s.evidence, /흑백/);
});

test('날인 — PDF(이미지 분석 못 함): 판단 못 함', () => {
  const s = pick(run([page(['홍길동'])], '홍길동', { analyzed: false, grayscale: false, seals: [] }), 'seal');
  assert.equal(s.state, 'unknown');
  assert.match(s.evidence, /PDF/);
});

// ── 전문 자서 ──
test('전문 자서 — 업체가 구분을 안 주면 판단 못 함 고정', () => {
  const h = pick(run([page(['홍길동'])]), 'handwriting');
  assert.equal(h.state, 'unknown');
  assert.match(h.evidence, /구분 못 함/);
});

test('전문 자서 — 손글씨 구분이 오면 사용(전부·섞임·인쇄)', () => {
  const mk = (flags: boolean[]) =>
    run([{ ...page(flags.map((_, i) => `줄${i}`)), lines: page(flags.map((_, i) => `줄${i}`)).lines.map((l, i) => ({ ...l, handwritten: flags[i] })) }]);
  assert.equal(pick(mk([true, true]), 'handwriting').state, 'found');
  assert.equal(pick(mk([false, false]), 'handwriting').state, 'missing');
  const mixed = pick(mk([true, false]), 'handwriting');
  assert.equal(mixed.state, 'unknown');
  assert.match(mixed.evidence, /섞여 있음/);
});

// ── 조합 회귀 + 문구 규칙 ──
test('조합 — 날짜 형식 × 주소 유무 × 인주 유무: 항목이 서로 영향을 주지 않는다', () => {
  const dates = ['2026년 9월 28일', '2026. 9. 28.', ''];
  const addrs = ['서울특별시 중구 세종대로 110', ''];
  const seals = [sealAt(150, 200), NO_SEAL];
  for (const d of dates) {
    for (const a of addrs) {
      for (const s of seals) {
        const texts = ['유언장', d, a, '홍길동'].filter(Boolean);
        const r = run([page(texts)], '홍길동', s);
        assert.equal(r.length, 5);
        assert.equal(pick(r, 'date').state, d ? 'found' : 'missing');
        assert.equal(pick(r, 'address').state, a ? 'found' : 'missing');
        assert.equal(pick(r, 'name').state, 'found');
        // 성명 줄 위치가 조합마다 달라지므로(줄 수) 인주는 있으면 found 또는 unknown, 없으면 missing만 본다.
        if (s.seals.length === 0) assert.equal(pick(r, 'seal').state, 'missing');
        else assert.notEqual(pick(r, 'seal').state, 'missing');
      }
    }
  }
});

test('문구 — 유효·무효·적합·안전·합계 표현을 쓰지 않는다', () => {
  const all = [
    ...run([page(['유언장', '2026년 9월 28일', '서울특별시 중구 세종대로 110', '홍길동'])], '홍길동', sealAt(150, 200)),
    ...run([page(['2026년 9월 길일', '서울특별시 중구 신당동', '홍길둥'])]),
    ...run([page(['내용 없음'])], null, { analyzed: false, grayscale: false, seals: [] }),
  ];
  for (const item of all) {
    assert.doesNotMatch(item.evidence, /유효|무효|적합|안전|충족|개 중/, item.evidence);
  }
});

// ── detectSeal — 합성 이미지 ──
const canvas = async (draw: string) =>
  sharp(
    Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800"><rect width="600" height="800" fill="#fbf8ef"/>${draw}</svg>`),
  )
    .png()
    .toBuffer();

test('detectSeal — 붉은 원(인주)은 찾고 위치를 원본 좌표로 돌려준다', async () => {
  const r = await detectSeal(await canvas('<circle cx="400" cy="600" r="45" fill="#c8322a"/>'));
  assert.equal(r.width, 600);
  assert.equal(r.seals.length, 1);
  const b = r.seals[0];
  assert.ok(Math.abs(b.x + b.width / 2 - 400) < 12 && Math.abs(b.y + b.height / 2 - 600) < 12, JSON.stringify(b));
  assert.equal(r.grayscale, false);
});

test('detectSeal — 글자 획이 갈라진 붉은 도장도 한 덩어리로 본다', async () => {
  const r = await detectSeal(
    await canvas(
      '<circle cx="300" cy="500" r="50" fill="#c8322a"/><line x1="250" y1="500" x2="350" y2="500" stroke="#fbf8ef" stroke-width="8"/><line x1="300" y1="450" x2="300" y2="550" stroke="#fbf8ef" stroke-width="8"/>',
    ),
  );
  assert.equal(r.seals.length, 1);
});

test('detectSeal — 검은 도장은 못 찾는다', async () => {
  const r = await detectSeal(await canvas('<circle cx="400" cy="600" r="45" fill="#202020"/>'));
  assert.equal(r.seals.length, 0);
});

test('detectSeal — 색이 전혀 없는 사진은 흑백으로 본다', async () => {
  const gray = await sharp({ create: { width: 600, height: 800, channels: 3, background: '#f0f0f0' } })
    .png()
    .toBuffer();
  const r = await detectSeal(gray);
  assert.equal(r.grayscale, true);
  assert.equal(r.seals.length, 0);
});

test('detectSeal — 가늘고 긴 붉은 줄(밑줄)은 도장이 아니다', async () => {
  const r = await detectSeal(await canvas('<rect x="100" y="400" width="300" height="5" fill="#c8322a"/>'));
  assert.equal(r.seals.length, 0);
});

test('detectSeal — 아무것도 없는 종이는 인주 없음', async () => {
  const r = await detectSeal(await canvas(''));
  assert.equal(r.seals.length, 0);
});

// ── detectSeal — 10-06 빨강 판정 교체(06-06 §9-1 T-3) ──
test('detectSeal — 인장 없음 오탐 시험(붉은 줄·붉은 펜 글씨·주황/나무색 면·분홍 배경)은 하나도 못 찾는다', async () => {
  const cases: Record<string, string> = {
    '붉은 가는 줄': '<rect x="100" y="400" width="300" height="3" fill="#d03020"/>',
    '붉은 펜 글씨 모양':
      '<path d="M100 300 q20 -30 40 0 t40 0 t40 0 t40 0 M100 340 q20 -30 40 0 t40 0 t40 0" fill="none" stroke="#c82820" stroke-width="3"/>',
    '주황 넓은 면': '<rect x="50" y="100" width="500" height="200" fill="#e07820"/>',
    '나무색 넓은 면': '<rect x="0" y="400" width="600" height="400" fill="#a0683c"/>',
  };
  for (const [name, draw] of Object.entries(cases)) {
    const r = await detectSeal(await canvas(draw));
    assert.equal(r.seals.length, 0, `${name}: ${JSON.stringify(r.seals)}`);
  }
  const pink = await sharp({ create: { width: 600, height: 800, channels: 3, background: '#f4b4bc' } }).png().toBuffer();
  assert.equal((await detectSeal(pink)).seals.length, 0, '분홍 배경');
});

test('detectSeal — 어두운 주홍·가장자리에 걸친 인주도 찾는다', async () => {
  const r = await detectSeal(await canvas('<circle cx="580" cy="780" r="45" fill="#b4423c"/>'));
  assert.equal(r.seals.length, 1);
});

// 실사진(저장소에 없음, uploads/test-wills) — 없으면 건너뛴다
const realPhoto = (name: string) => {
  const p = path.join(__dirname, '../../uploads/test-wills', name);
  return fs.existsSync(p) ? fs.readFileSync(p) : null;
};
test('detectSeal — 실사진 wills001.jpeg는 인장 1개(오른쪽 아래)', async (t) => {
  const buf = realPhoto('wills001.jpeg');
  if (!buf) return t.skip('사진 없음');
  const r = await detectSeal(buf);
  assert.equal(r.seals.length, 1, JSON.stringify(r.seals));
  const b = r.seals[0];
  assert.ok(b.x + b.width / 2 > r.width / 2 && b.y + b.height / 2 > r.height / 2, `오른쪽 아래 아님: ${JSON.stringify(b)}`);
});
test('detectSeal — 실사진 wills002.jpg는 0개', async (t) => {
  const buf = realPhoto('wills002.jpg');
  if (!buf) return t.skip('사진 없음');
  assert.equal((await detectSeal(buf)).seals.length, 0);
});

// ── ClovaSpeechProvider — 사용 한도 도달(10-07 b17 후속) ──
test('ClovaSpeechProvider — CLOVA가 사용 한도 도달로 거절하면 연결 오류가 아니라 QuotaExceededError로 던진다', async () => {
  const { ClovaSpeechProvider } = await import('./clovaSpeechProvider');
  const { QuotaExceededError } = await import('./heavyJob');
  const saved = { fetch: globalThis.fetch, url: process.env.CLOVA_SPEECH_INVOKE_URL, secret: process.env.CLOVA_SPEECH_SECRET };
  process.env.CLOVA_SPEECH_INVOKE_URL = 'https://example.invalid/speech';
  process.env.CLOVA_SPEECH_SECRET = 'x';
  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({ result: 'FAILED', message: '일별 한도에 도달하여 당일 사용이 제한되었습니다. 한도설정을 변경하여 이용할 수 있습니다.' }),
      { status: 200 },
    )) as typeof fetch;
  try {
    await assert.rejects(() => new ClovaSpeechProvider().transcribe(Buffer.from('x'), 'audio/mpeg'), QuotaExceededError);
    // 한도와 무관한 FAILED는 지금처럼 일반 오류다(구분이 과하게 넓지 않다)
    globalThis.fetch = (async () => new Response(JSON.stringify({ result: 'FAILED', message: 'internal error' }), { status: 200 })) as typeof fetch;
    await assert.rejects(
      () => new ClovaSpeechProvider().transcribe(Buffer.from('x'), 'audio/mpeg'),
      (e: unknown) => e instanceof Error && !(e instanceof QuotaExceededError),
    );
  } finally {
    globalThis.fetch = saved.fetch;
    if (saved.url === undefined) delete process.env.CLOVA_SPEECH_INVOKE_URL;
    else process.env.CLOVA_SPEECH_INVOKE_URL = saved.url;
    if (saved.secret === undefined) delete process.env.CLOVA_SPEECH_SECRET;
    else process.env.CLOVA_SPEECH_SECRET = saved.secret;
  }
});

// ── ClovaOcrProvider — 글자 없는 사진(10-07 b13) ──
test('ClovaOcrProvider — CLOVA가 NO_TEXT로 거절하면 연결 오류가 아니라 "글자 없음"으로 던진다', async () => {
  const { ClovaOcrProvider } = await import('./clovaOcrProvider');
  const { NoRecognizedTextError } = await import('./heavyJob');
  const saved = { fetch: globalThis.fetch, url: process.env.CLOVA_OCR_INVOKE_URL, secret: process.env.CLOVA_OCR_SECRET };
  process.env.CLOVA_OCR_INVOKE_URL = 'https://example.invalid/general';
  process.env.CLOVA_OCR_SECRET = 'x';
  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({ images: [{ inferResult: 'FAILURE', message: '400 Bad Request: "{"errorCode":"ENGN-001","errorMsg":"NO_TEXT"}"' }] }),
      { status: 200 },
    )) as typeof fetch;
  try {
    await assert.rejects(() => new ClovaOcrProvider().recognize(Buffer.from('x'), 'image/jpeg'), NoRecognizedTextError);
  } finally {
    globalThis.fetch = saved.fetch;
    if (saved.url === undefined) delete process.env.CLOVA_OCR_INVOKE_URL;
    else process.env.CLOVA_OCR_INVOKE_URL = saved.url;
    if (saved.secret === undefined) delete process.env.CLOVA_OCR_SECRET;
    else process.env.CLOVA_OCR_SECRET = saved.secret;
  }
});
