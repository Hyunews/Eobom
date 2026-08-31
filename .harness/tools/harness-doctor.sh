#!/usr/bin/env bash
#
# harness-doctor.sh — 하네스 구조 무결성 단일 점검기
#
# 설계 원칙:
#   1. 사람이 기억해서 확인하지 않는다. 이 스크립트 하나가 전부 검사한다.
#   2. **검사 대상이 0건이면 성공이 아니라 실패다.** (2026-08-07 사고 재발 방지 —
#      경로가 바뀌어 아무것도 검사하지 않으면서 초록불만 띄우던 스크립트 3개가 있었다.)
#   3. GNU coreutils 기준(Windows Git Bash 호환). BSD 전용 `stat -f` 쓰지 않는다.
#
# 사용법: bash .harness/tools/harness-doctor.sh
# 종료코드: 0 = 정상, 1 = 문제 발견

set -uo pipefail

HARNESS="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ROOT="$(cd "$HARNESS/.." && pwd)"

ISSUES=0
CHECKS=0

red()    { printf '\033[31m%s\033[0m\n' "$1"; }
green()  { printf '\033[32m%s\033[0m\n' "$1"; }
gray()   { printf '\033[90m%s\033[0m\n' "$1"; }
yellow() { printf '\033[33m%s\033[0m\n' "$1"; }
blue()   { printf '\033[36m%s\033[0m\n' "$1"; }

fail() { red "  🔴 $1"; ISSUES=$((ISSUES + 1)); }
ok()   { green "  🟢 $1"; }
note() { gray "  ⚪ $1"; }
# 🟡 warn — 사람이 확인할 것이 있으나 **틀렸다고 단정할 수 없는** 경우. ISSUES를 올리지 않으므로
# 종료코드가 0으로 남는다. 2026-08-27 신설(§10 소유권 검사).
#   🔴 남용 금지: 판정이 가능한 검사는 fail로 간다. warn이 늘면 전부 무시당해 §2(조용한 통과
#   방지)가 무력해진다. **"모드 전환이 있었나"처럼 사람만 답할 수 있는 질문에만 쓴다.**
warn() { yellow "  🟡 $1"; }

# ── budget_check — 예산 판정 단일 창구 (2026-08-31 신설) ─────────
# 🔴 지금까지 예산 검사는 **100%에서만** 반응했다. 그래서 예산 문제를 만나는 시점이 늘
#   작업 도중이었고, 그 자리에서 할 수 있는 선택이 "급하게 줄이기 / 상한 올리기" 둘뿐이었다.
#   08-26·08-28 두 번의 상향이 전부 그 상황에서 나왔다. **급할 때 내리는 결정이 상한을 올린다.**
#   85%에서 미리 켜면 다이어트가 사고 대응이 아니라 **정기 정비**가 된다 —
#   이 검사의 목적은 초과를 잡는 것이 아니라 **초과를 만나지 않는 것**이다.
# ⚠️ 위 warn 남용 금지 조항의 **승인된 두 번째 용법**: "사람만 답할 수 있는 질문" 외에
#   **위반이 아니라 접근(接近)** 을 알리는 선행지표. 아직 규칙을 어기지 않았으니 fail이 될 수 없고,
#   두면 반드시 fail이 되니 ok도 아니다. 🔴 이 예외를 더 늘리지 않는다.
# 🔵 백분율을 항상 찍는 이유: 바이트는 감이 안 온다. 쓰는 사람이 "몇 %인가"를 늘 보고 있어야
#   한 줄 더 쓸지 말지를 그 자리에서 판단한다(§9 배수구 규칙이 작동하는 전제).
WATERMARK=85

# ── 자동 상한 재설정 (2026-08-31 신설, 사장님 지시) ──────────────
# 🔴 "상시 85% 이상이면 자동으로 재설정한다." 자동이라 **상시의 정의를 코드에 박는다** —
#   그러지 않으면 이 장치가 곧 "붐빌 때마다 상한이 올라가는" 기계가 된다(그게 원래 문제였다).
#   조건 넷을 전부 만족할 때만 올린다:
#     ① 조건부 로드 파일일 것 — **부팅 예산과 `context.md`는 자동 대상이 아니다.**
#        매 세션 × 매 주체가 지불하는 비용이라 사람이 판단해야 한다(A안으로 74%까지 내려왔다).
#     ② **서로 다른 날** 두 번 85%를 넘길 것 — 하루 안의 작업 폭주로는 안 올라간다.
#        (한 세션에서 넘겼다 걷어내면 그걸로 끝. 다음 날 또 넘겨 있어야 "상시"다.)
#     ③ 그 파일이 **자동 재설정을 받은 적이 없을** 것 — 파일당 딱 한 번.
#     ④ 새 상한이 20KB 이하일 것.
#   ③④에 걸리면 올리지 않고 🔴를 낸다: **두 번째 답은 상향이 아니라 분리다**(§9).
# 새 상한 = 현재 실측이 70%가 되는 크기(1KB 올림). 30% 여유가 이 장치의 목적 —
#   "실측 + ε"로 정해진 상한들이 전 파일을 상시 99%에 앉혀 놓은 것이 재발 원인이었다.
# 기록: 덮어쓴 값은 `tools/budgets.tsv`, 경위는 `_meta/예산_이력.md`에 남는다. 사람이 되돌릴 수 있다.
BUDGET_TSV="$HARNESS/tools/budgets.tsv"       # 파일<TAB>새상한<TAB>재설정일<TAB>당시실측
BUDGET_WATCH="$HARNESS/tools/budget-watch.tsv" # 파일<TAB>처음 85%를 넘긴 날
BUDGET_LOG="$HARNESS/_meta/예산_이력.md"
TODAY=$(date +%F)

budget_override() {  # budget_override <파일키> — 자동 재설정된 상한이 있으면 그 값을 찍는다
  [ -f "$BUDGET_TSV" ] || return 0
  awk -F'\t' -v f="$1" '$1==f{v=$2} END{if(v) print v}' "$BUDGET_TSV"
}

