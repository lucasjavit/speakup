// Credit and Payment types

export type CreditType = 'SESSION' | 'CONVERSATION';
export type BillingMode = 'SESSION' | 'CONVERSATION';
export type TransactionType = 'PURCHASE' | 'CONSUME' | 'REFUND' | 'BONUS';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export interface CreditWallet {
  sessionCredits: number;
  conversationCredits: number;
  billingMode: BillingMode;
  canJoinSession: boolean;
}

export interface CreditTransaction {
  id: string;
  creditType: CreditType;
  transactionType: TransactionType;
  amount: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  credits: number;
  creditType: CreditType;
  price: number;
  pricePerCredit: number;
  discount: string | null;
  popular: boolean;
  bestValue: boolean;
}

export interface ProductList {
  sessionProducts: Product[];
  conversationProducts: Product[];
}

export interface Purchase {
  id: string;
  productName: string;
  creditsAmount: number;
  creditType: CreditType;
  price: number;
  currency: string;
  status: PaymentStatus;
  createdAt: string;
  completedAt: string | null;
}

export interface CheckoutRequest {
  productType: string;
}

export interface CheckoutResponse {
  sessionId: string;
  url: string;
}

export interface AdminPurchase {
  id: string;
  userName: string;
  userEmail: string;
  productName: string;
  creditsAmount: number;
  creditType: CreditType;
  price: number;
  currency: string;
  status: PaymentStatus;
  createdAt: string;
  completedAt: string | null;
}

export interface FreeModeStatus {
  enabled: boolean;
  message: string;
}

export interface ApplicationSetting {
  id: string;
  key: string;
  value: string;
  description: string;
  updatedAt: string;
}
