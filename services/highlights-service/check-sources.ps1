# Check which sources exist in database and which have channel IDs

$env:PGPASSWORD='postgres'

Write-Host "`n=== All Active Sources in Database ===" -ForegroundColor Cyan
& 'C:\Program Files\PostgreSQL\16\bin\psql.exe' -h localhost -p 5433 -U postgres -d highlights -c "SELECT id, name, sport, channel_id FROM highlight_sources WHERE active = true ORDER BY name;"

Write-Host "`n=== Sources WITH Channel IDs ===" -ForegroundColor Green
& 'C:\Program Files\PostgreSQL\16\bin\psql.exe' -h localhost -p 5433 -U postgres -d highlights -c "SELECT id, name, sport, channel_id FROM highlight_sources WHERE active = true AND channel_id IS NOT NULL ORDER BY name;"

Write-Host "`n=== Sources WITHOUT Channel IDs ===" -ForegroundColor Yellow
& 'C:\Program Files\PostgreSQL\16\bin\psql.exe' -h localhost -p 5433 -U postgres -d highlights -c "SELECT id, name, sport FROM highlight_sources WHERE active = true AND channel_id IS NULL ORDER BY name;"

Write-Host "`n=== Football/Soccer Sources ===" -ForegroundColor Magenta
& 'C:\Program Files\PostgreSQL\16\bin\psql.exe' -h localhost -p 5433 -U postgres -d highlights -c "SELECT id, name, sport, channel_id FROM highlight_sources WHERE active = true AND sport = 'FOOTBALL' ORDER BY name;"
