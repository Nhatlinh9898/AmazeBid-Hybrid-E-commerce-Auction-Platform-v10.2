import { ethers } from 'ethers';
import { db } from '../db';
import { readFileSync } from 'fs';
import { join } from 'path';
import { p2p } from './p2pService';

// Smart Contract ABIs
const UserVerificationABI = [
  'function owner() view returns (address)',
  'function userId() view returns (string)',
  'function userEmail() view returns (string)',
  'function updateVerificationStatus(uint8 _status, string _identityHash, string _metadata)',
  'function getVerificationRecord() view returns (tuple(uint8 status, string documentHash, string identityHash, uint256 verifiedAt, uint256 updatedAt, address verifiedBy, string metadata))',
  'function isVerified() view returns (bool)',
  'function updateDocumentHash(string _documentHash)',
  'function transferOwnership(address newOwner)',
  'event VerificationRequested(address indexed user, string userId, string documentHash)',
  'event VerificationApproved(address indexed user, address indexed verifiedBy, uint256 timestamp)',
  'event VerificationRejected(address indexed user, address indexed verifiedBy, string reason)',
  'event StatusUpdated(address indexed user, uint8 oldStatus, uint8 newStatus)'
];

const EscrowTransactionABI = [
  'function owner() view returns (address)',
  'function userId() view returns (string)',
  'function createTransaction(string _transactionId, string _orderId, uint256 _amount, string _currency, address _buyer, address _seller, uint256 _expectedReleaseDate, uint256 _platformFee, string _metadata)',
  'function releaseTransaction(string _transactionId)',
  'function refundTransaction(string _transactionId)',
  'function disputeTransaction(string _transactionId, string _reason)',
  'function getTransaction(string _transactionId) view returns (tuple(string transactionId, string orderId, uint256 amount, string currency, uint8 status, address buyer, address seller, uint256 createdAt, uint256 expectedReleaseDate, uint256 releasedAt, uint256 platformFee, uint256 sellerAmount, string metadata))',
  'function getAllTransactionIds() view returns (string[])',
  'function getTransactionCount() view returns (uint256)',
  'function getTransactionsByStatus(uint8 _status) view returns (string[])',
  'function canAutoRelease(string _transactionId) view returns (bool)',
  'function autoReleaseTransaction(string _transactionId)',
  'function updateTransactionMetadata(string _transactionId, string _metadata)',
  'function transferOwnership(address newOwner)',
  'event TransactionCreated(string indexed transactionId, string indexed orderId, uint256 amount, address indexed buyer, address seller)',
  'event TransactionReleased(string indexed transactionId, uint256 sellerAmount, uint256 platformFee, uint256 timestamp)',
  'event TransactionRefunded(string indexed transactionId, uint256 amount, uint256 timestamp)',
  'event TransactionDisputed(string indexed transactionId, string reason, uint256 timestamp)'
];

interface UserBlockchainConfig {
  userId: string;
  rpcUrl: string;
  privateKey: string;
  verificationContractAddress?: string;
  escrowContractAddress?: string;
  chainId: number;
}

interface ContractDeploymentResult {
  contractAddress: string;
  transactionHash: string;
  blockNumber: number;
}

class BlockchainManager {
  private userBlockchainConfigs: Map<string, UserBlockchainConfig> = new Map();
  private providers: Map<string, ethers.JsonRpcProvider> = new Map();
  private wallets: Map<string, ethers.Wallet> = new Map();
  private verificationContracts: Map<string, ethers.Contract> = new Map();
  private escrowContracts: Map<string, ethers.Contract> = new Map();

  /**
   * Initialize blockchain configuration for a user
   */
  async initializeUserBlockchain(userId: string, config: Partial<UserBlockchainConfig>): Promise<void> {
    const defaultConfig: UserBlockchainConfig = {
      userId,
      rpcUrl: process.env.ETHEREUM_RPC_URL || 'http://localhost:8545',
      privateKey: process.env.ETHEREUM_PRIVATE_KEY || this.generatePrivateKey(),
      chainId: parseInt(process.env.ETHEREUM_CHAIN_ID || '1337'),
      ...config
    };

    this.userBlockchainConfigs.set(userId, defaultConfig);

    // Initialize provider and wallet
    const provider = new ethers.JsonRpcProvider(defaultConfig.rpcUrl);
    const wallet = new ethers.Wallet(defaultConfig.privateKey, provider);

    this.providers.set(userId, provider);
    this.wallets.set(userId, wallet);

    console.log(`[BlockchainManager] Initialized blockchain for user ${userId}`);
  }

