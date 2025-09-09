# 🔐 Seller Verification System API Documentation

## Overview

The Seller Verification System ensures that only admin-verified sellers can create and manage products. This system adds an additional layer of security and quality control to your e-commerce platform.

## Key Features

- ✅ **Seller Registration with Pending Status**: New sellers are automatically marked as `isVerified: false`
- ✅ **Admin Verification Workflow**: Admins can view, verify, or reject pending sellers
- ✅ **Protected Seller Actions**: Only verified sellers can create/manage products
- ✅ **JWT Integration**: Verification status included in authentication tokens
- ✅ **Flexible Rejection**: Sellers can be deactivated or permanently deleted

## Database Schema Changes

### User Entity Updates
```typescript
@Column({ 
    type: 'boolean',
    default: false 
})
isVerified: boolean;  // New field added
```

## API Endpoints

### 1. Seller Registration
```http
POST /users/register-seller
Content-Type: application/json

{
  "username": "newseller",
  "fullName": "New Seller Business",
  "email": "seller@example.com",
  "password": "password123",
  "phone": "1234567890"
}
```

**Response:**
```json
{
  "message": "Seller registration successful. Your account is pending admin verification.",
  "user": {
    "id": 123,
    "username": "newseller",
    "email": "seller@example.com",
    "role": "SELLER",
    "isVerified": false,
    "isActive": true
  }
}
```

### 2. Admin - View Pending Sellers
```http
GET /admin/sellers/pending
Authorization: Bearer <admin_token>
```

**Response:**
```json
[
  {
    "id": 123,
    "username": "newseller",
    "email": "seller@example.com",
    "fullName": "New Seller Business",
    "sellerId": "SELLER_1725000000_001",
    "role": "SELLER",
    "isVerified": false,
    "createdAt": "2024-08-30T10:30:00Z"
  }
]
```

### 3. Admin - View Verified Sellers
```http
GET /admin/sellers/verified
Authorization: Bearer <admin_token>
```

### 4. Admin - Verify Seller
```http
POST /admin/sellers/{sellerId}/verify
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "notify": true  // Optional: future email notification feature
}
```

**Response:**
```json
{
  "message": "Seller 'newseller' has been successfully verified",
  "seller": {
    "id": 123,
    "username": "newseller",
    "email": "seller@example.com",
    "role": "SELLER",
    "isVerified": true
  }
}
```

### 5. Admin - Reject Seller
```http
POST /admin/sellers/{sellerId}/reject
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "deleteAccount": false,  // true = delete, false = deactivate
  "reason": "Incomplete documentation"  // Optional
}
```

**Response (Deactivate):**
```json
{
  "message": "Seller 'newseller' has been deactivated"
}
```

**Response (Delete):**
```json
{
  "message": "Seller 'newseller' has been permanently deleted"
}
```

### 6. Seller - Create Product (Protected)
```http
POST /products/create
Authorization: Bearer <seller_token>
Content-Type: application/json

{
  "name": "New Product",
  "description": "Product description",
  "price": 99.99,
  "stockQuantity": 10,
  "category": "Electronics"
}
```

**Success Response (Verified Seller):**
```json
{
  "id": 456,
  "name": "New Product",
  "price": 99.99,
  "userId": 123,
  "sellerId": "SELLER_1725000000_001"
}
```

**Error Response (Unverified Seller):**
```json
{
  "statusCode": 403,
  "message": "Your seller account is pending verification. Please wait for admin approval.",
  "error": "Forbidden"
}
```

## Guards and Security

### SellerVerifiedGuard
Applied to seller-specific endpoints. Checks:
- ✅ User is authenticated
- ✅ User has SELLER role
- ✅ Seller is verified (`isVerified: true`)
- ✅ Seller account is active (`isActive: true`)

**Protected Endpoints:**
- `POST /products/create`
- `POST /products/create-with-image`
- `GET /products/my-products`
- `PUT /products/my-product/:id`
- `DELETE /products/my-product/:id`

### JWT Token Payload
Updated to include verification status:
```json
{
  "sub": 123,
  "username": "seller",
  "email": "seller@example.com",
  "role": "SELLER",
  "isActive": true,
  "isVerified": true  // New field
}
```

## Error Handling

### Common Error Responses

**403 Forbidden - Unverified Seller:**
```json
{
  "statusCode": 403,
  "message": "Your seller account is pending verification. Please wait for admin approval.",
  "error": "Forbidden"
}
```

**403 Forbidden - Deactivated Seller:**
```json
{
  "statusCode": 403,
  "message": "Your seller account has been deactivated",
  "error": "Forbidden"
}
```

**404 Not Found - Seller Not Found:**
```json
{
  "statusCode": 404,
  "message": "Seller with ID 123 not found",
  "error": "Not Found"
}
```

**409 Conflict - Already Verified:**
```json
{
  "statusCode": 409,
  "message": "Seller is already verified",
  "error": "Conflict"
}
```

## Testing the System

### Option 1: Automated Test Script
```bash
cd /path/to/e-commerce_backend
./test-seller-verification.sh
```

### Option 2: Manual Testing

1. **Register a Seller:**
   ```bash
   curl -X POST http://localhost:4002/users/register-seller \
     -H "Content-Type: application/json" \
     -d '{"username":"testseller","email":"test@seller.com","password":"pass123","phone":"1234567890","fullName":"Test Seller"}'
   ```

2. **Login as Admin:**
   ```bash
   curl -X POST http://localhost:4002/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"adminpass"}'
   ```

3. **View Pending Sellers:**
   ```bash
   curl -X GET http://localhost:4002/admin/sellers/pending \
     -H "Authorization: Bearer <admin_token>"
   ```

4. **Verify Seller:**
   ```bash
   curl -X POST http://localhost:4002/admin/sellers/123/verify \
     -H "Authorization: Bearer <admin_token>" \
     -H "Content-Type: application/json" \
     -d '{}'
   ```

## Integration with Frontend

### Seller Registration Flow
1. Show special message after seller registration
2. Display verification status in seller dashboard
3. Block product creation with clear messaging
4. Show "Pending Verification" badge/status

### Admin Dashboard Features
1. Pending sellers list with verification actions
2. Seller management interface
3. Verification history/logs
4. Email notifications (future enhancement)

## Migration Guide

### Database Migration
The system automatically adds the `isVerified` column:
```sql
ALTER TABLE "users" ADD COLUMN "isVerified" boolean NOT NULL DEFAULT false;
UPDATE "users" SET "isVerified" = true WHERE "role" != 'SELLER';
UPDATE "users" SET "isVerified" = false WHERE "role" = 'SELLER';
```

### Existing Sellers
- All existing sellers will be marked as `isVerified: false`
- Admin needs to manually verify legitimate existing sellers
- Products from unverified sellers remain accessible (read-only)
- Unverified sellers cannot create new products until verified

## Security Benefits

1. **Quality Control**: Only approved sellers can list products
2. **Fraud Prevention**: Prevents spam/fake seller accounts
3. **Business Compliance**: Ensures sellers meet platform standards
4. **Audit Trail**: Track seller verification status and history
5. **Scalable Moderation**: Centralizes seller approval process

## Future Enhancements

- [ ] Email notifications for verification status changes
- [ ] Seller verification documents upload
- [ ] Multi-level verification (basic, premium)
- [ ] Auto-verification for trusted sellers
- [ ] Seller performance-based verification renewal
