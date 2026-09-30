# migrate-prod.ps1 — 운영(Supabase) DB 마이그레이션을 한 번에: 백업 → 대기 목록 → 사람 확인 → 적용 → 결과
#
# 🔴 사람이 직접 돌린다. 에이전트는 실행하지 않는다(db-safety.md §2-1 · AGENTS.md §1).
# 사용법(레포 루트에서):
#   powershell -File .harness/tools/migrate-prod.ps1
#
# 왜 이 스크립트인가(2026-09-30):
#   - 09-30부터 push해도 운영 DB 스키마는 안 바뀐다(start에서 migrate deploy를 뺐다).
#   - 그래서 "운영 백업 → 운영 migrate deploy" 를 사람이 해야 하는데, 명령·주소·순서를 매번 찾아야 했다.
#   - db-safety.md §7.1 "백업 없으면 안 도는 래퍼" — 백업이 실패하면 여기서 멈춘다.
#
# 순서 규칙(db-safety.md §2-1):
#   추가형(칸·테이블 추가)  : 이 스크립트 → 그다음 push
#   삭제형(칸·테이블 삭제)  : push 먼저 → 그다음 이 스크립트
#
# 운영 주소는 eobomDev/backend/.env 의 BACKUP_DATABASE_URL(Session pooler :5432)을 쓴다.
# 이 창의 환경변수에만 잠깐 넣고 끝나면 지운다 — .env 파일은 바꾸지 않는다.

$root    = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$backend = Join-Path $root 'eobomDev\backend'
$envFile = Join-Path $backend '.env'
$outDir  = Join-Path $backend 'backups'

function Fail([string]$msg) {
  Write-Host ''
  Write-Host "[X] $msg" -ForegroundColor Red
  Write-Host '    운영 DB는 바뀌지 않았습니다.' -ForegroundColor Yellow
  exit 1
}

# ─── 0. 운영 주소 읽기 ─────────────────────────────────────────────
if (-not (Test-Path $envFile)) { Fail ".env 없음: $envFile" }
$line = Select-String -Path $envFile -Pattern '^\s*BACKUP_DATABASE_URL\s*=' | Select-Object -First 1
if (-not $line) { Fail '.env에 BACKUP_DATABASE_URL 이 없습니다(운영 Session pooler 주소).' }
$url = ($line.Line -replace '^\s*BACKUP_DATABASE_URL\s*=', '').Trim().Trim('"').Trim("'")
if ([string]::IsNullOrWhiteSpace($url)) { Fail 'BACKUP_DATABASE_URL 값이 비었습니다.' }
if ($url -match '@(localhost|127\.0\.0\.1|host\.docker\.internal)') { Fail 'BACKUP_DATABASE_URL이 로컬 주소입니다 — 운영 주소가 아닙니다.' }
$hostShown = ([regex]::Match($url, '@([^/?]+)')).Groups[1].Value

Write-Host '=================================================='
Write-Host '  운영 DB 마이그레이션' -ForegroundColor Cyan
Write-Host "  대상: PROD — $hostShown"
Write-Host '=================================================='

# ─── 1. 운영 백업 (실패하면 여기서 멈춘다) ─────────────────────────
Write-Host ''
Write-Host '[1/4] 운영 백업' -ForegroundColor Cyan
$started = Get-Date
& powershell -NoProfile -File (Join-Path $PSScriptRoot 'backup-db.ps1') -Target prod
if ($LASTEXITCODE -ne 0) { Fail '운영 백업 실패 — 백업 없이는 진행하지 않습니다.' }
$dump = Get-ChildItem -Path $outDir -Filter 'prod-*.dump' -ErrorAction SilentlyContinue |
        Where-Object { $_.LastWriteTime -ge $started.AddSeconds(-5) -and $_.Length -ge 1024 } |
        Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $dump) { Fail '방금 만든 prod-*.dump 파일을 찾지 못했습니다.' }
Write-Host "  백업 확인: backups/$($dump.Name) ($([math]::Round($dump.Length/1KB,1)) KB)" -ForegroundColor Green

# ─── 2~4. 대기 목록 → 확인 → 적용 ──────────────────────────────────
$env:DATABASE_URL = $url
$env:DIRECT_URL   = $url
Push-Location $backend
try {
  Write-Host ''
  Write-Host '[2/4] 운영에 아직 안 들어간 마이그레이션' -ForegroundColor Cyan
  & npx prisma migrate status
  # (대기 중인 게 있으면 status가 0이 아닌 코드로 끝난다 — 정상이다)

  Write-Host ''
  Write-Host '[3/4] 위 목록을 운영에 적용할까요?' -ForegroundColor Yellow
  Write-Host '      - "Database schema is up to date" 라면 적용할 게 없습니다 → 그냥 Enter' -ForegroundColor Yellow
  Write-Host '      - 적용하려면 prod 라고 입력하고 Enter' -ForegroundColor Yellow
  $ans = Read-Host '입력'
  if ($ans -ne 'prod') { Fail '취소했습니다.' }

  Write-Host ''
  Write-Host '[4/4] 적용 중' -ForegroundColor Cyan
  & npx prisma migrate deploy
  if ($LASTEXITCODE -ne 0) {
    Fail "적용 실패 — 되돌려야 하면 백업 backups/$($dump.Name) 가 있습니다. 에러 문구를 그대로 Claude에게 보여주세요."
  }
  & npx prisma migrate status
}
finally {
  Pop-Location
  Remove-Item Env:DATABASE_URL, Env:DIRECT_URL -ErrorAction SilentlyContinue
}

Write-Host ''
Write-Host '==================================================' -ForegroundColor Green
Write-Host '  [O] 운영 마이그레이션 완료' -ForegroundColor Green
Write-Host "  백업: backups/$($dump.Name)" -ForegroundColor Green
Write-Host '  다음: 추가형이면 이제 push 하세요.' -ForegroundColor Green
Write-Host '==================================================' -ForegroundColor Green
exit 0
