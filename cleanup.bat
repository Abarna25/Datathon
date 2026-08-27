@echo off
echo Killing stuck node.exe processes...
taskkill /F /IM node.exe
echo Waiting for processes to die...
timeout /t 2 /nobreak > NUL
echo Removing .build directories...
rmdir /s /q "\\?\%~dp0.build"
rmdir /s /q "\\?\%~dp0.build_old"
echo Done! You can now run catalyst serve again.

