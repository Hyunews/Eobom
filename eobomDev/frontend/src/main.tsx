// 00-44 §9-4 — 새 디자인(redesign)은 /preview 아래에서만 연다. 새 CSS가 지금 화면에 새지 않도록,
// 그리고 지금 CSS(index.css·design-v2.css)가 미리보기에 섞이지 않도록 진입점을 갈라 불러온다.
if (window.location.pathname === '/preview' || window.location.pathname.startsWith('/preview/')) {
  import('./redesign/main')
} else {
  import('./legacyMain')
}
