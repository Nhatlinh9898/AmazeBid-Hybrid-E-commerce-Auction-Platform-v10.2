# 📧 Hướng dẫn cấu hình Gmail cho EmailService

## 🔧 Cấu hình Gmail App Password

### Bước 1: Bật 2-Factor Authentication (2FA)
1. Đăng nhập vào tài khoản Gmail của bạn
2. Vào: https://myaccount.google.com/security
3. Bật "2-Step Verification"
4. Làm theo hướng dẫn để thiết lập 2FA

### Bước 2: Tạo App Password
1. Sau khi bật 2FA, vào: https://myaccount.google.com/apppasswords
2. Chọn:
   - **Select app**: Mail
   - **Select device**: Other (Custom name)
   - Nhập tên: "AmazeBid Email Service"
3. Nhấn **Generate**
4. **Lưu lại mật khẩu 16 ký tự** (ví dụ: `abcd efgh ijkl mnop`)
   - ⚠️ Chỉ hiện một lần, hãy lưu cẩn thận!

### Bước 3: Cấu hình Environment Variables

Thêm vào file `.env`:
```bash
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-char-app-password
```

## 🚀 Cài đặt Dependencies

Cài đặt nodemailer để sử dụng Gmail:
```bash
npm install nodemailer
# hoặc
yarn add nodemailer
```

## 🎯 Sử dụng Gmail trong EmailService

### Method 1: Sử dụng Gmail Provider trực tiếp
```typescript
import { emailService } from './services/EmailService';

// Bật Gmail provider
emailService.enableProvider('Gmail');

// Gửi email qua Gmail
await emailService.sendEmailVerification(
  'user@example.com',
  'https://amazebid.com/verify?token=abc123'
);
```

### Method 2: Chỉ định provider khi gọi method
```typescript
// Gửi email với provider cụ thể
await emailService.queueEmail(
  'user@example.com',
  'Test Email',
  '<h1>Hello from Gmail!</h1>',
  'HIGH',
  undefined,
  { provider: 'gmail' }
);
```

### Method 3: Gọi trực tiếp qua API
```bash
curl -X POST http://localhost:3001/api/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "user@example.com",
    "subject": "Test Gmail",
    "html": "<h1>Hello from Gmail!</h1>",
    "provider": "gmail"
  }'
```

## 🔍 Kiểm tra cấu hình

### Test Gmail connection
```javascript
// Trong browser console hoặc Node.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

// Verify configuration
transporter.verify((error, success) => {
  if (error) {
    console.log('❌ Gmail config error:', error);
  } else {
    console.log('✅ Gmail config verified!');
  }
});
```

### Test gửi email thực tế
```javascript
// Test gửi email đơn giản
await emailService.sendEmailVerification(
  'your-test-email@gmail.com',
  'https://amazebid.com/verify?token=test123'
);
```

## 📊 Gmail API Limits

### Quota giới hạn
- **Free tier**: 500 emails/ngày
- **Google Workspace**: 2,000 emails/ngày
- **Rate limiting**: ~90 emails/phút

### Best Practices
- ✅ Sử dụng queue để tránh rate limiting
- ✅ Xử lý retry khi gặp lỗi
- ✅ Monitor email delivery status
- ❌ Không spam - có thể bị khóa tài khoản

## 🚨 Troubleshooting

### Lỗi: "Invalid login"
```
Error: Invalid login
```
**Giải pháp:**
- Kiểm tra App Password có đúng không
- Đảm bảo 2FA đã bật
- Tạo lại App Password mới

### Lỗi: "Less secure app access"
```
Error: Less secure app access is not enabled
```
**Giải pháp:**
- Google đã tắt "Less Secure Apps"
- Phải sử dụng App Password với 2FA

### Lỗi: "Connection timeout"
```
Error: Connection timeout
```
**Giải pháp:**
- Kiểm tra kết nối internet
- Tắt firewall/antivirus tạm thời
- Thử lại sau vài phút

### Lỗi: "Daily sending limit exceeded"
```
Error: Daily sending limit exceeded
```
**Giải pháp:**
- Đợi đến ngày hôm sau
- Nâng cấp Google Workspace
- Sử dụng provider khác (SendGrid, AWS SES)

## 🔒 Security Best Practices

### 1. Không commit credentials
```bash
# Thêm vào .gitignore
.env
.env.local
```

### 2. Sử dụng environment variables
```typescript
// ✅ Tốt
const gmailUser = process.env.GMAIL_USER;

// ❌ Không tốt
const gmailUser = 'myemail@gmail.com';
```

### 3. Rotate App Password định kỳ
- Đổi App Password mỗi 3-6 tháng
- Xóa App Password không sử dụng

### 4. Monitor suspicious activity
- Kiểm tra Google Security Dashboard
- Xem log gửi email
- Theo dõi failed attempts

## 🔄 Production Setup

### Sử dụng Google Workspace (khuyên dùng)
1. Tạo Google Workspace account
2. Cấu hình SPF, DKIM, DMARC records
3. Sử dụng domain email (noreply@yourdomain.com)
4. Quota cao hơn (2,000 emails/ngày)

### Fallback Strategy
```typescript
// Fallback sang provider khác nếu Gmail fail
try {
  await emailService.sendEmailViaGmail(...);
} catch (error) {
  console.log('Gmail failed, trying SendGrid...');
  await emailService.sendEmailViaSendGrid(...);
}
```

## 📈 Monitoring & Analytics

### Track email delivery
```javascript
// Trong EmailService
const analytics = emailService.getEmailAnalytics();
console.log('Gmail emails sent:', analytics.sent);
console.log('Gmail emails delivered:', analytics.delivered);
```

### Log errors
```javascript
// Log failed emails
emailService.subscribe((emails) => {
  const failed = emails.filter(e => e.status === 'failed');
  if (failed.length > 0) {
    console.error('Failed emails:', failed);
  }
});
```

## 🎉 Hoàn thành!

Sau khi cấu hình:
1. ✅ Test connection với Gmail
2. ✅ Gửi email test đầu tiên
3. ✅ Monitor delivery status
4. ✅ Setup fallback strategy

**EmailService AmazeBid giờ đã sẵn sàng gửi email qua Gmail! 📧**
