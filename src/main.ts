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
    console.log(`🌍 Environment: ${configService.get<string>('NODE_ENV') || 'development'}`);
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
