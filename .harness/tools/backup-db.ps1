# backup-db.ps1 — 스키마 변경 전 운영 DB 백업 (systems.md §4)
#
# 왜 있나: systems.md:116이 "스키마 변경 전 pg_dump 필수"(2026-08-05 마이그레이션 실수로 데이터
#   유실 사고)라고 정해뒀는데, **정작 이 PC에 pg_dump가 설치돼 있지 않았다**(2026-08-27 확인).
#   규칙만 있고 도구가 없으면 그 규칙은 지켜지지 않는다 — 그래서 만든다.
#
# 어떻게: pg_dump를 설치하지 않고 Docker 이미지로 실행한다. 이 PC엔 Docker가 이미 있고,
#   클라이언트 버전을 이미지 태그로 맞출 수 있어 "server version mismatch"를 피하기 쉽다.
#
# 🔴 비밀번호를 명령줄 인자로 넘기지 않는다 — PowerShell 히스토리에 남는다.
#   .env에서 읽어 컨테이너 환경변수로만 전달한다.
#
# 사용법:  powershell -File .harness/tools/backup-db.ps1
#          powershell -File .harness/tools/backup-db.ps1 -PgVersion 15
# 종료코드: 0 = 성공, 1 = 실패

param(
  # 🔵 기본값 17 — 2026-08-21 실측 이력(walkthrough:1346)에 근거한다.
  #    그때 15-alpine으로 시도해 "server version mismatch"로 실패했고 17-alpine으로 성공했다.
  #    클라이언트가 서버보다 낮으면 pg_dump가 거부한다(상위 클라이언트 → 하위 서버는 대체로 동작).
  #    Supabase가 서버를 올리면 이 값도 올릴 것.
  [int]$PgVersion = 17
)

$ErrorActionPreference = 'Stop'

$root    = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$envFile = Join-Path $root 'eobom\backend\.env'
$outDir  = Join-Path $root 'eobom\backend\backups'

if (-not (Test-Path $envFile)) { Write-Host "[X] .env 없음: $envFile" -ForegroundColor Red; exit 1 }

# 🔴 로컬 .env의 DIRECT_URL은 **로컬 Docker DB(localhost:5433)** 다 — schema.prisma 머리말이
#    "로컬에서는 풀러가 없으므로 둘 다 같은 값"이라 해둔 그대로다. 운영(Supabase) 백업에는 쓸 수 없다.
#    그래서 백업 전용 키를 먼저 찾고, 없을 때만 DIRECT_URL로 폴백한다.
#    .env에 아래 한 줄을 추가할 것(Supabase 대시보드 → Connect → Direct connection):
#      BACKUP_DATABASE_URL=postgresql://postgres:...@db.xxxx.supabase.co:5432/postgres
$key  = 'BACKUP_DATABASE_URL'
$line = Select-String -Path $envFile -Pattern "^\s*$key\s*=" | Select-Object -First 1
if (-not $line) {
  $key  = 'DIRECT_URL'
  $line = Select-String -Path $envFile -Pattern "^\s*$key\s*=" | Select-Object -First 1
  Write-Host "[!] BACKUP_DATABASE_URL이 없어 DIRECT_URL로 폴백합니다 — 로컬 DB일 수 있습니다." -ForegroundColor Yellow
}
if (-not $line) { Write-Host "[X] .env에 BACKUP_DATABASE_URL / DIRECT_URL 둘 다 없습니다." -ForegroundColor Red; exit 1 }

$url = ($line.Line -replace "^\s*$key\s*=", '').Trim().Trim('"').Trim("'")
if ([string]::IsNullOrWhiteSpace($url)) { Write-Host "[X] $key 값이 비었습니다." -ForegroundColor Red; exit 1 }

