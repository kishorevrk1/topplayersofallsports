-- V2: Add video_type and is_featured columns for enhanced video categorization
-- Supports player profile video tabs (highlights, interviews, training, behind-scenes)
-- and featured video carousel on highlights hub

-- Add video_type column with default value
ALTER TABLE highlights 
ADD COLUMN video_type VARCHAR(50) NOT NULL DEFAULT 'HIGHLIGHT';

-- Add is_featured column for carousel
ALTER TABLE highlights
ADD COLUMN is_featured BOOLEAN NOT NULL DEFAULT false;

-- Add check constraint for video_type enum values
ALTER TABLE highlights
ADD CONSTRAINT chk_video_type CHECK (
    video_type IN ('HIGHLIGHT', 'INTERVIEW', 'TRAINING', 'BEHIND_SCENES', 'FULL_GAME', 'DOCUMENTARY')
);

-- Create index for featured videos (used in carousel queries)
CREATE INDEX idx_highlights_featured ON highlights(is_featured, published_at DESC) 
WHERE is_featured = true;

-- Create composite index for video type filtering with sport
CREATE INDEX idx_highlights_type_sport ON highlights(video_type, sport, published_at DESC);

-- Create index for player video queries by type
CREATE INDEX idx_highlight_entities_player_type ON highlight_entities(entity_id, entity_type)
WHERE entity_type = 'PLAYER';

-- Add comments for documentation
COMMENT ON COLUMN highlights.video_type IS 'Video category: HIGHLIGHT, INTERVIEW, TRAINING, BEHIND_SCENES, FULL_GAME, DOCUMENTARY';
COMMENT ON COLUMN highlights.is_featured IS 'Flag for featured carousel display on highlights hub';
