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
} from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductDto, UpdateProductDto } from './dto/product.dto';
import { Product } from './entities/product.entity';

@Controller('products')
export class ProductController {
    constructor(private readonly productService: ProductService) {}

    // Get all products with seller information
    @Get()
    async getAllProducts(): Promise<Product[]> {
        return this.productService.getAllProducts();
    }

    // Get product by ID
    @Get(':id')
    async getProductById(@Param('id', ParseIntPipe) id: number): Promise<Product> {
        return this.productService.getProductById(id);
    }

    // Create product with validation
    @Post('create')
    @UsePipes(ValidationPipe)
    async createProduct(@Body() productDto: ProductDto): Promise<Product> {
        return this.productService.createProduct(productDto);
    }

    // Update product
    @Put(':id')
    @UsePipes(ValidationPipe)
    async updateProduct(
        @Param('id', ParseIntPipe) id: number, 
        @Body() updateProductDto: UpdateProductDto
    ): Promise<Product> {
        return this.productService.updateProduct(id, updateProductDto);
    }

    // Delete product
    @Delete(':id')
    async deleteProduct(@Param('id', ParseIntPipe) id: number) {
        return this.productService.deleteProduct(id);
    }

    // ================================
    // SELLER-PRODUCT RELATIONSHIP ROUTES
    // ================================

    // Get products by seller ID
    @Get('seller/:sellerId')
    async getProductsBySellerId(@Param('sellerId') sellerId: string): Promise<Product[]> {
        return this.productService.getProductsBySellerId(sellerId);
    }

    // Search products by name
    @Get('search')
    async searchProducts(@Query('name') name: string): Promise<Product[]> {
        return this.productService.searchProductsByName(name);
    }
}
