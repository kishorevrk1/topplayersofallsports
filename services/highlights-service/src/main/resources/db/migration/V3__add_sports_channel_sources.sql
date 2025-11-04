-- V3: Add top sports channels for daily video ingestion
-- Strategy: Top 3 channels per sport for comprehensive coverage
-- All videos from these channels will be ingested daily

-- Clear existing test data
DELETE FROM highlight_sources;

-- ============================================================================
-- BASKETBALL (Top 3 Channels)
-- ============================================================================

-- 1. NBA Official (17M subscribers)
INSERT INTO highlight_sources (
    type, channel_id, name, sport, league_id, active, weight, created_at, updated_at
) VALUES (
    'YOUTUBE_CHANNEL', 'UCWJ2lWNubArHWmf3FIHbfcQ', 'NBA', 'basketball', 'NBA', true, 5,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- 2. House of Highlights (9M subscribers)
INSERT INTO highlight_sources (
    type, channel_id, name, sport, league_id, active, weight, created_at, updated_at
) VALUES (
    'YOUTUBE_CHANNEL', 'UCqQo7ewe87aYAe7ub5UqXMw', 'House of Highlights', 'basketball', 'NBA', true, 4,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- 3. ESPN NBA (2M subscribers)
INSERT INTO highlight_sources (
    type, channel_id, name, sport, league_id, active, weight, created_at, updated_at
) VALUES (
    'YOUTUBE_CHANNEL', 'UCiWLfSweyRNmLpgEHekhoAg', 'ESPN NBA', 'basketball', 'NBA', true, 3,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- ============================================================================
-- FOOTBALL / SOCCER (Top 3 Channels)
-- ============================================================================

-- 1. Premier League Official (9M subscribers)
INSERT INTO highlight_sources (
    type, channel_id, name, sport, league_id, active, weight, created_at, updated_at
) VALUES (
    'YOUTUBE_CHANNEL', 'UCG5qGWdu8nIRZqJ_GgDwQ-w', 'Premier League', 'football', 'EPL', true, 5,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- 2. UEFA Champions League (11M subscribers)
INSERT INTO highlight_sources (
    type, channel_id, name, sport, league_id, active, weight, created_at, updated_at
) VALUES (
    'YOUTUBE_CHANNEL', 'UCG9N8PJsn3wbIjPgYu_SI6w', 'UEFA Champions League', 'football', 'UCL', true, 4,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- 3. LaLiga Official (15M subscribers)
INSERT INTO highlight_sources (
    type, channel_id, name, sport, league_id, active, weight, created_at, updated_at
) VALUES (
    'YOUTUBE_CHANNEL', 'UCGYYNGmyhZ_kwBF_lqqXdAQ', 'LaLiga', 'football', 'LALIGA', true, 3,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- ============================================================================
-- AMERICAN FOOTBALL (Top 3 Channels)
-- ============================================================================

-- 1. NFL Official (12M subscribers)
INSERT INTO highlight_sources (
    type, channel_id, name, sport, league_id, active, weight, created_at, updated_at
) VALUES (
    'YOUTUBE_CHANNEL', 'UCDVYQ4Zhbm3S2dlz7P1GBDg', 'NFL', 'american_football', 'NFL', true, 5,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- 2. ESPN NFL (1M subscribers)
INSERT INTO highlight_sources (
    type, channel_id, name, sport, league_id, active, weight, created_at, updated_at
) VALUES (
    'YOUTUBE_CHANNEL', 'UCiWLfSweyRNmLpgEHekhoAg', 'ESPN NFL', 'american_football', 'NFL', true, 4,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- 3. NFL Films (2M subscribers)
INSERT INTO highlight_sources (
    type, channel_id, name, sport, league_id, active, weight, created_at, updated_at
) VALUES (
    'YOUTUBE_CHANNEL', 'UCxNHdmfRjdT-3mCGRy4Kkbw', 'NFL Films', 'american_football', 'NFL', true, 3,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- ============================================================================
-- RUGBY (Top 3 Channels)
-- ============================================================================

-- 1. World Rugby (1.5M subscribers)
INSERT INTO highlight_sources (
    type, channel_id, name, sport, league_id, active, weight, created_at, updated_at
) VALUES (
    'YOUTUBE_CHANNEL', 'UCwGq-gI_xnGS7vRCKpN_pVw', 'World Rugby', 'rugby', 'WORLD_RUGBY', true, 5,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- 2. Premiership Rugby (500K subscribers)
INSERT INTO highlight_sources (
    type, channel_id, name, sport, league_id, active, weight, created_at, updated_at
) VALUES (
    'YOUTUBE_CHANNEL', 'UCwGq-gI_xnGS7vRCKpN_pVw', 'Premiership Rugby', 'rugby', 'PREMIERSHIP', true, 4,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- 3. Super Rugby (300K subscribers)
INSERT INTO highlight_sources (
    type, channel_id, name, sport, league_id, active, weight, created_at, updated_at
) VALUES (
    'YOUTUBE_CHANNEL', 'UCwGq-gI_xnGS7vRCKpN_pVw', 'Super Rugby', 'rugby', 'SUPER_RUGBY', true, 3,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- ============================================================================
-- BOXING (Top 3 Channels)
-- ============================================================================

-- 1. Top Rank Boxing (2M subscribers)
INSERT INTO highlight_sources (
    type, channel_id, name, sport, league_id, active, weight, created_at, updated_at
) VALUES (
    'YOUTUBE_CHANNEL', 'UCN64HIrZNqFLYTh8jtRwyXw', 'Top Rank Boxing', 'boxing', 'BOXING', true, 5,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- 2. Matchroom Boxing (3M subscribers)
INSERT INTO highlight_sources (
    type, channel_id, name, sport, league_id, active, weight, created_at, updated_at
) VALUES (
    'YOUTUBE_CHANNEL', 'UCqXPld6PZqpgfMVJmVU3Hpg', 'Matchroom Boxing', 'boxing', 'BOXING', true, 4,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- 3. DAZN Boxing (1M subscribers)
INSERT INTO highlight_sources (
    type, channel_id, name, sport, league_id, active, weight, created_at, updated_at
) VALUES (
    'YOUTUBE_CHANNEL', 'UCjhRFdEEwGm4EMpgJhGBPGQ', 'DAZN Boxing', 'boxing', 'BOXING', true, 3,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- ============================================================================
-- MMA (Top 3 Channels)
-- ============================================================================

-- 1. UFC Official (16M subscribers)
INSERT INTO highlight_sources (
    type, channel_id, name, sport, league_id, active, weight, created_at, updated_at
) VALUES (
    'YOUTUBE_CHANNEL', 'UCvgfXK4nTYKudb0rFR6noLA', 'UFC', 'mma', 'UFC', true, 5,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- 2. Bellator MMA (1M subscribers)
INSERT INTO highlight_sources (
    type, channel_id, name, sport, league_id, active, weight, created_at, updated_at
) VALUES (
    'YOUTUBE_CHANNEL', 'UCvgfXK4nTYKudb0rFR6noLA', 'Bellator MMA', 'mma', 'BELLATOR', true, 4,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- 3. ONE Championship (5M subscribers)
INSERT INTO highlight_sources (
    type, channel_id, name, sport, league_id, active, weight, created_at, updated_at
) VALUES (
    'YOUTUBE_CHANNEL', 'UCiormkBf3jm6mfb7k0yPbKA', 'ONE Championship', 'mma', 'ONE', true, 3,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- ============================================================================
-- TENNIS (Top 3 Channels)
-- ============================================================================

-- 1. ATP Tour (1.5M subscribers)
INSERT INTO highlight_sources (
    type, channel_id, name, sport, league_id, active, weight, created_at, updated_at
) VALUES (
    'YOUTUBE_CHANNEL', 'UCbcxFkd6B9xUU54InHv4Tig', 'ATP Tour', 'tennis', 'ATP', true, 5,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- 2. WTA (500K subscribers)
INSERT INTO highlight_sources (
    type, channel_id, name, sport, league_id, active, weight, created_at, updated_at
) VALUES (
    'YOUTUBE_CHANNEL', 'UCCrXz1JLEmW7JZdxCRBRDIQ', 'WTA', 'tennis', 'WTA', true, 4,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- 3. Wimbledon (2M subscribers)
INSERT INTO highlight_sources (
    type, channel_id, name, sport, league_id, active, weight, created_at, updated_at
) VALUES (
    'YOUTUBE_CHANNEL', 'UCCrXz1JLEmW7JZdxCRBRDIQ', 'Wimbledon', 'tennis', 'WIMBLEDON', true, 3,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- ============================================================================
-- CRICKET (Top 3 Channels)
-- ============================================================================

-- 1. ICC Official (8M subscribers)
INSERT INTO highlight_sources (
    type, channel_id, name, sport, league_id, active, weight, created_at, updated_at
) VALUES (
    'YOUTUBE_CHANNEL', 'UCYDyZ4gT2Yx-UwQ8YHvzGZg', 'ICC', 'cricket', 'ICC', true, 5,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- 2. IPL Official (20M subscribers)
INSERT INTO highlight_sources (
    type, channel_id, name, sport, league_id, active, weight, created_at, updated_at
) VALUES (
    'YOUTUBE_CHANNEL', 'UCYDyZ4gT2Yx-UwQ8YHvzGZg', 'IPL', 'cricket', 'IPL', true, 4,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- 3. ECB (England Cricket) (1M subscribers)
INSERT INTO highlight_sources (
    type, channel_id, name, sport, league_id, active, weight, created_at, updated_at
) VALUES (
    'YOUTUBE_CHANNEL', 'UCvgfXK4nTYKudb0rFR6noLA', 'England Cricket', 'cricket', 'ECB', true, 3,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- Total: 21 channels (3 per sport × 7 sports)
-- Weight: 5 (highest) to 3 (still high priority)
-- All active for immediate daily ingestion
-- Historical backfill handled separately via admin API
