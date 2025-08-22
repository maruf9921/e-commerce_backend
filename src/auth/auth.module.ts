import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/unified-user.entity'; // Changed from TotalUsers
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy/jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]), // Changed from TotalUsers
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'my-fallback-secret-key-for-development',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
