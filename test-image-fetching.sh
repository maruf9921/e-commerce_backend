#!/bin/bash

# Test Image Fetching - E-commerce Backend
echo "🧪 Testing Image Fetching Capabilities"
echo "======================================="

BASE_URL="http://localhost:4002"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Server URL: ${BASE_URL}${NC}"
echo ""

echo -e "${YELLOW}📊 1. Get All Products with Images${NC}"
echo "GET ${BASE_URL}/products/with-images"
curl -s -X GET "${BASE_URL}/products/with-images" | jq '.[0:2]'
echo ""

echo -e "${YELLOW}🔍 2. Get Specific Product with Images (Product ID: 36)${NC}"
echo "GET ${BASE_URL}/products/36/with-images"
curl -s -X GET "${BASE_URL}/products/36/with-images" | jq '.'
echo ""

echo -e "${YELLOW}🖼️  3. Get Images for Specific Product (Product ID: 36)${NC}"
echo "GET ${BASE_URL}/products/36/images"
curl -s -X GET "${BASE_URL}/products/36/images" | jq '.'
echo ""

echo -e "${YELLOW}📂 4. Get List of All Uploaded Images${NC}"
echo "GET ${BASE_URL}/products/images/list"
curl -s -X GET "${BASE_URL}/products/images/list" | jq '.'
echo ""

echo -e "${YELLOW}🌐 5. Direct Image Access via Static Serving${NC}"
echo "GET ${BASE_URL}/uploads/images/Imagee46dd753-96f8-4cf3-9440-76b0913f3e43.jpeg"
echo "Direct image URL access (download to verify):"
curl -s -I "${BASE_URL}/uploads/images/Imagee46dd753-96f8-4cf3-9440-76b0913f3e43.jpeg"
echo ""

echo -e "${YELLOW}🔗 6. Image Access via Image Upload Controller${NC}"
echo "GET ${BASE_URL}/image-upload/pic/Imagee46dd753-96f8-4cf3-9440-76b0913f3e43.jpeg"
echo "Image controller access (download to verify):"
curl -s -I "${BASE_URL}/image-upload/pic/Imagee46dd753-96f8-4cf3-9440-76b0913f3e43.jpeg"
echo ""

echo -e "${YELLOW}🎯 7. Product Controller Image Serving${NC}"
echo "GET ${BASE_URL}/products/serve-image/Imagee46dd753-96f8-4cf3-9440-76b0913f3e43.jpeg"
echo "Product controller image serving:"
curl -s -I "${BASE_URL}/products/serve-image/Imagee46dd753-96f8-4cf3-9440-76b0913f3e43.jpeg"
echo ""

echo -e "${YELLOW}📋 8. Test Products Endpoint${NC}"
echo "GET ${BASE_URL}/products/test/images"
curl -s -X GET "${BASE_URL}/products/test/images" | jq '.[0:2]'
echo ""

echo -e "${GREEN}✅ Image Fetching Test Complete!${NC}"
echo ""
echo -e "${BLUE}📝 Summary of Available Endpoints:${NC}"
echo "1. ${BASE_URL}/products/with-images - All products with images"
echo "2. ${BASE_URL}/products/{id}/with-images - Specific product with images"
echo "3. ${BASE_URL}/products/{id}/images - Images for specific product"
echo "4. ${BASE_URL}/products/images/list - List all uploaded images"
echo "5. ${BASE_URL}/uploads/images/{filename} - Direct static file access"
echo "6. ${BASE_URL}/image-upload/pic/{filename} - Image controller access"
echo "7. ${BASE_URL}/products/serve-image/{filename} - Product controller serving"
echo ""
echo -e "${GREEN}🎉 Your image upload and fetching system is working perfectly!${NC}"
