# restore-db.ps1 — 백업 파일을 **원래 DB에 붓는다** (db-safety.md §8-3 ④ · §8-4 ⑤)
#
# 🔴 대상 DB를 통째로 덮는다(--clean). 백업 뒤에 쓰인 데이터는 사라진다. 사람만 친다 — 에이전트가 돌리지 않는다.
# 🔴 붓기 전 순서(§8-1·§8-4): 사람 승인 → (운영) Render 일시 중지 → backup-db.ps1 로 지금 상태 백업 →
#    backup-verify.bat 으로 그 파일이 풀리는지 확인. 이 스크립트는 백업을 대신 해주지 않는다.
# 🔴 로컬은 백엔드를 끈 상태에서. 운영은 public 스키마만(-n public --no-owner --no-privileges) 되돌린다.
# 🔴 파일 이름 접두사가 -Target 과 다르면 실패한다(prod- 파일을 로컬에, local- 파일을 운영에 붓는 사고 방지).
# 🔴 마지막에 대상 이름(LOCAL / PROD)을 직접 쳐야 진행한다.
#
# 사용법:  powershell -File .harness/tools/restore-db.ps1 -Target local -File eobomDev/backend/backups/local-YYYYMMDD-HHMMSS.dump
#          powershell -File .harness/tools/restore-db.ps1 -Target prod  -File eobomDev/backend/backups/prod-YYYYMMDD-HHMMSS.dump
# 종료코드: 0 = 성공, 1 = 실패·취소

param(
  # 🔴 기본값 없음 — 지금 덮을 DB를 사람이 정한다.
  [string]$Target = '',
  [string]$File = '',
  [int]$PgVersion = 17
)

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = New-Object System.Text.UTF8Encoding($false)

. (Join-Path $PSScriptRoot 'db-url.ps1')

if (($Target -cne 'local' -and $Target -cne 'prod') -or [string]::IsNullOrWhiteSpace($File)) {
  Write-Host "[X] -Target 과 -File 이 모두 필요합니다 — 받은 값: Target='$Target', File='$File'" -ForegroundColor Red
  Write-Host "    powershell -File .harness/tools/restore-db.ps1 -Target local -File eobomDev/backend/backups/local-YYYYMMDD-HHMMSS.dump" -ForegroundColor Yellow
  Write-Host "    powershell -File .harness/tools/restore-db.ps1 -Target prod  -File eobomDev/backend/backups/prod-YYYYMMDD-HHMMSS.dump" -ForegroundColor Yellow
  exit 1
}

$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$path = if ([System.IO.Path]::IsPathRooted($File)) { $File } else { Join-Path (Get-Location) $File }
if (-not (Test-Path $path)) { $alt = Join-Path $root $File; if (Test-Path $alt) { $path = $alt } }
if (-not (Test-Path $path)) { Write-Host "[X] 파일이 없습니다: $File" -ForegroundColor Red; exit 1 }
$path = (Resolve-Path $path).Path
$name = Split-Path -Leaf $path

# 접두사 검사 — 이름으로 대상을 다시 본다(§8-1 원칙 3)
if (-not $name.StartsWith("$Target-")) {
  Write-Host "[X] 파일 이름('$name')이 -Target $Target 과 맞지 않습니다 — '$Target-' 로 시작해야 합니다." -ForegroundColor Red
  exit 1
}
if ((Get-Item $path).Length -lt 1024) { Write-Host "[X] 파일이 비정상적으로 작습니다." -ForegroundColor Red; exit 1 }

$url = $null
if ($Target -eq 'local') {
  $container = 'eobom-postgres'
  $running = (& docker ps --filter "name=^${container}$" --format '{{.Names}}') 2>$null
  if ($running -ne $container) { Write-Host "[X] 컨테이너 '$container' 가 실행 중이 아닙니다." -ForegroundColor Red; exit 1 }
  $where = "LOCAL — Docker $container (5433)"
} else {
  $url = Get-ProdUrl (Join-Path $root 'eobomDev\backend\.env')
  if (-not $url) { exit 1 }
  $where = "PROD — " + ([regex]::Match($url, '@([^/?]+)')).Groups[1].Value + " (public 스키마만)"
}

Write-Host ''
Write-Host '==================================================' -ForegroundColor Red
Write-Host "  🔴 복구 — 대상 DB를 덮어씁니다" -ForegroundColor Red
Write-Host "  대상: $where" -ForegroundColor Red
Write-Host "  파일: $name  ($((Get-Item $path).LastWriteTime.ToString('yyyy-MM-dd HH:mm:ss')))" -ForegroundColor Red
Write-Host '  이 파일 이후에 쓰인 데이터는 사라집니다.' -ForegroundColor Red
Write-Host '  지금 상태 백업·(운영) Render 중지·(로컬) 백엔드 종료를 마쳤는지 확인하세요.' -ForegroundColor Red
Write-Host '==================================================' -ForegroundColor Red
$answer = Read-Host "계속하려면 대상 이름($($Target.ToUpper()))을 그대로 입력"
if ($answer -cne $Target.ToUpper()) { Write-Host '취소했습니다. 아무것도 바뀌지 않았습니다.'; exit 1 }

if ($Target -eq 'local') {
  & docker cp $path "${container}:/tmp/r.dump"
  if ($LASTEXITCODE -ne 0) { Write-Host '[X] docker cp 실패' -ForegroundColor Red; exit 1 }
  & docker exec $container sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner /tmp/r.dump'
  $rc = $LASTEXITCODE
  & docker exec $container rm -f /tmp/r.dump | Out-Null   # 개인정보 사본을 남기지 않는다
} else {
  $dir = Split-Path -Parent $path
  & docker run --rm -e "PGURL=$url" -v "${dir}:/backup:ro" "postgres:$PgVersion-alpine" `
    sh -c "pg_restore -d `"`$PGURL`" -n public --no-owner --no-privileges --clean --if-exists /backup/$name"
  $rc = $LASTEXITCODE
}

if ($rc -ne 0) {
  Write-Host "[X] pg_restore 가 오류로 끝났습니다 (exit $rc) — DB가 중간 상태일 수 있습니다. 위 메시지를 확인하고, 직전 백업으로 다시 붓는 것을 검토하세요." -ForegroundColor Red
  exit 1
}
Write-Host "[O] 복구 완료 — 대상: $($Target.ToUpper()), 파일: $name" -ForegroundColor Green
Write-Host '    다음: (운영) 백업 뒤 마이그레이션이 있었으면 migrate-prod.ps1 → Render 재개 → 로그인·주요 화면 확인 → 사고 기록(§6).'
exit 0
