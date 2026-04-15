# 🧪 Complete Testing Guide - Player Service

## 🎯 What We're Testing

1. ✅ **Temporal-based Player Registration** (with AI & rate limit handling)
2. ✅ **Player Rating Updates** (scheduled & on-demand)
3. ✅ **AI Analysis** (DeepSeek R1 integration)
4. ✅ **API-Sports Integration** (real player data)
5. ✅ **Workflow Observability** (Temporal UI)

---

## 🚀 Pre-Testing Checklist

### **Step 1: Start Dependencies**

#### ✅ PostgreSQL (Port 5433)
```powershell
# Should already be running
# Verify with:
psql -U postgres -h localhost -p 5433
```

#### ✅ Redis (Port 6379)
```powershell
# Should already be running
# Verify with:
redis-cli ping
# Should respond: PONG
```

#### ✅ Temporal Server (NEW - Port 7233 & 8088)
```powershell
# Start Temporal with Docker
docker run -p 7233:7233 -p 8088:8088 temporalio/auto-setup:latest
```

**Expected Output:**
```
✓ Started Temporal server
✓ Web UI available at http://localhost:8088
✓ gRPC endpoint at localhost:7233
```

**Verify Temporal UI:**
Open browser: **http://localhost:8088**

---

## 🏃 Step 2: Build & Start Player Service

### **Build Project**
```powershell
cd services\player-service
mvn clean install
```

**Expected:** `BUILD SUCCESS`

### **Start Service**
```powershell
mvn spring-boot:run
```

**Look for These Logs:**
```
✓ Started PlayerServiceApplication in X seconds
✓ Tomcat started on port 8084
✓ ✅ Temporal worker started successfully on task queue: player-registration
✓ Worker is ready to process player registration workflows
```

**Verify Service is Running:**
```powershell
Invoke-WebRequest -Uri "http://localhost:8084/actuator/health"
```

Should return: `{"status":"UP"}`

---

## 🧪 Test Suite

### **TEST 1: Player Registration (Async with Temporal)**

This tests the COMPLETE flow:
- AI searches for player
- Validates with DeepSeek R1
- Fetches data from API-Sports
- AI generates rating
- Saves to database

**Run Test:**
```powershell
.\test-player-registration.ps1
```

Or manually:
```powershell
$body = @{
    playerName = "Kylian Mbappe"
    sport = "FOOTBALL"
} | ConvertTo-Json

$response = Invoke-WebRequest -Method POST `
  -Uri "http://localhost:8084/api/players/temporal/register" `
  -ContentType "application/json" `
  -Body $body | 
  Select-Object -ExpandProperty Content | ConvertFrom-Json

Write-Host "Workflow ID: $($response.workflowId)" -ForegroundColor Green
Write-Host "Status: $($response.status)" -ForegroundColor Cyan
Write-Host "Check status at: $($response.statusEndpoint)" -ForegroundColor Yellow
```

**Expected Response:**
```json
{
  "workflowId": "player-reg-abc123",
  "status": "STARTED",
  "message": "Player registration workflow started",
  "playerName": "Kylian Mbappe",
  "statusEndpoint": "/api/players/temporal/status/player-reg-abc123"
}
```

**Check Workflow Status:**
```powershell
$workflowId = "player-reg-abc123"  # From above

Invoke-WebRequest `
  -Uri "http://localhost:8084/api/players/temporal/status/$workflowId" |
  Select-Object -ExpandProperty Content
```

**View in Temporal UI:**
Open: http://localhost:8088
- Click "Workflows"
- Find your workflow ID
- Watch it execute in real-time!

**Get Final Result:**
```powershell
Invoke-WebRequest `
  -Uri "http://localhost:8084/api/players/temporal/result/$workflowId" |
  Select-Object -ExpandProperty Content | ConvertFrom-Json
