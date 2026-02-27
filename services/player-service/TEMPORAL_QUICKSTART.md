# 🚀 Temporal Player Registration - Quick Start Guide

## ✅ What's Been Implemented

### Complete Temporal Integration
1. **Workflow** - `PlayerRegistrationWorkflow` with 5 orchestrated steps
2. **Activities** - `PlayerRegistrationActivitiesImpl` with retry policies
3. **Configuration** - `TemporalConfig` with automatic worker startup
4. **Controller** - `TemporalPlayerController` with async/sync endpoints
5. **Dependencies** - Temporal SDK added to `pom.xml`

---

## 🎯 Prerequisites

### 1. Start Temporal Server (Required!)

**Option A: Docker (Recommended)**
```powershell
docker run -p 7233:7233 -p 8088:8088 temporalio/auto-setup:latest
```

**Option B: Temporal CLI**
```powershell
temporal server start-dev
```

**Verify Temporal is Running:**
- Server: `http://localhost:7233`
- UI: `http://localhost:8088`

### 2. Build Updated Service
```powershell
cd services\player-service
mvn clean install
```

### 3. Start Player Service
```powershell
mvn spring-boot:run
```

**Look for this in logs:**
```
✅ Temporal worker started successfully on task queue: player-registration
Worker is ready to process player registration workflows
```

---

## 🧪 Testing the Temporal Workflow

### Test 1: Async Registration (Recommended)

Register a player and get workflow ID immediately:

```powershell
$body = @{
    playerName = "Erling Haaland"
} | ConvertTo-Json

$response = Invoke-WebRequest -Method POST `
  -Uri "http://localhost:8084/api/players/temporal/register" `
  -ContentType "application/json" `
  -Body $body | 
  Select-Object -ExpandProperty Content | ConvertFrom-Json

Write-Host "Workflow ID: $($response.workflowId)"
Write-Host "Status: $($response.status)"
```

**Response:**
```json
{
  "workflowId": "player-reg-abc-123",
  "status": "STARTED",
  "message": "Player registration workflow started",
  "statusEndpoint": "/api/players/temporal/status/player-reg-abc-123"
}
```

### Test 2: Check Workflow Status

```powershell
$workflowId = "player-reg-abc-123"  # From previous response

$status = Invoke-WebRequest `
  -Uri "http://localhost:8084/api/players/temporal/status/$workflowId" |
  Select-Object -ExpandProperty Content | ConvertFrom-Json

Write-Host "Status: $($status.status)"
Write-Host "Description: $($status.description)"
```

### Test 3: Get Final Result

```powershell
$result = Invoke-WebRequest `
  -Uri "http://localhost:8084/api/players/temporal/result/$workflowId" |
  Select-Object -ExpandProperty Content | ConvertFrom-Json

Write-Host "Success: $($result.success)"
Write-Host "Player: $($result.playerName)"
Write-Host "Rating: $($result.aiRating)/100"
```

### Test 4: Synchronous Registration (Waits for Completion)

⚠️ **Warning:** This blocks until workflow completes (may take minutes)

```powershell
$body = @{
    playerName = "Lionel Messi"
    sport = "FOOTBALL"
} | ConvertTo-Json

$result = Invoke-WebRequest -Method POST `
  -Uri "http://localhost:8084/api/players/temporal/register-sync" `
  -ContentType "application/json" `
  -Body $body |
  Select-Object -ExpandProperty Content | ConvertFrom-Json

Write-Host "Player registered: $($result.playerName)"
Write-Host "AI Rating: $($result.aiRating)/100"
```

---

## 📊 Monitoring with Temporal UI

### Open Temporal Web UI
```
http://localhost:8088
```

### What You Can See:

1. **Active Workflows**
   - Currently running registrations
   - Which activity is executing
   - Time elapsed

2. **Workflow History**
   - Every step executed
   - Retry attempts
   - Input/output of each activity

3. **Failed Workflows**
   - Error details
   - Stack traces
   - Retry history

4. **Performance Metrics**
   - Workflow duration
   - Activity execution times
   - Success/failure rates

---

## 🔄 How Rate Limits are Handled

### Example Scenario: OpenRouter Rate Limit

```
1. User: POST /api/players/temporal/register {"playerName": "Mbappe"}
2. Workflow: Start
3. Activity 1: searchPlayerWithAI
4. OpenRouter: 429 Too Many Requests
5. Temporal: Caught error, wait 10 seconds
6. Activity 1: Retry searchPlayerWithAI
7. OpenRouter: 429 again
8. Temporal: Wait 20 seconds (exponential backoff)
9. Activity 1: Retry searchPlayerWithAI
10. OpenRouter: SUCCESS!
11. Activity 2: checkExistingPlayer (continues...)
```

**User sees:**
- Immediate response with workflow ID
- Can check status anytime
- Eventually gets SUCCESS result

---

## 🛠️ Comprehensive Test Script

Create `test-temporal.ps1`:

