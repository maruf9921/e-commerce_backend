import { Controller, Get, Post, Put, Delete, Body, Param, UsePipes, ValidationPipe } from '@nestjs/common';
import { SellerService } from "./seller.service";
import { SellerDto } from './dto/seller.dto';

@Controller('seller')
export class SellerController {
  constructor(private readonly sellerService: SellerService) {}

  @Get()
  getSellerInfo(): string {
    return this.sellerService.getSellerInfo();
  }

  @Get('info')
  getInfo(): object[] {
    return this.sellerService.getInfo();
  }

  @Get('info/:id')
  getInfoById(@Param('id') id: number): object | undefined {
    return this.sellerService.getInfoById(Number(id));
  }

  @Post('add')
  @UsePipes(ValidationPipe)
  addUser(@Body() sellerDto: SellerDto): object {
    return this.sellerService.addSeller(sellerDto);
  }

  @Put('update/:id')
  @UsePipes(ValidationPipe)
  updateUser(@Param('id') id: number, @Body() sellerDto: SellerDto): object | undefined {
    return this.sellerService.updateUser(Number(id), sellerDto);
  }

  @Delete('delete/:id')
  deleteUser(@Param('id') id: number): boolean {
    return this.sellerService.deleteUser(Number(id));
  }
}
