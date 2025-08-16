import { Controller , Get ,Post ,Param } from '@nestjs/common';
import { ImageUploadService } from './image-upload.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadedFile, UseInterceptors } from '@nestjs/common';

@Controller('image-upload')
export class ImageUploadController {

    constructor(private readonly imageUploadService: ImageUploadService) {}

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadImage(@UploadedFile() file: Express.Multer.File) {
        return this.imageUploadService.processImageUpload(file);
    }

   
}
