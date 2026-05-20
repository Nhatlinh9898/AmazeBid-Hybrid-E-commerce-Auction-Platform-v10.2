import Stripe from 'stripe';
import { db } from '../db';
import { OrderStatus, WalletTransaction, EscrowItem } from '../types';
import { emailService } from './EmailService';
import SecurityService from './SecurityService';
import blockchainManager from './BlockchainManager';

interface PaymentIntentMetadata {
  orderId?: string;
  userId?: string;
  items?: string;
}

class PaymentService {
  private stripe: Stripe | null = null;

  constructor() {
    this.initializeStripe();
  }

  private initializeStripe() {
    if (!this.stripe && process.env.STRIPE_SECRET_KEY) {
      this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    }
  }

  private getStripe(): Stripe {
    if (!this.stripe) {
      throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
    }
    return this.stripe;
  }

  /**
   * Sanitize metadata to prevent injection attacks
   */
  private sanitizeMetadata(metadata: PaymentIntentMetadata): PaymentIntentMetadata {
    const allowedKeys = ['orderId', 'userId', 'items'];
    const sanitized: PaymentIntentMetadata = {};
    
    for (const key of allowedKeys) {
      if (metadata[key as keyof PaymentIntentMetadata]) {
        sanitized[key as keyof PaymentIntentMetadata] = metadata[key as keyof PaymentIntentMetadata];
      }
    }
    
    return sanitized;
  }

  /**
   * Create a Payment Intent for checkout
   */
  async createPaymentIntent(amount: number, metadata: PaymentIntentMetadata = {}): Promise<{ clientSecret: string; paymentIntentId: string }> {
    try {
      const stripe = this.getStripe();
      
      // Sanitize metadata to prevent injection
      const sanitizedMetadata = this.sanitizeMetadata(metadata);
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount), // VND is zero-decimal
        currency: 'vnd',
        metadata: {
          ...sanitizedMetadata,
          createdAt: new Date().toISOString(),
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      // Log payment intent creation for audit
      SecurityService.logEvent(db, metadata.userId || 'unknown', 'PAYMENT_INTENT_CREATED', {
        paymentIntentId: paymentIntent.id,
        amount,
        metadata: sanitizedMetadata
      }, '127.0.0.1');

      return {
        clientSecret: paymentIntent.client_secret!,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error: any) {
      console.error('[PaymentService] Error creating payment intent:', error);
      throw new Error(`Failed to create payment intent: ${error.message}`);
    }
  }

  /**
   * Process Stripe webhook events
   */
  async processWebhook(event: Stripe.Event): Promise<{ received: boolean; processed: boolean }> {
    try {
      console.log(`[PaymentService] Processing webhook event: ${event.type}`);

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
          break;
        case 'payment_intent.canceled':
          await this.handlePaymentCanceled(event.data.object as Stripe.PaymentIntent);
          break;
        case 'charge.refunded':
          await this.handleChargeRefunded(event.data.object as Stripe.Charge);
          break;
        default:
          console.log(`[PaymentService] Unhandled event type: ${event.type}`);
      }

      return { received: true, processed: true };
    } catch (error: any) {
      console.error('[PaymentService] Error processing webhook:', error);
      return { received: true, processed: false };
    }
  }

  /**
   * Handle successful payment
   */
  private async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    const metadata = paymentIntent.metadata as PaymentIntentMetadata;
    const { orderId, userId } = metadata;

    console.log(`[PaymentService] Payment succeeded: ${paymentIntent.id}`, { orderId, userId });

