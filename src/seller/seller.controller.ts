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
} from '@nestjs/common';
import { SellerService } from './seller.service';
import { SellerDto } from './dto/seller.dto';
import { SellerUsernameValidationPipe } from './pipes/seller-username-validation.pipe';
import { SellerFullNameValidationPipe } from './pipes/seller-fullname-validation.pipe';
import { SellerSearchValidationPipe } from './pipes/seller-search-validation.pipe';

@Controller('sellers')
export class SellerController {
  constructor(private readonly sellerService: SellerService) {}

  // Legacy route for backward compatibility
  @Get()
  getSellerInfo(): string {
    return this.sellerService.getSellerInfo();
  }

  // Create seller with entity and validation
  @Post('create')
  @UsePipes(ValidationPipe, SellerUsernameValidationPipe, SellerFullNameValidationPipe)
  async createSeller(@Body() sellerDto: SellerDto) {
    return await this.sellerService.createSeller(sellerDto);
  }

  // Search sellers by full name
  @Get('search')
  async getSellersByFullName(
    @Query('fullName', SellerSearchValidationPipe) fullName: string,
  ) {
    return await this.sellerService.getSellersByFullNameSubstring(fullName);
  }

  // Get seller by username
  @Get('username/:username')
  async getSellerByUsername(
    @Param('username', SellerUsernameValidationPipe) username: string,
  ) {
    return await this.sellerService.getSellerByUsername(username);
  }

  // Remove seller by username
  @Delete('username/:username')
  async removeSellerByUsername(@Param('username', SellerUsernameValidationPipe) username: string,) {
    return await this.sellerService.removeSellerByUsername(username);
  }

  // Legacy routes for backward compatibility
  @Get('info')
  async getInfo() {
    return await this.sellerService.getInfo();
  }

  @Get('info/:id')
  async getInfoById(@Param('id') id: string) {
    return await this.sellerService.getInfoById(id);
  }

  @Post('add')
  @UsePipes(ValidationPipe, SellerUsernameValidationPipe, SellerFullNameValidationPipe)
  async addSeller(@Body() sellerDto: SellerDto) {
    return await this.sellerService.addSeller(sellerDto);
  }

  @Put('update/:id')
  @UsePipes(ValidationPipe, SellerFullNameValidationPipe)
  async updateUser(@Param('id') id: string, @Body() sellerDto: SellerDto) {
    return await this.sellerService.updateUser(id, sellerDto);
  }

  @Delete('delete/:id')
  async deleteUser(@Param('id') id: string) {
    return await this.sellerService.deleteUser(id);
  }


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

}
