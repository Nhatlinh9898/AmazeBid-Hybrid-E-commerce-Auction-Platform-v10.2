# Kiến trúc Multi-Chain cho AmazeBid

## Tổng quan

Hệ thống sử dụng kiến trúc **multi-chain** - mỗi user có một blockchain riêng (Ethereum private network) để ghi lại:
- Xác thực tài khoản (KYC/verification)
- Hợp đồng thông minh giao dịch (escrow, payment)

## 1. Kiến trúc tổng thể

```
┌─────────────────────────────────────────────────────────────┐
│                     AmazeBid Platform                        │
├─────────────────────────────────────────────────────────────┤
│  Frontend (React)  │  Backend (Node.js)  │  P2P Mesh (Gun) │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              BlockchainManager Service                       │
│  - Quản lý nhiều Ethereum private network instance            │
│  - Deploy smart contracts per user                           │
│  - Sync dữ liệu giữa blockchain và database                   │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ User A Chain    │  │ User B Chain    │  │ User C Chain    │
│ - Verification  │  │ - Verification  │  │ - Verification  │
│ - Escrow        │  │ - Escrow        │  │ - Escrow        │
│ - Transactions  │  │ - Transactions  │  │ - Transactions  │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

## 2. Smart Contracts

### 2.1 UserVerification.sol
- Ghi lại trạng thái KYC của user
- Lưu trữ hash thông tin xác thực
- Event logging cho audit trail

### 2.2 EscrowTransaction.sol
- Quản lý giao dịch escrow
- Ghi lại các trạng thái: HELD, RELEASED, REFUNDED
- Tự động release sau thời gian xác định
- Event logging cho payment flow

## 3. Ethereum Private Network Setup

### 3.1 Local Development (Geth)
- Single node private network
- PoA (Proof of Authority) consensus
- Gas price = 0
- Fast block time (1-2s)

### 3.2 Production Deployment
- Multi-node private network
- Docker containerized
- Load balancing
- Backup & recovery

## 4. Tích hợp với hệ thống hiện tại

### 4.1 PaymentService.ts
- Ghi log transaction on-chain sau khi Stripe webhook
- Sync trạng thái escrow giữa database và blockchain

### 4.2 P2P Mesh (useP2P.ts)
- Broadcast blockchain events qua P2P network
- Sync trạng thái auction bids on-chain

### 4.3 Database (Prisma)
- Thêm blockchain metadata cho User model
- Lưu contract addresses per user
- Cache blockchain data

## 5. Flow dữ liệu

### 5.1 User Registration & KYC
```
User đăng ký → KYC verification → Deploy UserVerification contract 
→ Ghi hash thông tin on-chain → Update database
```

### 5.2 Payment Flow
```
User thanh toán → Stripe webhook → PaymentService.processWebhook()
→ Ghi log on-chain (EscrowTransaction) → Update database
→ P2P broadcast event
```

### 5.3 Escrow Release
```
User xác nhận nhận hàng → PaymentService.releaseFromEscrow()
→ Ghi log on-chain → Update database → P2P broadcast
```

## 6. Security Considerations

- Private network với whitelist nodes
- Encryption cho dữ liệu on-chain
- Rate limiting cho blockchain operations
- Audit logging cho tất cả transactions
- Backup blockchain state regularly

## 7. Performance Optimization

- Async blockchain operations
- Queue system cho heavy operations
- Cache blockchain data
- Batch transactions khi có thể
