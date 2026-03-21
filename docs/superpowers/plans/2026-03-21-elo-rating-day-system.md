# ELO Rating Day System — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a community-driven ELO ranking system where users vote in monthly head-to-head matchups to rank the Top 100 All-Time Greatest Players per sport, with AI-evaluated nominations for new entrants.

**Architecture:** Monthly "Rating Day" voting windows (48h) where authenticated users pick winners in head-to-head matchups. Each vote immediately updates both players' ELO scores. Temporal workflows manage the lifecycle (open → close → finalize). Nominations with ≥5 support votes are AI-evaluated for entry. PostgreSQL stores all state; Redis provides rate limiting and caching.

**Tech Stack:** Java 17, Spring Boot 3.2, Spring Security (JWT), PostgreSQL (Flyway V7), Redis (rate limiting + caching), Temporal (3 workflows), OpenRouter Llama 3.3 70B (nomination evaluation).

**Spec:** `docs/superpowers/specs/2026-03-16-player-ranking-system-design.md`

---

## File Map

### Database

| Action | Path | Purpose |
|--------|------|---------|
| CREATE | `src/main/resources/db/migration/V7__add_elo_and_rating_day_tables.sql` | DDL for elo_score column + 4 new tables |

### Entities (all in `src/main/java/com/topplayersofallsports/playerservice/entity/`)

| Action | Path | Purpose |
|--------|------|---------|
| MODIFY | `entity/Player.java` | Add `eloScore` field |
| CREATE | `entity/RatingDay.java` | Monthly voting window entity |
| CREATE | `entity/EloMatchup.java` | Individual vote record entity |
| CREATE | `entity/Nomination.java` | Player nomination entity |
| CREATE | `entity/RankingHistory.java` | Rank change audit trail entity |

### Repositories (all in `src/main/java/com/topplayersofallsports/playerservice/repository/`)

| Action | Path | Purpose |
|--------|------|---------|
| CREATE | `repository/RatingDayRepository.java` | Rating Day queries |
| CREATE | `repository/EloMatchupRepository.java` | Vote queries + duplicate detection |
| CREATE | `repository/NominationRepository.java` | Nomination queries |
| CREATE | `repository/RankingHistoryRepository.java` | History queries |

### DTOs (all in `src/main/java/com/topplayersofallsports/playerservice/dto/`)

| Action | Path | Purpose |
|--------|------|---------|
| CREATE | `dto/VoteRequest.java` | Vote submission body |
| CREATE | `dto/VoteResponse.java` | Vote result + next matchup |
| CREATE | `dto/MatchupResponse.java` | Head-to-head pair for voting |
| CREATE | `dto/NominationRequest.java` | Nomination submission body |
| CREATE | `dto/RatingDayResultsResponse.java` | Finalized results (movers, entrants) |

### Services (all in `src/main/java/com/topplayersofallsports/playerservice/service/`)

| Action | Path | Purpose |
|--------|------|---------|
| CREATE | `service/EloService.java` | ELO calculation, vote processing, matchup selection |
| CREATE | `service/RatingDayService.java` | Rating Day lifecycle, status, results |
| CREATE | `service/NominationService.java` | Nomination CRUD, support votes |

### Controllers (all in `src/main/java/com/topplayersofallsports/playerservice/controller/`)

| Action | Path | Purpose |
|--------|------|---------|
| CREATE | `controller/RatingDayController.java` | Public + auth voting endpoints |
| CREATE | `controller/NominationController.java` | Nomination endpoints |
| MODIFY | `controller/AdminController.java` | Add manual Rating Day trigger |

### Temporal (all in `src/main/java/com/topplayersofallsports/playerservice/temporal/`)

| Action | Path | Purpose |
|--------|------|---------|
| CREATE | `temporal/workflow/MonthlyRatingDayWorkflow.java` | Interface |
| CREATE | `temporal/workflow/MonthlyRatingDayWorkflowImpl.java` | Implementation |
| CREATE | `temporal/activity/RatingDayActivities.java` | Activity interface |
| CREATE | `temporal/activity/RatingDayActivitiesImpl.java` | Activity implementation |
| CREATE | `temporal/workflow/NominationEvaluationWorkflow.java` | Interface |
| CREATE | `temporal/workflow/NominationEvaluationWorkflowImpl.java` | Implementation |
| MODIFY | `config/TemporalConfig.java` | Register new workflows + activities |

### Security

| Action | Path | Purpose |
|--------|------|---------|
| MODIFY | `config/SecurityConfig.java` | Add public/auth rules for new endpoints |

### Tests (all in `src/test/java/com/topplayersofallsports/playerservice/`)

| Action | Path | Purpose |
|--------|------|---------|
| CREATE | `service/EloServiceTest.java` | ELO algorithm + vote processing tests |
| CREATE | `controller/RatingDayControllerTest.java` | Endpoint tests |
| CREATE | `controller/NominationControllerTest.java` | Nomination endpoint tests |

---

## Chunk 1: Database + Entities + Repositories

### Task 1: Flyway V7 migration — ELO + Rating Day tables

**Files:**
- Create: `services/player-service/src/main/resources/db/migration/V7__add_elo_and_rating_day_tables.sql`

- [ ] **Step 1: Write the migration**

```sql
-- V7: Add ELO rating system and Rating Day voting tables.

-- Add elo_score to existing players table
ALTER TABLE players ADD COLUMN IF NOT EXISTS elo_score DOUBLE PRECISION DEFAULT 1500;

-- Set elo_score from ranking_score for already-seeded players
UPDATE players SET elo_score = CASE
    WHEN current_rank IS NOT NULL AND current_rank <= 100
        THEN 1800 - ((current_rank - 1) * 6.06)
    ELSE 1500
END
WHERE elo_score = 1500 OR elo_score IS NULL;

CREATE INDEX IF NOT EXISTS idx_player_elo ON players(sport, elo_score DESC);

-- Rating Day: one per sport per month
CREATE TABLE IF NOT EXISTS rating_day (
    id          BIGSERIAL PRIMARY KEY,
    sport       VARCHAR(50)  NOT NULL,
    month       VARCHAR(7)   NOT NULL,
    status      VARCHAR(20)  NOT NULL DEFAULT 'UPCOMING',
    opens_at    TIMESTAMP    NOT NULL,
    closes_at   TIMESTAMP    NOT NULL,
    total_votes INTEGER      NOT NULL DEFAULT 0,
    total_voters INTEGER     NOT NULL DEFAULT 0,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_rating_day_sport_month UNIQUE (sport, month)
);

-- ELO Matchup: individual votes
CREATE TABLE IF NOT EXISTS elo_matchup (
    id                  BIGSERIAL PRIMARY KEY,
    rating_day_id       BIGINT       NOT NULL REFERENCES rating_day(id),
    player1_id          BIGINT       NOT NULL REFERENCES players(id),
    player2_id          BIGINT       NOT NULL REFERENCES players(id),
    voter_user_id       VARCHAR(255) NOT NULL REFERENCES users(id),
    winner_id           BIGINT       NOT NULL REFERENCES players(id),
    player1_elo_before  DOUBLE PRECISION NOT NULL,
    player2_elo_before  DOUBLE PRECISION NOT NULL,
    player1_elo_after   DOUBLE PRECISION NOT NULL,
    player2_elo_after   DOUBLE PRECISION NOT NULL,
    voted_at            TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_matchup_vote UNIQUE (rating_day_id, voter_user_id, player1_id, player2_id),
    CONSTRAINT chk_canonical_order CHECK (player1_id < player2_id),
    CONSTRAINT chk_winner_valid CHECK (winner_id IN (player1_id, player2_id))
);

CREATE INDEX IF NOT EXISTS idx_matchup_rating_day ON elo_matchup(rating_day_id);
CREATE INDEX IF NOT EXISTS idx_matchup_voter ON elo_matchup(rating_day_id, voter_user_id);

-- Nomination: user-submitted player nominations
CREATE TABLE IF NOT EXISTS nomination (
    id                    BIGSERIAL PRIMARY KEY,
    rating_day_id         BIGINT       NOT NULL REFERENCES rating_day(id),
    sport                 VARCHAR(50)  NOT NULL,
    player_name           VARCHAR(255) NOT NULL,
    reason                TEXT,
    nominated_by_user_id  VARCHAR(255) NOT NULL REFERENCES users(id),
    support_votes         INTEGER      NOT NULL DEFAULT 0,
    status                VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    ai_reasoning          TEXT,
    replaces_player_id    BIGINT       REFERENCES players(id),
    created_at            TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_nomination_user_sport UNIQUE (rating_day_id, nominated_by_user_id, sport)
);

CREATE INDEX IF NOT EXISTS idx_nomination_rating_day ON nomination(rating_day_id, sport);

-- Nomination support: tracks which users supported which nominations
CREATE TABLE IF NOT EXISTS nomination_support (
    id             BIGSERIAL PRIMARY KEY,
    nomination_id  BIGINT       NOT NULL REFERENCES nomination(id),
    user_id        VARCHAR(255) NOT NULL REFERENCES users(id),
    created_at     TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_nomination_support UNIQUE (nomination_id, user_id)
);

-- Ranking History: audit trail
CREATE TABLE IF NOT EXISTS ranking_history (
    id             BIGSERIAL PRIMARY KEY,
    player_id      BIGINT          NOT NULL REFERENCES players(id),
    sport          VARCHAR(50)     NOT NULL,
    month          VARCHAR(7)      NOT NULL,
    rank_before    INTEGER,
    rank_after     INTEGER,
    elo_before     DOUBLE PRECISION NOT NULL,
    elo_after      DOUBLE PRECISION NOT NULL,
    change_reason  VARCHAR(50)     NOT NULL,
    created_at     TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ranking_history_player ON ranking_history(player_id);
CREATE INDEX IF NOT EXISTS idx_ranking_history_sport_month ON ranking_history(sport, month);
```

