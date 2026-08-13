# 🧭 18. URL 라우팅 — 해시 방식 → HistoryRouter(BrowserRouter) 전환 구현 메모

> **문서 성격**: 정식 스펙이 아니라 **구현 메모**다. `docs/17_전문가_계정_체계_구현_메모.md`와 같은 예외 패턴 — 개발자가
> "변경점을 md로 자세히 남겨달라"고 직접 요청해 `[Claude:Sonnet]`이 직접 작성했다(2026-08-10). Gemini가 이 문서를
> 바탕으로 HTML 보고서를 만들 예정이라, 코드를 안 열어봐도 무엇이/왜/어떻게 바뀌었는지 알 수 있게 서술한다.

---

## 1. 배경 — 왜 바꿨나

기존 방식은 `react-router` 같은 라이브러리 없이, `App.tsx`가 `window.location.hash`(`#facility`, `#mypage` 등)와
`hashchange` 이벤트를 직접 다뤄 "탭 전환"을 구현하고 있었다. 개발자 요청(2026-08-10)에 따라 이를 브라우저의
History API 기반(HistoryRouter/BrowserRouter 방식) — 즉 URL이 `/#facility`가 아니라 `/facility`인 방식으로 전환했다.

**해시 방식의 실질적 문제**
- URL이 전부 `/#tab` 형태라 카카오톡 등으로 링크를 공유하면 링크 미리보기·검색엔진이 페이지를 구분하지 못한다 (SPA인데도 사실상 한 페이지로만 보임).
- 탭이 하나 늘 때마다 `App.tsx` 안에서 스크롤 복원·해시 파싱 로직을 손으로 맞춰야 했다(실수 여지).

**바꾸지 않아도 되는 이유가 없었던 이유**: 프론트가 Vercel에 배포되는데, 이미 `eobom/frontend/vercel.json`에
`{ "source": "/(.*)", "destination": "/index.html" }` SPA 캐치올 rewrite가 미리 들어가 있었다 — 즉 인프라 쪽은
이미 History 기반 라우팅을 받아들일 준비가 되어 있었고, 프론트 코드만 뒤처져 있었다.

---

## 2. 무엇이 바뀌었나 (요약)

| 항목 | 이전(해시) | 이후(History) |
|---|---|---|
| URL 형태 | `https://eobom.vercel.app/#facility` | `https://eobom.vercel.app/facility` |
| 라우팅 구현 | `App.tsx`가 `window.location.hash` 직접 파싱 + `hashchange` 리스너 | `react-router-dom` `BrowserRouter` + `Routes`/`Route` |
| 뒤로가기 판별 | `isBackNavigation` ref를 수동으로 세팅 | `useNavigationType()`(`'POP'`) — 브라우저가 알려주는 값을 그대로 사용 |
| 알 수 없는 경로 | 없음(해시가 없으면 그냥 home) | `<Route path="*" element={<Navigate to="/" />} />` — 홈으로 리다이렉트 |
| `setActiveTab`/`activeTab` 인터페이스 | 함수 시그니처 `(tab: string) => void` | **동일하게 유지** — 내부 구현만 `navigate()`로 교체 |

**중요**: `Header.tsx`, `Sidebar.tsx`, `HomePage.tsx`, `MyPage.tsx` 등 `setActiveTab`을 호출하던 4개 컴포넌트는
**한 줄도 고치지 않았다.** `setActiveTab(tab: string)`이라는 예전 인터페이스를 `App.tsx`가 그대로 유지한 채 내부
구현만 해시 조작에서 `navigate()` 호출로 바꿨기 때문 — 마이그레이션 반경을 최소화하기 위한 의도적 설계.

---

## 3. 건드린 파일

- **수정**: `eobom/frontend/src/App.tsx` (전면 재작성 — 아래 §4 상세)
- **신규 의존성**: `react-router-dom` (`^6`) — `eobom/frontend/package.json`
- **변경 없음(이미 준비돼 있었음)**: `eobom/frontend/vercel.json` — SPA rewrite 기존 설정 그대로 재사용
- **변경 없음**: `Header.tsx`, `Sidebar.tsx`, `HomePage.tsx`, `MyPage.tsx`, 백엔드(`authController.ts`) 전부 — §5 참고

---

## 4. `App.tsx` 상세 변경

### 4.1 구조 분리
`App` 컴포넌트를 `<BrowserRouter>`로 감싸는 얇은 wrapper로 만들고, 기존 로직 전체를 `AppShell`이라는 내부
컴포넌트로 옮겼다. `useLocation`/`useNavigate`/`useNavigationType`은 `BrowserRouter` 하위에서만 쓸 수 있는
훅이라 이렇게 분리해야 한다.

