# 🛍️ E-Commerce Backend Platform

A comprehensive, production-ready e-commerce backend built with **NestJS**, featuring complete order management, seller dashboard, financial tracking, real-time notifications, and professional email system.

## ✨ Key Features

### 🔐 Advanced Authentication System
- **JWT-based authentication** with access & refresh tokens
- **Role-based access control** (USER, SELLER, ADMIN)
- **Protected routes** with authentication guards
- **Email verification** and password reset functionality
- **Secure token storage** with httpOnly cookies

### 🛒 Complete Order Management
- **Full order lifecycle** (pending → confirmed → shipped → delivered)
- **Automatic email notifications** for all order events
- **Real-time order updates** via Pusher.js WebSockets
- **Order tracking** with tracking numbers
- **Order cancellation** and refund support
- **Comprehensive order history** for all user types

### 💰 Financial Management System
- **Automated earnings tracking** for sellers
- **Payout request system** with admin approval
- **Detailed financial records** with transaction history
- **Revenue analytics** with period-based reporting
- **Platform commission** handling and calculations

### 🔔 Real-time Notification System
- **Pusher.js WebSocket integration** for live updates
- **Multi-channel notifications**:
  - User-specific notifications
  - Role-based announcements
  - System-wide broadcasts
- **Notification history** with read/unread tracking
- **Event-driven architecture** for automated notifications

### 📧 Professional Email System
- **10+ email templates** for all e-commerce scenarios:
  - Order confirmations and updates
  - Seller notifications
  - User messaging system
  - Verification and password reset
  - Payout notifications
- **Automatic email integration** with order events
- **Professional HTML templates** with responsive design
- **Role-based email endpoints** with comprehensive validation

### 🏪 Advanced Seller Dashboard Backend
- **Product Management**: Complete CRUD with image upload
- **Order Management**: Status updates and order tracking
- **Financial Dashboard**: Earnings, payouts, and analytics
- **Performance Analytics**: Sales metrics and reporting

### 🛡️ Admin Panel Backend
- **User Management**: Comprehensive user control
- **Seller Verification**: Approval workflow system
- **Platform Analytics**: Revenue and growth metrics
- **System Management**: Platform-wide controls

## 🏗️ Technical Architecture

### Core Technologies
- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT with Guards and Strategies
- **Real-time**: Pusher.js WebSocket integration
- **Email**: Nodemailer with professional templates
- **File Upload**: Multer with image processing
- **Validation**: class-validator with custom pipes

### Project Structure
```
src/
├── auth/                    # JWT authentication & role-based guards
│   ├── jwt-auth/           # JWT authentication guards
│   ├── roles/              # Role-based access control
│   └── dto/                # Authentication data transfer objects
├── users/                   # User management system
│   ├── entities/           # User entity definitions
│   ├── dto/                # User data transfer objects
│   └── pipes/              # User validation pipes
├── seller/                  # Seller operations & dashboard
│   ├── entities/           # Seller entity definitions
│   ├── dto/                # Seller data transfer objects
│   └── Files/              # Seller file management
├── product/                 # Product management system
│   ├── entities/           # Product entity definitions
│   ├── dto/                # Product data transfer objects
│   └── image-upload/       # Product image handling
├── order/                   # Complete order management
│   ├── entities/           # Order and OrderItem entities
│   ├── dto/                # Order data transfer objects
│   └── guards/             # Order-specific guards
├── financial/               # Financial tracking system
│   ├── entities/           # Financial record entities
│   ├── dto/                # Financial data transfer objects
│   └── services/           # Financial calculation services
├── notification/            # Real-time notification system
│   ├── services/           # Pusher.js integration
│   └── dto/                # Notification data transfer objects
├── mailler/                # Professional email system
│   ├── templates/          # HTML email templates
│   ├── services/           # Email sending services
│   └── dto/                # Email data transfer objects
├── admin/                   # Admin panel operations
│   ├── services/           # Admin-specific services
│   └── dto/                # Admin data transfer objects
└── migration/               # Database migrations
    ├── CreateUserProductRelationship.ts
    ├── AddAdminRole.ts
    └── FixSellerIdNullable.ts
```

## Description

A comprehensive e-commerce platform with advanced authentication, order management, real-time features, and professional email integration.

## Features

- **Multi-role Management**: Admin, Customer, and Seller modules
- **Data Validation**: Custom DTOs with class-validator pipes
- **File Upload**: PDF document upload with validation
- **Type Safety**: Full TypeScript implementation
- **Modular Architecture**: Clean separation of concerns
- **Error Handling**: Comprehensive exception handling

## Technologies Used

- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: PostgreSQL with TypeORM
- **Validation**: class-validator, class-transformer
- **File Upload**: Multer
- **Architecture**: Modular (Admin, Customer, Seller)
- **ID Generation**: Custom @BeforeInsert hooks

## Project Structure

