# PlayerService API Test Script
# Quick test of all API endpoints

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  PlayerService API Testing" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Sync Football Players
Write-Host "[1/4] Syncing 5 football players (this may take 2-3 minutes)..." -ForegroundColor Yellow
try {
    $syncResponse = Invoke-WebRequest -Method POST -Uri "http://localhost:8084/api/admin/players/sync/football?season=2024&playersPerLeague=5" -ErrorAction Stop
    $syncData = $syncResponse.Content | ConvertFrom-Json
    Write-Host "✓ Sync completed!" -ForegroundColor Green
    Write-Host "  Players synced: $($syncData.playersSynced)" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "✗ Sync failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

Start-Sleep -Seconds 2

# Test 2: Get Statistics
Write-Host "[2/4] Getting sync statistics..." -ForegroundColor Yellow
try {
    $statsResponse = Invoke-WebRequest -Uri "http://localhost:8084/api/admin/players/stats" -ErrorAction Stop
    Write-Host "✓ Stats retrieved!" -ForegroundColor Green
    Write-Host ""
    Write-Host $statsResponse.Content -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "✗ Stats failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Test 3: Get Top Players
Write-Host "[3/4] Getting top-rated football players..." -ForegroundColor Yellow
try {
    $topPlayersResponse = Invoke-WebRequest -Uri "http://localhost:8084/api/players/top?sport=FOOTBALL" -ErrorAction Stop
    $topPlayers = $topPlayersResponse.Content | ConvertFrom-Json
    
    if ($topPlayers.Count -gt 0) {
        Write-Host "✓ Found $($topPlayers.Count) top players!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Top 3 Players:" -ForegroundColor Cyan
        
        $topPlayers | Select-Object -First 3 | ForEach-Object {
            Write-Host "  → $($_.player.name) (Rating: $($_.aiRating))" -ForegroundColor White
            Write-Host "    Team: $($_.player.team)" -ForegroundColor Gray
            Write-Host "    Analysis: $($_.analysisText.Substring(0, [Math]::Min(80, $_.analysisText.Length)))..." -ForegroundColor Gray
            Write-Host ""
        }
    } else {
        Write-Host "⚠ No players found yet" -ForegroundColor Yellow
        Write-Host ""
    }
} catch {
    Write-Host "✗ Top players failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Test 4: Search Player
Write-Host "[4/4] Searching for players..." -ForegroundColor Yellow
try {
    $searchResponse = Invoke-WebRequest -Uri "http://localhost:8084/api/players/search?name=a" -ErrorAction Stop
    $searchResults = $searchResponse.Content | ConvertFrom-Json
    
    if ($searchResults.Count -gt 0) {
        Write-Host "✓ Found $($searchResults.Count) players!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Sample players:" -ForegroundColor Cyan
        
        $searchResults | Select-Object -First 5 | ForEach-Object {
            Write-Host "  → $($_.name) - $($_.team) ($($_.position))" -ForegroundColor White
        }
        Write-Host ""
    } else {
        Write-Host "⚠ No players found" -ForegroundColor Yellow
        Write-Host ""
    }
} catch {
    Write-Host "✗ Search failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Testing Complete!" -ForegroundColor Cyan
Write-Host "  Swagger UI: http://localhost:8084/swagger-ui.html" -ForegroundColor White
Write-Host "================================================" -ForegroundColor Cyan
