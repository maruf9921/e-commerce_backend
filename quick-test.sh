#!/bin/bash

echo "🧪 Quick Test: Product Creation with Image Upload"
echo "==============================================="

# Step 1: Login and get token
echo "🔐 Getting JWT Token..."
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
echo "🖼️ Creating test image..."
echo -e '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\tpHYs\x00\x00\x0b\x13\x00\x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\nIDATx\x9cc\xf8\x00\x00\x00\x01\x00\x01\x00\x00\x00\x00IEND\xaeB`\x82' > quick-test.png

# Step 3: Test the endpoint
echo "🛒 Testing product creation with image..."
RESPONSE=$(curl -s -X POST http://localhost:4002/products/create-with-image \
  -H "Authorization: Bearer $TOKEN" \
  -F "name=Quick Test Product" \
  -F "description=Testing if image URL saves to database" \
  -F "price=99.99" \
  -F "stockQuantity=5" \
  -F "category=Test" \
  -F "isActive=true" \
  -F "file=@quick-test.png")

echo "📋 Response:"
echo "$RESPONSE"

# Check if images array exists and is not empty
if echo "$RESPONSE" | grep -q '"images":\['; then
    IMAGES_CONTENT=$(echo "$RESPONSE" | grep -o '"images":\[[^]]*\]')
    if echo "$IMAGES_CONTENT" | grep -q '"imageUrl"'; then
        echo "✅ SUCCESS: Images array contains imageUrl!"
    else
        echo "❌ FAILED: Images array is empty"
    fi
else
    echo "❌ FAILED: No images array found in response"
fi

# Clean up
rm -f quick-test.png
echo "✅ Test completed!"
