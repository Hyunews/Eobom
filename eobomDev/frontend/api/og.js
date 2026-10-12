// 부고장·추모관 카톡 미리보기(OG) 서버 렌더 — docs 07-03 §3.4 Phase 2 · 카드 내용 = 00-13 §8 #8.
// Vercel 서버리스 함수: vercel.json이 /o/:slug·/m/:slug를 여기로 보낸다. SPA 셸(index.html)에 og 태그를 끼워 돌려주고
// 브라우저는 그대로 SPA로 열린다(크롤러 UA 분기 없음 — 항상 같은 셸, §3.4).
//
// 🔴 카드 내용은 고인 이름 + "삼가 고인의 명복을 빕니다"까지만이다(09-30 확정). 영정·빈소·계좌·연락처는 넣지 않는다.
//    이미지는 고정 근조 이미지. 없는·종료된 slug는 이름 없는 기본 카드.
// 🔴 이 함수는 백엔드에서 "이름만" 받는다(부고장 /api/obituaries/:slug/og — 조회수 집계 없음). 전체 공개 응답을 받지 않는다.
// 응답은 항상 200 + SPA 셸이다 — 없는 slug의 "찾을 수 없음" 화면은 SPA가 그린다.

const CARD_IMAGE_PATH = '/obituary-card-v2.png'; // src/config.ts OBITUARY_CARD_IMAGE_URL과 같은 파일
const CONDOLENCE = '삼가 고인의 명복을 빕니다.';
const SLUG_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
const BACKEND_TIMEOUT_MS = 3000;

const escapeHtml = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

// 이름이 없으면(없는·종료된 링크, 백엔드 오류 포함) 이름 없는 기본 카드.
export const buildCard = (kind, deceasedName) => {
  const name = typeof deceasedName === 'string' ? deceasedName.trim() : '';
  if (!name) return { title: '이어봄', description: CONDOLENCE };
  if (kind === 'o') return { title: `[부고] 故 ${name} 님`, description: CONDOLENCE }; // utils/obituaryCard.ts 제목과 같은 형식
  return { title: `故 ${name} 님을 추모합니다`, description: CONDOLENCE };
};

export const injectMeta = (html, card, { url, imageUrl }) => {
  const tags = [
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="이어봄" />`,
    `<meta property="og:title" content="${escapeHtml(card.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(card.description)}" />`,
    `<meta property="og:image" content="${escapeHtml(imageUrl)}" />`,
    `<meta property="og:url" content="${escapeHtml(url)}" />`,
    `<meta name="robots" content="noindex, nofollow" />`,
  ].join('\n    ');
  return html.includes('</head>') ? html.replace('</head>', `    ${tags}\n  </head>`) : tags + html;
};

const fetchWithTimeout = async (url) => {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), BACKEND_TIMEOUT_MS);
  try {
    return await fetch(url, { signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
};

// 백엔드에서 고인 이름만 가져온다. 어떤 실패든 null — 기본 카드로 떨어진다(카드가 깨지는 것보다 낫다).
const fetchDeceasedName = async (kind, slug) => {
  const backend = (process.env.VITE_BACKEND_URL || process.env.BACKEND_URL || '').replace(/\/+$/, '');
  if (!backend) return null;
  try {
    const path = kind === 'o' ? `/api/obituaries/${encodeURIComponent(slug)}/og` : `/api/memorials/${encodeURIComponent(slug)}`;
    const res = await fetchWithTimeout(backend + path);
    if (!res.ok) return null;
    const body = await res.json();
    return body?.data?.deceasedName ?? null;
  } catch {
    return null;
  }
};

export default async function handler(req, res) {
  const query = req.query || {};
  const kind = query.kind === 'm' ? 'm' : query.kind === 'o' ? 'o' : null;
  const slug = typeof query.slug === 'string' ? query.slug : '';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const origin = `https://${host}`;

  try {
    const shellRes = await fetchWithTimeout(`${origin}/index.html`);
    if (!shellRes.ok) throw new Error(`index.html ${shellRes.status}`);
    const shell = await shellRes.text();

    const name = kind && SLUG_PATTERN.test(slug) ? await fetchDeceasedName(kind, slug) : null;
    const card = buildCard(kind, name);
    const html = injectMeta(shell, card, { url: `${origin}/${kind ?? 'o'}/${encodeURIComponent(slug)}`, imageUrl: `${origin}${CARD_IMAGE_PATH}` });

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow'); // 07-03 §6.3 — 헤더는 서버 렌더에서 붙는다
    // 종료·수정이 카드에 늦지 않게 짧게만 캐시한다(카카오 쪽 스크랩 캐시는 별도 — 운영 절차, §3.4).
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    res.status(200).send(html);
  } catch {
    // 자기 배포의 index.html을 못 가져온 경우뿐이다(사실상 배포 장애). 셸 없이는 SPA를 열 수 없어 오류로 답한다.
    res.setHeader('Cache-Control', 'no-store');
    res.status(502).send('일시적인 오류입니다. 잠시 후 다시 시도해 주세요.');
  }
}
