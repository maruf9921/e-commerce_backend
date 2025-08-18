import { Controller, Post, Get, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ProductService } from './product.service';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  // 1. Create product for admin
  @Post(':adminId')
  createProduct(
    @Param('adminId', ParseIntPipe) adminId: number,
    @Body() productData: { name: string; price: number; stock: number },
  ) {
    return this.productService.createProduct(adminId, productData);
  }

  // 2. Get all products for one admin
  @Get('admin/:adminId')
  getProductsByAdmin(@Param('adminId', ParseIntPipe) adminId: number) {
    return this.productService.getProductsByAdmin(adminId);
  }

  // 3. Delete product by ID
  @Delete(':id')
  deleteProduct(@Param('id', ParseIntPipe) id: number) {
    return this.productService.deleteProduct(id);
  }
}
