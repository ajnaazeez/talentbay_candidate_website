import React, { useState, useEffect } from 'react';
import type { JobFilterOptions } from '@/types';
import {
  Search,
  MapPin,
  RotateCcw,
  X,
  History,
  Trash2,
} from 'lucide-react';
import { searchHistoryUtil, type SearchHistoryItem } from '@/utils/searchHistory';

interface JobFiltersProps {
  filters: JobFilterOptions;
  onChange: (newFilters: JobFilterOptions) => void;
  onReset: () => void;
  totalResults: number;
}

const WORK_MODES = [
  { id: 'all', label: 'All Modes' },
  { id: 'Remote', label: 'Remote' },
  { id: 'Hybrid', label: 'Hybrid' },
  { id: 'Onsite', label: 'On-site' },
];

const EMPLOYMENT_TYPES = [
  { id: 'all', label: 'All Types' },
  { id: 'Full-Time', label: 'Full-Time' },
  { id: 'Part-Time', label: 'Part-Time' },
  { id: 'Contract', label: 'Contract' },
  { id: 'Internship', label: 'Internship' },
];

const SALARY_THRESHOLDS = [
  { label: 'Any Salary', value: 0 },
  { label: '₹3+ LPA', value: 300000 },
  { label: '₹6+ LPA', value: 600000 },
  { label: '₹10+ LPA', value: 1000000 },
  { label: '₹15+ LPA', value: 1500000 },
  { label: '₹25+ LPA', value: 2500000 },
];

const EXPERIENCE_LEVELS = [
  { label: 'Any Experience', value: -1 },
  { label: 'Entry Level (0-1 yrs)', value: 1 },
  { label: 'Junior (1-3 yrs)', value: 3 },
  { label: 'Mid-Senior (3-5 yrs)', value: 5 },
  { label: 'Senior (5+ yrs)', value: 10 },
];

export const JobFilters: React.FC<JobFiltersProps> = ({
  filters,
  onChange,
  onReset,
  totalResults,
}) => {
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);

  useEffect(() => {
    setHistory(searchHistoryUtil.getHistory());
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const q = filters.searchQuery?.trim();
      if (q) {
        const updated = searchHistoryUtil.addQuery(q);
        setHistory(updated);
      }
    }
  };

  const handleSelectHistory = (query: string) => {
    const updated = searchHistoryUtil.addQuery(query);
    setHistory(updated);
    onChange({ ...filters, searchQuery: query });
  };

  const handleRemoveHistory = (e: React.MouseEvent, query: string) => {
    e.stopPropagation();
    const updated = searchHistoryUtil.removeQuery(query);
    setHistory(updated);
  };

  const handleClearHistory = () => {
    searchHistoryUtil.clearHistory();
    setHistory([]);
  };

  const isFiltered = Boolean(
    filters.searchQuery ||
    (filters.location && filters.location !== 'all') ||
    (filters.workMode && filters.workMode !== 'all') ||
    (filters.employmentType && filters.employmentType !== 'all') ||
    (filters.minSalary && filters.minSalary > 0) ||
    (filters.minExperience !== undefined && filters.minExperience >= 0)
  );

  return (
    <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-dark-border p-5 sm:p-6 shadow-soft space-y-4">
      {/* Search & Location Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Keyword Search */}
        <div className="md:col-span-7 relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search role title, company name, skills (press Enter to save)..."
            value={filters.searchQuery || ''}
            onChange={(e) => onChange({ ...filters, searchQuery: e.target.value })}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              if (filters.searchQuery?.trim()) {
                const updated = searchHistoryUtil.addQuery(filters.searchQuery);
                setHistory(updated);
              }
            }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50/50 dark:bg-dark-bg text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-dark-bg transition-all"
          />
          {filters.searchQuery && (
            <button
              type="button"
              onClick={() => onChange({ ...filters, searchQuery: '' })}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Location Filter */}
        <div className="md:col-span-5 relative">
          <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="City, State or Country..."
            value={filters.location || ''}
            onChange={(e) => onChange({ ...filters, location: e.target.value })}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50/50 dark:bg-dark-bg text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-dark-bg transition-all"
          />
        </div>
      </div>

      {/* 30-Day Search History Bar */}
      {history.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
          <span className="inline-flex items-center gap-1 text-gray-400 font-semibold select-none">
            <History className="w-3.5 h-3.5 text-brand-500" />
            <span>Recent:</span>
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {history.slice(0, 6).map((item) => (
              <button
                key={item.query}
                type="button"
                onClick={() => handleSelectHistory(item.query)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-dark-bg dark:hover:bg-dark-border text-gray-700 dark:text-gray-300 font-medium transition group"
                title={`Searched on ${new Date(item.timestamp).toLocaleDateString()}`}
              >
                <span>{item.query}</span>
                <span
                  onClick={(e) => handleRemoveHistory(e, item.query)}
                  className="p-0.5 rounded-full hover:bg-gray-300 dark:hover:bg-slate-700 text-gray-400 hover:text-gray-700 dark:hover:text-white"
                >
                  <X className="w-3 h-3" />
                </span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleClearHistory}
            className="text-[11px] text-gray-400 hover:text-red-500 ml-auto inline-flex items-center gap-1 transition"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear History</span>
          </button>
        </div>
      )}

      {/* Filter Row 2: Pills and Selectors */}
      <div className="pt-2 border-t border-gray-100 dark:border-dark-border space-y-4">
        {/* Work Mode & Employment Type Pills */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 block">
              Work Mode
            </span>
            <div className="flex flex-wrap gap-1.5">
              {WORK_MODES.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => onChange({ ...filters, workMode: mode.id })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    (filters.workMode || 'all').toLowerCase() === mode.id.toLowerCase()
                      ? 'bg-brand-600 text-white shadow-xs'
                      : 'bg-gray-100 dark:bg-dark-bg text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-border'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 block">
              Employment Type
            </span>
            <div className="flex flex-wrap gap-1.5">
              {EMPLOYMENT_TYPES.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => onChange({ ...filters, employmentType: type.id })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    (filters.employmentType || 'all').toLowerCase() === type.id.toLowerCase()
                      ? 'bg-brand-600 text-white shadow-xs'
                      : 'bg-gray-100 dark:bg-dark-bg text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-border'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Dropdowns Row: Salary, Experience, Sorting */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Min Salary */}
          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 block mb-1">
              Minimum Salary
            </label>
            <select
              value={filters.minSalary || 0}
              onChange={(e) => onChange({ ...filters, minSalary: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50/50 dark:bg-dark-bg text-gray-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {SALARY_THRESHOLDS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Max Experience Required */}
          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 block mb-1">
              Experience Level
            </label>
            <select
              value={filters.minExperience !== undefined ? filters.minExperience : -1}
              onChange={(e) => onChange({ ...filters, minExperience: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50/50 dark:bg-dark-bg text-gray-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {EXPERIENCE_LEVELS.map((exp) => (
                <option key={exp.value} value={exp.value}>
                  {exp.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 block mb-1">
              Sort Opportunities
            </label>
            <select
              value={filters.sortBy || 'newest'}
              onChange={(e) => onChange({ ...filters, sortBy: e.target.value as any })}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50/50 dark:bg-dark-bg text-gray-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="newest">Newest First</option>
              <option value="highest_salary">Highest Salary</option>
            </select>
          </div>
        </div>

        {/* Footer info: results count and reset */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-dark-border text-xs text-gray-500 dark:text-gray-400">
          <span>
            Showing <strong className="text-gray-900 dark:text-white font-bold">{totalResults}</strong> active vacancies
          </span>

          {isFiltered && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1 font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