- [ ] **Step 2: Verify migration compiles (no syntax errors)**

```bash
cd services/player-service
GOOGLE_CLIENT_SECRET=test mvn compile -pl . 2>&1 | tail -5
```

Expected: `BUILD SUCCESS`

- [ ] **Step 3: Commit**

```bash
git add services/player-service/src/main/resources/db/migration/V7__add_elo_and_rating_day_tables.sql
git commit -m "feat(rating): add V7 migration for ELO scores, Rating Day, matchups, nominations, history tables"
```

---

### Task 2: Add eloScore to Player entity

**Files:**
- Modify: `services/player-service/src/main/java/com/topplayersofallsports/playerservice/entity/Player.java`

- [ ] **Step 1: Add the field after `rankingScore`**

Add this field after the `rankingScore` field (line ~92):

```java
    @Column(name = "elo_score")
    @Builder.Default
    private Double eloScore = 1500.0;
```

- [ ] **Step 2: Compile check**

```bash
cd services/player-service
mvn compile -pl . 2>&1 | tail -5
```

Expected: `BUILD SUCCESS`

- [ ] **Step 3: Commit**

```bash
git add services/player-service/src/main/java/com/topplayersofallsports/playerservice/entity/Player.java
git commit -m "feat(rating): add eloScore field to Player entity"
```

---

### Task 3: Create RatingDay entity

**Files:**
- Create: `services/player-service/src/main/java/com/topplayersofallsports/playerservice/entity/RatingDay.java`

- [ ] **Step 1: Write the entity**

```java
package com.topplayersofallsports.playerservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "rating_day",
       uniqueConstraints = @UniqueConstraint(columnNames = {"sport", "month"}))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RatingDay {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private Sport sport;

    @Column(nullable = false, length = 7)
    private String month; // "2026-03"

    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Status status = Status.UPCOMING;

    @Column(name = "opens_at", nullable = false)
    private LocalDateTime opensAt;

    @Column(name = "closes_at", nullable = false)
    private LocalDateTime closesAt;

    @Column(name = "total_votes", nullable = false)
    @Builder.Default
    private Integer totalVotes = 0;

    @Column(name = "total_voters", nullable = false)
    @Builder.Default
    private Integer totalVoters = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    public boolean isActive() {
        return status == Status.ACTIVE;
    }

    public boolean isVotingOpen() {
        return status == Status.ACTIVE && LocalDateTime.now().isBefore(closesAt);
    }

    public enum Status {
        UPCOMING, ACTIVE, CLOSED, FINALIZED
    }
}
```

- [ ] **Step 2: Compile check**

```bash
mvn compile -pl . 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
git add services/player-service/src/main/java/com/topplayersofallsports/playerservice/entity/RatingDay.java
git commit -m "feat(rating): add RatingDay entity"
```

---

### Task 4: Create EloMatchup entity

**Files:**
- Create: `services/player-service/src/main/java/com/topplayersofallsports/playerservice/entity/EloMatchup.java`

- [ ] **Step 1: Write the entity**

```java
package com.topplayersofallsports.playerservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "elo_matchup",
       uniqueConstraints = @UniqueConstraint(
           columnNames = {"rating_day_id", "voter_user_id", "player1_id", "player2_id"}))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EloMatchup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "rating_day_id", nullable = false)
    private Long ratingDayId;

    @Column(name = "player1_id", nullable = false)
    private Long player1Id;

    @Column(name = "player2_id", nullable = false)
    private Long player2Id;

    @Column(name = "voter_user_id", nullable = false)
    private String voterUserId;

    @Column(name = "winner_id", nullable = false)
    private Long winnerId;

    @Column(name = "player1_elo_before", nullable = false)
    private Double player1EloBefore;

    @Column(name = "player2_elo_before", nullable = false)
    private Double player2EloBefore;

    @Column(name = "player1_elo_after", nullable = false)
    private Double player1EloAfter;

    @Column(name = "player2_elo_after", nullable = false)
    private Double player2EloAfter;

    @Column(name = "voted_at", nullable = false)
    @Builder.Default
    private LocalDateTime votedAt = LocalDateTime.now();
}
```

- [ ] **Step 2: Compile check**

```bash
mvn compile -pl . 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
git add services/player-service/src/main/java/com/topplayersofallsports/playerservice/entity/EloMatchup.java
git commit -m "feat(rating): add EloMatchup entity"
```

---

### Task 5: Create Nomination entity

**Files:**
- Create: `services/player-service/src/main/java/com/topplayersofallsports/playerservice/entity/Nomination.java`

- [ ] **Step 1: Write the entity**

```java
package com.topplayersofallsports.playerservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "nomination",
       uniqueConstraints = @UniqueConstraint(
           columnNames = {"rating_day_id", "nominated_by_user_id", "sport"}))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Nomination {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "rating_day_id", nullable = false)
    private Long ratingDayId;

    @Column(nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private Sport sport;

    @Column(name = "player_name", nullable = false)
    private String playerName;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(name = "nominated_by_user_id", nullable = false)
    private String nominatedByUserId;

    @Column(name = "support_votes", nullable = false)
    @Builder.Default
    private Integer supportVotes = 0;

    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Status status = Status.PENDING;

    @Column(name = "ai_reasoning", columnDefinition = "TEXT")
    private String aiReasoning;

    @Column(name = "replaces_player_id")
    private Long replacesPlayerId;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum Status {
        PENDING, EVALUATING, APPROVED, REJECTED
    }
}
```

- [ ] **Step 2: Compile check**

```bash
mvn compile -pl . 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
git add services/player-service/src/main/java/com/topplayersofallsports/playerservice/entity/Nomination.java
git commit -m "feat(rating): add Nomination entity"
```

---

### Task 6: Create RankingHistory entity

**Files:**
- Create: `services/player-service/src/main/java/com/topplayersofallsports/playerservice/entity/RankingHistory.java`

- [ ] **Step 1: Write the entity**

```java
package com.topplayersofallsports.playerservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "ranking_history")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RankingHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "player_id", nullable = false)
    private Long playerId;

    @Column(nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private Sport sport;

    @Column(nullable = false, length = 7)
    private String month;

    @Column(name = "rank_before")
    private Integer rankBefore;

    @Column(name = "rank_after")
    private Integer rankAfter;

    @Column(name = "elo_before", nullable = false)
    private Double eloBefore;

    @Column(name = "elo_after", nullable = false)
    private Double eloAfter;

    @Column(name = "change_reason", nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private ChangeReason changeReason;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum ChangeReason {
        VOTE, NOMINATION, SEED
    }
}
```

- [ ] **Step 2: Compile check**

```bash
mvn compile -pl . 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
git add services/player-service/src/main/java/com/topplayersofallsports/playerservice/entity/RankingHistory.java
git commit -m "feat(rating): add RankingHistory entity"
```

---

### Task 7: Create all 4 repositories

**Files:**
- Create: `services/player-service/src/main/java/com/topplayersofallsports/playerservice/repository/RatingDayRepository.java`
- Create: `services/player-service/src/main/java/com/topplayersofallsports/playerservice/repository/EloMatchupRepository.java`
- Create: `services/player-service/src/main/java/com/topplayersofallsports/playerservice/repository/NominationRepository.java`
- Create: `services/player-service/src/main/java/com/topplayersofallsports/playerservice/repository/RankingHistoryRepository.java`
- Modify: `services/player-service/src/main/java/com/topplayersofallsports/playerservice/repository/PlayerRepository.java`

- [ ] **Step 1: Write RatingDayRepository**

```java
package com.topplayersofallsports.playerservice.repository;

import com.topplayersofallsports.playerservice.entity.RatingDay;
import com.topplayersofallsports.playerservice.entity.Sport;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface RatingDayRepository extends JpaRepository<RatingDay, Long> {

    Optional<RatingDay> findBySportAndMonth(Sport sport, String month);

    Optional<RatingDay> findBySportAndStatus(Sport sport, RatingDay.Status status);

    List<RatingDay> findByStatus(RatingDay.Status status);

    List<RatingDay> findBySportOrderByCreatedAtDesc(Sport sport);

    List<RatingDay> findBySportAndStatusOrderByCreatedAtDesc(Sport sport, RatingDay.Status status);
}
```

- [ ] **Step 2: Write EloMatchupRepository**

