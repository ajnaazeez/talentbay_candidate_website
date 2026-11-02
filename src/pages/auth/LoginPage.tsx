import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Phone, ArrowRight, AlertCircle, KeyRound, RotateCcw, Eye, EyeOff } from 'lucide-react';
import type { ConfirmationResult, RecaptchaVerifier } from 'firebase/auth';
import { ROUTES } from '@/utils/constants';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/services/authService';
import { getFriendlyErrorMessage } from '@/utils/errors';
import { normalizePhoneNumber } from '@/utils/phone';
import { isValidEmail, isValidPhone } from '@/utils/validators';

type LoginMethod = 'email' | 'phone';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signInWithEmail } = useAuth();
  const rawFrom = (location.state as { from?: { pathname?: string } })?.from?.pathname;
  const from =
    rawFrom &&
    rawFrom !== ROUTES.LOGIN &&
    rawFrom !== ROUTES.REGISTER &&
    rawFrom !== ROUTES.FORGOT_PASSWORD
      ? rawFrom
      : ROUTES.DASHBOARD;

  const [loginMethod, setLoginMethod] = useState<LoginMethod>('email');

  // Email state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Phone state
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  // Timer for resending OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Clean up reCAPTCHA on unmount
  useEffect(() => {
    return () => {
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
          recaptchaVerifierRef.current = null;
        } catch {
          // ignore cleanup error
        }
      }
    };
  }, []);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    try {
      setError(null);
      setLoading(true);
      await signInWithEmail(cleanEmail, password);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      console.error('Email Login error:', err);
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullPhoneNumber = normalizePhoneNumber(phoneNumber.trim(), countryCode);
    if (!fullPhoneNumber || !isValidPhone(fullPhoneNumber)) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    try {
      setError(null);
      setLoading(true);

      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch {
          // ignore
        }
        recaptchaVerifierRef.current = null;
      }

      recaptchaVerifierRef.current = authService.setUpRecaptcha('recaptcha-candidate-container');

      const confirmation = await authService.sendPhoneOtp(
        fullPhoneNumber,
        recaptchaVerifierRef.current
      );

      setConfirmationResult(confirmation);
      setCodeSent(true);
      setCountdown(60);
    } catch (err: unknown) {
      console.error('Send Phone OTP error:', err);
      setError(getFriendlyErrorMessage(err));
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
          recaptchaVerifierRef.current = null;
        } catch {
          // ignore
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) {
      setError('Session expired. Please request a new OTP.');
      return;
    }

    if (otp.trim().length !== 6) {
      setError('Please enter the 6-digit code received via SMS.');
      return;
    }

    try {
      setError(null);
      setLoading(true);
      await authService.verifyPhoneOtp(confirmationResult, otp.trim());
      navigate(from, { replace: true });
    } catch (err: unknown) {
      console.error('Verify Phone OTP error:', err);
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          Candidate Sign In
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
          Access your career workspace, jobs, and assessments
        </p>
      </div>

      {/* Login Method Toggle */}
      <div className="grid grid-cols-2 p-1.5 bg-slate-900/90 rounded-2xl border border-slate-800/80 gap-1.5">
        <button
          type="button"
          onClick={() => {
            setLoginMethod('email');
            setError(null);
          }}
          className={`flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition duration-150 ${
            loginMethod === 'email'
              ? 'bg-slate-800 text-brand-300 border border-brand-500/40 shadow-sm shadow-brand-500/10'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Mail className="w-3.5 h-3.5 text-current" />
          Email & Password
        </button>
        <button
          type="button"
          onClick={() => {
            setLoginMethod('phone');
            setError(null);
          }}
          className={`flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition duration-150 ${
            loginMethod === 'phone'
              ? 'bg-slate-800 text-brand-300 border border-brand-500/40 shadow-sm shadow-brand-500/10'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Phone className="w-3.5 h-3.5 text-current" />
          Mobile Number
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-950/80 border-2 border-rose-500/60 rounded-2xl text-xs text-rose-200 space-y-3 shadow-xl shadow-rose-950/40 animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
            <div className="flex-1">
              <p className="font-bold text-sm text-rose-100 leading-snug">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* 1. Email Login Form */}
      {loginMethod === 'email' && (
        <form onSubmit={handleEmailLogin} className="space-y-4">
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

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">Password</label>
              <NavLink
                to={ROUTES.FORGOT_PASSWORD}
                className="text-xs text-brand-400 hover:text-brand-300 hover:underline font-medium transition"
              >
                Forgot password?
              </NavLink>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-900/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 font-medium transition duration-150"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:from-brand-500 hover:via-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Signing in...' : 'Sign In with Email'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      )}

      {/* 2. Phone Login Form */}
      {loginMethod === 'phone' && (
        <div>
          {!codeSent ? (
            <form onSubmit={handleSendPhoneOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Mobile Number
                </label>
                <div className="flex gap-2">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-24 px-2.5 py-2.5 text-xs font-bold bg-slate-900/80 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  >
                    <option value="+91" className="bg-slate-900 text-white">🇮🇳 +91</option>
                    <option value="+1" className="bg-slate-900 text-white">🇺🇸 +1</option>
                    <option value="+44" className="bg-slate-900 text-white">🇬🇧 +44</option>
                    <option value="+65" className="bg-slate-900 text-white">🇸🇬 +65</option>
                    <option value="+971" className="bg-slate-900 text-white">🇦🇪 +971</option>
                  </select>
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="9876543210"
                      maxLength={15}
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-900/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 font-medium transition duration-150"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  We will send a 6-digit SMS verification code to this phone number
                </p>
              </div>

              {/* Invisible Recaptcha Container */}
              <div id="recaptcha-candidate-container"></div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:from-brand-500 hover:via-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
              >
                <span>{loading ? 'Sending Code...' : 'Send Verification OTP'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyPhoneOtp} className="space-y-4">
              <div className="p-3.5 bg-brand-950/40 border border-brand-800/60 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-brand-200">
                    Code sent to {countryCode} {phoneNumber}
                  </p>
                  <p className="text-[11px] text-brand-400/80">Enter the 6-digit code received</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCodeSent(false);
                    setOtp('');
                    setError(null);
                  }}
                  className="text-xs font-bold text-brand-300 hover:text-brand-100 flex items-center gap-1 underline transition duration-150"
                >
                  <RotateCcw className="w-3 h-3" />
                  Change
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  6-Digit SMS Code
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    maxLength={6}
                    autoFocus
                    className="w-full pl-10 pr-3.5 py-2.5 text-base font-bold tracking-widest bg-slate-900/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-center"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:from-brand-500 hover:via-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
              >
                <span>{loading ? 'Verifying...' : 'Verify & Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-2">
                {countdown > 0 ? (
                  <p className="text-xs text-slate-400">
                    Resend code in <span className="font-bold text-brand-300">{countdown}s</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendPhoneOtp}
                    className="text-xs font-semibold text-brand-400 hover:text-brand-300 underline"
                  >
                    Resend SMS Code
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      )}

      <div className="text-center pt-3 border-t border-slate-800/80">
        <p className="text-xs text-slate-400">
          New to TalentBay?{' '}
          <NavLink
            to={ROUTES.REGISTER}
            className="font-bold text-brand-400 hover:text-brand-300 hover:underline transition duration-150"
          >
            Create a candidate account
          </NavLink>
        </p>
      </div>
    </div>
  );
};
