import { PipeTransform, BadRequestException } from '@nestjs/common';

export class StatusValidationPipe implements PipeTransform {
  readonly allowed = ['active', 'inactive'];

  transform(value: any) {
    if (!this.allowed.includes(value.status)) {
      throw new BadRequestException(
        `Invalid status: ${value.status}. Allowed: ${this.allowed.join(', ')}`,
      );
    }
    return value;
  }
}
