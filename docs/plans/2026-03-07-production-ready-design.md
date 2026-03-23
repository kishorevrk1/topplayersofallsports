# Production-Ready Design: Auth + Player Service
**Date**: 2026-03-07
**Branch**: highlight-service
**Approach**: Fix & Ship Fast (Approach A)

---

## Context

TopPlayersOfAllSports is a sports analytics platform (~75–80% complete). Core content services (highlights, news, calendar) are fully functional. The gaps blocking production are:
1. No working authentication (UI done, backend not wired)
2. No security (API keys exposed, all endpoints public)
3. Search page returns mock data
4. Stats tab has no real data
5. Player comparison not wired up
6. ACR rating refresh runs daily (too costly — should be monthly)
7. `aiSportsService.generatePlayerProfile()` calls OpenAI directly from the browser (API key exposed)

**Scope of this plan**: Complete auth + player-service. News/highlights cross-service integration deferred to a future phase.

---

## Target Users
Global sports community — fans, analysts, and fantasy sports players across all segments.

## Monetization
Free with ads (Google AdSense). AdSense ID already in `.env`.

## Deployment
Make code production-ready first. Docker/cloud deployment deferred.

---

## Section 1: Authentication Architecture

### Decision: Google OAuth + Spring Boot JWT. Remove Firebase.

**Files to delete (frontend):**
- `src/services/Authendication/firebase.js`
- `src/services/Authendication/googleAuth.js`
- `src/services/openaiClient.js`

**New backend components in player-service:**

### Entities
```
User
├── id (UUID)
├── email (unique)
├── name
├── googleId (unique, nullable)
├── role (USER | ADMIN)
└── createdAt

RefreshToken
├── id (UUID)
├── token (unique)
├── userId (FK → User)
├── expiresAt
└── createdAt
```

### New Classes
| Class | Purpose |
|-------|---------|
| `entity/User.java` | User account entity |
| `entity/RefreshToken.java` | Refresh token storage |
| `repository/UserRepository.java` | User DB queries |
| `repository/RefreshTokenRepository.java` | Token queries |
| `service/JwtService.java` | Generate / validate / parse JWT |
| `service/GoogleOAuthService.java` | Exchange Google auth code, fetch user profile from Google |
| `service/AuthService.java` | Auth business logic |
| `controller/AuthController.java` | Auth HTTP endpoints |
| `config/SecurityConfig.java` | Spring Security filter chain |
| `filter/JwtAuthFilter.java` | Per-request JWT validation filter |
| `dto/AuthResponse.java` | Response with accessToken + refreshToken |
| `dto/GoogleCallbackRequest.java` | Request with Google auth code |

### Auth Endpoints
```
POST /api/auth/google          ← receive { code, redirectUri } → return JWT pair
POST /api/auth/refresh         ← receive { refreshToken } → return new access token
POST /api/auth/logout          ← invalidate refresh token
GET  /api/auth/me              ← return current user profile (requires valid JWT)
```

### Token Strategy
- Access token: JWT signed with HS256, 15-minute TTL
- Refresh token: UUID stored in DB, 7-day TTL
- Storage: `httpOnly` cookie preferred; `Authorization: Bearer` header also accepted
- Algorithm: JJWT library (`io.jsonwebtoken:jjwt-api:0.12.5`)

### Google OAuth Flow
```
1. Frontend redirects user to:
   https://accounts.google.com/o/oauth2/v2/auth?
     client_id=GOOGLE_CLIENT_ID&
     redirect_uri=http://localhost:3000/oauth/callback&
     response_type=code&
     scope=email profile

2. Google redirects to /oauth/callback with ?code=...

3. Frontend sends: POST /api/auth/google { code, redirectUri }

4. Backend (GoogleOAuthService):
   a. Exchange code for Google tokens at https://oauth2.googleapis.com/token
   b. Fetch user info from https://www.googleapis.com/oauth2/v1/userinfo
   c. Find or create User record
   d. Generate JWT access + refresh token pair
   e. Return AuthResponse { accessToken, refreshToken, user }

5. Frontend stores tokens, updates AuthContext, redirects to /
```

