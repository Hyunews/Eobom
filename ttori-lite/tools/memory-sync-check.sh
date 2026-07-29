#!/usr/bin/env bash
#
# tools/memory-sync-check.sh — memory/ 레이어 간 동기화 점검
#
# 순수 로컬 스크립트(AI 미사용). 결정론적으로 검사 가능한 2가지만 본다:
#   1. g-brain-map.md의 프로젝트 표가 실제 projects/ 폴더와 일치하는가
#   2. context.md가 최근 daily/ 작업일지보다 뒤처지지 않았는가
#
# (biz-ttori의 동명 스크립트에서 멀티에이전트 전용인 inbox/outbox 점검 섹션만 제외한 버전)
#
# 사용법: tools/memory-sync-check.sh [방치일수(기본 3)]

set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MEMORY_DIR="$ROOT/memory"
STALE_DAYS="${1:-3}"
TOTAL_ISSUES=0

echo "── 1. g-brain-map.md ↔ projects/ 폴더 ──"
SECTION_ISSUES=0
if [ -f "$MEMORY_DIR/g-brain-map.md" ] && [ -d "$ROOT/projects" ]; then
  MAPPED="$(grep -oE 'projects/[^/\`]+/' "$MEMORY_DIR/g-brain-map.md" | sed 's#projects/##; s#/##' | grep -v '[<>]' | sort -u)"
  ACTUAL="$(find "$ROOT/projects" -mindepth 1 -maxdepth 1 -type d -exec basename {} \; | grep -v '^_meta$' | sort -u)"

  while IFS= read -r proj; do
    [ -z "$proj" ] && continue
    if ! printf '%s\n' "$MAPPED" | grep -Fxq "$proj"; then
      echo "🔴 projects/$proj/ 폴더는 있는데 g-brain-map.md 표엔 없음"
      SECTION_ISSUES=$((SECTION_ISSUES + 1))
    fi
  done <<< "$ACTUAL"

  while IFS= read -r proj; do
    [ -z "$proj" ] && continue
    if [ ! -d "$ROOT/projects/$proj" ]; then
      echo "🔴 g-brain-map.md가 projects/$proj/를 가리키는데 실제 폴더 없음"
      SECTION_ISSUES=$((SECTION_ISSUES + 1))
    fi
  done <<< "$MAPPED"
else
  echo "⚪ g-brain-map.md 또는 projects/ 없음 — 스킵"
fi
[ "$SECTION_ISSUES" -eq 0 ] && echo "🟢 일치"
TOTAL_ISSUES=$((TOTAL_ISSUES + SECTION_ISSUES))

echo
echo "── 2. context.md ↔ 최근 daily/ 작업일지 ──"
SECTION_ISSUES=0
CONTEXT_FILE="$MEMORY_DIR/context.md"
if [ -f "$CONTEXT_FILE" ] && [ -d "$ROOT/daily" ]; then
  NEWEST_DAILY="$(find "$ROOT/daily" -type f -name '*.md' -exec stat -f "%m %N" {} \; 2>/dev/null \
    | sort -rn | head -1 | awk '{print $2}')"

  if [ -n "$NEWEST_DAILY" ]; then
    DAILY_EPOCH="$(stat -f "%m" "$NEWEST_DAILY" 2>/dev/null)"
    CONTEXT_EPOCH="$(stat -f "%m" "$CONTEXT_FILE" 2>/dev/null)"
    GAP_DAYS=$(( (DAILY_EPOCH - CONTEXT_EPOCH) / 86400 ))

    if [ "$GAP_DAYS" -gt "$STALE_DAYS" ]; then
      echo "🔴 context.md가 최신 일지(${NEWEST_DAILY#"$ROOT"/})보다 ${GAP_DAYS}일 뒤처짐 — '지금 상태' 갱신 필요"
      SECTION_ISSUES=$((SECTION_ISSUES + 1))
    fi
  fi
fi
[ "$SECTION_ISSUES" -eq 0 ] && echo "🟢 정상"
TOTAL_ISSUES=$((TOTAL_ISSUES + SECTION_ISSUES))

echo
echo "─────────────────────────"
if [ "$TOTAL_ISSUES" -eq 0 ]; then
  echo "✅ 메모리 레이어 동기화 이상 없음."
else
  echo "⚠️  총 ${TOTAL_ISSUES}건 발견 — 위 항목부터 확인/갱신할 것."
fi
exit 0
