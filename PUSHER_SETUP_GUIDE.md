# Pusher.js Configuration Guide

## Environment Variables Setup

Add the following environment variables to your `.env` file:

```env
# Pusher Configuration
PUSHER_APP_ID=your_app_id
PUSHER_KEY=your_public_key
PUSHER_SECRET=your_secret_key
PUSHER_CLUSTER=ap2

# Optional: Custom Pusher Configuration
PUSHER_USE_TLS=true
PUSHER_ENCRYPTED=true
```

## Getting Pusher Credentials

1. **Sign up for Pusher**: Visit [https://pusher.com/](https://pusher.com/) and create a free account
2. **Create a new app**: 
   - Go to your dashboard
   - Click "Create app"
   - Choose a name for your app
   - Select the cluster closest to your users (e.g., `ap2` for Asia Pacific)
   - Choose the appropriate plan (Free tier works for development)
3. **Get your credentials**:
   - Go to your app dashboard
   - Click on "App Keys" tab
   - Copy the App ID, Key, Secret, and Cluster

## Frontend Integration (Next.js)

### Install Pusher JS Client

```bash
npm install pusher-js
# or
yarn add pusher-js
```

### Create Pusher Client

```javascript
// lib/pusher.js
import Pusher from 'pusher-js';

const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
  encrypted: true,
});

export default pusher;
```

### Environment Variables for Frontend

Add to your `.env.local` file:

```env
NEXT_PUBLIC_PUSHER_KEY=your_public_key
NEXT_PUBLIC_PUSHER_CLUSTER=ap2
```

### Example Usage in React Component

```javascript
// components/NotificationComponent.js
import { useEffect, useState } from 'react';
import pusher from '../lib/pusher';

export default function NotificationComponent({ userId }) {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!userId) return;

    // Subscribe to user's private channel
    const channel = pusher.subscribe(`user-${userId}`);

    // Listen for order notifications
    channel.bind('notification-order', (data) => {
      setNotifications(prev => [data, ...prev]);
      // Show toast/popup notification
      showNotification(data);
    });

    // Listen for payment notifications
    channel.bind('notification-payment', (data) => {
      setNotifications(prev => [data, ...prev]);
      showNotification(data);
    });

    // Listen for other notification types
    channel.bind('notification-verification', (data) => {
      setNotifications(prev => [data, ...prev]);
      showNotification(data);
    });

    channel.bind('notification-payout', (data) => {
      setNotifications(prev => [data, ...prev]);
      showNotification(data);
    });

    channel.bind('notification-product', (data) => {
      setNotifications(prev => [data, ...prev]);
      showNotification(data);
    });

    channel.bind('notification-system', (data) => {
      setNotifications(prev => [data, ...prev]);
      showNotification(data);
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`user-${userId}`);
    };
  }, [userId]);

  const showNotification = (data) => {
    // Implement your notification display logic
    if (Notification.permission === 'granted') {
      new Notification(data.title, {
        body: data.message,
        icon: '/favicon.ico'
      });
    }
  };

  return (
    <div className="notification-container">
      {notifications.map((notification, index) => (
        <div key={index} className={`notification ${notification.urgent ? 'urgent' : ''}`}>
          <h4>{notification.title}</h4>
          <p>{notification.message}</p>
          {notification.actionUrl && (
            <a href={notification.actionUrl} className="notification-action">
              View Details
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
```

### Broadcast Notifications

```javascript
// For broadcast/public notifications
useEffect(() => {
  const channel = pusher.subscribe('public-notifications');
  
  channel.bind('broadcast-system', (data) => {
    // Handle system-wide announcements
    setSystemNotifications(prev => [data, ...prev]);
  });

  return () => {
    pusher.unsubscribe('public-notifications');
  };
}, []);
```

## Testing Notifications

### Using the API

```bash
# Test notification to specific user
curl -X POST http://localhost:4000/notifications/test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"

# Send custom notification (Admin only)
curl -X POST http://localhost:4000/notifications/send-to-user/123 \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "system",
    "title": "Test Notification",
    "message": "This is a test message",
    "urgent": false
  }'
```

## Available Notification Types

### Order Notifications
- `notification-order`: Order placed, status updates, delivery confirmations
- Sent to: Customers and sellers involved in the order

### Payment Notifications  
- `notification-payment`: Payment processed, failed payments
- Sent to: Order owner

### Verification Notifications
- `notification-verification`: Seller verification status updates
- Sent to: Sellers

### Payout Notifications
- `notification-payout`: Payout processed confirmations
- Sent to: Sellers

### Product Notifications
- `notification-product`: Low stock alerts, out of stock notifications
- Sent to: Sellers

### System Notifications
- `notification-system`: Maintenance announcements, system updates
- Sent to: Broadcast to all users

## Security Considerations

1. **Private Channels**: Use authentication for user-specific notifications
2. **Rate Limiting**: Implement rate limiting to prevent notification spam
3. **Data Validation**: Always validate notification data before sending
4. **Error Handling**: Handle notification failures gracefully

## Pusher Channels Structure

- `user-{userId}`: Private channel for user-specific notifications
- `public-notifications`: Public channel for broadcast messages
- `health-check`: System health monitoring channel

## Troubleshooting

### Common Issues

1. **Notifications not received**:
   - Check Pusher credentials in environment variables
   - Verify user is subscribed to correct channel
   - Check browser console for Pusher connection errors

2. **Authentication errors**:
   - Ensure JWT token is valid and not expired
   - Verify user permissions for accessing private channels

3. **Connection issues**:
   - Check network connectivity
   - Verify Pusher cluster configuration
   - Check if firewall is blocking WebSocket connections

### Health Check

Monitor notification system health:

```bash
GET /notifications/health
GET /notifications/status
```

## Production Considerations

1. **Scaling**: Pusher automatically handles scaling for WebSocket connections
2. **Monitoring**: Set up monitoring for notification delivery rates
3. **Fallback**: Implement email fallback for critical notifications
4. **Rate Limits**: Configure appropriate rate limits based on your plan
5. **SSL**: Always use SSL in production (Pusher enforces this)

## Cost Optimization

1. **Connection Management**: Unsubscribe from channels when not needed
2. **Batch Notifications**: Group similar notifications to reduce API calls
3. **Channel Cleanup**: Remove unused channels and subscriptions
4. **Plan Selection**: Choose appropriate Pusher plan based on usage

This notification system provides real-time updates for all e-commerce activities while maintaining security and scalability.