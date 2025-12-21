-- Check for any database operations that might have affected the users table
SELECT event_type, object_identity, command_tag, xact_start
FROM pg_stat_activity
WHERE query LIKE '%users%'
ORDER BY xact_start DESC
LIMIT 10;

-- Alternative approach if pg_stat_activity doesn't show historical data
SELECT schemaname, tablename, last_vacuum, last_autovacuum, last_analyze, last_autoanalyze
FROM pg_stat_user_tables
WHERE tablename = 'users';
