#!/usr/bin/env bash
# session-boot.sh — SessionStart 훅. 부팅 3개(AGENTS.md §0)를 세션 컨텍스트에 자동 주입한다.
#
# 왜 있나: 부팅 파일은 CLI가 밀어 넣지 않아 사람이 "세션 불러오기"라고 말해야만 읽혔다.
#          말하지 않으면 규칙이 세션에 도달한 적이 없다(2026-08-25 소유권 사고와 같은 원인).
# 무엇을 하나: stdout에 찍는 내용이 그대로 모델 컨텍스트에 들어간다. JSON 불필요.
# 실패해도 세션을 막지 않는다 — 파일이 없으면 그 줄만 경고로 남기고 계속한다.

set -u

ROOT="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"

emit() {  # emit <표시이름> <경로>
  local label="$1" path="$2"
  printf '\n===== %s =====\n' "$label"
  if [ -f "$path" ]; then
    cat "$path"
  else
    printf '🔴 파일 없음: %s — 사람에게 알릴 것\n' "$path"
  fi
}

# emit_head_section — 파일 전문이 아니라 **첫 번째 `## ` 섹션만** 싣는다(2026-08-28 신설).
# 왜: pending-approvals.md의 "해제됨" 이력과 머리말은 착수 판단에 안 쓰이는데 매 세션 1,265B를
#     먹었다. 파일에서 지우는 게 아니라 **싣지 않을 뿐**이라 "이력 삭제하지 않음" 규칙은 그대로다.
#     사람이나 서브에이전트가 파일을 열면 전부 보인다.
# 🔴 헤딩 구조가 바뀌어 잘라낸 결과가 비면 **전문으로 되돌린다.** 착수 금지 목록이 조용히
#    사라지는 것이 이 훅의 최악 실패다(AGENTS.md §9 — 조용한 통과).
emit_head_section() {  # emit_head_section <표시이름> <경로>
  local label="$1" path="$2" body=""
  printf '\n===== %s =====\n' "$label"
  if [ ! -f "$path" ]; then
    printf '🔴 파일 없음: %s — 사람에게 알릴 것\n' "$path"
    return
  fi
  body="$(awk '/^## /{n++} n>=2{exit} n>=1{print}' "$path")"
  if [ -z "$body" ]; then
    printf '🔴 첫 `## ` 섹션을 못 찾음 — 전문을 대신 싣는다. 파일 구조를 사람이 확인할 것.\n'
    cat "$path"
  else
    printf '%s\n' "$body"
  fi
}

# budget_line — 부팅이 예산의 85%를 넘겼을 때만 한 줄 찍는다(2026-08-31 신설).
# 🔴 왜 훅이 이걸 아나: 예산 압박은 **쓰기 직전**에 보여야 한다. doctor를 돌려야만 보이면
#   context.md에 세 줄 덧붙인 다음에야 알게 되고, 그때는 이미 지우는 일이 남는다.
# 🔵 건강할 땐 아무것도 안 찍는다 = 평시 비용 0B. 노란불일 때만 ~100B를 쓴다.
#   (그 100B는 다이어트를 한 세션 앞당기는 값이다 — 늦은 다이어트가 상한 상향을 부른다.)
budget_line() {
  local payload_sz="$1" claude_md="$ROOT/CLAUDE.md" total pct
  total=$payload_sz
  [ -f "$claude_md" ] && total=$(( total + $(tr -d '\r' < "$claude_md" | wc -c) ))
  pct=$(( total * 100 / 16384 ))
  [ "$pct" -lt 85 ] && return 0
  printf '🟡 부팅 %dB/16384B (%d%%) — 이 세션에서 무언가 걷어낼 것. 상한은 올리지 않는다(AGENTS.md §9).\n' "$total" "$pct"
}

# 🔴 본문을 변수에 담았다가 찍는다 — **자기 출력을 재기 위해서**다. 파일 크기를 더하는
#   대리지표로 돌아가지 않는다(2026-08-28에 doctor가 대리지표를 버린 것과 같은 이유).
PAYLOAD="$(
  # emit_rule_sections — AGENTS.md에서 **부팅 시점에 필요한 절만** 싣는다(2026-08-31 신설, 사장님 승인).
