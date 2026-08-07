# 🧠 .harness — 이어봄 에이전트 하네스

> **1인 + 2에이전트(Gemini 기획 / Claude 구현)** 협업을 위한 경량 하네스.
> 사람이 Antigravity IDE와 Claude CLI를 직접 전환하며 쓴다. 에이전트가 다른 에이전트를 자동 호출하지 않는다.

---

## 설계 원칙

1. **부팅은 가볍게, 나머지는 조건부로** — 매 세션 읽는 건 2개(≤11KB)뿐. 나머지는 해당 작업일 때만 읽는다.
2. **한 영역은 한 에이전트만 쓴다** — 소유권을 나눠 중복 검증을 없앤다. 검증 게이트는 `walkthrough.md` 단 한 곳.
3. **규칙은 글이 아니라 장치로 강제한다** — 사람이 기억해서 지키는 규칙은 지켜지지 않는다. `tools/harness-doctor.sh`가 검사한다.
4. **조용한 통과는 실패로 취급한다** — 검사 대상이 0건이면 성공이 아니라 설정 오류다.
5. **In-Repo 구조** — 코드·기획·하네스가 한 저장소에 공존한다. "코드는 딴 데 있다"는 외장 두뇌 전제는 2026-08-07 폐기됨.

---

## 📁 구조

```text
<저장소 루트>/
├── .harness/                 # 🤖 에이전트 계층 (Claude 소유)
│   │
│   │  ── 부팅 필수 (매 세션, 합계 ≤11KB) ──
│   ├── AGENTS.md             # 🌟 행동 규칙 SSOT + 조건부 로드 표
│   ├── memory/context.md     # 지금 상태 + "다음 할 일" 한 줄
│   │
│   │  ── 조건부 로드 (각 ≤6KB) ──
│   ├── roles.md              # 소유권 표 + 검증 게이트 + 에스컬레이션
│   ├── security.md           # 개인정보·시크릿·발행 게이트
│   ├── done.md               # "완료"의 정의 (유일 정본)
│   ├── systems.md            # 외부 연동 명부 (OAuth·지도·DB·배포)
│   │
│   ├── CLAUDE.md / GEMINI.md # 에이전트별 역할 (얇게 유지)
│   ├── memory/               # 구조화 메모리 (MEMORY.md + 타입별 노트)
│   ├── skills/               # 재사용 절차 (2회차부터 기록)
│   ├── tools/                # harness-doctor.sh, gbrain-doctor.sh 등
│   └── _meta/                # 하네스 자체 설계 이력
│
├── docs/                     # 📄 기획 SSOT (Gemini 소유) + 작업일지_및_기록/
├── reports/                  # 📊 사람 열람용 HTML·PDF (Gemini 소유)
├── assets/                   # 📁 원천 CSV·로고 (사람 소유)
└── eobom/                    # 💻 소스코드 frontend/·backend/ (Claude 소유)
```

---

## ⚙️ 워크플로우

```
[Gemini] docs/ 기획 확정
   ↓  (Claude는 재검토하지 않고 그대로 신뢰하고 구현)
[Claude] eobom/ 구현 + walkthrough.md 요약
   ↓
★ [Gemini] walkthrough.md만 읽고 통과/반려 — 통과하면 재확인 없이 종료
```

자세한 소유권·게이트·에스컬레이션 규칙은 [`roles.md`](./roles.md).

---

## 🩺 점검

```bash
bash .harness/tools/harness-doctor.sh
```

부팅 용량 예산, 조건부 파일 존재, 소유권 디렉토리, 유령 경로, 인덱스 링크,
`context.md` 신선도, `[[위키링크]]` 무결성을 한 번에 검사한다.
세션을 끝낼 때 실행한다(→ [`done.md`](./done.md) §3).
