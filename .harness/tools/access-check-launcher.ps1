# 이어봄 접속기록 월간 점검 — 더블클릭 실행기 (개발자 개인 도구, git에 올리지 않음)
# 로컬/운영 선택 -> 비밀번호 입력(항상) -> npm run report:access-check -> 결과지 열기
# 🔴 비밀번호는 이 창의 메모리에만 있다. 파일·.env·기록에 남기지 않고, 끝나면 환경변수를 지운다.
$ErrorActionPreference = 'Stop'
$backend = 'D:\Eobom\eobomDev\backend'
$auditor = 'eobom_auditor'

function Plain([System.Security.SecureString]$s) {
  $b = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($s)
  try { [Runtime.InteropServices.Marshal]::PtrToStringBSTR($b) } finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($b) }
}

Write-Host ''
Write-Host '=== 이어봄 접속기록 월간 점검 ===' -ForegroundColor Cyan
Write-Host '  1) 로컬 (Docker eobom-postgres, 연습용)'
Write-Host '  2) 운영 (Supabase, 실제 점검)'
$pick = Read-Host '번호를 고르세요 (1/2)'

if ($pick -eq '1') {
  $where = '로컬'
  $user = $auditor
  $hostdb = 'localhost:5433/eobom_db'
}
elseif ($pick -eq '2') {
  $where = '운영'
  # 호스트·DB 이름만 .env 의 BACKUP_DATABASE_URL 에서 읽는다(비밀번호는 읽지도 쓰지도 않는다)
  $line = Get-Content (Join-Path $backend '.env') | Where-Object { $_ -match '^BACKUP_DATABASE_URL=' } | Select-Object -First 1
  $u = if ($line) { ($line -replace '^BACKUP_DATABASE_URL=', '').Trim().Trim('"').Trim("'") } else { '' }
  if ($u -notmatch '^postgres(?:ql)?://([^:/@]+):[^@]*@([^/]+)/([^?]*)') {
    Write-Host '.env 의 BACKUP_DATABASE_URL 에서 운영 주소를 읽지 못했습니다. 중단합니다.' -ForegroundColor Red
    exit 1
  }
  $backupUser = $Matches[1]
  $hostdb = "$($Matches[2])/$($Matches[3])"
  if ($hostdb -match 'localhost|127\.0\.0\.1|host\.docker\.internal') {
    Write-Host 'BACKUP_DATABASE_URL 이 로컬 주소입니다. 운영 주소가 아닙니다. 중단합니다.' -ForegroundColor Red
    exit 1
  }
  $ref = if ($backupUser.Contains('.')) { $backupUser.Substring($backupUser.IndexOf('.') + 1) } else { '' }
  $suggest = if ($ref) { "$auditor.$ref" } else { $auditor }
  Write-Host "운영 접속 계정 이름 (풀러는 보통 $suggest 형식)"
  $in = Read-Host "계정 이름 [Enter = $suggest]"
  $user = if ($in) { $in } else { $suggest }
}
else {
  Write-Host '1 또는 2만 입력할 수 있습니다. 중단합니다.' -ForegroundColor Red
  exit 1
}

Write-Host ''
Write-Host "대상: $where  ($hostdb)  계정: $user" -ForegroundColor Yellow
$pw = Plain (Read-Host "$where 점검 계정 비밀번호" -AsSecureString)
if (-not $pw) { Write-Host '비밀번호가 비어 있습니다. 중단합니다.' -ForegroundColor Red; exit 1 }
$month = Read-Host '점검할 달 YYYY-MM [Enter = 지난달]'

# 이 창 안에서만 쓰는 환경변수 — dotenv 는 이미 있는 값을 덮어쓰지 않으므로 .env 보다 우선한다
$env:OPS_AUDIT_DATABASE_URL = "postgresql://$([Uri]::EscapeDataString($user)):$([Uri]::EscapeDataString($pw))@$hostdb"
$pw = $null

try {
  Set-Location $backend
  $npmArgs = @('run', 'report:access-check')
  if ($month) { $npmArgs += @('--', "--month=$month") }
  $out = & npm @npmArgs 2>&1 | ForEach-Object { "$_" }
  $out | ForEach-Object { Write-Host $_ }
  $hit = $out | Where-Object { $_ -match '^결과지:\s*(.+)$' } | Select-Object -First 1
  if ($hit -and ($hit -match '^결과지:\s*(.+)$')) {
    $path = $Matches[1].Trim()
    if (Test-Path -LiteralPath $path) {
      Write-Host ''
      Write-Host "결과지를 엽니다: $path" -ForegroundColor Green
      Start-Process -FilePath $path
    }
  }
  else {
    Write-Host ''
    Write-Host '결과지가 만들어지지 않았습니다. 위 메시지를 확인하세요.' -ForegroundColor Red
  }
}
finally {
  Remove-Item Env:OPS_AUDIT_DATABASE_URL -ErrorAction SilentlyContinue
}

