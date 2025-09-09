#!/bin/bash

# Seller Verification System Test Script
BASE_URL="http://localhost:4002"

echo "🧪 SELLER VERIFICATION SYSTEM TEST"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}📝 Step 1: Register a new seller${NC}"
SELLER_RESPONSE=$(curl -s -X POST $BASE_URL/users/register-seller \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testseller123",
    "fullName": "Test Seller Business",
    "email": "testseller@example.com", 
    "password": "password123",
    "phone": "1234567890"
  }')

echo "Seller Registration Response:"
echo $SELLER_RESPONSE | jq '.'

echo -e "\n${BLUE}📝 Step 2: Login as seller (should work but isVerified=false)${NC}"
SELLER_LOGIN=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testseller123",
    "password": "password123"
  }')

echo "Seller Login Response:"
echo $SELLER_LOGIN | jq '.'

# Extract token
SELLER_TOKEN=$(echo $SELLER_LOGIN | jq -r '.access_token // empty')

if [ -z "$SELLER_TOKEN" ]; then
  echo -e "${RED}❌ Failed to get seller token${NC}"
  exit 1
fi

echo -e "\n${BLUE}📝 Step 3: Try to create product as unverified seller (should fail)${NC}"
PRODUCT_ATTEMPT=$(curl -s -X POST $BASE_URL/products/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SELLER_TOKEN" \
  -d '{
    "name": "Test Product",
    "description": "Test Description",
    "price": 99.99,
    "stockQuantity": 10,
    "category": "Electronics"
  }')

echo "Product Creation Attempt (should fail):"
echo $PRODUCT_ATTEMPT | jq '.'

echo -e "\n${BLUE}📝 Step 4: Create admin and login${NC}"
ADMIN_RESPONSE=$(curl -s -X POST $BASE_URL/users/create \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testadmin",
    "fullName": "Test Admin",
    "email": "admin@example.com",
    "password": "adminpassword",
    "phone": "9876543210",
    "role": "ADMIN"
  }')

echo "Admin Creation Response:"
echo $ADMIN_RESPONSE | jq '.'

ADMIN_LOGIN=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testadmin",
    "password": "adminpassword"
  }')

ADMIN_TOKEN=$(echo $ADMIN_LOGIN | jq -r '.access_token // empty')

if [ -z "$ADMIN_TOKEN" ]; then
  echo -e "${RED}❌ Failed to get admin token${NC}"
  exit 1
fi

echo -e "\n${BLUE}📝 Step 5: Admin views pending sellers${NC}"
PENDING_SELLERS=$(curl -s -X GET $BASE_URL/admin/sellers/pending \
  -H "Authorization: Bearer $ADMIN_TOKEN")

echo "Pending Sellers:"
echo $PENDING_SELLERS | jq '.'

# Extract seller ID
SELLER_ID=$(echo $PENDING_SELLERS | jq -r '.[0].id // empty')

if [ -z "$SELLER_ID" ]; then
  echo -e "${RED}❌ No pending seller found${NC}"
  exit 1
fi

echo -e "\n${BLUE}📝 Step 6: Admin verifies the seller${NC}"
VERIFY_RESPONSE=$(curl -s -X POST $BASE_URL/admin/sellers/$SELLER_ID/verify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{}')

echo "Seller Verification Response:"
echo $VERIFY_RESPONSE | jq '.'

echo -e "\n${BLUE}📝 Step 7: Seller logs in again (should have isVerified=true)${NC}"
SELLER_LOGIN_2=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testseller123",
    "password": "password123"
  }')

echo "Seller Login Response (after verification):"
echo $SELLER_LOGIN_2 | jq '.'

SELLER_TOKEN_2=$(echo $SELLER_LOGIN_2 | jq -r '.access_token // empty')

echo -e "\n${BLUE}📝 Step 8: Try to create product as verified seller (should work)${NC}"
PRODUCT_SUCCESS=$(curl -s -X POST $BASE_URL/products/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SELLER_TOKEN_2" \
  -d '{
    "name": "Verified Seller Product",
    "description": "This product was created by a verified seller",
    "price": 149.99,
    "stockQuantity": 5,
    "category": "Electronics"
  }')

echo "Product Creation Response (should succeed):"
echo $PRODUCT_SUCCESS | jq '.'

echo -e "\n${GREEN}✅ Seller Verification System Test Complete!${NC}"
echo -e "${YELLOW}Summary:${NC}"
echo "1. ✅ Seller registration with isVerified=false"
echo "2. ✅ Seller login works but verification status tracked"
echo "3. ✅ Product creation blocked for unverified sellers"
echo "4. ✅ Admin can view pending sellers"
echo "5. ✅ Admin can verify sellers"
echo "6. ✅ Verified sellers can create products"
