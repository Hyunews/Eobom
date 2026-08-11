# ⚡ 04. 기능 및 REST API 명세서

> **문서 목적**: 이어봄 (Eobom) 백엔드 API 서버(`eobom/backend`)의 엔드포인트 규격 및 요청/응답 페이로드를 정의합니다.

---

## 📡 1. 인증 도메인 (`/api/auth`)

* **`GET /api/auth/kakao`**: 카카오 OAuth 로그인 리다이렉트
* **`GET /api/auth/kakao/callback`**: 카카오 인증 콜백 및 계정 연동/통합 로직 처리
* **`GET /api/auth/naver/callback`**: 네이버 인증 콜백
* **`GET /api/auth/google/callback`**: 구글 인증 콜백
* **`POST /api/auth/confirm-link`**: 이메일 중복 시 계정 통합(`MERGE`) 또는 독립 생성(`CREATE_NEW`) 확정
* **`GET /api/auth/me`**: 현재 로그인된 유저 프로필 및 연동된 소셜 계정 목록 수신

---

## 🪦 2. 시설 도메인 (`/api/facilities`)

* **`GET /api/facilities`**: 장례식장/수목장 카테고리, 예산, LBS 반경 필터링 목록 조회
* **`GET /api/facilities/:id`**: 시설 상세 및 VR 이미지, 상세 견적 데이터 조회
* **`POST /api/facilities/:id/reviews`**: 답사/이용 완료 유저 리뷰 및 별점 작성 (`facility_reviews`)
* **`POST /api/facilities/:id/bookings`**: 1-Touch 답사 예약 신청
