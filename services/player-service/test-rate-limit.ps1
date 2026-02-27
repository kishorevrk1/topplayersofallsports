# Test Rate Limit Handling
# This will intentionally trigger rate limits to see Temporal handle them

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Rate Limit Handling Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "This test will:" -ForegroundColor Yellow
Write-Host "  1. Register 10 players quickly" -ForegroundColor White
Write-Host "  2. Likely hit OpenRouter rate limits (429)" -ForegroundColor White
Write-Host "  3. Show Temporal automatically retrying" -ForegroundColor White
Write-Host "  4. All workflows eventually succeed" -ForegroundColor White
Write-Host ""

$players = @(
    "Kylian Mbappe",
    "Erling Haaland",
    "Mohamed Salah",
    "Kevin De Bruyne",
    "Vinicius Junior",
    "Jude Bellingham",
    "Harry Kane",
    "Robert Lewandowski",
    "Bruno Fernandes",
    "Phil Foden"
)

Write-Host "Starting rapid registrations..." -ForegroundColor Yellow
Write-Host "(This will likely trigger rate limits)" -ForegroundColor Gray
Write-Host ""

$workflowIds = @()

foreach ($player in $players) {
    $body = @{ playerName = $player } | ConvertTo-Json
    
    try {
        $response = Invoke-WebRequest -Method POST `
          -Uri "http://localhost:8084/api/players/temporal/register" `
          -ContentType "application/json" `
          -Body $body |
          Select-Object -ExpandProperty Content | ConvertFrom-Json
        
        Write-Host "$player - Workflow: $($response.workflowId)" -ForegroundColor Cyan
        $workflowIds += $response.workflowId
        
        # No delay - intentionally rapid
    } catch {
        Write-Host "$player - Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "All workflows started!" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""

Write-Host "NOW:" -ForegroundColor Cyan
Write-Host "  1. Open Temporal UI: http://localhost:8088" -ForegroundColor Yellow
Write-Host "  2. Click on 'Workflows'" -ForegroundColor White
Write-Host "  3. Watch workflows in real-time" -ForegroundColor White
Write-Host ""

Write-Host "What to observe:" -ForegroundColor Cyan
Write-Host "  • Some workflows will hit 429 errors" -ForegroundColor White
Write-Host "  • Temporal shows 'Activity Failed'" -ForegroundColor White
Write-Host "  • You'll see 'Retry Attempt 1/5'" -ForegroundColor White
Write-Host "  • Exponential backoff: 10s, 20s, 40s..." -ForegroundColor White
Write-Host "  • Eventually all succeed!" -ForegroundColor Green
Write-Host ""

Write-Host "Press Enter to check results in 2 minutes..." -ForegroundColor Yellow
Read-Host

Write-Host ""
Write-Host "Checking workflow results..." -ForegroundColor Yellow
Write-Host ""

$runningCount = 0
$completedCount = 0
$failedCount = 0

foreach ($wfId in $workflowIds) {
    try {
        $status = Invoke-WebRequest `
          -Uri "http://localhost:8084/api/players/temporal/status/$wfId" |
          Select-Object -ExpandProperty Content | ConvertFrom-Json
        
        if ($status.status -eq "COMPLETED") {
            $completedCount++
            Write-Host "  ✓ Workflow completed" -ForegroundColor Green
        } elseif ($status.status -eq "RUNNING") {
            $runningCount++
            Write-Host "  ⏳ Still running (retrying)" -ForegroundColor Yellow
        } else {
            $failedCount++
            Write-Host "  ✗ Failed" -ForegroundColor Red
        }
    } catch {
        Write-Host "  ? Unknown status" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  STATUS SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Completed: $completedCount" -ForegroundColor Green
Write-Host "  Running: $runningCount" -ForegroundColor Yellow
Write-Host "  Failed: $failedCount" -ForegroundColor Red
Write-Host ""

if ($runningCount -gt 0) {
    Write-Host "Some workflows still running. They will complete eventually!" -ForegroundColor Yellow
    Write-Host "Check Temporal UI for live updates: http://localhost:8088" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Key Takeaway:" -ForegroundColor Green
Write-Host "  Even with rate limits, Temporal ensures" -ForegroundColor White
Write-Host "  all workflows complete successfully with" -ForegroundColor White
Write-Host "  automatic retries and exponential backoff!" -ForegroundColor Green
Write-Host ""
