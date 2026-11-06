import React, { useState, useRef } from 'react';
import type { Job, CandidateModel, JobApplication } from '@/types';
import { jobService } from '@/services/jobService';
import { uploadResume } from '@/services/candidateService';
import { aiService } from '@/services/aiService';
import { calculateJobSkillMatch } from '@/utils/skillMatcher';
import { Button } from '@/components/common/Button';
import {
  X,
  FileText,
  UploadCloud,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  ExternalLink,
} from 'lucide-react';

interface ApplyJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job;
  candidate: CandidateModel;
  onSuccess: (application: JobApplication) => void;
}

export const ApplyJobModal: React.FC<ApplyJobModalProps> = ({
  isOpen,
  onClose,
  job,
  candidate,
  onSuccess,
}) => {
  const [selectedResumeUrl, setSelectedResumeUrl] = useState<string>(candidate?.resumeUrl || '');
  const [coverLetter, setCoverLetter] = useState('');
  const [confirmedAccuracy, setConfirmedAccuracy] = useState(true);

  const [uploadingNewResume, setUploadingNewResume] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [enhancingCoverLetter, setEnhancingCoverLetter] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Calculate skill match score
  const matchResult = calculateJobSkillMatch(
    candidate?.skills || [],
    job.skillsRequired.length > 0 ? job.skillsRequired : job.mustHaveSkills
  );

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !candidate?.uid) return;

    if (!file.name.endsWith('.pdf') && !file.name.endsWith('.docx') && !file.name.endsWith('.doc')) {
      setError('Please select a PDF or Word document.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Resume file exceeds 10MB limit.');
      return;
    }

    setUploadingNewResume(true);
    setError(null);
    try {
      const url = await uploadResume(candidate.uid, file);
      setSelectedResumeUrl(url);
    } catch (err: any) {
      setError(err?.message || 'Failed to upload new resume.');
    } finally {
      setUploadingNewResume(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleEnhanceCoverLetter = async () => {
    if (!coverLetter.trim()) {
      setError('Please write an initial cover letter or key points first.');
      return;
    }

    setEnhancingCoverLetter(true);
    setError(null);
    try {
      const enhanced = await aiService.enhanceText({
        text: coverLetter,
        type: 'cover_letter',
        context: {
          jobTitle: job.roleName,
          companyName: job.companyName || '',
        },
      });
      setCoverLetter(enhanced);
    } catch (err: any) {
      setError(err?.message || 'AI cover letter enhancement unavailable.');
    } finally {
      setEnhancingCoverLetter(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResumeUrl) {
      setError('Please provide a resume document to submit your application.');
      return;
    }
    if (!confirmedAccuracy) {
      setError('Please confirm that your application details are accurate.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const candidateName = [candidate.firstName, candidate.lastName].filter(Boolean).join(' ') || 'Applicant';

      const app = await jobService.applyToJob({
        jobId: job.jobId,
        candidateId: candidate.uid,
        candidateName,
        jobTitle: job.roleName,
        companyId: job.companyId,
        recruiterId: job.recruiterId,
        resumeUrl: selectedResumeUrl,
        coverLetter: coverLetter.trim(),
        candidateEmail: candidate.email,
        candidatePhone: candidate.phoneNumber,
        candidateAvatarUrl: candidate.photoUrl,
        matchScore: matchResult.matchPercentage,
      });

      setIsSuccess(true);
      onSuccess(app);
    } catch (err: any) {
      setError(err?.message || 'Failed to submit application.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white dark:bg-dark-card rounded-3xl shadow-2xl border border-gray-100 dark:border-dark-border overflow-hidden my-8 animate-in fade-in zoom-in-95">
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.doc"
          onChange={handleResumeUpload}
          className="hidden"
        />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-dark-border">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Apply for {job.roleName}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {job.companyName} • {job.workMode}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-hover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        {isSuccess ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#00BFA6]/15 text-[#00BFA6] mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xl font-extrabold text-gray-900 dark:text-white">
                Application Submitted!
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                Your profile, resume, and cover letter have been sent directly to the hiring team at{' '}
                <strong>{job.companyName}</strong>.
              </p>
            </div>
            <div className="pt-4 flex items-center justify-center gap-3">
              <Button variant="primary" onClick={onClose}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-xs text-red-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Skill match pill */}
            <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-600" />
                <span className="font-semibold text-gray-900 dark:text-white">
                  Your Skill Match Score:
                </span>
              </div>
              <span className="font-bold text-brand-600 dark:text-brand-400 text-sm">
                {matchResult.matchPercentage}% Match
              </span>
            </div>

            {/* Resume Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-2">
                Resume Document *
              </label>

              {selectedResumeUrl ? (
                <div className="p-3.5 rounded-2xl border border-gray-200 dark:border-dark-border bg-gray-50/50 dark:bg-dark-bg flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                        Primary Resume Attached
                      </p>
                      <a
                        href={selectedResumeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-brand-600 hover:underline flex items-center gap-1"
                      >
                        Preview Resume <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={uploadingNewResume}
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border text-gray-700 dark:text-gray-300 hover:border-brand-500 shadow-2xs transition-colors flex items-center gap-1.5"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    {uploadingNewResume ? 'Uploading...' : 'Replace'}
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 dark:border-dark-border rounded-2xl p-6 text-center cursor-pointer hover:border-brand-500 dark:hover:border-brand-500 hover:bg-brand-50/20 transition-all"
                >
                  <UploadCloud className="w-8 h-8 text-brand-600 mx-auto mb-1.5" />
                  <p className="text-xs font-bold text-gray-900 dark:text-white">
                    {uploadingNewResume ? 'Uploading resume...' : 'Upload your CV / Resume (PDF, DOCX)'}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Maximum file size: 10MB</p>
                </div>
              )}
            </div>

            {/* Cover Letter with AI Enhancement */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                  Cover Letter / Note to Recruiter (Optional)
                </label>
                <button
                  type="button"
                  disabled={enhancingCoverLetter || !coverLetter.trim()}
                  onClick={handleEnhanceCoverLetter}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 disabled:opacity-40 transition-colors"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${enhancingCoverLetter ? 'animate-spin' : ''}`} />
                  {enhancingCoverLetter ? 'Enhancing...' : 'AI Enhance'}
                </button>
              </div>

              <textarea
                rows={5}
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Explain why your background makes you a strong match for this role..."
                className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 leading-relaxed"
              />
            </div>

            {/* Confirmation Checkbox */}
            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-gray-600 dark:text-gray-400 pt-1">
              <input
                type="checkbox"
                checked={confirmedAccuracy}
                onChange={(e) => setConfirmedAccuracy(e.target.checked)}
                className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4 mt-0.5"
              />
              <span>
                I confirm that my profile details, contact information, and resume are up to date and accurate.
              </span>
            </label>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-dark-border">
              <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={submitting}>
                Confirm &amp; Apply
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
