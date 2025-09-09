# 📸 Complete Image Upload System - Working Implementation

This document provides comprehensive documentation for the complete image upload, product creation with images, and image fetching system in this e-commerce NestJS backend.

## 🎯 **System Overview**

This system allows:
- ✅ Upload images during product creation
- ✅ Store images in `./uploads/images/` with UUID filenames
- ✅ Save image URLs in database (`product_images` table)
- ✅ Serve images via static file serving
- ✅ Fetch products with their images
- ✅ Proper authentication and authorization

## 📁 **File Structure & Components**

```
src/
├── main.ts                           # Static file serving configuration
├── product/
│   ├── product.controller.ts         # Main upload endpoint
│   ├── product.service.ts            # Business logic for products + images
│   ├── dto/
│   │   ├── product.dto.ts           # CreateProductDto with validation
│   │   └── image.dto.ts             # CreateProductImageDto
│   ├── entities/
│   │   ├── product.entity.ts        # Product database entity
│   │   └── product-image.entity.ts  # Product images entity
│   └── image-upload/
│       └── image-upload.controller.ts # Alternative upload endpoint
uploads/
└── images/                          # Actual uploaded files storage
```

## 🔧 **Core Components**

### 1. **Main Configuration** (`src/main.ts`)

```typescript
// Static file serving for uploaded images
const uploadsPath = join(process.cwd(), 'uploads');
console.log('📁 Uploads path:', uploadsPath);

app.useStaticAssets(uploadsPath, {
  prefix: '/uploads/',
  setHeaders: (res, path) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cache-Control', 'public, max-age=31536000');
  }
});
```

**What it does:**
- Serves files from `uploads/` directory at `/uploads/` URL path
- Enables CORS for image access
- Sets cache headers for performance

### 2. **Product Controller** (`src/product/product.controller.ts`)

#### **Main Upload Endpoint:**

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SELLER)
@Post('create-with-image')
@UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
        destination: './uploads/images',
        filename: (req, file, cb) => {
            const filename = path.parse(file.originalname).name.replace(/\s/g, '') + uuidv4();
            const extension = path.parse(file.originalname).ext;
            cb(null, `${filename}${extension}`);
        }
    })
}))
@UsePipes(ValidationPipe)
async createProductWithImage(
    @Body() createProductDto: CreateProductDto,
    @UploadedFile() imageFile: Express.Multer.File,
    @CurrentUser() user: any
): Promise<Observable<object>>
```

**Key Features:**
- ✅ **Authentication:** Requires JWT token with SELLER/ADMIN role
- ✅ **File Storage:** Uses diskStorage to save to `./uploads/images/`
- ✅ **UUID Naming:** Generates unique filenames to prevent conflicts
- ✅ **URL Generation:** Creates full HTTP URLs for database storage
- ✅ **Validation:** Uses ValidationPipe for DTO validation

#### **File Processing Logic:**

```typescript
// Handle case where file info might be in DTO instead of imageFile
let actualFile = imageFile;
let filename = null;

const dtoWithFile = createProductDto as any;

if (!actualFile && dtoWithFile.file) {
    // Extract filename from DTO if interceptor fails
    const filePath = dtoWithFile.file;
    if (typeof filePath === 'string' && filePath.includes('uploads/images/')) {
        filename = filePath.split('uploads/images/')[1] || filePath.split('/').pop();
    }
} else if (actualFile) {
    filename = actualFile.filename;
}

const baseUrl = `${process.env.BASE_URL || 'http://localhost:4002'}/uploads/images/`;
const imageUrl = filename ? `${baseUrl}${filename}` : null;

