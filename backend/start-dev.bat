@echo off
REM Development startup script for TopPlayersofAllSports Backend

echo Starting TopPlayersofAllSports Backend in Development Mode...

REM Set development environment variables
set SPRING_PROFILES_ACTIVE=dev
set JWT_SECRET=myDevelopmentSecretKey123456789012345678901234567890abcdef
set API_FOOTBALL_KEY=66c1aa5377826c5b828acae837d61f99
set GEMINI_API_KEY=AIzaSyB23rbdM6jvoVfEmSFT0dcxeCd49vYEau8

echo Environment: Development
echo Database: H2 In-Memory
echo Profile: %SPRING_PROFILES_ACTIVE%
echo H2 Console: http://localhost:8080/h2-console
echo API Test: http://localhost:8080/api/test/status
echo.

REM Clean and build the application
echo Building application...
call gradlew.bat clean build -x test

if %ERRORLEVEL% NEQ 0 (
    echo Build failed!
    pause
    exit /b 1
)

echo Build successful!
echo.

REM Run the application
echo Starting application...
echo Access points will be:
echo - API Base: http://localhost:8080/api
echo - H2 Console: http://localhost:8080/h2-console
echo - Health Check: http://localhost:8080/actuator/health
echo - Test Status: http://localhost:8080/api/test/status
echo.

call gradlew.bat bootRun

pause
