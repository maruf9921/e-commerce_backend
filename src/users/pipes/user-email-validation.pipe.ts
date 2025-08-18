import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class UserEmailValidationPipe implements PipeTransform {
  transform(value: any) {
    if (!value || typeof value !== 'string') {
      throw new BadRequestException('Email is required and must be a string');
    }

    const trimmedValue = value.trim();

    // Email regex pattern
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!emailPattern.test(trimmedValue)) {
      throw new BadRequestException('Please provide a valid email address');
    }

    if (trimmedValue.length > 255) {
      throw new BadRequestException('Email cannot exceed 255 characters');
    }

    return trimmedValue.toLowerCase(); // Normalize email to lowercase
  }
}
