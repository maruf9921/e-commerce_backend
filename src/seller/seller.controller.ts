import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { SellerService } from "./seller.service";

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
  addUser(@Body() user: { id: number; name: string }): object {
    return this.sellerService.addUser(user);
  }

  @Put('update/:id')
  updateUser(@Param('id') id: number, @Body('name') name: string): object | undefined {
    return this.sellerService.updateUser(Number(id), name);
  }

  @Delete('delete/:id')
  deleteUser(@Param('id') id: number): boolean {
    return this.sellerService.deleteUser(Number(id));
  }
}
