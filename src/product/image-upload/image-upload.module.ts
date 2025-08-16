import { Module } from '@nestjs/common';
import { ImageUploadController } from './image-upload.controller';
import { ImageUploadService } from './image-upload.service';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: './image',
        filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
        })
      })
    
  ],
  controllers: [ImageUploadController],
  providers: [ImageUploadService]
})
export class ImageUploadModule {}
