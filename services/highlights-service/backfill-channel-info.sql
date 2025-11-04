-- Backfill channel information for existing highlights
-- This updates highlights with channel name from their source

-- First, let's see what sources we have
SELECT id, name, channel_id, sport, league_id 
FROM highlight_sources 
WHERE active = true
ORDER BY id;

-- Update highlights with channel name from their source
UPDATE highlights h
SET 
    channel_name = s.name,
    updated_at = CURRENT_TIMESTAMP
FROM highlight_sources s
WHERE h.source_id = s.id
  AND h.channel_name IS NULL;

-- Verify the update
SELECT 
    COUNT(*) as total_highlights,
    COUNT(channel_name) as with_channel_name,
    COUNT(channel_thumbnail) as with_channel_thumbnail
FROM highlights;

-- Show sample of updated records
SELECT id, title, channel_name, channel_thumbnail, source_id
FROM highlights
ORDER BY id DESC
LIMIT 10;
