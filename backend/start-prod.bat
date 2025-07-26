@echo off
REM Production startup script for TopPlayersofAllSports Backend

echo Starting TopPlayersofAllSports Backend in Production Mode...

REM Set production environment variables
set SPRING_PROFILES_ACTIVE=prod
set DB_USERNAME=postgres
set DB_PASSWORD=postgres
set JWT_SECRET=myProductionSecretKey123456789012345678901234567890abcdef
set API_FOOTBALL_KEY=66c1aa5377826c5b828acae837d61f99
set GEMINI_API_KEY=AIzaSyB23rbdM6jvoVfEmSFT0dcxeCd49vYEau8

REM Optional: Set these if you have them configured
REM set EMAIL_USERNAME=your-email@gmail.com
REM set EMAIL_PASSWORD=your-app-password
REM set REDIS_HOST=localhost
REM set REDIS_PORT=6379
REM set CORS_ORIGINS=https://yourdomain.com,http://localhost:3000

echo Environment: Production
echo Database: PostgreSQL (localhost:5432/topplayersofallsports)
echo Profile: %SPRING_PROFILES_ACTIVE%
echo.

REM Build the application first
echo Building application...
call gradlew.bat build -x test

if %ERRORLEVEL% NEQ 0 (
    echo Build failed!
    pause
    exit /b 1
)

echo Build successful!
echo.

REM Run the application
echo Starting application...
call gradlew.bat bootRun --args="--spring.profiles.active=prod"

pause
