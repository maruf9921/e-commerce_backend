import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { config } from 'dotenv';
config()

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  const configService = app.get(ConfigService);
  
  app.useGlobalPipes(new ValidationPipe());
  
  // Get CORS origins from environment variable or use defaults
  const corsOrigins = process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
    : [
        'http://localhost:3000', // Next.js default port
        'http://localhost:4050', // Your frontend port
        'http://localhost:4051', // Alternative frontend port
      ];
  
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // FIXED: Proper static file serving configuration
  const imagePath = join(__dirname, '..', 'image');
  console.log('📁 Static image path:', imagePath);
  
  app.useStaticAssets(imagePath, {
    prefix: '/images/',
    setHeaders: (res, path) => {
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Cache-Control', 'public, max-age=31536000');
    }
  });

  // NEW: Static serving for uploaded images - FIXED PATH
  const uploadsPath = join(process.cwd(), 'uploads');
  console.log('📁 Uploads path:', uploadsPath);
  
  app.useStaticAssets(uploadsPath, {
    prefix: '/uploads/',
    setHeaders: (res, path) => {
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Cache-Control', 'public, max-age=31536000');
    }
  });

  const port = configService.get<number>('PORT') || 4050;

  try {
    await app.listen(port);
    console.log(`🚀 Application is running on: http://localhost:${port}`);
    console.log(`🌍 Environment: ${configService.get<string>('NODE_ENV') || 'development'}`);
    console.log(`📁 Images available at: http://localhost:${port}/images/`);
    console.log(`🔧 API endpoints available at: http://localhost:${port}/products/`);
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

