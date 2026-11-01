@echo off
setlocal
title OPC OS - Paperclip
cd /d "%~dp0"
if errorlevel 1 goto failed

set "OPC_NODE_DIR=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin"
set "OPC_PNPM_DIR=%LOCALAPPDATA%\Paperclip\opc-p0-tools\pnpm9\node_modules\.bin"
set "OPC_GIT_DIR=D:\Program Files\Git"

set "OPC_REQUIRED=%OPC_NODE_DIR%\node.exe"
if not exist "%OPC_REQUIRED%" goto missing
set "OPC_REQUIRED=%OPC_PNPM_DIR%\pnpm.cmd"
if not exist "%OPC_REQUIRED%" goto missing
set "OPC_REQUIRED=%OPC_GIT_DIR%\bin\bash.exe"
if not exist "%OPC_REQUIRED%" goto missing
set "OPC_REQUIRED=%~dp0server\node_modules\tsx\dist\cli.mjs"
if not exist "%OPC_REQUIRED%" goto missing

set "PATH=%OPC_PNPM_DIR%;%OPC_NODE_DIR%;%OPC_GIT_DIR%\usr\bin;%OPC_GIT_DIR%\bin;%PATH%"
set "npm_config_script_shell=%OPC_GIT_DIR%\bin\bash.exe"
set "PAPERCLIP_TELEMETRY_DISABLED=1"
set "DO_NOT_TRACK=1"
set "HOST=127.0.0.1"
set "PORT=3100"
set "PAPERCLIP_BIND=loopback"
set "PAPERCLIP_HOME=%LOCALAPPDATA%\Paperclip\opc-p0-instance"
set "PAPERCLIP_UI_DEV_MIDDLEWARE=true"
set "DATABASE_URL="

echo Repository: %CD%
call "%OPC_NODE_DIR%\node.exe" --version
if errorlevel 1 goto failed
call "%OPC_PNPM_DIR%\pnpm.cmd" --version
if errorlevel 1 goto failed
if /i "%~1"=="--check" exit /b 0

echo Starting Paperclip at http://localhost:3100
echo Data: %PAPERCLIP_HOME%
echo Keep this window open while using Paperclip.
echo.
call "%OPC_PNPM_DIR%\pnpm.cmd" dev:server
if errorlevel 1 goto failed
exit /b 0

:missing
echo ERROR: Required file not found:
echo "%OPC_REQUIRED%"
echo Script: "%~f0"
echo User profile: "%USERPROFILE%"
echo Local app data: "%LOCALAPPDATA%"
echo See doc\plans\opc-p0-local-start.md for setup instructions.
goto failed

:failed
echo.
echo Paperclip did not start or exited with an error. Review the output above.
pause
exit /b 1