```java
package com.topplayersofallsports.playerservice.repository;

import com.topplayersofallsports.playerservice.entity.EloMatchup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface EloMatchupRepository extends JpaRepository<EloMatchup, Long> {

    @Query("SELECT m FROM EloMatchup m WHERE m.ratingDayId = :ratingDayId AND m.voterUserId = :userId")
    List<EloMatchup> findByRatingDayAndVoter(
        @Param("ratingDayId") Long ratingDayId,
        @Param("userId") String userId);

    @Query("SELECT COUNT(m) FROM EloMatchup m WHERE m.ratingDayId = :ratingDayId AND m.voterUserId = :userId")
    long countByRatingDayAndVoter(
        @Param("ratingDayId") Long ratingDayId,
        @Param("userId") String userId);

    @Query("SELECT COUNT(DISTINCT m.voterUserId) FROM EloMatchup m WHERE m.ratingDayId = :ratingDayId")
    long countDistinctVotersByRatingDay(@Param("ratingDayId") Long ratingDayId);

    @Query("SELECT COUNT(m) FROM EloMatchup m WHERE m.ratingDayId = :ratingDayId")
    long countByRatingDay(@Param("ratingDayId") Long ratingDayId);

    boolean existsByRatingDayIdAndVoterUserIdAndPlayer1IdAndPlayer2Id(
        Long ratingDayId, String voterUserId, Long player1Id, Long player2Id);
}
```

- [ ] **Step 3: Write NominationRepository**

```java
package com.topplayersofallsports.playerservice.repository;

import com.topplayersofallsports.playerservice.entity.Nomination;
import com.topplayersofallsports.playerservice.entity.Sport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface NominationRepository extends JpaRepository<Nomination, Long> {

    List<Nomination> findByRatingDayIdAndSport(Long ratingDayId, Sport sport);

    boolean existsByRatingDayIdAndNominatedByUserIdAndSport(
        Long ratingDayId, String userId, Sport sport);

    @Query("SELECT n FROM Nomination n WHERE n.ratingDayId = :ratingDayId AND n.supportVotes >= :minVotes AND n.status = 'PENDING'")
    List<Nomination> findQualifyingNominations(
        @Param("ratingDayId") Long ratingDayId,
        @Param("minVotes") int minVotes);
}
```

- [ ] **Step 4: Write RankingHistoryRepository**

```java
package com.topplayersofallsports.playerservice.repository;

import com.topplayersofallsports.playerservice.entity.RankingHistory;
import com.topplayersofallsports.playerservice.entity.Sport;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RankingHistoryRepository extends JpaRepository<RankingHistory, Long> {

    List<RankingHistory> findByPlayerIdOrderByCreatedAtDesc(Long playerId);

    List<RankingHistory> findBySportAndMonthOrderByRankAfterAsc(Sport sport, String month);
}
```

- [ ] **Step 5: Add ELO query to PlayerRepository**

Add this query method to `PlayerRepository.java`:

```java
    @Query("SELECT p FROM Player p WHERE p.sport = :sport AND p.currentRank IS NOT NULL ORDER BY p.eloScore DESC")
    List<Player> findTop100BySportOrderByEloDesc(@Param("sport") Sport sport);
```

- [ ] **Step 6: Compile check**

```bash
mvn compile -pl . 2>&1 | tail -5
```

Expected: `BUILD SUCCESS`

- [ ] **Step 7: Commit**

```bash
git add services/player-service/src/main/java/com/topplayersofallsports/playerservice/repository/RatingDayRepository.java \
        services/player-service/src/main/java/com/topplayersofallsports/playerservice/repository/EloMatchupRepository.java \
        services/player-service/src/main/java/com/topplayersofallsports/playerservice/repository/NominationRepository.java \
        services/player-service/src/main/java/com/topplayersofallsports/playerservice/repository/RankingHistoryRepository.java \
        services/player-service/src/main/java/com/topplayersofallsports/playerservice/repository/PlayerRepository.java
git commit -m "feat(rating): add repositories for RatingDay, EloMatchup, Nomination, RankingHistory"
```

---

## Chunk 2: DTOs + EloService (Core Algorithm)

### Task 8: Create DTOs

**Files:**
- Create: `services/player-service/src/main/java/com/topplayersofallsports/playerservice/dto/VoteRequest.java`
- Create: `services/player-service/src/main/java/com/topplayersofallsports/playerservice/dto/VoteResponse.java`
- Create: `services/player-service/src/main/java/com/topplayersofallsports/playerservice/dto/MatchupResponse.java`
- Create: `services/player-service/src/main/java/com/topplayersofallsports/playerservice/dto/NominationRequest.java`
- Create: `services/player-service/src/main/java/com/topplayersofallsports/playerservice/dto/RatingDayResultsResponse.java`

- [ ] **Step 1: Write VoteRequest**

```java
package com.topplayersofallsports.playerservice.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class VoteRequest {
    @NotNull(message = "player1Id is required")
    private Long player1Id;

    @NotNull(message = "player2Id is required")
    private Long player2Id;

    @NotNull(message = "winnerId is required")
    private Long winnerId;
}
```

- [ ] **Step 2: Write MatchupResponse**

```java
package com.topplayersofallsports.playerservice.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MatchupResponse {
    private Long player1Id;
    private String player1Name;
    private String player1DisplayName;
    private String player1PhotoUrl;
    private String player1Position;
    private String player1Nationality;
    private Integer player1Rank;
    private Double player1Elo;
    private String player1Team;

    private Long player2Id;
    private String player2Name;
    private String player2DisplayName;
    private String player2PhotoUrl;
    private String player2Position;
    private String player2Nationality;
    private Integer player2Rank;
    private Double player2Elo;
    private String player2Team;

    private int matchNumber;
    private int maxMatches;
}
```

- [ ] **Step 3: Write VoteResponse**

```java
package com.topplayersofallsports.playerservice.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class VoteResponse {
    private Double player1EloAfter;
    private Double player2EloAfter;
    private Double player1EloChange;
    private Double player2EloChange;
    private MatchupResponse nextMatchup; // null if no more matchups
}
```

- [ ] **Step 4: Write NominationRequest**

```java
package com.topplayersofallsports.playerservice.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class NominationRequest {
    @NotBlank(message = "Sport is required")
    private String sport;

    @NotBlank(message = "Player name is required")
    private String playerName;

    private String reason;
}
```

- [ ] **Step 5: Write RatingDayResultsResponse**

```java
package com.topplayersofallsports.playerservice.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class RatingDayResultsResponse {
    private Long ratingDayId;
    private String sport;
    private String month;
    private int totalVotes;
    private int totalVoters;
    private List<RankMover> biggestRisers;
    private List<RankMover> biggestFallers;
    private List<NewEntrant> newEntrants;

    @Data
    @Builder
    public static class RankMover {
        private Long playerId;
        private String playerName;
        private int rankBefore;
        private int rankAfter;
        private int rankChange;
        private double eloBefore;
        private double eloAfter;
    }

    @Data
    @Builder
    public static class NewEntrant {
        private Long playerId;
        private String playerName;
        private int rank;
        private String replacedPlayerName;
        private String aiReasoning;
    }
}
```

- [ ] **Step 6: Compile check**

```bash
mvn compile -pl . 2>&1 | tail -5
```

- [ ] **Step 7: Commit**

```bash
git add services/player-service/src/main/java/com/topplayersofallsports/playerservice/dto/VoteRequest.java \
        services/player-service/src/main/java/com/topplayersofallsports/playerservice/dto/VoteResponse.java \
        services/player-service/src/main/java/com/topplayersofallsports/playerservice/dto/MatchupResponse.java \
        services/player-service/src/main/java/com/topplayersofallsports/playerservice/dto/NominationRequest.java \
        services/player-service/src/main/java/com/topplayersofallsports/playerservice/dto/RatingDayResultsResponse.java
git commit -m "feat(rating): add DTOs for voting, matchups, nominations, results"
```

---

### Task 9: EloService — core algorithm + vote processing + matchup selection

**Files:**
- Create: `services/player-service/src/main/java/com/topplayersofallsports/playerservice/service/EloService.java`

- [ ] **Step 1: Write EloService**

