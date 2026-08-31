# 🧠 .harness — 이어봄 에이전트 하네스

> **1인 + 3주체** 협업을 위한 경량 하네스 — `[Claude:Opus]` 기획 / `[Claude:Sonnet]` 구현 / `[Gemini]` Flash 문서화·교차검증.
> 사람이 `/model`(Opus↔Sonnet)과 창(Antigravity↔Claude CLI)을 직접 전환하며 쓴다. 에이전트가 다른 에이전트를 자동 호출하지 않는다.

---

## 설계 원칙

1. **부팅은 가볍게, 나머지는 조건부로** — 매 세션 읽는 건 3개(합계 ≤11KB)뿐. 나머지는 해당 작업일 때만 읽는다.
2. **한 영역은 한 에이전트만 쓴다** — 소유권을 나눠 중복 검증을 없앤다. 검증 게이트는 `walkthrough.md` 단 한 곳.
   Opus/Sonnet은 같은 CLI라 권한으로 못 나누므로, 이 둘만은 태그(`roles.md` §0)로 구분한다.
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
│   ├── memory/pending-approvals.md  # 사람 승인 대기 (여기 있는 건 착수 금지)
│   │
│   │  ── 조건부 로드 (각 ≤6KB) ──
│   ├── roles.md              # 소유권 표 + 검증 게이트 + 에스컬레이션
│   ├── security.md           # 개인정보·시크릿·발행 게이트
│   ├── done.md               # "완료"의 정의 (유일 정본)
│   ├── record.md             # 기록 형식 (walkthrough 5필드·일지 태그)
│   ├── systems.md            # 외부 연동 명부 (OAuth·지도·DB·배포)
│   │
│   ├── CLAUDE.md / GEMINI.md # 에이전트별 역할 (얇게 유지)
│   ├── memory/               # 구조화 메모리 (MEMORY.md + 타입별 노트)
│   ├── skills/               # 재사용 절차 (2회차부터 기록)
│   ├── tools/                # harness-doctor.sh, gbrain-doctor.sh 등
│   └── _meta/                # 하네스 자체 설계 이력
│
├── docs/                     # 📄 기획 SSOT (Claude:Opus 소유) + 작업일지_및_기록/
├── reports/                  # 📊 사람 열람용 HTML·PDF (Gemini 소유) — 🔴 git 커밋 제외·로컬 전용
├── assets/                   # 📁 원천 CSV·로고 (사람 소유)
└── eobom/                    # 💻 소스코드 frontend/·backend/ (Claude 소유)
```

---

## ⚙️ 워크플로우

```
[Claude:Opus]   docs/ 기획 확정
   ↓  (Sonnet은 재검토하지 않고 그대로 신뢰하고 구현)
[Claude:Sonnet] eobom/ 구현 + walkthrough.md 요약
   ↓
★ [Gemini] walkthrough.md만 읽고 통과/반려 — 통과하면 재확인 없이 종료
   (스펙갱신 판정이면 docs/ 수정은 Opus가. Gemini는 docs/ 쓰기 권한 없음)
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

**예산은 85%에서 🟡가 켜진다**(100%를 기다리지 않는다 — 급할 때 내리는 결정이 상한을 올린다).
조건부 파일이 **서로 다른 날 두 번** 85%를 넘기면 doctor가 상한을 **파일당 한 번** 자동
재설정한다(실측이 70%가 되는 크기). 결과는 `tools/budgets.tsv`, 경위는
[`_meta/예산_이력.md`](./_meta/예산_이력.md). 되돌리려면 `budgets.tsv`의 해당 줄을 지운다.
🔴 **두 번째는 상향이 아니라 분리다** — 재설정을 받고 또 넘기면 빨간불이 뜬다.
부팅 예산과 `context.md`는 **자동 대상이 아니다**(매 세션 비용이라 사람이 정한다).
설계 근거 → [`_meta/예산_재발방지_260831.md`](./_meta/예산_재발방지_260831.md)
