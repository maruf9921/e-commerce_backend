#!/bin/bash

# Product Creation and Image Upload Routes Testing
echo "🛒 Testing Product Creation JSON and Image Upload Routes"
echo "======================================================="

# Get JWT Token
echo "🔐 Getting JWT Token..."
TOKEN=$(curl -s -X POST http://localhost:4002/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "testseller", "password": "password123"}' | \
  grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Failed to get JWT token"
    exit 1
else
    echo "✅ JWT Token obtained: ${TOKEN:0:30}..."
fi

echo ""
echo "📋 TEST 1: Create Product (JSON only - no image)"
echo "================================================"
curl -X POST http://localhost:4002/products/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Product JSON",
    "description": "This is a JSON-only product creation test",
    "price": 49.99,
    "stockQuantity": 15,
    "category": "Books"
  }' | jq '.' 2>/dev/null || cat

echo ""
echo "📋 TEST 2: Create Product with Image (Multipart)"
echo "================================================"
# Create test image
echo -e '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\tpHYs\x00\x00\x0b\x13\x00\x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\nIDATx\x9cc\xf8\x00\x00\x00\x01\x00\x01\x00\x00\x00\x00IEND\xaeB`\x82' > test-product.png

PRODUCT_WITH_IMAGE=$(curl -s -X POST http://localhost:4002/products/create-with-image \
  -H "Authorization: Bearer $TOKEN" \
  -F "name=Test Product with Image Upload" \
  -F "description=Product created with image via multipart form" \
  -F "price=129.99" \
  -F "stockQuantity=8" \
  -F "category=Electronics" \
  -F "image=@test-product.png")

echo "$PRODUCT_WITH_IMAGE" | jq '.' 2>/dev/null || echo "$PRODUCT_WITH_IMAGE"

# Extract product ID for later tests
PRODUCT_ID=$(echo "$PRODUCT_WITH_IMAGE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

echo ""
echo "📤 TEST 3: Image Upload Endpoint"
echo "================================"
curl -s -X POST http://localhost:4002/image-upload/uploads \
  -F "image=@test-product.png" | jq '.' 2>/dev/null || cat

echo ""
echo "📋 TEST 4: Fetch All Products"
echo "============================"
curl -s -X GET http://localhost:4002/products \
  -H "Authorization: Bearer $TOKEN" | jq '.[0:3]' 2>/dev/null || head -500

if [ ! -z "$PRODUCT_ID" ]; then
    echo ""
    echo "📋 TEST 5: Fetch Specific Product with Images"
    echo "============================================="
    curl -s -X GET "http://localhost:4002/products/$PRODUCT_ID" \
      -H "Authorization: Bearer $TOKEN" | jq '.' 2>/dev/null || cat

    echo ""
    echo "🖼️ TEST 6: Image Serving Routes"
    echo "==============================="
    
    echo "Testing: GET /products/img/$PRODUCT_ID"
    curl -s -I "http://localhost:4002/products/img/$PRODUCT_ID"
    
    echo ""
    echo "Testing: GET /products/picture/$PRODUCT_ID"
    curl -s -I "http://localhost:4002/products/picture/$PRODUCT_ID"
    
    echo ""
    echo "Testing: GET /products/product-image/$PRODUCT_ID"
    curl -s -I "http://localhost:4002/products/product-image/$PRODUCT_ID"
fi

echo ""
echo "📋 TEST 7: My Products (Seller's Products)"
echo "=========================================="
curl -s -X GET http://localhost:4002/products/my-products \
  -H "Authorization: Bearer $TOKEN" | jq '.' 2>/dev/null || cat

echo ""
echo "🔍 TEST 8: Search Products"
echo "========================="
curl -s -X GET "http://localhost:4002/products/search?query=Test" \
  -H "Authorization: Bearer $TOKEN" | jq '.' 2>/dev/null || cat

echo ""
echo "🧹 Cleaning up test files..."
rm -f test-product.png

echo ""
echo "✅ All tests completed!"
echo "======================="