```
src/
├── admin/           # Admin management module
├── customer/        # Customer management module
├── seller/          # Seller management with file upload
│   ├── dto/         # Data Transfer Objects
│   ├── Files/       # File upload services
│   └── ...
├── app.module.ts    # Root application module
└── main.ts         # Application entry point
```

## Installation and Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Install Dependencies

```bash
# Install all dependencies
$ npm install

# Install TypeORM and PostgreSQL packages
$ npm install @nestjs/typeorm typeorm pg
$ npm install @types/pg --save-dev

# Install validation packages
$ npm install class-validator class-transformer

# Install file upload packages
$ npm install multer @types/multer
```

## Running the Application

```bash
# Development mode
$ npm run start

# Watch mode (recommended for development)
$ npm run start:dev

# Production mode
$ npm run start:prod
```

The application will start on `http://localhost:3030`

## API Routes

### Seller Routes (Base: `/sellers`)

#### Entity-Based Operations (Primary)
```bash
# Create seller with entity validation
POST http://localhost:3030/sellers/create
Content-Type: application/json
{
  "username": "john_seller",
  "fullName": "John Doe Seller",
  "name": "John",
  "password": "password123",
  "phone": "01712345678",
  "isActive": true
}

# Search sellers by full name substring
GET http://localhost:3030/sellers/search?fullName=John
Example: GET http://localhost:3030/sellers/search?fullName=Smith

# Get seller by unique username
GET http://localhost:3030/sellers/username/:username
Example: GET http://localhost:3030/sellers/username/john_seller

# Remove seller by unique username
DELETE http://localhost:3030/sellers/username/:username
Example: DELETE http://localhost:3030/sellers/username/john_seller
```

#### Legacy Routes (Backward Compatibility)
```bash
# Get basic seller info
GET http://localhost:3030/sellers
Response: "Seller info"

# Get all sellers from database
GET http://localhost:3030/sellers/info
Response: Array of seller entities

# Get seller by entity ID
GET http://localhost:3030/sellers/info/:id
Example: GET http://localhost:3030/sellers/info/SELLER_1722758400000_456

# Add seller (legacy method with new validation)
POST http://localhost:3030/sellers/add
Content-Type: application/json
{
  "username": "jane_seller",
  "fullName": "Jane Smith",
  "name": "Jane",
  "password": "password456",
  "phone": "01887654321"
}

# Update seller (full update)
PUT http://localhost:3030/sellers/update/:id
Content-Type: application/json
{
  "fullName": "Updated Name",
  "password": "newpassword123",
  "phone": "01987654321",
  "isActive": false
}

# Partial update seller
PATCH http://localhost:3030/sellers/update/:id
Content-Type: application/json
{
  "isActive": true
}

# Delete seller by entity ID
DELETE http://localhost:3030/sellers/delete/:id
Example: DELETE http://localhost:3030/sellers/delete/SELLER_1722758400000_456
```

### File Upload Routes

```bash
# Upload PDF file
POST http://localhost:3000/files/upload
Content-Type: multipart/form-data
file: [PDF file]

# Show file info by filename
GET http://localhost:3000/files/show/:filename
Example: GET http://localhost:3000/files/show/document.pdf

# Download file
GET http://localhost:3000/files/download/:filename
Example: GET http://localhost:3000/files/download/document.pdf

# Upload and show file info
POST http://localhost:3000/files/upload-and-show
Content-Type: multipart/form-data
file: [PDF file]
```

## Data Validation

### Seller DTO Validation Rules

- **Username**: 
  - 3-100 characters long
  - Only letters, numbers, and underscores
  - Cannot be reserved names (admin, root, system, seller, test)
  - Automatically normalized to lowercase

- **Full Name**: 
  - 2-150 characters long
  - Only letters and spaces allowed
  - Automatically capitalized (first letter of each word)
  - Extra spaces removed

- **Name** (Legacy): 
  - Optional field for backward compatibility
  - Only alphanumeric characters and spaces
  - No special characters allowed

- **Password**: 
  - Minimum 6 characters
  - Must contain at least one lowercase letter

- **Phone**: 
  - Must start with "01"
  - Only digits allowed after "01"

- **IsActive**: 
  - Boolean field, defaults to false
  - Controls seller account status

### File Upload Validation

- **File Type**: Only PDF files allowed
- **File Size**: Maximum 5MB
- **MIME Type**: application/pdf
- **File Extension**: .pdf only
- **File Signature**: Validates PDF signature (%PDF)

## Testing the API

### Using cURL

#### Test Seller Creation with Entity Validation:
```bash
# Valid data - Create seller with entity
curl -X POST http://localhost:3030/sellers/create \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice_seller",
    "fullName": "Alice Smith",
    "name": "Alice",
    "password": "password123",
    "phone": "01712345678",
    "isActive": true
  }'

# Search sellers by name
curl "http://localhost:3030/sellers/search?fullName=Alice"

# Get seller by username
curl http://localhost:3030/sellers/username/alice_seller

# Invalid data (to test validation)
curl -X POST http://localhost:3030/sellers/create \
  -H "Content-Type: application/json" \
  -d '{
    "username": "al",
    "fullName": "Alice@#$",
    "password": "123",
    "phone": "123456789"
  }'
```

