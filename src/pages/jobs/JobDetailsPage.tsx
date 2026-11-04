import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { jobService } from '@/services/jobService';
import type { Job, JobApplication } from '@/types';
import { calculateJobSkillMatch } from '@/utils/skillMatcher';
import { formatSalary, formatTimeAgo } from '@/utils/formatters';
import { ApplyJobModal } from '@/components/jobs/ApplyJobModal';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import {
  Briefcase,
  MapPin,
  Heart,
  Building2,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  ArrowLeft,
  Check,
  AlertCircle,
  HelpCircle,
  Share2,
} from 'lucide-react';
import { ROUTES } from '@/utils/constants';

export const JobDetailsPage: React.FC = () => {
  const { id: jobId } = useParams<{ id: string }>();
  const { candidate, refreshCandidate } = useAuth();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isApplied, setIsApplied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savingBookmark, setSavingBookmark] = useState(false);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchJobData() {
      if (!jobId) return;
      setLoading(true);
      setError(null);
      try {
        const data = await jobService.getJobById(jobId);
        if (isMounted) {
          setJob(data);

          if (candidate?.uid) {
            const applied = await jobService.hasCandidateApplied(jobId, candidate.uid);
            setIsApplied(applied);
            setIsSaved(Boolean(candidate.savedJobIds?.includes(jobId)));
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Failed to load job details.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchJobData();

    return () => {
      isMounted = false;
    };
  }, [jobId, candidate?.uid, candidate?.savedJobIds]);

  const handleBookmarkToggle = async () => {
    if (!jobId || !candidate?.uid || savingBookmark) return;
    setSavingBookmark(true);
    const nextSaved = !isSaved;
    setIsSaved(nextSaved);
    try {
      if (isSaved) {
        await jobService.unsaveJob(candidate.uid, jobId);
      } else {
        await jobService.saveJob(candidate.uid, jobId);
      }
      await refreshCandidate();
    } catch {
      setIsSaved(!nextSaved);
    } finally {
      setSavingBookmark(false);
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleApplicationSuccess = (_app: JobApplication) => {
    setIsApplied(true);
    setApplyModalOpen(false);
  };

  if (loading) {
    return (
      <div className="py-24 flex justify-center">
        <LoadingSpinner size="lg" label="Loading opportunity details..." />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/30 text-red-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Opportunity Not Found</h2>
        <p className="text-xs sm:text-sm text-gray-500">
          This position may have expired, been filled, or moved.
        </p>
        <Link to={ROUTES.JOBS}>
          <Button variant="primary" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Browse Open Opportunities
          </Button>
        </Link>
      </div>
    );
  }

  const matchResult = calculateJobSkillMatch(
    candidate?.skills || [],
    job.skillsRequired.length > 0 ? job.skillsRequired : job.mustHaveSkills
  );

  const locationString = job.locations && job.locations.length > 0
    ? job.locations.join(', ')
    : [
        job.jobLocation?.city,
        job.jobLocation?.state,
        job.jobLocation?.country,
      ]
        .filter(Boolean)
        .join(', ') || 'Location Unspecified';

  const salaryDisplay = formatSalary(job.salary.min, job.salary.max, job.salary.currency, job.salary.type);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24">
      {/* Back button */}
      <div>
        <Link
          to={ROUTES.JOBS}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Job Discovery
        </Link>
      </div>

      {/* Main Job Hero Header */}
      <div className="rounded-3xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border p-6 sm:p-8 shadow-soft">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-start gap-5">
            {/* Logo */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border border-gray-100 dark:border-dark-border bg-gray-50 dark:bg-dark-bg overflow-hidden flex-shrink-0 flex items-center justify-center p-2 shadow-2xs">
              {job.companyLogoUrl ? (
                <img
                  src={job.companyLogoUrl}
                  alt={job.companyName || 'Company'}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <Building2 className="w-8 h-8 text-gray-400" />
              )}
            </div>

            {/* Title & Company */}
            <div className="space-y-1.5">
              <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                {job.roleName}
              </h1>

              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-300 font-medium">
                {job.companyId ? (
                  <Link
                    to={`/companies/${job.companyId}`}
                    className="text-brand-600 dark:text-brand-400 hover:underline font-semibold"
                  >
                    {job.companyName}
                  </Link>
                ) : (
                  <span className="font-semibold">{job.companyName}</span>
                )}
                {job.isVerifiedCompany && (
                  <span className="inline-flex items-center text-xs text-blue-600 font-bold">
                    ✓ Verified Employer
                  </span>
                )}
              </div>

              {/* Badges / Chips */}
              <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
                <span className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-300">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  {locationString}
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-300">
                  <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                  {job.workMode}
                </span>
                <span>•</span>
                <Badge variant="indigo" size="sm">
                  {job.employmentType}
                </Badge>
                {job.experienceRequired?.minYears !== undefined && (
                  <Badge variant="neutral" size="sm">
                    {job.experienceRequired.minYears}
                    {job.experienceRequired.maxYears ? `-${job.experienceRequired.maxYears}` : '+'} Yrs Exp
                  </Badge>
                )}
                <span className="text-gray-400">• Posted {formatTimeAgo(job.postedAt)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 self-start md:self-auto flex-shrink-0">
            <button
              type="button"
              onClick={handleShare}
              className="p-2.5 rounded-xl border border-gray-200 dark:border-dark-border text-gray-600 dark:text-gray-400 hover:text-brand-600 hover:border-brand-500 transition-colors"
              title="Share Link"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
            </button>

            {candidate && (
              <button
                type="button"
                disabled={savingBookmark}
                onClick={handleBookmarkToggle}
                className={`p-2.5 rounded-xl border transition-all ${
                  isSaved
                    ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-400'
                    : 'bg-white dark:bg-dark-card border-gray-200 dark:border-dark-border text-gray-400 hover:text-rose-600 hover:border-rose-200'
                }`}
                title={isSaved ? 'Saved to Wishlist' : 'Save Job'}
              >
                <Heart className={`w-4 h-4 ${isSaved ? 'fill-rose-600 dark:fill-rose-400' : ''}`} />
              </button>
            )}

            {isApplied ? (
              <Badge variant="success" size="lg">
                <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-600" />
                Application Submitted
              </Badge>
            ) : (
              <Button
                variant="primary"
                size="md"
                onClick={() => setApplyModalOpen(true)}
                className="shadow-md shadow-brand-500/20"
              >
                Apply Now
              </Button>
            )}
          </div>
        </div>

        {/* Salary Banner inside hero */}
        <div className="mt-6 pt-5 border-t border-gray-100 dark:border-dark-border flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs text-gray-400 block">Offered Compensation</span>
            <span className="text-lg font-extrabold text-gray-900 dark:text-white">
              {salaryDisplay}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div>
              <span className="block text-gray-400">Vacancies</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">
                {job.vacancies} open position{job.vacancies > 1 ? 's' : ''}
              </span>
            </div>
            {job.experienceLevel && (
              <div>
                <span className="block text-gray-400">Career Level</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  {job.experienceLevel}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Full Details */}
        <div className="lg:col-span-8 space-y-6">
          {/* 1. Skill Match Breakdown Widget */}
          {candidate && (
            <div className="rounded-3xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border p-6 shadow-soft space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">
                      Skill Compatibility Analysis
                    </h3>
                    <p className="text-xs text-gray-500">
                      Calculated against required job competencies.
                    </p>
                  </div>
                </div>

                <div
                  className={`text-right px-3 py-1.5 rounded-2xl border font-bold text-sm ${
                    matchResult.matchPercentage >= 80
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200'
                      : matchResult.matchPercentage >= 50
                      ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 border-brand-200'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200'
                  }`}
                >
                  {matchResult.matchPercentage}% Compatibility
                </div>
              </div>

              {/* Matching Skills */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Matching Skills ({matchResult.matchingSkills.length})
                </span>
                <div className="flex flex-wrap gap-2">
                  {matchResult.matchingSkills.length > 0 ? (
                    matchResult.matchingSkills.map((sk) => (
                      <span
                        key={sk}
                        className="px-3 py-1 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800/40"
                      >
                        {sk}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs italic text-gray-400">
                      No exact skill overlaps detected yet. Add more skills to your profile!
                    </span>
                  )}
                </div>
              </div>

              {/* Missing / Gap Skills */}
              {matchResult.missingSkills.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-dark-border">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5" />
                    Additional Skills Desired ({matchResult.missingSkills.length})
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {matchResult.missingSkills.map((sk) => (
                      <span
                        key={sk}
                        className="px-3 py-1 rounded-xl text-xs font-medium bg-gray-50 dark:bg-dark-bg text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-dark-border"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] text-gray-400 pt-1">
                    Tip: Candidates who add or verify missing skills gain up to 3x higher interview response rates.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 2. Job Description */}
          <div className="rounded-3xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border p-6 sm:p-8 shadow-soft space-y-4">
            <h3 className="text-base font-bold text-gray-900 dark:text-white uppercase tracking-wider text-xs">
              Role Overview &amp; Description
            </h3>
            <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line space-y-3">
              {job.jobDescription}
            </div>
          </div>

          {/* 3. Responsibilities */}
          {job.responsibilities.length > 0 && (
            <div className="rounded-3xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border p-6 sm:p-8 shadow-soft space-y-4">
              <h3 className="text-base font-bold text-gray-900 dark:text-white uppercase tracking-wider text-xs">
                Key Responsibilities
              </h3>
              <ul className="space-y-2.5 text-sm text-gray-700 dark:text-gray-300">
                {job.responsibilities.map((resp, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-600 mt-2 flex-shrink-0" />
                    <span>{resp}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 4. Requirements */}
          {job.requirements.length > 0 && (
            <div className="rounded-3xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border p-6 sm:p-8 shadow-soft space-y-4">
              <h3 className="text-base font-bold text-gray-900 dark:text-white uppercase tracking-wider text-xs">
                Required Qualifications &amp; Skills
              </h3>
              <ul className="space-y-2.5 text-sm text-gray-700 dark:text-gray-300">
                {job.requirements.map((req, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-2 flex-shrink-0" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 5. Interview Process */}
          {job.interviewProcess.length > 0 && (
            <div className="rounded-3xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border p-6 sm:p-8 shadow-soft space-y-4">
              <h3 className="text-base font-bold text-gray-900 dark:text-white uppercase tracking-wider text-xs">
                Hiring &amp; Interview Process
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {job.interviewProcess.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border space-y-1"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 block">
                      Stage {idx + 1}
                    </span>
                    <p className="text-xs font-semibold text-gray-900 dark:text-white">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Company Overview & Quick Facts */}
        <div className="lg:col-span-4 space-y-6">
          {/* Company Card */}
          <div className="rounded-3xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border p-6 shadow-soft space-y-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
              About The Employer
            </h4>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg p-1 flex items-center justify-center overflow-hidden">
                {job.companyLogoUrl ? (
                  <img src={job.companyLogoUrl} alt={job.companyName} className="w-full h-full object-contain" />
                ) : (
                  <Building2 className="w-6 h-6 text-gray-400" />
                )}
              </div>
              <div>
                <h5 className="font-bold text-gray-900 dark:text-white text-sm">
                  {job.companyName}
                </h5>
                {job.companyId && (
                  <Link
                    to={`/companies/${job.companyId}`}
                    className="text-xs text-brand-600 hover:underline inline-flex items-center gap-1 font-semibold"
                  >
                    View Company Profile <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-dark-border text-xs text-gray-600 dark:text-gray-300">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Location</span>
                <span className="font-semibold text-gray-900 dark:text-white">{locationString}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Work Mode</span>
                <span className="font-semibold text-gray-900 dark:text-white">{job.workMode}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Job Status</span>
                <Badge variant="success" size="sm">Active Hiring</Badge>
              </div>
            </div>

            {job.companyId && (
              <div className="pt-2">
                <Link to={`/companies/${job.companyId}`}>
                  <Button variant="outline" size="sm" className="w-full justify-center">
                    Browse All {job.companyName} Openings
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Quick Apply Summary Card */}
          <div className="rounded-3xl bg-gradient-to-br from-brand-50 to-indigo-50/50 dark:from-brand-950/20 dark:to-indigo-950/20 border border-brand-200/60 dark:border-brand-900/40 p-6 space-y-4">
            <h4 className="font-bold text-sm text-brand-900 dark:text-brand-200">
              Ready to take the next step?
            </h4>
            <p className="text-xs text-brand-700 dark:text-brand-300 leading-relaxed">
              Applying takes less than a minute. Your verified candidate resume will be delivered directly to the recruiter.
            </p>

            {isApplied ? (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                You have applied for this position
              </div>
            ) : (
              <Button
                variant="primary"
                size="md"
                onClick={() => setApplyModalOpen(true)}
                className="w-full justify-center shadow-md shadow-brand-500/20"
              >
                Apply for this Role
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Application Modal */}
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
