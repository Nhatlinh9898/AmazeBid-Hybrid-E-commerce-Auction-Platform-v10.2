// Demo sử dụng EmailService - Test các tính năng gửi email thực tế
import { emailService } from './services/EmailService';

// Test function để kiểm tra các method của EmailService
async function testEmailService() {
  console.log('🧪 Bắt đầu test EmailService...');

  try {
    // 1. Test gửi email xác thực
    console.log('📧 1. Gửi email xác thực...');
    await emailService.sendEmailVerification(
      'test@example.com',
      'https://amazebid.com/verify?token=abc123'
    );

    // 2. Test gửi email đặt lại mật khẩu
    console.log('🔐 2. Gửi email đặt lại mật khẩu...');
    await emailService.sendPasswordReset(
      'test@example.com',
      'https://amazebid.com/reset?token=xyz789'
    );

    // 3. Test gửi email thông báo đấu giá bị vượt
    console.log('🔨 3. Gửi email thông báo bị ra giá cao hơn...');
    await emailService.sendAuctionOutbidNotification(
      'test@example.com',
      'iPhone 15 Pro Max',
      25000000,
      'https://amazebid.com/product/iphone15'
    );

    // 4. Test gửi email thông báo đấu giá sắp kết thúc
    console.log('⏰ 4. Gửi email thông báo đấu giá sắp kết thúc...');
    await emailService.sendAuctionEndingNotification(
      'test@example.com',
      'MacBook Pro M3',
      '30 phút',
      'https://amazebid.com/auction/macbook'
    );

    // 5. Test gửi email thanh toán thất bại
    console.log('❌ 5. Gửi email thanh toán thất bại...');
    await emailService.sendPaymentFailedNotification(
      'test@example.com',
      'ORD-2024-001',
      15000000,
      'https://amazebid.com/payment/retry/ORD-2024-001'
    );

    // 6. Test gửi email Flash Sale
    console.log('🔥 6. Gửi email Flash Sale...');
    await emailService.sendFlashSaleNotification(
      'test@example.com',
      'Black Friday Technology',
      50,
      '23:59:59',
      'https://amazebid.com/flashsale'
    );

    // 7. Test gửi email sản phẩm mới
    console.log('📱 7. Gửi email sản phẩm mới...');
    await emailService.sendNewArrivalNotification(
      'test@example.com',
      [
        { name: 'Samsung Galaxy S24', price: 22000000 },
        { name: 'iPad Pro 2024', price: 28000000 }
      ],
      'https://amazebid.com/new-arrivals'
    );

    // 8. Test gửi email thông báo tài khoản bị khóa
    console.log('🚫 8. Gửi email thông báo tài khoản bị khóa...');
    await emailService.sendAccountSuspendedNotification(
      'test@example.com',
      'Vi phạm chính sách cộng đồng nhiều lần',
      'https://amazebid.com/support/appeal'
    );

    // 9. Test gửi email báo cáo hàng tháng
    console.log('📊 9. Gửi email báo cáo hàng tháng...');
    await emailService.sendMonthlyReport(
      'test@example.com',
      {
        orderCount: 5,
        auctionWins: 2,
        totalSpent: 15000000
      }
    );

    // 10. Kiểm tra trạng thái hàng đợi email
    console.log('📋 10. Kiểm tra trạng thái hàng đợi email...');
    const queueStatus = emailService.getQueueStatus();
    console.log('Queue Status:', queueStatus);

    // 11. Kiểm tra analytics
    console.log('📈 11. Kiểm tra email analytics...');
    const analytics = emailService.getEmailAnalytics();
    console.log('Email Analytics:', analytics);

    console.log('✅ Test hoàn thành! Tất cả email đã được thêm vào hàng đợi.');

  } catch (error) {
    console.error('❌ Lỗi trong quá trình test:', error);
  }
}

// Function để kiểm tra các method đã có sẵn
function checkAvailableMethods() {
  console.log('🔍 Kiểm tra các method có sẵn trong EmailService:');
  
  const methods = [
    'sendEmailVerification',
    'sendPasswordReset', 
    'sendAuctionOutbidNotification',
    'sendAuctionEndingNotification',
    'sendPaymentFailedNotification',
    'sendFlashSaleNotification',
    'sendNewArrivalNotification',
    'sendAccountSuspendedNotification',
    'sendMonthlyReport',
    'sendPurchaseConfirmation',
    'sendPaymentEscrowNotification',
    'sendSellerNotification',
    'sendShippingUpdateNotification',
    'sendDeliveryNotification',
    'sendEscrowReleaseNotification',
    'queueEmail',
    'sendTemplateEmail',
    'getQueueStatus',
    'getEmailAnalytics',
    'getAll',
    'subscribe'
  ];

  methods.forEach(method => {
    if (typeof (emailService as any)[method] === 'function') {
      console.log(`✅ ${method}`);
    } else {
      console.log(`❌ ${method} - không tồn tại`);
    }
  });
}

// Function demo sử dụng trong browser console
function browserDemo() {
  console.log(`
🌐 Demo sử dụng EmailService trong browser:

// 1. Gửi email xác thực
await emailService.sendEmailVerification('user@email.com', 'https://amazebid.com/verify?token=abc');

// 2. Gửi email Flash Sale
await emailService.sendFlashSaleNotification('user@email.com', 'Black Friday', 50, '23:59', 'https://amazebid.com/sale');

// 3. Xem trạng thái hàng đợi
emailService.getQueueStatus();

// 4. Đăng ký lắng nghe thay đổi
emailService.subscribe((emails) => {
  console.log('Emails updated:', emails.length);
});

// 5. Lấy tất cả emails
const allEmails = emailService.getAll();
console.log('All emails:', allEmails);
  `);
}

// Export functions để sử dụng
export { testEmailService, checkAvailableMethods, browserDemo };

// Auto-run nếu file được import
if (typeof window !== 'undefined') {
  // Browser environment
  (window as any).testEmailService = testEmailService;
  (window as any).checkAvailableMethods = checkAvailableMethods;
  (window as any).browserDemo = browserDemo;
  
  console.log('🎯 EmailService Demo đã sẵn sàng! Sử dụng:');
  console.log('- testEmailService() để chạy test đầy đủ');
  console.log('- checkAvailableMethods() để kiểm tra methods');
  console.log('- browserDemo() để xem hướng dẫn');
}
