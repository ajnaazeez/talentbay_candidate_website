import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  RotateCw,
  Crown,
  Lock,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { useAuth } from '@/hooks/useAuth';
import { PAYMENT_CONFIG } from '@/utils/constants';
import { subscriptionService } from '@/services/subscriptionService';
import type { SubscriptionPlan, PaymentVerificationResult } from '@/types/subscription';
import { TrialActivationModal } from '@/components/subscription/TrialActivationModal';
import { PaymentRecoveryModal } from '@/components/subscription/PaymentRecoveryModal';

export const SubscriptionPage: React.FC = () => {
  const { candidate, refreshCandidate } = useAuth();

  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);

  const [trialModalOpen, setTrialModalOpen] = useState(false);
  const [recoveryModalOpen, setRecoveryModalOpen] = useState(false);

  // Clear active checkout overlay on unmount
  useEffect(() => {
    return () => {
      subscriptionService.dismissActiveCheckout();
    };
  }, []);

  const isEligibleForTrial = subscriptionService.isTrialEligible(candidate);
  const isTrialActive = subscriptionService.isTrialActive(candidate);
  const isPaidActive = subscriptionService.isPaidActive(candidate);
  const hasPremium = subscriptionService.hasPremiumAccess(candidate);

  const plans = PAYMENT_CONFIG.SUBSCRIPTION_PLANS;
  const trialPlan = PAYMENT_CONFIG.FREE_TRIAL;

  const currentPlanId = candidate?.subscriptionPlanId;
  const currentPlanObj = plans.find((p) => p.id === currentPlanId);

  const daysRemaining = subscriptionService.getDaysRemaining(
    isPaidActive ? candidate?.subscriptionExpiryDate : candidate?.trialExpiryDate
  );

  const formatDateString = (val: any) => {
    const d = subscriptionService.parseDate(val);
    if (!d) return 'N/A';
    return d.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleSubscribe = async (plan: (typeof plans)[number]) => {
    if (!candidate) return;

    try {
      setPaymentError(null);
      setPaymentSuccess(null);
      setProcessingPlanId(plan.id);

      await subscriptionService.initiatePayment({
        plan: plan as unknown as SubscriptionPlan,
        candidate,
        onSuccess: async (res: PaymentVerificationResult) => {
          setProcessingPlanId(null);
          setPaymentSuccess(
            res.message || 'Payment confirmed successfully! Your premium subscription is now active.'
          );
          await refreshCandidate();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        onFailure: (errMsg: string) => {
          setProcessingPlanId(null);
          setPaymentError(errMsg);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        onDismiss: () => {
          setProcessingPlanId(null);
        },
      });
    } catch (err: any) {
      setProcessingPlanId(null);
      setPaymentError(err?.message || 'Payment initiation failed. Please try again.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <PageHeader
        title="Candidate Premium Plans"
        description="Accelerate your job search with verified applicant badges, AI CV creation, and direct employer chat."
        badge={
          <Badge variant="brand" isAi>
            <Crown className="w-3.5 h-3.5 mr-1 text-amber-500" />
            Premium Membership
          </Badge>
        }
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRecoveryModalOpen(true)}
            leftIcon={<RotateCw className="w-4 h-4 text-slate-500" />}
          >
            Reconcile Payment
          </Button>
        }
      />

      {/* Alerts */}
      {paymentSuccess && (
        <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-start gap-3.5 text-emerald-800 dark:text-emerald-200 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold">Subscription Activated</h4>
            <p className="text-xs text-emerald-700 dark:text-emerald-300">{paymentSuccess}</p>
          </div>
        </div>
      )}

      {paymentError && (
        <div className="p-4 sm:p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3.5 text-rose-800 dark:text-rose-200 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold">Payment Notification</h4>
            <p className="text-xs text-rose-700 dark:text-rose-300">{paymentError}</p>
          </div>
        </div>
      )}

      {/* Current Membership Status Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#202A27] border border-slate-200 dark:border-[#2e3b37] shadow-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Current Status
              </span>
              {hasPremium ? (
                <span className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {isPaidActive ? 'PREMIUM ACTIVE' : '7-DAY TRIAL ACTIVE'}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-[#141a18] px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-[#2e3b37]">
                  BASIC ACCOUNT
                </span>
              )}
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {isPaidActive
                ? currentPlanObj?.title || 'Active Premium Membership'
                : isTrialActive
                ? '7-Day Free Premium Trial'
                : candidate?.hasUsedTrial
                ? 'Trial Expired — Upgrade to Keep Premium Access'
                : 'Free Account — 7-Day Free Trial Available'}
            </h3>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
              {hasPremium
                ? `You have full candidate access enabled until ${formatDateString(
                    isPaidActive ? candidate?.subscriptionExpiryDate : candidate?.trialExpiryDate
                  )} (${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} remaining).`
                : 'Subscribe to a premium plan below to connect directly with hiring managers, take AI skill assessments, and generate ATS resumes.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {isEligibleForTrial && (
              <Button
                variant="primary"
                onClick={() => setTrialModalOpen(true)}
                className="bg-brand-600 hover:bg-brand-700 text-white font-bold"
                leftIcon={<Sparkles className="w-4 h-4 text-yellow-300" />}
              >
                Start 7-Day Free Trial
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Free Trial Callout Card (if eligible) */}
      {isEligibleForTrial && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-[#123C35] via-[#0e2f29] to-[#202A27] text-white border border-[#C5A46D]/30 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[#C5A46D]/20 text-[#C5A46D] border border-[#C5A46D]/40">
                  Zero Cost
                </span>
                <span className="text-xs text-[#E8E5DC]/80">No payment info required</span>
              </div>
              <h4 className="text-lg sm:text-xl font-bold tracking-tight">
                {trialPlan.title} — 100% Free for 7 Days
              </h4>
              <p className="text-xs sm:text-sm text-[#E8E5DC]/80 leading-relaxed">
                {trialPlan.description}
              </p>
            </div>

            <div className="shrink-0">
              <Button
                variant="primary"
                onClick={() => setTrialModalOpen(true)}
                className="bg-[#C5A46D] text-[#202A27] hover:bg-[#d2ad77] font-extrabold shadow-md text-xs py-2.5 px-5"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Activate Free Trial (₹0)
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Plans Grid */}
      <div>
        <div className="mb-6 text-center max-w-xl mx-auto space-y-1">
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Select a Subscription Plan
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Secure billing through Razorpay. Automatic activation upon payment verification.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrent = isPaidActive && currentPlanId === plan.id;
            const isProcessing = processingPlanId === plan.id;

            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 ${
                  plan.isPopular
                    ? 'bg-white dark:bg-[#202A27] border-2 border-brand-500 shadow-xl ring-4 ring-brand-500/10'
                    : 'bg-white dark:bg-[#202A27] border border-slate-200 dark:border-[#2e3b37] shadow-card hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Plan Badge */}
                {plan.offer && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-brand-600 text-white shadow-md">
                      {plan.offer}
                    </span>
                  </div>
                )}

                <div className="space-y-5">
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      {plan.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {plan.description}
                    </p>
                  </div>

                  {/* Price Header */}
                  <div className="flex items-baseline gap-1.5 pb-4 border-b border-slate-100 dark:border-[#2e3b37]">
                    <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                      ₹{plan.displayAmount}
                    </span>
                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                      / {plan.durationDays} Days
                    </span>
                  </div>

                  {/* Features List */}
                  <div className="space-y-3 pt-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                      Included with plan:
                    </span>
                    <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                      {plan.features.map((feature, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Card CTA */}
                <div className="mt-8 pt-5 border-t border-slate-100 dark:border-[#2e3b37]">
                  <Button
                    variant={plan.isPopular ? 'primary' : 'outline'}
                    onClick={() => handleSubscribe(plan)}
                    isLoading={isProcessing}
                    disabled={isProcessing || isCurrent}
                    className={`w-full justify-center py-2.5 font-bold text-xs ${
                      plan.isPopular
                        ? 'bg-brand-600 hover:bg-brand-700 text-white shadow-md'
                        : ''
                    }`}
                    rightIcon={!isCurrent ? <ArrowRight className="w-3.5 h-3.5" /> : undefined}
                  >
                    {isCurrent ? 'Current Plan' : isPaidActive ? 'Renew / Extend' : 'Subscribe Now'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Trust & Guarantee Banner */}
      <div className="p-6 rounded-3xl bg-slate-50 dark:bg-[#202A27] border border-slate-200/80 dark:border-[#2e3b37] shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div className="flex flex-col items-center space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-white dark:bg-[#141a18] border border-slate-200 dark:border-[#2e3b37] text-brand-600 dark:text-brand-400 flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100">
              Authoritative Backend Verification
            </h5>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs">
              Every payment signature is cryptographically validated server-side by Firebase Admin SDK.
            </p>
          </div>

          <div className="flex flex-col items-center space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-white dark:bg-[#141a18] border border-slate-200 dark:border-[#2e3b37] text-brand-600 dark:text-brand-400 flex items-center justify-center shadow-xs">
              <Lock className="w-5 h-5" />
            </div>
            <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100">
              Razorpay Secured Gateway
            </h5>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs">
              Supports UPI, Google Pay, PhonePe, Netbanking, Debit, and Credit Cards with 256-bit encryption.
            </p>
          </div>

          <div className="flex flex-col items-center space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-white dark:bg-[#141a18] border border-slate-200 dark:border-[#2e3b37] text-brand-600 dark:text-brand-400 flex items-center justify-center shadow-xs">
              <RotateCw className="w-5 h-5" />
            </div>
            <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100">
              Automated Reversal Protection
            </h5>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs">
              If an interrupted connection prevents activation, click Reconcile or receive automated bank refund in 5–7 days.
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      <TrialActivationModal
        isOpen={trialModalOpen}
        onClose={() => setTrialModalOpen(false)}
        onSuccess={async () => {
          await refreshCandidate();
        }}
      />

      <PaymentRecoveryModal
        isOpen={recoveryModalOpen}
        onClose={() => setRecoveryModalOpen(false)}
        onSuccess={async () => {
          await refreshCandidate();
        }}
      />
    </div>
  );
};

export default SubscriptionPage;
