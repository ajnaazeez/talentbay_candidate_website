import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { jobService } from '@/services/jobService';
import type { Job, JobApplication } from '@/types';
import { JobCard } from '@/components/jobs/JobCard';
import { ApplyJobModal } from '@/components/jobs/ApplyJobModal';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Heart, ArrowLeft, Bookmark } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/utils/constants';

export const SavedJobsPage: React.FC = () => {
  const { candidate, refreshCandidate } = useAuth();

  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [selectedJobToApply, setSelectedJobToApply] = useState<Job | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadSaved() {
      if (!candidate?.uid) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const jobIds = candidate.savedJobIds || [];
        const [jobs, apps] = await Promise.all([
          jobService.getJobsByIds(jobIds),
          jobService.getCandidateApplications(candidate.uid),
        ]);

        if (isMounted) {
          setSavedJobs(jobs);
          setAppliedJobIds(new Set(apps.map((a) => a.jobId)));
        }
      } catch (err) {
        console.error('Failed to load saved jobs:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadSaved();

    return () => {
      isMounted = false;
    };
  }, [candidate?.uid, candidate?.savedJobIds]);

  const handleSaveToggle = async (jobId: string, currentSaved: boolean) => {
    if (!candidate?.uid) return;
    if (currentSaved) {
      await jobService.unsaveJob(candidate.uid, jobId);
      setSavedJobs((prev) => prev.filter((j) => j.jobId !== jobId));
    } else {
      await jobService.saveJob(candidate.uid, jobId);
    }
    await refreshCandidate();
  };

  const handleApplicationSuccess = (app: JobApplication) => {
    setAppliedJobIds((prev) => new Set([...prev, app.jobId]));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              to={ROUTES.JOBS}
              className="text-xs font-semibold text-gray-500 hover:text-[#16B8A6] inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Discover
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2.5">
            <Bookmark className="w-6 h-6 text-[#16B8A6] fill-[#16B8A6]/20" />
            Saved Opportunities ({savedJobs.length})
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Keep track of open positions you are interested in and apply when ready.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-24 flex justify-center">
          <LoadingSpinner size="lg" label="Loading saved vacancies..." />
        </div>
      ) : savedJobs.length === 0 ? (
        <EmptyState
          icon={<Heart className="w-7 h-7 text-slate-400" />}
          title="No Saved Jobs Yet"
          description="Click the heart icon on any job card in the job search to bookmark it for later."
          actionLabel="Explore Opportunities"
          onAction={() => {
            window.location.href = ROUTES.JOBS;
          }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {savedJobs.map((job) => {
            const isApplied = appliedJobIds.has(job.jobId);
            return (
              <JobCard
                key={job.jobId}
                job={job}
                candidateSkills={candidate?.skills || []}
                isApplied={isApplied}
                isSaved={true}
                onSaveToggle={handleSaveToggle}
                onApplyClick={(j) => setSelectedJobToApply(j)}
              />
            );
          })}
        </div>
      )}

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
export default SavedJobsPage;