  /**
   * Deploy UserVerification contract for a user
   */
  async deployUserVerificationContract(
    userId: string,
    userEmail: string,
    documentHash: string
  ): Promise<ContractDeploymentResult> {
    const wallet = this.wallets.get(userId);
    if (!wallet) {
      throw new Error(`Blockchain not initialized for user ${userId}`);
    }

    // Read contract bytecode
    const contractPath = join(process.cwd(), 'blockchain', 'contracts', 'UserVerification.sol');
    const contractSource = readFileSync(contractPath, 'utf-8');

    // For development, we'll use a simplified deployment
    // In production, use Hardhat or Truffle for proper compilation
    // Using placeholder bytecode for development (0x = empty contract)
 const bytecode = '0x';
    const factory = new ethers.ContractFactory(UserVerificationABI, bytecode, wallet);
    
    const contract = await factory.deploy(userId, userEmail, documentHash);
    await contract.waitForDeployment();

    const address = await contract.getAddress();
    const receipt = await contract.deploymentTransaction()?.wait();

    // Store contract address
    const config = this.userBlockchainConfigs.get(userId);
    if (config) {
      config.verificationContractAddress = address;
      this.userBlockchainConfigs.set(userId, config);
    }

    // Create contract instance with proper typing
    this.verificationContracts.set(userId, contract as ethers.Contract);

    // Save to database
    await this.saveContractAddress(userId, 'verification', address);

    console.log(`[BlockchainManager] Deployed UserVerification contract for user ${userId} at ${address}`);

    return {
      contractAddress: address,
      transactionHash: receipt?.hash || '',
      blockNumber: receipt?.blockNumber || 0
    };
  }

  /**
   * Deploy EscrowTransaction contract for a user
   */
  async deployEscrowContract(userId: string): Promise<ContractDeploymentResult> {
    const wallet = this.wallets.get(userId);
    if (!wallet) {
      throw new Error(`Blockchain not initialized for user ${userId}`);
    }

    // Using placeholder bytecode for development (0x = empty contract)
 const bytecode = '0x';
    const factory = new ethers.ContractFactory(EscrowTransactionABI, bytecode, wallet);
    const contract = await factory.deploy(userId);
    await contract.waitForDeployment();

    const address = await contract.getAddress();
    const receipt = await contract.deploymentTransaction()?.wait();

    // Store contract address
    const config = this.userBlockchainConfigs.get(userId);
    if (config) {
      config.escrowContractAddress = address;
      this.userBlockchainConfigs.set(userId, config);
    }

    // Create contract instance with proper typing
    this.escrowContracts.set(userId, contract as ethers.Contract);

    // Save to database
    await this.saveContractAddress(userId, 'escrow', address);

    console.log(`[BlockchainManager] Deployed EscrowTransaction contract for user ${userId} at ${address}`);

    return {
      contractAddress: address,
      transactionHash: receipt?.hash || '',
      blockNumber: receipt?.blockNumber || 0
    };
  }

  /**
   * Create escrow transaction on blockchain
   */
  async createEscrowTransaction(
    userId: string,
    transactionId: string,
    orderId: string,
    amount: number,
    currency: string,
    buyerAddress: string,
    sellerAddress: string,
    expectedReleaseDate: Date,
    platformFee: number,
    metadata: string
  ): Promise<void> {
    const contract = this.escrowContracts.get(userId);
    if (!contract) {
      throw new Error(`Escrow contract not deployed for user ${userId}`);
    }

    const amountInWei = ethers.parseEther(amount.toString());
    const platformFeeInWei = ethers.parseEther(platformFee.toString());
    const expectedReleaseTimestamp = Math.floor(expectedReleaseDate.getTime() / 1000);

    const tx = await contract.createTransaction(
      transactionId,
      orderId,
      amountInWei,
      currency,
      buyerAddress,
      sellerAddress,
      expectedReleaseTimestamp,
      platformFeeInWei,
      metadata
    );

    await tx.wait();

    // Broadcast to P2P network
    p2p.publishEscrowUpdate(orderId, 'HELD', amount);

    console.log(`[BlockchainManager] Created escrow transaction ${transactionId} on-chain`);
  }

  /**
   * Release escrow transaction on blockchain
   */
  async releaseEscrowTransaction(userId: string, transactionId: string): Promise<void> {
    const contract = this.escrowContracts.get(userId);
    if (!contract) {
      throw new Error(`Escrow contract not deployed for user ${userId}`);
    }

    const tx = await contract.releaseTransaction(transactionId);
    await tx.wait();

    // Get order ID from transaction and broadcast to P2P
    const txn = await contract.getTransaction(transactionId);
    p2p.publishEscrowUpdate(txn.orderId, 'RELEASED', parseFloat(ethers.formatEther(txn.amount)));

    console.log(`[BlockchainManager] Released escrow transaction ${transactionId} on-chain`);
  }

