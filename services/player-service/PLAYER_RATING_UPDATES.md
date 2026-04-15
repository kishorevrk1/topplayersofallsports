# 🔄 Player Rating Updates - Complete Strategy

## 🎯 The Problem You Identified

**You're absolutely right!** Player ratings must update because:

1. **Form Changes** - Player on a hot streak → Rating UP ⬆️
2. **Poor Form** - Player in a slump → Rating DOWN ⬇️
3. **New Achievements** - Won trophy, milestone goal → Rating UP ⬆️
4. **Transfers** - Moved teams, different league → Re-evaluate
5. **Injuries** - Long injury, recovery → Rating adjustment
6. **Age/Career Stage** - Prime years vs declining → Consider trajectory

---

## 🎯 3 Update Strategies

### **Strategy 1: Scheduled Updates (Weekly/Daily)**

**What:** Automatic batch updates of all players

**When:** 
- Weekly: Every Sunday at 2 AM (already implemented)
- Daily: For top 100 players
- Monthly: For all players in database

**How It Works:**
```
Sunday 2 AM:
├─ Fetch top 50 players per sport
├─ Get latest stats from API-Sports
├─ Re-analyze with AI
├─ Update ratings in database
└─ Log changes
```

**Configuration:**
```yaml
# application.yml
player:
  sync:
    enabled: true
    cron: "0 0 2 * * SUN"      # Every Sunday 2 AM
    players-per-sport: 50
```

**Example Changes:**
```
Mbappé: 94 → 95 (+1) - Scored hat-trick in Champions League
Haaland: 93 → 93 (no change) - Consistent form
Salah: 91 → 89 (-2) - Injury affected recent games
```

---

### **Strategy 2: On-Demand Updates**

**What:** User or admin triggers update for specific player

**When:**
- User clicks "Refresh Rating" on player profile
- Admin wants immediate update after big game
- Before displaying player in important context

**API Endpoint:**
```
POST /api/players/temporal/update/{playerId}
```

**Example Request:**
```powershell
# Update Mbappe's rating right after Champions League final
Invoke-WebRequest -Method POST `
  -Uri "http://localhost:8084/api/players/temporal/update/123"
```

**Response:**
```json
{
  "workflowId": "player-update-123-xyz",
  "status": "STARTED",
  "message": "Rating update initiated",
  "statusEndpoint": "/api/players/temporal/update/status/player-update-123-xyz"
}
```

**After completion:**
```json
{
  "playerId": 123,
  "playerName": "Kylian Mbappé",
  "oldRating": 94,
  "newRating": 96,
  "ratingChange": +2,
  "changeReason": "Outstanding Champions League final performance: 2 goals, 1 assist. Team won 3-1.",
  "updatedAt": "2024-06-02T23:45:00"
}
```

---

### **Strategy 3: Event-Driven Updates**

**What:** Automatic triggers based on real-world events

**Triggers:**
1. **Match Completed** - Update players who played
2. **Transfer News** - Player changed teams
3. **Award Won** - Ballon d'Or, Golden Boot, etc.
4. **Milestone Reached** - 100th goal, 500th game
5. **Injury Report** - Long-term injury announced

**Flow:**
```
Real Event → Webhook/API → Queue → Temporal Workflow → Update Rating
```

**Example:**
```
Champions League Final Ends:
  ├─ Webhook from match API
  ├─ Identify players who played
  ├─ Trigger update workflows
  │   ├─ Mbappé → +2 (2 goals)
  │   ├─ Bellingham → +1 (1 assist, MOTM)
  │   └─ Opponent players → -1 (lost final)
  └─ Complete in 5 minutes
```

---

## 🔄 Update Workflow Details

### **Step-by-Step Process:**

```java
// 1. Fetch Current Data
Player currentPlayer = database.findById(123);
AIAnalysis currentAnalysis = database.findAnalysisByPlayerId(123);
Integer oldRating = currentAnalysis.getRating();  // 94

// 2. Fetch Latest Stats
Map<String, Object> latestStats = apiSports.getPlayerStats(playerId, currentSeason);
/*
{
  "games": 18 (+3 from last update),
  "goals": 15 (+3),
  "assists": 6 (+2),
  "motm": 4 (+1),
  "recent_form": "W-W-W-W-W" (5 wins in a row)
}
*/

// 3. AI Re-Analysis
String prompt = """
PREVIOUS RATING: 94/100

LATEST STATS (since last update):
- 3 new games played
- 3 goals scored
- 2 assists
- 1 Man of the Match award
- 5-game winning streak

CONTEXT:
- Champions League knockout stage
- Scored in semifinal and final
- Team won Champions League

TASK: Re-evaluate rating considering recent performances.
Has the player improved, maintained, or declined?

Provide:
1. New rating (0-100)
2. Change reason
3. Updated analysis
""";