```powershell
# Temporal Player Registration Test Script

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Temporal Player Registration Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Register Player (Async)
Write-Host "Test 1: Async Player Registration" -ForegroundColor Yellow
Write-Host ""

$body = @{
    playerName = "Kevin De Bruyne"
    team = "Manchester City"
    nationality = "Belgium"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Method POST `
      -Uri "http://localhost:8084/api/players/temporal/register" `
      -ContentType "application/json" `
      -Body $body -ErrorAction Stop |
      Select-Object -ExpandProperty Content | ConvertFrom-Json
    
    $workflowId = $response.workflowId
    
    Write-Host "SUCCESS: Workflow started" -ForegroundColor Green
    Write-Host "  Workflow ID: $workflowId" -ForegroundColor White
    Write-Host "  Player: $($response.playerName)" -ForegroundColor White
    Write-Host ""
    
    # Wait a bit
    Write-Host "Waiting 5 seconds..." -ForegroundColor Gray
    Start-Sleep -Seconds 5
    
    # Test 2: Check Status
    Write-Host "Test 2: Checking Workflow Status" -ForegroundColor Yellow
    Write-Host ""
    
    $status = Invoke-WebRequest `
      -Uri "http://localhost:8084/api/players/temporal/status/$workflowId" |
      Select-Object -ExpandProperty Content | ConvertFrom-Json
    
    Write-Host "  Status: $($status.status)" -ForegroundColor Cyan
    Write-Host "  Description: $($status.description)" -ForegroundColor White
    Write-Host ""
    
    # Test 3: Wait for completion and get result
    Write-Host "Test 3: Waiting for workflow completion..." -ForegroundColor Yellow
    Write-Host "(This may take 30-60 seconds with AI calls)" -ForegroundColor Gray
    Write-Host ""
    
    $result = Invoke-WebRequest `
      -Uri "http://localhost:8084/api/players/temporal/result/$workflowId" |
      Select-Object -ExpandProperty Content | ConvertFrom-Json
    
    if ($result.success) {
        Write-Host "SUCCESS: Player Registered!" -ForegroundColor Green
        Write-Host "  Player ID: $($result.playerId)" -ForegroundColor White
        Write-Host "  Name: $($result.playerName)" -ForegroundColor White
        Write-Host "  Sport: $($result.sport)" -ForegroundColor White
        Write-Host "  AI Rating: $($result.aiRating)/100" -ForegroundColor Yellow
    } else {
        Write-Host "FAILED: $($result.message)" -ForegroundColor Red
        Write-Host "  Error: $($result.errorMessage)" -ForegroundColor Gray
    }
    
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  View workflow in Temporal UI:" -ForegroundColor Cyan
Write-Host "  http://localhost:8088" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
```

---

## 🔍 Troubleshooting

### Error: "Failed to start Temporal worker"

**Problem:** Temporal server not running

**Solution:**
```powershell
# Start Temporal server
docker run -p 7233:7233 -p 8088:8088 temporalio/auto-setup:latest
```

### Error: "Workflow not found"

**Problem:** Workflow ID incorrect or expired

**Solution:**
- Check workflow ID from registration response
- Workflows older than 7 days may be archived

### Workflow Stuck at "RUNNING"

**Possible Causes:**
1. **Rate Limit** - Temporal is retrying with backoff
   - Check Temporal UI for retry attempts
   - Wait for exponential backoff to complete

2. **API Down** - External API unreachable
   - Check service logs
   - View activity errors in Temporal UI

3. **Worker Crashed** - Restart player-service
   ```powershell
   mvn spring-boot:run
   ```

### Rate Limit Still Hitting

**Temporal won't solve exhausted quotas, but it will:**
- Retry automatically
- Wait between attempts
- Eventually succeed when quota resets

**Immediate Solutions:**
1. Wait for OpenRouter quota to reset (hourly/daily)
2. Use paid tier for higher limits
3. Test with mock mode

---

## 📈 Advantages Over Direct API Calls

| Feature | Direct API Call | Temporal Workflow |
|---------|----------------|-------------------|
| **Retry on 429** | Manual handling | Automatic with backoff |
| **Service Restart** | Loses progress | Resumes from last step |
| **Observability** | Logs only | Full UI with history |
| **Long-Running** | Connection timeout | Runs for hours/days |
| **Error Handling** | Try-catch | Built-in compensation |
| **Scalability** | Single instance | Multiple workers |

---

## 🎯 Real Production Example

### Scenario: 1000 Player Registrations

**Without Temporal:**
```
- Start bulk registration
- Hit rate limit after 10 players
- Manual retry needed
- Service restart = lose all progress
- No visibility into failures
```

**With Temporal:**
```
- Start 1000 workflows
- Rate limits hit → automatic retry
- Service restart → all workflows resume
- Temporal UI shows: 
  - 500 completed
  - 300 in progress
  - 200 waiting (rate limit)
- Gradual completion over hours
- Zero data loss
```

---

## 🚀 Next Steps

1. **Test the workflow** with the scripts above
2. **View Temporal UI** to see orchestration in action
3. **Monitor rate limit handling** in real-time
4. **Scale horizontally** by adding more workers
5. **Implement for other sports** beyond football

---

## 📚 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/players/temporal/register` | POST | Start async workflow |
| `/api/players/temporal/register-sync` | POST | Wait for completion |
| `/api/players/temporal/status/{id}` | GET | Check workflow status |
| `/api/players/temporal/result/{id}` | GET | Get final result (blocks) |

---

**🎉 Your player registration is now bulletproof with Temporal!**

View workflows: http://localhost:8088
