# 🎓 학술 논문 & 연구 보고서 서식 및 LaTeX 규격 가이드

> **적용 대상:** 기술 논문, R&D 기획 연구 보고서, 알고리즘 명세서, 분석 보고서

---

## 1. 표준 학술 논문 목차 체계

```text
Abstract (초록)
  - 연구 배경, 목적, 제안 방법론 및 핵심 결론을 200~300자 내로 요약
1. Introduction (서론)
  - 연구 필요성, 기존 연구의 한계점, 연구 질문(Research Question) 정의
2. Related Work (관련 연구)
  - 기존 벤치마크 및 관련 문헌 비교 분석 (동향 정리)
3. Proposed Methodology (제안 방법론 및 알고리즘)
  - 시스템 아키텍처, 수학적 수식 모델링, 알고리즘 플로우
4. Experiments & Evaluation (실험 및 결과 평가)
  - 평가 지표(Metrics), 정량적/정성적 결과 비교 표 및 그래프
5. Conclusion & Future Work (결론 및 향후 과제)
  - 연구의 학술적/실무적 기여도(Contribution) 정리
References (참고문헌)
  - IEEE / APA / KCI 표준 인용 형식
```

---

## 2. LaTeX 수식 작성 표기 규칙

모든 수학적 알고리즘 및 추천 공식은 마크다운 LaTeX 표준에 맞춰 표기한다:

### 인라인 수식 (Inline Math)
* `\(...\)` 또는 `$...$` 사용
* 예시: 추천 스코어 $S_i$는 거리 점수 \(D_i\)와 예산 적합도 \(B_i\)의 선형 결합으로 정의된다.

### 블록/디스플레이 수식 (Display Math)
* `\[...\]` 또는 `$$...$$` 사용
* 예시:
  $$ \text{Recommendation Score} = w_1 \cdot D_{\text{distance}} + w_2 \cdot B_{\text{budget}} + w_3 \cdot R_{\text{religion}} + w_4 \cdot U_{\text{rating}} $$
  단, 가중치 조건은 $\sum_{k=1}^{4} w_k = 1.0$ ($w_1=0.35, w_2=0.30, w_3=0.20, w_4=0.15$)을 만족해야 함.

---

## 3. 참고문헌 (References) 인용 스타일

* **IEEE 스타일 (공학/IT)**:
  `[1] H. Kim et al., "K-Ending: A Comprehensive Digital Estate and Well-Dying Information Platform," IEEE Access, vol. 12, pp. 1200-1212, 2026.`
* **APA 스타일 (인문/사회/경영)**:
  `Kim, H. (2026). Digital Estate Management and Senior Well-Dying Service Design. Journal of Senior Care and Technology, 8(2), 45-60.`
