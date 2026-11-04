import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  Star,
  Tv,
  Verified,
  BarChart2,
  Edit2,
  Plus,
  FileText,
  Upload,
  Download,
  Trash2,
  ExternalLink,
  Briefcase,
  GraduationCap,
  FolderGit2,
  Sparkles,
  Eye,
  X,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  updateCandidate,
  uploadResume,
  deleteResume,
  uploadProfilePhoto,
  removeProfilePhoto,
} from '@/services/candidateService';
import { jobService } from '@/services/jobService';
import { assessmentService } from '@/services/assessmentService';
import { aiCvService } from '@/services/aiCvService';
import { generateAtsPdf, downloadAtsPdf } from '@/utils/atsPdfGenerator';
import { calculateProfileCompletion } from '@/utils/profileCompletion';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ROUTES } from '@/utils/constants';
import type {
  CandidateModel,
  WorkExperience,
  Education,
  Project,
  JobPreference,
} from '@/types';
import type { AssessmentResult } from '@/types/assessment';
import type { AiCvModel } from '@/types/aiCv';

// Subform Modals
import { EditBasicInfoModal } from '@/components/profile/EditBasicInfoModal';
import { EditHeadlineSummaryModal } from '@/components/profile/EditHeadlineSummaryModal';
import { EditJobPreferenceModal } from '@/components/profile/EditJobPreferenceModal';
import { EditSkillsModal } from '@/components/profile/EditSkillsModal';
import { AddEditExperienceModal } from '@/components/profile/AddEditExperienceModal';
import { AddEditEducationModal } from '@/components/profile/AddEditEducationModal';
import { AddEditProjectModal } from '@/components/profile/AddEditProjectModal';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { candidate, refreshCandidate, user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [applicationsCount, setApplicationsCount] = useState(0);
  const [assessments, setAssessments] = useState<AssessmentResult[]>([]);
  const [latestSavedCv, setLatestSavedCv] = useState<AiCvModel | null>(null);

  // Active Modals state
  const [modalOpen, setModalOpen] = useState({
    basicInfo: false,
    headlineSummary: false,
    jobPreference: false,
    skills: false,
    experience: false,
    education: false,
    project: false,
    photoOptions: false,
  });

  // Selected items for editing in subforms
  const [selectedExperience, setSelectedExperience] = useState<WorkExperience | null>(null);
  const [selectedEducation, setSelectedEducation] = useState<Education | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Resume & Photo upload states
  const [uploadingResume, setUploadingResume] = useState(false);
  const [deletingResume, setDeletingResume] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Load all background profile data
  const loadProfileAuxData = useCallback(async () => {
    if (!user?.uid) return;
    try {
      setLoading(true);
      const [apps, assessList, cv] = await Promise.all([
        jobService.getCandidateApplications(user.uid),
        assessmentService.getCandidateAssessments(user.uid),
        aiCvService.getLatestCv(user.uid),
      ]);

      setApplicationsCount(apps.length);
      setAssessments(assessList);
      setLatestSavedCv(cv);
    } catch (e) {
      console.warn('Error loading profile aux data:', e);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    loadProfileAuxData();
  }, [loadProfileAuxData]);

  // Profile completion calculation (matching Flutter ProfileCompletionCalculator)
  const completionData = useMemo(() => {
    return calculateProfileCompletion(candidate);
  }, [candidate]);

  // Sync completion percentage to Firestore if changed
  useEffect(() => {
    if (
      candidate?.uid &&
      Math.abs((candidate.profileCompletionPercentage || 0) - completionData.percentage) > 0.01
    ) {
      updateCandidate(candidate.uid, {
        profileCompletionPercentage: completionData.percentage,
      }).catch((err) => console.error('Failed to sync completion percentage', err));
    }
  }, [candidate?.uid, completionData.percentage, candidate?.profileCompletionPercentage]);

  // Helper: Format date MMMM dd, yyyy
  const formatDate = (dateValue: any): string => {
    if (!dateValue) return '';
    try {
      const d = dateValue?.toDate ? dateValue.toDate() : new Date(dateValue);
      return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    } catch {
      return '';
    }
  };

  // Helper: Calculate total work experience in years
  const totalExperienceYears = useMemo(() => {
    const experiences = candidate?.workExperience || [];
    if (experiences.length === 0) return 0;

    let totalMonths = 0;
    for (const exp of experiences) {
      const end = exp.isCurrent || !exp.endDate ? new Date() : new Date(exp.endDate);
      const start = new Date(exp.startDate);
      const diffDays = Math.max(0, Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
      totalMonths += Math.round(diffDays / 30);
    }

    return Math.floor(totalMonths / 12);
  }, [candidate?.workExperience]);

  const experienceText = totalExperienceYears > 0 ? `${totalExperienceYears} Years Experience` : 'Fresher';

  // Helper: Calculate duration between start and end date
  const formatDuration = (startDate: any, endDate?: any, isCurrent?: boolean): string => {
    if (!startDate) return '';
    try {
      const start = new Date(startDate);
      const end = isCurrent || !endDate ? new Date() : new Date(endDate);
      const diffDays = Math.max(0, Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
      const years = Math.floor(diffDays / 365);
      const months = Math.floor((diffDays % 365) / 30);

      const startFormatted = start.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const endFormatted = isCurrent || !endDate ? 'Present' : new Date(endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

      let durationText = '';
      if (years > 0) {
        durationText = months > 0 ? `${years} Year ${months} Months` : `${years} Year`;
      } else {
        durationText = `${months} Months`;
      }

      return `${startFormatted} - ${endFormatted} • ${durationText}`;
    } catch {
      return '';
    }
  };

  // Photo handlers
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !candidate?.uid) return;

    try {
      setUploadingPhoto(true);
      await uploadProfilePhoto(candidate.uid, file);
      await refreshCandidate();
      setFeedback({ type: 'success', message: 'Profile picture updated successfully' });
      setModalOpen((prev) => ({ ...prev, photoOptions: false }));
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to update profile picture' });
    } finally {
      setUploadingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = async () => {
    if (!candidate?.uid) return;
    try {
      setUploadingPhoto(true);
      await removeProfilePhoto(candidate.uid);
      await refreshCandidate();
      setFeedback({ type: 'success', message: 'Profile picture removed successfully' });
      setModalOpen((prev) => ({ ...prev, photoOptions: false }));
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to remove profile picture' });
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Resume handlers
  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !candidate?.uid) return;

    try {
      setUploadingResume(true);
      await uploadResume(candidate.uid, file);
      await refreshCandidate();
      setFeedback({ type: 'success', message: 'Resume uploaded successfully' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to upload resume' });
    } finally {
      setUploadingResume(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteResume = async () => {
    if (!candidate?.uid || !candidate.resumeUrl) return;
    try {
      setDeletingResume(true);
      await deleteResume(candidate.uid, candidate.resumeUrl);
      await refreshCandidate();
      setFeedback({ type: 'success', message: 'Resume deleted successfully' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to delete resume' });
    } finally {
      setDeletingResume(false);
    }
  };

  // Download ATS Resume PDF
  const handleDownloadAtsResume = async () => {
    if (!latestSavedCv) return;
    try {
      downloadAtsPdf(latestSavedCv);
      setFeedback({ type: 'success', message: 'CV downloaded successfully!' });
    } catch {
      setFeedback({ type: 'error', message: 'Failed to download CV.' });
    }
  };

  const handleOpenAtsResume = () => {
    if (!latestSavedCv) return;
    try {
      const doc = generateAtsPdf(latestSavedCv);
      const pdfBlob = doc.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      window.open(blobUrl, '_blank');
    } catch {
      setFeedback({ type: 'error', message: 'Failed to preview CV.' });
    }
  };

  // Generic Subform Update
  const handleUpdateProfile = async (updatedData: Partial<CandidateModel>) => {
    if (!candidate?.uid) return;
    await updateCandidate(candidate.uid, updatedData);
    await refreshCandidate();
  };

  // Candidate full name
  const candidateFullName = useMemo(() => {
    const fName = candidate?.firstName?.trim() || '';
    const lName = candidate?.lastName?.trim() || '';
    const full = `${fName} ${lName}`.trim();
    if (full) return full;
    return user?.displayName || user?.email?.split('@')[0] || 'Candidate Profile';
  }, [candidate?.firstName, candidate?.lastName, user?.displayName, user?.email]);

  // Color helper for profile completion score
  const getCompletionColorClass = (score: number): string => {
    if (score >= 75) return 'text-emerald-500';
    if (score >= 50) return 'text-amber-500';
    return 'text-rose-500';
  };

  if (!candidate || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" label="Loading Candidate Profile..." />
      </div>
    );
  }

  const isPremium = Boolean(
    candidate.isPremium &&
      candidate.subscriptionStatus !== 'expired' &&
      candidate.subscriptionStatus !== 'none'
  );
  const locationText = [candidate.currentLocation?.city, candidate.currentLocation?.country].filter(Boolean).join(', ');

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-24 animate-in fade-in duration-300">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black uppercase tracking-[2px] text-slate-900 dark:text-white font-futura">
          MY PROFILE
        </h1>
      </div>

      {/* Feedback Message */}
      {feedback && (
        <div
          className={`p-4 rounded-none text-xs flex items-center justify-between border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs font-bold uppercase underline hover:opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Section A: Profile Header (Matching Screenshot 5 & Flutter _buildProfileHeader) */}
      <div className="flex flex-col items-center text-center space-y-3 pt-2">
        {/* Avatar with Camera Icon Overlay */}
        <div className="relative">
          <div
            onClick={() => setModalOpen((prev) => ({ ...prev, photoOptions: true }))}
            className="w-24 h-24 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center cursor-pointer group shadow-sm"
          >
            {candidate.photoUrl ? (
              <img
                src={candidate.photoUrl}
                alt={candidateFullName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-3xl font-light text-slate-800 dark:text-slate-100 uppercase">
                {candidate.firstName ? candidate.firstName[0] : 'U'}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setModalOpen((prev) => ({ ...prev, photoOptions: true }))}
            className="absolute bottom-0 right-0 p-1.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md hover:scale-105 transition cursor-pointer"
            title="Update photo"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>

          <input
            type="file"
            ref={photoInputRef}
            onChange={handlePhotoUpload}
            accept="image/*"
            className="hidden"
          />
        </div>

        {/* Subscription Indicator */}
        {isPremium ? (
          <div className="space-y-1">
            <div
              onClick={() => navigate(ROUTES.SUBSCRIPTION)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-black text-[10px] font-black uppercase tracking-wider shadow-xs cursor-pointer hover:bg-amber-300 transition"
            >
              <Star className="w-3 h-3 fill-black text-black" />
              <span>PREMIUM MEMBER</span>
            </div>
            <div>
              <button
                type="button"
                onClick={() => navigate(ROUTES.SUBSCRIPTION)}
                className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <Tv className="w-3 h-3" />
                <span>View Subscription Plans</span>
              </button>
            </div>
          </div>
        ) : (
          <div>
            <button
              type="button"
              onClick={() => navigate(ROUTES.SUBSCRIPTION)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline uppercase tracking-wider cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Upgrade to Premium</span>
            </button>
          </div>
        )}

        {/* Candidate Names, Bio & Designation */}
        <div className="space-y-1 pt-1">
          <h2 className="text-2xl md:text-3xl font-normal text-slate-900 dark:text-white">
            {candidateFullName}
          </h2>

          {candidate.designation && (
            <div className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              {candidate.designation}
            </div>
          )}

          {candidate.bio && (
            <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold max-w-lg mx-auto leading-relaxed pt-1">
              {candidate.bio}
            </p>
          )}

          {candidate.aboutMe && (
            <p className="text-xs text-slate-500 dark:text-slate-400 font-normal max-w-lg mx-auto leading-relaxed pt-1">
              {candidate.aboutMe}
            </p>
          )}

          <div className="text-xs text-slate-400 pt-1 font-medium">
            {experienceText}
          </div>

          {/* Contact Row */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400 pt-2 font-medium">
            {locationText && <span>{locationText}</span>}
            {locationText && <span>•</span>}
            <span>{candidate.email}</span>
            {candidate.phoneNumber && (
              <>
                <span>•</span>
                <span>{candidate.phoneNumber}</span>
              </>
            )}
          </div>
        </div>

        {/* EDIT INTRODUCTION Button */}
        <div className="pt-2 w-full max-w-xs">
          <button
            type="button"
            onClick={() => setModalOpen((prev) => ({ ...prev, basicInfo: true }))}
            className="w-full py-2.5 px-6 border border-teal-600 text-teal-600 dark:border-teal-400 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/20 text-xs font-black tracking-wider uppercase transition cursor-pointer"
          >
            EDIT INTRODUCTION
          </button>
        </div>
      </div>

      {/* Section B: Profile Statistics (Matching Flutter _buildStatsCards) */}
      <div className="border border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-slate-900">
        <div className="grid grid-cols-3 text-center divide-x divide-slate-100 dark:divide-slate-800">
          <div>
            <div className="text-2xl md:text-3xl font-light text-slate-900 dark:text-white">
              {applicationsCount}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">
              APPLICATIONS
            </div>
          </div>

          <div>
            <div className="text-2xl md:text-3xl font-light text-slate-900 dark:text-white">
              {candidate.skills?.length || 0}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">
              SKILLS
            </div>
          </div>

          <div>
            <div className={`text-2xl md:text-3xl font-light ${getCompletionColorClass(completionData.percentage)}`}>
              {completionData.percentage}%
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">
              PROFILE COMPLETION
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 dark:border-slate-800" />

      {/* Section C: CV Headline */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
            CV HEADLINE
          </h3>
          <button
            type="button"
            onClick={() => setModalOpen((prev) => ({ ...prev, headlineSummary: true }))}
            className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>

        <div className="border border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-slate-900 space-y-2">
          {candidate.bio && (
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              {candidate.bio}
            </div>
          )}
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
            {candidate.aboutMe || 'Add a professional description...'}
          </p>
          <div className="pt-2 text-[11px] text-slate-400">
            Keep it updated for better job opportunities
          </div>
        </div>
      </div>

      {/* Section D: Key Skills */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
            KEY SKILLS
          </h3>
          <button
            type="button"
            onClick={() => setModalOpen((prev) => ({ ...prev, skills: true }))}
            className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>

        <div className="border border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-slate-900">
          {(candidate.skills && candidate.skills.length > 0) ? (
            <div className="flex flex-wrap gap-2">
              {candidate.skills.map((skill) => (
                <div
                  key={skill.name}
                  className="px-3 py-1.5 border border-slate-900 dark:border-white text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white"
                >
                  {skill.name}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 space-y-2">
              <div className="text-xs text-slate-400 font-medium">No skills added yet</div>
              <button
                type="button"
                onClick={() => setModalOpen((prev) => ({ ...prev, skills: true }))}
                className="text-xs font-bold uppercase text-teal-600 dark:text-teal-400 hover:underline"
              >
                + Add Skills
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Section E: Skill Assessments */}
      {assessments.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
            SKILL ASSESSMENTS
          </h3>

          <div className="border border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-slate-900 space-y-4">
            <button
              type="button"
              onClick={() => navigate(ROUTES.CAREER_READINESS)}
              className="w-full py-2.5 border border-teal-600 text-teal-600 dark:border-teal-400 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/20 text-xs font-black tracking-wider uppercase transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <BarChart2 className="w-4 h-4" />
              <span>CHECK PERFORMANCE &amp; READINESS</span>
            </button>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {assessments.map((a) => (
                <div key={a.id} className="py-3 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-sm font-black uppercase text-slate-900 dark:text-white">
                      {a.skill}
                    </div>
                    <div className="text-xs text-slate-500 font-medium">
                      {a.difficulty} • {a.proficiencyLevel}
                    </div>
                    <div className="text-xs font-bold text-teal-600 dark:text-teal-400">
                      {Math.round(a.percentage || (a.score / Math.max(a.totalQuestions, 1)) * 100)}% Score
                    </div>
                  </div>
                  <Verified className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Section F: Employment Details */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
            EMPLOYMENT DETAILS
          </h3>
          <button
            type="button"
            onClick={() => {
              setSelectedExperience(null);
              setModalOpen((prev) => ({ ...prev, experience: true }));
            }}
            className="flex items-center gap-1 text-xs font-bold uppercase text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>ADD</span>
          </button>
        </div>

        <div className="border border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-slate-900">
          {(candidate.workExperience && candidate.workExperience.length > 0) ? (
            <div className="space-y-6">
              {candidate.workExperience.map((exp) => (
                <div key={exp.id || exp.companyName} className="flex items-start gap-4">
                  <div className="w-2 h-2 rounded-full bg-slate-400 mt-1.5 flex-shrink-0" />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold uppercase text-slate-900 dark:text-white">
                        {exp.jobTitle}
                      </h4>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedExperience(exp);
                          setModalOpen((prev) => ({ ...prev, experience: true }));
                        }}
                        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      {exp.companyName}
                    </div>
                    <div className="text-xs text-slate-400 font-medium">
                      {formatDuration(exp.startDate, exp.endDate, exp.isCurrent)}
                    </div>
                    {exp.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pt-1 whitespace-pre-line">
                        {exp.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 space-y-2">
              <Briefcase className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
              <div className="text-xs text-slate-400">No work experience added yet</div>
              <button
                type="button"
                onClick={() => {
                  setSelectedExperience(null);
                  setModalOpen((prev) => ({ ...prev, experience: true }));
                }}
                className="text-xs font-bold uppercase text-teal-600 dark:text-teal-400 hover:underline"
              >
                + Add Experience
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Section G: Education */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
            EDUCATION
          </h3>
          <button
            type="button"
            onClick={() => {
              setSelectedEducation(null);
              setModalOpen((prev) => ({ ...prev, education: true }));
            }}
            className="flex items-center gap-1 text-xs font-bold uppercase text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>ADD</span>
          </button>
        </div>

        <div className="border border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-slate-900">
          {(candidate.education && candidate.education.length > 0) ? (
            <div className="space-y-5">
              {candidate.education.map((edu) => (
                <div key={edu.id || edu.institution} className="flex items-start gap-4">
                  <div className="w-2 h-2 rounded-full bg-slate-400 mt-1.5 flex-shrink-0" />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold uppercase text-slate-900 dark:text-white">
                        {edu.degree}
                      </h4>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedEducation(edu);
                          setModalOpen((prev) => ({ ...prev, education: true }));
                        }}
                        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      {edu.institution}
                    </div>
                    <div className="text-xs text-slate-400 font-medium">
                      {edu.startYear} - {edu.endYear || 'Present'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 space-y-2">
              <GraduationCap className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
              <div className="text-xs text-slate-400">No education added yet</div>
              <button
                type="button"
                onClick={() => {
                  setSelectedEducation(null);
                  setModalOpen((prev) => ({ ...prev, education: true }));
                }}
                className="text-xs font-bold uppercase text-teal-600 dark:text-teal-400 hover:underline"
              >
                + Add Education
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Section H: Projects */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
            PROJECTS
          </h3>
          <button
            type="button"
            onClick={() => {
              setSelectedProject(null);
              setModalOpen((prev) => ({ ...prev, project: true }));
            }}
            className="flex items-center gap-1 text-xs font-bold uppercase text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>ADD</span>
          </button>
        </div>

        <div className="border border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-slate-900">
          {(candidate.projects && candidate.projects.length > 0) ? (
            <div className="space-y-6">
              {candidate.projects.map((proj) => (
                <div key={proj.id || proj.title} className="flex items-start gap-4">
                  <div className="w-2 h-2 rounded-full bg-slate-400 mt-1.5 flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold uppercase text-slate-900 dark:text-white">
                        {proj.title}
                      </h4>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedProject(proj);
                          setModalOpen((prev) => ({ ...prev, project: true }));
                        }}
                        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {proj.role && (
                      <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        {proj.role}
                      </div>
                    )}

                    {proj.technologies && proj.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 py-1">
                        {proj.technologies.map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-700 dark:text-slate-300"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}

                    {proj.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
                        {proj.description}
                      </p>
                    )}

                    {proj.link && (
                      <a
                        href={proj.link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1 pt-1 font-medium"
                      >
                        <span>{proj.link}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 space-y-2">
              <FolderGit2 className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
              <div className="text-xs text-slate-400">No projects added yet</div>
              <button
                type="button"
                onClick={() => {
                  setSelectedProject(null);
                  setModalOpen((prev) => ({ ...prev, project: true }));
                }}
                className="text-xs font-bold uppercase text-teal-600 dark:text-teal-400 hover:underline"
              >
                + Add Projects
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Section I: Personal Details */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
            PERSONAL DETAILS
          </h3>
          <button
            type="button"
            onClick={() => setModalOpen((prev) => ({ ...prev, basicInfo: true }))}
            className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>

        <div className="border border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-slate-900 space-y-3 divide-y divide-slate-100 dark:divide-slate-800">
          <div className="pt-2 first:pt-0">
            <div className="text-[11px] font-medium text-slate-400">Date of Birth</div>
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
              {candidate.dob ? formatDate(candidate.dob) : 'Add DOB'}
            </div>
          </div>

          <div className="pt-2">
            <div className="text-[11px] font-medium text-slate-400">Gender</div>
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
              {candidate.gender || 'Add Gender'}
            </div>
          </div>

          <div className="pt-2">
            <div className="text-[11px] font-medium text-slate-400">Nationality</div>
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
              {candidate.nationality || 'Add Nationality'}
            </div>
          </div>

          <div className="pt-2">
            <div className="text-[11px] font-medium text-slate-400">Current City</div>
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
              {candidate.currentLocation?.city || 'Add City'}
            </div>
          </div>

          <div className="pt-2">
            <div className="text-[11px] font-medium text-slate-400">Country</div>
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
              {candidate.currentLocation?.country || 'Add Country'}
            </div>
          </div>

          <div className="pt-2">
            <div className="text-[11px] font-medium text-slate-400">Languages Known</div>
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
              {candidate.languages && Object.keys(candidate.languages).length > 0
                ? Object.keys(candidate.languages).join(', ')
                : 'Add Languages'}
            </div>
          </div>

          <div className="pt-2">
            <div className="text-[11px] font-medium text-slate-400">LinkedIn</div>
            {candidate.linkedinProfile ? (
              <a
                href={candidate.linkedinProfile}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-blue-600 hover:underline inline-flex items-center gap-1 mt-0.5"
              >
                <span>{candidate.linkedinProfile}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                Add LinkedIn
              </div>
            )}
          </div>

          <div className="pt-2">
            <div className="text-[11px] font-medium text-slate-400">Email</div>
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
              {candidate.email}
            </div>
          </div>
        </div>
      </div>

      {/* Section J: Desired Jobs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
            DESIRED JOBS
          </h3>
          <button
            type="button"
            onClick={() => setModalOpen((prev) => ({ ...prev, jobPreference: true }))}
            className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>

        <div className="border border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-slate-900 space-y-3">
          {candidate.jobPreference ? (
            <>
              <div>
                <div className="text-[11px] font-medium text-slate-400">Preferred Designations</div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  {candidate.jobPreference.role || 'Not specified'}
                </div>
              </div>

              <div>
                <div className="text-[11px] font-medium text-slate-400">Preferred Locations</div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  {(candidate.jobPreference.preferredLocations || []).join(', ') || 'Not specified'}
                </div>
              </div>

              <div>
                <div className="text-[11px] font-medium text-slate-400">Preferred Industry</div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  {candidate.jobPreference.preferredIndustry || 'Not specified'}
                </div>
              </div>

              <div>
                <div className="text-[11px] font-medium text-slate-400">Work Mode</div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  {candidate.jobPreference.workMode || 'Remote'} • {candidate.jobPreference.employmentType || 'Full-Time'}
                </div>
              </div>
            </>
          ) : (
            <div className="text-xs text-slate-500">
              Add your job preferences to get better recommendations
            </div>
          )}
        </div>
      </div>

      {/* Section K: Attached CV */}
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
          ATTACHED CV
        </h3>

        <div className="border border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-slate-900">
          {candidate.resumeUrl ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase text-slate-900 dark:text-white">
                    Attached Resume
                  </div>
                  <div className="text-[11px] text-slate-400">
                    PDF Document
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={candidate.resumeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 hover:border-slate-400 text-xs font-bold uppercase text-slate-800 dark:text-slate-200 inline-flex items-center gap-1.5 transition"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Open</span>
                </a>

                <button
                  type="button"
                  disabled={deletingResume}
                  onClick={handleDeleteResume}
                  className="px-3 py-1.5 border border-rose-300 dark:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-xs font-bold uppercase text-rose-600 dark:text-rose-400 inline-flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{deletingResume ? 'Removing...' : 'Delete'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 space-y-3">
              <Upload className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
              <div className="text-xs text-slate-400">No CV attached yet</div>
              <button
                type="button"
                disabled={uploadingResume}
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 border border-teal-600 text-teal-600 dark:border-teal-400 dark:text-teal-400 text-xs font-black uppercase tracking-wider hover:bg-teal-50 dark:hover:bg-teal-950/20 transition cursor-pointer"
              >
                {uploadingResume ? 'UPLOADING...' : 'UPLOAD CV'}
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleResumeUpload}
                accept=".pdf,.doc,.docx"
                className="hidden"
              />
            </div>
          )}
        </div>
      </div>

      {/* Section L: AI Generated CV (Matching Flutter _buildAiGeneratedCv) */}
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
          AI GENERATED CV
        </h3>

        {latestSavedCv ? (
          <div className="border border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-slate-900 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/40 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {latestSavedCv.targetJobRole || 'ATS Resume'}
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold uppercase rounded-sm inline-flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    <span>Saved</span>
                  </span>
                </div>
                <div className="text-xs text-slate-500">
                  {latestSavedCv.targetIndustry ? `${latestSavedCv.targetIndustry} • ` : ''}100% Machine-Readable Single-Column ATS Format
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2">
              <button
                type="button"
                onClick={handleOpenAtsResume}
                className="py-2 border border-slate-300 dark:border-slate-700 hover:border-slate-400 text-slate-800 dark:text-slate-200 text-xs font-bold uppercase flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Open</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadAtsResume}
                className="py-2 border border-slate-300 dark:border-slate-700 hover:border-slate-400 text-slate-800 dark:text-slate-200 text-xs font-bold uppercase flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>

              <button
                type="button"
                onClick={() => navigate(ROUTES.RESUME_BUILDER)}
                className="py-2 border border-slate-300 dark:border-slate-700 hover:border-slate-400 text-slate-800 dark:text-slate-200 text-xs font-bold uppercase flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="border border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/40 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Create CV with AI
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Generate a professional ATS-friendly resume using AI.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate(ROUTES.RESUME_BUILDER)}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-black uppercase tracking-wider transition cursor-pointer whitespace-nowrap self-start sm:self-auto"
            >
              CREATE
            </button>
          </div>
        )}
      </div>

      {/* Modal: Photo Options Bottom Sheet */}
      {modalOpen.photoOptions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-sm p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                PROFILE PICTURE
              </span>
              <button
                type="button"
                onClick={() => setModalOpen((prev) => ({ ...prev, photoOptions: false }))}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                disabled={uploadingPhoto}
                onClick={() => photoInputRef.current?.click()}
                className="w-full py-3 px-4 text-left text-xs font-bold uppercase text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-3 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>{uploadingPhoto ? 'Uploading...' : 'Choose from Gallery / Files'}</span>
              </button>

              {candidate.photoUrl && (
                <button
                  type="button"
                  disabled={uploadingPhoto}
                  onClick={handleRemovePhoto}
                  className="w-full py-3 px-4 text-left text-xs font-bold uppercase text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 flex items-center gap-3 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Remove Photo</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Subform Modal 1: Edit Basic Info */}
      {modalOpen.basicInfo && (
        <EditBasicInfoModal
          isOpen={modalOpen.basicInfo}
          onClose={() => setModalOpen((prev) => ({ ...prev, basicInfo: false }))}
          candidate={candidate}
          onSave={handleUpdateProfile}
        />
      )}

      {/* Subform Modal 2: Edit Headline & Summary */}
      {modalOpen.headlineSummary && (
        <EditHeadlineSummaryModal
          isOpen={modalOpen.headlineSummary}
          onClose={() => setModalOpen((prev) => ({ ...prev, headlineSummary: false }))}
          candidate={candidate}
          onSave={handleUpdateProfile}
        />
      )}

      {/* Subform Modal 3: Edit Skills */}
      {modalOpen.skills && (
        <EditSkillsModal
          isOpen={modalOpen.skills}
          onClose={() => setModalOpen((prev) => ({ ...prev, skills: false }))}
          skills={candidate.skills || []}
          onSave={async (skills) => {
            await handleUpdateProfile({ skills });
          }}
        />
      )}

      {/* Subform Modal 4: Add / Edit Experience */}
      {modalOpen.experience && (
        <AddEditExperienceModal
          isOpen={modalOpen.experience}
          onClose={() => {
            setSelectedExperience(null);
            setModalOpen((prev) => ({ ...prev, experience: false }));
          }}
          experience={selectedExperience}
          onSave={async (exp) => {
            const currentList = candidate.workExperience || [];
            let updatedList: WorkExperience[];
            if (selectedExperience) {
              updatedList = currentList.map((item) => (item.id === exp.id ? exp : item));
            } else {
              updatedList = [...currentList, exp];
            }
            await handleUpdateProfile({ workExperience: updatedList });
          }}
          onDelete={async (id) => {
            const currentList = candidate.workExperience || [];
            const updatedList = currentList.filter((item) => item.id !== id);
            await handleUpdateProfile({ workExperience: updatedList });
          }}
        />
      )}

      {/* Subform Modal 5: Add / Edit Education */}
      {modalOpen.education && (
        <AddEditEducationModal
          isOpen={modalOpen.education}
          onClose={() => {
            setSelectedEducation(null);
            setModalOpen((prev) => ({ ...prev, education: false }));
          }}
          education={selectedEducation}
          onSave={async (edu) => {
            const currentList = candidate.education || [];
            let updatedList: Education[];
            if (selectedEducation) {
              updatedList = currentList.map((item) => (item.id === edu.id ? edu : item));
            } else {
              updatedList = [...currentList, edu];
            }
            await handleUpdateProfile({ education: updatedList });
          }}
          onDelete={async (id) => {
            const currentList = candidate.education || [];
            const updatedList = currentList.filter((item) => item.id !== id);
            await handleUpdateProfile({ education: updatedList });
          }}
        />
      )}

      {/* Subform Modal 6: Add / Edit Project */}
      {modalOpen.project && (
        <AddEditProjectModal
          isOpen={modalOpen.project}
          onClose={() => {
            setSelectedProject(null);
            setModalOpen((prev) => ({ ...prev, project: false }));
          }}
          project={selectedProject}
          onSave={async (proj) => {
            const currentList = candidate.projects || [];
            let updatedList: Project[];
            if (selectedProject) {
              updatedList = currentList.map((item) => (item.id === proj.id ? proj : item));
            } else {
              updatedList = [...currentList, proj];
            }
            await handleUpdateProfile({ projects: updatedList });
          }}
          onDelete={async (id) => {
            const currentList = candidate.projects || [];
            const updatedList = currentList.filter((item) => item.id !== id);
            await handleUpdateProfile({ projects: updatedList });
          }}
        />
      )}

      {/* Subform Modal 7: Edit Job Preferences */}
      {modalOpen.jobPreference && (
        <EditJobPreferenceModal
          isOpen={modalOpen.jobPreference}
          onClose={() => setModalOpen((prev) => ({ ...prev, jobPreference: false }))}
          jobPreference={candidate.jobPreference}
          onSave={async (jobPref: JobPreference) => {
            await handleUpdateProfile({ jobPreference: jobPref });
          }}
        />
      )}
    </div>
  );
};

export default ProfilePage;