    if (orderId) {
      // Update order status to PAID_ESCROW
      await this.updateOrderStatus(orderId, OrderStatus.PAID_ESCROW);
      
      // Add to escrow
      await this.addToEscrow(orderId, paymentIntent.amount, userId);
      
      // Create wallet transaction
      if (userId) {
        await this.createWalletTransaction(userId, paymentIntent.amount, 'DEPOSIT', orderId);
      }

      // Log transaction on blockchain
      if (userId) {
        try {
          await blockchainManager.loadUserContracts(userId);
          
          // Get order details for blockchain logging
          const orders = db.get('orders') || [];
          const order = orders.find((o: any) => o.id === orderId);
          
          if (order) {
            const transactionId = `txn_${paymentIntent.id}`;
            const expectedReleaseDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
            const platformFee = paymentIntent.amount * 0.05; // 5% platform fee
            
            await blockchainManager.createEscrowTransaction(
              userId,
              transactionId,
              orderId,
              paymentIntent.amount / 100, // Convert from cents to VND
              'VND',
              '0x0000000000000000000000000000000000000000', // Buyer address (placeholder)
              '0x0000000000000000000000000000000000000000', // Seller address (placeholder)
              expectedReleaseDate,
              platformFee / 100,
              JSON.stringify({ paymentIntentId: paymentIntent.id })
            );
            
            console.log(`[PaymentService] Transaction logged on blockchain for order ${orderId}`);
          }
        } catch (blockchainError) {
          console.error('[PaymentService] Error logging transaction on blockchain:', blockchainError);
          // Continue with normal flow even if blockchain logging fails
        }
      }

      // Send email notification
      await this.sendPaymentSuccessEmail(orderId, userId, paymentIntent.amount);
    }
  }

  /**
   * Handle failed payment
   */
  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
    const metadata = paymentIntent.metadata as PaymentIntentMetadata;
    const { orderId, userId } = metadata;

    console.log(`[PaymentService] Payment failed: ${paymentIntent.id}`, { orderId, userId, error: paymentIntent.last_payment_error });

    if (orderId) {
      // Update order status to indicate payment failure
      await this.updateOrderStatus(orderId, OrderStatus.PENDING_PAYMENT);
      
      // Send email notification
      await this.sendPaymentFailedEmail(orderId, userId, paymentIntent.amount);
    }
  }

  /**
   * Handle canceled payment
   */
  private async handlePaymentCanceled(paymentIntent: Stripe.PaymentIntent) {
    const metadata = paymentIntent.metadata as PaymentIntentMetadata;
    const { orderId, userId } = metadata;

    console.log(`[PaymentService] Payment canceled: ${paymentIntent.id}`, { orderId, userId });

    if (orderId) {
      // Update order status
      await this.updateOrderStatus(orderId, OrderStatus.CANCELLED);
    }
  }

  /**
   * Handle refund
   */
  private async handleChargeRefunded(charge: Stripe.Charge) {
    console.log(`[PaymentService] Charge refunded: ${charge.id}`, { amount: charge.amount_refunded });
    
    // Find associated order and update status
    const paymentIntentId = charge.payment_intent as string;
    const orders = db.get('orders') || [];
    const order = orders.find((o: any) => o.paymentIntentId === paymentIntentId);
    
    if (order) {
      await this.updateOrderStatus(order.id, OrderStatus.RETURNED);
      await this.releaseFromEscrow(order.id);

      // Log refund on blockchain
      if (order.userId) {
        try {
          await blockchainManager.loadUserContracts(order.userId);
          const transactionId = `txn_${paymentIntentId}`;
          await blockchainManager.refundEscrowTransaction(order.userId, transactionId);
          console.log(`[PaymentService] Refund logged on blockchain for order ${order.id}`);
        } catch (blockchainError) {
          console.error('[PaymentService] Error logging refund on blockchain:', blockchainError);
        }
      }
    }
  }

  /**
   * Update order status in database
   */
  private async updateOrderStatus(orderId: string, status: OrderStatus) {
    await db.update('orders', (orders = []) => {
      return orders.map((order: any) => {
        if (order.id === orderId) {
          return { ...order, status, updatedAt: new Date().toISOString() };
        }
        return order;
      });
    });
    console.log(`[PaymentService] Order ${orderId} status updated to ${status}`);
  }

  /**
   * Add payment to escrow
   */
  private async addToEscrow(orderId: string, amount: number, userId?: string) {
    const orders = db.get('orders') || [];
    const order = orders.find((o: any) => o.id === orderId);
    
    if (!order) {
      console.error(`[PaymentService] Order ${orderId} not found for escrow`);
      return;
    }

    const escrowItem: EscrowItem = {
      id: `escrow_${Date.now()}`,
      orderId,
      amount: amount / 100, // Convert from cents to VND
      expectedReleaseDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      status: 'HELD',
      productName: order.items?.[0]?.title || 'Unknown Product',
    };

    if (userId) {
      await db.update('users', (users = []) => {
        return users.map((user: any) => {
          if (user.id === userId) {
            const wallet = user.wallet || { balance: 0, pendingBalance: 0, kycStatus: 'unverified', transactions: [], escrowItems: [] };
            return {
              ...user,
              wallet: {
                ...wallet,
                pendingBalance: (wallet.pendingBalance || 0) + (amount / 100),
                escrowItems: [...(wallet.escrowItems || []), escrowItem],
              },
            };
          }
          return user;
        });
      });
    }

    console.log(`[PaymentService] Added ${amount / 100} VND to escrow for order ${orderId}`);
  }

  /**
   * Release funds from escrow
   */
  private async releaseFromEscrow(orderId: string) {
    let userId: string | undefined;
    let transactionId: string | undefined;

    await db.update('users', (users = []) => {
      return users.map((user: any) => {
        if (user.wallet?.escrowItems) {
          const escrowItems = user.wallet.escrowItems.filter((item: EscrowItem) => item.orderId !== orderId);
          const releasedItem = user.wallet.escrowItems.find((item: EscrowItem) => item.orderId === orderId);
          
          if (releasedItem) {
            userId = user.id;
            transactionId = releasedItem.id;
            
            return {
              ...user,
              wallet: {
                ...user.wallet,
                balance: (user.wallet.balance || 0) + releasedItem.amount,
                pendingBalance: Math.max(0, (user.wallet.pendingBalance || 0) - releasedItem.amount),
                escrowItems: escrowItems.map((item: EscrowItem) => 
                  item.orderId === orderId ? { ...item, status: 'RELEASED' } : item
                ),
              },
            };
          }
        }
        return user;
      });
    });

    // Log release on blockchain
    if (userId && transactionId) {
      try {
        await blockchainManager.loadUserContracts(userId);
        await blockchainManager.releaseEscrowTransaction(userId, transactionId);
        console.log(`[PaymentService] Escrow release logged on blockchain for order ${orderId}`);
      } catch (blockchainError) {
        console.error('[PaymentService] Error logging escrow release on blockchain:', blockchainError);
      }
    }
  }

  /**
   * Create wallet transaction record
   */
  private async createWalletTransaction(userId: string, amount: number, type: WalletTransaction['type'], orderId?: string) {
    const transaction: WalletTransaction = {
      id: `txn_${Date.now()}`,
      type,
      amount: amount / 100, // Convert from cents to VND
      status: 'COMPLETED',
      timestamp: new Date().toISOString(),
      description: orderId ? `Payment for order ${orderId}` : `Wallet transaction`,
    };

    await db.update('users', (users = []) => {
      return users.map((user: any) => {
        if (user.id === userId) {
          const wallet = user.wallet || { balance: 0, pendingBalance: 0, kycStatus: 'unverified', transactions: [], escrowItems: [] };
          return {
            ...user,
            wallet: {
              ...wallet,
              transactions: [...(wallet.transactions || []), transaction],
            },
          };
        }
        return user;
      });
    });

    console.log(`[PaymentService] Created wallet transaction: ${transaction.id}`);
  }

  /**
   * Send payment success email
   */
  private async sendPaymentSuccessEmail(orderId: string, userId?: string, amount?: number) {
    try {
      if (!userId) return;

      const users = db.get('users') || [];
      const user = users.find((u: any) => u.id === userId);
      
      if (user) {
        const orders = db.get('orders') || [];
        const order = orders.find((o: any) => o.id === orderId);
        
        await emailService.sendPaymentEscrowNotification(user, order || { id: orderId });
        console.log(`[PaymentService] Payment success email sent to ${user.email}`);
      }
    } catch (error) {
      console.error('[PaymentService] Error sending payment success email:', error);
    }
  }

  /**
   * Send payment failed email
   */
  private async sendPaymentFailedEmail(orderId: string, userId?: string, amount?: number) {
    try {
      if (!userId) return;

      const users = db.get('users') || [];
      const user = users.find((u: any) => u.id === userId);
      
      if (user) {
        await emailService.sendPaymentFailedNotification(
          user.email,
          orderId,
          amount ? amount / 100 : 0,
          `${process.env.VITE_APP_URL || 'http://localhost:5173'}/checkout`
        );
        console.log(`[PaymentService] Payment failed email sent to ${user.email}`);
      }
    } catch (error) {
      console.error('[PaymentService] Error sending payment failed email:', error);
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): Stripe.Event {
    try {
      const stripe = this.getStripe();
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      
      if (!webhookSecret) {
        const isProduction = process.env.NODE_ENV === 'production';
        if (isProduction) {
          throw new Error('STRIPE_WEBHOOK_SECRET is required in production environment');
        }
        console.warn('[PaymentService] STRIPE_WEBHOOK_SECRET not configured, skipping signature verification in development');
        // In development, parse without verification (NOT SECURE for production)
        return JSON.parse(payload) as Stripe.Event;
      }

      const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
      return event;
    } catch (error: any) {
      console.error('[PaymentService] Webhook signature verification failed:', error);
      throw new Error(`Invalid webhook signature: ${error.message}`);
    }
  }

  /**
   * Refund a payment
   */
  async refundPayment(paymentIntentId: string, amount?: number): Promise<Stripe.Refund> {
    try {
      const stripe = this.getStripe();
      
      const refundParams: Stripe.RefundCreateParams = {
        payment_intent: paymentIntentId,
      };

      if (amount) {
        refundParams.amount = Math.round(amount);
      }

      const refund = await stripe.refunds.create(refundParams);
      console.log(`[PaymentService] Refund created: ${refund.id}`);
      
      return refund;
    } catch (error: any) {
      console.error('[PaymentService] Error creating refund:', error);
      throw new Error(`Failed to create refund: ${error.message}`);
    }
  }
}

export default new PaymentService();
