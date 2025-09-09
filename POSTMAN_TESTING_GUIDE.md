# Complete Postman Testing Guide for Seller Verification System

## Prerequisites
1. **Backend Server**: Running on `http://localhost:4002`
2. **Database**: PostgreSQL with the updated schema (including `isVerified` column)
3. **Postman**: Installed and ready to use

## Testing Flow Overview
```
1. Register Admin → 2. Login Admin → 3. Register Seller → 4. Admin Verifies Seller → 5. Login Seller → 6. Test Protected Endpoints
```

---

## Step 1: Setup Postman Environment

### Create New Environment
1. Open Postman
2. Click on "Environments" → "Create Environment"
3. Name: `E-Commerce API`
4. Add these variables:

| Variable | Initial Value | Current Value |
|----------|---------------|---------------|
| `baseURL` | `http://localhost:4002` | `http://localhost:4002` |
| `adminToken` | | |
| `sellerToken` | | |
| `userId` | | |
| `sellerId` | | |

---

## Step 2: Register an Admin User

### Request Details
- **Method**: `POST`
- **URL**: `{{baseURL}}/auth/register`
- **Headers**: 
  ```
  Content-Type: application/json
  ```
- **Body** (raw JSON):
  ```json
  {
    "username": "admin123",
    "email": "admin@example.com",
    "password": "Admin@123",
    "phone": "1234567890",
    "fullName": "System Administrator",
    "role": "ADMIN"
  }
  ```

### Expected Response (201):
```json
{
  "id": 1,
  "username": "admin123",
  "email": "admin@example.com",
  "phone": "1234567890",
  "fullName": "System Administrator",
  "role": "ADMIN",
  "isActive": true,
  "isVerified": true,
  "createdAt": "2025-09-09T04:01:00.000Z",
  "updatedAt": "2025-09-09T04:01:00.000Z"
}
```

---

## Step 3: Admin Login

### Request Details
- **Method**: `POST`
- **URL**: `{{baseURL}}/auth/login`
- **Headers**: 
  ```
  Content-Type: application/json
  ```
- **Body** (raw JSON):
  ```json
  {
    "username": "admin123",
    "password": "Admin@123"
  }
  ```

### Expected Response (200):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin123",
    "email": "admin@example.com",
    "role": "ADMIN",
    "isActive": true,
    "isVerified": true
  },
  "tokenType": "Bearer",
  "expiresIn": "1h"
}
```

### Save Token to Environment
1. Go to "Tests" tab in this request
2. Add this script:
```javascript
if (pm.response.code === 200) {
    const responseJson = pm.response.json();
    pm.environment.set("adminToken", responseJson.access_token);
    pm.environment.set("userId", responseJson.user.id);
}
```

---

## Step 4: Register a Seller (Pending Verification)

### Request Details
- **Method**: `POST`
- **URL**: `{{baseURL}}/users/register-seller`
- **Headers**: 
  ```
  Content-Type: application/json
  ```
- **Body** (raw JSON):
  ```json
  {
    "username": "seller123",
    "email": "seller@example.com",
    "password": "Seller@123",
    "phone": "9876543210",
    "fullName": "John Seller"
  }
  ```

### Expected Response (201):
```json
{
  "message": "Seller registration successful. Your account is pending admin verification.",
  "user": {
    "id": 2,
    "username": "seller123",
    "email": "seller@example.com",
    "phone": "9876543210",
    "fullName": "John Seller",
    "sellerId": "SELLER_1725847260123_456",
    "role": "SELLER",
    "isActive": true,
    "isVerified": false,
    "createdAt": "2025-09-09T04:01:00.000Z",
    "updatedAt": "2025-09-09T04:01:00.000Z"
  }
}
```

### Save Seller ID
1. Add to "Tests" tab:
```javascript
if (pm.response.code === 201) {
    const responseJson = pm.response.json();
    pm.environment.set("sellerId", responseJson.user.id);
}
```

---

## Step 5: Admin Views Pending Sellers

### Request Details
- **Method**: `GET`
- **URL**: `{{baseURL}}/admin/sellers/pending`
- **Headers**: 
  ```
  Authorization: Bearer {{adminToken}}
  ```

### Expected Response (200):
```json
[
  {
    "id": 2,
    "username": "seller123",
    "email": "seller@example.com",
    "phone": "9876543210",
    "fullName": "John Seller",
    "sellerId": "SELLER_1725847260123_456",
    "role": "SELLER",
    "isVerified": false,
    "createdAt": "2025-09-09T04:01:00.000Z"
  }
]
```

---

## Step 6: Admin Verifies the Seller

### Request Details
- **Method**: `PATCH`
- **URL**: `{{baseURL}}/admin/sellers/{{sellerId}}/verify`
- **Headers**: 
  ```
  Authorization: Bearer {{adminToken}}
  Content-Type: application/json
  ```

### Expected Response (200):
```json
{
  "message": "Seller 'seller123' has been successfully verified",
  "seller": {
    "id": 2,
    "username": "seller123",
    "email": "seller@example.com",
    "phone": "9876543210",
    "fullName": "John Seller",
    "sellerId": "SELLER_1725847260123_456",
    "role": "SELLER",
    "isActive": true,
    "isVerified": true,
    "createdAt": "2025-09-09T04:01:00.000Z",
    "updatedAt": "2025-09-09T04:01:10.000Z"
  }
}
```

---

## Step 7: Seller Login (Now Verified)

### Request Details
- **Method**: `POST`
- **URL**: `{{baseURL}}/auth/login`
- **Headers**: 
  ```
  Content-Type: application/json
  ```
- **Body** (raw JSON):
  ```json
  {
    "username": "seller123",
    "password": "Seller@123"
  }
  ```

### Expected Response (200):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 2,
    "username": "seller123",
    "email": "seller@example.com",
    "role": "SELLER",
    "isActive": true,
    "isVerified": true
  },
  "tokenType": "Bearer",
  "expiresIn": "1h"
}
```

