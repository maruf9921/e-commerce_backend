import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TotalUsers } from '../users/entities/totalUsers.entity';
import { RegisterDto } from './dto/register.dto/register.dto';
import { LoginDto } from './dto/login.dto/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Role } from '../users/entities/role.enum';
import { access } from 'fs';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(TotalUsers) private userRepo: Repository<TotalUsers>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<Partial<TotalUsers>> {
    const { username, password, phone, email, role } = registerDto;

    // Check if username already exists
    const existingUser = await this.userRepo.findOne({ where: { username } });
    if (existingUser) throw new ConflictException('Username already exists');

    // Check if email already exists
    const existingEmail = await this.userRepo.findOne({ where: { email } });
    if (existingEmail) throw new ConflictException('Email already exists');

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = this.userRepo.create({
      username,
      email,
      password: hashedPassword,
      phone,
      role: role || Role.USER, // Use provided role or default to USER
      isActive: true,
    });

    await this.userRepo.save(user);

    const { password: _, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto) {
    const { username, password } = loginDto;

    const user = await this.userRepo.findOne({ where: { username } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive. Please contact administrator.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw new UnauthorizedException('Invalid credentials');

    const payload = { 
      sub: user.id, 
      username: user.username, 
      email: user.email,
      role: user.role,
      isActive: user.isActive
    };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      },
      tokenType: 'Bearer',
      expiresIn: '1h'
    };
  }
}
