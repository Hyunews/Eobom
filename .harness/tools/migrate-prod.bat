@echo off
rem Desktop launcher for prod DB migration.
rem ASCII only + CRLF line endings: cmd.exe misreads UTF-8 Korean / LF-only .bat files (10-12 incident).
rem 1) migrate-prod.ps1 : backup -> pending list -> confirm -> apply all pending
rem 2) regenerate 00-05 DB spec and 00-04 API spec from schema.prisma / routes
rem 10-15 incident: a desktop shortcut had no node on PATH. Add the default install dir, and never print success on failure.
where node >nul 2>nul
if errorlevel 1 if exist "C:\Program Files\nodejs\node.exe" set "PATH=C:\Program Files\nodejs;%PATH%"
pushd "%~dp0..\.."
powershell -NoProfile -ExecutionPolicy Bypass -File ".harness\tools\migrate-prod.ps1"
set MIGRATE_RC=%ERRORLEVEL%
echo.
echo ==================================================
echo  Regenerate specs (00-05 DB, 00-04 API)
echo ==================================================
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo [X] SPEC REGENERATION FAILED - node not found. 00-04 / 00-05 were NOT regenerated.
  set SPEC_RC=1
  goto :summary
)
set SPEC_RC=0
node ".harness\tools\generate-db-doc.js"
if errorlevel 1 set SPEC_RC=1
node ".harness\tools\generate-api-doc.js"
if errorlevel 1 set SPEC_RC=1
if "%SPEC_RC%"=="1" (
  echo.
  echo [X] SPEC REGENERATION FAILED - see the error above. 00-04 / 00-05 may be stale.
)
echo.
echo Changed spec files (if any are listed below, commit them):
git status -s -- "docs/*/00-04_*" "docs/*/00-05_*"
:summary
echo.
if not "%MIGRATE_RC%"=="0" echo [X] MIGRATION DID NOT COMPLETE (exit %MIGRATE_RC%) - read the message above.
if "%MIGRATE_RC%"=="0" echo [O] Migration finished.
popd
echo.
pause