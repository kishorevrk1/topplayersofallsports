# Fresh Football Data & Production UI Fix — Design Spec

## Goal

Wipe stale Football player data, re-seed 100 players via AI with Wikipedia images and proper ELO scores, fix the `eloScore` serialization bug, and polish the frontend (Rating Day, Players Directory, Player Profile) to work with real data and prominent player images.

## Architecture

- **V8 Flyway migration**: Truncates all rating tables and deletes Football players (clean slate)
- **Existing AI seeding pipeline**: `Top100SeedingService` → Anthropic API (claude-3-5-haiku) → `PlayerImageEnrichmentService` (Wikipedia photos) — already built, no changes needed to the prompt or pipeline
- **eloScore fix**: The V7 migration seeds ELO from rank (`1800 - (rank-1)*6.06`), so after re-seeding V7 runs again and sets ELO. The serialization bug must be fixed in the Player entity or Jackson config.
- **Frontend fixes**: Cosmetic — display `eloScore` and `photoUrl` where they exist, fix the existing Rating Day page, update Players Directory and Player Profile.

## Subsystems

### 1. V8 Migration — Data Wipe

**File**: `services/player-service/src/main/resources/db/migration/V8__wipe_football_for_reseed.sql`

Truncate in dependency order:
1. `nomination_support` (depends on nomination)
2. `nomination` (depends on rating_day, users)
3. `elo_matchup` (depends on rating_day, players, users)
4. `ranking_history` (depends on players)
5. `rating_day` (standalone)
6. Delete `ai_analysis` where player sport = FOOTBALL
7. Delete `players` where sport = FOOTBALL

Use `TRUNCATE ... CASCADE` for the new rating tables (they're empty anyway). Use `DELETE` for players/ai_analysis to preserve other sports' data (none exists yet, but future-safe).

### 2. Fix `eloScore` Serialization Bug

**Problem**: The `eloScore` field exists in `Player.java` (line 94-96) with `@Column(name = "elo_score")` and `@Builder.Default private Double eloScore = 1500.0`, but it does NOT appear in API JSON responses.

**Root cause investigation**: The field uses `@Builder.Default` which only affects the Builder pattern. When JPA loads the entity from the database via the no-arg constructor, the field initializer `= 1500.0` should still work. However, if the DB column value is `NULL` (not `1500`), JPA will set the field to `null`, and Jackson will serialize it as `null` — but it should still appear in JSON.

The fact that `eloScore` is completely absent from the JSON (not even `"eloScore": null`) suggests Jackson is configured to skip null fields somewhere, OR the getter is not being generated properly.

**Likely fix**: The V7 migration sets `elo_score` via UPDATE, but the current data was seeded BEFORE V7 ran. V7's UPDATE has `WHERE elo_score = 1500 OR elo_score IS NULL` — this should have worked. After V8 wipe + re-seed, V7's UPDATE will run on the fresh data. But we should also verify the Jackson serialization works.

**Action**:
- After V8 wipe + re-seed, verify `eloScore` appears in JSON
- If it still doesn't, add `@JsonProperty("eloScore")` annotation explicitly
- If Jackson is skipping nulls globally, add `@JsonInclude(JsonInclude.Include.ALWAYS)` to the field

### 3. Re-seed Football via Admin Endpoint

No code changes needed. The existing pipeline handles everything:

1. `POST /api/admin/players/top100/seed/FOOTBALL` (requires ADMIN JWT)
2. `Top100SeedingService.seedTop100ForSport(FOOTBALL)` runs async
3. For each batch of 10 players:
   - Anthropic API generates player data (name, team, position, nationality, biography, etc.)
   - `PlayerImageEnrichmentService.findPhotoUrl()` queries Wikipedia for photo
   - Player saved with `photoUrl` set to Wikipedia thumbnail (500px)
   - `AIAnalysis` saved with biography, highlights, strengths
4. V7 migration already ran, so `elo_score` column exists with DEFAULT 1500
5. After seeding, manually run: `UPDATE players SET elo_score = 1800 - ((current_rank - 1) * 6.06) WHERE sport = 'FOOTBALL' AND current_rank IS NOT NULL`

**Alternative**: Add ELO seeding to the `Top100SeedingService.savePlayer()` method so it calculates ELO from rank at save time. This is better than a manual SQL step.

**Decision**: Enhance `savePlayer()` to set `eloScore = 1800 - ((currentRank - 1) * 6.06)` when saving. One line of code, no manual step needed.

### 4. Frontend — Fix Rating Day Page

**File**: `src/pages/rating-day/index.jsx`

Current issues to fix:
- Ensure API calls use correct URLs
- Handle 204 No Content response (no active Rating Day) gracefully
- Show "No active Rating Day" state with next occurrence info
- Ensure matchup cards display player images from `photoUrl`

**File**: `src/pages/rating-day/components/MatchupCard.jsx`

Current issues to fix:
- Verify `photoUrl` is used for player images (check if it references `player1PhotoUrl` from MatchupResponse)
- Ensure AppImage fallback (initials avatar) works when photo is null
- Verify ELO badges display correctly

No redesign — just verify the existing code works with real data and fix any field name mismatches.

### 5. Frontend — Players Directory ELO + Images

**File**: `src/pages/players-directory/index.jsx` (or equivalent)

Changes:
- Display `eloScore` alongside or instead of `rankingScore`
- Show player `photoUrl` images prominently in the player cards/list
- Use AppImage component for fallback when photo is null

### 6. Frontend — Player Profile ELO + Images

**File**: `src/pages/player-profile/index.jsx` (or equivalent)

Changes:
- Display `eloScore` in the player stats section
- Show large player photo from `photoUrl`
- Use AppImage component for fallback

## Data Flow

```
V8 Migration runs → all Football data wiped
    ↓
Admin triggers POST /api/admin/players/top100/seed/FOOTBALL
    ↓
Top100SeedingService batches 10×10 players via Anthropic API
    ↓
Each player: Wikipedia photo resolved → saved with photoUrl + eloScore
    ↓
Frontend loads /api/players?sport=FOOTBALL → 100 players with photos + ELO
    ↓
Rating Day triggered → matchups show real player photos
```

## Out of Scope

- Other sports (Basketball, Cricket, Tennis, MMA) — Football only
- UI redesign — fix and polish existing
- Nomination AI evaluation — placeholder remains
- New features

## Testing

- After V8 migration: verify 0 Football players in DB
- After re-seed: verify 100 Football players with `photoUrl` not null for most, `eloScore` set correctly (1800 for #1, ~1200 for #100)
- API: `GET /api/players?sport=FOOTBALL` returns `eloScore` and `photoUrl` in JSON
- Frontend: Players Directory shows images and ELO, Player Profile shows large image, Rating Day matchup cards show player photos
