-- Make phone column nullable in users table
ALTER TABLE users ALTER COLUMN phone DROP NOT NULL;