// Add image data to product
const productData = {
    ...cleanedDto,
    images: imageUrl ? [{
        imageUrl: imageUrl,
        altText: cleanedDto.name,
        isActive: true,
        sortOrder: 0
    }] : []
};
```

### 3. **Product Service** (`src/product/product.service.ts`)

#### **Create Product with Authentication:**

```typescript
async createProductWithAuth(createProductDto: CreateProductDto, authenticatedUser: any): Promise<Product> {
    // Verify user exists and has proper role
    const user = await this.userRepository.findOne({ 
        where: { id: authenticatedUser.id },
        select: ['id', 'username', 'phone', 'isActive', 'role', 'sellerId']
    });

    if (!user || !user.isActive) {
        throw new UnauthorizedException('User account issue');
    }

    if (user.role !== Role.ADMIN && user.role !== Role.SELLER) {
        throw new UnauthorizedException('Only ADMIN or SELLER can create products');
    }

    // Separate images from product data
    const { images, ...productData } = createProductDto;
    
    // Ensure isActive is properly converted to boolean
    const processedData = {
        ...productData,
        userId: user.id,
        isActive: productData.isActive !== undefined ? Boolean(productData.isActive) : true,
    };
    
    const product = this.productRepository.create(processedData);
    const savedProduct = await this.productRepository.save(product);

    // Create product images if provided
    if (images && images.length > 0) {
        const productImages = images.map((imageDto, index) => 
            this.productImageRepository.create({
                ...imageDto,
                productId: savedProduct.id,
                sortOrder: imageDto.sortOrder ?? index,
            })
        );
        await this.productImageRepository.save(productImages);
    }

    // Return product with images and seller
    return this.productRepository.findOne({
        where: { id: savedProduct.id },
        relations: ['images', 'seller'],
    });
}
```

### 4. **DTOs** (`src/product/dto/`)

#### **CreateProductDto** (`product.dto.ts`):

```typescript
export class CreateProductDto {
    @IsString()
    @IsNotEmpty({ message: 'Product name is required' })
    @MaxLength(80, { message: 'Product name must not exceed 80 characters' })
    name: string;

    @IsString()
    @IsNotEmpty({ message: 'Description is required' })
    @MaxLength(1200, { message: 'Description must not exceed 1200 characters' })
    description: string;

    @Transform(({ value }) => {
        console.log('🔄 Transform price input:', value, typeof value);
        if (typeof value === 'string') {
            const parsed = parseFloat(value);
            return isNaN(parsed) ? value : parsed;
        }
        return value;
    })
    @IsNotEmpty({ message: 'Price is required' })
    @IsPositive({ message: 'Price must be a positive number' })
    @Min(0.01, { message: 'Price must be at least 0.01' })
    price: number;

    @Transform(({ value }) => {
        console.log('🔄 Transform isActive input:', value, typeof value);
        if (typeof value === 'string') {
            const result = value === 'true' || value === '1' || value.toLowerCase() === 'true';
            console.log('🔄 Transform isActive result:', result);
            return result;
        }
        if (typeof value === 'boolean') {
            return value;
        }
        return value != null ? Boolean(value) : true;
    })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateProductImageDto)
    images?: CreateProductImageDto[];
}
```

#### **CreateProductImageDto** (`image.dto.ts`):

```typescript
export class CreateProductImageDto {
    @IsString()
    imageUrl: string;

    @IsOptional()
    @IsString()
    altText?: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsNumber()
    sortOrder?: number;
}
```

## 🚀 **API Endpoints**

### **Authentication**
```
POST /auth/login
Content-Type: application/json

{
  "username": "testseller", 
  "password": "password123"
}

Response: { "access_token": "jwt_token_here" }
```

### **Create Product with Image**
```
POST /products/create-with-image
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data

Form Data:
- name: "Amazing Laptop"
- description: "High-performance laptop"
- price: "1099.99"
- stockQuantity: "5"
- category: "Electronics"
- isActive: "true"
- file: [image file]
```

### **Fetch Product with Images**
```
GET /products/{id}/with-images
Authorization: Bearer <jwt_token>

Response:
{
  "id": 37,
  "name": "Amazing Laptop",
  "price": "1099.99",
  "isActive": true,
  "images": [
    {
      "imageUrl": "http://localhost:4002/uploads/images/filename123.jpg",
      "altText": "Amazing Laptop",
      "isActive": true
    }
  ],
  "seller": { ... }
}
```

### **Direct Image Access**
```
GET /uploads/images/{filename}
# No authentication required - static file serving
```

## 📋 **Postman Testing Guide**

### **Step 1: Get Authentication Token**
1. **Method:** POST
2. **URL:** `http://localhost:4002/auth/login`
3. **Headers:** `Content-Type: application/json`
4. **Body (raw JSON):**
```json
{
  "username": "testseller",
  "password": "password123"
}
```
5. **Copy** the `access_token` from response

