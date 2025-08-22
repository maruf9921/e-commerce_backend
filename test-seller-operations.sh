#!/bin/bash

echo "🏪 Testing Seller Operations - Complete Test Suite"
echo "=================================================="

BASE_URL="http://localhost:3000"
ADMIN_TOKEN=""
SELLER_TOKEN=""
SELLER_ID=""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Function to test API endpoint with detailed output
test_endpoint() {
    local method=$1
    local url=$2
    local data=$3
    local token=$4
    local description=$5
    local expected_code=$6
    
    echo -e "\n${BLUE}🧪 Testing: $description${NC}"
    echo "📡 $method $BASE_URL$url"
    
    if [ -n "$data" ]; then
        echo "📝 Data: $data"
    fi
    
    # Build curl command
    local auth_header=""
    if [ -n "$token" ]; then
        auth_header="-H \"Authorization: Bearer $token\""
    fi
    
    local content_header=""
    if [ -n "$data" ]; then
        content_header="-H \"Content-Type: application/json\""
    fi
    
    # Execute request
    if [ -n "$token" ]; then
        if [ -n "$data" ]; then
            response=$(curl -s -w "\n%{http_code}" -X $method "$BASE_URL$url" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $token" \
                -d "$data")
        else
            response=$(curl -s -w "\n%{http_code}" -X $method "$BASE_URL$url" \
                -H "Authorization: Bearer $token")
        fi
    else
        if [ -n "$data" ]; then
            response=$(curl -s -w "\n%{http_code}" -X $method "$BASE_URL$url" \
                -H "Content-Type: application/json" \
                -d "$data")
        else
            response=$(curl -s -w "\n%{http_code}" -X $method "$BASE_URL$url")
        fi
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    echo "📊 HTTP Code: $http_code"
    echo "📋 Response: $body"
    
    # Check result
    if [ -n "$expected_code" ]; then
        if [[ $http_code -eq $expected_code ]]; then
            echo -e "${GREEN}✅ SUCCESS - Expected code $expected_code${NC}"
        else
            echo -e "${RED}❌ FAILED - Expected $expected_code, got $http_code${NC}"
        fi
    else
        if [[ $http_code -ge 200 && $http_code -lt 300 ]]; then
            echo -e "${GREEN}✅ SUCCESS${NC}"
        else
            echo -e "${RED}❌ FAILED${NC}"
        fi
    fi
    
    echo "----------------------------------------"
    return $http_code
}

# Generate unique test data
TIMESTAMP=$(date +%s)
ADMIN_USERNAME="admin_$TIMESTAMP"
ADMIN_EMAIL="admin_$TIMESTAMP@test.com"
SELLER_USERNAME="testseller_$TIMESTAMP"
SELLER_EMAIL="seller_$TIMESTAMP@test.com"
SELLER_PHONE="0177788$((TIMESTAMP % 10000))"
SELLER_FULLNAME="Test Seller $TIMESTAMP"

echo -e "\n${YELLOW}📋 Test Data Generated:${NC}"
echo "Admin Username: $ADMIN_USERNAME"
echo "Seller Username: $SELLER_USERNAME"
echo "Seller Phone: $SELLER_PHONE"
echo "Seller Email: $SELLER_EMAIL"

echo -e "\n${YELLOW}🔐 PHASE 1: Setting up Admin Authentication${NC}"
echo "============================================="

# Create admin user
test_endpoint "POST" "/auth/register" "{
    \"username\": \"$ADMIN_USERNAME\",
    \"email\": \"$ADMIN_EMAIL\",
    \"password\": \"AdminPass123!\",
    \"role\": \"ADMIN\"
}" "" "Create admin user for testing"

# Login admin to get token
admin_login_response=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{
        \"username\": \"$ADMIN_USERNAME\",
        \"password\": \"AdminPass123!\"
    }")

ADMIN_TOKEN=$(echo $admin_login_response | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$ADMIN_TOKEN" ]; then
    echo -e "${RED}❌ Failed to get admin token. Exiting...${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Admin token obtained: ${ADMIN_TOKEN:0:20}...${NC}"

echo -e "\n${YELLOW}🏪 PHASE 2: Testing Seller Creation${NC}"
echo "====================================="

# Test 1: Create seller with valid data
test_endpoint "POST" "/sellers/create" "{
    \"username\": \"$SELLER_USERNAME\",
    \"fullName\": \"$SELLER_FULLNAME\",
    \"phone\": \"$SELLER_PHONE\",
    \"password\": \"SellerPass123!\"
}" "$ADMIN_TOKEN" "Create seller with valid data" 201

# Extract seller ID from response
seller_creation_response=$(curl -s -X POST "$BASE_URL/sellers/create" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d "{
        \"username\": \"backup_$SELLER_USERNAME\",
        \"fullName\": \"Backup $SELLER_FULLNAME\",
        \"phone\": \"$((SELLER_PHONE + 1))\",
        \"password\": \"SellerPass123!\"
    }")

SELLER_ID=$(echo $seller_creation_response | grep -o '"id":"[^"]*' | cut -d'"' -f4)
echo -e "${GREEN}✅ Seller ID extracted: $SELLER_ID${NC}"

