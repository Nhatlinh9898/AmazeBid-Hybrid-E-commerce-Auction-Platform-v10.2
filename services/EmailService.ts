import { EmailTemplate } from '../types';

// Enhanced Email Service Types
interface EmailQueueItem {
  id: string;
  to: string;
  subject: string;
  html: string;
  templateId?: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  attempts: number;
  maxAttempts: number;
  nextRetryAt?: string;
  status: 'PENDING' | 'SENDING' | 'SENT' | 'FAILED';
  createdAt: string;
  sentAt?: string;
  deliveryStatus?: 'PENDING' | 'DELIVERED' | 'BOUNCE' | 'COMPLAINT';
  trackingId?: string;
  metadata?: Record<string, any>;
}

interface EmailTemplateData {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  placeholders: string[];
  category: 'TRANSACTIONAL' | 'MARKETING' | 'SYSTEM';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface EmailProvider {
  name: string;
  send: (to: string, subject: string, html: string, metadata?: any) => Promise<{ success: boolean; trackingId?: string; error?: string }>;
  isEnabled: boolean;
  priority: number;
}

interface EmailAnalytics {
  id: string;
  emailId: string;
  templateId?: string;
  userId?: string;
  sentAt: string;
  deliveredAt?: string;
  openedAt?: string;
  clickedAt?: string;
  bouncedAt?: string;
  complainedAt?: string;
  device?: string;
  location?: string;
}

class EmailService {
  private emails: EmailTemplate[] = [
    {
      id: 'welcome',
      subject: 'Chào mừng bạn đến với AmazeBid!',
      to: 'nguoidung@example.com',
      type: 'SYSTEM',
      isRead: false,
      timestamp: new Date().toISOString(),
      htmlContent: '<h1>Chào mừng!</h1><p>Cảm ơn bạn đã tham gia AmazeBid - nền tảng thương mại điện tử lai thế hệ mới.</p>',
      lastModified: new Date().toISOString()
    },
    {
      id: 'bid-won-demo',
      subject: 'Chúc mừng! Bạn đã thắng đấu giá',
      to: 'nguoidung@example.com',
      type: 'AUCTION_WIN',
      isRead: false,
      timestamp: new Date().toISOString(),
      htmlContent: '<h1>Thắng đấu giá!</h1><p>Bạn đã thắng sản phẩm <strong>iPhone 15 Pro</strong> với giá 25,000,000đ.</p>',
      lastModified: new Date().toISOString()
    },
    {
      id: 'email-verification',
      subject: 'Xác thực địa chỉ email của bạn',
      to: 'nguoidung@example.com',
      type: 'SYSTEM',
      isRead: false,
      timestamp: new Date().toISOString(),
      htmlContent: '<h1>Xác thực Email</h1><p>Vui lòng nhấp vào liên kết dưới đây để xác thực địa chỉ email của bạn: <a href="#">Xác thực ngay</a></p>',
      lastModified: new Date().toISOString()
    },
    {
      id: 'password-reset',
      subject: 'Đặt lại mật khẩu của bạn',
      to: 'nguoidung@example.com',
      type: 'SYSTEM',
      isRead: false,
      timestamp: new Date().toISOString(),
      htmlContent: '<h1>Đặt lại Mật khẩu</h1><p>Bạn đã yêu cầu đặt lại mật khẩu. Vui lòng nhấp vào liên kết sau: <a href="#">Đặt lại mật khẩu</a></p>',
      lastModified: new Date().toISOString()
    },
    {
      id: 'auction-outbid',
      subject: 'Bạn đã bị ra giá cao hơn',
      to: 'nguoidung@example.com',
      type: 'AUCTION',
      isRead: false,
      timestamp: new Date().toISOString(),
      htmlContent: '<h1>Thông báo Đấu giá</h1><p>Ai đó đã ra giá cao hơn bạn cho sản phẩm <strong>MacBook Pro</strong>. Ra giá lại ngay!</p>',
      lastModified: new Date().toISOString()
    },
    {
      id: 'auction-ending',
      subject: 'Đấu giá sắp kết thúc',
      to: 'nguoidung@example.com',
      type: 'AUCTION',
      isRead: false,
      timestamp: new Date().toISOString(),
      htmlContent: '<h1>Đấu giá sắp kết thúc</h1><p>Đấu giá cho <strong>iPhone 15 Pro</strong> sẽ kết thúc trong 1 giờ tới!</p>',
      lastModified: new Date().toISOString()
    },
    {
      id: 'payment-failed',
      subject: 'Thanh toán không thành công',
      to: 'nguoidung@example.com',
      type: 'PAYMENT',
      isRead: false,
      timestamp: new Date().toISOString(),
      htmlContent: '<h1>Thanh toán thất bại</h1><p>Giao dịch của bạn không thể hoàn tất. Vui lòng kiểm tra thông tin thanh toán và thử lại.</p>',
      lastModified: new Date().toISOString()
    },
    {
      id: 'order-shipped',
      subject: 'Đơn hàng của bạn đã được gửi',
      to: 'nguoidung@example.com',
      type: 'SHIPPING',
      isRead: false,
      timestamp: new Date().toISOString(),
      htmlContent: '<h1>Đơn hàng đã được gửi</h1><p>Đơn hàng #12345 đã được gửi đi. Mã vận chuyển: <strong>ABC123</strong></p>',
      lastModified: new Date().toISOString()
    },
    {
      id: 'promotion-flash-sale',
      subject: '🔥 Flash Sale Giảm giá đến 50%!',
      to: 'nguoidung@example.com',
      type: 'MARKETING',
      isRead: false,
      timestamp: new Date().toISOString(),
      htmlContent: '<h1>Flash Sale!</h1><p>Giảm giá đến 50% cho các sản phẩm công nghệ. Chỉ trong 24 giờ!</p>',
      lastModified: new Date().toISOString()
    },
    {
      id: 'promotion-new-arrival',
      subject: '📱 Sản phẩm mới đã có mặt',
      to: 'nguoidung@example.com',
      type: 'MARKETING',
      isRead: false,
      timestamp: new Date().toISOString(),
      htmlContent: '<h1>Sản phẩm mới</h1><p>Khám phá các sản phẩm mới nhất vừa được thêm vào hệ thống.</p>',
      lastModified: new Date().toISOString()
    },
    {
      id: 'account-suspended',
      subject: 'Tài khoản của bạn đã bị tạm khóa',
      to: 'nguoidung@example.com',
      type: 'SYSTEM',
      isRead: false,
      timestamp: new Date().toISOString(),
      htmlContent: '<h1>Tài khoản bị tạm khóa</h1><p>Tài khoản của bạn đã bị tạm khóa do vi phạm điều khoản sử dụng. Vui lòng liên hệ hỗ trợ.</p>',
      lastModified: new Date().toISOString()
    },
    {
      id: 'monthly-report',
      subject: 'Báo cáo hoạt động hàng tháng',
      to: 'nguoidung@example.com',
      type: 'SYSTEM',
      isRead: false,
      timestamp: new Date().toISOString(),
      htmlContent: '<h1>Báo cáo hàng tháng</h1><p>Tổng quan hoạt động của bạn trong tháng vừa qua: 5 đơn hàng, 2 đấu giá thắng, tổng chi tiêu: 15,000,000đ</p>',
      lastModified: new Date().toISOString()
    }
  ];

