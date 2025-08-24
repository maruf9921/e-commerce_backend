-- Update product image URLs with working placeholder images
UPDATE products 
SET "imageUrl" = 'https://picsum.photos/400/300?random=1'
WHERE id = 5;

UPDATE products 
SET "imageUrl" = 'https://picsum.photos/400/300?random=2'
WHERE id = 4;

UPDATE products 
SET "imageUrl" = 'https://picsum.photos/400/300?random=3'
WHERE id = 3;

UPDATE products 
SET "imageUrl" = 'https://picsum.photos/400/300?random=4'
WHERE id = 2;

UPDATE products 
SET "imageUrl" = 'https://picsum.photos/400/300?random=5'
WHERE id = 1;
