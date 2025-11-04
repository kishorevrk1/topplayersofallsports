# Database Verification Script
# Checks data integrity and ingestion status

$GREEN = "Green"
$RED = "Red"
$YELLOW = "Yellow"
$CYAN = "Cyan"

Write-Host "`n========================================" -ForegroundColor $CYAN
Write-Host "  Database Verification" -ForegroundColor $CYAN
Write-Host "========================================`n" -ForegroundColor $CYAN

# Check 1: Active Sources
Write-Host "[CHECK 1] Active Sources..." -ForegroundColor $YELLOW
docker exec -it highlights-postgres psql -U postgres -d highlights_db -c "
SELECT COUNT(*) as active_sources FROM highlight_sources WHERE active = true;
"

# Check 2: Total Videos Ingested
Write-Host "`n[CHECK 2] Total Videos Ingested..." -ForegroundColor $YELLOW
docker exec -it highlights-postgres psql -U postgres -d highlights_db -c "
SELECT COUNT(*) as total_videos FROM highlights;
"

# Check 3: Videos by Sport
Write-Host "`n[CHECK 3] Videos by Sport..." -ForegroundColor $YELLOW
docker exec -it highlights-postgres psql -U postgres -d highlights_db -c "
SELECT 
    sport, 
    COUNT(*) as count,
    ROUND(AVG(view_count)) as avg_views,
    ROUND(AVG(like_count)) as avg_likes
FROM highlights 
GROUP BY sport 
ORDER BY count DESC;
"

# Check 4: Videos by Source
Write-Host "`n[CHECK 4] Videos by Source..." -ForegroundColor $YELLOW
docker exec -it highlights-postgres psql -U postgres -d highlights_db -c "
SELECT 
    hs.name as source_name,
    hs.sport,
    COUNT(h.id) as video_count,
    hs.last_ingested_at
FROM highlight_sources hs
LEFT JOIN highlights h ON h.source_id = hs.id
WHERE hs.active = true
GROUP BY hs.id, hs.name, hs.sport, hs.last_ingested_at
ORDER BY video_count DESC
LIMIT 10;
"

# Check 5: Latest Videos
Write-Host "`n[CHECK 5] Latest 10 Videos..." -ForegroundColor $YELLOW
docker exec -it highlights-postgres psql -U postgres -d highlights_db -c "
SELECT 
    LEFT(title, 50) as title,
    sport,
    view_count,
    published_at
FROM highlights 
ORDER BY published_at DESC 
LIMIT 10;
"

# Check 6: Check for Duplicates
Write-Host "`n[CHECK 6] Checking for Duplicates..." -ForegroundColor $YELLOW
$duplicates = docker exec -it highlights-postgres psql -U postgres -d highlights_db -t -c "
SELECT COUNT(*) 
FROM (
    SELECT video_id, COUNT(*) as count 
    FROM highlights 
    GROUP BY video_id 
    HAVING COUNT(*) > 1
) duplicates;
"

if ($duplicates.Trim() -eq "0") {
    Write-Host "✓ No duplicates found!" -ForegroundColor $GREEN
} else {
    Write-Host "✗ Found $duplicates duplicate video IDs!" -ForegroundColor $RED
    docker exec -it highlights-postgres psql -U postgres -d highlights_db -c "
    SELECT video_id, COUNT(*) as count 
    FROM highlights 
    GROUP BY video_id 
    HAVING COUNT(*) > 1;
    "
}

# Check 7: Most Viewed Videos
Write-Host "`n[CHECK 7] Top 10 Most Viewed Videos..." -ForegroundColor $YELLOW
docker exec -it highlights-postgres psql -U postgres -d highlights_db -c "
SELECT 
    LEFT(title, 50) as title,
    sport,
    view_count,
    like_count
FROM highlights 
ORDER BY view_count DESC 
LIMIT 10;
"

# Check 8: Videos Published Today
Write-Host "`n[CHECK 8] Videos Published Today..." -ForegroundColor $YELLOW
docker exec -it highlights-postgres psql -U postgres -d highlights_db -c "
SELECT COUNT(*) as today_videos
FROM highlights 
WHERE published_at >= CURRENT_DATE;
"

# Check 9: Ingestion Status
Write-Host "`n[CHECK 9] Source Ingestion Status..." -ForegroundColor $YELLOW
docker exec -it highlights-postgres psql -U postgres -d highlights_db -c "
SELECT 
    name,
    sport,
    active,
    last_ingested_at,
    CASE 
        WHEN last_ingested_at IS NULL THEN 'Never'
        WHEN last_ingested_at > NOW() - INTERVAL '10 minutes' THEN 'Recent'
        WHEN last_ingested_at > NOW() - INTERVAL '1 hour' THEN 'Within hour'
        ELSE 'Stale'
    END as status
FROM highlight_sources
ORDER BY last_ingested_at DESC NULLS LAST
LIMIT 15;
"

# Check 10: Database Size
Write-Host "`n[CHECK 10] Database Size..." -ForegroundColor $YELLOW
docker exec -it highlights-postgres psql -U postgres -d highlights_db -c "
SELECT 
    pg_size_pretty(pg_database_size('highlights_db')) as database_size,
    pg_size_pretty(pg_total_relation_size('highlights')) as highlights_table_size,
    pg_size_pretty(pg_total_relation_size('highlight_sources')) as sources_table_size;
"

# Check 11: Index Usage
Write-Host "`n[CHECK 11] Index Usage..." -ForegroundColor $YELLOW
docker exec -it highlights-postgres psql -U postgres -d highlights_db -c "
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans
FROM pg_stat_user_indexes
WHERE tablename IN ('highlights', 'highlight_sources')
ORDER BY idx_scan DESC;
"

# Summary
Write-Host "`n========================================" -ForegroundColor $CYAN
Write-Host "  Verification Complete" -ForegroundColor $CYAN
Write-Host "========================================" -ForegroundColor $CYAN
Write-Host "`nDatabase verification completed!" -ForegroundColor $GREEN
Write-Host "`n" -ForegroundColor Gray
