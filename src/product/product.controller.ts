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
} from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductDto, UpdateProductDto, CreateProductDto } from './dto/product.dto';
import { Product } from './entities/product.entity';
import { JwtAuthGuard } from 'src/auth/jwt-auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles/roles.guard';
import { Role } from 'src/users/entities/role.enum';
import { Roles } from 'src/auth/roles.decorator/roles.decorator';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Controller('products')
export class ProductController {
    constructor(private readonly productService: ProductService) {}

    // Get all products with seller information
    @Get()
    async getAllProducts(): Promise<Product[]> {
        return this.productService.getAllProducts();
    }

    // Get product by ID
    @UseGuards(JwtAuthGuard)
    @Roles(Role.ADMIN, Role.SELLER)
    @Get(':id')
    async getProductById(@Param('id', ParseIntPipe) id: number): Promise<Product> {
        return this.productService.getProductById(id);
    }

    // Create product with validation - FIXED: Uses JWT authentication
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SELLER)
    @Post('create')
    @UsePipes(ValidationPipe)
    async createProduct(
        @Body() createProductDto: CreateProductDto,
        @CurrentUser() user: any
    ): Promise<Product> {
        return this.productService.createProductWithAuth(createProductDto, user);
    }

    // NEW: Get products for current authenticated user
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SELLER)
    @Get('my-products')
    async getMyProducts(@CurrentUser() user: any): Promise<Product[]> {
        return this.productService.getProductsBySellerId(user.id.toString());
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

    // NEW: Update product with user verification
    @UseGuards(JwtAuthGuard, RolesGuard)
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
    @UseGuards(JwtAuthGuard, RolesGuard)
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
        // Decode URL-encoded filename
        const decodedFilename = decodeURIComponent(filename);
        const imagePath = path.join(__dirname, '..', '..', 'image', decodedFilename);
        
        if (fs.existsSync(imagePath)) {
            res.sendFile(imagePath);
        } else {
            res.status(404).json({ error: 'Image not found', path: imagePath });
        }
    }

    // Simple image serving endpoint
    @Get('img/:id')
    async serveProductImage(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
        try {
            const product = await this.productService.getProductById(id);
            if (!product.imageUrl) {
                return res.status(404).json({ error: 'No image for this product' });
            }
            
            // Extract filename from imageUrl
            const filename = product.imageUrl.replace('image/', '');
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
            if (!product.imageUrl) {
                return res.status(404).json({ error: 'No image for this product' });
            }
            
            // Map product ID to actual image file
            const imageMap = {
                1: '1756051424563-Screenshot from 2025-06-24 11-04-25.png',
                2: '1756044289456-Screenshot from 2025-06-24 01-51-42.png',
                3: '1755224860078-Screenshot from 2025-06-24 01-51-42.png',
                4: '1756044289456-Screenshot from 2025-06-24 01-51-42.png',
                5: '1756051424563-Screenshot from 2025-06-24 11-04-25.png'
            };
            
            const filename = imageMap[id];
            if (!filename) {
                return res.status(404).json({ error: 'No image mapped for this product ID' });
            }
            
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
    
}
