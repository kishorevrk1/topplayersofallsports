# ACR Production Hardening Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the ACR backend-frontend contract mismatches, add Flyway migrations, wire ACR data into player list/detail APIs, and add integration tests.

**Architecture:** The ACR system uses dual AI models via OpenRouter, stores consensus in `rating_consensus` table, and exposes via `RatingController`. The fix aligns the `POST /rating/refresh` response with the `GET /rating/breakdown` shape, enriches player list APIs with ACR fields, and adds proper Flyway schema management.

**Tech Stack:** Java 17, Spring Boot, JPA/Hibernate, Flyway, PostgreSQL, JUnit 5 + MockMvc, React (JSX)

---

### Task 1: Fix POST /rating/refresh endpoint to return full breakdown shape

**Files:**
- Modify: `services/player-service/src/main/java/com/topplayersofallsports/playerservice/controller/RatingController.java:149-181`

**Step 1: Extract breakdown response builder into a private helper**

The `GET /rating/breakdown` endpoint (lines 66-103) builds a full response map. Extract this into a reusable method so both GET and POST endpoints return the same shape.

Add this private method after `getConfidenceStats()`:

```java
private Map<String, Object> buildBreakdownResponse(Player player, RatingConsensus rc) {
    boolean isStale = rc.getExpiresAt() != null && rc.getExpiresAt().isBefore(LocalDateTime.now());

    Map<String, Object> response = new HashMap<>();
    response.put("playerId", player.getId());
    response.put("playerName", player.getName());
    response.put("sport", player.getSport().name());
    response.put("available", true);
    response.put("stale", isStale);

    response.put("consensusRating", rc.getConsensusRating());
    response.put("confidenceLevel", rc.getConfidenceLevel());
    response.put("divergenceScore", rc.getDivergenceScore());

    Map<String, Object> models = new HashMap<>();
    models.put("primary", Map.of(
        "name", rc.getModel1Name() != null ? rc.getModel1Name() : "unknown",
        "score", rc.getModel1Rating() != null ? rc.getModel1Rating() : 0
    ));
    models.put("secondary", Map.of(
        "name", rc.getModel2Name() != null ? rc.getModel2Name() : "unknown",
        "score", rc.getModel2Rating() != null ? rc.getModel2Rating() : 0
    ));
    response.put("models", models);

    response.put("criteriaBreakdown", rc.getCriteriaBreakdown());
    response.put("reasoning", rc.getReasoningText());
    response.put("dataPointsCited", rc.getDataPointsCited());
    response.put("caveats", rc.getCaveats());
    response.put("generatedAt", rc.getCreatedAt());
    response.put("expiresAt", rc.getExpiresAt());

    return response;
}
```

**Step 2: Refactor GET /rating/breakdown to use the helper**

Replace lines 66-103 in `getRatingBreakdown()` with:
```java
RatingConsensus rc = consensusOpt.get();
return ResponseEntity.ok(buildBreakdownResponse(player, rc));
```

**Step 3: Refactor POST /rating/refresh to return full breakdown**

Replace lines 171-180 in `refreshRating()` with:
```java
return ResponseEntity.ok(buildBreakdownResponse(player, consensus));
```

**Step 4: Verify the change compiles**

Run: `cd services/player-service && mvn compile -q`
Expected: BUILD SUCCESS

**Step 5: Commit**

```bash
git add services/player-service/src/main/java/com/topplayersofallsports/playerservice/controller/RatingController.java
git commit -m "fix: POST /rating/refresh returns full breakdown shape with available:true"
```

---

### Task 2: Wire ACR data into GET /api/players/{id} response

**Files:**
- Modify: `services/player-service/src/main/java/com/topplayersofallsports/playerservice/controller/PlayerController.java:61-103`

**Step 1: Add ACR fields to the single-player response**

After line 91 (`response.put("rankingScore", ...)`), add:

```java
// ACR consensus data (if available)
ratingConsensusRepository.findByPlayer(player).ifPresent(rc -> {
    response.put("consensusRating", rc.getConsensusRating());
    response.put("confidenceLevel", rc.getConfidenceLevel());
    response.put("divergenceScore", rc.getDivergenceScore());
});
```

**Step 2: Verify compile**

Run: `cd services/player-service && mvn compile -q`

**Step 3: Commit**

```bash
git add services/player-service/src/main/java/com/topplayersofallsports/playerservice/controller/PlayerController.java
git commit -m "feat: include ACR consensus data in GET /api/players/{id}"
```

---

### Task 3: Wire ACR data into GET /api/players/top100/{sport} response

**Files:**
- Modify: `services/player-service/src/main/java/com/topplayersofallsports/playerservice/controller/PlayerController.java:134-196`

**Step 1: Add ACR fields to each player in the top100 list**