### **Step 2: Create Product with Image**
1. **Method:** POST
2. **URL:** `http://localhost:4002/products/create-with-image`
3. **Headers:** `Authorization: Bearer YOUR_TOKEN_HERE`
4. **Body:** Select **form-data**, add:

| Key | Type | Value |
|-----|------|-------|
| name | Text | Amazing Laptop |
| description | Text | High-performance laptop |
| price | Text | 1099.99 |
| stockQuantity | Text | 5 |
| category | Text | Electronics |
| isActive | Text | true |
| file | File | [Select image file] |

### **Step 3: Test Image Access**
1. Copy `imageUrl` from the response
2. Open that URL in browser or new Postman GET request
3. Should display the image

### **Step 4: Fetch Product with Images**
1. **Method:** GET
2. **URL:** `http://localhost:4002/products/{product_id}/with-images`
3. **Headers:** `Authorization: Bearer YOUR_TOKEN_HERE`

## 🗄️ **Database Schema**

### **Products Table**
```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(80) NOT NULL,
    description VARCHAR(1200) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    stockQuantity INTEGER DEFAULT 0,
    category VARCHAR(50),
    isActive BOOLEAN DEFAULT true,
    userId INTEGER NOT NULL REFERENCES users(id),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **Product Images Table**
```sql
CREATE TABLE product_images (
    id SERIAL PRIMARY KEY,
    imageUrl VARCHAR(500) NOT NULL,
    altText VARCHAR(255),
    isActive BOOLEAN DEFAULT true,
    sortOrder INTEGER DEFAULT 0,
    productId INTEGER NOT NULL REFERENCES products(id),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔍 **Troubleshooting**

### **1. 404 Error on Image URLs**
**Problem:** `Cannot GET /uploads/images/filename.jpg`

**Solutions:**
- ✅ Check if file exists in `uploads/images/` directory
- ✅ Verify server started successfully (check logs for "📁 Uploads path")
- ✅ Ensure static file serving is configured correctly in `main.ts`
- ✅ Check file permissions

### **2. isActive Always False**
**Problem:** Products created with `isActive: false` despite sending `"true"`

**Solution:** The DTO now properly transforms string `"true"` to boolean `true`
```typescript
@Transform(({ value }) => {
    if (typeof value === 'string') {
        return value === 'true' || value === '1' || value.toLowerCase() === 'true';
    }
    return value != null ? Boolean(value) : true;
})
```

### **3. File Upload Not Working**
**Problem:** `@UploadedFile()` returns undefined

**Solution:** Controller now handles both interceptor and DTO file extraction:
```typescript
if (!actualFile && dtoWithFile.file) {
    // Fallback: extract from DTO
    filename = filePath.split('uploads/images/')[1];
}
```

### **4. Authentication Errors**
**Problem:** 401 Unauthorized

**Solutions:**
- ✅ Ensure JWT token is valid and not expired
- ✅ Check Bearer token format: `Authorization: Bearer <token>`
- ✅ Verify user has SELLER or ADMIN role

## 🎯 **Working Example URLs**

Based on your working system:

```bash
# Authentication
POST http://localhost:4002/auth/login

# Create product with image
POST http://localhost:4002/products/create-with-image

# Get product with images
GET http://localhost:4002/products/37/with-images

# Direct image access
GET http://localhost:4002/uploads/images/Imagee46dd753-96f8-4cf3-9440-76b0913f3e43.jpeg
```

## ✅ **Success Indicators**

Your system is working correctly when:

1. **Upload Success:** Server logs show:
   ```
   📥 Incoming DTO: { name, description, price, isActive: 'true' }
   🖼️ Uploaded File: { filename: 'unique-name.jpg' }
   🖼️ Generated Image URL: http://localhost:4002/uploads/images/unique-name.jpg
   📦 Final Product Data: { images: [{ imageUrl, altText, isActive: true }] }
   ```

2. **Database Success:** SQL logs show:
   ```sql
   INSERT INTO "products"(...,"isActive",1,userId)  -- isActive = 1 (true)
   INSERT INTO "product_images"("imageUrl",...,productId)
   ```

3. **Image Access Success:** Opening image URL in browser displays the image

4. **JSON Response Success:** API returns product with populated `images` array

This system is fully functional and tested with your existing codebase!
