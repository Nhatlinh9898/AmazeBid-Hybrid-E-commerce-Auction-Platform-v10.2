# Blockchain Deployment Guide - AmazeBid Multi-Chain System

## Tổng quan

Hướng dẫn này mô tả quy trình triển khai hệ thống multi-chain blockchain cho AmazeBid, nơi mỗi user có một blockchain riêng để ghi lại xác thực tài khoản và giao dịch escrow.

## 1. Cài đặt Dependencies

### 1.1 Cài đặt npm packages

```bash
npm install ethers@^6.13.0
```

### 1.2 Cài đặt Prisma Client (sau khi cập nhật schema)

```bash
npx prisma generate
npx prisma db push
```

## 2. Cấu hình Environment Variables

Thêm các biến môi trường sau vào file `.env`:

```env
# Ethereum Private Network Configuration
ETHEREUM_RPC_URL=http://localhost:8545
ETHEREUM_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
ETHEREUM_CHAIN_ID=1337

# Blockchain Configuration
BLOCKCHAIN_ENABLED=true
BLOCKCHAIN_AUTO_DEPLOY=true
```

**Lưu ý:** Private key ở trên là key mặc định của Hardhat network - chỉ dùng cho development!

## 3. Setup Ethereum Private Network

### 3.1 Sử dụng Hardhat (Khuyên dùng cho Development)

#### Cài đặt Hardhat

```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
```

#### Khởi tạo Hardhat project

```bash
npx hardhat init
```

Chọn "Create a JavaScript project" và cài đặt các dependencies được đề xuất.

#### Cấu hình Hardhat

Tạo file `hardhat.config.js`:

```javascript
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.0",
  networks: {
    hardhat: {
      chainId: 1337,
    },
    localhost: {
      url: "http://127.0.0.1:8545"
    }
  }
};
```

#### Chạy Hardhat node

```bash
npx hardhat node
```

Node sẽ chạy tại `http://localhost:8545` với 20 accounts test và ETH miễn phí.

### 3.2 Sử dụng Geth (Alternative)

#### Cài đặt Geth

```bash
# Windows
choco install geth

# macOS
brew install ethereum

# Linux
sudo apt-get install ethereum
```

#### Tạo Genesis Block

Tạo file `genesis.json`:

```json
{
  "config": {
    "chainId": 1337,
    "homesteadBlock": 0,
    "eip150Block": 0,
    "eip155Block": 0,
    "eip158Block": 0,
    "byzantiumBlock": 0,
    "constantinopleBlock": 0,
    "petersburgBlock": 0,
    "istanbulBlock": 0,
    "berlinBlock": 0,
    "londonBlock": 0,
    "arrowGlacierBlock": 0,
    "grayGlacierBlock": 0,
    "mergeNetsplitBlock": 0,
    "shaForkBlock": 0,
    "terminalTotalDifficulty": 0,
    "terminalTotalDifficultyPassed": true
  },
  "difficulty": "1",
  "gasLimit": "8000000",
  "alloc": {
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266": {
      "balance": "1000000000000000000000000"
    }
  }
}
```

#### Khởi tạo Geth node

```bash
geth --datadir ./chaindata init genesis.json
geth --datadir ./chaindata --networkid 1337 --http --http.addr "0.0.0.0" --http.port 8545 --http.corsdomain "*" --mine --miner.etherbase 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
```

## 4. Deploy Smart Contracts

### 4.1 Tạo Deployment Script

Tạo file `blockchain/scripts/deploy.js`:

```javascript
const hre = require("hardhat");

async function main() {
  console.log("Deploying contracts...");

  // Deploy UserVerification contract
  const UserVerification = await hre.ethers.getContractFactory("UserVerification");
  const userVerification = await UserVerification.deploy(
    "user_123",
    "user@example.com",
    "doc_hash_123"
  );
  await userVerification.waitForDeployment();
  console.log("UserVerification deployed to:", await userVerification.getAddress());

  // Deploy EscrowTransaction contract
  const EscrowTransaction = await hre.ethers.getContractFactory("EscrowTransaction");
  const escrowTransaction = await EscrowTransaction.deploy("user_123");
  await escrowTransaction.waitForDeployment();
  console.log("EscrowTransaction deployed to:", await escrowTransaction.getAddress());

  console.log("Deployment completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

### 4.2 Deploy Contracts

```bash
npx hardhat run blockchain/scripts/deploy.js --network localhost
```

### 4.3 Lưu Contract Addresses

Sau khi deploy, lưu contract addresses vào database:

```typescript
import blockchainManager from '../services/BlockchainManager';

// Khi user đăng ký
await blockchainManager.initializeUserBlockchain(userId, {
  rpcUrl: 'http://localhost:8545',
  privateKey: '0x...'
});

const verificationResult = await blockchainManager.deployUserVerificationContract(
  userId,
  userEmail,
  documentHash
);

