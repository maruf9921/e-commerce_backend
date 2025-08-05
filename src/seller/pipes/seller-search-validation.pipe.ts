import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class SellerSearchValidationPipe implements PipeTransform {
  transform(value: string) {
    if (!value) {
      throw new BadRequestException('Search term is required');
    }

    const searchTerm = value.toString().trim();
    
    if (searchTerm.length < 1) {
      throw new BadRequestException('Search term cannot be empty');
    }

    if (searchTerm.length > 150) {
      throw new BadRequestException('Search term too long');
    }

    // Remove special characters for security
    const cleanedTerm = searchTerm.replace(/[^a-zA-Z\s]/g, '');
    
    if (cleanedTerm.length === 0) {
      throw new BadRequestException('Search term must contain valid characters');
    }

    return cleanedTerm;
  }
}
