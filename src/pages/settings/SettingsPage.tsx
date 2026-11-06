import React, { useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import {
  Sun,
  Moon,
  Laptop,
  CreditCard,
  LogOut,
  ChevronRight,
  CheckCircle2,
  Trash2,
  Phone,
  Mail,
  Shield,
  ExternalLink,
  Lock,
  RefreshCw,
  Loader2,
  X,
  XCircle,
  Info,
  Globe,
  Award,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/store/ThemeContext';
import { authService } from '@/services/authService';
import { candidateService } from '@/services/candidateService';
import { PaymentRecoveryModal } from '@/components/subscription/PaymentRecoveryModal';
import { ROUTES, APP_CONFIG } from '@/utils/constants';
import { getFriendlyErrorMessage } from '@/utils/errors';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, candidate, signOut, deleteAccount, refreshProfile, sendPasswordReset } = useAuth();
  const { themeMode, setThemeMode } = useTheme();

  // Modals state
  const [showPaymentRecovery, setShowPaymentRecovery] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showCancelSubModal, setShowCancelSubModal] = useState(false);
  const [cancellingSub, setCancellingSub] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Phone linking modal state
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

  // 4. Cancel Subscription Handler (Matching Flutter _showCancelSubscriptionDialog)
  const handleCancelSubscription = async () => {
    if (!candidate?.uid) return;
    try {
      setCancellingSub(true);
      await candidateService.updateCandidate(candidate.uid, {
        subscriptionStatus: 'cancelled',
      });
      setShowCancelSubModal(false);
      showToast('Subscription cancelled successfully. You will still have premium access until the current billing period ends.');
      await refreshProfile();
    } catch (err: unknown) {
      console.error('[Settings] Error cancelling subscription:', err);
      showToast('Error cancelling subscription. Please try again.');
    } finally {
      setCancellingSub(false);
    }
  };

  // 5. Delete Account Handler (Cloud Function Only)
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

  // Membership & Subscription dates calculation (matching Flutter SettingsScreen)
  const isPremium = Boolean(candidate?.isPremium);
  const isTrialActive = Boolean(
    candidate?.isPremium &&
      (candidate?.subscriptionStatus === 'trial' ||
        (candidate?.trialExpiryDate && new Date(candidate.trialExpiryDate).getTime() > Date.now()))
  );
  const hasUsedTrial = Boolean(candidate?.hasUsedTrial);

  const rawExpiry = candidate?.subscriptionExpiryDate || candidate?.trialExpiryDate;
  const expiryDateObj = rawExpiry ? new Date(rawExpiry) : null;
  const isExpired = expiryDateObj ? Date.now() > expiryDateObj.getTime() : false;

  const formatDateDisplay = (date: Date) => {
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  // Approximation matching Flutter lines 120-123: 30 days before expiry if start not stored
  const startDateObj = expiryDateObj
    ? (candidate?.trialStartDate
        ? new Date(candidate.trialStartDate)
        : new Date(expiryDateObj.getTime() - 30 * 24 * 60 * 60 * 1000))
    : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24 animate-in fade-in duration-300">
      {/* Screen Title (Matching Flutter Slivertitle SETTINGS) */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-2xl font-black tracking-[0.2em] uppercase text-slate-900 dark:text-white">
          SETTINGS
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
          Manage your membership, display appearance, account credentials and support options.
        </p>
      </div>

      {feedbackMessage && (
        <div className="p-4 border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* =========================================================================
          SECTION 1: MEMBERSHIP (Matching Flutter SettingsScreen Membership Section)
          ========================================================================= */}
      <div className="space-y-2">
        <div className="px-1 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          MEMBERSHIP
        </div>

        <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
          {isPremium && !isExpired ? (
            <>
              {/* Premium Status Header */}
              <div className="p-5 bg-slate-50/50 dark:bg-slate-950/30">
                <div className="flex items-center gap-2.5">
                  <Award className="w-5 h-5 text-amber-500 fill-amber-500" />
                  <span className="font-black text-sm tracking-wide text-slate-900 dark:text-white uppercase">
                    PREMIUM MEMBER
                  </span>
                </div>

                {expiryDateObj && (
                  <div className="grid grid-cols-2 gap-4 mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-800">
                    <div>
                      <div className="text-[10px] font-bold tracking-wider uppercase text-slate-400">
                        START DATE
                      </div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                        {startDateObj ? formatDateDisplay(startDateObj) : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold tracking-wider uppercase text-slate-400">
                        {candidate?.subscriptionStatus === 'cancelled' ? 'EXPIRY DATE' : 'RENEWAL DATE'}
                      </div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                        {formatDateDisplay(expiryDateObj)}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* View Subscription Plans Tile */}
              <button
                type="button"
                onClick={() => navigate(ROUTES.SUBSCRIPTION)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition group cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <CreditCard className="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      View Subscription Plans
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {isTrialActive
                        ? 'Explore paid plans available after your 7-day trial'
                        : 'Explore available premium membership plans'}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition" />
              </button>

              {/* Cancel Subscription Tile (Only if not cancelled and active) */}
              {candidate?.subscriptionStatus !== 'cancelled' && (
                <button
                  type="button"
                  onClick={() => setShowCancelSubModal(true)}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-rose-50/40 dark:hover:bg-rose-950/20 transition group cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-rose-600 dark:text-rose-400">
                        Cancel Subscription
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Cancel your premium membership at any time
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-rose-500 transition" />
                </button>
              )}
            </>
          ) : (
            /* Free / Expired Membership Tile */
            <button
              type="button"
              onClick={() => navigate(ROUTES.SUBSCRIPTION)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition group cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <CreditCard className="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    {hasUsedTrial ? 'Upgrade to Premium' : 'View Subscription Plans'}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {hasUsedTrial
                      ? 'Your free trial has expired. Subscribe to keep full access'
                      : 'Explore premium plans and features'}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition" />
            </button>
          )}

          {/* Payment Recovery Web Option */}
          <button
            type="button"
            onClick={() => setShowPaymentRecovery(true)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <RefreshCw className="w-5 h-5 text-slate-500 shrink-0" />
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  Recover Payment
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Verify or reconcile an interrupted Razorpay checkout transaction
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition" />
          </button>
        </div>
      </div>

      {/* =========================================================================
          SECTION 2: APPEARANCE (Matching Flutter SettingsScreen Appearance Section)
          ========================================================================= */}
      <div className="space-y-2">
        <div className="px-1 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          APPEARANCE
        </div>

        <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
          {[
            { id: 'light' as const, label: 'Light Mode', icon: Sun },
            { id: 'dark' as const, label: 'Dark Mode', icon: Moon },
            { id: 'system' as const, label: 'System Default', icon: Laptop },
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = themeMode === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setThemeMode(item.id)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <Icon
                    className={`w-5 h-5 ${
                      isSelected
                        ? 'text-brand-600 dark:text-brand-400'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  />
                  <span
                    className={`text-xs ${
                      isSelected
                        ? 'font-bold text-slate-900 dark:text-white'
                        : 'font-medium text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
                {isSelected && (
                  <CheckCircle2 className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          SECTION 3: ACCOUNT (Matching Flutter SettingsScreen Account Section)
          ========================================================================= */}
      <div className="space-y-2">
        <div className="px-1 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          ACCOUNT
        </div>

        <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
          {/* Logout Tile */}
          <button
            type="button"
            onClick={() => setShowLogoutModal(true)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <LogOut className="w-5 h-5 text-amber-500 shrink-0" />
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  Logout
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Sign out of your account
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition" />
          </button>

          {/* Delete Account Tile */}
          <button
            type="button"
            onClick={() => {
              setDeleteConfirmText('');
              setDeleteError(null);
              setShowDeleteModal(true);
            }}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-rose-50/40 dark:hover:bg-rose-950/20 transition group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <Trash2 className="w-5 h-5 text-rose-500 shrink-0" />
              <div>
                <div className="text-xs font-bold text-rose-600 dark:text-rose-400">
                  Delete Account
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Permanently delete your account
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-rose-500 transition" />
          </button>

          {/* Registered Email Row */}
          <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <Mail className="w-5 h-5 text-slate-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  {user?.email || 'No email attached'}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Registered authentication email
                </div>
              </div>
            </div>
            <button
              type="button"
              disabled={resetSending || !user?.email}
              onClick={handlePasswordReset}
              className="px-3 py-1.5 text-xs font-bold text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/30 border border-brand-600 dark:border-brand-400 transition cursor-pointer self-start sm:self-auto inline-flex items-center gap-1.5"
            >
              {resetSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
              <span>Reset Password</span>
            </button>
          </div>

          {/* Verified Phone Row */}
          <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <Phone className="w-5 h-5 text-slate-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  {candidate?.phoneNumber || 'No mobile linked'}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Verified candidate contact number
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setPhoneError(null);
                setPhoneInput(candidate?.phoneNumber?.slice(-10) || '');
                setShowPhoneModal(true);
              }}
              className="px-3 py-1.5 text-xs font-bold text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/30 border border-brand-600 dark:border-brand-400 transition cursor-pointer self-start sm:self-auto"
            >
              {candidate?.phoneNumber ? 'Update Mobile' : 'Link Mobile'}
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 4: ABOUT (Matching Flutter SettingsScreen About Section)
          ========================================================================= */}
      <div className="space-y-2">
        <div className="px-1 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          ABOUT
        </div>

        <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
          {/* About Us Tile */}
          <NavLink
            to={ROUTES.ABOUT}
            className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <Info className="w-5 h-5 text-emerald-500 shrink-0" />
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  About Us
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Our story and mission
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition" />
          </NavLink>

          {/* App Name Info Tile */}
          <div className="p-4 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
              App Name
            </span>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              TalentBay Candidate
            </span>
          </div>

          {/* Version Info Tile */}
          <div className="p-4 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Version
            </span>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {APP_CONFIG.version} (1)
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 5: SUPPORT (Matching Flutter SettingsScreen Support Section)
          ========================================================================= */}
      <div className="space-y-2">
        <div className="px-1 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          SUPPORT
        </div>

        <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
          {/* Contact Support Tile */}
          <a
            href="mailto:info@waqtixllp.com?subject=Support%20Request"
            className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <Mail className="w-5 h-5 text-[#123C35] dark:text-[#C5A46D] shrink-0" />
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  Contact Support
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  info@waqtixllp.com
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition" />
          </a>

          {/* Visit Website Tile */}
          <a
            href="https://www.waqtixllp.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <Globe className="w-5 h-5 text-emerald-500 shrink-0" />
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  Visit Website
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  www.waqtixllp.com
                </div>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition" />
          </a>

          {/* Privacy Policy Tile */}
          <a
            href="https://www.waqtixllp.com/privacy-and-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <Shield className="w-5 h-5 text-brand-500 shrink-0" />
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  Privacy Policy
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Read our privacy policy
                </div>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition" />
          </a>
        </div>
      </div>

      {/* =========================================================================
          MODALS & DIALOGS (Exact Flutter Alert Dialogs)
          ========================================================================= */}

      {/* 1. LOGOUT DIALOG (Matching Flutter _showLogoutDialog) */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 w-full max-w-sm p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-black uppercase tracking-wider text-slate-900 dark:text-white">
              LOGOUT
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
              Are you sure you want to logout?
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition uppercase tracking-wider cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className="px-5 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 transition uppercase tracking-wider cursor-pointer"
              >
                LOGOUT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. CANCEL SUBSCRIPTION DIALOG (Matching Flutter _showCancelSubscriptionDialog) */}
      {showCancelSubModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 w-full max-w-md p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">
              CANCEL SUBSCRIPTION
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
              Are you sure you want to cancel your premium subscription? You will still be able to access premium features until your current billing period ends.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelSubModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition uppercase tracking-wider cursor-pointer"
              >
                GO BACK
              </button>
              <button
                type="button"
                disabled={cancellingSub}
                onClick={handleCancelSubscription}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition uppercase tracking-wider cursor-pointer disabled:opacity-50"
              >
                {cancellingSub ? 'CANCELLING...' : 'CONFIRM'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. DELETE ACCOUNT DIALOG (Matching Flutter _showDeleteAccountDialog) */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 w-full max-w-md p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">
              DELETE ACCOUNT
            </h3>
            <div className="space-y-3">
              <p className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-wide">
                This action cannot be undone!
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                Deleting your account will permanently remove:
              </p>
              <div className="space-y-1.5 pl-2">
                {[
                  'Your profile information',
                  'All job applications',
                  'Chat history',
                  'All saved preferences',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <X className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">
                  Type <span className="font-black text-rose-600">DELETE</span> to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white uppercase tracking-wider focus:outline-none focus:border-rose-500"
                />
              </div>

              {deleteError && (
                <div className="p-2.5 text-xs text-rose-700 bg-rose-50 border border-rose-200">
                  {deleteError}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition uppercase tracking-wider cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="button"
                disabled={deleteConfirmText.trim().toUpperCase() !== 'DELETE' || isDeleting}
                onClick={handleDeleteAccount}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition uppercase tracking-wider cursor-pointer disabled:opacity-40"
              >
                {isDeleting ? 'DELETING...' : 'DELETE'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. LINK/UPDATE PHONE MODAL */}
      {showPhoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 w-full max-w-sm p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
              {candidate?.phoneNumber ? 'Update Mobile Number' : 'Link Mobile Number'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enter your verified 10-digit mobile number for recruiter updates.
            </p>

            <form onSubmit={handleSyncPhone} className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={phoneCountryCode}
                  onChange={(e) => setPhoneCountryCode(e.target.value)}
                  className="w-16 px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-center font-bold text-slate-900 dark:text-white"
                />
                <input
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="9876543210"
                  maxLength={10}
                  className="flex-1 px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-brand-600"
                />
              </div>

              {phoneError && (
                <div className="text-xs text-rose-600 font-semibold">{phoneError}</div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPhoneModal(false)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={phoneLoading}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 transition uppercase cursor-pointer disabled:opacity-50"
                >
                  {phoneLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. PAYMENT RECOVERY MODAL */}
      <PaymentRecoveryModal
        isOpen={showPaymentRecovery}
        onClose={() => setShowPaymentRecovery(false)}
        onSuccess={() => {
          showToast('Payment verified successfully!');
          refreshProfile();
        }}
      />
    </div>
  );
};

export default SettingsPage;
