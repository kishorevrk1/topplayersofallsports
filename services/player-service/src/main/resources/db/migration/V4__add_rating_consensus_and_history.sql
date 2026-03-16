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