AIResponse aiResponse = openRouter.analyze(prompt);
/*
{
  "newRating": 96,
  "change": +2,
  "reason": "Exceptional Champions League performances. 
            Scored crucial goals in semifinals and final. 
            Elevated game in biggest moments. 
            Deserves elevation to near-elite tier.",
  "updatedAnalysis": "..."
}
*/

// 4. Update Database
aiAnalysis.setRating(96);
aiAnalysis.setUpdatedAt(now());
database.save(aiAnalysis);

// 5. Return Result
return PlayerUpdateResult.builder()
    .oldRating(94)
    .newRating(96)
    .ratingChange(+2)
    .changeReason("Champions League winner, crucial goals")
    .build();
```

---

## 📊 Rating Change Rules

### **When Rating Goes UP ⬆️**

1. **Goals/Assists** - Above expected rate
   ```
   Expected: 0.5 goals/game
   Actual: 1.2 goals/game
   → +1 to +3 rating
   ```

2. **Big Game Performance** - Delivered in important matches
   ```
   Champions League final: 2 goals
   → +2 rating
   ```

3. **Awards** - Individual recognition
   ```
   Won Player of the Month
   → +1 rating
   ```

4. **Winning Streak** - Team success with player's contribution
   ```
   10-game unbeaten run, player key in all
   → +1 rating
   ```

5. **Milestone** - Career achievement
   ```
   Scored 500th career goal
   → +1 rating (legacy boost)
   ```

### **When Rating Goes DOWN ⬇️**

1. **Poor Form** - Below expected performance
   ```
   0 goals in 8 games (striker)
   → -2 to -3 rating
   ```

2. **Injury** - Long-term absence
   ```
   Out for 6 months (ACL tear)
   → -1 rating (temporary drop)
   ```

3. **Disciplinary Issues** - Suspensions, red cards
   ```
   3 red cards in 5 games
   → -1 rating
   ```

4. **Age Decline** - Natural deterioration
   ```
   Player 35+, performance clearly dropping
   → -1 to -2 rating per season
   ```

5. **Big Game Failure** - Underperformed in crucial moment
   ```
   Missed penalty in cup final
   → -1 rating
   ```

### **When Rating Stays SAME ➡️**

1. **Consistent Performance** - Meeting expectations
2. **Insufficient Data** - Not enough games played
3. **Cancelled Events** - Equal positives and negatives

---

## 🎯 Update Frequency Recommendations

### **By Player Tier:**

```
Top 10 Players (Rating 95+):
├─ Update: Daily
├─ Why: Every game matters, high visibility
└─ Examples: Messi, Ronaldo, Mbappé

Top 50 Players (Rating 90-94):
├─ Update: Weekly
├─ Why: Regular form check
└─ Examples: Salah, Haaland, De Bruyne

Top 500 Players (Rating 85-89):
├─ Update: Bi-weekly
├─ Why: Balance freshness vs API costs
└─ Examples: Elite players at top clubs

All Other Players:
├─ Update: Monthly
├─ Why: Less volatile ratings
└─ Examples: Squad players, prospects
```

### **By Scenario:**

```
Regular Season:
└─ Update: Weekly

Transfer Window:
└─ Update: Daily (players linked with moves)

Tournament (World Cup, Euros):
└─ Update: After each match