budget_autoreset() {  # budget_autoreset <파일키> <실측B> <현재상한B>
  local f="$1" sz="$2" lim="$3" pct first new
  pct=$(( sz * 100 / lim ))
  if [ "$pct" -lt "$WATERMARK" ]; then           # 해소됐으면 관찰 종료
    [ -f "$BUDGET_WATCH" ] && grep -v "^$f	" "$BUDGET_WATCH" > "$BUDGET_WATCH.tmp" 2>/dev/null \
      && mv "$BUDGET_WATCH.tmp" "$BUDGET_WATCH"
    return 0
  fi
  first=$(awk -F'\t' -v f="$f" '$1==f{print $2}' "$BUDGET_WATCH" 2>/dev/null | tail -1)
  if [ -z "$first" ]; then                        # ② 오늘이 처음 — 올리지 않는다
    printf '%s\t%s\n' "$f" "$TODAY" >> "$BUDGET_WATCH"
    gray "       ↳ 오늘 처음 85%를 넘겼다. 걷어내지 않으면 다음 날 상한을 자동 재설정한다"
    return 0
  fi
  [ "$first" = "$TODAY" ] && return 0             # 같은 날 두 번째 실행 — 하루는 하루다
  if [ -n "$(budget_override "$f")" ]; then       # ③ 이미 한 번 받았다
    fail "$f — 자동 재설정을 받고도 다시 상시 85%다. **상향이 아니라 분리할 차례**(AGENTS.md §9)"
    return 0
  fi
  new=$(( (sz * 100 / 70 + 1023) / 1024 * 1024 ))
  if [ "$new" -gt 20480 ]; then                   # ④ 20KB 넘으면 파일을 쪼갤 문제다
    fail "$f — 자동 재설정하면 $((new / 1024))KB다. 한 파일이 그만한 주제면 **분리**가 답이다(§9)"
    return 0
  fi
  printf '%s\t%s\t%s\t%s\n' "$f" "$new" "$TODAY" "$sz" >> "$BUDGET_TSV"
  grep -v "^$f	" "$BUDGET_WATCH" > "$BUDGET_WATCH.tmp" 2>/dev/null && mv "$BUDGET_WATCH.tmp" "$BUDGET_WATCH"
  [ -f "$BUDGET_LOG" ] || printf '# 예산 자동 재설정 이력\n\n> `harness-doctor.sh`가 스스로 적는다. 되돌리려면 `tools/budgets.tsv`의 해당 줄을 지운다.\n> 규칙·근거 → `예산_재발방지_260831.md`\n\n| 날짜 | 파일 | 옛 상한 | 새 상한 | 당시 실측 |\n|---|---|---|---|---|\n' > "$BUDGET_LOG"
  printf '| %s | `%s` | %dB | **%dB** | %dB (%d%%) |\n' "$TODAY" "$f" "$lim" "$new" "$sz" "$pct" >> "$BUDGET_LOG"
  blue "  🔵 $f — 상한 자동 재설정 ${lim}B → ${new}B (서로 다른 날 2회 85% 초과 = 상시). 파일당 1회뿐, 다음엔 분리"
}

budget_check() {  # budget_check <표시이름> <실측B> <상한B>
  local label="$1" sz="$2" lim="$3" pct
  pct=$(( sz * 100 / lim ))
  CHECKS=$((CHECKS + 1))
  if [ "$sz" -gt "$lim" ]; then
    fail "$label ${sz}B / ${lim}B (${pct}%) 초과 — 상한을 올리기 전에 AGENTS.md §9 순서"
  elif [ "$pct" -ge "$WATERMARK" ]; then
    warn "$label ${sz}B / ${lim}B (${pct}%) · 여유 $((lim - sz))B — 이번 세션 안에 걷어낼 것(§9 배수구)"
  else
    ok "$label ${sz}B / ${lim}B (${pct}%)"
  fi
}

# 줄바꿈을 LF로 정규화해서 잰다. Windows에서 git이 체크아웃하며 CRLF로 바꾸면 줄 수만큼
# 바이트가 늘어, 내용이 그대로인데도 예산을 넘긴다(2026-08-14: 브랜치 병합 직후 roles.md가
# 109B 초과 — 정확히 줄 수만큼이었다). 예산이 재려는 건 **에이전트가 읽는 내용의 양**이지
# 줄바꿈 표현 방식이 아니다. 여기서 내용을 깎으면 있지도 않은 초과분과 싸우게 된다.
size_of() { [ -f "$1" ] && tr -d '\r' < "$1" | wc -c | tr -d ' ' || echo 0; }

echo "=== 하네스 점검 (root: $ROOT) ==="
echo

# ── 1. 부팅 파일 존재 + 용량 예산 ────────────────────────────────
echo "1. 부팅 파일 (매 세션 로드, 합계 ≤ 16KB)"
# 🔴 루트 CLAUDE.md가 목록 맨 앞인 이유: .harness/ 안의 3개는 에이전트가 자발적으로 읽어야만
# 로드되지만, 루트 CLAUDE.md는 **CLI가 매 세션 자동으로** 밀어 넣는다. 즉 실제 부팅 비용은
# 항상 여기부터 발생한다. 예산에서 빼면 "재고 있는데 안 세는" 항목이 생긴다(설계 원칙 2).
# (2026-08-25 신설 — 소유권 규칙이 .harness/에만 있어 세션에 로드되지 않았고, Opus가 eobom/에
#  코드를 쓴 사고가 있었다. 자동 로드되는 자리에 규칙을 두는 것이 이 파일의 존재 이유다.)
#
# 🔵 2026-08-28 — **재는 대상을 파일 크기에서 "훅이 실제로 내보내는 바이트"로 바꿨다**(사장님 승인).
#   같은 날 SessionStart 훅(`tools/session-boot.sh`)이 들어오면서 **전달 방식이 프로그래밍
#   가능해졌는데 계량은 옛날 그대로**였다. 훅 이전에는 "디스크의 파일 4개 합 = 세션 비용"이
#   참이었지만, 지금은 훅이 파일의 일부만 실을 수 있어 둘이 갈린다(pending-approvals의 "해제됨"
#   이력이 그 첫 사례 — 파일엔 남기고 세션엔 안 싣는다).
#   ⚠️ 파일 크기는 **비용의 대리지표**였다. 대리지표와 실물이 갈라지면 실물을 잰다.
# 🔴 부수 효과가 본전보다 크다: **지금까지 훅이 죽어도 doctor는 통과했다**(파일은 멀쩡하니까).
#   실제 출력을 재면 훅 고장이 바이트 급감으로 잡힌다 — 설계 원칙 2(검사 대상 0건 = 실패).
BOOT_TOTAL=0

# (1) 루트 CLAUDE.md — 훅이 아니라 CLI가 민다. 훅 출력에 안 들어오므로 따로 더한다.
CHECKS=$((CHECKS + 1))
if [ -f "$ROOT/CLAUDE.md" ]; then
  sz=$(size_of "$ROOT/CLAUDE.md")
  BOOT_TOTAL=$((BOOT_TOTAL + sz))
  echo "     CLAUDE.md (CLI 자동 로드) — ${sz}B"
else
  fail "없음: CLAUDE.md"
fi

# (2) 훅이 실제로 내보내는 바이트. 파일을 더하지 않고 스크립트를 돌려서 잰다.
CHECKS=$((CHECKS + 1))
BOOT_SH="$HARNESS/tools/session-boot.sh"
if [ -f "$BOOT_SH" ]; then
  HOOK_TXT=$(CLAUDE_PROJECT_DIR="$ROOT" bash "$BOOT_SH" 2>/dev/null | tr -d '\r')
  HOOK_OUT=$(printf '%s' "$HOOK_TXT" | wc -c | tr -d ' ')
  BOOT_TOTAL=$((BOOT_TOTAL + HOOK_OUT))
  echo "     session-boot.sh 실제 출력 — ${HOOK_OUT}B"
  # 🔵 2026-08-31 — 하한선을 **바이트에서 내용으로** 바꿨다. 훅이 절을 골라 싣게 되면서
  #   "1만B 이상이면 정상"이라는 전제가 깨졌다(정상 출력이 9,956B로 내려왔다). 바이트 하한을
  #   그때그때 내려 맞추면 결국 아무것도 안 잡는 숫자가 된다.
  #   대신 **세 덩이가 다 있는가 + 훅이 스스로 낸 🔴가 있는가**를 본다 — 이게 원래 잡고 싶던 것이다.
  #   (설계 원칙 2 — 훅이 깨졌는데 초록불이 켜지는 일만은 막아야 한다.)
  BLOCKS=$(printf '%s\n' "$HOOK_TXT" | grep -c '^===== [123]\. ')
  if [ "$BLOCKS" -ne 3 ]; then
    fail "훅이 낸 부팅 덩이가 ${BLOCKS}/3개 — session-boot.sh 확인"
  elif printf '%s\n' "$HOOK_TXT" | grep -q '🔴 파일 없음\|🔴 절 추출 실패\|🔴 첫 `## ` 섹션'; then
    fail "훅이 스스로 🔴를 냈다 — 부팅 파일 구조가 바뀌었다. 훅 출력을 직접 볼 것"
  elif [ "$HOOK_OUT" -lt 6144 ]; then
    fail "훅 출력 ${HOOK_OUT}B — 덩이는 셋인데 내용이 비었다. session-boot.sh 확인"
  fi
