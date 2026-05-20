
import { Product, Bid, ItemType, OrderStatus, Order, Shareholder, ProfitDistribution, ProductRecipe, ProductIngredient } from '../types';

/**
 * AuctionCore handles logic related to bidding and auction states.
 */
export class AuctionCore {
  /**
   * Calculates the remaining time for an auction in human-readable format.
   */
  static getTimeRemaining(endTime: string): { total: number; days: number; hours: number; minutes: number; seconds: number; label: string } {
    const total = Date.parse(endTime) - Date.parse(new Date().toString());
    const seconds = Math.floor((total / 1000) % 60);
    const minutes = Math.floor((total / 1000 / 60) % 60);
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    const days = Math.floor(total / (1000 * 60 * 60 * 24));

    const label = days > 0 ? `${days} ngày ${hours} giờ`
      : hours > 0 ? `${hours} giờ ${minutes} phút`
      : minutes > 0 ? `${minutes} phút ${seconds} giây`
      : seconds > 0 ? `${seconds} giây`
      : 'Đã kết thúc';

    return { total, days, hours, minutes, seconds, label };
  }

  /**
   * Validates if a bid is valid for a given product.
   */
  static validateBid(product: Product, amount: number, userId: string): { isValid: boolean; message: string } {
    if (product.type !== ItemType.AUCTION) {
      return { isValid: false, message: 'Sản phẩm này không phải là đấu giá.' };
    }

    if (product.status !== OrderStatus.AVAILABLE) {
      return { isValid: false, message: 'Cuộc đấu giá đã kết thúc hoặc không khả dụng.' };
    }

    if (product.endTime && new Date(product.endTime) < new Date()) {
      return { isValid: false, message: 'Cuộc đấu giá đã hết thời gian.' };
    }

    if (product.sellerId === userId) {
      return { isValid: false, message: 'Bạn không thể tự đấu giá sản phẩm của mình.' };
    }

    const currentPrice = product.currentBid || product.price;
    const minIncrement = product.stepPrice || (product.price * 0.05); // Default 5% increment

    if (amount < currentPrice + minIncrement) {
      return { isValid: false, message: `Giá thầu tối thiểu phải là $${(currentPrice + minIncrement).toFixed(2)}` };
    }

    return { isValid: true, message: 'Giá thầu hợp lệ.' };
  }

  /**
   * Gets the highest bidder.
   */
  static getHighestBidder(product: Product): Bid | null {
    if (!product.bidHistory || product.bidHistory.length === 0) return null;
    return [...product.bidHistory].sort((a, b) => b.amount - a.amount)[0];
  }
}

/**
 * FinancialEngine handles escrow calculations and wallet operations.
 */
export class FinancialEngine {
  /**
   * Calculates the escrow release schedules and fees.
   */
  static calculateTransactionBreakdown(amount: number) {
    const platformFeePercent = 0.05; // 5%
    const p2pDiscount = 0.01; // 1% discount if using P2P mesh
    
    const fees = amount * (platformFeePercent - p2pDiscount);
    const sellerNet = amount - fees;
    
    return {
      gross: amount,
      fees: Number(fees.toFixed(2)),
      net: Number(sellerNet.toFixed(2)),
      escrowHoldDays: amount > 500 ? 7 : 3 
    };
  }
}

/**
 * P2PAnalytics handles data for the P2P Mesh network monitoring.
 */
export class P2PAnalytics {
  /**
   * Calculates worker efficiency score.
   */
  static calculateWorkerEfficiency(uptime: number, tasksCompleted: number, failures: number): number {
    if (uptime === 0) return 0;
    const successRate = tasksCompleted / (tasksCompleted + failures || 1);
    const score = (successRate * 70) + ((uptime / 100) * 30);
    return Number(score.toFixed(1));
  }
}

/**
 * TrustScore calculates the reputation of sellers/buyers.
 */
export class TrustScore {
  /**
   * Logic to determine trust level.
   */
  static getReputationLevel(rating: number, totalTransactions: number): { label: string; color: string; icon: string } {
    if (totalTransactions < 5) return { label: 'Người mới', color: 'text-gray-400', icon: 'User' };
    
    if (rating >= 4.8 && totalTransactions > 50) return { label: 'Uy tín Vàng', color: 'text-amber-500', icon: 'ShieldCheck' };
    if (rating >= 4.5) return { label: 'Đáng tin cậy', color: 'text-green-500', icon: 'CheckCircle' };
    if (rating < 3.0) return { label: 'Cần xem xét', color: 'text-red-500', icon: 'AlertTriangle' };
    
    return { label: 'Thành viên Bạc', color: 'text-blue-500', icon: 'Award' };
  }
}

