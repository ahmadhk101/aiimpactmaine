@echo off
cd /d "%~dp0"

echo Checking website changes...
git status

echo.
set /p msg=Enter update message: 

git add .
git commit -m "%msg%"
git push

echo.
echo Done. Website update pushed.
pause