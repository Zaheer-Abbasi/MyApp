@echo off
echo.
echo 🔄 Removing old build (dist folder)...
rmdir /s /q dist

echo.
echo 🚀 Starting new build...
npm run dist

echo.
echo ✅ Build process completed. Check the dist folder for your EXE.
pause
