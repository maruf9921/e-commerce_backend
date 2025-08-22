#!/bin/bash

echo "🏪 Quick Seller Test - Create, Login & Verify"
echo "============================================="

BASE_URL="http://localhost:3000"

# Generate unique test data
TIMESTAMP=$(date +%s)
ADMIN_USERNAME="quickadmin_$TIMESTAMP"
ADMIN_EMAIL="quickadmin_$TIMESTAMP@test.com"
SELLER_USERNAME="quickseller_$TIMESTAMP"
SELLER_PHONE="0177788$((TIMESTAMP % 1000))"

echo "🔐 Step 1: Create admin and get token..."

# Create admin
admin_reg=$(curl -s -X POST "$BASE_URL/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"$ADMIN_USERNAME\",\"email\":\"$ADMIN_EMAIL\",\"password\":\"Admin123!\",\"role\":\"ADMIN\"}")

# Login admin
admin_login=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"$ADMIN_USERNAME\",\"password\":\"Admin123!\"}")

ADMIN_TOKEN=$(echo $admin_login | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$ADMIN_TOKEN" ]; then
    echo "❌ Failed to get admin token"
    exit 1
fi

echo "✅ Admin token: ${ADMIN_TOKEN:0:20}..."

echo -e "\n🏪 Step 2: Create seller..."

# Create seller
seller_creation=$(curl -s -X POST "$BASE_URL/sellers/create" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d "{
        \"username\": \"$SELLER_USERNAME\",
        \"fullName\": \"Quick Test Seller $TIMESTAMP\",
        \"phone\": \"$SELLER_PHONE\",
        \"password\": \"Seller123!\"
    }")

echo "Seller creation response: $seller_creation"

SELLER_ID=$(echo $seller_creation | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ -z "$SELLER_ID" ]; then
    echo "❌ Failed to create seller"
    exit 1
fi

echo "✅ Seller created with ID: $SELLER_ID"

echo -e "\n🔑 Step 3: Test seller login..."

# Login seller
seller_login=$(curl -s -X POST "$BASE_URL/sellers/login" \
    -H "Content-Type: application/json" \
    -d "{
        \"username\": \"$SELLER_USERNAME\",
        \"password\": \"Seller123!\"
    }")

echo "Seller login response: $seller_login"

SELLER_TOKEN=$(echo $seller_login | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -n "$SELLER_TOKEN" ]; then
    echo "✅ Seller login successful!"
    echo "✅ Seller token: ${SELLER_TOKEN:0:20}..."
else
    echo "❌ Seller login failed"
fi

echo -e "\n🔍 Step 4: Verify seller data..."

# Get seller by ID
seller_data=$(curl -s -X GET "$BASE_URL/sellers/id/$SELLER_ID" \
    -H "Authorization: Bearer $ADMIN_TOKEN")

echo "Seller data: $seller_data"

# Check if seller is active
if echo "$seller_data" | grep -q "\"isActive\":true"; then
    echo "✅ Seller is active"
else
    echo "⚠️ Seller is not active"
fi

echo -e "\n🛍️ Step 5: Test product creation for seller..."

# Create product for seller
product_creation=$(curl -s -X POST "$BASE_URL/products/create" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d "{
        \"name\": \"Quick Test Product\",
        \"description\": \"Product for testing seller relationship\",
        \"price\": 99.99,
        \"sellerId\": \"$SELLER_ID\",
        \"isActive\": true
    }")

echo "Product creation: $product_creation"

if echo "$product_creation" | grep -q "\"id\""; then
    echo "✅ Product created successfully"
else
    echo "❌ Product creation failed"
fi

echo -e "\n📊 Step 6: Get seller's products..."

# Get products by seller
seller_products=$(curl -s -X GET "$BASE_URL/products/seller/$SELLER_ID" \
    -H "Authorization: Bearer $ADMIN_TOKEN")

echo "Seller's products: $seller_products"

echo -e "\n🎉 Quick Seller Test Completed!"
echo "==============================="
echo "📋 Test Results:"
echo "- Admin Username: $ADMIN_USERNAME"
echo "- Seller Username: $SELLER_USERNAME"
echo "- Seller ID: $SELLER_ID"
echo "- Seller Phone: $SELLER_PHONE"

if [ -n "$SELLER_TOKEN" ]; then
    echo "- Seller Login: ✅ SUCCESS"
else
    echo "- Seller Login: ❌ FAILED"
fi

echo ""
echo "🔗 Quick Commands to Continue Testing:"
echo ""
echo "# Get all sellers:"
echo "curl -X GET $BASE_URL/sellers/all -H \"Authorization: Bearer $ADMIN_TOKEN\""
echo ""
echo "# Get seller by username:"
echo "curl -X GET $BASE_URL/sellers/username/$SELLER_USERNAME -H \"Authorization: Bearer $ADMIN_TOKEN\""
echo ""
echo "# Create another product:"
echo "curl -X POST $BASE_URL/products/create \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -H \"Authorization: Bearer $ADMIN_TOKEN\" \\"
echo "  -d '{\"name\":\"Another Product\",\"description\":\"Test\",\"price\":149.99,\"sellerId\":\"$SELLER_ID\"}'"
echo ""
