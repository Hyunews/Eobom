# watch-backend.ps1 — 이어봄 백엔드 서버(포트 5000) 상태 모니터
# 사용법: powershell -ExecutionPolicy Bypass -File .harness\tools\watch-backend.ps1
#
# 1초마다 포트 5000 리스닝 여부를 확인해 상태 변화 시 콘솔에 알림을 출력한다.
# 에이전트가 작업 중 서버를 종료하면 즉시 감지된다.

$port = 5000
$intervalSec = 1
$lastStatus = $null

function Get-PortListening {
    param([int]$Port)
    $result = netstat -ano 2>$null | Select-String ":$Port\s" | Select-String "LISTENING"
    return [bool]$result
}

function Write-StatusLine {
    param([bool]$IsUp, [string]$Detail = "")
    $time = Get-Date -Format "HH:mm:ss"
    if ($IsUp) {
        Write-Host "[$time] ✅  포트 $port LISTENING  (백엔드 실행 중)" -ForegroundColor Green
    } else {
        Write-Host "[$time] 🔴  포트 $port 응답 없음  (백엔드 꺼짐!)" -ForegroundColor Red
        if ($Detail) { Write-Host "         $Detail" -ForegroundColor Yellow }
    }
}

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host " 이어봄 백엔드 포트 $port 모니터  (Ctrl+C 로 종료)" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# 초기 상태 출력
$current = Get-PortListening -Port $port
Write-StatusLine -IsUp $current
$lastStatus = $current

while ($true) {
    Start-Sleep -Seconds $intervalSec
    $current = Get-PortListening -Port $port

    if ($current -ne $lastStatus) {
        Write-Host "" # 빈 줄 구분
        if ($current) {
            Write-StatusLine -IsUp $true
            # Windows 시스템 비프음 (서버 복구)
            [console]::Beep(880, 300)
        } else {
            Write-StatusLine -IsUp $false -Detail "에이전트 작업 중 종료됐을 수 있음 — 재기동: cd eobom\backend && npm run dev"
            # Windows 시스템 경고음 (서버 다운)
            [console]::Beep(440, 500)
            [console]::Beep(330, 700)
        }
        Write-Host ""
        $lastStatus = $current
    }
}
