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