After line 177 (inside the `aiAnalysisRepository.findByPlayer` block, within the `map` lambda), add ACR lookup:

```java
// Add ACR consensus data if available
ratingConsensusRepository.findByPlayer(player).ifPresent(rc -> {
    p.put("consensusRating", rc.getConsensusRating());
    p.put("confidenceLevel", rc.getConfidenceLevel());
    p.put("divergenceScore", rc.getDivergenceScore());
});
```

This goes right after the `aiAnalysisRepository.findByPlayer(player).ifPresent(...)` block, still inside the `.map(player -> { ... })` lambda.

**Step 2: Verify compile**

Run: `cd services/player-service && mvn compile -q`

**Step 3: Commit**

```bash
git add services/player-service/src/main/java/com/topplayersofallsports/playerservice/controller/PlayerController.java
git commit -m "feat: include ACR data in top100 player list responses"
```

---

### Task 4: Add Flyway migration for rating tables

**Files:**
- Create: `services/player-service/src/main/resources/db/migration/V4__add_rating_consensus_and_history.sql`

**Step 1: Write the migration**

```sql
-- V4: Add ACR (AI Consensus Rating) tables
-- Uses IF NOT EXISTS because Hibernate ddl-auto may have already created them

CREATE TABLE IF NOT EXISTS rating_consensus (
    id BIGSERIAL PRIMARY KEY,
    player_id BIGINT NOT NULL UNIQUE REFERENCES players(id) ON DELETE CASCADE,
    model1_name VARCHAR(100),
    model2_name VARCHAR(100),
    model1_rating DOUBLE PRECISION,
    model2_rating DOUBLE PRECISION,
    consensus_rating DOUBLE PRECISION,
    confidence_level VARCHAR(20),
    divergence_score DOUBLE PRECISION,
    reasoning_text TEXT,
    criteria_breakdown TEXT,
    data_points_cited TEXT,
    caveats TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rating_history (
    id BIGSERIAL PRIMARY KEY,
    player_id BIGINT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    old_score DOUBLE PRECISION,
    new_score DOUBLE PRECISION,
    old_confidence VARCHAR(20),
    new_confidence VARCHAR(20),
    change_reason VARCHAR(50),
    triggered_by VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indices (IF NOT EXISTS for safety)
CREATE INDEX IF NOT EXISTS idx_rating_consensus_player ON rating_consensus(player_id);
CREATE INDEX IF NOT EXISTS idx_rating_consensus_expires ON rating_consensus(expires_at);
CREATE INDEX IF NOT EXISTS idx_rating_consensus_confidence ON rating_consensus(confidence_level);
CREATE INDEX IF NOT EXISTS idx_rating_history_player ON rating_history(player_id);
CREATE INDEX IF NOT EXISTS idx_rating_history_created ON rating_history(created_at);
```

**Step 2: Commit**

```bash
git add services/player-service/src/main/resources/db/migration/V4__add_rating_consensus_and_history.sql
git commit -m "feat: add Flyway V4 migration for rating_consensus and rating_history tables"
```

---

### Task 5: Fix OverviewTab.jsx to handle refresh response correctly

**Files:**
- Modify: `src/pages/player-profile/components/OverviewTab.jsx:31-37`

**Step 1: Fix the refresh handler**

The `refreshRating` response now returns the full breakdown shape with `available: true`. But as a safety net, also re-fetch the breakdown after refresh (in case the response shape ever diverges):

Replace lines 31-37:
```javascript
          // Auto-trigger generation on first visit
          try {
            const generated = await playerApiService.refreshRating(player.id);
            setRatingBreakdown(generated?.available ? generated : null);
          } catch {
            setRatingBreakdown(null);
          }
```

With:
```javascript
          // Auto-trigger generation on first visit
          try {
            await playerApiService.refreshRating(player.id);
            // Re-fetch breakdown to get canonical shape
            const freshBreakdown = await playerApiService.getRatingBreakdown(player.id);
            setRatingBreakdown(freshBreakdown?.available ? freshBreakdown : null);
            // Also refresh history since a new entry was created
            const freshHistory = await playerApiService.getRatingHistory(player.id);
            setRatingHistory(freshHistory?.history || []);
          } catch {
            setRatingBreakdown(null);
          }
```

**Step 2: Commit**

```bash
git add src/pages/player-profile/components/OverviewTab.jsx
git commit -m "fix: re-fetch ACR breakdown after refresh to ensure consistent data shape"
```

---

### Task 6: Add ACR confidence badge to PlayersDirectory cards

**Files:**
- Modify: `src/pages/players-directory/index.jsx`

**Step 1: Import ConfidenceBadge**

Add import after line 9:
```javascript
import ConfidenceBadge from '../../components/ConfidenceBadge';
```

