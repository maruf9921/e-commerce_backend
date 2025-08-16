import { Injectable } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';

@Injectable()
export class ImageUploadService {
    async processImageUpload(file: Express.Multer.File) {
  if (!file) {
    throw new BadRequestException('No file uploaded!');
  }

  // Mime-type validation (image only)
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedMimeTypes.includes(file.mimetype)) {
    throw new BadRequestException('Only JPG, PNG, GIF, and WEBP files are allowed!');
  }

  // File size validation (e.g., 3 MB limit)
  const maxSize = 3 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new BadRequestException('Image size must be less than 3MB');
  }

  // Save or process file
  return {
    message: 'Image uploaded successfully!',
    filename: file.filename || file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    path: (file as any).path, // Multer storage path
  };
}

showImage(file: Express.Multer.File) {
  return {
    filename: file.filename || file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    path: (file as any).path,
  };
}

}
