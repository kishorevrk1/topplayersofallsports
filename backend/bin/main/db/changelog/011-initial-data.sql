--liquibase formatted sql

--changeset topplayersofallsports:011-initial-data
--comment: Insert initial data for testing and development

-- Insert sample admin user (password should be hashed in real application)
INSERT INTO users (first_name, last_name, email, password, role, is_verified, is_active) VALUES
('Admin', 'User', 'admin@topplayersofallsports.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9b1QwcSTn52QYHu', 'ADMIN', TRUE, TRUE),
('John', 'Doe', 'john.doe@example.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9b1QwcSTn52QYHu', 'USER', TRUE, TRUE),
('Jane', 'Smith', 'jane.smith@example.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9b1QwcSTn52QYHu', 'EDITOR', TRUE, TRUE);

-- Insert sample players
INSERT INTO players (name, position, team, sport, jersey_number, height, weight, nationality, is_active, is_featured, biography) VALUES
('LeBron James', 'SF/PF', 'Los Angeles Lakers', 'BASKETBALL', 6, '6''9"', '250 lbs', 'USA', TRUE, TRUE, 'One of the greatest basketball players of all time, known for his versatility and basketball IQ.'),
('Tom Brady', 'QB', 'Tampa Bay Buccaneers', 'FOOTBALL', 12, '6''4"', '225 lbs', 'USA', TRUE, TRUE, 'Seven-time Super Bowl champion, widely considered the greatest quarterback in NFL history.'),
('Lionel Messi', 'RW', 'Inter Miami CF', 'SOCCER', 10, '5''7"', '159 lbs', 'Argentina', TRUE, TRUE, 'Argentine professional footballer, eight-time Ballon d''Or winner.'),
('Aaron Judge', 'RF', 'New York Yankees', 'BASEBALL', 99, '6''7"', '282 lbs', 'USA', TRUE, TRUE, 'American League MVP and home run champion.'),
('Connor McDavid', 'C', 'Edmonton Oilers', 'HOCKEY', 97, '6''1"', '193 lbs', 'Canada', TRUE, TRUE, 'Hart Memorial Trophy winner and one of the fastest players in the NHL.');

-- Insert sample news articles
INSERT INTO news_articles (title, summary, content, category, status, author_id, published_at, view_count) VALUES
('LeBron James Leads Lakers to Victory', 'King James scores 35 points in overtime thriller against Warriors', 'In a spectacular display of veteran leadership, LeBron James scored 35 points and dished out 12 assists to lead the Lakers to a 128-124 overtime victory over the Golden State Warriors...', 'NBA', 'PUBLISHED', 1, NOW() - INTERVAL '1 day', 15000),
('Tom Brady Announces Retirement', 'The GOAT hangs up his cleats after 23 seasons', 'After 23 seasons in the NFL, Tom Brady has announced his retirement from professional football. The seven-time Super Bowl champion leaves behind an unmatched legacy...', 'NFL', 'PUBLISHED', 1, NOW() - INTERVAL '2 days', 25000),
('Messi Scores Hat Trick in MLS Debut', 'The Argentine maestro dazzles in his first Major League Soccer match', 'Lionel Messi marked his MLS debut with a stunning hat trick as Inter Miami defeated LAFC 4-0 in front of a sold-out crowd...', 'SOCCER', 'PUBLISHED', 2, NOW() - INTERVAL '3 days', 30000);

-- Insert sample video highlights
INSERT INTO video_highlights (title, description, video_url, thumbnail_url, duration, sport, highlight_type, player_id, published_at, view_count, like_count) VALUES
('LeBron James 35 Points Highlights vs Warriors', 'Watch all of LeBron''s baskets from his 35-point performance', 'https://example.com/video1', 'https://example.com/thumb1.jpg', 480, 'BASKETBALL', 'GAME_HIGHLIGHT', 1, NOW() - INTERVAL '1 day', 50000, 2500),
('Tom Brady Best Throws Compilation', 'The most accurate throws from the GOAT quarterback', 'https://example.com/video2', 'https://example.com/thumb2.jpg', 360, 'FOOTBALL', 'BEST_PLAYS', 2, NOW() - INTERVAL '2 days', 35000, 1800),
('Messi Hat Trick vs LAFC', 'All three goals from Messi''s MLS debut hat trick', 'https://example.com/video3', 'https://example.com/thumb3.jpg', 300, 'SOCCER', 'GOALS', 3, NOW() - INTERVAL '3 days', 75000, 4200);

-- Link articles with players
INSERT INTO article_players (article_id, player_id) VALUES
(1, 1), -- LeBron article with LeBron player
(2, 2), -- Brady article with Brady player  
(3, 3); -- Messi article with Messi player

--rollback DELETE FROM article_players;
--rollback DELETE FROM video_highlights;
--rollback DELETE FROM news_articles;
--rollback DELETE FROM players;
--rollback DELETE FROM users;
