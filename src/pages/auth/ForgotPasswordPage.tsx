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
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          Reset Password
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
          Enter your registered email and we'll send you a password reset link
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-950/80 border-2 border-rose-500/60 rounded-2xl text-xs text-rose-200 space-y-2 shadow-xl shadow-rose-950/40 animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
            <div className="flex-1">
              <p className="font-bold text-sm text-rose-100 leading-snug">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success ? (
        <div className="p-6 bg-slate-900/90 border border-brand-500/30 rounded-2xl text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-12 h-12 rounded-full bg-[#16B8A6]/20 border border-[#16B8A6]/40 text-[#16B8A6] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Reset Link Sent</h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              We have dispatched a password reset link to <strong className="text-brand-300">{email}</strong>. Please check your inbox and spam folder.
            </p>
          </div>
          <NavLink
            to={ROUTES.LOGIN}
            className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-brand-600 hover:bg-brand-500 text-white transition shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Sign In</span>
          </NavLink>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="candidate@example.com"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-900/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 font-medium transition duration-150"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white shadow-md shadow-brand-500/20 hover:shadow-lg hover:shadow-brand-500/30 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Sending link...' : 'Send Reset Link'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      )}

      <div className="text-center pt-3 border-t border-slate-800/80">
        <NavLink
          to={ROUTES.LOGIN}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Sign In</span>
        </NavLink>
      </div>
    </div>
  );
};
