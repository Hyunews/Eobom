// 00-44 §9-4 — 새 디자인(redesign)은 /preview 아래에서만 연다. 새 CSS가 지금 화면에 새지 않도록,
// 그리고 지금 CSS(index.css·design-v2.css)가 미리보기에 섞이지 않도록 진입점을 갈라 불러온다.
//
// 10-1: 소셜 로그인은 각 회사를 다녀오는 전체 페이지 이동이고, 서버는 항상 '/'로 돌려보낸다(`/#loginSuccess…` · `/?loginError=…`).
// 미리보기에서 시작한 로그인이면(시작할 때 저장한 돌아올 경로가 /preview 아래) 그 쪽으로 주소만 바꿔 새 앱이 이어받게 한다.
// 🔴 10-9에서 /preview 분기와 함께 이 블록도 걷는다.
const RETURN_PATH_KEY = 'eobom_pending_return_path' // lib/storage.ts PENDING_RETURN_PATH_KEY 와 같은 값(그 파일을 불러오면 지금 화면 묶음이 딸려 온다)
const { pathname, search, hash } = window.location
const isPreviewPath = (p: string) => p === '/preview' || p.startsWith('/preview/')
if (pathname === '/' && (hash.includes('loginSuccess') || hash.includes('socialLinkPrompt') || search.includes('loginError='))) {
  let back: string | null = null
  try {
    back = sessionStorage.getItem(RETURN_PATH_KEY)
  } catch {
    back = null
  }
  if (back && isPreviewPath(back)) window.history.replaceState(null, '', back + search + hash)
}

if (isPreviewPath(window.location.pathname)) {
  import('./redesign/main')
} else {
  import('./legacyMain')
}
