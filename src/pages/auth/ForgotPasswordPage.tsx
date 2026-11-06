import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Mail, ArrowRight, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { ROUTES } from '@/utils/constants';
import { useAuth } from '@/hooks/useAuth';
import { getFriendlyErrorMessage } from '@/utils/errors';
import { isValidEmail } from '@/utils/validators';

export const ForgotPasswordPage: React.FC = () => {
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    try {
      setError(null);
      setLoading(true);
      await sendPasswordReset(cleanEmail);
      setSuccess(true);
    } catch (err) {
      console.error('Password reset error:', err);
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center sm:text-left">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0E2233] dark:text-white">
          Reset Password
        </h2>
        <p className="text-xs sm:text-sm text-[#6B8699] dark:text-[#8CA6B7] mt-1.5">
          Enter your registered email and we'll send you a password reset link
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-2xl text-xs text-rose-800 dark:text-rose-200 space-y-1 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
            <div className="flex-1">
              <p className="font-semibold text-xs leading-snug">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success ? (
        <div className="p-6 bg-[#E8F1F5] dark:bg-[#0A1A27] border border-[#D8E4EA] dark:border-[#1F2D3D] rounded-2xl text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-12 h-12 rounded-full bg-[#00BFA6]/20 border border-[#00BFA6]/40 text-[#00BFA6] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#0E2233] dark:text-white">Reset Link Sent</h3>
            <p className="text-xs text-[#6B8699] dark:text-[#8CA6B7] mt-1 leading-relaxed">
              We have dispatched a password reset link to <strong className="text-[#0E2233] dark:text-white">{email}</strong>. Please check your inbox and spam folder.
            </p>
          </div>
          <NavLink
            to={ROUTES.LOGIN}
            className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-[#0E2233] text-white hover:bg-[#163248] border border-[#00BFA6]/40 hover:border-[#00BFA6] transition shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#00BFA6]" />
            <span>Return to Sign In</span>
          </NavLink>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1F2D3D] dark:text-[#BACDD8] mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8CA6B7]">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="candidate@example.com"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-[#F6FAFC] dark:bg-[#0A1A27] border border-[#D8E4EA] dark:border-[#1F2D3D] rounded-xl text-[#0E2233] dark:text-white placeholder-[#8CA6B7] focus:outline-none focus:border-[#00BFA6] focus:ring-2 focus:ring-[#00BFA6]/20 focus:bg-white dark:focus:bg-[#0E2233] font-medium transition duration-150"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-[#0E2233] text-white hover:bg-[#163248] border border-[#00BFA6]/40 hover:border-[#00BFA6] shadow-xs hover:shadow-md active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{loading ? 'Sending link...' : 'Send Reset Link'}</span>
            <ArrowRight className="w-4 h-4 text-[#00BFA6]" />
          </button>
        </form>
      )}

      <div className="text-center pt-4 border-t border-[#D8E4EA] dark:border-[#1F2D3D]">
        <NavLink
          to={ROUTES.LOGIN}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00BFA6] hover:text-[#00A892] hover:underline transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Sign In</span>
        </NavLink>
      </div>
    </div>
  );
};
