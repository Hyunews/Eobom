@echo off
rem Desktop launcher for prod DB migration.
rem ASCII only + CRLF line endings: cmd.exe misreads UTF-8 Korean / LF-only .bat files (10-12 incident).
rem 1) migrate-prod.ps1 : backup -> pending list -> confirm -> apply all pending
rem 2) regenerate 00-05 DB spec and 00-04 API spec from schema.prisma / routes
pushd "%~dp0..\.."
powershell -NoProfile -ExecutionPolicy Bypass -File ".harness\tools\migrate-prod.ps1"
echo.
echo ==================================================
echo  Regenerate specs (00-05 DB, 00-04 API)
echo ==================================================
node ".harness\tools\generate-db-doc.js"
node ".harness\tools\generate-api-doc.js"
echo.
echo Changed spec files (if any are listed below, commit them):
git status -s -- "docs/*/00-04_*" "docs/*/00-05_*"
popd
echo.
pause
