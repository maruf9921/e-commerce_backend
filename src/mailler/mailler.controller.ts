import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { MaillerService } from './mailler.service';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles/roles.guard';
import { Roles } from '../auth/roles.decorator/roles.decorator';
import { Role } from '../auth/roles.enum/roles.enum';

@Controller('mailer')
export class MaillerController {
    constructor(private readonly maillerService: MaillerService) {}

    // Send test email (no auth required for testing)
    @Post('test')
    async sendTestEmail(@Body('email') email: string) {
        if (!email) {
            return { error: 'Email is required' };
        }
        try {
            return await this.maillerService.sendTestEmail(email);
        } catch (error) {
            return { error: 'Failed to send test email', details: error.message };
        }
    }

    // Send simple email (admin only)
    @Post('send')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    async sendSimpleEmail(
        @Body('email') email: string,
        @Body('subject') subject: string,
        @Body('message') message: string
    ) {
        if (!email || !subject || !message) {
            return { error: 'Email, subject, and message are required' };
        }
        try {
            return await this.maillerService.sendSimpleEmail(email, subject, message);
        } catch (error) {
            return { error: 'Failed to send email', details: error.message };
        }
    }

    // Send welcome email (system use)
    @Post('welcome')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    async sendWelcomeEmail(
        @Body('email') email: string,
        @Body('username') username: string,
        @Body('userType') userType: 'USER' | 'SELLER' = 'USER'
    ) {
        if (!email || !username) {
            return { error: 'Email and username are required' };
        }
        try {
            return await this.maillerService.sendWelcomeEmail(email, username, userType);
        } catch (error) {
            return { error: 'Failed to send welcome email', details: error.message };
        }
    }

