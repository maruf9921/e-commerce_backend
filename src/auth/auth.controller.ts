// src/auth/auth.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Register route
  @Post('register')
  register(@Body() body: { name: string; email: string; password: string , age: number }) {
    return this.authService.register(body.name, body.email, body.password, body.age);
  }

  // Login route
  @Post('login')
  login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }
}