else
  fail "없음: .harness/tools/session-boot.sh — .claude/settings.json의 SessionStart 훅이 가리킴"
fi

# (3) 부팅 3개 실존 — 훅은 파일이 없어도 경고만 찍고 계속하므로(세션을 막지 않는 설계),
#     "없어졌다"는 판정은 여기서 낸다. 크기는 합계에 더하지 않고 범인 지목용으로만 보여준다.
for f in "$HARNESS/AGENTS.md" "$HARNESS/memory/context.md" "$HARNESS/memory/pending-approvals.md"; do
  CHECKS=$((CHECKS + 1))
  if [ ! -f "$f" ]; then
    fail "없음: ${f#$ROOT/}"
    continue
  fi
  echo "     (참고) ${f#$ROOT/} — 파일 $(size_of "$f")B"
done
# 예산 15KB (2026-08-26 상향, 사장님 승인). 🔴 **먼저 내용을 쳐낸 뒤에 올렸다** — AGENTS.md §9
# 순서를 지킨 기록이다. 같은 날 context.md를 11,272B → 2,756B로 줄이고(진행 중 상세를
# memory/backlog.md로 분리) 부팅을 22KB → 14KB로 내렸는데도 11KB에 닿지 못했다.
#   옛 11KB는 **루트 CLAUDE.md가 없던 시절 숫자**다. 그날 자동 로드 파일이 하나 늘었고
#   (그게 소유권 사고를 막는 장치라 뺄 수 없다), 남은 셋은 이미 바닥이다:
#     pending-approvals 3,360B(사람만 지움·§0) + context.md 3,016B(자체 상한 3KB) +
#     CLAUDE.md 1,884B = 8,260B 고정 → AGENTS.md 몫이 3KB밖에 안 남는다(현재 6.7KB, 규칙 SSOT).
#   즉 11KB는 **도달 불가**였고, 고칠 수 없는 빨간불은 "빨간불 무시" 습관을 만들어 doctor 전체의
#   신뢰를 깎는다(§8 BASELINE 주석과 같은 이유).
# ⚠️ 다음에 또 닿으면 **이 숫자를 올리기 전에** 무엇을 어디로 옮겼는지 여기 먼저 적을 것.
#
# 🔵 2026-08-28 — 15KB → 16KB 상향(사장님 승인). **§9 순서대로 먼저 쳐낸 기록:**
#   · security.md §6(DB 게이트) → db-safety.md 분리      · AGENTS.md §0 부팅예산 연혁 문단 삭제(이 주석과 중복)
#   · AGENTS.md §2 소유권 강조 문단 → 루트 CLAUDE.md 포인터  · AGENTS.md §7 표 → §2와 중복이라 산문 축약
#   · AGENTS.md 기록폴더 설명 → roles.md §1-2와 중복      · done.md §4-1 doctor 번호밀림 주석(스테일) 삭제
#   · context.md 완료항목 3회 압축 → walkthrough           · db-safety.md 머리말 경위 → _meta/
#   그렇게 걷어내고도 **여유가 4B**였다(15,356/15,360).
# 🔴 올린 이유는 "자리가 모자라서"가 아니라 **자동 로드 자리에 넣어야만 하는 안전 규칙이 늘었기
#   때문**이다 — 08-27 DB 유실 2회로 트리거를 부팅 파일에 박았고(조건부 로드는 "위험을 인지한
#   뒤에야" 열려서 그 사고를 못 막았다), 08-28 DB CONFIRM 조항이 같은 이유로 붙는다.
#   **이 종류는 뺄 수 없다.** 하루에 ~560B가 이 사유로 늘었다.
# ⚠️ **1KB 여유는 그런 추가 2건분이다.** 한 달 안에 또 닿으면 답은 세 번째 상향이 아니라
#   **무언가를 부팅에서 빼는 것**이다(1순위 후보: pending-approvals의 인프라 항목 → backlog.md).
#
# 🔵 2026-08-28 — 위 "1순위 후보"를 실제로 집행했다. 예산 16KB는 **그대로 두고** 실린 양을 줄였다:
#   · pending-approvals 머리말 483B + "해제됨" 이력 782B → 훅이 안 싣는다(파일엔 그대로)
#   · 인프라 항목 실측표·리전 주의 ~900B → backlog.md ⑫ (근거는 근거지 결정이 아니다)
#   여유 62B → 약 2.2KB. 🔴 더 중요한 건 **이력·근거가 앞으로 예산을 먹지 않는다**는 것이다.
#   같은 압박이 오면 먼저 물을 것: *"이건 결정인가, 결정의 근거인가."* 근거는 backlog로 간다.
budget_check "부팅 실적재량" "$BOOT_TOTAL" 16384

# 🔴 2026-08-25 신설 — context.md는 자기 머리말에 **"3KB 초과 금지"** 를 스스로 적어 두고도
# 11,272B(3.7배)까지 불어 있었다. **아무도 재지 않는 규칙은 규칙이 아니다.** 합계만 보면
# 어느 파일이 예산을 먹었는지 안 보여서 "다 같이 조금씩 넘쳤다"로 읽히는데, 실제로는
# 이 파일 하나가 부팅 예산 11KB를 통째로 쓰고 있었다. 범인을 지목해야 다이어트가 시작된다.
CTX_SZ=$(size_of "$HARNESS/memory/context.md")
budget_check "context.md(자체 상한)" "$CTX_SZ" 3072
echo

