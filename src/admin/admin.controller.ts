import { Body, Controller, Delete, Get, Put, Param, Post, Query, Patch, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { AdminService } from "./admin.service";
import { JwtAuthGuard } from "../auth/jwt-auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles/roles.guard";
import { Roles } from "../auth/roles.decorator/roles.decorator";
import { Role } from "../users/entities/role.enum";
import { VerifySellerDto, RejectSellerDto } from "./dto/seller-verification.dto";

@Controller('admin')
//@UseGuards(JwtAuthGuard, RolesGuard)
//@Roles(Role.ADMIN)
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
      return this.adminService.updateAdmin(id, updateData);
    }

    // Seller verification endpoints
    @Get('sellers/pending')
    async getPendingSellers() {
      return await this.adminService.getPendingSellers();
    }

    @Get('sellers/verified')
    async getVerifiedSellers() {
      return await this.adminService.getVerifiedSellers();
    }

    @Post('sellers/:id/verify')
    @UsePipes(ValidationPipe)
    async verifySeller(
      @Param('id') sellerId: number,
      @Body() verifyDto: VerifySellerDto = {}
    ) {
      return await this.adminService.verifySeller(Number(sellerId));
    }

    @Post('sellers/:id/reject')
    @UsePipes(ValidationPipe)
    async rejectSeller(
      @Param('id') sellerId: number,
      @Body() rejectDto: RejectSellerDto
    ) {
      return await this.adminService.rejectSeller(
        Number(sellerId), 
        rejectDto.deleteAccount || false
      );
    }
}