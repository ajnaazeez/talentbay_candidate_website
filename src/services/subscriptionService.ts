import { httpsCallable } from 'firebase/functions';
import { functions, auth } from '@/lib/firebase';
import { PAYMENT_CONFIG } from '@/utils/constants';
import type { CandidateModel } from '@/types/candidate';
import type {
  SubscriptionPlan,
  RazorpayCheckoutResponse,
  PaymentVerificationResult,
} from '@/types/subscription';

interface RazorpayInstance {
  open: () => void;
  close?: () => void;
  on?: (event: string, callback: (...args: unknown[]) => void) => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// Module-level cleanup tracking to prevent lingering overlay frames
let activeRzpInstance: RazorpayInstance | null = null;

const hideRazorpayDom = (): void => {
  try {
    const selectors = [
      '.razorpay-container',
      '.razorpay-backdrop',
      'iframe.razorpay-checkout-frame',
      'iframe[src*="razorpay"]',
      'iframe[name*="razorpay"]',
      'div.razorpay-loader',
      '[class*="razorpay-"]',
      '[id*="razorpay-"]',
    ];
    selectors.forEach((sel) => {
      document.querySelectorAll<HTMLElement>(sel).forEach((el) => {
        try {
          el.style.setProperty('display', 'none', 'important');
          el.style.setProperty('visibility', 'hidden', 'important');
          el.style.setProperty('opacity', '0', 'important');
          el.style.setProperty('pointer-events', 'none', 'important');
          el.style.setProperty('z-index', '-9999', 'important');
        } catch {
          // ignore
        }
      });
    });
    if (typeof document !== 'undefined' && document.body) {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.height = '';
      document.body.classList.remove('razorpay-open');
    }
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.style.overflow = '';
    }
  } catch (e) {
    console.warn('[subscriptionService] hideRazorpayDom warning:', e);
  }
};

const restoreRazorpayDom = (): void => {
  try {
    const selectors = [
      '.razorpay-container',
      '.razorpay-backdrop',
      'iframe.razorpay-checkout-frame',
      'iframe[src*="razorpay"]',
      'iframe[name*="razorpay"]',
      'div.razorpay-loader',
      '[class*="razorpay-"]',
      '[id*="razorpay-"]',
    ];
    selectors.forEach((sel) => {
      document.querySelectorAll<HTMLElement>(sel).forEach((el) => {
        try {
          el.style.removeProperty('display');
          el.style.removeProperty('visibility');
          el.style.removeProperty('opacity');
          el.style.removeProperty('pointer-events');
          el.style.removeProperty('z-index');
        } catch {
          // ignore
        }
      });
    });
  } catch (err) {
    console.warn('[subscriptionService] restoreRazorpayDom warning:', err);
  }
};

