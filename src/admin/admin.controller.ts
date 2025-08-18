import { 
  Controller, Get, Post, Put, Patch, Delete, Param, Body, Query, ParseIntPipe, 
  UsePipes, ValidationPipe 
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminDto } from './dto/admin.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { UpdateEmailDto } from './dto/update-email.dto';
import { StatusValidationPipe } from './pipes/status-validation.pipe';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  getAll() {
    return this.adminService.findAll();
  }

  @Get(':id')
  getById(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.findOne(id);
  }

  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  create(@Body() dto: AdminDto) {
    return this.adminService.create(dto);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: AdminDto) {
    return this.adminService.update(id, dto);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number, 
    @Body(StatusValidationPipe) dto: UpdateStatusDto
  ) {
    return this.adminService.updateStatus(id, dto.status);
  }

  @Patch(':id/email')
  updateEmail(
    @Param('id', ParseIntPipe) id: number, 
    @Body() dto: UpdateEmailDto
  ) {
    return this.adminService.updateEmail(id, dto.email);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.remove(id);
  }

  @Get('search/age')
  searchByAge(
    @Query('min', ParseIntPipe) min: number, 
    @Query('max', ParseIntPipe) max: number
  ) {
    return this.adminService.findByAgeRange(min, max);
  }
}
