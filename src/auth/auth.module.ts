import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TotalUsers } from '../users/entities/totalUsers.entity';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy/local.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([TotalUsers]),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-fallback-secret-key-for-development', 
      signOptions: { expiresIn: '10m' },
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