**Step 2: Add confidence badge next to ACR Rating label in card view**

In the card view (around line 299), change:
```jsx
<span className="text-text-secondary">ACR Rating</span>
```
to:
```jsx
<span className="text-text-secondary flex items-center gap-1.5">
  ACR Rating
  {player.confidenceLevel && <ConfidenceBadge level={player.confidenceLevel} size="xs" />}
</span>
```

**Step 3: Add confidence column in list view**

In the table header (line 330), add `'Confidence'` to the headers array:
```javascript
{['Rank', 'Player', 'Position', 'Nationality', 'Age', 'Rating', 'Confidence', 'Status'].map(h => (
```

Add a new `<td>` after the Rating `<td>` (around line 365):
```jsx
<td className="px-4 py-3">
  {player.confidenceLevel ? (
    <ConfidenceBadge level={player.confidenceLevel} size="sm" />
  ) : (
    <span className="text-xs text-gray-400">—</span>
  )}
</td>
```

**Step 4: Commit**

```bash
git add src/pages/players-directory/index.jsx
git commit -m "feat: show ACR confidence badge in players directory cards and list"
```

---

### Task 7: Add RatingController integration tests

**Files:**
- Create: `services/player-service/src/test/java/com/topplayersofallsports/playerservice/RatingControllerTest.java`

**Step 1: Write the test class**

```java
package com.topplayersofallsports.playerservice;

import com.topplayersofallsports.playerservice.controller.RatingController;
import com.topplayersofallsports.playerservice.entity.Player;
import com.topplayersofallsports.playerservice.entity.RatingConsensus;
import com.topplayersofallsports.playerservice.entity.RatingHistory;
import com.topplayersofallsports.playerservice.entity.Sport;
import com.topplayersofallsports.playerservice.repository.PlayerRepository;
import com.topplayersofallsports.playerservice.repository.RatingConsensusRepository;
import com.topplayersofallsports.playerservice.repository.RatingHistoryRepository;
import com.topplayersofallsports.playerservice.service.JwtService;
import com.topplayersofallsports.playerservice.service.MultiModelRatingService;
import com.topplayersofallsports.playerservice.service.SoccerStatsService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(RatingController.class)
@WithMockUser
class RatingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean private PlayerRepository playerRepository;
    @MockBean private RatingConsensusRepository consensusRepository;
    @MockBean private RatingHistoryRepository historyRepository;
    @MockBean private MultiModelRatingService multiModelRatingService;
    @MockBean private SoccerStatsService soccerStatsService;
    @MockBean private JwtService jwtService;

    private Player testPlayer() {
        return Player.builder()
            .id(1L).name("Lionel Messi").sport(Sport.FOOTBALL).build();
    }

    private RatingConsensus testConsensus(Player player) {
        return RatingConsensus.builder()
            .id(1L).player(player)
            .model1Name("llama-3.3-70b").model2Name("gpt-4o-mini")
            .model1Rating(98.0).model2Rating(97.0)
            .consensusRating(97.5).confidenceLevel("HIGH").divergenceScore(1.0)
            .reasoningText("Both models agree Messi is exceptional.")
            .criteriaBreakdown("{\"peakPerformance\":29,\"longevity\":19,\"awardsAndTitles\":20,\"eraAdjustedImpact\":29}")
            .dataPointsCited("[\"7 Ballon d'Or\",\"91 goals in 2012\"]")
            .caveats("Based on career through 2025")
            .createdAt(LocalDateTime.now())
            .expiresAt(LocalDateTime.now().plusDays(7))
            .build();
    }

    @Test
    @DisplayName("GET /rating/breakdown returns full ACR data with available=true")
    void getBreakdown_returnsFullData() throws Exception {
        Player player = testPlayer();
        RatingConsensus rc = testConsensus(player);
        when(playerRepository.findById(1L)).thenReturn(Optional.of(player));
        when(consensusRepository.findByPlayer(player)).thenReturn(Optional.of(rc));

        mockMvc.perform(get("/api/players/1/rating/breakdown"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.available").value(true))
            .andExpect(jsonPath("$.consensusRating").value(97.5))
            .andExpect(jsonPath("$.confidenceLevel").value("HIGH"))
            .andExpect(jsonPath("$.models.primary.score").value(98.0))
            .andExpect(jsonPath("$.models.secondary.score").value(97.0))
            .andExpect(jsonPath("$.criteriaBreakdown").isNotEmpty())
            .andExpect(jsonPath("$.generatedAt").isNotEmpty());
    }

    @Test
    @DisplayName("GET /rating/breakdown returns available=false when no consensus")
    void getBreakdown_noConsensus() throws Exception {
        Player player = testPlayer();
        when(playerRepository.findById(1L)).thenReturn(Optional.of(player));
        when(consensusRepository.findByPlayer(player)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/players/1/rating/breakdown"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.available").value(false));
    }

    @Test
    @DisplayName("GET /rating/breakdown returns 404 for unknown player")
    void getBreakdown_notFound() throws Exception {
        when(playerRepository.findById(999L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/players/999/rating/breakdown"))
            .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("POST /rating/refresh returns full breakdown shape with available=true")
    void refreshRating_returnsBreakdownShape() throws Exception {
        Player player = testPlayer();
        RatingConsensus rc = testConsensus(player);
        when(playerRepository.findById(1L)).thenReturn(Optional.of(player));
        when(multiModelRatingService.calculateConsensus(eq(player), eq(Collections.emptyList()), any(), eq("MANUAL_TRIGGER"), eq("admin")))
            .thenReturn(rc);

        mockMvc.perform(post("/api/players/1/rating/refresh"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.available").value(true))
            .andExpect(jsonPath("$.consensusRating").value(97.5))
            .andExpect(jsonPath("$.confidenceLevel").value("HIGH"))
            .andExpect(jsonPath("$.models.primary.score").value(98.0))
            .andExpect(jsonPath("$.models.secondary.score").value(97.0));
    }

    @Test
    @DisplayName("GET /rating/history returns chronological entries")
    void getRatingHistory_returnsEntries() throws Exception {
        Player player = testPlayer();
        RatingHistory entry = RatingHistory.builder()
            .id(1L).player(player)
            .oldScore(null).newScore(97.5)
            .oldConfidence(null).newConfidence("HIGH")
            .changeReason("INITIAL_SEED").triggeredBy("system")
            .createdAt(LocalDateTime.now())
            .build();
        when(playerRepository.findById(1L)).thenReturn(Optional.of(player));
        when(historyRepository.findByPlayerIdOrderByCreatedAtDesc(eq(1L), any(PageRequest.class)))
            .thenReturn(List.of(entry));

        mockMvc.perform(get("/api/players/1/rating/history"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.playerId").value(1))
            .andExpect(jsonPath("$.totalEntries").value(1))
            .andExpect(jsonPath("$.history[0].newScore").value(97.5))
            .andExpect(jsonPath("$.history[0].changeReason").value("INITIAL_SEED"));
    }

    @Test
    @DisplayName("GET /confidence-stats returns breakdown by confidence level")
    void getConfidenceStats_returnsBreakdown() throws Exception {
        when(consensusRepository.countByConfidenceLevelAndSport(Sport.FOOTBALL))
            .thenReturn(List.of(
                new Object[]{"HIGH", 80L},
                new Object[]{"MEDIUM", 15L},
                new Object[]{"LOW", 5L}
            ));

        mockMvc.perform(get("/api/players/sport/FOOTBALL/confidence-stats"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalRated").value(100))
            .andExpect(jsonPath("$.breakdown.HIGH").value(80))
            .andExpect(jsonPath("$.percentages.HIGH").value("80.0%"));
    }
}
```

