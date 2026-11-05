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
      // Sort by totalApplicants descending matching Flutter
      const sorted = [...companies].sort((a, b) => {
        const countA = a.stats?.totalApplicants || 0;
        const countB = b.stats?.totalApplicants || 0;
        return countB - countA;
      });
      setTopCompanies(sorted.slice(0, 5));
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

  // Full Name formatting
  const candidateFullName = useMemo(() => {
    const fName = candidate?.firstName?.trim() || '';
    const lName = candidate?.lastName?.trim() || '';
    const full = `${fName} ${lName}`.trim();
    if (full) return full;
    return user?.displayName || user?.email?.split('@')[0] || 'Candidate';
  }, [candidate?.firstName, candidate?.lastName, user?.displayName, user?.email]);

  // Applications Excluded IDs (matching Flutter home_tab.dart)
  const { excludedJobIds, appliedJobIds } = useMemo(() => {
    const excluded = new Set<string>();
    const applied = new Set<string>();

    for (const app of candidateApplications) {
      applied.add(app.jobId);
      const status = (app.applicationStatus || '').toLowerCase().trim();
      if (status === 'hired' || status === 'accepted' || status === 'rejected') {
        excluded.add(app.jobId);
      }
    }

    return { excludedJobIds: excluded, appliedJobIds: applied };
  }, [candidateApplications]);

  // Load Recent Searches from localStorage (matching Flutter search history match)
  const recentSearches = useMemo(() => {
    try {
      const raw = localStorage.getItem('search_history');
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => (typeof item === 'string' ? item : item?.query || '')).filter(Boolean);
      }
    } catch {
      // Ignore
    }
    return [];
  }, []);

  // Filter Recommended Jobs (matching Flutter home_tab.dart top 5 logic)
  const recommendedJobs = useMemo(() => {
    const candidateDesignation = (candidate?.designation || '').toLowerCase().trim();
    const candidateSkills = (candidate?.skills || []).map((s) => s.name.toLowerCase().trim());
    const hasProfileData = Boolean(candidateDesignation || candidateSkills.length > 0);
    const hasSearchData = recentSearches.length > 0;

    const filtered = jobs.filter((job) => {
      // 1. Exclude terminal statuses
      if (excludedJobIds.has(job.jobId)) return false;

      // 2. Category Filter
      if (selectedCategory !== 'All') {
        if (selectedCategory === 'Remote') {
          const isRemote =
            job.workMode.toLowerCase().includes('remote') ||
            (job.locations && job.locations.some((l) => l.toLowerCase().includes('remote'))) ||
            (job.jobLocation?.city && job.jobLocation.city.toLowerCase().includes('remote'));
          if (!isRemote) return false;
        } else {
          if (job.employmentType.toLowerCase() !== selectedCategory.toLowerCase()) {
            return false;
          }
        }
      }

      // 3. Profile Match
      let matchesProfile = false;
      if (candidateDesignation) {
        if (
          job.roleName.toLowerCase().includes(candidateDesignation) ||
          (job.title && job.title.toLowerCase().includes(candidateDesignation)) ||
          (job.designationName && job.designationName.toLowerCase().includes(candidateDesignation))
        ) {
          matchesProfile = true;
        }
      }

      if (!matchesProfile && candidateSkills.length > 0) {
        const jobRequired = [
          ...job.skillsRequired,
          ...job.mustHaveSkills,
          ...job.niceToHaveSkills,
        ].map((s) => s.toLowerCase());

        for (const skill of candidateSkills) {
          if (jobRequired.some((req) => req.includes(skill) || skill.includes(req))) {
            matchesProfile = true;
            break;
          }
        }
      }

      // 4. Search History Match
      let matchesSearch = false;
      if (!matchesProfile && hasSearchData) {
        for (const q of recentSearches) {
          const queryLower = q.toLowerCase();
          if (
            job.roleName.toLowerCase().includes(queryLower) ||
            (job.title && job.title.toLowerCase().includes(queryLower)) ||
            (job.companyName && job.companyName.toLowerCase().includes(queryLower)) ||
            job.skillsRequired.some((s) => s.toLowerCase().includes(queryLower))
          ) {
            matchesSearch = true;
            break;
          }
        }
      }

      // If user has no profile data and no search history, show active jobs
      if (!hasProfileData && !hasSearchData) {
        return true;
      }

      return matchesProfile || matchesSearch;
    });

    return filtered.slice(0, 5);
  }, [jobs, excludedJobIds, selectedCategory, candidate, recentSearches]);

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
      <div className="relative rounded-3xl bg-gradient-to-br from-[#070b14] via-[#0b1329] to-[#0f1f3d] text-white p-6 sm:p-8 shadow-card overflow-hidden border border-brand-500/20">
        {/* Ambient subtle light glows */}
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-brand-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-brand-600/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Top Row: Greeting & Right Quick Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md text-brand-200 border border-white/15">
                <Sparkles className="w-3.5 h-3.5 text-brand-300" />
                <span>Career Hub</span>
                {candidate?.isPremium && (
                  <span className="ml-1 px-1.5 py-0.2 rounded text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/40 font-bold">
                    PRO
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Welcome back, {candidateFullName}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                Discover matching opportunities, assess skills, and monitor recruitment progress.
              </p>
            </div>

            {/* Quick Action Controls */}
            <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
              <Link
                to={ROUTES.NOTIFICATIONS}
                className="relative p-2.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/15 text-white transition backdrop-blur-md"
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
                className="w-10 h-10 rounded-xl border border-white/25 overflow-hidden bg-white/10 hover:bg-white/20 transition flex items-center justify-center backdrop-blur-md"
                title="My Profile"
              >
                {candidate?.photoUrl ? (
                  <img
                    src={candidate.photoUrl}
                    alt={candidateFullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-brand-200" />
                )}
              </Link>
            </div>
          </div>

          {/* Embedded Glassmorphic Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <div className="relative flex items-center bg-white/10 dark:bg-black/40 backdrop-blur-md border border-white/20 rounded-2xl p-1.5 focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-400/30 transition-all shadow-inner">
              <Search className="w-5 h-5 text-slate-300 absolute left-4 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search jobs, tech stacks, locations or companies..."
                className="w-full pl-11 pr-28 py-2.5 bg-transparent text-sm font-medium text-white placeholder:text-slate-300 focus:outline-none"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer shrink-0"
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
          className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#131f37] border border-slate-200/90 dark:border-[#1e2f52] shadow-card hover:shadow-card-hover hover:border-brand-400 dark:hover:border-brand-600 hover:-translate-y-0.5 transition-all duration-200 group flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              Applied
            </span>
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight block">
              {applicationsCount}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium group-hover:text-brand-600 dark:group-hover:text-brand-400 transition">
              <span>View applications</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Briefcase className="w-6 h-6" />
          </div>
        </Link>

        {/* Saved */}
        <Link
          to={ROUTES.SAVED_JOBS}
          className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#131f37] border border-slate-200/90 dark:border-[#1e2f52] shadow-card hover:shadow-card-hover hover:border-brand-400 dark:hover:border-brand-600 hover:-translate-y-0.5 transition-all duration-200 group flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              Saved
            </span>
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight block">
              {savedJobsCount}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium group-hover:text-brand-600 dark:group-hover:text-brand-400 transition">
              <span>View saved jobs</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Bookmark className="w-6 h-6" />
          </div>
        </Link>

        {/* Invites */}
        <Link
          to={ROUTES.INVITATIONS}
          className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#131f37] border border-slate-200/90 dark:border-[#1e2f52] shadow-card hover:shadow-card-hover hover:border-brand-400 dark:hover:border-brand-600 hover:-translate-y-0.5 transition-all duration-200 group flex items-center justify-between relative"
        >
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              Invites
            </span>
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight block">
              {pendingInvitesCount}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium group-hover:text-brand-600 dark:group-hover:text-brand-400 transition">
              <span>View invitations</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform relative">
            <Mail className="w-6 h-6" />
            {pendingInvitesCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-rose-600 ring-2 ring-white dark:ring-slate-900" />
            )}
          </div>
        </Link>
      </div>

      {/* 4. Category Filter Chips (ALL, REMOTE, FULL-TIME, etc. - matching Flutter) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <div className="inline-flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100/80 dark:bg-[#131f37] border border-slate-200/80 dark:border-[#1e2f52]">
          {CATEGORIES.map((category) => {
            const isSelected = selectedCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-all duration-150 cursor-pointer ${
                  isSelected
                    ? 'bg-brand-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60'
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
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Recommended for You
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Matched based on your skills, experience, and interests.
            </p>
          </div>
          <Link
            to={ROUTES.JOBS}
            className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition inline-flex items-center gap-1"
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
          <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-10 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <Briefcase className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              No matching jobs found
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              No jobs match your current profile. Tap &quot;View All&quot; to explore all available opportunities.
            </p>
            <div className="pt-2">
              <Link
                to={ROUTES.JOBS}
                className="inline-block px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
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
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Top Companies
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Leading employers actively seeking talent on TalentBay.
            </p>
          </div>
          <Link
            to={ROUTES.COMPANIES}
            className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition inline-flex items-center gap-1"
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
          <p className="text-xs text-slate-500 dark:text-slate-400 py-4 text-center">
            No companies available
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {topCompanies.map((company) => (
              <Link
                key={company.id}
                to={`/companies/${company.id}`}
                className="p-5 rounded-2xl bg-white dark:bg-[#131f37] border border-slate-200/80 dark:border-[#1e2f52] flex flex-col items-center justify-center text-center hover:border-brand-300 dark:hover:border-brand-700/60 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 group h-40 shadow-card"
              >
                <div className="w-14 h-14 rounded-2xl border border-slate-100 dark:border-[#1e2f52] bg-slate-50/80 dark:bg-[#0e1628] overflow-hidden flex items-center justify-center mb-3 shadow-2xs group-hover:scale-105 transition-transform p-2.5">
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
                    <Building2 className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                  )}
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-full tracking-tight group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                  {company.profile?.companyName || company.companyName}
                </h4>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate max-w-full mt-0.5 font-medium">
                  {company.profile?.industry || 'Technology'}
                </p>
              </Link>
            ))}
          </div>
        )}
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
