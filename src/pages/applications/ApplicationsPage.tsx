import React, { useEffect, useState, useMemo } from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  FileCheck2,
  Search,
  Filter,
  Building2,
  MapPin,
  Briefcase,
  DollarSign,
  Clock,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { jobService } from '@/services/jobService';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { PageHeader } from '@/components/common/PageHeader';
import { ROUTES } from '@/utils/constants';
import type { JobApplication, Job } from '@/types';

type ApplicationTab = 'all' | 'applied' | 'screening' | 'interviewing' | 'hired' | 'rejected';

interface EnrichedApplication {
  application: JobApplication;
  job: Job | null;
}

const TABS: { id: ApplicationTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'applied', label: 'Applied' },
  { id: 'screening', label: 'Screening' },
  { id: 'interviewing', label: 'Interviewing' },
  { id: 'hired', label: 'Hired' },
  { id: 'rejected', label: 'Rejected' },
];

/**
 * Maps any raw database status to the standard UI tab category.
 * Matches Flutter activity_tab.dart mapping.
 */
function getNormalizedStatusCategory(status: string): ApplicationTab {
  const s = (status || '').toLowerCase().trim();
  if (['hired', 'accepted', 'selected'].includes(s)) return 'hired';
  if (['rejected', 'declined'].includes(s)) return 'rejected';
  if (['interviewing', 'interview'].includes(s)) return 'interviewing';
  if (['screening', 'shortlisted'].includes(s)) return 'screening';
  return 'applied';
}

/**
 * Returns Tailwind styling and display label for a status badge.
 */
function getStatusBadgeConfig(status: string): { label: string; className: string } {
  const s = (status || '').toLowerCase().trim();
  switch (s) {
    case 'hired':
    case 'accepted':
    case 'selected':
      return {
        label: 'HIRED / OFFER',
        className: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
      };
    case 'interviewing':
    case 'interview':
      return {
        label: 'INTERVIEWING',
        className: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
      };
    case 'screening':
    case 'shortlisted':
      return {
        label: 'SCREENING',
        className: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800',
      };
    case 'rejected':
    case 'declined':
      return {
        label: 'REJECTED',
        className: 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
      };
    default:
      return {
        label: 'APPLIED',
        className: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
      };
  }
}

