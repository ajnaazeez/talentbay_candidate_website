import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Mail,
  Lock,
  User,
  Phone,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import { ROUTES } from '@/utils/constants';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/services/authService';
import { getFriendlyErrorMessage } from '@/utils/errors';
import { normalizePhoneNumber } from '@/utils/phone';
import { isValidEmail, isValidPhone } from '@/utils/validators';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { signUpWithEmail } = useAuth();

  // Registration Form Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Email OTP verification state (optional security step)
  const [showEmailOtp, setShowEmailOtp] = useState(false);
  const [emailOtp, setEmailOtp] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendEmailOtp = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      setError('Please enter a valid email address first.');
      return;
    }

    try {
      setError(null);
      setOtpSending(true);
      await authService.sendEmailOtp(cleanEmail);
      setShowEmailOtp(true);
    } catch (err) {
      console.error('Send Email OTP error:', err);
      setError(getFriendlyErrorMessage(err));
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!emailOtp.trim() || emailOtp.trim().length !== 6) {
      setError('Please enter the 6-digit email OTP.');
      return;
    }

    try {
      setError(null);
      setOtpVerifying(true);
      const ok = await authService.verifyEmailOtp(cleanEmail, emailOtp.trim());
      if (ok) {
        setIsEmailVerified(true);
        setShowEmailOtp(false);
      } else {
        setError('Invalid OTP code. Please check your email.');
      }
    } catch (err) {
      console.error('Verify Email OTP error:', err);
      setError(getFriendlyErrorMessage(err));
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanFirstName = firstName.trim();
    const cleanLastName = lastName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phoneNumber.trim();

    if (!cleanFirstName || !cleanLastName || !cleanEmail || !password.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    let fullPhoneNumber: string | undefined = undefined;
    if (cleanPhone) {
      fullPhoneNumber = normalizePhoneNumber(cleanPhone, countryCode);
      if (!isValidPhone(fullPhoneNumber)) {
        setError('Please enter a valid 10-digit mobile number.');
        return;
      }
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!agreeTerms) {
      setError('Please agree to the Terms of Service & Privacy Policy.');
      return;
    }

    try {
      setError(null);
      setLoading(true);

      await signUpWithEmail({
        firstName: cleanFirstName,
        lastName: cleanLastName,
        email: cleanEmail,
        phoneNumber: fullPhoneNumber,
        password,
      });

      navigate(ROUTES.DASHBOARD, { replace: true });
    } catch (err: unknown) {
      console.error('Candidate Registration error:', err);
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center sm:text-left">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0E2233] dark:text-white">
          Create Candidate Account
        </h2>
        <p className="text-xs sm:text-sm text-[#6B8699] dark:text-[#8CA6B7] mt-1.5">
          Join TalentBay to discover top jobs, test skills, and build ATS resumes
        </p>

        {/* 7-Day Free Trial Callout Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-3 rounded-full bg-[#00BFA6]/10 border border-[#00BFA6]/30 text-[#008C79] dark:text-[#00BFA6] text-xs font-bold shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-[#00BFA6]" />
          <span>7-Day Free Trial included on signup</span>
        </div>
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

      <form onSubmit={handleRegister} className="space-y-4">
        {/* Name Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1F2D3D] dark:text-[#BACDD8] mb-1.5">
              First Name <span className="text-[#00BFA6]">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8CA6B7]">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-[#F6FAFC] dark:bg-[#0A1A27] border border-[#D8E4EA] dark:border-[#1F2D3D] rounded-xl text-[#0E2233] dark:text-white placeholder-[#8CA6B7] focus:outline-none focus:border-[#00BFA6] focus:ring-2 focus:ring-[#00BFA6]/20 focus:bg-white dark:focus:bg-[#0E2233] font-medium transition duration-150"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1F2D3D] dark:text-[#BACDD8] mb-1.5">
              Last Name <span className="text-[#00BFA6]">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8CA6B7]">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-[#F6FAFC] dark:bg-[#0A1A27] border border-[#D8E4EA] dark:border-[#1F2D3D] rounded-xl text-[#0E2233] dark:text-white placeholder-[#8CA6B7] focus:outline-none focus:border-[#00BFA6] focus:ring-2 focus:ring-[#00BFA6]/20 focus:bg-white dark:focus:bg-[#0E2233] font-medium transition duration-150"
              />
            </div>
          </div>
        </div>

        {/* Email Field with optional OTP verification */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#1F2D3D] dark:text-[#BACDD8]">
              Email Address <span className="text-[#00BFA6]">*</span>
            </label>
            {isEmailVerified ? (
              <span className="text-[11px] font-bold text-[#00BFA6] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Verified
              </span>
            ) : (
              <button
                type="button"
                onClick={handleSendEmailOtp}
                disabled={otpSending || !email}
                className="text-[11px] font-bold text-[#00BFA6] hover:text-[#00A892] hover:underline disabled:opacity-50 cursor-pointer"
              >
                {otpSending ? 'Sending code...' : 'Verify with code (optional)'}
              </button>
            )}
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8CA6B7]">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setIsEmailVerified(false);
              }}
              placeholder="candidate@example.com"
              className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-[#F6FAFC] dark:bg-[#0A1A27] border border-[#D8E4EA] dark:border-[#1F2D3D] rounded-xl text-[#0E2233] dark:text-white placeholder-[#8CA6B7] focus:outline-none focus:border-[#00BFA6] focus:ring-2 focus:ring-[#00BFA6]/20 focus:bg-white dark:focus:bg-[#0E2233] font-medium transition duration-150"
            />
          </div>

          {/* Inline Email OTP Box if requested */}
          {showEmailOtp && !isEmailVerified && (
            <div className="mt-2.5 p-3.5 rounded-xl bg-[#E8F1F5] dark:bg-[#0A1A27] border border-[#D8E4EA] dark:border-[#1F2D3D] space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#1F2D3D] dark:text-[#BACDD8] font-medium">Enter 6-digit code sent to email:</span>
                <button
                  type="button"
                  onClick={handleSendEmailOtp}
                  disabled={otpSending}
                  className="text-[#00BFA6] hover:text-[#00A892] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" /> Resend
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={emailOtp}
                  onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  className="flex-1 px-3 py-2 text-sm font-bold bg-white dark:bg-[#0E2233] border border-[#D8E4EA] dark:border-[#1F2D3D] rounded-lg text-[#0E2233] dark:text-white text-center tracking-widest focus:border-[#00BFA6] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleVerifyEmailOtp}
                  disabled={otpVerifying || emailOtp.length !== 6}
                  className="px-4 py-2 bg-[#0E2233] hover:bg-[#163248] border border-[#00BFA6]/40 text-white rounded-lg text-xs font-bold disabled:opacity-50 transition cursor-pointer"
                >
                  {otpVerifying ? 'Checking...' : 'Verify'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Number Field */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#1F2D3D] dark:text-[#BACDD8] mb-1.5">
            Mobile Number (Optional)
          </label>
          <div className="flex gap-2">
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="w-24 px-2.5 py-2.5 text-xs font-bold bg-[#F6FAFC] dark:bg-[#0A1A27] border border-[#D8E4EA] dark:border-[#1F2D3D] rounded-xl text-[#0E2233] dark:text-white focus:outline-none focus:border-[#00BFA6] focus:ring-2 focus:ring-[#00BFA6]/20 cursor-pointer"
            >
              <option value="+91">🇮🇳 +91</option>
              <option value="+1">🇺🇸 +1</option>
              <option value="+44">🇬🇧 +44</option>
              <option value="+65">🇸🇬 +65</option>
              <option value="+971">🇦🇪 +971</option>
            </select>
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8CA6B7]">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="9876543210"
                maxLength={15}
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-[#F6FAFC] dark:bg-[#0A1A27] border border-[#D8E4EA] dark:border-[#1F2D3D] rounded-xl text-[#0E2233] dark:text-white placeholder-[#8CA6B7] focus:outline-none focus:border-[#00BFA6] focus:ring-2 focus:ring-[#00BFA6]/20 focus:bg-white dark:focus:bg-[#0E2233] font-medium transition duration-150"
              />
            </div>
          </div>
        </div>

        {/* Password Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1F2D3D] dark:text-[#BACDD8] mb-1.5">
              Password <span className="text-[#00BFA6]">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8CA6B7]">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full pl-10 pr-10 py-2.5 text-sm bg-[#F6FAFC] dark:bg-[#0A1A27] border border-[#D8E4EA] dark:border-[#1F2D3D] rounded-xl text-[#0E2233] dark:text-white placeholder-[#8CA6B7] focus:outline-none focus:border-[#00BFA6] focus:ring-2 focus:ring-[#00BFA6]/20 focus:bg-white dark:focus:bg-[#0E2233] font-medium transition duration-150"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#8CA6B7] hover:text-[#0E2233] dark:hover:text-white transition cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1F2D3D] dark:text-[#BACDD8] mb-1.5">
              Confirm Password <span className="text-[#00BFA6]">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8CA6B7]">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-[#F6FAFC] dark:bg-[#0A1A27] border border-[#D8E4EA] dark:border-[#1F2D3D] rounded-xl text-[#0E2233] dark:text-white placeholder-[#8CA6B7] focus:outline-none focus:border-[#00BFA6] focus:ring-2 focus:ring-[#00BFA6]/20 focus:bg-white dark:focus:bg-[#0E2233] font-medium transition duration-150"
              />
            </div>
          </div>
        </div>

        {/* Terms Agreement Checkbox */}
        <div className="flex items-start gap-2.5 pt-1">
          <input
            type="checkbox"
            id="terms"
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
            className="w-4 h-4 mt-0.5 rounded text-[#0E2233] bg-[#F6FAFC] border-[#D8E4EA] focus:ring-[#00BFA6]/20 cursor-pointer"
          />
          <label htmlFor="terms" className="text-xs text-[#6B8699] dark:text-[#8CA6B7] leading-normal select-none cursor-pointer">
            I agree to TalentBay's{' '}
            <NavLink to={ROUTES.TERMS} target="_blank" className="text-[#00BFA6] hover:underline font-semibold">
              Terms & Conditions
            </NavLink>{' '}
            and{' '}
            <NavLink to={ROUTES.PRIVACY} target="_blank" className="text-[#00BFA6] hover:underline font-semibold">
              Privacy Policy
            </NavLink>.
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-[#0E2233] text-white hover:bg-[#163248] border border-[#00BFA6]/40 hover:border-[#00BFA6] shadow-xs hover:shadow-md active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 mt-4 cursor-pointer"
        >
          <span>{loading ? 'Creating Account...' : 'Create Candidate Account'}</span>
          <ArrowRight className="w-4 h-4 text-[#00BFA6]" />
        </button>
      </form>

      <div className="text-center pt-4 border-t border-[#D8E4EA] dark:border-[#1F2D3D]">
        <p className="text-xs text-[#6B8699] dark:text-[#8CA6B7]">
          Already have an account?{' '}
          <NavLink
            to={ROUTES.LOGIN}
            className="font-bold text-[#00BFA6] hover:text-[#00A892] hover:underline transition duration-150"
          >
            Sign in
          </NavLink>
        </p>
      </div>
    </div>
  );
};
