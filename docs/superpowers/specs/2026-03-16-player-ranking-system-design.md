# Player Ranking System — Design Spec

**Date:** 2026-03-16
**Status:** Approved
**Branch:** `highlight-service`

## Overview

A community-driven, AI-powered ranking system for the Top 100 All-Time Greatest Players across 5 sports (Football, Basketball, MMA, Cricket, Tennis). Users vote in monthly "Rating Day" head-to-head matchups (ELO-style). An AI seeds the initial lists and evaluates nominations for new entrants via a relegation battle mechanic.

**Core philosophy:** This is an "All-Time Greatest" museum — not a live sports tracker. Rankings reflect historical greatness debated by the community.

---

## Section 1: Data Model

### Migration Strategy

Existing Flyway migrations: V1 (baseline), V2 (seed football), V3 (deduplicate), V6 (auth tables). V4 and V5 were deleted (old ACR system). New migrations:

- **V7__add_elo_and_rating_day_tables.sql** — Adds `elo_score` column to `players` table, creates `rating_day`, `elo_matchup`, `nomination`, `ranking_history` tables
- **V8__seed_all_sports_top100.sql** — Optional: if AI seeding is done via workflow, this migration is skipped

### Entity Changes to Player (existing table)

The `Player` entity already exists with `ranking_score`, `current_rank`, `previous_rank`, etc. Changes:
- **Add** `elo_score DOUBLE PRECISION` — the ELO rating used for head-to-head voting
- **Keep** `ranking_score` — repurposed as a display score (set equal to `elo_score` after each Rating Day)
- **Keep** `AIAnalysis` as a separate entity — biography, strengths, career_highlights, analysis_text remain in `ai_analysis` table with `@OneToOne` relationship to Player. No denormalization.

### New Entities

#### EloMatchup
| Field | Type | Notes |
|-------|------|-------|
| id | BIGSERIAL PK | |
| rating_day_id | BIGINT FK → rating_day | Which Rating Day this belongs to |
| player1_id | BIGINT FK → players | Always the lower ID of the pair |
| player2_id | BIGINT FK → players | Always the higher ID of the pair |
| voter_user_id | VARCHAR(255) FK → users | UUID String matching existing User.id |
| winner_id | BIGINT FK → players | Which player was picked |
| player1_elo_before | DOUBLE PRECISION | Snapshot for audit |
| player2_elo_before | DOUBLE PRECISION | |
| player1_elo_after | DOUBLE PRECISION | |
| player2_elo_after | DOUBLE PRECISION | |
| voted_at | TIMESTAMP | |

**Canonical ordering:** `player1_id < player2_id` always. This ensures the unique constraint correctly deduplicates regardless of presentation order.

#### RatingDay
| Field | Type | Notes |
|-------|------|-------|
| id | BIGSERIAL PK | |
| sport | VARCHAR(50) | One Rating Day per sport per month |
| month | VARCHAR(7) | e.g. "2026-03" |
| status | VARCHAR(20) | UPCOMING, ACTIVE, CLOSED, FINALIZED |
| opens_at | TIMESTAMP | Start of voting window |
| closes_at | TIMESTAMP | End of voting window (48h window) |
| total_votes | INTEGER DEFAULT 0 | Running count |
| total_voters | INTEGER DEFAULT 0 | Unique voter count |
| created_at | TIMESTAMP | |

#### Nomination
| Field | Type | Notes |
|-------|------|-------|
| id | BIGSERIAL PK | |
| rating_day_id | BIGINT FK → rating_day | |
| sport | VARCHAR(50) | |
| player_name | VARCHAR(255) | Nominated player name |
| nominated_by_user_id | VARCHAR(255) FK → users | UUID String matching existing User.id |
| support_votes | INTEGER DEFAULT 0 | How many users upvoted |
| status | VARCHAR(20) | PENDING, EVALUATING, APPROVED, REJECTED |
| ai_reasoning | TEXT | AI's evaluation explanation |
| replaces_player_id | BIGINT FK → players | Nullable — who gets relegated |
| created_at | TIMESTAMP | |