# ── 2. 조건부 로드 파일 존재 ─────────────────────────────────────
# 예산 근거: 조건부 파일은 부팅과 달리 선택적으로만 읽히므로 상한이 덜 빡빡해도 된다.
# roles.md는 태그표 + 소유권표 2개 + 파이프라인 + 편차 프로토콜 + 핸드오프를 담는
# 이 하네스의 중심 문서라 8KB를 준다. 나머지는 단일 주제라 6KB.
# 2026-08-10: roles.md가 8188B까지 차서 기록 형식(구 §3)을 record.md로 분리했다.
# 다시 한계에 닿으면 예산을 올리기 전에 "이 문서에 있을 내용이 맞는지"부터 볼 것.
echo "2. 조건부 로드 파일"
# 2026-08-25: memory/backlog.md 추가 — context.md를 3KB로 되돌리려고 진행 중 상세를 옮긴 곳.
# 부팅에서 빠졌으니 조건부 예산 안에 들어와야 한다(안 재면 여기로 다시 살이 찐다).
# 2026-08-27: db-safety.md 추가 — security.md §6이었으나 트리거를 "스키마 변경 전"에서
# "DB에 쓰는 명령 전"으로 넓히자 주제가 갈려 분리했다. 데이터 유실 2회(08-05·08-27)가 근거.
#
# 🔴 2026-08-28: CLAUDE.md·GEMINI.md 추가 — **둘 다 지금까지 한 번도 측정되지 않았다.**
#   AGENTS.md 머리말이 이 둘을 *"각자의 역할만 덧붙이는 얇은 파일"* 이라 부르는데, **얇은지
#   재는 사람이 없었다**(GEMINI.md는 9,198B로 이미 얇지 않다). `.harness/CLAUDE.md`는
#   디렉토리 근접으로 자동 로드돼 매 세션 컨텍스트를 쓰는데도 예산이 없었다 —
#   §2(context.md가 자기 상한의 3.7배까지 불어 있던 건)와 정확히 같은 구멍이다.
for f in roles.md security.md done.md systems.md record.md db-safety.md CLAUDE.md GEMINI.md memory/backlog.md; do
  # (CHECKS 증가는 budget_check 안에서 한다 — 2026-08-31)
  # 2026-08-26 예산 정정 — roles.md 8→10KB · systems.md 6→12KB. AGENTS.md §9 순서대로
  # **내용부터 봤고, 옮길 곳이 없어서** 올렸다. 근거는 "6KB = 단일 주제"라는 위 전제가
  # 이 두 파일엔 처음부터 맞지 않았다는 것이다:
  #   · systems.md = 인증·지도·공공데이터·DB·배포·미구현 **6개 절의 명부**다(조건부 로드 표도
  #     다섯 주제를 이 파일 하나로 보낸다). 쪼개면 표가 5줄로 늘고 동기화 대상이 5개가 돼
  #     오히려 나빠진다 — 명부는 한 파일일 때 값어치가 있다.
  #   · roles.md = 태그표·소유권표 2개·파이프라인·편차 프로토콜·핸드오프 5주제. 2026-08-25에
  #     Opus/Sonnet 소유권 분리(사고 재발 방지)가 들어가며 더 늘었고, 그건 뺄 수 없는 내용이다.
  # ⚠️ 그래도 상한이다. 다음에 닿으면 올리기 전에 무엇을 어디로 옮겼는지 여기 먼저 적을 것.
  # 🔵 2026-08-28 CLAUDE.md 6KB(사장님 승인) — *"기획·개발 둘의 내용이 모두 들어가야 한다"*.
  #   이 파일만 **역할 2개**(`[Claude:Opus]` 기획 + `[Claude:Sonnet]` 구현)를 담는다.
  #   같은 날 "Opus용/Sonnet용으로 쪼개는 안"이 기각됐으므로(→ `_meta/CLAUDE_md_분리_검토.md`)
  #   **한 파일이 둘을 다 지는 것이 확정 구조**다. 단일 주제 6KB를 그대로 주되, 현재 2,021B라
  #   3배 여유가 있다 — 여유가 곧 "쪼개지 말라"는 결정의 뒷받침이다.
  # 🔴 GEMINI.md 10KB는 **잠정치다.** 역할이 하나(문서화·검증)인데 9,198B로 CLAUDE.md의 4.5배다.
  #   6KB로 잡으면 첫날부터 고칠 수 없는 빨간불이 되어 "빨간불 무시" 습관을 만든다(§1 주석과
  #   같은 이유). ⚠️ **다음에 GEMINI.md를 손댈 때 내용부터 쳐내고 6KB로 내릴 것.**
  #   🔴 2026-08-31 주의: 88%라 **자동 재설정 대상**이다(→ 13KB). 위 "내려야 한다"는 의도와
  #     반대 방향이므로, 자동으로 올라갔다면 `budgets.tsv`의 GEMINI.md 줄을 지워 되돌릴 것.
  # 🔵 2026-08-28 backlog.md 6→7KB(사장님 승인). **부팅에서 뺀 것이 여기로 왔다** — 인프라
  #   항목의 실측 근거 ~900B(→ ⑫). 이 파일의 존재 이유가 "부팅에서 뺀 상세의 종착지"이므로
  #   부팅이 줄면 여기가 느는 것이 정상이다. ⚠️ 다만 상한 없이 늘면 §1의 구멍이 여기로 옮겨온
  #   것일 뿐이다 — 다음에 닿으면 끝난 항목이 walkthrough.md로 갔는지부터 볼 것.
  case "$f" in
    roles.md)         budget=10240 ;;
    systems.md)       budget=12288 ;;
    GEMINI.md)        budget=10240 ;;
    memory/backlog.md) budget=7168 ;;
    *)                budget=6144 ;;
  esac
  if [ -f "$HARNESS/$f" ]; then
    # 자동 재설정된 상한이 있으면 그 값이 이긴다(위 case는 최초값일 뿐이다).
    ovr=$(budget_override "$f"); [ -n "$ovr" ] && budget=$ovr
    sz=$(size_of "$HARNESS/$f")
    budget_check "$f" "$sz" "$budget"
    budget_autoreset "$f" "$sz" "$budget"
  else
    CHECKS=$((CHECKS + 1))
    fail "없음: .harness/$f (AGENTS.md 조건부 로드 표가 가리킴)"
  fi
done
echo

# ── 3. 소유권 디렉토리 실존 ──────────────────────────────────────
echo "3. 소유권 영역 디렉토리 (roles.md 기준)"
for d in docs reports assets eobom "docs/작업일지_및_기록/에이전트_기록"; do
  CHECKS=$((CHECKS + 1))
  if [ -d "$ROOT/$d" ]; then
    ok "$d/"
  else
    fail "없음: $d/ — roles.md 소유권 표가 가리키는 경로"
  fi
done
echo

# ── 4. 규칙 파일이 가리키는 경로의 실존 (유령 경로 검사) ─────────
echo "4. 유령 경로 검사 (.harness/*.md 안의 백틱 경로)"
GHOST=0
PATHS_CHECKED=0
while IFS= read -r mdfile; do
  # 백틱으로 감싼 것 중 경로처럼 생긴 것만 (docs/ eobom/ reports/ assets/ .harness/ 로 시작)
  while IFS= read -r p; do
    [ -z "$p" ] && continue
    p="${p%/}"
    # 자리표시자 스킵: <name>, *, YYMMDD, YYYY-MM-DD 등 실제 파일명이 아닌 패턴
    case "$p" in
      *"<"*|*">"*|*"*"*|*YYMMDD*|*YYYY*|*"{"*) continue;;
    esac
    PATHS_CHECKED=$((PATHS_CHECKED + 1))
    if [ ! -e "$ROOT/$p" ]; then
      fail "${mdfile#$ROOT/} → \`$p\` (실존하지 않음)"
      GHOST=$((GHOST + 1))
    fi
  done < <(grep -oE '`(docs|reports|assets|eobom|\.harness)/[^`]*`' "$mdfile" 2>/dev/null | tr -d '`' | sort -u)
