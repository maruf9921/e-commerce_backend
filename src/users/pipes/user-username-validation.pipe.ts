import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class UserUsernameValidationPipe implements PipeTransform {
  transform(value: any) {
    if (!value || typeof value !== 'string') {
      throw new BadRequestException('Username is required and must be a string');
    }

    const trimmedValue = value.trim();

    if (trimmedValue.length < 3) {
      throw new BadRequestException('Username must be at least 3 characters long');
    }

    if (trimmedValue.length > 100) {
      throw new BadRequestException('Username cannot exceed 100 characters');
    }

    if (!/^[a-zA-Z0-9_]+$/.test(trimmedValue)) {
      throw new BadRequestException('Username can only contain letters, numbers, and underscores');
    }

    return trimmedValue;
  }
}
