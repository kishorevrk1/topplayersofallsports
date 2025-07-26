--liquibase formatted sql

--changeset topplayersofallsports:003-performance-indexes
--comment: Create performance indexes

-- Users table indexes
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active);

-- Players table indexes
CREATE INDEX idx_players_api_id ON players(api_player_id);
CREATE INDEX idx_players_name ON players(name);
CREATE INDEX idx_players_sport ON players(sport);
CREATE INDEX idx_players_team ON players(team_id);
CREATE INDEX idx_players_league ON players(league_id);
CREATE INDEX idx_players_season ON players(season);

-- News articles indexes
CREATE INDEX idx_news_title ON news_articles(title);
CREATE INDEX idx_news_sport ON news_articles(sport);
CREATE INDEX idx_news_category ON news_articles(category);
CREATE INDEX idx_news_published ON news_articles(published_at);
CREATE INDEX idx_news_featured ON news_articles(is_featured);

-- Football fixtures indexes
CREATE INDEX idx_fixtures_api_id ON football_fixtures(api_fixture_id);
CREATE INDEX idx_fixtures_date ON football_fixtures(fixture_date);
CREATE INDEX idx_fixtures_league ON football_fixtures(league_id);
CREATE INDEX idx_fixtures_season ON football_fixtures(season);
CREATE INDEX idx_fixtures_home_team ON football_fixtures(home_team_id);
CREATE INDEX idx_fixtures_away_team ON football_fixtures(away_team_id);
CREATE INDEX idx_fixtures_status ON football_fixtures(status_short);
CREATE INDEX idx_fixtures_cached ON football_fixtures(cached_at);

--rollback DROP INDEX IF EXISTS idx_fixtures_cached;
--rollback DROP INDEX IF EXISTS idx_fixtures_status;
--rollback DROP INDEX IF EXISTS idx_fixtures_away_team;
--rollback DROP INDEX IF EXISTS idx_fixtures_home_team;
--rollback DROP INDEX IF EXISTS idx_fixtures_season;
--rollback DROP INDEX IF EXISTS idx_fixtures_league;
--rollback DROP INDEX IF EXISTS idx_fixtures_date;
--rollback DROP INDEX IF EXISTS idx_fixtures_api_id;
--rollback DROP INDEX IF EXISTS idx_news_featured;
--rollback DROP INDEX IF EXISTS idx_news_published;
--rollback DROP INDEX IF EXISTS idx_news_category;
--rollback DROP INDEX IF EXISTS idx_news_sport;
--rollback DROP INDEX IF EXISTS idx_news_title;
--rollback DROP INDEX IF EXISTS idx_players_season;
--rollback DROP INDEX IF EXISTS idx_players_league;
--rollback DROP INDEX IF EXISTS idx_players_team;
--rollback DROP INDEX IF EXISTS idx_players_sport;
--rollback DROP INDEX IF EXISTS idx_players_name;
--rollback DROP INDEX IF EXISTS idx_players_api_id;
--rollback DROP INDEX IF EXISTS idx_users_active;
--rollback DROP INDEX IF EXISTS idx_users_email;
--rollback DROP INDEX IF EXISTS idx_users_username;
