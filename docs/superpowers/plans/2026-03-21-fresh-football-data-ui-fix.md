# Fresh Football Data & Production UI Fix — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wipe stale Football player data, re-seed 100 players via AI with Wikipedia images and proper ELO scores, fix eloScore visibility in the API and frontend, and polish the UI.

**Architecture:** V8 Flyway migration wipes all rating + football data. Existing `Top100SeedingService` re-seeds via Anthropic API with Wikipedia photos. One-line change in `savePlayer()` sets ELO from rank. Backend top100 endpoint and Player entity updated to expose `eloScore`. Frontend Players Directory and Player Profile updated to show ELO.

**Tech Stack:** Java 17 / Spring Boot 3.2 / Flyway / PostgreSQL / React 18 / TailwindCSS

---

## File Structure

| Action | File | Responsibility |
|--------|------|---------------|
| Create | `services/player-service/src/main/resources/db/migration/V8__wipe_football_for_reseed.sql` | SQL to wipe all rating tables and football players/analysis |
| Modify | `services/player-service/src/main/java/.../service/Top100SeedingService.java:277` | Set `eloScore` from rank during save |
| Modify | `services/player-service/src/main/java/.../controller/PlayerController.java:152-176` | Add `eloScore` to top100 endpoint response map |
| Modify | `src/pages/players-directory/index.jsx:297-309` | Show ELO score in player cards |
| Modify | `src/pages/players-directory/index.jsx:358-364` | Show ELO score in list view |
| Modify | `src/pages/player-profile/index.jsx:18-60` | Add eloScore to `transformPlayer()` |

---

## Chunk 1: Backend — Data Wipe & ELO Fix

### Task 1: V8 Migration — Wipe All Data

**Files:**
- Create: `services/player-service/src/main/resources/db/migration/V8__wipe_football_for_reseed.sql`

- [ ] **Step 1: Create the V8 migration file**

```sql
-- V8: Wipe all rating tables and football players for clean re-seed.
-- Rating tables are empty but truncate for safety.

-- Truncate rating tables (dependency order)
TRUNCATE TABLE nomination_support CASCADE;
TRUNCATE TABLE nomination CASCADE;
TRUNCATE TABLE elo_matchup CASCADE;
TRUNCATE TABLE ranking_history CASCADE;
TRUNCATE TABLE rating_day CASCADE;

-- Delete football AI analysis (references players)
DELETE FROM ai_analysis WHERE player_id IN (
    SELECT id FROM players WHERE sport = 'FOOTBALL'
);

-- Delete football players
DELETE FROM players WHERE sport = 'FOOTBALL';
```

- [ ] **Step 2: Verify migration compiles**

Run from `services/player-service/`:
```bash
mvn compile -q
```
Expected: BUILD SUCCESS (Flyway validates migration files at compile time)

- [ ] **Step 3: Commit**

```bash
git add services/player-service/src/main/resources/db/migration/V8__wipe_football_for_reseed.sql
git commit -m "chore(db): V8 migration to wipe football data for clean re-seed"
```

---

### Task 2: Set ELO Score During Seeding

**Files:**
- Modify: `services/player-service/src/main/java/com/topplayersofallsports/playerservice/service/Top100SeedingService.java`

The `savePlayer()` method at line 265-278 sets player fields but never sets `eloScore`. Add one line after `setRankingScore()` (line 277).

- [ ] **Step 1: Add eloScore calculation to savePlayer()**

In `Top100SeedingService.java`, after line 277 (`player.setRankingScore(...)`), add:

```java
        player.setEloScore(info.getRank() != null ? 1800.0 - ((info.getRank() - 1) * 6.06) : 1500.0);
```

This matches the V7 migration formula: rank #1 = 1800, rank #100 = ~1200.

- [ ] **Step 2: Verify compilation**

```bash
mvn compile -q
```
Expected: BUILD SUCCESS

- [ ] **Step 3: Commit**

```bash
git add services/player-service/src/main/java/com/topplayersofallsports/playerservice/service/Top100SeedingService.java
git commit -m "feat(seeding): set eloScore from rank during Top 100 seeding"
```

---

### Task 3: Expose eloScore in Top 100 API Endpoint

