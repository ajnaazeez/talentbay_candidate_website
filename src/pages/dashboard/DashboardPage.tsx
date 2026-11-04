import React, { useState, useEffect, useMemo } from 'react';
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
  Mail,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { ROUTES } from '@/utils/constants';
import { TrialBanner } from '@/components/subscription/TrialBanner';
import { useAuth } from '@/hooks/useAuth';
import { jobService } from '@/services/jobService';
import { calculateProfileCompletion } from '@/utils/profileCompletion';

export const DashboardPage: React.FC = () => {
  const { candidate } = useAuth();
  const [applicationsCount, setApplicationsCount] = useState(0);
  const [pendingInvitesCount, setPendingInvitesCount] = useState(0);

  useEffect(() => {
    if (!candidate?.uid) return;

    // 1. Subscribe to applications count
    const unsubApps = jobService.subscribeToCandidateApplications(
      candidate.uid,
      (apps) => {
        const submitted = apps.filter((a) => a.applicationStatus !== 'invited');
        setApplicationsCount(submitted.length);
      }
    );

    // 2. Subscribe to pending invitations count
    const unsubInvites = jobService.subscribeToInvites(
      candidate.uid,
      (invites) => {
        setPendingInvitesCount(invites.length);
      }
    );

    return () => {
      unsubApps();
      unsubInvites();
    };
  }, [candidate?.uid]);

  const savedJobsCount = candidate?.savedJobIds?.length || 0;
  const skillsCount = candidate?.skills?.length || 0;

  // Real-time calculation matching Flutter ProfileCompletionCalculator
  const completion = useMemo(() => calculateProfileCompletion(candidate), [candidate]);
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

      {/* Recruiter Invitations Action Banner (when invitations are pending) */}
      {pendingInvitesCount > 0 && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 border border-indigo-700/50 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/40 text-indigo-200 border border-indigo-400/30">
                  Direct Inquiries
                </span>
                <span className="text-xs font-semibold text-indigo-200">
                  {pendingInvitesCount} new invitation{pendingInvitesCount > 1 ? 's' : ''}
                </span>
              </div>
              <h4 className="text-sm sm:text-base font-bold text-white">
                Verified recruiters have invited you to interview
              </h4>
              <p className="text-xs text-indigo-200/80">
                Review role details, match scoring, and accept to join the employer's applicant pool.
              </p>
            </div>
          </div>
          <NavLink to={ROUTES.INVITATIONS} className="shrink-0">
            <Button
              variant="primary"
              size="sm"
              className="bg-white text-indigo-950 hover:bg-slate-100 shadow-sm"
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Review Invitations
            </Button>
          </NavLink>
        </div>
      )}

      {/* Profile Completion Callout */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-brand-900 via-indigo-900 to-slate-900 text-white relative overflow-hidden shadow-xl border border-brand-800/40">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-brand-500/20 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-xl">
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                completion.percentage === 100
                  ? 'bg-emerald-500/30 text-emerald-200 border-emerald-400/30'
                  : 'bg-brand-500/30 text-brand-200 border-brand-400/30'
              }`}>
                {completion.percentage === 100 ? 'Profile Verified' : 'Action Recommended'}
              </span>
              <span className="text-xs text-brand-200 font-medium">
                {completion.percentage === 100 ? 'All 15 factors completed' : 'Boost recruiter visibility up to 5x'}
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
              {completion.percentage === 100
                ? 'Your Career Profile is 100% Complete!'
                : 'Complete your Career Profile'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {completion.percentage === 100
                ? 'Great job! Your profile has comprehensive work history, education, and skills for recruiter discovery.'
                : 'Profiles with completed work experience, education, and verified skills receive up to 5x more recruiter inquiries.'}
            </p>

            {/* Missing Fields Navigation Shortcuts */}
            {completion.missingFields.length > 0 && (
              <div className="pt-1 space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-300 block">
                  Missing Information ({completion.missingFields.length}):
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {completion.missingFields.slice(0, 4).map((field) => (
                    <NavLink
                      key={field}
                      to={ROUTES.PROFILE}
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-[11px] font-semibold text-brand-200 hover:text-white transition inline-flex items-center gap-1 group"
                      title={`Add ${field} in Profile`}
                    >
                      <span>+ {field}</span>
                    </NavLink>
                  ))}
                  {completion.missingFields.length > 4 && (
                    <NavLink
                      to={ROUTES.PROFILE}
                      className="text-[11px] font-semibold text-brand-300 hover:underline px-1"
                    >
                      +{completion.missingFields.length - 4} more
                    </NavLink>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 shrink-0">
            <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/15 min-w-[130px] space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span className="uppercase text-[10px]">Completion</span>
                <span className="text-brand-300">{completion.percentage}%</span>
              </div>
              <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-400 to-brand-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${completion.percentage}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400 block text-right font-medium">
                {completion.filledCount} of {completion.totalCount} completed
              </span>
            </div>

            <NavLink to={ROUTES.PROFILE}>
              <Button
                variant="primary"
                className="bg-white text-brand-950 hover:bg-slate-100 shadow-md"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {completion.percentage === 100 ? 'View Profile' : 'Update Profile'}
              </Button>
            </NavLink>
          </div>
        </div>
      </div>

      {/* High-Level Candidate Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <NavLink to={ROUTES.APPLICATIONS}>
          <StatCard
            title="Applications Sent"
            value={applicationsCount}
            subtitle="Track active submissions"
            icon={FileCheck2}
            iconBgColor="bg-blue-50 dark:bg-blue-950/50"
            iconColor="text-blue-600 dark:text-blue-400"
          />
        </NavLink>
        <NavLink to={ROUTES.INVITATIONS}>
          <StatCard
            title="Direct Invitations"
            value={pendingInvitesCount}
            subtitle={pendingInvitesCount > 0 ? 'Action required' : 'From recruiters'}
            icon={Mail}
            iconBgColor="bg-indigo-50 dark:bg-indigo-950/50"
            iconColor="text-indigo-600 dark:text-indigo-400"
          />
        </NavLink>
        <NavLink to={ROUTES.SAVED_JOBS}>
          <StatCard
            title="Saved Jobs"
            value={savedJobsCount}
            subtitle="Saved for later review"
            icon={Bookmark}
            iconBgColor="bg-amber-50 dark:bg-amber-950/50"
            iconColor="text-amber-600 dark:text-amber-400"
          />
        </NavLink>
        <NavLink to={ROUTES.ASSESSMENTS}>
          <StatCard
            title="Skills & Badges"
            value={skillsCount}
            subtitle="Verified competencies"
            icon={GraduationCap}
            iconBgColor="bg-emerald-50 dark:bg-emerald-950/50"
            iconColor="text-emerald-600 dark:text-emerald-400"
          />
        </NavLink>
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