```java
package com.topplayersofallsports.playerservice.service;

import com.topplayersofallsports.playerservice.dto.MatchupResponse;
import com.topplayersofallsports.playerservice.dto.VoteRequest;
import com.topplayersofallsports.playerservice.dto.VoteResponse;
import com.topplayersofallsports.playerservice.entity.*;
import com.topplayersofallsports.playerservice.exception.AuthException;
import com.topplayersofallsports.playerservice.exception.EntityNotFoundException;
import com.topplayersofallsports.playerservice.repository.EloMatchupRepository;
import com.topplayersofallsports.playerservice.repository.PlayerRepository;
import com.topplayersofallsports.playerservice.repository.RatingDayRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class EloService {

    private static final int K_FACTOR = 32;
    private static final int MAX_MATCHUPS_PER_USER = 50;
    private static final int MAX_VOTES_PER_MINUTE = 10;
    private static final int PREFERRED_RANK_RANGE = 20;

    private final PlayerRepository playerRepository;
    private final EloMatchupRepository matchupRepository;
    private final RatingDayRepository ratingDayRepository;
    private final StringRedisTemplate redisTemplate;

    /**
     * Calculate ELO expected score.
     * expectedScore = 1 / (1 + 10^((opponentElo - playerElo) / 400))
     */
    public double expectedScore(double playerElo, double opponentElo) {
        return 1.0 / (1.0 + Math.pow(10, (opponentElo - playerElo) / 400.0));
    }

    /**
     * Calculate new ELO after a result.
     * newElo = oldElo + K * (actualScore - expectedScore)
     */
    public double newElo(double oldElo, double expectedScore, double actualScore) {
        return oldElo + K_FACTOR * (actualScore - expectedScore);
    }

    /**
     * Process a vote: validate, calculate ELO, persist, return result + next matchup.
     */
    @Transactional
    public VoteResponse processVote(Long ratingDayId, VoteRequest request, String userId) {
        RatingDay ratingDay = ratingDayRepository.findById(ratingDayId)
                .orElseThrow(() -> new EntityNotFoundException("RatingDay", ratingDayId));

        if (!ratingDay.isVotingOpen()) {
            throw new IllegalStateException("Voting is not open for this Rating Day");
        }

        // Rate limit check
        checkRateLimit(userId);

        // Max matchups check
        long userVoteCount = matchupRepository.countByRatingDayAndVoter(ratingDayId, userId);
        if (userVoteCount >= MAX_MATCHUPS_PER_USER) {
            throw new IllegalStateException(
                "Maximum " + MAX_MATCHUPS_PER_USER + " votes per Rating Day reached");
        }

        // Canonicalize player IDs
        Long p1Id = Math.min(request.getPlayer1Id(), request.getPlayer2Id());
        Long p2Id = Math.max(request.getPlayer1Id(), request.getPlayer2Id());

        // Validate winner is one of the two players
        if (!request.getWinnerId().equals(p1Id) && !request.getWinnerId().equals(p2Id)) {
            throw new IllegalArgumentException("winnerId must be one of the two players");
        }

        // Check duplicate vote
        if (matchupRepository.existsByRatingDayIdAndVoterUserIdAndPlayer1IdAndPlayer2Id(
                ratingDayId, userId, p1Id, p2Id)) {
            throw new IllegalStateException("You have already voted on this matchup");
        }

        Player player1 = playerRepository.findById(p1Id)
                .orElseThrow(() -> new EntityNotFoundException("Player", p1Id));
        Player player2 = playerRepository.findById(p2Id)
                .orElseThrow(() -> new EntityNotFoundException("Player", p2Id));

        double p1EloBefore = player1.getEloScore() != null ? player1.getEloScore() : 1500.0;
        double p2EloBefore = player2.getEloScore() != null ? player2.getEloScore() : 1500.0;

        // Calculate ELO changes
        double p1Expected = expectedScore(p1EloBefore, p2EloBefore);
        double p2Expected = expectedScore(p2EloBefore, p1EloBefore);

        double p1Actual = request.getWinnerId().equals(p1Id) ? 1.0 : 0.0;
        double p2Actual = 1.0 - p1Actual;

        double p1EloAfter = Math.round(newElo(p1EloBefore, p1Expected, p1Actual) * 100.0) / 100.0;
        double p2EloAfter = Math.round(newElo(p2EloBefore, p2Expected, p2Actual) * 100.0) / 100.0;

        // Update player ELO scores
        player1.setEloScore(p1EloAfter);
        player2.setEloScore(p2EloAfter);
        playerRepository.save(player1);
        playerRepository.save(player2);

        // Record the matchup
        EloMatchup matchup = EloMatchup.builder()
                .ratingDayId(ratingDayId)
                .player1Id(p1Id)
                .player2Id(p2Id)
                .voterUserId(userId)
                .winnerId(request.getWinnerId())
                .player1EloBefore(p1EloBefore)
                .player2EloBefore(p2EloBefore)
                .player1EloAfter(p1EloAfter)
                .player2EloAfter(p2EloAfter)
                .build();
        matchupRepository.save(matchup);

        // Increment vote counter in Redis
        String voteCountKey = "ratingday:" + ratingDayId + ":votes";
        redisTemplate.opsForValue().increment(voteCountKey);

        // Get next matchup
        MatchupResponse nextMatchup = getNextMatchup(ratingDayId, ratingDay.getSport(), userId);

        return VoteResponse.builder()
                .player1EloAfter(p1EloAfter)
                .player2EloAfter(p2EloAfter)
                .player1EloChange(p1EloAfter - p1EloBefore)
                .player2EloChange(p2EloAfter - p2EloBefore)
                .nextMatchup(nextMatchup)
                .build();
    }

    /**
     * Get the next head-to-head matchup for a user.
     * Prefers matchups between players within ~20 rank positions.
     * Returns null if no matchups remain.
     */
    public MatchupResponse getNextMatchup(Long ratingDayId, Sport sport, String userId) {
        List<Player> top100 = playerRepository.findTop100BySportOrderByEloDesc(sport);
        if (top100.size() < 2) return null;

        // Get pairs user already voted on
        List<EloMatchup> userVotes = matchupRepository.findByRatingDayAndVoter(ratingDayId, userId);
        Set<String> votedPairs = userVotes.stream()
                .map(m -> m.getPlayer1Id() + "-" + m.getPlayer2Id())
                .collect(Collectors.toSet());

        long totalUserVotes = userVotes.size();
        if (totalUserVotes >= MAX_MATCHUPS_PER_USER) return null;

        // Build candidate pairs, preferring close ranks
        List<long[]> closePairs = new ArrayList<>();
        List<long[]> farPairs = new ArrayList<>();

        for (int i = 0; i < top100.size(); i++) {
            for (int j = i + 1; j < top100.size(); j++) {
                Long id1 = Math.min(top100.get(i).getId(), top100.get(j).getId());
                Long id2 = Math.max(top100.get(i).getId(), top100.get(j).getId());
                String pairKey = id1 + "-" + id2;

                if (!votedPairs.contains(pairKey)) {
                    int rankDiff = Math.abs(i - j);
                    if (rankDiff <= PREFERRED_RANK_RANGE) {
                        closePairs.add(new long[]{id1, id2});
                    } else {
                        farPairs.add(new long[]{id1, id2});
                    }
                }
            }
        }

        // Pick from close pairs first, then far pairs
        List<long[]> pool = closePairs.isEmpty() ? farPairs : closePairs;
        if (pool.isEmpty()) return null;

        long[] chosen = pool.get(new Random().nextInt(pool.size()));

        Player p1 = playerRepository.findById(chosen[0]).orElse(null);
        Player p2 = playerRepository.findById(chosen[1]).orElse(null);
        if (p1 == null || p2 == null) return null;

        return buildMatchupResponse(p1, p2, (int) totalUserVotes + 1, MAX_MATCHUPS_PER_USER);
    }

    private MatchupResponse buildMatchupResponse(Player p1, Player p2, int matchNumber, int maxMatches) {
        return MatchupResponse.builder()
                .player1Id(p1.getId())
                .player1Name(p1.getName())
                .player1DisplayName(p1.getDisplayName())
                .player1PhotoUrl(p1.getPhotoUrl())
                .player1Position(p1.getPosition())
                .player1Nationality(p1.getNationality())
                .player1Rank(p1.getCurrentRank())
                .player1Elo(p1.getEloScore())
                .player1Team(p1.getTeam())
                .player2Id(p2.getId())
                .player2Name(p2.getName())
                .player2DisplayName(p2.getDisplayName())
                .player2PhotoUrl(p2.getPhotoUrl())
                .player2Position(p2.getPosition())
                .player2Nationality(p2.getNationality())
                .player2Rank(p2.getCurrentRank())
                .player2Elo(p2.getEloScore())
                .player2Team(p2.getTeam())
                .matchNumber(matchNumber)
                .maxMatches(maxMatches)
                .build();
    }

    private void checkRateLimit(String userId) {
        String key = "ratelimit:vote:" + userId;
        String count = redisTemplate.opsForValue().get(key);
        if (count != null && Integer.parseInt(count) >= MAX_VOTES_PER_MINUTE) {
            throw new IllegalStateException("Rate limit exceeded — max " + MAX_VOTES_PER_MINUTE + " votes per minute");
        }
        redisTemplate.opsForValue().increment(key);
        redisTemplate.expire(key, Duration.ofSeconds(60));
    }
}
```

- [ ] **Step 2: Compile check**

```bash
mvn compile -pl . 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
git add services/player-service/src/main/java/com/topplayersofallsports/playerservice/service/EloService.java
git commit -m "feat(rating): add EloService with ELO algorithm, vote processing, matchup selection, rate limiting"
```

---

### Task 10: EloService unit tests

**Files:**
- Create: `services/player-service/src/test/java/com/topplayersofallsports/playerservice/service/EloServiceTest.java`

- [ ] **Step 1: Write tests**

