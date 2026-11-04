import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Briefcase,
  FileCheck2,
  Bookmark,
  GraduationCap,
  Sparkles,
  ArrowRight,
  Target,
  Building2,
  FileText,
  Compass,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { ROUTES } from '@/utils/constants';
import { TrialBanner } from '@/components/subscription/TrialBanner';

export const DashboardPage: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Welcome & Overview Header */}
      <PageHeader
        title="Welcome to TalentBay Candidate"
        description="Discover matched job openings, test your skills, and build a competitive career profile."
        badge={
          <Badge variant="brand" isAi>
            Career Hub
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <NavLink to={ROUTES.JOBS}>
              <Button variant="primary" leftIcon={<Briefcase className="w-4 h-4" />}>
                Explore Jobs
              </Button>
            </NavLink>
            <NavLink to={ROUTES.RESUME_BUILDER}>
              <Button variant="outline" leftIcon={<Sparkles className="w-4 h-4 text-purple-600" />}>
                AI Resume
              </Button>
            </NavLink>
          </div>
        }
      />

      {/* 7-Day Free Trial / Subscription Callout */}
      <TrialBanner />

      {/* Profile Completion Callout */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-brand-900 via-indigo-900 to-slate-900 text-white relative overflow-hidden shadow-xl border border-brand-800/40">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-brand-500/20 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-500/30 text-brand-200 border border-brand-400/30">
                Action Required
              </span>
              <span className="text-xs text-brand-200 font-medium">Boost recruiter visibility</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight">Complete your Career Profile</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Profiles with completed work experience, education, and verified skills receive up to 5x more recruiter inquiries.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 shrink-0">
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15">
              <div className="text-left">
                <span className="text-[10px] uppercase font-bold text-slate-300 block">Completion</span>
                <span className="text-lg font-black text-brand-300">Profile Ready</span>
              </div>
            </div>
            <NavLink to={ROUTES.PROFILE}>
              <Button
                variant="primary"
                className="bg-white text-brand-950 hover:bg-slate-100 shadow-md"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Update Profile
              </Button>
            </NavLink>
          </div>
        </div>
      </div>

      {/* High-Level Candidate Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Applications Sent"
          value="0"
          subtitle="Track active submissions"
          icon={FileCheck2}
          iconBgColor="bg-blue-50 dark:bg-blue-950/50"
          iconColor="text-blue-600 dark:text-blue-400"
        />
        <StatCard
          title="Saved Jobs"
          value="0"
          subtitle="Saved for later review"
          icon={Bookmark}
          iconBgColor="bg-amber-50 dark:bg-amber-950/50"
          iconColor="text-amber-600 dark:text-amber-400"
        />
        <StatCard
          title="Skills Assessed"
          value="0"
          subtitle="AI verified certificates"
          icon={GraduationCap}
          iconBgColor="bg-emerald-50 dark:bg-emerald-950/50"
          iconColor="text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          title="Job Matches"
          value="Active"
          subtitle="Real-time open positions"
          icon={Compass}
          iconBgColor="bg-purple-50 dark:bg-purple-950/50"
          iconColor="text-purple-600 dark:text-purple-400"
        />
      </div>

      {/* Career Acceleration Hub Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Career Growth Tools
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tools designed to enhance your readiness and maximize hiring opportunities.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* AI Skill Assessment */}
          <NavLink
            to={ROUTES.ASSESSMENTS}
            className="group p-6 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-[#1f293d] shadow-card hover:shadow-card-hover hover:border-brand-200 dark:hover:border-brand-800 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                AI Skill Testing
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Take AI-generated multiple-choice assessments for your skills and earn verified proficiency badges.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-[#1f293d] flex items-center justify-between text-xs font-semibold text-brand-600 dark:text-brand-400">
              <span>Start an assessment</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </NavLink>

          {/* AI Career Readiness */}
          <NavLink
            to={ROUTES.CAREER_READINESS}
            className="group p-6 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-[#1f293d] shadow-card hover:shadow-card-hover hover:border-brand-200 dark:hover:border-brand-800 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Target className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                Career Readiness
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Get tailored AI analysis of your skill gaps, step-by-step learning roadmap, and interview prep guides.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-[#1f293d] flex items-center justify-between text-xs font-semibold text-brand-600 dark:text-brand-400">
              <span>View guidance roadmap</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </NavLink>

          {/* ATS Resume Builder */}
          <NavLink
            to={ROUTES.RESUME_BUILDER}
            className="group p-6 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-[#1f293d] shadow-card hover:shadow-card-hover hover:border-brand-200 dark:hover:border-brand-800 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                ATS Resume Generator
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Automatically generate, format, and export a clean ATS-friendly resume from your profile data.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-[#1f293d] flex items-center justify-between text-xs font-semibold text-brand-600 dark:text-brand-400">
              <span>Generate resume</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </NavLink>
        </div>
      </div>

      {/* Explore Companies & Opportunities Bar */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-[#1f293d] shadow-card flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
              Verified Companies are Hiring
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Browse direct employer openings across technology, marketing, design, and operations.
            </p>
          </div>
        </div>
        <NavLink to={ROUTES.COMPANIES} className="shrink-0 w-full sm:w-auto">
          <Button variant="outline" className="w-full sm:w-auto">
            Browse Companies
          </Button>
        </NavLink>
      </div>
    </div>
  );
};
