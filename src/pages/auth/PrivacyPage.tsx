import React from 'react';
import { NavLink } from 'react-router-dom';
import { ArrowLeft, Lock } from 'lucide-react';
import { ROUTES } from '@/utils/constants';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto py-10 px-4 sm:px-6 space-y-6">
      <NavLink
        to={ROUTES.REGISTER}
        className="inline-flex items-center gap-2 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Registration
      </NavLink>

      <div className="p-8 rounded-3xl bg-white dark:bg-[#131f37] border border-slate-200 dark:border-[#1e2f52] shadow-card space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-[#1e2f52]">
          <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Privacy Policy</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Data Protection & Privacy Standards</p>
          </div>
        </div>

        <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-4 leading-relaxed">
          <p>
            At TalentBay, we take candidate privacy very seriously. This Privacy Policy details how we collect, store, and safeguard your personal details and employment history.
          </p>

          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">1. Information We Collect</h3>
          <p>
            We collect personal details you provide during registration and profile creation, including your name, email address, phone number, work experience, education, skills, and uploaded resumes.
          </p>

          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">2. How Your Data Is Used</h3>
          <p>
            Your information is used strictly to connect you with verified employers, process job applications you submit, deliver AI skill evaluation results, and enable real-time messaging with recruiters.
          </p>

          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">3. End-to-End Encrypted Messaging</h3>
          <p>
            Candidate-recruiter messages on TalentBay are encrypted client-side using industry-standard AES encryption to protect conversational confidentiality.
          </p>

          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">4. Data Ownership & Deletion Rights</h3>
          <p>
            You retain complete ownership over your data. You may update your profile or permanently purge your account at any time through Account Settings under full GDPR compliance.
          </p>
        </div>
      </div>
    </div>
  );
};
