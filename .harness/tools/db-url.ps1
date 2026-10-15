# db-url.ps1 — 운영 DB 접속 주소를 .env의 BACKUP_DATABASE_URL에서 읽어 libpq용으로 다듬는다 (dot-source 전용)
#
# backup-verify.ps1·restore-db.ps1이 같이 쓴다. backup-db.ps1 §운영의 검사를 그대로 옮긴 것 —
# 🔴 DIRECT_URL로 폴백하지 않는다(로컬 주소다) · Direct connection(IPv6 전용)·Transaction pooler(:6543) 거부 ·
#    로컬 주소 거부 · 자리표시자 거부. 통과하면 주소 문자열을 돌려주고, 실패하면 $null (이유는 화면에 출력).
# 사용법:  . (Join-Path $PSScriptRoot 'db-url.ps1');  $url = Get-ProdUrl $envFile

function Get-ProdUrl([string]$envFile) {
  if (-not (Test-Path $envFile)) { Write-Host "[X] .env 없음: $envFile" -ForegroundColor Red; return $null }

  $key  = 'BACKUP_DATABASE_URL'
  $line = Select-String -Path $envFile -Pattern "^\s*$key\s*=" | Select-Object -First 1
  if (-not $line) {
    Write-Host "[X] .env에 BACKUP_DATABASE_URL 이 없습니다 — prod 는 DIRECT_URL로 폴백하지 않습니다." -ForegroundColor Red
    return $null
  }
  $url = ($line.Line -replace "^\s*$key\s*=", '').Trim().Trim('"').Trim("'")
  if ([string]::IsNullOrWhiteSpace($url)) { Write-Host "[X] $key 값이 비었습니다." -ForegroundColor Red; return $null }

  # Prisma 전용 쿼리 파라미터 제거(libpq는 모른다)
  $prismaOnly = @('schema','pgbouncer','connection_limit','pool_timeout','sslaccept','socket_timeout','statement_cache_size')
  if ($url.Contains('?')) {
    $base  = $url.Substring(0, $url.IndexOf('?'))
    $query = $url.Substring($url.IndexOf('?') + 1)
    $kept  = @()
    foreach ($pair in $query.Split('&')) {
      if ([string]::IsNullOrWhiteSpace($pair)) { continue }
      $pkey = $pair.Split('=')[0]
      if ($prismaOnly -notcontains $pkey) { $kept += $pair }
    }
    $url = if ($kept.Count -gt 0) { "$base`?$($kept -join '&')" } else { $base }
  }

  foreach ($ph in @('xxxx', 'YOUR-PASSWORD', '여기에', 'change_this', '[', ']')) {
    if ($url.Contains($ph)) { Write-Host "[X] 연결 문자열에 자리표시자가 남아 있습니다: '$ph'" -ForegroundColor Red; return $null }
  }

  $hostShown = ([regex]::Match($url, '@([^/?]+)')).Groups[1].Value
  if ($hostShown -match '^db\..*\.supabase\.co') { Write-Host "[X] Direct connection(IPv6 전용)은 Docker에서 못 씁니다 — Session pooler(:5432)로." -ForegroundColor Red; return $null }
  if ($hostShown -match ':6543$') { Write-Host "[X] Transaction pooler(:6543)는 안 됩니다 — Session pooler(:5432)로." -ForegroundColor Red; return $null }
  if ($url -match '@(localhost|127\.0\.0\.1|host\.docker\.internal)') { Write-Host "[X] BACKUP_DATABASE_URL이 로컬 주소입니다($hostShown)." -ForegroundColor Red; return $null }
  return $url
}
