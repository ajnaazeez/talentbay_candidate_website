import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  updateCandidate,
  uploadResume,
  deleteResume,
  uploadProfilePhoto,
} from '@/services/candidateService';
import {
  calculateProfileCompletion,
  ProfileFactor,
} from '@/utils/profileCompletion';
import type {
  CandidateModel,
  Skill,
  WorkExperience,
  Education,
  Project,
  Certification,
} from '@/types';

import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';

import { EditBasicInfoModal } from '@/components/profile/EditBasicInfoModal';
import { EditHeadlineSummaryModal } from '@/components/profile/EditHeadlineSummaryModal';
import { EditJobPreferenceModal } from '@/components/profile/EditJobPreferenceModal';
import { EditSkillsModal } from '@/components/profile/EditSkillsModal';
import { AddEditExperienceModal } from '@/components/profile/AddEditExperienceModal';
import { AddEditEducationModal } from '@/components/profile/AddEditEducationModal';
import { AddEditProjectModal } from '@/components/profile/AddEditProjectModal';
import { AddEditCertificationModal } from '@/components/profile/AddEditCertificationModal';
import { EditSocialLinksModal } from '@/components/profile/EditSocialLinksModal';

import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  FolderGit2,
  Award,
  Globe,
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Camera,
  Eye,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/utils/constants';

