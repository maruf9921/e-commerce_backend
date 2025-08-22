import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/unified-user.entity';
import { RegisterDto } from './dto/register.dto/register.dto';
import { LoginDto } from './dto/login.dto/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Role } from '../users/entities/role.enum';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>, // Changed from TotalUsers
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<Partial<User>> { // Changed return type
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

    const user = this.userRepo.create({
      username,
      email,
      password: hashedPassword,
      phone,
      fullName,
      role: role || Role.USER,
      isActive: true,
    } as User);

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