#### RankingHistory
| Field | Type | Notes |
|-------|------|-------|
| id | BIGSERIAL PK | |
| player_id | BIGINT FK → players | |
| sport | VARCHAR(50) | |
| month | VARCHAR(7) | |
| rank_before | INTEGER | |
| rank_after | INTEGER | |
| elo_before | DOUBLE PRECISION | |
| elo_after | DOUBLE PRECISION | |
| change_reason | VARCHAR(50) | VOTE, NOMINATION, SEED |
| created_at | TIMESTAMP | |

### Key Constraints
- UNIQUE(rating_day: sport, month) — one Rating Day per sport per month
- UNIQUE(elo_matchup: rating_day_id, voter_user_id, player1_id, player2_id) — no duplicate votes, canonicalized by player1_id < player2_id
- UNIQUE(nomination: rating_day_id, nominated_by_user_id, sport) — max 1 nomination per user per sport per Rating Day
- CHECK(elo_matchup: player1_id < player2_id) — enforce canonical pair ordering
- CHECK(elo_matchup: winner_id IN (player1_id, player2_id))

---

## Section 2: Backend Architecture & API

### Temporal Workflows

#### 1. InitialSeedWorkflow
**Trigger:** Manual admin endpoint (`POST /api/admin/seed/{sport}`)
**Task queue:** `player-registration`
**Steps:**
1. Call AI (OpenRouter Llama 3.3 70B) — the AI prompt includes instructions to generate the Top 100 all-time greatest players for the sport based on its training data knowledge
2. AI returns Top 100 players with: name, position, nationality, most iconic team, bio, strengths (JSON array), career highlights (JSON array), analysis text
3. Assign initial ELO scores: #1 gets 1800, #100 gets 1200, linearly interpolated (~6.06 points per rank)
4. Create Player entities (or update existing ones) + AIAnalysis entities
5. Set `ranking_score = elo_score` for each player
6. Write initial RankingHistory records (reason: SEED)
7. Retry policy: 3 attempts per sport, 60s timeout per AI call (large response)

**Note:** This replaces the existing `PlayerRankingWorkflow.initializeTop50()` — the new workflow generates 100 players per sport instead of 50.

#### 2. MonthlyRatingDayWorkflow
**Trigger:** Temporal cron schedule — 1st of every month at 00:00 UTC
**Task queue:** `player-registration`

**Temporal replay safety note:** This workflow uses `Workflow.newTimer()` for the 48-hour wait. This is replay-safe by design — if the worker restarts mid-timer, Temporal replays the workflow history and the timer resumes from where it left off. Do NOT use `Thread.sleep()`.

**Steps:**
1. **Open phase:** Create RatingDay records (status: ACTIVE) for all 5 sports. Set `opens_at = now()`, `closes_at = now() + 48h`
2. **Wait:** `Workflow.newTimer(Duration.ofHours(48))`
3. **Close phase:** Set all RatingDay status to CLOSED
4. **Evaluate nominations:** Spawn NominationEvaluationWorkflow as child workflow
5. **Finalize:**
   - Recalculate ranks from ELO scores per sport (ORDER BY elo_score DESC)
   - Write RankingHistory for all rank changes
   - Update `Player.current_rank`, `Player.previous_rank`, `Player.ranking_score = elo_score`
   - Set RatingDay status to FINALIZED

#### 3. NominationEvaluationWorkflow
**Trigger:** Child workflow spawned by MonthlyRatingDayWorkflow during finalization
**Steps:**
1. Gather nominations with `support_votes >= 5` (low threshold for early adoption, increase later)
2. For each qualifying nomination:
   a. AI evaluates: "Should {nominee} enter the Top 100 for {sport}? Here is the current #100 player: {name, stats}. Compare their careers."
   b. AI's prompt includes the nominee's name and the current #100 player's profile for context
   c. If approved: #100 player (lowest ELO) is relegated — `current_rank` set to NULL
   d. AI writes reasoning (stored in `nomination.ai_reasoning`)
   e. New player enters with ELO = current #100's ELO (takes their spot)
   f. AI generates full profile (bio, strengths, highlights) for the new entrant
