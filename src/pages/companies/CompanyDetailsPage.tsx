import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { companyService } from '@/services/companyService';
import { jobService } from '@/services/jobService';
import type { Company, Job, JobApplication } from '@/types';
import { JobCard } from '@/components/jobs/JobCard';
import { ApplyJobModal } from '@/components/jobs/ApplyJobModal';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/common/Button';
import {
  Building2,
  MapPin,
  Users,
  Globe,
  ShieldCheck,
  Briefcase,
  ArrowLeft,
  ExternalLink,
  Calendar,
  Phone,
  Mail,
  Share2,
} from 'lucide-react';
import { ROUTES } from '@/utils/constants';

export const CompanyDetailsPage: React.FC = () => {
  const { id: companyId } = useParams<{ id: string }>();
  const { candidate, refreshCandidate } = useAuth();

  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const [selectedJobToApply, setSelectedJobToApply] = useState<Job | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      if (!companyId) return;
      setLoading(true);
      try {
        const [comp, companyJobs] = await Promise.all([
          companyService.getCompanyById(companyId),
          companyService.getCompanyActiveJobs(companyId),
        ]);

        if (isMounted) {
          setCompany(comp);
          setJobs(companyJobs);

          if (candidate?.uid) {
            const apps = await jobService.getCandidateApplications(candidate.uid);
            setAppliedJobIds(new Set(apps.map((a) => a.jobId)));
          }
        }
      } catch (err) {
        console.error('Error loading company details:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [companyId, candidate?.uid]);

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

  if (loading) {
    return (
      <div className="py-24 flex justify-center">
        <LoadingSpinner size="lg" label="Loading company profile..." />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Company Profile Not Found</h2>
        <Link to={ROUTES.COMPANIES}>
          <Button variant="primary" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Companies Directory
          </Button>
        </Link>
      </div>
    );
  }

  const name = company.profile.companyName || company.companyName || 'Company';
  const logo = company.profile.logoUrl || company.logoUrl;
  const isVerified = company.verification?.isVerified || company.isVerified;
  const location = [company.contact?.city, company.contact?.state, company.contact?.country].filter(Boolean).join(', ') || 'Global';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Back button */}
      <div>
        <Link
          to={ROUTES.COMPANIES}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-brand-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Employers Directory
        </Link>
      </div>

      {/* Header Profile Banner */}
      <div className="relative rounded-3xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border shadow-soft overflow-hidden">
        {/* Cover banner */}
        <div className="h-32 sm:h-44 bg-[#0E2233] border-b border-[#1F2D3D] relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#00BFA6]/20 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Company Identity Details */}
        <div className="px-6 sm:px-8 pb-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-14 sm:-mt-16 gap-4 mb-4">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl border-4 border-white dark:border-dark-card overflow-hidden bg-white dark:bg-dark-bg shadow-md flex items-center justify-center p-2">
              {logo ? (
                <img src={logo} alt={name} className="w-full h-full object-contain" />
              ) : (
                <Building2 className="w-12 h-12 text-gray-400" />
              )}
            </div>

            {company.profile.website && (
              <a
                href={company.profile.website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card hover:text-brand-600 shadow-2xs transition-colors self-start sm:self-auto"
              >
                <Globe className="w-3.5 h-3.5" /> Visit Website <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
                {name}
              </h1>
              {isVerified && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-[#00BFA6] bg-[#00BFA6]/15 dark:bg-[#00BFA6]/20 px-2.5 py-1 rounded-full border border-[#00BFA6]/30 dark:border-[#00BFA6]/40">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified Employer
                </span>
              )}
            </div>

            {company.profile.tagline && (
              <p className="text-sm font-semibold text-brand-600 dark:text-brand-400">
                {company.profile.tagline}
              </p>
            )}

            {/* Quick Chips */}
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-gray-600 dark:text-gray-400">
              {company.profile.industry && (
                <span className="inline-flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-gray-400" /> {company.profile.industry}
                </span>
              )}
              {company.profile.companySize && (
                <span className="inline-flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-gray-400" /> {company.profile.companySize}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-gray-400" /> {location}
              </span>
              {company.profile.foundedYear && (
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" /> Founded {company.profile.foundedYear}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: About & Active Jobs */}
        <div className="lg:col-span-8 space-y-6">
          {/* About Company */}
          <div className="rounded-3xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border p-6 sm:p-8 shadow-soft space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
              About {name}
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
              {company.profile.about || company.about || 'A leading verified employer hiring talented professionals across technical and business functions on TalentBay.'}
            </p>
          </div>

          {/* Active Job Openings List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-brand-600" />
                Current Job Openings ({jobs.length})
              </h3>
            </div>

            {jobs.length === 0 ? (
              <div className="p-8 rounded-2xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border text-center text-xs sm:text-sm text-gray-500">
                There are currently no active public vacancies listed by {name}. Check back soon!
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => {
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
            )}
          </div>
        </div>

        {/* Right Column: Company Info Cards */}
        <div className="lg:col-span-4 space-y-5">
          {/* Company Overview */}
          <div className="rounded-3xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border p-6 shadow-soft space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Company Overview
            </h4>

            <div className="space-y-3 text-xs text-gray-600 dark:text-gray-300">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Industry</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {company.profile.industry || 'Technology'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Company Size</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {company.profile.companySize || 'Growing Team'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Headquarters</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {location}
                </span>
              </div>
              {company.contact?.addressLine && (
                <div className="flex items-start justify-between gap-2">
                  <span className="text-gray-400 shrink-0">Address</span>
                  <span className="font-semibold text-gray-900 dark:text-white text-right">
                    {company.contact.addressLine}
                  </span>
                </div>
              )}
              {company.contact?.phone && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Phone</span>
                  <a
                    href={`tel:${company.contact.phone}`}
                    className="font-semibold text-brand-600 hover:underline flex items-center gap-1"
                  >
                    <Phone className="w-3 h-3" />
                    <span>{company.contact.phone}</span>
                  </a>
                </div>
              )}
              {company.contact?.email && (
                <div className="flex items-center justify-between truncate">
                  <span className="text-gray-400">Contact Email</span>
                  <a
                    href={`mailto:${company.contact.email}`}
                    className="text-brand-600 hover:underline truncate flex items-center gap-1"
                  >
                    <Mail className="w-3 h-3" />
                    <span>{company.contact.email}</span>
                  </a>
                </div>
              )}
              {(company.profile.website || company.contact?.website || company.website) && (
                <div className="flex items-center justify-between truncate">
                  <span className="text-gray-400">Website</span>
                  <a
                    href={company.profile.website || company.contact?.website || company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-600 hover:underline truncate flex items-center gap-1"
                  >
                    <Globe className="w-3 h-3" />
                    <span>Visit Website</span>
                    <ExternalLink className="w-2.5 h-2.5 ml-0.5 opacity-70" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Social Presence & Links */}
          {company.social && Object.keys(company.social).length > 0 && (
            <div className="rounded-3xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border p-6 shadow-soft space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-brand-500" />
                <span>Connect & Social</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Object.entries(company.social).map(([network, url]) => {
                  if (!url || typeof url !== 'string' || !url.trim()) return null;
                  const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
                  const label = network.charAt(0).toUpperCase() + network.slice(1);

                  return (
                    <a
                      key={network}
                      href={formattedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 rounded-xl bg-gray-50 dark:bg-dark-bg hover:bg-gray-100 dark:hover:bg-dark-border border border-gray-100 dark:border-dark-border text-xs font-semibold text-gray-700 dark:text-gray-200 flex items-center justify-between transition group"
                    >
                      <span className="truncate">{label}</span>
                      <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-brand-500 transition shrink-0" />
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

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
export default CompanyDetailsPage;