    // Send order confirmation email (system use)
    @Post('order-confirmation')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SELLER)
    async sendOrderConfirmationEmail(@Body() orderData: any) {
        const requiredFields = ['orderId', 'customerName', 'customerEmail', 'items', 'totalAmount', 'orderDate', 'shippingAddress'];
        const missingFields = requiredFields.filter(field => !orderData[field]);
        
        if (missingFields.length > 0) {
            return { error: `Missing required fields: ${missingFields.join(', ')}` };
        }
        
        try {
            return await this.maillerService.sendOrderConfirmationEmail(orderData);
        } catch (error) {
            return { error: 'Failed to send order confirmation email', details: error.message };
        }
    }

    // Send new order notification to seller (system use)
    @Post('new-order-seller')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    async sendNewOrderNotificationToSeller(@Body() orderData: any) {
        const requiredFields = ['orderId', 'customerName', 'sellerName', 'sellerEmail', 'items', 'totalAmount', 'orderDate', 'shippingAddress'];
        const missingFields = requiredFields.filter(field => !orderData[field]);
        
        if (missingFields.length > 0) {
            return { error: `Missing required fields: ${missingFields.join(', ')}` };
        }
        
        try {
            return await this.maillerService.sendNewOrderNotificationToSeller(orderData);
        } catch (error) {
            return { error: 'Failed to send seller notification email', details: error.message };
        }
    }

    // Send order status update email (system use)
    @Post('order-status-update')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SELLER)
    async sendOrderStatusUpdateEmail(@Body() updateData: {
        email: string;
        customerName: string;
        orderId: string;
        status: string;
        trackingNumber?: string;
    }) {
        const { email, customerName, orderId, status } = updateData;
        
        if (!email || !customerName || !orderId || !status) {
            return { error: 'Email, customerName, orderId, and status are required' };
        }
        
        try {
            return await this.maillerService.sendOrderStatusUpdateEmail(
                email, 
                customerName, 
                orderId, 
                status, 
                updateData.trackingNumber
            );
        } catch (error) {
            return { error: 'Failed to send order status update email', details: error.message };
        }
    }

    // Send seller-to-buyer message
    @Post('seller-to-buyer')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.SELLER)
    async sendSellerToBuyerMessage(@Body() messageData: {
        fromName: string;
        fromEmail: string;
        toName: string;
        toEmail: string;
        subject: string;
        message: string;
        productName?: string;
        orderId?: string;
    }) {
        const requiredFields = ['fromName', 'fromEmail', 'toName', 'toEmail', 'subject', 'message'];
        const missingFields = requiredFields.filter(field => !messageData[field]);
        
        if (missingFields.length > 0) {
            return { error: `Missing required fields: ${missingFields.join(', ')}` };
        }
        
        try {
            return await this.maillerService.sendSellerToBuyerMessage(messageData);
        } catch (error) {
            return { error: 'Failed to send seller message', details: error.message };
        }
    }

    // Send buyer-to-seller message
    @Post('buyer-to-seller')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.USER, Role.ADMIN)
    async sendBuyerToSellerMessage(@Body() messageData: {
        fromName: string;
        fromEmail: string;
        toName: string;
        toEmail: string;
        subject: string;
        message: string;
        productName?: string;
        orderId?: string;
    }) {
        const requiredFields = ['fromName', 'fromEmail', 'toName', 'toEmail', 'subject', 'message'];
        const missingFields = requiredFields.filter(field => !messageData[field]);
        
        if (missingFields.length > 0) {
            return { error: `Missing required fields: ${missingFields.join(', ')}` };
        }
        
        try {
            return await this.maillerService.sendBuyerToSellerMessage(messageData);
        } catch (error) {
            return { error: 'Failed to send buyer message', details: error.message };
        }
    }

    // Send seller verification email (admin only)
    @Post('seller-verification')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    async sendSellerVerificationEmail(@Body() verificationData: {
        email: string;
        sellerName: string;
        status: 'approved' | 'rejected';
        reason?: string;
    }) {
        const { email, sellerName, status } = verificationData;
        
        if (!email || !sellerName || !status) {
            return { error: 'Email, sellerName, and status are required' };
        }
        
        try {
            return await this.maillerService.sendSellerVerificationEmail(
                email, 
                sellerName, 
                status, 
                verificationData.reason
            );
        } catch (error) {
            return { error: 'Failed to send seller verification email', details: error.message };
        }
    }

    // Send password reset email (system use)
    @Post('password-reset')
    async sendPasswordResetEmail(@Body() resetData: {
        email: string;
        username: string;
        resetToken: string;
    }) {
        const { email, username, resetToken } = resetData;
        
        if (!email || !username || !resetToken) {
            return { error: 'Email, username, and resetToken are required' };
        }
        
        try {
            return await this.maillerService.sendPasswordResetEmail(email, username, resetToken);
        } catch (error) {
            return { error: 'Failed to send password reset email', details: error.message };
        }
    }

    // Send payout notification email (admin only)
    @Post('payout-notification')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    async sendPayoutNotificationEmail(@Body() payoutData: {
        email: string;
        sellerName: string;
        amount: number;
        payoutId: string;
    }) {
        const { email, sellerName, amount, payoutId } = payoutData;
        
        if (!email || !sellerName || amount == null || !payoutId) {
            return { error: 'Email, sellerName, amount, and payoutId are required' };
        }
        
        try {
            return await this.maillerService.sendPayoutNotificationEmail(email, sellerName, amount, payoutId);
        } catch (error) {
            return { error: 'Failed to send payout notification email', details: error.message };
        }
    }

    // Get email templates info (admin only)
    @Post('templates-info')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    async getEmailTemplatesInfo() {
        return {
            availableTemplates: [
                'welcome',
                'order-confirmation',
                'new-order-seller',
                'order-status-update',
                'seller-to-buyer',
                'buyer-to-seller',
                'seller-verification',
                'password-reset',
                'payout-notification',
                'test'
            ],
            templateDescriptions: {
                'welcome': 'Welcome email for new users/sellers',
                'order-confirmation': 'Order confirmation email to customers',
                'new-order-seller': 'New order notification to sellers',
                'order-status-update': 'Order status update notifications',
                'seller-to-buyer': 'Messages from sellers to buyers',
                'buyer-to-seller': 'Messages from buyers to sellers',
                'seller-verification': 'Seller account approval/rejection emails',
                'password-reset': 'Password reset emails with secure tokens',
                'payout-notification': 'Payout confirmation emails to sellers',
                'test': 'Simple test email for system verification'
            }
        };
    }
}
