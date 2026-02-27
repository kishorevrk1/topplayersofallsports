# 🚀 AUTOMATED TOP 50 RANKING SYSTEM - QUICK START
# This script sets up and initializes the ranking system automatically

Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host   "║    TOP 50 RANKING SYSTEM - AUTOMATED INITIALIZATION       ║" -ForegroundColor Cyan
Write-Host   "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Step 1: Check Prerequisites
Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow

# Check if Temporal is running
try {
    $temporalCheck = Test-NetConnection -ComputerName localhost -Port 7233 -WarningAction SilentlyContinue
    if ($temporalCheck.TcpTestSucceeded) {
        Write-Host "✅ Temporal server is running on port 7233" -ForegroundColor Green
    } else {
        throw "Temporal not running"
    }
} catch {
    Write-Host "❌ Temporal server not running!" -ForegroundColor Red
    Write-Host "Starting Temporal server..." -ForegroundColor Yellow
    docker run -d -p 7233:7233 -p 8080:8080 --name temporal temporalio/auto-setup:latest
    Write-Host "⏳ Waiting 10 seconds for Temporal to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
}

# Check if PostgreSQL is running
try {
    $pgCheck = Test-NetConnection -ComputerName localhost -Port 5433 -WarningAction SilentlyContinue
    if ($pgCheck.TcpTestSucceeded) {
        Write-Host "✅ PostgreSQL is running on port 5433" -ForegroundColor Green
    } else {
        throw "PostgreSQL not running"
    }
} catch {
    Write-Host "❌ PostgreSQL not running!" -ForegroundColor Red
    Write-Host "Please start PostgreSQL first" -ForegroundColor Yellow
    exit 1
}

# Step 2: Run Database Migration
Write-Host "`n📊 Running database migration..." -ForegroundColor Yellow

docker exec -it highlights-postgres psql -U postgres -d topplayersofallsports -c "
ALTER TABLE players ADD COLUMN IF NOT EXISTS current_rank INTEGER;
ALTER TABLE players ADD COLUMN IF NOT EXISTS previous_rank INTEGER;
ALTER TABLE players ADD COLUMN IF NOT EXISTS ranking_score DOUBLE PRECISION;
ALTER TABLE players ADD COLUMN IF NOT EXISTS last_ranking_update TIMESTAMP;
ALTER TABLE players ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE players ADD COLUMN IF NOT EXISTS performance_summary TEXT;

CREATE INDEX IF NOT EXISTS idx_player_ranking ON players(sport, current_rank);
CREATE INDEX IF NOT EXISTS idx_player_active ON players(sport, is_active, current_rank);
UPDATE players SET is_active = true WHERE is_active IS NULL;
" | Out-Null

Write-Host "✅ Database migration complete" -ForegroundColor Green

# Step 3: Ask user preference
Write-Host "`n🎯 Choose initialization method:" -ForegroundColor Cyan
Write-Host "  1. Auto-initialize on startup (Recommended)" -ForegroundColor White
Write-Host "  2. Manual trigger after service starts" -ForegroundColor White
$choice = Read-Host "`nEnter choice (1 or 2)"

