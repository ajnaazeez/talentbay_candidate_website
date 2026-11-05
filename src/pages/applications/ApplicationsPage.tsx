import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Briefcase,
  Bookmark,
  CheckCircle2,
  Mail,
  Building2,
  RefreshCw,
  AlertCircle,
  MessageSquare,
  Sparkles,
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
          jobService
            .getJobsByIds(uniqueJobIds)
            .then((jobsList) => {
              setJobsMap((prev) => {
                const updated = new Map(prev);
                jobsList.forEach((j) => updated.set(j.jobId, j));
                return updated;
              });
            })
            .catch((err) => console.error('[Activity] Error fetching application jobs:', err));
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

  // 2. Fetch Saved Jobs when "saved" tab becomes active
  useEffect(() => {
    if (activeTab !== 'saved') return;
    const savedIds = candidate?.savedJobIds || [];
    if (savedIds.length === 0) {
      setSavedJobs([]);
      return;
    }

    let isMounted = true;
    setLoadingSaved(true);

    jobService
      .getJobsByIds(savedIds)
      .then((res) => {
        if (isMounted) setSavedJobs(res);
      })
      .catch((err) => console.error('[Activity] Error loading saved jobs:', err))
      .finally(() => {
        if (isMounted) setLoadingSaved(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeTab, candidate?.savedJobIds]);

  // Filter: Applied Applications (excluding invited, matching Flutter line 265-276)
  const appliedApplications = useMemo(() => {
    return applications.filter((app) => {
      const status = (app.applicationStatus || '').toLowerCase().trim();
      return status !== 'invited';
    });
  }, [applications]);

  // Filter: Accepted / Hired Applications (matching Flutter line 290-302)
  const acceptedApplications = useMemo(() => {
    return applications.filter((app) => {
      const status = (app.applicationStatus || '').toLowerCase().trim();
      return status === 'hired' || status === 'accepted';
    });
  }, [applications]);

  // Direct Message action (matching Flutter activity_tab.dart lines 559-640)
  const handleMessageRecruiter = async (job: Job | null, applicationId: string) => {
    if (!candidate?.uid || !job) return;

    try {
      setConnectingChatId(applicationId);
      const conversationId = await chatService.getOrCreateChat({
        candidateId: candidate.uid,
        recruiterId: job.recruiterId || 'recruiter_default',
        jobId: job.jobId,
      });

      navigate(ROUTES.CHAT, { state: { activeChatId: conversationId } });
    } catch (err) {
      console.error('[Activity] Failed to launch chat with recruiter:', err);
      navigate(ROUTES.CHAT);
    } finally {
      setConnectingChatId(null);
    }
  };

  // Status Chip Renderer matching Recruiter Web standard
  const renderStatusChip = (statusRaw?: string) => {
    const status = (statusRaw || '').toLowerCase().trim();
    let label = 'APPLIED';
    let chipClass = 'bg-sky-50 text-sky-700 border-sky-200/80 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/60';
    let dotColor = 'bg-sky-500';

    switch (status) {
      case 'hired':
      case 'accepted':
        label = 'HIRED';
        chipClass = 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60';
        dotColor = 'bg-emerald-500';
        break;
      case 'rejected':
        label = 'REJECTED';
        chipClass = 'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60';
        dotColor = 'bg-rose-500';
        break;
      case 'interview':
      case 'interviewing':
        label = 'INTERVIEW';
        chipClass = 'bg-brand-50 text-brand-700 border-brand-200/80 dark:bg-brand-950/40 dark:text-brand-300 dark:border-brand-800/60';
        dotColor = 'bg-brand-500';
        break;
      case 'shortlisted':
      case 'screening':
        label = 'SHORTLISTED';
        chipClass = 'bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60';
        dotColor = 'bg-blue-500';
        break;
      default:
        label = 'APPLIED';
        chipClass = 'bg-sky-50 text-sky-700 border-sky-200/80 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/60';
        dotColor = 'bg-sky-500';
    }

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full border shadow-2xs ${chipClass}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
        <span>{label}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20 animate-in fade-in duration-300">
      {/* 1. Header: Title & Direct Messages Icon (matching Flutter activity_tab.dart) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            My Activity
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            Track your job applications, saved opportunities, and offers.
          </p>
        </div>

        {/* Mail / Chat Icon with Live Unread Badge */}
        <Link
          to={ROUTES.CHAT}
          className="relative self-start sm:self-auto p-2.5 rounded-xl border border-slate-200/90 dark:border-[#1e2f52] bg-white dark:bg-[#131f37] text-slate-600 dark:text-slate-300 hover:border-brand-400 dark:hover:border-brand-600 transition shadow-xs flex items-center gap-2"
          title="Direct Messages"
        >
          <Mail className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          <span className="text-xs font-bold text-slate-900 dark:text-white hidden sm:inline">Messages</span>
          {unreadChatsCount > 0 && (
            <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-brand-600 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
              {unreadChatsCount > 9 ? '9+' : unreadChatsCount}
            </span>
          )}
        </Link>
      </div>

      {/* 2. Three Tabs: APPLIED, SAVED, ACCEPTED (Segmented Web Navigation) */}
      <div className="inline-flex p-1.5 rounded-2xl bg-slate-100/80 dark:bg-[#0e1628] border border-slate-200/80 dark:border-[#1e2f52] gap-1.5">
        <button
          type="button"
          onClick={() => setActiveTab('applied')}
          className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold tracking-wide transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'applied'
              ? 'bg-white dark:bg-[#131f37] text-brand-600 dark:text-brand-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>Applied</span>
          {appliedApplications.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[11px] bg-slate-100 dark:bg-[#182644] text-slate-600 dark:text-slate-300">
              {appliedApplications.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('saved')}
          className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold tracking-wide transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'saved'
              ? 'bg-white dark:bg-[#131f37] text-brand-600 dark:text-brand-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>Saved</span>
          {(candidate?.savedJobIds?.length || 0) > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[11px] bg-slate-100 dark:bg-[#182644] text-slate-600 dark:text-slate-300">
              {candidate?.savedJobIds?.length || 0}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('accepted')}
          className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold tracking-wide transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'accepted'
              ? 'bg-white dark:bg-[#131f37] text-brand-600 dark:text-brand-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>Accepted</span>
          {acceptedApplications.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[11px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-bold">
              {acceptedApplications.length}
            </span>
          )}
        </button>
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
              <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
              <p className="text-sm font-bold text-slate-900 dark:text-white">{appsError}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white text-xs font-bold rounded-xl hover:bg-brand-700 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Retry
              </button>
            </div>
          ) : appliedApplications.length === 0 ? (
            /* Empty State (matching Flutter) */
            <div className="rounded-2xl border border-dashed border-slate-200 dark:border-[#1e2f52] bg-white/60 dark:bg-[#131f37]/40 p-12 text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 dark:bg-[#0e1628] flex items-center justify-center text-slate-400">
                <Briefcase className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                No Applications Yet
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Explore available roles and start applying to track your progress here.
              </p>
              <div className="pt-2">
                <Link
                  to={ROUTES.JOBS}
                  className="inline-block px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
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
                    className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#131f37] border border-slate-200/90 dark:border-[#1e2f52] hover:border-brand-400 dark:hover:border-brand-600 hover:shadow-card-hover transition-all duration-200 space-y-4 shadow-card"
                  >
                    {/* Top Row: Company Logo & Details */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        {/* Logo (56x56) */}
                        <div className="w-14 h-14 rounded-2xl border border-slate-100 dark:border-[#1e2f52] bg-slate-50 dark:bg-[#0e1628] overflow-hidden shrink-0 flex items-center justify-center p-2 shadow-2xs">
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
                            <Building2 className="w-6 h-6 text-slate-400" />
                          )}
                        </div>

                        {/* Job Title & Company */}
                        <div className="space-y-1 min-w-0">
                          <Link
                            to={`/jobs/${app.jobId}`}
                            className="text-base sm:text-lg font-bold text-slate-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 transition line-clamp-1"
                          >
                            {job?.title || job?.roleName || app.jobTitle || 'Role Details'}
                          </Link>
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            {job?.companyName || 'Company'}
                          </p>
                          <div className="pt-1.5">
                            {renderStatusChip(app.applicationStatus)}
                          </div>
                        </div>
                      </div>

                      {/* Applied Date badge */}
                      <span className="text-xs font-medium text-slate-400 dark:text-slate-500 shrink-0 hidden sm:inline">
                        Applied {formatDate(app.appliedAt)}
                      </span>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-slate-100 dark:border-[#1e2f52]/80" />

                    {/* Bottom Row: Applied Date (mobile) & Conditional MESSAGE Action */}
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-slate-400 dark:text-slate-500 text-[11px] sm:hidden">
                        Applied {formatDate(app.appliedAt)}
                      </span>

                      <div className="ml-auto flex items-center gap-3">
                        {/* Only clickable if Shortlisted (matching Flutter line 559-640) */}
                        {isShortlisted ? (
                          <button
                            type="button"
                            disabled={isConnecting}
                            onClick={() => handleMessageRecruiter(job, app.applicationId)}
                            className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-xs transition cursor-pointer inline-flex items-center gap-1.5"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>{isConnecting ? 'Connecting...' : 'Message Recruiter'}</span>
                          </button>
                        ) : (
                          <span className="text-xs font-semibold text-slate-400 dark:text-slate-600 cursor-not-allowed select-none px-3 py-1">
                            Message (Shortlist Required)
                          </span>
                        )}
                      </div>
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
            <div className="rounded-2xl border border-dashed border-slate-200 dark:border-[#1e2f52] bg-white/60 dark:bg-[#131f37]/40 p-12 text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 dark:bg-[#0e1628] flex items-center justify-center text-slate-400">
                <Bookmark className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                No Saved Jobs
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Bookmark job openings you find interesting to view and apply later.
              </p>
              <div className="pt-2">
                <Link
                  to={ROUTES.JOBS}
                  className="inline-block px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
                >
                  Browse Vacancies
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {savedJobs.map((job) => (
                <JobCard
                  key={job.jobId}
                  job={job}
                  candidateSkills={candidate?.skills || []}
                  isSaved={true}
                  isApplied={applications.some((a) => a.jobId === job.jobId)}
                  onSaveToggle={async (jobId, isSaved) => {
                    if (!candidate?.uid) return;
                    if (!isSaved) {
                      await jobService.unsaveJob(candidate.uid, jobId);
                      setSavedJobs((prev) => prev.filter((j) => j.jobId !== jobId));
                    }
                    await refreshCandidate();
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ACCEPTED (Matching Flutter _AcceptedJobsView) */}
      {activeTab === 'accepted' && (
        <div className="space-y-4">
          {acceptedApplications.length === 0 ? (
            /* Empty State (matching Flutter) */
            <div className="rounded-2xl border border-dashed border-slate-200 dark:border-[#1e2f52] bg-white/60 dark:bg-[#131f37]/40 p-12 text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                No Accepted Jobs
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                When a recruiter accepts or hires you for a role, it will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {acceptedApplications.map((app) => {
                const job = jobsMap.get(app.jobId) || null;
                const isConnecting = connectingChatId === app.applicationId;

                return (
                  <div
                    key={app.applicationId || app.id}
                    className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#131f37] border border-emerald-200/80 dark:border-emerald-800/60 hover:shadow-card-hover transition-all duration-200 space-y-4 shadow-card"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-2xl border border-slate-100 dark:border-[#1e2f52] bg-slate-50 dark:bg-[#0e1628] overflow-hidden shrink-0 flex items-center justify-center p-2 shadow-2xs">
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
                            <Building2 className="w-6 h-6 text-slate-400" />
                          )}
                        </div>

                        <div className="space-y-1 min-w-0">
                          <Link
                            to={`/jobs/${app.jobId}`}
                            className="text-base sm:text-lg font-bold text-slate-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 transition line-clamp-1"
                          >
                            {job?.title || job?.roleName || app.jobTitle || 'Role Details'}
                          </Link>
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            {job?.companyName || 'Company'}
                          </p>
                          <div className="pt-1.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                              <Sparkles className="w-3 h-3 text-emerald-600" />
                              <span>OFFER ACCEPTED / HIRED</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <span className="text-xs font-medium text-slate-400 dark:text-slate-500 shrink-0 hidden sm:inline">
                        Hired on {formatDate(app.appliedAt)}
                      </span>
                    </div>

                    <div className="border-t border-slate-100 dark:border-[#1e2f52]/80" />

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 dark:text-slate-500 text-[11px] sm:hidden">
                        Hired on {formatDate(app.appliedAt)}
                      </span>
                      <button
                        type="button"
                        disabled={isConnecting}
                        onClick={() => handleMessageRecruiter(job, app.applicationId)}
                        className="ml-auto px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-xs transition cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{isConnecting ? 'Connecting...' : 'Message Recruiter'}</span>
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

export default ApplicationsPage;