Off-Season:
└─ Update: Monthly
```

---

## 🛠️ Implementation Example

### **1. Scheduled Daily Update (Top Players)**

```java
@Scheduled(cron = "0 0 3 * * *")  // Every day at 3 AM
public void dailyTopPlayersUpdate() {
    // Get top 100 players by rating
    List<Player> topPlayers = playerRepository.findTop100ByRatingDesc();
    
    // Start batch update workflow
    List<Long> playerIds = topPlayers.stream()
        .map(Player::getId)
        .collect(Collectors.toList());
    
    WorkflowClient client = ...;
    PlayerUpdateWorkflow workflow = client.newWorkflowStub(...);
    
    // Execute async
    WorkflowClient.start(workflow::batchUpdatePlayers, playerIds);
    
    log.info("Daily update started for {} top players", playerIds.size());
}
```

### **2. On-Demand Update API**

```java
@PostMapping("/temporal/update/{playerId}")
public ResponseEntity<Map> updatePlayerRating(@PathVariable Long playerId) {
    
    String workflowId = "player-update-" + playerId + "-" + UUID.randomUUID();
    
    WorkflowOptions options = WorkflowOptions.newBuilder()
        .setTaskQueue("player-updates")
        .setWorkflowId(workflowId)
        .build();
    
    PlayerUpdateWorkflow workflow = workflowClient.newWorkflowStub(
        PlayerUpdateWorkflow.class, options
    );
    
    // Start async
    WorkflowClient.start(workflow::updatePlayerRating, playerId);
    
    return ResponseEntity.accepted().body(Map.of(
        "workflowId", workflowId,
        "status", "STARTED",
        "message", "Rating update initiated"
    ));
}
```

### **3. Event-Driven Update (Webhook)**

```java
@PostMapping("/webhooks/match-completed")
public ResponseEntity<Void> matchCompleted(@RequestBody MatchResult match) {
    
    log.info("Match completed: {} vs {}", match.getHomeTeam(), match.getAwayTeam());
    
    // Get all players who participated
    List<Long> playerIds = match.getParticipatingPlayerIds();
    
    // Trigger update workflows for each player
    for (Long playerId : playerIds) {
        PlayerUpdateWorkflow workflow = ...;
        WorkflowClient.start(workflow::updatePlayerRating, playerId);
    }
    
    log.info("Triggered rating updates for {} players", playerIds.size());
    
    return ResponseEntity.ok().build();
}
```

---

## 📈 Example Update Scenarios

### **Scenario 1: Hot Streak**

```
Week 1: Haaland rated 93
├─ Games: 3
├─ Goals: 5
├─ Form: Excellent

Week 2 Update:
├─ AI analyzes: "5 goals in 3 games, hat-trick included"
├─ Rating: 93 → 94 (+1)
├─ Reason: "Exceptional goal-scoring form"

Week 3: Continue hot streak
├─ Goals: 3 more
├─ Total: 8 in 6 games

Week 4 Update:
├─ AI analyzes: "Sustained elite performance"
├─ Rating: 94 → 95 (+1)
├─ Reason: "Proving top-tier consistency"
```

### **Scenario 2: Injury Impact**

```
Pre-Injury: Salah rated 91
├─ Form: Good
├─ Status: Active

Injury Announced:
├─ Type: Hamstring
├─ Duration: 6 weeks

Immediate Update:
├─ Rating: 91 → 90 (-1)
├─ Reason: "Short-term unavailability affects current value"

After Return:
├─ Games: 3
├─ Performance: Rusty (0 goals)

Update:
├─ Rating: 90 → 89 (-1)
├─ Reason: "Form affected post-injury, needs time"

3 Weeks Later:
├─ Games: 6
├─ Performance: Back to form (4 goals, 3 assists)

Update:
├─ Rating: 89 → 91 (+2)
├─ Reason: "Fully recovered, back to elite level"
```

### **Scenario 3: Transfer Impact**

```
At PSG: Mbappé rated 94
├─ League: Ligue 1
├─ Competition: French league

Transfer to Real Madrid announced:
├─ League: La Liga
├─ Competition: Elevated

First 5 Games:
├─ Goals: 4
├─ Assists: 2
├─ Adapting well

Update:
├─ Rating: 94 → 95 (+1)
├─ Reason: "Successfully adapted to more competitive league, maintained elite performance"
```

---

## 🎯 Best Practices

### **1. Don't Over-Update**
```
❌ Update after every single game (too reactive)
✅ Update weekly, considering 3-5 game sample
```

### **2. Context Matters**
```
❌ 2 goals vs weak team = +2 rating
✅ 2 goals vs top team = +2 rating
```

### **3. Balance Recency with History**
```
Recent form weight: 40%
Season performance: 30%
Career achievements: 30%
```

### **4. AI Provides Nuance**
```
Simple formula: Goals × 2 + Assists = Rating
AI analysis: Considers opposition, importance, role, tactics
```

---

## 🚀 Implementation Priority

### **Phase 1: Core (Immediate)**
✅ Weekly scheduled updates (already implemented)
✅ On-demand update API (implement next)

### **Phase 2: Enhanced (Next Week)**
- Daily updates for top 100 players
- Batch update optimizations
- Update history tracking

### **Phase 3: Advanced (Next Month)**
- Event-driven webhooks
- Real-time match updates
- Automated tournament tracking

---

## 💡 Summary

**Your insight is 100% correct!**

Ratings must update regularly because:
- ✅ Form changes (hot/cold streaks)
- ✅ New achievements (trophies, milestones)
- ✅ Transfers (different leagues)
- ✅ Injuries (performance impact)
- ✅ Age/career trajectory

**Our Solution:**
1. **Scheduled**: Weekly auto-updates for all players
2. **On-Demand**: User/admin triggers specific updates
3. **Event-Driven**: Automatic after big games/news

**Key Benefit:**
Temporal workflows make updates reliable, scalable, and fault-tolerant - perfect for keeping ratings fresh! 🚀
