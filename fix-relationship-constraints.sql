-- Fix seller-product relationship in database
-- Run this to ensure proper foreign key constraints

-- Check current foreign key constraints
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    tc.constraint_type, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name IN ('products', 'sellers');

-- Drop existing foreign key if problematic
ALTER TABLE products DROP CONSTRAINT IF EXISTS "FK_products_sellerId";

-- Add proper foreign key constraint
ALTER TABLE products 
ADD CONSTRAINT "FK_products_sellerId" 
FOREIGN KEY ("sellerId") REFERENCES sellers(id) 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- Verify the constraint
SELECT constraint_name, table_name, column_name 
FROM information_schema.key_column_usage 
WHERE table_name = 'products' AND column_name = 'sellerId';

-- Check if any orphaned products exist
SELECT p.id, p.name, p."sellerId"
FROM products p
LEFT JOIN sellers s ON p."sellerId" = s.id
WHERE s.id IS NULL;
