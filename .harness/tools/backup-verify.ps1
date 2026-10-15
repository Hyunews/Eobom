# backup-verify.ps1 — 로컬·운영 백업 + 복구 시험 한 번에 (db-safety.md §8-7)
#
# 흐름: backup-db.ps1 -Target local → -Target prod (새로 짜지 않고 부른다) → 방금 만든 파일을
#   임시 컨테이너 postgres:17-alpine 에 풀어 본다 → 테이블 수·행 수를 원본과 견준다 → 컨테이너를 지운다.
# 🔴 원래 DB 두 곳(eobom-postgres·운영)은 읽기만 한다. 시험 DB는 임시 컨테이너에만 생긴다(볼륨 없음·포트 안 엶).
# 🔴 하지 않는 것: 원래 DB에 붓기(restore-db.ps1 · 사람) · 옛 백업 지우기(보관 규칙 미정 §8-6).
#
# 사용법: backup-verify.bat 더블클릭  또는  powershell -File .harness/tools/backup-verify.ps1
# 종료코드: 0 = 로컬·운영 모두 성공, 1 = 하나라도 실패

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = New-Object System.Text.UTF8Encoding($false)   # BOM 없이 — BOM이 psql 입력 앞에 붙으면 SQL이 깨진다

. (Join-Path $PSScriptRoot 'db-url.ps1')

$root    = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$outDir  = Join-Path $root 'eobomDev\backend\backups'
$envFile = Join-Path $root 'eobomDev\backend\.env'
$backup  = Join-Path $PSScriptRoot 'backup-db.ps1'
$logFile = Join-Path $outDir 'verify-log.txt'
$image   = 'postgres:17-alpine'

# 테이블별 정확한 행 수 — "이름|행수" 줄. 원본과 복구본에 같은 SQL을 쓴다.
$countSql = @'
select table_name || '|' || (xpath('/row/c/text()', query_to_xml(format('select count(*) as c from %I.%I', table_schema, table_name), false, true, '')))[1]::text
from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE' order by 1;
'@

function Parse-Counts($lines) {
  $h = [ordered]@{}
  foreach ($l in @($lines)) {
    $s = "$l".Trim()
    if ($s -match '^([^|]+)\|(\d+)$') { $h[$Matches[1]] = [long]$Matches[2] }
  }
  return $h
}

# 원본 DB의 테이블별 행 수 (읽기만)
function Get-SourceCounts([string]$target, [string]$url) {
  if ($target -eq 'local') {
    $out = $countSql | & docker exec -i eobom-postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -At -v ON_ERROR_STOP=1'
  } else {
    $out = $countSql | & docker run --rm -i -e "PGURL=$url" $image sh -c 'psql "$PGURL" -At -v ON_ERROR_STOP=1'
  }
  if ($LASTEXITCODE -ne 0) { throw "원본 행 수 조회 실패 (exit $LASTEXITCODE)" }
  return (Parse-Counts $out)
}

