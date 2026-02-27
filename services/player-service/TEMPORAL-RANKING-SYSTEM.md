# 🚀 TEMPORAL-POWERED TOP 50 RANKING SYSTEM

## ✅ FULLY AUTOMATED - NO MANUAL API CALLS NEEDED!

---

## 🎯 Overview

A **completely automated** AI-powered ranking system using **Temporal workflows** to manage top 50 players across all sports. Once triggered, Temporal handles everything:

- ✅ **Automatic initialization** via Temporal workflows
- ✅ **Zero manual intervention** - workflows handle retries, monitoring, progress
- ✅ **Fault-tolerant** - resumes from failure points automatically
- ✅ **Scalable** - processes all 5 sports (250 players) in sequence
- ✅ **Observable** - full visibility through Temporal UI and logs

---

## 🏗️ Architecture

### **Temporal Components**

```
┌─────────────────────────────────────────────────┐
│         TEMPORAL WORKFLOW ENGINE                │
│   (Orchestrates all ranking operations)        │
└───────────────┬─────────────────────────────────┘
                │
                ├─► PlayerRankingWorkflow
                │   ├─ initializeTop50(sport)
                │   ├─ initializeAllSports()
                │   ├─ updateMonthlyRankings(sport)
                │   └─ updateAllSportsMonthly()
                │
                ├─► PlayerRankingActivities
                │   ├─ initializeTop50ForSport()
                │   ├─ evaluatePlayerForTop50()
                │   ├─ updateRankingsForSport()
                │   └─ isSportInitialized()
                │
                └─► Automatic Features
                    ├─ Retry on failure (3 attempts)
                    ├─ Heartbeats for long operations
                    ├─ Activity timeouts (10 min each)
                    └─ Workflow persistence
```

---

## 🚀 QUICK START

### **Option 1: Automatic Initialization (RECOMMENDED)**

Set in `application.yml`:
```yaml
ranking:
  auto-initialize: true
  auto-initialize-delay-seconds: 30
```

Then just start the service:
```powershell
mvn spring-boot:run
```

**That's it!** After 30 seconds, Temporal will automatically:
1. Fetch top 50 players for all 5 sports (250 total)
2. Process each sport sequentially (2-3 min per sport)
3. Store everything in database with rankings
4. Complete in ~15-20 minutes

---

### **Option 2: Manual Trigger (ONE API CALL)**

```powershell
# Initialize ALL 5 sports at once (250 players)
Invoke-WebRequest -Method POST `
  -Uri "http://localhost:8084/api/admin/players/rankings/initialize-all" `
  | ConvertFrom-Json

# Response:
# {
#   "success": true,
#   "workflowId": "ranking-init-all-1733241234567",
#   "message": "Initializing top 50 for all 5 sports (250 players total)",
#   "sports": ["FOOTBALL", "BASKETBALL", "CRICKET", "TENNIS", "MMA"],
#   "estimatedTime": "15-20 minutes",
#   "note": "Workflow processes each sport sequentially. Monitor logs..."
# }
```

---

### **Option 3: Initialize Single Sport**

```powershell
# Just one sport at a time
Invoke-WebRequest -Method POST `
  -Uri "http://localhost:8084/api/admin/players/rankings/initialize/football"

Invoke-WebRequest -Method POST `
  -Uri "http://localhost:8084/api/admin/players/rankings/initialize/basketball"
```

---

## 📊 Monitor Progress

### **1. Application Logs**

Watch real-time progress:
```
[Temporal Activity] Initializing top 50 for FOOTBALL
[Temporal Activity] Registered #1 - Lionel Messi
[Temporal Activity] Registered #2 - Cristiano Ronaldo
...
[Temporal Activity] Successfully initialized FOOTBALL with 50 players
```

### **2. Temporal UI** (Optional)

```powershell
# Access Temporal Web UI
Start-Process "http://localhost:8080"

# View workflow: ranking-init-all-*
# See: Status, Duration, Activities, Retry History
```

### **3. Check Database**

```powershell
# View progress
docker exec -it highlights-postgres psql -U postgres -d topplayersofallsports -c "
SELECT 
  sport,
  COUNT(CASE WHEN current_rank IS NOT NULL THEN 1 END) as ranked_count,
  MIN(current_rank) as top_rank,
  MAX(current_rank) as bottom_rank
FROM players 
GROUP BY sport
ORDER BY sport;"

# Expected after completion:
#   sport     | ranked_count | top_rank | bottom_rank
# ------------+--------------+----------+-------------
#  BASKETBALL |           50 |        1 |          50
#  CRICKET    |           50 |        1 |          50
#  FOOTBALL   |           50 |        1 |          50
#  MMA        |           50 |        1 |          50
#  TENNIS     |           50 |        1 |          50
```

