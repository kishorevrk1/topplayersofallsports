# Test User-Driven Player Registration Feature
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Testing Player Registration with AI" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Simple registration
Write-Host "Test 1: Registering Kylian Mbappe..." -ForegroundColor Yellow
Write-Host ""

$request1 = @{
    playerName = "Kylian Mbappe"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Method POST -Uri "http://localhost:8084/api/players/register" -ContentType "application/json" -Body $request1 -ErrorAction Stop
    
    $result = $response.Content | ConvertFrom-Json
    
    if ($result.success) {
        Write-Host "SUCCESS!" -ForegroundColor Green
        Write-Host "  Status: $($result.status)" -ForegroundColor White
        Write-Host "  Message: $($result.message)" -ForegroundColor White
        Write-Host "  Player ID: $($result.playerId)" -ForegroundColor White
        Write-Host "  Sport: $($result.sport)" -ForegroundColor White
        if ($result.aiRating) {
            Write-Host "  AI Rating: $($result.aiRating)/100" -ForegroundColor Yellow
        }
    } else {
        Write-Host "FAILED: $($result.message)" -ForegroundColor Red
        Write-Host "  Error: $($result.errorMessage)" -ForegroundColor Gray
    }
    
    Write-Host ""
    
} catch {
    Write-Host "Request failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

Start-Sleep -Seconds 2

# Test 2: Registration with hints
Write-Host "Test 2: Registering Son with hints..." -ForegroundColor Yellow
Write-Host ""

$request2 = @{
    playerName = "Son"
    team = "Tottenham Hotspur"
    nationality = "South Korea"
    sport = "FOOTBALL"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Method POST -Uri "http://localhost:8084/api/players/register" -ContentType "application/json" -Body $request2 -ErrorAction Stop
    
    $result = $response.Content | ConvertFrom-Json
    
    if ($result.success) {
        Write-Host "SUCCESS!" -ForegroundColor Green
        Write-Host "  Status: $($result.status)" -ForegroundColor White
        Write-Host "  Full Name: $($result.playerName)" -ForegroundColor White
        Write-Host "  Player ID: $($result.playerId)" -ForegroundColor White
    } else {
        Write-Host "FAILED: $($result.message)" -ForegroundColor Red
    }
    
    Write-Host ""
    
} catch {
    Write-Host "Request failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

Start-Sleep -Seconds 2

# Test 3: Duplicate registration
Write-Host "Test 3: Trying to register same player again..." -ForegroundColor Yellow
Write-Host ""

try {
    $response = Invoke-WebRequest -Method POST -Uri "http://localhost:8084/api/players/register" -ContentType "application/json" -Body $request1 -ErrorAction Stop
    
    $result = $response.Content | ConvertFrom-Json
    
    if ($result.status -eq "ALREADY_EXISTS") {
        Write-Host "Correctly identified duplicate!" -ForegroundColor Green
        Write-Host "  Status: $($result.status)" -ForegroundColor White
        Write-Host "  Existing Player ID: $($result.playerId)" -ForegroundColor White
    } else {
        Write-Host "Unexpected status: $($result.status)" -ForegroundColor Yellow
    }
    
    Write-Host ""
    
} catch {
    Write-Host "Request failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Test 4: View stats
Write-Host "Test 4: Viewing all players..." -ForegroundColor Yellow
Write-Host ""

try {
    $statsResponse = Invoke-WebRequest -Uri "http://localhost:8084/api/admin/players/stats" -ErrorAction Stop
    Write-Host $statsResponse.Content -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "Stats failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  How It Works:" -ForegroundColor Cyan
Write-Host "" 
Write-Host "  1. User submits player name" -ForegroundColor White
Write-Host "  2. AI searches and validates" -ForegroundColor White
Write-Host "  3. Fetches real data from API-Sports" -ForegroundColor White
Write-Host "  4. AI generates full profile and rating" -ForegroundColor White
Write-Host "  5. Saves to database" -ForegroundColor White
Write-Host ""
Write-Host "  Try it yourself:" -ForegroundColor Yellow
Write-Host "  POST http://localhost:8084/api/players/register" -ForegroundColor Gray
Write-Host "================================================" -ForegroundColor Cyan
