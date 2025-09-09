#!/bin/bash

echo "🔧 Testing Fixed Product Creation with Image Upload"
echo "=================================================="

# Step 1: Login and get token
echo "🔐 Step 1: Getting JWT Token..."
TOKEN=$(curl -s -X POST http://localhost:4002/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "testseller", "password": "password123"}' | \
  grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Failed to get JWT token"
    exit 1
else
    echo "✅ JWT Token obtained"
fi

# Step 2: Create a test image
echo "🖼️ Step 2: Creating test image..."
echo -e '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\tpHYs\x00\x00\x0b\x13\x00\x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\nIDATx\x9cc\xf8\x00\x00\x00\x01\x00\x01\x00\x00\x00\x00IEND\xaeB`\x82' > test-fixed.png
echo "✅ Test image created"

# Step 3: Test product creation with image (using correct field name 'image')
echo "🛒 Step 3: Creating product with image upload..."
PRODUCT_RESPONSE=$(curl -s -X POST http://localhost:4002/products/create-with-image \
  -H "Authorization: Bearer $TOKEN" \
  -F "name=Fixed Product with Image" \
  -F "description=This product should have an image in the images array" \
  -F "price=199.99" \
  -F "stockQuantity=25" \
  -F "category=Testing" \
  -F "isActive=true" \
  -F "image=@test-fixed.png")

echo "📋 Product Creation Response:"
echo "$PRODUCT_RESPONSE" | jq '.' 2>/dev/null || echo "$PRODUCT_RESPONSE"

# Extract product ID for verification
PRODUCT_ID=$(echo "$PRODUCT_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ ! -z "$PRODUCT_ID" ]; then
    echo ""
    echo "✅ Product created with ID: $PRODUCT_ID"
    
    # Step 4: Verify the product has images
    echo "🔍 Step 4: Verifying product with images..."
    VERIFY_RESPONSE=$(curl -s -X GET "http://localhost:4002/products/$PRODUCT_ID" \
      -H "Authorization: Bearer $TOKEN")
    
    echo "📋 Product Verification Response:"
    echo "$VERIFY_RESPONSE" | jq '.' 2>/dev/null || echo "$VERIFY_RESPONSE"
    
    # Check if images array is not empty
    IMAGES_COUNT=$(echo "$VERIFY_RESPONSE" | grep -o '"images":\[[^]]*\]' | grep -o '{"id"' | wc -l)
    
    if [ "$IMAGES_COUNT" -gt 0 ]; then
        echo "✅ SUCCESS: Product has $IMAGES_COUNT image(s) in the images array!"
    else
        echo "❌ FAILED: Product images array is still empty"
    fi
else
    echo "❌ Failed to create product"
fi

# Step 5: Test image serving
if [ ! -z "$PRODUCT_ID" ]; then
    echo ""
    echo "🖼️ Step 5: Testing image serving routes..."
    
    echo "Testing: GET /products/img/$PRODUCT_ID"
    IMG_RESPONSE=$(curl -s -I "http://localhost:4002/products/img/$PRODUCT_ID")
    echo "$IMG_RESPONSE" | head -1
    
    echo "Testing: GET /products/picture/$PRODUCT_ID"
    PIC_RESPONSE=$(curl -s -I "http://localhost:4002/products/picture/$PRODUCT_ID")
    echo "$PIC_RESPONSE" | head -1
fi

# Clean up
echo ""
echo "🧹 Cleaning up..."
rm -f test-fixed.png
echo "✅ Test completed!"