  /**
   * Refund escrow transaction on blockchain
   */
  async refundEscrowTransaction(userId: string, transactionId: string): Promise<void> {
    const contract = this.escrowContracts.get(userId);
    if (!contract) {
      throw new Error(`Escrow contract not deployed for user ${userId}`);
    }

    const tx = await contract.refundTransaction(transactionId);
    await tx.wait();

    // Get order ID from transaction and broadcast to P2P
    const txn = await contract.getTransaction(transactionId);
    p2p.publishEscrowUpdate(txn.orderId, 'REFUNDED', parseFloat(ethers.formatEther(txn.amount)));

    console.log(`[BlockchainManager] Refunded escrow transaction ${transactionId} on-chain`);
  }

  /**
   * Update user verification status on blockchain
   */
  async updateVerificationStatus(
    userId: string,
    status: number,
    identityHash: string,
    metadata: string
  ): Promise<void> {
    const contract = this.verificationContracts.get(userId);
    if (!contract) {
      throw new Error(`Verification contract not deployed for user ${userId}`);
    }

    const tx = await contract.updateVerificationStatus(status, identityHash, metadata);
    await tx.wait();

    // Broadcast to P2P network
    const statusMap = ['UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED'];
    p2p.publishVerificationUpdate(userId, statusMap[status] || 'UNKNOWN');

    console.log(`[BlockchainManager] Updated verification status for user ${userId} on-chain`);
  }

  /**
   * Get transaction from blockchain
   */
  async getTransaction(userId: string, transactionId: string): Promise<any> {
    const contract = this.escrowContracts.get(userId);
    if (!contract) {
      throw new Error(`Escrow contract not deployed for user ${userId}`);
    }

    const txn = await contract.getTransaction(transactionId);
    return txn;
  }

  /**
   * Check if user is verified on blockchain
   */
  async isUserVerified(userId: string): Promise<boolean> {
    const contract = this.verificationContracts.get(userId);
    if (!contract) {
      return false;
    }

    try {
      const verified = await contract.isVerified();
      return verified;
    } catch (error) {
      console.error(`[BlockchainManager] Error checking verification status:`, error);
      return false;
    }
  }

  /**
   * Load existing contracts from database
   */
  async loadUserContracts(userId: string): Promise<void> {
    const users = db.get('users') || [];
    const user = users.find((u: any) => u.id === userId);

    if (user && (user as any).blockchainConfig) {
      const config = (user as any).blockchainConfig;
      
      // Initialize blockchain if not already done
      if (!this.userBlockchainConfigs.has(userId)) {
        await this.initializeUserBlockchain(userId, config);
      }

      // Load verification contract
      if (config.verificationContractAddress) {
        const wallet = this.wallets.get(userId);
        if (wallet) {
          const contract = new ethers.Contract(
            config.verificationContractAddress,
            UserVerificationABI,
            wallet
          );
          this.verificationContracts.set(userId, contract);
        }
      }

      // Load escrow contract
      if (config.escrowContractAddress) {
        const wallet = this.wallets.get(userId);
        if (wallet) {
          const contract = new ethers.Contract(
            config.escrowContractAddress,
            EscrowTransactionABI,
            wallet
          );
          this.escrowContracts.set(userId, contract);
        }
      }

      console.log(`[BlockchainManager] Loaded existing contracts for user ${userId}`);
    }
  }

  /**
   * Save contract address to database
   */
  private async saveContractAddress(userId: string, contractType: 'verification' | 'escrow', address: string): Promise<void> {
    await db.update('users', (users = []) => {
      return users.map((user: any) => {
        if (user.id === userId) {
          const blockchainConfig = user.blockchainConfig || {};
          blockchainConfig[`${contractType}ContractAddress`] = address;
          return {
            ...user,
            blockchainConfig
          };
        }
        return user;
      });
    });
  }

  /**
   * Generate a random private key (for development only)
   */
  private generatePrivateKey(): string {
    return ethers.Wallet.createRandom().privateKey;
  }

  /**
   * Get blockchain config for a user
   */
  getUserBlockchainConfig(userId: string): UserBlockchainConfig | undefined {
    return this.userBlockchainConfigs.get(userId);
  }

  /**
   * Cleanup resources for a user
   */
  async cleanupUserBlockchain(userId: string): Promise<void> {
    this.providers.delete(userId);
    this.wallets.delete(userId);
    this.verificationContracts.delete(userId);
    this.escrowContracts.delete(userId);
    this.userBlockchainConfigs.delete(userId);

    console.log(`[BlockchainManager] Cleaned up blockchain resources for user ${userId}`);
  }
}

export default new BlockchainManager();
