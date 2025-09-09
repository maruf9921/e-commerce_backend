#!/bin/bash

# Debug Image Upload Issue
echo "🔍 DEBUGGING IMAGE UPLOAD ISSUE"
echo "=================================="

# Check if server is running
echo "📡 Checking server status..."
SERVER_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4002/products || echo "000")

if [ "$SERVER_STATUS" != "200" ]; then
    echo "❌ Server not running on port 4002. Please start it first."
    exit 1
fi

echo "✅ Server is running (HTTP $SERVER_STATUS)"

# Get a JWT token (you'll need to replace with actual credentials)
echo "🔑 Getting JWT token..."

# First, let's login as an admin/seller
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:4002/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin1",
    "password": "admin123"
  }')

# Extract token
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Failed to get JWT token. Login response:"
    echo "$LOGIN_RESPONSE"
    echo ""
    echo "🔧 Let's try to create a test user..."
    
    # Try to create a seller user
    CREATE_USER=$(curl -s -X POST http://localhost:4002/auth/register \
      -H "Content-Type: application/json" \
      -d '{
        "username": "testseller123",
        "email": "testseller@test.com", 
        "password": "password123",
        "role": "SELLER",
        "phone": "123-456-7890"
      }')
    
    echo "User creation response: $CREATE_USER"
    
    # Try login again
    LOGIN_RESPONSE=$(curl -s -X POST http://localhost:4002/auth/login \
      -H "Content-Type: application/json" \
      -d '{
        "username": "testseller123",
        "password": "password123"
      }')
    
    TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
fi

if [ -z "$TOKEN" ]; then
    echo "❌ Still failed to get JWT token. Cannot proceed with authenticated request."
    exit 1
fi

echo "✅ Got JWT token: ${TOKEN:0:20}..."

# Create a test image file
echo "🖼️ Creating test image file..."
TEST_IMAGE="/tmp/test_product_image.jpg"

# Create a simple test image (1x1 pixel red JPEG)
echo -e '\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.\'\x20\x1c\x1c(7),01444\x1f\'9=82<.342\xff\xc0\x00\x11\x08\x00\x01\x00\x01\x01\x01\x11\x00\x02\x11\x01\x03\x11\x01\xff\xc4\x00\x14\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x08\xff\xc4\x00\x14\x10\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\xff\xda\x00\x0c\x03\x01\x00\x02\x11\x03\x11\x00\x3f\x00\xaa\xff\xd9' > "$TEST_IMAGE"

if [ ! -f "$TEST_IMAGE" ]; then
    echo "❌ Failed to create test image"
    exit 1
fi

echo "✅ Test image created at $TEST_IMAGE"

# Create uploads directory if it doesn't exist
echo "📁 Ensuring uploads directory exists..."
mkdir -p /home/dip-roy/e-commerce_project/e-commerce_backend/uploads/images
echo "✅ Uploads directory ready"

# Test the product creation with image upload
echo "🚀 Testing product creation with image upload..."

RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}\n" -X POST http://localhost:4002/products/create-with-image \
  -H "Authorization: Bearer $TOKEN" \
  -F "name=Debug Test Product $(date +%s)" \
  -F "description=Testing image upload debugging" \
  -F "price=99.99" \
  -F "stockQuantity=10" \
  -F "category=Electronics" \
  -F "isActive=true" \
  -F "file=@$TEST_IMAGE;type=image/jpeg")

echo "📤 Response:"
echo "$RESPONSE"

# Extract HTTP status
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
RESPONSE_BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS:/d')

echo ""
echo "📊 Response Analysis:"
echo "HTTP Status: $HTTP_STATUS"

if [ "$HTTP_STATUS" = "201" ] || [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Product creation request successful"
    
    # Extract product ID from response if possible
    PRODUCT_ID=$(echo "$RESPONSE_BODY" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
    
    if [ ! -z "$PRODUCT_ID" ]; then
        echo "📦 Created Product ID: $PRODUCT_ID"
        
        # Check if images were saved
        echo "🔍 Checking database for saved images..."
        
        DB_CHECK=$(PGPASSWORD=postgres psql -h localhost -U postgres -d e_commerce -t -c "SELECT COUNT(*) FROM product_images WHERE \"productId\" = $PRODUCT_ID;")
        IMAGE_COUNT=$(echo $DB_CHECK | tr -d ' ')
        
        echo "📊 Images in database for product $PRODUCT_ID: $IMAGE_COUNT"
        
        if [ "$IMAGE_COUNT" -gt "0" ]; then
            echo "✅ SUCCESS: Images were saved to database!"
            
            # Show the image details
            PGPASSWORD=postgres psql -h localhost -U postgres -d e_commerce -c "SELECT id, \"imageUrl\", \"altText\", \"isActive\", \"sortOrder\" FROM product_images WHERE \"productId\" = $PRODUCT_ID;"
        else
            echo "❌ PROBLEM: Images were NOT saved to database"
            echo ""
            echo "🔍 Let's check the uploads directory..."
            ls -la /home/dip-roy/e-commerce_project/e-commerce_backend/uploads/images/
            
            echo ""
            echo "🔍 Let's check what was saved in the product..."
            PGPASSWORD=postgres psql -h localhost -U postgres -d e_commerce -c "SELECT id, name, \"userId\", \"createdAt\" FROM products WHERE id = $PRODUCT_ID;"
        fi
    else
        echo "⚠️ Could not extract product ID from response"
    fi
else
    echo "❌ Product creation failed"
    echo "Response body: $RESPONSE_BODY"
fi

# Cleanup
rm -f "$TEST_IMAGE"

echo ""
echo "🔍 DEBUG COMPLETED"
echo "=================="