#### Test Seller Updates:
```bash
# Full update
curl -X PUT http://localhost:3030/sellers/update/SELLER_1722758400000_456 \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Alice Updated",
    "password": "newpassword123",
    "isActive": false
  }'

# Partial update
curl -X PATCH http://localhost:3030/sellers/update/SELLER_1722758400000_456 \
  -H "Content-Type: application/json" \
  -d '{
    "isActive": true
  }'
```

#### Test Seller Deletion:
```bash
# Delete by username (recommended)
curl -X DELETE http://localhost:3030/sellers/username/alice_seller

# Delete by ID (legacy)
curl -X DELETE http://localhost:3030/sellers/delete/SELLER_1722758400000_456
```

#### Test File Upload:
```bash
curl -X POST http://localhost:3000/files/upload \
  -F "file=@/path/to/your/document.pdf"
```

### Using Postman

1. **Seller Management**:
   - Set method to POST/GET/PUT/PATCH/DELETE
   - URL: `http://localhost:3030/sellers/[endpoint]`
   - For POST/PUT/PATCH: Set Body to "raw" JSON

2. **Entity-Based Operations**:
   - Create: `POST /sellers/create`
   - Search: `GET /sellers/search?fullName=searchTerm`
   - Get by username: `GET /sellers/username/username`
   - Delete by username: `DELETE /sellers/username/username`

3. **Legacy Operations**:
   - Get all: `GET /sellers/info`
   - Update: `PUT /sellers/update/:id`
   - Partial update: `PATCH /sellers/update/:id`

2. **File Upload**:
   - Set method to POST
   - URL: `http://localhost:3000/files/upload`
   - Body type: form-data
   - Add key "file" and select PDF file

## Error Handling

The API provides comprehensive error messages for validation failures:

- **400 Bad Request**: Validation errors, invalid file format
- **404 Not Found**: Seller or file not found
- **500 Internal Server Error**: Server-side errors

Example error response:
```json
{
  "statusCode": 400,
  "message": [
    "Username must be at least 3 characters long",
    "Full name can only contain letters and spaces",
    "Password must be at least 6 characters long!",
    "Phone number field must start with 01!"
  ],
  "error": "Bad Request"
}
```

### Seller-Specific Errors
- **409 Conflict**: Username already exists
- **404 Not Found**: Seller with username/ID not found
- **400 Bad Request**: Invalid entity data or reserved username

## Development

### Run Tests

```bash
# Unit tests
$ npm run test

# E2E tests
$ npm run test:e2e

# Test coverage
$ npm run test:cov
```

### Project Modules

1. **Admin Module**: Administrative operations
2. **Customer Module**: Customer management
3. **Seller Module**: Complete seller management with:
   - TypeORM entity with auto-generated IDs
   - Custom validation pipes (username, fullName, search)
   - Entity-based operations (create, search, get, delete by username)
   - Legacy operations for backward compatibility
   - PostgreSQL database integration
4. **File Upload Module**: PDF file handling and validation

### Key Components

- **Entities**: TypeORM entities with @BeforeInsert hooks
- **DTOs**: Data Transfer Objects with comprehensive validation decorators
- **Services**: Business logic with TypeORM repository pattern
- **Controllers**: RESTful HTTP request handling
- **Pipes**: Custom validation pipes for data processing and security
- **Interceptors**: File upload interceptors

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3030
NODE_ENV=development
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=e-commerce_backend
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
```

## Deployment

When you're ready to deploy your e-commerce backend to production:

1. **Build the project**:
```bash
npm run build
```

2. **Set environment variables** for production
3. **Configure file upload directory** permissions
4. **Set up PostgreSQL database** and configure connection
5. **Deploy to your preferred platform**

For more information, check out the [NestJS deployment documentation](https://docs.nestjs.com/deployment).

## License

This project is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

## Author

**Dip Roy** - E-commerce Backend Developer

## Support

For questions and support:
- Create an issue in this repository
- Check NestJS [documentation](https://docs.nestjs.com)
- Visit NestJS [Discord channel](https://discord.gg/G7Qnnhy)

---

### Quick Start Commands

```bash
# Clone and setup
git clone [repository-url]
cd e-commerce_backend
npm install

# Setup PostgreSQL database
createdb -U postgres e-commerce_backend

# Start development
npm run start:dev

# Test seller endpoints
curl http://localhost:3030/sellers
curl http://localhost:3030/sellers/info

# Test entity creation
curl -X POST http://localhost:3030/sellers/create \
  -H "Content-Type: application/json" \
  -d '{"username":"test_user","fullName":"Test User","password":"test123","phone":"01712345678"}'

# Test file upload
curl -X POST http://localhost:3030/files/upload -F "file=@document.pdf"
```