**Files:**
- Modify: `services/player-service/src/main/java/com/topplayersofallsports/playerservice/controller/PlayerController.java`

The `/api/players/top100/{sport}` endpoint (line 152-176) builds a manual `Map<String, Object>` response. It includes `rating` but not `eloScore`. Add it.

- [ ] **Step 1: Add eloScore to the top100 response map**

In `PlayerController.java`, inside the `.map(player -> { ... })` lambda (after line 166 where `isActive` is put), add:

```java
                p.put("eloScore", player.getEloScore() != null ? Math.round(player.getEloScore()) : 1500);
```

- [ ] **Step 2: Verify compilation**

```bash
mvn compile -q
```
Expected: BUILD SUCCESS

- [ ] **Step 3: Commit**

```bash
git add services/player-service/src/main/java/com/topplayersofallsports/playerservice/controller/PlayerController.java
git commit -m "feat(api): expose eloScore in top100 endpoint response"
```

---

## Chunk 2: Frontend — Show ELO Scores

### Task 4: Add ELO Score to Players Directory Cards

**Files:**
- Modify: `src/pages/players-directory/index.jsx`

The card view (lines 254-319) shows a "Rating" bar using `aiRating`. Add an ELO badge next to the rank badge.

- [ ] **Step 1: Add ELO badge to card view**

In the card view, after the rating bar section (line 309, closing `</div>` of the rating bar), add an ELO display row:

Find this block (approx lines 297-309):
```jsx
                    {/* Rating bar */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-text-secondary">Rating</span>
                        <span className={`font-bold tabular-nums ${getRatingColor(rating)}`}>{rating}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-700"
                          style={{ width: `${Math.min(rating, 100)}%` }}
                        />
                      </div>
                    </div>
```

Replace with:
```jsx
                    {/* Rating + ELO */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-text-secondary">Rating</span>
                          <span className={`font-bold tabular-nums ${getRatingColor(rating)}`}>{rating}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden w-24">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-700"
                            style={{ width: `${Math.min(rating, 100)}%` }}
                          />
                        </div>
                      </div>
                      {player.eloScore != null && (
                        <div className="bg-muted px-2.5 py-1 rounded-lg text-center">
                          <div className="text-[10px] text-text-secondary leading-none">ELO</div>
                          <div className="text-sm font-bold text-accent tabular-nums">{player.eloScore}</div>
                        </div>
                      )}
                    </div>
```

- [ ] **Step 2: Add ELO column to list view**

In the list view table header (line 330), add 'ELO' to the array:

Change:
```jsx
                      {['Rank', 'Player', 'Position', 'Nationality', 'Age', 'Rating', 'Status'].map(h => (
```
To:
```jsx
                      {['Rank', 'Player', 'Position', 'Nationality', 'Age', 'Rating', 'ELO', 'Status'].map(h => (
```

In the table body (after the Rating `<td>` at line 365, before the Status `<td>` at line 366), add:

```jsx
                          <td className="px-4 py-3">
                            <span className="font-bold tabular-nums text-sm text-accent">{player.eloScore ?? '—'}</span>
                          </td>
```

- [ ] **Step 3: Add ELO to sort options**

In the sort options Select (line 184-189), add an ELO option:

Change:
```jsx
                options={[
                  { value: 'rank',   label: 'By Rank' },
                  { value: 'rating', label: 'By Rating' },
                  { value: 'name',   label: 'By Name' },
                  { value: 'age',    label: 'By Age' },
                ]}
```
To:
```jsx
                options={[
                  { value: 'rank',   label: 'By Rank' },
                  { value: 'rating', label: 'By Rating' },
                  { value: 'elo',    label: 'By ELO' },
                  { value: 'name',   label: 'By Name' },
                  { value: 'age',    label: 'By Age' },
                ]}
```

In the sort logic (lines 79-89), add ELO case:

Change:
```jsx
        case 'rating': av = a.aiRating ?? a.rating ?? 0; bv = b.aiRating ?? b.rating ?? 0; break;
```
To:
```jsx
        case 'rating': av = a.aiRating ?? a.rating ?? 0; bv = b.aiRating ?? b.rating ?? 0; break;
        case 'elo':    av = a.eloScore ?? 0; bv = b.eloScore ?? 0; break;
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/players-directory/index.jsx
git commit -m "feat(frontend): show ELO scores in Players Directory cards and list view"
```

