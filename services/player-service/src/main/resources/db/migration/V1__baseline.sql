-- V1: Full schema baseline — creates all tables so V2+ seed migrations work on a fresh DB.
-- All statements use IF NOT EXISTS / IF NOT EXISTS so this is a safe no-op on existing DBs.

-- ── Players ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS players (
    id                  BIGSERIAL       PRIMARY KEY,
    api_player_id       VARCHAR(255)    NOT NULL,
    name                VARCHAR(255)    NOT NULL,
    display_name        VARCHAR(255),
    normalized_name     VARCHAR(255),
    canonical_id        VARCHAR(255),
    sport               VARCHAR(50)     NOT NULL,
    team                VARCHAR(255),
    position            VARCHAR(100),
    age                 INTEGER,
    height              VARCHAR(20),
    weight              VARCHAR(20),
    photo_url           TEXT,
    nationality         VARCHAR(100),
    birthdate           DATE,
    birthplace          VARCHAR(255),
    college             VARCHAR(255),
    current_rank        INTEGER,
    previous_rank       INTEGER,
    ranking_score       DOUBLE PRECISION,
    elo_score           DOUBLE PRECISION DEFAULT 1500,
    last_ranking_update TIMESTAMP,
    is_active           BOOLEAN         DEFAULT TRUE,
    performance_summary TEXT,
    created_at          TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP,
    CONSTRAINT uq_players_api_player_id UNIQUE (api_player_id),
    CONSTRAINT uq_players_canonical_id  UNIQUE (canonical_id)
);

CREATE INDEX IF NOT EXISTS idx_player_sport          ON players(sport);
CREATE INDEX IF NOT EXISTS idx_player_api_id         ON players(api_player_id);
CREATE INDEX IF NOT EXISTS idx_player_name           ON players(name);
CREATE INDEX IF NOT EXISTS idx_player_normalized_name ON players(normalized_name, sport);
CREATE INDEX IF NOT EXISTS idx_player_canonical_id   ON players(canonical_id);
CREATE INDEX IF NOT EXISTS idx_player_ranking        ON players(sport, current_rank);
CREATE INDEX IF NOT EXISTS idx_player_active         ON players(sport, is_active, current_rank);
CREATE INDEX IF NOT EXISTS idx_player_elo            ON players(sport, elo_score DESC);

-- ── Player aliases ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS player_aliases (
    player_id   BIGINT       NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    alias       VARCHAR(255) NOT NULL,
    PRIMARY KEY (player_id, alias)
);