const escrowResult = await blockchainManager.deployEscrowContract(userId);
```

## 5. Tích hợp với Hệ thống Hiện tại

### 5.1 Payment Service Integration

PaymentService đã được tích hợp sẵn với blockchain. Các bước:

1. Payment succeeded → Tạo escrow transaction on-chain
2. Escrow release → Log release on-chain
3. Refund → Log refund on-chain

### 5.2 P2P Integration

P2P service đã được cập nhật để broadcast blockchain events:

- `p2p.publishEscrowUpdate(orderId, status, amount)` - Phát tán escrow update
- `p2p.publishVerificationUpdate(userId, status)` - Phát tán verification update

### 5.3 User Registration Flow

Khi user đăng ký mới:

```typescript
// 1. Khởi tạo blockchain cho user
await blockchainManager.initializeUserBlockchain(userId, {
  rpcUrl: process.env.ETHEREUM_RPC_URL,
  privateKey: generatedPrivateKey,
  chainId: parseInt(process.env.ETHEREUM_CHAIN_ID)
});

// 2. Deploy UserVerification contract
await blockchainManager.deployUserVerificationContract(
  userId,
  userEmail,
  documentHash
);

// 3. Deploy EscrowTransaction contract
await blockchainManager.deployEscrowContract(userId);
```

## 6. Testing

### 6.1 Unit Tests

Tạo file `blockchain/tests/BlockchainManager.test.js`:

```javascript
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BlockchainManager", function () {
  it("Should deploy UserVerification contract", async function () {
    const UserVerification = await ethers.getContractFactory("UserVerification");
    const contract = await UserVerification.deploy("user_1", "test@example.com", "hash_123");
    await contract.waitForDeployment();
    
    expect(await contract.userId()).to.equal("user_1");
  });

  it("Should deploy EscrowTransaction contract", async function () {
    const EscrowTransaction = await ethers.getContractFactory("EscrowTransaction");
    const contract = await EscrowTransaction.deploy("user_1");
    await contract.waitForDeployment();
    
    expect(await contract.userId()).to.equal("user_1");
  });
});
```

Chạy tests:

```bash
npx hardhat test blockchain/tests/BlockchainManager.test.js
```

### 6.2 Integration Tests

Test flow hoàn chỉnh:

```typescript
// Test payment flow
const paymentIntent = await stripe.paymentIntents.create({...});
await paymentService.processWebhook({...});

// Kiểm tra blockchain
const transaction = await blockchainManager.getTransaction(userId, transactionId);
expect(transaction.status).to.equal('HELD');

// Test escrow release
await blockchainManager.releaseEscrowTransaction(userId, transactionId);
const updatedTransaction = await blockchainManager.getTransaction(userId, transactionId);
expect(updatedTransaction.status).to.equal('RELEASED');
```

## 7. Production Deployment

### 7.1 Multi-Node Private Network

Để production, deploy multi-node network:

1. **Setup 3+ validator nodes**
2. **Configure PoA consensus**
3. **Setup load balancer**
4. **Enable monitoring**

### 7.2 Docker Deployment

Tạo `docker-compose.yml`:

```yaml
version: '3.8'
services:
  geth-node:
    image: ethereum/client-go:latest
    ports:
      - "8545:8545"
      - "30303:30303"
    volumes:
      - ./chaindata:/root/.ethereum
    command: --http --http.addr "0.0.0.0" --http.port 8545 --http.corsdomain "*"
  
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - ETHEREUM_RPC_URL=http://geth-node:8545
    depends_on:
      - geth-node
```

### 7.3 Security Considerations

- **Private keys:** Luôn lưu trong environment variables, không commit vào git
- **Network access:** Whitelist IP addresses cho blockchain nodes
- **Encryption:** Mã hóa dữ liệu nhạy cảm trước khi lưu on-chain
- **Audit logging:** Log tất cả blockchain transactions
- **Backup:** Backup blockchain state regularly

## 8. Troubleshooting

### 8.1 Common Issues

**Issue:** "Cannot find module 'ethers'"
```bash
npm install ethers@^6.13.0
```

**Issue:** "Property 'blockchainConfig' does not exist on type 'User'"
```bash
npx prisma generate
npx prisma db push
```

**Issue:** Blockchain connection failed
- Kiểm tra RPC URL có đúng không
- Đảm bảo blockchain node đang chạy
- Kiểm tra firewall settings

### 8.2 Debug Mode

Enable debug logging:

```env
DEBUG=blockchain:*
```

## 9. Monitoring

### 9.1 Blockchain Metrics

Theo dõi:
- Block time
- Gas usage
- Transaction count
- Contract deployment success rate

### 9.2 Logging

Log levels:
- `[BlockchainManager]` - Blockchain operations
- `[PaymentService]` - Payment blockchain integration
- `[P2P]` - P2P blockchain events

## 10. Next Steps

1. ✅ Smart contracts development
2. ✅ BlockchainManager service
3. ✅ PaymentService integration
4. ✅ P2P integration
5. ⏸️ Production multi-node setup
6. ⏸️ Advanced monitoring & alerting
7. ⏸️ Blockchain explorer UI

## Tài liệu tham khảo

- [Ethers.js Documentation](https://docs.ethers.org/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Geth Documentation](https://geth.ethereum.org/docs/)
- [Prisma Documentation](https://www.prisma.io/docs)
