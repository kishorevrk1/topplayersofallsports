# 🏆 Top 100 All-Time Greatest Players System

## Overview
This system populates and serves the **Top 100 All-Time Greatest Players** for each sport using AI-powered data generation.

Since it's 2026, we generate the Top 100 players based on their entire career achievements up to and including 2025.

## Features
- ✅ AI-generated Top 100 lists using DeepSeek R1
- ✅ Full player profiles with biography, stats, and achievements
- ✅ Career highlights and legacy summaries
- ✅ Supports multiple sports (Football, Basketball, MMA, Cricket, Tennis, etc.)
- ✅ RESTful API for frontend integration
- ✅ Background processing with progress monitoring

---

## Quick Start

### Step 1: Start the Player Service

```powershell
cd services\player-service
mvn spring-boot:run
```

Wait for the service to start (check for "Started PlayerServiceApplication")

### Step 2: Seed Top 100 for Football and Basketball

```powershell
# Option A: Seed BOTH Football and Basketball at once
curl -X POST "http://localhost:8084/api/admin/players/top100/seed-football-basketball"

# Option B: Seed individually
curl -X POST "http://localhost:8084/api/admin/players/top100/seed/football"
curl -X POST "http://localhost:8084/api/admin/players/top100/seed/basketball"
```

### Step 3: Monitor Progress

```powershell
# Check seeding stats
curl "http://localhost:8084/api/admin/players/top100/stats"
```

### Step 4: View the Top 100

```powershell
# Football Top 100
curl "http://localhost:8084/api/players/top100/football" | jq

# Basketball Top 100
curl "http://localhost:8084/api/players/top100/basketball" | jq

# Get individual player details
curl "http://localhost:8084/api/players/{playerId}" | jq
```

---

## API Endpoints

### Admin Endpoints (for seeding)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/players/top100/seed/{sport}` | Seed Top 100 for a specific sport |
| POST | `/api/admin/players/top100/reseed/{sport}` | Reseed (clears existing data first) |
| POST | `/api/admin/players/top100/seed-football-basketball` | Seed both Football and Basketball |
| GET | `/api/admin/players/top100/stats` | Get seeding statistics for all sports |
| GET | `/api/admin/players/top100/{sport}` | Get Top 100 list (admin view) |

### Public Endpoints (for frontend)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/players/top100` | Get available Top 100 lists info |
| GET | `/api/players/top100/{sport}` | Get Top 100 with full details |
| GET | `/api/players/{id}` | Get individual player with AI analysis |
| GET | `/api/players/search?name=X` | Search players by name |

---

## Response Format

### Top 100 List Response

```json
{
  "sport": "FOOTBALL",
  "title": "Top 100 All-Time Greatest Football/Soccer Players",
  "subtitle": "Historical rankings up to 2025",
  "count": 100,
  "players": [
    {
      "id": 1,
      "rank": 1,
      "name": "Pelé",
      "displayName": "Pelé",
      "team": "Santos FC / Brazil",
      "position": "Forward",
      "nationality": "Brazil",
      "age": 82,
      "height": "5'8\"",
      "weight": "150 lbs",
      "photoUrl": "https://...",
      "isActive": false,
      "rating": 99,
      "aiRating": 99,
      "biography": "Widely regarded as the greatest footballer of all time...",
      "strengths": ["Incredible goal-scoring", "Vision", "Athleticism"],
      "careerHighlights": ["3x World Cup Winner", "1000+ goals", "6x Brazilian champion"]
    },
    // ... more players
  ]
}
```

### Individual Player Response

```json
{
  "id": 1,
  "name": "Pelé",
  "displayName": "Pelé",
  "sport": "FOOTBALL",
  "team": "Santos FC / Brazil",
  "position": "Forward",
  "nationality": "Brazil",
  "age": 82,
  "height": "5'8\"",
  "weight": "150 lbs",
  "photoUrl": "https://...",
  "birthdate": "1940-10-23",
  "birthplace": "Três Corações, Brazil",
  "currentRank": 1,
  "isActive": false,
  "rankingScore": 99.0,
  "aiRating": 99,
  "biography": "Widely regarded as the greatest footballer of all time...",
  "analysisText": "Pelé revolutionized the sport with his exceptional skills...",
  "strengths": ["Incredible goal-scoring", "Vision", "Athleticism"],
  "careerHighlights": ["3x World Cup Winner", "1000+ goals", "6x Brazilian champion"]
}
```

---

## How It Works

1. **AI Batch Processing**: The system processes players in batches of 10 to avoid rate limits
2. **DeepSeek R1**: Uses the free tier AI model via OpenRouter to generate player data
3. **5-second delays**: Between batches to respect API rate limits
4. **Automatic Parsing**: AI responses are parsed and stored in PostgreSQL
5. **Async Processing**: Seeding runs in the background, so API returns immediately

### Estimated Times
- **Single sport**: 5-10 minutes (100 players in 10 batches)
- **Football + Basketball**: 10-20 minutes total

---

## Database Schema

### Players Table
- `id` - Primary key
- `name` - Full official name
- `display_name` - Common/nickname
- `sport` - FOOTBALL, BASKETBALL, etc.
- `current_rank` - 1-100 ranking
- `ranking_score` - AI rating (0-100)
- `team`, `position`, `nationality`, etc.

### AI Analysis Table
- `player_id` - Foreign key to players
- `ai_rating` - 0-100 score
- `biography` - Career summary
- `strengths` - JSON array of skills
- `career_highlights` - JSON array of achievements

---

## Supported Sports

| Sport | Enum Value | Status |
|-------|------------|--------|
| Football/Soccer | `FOOTBALL` | ✅ Supported |
| Basketball | `BASKETBALL` | ✅ Supported |
| MMA/UFC | `MMA` | ✅ Supported |
| Cricket | `CRICKET` | ✅ Supported |
| Tennis | `TENNIS` | ✅ Supported |
| Baseball | `BASEBALL` | ✅ Supported |
| Hockey | `HOCKEY` | ✅ Supported |
| Golf | `GOLF` | ✅ Supported |
| Formula 1 | `F1` | ✅ Supported |
| Boxing | `BOXING` | ✅ Supported |

---

## Troubleshooting

### Rate Limit Errors
If you see 429 errors in the logs:
- The system automatically waits and retries
- You can increase `BATCH_DELAY_SECONDS` in `Top100SeedingService.java`

### Empty Responses
If `/api/players/top100/{sport}` returns empty:
- Check if seeding has completed: `GET /api/admin/players/top100/stats`
- Look at application logs for errors
- Try reseeding: `POST /api/admin/players/top100/reseed/{sport}`

### Database Connection
Ensure PostgreSQL is running:
```powershell
docker ps --filter "name=postgres"
```

---

## Frontend Integration

To connect the frontend Players Directory to this API:

1. Create `src/services/playerService.js`:
```javascript
const API_BASE = 'http://localhost:8084/api/players';

export const getTop100 = async (sport) => {
  const response = await fetch(`${API_BASE}/top100/${sport}`);
  return response.json();
};

export const getPlayerById = async (id) => {
  const response = await fetch(`${API_BASE}/${id}`);
  return response.json();
};

export const searchPlayers = async (name) => {
  const response = await fetch(`${API_BASE}/search?name=${name}`);
  return response.json();
};
```

2. Update the Players Directory component to fetch from the API instead of using mock data.

---

## Notes

- AI-generated data is factually accurate for real historical players
- Rankings reflect career achievements, not current form
- Players marked as `isActive: false` are retired legends
- The system can be reseeded at any time to update rankings