export const ApplicationsPage: React.FC = () => {
  const { candidate } = useAuth();

  const [applications, setApplications] = useState<EnrichedApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<ApplicationTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

  // Real-time subscription to candidate's job applications
  useEffect(() => {
    if (!candidate?.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = jobService.subscribeToCandidateApplications(
      candidate.uid,
      async (rawApps) => {
        try {
          // Filter out invites that have not been accepted yet (they live in /invitations)
          const validApps = rawApps.filter((a) => a.applicationStatus !== 'invited');

          // Enrich each application with current job details
          const enriched = await Promise.all(
            validApps.map(async (app) => {
              try {
                const job = await jobService.getJobById(app.jobId);
                return { application: app, job };
              } catch {
                return { application: app, job: null };
              }
            })
          );

          setApplications(enriched);
          setError(null);
        } catch (err: any) {
          console.error('Error fetching applications data:', err);
          setError('Failed to load application details.');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error('Subscription error for applications:', err);
        setError('Failed to connect to applications service.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [candidate?.uid]);

  // Tab count calculations
  const tabCounts = useMemo(() => {
    const counts: Record<ApplicationTab, number> = {
      all: applications.length,
      applied: 0,
      screening: 0,
      interviewing: 0,
      hired: 0,
      rejected: 0,
    };

    applications.forEach(({ application }) => {
      const category = getNormalizedStatusCategory(application.applicationStatus);
      counts[category] = (counts[category] || 0) + 1;
    });

    return counts;
  }, [applications]);

  // Filtered & sorted applications
  const filteredApplications = useMemo(() => {
    let result = applications;

    // 1. Tab filter
    if (activeTab !== 'all') {
      result = result.filter(
        ({ application }) => getNormalizedStatusCategory(application.applicationStatus) === activeTab
      );
    }

    // 2. Search query filter (matches role title, company name, or location)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(({ application, job }) => {
        const titleMatch = (job?.title || application.jobTitle || '').toLowerCase().includes(q);
        const compMatch = (job?.companyName || '').toLowerCase().includes(q);
        const locMatch = (job?.jobLocation?.city || '').toLowerCase().includes(q);
        return titleMatch || compMatch || locMatch;
      });
    }

    // 3. Sort order
    result.sort((a, b) => {
      const dateA = new Date(a.application.appliedAt).getTime() || 0;
      const dateB = new Date(b.application.appliedAt).getTime() || 0;
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [applications, activeTab, searchQuery, sortBy]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Job Applications"
        description="Monitor your active submissions, interview stages, and recruiter feedback in real time."
        badge={
          <Badge variant="brand" isAi>
            Application Tracker
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <NavLink to={ROUTES.INVITATIONS}>
              <Button variant="outline" size="sm">
                Recruiter Invitations
              </Button>
            </NavLink>
            <NavLink to={ROUTES.JOBS}>
              <Button variant="primary" size="sm">
                Explore Jobs
              </Button>
            </NavLink>
          </div>
        }
      />

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="font-bold underline text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Tabs Navigation & Filters */}
      <div className="space-y-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {TABS.map((tab) => {
            const count = tabCounts[tab.id];
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/25 ring-2 ring-brand-500/20'
                    : 'bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-hover'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-100 dark:bg-dark-hover text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Sort Bar */}
        <div className="bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-2xl p-3 shadow-soft flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by job title, company, or city..."
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50/50 dark:bg-dark-hover/50 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-dark-card focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 text-xs">
            <span className="text-gray-500 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
              className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-hover text-gray-900 dark:text-white"
            >
              <option value="newest">Newest Submitted</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-10 h-10 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-500">Loading your applications...</p>
        </div>
      ) : filteredApplications.length === 0 ? (
        /* Empty State */
        <div className="bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-2xl p-12 text-center space-y-4 shadow-soft">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto">
            <FileCheck2 className="w-7 h-7" />
          </div>

          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              {activeTab === 'all'
                ? 'No Applications Submitted Yet'
                : `No Applications in "${TABS.find((t) => t.id === activeTab)?.label}"`}
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              {activeTab === 'all'
                ? 'Discover matched opportunities and submit your profile to begin tracking applications here.'
                : `None of your applications are currently in the ${activeTab} stage.`}
            </p>
          </div>

          <div className="pt-2">
            <NavLink to={ROUTES.JOBS}>
              <Button variant="primary" size="sm">
                Explore Open Positions
              </Button>
            </NavLink>
          </div>
        </div>
      ) : (
        /* Applications Listing */
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-gray-500 pb-1">
            <span>
              Showing <strong className="text-gray-900 dark:text-white">{filteredApplications.length}</strong> application{filteredApplications.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredApplications.map(({ application, job }) => {
              const companyName = job?.companyName || 'Verified Employer';
              const companyLogo = job?.companyLogoUrl;
              const formattedDate = application.appliedAt
                ? new Date(application.appliedAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'Recent';

              const salaryText =
                job?.salary && (job.salary.min || job.salary.max)
                  ? `${job.salary.currency || '₹'} ${(job.salary.min / 100000).toFixed(1)}L - ${(job.salary.max / 100000).toFixed(1)}L`
                  : null;

              const badge = getStatusBadgeConfig(application.applicationStatus);
              const isInterviewingOrScreening = ['interviewing', 'interview', 'screening', 'shortlisted'].includes(
                (application.applicationStatus || '').toLowerCase()
              );

              return (
                <div
                  key={application.applicationId}
                  className="bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-2xl p-6 shadow-soft hover:border-brand-200 dark:hover:border-brand-800 transition-all space-y-4"
                >
                  {/* Top Bar: Company, Role & Status Badge */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      {companyLogo ? (
                        <img
                          src={companyLogo}
                          alt={companyName}
                          className="w-12 h-12 rounded-xl object-contain bg-gray-50 dark:bg-dark-hover p-1 border border-gray-100 dark:border-dark-border shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0 border border-brand-100 dark:border-brand-900/50">
                          <Building2 className="w-6 h-6" />
                        </div>
                      )}

                      <div className="space-y-1">
                        <h4 className="text-base font-bold text-gray-900 dark:text-white">
                          {job?.title || application.jobTitle || 'Applied Role'}
                        </h4>

                        <div className="flex flex-wrap items-center gap-x-2 text-xs text-gray-600 dark:text-gray-400">
                          <span className="font-semibold text-gray-800 dark:text-gray-200">
                            {companyName}
                          </span>
                          {job?.isVerifiedCompany && (
                            <span className="inline-flex items-center text-brand-600 text-[11px] gap-0.5">
                              <ShieldCheck className="w-3.5 h-3.5" /> Verified
                            </span>
                          )}
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-gray-400" />
                            Applied on {formattedDate}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border self-start ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </div>

                  {/* Metadata Chips */}
                  {job && (
                    <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
                      {job.workMode && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-dark-hover text-gray-700 dark:text-gray-300">
                          <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                          {job.workMode}
                        </span>
                      )}

                      {job.jobLocation?.city && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-dark-hover text-gray-700 dark:text-gray-300">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          {[job.jobLocation.city, job.jobLocation.country].filter(Boolean).join(', ')}
                        </span>
                      )}

                      {salaryText && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-dark-hover text-gray-700 dark:text-gray-300">
                          <DollarSign className="w-3.5 h-3.5 text-gray-400" />
                          {salaryText}
                        </span>
                      )}

                      {job.employmentType && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-dark-hover text-gray-700 dark:text-gray-300">
                          {job.employmentType}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Action Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-dark-border">
                    <span className="text-[11px] text-gray-400 font-mono">
                      Ref: {application.applicationId}
                    </span>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {isInterviewingOrScreening && (
                        <NavLink to={ROUTES.CHAT}>
                          <Button variant="secondary" size="sm">
                            <MessageSquare className="w-3.5 h-3.5 mr-1" />
                            Message Recruiter
                          </Button>
                        </NavLink>
                      )}

                      <Link to={ROUTES.JOB_DETAILS.replace(':id', application.jobId)}>
                        <Button variant="outline" size="sm">
                          View Job Details <ExternalLink className="w-3 h-3 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationsPage;
