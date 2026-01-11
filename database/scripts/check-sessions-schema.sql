-- Check the current schema of the sessions table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sessions';