export const ProfilePage: React.FC = () => {
  const { candidate, refreshCandidate } = useAuth();

  // Active Modals state
  const [modalOpen, setModalOpen] = useState<{
    basicInfo: boolean;
    headlineSummary: boolean;
    jobPreference: boolean;
    skills: boolean;
    experience: boolean;
    education: boolean;
    project: boolean;
    certification: boolean;
    socialLinks: boolean;
  }>({
    basicInfo: false,
    headlineSummary: false,
    jobPreference: false,
    skills: false,
    experience: false,
    education: false,
    project: false,
    certification: false,
    socialLinks: false,
  });

  // Selected items for editing
  const [selectedExperience, setSelectedExperience] = useState<WorkExperience | null>(null);
  const [selectedEducation, setSelectedEducation] = useState<Education | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedCertification, setSelectedCertification] = useState<Certification | null>(null);

  // Resume & Photo upload states
  const [uploadingResume, setUploadingResume] = useState(false);
  const [deletingResume, setDeletingResume] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Profile completion accordion
  const [showCompletionDetails, setShowCompletionDetails] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Profile completion calculation
  const completionData = calculateProfileCompletion(candidate);

  // Sync completion percentage to Firestore if changed
  useEffect(() => {
    if (
      candidate?.uid &&
      candidate.profileCompletionPercentage !== completionData.percentage
    ) {
      updateCandidate(candidate.uid, {
        profileCompletionPercentage: completionData.percentage,
      }).catch((err: any) => console.error('Failed to sync completion percentage', err));
    }
  }, [candidate?.uid, completionData.percentage, candidate?.profileCompletionPercentage]);

  const showNotification = (type: 'success' | 'error', text: string) => {
    setFeedbackMessage({ type, text });
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  // Profile photo upload
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !candidate?.uid) return;

    if (!file.type.startsWith('image/')) {
      showNotification('error', 'Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showNotification('error', 'Image size exceeds 5MB limit.');
      return;
    }

    setUploadingPhoto(true);
    try {
      const url = await uploadProfilePhoto(candidate.uid, file);
      await updateCandidate(candidate.uid, { photoUrl: url });
      await refreshCandidate();
      showNotification('success', 'Profile photo updated successfully!');
    } catch (err: any) {
      showNotification('error', err?.message || 'Failed to upload photo.');
    } finally {
      setUploadingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  // Resume upload
  const handleResumeSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !candidate?.uid) return;

    const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowed.includes(file.type) && !file.name.endsWith('.pdf') && !file.name.endsWith('.docx')) {
      showNotification('error', 'Please upload a PDF or DOCX file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showNotification('error', 'Resume file size cannot exceed 10MB.');
      return;
    }

    setUploadingResume(true);
    try {
      const url = await uploadResume(candidate.uid, file);
      await updateCandidate(candidate.uid, { resumeUrl: url });
      await refreshCandidate();
      showNotification('success', 'Resume uploaded successfully!');
    } catch (err: any) {
      showNotification('error', err?.message || 'Failed to upload resume.');
    } finally {
      setUploadingResume(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Delete resume
  const handleDeleteResume = async () => {
    if (!candidate?.uid || !candidate.resumeUrl) return;
    if (!window.confirm('Are you sure you want to delete your current resume?')) return;

    setDeletingResume(true);
    try {
      await deleteResume(candidate.uid, candidate.resumeUrl);
      await updateCandidate(candidate.uid, { resumeUrl: undefined });
      await refreshCandidate();
      showNotification('success', 'Resume deleted successfully.');
    } catch (err: any) {
      showNotification('error', err?.message || 'Failed to delete resume.');
    } finally {
      setDeletingResume(false);
    }
  };

  // Generic updater wrapper
  const handleSaveField = async (data: Partial<CandidateModel>) => {
    if (!candidate?.uid) return;
    await updateCandidate(candidate.uid, data);
    await refreshCandidate();
    showNotification('success', 'Profile updated successfully.');
  };

  // Experience handlers
  const handleSaveExperience = async (exp: WorkExperience) => {
    if (!candidate?.uid) return;
    const currentList = candidate.workExperience || [];
    let updatedList: WorkExperience[];
    if (selectedExperience) {
      updatedList = currentList.map((e: WorkExperience) => (e.id === exp.id ? exp : e));
    } else {
      updatedList = [exp, ...currentList];
    }
    await handleSaveField({ workExperience: updatedList });
  };

  const handleDeleteExperience = async (id: string) => {
    if (!candidate?.uid) return;
    const updatedList = (candidate.workExperience || []).filter((e: WorkExperience) => e.id !== id);
    await handleSaveField({ workExperience: updatedList });
  };

  // Education handlers
  const handleSaveEducation = async (edu: Education) => {
    if (!candidate?.uid) return;
    const currentList = candidate.education || [];
    let updatedList: Education[];
    if (selectedEducation) {
      updatedList = currentList.map((e: Education) => (e.id === edu.id ? edu : e));
    } else {
      updatedList = [edu, ...currentList];
    }
    await handleSaveField({ education: updatedList });
  };

  const handleDeleteEducation = async (id: string) => {
    if (!candidate?.uid) return;
    const updatedList = (candidate.education || []).filter((e: Education) => e.id !== id);
    await handleSaveField({ education: updatedList });
  };

  // Project handlers
  const handleSaveProject = async (proj: Project) => {
    if (!candidate?.uid) return;
    const currentList = candidate.projects || [];
    let updatedList: Project[];
    if (selectedProject) {
      updatedList = currentList.map((p: Project) => (p.id === proj.id ? proj : p));
    } else {
      updatedList = [proj, ...currentList];
    }
    await handleSaveField({ projects: updatedList });
  };

  const handleDeleteProject = async (id: string) => {
    if (!candidate?.uid) return;
    const updatedList = (candidate.projects || []).filter((p: Project) => p.id !== id);
    await handleSaveField({ projects: updatedList });
  };

  // Certification handlers
  const handleSaveCertification = async (cert: Certification) => {
    if (!candidate?.uid) return;
    const currentList = candidate.certifications || [];
    let updatedList: Certification[];
    if (selectedCertification) {
      updatedList = currentList.map((c: Certification) => (c.name === selectedCertification.name ? cert : c));
    } else {
      updatedList = [cert, ...currentList];
    }
    await handleSaveField({ certifications: updatedList });
  };

  const handleDeleteCertification = async (name: string) => {
    if (!candidate?.uid) return;
    const updatedList = (candidate.certifications || []).filter((c: Certification) => c.name !== name);
    await handleSaveField({ certifications: updatedList });
  };

  // Map factor key to modal opener
  const openModalForFactor = (factorKey: ProfileFactor['key']) => {
    switch (factorKey) {
      case 'photoUrl':
        photoInputRef.current?.click();
        break;
      case 'headline':
      case 'aboutMe':
        setModalOpen({ ...modalOpen, headlineSummary: true });
        break;
      case 'currentLocation':
      case 'dob':
      case 'gender':
      case 'nationality':
        setModalOpen({ ...modalOpen, basicInfo: true });
        break;
      case 'jobPreference':
        setModalOpen({ ...modalOpen, jobPreference: true });
        break;
      case 'skills':
        setModalOpen({ ...modalOpen, skills: true });
        break;
      case 'workExperience':
        setSelectedExperience(null);
        setModalOpen({ ...modalOpen, experience: true });
        break;
      case 'education':
        setSelectedEducation(null);
        setModalOpen({ ...modalOpen, education: true });
        break;
      case 'projects':
        setSelectedProject(null);
        setModalOpen({ ...modalOpen, project: true });
        break;
      case 'certifications':
        setSelectedCertification(null);
        setModalOpen({ ...modalOpen, certification: true });
        break;
      case 'languages':
      case 'socialLinks':
        setModalOpen({ ...modalOpen, socialLinks: true });
        break;
      case 'resume':
        fileInputRef.current?.click();
        break;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification Banner */}
      {feedbackMessage && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg border flex items-center gap-2 text-sm font-medium animate-in fade-in slide-in-from-top-2 ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800'
          }`}
        >
          {feedbackMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600" />
          )}
          {feedbackMessage.text}
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handlePhotoSelect}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.doc,application/pdf"
        onChange={handleResumeSelect}
        className="hidden"
      />

      {/* 1. Header Banner & Profile Snapshot */}
      <div className="relative rounded-3xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border shadow-soft overflow-hidden">
        {/* Decorative Top Gradient */}
        <div className="h-32 sm:h-40 bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent pointer-events-none" />
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <Link to={ROUTES.RESUME_BUILDER}>
              <Button variant="secondary" size="sm" className="bg-white/90 hover:bg-white text-gray-900 border-none shadow-sm backdrop-blur-md">
                <FileText className="w-4 h-4 mr-1.5 text-brand-600" />
                ATS Resume Builder
              </Button>
            </Link>
          </div>
        </div>

        {/* Profile Card Body */}
        <div className="px-6 sm:px-8 pb-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-16 sm:-mt-20 gap-4 mb-4">
            {/* Avatar with Camera badge */}
            <div className="relative group self-start">
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl sm:rounded-3xl border-4 border-white dark:border-dark-card overflow-hidden bg-gray-100 dark:bg-dark-bg shadow-md flex items-center justify-center">
                {candidate?.photoUrl ? (
                  <img
                    src={candidate.photoUrl}
                    alt={candidate.firstName || 'Candidate'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-14 h-14 text-gray-400" />
                )}
              </div>
              <button
                type="button"
                disabled={uploadingPhoto}
                onClick={() => photoInputRef.current?.click()}
                className="absolute bottom-1 right-1 p-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white shadow-lg transition-transform active:scale-95 disabled:opacity-50"
                title="Change Profile Photo"
              >
                <Camera className={`w-4 h-4 ${uploadingPhoto ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setModalOpen({ ...modalOpen, basicInfo: true })}
              >
                <Pencil className="w-4 h-4 mr-1.5" />
                Edit Profile Info
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setModalOpen({ ...modalOpen, headlineSummary: true })}
              >
                <Sparkles className="w-4 h-4 mr-1.5" />
                Edit Bio &amp; Headline
              </Button>
            </div>
          </div>

          {/* Candidate Name, Headline & Basic Info Chips */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
                {candidate?.firstName || candidate?.lastName
                  ? `${candidate?.firstName || ''} ${candidate?.lastName || ''}`.trim()
                  : 'Welcome Candidate'}
              </h1>
              {candidate?.designation && (
                <Badge variant="indigo" size="md">
                  {candidate.designation}
                </Badge>
              )}
              {candidate?.isPremium && (
                <Badge variant="purple" size="md">
                  ★ Premium
                </Badge>
              )}
            </div>

            {candidate?.bio ? (
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 font-medium max-w-3xl leading-relaxed">
                {candidate.bio}
              </p>
            ) : (
              <p className="text-sm italic text-gray-400">
                No professional headline added yet. Click &quot;Edit Bio &amp; Headline&quot; to add one.
              </p>
            )}

            {/* Quick Contact Chips */}
            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 pt-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              {candidate?.email && (
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  {candidate.email}
                </span>
              )}
              {candidate?.phoneNumber && (
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  {candidate.phoneNumber}
                </span>
              )}
              {candidate?.currentLocation && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-rose-500" />
                  {[
                    candidate.currentLocation.city,
                    candidate.currentLocation.state,
                    candidate.currentLocation.country,
                  ]
                    .filter(Boolean)
                    .join(', ')}
                </span>
              )}
              {candidate?.nationality && (
                <span className="inline-flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-blue-500" />
                  {candidate.nationality}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Profile Completion Progress Bar & 15-Factor Checklist */}
      <div className="rounded-2xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border p-6 shadow-soft">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Profile Strength: {completionData.percentage}%
              </h3>
              <Badge
                variant={
                  completionData.percentage >= 80
                    ? 'success'
                    : completionData.percentage >= 50
                    ? 'indigo'
                    : 'warning'
                }
                size="sm"
              >
                {completionData.percentage >= 80
                  ? 'All-Star Profile'
                  : completionData.percentage >= 50
                  ? 'Intermediate'
                  : 'Beginner'}
              </Badge>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Recruiters are 4x more likely to contact candidates with profiles above 80% completion.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowCompletionDetails(!showCompletionDetails)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 transition-colors self-start sm:self-auto"
          >
            {showCompletionDetails ? 'Hide Factors' : 'View 15 Profile Factors'}
            {showCompletionDetails ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-100 dark:bg-dark-bg h-2.5 rounded-full overflow-hidden mt-4">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              completionData.percentage >= 80
                ? 'bg-gradient-to-r from-emerald-500 to-green-600'
                : completionData.percentage >= 50
                ? 'bg-gradient-to-r from-brand-500 to-indigo-600'
                : 'bg-gradient-to-r from-amber-500 to-orange-500'
            }`}
            style={{ width: `${completionData.percentage}%` }}
          />
        </div>

        {/* 15-Factor Expandable Details */}
        {showCompletionDetails && (
          <div className="mt-6 pt-5 border-t border-gray-100 dark:border-dark-border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 animate-in fade-in">
            {completionData.factors.map((f: ProfileFactor) => (
              <div
                key={f.key}
                className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                  f.completed
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300'
                    : 'bg-gray-50 dark:bg-dark-bg border-gray-200 dark:border-dark-border text-gray-700 dark:text-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {f.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  )}
                  <div>
                    <p className="font-semibold">{f.label}</p>
                    <p className="text-[10px] text-gray-400">Weight: +{f.weight}%</p>
                  </div>
                </div>

                {!f.completed && (
                  <button
                    type="button"
                    onClick={() => openModalForFactor(f.key)}
                    className="px-2 py-1 bg-brand-50 hover:bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-300 rounded-lg font-semibold text-[11px] transition-colors"
                  >
                    Add
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Resume & Documents Card */}
      <div className="rounded-2xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border p-6 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Resume &amp; Documents
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Upload your latest CV or build an ATS-optimized resume directly.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link to={ROUTES.RESUME_BUILDER}>
              <Button variant="outline" size="sm">
                <Sparkles className="w-3.5 h-3.5 mr-1 text-brand-600" />
                Build ATS Resume
              </Button>
            </Link>
          </div>
        </div>

        {candidate?.resumeUrl ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border gap-3">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Primary Candidate Resume
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Ready for 1-click job applications
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={candidate.resumeUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border text-gray-700 dark:text-gray-300 hover:text-brand-600 shadow-xs transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                View / Download
              </a>
              <button
                type="button"
                disabled={uploadingResume}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border text-gray-700 dark:text-gray-300 hover:text-brand-600 shadow-xs transition-colors"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                Replace
              </button>
              <button
                type="button"
                disabled={deletingResume}
                onClick={handleDeleteResume}
                className="p-2 text-xs rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-100 transition-colors"
                title="Delete Resume"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-200 dark:border-dark-border rounded-2xl p-8 text-center cursor-pointer hover:border-brand-500 dark:hover:border-brand-500 hover:bg-brand-50/20 transition-colors"
          >
            <UploadCloud className={`w-10 h-10 mx-auto text-brand-600 mb-2 ${uploadingResume ? 'animate-bounce' : ''}`} />
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {uploadingResume ? 'Uploading resume...' : 'Click or drag resume file to upload'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Supports PDF, DOCX (Max 10MB)
            </p>
          </div>
        )}
      </div>

      {/* 4. About Me / Professional Summary */}
      <div className="rounded-2xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border p-6 shadow-soft">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            About Me / Summary
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setModalOpen({ ...modalOpen, headlineSummary: true })}
          >
            <Pencil className="w-3.5 h-3.5 mr-1" />
            Edit
          </Button>
        </div>
        {candidate?.aboutMe ? (
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">
            {candidate.aboutMe}
          </p>
        ) : (
          <p className="text-sm italic text-gray-400">
            No professional summary added. Add a summary to showcase your career accomplishments.
          </p>
        )}
      </div>

      {/* 5. Job Preferences */}
      <div className="rounded-2xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border p-6 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
              <Briefcase className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Job Preferences
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setModalOpen({ ...modalOpen, jobPreference: true })}
          >
            <Pencil className="w-3.5 h-3.5 mr-1" />
            Edit Preferences
          </Button>
        </div>

        {candidate?.jobPreference ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs sm:text-sm">
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border">
              <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Desired Role</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {candidate.jobPreference.role || 'Not specified'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border">
              <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Employment Type</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {candidate.jobPreference.employmentType || 'Any'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border">
              <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Work Mode</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {candidate.jobPreference.workMode || 'Any'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border">
              <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Expected Salary</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {candidate.jobPreference.salaryCurrency}{' '}
                {candidate.jobPreference.salaryMin?.toLocaleString()} -{' '}
                {candidate.jobPreference.salaryMax?.toLocaleString()}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border">
              <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Notice Period</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {candidate.jobPreference.noticePeriod || 'Immediate'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border">
              <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Preferred Locations</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {candidate.jobPreference.preferredLocations?.length
                  ? candidate.jobPreference.preferredLocations.join(', ')
                  : 'Any'}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-sm italic text-gray-400">
            No job preferences configured. Add preferences to get matched with the right opportunities.
          </p>
        )}
      </div>

      {/* 6. Skills Management */}
      <div className="rounded-2xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border p-6 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Skills &amp; Technologies ({candidate?.skills?.length || 0})
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setModalOpen({ ...modalOpen, skills: true })}
          >
            <Pencil className="w-3.5 h-3.5 mr-1" />
            Manage Skills
          </Button>
        </div>

        {candidate?.skills && candidate.skills.length > 0 ? (
          <div className="space-y-4">
            {/* Primary Skills */}
            {candidate.skills.some((s: Skill) => s.type === 'Primary') && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Primary Skills
                </p>
                <div className="flex flex-wrap gap-2">
                  {candidate.skills
                    .filter((s: Skill) => s.type === 'Primary')
                    .map((s: Skill) => (
                      <span
                        key={s.name}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800"
                      >
                        {s.name}
                        <span className="text-[10px] opacity-75 font-normal">({s.level})</span>
                      </span>
                    ))}
                </div>
              </div>
            )}

            {/* Secondary Skills */}
            {candidate.skills.some((s: Skill) => s.type === 'Secondary') && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Secondary Skills
                </p>
                <div className="flex flex-wrap gap-2">
                  {candidate.skills
                    .filter((s: Skill) => s.type === 'Secondary')
                    .map((s: Skill) => (
                      <span
                        key={s.name}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                      >
                        {s.name}
                        <span className="text-[10px] opacity-75 font-normal">({s.level})</span>
                      </span>
                    ))}
                </div>
              </div>
            )}

            {/* Tools */}
            {candidate.skills.some((s: Skill) => s.type === 'Tool') && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Tools &amp; Frameworks
                </p>
                <div className="flex flex-wrap gap-2">
                  {candidate.skills
                    .filter((s: Skill) => s.type === 'Tool')
                    .map((s: Skill) => (
                      <span
                        key={s.name}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-dark-bg text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-dark-border"
                      >
                        {s.name}
                        <span className="text-[10px] opacity-75 font-normal">({s.level})</span>
                      </span>
                    ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm italic text-gray-400">
            No skills added yet. Add your primary skills to unlock AI skill matching!
          </p>
        )}
      </div>

      {/* 7. Work Experience Timeline */}
      <div className="rounded-2xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border p-6 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
              <Briefcase className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Work Experience ({candidate?.workExperience?.length || 0})
            </h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedExperience(null);
              setModalOpen({ ...modalOpen, experience: true });
            }}
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add Experience
          </Button>
        </div>

        {candidate?.workExperience && candidate.workExperience.length > 0 ? (
          <div className="space-y-6 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-gray-200 dark:before:bg-dark-border">
            {candidate.workExperience.map((exp: WorkExperience) => (
              <div key={exp.id} className="relative pl-8 group">
                {/* Timeline node */}
                <div className="absolute left-1.5 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-dark-card bg-brand-600 shadow-xs" />

                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 p-4 rounded-xl bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border group-hover:border-brand-300 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                        {exp.jobTitle}
                      </h4>
                      {exp.isCurrent && (
                        <Badge variant="success" size="sm">
                          Current Role
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {exp.companyName} {exp.employmentType && `• ${exp.employmentType}`}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {exp.startDate ? new Date(exp.startDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : ''} -{' '}
                      {exp.isCurrent
                        ? 'Present'
                        : exp.endDate
                        ? new Date(exp.endDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
                        : ''}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-line pt-2 leading-relaxed">
                      {exp.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 self-end sm:self-start opacity-80 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedExperience(exp);
                        setModalOpen({ ...modalOpen, experience: true });
                      }}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-brand-600 hover:bg-gray-200 dark:hover:bg-dark-hover"
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteExperience(exp.id)}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm italic text-gray-400">
            No work experience recorded. Add past or current positions to stand out.
          </p>
        )}
      </div>

      {/* 8. Education */}
      <div className="rounded-2xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border p-6 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Education ({candidate?.education?.length || 0})
            </h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedEducation(null);
              setModalOpen({ ...modalOpen, education: true });
            }}
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add Education
          </Button>
        </div>

        {candidate?.education && candidate.education.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {candidate.education.map((edu: Education) => (
              <div
                key={edu.id}
                className="p-4 rounded-xl bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border flex items-start justify-between gap-2"
              >
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                    {edu.degree} in {edu.fieldOfStudy}
                  </h4>
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {edu.institution}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {edu.startYear} - {edu.endYear} {edu.grade && `• Grade: ${edu.grade}`}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedEducation(edu);
                      setModalOpen({ ...modalOpen, education: true });
                    }}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-brand-600 hover:bg-gray-200 dark:hover:bg-dark-hover"
                    title="Edit"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteEducation(edu.id)}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm italic text-gray-400">
            No education details added.
          </p>
        )}
      </div>

      {/* 9. Projects */}
      <div className="rounded-2xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border p-6 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Projects ({candidate?.projects?.length || 0})
            </h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedProject(null);
              setModalOpen({ ...modalOpen, project: true });
            }}
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add Project
          </Button>
        </div>

        {candidate?.projects && candidate.projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {candidate.projects.map((proj: Project) => (
              <div
                key={proj.id}
                className="p-4 rounded-xl bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border flex flex-col justify-between gap-3"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                        {proj.title}
                      </h4>
                      <p className="text-xs text-brand-600 dark:text-brand-400 font-medium">
                        {proj.role}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      {proj.link && (
                        <a
                          href={proj.link}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg text-gray-500 hover:text-brand-600 hover:bg-gray-200 dark:hover:bg-dark-hover"
                          title="Open Link"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedProject(proj);
                          setModalOpen({ ...modalOpen, project: true });
                        }}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-brand-600 hover:bg-gray-200 dark:hover:bg-dark-hover"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProject(proj.id)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-3">
                    {proj.description}
                  </p>
                </div>

                {proj.technologies?.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1 border-t border-gray-200/60 dark:border-dark-border">
                    {proj.technologies.map((t: string) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded text-[11px] bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border text-gray-700 dark:text-gray-300 font-medium"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm italic text-gray-400">
            No projects added yet. Showcase your practical work to impress technical recruiters.
          </p>
        )}
      </div>

      {/* 10. Certifications & Licenses */}
      <div className="rounded-2xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border p-6 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Certifications ({candidate?.certifications?.length || 0})
            </h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedCertification(null);
              setModalOpen({ ...modalOpen, certification: true });
            }}
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add Certification
          </Button>
        </div>

        {candidate?.certifications && candidate.certifications.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {candidate.certifications.map((cert: Certification) => (
              <div
                key={cert.name}
                className="p-4 rounded-xl bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border flex items-start justify-between gap-2"
              >
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                    {cert.name}
                  </h4>
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {cert.organization}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Issued: {cert.issueDate ? new Date(cert.issueDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : ''}
                    {cert.expiryDate ? ` • Expires: ${new Date(cert.expiryDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}` : ' • No Expiration'}
                  </p>
                  {cert.credentialUrl && (
                    <a
                      href={cert.credentialUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 hover:underline pt-1"
                    >
                      Verify Credential <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCertification(cert);
                      setModalOpen({ ...modalOpen, certification: true });
                    }}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-brand-600 hover:bg-gray-200 dark:hover:bg-dark-hover"
                    title="Edit"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCertification(cert.name)}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm italic text-gray-400">
            No certifications listed.
          </p>
        )}
      </div>

      {/* 11. Online Profiles & Languages */}
      <div className="rounded-2xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border p-6 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400">
              <Globe className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Social Links &amp; Languages
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setModalOpen({ ...modalOpen, socialLinks: true })}
          >
            <Pencil className="w-3.5 h-3.5 mr-1" />
            Edit
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Social Links */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Online Profiles
            </h4>
            <div className="space-y-1.5 text-xs sm:text-sm">
              {candidate?.linkedinProfile ? (
                <a
                  href={candidate.linkedinProfile}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-brand-600 dark:text-brand-400 hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> LinkedIn: {candidate.linkedinProfile}
                </a>
              ) : (
                <span className="text-gray-400 italic">No LinkedIn profile provided</span>
              )}

              {candidate?.githubProfile && (
                <a
                  href={candidate.githubProfile}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-brand-600 dark:text-brand-400 hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> GitHub: {candidate.githubProfile}
                </a>
              )}

              {candidate?.portfolioUrl && (
                <a
                  href={candidate.portfolioUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-brand-600 dark:text-brand-400 hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Portfolio: {candidate.portfolioUrl}
                </a>
              )}

              {candidate?.otherLinks?.map((l: string, idx: number) => (
                <a
                  key={idx}
                  href={l}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-brand-600 dark:text-brand-400 hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> {l}
                </a>
              ))}
            </div>
          </div>

          {/* Languages */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Languages
            </h4>
            {candidate?.languages && Object.keys(candidate.languages).length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {Object.entries(candidate.languages).map(([lang, prof]) => (
                  <span
                    key={lang}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border text-gray-800 dark:text-gray-200"
                  >
                    <span className="font-semibold">{lang}</span>
                    <span className="text-gray-400 font-normal">({String(prof)})</span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs italic text-gray-400">No languages specified.</p>
            )}
          </div>
        </div>
      </div>

      {/* ALL MODAL DIALOGS */}
      {candidate && (
        <>
          <EditBasicInfoModal
            isOpen={modalOpen.basicInfo}
            onClose={() => setModalOpen({ ...modalOpen, basicInfo: false })}
            candidate={candidate}
            onSave={(data) => handleSaveField(data)}
          />

          <EditHeadlineSummaryModal
            isOpen={modalOpen.headlineSummary}
            onClose={() => setModalOpen({ ...modalOpen, headlineSummary: false })}
            candidate={candidate}
            onSave={(data) => handleSaveField(data)}
          />

          <EditJobPreferenceModal
            isOpen={modalOpen.jobPreference}
            onClose={() => setModalOpen({ ...modalOpen, jobPreference: false })}
            jobPreference={candidate.jobPreference}
            onSave={(pref) => handleSaveField({ jobPreference: pref })}
          />

          <EditSkillsModal
            isOpen={modalOpen.skills}
            onClose={() => setModalOpen({ ...modalOpen, skills: false })}
            skills={candidate.skills || []}
            onSave={(skills: Skill[]) => handleSaveField({ skills })}
          />

          <AddEditExperienceModal
            isOpen={modalOpen.experience}
            onClose={() => setModalOpen({ ...modalOpen, experience: false })}
            experience={selectedExperience}
            onSave={handleSaveExperience}
            onDelete={selectedExperience ? handleDeleteExperience : undefined}
          />

          <AddEditEducationModal
            isOpen={modalOpen.education}
            onClose={() => setModalOpen({ ...modalOpen, education: false })}
            education={selectedEducation}
            onSave={handleSaveEducation}
            onDelete={selectedEducation ? handleDeleteEducation : undefined}
          />

          <AddEditProjectModal
            isOpen={modalOpen.project}
            onClose={() => setModalOpen({ ...modalOpen, project: false })}
            project={selectedProject}
            onSave={handleSaveProject}
            onDelete={selectedProject ? handleDeleteProject : undefined}
          />

          <AddEditCertificationModal
            isOpen={modalOpen.certification}
            onClose={() => setModalOpen({ ...modalOpen, certification: false })}
            certification={selectedCertification}
            onSave={handleSaveCertification}
            onDelete={selectedCertification ? handleDeleteCertification : undefined}
          />

          <EditSocialLinksModal
            isOpen={modalOpen.socialLinks}
            onClose={() => setModalOpen({ ...modalOpen, socialLinks: false })}
            initialData={{
              linkedinProfile: candidate.linkedinProfile,
              githubProfile: candidate.githubProfile,
              portfolioUrl: candidate.portfolioUrl,
              otherLinks: candidate.otherLinks,
              languages: candidate.languages,
            }}
            onSave={(data) => handleSaveField(data)}
          />
        </>
      )}
    </div>
  );
};
export default ProfilePage;
