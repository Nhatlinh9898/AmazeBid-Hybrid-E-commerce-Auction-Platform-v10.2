// Simple Node.js API endpoint for email sending
// Run with: node email-api-endpoint.js

const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Mock email storage (in production, use database)
let emailHistory = [];

// Email sending function
async function sendEmail(to, subject, html, metadata = {}) {
  console.log('📧 Sending email:', {
    to,
    subject,
    htmlLength: html.length,
    metadata,
    timestamp: new Date().toISOString()
  });

  // Simulate email sending delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const emailId = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Store email record
  emailHistory.push({
    id: emailId,
    to,
    subject,
    html,
    metadata,
    status: 'sent',
    timestamp: new Date().toISOString()
  });

  return {
    success: true,
    id: emailId,
    messageId: `msg_${Date.now()}`,
    status: 'sent'
  };
}

// POST /api/send-email endpoint
app.post('/api/send-email', async (req, res) => {
  try {
    const { to, subject, html, metadata } = req.body;

    // Validation
    if (!to || !subject || !html) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to, subject, html'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email address'
      });
    }

    // Send email
    const result = await sendEmail(to, subject, html, metadata);

    if (result.success) {
      console.log('✅ Email sent successfully:', result);
      return res.json({
        success: true,
        id: result.id,
        timestamp: new Date().toISOString()
      });
    } else {
      console.error('❌ Email sending failed:', result.error);
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('🚨 API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/send-email - API status
app.get('/api/send-email', (req, res) => {
  return res.json({
    message: 'Email API is running',
    endpoints: {
      'POST /api/send-email': 'Send email',
      'GET /api/send-email': 'API status',
      'GET /api/emails': 'View email history'
    },
    emailHistory: emailHistory.length,
    timestamp: new Date().toISOString()
  });
});

// GET /api/emails - View email history
app.get('/api/emails', (req, res) => {
  return res.json({
    success: true,
    emails: emailHistory,
    total: emailHistory.length
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Email API server running on http://localhost:${PORT}`);
  console.log('📋 Available endpoints:');
  console.log('  POST /api/send-email - Send email');
  console.log('  GET  /api/send-email - API status');
  console.log('  GET  /api/emails - Email history');
  console.log('  GET  /health - Health check');
});

// Export for testing
module.exports = { app, sendEmail };
