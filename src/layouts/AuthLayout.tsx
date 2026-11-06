import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Briefcase, Sparkles, MessageSquare, ShieldCheck } from 'lucide-react';
import { ROUTES } from '@/utils/constants';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F6FAFC] dark:bg-[#08141F] text-[#1F2D3D] dark:text-[#F6FAFC] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-10 relative overflow-hidden selection:bg-[#00BFA6]/20 selection:text-[#0E2233]">
      {/* Subtle ambient background glow & mesh */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#00BFA6]/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#0E2233]/5 dark:bg-[#00BFA6]/5 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(#D8E4EA_1px,transparent_1px)] dark:bg-[radial-gradient(#1F2D3D_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
      </div>

      {/* Main Unified Split-Screen Authentication Container */}
      <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 rounded-3xl shadow-2xl border border-[#D8E4EA] dark:border-[#1F2D3D] overflow-hidden bg-white dark:bg-[#0E2233] relative z-10 my-auto">
        {/* Left Side: Deep Navy Branding & Proposition Panel (Visible on Desktop) */}
        <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-10 lg:p-12 bg-gradient-to-br from-[#0E2233] via-[#0E2233] to-[#0A2234] text-white relative overflow-hidden border-r border-[#1F2D3D]">
          {/* Subtle teal decorative gradient flourishes */}
          <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-[#00BFA6]/20 blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-[#00BFA6]/10 blur-3xl pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_var(--tw-gradient-stops))] from-[#00BFA6]/15 via-transparent to-transparent pointer-events-none" />

          {/* Top: Authentic Logo & Brand Tagline */}
          <div className="relative z-10 space-y-8">
            <NavLink to={ROUTES.DASHBOARD} className="inline-flex items-center gap-3.5 group">
              <img
                src="/candidate_logo.png"
                alt="TalentBay Candidate"
                className="w-12 h-12 rounded-2xl object-contain shrink-0 shadow-lg group-hover:scale-105 transition-transform"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-white tracking-tight">TalentBay</span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#00BFA6]/20 text-[#00BFA6] border border-[#00BFA6]/40">
                    Candidate
                  </span>
                </div>
                <p className="text-[10px] tracking-widest text-[#8CA6B7] uppercase font-semibold mt-0.5">
                  YOUR NEXT CAREER STARTS HERE
                </p>
              </div>
            </NavLink>

            {/* Headline matching user's visual identity banner */}
            <div className="space-y-3 pt-4">
              <h1 className="text-3xl font-black tracking-tight leading-snug text-white">
                Modern. Professional. <br />
                <span className="text-[#00BFA6]">Built for Your Future.</span>
              </h1>
              <p className="text-xs sm:text-sm text-[#BACDD8] leading-relaxed">
                Connect with verified hiring managers, discover curated job openings, assess technical competencies, and craft ATS-ready resumes.
              </p>
            </div>
          </div>

          {/* Feature highlights */}
          <div className="relative z-10 space-y-3.5 py-8 border-t border-white/10">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#00BFA6]/15 border border-[#00BFA6]/30 flex items-center justify-center text-[#00BFA6] shrink-0 mt-0.5">
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Verified Career Opportunities</h4>
                <p className="text-[11px] text-[#8CA6B7]">Direct employer applications with transparent compensation</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#00BFA6]/15 border border-[#00BFA6]/30 flex items-center justify-center text-[#00BFA6] shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">AI Resume & Assessments</h4>
                <p className="text-[11px] text-[#8CA6B7]">Standardized skill quizzes and instant ATS CV builder</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#00BFA6]/15 border border-[#00BFA6]/30 flex items-center justify-center text-[#00BFA6] shrink-0 mt-0.5">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Direct Recruiter Messaging</h4>
                <p className="text-[11px] text-[#8CA6B7]">Real-time engagement without intermediaries</p>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="relative z-10 flex items-center justify-between text-[11px] text-[#8CA6B7] pt-4 border-t border-white/10">
            <span>© {new Date().getFullYear()} TalentBay</span>
            <span className="flex items-center gap-1.5 text-white/80 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-[#00BFA6]" /> Verified Employer Network
            </span>
          </div>
        </div>

        {/* Right Side: Clean Modern White/Ice White Authentication Form */}
        <div className="lg:col-span-7 bg-white dark:bg-[#0E2233] p-6 sm:p-10 lg:p-12 flex flex-col justify-center">
          {/* Mobile Top Branding (hidden on desktop) */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8 pb-6 border-b border-[#D8E4EA] dark:border-[#1F2D3D]">
            <img
              src="/candidate_logo.png"
              alt="TalentBay Candidate"
              className="w-10 h-10 rounded-xl object-contain shadow-md"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-[#0E2233] dark:text-white tracking-tight">TalentBay</span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#00BFA6]/20 text-[#00BFA6] border border-[#00BFA6]/40">
                  Candidate
                </span>
              </div>
              <p className="text-[10px] tracking-wider text-[#6B8699] uppercase font-medium">
                YOUR NEXT CAREER STARTS HERE
              </p>
            </div>
          </div>

          {/* Form Content */}
          <div className="w-full max-w-md mx-auto">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};
