import React, { useState } from 'react';
import {
  RotateCw,
  X,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { ModalPortal } from '@/components/common/Modal';
import { subscriptionService } from '@/services/subscriptionService';
import { PAYMENT_CONFIG } from '@/utils/constants';

interface PaymentRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void> | void;
  initialPlanId?: string;
}

export const PaymentRecoveryModal: React.FC<PaymentRecoveryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialPlanId = '1_month',
}) => {
  const [activeTab, setActiveTab] = useState<'manual' | 'auto'>('manual');
  const [paymentRef, setPaymentRef] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState(initialPlanId);
  const [loading, setLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const plans = PAYMENT_CONFIG.SUBSCRIPTION_PLANS;

  const handleManualVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanRef = paymentRef.trim();
    if (!cleanRef) return;

    try {
      setLoading(true);
      setResultMessage(null);

      const res = await subscriptionService.verifyPayment({
        paymentId: cleanRef,
        planId: selectedPlanId,
      });

      if (res.success || res.verified) {
        setIsSuccess(true);
        setResultMessage(res.message || 'Payment verified and subscription activated successfully!');
        await onSuccess();
      } else {
        setIsSuccess(false);
        setResultMessage(res.message || 'Payment reference could not be verified. Please verify the ID from your receipt.');
      }
    } catch (err: any) {
      console.error('[PaymentRecoveryModal] Error in manual verify:', err);
      setIsSuccess(false);
      setResultMessage(err?.message || 'Verification could not be completed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoReconcile = async () => {
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
            'No pending captured transactions were found. If money was deducted, bank reversal typically processes in 5-7 business days, or verify using your payment ID.'
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
    <ModalPortal isOpen={isOpen} onClose={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-white dark:bg-[#0E2233] rounded-3xl border border-[#D8E4EA] dark:border-[#1F2D3D] shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6 my-auto animate-in fade-in zoom-in-95 duration-150"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[#8CA6B7] hover:text-[#1F2D3D] dark:hover:text-white hover:bg-[#E8F1F5] dark:hover:bg-[#132B3E] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#00BFA6]/15 text-[#00BFA6] flex items-center justify-center shrink-0 shadow-xs">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#1F2D3D] dark:text-white">
              Verify & Reconcile Payment
            </h3>
            <p className="text-xs text-[#6B8699] dark:text-[#8CA6B7]">
              Activate your subscription from a completed UPI / Card transaction
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 p-1 bg-[#E8F1F5] dark:bg-[#0A1A27] rounded-xl border border-[#D8E4EA] dark:border-[#1F2D3D]">
          <button
            type="button"
            onClick={() => {
              setActiveTab('manual');
              setResultMessage(null);
            }}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'manual'
                ? 'bg-white dark:bg-[#0E2233] text-[#1F2D3D] dark:text-white shadow-xs'
                : 'text-[#6B8699] dark:text-[#8CA6B7] hover:text-[#1F2D3D] dark:hover:text-white'
            }`}
          >
            Payment ID Reference
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('auto');
              setResultMessage(null);
            }}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'auto'
                ? 'bg-white dark:bg-[#0E2233] text-[#1F2D3D] dark:text-white shadow-xs'
                : 'text-[#6B8699] dark:text-[#8CA6B7] hover:text-[#1F2D3D] dark:hover:text-white'
            }`}
          >
            Auto-Detect Sync
          </button>
        </div>

        {/* Manual Verify Tab */}
        {activeTab === 'manual' && (
          <form onSubmit={handleManualVerify} className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#1F2D3D] dark:text-white mb-1.5">
                  Subscription Plan
                </label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-[#F6FAFC] dark:bg-[#0A1A27] border border-[#D8E4EA] dark:border-[#1F2D3D] rounded-xl text-[#1F2D3D] dark:text-white focus:outline-none focus:border-[#00BFA6] focus:ring-1 focus:ring-[#00BFA6]"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} (₹{p.displayAmount} / {p.durationDays} Days)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F2D3D] dark:text-white mb-1.5">
                  Razorpay Payment ID <span className="text-[#00BFA6]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. pay_TcjdN910fPLa01"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#F6FAFC] dark:bg-[#0A1A27] border border-[#D8E4EA] dark:border-[#1F2D3D] rounded-xl text-[#1F2D3D] dark:text-white placeholder:text-[#8CA6B7] focus:outline-none focus:border-[#00BFA6] focus:ring-1 focus:ring-[#00BFA6] font-mono"
                />
                <p className="text-[11px] text-[#6B8699] dark:text-[#8CA6B7] mt-1">
                  Found in your payment SMS, email receipt, or UPI app transaction details.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button variant="outline" size="sm" onClick={onClose} type="button">
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                isLoading={loading}
                disabled={loading || !paymentRef.trim()}
              >
                Verify & Activate
              </Button>
            </div>
          </form>
        )}

        {/* Auto Reconcile Tab */}
        {activeTab === 'auto' && (
          <div className="space-y-4">
            <p className="text-xs text-[#1F2D3D] dark:text-[#BACDD8] leading-relaxed">
              If money was deducted from your bank account or UPI during checkout but your subscription did not immediately activate due to an interrupted connection, our automated reconciliation service can check the gateway.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button variant="outline" size="sm" onClick={onClose} type="button">
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="button"
                onClick={handleAutoReconcile}
                isLoading={loading}
                leftIcon={<RotateCw className="w-4 h-4" />}
              >
                Scan & Reconcile
              </Button>
            </div>
          </div>
        )}

        {/* Result Message */}
        {resultMessage && (
          <div
            className={`p-4 rounded-2xl border text-xs flex items-start gap-3 animate-in fade-in duration-200 ${
              isSuccess
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200'
            }`}
          >
            {isSuccess ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <span className="font-bold block">{isSuccess ? 'Payment Verified!' : 'Notice'}</span>
              <span className="leading-relaxed">{resultMessage}</span>
            </div>
          </div>
        )}
      </div>
    </ModalPortal>
  );
};