done < <(find "$HARNESS" -maxdepth 1 -name '*.md')
CHECKS=$((CHECKS + PATHS_CHECKED))
if [ "$PATHS_CHECKED" -eq 0 ]; then
  fail "검사한 경로가 0건 — grep 패턴이 깨졌을 가능성 (조용한 통과 방지)"
elif [ "$GHOST" -eq 0 ]; then
  ok "$PATHS_CHECKED개 경로 전부 실존"
fi
echo

# ── 5. DOCS_INDEX → reports/ 링크 무결성 ─────────────────────────
echo "5. docs/00_DOCS_INDEX.md 가 가리키는 reports/ 파일"
INDEX="$ROOT/docs/00_DOCS_INDEX.md"
if [ -f "$INDEX" ]; then
  MISSING=0
  IDX_CHECKED=0
  while IFS= read -r rp; do
    [ -z "$rp" ] && continue
    IDX_CHECKED=$((IDX_CHECKED + 1))
    [ -e "$ROOT/$rp" ] || { fail "인덱스가 가리키는 $rp 없음"; MISSING=$((MISSING + 1)); }
  done < <(grep -oE '`reports/[^`]+`' "$INDEX" 2>/dev/null | tr -d '`' | sort -u)
  CHECKS=$((CHECKS + IDX_CHECKED))
  if [ "$IDX_CHECKED" -eq 0 ]; then
    note "인덱스에 reports/ 참조 없음"
  elif [ "$MISSING" -eq 0 ]; then
    ok "$IDX_CHECKED개 보고서 링크 전부 실존"
  fi
else
  fail "docs/00_DOCS_INDEX.md 없음"
  CHECKS=$((CHECKS + 1))
fi
echo

# ── 5-1. "다음 할 일" 에이전트 태그 ──────────────────────────────
# 사용자가 이 한 줄로 어느 모델·어느 창으로 갈지 판단한다. 태그가 빠지면 전환 판단이
# 불가능해져 구조 전체가 무력화되므로 실패 처리한다. (2026-08-07 태그가 지워진 사고 있었음)
# 2026-08-10 3주체 전환: 맨 `[Claude]`는 Opus/Sonnet 구분이 안 되므로 통과시키지 않는다.
echo "5-1. context.md \"다음 할 일\" 에이전트 태그"
CTXF="$HARNESS/memory/context.md"
CHECKS=$((CHECKS + 1))
if [ -f "$CTXF" ]; then
  NEXT_BLOCK="$(sed -n '/^## .*다음 할 일/,/^## /p' "$CTXF" | grep -v '^<!--' | grep -v '^\s*$')"
  if [ -z "$NEXT_BLOCK" ]; then
    fail "\"▶ 다음 할 일\" 섹션이 비어있음"
  elif printf '%s' "$NEXT_BLOCK" | grep -qE '\[(Claude:(Opus|Sonnet)|Gemini|사용자)\]'; then
    ok "에이전트 태그 있음"
  elif printf '%s' "$NEXT_BLOCK" | grep -qE '\[Claude\]'; then
    fail "태그가 맨 [Claude] — 3주체 전환 후로는 [Claude:Opus](기획) / [Claude:Sonnet](구현)로 구분할 것"
  else
    fail "\"다음 할 일\"에 [Claude:Opus]/[Claude:Sonnet]/[Gemini]/[사용자] 태그 없음 — 어느 모델·창으로 가야 할지 알 수 없다"
  fi
else
  fail "context.md 없음"
fi
echo

# ── 5-2. 승인 대기 항목과 "다음 할 일" 충돌 검사 ─────────────────
# 2026-08-07, 08-08 두 차례 "docs/13은 대표 컨펌 전이라 착수 금지"라는 경고가
# context.md 갱신 중 조용히 삭제된 사고가 있었다. pending-approvals.md로 분리한 뒤에도
# "다음 할 일"이 승인 대기 문서를 직접 가리키면 그 자체로 위험 신호이므로 자동 검사한다.
echo "5-2. 승인 대기(pending-approvals.md) ↔ \"다음 할 일\" 충돌 검사"
PENDING="$HARNESS/memory/pending-approvals.md"
CHECKS=$((CHECKS + 1))
if [ -f "$PENDING" ]; then
  # 🔴 2026-08-25 수정 — 경로형(`docs/…md`)만 찾고 있었다. 그런데 실제 대기 항목은 전부
  # **문서 ID 표기**(`` `01-05` §10 ``, `` `00-11` §8 ``)로 적혀 있어 하나도 안 잡혔고,
  # 대기 4건이 살아 있는데 "대기 중인 항목 없음" 🟢가 떴다. 2026-08-07·08-08 사고
  # 재발 방지용으로 만든 검사가 **정확히 그 사고를 못 잡는 상태로 초록불**이었던 것 —
  # 설계 원칙 2("검사 대상 0건 = 실패")를 이 스크립트 자신이 위반하고 있었다.
  # 그래서 ① 문서 ID도 잡고 ② 미체크 항목이 있는데 추출이 0건이면 실패시킨다.
  PENDING_PATHS="$(grep -oE 'docs/[^ *`]+\.md' "$PENDING" 2>/dev/null | sort -u)"
  PENDING_IDS="$(grep -E '^- \[ \]' "$PENDING" 2>/dev/null | grep -oE '`[0-9]{2}-[0-9]{2}`' | tr -d '`' | sort -u)"
  # 미체크(`- [ ]`) 항목 수 — 이게 0이 아닌데 위 둘이 다 비면 파서가 깨진 것이다.
  N_OPEN=$(grep -cE '^- \[ \]' "$PENDING" 2>/dev/null || true)
  if [ -z "$PENDING_PATHS" ] && [ -z "$PENDING_IDS" ]; then
    if [ "$N_OPEN" -gt 0 ]; then
      fail "대기 ${N_OPEN}건이 있는데 참조를 하나도 추출하지 못함 — 파서가 표기 형식을 못 따라감(조용한 통과 방지)"
    else
      ok "대기 중인 항목 없음"
    fi
  else
    PENDING_PATHS="$(printf '%s\n%s\n' "$PENDING_PATHS" "$PENDING_IDS" | grep -v '^$' | sort -u)"
    CONFLICT=0
    NEXT_TASK="$(sed -n '/^## .*다음 할 일/,/^## /p' "$CTXF" 2>/dev/null | grep -v '^<!--')"
    while IFS= read -r p; do
      [ -z "$p" ] && continue
      if printf '%s' "$NEXT_TASK" | grep -qF "$p"; then
        fail "\"다음 할 일\"이 승인 대기 중인 $p 를 직접 가리킴 — 사람 승인 없이 착수 위험"
        CONFLICT=1
      fi
    done <<< "$PENDING_PATHS"
    # context.md가 pending-approvals.md를 아예 언급하지 않으면 그것도 위험(참조 자체가 끊김)
    if ! grep -q 'pending-approvals' "$CTXF" 2>/dev/null; then
      fail "context.md가 pending-approvals.md를 전혀 참조하지 않음 — 승인 대기 상태를 놓치기 쉬움"
      CONFLICT=1
    fi
    [ "$CONFLICT" -eq 0 ] && ok "충돌 없음, context.md가 pending-approvals.md 참조 중"
  fi
