import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Briefcase,
  Bookmark,
  CheckCircle2,
  Mail,
  Building2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { jobService } from '@/services/jobService';
import { chatService } from '@/services/chatService';
import { JobCard } from '@/components/jobs/JobCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ROUTES } from '@/utils/constants';
import type { Job, JobApplication } from '@/types';

type ActivityTab = 'applied' | 'saved' | 'accepted';

function formatDate(isoOrDate: string | Date | undefined): string {
  if (!isoOrDate) return '';
  const d = new Date(isoOrDate);
  if (isNaN(d.getTime())) return '';
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

export const ApplicationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { candidate, refreshCandidate } = useAuth();
  const { unreadChatsCount } = useNotifications();

  // Active Tab state (synced with ?tab= query parameter)
  const queryTab = (searchParams.get('tab') || '').toLowerCase();
  const activeTab: ActivityTab = useMemo(() => {
    if (queryTab === 'saved') return 'saved';
    if (queryTab === 'accepted') return 'accepted';
    return 'applied';
  }, [queryTab]);

  const setActiveTab = (tab: ActivityTab) => {
    setSearchParams(tab === 'applied' ? {} : { tab });
  };

  // Applications & Jobs States
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [appsError, setAppsError] = useState<string | null>(null);

  // Cached Map of Job details (jobId -> Job)
  const [jobsMap, setJobsMap] = useState<Map<string, Job>>(new Map());

  // Saved Jobs State
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);

  // Chat initiation state
  const [connectingChatId, setConnectingChatId] = useState<string | null>(null);

  // 1. Subscribe to Candidate Applications (Realtime Firestore listener matching Flutter)
  useEffect(() => {
    if (!candidate?.uid) {
      setApplications([]);
      setLoadingApps(false);
      return;
    }

    setLoadingApps(true);
    setAppsError(null);

    const unsub = jobService.subscribeToCandidateApplications(
      candidate.uid,
      (apps) => {
        setApplications(apps);
        setLoadingApps(false);

        // Fetch details for any newly discovered job IDs
        const uniqueJobIds = Array.from(new Set(apps.map((a) => a.jobId))).filter(Boolean);
        if (uniqueJobIds.length > 0) {
          jobService.getJobsByIds(uniqueJobIds).then((jobsList) => {
            setJobsMap((prev) => {
              const updated = new Map(prev);
              jobsList.forEach((j) => updated.set(j.jobId, j));
              return updated;
            });
          }).catch((err) => console.error('[Activity] Error fetching application jobs:', err));
        }
      },
      (err) => {
        console.error('[Activity] Error loading applications:', err);
        setAppsError('Error loading applications. Please tap retry.');
        setLoadingApps(false);
      }
    );

    return () => unsub();
  }, [candidate?.uid]);

  // 2. Fetch Saved Jobs when candidate changes or Saved tab is opened
  const fetchSavedJobs = useCallback(async () => {
    const savedIds = candidate?.savedJobIds || [];
    if (savedIds.length === 0) {
      setSavedJobs([]);
      return;
    }

    setLoadingSaved(true);
    try {
      const list = await jobService.getJobsByIds(savedIds);
      setSavedJobs(list);
    } catch (err) {
      console.error('[Activity] Error fetching saved jobs:', err);
    } finally {
      setLoadingSaved(false);
    }
  }, [candidate?.savedJobIds]);

  useEffect(() => {
    fetchSavedJobs();
  }, [fetchSavedJobs]);

  // Filter 1: APPLIED tab (exclude hired and accepted)
  const appliedApplications = useMemo(() => {
    return applications.filter((app) => {
      const st = (app.applicationStatus || '').toLowerCase().trim();
      return st !== 'hired' && st !== 'accepted';
    });
  }, [applications]);

  // Filter 2: ACCEPTED tab (only hired and accepted)
  const acceptedApplications = useMemo(() => {
    return applications.filter((app) => {
      const st = (app.applicationStatus || '').toLowerCase().trim();
      return st === 'hired' || st === 'accepted';
    });
  }, [applications]);

  // Handle Unsave Bookmark
  const handleUnsaveJob = async (jobId: string) => {
    if (!candidate?.uid) return;
    try {
      await jobService.unsaveJob(candidate.uid, jobId);
      setSavedJobs((prev) => prev.filter((j) => j.jobId !== jobId));
      await refreshCandidate();
    } catch (err) {
      console.error('[Activity] Error unsaving job:', err);
    }
  };

  // Handle Start / Open Chat with Recruiter
  const handleMessageRecruiter = async (job: Job | null, applicationId: string) => {
    if (!candidate?.uid) return;
    if (!job || !job.recruiterId) {
      alert('Cannot message: Recruiter info is missing for this position.');
      return;
    }

    setConnectingChatId(applicationId);
    try {
      const chatId = await chatService.getOrCreateChat({
        jobId: job.jobId,
        candidateId: candidate.uid,
        recruiterId: job.recruiterId,
      });
      navigate(ROUTES.CHAT, { state: { activeChatId: chatId } });
    } catch (err) {
      console.error('[Activity] Error connecting to chat:', err);
      alert('Error opening recruiter conversation. Please try again.');
    } finally {
      setConnectingChatId(null);
    }
  };

  // Render Status Chip (matching Flutter _buildStatusChip)
  const renderStatusChip = (rawStatus: string) => {
    const status = (rawStatus || '').toLowerCase().trim();
    let label = rawStatus.toUpperCase();
    let borderClass = 'border-sky-500 text-sky-600 dark:text-sky-400';

    switch (status) {
      case 'selected':
      case 'hired':
        label = 'SELECTED / HIRED';
        borderClass = 'border-emerald-500 text-emerald-600 dark:text-emerald-400';
        break;
      case 'rejected':
      case 'declined':
        label = 'REJECTED';
        borderClass = 'border-red-500 text-red-600 dark:text-red-400';
        break;
      case 'interviewing':
      case 'interview':
        label = 'INTERVIEWING';
        borderClass = 'border-amber-500 text-amber-600 dark:text-amber-400';
        break;
      case 'shortlisted':
      case 'screening':
        label = 'SHORTLISTED';
        borderClass = 'border-blue-500 text-blue-600 dark:text-blue-400';
        break;
      default:
        label = 'APPLIED';
        borderClass = 'border-sky-500 text-sky-600 dark:text-sky-400';
    }

    return (
      <div className={`inline-block px-2.5 py-1 text-[10px] font-black tracking-wider uppercase border rounded-none ${borderClass}`}>
        {label}
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* 1. Custom Header: Title & Direct Messages Navigation Icon (matching Flutter activity_tab.dart) */}
      <div className="flex items-center justify-between pt-2 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-widest font-sans uppercase">
            MY ACTIVITY
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold tracking-wider uppercase mt-0.5">
            Track your applications, saved vacancies and offers
          </p>
        </div>

        {/* Mail / Chat Icon with Live Unread Badge */}
        <Link
          to={ROUTES.CHAT}
          className="relative p-2.5 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-600 transition"
          title="Direct Messages"
        >
          <Mail className="w-5 h-5" />
          {unreadChatsCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
              {unreadChatsCount > 9 ? '9+' : unreadChatsCount}
            </span>
          )}
        </Link>
      </div>

      {/* 2. Three Tabs: APPLIED, SAVED, ACCEPTED (matching Flutter activity_tab.dart TabBar) */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <div className="flex gap-8">
          {/* Applied Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('applied')}
            className={`pb-3 text-xs sm:text-sm font-black tracking-widest uppercase transition-all relative ${
              activeTab === 'applied'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 -mb-[1px]'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            APPLIED
            {appliedApplications.length > 0 && (
              <span className="ml-2 text-xs font-bold text-slate-400">
                ({appliedApplications.length})
              </span>
            )}
          </button>

          {/* Saved Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('saved')}
            className={`pb-3 text-xs sm:text-sm font-black tracking-widest uppercase transition-all relative ${
              activeTab === 'saved'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 -mb-[1px]'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            SAVED
            {(candidate?.savedJobIds?.length || 0) > 0 && (
              <span className="ml-2 text-xs font-bold text-slate-400">
                ({candidate?.savedJobIds?.length || 0})
              </span>
            )}
          </button>

          {/* Accepted Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('accepted')}
            className={`pb-3 text-xs sm:text-sm font-black tracking-widest uppercase transition-all relative ${
              activeTab === 'accepted'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 -mb-[1px]'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            ACCEPTED
            {acceptedApplications.length > 0 && (
              <span className="ml-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                ({acceptedApplications.length})
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 3. TAB CONTENT */}

      {/* TAB 1: APPLIED (Matching Flutter _AppliedJobsView) */}
      {activeTab === 'applied' && (
        <div className="space-y-4">
          {loadingApps ? (
            <div className="py-20 flex justify-center">
              <LoadingSpinner size="md" label="Loading applications..." />
            </div>
          ) : appsError ? (
            <div className="py-16 text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
              <p className="text-sm font-bold text-slate-900 dark:text-white">{appsError}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-bold uppercase tracking-wider hover:bg-indigo-700 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" /> RETRY
              </button>
            </div>
          ) : appliedApplications.length === 0 ? (
            /* Empty State (matching Flutter) */
            <div className="py-20 text-center border border-dashed border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-[#111827]/50 p-8 space-y-3">
              <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                <Briefcase className="w-7 h-7" />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white tracking-wider uppercase">
                NO APPLICATIONS YET
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Start applying to track them here
              </p>
              <div className="pt-2">
                <Link
                  to={ROUTES.JOBS}
                  className="inline-block px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold uppercase tracking-wider hover:opacity-90 transition"
                >
                  Explore Jobs
                </Link>
              </div>
            </div>
          ) : (
            /* Applied Applications List */
            <div className="space-y-4">
              {appliedApplications.map((app) => {
                const job = jobsMap.get(app.jobId) || null;
                const isShortlisted = (app.applicationStatus || '').toLowerCase().trim() === 'shortlisted';
                const isConnecting = connectingChatId === app.applicationId;

                return (
                  <div
                    key={app.applicationId || app.id}
                    className="p-5 sm:p-6 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 transition space-y-4"
                  >
                    {/* Top Row: Company Logo & Details */}
                    <div className="flex items-start gap-4">
                      {/* Logo (48x48) */}
                      <div className="w-12 h-12 rounded-none border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center p-1">
                        {job?.companyLogoUrl ? (
                          <img
                            src={job.companyLogoUrl}
                            alt={job.companyName || 'Company'}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <Building2 className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                        )}
                      </div>

                      {/* Job Title & Company */}
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/jobs/${app.jobId}`}
                          className="text-sm sm:text-base font-black text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition tracking-wide uppercase line-clamp-1"
                        >
                          {job?.title || job?.roleName || app.jobTitle || 'Role Details'}
                        </Link>
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mt-0.5 tracking-wide">
                          {job?.companyName || 'Company'}
                        </p>
                        <div className="mt-3">
                          {renderStatusChip(app.applicationStatus)}
                        </div>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-slate-100 dark:border-slate-800" />

                    {/* Bottom Row: Applied Date & Conditional MESSAGE Action */}
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-500 dark:text-slate-400 tracking-wider uppercase text-[11px]">
                        APPLIED {formatDate(app.appliedAt)}
                      </span>

                      {/* Only clickable if Shortlisted (matching Flutter line 559-640) */}
                      {isShortlisted ? (
                        <button
                          type="button"
                          disabled={isConnecting}
                          onClick={() => handleMessageRecruiter(job, app.applicationId)}
                          className="text-xs font-black tracking-wider uppercase text-slate-900 dark:text-white underline hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
                        >
                          {isConnecting ? 'CONNECTING...' : 'MESSAGE'}
                        </button>
                      ) : (
                        <span className="text-xs font-bold tracking-wider uppercase text-slate-400 dark:text-slate-600 cursor-not-allowed select-none">
                          MESSAGE
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SAVED (Matching Flutter _SavedJobsView) */}
      {activeTab === 'saved' && (
        <div className="space-y-4">
          {loadingSaved ? (
            <div className="py-20 flex justify-center">
              <LoadingSpinner size="md" label="Loading saved vacancies..." />
            </div>
          ) : savedJobs.length === 0 ? (
            /* Empty State (matching Flutter) */
            <div className="py-20 text-center border border-dashed border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-[#111827]/50 p-8 space-y-3">
              <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                <Bookmark className="w-7 h-7" />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white tracking-wider uppercase">
                NO SAVED JOBS
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Save jobs to view them here
              </p>
              <div className="pt-2">
                <Link
                  to={ROUTES.JOBS}
                  className="inline-block px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold uppercase tracking-wider hover:opacity-90 transition"
                >
                  Browse Vacancies
                </Link>
              </div>
            </div>
          ) : (
            /* Saved Jobs List */
            <div className="space-y-4">
              {savedJobs.map((job) => (
                <JobCard
                  key={job.jobId}
                  job={job}
                  candidateSkills={candidate?.skills || []}
                  isSaved={true}
                  onSaveToggle={() => handleUnsaveJob(job.jobId)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ACCEPTED (Matching Flutter _AcceptedJobsView) */}
      {activeTab === 'accepted' && (
        <div className="space-y-4">
          {loadingApps ? (
            <div className="py-20 flex justify-center">
              <LoadingSpinner size="md" label="Loading accepted opportunities..." />
            </div>
          ) : acceptedApplications.length === 0 ? (
            /* Empty State (matching Flutter) */
            <div className="py-20 text-center border border-dashed border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-[#111827]/50 p-8 space-y-3">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white tracking-wider uppercase">
                NO ACCEPTED JOBS YET
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Jobs you are accepted for will appear here
              </p>
            </div>
          ) : (
            /* Accepted Applications List (Distinct Green Border matching Flutter) */
            <div className="space-y-4">
              {acceptedApplications.map((app) => {
                const job = jobsMap.get(app.jobId) || null;
                const isConnecting = connectingChatId === app.applicationId;

                return (
                  <div
                    key={app.applicationId || app.id}
                    className="p-5 sm:p-6 bg-white dark:bg-[#111827] border-2 border-emerald-500 dark:border-emerald-500 transition space-y-4 shadow-xs"
                  >
                    {/* Top Row: Company Logo & Details */}
                    <div className="flex items-start gap-4">
                      {/* Logo (48x48) */}
                      <div className="w-12 h-12 rounded-none border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center p-1">
                        {job?.companyLogoUrl ? (
                          <img
                            src={job.companyLogoUrl}
                            alt={job.companyName || 'Company'}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <Building2 className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                        )}
                      </div>

                      {/* Job Title & Company */}
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/jobs/${app.jobId}`}
                          className="text-sm sm:text-base font-black text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition tracking-wide uppercase line-clamp-1"
                        >
                          {job?.title || job?.roleName || app.jobTitle || 'Role Details'}
                        </Link>
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mt-0.5 tracking-wide">
                          {job?.companyName || 'Company'}
                        </p>
                        <div className="mt-3">
                          <div className="inline-block px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500 text-emerald-600 dark:text-emerald-400 text-[10px] font-black tracking-wider uppercase rounded-none">
                            ACCEPTED / HIRED
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-slate-100 dark:border-slate-800" />

                    {/* Bottom Row: Accepted Date & MESSAGE Action */}
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-500 dark:text-slate-400 tracking-wider uppercase text-[11px]">
                        ACCEPTED ON {formatDate(app.updatedAt || app.appliedAt)}
                      </span>

                      <button
                        type="button"
                        disabled={isConnecting}
                        onClick={() => handleMessageRecruiter(job, app.applicationId)}
                        className="text-xs font-black tracking-wider uppercase text-slate-900 dark:text-white underline hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer"
                      >
                        {isConnecting ? 'CONNECTING...' : 'MESSAGE'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
