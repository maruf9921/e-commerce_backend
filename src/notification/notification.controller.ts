import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
  ParseIntPipe,
} from '@nestjs/common';
import { NotificationService, NotificationData } from './notification.service';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles/roles.guard';
import { Roles } from '../auth/roles.decorator/roles.decorator';
import { Role } from '../users/entities/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  // ======= ADMIN ENDPOINTS =======

  // Send notification to specific user (Admin only)
  @Post('send-to-user/:userId')
  @Roles(Role.ADMIN,Role.SELLER)
  @UsePipes(ValidationPipe)
  async sendToUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() notification: NotificationData
  ): Promise<{ success: boolean; channelName: string; eventName: string; error?: undefined; } | { success: boolean; error: any; channelName?: undefined; eventName?: undefined; }> {
    return this.notificationService.sendToUser(userId, notification);
  }

  // Send notification to multiple users (Admin only)
  @Post('send-to-users')
  @Roles(Role.ADMIN)
  @UsePipes(ValidationPipe)
  async sendToUsers(
    @Body() data: { userIds: number[]; notification: NotificationData }
  ) {
    return this.notificationService.sendToUsers(data.userIds, data.notification);
  }

  // Send notification to all users with specific role (Admin only)
  @Post('send-to-role/:role')
  @Roles(Role.ADMIN)
  @UsePipes(ValidationPipe)
  async sendToRole(
    @Param('role') role: string,
    @Body() notification: NotificationData
  ) {
    return this.notificationService.sendToRole(role, notification);
  }

  // Send broadcast notification (Admin only)
  @Post('broadcast')
  @Roles(Role.ADMIN)
  @UsePipes(ValidationPipe)
  async sendBroadcast(@Body() notification: NotificationData) {
    return this.notificationService.sendBroadcast(notification);
  }

  // Send system maintenance notification (Admin only)
  @Post('system/maintenance')
  @Roles(Role.ADMIN)
  @UsePipes(ValidationPipe)
  async notifySystemMaintenance(
    @Body() maintenanceData: {
      startTime: string;
      endTime: string;
      description: string;
    }
  ) {
    return this.notificationService.notifySystemMaintenance({
      startTime: new Date(maintenanceData.startTime),
      endTime: new Date(maintenanceData.endTime),
      description: maintenanceData.description
    });
  }

  // ======= SELLER ENDPOINTS =======

  // Send test notification to current user
  @Post('test')
  @Roles(Role.ADMIN, Role.SELLER, Role.USER)
  async sendTestNotification(@CurrentUser() user: any) {
    return this.notificationService.sendTestNotification(user.id);
  }

  // ======= E-COMMERCE SPECIFIC ENDPOINTS =======

  // Trigger order placed notification (Internal use / Admin)
  @Post('order/placed')
  @Roles( Role.USER)
  @UsePipes(ValidationPipe)
  async notifyOrderPlaced(@Body() order: any): Promise<void> {
    return this.notificationService.notifyOrderPlaced(order);
  }

  // Trigger order status update notification (Internal use / Admin)
  @Post('order/status-update')
  @Roles(Role.ADMIN, Role.SELLER, Role.USER)
  @UsePipes(ValidationPipe)
  async notifyOrderStatusUpdate(
    @Body() data: { order: any; oldStatus: string; newStatus: string }
  ): Promise<void> {
    return this.notificationService.notifyOrderStatusUpdate(
      data.order,
      data.oldStatus,
      data.newStatus
    );
  }

  // Trigger payment processed notification (Internal use / Admin)
  @Post('payment/processed')
  @Roles(Role.ADMIN)
  @UsePipes(ValidationPipe)
  async notifyPaymentProcessed(@Body() payment: any) {
    return this.notificationService.notifyPaymentProcessed(payment);
  }

  // Trigger payment failed notification (Internal use / Admin)
  @Post('payment/failed')
  @Roles(Role.ADMIN)
  @UsePipes(ValidationPipe)
  async notifyPaymentFailed(
    @Body() data: { payment: any; reason: string }
  ) {
    return this.notificationService.notifyPaymentFailed(data.payment, data.reason);
  }

  // Trigger seller verification update notification (Admin only)
  @Post('seller/verification-update')
  @Roles(Role.ADMIN)
  @UsePipes(ValidationPipe)
  async notifySellerVerificationUpdate(
    @Body() data: { sellerId: number; isVerified: boolean }
  ) {
    return this.notificationService.notifySellerVerificationUpdate(
      data.sellerId,
      data.isVerified
    );
  }

  // Trigger payout processed notification (Admin only)
  @Post('payout/processed')
  @Roles(Role.ADMIN)
  @UsePipes(ValidationPipe)
  async notifyPayoutProcessed(
    @Body() data: { sellerId: number; payoutData: any }
  ) {
    return this.notificationService.notifyPayoutProcessed(
      data.sellerId,
      data.payoutData
    );
  }

  // Trigger low stock alert notification (Admin or Seller)
  @Post('product/low-stock')
  @Roles(Role.ADMIN, Role.SELLER)
  @UsePipes(ValidationPipe)
  async notifyLowStock(
    @Body() data: { sellerId?: number; products: any[] },
    @CurrentUser() user: any
  ) {
    const sellerId = user.role === Role.ADMIN && data.sellerId ? data.sellerId : user.id;
    return this.notificationService.notifyLowStock(sellerId, data.products);
  }

  // Trigger out of stock notification (Admin or Seller)
  @Post('product/out-of-stock')
  @Roles(Role.ADMIN, Role.SELLER)
  @UsePipes(ValidationPipe)
  async notifyProductOutOfStock(
    @Body() data: { sellerId?: number; product: any },
    @CurrentUser() user: any
  ) {
    const sellerId = user.role === Role.ADMIN && data.sellerId ? data.sellerId : user.id;
    return this.notificationService.notifyProductOutOfStock(sellerId, data.product);
  }

  // ======= PUSHER AUTHENTICATION =======

  // Authenticate user for private channels
  @Post('auth')
  @Roles(Role.ADMIN, Role.SELLER, Role.USER)
  @UsePipes(ValidationPipe)
  async authenticateUser(
    @Body() data: { socket_id: string; channel_name: string },
    @CurrentUser() user: any
  ) {
    try {
      const auth = this.notificationService.authenticateUser(
        data.socket_id,
        data.channel_name,
        user.id
      );
      return auth;
    } catch (error) {
      return { error: error.message };
    }
  }

  // ======= UTILITY ENDPOINTS =======

  // Health check for notification system
  @Get('health')
  @Roles(Role.ADMIN)
  async healthCheck() {
    return this.notificationService.healthCheck();
  }

  // Get notification system status
  @Get('status')
  @Roles(Role.ADMIN)
  async getStatus() {
    const health = await this.notificationService.healthCheck();
    return {
      service: 'NotificationService',
      pusher: {
        cluster: process.env.PUSHER_CLUSTER || 'ap2',
        configured: !!(process.env.PUSHER_APP_ID && process.env.PUSHER_KEY && process.env.PUSHER_SECRET)
      },
      health
    };
  }
}