# 한 대상을 백업하고 시험한다. 결과 = @{ ok; file; tables; note }
function Invoke-Target([string]$target) {
  $ErrorActionPreference = 'Continue'   # 네이티브 stderr(pg_restore 경고)를 예외로 만들지 않는다 — 판정은 종료코드로
  $res = @{ ok = $false; file = ''; tables = 0; note = '' }
  $before = @(Get-ChildItem $outDir -Filter "$target-*.dump" -ErrorAction SilentlyContinue | ForEach-Object { $_.Name })

  Write-Host ''
  Write-Host "────────── [$($target.ToUpper())] 1/2 백업 ──────────" -ForegroundColor Cyan
  & powershell -NoProfile -ExecutionPolicy Bypass -File $backup -Target $target | Out-Host
  if ($LASTEXITCODE -ne 0) { $res.note = '백업 실패'; return $res }

  $new = @(Get-ChildItem $outDir -Filter "$target-*.dump" | Where-Object { $before -notcontains $_.Name } | Sort-Object LastWriteTime -Descending)
  if ($new.Count -eq 0) { $res.note = '백업은 성공이라는데 새 파일이 없음'; return $res }
  $dump = $new[0]
  $res.file = $dump.Name

  $url = $null
  if ($target -eq 'prod') {
    $url = Get-ProdUrl $envFile
    if (-not $url) { $res.note = '운영 주소 오류'; return $res }
  }

  Write-Host ''
  Write-Host "────────── [$($target.ToUpper())] 2/2 복구 시험 (임시 컨테이너) ──────────" -ForegroundColor Cyan
  $cname = "eobom-verify-$target-$(Get-Date -Format 'HHmmss')"
  try {
    $src = Get-SourceCounts $target $url

    & docker run -d --name $cname -e POSTGRES_PASSWORD=verify $image | Out-Null
    if ($LASTEXITCODE -ne 0) { throw '임시 컨테이너를 못 띄움' }

    # 최종 서버만 TCP(127.0.0.1)를 연다 — 초기화용 임시 서버는 소켓만 열어서 이 검사로 걸러진다.
    $ready = $false
    for ($i = 0; $i -lt 60; $i++) {
      & docker exec $cname psql -h 127.0.0.1 -U postgres -c 'select 1' 2>$null | Out-Null
      if ($LASTEXITCODE -eq 0) { $ready = $true; break }
      Start-Sleep -Seconds 1
    }
    if (-not $ready) { throw '임시 컨테이너 DB가 60초 안에 안 뜸' }

    & docker cp $dump.FullName "${cname}:/tmp/r.dump" | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'docker cp 실패' }

    $restoreArgs = @('exec', $cname, 'pg_restore', '-U', 'postgres', '-d', 'postgres', '--no-owner', '--no-privileges')   # GRANT 대상 역할(anon·eobom_auditor 등)이 시험 컨테이너엔 없다 — 권한은 시험 대상이 아님
    if ($target -eq 'prod') { $restoreArgs += @('-n', 'public') }
    $restoreArgs += '/tmp/r.dump'
    & docker @restoreArgs 2>&1 | Out-Host
    if ($LASTEXITCODE -ne 0) { throw "pg_restore 오류 (exit $LASTEXITCODE)" }

    $out = $countSql | & docker exec -i $cname psql -h 127.0.0.1 -U postgres -d postgres -At -v ON_ERROR_STOP=1
    if ($LASTEXITCODE -ne 0) { throw '복구본 행 수 조회 실패' }
    $dst = Parse-Counts $out

    $res.tables = $dst.Count
    Write-Host ''
    Write-Host ("  {0,-34} {1,10} {2,10}" -f '테이블', '원본', '복구본')
    $names = @($src.Keys) + @($dst.Keys) | Sort-Object -Unique
    foreach ($n in $names) {
      $a = if ($src.Contains($n)) { $src[$n] } else { '-' }
      $b = if ($dst.Contains($n)) { $dst[$n] } else { '-' }
      $mark = if ("$a" -ne "$b") { '  ≠' } else { '' }
      Write-Host ("  {0,-34} {1,10} {2,10}{3}" -f $n, $a, $b, $mark)
    }
    Write-Host "  ※ 행 수 차이는 표시만 한다(운영은 백업~집계 사이 새 기록으로 다를 수 있음). 판정은 테이블 수."

    if ($src.Count -ne $dst.Count) { throw "테이블 수 다름 — 원본 $($src.Count) / 복구본 $($dst.Count)" }
    if ($dst.Count -eq 0) { throw 'public 테이블이 0개' }
    $res.ok = $true
  }
  catch {
    $res.note = "$($_.Exception.Message)"
  }
  finally {
    try { & docker rm -f $cname 2>&1 | Out-Null } catch {}   # 성공·실패 상관없이 — 운영 개인정보 사본을 남기지 않는다
  }
  return $res
}

# ─── 시작 ────────────────────────────────────────────────────────────────────
$dockerOk = $false
try { & docker info 2>$null | Out-Null; $dockerOk = ($LASTEXITCODE -eq 0) } catch {}
if (-not $dockerOk) { Write-Host '[X] Docker가 꺼져 있습니다 — Docker Desktop을 먼저 켜세요.' -ForegroundColor Red; exit 1 }
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }

$results = [ordered]@{}
foreach ($t in @('local', 'prod')) {
  try { $results[$t] = Invoke-Target $t }
  catch { $results[$t] = @{ ok = $false; file = ''; tables = 0; note = $_.Exception.Message } }

  $r = $results[$t]
  $stamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
  $verdict = if ($r.ok) { 'OK' } else { "FAIL ($($r.note))" }
  Add-Content -Path $logFile -Encoding UTF8 -Value "$stamp | $t | $($r.file) | 테이블 $($r.tables) | $verdict"
}

# ─── 끝 화면 ─────────────────────────────────────────────────────────────────
Write-Host ''
Write-Host '==================================================' -ForegroundColor White
$allOk = $true
foreach ($t in $results.Keys) {
  $r = $results[$t]
  if ($r.ok) {
    Write-Host "  [O] $($t.ToUpper())  백업 + 복구 시험 통과 — $($r.file) (테이블 $($r.tables)개)" -ForegroundColor Green
  } else {
    $allOk = $false
    Write-Host "  [X] $($t.ToUpper())  실패 — $($r.note)" -ForegroundColor Red
  }
}
Write-Host '==================================================' -ForegroundColor White
Write-Host "  기록: eobomDev/backend/backups/verify-log.txt"
if ($allOk) { exit 0 } else { exit 1 }