```java
package com.topplayersofallsports.playerservice.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import com.topplayersofallsports.playerservice.repository.*;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EloServiceTest {

    @Mock PlayerRepository playerRepository;
    @Mock EloMatchupRepository matchupRepository;
    @Mock RatingDayRepository ratingDayRepository;
    @Mock StringRedisTemplate redisTemplate;
    @Mock ValueOperations<String, String> valueOps;

    @InjectMocks EloService eloService;

    @Test
    void expectedScore_equalElo_returns0_5() {
        double result = eloService.expectedScore(1500, 1500);
        assertEquals(0.5, result, 0.001);
    }

    @Test
    void expectedScore_higherElo_returnsAbove0_5() {
        double result = eloService.expectedScore(1800, 1500);
        assertTrue(result > 0.5);
        assertTrue(result < 1.0);
    }

    @Test
    void expectedScore_lowerElo_returnsBelow0_5() {
        double result = eloService.expectedScore(1200, 1500);
        assertTrue(result < 0.5);
        assertTrue(result > 0.0);
    }

    @Test
    void expectedScore_symmetricPair_sumsToOne() {
        double e1 = eloService.expectedScore(1600, 1400);
        double e2 = eloService.expectedScore(1400, 1600);
        assertEquals(1.0, e1 + e2, 0.001);
    }

    @Test
    void newElo_winAsUnderdog_gainsMore() {
        double expected = eloService.expectedScore(1400, 1600);
        double eloGain = eloService.newElo(1400, expected, 1.0) - 1400;
        // Underdog win should gain more than K/2
        assertTrue(eloGain > 16);
    }

    @Test
    void newElo_winAsFavorite_gainsLess() {
        double expected = eloService.expectedScore(1600, 1400);
        double eloGain = eloService.newElo(1600, expected, 1.0) - 1600;
        // Favorite win should gain less than K/2
        assertTrue(eloGain < 16);
        assertTrue(eloGain > 0);
    }

    @Test
    void newElo_loss_decreases() {
        double expected = eloService.expectedScore(1500, 1500);
        double newElo = eloService.newElo(1500, expected, 0.0);
        assertTrue(newElo < 1500);
    }

    @Test
    void newElo_zeroSumGame() {
        double e1 = eloService.expectedScore(1600, 1400);
        double e2 = eloService.expectedScore(1400, 1600);
        // Player 1 wins
        double new1 = eloService.newElo(1600, e1, 1.0);
        double new2 = eloService.newElo(1400, e2, 0.0);
        // Total ELO should be preserved (zero-sum)
        assertEquals(3000.0, new1 + new2, 0.01);
    }
}
```

- [ ] **Step 2: Run tests**

```bash
cd services/player-service
mvn test -Dtest=EloServiceTest -pl . 2>&1 | tail -10
```

Expected: `Tests run: 8, Failures: 0, Errors: 0`

- [ ] **Step 3: Commit**

```bash
git add services/player-service/src/test/java/com/topplayersofallsports/playerservice/service/EloServiceTest.java
git commit -m "test(rating): add EloService unit tests for ELO algorithm"
```

---

## Chunk 3: RatingDayService + NominationService

### Task 11: RatingDayService

**Files:**
- Create: `services/player-service/src/main/java/com/topplayersofallsports/playerservice/service/RatingDayService.java`

- [ ] **Step 1: Write RatingDayService**

```java
package com.topplayersofallsports.playerservice.service;

import com.topplayersofallsports.playerservice.dto.RatingDayResultsResponse;
import com.topplayersofallsports.playerservice.entity.*;
import com.topplayersofallsports.playerservice.exception.EntityNotFoundException;
import com.topplayersofallsports.playerservice.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class RatingDayService {

    private final RatingDayRepository ratingDayRepository;
    private final PlayerRepository playerRepository;
    private final EloMatchupRepository matchupRepository;
    private final RankingHistoryRepository rankingHistoryRepository;
    private final StringRedisTemplate redisTemplate;

    private static final Sport[] ACTIVE_SPORTS = {
        Sport.FOOTBALL, Sport.BASKETBALL, Sport.MMA, Sport.CRICKET, Sport.TENNIS
    };

    /**
     * Get the current (or most recent) Rating Day for a sport.
     * Uses Redis cache with 5-minute TTL.
     */
    public RatingDay getCurrentRatingDay(Sport sport) {
        return ratingDayRepository.findBySportAndStatus(sport, RatingDay.Status.ACTIVE)
                .orElseGet(() -> ratingDayRepository
                        .findBySportAndStatusOrderByCreatedAtDesc(sport, RatingDay.Status.FINALIZED)
                        .stream().findFirst().orElse(null));
    }

    /**
     * Open Rating Days for all 5 sports. Called by MonthlyRatingDayWorkflow.
     */
    @Transactional
    public List<RatingDay> openRatingDays() {
        String month = YearMonth.now().format(DateTimeFormatter.ofPattern("yyyy-MM"));
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime closesAt = now.plusHours(48);

        List<RatingDay> created = new ArrayList<>();
        for (Sport sport : ACTIVE_SPORTS) {
            if (ratingDayRepository.findBySportAndMonth(sport, month).isPresent()) {
                log.warn("Rating Day already exists for {} {}", sport, month);
                continue;
            }
            RatingDay rd = RatingDay.builder()
                    .sport(sport)
                    .month(month)
                    .status(RatingDay.Status.ACTIVE)
                    .opensAt(now)
                    .closesAt(closesAt)
                    .build();
            created.add(ratingDayRepository.save(rd));
            log.info("Opened Rating Day for {} ({})", sport, month);
        }
        return created;
    }

    /**
     * Close all active Rating Days. Called after 48h timer.
     */
    @Transactional
    public void closeActiveRatingDays() {
        List<RatingDay> active = ratingDayRepository.findByStatus(RatingDay.Status.ACTIVE);
        for (RatingDay rd : active) {
            long votes = matchupRepository.countByRatingDay(rd.getId());
            long voters = matchupRepository.countDistinctVotersByRatingDay(rd.getId());
            rd.setStatus(RatingDay.Status.CLOSED);
            rd.setTotalVotes((int) votes);
            rd.setTotalVoters((int) voters);
            ratingDayRepository.save(rd);
            log.info("Closed Rating Day {} for {} — {} votes from {} voters",
                    rd.getId(), rd.getSport(), votes, voters);
        }
    }

    /**
     * Finalize a Rating Day: recalculate ranks from ELO, write history, update players.
     */
    @Transactional
    public void finalizeRatingDay(Long ratingDayId) {
        RatingDay rd = ratingDayRepository.findById(ratingDayId)
                .orElseThrow(() -> new EntityNotFoundException("RatingDay", ratingDayId));

        if (rd.getTotalVotes() == 0) {
            rd.setStatus(RatingDay.Status.FINALIZED);
            ratingDayRepository.save(rd);
            log.info("Rating Day {} finalized with zero votes — no rank changes", ratingDayId);
            return;
        }

        List<Player> players = playerRepository.findTop100BySportOrderByEloDesc(rd.getSport());

        for (int i = 0; i < players.size(); i++) {
            Player p = players.get(i);
            int newRank = i + 1;
            Integer oldRank = p.getCurrentRank();
            Double oldElo = p.getRankingScore() != null ? p.getRankingScore() : p.getEloScore();

            // Write history
            rankingHistoryRepository.save(RankingHistory.builder()
                    .playerId(p.getId())
                    .sport(rd.getSport())
                    .month(rd.getMonth())
                    .rankBefore(oldRank)
                    .rankAfter(newRank)
                    .eloBefore(oldElo)
                    .eloAfter(p.getEloScore())
                    .changeReason(RankingHistory.ChangeReason.VOTE)
                    .build());

            // Update player
            p.setPreviousRank(oldRank);
            p.setCurrentRank(newRank);
            p.setRankingScore(p.getEloScore());
            p.setLastRankingUpdate(LocalDateTime.now());
            playerRepository.save(p);
        }

        rd.setStatus(RatingDay.Status.FINALIZED);
        ratingDayRepository.save(rd);

        // Invalidate Redis cache
        redisTemplate.delete("ratingday:current:" + rd.getSport());
        redisTemplate.delete("ratingday:" + ratingDayId + ":votes");

        log.info("Finalized Rating Day {} for {} — {} players re-ranked",
                ratingDayId, rd.getSport(), players.size());
    }

    /**
     * Build results response for a finalized Rating Day.
     */
    public RatingDayResultsResponse getResults(Long ratingDayId) {
        RatingDay rd = ratingDayRepository.findById(ratingDayId)
                .orElseThrow(() -> new EntityNotFoundException("RatingDay", ratingDayId));

        List<RankingHistory> history = rankingHistoryRepository
                .findBySportAndMonthOrderByRankAfterAsc(rd.getSport(), rd.getMonth());

        List<RatingDayResultsResponse.RankMover> risers = new ArrayList<>();
        List<RatingDayResultsResponse.RankMover> fallers = new ArrayList<>();

        for (RankingHistory h : history) {
            if (h.getRankBefore() == null || h.getRankAfter() == null) continue;
            int change = h.getRankBefore() - h.getRankAfter(); // positive = rose
            Player p = playerRepository.findById(h.getPlayerId()).orElse(null);
            if (p == null) continue;

            RatingDayResultsResponse.RankMover mover = RatingDayResultsResponse.RankMover.builder()
                    .playerId(h.getPlayerId())
                    .playerName(p.getDisplayName() != null ? p.getDisplayName() : p.getName())
                    .rankBefore(h.getRankBefore())
                    .rankAfter(h.getRankAfter())
                    .rankChange(change)
                    .eloBefore(h.getEloBefore())
                    .eloAfter(h.getEloAfter())
                    .build();

            if (change > 0) risers.add(mover);
            else if (change < 0) fallers.add(mover);
        }

        risers.sort(Comparator.comparingInt(RatingDayResultsResponse.RankMover::getRankChange).reversed());
        fallers.sort(Comparator.comparingInt(RatingDayResultsResponse.RankMover::getRankChange));

        return RatingDayResultsResponse.builder()
                .ratingDayId(ratingDayId)
                .sport(rd.getSport().name())
                .month(rd.getMonth())
                .totalVotes(rd.getTotalVotes())
                .totalVoters(rd.getTotalVoters())
                .biggestRisers(risers.stream().limit(5).toList())
                .biggestFallers(fallers.stream().limit(5).toList())
                .newEntrants(List.of()) // populated by NominationService during finalization
                .build();
    }

    /**
     * Get past Rating Day summaries for a sport.
     */
    public List<RatingDay> getHistory(Sport sport) {
        return ratingDayRepository.findBySportAndStatusOrderByCreatedAtDesc(
                sport, RatingDay.Status.FINALIZED);
    }
}
```

