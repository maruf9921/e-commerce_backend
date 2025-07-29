import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class FileUploadService {
  async processFileUpload(file: Express.Multer.File) {

    if (!file) {
      throw new BadRequestException('No File Uploaded!');
    }
    // Mime-type validation
    if (!['application/pdf'].includes(file.mimetype)) {
      throw new BadRequestException('Only PDF Files are allowed!');
    }
    // File size validation
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('File size must be less than 5MB');
    }
    // Here you can save file.path or buffer to storage/DB or elsewhere
    return {
      message: 'File uploaded successfully!',
      filename: file.filename || file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: (file as any).path, // যদি storage path থাকে
    };
  }

  ShowFile(file: Express.Multer.File){
    return {
      filename: file.filename || file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: (file as any).path, // যদি storage path থাকে
    };
  }
}
