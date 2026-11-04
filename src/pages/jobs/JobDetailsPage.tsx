import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Share2,
  Building2,
  School,
  Check,
  MessageCircle,
  Copy,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { jobService } from '@/services/jobService';
import { ApplyJobModal } from '@/components/jobs/ApplyJobModal';
import { JobCard } from '@/components/jobs/JobCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ROUTES } from '@/utils/constants';
import type { Job, JobApplication } from '@/types';

export const JobDetailsPage: React.FC = () => {
  const { jobId: routeJobId, id: fallbackJobId } = useParams<{ jobId?: string; id?: string }>();
  const jobId = routeJobId || fallbackJobId || '';
  const navigate = useNavigate();
  const { candidate, refreshCandidate, user } = useAuth();

  const [job, setJob] = useState<Job | null>(null);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Application & Invite state
  const [isApplying, setIsApplying] = useState(false);
  const [applyModalOpen, setApplyModalOpen] = useState(false);

  // Share dropdown menu
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const shareMenuRef = useRef<HTMLDivElement>(null);

  // Close share menu on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (shareMenuRef.current && !shareMenuRef.current.contains(e.target as Node)) {
        setShareMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch job details, candidate applications & all active jobs for related section
  useEffect(() => {
    if (!jobId) return;

    let isMounted = true;
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [jobData, jobsList, appsList] = await Promise.all([
          jobService.getJobById(jobId),
          jobService.getJobs(),
          candidate?.uid ? jobService.getCandidateApplications(candidate.uid) : Promise.resolve([]),
        ]);

        if (isMounted) {
          setJob(jobData);
          setAllJobs(jobsList);
          setApplications(appsList);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Failed to load opportunity details.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [jobId, candidate?.uid]);

  // Existing application for this job
  const existingApplication = useMemo(() => {
    return applications.find((a) => a.jobId === jobId);
  }, [applications, jobId]);

  const applicationStatus = (existingApplication?.applicationStatus || '').toLowerCase();
  const hasActuallyBeenInvited = existingApplication && applicationStatus === 'invited';
  const hasActuallyApplied = existingApplication && applicationStatus !== 'invited';

  // Handle invitation acceptance
  const handleAcceptInvitation = async () => {
    if (!existingApplication?.applicationId || isApplying) return;
    try {
      setIsApplying(true);
      await jobService.acceptInvitation(existingApplication.applicationId);
      // Refresh candidate applications
      if (candidate?.uid) {
        const updatedApps = await jobService.getCandidateApplications(candidate.uid);
        setApplications(updatedApps);
      }
    } catch (err: any) {
      console.error('Failed to accept invitation:', err);
      setError(err?.message || 'Failed to accept invitation.');
    } finally {
      setIsApplying(false);
    }
  };

  // Handle successful manual application
  const handleApplicationSuccess = (app: JobApplication) => {
    setApplications((prev) => [...prev.filter((a) => a.jobId !== app.jobId), app]);
    setApplyModalOpen(false);
  };

  // Format salary number (matching Flutter _formatNumber)
  const formatNumber = (num: number): string => {
    if (num >= 100000) {
      return `${(num / 100000).toFixed(0)}L`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(0)}K`;
    }
    return num.toString();
  };

  // Format date DD/MM/YYYY
  const formatDate = (dateValue: any): string => {
    if (!dateValue) return 'RECENT';
    try {
      const d = dateValue?.toDate ? dateValue.toDate() : new Date(dateValue);
      return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    } catch {
      return 'RECENT';
    }
  };

  // Share handlers
  const handleShareWhatsApp = () => {
    if (!job) return;
    const link = `https://talentbay.app/job/${job.jobId}`;
    const text = `Check out this job on TalentBay: ${job.roleName} at ${job.companyName || 'TalentBay'}.\n\nApply now: ${link}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    setShareMenuOpen(false);
  };

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => {
        setCopiedLink(false);
        setShareMenuOpen(false);
      }, 2000);
    }
  };

  // Related jobs (matching Flutter _buildRelatedJobs)
  const relatedJobs = useMemo(() => {
    if (!job) return [];
    const others = allJobs.filter((j) => j.jobId !== job.jobId);

    const sorted = [...others].sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      if ((a.roleName || '').toLowerCase() === (job.roleName || '').toLowerCase()) scoreA += 2;
      if (a.companyId === job.companyId) scoreA += 1;

      if ((b.roleName || '').toLowerCase() === (job.roleName || '').toLowerCase()) scoreB += 2;
      if (b.companyId === job.companyId) scoreB += 1;

      return scoreB - scoreA;
    });

    return sorted.slice(0, 3);
  }, [allJobs, job]);

  // Set of applied job IDs for related jobs
  const appliedJobIdsSet = useMemo(() => {
    return new Set(applications.map((a) => a.jobId));
  }, [applications]);

  // Handle bookmark toggle for related jobs
  const handleSaveToggle = async (targetJobId: string, currentSaved: boolean) => {
    if (!candidate?.uid) return;
    if (currentSaved) {
      await jobService.unsaveJob(candidate.uid, targetJobId);
    } else {
      await jobService.saveJob(candidate.uid, targetJobId);
    }
    await refreshCandidate();
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" label="Loading opportunity details..." />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-black uppercase tracking-wider text-slate-900 dark:text-white">
          JOB NOT FOUND
        </h2>
        <p className="text-xs text-slate-500">
          This position may have expired, been closed, or moved.
        </p>
        <button
          onClick={() => navigate(ROUTES.JOBS)}
          className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold uppercase tracking-wider transition"
        >
          BROWSE ALL JOBS
        </button>
      </div>
    );
  }

  const currency = job.salary?.currency || 'INR';
  const minSalary = job.salary?.min || 0;
  const maxSalary = job.salary?.max || 0;
  const salaryString =
    minSalary > 0 || maxSalary > 0
      ? `${currency} ${formatNumber(minSalary)} - ${formatNumber(maxSalary)}`
      : 'Competitive / Undisclosed';

  const expMin = job.experienceRequired?.minYears || 0;
  const expMax = job.experienceRequired?.maxYears || 0;
  const experienceString =
    expMin > 0 || expMax > 0
      ? `${expMin}-${expMax} YEARS`
      : 'Fresher / Any Experience';

  const vacanciesString = `${job.vacancies || 1} OPEN`;

  const locationString =
    (typeof job.location === 'string' && job.location.length > 0)
      ? job.location
      : [job.jobLocation?.city, job.jobLocation?.country].filter(Boolean).join(', ') ||
        'Location Unspecified';

  return (
    <div className="max-w-4xl mx-auto pb-32 animate-in fade-in duration-300">
      {/* Top Bar (Matching Flutter AppBar) */}
      <div className="flex items-center justify-between py-4 border-b border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <h1 className="text-sm md:text-base font-black uppercase tracking-widest text-slate-900 dark:text-white text-center font-futura truncate max-w-md px-2">
          {job.roleName}
        </h1>

        {/* Share Popup Button */}
        <div className="relative" ref={shareMenuRef}>
          <button
            type="button"
            onClick={() => setShareMenuOpen(!shareMenuOpen)}
            className="p-2 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
          >
            <Share2 className="w-5 h-5" />
          </button>

          {shareMenuOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 py-2 divide-y divide-slate-100 dark:divide-slate-800">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="w-full px-4 py-2.5 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-2.5 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 text-emerald-500" />
                <span>Share on WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full px-4 py-2.5 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-2.5 cursor-pointer"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-400" />
                    <span>Share via / Copy Link</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Details Body */}
      <div className="space-y-8 pt-8">
        {/* Header Section: Logo + Title + Company + Location */}
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-shrink-0 flex items-center justify-center overflow-hidden">
            {job.companyLogoUrl ? (
              <img
                src={job.companyLogoUrl}
                alt={job.companyName || 'Company'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <Building2 className="w-7 h-7 text-slate-500" />
            )}
          </div>

          <div className="space-y-2 flex-1">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {job.companyName?.toUpperCase() || 'UNKNOWN COMPANY'}
            </div>

            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-slate-900 dark:text-white leading-tight font-futura">
              {job.roleName}
            </h2>

            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span>{locationString.toUpperCase()}</span>
              <span>•</span>
              <span>POSTED {formatDate(job.postedAt)}</span>
            </div>
          </div>
        </div>

        {/* Meta Info Row: Work Mode, Type, Level */}
        <div className="grid grid-cols-3 border-y border-slate-200 dark:border-slate-800 py-5 text-left">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              WORK MODE
            </div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mt-1">
              {(job.workMode || 'ONSITE').toUpperCase()}
            </div>
          </div>

          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              TYPE
            </div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mt-1">
              {(job.employmentType || 'FULL-TIME').toUpperCase()}
            </div>
          </div>

          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              LEVEL
            </div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mt-1">
              {(job.experienceLevel || 'MID-LEVEL').toUpperCase()}
            </div>
          </div>
        </div>

        {/* OVERVIEW Grid: Salary, Experience, Vacancies */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
            OVERVIEW
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-5">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                SALARY
              </div>
              <div className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white mt-1">
                {salaryString}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                EXPERIENCE
              </div>
              <div className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white mt-1">
                {experienceString}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                VACANCIES
              </div>
              <div className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white mt-1">
                {vacanciesString}
              </div>
            </div>
          </div>
        </div>

        {/* ABOUT THE ROLE */}
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
            ABOUT THE ROLE
          </h3>
          <div className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-line font-normal">
            {job.jobDescription}
          </div>
        </div>

        {/* KEY RESPONSIBILITIES */}
        {job.responsibilities && job.responsibilities.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
              KEY RESPONSIBILITIES
            </h3>
            <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
              {job.responsibilities.map((resp, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="text-slate-400 font-bold">•</span>
                  <span className="leading-relaxed">{resp}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* REQUIREMENTS */}
        {job.requirements && job.requirements.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
              REQUIREMENTS
            </h3>
            <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
              {job.requirements.map((req, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="text-slate-400 font-bold">•</span>
                  <span className="leading-relaxed">{req}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* SKILLS REQUIRED */}
        {job.skillsRequired && job.skillsRequired.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
              SKILLS REQUIRED
            </h3>
            <div className="flex flex-wrap gap-2.5">
              {job.skillsRequired.map((skill) => (
                <div
                  key={skill}
                  className="px-4 py-2 border border-slate-900 dark:border-white text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white"
                >
                  {skill}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RELATED JOBS */}
        <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-800">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
            RELATED JOBS
          </h3>

          {relatedJobs.length > 0 ? (
            <div className="space-y-4">
              {relatedJobs.map((relJob) => (
                <JobCard
                  key={relJob.jobId}
                  job={relJob}
                  candidateSkills={candidate?.skills || []}
                  isApplied={appliedJobIdsSet.has(relJob.jobId)}
                  isSaved={candidate?.savedJobIds?.includes(relJob.jobId)}
                  onSaveToggle={handleSaveToggle}
                />
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-500">
              No related jobs currently available.
            </div>
          )}
        </div>
      </div>

      {/* Pinned Bottom Action Bar (Matching Flutter bottomNavigationBar exactly) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 py-3.5 px-4 md:px-8">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          {/* PREPARE Button */}
          <button
            type="button"
            onClick={() => navigate(`${ROUTES.CAREER_READINESS}?jobId=${job.jobId}`)}
            className="h-12 px-5 border border-slate-900 dark:border-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white text-xs font-black tracking-wider uppercase transition flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <School className="w-4 h-4" />
            <span>PREPARE</span>
          </button>

          {/* Conditional Action Button */}
          <div className="flex-1">
            {!user ? (
              <button
                type="button"
                onClick={() => navigate(ROUTES.LOGIN)}
                className="w-full h-12 bg-slate-400 text-white text-xs font-black tracking-wider uppercase transition flex items-center justify-center cursor-pointer"
              >
                LOGIN TO APPLY
              </button>
            ) : hasActuallyBeenInvited ? (
              <button
                type="button"
                disabled={isApplying}
                onClick={handleAcceptInvitation}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black tracking-wider uppercase transition flex items-center justify-center cursor-pointer"
              >
                {isApplying ? 'ACCEPTING...' : 'ACCEPT & APPLY'}
              </button>
            ) : hasActuallyApplied ? (
              <button
                type="button"
                disabled
                className="w-full h-12 bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 text-xs font-black tracking-wider uppercase cursor-not-allowed flex items-center justify-center"
              >
                APPLIED
              </button>
            ) : (
              <button
                type="button"
                disabled={isApplying}
                onClick={() => setApplyModalOpen(true)}
                className="w-full h-12 bg-teal-600 hover:bg-teal-700 text-white text-xs font-black tracking-wider uppercase transition flex items-center justify-center cursor-pointer shadow-sm"
              >
                {isApplying ? 'APPLYING...' : 'APPLY NOW'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Apply Job Modal */}
      {applyModalOpen && candidate && (
        <ApplyJobModal
          isOpen={applyModalOpen}
          onClose={() => setApplyModalOpen(false)}
          job={job}
          candidate={candidate}
          onSuccess={handleApplicationSuccess}
        />
      )}
    </div>
  );
};

export default JobDetailsPage;
