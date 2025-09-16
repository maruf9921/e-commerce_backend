import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UsePipes,
  ValidationPipe,
  ParseIntPipe,
  UseGuards,
  Res,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductDto, UpdateProductDto, CreateProductDto } from './dto/product.dto';
import { Product } from './entities/product.entity';
import { JwtAuthGuard } from 'src/auth/jwt-auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles/roles.guard';
import { SellerVerifiedGuard } from 'src/auth/guards/seller-verified.guard';
import { Role } from 'src/users/entities/role.enum';
import { Roles } from 'src/auth/roles.decorator/roles.decorator';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImageUploadService } from './image-upload/image-upload.service';
import { storage } from './image-upload/image-upload.controller';
import { Observable } from 'rxjs/internal/Observable';
import { of } from 'rxjs';
import { of as observableOf } from 'rxjs';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { config } from 'dotenv'
config();

@Controller('products')
export class ProductController {
    constructor(
        private readonly productService: ProductService,
        private readonly imageUploadService: ImageUploadService
    ) {}

    // NEW: Create product with image upload - automatically generates URL
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
    ): Promise<Observable<object>> {
        console.log('📥 Incoming DTO:', createProductDto);
        console.log('🖼️ Uploaded File:', imageFile);

        // Handle case where file info might be in DTO instead of imageFile
        let actualFile = imageFile;
        let filename = null;

        // Cast to any to access the file property that may come from form-data
        const dtoWithFile = createProductDto as any;

        if (!actualFile && dtoWithFile.file) {
            // If file info is in DTO, extract filename from the path
            const filePath = dtoWithFile.file;
            if (typeof filePath === 'string' && filePath.includes('uploads/images/')) {
                filename = filePath.split('uploads/images/')[1] || filePath.split('/').pop();
                console.log('🔧 Extracted filename from DTO:', filename);
            }
        } else if (actualFile) {
            filename = actualFile.filename;
        }

        const baseUrl = `${process.env.BASE_URL || 'http://localhost:4002'}/uploads/images/`;
        const imageUrl = filename ? `${baseUrl}${filename}` : null;

        console.log('🖼️ Generated Image URL:', imageUrl);

        // Clean the DTO (remove file field as it's not part of the product data)
        const { file, ...cleanedDto } = dtoWithFile;

        // Add the image to the images array if file was uploaded
        const productData = {
            ...cleanedDto,
            images: imageUrl ? [{
                imageUrl: imageUrl,
                altText: cleanedDto.name,
                isActive: true,
                sortOrder: 0
            }] : []
        };

        console.log('📦 Final Product Data:', productData);

        const result = await this.productService.createProductWithAuth(productData, user);
        return of(result);
    }

    // Get all products with seller information
    @Get()
    async getAllProducts(): Promise<Product[]> {
        return this.productService.getAllProducts();
    }

    // NEW: Get products for current authenticated user
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SELLER)
    @Get('my-products')
    async getMyProducts(@CurrentUser() user: any): Promise<any[]> {
        const products = await this.productService.getProductsBySellerId(user.id.toString());
        
        // Transform the response to match frontend expectations
        return products.map(product => ({
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            stock: product.stockQuantity,
            category: product.category,
            isActive: product.isActive,
            images: product.images ? product.images
                .filter(img => img.isActive)
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map(img => img.imageUrl) : [],
            createdAt: product.createdAt,
            updatedAt: product.updatedAt
        }));
    }

    // NEW: Get current user's profile with products
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SELLER)
    @Get('my-profile')
    async getMyProfile(@CurrentUser() user: any) {
        return {
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                isActive: user.isActive
            },
            message: `Welcome back, ${user.username}!`
        };
    }

    // NEW: Get all products with their images
    @Get('with-images')
    async getAllProductsWithImages(): Promise<Product[]> {
        return this.productService.getAllProductsWithImages();
    }

    // NEW: Get paginated products with images for main page
    @Get('paginated')
    async getPaginatedProducts(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '12'
    ): Promise<{
        products: Product[],
        totalCount: number,
        totalPages: number,
        currentPage: number,
        hasNextPage: boolean,
        hasPrevPage: boolean
    }> {
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 12;
        return this.productService.getPaginatedProductsWithImages(pageNum, limitNum);
    }

    // Get product by ID
   // @UseGuards(JwtAuthGuard)
   // @Roles(Role.ADMIN, Role.SELLER)
    @Get(':id')
    async getProductById(@Param('id', ParseIntPipe) id: number): Promise<Product> {
        return this.productService.getProductById(id);
    }

    // Create product with validation - FIXED: Uses JWT authentication
    @UseGuards(JwtAuthGuard, RolesGuard, SellerVerifiedGuard)
    @Roles(Role.ADMIN, Role.SELLER)
    @Post('create')
    @UsePipes(ValidationPipe)
    async createProduct(
        @Body() createProductDto: CreateProductDto,
        @CurrentUser() user: any
    ): Promise<Product> {
        return this.productService.createProductWithAuth(createProductDto,user); //user
    }

    // NEW: Update product with user verification
    @UseGuards(JwtAuthGuard, RolesGuard, SellerVerifiedGuard)
    @Roles(Role.ADMIN, Role.SELLER)
    @Put('my-product/:id')
    @UsePipes(ValidationPipe)
    async updateMyProduct(
        @Param('id', ParseIntPipe) productId: number,
        @Body() updateProductDto: UpdateProductDto,
        @CurrentUser() user: any
    ): Promise<Product> {
        // Verify the product belongs to the current user
        const product = await this.productService.getProductById(productId);
        if (product.userId !== user.id && user.role !== Role.ADMIN) {
            throw new Error('You can only update your own products');
        }
        return this.productService.updateProduct(productId, updateProductDto);
    }

    // NEW: Delete my product
    @UseGuards(JwtAuthGuard, RolesGuard, SellerVerifiedGuard)
    @Roles(Role.ADMIN, Role.SELLER)
    @Delete('my-product/:id')
    async deleteMyProduct(
        @Param('id', ParseIntPipe) productId: number,
        @CurrentUser() user: any
    ) {
        // Verify the product belongs to the current user
        const product = await this.productService.getProductById(productId);
        if (product.userId !== user.id && user.role !== Role.ADMIN) {
            throw new Error('You can only delete your own products');
        }
        return this.productService.deleteProduct(productId);
    }

    // Update product
    @UseGuards(JwtAuthGuard)
    @Roles(Role.ADMIN, Role.SELLER)
    @Put(':id')
    @UsePipes(ValidationPipe)
    async updateProduct(
        @Param('id', ParseIntPipe) id: number, 
        @Body() updateProductDto: UpdateProductDto
    ): Promise<Product> {
        return this.productService.updateProduct(id, updateProductDto);
    }

    // Delete product
    @UseGuards(JwtAuthGuard)
    @Roles(Role.ADMIN, Role.SELLER)
    @Delete(':id')
    async deleteProduct(@Param('id', ParseIntPipe) id: number) {
        return this.productService.deleteProduct(id);
    }

    
    // SELLER-PRODUCT RELATIONSHIP ROUTES
    

    // Get products by seller ID
    @UseGuards(JwtAuthGuard)
    @Roles(Role.ADMIN, Role.SELLER)
    @Get('seller/:sellerId')
    async getProductsBySellerId(@Param('sellerId') sellerId: string): Promise<Product[]> {
        return this.productService.getProductsBySellerId(sellerId);
    }

    // Search products by name
    @UseGuards(JwtAuthGuard)
    @Roles(Role.ADMIN, Role.SELLER)
    @Get('search')
    async searchProducts(@Query('name') name: string): Promise<Product[]> {
        return this.productService.searchProductsByName(name);
    }

    // Many-to-One Relationship Endpoints

    // Get products by seller username
    @UseGuards(JwtAuthGuard)
  @Roles(Role.ADMIN, Role.SELLER)
    @Get('seller/username/:username')
    async getProductsBySellerUsername(@Param('username') username: string): Promise<Product[]> {
        return this.productService.getProductsBySellerUsername(username);
    }

    // Get only active products with seller details
    @UseGuards(JwtAuthGuard)
  @Roles(Role.ADMIN, Role.SELLER)
    @Get('active/with-seller')
    async getActiveProductsWithSeller(): Promise<Product[]> {
        return this.productService.getActiveProductsWithSeller();
    }

    // Get product with full seller details
    @UseGuards(JwtAuthGuard)
  @Roles(Role.ADMIN, Role.SELLER)
    @Get(':id/with-seller')
    async getProductWithSellerDetails(@Param('id', ParseIntPipe) productId: number): Promise<Product> {
        return this.productService.getProductWithSellerDetails(productId);
    }

    // Get products grouped by seller
    @Get('stats/grouped-by-seller')
    async getProductsGroupedBySeller(): Promise<any[]> {
        return this.productService.getProductsGroupedBySeller();
    }

    // Search products by seller name
    @UseGuards(JwtAuthGuard)
  @Roles(Role.ADMIN, Role.SELLER)
    @Get('search/by-seller')
    async searchProductsBySellerName(@Query('sellerName') sellerName: string): Promise<Product[]> {
        return this.productService.searchProductsBySellerName(sellerName);
    }

    @Get('product-image/:id')
    async getProductImage(@Param('id', ParseIntPipe) id: number): Promise<{ image: string }> {
        const imageUrl = await this.productService.getProductImage1(+id);
        return { image: imageUrl };
    }

    // Serve actual image files
    @Get('serve-image/:filename(*)')
    async serveImage(@Param('filename') filename: string, @Res() res: Response) {
        try {
            // Decode URL-encoded filename
            const decodedFilename = decodeURIComponent(filename);
            
            // Check multiple possible locations for the image
            // Use process.cwd() to get the project root instead of __dirname
            const possiblePaths = [
                path.join(process.cwd(), 'uploads', 'images', decodedFilename),
                path.join(process.cwd(), 'image', decodedFilename),
                path.join(process.cwd(), 'uploads', decodedFilename),
                // Fallback to the old __dirname approach for backwards compatibility
                path.join(__dirname, '..', '..', 'uploads', 'images', decodedFilename),
                path.join(__dirname, '..', '..', 'image', decodedFilename),
                path.join(__dirname, '..', '..', 'uploads', decodedFilename)
            ];
            
            for (const imagePath of possiblePaths) {
                if (fs.existsSync(imagePath)) {
                    console.log(`✅ Serving image from: ${imagePath}`);
                    return res.sendFile(imagePath);
                }
            }
            
            console.error(`❌ Image not found in any location: ${decodedFilename}`);
            console.error(`Checked paths:`, possiblePaths);
            res.status(404).json({ 
                error: 'Image not found', 
                filename: decodedFilename,
                checkedPaths: possiblePaths 
            });
        } catch (error) {
            console.error('❌ Error serving image:', error);
            res.status(500).json({ error: 'Server error serving image' });
        }
    }

    // Simple image serving endpoint
    @Get('img/:id')
    async serveProductImage(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
        try {
            const product = await this.productService.getProductById(id);
            if (!product.images || product.images.length === 0) {
                return res.status(404).json({ error: 'No image for this product' });
            }
            
            // Get the first active image
            const activeImage = product.images.find(img => img.isActive);
            if (!activeImage) {
                return res.status(404).json({ error: 'No active image for this product' });
            }
            
            // Extract filename from imageUrl
            const filename = activeImage.imageUrl.replace(/.*\//, ''); // Get filename from URL
            const imagePath = path.join(__dirname, '..', '..', 'image', filename);
            
            if (fs.existsSync(imagePath)) {
                res.sendFile(imagePath);
            } else {
                res.status(404).json({ error: 'Image file not found', path: imagePath });
            }
        } catch (error) {
            res.status(404).json({ error: 'Product not found' });
        }
    }

    // Direct image serving endpoint
    @Get('image-file/:filename')
    async serveImageFile(@Param('filename') filename: string, @Res() res: Response) {
        try {
            // Decode URL-encoded filename
            const decodedFilename = decodeURIComponent(filename);
            const imagePath = path.join(__dirname, '..', '..', 'image', decodedFilename);
            
            if (fs.existsSync(imagePath)) {
                res.sendFile(imagePath);
            } else {
                res.status(404).json({ error: 'Image file not found', path: imagePath });
            }
        } catch (error) {
            res.status(500).json({ error: 'Server error' });
        }
    }

    // Simple image serving by product ID
    @Get('picture/:id')
    async servePicture(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
        try {
            const product = await this.productService.getProductById(id);
            if (!product.images || product.images.length === 0) {
                return res.status(404).json({ error: 'No image for this product' });
            }
            
            // Get the first active image
            const activeImage = product.images.find(img => img.isActive);
            if (!activeImage) {
                return res.status(404).json({ error: 'No active image for this product' });
            }
            
            // Extract filename from imageUrl
            const filename = activeImage.imageUrl.replace(/.*\//, ''); // Get filename from URL
            const imagePath = path.join(__dirname, '..', '..', 'image', filename);
            
            if (fs.existsSync(imagePath)) {
                res.sendFile(imagePath);
            } else {
                res.status(404).json({ error: 'Image file not found', path: imagePath });
            }
        } catch (error) {
            res.status(404).json({ error: 'Product not found' });
        }
    }

    // Simple static file serving for images
    @Get('static/:filename')
    async serveStaticImage(@Param('filename') filename: string, @Res() res: Response) {
        try {
            // Decode URL-encoded filename
            const decodedFilename = decodeURIComponent(filename);
            
            // Check multiple possible locations for the image
            const possiblePaths = [
                path.join(__dirname, '..', '..', 'uploads', 'images', decodedFilename),
                path.join(__dirname, '..', '..', 'image', decodedFilename),
                path.join(__dirname, '..', '..', 'uploads', decodedFilename)
            ];
            
            for (const imagePath of possiblePaths) {
                if (fs.existsSync(imagePath)) {
                    console.log(`✅ Serving static image from: ${imagePath}`);
                    return res.sendFile(imagePath);
                }
            }
            
            console.error(`❌ Static image not found: ${decodedFilename}`);
            res.status(404).json({ 
                error: 'Image file not found', 
                filename: decodedFilename,
                checkedPaths: possiblePaths 
            });
        } catch (error) {
            console.error('❌ Error serving static image:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }

    // NEW: Simple image serving that works
    @Get('img/:filename')
    async serveImageSimple(@Param('filename') filename: string, @Res() res: Response) {
        try {
            // Decode URL-encoded filename
            const decodedFilename = decodeURIComponent(filename);
            const imagePath = path.join(__dirname, '..', '..', 'image', decodedFilename);
            
            console.log('🔍 Looking for image at:', imagePath);
            console.log('📁 File exists:', fs.existsSync(imagePath));
            
            if (fs.existsSync(imagePath)) {
                console.log('✅ Serving image:', decodedFilename);
                res.sendFile(imagePath);
            } else {
                console.log('❌ Image not found:', imagePath);
                res.status(404).json({ 
                    error: 'Image file not found', 
                    path: imagePath,
                    filename: decodedFilename 
                });
            }
        } catch (error) {
            console.error('🚨 Error serving image:', error);
            res.status(500).json({ error: 'Server error', details: error.message });
        }
    }

    // Test endpoint to get all products with their image URLs
    @Get('test/images')
    async getTestProducts(): Promise<Product[]> {
        return this.productService.getAllProducts();
    }



    // NEW: Get all uploaded image filenames
    @Get('images/list')
    async getUploadedImages(): Promise<{ images: string[], count: number }> {
        return this.productService.getUploadedImagesList();
    }



    // NEW: Get specific product with its images
    @Get(':id/with-images')
    async getProductWithImages(@Param('id', ParseIntPipe) id: number): Promise<Product> {
        return this.productService.getProductWithImages(id);
    }

    // NEW: Get product images by product ID
    @Get(':id/images')
    async getProductImages(@Param('id', ParseIntPipe) productId: number) {
        return this.productService.getProductImages(productId);
    }

    // ======= SELLER DASHBOARD ENHANCED ENDPOINTS =======

    // Get seller dashboard analytics
    @UseGuards(JwtAuthGuard, RolesGuard, SellerVerifiedGuard)
    @Roles(Role.SELLER, Role.ADMIN)
    @Get('dashboard/analytics')
    async getSellerDashboardAnalytics(@CurrentUser() user: any) {
        return this.productService.getSellerDashboardAnalytics(user.id);
    }

    // Get seller's top performing products
    @UseGuards(JwtAuthGuard, RolesGuard, SellerVerifiedGuard)
    @Roles(Role.SELLER, Role.ADMIN)
    @Get('dashboard/top-products')
    async getSellerTopProducts(
        @CurrentUser() user: any,
        @Query('limit') limit?: number
    ) {
        return this.productService.getSellerTopProducts(user.id, limit || 10);
    }

    // Get seller's low stock products
    @UseGuards(JwtAuthGuard, RolesGuard, SellerVerifiedGuard)
    @Roles(Role.SELLER, Role.ADMIN)
    @Get('dashboard/low-stock')
    async getSellerLowStockProducts(
        @CurrentUser() user: any,
        @Query('threshold') threshold?: number
    ) {
        return this.productService.getSellerLowStockProducts(user.id, threshold || 10);
    }

    // Get seller's product categories with analytics
    @UseGuards(JwtAuthGuard, RolesGuard, SellerVerifiedGuard)
    @Roles(Role.SELLER, Role.ADMIN)
    @Get('dashboard/categories')
    async getSellerProductCategories(@CurrentUser() user: any) {
        return this.productService.getSellerProductCategories(user.id);
    }

    // Bulk update products
    @UseGuards(JwtAuthGuard, RolesGuard, SellerVerifiedGuard)
    @Roles(Role.SELLER, Role.ADMIN)
    @Put('dashboard/bulk-update')
    @UsePipes(ValidationPipe)
    async bulkUpdateProducts(
        @CurrentUser() user: any,
        @Body() updates: { productIds: number[], updateData: any }
    ) {
        return this.productService.bulkUpdateProducts(user.id, updates);
    }

    // Add multiple images to a product
    @UseGuards(JwtAuthGuard, RolesGuard, SellerVerifiedGuard)
    @Roles(Role.SELLER, Role.ADMIN)
    @Post(':id/images')
    @UsePipes(ValidationPipe)
    async addProductImages(
        @Param('id', ParseIntPipe) productId: number,
        @CurrentUser() user: any,
        @Body() imageData: Array<{ imageUrl: string, altText?: string, sortOrder?: number }>
    ) {
        return this.productService.addProductImages(productId, user.id, imageData);
    }

    // Update product image order
    @UseGuards(JwtAuthGuard, RolesGuard, SellerVerifiedGuard)
    @Roles(Role.SELLER, Role.ADMIN)
    @Put(':id/images/reorder')
    @UsePipes(ValidationPipe)
    async updateImageOrder(
        @Param('id', ParseIntPipe) productId: number,
        @CurrentUser() user: any,
        @Body() imageOrderData: Array<{ imageId: number, sortOrder: number }>
    ) {
        return this.productService.updateImageOrder(productId, user.id, imageOrderData);
    }

    // Delete product image
    @UseGuards(JwtAuthGuard, RolesGuard, SellerVerifiedGuard)
    @Roles(Role.SELLER, Role.ADMIN)
    @Delete(':id/images/:imageId')
    async deleteProductImage(
        @Param('id', ParseIntPipe) productId: number,
        @Param('imageId', ParseIntPipe) imageId: number,
        @CurrentUser() user: any
    ) {
        return this.productService.deleteProductImage(productId, imageId, user.id);
    }

    // Update product stock
    @UseGuards(JwtAuthGuard, RolesGuard, SellerVerifiedGuard)
    @Roles(Role.SELLER, Role.ADMIN)
    @Put(':id/stock')
    @UsePipes(ValidationPipe)
    async updateProductStock(
        @Param('id', ParseIntPipe) productId: number,
        @CurrentUser() user: any,
        @Body() stockData: { stockQuantity: number }
    ) {
        return this.productService.updateProductStock(productId, user.id, stockData.stockQuantity);
    }

}