### Route Protection
```
PUBLIC (no auth required):
  GET  /api/players/**         ← player browsing
  GET  /api/search/**          ← search
  GET  /api/highlights/**      ← highlights (handled by highlights-service)
  GET  /api/news/**            ← news (handled by news-service)
  GET  /api/calendar/**        ← calendar (handled by calendar-service)
  POST /api/auth/**            ← auth endpoints

PROTECTED (requires valid JWT):
  POST /api/players/*/rating/refresh
  GET  /api/auth/me
  POST /api/admin/**

ADMIN (requires ROLE_ADMIN):
  /api/admin/**
```

### Frontend Changes for Auth
- Update `AuthContext.jsx`: store JWT from backend response, not Firebase token
- Update `authService.js`: call `POST /api/auth/google` instead of Firebase
- Update `OAuth2RedirectHandler.jsx` / `oauth-callback/index.jsx`: send code to backend, receive JWT
- Add `Authorization: Bearer <token>` header in `playerApiService.js` for protected calls
- Remove Firebase imports from `App.jsx` (if present)

### Security Hardening
- Move all API keys from `application.yml` to OS environment variables
- CORS: restrict to known frontend origins (localhost:3000, production domain)
- Add rate limiting on auth endpoints (5 requests/minute per IP)

---

## Section 2: Player Features

### 2a. Player Search

**New endpoint:** `GET /api/search?q=&sport=&page=0&size=20`

**Backend:**
- `SearchController.java` in player-service
- Queries Player entity using PostgreSQL `ILIKE` on name, nationality, team fields
- Optional `sport` filter
- Returns `SearchResultsResponse { players: Page<PlayerSummary>, total, page, pageSize }`
- Cached in Redis with key `search:{q}:{sport}:{page}`, TTL 1 minute

**Frontend:**
- `search-results/index.jsx`: Replace 100% of mock data with real API call to `/api/search`
- Debounce input 300ms before fetching
- Show loading skeleton while fetching
- Show "No players found for X" empty state
- Wire Header search bar to navigate to `/search?q=<query>`

### 2b. Stats Tab (Real Data)

**New entity:**
```
PlayerStats
├── id
├── playerId (FK → Player)
├── season (e.g. "2024", "career")
├── statsJson (JSONB) ← sport-specific key-value pairs
└── updatedAt
```

**New endpoint:** `GET /api/players/{id}/stats`
- Returns `{ seasonStats: { "2024": {...}, "2023": {...} }, careerStats: {...} }`
- For Football: fetches from API-Sports `/players?id=&season=` and maps to stats JSON
- For other sports: reads from `PlayerStats` entity (manually curated or from admin seeding)
- Cached in Redis with key `stats:{playerId}`, TTL 24 hours

**Frontend:**
- `player-profile/index.jsx`: Update `transformPlayer()` to populate `seasonStats` and `careerStats` from `/api/players/{id}/stats` response
- `StatsTab.jsx`: No UI changes needed — already reads `player.seasonStats[year]` and `player.careerStats`
- Add API call in `PlayerProfile` component alongside existing player fetch

### 2c. Player Comparison

**New endpoint:** `GET /api/players/compare?p1=id1&p2=id2`
- Fetches both players and their ACR breakdowns in parallel
- Returns `ComparisonResponse { player1: PlayerWithRating, player2: PlayerWithRating }`
- Each includes: profile fields + `ratingConsensus` with criteria breakdown

**Frontend:**
- `player-profile/index.jsx`: Wire "Compare Players" button to open a player search modal
- New page: `src/pages/player-comparison/index.jsx` at route `/compare`
  - Two columns showing player photos, quick facts, ACR score, criteria bars
  - Highlight the winner of each criterion with a colored indicator
  - Share button (copy link with both player IDs as query params)
- Accept `?p1=id1&p2=id2` query params to directly render comparison

### 2d. Monthly ACR Auto-Refresh

