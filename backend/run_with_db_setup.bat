@echo off
echo Creating PostgreSQL database...

:: Try to create the database using postgres user
echo Creating database topplayersofallsports...
echo CREATE DATABASE topplayersofallsports; | psql -h localhost -U postgres -d postgres 2>nul

echo Database creation attempt completed.
echo Starting Spring Boot application...

gradlew bootRun --args="--spring.profiles.active=dev"
