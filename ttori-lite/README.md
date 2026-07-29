# 🧠 ttori-lite

> **1인 개발자 + 단일 AI 에이전트 + 옵시디언(Obsidian)** 환경을 위한 초경량 지식 관리 & 가동 하네스 (Lightweight AI Agent Harness)

`ttori-lite`는 멀티에이전트 오케스트레이션 시스템(`biz-ttori`)의 과도한 복잡성을 덜어내고, **단일 AI 에이전트(Claude Code / Gemini CLI / Codex CLI)**와 사용자가 가장 효율적으로 협업하고 지식을 세션 간에 지속성(Persistence) 있게 보존하도록 설계된 경량 하네스입니다.

---

## ✨ 핵심 특징 (Key Features)

* **벤더 중립적 SSOT 구조**: `AGENTS.md` 단 하나를 행동 규칙 본문(SSOT)으로 사용하며, `CLAUDE.md`, `GEMINI.md` 등은 1줄 포인터 파일로 연결하여 어떤 AI 도구에서도 동일한 퍼소나와 가이드라인을 로드합니다.
* **외장 두뇌 (External Brain) 모델**: 소스 코드는 실제 개발 워크스페이스에 그대로 두고, 본 저장소는 오직 기획, 컨텍스트(`context.md`), 의사결정 계약만 보관하여 옵시디언 볼트를 쾌적하게 유지합니다.
* **G-Brain 지식 그래프 (경량판)**: 옵시디언의 `[[위키링크]]` 기반 연결을 활용하여 문서와 프로젝트 간의 관계를 시각화하고 환각 방지를 위한 안정적 앵커 규칙을 제공합니다.
* **타입별 구조화 메모리 (`memory/`)**: 단순 메모리가 아닌 `user`, `feedback`, `project`, `reference` 4가지 규격화된 메모리 시스템으로 세션이 끊겨도 1분 안에 현재 상태를 완벽 복원합니다.
* **스킬 시스템 (`skills/`)**: 두 번 이상 반복되는 유용한 워크플로우나 남의 좋은 노하우를 자산화하여 에이전트의 역량을 지속적으로 스펙업합니다.
* **Digital Garden / Quartz 4 호환**: 옵시디언 노트를 기반으로 한 개인 블로그 및 디지털 가든 배포 도구(Quartz 4)와 직관적으로 연동됩니다.

---

## 📁 디렉토리 구조 (Directory Structure)

```text
ttori-lite/
├── AGENTS.md               # 🌟 행동 규칙 SSOT 본문
├── CLAUDE.md               # Claude Code 포인터 파일
├── GEMINI.md               # Gemini CLI / Antigravity 포인터 파일
├── memory/                 # 🧠 구조화 메모리 (MEMORY.md + 타입별 노트)
│   ├── MEMORY.md           # 메모리 한 줄 인덱스
│   ├── context.md          # 1화면 이내의 실시간 세션 상태 스냅샷
│   └── g-brain-map.md      # 프로젝트 지식 그래프 매핑
├── daily/                  # 📝 일별 실제 실무 작업일지 (YYMMDD.md)
├── projects/               # 📁 프로젝트별 컨텍스트 및 외장 코드 포인터
│   └── _meta/              # 하네스 자체 설계 스펙 문서
├── skills/                 # 🛠️ 재사용 가능한 에이전트 스킬 템플릿
└── tools/                  # 🔧 지식 정합성 점검 및 위키링크 닥터 스크립트
```

---

## 🚀 시작하기 (Quick Start)

### 사전 설치 목록
* 1. 옵시디언(obsidian) https://obsidian.md/download
  2. 오르카 IDE(Orca) https://www.onorca.dev/

### 1. 저장소 클론 및 이동
```bash
git clone https://github.com/HyaC1107/ttori-lite.git my-brain
cd my-brain
```

### 2. 옵시디언(Obsidian) 볼트 연결
* 옵시디언 앱 실행 $\rightarrow$ **[Open folder as vault]** 클릭 $\rightarrow$ 클론한 `my-brain` 폴더 선택

### 3. AI 에이전트 CLI 실행
원하시는 AI CLI 툴을 저장소 루트에서 띄우면 자동으로 `AGENTS.md` 규칙이 적용됩니다.

```bash
# Gemini CLI / Antigravity 사용 시
agy

# Claude Code 사용 시
claude
```

---

## ⚙️ 작업 워크플로우 (Workflow)

에이전트는 모든 작업 수행 시 아래 표준 수순을 따릅니다:

$$ \text{PLAN} \longrightarrow \text{CONFIRM} \longrightarrow \text{CODE/WRITE} \longrightarrow \text{SELF-REVIEW} \longrightarrow \text{UPDATE} $$

1. **세션 시작**: `memory/context.md`를 열어 "지금 상태"를 1분 이내에 파악
2. **작업 수행**: 계획 및 확인을 거쳐 프로젝트/메모리 수정
3. **세션 종료/갱신**: `memory/context.md` 갱신 및 반복된 노하우는 `skills/`에 아카이빙

---

## 📄 라이선스 (License)

MIT License ⓒ [HyaC1107](https://github.com/HyaC1107)
