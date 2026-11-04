import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search,
  Bell,
  Briefcase,
  Building2,
  User,
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

  // Candidate Name Resolution (matching Flutter home_tab.dart)
  const candidateFullName = useMemo(() => {
    const fName = candidate?.firstName?.trim() || user?.displayName?.split(' ')[0] || '';
    const lName = candidate?.lastName?.trim() || (user?.displayName?.split(' ').length || 0) > 1
      ? user?.displayName?.split(' ').slice(1).join(' ') || ''
      : '';
    const full = `${fName} ${lName}`.trim();
    if (full) return full.toUpperCase();
    if (user?.email) return user.email.split('@')[0].toUpperCase();
    return 'CANDIDATE';
  }, [candidate, user]);

  // Load search history from localStorage (matching Flutter SharedPreferences search_history)
  const recentSearches: string[] = useMemo(() => {
    try {
      const raw = localStorage.getItem('search_history');
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => (typeof item === 'string' ? item : item?.query || '')).filter(Boolean);
      }
      return [];
    } catch {
      return [];
    }
  }, []);

  // Handle Search Submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) {
      navigate(ROUTES.SEARCH);
      return;
    }
    // Save to search_history with timestamp
    try {
      const raw = localStorage.getItem('search_history');
      const existing = raw ? JSON.parse(raw) : [];
      const filtered = Array.isArray(existing)
        ? existing.filter((item: any) => (item?.query || item || '').toLowerCase() !== query.toLowerCase())
        : [];
      const updated = [{ query, timestamp: new Date().toISOString() }, ...filtered].slice(0, 20);
      localStorage.setItem('search_history', JSON.stringify(updated));
    } catch {}
    navigate(`${ROUTES.SEARCH}?q=${encodeURIComponent(query)}`);
  };

  // Excluded, Invited, and Applied Job ID sets (matching Flutter home_tab.dart)
  const { excludedJobIds, appliedJobIds } = useMemo(() => {
    const excluded = new Set<string>();
    const invited = new Set<string>();
    const applied = new Set<string>();

    candidateApplications.forEach((app) => {
      const st = (app.applicationStatus || '').toLowerCase();
      if (st === 'hired' || st === 'accepted' || st === 'rejected') {
        excluded.add(app.jobId);
      } else if (st === 'invited') {
        invited.add(app.jobId);
      } else {
        applied.add(app.jobId);
      }
    });

    return { excludedJobIds: excluded, invitedJobIds: invited, appliedJobIds: applied };
  }, [candidateApplications]);

  // Filtered & Profile-Matched Jobs (matching Flutter home_tab.dart filtering algorithm)
  const recommendedJobs = useMemo(() => {
    const candidateDesignation = (candidate?.designation || '').toLowerCase().trim();
    const candidateSkills = (candidate?.skills || []).map((s) => s.name.toLowerCase());

    const hasProfileData = Boolean(candidateDesignation || candidateSkills.length > 0);
    const hasSearchData = recentSearches.length > 0;

    const filtered = jobs.filter((job) => {
      // 1. Exclude if hired, accepted, or rejected
      if (excludedJobIds.has(job.jobId)) return false;

      // 2. Category Chip Filter
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
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* 1. Header (Greeting, Subtitle & Action Icons - matching Flutter home_tab.dart) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-wider font-sans">
            HELLO, {candidateFullName}
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase">
            FIND YOUR NEXT ROLE
          </p>
        </div>

        {/* Minimal Avatar & Notification Bell */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          <Link
            to={ROUTES.NOTIFICATIONS}
            className="relative p-2.5 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-600 transition"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
              </span>
            )}
          </Link>

          <Link
            to={ROUTES.PROFILE}
            className="w-11 h-11 rounded-full border-2 border-slate-900 dark:border-white overflow-hidden bg-white dark:bg-slate-900 flex items-center justify-center hover:opacity-90 transition shadow-xs"
            title="My Profile"
          >
            {candidate?.photoUrl ? (
              <img
                src={candidate.photoUrl}
                alt={candidateFullName}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-6 h-6 text-slate-700 dark:text-slate-300" />
            )}
          </Link>
        </div>
      </div>

      {/* 2. Minimal Search Bar (matching Flutter home_tab.dart) */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <div className="relative flex items-center">
          <Search className="w-5 h-5 text-slate-400 dark:text-slate-500 absolute left-4 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="SEARCH FOR JOBS, COMPANIES..."
            className="w-full pl-12 pr-28 py-3.5 bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-800 rounded-none text-sm font-semibold tracking-wide text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-indigo-600 dark:focus:border-indigo-500 focus:ring-1 focus:ring-indigo-600 transition"
          />
          <button
            type="submit"
            className="absolute right-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold tracking-wider uppercase transition"
          >
            SEARCH
          </button>
        </div>
      </form>

      {/* 3. Minimal Stats Grid (3 Sharp Cards: APPLIED, SAVED, INVITES - matching Flutter) */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {/* Applied */}
        <Link
          to={ROUTES.APPLICATIONS}
          className="p-5 sm:p-6 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-center hover:border-slate-400 dark:hover:border-slate-600 transition group"
        >
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {applicationsCount}
          </div>
          <div className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mt-1">
            APPLIED
          </div>
        </Link>

        {/* Saved */}
        <Link
          to={ROUTES.SAVED_JOBS}
          className="p-5 sm:p-6 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-center hover:border-slate-400 dark:hover:border-slate-600 transition group"
        >
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {savedJobsCount}
          </div>
          <div className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mt-1">
            SAVED
          </div>
        </Link>

        {/* Invites */}
        <Link
          to={ROUTES.INVITATIONS}
          className="p-5 sm:p-6 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-center hover:border-indigo-500 dark:hover:border-indigo-500 transition group relative"
        >
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {pendingInvitesCount}
          </div>
          <div className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mt-1">
            INVITES
          </div>
          {pendingInvitesCount > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-600" />
          )}
        </Link>
      </div>

      {/* 4. Category Filter Chips (ALL, REMOTE, FULL-TIME, etc. - matching Flutter) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map((category) => {
          const isSelected = selectedCategory === category;
          return (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={`px-5 py-2 text-xs font-bold tracking-wider uppercase whitespace-nowrap transition-all border ${
                isSelected
                  ? 'bg-indigo-600 dark:bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600'
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>

      {/* 5. Recommended Jobs Section (matching Flutter home_tab.dart) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-wider uppercase">
            RECOMMENDED FOR YOU
          </h2>
          <Link
            to={ROUTES.JOBS}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline tracking-wider uppercase"
          >
            VIEW ALL
          </Link>
        </div>

        {/* Jobs Feed */}
        {loadingJobs ? (
          <div className="py-12 flex justify-center">
            <LoadingSpinner size="md" label="Loading recommended roles..." />
          </div>
        ) : recommendedJobs.length === 0 ? (
          <div className="py-14 text-center border border-dashed border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-[#111827]/50 p-8 space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <Briefcase className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              No matching jobs found
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              No jobs match your current profile. Tap &quot;VIEW ALL&quot; to explore all available opportunities.
            </p>
            <div className="pt-2">
              <Link
                to={ROUTES.JOBS}
                className="inline-block px-5 py-2.5 bg-indigo-600 text-white text-xs font-bold uppercase tracking-wider hover:bg-indigo-700 transition"
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
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-wider uppercase">
            TOP COMPANIES
          </h2>
          <Link
            to={ROUTES.COMPANIES}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline tracking-wider uppercase"
          >
            VIEW ALL
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
            {topCompanies.map((company) => (
              <Link
                key={company.id}
                to={`/companies/${company.id}`}
                className="p-4 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center hover:border-slate-400 dark:hover:border-slate-600 transition group h-36"
              >
                <div className="w-12 h-12 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 overflow-hidden flex items-center justify-center mb-3">
                  {company.profile?.logoUrl || company.logoUrl ? (
                    <img
                      src={company.profile?.logoUrl || company.logoUrl}
                      alt={company.profile?.companyName || company.companyName || 'Company'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <Building2 className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  )}
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-full tracking-wide">
                  {company.profile?.companyName || company.companyName}
                </h4>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-full mt-0.5">
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
