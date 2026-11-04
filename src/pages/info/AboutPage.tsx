import React from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import {
  Sparkles,
  ShieldCheck,
  Zap,
  ChevronLeft,
  Building2,
} from 'lucide-react';
import { APP_CONFIG, ROUTES } from '@/utils/constants';

export const AboutPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
      </div>

      {/* Main Brand Card */}
      <div className="bg-white dark:bg-[#111827] rounded-3xl p-8 sm:p-12 border border-slate-200/90 dark:border-slate-800 shadow-xs text-center space-y-6 relative overflow-hidden">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-brand-600 to-indigo-700 flex items-center justify-center mx-auto shadow-lg text-white font-black text-2xl">
          TB
        </div>

        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            TALENTBAY CANDIDATE
          </h1>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200/70 dark:border-brand-800 text-[11px] font-bold text-brand-700 dark:text-brand-300">
            <Sparkles className="w-3.5 h-3.5 text-brand-500" />
            <span>Version {APP_CONFIG.version} (Candidate Web Edition)</span>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-xl mx-auto leading-relaxed">
          TalentBay is designed to bridge the gap between exceptional talent and world-class organizations.
          Our mission is to simplify the job discovery and hiring process through innovation, verified skill credentials, and AI-driven career acceleration.
        </p>
      </div>

      {/* Core Platform Pillars Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-[#111827] rounded-2xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200/60 dark:border-brand-800 flex items-center justify-center text-brand-600 dark:text-brand-400">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Smart Matching
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Direct recruiter invitations with automated &ge;40% skill match alignment and transparent status tracking.
          </p>
        </div>

        <div className="bg-white dark:bg-[#111827] rounded-2xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200/60 dark:border-brand-800 flex items-center justify-center text-brand-600 dark:text-brand-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            AI Resume Builder
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Gemini-powered ATS resume generation with section regeneration and multipage PDF downloads.
          </p>
        </div>

        <div className="bg-white dark:bg-[#111827] rounded-2xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200/60 dark:border-brand-800 flex items-center justify-center text-brand-600 dark:text-brand-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Encrypted Messaging
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Real-time chat with recruiters utilizing AES-CTR encryption to ensure candidate privacy.
          </p>
        </div>
      </div>

      {/* Corporate Details & Developer Notice */}
      <div className="bg-white dark:bg-[#111827] rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-6 text-center">
        <div className="space-y-2">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Developed & Maintained by
          </p>
          <div className="flex items-center justify-center gap-2">
            <Building2 className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            <span className="text-sm font-black text-slate-900 dark:text-slate-100">
              {APP_CONFIG.companyName}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Empowering modern employment through intelligent technology.
          </p>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-6 text-xs font-semibold text-slate-600 dark:text-slate-400 flex-wrap">
          <NavLink to={ROUTES.TERMS} className="hover:text-brand-600 dark:hover:text-brand-400 transition">
            Terms of Service
          </NavLink>
          <span>•</span>
          <NavLink to={ROUTES.PRIVACY} className="hover:text-brand-600 dark:hover:text-brand-400 transition">
            Privacy Policy
          </NavLink>
          <span>•</span>
          <NavLink to={ROUTES.SUPPORT} className="hover:text-brand-600 dark:hover:text-brand-400 transition">
            Support Center
          </NavLink>
        </div>

        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          © {new Date().getFullYear()} {APP_CONFIG.companyName}. ALL RIGHTS RESERVED.
        </p>
      </div>
    </div>
  );
};

export default AboutPage;