else
  fail "pending-approvals.md 없음"
fi
echo

# ── 6. context.md 신선도 (최근 일지 대비) ────────────────────────
echo "6. context.md 신선도"
CTX="$HARNESS/memory/context.md"
LOGDIR="$ROOT/docs/작업일지_및_기록"
CHECKS=$((CHECKS + 1))
if [ -f "$CTX" ] && [ -d "$LOGDIR" ]; then
  NEWEST="$(find "$LOGDIR" -maxdepth 1 -name '*.md' -printf '%T@ %p\n' 2>/dev/null | sort -rn | head -1 | cut -d' ' -f2-)"
  if [ -n "$NEWEST" ]; then
    CTX_T=$(stat -c %Y "$CTX" 2>/dev/null || echo 0)
    LOG_T=$(stat -c %Y "$NEWEST" 2>/dev/null || echo 0)
    GAP=$(( (LOG_T - CTX_T) / 86400 ))
    if [ "$GAP" -gt 3 ]; then
      fail "context.md가 최신 일지(${NEWEST##*/})보다 ${GAP}일 뒤처짐 — 갱신 필요"
    else
      ok "최신 일지 대비 정상"
    fi
  else
    note "일지 없음"
  fi
else
  fail "context.md 또는 일지 폴더 없음"
fi
echo

# ── 7. 위키링크 무결성 ───────────────────────────────────────────
echo "7. [[위키링크]] 무결성"
# 🔴 2026-08-25 — 이 검사는 **현재 아무것도 검사하지 않는다.** 레포 전체에 실제 `[[링크]]`가
# 0개다(쓰이는 곳은 이 스크립트와 README의 설명문뿐이고, gbrain-doctor는 코드스팬을 걷어내므로
# 그것도 안 잡힌다). 그런데도 "점검 링크 0개 / 깨진 링크 0개 → ✅"가 🟢로 집계돼 **140건 중
# 3건 문제**의 분모를 부풀리고 있었다 — 설계 원칙 2가 금지한 "조용한 통과"다.
#   영구 빨간불로 만들지는 않는다. 위키링크를 안 쓰는 것은 고장이 아니라 선택이고, 고칠 수 없는
#   빨간불은 "빨간불 무시" 습관을 만들어 doctor 전체의 신뢰를 깎는다(§8 BASELINE 주석과 같은 이유).
#   대신 **🟢로 세지 않고 ⚪로 내려** 검사가 놀고 있다는 사실이 보이게 한다.
#   → 위키링크를 실제로 도입하면 이 분기는 저절로 사라진다.
if [ -x "$HARNESS/tools/gbrain-doctor.sh" ] || [ -f "$HARNESS/tools/gbrain-doctor.sh" ]; then
  if OUT="$(bash "$HARNESS/tools/gbrain-doctor.sh" 2>&1)"; then
    LINKN="$(printf '%s' "$OUT" | grep -oE '점검 링크 [0-9]+' | grep -oE '[0-9]+' || echo 0)"
    if [ "${LINKN:-0}" -eq 0 ]; then
      note "점검 대상 [[링크]] 0개 — 이 프로젝트는 위키링크를 쓰지 않는다. 검사 유휴(합격으로 세지 않음)"
      CHECKS=$((CHECKS - 1))  # 아래에서 +1 되므로 상쇄 — 놀고 있는 검사를 항목 수에 넣지 않는다
    else
      ok "$(printf '%s' "$OUT" | grep -E '점검 링크')"
    fi
  else
    printf '%s\n' "$OUT" | grep '❌' | while IFS= read -r l; do red "  $l"; done
    fail "깨진 위키링크 있음"
  fi
  CHECKS=$((CHECKS + 1))
else
  note "gbrain-doctor.sh 없음 — 스킵"
fi
echo

# ── 8. 검증 게이트 판정 분포 ─────────────────────────────────────
# 설계 원칙 2("검사 대상 0건 = 실패")의 게이트판. 판정이 100% ✅통과면 게이트가
# 검사를 하고 있다는 증거가 없다 — 통과만 찍는 게이트는 없는 게이트와 구별되지 않는다.
# 2026-08-14 계기: 20건 판정 중 ❌반려 0건, 🔄스펙갱신 0건. Gemini가 walkthrough 문장을
# 되풀이할 뿐 독립 확인을 못 하는 구조였다(→ GEMINI.md "검증 범위" 개정).
echo "8. 검증 게이트 판정 분포"
WT="$ROOT/docs/작업일지_및_기록/에이전트_기록/walkthrough.md"
if [ -f "$WT" ]; then
  # ⚠️ **이모지로 세지 않는다.** 이 환경(Git Bash)의 grep은 `🔄`(U+1F504, 4바이트)를 매칭하지
  # 못한다 — `✅`(U+2705, 3바이트)는 되는데 4바이트 문자에서 조용히 0을 낸다. 2026-08-14에
  # 실제로 스펙갱신 판정을 기록했는데도 카운터가 0으로 남는 버그가 났다.
  # **판정을 남겨도 숫자가 안 움직이면 이 검사는 조용히 죽는다** — 그래서 한글 단어로 센다.
  #
  # 표본 크기는 "항목 수 − 판정 대기 수"로 잡는다. 판정 표기가 `<!-- Gemini 판정 … -->`와
  # `- **판정**: …` 두 형식으로 섞여 있어 판정 줄을 직접 세면 항목당 여러 줄이 잡히기 때문.
  TOTAL_ITEMS=$(grep -c '^## 20' "$WT" 2>/dev/null || true)
  # 🔴 2026-08-24 수정 — `'판정 대기'`만 세고 있었다. 그런데 `record.md` §1의 고정 양식이 내는
  # 문자열은 `<!-- Gemini 판정 1줄: ... -->`이라 **"판정 대기"를 한 번도 만들지 않는다.**
  # 그래서 미판정 항목이 전부 분모(N_JUDGED)에 판정 완료로 섞여 들어갔다(실측 당시 미판정 7건이
  # 대기 1건으로 보고됨). 위 251~254줄이 경고한 것과 **정반대 방향의 같은 사고**다 —
  # 그쪽은 "판정을 남겨도 숫자가 안 움직임", 이쪽은 "판정을 안 남겼는데 숫자가 올라감".
  # 분모가 부풀면 아래 "개정 이후 전부 통과 = 게이트 작동 증거 없음" 검사가 덜 발화한다.
  # 빈 칸은 Gemini가 판정 시 `- **판정**: …` 줄로 교체하므로 이중 계수되지 않는다.
  N_WAITING=$(grep -cE '판정 대기|<!-- Gemini 판정' "$WT" 2>/dev/null || true)
  N_JUDGED=$((TOTAL_ITEMS - N_WAITING))
  [ "$N_JUDGED" -lt 0 ] && N_JUDGED=0
  # 반려·스펙갱신은 판정 줄에 한해 단어로 센다(본문 서술의 같은 단어를 세지 않기 위해).
  # `통과`가 든 줄은 제외한다 — 판정은 셋 중 하나이므로 통과 줄에 나온 "반려"는 판정이 아니라
  # 서술이다(실제 오검출: *"클레임 반려 status=REJECTED 유지"* 를 통과 판정문이 포함하고 있었다).
  # 이 제외 때문에 "빌드는 통과했으나 반려" 같은 줄을 놓칠 수 있으나, 그 방향의 오차는
  # 플래그를 **적게** 세어 검사가 더 쉽게 발화하므로 안전한 쪽이다.
  N_FLAGS=$(grep '판정' "$WT" 2>/dev/null | grep -v '통과' | grep -cE '스펙갱신|반려' || true)
  # 기준선: 2026-08-14 규칙 개정 시점의 판정 누적. 그 이전 판정은 구 규칙(코드 열람 금지)
  # 아래에서 내려진 것이라 **구조상 실패가 불가능했다** — 고칠 수 없는 값을 영구 빨간불로
  # 띄우면 "빨간불 무시" 습관이 생겨 doctor 전체의 신뢰도가 깎인다. 개정 이후분만 평가한다.
  # 이 숫자는 올리지 않는다. 올리는 순간 이 검사는 무력화된다.
  BASELINE=40
  NEW_JUDGED=$((N_JUDGED - BASELINE))
  [ "$NEW_JUDGED" -lt 0 ] && NEW_JUDGED=0
  NEW_FLAGS=$N_FLAGS
  if [ "$N_JUDGED" -eq 0 ]; then
    note "판정 이력 없음 — 스킵"
  else
    gray "     판정 ${N_JUDGED}건 / 대기 ${N_WAITING}건 · 반려·스펙갱신 ${N_FLAGS}건 · 개정 이후 ${NEW_JUDGED}건"
    # 10건은 "우연히 전부 완벽"이 설명 가능한 상한선으로 잡은 값이다.
    if [ "$NEW_JUDGED" -ge 10 ] && [ "$NEW_FLAGS" -eq 0 ]; then
      fail "개정 이후 판정 ${NEW_JUDGED}건이 전부 ✅통과 — 게이트 작동 증거 없음(→ GEMINI.md '검증 범위')"
    elif [ "$NEW_JUDGED" -lt 10 ]; then
      note "개정 이후 표본 ${NEW_JUDGED}건 — 10건부터 편중 판정(반려·스펙갱신 0건이면 실패)"
    else
      ok "판정 분포 정상 (개정 이후 반려·스펙갱신 ${NEW_FLAGS}건)"
    fi
  fi
  CHECKS=$((CHECKS + 1))
