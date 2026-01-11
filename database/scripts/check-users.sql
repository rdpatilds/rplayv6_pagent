-- Check if users table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'users'
);

-- If it exists, check what users are in it
SELECT id, email, name, role FROM users;