---

## 🎯 System Features

### **Automatic Retry & Error Handling**

```java
// Temporal automatically retries failed activities
RetryOptions.newBuilder()
    .setMaximumAttempts(3)  // Try up to 3 times
    .setInitialInterval(Duration.ofSeconds(10))  // Wait 10s between retries
```

**Example:**
- AI API call fails → Temporal waits 10 seconds → Retries
- Network timeout → Temporal resumes from last successful activity
- Service crashes → Temporal remembers progress, continues after restart

### **Long-Running Operation Support**

```java
// Activities send heartbeats during long AI calls
Activity.getExecutionContext().heartbeat(null);

// Temporal knows activity is alive, not stuck
// If activity crashes, Temporal can retry from last heartbeat
```

### **Parallel Processing (Future Enhancement)**

```java
// Currently: Sequential (safer for AI API rate limits)
FOOTBALL → BASKETBALL → CRICKET → TENNIS → MMA

// Future: Parallel (faster, needs higher API limits)
FOOTBALL ┐
BASKETBALL├─► All at once
CRICKET  ├─► Complete in ~3 minutes
TENNIS   ├─► instead of 15 minutes
MMA      ┘
```

---

## 🔄 Monthly Ranking Updates (TODO)

### **Automatic Cron-Style Updates**

```java
// Schedule via Temporal (runs 1st of every month)
@Scheduled(cron = "0 0 0 1 * *")  // Midnight on 1st day of month
public void scheduleMonthlyUpdate() {
    workflowClient.newWorkflowStub(PlayerRankingWorkflow.class)
        .updateAllSportsMonthly();
}
```

**What it does:**
1. Re-evaluates all 250 players
2. Updates rankings based on recent performance
3. Removes players who dropped out
4. Adds new breakout players
5. Records rank changes (↑↓)

---

## 📋 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/players/rankings/initialize-all` | POST | Initialize all 5 sports (250 players) |
| `/api/admin/players/rankings/initialize/{sport}` | POST | Initialize single sport (50 players) |
| `/api/admin/players/rankings/top50/{sport}` | GET | View current top 50 |
| `/api/admin/players/rankings/status/{workflowId}` | GET | Check workflow status (TODO) |

---

## 🛠️ Setup Instructions

### **Prerequisites**

1. **PostgreSQL** (running on port 5433)
2. **Redis** (running on port 6379)
3. **Temporal Server** (running on port 7233)

```powershell
# Start Temporal (if not running)
docker run -d -p 7233:7233 -p 8080:8080 temporalio/auto-setup:latest

# Start PostgreSQL (if not running)
docker run -d -p 5433:5432 --name highlights-postgres `
  -e POSTGRES_USER=postgres `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=topplayersofallsports `
  postgres:15-alpine
```

### **Database Migration**

```powershell
# Apply ranking fields migration
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
"
```

### **Start the Service**

```powershell
# Compile
mvn clean compile -DskipTests

# Run
mvn spring-boot:run

# Watch logs for:
# "✅ Temporal worker started successfully"
# "Worker is ready to process player registration workflows"
```

---

## 🎉 COMPLETE WORKFLOW EXAMPLE

```powershell
# 1. Trigger initialization
$response = Invoke-WebRequest -Method POST `
  -Uri "http://localhost:8084/api/admin/players/rankings/initialize-all" `
  | ConvertFrom-Json

Write-Host "Workflow ID: $($response.workflowId)"

# 2. Wait for completion (~15-20 minutes)
# Monitor logs for progress...

# 3. View results
foreach ($sport in @("football", "basketball", "cricket", "tennis", "mma")) {
    Write-Host "`n=== TOP 10 $($sport.ToUpper()) ===" -ForegroundColor Cyan
    
    $top10 = Invoke-WebRequest `
      -Uri "http://localhost:8084/api/admin/players/rankings/top50/$sport" `
      | ConvertFrom-Json
    
    $top10.players | Select-Object -First 10 | Format-Table rank, name, team, score
}

