import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UsePipes,
  ValidationPipe,
  Query,
  UseGuards,
  UseFilters,
  HttpException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { UserLoginDto } from './dto/user-login.dto';
import { Role } from './entities/role.enum';
import { UserUsernameValidationPipe } from './pipes/user-username-validation.pipe';
import { UserEmailValidationPipe } from './pipes/user-email-validation.pipe';
import { UserRoleValidationPipe } from './pipes/user-role-validation.pipe';
import { JwtAuthGuard } from 'src/auth/jwt-auth/jwt-auth.guard';
import { AuthGuard } from '@nestjs/passport';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ================================
  // SPECIFIC ROUTES FIRST (Order matters!)
  // ================================

  // Get all users
 
  @Get()
  async getAllUsers() {
    return await this.usersService.getAllUsers();
  }

  // Create new user with validation
  @Post('create')
  @UsePipes(ValidationPipe)
  async createUser(@Body() createUserDto: CreateUserDto) {
    return await this.usersService.createUser(createUserDto);
  }

  // User login endpoint (REMOVED GUARD - Public access needed!)
  @Post('login')
  @UsePipes(ValidationPipe)
  async loginUser(@Body() loginDto: UserLoginDto) {
    // Redirect to auth service for proper JWT authentication
    return { 
      message: 'Use /auth/login for authentication',
      redirectUrl: '/auth/login',
      note: 'This endpoint redirects to proper auth service'
    };
  }

  // Get users by role with validation
  @Get('role/:role')
  async getUsersByRole(
    @Param('role', UserRoleValidationPipe) role: Role
  ) {
    return await this.usersService.getUsersByRole(role);
  }

  // Get active users
  @Get('status/active')
  async getActiveUsers() {
    return await this.usersService.getActiveUsers();
  }

  // Get user by username with validation (MOVED AFTER SPECIFIC ROUTES)
  @Get('username/:username')
  async getUserByUsername(
    @Param('username', UserUsernameValidationPipe) username: string
  ) {
    return await this.usersService.getUserByUsername(username);
  }

  // ================================
  // DYNAMIC ROUTES LAST (with :id parameter)
  // ================================

  // Get user by ID
  @Get(':id')
  async getUserById(@Param('id', ParseIntPipe) id: number) {
    return await this.usersService.getUserById(id);
  }

  // Update user with validation
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  @UsePipes(ValidationPipe)
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return await this.usersService.updateUser(id, updateUserDto);
  }

  // Toggle user status (active/inactive)
  @UseGuards(JwtAuthGuard)
  @Put(':id/toggle-status')
  async toggleUserStatus(@Param('id', ParseIntPipe) id: number) {
    return await this.usersService.toggleUserStatus(id);
  }

  // Delete user
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteUser(@Param('id', ParseIntPipe) id: number) {
    return await this.usersService.deleteUser(id);
  }
}
