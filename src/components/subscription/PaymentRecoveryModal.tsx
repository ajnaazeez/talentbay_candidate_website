import React, { useState } from 'react';
import {
  RotateCw,
  X,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { subscriptionService } from '@/services/subscriptionService';

interface PaymentRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void> | void;
}

export const PaymentRecoveryModal: React.FC<PaymentRecoveryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleReconcile = async () => {
    try {
      setLoading(true);
      setResultMessage(null);
      const res = await subscriptionService.reconcileMyPayments();

      if (res.subscriptionActivated) {
        setIsSuccess(true);
        setResultMessage(res.message || 'Payment successfully reconciled! Your premium subscription is now active.');
        await onSuccess();
      } else {
        setIsSuccess(false);
        setResultMessage(
          res.message ||
            'No pending captured transactions were found. If an amount was deducted, please allow 5-7 business days for the automated bank reversal, or contact support with your transaction reference.'
        );
      }
    } catch (err: any) {
      setIsSuccess(false);
      setResultMessage(err?.message || 'Failed to check payment status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-[#131f37] rounded-3xl border border-slate-200 dark:border-[#1e2f52] shadow-modal overflow-hidden p-6 sm:p-8 space-y-5">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1e2f52] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
            <RotateCw className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              Payment Reconciliation
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Check for interrupted or pending transactions
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed space-y-2">
          <p>
            If money was deducted from your bank account or UPI but your subscription did not immediately activate due to a network drop, our automated reconciliation service can synchronize it with the payment gateway.
          </p>
        </div>

        {resultMessage && (
          <div
            className={`p-4 rounded-2xl border text-xs flex items-start gap-3 ${
              isSuccess
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-200'
                : 'bg-slate-50 dark:bg-[#1a2234] border-slate-200 dark:border-[#253248] text-slate-700 dark:text-slate-300'
            }`}
          >
            {isSuccess ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <HelpCircle className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <span className="font-semibold block">{isSuccess ? 'Success' : 'Status'}</span>
              <span>{resultMessage}</span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <Button
            variant="primary"
            onClick={handleReconcile}
            isLoading={loading}
            className="flex-1 justify-center"
            leftIcon={<RotateCw className="w-4 h-4" />}
          >
            Check & Reconcile
          </Button>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
