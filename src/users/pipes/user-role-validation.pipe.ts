import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class UserRoleValidationPipe implements PipeTransform {
  private readonly validRoles = ['user', 'admin', 'seller'];

  transform(value: any) {
    if (!value) {
      return 'user'; // Default role
    }

    if (typeof value !== 'string') {
      throw new BadRequestException('Role must be a string');
    }

    const trimmedValue = value.trim().toLowerCase();

    if (!this.validRoles.includes(trimmedValue)) {
      throw new BadRequestException(`Role must be one of: ${this.validRoles.join(', ')}`);
    }

    return trimmedValue;
  }
}
