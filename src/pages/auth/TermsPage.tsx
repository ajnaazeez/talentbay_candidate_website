import React from 'react';
import { NavLink } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import { ROUTES } from '@/utils/constants';

export const TermsPage: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto py-10 px-4 sm:px-6 space-y-6">
      <NavLink
        to={ROUTES.REGISTER}
        className="inline-flex items-center gap-2 text-xs font-bold text-[#00BFA6] hover:text-[#00A892] hover:underline"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Registration
      </NavLink>

      <div className="p-8 rounded-3xl bg-white dark:bg-[#0E2233] border border-[#D8E4EA] dark:border-[#1F2D3D] shadow-card space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-[#D8E4EA] dark:border-[#1F2D3D]">
          <div className="w-10 h-10 rounded-xl bg-[#E8F1F5] dark:bg-[#0A1A27] text-[#00BFA6] flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#0E2233] dark:text-white">Terms and Conditions</h1>
            <p className="text-xs text-[#6B8699] dark:text-[#8CA6B7]">TalentBay Candidate Platform Agreement</p>
          </div>
        </div>

        <div className="text-xs sm:text-sm text-[#1F2D3D] dark:text-[#BACDD8] space-y-4 leading-relaxed">
          <p>
            Welcome to TalentBay. By registering, browsing, or using the TalentBay Candidate Website and services, you agree to comply with and be bound by the following terms and conditions.
          </p>

          <h3 className="font-bold text-[#0E2233] dark:text-white text-sm">1. Candidate Account & Identity</h3>
          <p>
            You agree to provide accurate, current, and complete information during the registration process and to keep your profile information up to date. You are responsible for safeguarding your password and account credentials.
          </p>

          <h3 className="font-bold text-[#0E2233] dark:text-white text-sm">2. Free Trial & Subscriptions</h3>
          <p>
            Eligible new candidate accounts receive an initial 7-day free trial granting access to premium features, including AI resume generation, career readiness insights, and unlimited applications. Paid subscription plans are billed in accordance with the displayed terms.
          </p>

          <h3 className="font-bold text-[#0E2233] dark:text-white text-sm">3. Acceptable Use</h3>
          <p>
            You agree not to submit false, misleading, or plagiarized work experience, educational degrees, or credentials. Any attempt to abuse assessment mechanisms or scrape platform data is strictly prohibited.
          </p>

          <h3 className="font-bold text-[#0E2233] dark:text-white text-sm">4. Privacy & Data Protection</h3>
          <p>
            Your personal data, uploaded resumes, and assessment results are managed under industry standards and protected in accordance with our Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
};