/**
 * KOLAnalytics handles metrics for live streamers and influencers.
 */
export class KOLAnalytics {
  /**
   * Calculates the engagement rate and estimated earnings for a stream.
   */
  static predictStreamPerformance(viewerCount: number, chatActivity: number, followers: number) {
    const engagementScore = (viewerCount * 0.4) + (chatActivity * 0.6);
    const conversionRate = Math.min(0.15, (engagementScore / (followers || 100)) * 0.05); // Max 15% conversion
    const estimatedOrders = Math.floor(viewerCount * conversionRate);
    
    return {
      engagementScore: Number(engagementScore.toFixed(0)),
      conversionRate: Number((conversionRate * 100).toFixed(2)),
      estimatedOrders,
      potentialRevenue: estimatedOrders * 25 // Average ticket $25
    };
  }
}

/**
 * InfrastructureLogic handles complex calculations for the P2P Mesh network.
 */
export class InfrastructureLogic {
  /**
   * Calculates the monthly reward for a P2P Worker node.
   */
  static calculateNodeReward(bandwidthContributedGB: number, uptimePercentage: number, latencyMs: number): number {
    const baseRatePerGB = 0.05; // $0.05 per GB
    const qualityMultiplier = Math.max(0.5, 1 - (latencyMs / 500)); // Lower latency = higher reward
    const uptimeBonus = uptimePercentage > 95 ? 1.2 : 1.0;
    
    return Number((bandwidthContributedGB * baseRatePerGB * qualityMultiplier * uptimeBonus).toFixed(2));
  }

  /**
   * Calculates total network savings vs cloud (AWS/Google Cloud).
   */
  static calculateCloudSavings(totalTrafficGB: number, p2pPercentage: number): number {
    const cloudCostPerGB = 0.08; // Avg cloud egress cost
    const p2pCostPerGB = 0.01;   // Internal incentive cost
    
    const p2pTraffic = totalTrafficGB * (p2pPercentage / 100);
    const cloudTraffic = totalTrafficGB - p2pTraffic;
    
    const standardCost = totalTrafficGB * cloudCostPerGB;
    const hybridCost = (cloudTraffic * cloudCostPerGB) + (p2pTraffic * p2pCostPerGB);
    
    return Number((standardCost - hybridCost).toFixed(2));
  }
}

/**
 * HumanResourceManager handles payroll and workforce efficiency.
 */
export class HumanResourceManager {
  /**
   * Calculates dynamic salary based on base pay, KPIs, and bonuses.
   */
  static calculateDynamicPay(baseSalary: number, kpiScore: number, overtimeHours: number): { net: number; bonus: number; tax: number } {
    const kpiMultiplier = kpiScore >= 90 ? 1.2 : kpiScore >= 70 ? 1.0 : 0.8;
    const hourlyRate = (baseSalary / 160); // 160h standard month
    const overtimePay = overtimeHours * hourlyRate * 1.5;
    
    const gross = (baseSalary * kpiMultiplier) + overtimePay;
    const bonus = kpiScore >= 95 ? baseSalary * 0.1 : 0;
    const tax = (gross + bonus) * 0.1; // Flat 10% for simplicity
    
    return {
      net: Number((gross + bonus - tax).toFixed(2)),
      bonus: Number(bonus.toFixed(2)),
      tax: Number(tax.toFixed(2))
    };
  }
}

/**
 * InventoryAI handles stock optimization and replenishment.
 */
export class InventoryAI {
  /**
   * Predicts when an item will go out of stock.
   */
  static predictRestockDate(currentStock: number, avgSalesPerDay: number): { daysRemaining: number; date: string } {
    if (avgSalesPerDay <= 0) return { daysRemaining: 999, date: 'Vô thời hạn' };
    
    const days = Math.floor(currentStock / avgSalesPerDay);
    const restockDate = new Date();
    restockDate.setDate(restockDate.getDate() + days);
    
    return {
      daysRemaining: days,
      date: restockDate.toLocaleDateString('vi-VN')
    };
  }
}