---

### Task 5: Add ELO Score to Player Profile

**Files:**
- Modify: `src/pages/player-profile/index.jsx`

The `transformPlayer()` function (line 18-60) transforms backend data. Add `eloScore` to the transform.

- [ ] **Step 1: Add eloScore to transformPlayer()**

In the `transformPlayer()` function, in the return object (after the `nationality` field at line 50), add:

```javascript
    eloScore: raw.eloScore || null,
```

Note: The Player Profile page uses `getPlayerById()` which returns the raw Player entity. The `eloScore` field needs to be present in the entity JSON. If it's still missing after the re-seed (because the entity serialization bug), we'll add `@JsonProperty("eloScore")` to the Player entity as a fallback.

- [ ] **Step 2: Verify the PlayerHero component shows the field**

Read `src/pages/player-profile/components/PlayerHero.jsx` to check if it already has an ELO display area or if one needs to be added.

- [ ] **Step 3: Commit**

```bash
git add src/pages/player-profile/index.jsx
git commit -m "feat(frontend): add eloScore to player profile transform"
```

---

## Chunk 3: Test & Seed

### Task 6: Restart Backend, Run Migration, Trigger Re-seed

This task is manual (no code changes). Run these steps to verify everything works.

- [ ] **Step 1: Stop the running backend**

```bash
taskkill /F /IM java.exe
```

- [ ] **Step 2: Clean compile and start**

```bash
cd services/player-service
mvn clean compile -q
mvn spring-boot:run
```

Wait for "Started PlayerServiceApplication" in logs. The V8 migration will run automatically and wipe football data.

- [ ] **Step 3: Verify data is wiped**

```bash
curl -s http://localhost:8084/api/players/top100/football | python -c "import sys,json; d=json.load(sys.stdin); print(f'Count: {d[\"count\"]}')"
```
Expected: `Count: 0`

- [ ] **Step 4: Trigger re-seed**

The admin endpoint requires ADMIN role. Use the reseed endpoint which also clears data first (safe since already empty):

```bash
# If you have an admin JWT token:
curl -X POST http://localhost:8084/api/admin/players/top100/seed/football \
  -H "Authorization: Bearer <ADMIN_TOKEN>"

# Alternative: If no admin token available, call the service directly from a test or
# temporarily add the seed endpoint to permitAll in SecurityConfig
```

Monitor logs for seeding progress. Takes ~5-10 minutes for 100 players.

- [ ] **Step 5: Verify re-seeded data**

```bash
# Check player count
curl -s http://localhost:8084/api/players/top100/football | python -c "
import sys,json
d=json.load(sys.stdin)
print(f'Count: {d[\"count\"]}')
for p in d['players'][:5]:
    print(f'  #{p[\"rank\"]} {p[\"name\"]} ELO:{p.get(\"eloScore\",\"MISSING\")} photo:{bool(p.get(\"photoUrl\"))}')
"
```
Expected: 100 players with eloScore values (1800 for #1, ~1200 for #100) and most with photoUrl set.

- [ ] **Step 6: Verify eloScore appears in entity JSON**

```bash
# Test the /api/players?sport=FOOTBALL endpoint (returns Player entity directly)
curl -s "http://localhost:8084/api/players?sport=FOOTBALL" | python -c "
import sys,json
d=json.load(sys.stdin)
p = sorted(d, key=lambda x: x.get('currentRank',999))[0]
print('eloScore in response:', 'eloScore' in p)
print('Keys:', sorted(p.keys()))
"
```

If `eloScore` is still missing from the entity JSON, apply the fallback fix:

In `Player.java` (line 94-96), add `@JsonProperty`:
```java
    @Column(name = "elo_score")
    @Builder.Default
    @JsonProperty("eloScore")
    private Double eloScore = 1500.0;
```

Add import: `import com.fasterxml.jackson.annotation.JsonProperty;`

- [ ] **Step 7: Start the frontend dev server**

```bash
cd /e/Startup_projects/topplayersofallsports
npm run dev
```

Open `http://localhost:5173/players` — verify player images and ELO scores display.

Open `http://localhost:5173/rating-day` — verify the page loads (should show "No active Rating Day" since none is active).