export const subscriptionService = {
  /**
   * Dismisses any active checkout modal and clears DOM artifacts.
   */
  dismissActiveCheckout(): void {
    if (activeRzpInstance && typeof activeRzpInstance.close === 'function') {
      try {
        activeRzpInstance.close();
      } catch {
        // ignore
      }
      activeRzpInstance = null;
    }
    hideRazorpayDom();
  },

  /**
   * Helper: Parse Firestore Timestamp or ISO date string into Date.
   */
  parseDate(val: any): Date | null {
    if (!val) return null;
    if (val instanceof Date) return val;
    if (val && typeof val.toDate === 'function') return val.toDate();
    if (typeof val === 'string') {
      const d = new Date(val);
      return isNaN(d.getTime()) ? null : d;
    }
    return null;
  },

  /**
   * Calculates days remaining until the given expiry date.
   */
  getDaysRemaining(expiryDate: any): number {
    const parsed = this.parseDate(expiryDate);
    if (!parsed) return 0;
    const diffMs = parsed.getTime() - Date.now();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  },

  /**
   * Checks if candidate is eligible to activate the 7-day free trial.
   */
  isTrialEligible(candidate: CandidateModel | null): boolean {
    if (!candidate) return false;
    if (candidate.hasUsedTrial) return false;
    if (candidate.trialStartDate != null || candidate.trialExpiryDate != null) return false;
    return true;
  },

  /**
   * Checks if candidate currently has an active 7-day trial.
   */
  isTrialActive(candidate: CandidateModel | null): boolean {
    if (!candidate) return false;
    const expiry = this.parseDate(candidate.trialExpiryDate);
    if (!expiry) return false;
    return expiry.getTime() > Date.now() && candidate.subscriptionStatus === 'trial';
  },

  /**
   * Checks if candidate has an active paid subscription.
   */
  isPaidActive(candidate: CandidateModel | null): boolean {
    if (!candidate) return false;
    const planId = (candidate.subscriptionPlanId || '').toString();
    const isPaid = planId.length > 0 && planId !== 'free_trial_7d' && planId !== '7_days_trial';
    if (!isPaid) return false;
    const expiry = this.parseDate(candidate.subscriptionExpiryDate);
    if (!expiry) return false;
    return (
      expiry.getTime() > Date.now() &&
      candidate.subscriptionStatus !== 'cancelled' &&
      candidate.subscriptionStatus !== 'expired'
    );
  },

  /**
   * Checks if candidate has any active premium access (either paid or trial).
   */
  hasPremiumAccess(candidate: CandidateModel | null): boolean {
    if (!candidate) return false;
    return this.isPaidActive(candidate) || this.isTrialActive(candidate);
  },

  /**
   * Calls the idempotent Cloud Function `startCandidateFreeTrial` to grant 7 days of Premium.
   * Duplicate calls are safe no-ops in the backend transaction.
   */
  async startFreeTrial(): Promise<{ granted: boolean; reason: string }> {
    const currentUid = auth.currentUser?.uid;
    if (!currentUid) {
      throw new Error('You must be signed in to initialize your 7-day free trial.');
    }

    try {
      const callable = httpsCallable<Record<string, never>, { granted: boolean; reason: string }>(
        functions,
        'startCandidateFreeTrial'
      );
      const res = await callable({});
      return res.data;
    } catch (err: any) {
      console.error('[subscriptionService.startFreeTrial] Error:', err);
      throw new Error(err?.message || 'Failed to initialize free trial. Please try again.');
    }
  },

  /**
   * Calls `createRazorpayOrder` Cloud Function to create a server-side order with Razorpay.
   */
  async createRazorpayOrder(planId: string): Promise<{
    orderId: string;
    amount: number;
    currency: string;
  }> {
    const currentUid = auth.currentUser?.uid;
    if (!currentUid) {
      throw new Error('You must be signed in to purchase a subscription.');
    }

    try {
      const callable = httpsCallable<
        { planId: string },
        { orderId: string; id?: string; amount: number; currency: string }
      >(functions, 'createRazorpayOrder');

      const res = await callable({ planId });
      const orderId = res.data?.orderId || res.data?.id;
      if (!orderId) {
        throw new Error('Payment gateway did not return a valid order identifier.');
      }
      return {
        orderId,
        amount: res.data.amount,
        currency: res.data.currency || 'INR',
      };
    } catch (err: any) {
      console.error('[subscriptionService.createRazorpayOrder] Error:', err);
      throw new Error(err?.message || 'Failed to create payment order.');
    }
  },

  /**
   * Calls authoritative backend Cloud Function `verifyRazorpayPayment` / `confirmRazorpayPayment`.
   */
  async verifyPayment(params: {
    paymentId?: string;
    orderId?: string;
    signature?: string;
    planId: string;
  }): Promise<PaymentVerificationResult> {
    try {
      const callable = httpsCallable<
        {
          paymentId?: string;
          orderId?: string;
          signature?: string;
          planId: string;
        },
        PaymentVerificationResult
      >(functions, 'verifyRazorpayPayment');

      const res = await callable(params);
      return res.data;
    } catch (err: any) {
      console.error('[subscriptionService.verifyPayment] Error:', err);
      throw new Error(err?.message || 'Payment verification failed on the server.');
    }
  },

  /**
   * Calls `confirmRazorpayPayment` backend Cloud Function (used by mobile app & web for status recovery).
   */
  async confirmPayment(params: {
    orderId: string;
    paymentId?: string;
    signature?: string;
    planId?: string;
  }): Promise<PaymentVerificationResult> {
    try {
      const callable = httpsCallable<Record<string, unknown>, PaymentVerificationResult>(
        functions,
        'confirmRazorpayPayment'
      );
      const res = await callable(params);
      return res.data;
    } catch (err: any) {
      console.error('[subscriptionService.confirmPayment] Error:', err);
      throw new Error(err?.message || 'Server could not confirm this payment.');
    }
  },

  /**
   * Calls `reconcileMyPayments` Cloud Function to recover any payments where money was deducted
   * but the network dropped before the client confirmed with the server.
   */
  async reconcileMyPayments(): Promise<{
    message?: string;
    subscriptionActivated?: boolean;
    needsAttention?: boolean;
  }> {
    try {
      const callable = httpsCallable<
        Record<string, never>,
        { message?: string; subscriptionActivated?: boolean; needsAttention?: boolean }
      >(functions, 'reconcileMyPayments');
      const res = await callable({});
      return res.data;
    } catch (err: any) {
      console.warn('[subscriptionService.reconcileMyPayments] Error:', err);
      return { message: 'Reconciliation check unavailable.', subscriptionActivated: false };
    }
  },

  /**
   * Initiates the full Razorpay Web Checkout journey:
   * 1. Loads checkout script
   * 2. Calls backend `createRazorpayOrder`
   * 3. Opens Razorpay popup
   * 4. Upon success, executes authoritative backend verification
   * 5. Handles user cancellation and error recovery
   */
  async initiatePayment(params: {
    plan: SubscriptionPlan;
    candidate: CandidateModel;
    onSuccess: (res: PaymentVerificationResult) => void;
    onFailure: (errorMessage: string) => void;
    onDismiss?: () => void;
  }): Promise<void> {
    const { plan, candidate, onSuccess, onFailure, onDismiss } = params;

    const isLoaded = await loadRazorpayScript();
    if (!isLoaded || !window.Razorpay) {
      onFailure('Failed to load secure payment gateway. Please check your internet connection and try again.');
      return;
    }

    restoreRazorpayDom();

    let orderData: { orderId: string; amount: number; currency: string };
    try {
      orderData = await this.createRazorpayOrder(plan.id);
    } catch (orderErr: any) {
      onFailure(orderErr?.message || 'Could not initialize payment order.');
      return;
    }

    const candidateFullName = [candidate.firstName, candidate.lastName].filter(Boolean).join(' ') || 'Candidate';
    const candidateEmail = candidate.email || auth.currentUser?.email || '';
    const candidatePhone = candidate.phoneNumber || '';

    let isProcessingResult = false;

    const options: Record<string, unknown> = {
      key: PAYMENT_CONFIG.RAZORPAY_KEY_ID,
      amount: orderData.amount,
      currency: orderData.currency || PAYMENT_CONFIG.CURRENCY,
      name: PAYMENT_CONFIG.COMPANY_NAME,
      description: plan.description || `${plan.title} Subscription`,
      order_id: orderData.orderId,
      prefill: {
        name: candidateFullName,
        email: candidateEmail,
        contact: candidatePhone,
      },
      theme: {
        color: '#4f46e5', // Primary Brand Indigo
      },
      modal: {
        backdropclose: false,
        escape: false,
        handleback: true,
        confirm_close: true,
        ondismiss: () => {
          this.dismissActiveCheckout();
          if (!isProcessingResult) {
            onDismiss?.();
            onFailure('Payment was cancelled. If any amount was deducted, your bank reverses it within 5-7 business days.');
          }
        },
      },
      handler: async (response: RazorpayCheckoutResponse) => {
        isProcessingResult = true;
        this.dismissActiveCheckout();

        const paymentId = response.razorpay_payment_id?.trim();
        const orderId = response.razorpay_order_id || orderData.orderId;
        const signature = response.razorpay_signature;

        if (!paymentId) {
          onFailure('Payment identification missing from gateway.');
          return;
        }

        try {
          // Authoritative verification via backend Cloud Function
          const result = await this.verifyPayment({
            paymentId,
            orderId,
            signature,
            planId: plan.id,
          });

          if (result.success || result.subscriptionActive) {
            onSuccess(result);
          } else {
            // Attempt confirmation fallback
            const confirmResult = await this.confirmPayment({
              orderId,
              paymentId,
              signature,
              planId: plan.id,
            });
            if (confirmResult.subscriptionActive || confirmResult.success) {
              onSuccess(confirmResult);
            } else {
              onFailure(
                result.message ||
                  confirmResult.message ||
                  'Payment could not be verified by the server. Please check your bank account or reconcile payments.'
              );
            }
          }
        } catch (verifyErr: any) {
          onFailure(
            verifyErr?.message ||
              `Could not confirm payment with server. If money was deducted, click 'Reconcile Payments' or contact support with Order ID: ${orderId}`
          );
        }
      },
    };

    try {
      activeRzpInstance = new window.Razorpay(options);
      activeRzpInstance.open();
    } catch (rzpErr: any) {
      this.dismissActiveCheckout();
      onFailure(rzpErr?.message || 'Could not launch payment window.');
    }
  },
};

