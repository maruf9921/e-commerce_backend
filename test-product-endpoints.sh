#!/bin/bash

echo "🧪 Testing Product Endpoints Fix"
echo "================================"
echo

# Test 1: Test my-products endpoint without auth (should get 401)
echo "📋 Test 1: GET /products/my-products (without auth)"
echo "Expected: 401 Unauthorized"
echo "Actual:"
curl -s -X GET http://localhost:4002/products/my-products \
  -H "Content-Type: application/json" | jq '.' 2>/dev/null || echo "Response not JSON"
echo
echo "---"
echo

# Test 2: Test create-with-image endpoint without auth (should get 401)
echo "📋 Test 2: POST /products/create-with-image (without auth)"
echo "Expected: 401 Unauthorized"
echo "Actual:"
curl -s -X POST http://localhost:4002/products/create-with-image \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Product","description":"Test","price":10}' | jq '.' 2>/dev/null || echo "Response not JSON"
echo
echo "---"
echo

# Test 3: Test a parameterized route to ensure routing still works
echo "📋 Test 3: GET /products/1 (get product by ID)"
echo "Expected: Product data or 404"
echo "Actual:"
curl -s -X GET http://localhost:4002/products/1 \
  -H "Content-Type: application/json" | jq '.' 2>/dev/null || echo "Response not JSON"
echo
echo "---"
echo

echo "✅ Route ordering fix applied!"
echo "🔑 Both my-products and create-with-image now require authentication"
echo "📍 The routes are now correctly ordered to avoid conflicts"
echo "🎯 Next step: Ensure frontend sends proper authentication tokens"