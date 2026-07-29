# DEWD Design System & UX Directives (DESIGN.md)

This document serves as the **authoritative design system and UX specification** for **DEWD (Digital Ending & Well-Dying Total Care Platform)**. It encapsulates all visual tokens, layout boundaries, page specifications, user preferences, and instructions for Google Stitch and AI design generators.

---

## 🎨 1. Brand Identity & Visual Aesthetics

* **Brand Name**: DEWD (Digital Ending & Well-Dying Total Care)
* **Target Audience**: 3040 family guardians (children) and 5060 seniors preparing well-dying.
* **Core Philosophy**: Dignified, warm, calm, trustworthy, and modern Korean digital ending platform.
* **Design Aesthetic**: Premium Dark Slate & Warm Cream Gold, Glassmorphism, smooth micro-interactions, clear visual hierarchy.

---

## 🖌️ 2. Design Tokens & Color Palette

### Primary Colors
* **Primary (Deep Navy)**: `#1E293B` (Trustworthy, solemn, calm)
* **Primary Light**: `#334155`
* **Point Accent (Warm Gold/Amber)**: `#D97706` / `#B47318` (Warmth, dignity, hope)
* **Point Light**: `#FBBF24`

### Backgrounds & Surfaces
* **Main Background**: `#F8FAFC` (Clean, soft light gray)
* **Card Surface**: `#FFFFFF`
* **Secondary Background**: `#F7F4EF` (Warm cream tone)
* **Dark Overlay**: `rgba(15, 23, 42, 0.75)`
* **Glassmorphism Blur**: `backdropFilter: blur(8px)`

### Typography & Text Colors
* **Primary Text**: `#0F172A` (Dark Slate)
* **Muted Text**: `#64748B` (Subtle Slate)
* **Light Text (On Dark)**: `#F8FAFC`
* **Font Family**: `'Noto Sans KR'`, `'Outfit'`, `-apple-system`, `sans-serif`

---

## 📐 3. Global Layout & Boundary Rules

1. **Header & Logo Placement**:
   - Logo (`🌿 DEWD 토탈 케어`) MUST ALWAYS stay attached to the **far left edge**.
   - Login/User profile button MUST ALWAYS stay attached to the **far right edge**.
   - Header spans 100% full width with `#D97706` accent bottom border.
2. **Container Width**:
   - Fluid 100% responsive width (`maxWidth: 1400px`) for wide desktop monitors.
3. **No Numbers in Titles**:
   - ALL page titles and homepage feature cards MUST NOT contain leading numbers (`1.`, `2.`, `3.`, `4.`, `5.`).
4. **State & Tab Persistence**:
   - Active navigation tab and login state MUST persist across F5 browser refreshes using URL Hash (`#tab`) and `localStorage`.

---

## 🔒 4. UX & Control Flow Rules

1. **User-Friendly Terminology (No Technical Jargon)**:
   - Do NOT expose raw technical jargon like `AES-256` in UI text; use intuitive, warm terms such as `최고 등급 암호화` and `유족 유언 메시지 & 비밀 보관함`.
2. **Auth Guard & Blur Lock Overlay**:
   - Unauthenticated access (`!currentUser`) to private features renders a `backdropFilter: blur(8px)` overlay with a centered lock card and a prominent `🔑 로그인 / 회원가입 하러가기` button that opens the login modal.
3. **Unconnected Features Labeling**:
   - Buttons or actions not yet connected to backend APIs MUST be explicitly labeled with **`(개발중)`** (In Development) and trigger informative alert dialogues.

---

## 🧩 5. Page-by-Page Component Specifications

### 5.1 Header & Sidebar
* **Header**: Deep Navy (`#1E293B`), Logo on far left, Login button on far right.
* **Hover Sidebar**: Collapsed `70px` icon-only state that smoothly expands to `240px` on mouse hover. Hover tips removed.

### 5.2 Home Dashboard (`HomePage`)
* **Hero Layout**: 2-Column Responsive Layout (`gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))'`). Left column features prominent high-contrast headline typography (`fontSize: 2.5rem`, `fontWeight: 800`, `letterSpacing: -0.03em`), warm gold highlight (`#D97706`), clear subtitle contrast, and clean minimalist value cards. Right column features a serene, high-resolution aesthetic photograph (`calm_boat.png`) symbolizing a peaceful life journey with rounded corners (`16px`), soft shadow, and backdrop-filtered overlay caption.

### 5.2 Facility Matching Page (`FacilityPage`)
* **Filters**: Category (All, Funeral Home, Cemetery/Tree Burial), Budget Range (<=500만, 500만~1,000만, >=1,000만), Region (All 8 Korean regions: Entire, Seoul, Gyeonggi/Incheon, Gangwon, Chungcheong, Gyeongsang/Daegu/Busan, Jeolla/Gwangju, Jeju), Religion, Guest Count.
* **Action Buttons**: `지도 보기` & `답사 예약`. Buttons MUST have `whiteSpace: 'nowrap'` and compact padding so text never wraps into two lines.

### 5.3 Digital Estate Page (`DigitalEstatePage`)
* **Layout Order**: Proof document upload box (`가족관계증명서 / 사망진단서`) MUST be placed at the **VERY TOP** of the tab before the digital account settlement list.

### 5.4 Ending Note Page (`EndingNotePage`)
* **Dual Access Timing Structure**:
  * **Pre-Mortem Emergency Access**: Pre-intent for life-sustaining treatment + emergency caregiver contact input + mobile emergency QR card (`🏥 생전/응급 시 대리인 즉시 열람 가능`).
  * **Post-Mortem Release**: Family Secret Message & Vault (`유족을 위한 유언 메시지 & 비밀 보관함`).

### 5.5 Care Guide Page (`CareGuidePage`)
* D-Day administrative checklist + Mobile obituary generator with `카카오톡 부고장 전송하기 (개발중)` action.

### 5.6 Footer (`Footer`)
* **3-Column Layout**:
  * Col 1 (Left): `🌿 DEWD 토탈 케어` (Platform summary)
  * Col 2 (Center): `🔒 보안 & 약관` (Security & Terms)
  * Col 3 (Right): `📞 고객센터 & 24h 긴급콜` (1588-0000 / 365일 24시간 긴급 장례 지도사 즉시 파견 시스템)
* Uniform `1.1rem` bold column titles and `#9CA3AF` body text.

---

## 🤖 6. Google Stitch System Instructions

When generating new UI screens or components for DEWD using **Google Stitch**, provide this system prompt:

> **System Prompt for Google Stitch**:
> "Generate UI components for 'DEWD Total Care Platform', a dignified Korean Digital Ending & Well-Dying service. Apply a color palette of Deep Navy (`#1E293B`), Warm Gold Accent (`#D97706`), and Clean Cream Surfaces (`#F8FAFC`). Maintain a 100% fluid responsive layout (`maxWidth: 1400px`), 12px rounded corners, smooth micro-animations, 'Noto Sans KR' typography, clear '(개발중)' status tags for unlinked actions, and glassmorphism blur overlays (`blur(8px)`) for member-only locked areas."

---
