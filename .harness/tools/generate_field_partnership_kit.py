# -*- coding: utf-8 -*-
"""
이어봄(Eobom) 마스터 문서 체계 수정 및 실제 현장 미팅용 B2B 실무 제안서 패키지 생성기
- 수정된 마스터 목차: 현장 영업 실무 킷(Field Kit)을 공식 편제로 전면 편입
- 현장 미팅용 실무 문서 생성:
  1) 장례식장 전용: 무상 모바일 부고 & 키오스크 연동 제안서 + 수익 정산표
  2) 봉안당/추모공원 전용: 황동 QR 스마트 명패 도입 제안서 + 5:5 마진표
  3) 로펌/공증인 전용: 변호사법 제34조 컴플라이언스 준수 리걸테크 제휴안
  4) 지자체/복지과 전용: 1인 가구 고독사 예방 스마트 안부확인 정책제안서
  5) 현장 시연용: 모바일 부고장 & 스마트 명패 실물 출력 샘플 시트
"""

import os
import sys
import docx
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
import hwpx

def build_field_kit_and_revised_architecture():
    dirs = [
        r"C:\desktop\이어봄_종합보고서",
        r"C:\Users\kilak\Desktop\이어봄_종합보고서",
        r"d:\Eobom\docs\00_핵심플랫폼\이어봄_종합보고서"
    ]
    for d in dirs:
        os.makedirs(d, exist_ok=True)

    print("[1/6] 수정된 마스터 문서 체계 (현장 실무 킷 편입 8편 체계) 작성 중...")

    # =========================================================================
    # 1. 수정된 마스터 문서 체계 및 통합 목차 설계서 (MD)
    # =========================================================================
    revised_toc_md = """# [마스터 문서 체계 및 통합 목차 설계서 (개정판)]
# 이어봄 (Eobom) : 디지털 엔딩 & 웰다잉(Well-Dying) 토탈케어 플랫폼
## - 현장 영업 B2B 실무 킷 · 대외 사업화 · 대내 기술 온보딩 통합 아키텍처 -

> **문서 번호**: EOBOM-DOC-ARCH-2026-09-REV2  
> **발행 일자**: 2026년 9월 28일 | **문서 판본**: v2.0.0 (Field-Ready Edition)  
> **주관 부서**: 이어봄 전략기획팀, 현장영업본부, 핵심플랫폼 엔지니어링팀  
> **개정 취지**: 이론적 기획서에 머무르지 않고, **실제 장례식장, 추모공원, 로펌, 지자체 사업장에 직접 들고 가 대표자/실무자에게 즉각 브리핑하고 계약할 수 있는 '현장 영업 B2B 실무 킷(Field-Ready Kit)'을 제2편 공식 편제로 전면 편입**함.

---

## 📌 개정 마스터 문서 체계 맵 (8대 편제)

```
                                [ 이어봄 통합 마스터 문서 체계 (개정) ]
                                                   │
         ┌─────────────────────────────────────────┴─────────────────────────────────────────┐
         ▼                                                                                   ▼
[ 대외 비즈니스 및 현장 영업 문서군 ]                                      [ 대내 기술 및 운영 관리 문서군 ]
  ├── 제1편. 플랫폼 총괄 비전 및 서비스 소개서                               ├── 제5편. 신규 개발자 A-Z 기술 온보딩 설계서
  ├── ⭐ 제2편. [현장영업 B2B 실무 킷] 사업장 미팅용 즉시제안 패키지         ├── 제6편. 백엔드/데이터 아키텍처 & API 명세서
  ├── 제3편. 대외 투자유치(IR) 피치덱 & 사업계획서                           ├── 제7편. 런칭 전 4대 핵심 리스크 레지스터 (00-14 안건)
  └── 제4편. 전략적 파트너십 상위 제휴 및 공공 정책서                       └── 제8편. 서비스 운영 거버넌스 & 런칭 마일스톤
```

---

## 📖 전체 통합 목차 상세 명세 (8대 편제 전수 수록)

---

### [제1편] 플랫폼 총괄 비전 및 서비스 소개서 (Platform Vision & Overview)
- **제1장. 시대적 과제와 이어봄의 탄생 배경**
  - 1.1 대한민국 초고령사회 공식 진입(65세 이상 20% 초과) 및 연간 사망자 37만 명 통계
  - 1.2 1인 가구 750만 시대와 연간 고독사 3,600명 돌파의 사회적 재난
  - 1.3 3대 핵심 결핍 (생애 말기 존엄성 상실, 사후 40여 개 행정 절차 패닉, 디지털 유산 방치)
- **제2장. 플랫폼 미션 및 4대 핵심 철학**
  - 2.1 슬로건: "당신의 존엄한 삶의 마침표, 그리고 남겨진 이들을 위한 가장 따뜻한 연결"
  - 2.2 4대 가치: Dignity(존엄성), Continuity(연속성), Legal Trust(법적 신뢰), Warm Connection(따뜻한 연결)
- **제3장. 4대 생애주기 도메인 서비스 소개**
  - 3.1 [도메인 1] 디지털 엔딩노트 (회고록, 사전연명의료, 사전장례의향, 디지털 자산)
  - 3.2 [도메인 2] 법적 효력 검토 유언장 (민법 제1065조 5대 방식, AI STT 구술, 공증 연계)
  - 3.3 [도메인 3] 사후 행정 원스톱 가이드 (사망신고, 안심상속, 상속포기 3개월 주의보)
  - 3.4 [도메인 4] 디지털 추모관 & 모바일 부고장 (3분 부고장, 온라인 조문, 봉안당 황동 QR)

---

### ⭐ [제2편] [현장영업 B2B 실무 킷] 사업장 미팅용 즉시제안 패키지 (Field-Ready Sales Kit)
> **대상**: 장례식장 원장/사무장, 추모공원/봉안당 대표, 로펌 대표변호사, 지자체 복지과장  
> **핵심 목적**: 사업장 방문 시 테이블 위에 바로 올려놓고 5분 브리핑 및 당일 MOU/계약 체결을 유도하는 실무 문서 세트  

- **제4장. [장례식장 현장 미팅 킷] 무상 모바일 부고 & 키오스크 도입 제안서**
  - 4.1 장례식장 대표자용 1장 브리핑 브로슈어 (원페이저)
  - 4.2 도입 비용 0원 확약서 및 로비 DID 키오스크/빈소 전광판 연동 사양서
  - 4.3 장례식장 수익 정산표: 유족 프리미엄 추모관 전환 시 **결제액 30%(건당 30,000원) 정산 구조**
  - 4.4 표준 업무 제휴 협약서(MOU) 초안 (설치비 없음, 익월 정산 조항)
- **제5장. [추모공원/봉안당 현장 미팅 킷] 황동 QR 스마트 명패 도입 제안서**
  - 5.1 봉안당 원장/관리소장용 스마트 메모리얼 도입 브리핑 시트
  - 5.2 황동 레이저 각인 QR 명패 1:1 실측 도면 (가로 7cm × 세로 3cm, 두께 1.5mm 헤어라인)
  - 5.3 수익 배분표: 제작원가(1.2만 원) 차감 후 **순익 50:50 배분 (기본 4.9만 원 / 고급 9.9만 원)**
  - 5.4 방문 유족 대상 기일 자동 알림 및 추모관 연계 제사상/꽃바구니 주문 시스템 사양
  - 5.5 안치단 부착용 황동 스마트 명패 독점/우선 공급 계약서 초안
- **제6장. [로펌/공증인/법무사 현장 미팅 킷] 리걸테크 파트너십 제안서**
  - 6.1 법률 전문가용 웰다잉 유언공증 연계 솔루션 안내서 (업무 시간 70% 단축)
  - 6.2 **변호사법 제34조(알선 금지) 컴플라이언스 소견 요약서**: 리퍼럴 수수료 0원, 합법적 정액제 입증
  - 6.3 로펌 디렉토리 공식 입점 계약서 초안 (월 300,000원 정액 광고비 및 SaaS 전산 계약)
- **제7장. [지자체 복지과/주민센터 현장 미팅 킷] 고독사 예방 시범사업 정책제안서**
  - 7.1 지자체 공문 양식 고독사 예방 스마트 안부확인 시범사업 기획서 (공문서 포맷)
  - 7.2 이상 징후 감지(3일/7일 미접속) ➔ 1차 대리인 ➔ 2차 담당 복지사 긴급 출동 연계 프로세스 플로우차트
  - 7.3 무연고 사망자 공영장례 기록 보존 및 공공 추모관 아카이빙 바우처 예산안
- **제8장. [유품정리/특수청소 파트너 미팅 킷] 안심 상속 정리 제휴안**
  - 8.1 상속포기/한정승인 3개월 내 유품 처분 시 단순승인 간주(민법 §1026①) 방지 안전장치 안내
  - 8.2 파트너사 등록 신청서 및 불법투기 방지 품질 서약서
- **제9장. [현장 시연용 체험 시트] 출력용 실물 샘플 킷 (Demo Sheet)**
  - 9.1 모바일 부고장 실물 출력 샘플 (QR코드 및 계좌 복사 버튼 구조)
  - 9.2 봉안당 황동 QR 명패 1:1 실측 페이퍼 목업
  - 9.3 3분 완성 사전 장례의향서 오프라인 체험지 (상담 현장용)

---

### [제3편] 대외 투자유치(IR) 피치덱 & 사업계획서 (Investor Relations)
- **제10장. 시장 기회 분석 및 TAM-SAM-SOM 경제학** (TAM 15조, SAM 8조, SOM 800억, 5,500만 도달 트래픽)
- **제11장. 비즈니스 모델(BM) 및 다각화 파이프라인** (Freemium 99,000원, B2B 제휴, 황동 QR 명패, 전문가 디렉토리)
- **제12장. 단위 경제학(Unit Economics) 및 재무 전망** (1인 직접 원가 340원, 유료 1건당 무료 291명 상쇄 BEP 분석)

---

### [제4편] 전략적 파트너십 상위 제휴 및 공공 정책서 (Partnership Master Framework)
- **제13장. B2B 산업군별 상위 협력 마스터플랜** (장례 DX, 추모공원 O2O, 리걸테크, 공공 복지)
- **제14장. 보건복지부 및 중앙정부 정책 연계 과제** (노인맞춤돌봄서비스 연계, 웰다잉 교육 바우처)

---

### [제5편] 신규 개발자 A-Z 기술 온보딩 설계서 (Developer Master Blueprint)
- **제15장. 로컬 개발 환경 셋업 및 실행 매뉴얼** (Node 22, PostgreSQL, .env 변수, 백엔드 3000/프런트 5173)
- **제16장. 모노레포 구조 및 파일 인벤토리 맵** (frontend, backend, docs, .harness 인벤토리)
- **제17장. [화면 설계서 (UI Blueprint)] 주요 화면 구조 및 와이어프레임**
  - SCR-001 홈 듀오 모드, SCR-002 엔딩노트, SCR-003 유언장 STT, SCR-004 모바일 부고장, SCR-005 추모관 epitaph, SCR-006 사후행정, SCR-007 가족지정, SCR-008 LoginModal 만14세 게이트
- **제18장. 디자인 시스템 v2 가이드 및 코딩 컨벤션** (웜 뉴트럴 팔레트, .v2-* 네임스페이스, epitaph 명조 세리프 이탤릭)
- **제19장. 품질 검증 파이프라인 및 테스트 자동화** (Gemini 16대 컴포넌트 판정 체계, 74개 HTML 종합 테스트 리포트, DoD)

---

### [제6편] 백엔드/데이터 아키텍처 & API 명세서 (Backend & Data Blueprint)
- **제20장. 데이터베이스 ERD 및 Prisma 스키마 핵심 해설** (`User`, `FamilyDesignation` AES-256, `Facility`, `Memorial/Obituary`)
- **제21장. 백엔드 핵심 RESTful API 라우팅 명세표** (인증, 엔딩노트, 유언장, 가족, 부고장, 추모관, 지리 API 15종)
- **제22장. 인증 및 보안 암호화 아키텍처** (JWT HttpOnly 쿠키, 만 14세 게이트, KMS 암호화 키 관리)

---

### [제7편] 런칭 전 4대 핵심 리스크 레지스터 (00-14 사장님 안건 전수 반영)
- **제23장. [법률 및 규제 리스크] 00-14 안건 전수 분석 및 해결안**
  - 23.1 위치정보법 실시간 GPS 이슈(안건 2-9) 및 트랙 B 시군구 수동선택 단일화 면제안
  - 23.2 변호사법 제34조 알선금지 리스크(안건 5-3) 및 정액제 광고(월 30만 원) 전환
  - 23.3 개인정보보호법 주민번호 미저장 및 사망진단서 즉시 파기 원칙(안건 7-4)
  - 23.4 화면 약속 대비 실체 부재 8대 안건(2-1~2-8) 정비 내역 (상속포기 3개월, KISA 사칭 삭제, 1588 정비 등)
- **제24장. [클라우드 인프라 및 비용 리스크] 서울 리전 마이그레이션**
  - 24.1 Render US 350ms 한계 극복 ➔ AWS 서울 리전(ap-northeast-2) 이전으로 30ms 달성
  - 24.2 Cloudflare R2 도입으로 아웃바운드 트래픽(Egress) $0 달성
  - 24.3 추모관 395일(13개월) 후 정적 스냅샷 동결 정책(`00-20`)으로 서버 비용 0화
- **제25장. [운영 거버넌스 및 분쟁 대응 리스크] 사후 관리 체계**
  - 25.1 사망 판정 3중 다중 검증 안전장치 (가족 신청 ➔ 사망진단서 확인 ➔ 운영팀 수동 승인)
  - 25.2 유족 간 분쟁 대응 SHA-256 감사 로그 및 분쟁 보호 동결(Dispute Freeze) SLA

---

### [제8편] 서비스 운영 거버넌스 & 런칭 마일스톤 (Launch Roadmap & RACI)
- **제26장. D-90 ~ D-Day 단계별 런칭 마일스톤** (D-90 법률/인프라, D-60 B2B/PG, D-30 CBT/런칭)
- **제27장. 전사 조직별 책임 매트릭스 (RACI Chart)** (6대 부문별 책임 매트릭스)
- **제28장. 결언 및 향후 전망**
"""

    for d in dirs:
        with open(os.path.join(d, "이어봄_마스터_문서체계_및_통합목차_설계서.md"), "w", encoding="utf-8") as f:
            f.write(revised_toc_md)
    print("  -> 개정 마스터 목차 MD 저장 완료")

    # =========================================================================
    # 2. 수정된 마스터 목차 HWPX 생성
    # =========================================================================
    hwpx_doc = hwpx.HwpxDocument.new()
    hwpx_doc.add_heading("[마스터 문서 체계 및 통합 목차 설계서 (개정판)]", level=1)
    hwpx_doc.add_heading("이어봄 (Eobom) : 디지털 엔딩 & 웰다잉 토탈케어 플랫폼", level=1)
    hwpx_doc.add_paragraph("■ 부제: 현장 영업 B2B 실무 킷 · 대외 사업화 · 대내 기술 온보딩 통합 아키텍처")
    hwpx_doc.add_paragraph("■ 문서번호: EOBOM-DOC-ARCH-2026-09-REV2 | 발행일자: 2026년 9월 28일 | 판본: v2.0.0")
    hwpx_doc.add_paragraph("■ 주관부서: 이어봄 전략기획팀, 현장영업본부, 핵심플랫폼 엔지니어링팀")
    hwpx_doc.add_paragraph("================================================================================")
    
    hwpx_doc.add_heading("문서 체계 8대 편제 요약표 (현장 실무 킷 전면 편입)", level=2)
    tbl_ov = hwpx_doc.add_table(9, 3)
    tbl_ov.set_cell_text(0, 0, "편 구분")
    tbl_ov.set_cell_text(0, 1, "문서 명칭")
    tbl_ov.set_cell_text(0, 2, "주요 수록 내용 및 열람 대상")
    tbl_ov.set_cell_text(1, 0, "제1편 (대외)")
    tbl_ov.set_cell_text(1, 1, "플랫폼 총괄 비전 및 서비스 소개서")
    tbl_ov.set_cell_text(1, 2, "초고령사회 문제의식, 4대 핵심가치, 4대 생애주기 도메인 소개")
    tbl_ov.set_cell_text(2, 0, "⭐ 제2편 (실무)")
    tbl_ov.set_cell_text(2, 1, "[현장영업 B2B 실무 킷] 사업장 미팅용 패키지")
    tbl_ov.set_cell_text(2, 2, "장례식장(무상부고/키오스크 30%), 봉안당(황동명패 5:5), 로펌(정액광고), 지자체공문")
    tbl_ov.set_cell_text(3, 0, "제3편 (대외)")
    tbl_ov.set_cell_text(3, 1, "대외 투자유치(IR) 피치덱 & 사업계획서")
    tbl_ov.set_cell_text(3, 2, "TAM-SAM-SOM, BM, 단위경제학(1인 원가 340원 vs 99,000원 결제 BEP)")
    tbl_ov.set_cell_text(4, 0, "제4편 (대외)")
    tbl_ov.set_cell_text(4, 1, "전략적 파트너십 상위 제휴 및 공공 정책서")
    tbl_ov.set_cell_text(4, 2, "산업군별 협력 마스터플랜 및 중앙정부 정책 연계 과제")
    tbl_ov.set_cell_text(5, 0, "제5편 (대내)")
    tbl_ov.set_cell_text(5, 1, "신규 개발자 A-Z 기술 온보딩 설계서")
    tbl_ov.set_cell_text(5, 2, "환경셋업, 모노레포 파일 인벤토리, UI 와이어프레임, v2 디자인, DoD")
    tbl_ov.set_cell_text(6, 0, "제6편 (대내)")
    tbl_ov.set_cell_text(6, 1, "백엔드/데이터 아키텍처 & API 명세서")
    tbl_ov.set_cell_text(6, 2, "Prisma schema 실측 모델, RESTful 라우팅표 15종, JWT/만14세 보안")
    tbl_ov.set_cell_text(7, 0, "제7편 (대내)")
    tbl_ov.set_cell_text(7, 1, "런칭 전 4대 핵심 리스크 레지스터")
    tbl_ov.set_cell_text(7, 2, "00-14 안건 전수(위치정보 GPS 트랙 B, 변호사법 정액제, Render US 서울 이전)")
    tbl_ov.set_cell_text(8, 0, "제8편 (대내)")
    tbl_ov.set_cell_text(8, 1, "서비스 운영 거버넌스 & 런칭 마일스톤")
    tbl_ov.set_cell_text(8, 2, "D-90 마일스톤 체크리스트, 전사 조직별 RACI 책임 매트릭스")

    # 제2편 상세 수록 강조
    hwpx_doc.add_heading("⭐ 제2편. [현장영업 B2B 실무 킷] 사업장 미팅용 즉시제안 패키지 (신설)", level=1)
    hwpx_doc.add_paragraph("제4장. [장례식장 현장 미팅 킷] 무상 모바일 부고 & 키오스크 연동 제안서 (원페이저 브로슈어, 로비 DID 연동 사양, 건당 30,000원 정산표, 표준 MOU 초안)")
    hwpx_doc.add_paragraph("제5장. [추모공원/봉안당 현장 미팅 킷] 황동 QR 스마트 명패 도입 제안서 (봉안당 브리핑 시트, 1:1 실측 도면, 순익 50:50 배분 계약서, 기일 알림 연계)")
    hwpx_doc.add_paragraph("제6장. [로펌/공증인 현장 미팅 킷] 리걸테크 파트너십 제안서 (유언공증 전산화, 변호사법 제34조 컴플라이언스 소견서, 월 30만 원 정액 디렉토리 계약서)")
    hwpx_doc.add_paragraph("제7장. [지자체 복지과 현장 미팅 킷] 고독사 예방 시범사업 정책제안서 (공문 포맷 기획서, 복지사 긴급 출동 플로우, 무연고 공영장례 아카이빙 바우처)")
    hwpx_doc.add_paragraph("제8장. [유품정리 파트너 미팅 킷] 안심 상속 정리 제휴안 (단순승인 간주 방지 가이드, 파트너 등록서)")
    hwpx_doc.add_paragraph("제9장. [현장 시연용 체험 시트] 출력용 실물 샘플 킷 (모바일 부고 출력 샘플, 황동 명패 페이퍼 목업, 3분 장례의향서 체험지)")

    for d in dirs:
        hwpx_doc.save_to_path(os.path.join(d, "이어봄_마스터_문서체계_및_통합목차_설계서.hwpx"))
    print("  -> 개정 마스터 목차 HWPX 저장 완료")

    # =========================================================================
    # 3. [현장미팅용 01] 장례식장 전용 제안서 & 수익 정산표 (HWPX & HTML)
    # =========================================================================
    print("[2/6] [현장미팅용 01] 장례식장 전용 제안서 & 정산표 생성 중...")
    doc_fh = hwpx.HwpxDocument.new()
    doc_fh.add_heading("[장례식장 원장님/사무장님 브리핑 자료]", level=1)
    doc_fh.add_heading("이어봄 디지털 부고 솔루션 및 로비 키오스크 무상 구축 제안서", level=1)
    doc_fh.add_paragraph("■ 제안 대상: 장례식장 대표이사 및 총괄 사무장 | 주관: 이어봄 B2B 사업본부")
    doc_fh.add_paragraph("■ 핵심 혜택 요약: 1) 초기 도입비용 0원, 2) 조문객 만족도 향상, 3) 유족 결제액 30% 익월 정산 수익 창출")
    doc_fh.add_paragraph("--------------------------------------------------------------------------------")

    doc_fh.add_heading("1. 장례식장의 현재 고민과 이어봄의 해결 솔루션", level=2)
    tbl_fh1 = doc_fh.add_table(4, 3)
    tbl_fh1.set_cell_text(0, 0, "구분")
    tbl_fh1.set_cell_text(0, 1, "기존 방식의 문제점")
    tbl_fh1.set_cell_text(0, 2, "이어봄 도입 후 개선 효과")
    tbl_fh1.set_cell_text(1, 0, "모바일 부고")
    tbl_fh1.set_cell_text(1, 1, "저품질 웹페이지, 광고 노출, 상주 직접 제작 불편")
    tbl_fh1.set_cell_text(1, 2, "장례식장 로고 각인 고품격 부고 3분 완성 무상 공급")
    tbl_fh1.set_cell_text(2, 0, "빈소 안내")
    tbl_fh1.set_cell_text(2, 1, "종이 안내문 또는 구형 전광판으로 조문객 혼선")
    tbl_fh1.set_cell_text(2, 2, "로비 DID 키오스크와 실시간 연동되어 조문객 원스톱 길안내")
    tbl_fh1.set_cell_text(3, 0, "장례 후 관계")
    tbl_fh1.set_cell_text(3, 1, "발인과 동시에 유족과의 관계 및 접점 단절")
    tbl_fh1.set_cell_text(3, 2, "고인 디지털 추모관 자동 연계로 기일 알림 및 추가 수익 창출")

    doc_fh.add_heading("2. 장례식장 수익 정산 예시표 (월 30건 장례 기준)", level=2)
    tbl_fh2 = doc_fh.add_table(4, 4)
    tbl_fh2.set_cell_text(0, 0, "월 빈소 가동 건수")
    tbl_fh2.set_cell_text(0, 1, "추모관 전환율(예상)")
    tbl_fh2.set_cell_text(0, 2, "건당 정산 수수료")
    tbl_fh2.set_cell_text(0, 3, "장례식장 월 추가 순익")
    tbl_fh2.set_cell_text(1, 0, "월 20건 (소형)")
    tbl_fh2.set_cell_text(1, 1, "30% (6건 전환)")
    tbl_fh2.set_cell_text(1, 2, "30,000원 (결제액의 30%)")
    tbl_fh2.set_cell_text(1, 3, "월 180,000원")
    tbl_fh2.set_cell_text(2, 0, "월 50건 (중형)")
    tbl_fh2.set_cell_text(2, 1, "35% (17건 전환)")
    tbl_fh2.set_cell_text(2, 2, "30,000원 (결제액의 30%)")
    tbl_fh2.set_cell_text(2, 3, "월 510,000원")
    tbl_fh2.set_cell_text(3, 0, "월 100건 (대형 병원)")
    tbl_fh2.set_cell_text(3, 1, "40% (40건 전환)")
    tbl_fh2.set_cell_text(3, 2, "30,000원 (결제액의 30%)")
    tbl_fh2.set_cell_text(3, 3, "월 1,200,000원 (연 1,440만 원)")

    doc_fh.add_heading("3. 도입 절차 (신청 즉시 24시간 내 개통)", level=2)
    doc_fh.add_paragraph("1단계: 업무 제휴 협약 체결 (비용 0원) ➔ 2단계: 장례식장 전용 모바일 관리자 계정 발급 ➔ 3단계: 상주 상담 시 원클릭 부고장 발송 지원.")

    for d in dirs:
        doc_fh.save_to_path(os.path.join(d, "[현장미팅용]_01_장례식장_무상부고_및_키오스크연동_제안서.hwpx"))

    # =========================================================================
    # 4. [현장미팅용 02] 봉안당/추모공원 황동 QR 명패 제안서 (HWPX & HTML)
    # =========================================================================
    print("[3/6] [현장미팅용 02] 봉안당 황동 QR 스마트 명패 제안서 생성 중...")
    doc_cp = hwpx.HwpxDocument.new()
    doc_cp.add_heading("[추모공원/봉안당 대표자 브리핑 자료]", level=1)
    doc_cp.add_heading("봉안당 안치단용 '황동 스마트 QR 명패' 공동 사업 제안서", level=1)
    doc_cp.add_paragraph("■ 제안 대상: 봉안당, 수목장, 공원묘원 이사장 및 관리소장 | 주관: 이어봄 O2O 사업본부")
    doc_cp.add_paragraph("■ 핵심 가치: 안치단 분양 가치 극대화, 유족 정기 방문 유도, 명패 판매 순이익 50:50 배분")
    doc_cp.add_paragraph("--------------------------------------------------------------------------------")

    doc_cp.add_heading("1. 제품 규격 및 제작 사양", level=2)
    doc_cp.add_paragraph("• 소재: 최고급 황동(Brass) 1.5mm 특수 헤어라인 표면 가공 (변색/부식 방지 특수 코팅)")
    doc_cp.add_paragraph("• 규격: 가로 70mm × 세로 30mm (안치단 유리문 내외부 완벽 부착)")
    doc_cp.add_paragraph("• 인쇄 방식: 반영구적 레이저 정밀 각인 (고인 성함 + 생몰년월일 + 고유 QR코드)")

    doc_cp.add_heading("2. 판매 가격 및 수익 배분 구조 (순익 5:5 배분)", level=2)
    tbl_cp = doc_cp.add_table(3, 5)
    tbl_cp.set_cell_text(0, 0, "제품 모델")
    tbl_cp.set_cell_text(0, 1, "소비자 판매가")
    tbl_cp.set_cell_text(0, 2, "제작 원가")
    tbl_cp.set_cell_text(0, 3, "추모시설 수익(50%)")
    tbl_cp.set_cell_text(0, 4, "비고")
    tbl_cp.set_cell_text(1, 0, "기본형 (황동 플레이트)")
    tbl_cp.set_cell_text(1, 1, "49,000원")
    tbl_cp.set_cell_text(1, 2, "12,000원")
    tbl_cp.set_cell_text(1, 3, "건당 18,500원")
    tbl_cp.set_cell_text(1, 4, "분양 시 기본 옵션 제공 권장")
    tbl_cp.set_cell_text(2, 0, "고급형 (황동 주물 입체형)")
    tbl_cp.set_cell_text(2, 1, "99,000원")
    tbl_cp.set_cell_text(2, 2, "22,000원")
    tbl_cp.set_cell_text(2, 3, "건당 38,500원")
    tbl_cp.set_cell_text(2, 4, "프리미엄 봉안단 전용")

    doc_cp.add_heading("3. 유족 경험 및 부가 사업 연계", level=2)
    doc_cp.add_paragraph("유족이 스마트폰으로 명패의 QR을 태그하면 고인의 생전 사진과 육성이 담긴 '디지털 추모관'이 즉시 실행되며, 매년 고인의 기일마다 시설 방문 안내 및 제사상/헌화 꽃바구니 예약 주문이 자동 연동됩니다.")

    for d in dirs:
        doc_cp.save_to_path(os.path.join(d, "[현장미팅용]_02_봉안당_황동QR스마트명패_제휴제안서.hwpx"))

    # =========================================================================
    # 5. [현장미팅용 03] 로펌 리걸테크 파트너십 제안서 (HWPX & HTML)
    # =========================================================================
    print("[4/6] [현장미팅용 03] 로펌 리걸테크 제휴 제안서 생성 중...")
    doc_law = hwpx.HwpxDocument.new()
    doc_law.add_heading("[로펌 및 공증인가 법무법인 제휴 제안서]", level=1)
    doc_law.add_heading("유언공증 및 상속 분쟁 예방 리걸테크 파트너십 안내서", level=1)
    doc_law.add_paragraph("■ 제안 대상: 공증인가 법무법인 대표변호사 및 상속 전문 변호사 | 주관: 이어봄 전략기획팀")
    doc_law.add_paragraph("■ 핵심 내용: 변호사법 제34조 컴플라이언스 준수, 유언공증 서류 사전 전산화로 공증 시간 70% 단축")
    doc_law.add_paragraph("--------------------------------------------------------------------------------")

    doc_law.add_heading("1. 변호사법 제34조(유상 알선 금지) 컴플라이언스 확약", level=2)
    doc_law.add_paragraph("• 이어봄은 사건 수임에 따른 '건당 리퍼럴 수수료'를 일체 수취하지 않습니다. (형사처벌 위험 0화)")
    doc_law.add_paragraph("• 합법적인 '월정액 플랫폼 디렉토리 광고비(월 300,000원 고정)' 및 '전산 시스템 이용 계약(SaaS)'만을 체결하여 로톡 판례 기준을 완벽히 충족합니다.")

    doc_law.add_heading("2. 로펌의 업무 혁신 효과", level=2)
    doc_law.add_paragraph("• 고객이 앱에서 민법 제1065조 요건(자필, 날인, 연월일, 증인 2인 자격)을 사전 검증한 표준 전산 서류를 생성하여 로펌에 전달하므로, 변호사의 사전 검토 시간이 70% 단축됩니다.")
    doc_law.add_paragraph("• 유언공증 희망 고객이 지정 로펌의 공증실로 직접 방문 예약하도록 원스톱 캘린더를 지원합니다.")

    for d in dirs:
        doc_law.save_to_path(os.path.join(d, "[현장미팅용]_03_로펌_유언공증_리걸테크_파트너십제안서.hwpx"))

    # =========================================================================
    # 6. [현장미팅용 04] 지자체 고독사 예방 스마트 안부확인 제안서 (HWPX & HTML)
    # =========================================================================
    print("[5/6] [현장미팅용 04] 지자체 고독사 예방 정책제안서 생성 중...")
    doc_gov = hwpx.HwpxDocument.new()
    doc_gov.add_heading("[지자체 복지과 공문형 정책제안서]", level=1)
    doc_gov.add_heading("1인 가구 고독사 예방을 위한 '스마트 안부확인 및 공영장례 아카이빙' 사업 제안", level=1)
    doc_gov.add_paragraph("■ 수신: 시·군·구 복지정책과장 및 노인복지팀장 | 발신: (주)이어봄 공공정책사업팀")
    doc_gov.add_paragraph("■ 관련 근거: 고독사 예방 및 관리에 관한 법률 제10조(고독사 예방 및 관리 시책 수립)")
    doc_gov.add_paragraph("--------------------------------------------------------------------------------")

    doc_gov.add_heading("1. 사업 개요 및 추진 배경", level=2)
    doc_gov.add_paragraph("관내 1인 가구 및 독거 어르신의 급증으로 복지 인력의 가정 방문 한계 도달. 스마트폰 앱 활동(걸음 수, 로그인, 알림톡 확인)을 비침해적으로 감지하여 위기 징후를 조기에 발견하고 긴급 대응 체계를 구축하고자 함.")

    doc_gov.add_heading("2. 서비스 운영 프로세스", level=2)
    doc_gov.add_paragraph("1단계: 어르신 미접속 3일 초과 감지 ➔ 2단계: 1차 가족/지정 대리인 자동 알림톡 발송 ➔ 3단계: 미확인 시 관할 행정복지센터 담당 복지사에게 이상 징후 자동 통보 및 긴급 가정방문 연계.")

    doc_gov.add_heading("3. 무연고 사망자 공영장례 디지털 추모관 지원", level=2)
    doc_gov.add_paragraph("지자체가 주관하는 무연고 사망자의 공영장례 사진과 추모의 글을 영구 보존하는 공공 디지털 추모관을 무상 구축하여 공공 복지의 품격을 제고함.")

    for d in dirs:
        doc_gov.save_to_path(os.path.join(d, "[현장미팅용]_04_지자체_고독사예방_스마트안부확인_정책제안서.hwpx"))

    # =========================================================================
    # 7. 현장 시연용 통합 HTML 브로슈어 생성 (인쇄/태블릿 시연 최적화)
    # =========================================================================
    print("[6/6] 현장 미팅 및 시연용 통합 HTML 브로슈어 빌드 중...")
    html_field_kit = """<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>[현장 미팅 킷] 이어봄 B2B 사업장 브리핑 패키지</title>
<style>
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
  @import url('https://fonts.googleapis.com/css2?family=Nanum+Myeongjo:wght@700&display=swap');

  :root {
    --primary: #1e293b;
    --accent: #4a6b53;
    --accent-light: #e8f0ec;
    --gold: #b45309;
    --bg: #f8fafc;
    --border: #cbd5e1;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Pretendard', sans-serif; background: var(--bg); color: #0f172a; line-height: 1.6; }
  .sheet { max-width: 900px; margin: 30px auto; background: #fff; padding: 60px; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid var(--border); page-break-after: always; }
  .tag { display: inline-block; padding: 4px 12px; background: var(--accent-light); color: var(--accent); font-weight: 700; border-radius: 20px; font-size: 13px; margin-bottom: 12px; }
  h1 { font-size: 24px; color: var(--primary); margin-bottom: 8px; font-weight: 800; }
  .subtitle { font-size: 15px; color: #64748b; margin-bottom: 24px; }
  h2 { font-size: 18px; color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 6px; margin: 28px 0 14px 0; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px; }
  th, td { padding: 10px 12px; border: 1px solid var(--border); text-align: left; }
  th { background: #f1f5f9; color: var(--primary); font-weight: 700; }
  .callout { background: #f8fafc; border-left: 4px solid var(--accent); padding: 14px 18px; border-radius: 4px; margin: 16px 0; font-size: 14px; }
  .brass-mockup { border: 2px solid #b45309; background: #fef3c7; border-radius: 6px; padding: 16px; text-align: center; margin: 20px 0; font-family: 'Nanum Myeongjo', serif; }
</style>
</head>
<body>

<!-- 시트 1: 장례식장 -->
<div class="sheet">
  <div class="tag">장례식장 원장님/사무장님 브리핑 자료</div>
  <h1>장례식장 전용 모바일 부고 & 키오스크 무상 구축 제안서</h1>
  <div class="subtitle">초기 도입비용 0원 | 조문객 만족도 제고 | 유족 결제액 30% 익월 정산</div>
  
  <h2>1. 기존 방식 대비 개선 효과</h2>
  <table>
    <thead><tr><th>구분</th><th>기존 종이/웹 부고</th><th>이어봄 솔루션</th></tr></thead>
    <tbody>
      <tr><td><strong>모바일 부고</strong></td><td>저품질 페이지, 광고 난립, 상주 직접 작성</td><td>장례식장 로고 각인 3분 완성 고품격 부고 무상 공급</td></tr>
      <tr><td><strong>빈소 안내</strong></td><td>구형 전광판으로 조문객 혼선</td><td>로비 DID 키오스크 연동으로 실시간 길안내</td></tr>
      <tr><td><strong>수익 모델</strong></td><td>장례 종료 후 유족과의 관계 단절</td><td>디지털 추모관 자동 연계로 <strong>결제액 30%(30,000원) 정산</strong></td></tr>
    </tbody>
  </table>

  <h2>2. 장례식장 월 수익 정산 예시표</h2>
  <table>
    <thead><tr><th>월 빈소 가동 건수</th><th>추모관 전환율(예상)</th><th>건당 정산액</th><th>장례식장 월 추가 순익</th></tr></thead>
    <tbody>
      <tr><td>월 20건 (소형)</td><td>30% (6건 전환)</td><td>30,000원</td><td><strong>월 180,000원</strong></td></tr>
      <tr><td>월 50건 (중형)</td><td>35% (17건 전환)</td><td>30,000원</td><td><strong>월 510,000원</strong></td></tr>
      <tr><td>월 100건 (대형 병원)</td><td>40% (40건 전환)</td><td>30,000원</td><td><strong>월 1,200,000원 (연 1,440만 원)</strong></td></tr>
    </tbody>
  </table>
  <div class="callout">💡 <em>"협약 체결 즉시 전용 관리자 계정이 발급되며, 복잡한 기기 교체 없이 24시간 내 운영 가능합니다."</em></div>
</div>

<!-- 시트 2: 봉안당 황동 명패 -->
<div class="sheet">
  <div class="tag">추모공원/봉안당 대표자 브리핑 자료</div>
  <h1>봉안당 안치단용 '황동 스마트 QR 명패' 공동 사업 제안서</h1>
  <div class="subtitle">안치단 분양 가치 극대화 | 명패 판매 순이익 50:50 배분 | 기일 알림 연계</div>

  <h2>1. 황동 스마트 명패 1:1 실측 도면 및 사양</h2>
  <div class="brass-mockup">
    <div style="font-size: 13px; color: #78350f; margin-bottom: 6px;">[가로 70mm × 세로 30mm 황동 헤어라인 플레이트]</div>
    <div style="font-size: 18px; font-weight: 700; color: #451a03;">故 洪 吉 東 님 (1944 ~ 2026)</div>
    <div style="font-size: 12px; color: #78350f; margin-top: 4px;">[ QR코드 스캔 시 생전 육성 및 사진 추모관 실행 ]</div>
  </div>

  <h2>2. 판매 가격 및 수익 배분표 (순익 5:5 배분)</h2>
  <table>
    <thead><tr><th>제품 모델</th><th>소비자 판매가</th><th>제작 원가</th><th>추모시설 수익(50%)</th><th>비고</th></tr></thead>
    <tbody>
      <tr><td><strong>기본형 (황동 플레이트)</strong></td><td>49,000원</td><td>12,000원</td><td><strong>건당 18,500원</strong></td><td>분양 시 기본 옵션 제공 권장</td></tr>
      <tr><td><strong>고급형 (황동 주물 입체형)</strong></td><td>99,000원</td><td>22,000원</td><td><strong>건당 38,500원</strong></td><td>프리미엄 안치단 전용 옵션</td></tr>
    </tbody>
  </table>
</div>

<!-- 시트 3: 로펌 리걸테크 -->
<div class="sheet">
  <div class="tag">로펌 및 공증인가 법무법인 브리핑 자료</div>
  <h1>유언공증 연계 리걸테크 파트너십 안내서</h1>
  <div class="subtitle">변호사법 제34조 컴플라이언스 준수 | 유언공증 사전 전산화로 업무 70% 단축</div>

  <h2>1. 변호사법 제34조(유상 알선 금지) 컴플라이언스 확약</h2>
  <div class="callout" style="border-left-color: #b45309; background: #fef3c7;">
    <strong>⚠️ 형사처벌 위험 원천 차단</strong><br>
    이어봄은 사건 수임에 따른 '건당 리퍼럴 수수료'를 일체 수취하지 않습니다. 로톡 판례 기준을 완벽히 충족하는 <strong>'월정액 플랫폼 디렉토리 광고비(월 30만 원 고정)'</strong> 및 <strong>'전산 SaaS 이용 계약'</strong>만을 체결합니다.
  </div>

  <h2>2. 로펌의 업무 혁신 효과</h2>
  <p>고객이 모바일에서 민법 제1065조 요건(자필, 날인, 연월일, 증인 2인 자격)을 사전 검증한 표준 전산 서류를 생성하여 로펌에 전달하므로, 사전 서류 검토 시간이 70% 단축됩니다.</p>
</div>

<!-- 시트 4: 지자체 고독사 예방 -->
<div class="sheet">
  <div class="tag">지자체 복지과 공문형 정책제안서</div>
  <h1>1인 가구 고독사 예방을 위한 '스마트 안부확인' 사업 제안</h1>
  <div class="subtitle">비침해적 스마트 감지 | 이상 징후 시 복지사 자동 출동 연계 | 무연고 공영장례 아카이빙</div>

  <h2>1. 스마트 안부확인 운영 프로세스</h2>
  <table>
    <thead><tr><th>단계</th><th>운영 내용</th><th>주체</th></tr></thead>
    <tbody>
      <tr><td><strong>1단계: 감지</strong></td><td>어르신 스마트폰 활동(걸음 수, 로그인, 알림톡) 3일 미발생 감지</td><td>이어봄 시스템</td></tr>
      <tr><td><strong>2단계: 1차 확인</strong></td><td>사전 등록된 가족/이웃 대리인에게 안부 확인 알림톡 자동 발송</td><td>가족 대리인</td></tr>
      <tr><td><strong>3단계: 긴급 출동</strong></td><td>대리인 미확인 시 관할 행정복지센터 전담 복지사에게 자동 통보 및 가정방문</td><td>주민센터 복지사</td></tr>
    </tbody>
  </table>
  <h2>2. 무연고 사망자 공영장례 디지털 아카이빙</h2>
  <p>지자체 주관 공영장례 사진과 기록을 영구 보존하는 공공 추모관을 무상 구축하여 공공 복지의 품격을 제고합니다.</p>
</div>

</body>
</html>
"""

    for d in dirs:
        with open(os.path.join(d, "이어봄_현장영업_B2B_실무제안서_브로슈어.html"), "w", encoding="utf-8") as f:
            f.write(html_field_kit)
    print("  -> 현장 시연용 통합 HTML 브로슈어 저장 완료")

    print("\n[완료] 현장 영업 실무 킷이 편입된 개정 문서 체계 및 현장 미팅용 즉시 제안서 생성이 완료되었습니다!")

if __name__ == "__main__":
    build_field_kit_and_revised_architecture()
