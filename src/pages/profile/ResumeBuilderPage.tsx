import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/utils/constants';
import { Button } from '@/components/common/Button';
import type { Skill, WorkExperience, Education, Project, Certification } from '@/types';
import type { AiCvModel, GenerateAiCvPayload } from '@/types/aiCv';
import { aiCvService } from '@/services/aiCvService';
import { candidateService } from '@/services/candidateService';
import { AiCvInputForm } from '@/components/cv/AiCvInputForm';
import { AiCvSectionEditor } from '@/components/cv/AiCvSectionEditor';
import { downloadAtsPdf } from '@/utils/atsPdfGenerator';
import { hasActivePaidPremium } from '@/utils/subscriptionUtils';
import {
  Printer,
  ArrowLeft,
  Settings2,
  Check,
  Palette,
  Layout,
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
  Crown,
} from 'lucide-react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

type ActiveTab = 'ai-builder' | 'saved-cvs' | 'classic-print';
type TemplateStyle = 'modern' | 'classic' | 'minimal';
type AccentColor = 'copper' | 'charcoal' | 'bronze' | 'slate' | 'navy' | 'terracotta';
type PageDensity = 'compact' | 'normal' | 'spacious';

const COLOR_MAP: Record<AccentColor, { hex: string; bgClass: string; textClass: string; borderClass: string }> = {
  copper: {
    hex: '#00BFA6',
    bgClass: 'bg-[#00BFA6]',
    textClass: 'text-[#00BFA6]',
    borderClass: 'border-[#00BFA6]',
  },
  charcoal: {
    hex: '#0E2233',
    bgClass: 'bg-[#0E2233]',
    textClass: 'text-[#0E2233] dark:text-white',
    borderClass: 'border-[#0E2233] dark:border-white',
  },
  bronze: {
    hex: '#00A892',
    bgClass: 'bg-[#00A892]',
    textClass: 'text-[#00A892]',
    borderClass: 'border-[#00A892]',
  },
  slate: {
    hex: '#1F2D3D',
    bgClass: 'bg-[#1F2D3D]',
    textClass: 'text-[#1F2D3D] dark:text-[#BACDD8]',
    borderClass: 'border-[#1F2D3D]',
  },
  navy: {
    hex: '#0E2233',
    bgClass: 'bg-[#0E2233]',
    textClass: 'text-[#0E2233] dark:text-white',
    borderClass: 'border-[#0E2233]',
  },
  terracotta: {
    hex: '#008C79',
    bgClass: 'bg-[#008C79]',
    textClass: 'text-[#008C79] dark:text-[#5EEAD9]',
    borderClass: 'border-[#008C79]',
  },
};

