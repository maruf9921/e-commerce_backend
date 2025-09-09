#!/bin/bash

echo "🧪 Testing isActive field fix..."

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get JWT token first
echo -e "${YELLOW}🔐 Getting JWT token...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:4002/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testseller",
    "password": "password123"
  }')

echo "Login Response: $LOGIN_RESPONSE"

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ Failed to get JWT token${NC}"
    exit 1
fi

echo -e "${GREEN}✅ JWT token obtained${NC}"

# Test 1: Create product with isActive=true
echo -e "\n${YELLOW}🧪 Test 1: Creating product with isActive='true'${NC}"
curl -s -X POST http://localhost:4002/products/create-with-image \
  -H "Authorization: Bearer $TOKEN" \
  -F "name=Test Active Product" \
  -F "description=Testing isActive field" \
  -F "price=99.99" \
  -F "stockQuantity=5" \
  -F "category=Test" \
  -F "isActive=true" \
  -F "file=@/home/dip-roy/e-commerce_project/e-commerce_backend/image/1755224860078-Screenshot from 2025-06-24 01-51-42.png" | jq .

# Test 2: Create product with isActive=false
echo -e "\n${YELLOW}🧪 Test 2: Creating product with isActive='false'${NC}"
curl -s -X POST http://localhost:4002/products/create-with-image \
  -H "Authorization: Bearer $TOKEN" \
  -F "name=Test Inactive Product" \
  -F "description=Testing isActive field false" \
  -F "price=79.99" \
  -F "stockQuantity=3" \
  -F "category=Test" \
  -F "isActive=false" \
  -F "file=@/home/dip-roy/e-commerce_project/e-commerce_backend/image/1755224860078-Screenshot from 2025-06-24 01-51-42.png" | jq .

# Test 3: Create product without isActive (should default to true)
echo -e "\n${YELLOW}🧪 Test 3: Creating product without isActive field (should default to true)${NC}"
curl -s -X POST http://localhost:4002/products/create-with-image \
  -H "Authorization: Bearer $TOKEN" \
  -F "name=Test Default Product" \
  -F "description=Testing default isActive behavior" \
  -F "price=89.99" \
  -F "stockQuantity=7" \
  -F "category=Test" \
  -F "file=@/home/dip-roy/e-commerce_project/e-commerce_backend/image/1755224860078-Screenshot from 2025-06-24 01-51-42.png" | jq .

echo -e "\n${GREEN}✅ Tests completed! Check the isActive values in the responses above.${NC}"
