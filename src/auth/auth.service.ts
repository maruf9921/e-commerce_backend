// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Admin } from '../admin/admin.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Admin)
    private adminRepo: Repository<Admin>,
    private jwtService: JwtService,
  ) {}

  // Register a new admin
  async register(name: string, email: string, password: string, age: number) {
    const existing = await this.adminRepo.findOne({ where: { email } });
    if (existing) {
      throw new UnauthorizedException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = this.adminRepo.create({ name, email, password: hashedPassword, age });
    await this.adminRepo.save(admin);

    return { message: 'Admin registered successfully' };
  }

  // Login
  async login(email: string, password: string) {
    const admin = await this.adminRepo.findOne({ where: { email } });
    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { id: admin.id, email: admin.email };
    const token = await this.jwtService.signAsync(payload);

    return { access_token: token };
  }
}