export const ResumeBuilderPage: React.FC = () => {
  const { candidate, refreshCandidate, initialLoading } = useAuth();
  const navigate = useNavigate();

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
  const [accentColor, setAccentColor] = useState<AccentColor>('copper');
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

  const isPaidPremium = hasActivePaidPremium(candidate);

  // Load latest CV on mount if candidate exists (checks candidate.latestGeneratedCv first)
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
    if (!isPaidPremium) {
      navigate(ROUTES.SUBSCRIPTION);
      return;
    }

    try {
      setIsGenerating(true);
      setGenerateError(null);

      const generated = await aiCvService.generateAiCv(payload, candidate || undefined);
      setCurrentCv(generated);
      await loadSavedCvs();
    } catch (err: any) {
      console.error('Failed to generate AI CV:', err);
      setGenerateError(err?.message || 'Failed to generate CV. Please check your inputs and try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveCv = async (cvToSave: AiCvModel) => {
    try {
      setIsSaving(true);
      await aiCvService.saveCv(cvToSave);
      setCurrentCv(cvToSave);
      await loadSavedCvs();
    } catch (err: any) {
      console.error('Failed to save CV:', err);
      setGenerateError(err?.message || 'Failed to save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSyncToProfile = async (cvToSync: AiCvModel) => {
    if (!candidate?.uid) return;
    try {
      setIsSaving(true);
      await candidateService.updateCandidate(candidate.uid, {
        aboutMe: cvToSync.summary,
        bio: cvToSync.summary,
      });
      await refreshCandidate();
    } catch (err: any) {
      console.error('Failed to sync to profile:', err);
      setGenerateError(err?.message || 'Failed to sync CV to candidate profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSavedCv = async (cvId: string) => {
    if (!candidate?.uid) return;
    if (!window.confirm('Are you sure you want to delete this saved CV?')) return;

    try {
      await aiCvService.deleteCv(candidate.uid, cvId);
      if (currentCv?.id === cvId) {
        setCurrentCv(null);
      }
      await loadSavedCvs();
    } catch (err) {
      console.error('Failed to delete CV:', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const toggleSection = (key: keyof typeof visibleSections) => {
    setVisibleSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (initialLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" label="Loading AI CV Studio..." />
      </div>
    );
  }

  const fullName = candidate?.firstName
    ? `${candidate.firstName} ${candidate.lastName || ''}`.trim()
    : 'Candidate Name';

  const headline = candidate?.designation || candidate?.jobPreference?.role || candidate?.bio || 'Professional Title';

  const activeColor = COLOR_MAP[accentColor] || COLOR_MAP.copper;

  return (
    <div className="min-h-screen bg-[#F6FAFC] dark:bg-[#08141F] pb-24 transition-colors">
      {/* Print Specific CSS Overrides */}
      <style>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          .no-print, header, aside, nav, .print-hide {
            display: none !important;
          }
          .resume-container {
            box-shadow: none !important;
            border: none !important;
            width: 100% !important;
            max-width: 100% !important;
          }
        }
      `}</style>

      {/* Top Header Navigation */}
      <div className="no-print bg-white/95 dark:bg-[#0E2233]/95 border-b border-[#D8E4EA] dark:border-[#1F2D3D] px-4 sm:px-6 py-4 mb-8 sticky top-0 z-30 shadow-xs backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to={ROUTES.PROFILE}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-1 text-[#00BFA6]" />
                Back to Profile
              </Button>
            </Link>
            <div className="h-4 w-px bg-[#D8E4EA] dark:bg-[#1F2D3D] hidden sm:block" />
            <div>
              <h2 className="text-base font-bold text-[#1F2D3D] dark:text-white flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-[#00BFA6]" />
                ATS Resume &amp; AI CV Studio
              </h2>
              <p className="text-xs text-[#6B8699] dark:text-[#8CA6B7]">
                Generate ATS-optimized resumes with Cloud AI, live section editor, and vector PDF export.
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 bg-[#E8F1F5] dark:bg-[#0A1A27] p-1 rounded-xl border border-[#D8E4EA] dark:border-[#1F2D3D]">
            <button
              type="button"
              onClick={() => setActiveTab('ai-builder')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'ai-builder'
                  ? 'bg-white dark:bg-[#0E2233] text-[#1F2D3D] dark:text-white shadow-xs'
                  : 'text-[#1F2D3D] dark:text-[#BACDD8] hover:text-[#0E2233]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#00BFA6]" />
              AI ATS Builder
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('saved-cvs')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'saved-cvs'
                  ? 'bg-white dark:bg-[#0E2233] text-[#1F2D3D] dark:text-white shadow-xs'
                  : 'text-[#1F2D3D] dark:text-[#BACDD8] hover:text-[#0E2233]'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Saved Resumes
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('classic-print')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'classic-print'
                  ? 'bg-white dark:bg-[#0E2233] text-[#1F2D3D] dark:text-white shadow-xs'
                  : 'text-[#1F2D3D] dark:text-[#BACDD8] hover:text-[#0E2233]'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              Web Print Layout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* TAB 1: AI ATS CV BUILDER & LIVE SECTION EDITOR */}
        {activeTab === 'ai-builder' && (
          <div className="space-y-6">
            {generateError && (
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs flex items-center justify-between">
                <span>{generateError}</span>
                <button
                  onClick={() => setGenerateError(null)}
                  className="font-bold underline ml-2 cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Premium Subscription Guard matching Flutter AiCvSubscriptionGuard */}
            {!isPaidPremium && !currentCv ? (
              <div className="bg-white dark:bg-[#0E2233] border border-[#D8E4EA] dark:border-[#1F2D3D] rounded-3xl p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-6 shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-[#00BFA6]/15 text-[#00BFA6] flex items-center justify-center mx-auto ring-1 ring-[#00BFA6]/30">
                  <Crown className="w-8 h-8" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl sm:text-2xl font-black text-[#1F2D3D] dark:text-white tracking-tight">
                    AI CV Creation is an Exclusive Premium Feature
                  </h3>
                  <p className="text-xs sm:text-sm text-[#1F2D3D] dark:text-[#BACDD8] max-w-lg mx-auto leading-relaxed">
                    An active Premium subscription is required to generate AI CVs. Free trial accounts do not include this feature.
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => navigate(ROUTES.SUBSCRIPTION)}
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade to Premium
                  </Button>
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={() => setActiveTab('classic-print')}
                  >
                    Use Web Print Template
                  </Button>
                </div>
              </div>
            ) : currentCv ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-2 border-b border-[#D8E4EA] dark:border-[#1F2D3D]">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-[#6B8699] dark:text-[#8CA6B7]">
                      Currently viewing:{' '}
                      <strong className="text-[#1F2D3D] dark:text-white">
                        {currentCv.targetJobRole}
                      </strong>
                    </span>
                    <span className="text-[11px] text-[#8CA6B7]">
                      (Saved {new Date(currentCv.updatedAt).toLocaleDateString()})
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentCv(null)}
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-1 text-[#00BFA6]" />
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
                <div className="bg-[#0E2233] text-white p-6 sm:p-8 rounded-2xl border border-[#1F2D3D] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-white">
                      <Sparkles className="w-5 h-5 text-[#00BFA6]" />
                      Create an ATS-Friendly CV with AI
                    </h3>
                    <p className="text-xs text-[#BACDD8] max-w-2xl leading-relaxed">
                      Our Cloud AI analyzes your verified TalentBay candidate profile, aligns it to your target job role and sector, and formats it strictly according to Applicant Tracking System (ATS) guidelines for maximum interview callbacks.
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
              <div className="text-center py-12 text-sm text-[#6B8699]">
                Please sign in to access the AI CV Studio.
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SAVED CVS HISTORY */}
        {activeTab === 'saved-cvs' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#D8E4EA] dark:border-[#1F2D3D]">
              <div>
                <h3 className="text-base font-bold text-[#1F2D3D] dark:text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-[#00BFA6]" />
                  Your Saved Resumes
                </h3>
                <p className="text-xs text-[#6B8699] dark:text-[#8CA6B7]">
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
                <Sparkles className="w-4 h-4 mr-1.5 text-white" />
                Create New Resume
              </Button>
            </div>

            {loadingSaved ? (
              <div className="py-16 text-center text-[#6B8699]">
                <div className="w-8 h-8 border-2 border-[#00BFA6] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs">Loading saved resumes...</p>
              </div>
            ) : savedCvs.length === 0 ? (
              <div className="bg-white dark:bg-[#0E2233] border border-[#D8E4EA] dark:border-[#1F2D3D] rounded-2xl p-12 text-center space-y-4 shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-[#00BFA6]/15 text-[#00BFA6] flex items-center justify-center mx-auto">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-[#1F2D3D] dark:text-white">
                    No Saved Resumes Yet
                  </h4>
                  <p className="text-xs text-[#6B8699] dark:text-[#8CA6B7] max-w-sm mx-auto">
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
                  <Sparkles className="w-4 h-4 mr-1.5 text-white" />
                  Generate First Resume
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedCvs.map((cv) => (
                  <div
                    key={cv.id}
                    className="bg-white dark:bg-[#0E2233] border border-[#D8E4EA] dark:border-[#1F2D3D] rounded-2xl p-5 shadow-xs hover:border-[#00BFA6]/60 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-bold text-[#1F2D3D] dark:text-white flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-[#00BFA6]" />
                            {cv.targetJobRole}
                          </h4>
                          {cv.targetIndustry && (
                            <span className="text-[11px] text-[#6B8699] dark:text-[#8CA6B7]">
                              Industry: {cv.targetIndustry}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-[#8CA6B7] flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(cv.updatedAt).toLocaleDateString()}
                        </span>
                      </div>

                      {cv.summary && (
                        <p className="text-xs text-[#1F2D3D] dark:text-[#BACDD8] line-clamp-3 leading-relaxed">
                          {cv.summary}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-1 text-[11px] text-[#6B8699] dark:text-[#8CA6B7] pt-1">
                        <span>{cv.workExperience?.length || 0} Experiences</span>
                        <span>•</span>
                        <span>{cv.projects?.length || 0} Projects</span>
                        <span>•</span>
                        <span>{cv.education?.length || 0} Education</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-[#D8E4EA] dark:border-[#1F2D3D]">
                      <button
                        type="button"
                        onClick={() => handleDeleteSavedCv(cv.id)}
                        className="text-xs text-[#8CA6B7] hover:text-rose-500 flex items-center gap-1 transition-colors cursor-pointer"
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

        {/* TAB 3: CLASSIC WEB PRINT PREVIEW LAYOUT */}
        {activeTab === 'classic-print' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Customization Panel */}
            <div className="no-print lg:col-span-4 space-y-6">
              <div className="bg-white dark:bg-[#0A1A27] rounded-2xl border border-[#D8E4EA] dark:border-[#1F2D3D] p-6 shadow-xs space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-[#D8E4EA] dark:border-[#1F2D3D]">
                  <div className="flex items-center gap-2">
                    <Settings2 className="w-5 h-5 text-[#00BFA6]" />
                    <h3 className="text-sm font-bold text-[#0E2233] dark:text-white">
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
                  <label className="text-xs font-bold uppercase tracking-wider text-[#627D98] dark:text-[#9FB3C8] flex items-center gap-1.5">
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
                        className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                          template === t.id
                            ? 'border-[#00BFA6] bg-[#00BFA6]/15 text-[#00BFA6] ring-2 ring-[#00BFA6]/20 font-bold'
                            : 'border-[#D8E4EA] dark:border-[#1F2D3D] text-[#1F2D3D] dark:text-[#E8F1F5] hover:bg-[#F6FAFC] dark:hover:bg-[#132B3E]'
                        }`}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Accent Color */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#627D98] dark:text-[#9FB3C8] flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5" /> Accent Color
                  </label>
                  <div className="flex items-center gap-3">
                    {(['copper', 'charcoal', 'slate', 'terracotta'] as AccentColor[]).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setAccentColor(c)}
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform cursor-pointer ${
                          accentColor === c ? 'scale-110 ring-2 ring-offset-2 ring-[#00BFA6]' : 'opacity-80 hover:opacity-100'
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
                  <label className="text-xs font-bold uppercase tracking-wider text-[#627D98] dark:text-[#9FB3C8]">
                    Spacing &amp; Density
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['compact', 'normal', 'spacious'] as PageDensity[]).map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDensity(d)}
                        className={`py-1.5 rounded-lg border text-xs capitalize font-medium transition-colors cursor-pointer ${
                          density === d
                            ? 'border-[#00BFA6] bg-[#00BFA6]/15 text-[#00BFA6] font-semibold'
                            : 'border-[#D8E4EA] dark:border-[#1F2D3D] text-[#627D98] dark:text-[#9FB3C8]'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Section Visibility Toggles */}
                <div className="space-y-2 pt-2 border-t border-[#D8E4EA] dark:border-[#1F2D3D]">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#627D98] dark:text-[#9FB3C8]">
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
                        className="flex items-center justify-between text-xs text-[#1F2D3D] dark:text-[#E8F1F5] cursor-pointer p-1.5 hover:bg-[#F6FAFC] dark:hover:bg-[#132B3E] rounded-lg"
                      >
                        <span>{label}</span>
                        <input
                          type="checkbox"
                          checked={visibleSections[key as keyof typeof visibleSections]}
                          onChange={() => toggleSection(key as keyof typeof visibleSections)}
                          className="rounded text-[#00BFA6] focus:ring-[#00BFA6] w-4 h-4 cursor-pointer"
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
                className={`resume-container w-full max-w-[800px] bg-white text-[#1F2D3D] shadow-xl rounded-2xl border border-[#D8E4EA] p-8 sm:p-12 transition-all ${
                  density === 'compact' ? 'space-y-4 text-xs' : density === 'spacious' ? 'space-y-7 text-sm' : 'space-y-5 text-sm'
                }`}
                style={{ fontFamily: 'Inter, system-ui, sans-serif', color: '#1F2D3D' }}
              >
                {/* 1. Header Details */}
                {template === 'classic' ? (
                  <div className="text-center pb-4 border-b-2 border-[#0E2233]">
                    <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-wide text-[#0E2233] mb-1">
                      {fullName}
                    </h1>
                    <p className="text-sm font-semibold tracking-wider text-[#627D98] uppercase mb-2">
                      {headline}
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-[#627D98]">
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
                          <a href={candidate.linkedinProfile} className="text-[#0E2233] underline">
                            LinkedIn
                          </a>
                        </span>
                      )}
                      {candidate?.portfolioUrl && (
                        <span>
                          •{' '}
                          <a href={candidate.portfolioUrl} className="text-[#0E2233] underline">
                            Portfolio
                          </a>
                        </span>
                      )}
                    </div>
                  </div>
                ) : template === 'minimal' ? (
                  <div className="pb-4 border-b border-[#D8E4EA]">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0E2233]">
                      {fullName}
                    </h1>
                    <p className="text-sm font-medium text-[#627D98] mb-3">{headline}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#627D98] font-mono">
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
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-5 border-b border-[#D8E4EA] gap-4">
                    <div className="space-y-1">
                      <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0E2233] tracking-tight">
                        {fullName}
                      </h1>
                      <p className={`text-base font-semibold ${activeColor.textClass}`}>
                        {headline}
                      </p>
                    </div>

                    <div className="text-xs text-[#627D98] space-y-1 sm:text-right">
                      {candidate?.email && (
                        <div className="flex items-center sm:justify-end gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-[#627D98]" />
                          <span>{candidate.email}</span>
                        </div>
                      )}
                      {candidate?.phoneNumber && (
                        <div className="flex items-center sm:justify-end gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-[#627D98]" />
                          <span>{candidate.phoneNumber}</span>
                        </div>
                      )}
                      {candidate?.currentLocation && (
                        <div className="flex items-center sm:justify-end gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#627D98]" />
                          <span>
                            {[candidate.currentLocation.city, candidate.currentLocation.country]
                              .filter(Boolean)
                              .join(', ')}
                          </span>
                        </div>
                      )}
                      {candidate?.linkedinProfile && (
                        <div className="flex items-center sm:justify-end gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-[#627D98]" />
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
                          ? 'border-[#0E2233] text-[#0E2233]'
                          : `${activeColor.borderClass} ${activeColor.textClass}`
                      }`}
                    >
                      Professional Summary
                    </h2>
                    <p className="text-xs sm:text-sm text-[#1F2D3D] leading-relaxed whitespace-pre-line">
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
                          ? 'border-[#0E2233] text-[#0E2233]'
                          : `${activeColor.borderClass} ${activeColor.textClass}`
                      }`}
                    >
                      Core Competencies &amp; Skills
                    </h2>

                    <div className="space-y-1.5 text-xs sm:text-sm">
                      {candidate.skills.some((s: Skill) => s.type === 'Primary') && (
                        <div>
                          <span className="font-bold text-[#0E2233]">Primary Skills: </span>
                          <span className="text-[#1F2D3D]">
                            {candidate.skills
                              .filter((s: Skill) => s.type === 'Primary')
                              .map((s: Skill) => s.name)
                              .join(' • ')}
                          </span>
                        </div>
                      )}

                      {candidate.skills.some((s: Skill) => s.type !== 'Primary') && (
                        <div>
                          <span className="font-bold text-[#0E2233]">Technical Skills &amp; Tools: </span>
                          <span className="text-[#1F2D3D]">
                            {candidate.skills
                              .filter((s: Skill) => s.type !== 'Primary')
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
                          ? 'border-[#0E2233] text-[#0E2233]'
                          : `${activeColor.borderClass} ${activeColor.textClass}`
                      }`}
                    >
                      Work Experience
                    </h2>

                    <div className="space-y-3">
                      {candidate.workExperience.map((exp: WorkExperience) => (
                        <div key={exp.id} className="space-y-1">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                            <span className="font-bold text-[#0E2233]">
                              {exp.jobTitle}{' '}
                              <span className="font-normal text-[#627D98]">at {exp.companyName}</span>
                            </span>
                            <span className="text-xs text-[#627D98] font-medium">
                              {exp.startDate} - {exp.isCurrent ? 'Present' : exp.endDate || 'Present'}
                            </span>
                          </div>
                          {exp.description && (
                            <p className="text-xs text-[#627D98] leading-relaxed whitespace-pre-line">
                              {exp.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* 5. Education */}
                {visibleSections.education && candidate?.education && candidate.education.length > 0 && (
                  <section className="space-y-2">
                    <h2
                      className={`text-xs font-bold uppercase tracking-wider pb-1 border-b ${
                        template === 'classic'
                          ? 'border-[#0E2233] text-[#0E2233]'
                          : `${activeColor.borderClass} ${activeColor.textClass}`
                      }`}
                    >
                      Education
                    </h2>

                    <div className="space-y-2">
                      {candidate.education.map((edu: Education) => (
                        <div key={edu.id} className="flex justify-between items-start text-xs sm:text-sm">
                          <div>
                            <span className="font-bold text-[#0E2233]">{edu.degree}</span> in {edu.fieldOfStudy}
                            <div className="text-xs text-[#627D98]">{edu.institution}</div>
                          </div>
                          <span className="text-xs text-[#627D98] font-medium shrink-0">
                            {edu.startYear} - {edu.endYear}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* 6. Projects */}
                {visibleSections.projects && candidate?.projects && candidate.projects.length > 0 && (
                  <section className="space-y-2">
                    <h2
                      className={`text-xs font-bold uppercase tracking-wider pb-1 border-b ${
                        template === 'classic'
                          ? 'border-[#0E2233] text-[#0E2233]'
                          : `${activeColor.borderClass} ${activeColor.textClass}`
                      }`}
                    >
                      Projects
                    </h2>

                    <div className="space-y-2">
                      {candidate.projects.map((proj: Project) => (
                        <div key={proj.id} className="space-y-0.5 text-xs sm:text-sm">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-[#0E2233]">{proj.title}</span>
                            {proj.link && (
                              <a href={proj.link} className="text-xs text-[#627D98] underline">
                                View Project
                              </a>
                            )}
                          </div>
                          {proj.technologies && proj.technologies.length > 0 && (
                            <div className="text-[11px] text-[#627D98]">
                              Tech: {proj.technologies.join(', ')}
                            </div>
                          )}
                          <p className="text-xs text-[#627D98] leading-relaxed">{proj.description}</p>
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
                          ? 'border-[#0E2233] text-[#0E2233]'
                          : `${activeColor.borderClass} ${activeColor.textClass}`
                      }`}
                    >
                      Certifications
                    </h2>

                    <div className="space-y-1.5 text-xs sm:text-sm">
                      {candidate.certifications.map((c: Certification, idx: number) => (
                        <div key={idx} className="flex justify-between items-center">
                          <span className="font-bold text-[#0E2233]">
                            {c.name} <span className="font-normal text-[#627D98]">({c.organization})</span>
                          </span>
                          <span className="text-xs text-[#627D98]">{c.issueDate}</span>
                        </div>
                      ))}
                    </div>
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
