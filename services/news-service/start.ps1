# Quick Start Script for News Service
# Run this to start the news service

Write-Host "🚀 Starting News Service..." -ForegroundColor Green
Write-Host ""

# Check if Maven is installed
if (!(Get-Command mvn -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Maven not found. Please install Maven first." -ForegroundColor Red
    exit 1
}

# Check if PostgreSQL is running
Write-Host "📊 Checking PostgreSQL..." -ForegroundColor Yellow
$pgRunning = docker ps --filter "name=postgres" --filter "status=running" -q
if (!$pgRunning) {
    Write-Host "⚠️  PostgreSQL not running. Starting..." -ForegroundColor Yellow
    docker run -d --name postgres -e POSTGRES_PASSWORD=postgres -p 5433:5432 postgres:14
    Write-Host "✅ PostgreSQL started" -ForegroundColor Green
} else {
    Write-Host "✅ PostgreSQL is running" -ForegroundColor Green
}

# Check if Redis is running
Write-Host "📦 Checking Redis..." -ForegroundColor Yellow
$redisRunning = docker ps --filter "name=redis" --filter "status=running" -q
if (!$redisRunning) {
    Write-Host "⚠️  Redis not running. Starting..." -ForegroundColor Yellow
    docker run -d --name redis -p 6379:6379 redis:6
    Write-Host "✅ Redis started" -ForegroundColor Green
} else {
    Write-Host "✅ Redis is running" -ForegroundColor Green
}

# Check if Temporal is running (optional)
Write-Host "⏰ Checking Temporal..." -ForegroundColor Yellow
$temporalRunning = docker ps --filter "name=temporal" --filter "status=running" -q
if (!$temporalRunning) {
    Write-Host "⚠️  Temporal not running (optional). Skipping..." -ForegroundColor Yellow
} else {
    Write-Host "✅ Temporal is running" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎯 Starting News Service on port 8082..." -ForegroundColor Cyan
Write-Host ""

# Start the service
mvn spring-boot:run

# If Maven fails
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Failed to start News Service" -ForegroundColor Red
    exit 1
}