3. Retry policy: 3 attempts per nomination evaluation, 30s timeout

### REST API Endpoints

#### Public (no auth)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/players/top100/{sport}` | Full Top 100 with ELO scores, rank, details |
| GET | `/api/players/{id}` | Single player with full profile |
| GET | `/api/players/search?name=` | Search players by name |
| GET | `/api/players/compare?p1=&p2=` | Side-by-side comparison |
| GET | `/api/rating-day/current/{sport}` | Current Rating Day status + stats |
| GET | `/api/rating-day/{id}/results` | Finalized results: movers, new entrants |
| GET | `/api/rating-day/{sport}/history` | Past Rating Day summaries |

#### Authenticated (Google OAuth required)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/rating-day/{id}/matchup` | Get next head-to-head matchup for user |
| POST | `/api/rating-day/{id}/vote` | Submit vote — body: `{ "matchupPlayer1Id": Long, "matchupPlayer2Id": Long, "winnerId": Long }` |
| POST | `/api/rating-day/{id}/skip` | Skip matchup — body: `{ "player1Id": Long, "player2Id": Long }` |
| GET | `/api/rating-day/{id}/my-votes` | User's vote history for this Rating Day |
| POST | `/api/nominations` | Submit nomination — body: `{ "sport": String, "playerName": String, "reason": String }` |
| POST | `/api/nominations/{id}/support` | Upvote a nomination |
| GET | `/api/nominations/{sport}/current` | View current nominations for active Rating Day |

**Vote response:** Returns `{ "player1EloAfter": Double, "player2EloAfter": Double, "nextMatchup": { ... } | null }` — includes ELO change and pre-fetched next matchup for smooth UX.

