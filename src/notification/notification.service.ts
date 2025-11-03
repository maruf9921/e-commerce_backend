import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/unified-user.entity';
import { Order } from '../order/entities/order.entity';
import * as Pusher from 'pusher';

export interface NotificationData {
  type: 'order' | 'payment' | 'verification' | 'payout' | 'product' | 'system';
  title: string;
  message: string;
  data?: Record<string, any>;
  urgent?: boolean;
  actionUrl?: string;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private pusher: Pusher;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
  ) {
    // Initialize Pusher with environment variables
    this.pusher = new Pusher({
      appId: process.env.PUSHER_APP_ID || '',
      key: process.env.PUSHER_KEY || '',
      secret: process.env.PUSHER_SECRET || '',
      cluster: process.env.PUSHER_CLUSTER || 'ap2',
      useTLS: true,
    });

    // Log Pusher configuration (without secret)
    this.logger.log(`Pusher configured for cluster: ${process.env.PUSHER_CLUSTER || 'ap2'}`);
  }

  // ======= CORE NOTIFICATION METHODS =======

  // Send notification to specific user
  async sendToUser(userId: number, notification: NotificationData) {
    try {
      const channelName = `user-${userId}`;
      const eventName = `notification-${notification.type}`;

      const payload = {
        ...notification,
        timestamp: new Date().toISOString(),
        userId
      };

      await this.pusher.trigger(channelName, eventName, payload);
      
      this.logger.log(`Notification sent to user ${userId}: ${notification.title}`);
      return { success: true, channelName, eventName };
    } catch (error) {
      this.logger.error(`Failed to send notification to user ${userId}:`, error);
      return { success: false, error: error.message };
    }
  }

  // Send notification to multiple users
  async sendToUsers(userIds: number[], notification: NotificationData) {
    const results = await Promise.allSettled(
      userIds.map(userId => this.sendToUser(userId, notification))
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;

    this.logger.log(`Bulk notification sent: ${successful} successful, ${failed} failed`);
    return { successful, failed, total: results.length };
  }

  // Send notification to all users with specific role
  async sendToRole(role: string, notification: NotificationData) {
    const users = await this.userRepository.find({
      where: { role: role as any, isActive: true },
      select: ['id']
    });

    const userIds = users.map(user => user.id);
    return this.sendToUsers(userIds, notification);
  }

  // Send broadcast notification to all active users
  async sendBroadcast(notification: NotificationData) {
    try {
      const channelName = 'public-notifications';
      const eventName = `broadcast-${notification.type}`;

      const payload = {
        ...notification,
        timestamp: new Date().toISOString(),
        broadcast: true
      };

      await this.pusher.trigger(channelName, eventName, payload);
      
      this.logger.log(`Broadcast notification sent: ${notification.title}`);
      return { success: true, channelName, eventName };
    } catch (error) {
      this.logger.error('Failed to send broadcast notification:', error);
      return { success: false, error: error.message };
    }
  }

  // ======= E-COMMERCE SPECIFIC NOTIFICATION METHODS =======

  // Order-related notifications
  async notifyOrderPlaced(order: any) {
    // Notify customer
    await this.sendToUser(order.userId, {
      type: 'order',
      title: 'Order Placed Successfully',
      message: `Your order #${order.id} has been placed successfully. Total: $${order.totalAmount}`,
      data: { orderId: order.id, amount: order.totalAmount },
      actionUrl: `/orders/${order.id}`
    });

    // Notify sellers involved in the order
    const sellerIds = [...new Set(order.orderItems.map(item => item.sellerId))];
    
    for (const sellerId of sellerIds) {
      const sellerItems = order.orderItems.filter(item => item.sellerId === sellerId);
      const sellerTotal = sellerItems.reduce((sum, item) => sum + item.subtotal, 0);

      await this.sendToUser(Number(sellerId), {
        type: 'order',
        title: 'New Order Received',
        message: `You have a new order! Order #${order.id} - Items: ${sellerItems.length}, Value: $${sellerTotal}`,
        data: { 
          orderId: order.id, 
          itemsCount: sellerItems.length,
          sellerTotal,
          customerName: order.shippingAddress.fullName
        },
        urgent: true,
        actionUrl: `/seller/orders/${order.id}`
      });
    }

    this.logger.log(`Order notifications sent for order #${order.id}`);
  }

  async notifyOrderStatusUpdate(order: any, oldStatus: string, newStatus: string) {
    // Notify customer about status change
    await this.sendToUser(order.userId, {
      type: 'order',
      title: 'Order Status Updated',
      message: `Your order #${order.id} status changed from ${oldStatus} to ${newStatus}`,
      data: { orderId: order.id, oldStatus, newStatus },
      actionUrl: `/orders/${order.id}`
    });

    // If order is delivered, notify seller
    if (newStatus === 'DELIVERED') {
      const sellerIds = [...new Set(order.orderItems.map(item => item.sellerId))];
      
      for (const sellerId of sellerIds) {
        await this.sendToUser(Number(sellerId), {
          type: 'order',
          title: 'Order Delivered',
          message: `Order #${order.id} has been delivered successfully. Earnings will be processed.`,
          data: { orderId: order.id },
          actionUrl: `/seller/financial/records`
        });
      }
    }
  }

  // Payment notifications
  async notifyPaymentProcessed(payment: any) {
    await this.sendToUser(payment.order.userId, {
      type: 'payment',
      title: 'Payment Processed',
      message: `Payment of $${payment.amount} for order #${payment.order.id} has been processed successfully`,
      data: { 
        paymentId: payment.id, 
        orderId: payment.order.id,
        amount: payment.amount,
        method: payment.paymentMethod?.type || 'Unknown'
      },
      actionUrl: `/orders/${payment.order.id}`
    });
  }

  async notifyPaymentFailed(payment: any, reason: string) {
    await this.sendToUser(payment.order.userId, {
      type: 'payment',
      title: 'Payment Failed',
      message: `Payment for order #${payment.order.id} failed. Reason: ${reason}`,
      data: { 
        paymentId: payment.id, 
        orderId: payment.order.id,
        amount: payment.amount,
        reason
      },
      urgent: true,
      actionUrl: `/orders/${payment.order.id}/payment`
    });
  }

  // Seller verification notifications
  async notifySellerVerificationUpdate(sellerId: number, isVerified: boolean) {
    await this.sendToUser(sellerId, {
      type: 'verification',
      title: isVerified ? 'Account Verified' : 'Verification Revoked',
      message: isVerified 
        ? 'Congratulations! Your seller account has been verified. You can now access all seller features.'
        : 'Your seller verification has been revoked. Please contact support for assistance.',
      data: { isVerified },
      urgent: true,
      actionUrl: '/seller/profile'
    });
  }

  // Payout notifications
  async notifyPayoutProcessed(sellerId: number, payoutData: any) {
    await this.sendToUser(sellerId, {
      type: 'payout',
      title: 'Payout Processed',
      message: `Your payout of $${payoutData.amount} has been processed successfully via ${payoutData.method}`,
      data: {
        amount: payoutData.amount,
        method: payoutData.method,
        reference: payoutData.reference,
        recordsCount: payoutData.recordsCount
      },
      actionUrl: '/seller/financial/payouts'
    });
  }

  // Product notifications
  async notifyLowStock(sellerId: number, products: any[]) {
    const productNames = products.map(p => p.name).join(', ');
    
    await this.sendToUser(sellerId, {
      type: 'product',
      title: 'Low Stock Alert',
      message: `${products.length} product(s) are running low on stock: ${productNames}`,
      data: { 
        products: products.map(p => ({ id: p.id, name: p.name, stock: p.stockQuantity })),
        count: products.length
      },
      urgent: true,
      actionUrl: '/seller/products'
    });
  }

  async notifyProductOutOfStock(sellerId: number, product: any) {
    await this.sendToUser(sellerId, {
      type: 'product',
      title: 'Product Out of Stock',
      message: `Your product "${product.name}" is now out of stock and has been automatically deactivated`,
      data: { productId: product.id, productName: product.name },
      urgent: true,
      actionUrl: `/seller/products/${product.id}`
    });
  }

  // System notifications
  async notifySystemMaintenance(maintenanceData: { startTime: Date, endTime: Date, description: string }) {
    await this.sendBroadcast({
      type: 'system',
      title: 'Scheduled Maintenance',
      message: `System maintenance scheduled from ${maintenanceData.startTime.toLocaleString()} to ${maintenanceData.endTime.toLocaleString()}. ${maintenanceData.description}`,
      data: maintenanceData,
      urgent: true
    });
  }

  // ======= UTILITY METHODS =======

  // Test notification for development
  async sendTestNotification(userId: number) {
    return this.sendToUser(userId, {
      type: 'system',
      title: 'Test Notification',
      message: 'This is a test notification to verify the system is working correctly.',
      data: { test: true, timestamp: new Date().toISOString() }
    });
  }

  // Get Pusher authentication for private channels
  authenticateUser(socketId: string, channelName: string, userId: number) {
    // Verify the user has permission to access this channel
    if (channelName === `private-user-${userId}`) {
      return this.pusher.authenticate(socketId, channelName);
    }
    
    throw new Error('Unauthorized channel access');
  }

  // Health check for Pusher connection
  async healthCheck() {
    try {
      // Send a test event to verify Pusher connection
      await this.pusher.trigger('health-check', 'ping', { timestamp: new Date().toISOString() });
      return { status: 'healthy', timestamp: new Date().toISOString() };
    } catch (error) {
      this.logger.error('Pusher health check failed:', error);
      return { status: 'unhealthy', error: error.message, timestamp: new Date().toISOString() };
    }
  }

  async sendOrderNotificationToSeller(sellerId: number, order: any) {
    await this.pusher.trigger(`seller-${sellerId}`, 'order-placed', {
      message: `New order placed by ${order.userName}`,
      orderId: order.id,
    });
  }
}