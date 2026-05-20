# AmazeBid Security Specification

## 1. Data Invariants

1. **User Ownership**: A user document must only be modifiable by the owner.
2. **Product Validity**: Every product must have a valid `sellerId` matching the creator.
3. **Order Integrity**: Orders must be linked to a customer (`userId`) and cannot have their `totalAmount` changed after creation.
4. **Store Management**: Only authenticated owners can register or update their stores.
5. **Staffing**: Staff records must link to valid users and stores.
6. **Immutable Fields**: Fields like `createdAt` and `userId` must remain unchanged after creation.
7. **Identity Spoofing**: Users cannot set `ownerId` or `userId` in payloads to someone other than themselves.

## 2. The "Dirty Dozen" Payloads (Red Team Attacks)

1. **Identity Spoofing (Create User)**: Attempt to create a user profile for someone else.
   - Payload: `{"id": "victim-id", "fullName": "Victim", "email": "victim@example.com"}`
   - Target: `/users/victim-id`
2. **Privilege Escalation**: Attempt to update role to ADMIN.
   - Payload: `{"role": "ADMIN"}`
   - Target: `/users/my-id`
3. **Ghost Update (Product)**: Attempt to update a product with an extra "Ghost Field".
   - Payload: `{"isVerified": true}`
   - Target: `/products/product-1`
4. **Price Manipulation**: Attempt to change the price of someone else's product.
   - Payload: `{"price": 0.01}`
   - Target: `/products/other-product`
5. **Order Injection**: Attempt to create an order for someone else.
   - Payload: `{"userId": "victim-id", "totalAmount": 100}`
   - Target: `/orders/new-order`
6. **Amount Tampering**: Attempt to update the `totalAmount` of an existing order.
   - Payload: `{"totalAmount": 0}`
   - Target: `/orders/order-1`
7. **Store Hijacking**: Attempt to update another owner's store.
   - Payload: `{"name": "Hijacked Store"}`
   - Target: `/stores/other-store`
8. **Shadow Staffing**: Register a staff member to a store without proper authorization.
   - Payload: `{"userId": "attacker-id", "storeId": "target-store", "role": "MANAGER"}`
   - Target: `/staff/staff-1`
9. **Creation Timestamp Poisoning**: Attempt to set a custom `createdAt` date.
   - Payload: `{"createdAt": "2000-01-01T00:00:00Z"}`
   - Target: `/products/product-1`
10. **ID Poisoning**: Use a massive string as a document ID.
    - Path: `/users/[1MB string]`
11. **Type Poisoning**: Send a boolean where a string is expected.
    - Payload: `{"fullName": true}`
    - Target: `/users/my-id`
12. **Relational Sync Break**: Create an order for a product that doesn't exist.
    - Payload: `{"productId": "fake-product"}`
    - Target: `/orders/new-order`

## 3. Payment Security

### 3.1 PCI DSS Compliance Requirements

1. **No Card Data Storage**: System never stores, processes, or transmits raw cardholder data. All payment processing is handled by Stripe.
2. **Tokenization**: Payment information is tokenized using Stripe PaymentIntents. Only `clientSecret` and `paymentIntentId` are exchanged.
3. **HTTPS Only**: All payment-related endpoints must use HTTPS in production.
4. **Webhook Security**: All Stripe webhooks must be verified using `STRIPE_WEBHOOK_SECRET` in production.

### 3.2 Payment Data Protection

1. **Metadata Sanitization**: Only allowed fields (`orderId`, `userId`, `items`) are accepted in payment metadata to prevent injection attacks.
2. **Audit Logging**: All payment operations (creation, success, failure, refund) are logged with user ID, IP address, and timestamps.
3. **Rate Limiting**: 
   - Payment intent creation: 5 requests per 15 minutes per IP
   - Webhook endpoints: 50 requests per minute per IP
4. **Environment Variables**: 
   - `STRIPE_SECRET_KEY`: Required for payment operations
   - `STRIPE_WEBHOOK_SECRET`: Required in production for webhook verification
   - Never commit `.env` files to version control

### 3.3 Webhook Security

1. **Signature Verification**: All incoming webhooks must be verified using Stripe's signature verification.
2. **Production Enforcement**: Webhook signature verification is mandatory in production environment.
3. **Development Mode**: In development, webhooks can be processed without verification (with warning).
4. **Event Processing**: Only valid Stripe events are processed; invalid signatures are rejected.

### 3.4 Escrow and Wallet Security

1. **Escrow Isolation**: Funds in escrow are tracked separately from available balance.
2. **Transaction Logging**: All wallet transactions (deposit, withdrawal, escrow release) are logged with full audit trail.
3. **KYC Verification**: Wallet operations require KYC verification status check.
4. **Refund Protection**: Refunds can only be processed by authorized users with proper payment intent validation.

### 3.5 Incident Response for Payment Breaches

1. **Immediate Actions**:
   - Rotate `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`
   - Review audit logs for suspicious payment activities
   - Notify affected users of potential payment issues
2. **Investigation**:
   - Analyze payment intent creation patterns
   - Check for unauthorized webhook processing
   - Review rate limit violations
3. **Recovery**:
   - Restore from database backups if needed
   - Implement additional security measures
   - Update security documentation

## 4. Test Runner (Draft Rules Policy)

The following tests verify that all attack payloads are denied. (Actual test file `firestore.rules.test.ts` will follow logic).
