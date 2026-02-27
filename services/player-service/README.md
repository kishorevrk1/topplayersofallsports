# Player Service - AI-Powered Top Players Data Aggregation

## Overview
Microservice for collecting, analyzing, and serving top player data across multiple sports using AI-powered ratings and insights.

## Features
- **Multi-Sport Support**: Football, Basketball, MMA, Cricket, Tennis
- **AI Analysis**: DeepSeek R1 powered player ratings and insights via OpenRouter
- **Weekly Sync**: Automated weekly data updates (50 players per sport)
- **Real-time Stats**: Integration with API-Sports.io
- **Caching**: Redis-backed caching for performance
- **RESTful API**: Comprehensive endpoints for player data

## Tech Stack
- **Framework**: Spring Boot 3.2.0
- **Database**: PostgreSQL (shared: topplayersofallsports)
- **Cache**: Redis
- **AI**: DeepSeek R1 via OpenRouter (Free tier)
- **HTTP Client**: Spring WebClient
- **Documentation**: Swagger/OpenAPI

## Configuration

### Port
`8084`

### Environment Variables
Set in `application.yml`:
- `openrouter.api-key`: OpenRouter API key for DeepSeek R1
- `apisports.api-key`: API-Sports.io key
- `spring.datasource.url`: PostgreSQL connection

### Weekly Sync Schedule
- **Cron**: `0 0 2 * * SUN` (Every Sunday at 2 AM)
- **Players per sport**: 50
- **Sports**: Football, Basketball, MMA, Cricket, Tennis

## API Endpoints

### Player Endpoints
- `GET /api/players?sport=FOOTBALL` - Get all players by sport
- `GET /api/players/top?sport=FOOTBALL` - Get top-rated players by AI rating
- `GET /api/players/{id}` - Get player by ID
- `GET /api/players/{id}/analysis` - Get AI analysis for player
- `GET /api/players/search?name=Messi` - Search players by name
- **`POST /api/players/register`** - 🆕 User-driven player registration with AI

### Admin Endpoints
- `POST /api/admin/players/sync/football?season=2024&playersPerLeague=10` - Manual sync
- `GET /api/admin/players/stats` - Get sync statistics

## 🆕 User Registration Feature

Users can request adding any player! The system uses **2-stage AI pipeline**:

1. **AI Search & Validate** (DeepSeek R1) - Identifies player, detects sport, extracts metadata
2. **API-Sports Fetch** - Gets real stats and data
3. **AI Enrichment** (DeepSeek R1) - Generates rating, biography, highlights

**Example Request:**
```bash
curl -X POST http://localhost:8084/api/players/register \
  -H "Content-Type: application/json" \
  -d '{"playerName": "Kylian Mbappé"}'
```

**Response:**
```json
{
  "success": true,
  "status": "NEW",
  "playerId": 42,
  "playerName": "Kylian Mbappé",
  "sport": "FOOTBALL",
  "aiRating": 94
}
```

See [USER_REGISTRATION_FEATURE.md](USER_REGISTRATION_FEATURE.md) for complete documentation.

## Database Schema

### Tables
1. **players** - Player profile data
2. **player_stats** - Season statistics
3. **ai_analysis** - AI-generated ratings and insights

## AI Analysis Components

### DeepSeek R1 Integration
- **Model**: `deepseek/deepseek-r1:free`
- **Context**: 164K tokens
- **Temperature**: 0.7
- **Max tokens**: 4000

### Rating Algorithm
Player ratings (0-100) based on:
- **Peak Performance** (30%): Highest level achieved
- **Longevity** (20%): Career length and consistency
- **Awards** (20%): Championships, MVPs, honors
- **Era-Adjusted Impact** (30%): Historical significance

### AI Output
For each player:
- Overall rating (0-100)
- 3-4 sentence analysis
- Top 3 strengths
- Comprehensive biography
- Career highlights
- Legacy summary

## Running the Service

### Prerequisites
1. PostgreSQL running on port 5433
2. Redis running on port 6379
3. OpenRouter API key configured
4. API-Sports.io key configured

### Build & Run
```powershell
# Build
mvn clean package

# Run
mvn spring-boot:run

# Or use the start script
.\start.ps1
```

### Verify Service
- **Health**: http://localhost:8084/actuator/health
- **Swagger UI**: http://localhost:8084/swagger-ui.html
- **API Docs**: http://localhost:8084/api-docs

## Testing

### Manual Sync (Football)
```powershell
curl -X POST "http://localhost:8084/api/admin/players/sync/football?season=2024&playersPerLeague=10"
```

### Get Top Players
```powershell
curl "http://localhost:8084/api/players/top?sport=FOOTBALL"
```

### Search Player
```powershell
curl "http://localhost:8084/api/players/search?name=Messi"
```

## Data Flow

```
Weekly Scheduler (Sunday 2 AM)
    ↓
FootballDataClient → API-Sports.io (Fetch top 50 players)
    ↓
PlayerService → Save to PostgreSQL
    ↓
AIAnalysisService → DeepSeek R1 (Generate analysis)
    ↓
Save AI Analysis → PostgreSQL
    ↓
Cache in Redis (7 days TTL)
```

## API Usage Estimates

### API-Sports.io
- **5 leagues × 1 call** = 5 calls/week
- **50 players × 1 call** = 50 calls/week (if fetching individual details)
- **Total**: ~55 calls/week = 220 calls/month

### OpenRouter (DeepSeek R1)
- **50 players × 1 analysis** = 50 AI calls/week
- **Free tier**: Unlimited on DeepSeek R1
- **Token usage**: ~500 tokens/player = 25K tokens/week

## Next Steps

1. ✅ Football players sync implemented
2. ⏳ Add Basketball data client
3. ⏳ Add MMA data client
4. ⏳ Add Cricket data client
5. ⏳ Add Tennis data client
6. ⏳ Frontend integration

## Notes
- AI analysis is cached for 7 days to reduce API calls
- Rate limiting implemented with retry logic
- Fallback responses if AI parsing fails
- Weekly sync ensures fresh data without hitting rate limits
