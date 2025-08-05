import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class SellerFullNameValidationPipe implements PipeTransform {
  transform(value: any) {
    if (!value || !value.fullName) {
      return value;
    }

    let fullName = value.fullName.trim();
    
    // Remove extra spaces between words
    fullName = fullName.replace(/\s+/g, ' ');
    
    // Capitalize first letter of each word
    fullName = fullName.replace(/\b\w/g, (char) => char.toUpperCase());
    
    if (fullName.length < 2) {
      throw new BadRequestException('Full name must be at least 2 characters long');
    }

    if (fullName.length > 150) {
      throw new BadRequestException('Full name cannot exceed 150 characters');
    }

    // Check for inappropriate words (basic example)
    const inappropriateWords = ['admin', 'system', 'root'];
    const lowerName = fullName.toLowerCase();
    for (const word of inappropriateWords) {
      if (lowerName.includes(word)) {
        throw new BadRequestException('Full name contains inappropriate content');
      }
    }

    return { ...value, fullName };
  }
}
