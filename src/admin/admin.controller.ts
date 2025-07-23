import { Body, Controller, Delete, Get, Put, Param, Post, Query, Patch } from "@nestjs/common";
import { AdminService } from "./admin.service"; 


@Controller('admin')
export class AdminController {
    constructor(private readonly adminService: AdminService) {}
  
    @Get()
    getAdminInfo(): string {
      return this.adminService.getAdminInfo();
    }

    @Get('getadmin')
    getAdminNameandId(@Query('name') name:string, @Query('id') id:number): object  {
      return this.adminService.getAdminNameandId(name, id);
    }

    

    @Post('addadmin')
    addAdmin(@Body() admindata: object): object {
      
      return this.adminService.addAdmin(admindata);
    }

    @Delete('delete/:id')
    deleteAdmin(@Param('id') id: number): object {
      return this.adminService.deleteAdmin(id);
    }

    @Put('getadmin/:id')
      updateAdmin(
      @Param('id') id: number,
      @Body() updateData: object
    ): object {
  return this.adminService.updateAdmin(id, updateData);
    }

    @Patch('getadmin/:id')
    patchAdmin(
      @Param('id') id: number,
      @Body() updateData: object
    ): object {
      return this.adminService.updateAdmin(id, updateData); // You can create a separate patch method if needed
    }

}