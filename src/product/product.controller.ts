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
} from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductDto, UpdateProductDto } from './dto/product.dto';
import { Product } from './entities/product.entity';
import { JwtAuthGuard } from 'src/auth/jwt-auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles/roles.guard';
import { Role } from 'src/users/entities/role.enum';
import { Roles } from 'src/auth/roles.decorator/roles.decorator';

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

    // Create product with validation
    @UseGuards(JwtAuthGuard)
    @Roles(Role.ADMIN, Role.SELLER)
    @Post('create')
    @UsePipes(ValidationPipe)
    async createProduct(@Body() productDto: ProductDto): Promise<Product> {
        return this.productService.createProduct(productDto);
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
}