  // Enhanced Email Service Properties
  private emailQueue: EmailQueueItem[] = [];
  private templates: EmailTemplateData[] = [];
  private providers: EmailProvider[] = [];
  private analytics: EmailAnalytics[] = [];
  private isProcessingQueue = false;
  private queueProcessingInterval?: NodeJS.Timeout;

  private listeners: ((emails: EmailTemplate[]) => void)[] = [];

  constructor() {
    this.loadFromStorage();
    this.initializeProviders();
    this.initializeDefaultTemplates();
    this.startQueueProcessor();
  }

  private loadFromStorage() {
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem('mock_emails');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            this.emails = parsed;
          }
        }
        
        // Load enhanced email data
        const queueData = localStorage.getItem('email_queue');
        if (queueData) {
          this.emailQueue = JSON.parse(queueData);
        }
        
        const templatesData = localStorage.getItem('email_templates');
        if (templatesData) {
          this.templates = JSON.parse(templatesData);
        }
        
        const analyticsData = localStorage.getItem('email_analytics');
        if (analyticsData) {
          this.analytics = JSON.parse(analyticsData);
        }
      }
    } catch (e) {
      console.error('Failed to load email data', e);
    }
  }

  private save() {
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.setItem('mock_emails', JSON.stringify(this.emails));
        localStorage.setItem('email_queue', JSON.stringify(this.emailQueue));
        localStorage.setItem('email_templates', JSON.stringify(this.templates));
        localStorage.setItem('email_analytics', JSON.stringify(this.analytics));
      }
    } catch {
      // Ignore
    }
    this.notify();
  }

  private notify() {
    this.listeners.forEach(l => l([...this.emails]));
  }

  // Initialize Email Providers
  private initializeProviders() {
    // Default provider using existing fetch API
    this.providers = [
      {
        name: 'Default',
        send: async (to: string, subject: string, html: string, metadata?: any) => {
          try {
            const response = await fetch('/api/send-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ to, subject, html, metadata })
            });
            if (response.ok) {
              const result = await response.json();
              return { success: true, trackingId: result.id };
            } else {
              return { success: false, error: 'API call failed' };
            }
          } catch (error) {
            console.error('Error sending email:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
          }
        },
        isEnabled: true,
        priority: 1
      },
      {
        name: 'Gmail',
        send: async (to: string, subject: string, html: string, metadata?: any) => {
          try {
            const response = await fetch('/api/send-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ to, subject, html, metadata, provider: 'gmail' })
            });
            if (response.ok) {
              const result = await response.json();
              return { success: true, trackingId: result.id };
            } else {
              return { success: false, error: 'Gmail API call failed' };
            }
          } catch (error) {
            console.error('Error sending email via Gmail:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
          }
        },
        isEnabled: false,
        priority: 2
      },
      {
        name: 'SendGrid',
        send: async (to: string, subject: string, html: string, metadata?: any) => {
          // SendGrid implementation would go here
          console.log('SendGrid provider not configured');
          return { success: false, error: 'SendGrid not configured' };
        },
        isEnabled: false,
        priority: 3
      },
      {
        name: 'AWS SES',
        send: async (to: string, subject: string, html: string, metadata?: any) => {
          // AWS SES implementation would go here
          console.log('AWS SES provider not configured');
          return { success: false, error: 'AWS SES not configured' };
        },
        isEnabled: false,
        priority: 4
      }
    ];
  }

  // Initialize Default Email Templates
  private initializeDefaultTemplates() {
    this.templates = [
      {
        id: 'welcome',
        name: 'Welcome Email',
        subject: 'Chào mừng {{userName}} đến với AmazeBid!',
        htmlContent: this.getModernLayout(
          'Chào mừng đến với AmazeBid!',
          '<h2>Chào mừng {{userName}}!</h2><p>Cảm ơn bạn đã tham gia AmazeBid - nền tảng thương mại điện tử lai thế hệ mới.</p><p>Bắt đầu khám phá các tính năng tuyệt vời của chúng tôi ngay hôm nay.</p>',
          'Bạn nhận được email này vì đã đăng ký tài khoản tại AmazeBid.'
        ),
        placeholders: ['userName'],
        category: 'TRANSACTIONAL',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'auction-won',
        name: 'Auction Won Notification',
        subject: 'Chúc mừng! Bạn đã thắng đấu giá: {{productTitle}}',
        htmlContent: this.getModernLayout(
          'Thắng đấu giá!',
          '<h2>🎉 Bạn đã thắng cuộc đấu giá!</h2><p>Chào <strong>{{userName}}</strong>,</p><p>Bạn đã thắng sản phẩm <strong>{{productTitle}}</strong> với giá {{winningAmount}}.</p><p>Để đảm bảo quyền sở hữu, vui lòng hoàn tất thanh toán trong vòng <strong>24 giờ</strong> tới.</p>',
          'Chúc mừng bạn đã thắng đấu giá!'
        ),
        placeholders: ['userName', 'productTitle', 'winningAmount'],
        category: 'TRANSACTIONAL',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }

  // Start Queue Processor
  private startQueueProcessor() {
    if (this.queueProcessingInterval) {
      clearInterval(this.queueProcessingInterval);
    }
    
    this.queueProcessingInterval = setInterval(() => {
      this.processQueue();
    }, 5000); // Process every 5 seconds
  }

  // Process Email Queue
  private async processQueue() {
    if (this.isProcessingQueue) return;
    
    this.isProcessingQueue = true;
    
    try {
      const pendingEmails = this.emailQueue
        .filter(item => item.status === 'PENDING' && (!item.nextRetryAt || new Date(item.nextRetryAt) <= new Date()))
        .sort((a, b) => {
          const priorityOrder = { URGENT: 4, HIGH: 3, NORMAL: 2, LOW: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
      
      for (const email of pendingEmails) {
        await this.sendQueuedEmail(email);
      }
    } catch (error) {
      console.error('Error processing email queue:', error);
    } finally {
      this.isProcessingQueue = false;
    }
  }

  // Send Queued Email
  private async sendQueuedEmail(email: EmailQueueItem) {
    email.status = 'SENDING';
    email.attempts++;
    
    const provider = this.providers.find(p => p.isEnabled);
    if (!provider) {
      email.status = 'FAILED';
      this.save();
      return;
    }
    
    try {
      const result = await provider.send(email.to, email.subject, email.html, email.metadata);
      
      if (result.success) {
        email.status = 'SENT';
        email.sentAt = new Date().toISOString();
        email.trackingId = result.trackingId;
        email.deliveryStatus = 'PENDING';
        
        // Add to analytics
        this.analytics.push({
          id: `analytics-${Date.now()}`,
          emailId: email.id,
          templateId: email.templateId,
          userId: email.metadata?.userId,
          sentAt: email.sentAt
        });
      } else {
        if (email.attempts >= email.maxAttempts) {
          email.status = 'FAILED';
        } else {
          email.status = 'PENDING';
          // Exponential backoff: 5min, 15min, 45min, 2hr, 6hr
          const delay = Math.min(5 * Math.pow(3, email.attempts - 1), 360); // Max 6 hours
          email.nextRetryAt = new Date(Date.now() + delay * 60 * 1000).toISOString();
        }
      }
    } catch (error) {
      if (email.attempts >= email.maxAttempts) {
        email.status = 'FAILED';
      } else {
        email.status = 'PENDING';
        const delay = Math.min(5 * Math.pow(3, email.attempts - 1), 360);
        email.nextRetryAt = new Date(Date.now() + delay * 60 * 1000).toISOString();
      }
    }
    
    this.save();
  }

  // Enhanced Email Service Public Methods
  
  // Queue Email with Priority
  queueEmail(
    to: string,
    subject: string,
    html: string,
    priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' = 'NORMAL',
    templateId?: string,
    metadata?: Record<string, any>
  ): string {
    const emailId = `queue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const queueItem: EmailQueueItem = {
      id: emailId,
      to,
      subject,
      html,
      templateId,
      priority,
      attempts: 0,
      maxAttempts: 5,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      metadata
    };
    
    this.emailQueue.push(queueItem);
    this.save();
    
    return emailId;
  }

  // Send Email Using Template
  async sendTemplateEmail(
    templateId: string,
    to: string,
    data: Record<string, any>,
    priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' = 'NORMAL',
    metadata?: Record<string, any>
  ): Promise<string> {
    const template = this.templates.find(t => t.id === templateId && t.isActive);
    if (!template) {
      throw new Error(`Template ${templateId} not found or inactive`);
    }
    
    const subject = this.replacePlaceholders(template.subject, data);
    const html = this.replacePlaceholders(template.htmlContent, data);
    
    return this.queueEmail(to, subject, html, priority, templateId, { ...metadata, templateData: data });
  }

  // Replace Placeholders in Template
  private replacePlaceholders(content: string, data: Record<string, any>): string {
    return content.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] !== undefined ? String(data[key]) : match;
    });
  }

  // Get Queue Status
  getQueueStatus() {
    const stats = {
      total: this.emailQueue.length,
      pending: this.emailQueue.filter(e => e.status === 'PENDING').length,
      sending: this.emailQueue.filter(e => e.status === 'SENDING').length,
      sent: this.emailQueue.filter(e => e.status === 'SENT').length,
      failed: this.emailQueue.filter(e => e.status === 'FAILED').length
    };
    
    return {
      stats,
      items: this.emailQueue
    };
  }

  // Get Email Analytics
  getEmailAnalytics(templateId?: string, userId?: string) {
    let filtered = this.analytics;
    
    if (templateId) {
      filtered = filtered.filter(a => a.templateId === templateId);
    }
    
    if (userId) {
      filtered = filtered.filter(a => a.userId === userId);
    }
    
    return {
      total: filtered.length,
      sent: filtered.filter(a => a.sentAt).length,
      delivered: filtered.filter(a => a.deliveredAt).length,
      opened: filtered.filter(a => a.openedAt).length,
      clicked: filtered.filter(a => a.clickedAt).length,
      bounced: filtered.filter(a => a.bouncedAt).length,
      complained: filtered.filter(a => a.complainedAt).length,
      items: filtered
    };
  }

  // Update Delivery Status (for webhook callbacks)
  updateDeliveryStatus(emailId: string, status: 'DELIVERED' | 'BOUNCE' | 'COMPLAINT', metadata?: any) {
    const email = this.emailQueue.find(e => e.id === emailId || e.trackingId === emailId);
    if (email) {
      email.deliveryStatus = status;
      
      // Update analytics
      const analytic = this.analytics.find(a => a.emailId === email.id);
      if (analytic) {
        switch (status) {
          case 'DELIVERED':
            analytic.deliveredAt = new Date().toISOString();
            break;
          case 'BOUNCE':
            analytic.bouncedAt = new Date().toISOString();
            break;
          case 'COMPLAINT':
            analytic.complainedAt = new Date().toISOString();
            break;
        }
        
        if (metadata) {
          Object.assign(analytic, metadata);
        }
      }
      
      this.save();
    }
  }

  // Track Email Open (for tracking pixel)
  trackEmailOpen(emailId: string, device?: string, location?: string) {
    const analytic = this.analytics.find(a => a.emailId === emailId);
    if (analytic && !analytic.openedAt) {
      analytic.openedAt = new Date().toISOString();
      if (device) analytic.device = device;
      if (location) analytic.location = location;
      this.save();
    }
  }

  // Track Email Click
  trackEmailClick(emailId: string) {
    const analytic = this.analytics.find(a => a.emailId === emailId);
    if (analytic && !analytic.clickedAt) {
      analytic.clickedAt = new Date().toISOString();
      this.save();
    }
  }

  // Template Management
  getTemplates() {
    return this.templates;
  }

  addTemplate(template: Omit<EmailTemplateData, 'id' | 'createdAt' | 'updatedAt'>) {
    const newTemplate: EmailTemplateData = {
      ...template,
      id: `template-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.templates.push(newTemplate);
    this.save();
    
    return newTemplate;
  }

  updateTemplate(id: string, updates: Partial<EmailTemplateData>) {
    const template = this.templates.find(t => t.id === id);
    if (template) {
      Object.assign(template, updates, { updatedAt: new Date().toISOString() });
      this.save();
      return template;
    }
    throw new Error(`Template ${id} not found`);
  }

  deleteTemplate(id: string) {
    const index = this.templates.findIndex(t => t.id === id);
    if (index !== -1) {
      this.templates.splice(index, 1);
      this.save();
      return true;
    }
    return false;
  }

  // Provider Management
  getProviders() {
    return this.providers;
  }

  // Cleanup Old Data
  cleanupOldData(daysToKeep: number = 30) {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    
    // Clean old queue items
    this.emailQueue = this.emailQueue.filter(email => 
      new Date(email.createdAt) > cutoffDate || email.status === 'PENDING'
    );
    
    // Clean old analytics
    this.analytics = this.analytics.filter(analytic => 
      new Date(analytic.sentAt) > cutoffDate
    );
    
    this.save();
  }

  // Legacy method for backward compatibility
  private async sendRealEmail(to: string, subject: string, html: string) {
    // Queue the email with NORMAL priority for backward compatibility
    this.queueEmail(to, subject, html, 'NORMAL');
  }

  private getModernLayout(title: string, content: string, footerNote: string = "") {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          .email-wrapper { background-color: #f1f5f9; padding: 40px 20px; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
          .email-card { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
          .email-header { background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 32px; text-align: center; color: white; }
          .email-body { padding: 32px; line-height: 1.6; color: #1e293b; }
          .email-footer { padding: 24px; text-align: center; background-color: #f8fafc; color: #64748b; font-size: 13px; }
          .btn { display: inline-block; padding: 12px 28px; background-color: #2563eb; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
          .recommendation-card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-top: 24px; display: flex; align-items: center; gap: 16px; }
          .recommendation-img { width: 60px; height: 60px; background: #f1f5f9; border-radius: 8px; overflow: hidden; }
          .price-tag { color: #2563eb; font-weight: bold; }
          .social-icons { margin-top: 16px; opacity: 0.6; }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-card">
            <div class="email-header">
              <h1 style="margin: 0; font-size: 24px; letter-spacing: 1px;">AmazeBid</h1>
              <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 14px;">Hybrid E-commerce & Auction Platform</p>
            </div>
            <div class="email-body">
              ${content}
              
              <div style="margin-top: 40px; border-top: 1px solid #f1f5f9; padding-top: 24px;">
                <h3 style="font-size: 16px; color: #334155; margin-bottom: 16px;">Có thể bạn cũng quan tâm:</h3>
                
                <div class="recommendation-card">
                  <div class="recommendation-img"><img src="https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=100" style="width:100%; height:100%; object-fit:cover;"></div>
                  <div>
                    <div style="font-weight: 600; font-size: 14px;">Gói Bảo hiểm VIP AmazeSafe</div>
                    <div class="price-tag">Chỉ từ 99.000đ/tháng</div>
                  </div>
                </div>

                <div class="recommendation-card">
                  <div class="recommendation-img"><img src="https://images.unsplash.com/photo-1544725121-be3b5d0c19cb?w=100" style="width:100%; height:100%; object-fit:cover;"></div>
                  <div>
                    <div style="font-weight: 600; font-size: 14px;">Dịch vụ Giám định Thật-Giả</div>
                    <div class="price-tag">Miễn phí cho đơn từ 5.000.000đ</div>
                  </div>
                </div>
              </div>
            </div>
            <div class="email-footer">
              <p>${footerNote || "Bạn nhận được email này vì đã đăng ký tài khoản tại AmazeBid."}</p>
              <div class="social-icons">
                Facebook | Twitter | LinkedIn
              </div>
              <p style="margin-top: 16px;">&copy; 2024 AmazeBid Inc. 123 Innovation Drive, Silicon Valley.</p>
              <p><a href="#" style="color: #64748b; text-decoration: underline;">Hủy đăng ký</a> | <a href="#" style="color: #64748b; text-decoration: underline;">Cài đặt thông báo</a></p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Specific Notification Methods
  sendKYCStatusNotification(user: any, status: 'APPROVED' | 'REJECTED' | 'PENDING') {
    const subject = status === 'APPROVED' ? 'Tài khoản của bạn đã được xác minh!' : 'Cập nhật trạng thái KYC';
    const content = `
      <h2 style="color: #1e293b; margin-top: 0;">Thông báo Xác minh Danh tính (KYC)</h2>
      <p>Chào <strong>${user.fullName}</strong>,</p>
      <p>Hệ thống AI của AmazeBid đã hoàn tất kiểm tra hồ sơ của bạn.</p>
      <div style="background: #f1f5f9; padding: 20px; border-radius: 12px; margin: 24px 0; text-align: center;">
        <div style="font-size: 14px; color: #64748b; margin-bottom: 4px;">Trạng thái hiện tại:</div>
        <div style="color: ${status === 'APPROVED' ? '#10b981' : '#ef4444'}; font-weight: 800; font-size: 20px;">
          ${status === 'APPROVED' ? '● ĐÃ PHÊ DUYỆT' : status === 'REJECTED' ? '● TỪ CHỐI' : '● ĐANG CHỜ'}
        </div>
      </div>
      <p>${status === 'APPROVED' ? 'Chúc mừng! Bạn hiện đã có thể thực hiện các giao dịch giá trị cao và tham gia các cuộc đấu giá VIP.' : 'Rất tiếc, thông tin bạn cung cấp chưa đủ rõ ràng. Vui lòng cập nhật hình ảnh CCCD mới.'}</p>
      <div style="text-align: center;">
        <a href="${window.location.origin}/profile" class="btn">Kiểm tra thông tin</a>
      </div>
    `;

    const html = this.getModernLayout(subject, content);

    this.addEmailTemplate({
      id: `kyc-${Date.now()}`,
      subject,
      to: user.email,
      type: 'KYC',
      isRead: false,
      timestamp: new Date().toISOString(),
      htmlContent: html
    });

    this.sendRealEmail(user.email, subject, html);
  }

  sendAuctionWinNotification(user: any, product: any, amount: number) {
    const subject = `Chúc mừng! Bạn đã thắng đấu giá: ${product.title}`;
    const content = `
      <h2 style="color: #1e293b; margin-top: 0;">🎉 Bạn đã thắng cuộc đấu giá!</h2>
      <p>Chào <strong>${user.fullName}</strong>,</p>
      <p>Bạn đã vượt qua các đối thủ khác để trở thành người sở hữu sản phẩm tuyệt vời này:</p>
      
      <div style="border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; margin: 24px 0;">
        <div style="display: flex; gap: 16px;">
          <div style="flex: 1;">
            <div style="font-weight: 700; font-size: 18px;">${product.title}</div>
            <div style="color: #64748b; font-size: 14px; margin-top: 4px;">Mã số thầu: #BID-${Math.floor(Math.random()*10000)}</div>
          </div>
        </div>
        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px dashed #e2e8f0; display: flex; justify-content: space-between;">
          <span style="color: #64748b;">Giá thắng thầu:</span>
          <span style="font-weight: 800; color: #2563eb; font-size: 20px;">${amount.toLocaleString()}đ</span>
        </div>
      </div>

      <p>Để đảm bảo quyền sở hữu, vui lòng hoàn tất thanh toán trong vòng <strong>24 giờ</strong> tới.</p>
      <div style="text-align: center;">
        <a href="${window.location.origin}/orders" class="btn">Thanh toán & Nhận hàng</a>
      </div>
    `;

    const html = this.getModernLayout(subject, content);

    this.addEmailTemplate({
      id: `bid-${Date.now()}`,
      subject,
      to: user.email,
      type: 'AUCTION_WIN',
      isRead: false,
      timestamp: new Date().toISOString(),
      htmlContent: html
    });

    this.sendRealEmail(user.email, subject, html);
  }

  async sendPurchaseConfirmation(user: any, order: any) {
    const subject = `Xác nhận đơn hàng #${order.id} - Cảm ơn bạn đã mua hàng!`;
    const content = `
      <h2 style="color: #1e293b; margin-top: 0;">Xác nhận Mua hàng Thành công</h2>
      <p>Chào <strong>${user.fullName}</strong>,</p>
      <p>Cảm ơn bạn đã tin tưởng AmazeBid. Đơn hàng của bạn đang được người bán chuẩn bị.</p>
      
      <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin: 24px 0;">
        <h3 style="margin-top: 0; font-size: 16px; color: #334155;">Chi tiết đơn hàng #${order.id}</h3>
        <table style="width: 100%; border-collapse: collapse;">
          ${order.items.map((item: any) => `
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                <div style="font-weight: 600;">${item.title}</div>
                <div style="font-size: 13px; color: #64748b;">Số lượng: ${item.quantity}</div>
              </td>
              <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600;">
                ${item.price.toLocaleString()}đ
              </td>
            </tr>
          `).join('')}
          <tr>
            <td style="padding: 16px 0 0 0; text-align: right;"><strong>Tổng thanh toán:</strong></td>
            <td style="padding: 16px 0 0 0; text-align: right; font-size: 18px; color: #2563eb; font-weight: 800;">
              ${order.totalAmount.toLocaleString()}đ
            </td>
          </tr>
        </table>
      </div>

      <p>Số tiền này hiện đang được <strong>AmazeBid Escrow</strong> tạm giữ an toàn cho đến khi bạn xác nhận đã nhận hàng.</p>
      <div style="text-align: center;">
        <a href="${window.location.origin}/orders" class="btn">Xem trạng thái vận chuyển</a>
      </div>
    `;

    const html = this.getModernLayout(subject, content);

    this.addEmailTemplate({
      id: `purchase-${Date.now()}`,
      subject,
      to: user.email,
      type: 'PURCHASE',
      isRead: false,
      timestamp: new Date().toISOString(),
      htmlContent: html
    });

    this.sendRealEmail(user.email, subject, html);
  }

  async sendPaymentEscrowNotification(user: any, order: any) {
    const subject = `Bảo vệ thanh toán (Escrow) - Đơn hàng #${order.id}`;
    const content = `
      <h2 style="color: #059669; margin-top: 0;">🛡️ Thanh toán của bạn đã được bảo vệ</h2>
      <p>Chào <strong>${user.fullName}</strong>,</p>
      <p>Số tiền <strong>${order.totalAmount.toLocaleString()}đ</strong> cho đơn hàng <strong>#${order.id}</strong> đã được chuyển vào hệ thống tạm giữ an toàn của AmazeBid.</p>
      
      <div style="background: #ecfdf5; border-radius: 12px; padding: 24px; margin: 24px 0; border: 1px solid #d1fae5;">
        <h3 style="margin-top: 0; font-size: 16px; color: #065f46;">Quy trình AmazeSafe Escrow:</h3>
        <ol style="padding-left: 20px; color: #065f46;">
          <li style="margin-bottom: 8px;">Người bán nhận thông báo và tiến hành giao hàng.</li>
          <li style="margin-bottom: 8px;">Hệ thống theo dõi vận đơn thời gian thực.</li>
          <li>Tiền chỉ được giải ngân cho người bán sau khi bạn xác nhận "Đã nhận hàng".</li>
        </ol>
      </div>
      
      <p>AmazeBid cam kết bảo vệ quyền lợi người mua 100%. Nếu hàng không đúng mô tả, bạn có quyền yêu cầu hoàn tiền ngay lập tức.</p>
    `;

    const html = this.getModernLayout(subject, content);

    this.addEmailTemplate({
      id: `escrow-${Date.now()}`,
      subject,
      to: user.email,
      type: 'PAYMENT_CONFIRMATION',
      isRead: false,
      timestamp: new Date().toISOString(),
      htmlContent: html
    });

    this.sendRealEmail(user.email, subject, html);
  }

  async sendSellerNotification(sellerEmail: string, order: any) {
    const subject = `🔥 Đơn hàng mới! Khách hàng đã thanh toán đơn #${order.id}`;
    const content = `
      <h2 style="color: #2563eb; margin-top: 0;">Bạn có đơn hàng mới!</h2>
      <p>Xin chào đối tác bán hàng,</p>
      <p>Thật tuyệt vời! Một khách hàng vừa chốt đơn sản phẩm của bạn. Tiền hàng đã được hệ thống tạm giữ an toàn.</p>
      
      <div style="background: #eff6ff; border-radius: 12px; padding: 24px; margin: 24px 0; border: 1px solid #dbeafe;">
        <div style="font-size: 14px; color: #1e40af;">Số tiền sẽ nhận (tạm giữ):</div>
        <div style="font-size: 28px; font-weight: 800; color: #1d4ed8; margin: 8px 0;">${order.totalAmount.toLocaleString()}đ</div>
        <div style="font-size: 14px; color: #1e40af;">Mã đơn hàng: #${order.id}</div>
      </div>

      <p>Vui lòng đóng gói và gửi hàng trong vòng 48h để đảm bảo tỷ lệ phản hồi tốt. Sau khi gửi, hãy cập nhật Mã vận đơn ngay trong trang quản trị.</p>
      
      <div style="text-align: center;">
        <a href="${window.location.origin}/admin/products" class="btn">Giao hàng ngay</a>
      </div>
    `;

    const html = this.getModernLayout(subject, content, "Vui lòng hoàn tất đơn hàng đúng hạn để tránh bị phạt điểm uy tín.");

    this.addEmailTemplate({
      id: `seller-${Date.now()}`,
      subject,
      to: sellerEmail,
      type: 'SYSTEM',
      isRead: false,
      timestamp: new Date().toISOString(),
      htmlContent: html
    });

    this.sendRealEmail(sellerEmail, subject, html);
  }

  async sendShippingUpdateNotification(user: any, product: any, trackingInfo: any) {
    const subject = `🚚 Đơn hàng đang đến bạn: ${product.title}`;
    const content = `
      <h2 style="color: #1e293b; margin-top: 0;">Đơn hàng đã được bàn giao cho vận chuyển</h2>
      <p>Chào <strong>${user.fullName}</strong>,</p>
      <p>Tin vui! Sản phẩm <strong>${product.title}</strong> của bạn đã bắt đầu hành trình đến địa chỉ nhận hàng.</p>
      
      <div style="border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; margin: 24px 0;">
        <div style="background: #f8fafc; padding: 16px; border-bottom: 1px solid #e2e8f0;">
          <div style="font-weight: 700;">Thông tin vận đơn</div>
        </div>
        <div style="padding: 20px;">
          <p style="margin: 0 0 8px 0;"><strong>Đơn vị:</strong> ${trackingInfo.carrier}</p>
          <p style="margin: 0 0 8px 0;"><strong>Mã vận đơn:</strong> <span style="font-family: monospace; background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">${trackingInfo.trackingNumber}</span></p>
          <p style="margin: 0;"><strong>Dự kiến nhận:</strong> Trong 2-3 ngày tới</p>
        </div>
      </div>

      <p>Hệ thống AI sẽ liên tục cập nhật vị trí đơn hàng cho bạn.</p>
      <div style="text-align: center;">
        <a href="${window.location.origin}/orders" class="btn">Theo dõi hành trình</a>
      </div>
    `;

    const html = this.getModernLayout(subject, content);

    this.addEmailTemplate({
      id: `ship-${Date.now()}`,
      subject,
      to: user.email,
      type: 'SHIPPING',
      isRead: false,
      timestamp: new Date().toISOString(),
      htmlContent: html
    });

    this.sendRealEmail(user.email, subject, html);
  }

  sendWalletTransferNotification(user: any, amount: number, type: 'DEPOSIT' | 'WITHDRAWAL' | 'BONUS') {
    const isIncrease = type === 'DEPOSIT' || type === 'BONUS';
    const subject = `Biến động số dư: ${isIncrease ? '+' : '-'} ${amount.toLocaleString()}đ`;
    const content = `
      <h2 style="color: #1e293b; margin-top: 0;">Thông báo Giao dịch Ví AmazeBid</h2>
      <p>Chào <strong>${user.fullName}</strong>,</p>
      <p>Ví của bạn vừa ghi nhận một giao dịch mới:</p>
      
      <div style="background: #f8fafc; border-radius: 16px; padding: 32px; text-align: center; margin: 24px 0;">
        <div style="font-size: 14px; color: #64748b; margin-bottom: 8px;">Số tiền thay đổi:</div>
        <div style="font-size: 32px; font-weight: 800; color: ${isIncrease ? '#10b981' : '#ef4444'};">
          ${isIncrease ? '+' : '-'} ${amount.toLocaleString()}đ
        </div>
        <div style="margin-top: 16px; font-size: 14px; color: #334155;">
          <strong>Nội dung:</strong> ${type === 'DEPOSIT' ? 'Nạp tiền vào ví' : type === 'WITHDRAWAL' ? 'Rút tiền tài khoản' : 'Thưởng hệ thống'}
        </div>
      </div>
      
      <p>Vui lòng kiểm tra lại lịch sử giao dịch nếu có bất kỳ thắc mắc nào.</p>
      <div style="text-align: center;">
        <a href="${window.location.origin}/wallet" class="btn">Quản lý Ví</a>
      </div>
    `;

    const html = this.getModernLayout(subject, content);

    this.addEmailTemplate({
      id: `wallet-${Date.now()}`,
      subject,
      to: user.email,
      type: 'SYSTEM',
      isRead: false,
      timestamp: new Date().toISOString(),
      htmlContent: html
    });

    this.sendRealEmail(user.email, subject, html);
  }

  async sendDeliveryNotification(user: any, product: any) {
    const subject = `✅ Kiện hàng đã được giao: ${product.title}`;
    const content = `
      <h2 style="color: #10b981; margin-top: 0;">Giao hàng thành công!</h2>
      <p>Chào <strong>${user.fullName}</strong>,</p>
      <p>Sản phẩm <strong>${product.title}</strong> đã được shipper giao đến bạn thành công.</p>
      
      <div style="background: #f0fdf4; border-radius: 12px; padding: 24px; margin: 24px 0; border: 1px solid #bbf7d0;">
        <p style="margin: 0; color: #166534;"><strong>Lưu ý quan trọng:</strong></p>
        <p style="margin: 8px 0 0 0; color: #166534; font-size: 14px;">Vui lòng kiểm tra sản phẩm thực tế. Nếu hài lòng, hãy nhấn "Xác nhận nhận hàng" để hoàn tất. Bạn có 3 ngày trước khi hệ thống tự động giải ngân.</p>
      </div>

      <div style="text-align: center;">
        <a href="${window.location.origin}/orders" class="btn">Xác nhận đã nhận hàng</a>
      </div>
    `;

    const html = this.getModernLayout(subject, content);

    this.addEmailTemplate({
      id: `delivery-${Date.now()}`,
      subject,
      to: user.email,
      type: 'SHIPPING',
      isRead: false,
      timestamp: new Date().toISOString(),
      htmlContent: html
    });

    this.sendRealEmail(user.email, subject, html);
  }

  async sendEscrowReleaseNotification(sellerEmail: string, orderId: string, amount: number) {
    const subject = `💰 Tiền đã về ví! Giải ngân đơn hàng #${orderId}`;
    const content = `
      <h2 style="color: #10b981; margin-top: 0;">Thông báo Giải ngân tiền hàng</h2>
      <p>Xin chào đối tác bán hàng,</p>
      <p>Chúc mừng! Khách hàng đã hài lòng và xác nhận nhận hàng cho đơn #${orderId}. Số tiền đã được chuyển từ hệ thống tạm giữ vào Ví khả dụng của bạn.</p>
      
      <div style="background: #f0fdf4; border-radius: 16px; padding: 32px; text-align: center; margin: 24px 0; border: 2px solid #bbf7d0;">
        <div style="font-size: 14px; color: #166534; margin-bottom: 8px;">Số tiền đã giải ngân:</div>
        <div style="font-size: 32px; font-weight: 800; color: #15803d;">
          + ${amount.toLocaleString()}đ
        </div>
      </div>
      
      <p>Bạn có thể rút số tiền này về ngân hàng bất cứ lúc nào.</p>
      <div style="text-align: center;">
        <a href="${window.location.origin}/admin/wallet" class="btn">Kiểm tra Ví</a>
      </div>
    `;

    const html = this.getModernLayout(subject, content);

    this.addEmailTemplate({
      id: `release-${Date.now()}`,
      subject,
      to: sellerEmail,
      type: 'SYSTEM',
      isRead: false,
      timestamp: new Date().toISOString(),
      htmlContent: html
    });

    this.sendRealEmail(sellerEmail, subject, html);
  }

  getAll() {
    return [...this.emails];
  }

  markAsRead(id: string) {
    this.emails = this.emails.map(e => e.id === id ? { ...e, isRead: true } : e);
    this.save();
  }

  markAllAsRead() {
    this.emails = this.emails.map(e => ({ ...e, isRead: true }));
    this.save();
  }

  deleteEmail(id: string) {
    this.emails = this.emails.filter(e => e.id !== id);
    this.save();
  }

  subscribe(listener: (emails: EmailTemplate[]) => void) {
    this.listeners.push(listener);
    listener([...this.emails]);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  clearAll() {
    this.emails = [];
    this.save();
  }

  // Legacy method for backward compatibility - add EmailTemplate to emails array
  addEmailTemplate(template: EmailTemplate) {
    this.emails.push(template);
    this.save();
  }

  // Legacy method for backward compatibility - update EmailTemplate in emails array
  updateEmailTemplate(id: string, updates: Partial<EmailTemplate>) {
    this.emails = this.emails.map(e => e.id === id ? { ...e, ...updates, lastModified: new Date().toISOString() } : e);
    this.save();
  }

  // Convenience Methods for Common Email Types
  async sendEmailVerification(userEmail: string, verificationLink: string) {
    const subject = 'Xác thực địa chỉ email của bạn';
    const content = `
      <h2>Xác thực Email</h2>
      <p>Chào bạn,</p>
      <p>Vui lòng nhấp vào liên kết dưới đây để xác thực địa chỉ email của bạn:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationLink}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600;">Xác thực ngay</a>
      </div>
      <p>Liên kết này sẽ hết hạn trong 24 giờ.</p>
    `;

    const html = this.getModernLayout(subject, content);
    this.queueEmail(userEmail, subject, html, 'HIGH');
  }

  async sendPasswordReset(userEmail: string, resetLink: string) {
    const subject = 'Đặt lại mật khẩu của bạn';
    const content = `
      <h2>Đặt lại Mật khẩu</h2>
      <p>Chào bạn,</p>
      <p>Bạn đã yêu cầu đặt lại mật khẩu. Vui lòng nhấp vào liên kết sau:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" style="background-color: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600;">Đặt lại mật khẩu</a>
      </div>
      <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
      <p>Liên kết này sẽ hết hạn trong 1 giờ.</p>
    `;

    const html = this.getModernLayout(subject, content);
    this.queueEmail(userEmail, subject, html, 'HIGH');
  }

  async sendAuctionOutbidNotification(userEmail: string, productName: string, currentBid: number, productLink: string) {
    const subject = 'Bạn đã bị ra giá cao hơn';
    const content = `
      <h2>Thông báo Đấu giá</h2>
      <p>Chào bạn,</p>
      <p>Ai đó đã ra giá cao hơn bạn cho sản phẩm <strong>${productName}</strong>.</p>
      <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <div style="font-size: 14px; color: #92400e;">Giá hiện tại:</div>
        <div style="font-size: 24px; font-weight: 700; color: #b45309;">${currentBid.toLocaleString()}đ</div>
      </div>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${productLink}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600;">Ra giá lại ngay!</a>
      </div>
    `;

    const html = this.getModernLayout(subject, content);
    this.queueEmail(userEmail, subject, html, 'NORMAL');
  }

  async sendAuctionEndingNotification(userEmail: string, productName: string, endTime: string, productLink: string) {
    const subject = 'Đấu giá sắp kết thúc';
    const content = `
      <h2>Đấu giá sắp kết thúc</h2>
      <p>Chào bạn,</p>
      <p>Đấu giá cho <strong>${productName}</strong> sẽ kết thúc trong <strong>1 giờ</strong> tới!</p>
      <div style="background: #fee2e2; border: 1px solid #dc2626; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
        <div style="font-size: 14px; color: #991b1b;">Thời gian còn lại:</div>
        <div style="font-size: 20px; font-weight: 700; color: #dc2626;">${endTime}</div>
      </div>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${productLink}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600;">Xem đấu giá</a>
      </div>
    `;

    const html = this.getModernLayout(subject, content);
    this.queueEmail(userEmail, subject, html, 'HIGH');
  }

  async sendPaymentFailedNotification(userEmail: string, orderId: string, amount: number, retryLink: string) {
    const subject = 'Thanh toán không thành công';
    const content = `
      <h2>Thanh toán thất bại</h2>
      <p>Chào bạn,</p>
      <p>Giao dịch của bạn không thể hoàn tất.</p>
      <div style="background: #fef2f2; border: 1px solid #dc2626; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <div style="font-size: 14px; color: #991b1b;">Mã đơn hàng:</div>
        <div style="font-size: 18px; font-weight: 600; color: #dc2626;">#${orderId}</div>
        <div style="font-size: 14px; color: #991b1b; margin-top: 10px;">Số tiền:</div>
        <div style="font-size: 20px; font-weight: 700; color: #dc2626;">${amount.toLocaleString()}đ</div>
      </div>
      <p>Vui lòng kiểm tra thông tin thanh toán và thử lại.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${retryLink}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600;">Thử lại thanh toán</a>
      </div>
    `;

    const html = this.getModernLayout(subject, content);
    this.queueEmail(userEmail, subject, html, 'HIGH');
  }

  async sendFlashSaleNotification(userEmail: string, saleName: string, discount: number, endTime: string, saleLink: string) {
    const subject = `🔥 Flash Sale Giảm giá đến ${discount}%!`;
    const content = `
      <h2>Flash Sale!</h2>
      <p>Chào bạn,</p>
      <p>Giảm giá đến ${discount}% cho các sản phẩm công nghệ. Chỉ trong 24 giờ!</p>
      <div style="background: linear-gradient(135deg, #dc2626, #f59e0b); color: white; border-radius: 12px; padding: 30px; margin: 20px 0; text-align: center;">
        <div style="font-size: 24px; font-weight: 800; margin-bottom: 10px;">${saleName}</div>
        <div style="font-size: 36px; font-weight: 900;">GIẢM ${discount}%</div>
        <div style="font-size: 16px; opacity: 0.9;">Kết thúc: ${endTime}</div>
      </div>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${saleLink}" style="background-color: #dc2626; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 18px;">Mua ngay!</a>
      </div>
    `;

    const html = this.getModernLayout(subject, content);
    this.queueEmail(userEmail, subject, html, 'NORMAL');
  }

  async sendNewArrivalNotification(userEmail: string, products: any[], catalogLink: string) {
    const subject = '📱 Sản phẩm mới đã có mặt';
    const content = `
      <h2>Sản phẩm mới</h2>
      <p>Chào bạn,</p>
      <p>Khám phá các sản phẩm mới nhất vừa được thêm vào hệ thống.</p>
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 30px 0;">
        ${products.map(product => `
          <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; text-align: center;">
            <div style="font-weight: 600; margin-bottom: 8px;">${product.name}</div>
            <div style="color: #2563eb; font-weight: 700;">${product.price.toLocaleString()}đ</div>
          </div>
        `).join('')}
      </div>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${catalogLink}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600;">Xem tất cả</a>
      </div>
    `;

    const html = this.getModernLayout(subject, content);
    this.queueEmail(userEmail, subject, html, 'NORMAL');
  }

  async sendAccountSuspendedNotification(userEmail: string, reason: string, appealLink: string) {
    const subject = 'Tài khoản của bạn đã bị tạm khóa';
    const content = `
      <h2>Tài khoản bị tạm khóa</h2>
      <p>Chào bạn,</p>
      <p>Tài khoản của bạn đã bị tạm khóa do vi phạm điều khoản sử dụng.</p>
      <div style="background: #fef2f2; border: 1px solid #dc2626; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <div style="font-size: 14px; color: #991b1b; margin-bottom: 8px;">Lý do:</div>
        <div style="color: #dc2626;">${reason}</div>
      </div>
      <p>Vui lòng liên hệ hỗ trợ nếu bạn có thắc mắc.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${appealLink}" style="background-color: #6b7280; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600;">Khiếu nại</a>
      </div>
    `;

    const html = this.getModernLayout(subject, content);
    this.queueEmail(userEmail, subject, html, 'HIGH');
  }

  async sendMonthlyReport(userEmail: string, reportData: any) {
    const subject = 'Báo cáo hoạt động hàng tháng';
    const content = `
      <h2>Báo cáo hàng tháng</h2>
      <p>Chào bạn,</p>
      <p>Tổng quan hoạt động của bạn trong tháng vừa qua:</p>
      <div style="background: #f8fafc; border-radius: 12px; padding: 30px; margin: 20px 0;">
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; text-align: center;">
          <div>
            <div style="font-size: 24px; font-weight: 700; color: #2563eb;">${reportData.orderCount}</div>
            <div style="font-size: 14px; color: #64748b;">Đơn hàng</div>
          </div>
          <div>
            <div style="font-size: 24px; font-weight: 700; color: #10b981;">${reportData.auctionWins}</div>
            <div style="font-size: 14px; color: #64748b;">Đấu giá thắng</div>
          </div>
          <div>
            <div style="font-size: 24px; font-weight: 700; color: #f59e0b;">${reportData.totalSpent.toLocaleString()}đ</div>
            <div style="font-size: 14px; color: #64748b;">Tổng chi tiêu</div>
          </div>
        </div>
      </div>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${window.location.origin}/dashboard" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600;">Xem chi tiết</a>
      </div>
    `;

    const html = this.getModernLayout(subject, content);
    this.queueEmail(userEmail, subject, html, 'LOW');
  }

  // Provider Management Methods
  enableProvider(providerName: string) {
    const provider = this.providers.find(p => p.name === providerName);
    if (provider) {
      provider.isEnabled = true;
      console.log(`✅ ${providerName} provider enabled`);
      this.save();
      return true;
    }
    console.error(`❌ Provider ${providerName} not found`);
    return false;
  }

  disableProvider(providerName: string) {
    const provider = this.providers.find(p => p.name === providerName);
    if (provider) {
      provider.isEnabled = false;
      console.log(`❌ ${providerName} provider disabled`);
      this.save();
      return true;
    }
    console.error(`❌ Provider ${providerName} not found`);
    return false;
  }

  getEnabledProviders() {
    return this.providers.filter(p => p.isEnabled).map(p => p.name);
  }

  getAllProviders() {
    return this.providers.map(p => ({
      name: p.name,
      isEnabled: p.isEnabled,
      priority: p.priority
    }));
  }

  setProviderPriority(providerName: string, priority: number) {
    const provider = this.providers.find(p => p.name === providerName);
    if (provider) {
      provider.priority = priority;
      // Sort providers by priority
      this.providers.sort((a, b) => a.priority - b.priority);
      console.log(`✅ ${providerName} priority set to ${priority}`);
      this.save();
      return true;
    }
    console.error(`❌ Provider ${providerName} not found`);
    return false;
  }
}

export const emailService = new EmailService();
export type { EmailTemplate };
