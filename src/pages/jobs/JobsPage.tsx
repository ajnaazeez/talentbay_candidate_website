import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Briefcase } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { jobService } from '@/services/jobService';
import { JobCard } from '@/components/jobs/JobCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ROUTES } from '@/utils/constants';
import type { Job, JobApplication } from '@/types';

const CATEGORIES = ['All', 'Remote', 'Full-time', 'Part-time', 'Contract'];

export const JobsPage: React.FC = () => {
  const navigate = useNavigate();
  const { candidate, refreshCandidate } = useAuth();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Load recent searches from localStorage
  const loadRecentSearches = useCallback(() => {
    try {
      const raw = localStorage.getItem('search_history');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const queries = parsed
          .map((item) => (typeof item === 'string' ? item : item?.query || ''))
          .filter(Boolean);
        setRecentSearches(queries);
      }
    } catch (e) {
      console.warn('Failed to parse search history:', e);
    }
  }, []);

  // Fetch all jobs and candidate's applications
  useEffect(() => {
    loadRecentSearches();

    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const [jobsData, appsData] = await Promise.all([
          jobService.getJobs(),
          candidate?.uid ? jobService.getCandidateApplications(candidate.uid) : Promise.resolve([]),
        ]);

        if (isMounted) {
          setJobs(jobsData);
          setApplications(appsData);
        }
      } catch (err) {
        console.error('Error loading all jobs:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [candidate?.uid, loadRecentSearches]);

  // Bookmark save / unsave handler
  const handleSaveToggle = async (jobId: string, currentSaved: boolean) => {
    if (!candidate?.uid) return;
    if (currentSaved) {
      await jobService.unsaveJob(candidate.uid, jobId);
    } else {
      await jobService.saveJob(candidate.uid, jobId);
    }
    await refreshCandidate();
  };

  // Exclude and Applied IDs logic (matching Flutter all_jobs_screen.dart lines 87-98)
  const { appliedJobIds, validJobs } = useMemo(() => {
    const excluded = new Set(
      applications
        .filter((a) => {
          const status = (a.applicationStatus || '').toLowerCase();
          return status === 'hired' || status === 'accepted' || status === 'rejected';
        })
        .map((a) => a.jobId)
    );

    const applied = new Set(
      applications
        .filter((a) => !excluded.has(a.jobId))
        .map((a) => a.jobId)
    );

    // Filter jobs by active status and excluded IDs
    let list = jobs.filter((j) => !excluded.has(j.jobId));

    // Apply category filter if selected
    if (selectedCategory === 'Remote') {
      list = list.filter((j) => (j.workMode || '').toLowerCase().includes('remote'));
    } else if (selectedCategory !== 'All') {
      list = list.filter(
        (j) => (j.employmentType || '').toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    return {
      excludedJobIds: excluded,
      appliedJobIds: applied,
      validJobs: list,
    };
  }, [jobs, applications, selectedCategory]);

  // Split into Recommended and All Available (matching Flutter all_jobs_screen.dart lines 103-148)
  const { recommendedJobs, otherJobs } = useMemo(() => {
    const recommended: Job[] = [];
    const others: Job[] = [];

    const candidateRole = (candidate?.designation || '').toLowerCase();
    const candidateSkillNames = (candidate?.skills || []).map((s) => s.name.toLowerCase());

    for (const job of validJobs) {
      let matchesProfile = false;
      let matchesSearch = false;

      // Check role/designation match
      if (candidateRole) {
        if (
          (job.roleName || '').toLowerCase().includes(candidateRole) ||
          (job.designationName || '').toLowerCase().includes(candidateRole)
        ) {
          matchesProfile = true;
        }
      }

      // Check skills match
      if (!matchesProfile && candidateSkillNames.length > 0) {
        const reqSkills = (job.skillsRequired || []).map((s) => s.toLowerCase());
        const hasSkillMatch = candidateSkillNames.some((cs) => reqSkills.includes(cs));
        if (hasSkillMatch) {
          matchesProfile = true;
        }
      }

      // Check recent search matches
      if (!matchesProfile && recentSearches.length > 0) {
        for (const search of recentSearches.slice(0, 5)) {
          const q = search.toLowerCase();
          if (
            (job.roleName || '').toLowerCase().includes(q) ||
            (job.designationName || '').toLowerCase().includes(q) ||
            (job.companyName || '').toLowerCase().includes(q) ||
            (job.skillsRequired || []).some((s) => s.toLowerCase().includes(q))
          ) {
            matchesSearch = true;
            break;
          }
        }
      }

      if (matchesProfile || matchesSearch) {
        recommended.push(job);
      } else {
        others.push(job);
      }
    }

    return {
      recommendedJobs: recommended,
      otherJobs: others,
    };
  }, [validJobs, candidate?.designation, candidate?.skills, recentSearches]);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 animate-in fade-in duration-300">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#D8E4EA] dark:border-[#1F2D3D]">
        <h1 className="text-2xl font-extrabold tracking-tight text-[#1F2D3D] dark:text-white">
          All Jobs
        </h1>

        {/* Quick Search Shortcut */}
        <div
          onClick={() => navigate(ROUTES.SEARCH)}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-[#D8E4EA] dark:border-[#1F2D3D] bg-white dark:bg-[#0E2233] text-[#6B8699] dark:text-[#8CA6B7] hover:text-[#1F2D3D] dark:hover:text-[#F6FAFC] hover:border-[#00BFA6]/40 dark:hover:border-[#00BFA6]/40 shadow-xs transition cursor-pointer text-xs font-medium"
        >
          <Search className="w-4 h-4 text-[#8CA6B7]" />
          <span>Search jobs, companies, skills...</span>
        </div>
      </div>

      {/* Category Filter Chips (Matching Flutter) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase border transition-all whitespace-nowrap cursor-pointer ${
                isSelected
                  ? 'bg-[#00BFA6] text-white border-[#00BFA6] shadow-xs'
                  : 'bg-white dark:bg-[#0E2233] text-[#1F2D3D] dark:text-[#BACDD8] border-[#D8E4EA] dark:border-[#1F2D3D] hover:border-[#00BFA6]/40 dark:hover:border-[#00BFA6]/40'
              }`}
            >
              {cat.toUpperCase()}
            </button>
          );
        })}
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="py-24 flex justify-center">
          <LoadingSpinner size="lg" label="Loading opportunities..." />
        </div>
      ) : validJobs.length === 0 ? (
        <div className="rounded-2xl border border-[#D8E4EA] dark:border-[#1F2D3D] bg-white dark:bg-[#0E2233] shadow-card p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#E8F1F5] dark:bg-[#0A1A27] border border-[#D8E4EA] dark:border-[#1F2D3D] flex items-center justify-center mx-auto text-[#6B8699] dark:text-[#8CA6B7]">
            <Briefcase className="w-7 h-7" />
          </div>
          <div className="text-base font-bold text-[#1F2D3D] dark:text-[#F6FAFC]">
            No jobs available
          </div>
          <p className="text-xs text-[#6B8699] dark:text-[#8CA6B7]">
            Check back later or try clearing selected category filters.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Section 1: RECOMMENDED FOR YOU */}
          {recommendedJobs.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#6B8699] dark:text-[#8CA6B7]">
                Recommended For You
              </h2>

              <div className="space-y-4">
                {recommendedJobs.map((job) => (
                  <JobCard
                    key={job.jobId}
                    job={job}
                    candidateSkills={candidate?.skills || []}
                    isApplied={appliedJobIds.has(job.jobId)}
                    isSaved={candidate?.savedJobIds?.includes(job.jobId)}
                    onSaveToggle={handleSaveToggle}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Section 2: ALL AVAILABLE JOBS */}
          {otherJobs.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#6B8699] dark:text-[#8CA6B7]">
                All Available Jobs
              </h2>

              <div className="space-y-4">
                {otherJobs.map((job) => (
                  <JobCard
                    key={job.jobId}
                    job={job}
                    candidateSkills={candidate?.skills || []}
                    isApplied={appliedJobIds.has(job.jobId)}
                    isSaved={candidate?.savedJobIds?.includes(job.jobId)}
                    onSaveToggle={handleSaveToggle}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default JobsPage;
