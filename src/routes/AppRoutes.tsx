import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicRoute } from './PublicRoute';
import { AuthLayout } from '@/layouts/AuthLayout';
import { CandidateLayout } from '@/layouts/CandidateLayout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { TermsPage } from '@/pages/auth/TermsPage';
import { PrivacyPage } from '@/pages/auth/PrivacyPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { ProfilePage } from '@/pages/profile/ProfilePage';
import { ResumeBuilderPage } from '@/pages/profile/ResumeBuilderPage';
import { JobsPage } from '@/pages/jobs/JobsPage';
import { JobDetailsPage } from '@/pages/jobs/JobDetailsPage';
import { SavedJobsPage } from '@/pages/jobs/SavedJobsPage';
import { CompaniesPage } from '@/pages/companies/CompaniesPage';
import { CompanyDetailsPage } from '@/pages/companies/CompanyDetailsPage';
import { AssessmentsPage } from '@/pages/assessment/AssessmentsPage';
import { CareerReadinessPage } from '@/pages/assessment/CareerReadinessPage';
import { ChatPage } from '@/pages/chat/ChatPage';
import { NotificationsPage } from '@/pages/notifications/NotificationsPage';
import { SubscriptionPage } from '@/pages/subscription/SubscriptionPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { ROUTES } from '@/utils/constants';

// Dynamic Root Redirect based on Authentication status
const RootRedirect: React.FC = () => {
  const { user, initialLoading } = useAuth();

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0b0f19]">
        <LoadingSpinner size="lg" label="Connecting to TalentBay..." />
      </div>
    );
  }

  if (user) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <Navigate to={ROUTES.LOGIN} replace />;
};

// Placeholder component for future phase routes
const UnderConstructionPage: React.FC<{ title: string; phase: string }> = ({ title, phase }) => (
  <div className="p-8 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#1f293d] shadow-sm text-center max-w-lg mx-auto space-y-3 my-12">
    <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 mx-auto flex items-center justify-center font-bold text-lg">
      TB
    </div>
    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{title}</h2>
    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
      This feature will be fully integrated in <strong>{phase}</strong>.
    </p>
  </div>
);

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Root Dynamic Redirect */}
      <Route path="/" element={<RootRedirect />} />

      {/* Public Auth Routes (Guest Only) */}
      <Route element={<PublicRoute />}>
        <Route element={<AuthLayout />}>
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />
          <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
          <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
        </Route>
      </Route>

      {/* Public Legal / Terms Pages */}
      <Route path={ROUTES.TERMS} element={<TermsPage />} />
      <Route path={ROUTES.PRIVACY} element={<PrivacyPage />} />

      {/* Protected Candidate Workspace Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<CandidateLayout />}>
          <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />

          {/* Jobs & Discovery */}
          <Route path={ROUTES.JOBS} element={<JobsPage />} />
          <Route path={ROUTES.JOB_DETAILS} element={<JobDetailsPage />} />
          <Route path={ROUTES.SAVED_JOBS} element={<SavedJobsPage />} />
          <Route path={ROUTES.APPLICATIONS} element={<UnderConstructionPage title="Job Applications" phase="Phase 5" />} />

          {/* Companies */}
          <Route path={ROUTES.COMPANIES} element={<CompaniesPage />} />
          <Route path={ROUTES.COMPANY_DETAILS} element={<CompanyDetailsPage />} />

          {/* Profile & Resume */}
          <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
          <Route path={ROUTES.PROFILE_EDIT} element={<ProfilePage />} />
          <Route path={ROUTES.RESUME_BUILDER} element={<ResumeBuilderPage />} />

          {/* Assessment & Career Growth */}
          <Route path={ROUTES.ASSESSMENTS} element={<AssessmentsPage />} />
          <Route path={ROUTES.ASSESSMENT_TAKE} element={<AssessmentsPage />} />
          <Route path={ROUTES.CAREER_READINESS} element={<CareerReadinessPage />} />

          {/* Chat & Notifications */}
          <Route path={ROUTES.CHAT} element={<ChatPage />} />
          <Route path={ROUTES.CHAT_ROOM} element={<ChatPage />} />
          <Route path={ROUTES.NOTIFICATIONS} element={<NotificationsPage />} />

          {/* Subscription & Settings */}
          <Route path={ROUTES.SUBSCRIPTION} element={<SubscriptionPage />} />
          <Route path={ROUTES.SETTINGS} element={<UnderConstructionPage title="Settings" phase="Phase 8" />} />
          <Route path={ROUTES.SUPPORT} element={<UnderConstructionPage title="Support & Help" phase="Phase 8" />} />
          <Route path={ROUTES.ABOUT} element={<UnderConstructionPage title="About TalentBay" phase="Phase 8" />} />
        </Route>
      </Route>

      {/* Catch-all 404 Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