# 왜: AGENTS.md 8.4KB가 부팅 페이로드의 54%였는데, 그 안엔 부팅 때 쓰지 않는 규칙이 섞여 있다.
#   파일에서 지우는 게 아니라 **안 싣는 것**이라 SSOT는 그대로다(pending-approvals 방식과 동일).
#
# 싣는 것 : 머리말(3주체 태그) · §0-1(조건부 로드 표) · §1(작업 순서·CONFIRM·DB) · §2(소유권)
# 빼는 것 : §0  — **부팅 절차. 이 주입이 도착한 시점에 이미 끝난 일이다.** 훅이 안 붙는
#                 서브에이전트·Gemini CLI는 어차피 파일을 직접 열고, 사람 진입점인 루트
#                 CLAUDE.md에도 부팅 3개가 그대로 적혀 있다(자동 로드라 규칙 손실 없음).
#           §6·§7·§9 — 각각 검색할 때·저장할 때·마감할 때 필요하다. 트리거는 아래 꼬리말과
#                 §0-1 표, `done.md` §3-5가 들고 있다.
# 🔴 규칙이 세션에 도달하지 않는 것이 이 하네스의 최악 사고다(08-25 소유권 사고가 그 유형).
#   그래서 ①빠진 절과 트리거를 꼬리말로 **명시**하고 ②잘라낸 결과가 수상하면 **전문으로 되돌린다.**
emit_rule_sections() {  # emit_rule_sections <표시이름> <경로>
  local label="$1" path="$2" body=""
  printf '\n===== %s =====\n' "$label"
  if [ ! -f "$path" ]; then
    printf '🔴 파일 없음: %s — 사람에게 알릴 것\n' "$path"
    return
  fi
  body="$(awk 'BEGIN{keep=1} /^## /{keep=($0 ~ /^## (0-1|1|2)\./)} keep' "$path")"
  # 되돌림 조건: 필수 절이 안 잡혔거나 결과가 비정상적으로 작다 = 헤딩 구조가 바뀐 것.
  if ! printf '%s' "$body" | grep -q '^## 2\.' || ! printf '%s' "$body" | grep -q '^## 0-1\.' \
     || [ "$(printf '%s' "$body" | wc -c)" -lt 1500 ]; then
    printf '🔴 절 추출 실패 — 전문을 대신 싣는다. AGENTS.md 헤딩 구조를 사람이 확인할 것.\n'
    cat "$path"
    return
  fi
  printf '%s\n' "$body"
  printf '\n> 🔴 **이 주입에 빠진 절이 있다 — 없는 게 아니라 안 실은 것이다.** 해당 상황이면 `.harness/AGENTS.md`를 직접 열 것:\n'
  printf '> **§0** 부팅 절차(이미 끝남) · **§6** 검색·정보 품질 · **§7** 산출물 저장 위치 · **§9** 자기 점검·예산 배수구(마감 때·노란불 때)\n'
}

cat <<'EOF'
[자동 부팅] 이어봄 하네스 — 아래는 AGENTS.md §0 부팅 3개를 훅이 자동 주입한 것이다.
사람이 "세션 불러오기"라고 말하지 않아도 매 세션(시작·재개·clear·compact) 들어온다.

🔴 이 내용을 다시 읽겠다고 파일을 또 열지 말 것 — 이미 아래에 전문이 있다.
🔴 지금 모드가 Opus(기획, docs/·.harness/)인지 Sonnet(구현, eobom/)인지 먼저 확인할 것.
🔴 pending-approvals.md "대기 중" 항목은 착수 금지.
EOF
  emit "1. .harness/memory/context.md — 지금 상태 + 다음 할 일" "$ROOT/.harness/memory/context.md"
  emit_head_section "2. .harness/memory/pending-approvals.md — 🔴 착수 금지 목록 (대기 중 섹션만)" "$ROOT/.harness/memory/pending-approvals.md"
  emit_rule_sections "3. .harness/AGENTS.md — 행동 규칙 SSOT (§0-1·§1·§2만 · 나머지는 파일에)" "$ROOT/.harness/AGENTS.md"
  printf '\n===== 부팅 끝 =====\n조건부 로드(§0-1)는 해당 작업일 때만 추가로 읽는다.\n'
)"

# 경고줄 자신은 실측에서 빠진다 — 노란불일 때만 나오고, 그때는 이미 노란불이라 판정이
# 뒤집히지 않는다. doctor는 경고줄까지 포함한 최종 출력을 재므로 둘의 %가 1p 어긋날 수 있다.
budget_line "$(printf '%s\n' "$PAYLOAD" | tr -d '\r' | wc -c)"
printf '%s\n' "$PAYLOAD"
