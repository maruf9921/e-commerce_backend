#!/bin/bash

echo "🧪 Testing Seller Registration Console Logging"
echo "=============================================="
echo
echo "This script will test the seller registration endpoint"
echo "and show the console log output from the backend."
echo
echo "Make sure the backend server is running on port 4002"
echo

# Generate unique seller data
TIMESTAMP=$(date +%s)
USERNAME="testseller_${TIMESTAMP}"
EMAIL="testseller_${TIMESTAMP}@example.com"

echo "📝 Registering new seller with data:"
echo "   Username: $USERNAME"
echo "   Email: $EMAIL"
echo "   Phone: 01888888888"
echo "   Role: seller"
echo

echo "🚀 Sending registration request..."
echo

curl -X POST http://localhost:4002/users/register-seller \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"$USERNAME\",
    \"email\": \"$EMAIL\",
    \"password\": \"password123a\",
    \"phone\": \"01888888888\",
    \"role\": \"seller\"
  }"

echo
echo
echo "✅ Registration request completed!"
echo "📺 Check the backend server console for the detailed"
echo "    success message with account creation details."
echo
echo "The console should show:"
echo "   🎉 SELLER ACCOUNT CREATED SUCCESSFULLY! 🎉"
echo "   📋 Account details including username, email, seller ID"
echo "   ⏳ Status: PENDING ADMIN VERIFICATION"
echo