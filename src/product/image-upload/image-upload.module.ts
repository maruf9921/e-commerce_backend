import { Module } from '@nestjs/common';
import { ImageUploadController } from './image-upload.controller';
import { ImageUploadService } from './image-upload.service';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads/images',
        filename: (req, file, cb) => {
          const filename: string = file.originalname.replace(/\s/g, '') + uuidv4();
          const extension: string = file.mimetype.split('/')[1];
          cb(null, `${filename}.${extension}`);
        },
      }),
    })
    
  ],
  controllers: [ImageUploadController],
  providers: [ImageUploadService],
  exports: [ImageUploadService] // Export the service so other modules can use it
})
export class ImageUploadModule {}


