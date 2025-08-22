# Environment Variables Setup Guide

## 🚀 Quick Setup

### 1. Create `.env` file in your project root:
```bash
touch .env
```

### 2. Copy this content into your `.env` file:

```env
# ========================================
# E-COMMERCE BACKEND ENVIRONMENT VARIABLES
# ========================================

# ========================================
# APPLICATION CONFIGURATION
# ========================================
NODE_ENV=development
PORT=4000
APP_NAME=E-Commerce Backend
APP_VERSION=1.0.0

# ========================================
# DATABASE CONFIGURATION
# ========================================
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=e_commerce
DB_SYNCHRONIZE=false
DB_LOGGING=true

# ========================================
# JWT CONFIGURATION
# ========================================
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_REFRESH_EXPIRES_IN=7d

# ========================================
# CORS CONFIGURATION
# ========================================
CORS_ORIGIN=http://localhost:3000
CORS_CREDENTIALS=true

# ========================================
# FILE UPLOAD CONFIGURATION
# ========================================
UPLOAD_DEST=./uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp

# ========================================
# EMAIL CONFIGURATION (for mailler service)
# ========================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# ========================================
# SECURITY CONFIGURATION
# ========================================
BCRYPT_ROUNDS=10
RATE_LIMIT_TTL=60
RATE_LIMIT_LIMIT=100

# ========================================
# LOGGING CONFIGURATION
# ========================================
LOG_LEVEL=debug
LOG_FILE=./logs/app.log

# ========================================
# DEVELOPMENT CONFIGURATION
# ========================================
DEBUG=true
SHOW_SQL_QUERIES=true
```

## 🔧 Update Your Configuration Files

### 1. Update `src/app.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
// ... other imports

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'e_commerce',
      entities: [User, Product],
      synchronize: process.env.DB_SYNCHRONIZE === 'true',
      logging: process.env.DB_LOGGING === 'true',
    }),
    // ... other modules
  ],
  // ... rest of module config
})
export class AppModule {}
```

### 2. Update `src/auth/auth.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
// ... other imports

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { 
          expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '1h' 
        },
      }),
      inject: [ConfigService],
    }),
  ],
  // ... rest of module config
})
export class AuthModule {}
```

### 3. Update `src/main.ts`:
```typescript
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const configService = app.get(ConfigService);
  
  app.useGlobalPipes(new ValidationPipe());
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN') || 'http://localhost:3000',
    credentials: configService.get<boolean>('CORS_CREDENTIALS') || true,
  });
  
  const port = configService.get<number>('PORT') || 4000;
  
  try {
    await app.listen(port);
    console.log(`🚀 Application is running on: http://localhost:${port}`);
    console.log(`🌍 Environment: ${configService.get<string>('NODE_ENV')}`);
  } catch (error) {
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Port ${port} is already in use. Please try a different port.`);
      console.error(`💡 You can set a different port using: PORT=3000 npm run start:dev`);
    } else {
      console.error('❌ Failed to start application:', error.message);
    }
    process.exit(1);
  }
}
bootstrap();
```

### 4. Update `src/data-source.ts`:
```typescript
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { User } from './src/users/entities/unified-user.entity';
import { Product } from './src/product/entities/product.entity';

// Load environment variables
config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_HOST || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'e_commerce',
  entities: [User, Product],
  migrations: ['src/migration/*.ts'],
  synchronize: process.env.DB_SYNCHRONIZE === 'true',
  logging: process.env.DB_LOGGING === 'true',
});
```

## 🔒 Security Best Practices

### 1. Never commit `.env` files:
- ✅ `.env` is already in your `.gitignore`
- ✅ Use `.env.example` for team reference
- ✅ Each developer creates their own `.env`

### 2. Use strong secrets:
- ✅ Change `JWT_SECRET` to a strong random string
- ✅ Use different secrets for development/production
- ✅ Consider using a secret manager in production

### 3. Environment-specific files:
```bash
.env                # Default environment variables
.env.local         # Local overrides (gitignored)
.env.development   # Development-specific variables
.env.production    # Production-specific variables
.env.test          # Test-specific variables
```

## 🚀 Usage Examples

### 1. Start with custom port:
```bash
PORT=5000 npm run start:dev
```

### 2. Use different database:
```bash
DB_DATABASE=e_commerce_dev npm run start:dev
```

### 3. Enable SQL logging:
```bash
DB_LOGGING=true npm run start:dev
```

## 📝 Environment Variables Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Application environment | `development` | No |
| `PORT` | Server port | `4000` | No |
| `DB_HOST` | Database host | `localhost` | No |
| `DB_PORT` | Database port | `5432` | No |
| `DB_USERNAME` | Database username | `postgres` | No |
| `DB_PASSWORD` | Database password | `postgres` | No |
| `DB_DATABASE` | Database name | `e_commerce` | No |
| `JWT_SECRET` | JWT signing secret | - | **Yes** |
| `JWT_EXPIRES_IN` | JWT expiration time | `1h` | No |

## 🔍 Troubleshooting

### 1. Environment variables not loading:
- ✅ Check if `.env` file exists in project root
- ✅ Verify `ConfigModule.forRoot()` is imported
- ✅ Restart your application after changes

### 2. Database connection issues:
- ✅ Verify database credentials in `.env`
- ✅ Check if PostgreSQL is running
- ✅ Ensure database exists

### 3. JWT errors:
- ✅ Set `JWT_SECRET` in `.env`
- ✅ Use a strong, unique secret
- ✅ Restart application after changes

## 🎯 Next Steps

1. **Create your `.env` file** with the content above
2. **Update your configuration files** as shown
3. **Test the application** with environment variables
4. **Customize values** for your specific setup
5. **Share `.env.example`** with your team

Your `.gitignore` is already properly configured to protect sensitive information! 🛡️
