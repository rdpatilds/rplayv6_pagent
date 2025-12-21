-- Check if users table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'users'
) AS "users_table_exists";

-- If it exists, check what users are in it
SELECT email, name, role FROM users ORDER BY role;
