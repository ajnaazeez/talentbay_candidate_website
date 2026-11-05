import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/utils/constants';
import { Button } from '@/components/common/Button';
import type { Skill, WorkExperience, Education, Project, Certification } from '@/types';
import type { AiCvModel, GenerateAiCvPayload } from '@/types/aiCv';
import { aiCvService } from '@/services/aiCvService';
import { candidateService } from '@/services/candidateService';
import { AiCvInputForm } from '@/components/cv/AiCvInputForm';
import { AiCvSectionEditor } from '@/components/cv/AiCvSectionEditor';
import { downloadAtsPdf } from '@/utils/atsPdfGenerator';
import {
  Printer,
  ArrowLeft,
  Settings2,
  Check,
  Palette,
  Layout,
  ExternalLink,
  Mail,
  Phone,
  MapPin,
  Globe,
  FileCheck,
  Sparkles,
  History,
  Download,
  Trash2,
  FileText,
  Clock,
  Briefcase,
} from 'lucide-react';

type ActiveTab = 'ai-builder' | 'saved-cvs' | 'classic-print';
type TemplateStyle = 'modern' | 'classic' | 'minimal';
type AccentColor = 'indigo' | 'slate' | 'navy' | 'emerald' | 'purple';
type PageDensity = 'compact' | 'normal' | 'spacious';

const COLOR_MAP: Record<AccentColor, { hex: string; bgClass: string; textClass: string; borderClass: string }> = {
  indigo: {
    hex: '#1d4ed8',
    bgClass: 'bg-brand-600',
    textClass: 'text-brand-600',
    borderClass: 'border-brand-600',
  },
  slate: {
    hex: '#334155',
    bgClass: 'bg-slate-700',
    textClass: 'text-slate-800',
    borderClass: 'border-slate-700',
  },
  navy: {
    hex: '#1e3a8a',
    bgClass: 'bg-blue-900',
    textClass: 'text-blue-900',
    borderClass: 'border-blue-900',
  },
  emerald: {
    hex: '#059669',
    bgClass: 'bg-emerald-600',
    textClass: 'text-emerald-700',
    borderClass: 'border-emerald-600',
  },
  purple: {
    hex: '#7c3aed',
    bgClass: 'bg-purple-600',
    textClass: 'text-purple-700',
    borderClass: 'border-purple-600',
  },
};

