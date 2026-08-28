@echo off
echo Killing stuck node.exe processes...
taskkill /F /IM node.exe > NUL 2>&1
powershell -Command "Start-Sleep -Seconds 1; if (Test-Path '.build') { Remove-Item -Recurse -Force '.build' }; if (Test-Path '.build_old') { Remove-Item -Recurse -Force '.build_old' }"
echo Done! You can now run catalyst serve again.



