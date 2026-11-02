import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { jobService } from '@/services/jobService';
import type { Job, JobFilterOptions, JobApplication } from '@/types';
import { JobCard } from '@/components/jobs/JobCard';
import { JobFilters } from '@/components/jobs/JobFilters';
import { ApplyJobModal } from '@/components/jobs/ApplyJobModal';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Briefcase, Sparkles, AlertCircle } from 'lucide-react';

export const JobsPage: React.FC = () => {
  const { candidate, refreshCandidate } = useAuth();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [filters, setFilters] = useState<JobFilterOptions>({
    searchQuery: '',
    location: '',
    workMode: 'all',
    employmentType: 'all',
    minSalary: 0,
    minExperience: -1,
    sortBy: 'newest',
  });

  // Selected job for apply modal
  const [selectedJobToApply, setSelectedJobToApply] = useState<Job | null>(null);

  // Pagination / Incremental loading
  const [visibleCount, setVisibleCount] = useState(12);

  // Fetch jobs and user's applied status
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const fetchedJobs = await jobService.getJobs(filters);

        if (isMounted) {
          setJobs(fetchedJobs);

          // If logged in, fetch candidate's applications
          if (candidate?.uid) {
            const apps = await jobService.getCandidateApplications(candidate.uid);
            const idSet = new Set(apps.map((a) => a.jobId));
            setAppliedJobIds(idSet);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Failed to load jobs. Please try refreshing.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [filters, candidate?.uid]);

  // Handle bookmark save/unsave toggle
  const handleSaveToggle = async (jobId: string, currentSaved: boolean) => {
    if (!candidate?.uid) return;
    if (currentSaved) {
      await jobService.unsaveJob(candidate.uid, jobId);
    } else {
      await jobService.saveJob(candidate.uid, jobId);
    }
    await refreshCandidate();
  };

  const handleApplicationSuccess = (app: JobApplication) => {
    setAppliedJobIds((prev) => new Set([...prev, app.jobId]));
  };

  const visibleJobs = useMemo(() => {
    return jobs.slice(0, visibleCount);
  }, [jobs, visibleCount]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-brand-700 via-indigo-700 to-purple-800 text-white p-6 sm:p-10 shadow-lg overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur-md text-white border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-brand-300" />
            AI-Powered Job Recommendations
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Find Your Dream Opportunity
          </h1>
          <p className="text-xs sm:text-sm text-brand-100 font-normal leading-relaxed">
            Discover verified openings curated for your skills, experience, and career ambitions.
          </p>
        </div>
      </div>

      {/* Filter Component */}
      <JobFilters
        filters={filters}
        onChange={setFilters}
        onReset={() =>
          setFilters({
            searchQuery: '',
            location: '',
            workMode: 'all',
            employmentType: 'all',
            minSalary: 0,
            minExperience: -1,
            sortBy: 'newest',
          })
        }
        totalResults={jobs.length}
      />

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-xs sm:text-sm text-red-600 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Job Listings Grid */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner size="lg" label="Discovering active openings..." />
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={<Briefcase className="w-7 h-7 text-slate-400" />}
          title="No Matching Jobs Found"
          description="Try broadening your search query, clearing filters, or switching work modes to view more vacancies."
          actionLabel="Reset Filters"
          onAction={() =>
            setFilters({
              searchQuery: '',
              location: '',
              workMode: 'all',
              employmentType: 'all',
              minSalary: 0,
              minExperience: -1,
              sortBy: 'newest',
            })
          }
        />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {visibleJobs.map((job) => {
              const isApplied = appliedJobIds.has(job.jobId);
              const isSaved = candidate?.savedJobIds?.includes(job.jobId);

              return (
                <JobCard
                  key={job.jobId}
                  job={job}
                  candidateSkills={candidate?.skills || []}
                  isApplied={isApplied}
                  isSaved={isSaved}
                  onSaveToggle={handleSaveToggle}
                  onApplyClick={(j) => setSelectedJobToApply(j)}
                />
              );
            })}
          </div>

          {/* Load More Button */}
          {visibleCount < jobs.length && (
            <div className="pt-6 text-center">
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + 12)}
                className="px-6 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card text-xs font-bold text-gray-700 dark:text-gray-300 hover:border-brand-500 shadow-2xs transition-colors"
              >
                Load More Opportunities ({jobs.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </div>
      )}

      {/* Apply Job Modal */}
      {selectedJobToApply && candidate && (
        <ApplyJobModal
          isOpen={Boolean(selectedJobToApply)}
          onClose={() => setSelectedJobToApply(null)}
          job={selectedJobToApply}
          candidate={candidate}
          onSuccess={handleApplicationSuccess}
        />
      )}
    </div>
  );
};
export default JobsPage;
