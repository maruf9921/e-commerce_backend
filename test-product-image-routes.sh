#!/bin/bash

# Test script for Product Creation, Image Upload, and Picture Fetching Routes
# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:4002"
TEST_USERNAME="testseller"
TEST_PASSWORD="password123"
JWT_TOKEN=""

echo -e "${BLUE}🚀 Starting Product Image Routes Test...${NC}"
echo "=================================================="

# Function to print test results
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

# Function to extract JWT token from response
extract_token() {
    echo "$1" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4
}

# Step 1: Register a test seller
echo -e "\n${YELLOW}📝 Step 1: Register Test Seller${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "'$TEST_USERNAME'",
    "password": "'$TEST_PASSWORD'",
    "email": "testseller@example.com",
    "phone": "01234567890",
    "fullName": "Test Seller",
    "role": "SELLER"
  }')

if echo "$REGISTER_RESPONSE" | grep -q "id"; then
    print_result 0 "Seller registration successful"
    echo "Response: $REGISTER_RESPONSE"
else
    # User might already exist, try to continue
    echo -e "${YELLOW}⚠️ User might already exist, continuing with login...${NC}"
fi

# Step 2: Login to get JWT token
echo -e "\n${YELLOW}🔐 Step 2: Login to Get JWT Token${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "'$TEST_USERNAME'",
    "password": "'$TEST_PASSWORD'"
  }')

JWT_TOKEN=$(extract_token "$LOGIN_RESPONSE")

if [ ! -z "$JWT_TOKEN" ]; then
    print_result 0 "Login successful, JWT token obtained"
    echo "Token: ${JWT_TOKEN:0:50}..."
else
    print_result 1 "Login failed"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

# Step 3: Create a sample image file for testing
echo -e "\n${YELLOW}📸 Step 3: Create Test Image File${NC}"
# Create a simple test image (1x1 pixel PNG)
echo -e '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\tpHYs\x00\x00\x0b\x13\x00\x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\nIDATx\x9cc\xf8\x00\x00\x00\x01\x00\x01\x00\x00\x00\x00IEND\xaeB`\x82' > test-image.png
print_result 0 "Test image file created"

# Step 4: Test product creation with image upload
echo -e "\n${YELLOW}🛒 Step 4: Create Product with Image Upload${NC}"
PRODUCT_RESPONSE=$(curl -s -X POST "$BASE_URL/products/create-with-image" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -F "name=Test Product with Image" \
  -F "description=This is a test product with an uploaded image" \
  -F "price=99.99" \
  -F "stockQuantity=10" \
  -F "category=Electronics" \
  -F "image=@test-image.png")

echo "Product Creation Response: $PRODUCT_RESPONSE"

# Extract product ID from response
PRODUCT_ID=$(echo "$PRODUCT_RESPONSE" | grep -o '"id":[0-9]*' | cut -d':' -f2)

if [ ! -z "$PRODUCT_ID" ]; then
    print_result 0 "Product created successfully with ID: $PRODUCT_ID"
else
    print_result 1 "Product creation failed"
    echo "Response: $PRODUCT_RESPONSE"
fi

# Step 5: Test basic image upload endpoint
echo -e "\n${YELLOW}📤 Step 5: Test Image Upload Endpoint${NC}"
UPLOAD_RESPONSE=$(curl -s -X POST "$BASE_URL/image-upload/uploads" \
  -F "image=@test-image.png")

echo "Image Upload Response: $UPLOAD_RESPONSE"

# Step 6: Test fetching all products
echo -e "\n${YELLOW}📋 Step 6: Fetch All Products${NC}"
PRODUCTS_RESPONSE=$(curl -s -X GET "$BASE_URL/products" \
  -H "Authorization: Bearer $JWT_TOKEN")

echo "All Products Response: $PRODUCTS_RESPONSE"

if echo "$PRODUCTS_RESPONSE" | grep -q "Test Product with Image"; then
    print_result 0 "Product found in products list"
else
    print_result 1 "Product not found in products list"
fi

# Step 7: Test fetching specific product with images
if [ ! -z "$PRODUCT_ID" ]; then
    echo -e "\n${YELLOW}🔍 Step 7: Fetch Specific Product with Images${NC}"
    SINGLE_PRODUCT_RESPONSE=$(curl -s -X GET "$BASE_URL/products/$PRODUCT_ID" \
      -H "Authorization: Bearer $JWT_TOKEN")
    
    echo "Single Product Response: $SINGLE_PRODUCT_RESPONSE"
    
    if echo "$SINGLE_PRODUCT_RESPONSE" | grep -q "images"; then
        print_result 0 "Product with images relationship found"
    else
        print_result 1 "Product images relationship not found"
    fi
fi

# Step 8: Test image serving endpoints
echo -e "\n${YELLOW}🖼️ Step 8: Test Image Serving Endpoints${NC}"

# Test different image serving routes
echo "Testing /products/img/$PRODUCT_ID..."
curl -s -I "$BASE_URL/products/img/$PRODUCT_ID" | head -1

echo "Testing /products/picture/$PRODUCT_ID..."
curl -s -I "$BASE_URL/products/picture/$PRODUCT_ID" | head -1

echo "Testing /products/product-image/$PRODUCT_ID..."
curl -s -I "$BASE_URL/products/product-image/$PRODUCT_ID" | head -1

# Step 9: Test creating another product without image
echo -e "\n${YELLOW}🛍️ Step 9: Create Product Without Image${NC}"
NO_IMAGE_PRODUCT_RESPONSE=$(curl -s -X POST "$BASE_URL/products/create" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Product No Image",
    "description": "This is a test product without image",
    "price": 49.99,
    "stockQuantity": 5,
    "category": "Books"
  }')

echo "Product Without Image Response: $NO_IMAGE_PRODUCT_RESPONSE"

if echo "$NO_IMAGE_PRODUCT_RESPONSE" | grep -q "Test Product No Image"; then
    print_result 0 "Product without image created successfully"
else
    print_result 1 "Product without image creation failed"
fi

# Step 10: Test seller's products endpoint
echo -e "\n${YELLOW}👤 Step 10: Test Seller's Products${NC}"
MY_PRODUCTS_RESPONSE=$(curl -s -X GET "$BASE_URL/products/my-products" \
  -H "Authorization: Bearer $JWT_TOKEN")

echo "My Products Response: $MY_PRODUCTS_RESPONSE"

if echo "$MY_PRODUCTS_RESPONSE" | grep -q "Test Product"; then
    print_result 0 "Seller's products retrieved successfully"
else
    print_result 1 "Failed to retrieve seller's products"
fi

# Step 11: Test search functionality
echo -e "\n${YELLOW}🔎 Step 11: Test Product Search${NC}"
SEARCH_RESPONSE=$(curl -s -X GET "$BASE_URL/products/search?query=Test" \
  -H "Authorization: Bearer $JWT_TOKEN")

echo "Search Response: $SEARCH_RESPONSE"

if echo "$SEARCH_RESPONSE" | grep -q "Test Product"; then
    print_result 0 "Product search working correctly"
else
    print_result 1 "Product search failed"
fi

# Clean up
echo -e "\n${YELLOW}🧹 Cleaning up test files...${NC}"
rm -f test-image.png
print_result 0 "Test image file cleaned up"

echo -e "\n${BLUE}📊 Test Summary Complete!${NC}"
echo "=================================================="
echo -e "${GREEN}✅ All product image routes have been tested${NC}"
echo -e "${YELLOW}💡 Check the responses above for detailed results${NC}"
