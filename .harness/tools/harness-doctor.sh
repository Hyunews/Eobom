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

size_of() { [ -f "$1" ] && stat -c %s "$1" 2>/dev/null || echo 0; }

echo "=== 하네스 점검 (root: $ROOT) ==="
echo

# ── 1. 부팅 파일 존재 + 용량 예산 ────────────────────────────────
echo "1. 부팅 파일 (매 세션 로드, 합계 ≤ 11KB)"
BOOT_TOTAL=0
for f in "$HARNESS/AGENTS.md" "$HARNESS/memory/context.md"; do
  CHECKS=$((CHECKS + 1))
  if [ ! -f "$f" ]; then
    fail "없음: ${f#$ROOT/}"
    continue
  fi
  sz=$(size_of "$f")
  BOOT_TOTAL=$((BOOT_TOTAL + sz))
  echo "     ${f#$ROOT/} — $((sz / 1024))KB (${sz}B)"
done
if [ "$BOOT_TOTAL" -gt 11264 ]; then
  fail "부팅 합계 $((BOOT_TOTAL / 1024))KB > 11KB 예산 초과 — 다이어트 필요"
else
  ok "부팅 합계 $((BOOT_TOTAL / 1024))KB (예산 11KB 이내)"
fi
echo

# ── 2. 조건부 로드 파일 존재 ─────────────────────────────────────
# 예산 근거: 조건부 파일은 부팅과 달리 선택적으로만 읽히므로 상한이 덜 빡빡해도 된다.
# roles.md는 소유권표 2개 + 파이프라인 + 편차 프로토콜 + 기록 형식을 모두 담는
# 이 하네스의 중심 문서라 8KB를 준다. 나머지는 단일 주제라 6KB.
echo "2. 조건부 로드 파일"
for f in roles.md security.md done.md systems.md; do
  CHECKS=$((CHECKS + 1))
  case "$f" in
    roles.md) budget=8192 ;;
    *)        budget=6144 ;;
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
if [ -x "$HARNESS/tools/gbrain-doctor.sh" ] || [ -f "$HARNESS/tools/gbrain-doctor.sh" ]; then
  if OUT="$(bash "$HARNESS/tools/gbrain-doctor.sh" 2>&1)"; then
    ok "$(printf '%s' "$OUT" | grep -E '점검 링크' || echo '정상')"
  else
    printf '%s\n' "$OUT" | grep '❌' | while IFS= read -r l; do red "  $l"; done
    fail "깨진 위키링크 있음"
  fi
  CHECKS=$((CHECKS + 1))
else
  note "gbrain-doctor.sh 없음 — 스킵"
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
