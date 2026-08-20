# 🌿 이어봄 (Eobom)

> 디지털 엔딩 & 웰다잉 토탈 케어 플랫폼 — **생전 준비부터 임종·사후 정리까지**
> 이 저장소는 **소스코드 · 기획 SSOT · 에이전트 하네스**가 한곳에 있습니다.

---

## 🧭 어디부터 보나

| 목적 | 여기로 |
| :--- | :--- |
| **지금 뭘 해야 하나** | [`.harness/memory/context.md`](.harness/memory/context.md) |
| **코드를 돌려보고 싶다** | [`eobom/README.md`](eobom/README.md) — ⚠️ **`https://` 필수 · DB 포트 5433** |
| **기획을 읽고 싶다** | [`docs/00_DOCS_INDEX.md`](docs/00_DOCS_INDEX.md) |
| **외부 연동이 왜 안 되나** | [`.harness/systems.md`](.harness/systems.md) |
| **AI 에이전트로 작업한다** | [`.harness/AGENTS.md`](.harness/AGENTS.md) ← **행동 규칙 정본** |

---

## 📁 저장소 구조

```text
Eobom/
├── eobom/          💻 소스코드 — frontend/(React18+Vite5+TS) · backend/(Express+Prisma+JWT)
├── docs/           📄 기획 SSOT (Markdown) + 작업일지_및_기록/
├── .harness/       🤖 에이전트 규칙·메모리·툴
├── assets/         📁 원천 데이터 (복지부 CSV, 로고)
├── reports/        📊 사람 열람용 HTML — 🔴 git 커밋 제외(로컬 전용)
└── render.yaml     백엔드 배포 Blueprint
```

> ⚠️ **Prisma 스키마·마이그레이션은 `eobom/backend/prisma/`에만 있습니다.** 저장소 루트에서
> `prisma` 명령을 실행하지 마십시오 — 2026-08-20까지 루트에 빈 `prisma/` 잔여물이 있어
> 헷갈릴 소지가 있었고, 제거했습니다.

---

## 🏗️ 도메인

번호 = **사용자 여정 순서**입니다(메뉴 순서와 1:1 대응하지 않습니다).

| # | 도메인 | 화면 |
| :---: | :--- | :--- |
| 01 | 장사시설 매칭 | `facility` |
| 02 | 전문가 매칭 (상속·법률) | `counseling` |
| 03 | 현물 유품 수거 | `pickup` |
| 04 | 디지털 자산 · 계정 정산 | `digital-estate` |
| 05 | 디지털 추모관 | `memorial` |
| 06 | 디지털 엔딩노트 · 유언 | `ending-note` |
| 07 | 상중 · 행정 케어 | `care-guide` · `obituary` |

방문자는 **WellDying(생전 준비)** 과 **유가족(사후)** 두 방향으로 갈립니다. 자세한 정의는 `docs/00_DOCS_INDEX.md`.

---

## 🤝 작업 방식 — 3주체 분업

혼자 개발하되, 역할을 나눠 씁니다. 소유권을 지키지 않으면 문서와 코드가 어긋납니다.

| 주체 | 쓰는 곳 | 하는 일 |
| :--- | :--- | :--- |
| **Claude:Opus** | `docs/` · `.harness/` | 기획·설계·스펙 확정 |
| **Claude:Sonnet** | `eobom/` | 확정 스펙대로 구현 |
| **Gemini** | `reports/` | 시각화 + 교차검증 |

- 검증 게이트는 **`docs/작업일지_및_기록/에이전트_기록/walkthrough.md` 한 곳**입니다.
- 상세 규칙은 [`.harness/roles.md`](.harness/roles.md).

---

## 🔴 커밋 기준

**"혼자냐 팀이냐"가 아니라 "재생성 가능한가"로 정합니다.**

| | |
| :--- | :--- |
| ✅ 커밋 | 소스 · **`prisma/migrations/`** · `docs/` 결정 기록 · `.harness/` |
| ❌ 제외 | `.env` · 빌드 산출물 · `reports/`(→ `docs/`에서 재생성) · 일회성 스크린샷 |

⚠️ **`reports/`에만 있고 `docs/` 정본이 없는 문서를 만들지 마십시오** — 커밋에서 빠져 소실됩니다
(→ `.harness/roles.md` §1-1).

---

## 🔒 보안

- 저장소는 **private**입니다. `.env`·인증서·DB 백업은 `.gitignore`로 막혀 있습니다.
- **실제 개인정보를 저장소에 커밋하지 않습니다** — 유족·고인·상담 신청자의 이름·연락처·주소·가족관계.
- 🔴 **public 전환·협업자 추가·외주 투입 전에는 히스토리 전체를 재검토해야 합니다.** git 히스토리는
  파일을 지워도 과거 커밋에 남습니다 → [`.harness/security.md`](.harness/security.md).
