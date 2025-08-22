import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  app.enableCors();
  
  const port = process.env.PORT || 4000;
  
  try {
    await app.listen(port);
    console.log(`🚀 Application is running on: http://localhost:${port}`);
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