- [ ] **Step 2: Compile check**

```bash
mvn compile -pl . 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
git add services/player-service/src/main/java/com/topplayersofallsports/playerservice/service/RatingDayService.java
git commit -m "feat(rating): add RatingDayService with lifecycle management, finalization, results"
```

---

### Task 12: NominationService

**Files:**
- Create: `services/player-service/src/main/java/com/topplayersofallsports/playerservice/service/NominationService.java`

- [ ] **Step 1: Write NominationService**

```java
package com.topplayersofallsports.playerservice.service;

import com.topplayersofallsports.playerservice.entity.*;
import com.topplayersofallsports.playerservice.exception.EntityNotFoundException;
import com.topplayersofallsports.playerservice.repository.NominationRepository;
import com.topplayersofallsports.playerservice.repository.RatingDayRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class NominationService {

    private static final int MIN_SUPPORT_VOTES = 5;

    private final NominationRepository nominationRepository;
    private final RatingDayRepository ratingDayRepository;

    /**
     * Submit a new nomination.
     */
    @Transactional
    public Nomination submitNomination(Sport sport, String playerName, String reason,
                                       String userId) {
        // Find active Rating Day for sport
        RatingDay rd = ratingDayRepository.findBySportAndStatus(sport, RatingDay.Status.ACTIVE)
                .orElseThrow(() -> new IllegalStateException(
                    "No active Rating Day for " + sport + " — nominations are only accepted during voting"));

        // Check if user already nominated for this sport this Rating Day
        if (nominationRepository.existsByRatingDayIdAndNominatedByUserIdAndSport(
                rd.getId(), userId, sport)) {
            throw new IllegalStateException(
                "You have already submitted a nomination for " + sport + " this Rating Day");
        }

        Nomination nomination = Nomination.builder()
                .ratingDayId(rd.getId())
                .sport(sport)
                .playerName(playerName)
                .reason(reason)
                .nominatedByUserId(userId)
                .build();

        nomination = nominationRepository.save(nomination);
        log.info("Nomination submitted: {} for {} by user {}", playerName, sport, userId);
        return nomination;
    }

    /**
     * Support (upvote) a nomination. Increments support_votes.
     */
    @Transactional
    public Nomination supportNomination(Long nominationId, String userId) {
        Nomination nom = nominationRepository.findById(nominationId)
                .orElseThrow(() -> new EntityNotFoundException("Nomination", nominationId));

        if (nom.getStatus() != Nomination.Status.PENDING) {
            throw new IllegalStateException("Nomination is no longer accepting support votes");
        }

        if (nom.getNominatedByUserId().equals(userId)) {
            throw new IllegalStateException("Cannot support your own nomination");
        }

        // Note: nomination_support table handles uniqueness via DB constraint
        nom.setSupportVotes(nom.getSupportVotes() + 1);
        nom = nominationRepository.save(nom);

        log.info("Nomination {} now has {} support votes", nominationId, nom.getSupportVotes());
        return nom;
    }

    /**
     * Get current nominations for an active Rating Day.
     */
    public List<Nomination> getCurrentNominations(Sport sport) {
        RatingDay rd = ratingDayRepository.findBySportAndStatus(sport, RatingDay.Status.ACTIVE)
                .or(() -> ratingDayRepository.findBySportAndStatus(sport, RatingDay.Status.CLOSED))
                .orElse(null);

        if (rd == null) return List.of();
        return nominationRepository.findByRatingDayIdAndSport(rd.getId(), sport);
    }

    /**
     * Get qualifying nominations (≥5 support votes) for evaluation.
     */
    public List<Nomination> getQualifyingNominations(Long ratingDayId) {
        return nominationRepository.findQualifyingNominations(ratingDayId, MIN_SUPPORT_VOTES);
    }
}
```

- [ ] **Step 2: Compile check**

```bash
mvn compile -pl . 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
git add services/player-service/src/main/java/com/topplayersofallsports/playerservice/service/NominationService.java
git commit -m "feat(rating): add NominationService with submission, support voting, qualification"
```

---

## Chunk 4: Controllers + Security

### Task 13: RatingDayController

**Files:**
- Create: `services/player-service/src/main/java/com/topplayersofallsports/playerservice/controller/RatingDayController.java`

- [ ] **Step 1: Write the controller**

```java
package com.topplayersofallsports.playerservice.controller;

import com.topplayersofallsports.playerservice.dto.*;
import com.topplayersofallsports.playerservice.entity.EloMatchup;
import com.topplayersofallsports.playerservice.entity.RatingDay;
import com.topplayersofallsports.playerservice.entity.Sport;
import com.topplayersofallsports.playerservice.repository.EloMatchupRepository;
import com.topplayersofallsports.playerservice.service.EloService;
import com.topplayersofallsports.playerservice.service.RatingDayService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rating-day")
@RequiredArgsConstructor
@Slf4j
public class RatingDayController {

    private final EloService eloService;
    private final RatingDayService ratingDayService;
    private final EloMatchupRepository matchupRepository;

    // --- Public endpoints ---

    @GetMapping("/current/{sport}")
    public ResponseEntity<RatingDay> getCurrentRatingDay(@PathVariable String sport) {
        Sport s = Sport.valueOf(sport.toUpperCase());
        RatingDay rd = ratingDayService.getCurrentRatingDay(s);
        if (rd == null) return ResponseEntity.noContent().build();
        return ResponseEntity.ok(rd);
    }

    @GetMapping("/{id}/results")
    public ResponseEntity<RatingDayResultsResponse> getResults(@PathVariable Long id) {
        return ResponseEntity.ok(ratingDayService.getResults(id));
    }

    @GetMapping("/{sport}/history")
    public ResponseEntity<List<RatingDay>> getHistory(@PathVariable String sport) {
        Sport s = Sport.valueOf(sport.toUpperCase());
        return ResponseEntity.ok(ratingDayService.getHistory(s));
    }

    // --- Authenticated endpoints ---

    @GetMapping("/{id}/matchup")
    public ResponseEntity<MatchupResponse> getNextMatchup(
            @PathVariable Long id,
            @AuthenticationPrincipal String userId) {
        if (userId == null) return ResponseEntity.status(401).build();

        RatingDay rd = ratingDayService.getCurrentRatingDay(null);
        // Lookup by ID instead
        rd = ratingDayService.getRatingDayById(id);

        MatchupResponse matchup = eloService.getNextMatchup(id, rd.getSport(), userId);
        if (matchup == null) return ResponseEntity.noContent().build();
        return ResponseEntity.ok(matchup);
    }

    @PostMapping("/{id}/vote")
    public ResponseEntity<VoteResponse> submitVote(
            @PathVariable Long id,
            @Valid @RequestBody VoteRequest request,
            @AuthenticationPrincipal String userId) {
        if (userId == null) return ResponseEntity.status(401).build();

        VoteResponse response = eloService.processVote(id, request, userId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/skip")
    public ResponseEntity<MatchupResponse> skipMatchup(
            @PathVariable Long id,
            @RequestBody VoteRequest skipRequest,
            @AuthenticationPrincipal String userId) {
        if (userId == null) return ResponseEntity.status(401).build();

        // Get the Rating Day sport, then return next matchup (skipped pair is not recorded)
        RatingDay rd = ratingDayService.getRatingDayById(id);
        MatchupResponse next = eloService.getNextMatchup(id, rd.getSport(), userId);
        if (next == null) return ResponseEntity.noContent().build();
        return ResponseEntity.ok(next);
    }

    @GetMapping("/{id}/my-votes")
    public ResponseEntity<List<EloMatchup>> getMyVotes(
            @PathVariable Long id,
            @AuthenticationPrincipal String userId) {
        if (userId == null) return ResponseEntity.status(401).build();

        List<EloMatchup> votes = matchupRepository.findByRatingDayAndVoter(id, userId);
        return ResponseEntity.ok(votes);
    }
}
```

- [ ] **Step 2: Add `getRatingDayById` to RatingDayService**

Add this method to `RatingDayService.java`:

```java
    public RatingDay getRatingDayById(Long id) {
        return ratingDayRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("RatingDay", id));
    }
```

- [ ] **Step 3: Compile check**

```bash
mvn compile -pl . 2>&1 | tail -5
```

- [ ] **Step 4: Commit**

```bash
git add services/player-service/src/main/java/com/topplayersofallsports/playerservice/controller/RatingDayController.java \
        services/player-service/src/main/java/com/topplayersofallsports/playerservice/service/RatingDayService.java
git commit -m "feat(rating): add RatingDayController with public and authenticated endpoints"
```

---

### Task 14: NominationController

**Files:**
- Create: `services/player-service/src/main/java/com/topplayersofallsports/playerservice/controller/NominationController.java`

- [ ] **Step 1: Write the controller**

