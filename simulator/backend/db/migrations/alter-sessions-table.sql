-- Alter the user_id column to use TEXT instead of UUID
ALTER TABLE sessions ALTER COLUMN user_id TYPE TEXT;
