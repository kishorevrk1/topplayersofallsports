# Player Service - Quick Start Guide

## 🚀 Quick Test (5 minutes)

### Step 1: Start the Service
```powershell
cd services\player-service
.\start.ps1
```

### Step 2: Verify Health
```powershell
curl http://localhost:8084/actuator/health
```

Expected response:
```json
{"status":"UP"}
```

### Step 3: Sync Football Players (Manual)
```powershell
curl -X POST "http://localhost:8084/api/admin/players/sync/football?season=2024&playersPerLeague=5"
```

This will:
- Fetch top 5 players from each of the 5 major football leagues (25 total)
- Generate AI analysis for each player using DeepSeek R1
- Store in database with Redis caching

**Expected duration**: 2-3 minutes (API calls + AI generation)

### Step 4: Get Top Players
```powershell
curl "http://localhost:8084/api/players/top?sport=FOOTBALL" | ConvertFrom-Json | ConvertTo-Json -Depth 5
```

Expected response:
```json
[
  {
    "id": 1,
    "player": {
      "name": "Erling Haaland",
      "team": "Manchester City",
      "position": "Attacker"
    },
    "aiRating": 95,
    "analysisText": "Exceptional goal-scoring machine...",
    "strengths": ["Clinical finishing", "Physical prowess", "Positioning"],
    "biography": "Comprehensive bio...",
    "careerHighlights": [...]
  }
]
```

### Step 5: Search Player
```powershell
curl "http://localhost:8084/api/players/search?name=Haaland"
```

### Step 6: View in Swagger UI
Open browser: http://localhost:8084/swagger-ui.html

## 📊 Understanding AI Ratings

### Rating Scale (0-100)
- **95-100**: All-time greats (Messi, Ronaldo level)
- **90-94**: World-class superstars
- **85-89**: Elite players
- **80-84**: Top-tier professionals
- **75-79**: Strong players
- **70-74**: Solid professionals

### Rating Components
1. **Peak Performance (30%)**: Highest level achieved
2. **Longevity (20%)**: Career length and consistency
3. **Awards (20%)**: Championships, MVPs, honors
4. **Era-Adjusted (30%)**: Historical significance

## 🧪 Testing AI Analysis

### Example Prompt Sent to DeepSeek R1:
```
You are an expert sports analyst. Analyze the following player...

Player: Erling Haaland
Sport: FOOTBALL
Team: Manchester City
Position: Attacker
Age: 24

Recent Statistics:
Season 2024: 36 PPG, 8 APG

Provide a JSON response with:
- rating (0-100)
- analysis (3-4 sentences)
- strengths (3 items)
- biography (paragraph)
- careerHighlights (array)
- legacySummary (1 sentence)
```

### AI Response Example:
```json
{
  "rating": 95,
  "analysis": "Haaland is one of the most prolific goal-scorers...",
  "strengths": [
    "Clinical finishing in the box",
    "Exceptional physical attributes",
    "Intelligent positioning"
  ],
  "biography": "Born in Leeds, England...",
  "careerHighlights": [
    {
      "title": "Premier League Golden Boot",
      "description": "Record-breaking 36 goals",
      "year": "2023"
    }
  ],
  "legacySummary": "A generational talent..."
}
```

## 🔄 Weekly Sync Job

The service automatically syncs every Sunday at 2 AM:
```yaml
cron: "0 0 2 * * SUN"
```

To disable:
```yaml
player.sync.enabled: false
```

## 📈 Check Sync Statistics
```powershell
curl http://localhost:8084/api/admin/players/stats
```

Expected output:
```
Player Sync Statistics:
FOOTBALL: 50 players
BASKETBALL: 0 players
MMA: 0 players
CRICKET: 0 players
TENNIS: 0 players
Total: 50 players
AI Analyses: 50
```

## 🐛 Troubleshooting

### Issue: OpenRouter API Error
**Error**: `Failed to get AI response`
**Solution**: Check OpenRouter API key in `application.yml`

### Issue: API-Sports Rate Limit
**Error**: `429 Too Many Requests`
**Solution**: Wait 24 hours or reduce `playersPerLeague` parameter

### Issue: Database Connection Error
**Error**: `Connection refused`
**Solution**: Ensure PostgreSQL is running:
```powershell
docker ps --filter "name=postgres"
```

### Issue: Redis Connection Error
**Error**: `Cannot connect to Redis`
**Solution**: Start Redis:
```powershell
docker run -d --name redis -p 6379:6379 redis:latest
```

## 📋 API Endpoints Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/players?sport=FOOTBALL` | Get all players |
| GET | `/api/players/top?sport=FOOTBALL` | Top-rated players |
| GET | `/api/players/{id}` | Get player by ID |
| GET | `/api/players/{id}/analysis` | AI analysis |
| GET | `/api/players/search?name=X` | Search players |
| POST | `/api/admin/players/sync/football` | Manual sync |
| GET | `/api/admin/players/stats` | Sync statistics |

## 🎯 Next Steps

1. ✅ **Test with 5 football players** (completed above)
2. ⏳ **Scale to 50 players per sport**
3. ⏳ **Add Basketball, MMA, Cricket, Tennis clients**
4. ⏳ **Integrate with frontend**
5. ⏳ **Monitor OpenRouter usage**

## 💡 Pro Tips

1. **Cache effectively**: AI analysis is cached for 7 days
2. **Batch sync**: Use weekly scheduler to avoid rate limits
3. **Monitor tokens**: Check OpenRouter dashboard for usage
4. **Retry logic**: Built-in retries for API failures
5. **Fallback**: Returns basic data if AI fails

## 📞 Support

Check logs:
```powershell
# In the terminal where service is running
# Logs are printed in real-time
```

View Swagger docs:
```
http://localhost:8084/swagger-ui.html
```
