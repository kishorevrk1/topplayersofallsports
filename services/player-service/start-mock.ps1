# Start PlayerService in MOCK mode (no API calls)
# Useful when API rate limits are reached

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Player Service - MOCK MODE" -ForegroundColor Yellow
Write-Host "  Port: 8084" -ForegroundColor Cyan
Write-Host "  Using mock data (no API calls)" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check PostgreSQL
Write-Host "[1/3] Checking PostgreSQL..." -ForegroundColor Yellow
$pgStatus = docker ps --filter "name=postgres" --format "{{.Status}}"
if ($pgStatus) {
    Write-Host "✓ PostgreSQL is running" -ForegroundColor Green
} else {
    Write-Host "✗ PostgreSQL is not running!" -ForegroundColor Red
    exit 1
}

# Check Redis
Write-Host "[2/3] Checking Redis..." -ForegroundColor Yellow
$redisStatus = docker ps --filter "name=redis" --format "{{.Status}}"
if ($redisStatus) {
    Write-Host "✓ Redis is running" -ForegroundColor Green
} else {
    Write-Host "⚠ Redis not running. Starting..." -ForegroundColor Yellow
    docker run -d --name redis -p 6379:6379 redis:latest
}

Write-Host "[3/3] Starting in MOCK mode..." -ForegroundColor Yellow
Write-Host ""
Write-Host "MOCK MODE Features:" -ForegroundColor Yellow
Write-Host "  • No real API calls to API-Sports.io" -ForegroundColor White
Write-Host "  • Generates realistic mock player data" -ForegroundColor White
Write-Host "  • AI analysis still uses real DeepSeek R1" -ForegroundColor White
Write-Host "  • Perfect for testing without rate limits" -ForegroundColor White
Write-Host ""
Write-Host "Test URL:" -ForegroundColor Cyan
Write-Host "  http://localhost:8084/api/admin/players/sync/football?season=2023&playersPerLeague=5" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Set mock profile and run
$env:SPRING_PROFILES_ACTIVE = "mock"
mvn spring-boot:run -Dspring-boot.run.profiles=mock
