# Test Player Data Enrichment via Temporal

Write-Host "`n=== TESTING PLAYER DATA ENRICHMENT SYSTEM ===`n" -ForegroundColor Cyan

# Setup credentials
$cred = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("admin:admin123"))
$headers = @{Authorization = "Basic $cred"}

Write-Host "Checking current data quality..." -ForegroundColor Yellow
docker exec highlights-postgres psql -U postgres -d topplayersofallsports -c "SELECT sport, COUNT(*) as total, COUNT(height) as has_height, COUNT(weight) as has_weight, COUNT(birthdate) as has_birthdate FROM players GROUP BY sport;" | Out-Host

Write-Host "`nTriggering enrichment for ALL players..." -ForegroundColor Green

try {
    $response = Invoke-WebRequest -Method POST -Uri "http://localhost:8084/api/admin/players/enrich/all" -Headers $headers
    $result = $response.Content | ConvertFrom-Json
    
    Write-Host "[SUCCESS] Enrichment workflow started!" -ForegroundColor Green
    Write-Host "   Workflow ID: $($result.workflowId)" -ForegroundColor Cyan
    Write-Host "   Status: $($result.message)" -ForegroundColor White
    Write-Host "   Estimated time: $($result.estimatedTime)`n" -ForegroundColor Yellow
    
    Write-Host "Waiting 60 seconds for enrichment to process..." -ForegroundColor Yellow
    Start-Sleep -Seconds 60
    
    Write-Host "`nChecking updated data quality..." -ForegroundColor Yellow
    docker exec highlights-postgres psql -U postgres -d topplayersofallsports -c "SELECT sport, COUNT(*) as total, COUNT(height) as has_height, COUNT(weight) as has_weight, COUNT(birthdate) as has_birthdate FROM players GROUP BY sport;" | Out-Host
    
    Write-Host "`nSample enriched data for first player:" -ForegroundColor Cyan
    docker exec highlights-postgres psql -U postgres -d topplayersofallsports -c "SELECT name, height, weight, birthdate, birthplace FROM players WHERE sport = 'FOOTBALL' LIMIT 1;" | Out-Host
    
} catch {
    Write-Host "[ERROR] $_" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        Write-Host "Error details: $errorBody" -ForegroundColor Red
    }
}