-- ── Player stats ───────────────────────────────────────────────────────────
-- Matches PlayerStats entity: ppg/rpg/apg decimals + jsonb otherStats.
CREATE TABLE IF NOT EXISTS player_stats (
    id          BIGSERIAL       PRIMARY KEY,
    player_id   BIGINT          NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    season      VARCHAR(20)     NOT NULL,
    ppg         DECIMAL(5,2),
    rpg         DECIMAL(5,2),
    apg         DECIMAL(5,2),
    other_stats JSONB,
    created_at  TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stats_player ON player_stats(player_id);
CREATE INDEX IF NOT EXISTS idx_stats_season ON player_stats(season);

-- ── AI analysis ────────────────────────────────────────────────────────────
-- Matches AIAnalysis entity exactly: strengths/careerHighlights are JSONB.
CREATE TABLE IF NOT EXISTS ai_analysis (
    id                BIGSERIAL    PRIMARY KEY,
    player_id         BIGINT       NOT NULL UNIQUE REFERENCES players(id) ON DELETE CASCADE,
    ai_rating         INTEGER      NOT NULL,
    analysis_text     TEXT,
    strengths         JSONB,
    biography         TEXT,
    career_highlights JSONB,
    generated_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    llm_model         VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_ai_analysis_player ON ai_analysis(player_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_rating ON ai_analysis(ai_rating);

-- ── Auth tables ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id          VARCHAR(36)  PRIMARY KEY,
    email       VARCHAR(255) NOT NULL,
    name        VARCHAR(255) NOT NULL,
    google_id   VARCHAR(255),
    role        VARCHAR(20)  NOT NULL DEFAULT 'USER',
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_users_email     UNIQUE (email),
    CONSTRAINT uq_users_google_id UNIQUE (google_id)
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id          VARCHAR(36)  PRIMARY KEY,
    token       VARCHAR(255) NOT NULL,
    user_id     VARCHAR(36)  NOT NULL,
    expires_at  TIMESTAMP    NOT NULL,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_refresh_tokens_token UNIQUE (token),
    CONSTRAINT fk_refresh_tokens_user  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id    ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- ── ELO / Rating Day tables ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rating_day (
    id           BIGSERIAL    PRIMARY KEY,
    sport        VARCHAR(50)  NOT NULL,
    month        VARCHAR(7)   NOT NULL,
    status       VARCHAR(20)  NOT NULL DEFAULT 'UPCOMING',
    opens_at     TIMESTAMP    NOT NULL,
    closes_at    TIMESTAMP    NOT NULL,
    total_votes  INTEGER      NOT NULL DEFAULT 0,
    total_voters INTEGER      NOT NULL DEFAULT 0,
    created_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_rating_day_sport_month UNIQUE (sport, month)
);

CREATE TABLE IF NOT EXISTS elo_matchup (
    id                  BIGSERIAL        PRIMARY KEY,
    rating_day_id       BIGINT           NOT NULL REFERENCES rating_day(id),
    player1_id          BIGINT           NOT NULL REFERENCES players(id),
    player2_id          BIGINT           NOT NULL REFERENCES players(id),
    voter_user_id       VARCHAR(255)     NOT NULL REFERENCES users(id),
    winner_id           BIGINT           NOT NULL REFERENCES players(id),
    player1_elo_before  DOUBLE PRECISION NOT NULL,
    player2_elo_before  DOUBLE PRECISION NOT NULL,
    player1_elo_after   DOUBLE PRECISION NOT NULL,
    player2_elo_after   DOUBLE PRECISION NOT NULL,
    voted_at            TIMESTAMP        NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_matchup_vote     UNIQUE (rating_day_id, voter_user_id, player1_id, player2_id),
    CONSTRAINT chk_canonical_order CHECK (player1_id < player2_id),
    CONSTRAINT chk_winner_valid    CHECK (winner_id IN (player1_id, player2_id))
);

CREATE INDEX IF NOT EXISTS idx_matchup_rating_day ON elo_matchup(rating_day_id);
CREATE INDEX IF NOT EXISTS idx_matchup_voter      ON elo_matchup(rating_day_id, voter_user_id);

CREATE TABLE IF NOT EXISTS nomination (
    id                   BIGSERIAL    PRIMARY KEY,
    rating_day_id        BIGINT       NOT NULL REFERENCES rating_day(id),
    sport                VARCHAR(50)  NOT NULL,
    player_name          VARCHAR(255) NOT NULL,
    reason               TEXT,
    nominated_by_user_id VARCHAR(255) NOT NULL REFERENCES users(id),
    support_votes        INTEGER      NOT NULL DEFAULT 0,
    status               VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    ai_reasoning         TEXT,
    replaces_player_id   BIGINT       REFERENCES players(id),
    created_at           TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_nomination_user_sport UNIQUE (rating_day_id, nominated_by_user_id, sport)
);

CREATE INDEX IF NOT EXISTS idx_nomination_rating_day ON nomination(rating_day_id, sport);

CREATE TABLE IF NOT EXISTS nomination_support (
    id            BIGSERIAL    PRIMARY KEY,
    nomination_id BIGINT       NOT NULL REFERENCES nomination(id),
    user_id       VARCHAR(255) NOT NULL REFERENCES users(id),
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_nomination_support UNIQUE (nomination_id, user_id)
);

CREATE TABLE IF NOT EXISTS ranking_history (
    id            BIGSERIAL        PRIMARY KEY,
    player_id     BIGINT           NOT NULL REFERENCES players(id),
    sport         VARCHAR(50)      NOT NULL,
    month         VARCHAR(7)       NOT NULL,
    rank_before   INTEGER,
    rank_after    INTEGER,
    elo_before    DOUBLE PRECISION NOT NULL,
    elo_after     DOUBLE PRECISION NOT NULL,
    change_reason VARCHAR(50)      NOT NULL,
    created_at    TIMESTAMP        NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ranking_history_player     ON ranking_history(player_id);
CREATE INDEX IF NOT EXISTS idx_ranking_history_sport_month ON ranking_history(sport, month);
