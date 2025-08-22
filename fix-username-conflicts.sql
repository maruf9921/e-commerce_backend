-- SQL script to fix duplicate username constraint issues
-- Run this in your PostgreSQL database

-- Step 1: Check existing data conflicts
SELECT 'total_users' as table_name, username, email FROM total_users
UNION ALL
SELECT 'sellers' as table_name, username, 'N/A' as email FROM sellers
ORDER BY username;

-- Step 2: Backup existing data
CREATE TABLE backup_total_users AS SELECT * FROM total_users;
CREATE TABLE backup_sellers AS SELECT * FROM sellers;

-- Step 3: Add prefixes to avoid conflicts
UPDATE total_users SET username = 'user_' || username WHERE username NOT LIKE 'user_%';
UPDATE sellers SET username = 'seller_' || username WHERE username NOT LIKE 'seller_%';

-- Step 4: Alternative - Drop unique constraint on one table temporarily
-- ALTER TABLE sellers DROP CONSTRAINT IF EXISTS "UQ_sellers_username";

-- Step 5: Verify no more conflicts
SELECT username, COUNT(*) FROM (
    SELECT username FROM total_users
    UNION ALL
    SELECT username FROM sellers
) combined 
GROUP BY username 
HAVING COUNT(*) > 1;
