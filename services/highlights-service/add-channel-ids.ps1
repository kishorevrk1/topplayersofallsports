# Add YouTube channel IDs to the database
# Run this script to populate channel_id column in highlight_sources table

$env:PGPASSWORD = "postgres"

# Execute the SQL file
psql -h localhost -p 5433 -U postgres -d highlights_db -f "add-channel-ids.sql"

Write-Host "`n✅ Channel IDs added successfully!" -ForegroundColor Green
Write-Host "`nNow run the backfill again:" -ForegroundColor Yellow
Write-Host "Invoke-WebRequest -Uri http://localhost:8081/api/admin/backfill-channel-info -Method POST" -ForegroundColor Cyan