# Expected output:
# === TOP 10 FOOTBALL ===
# rank name              team            score
# ---- ----              ----            -----
#    1 Lionel Messi      Inter Miami     100.0
#    2 Cristiano Ronaldo Al Nassr         99.4
#    3 Kylian Mbappé     Real Madrid      98.8
#    ...
```

---

## 🔥 Key Benefits Over Manual System

| Feature | Manual API Calls | Temporal Workflows |
|---------|-----------------|-------------------|
| **Retry on failure** | ❌ You handle it | ✅ Automatic |
| **Resume after crash** | ❌ Start over | ✅ Resumes from last activity |
| **Progress tracking** | ❌ Manual logs | ✅ Built-in + UI |
| **Timeout handling** | ❌ Custom code | ✅ Configured |
| **Parallel execution** | ❌ Complex | ✅ Easy to add |
| **Scheduled updates** | ❌ Cron + custom logic | ✅ Native cron support |
| **Error visibility** | ❌ Check logs | ✅ Temporal UI shows all |
| **Testing** | ❌ Hard to test | ✅ Temporal test server |

---

## 📈 Performance & Scalability

### **Current Performance**
- **Single sport**: 2-3 minutes (50 players)
- **All sports**: 15-20 minutes (250 players)
- **AI model**: GPT-4o (default) or GPT-4o mini (faster)
- **Rate limits**: Sequential to respect AI API limits

### **Optimization Options**

1. **Use faster AI model**:
   ```yaml
   openrouter:
     model: openai/gpt-4o-mini  # 2x faster, 10x cheaper
   ```

2. **Parallel sports** (requires higher API limits):
   ```java
   // Process all 5 sports simultaneously
   List<Future<RankingWorkflowResult>> futures = new ArrayList<>();
   for (Sport sport : Sport.values()) {
       futures.add(Async.function(() -> initializeTop50(sport)));
   }
   ```

3. **Batch AI requests** (50 players in 1 call):
   ```java
   // Instead of 50 separate AI calls
   // Make 1 call: "Give me top 50 football players"
   // Reduces time from 3 minutes to 30 seconds per sport
   ```

---

## 🎯 Next Steps

### **Phase 1: Initialize Database** ✅ READY NOW
```powershell
# Option A: Auto-initialize
# Set ranking.auto-initialize=true in application.yml, then start service

# Option B: Manual trigger
Invoke-WebRequest -Method POST `
  -Uri "http://localhost:8084/api/admin/players/rankings/initialize-all"
```

### **Phase 2: Monthly Updates** (TODO)
- Create scheduled Temporal workflow
- Runs 1st of every month automatically
- Re-evaluates all players
- Updates rankings based on performance

### **Phase 3: User Search Integration** (TODO)
- User searches for player
- If not found → AI evaluates if qualifies
- Only adds if score >= 70.0
- Returns proper response to user

### **Phase 4: AI Chat** (FUTURE)
- "Who's the best striker in football?"
- "Compare LeBron vs Jordan"
- "Show me rising stars in tennis"

---

## 🐛 Troubleshooting

### **Temporal not connecting**
```powershell
# Check Temporal is running
docker ps | Select-String "temporalio"

# Start Temporal
docker run -d -p 7233:7233 -p 8080:8080 temporalio/auto-setup:latest
```

### **Workflow not starting**
```
# Check logs for:
✅ Temporal worker started successfully

# If you see:
❌ Failed to start Temporal worker
→ Temporal server is not running
```

### **AI API errors**
```
# Check OpenRouter API key in application.yml
# Verify model is available: openai/gpt-4o-mini
# Check rate limits if getting 429 errors
```

### **Database connection issues**
```powershell
# Verify PostgreSQL is running
docker exec -it highlights-postgres psql -U postgres -l

# Run migration if tables missing columns
# See "Database Migration" section above
```

---

## ✅ Summary

You now have a **production-grade, Temporal-powered ranking system** that:

1. ✅ **Fully automated** - one API call initializes everything
2. ✅ **Fault-tolerant** - automatic retries and recovery
3. ✅ **Observable** - Temporal UI + logs show all progress
4. ✅ **Scalable** - easy to add more sports or parallel processing
5. ✅ **Maintainable** - clean separation of workflows and activities
6. ✅ **Zero manual intervention** - Temporal handles orchestration

**Just trigger the workflow and Temporal does the rest!** 🚀⚽🏀🏏🎾🥊
