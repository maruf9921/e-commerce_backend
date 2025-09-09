#!/bin/bash

echo "🧪 SIMPLE IMAGE UPLOAD TEST"
echo "============================"

# Test basic connectivity first
echo "1️⃣ Testing server connectivity..."
curl -s http://localhost:4002/products | head -c 100 && echo "... [truncated]"

# Try to get a JWT token by logging in as existing user
echo "" "id": 30,
    "name": "Amazing Laptop7",
    "description": "High-performance laptop with latest specs",
    "price": "1299.99",
    "stockQuantity": 5,
    "category": "Electronics",
    "isActive": true,
    "slug": null,
    "createdAt": "2025-09-02T20:38:15.322Z",
…        "fullName": "Test Seller",
        "role": "SELLER",
        "isActive": true,
        "createdAt": "2025-09-02T19:36:26.469Z",
 
echo "2️⃣ Trying to login with existing user..."

# Try login with user ID 5 (from the products table)
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:4002/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test_seller",
    "password": "password123"
  }')

echo "Login response: $LOGIN_RESPONSE"

# Try the direct test approach - let's see what error we get
echo ""
echo "3️⃣ Testing the create-with-image endpoint without auth first..."

# Create a simple test file
echo "Creating test image..."
TEST_IMAGE="/tmp/test.jpg"
echo "fake-image-data" > "$TEST_IMAGE"

# Test without JWT first to see the error
RESPONSE=$(curl -s -X POST http://localhost:4002/products/create-with-image \
  -F "name=Debug Product" \
  -F "description=Test description" \
  -F "price=99.99" \
  -F "stockQuantity=10" \
  -F "category=Electronics" \
  -F "isActive=true" \
  -F "file=@$TEST_IMAGE")

echo "Response without auth: $RESPONSE" "id": 30,
    "name": "Amazing Laptop7",
    "description": "High-performance laptop with latest specs",
    "price": "1299.99",
    "stockQuantity": 5,
    "category": "Electronics",
    "isActive": true,
    "slug": null,
    "createdAt": "2025-09-02T20:38:15.322Z",
…        "fullName": "Test Seller",
        "role": "SELLER",
        "isActive": true,
        "createdAt": "2025-09-02T19:36:26.469Z",
 

# Cleanup
rm -f "$TEST_IMAGE"