#### Admin
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/admin/seed/{sport}` | Trigger InitialSeedWorkflow for specific sport |
| POST | `/api/admin/rating-day/trigger` | Manually trigger Rating Day for all 5 sports |

### ELO Algorithm
- **K-factor:** 32 (standard)
- **Formula:** Standard ELO — `expectedScore = 1 / (1 + 10^((Rb-Ra)/400))`
- **Update:** `newRa = Ra + K * (actualScore - expectedScore)` where actualScore = 1 (win) or 0 (loss)
- **Application:** Each vote immediately updates both players' ELO scores in the database
- **Max matchups:** 50 per user per sport per Rating Day

### Matchup Selection Logic
1. Get all 100 players for the sport in current Rating Day
2. Filter out pairs the user has already voted on **in this Rating Day** (query elo_matchup by rating_day_id + voter_user_id)
3. Prefer matchups between players within ~20 rank positions of each other (more interesting debates)
4. Canonicalize pair: always store `player1_id < player2_id`
5. Randomize from filtered pool
6. If no matchups remain, return 204 No Content (user has voted on all available pairs)

### Redis Usage
- **Rate limiting:** `ratelimit:vote:{userId}` — max 10 votes per minute per user, TTL 60s
- **Active Rating Day cache:** `ratingday:current:{sport}` — cached RatingDay status, TTL 5 minutes
- **Vote count cache:** `ratingday:{id}:votes` — INCREMENT on each vote for real-time counter, reconcile with DB on finalize

---

## Section 3: Frontend Experience

### Screen 1: Home Dashboard
- **Sport filter pills** at top (Football, Basketball, MMA, Cricket, Tennis)
- **Rating Day banner** (when active): gradient card with countdown timer, vote count, "Vote Now" CTA
- **Top 5 preview** per selected sport: rank, photo, name, position, nationality, ELO score, rank change indicator (+/-)
- **"View Full Top 100"** link to Players Directory

### Screen 2: Head-to-Head Voting (`/rating-day/{sport}`)
- **Two player cards** side by side with photo, name, position, nationality, rank, career summary
- **"Pick [Name]"** button on each card
- **Match counter**: "Match 7 of 50"
- **Skip button** for uncertain matchups
- **Progress/countdown** bar
- **Post-vote animation**: brief ELO change reveal (+12 / -12) before loading next matchup
- **Login gate**: Redirect to Google OAuth if not authenticated
- **Responsive:** Cards stack vertically on mobile with full-width tap targets

### Screen 3: Monthly Results (`/rating-day/{sport}/results`)
- **Summary header**: total votes, total voters, nominations reviewed
- **New entrant announcement cards**: who entered, who they replaced, AI reasoning quote
- **Biggest movers**: top 3 risers and fallers with rank change arrows
- **Full ranking diff**: expandable view of all 100 positions with movement indicators

### Existing Pages (updated to consume new data)
- **Players Directory** (`/players`): Already calls `/api/players/top100/{sport}` — displays ELO score as "Rating", rank change from previous_rank
- **Player Profile** (`/player-profile/:id`): Shows bio, strengths, highlights from AIAnalysis, ELO score, rank history chart from RankingHistory

### UI/UX Standards
- Match existing TailwindCSS design system (dark slate backgrounds, blue accents, rounded cards)
- Skeleton loaders for all async data fetches
- Responsive design: voting cards stack vertically on mobile
- Error boundaries with friendly fallback UI and retry buttons
- Consistent component patterns with existing tabs (Redux Toolkit for state, playerApiService for API calls)
- Production-quality polish — no rough prototypes, every screen matches existing tab quality

---

## Section 4: Edge Cases & Safeguards

### Cold Start
- AI generates initial Top 100 per sport via InitialSeedWorkflow
- ELO seeded linearly: #1 = 1800, #100 = 1200
- Initial profiles include bio, strengths, career highlights, position, nationality via AIAnalysis entity
- Admin triggers seeding per sport via `POST /api/admin/seed/{sport}`

### Vote Manipulation
- One Google account = one vote per matchup (DB unique constraint)
- Max 50 matchups per user per sport per Rating Day
- Redis rate limiting: max 10 votes/minute per user
- Canonical pair ordering (player1_id < player2_id) prevents duplicate-via-reorder

### Tie Handling
- If ELO scores are equal after Rating Day, preserve previous rank order (stability)

### Nomination Spam
- Max 1 nomination per user per sport per Rating Day (DB unique constraint)
- AI only evaluates nominations with >= 5 support votes (low for early adoption)
- AI reasoning is transparent — shown to all users

### Empty State
- If a sport has zero Rating Day votes, rankings stay frozen — no phantom movement
- RatingDay still transitions to FINALIZED but no RankingHistory changes written

### Stale Profiles
- AI-generated bios and career highlights regenerated quarterly via Temporal scheduled workflow

### Error States
- Loading: Skeleton loaders matching existing app patterns
- Network errors: Friendly fallback UI with retry button (not blank screens)
- Auth required: Clear "Sign in with Google to vote" prompt
- Rating Day closed: Banner changes to "Voting has ended — results coming soon"

---

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Redux Toolkit + TailwindCSS |
| Backend | Java 17 + Spring Boot 3 + Spring Security |
| Database | PostgreSQL (Flyway migrations V7+) |
| Cache | Redis (rate limiting, vote counts, Rating Day status cache) |
| Workflows | Temporal (seeding, monthly Rating Day, nomination eval) |
| AI | OpenRouter (Llama 3.3 70B free) — training data knowledge, no web search |
| Auth | Google OAuth (already built) + JWT |

---

## What's NOT in Scope
- Cross-sport matchups (Messi vs LeBron) — never
- Real-time stats integration — this is an all-time greatest museum
- Web search API integration for AI context — rely on model training data
- User-created custom lists or tier lists
- Social features (comments, follows, sharing) — future phase
- Paid tiers or premium features
