import { Controller, Post, Body, UsePipes, ValidationPipe, Res, UseGuards, Get, Req, UnauthorizedException, Ip, Headers } from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthServiceNew } from './auth-new.service'; // Use the newer service
import { RegisterDto } from './dto/register.dto/register.dto';
import { LoginDto } from './dto/login.dto/login.dto';
import { JwtAuthGuard } from './jwt-auth/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthServiceNew) {} // Updated to use AuthServiceNew

  @Post('register')
  @UsePipes(ValidationPipe)
  async register(@Body() registerDto: RegisterDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.authService.register(registerDto);
    
    // No automatic token generation in the new service for registration
    return result;
  }

  @Post('login')
  @UsePipes(ValidationPipe)
  async login(
    @Body() loginDto: LoginDto, 
    @Res({ passthrough: true }) response: Response,
    @Req() request: Request,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string
  ) {
    try {
      const result = await this.authService.login(loginDto, ip, userAgent);
      
      // Set HTTP-only cookies for both tokens
      response.cookie('access_token', result.tokens.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000, // 15 minutes
      });
      
      response.cookie('refresh_token', result.tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
      
      return {
        message: result.message,
        user: result.user
      };
    } catch (error) {
      // Check if it's a seller verification error
      if (error.message && error.message.includes('pending verification')) {
        throw new UnauthorizedException({
          message: error.message,
          needsVerification: true
        });
      }
      throw error;
    }
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() request: any) {
    return {
      user: request.user
    };
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) response: Response) {
    // Clear the HTTP-only cookie
    response.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    
    return { message: 'Logged out successfully' };
  }
}