**Step 2: Run the tests**

Run: `cd services/player-service && mvn test -pl . -Dtest=RatingControllerTest -q`
Expected: All 6 tests PASS

**Step 3: Commit**

```bash
git add services/player-service/src/test/java/com/topplayersofallsports/playerservice/RatingControllerTest.java
git commit -m "test: add integration tests for all RatingController ACR endpoints"
```

---

### Task 8: Add rate limit logging to OpenRouterClient

**Files:**
- Modify: `services/player-service/src/main/java/com/topplayersofallsports/playerservice/client/OpenRouterClient.java`

**Step 1: Add request counter and logging**

Add a field:
```java
private final java.util.concurrent.atomic.AtomicInteger requestCount = new java.util.concurrent.atomic.AtomicInteger(0);
```

In the `chat()` method, add at the beginning:
```java
int count = requestCount.incrementAndGet();
log.info("[OpenRouter] Request #{} to model={}", count, model);
```

After receiving response, log:
```java
log.info("[OpenRouter] Request #{} completed (model={}, tokens used={})", count, model, /* extract from response if available */ "N/A");
```

**Step 2: Verify compile**

Run: `cd services/player-service && mvn compile -q`

**Step 3: Commit**

```bash
git add services/player-service/src/main/java/com/topplayersofallsports/playerservice/client/OpenRouterClient.java
git commit -m "feat: add request counter logging to OpenRouterClient for rate limit observability"
```

---

### Task 9: Run full test suite and verify

**Step 1: Run all tests**

Run: `cd services/player-service && mvn test -q`
Expected: All tests PASS (including existing PlayerControllerTest + new RatingControllerTest)

**Step 2: Verify frontend builds**

Run: `npm run build`
Expected: Build succeeds with no errors

**Step 3: Final commit if any fixes needed**

Fix any compilation or test issues found.
