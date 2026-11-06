import React from 'react';
import { NavLink } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import { ROUTES } from '@/utils/constants';

export const TermsPage: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto py-10 px-4 sm:px-6 space-y-6">
      <NavLink
        to={ROUTES.REGISTER}
        className="inline-flex items-center gap-2 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Registration
      </NavLink>

      <div className="p-8 rounded-3xl bg-white dark:bg-[#202A27] border border-slate-200 dark:border-[#2e3b37] shadow-card space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-[#2e3b37]">
          <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Terms and Conditions</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">TalentBay Candidate Platform Agreement</p>
          </div>
        </div>

        <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-4 leading-relaxed">
          <p>
            Welcome to TalentBay. By registering, browsing, or using the TalentBay Candidate Website and services, you agree to comply with and be bound by the following terms and conditions.
          </p>

          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">1. Candidate Account & Identity</h3>
          <p>
            You agree to provide accurate, current, and complete information during the registration process and to keep your profile information up to date. You are responsible for safeguarding your password and account credentials.
          </p>

          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">2. Free Trial & Subscriptions</h3>
          <p>
            Eligible new candidate accounts receive an initial 7-day free trial granting access to premium features, including AI resume generation, career readiness insights, and unlimited applications. Paid subscription plans are billed in accordance with the displayed terms.
          </p>

          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">3. Acceptable Use</h3>
          <p>
            You agree not to submit false, misleading, or plagiarized work experience, educational degrees, or credentials. Any attempt to abuse assessment mechanisms or scrape platform data is strictly prohibited.
          </p>

          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">4. Privacy & Data Protection</h3>
          <p>
            Your personal data, uploaded resumes, and assessment results are managed under industry standards and protected in accordance with our Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
};