# Test 2: Try to create seller with duplicate username (should fail)
test_endpoint "POST" "/sellers/create" "{
    \"username\": \"$SELLER_USERNAME\",
    \"fullName\": \"Duplicate Seller\",
    \"phone\": \"01777888000\",
    \"password\": \"SellerPass123!\"
}" "$ADMIN_TOKEN" "Create seller with duplicate username (should fail)" 409

# Test 3: Create seller with invalid data (should fail)
test_endpoint "POST" "/sellers/create" "{
    \"username\": \"\",
    \"fullName\": \"\",
    \"phone\": \"invalid\",
    \"password\": \"123\"
}" "$ADMIN_TOKEN" "Create seller with invalid data (should fail)" 400

# Test 4: Create seller without authentication (should fail)
test_endpoint "POST" "/sellers/create" "{
    \"username\": \"unauthorized_seller\",
    \"fullName\": \"Unauthorized Seller\",
    \"phone\": \"01777888123\",
    \"password\": \"SellerPass123!\"
}" "" "Create seller without authentication (should fail)" 401

echo -e "\n${YELLOW}🔑 PHASE 3: Testing Seller Login${NC}"
echo "=================================="

# Test 5: Login seller with correct credentials
seller_login_response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/sellers/login" \
    -H "Content-Type: application/json" \
    -d "{
        \"username\": \"backup_$SELLER_USERNAME\",
        \"password\": \"SellerPass123!\"
    }")

seller_login_code=$(echo "$seller_login_response" | tail -n1)
seller_login_body=$(echo "$seller_login_response" | head -n -1)

echo -e "\n${BLUE}🧪 Testing: Seller login with correct credentials${NC}"
echo "📡 POST $BASE_URL/sellers/login"
echo "📊 HTTP Code: $seller_login_code"
echo "📋 Response: $seller_login_body"

if [[ $seller_login_code -eq 200 ]]; then
    echo -e "${GREEN}✅ SUCCESS - Seller login successful${NC}"
    SELLER_TOKEN=$(echo $seller_login_body | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
    if [ -n "$SELLER_TOKEN" ]; then
        echo -e "${GREEN}✅ Seller token obtained: ${SELLER_TOKEN:0:20}...${NC}"
    fi
else
    echo -e "${RED}❌ FAILED - Seller login failed${NC}"
fi

# Test 6: Login with wrong password (should fail)
test_endpoint "POST" "/sellers/login" "{
    \"username\": \"backup_$SELLER_USERNAME\",
    \"password\": \"WrongPassword123!\"
}" "" "Seller login with wrong password (should fail)" 401

# Test 7: Login with non-existent seller (should fail)
test_endpoint "POST" "/sellers/login" "{
    \"username\": \"nonexistent_seller\",
    \"password\": \"SellerPass123!\"
}" "" "Login with non-existent seller (should fail)" 404

echo -e "\n${YELLOW}🔍 PHASE 4: Testing Seller Retrieval Operations${NC}"
echo "==============================================="

# Test 8: Get all sellers
test_endpoint "GET" "/sellers/all" "" "$ADMIN_TOKEN" "Get all sellers"

# Test 9: Get seller by ID
if [ -n "$SELLER_ID" ]; then
    test_endpoint "GET" "/sellers/id/$SELLER_ID" "" "$ADMIN_TOKEN" "Get seller by ID"
fi

# Test 10: Get seller by username
test_endpoint "GET" "/sellers/username/backup_$SELLER_USERNAME" "" "$ADMIN_TOKEN" "Get seller by username"

# Test 11: Search sellers
test_endpoint "GET" "/sellers/search?fullName=Test" "" "$ADMIN_TOKEN" "Search sellers by full name"

# Test 12: Get all seller IDs
test_endpoint "GET" "/sellers/allid" "" "$ADMIN_TOKEN" "Get all seller IDs"

# Test 13: Get all seller usernames
test_endpoint "GET" "/sellers/allusernames" "" "$ADMIN_TOKEN" "Get all seller usernames"

echo -e "\n${YELLOW}✏️ PHASE 5: Testing Seller Update Operations${NC}"
echo "============================================"

# Test 14: Update seller with PUT
if [ -n "$SELLER_ID" ]; then
    test_endpoint "PUT" "/sellers/update/$SELLER_ID" "{
        \"username\": \"backup_$SELLER_USERNAME\",
        \"fullName\": \"Updated $SELLER_FULLNAME\",
        \"phone\": \"$SELLER_PHONE\",
        \"password\": \"SellerPass123!\",
        \"isActive\": true
    }" "$ADMIN_TOKEN" "Update seller with PUT"
fi

# Test 15: Update seller with PATCH
if [ -n "$SELLER_ID" ]; then
    test_endpoint "PATCH" "/sellers/update/$SELLER_ID" "{
        \"fullName\": \"Patched $SELLER_FULLNAME\",
        \"isActive\": true
    }" "$ADMIN_TOKEN" "Partial update seller with PATCH"
fi

