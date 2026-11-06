import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  CreditCard,
  ArrowRight,
  RotateCw,
  Calendar,
  Lock,
  ChevronDown,
  LayoutDashboard,
  Briefcase,
  XCircle,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { SectionHeader } from '@/components/common/SectionHeader';
import { Button } from '@/components/common/Button';
import { useAuth } from '@/hooks/useAuth';
import { PAYMENT_CONFIG, ROUTES } from '@/utils/constants';
import { subscriptionService } from '@/services/subscriptionService';
import type { SubscriptionPlan, PaymentVerificationResult } from '@/types/subscription';
import { TrialActivationModal } from '@/components/subscription/TrialActivationModal';
import { PaymentRecoveryModal } from '@/components/subscription/PaymentRecoveryModal';

export const SubscriptionPage: React.FC = () => {
  const { candidate, refreshCandidate } = useAuth();
  const navigate = useNavigate();

  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);

  const [trialModalOpen, setTrialModalOpen] = useState(false);
  const [recoveryModalOpen, setRecoveryModalOpen] = useState(false);
  const [recoveryPlanId, setRecoveryPlanId] = useState('1_month');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

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

  const expiryDateFormatted = hasPremium
    ? formatDateString(
        isPaidActive ? candidate?.subscriptionExpiryDate : candidate?.trialExpiryDate
      )
    : null;

  const handleSubscribe = async (plan: (typeof plans)[number]) => {
    if (!candidate) return;

    try {
      setPaymentError(null);
      setPaymentSuccess(null);
      setProcessingPlanId(plan.id);
      setRecoveryPlanId(plan.id);

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

  const toggleFaq = (index: number) => {
    setOpenFaqIndex((prev) => (prev === index ? null : index));
  };

  const faqItems = [
    {
      q: 'How does the 7-day free trial work?',
      a: 'New eligible candidate accounts receive a 100% free 7-day trial of Candidate Premium with zero upfront charges. You get immediate access to direct employer messaging, AI CV building, and unlimited skill assessments without entering card or payment details.',
    },
    {
      q: 'Which payment methods are supported for subscriptions?',
      a: 'We support all major Indian payment methods through our secure Razorpay gateway, including UPI (Google Pay, PhonePe, Paytm, BHIM), Netbanking across all Indian banks, Credit Cards (Visa, MasterCard, RuPay), and Debit Cards.',
    },
    {
      q: 'Can I renew or extend my subscription before it expires?',
      a: 'Yes! When you renew or upgrade an active subscription, the new duration is added on top of your existing remaining days, ensuring you never lose any paid membership time.',
    },
    {
      q: 'What happens if money was deducted but my subscription is delayed?',
      a: 'If a temporary network disconnection interrupted your activation after payment was deducted, simply click "Verify Payment Reference" or "Reconcile Payment" on this page. Our server will query the gateway and instantly activate your membership, or automated banking reversal will refund within 5–7 business days.',
    },
  ];

  return (
    <div className="space-y-8 sm:space-y-10 max-w-6xl mx-auto pb-16">
      {/* 1. Page Header (Matches Recruiter PageHeader structure & badges) */}
      <PageHeader
        title="Subscription & Membership Plans"
        description="Choose a verified candidate subscription plan to unlock direct employer chat, AI CV building, and verified skill assessments"
        badge={
          hasPremium ? (
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/80 flex items-center gap-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {isPaidActive ? 'Active Premium Membership' : '7-Day Free Trial Active'}
            </span>
          ) : (
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/80 flex items-center gap-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Basic Account
            </span>
          )
        }
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setRecoveryPlanId(currentPlanId || '1_month');
              setRecoveryModalOpen(true);
            }}
            leftIcon={<RotateCw className="w-3.5 h-3.5 text-[#8CA6B7]" />}
          >
            Reconcile Payment
          </Button>
        }
      />

      {/* 2. Success Banner with Immediate Feedback & Quick Actions (Matches Recruiter) */}
      {paymentSuccess && (
        <div className="p-6 sm:p-7 bg-gradient-to-r from-emerald-50 via-teal-50/70 to-emerald-50 dark:from-emerald-950/40 dark:via-[#0E2233] dark:to-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-3xl text-emerald-900 dark:text-emerald-200 shadow-sm space-y-4 animate-in fade-in duration-300">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-emerald-950 dark:text-white">
                Subscription Activated Successfully!
              </h3>
              <p className="text-xs sm:text-sm text-emerald-800 dark:text-emerald-300 leading-relaxed">
                Your candidate account is now active with the{' '}
                <strong>{currentPlanObj?.title || 'Premium'}</strong> plan. All premium candidate features,
                direct recruiter chat, AI resume generation, and unlimited skill assessments are unlocked.
              </p>
              {expiryDateFormatted && (
                <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1.5 pt-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Valid through {expiryDateFormatted} ({daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining)
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-emerald-200/60 dark:border-emerald-800/60">
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(ROUTES.DASHBOARD)}
              leftIcon={<LayoutDashboard className="w-3.5 h-3.5" />}
            >
              Go to Dashboard
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(ROUTES.JOBS)}
              leftIcon={<Briefcase className="w-3.5 h-3.5" />}
            >
              Explore Jobs
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(ROUTES.RESUME_BUILDER)}
              leftIcon={<Sparkles className="w-3.5 h-3.5 text-[#00BFA6]" />}
            >
              Create AI Resume
            </Button>
          </div>
        </div>
      )}

      {/* 3. Error Alert & Instant Payment Verification Recovery (Matches Recruiter) */}
      {paymentError && (
        <div className="p-5 bg-rose-50/90 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-3xl text-xs sm:text-sm text-rose-800 dark:text-rose-200 space-y-3 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1 flex-1">
              <p className="font-bold text-rose-950 dark:text-rose-100">{paymentError}</p>
              <p className="text-xs text-rose-700 dark:text-rose-300">
                If your payment was completed on Google Pay, PhonePe or UPI, you can verify your transaction reference below to activate your subscription immediately.
              </p>
            </div>
          </div>
          <div className="pt-2 border-t border-rose-200/60 dark:border-rose-900/60 flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-semibold text-rose-900 dark:text-rose-200">
              Completed payment via Google Pay / UPI?
            </span>
            <button
              type="button"
              onClick={() => setRecoveryModalOpen(true)}
              className="px-3.5 py-1.5 text-xs font-bold text-teal-800 dark:text-teal-200 bg-teal-100 dark:bg-teal-950/60 hover:bg-teal-200 border border-teal-300 dark:border-teal-700 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
              Verify Payment Reference
            </button>
          </div>
        </div>
      )}

      {/* 4. Current Subscription Overview Card (Matches Recruiter layout & styling) */}
      {hasPremium && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0E2233] border border-[#D8E4EA] dark:border-[#1F2D3D] shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                Current Active Plan
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-[#1F2D3D] dark:text-white">
              {isPaidActive
                ? currentPlanObj?.title || 'Verified Premium Membership'
                : isTrialActive
                ? '7-Day Free Premium Trial'
                : 'Active Membership'}
            </h3>
            {expiryDateFormatted && (
              <p className="text-xs text-[#6B8699] dark:text-[#8CA6B7] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#8CA6B7]" />
                Valid through <strong>{expiryDateFormatted}</strong> ({daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining)
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-[#1F2D3D] dark:text-[#BACDD8] bg-[#E8F1F5] dark:bg-[#0A1A27] px-3.5 py-2.5 rounded-2xl border border-[#D8E4EA] dark:border-[#1F2D3D]">
              <ShieldCheck className="w-4 h-4 text-[#00BFA6]" />
              <span>Full Candidate Workspace Unlocked</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setRecoveryPlanId(currentPlanId || '1_month');
                setRecoveryModalOpen(true);
              }}
              leftIcon={<RotateCw className="w-3.5 h-3.5 text-[#8CA6B7]" />}
            >
              Reconcile Payment
            </Button>
          </div>
        </div>
      )}

      {/* 5. Free Trial Promotional Card (When eligible - Matches Recruiter Introductory Offer card) */}
      {isEligibleForTrial && (
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#0E2233] via-[#122A3F] to-[#0A1A27] text-white border border-[#00BFA6]/30 shadow-xl relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-80 h-80 rounded-full bg-[#00BFA6]/15 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2.5 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[#00BFA6]/20 text-[#00BFA6] border border-[#00BFA6]/40 flex items-center gap-1 shadow-xs">
                  <Sparkles className="w-3 h-3 text-[#00BFA6]" />
                  Introductory Offer
                </span>
                <span className="text-xs text-[#5EEAD9] font-medium">No payment card required</span>
              </div>
              <h4 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                {trialPlan.title} — 100% Free for 7 Days
              </h4>
              <p className="text-xs sm:text-sm text-[#BACDD8] leading-relaxed">
                {trialPlan.description} Experience complete access to verified recruiter messaging, AI resume creation, and verified skill assessment scoring.
              </p>
            </div>

            <div className="shrink-0">
              <Button
                variant="primary"
                onClick={() => setTrialModalOpen(true)}
                className="font-extrabold text-xs py-3 px-6 shadow-md"
                rightIcon={<ArrowRight className="w-4 h-4 text-[#00BFA6]" />}
              >
                Activate Free Trial (₹0)
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Verified Candidate Subscription Plans Grid (Matches Recruiter SectionHeader & Cards) */}
      <div className="space-y-5">
        <SectionHeader
          title="Verified Candidate Subscription Plans"
          description="Select a membership tier to power your career progression, direct recruiter connections, and AI tools"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan) => {
            const isCurrent = isPaidActive && currentPlanId === plan.id;
            const isProcessing = processingPlanId === plan.id;

            return (
              <div
                key={plan.id}
                className={`p-6 sm:p-7 rounded-3xl border flex flex-col justify-between transition-all duration-200 relative ${
                  isCurrent
                    ? 'bg-teal-50/20 dark:bg-[#00BFA6]/10 border-[#00BFA6] shadow-md ring-2 ring-[#00BFA6]'
                    : plan.isPopular
                    ? 'bg-white dark:bg-[#0E2233] border-2 border-[#00BFA6] shadow-xl ring-2 ring-[#00BFA6]/20'
                    : 'bg-white dark:bg-[#0E2233] border-[#D8E4EA] dark:border-[#1F2D3D] shadow-card hover:border-[#00BFA6]/60'
                }`}
              >
                {/* Plan Badges */}
                {isCurrent && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-0.5 bg-[#00BFA6] text-white font-bold text-[10px] rounded-full uppercase tracking-wider shadow-xs">
                    Current Plan
                  </span>
                )}

                {!isCurrent && plan.offer && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-0.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-[10px] rounded-full uppercase tracking-wider shadow-xs flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" /> {plan.offer}
                  </span>
                )}

                <div className="space-y-4">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-[#1F2D3D] dark:text-white">
                      {plan.title}
                    </h3>
                    <p className="text-xs text-[#6B8699] dark:text-[#8CA6B7] mt-1 min-h-[32px] leading-relaxed">
                      {plan.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#D8E4EA] dark:border-[#1F2D3D]">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl sm:text-4xl font-black text-[#1F2D3D] dark:text-white tracking-tight">
                        ₹{plan.displayAmount}
                      </span>
                      <span className="text-xs font-semibold text-[#6B8699] dark:text-[#8CA6B7]">
                        / {plan.durationDays} Days
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-3 border-t border-[#D8E4EA] dark:border-[#1F2D3D]">
                    <span className="text-[11px] font-bold text-[#6B8699] dark:text-[#8CA6B7] uppercase tracking-wider block">
                      Included Features
                    </span>
                    <ul className="space-y-2 text-xs text-[#1F2D3D] dark:text-[#BACDD8]">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-[#00BFA6] shrink-0 mt-0.5" />
                          <span className="leading-tight">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-6 mt-4 border-t border-[#D8E4EA] dark:border-[#1F2D3D]">
                  <Button
                    variant={isCurrent ? 'secondary' : 'primary'}
                    size="md"
                    className="w-full justify-center"
                    disabled={isCurrent || isProcessing}
                    isLoading={isProcessing}
                    onClick={() => handleSubscribe(plan)}
                    leftIcon={isCurrent ? <CheckCircle2 className="w-4 h-4 text-[#00BFA6]" /> : <CreditCard className="w-4 h-4" />}
                  >
                    {isCurrent
                      ? 'Current Active Plan'
                      : isProcessing
                      ? 'Opening Payment...'
                      : isPaidActive
                      ? `Renew for ₹${plan.displayAmount}`
                      : `Subscribe for ₹${plan.displayAmount}`}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 7. Comprehensive Plan Comparison Matrix (Recruiter standard) */}
      <div className="space-y-4">
        <SectionHeader
          title="Plan Comparison & Feature Breakdown"
          description="Detailed comparison between Basic (Free) and Verified Premium Candidate memberships"
        />

        <div className="rounded-3xl border border-[#D8E4EA] dark:border-[#1F2D3D] bg-white dark:bg-[#0E2233] shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#D8E4EA] dark:border-[#1F2D3D] bg-[#F6FAFC] dark:bg-[#0A1A27]/60">
                  <th className="py-3.5 px-5 font-bold text-[#1F2D3D] dark:text-white w-1/2">
                    Candidate Feature
                  </th>
                  <th className="py-3.5 px-4 font-bold text-[#6B8699] dark:text-[#8CA6B7] w-1/4 text-center">
                    Basic (Free)
                  </th>
                  <th className="py-3.5 px-4 font-bold text-[#00BFA6] w-1/4 text-center">
                    Verified Premium
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D8E4EA] dark:divide-[#1F2D3D] text-[#1F2D3D] dark:text-[#BACDD8]">
                <tr>
                  <td className="py-3 px-5 font-medium">Direct job applications</td>
                  <td className="py-3 px-4 text-center text-[#6B8699] dark:text-[#8CA6B7]">Limited</td>
                  <td className="py-3 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400">
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#00BFA6]" /> Unlimited
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-5 font-medium">Direct 1-on-1 recruiter chat when shortlisted</td>
                  <td className="py-3 px-4 text-center text-slate-400">
                    <XCircle className="w-3.5 h-3.5 mx-auto text-slate-400" />
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400">
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#00BFA6]" /> Full Access
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-5 font-medium">Verified skill assessments & proficiency badges</td>
                  <td className="py-3 px-4 text-center text-[#6B8699] dark:text-[#8CA6B7]">1 Assessment</td>
                  <td className="py-3 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400">
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#00BFA6]" /> Unlimited
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-5 font-medium">ATS-optimized Gemini AI Resume Builder & PDF export</td>
                  <td className="py-3 px-4 text-center text-slate-400">
                    <XCircle className="w-3.5 h-3.5 mx-auto text-slate-400" />
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400">
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#00BFA6]" /> Full Access
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-5 font-medium">Personalized Career Readiness scoring & guidance</td>
                  <td className="py-3 px-4 text-center text-[#6B8699] dark:text-[#8CA6B7]">Basic summary</td>
                  <td className="py-3 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400">
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#00BFA6]" /> Detailed Roadmap
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-5 font-medium">Verified Applicant badge on employer applicant lists</td>
                  <td className="py-3 px-4 text-center text-slate-400">
                    <XCircle className="w-3.5 h-3.5 mx-auto text-slate-400" />
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400">
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#00BFA6]" /> Priority Badge
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-5 font-medium">Employer profile search visibility</td>
                  <td className="py-3 px-4 text-center text-[#6B8699] dark:text-[#8CA6B7]">Standard</td>
                  <td className="py-3 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400">
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#00BFA6]" /> High Priority
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 8. Trust, Security & Guarantee Banner (Matches Recruiter 3-pillar security) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#E8F1F5]/80 dark:bg-[#0E2233] border border-[#D8E4EA] dark:border-[#1F2D3D] shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div className="flex flex-col items-center space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-white dark:bg-[#0A1A27] border border-[#D8E4EA] dark:border-[#1F2D3D] text-[#00BFA6] flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h5 className="text-xs font-bold text-[#1F2D3D] dark:text-white">
              Authoritative Backend Verification
            </h5>
            <p className="text-[11px] text-[#6B8699] dark:text-[#8CA6B7] max-w-xs leading-relaxed">
              Every payment signature is cryptographically validated server-side by Firebase Admin SDK.
            </p>
          </div>

          <div className="flex flex-col items-center space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-white dark:bg-[#0A1A27] border border-[#D8E4EA] dark:border-[#1F2D3D] text-[#00BFA6] flex items-center justify-center shadow-xs">
              <Lock className="w-5 h-5" />
            </div>
            <h5 className="text-xs font-bold text-[#1F2D3D] dark:text-white">
              Razorpay Secured Gateway
            </h5>
            <p className="text-[11px] text-[#6B8699] dark:text-[#8CA6B7] max-w-xs leading-relaxed">
              Supports UPI, Google Pay, PhonePe, Netbanking, Debit, and Credit Cards with 256-bit encryption.
            </p>
          </div>

          <div className="flex flex-col items-center space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-white dark:bg-[#0A1A27] border border-[#D8E4EA] dark:border-[#1F2D3D] text-[#00BFA6] flex items-center justify-center shadow-xs">
              <RotateCw className="w-5 h-5" />
            </div>
            <h5 className="text-xs font-bold text-[#1F2D3D] dark:text-white">
              Automated Reversal Protection
            </h5>
            <p className="text-[11px] text-[#6B8699] dark:text-[#8CA6B7] max-w-xs leading-relaxed">
              If an interrupted connection prevents activation, click Reconcile or receive automated bank refund in 5–7 days.
            </p>
          </div>
        </div>
      </div>

      {/* 9. Frequently Asked Questions (FAQ) Section */}
      <div className="space-y-4">
        <SectionHeader
          title="Frequently Asked Questions"
          description="Everything you need to know about Candidate Premium billing and trial access"
        />

        <div className="space-y-3">
          {faqItems.map((item, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-[#D8E4EA] dark:border-[#1F2D3D] bg-white dark:bg-[#0E2233] overflow-hidden transition-all duration-200"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-[#1F2D3D] dark:text-white cursor-pointer hover:bg-[#F6FAFC] dark:hover:bg-[#132B3E] transition"
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#8CA6B7] shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-[#00BFA6]' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 text-xs text-[#6B8699] dark:text-[#BACDD8] leading-relaxed border-t border-[#D8E4EA]/60 dark:border-[#1F2D3D]/60 animate-in fade-in duration-200">
                    <p className="pt-3">{item.a}</p>
                  </div>
                )}
              </div>
            );
          })}
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
        initialPlanId={recoveryPlanId}
        onSuccess={async () => {
          await refreshCandidate();
        }}
      />
    </div>
  );
};

export default SubscriptionPage;
