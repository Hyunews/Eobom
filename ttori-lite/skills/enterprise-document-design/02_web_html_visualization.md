# 🌐 HTML 웹페이지 & 대시보드 시각화 표준 가이드

> **적용 대상:** 웹 기반 기획서, 대시보드, 웹 애플리케이션 UI, 디지털 기획 문서

---

## 1. 디자인 시스템 & 디지인 토큰 (`:root`)

디지털 엔딩 기획서에서 검증된 프리미엄 톤앤매너를 기본 시스템 토큰으로 활용한다:

```css
:root {
    /* Brand Color Palette */
    --primary-color: #1A2B4C;    /* 딥 네이비 (주색 60%) */
    --primary-light: #2A3F66;
    --secondary-color: #F7F4EF;  /* 소프트 베이지 (보조색 30%) */
    --secondary-dark: #EAE5DC;
    --point-color: #4E7055;      /* 웜 그리너리 (강조색 10%) */
    --point-light: #5F8567;
    
    /* Neutral & Text Colors */
    --text-main: #2F3E46;
    --text-muted: #6C7A89;
    --border-color: #DFDCD7;
    --card-bg: #FFFFFF;
    
    /* Accessibility & Dimensions */
    --base-font-size: 18px;      /* 최소 18px 이상 (시니어/저시력 배려) */
    --min-touch-target: 56px;    /* 터치/클릭 높이 56px (오치수 방지) */
    --border-radius: 12px;
    --transition-speed: 0.3s;
    --box-shadow: 0 8px 30px rgba(0, 0, 0, 0.05);
    --box-shadow-hover: 0 12px 40px rgba(0, 0, 0, 0.1);
}
```

---

## 2. 레이아웃 & 그리드 시스템 (Grid & Layout)

* **12-Column Responsive Grid**: `display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem;`
* **Card Dashboard Pattern**:
  * 배경은 pure white (`#FFFFFF`)에 1px `#DFDCD7` 테두리 적용.
  * Hover 시 `translateY(-5px)` 이동 및 `box-shadow` 심화로 반응형 인터랙션 제공.
  * 상단 테두리에 포인트 칼라(예: 5px solid `#1A2B4C` 또는 `#4E7055`)를 부여해 카드의 분류를 시각화.

---

## 3. 웹 타이포그래피 & 가독성 원칙

* **Google Fonts 연동**: `Noto Sans KR` (한글) + `Outfit` (영문/숫자 타이틀)
* **폰트 크기 비중**:
  * `H1 (Hero Title)`: `2.4rem (38px)` Bold
  * `H2 (Section Header)`: `1.8rem (28px)` Bold
  * `H3 (Card Header)`: `1.3rem (20px)` Bold
  * `Body Text`: `1.1rem (18px)` Regular / Line-height 1.7

---

## 4. 접근성 (Accessibility & UI Quality)

1. **High Contrast Mode**: 텍스트와 배경 간 명도 대비 ratio 최소 4.5:1 이상 유지.
2. **Interactive Elements**: 모든 버튼 및 탭의 높이는 `var(--min-touch-target)` (56px) 준수.
3. **Sticky Navigation**: 네비게이션 바는 `position: sticky; top: 0;`으로 상단 고정하여 문서 탐색 용이성 확보.
4. **Floating Action Call**: 긴급 액션 또는 핵심 CTA 버튼은 우측 하단 플로팅 형태로 고정 배치.
