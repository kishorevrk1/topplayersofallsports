# Test Multiple Player Registrations

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Multiple Player Registration Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$players = @(
    @{ name = "Erling Haaland"; sport = "FOOTBALL"; nationality = "Norway" },
    @{ name = "Mohamed Salah"; sport = "FOOTBALL"; nationality = "Egypt" },
    @{ name = "Kevin De Bruyne"; sport = "FOOTBALL"; nationality = "Belgium" },
    @{ name = "Vinicius Junior"; sport = "FOOTBALL"; nationality = "Brazil" },
    @{ name = "Jude Bellingham"; sport = "FOOTBALL"; nationality = "England" }
)

$workflowIds = @()

Write-Host "Starting registration for $($players.Count) players..." -ForegroundColor Yellow
Write-Host ""

foreach ($player in $players) {
    Write-Host "Registering: $($player.name)..." -ForegroundColor Cyan
    
    $body = $player | ConvertTo-Json
    
    try {
        $response = Invoke-WebRequest -Method POST `
          -Uri "http://localhost:8084/api/players/temporal/register" `
          -ContentType "application/json" `
          -Body $body -ErrorAction Stop |
          Select-Object -ExpandProperty Content | ConvertFrom-Json
        
        Write-Host "  ✓ Workflow started: $($response.workflowId)" -ForegroundColor Green
        $workflowIds += @{
            name = $player.name
            workflowId = $response.workflowId
        }
        
    } catch {
        Write-Host "  ✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Small delay to avoid overwhelming
    Start-Sleep -Seconds 2
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "All workflows started!" -ForegroundColor Green
Write-Host "Waiting for completion (60 seconds)..." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Start-Sleep -Seconds 60

Write-Host "Checking results..." -ForegroundColor Yellow
Write-Host ""

$successCount = 0
$failureCount = 0

foreach ($workflow in $workflowIds) {
    try {
        $result = Invoke-WebRequest `
          -Uri "http://localhost:8084/api/players/temporal/result/$($workflow.workflowId)" |
          Select-Object -ExpandProperty Content | ConvertFrom-Json
        
        if ($result.success) {
            Write-Host "✓ $($workflow.name) - Rating: $($result.aiRating)/100" -ForegroundColor Green
            $successCount++
        } else {
            Write-Host "✗ $($workflow.name) - Failed: $($result.message)" -ForegroundColor Red
            $failureCount++
        }
    } catch {
        Write-Host "✗ $($workflow.name) - Error checking result" -ForegroundColor Red
        $failureCount++
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RESULTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Total: $($players.Count)" -ForegroundColor White
Write-Host "  Success: $successCount" -ForegroundColor Green
Write-Host "  Failed: $failureCount" -ForegroundColor Red
Write-Host ""

Write-Host "View all workflows in Temporal UI:" -ForegroundColor Yellow
Write-Host "http://localhost:8088" -ForegroundColor Cyan
Write-Host ""
