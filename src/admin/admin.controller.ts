import { Body, Controller, UploadedFile, UseInterceptors, ParseIntPipe, Delete, Get, Put, Param, Post, Query, Patch } from "@nestjs/common";
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { AdminService } from "./admin.service"; 
import { AdminDto } from "./dto/admin.dto";
import { UpdateStatusDto } from './dto/update-status.dto';


@Controller('admin')
export class AdminController {
    constructor(private readonly adminService: AdminService) {}


  @Post()
  create(@Body() dto: AdminDto) {
    return this.adminService.createAdmin(dto);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.adminService.updateStatus(id, dto);
  }

  @Get('inactive')
  getInactiveAdmins() {
    return this.adminService.getInactiveAdmins();
  }

  @Get('older-than-40')
  getAdminsOlderThan40() {
    return this.adminService.getAdminsOlderThan40();
  }  

    
  
  //   @Get()
  //   getAdminInfo(): string {
  //     return this.adminService.getAdminInfo();
  //   }

  //   @Get('getadmin')
  //   getAdminNameandId(@Query('name') name:string, @Query('id') id:number): object  {
  //     return this.adminService.getAdminNameandId(name, id);
  //   }

    

  //   // @Post('addadmin')
  //   // addAdmin(@Body() AdminDto: AdminDto) {
  //   //   console.log(AdminDto);
  //   //   return this.adminService.addAdmin(AdminDto);
  //   // }

  //   @Post('addadmin')
  //   @UseInterceptors(FileInterceptor('file', {
  //   fileFilter: (req, file, cb) => {
  //     if (file.originalname.match(/\.(jpg|jpeg|png|webp)$/)) {
  //       cb(null, true);
  //     } else {
  //       cb(new Error('Only image files are allowed'), false);
  //     }
  //   },
  //   limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  //   storage: diskStorage({
  //     destination: './uploads',
  //     filename: (req, file, cb) => {
  //       cb(null, Date.now() + '-' + file.originalname);
  //     }
  //   })
  //   }))
  // addAdmin(@Body() AdminDto: AdminDto, @UploadedFile() file: Express.Multer.File) {
  //   console.log(AdminDto);
  //   console.log(file);
  //   return {
  //     message: 'File uploaded successfully',
  //     file: {
  //       data: AdminDto,
  //       originalName: file.originalname,
  //       filename: file.filename,
  //       size: file.size,
  //     }
  //   };
  // }

  //   @Delete('delete/:id')
  //   deleteAdmin(@Param('id') id: number): object {
  //     return this.adminService.deleteAdmin(id);
  //   }

  //   @Put('getadmin/:id')
  //     updateAdmin(
  //     @Param('id') id: number,
  //     @Body() updateData: object
  //   ): object {
  // return this.adminService.updateAdmin(id, updateData);
  //   }

  //   @Patch('getadmin/:id')
  //   patchAdmin(
  //     @Param('id') id: number,
  //     @Body() updateData: object
  //   ): object {
  //     return this.adminService.updateAdmin(id, updateData); // You can create a separate patch method if needed
  //   }

}