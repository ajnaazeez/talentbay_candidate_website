import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  X,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { subscriptionService } from '@/services/subscriptionService';
import { PAYMENT_CONFIG } from '@/utils/constants';

interface TrialActivationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void> | void;
}

export const TrialActivationModal: React.FC<TrialActivationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleActivate = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await subscriptionService.startFreeTrial();
      if (res.granted) {
        setSuccess(true);
        await onSuccess();
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(
          res.reason === 'already_used_trial'
            ? 'You have already activated your 7-day free trial on this account.'
            : 'Could not activate trial. You may already have an active subscription.'
        );
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to start trial. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const trialInfo = PAYMENT_CONFIG.FREE_TRIAL;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#111827] rounded-3xl border border-slate-200 dark:border-[#1f293d] shadow-modal overflow-hidden">
        {/* Header background with brand gradient */}
        <div className="relative p-6 sm:p-8 bg-gradient-to-br from-brand-600 via-indigo-600 to-purple-700 text-white overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent pointer-events-none" />
          
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md text-white border border-white/30 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            7-DAY FREE TRIAL
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Unlock Full Premium
          </h2>
          <p className="text-xs sm:text-sm text-indigo-100 mt-1 max-w-sm">
            Experience every premium candidate capability for 7 days. No credit card or payment details needed.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3 text-rose-700 dark:text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Welcome to TalentBay Premium!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Your 7-day free trial has been activated. Enjoy full access across all candidate tools.
              </p>
            </div>
          ) : (
            <>
              {/* Feature Highlights */}
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  What is included in your free trial:
                </p>
                <div className="space-y-2.5">
                  {trialInfo.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Security & Pricing Banner */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1a2234] border border-slate-200/80 dark:border-[#253248] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
                  <ShieldCheck className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
                  <span>Duration: 7 Days &bull; ₹0 Cost</span>
                </div>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider text-[11px]">
                  Zero Commitment
                </span>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <Button
                  variant="primary"
                  onClick={handleActivate}
                  isLoading={loading}
                  className="w-full justify-center bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 shadow-md"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Start 7-Day Free Trial
                </Button>
                <Button
                  variant="ghost"
                  onClick={onClose}
                  disabled={loading}
                  className="w-full sm:w-auto text-xs"
                >
                  Maybe Later
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