```

**Expected Final Result:**
```json
{
  "success": true,
  "status": "NEW",
  "playerId": 1,
  "playerName": "Kylian Mbappé Lottin",
  "sport": "FOOTBALL",
  "aiRating": 94,
  "message": "Player successfully registered with AI analysis"
}
```

---

### **TEST 2: View Registered Player**

```powershell
# Get player by ID
Invoke-WebRequest -Uri "http://localhost:8084/api/players/1" |
  Select-Object -ExpandProperty Content | ConvertFrom-Json

# Expected:
{
  "id": 1,
  "name": "Kylian Mbappé Lottin",
  "sport": "FOOTBALL",
  "position": "Forward",
  "currentTeam": "Real Madrid",
  "nationality": "France",
  "age": 25,
  "photoUrl": "https://...",
  "isActive": true,
  "createdAt": "2024-11-30T..."
}
```

---

### **TEST 3: View AI Analysis & Rating**

```powershell
# Get AI analysis for player
Invoke-WebRequest -Uri "http://localhost:8084/api/players/1/analysis" |
  Select-Object -ExpandProperty Content | ConvertFrom-Json

# Expected:
{
  "id": 1,
  "playerId": 1,
  "rating": 94,
  "analysis": "Kylian Mbappé is one of the most electrifying forwards...",
  "strengths": [
    "Elite pace and acceleration",
    "Clinical finishing",
    "Big game performer"
  ],
  "biography": "Born in Paris in 1998...",
  "careerHighlights": [
    "FIFA World Cup Winner (2018)",
    "4× Ligue 1 Champion",
    "Golden Boot 2024"
  ],
  "generatedAt": "2024-11-30T..."
}
```

---

### **TEST 4: Search Players**

```powershell
# Search by name
Invoke-WebRequest -Uri "http://localhost:8084/api/players/search?q=Mbappe" |
  Select-Object -ExpandProperty Content | ConvertFrom-Json

# Search by sport
Invoke-WebRequest -Uri "http://localhost:8084/api/players?sport=FOOTBALL" |
  Select-Object -ExpandProperty Content | ConvertFrom-Json
```

---

### **TEST 5: Get Top Rated Players**

```powershell
# Get top 10 rated players
Invoke-WebRequest -Uri "http://localhost:8084/api/players/top-rated?limit=10" |
  Select-Object -ExpandProperty Content | ConvertFrom-Json

# Expected: List of players sorted by AI rating (highest first)
```

---

### **TEST 6: Rate Limit Handling (The Key Feature!)**

Register multiple players quickly to trigger rate limits:

```powershell
$players = @("Erling Haaland", "Mohamed Salah", "Kevin De Bruyne", "Vinicius Jr")

