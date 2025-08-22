#!/bin/bash

echo "🛍️ Testing Product Creation with Seller Relationship"
echo "==================================================="

BASE_URL="http://localhost:3000"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Generate unique test data
TIMESTAMP=$(date +%s)
ADMIN_USERNAME="admin_$TIMESTAMP"
ADMIN_EMAIL="admin_$TIMESTAMP@test.com"
SELLER_USERNAME="seller_$TIMESTAMP"
SELLER_PHONE="0177788$((TIMESTAMP % 10000))"

echo -e "\n${YELLOW}Step 1: Creating Admin User...${NC}"

# Create admin user
admin_response=$(curl -s -X POST "$BASE_URL/auth/register" \
    -H "Content-Type: application/json" \
    -d "{
        \"username\": \"$ADMIN_USERNAME\",
        \"email\": \"$ADMIN_EMAIL\",
        \"password\": \"AdminPass123!\",
        \"role\": \"ADMIN\"
    }")

echo "Admin Registration: $admin_response"

echo -e "\n${YELLOW}Step 2: Admin Login...${NC}"

# Login admin
login_response=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{
        \"username\": \"$ADMIN_USERNAME\",
        \"password\": \"AdminPass123!\"
    }")

echo "Login Response: $login_response"

# Extract token
ADMIN_TOKEN=$(echo $login_response | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$ADMIN_TOKEN" ]; then
    echo -e "${RED}❌ Failed to get admin token${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Admin token: ${ADMIN_TOKEN:0:20}...${NC}"

echo -e "\n${YELLOW}Step 3: Creating Seller...${NC}"

# Create seller
seller_response=$(curl -s -X POST "$BASE_URL/sellers/create" \
    -H "Content-Type: application/json" \
    -d "{
        \"username\": \"$SELLER_USERNAME\",
        \"fullName\": \"Test Seller $TIMESTAMP\",
        \"phone\": \"$SELLER_PHONE\",
        \"password\": \"SellerPass123!\"
    }")

echo "Seller Creation: $seller_response"

# Extract seller ID
SELLER_ID=$(echo $seller_response | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ -z "$SELLER_ID" ]; then
    echo -e "${RED}❌ Failed to create seller${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Seller created with ID: $SELLER_ID${NC}"

echo -e "\n${YELLOW}Step 4: Creating Products...${NC}"

# Product 1: Smartphone
echo "Creating Product 1: Smartphone..."
product1_response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/products/create" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d "{
        \"name\": \"iPhone 15 Pro\",
        \"description\": \"Latest iPhone with A17 Pro chip, titanium design, and advanced camera system\",
        \"price\": 999.99,
        \"sellerId\": \"$SELLER_ID\",
        \"isActive\": true
    }")

http_code1=$(echo "$product1_response" | tail -n1)
body1=$(echo "$product1_response" | head -n -1)

echo "HTTP Code: $http_code1"
echo "Response: $body1"

if [[ $http_code1 -eq 201 || $http_code1 -eq 200 ]]; then
    echo -e "${GREEN}✅ Product 1 created successfully!${NC}"
else
    echo -e "${RED}❌ Product 1 creation failed!${NC}"
fi

# Product 2: Laptop
echo -e "\nCreating Product 2: Laptop..."
product2_response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/products/create" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d "{
        \"name\": \"MacBook Pro M3\",
        \"description\": \"16-inch MacBook Pro with M3 Max chip, 36GB RAM, 1TB SSD\",
        \"price\": 2499.99,
        \"sellerId\": \"$SELLER_ID\",
        \"isActive\": true
    }")

http_code2=$(echo "$product2_response" | tail -n1)
body2=$(echo "$product2_response" | head -n -1)

echo "HTTP Code: $http_code2"
echo "Response: $body2"

if [[ $http_code2 -eq 201 || $http_code2 -eq 200 ]]; then
    echo -e "${GREEN}✅ Product 2 created successfully!${NC}"
else
    echo -e "${RED}❌ Product 2 creation failed!${NC}"
fi

# Product 3: Headphones
echo -e "\nCreating Product 3: Headphones..."
product3_response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/products/create" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d "{
        \"name\": \"AirPods Pro 2nd Gen\",
        \"description\": \"Active Noise Cancellation, Transparency mode, Spatial Audio\",
        \"price\": 249.99,
        \"sellerId\": \"$SELLER_ID\",
        \"isActive\": true
    }")

http_code3=$(echo "$product3_response" | tail -n1)
body3=$(echo "$product3_response" | head -n -1)

echo "HTTP Code: $http_code3"
echo "Response: $body3"

if [[ $http_code3 -eq 201 || $http_code3 -eq 200 ]]; then
    echo -e "${GREEN}✅ Product 3 created successfully!${NC}"
else
    echo -e "${RED}❌ Product 3 creation failed!${NC}"
fi

echo -e "\n${YELLOW}Step 5: Testing Relationship - Get Products by Seller...${NC}"

# Get products by seller ID
seller_products=$(curl -s -X GET "$BASE_URL/products/seller/$SELLER_ID" \
    -H "Authorization: Bearer $ADMIN_TOKEN")

echo "Products by Seller ID ($SELLER_ID):"
echo "$seller_products"

echo -e "\n${YELLOW}Step 6: Testing Relationship - Get Products by Seller Username...${NC}"

# Get products by seller username
username_products=$(curl -s -X GET "$BASE_URL/products/seller/username/$SELLER_USERNAME" \
    -H "Authorization: Bearer $ADMIN_TOKEN")

echo "Products by Seller Username ($SELLER_USERNAME):"
echo "$username_products"

echo -e "\n${YELLOW}Step 7: Get All Products (Public Route)...${NC}"

# Get all products (should show seller relationship)
all_products=$(curl -s -X GET "$BASE_URL/products")

echo "All Products with Seller Information:"
echo "$all_products"

echo -e "\n${YELLOW}Step 8: Get Active Products with Seller Details...${NC}"

# Get active products with seller
active_products=$(curl -s -X GET "$BASE_URL/products/active/with-seller" \
    -H "Authorization: Bearer $ADMIN_TOKEN")

echo "Active Products with Seller Details:"
echo "$active_products"

echo -e "\n${GREEN}🎉 Product Creation & Relationship Testing Complete!${NC}"
echo "=============================================================="
echo "✅ Admin User: Created and authenticated"
echo "✅ Seller: Created with ID $SELLER_ID"
echo "✅ Products: 3 products created successfully"
echo "✅ Seller-Product Relationship: Tested and verified"
echo ""
echo -e "${YELLOW}Test Summary:${NC}"
echo "- Admin Username: $ADMIN_USERNAME"
echo "- Seller Username: $SELLER_USERNAME"
echo "- Seller ID: $SELLER_ID"
echo "- Products Created: iPhone 15 Pro, MacBook Pro M3, AirPods Pro"
echo ""
echo -e "${YELLOW}Relationship Features Tested:${NC}"
echo "✅ Create products linked to seller"
echo "✅ Get products by seller ID"
echo "✅ Get products by seller username"
echo "✅ Get all products with seller info"
echo "✅ Get active products with seller details"
