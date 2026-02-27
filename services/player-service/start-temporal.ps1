# Start Temporal Server with Docker

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting Temporal Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Checking if Docker is running..." -ForegroundColor Yellow

try {
    $dockerCheck = docker ps 2>&1
    Write-Host "✓ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker is not running" -ForegroundColor Red
    Write-Host "Please start Docker Desktop first" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Starting Temporal server..." -ForegroundColor Yellow
Write-Host "(This may take a minute on first run)" -ForegroundColor Gray
Write-Host ""

docker run -d `
  -p 7233:7233 `
  -p 8088:8088 `
  --name temporal-dev `
  temporalio/auto-setup:latest

Write-Host ""
Write-Host "Waiting for Temporal to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✓ Temporal Server Started!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Access Temporal Web UI:" -ForegroundColor Yellow
Write-Host "  http://localhost:8088" -ForegroundColor Cyan
Write-Host ""
Write-Host "gRPC endpoint:" -ForegroundColor Yellow
Write-Host "  localhost:7233" -ForegroundColor Cyan
Write-Host ""
Write-Host "To stop Temporal:" -ForegroundColor Yellow
Write-Host "  docker stop temporal-dev" -ForegroundColor White
Write-Host "  docker rm temporal-dev" -ForegroundColor White
Write-Host ""
Write-Host "Next step:" -ForegroundColor Yellow
Write-Host "  Start player-service with: mvn spring-boot:run" -ForegroundColor White
Write-Host ""