if ($choice -eq "1") {
    # Enable auto-initialization
    Write-Host "`n✅ Enabling auto-initialization in application.yml..." -ForegroundColor Yellow
    
    $ymlPath = "src\main\resources\application.yml"
    $ymlContent = Get-Content $ymlPath -Raw
    $ymlContent = $ymlContent -replace "auto-initialize: false", "auto-initialize: true"
    Set-Content -Path $ymlPath -Value $ymlContent
    
    Write-Host "✅ Auto-initialization enabled!" -ForegroundColor Green
    Write-Host "`n🚀 Starting service..." -ForegroundColor Cyan
    Write-Host "   The ranking system will auto-initialize 30 seconds after startup." -ForegroundColor Yellow
    Write-Host "   This will take 15-20 minutes to process all 250 players." -ForegroundColor Yellow
    Write-Host "`n📊 Monitor progress in the logs below:`n" -ForegroundColor Cyan
    
    # Start service
    mvn spring-boot:run
    
} else {
    Write-Host "`n🚀 Starting service..." -ForegroundColor Cyan
    Write-Host "   Service will start WITHOUT auto-initialization." -ForegroundColor Yellow
    Write-Host "   You can manually trigger initialization after startup." -ForegroundColor Yellow
    
    # Start service in new window
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; mvn spring-boot:run"
    
    Write-Host "`n⏳ Waiting 40 seconds for service to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 40
    
    Write-Host "`n🎯 Triggering manual initialization for ALL sports..." -ForegroundColor Cyan
    
    try {
        $response = Invoke-WebRequest -Method POST `
          -Uri "http://localhost:8084/api/admin/players/rankings/initialize-all" `
          | ConvertFrom-Json
        
        Write-Host "`n✅ Initialization workflow started!" -ForegroundColor Green
        Write-Host "   Workflow ID: $($response.workflowId)" -ForegroundColor Cyan
        Write-Host "   Sports: $($response.sports -join ', ')" -ForegroundColor White
        Write-Host "   Estimated time: $($response.estimatedTime)" -ForegroundColor Yellow
        Write-Host "`n📊 Monitor progress:" -ForegroundColor Cyan
        Write-Host "   - Application logs (other window)" -ForegroundColor White
        Write-Host "   - Temporal UI: http://localhost:8080" -ForegroundColor White
        
        Write-Host "`n⏳ Waiting for completion..." -ForegroundColor Yellow
        Write-Host "   This script will check status every 2 minutes.`n" -ForegroundColor Gray
        
        # Poll for completion
        $maxWaitMinutes = 25
        $checkIntervalSeconds = 120
        $elapsed = 0
        
        while ($elapsed -lt ($maxWaitMinutes * 60)) {
            Start-Sleep -Seconds $checkIntervalSeconds
            $elapsed += $checkIntervalSeconds
            
            Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Checking progress... ($([math]::Round($elapsed/60, 1)) minutes elapsed)" -ForegroundColor Gray
            
            # Check database for progress
            $sportsCounted = docker exec highlights-postgres psql -U postgres -d topplayersofallsports -t -c "
            SELECT COUNT(DISTINCT sport) FROM players WHERE current_rank IS NOT NULL;
            " 2>$null
            
            if ($sportsCounted -match '\d+') {
                $sportsComplete = [int]$sportsCounted.Trim()
                Write-Host "   Progress: $sportsComplete/5 sports completed" -ForegroundColor Cyan
                
                if ($sportsComplete -eq 5) {
                    Write-Host "`n✅ ALL SPORTS COMPLETED!" -ForegroundColor Green
                    break
                }
            }
        }
        
        # Show final results
        Write-Host "`n📊 FINAL RESULTS:" -ForegroundColor Green
        docker exec highlights-postgres psql -U postgres -d topplayersofallsports -c "
        SELECT 
          sport,
          COUNT(CASE WHEN current_rank IS NOT NULL THEN 1 END) as top_50_count,
          MIN(current_rank) as best,
          MAX(current_rank) as worst
        FROM players 
        GROUP BY sport
        ORDER BY sport;
        "
        
        Write-Host "`n🎉 Initialization complete! Your database now has 250 elite athletes!" -ForegroundColor Green
        Write-Host "`nView top 10 per sport:" -ForegroundColor Cyan
        Write-Host "  GET http://localhost:8084/api/admin/players/rankings/top50/football" -ForegroundColor White
        Write-Host "  GET http://localhost:8084/api/admin/players/rankings/top50/basketball" -ForegroundColor White
        Write-Host "  GET http://localhost:8084/api/admin/players/rankings/top50/cricket" -ForegroundColor White
        Write-Host "  GET http://localhost:8084/api/admin/players/rankings/top50/tennis" -ForegroundColor White
        Write-Host "  GET http://localhost:8084/api/admin/players/rankings/top50/mma`n" -ForegroundColor White
        
    } catch {
        Write-Host "`n❌ Failed to trigger initialization: $_" -ForegroundColor Red
        Write-Host "   Make sure service is running on port 8084" -ForegroundColor Yellow
    }
}
