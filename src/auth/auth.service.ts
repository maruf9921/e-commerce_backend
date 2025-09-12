import { Injectable, ConflictException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/unified-user.entity';
import { LoginLog } from './entities/login-log.entity';
import { RegisterDto } from './dto/register.dto/register.dto';
import { LoginDto } from './dto/login.dto/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Role } from '../users/entities/role.enum';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(LoginLog) private loginLogRepo: Repository<LoginLog>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { username, password, phone, email, role, fullName } = registerDto;

    // Check if username or email already exists
    const existingUser = await this.userRepo.findOne({ 
      where: [
        { username },
        { email }
      ]
    });
    if (existingUser) throw new ConflictException('Username or Email already exists!');

    const hashedPassword = await bcrypt.hash(password, 10);

    // Map string role to enum
    let userRole: Role;
    switch (role?.toLowerCase()) {
      case 'seller':
        userRole = Role.SELLER;
        break;
      case 'admin':
        userRole = Role.ADMIN;
        break;
      case 'user':
      default:
        userRole = Role.USER;
        break;
    }

    const user = this.userRepo.create({
      username,
      email,
      password: hashedPassword,
      phone,
      fullName,
      role: userRole,
      isActive: true,
      isVerified: userRole === Role.SELLER ? false : true, // Sellers need verification
    } as User);

    const savedUser = await this.userRepo.save(user);

    // Generate JWT token for auto-login after registration
    const payload = { 
      sub: savedUser.id, 
      username: savedUser.username, 
      email: savedUser.email,
      role: savedUser.role,
      isActive: savedUser.isActive,
      isVerified: savedUser.isVerified
    };
    
    const { password: _, ...userResult } = savedUser;
    
    return {
      access_token: this.jwtService.sign(payload),
      user: userResult,
      message: 'Registration successful'
    };
  }

  async login(loginDto: LoginDto, request?: any) {
    const { email: emailOrUsername, password } = loginDto;
    let user: User | null = null;
    let loginSuccess = false;
    let errorMessage = '';

    try {
      // Support login with either username or email
      user = await this.userRepo.findOne({ 
        where: [
          { username: emailOrUsername },
          { email: emailOrUsername }
        ]
      });

      if (!user) {
        errorMessage = 'Invalid credentials';
        throw new UnauthorizedException(errorMessage);
      }

      if (!user.isActive) {
        errorMessage = 'Account is inactive. Please contact administrator.';
        throw new UnauthorizedException(errorMessage);
      }

      // Check if seller is verified
      if (user.role === Role.SELLER && !user.isVerified) {
        errorMessage = 'Seller account is not verified. Please wait for admin approval.';
        throw new ForbiddenException(errorMessage);
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        errorMessage = 'Invalid credentials';
        throw new UnauthorizedException(errorMessage);
      }

      loginSuccess = true;

      const payload = { 
        sub: user.id, 
        username: user.username, 
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        isVerified: user.isVerified
      };
      
      return {
        access_token: this.jwtService.sign(payload),
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          isActive: user.isActive,
          isVerified: user.isVerified
        },
        message: 'Login successful'
      };

    } catch (error) {
      throw error;
    } finally {
      // Log every login attempt
      await this.logLoginAttempt({
        userId: user?.id || null,
        email: emailOrUsername,
        role: user?.role || 'unknown',
        success: loginSuccess,
        errorMessage: loginSuccess ? null : errorMessage,
        ipAddress: this.getClientIp(request),
        userAgent: request?.headers?.['user-agent'] || null
      });
    }
  }

  private async logLoginAttempt(logData: {
    userId: number | null;
    email: string;
    role: string;
    success: boolean;
    errorMessage?: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    try {
      const loginLog = this.loginLogRepo.create({
        userId: logData.userId,
        email: logData.email,
        role: logData.role,
        success: logData.success,
        errorMessage: logData.errorMessage,
        ipAddress: logData.ipAddress,
        userAgent: logData.userAgent
      });
      
      await this.loginLogRepo.save(loginLog);
    } catch (error) {
      console.error('Failed to log login attempt:', error);
      // Don't throw here - login logging failure shouldn't break login
    }
  }

  private getClientIp(request: any): string {
    if (!request) return null;
    
    return request.ip || 
           request.connection?.remoteAddress ||
           request.socket?.remoteAddress ||
           request.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
           null;
  }

  async getLoginLogs(page: number = 1, limit: number = 50) {
    const [logs, total] = await this.loginLogRepo.findAndCount({
      relations: ['user'],
      order: { timestamp: 'DESC' },
      skip: (page - 1) * limit,
      take: limit
    });

    return {
      logs,
      total,
      page,
      pages: Math.ceil(total / limit)
    };
  }
}
