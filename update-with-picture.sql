-- Update product image URLs to use the simple picture endpoint
UPDATE products 
SET "imageUrl" = 'http://localhost:4050/products/picture/5'
WHERE id = 5;

UPDATE products 
SET "imageUrl" = 'http://localhost:4050/products/picture/4'
WHERE id = 4;

UPDATE products 
SET "imageUrl" = 'http://localhost:4050/products/picture/3'
WHERE id = 3;

UPDATE products 
SET "imageUrl" = 'http://localhost:4050/products/picture/2'
WHERE id = 2;

UPDATE products 
SET "imageUrl" = 'http://localhost:4050/products/picture/1'
WHERE id = 1;
