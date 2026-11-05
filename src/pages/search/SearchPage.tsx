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

  // Handle bookmark
  const handleSaveToggle = async (jobId: string, currentSaved: boolean) => {
    if (!candidate?.uid) return;
    if (currentSaved) {
      await jobService.unsaveJob(candidate.uid, jobId);
    } else {
      await jobService.saveJob(candidate.uid, jobId);
    }
    await refreshCandidate();
  };

  // Filter jobs based on query & category (matching Flutter search logic)
  const filteredJobs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    if (!q && selectedCategory === 'All') {
      return [];
    }

    return allJobs.filter((job) => {
      // Text match
      const roleMatch = (job.roleName || '').toLowerCase().includes(q);
      const designationMatch = (job.designationName || '').toLowerCase().includes(q);
      const companyMatch = (job.companyName || '').toLowerCase().includes(q);
      const expMatch = (job.experienceLevel || '').toLowerCase().includes(q);

      const locationCity = job.jobLocation?.city || '';
      const locationState = job.jobLocation?.state || '';
      const locationCountry = job.jobLocation?.country || '';
      const locationMatch =
        (job.locations || []).some((loc) => loc.toLowerCase().includes(q)) ||
        locationCity.toLowerCase().includes(q) ||
        locationState.toLowerCase().includes(q) ||
        locationCountry.toLowerCase().includes(q);

      const skillsMatch = (job.skillsRequired || []).some((s) => s.toLowerCase().includes(q));

      const matchesText =
        !q ||
        roleMatch ||
        designationMatch ||
        companyMatch ||
        expMatch ||
        locationMatch ||
        skillsMatch;

      // Category match
      let matchesCategory = true;
      if (selectedCategory === 'Remote') {
        matchesCategory = (job.workMode || '').toLowerCase().includes('remote');
      } else if (selectedCategory !== 'All') {
        matchesCategory =
          (job.employmentType || '').toLowerCase() === selectedCategory.toLowerCase();
      }

      return matchesText && matchesCategory;
    });
  }, [allJobs, searchQuery, selectedCategory]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      addToHistory(searchQuery.trim());
      setSearchParams({ q: searchQuery.trim() });
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
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-900 dark:hover:text-white shadow-xs transition cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <form onSubmit={handleSearchSubmit} className="flex-1 relative flex items-center rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs px-4 py-1.5">
          <Search className="w-5 h-5 text-slate-400 mr-2 flex-shrink-0" />
          <input
            type="text"
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search title, skill, or company..."
            className="w-full py-2.5 text-sm md:text-base font-medium bg-transparent border-0 focus:outline-none focus:ring-0 text-slate-900 dark:text-white placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSearchParams({});
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </form>
      </div>

      {/* Category Filter Chips (Matching Flutter exactly) */}
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
                  ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
                  : 'bg-white dark:bg-[#131f37] text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-[#1e2f52] hover:border-slate-300 dark:hover:border-slate-600'
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
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
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
              <SearchX className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-700" />
              <div className="text-base font-bold text-slate-700 dark:text-slate-300">
                No jobs found
              </div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No opportunities matched "{searchQuery}". Try different keywords or reset category filters.
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Recent Searches View (Shown when no search query is active) */
        <div className="pt-2">
          {searchHistory.length > 0 ? (
            <div className="rounded-2xl border border-slate-200/90 dark:border-[#1e2f52] bg-white dark:bg-[#131f37] shadow-card p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#1e2f52]/80">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  RECENT SEARCHES
                </span>
                <button
                  type="button"
                  onClick={clearAllHistory}
                  className="text-xs font-semibold text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 cursor-pointer transition"
                >
                  Clear All
                </button>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-[#1e2f52]/60">
                {searchHistory.map((item) => (
                  <div
                    key={item.query}
                    onClick={() => handleSelectHistoryItem(item.query)}
                    className="py-3 px-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-[#182644]/40 rounded-xl transition cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <History className="w-4 h-4 text-slate-400 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition" />
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                        {item.query}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => removeFromHistory(item.query, e)}
                      className="p-1 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs py-16 text-center text-slate-400 text-xs font-medium">
              Type in the search bar above to discover roles, skills, or companies.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchPage;
