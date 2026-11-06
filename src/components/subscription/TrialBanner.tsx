import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Sparkles,
  Clock,
  ArrowRight,
  ShieldAlert,
  Crown,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { ROUTES } from '@/utils/constants';
import { useAuth } from '@/hooks/useAuth';
import { subscriptionService } from '@/services/subscriptionService';
import { TrialActivationModal } from './TrialActivationModal';

export const TrialBanner: React.FC = () => {
  const { candidate, refreshCandidate } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);

  if (!candidate) return null;

  const isEligible = subscriptionService.isTrialEligible(candidate);
  const isTrialActive = subscriptionService.isTrialActive(candidate);
  const isPaidActive = subscriptionService.isPaidActive(candidate);
  const hasUsedTrial = Boolean(candidate.hasUsedTrial);

  // If candidate is a paying member with active subscription, no promo banner needed
  if (isPaidActive) {
    return null;
  }

  // State 1: Active 7-Day Free Trial
  if (isTrialActive) {
    const daysLeft = subscriptionService.getDaysRemaining(candidate.trialExpiryDate);
    return (
      <div className="relative overflow-hidden rounded-2xl bg-[#29272A] text-white p-4 sm:p-5 shadow-sm border border-[#B87355]/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#B87355]/20 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-[#B87355]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#B87355]/20 text-[#F5F1EA] border border-[#B87355]/30">
                  Trial Active
                </span>
                <span className="text-xs font-bold text-[#D4CDC7]">
                  {daysLeft} {daysLeft === 1 ? 'day' : 'days'} remaining
                </span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-white mt-0.5">
                Full Premium enabled. Apply to jobs, chat with recruiters, and take skill tests.
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <NavLink to={ROUTES.SUBSCRIPTION}>
              <Button
                variant="primary"
                size="sm"
                className="bg-[#B87355] text-white hover:bg-[#A46347] font-bold shadow-xs text-xs"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                View Plans
              </Button>
            </NavLink>
          </div>
        </div>
      </div>
    );
  }

  // State 2: Trial Expired (Needs Upgrade)
  if (hasUsedTrial && !candidate.isPremium) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-[#29272A] text-white p-4 sm:p-5 shadow-sm border border-rose-500/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 text-rose-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-200 border border-rose-500/30">
                  Trial Expired
                </span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-white mt-0.5">
                Your 7-day free trial has concluded. Renew to keep applying directly and chatting with hiring teams.
              </p>
            </div>
          </div>

          <div className="shrink-0">
            <NavLink to={ROUTES.SUBSCRIPTION}>
              <Button
                variant="primary"
                size="sm"
                className="bg-[#B87355] text-white hover:bg-[#A46347] font-bold shadow-xs text-xs"
                rightIcon={<Crown className="w-3.5 h-3.5 text-white" />}
              >
                Upgrade to Premium
              </Button>
            </NavLink>
          </div>
        </div>
      </div>
    );
  }

  // State 3: Eligible for Free Trial
  if (isEligible) {
    return (
      <>
        <div className="relative overflow-hidden rounded-2xl bg-[#29272A] text-white p-4 sm:p-5 shadow-card border border-[#B87355]/40">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-[#B87355]/20 via-transparent to-transparent pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#B87355]/20 border border-[#B87355]/30 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-[#B87355]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#B87355]/20 text-[#F5F1EA] border border-[#B87355]/30">
                    Introductory Offer
                  </span>
                  <span className="text-xs font-bold text-[#B87355]">
                    ₹0 For 7 Days
                  </span>
                </div>
                <h4 className="text-sm sm:text-base font-bold text-white mt-0.5">
                  Try TalentBay Premium completely free for 7 days
                </h4>
                <p className="text-xs text-[#D4CDC7] hidden sm:block">
                  Apply directly, chat with employers, and test your skills. No credit card required.
                </p>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setModalOpen(true)}
                className="bg-[#B87355] text-white hover:bg-[#A46347] font-extrabold shadow-sm text-xs"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Start Free Trial
              </Button>
            </div>
          </div>
        </div>

        <TrialActivationModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSuccess={async () => {
            await refreshCandidate();
          }}
        />
      </>
    );
  }

  return null;
};
