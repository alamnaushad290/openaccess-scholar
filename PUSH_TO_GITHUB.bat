@echo off
title Push OpenAccess Scholar to GitHub
color 0A

echo ===================================================
echo   Pushing OpenAccess Scholar to GitHub...
echo ===================================================
echo.

set "PATH=C:\Users\alamn\AppData\Local\Programs\MinGit\cmd;C:\Users\alamn\AppData\Local\Programs\MinGit\mingw64\bin;%PATH%"
cd /d d:\test

echo Running: git push -u origin main
echo (If a browser window appears, click "Sign in with your browser" / "Authorize")
echo.

git push -u origin main

echo.
echo ===================================================
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Code successfully pushed to GitHub!
    echo Visit: https://github.com/alamnaushad290/openaccess-scholar
) else (
    echo [NOTE] If you were prompted for credentials or it closed, please check the message above.
)
echo ===================================================
echo.
pause