```java
package com.topplayersofallsports.playerservice.controller;

import com.topplayersofallsports.playerservice.dto.NominationRequest;
import com.topplayersofallsports.playerservice.entity.Nomination;
import com.topplayersofallsports.playerservice.entity.Sport;
import com.topplayersofallsports.playerservice.service.NominationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/nominations")
@RequiredArgsConstructor
@Slf4j
public class NominationController {

    private final NominationService nominationService;

    @PostMapping
    public ResponseEntity<Nomination> submitNomination(
            @Valid @RequestBody NominationRequest request,
            @AuthenticationPrincipal String userId) {
        if (userId == null) return ResponseEntity.status(401).build();

        Sport sport = Sport.valueOf(request.getSport().toUpperCase());
        Nomination nomination = nominationService.submitNomination(
                sport, request.getPlayerName(), request.getReason(), userId);
        return ResponseEntity.status(201).body(nomination);
    }

    @PostMapping("/{id}/support")
    public ResponseEntity<Nomination> supportNomination(
            @PathVariable Long id,
            @AuthenticationPrincipal String userId) {
        if (userId == null) return ResponseEntity.status(401).build();

        Nomination nomination = nominationService.supportNomination(id, userId);
        return ResponseEntity.ok(nomination);
    }

    @GetMapping("/{sport}/current")
    public ResponseEntity<List<Nomination>> getCurrentNominations(@PathVariable String sport) {
        Sport s = Sport.valueOf(sport.toUpperCase());
        return ResponseEntity.ok(nominationService.getCurrentNominations(s));
    }
}
```

- [ ] **Step 2: Compile check**

```bash
mvn compile -pl . 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
git add services/player-service/src/main/java/com/topplayersofallsports/playerservice/controller/NominationController.java
git commit -m "feat(rating): add NominationController with submit, support, and list endpoints"
```

---

### Task 15: Update SecurityConfig for new endpoints

**Files:**
- Modify: `services/player-service/src/main/java/com/topplayersofallsports/playerservice/config/SecurityConfig.java`

- [ ] **Step 1: Add public routes for Rating Day and Nominations viewing**

In `SecurityConfig.filterChain()`, add these lines after the existing `permitAll` matchers and before `.anyRequest().authenticated()`:

```java
                // Rating Day public endpoints
                .requestMatchers(HttpMethod.GET, "/api/rating-day/current/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/rating-day/*/results").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/rating-day/*/history").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/nominations/*/current").permitAll()
```

- [ ] **Step 2: Compile check**

```bash
mvn compile -pl . 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
git add services/player-service/src/main/java/com/topplayersofallsports/playerservice/config/SecurityConfig.java
git commit -m "feat(rating): add public SecurityConfig rules for Rating Day and Nomination read endpoints"
```

---

### Task 16: Add manual Rating Day trigger to AdminController

**Files:**
- Modify: `services/player-service/src/main/java/com/topplayersofallsports/playerservice/controller/AdminController.java`

- [ ] **Step 1: Add the endpoint**

Add this field injection and method to `AdminController.java`:

```java
    // Add field:
    private final RatingDayService ratingDayService;

    // Add method:
    @PostMapping("/rating-day/trigger")
    public ResponseEntity<Map<String, Object>> triggerRatingDay() {
        log.info("Manually triggering Rating Day for all sports");
        var created = ratingDayService.openRatingDays();
        return ResponseEntity.ok(Map.of(
            "message", "Rating Days opened",
            "count", created.size(),
            "sports", created.stream().map(rd -> rd.getSport().name()).toList()
        ));
    }
```

Add import: `import com.topplayersofallsports.playerservice.service.RatingDayService;`

Note: `AdminController` uses `@RequiredArgsConstructor` so adding the field is sufficient for injection.

- [ ] **Step 2: Compile check**

```bash
mvn compile -pl . 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
git add services/player-service/src/main/java/com/topplayersofallsports/playerservice/controller/AdminController.java
git commit -m "feat(rating): add manual Rating Day trigger endpoint to AdminController"
```

---

## Chunk 5: Temporal Workflows

### Task 17: MonthlyRatingDayWorkflow + NominationEvaluationWorkflow

**Files:**
- Create: `services/player-service/src/main/java/com/topplayersofallsports/playerservice/temporal/workflow/MonthlyRatingDayWorkflow.java`
- Create: `services/player-service/src/main/java/com/topplayersofallsports/playerservice/temporal/workflow/MonthlyRatingDayWorkflowImpl.java`
- Create: `services/player-service/src/main/java/com/topplayersofallsports/playerservice/temporal/activity/RatingDayActivities.java`
- Create: `services/player-service/src/main/java/com/topplayersofallsports/playerservice/temporal/activity/RatingDayActivitiesImpl.java`
- Create: `services/player-service/src/main/java/com/topplayersofallsports/playerservice/temporal/workflow/NominationEvaluationWorkflow.java`
- Create: `services/player-service/src/main/java/com/topplayersofallsports/playerservice/temporal/workflow/NominationEvaluationWorkflowImpl.java`

- [ ] **Step 1: Write MonthlyRatingDayWorkflow interface**

```java
package com.topplayersofallsports.playerservice.temporal.workflow;

import io.temporal.workflow.WorkflowInterface;
import io.temporal.workflow.WorkflowMethod;

@WorkflowInterface
public interface MonthlyRatingDayWorkflow {

    @WorkflowMethod
    String runMonthlyRatingDay();
}
```

- [ ] **Step 2: Write RatingDayActivities interface**

```java
package com.topplayersofallsports.playerservice.temporal.activity;

import io.temporal.activity.ActivityInterface;
import io.temporal.activity.ActivityMethod;
import java.util.List;

@ActivityInterface
public interface RatingDayActivities {

    @ActivityMethod
    List<Long> openAllRatingDays();

    @ActivityMethod
    void closeAllRatingDays();

    @ActivityMethod
    void finalizeRatingDay(Long ratingDayId);

    @ActivityMethod
    void evaluateNominations(Long ratingDayId);
}
```

- [ ] **Step 3: Write RatingDayActivitiesImpl**

```java
package com.topplayersofallsports.playerservice.temporal.activity;

import com.topplayersofallsports.playerservice.entity.RatingDay;
import com.topplayersofallsports.playerservice.service.RatingDayService;
import com.topplayersofallsports.playerservice.service.NominationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Slf4j
@RequiredArgsConstructor
public class RatingDayActivitiesImpl implements RatingDayActivities {

    private final RatingDayService ratingDayService;
    private final NominationService nominationService;

    @Override
    public List<Long> openAllRatingDays() {
        List<RatingDay> created = ratingDayService.openRatingDays();
        return created.stream().map(RatingDay::getId).toList();
    }

    @Override
    public void closeAllRatingDays() {
        ratingDayService.closeActiveRatingDays();
    }

    @Override
    public void finalizeRatingDay(Long ratingDayId) {
        ratingDayService.finalizeRatingDay(ratingDayId);
    }

    @Override
    public void evaluateNominations(Long ratingDayId) {
        // AI nomination evaluation — Phase 2 (placeholder for now)
        log.info("Nomination evaluation for Rating Day {} — not yet implemented", ratingDayId);
    }
}
```

- [ ] **Step 4: Write MonthlyRatingDayWorkflowImpl**

```java
package com.topplayersofallsports.playerservice.temporal.workflow;

import com.topplayersofallsports.playerservice.temporal.activity.RatingDayActivities;
import io.temporal.activity.ActivityOptions;
import io.temporal.workflow.Workflow;
import lombok.extern.slf4j.Slf4j;

import java.time.Duration;
import java.util.List;

@Slf4j
public class MonthlyRatingDayWorkflowImpl implements MonthlyRatingDayWorkflow {

    private final RatingDayActivities activities = Workflow.newActivityStub(
            RatingDayActivities.class,
            ActivityOptions.newBuilder()
                    .setStartToCloseTimeout(Duration.ofMinutes(5))
                    .build());

    @Override
    public String runMonthlyRatingDay() {
        // Phase 1: Open voting for all sports
        List<Long> ratingDayIds = activities.openAllRatingDays();
        Workflow.getLogger(MonthlyRatingDayWorkflowImpl.class)
                .info("Opened {} Rating Days", ratingDayIds.size());

        // Phase 2: Wait 48 hours (replay-safe timer)
        Workflow.sleep(Duration.ofHours(48));

        // Phase 3: Close voting
        activities.closeAllRatingDays();

        // Phase 4: Evaluate nominations + finalize each Rating Day
        for (Long rdId : ratingDayIds) {
            activities.evaluateNominations(rdId);
            activities.finalizeRatingDay(rdId);
        }

        return "Monthly Rating Day completed for " + ratingDayIds.size() + " sports";
    }
}
```

- [ ] **Step 5: Write NominationEvaluationWorkflow interface**

```java
package com.topplayersofallsports.playerservice.temporal.workflow;

import io.temporal.workflow.WorkflowInterface;
import io.temporal.workflow.WorkflowMethod;

@WorkflowInterface
public interface NominationEvaluationWorkflow {

    @WorkflowMethod
    String evaluateNominations(Long ratingDayId);
}
```

- [ ] **Step 6: Write NominationEvaluationWorkflowImpl**

