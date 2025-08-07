@echo off
echo Building Wordle Game...
echo.

REM Create dist directory
if not exist "dist" mkdir dist

REM Copy files to dist
copy index.html dist\
copy styles.css dist\
copy script.js dist\
copy words.js dist\

echo.
echo ✅ Build complete! Files copied to 'dist' folder.
echo.
echo To run the game:
echo   1. Open dist\index.html in your browser
echo   2. Or serve the dist folder with a web server
echo.
pause