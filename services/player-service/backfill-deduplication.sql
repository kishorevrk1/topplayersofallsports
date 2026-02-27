-- Backfill deduplication fields for existing players

-- Update normalized names (remove accents, lowercase, special chars)
UPDATE players 
SET normalized_name = LOWER(
  REGEXP_REPLACE(
    TRANSLATE(name, 'ÁÉÍÓÚáéíóúÀÈÌÒÙàèìòùÂÊÎÔÛâêîôûÃÕãõÄËÏÖÜäëïöüÇçÑñ', 
                   'AEIOUaeiouAEIOUaeiouAEIOUaeiouAOaoAEIOUaeiouCcNn'),
    '[^a-z0-9\s]', '', 'g'
  )
)
WHERE normalized_name IS NULL OR normalized_name = '';

-- Update display names (first + last word)
UPDATE players 
SET display_name = 
  CASE 
    WHEN ARRAY_LENGTH(STRING_TO_ARRAY(TRIM(name), ' '), 1) >= 2 
    THEN (STRING_TO_ARRAY(TRIM(name), ' '))[1] || ' ' || 
         (STRING_TO_ARRAY(TRIM(name), ' '))[ARRAY_LENGTH(STRING_TO_ARRAY(TRIM(name), ' '), 1)]
    ELSE name
  END
WHERE display_name IS NULL OR display_name = '';

-- Update canonical IDs
UPDATE players
SET canonical_id = ENCODE(
  SHA256((COALESCE(normalized_name, '') || '|' || COALESCE(LOWER(nationality), 'unknown') || '|unknown')::bytea), 
  'hex'
)
WHERE canonical_id IS NULL OR canonical_id = '';

-- Show results
SELECT id, name, display_name, 
       LEFT(normalized_name, 30) as norm_name, 
       LEFT(canonical_id, 16) as canon_id
FROM players 
WHERE sport='FOOTBALL' 
ORDER BY id;