```java
package com.topplayersofallsports.playerservice.temporal.workflow;

import com.topplayersofallsports.playerservice.temporal.activity.RatingDayActivities;
import io.temporal.activity.ActivityOptions;
import io.temporal.workflow.Workflow;

import java.time.Duration;

public class NominationEvaluationWorkflowImpl implements NominationEvaluationWorkflow {

    private final RatingDayActivities activities = Workflow.newActivityStub(
            RatingDayActivities.class,
            ActivityOptions.newBuilder()
                    .setStartToCloseTimeout(Duration.ofMinutes(5))
                    .build());

    @Override
    public String evaluateNominations(Long ratingDayId) {
        activities.evaluateNominations(ratingDayId);
        return "Nominations evaluated for Rating Day " + ratingDayId;
    }
}
```

- [ ] **Step 7: Register workflows in TemporalConfig**

In `TemporalConfig.java`, add registration for the new workflow and activity implementations. Find the `WorkerFactory` setup and add:

```java
worker.registerWorkflowImplementationTypes(MonthlyRatingDayWorkflowImpl.class, NominationEvaluationWorkflowImpl.class);
worker.registerActivitiesImplementations(ratingDayActivitiesImpl);
```

Add the appropriate field injection:

```java
private final RatingDayActivitiesImpl ratingDayActivitiesImpl;
```

And imports:
```java
import com.topplayersofallsports.playerservice.temporal.workflow.MonthlyRatingDayWorkflowImpl;
import com.topplayersofallsports.playerservice.temporal.workflow.NominationEvaluationWorkflowImpl;
import com.topplayersofallsports.playerservice.temporal.activity.RatingDayActivitiesImpl;
```

- [ ] **Step 8: Compile check**

```bash
mvn compile -pl . 2>&1 | tail -10
```

Expected: `BUILD SUCCESS`

- [ ] **Step 9: Commit**

```bash
git add services/player-service/src/main/java/com/topplayersofallsports/playerservice/temporal/workflow/MonthlyRatingDayWorkflow.java \
        services/player-service/src/main/java/com/topplayersofallsports/playerservice/temporal/workflow/MonthlyRatingDayWorkflowImpl.java \
        services/player-service/src/main/java/com/topplayersofallsports/playerservice/temporal/activity/RatingDayActivities.java \
        services/player-service/src/main/java/com/topplayersofallsports/playerservice/temporal/activity/RatingDayActivitiesImpl.java \
        services/player-service/src/main/java/com/topplayersofallsports/playerservice/temporal/workflow/NominationEvaluationWorkflow.java \
        services/player-service/src/main/java/com/topplayersofallsports/playerservice/temporal/workflow/NominationEvaluationWorkflowImpl.java \
        services/player-service/src/main/java/com/topplayersofallsports/playerservice/config/TemporalConfig.java
git commit -m "feat(rating): add Temporal workflows for MonthlyRatingDay and NominationEvaluation"
```

---

## Chunk 6: Controller Tests + Integration Verification

### Task 18: RatingDayController tests

**Files:**
- Create: `services/player-service/src/test/java/com/topplayersofallsports/playerservice/controller/RatingDayControllerTest.java`

- [ ] **Step 1: Write tests**

```java
package com.topplayersofallsports.playerservice.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.topplayersofallsports.playerservice.config.SecurityConfig;
import com.topplayersofallsports.playerservice.dto.MatchupResponse;
import com.topplayersofallsports.playerservice.dto.VoteRequest;
import com.topplayersofallsports.playerservice.dto.VoteResponse;
import com.topplayersofallsports.playerservice.entity.RatingDay;
import com.topplayersofallsports.playerservice.entity.Sport;
import com.topplayersofallsports.playerservice.repository.EloMatchupRepository;
import com.topplayersofallsports.playerservice.service.EloService;
import com.topplayersofallsports.playerservice.service.JwtService;
import com.topplayersofallsports.playerservice.service.RatingDayService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(RatingDayController.class)
@Import(SecurityConfig.class)
class RatingDayControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper mapper;

    @MockBean EloService eloService;
    @MockBean RatingDayService ratingDayService;
    @MockBean EloMatchupRepository matchupRepository;
    @MockBean JwtService jwtService;

    @Test
    void getCurrentRatingDay_public_returns200() throws Exception {
        RatingDay rd = RatingDay.builder()
                .id(1L).sport(Sport.FOOTBALL).month("2026-03")
                .status(RatingDay.Status.ACTIVE)
                .opensAt(LocalDateTime.now()).closesAt(LocalDateTime.now().plusHours(48))
                .build();
        when(ratingDayService.getCurrentRatingDay(Sport.FOOTBALL)).thenReturn(rd);

        mockMvc.perform(get("/api/rating-day/current/FOOTBALL"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sport").value("FOOTBALL"))
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    void getCurrentRatingDay_noActive_returns204() throws Exception {
        when(ratingDayService.getCurrentRatingDay(Sport.FOOTBALL)).thenReturn(null);

        mockMvc.perform(get("/api/rating-day/current/FOOTBALL"))
                .andExpect(status().isNoContent());
    }

    @Test
    void vote_withoutAuth_returns401() throws Exception {
        VoteRequest req = new VoteRequest();
        req.setPlayer1Id(1L);
        req.setPlayer2Id(2L);
        req.setWinnerId(1L);

        mockMvc.perform(post("/api/rating-day/1/vote")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void vote_withAuth_returns200() throws Exception {
        VoteRequest req = new VoteRequest();
        req.setPlayer1Id(1L);
        req.setPlayer2Id(2L);
        req.setWinnerId(1L);

        VoteResponse resp = VoteResponse.builder()
                .player1EloAfter(1516.0).player2EloAfter(1484.0)
                .player1EloChange(16.0).player2EloChange(-16.0)
                .build();

        when(jwtService.isValid("valid-token")).thenReturn(true);
        when(jwtService.getUserId("valid-token")).thenReturn("user-1");
        when(jwtService.getRole("valid-token")).thenReturn("USER");
        when(eloService.processVote(eq(1L), any(), eq("user-1"))).thenReturn(resp);

        mockMvc.perform(post("/api/rating-day/1/vote")
                        .with(csrf())
                        .header("Authorization", "Bearer valid-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.player1EloAfter").value(1516.0));
    }
}
```

- [ ] **Step 2: Run tests**

```bash
cd services/player-service
mvn test -Dtest=RatingDayControllerTest -pl . 2>&1 | tail -10
```

Expected: `Tests run: 4, Failures: 0, Errors: 0`

- [ ] **Step 3: Commit**

```bash
git add services/player-service/src/test/java/com/topplayersofallsports/playerservice/controller/RatingDayControllerTest.java
git commit -m "test(rating): add RatingDayController tests for public and auth endpoints"
```

---

### Task 19: Run full test suite + verify startup

- [ ] **Step 1: Run all unit tests**

```bash
cd services/player-service
mvn test -Dtest="AuthControllerTest,PlayerControllerTest,JwtServiceTest,EloServiceTest,RatingDayControllerTest" -pl . 2>&1 | tail -15
```

Expected: All tests pass.

- [ ] **Step 2: Start service and verify Flyway V7 applies**

```bash
cd services/player-service
GOOGLE_CLIENT_SECRET="GOOGLE_CLIENT_SECRET_REMOVED" mvn spring-boot:run 2>&1 | grep -E "V7|Flyway|ERROR|Started" | head -10
```

Expected: `Successfully applied 1 migration to schema "public" (V7__add_elo_and_rating_day_tables)` and `Started PlayerServiceApplication`.

- [ ] **Step 3: Test endpoints via curl**

```bash
# Public: get current Rating Day (none exist yet)
curl -s -w "\n%{http_code}" http://localhost:8084/api/rating-day/current/FOOTBALL

# Admin: trigger Rating Day
curl -s -X POST http://localhost:8084/api/admin/rating-day/trigger \
  -H "Authorization: Bearer <admin-jwt>" \
  -H "Content-Type: application/json"

# Public: get current Rating Day (should now exist)
curl -s http://localhost:8084/api/rating-day/current/FOOTBALL | python -m json.tool
```

- [ ] **Step 4: Commit any fixes**

```bash
git add -u
git commit -m "fix(rating): resolve any startup or integration issues"
```

---

## Production Deployment Checklist

Before deploying the Rating Day system to production:

| Item | Detail |
|------|--------|
| **V7 migration** | Applied automatically by Flyway on startup |
| **Temporal worker** | Must be running — registered in TemporalConfig |
| **Redis** | Required for rate limiting and vote count cache |
| **CORS** | Already env-var driven (`CORS_ALLOWED_ORIGINS`) |
| **Auth** | Google OAuth required for voting — already built |
| **Admin trigger** | `POST /api/admin/rating-day/trigger` for manual testing before cron |
| **Cron schedule** | Configure Temporal cron schedule for MonthlyRatingDayWorkflow (1st of month, 00:00 UTC) — do this via Temporal UI or CLI, not in code |

---

## What's NOT in This Plan (Future Work)

- **AI nomination evaluation** — placeholder in `RatingDayActivitiesImpl.evaluateNominations()`. Wire to OpenRouter in a follow-up.
- **Frontend voting UI** — head-to-head cards, results page, nomination forms. Separate plan.
- **Temporal cron registration** — schedule via Temporal CLI: `temporal schedule create --cron "0 0 1 * *"`
- **nomination_support table JPA entity** — support vote uniqueness currently relies on DB constraint; can add NominationSupport entity later for richer queries
