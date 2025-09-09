import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../../users/entities/role.enum';

@Injectable()
export class SellerVerifiedGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // Check if user is a seller
    if (user.role !== Role.SELLER) {
      throw new ForbiddenException('This endpoint is only accessible to sellers');
    }

    // Check if seller is verified
    if (!user.isVerified) {
      throw new ForbiddenException('Your seller account is pending verification. Please wait for admin approval.');
    }

    // Check if seller is active
    if (!user.isActive) {
      throw new ForbiddenException('Your seller account has been deactivated');
    }

    return true;
  }
}
