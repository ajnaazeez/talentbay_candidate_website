import React, { useEffect, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  Mail,
  Building2,
  MapPin,
  Briefcase,
  DollarSign,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Sparkles,
  AlertCircle,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { jobService } from '@/services/jobService';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { PageHeader } from '@/components/common/PageHeader';
import { TrialActivationModal } from '@/components/subscription/TrialActivationModal';
import { ROUTES } from '@/utils/constants';
import type { JobApplication, Job } from '@/types';

interface EnrichedInvitation {
  application: JobApplication;
  job: Job | null;
  loadingJob: boolean;
}

export const InvitationsPage: React.FC = () => {
  const { candidate } = useAuth();
  const [invitations, setInvitations] = useState<EnrichedInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [trialModalOpen, setTrialModalOpen] = useState(false);

  // Real-time subscription to recruiter invitations
  useEffect(() => {
    if (!candidate?.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = jobService.subscribeToInvites(
      candidate.uid,
      async (rawInvites) => {
        try {
          // Enrich with job data
          const enriched = await Promise.all(
            rawInvites.map(async (invite) => {
              try {
                const job = await jobService.getJobById(invite.jobId);
                return {
                  application: invite,
                  job,
                  loadingJob: false,
                };
              } catch {
                return {
                  application: invite,
                  job: null,
                  loadingJob: false,
                };
              }
            })
          );
          setInvitations(enriched);
          setError(null);
        } catch (err: any) {
          console.error('Failed to enrich invitations:', err);
          setError('Could not load invitation details.');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error('Subscription error for invitations:', err);
        setError('Failed to connect to invitations stream.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [candidate?.uid]);

  // Accept Invitation Action
  const handleAccept = async (invite: JobApplication) => {
    // Premium check matching Flutter logic: requires candidate to be premium or have trial active
    if (!candidate?.isPremium) {
      setTrialModalOpen(true);
      return;
    }

    setActionLoadingId(invite.applicationId);
    setError(null);
    try {
      await jobService.acceptInvitation(invite.applicationId);
      setSuccessMessage(`Invitation accepted! You have successfully applied for "${invite.jobTitle}".`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error('Failed to accept invitation:', err);
      setError(err?.message || 'Could not accept invitation. Please try again.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Decline Invitation Action
  const handleDecline = async (invite: JobApplication) => {
    if (!window.confirm(`Are you sure you want to decline the invitation for "${invite.jobTitle}"?`)) {
      return;
    }

    setActionLoadingId(invite.applicationId);
    setError(null);
    try {
      await jobService.declineInvitation(invite.applicationId);
      setSuccessMessage(`Invitation for "${invite.jobTitle}" declined.`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error('Failed to decline invitation:', err);
      setError(err?.message || 'Could not decline invitation.');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Recruiter Invitations"
        description="Exclusive direct job opportunities from verified employers interested in your profile."
        badge={
          <Badge variant="brand" isAi>
            Direct Inquiries
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <NavLink to={ROUTES.APPLICATIONS}>
              <Button variant="outline" size="sm">
                View My Applications
              </Button>
            </NavLink>
            <NavLink to={ROUTES.JOBS}>
              <Button variant="primary" size="sm">
                Browse All Jobs
              </Button>
            </NavLink>
          </div>
        }
      />

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-[#00BFA6]/10 dark:bg-[#00BFA6]/20 border border-[#00BFA6]/30 text-[#00BFA6] dark:text-[#D8E4EA] text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#00BFA6]" />
            <span>{successMessage}</span>
          </div>
          <NavLink
            to={ROUTES.APPLICATIONS}
            className="font-bold underline text-[#00BFA6] hover:text-[#00A892] ml-4 shrink-0"
          >
            Go to Applications →
          </NavLink>
        </div>
      )}

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

      {/* Loading State */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-10 h-10 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-500">Checking for recruiter invitations...</p>
        </div>
      ) : invitations.length === 0 ? (
        /* Empty State */
        <div className="bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-2xl p-12 text-center space-y-4 shadow-soft">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto">
            <Mail className="w-7 h-7" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              No Pending Invitations
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              When verified recruiters review your career profile and consider you a match for their open roles, you will receive direct interview invitations here.
            </p>
          </div>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <NavLink to={ROUTES.PROFILE}>
              <Button variant="outline" size="sm">
                Enhance Profile Visibility
              </Button>
            </NavLink>
            <NavLink to={ROUTES.JOBS}>
              <Button variant="primary" size="sm">
                Explore Active Openings
              </Button>
            </NavLink>
          </div>
        </div>
      ) : (
        /* Invitations List */
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-gray-500 pb-1">
            <span>
              Showing <strong className="text-gray-900 dark:text-white">{invitations.length}</strong> active invitation{invitations.length > 1 ? 's' : ''}
            </span>
            <span className="text-[11px] text-gray-400">
              Accepting automatically adds you to the employer's applicant pool
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {invitations.map(({ application, job }) => {
              const companyName = job?.companyName || application.candidateName ? `${job?.companyName || 'Verified Employer'}` : 'TalentBay Partner';
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

              const isActing = actionLoadingId === application.applicationId;

              return (
                <div
                  key={application.applicationId}
                  className="bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-2xl p-6 shadow-soft hover:border-brand-200 dark:hover:border-brand-800 transition-all space-y-4"
                >
                  {/* Top Bar: Company, Title & Status */}
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
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-gray-900 dark:text-white">
                            {job?.title || application.jobTitle || 'Role Invitation'}
                          </h4>
                        </div>

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
                            Invited on {formattedDate}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 self-start">
                      <Sparkles className="w-3.5 h-3.5" />
                      RECRUITER INVITED
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

                  {/* Required Skills Chips */}
                  {job?.skillsRequired && job.skillsRequired.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                        Matching Skills
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {job.skillsRequired.slice(0, 6).map((skill, sIdx) => (
                          <span
                            key={sIdx}
                            className="px-2 py-0.5 rounded-md text-[11px] bg-brand-50/60 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300 border border-brand-200/50 dark:border-brand-800/40"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bottom Action Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-dark-border">
                    <Link
                      to={ROUTES.JOB_DETAILS.replace(':id', application.jobId)}
                      className="text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400 flex items-center gap-1 font-semibold"
                    >
                      View Full Job Description <ExternalLink className="w-3 h-3" />
                    </Link>

                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isActing}
                        onClick={() => handleDecline(application)}
                        className="text-red-600 hover:text-red-700 border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/20"
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1 text-red-500" />
                        Decline
                      </Button>

                      <Button
                        variant="primary"
                        size="sm"
                        disabled={isActing}
                        onClick={() => handleAccept(application)}
                        className="shadow-sm shadow-brand-500/20 px-5"
                      >
                        {isActing ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                            Accept Invitation
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 7-Day Free Trial / Subscription Activation Modal */}
      <TrialActivationModal
        isOpen={trialModalOpen}
        onClose={() => setTrialModalOpen(false)}
        onSuccess={() => {
          setTrialModalOpen(false);
          setSuccessMessage('Your 7-Day Free Trial is now active! You can now accept invitations.');
        }}
      />
    </div>
  );
};

export default InvitationsPage;