### Save Seller Token
1. Add to "Tests" tab:
```javascript
if (pm.response.code === 200) {
    const responseJson = pm.response.json();
    pm.environment.set("sellerToken", responseJson.access_token);
}
```

---

## Step 8: Test Protected Seller Endpoint (Create Product)

### Request Details
- **Method**: `POST`
- **URL**: `{{baseURL}}/products`
- **Headers**: 
  ```
  Authorization: Bearer {{sellerToken}}
  Content-Type: application/json
  ```
- **Body** (raw JSON):
  ```json
  {
    "name": "Test Product",
    "description": "This is a test product",
    "price": 99.99,
    "quantity": 10,
    "category": "Electronics"
  }
  ```

### Expected Response (201):
```json
{
  "id": 1,
  "name": "Test Product",
  "description": "This is a test product",
  "price": 99.99,
  "quantity": 10,
  "category": "Electronics",
  "sellerId": 2,
  "isActive": true,
  "createdAt": "2025-09-09T04:01:20.000Z",
  "updatedAt": "2025-09-09T04:01:20.000Z"
}
```

---

## Step 9: Test Unverified Seller Protection

### Register Another Seller (Don't Verify)
- **Method**: `POST`
- **URL**: `{{baseURL}}/users/register-seller`
- **Body**:
  ```json
  {
    "username": "unverified_seller",
    "email": "unverified@example.com",
    "password": "Test@123",
    "phone": "5555555555",
    "fullName": "Unverified Seller"
  }
  ```

### Login Unverified Seller
- **Method**: `POST`
- **URL**: `{{baseURL}}/auth/login`
- **Body**:
  ```json
  {
    "username": "unverified_seller",
    "password": "Test@123"
  }
  ```

### Try to Create Product (Should Fail)
- **Method**: `POST`
- **URL**: `{{baseURL}}/products`
- **Headers**: 
  ```
  Authorization: Bearer {{unverifiedSellerToken}}
  Content-Type: application/json
  ```
- **Body**: Same as Step 8

### Expected Response (403):
```json
{
  "statusCode": 403,
  "message": "Your seller account is pending verification. Please wait for admin approval.",
  "error": "Forbidden"
}
```

---

## Step 10: Admin Rejects a Seller

### Request Details
- **Method**: `DELETE`
- **URL**: `{{baseURL}}/admin/sellers/{{sellerId}}/reject`
- **Headers**: 
  ```
  Authorization: Bearer {{adminToken}}
  Content-Type: application/json
  ```
- **Body** (raw JSON):
  ```json
  {
    "deleteAccount": false
  }
  ```

### Expected Response (200):
```json
{
  "message": "Seller 'unverified_seller' has been deactivated"
}
```

---

## Common Error Scenarios to Test

### 1. Missing Authorization Header
**Expected Response (401)**:
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 2. Invalid Token
**Expected Response (401)**:
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 3. Non-Admin Trying Admin Endpoints
**Expected Response (403)**:
```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

### 4. Seller Trying Admin Endpoints
**Expected Response (403)**:
```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

---

## Additional Test Endpoints

### View All Verified Sellers (Admin Only)
- **Method**: `GET`
- **URL**: `{{baseURL}}/admin/sellers/verified`
- **Headers**: `Authorization: Bearer {{adminToken}}`

### Get All Users (Admin Only)
- **Method**: `GET`
- **URL**: `{{baseURL}}/users`
- **Headers**: `Authorization: Bearer {{adminToken}}`

### Get User Profile
- **Method**: `GET`
- **URL**: `{{baseURL}}/users/{{userId}}`
- **Headers**: `Authorization: Bearer {{sellerToken}}` or `{{adminToken}}`

---

## Pro Tips for Postman Testing

1. **Use Environment Variables**: Store tokens and IDs in environment variables for easy reuse
2. **Test Scripts**: Use the "Tests" tab to automatically save response data
3. **Collections**: Organize requests into collections for better management
4. **Pre-request Scripts**: Use for dynamic data generation
5. **Documentation**: Use Postman's documentation feature to share with team

## Troubleshooting

### Server Not Responding
- Check if backend is running on port 4002
- Verify database connection
- Check server logs for errors

### Authentication Issues
- Ensure token is saved correctly in environment
- Check token expiration (1 hour by default)
- Verify Authorization header format: `Bearer <token>`

### Database Issues
- Ensure `isVerified` column exists in users table
- Check database connection in `.env` file
- Run migrations if necessary

This guide provides comprehensive testing coverage for the seller verification system. Follow the steps in order for the best results!
