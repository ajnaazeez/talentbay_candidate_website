export interface SubscriptionPlan {
  id: string;
  title: string;
  amount: string;
  displayAmount: string;
  durationDays: number;
  description: string;
  linkId?: string;
  offer?: string | null;
}

export interface CandidateSubscription {
  isPremium: boolean;
  subscriptionStatus: 'none' | 'trial' | 'active' | 'expired';
  subscriptionExpiryDate?: string | Date | null;
  hasUsedTrial: boolean;
  trialStartDate?: string | Date | null;
  trialExpiryDate?: string | Date | null;
  subscriptionPlanId?: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
}
