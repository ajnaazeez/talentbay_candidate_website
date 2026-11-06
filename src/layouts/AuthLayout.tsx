import React from 'react';
import { Outlet } from 'react-router-dom';
import { Briefcase, Sparkles, ShieldCheck } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#29272A] text-[#F5F1EA] flex items-center justify-center p-4 sm:p-6 lg:p-10 relative overflow-hidden selection:bg-[#B87355]/30 selection:text-white">
      {/* Cinematic Ambient Background Lighting */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Top-left Burnt Copper Glow */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#B87355]/15 rounded-full blur-3xl" />
        {/* Bottom-right Midnight Charcoal Glow */}
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#B87355]/10 rounded-full blur-3xl" />
        {/* Center Ambient Gradient */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-gradient-to-tr from-[#B87355]/10 via-transparent to-[#222023]/40 rounded-full blur-3xl opacity-60" />
        {/* Subtle grid mesh */}
        <div className="absolute inset-0 bg-[radial-gradient(#494448_1px,transparent_1px)] [background-size:32px_32px] opacity-25" />
      </div>

      <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
        {/* Left Side: Brand Visual & Proposition matching TalentBay identity */}
        <div className="hidden lg:flex lg:col-span-6 flex-col justify-between p-10 lg:p-12 bg-[#222023]/90 backdrop-blur-2xl text-[#F5F1EA] rounded-3xl shadow-2xl border border-[#494448] min-h-[640px] relative overflow-hidden group">
          {/* Atmospheric Office Backdrop Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-20 mix-blend-luminosity pointer-events-none scale-105 transition-transform duration-1000 ease-out group-hover:scale-100"
            style={{ backgroundImage: "url('/auth_bg.jpg')" }}
          />
          {/* Subtle gradient overlay on top of background image */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#222023]/95 via-[#222023]/80 to-[#222023]/95 pointer-events-none" />

          {/* Ambient Curved Decorative Arc */}
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full border border-[#B87355]/15 pointer-events-none" />
          <div className="absolute -top-10 -right-10 w-60 h-60 rounded-full border border-[#B87355]/10 pointer-events-none" />
          <div className="absolute top-1/3 -left-24 w-48 h-48 bg-[#B87355]/10 rounded-full blur-2xl pointer-events-none" />

          {/* Top Section: Logo & Branding */}
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-10">
              <img
                src="/candidate_logo.png"
                alt="TalentBay Candidate"
                className="w-14 h-14 rounded-2xl object-contain shrink-0 shadow-lg"
              />
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="text-3xl font-black text-white tracking-tight">
                    TalentBay
                  </span>
                  <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#B87355]/20 text-[#B87355] border border-[#B87355]/40 uppercase tracking-wider shadow-xs">
                    Candidate
                  </span>
                </div>
                <p className="text-xs text-[#A49D9E] font-semibold tracking-wide mt-1">
                  Better Talent. Brighter Future.
                </p>
              </div>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-5 leading-[1.2] text-white">
              Discover top jobs, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D7A38C] via-[#F4E5DE] to-white">
                build your future.
              </span>
            </h2>

            <p className="text-[#D4CDC7] text-sm leading-relaxed max-w-md">
              Career workspace for professionals and job seekers. Build an ATS-ready resume, test your skills, apply directly to verified companies, and chat with hiring managers in real time.
            </p>
          </div>

          {/* Bottom Feature Cards */}
          <div className="relative z-10 grid grid-cols-3 gap-3.5 pt-8 border-t border-[#494448]">
            <div className="flex flex-col items-center text-center p-3.5 rounded-2xl bg-[#29272A]/80 border border-[#494448] backdrop-blur-md hover:border-[#B87355]/40 transition duration-200">
              <div className="w-9 h-9 rounded-xl bg-[#B87355]/15 border border-[#B87355]/30 flex items-center justify-center text-[#B87355] mb-2.5 shadow-sm shadow-[#B87355]/10">
                <Briefcase className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-white">Top Jobs</h4>
              <p className="text-[10px] text-[#A49D9E] mt-0.5">Verified employers</p>
            </div>

            <div className="flex flex-col items-center text-center p-3.5 rounded-2xl bg-[#29272A]/80 border border-[#494448] backdrop-blur-md hover:border-[#B87355]/40 transition duration-200">
              <div className="w-9 h-9 rounded-xl bg-[#B87355]/15 border border-[#B87355]/30 flex items-center justify-center text-[#B87355] mb-2.5 shadow-sm shadow-[#B87355]/10">
                <Sparkles className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-white">AI CV & Skills</h4>
              <p className="text-[10px] text-[#A49D9E] mt-0.5">ATS-ready resumes</p>
            </div>

            <div className="flex flex-col items-center text-center p-3.5 rounded-2xl bg-[#29272A]/80 border border-[#494448] backdrop-blur-md hover:border-[#B87355]/40 transition duration-200">
              <div className="w-9 h-9 rounded-xl bg-[#B87355]/15 border border-[#B87355]/30 flex items-center justify-center text-[#B87355] mb-2.5 shadow-sm shadow-[#B87355]/10">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-white">Direct Chat</h4>
              <p className="text-[10px] text-[#A49D9E] mt-0.5">Instant messaging</p>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Form Container */}
        <div className="lg:col-span-6 w-full max-w-lg mx-auto">
          {/* Mobile Brand Logo Header */}
          <div className="flex lg:hidden items-center justify-center gap-3 mb-6">
            <img
              src="/candidate_logo.png"
              alt="TalentBay Candidate"
              className="w-10 h-10 rounded-xl object-contain shadow-md"
            />
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-white tracking-tight">
                TalentBay
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#B87355]/20 text-[#B87355] border border-[#B87355]/40 uppercase tracking-wider">
                Candidate
              </span>
            </div>
          </div>

          <div className="bg-[#222023]/95 backdrop-blur-2xl py-8 px-6 sm:px-10 rounded-3xl shadow-2xl border border-[#494448] text-[#F5F1EA] relative overflow-hidden">
            {/* Top right subtle ambient glow */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#B87355]/15 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
