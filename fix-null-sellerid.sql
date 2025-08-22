-- Fix products table: remove rows with NULL sellerID to allow NOT NULL constraint
DELETE FROM products WHERE "sellerID" IS NULL;