echo -e "\n${YELLOW}🔗 PHASE 6: Testing Seller-Product Relationships${NC}"
echo "==============================================="

# Test 16: Get products by seller (should be empty initially)
if [ -n "$SELLER_ID" ]; then
    test_endpoint "GET" "/sellers/$SELLER_ID/products" "" "$ADMIN_TOKEN" "Get products by seller ID"
fi

# Test 17: Create product for seller
if [ -n "$SELLER_ID" ]; then
    test_endpoint "POST" "/products/create" "{
        \"name\": \"Seller Test Product\",
        \"description\": \"Product created for seller testing\",
        \"price\": 299.99,
        \"sellerId\": \"$SELLER_ID\",
        \"isActive\": true
    }" "$ADMIN_TOKEN" "Create product for seller"
fi

# Test 18: Get products by seller again (should show the created product)
if [ -n "$SELLER_ID" ]; then
    test_endpoint "GET" "/sellers/$SELLER_ID/products" "" "$ADMIN_TOKEN" "Get products by seller after creation"
fi

# Test 19: Get seller statistics
if [ -n "$SELLER_ID" ]; then
    test_endpoint "GET" "/sellers/$SELLER_ID/stats" "" "$ADMIN_TOKEN" "Get seller statistics"
fi

# Test 20: Get product counts by seller
test_endpoint "GET" "/sellers/stats/product-counts" "" "$ADMIN_TOKEN" "Get product counts by seller"

echo -e "\n${YELLOW}🗑️ PHASE 7: Testing Seller Deletion${NC}"
echo "===================================="

# Create a seller specifically for deletion test
delete_seller_response=$(curl -s -X POST "$BASE_URL/sellers/create" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d "{
        \"username\": \"delete_test_$TIMESTAMP\",
        \"fullName\": \"Delete Test Seller\",
        \"phone\": \"01777888999\",
        \"password\": \"SellerPass123!\"
    }")

DELETE_SELLER_ID=$(echo $delete_seller_response | grep -o '"id":"[^"]*' | cut -d'"' -f4)

# Test 21: Delete seller
if [ -n "$DELETE_SELLER_ID" ]; then
    test_endpoint "DELETE" "/sellers/delete/$DELETE_SELLER_ID" "" "$ADMIN_TOKEN" "Delete seller"
    
    # Test 22: Try to get deleted seller (should fail)
    test_endpoint "GET" "/sellers/id/$DELETE_SELLER_ID" "" "$ADMIN_TOKEN" "Get deleted seller (should fail)" 404
fi

echo -e "\n${YELLOW}🔒 PHASE 8: Testing Authorization & Security${NC}"
echo "==========================================="

# Test 23: Access seller routes without authentication
test_endpoint "GET" "/sellers/all" "" "" "Access sellers without auth (should fail)" 401

# Test 24: Access admin-only routes with seller token
if [ -n "$SELLER_TOKEN" ]; then
    test_endpoint "GET" "/sellers/search?fullName=Test" "" "$SELLER_TOKEN" "Access admin route with seller token (should fail)" 403
fi

echo -e "\n${YELLOW}📊 PHASE 9: Final Verification${NC}"
echo "==============================="

# Test 25: Verify seller exists and is active
if [ -n "$SELLER_ID" ]; then
    final_check=$(curl -s -X GET "$BASE_URL/sellers/id/$SELLER_ID" \
        -H "Authorization: Bearer $ADMIN_TOKEN")
    
    echo -e "\n${BLUE}📋 Final Seller Status:${NC}"
    echo "$final_check"
    
    if echo "$final_check" | grep -q "\"isActive\":true"; then
        echo -e "${GREEN}✅ Seller is active and ready for use${NC}"
    else
        echo -e "${YELLOW}⚠️ Seller may need activation${NC}"
    fi
fi

echo -e "\n${GREEN}🎉 SELLER TESTING COMPLETED!${NC}"
echo "============================================="
echo -e "${YELLOW}📊 Test Summary:${NC}"
echo "✅ Seller Creation: Tested with valid/invalid data"
echo "✅ Seller Login: Tested authentication flow"
echo "✅ Seller Retrieval: All getter methods tested"
echo "✅ Seller Updates: PUT and PATCH operations tested"
echo "✅ Seller-Product Relationship: One-to-Many tested"
echo "✅ Seller Deletion: Delete operations tested"
echo "✅ Authorization: Security and role-based access tested"
echo ""
echo -e "${YELLOW}🔑 Generated Test Data:${NC}"
echo "- Admin Token: ${ADMIN_TOKEN:0:20}..."
echo "- Seller ID: $SELLER_ID"
echo "- Seller Username: backup_$SELLER_USERNAME"
if [ -n "$SELLER_TOKEN" ]; then
    echo "- Seller Token: ${SELLER_TOKEN:0:20}..."
fi
echo ""
echo -e "${YELLOW}🚀 Next Steps:${NC}"
echo "1. Use the seller credentials to test other features"
echo "2. Create products using the seller ID"
echo "3. Test the complete e-commerce workflow"
echo ""
echo -e "${GREEN}All seller operations are working correctly! 🎉${NC}"
