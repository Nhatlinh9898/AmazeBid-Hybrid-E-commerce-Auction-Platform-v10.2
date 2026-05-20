# 📧 Hướng dẫn sử dụng EmailService AmazeBid

## 🚀 Quick Start

```typescript
import { emailService } from './services/EmailService';

// Gửi email xác thực
await emailService.sendEmailVerification(
  'user@example.com',
  'https://amazebid.com/verify?token=abc123'
);
```

## 📋 Danh sách các Method có sẵn

### 🔐 Authentication Methods
- `sendEmailVerification(email, link)` - Gửi email xác thực tài khoản
- `sendPasswordReset(email, link)` - Gửi email đặt lại mật khẩu

### 🏺 Auction Methods  
- `sendAuctionOutbidNotification(email, productName, currentBid, link)` - Thông báo bị ra giá cao hơn
- `sendAuctionEndingNotification(email, productName, endTime, link)` - Thông báo đấu giá sắp kết thúc

### 💰 Payment Methods
- `sendPaymentFailedNotification(email, orderId, amount, retryLink)` - Thông báo thanh toán thất bại
- `sendPurchaseConfirmation(user, order)` - Xác nhận đơn hàng
- `sendPaymentEscrowNotification(user, order)` - Thông báo thanh toán vào escrow

### 📦 Shipping Methods
- `sendShippingUpdateNotification(user, product, trackingInfo)` - Cập nhật vận chuyển
- `sendDeliveryNotification(user, product)` - Thông báo đã giao hàng
- `sendEscrowReleaseNotification(sellerEmail, orderId, amount)` - Thông báo giải ngân

### 🎯 Marketing Methods
- `sendFlashSaleNotification(email, saleName, discount, endTime, link)` - Flash Sale
- `sendNewArrivalNotification(email, products, catalogLink)` - Sản phẩm mới

### ⚙️ System Methods
- `sendAccountSuspendedNotification(email, reason, appealLink)` - Thông báo khóa tài khoản
- `sendMonthlyReport(email, reportData)` - Báo cáo hàng tháng
- `sendKYCStatusNotification(user, status)` - Trạng thái KYC

### 🔧 Utility Methods
- `queueEmail(to, subject, html, priority?, templateId?, metadata?)` - Thêm email vào hàng đợi
- `sendTemplateEmail(templateId, to, data, priority?, metadata?)` - Gửi email từ template
- `getQueueStatus()` - Xem trạng thái hàng đợi
- `getEmailAnalytics(templateId?, userId?)` - Xem thống kê email
- `getAll()` - Lấy tất cả email
- `subscribe(listener)` - Đăng ký lắng nghe thay đổi

## 🎯 Ví dụ sử dụng thực tế

### 1. User Registration Flow
```typescript
// Sau khi user đăng ký
await emailService.sendEmailVerification(
  newUser.email,
  `https://amazebid.com/verify?token=${verificationToken}`
);
```

### 2. Auction Management
```typescript
// Khi ai đó ra giá cao hơn
await emailService.sendAuctionOutbidNotification(
  currentBidder.email,
  product.title,
  newBidAmount,
  `https://amazebid.com/product/${product.id}`
);

// 30 phút trước khi đấu giá kết thúc
await emailService.sendAuctionEndingNotification(
  highestBidder.email,
  product.title,
  '30 phút',
  `https://amazebid.com/auction/${product.id}`
);
```

### 3. Order Processing
```typescript
// Khi thanh toán thành công
await emailService.sendPurchaseConfirmation(user, order);

// Thông báo seller
await emailService.sendSellerNotification(seller.email, order);

// Khi đơn hàng được gửi
await emailService.sendShippingUpdateNotification(
  buyer.email,
  product,
  {
    carrier: 'Giao Hàng Nhanh',
    trackingNumber: 'GHN123456789'
  }
);
```

### 4. Marketing Campaigns
```typescript
// Flash Sale campaign
await emailService.sendFlashSaleNotification(
  'customer@example.com',
  'Black Friday Technology',
  50,
  '23:59:59',
  'https://amazebid.com/black-friday'
);

// New products notification
await emailService.sendNewArrivalNotification(
  'customer@example.com',
  [
    { name: 'iPhone 15 Pro', price: 25000000 },
    { name: 'Samsung Galaxy S24', price: 22000000 }
  ],
  'https://amazebid.com/new-arrivals'
);
```

## 🔍 Kiểm tra và Debug

### Test tất cả methods
```typescript
import { testEmailService } from './test-email-service';

