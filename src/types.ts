export interface User {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'SELLER' | 'ADMIN';
  verified: boolean;
  walletBalance: number;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price?: number; // For "Buy Now"
  currentBid?: number; // For "Auction"
  buyNowPrice?: number; // Optional Buy Now price for Auction items
  type: 'BUY_NOW' | 'AUCTION';
  imageUrl: string;
  sellerId: string;
  sellerName: string;
  status: 'ACTIVE' | 'SOLD' | 'ENDED';
  createdAt: number;
  bidsCount?: number;
  bidHistory?: {
    id: string;
    userId: string;
    userName: string;
    amount: number;
    timestamp: number;
  }[];
}

export interface LiveStream {
  id: string;
  title: string;
  hostName: string;
  hostId: string;
  viewerCount: number;
  activeProductId: string | null;
  status: 'LIVE' | 'ENDED';
}

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  productName: string;
  createdAt: number;
  imageUrl?: string;
}

export interface Order {
  id: string;
  userId: string;
  productId: string;
  productTitle: string;
  amount: number;
  status: 'PENDING' | 'PAID' | 'SHIPPED' | 'COMPLETED' | 'REFUNDED';
  createdAt: number;
  escrowStatus: 'SECURED' | 'RELEASED' | 'REFUNDED';
}