else
  note "walkthrough.md 없음 — 스킵"
fi
echo

echo "9. DB 명세서(00-05) ↔ schema.prisma 동기화"
# 2026-08-21 신설. 00-05는 generate-db-doc.js가 schema.prisma 주석에서 만드는 파생물인데,
# **사람이 손으로 돌려야 한다.** done.md 체크리스트를 추가한 바로 다음 커밋에서 또 놓쳤다
# (`5888289` — closedAt 주석만 고쳐 마이그레이션이 없었고, 그래서 "DB를 건드렸다"는 자각이 없었다).
# 체크리스트는 자각한 사람만 체크한다. 그래서 기계가 본다.
GEN="$ROOT/.harness/tools/generate-db-doc.js"
if [ -f "$GEN" ] && command -v node >/dev/null 2>&1; then
  if node "$GEN" --check >/dev/null 2>&1; then
    ok "00-05가 schema.prisma와 동기화됨"
  else
    fail "00-05가 낡음 — \`node .harness/tools/generate-db-doc.js\` 실행 필요(스키마를 고치고 안 돌린 것)"
  fi
  CHECKS=$((CHECKS + 1))
else
  note "node 또는 generate-db-doc.js 없음 — 스킵"
fi
echo

# ── 10. 소유권 교차 오염 (작업 트리) ─────────────────────────────
# 왜 있나: `docs/`는 Opus, `eobom/`은 Sonnet 소유인데 **훅도 퍼미션도 둘을 구분하지 못한다**
#   (roles.md §1-1). 2026-08-25에 Opus가 eobom/에 코드를 써서 전량 revert한 사고가 있었고,
#   그 위반의 모양이 정확히 **"한 작업 트리에 스펙 변경과 구현 변경이 같이 있는 것"** 이었다.
#   누가 썼는지는 알 수 없으니 **사람에게 되묻는 것**까지가 이 검사의 역할이다.
#
# 🔴 왜 fail이 아니라 warn인가: 한 세션에 Opus→Sonnet 전환이 있으면 **정상인데도 걸린다.**
#   fail로 두면 정상 세션이 빨간불을 달고 다니게 되고, 그러면 빨간불 자체가 무시된다.
#
# 🔵 제외 대상은 실측으로 정했다(2026-08-27, 최근 60커밋).
#   제외 없이 재면 **10/60(17%)이 걸리는데, 걸린 10건이 전부 `docs/00_DOCS_INDEX.md` 하나**였다
#   — Opus의 인덱스 갱신이 Sonnet 커밋에 묶여 들어간 것이지 위반이 아니다. 아래 2개를 빼면
#   같은 60커밋에서 **오탐 0건**이다. 오탐률이 높은 검사는 켜 두나 마나이므로 이 실측이 근거다.
#     · docs/작업일지_및_기록/ — walkthrough·claude_tasks·일지는 Sonnet이 **써야 한다**(done.md §1)
#     · docs/00_DOCS_INDEX.md  — 위 실측. ⚠️ 대신 Sonnet이 인덱스를 고쳐도 여기서는 안 잡힌다.
#   ⚠️ 제외를 늘리기 전에 위 실측을 다시 돌려볼 것. 근거 없이 빼면 검사가 비어 간다(설계 원칙 2).
echo "10. 소유권 교차 오염 — 스펙(docs/)과 구현(eobom/)이 한 작업 트리에 섞였나"
CHECKS=$((CHECKS + 1))
if ! git -C "$ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  # 설계 원칙 2 — 검사가 조용히 비활성화되는 것이 제일 위험하다. 스킵이 아니라 실패로 잡는다.
  fail "git 저장소가 아니라 소유권 검사를 돌릴 수 없다"
else
  # 🔴 core.quotepath=false 없으면 한글 경로가 "\355\225\234..."로 이스케이프돼 grep이 전부 빗나간다.
  # 🔴 cut -c4- 로 XY 상태코드를 떼고, 리네임("old -> new")은 뒤쪽 경로만 본다.
  OWN_CHANGED=$(git -C "$ROOT" -c core.quotepath=false status --porcelain 2>/dev/null \
                | cut -c4- | sed 's/.* -> //')
  OWN_SPEC=$(printf '%s\n' "$OWN_CHANGED" | grep '^docs/' \
             | grep -v '^docs/작업일지_및_기록/' | grep -v '^docs/00_DOCS_INDEX\.md$' || true)
  OWN_CODE=$(printf '%s\n' "$OWN_CHANGED" | grep '^eobom/' || true)
  if [ -n "$OWN_SPEC" ] && [ -n "$OWN_CODE" ]; then
    warn "스펙 $(printf '%s\n' "$OWN_SPEC" | wc -l | tr -d ' ')개 + 구현 $(printf '%s\n' "$OWN_CODE" | wc -l | tr -d ' ')개가 함께 열려 있다 — 모드 전환이 있었나?"
    printf '%s\n' "$OWN_SPEC" | head -3 | sed 's/^/       docs  · /'
    printf '%s\n' "$OWN_CODE" | head -3 | sed 's/^/       eobom · /'
    gray "       한 사람이 둘 다 고쳤다면 소유권 위반이다(roles.md §1-1). 아니면 커밋을 나눌 것."
  elif [ -n "$OWN_SPEC" ]; then
    ok "스펙만 열려 있음 — Opus 작업"
  elif [ -n "$OWN_CODE" ]; then
    ok "구현만 열려 있음 — Sonnet 작업"
  else
    ok "작업 트리에 스펙·구현 변경 없음"
  fi
