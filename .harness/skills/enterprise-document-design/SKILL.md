---
name: enterprise-document-design
description: 공공기관 및 대기업 표준 보고서, HTML 대시보드, 학술 논문 등의 문서 시각화, 타이포그래피, 여백, 레이아웃 규격을 정의하는 엔터프라이즈 시각화 스킬
---

# 🏢 엔터프라이즈 문서 시각화 및 스타일링 표준 (SKILL.md)

> **언제 이 스킬을 쓰나:**
> - 공공기관, 대기업 보고서, 기획서, HTML 대시보드, 학술 논문 등 고품질 문서 작성이 필요할 때
> - 문서의 visual 완성도, 타이포그래피, 여백(whitespace), 레이아웃, 컬러 파렛트를 정교하게 제어할 때
> - 로컬 내 다른 AI 작업자(Claude, Gemini 등)에게 최고 품질의 문서 작성 하달 프롬프트를 생성할 때

---

## 1. 십대 시각화 계율 (Core Rules)

1. **격식과 전문성(Professional Tone)**: 모든 문서는 공공기관 및 대기업 임직원 보고용 수준의 격식과 가독성을 갖춘다.
2. **명확한 정보 위계(Visual Hierarchy)**: 제목, 부제목, 본문, 각주 간의 폰트 크기 및 두께 차이를 명확히 하여 한눈에 핵심이 들어오게 한다.
3. **규격화된 컬러 파렛트**: 무분별한 색상 사용을 금지하며, 주색(Primary 60%), 보조색(Secondary 30%), 강조색(Point 10%) 비율을 엄수한다.
4. **여백의 미(Whitespace)**: 답답하지 않은 줄간격(160% 이상)과 충분한 요소 간 마진(Margin)을 확보한다.
5. **시니어 & 저시력자 접근성**: 본문 서체 최소 18px/12pt 이상, 오치수 방지 터치 타깃 56px 이상, 고대비 모드를 보장한다.
6. **표준 인포그래픽**: 텍스트 배열 대신 Mermaid.js, SVG, 카드 그리드를 사용해 프로세스와 데이터 흐름을 시각화한다.
7. **논리적 구조화**: 【개요】 $\rightarrow$ 【현황 및 문제점】 $\rightarrow$ 【추진 방안】 $\rightarrow$ 【기대 효과】 4단 구조를 표준화한다.
8. **인용 및 데이터 출처**: 논문 및 보고서 작성 시 출처(IEEE/APA/KCI 스타일)와 LaTeX 수식을 엄격히 적용한다.
9. **외장 두뇌 연동**: 문서 시각화 스펙은 `.harness` 지식 저장소에 등록하여 세션이 바뀌어도 지속 유지한다.
10. **감독관 책임제**: 실제 구현 AI에게 하달하기 전, 모든 레이아웃과 서식 가이드를 프롬프트로 완전 검증한다.

---

## 2. 하위 세부 가이드 문서 인덱스

* 📄 [01_public_enterprise_report.md](./01_public_enterprise_report.md) — 공공기관/대기업 서면 보고서 서식
* 🌐 [02_web_html_visualization.md](./02_web_html_visualization.md) — HTML 웹페이지 & 대시보드 디자인 시스템
* 🎓 [03_academic_paper_style.md](./03_academic_paper_style.md) — 학술 논문 & 연구 보고서 서식 및 LaTeX 수식
* 📊 [04_infographic_diagram_specs.md](./04_infographic_diagram_specs.md) — 다이어그램 및 시각 요소 스펙
* 🤖 [05_ai_worker_prompt_template.md](./05_ai_worker_prompt_template.md) — 실무 AI 작업 하달용 프롬프트 메타 템플릿
