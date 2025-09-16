import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

interface OrderEmailData {
    orderId: string;
    customerName: string;
    customerEmail: string;
    items: Array<{
        productName: string;
        quantity: number;
        price: number;
        totalPrice: number;
    }>;
    totalAmount: number;
    orderDate: string;
    shippingAddress: string;
    sellerName?: string;
    sellerEmail?: string;
}

interface MessageEmailData {
    fromName: string;
    fromEmail: string;
    toName: string;
    toEmail: string;
    subject: string;
    message: string;
    productName?: string;
    orderId?: string;
}

@Injectable()
export class MaillerService {
    constructor(private mailerService: MailerService) {}

    // Base email sending method
    private async sendEmail(to: string, subject: string, text: string, html: string) {
        try {
            console.log(`Attempting to send email to: ${to}, subject: ${subject}`);
            
            const result = await this.mailerService.sendMail({
                to: to,
                subject: subject,
                text: text,
                html: html,
            });
            
            console.log('Email sent successfully:', result);
            return { success: true, message: 'Email sent successfully' };
        } catch (error) {
            console.error('Email sending failed:', {
                error: error.message,
                code: error.code,
                command: error.command,
                to: to,
                subject: subject
            });
            
            // Don't throw in development - just log and return failure
            if (process.env.NODE_ENV === 'development') {
                console.warn('Email sending disabled in development due to SSL error');
                return { success: false, message: 'Email disabled in development', error: error.message };
            }
            
            throw new Error(`Failed to send email: ${error.message}`);
        }
    }

