# Email System Integration Guide

## Overview
The enhanced email system provides comprehensive email templates and automated notifications for the e-commerce platform. It includes order confirmations, seller notifications, status updates, messaging, and administrative emails.

## Email Templates Available

### 1. Order-Related Emails
- **Order Confirmation**: Sent to customers when orders are placed
- **New Order Notification**: Sent to sellers when they receive orders
- **Order Status Updates**: Sent when order status changes (confirmed, shipped, delivered, cancelled)

### 2. User Communication
- **Welcome Emails**: For new users and sellers
- **Seller-to-Buyer Messages**: Product inquiries and order communications
- **Buyer-to-Seller Messages**: Customer service and support

### 3. Administrative Emails
- **Seller Verification**: Account approval/rejection notifications
- **Password Reset**: Secure password reset with tokens
- **Payout Notifications**: Seller earning confirmations

## Automated Email Integration

### Order Workflow Integration
```typescript
// Automatic emails sent during order creation:
1. Order confirmation email to customer
2. New order notification to each seller

// Automatic emails sent during status updates:
await orderService.updateStatus(orderId, { 
  status: OrderStatus.SHIPPED,
  trackingNumber: "ABC123456789"
});
// Sends order status update email automatically
```

### API Endpoints

#### Send Order Confirmation
```http
POST /mailer/order-confirmation
Authorization: Bearer <admin_or_seller_token>
{
  "orderId": "123",
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "items": [
    {
      "productName": "Product Name",
      "quantity": 2,
      "price": 29.99,
      "totalPrice": 59.98
    }
  ],
  "totalAmount": 69.98,
  "orderDate": "2024-01-15",
  "shippingAddress": "123 Main St, City, State 12345, Country"
}
```

#### Send Seller-to-Buyer Message
```http
POST /mailer/seller-to-buyer
Authorization: Bearer <seller_token>
{
  "fromName": "Seller Name",
  "fromEmail": "seller@example.com",
  "toName": "Customer Name", 
  "toEmail": "customer@example.com",
  "subject": "Question about your order",
  "message": "Your order has been prepared and will ship tomorrow.",
  "orderId": "123"
}
```

#### Send Order Status Update
```http
POST /mailer/order-status-update
Authorization: Bearer <admin_or_seller_token>
{
  "email": "customer@example.com",
  "customerName": "John Doe",
  "orderId": "123",
  "status": "shipped",
  "trackingNumber": "ABC123456789"
}
```

## Email Configuration

### Environment Variables
Add to your `.env` file:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
MAILER_USER=your-email@gmail.com
MAILER_PASS=your-app-password
FRONTEND_URL=http://localhost:3000
```

### Gmail App Password Setup
1. Enable 2-Factor Authentication on your Gmail account
2. Go to Google Account Settings > Security
3. Generate an App Password for "Mail"
4. Use the generated password in `MAILER_PASS`

## Email Template Features

### Professional Styling
- Responsive HTML templates
- Consistent branding with platform colors
- Mobile-friendly design
- Clear call-to-action buttons

### Dynamic Content
- Order details with itemized lists
- Shipping address formatting
- Seller earnings calculations
- Status-specific messaging
- Personalized greetings

### Security Features
- No reply-to warnings for system emails
- Secure password reset links with expiration
- Authentication required for most email endpoints

## Integration Examples

### In Order Service
```typescript
// After successful order creation
await this.sendOrderEmails(completeOrder);

// After status update  
await this.sendOrderStatusUpdateEmail(orderId, newStatus, trackingNumber);
```

### In Auth Service (for future integration)
```typescript
// After user registration
await this.maillerService.sendWelcomeEmail(email, username, userType);

// For password reset
await this.maillerService.sendPasswordResetEmail(email, username, resetToken);
```

### In Seller Service (for future integration)
```typescript
// After seller verification
await this.maillerService.sendSellerVerificationEmail(
  email, 
  sellerName, 
  'approved'
);
```

## Testing

### Test Email Endpoint
```http
POST /mailer/test
{
  "email": "test@example.com"
}
```

### Email Template Testing
```http
POST /mailer/templates-info
Authorization: Bearer <admin_token>
```

## Error Handling

### Email Sending Failures
- Emails are sent asynchronously to avoid blocking operations
- Failed emails are logged but don't affect core functionality
- Retry mechanisms can be implemented for critical emails

### Validation
- All email endpoints validate required fields
- Role-based access control for sensitive operations
- HTML sanitization for user-generated content

## Future Enhancements

### Planned Features
1. Email templates with file attachments
2. Bulk email sending for marketing
3. Email analytics and tracking
4. Template customization by admin
5. Multi-language support
6. Email queuing system for high volume

### Integration Points
1. Connect with financial module for payout emails
2. Add to notification system for email delivery status
3. Integrate with customer service tickets
4. Add to marketing campaigns

## Troubleshooting

### Common Issues
1. **Gmail Authentication**: Use App Passwords, not regular password
2. **Template Rendering**: Check HTML escaping in dynamic content
3. **Rate Limiting**: Implement delays for bulk operations
4. **Spam Filters**: Use proper SPF/DKIM records for production

### Production Considerations
1. Use professional SMTP service (SendGrid, Mailgun, AWS SES)
2. Implement email queuing (Redis, Bull)
3. Set up email monitoring and analytics
4. Configure proper DNS records (SPF, DKIM, DMARC)
5. Implement email templates versioning