**Changes in player-service:**
- Rename `DailyRatingRefreshWorkflow` → `MonthlyRatingRefreshWorkflow`
- Update Temporal cron expression: `"0 2 1 * *"` (1st of every month at 2:00 AM)
- Activity: query all players where `ratingUpdatedAt < NOW() - INTERVAL '30 days'`
- Process in batches of 5 players, with 12-second delay between batches (respects OpenRouter rate limits)
- Each batch: run `MultiModelRatingService.generateConsensusRating()` → persist `RatingConsensus` → append `RatingHistory`

**TemporalConfig:** Update workflow registration to use new workflow class name.

### 2e. Remove Frontend AI Calls

**`OverviewTab.jsx`:**
- Remove `aiSportsService` import and `generateInsights` useEffect entirely
- Remove the "AI Player Analysis" section (lines 62–100)
- Player biography from backend (`player.biography`) already displays below — this is sufficient
- ACR breakdown from backend already shows in the section below (lines 102–118)

**Files to delete:**
- `src/services/openaiClient.js`
- `src/services/Authendication/firebase.js`
- `src/services/Authendication/googleAuth.js`
- `src/services/aiSportsService.js` (if only used for `generatePlayerProfile` — verify first)

---

## What's Explicitly Out of Scope (This Phase)

- News/highlights cross-service search integration
- User favorites / watchlists (button UI exists, backend deferred)
- Email verification flow
- Docker / containerization
- CI/CD pipeline
- Full test suite
- Mobile app
- AdSense integration (VITE_ADSENSE_ID in .env — add ad slots in a later phase)

---

## Files Summary

### New Backend Files (player-service)
```
entity/
  User.java
  RefreshToken.java
repository/
  UserRepository.java
  RefreshTokenRepository.java
service/
  JwtService.java
  GoogleOAuthService.java
  AuthService.java
  SearchService.java
  PlayerStatsService.java
controller/
  AuthController.java
  SearchController.java
  PlayerStatsController.java
config/
  SecurityConfig.java
filter/
  JwtAuthFilter.java
dto/
  AuthResponse.java
  GoogleCallbackRequest.java
  SearchResultsResponse.java
  PlayerStatsResponse.java
  ComparisonResponse.java
temporal/workflow/
  MonthlyRatingRefreshWorkflow.java
  MonthlyRatingRefreshWorkflowImpl.java
```

### Modified Backend Files (player-service)
```
controller/PlayerController.java  ← add /compare endpoint
config/TemporalConfig.java        ← register new monthly workflow
pom.xml                           ← add jjwt, spring-security, spring-oauth2-client deps
application.yml                   ← add google.client-id, client-secret, jwt.secret
```

### New Frontend Files
```
src/pages/player-comparison/index.jsx
```

### Modified Frontend Files
```
src/contexts/AuthContext.jsx          ← remove Firebase, use backend JWT
src/services/authService.js           ← call /api/auth/google instead of Firebase
src/pages/oauth-callback/index.jsx    ← send code to backend, receive JWT
src/pages/search-results/index.jsx    ← replace mock data with real API call
src/pages/player-profile/index.jsx    ← add stats fetch, wire Compare button
src/pages/player-profile/components/OverviewTab.jsx  ← remove aiSportsService call
src/services/playerApiService.js      ← add getPlayerStats, comparePlayer methods
```

### Deleted Files
```
src/services/Authendication/firebase.js
src/services/Authendication/googleAuth.js
src/services/openaiClient.js
src/services/aiSportsService.js       ← verify no other usages first
```

---

## Success Criteria

- [ ] User can sign in with Google, receive JWT, stay logged in across page refreshes
- [ ] JWT refresh works — access token renewed silently before expiry
- [ ] All API keys removed from `application.yml` and `.env` to OS environment variables
- [ ] No AI calls made from the browser (openaiClient.js deleted)
- [ ] Search bar returns real players matching the query
- [ ] Stats tab shows real career/season numbers for Football players
- [ ] "Compare Players" button opens player picker and renders side-by-side comparison
- [ ] Monthly ACR refresh Temporal workflow registered and firing on schedule
- [ ] Player profile loads without any console errors related to auth or AI calls
