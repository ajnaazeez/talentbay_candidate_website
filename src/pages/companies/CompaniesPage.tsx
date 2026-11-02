import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { companyService } from '@/services/companyService';
import type { Company } from '@/types';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Badge } from '@/components/common/Badge';
import {
  Building2,
  Search,
  MapPin,
  Users,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export const CompaniesPage: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('all');

  useEffect(() => {
    let isMounted = true;
    async function loadCompanies() {
      setLoading(true);
      try {
        const data = await companyService.getCompanies();
        if (isMounted) setCompanies(data);
      } catch (err) {
        console.error('Error loading companies:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadCompanies();
    return () => {
      isMounted = false;
    };
  }, []);

  // Extract unique industries for filter
  const industries = useMemo(() => {
    const set = new Set<string>();
    companies.forEach((c) => {
      if (c.profile.industry) set.add(c.profile.industry);
    });
    return Array.from(set);
  }, [companies]);

  // Filtered companies
  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const name = (c.profile.companyName || c.companyName || '').toLowerCase();
      const industry = (c.profile.industry || c.industry || '').toLowerCase();
      const about = (c.profile.about || c.about || '').toLowerCase();

      const matchesSearch = !q || name.includes(q) || industry.includes(q) || about.includes(q);
      const matchesIndustry = selectedIndustry === 'all' || industry === selectedIndustry.toLowerCase();

      return matchesSearch && matchesIndustry;
    });
  }, [companies, searchQuery, selectedIndustry]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Hero Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-brand-950 text-white p-6 sm:p-10 shadow-lg overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md text-white border border-white/20">
            <Building2 className="w-3.5 h-3.5 text-brand-300" />
            Verified Employer Directory
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Top Companies Hiring on TalentBay
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
            Explore company cultures, employee benefits, and open positions across top tech companies, high-growth startups, and global enterprises.
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-dark-border p-5 shadow-soft flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search company name, industry, or domain..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50/50 dark:bg-dark-bg text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {industries.length > 0 && (
          <div className="w-full sm:w-64">
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50/50 dark:bg-dark-bg text-gray-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="all">All Industries</option>
              {industries.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="py-24 flex justify-center">
          <LoadingSpinner size="lg" label="Loading verified employers..." />
        </div>
      ) : filteredCompanies.length === 0 ? (
        <EmptyState
          icon={<Building2 className="w-7 h-7 text-slate-400" />}
          title="No Companies Found"
          description="Try modifying your search keywords or choosing 'All Industries'."
          actionLabel="Clear Search"
          onAction={() => {
            setSearchQuery('');
            setSelectedIndustry('all');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCompanies.map((c) => {
            const isVerified = c.verification?.isVerified || c.isVerified;
            const logo = c.profile.logoUrl || c.logoUrl;
            const name = c.profile.companyName || c.companyName || 'Company';
            const location = [c.contact?.city, c.contact?.country].filter(Boolean).join(', ') || 'Global';

            return (
              <div
                key={c.id}
                className="group rounded-3xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border p-6 shadow-soft hover:shadow-hover hover:border-brand-300 dark:hover:border-brand-700/60 transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Logo & Verified Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-14 h-14 rounded-2xl border border-gray-100 dark:border-dark-border bg-gray-50 dark:bg-dark-bg p-2 flex items-center justify-center overflow-hidden shadow-2xs">
                      {logo ? (
                        <img
                          src={logo}
                          alt={name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <Building2 className="w-7 h-7 text-gray-400" />
                      )}
                    </div>

                    {isVerified && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-800">
                        <ShieldCheck className="w-3.5 h-3.5" /> Verified
                      </span>
                    )}
                  </div>

                  {/* Name & Tagline */}
                  <div className="space-y-1">
                    <h3 className="text-base font-extrabold text-gray-900 dark:text-white group-hover:text-brand-600 transition-colors line-clamp-1">
                      {name}
                    </h3>
                    {c.profile.tagline && (
                      <p className="text-xs text-brand-600 dark:text-brand-400 font-medium line-clamp-1">
                        {c.profile.tagline}
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-3 leading-relaxed">
                    {c.profile.about || c.about || 'A leading organization pioneering innovation in technology and hiring through TalentBay.'}
                  </p>

                  {/* Chips: Industry, Size, Location */}
                  <div className="flex flex-wrap gap-1.5 pt-1 text-xs">
                    {c.profile.industry && (
                      <Badge variant="neutral" size="sm">
                        {c.profile.industry}
                      </Badge>
                    )}
                    {c.profile.companySize && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-dark-bg border border-gray-200 dark:border-dark-border">
                        <Users className="w-3 h-3 text-gray-400" />
                        {c.profile.companySize}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-dark-bg border border-gray-200 dark:border-dark-border">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      {location}
                    </span>
                  </div>
                </div>

                {/* Footer link to company details */}
                <div className="pt-5 mt-5 border-t border-gray-100 dark:border-dark-border">
                  <Link
                    to={`/companies/${c.id}`}
                    className="w-full inline-flex items-center justify-between text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 group-hover:translate-x-0.5 transition-all"
                  >
                    <span>View Profile &amp; Job Openings</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default CompaniesPage;