# 🔴 Prisma 전용 쿼리 파라미터를 걷어낸다. Prisma는 ?schema=public 같은 것을 이해하지만
#    pg_dump(libpq)는 모르고 "invalid URI query parameter"로 죽는다(2026-08-27 실제 실패).
#    화이트리스트가 아니라 블랙리스트로 지운다 — sslmode 처럼 libpq가 실제로 쓰는 값은 남겨야 한다.
$prismaOnly = @('schema','pgbouncer','connection_limit','pool_timeout','sslaccept','socket_timeout','statement_cache_size')
if ($url.Contains('?')) {
  $base  = $url.Substring(0, $url.IndexOf('?'))
  $query = $url.Substring($url.IndexOf('?') + 1)
  $kept  = @()
  foreach ($pair in $query.Split('&')) {
    if ([string]::IsNullOrWhiteSpace($pair)) { continue }
    # 🔴 변수명을 $key로 쓰지 않는다 — 바깥의 "어느 .env 키를 읽었나"를 덮어쓴다(2026-08-27 실제 버그).
    $pkey = $pair.Split('=')[0]
    if ($prismaOnly -notcontains $pkey) { $kept += $pair }
  }
  $url = if ($kept.Count -gt 0) { "$base`?$($kept -join '&')" } else { $base }
}

# 컨테이너 안의 localhost는 컨테이너 자신이다 — 호스트 DB를 보려면 치환해야 한다.
# 🔴 자리표시자를 그대로 붙여넣는 실수를 여기서 잡는다(2026-08-27 실제 발생 — db.xxxx.supabase.co).
# 그냥 두면 "could not translate host name"이라는 DNS 오류로 나와 원인이 한눈에 안 보인다.
foreach ($ph in @('xxxx', 'YOUR-PASSWORD', '여기에', 'change_this', '[', ']')) {
  if ($url.Contains($ph)) {
    Write-Host "[X] 연결 문자열에 자리표시자가 남아 있습니다: '$ph'" -ForegroundColor Red
    Write-Host "    Supabase > Connect > Direct connection 값을 통째로 복사하고 비밀번호만 교체하세요." -ForegroundColor Yellow
    Write-Host "    또는 Render 대시보드의 DIRECT_URL을 복사하면 비밀번호까지 들어 있습니다." -ForegroundColor Yellow
    exit 1
  }
}

$hostShown = ([regex]::Match($url, '@([^/?]+)')).Groups[1].Value

# 🔴 Supabase의 Direct connection(db.[ref].supabase.co)은 **IPv6 전용**이다(A 레코드 없이 AAAA만).
#    Docker 컨테이너는 기본적으로 IPv6가 꺼져 있어 "could not translate host name"으로 죽는다
#    (2026-08-27 실제 발생). Session pooler(IPv4 지원, 5432)를 쓰면 해결된다.
#    🔴 Transaction pooler(:6543)는 pg_dump가 prepared statement를 못 써서 실패하므로 안 된다.
if ($hostShown -match '^db\..*\.supabase\.co') {
  Write-Host "[X] Supabase Direct connection은 IPv6 전용이라 Docker에서 접속할 수 없습니다." -ForegroundColor Red
  Write-Host "    Supabase > Connect > **Session pooler**(포트 5432) 문자열로 바꾸세요." -ForegroundColor Yellow
  Write-Host "    예: postgresql://postgres.[ref]:[PW]@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -ForegroundColor Yellow
  Write-Host "    🔴 Transaction pooler(:6543)는 pg_dump가 실패하니 쓰지 말 것." -ForegroundColor Yellow
  exit 1
}
if ($hostShown -match ':6543$') {
  Write-Host "[X] Transaction pooler(:6543)로는 pg_dump가 동작하지 않습니다 — Session pooler(:5432)를 쓰세요." -ForegroundColor Red
  exit 1
}
# 🔴 pooler는 유저명이 `postgres.[project-ref]` 형태다. 호스트만 pooler로 바꾸고 유저명을 그냥
#    `postgres`로 두면 "password authentication failed"가 난다 — 비밀번호 문제로 보여서
#    엉뚱한 곳을 파게 된다(2026-08-27 실제 발생). walkthrough:1346의 -U postgres.[ref]와 같다.
if ($hostShown -match 'pooler\.supabase\.com') {
  $userName = ([regex]::Match($url, '://([^:]+):')).Groups[1].Value
  if ($userName -eq 'postgres') {
    Write-Host "[X] Session pooler는 유저명이 'postgres.[project-ref]' 여야 합니다(지금은 'postgres')." -ForegroundColor Red
    Write-Host "    예: postgresql://postgres.oxvy...:[PW]@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -ForegroundColor Yellow
    Write-Host "    ※ 이 상태로 두면 '비밀번호 인증 실패'로 나와 원인이 비밀번호처럼 보인다." -ForegroundColor Yellow
    exit 1
  }
}
$isLocal   = $url -match '@(localhost|127\.0\.0\.1)'
if ($isLocal) {
  $url = $url -replace '@(localhost|127\.0\.0\.1)', '@host.docker.internal'
  Write-Host "[!] 대상이 로컬 DB입니다($hostShown) — 운영 백업이 목적이라면 .env에 BACKUP_DATABASE_URL을 넣으세요." -ForegroundColor Yellow
}
Write-Host "  대상: $hostShown  (키: $key)"

