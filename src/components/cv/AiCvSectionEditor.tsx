import React, { useState } from 'react';
import {
  Sparkles,
  Download,
  Eye,
  Save,
  CheckCircle2,
  Trash2,
  Plus,
  RefreshCw,
  FileCheck,
  AlertCircle,
  Copy,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import type { AiCvModel, AiCvExperience, AiCvProject } from '@/types/aiCv';
import { aiCvService } from '@/services/aiCvService';
import { downloadAtsPdf } from '@/utils/atsPdfGenerator';
import { PdfPreviewModal } from './PdfPreviewModal';

interface AiCvSectionEditorProps {
  cv: AiCvModel;
  onUpdateCv: (updatedCv: AiCvModel) => void;
  onSaveCv: (cvToSave: AiCvModel) => Promise<void>;
  onSyncToProfile?: (cv: AiCvModel) => Promise<void>;
  isSaving: boolean;
}

export const AiCvSectionEditor: React.FC<AiCvSectionEditorProps> = ({
  cv,
  onUpdateCv,
  onSaveCv,
  onSyncToProfile,
  isSaving,
}) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [regeneratingSection, setRegeneratingSection] = useState<string | null>(null);
  const [sectionError, setSectionError] = useState<string | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [syncConfirmOpen, setSyncConfirmOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // 1. Summary regeneration
  const handleRegenerateSummary = async () => {
    setRegeneratingSection('summary');
    setSectionError(null);
    try {
      const result = await aiCvService.regenerateCvSection({
        section: 'summary',
        sectionData: { summary: cv.summary },
        targetJobRole: cv.targetJobRole,
      });

      if (result && typeof result.summary === 'string') {
        onUpdateCv({
          ...cv,
          summary: result.summary,
        });
      }
    } catch (err: any) {
      console.error('Error regenerating summary:', err);
      setSectionError(err.message || 'Failed to rewrite summary with AI.');
    } finally {
      setRegeneratingSection(null);
    }
  };

  // 2. Experience bullet regeneration
  const handleRegenerateExperience = async (exp: AiCvExperience) => {
    setRegeneratingSection(`exp_${exp.id}`);
    setSectionError(null);
    try {
      const result = await aiCvService.regenerateCvSection({
        section: 'experience',
        sectionData: {
          id: exp.id,
          jobTitle: exp.jobTitle,
          companyName: exp.companyName,
          bulletPoints: exp.bulletPoints,
        },
        targetJobRole: cv.targetJobRole,
      });

      if (result && Array.isArray(result.bulletPoints)) {
        const updatedExperiences = cv.workExperience.map((e) =>
          e.id === exp.id
            ? { ...e, bulletPoints: result.bulletPoints.map(String) }
            : e
        );
        onUpdateCv({
          ...cv,
          workExperience: updatedExperiences,
        });
      }
    } catch (err: any) {
      console.error('Error polishing experience bullets:', err);
      setSectionError(err.message || 'Failed to polish experience bullets with AI.');
    } finally {
      setRegeneratingSection(null);
    }
  };

  // 3. Project bullet regeneration
  const handleRegenerateProject = async (proj: AiCvProject) => {
    setRegeneratingSection(`proj_${proj.id}`);
    setSectionError(null);
    try {
      const result = await aiCvService.regenerateCvSection({
        section: 'project',
        sectionData: {
          id: proj.id,
          title: proj.title,
          role: proj.role,
          bulletPoints: proj.bulletPoints,
        },
        targetJobRole: cv.targetJobRole,
      });

      if (result && Array.isArray(result.bulletPoints)) {
        const updatedProjects = cv.projects.map((p) =>
          p.id === proj.id
            ? { ...p, bulletPoints: result.bulletPoints.map(String) }
            : p
        );
        onUpdateCv({
          ...cv,
          projects: updatedProjects,
        });
      }
    } catch (err: any) {
      console.error('Error polishing project bullets:', err);
      setSectionError(err.message || 'Failed to polish project bullets with AI.');
    } finally {
      setRegeneratingSection(null);
    }
  };

  // Direct edits handlers
  const handleSummaryChange = (newSummary: string) => {
    onUpdateCv({ ...cv, summary: newSummary });
  };

  const handleUpdateExperienceBullet = (expId: string, bulletIdx: number, val: string) => {
    const updated = cv.workExperience.map((e) => {
      if (e.id === expId) {
        const newBullets = [...e.bulletPoints];
        newBullets[bulletIdx] = val;
        return { ...e, bulletPoints: newBullets };
      }
      return e;
    });
    onUpdateCv({ ...cv, workExperience: updated });
  };

  const handleAddExperienceBullet = (expId: string) => {
    const updated = cv.workExperience.map((e) => {
      if (e.id === expId) {
        return { ...e, bulletPoints: [...e.bulletPoints, ''] };
      }
      return e;
    });
    onUpdateCv({ ...cv, workExperience: updated });
  };

  const handleRemoveExperienceBullet = (expId: string, bulletIdx: number) => {
    const updated = cv.workExperience.map((e) => {
      if (e.id === expId) {
        return {
          ...e,
          bulletPoints: e.bulletPoints.filter((_, i) => i !== bulletIdx),
        };
      }
      return e;
    });
    onUpdateCv({ ...cv, workExperience: updated });
  };

  const handleUpdateProjectBullet = (projId: string, bulletIdx: number, val: string) => {
    const updated = cv.projects.map((p) => {
      if (p.id === projId) {
        const newBullets = [...p.bulletPoints];
        newBullets[bulletIdx] = val;
        return { ...p, bulletPoints: newBullets };
      }
      return p;
    });
    onUpdateCv({ ...cv, projects: updated });
  };

  const handleAddProjectBullet = (projId: string) => {
    const updated = cv.projects.map((p) => {
      if (p.id === projId) {
        return { ...p, bulletPoints: [...p.bulletPoints, ''] };
      }
      return p;
    });
    onUpdateCv({ ...cv, projects: updated });
  };

  const handleRemoveProjectBullet = (projId: string, bulletIdx: number) => {
    const updated = cv.projects.map((p) => {
      if (p.id === projId) {
        return {
          ...p,
          bulletPoints: p.bulletPoints.filter((_, i) => i !== bulletIdx),
        };
      }
      return p;
    });
    onUpdateCv({ ...cv, projects: updated });
  };

  const handleSave = async () => {
    try {
      await onSaveCv(cv);
      setSaveSuccessMsg('CV saved securely to your TalentBay account!');
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err: any) {
      setSectionError(err?.message || 'Failed to save CV.');
    }
  };

  const handleExecuteSync = async () => {
    if (!onSyncToProfile) return;
    setIsSyncing(true);
    try {
      await onSyncToProfile(cv);
      setSyncConfirmOpen(false);
      setSaveSuccessMsg('Applied ATS summary and target title to your TalentBay profile!');
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err: any) {
      setSectionError(err?.message || 'Failed to sync with profile.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Toolbar */}
      <div className="bg-white dark:bg-[#202A27] border border-gray-100 dark:border-[#2e3b37] rounded-2xl p-4 shadow-soft sticky top-20 z-20 backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 dark:text-amber-300 border border-amber-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            ATS CV Ready
          </span>
          <span className="text-xs text-gray-500">
            Target: <strong className="text-gray-900 dark:text-white">{cv.targetJobRole}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPreviewOpen(true)}
          >
            <Eye className="w-4 h-4 mr-1.5" />
            Preview PDF
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadAtsPdf(cv)}
          >
            <Download className="w-4 h-4 mr-1.5" />
            Download PDF
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="shadow-sm shadow-amber-500/20"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-1.5" />
                Save CV
              </>
            )}
          </Button>

          {onSyncToProfile && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSyncConfirmOpen(true)}
              title="Apply ATS summary to your main profile"
            >
              <Copy className="w-4 h-4 mr-1.5" />
              Sync to Profile
            </Button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {saveSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {sectionError && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{sectionError}</span>
          </div>
          <button
            onClick={() => setSectionError(null)}
            className="text-red-500 hover:text-red-700 text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 1. Header Information */}
      <div className="bg-white dark:bg-[#202A27] border border-gray-100 dark:border-[#2e3b37] rounded-2xl p-6 shadow-soft space-y-4">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-amber-500" />
          ATS Contact Header
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="text-gray-500 block mb-1">Full Name</label>
            <input
              type="text"
              value={cv.fullName}
              onChange={(e) => onUpdateCv({ ...cv, fullName: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-[#2e3b37] bg-white dark:bg-[#2e3b37] text-gray-900 dark:text-white font-medium"
            />
          </div>
          <div>
            <label className="text-gray-500 block mb-1">Target Job Role</label>
            <input
              type="text"
              value={cv.targetJobRole}
              onChange={(e) => onUpdateCv({ ...cv, targetJobRole: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-[#2e3b37] bg-white dark:bg-[#2e3b37] text-gray-900 dark:text-white font-medium"
            />
          </div>
          <div>
            <label className="text-gray-500 block mb-1">Email</label>
            <input
              type="email"
              value={cv.email}
              onChange={(e) => onUpdateCv({ ...cv, email: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-[#2e3b37] bg-white dark:bg-[#2e3b37] text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="text-gray-500 block mb-1">Phone</label>
            <input
              type="text"
              value={cv.phone}
              onChange={(e) => onUpdateCv({ ...cv, phone: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-[#2e3b37] bg-white dark:bg-[#2e3b37] text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* 2. Professional Summary Section */}
      <div className="bg-white dark:bg-[#202A27] border border-gray-100 dark:border-[#2e3b37] rounded-2xl p-6 shadow-soft space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              Professional Summary
            </h3>
            <p className="text-xs text-gray-500">
              Keywords and executive summary tailored for ATS scanning.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRegenerateSummary}
            disabled={regeneratingSection === 'summary'}
          >
            {regeneratingSection === 'summary' ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Rewriting...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
                AI Rewrite Summary
              </>
            )}
          </Button>
        </div>

        <textarea
          rows={4}
          value={cv.summary}
          onChange={(e) => handleSummaryChange(e.target.value)}
          className="w-full p-3.5 text-xs sm:text-sm rounded-xl border border-gray-200 dark:border-[#2e3b37] bg-white dark:bg-[#2e3b37] text-gray-900 dark:text-white leading-relaxed"
        />
      </div>

      {/* 3. Technical Skills Categories */}
      <div className="bg-white dark:bg-[#202A27] border border-gray-100 dark:border-[#2e3b37] rounded-2xl p-6 shadow-soft space-y-4">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">
          Technical Skills &amp; Competencies
        </h3>

        <div className="space-y-3">
          {cv.skillCategories.map((cat, catIdx) => (
            <div
              key={catIdx}
              className="p-3.5 rounded-xl border border-gray-100 dark:border-[#2e3b37] bg-gray-50/50 dark:bg-[#2e3b37]/50 space-y-2"
            >
              <div className="flex items-center justify-between">
                <input
                  type="text"
                  value={cat.category}
                  onChange={(e) => {
                    const newCategories = [...cv.skillCategories];
                    newCategories[catIdx].category = e.target.value;
                    onUpdateCv({ ...cv, skillCategories: newCategories });
                  }}
                  className="text-xs font-bold text-gray-900 dark:text-white bg-transparent border-b border-transparent focus:border-brand-500 px-1 py-0.5 outline-none"
                />
              </div>

              <div className="flex flex-wrap gap-1.5">
                {cat.skills.map((skill, sIdx) => (
                  <span
                    key={sIdx}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs bg-white dark:bg-[#202A27] border border-gray-200 dark:border-[#2e3b37] text-gray-800 dark:text-gray-200"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => {
                        const newCategories = [...cv.skillCategories];
                        newCategories[catIdx].skills = newCategories[catIdx].skills.filter(
                          (_, i) => i !== sIdx
                        );
                        onUpdateCv({ ...cv, skillCategories: newCategories });
                      }}
                      className="text-gray-400 hover:text-red-500 text-xs ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Work Experience with Section-Level AI Regeneration */}
      <div className="bg-white dark:bg-[#202A27] border border-gray-100 dark:border-[#2e3b37] rounded-2xl p-6 shadow-soft space-y-4">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">
          Work Experience
        </h3>

        <div className="space-y-4">
          {cv.workExperience.map((exp) => (
            <div
              key={exp.id}
              className="p-4 rounded-xl border border-gray-200 dark:border-[#2e3b37] bg-gray-50/40 dark:bg-[#2e3b37]/40 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-100 dark:border-[#2e3b37]">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                    {exp.jobTitle} <span className="font-normal text-gray-500">at {exp.companyName}</span>
                  </h4>
                  <p className="text-xs text-gray-500">
                    {exp.startDate} - {exp.isCurrent ? 'Present' : exp.endDate}
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRegenerateExperience(exp)}
                  disabled={regeneratingSection === `exp_${exp.id}`}
                  className="text-xs"
                >
                  {regeneratingSection === `exp_${exp.id}` ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Polishing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
                      AI Polish Bullets
                    </>
                  )}
                </Button>
              </div>

              {/* Bullet Points */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  ATS Achievement Bullet Points
                </label>
                {exp.bulletPoints.map((bullet, bIdx) => (
                  <div key={bIdx} className="flex items-start gap-2">
                    <span className="text-gray-400 mt-2 text-xs">•</span>
                    <textarea
                      rows={2}
                      value={bullet}
                      onChange={(e) =>
                        handleUpdateExperienceBullet(exp.id, bIdx, e.target.value)
                      }
                      className="flex-1 p-2 text-xs rounded-lg border border-gray-200 dark:border-[#2e3b37] bg-white dark:bg-[#202A27] text-gray-800 dark:text-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveExperienceBullet(exp.id, bIdx)}
                      className="text-gray-400 hover:text-red-500 p-1.5 mt-1"
                      title="Remove bullet"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => handleAddExperienceBullet(exp.id)}
                  className="text-xs text-amber-500 hover:underline flex items-center gap-1 font-medium mt-1"
                >
                  <Plus className="w-3 h-3" /> Add Achievement Bullet
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Projects with Section-Level AI Regeneration */}
      {cv.projects.length > 0 && (
        <div className="bg-white dark:bg-[#202A27] border border-gray-100 dark:border-[#2e3b37] rounded-2xl p-6 shadow-soft space-y-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">
            Projects
          </h3>

          <div className="space-y-4">
            {cv.projects.map((proj) => (
              <div
                key={proj.id}
                className="p-4 rounded-xl border border-gray-200 dark:border-[#2e3b37] bg-gray-50/40 dark:bg-[#2e3b37]/40 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-100 dark:border-[#2e3b37]">
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                      {proj.title} <span className="font-normal text-gray-500">({proj.role})</span>
                    </h4>
                    {proj.technologies.length > 0 && (
                      <p className="text-xs text-gray-500">
                        Tech: {proj.technologies.join(', ')}
                      </p>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRegenerateProject(proj)}
                    disabled={regeneratingSection === `proj_${proj.id}`}
                    className="text-xs"
                  >
                    {regeneratingSection === `proj_${proj.id}` ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        Polishing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
                        AI Polish Bullets
                      </>
                    )}
                  </Button>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    Project Bullet Points
                  </label>
                  {proj.bulletPoints.map((bullet, bIdx) => (
                    <div key={bIdx} className="flex items-start gap-2">
                      <span className="text-gray-400 mt-2 text-xs">•</span>
                      <textarea
                        rows={2}
                        value={bullet}
                        onChange={(e) =>
                          handleUpdateProjectBullet(proj.id, bIdx, e.target.value)
                        }
                        className="flex-1 p-2 text-xs rounded-lg border border-gray-200 dark:border-[#2e3b37] bg-white dark:bg-[#202A27] text-gray-800 dark:text-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveProjectBullet(proj.id, bIdx)}
                        className="text-gray-400 hover:text-red-500 p-1.5 mt-1"
                        title="Remove bullet"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => handleAddProjectBullet(proj.id)}
                    className="text-xs text-amber-500 hover:underline flex items-center gap-1 font-medium mt-1"
                  >
                    <Plus className="w-3 h-3" /> Add Project Bullet
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Education */}
      {cv.education.length > 0 && (
        <div className="bg-white dark:bg-[#202A27] border border-gray-100 dark:border-[#2e3b37] rounded-2xl p-6 shadow-soft space-y-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">
            Education
          </h3>
          <div className="space-y-2">
            {cv.education.map((edu) => (
              <div
                key={edu.id}
                className="p-3 rounded-xl border border-gray-100 dark:border-[#2e3b37] bg-gray-50/50 dark:bg-[#2e3b37]/50 flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">
                    {edu.degree} in {edu.fieldOfStudy}
                  </p>
                  <p className="text-gray-500">
                    {edu.institution} {edu.grade && `• Grade: ${edu.grade}`}
                  </p>
                </div>
                <span className="text-gray-600 dark:text-gray-400 font-medium">
                  {edu.startYear} - {edu.endYear}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. Certifications */}
      {cv.certifications.length > 0 && (
        <div className="bg-white dark:bg-[#202A27] border border-gray-100 dark:border-[#2e3b37] rounded-2xl p-6 shadow-soft space-y-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">
            Certifications
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {cv.certifications.map((cert, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl border border-gray-100 dark:border-[#2e3b37] bg-gray-50/50 dark:bg-[#2e3b37]/50 space-y-0.5"
              >
                <p className="font-bold text-gray-900 dark:text-white">{cert.name}</p>
                <p className="text-gray-500">
                  {cert.organization} {cert.issueDate && `(${cert.issueDate})`}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PDF In-Browser Preview Modal */}
      <PdfPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        cv={cv}
      />

      {/* Sync Profile Confirmation Dialog */}
      {syncConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#202A27] border border-gray-100 dark:border-[#2e3b37] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h4 className="text-base font-bold text-gray-900 dark:text-white">
              Sync ATS CV to Profile?
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              This will update your primary TalentBay profile summary (About Me) and designation with the AI-optimized content from this ATS CV. Your profile will reflect these changes across recruiter searches.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSyncConfirmOpen(false)}
                disabled={isSyncing}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleExecuteSync}
                disabled={isSyncing}
              >
                {isSyncing ? 'Updating Profile...' : 'Confirm Sync'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

