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

        // Generate the correct URL format automatically
        const baseUrl = 'http://localhost:4002'; // Current port
        const imageUrl = `${baseUrl}/products/static/${file.filename}`;

        // Save or process file
        return {
            message: 'Image uploaded successfully!',
            filename: file.filename || file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            path: (file as any).path, // Multer storage path
            imageUrl: imageUrl, // Auto-generated URL for database
        };
    }

    showImage(file: Express.Multer.File) {
        const baseUrl = 'http://localhost:4002';
        const imageUrl = `${baseUrl}/products/static/${file.filename}`;
        
        return {
            filename: file.filename || file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            path: (file as any).path,
            imageUrl: imageUrl,
        };
    }

    async getProductById(id: string): Promise<{ picUrl: string } | null> {
        // Simulate a database call
        const product = { id, picUrl: `${id}.png` };
        return product;
    }

    async getProductImageUrl(productId: string): Promise<string | null> {
        const product = await this.getProductById(productId);
        return product ? product.picUrl : null;
    }

    
}
