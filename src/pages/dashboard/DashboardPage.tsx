import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search,
  Bell,
  Briefcase,
  Building2,
  User,
  Bookmark,
  Mail,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { jobService } from '@/services/jobService';
import { companyService } from '@/services/companyService';
import { JobCard } from '@/components/jobs/JobCard';
import { ApplyJobModal } from '@/components/jobs/ApplyJobModal';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ROUTES } from '@/utils/constants';
import type { Job, Company, JobApplication } from '@/types';

type CategoryFilter = 'All' | 'Remote' | 'Full-time' | 'Part-time' | 'Contract';

const CATEGORIES: CategoryFilter[] = ['All', 'Remote', 'Full-time', 'Part-time', 'Contract'];

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, candidate, refreshCandidate } = useAuth();
  const { unreadNotificationsCount } = useNotifications();

  // Header & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('All');

  // Real-time Stats
  const [applicationsCount, setApplicationsCount] = useState(0);
  const [pendingInvitesCount, setPendingInvitesCount] = useState(0);

  // Data States
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidateApplications, setCandidateApplications] = useState<JobApplication[]>([]);
  const [topCompanies, setTopCompanies] = useState<Company[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingCompanies, setLoadingCompanies] = useState(true);

  // Application Modal state
  const [applyingJob, setApplyingJob] = useState<Job | null>(null);

  // 1. Subscribe to Applications and Invitations counts
  useEffect(() => {
    if (!candidate?.uid) {
      setApplicationsCount(0);
      setPendingInvitesCount(0);
      return;
    }

    const unsubApps = jobService.subscribeToCandidateApplications(
      candidate.uid,
      (apps) => {
        setCandidateApplications(apps);
        const submitted = apps.filter((a) => a.applicationStatus !== 'invited');
        setApplicationsCount(submitted.length);
      },
      (err) => console.error('[Dashboard] Error subscribing to applications:', err)
    );

    const unsubInvites = jobService.subscribeToInvites(
      candidate.uid,
      (invites) => {
        setPendingInvitesCount(invites.length);
      },
      (err) => console.error('[Dashboard] Error subscribing to invites:', err)
    );

    return () => {
      unsubApps();
      unsubInvites();
    };
  }, [candidate?.uid]);

  // 2. Fetch Jobs from Firestore
  const fetchJobs = useCallback(async () => {
    setLoadingJobs(true);
    try {
      const allJobs = await jobService.getJobs();
      setJobs(allJobs);
    } catch (err) {
      console.error('[Dashboard] Error fetching jobs:', err);
    } finally {
      setLoadingJobs(false);
    }
  }, []);

  // 3. Fetch Top Companies from Firestore
  const fetchCompanies = useCallback(async () => {
    setLoadingCompanies(true);
    try {
      const companies = await companyService.getCompanies();
      setTopCompanies(companies.slice(0, 5));
    } catch (err) {
      console.error('[Dashboard] Error fetching companies:', err);
    } finally {
      setLoadingCompanies(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
    fetchCompanies();
  }, [fetchJobs, fetchCompanies]);

  // Handle Search Submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`${ROUTES.SEARCH}?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate(ROUTES.SEARCH);
    }
  };

  // Applied Job IDs set for quick lookup
  const appliedJobIds = useMemo(() => {
    return new Set(candidateApplications.map((a) => a.jobId));
  }, [candidateApplications]);

  // Candidate Full Name
  const candidateFullName = candidate?.firstName
    ? `${candidate.firstName} ${candidate.lastName || ''}`.trim()
    : user?.displayName || 'Candidate';

  // Filter Jobs based on selected Category Chip
  const recommendedJobs = useMemo(() => {
    let filtered = [...jobs];

    if (selectedCategory === 'Remote') {
      filtered = filtered.filter(
        (j) =>
          j.workMode?.toLowerCase().includes('remote') ||
          j.jobLocation?.city?.toLowerCase().includes('remote')
      );
    } else if (selectedCategory === 'Full-time') {
      filtered = filtered.filter((j) =>
        j.employmentType?.toLowerCase().includes('full')
      );
    } else if (selectedCategory === 'Part-time') {
      filtered = filtered.filter((j) =>
        j.employmentType?.toLowerCase().includes('part')
      );
    } else if (selectedCategory === 'Contract') {
      filtered = filtered.filter((j) =>
        j.employmentType?.toLowerCase().includes('contract')
      );
    }

    return filtered.slice(0, 6);
  }, [jobs, selectedCategory]);

  // Handle Save / Unsave Job
  const handleSaveToggle = async (jobId: string, currentlySaved: boolean) => {
    if (!candidate?.uid) return;
    try {
      if (currentlySaved) {
        await jobService.unsaveJob(candidate.uid, jobId);
      } else {
        await jobService.saveJob(candidate.uid, jobId);
      }
      await refreshCandidate();
    } catch (err) {
      console.error('[Dashboard] Error toggling save job:', err);
    }
  };

  const savedJobsCount = candidate?.savedJobIds?.length || 0;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20 animate-in fade-in duration-300">
      {/* 1. Executive Welcome & Search Hero Banner */}
      <div className="relative rounded-3xl bg-[#0E2233] text-[#F6FAFC] p-6 sm:p-8 shadow-card overflow-hidden border border-[#1F2D3D]">
        {/* Ambient subtle light glows */}
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-[#00BFA6]/15 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-[#00BFA6]/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Top Row: Greeting & Right Quick Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md text-[#5EEAD9] border border-white/15">
                <Sparkles className="w-3.5 h-3.5 text-[#00BFA6]" />
                <span>Career Hub</span>
                {candidate?.isPremium && (
                  <span className="ml-1 px-1.5 py-0.2 rounded text-[10px] bg-[#00BFA6] text-white font-bold">
                    PRO
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Welcome back, {candidateFullName}
              </h1>
              <p className="text-xs sm:text-sm text-[#BACDD8] leading-relaxed font-normal">
                Discover matching opportunities, assess skills, and monitor recruitment progress.
              </p>
            </div>

            {/* Quick Action Controls */}
            <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
              <Link
                to={ROUTES.NOTIFICATIONS}
                className="relative p-2.5 rounded-xl border border-[#1F2D3D] bg-white/10 hover:bg-white/15 text-white transition backdrop-blur-md"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                    {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                  </span>
                )}
              </Link>

              <Link
                to={ROUTES.PROFILE}
                className="w-10 h-10 rounded-xl border border-[#1F2D3D] overflow-hidden bg-white/10 hover:bg-white/20 transition flex items-center justify-center backdrop-blur-md"
                title="My Profile"
              >
                {candidate?.photoUrl ? (
                  <img
                    src={candidate.photoUrl}
                    alt={candidateFullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-[#5EEAD9]" />
                )}
              </Link>
            </div>
          </div>

          {/* Embedded Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <div className="relative flex items-center bg-[#0A1A27]/90 backdrop-blur-md border border-[#1F2D3D] rounded-2xl p-1.5 focus-within:border-[#00BFA6] focus-within:ring-2 focus-within:ring-[#00BFA6]/30 transition-all shadow-inner">
              <Search className="w-5 h-5 text-[#8CA6B7] absolute left-4 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search jobs, tech stacks, locations or companies..."
                className="w-full pl-11 pr-28 py-2.5 bg-transparent text-sm font-medium text-white placeholder:text-[#8CA6B7] focus:outline-none"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#00BFA6] hover:bg-[#00A892] active:bg-[#008C79] text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer shrink-0"
              >
                Search Jobs
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 3. Stat Cards (APPLIED, SAVED, INVITES - matching Flutter) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Applied */}
        <Link
          to={ROUTES.APPLICATIONS}
          className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0E2233] border border-[#D8E4EA] dark:border-[#1F2D3D] shadow-card hover:shadow-card-hover hover:border-[#00BFA6]/60 hover:-translate-y-0.5 transition-all duration-200 group flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-[#6B8699] dark:text-[#8CA6B7] uppercase tracking-wider block">
              Applied
            </span>
            <span className="text-3xl font-extrabold text-[#1F2D3D] dark:text-white tracking-tight block">
              {applicationsCount}
            </span>
            <span className="text-xs text-[#6B8699] dark:text-[#8CA6B7] flex items-center gap-1 font-medium group-hover:text-[#00BFA6] transition">
              <span>View applications</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#00BFA6]/10 text-[#00BFA6] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Briefcase className="w-6 h-6" />
          </div>
        </Link>

        {/* Saved */}
        <Link
          to={ROUTES.SAVED_JOBS}
          className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0E2233] border border-[#D8E4EA] dark:border-[#1F2D3D] shadow-card hover:shadow-card-hover hover:border-[#00BFA6]/60 hover:-translate-y-0.5 transition-all duration-200 group flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-[#6B8699] dark:text-[#8CA6B7] uppercase tracking-wider block">
              Saved
            </span>
            <span className="text-3xl font-extrabold text-[#1F2D3D] dark:text-white tracking-tight block">
              {savedJobsCount}
            </span>
            <span className="text-xs text-[#6B8699] dark:text-[#8CA6B7] flex items-center gap-1 font-medium group-hover:text-[#00BFA6] transition">
              <span>View saved jobs</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#E8F1F5] dark:bg-[#132B3E] text-[#1F2D3D] dark:text-[#BACDD8] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Bookmark className="w-6 h-6" />
          </div>
        </Link>

        {/* Invites */}
        <Link
          to={ROUTES.INVITATIONS}
          className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0E2233] border border-[#D8E4EA] dark:border-[#1F2D3D] shadow-card hover:shadow-card-hover hover:border-[#00BFA6]/60 hover:-translate-y-0.5 transition-all duration-200 group flex items-center justify-between relative"
        >
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-[#6B8699] dark:text-[#8CA6B7] uppercase tracking-wider block">
              Invites
            </span>
            <span className="text-3xl font-extrabold text-[#1F2D3D] dark:text-white tracking-tight block">
              {pendingInvitesCount}
            </span>
            <span className="text-xs text-[#6B8699] dark:text-[#8CA6B7] flex items-center gap-1 font-medium group-hover:text-[#00BFA6] transition">
              <span>View invitations</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#00BFA6]/10 text-[#00BFA6] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform relative">
            <Mail className="w-6 h-6" />
            {pendingInvitesCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-rose-600 ring-2 ring-white dark:ring-[#0E2233]" />
            )}
          </div>
        </Link>
      </div>

      {/* 4. Category Filter Chips (ALL, REMOTE, FULL-TIME, etc. - matching Flutter) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <div className="inline-flex items-center gap-1.5 p-1 rounded-2xl bg-[#E8F1F5] dark:bg-[#0A1A27] border border-[#D8E4EA] dark:border-[#1F2D3D]">
          {CATEGORIES.map((category) => {
            const isSelected = selectedCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-all duration-150 cursor-pointer ${
                  isSelected
                    ? 'bg-[#00BFA6] text-white shadow-xs font-bold'
                    : 'text-[#1F2D3D] dark:text-[#BACDD8] hover:text-[#0E2233] dark:hover:text-white hover:bg-white/80 dark:hover:bg-[#132B3E]'
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Recommended Jobs Section (matching Flutter home_tab.dart) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-1">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[#1F2D3D] dark:text-white tracking-tight">
              Recommended for You
            </h2>
            <p className="text-xs text-[#6B8699] dark:text-[#8CA6B7]">
              Matched based on your skills, experience, and interests.
            </p>
          </div>
          <Link
            to={ROUTES.JOBS}
            className="text-xs font-bold text-[#00BFA6] hover:text-[#00A892] transition inline-flex items-center gap-1"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Jobs Feed */}
        {loadingJobs ? (
          <div className="py-12 flex justify-center">
            <LoadingSpinner size="md" label="Loading recommended roles..." />
          </div>
        ) : recommendedJobs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#D8E4EA] dark:border-[#1F2D3D] bg-white/60 dark:bg-[#0E2233]/60 p-10 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-xl bg-[#E8F1F5] dark:bg-[#132B3E] flex items-center justify-center text-[#6B8699]">
              <Briefcase className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#1F2D3D] dark:text-white">
              No matching jobs found
            </h3>
            <p className="text-xs sm:text-sm text-[#6B8699] dark:text-[#8CA6B7] max-w-md mx-auto leading-relaxed">
              No jobs match your current profile. Tap &quot;View All&quot; to explore all available opportunities.
            </p>
            <div className="pt-2">
              <Link
                to={ROUTES.JOBS}
                className="inline-block px-5 py-2.5 bg-[#00BFA6] hover:bg-[#00A892] text-white text-xs font-bold rounded-xl transition shadow-xs"
              >
                Explore All Jobs
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {recommendedJobs.map((job) => (
              <JobCard
                key={job.jobId}
                job={job}
                candidateSkills={candidate?.skills || []}
                isSaved={candidate?.savedJobIds?.includes(job.jobId) || false}
                isApplied={appliedJobIds.has(job.jobId)}
                onSaveToggle={handleSaveToggle}
                onApplyClick={(j) => setApplyingJob(j)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 6. Top Companies Section (matching Flutter home_tab.dart) */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between pb-1">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[#1F2D3D] dark:text-white tracking-tight">
              Top Companies
            </h2>
            <p className="text-xs text-[#6B8699] dark:text-[#8CA6B7]">
              Leading employers actively seeking talent on TalentBay.
            </p>
          </div>
          <Link
            to={ROUTES.COMPANIES}
            className="text-xs font-bold text-[#00BFA6] hover:text-[#00A892] transition inline-flex items-center gap-1"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loadingCompanies ? (
          <div className="py-8 flex justify-center">
            <LoadingSpinner size="sm" label="Loading top employers..." />
          </div>
        ) : topCompanies.length === 0 ? (
          <p className="text-xs text-[#6B8699] dark:text-[#8CA6B7] py-4 text-center">
            No companies available
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {topCompanies.map((company) => (
              <Link
                key={company.id}
                to={`/companies/${company.id}`}
                className="p-5 rounded-2xl bg-white dark:bg-[#0E2233] border border-[#D8E4EA] dark:border-[#1F2D3D] flex flex-col items-center justify-center text-center hover:border-[#00BFA6]/60 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 group h-40 shadow-card"
              >
                <div className="w-14 h-14 rounded-2xl border border-[#D8E4EA] dark:border-[#1F2D3D] bg-[#E8F1F5]/60 dark:bg-[#0A1A27] overflow-hidden flex items-center justify-center mb-3 shadow-2xs group-hover:scale-105 transition-transform p-2.5">
                  {company.profile?.logoUrl || company.logoUrl ? (
                    <img
                      src={company.profile?.logoUrl || company.logoUrl}
                      alt={company.profile?.companyName || company.companyName || 'Company'}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <Building2 className="w-6 h-6 text-[#6B8699] dark:text-[#8CA6B7]" />
                  )}
                </div>
                <h4 className="text-xs font-bold text-[#1F2D3D] dark:text-white truncate max-w-full tracking-tight group-hover:text-[#00BFA6] transition-colors">
                  {company.profile?.companyName || company.companyName}
                </h4>
                <p className="text-[11px] text-[#6B8699] dark:text-[#8CA6B7] truncate max-w-full mt-0.5 font-medium">
                  {company.profile?.industry || 'Technology'}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Signature Brand Banner matching TalentBay Identity */}
      <div className="relative rounded-2xl bg-gradient-to-r from-[#0E2233] via-[#0E2233] to-[#0E2233] border border-[#1F2D3D] p-5 sm:p-6 text-white shadow-card overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Subtle decorative teal glow on the right */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-[#00BFA6]/25 via-transparent to-transparent pointer-events-none" />
        
        <div className="flex items-center gap-4 relative z-10">
          <img
            src="/candidate_logo.png"
            alt="TalentBay Candidate"
            className="w-10 h-10 rounded-xl object-contain shrink-0 shadow-md"
          />
          <div className="h-8 w-px bg-white/20 hidden sm:block" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-white tracking-tight">TalentBay</span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#00BFA6]/20 text-[#00BFA6] border border-[#00BFA6]/40">Candidate</span>
            </div>
            <p className="text-[10px] tracking-widest text-[#8CA6B7] uppercase font-semibold">
              YOUR NEXT CAREER STARTS HERE
            </p>
          </div>
        </div>

        <div className="text-xs sm:text-sm text-[#BACDD8] font-medium relative z-10 text-center md:text-right">
          Modern. Professional. Built for{' '}
          <span className="text-[#00BFA6] font-bold">Your Future.</span>
        </div>
      </div>

      {/* Apply Modal */}
      {applyingJob && candidate && (
        <ApplyJobModal
          isOpen={Boolean(applyingJob)}
          job={applyingJob}
          candidate={candidate}
          onClose={() => setApplyingJob(null)}
          onSuccess={() => {
            setApplyingJob(null);
            if (candidate?.uid) {
              jobService.getCandidateApplications(candidate.uid).then(setCandidateApplications);
            }
          }}
        />
      )}
    </div>
  );
};

export default DashboardPage;