/**
 * EquityManager handles logic for shareholder contributions and profit sharing.
 */
export class EquityManager {
  /**
   * Calculates total contribution value for a shareholder.
   */
  static calculateTotalContribution(shareholder: Shareholder): number {
    return (
      (shareholder.capitalContribution || 0) +
      (shareholder.assetContributionValue || 0) +
      (shareholder.laborContributionValue || 0) +
      (shareholder.coreValueContributionValue || 0)
    );
  }

  /**
   * Re-calculates percentages for a list of shareholders.
   */
  static calculateSharePercentages(shareholders: Shareholder[]): Shareholder[] {
    const totalValue = shareholders.reduce((sum, s) => sum + this.calculateTotalContribution(s), 0);
    if (totalValue === 0) return shareholders;

    return shareholders.map(s => ({
      ...s,
      sharePercentage: (this.calculateTotalContribution(s) / totalValue) * 100
    }));
  }

  /**
   * Distributes profit based on the "50/50 net profit" model from types.ts.
   */
  static distributeProfit(totalProfit: number, shareholders: Shareholder[], period: string): ProfitDistribution {
    const reserveFund = totalProfit * 0.10;
    const salaryFund = totalProfit * 0.20;
    const bonusFund = totalProfit * 0.05;
    const devFund = totalProfit * 0.15;
    const totalFunds = reserveFund + salaryFund + bonusFund + devFund;

    const netProfit = totalProfit - totalFunds;
    const distributedAmount = netProfit * 0.50; // 50% for partners
    const retainedAmount = netProfit * 0.50;   // 50% for reinvestment

    const updatedShareholders = this.calculateSharePercentages(shareholders);

    const distributions = updatedShareholders.map(s => ({
      shareholderId: s.id,
      amount: Number(((s.sharePercentage / 100) * distributedAmount).toFixed(2))
    }));

    return {
      id: `dist_${Date.now()}`,
      ownerId: 'SYSTEM',
      totalProfit,
      reserveFund,
      salaryFund,
      bonusFund,
      devFund,
      totalFunds,
      netProfit,
      distributedAmount,
      retainedAmount,
      period,
      distributions,
      createdAt: new Date().toISOString()
    };
  }
}

/**
 * SupplyChain handles POS and inventory calculation logic.
 */
export class SupplyChain {
  /**
   * Calculates the cost of a single ingredient taking into account wastage.
   */
  static calculateIngredientCost(ingredient: ProductIngredient): number {
    const rawCost = ingredient.quantity * ingredient.costPerUnit;
    const wastageCost = rawCost * (ingredient.wastagePercentage / 100);
    return rawCost + wastageCost;
  }

  /**
   * Summarizes the entire cost of a recipe.
   */
  static calculateRecipeCost(recipe: ProductRecipe): ProductRecipe {
    const ingredientsCost = recipe.ingredients.reduce((sum, ing) => sum + this.calculateIngredientCost(ing), 0);
    const totalCost = ingredientsCost + 
                      (recipe.laborCostEstimate || 0) + 
                      (recipe.packagingCost || 0) + 
                      (recipe.overheadCost || 0) + 
                      (recipe.otherExpenses || 0);
    
    const costPerPortion = recipe.yieldPortions > 0 ? totalCost / recipe.yieldPortions : totalCost;

    return {
      ...recipe,
      totalCost: Number(totalCost.toFixed(2)),
      costPerPortion: Number(costPerPortion.toFixed(2))
    };
  }
}

/**
 * OrderLogic handles scoring and prioritization.
 */
export class OrderLogic {
  /**
   * Determines order priority based on multiple factors.
   */
  static getOrderPriority(order: Order): 'URGENT' | 'NORMAL' | 'LOW' {
    // Logic for urgency
    const now = new Date();
    const createdDate = new Date(order.createdAt);
    const hoursOld = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60);

    // Urgent if pending for more than 24 hours
    if (order.status === OrderStatus.PENDING_SHIPMENT && hoursOld > 24) return 'URGENT';
    
    // Urgent if high value
    if (order.totalAmount > 1000) return 'URGENT';

    // Fractional check for "special" fraud flags
    if (order.isFraudulent) return 'NORMAL'; // Needs review but marked already

    return 'NORMAL';
  }
}
