import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class SellerUsernameValidationPipe implements PipeTransform {
  transform(value: any) {
    if (!value) {
      throw new BadRequestException('Username is required');
    }

    const username = typeof value === 'string' ? value : value.username;
    
    if (!username) {
      throw new BadRequestException('Username cannot be empty');
    }

    // Clean and normalize username
    const cleanUsername = username.toString().trim().toLowerCase();
    
    if (cleanUsername.length < 3) {
      throw new BadRequestException('Username must be at least 3 characters long');
    }

    if (cleanUsername.length > 100) {
      throw new BadRequestException('Username cannot exceed 100 characters');
    }

    // Check for reserved usernames
    const reservedUsernames = ['admin', 'root', 'system', 'seller', 'test'];
    if (reservedUsernames.includes(cleanUsername)) {
      throw new BadRequestException('This username is reserved and cannot be used');
    }

    return typeof value === 'string' ? cleanUsername : { ...value, username: cleanUsername };
  }
}
