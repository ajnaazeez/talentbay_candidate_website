import React, { useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import {
  Sun,
  Moon,
  Laptop,
  CreditCard,
  HelpCircle,
  Info,
  LogOut,
  AlertTriangle,
  ChevronRight,
  CheckCircle2,
  Trash2,
  Phone,
  Mail,
  Shield,
  ExternalLink,
  Sparkles,
  Lock,
  RefreshCw,
  Loader2,
  X,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/store/ThemeContext';
import { authService } from '@/services/authService';
import { PaymentRecoveryModal } from '@/components/subscription/PaymentRecoveryModal';
import { ROUTES, APP_CONFIG } from '@/utils/constants';
import { getFriendlyErrorMessage } from '@/utils/errors';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, candidate, signOut, deleteAccount, refreshProfile, sendPasswordReset } = useAuth();
  const { themeMode, setThemeMode } = useTheme();

  // Modals
  const [showPaymentRecovery, setShowPaymentRecovery] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Phone linking modal
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneCountryCode, setPhoneCountryCode] = useState('+91');
  const [phoneInput, setPhoneInput] = useState('');
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // General feedback message
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [resetSending, setResetSending] = useState(false);

  const showToast = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  // 1. Password Reset Handler
  const handlePasswordReset = async () => {
    if (!user?.email) return;
    try {
      setResetSending(true);
      await sendPasswordReset(user.email);
      showToast(`Password reset link sent to ${user.email}. Check your inbox.`);
    } catch (err) {
      showToast(getFriendlyErrorMessage(err));
    } finally {
      setResetSending(false);
    }
  };

  // 2. Phone Linking Handler
  const handleSyncPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDigits = phoneInput.replace(/\D/g, '');
    if (cleanDigits.length < 10) {
      setPhoneError('Please enter a valid 10-digit mobile number.');
      return;
    }

    try {
      setPhoneLoading(true);
      setPhoneError(null);
      const fullPhone = `${phoneCountryCode}${cleanDigits.slice(-10)}`;
      await authService.syncVerifiedPhone(fullPhone);
      await refreshProfile();
      setShowPhoneModal(false);
      setPhoneInput('');
      showToast('Verified mobile number updated successfully.');
    } catch (err: unknown) {
      console.error('[Settings] Error syncing phone:', err);
      setPhoneError(getFriendlyErrorMessage(err));
    } finally {
      setPhoneLoading(false);
    }
  };

  // 3. Logout Handler
  const handleSignOut = async () => {
    await signOut();
    navigate(ROUTES.LOGIN, { replace: true });
  };

  // 4. Delete Account Handler (Cloud Function Only)
  const handleDeleteAccount = async () => {
    if (deleteConfirmText.trim().toUpperCase() !== 'DELETE') return;
    try {
      setIsDeleting(true);
      setDeleteError(null);
      await deleteAccount();
      navigate(ROUTES.LOGIN, { replace: true });
    } catch (err: unknown) {
      console.error('[Settings] Error deleting account:', err);
      setDeleteError(getFriendlyErrorMessage(err));
      setIsDeleting(false);
    }
  };

  // Subscription calculation
  const isTrialActive = Boolean(
    candidate?.isPremium &&
      (candidate?.subscriptionStatus === 'trial' ||
        (candidate?.trialExpiryDate && new Date(candidate.trialExpiryDate).getTime() > Date.now()))
  );
  const isPremiumActive = Boolean(candidate?.isPremium && !isTrialActive);
  const expiryDate = candidate?.subscriptionExpiryDate
    ? new Date(candidate.subscriptionExpiryDate).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : candidate?.trialExpiryDate
    ? new Date(candidate.trialExpiryDate).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Top Banner */}
      <div className="bg-white dark:bg-[#111827] rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-xs">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          Settings & Preferences
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Configure appearance, manage membership & trial access, update contact details, or manage your account session.
        </p>
      </div>

      {feedbackMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Section 1: Membership & Subscription */}
      <div className="bg-white dark:bg-[#111827] rounded-3xl p-6 sm:p-7 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-brand-500" />
            <span>Membership & Plan</span>
          </h2>
          {isTrialActive ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200/60 dark:border-brand-800 text-xs font-bold text-brand-700 dark:text-brand-300">
              <Sparkles className="w-3.5 h-3.5 text-brand-500" />
              7-Day Free Trial Active
            </span>
          ) : isPremiumActive ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-700 dark:text-emerald-300">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              Premium Plan Active
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-[#1f293d] text-xs font-bold text-slate-600 dark:text-slate-300">
              Free Tier
            </span>
          )}
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 dark:bg-[#0b0f19]/60 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Current Status</p>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {isTrialActive
                ? '7-Day Free Trial with Full Platform Access'
                : isPremiumActive
                ? 'Unlimited Premium Access'
                : candidate?.hasUsedTrial
                ? 'Free Trial Expired'
                : 'Free Account (Trial Available)'}
            </p>
            {expiryDate && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isTrialActive ? 'Trial Ends: ' : 'Active Until: '}
                <span className="font-semibold text-slate-700 dark:text-slate-200">{expiryDate}</span>
              </p>
            )}
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <NavLink
              to={ROUTES.SUBSCRIPTION}
              className="px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition shadow-xs inline-flex items-center gap-1.5"
            >
              <span>{isPremiumActive ? 'Change Plan' : 'View Plans & Upgrade'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </NavLink>
            <button
              type="button"
              onClick={() => setShowPaymentRecovery(true)}
              className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-[#1f293d] border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-[#253248] rounded-xl transition inline-flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
              <span>Recover Payment</span>
            </button>
          </div>
        </div>
      </div>

      {/* Section 2: Appearance & Theme */}
      <div className="bg-white dark:bg-[#111827] rounded-3xl p-6 sm:p-7 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
        <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Appearance & Theme
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: 'light' as const, label: 'Light Theme', icon: Sun, desc: 'Clean high-contrast theme' },
            { id: 'dark' as const, label: 'Dark Theme', icon: Moon, desc: 'Sleek dark interface' },
            { id: 'system' as const, label: 'System Default', icon: Laptop, desc: 'Follow OS preference' },
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = themeMode === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setThemeMode(item.id)}
                className={`p-4 rounded-2xl border text-left transition flex items-start gap-3.5 ${
                  isSelected
                    ? 'bg-brand-50/50 dark:bg-brand-950/40 border-brand-500 ring-2 ring-brand-500/20 shadow-xs'
                    : 'bg-white dark:bg-[#1a2333] border-slate-200 dark:border-[#1f293d] hover:bg-slate-50 dark:hover:bg-[#253248]'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isSelected
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-100 dark:bg-[#1f293d] text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{item.label}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Section 3: Account Credentials & Phone Linking */}
      <div className="bg-white dark:bg-[#111827] rounded-3xl p-6 sm:p-7 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
        <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-500" />
          <span>Account & Security</span>
        </h2>

        <div className="space-y-3">
          {/* Email Row */}
          <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-[#0b0f19]/60 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Registered Email</p>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {user?.email || 'No email attached'}
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={resetSending || !user?.email}
              onClick={handlePasswordReset}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-[#1f293d] border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-[#253248] rounded-xl transition inline-flex items-center gap-1.5 self-start sm:self-auto"
            >
              {resetSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5 text-slate-400" />}
              <span>Reset Password</span>
            </button>
          </div>

          {/* Phone Number Row */}
          <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-[#0b0f19]/60 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Verified Mobile Number</p>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {candidate?.phoneNumber || 'No mobile linked'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setPhoneError(null);
                setPhoneInput(candidate?.phoneNumber?.slice(-10) || '');
                setShowPhoneModal(true);
              }}
              className="px-3.5 py-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/50 hover:bg-brand-100 dark:hover:bg-brand-950 border border-brand-200 dark:border-brand-800 rounded-xl transition inline-flex items-center gap-1.5 self-start sm:self-auto"
            >
              <span>{candidate?.phoneNumber ? 'Update Mobile' : 'Link Mobile'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Section 4: Help, About & Legal Links */}
      <div className="bg-white dark:bg-[#111827] rounded-3xl p-6 sm:p-7 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
        <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Information & Support
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <NavLink
            to={ROUTES.ABOUT}
            className="p-4 rounded-2xl bg-slate-50/70 dark:bg-[#0b0f19]/60 hover:bg-slate-100 dark:hover:bg-[#1a2333] border border-slate-200/80 dark:border-slate-800 transition flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Info className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">About TalentBay</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Version {APP_CONFIG.version} & company details</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition" />
          </NavLink>

          <NavLink
            to={ROUTES.SUPPORT}
            className="p-4 rounded-2xl bg-slate-50/70 dark:bg-[#0b0f19]/60 hover:bg-slate-100 dark:hover:bg-[#1a2333] border border-slate-200/80 dark:border-slate-800 transition flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Help & Support</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">FAQs and support inquiries</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition" />
          </NavLink>

          <NavLink
            to={ROUTES.TERMS}
            className="p-4 rounded-2xl bg-slate-50/70 dark:bg-[#0b0f19]/60 hover:bg-slate-100 dark:hover:bg-[#1a2333] border border-slate-200/80 dark:border-slate-800 transition flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-[#1f293d] text-slate-600 dark:text-slate-300 flex items-center justify-center">
                <ExternalLink className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Terms of Service</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Usage terms & policies</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition" />
          </NavLink>

          <NavLink
            to={ROUTES.PRIVACY}
            className="p-4 rounded-2xl bg-slate-50/70 dark:bg-[#0b0f19]/60 hover:bg-slate-100 dark:hover:bg-[#1a2333] border border-slate-200/80 dark:border-slate-800 transition flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-[#1f293d] text-slate-600 dark:text-slate-300 flex items-center justify-center">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Privacy Policy</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Candidate data protection</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition" />
          </NavLink>
        </div>
      </div>

      {/* Section 5: Session Logout */}
      <div className="bg-white dark:bg-[#111827] rounded-3xl p-6 sm:p-7 border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Account Session</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Safely terminate your authenticated candidate session on this device.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowLogoutModal(true)}
          className="px-4 py-2.5 text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-950/70 border border-amber-200 dark:border-amber-800 rounded-xl transition inline-flex items-center gap-1.5"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Section 6: Danger Zone (Cloud Function Account Deletion) */}
      <div className="bg-white dark:bg-[#111827] rounded-3xl p-6 sm:p-7 border border-red-200 dark:border-red-950 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <h2 className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
            Danger Zone
          </h2>
        </div>

        <div className="p-5 rounded-2xl bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Permanently Delete Candidate Account
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Deleting your account will trigger our secure backend Cloud Function to permanently purge your candidate profile, resume data, all job applications, messages, and login authentication. This action cannot be reversed.
          </p>
          <button
            type="button"
            onClick={() => {
              setDeleteConfirmText('');
              setDeleteError(null);
              setShowDeleteModal(true);
            }}
            className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-xl transition inline-flex items-center gap-1.5 shadow-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Account</span>
          </button>
        </div>
      </div>

      {/* Payment Recovery Modal */}
      <PaymentRecoveryModal
        isOpen={showPaymentRecovery}
        onClose={() => setShowPaymentRecovery(false)}
        onSuccess={() => {
          showToast('Payment recovered successfully! Membership refreshed.');
          refreshProfile();
        }}
      />

      {/* Link / Update Phone Modal */}
      {showPhoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#111827] rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Phone className="w-4 h-4 text-brand-500" />
                <span>Link Verified Mobile Number</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowPhoneModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enter your active mobile number. It will be verified against TalentBay accounts and synced to your profile.
            </p>

            {phoneError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-medium">
                {phoneError}
              </div>
            )}

            <form onSubmit={handleSyncPhone} className="space-y-4">
              <div className="flex gap-2">
                <select
                  value={phoneCountryCode}
                  onChange={(e) => setPhoneCountryCode(e.target.value)}
                  className="w-24 px-2 py-2.5 text-xs font-bold bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="+91">🇮🇳 +91</option>
                  <option value="+1">🇺🇸 +1</option>
                  <option value="+44">🇬🇧 +44</option>
                  <option value="+65">🇸🇬 +65</option>
                  <option value="+971">🇦🇪 +971</option>
                </select>
                <input
                  type="tel"
                  required
                  placeholder="9876543210"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  maxLength={15}
                  className="flex-1 px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPhoneModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1f293d] rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={phoneLoading}
                  className="px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 rounded-xl transition flex items-center gap-1.5"
                >
                  {phoneLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Mobile</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#111827] rounded-3xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <LogOut className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Sign Out</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Are you sure you want to sign out of your TalentBay candidate account?
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-[#1f293d] hover:bg-slate-200 dark:hover:bg-[#253248] rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Deletion Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#111827] rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-red-600 dark:text-red-400">
                  Delete Account Permanently
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  This action is irreversible and purges all data.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-red-50/70 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-xs text-slate-700 dark:text-slate-300 space-y-2">
              <p className="font-bold text-red-700 dark:text-red-300">
                The following records will be permanently erased:
              </p>
              <ul className="list-disc pl-4 space-y-0.5 text-slate-600 dark:text-slate-300 text-[11px]">
                <li>Candidate profile and career history</li>
                <li>All active and archived job applications</li>
                <li>Real-time chat messages and attachments</li>
                <li>AI generated resumes and assessment badges</li>
              </ul>
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 text-xs font-semibold">
                {deleteError}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Type <span className="font-mono font-bold text-red-600">DELETE</span> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1f293d] rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteConfirmText.trim().toUpperCase() !== 'DELETE' || isDeleting}
                onClick={handleDeleteAccount}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 rounded-xl transition flex items-center gap-1.5"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Permanently Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;