### 4.2 탭 ↔ 경로 매핑
```
activeTab = location.pathname.replace(/^\//, '') || 'home'   // '/facility' -> 'facility', '/' -> 'home'
setActiveTab(tab) 내부: navigate(tab === 'home' ? '/' : `/${tab}`)
```
9개 탭(`home, facility, counseling, digital-estate, ending-note, care-guide, mypage, partner, admin`)을
전부 `<Route path="/...">`로 등록했다. `admin`은 기존과 동일하게 **어디에도 링크 노출 안 함 — 직접 URL로만 접근**.

### 4.3 스크롤 복원 로직
기존: `isBackNavigation` ref를 `hashchange` 핸들러 안에서 수동으로 `true`로 세팅.
이후: `react-router-dom`의 `useNavigationType()`이 반환하는 `'POP'`(뒤로/앞으로가기)을 그대로 사용 — 같은 동작을
더 적은 코드로, 브라우저가 실제로 알려주는 값을 신뢰해서 구현.

### 4.4 OAuth 소셜 로그인 콜백 처리 — **백엔드 무변경**
백엔드(`authController.ts`)는 로그인 성공/실패/계정연동 신호를 여전히 `${FRONTEND_URL}/#loginSuccess?token=...`,
`/#socialLinkPrompt?...`, `/#mypage?linkSuccess=...` 형태로 리다이렉트한다. **이건 페이지 라우팅과 무관한
1회성 신호 채널이라 바꿀 필요가 없었다** — `pathname`은 항상 `/`(홈)로 오고, `hash`(`#loginSuccess?...`)는
`window.location.hash`로 그대로 읽을 수 있기 때문에 History 라우팅과 100% 호환된다. 처리 후 정리하는
`window.history.replaceState` 호출만 `pathname + '#home'` → `'/'`(또는 `/mypage`)로 바꿨다.

### 4.5 죽은 코드 정리
`localStorage.setItem('k_ending_active_tab', tab)` — 프로젝트 전체에서 **읽는 곳이 없는 죽은 코드**였다(grep으로
확인). URL 자체가 이제 탭 상태의 유일한 소스이므로 정리하며 함께 제거했다.

---

## 5. 안 건드린 것 (의도적)

- **Header/Sidebar/HomePage/MyPage**: `setActiveTab`/`activeTab` prop 인터페이스가 동일해서 무변경.
- **백엔드**: OAuth 리다이렉트 URL 포맷 무변경(§4.4).
- **`vercel.json`**: 이미 SPA rewrite가 있어서 무변경.

---

## 6. 검증

- `tsc && vite build` 통과.
- 로컬 dev 서버(mkcert HTTPS, 별도 포트)로 직접 딥링크 접속 스모크 테스트: `GET /facility` → 200 + 정상 HTML 셸 응답 확인(SPA rewrite와 동일하게 동작하는 것을 dev 서버 레벨에서 확인 — Vercel 배포본은 실제 배포 후 별도 확인 필요).
- **브라우저 클릭 E2E는 미검증**(이 세션에 브라우저 자동화 도구 없음) — 메뉴 클릭 이동, 뒤로가기 스크롤 복원, 소셜 로그인 콜백 후 홈 이동 3가지는 사용자가 실제 브라우저에서 확인 필요.

---

## 7. 배포 시 확인할 것

1. **Vercel 배포 후 딥링크 새로고침**: 배포된 도메인에서 `/facility`로 직접 들어가거나 새로고침했을 때 404가 아니라 정상 렌더링되는지 확인(`vercel.json` rewrite가 프리뷰/프로덕션 배포 둘 다에 적용되는지는 로컬에서 확인 불가).
2. **카카오톡 링크 공유 미리보기**: 이번 전환의 실질적 동기였던 부분 — `/facility` 같은 URL을 카카오톡에 붙여넣었을 때 미리보기가 달라지는지는 OG 메타태그가 없어 아직 큰 차이는 없을 수 있음(별도 작업 필요, 이번 범위 밖).
3. **기존에 `#facility` 형태로 북마크/공유된 링크**: 이번 전환으로 `/#facility`가 더 이상 자동으로 `/facility`로 안내되지 않는다 — 홈(`/`)이 뜨고 만다. 트래픽이 있다면 하위호환 리다이렉트(예: 앱 시작 시 `location.hash`에 남은 탭 이름이 있으면 `navigate`) 추가를 검토할 것(이번엔 요청 범위 밖이라 안 넣음).
