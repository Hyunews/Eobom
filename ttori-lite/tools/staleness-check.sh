#!/usr/bin/env bash
#
# tools/staleness-check.sh — 프로젝트 인수인계 문서 vs 실제 코드 최신성 대조
#
# 순수 로컬 스크립트 (AI 미사용, T1/T2/T3 정책과 무관 — 결정론적 날짜 비교만).
# projects/<name>/ 아래 인수인계 문서에 적힌 "최종갱신" 날짜와, 그 문서가 가리키는
# 실제 코드 레포의 마지막 커밋 날짜를 비교해 격차가 크면 경고한다.
#
# 사용법: tools/staleness-check.sh [임계일수(기본 7)]

set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECTS_DIR="$ROOT/projects"
THRESHOLD_DAYS="${1:-7}"

to_epoch() {
  date -j -f "%Y-%m-%d" "$1" +%s 2>/dev/null || date -d "$1" +%s 2>/dev/null || echo ""
}

if [ ! -d "$PROJECTS_DIR" ]; then
  echo "projects/ 없음 — 확인할 프로젝트가 없습니다."
  exit 0
fi

any_checked=0

for dir in "$PROJECTS_DIR"/*/; do
  [ -d "$dir" ] || continue
  name="$(basename "$dir")"

  # 인수인계/컨텍스트 문서 후보 (우선순위 순)
  doc=""
  for pattern in "*인수인계*.md" "context.md" "docs/*인수인계*.md" "*.md"; do
    match="$(find "$dir" -maxdepth 2 -iname "$pattern" 2>/dev/null | head -1)"
    if [ -n "$match" ]; then doc="$match"; break; fi
  done
  [ -z "$doc" ] && continue

  # 문서에 적힌 최신 날짜 (YYYY-MM-DD 패턴 중 가장 최근 것)
  doc_date="$(grep -oE '[0-9]{4}-[0-9]{2}-[0-9]{2}' "$doc" 2>/dev/null | sort -r | head -1)"
  [ -z "$doc_date" ] && { echo "⚪ $name — 문서에서 날짜를 못 찾음 ($doc)"; continue; }

  # 실코드 절대경로 ("코드 경로" 라벨 뒤 백틱 경로) — 인수인계 문서가 아니라
  # 같은 프로젝트 폴더의 다른 .md(예: FMS.md)에 적혀있을 수 있어 폴더 전체를 훑는다.
  code_path="$(grep -rhoE '(코드 ?경로|실코드 ?경로)[^\`]*\`[^\`]+\`' "$dir" --include="*.md" 2>/dev/null | grep -oE '\`[^\`]+\`' | tr -d '\`' | head -1)"

  if [ -z "$code_path" ] || [ ! -d "$code_path/.git" ]; then
    echo "⚪ $name — 로컬 git 레포 아님(서버 SSOT 등), 스킵"
    continue
  fi

  repo_date="$(git -C "$code_path" log -1 --format=%cd --date=short 2>/dev/null)"
  [ -z "$repo_date" ] && { echo "⚪ $name — git 로그 조회 실패"; continue; }

  any_checked=1
  doc_epoch="$(to_epoch "$doc_date")"
  repo_epoch="$(to_epoch "$repo_date")"
  if [ -z "$doc_epoch" ] || [ -z "$repo_epoch" ]; then
    echo "⚪ $name — 날짜 파싱 실패 (문서:$doc_date / 코드:$repo_date)"
    continue
  fi

  gap_days=$(( (repo_epoch - doc_epoch) / 86400 ))

  # 문서가 코드보다 최신이거나 같은 건 정상(코드 변경 없이 문서만 갱신한 경우 포함).
  # 문제는 오직 "코드는 계속 움직였는데 문서가 못 따라간" 방향(코드 > 문서)뿐.
  if [ "$gap_days" -gt "$THRESHOLD_DAYS" ]; then
    echo "🔴 $name — 문서 $doc_date / 코드 최종커밋 $repo_date (${gap_days}일 차이, 임계 ${THRESHOLD_DAYS}일 초과) — 갱신 필요"
  else
    echo "🟢 $name — 문서 $doc_date / 코드 $repo_date (정상)"
  fi
done

if [ "$any_checked" -eq 0 ]; then
  echo "확인 가능한 프로젝트 없음 (로컬 git 레포 연결 안 됨)."
fi
exit 0