    // Email templates
    private getBaseTemplate(content: string, title: string): string {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${title}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
                .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; }
                .header { background-color: #3b82f6; color: white; padding: 20px; text-align: center; }
                .content { padding: 30px 20px; }
                .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; }
                .button { display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
                .order-item { border-bottom: 1px solid #eee; padding: 10px 0; }
                .total { font-weight: bold; font-size: 18px; color: #3b82f6; }
                .message-box { background-color: #f8f9fa; padding: 15px; border-left: 4px solid #3b82f6; margin: 15px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>E-Commerce Platform</h1>
                </div>
                <div class="content">
                    ${content}
                </div>
                <div class="footer">
                    <p>© 2024 E-Commerce Platform. All rights reserved.</p>
                    <p>For support, contact us at support@ecommerce.com</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    // Welcome email for new users
    async sendWelcomeEmail(email: string, username: string, userType: 'USER' | 'SELLER' = 'USER') {
        const subject = 'Welcome to E-Commerce Platform!';
        const roleMessage = userType === 'SELLER' 
            ? 'As a seller, you can now list your products and start selling to our community of buyers.'
            : 'Discover amazing products from verified sellers worldwide.';
        
        const content = `
            <h2>Welcome, ${username}!</h2>
            <p>Thank you for joining our e-commerce platform. We're excited to have you as part of our community.</p>
            <p>${roleMessage}</p>
            <div style="margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL}/dashboard" class="button">Get Started</a>
            </div>
            <h3>What's next?</h3>
            <ul>
                ${userType === 'SELLER' ? 
                    '<li>Complete your seller profile</li><li>Add your first product</li><li>Set up payment details</li>' :
                    '<li>Browse our product catalog</li><li>Add items to your wishlist</li><li>Complete your first order</li>'
                }
            </ul>
        `;
        
        const html = this.getBaseTemplate(content, 'Welcome');
        const text = `Welcome ${username}! Thank you for joining our e-commerce platform.`;
        
        return await this.sendEmail(email, subject, text, html);
    }

    // Order confirmation email to customer
    async sendOrderConfirmationEmail(orderData: OrderEmailData) {
        const subject = `Order Confirmation - #${orderData.orderId}`;
        
        const itemsList = orderData.items.map(item => `
            <div class="order-item">
                <strong>${item.productName}</strong><br>
                Quantity: ${item.quantity} × $${item.price.toFixed(2)} = $${item.totalPrice.toFixed(2)}
            </div>
        `).join('');

        const content = `
            <h2>Order Confirmation</h2>
            <p>Hi ${orderData.customerName},</p>
            <p>Thank you for your order! We've received it and are preparing to process it.</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3>Order Details</h3>
                <p><strong>Order ID:</strong> ${orderData.orderId}</p>
                <p><strong>Order Date:</strong> ${orderData.orderDate}</p>
                <p><strong>Shipping Address:</strong> ${orderData.shippingAddress}</p>
            </div>

            <h3>Items Ordered:</h3>
            ${itemsList}
            
            <div style="margin-top: 20px; text-align: right;">
                <p class="total">Total: $${orderData.totalAmount.toFixed(2)}</p>
            </div>

            <div style="margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL}/orders/${orderData.orderId}" class="button">Track Your Order</a>
            </div>
        `;
        
        const html = this.getBaseTemplate(content, 'Order Confirmation');
        const text = `Order confirmation for order #${orderData.orderId}. Total: $${orderData.totalAmount.toFixed(2)}`;
        
        return await this.sendEmail(orderData.customerEmail, subject, text, html);
    }

    // New order notification to seller
    async sendNewOrderNotificationToSeller(orderData: OrderEmailData) {
        if (!orderData.sellerEmail) return;
        
        const subject = `New Order Received - #${orderData.orderId}`;
        
        const itemsList = orderData.items.map(item => `
            <div class="order-item">
                <strong>${item.productName}</strong><br>
                Quantity: ${item.quantity} × $${item.price.toFixed(2)} = $${item.totalPrice.toFixed(2)}
            </div>
        `).join('');

        const content = `
            <h2>New Order Received!</h2>
            <p>Hi ${orderData.sellerName},</p>
            <p>Great news! You've received a new order from ${orderData.customerName}.</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3>Order Details</h3>
                <p><strong>Order ID:</strong> ${orderData.orderId}</p>
                <p><strong>Customer:</strong> ${orderData.customerName}</p>
                <p><strong>Order Date:</strong> ${orderData.orderDate}</p>
                <p><strong>Shipping Address:</strong> ${orderData.shippingAddress}</p>
            </div>

            <h3>Items Ordered:</h3>
            ${itemsList}
            
            <div style="margin-top: 20px; text-align: right;">
                <p class="total">Your Earnings: $${(orderData.totalAmount * 0.85).toFixed(2)} (after 15% platform fee)</p>
            </div>

            <div style="margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL}/seller/orders/${orderData.orderId}" class="button">Manage Order</a>
            </div>
            
            <p><strong>Next Steps:</strong></p>
            <ul>
                <li>Confirm the order in your seller dashboard</li>
                <li>Prepare the items for shipping</li>
                <li>Update the order status once shipped</li>
            </ul>
        `;
        
        const html = this.getBaseTemplate(content, 'New Order');
        const text = `New order #${orderData.orderId} from ${orderData.customerName}. Total: $${orderData.totalAmount.toFixed(2)}`;
        
        return await this.sendEmail(orderData.sellerEmail, subject, text, html);
    }

    // Order status update email
    async sendOrderStatusUpdateEmail(
        email: string, 
        customerName: string, 
        orderId: string, 
        status: string, 
        trackingNumber?: string
    ) {
        const subject = `Order Update - #${orderId}`;
        
        let statusMessage = '';
        let nextSteps = '';
        
        switch (status.toLowerCase()) {
            case 'confirmed':
                statusMessage = 'Your order has been confirmed and is being prepared for shipment.';
                nextSteps = 'We\'ll notify you once your order is shipped.';
                break;
            case 'shipped':
                statusMessage = 'Great news! Your order has been shipped and is on its way to you.';
                nextSteps = trackingNumber 
                    ? `Track your package with tracking number: <strong>${trackingNumber}</strong>`
                    : 'You\'ll receive tracking information shortly.';
                break;
            case 'delivered':
                statusMessage = 'Your order has been successfully delivered!';
                nextSteps = 'We hope you love your purchase. Don\'t forget to leave a review!';
                break;
            case 'cancelled':
                statusMessage = 'Your order has been cancelled as requested.';
                nextSteps = 'If you paid for this order, your refund will be processed within 3-5 business days.';
                break;
        }

        const content = `
            <h2>Order Status Update</h2>
            <p>Hi ${customerName},</p>
            <p>We have an update on your order <strong>#${orderId}</strong>.</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3>Status: ${status.toUpperCase()}</h3>
                <p>${statusMessage}</p>
            </div>

            <p>${nextSteps}</p>

            <div style="margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL}/orders/${orderId}" class="button">View Order Details</a>
            </div>
        `;
        
        const html = this.getBaseTemplate(content, 'Order Update');
        const text = `Order #${orderId} status updated to: ${status}. ${statusMessage}`;
        
        return await this.sendEmail(email, subject, text, html);
    }

    // Seller-to-buyer message
    async sendSellerToBuyerMessage(messageData: MessageEmailData) {
        const subject = messageData.subject || `Message from ${messageData.fromName}`;
        
        const content = `
            <h2>Message from Seller</h2>
            <p>Hi ${messageData.toName},</p>
            <p>You have received a message from <strong>${messageData.fromName}</strong>:</p>
            
            <div class="message-box">
                <h4>Subject: ${messageData.subject}</h4>
                <p>${messageData.message}</p>
            </div>

            ${messageData.productName ? `<p><strong>Regarding:</strong> ${messageData.productName}</p>` : ''}
            ${messageData.orderId ? `<p><strong>Order ID:</strong> ${messageData.orderId}</p>` : ''}

            <div style="margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL}/messages" class="button">Reply to Message</a>
            </div>
            
            <p><em>Please do not reply to this email directly. Use the platform messaging system to continue the conversation.</em></p>
        `;
        
        const html = this.getBaseTemplate(content, 'New Message');
        const text = `Message from ${messageData.fromName}: ${messageData.message}`;
        
        return await this.sendEmail(messageData.toEmail, subject, text, html);
    }

    // Buyer-to-seller message
    async sendBuyerToSellerMessage(messageData: MessageEmailData) {
        const subject = messageData.subject || `Message from ${messageData.fromName}`;
        
        const content = `
            <h2>Message from Customer</h2>
            <p>Hi ${messageData.toName},</p>
            <p>You have received a message from customer <strong>${messageData.fromName}</strong>:</p>
            
            <div class="message-box">
                <h4>Subject: ${messageData.subject}</h4>
                <p>${messageData.message}</p>
            </div>

            ${messageData.productName ? `<p><strong>Regarding:</strong> ${messageData.productName}</p>` : ''}
            ${messageData.orderId ? `<p><strong>Order ID:</strong> ${messageData.orderId}</p>` : ''}

            <div style="margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL}/seller/messages" class="button">Reply to Customer</a>
            </div>
            
            <p><em>Please respond promptly to maintain good customer relations and platform ratings.</em></p>
        `;
        
        const html = this.getBaseTemplate(content, 'Customer Message');
        const text = `Message from customer ${messageData.fromName}: ${messageData.message}`;
        
        return await this.sendEmail(messageData.toEmail, subject, text, html);
    }

    // Seller verification email
    async sendSellerVerificationEmail(email: string, sellerName: string, status: 'approved' | 'rejected', reason?: string) {
        const subject = `Seller Account ${status === 'approved' ? 'Approved' : 'Update Required'}`;
        
        const content = status === 'approved' ? `
            <h2>Congratulations! Your Seller Account is Approved</h2>
            <p>Hi ${sellerName},</p>
            <p>Great news! Your seller account has been approved and you can now start selling on our platform.</p>
            
            <div style="background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
                <h3>Your seller account is now active!</h3>
            </div>

            <h3>Next Steps:</h3>
            <ul>
                <li>Add your first product</li>
                <li>Set up your payment information</li>
                <li>Complete your seller profile</li>
                <li>Start receiving orders!</li>
            </ul>

            <div style="margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL}/seller/dashboard" class="button">Go to Seller Dashboard</a>
            </div>
        ` : `
            <h2>Seller Account Requires Attention</h2>
            <p>Hi ${sellerName},</p>
            <p>We've reviewed your seller application and need some additional information or corrections.</p>
            
            <div style="background-color: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545;">
                <h3>Reason for review:</h3>
                <p>${reason || 'Please review and update your seller information.'}</p>
            </div>

            <div style="margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL}/seller/profile" class="button">Update Profile</a>
            </div>
        `;
        
        const html = this.getBaseTemplate(content, 'Seller Verification');
        const text = status === 'approved' 
            ? `Congratulations! Your seller account has been approved.`
            : `Your seller account requires attention. Reason: ${reason}`;
        
        return await this.sendEmail(email, subject, text, html);
    }

    // Password reset email
    async sendPasswordResetEmail(email: string, username: string, resetToken: string) {
        const subject = 'Password Reset Request';
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
        
        const content = `
            <h2>Password Reset Request</h2>
            <p>Hi ${username},</p>
            <p>We received a request to reset your password. If you didn't make this request, please ignore this email.</p>
            
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
                <p><strong>This link will expire in 1 hour for security reasons.</strong></p>
            </div>

            <div style="margin: 30px 0;">
                <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${resetUrl}</p>
        `;
        
        const html = this.getBaseTemplate(content, 'Password Reset');
        const text = `Password reset requested. Use this link: ${resetUrl}`;
        
        return await this.sendEmail(email, subject, text, html);
    }

    // Payout notification email to seller
    async sendPayoutNotificationEmail(email: string, sellerName: string, amount: number, payoutId: string) {
        const subject = 'Payout Processed Successfully';
        
        const content = `
            <h2>Payout Processed</h2>
            <p>Hi ${sellerName},</p>
            <p>Your payout has been processed successfully!</p>
            
            <div style="background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
                <h3>Payout Details</h3>
                <p><strong>Amount:</strong> $${amount.toFixed(2)}</p>
                <p><strong>Payout ID:</strong> ${payoutId}</p>
                <p><strong>Processing Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>

            <p>The funds should appear in your account within 1-3 business days.</p>

            <div style="margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL}/seller/financial" class="button">View Financial Dashboard</a>
            </div>
        `;
        
        const html = this.getBaseTemplate(content, 'Payout Processed');
        const text = `Payout processed: $${amount.toFixed(2)} (ID: ${payoutId})`;
        
        return await this.sendEmail(email, subject, text, html);
    }

    // Simple email sending method (for testing)
    async sendSimpleEmail(to: string, subject: string, message: string) {
        const html = this.getBaseTemplate(`<p>${message}</p>`, subject);
        return await this.sendEmail(to, subject, message, html);
    }

    // Send test email
    async sendTestEmail(email: string) {
        const subject = 'Test Email - E-Commerce Platform';
        const message = 'This is a test email. Your email system is working perfectly!';
        return await this.sendSimpleEmail(email, subject, message);
    }
}

