# ACR System Production Hardening — Design

**Date**: 2026-03-08
**Status**: Approved
**Branch**: highlight-service

## Problem

The ACR (AI Consensus Rating) backend is extensively implemented but has:
1. **Contract mismatch**: `POST /rating/refresh` returns minimal object instead of full breakdown shape
2. **No Flyway migrations**: Rating tables rely on Hibernate `ddl-auto: update` — not production-safe
3. **Missing ACR data in list APIs**: PlayerCard/PlayersDirectory can't show confidence badges
4. **No tests**: RatingController and MultiModelRatingService have zero test coverage

## Solution: Approach A — Fix Contracts + Migrations + Tests

### 1. Backend: Fix Refresh Endpoint Contract
**File**: `RatingController.java` lines 149-181

Current `POST /api/players/{id}/rating/refresh` returns:
```json
{ "playerId": 1, "newRating": 98.5, "confidence": "HIGH", ... }
```

Must return same shape as `GET /rating/breakdown`:
```json
{
  "available": true,
  "consensusRating": 98.5,
  "confidenceLevel": "HIGH",
  "models": { "primary": {...}, "secondary": {...} },
  "criteriaBreakdown": "...",
  "reasoning": "...",
  "dataPointsCited": "...",
  ...
}
```

### 2. Backend: Add Flyway Migration
**File**: `V4__add_rating_consensus_and_history.sql`

Explicit CREATE TABLE for `rating_consensus` and `rating_history` with all indices.
Guard with `IF NOT EXISTS` since Hibernate may have already created them.

### 3. Backend: Wire ACR Data into Player APIs
- `GET /api/players/{id}` — include `consensusRating`, `confidenceLevel`, `divergenceScore`
- `GET /api/players/top100/{sport}` — include ACR fields per player
- `GET /api/search` — include ACR fields in search results

### 4. Frontend: Fix OverviewTab + PlayerCard
- **OverviewTab.jsx**: After `refreshRating()`, directly use response (now has `available: true`)
- **PlayerCard.jsx**: Use `player.confidenceLevel` from enriched API response
- **PlayersDirectory**: Show confidence badges from real data

### 5. Backend: Add Integration Tests
- `RatingControllerTest.java` — test all 4 endpoints with mocked services
- Test contract shapes match frontend expectations

### 6. Rate Limit Logging
- Add request counter logging in `OpenRouterClient` for observability

## Architecture (unchanged)
```
Frontend → RatingController → MultiModelRatingService → OpenRouterClient (2 models)
                                     ↓
                              RatingConsensus (DB) + RatingHistory (DB)
                                     ↓
                              Redis Cache (7-day TTL)
```

## Success Criteria
- `POST /rating/refresh` returns full breakdown shape with `available: true`
- Flyway migration creates rating tables safely
- Player list/detail APIs include ACR data
- Frontend displays ACR breakdown, confidence badges, and history chart correctly
- Integration tests pass for all rating endpoints