foreach ($player in $players) {
    $body = @{ playerName = $player } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Method POST `
      -Uri "http://localhost:8084/api/players/temporal/register" `
      -ContentType "application/json" `
      -Body $body | 
      Select-Object -ExpandProperty Content | ConvertFrom-Json
    
    Write-Host "$player - Workflow: $($response.workflowId)" -ForegroundColor Green
    
    # Small delay
    Start-Sleep -Seconds 2
}

Write-Host "`nAll workflows started! Check Temporal UI to see rate limit handling" -ForegroundColor Cyan
Write-Host "http://localhost:8088" -ForegroundColor Yellow
```

**What to Observe:**
1. In Temporal UI, you'll see workflows
2. Some may hit 429 rate limits from OpenRouter
3. Temporal will automatically retry with exponential backoff
4. All will eventually complete successfully!

---

### **TEST 7: Duplicate Player Registration**

Try to register the same player twice:

```powershell
# First registration
$body = @{ playerName = "Lionel Messi" } | ConvertTo-Json
$response1 = Invoke-WebRequest -Method POST `
  -Uri "http://localhost:8084/api/players/temporal/register" `
  -ContentType "application/json" `
  -Body $body

# Wait for completion
Start-Sleep -Seconds 30

# Try again (duplicate)
$response2 = Invoke-WebRequest -Method POST `
  -Uri "http://localhost:8084/api/players/temporal/register" `
  -ContentType "application/json" `
  -Body $body

# Get result of second attempt
$workflow2 = ($response2.Content | ConvertFrom-Json).workflowId
Invoke-WebRequest `
  -Uri "http://localhost:8084/api/players/temporal/result/$workflow2" |
  Select-Object -ExpandProperty Content | ConvertFrom-Json

# Expected:
{
  "success": true,
  "status": "ALREADY_EXISTS",
  "playerId": 2,
  "playerName": "Lionel Messi",
  "message": "Player already registered",
  "aiRating": 98
}
```

---

### **TEST 8: Synchronous Registration (Wait for Result)**

```powershell
$body = @{
    playerName = "Cristiano Ronaldo"
    nationality = "Portugal"
} | ConvertTo-Json

Write-Host "Starting synchronous registration (this will wait)..." -ForegroundColor Yellow

$result = Invoke-WebRequest -Method POST `
  -Uri "http://localhost:8084/api/players/temporal/register-sync" `
  -ContentType "application/json" `
  -Body $body |
  Select-Object -ExpandProperty Content | ConvertFrom-Json

Write-Host "`nRegistration Complete!" -ForegroundColor Green
Write-Host "Player: $($result.playerName)" -ForegroundColor Cyan
Write-Host "Rating: $($result.aiRating)/100" -ForegroundColor Yellow
Write-Host "Status: $($result.status)" -ForegroundColor White
```

---

### **TEST 9: Player Rating Update (On-Demand)**

Update a player's rating with latest stats:

```powershell
# Get current player
$player = Invoke-WebRequest -Uri "http://localhost:8084/api/players/1" |
  Select-Object -ExpandProperty Content | ConvertFrom-Json

Write-Host "Current Rating: $($player.rating)" -ForegroundColor Cyan

# Trigger update
$updateResponse = Invoke-WebRequest -Method POST `
  -Uri "http://localhost:8084/api/players/temporal/update/1" |
  Select-Object -ExpandProperty Content | ConvertFrom-Json

Write-Host "Update Workflow: $($updateResponse.workflowId)" -ForegroundColor Green

# Wait a bit
Start-Sleep -Seconds 20

# Get updated rating
$updated = Invoke-WebRequest -Uri "http://localhost:8084/api/players/1" |
  Select-Object -ExpandProperty Content | ConvertFrom-Json

Write-Host "New Rating: $($updated.rating)" -ForegroundColor Yellow
```

---

### **TEST 10: Swagger UI Exploration**

Open in browser:
```
http://localhost:8084/swagger-ui.html
```

**Explore:**
- Player Controller endpoints
- Temporal Player Controller endpoints
- Admin Controller endpoints

**Try:**
- POST /api/players/temporal/register
- GET /api/players/{id}
- GET /api/players/top-rated
- GET /api/players/temporal/status/{workflowId}

---

## 🎯 Advanced Testing Scenarios

### **Scenario 1: Rate Limit Recovery**

```powershell
# This script simulates hitting rate limits and recovering
.\test-rate-limit-recovery.ps1
```

### **Scenario 2: Concurrent Registrations**

```powershell
# Register 10 players simultaneously
.\test-concurrent-registrations.ps1
```

### **Scenario 3: Service Restart (Workflow Resilience)**

1. Start a player registration
2. While workflow is running, stop service (Ctrl+C)
3. Restart service
4. Workflow should resume from where it left off!

```powershell
# Terminal 1: Start registration
$body = @{ playerName = "Neymar Jr" } | ConvertTo-Json
$response = Invoke-WebRequest -Method POST `
  -Uri "http://localhost:8084/api/players/temporal/register" `
  -ContentType "application/json" `
  -Body $body

# Terminal 2: Kill service after 10 seconds
Start-Sleep -Seconds 10
# Press Ctrl+C on service terminal

# Terminal 2: Restart service
mvn spring-boot:run

# Terminal 1: Check workflow status
# Should resume and complete successfully!
```

---

## 📊 Expected Results Summary

### **Successful Test Run:**

```
✅ Temporal Server Running (http://localhost:8088)
✅ Player Service Running (http://localhost:8084)
✅ Player Registration Working
   └─ AI Search: ✓
   └─ API Fetch: ✓
   └─ AI Rating: ✓
   └─ Database Save: ✓
✅ Rate Limit Handling: Automatic retries working
✅ Duplicate Detection: Working
✅ Workflow Observability: Visible in Temporal UI
✅ Player Rating Updates: Working
✅ Concurrent Workflows: All complete successfully
```

---

## 🐛 Troubleshooting

### **Problem: Temporal worker not starting**
```
Error: Failed to start Temporal worker
```
**Solution:**
```powershell
# Make sure Temporal server is running
docker ps | Select-String "temporal"

# If not running:
docker run -p 7233:7233 -p 8088:8088 temporalio/auto-setup:latest
```

### **Problem: 429 Rate Limit (OpenRouter)**
```
WebClientResponseException$TooManyRequests: 429
```
**Solution:** This is EXPECTED! Temporal will automatically retry. Watch in Temporal UI:
- Workflow shows "Activity Failed"
- "Retry Attempt 1/5"
- Waits 10 seconds
- Retries automatically
- Eventually succeeds!

### **Problem: Player not found in API-Sports**
```
No data found in API-Sports for 'PlayerName'
```
**Solution:** 
- Try a more well-known player (Messi, Ronaldo, Mbappe)
- Check spelling
- Make sure they're active in 2024 season

---

## 🎓 What to Observe

### **In Service Logs:**
```
✓ Temporal workflow started
✓ Activity 1: Searching for player with AI
✓ AI found player: Kylian Mbappé
✓ Activity 2: Checking existing player
✓ Activity 3: Fetching player from API
✓ Successfully fetched player data
✓ Activity 4: Generating AI analysis
✓ AI analysis complete: Rating 94/100
✓ Activity 5: Saving player profile
✓ Player saved with ID: 1
✓ Workflow completed successfully
```

### **In Temporal UI (http://localhost:8088):**
```
✓ Workflow List: See all registrations
✓ Workflow Detail: Click to see execution
✓ Activity Timeline: Visual flow
✓ Retry Attempts: See rate limit retries
✓ Execution History: Every step logged
```

### **In Database:**
```sql
-- Check registered players
SELECT id, name, sport, current_team, nationality, age 
FROM players 
ORDER BY created_at DESC;

-- Check AI ratings
SELECT p.name, a.rating, a.analysis, a.strengths 
FROM players p 
JOIN ai_analysis a ON p.id = a.player_id 
ORDER BY a.rating DESC;
```

---

## 🚀 Next Steps After Testing

1. ✅ Verify all tests pass
2. ✅ Check Temporal UI for successful workflows
3. ✅ Review database for correct data
4. ✅ Test rate limit recovery
5. ✅ Document any issues found

---

## 📝 Test Report Template

After testing, fill this out:

```
DATE: _________________
TESTER: _________________

FEATURE TESTING RESULTS:

✅/❌ Temporal Server Started
✅/❌ Player Service Started  
✅/❌ Player Registration (Async)
✅/❌ Player Registration (Sync)
✅/❌ Rate Limit Handling
✅/❌ Duplicate Detection
✅/❌ AI Search Working
✅/❌ AI Rating Generation
✅/❌ API-Sports Integration
✅/❌ Database Persistence
✅/❌ Workflow Observability
✅/❌ Service Restart Recovery

PERFORMANCE:
- Average Registration Time: _____ seconds
- Rate Limit Recovery Time: _____ seconds
- Concurrent Workflows Tested: _____

NOTES:
_______________________________________
_______________________________________
```

---

**Ready to test? Let's do it!** 🚀
