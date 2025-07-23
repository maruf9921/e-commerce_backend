import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { CustomerService } from "./customer.service";

@Controller('customer')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get()
  getCustomerInfo(): string {
    return this.customerService.getCustomerInfo();
  }

  @Get('info')
  getInfo(): object[] {
    return this.customerService.getInfo();
  }

  @Get('info/:id')
  getInfoById(@Param('id') id: number): object | undefined {
    return this.customerService.getInfoById(Number(id));
  }

  @Post('add')
  addUser(@Body() user: { id: number; name: string }): object {
    return this.customerService.addUser(user);
  }

  @Put('update/:id')
  updateUser(@Param('id') id: number, @Body('name') name: string): object | undefined {
    return this.customerService.updateUser(Number(id), name);
  }

  @Delete('delete/:id')
  deleteUser(@Param('id') id: number): boolean {
    return this.customerService.deleteUser(Number(id));
  }
}
