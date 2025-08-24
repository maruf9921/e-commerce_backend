-- Update product image URLs to use the static endpoint with local image filenames
UPDATE products 
SET "imageUrl" = 'http://localhost:4050/products/static/1756051424563-Screenshot from 2025-06-24 11-04-25.png'
WHERE id = 5;

UPDATE products 
SET "imageUrl" = 'http://localhost:4050/products/static/1756044289456-Screenshot from 2025-06-24 01-51-42.png'
WHERE id = 4;

UPDATE products 
SET "imageUrl" = 'http://localhost:4050/products/static/1755224860078-Screenshot from 2025-06-24 01-51-42.png'
WHERE id = 3;

UPDATE products 
SET "imageUrl" = 'http://localhost:4050/products/static/1756044289456-Screenshot from 2025-06-24 01-51-42.png'
WHERE id = 2;

UPDATE products 
SET "imageUrl" = 'http://localhost:4050/products/static/1756051424563-Screenshot from 2025-06-24 11-04-25.png'
WHERE id = 1;
