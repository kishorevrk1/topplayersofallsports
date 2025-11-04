-- V4: Add channel information to highlights table
-- This allows displaying channel name and logo in the frontend

ALTER TABLE highlights
ADD COLUMN channel_name VARCHAR(200),
ADD COLUMN channel_thumbnail VARCHAR(1000);

-- Create index for channel name searches
CREATE INDEX idx_highlights_channel_name ON highlights(channel_name);

-- Update existing records with channel info from sources
UPDATE highlights h
SET 
    channel_name = s.name,
    channel_thumbnail = NULL  -- Will be populated on next ingestion
FROM highlight_sources s
WHERE h.source_id = s.id;

COMMENT ON COLUMN highlights.channel_name IS 'YouTube channel name (e.g., NBA, UFC)';
COMMENT ON COLUMN highlights.channel_thumbnail IS 'URL to channel logo/avatar';
