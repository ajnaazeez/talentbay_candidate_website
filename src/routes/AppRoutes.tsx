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
import { SearchPage } from '@/pages/search/SearchPage';
import { SavedJobsPage } from '@/pages/jobs/SavedJobsPage';
import { ApplicationsPage } from '@/pages/applications/ApplicationsPage';
import { InvitationsPage } from '@/pages/invitations/InvitationsPage';
import { CompaniesPage } from '@/pages/companies/CompaniesPage';
import { CompanyDetailsPage } from '@/pages/companies/CompanyDetailsPage';
import { AssessmentsPage } from '@/pages/assessment/AssessmentsPage';
import { CareerReadinessPage } from '@/pages/assessment/CareerReadinessPage';
import { ChatPage } from '@/pages/chat/ChatPage';
import { NotificationsPage } from '@/pages/notifications/NotificationsPage';
import { SubscriptionPage } from '@/pages/subscription/SubscriptionPage';
import { SettingsPage } from '@/pages/settings/SettingsPage';
import { AboutPage } from '@/pages/info/AboutPage';
import { SupportPage } from '@/pages/info/SupportPage';
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
          <Route path={ROUTES.SEARCH} element={<SearchPage />} />
          <Route path={ROUTES.SAVED_JOBS} element={<SavedJobsPage />} />
          <Route path={ROUTES.APPLICATIONS} element={<ApplicationsPage />} />
          <Route path={ROUTES.INVITATIONS} element={<InvitationsPage />} />

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
          <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
          <Route path={ROUTES.SUPPORT} element={<SupportPage />} />
          <Route path={ROUTES.ABOUT} element={<AboutPage />} />
        </Route>
      </Route>

      {/* Catch-all 404 Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
