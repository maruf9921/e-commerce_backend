import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  const configService = app.get(ConfigService);
  
  app.useGlobalPipes(new ValidationPipe());
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN') || 'http://localhost:3000',
    credentials: configService.get<boolean>('CORS_CREDENTIALS') || true,
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

