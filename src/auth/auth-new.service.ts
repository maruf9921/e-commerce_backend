import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/unified-user.entity';
import { LoginDto } from './dto/login.dto/login.dto';
import { RegisterDto } from './dto/register.dto/register.dto';
import { LoginLog } from './entities/login-log.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { Role } from '../users/entities/role.enum';

export interface TokenPair {
  access_token: string;
  refresh_token: string;
}

@Injectable()
export class AuthServiceNew {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(LoginLog)
    private loginLogRepository: Repository<LoginLog>,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{ message: string; user: any }> {
    const { username, email, password, fullName, phone, role } = registerDto;

    // Check if user already exists
    const existingUser = await this.usersRepository.findOne({
      where: [{ email }, { username }],
    });

    if (existingUser) {
      throw new BadRequestException('User with this email or username already exists');
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Map role
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

    // Create user
    const user = this.usersRepository.create({
      username,
      email,
      password: hashedPassword,
      fullName,
      phone,
      role: userRole,
      isActive: true,
      isVerified: userRole === Role.ADMIN ? true : false, // Admins are pre-verified
    });

    await this.usersRepository.save(user);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return {
      message: 'User registered successfully',
      user: userWithoutPassword,
    };
  }

  async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string): Promise<{ tokens: TokenPair; user: any; message: string }> {
    const { email, password } = loginDto;

    try {
      // Find user by email
      const user = await this.usersRepository.findOne({ where: { email } });
      
      if (!user || !user.isActive) {
        try {
          await this.logLoginAttempt({
            userId: null,
            email,
            role: null,
            success: false,
            errorMessage: 'User not found or inactive',
            ipAddress,
            userAgent
          });
        } catch (logError) {
          console.warn('Failed to log login attempt:', logError.message);
        }
        throw new UnauthorizedException('Invalid credentials');
      }

      // Validate password
      console.log('🔧 Validating password for:', email);
      console.log('🔧 Stored password hash:', user.password?.substring(0, 20) + '...');
      console.log('🔧 Provided password:', password);
      
      const isPasswordValid = await bcrypt.compare(password, user.password);
      console.log('🔧 Password validation result:', isPasswordValid);
      
      if (!isPasswordValid) {
        try {
          await this.logLoginAttempt({
            userId: user.id,
            email,
            role: user.role.toString(),
            success: false,
            errorMessage: 'Invalid password',
            ipAddress,
            userAgent
          });
        } catch (logError) {
          console.warn('Failed to log login attempt:', logError.message);
        }
        throw new UnauthorizedException('Invalid credentials');
      }

      // Check seller verification
      if (user.role === Role.SELLER && !user.isVerified) {
        await this.logLoginAttempt({
          userId: user.id,
          email,
          role: user.role.toString(),
          success: false,
          errorMessage: 'Seller account not verified',
          ipAddress,
          userAgent
        });
        throw new UnauthorizedException('Your seller account is pending verification. Please contact support.');
      }

      // Generate tokens
      const tokens = await this.generateTokenPair(user, ipAddress, userAgent);

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      // Log successful login
      try {
        await this.logLoginAttempt({
          userId: user.id,
          email,
          role: user.role.toString(),
          success: true,
          errorMessage: null,
          ipAddress,
          userAgent
        });
      } catch (logError) {
        console.warn('Failed to log login attempt:', logError.message);
        // Continue with login even if logging fails
      }

      return {
        tokens,
        user: userWithoutPassword,
        message: 'Login successful'
      };
    } catch (error) {
      // If it's already an UnauthorizedException, rethrow it
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      // Log unexpected errors
      try {
        await this.logLoginAttempt({
          userId: null,
          email,
          role: null,
          success: false,
          errorMessage: `Unexpected error: ${error.message}`,
          ipAddress,
          userAgent
        });
      } catch (logError) {
        console.warn('Failed to log failed login attempt:', logError.message);
      }
      
      throw new UnauthorizedException('Login failed');
    }
  }

  async generateTokenPair(user: User, ipAddress?: string, userAgent?: string): Promise<TokenPair> {
    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      role: user.role.toString(),
      isActive: user.isActive,
      isVerified: user.isVerified,
    };

    // Generate access token (short-lived)
    const access_token = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') || '15m',
    });

    // Generate refresh token (long-lived)
    const refresh_token = this.jwtService.sign(
      { sub: user.id, type: 'refresh' },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'refresh_secret_key',
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d',
      }
    );

    // Store refresh token in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    // Revoke existing refresh tokens for this user
    await this.refreshTokenRepository.update(
      { userId: user.id, isRevoked: false },
      { isRevoked: true }
    );

    // Create new refresh token record
    const refreshTokenEntity = this.refreshTokenRepository.create({
      token: refresh_token,
      userId: user.id,
      expiresAt,
      ipAddress,
      userAgent,
    });

    await this.refreshTokenRepository.save(refreshTokenEntity);

    return { access_token, refresh_token };
  }

  async refreshTokens(refreshToken: string, ipAddress?: string, userAgent?: string): Promise<TokenPair> {
    const tokenRecord = await this.refreshTokenRepository.findOne({
      where: { token: refreshToken, isRevoked: false },
      relations: ['user'],
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (!tokenRecord.user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    // Generate new token pair
    const tokens = await this.generateTokenPair(tokenRecord.user, ipAddress, userAgent);

    return tokens;
  }

  async validateRefreshToken(refreshToken: string, userId: number): Promise<User | null> {
    const tokenRecord = await this.refreshTokenRepository.findOne({
      where: { 
        token: refreshToken, 
        userId, 
        isRevoked: false 
      },
      relations: ['user'],
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      return null;
    }

    return tokenRecord.user;
  }

  async logout(refreshToken?: string): Promise<void> {
    if (refreshToken) {
      await this.refreshTokenRepository.update(
        { token: refreshToken },
        { isRevoked: true }
      );
    }
  }

  async logoutAllDevices(userId: number): Promise<void> {
    await this.refreshTokenRepository.update(
      { userId, isRevoked: false },
      { isRevoked: true }
    );
  }

  private async logLoginAttempt(logData: {
    userId: number | null;
    email: string;
    role: string | null;
    success: boolean;
    errorMessage: string | null;
    ipAddress?: string;
    userAgent?: string;
  }) {
    try {
      const loginLog = this.loginLogRepository.create({
        userId: logData.userId,
        email: logData.email,
        role: logData.role || 'UNKNOWN',
        success: logData.success,
        errorMessage: logData.errorMessage,
        ipAddress: logData.ipAddress,
        userAgent: logData.userAgent,
        timestamp: new Date()
      });

      await this.loginLogRepository.save(loginLog);
    } catch (error) {
      // Don't let logging errors affect the main authentication flow
      console.error('Failed to log login attempt:', error);
    }
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersRepository.findOne({ where: { email } });
    
    if (user && await bcrypt.compare(password, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async findUserById(id: number): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }
}
