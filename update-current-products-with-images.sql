-- Insert product images into product_images table for existing products
-- Using correct port 4002 and existing image files from uploads/images folder

-- First clear any existing images for these products
DELETE FROM product_images WHERE "productId" IN (42, 41, 40, 38, 37, 36, 35, 34, 33);

-- Insert new images for products (excluding product 39 which doesn't exist)
INSERT INTO product_images ("imageUrl", "altText", "isActive", "sortOrder", "productId", "createdAt", "updatedAt") VALUES
('http://localhost:4002/products/serve-image/c-d-x-PDX_a_82obo-unsplash3abd9593-7894-48f0-9dd8-3383f6ff28d9.jpg', 'Gaming Mouse', true, 0, 42, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('http://localhost:4002/products/serve-image/realme-Buds-Air-5-White-41714d5403c6-620c-457c-865f-fd9f85931d30.jpg', 'Air Buds', true, 0, 41, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('http://localhost:4002/products/serve-image/buds-air-6-01-500x500ce2b9911-5109-41f3-b32f-a7db85db927d.webp', 'Smart Watch', true, 0, 40, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('http://localhost:4002/products/serve-image/premium_photo-1664474619075-644dd191935f36cf4ac8-17ba-40f8-8aa0-af9bbddd57d0.jpeg', 'Product', true, 0, 38, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('http://localhost:4002/products/serve-image/pexels-madebymath-90946d2a5ff42-72d4-4be3-b3b1-a3b5a553651e.jpg', 'Product', true, 0, 37, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('http://localhost:4002/products/serve-image/free-nature-images4b1abb64-4429-4969-981d-3572f2717b6c.jpg', 'Nature Product', true, 0, 36, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('http://localhost:4002/products/serve-image/MainBefore2cbbc410-c722-4ce9-bf09-84cec7c67c0b.jpg', 'Product', true, 0, 35, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('http://localhost:4002/products/serve-image/Imagee46dd753-96f8-4cf3-9440-76b0913f3e43.jpeg', 'Product', true, 0, 34, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('http://localhost:4002/products/serve-image/Screenshotfrom2025-08-2414-15-56afe8d4ce-08f6-4019-92fc-e9a8d7feb6c0.png', 'Product', true, 0, 33, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);