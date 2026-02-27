# Complete Player Registration Test Script

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Player Registration Test Suite" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check service health
Write-Host "Checking service health..." -ForegroundColor Yellow
try {
    $health = Invoke-WebRequest -Uri "http://localhost:8084/actuator/health" -ErrorAction Stop
    Write-Host "✓ Service is UP" -ForegroundColor Green
} catch {
    Write-Host "✗ Service is DOWN" -ForegroundColor Red
    Write-Host "Please start the service with: mvn spring-boot:run" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Test 1: Register Kylian Mbappe
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TEST 1: Register Player (Async)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Registering: Kylian Mbappe" -ForegroundColor Yellow

$body = @{
    playerName = "Kylian Mbappe"
    sport = "FOOTBALL"
    nationality = "France"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Method POST `
      -Uri "http://localhost:8084/api/players/temporal/register" `
      -ContentType "application/json" `
      -Body $body -ErrorAction Stop |
      Select-Object -ExpandProperty Content | ConvertFrom-Json
    
    Write-Host "✓ Workflow Started" -ForegroundColor Green
    Write-Host "  Workflow ID: $($response.workflowId)" -ForegroundColor White
    Write-Host "  Status: $($response.status)" -ForegroundColor Cyan
    Write-Host "  Player: $($response.playerName)" -ForegroundColor White
    Write-Host ""
    
    $workflowId = $response.workflowId
    
    # Check status
    Write-Host "Checking workflow status..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3
    
    $status = Invoke-WebRequest `
      -Uri "http://localhost:8084/api/players/temporal/status/$workflowId" |
      Select-Object -ExpandProperty Content | ConvertFrom-Json
    
    Write-Host "  Status: $($status.status)" -ForegroundColor Cyan
    Write-Host "  $($status.description)" -ForegroundColor Gray
    Write-Host ""
    
    # Wait for completion
    Write-Host "Waiting for workflow to complete (may take 30-60 seconds)..." -ForegroundColor Yellow
    Write-Host "(This includes AI search, API fetch, and AI rating)" -ForegroundColor Gray
    Write-Host ""
    
    $result = Invoke-WebRequest `
      -Uri "http://localhost:8084/api/players/temporal/result/$workflowId" |
      Select-Object -ExpandProperty Content | ConvertFrom-Json
    
    if ($result.success) {
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "  ✓ REGISTRATION SUCCESSFUL!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "  Player ID: $($result.playerId)" -ForegroundColor White
        Write-Host "  Name: $($result.playerName)" -ForegroundColor White
        Write-Host "  Sport: $($result.sport)" -ForegroundColor White
        Write-Host "  AI Rating: $($result.aiRating)/100" -ForegroundColor Yellow
        Write-Host "  Status: $($result.status)" -ForegroundColor Cyan
        Write-Host ""
        
        # Fetch full player details
        Write-Host "Fetching complete player details..." -ForegroundColor Yellow
        $playerId = $result.playerId
        $player = Invoke-WebRequest -Uri "http://localhost:8084/api/players/$playerId" |
          Select-Object -ExpandProperty Content | ConvertFrom-Json
        
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "  PLAYER DETAILS" -ForegroundColor Cyan
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "  Name: $($player.name)" -ForegroundColor White
        Write-Host "  Position: $($player.position)" -ForegroundColor White
        Write-Host "  Team: $($player.currentTeam)" -ForegroundColor White
        Write-Host "  Nationality: $($player.nationality)" -ForegroundColor White
        Write-Host "  Age: $($player.age)" -ForegroundColor White
        Write-Host ""
        
        # Fetch AI analysis
        Write-Host "Fetching AI analysis..." -ForegroundColor Yellow
        $analysis = Invoke-WebRequest -Uri "http://localhost:8084/api/players/$playerId/analysis" |
          Select-Object -ExpandProperty Content | ConvertFrom-Json
        
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "  AI ANALYSIS" -ForegroundColor Cyan
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "  Rating: $($analysis.rating)/100" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "  Strengths:" -ForegroundColor Green
        foreach ($strength in $analysis.strengths) {
            Write-Host "    • $strength" -ForegroundColor White
        }
        Write-Host ""
        Write-Host "  Career Highlights:" -ForegroundColor Green
        foreach ($highlight in $analysis.careerHighlights) {
            Write-Host "    • $highlight" -ForegroundColor White
        }
        Write-Host ""
        Write-Host "  Analysis:" -ForegroundColor Green
        Write-Host "  $($analysis.analysis.Substring(0, [Math]::Min(200, $analysis.analysis.Length)))..." -ForegroundColor Gray
        Write-Host ""
        
    } else {
        Write-Host "✗ REGISTRATION FAILED" -ForegroundColor Red
        Write-Host "  Status: $($result.status)" -ForegroundColor White
        Write-Host "  Message: $($result.message)" -ForegroundColor Gray
        Write-Host "  Error: $($result.errorMessage)" -ForegroundColor Red
    }
    
} catch {
    Write-Host "✗ Test Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  View workflow in Temporal UI:" -ForegroundColor Cyan
Write-Host "  http://localhost:8088" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 2: Try duplicate registration
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TEST 2: Duplicate Registration Check" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Attempting to register same player again..." -ForegroundColor Yellow

try {
    $response2 = Invoke-WebRequest -Method POST `
      -Uri "http://localhost:8084/api/players/temporal/register" `
      -ContentType "application/json" `
      -Body $body -ErrorAction Stop |
      Select-Object -ExpandProperty Content | ConvertFrom-Json
    
    $workflowId2 = $response2.workflowId
    Write-Host "  Workflow ID: $workflowId2" -ForegroundColor White
    
    Start-Sleep -Seconds 5
    
    $result2 = Invoke-WebRequest `
      -Uri "http://localhost:8084/api/players/temporal/result/$workflowId2" |
      Select-Object -ExpandProperty Content | ConvertFrom-Json
    
    if ($result2.status -eq "ALREADY_EXISTS") {
        Write-Host "✓ Duplicate Detection Working!" -ForegroundColor Green
        Write-Host "  Status: $($result2.status)" -ForegroundColor Cyan
        Write-Host "  Existing Player ID: $($result2.playerId)" -ForegroundColor White
    } else {
        Write-Host "⚠ Unexpected status: $($result2.status)" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "⚠ Duplicate test error: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  TEST SUITE COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. View workflows: http://localhost:8088" -ForegroundColor White
Write-Host "  2. Try more players with: .\test-multiple-players.ps1" -ForegroundColor White
Write-Host "  3. Test rate limits with: .\test-rate-limit.ps1" -ForegroundColor White
Write-Host ""