fi
echo

# ── 11. 고아 md — 아무데서도 가리키지 않는 문서 ──────────────────
# 왜 있나: 2026-08-28 md 전수 점검에서 루트 `copy.md`(15.6KB)와 `image-prompts.md`(39KB)가
#   나왔다. copy.md는 **`HomePage.tsx`가 주석으로 참조하는 살아있는 정본**인데 `docs/` 밖에
#   있어 인덱스에도, 스펙 개정 절차에도 안 걸려 있었다(AGENTS.md §7). 아무도 안 재니까
#   몇 주를 그대로 있었다 — §9가 말하는 조용한 통과다.
#
# 판정 기준은 **도달 가능성**이다. 인덱스(`00_DOCS_INDEX.md`)에 실려 있으면 통과 — 인덱스가
#   문서의 정식 입구이기 때문. 그 외에는 다른 md나 `eobom/` 소스가 이름을 부르면 통과.
#   🔴 자기 자신은 참조로 안 친다(파일 안의 편입 메모가 자기 이름을 부른다).
#
# 참조 키: 앞자리가 `NN-NN`이면 **그 ID**로 찾는다. 문서끼리는 경로가 아니라 `07-04`처럼
#   ID로 인용하기 때문이다. ID가 없는 하네스 md는 파일명으로 찾는다.
#
# 제외 — 참조가 없는 게 **정상인** 것들. 늘리기 전에 "정말 아무도 안 찾아도 되나"를 볼 것.
#   · docs/작업일지_및_기록/ — 날짜 일지는 추가만 하고 서로 안 부른다
#   · .harness/_meta/         — 폐기된 검토안 아카이브(현행 규칙이 부르면 오히려 이상하다)
echo "11. 고아 md — 인덱스에도 없고 아무도 참조하지 않는 문서"
CHECKS=$((CHECKS + 1))
if ! git -C "$ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  fail "git 저장소가 아니라 고아 md 검사를 돌릴 수 없다"
else
  # 🔴 core.quotepath=false 없으면 한글 경로가 "\355\225\234..."로 이스케이프돼
  #    `*.md` 매칭이 전부 빗나간다(2026-08-28: 117개 중 32개만 잡혔다).
  ALL_MD=$(git -C "$ROOT" -c core.quotepath=false ls-files -- '*.md' \
           | grep -v '^docs/작업일지_및_기록/' \
           | grep -v '^\.harness/_meta/' || true)
  # 참조가 있을 수 있는 곳 전부 — md 전체(일지·아카이브 포함) + 소스 주석
  REF_SRC=$(git -C "$ROOT" -c core.quotepath=false ls-files \
            -- '*.md' '*.ts' '*.tsx' '*.js' '*.jsx' '*.json' 2>/dev/null || true)
  MD_COUNT=$(printf '%s\n' "$ALL_MD" | grep -c . || true)
  if [ "$MD_COUNT" -lt 20 ]; then
    # 설계 원칙 2 — 경로가 바뀌어 대상이 사라지면 초록불이 아니라 빨간불이어야 한다.
    fail "검사 대상 md가 ${MD_COUNT}개뿐 — ls-files 패턴이 깨졌다(정상은 100개 이상)"
  else
    # 🔵 파일마다 전수 grep을 돌면 90회 × 500파일 = 45초가 걸렸다(2026-08-28 실측).
    #    키 전부를 `grep -oHF -f`에 한 번에 물려 **말뭉치를 1회만 훑는다.** 결과는 `경로:키`.
    ORPHANS=""
    TMPD=$(mktemp -d) || TMPD=""
    if [ -z "$TMPD" ]; then
      fail "임시 디렉토리를 만들 수 없어 고아 md 검사를 건너뜀"
    else
      trap 'rm -rf "$TMPD"' EXIT
      # 소유 관계: "키<TAB>그 키를 가진 파일". 같은 basename이 여러 곳에 있을 수 있어 1:N이다.
      printf '%s\n' "$ALL_MD" | while IFS= read -r f; do
        [ -n "$f" ] || continue
        base="${f##*/}"
        case "$base" in
          [0-9][0-9]-[0-9][0-9]_*) printf '%s\t%s\n' "${base%%_*}" "$f" ;;  # 00-31_랜딩...md → 00-31
          *)                       printf '%s\t%s\n' "$base" "$f"       ;;  # roles.md → roles.md
        esac
      done > "$TMPD/own"
      cut -f1 "$TMPD/own" | sort -u > "$TMPD/keys"
      printf '%s\n' "$REF_SRC" | grep . \
        | (cd "$ROOT" && xargs -d '\n' grep -oHF -f "$TMPD/keys" -- 2>/dev/null) \
        | sort -u > "$TMPD/hits"
      # 자기 파일 안에서 자기 키를 부른 건 참조가 아니다(편입 메모가 제 이름을 적는다).
      ORPHANS=$(awk -F'\t' '
        NR==FNR { own[$1 SUBSEP $2] = 1; files[$1] = files[$1] "\n" $2; next }
        { i = index($0, ":"); p = substr($0, 1, i-1); k = substr($0, i+1)
          if (!((k SUBSEP p) in own)) ref[k] = 1 }
        END { for (k in files) if (!(k in ref)) { n = split(files[k], a, "\n")
                for (j = 1; j <= n; j++) if (a[j] != "") print a[j] } }
      ' "$TMPD/own" "$TMPD/hits" | sort)
    fi

    ORPHAN_N=$(printf '%s' "$ORPHANS" | grep -c . || true)
    if [ "$ORPHAN_N" -eq 0 ]; then
      ok "md ${MD_COUNT}개 전부 도달 가능"
    else
      fail "고아 md ${ORPHAN_N}건 — 인덱스에 올리거나, 쓸모가 없으면 지울 것"
      printf '%s' "$ORPHANS" | grep . | head -10 | sed 's/^/       · /'
      gray "       docs/면 00_DOCS_INDEX.md에 한 줄 추가가 정답이다(.harness/CLAUDE.md Opus §1)."
    fi
  fi
fi
echo

# ── 결과 ─────────────────────────────────────────────────────────
echo "─────────────────────────────────────"
if [ "$CHECKS" -eq 0 ]; then
  red "❌ 검사 항목이 0건입니다 — 스크립트 설정 오류 (조용한 통과 방지 규칙에 의해 실패 처리)"
  exit 1
fi
if [ "$ISSUES" -eq 0 ]; then
  green "✅ 이상 없음 — ${CHECKS}개 항목 검사 통과"
  exit 0
else
  red "⚠️  ${CHECKS}개 항목 중 ${ISSUES}건 문제 발견 — 위 🔴 항목을 고칠 것"
  exit 1
fi
