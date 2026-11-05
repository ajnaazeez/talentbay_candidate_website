import React from 'react';
import { Outlet } from 'react-router-dom';
import { Briefcase, Sparkles, ShieldCheck } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-10 relative overflow-hidden selection:bg-brand-500/30 selection:text-brand-200">
      {/* Cinematic Ambient Background Lighting */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Top-left Brand Royal Blue Glow */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl" />
        {/* Bottom-right Midnight Glow */}
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-brand-700/10 rounded-full blur-3xl" />
        {/* Center Ambient Gradient */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-gradient-to-tr from-brand-950/20 via-transparent to-navy-900/30 rounded-full blur-3xl opacity-60" />
        {/* Subtle grid mesh */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:32px_32px] opacity-20" />
      </div>

      <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
        {/* Left Side: Brand Visual & Proposition matching TalentBay identity */}
        <div className="hidden lg:flex lg:col-span-6 flex-col justify-between p-10 lg:p-12 bg-[#080e1a]/85 backdrop-blur-2xl text-white rounded-3xl shadow-2xl border border-brand-500/20 min-h-[640px] relative overflow-hidden group">
          {/* Atmospheric Office Backdrop Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-25 mix-blend-luminosity pointer-events-none scale-105 transition-transform duration-1000 ease-out group-hover:scale-100"
            style={{ backgroundImage: "url('/auth_bg.jpg')" }}
          />
          {/* Subtle gradient overlay on top of background image */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#080e1a]/90 via-[#080e1a]/75 to-[#080e1a]/95 pointer-events-none" />

          {/* Ambient Curved Decorative Arc */}
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full border border-brand-500/15 pointer-events-none" />
          <div className="absolute -top-10 -right-10 w-60 h-60 rounded-full border border-brand-500/10 pointer-events-none" />
          <div className="absolute top-1/3 -left-24 w-48 h-48 bg-brand-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Top Section: Logo & Branding */}
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-10">
              <div className="relative">
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-400 opacity-30 blur-sm"></div>
                <img
                  src="/candidate.png"
                  alt="TalentBay Candidate"
                  className="relative w-14 h-14 rounded-2xl object-contain bg-slate-950 p-1.5 border border-brand-500/30 shadow-xl shadow-brand-950/50"
                />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="text-3xl font-black text-white tracking-tight">
                    Talent<span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-blue-300">Bay</span>
                  </span>
                  <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-brand-500/15 text-brand-300 border border-brand-500/30 uppercase tracking-wider shadow-xs shadow-brand-500/20">
                    Candidate
                  </span>
                </div>
                <p className="text-xs text-brand-300/90 font-semibold tracking-wide mt-1">
                  Better Talent. Brighter Future.
                </p>
              </div>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-5 leading-[1.2] text-white">
              Discover top jobs, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 via-blue-200 to-slate-100">
                build your future.
              </span>
            </h2>

            <p className="text-slate-300/80 text-sm leading-relaxed max-w-md">
              Career workspace for professionals and job seekers. Build an ATS-ready resume, test your skills, apply directly to verified companies, and chat with hiring managers in real time.
            </p>
          </div>

          {/* Bottom Feature Cards */}
          <div className="relative z-10 grid grid-cols-3 gap-3.5 pt-8 border-t border-slate-800/80">
            <div className="flex flex-col items-center text-center p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md hover:border-brand-500/30 transition duration-200">
              <div className="w-9 h-9 rounded-xl bg-brand-500/10 border border-brand-500/25 flex items-center justify-center text-brand-400 mb-2.5 shadow-sm shadow-brand-500/10">
                <Briefcase className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-white">Top Jobs</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Verified employers</p>
            </div>

            <div className="flex flex-col items-center text-center p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md hover:border-brand-500/30 transition duration-200">
              <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/25 flex items-center justify-center text-amber-300 mb-2.5 shadow-sm shadow-amber-500/10">
                <Sparkles className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-white">AI CV & Skills</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">ATS-ready resumes</p>
            </div>

            <div className="flex flex-col items-center text-center p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md hover:border-brand-500/30 transition duration-200">
              <div className="w-9 h-9 rounded-xl bg-brand-500/10 border border-brand-500/25 flex items-center justify-center text-brand-400 mb-2.5 shadow-sm shadow-brand-500/10">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-white">Direct Chat</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Instant messaging</p>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Form Container */}
        <div className="lg:col-span-6 w-full max-w-lg mx-auto">
          <div className="bg-[#0b121e]/85 backdrop-blur-2xl py-8 px-6 sm:px-10 rounded-3xl shadow-2xl shadow-brand-950/30 border border-brand-500/20 text-white relative overflow-hidden">
            {/* Top right subtle ambient glow */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
