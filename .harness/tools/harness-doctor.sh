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

red()   { printf '\033[31m%s\033[0m\n' "$1"; }
green() { printf '\033[32m%s\033[0m\n' "$1"; }
gray()  { printf '\033[90m%s\033[0m\n' "$1"; }

fail() { red "  🔴 $1"; ISSUES=$((ISSUES + 1)); }
ok()   { green "  🟢 $1"; }
note() { gray "  ⚪ $1"; }

# 줄바꿈을 LF로 정규화해서 잰다. Windows에서 git이 체크아웃하며 CRLF로 바꾸면 줄 수만큼
# 바이트가 늘어, 내용이 그대로인데도 예산을 넘긴다(2026-08-14: 브랜치 병합 직후 roles.md가
# 109B 초과 — 정확히 줄 수만큼이었다). 예산이 재려는 건 **에이전트가 읽는 내용의 양**이지
# 줄바꿈 표현 방식이 아니다. 여기서 내용을 깎으면 있지도 않은 초과분과 싸우게 된다.
size_of() { [ -f "$1" ] && tr -d '\r' < "$1" | wc -c | tr -d ' ' || echo 0; }

echo "=== 하네스 점검 (root: $ROOT) ==="
echo

# ── 1. 부팅 파일 존재 + 용량 예산 ────────────────────────────────
echo "1. 부팅 파일 (매 세션 로드, 합계 ≤ 15KB)"
# 🔴 루트 CLAUDE.md가 목록 맨 앞인 이유: .harness/ 안의 3개는 에이전트가 자발적으로 읽어야만
# 로드되지만, 루트 CLAUDE.md는 **CLI가 매 세션 자동으로** 밀어 넣는다. 즉 실제 부팅 비용은
# 항상 여기부터 발생한다. 예산에서 빼면 "재고 있는데 안 세는" 항목이 생긴다(설계 원칙 2).
# (2026-08-25 신설 — 소유권 규칙이 .harness/에만 있어 세션에 로드되지 않았고, Opus가 eobom/에
#  코드를 쓴 사고가 있었다. 자동 로드되는 자리에 규칙을 두는 것이 이 파일의 존재 이유다.)
BOOT_TOTAL=0
for f in "$ROOT/CLAUDE.md" "$HARNESS/AGENTS.md" "$HARNESS/memory/context.md" "$HARNESS/memory/pending-approvals.md"; do
  CHECKS=$((CHECKS + 1))
  if [ ! -f "$f" ]; then
    fail "없음: ${f#$ROOT/}"
    continue
  fi
  sz=$(size_of "$f")
  BOOT_TOTAL=$((BOOT_TOTAL + sz))
  echo "     ${f#$ROOT/} — $((sz / 1024))KB (${sz}B)"
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
if [ "$BOOT_TOTAL" -gt 15360 ]; then
  fail "부팅 합계 $((BOOT_TOTAL / 1024))KB > 15KB 예산 초과 — 다이어트 필요"
else
  ok "부팅 합계 $((BOOT_TOTAL / 1024))KB (예산 15KB 이내)"
fi

# 🔴 2026-08-25 신설 — context.md는 자기 머리말에 **"3KB 초과 금지"** 를 스스로 적어 두고도
# 11,272B(3.7배)까지 불어 있었다. **아무도 재지 않는 규칙은 규칙이 아니다.** 합계만 보면
# 어느 파일이 예산을 먹었는지 안 보여서 "다 같이 조금씩 넘쳤다"로 읽히는데, 실제로는
# 이 파일 하나가 부팅 예산 11KB를 통째로 쓰고 있었다. 범인을 지목해야 다이어트가 시작된다.
CHECKS=$((CHECKS + 1))
CTX_SZ=$(size_of "$HARNESS/memory/context.md")
if [ "$CTX_SZ" -gt 3072 ]; then
  fail "context.md ${CTX_SZ}B > 3KB — 자기 머리말이 정한 상한의 $((CTX_SZ * 10 / 3072))/10배. 끝난 항목은 walkthrough.md로 옮길 것"
else
  ok "context.md $((CTX_SZ))B (자체 상한 3KB 이내)"
fi
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
for f in roles.md security.md done.md systems.md record.md db-safety.md memory/backlog.md; do
  CHECKS=$((CHECKS + 1))
  # 2026-08-26 예산 정정 — roles.md 8→10KB · systems.md 6→12KB. AGENTS.md §9 순서대로
  # **내용부터 봤고, 옮길 곳이 없어서** 올렸다. 근거는 "6KB = 단일 주제"라는 위 전제가
  # 이 두 파일엔 처음부터 맞지 않았다는 것이다:
  #   · systems.md = 인증·지도·공공데이터·DB·배포·미구현 **6개 절의 명부**다(조건부 로드 표도
  #     다섯 주제를 이 파일 하나로 보낸다). 쪼개면 표가 5줄로 늘고 동기화 대상이 5개가 돼
  #     오히려 나빠진다 — 명부는 한 파일일 때 값어치가 있다.
  #   · roles.md = 태그표·소유권표 2개·파이프라인·편차 프로토콜·핸드오프 5주제. 2026-08-25에
  #     Opus/Sonnet 소유권 분리(사고 재발 방지)가 들어가며 더 늘었고, 그건 뺄 수 없는 내용이다.
  # ⚠️ 그래도 상한이다. 다음에 닿으면 올리기 전에 무엇을 어디로 옮겼는지 여기 먼저 적을 것.
  case "$f" in
    roles.md)         budget=10240 ;;
    systems.md)       budget=12288 ;;
    *)                budget=6144 ;;
  esac
  if [ -f "$HARNESS/$f" ]; then
    sz=$(size_of "$HARNESS/$f")
    if [ "$sz" -gt "$budget" ]; then
      fail "$f — ${sz}B > $((budget / 1024))KB 예산 초과"
    else
      ok "$f ($((sz / 1024))KB / $((budget / 1024))KB)"
    fi
  else
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
