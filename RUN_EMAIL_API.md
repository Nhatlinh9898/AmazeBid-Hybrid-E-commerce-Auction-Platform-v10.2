# 🚀 Chạy Email API Server

## 📋 Yêu cầu

- Node.js (v14+)
- npm hoặc yarn

## 🛠️ Cài đặt Dependencies

```bash
npm install express cors
# hoặc
yarn add express cors
```

## 🚀 Khởi động API Server

### Method 1: Chạy trực tiếp
```bash
node email-api-endpoint.cjs
```

### Method 2: Sử dụng npm script
```bash
# Thêm vào package.json
"scripts": {
  "email-api": "node email-api-endpoint.cjs"
}

# Chạy
npm run email-api
```

## 🌐 API Endpoints

Khi server chạy, các endpoint sau sẽ có sẵn:

### POST /api/send-email
Gửi email thực tế
```bash
curl -X POST http://localhost:3001/api/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Email",
    "html": "<h1>Hello World</h1>",
    "metadata": {"source": "test"}
  }'
```

### GET /api/send-email
Kiểm tra trạng thái API
```bash
curl http://localhost:3001/api/send-email
```

### GET /api/emails
Xem lịch sử email đã gửi
```bash
curl http://localhost:3001/api/emails
```

### GET /health
Health check
```bash
curl http://localhost:3001/health
```

## 🧪 Test EmailService với API

1. **Khởi động API server:**
```bash
node email-api-endpoint.js
```

2. **Mở browser và chạy test:**
```javascript
// Import EmailService
import { emailService } from './services/EmailService';

// Test gửi email
await emailService.sendEmailVerification(
  'test@example.com',
  'https://amazebid.com/verify?token=abc123'
);

// Kiểm tra trạng thái queue
const status = emailService.getQueueStatus();
console.log('Queue status:', status);
```

3. **Hoặc chạy file test:**
```bash
npx ts-node test-email-service.ts
```

## 📊 Kiểm tra hoạt động

### 1. API Server Status
Mở http://localhost:3001/api/send-email trong browser để xem:
- ✅ API đang chạy
- 📋 Số lượng email đã gửi
- 🔧 Các providers đã cấu hình

### 2. Email Queue Status
```javascript
// Trong browser console
const queueStatus = emailService.getQueueStatus();
console.log('Pending emails:', queueStatus.stats.pending);
console.log('Failed emails:', queueStatus.stats.failed);
```

### 3. Real-time Monitoring
```javascript
// Đăng ký lắng nghe thay đổi
emailService.subscribe((emails) => {
  console.log(`Total emails: ${emails.length}`);
  console.log(`Unread: ${emails.filter(e => !e.isRead).length}`);
});
```

## 🔧 Cấu hình Production

### Environment Variables
```bash
# Email provider
EMAIL_SERVICE_PROVIDER=sendgrid
SENDGRID_API_KEY=your_sendgrid_key
AWS_SES_REGION=us-east-1
AWS_SES_ACCESS_KEY=your_access_key
AWS_SES_SECRET_KEY=your_secret_key

# API settings
PORT=3001
NODE_ENV=production
```

### Production Setup
```javascript
// Trong email-api-endpoint.js
// Thay thế mock function với real email service

// SendGrid setup
const sgMail = require('@sendgrid/mail');
const sg = sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// AWS SES setup  
const AWS = require('aws-sdk');
const ses = new AWS.SES({...});
```

## 🚨 Troubleshooting

### Port đang được sử dụng
```bash
Error: listen EADDRINUSE :::3001
# Solution: Thay đổi port hoặc kill process
PORT=3002 node email-api-endpoint.js
```

### Email không được gửi
1. Kiểm tra API server có chạy không: `curl http://localhost:3001/health`
2. Kiểm tra console logs của API server
3. Kiểm tra EmailService queue status
4. Xem network tab trong browser DevTools

### CORS Issues
API server đã cấu hình CORS cho tất cả origins. Nếu vẫn gặp lỗi:
```javascript
// Trong email-api-endpoint.js
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));
```

## 📱 Test với Mobile/Tunnel

### Sử dụng ngrok (cho testing từ mobile)
```bash
# Install ngrok
npm install -g ngrok

# Start tunnel
ngrok http 3001

# Cập nhật EmailService provider URL
// Trong EmailService.ts, thay thế:
fetch('https://your-ngrok-url.ngrok.io/api/send-email', ...)
```

## 🎯 Next Steps

1. ✅ **Development**: Mock API server
2. 🔄 **Staging**: SendGrid test API
3. 🚀 **Production**: AWS SES hoặc SendGrid production

## 📞 Support

Nếu gặp vấn đề:
1. Kiểm tra logs: `console.log()` trong browser và API server
2. Test từng endpoint riêng biệt
3. Xem file `email-usage-guide.md` để biết cách sử dụng
4. Run `test-email-service.ts` để test tất cả functions

**Ready to send emails! 📧**
