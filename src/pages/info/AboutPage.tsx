import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Building2 } from 'lucide-react';
import { APP_CONFIG } from '@/utils/constants';

export const AboutPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-24 animate-in fade-in duration-300">
      {/* Top Header with Back Button */}
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-black tracking-[0.2em] uppercase text-slate-900 dark:text-white">
          ABOUT US
        </h1>
      </div>

      {/* Hero Banner (Matching Flutter candidate_poster container) */}
      <div className="border border-slate-200 dark:border-slate-800 bg-slate-900 text-white p-8 sm:p-12 text-center relative overflow-hidden">
        <div className="w-16 h-16 border-2 border-white/20 bg-white/10 flex items-center justify-center mx-auto mb-4 font-black text-xl tracking-wider">
          TB
        </div>
        <div className="text-xl sm:text-2xl font-black tracking-widest uppercase">
          TALENTBAY CANDIDATE
        </div>
        <p className="text-xs text-slate-300 tracking-wider mt-1 font-medium">
          BRIDGING EXCEPTIONAL TALENT WITH WORLD-CLASS OPPORTUNITIES
        </p>
      </div>

      {/* Content Section (Matching Flutter exact copy) */}
      <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-sm font-black tracking-[0.15em] uppercase text-slate-900 dark:text-white">
            REDEFINING RECRUITMENT
          </h2>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal mt-3">
            Talent Bay is designed to bridge the gap between exceptional talent and world-class organizations. Our mission is to simplify the hiring process through innovation and design.
          </p>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal mt-4">
            We believe in the power of connection. Every feature in our app is crafted to enhance the experience of finding the perfect match for both candidates and recruiters.
          </p>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-800 pt-6 text-center space-y-3">
          <div className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-400">
            POWERED BY
          </div>
          <div className="flex items-center justify-center gap-2">
            <Building2 className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <span className="text-base font-black text-slate-900 dark:text-white tracking-wider">
              {APP_CONFIG.companyName}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 tracking-widest uppercase pt-2">
            © {new Date().getFullYear()} {APP_CONFIG.companyName}. ALL RIGHTS RESERVED.
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
