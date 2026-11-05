import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Job, Skill } from '@/types';
import { calculateJobSkillMatch } from '@/utils/skillMatcher';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import {
  MapPin,
  Briefcase,
  Clock,
  Heart,
  CheckCircle2,
  Building2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { formatSalary, formatTimeAgo } from '@/utils/formatters';

interface JobCardProps {
  job: Job;
  candidateSkills?: Skill[];
  isSaved?: boolean;
  isApplied?: boolean;
  onSaveToggle?: (jobId: string, isSaved: boolean) => Promise<void>;
  onApplyClick?: (job: Job) => void;
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  candidateSkills = [],
  isSaved: initialIsSaved = false,
  isApplied = false,
  onSaveToggle,
  onApplyClick,
}) => {
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(initialIsSaved);
  const [savingBookmark, setSavingBookmark] = useState(false);

  // Skill matching calculation
  const matchResult = calculateJobSkillMatch(
    candidateSkills,
    job.skillsRequired.length > 0 ? job.skillsRequired : job.mustHaveSkills
  );

  const handleBookmarkClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!onSaveToggle || savingBookmark) return;

    setSavingBookmark(true);
    const nextSaved = !isSaved;
    setIsSaved(nextSaved); // Optimistic UI
    try {
      await onSaveToggle(job.jobId, isSaved);
    } catch {
      setIsSaved(!nextSaved); // Revert on failure
    } finally {
      setSavingBookmark(false);
    }
  };

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
    <div className="group relative rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-[#1f293d] p-5 sm:p-6 shadow-card hover:shadow-card-hover hover:border-brand-300 dark:hover:border-brand-700/60 hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        {/* Company Logo & Basic Meta */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border border-slate-100 dark:border-[#1f293d] bg-slate-50/80 dark:bg-[#0f172a] overflow-hidden flex-shrink-0 flex items-center justify-center p-2 shadow-2xs group-hover:scale-105 transition-transform">
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
              <Building2 className="w-6 h-6 text-slate-400 dark:text-slate-500" />
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Link
                to={`/jobs/${job.jobId}`}
                className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors line-clamp-1 tracking-tight"
              >
                {job.roleName}
              </Link>
            </div>

            <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300">
              {job.companyId ? (
                <Link
                  to={`/companies/${job.companyId}`}
                  className="hover:underline hover:text-brand-600 transition-colors"
                >
                  {job.companyName}
                </Link>
              ) : (
                <span>{job.companyName}</span>
              )}
              {job.isVerifiedCompany && (
                <span className="inline-flex items-center text-[10px] text-brand-600 dark:text-brand-400 font-semibold">
                  ✓ Verified
                </span>
              )}
            </div>

            {/* Tags line */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {locationString}
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                {job.workMode}
              </span>
              <span>•</span>
              <span>{job.employmentType}</span>
              {job.experienceRequired?.minYears !== undefined && (
                <>
                  <span>•</span>
                  <span>
                    {job.experienceRequired.minYears}
                    {job.experienceRequired.maxYears ? `-${job.experienceRequired.maxYears}` : '+'} Yrs Exp
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Top-Right Badges & Save Action */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Skill Match Indicator */}
          {candidateSkills.length > 0 && matchResult.totalRequired > 0 && (
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                matchResult.matchPercentage >= 80
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60 shadow-2xs'
                  : matchResult.matchPercentage >= 50
                  ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 border-brand-200/80 dark:border-brand-800/60 shadow-2xs'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
              }`}
              title={`${matchResult.matchingSkills.length} of ${matchResult.totalRequired} required skills match your profile`}
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-500" />
              <span>{matchResult.matchPercentage}% Match</span>
            </div>
          )}

          {/* Bookmark Button */}
          {onSaveToggle && (
            <button
              type="button"
              disabled={savingBookmark}
              onClick={handleBookmarkClick}
              className={`p-2 rounded-xl border transition-all duration-150 active:scale-95 cursor-pointer ${
                isSaved
                  ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-400 shadow-2xs'
                  : 'bg-white dark:bg-[#0f172a] border-slate-200 dark:border-[#1f293d] text-slate-400 hover:text-rose-600 hover:border-rose-200 dark:hover:border-rose-900/60'
              }`}
              title={isSaved ? 'Remove from Saved Jobs' : 'Save Job'}
            >
              <Heart className={`w-4 h-4 ${isSaved ? 'fill-rose-600 dark:fill-rose-400' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Salary & Required Skills */}
      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-[#1f293d] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Skills Chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          {job.skillsRequired.slice(0, 4).map((skill) => {
            const isMatched = matchResult.matchingSkills.includes(skill);
            return (
              <span
                key={skill}
                className={`px-2.5 py-0.5 rounded-lg text-xs font-medium border transition-colors ${
                  isMatched
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/40'
                    : 'bg-slate-50 dark:bg-[#0f172a] text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-[#1f293d]'
                }`}
              >
                {skill}
              </span>
            );
          })}
          {job.skillsRequired.length > 4 && (
            <span className="text-xs text-slate-400 font-medium pl-1">
              +{job.skillsRequired.length - 4} more
            </span>
          )}
        </div>

        {/* Salary & Application Action */}
        <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0">
          <div className="text-right">
            <span className="text-xs text-slate-400 block font-normal">Salary (Estimated)</span>
            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              {salaryDisplay}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isApplied ? (
              <Badge variant="success" size="md">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                Applied
              </Badge>
            ) : (
              <Button
                variant="primary"
                size="sm"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                onClick={() => (onApplyClick ? onApplyClick(job) : navigate(`/jobs/${job.jobId}`))}
                className="shrink-0"
              >
                Apply Now
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Posted ago footer */}
      <div className="mt-2 text-[11px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
        <Clock className="w-3 h-3" />
        <span>Posted {formatTimeAgo(job.postedAt)}</span>
      </div>
    </div>
  );
};
