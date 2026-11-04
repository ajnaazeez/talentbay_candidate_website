export interface SubscriptionPlan {
  id: string;
  title: string;
  name?: string;
  price: number;
  amount: string; // paise string for backward compatibility
  amountPaise: number;
  displayAmount: string;
  durationDays: number;
  description: string;
  features: string[];
  linkId?: string;
  offer?: string | null;
  isPopular?: boolean;
}

export interface CandidateSubscription {
  isPremium: boolean;
  subscriptionStatus: 'none' | 'trial' | 'active' | 'expired' | 'cancelled';
  subscriptionExpiryDate?: string | Date | null;
  hasUsedTrial: boolean;
  trialStartDate?: string | Date | null;
  trialExpiryDate?: string | Date | null;
  subscriptionPlanId?: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
}

export interface RazorpayCheckoutResponse {
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
}

export interface PaymentVerificationResult {
  success: boolean;
  verified?: boolean;
  outcome?: string;
  subscriptionActive?: boolean;
  message?: string;
  expiryDate?: string;
  paymentId?: string;
}
