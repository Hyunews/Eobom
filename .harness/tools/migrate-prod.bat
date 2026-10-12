@echo off
chcp 65001 >nul
rem Desktop launcher (shortcut: 운영DB적용)
rem 1) migrate-prod.ps1 : backup -> pending list -> confirm -> apply all pending
rem 2) regenerate 00-05 DB spec and 00-04 API spec from schema.prisma / routes
pushd "%~dp0..\.."
powershell -NoProfile -ExecutionPolicy Bypass -File ".harness\tools\migrate-prod.ps1"
echo.
echo ==================================================
echo  명세서 갱신 (00-05 DB · 00-04 API)
echo ==================================================
node ".harness\tools\generate-db-doc.js"
node ".harness\tools\generate-api-doc.js"
echo.
echo 바뀐 명세서 (아래에 파일이 보이면 커밋 필요):
git status -s -- docs/00_핵심플랫폼/00-04_* docs/00_핵심플랫폼/00-05_*
popd
echo.
pause
