@echo off
setlocal
chcp 65001 >nul

cd /d "%~dp0"

set "ROOT=%CD%"
set "LOG_DIR=%ROOT%\.codex-runlogs"
set "BACKEND_OUT=%LOG_DIR%\backend.out.log"
set "BACKEND_ERR=%LOG_DIR%\backend.err.log"
set "FRONTEND_OUT=%LOG_DIR%\frontend.out.log"
set "FRONTEND_ERR=%LOG_DIR%\frontend.err.log"
set "PYTHONIOENCODING=utf-8"
set "PYTHONUTF8=1"

if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

del "%BACKEND_OUT%" "%BACKEND_ERR%" "%FRONTEND_OUT%" "%FRONTEND_ERR%" >nul 2>nul

if not exist "%ROOT%\.venv\Scripts\python.exe" (
  echo [ERROR] Missing Python runtime: "%ROOT%\.venv\Scripts\python.exe"
  pause
  exit /b 1
)

where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo [ERROR] npm.cmd was not found in PATH.
  pause
  exit /b 1
)

echo Cleaning previous dev processes...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-CimInstance Win32_Process | Where-Object { ($_.Name -eq 'python.exe' -and $_.CommandLine -like '*uvicorn main:app*') -or ($_.Name -eq 'node.exe' -and $_.CommandLine -like '*next*') -or ($_.Name -eq 'cmd.exe' -and $_.CommandLine -like '*npm*run*dev*') } | ForEach-Object { try { Stop-Process -Id $_.ProcessId -Force -ErrorAction Stop } catch {} }"

timeout /t 2 >nul

echo Starting backend...
start "GPT Researcher Backend" /min cmd /c ""%ROOT%\.venv\Scripts\python.exe" -m uvicorn main:app --host 127.0.0.1 --port 8000 1>>"%BACKEND_OUT%" 2>>"%BACKEND_ERR%""

echo Starting frontend...
start "GPT Researcher Frontend" /min cmd /c "cd /d "%ROOT%\frontend\nextjs" && npm.cmd run dev -- --hostname 127.0.0.1 --port 3001 1>>"%FRONTEND_OUT%" 2>>"%FRONTEND_ERR%""

echo.
echo Services are starting in background windows.
echo Frontend: http://127.0.0.1:3001
echo Backend : http://127.0.0.1:8000
echo.
echo Logs:
echo   %BACKEND_OUT%
echo   %BACKEND_ERR%
echo   %FRONTEND_OUT%
echo   %FRONTEND_ERR%
echo.

timeout /t 8 >nul

echo Current listening ports:
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ports = 8000,3001; Get-NetTCPConnection -State Listen -LocalPort $ports -ErrorAction SilentlyContinue | Select-Object LocalPort, OwningProcess, State | Format-Table -AutoSize"

echo.
echo First frontend startup may take a little while while Next.js compiles the app.
pause
