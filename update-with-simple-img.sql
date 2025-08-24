-- Update product image URLs to use the simple img endpoint
UPDATE products 
SET "imageUrl" = 'http://localhost:4050/products/img/5'
WHERE id = 5;

UPDATE products 
SET "imageUrl" = 'http://localhost:4050/products/img/4'
WHERE id = 4;

UPDATE products 
SET "imageUrl" = 'http://localhost:4050/products/img/3'
WHERE id = 3;

UPDATE products 
SET "imageUrl" = 'http://localhost:4050/products/img/2'
WHERE id = 2;

UPDATE products 
SET "imageUrl" = 'http://localhost:4050/products/img/1'
WHERE id = 1;