export const ResumeBuilderPage: React.FC = () => {
  const { candidate, refreshCandidate } = useAuth();

  const [activeTab, setActiveTab] = useState<ActiveTab>('ai-builder');

  // AI CV Builder State
  const [currentCv, setCurrentCv] = useState<AiCvModel | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Saved CVs history state
  const [savedCvs, setSavedCvs] = useState<AiCvModel[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);

  // Classic print template state
  const [template, setTemplate] = useState<TemplateStyle>('modern');
  const [accentColor, setAccentColor] = useState<AccentColor>('indigo');
  const [density, setDensity] = useState<PageDensity>('normal');
  const [visibleSections, setVisibleSections] = useState({
    summary: true,
    skills: true,
    experience: true,
    education: true,
    projects: true,
    certifications: true,
    languages: true,
  });

  // Load latest CV on mount if candidate exists
  useEffect(() => {
    if (!candidate?.uid) return;

    const fetchLatest = async () => {
      try {
        const latest = await aiCvService.getLatestCv(candidate.uid);
        if (latest) {
          setCurrentCv(latest);
        }
      } catch (err) {
        console.warn('Could not load latest CV:', err);
      }
    };

    fetchLatest();
  }, [candidate?.uid]);

  // Load saved CVs list when switching to history tab
  useEffect(() => {
    if (activeTab === 'saved-cvs' && candidate?.uid) {
      loadSavedCvs();
    }
  }, [activeTab, candidate?.uid]);

  const loadSavedCvs = async () => {
    if (!candidate?.uid) return;
    setLoadingSaved(true);
    try {
      const list = await aiCvService.getAllCvs(candidate.uid);
      setSavedCvs(list);
    } catch (err) {
      console.error('Failed to load saved CVs:', err);
    } finally {
      setLoadingSaved(false);
    }
  };

  const handleGenerateAiCv = async (payload: GenerateAiCvPayload) => {
    setIsGenerating(true);
    setGenerateError(null);
    try {
      const generated = await aiCvService.generateAiCv(payload);
      setCurrentCv(generated);
      // Auto-save to generated_cvs collection
      await aiCvService.saveCv(generated);
    } catch (err: any) {
      console.error('AI CV generation failed:', err);
      setGenerateError(err?.message || 'Failed to generate AI CV. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveCv = async (cvToSave: AiCvModel) => {
    setIsSaving(true);
    try {
      await aiCvService.saveCv(cvToSave);
      setCurrentCv({ ...cvToSave, isSaved: true });
      if (candidate?.uid) {
        loadSavedCvs();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSyncToProfile = async (cv: AiCvModel) => {
    if (!candidate?.uid) return;
    await candidateService.updateCandidate(candidate.uid, {
      aboutMe: cv.summary,
      designation: cv.targetJobRole,
    });
    await refreshCandidate();
  };

  const handleDeleteSavedCv = async (cvId: string) => {
    if (!candidate?.uid) return;
    if (!window.confirm('Are you sure you want to delete this saved CV?')) return;

    try {
      await aiCvService.deleteCv(candidate.uid, cvId);
      setSavedCvs((prev) => prev.filter((c) => c.id !== cvId));
      if (currentCv?.id === cvId) {
        setCurrentCv(null);
      }
    } catch (err) {
      console.error('Failed to delete CV:', err);
    }
  };

  const toggleSection = (sec: keyof typeof visibleSections) => {
    setVisibleSections((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };

  const handlePrint = () => {
    window.print();
  };

  const activeColor = COLOR_MAP[accentColor];
  const fullName = [candidate?.firstName, candidate?.lastName].filter(Boolean).join(' ') || 'Candidate Name';
  const headline = candidate?.bio || candidate?.designation || 'Professional Title';

  return (
    <div className="min-h-screen pb-16">
      {/* Print Specific CSS */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: #0f172a !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          header, aside, .no-print, .candidate-sidebar, .candidate-header {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
          }
          .resume-container {
            margin: 0 !important;
            padding: 18mm 15mm !important;
            box-shadow: none !important;
            border: none !important;
            width: 100% !important;
            max-width: 100% !important;
          }
        }
      `}</style>

      {/* Top Header Navigation */}
      <div className="no-print bg-white dark:bg-dark-card border-b border-gray-100 dark:border-dark-border px-6 py-4 mb-8 sticky top-0 z-30 shadow-xs backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to={ROUTES.PROFILE}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Profile
              </Button>
            </Link>
            <div className="h-4 w-px bg-gray-200 dark:bg-dark-border hidden sm:block" />
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-brand-600" />
                ATS Resume &amp; AI CV Studio
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Generate ATS-optimized resumes with Cloud AI, live section editor, and vector PDF export.
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-dark-hover p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('ai-builder')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'ai-builder'
                  ? 'bg-white dark:bg-dark-card text-brand-600 dark:text-brand-400 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI ATS Builder
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('saved-cvs')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'saved-cvs'
                  ? 'bg-white dark:bg-dark-card text-brand-600 dark:text-brand-400 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Saved CVs
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('classic-print')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'classic-print'
                  ? 'bg-white dark:bg-dark-card text-brand-600 dark:text-brand-400 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              Web Print Layout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* ========================================================== */}
        {/* TAB 1: AI ATS CV BUILDER & LIVE SECTION EDITOR */}
        {/* ========================================================== */}
        {activeTab === 'ai-builder' && (
          <div className="space-y-6">
            {generateError && (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-xs flex items-center justify-between">
                <span>{generateError}</span>
                <button
                  onClick={() => setGenerateError(null)}
                  className="font-bold underline ml-2"
                >
                  Dismiss
                </button>
              </div>
            )}

            {currentCv ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-dark-border">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500">
                      Currently viewing:{' '}
                      <strong className="text-gray-900 dark:text-white">
                        {currentCv.targetJobRole}
                      </strong>
                    </span>
                    <span className="text-[11px] text-gray-400">
                      (Saved {new Date(currentCv.updatedAt).toLocaleDateString()})
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentCv(null)}
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-1 text-brand-600" />
                    Configure New AI CV
                  </Button>
                </div>

                <AiCvSectionEditor
                  cv={currentCv}
                  onUpdateCv={setCurrentCv}
                  onSaveCv={handleSaveCv}
                  onSyncToProfile={handleSyncToProfile}
                  isSaving={isSaving}
                />
              </div>
            ) : candidate ? (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-brand-600 to-brand-800 text-white p-6 rounded-2xl shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-yellow-300" />
                      Create an ATS-Friendly CV with AI
                    </h3>
                    <p className="text-xs text-brand-100 max-w-2xl leading-relaxed">
                      Our Cloud AI analyzes your verified TalentBay profile, aligns it to your target job role and sector, and formats it strictly according to Applicant Tracking System (ATS) guidelines for maximum interview callbacks.
                    </p>
                  </div>
                </div>

                <AiCvInputForm
                  candidate={candidate}
                  onGenerate={handleGenerateAiCv}
                  isGenerating={isGenerating}
                />
              </div>
            ) : (
              <div className="text-center py-12 text-sm text-gray-500">
                Please sign in to access the AI CV Studio.
              </div>
            )}
          </div>
        )}

        {/* ========================================================== */}
        {/* TAB 2: SAVED CVS HISTORY */}
        {/* ========================================================== */}
        {activeTab === 'saved-cvs' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-dark-border">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-brand-600" />
                  Your Saved Resumes
                </h3>
                <p className="text-xs text-gray-500">
                  Access, edit, or download any previously generated ATS resume version.
                </p>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setCurrentCv(null);
                  setActiveTab('ai-builder');
                }}
              >
                <Sparkles className="w-4 h-4 mr-1.5" />
                Create New Resume
              </Button>
            </div>

            {loadingSaved ? (
              <div className="py-16 text-center text-gray-500">
                <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs">Loading saved resumes...</p>
              </div>
            ) : savedCvs.length === 0 ? (
              <div className="bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-2xl p-12 text-center space-y-4 shadow-soft">
                <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                    No Saved Resumes Yet
                  </h4>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">
                    Generate an ATS-friendly CV tailored to your target position and save it here for instant access.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setCurrentCv(null);
                    setActiveTab('ai-builder');
                  }}
                >
                  <Sparkles className="w-4 h-4 mr-1.5" />
                  Generate First Resume
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedCvs.map((cv) => (
                  <div
                    key={cv.id}
                    className="bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-2xl p-5 shadow-soft hover:border-brand-300 dark:hover:border-brand-700 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-brand-600" />
                            {cv.targetJobRole}
                          </h4>
                          {cv.targetIndustry && (
                            <span className="text-[11px] text-gray-500">
                              Industry: {cv.targetIndustry}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(cv.updatedAt).toLocaleDateString()}
                        </span>
                      </div>

                      {cv.summary && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed">
                          {cv.summary}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-1 text-[11px] text-gray-500 pt-1">
                        <span>{cv.workExperience?.length || 0} Experiences</span>
                        <span>•</span>
                        <span>{cv.projects?.length || 0} Projects</span>
                        <span>•</span>
                        <span>{cv.education?.length || 0} Education</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-dark-border">
                      <button
                        type="button"
                        onClick={() => handleDeleteSavedCv(cv.id)}
                        className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors"
                        title="Delete resume"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadAtsPdf(cv)}
                          title="Download ATS PDF"
                        >
                          <Download className="w-3.5 h-3.5 mr-1" />
                          PDF
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setCurrentCv(cv);
                            setActiveTab('ai-builder');
                          }}
                        >
                          Open in Editor
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================== */}
        {/* TAB 3: CLASSIC WEB PRINT PREVIEW LAYOUT */}
        {/* ========================================================== */}
        {activeTab === 'classic-print' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Customization Panel */}
            <div className="no-print lg:col-span-4 space-y-6">
              <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-dark-border p-6 shadow-soft space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-dark-border">
                  <div className="flex items-center gap-2">
                    <Settings2 className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                      Print Layout Settings
                    </h3>
                  </div>
                  <Button variant="primary" size="sm" onClick={handlePrint}>
                    <Printer className="w-3.5 h-3.5 mr-1.5" />
                    Print / PDF
                  </Button>
                </div>

                {/* Template Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                    <Layout className="w-3.5 h-3.5" /> Template Layout
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { id: 'modern', name: 'Modern Clean' },
                        { id: 'classic', name: 'Executive' },
                        { id: 'minimal', name: 'Minimal Tech' },
                      ] as const
                    ).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTemplate(t.id)}
                        className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                          template === t.id
                            ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 ring-2 ring-brand-500/20'
                            : 'border-gray-200 dark:border-dark-border text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-hover'
                        }`}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Accent Color */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5" /> Accent Color
                  </label>
                  <div className="flex items-center gap-3">
                    {(['indigo', 'slate', 'navy', 'emerald', 'purple'] as AccentColor[]).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setAccentColor(c)}
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform ${
                          accentColor === c ? 'scale-110 ring-2 ring-offset-2 ring-brand-500' : 'opacity-80 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: COLOR_MAP[c].hex }}
                      >
                        {accentColor === c && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Density */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                    Spacing &amp; Density
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['compact', 'normal', 'spacious'] as PageDensity[]).map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDensity(d)}
                        className={`py-1.5 rounded-lg border text-xs capitalize font-medium transition-colors ${
                          density === d
                            ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/20 text-brand-600 font-semibold'
                            : 'border-gray-200 dark:border-dark-border text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Section Visibility Toggles */}
                <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-dark-border">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                    Include Sections
                  </label>
                  <div className="space-y-2">
                    {[
                      { key: 'summary', label: 'Professional Summary' },
                      { key: 'skills', label: 'Skills & Tools' },
                      { key: 'experience', label: 'Work Experience' },
                      { key: 'education', label: 'Education' },
                      { key: 'projects', label: 'Projects' },
                      { key: 'certifications', label: 'Certifications' },
                      { key: 'languages', label: 'Languages' },
                    ].map(({ key, label }) => (
                      <label
                        key={key}
                        className="flex items-center justify-between text-xs text-gray-700 dark:text-gray-300 cursor-pointer p-1.5 hover:bg-gray-50 dark:hover:bg-dark-hover rounded-lg"
                      >
                        <span>{label}</span>
                        <input
                          type="checkbox"
                          checked={visibleSections[key as keyof typeof visibleSections]}
                          onChange={() => toggleSection(key as keyof typeof visibleSections)}
                          className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Printable Resume Canvas Preview */}
            <div className="lg:col-span-8 flex justify-center">
              <div
                id="printable-cv"
                className={`resume-container w-full max-w-[800px] bg-white text-gray-900 shadow-xl rounded-2xl border border-gray-200 p-8 sm:p-12 transition-all ${
                  density === 'compact' ? 'space-y-4 text-xs' : density === 'spacious' ? 'space-y-7 text-sm' : 'space-y-5 text-sm'
                }`}
                style={{ fontFamily: 'Inter, system-ui, sans-serif', color: '#1e293b' }}
              >
                {/* 1. Header Details */}
                {template === 'classic' ? (
                  <div className="text-center pb-4 border-b-2 border-gray-900">
                    <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-wide text-gray-900 mb-1">
                      {fullName}
                    </h1>
                    <p className="text-sm font-semibold tracking-wider text-gray-600 uppercase mb-2">
                      {headline}
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-gray-600">
                      {candidate?.email && <span>{candidate.email}</span>}
                      {candidate?.phoneNumber && <span>• {candidate.phoneNumber}</span>}
                      {candidate?.currentLocation && (
                        <span>
                          • {[candidate.currentLocation.city, candidate.currentLocation.country].filter(Boolean).join(', ')}
                        </span>
                      )}
                      {candidate?.linkedinProfile && (
                        <span>
                          •{' '}
                          <a href={candidate.linkedinProfile} className="text-gray-900 underline">
                            LinkedIn
                          </a>
                        </span>
                      )}
                      {candidate?.portfolioUrl && (
                        <span>
                          •{' '}
                          <a href={candidate.portfolioUrl} className="text-gray-900 underline">
                            Portfolio
                          </a>
                        </span>
                      )}
                    </div>
                  </div>
                ) : template === 'minimal' ? (
                  <div className="pb-4 border-b border-gray-300">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
                      {fullName}
                    </h1>
                    <p className="text-sm font-medium text-gray-600 mb-3">{headline}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 font-mono">
                      {candidate?.email && <span>email: {candidate.email}</span>}
                      {candidate?.phoneNumber && <span>tel: {candidate.phoneNumber}</span>}
                      {candidate?.currentLocation && (
                        <span>
                          loc: {[candidate.currentLocation.city, candidate.currentLocation.country].filter(Boolean).join(', ')}
                        </span>
                      )}
                      {candidate?.githubProfile && <span>github: {candidate.githubProfile}</span>}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-5 border-b border-gray-200 gap-4">
                    <div className="space-y-1">
                      <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                        {fullName}
                      </h1>
                      <p className={`text-base font-semibold ${activeColor.textClass}`}>
                        {headline}
                      </p>
                    </div>

                    <div className="text-xs text-gray-600 space-y-1 sm:text-right">
                      {candidate?.email && (
                        <div className="flex items-center sm:justify-end gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-gray-400" />
                          <span>{candidate.email}</span>
                        </div>
                      )}
                      {candidate?.phoneNumber && (
                        <div className="flex items-center sm:justify-end gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          <span>{candidate.phoneNumber}</span>
                        </div>
                      )}
                      {candidate?.currentLocation && (
                        <div className="flex items-center sm:justify-end gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          <span>
                            {[candidate.currentLocation.city, candidate.currentLocation.country]
                              .filter(Boolean)
                              .join(', ')}
                          </span>
                        </div>
                      )}
                      {candidate?.linkedinProfile && (
                        <div className="flex items-center sm:justify-end gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-gray-400" />
                          <a href={candidate.linkedinProfile} className="hover:underline">
                            {candidate.linkedinProfile.replace(/^https?:\/\//, '')}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. Professional Summary */}
                {visibleSections.summary && candidate?.aboutMe && (
                  <section className="space-y-1.5">
                    <h2
                      className={`text-xs font-bold uppercase tracking-wider pb-1 border-b ${
                        template === 'classic'
                          ? 'border-gray-900 text-gray-900'
                          : `${activeColor.borderClass} ${activeColor.textClass}`
                      }`}
                    >
                      Professional Summary
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                      {candidate.aboutMe}
                    </p>
                  </section>
                )}

                {/* 3. Skills */}
                {visibleSections.skills && candidate?.skills && candidate.skills.length > 0 && (
                  <section className="space-y-2">
                    <h2
                      className={`text-xs font-bold uppercase tracking-wider pb-1 border-b ${
                        template === 'classic'
                          ? 'border-gray-900 text-gray-900'
                          : `${activeColor.borderClass} ${activeColor.textClass}`
                      }`}
                    >
                      Core Competencies &amp; Skills
                    </h2>

                    <div className="space-y-1.5 text-xs sm:text-sm">
                      {candidate.skills.some((s: Skill) => s.type === 'Primary') && (
                        <div>
                          <span className="font-bold text-gray-900">Primary Skills: </span>
                          <span className="text-gray-700">
                            {candidate.skills
                              .filter((s: Skill) => s.type === 'Primary')
                              .map((s: Skill) => s.name)
                              .join(' • ')}
                          </span>
                        </div>
                      )}

                      {candidate.skills.some((s: Skill) => s.type === 'Secondary') && (
                        <div>
                          <span className="font-bold text-gray-900">Additional Skills: </span>
                          <span className="text-gray-700">
                            {candidate.skills
                              .filter((s: Skill) => s.type === 'Secondary')
                              .map((s: Skill) => s.name)
                              .join(' • ')}
                          </span>
                        </div>
                      )}

                      {candidate.skills.some((s: Skill) => s.type === 'Tool') && (
                        <div>
                          <span className="font-bold text-gray-900">Tools &amp; Frameworks: </span>
                          <span className="text-gray-700">
                            {candidate.skills
                              .filter((s: Skill) => s.type === 'Tool')
                              .map((s: Skill) => s.name)
                              .join(' • ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </section>
                )}

                {/* 4. Work Experience */}
                {visibleSections.experience && candidate?.workExperience && candidate.workExperience.length > 0 && (
                  <section className="space-y-3">
                    <h2
                      className={`text-xs font-bold uppercase tracking-wider pb-1 border-b ${
                        template === 'classic'
                          ? 'border-gray-900 text-gray-900'
                          : `${activeColor.borderClass} ${activeColor.textClass}`
                      }`}
                    >
                      Professional Experience
                    </h2>

                    <div className="space-y-3">
                      {candidate.workExperience.map((exp: WorkExperience) => (
                        <div key={exp.id} className="space-y-1">
                          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between text-xs sm:text-sm">
                            <div className="font-bold text-gray-900">
                              {exp.jobTitle}{' '}
                              <span className="font-semibold text-gray-600">
                                | {exp.companyName}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 font-medium sm:text-right">
                              {exp.startDate ? new Date(exp.startDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : ''} -{' '}
                              {exp.isCurrent
                                ? 'Present'
                                : exp.endDate
                                ? new Date(exp.endDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
                                : ''}
                            </div>
                          </div>

                          <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">
                            {exp.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* 5. Projects */}
                {visibleSections.projects && candidate?.projects && candidate.projects.length > 0 && (
                  <section className="space-y-3">
                    <h2
                      className={`text-xs font-bold uppercase tracking-wider pb-1 border-b ${
                        template === 'classic'
                          ? 'border-gray-900 text-gray-900'
                          : `${activeColor.borderClass} ${activeColor.textClass}`
                      }`}
                    >
                      Key Projects &amp; Contributions
                    </h2>

                    <div className="space-y-2.5">
                      {candidate.projects.map((proj: Project) => (
                        <div key={proj.id} className="space-y-0.5">
                          <div className="flex items-baseline justify-between text-xs sm:text-sm">
                            <span className="font-bold text-gray-900">
                              {proj.title}{' '}
                              <span className="font-normal text-gray-600 text-xs">
                                ({proj.role})
                              </span>
                            </span>
                            {proj.link && (
                              <a
                                href={proj.link}
                                className="text-xs text-brand-600 hover:underline flex items-center gap-0.5"
                              >
                                Demo <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>

                          <p className="text-xs text-gray-700 leading-relaxed">
                            {proj.description}
                          </p>

                          {proj.technologies?.length > 0 && (
                            <p className="text-[11px] text-gray-500">
                              <span className="font-semibold">Tech: </span>
                              {proj.technologies.join(', ')}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* 6. Education */}
                {visibleSections.education && candidate?.education && candidate.education.length > 0 && (
                  <section className="space-y-2">
                    <h2
                      className={`text-xs font-bold uppercase tracking-wider pb-1 border-b ${
                        template === 'classic'
                          ? 'border-gray-900 text-gray-900'
                          : `${activeColor.borderClass} ${activeColor.textClass}`
                      }`}
                    >
                      Education
                    </h2>

                    <div className="space-y-2">
                      {candidate.education.map((edu: Education) => (
                        <div
                          key={edu.id}
                          className="flex flex-col sm:flex-row sm:items-baseline justify-between text-xs sm:text-sm"
                        >
                          <div>
                            <div className="font-bold text-gray-900">
                              {edu.degree} in {edu.fieldOfStudy}
                            </div>
                            <div className="text-xs text-gray-600">
                              {edu.institution} {edu.grade && `• Grade: ${edu.grade}`}
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 font-medium">
                            {edu.startYear} - {edu.endYear}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* 7. Certifications */}
                {visibleSections.certifications && candidate?.certifications && candidate.certifications.length > 0 && (
                  <section className="space-y-2">
                    <h2
                      className={`text-xs font-bold uppercase tracking-wider pb-1 border-b ${
                        template === 'classic'
                          ? 'border-gray-900 text-gray-900'
                          : `${activeColor.borderClass} ${activeColor.textClass}`
                      }`}
                    >
                      Certifications
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {candidate.certifications.map((cert: Certification) => (
                        <div key={cert.name} className="space-y-0.5">
                          <div className="font-bold text-gray-900">{cert.name}</div>
                          <div className="text-gray-600">
                            {cert.organization}{' '}
                            {cert.issueDate && `(${new Date(cert.issueDate).getFullYear()})`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* 8. Languages */}
                {visibleSections.languages && candidate?.languages && Object.keys(candidate.languages).length > 0 && (
                  <section className="space-y-1.5">
                    <h2
                      className={`text-xs font-bold uppercase tracking-wider pb-1 border-b ${
                        template === 'classic'
                          ? 'border-gray-900 text-gray-900'
                          : `${activeColor.borderClass} ${activeColor.textClass}`
                      }`}
                    >
                      Languages
                    </h2>
                    <p className="text-xs text-gray-700">
                      {Object.entries(candidate.languages)
                        .map(([lang, prof]) => `${lang} (${prof})`)
                        .join(' • ')}
                    </p>
                  </section>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeBuilderPage;
