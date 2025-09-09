# Product Creation and Image Upload - JSON Examples

## 🔐 STEP 1: Authentication (Login First)
**URL:** `POST http://localhost:4002/auth/login`
**Content-Type:** `application/json`

```json
{
  "username": "testseller",
  "password": "password123"
}
```

**Response:** 
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "testseller",
    "role": "SELLER"
  }
}
```

---

## 🛒 STEP 2: Create Product (JSON Only - No Image)
**URL:** `POST http://localhost:4002/products/create`
**Headers:** 
- `Authorization: Bearer YOUR_JWT_TOKEN`
- `Content-Type: application/json`

```json
{
  "name": "Amazing Laptop",
  "description": "High-performance laptop with latest specs. Perfect for gaming and professional work.",
  "price": 1299.99,
  "stockQuantity": 5,
  "category": "Electronics",
  "isActive": true
}
```

**Response:**
```json
{
  "id": 1,
  "name": "Amazing Laptop",
  "description": "High-performance laptop with latest specs. Perfect for gaming and professional work.",
  "price": 1299.99,
  "stockQuantity": 5,
  "category": "Electronics",
  "isActive": true,
  "sellerId": "SELLER_1756841786471_562",
  "images": [],
  "createdAt": "2025-09-03T01:45:00.000Z",
  "updatedAt": "2025-09-03T01:45:00.000Z"
}
```

---

## 📤 STEP 3: Create Product WITH Image Upload (Multipart Form)
**URL:** `POST http://localhost:4002/products/create-with-image`
**Headers:** 
- `Authorization: Bearer YOUR_JWT_TOKEN`
- `Content-Type: multipart/form-data`

**Form Data Fields:**
```
name: Gaming Mouse
description: High precision gaming mouse with RGB lighting
price: 79.99
stockQuantity: 20
category: Electronics
isActive: true
file: [SELECT IMAGE FILE - .png, .jpg, .jpeg]
```

**Using curl:**
```bash
curl -X POST http://localhost:4002/products/create-with-image \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "name=Gaming Mouse" \
  -F "description=High precision gaming mouse with RGB lighting" \
  -F "price=79.99" \
  -F "stockQuantity=20" \
  -F "category=Electronics" \
  -F "isActive=true" \
  -F "file=@image.png"
```

**Response:**
```json
{
  "id": 2,
  "name": "Gaming Mouse",
  "description": "High precision gaming mouse with RGB lighting",
  "price": 79.99,
  "stockQuantity": 20,
  "category": "Electronics",
  "isActive": true,
  "sellerId": "SELLER_1756841786471_562",
  "images": [
    {
      "id": 1,
      "imageUrl": "http://localhost:4002/uploads/images/1756842000000-image.png",
      "altText": "Gaming Mouse",
      "isActive": true,
      "sortOrder": 0,
      "createdAt": "2025-09-03T01:46:00.000Z"
    }
  ],
  "createdAt": "2025-09-03T01:46:00.000Z",
  "updatedAt": "2025-09-03T01:46:00.000Z"
}
```

---

## 📸 STEP 4: Standalone Image Upload
**URL:** `POST http://localhost:4002/image-upload/uploads`
**Content-Type:** `multipart/form-data`

**Form Data:**
```
image: [SELECT IMAGE FILE]
```

**Using curl:**
```bash
curl -X POST http://localhost:4002/image-upload/uploads \
  -F "image=@product-image.png"
```

**Response:**
```json
{
  "message": "Image uploaded successfully",
  "filename": "1756842100000-product-image.png",
  "url": "http://localhost:4002/uploads/1756842100000-product-image.png"
}
```

---

## 🖼️ STEP 5: Fetch Product Images
**URL:** `GET http://localhost:4002/products/{productId}`
**Headers:** `Authorization: Bearer YOUR_JWT_TOKEN`

**Response:**
```json
{
  "id": 2,
  "name": "Gaming Mouse",
  "description": "High precision gaming mouse with RGB lighting",
  "price": 79.99,
  "stockQuantity": 20,
  "category": "Electronics",
  "isActive": true,
  "sellerId": "SELLER_1756841786471_562",
  "images": [
    {
      "id": 1,
      "imageUrl": "http://localhost:4002/uploads/images/1756842000000-image.png",
      "altText": "Gaming Mouse",
      "isActive": true,
      "sortOrder": 0
    }
  ],
  "seller": {
    "id": 1,
    "username": "testseller",
    "fullName": "Test Seller"
  }
}
```

---

## 🖼️ Image Serving Routes

### View Product Image by Product ID:
- `GET http://localhost:4002/products/img/{productId}`
- `GET http://localhost:4002/products/picture/{productId}`
- `GET http://localhost:4002/products/product-image/{productId}`

### View Uploaded Image by Filename:
- `GET http://localhost:4002/image-upload/pic/{imagename}`
- `GET http://localhost:4002/products/serve-image/{filename}`

---

## 📋 Additional Product Routes

### Get All Products:
```
GET http://localhost:4002/products
Authorization: Bearer YOUR_JWT_TOKEN
```

### Get My Products (Seller's Products):
```
GET http://localhost:4002/products/my-products
Authorization: Bearer YOUR_JWT_TOKEN
```

### Search Products:
```
GET http://localhost:4002/products/search?query=laptop
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## ⚡ Quick Test Commands

```bash
# 1. Login and get token
TOKEN=$(curl -s -X POST http://localhost:4002/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "testseller", "password": "password123"}' | \
  grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

# 2. Create product without image
curl -X POST http://localhost:4002/products/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Product",
    "description": "Test description",
    "price": 99.99,
    "stockQuantity": 10,
    "category": "Electronics"
  }'

# 3. Create product with image (need actual image file)
curl -X POST http://localhost:4002/products/create-with-image \
  -H "Authorization: Bearer $TOKEN" \
  -F "name=Test Product with Image" \
  -F "description=Product with image upload" \
  -F "price=149.99" \
  -F "stockQuantity=5" \
  -F "category=Electronics" \
  -F "file=@your-image.png"
```