if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
# 파일명에 대상을 박는다 — 로컬 백업을 운영 백업으로 착각하면 "백업했다"는 착각만 남는다.
$tag   = if ($isLocal) { 'local' } else { 'prod' }
$name  = "$tag-$stamp.dump"

Write-Host "DB 백업 시작 — postgres:$PgVersion-alpine (Docker)"
Write-Host "  출력: eobom/backend/backups/$name"
Write-Host "  ※ .gitignore에 등록된 폴더다. 개인정보가 들어가므로 절대 커밋하지 않는다(security.md §1)."

# -Fc = custom format(압축 + pg_restore로 선택 복원 가능). 평문 .sql보다 다루기 좋다.
# 🔴 sh -c 에 넘길 문자열은 PowerShell에서 통째로 조립한다. 문자열 리터럴 뒤에 변수를 이어붙이면
#    (`'...'$name`) 별개 인자로 잘려 파일명이 사라진다 — 2026-08-27에 실제로 그렇게 실패했다.
#    `$PGURL 은 백틱으로 이스케이프해 컨테이너 안에서 확장되게 한다(여기서 확장되면 URL이 노출된다).
$inner = "pg_dump `"`$PGURL`" -Fc -f /backup/$name"

& docker run --rm `
  -e "PGURL=$url" `
  -v "${outDir}:/backup" `
  "postgres:$PgVersion-alpine" `
  sh -c $inner

$file = Join-Path $outDir $name

# 🔴 실패하면 빈 파일을 반드시 지운다. pg_dump는 접속 실패에도 0바이트 파일을 만들어 두는데,
#    그대로 두면 나중에 목록에서 "백업이 있네"로 보인다 — 없는 백업을 있다고 믿는 것이
#    백업이 아예 없는 것보다 위험하다(2026-08-27에 0바이트 5개가 쌓였다).
function Remove-FailedDump {
  if (Test-Path $file) { Remove-Item $file -Force -ErrorAction SilentlyContinue }
}

if ($LASTEXITCODE -ne 0) {
  Remove-FailedDump
  Write-Host "[X] 백업 실패 (exit $LASTEXITCODE)" -ForegroundColor Red
  Write-Host "    'server version mismatch'가 보이면 -PgVersion 을 올려서 다시 실행할 것." -ForegroundColor Yellow
  exit 1
}

if (-not (Test-Path $file)) { Write-Host "[X] 출력 파일이 생성되지 않았습니다." -ForegroundColor Red; exit 1 }

$size = (Get-Item $file).Length
if ($size -lt 1024) {
  # 검사 대상이 0건이면 성공이 아니라 실패다(harness-doctor.sh 설계 원칙 2와 같은 태도).
  Write-Host "[X] 백업 파일이 ${size}B 로 비정상적으로 작습니다 — 내용이 안 담겼습니다. 삭제합니다." -ForegroundColor Red
  Remove-FailedDump
  exit 1
}

Write-Host "[O] 완료 — $name ($([math]::Round($size/1KB,1)) KB)" -ForegroundColor Green
Write-Host "    복원: docker run --rm -e PGURL=... -v ...:/backup postgres:$PgVersion-alpine sh -c 'pg_restore -d \"`$PGURL\" /backup/$name'"