// Chạy test đầy đủ
await testEmailService();
```

### Kiểm tra trong Browser Console
```javascript
// Mở browser console và chạy:
await testEmailService();
checkAvailableMethods();
```

### Xem trạng thái hệ thống
```typescript
// Xem hàng đợi email
const queueStatus = emailService.getQueueStatus();
console.log('Pending emails:', queueStatus.stats.pending);

// Xem analytics
const analytics = emailService.getEmailAnalytics();
console.log('Email sent today:', analytics.sent);
```

## 🛠️ Cấu hình Email Provider

EmailService hỗ trợ multiple providers:

### Default Provider (Fetch API)
```typescript
// Đã cấu hình sẵn trong initializeProviders()
// Gửi qua /api/send-email endpoint
```

### SendGrid (Cần cấu hình)
```typescript
emailService.enableProvider('SendGrid');
// Cần API key trong environment variables
```

### AWS SES (Cần cấu hình)  
```typescript
emailService.enableProvider('AWS SES');
// Cần AWS credentials
```

## 📊 Email Queue System

EmailService sử dụng hàng đợi với các mức ưu tiên:
- `URGENT` - Ưu tiên cao nhất
- `HIGH` - Ưu tiên cao  
- `NORMAL` - Bình thường
- `LOW` - Ưu tiên thấp

### Retry Logic
- Tự động retry khi gửi thất bại
- Exponential backoff: 5min, 15min, 45min, 2hr, 6hr
- Max 5 attempts per email

## 🎨 Template System

### Sử dụng template có sẵn
```typescript
await emailService.sendTemplateEmail(
  'welcome',
  'user@example.com',
  { userName: 'John Doe' },
  'HIGH'
);
```

### Custom template
```typescript
emailService.queueEmail(
  'user@example.com',
  'Custom Subject',
  '<h1>Custom HTML Content</h1>',
  'NORMAL'
);
```

## 🔔 Real-time Updates

Đăng ký lắng nghe thay đổi:
```typescript
const unsubscribe = emailService.subscribe((emails) => {
  console.log(`Total emails: ${emails.length}`);
  console.log(`Unread: ${emails.filter(e => !e.isRead).length}`);
});

// Hủy đăng ký
unsubscribe();
```

## 🚨 Error Handling

```typescript
try {
  await emailService.sendEmailVerification('email@test.com', 'link');
  console.log('✅ Email queued successfully');
} catch (error) {
  console.error('❌ Failed to send email:', error);
  // Xem trạng thái queue để debug
  const status = emailService.getQueueStatus();
  console.log('Queue status:', status);
}
```

## 📈 Analytics & Monitoring

### Email Performance
```typescript
const analytics = emailService.getEmailAnalytics();
console.log('Email Statistics:');
console.log(`- Total sent: ${analytics.sent}`);
console.log(`- Delivered: ${analytics.delivered}`);
console.log(`- Opened: ${analytics.opened}`);
console.log(`- Clicked: ${analytics.clicked}`);
```

### Per Template Analytics
```typescript
const welcomeAnalytics = emailService.getEmailAnalytics('welcome');
console.log('Welcome email performance:', welcomeAnalytics);
```

## 🔧 Environment Setup

### Required Environment Variables
```bash
# Email configuration
EMAIL_SERVICE_PROVIDER=default
SENDGRID_API_KEY=your_sendgrid_key
AWS_SES_REGION=us-east-1
AWS_SES_ACCESS_KEY=your_access_key
AWS_SES_SECRET_KEY=your_secret_key

# API endpoints
API_BASE_URL=https://api.amazebid.com
```

## 🧪 Testing

### Run test suite
```bash
npm run test:email
# hoặc
npx ts-node test-email-service.ts
```

### Test trong Development
```typescript
// Enable debug mode
localStorage.setItem('email_debug', 'true');

// Test individual methods
await emailService.sendEmailVerification('test@dev.com', 'test-link');
```

---

## 📞 Support

Nếu gặp vấn đề:
1. Kiểm tra browser console logs
2. Xem trạng thái queue: `emailService.getQueueStatus()`
3. Test với file `test-email-service.ts`
4. Kiểm tra API endpoint `/api/send-email`

**Ready to use! 🚀**
