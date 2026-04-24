@echo off
cd /d "%~dp0"

echo Checking website changes...
git status

echo.
git add .

git diff --cached --quiet
if %errorlevel%==0 (
  echo No changes detected. Nothing to push.
  pause
  exit
)

set /p msg=Enter update message: 

git commit -m "%msg%"
git pull --rebase
git push

echo.
echo Done. Website updated.
pause