-- Update product image URLs with working placeholder images
UPDATE products 
SET "imageUrl" = 'https://via.placeholder.com/400x300/007bff/ffffff?text=Product+Image'
WHERE id = 5;

UPDATE products 
SET "imageUrl" = 'https://via.placeholder.com/400x300/28a745/ffffff?text=Product+Image'
WHERE id = 4;

UPDATE products 
SET "imageUrl" = 'https://via.placeholder.com/400x300/dc3545/ffffff?text=Product+Image'
WHERE id = 3;

UPDATE products 
SET "imageUrl" = 'https://via.placeholder.com/400x300/ffc107/000000?text=Product+Image'
WHERE id = 2;

UPDATE products 
SET "imageUrl" = 'https://via.placeholder.com/400x300/6f42c1/ffffff?text=Product+Image'
WHERE id = 1;
