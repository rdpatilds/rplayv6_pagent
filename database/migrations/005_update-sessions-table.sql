-- Alter the sessions table to use TEXT for user_id instead of UUID
ALTER TABLE sessions ALTER COLUMN user_id TYPE TEXT;
