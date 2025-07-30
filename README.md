# E-Commerce Backend API

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

## Description

A robust e-commerce backend API built with NestJS framework, TypeScript, and advanced validation features. This project includes modules for Admin, Customer, and Seller management with comprehensive CRUD operations, file upload capabilities, and data validation using DTOs and Pipes.

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
- **Validation**: class-validator, class-transformer
- **File Upload**: Multer
- **Architecture**: Modular (Admin, Customer, Seller)

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

The application will start on `http://localhost:3000`

## API Routes

### Seller Routes

#### GET Routes
```bash
# Get basic seller info
GET http://localhost:3000/seller
Response: "Seller info"

# Get all sellers
GET http://localhost:3000/seller/info
Response: Array of seller objects

# Get seller by ID
GET http://localhost:3000/seller/info/:id
Example: GET http://localhost:3000/seller/info/1
```

#### POST Routes
```bash
# Add new seller (with validation)
POST http://localhost:3000/seller/add
Content-Type: application/json
{
  "name": "John Doe",
  "password": "password123",
  "phone": "01712345678"
}
```

#### PUT Routes
```bash
# Update seller (with validation)
PUT http://localhost:3000/seller/update/:id
Content-Type: application/json
{
  "name": "Updated Name",
  "password": "newpassword123",
  "phone": "01887654321"
}
```

#### DELETE Routes
```bash
# Delete seller
DELETE http://localhost:3000/seller/delete/:id
Example: DELETE http://localhost:3000/seller/delete/1
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

- **Name**: 
  - Cannot be empty
  - Only alphanumeric characters and spaces
  - No special characters allowed

- **Password**: 
  - Minimum 6 characters
  - Must contain at least one lowercase letter

- **Phone**: 
  - Must start with "01"
  - Only digits allowed after "01"

### File Upload Validation

- **File Type**: Only PDF files allowed
- **File Size**: Maximum 5MB
- **MIME Type**: application/pdf
- **File Extension**: .pdf only
- **File Signature**: Validates PDF signature (%PDF)

## Testing the API

### Using cURL

#### Test Seller Creation with Validation:
```bash
# Valid data
curl -X POST http://localhost:3000/seller/add \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Smith",
    "password": "password123",
    "phone": "01712345678"
  }'

# Invalid data (to test validation)
curl -X POST http://localhost:3000/seller/add \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice@#$",
    "password": "123",
    "phone": "123456789"
  }'
```

#### Test File Upload:
```bash
curl -X POST http://localhost:3000/files/upload \
  -F "file=@/path/to/your/document.pdf"
```

### Using Postman

1. **Seller Management**:
   - Set method to POST/GET/PUT/DELETE
   - URL: `http://localhost:3000/seller/[endpoint]`
   - For POST/PUT: Set Body to "raw" JSON

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
    "Name must not contain any special characters!",
    "Password must be at least 6 characters long!",
    "Phone number field must start with 01!"
  ],
  "error": "Bad Request"
}
```

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
3. **Seller Module**: Seller management with validation and file upload
4. **File Upload Module**: PDF file handling and validation

### Key Components

- **DTOs**: Data Transfer Objects with validation decorators
- **Services**: Business logic implementation
- **Controllers**: HTTP request handling
- **Pipes**: Custom validation pipes
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
PORT=3000
NODE_ENV=development
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
4. **Set up database** (if using one)
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

# Start development
npm run start:dev

# Test seller endpoint
curl http://localhost:3000/seller/info

# Test file upload
curl -X POST http://localhost:3000/files/upload -F "file=@document.pdf"
```
