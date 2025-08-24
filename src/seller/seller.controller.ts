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
  Patch,
  UseGuards,
} from '@nestjs/common';
import { SellerService } from './seller.service';
import { SellerDto } from './dto/seller.dto';
import { SellerUsernameValidationPipe } from './pipes/seller-username-validation.pipe';
import { SellerFullNameValidationPipe } from './pipes/seller-fullname-validation.pipe';
import { SellerSearchValidationPipe } from './pipes/seller-search-validation.pipe';
import { ProductDto } from '../product/dto/product.dto';
import { Roles } from 'src/auth/roles.decorator/roles.decorator';
import { Role } from '../users/entities/role.enum';
import { JwtAuthGuard } from 'src/auth/jwt-auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles/roles.guard';
import { CreateProductDto } from '../product/dto/product.dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Controller('sellers')
export class SellerController {
  constructor(private readonly sellerService: SellerService) {}

  // Legacy route for backward compatibility
  @Get()
  getSellerInfo(): string {
    return this.sellerService.getSellerInfo();
  }

  // Create seller with entity and validation
  @UseGuards(JwtAuthGuard)
  @Roles(Role.ADMIN, Role.SELLER)
  @Post('create')
  @UsePipes(ValidationPipe, SellerUsernameValidationPipe, SellerFullNameValidationPipe)
  async createSeller(@Body() sellerDto: SellerDto) {
    return await this.sellerService.createSeller(sellerDto);
  }

  // Search sellers by full name
  /*@UseGuards(JwtAuthGuard)
  @Roles(Role.ADMIN)
  @Get('search')
  async getSellersByFullName(
    @Query('fullName', SellerSearchValidationPipe) fullName: string,
  ) {
    return await this.sellerService.getSellersByFullNameSubstring(fullName);
  }*/

  @UseGuards(JwtAuthGuard)
  @Roles(Role.ADMIN)
  // Get seller by username
  @Get('username/:username')
  async getSellerByUsername(
    @Param('username', SellerUsernameValidationPipe) username: string,
  ) {
    return await this.sellerService.getSellerByUsername(username);
  }

  // Get seller by ID
  @UseGuards(JwtAuthGuard)
  @Roles(Role.ADMIN)
  @Get('id/:id')
  @UsePipes(ValidationPipe)
  async getSellerById(@Param('id') id: string) {
    return await this.sellerService.getSellerById(id);
  }

  // Add seller (alternative create endpoint)
  @Post('add')
  @UsePipes(ValidationPipe, SellerUsernameValidationPipe, SellerFullNameValidationPipe)
  async addSeller(@Body() sellerDto: SellerDto) {
    return await this.sellerService.addSeller(sellerDto);
  }
  @UseGuards(JwtAuthGuard)
  @Roles(Role.ADMIN)
  @Put('update/:id')
  @UsePipes(ValidationPipe, SellerFullNameValidationPipe)
  async updateUser(@Param('id') id: string, @Body() sellerDto: SellerDto) {
    return await this.sellerService.updateUser(id, sellerDto);
  }

  @UseGuards(JwtAuthGuard)
  @Roles(Role.ADMIN, Role.SELLER)
  @Delete('delete/:id')
  async deleteUser(@Param('id') id: string) {
    return await this.sellerService.deleteUser(id);
}
  @UseGuards(JwtAuthGuard)
  @Roles(Role.ADMIN, Role.SELLER)
  @Patch('update/:id')
  @UsePipes(ValidationPipe, SellerFullNameValidationPipe)
  async updatePartialUser(@Param('id') id: string, @Body() sellerDto: Partial<SellerDto>) {
    return await this.sellerService.updatePartialUser(id, sellerDto);
  }

  @Get('all')
  async getAllSellers() {
    return await this.sellerService.getAllSellers();
  }

  // Search sellers by substring in full name
  @Get('search/:substring')
  async searchSellers(@Param('substring') substring: string) {
    return await this.sellerService.getSellersByFullNameSubstring(substring);
  }

  @Get('allid')
  async getAllSellerIds() {
    return await this.sellerService.getAllid();
  }

  @Get('allusernames')
  async getAllUsernames() {
    return await this.sellerService.getAllUsernames();
  }

  // Seller login - redirects to main auth system
  @Post('login')
  @UsePipes(ValidationPipe)
  async loginSeller(@Body() loginDto: { username: string; password: string }) {
    // For sellers, use the main auth system instead
    return {
      message: 'Use /auth/login for seller authentication',
      redirectUrl: '/auth/login',
      note: 'All users (including sellers) login through the main auth system',
      example: {
        url: 'POST /auth/login',
        body: {
          username: loginDto.username,
          password: '****'
        }
      }
    };
  }

  // One-to-Many Relationship Endpoints

  // Get seller with their products
  @UseGuards(JwtAuthGuard)
  @Roles(Role.ADMIN, Role.SELLER)
  @Get(':id/products')
  async getSellerWithProducts(@Param('id') sellerId: string) {
    return await this.sellerService.getSellerWithProducts(sellerId);
  }

  // Get all sellers with product count
  @UseGuards(JwtAuthGuard)
  @Roles(Role.ADMIN, Role.SELLER)
  @Get('stats/product-counts')
  async getAllSellersWithProductCount() {
    return await this.sellerService.getAllSellersWithProductCount();
  }

  // Get active products for a seller
  @Get(':id/products/active')
  async getActiveProductsBySeller(@Param('id') sellerId: string) {
    return await this.sellerService.getActiveProductsBySeller(sellerId);
  }

  // Create product for a seller (Protected - Sellers only) - FIXED: Uses JWT authentication
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SELLER)
  @Post(':id/products')
  @UsePipes(ValidationPipe)
  async createProductForSeller(
    @Param('id') sellerId: string,
    @Body() createProductDto: CreateProductDto,
    @CurrentUser() user: any
  ) {
    // Verify that the authenticated user is creating products for themselves
    if (user.id.toString() !== sellerId) {
      throw new Error('You can only create products for your own account');
    }
    return await this.sellerService.createProductForSeller(sellerId, createProductDto);
  }

  // Get seller's product statistics
  @Get(':id/stats')
  async getSellerProductStats(@Param('id') sellerId: string) {
    return await this.sellerService.getSellerProductStats(sellerId);
  }

  @UseGuards(JwtAuthGuard)
  @Roles(Role.ADMIN, Role.SELLER)
  @Get(':id/products/names-descriptions')
  async getSellerProductsNameAndDescription(@Param('id') sellerId: string) {
    return await this.sellerService.getSellerProductsNameAndDescription(sellerId);
  }

}
