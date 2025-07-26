-- Create database if it doesn't exist
SELECT 'CREATE DATABASE topplayersofallsports'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'topplayersofallsports')\gexec
