import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, History, X, SearchX, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { jobService } from '@/services/jobService';
import { JobCard } from '@/components/jobs/JobCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import type { Job } from '@/types/job';

interface SearchHistoryItem {
  query: string;
  timestamp: string;
}

const SEARCH_HISTORY_KEY = 'search_history';
const CATEGORIES = ['All', 'Remote', 'Full-time', 'Part-time', 'Contract'];

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { candidate, refreshCandidate } = useAuth();

  const initialQuery = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);

  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Load 30-day search history from localStorage
  const loadSearchHistory = useCallback(() => {
    try {
      const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (!raw) {
        setSearchHistory([]);
        return;
      }

      const decoded = JSON.parse(raw);
      if (!Array.isArray(decoded)) return;

      const now = Date.now();
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

      // Filter out items older than 30 days
      const validItems: SearchHistoryItem[] = decoded.filter((item: any) => {
        if (!item?.query || !item?.timestamp) return false;
        const time = new Date(item.timestamp).getTime();
        return now - time <= thirtyDaysMs;
      });

      setSearchHistory(validItems);

      // Save back if older entries were pruned
      if (validItems.length !== decoded.length) {
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(validItems));
      }
    } catch (e) {
      console.warn('Failed to parse search history:', e);
    }
  }, []);

  // Save history item
  const addToHistory = (queryToAdd: string) => {
    const trimmed = queryToAdd.trim();
    if (!trimmed) return;

    try {
      const filtered = searchHistory.filter(
        (item) => item.query.toLowerCase() !== trimmed.toLowerCase()
      );
      const updated = [{ query: trimmed, timestamp: new Date().toISOString() }, ...filtered].slice(
        0,
        20
      );
      setSearchHistory(updated);
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save search history:', e);
    }
  };

  // Remove history item
  const removeFromHistory = (queryToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = searchHistory.filter(
      (item) => item.query.toLowerCase() !== queryToRemove.toLowerCase()
    );
    setSearchHistory(updated);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
  };

  // Clear all history
  const clearAllHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  };

  // Fetch jobs and applications
  useEffect(() => {
    loadSearchHistory();

    let isMounted = true;
    async function fetchData() {
      setLoading(true);
      try {
        const [jobsData, appsData] = await Promise.all([
          jobService.getJobs(),
          candidate?.uid ? jobService.getCandidateApplications(candidate.uid) : Promise.resolve([]),
        ]);

        if (isMounted) {
          setAllJobs(jobsData);
          setAppliedJobIds(new Set(appsData.map((a) => a.jobId)));
        }
      } catch (err) {
        console.error('Error fetching jobs for search:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [candidate?.uid, loadSearchHistory]);

  // Handle URL query changes
  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null && q !== searchQuery) {
      setSearchQuery(q);
      if (q.trim()) addToHistory(q);
    }
  }, [searchParams]);

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

  // Multi-field exact and partial query filtering
  const filteredJobs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return allJobs.filter((job) => {
      // 1. Category filter
      if (selectedCategory === 'Remote') {
        const isRemote =
          (job.workMode || '').toLowerCase().includes('remote') ||
          (job.jobLocation?.city || '').toLowerCase().includes('remote');
        if (!isRemote) return false;
      } else if (selectedCategory !== 'All') {
        const matchesType =
          (job.employmentType || '').toLowerCase() === selectedCategory.toLowerCase();
        if (!matchesType) return false;
      }

      // 2. Query filter
      if (!query) return true;

      const roleMatch = (job.roleName || (job as any).title || '').toLowerCase().includes(query);
      const designationMatch = (job.designationName || '').toLowerCase().includes(query);
      const companyMatch = (job.companyName || '').toLowerCase().includes(query);
      const locationMatch =
        (job.jobLocation?.city || '').toLowerCase().includes(query) ||
        (job.jobLocation?.country || '').toLowerCase().includes(query);

      const skillMatch = (job.skillsRequired || []).some((s) =>
        s.toLowerCase().includes(query)
      );

      const descMatch = (job.jobDescription || '').toLowerCase().includes(query);

      return roleMatch || designationMatch || companyMatch || locationMatch || skillMatch || descMatch;
    });
  }, [allJobs, searchQuery, selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed) {
      addToHistory(trimmed);
      setSearchParams({ q: trimmed });
    } else {
      setSearchParams({});
    }
  };

  const handleSelectHistoryItem = (query: string) => {
    setSearchQuery(query);
    addToHistory(query);
    setSearchParams({ q: query });
  };

  const hasSearchInput = searchQuery.trim().length > 0;
  const isFiltering = hasSearchInput || selectedCategory !== 'All';

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 animate-in fade-in duration-300">
      {/* Top Search Input Bar */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2.5 rounded-xl border border-[#D8E4EA] dark:border-[#1F2D3D] bg-white dark:bg-[#0E2233] text-[#6B8699] dark:text-[#8CA6B7] hover:text-[#1F2D3D] dark:hover:text-white shadow-xs transition cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <form onSubmit={handleSearchSubmit} className="flex-1 relative flex items-center rounded-2xl border border-[#D8E4EA] dark:border-[#1F2D3D] bg-white dark:bg-[#0E2233] shadow-xs px-4 py-1.5 focus-within:border-[#00BFA6] focus-within:ring-2 focus-within:ring-[#00BFA6]/20 transition-all">
          <Search className="w-5 h-5 text-[#8CA6B7] mr-2 flex-shrink-0" />
          <input
            type="text"
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search title, skill, or company..."
            className="w-full py-2.5 text-sm md:text-base font-medium bg-transparent border-0 focus:outline-none focus:ring-0 text-[#1F2D3D] dark:text-white placeholder:text-[#8CA6B7]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSearchParams({});
              }}
              className="p-1 rounded-lg text-[#8CA6B7] hover:text-[#1F2D3D] dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </form>
      </div>

      {/* Category Filter Chips */}
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
        <div className="py-20 flex justify-center">
          <LoadingSpinner size="lg" label="Searching opportunities..." />
        </div>
      ) : isFiltering ? (
        /* Search Results View */
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#6B8699] dark:text-[#8CA6B7]">
            <span>RESULTS ({filteredJobs.length})</span>
          </div>

          {filteredJobs.length > 0 ? (
            <div className="space-y-4">
              {filteredJobs.map((job) => (
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
          ) : (
            <div className="py-20 text-center space-y-4">
              <SearchX className="w-16 h-16 mx-auto text-[#8CA6B7] dark:text-[#6B8699]" />
              <div className="text-base font-bold text-[#1F2D3D] dark:text-white">
                No jobs found
              </div>
              <p className="text-xs text-[#6B8699] dark:text-[#8CA6B7] max-w-sm mx-auto">
                No opportunities matched "{searchQuery}". Try different keywords or reset category filters.
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Recent Searches View (Shown when no search query is active) */
        <div className="pt-2">
          {searchHistory.length > 0 ? (
            <div className="rounded-2xl border border-[#D8E4EA] dark:border-[#1F2D3D] bg-white dark:bg-[#0E2233] shadow-card p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#D8E4EA] dark:border-[#1F2D3D]">
                <span className="text-xs font-bold uppercase tracking-wider text-[#1F2D3D] dark:text-white">
                  RECENT SEARCHES
                </span>
                <button
                  type="button"
                  onClick={clearAllHistory}
                  className="text-xs font-semibold text-[#6B8699] dark:text-[#8CA6B7] hover:text-[#00BFA6] dark:hover:text-[#00BFA6] cursor-pointer transition"
                >
                  Clear All
                </button>
              </div>

              <div className="divide-y divide-[#D8E4EA] dark:divide-[#1F2D3D]">
                {searchHistory.map((item) => (
                  <div
                    key={item.query}
                    onClick={() => handleSelectHistoryItem(item.query)}
                    className="py-3 px-2 flex items-center justify-between hover:bg-[#E8F1F5] dark:hover:bg-[#132B3E] rounded-xl transition cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <History className="w-4 h-4 text-[#8CA6B7] group-hover:text-[#00BFA6] transition" />
                      <span className="text-sm font-medium text-[#1F2D3D] dark:text-[#F6FAFC]">
                        {item.query}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => removeFromHistory(item.query, e)}
                      className="p-1 rounded-md text-[#8CA6B7] hover:text-rose-600 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-[#D8E4EA] dark:border-[#1F2D3D] bg-white dark:bg-[#0E2233] shadow-xs py-16 text-center text-[#6B8699] dark:text-[#8CA6B7] text-xs font-medium">
              Type in the search bar above to discover roles, skills, or companies.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchPage;
