-- Add YouTube channel IDs to highlight_sources table
-- This will enable the backfill service to fetch channel logos

-- NBA
UPDATE highlight_sources 
SET channel_id = 'UCWJ2lWNubArHWmf3FIHbfcQ' 
WHERE name = 'NBA';

-- UFC
UPDATE highlight_sources 
SET channel_id = 'UCvgfXK4nTYKudb0rFR6noLA' 
WHERE name = 'UFC';

-- NFL
UPDATE highlight_sources 
SET channel_id = 'UCDVYQ4Zhbm3S2dlz7P1GBDg' 
WHERE name = 'NFL';

-- ESPN NFL
UPDATE highlight_sources 
SET channel_id = 'UCiWLfSweyRNmLpgEHekhoAg' 
WHERE name = 'ESPN NFL';

-- ESPN NBA
UPDATE highlight_sources 
SET channel_id = 'UCiWLfSweyRNmLpgEHekhoAg' 
WHERE name = 'ESPN NBA';

-- House of Highlights
UPDATE highlight_sources 
SET channel_id = 'UCqQo7ewe87aYAe7ub5UqXMw' 
WHERE name = 'House of Highlights';

-- Premier League
UPDATE highlight_sources 
SET channel_id = 'UC_8vRXCrUZYe2UqVnY3xRbg' 
WHERE name = 'Premier League';

-- LaLiga
UPDATE highlight_sources 
SET channel_id = 'UC6jEJ8xgbOaZw-oi9-b6A2A' 
WHERE name = 'LaLiga';

-- ATP Tour
UPDATE highlight_sources 
SET channel_id = 'UCbcxFkd6B9xUU54InHv4Tig' 
WHERE name = 'ATP Tour';

-- Bellator MMA
UPDATE highlight_sources 
SET channel_id = 'UCqO-XI2U_1ADxfp-jzrEfpg' 
WHERE name = 'Bellator MMA';

-- ONE Championship
UPDATE highlight_sources 
SET channel_id = 'UCiormkBf3jm6mfb7k0yPbKA' 
WHERE name = 'ONE Championship';

-- Verify the updates
SELECT id, name, channel_id, active 
FROM highlight_sources 
WHERE active = true
ORDER BY id;
