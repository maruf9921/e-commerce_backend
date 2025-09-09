#!/bin/bash

echo "🧪 Testing Frontend-Backend User Registration Connection..."

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test data
TEST_USER_DATA='{
  "username": "testuser123",
  "email": "testuser123@example.com",
  "password": "testpassword123",
  "phone": "01234567890",
  "role": "USER"
}'

echo -e "${YELLOW}🔗 Testing Backend Endpoint: POST /users/create${NC}"
echo "📦 Test Data: $TEST_USER_DATA"

# Test backend endpoint
RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST http://localhost:4002/users/create \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "$TEST_USER_DATA")

# Extract HTTP status and body
HTTP_STATUS=$(echo $RESPONSE | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
RESPONSE_BODY=$(echo $RESPONSE | sed -E 's/HTTPSTATUS:[0-9]*$//')

echo -e "\n📊 Response Status: $HTTP_STATUS"
echo -e "📝 Response Body: $RESPONSE_BODY"

if [ "$HTTP_STATUS" = "201" ] || [ "$HTTP_STATUS" = "200" ]; then
    echo -e "\n${GREEN}✅ SUCCESS: User registration endpoint is working!${NC}"
    echo -e "${GREEN}✅ Frontend can now connect to this endpoint${NC}"
else
    echo -e "\n${RED}❌ FAILED: User registration endpoint returned status $HTTP_STATUS${NC}"
    echo -e "${RED}❌ Check server logs for details${NC}"
fi

echo -e "\n${YELLOW}📋 Frontend Connection Details:${NC}"
echo -e "   URL: http://localhost:4002/users/create"
echo -e "   Method: POST"
echo -e "   Headers: Content-Type: application/json"
echo -e "   Body: JSON with username, email, password, phone, role"

echo -e "\n${YELLOW}🔍 Check if backend server is running on http://localhost:4002${NC}"
echo -e "${YELLOW}🔍 Verify CORS is enabled in main.ts${NC}"
echo -e "${YELLOW}🔍 Frontend should now work with the updated Singup/page.tsx${NC}"
