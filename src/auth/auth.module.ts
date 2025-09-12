import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthServiceNew } from './auth-new.service';
import { AuthController } from './auth.controller';
import { AuthControllerNew } from './auth-new.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/unified-user.entity';
import { LoginLog } from './entities/login-log.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy/jwt.strategy';
import { RefreshTokenStrategy } from './jwt.strategy/refresh.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, LoginLog, RefreshToken]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'fallback_secret_key',
        signOptions: { 
          expiresIn: configService.get<string>('JWT_ACCESS_EXPIRES_IN') || '15m' 
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, AuthServiceNew, JwtStrategy, RefreshTokenStrategy],
  controllers: [AuthController], // Using updated controller with AuthServiceNew
  exports: [AuthService, AuthServiceNew, JwtStrategy, PassportModule],
})
export class AuthModule {}
