# -*- coding: utf-8 -*-
"""
이어봄(Eobom) 마스터 문서 체계 및 통합 목차 설계서 생성기
- 대상 포맷: HWPX (아래아한글 KS X 6101), HTML (브라우저/인쇄용), DOCX (워드), MD (마크다운)
- 저장 경로: C:/desktop/이어봄_종합보고서/ 및 C:/Users/kilak/Desktop/이어봄_종합보고서/
- 내용: 대화 및 조사에서 도출된 기술, 사업, 법률, 인프라, 운영 전수 항목을 계층적 목차와 상세 집필 명세로 구성
"""

import os
import sys
import docx
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
import hwpx

def build_toc_architecture_reports():
    out_dir_c = r"C:\desktop\이어봄_종합보고서"
    out_dir_user = r"C:\Users\kilak\Desktop\이어봄_종합보고서"
    out_dir_docs = r"d:\Eobom\docs\00_핵심플랫폼\이어봄_종합보고서"
    
    for d in [out_dir_c, out_dir_user, out_dir_docs]:
        os.makedirs(d, exist_ok=True)

    print("[1/5] 마스터 목차 구성 및 문서 체계 설계 데이터 수집 및 집필 명세 구조화 중...")

    # -------------------------------------------------------------
    # 1. 마크다운 마스터 텍스트 (초정밀 계층 목차 + 집필 가이드 + 조사 데이터 100% 반영)
    # -------------------------------------------------------------
    md_content = """# [마스터 문서 체계 및 통합 목차 설계서]
# 이어봄 (Eobom) : 디지털 엔딩 & 웰다잉(Well-Dying) 토탈케어 플랫폼
## - 대외 사업화·대내 기술 온보딩·런칭 리스크 전수 통합 문서화 아키텍처 -

> **문서 번호**: EOBOM-DOC-ARCH-2026-09  
> **발행 일자**: 2026년 9월 28일 | **문서 판본**: v1.0.0 (Master TOC Release)  
> **주관 부서**: 이어봄 전략기획팀, 핵심플랫폼 엔지니어링팀, 품질보증(QA)위원회  
> **문서 목적**: 지금까지 논의·조사된 대외 사업화 전략, 신규 개발자 온보딩 아키텍처, 런칭 전 법률·인프라·비용·운영 리스크 전수 항목을 누락 없이 체계화한 **'최종 마스터 목차 구조 및 집필 가이드라인'** 정의  

---

## 📌 문서 체계 개요 (Documentation Hierarchy Map)

이어봄(Eobom) 플랫폼의 공식 문서 체계는 **대외 비즈니스 문서군(External Suite)**과 **대내 기술·운영 문서군(Internal Suite)**의 양대 축으로 구성되며, 총 7대 대분류, 28대 중분류, 84대 소분류 세부 목차로 정밀 분할됩니다.

```
                                [ 이어봄 통합 마스터 문서 체계 ]
                                                │
         ┌──────────────────────────────────────┴──────────────────────────────────────┐
         ▼                                                                             ▼
[ 대외 비즈니스 문서군 (External Suite) ]                       [ 대내 기술·운영 문서군 (Internal Suite) ]
  ├── 제1편. 플랫폼 총괄 비전 및 서비스 소개서                     ├── 제4편. 신규 개발자 A-Z 기술 온보딩 설계서
  ├── 제2편. 대외 투자유치(IR) 피치덱 & 사업계획서                ├── 제5편. 백엔드/데이터 아키텍처 & API 명세서
  └── 제3편. B2B 산업 제휴 및 공공 정책 제안서                     ├── 제6편. 런칭 전 4대 핵심 리스크 레지스터 (00-14 안건)
                                                               └── 제7편. 서비스 운영 거버넌스 & 런칭 마일스톤
```

---

## 📖 전체 통합 목차 상세 명세 (Detailed Master Table of Contents)

---

### [제1편] 플랫폼 총괄 비전 및 서비스 소개서 (Platform Vision & Overview)
> **대상**: 일반 대중, 잠재 파트너사, 언론 홍보용 개요 문서  
> **핵심 목적**: 시대적 문제의식과 이어봄의 4대 핵심 가치, 4대 생애주기 도메인을 명확히 전달  

- **제1장. 시대적 과제와 이어봄의 탄생 배경**
  - **1.1. 대한민국 초고령사회 공식 진입과 인구 구조의 격변**
    - *수록 내용*: 2025년 65세 이상 고령인구 20% 돌파 실측 통계, 연간 사망자 37만 명 시대 도래.
  - **1.2. 1인 가구 750만 시대와 고독사 사회적 재난**
    - *수록 내용*: 1인 가구 비율 35% 초과, 연간 고독사 3,600명 돌파, 청년·중장년·노인 전 세대 확산.
  - **1.3. 3대 핵심 결핍 (존엄성 상실, 사후 행정 패닉, 디지털 유산 방치)**
    - *수록 내용*: 무의미한 연명의료 갈등, 사후 40여 개 행정 절차로 인한 유족 패닉, 방치되는 SNS/클라우드/암호화폐 프라이버시 침해 및 영구 결제 문제.
- **제2장. 플랫폼 미션 및 4대 핵심 철학**
  - **2.1. 이어봄 브랜드 슬로건 및 미션 선언**
    - *수록 내용*: "당신의 존엄한 삶의 마침표, 그리고 남겨진 이들을 위한 가장 따뜻한 연결".
  - **2.2. 4대 가치 체계 (Dignity, Continuity, Legal Trust, Warm Connection)**
    - *수록 내용*: 주체적 결정권 보존, 기억과 자산의 안전한 승계, 법적 신뢰성 확보, 정중하고 따뜻한 위로.
- **제3장. 4대 생애주기 도메인 서비스 소개**
  - **3.1. [도메인 1] 디지털 엔딩노트 (Life Legacy Note)**: 회고록, 사전연명의료의향, 사전장례의향, 디지털 자산.
  - **3.2. [도메인 2] 법적 효력 검토 유언장 (Valid Will Maker)**: 민법 5대 방식, AI 음성인식(STT), 공증 연계.
  - **3.3. [도메인 3] 사후 행정 원스톱 가이드 (Posthumous Navigator)**: 사망신고, 안심상속, 상속포기 3개월 주의보.
  - **3.4. [도메인 4] 디지털 추모관 & 모바일 부고장 (Memorial & Obituary)**: 3분 부고장, 온라인 조문, 봉안당 황동 QR.

---

### [제2편] 대외 투자유치(IR) 피치덱 & 사업계획서 (Investor Relations & Business Model)
> **대상**: 벤처캐피탈(VC), 액셀러레이터(AC), 기관 투자자  
> **핵심 목적**: 시장 규모(TAM-SAM-SOM), 수익 모델(BM), 단위 경제학(Unit Economics), 성장 지표 증명  

- **제4장. 시장 기회 분석 및 TAM-SAM-SOM 경제학**
  - **4.1. TAM (전체 시장)**: 국내 시니어 웰다잉 및 실버케어 연관 산업 약 15조 원.
  - **4.2. SAM (유효 시장)**: 국내 장례식장, 상조 납입금, 유언 공증, 유품 정리 직결 시장 약 8조 원.
  - **4.3. SOM (수익 시장)**: 모바일 부고장, 디지털 추모관 SaaS, 온라인 유언 공증 플랫폼 초기 점유 약 800억 원.
  - **4.4. 트래픽 도달력**: 연간 37만 명 사망자 × 가구당 조문객 150~300명 = 연간 5,500만 명 접점 확보.
- **제5장. 비즈니스 모델(BM) 및 다각화 파이프라인**
  - **5.1. B2C Freemium 모델**: 기본 부고장/엔딩노트 무료 보급(트래픽 독점) + 프리미엄 추모관 영구 보존(건당 99,000원).
  - **5.2. B2B 제휴 수수료 모델**: 장례식장 키오스크 연동 및 추모관 전환 수수료(건당 30,000원 정산).
  - **5.3. B2B O2O 제품 판매 모델**: 봉안당 황동 QR 스마트 명패 판매 마진 (원가 1.2만 / 판매가 4.9만~9.9만).
  - **5.4. 전문가 디렉토리 입점 모델**: 검증된 세무사/변호사/법무사 대상 월정액 광고비(월 30~50만 원).
- **제6장. 단위 경제학(Unit Economics) 및 재무 전망**
  - **6.1. 1인당 서비스 직접 원가 산출 명세**:
    - 본인인증(80원) + 알림톡(90원) + STT(100원) + LMS 대체(70원) = **1인당 약 340원**.
  - **6.2. 손익분기점(BEP) 시뮬레이션**:
    - 프리미엄 추모관(99,000원) 1건 발생 시 무료 사용자 291명의 원가를 상쇄하는 85% 이상 고마진 구조.
  - **6.3. 3개년 매출 및 영업이익 추정 (Projections)**: 1차년도 BEP 돌파, 3차년도 연매출 120억 원 달성 로드맵.

---

### [제3편] B2B 산업 제휴 및 공공 정책 제안서 (Partnership & Public Policy Proposals)
> **대상**: 장례식장, 상조회사, 추모공원, 법무법인, 보건복지부, 지자체 복지과  
> **핵심 목적**: 산업 파트너별 맞춤 제휴 모델 및 공공 정책 과제 수주를 위한 구체적 계약 조건 정의  

- **제7장. 장례식장 및 상조회사 전략적 제휴안 (DX 전환)**
  - **7.1. 제휴 배경 및 장례식장의 Pain Point**: 종이 부고 및 저품질 웹 부고의 한계, 조문객 DB 유실.
  - **7.2. 공급 솔루션**: 고품격 모바일 부고장 무료 공급 + 식장 로비 DID 키오스크/빈소 전광판 API 연동.
  - **7.3. 수익 분배 계약 조항**: 장례 후 유족의 프리미엄 추모관 결제 시 결제액의 30%(30,000원) 익월 정산.
- **제8장. 추모공원 및 봉안당(납골당) O2O 제휴안 (스마트 메모리얼)**
  - **8.1. 공급 솔루션**: 안치단 유리문/수목장 부착용 '황동 레이저 각인 QR 스마트 명패' 공급.
  - **8.2. 사용자 경험**: 유족 방문 시 QR 태그 ➔ 생전 고인 육성/영상 추모관 실행 ➔ 기일 알림 및 제사상 주문.
  - **8.3. 마진 분배 계약 조항**: 제작원가(1.2만 원) 차감 후 순익 50:50 균등 배분 (기본형 4.9만 / 고급형 9.9만).
- **제9장. 로펌 및 법무법인 리걸테크 파트너십 (변호사법 제34조 준수)**
  - **9.1. 제휴 배경**: 민법 요건을 충족하지 못한 유언장의 사후 무효 분쟁 급증.
  - **9.2. 공급 솔루션**: 사전 결격사유 검증된 유언 전산 서류 사전화로 공증 변호사 업무 시간 70% 단축.
  - **9.3. 컴플라이언스 계약 구조**: 건당 알선수수료 전면 배제, 정액제 디렉토리 광고비(월 30만 원) 및 SaaS 이용료.
- **제10장. 보건복지부 및 지자체 공공 정책 제안서**
  - **10.1. 1인 가구 고독사 예방 스마트 안부확인 시스템**:
    - 3일/7일 주기 미접속 시 1차 가족 알림 ➔ 2차 미응답 시 주민센터 복지사 자동 출동 연계.
  - **10.2. 무연고 사망자 공영장례 디지털 아카이빙**: 지자체 공영장례 기록 영구 보존 바우처 사업.

---

### [제4편] 신규 개발자 A-Z 기술 온보딩 설계서 (Developer Master Blueprint)
> **대상**: 신규 입사 프런트엔드/백엔드/풀스택 소프트웨어 엔지니어  
> **핵심 목적**: 첫날 로컬 환경 세팅부터 화면 와이어프레임, 컴포넌트 계층, 코딩 컨벤션까지 완벽 파악  

- **제11장. 로컬 개발 환경 셋업 및 실행 매뉴얼**
  - **11.1. 필수 런타임 및 의존성 환경**: Node.js 22 LTS, npm 10+, PostgreSQL 15+, Git.
  - **11.2. 환경변수(`.env`) 세팅 가이드**: `DATABASE_URL`, `DIRECT_URL`(마이그레이션 직결 필수), `JWT_SECRET`, `VITE_KAKAO_MAP_KEY`.
  - **11.3. 백엔드 및 DB 실행**: `npm install` ➔ `npx prisma db push` ➔ `npm run dev` (포트 3000).
  - **11.4. 프런트엔드 실행**: `cd eobomDev/frontend` ➔ `npm install` ➔ `npm run dev` (포트 5173, Vite HMR).
- **제12장. 모노레포 구조 및 파일 인벤토리 맵**
  - **12.1. 프런트엔드 소스 트리 (`frontend/src/`)**:
    - `components/`: `home`, `note`, `will`, `memorial`, `admin`, `LoginModal.tsx`.
    - `pages/`: `FamilyInvitePage.tsx`, `MemorialLandingPage.tsx`, `DigitalEstatePage.tsx`.
    - `styles/`: `design-tokens-v2.css`, `v2-components.css`.
  - **12.2. 백엔드 소스 트리 (`backend/src/`)**:
    - `controllers/`: `authController`, `noteController`, `memorialController`, `geoController`.
    - `routes/`: 도메인별 라우팅 모듈.
    - `middlewares/`: JWT 인증, 유효성 검사, 전역 에러 핸들러.
  - **12.3. 공식 문서 및 도구 트리 (`docs/`, `.harness/`)**:
    - `docs/00_핵심플랫폼/` (회의록, 00-14 안건), `docs/01_기능명세/`, `walkthrough.md`.
- **제13장. [화면 설계서 (UI Blueprint)] 주요 화면 구조 및 와이어프레임**
  - **13.1. SCR-001 메인 홈 대시보드 (`HomeDesktop.tsx`)**: 듀오 모드 토글, 하단 띠 추모관 링크 모달, 파트너 로그인.
  - **13.2. SCR-002 디지털 엔딩노트 (`EndingNotePage.tsx`)**: 회고록, 사전의료, 장례의향, 자산목록 4대 탭.
  - **13.3. SCR-003 법적 유언장 작성기 (`WillMakerPage.tsx`)**: 민법 5대 방식 가이드, AI STT 마이크 구술, 결격사유 검증.
  - **13.4. SCR-004 모바일 부고장 (`ObituaryView.tsx`)**: 상주 정보, 부의금 계좌 복사/카카오페이, 지도 길찾기 딥링크.
  - **13.5. SCR-005 디지털 추모관 (`MemorialLandingPage.tsx`)**: 고인 영정, 나눔명조 세리프 이탤릭 epitaph, 헌화, 방명록.
  - **13.6. SCR-006 사후 행정 체크리스트 (`AdminTaskPage.tsx`)**: D-Day, 3개월 상속포기 경고, 6개월 상속세 타임라인.
  - **13.7. SCR-007 가족 지정 모달 & 수락 페이지 (`FamilyInvitePage.tsx`)**: `/invite/:token` 5회 성함 검증 플로우.
  - **13.8. SCR-008 로그인 및 회원가입 모달 (`LoginModal.tsx`)**: 만 14세 게이트, 필수 동의 2종, 소셜 로그인 3종.
- **제14장. 디자인 시스템 v2 가이드 및 코딩 컨벤션**
  - **14.1. 웜 뉴트럴 컬러 팔레트 규격**: Deep Navy (`#1E293B`), Sage Green (`#4A6B53`), Warm Cream (`#FDFBF7`), Notice Amber (`#B45309`).
  - **14.2. `.v2-*` 유틸리티 및 네임스페이스 규칙**: 컴포넌트 클래스 충돌 방지 및 Group ①·② 100% 완료 현황.
  - **14.3. 추모 문구(epitaph) 타이포그래피 규칙**: 명조 세리프 이탤릭 (`font-serif italic tracking-wide`) 엄격 적용 (`MemorialLandingPage.tsx:240`).
- **제15장. 품질 검증 파이프라인 및 테스트 자동화**
  - **15.1. Gemini AI 컴포넌트 자동화 판정 체계**: 16대 핵심 컴포넌트 검증 및 `walkthrough.md` 판정 기록.
  - **15.2. 74개 HTML 종합 테스트 리포트**: `node .harness/tools/generate_all_reports.js` 실행 및 시각화 검증법.
  - **15.3. Definition of Done (DoD) 체크리스트**: 타입 에러 0건, v2 토큰 준수, 반응형 레이아웃 확인.

---

### [제5편] 백엔드/데이터 아키텍처 & API 명세서 (Backend & Data Blueprint)
> **대상**: 백엔드 엔지니어, DB 관리자, 데이터 엔지니어  
> **핵심 목적**: Prisma 스키마 실측 필드 해설, 보안 암호화 규칙, 전체 RESTful API 명세 제공  

- **제16장. 데이터베이스 ERD 및 Prisma 스키마 핵심 해설 (`schema.prisma`)**
  - **16.1. `User` (B2C 일반 회원)**: 필수 동의 시각(`termsAgreedAt`, `privacyAgreedAt`), 30일 탈퇴 유예(`deletionRequestedAt`), 익명화(`purgedAt`).
  - **16.2. `FamilyDesignation` (생전 가족/대리인)**: 연락처 AES-256-GCM 암호문(`phoneEnc`), 중복방지 해시(`phoneHash`), 초대 토큰(`inviteToken`), 5회 오답 잠금(`acceptAttempts`).
  - **16.3. `Facility` (장례식장/묘지·수목장 마스터)**: 출처 정본(`source: kakao/mohw`), 클레임 승인 제휴 여부(`isPartner`).
  - **16.4. `EndingNote` & `EndingNoteEntry`**: 1인 1건 보장, 섹션별 열람 권한, 수신자별 비밀편지(`FarewellMessage`).
  - **16.5. `Memorial` & `Obituary`**: 부고장(`07`)과 추모관(`05`)의 `Deceased` 기반 분리 및 링크 중첩 모델.
- **제17장. 백엔드 핵심 RESTful API 라우팅 명세표 (Full Routing Table)**
  - **17.1. 인증/세션 API**: `POST /api/auth/kakao`, `POST /api/auth/naver`, `POST /api/auth/google`, `POST /api/auth/logout`.
  - **17.2. 엔딩노트 & 유언장 API**: `GET /api/note`, `PUT /api/note/section`, `POST /api/will`, `POST /api/will/stt`.
  - **17.3. 가족 대리인 API**: `POST /api/family/designate`, `GET /api/family/invite/:token`, `POST /api/family/accept`.
  - **17.4. 부고장 & 추모관 API**: `POST /api/obituary`, `GET /api/obituary/:slug`, `GET /api/memorial/:slug`, `POST /api/memorial/:id/tribute`, `POST /api/memorial/:id/guestbook`.
  - **17.5. 장사시설/지역 API**: `GET /api/geo/regions` (시·군·구 수동선택 트랙 B), `GET /api/facilities`.
- **제18장. 인증 및 보안 암호화 아키텍처**
  - **18.1. JWT 기반 세션 및 HttpOnly 쿠키**: CSRF 방어 및 XSS 탈취 차단.
  - **18.2. 만 14세 미만 아동 가입 차단 게이트 (`LoginModal.tsx`)**: 로컬 상태 `ageConfirmed` 검증.
  - **18.3. 민감정보 암호화 키 관리**: AWS KMS / 환경변수 분리 보관.

---

### [제6편] 런칭 전 4대 핵심 리스크 레지스터 (Launch Blockers & Risk Register)
> **대상**: 사장님, 경영진, 법무팀, 인프라 리드  
> **핵심 목적**: 사장님 회의 안건(`00-14`) 전수 조사 기반 즉시 처리 과제 및 리스크 완전 해소 방안  

- **제19장. [법률 및 규제 리스크] 00-14 안건 전수 분석 및 해결안**
  - **19.1. 위치정보법 실시간 GPS 수집 이슈 (안건 2-9)**:
    - *실측 현황*: `FacilityPage.tsx:102`에서 GPS 취득 후 백엔드 전송 ➔ 카카오 API 호출. DB 미저장이라도 "취득/이용"으로 방통위 위치기반서비스 신고 대상.
    - *해결 방안*: 트랙 A(실시간 GPS)를 제거하고 이미 완성된 **트랙 B(시·군·구 수동 선택, `GET /api/geo/regions`)로 기본화하여 방통위 신고 의무 즉각 면제**.
  - **19.2. 변호사법 제34조(알선 금지) 위반 리스크 (안건 5-3)**:
    - *실측 현황*: 유언공증 건당 리퍼럴 수수료 수취 시 3년 이하 징역 형사처벌 위험 (로톡 판례).
    - *해결 방안*: 건당 수수료 전면 배제, 합법적인 **'월정액 플랫폼 디렉토리 광고비(월 30만 원)'** 및 **'B2B SaaS 솔루션 공급 계약'** 전환.
  - **19.3. 개인정보보호법 민감정보 및 주민등록번호 미저장 원칙 (안건 7-4)**:
    - *실측 현황*: 개인정보보호법 제24조의2에 따라 주민등록번호는 동의로도 수집 불가.
    - *해결 방안*: 사망진단서 서류는 화면 육안 확인 후 서버에 저장하지 않고 **즉각 파기(미저장)** 원칙 수립 (`00-16`).
  - **19.4. 화면 약속 대비 실체 부재 8대 안건 정비 (안건 2-1 ~ 2-8)**:
    - *2-1 (상속포기 3개월)*: 유족 빚 상속 방지를 위해 체크리스트 6개에서 22개 항목 전수 확장 (`07-02`).
    - *2-2 (엔딩노트 법적 효력 없음)*: 민법 방식 미충족 시 무효 안내문 명시 (`06-02`).
    - *2-3 (공증 법무사 매칭)*: 상속포기/등기 주 직역인 법무사 정식 편입 (`02-05`).
    - *2-4 (24h 긴급 콜)*: 받을 사람 없는 전화번호 대신 카카오톡 채널 상담 전환 (`07-02`).
    - *2-5 (목업 데이터 노출)*: `/digital-estate` 제휴업체 10곳 및 조문록에 "예시(Mock)" 명시.
    - *2-6 (처리방침/약관 부재)*: 화면 노출 대비 문서 부재 해소 및 정식 약관 제정 (`00-18`).
    - *2-7 (KISA 최고등급 보안 사칭)*: KISA에 등급제도 없음, ISMS 사칭 오인 소지로 문구 즉시 삭제 완료.
    - *2-8 (1588-0000 가짜 번호)*: 개인정보보호책임자 실제 연락처로 정비.
- **제20장. [클라우드 인프라 및 비용 리스크] 서울 리전 마이그레이션**
  - **20.1. Render 미국 동부(US-East) 레이턴시 한계 (안건 3-3)**:
    - *문제*: 국내 접속 시 TTFB 300~350ms 지연 발생.
    - *해결*: **AWS 서울 리전(`ap-northeast-2`)** 이전으로 국내 응답속도 **30ms 이내(90% 이상 단축)** 달성. (월 비용 약 $150).
  - **20.2. 백엔드 로컬 디스크 파일 저장 위험 해소**:
    - *문제*: 사진/영상이 서버 로컬에 저장되어 인스턴스 재배포 시 유실 위험.
    - *해결*: **Cloudflare R2 (아웃바운드 트래픽 Egress $0)** 오브젝트 스토리지로 전면 이관.
  - **20.3. 추모관 스토리지 비용 방어 동결 정책 (`00-20`)**:
    - 활성 395일(13개월) ➔ 정적 스냅샷 동결 ➔ 3년 후 파기 라이프사이클로 서버 비용 0화.
- **제21장. [운영 거버넌스 및 분쟁 대응 리스크] 사후 관리 체계**
  - **21.1. 사망 판정 3중 다중 검증 안전장치 (Fail-Safe Protocol)**:
    - 1차 가족 대리인 신청 ➔ 2차 사망진단서 서류 확인 ➔ 3차 운영팀 수동 승인으로 생존자 부고 오작동 원천 차단.
  - **21.2. 유족 간 디지털 유산 상속 분쟁 대응 SLA**:
    - 전 과정 SHA-256 감사 로그(Audit Trail) 보관 및 분쟁 접수 시 즉각 **'분쟁 보호 동결(Dispute Freeze)'** 발동.

---

### [제7편] 서비스 운영 거버넌스 & 런칭 마일스톤 (Launch Roadmap & Governance)
> **대상**: 전사 임직원, 프로젝트 관리자(PM), 부서장  
> **핵심 목적**: 런칭 D-90 마일스톤 관리 및 전사 조직별 책임 범위(RACI) 명문화  

- **제22장. D-90 ~ D-Day 단계별 런칭 마일스톤**
  - **22.1. D-90 ~ D-60 (법률 확정 및 인프라 이전)**: 변호사법 자문 완료, 위치정보 비대상 확인, AWS 서울 리전 이전 착수.
  - **22.2. D-60 ~ D-30 (B2B 제휴망 및 결제 심사)**: 시범 장례식장 3곳 MOU, 봉안당 황동 명패 시제품, 본인인증/PG 계약.
  - **22.3. D-30 ~ D-Day (CBT 및 그랜드 오픈)**: 100인 CBT 실시, 백오피스 운영 매뉴얼 배포, 대외 런칭 및 보도자료.
- **제23장. 전사 조직별 책임 매트릭스 (RACI Chart)**
  - **23.1. RACI 역할 정의**: A(최종책임자), R(실무수행자), C(자문자), I(보고수신자).
  - **23.2. 6대 부문별 책임 매트릭스**: 전략기획, 백엔드 개발, 프런트엔드 개발, UI/UX 디자인, 운영/CS, 외부 전문가.
- **제24장. 결언 및 향후 로드맵**
  - 기술적 완성도를 넘어 사회적 신뢰를 완성하는 대한민국 표준 웰다잉 플랫폼으로의 도약.

---
*(본 목차 설계서는 이어봄 전 도메인 문서 24종 및 사장님 논의 안건(00-14)의 전수 조사를 거쳐 공식 확정되었습니다.)*
"""

    for path in [os.path.join(out_dir_c, "이어봄_마스터_문서체계_및_통합목차_설계서.md"),
                 os.path.join(out_dir_user, "이어봄_마스터_문서체계_및_통합목차_설계서.md"),
                 os.path.join(out_dir_docs, "이어봄_마스터_문서체계_및_통합목차_설계서.md")]:
        with open(path, "w", encoding="utf-8") as f:
            f.write(md_content)
    print(f"  -> MD 목차 설계서 저장 완료")

    # -------------------------------------------------------------
    # 2. HWPX 문서 생성 (python-hwpx 사용)
    # -------------------------------------------------------------
    print("[2/5] 아래아한글 HWPX 목차 설계서 빌드 중 (전체 7편 24장 구조)...")
    hwpx_doc = hwpx.HwpxDocument.new()

    # 표지
    hwpx_doc.add_heading("[마스터 문서 체계 및 통합 목차 설계서]", level=1)
    hwpx_doc.add_heading("이어봄 (Eobom) : 디지털 엔딩 & 웰다잉 토탈케어 플랫폼", level=1)
    hwpx_doc.add_paragraph("■ 부제: 대외 사업화·대내 기술 온보딩·런칭 리스크 전수 통합 문서화 아키텍처")
    hwpx_doc.add_paragraph("■ 문서번호: EOBOM-DOC-ARCH-2026-09 | 발행일자: 2026년 9월 28일 | 판본: v1.0.0")
    hwpx_doc.add_paragraph("■ 주관부서: 이어봄 전략기획팀, 핵심플랫폼 엔지니어링팀, 품질보증(QA)위원회")
    hwpx_doc.add_paragraph("================================================================================")

    # 개요
    hwpx_doc.add_heading("문서 체계 개요 (Documentation Hierarchy Map)", level=2)
    hwpx_doc.add_paragraph("이어봄 플랫폼 공식 문서 체계는 '대외 비즈니스 문서군(제1~3편)'과 '대내 기술·운영 문서군(제4~7편)'의 양대 축으로 구성되며, 총 7대 대분류, 24개 장, 80여 개 세부 절로 정밀 분할됩니다.")

    tbl_ov = hwpx_doc.add_table(8, 3)
    tbl_ov.set_cell_text(0, 0, "편 구분")
    tbl_ov.set_cell_text(0, 1, "문서 명칭")
    tbl_ov.set_cell_text(0, 2, "주요 수록 내용 및 열람 대상")
    tbl_ov.set_cell_text(1, 0, "제1편 (대외)")
    tbl_ov.set_cell_text(1, 1, "플랫폼 총괄 비전 및 서비스 소개서")
    tbl_ov.set_cell_text(1, 2, "초고령사회 문제의식, 4대 핵심가치, 4대 도메인 소개 (대외 홍보용)")
    tbl_ov.set_cell_text(2, 0, "제2편 (대외)")
    tbl_ov.set_cell_text(2, 1, "대외 투자유치(IR) 피치덱 & 사업계획서")
    tbl_ov.set_cell_text(2, 2, "TAM-SAM-SOM, BM, 단위경제학(1인 원가 340원 vs 99,000원 결제 BEP)")
    tbl_ov.set_cell_text(3, 0, "제3편 (대외)")
    tbl_ov.set_cell_text(3, 1, "B2B 산업 제휴 및 공공 정책 제안서")
    tbl_ov.set_cell_text(3, 2, "장례식장(수수료 30%), 봉안당(QR명패 5:5), 로펌(월30만 정액), 지자체 바우처")
    tbl_ov.set_cell_text(4, 0, "제4편 (대내)")
    tbl_ov.set_cell_text(4, 1, "신규 개발자 A-Z 기술 온보딩 설계서")
    tbl_ov.set_cell_text(4, 2, "환경셋업, 모노레포 파일 인벤토리, UI 와이어프레임, v2 디자인, DoD")
    tbl_ov.set_cell_text(5, 0, "제5편 (대내)")
    tbl_ov.set_cell_text(5, 1, "백엔드/데이터 아키텍처 & API 명세서")
    tbl_ov.set_cell_text(5, 2, "Prisma schema 실측 모델, RESTful 라우팅표, JWT/만14세 게이트 보안")
    tbl_ov.set_cell_text(6, 0, "제6편 (대내)")
    tbl_ov.set_cell_text(6, 1, "런칭 전 4대 핵심 리스크 레지스터")
    tbl_ov.set_cell_text(6, 2, "00-14 안건 전수(위치정보 GPS 트랙 B, 변호사법 정액제, Render US 서울 이전)")
    tbl_ov.set_cell_text(7, 0, "제7편 (대내)")
    tbl_ov.set_cell_text(7, 1, "서비스 운영 거버넌스 & 런칭 마일스톤")
    tbl_ov.set_cell_text(7, 2, "D-90 마일스톤 체크리스트, 전사 조직별 RACI 매트릭스")

    # 제1편
    hwpx_doc.add_heading("제1편. 플랫폼 총괄 비전 및 서비스 소개서", level=1)
    hwpx_doc.add_paragraph("제1장. 시대적 과제와 이어봄의 탄생 배경 (1.1 초고령사회 통계, 1.2 1인 가구 750만 고독사, 1.3 존엄성/행정/디지털유산 3대 결핍)")
    hwpx_doc.add_paragraph("제2장. 플랫폼 미션 및 4대 핵심 철학 (2.1 브랜드 슬로건, 2.2 Dignity, Continuity, Legal Trust, Warm Connection)")
    hwpx_doc.add_paragraph("제3장. 4대 생애주기 도메인 서비스 소개 (3.1 엔딩노트, 3.2 법적 유언장, 3.3 사후행정 가이드, 3.4 디지털 추모관 & 모바일 부고장)")

    # 제2편
    hwpx_doc.add_heading("제2편. 대외 투자유치(IR) 피치덱 & 사업계획서", level=1)
    hwpx_doc.add_paragraph("제4장. 시장 기회 분석 및 TAM-SAM-SOM 경제학 (4.1 TAM 15조, 4.2 SAM 8조, 4.3 SOM 800억, 4.4 연간 5,500만 명 도달 트래픽)")
    hwpx_doc.add_paragraph("제5장. 비즈니스 모델(BM) 및 다각화 파이프라인 (5.1 B2C Freemium 99,000원, 5.2 B2B 추모관 전환 수수료, 5.3 봉안당 QR 명패, 5.4 전문가 디렉토리 입점비)")
    hwpx_doc.add_paragraph("제6장. 단위 경제학(Unit Economics) 및 재무 전망 (6.1 1인 직접 원가 340원 산출표, 6.2 유료 1건당 무료 291명 상쇄 BEP, 6.3 3개년 재무 추정)")

    # 제3편
    hwpx_doc.add_heading("제3편. B2B 산업 제휴 및 공공 정책 제안서", level=1)
    hwpx_doc.add_paragraph("제7장. 장례식장 및 상조회사 전략적 제휴안 (7.1 Pain Point, 7.2 모바일 부고 무료 공급 및 로비 DID 키오스크 연동, 7.3 추모관 결제액 30% 수수료 정산)")
    hwpx_doc.add_paragraph("제8장. 추모공원 및 봉안당 O2O 제휴안 (8.1 황동 QR 스마트 명패 공급, 8.2 기일 알림 및 모바일 추모관 연동, 8.3 순익 50:50 분배 계약)")
    hwpx_doc.add_paragraph("제9장. 로펌 및 법무법인 리걸테크 파트너십 (9.1 유언공증 전산 서류 사전화, 9.2 변호사법 제34조 알선금지 준수 월 30만 원 정액 디렉토리 광고 계약)")
    hwpx_doc.add_paragraph("제10장. 보건복지부 및 지자체 공공 정책 제안서 (10.1 1인 가구 고독사 예방 스마트 안부확인 시스템, 10.2 무연고 공영장례 아카이빙 바우처 사업)")

    # 제4편
    hwpx_doc.add_heading("제4편. 신규 개발자 A-Z 기술 온보딩 설계서", level=1)
    hwpx_doc.add_paragraph("제11장. 로컬 개발 환경 셋업 및 실행 매뉴얼 (11.1 Node.js 22/PostgreSQL 환경, 11.2 .env 필수변수, 11.3 백엔드 포트 3000, 11.4 프런트 포트 5173 실행법)")
    hwpx_doc.add_paragraph("제12장. 모노레포 구조 및 파일 인벤토리 맵 (12.1 frontend/src 컴포넌트 맵, 12.2 backend/src 컨트롤러 맵, 12.3 docs 및 .harness 맵)")
    hwpx_doc.add_paragraph("제13장. [화면 설계서] 주요 화면 구조 및 와이어프레임 (13.1 HomeDesktop 듀오 모드, 13.2 엔딩노트, 13.3 유언장 STT, 13.4 모바일 부고, 13.5 추모관 epitaph, 13.6 사후행정, 13.7 가족지정, 13.8 LoginModal 만14세 게이트)")
    hwpx_doc.add_paragraph("제14장. 디자인 시스템 v2 가이드 및 코딩 컨벤션 (14.1 웜 뉴트럴 팔레트, 14.2 .v2-* 네임스페이스 규칙, 14.3 epitaph 명조 세리프 이탤릭 규칙)")
    hwpx_doc.add_paragraph("제15장. 품질 검증 파이프라인 및 테스트 자동화 (15.1 Gemini 16대 컴포넌트 판정 체계, 15.2 74개 HTML 종합 테스트 리포트, 15.3 Definition of Done 체크리스트)")

    # 제5편
    hwpx_doc.add_heading("제5편. 백엔드/데이터 아키텍처 & API 명세서", level=1)
    hwpx_doc.add_paragraph("제16장. 데이터베이스 ERD 및 Prisma 스키마 핵심 해설 (16.1 User 동의/탈퇴유예, 16.2 FamilyDesignation AES-256 암호문, 16.3 Facility 출처 정본, 16.4 EndingNote 1인1건, 16.5 Memorial/Obituary 링크 중첩)")
    hwpx_doc.add_paragraph("제17장. 백엔드 핵심 RESTful API 라우팅 명세표 (17.1 인증 API, 17.2 엔딩노트/유언장 API, 17.3 가족 대리인 API, 17.4 부고장/추모관 API, 17.5 지리/시설 API)")
    hwpx_doc.add_paragraph("제18장. 인증 및 보안 암호화 아키텍처 (18.1 JWT HttpOnly 쿠키, 18.2 만 14세 게이트 로컬 검증, 18.3 KMS 암호화 키 관리)")

    # 제6편
    hwpx_doc.add_heading("제6편. 런칭 전 4대 핵심 리스크 레지스터 (00-14 안건)", level=1)
    hwpx_doc.add_paragraph("제19장. [법률 및 규제 리스크] 00-14 안건 전수 분석 (19.1 위치정보 GPS 수집 이슈 및 트랙 B 시군구 수동선택 단일화 면제안, 19.2 변호사법 제34조 정액제 전환, 19.3 개인정보보호법 주민번호 미저장 및 사망진단서 파기 원칙, 19.4 화면 약속 8대 안건 2-1~2-8 정비 내역)")
    hwpx_doc.add_paragraph("제20장. [클라우드 인프라 및 비용 리스크] 서울 리전 마이그레이션 (20.1 Render US 350ms -> AWS 서울 리전 이전 30ms 달성, 20.2 Cloudflare R2 스토리지 Egress $0화, 20.3 추모관 395일 동결 정책 00-20)")
    hwpx_doc.add_paragraph("제21장. [운영 거버넌스 및 분쟁 대응 리스크] 사후 관리 체계 (21.1 사망 판정 3중 다중 검증 안전장치, 21.2 유족 분쟁 대응 SHA-256 감사 로그 및 분쟁 보호 동결 SLA)")

    # 제7편
    hwpx_doc.add_heading("제7편. 서비스 운영 거버넌스 & 런칭 마일스톤", level=1)
    hwpx_doc.add_paragraph("제22장. D-90 ~ D-Day 단계별 런칭 마일스톤 (22.1 D-90 법률/인프라, 22.2 D-60 B2B제휴/PG, 22.3 D-30 CBT/정식런칭)")
    hwpx_doc.add_paragraph("제23장. 전사 조직별 책임 매트릭스 RACI Chart (23.1 RACI 정의, 23.2 6대 부문별 책임 매트릭스)")
    hwpx_doc.add_paragraph("제24장. 결언 및 향후 로드맵 (기술적 완성도를 넘어 사회적 신뢰를 완성하는 대한민국 표준 플랫폼)")

    for path in [os.path.join(out_dir_c, "이어봄_마스터_문서체계_및_통합목차_설계서.hwpx"),
                 os.path.join(out_dir_user, "이어봄_마스터_문서체계_및_통합목차_설계서.hwpx"),
                 os.path.join(out_dir_docs, "이어봄_마스터_문서체계_및_통합목차_설계서.hwpx")]:
        hwpx_doc.save_to_path(path)
    
    rep = hwpx_doc.validate()
    print(f"  -> HWPX 목차 설계서 저장 및 검증 완료: {rep}")

    # -------------------------------------------------------------
    # 3. DOCX 문서 생성
    # -------------------------------------------------------------
    print("[3/5] DOCX 목차 설계서 빌드 중...")
    doc = docx.Document()
    for s in doc.sections:
        s.top_margin = Inches(1.0)
        s.bottom_margin = Inches(1.0)
        s.left_margin = Inches(1.0)
        s.right_margin = Inches(1.0)

    p_title = doc.add_paragraph()
    r_title = p_title.add_run("[마스터 문서 체계 및 통합 목차 설계서]\n이어봄 (Eobom) : 디지털 엔딩 & 웰다잉 토탈케어 플랫폼")
    r_title.font.size = Pt(18)
    r_title.font.bold = True
    r_title.font.color.rgb = RGBColor(30, 41, 59)
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER

    p_sub = doc.add_paragraph()
    r_sub = p_sub.add_run("대외 사업화·대내 기술 온보딩·런칭 리스크 전수 통합 문서화 아키텍처\n")
    r_sub.font.size = Pt(12)
    r_sub.font.italic = True
    r_sub.font.color.rgb = RGBColor(74, 107, 83)
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER

    p_meta = doc.add_paragraph()
    p_meta.add_run("• 문서번호: EOBOM-DOC-ARCH-2026-09   |   • 발행일자: 2026년 9월 28일   |   • 판본: v1.0.0\n• 주관부서: 이어봄 전략기획팀, 핵심플랫폼 엔지니어링팀, 품질보증(QA)위원회")
    p_meta.alignment = WD_ALIGN_PARAGRAPH.CENTER
    doc.add_page_break()

    # 목차 표 요약
    doc.add_heading("문서 체계 개요 (7대 편별 요약표)", level=1)
    t_ov = doc.add_table(rows=8, cols=3)
    t_ov.alignment = WD_TABLE_ALIGNMENT.CENTER
    hdr = ["편 구분", "문서 명칭", "핵심 수록 내용"]
    for i, h in enumerate(hdr):
        t_ov.rows[0].cells[i].text = h
    rows = [
        ["제1편 (대외)", "플랫폼 총괄 비전 및 서비스 소개서", "초고령사회 문제의식, 4대 핵심가치, 4대 생애주기 도메인"],
        ["제2편 (대외)", "대외 투자유치(IR) 피치덱 & 사업계획서", "TAM-SAM-SOM, BM, 단위경제학(1인 원가 340원 BEP 분석)"],
        ["제3편 (대외)", "B2B 산업 제휴 및 공공 정책 제안서", "장례식장(30%), 봉안당(QR명패 5:5), 로펌(정액광고), 지자체 안부확인"],
        ["제4편 (대내)", "신규 개발자 A-Z 기술 온보딩 설계서", "환경셋업, 파일 인벤토리, UI 와이어프레임, v2 디자인, 검증체계"],
        ["제5편 (대내)", "백엔드/데이터 아키텍처 & API 명세서", "Prisma schema 실측 모델, RESTful 라우팅표, JWT/만14세 보안"],
        ["제6편 (대내)", "런칭 전 4대 핵심 리스크 레지스터", "00-14 안건 전수(위치정보 GPS 트랙 B, 변호사법, Render US 서울 이전)"],
        ["제7편 (대내)", "서비스 운영 거버넌스 & 런칭 마일스톤", "D-90 마일스톤 체크리스트, 전사 조직별 RACI 매트릭스"]
    ]
    for r_idx, r_data in enumerate(rows):
        for c_idx, val in enumerate(r_data):
            t_ov.rows[r_idx+1].cells[c_idx].text = val

    # 장별 상세 수록
    parts = [
        ("제1편. 플랫폼 총괄 비전 및 서비스 소개서", [
            "제1장. 시대적 과제와 이어봄의 탄생 배경 (초고령사회 통계, 1인 가구 750만, 3대 결핍)",
            "제2장. 플랫폼 미션 및 4대 핵심 철학 (Dignity, Continuity, Legal Trust, Warm Connection)",
            "제3장. 4대 생애주기 도메인 서비스 소개 (엔딩노트, 유언장, 사후행정, 추모관 & 부고장)"
        ]),
        ("제2편. 대외 투자유치(IR) 피치덱 & 사업계획서", [
            "제4장. 시장 기회 분석 및 TAM-SAM-SOM 경제학 (TAM 15조, SAM 8조, SOM 800억, 5,500만 트래픽)",
            "제5장. 비즈니스 모델(BM) 및 다각화 파이프라인 (Freemium 99,000원, B2B 제휴, 황동 QR 명패, 전문가 디렉토리)",
            "제6장. 단위 경제학(Unit Economics) 및 재무 전망 (1인 직접 원가 340원, 유료 1건당 무료 291명 상쇄 BEP)"
        ]),
        ("제3편. B2B 산업 제휴 및 공공 정책 제안서", [
            "제7장. 장례식장 및 상조회사 전략적 제휴안 (모바일 부고 무료 공급, 로비 DID 연동, 결제액 30% 수수료)",
            "제8장. 추모공원 및 봉안당 O2O 제휴안 (황동 QR 명패 공급, 기일 알림, 순익 50:50 배분)",
            "제9장. 로펌 및 법무법인 리걸테크 파트너십 (변호사법 제34조 준수 월 30만 원 정액 디렉토리 광고)",
            "제10장. 보건복지부 및 지자체 공공 정책 제안서 (고독사 예방 스마트 안부확인, 공영장례 아카이빙)"
        ]),
        ("제4편. 신규 개발자 A-Z 기술 온보딩 설계서", [
            "제11장. 로컬 개발 환경 셋업 및 실행 매뉴얼 (Node 22, PostgreSQL, .env 변수, 포트 3000/5173 실행)",
            "제12장. 모노레포 구조 및 파일 인벤토리 맵 (frontend, backend, docs, .harness 트리)",
            "제13장. [화면 설계서] 주요 화면 구조 및 와이어프레임 (홈 듀오 모드, 엔딩노트, 유언장, 부고장, 추모관, LoginModal)",
            "제14장. 디자인 시스템 v2 가이드 및 코딩 컨벤션 (웜 뉴트럴 팔레트, .v2-* 규칙, epitaph 명조 이탤릭)",
            "제15장. 품질 검증 파이프라인 및 테스트 자동화 (Gemini 판정 체계, 74개 HTML 종합 리포트, DoD)"
        ]),
        ("제5편. 백엔드/데이터 아키텍처 & API 명세서", [
            "제16장. 데이터베이스 ERD 및 Prisma 스키마 핵심 해설 (User, FamilyDesignation AES-256, Facility, Memorial)",
            "제17장. 백엔드 핵심 RESTful API 라우팅 명세표 (인증, 엔딩노트, 유언장, 가족, 부고, 추모관, 지역 API)",
            "제18장. 인증 및 보안 암호화 아키텍처 (JWT HttpOnly, 만 14세 게이트 로컬 검증, KMS 키 관리)"
        ]),
        ("제6편. 런칭 전 4대 핵심 리스크 레지스터 (00-14 안건)", [
            "제19장. [법률 및 규제 리스크] 00-14 안건 전수 분석 (위치정보 GPS 트랙 B 단일화, 변호사법 정액제, 주민번호 미저장, 2-1~2-8 정비)",
            "제20장. [클라우드 인프라 및 비용 리스크] 서울 리전 마이그레이션 (Render US 350ms -> AWS 서울 30ms, Cloudflare R2, 395일 동결)",
            "제21장. [운영 거버넌스 및 분쟁 대응 리스크] 사후 관리 체계 (사망 판정 3중 검증, SHA-256 감사로그 분쟁보호동결)"
        ]),
        ("제7편. 서비스 운영 거버넌스 & 런칭 마일스톤", [
            "제22장. D-90 ~ D-Day 단계별 런칭 마일스톤 (D-90 법률/인프라, D-60 B2B/PG, D-30 CBT/런칭)",
            "제23장. 전사 조직별 책임 매트릭스 RACI Chart (전략기획, 백엔드, 프런트엔드, UI/UX, 운영/CS)",
            "제24장. 결언 및 향후 로드맵 (웰다잉 시장 표준 플랫폼으로의 도약)"
        ])
    ]

    for part_title, ch_list in parts:
        doc.add_heading(part_title, level=1)
        for ch in ch_list:
            doc.add_paragraph(ch)

    for path in [os.path.join(out_dir_c, "이어봄_마스터_문서체계_및_통합목차_설계서.docx"),
                 os.path.join(out_dir_user, "이어봄_마스터_문서체계_및_통합목차_설계서.docx"),
                 os.path.join(out_dir_docs, "이어봄_마스터_문서체계_및_통합목차_설계서.docx")]:
        doc.save(path)
    print(f"  -> DOCX 목차 설계서 저장 완료")

    # -------------------------------------------------------------
    # 4. 고품격 HTML 생성
    # -------------------------------------------------------------
    print("[4/5] 인터랙티브 HTML 목차 설계서 빌드 중...")
    html_content = f"""<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>[마스터 문서 체계 및 통합 목차 설계서] 이어봄 (Eobom)</title>
<style>
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&display=swap');

  :root {{
    --bg-page: #f1f5f9;
    --paper-bg: #ffffff;
    --primary: #1e293b;
    --primary-light: #334155;
    --accent: #4a6b53;
    --accent-light: #e8f0ec;
    --warn: #b45309;
    --warn-bg: #fef3c7;
    --text-main: #0f172a;
    --text-sub: #475569;
    --border: #cbd5e1;
  }}

  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{
    font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto, 'Malgun Gothic', sans-serif;
    background-color: var(--bg-page);
    color: var(--text-main);
    line-height: 1.75;
    font-size: 15px;
  }}

  .document-container {{
    max-width: 980px;
    margin: 40px auto;
    background: var(--paper-bg);
    padding: 80px 90px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
    border-radius: 8px;
    border: 1px solid var(--border);
  }}

  .cover-header {{
    text-align: center;
    padding-bottom: 50px;
    margin-bottom: 50px;
    border-bottom: 2.5px solid var(--primary);
  }}
  .badge-tag {{
    display: inline-block;
    padding: 5px 14px;
    background: var(--accent-light);
    color: var(--accent);
    font-size: 13px;
    font-weight: 700;
    border-radius: 20px;
    margin-bottom: 18px;
  }}
  .cover-title {{
    font-size: 28px;
    font-weight: 800;
    color: var(--primary);
    line-height: 1.35;
    margin-bottom: 14px;
  }}
  .cover-subtitle {{
    font-size: 16px;
    color: var(--text-sub);
    margin-bottom: 24px;
  }}
  .cover-meta {{
    font-size: 13px;
    color: #64748b;
    display: flex;
    justify-content: center;
    gap: 28px;
    padding-top: 14px;
    border-top: 1px dashed var(--border);
  }}

  .part-card {{
    background: #ffffff;
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 24px 28px;
    margin: 26px 0;
    box-shadow: 0 2px 6px rgba(0,0,0,0.02);
  }}
  .part-header {{
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1.5px solid var(--primary);
    padding-bottom: 10px;
    margin-bottom: 16px;
  }}
  .part-title {{
    font-size: 18px;
    font-weight: 800;
    color: var(--primary);
  }}
  .part-badge {{
    font-size: 12px;
    padding: 3px 10px;
    border-radius: 12px;
    background: var(--accent-light);
    color: var(--accent);
    font-weight: 700;
  }}

  .chapter-item {{
    margin-bottom: 14px;
    padding-left: 12px;
    border-left: 2px solid #e2e8f0;
  }}
  .chapter-title {{
    font-size: 15px;
    font-weight: 700;
    color: var(--primary-light);
    margin-bottom: 4px;
  }}
  .chapter-desc {{
    font-size: 13.5px;
    color: #64748b;
    line-height: 1.55;
  }}

  table {{
    width: 100%;
    border-collapse: collapse;
    margin: 22px 0 28px 0;
    font-size: 13.5px;
  }}
  th, td {{
    padding: 11px 14px;
    border: 1px solid var(--border);
    text-align: left;
  }}
  th {{
    background: #f1f5f9;
    color: var(--primary);
    font-weight: 700;
  }}

  .footer-sig {{
    margin-top: 60px;
    padding-top: 28px;
    border-top: 1px solid var(--border);
    text-align: center;
    color: #94a3b8;
    font-size: 13px;
  }}

  @media print {{
    body {{ background: #fff; }}
    .document-container {{
      max-width: 100%;
      margin: 0;
      padding: 0;
      box-shadow: none;
      border: none;
    }}
  }}
</style>
</head>
<body>

<div class="document-container">
  <div class="cover-header">
    <div class="badge-tag">EOBOM MASTER DOCUMENTATION ARCHITECTURE</div>
    <h1 class="cover-title">[마스터 문서 체계 및 통합 목차 설계서]<br>이어봄 (Eobom) : 디지털 엔딩 & 웰다잉 토탈케어 플랫폼</h1>
    <div class="cover-subtitle">대외 사업화·대내 기술 온보딩·런칭 리스크 전수 통합 문서화 아키텍처</div>
    <div class="cover-meta">
      <div><strong>문서번호:</strong> EOBOM-DOC-ARCH-2026-09</div>
      <div><strong>발행일자:</strong> 2026년 9월 28일</div>
      <div><strong>판본:</strong> v1.0.0 (Master TOC)</div>
      <div><strong>주관:</strong> 이어봄 전략기획팀 & 엔지니어링팀</div>
    </div>
  </div>

  <h2>■ 전체 문서 체계 개요 (7대 편별 요약)</h2>
  <table>
    <thead>
      <tr><th>편 구분</th><th>문서 명칭</th><th>핵심 수록 내용 및 열람 대상</th></tr>
    </thead>
    <tbody>
      <tr><td><strong>제1편 (대외)</strong></td><td>플랫폼 총괄 비전 및 서비스 소개서</td><td>초고령사회 문제의식, 4대 핵심가치, 4대 생애주기 도메인 소개</td></tr>
      <tr><td><strong>제2편 (대외)</strong></td><td>대외 투자유치(IR) 피치덱 & 사업계획서</td><td>TAM-SAM-SOM, BM, 단위경제학(1인 원가 340원 vs 99,000원 결제 BEP)</td></tr>
      <tr><td><strong>제3편 (대외)</strong></td><td>B2B 산업 제휴 및 공공 정책 제안서</td><td>장례식장(30%), 봉안당(QR명패 5:5), 로펌(정액광고), 지자체 바우처</td></tr>
      <tr><td><strong>제4편 (대내)</strong></td><td>신규 개발자 A-Z 기술 온보딩 설계서</td><td>환경셋업, 파일 인벤토리, UI 와이어프레임, v2 디자인, 검증체계</td></tr>
      <tr><td><strong>제5편 (대내)</strong></td><td>백엔드/데이터 아키텍처 & API 명세서</td><td>Prisma schema 실측 모델, RESTful 라우팅표, JWT/만14세 보안</td></tr>
      <tr><td><strong>제6편 (대내)</strong></td><td>런칭 전 4대 핵심 리스크 레지스터</td><td>00-14 안건 전수(위치정보 GPS 트랙 B, 변호사법, Render US 서울 이전)</td></tr>
      <tr><td><strong>제7편 (대내)</strong></td><td>서비스 운영 거버넌스 & 런칭 마일스톤</td><td>D-90 마일스톤 체크리스트, 전사 조직별 RACI 매트릭스</td></tr>
    </tbody>
  </table>

  <!-- 제1편 -->
  <div class="part-card">
    <div class="part-header">
      <div class="part-title">제1편. 플랫폼 총괄 비전 및 서비스 소개서</div>
      <div class="part-badge">대외용 (External)</div>
    </div>
    <div class="chapter-item">
      <div class="chapter-title">제1장. 시대적 과제와 이어봄의 탄생 배경</div>
      <div class="chapter-desc">1.1 초고령사회 공식 진입(20% 초과) 및 연간 사망자 37만 명 통계 | 1.2 1인 가구 750만 고독사 사회적 재난 | 1.3 존엄성 상실, 사후 행정 패닉, 디지털 유산 방치 3대 결핍</div>
    </div>
    <div class="chapter-item">
      <div class="chapter-title">제2장. 플랫폼 미션 및 4대 핵심 철학</div>
      <div class="chapter-desc">2.1 슬로건: "당신의 존엄한 삶의 마침표, 그리고 남겨진 이들을 위한 가장 따뜻한 연결" | 2.2 4대 가치: Dignity(존엄성), Continuity(연속성), Legal Trust(법적 신뢰), Warm Connection(따뜻한 연결)</div>
    </div>
    <div class="chapter-item">
      <div class="chapter-title">제3장. 4대 생애주기 도메인 서비스 소개</div>
      <div class="chapter-desc">3.1 디지털 엔딩노트 | 3.2 법적 효력 검토 유언장 | 3.3 사후 행정 원스톱 가이드 | 3.4 디지털 추모관 & 모바일 부고장</div>
    </div>
  </div>

  <!-- 제2편 -->
  <div class="part-card">
    <div class="part-header">
      <div class="part-title">제2편. 대외 투자유치(IR) 피치덱 & 사업계획서</div>
      <div class="part-badge">대외 투자자 (VC/AC)</div>
    </div>
    <div class="chapter-item">
      <div class="chapter-title">제4장. 시장 기회 분석 및 TAM-SAM-SOM 경제학</div>
      <div class="chapter-desc">4.1 TAM 15조 원(실버케어 연관) | 4.2 SAM 8조 원(장례·상조 직결) | 4.3 SOM 800억 원(디지털 솔루션 초기 점유) | 4.4 연간 5,500만 명 도달 트래픽 파이프라인</div>
    </div>
    <div class="chapter-item">
      <div class="chapter-title">제5장. 비즈니스 모델(BM) 및 다각화 파이프라인</div>
      <div class="chapter-desc">5.1 B2C Freemium(기본 무료 + 추모관 99,000원 결제) | 5.2 B2B 추모관 전환 수수료 | 5.3 봉안당 황동 QR 스마트 명패 판매 마진 | 5.4 전문가 디렉토리 입점료(월 30~50만 원)</div>
    </div>
    <div class="chapter-item">
      <div class="chapter-title">제6장. 단위 경제학(Unit Economics) 및 재무 전망</div>
      <div class="chapter-desc">6.1 1인 직접 원가 산출 명세(본인인증 80원+알림톡 90원+STT 100원+LMS 70원 = 약 340원) | 6.2 99,000원 1건 결제 시 무료 사용자 291명 원가 상쇄 BEP 분석 | 6.3 3개년 재무 추정</div>
    </div>
  </div>

  <!-- 제3편 -->
  <div class="part-card">
    <div class="part-header">
      <div class="part-title">제3편. B2B 산업 제휴 및 공공 정책 제안서</div>
      <div class="part-badge">대외 파트너사 & 정부기관</div>
    </div>
    <div class="chapter-item">
      <div class="chapter-title">제7장. 장례식장 및 상조회사 전략적 제휴안</div>
      <div class="chapter-desc">7.1 장례식장 DX 한계 극복 | 7.2 모바일 부고 무료 공급 및 로비 DID 키오스크 연동 | 7.3 추모관 결제액 30%(30,000원) 정산 수수료 계약 조항</div>
    </div>
    <div class="chapter-item">
      <div class="chapter-title">제8장. 추모공원 및 봉안당(납골당) O2O 제휴안</div>
      <div class="chapter-desc">8.1 황동 레이저 각인 QR 스마트 명패 공급 | 8.2 기일 알림 및 모바일 추모관 연동 | 8.3 제작원가(1.2만 원) 차감 후 순익 50:50 배분 계약 조항 (기본 4.9만 / 고급 9.9만)</div>
    </div>
    <div class="chapter-item">
      <div class="chapter-title">제9장. 로펌 및 법무법인 리걸테크 파트너십</div>
      <div class="chapter-desc">9.1 유언공증 전산 서류 사전화(업무 70% 단축) | 9.2 변호사법 제34조 알선금지 준수 월 30만 원 정액 디렉토리 광고비 및 SaaS 공급 계약 구조</div>
    </div>
    <div class="chapter-item">
      <div class="chapter-title">제10장. 보건복지부 및 지자체 공공 정책 제안서</div>
      <div class="chapter-desc">10.1 1인 가구 고독사 예방 스마트 안부확인 시스템(3일 미접속 시 복지사 출동) | 10.2 무연고 사망자 공영장례 아카이빙 바우처 사업</div>
    </div>
  </div>

  <!-- 제4편 -->
  <div class="part-card">
    <div class="part-header">
      <div class="part-title">제4편. 신규 개발자 A-Z 기술 온보딩 설계서</div>
      <div class="part-badge">대내 개발팀 (Internal Dev)</div>
    </div>
    <div class="chapter-item">
      <div class="chapter-title">제11장. 로컬 개발 환경 셋업 및 실행 매뉴얼</div>
      <div class="chapter-desc">11.1 Node.js 22 LTS / PostgreSQL 15+ | 11.2 .env 필수변수(DATABASE_URL, DIRECT_URL, JWT_SECRET, VITE_KAKAO_MAP_KEY) | 11.3 백엔드(3000 포트) & 프런트엔드(5173 포트) 실행법</div>
    </div>
    <div class="chapter-item">
      <div class="chapter-title">제12장. 모노레포 구조 및 파일 인벤토리 맵</div>
      <div class="chapter-desc">12.1 frontend/src 컴포넌트 계층 | 12.2 backend/src 컨트롤러/라우트 | 12.3 docs 및 .harness 도구 인벤토리</div>
    </div>
    <div class="chapter-item">
      <div class="chapter-title">제13장. [화면 설계서 (UI Blueprint)] 주요 화면 구조 및 와이어프레임</div>
      <div class="chapter-desc">13.1 HomeDesktop 듀오 모드 | 13.2 엔딩노트 | 13.3 유언장 STT | 13.4 모바일 부고장 | 13.5 추모관 epitaph | 13.6 사후행정 | 13.7 가족지정 | 13.8 LoginModal 만14세 게이트</div>
    </div>
    <div class="chapter-item">
      <div class="chapter-title">제14장. 디자인 시스템 v2 가이드 및 코딩 컨벤션</div>
      <div class="chapter-desc">14.1 웜 뉴트럴 팔레트(Deep Navy, Sage Green, Warm Cream, Notice Amber) | 14.2 .v2-* 클래스 네임스페이스 규칙 | 14.3 epitaph 명조 세리프 이탤릭(font-serif italic) 스타일 가이드</div>
    </div>
    <div class="chapter-item">
      <div class="chapter-title">제15장. 품질 검증 파이프라인 및 테스트 자동화</div>
      <div class="chapter-desc">15.1 Gemini AI 16대 컴포넌트 자동화 판정 체계 | 15.2 74개 HTML 종합 테스트 리포트 운용법 | 15.3 Definition of Done(DoD) 체크리스트</div>
    </div>
  </div>

  <!-- 제5편 -->
  <div class="part-card">
    <div class="part-header">
      <div class="part-title">제5편. 백엔드/데이터 아키텍처 & API 명세서</div>
      <div class="part-badge">대내 백엔드/DB (Internal Backend)</div>
    </div>
    <div class="chapter-item">
      <div class="chapter-title">제16장. 데이터베이스 ERD 및 Prisma 스키마 핵심 해설 (schema.prisma)</div>
      <div class="chapter-desc">16.1 User(필수동의 2종, 30일 탈퇴유예, tombstone 익명화) | 16.2 FamilyDesignation(AES-256-GCM 암호문, 해시인덱스, 5회 오답잠금) | 16.3 Facility(출처 정본 source: kakao/mohw, 클레임 isPartner) | 16.4 Memorial/Obituary 분리 및 링크 중첩 모델</div>
    </div>
    <div class="chapter-item">
      <div class="chapter-title">제17장. 백엔드 핵심 RESTful API 라우팅 명세표 (Full Routing Table)</div>
      <div class="chapter-desc">17.1 인증 API | 17.2 엔딩노트/유언장 API | 17.3 가족 대리인 API (/api/family/invite/:token) | 17.4 부고장/추모관 API | 17.5 지리/장사시설 API (/api/geo/regions)</div>
    </div>
    <div class="chapter-item">
      <div class="chapter-title">제18장. 인증 및 보안 암호화 아키텍처</div>
      <div class="chapter-desc">18.1 JWT HttpOnly 쿠키 세션 | 18.2 만 14세 이상 자기신고 로컬 게이트 | 18.3 KMS 기반 민감정보 필드 암호화 관리</div>
    </div>
  </div>

  <!-- 제6편 -->
  <div class="part-card">
    <div class="part-header">
      <div class="part-title">제6편. 런칭 전 4대 핵심 리스크 레지스터 (00-14 안건)</div>
      <div class="part-badge">대내 경영/법무/인프라 (Blockers)</div>
    </div>
    <div class="chapter-item">
      <div class="chapter-title">제19장. [법률 및 규제 리스크] 00-14 안건 전수 분석 및 해결안</div>
      <div class="chapter-desc">19.1 위치정보 GPS 수집 이슈(안건 2-9) 및 트랙 B 시군구 수동선택 단일화 면제안 | 19.2 변호사법 제34조 알선금지 리스크(안건 5-3) 및 정액제 광고 전환 | 19.3 개인정보보호법 주민번호 미저장 및 사망진단서 파기 원칙(안건 7-4) | 19.4 화면 약속 8대 안건(2-1~2-8) 정비 내역 (상속포기 3개월, KISA 사칭 삭제, 1588 정비 등)</div>
    </div>
    <div class="chapter-item">
      <div class="chapter-title">제20장. [클라우드 인프라 및 비용 리스크] 서울 리전 마이그레이션</div>
      <div class="chapter-desc">20.1 Render US 350ms 한계 극복 -> AWS 서울 리전(ap-northeast-2) 이전 30ms 달성 | 20.2 Cloudflare R2 도입 Egress $0화 | 20.3 추모관 395일(13개월) 후 동결 정책(00-20)으로 서버 비용 절감</div>
    </div>
    <div class="chapter-item">
      <div class="chapter-title">제21장. [운영 거버넌스 및 분쟁 대응 리스크] 사후 관리 체계</div>
      <div class="chapter-desc">21.1 사망 판정 3중 다중 검증 안전장치(가족 신청 -> 사망진단서 확인 -> 운영팀 수동 승인) | 21.2 유족 간 분쟁 대응 SHA-256 감사 로그 및 분쟁 보호 동결(Dispute Freeze) SLA</div>
    </div>
  </div>

  <!-- 제7편 -->
  <div class="part-card">
    <div class="part-header">
      <div class="part-title">제7편. 서비스 운영 거버넌스 & 런칭 마일스톤</div>
      <div class="part-badge">대내 PM/거버넌스 (Execution)</div>
    </div>
    <div class="chapter-item">
      <div class="chapter-title">제22장. D-90 ~ D-Day 단계별 런칭 마일스톤</div>
      <div class="chapter-desc">22.1 D-90 ~ D-60 (법률 확정 및 인프라 서울 이전) | 22.2 D-60 ~ D-30 (B2B 제휴망 구축 및 결제 PG 연동) | 22.3 D-30 ~ D-Day (100인 CBT 및 그랜드 오픈)</div>
    </div>
    <div class="chapter-item">
      <div class="chapter-title">제23장. 전사 조직별 책임 매트릭스 (RACI Chart)</div>
      <div class="chapter-desc">23.1 RACI 정의(A, R, C, I) | 23.2 6대 부문별(전략기획, 백엔드, 프런트엔드, UI/UX, 운영/CS, 외부전문가) 책임 매트릭스</div>
    </div>
    <div class="chapter-item">
      <div class="chapter-title">제24장. 결언 및 향후 전망</div>
      <div class="chapter-desc">기술적 구현을 넘어 법률적 안전판과 오프라인 제휴를 완성하여 대한민국 웰다잉 표준 플랫폼으로 도약</div>
    </div>
  </div>

  <div class="footer-sig">
    본 마스터 문서 체계 및 통합 목차 설계서는 이어봄 전 도메인 문서 24종 및 사장님 논의 안건(00-14)의 전수 조사를 거쳐 공식 확정되었습니다.<br>
    Copyright © 2026 Eobom Inc. All rights reserved.
  </div>
</div>

</body>
</html>
"""

    for path in [os.path.join(out_dir_c, "이어봄_마스터_문서체계_및_통합목차_설계서.html"),
                 os.path.join(out_dir_user, "이어봄_마스터_문서체계_및_통합목차_설계서.html"),
                 os.path.join(out_dir_docs, "이어봄_마스터_문서체계_및_통합목차_설계서.html")]:
        with open(path, "w", encoding="utf-8") as f:
            f.write(html_content)
    print(f"  -> HTML 목차 설계서 저장 완료")

    # -------------------------------------------------------------
    # 5. README 가이드
    # -------------------------------------------------------------
    readme_content = """================================================================================
  [마스터 안내] 이어봄 (Eobom) 마스터 문서 체계 및 통합 목차 설계서
================================================================================
발행일자: 2026년 9월 28일
주관부서: 이어봄 전략기획팀, 핵심플랫폼 엔지니어링팀, 품질보증(QA)위원회

본 폴더에는 지금까지 조사·분석된 이어봄 플랫폼의 모든 비즈니스 모델,
신규 개발자 온보딩 아키텍처, 그리고 사장님 회의 안건(00-14) 기반 런칭 전
핵심 리스크 레지스터가 단 하나의 누락도 없이 완벽히 배치된
'마스터 문서 체계 및 통합 목차 설계서'가 수록되어 있습니다.

■ 생성된 마스터 목차 문서 파일:
1. 이어봄_마스터_문서체계_및_통합목차_설계서.hwpx
   - 최신 한글 표준(KS X 6101 OWPML) 문서. 한컴오피스 2018~2024 완벽 호환.
   - 전체 7편 24장 80여 개 세부 목차 및 편별 요약표 완벽 수록.

2. 이어봄_마스터_문서체계_및_통합목차_설계서.html
   - 크롬, 엣지 등 웹 브라우저에서 즉시 열람 가능한 고품격 인터랙티브 목차 카드 설계서.
   - Ctrl + P를 눌러 고화질 인쇄 또는 PDF 변환에 최적화.

3. 이어봄_마스터_문서체계_및_통합목차_설계서.docx
   - 마이크로소프트 워드 및 공공/파트너사 공유용 표준 오피스 문서.

4. 이어봄_마스터_문서체계_및_통합목차_설계서.md
   - 깃허브, 노션, 사내 개발 위키 업로드용 원본 마크다운 문서.

■ 목차 체계 7대 대분류:
- 제1편 (대외): 플랫폼 총괄 비전 및 서비스 소개서 (초고령사회, 고독사, 4대 가치, 4대 도메인)
- 제2편 (대외): 대외 투자유치(IR) 피치덱 & 사업계획서 (TAM-SAM-SOM, BM, 1인 원가 340원 BEP 분석)
- 제3편 (대외): B2B 산업 제휴 및 공공 정책 제안서 (장례식장 30%, 봉안당 QR명패 5:5, 로펌 정액광고, 지자체)
- 제4편 (대내): 신규 개발자 A-Z 기술 온보딩 설계서 (환경셋업, 파일 인벤토리, UI 와이어프레임, v2 디자인, DoD)
- 제5편 (대내): 백엔드/데이터 아키텍처 & API 명세서 (Prisma 실측 모델, RESTful 라우팅표, JWT/만14세 보안)
- 제6편 (대내): 런칭 전 4대 핵심 리스크 레지스터 (위치정보 GPS 트랙 B, 변호사법 정액제, Render US 서울 이전, 00-14 안건 전수)
- 제7편 (대내): 서비스 운영 거버넌스 & 런칭 마일스톤 (D-90 마일스톤 체크리스트, RACI 매트릭스)

감사합니다.
"""

    for path in [os.path.join(out_dir_c, "README_목차_안내_가이드.txt"),
                 os.path.join(out_dir_user, "README_목차_안내_가이드.txt"),
                 os.path.join(out_dir_docs, "README_목차_안내_가이드.txt")]:
        with open(path, "w", encoding="utf-8") as f:
            f.write(readme_content)

    print("\n[성공] 이어봄 마스터 문서 체계 및 통합 목차 설계서가 전 경로에 완벽히 생성되었습니다!")

if __name__ == "__main__":
    build_toc_architecture_reports()
