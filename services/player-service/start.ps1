# Player Service Startup Script
# Port: 8084
# Author: TopPlayersOfAllSports Team
# Description: AI-Powered Top Players Data Aggregation Microservice

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Player Service - AI-Powered Player Data" -ForegroundColor Cyan
Write-Host "  Port: 8084" -ForegroundColor Cyan
Write-Host "  AI: DeepSeek R1 via OpenRouter" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if PostgreSQL is running
Write-Host "[1/5] Checking PostgreSQL..." -ForegroundColor Yellow
$pgStatus = docker ps --filter "name=postgres" --format "{{.Status}}"
if ($pgStatus) {
    Write-Host "✓ PostgreSQL is running" -ForegroundColor Green
} else {
    Write-Host "✗ PostgreSQL is not running!" -ForegroundColor Red
    Write-Host "  Please start PostgreSQL: docker start postgres" -ForegroundColor Yellow
    exit 1
}

# Check if Redis is running
Write-Host "[2/5] Checking Redis..." -ForegroundColor Yellow
$redisStatus = docker ps --filter "name=redis" --format "{{.Status}}"
if ($redisStatus) {
    Write-Host "✓ Redis is running" -ForegroundColor Green
} else {
    Write-Host "✗ Redis is not running!" -ForegroundColor Red
    Write-Host "  Starting Redis..." -ForegroundColor Yellow
    docker run -d --name redis -p 6379:6379 redis:latest
    Start-Sleep -Seconds 3
}

# Check Maven
Write-Host "[3/5] Checking Maven..." -ForegroundColor Yellow
$mavenVersion = mvn -version 2>$null
if ($mavenVersion) {
    Write-Host "✓ Maven is installed" -ForegroundColor Green
} else {
    Write-Host "✗ Maven is not installed!" -ForegroundColor Red
    exit 1
}

# Build the project
Write-Host "[4/5] Building project..." -ForegroundColor Yellow
mvn clean package -DskipTests
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Build successful" -ForegroundColor Green
} else {
    Write-Host "✗ Build failed!" -ForegroundColor Red
    exit 1
}

# Run the service
Write-Host "[5/5] Starting Player Service..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Service URLs:" -ForegroundColor Cyan
Write-Host "  → Health:     http://localhost:8084/actuator/health" -ForegroundColor White
Write-Host "  → Swagger UI: http://localhost:8084/swagger-ui.html" -ForegroundColor White
Write-Host "  → API Docs:   http://localhost:8084/api-docs" -ForegroundColor White
Write-Host ""
Write-Host "Key Endpoints:" -ForegroundColor Cyan
Write-Host "  → GET  /api/players?sport=FOOTBALL" -ForegroundColor White
Write-Host "  → GET  /api/players/top?sport=FOOTBALL" -ForegroundColor White
Write-Host "  → POST /api/admin/players/sync/football" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop the service" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

mvn spring-boot:run
