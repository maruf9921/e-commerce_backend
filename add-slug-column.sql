-- Add slug column to products table
ALTER TABLE products ADD COLUMN slug VARCHAR(255);

-- Create index on slug for better performance
CREATE INDEX idx_products_slug ON products(slug);

-- Update existing products with slugs
UPDATE products 
SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^a-zA-Z0-9 -]', '', 'g'), '\s+', '-', 'g'))
WHERE slug IS NULL;
