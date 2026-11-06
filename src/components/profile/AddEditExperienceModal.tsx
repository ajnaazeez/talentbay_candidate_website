import React, { useState } from 'react';
import { X, Briefcase, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { aiService } from '@/services/aiService';
import type { WorkExperience } from '@/types';

interface AddEditExperienceModalProps {
  isOpen: boolean;
  onClose: () => void;
  experience?: WorkExperience | null;
  onSave: (exp: WorkExperience) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export const AddEditExperienceModal: React.FC<AddEditExperienceModalProps> = ({
  isOpen,
  onClose,
  experience,
  onSave,
  onDelete,
}) => {
  const [jobTitle, setJobTitle] = useState(experience?.jobTitle || '');
  const [companyName, setCompanyName] = useState(experience?.companyName || '');
  const [employmentType, setEmploymentType] = useState(experience?.employmentType || 'Full-time');
  const [startDate, setStartDate] = useState(
    experience?.startDate ? new Date(experience.startDate).toISOString().split('T')[0] : ''
  );
  const [endDate, setEndDate] = useState(
    experience?.endDate ? new Date(experience.endDate).toISOString().split('T')[0] : ''
  );
  const [isCurrent, setIsCurrent] = useState(Boolean(experience?.isCurrent));
  const [description, setDescription] = useState(experience?.description || '');

  const [enhancing, setEnhancing] = useState(false);
  const [aiSuccess, setAiSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleEnhanceDescription = async () => {
    if (!description.trim()) {
      setError('Please write key responsibilities or bullets first before enhancing with AI.');
      return;
    }

    try {
      setError(null);
      setEnhancing(true);
      const enhanced = await aiService.enhanceText({
        text: description,
        type: 'experience',
        context: { jobTitle, companyName },
      });
      setDescription(enhanced);
      setAiSuccess(true);
      setTimeout(() => setAiSuccess(false), 3000);
    } catch (err) {
      setError((err as Error).message || 'AI Enhancement failed.');
    } finally {
      setEnhancing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle.trim() || !companyName.trim() || !startDate) {
      setError('Job Title, Company Name, and Start Date are required.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await onSave({
        id: experience?.id || `exp_${Date.now()}`,
        jobTitle: jobTitle.trim(),
        companyName: companyName.trim(),
        employmentType,
        startDate: new Date(startDate).toISOString(),
        endDate: isCurrent ? null : endDate ? new Date(endDate).toISOString() : null,
        isCurrent,
        description: description.trim(),
      });
      onClose();
    } catch (err) {
      setError((err as Error).message || 'Failed to save experience.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white dark:bg-[#0E2233] rounded-3xl border border-[#D8E4EA] dark:border-[#1F2D3D] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#D8E4EA] dark:border-[#1F2D3D]">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-brand-600" />
            {experience ? 'Edit Work Experience' : 'Add Work Experience'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs text-rose-700 dark:text-rose-300">
              {error}
            </div>
          )}

          {/* Job Title & Company */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Job Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Senior Frontend Engineer"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Company Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. TechCorp Solutions"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Employment Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Employment Type
            </label>
            <select
              value={employmentType}
              onChange={(e) => setEmploymentType(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
            >
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Contract">Contract</option>
              <option value="Freelance">Freelance</option>
              <option value="Internship">Internship</option>
            </select>
          </div>

          {/* Dates & Current */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Start Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                End Date {isCurrent && '(Present)'}
              </label>
              <input
                type="date"
                disabled={isCurrent}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 disabled:opacity-40"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isCurrent"
              checked={isCurrent}
              onChange={(e) => setIsCurrent(e.target.checked)}
              className="w-4 h-4 rounded text-brand-600 border-slate-300 focus:ring-brand-500"
            />
            <label htmlFor="isCurrent" className="text-xs font-semibold text-slate-700 dark:text-slate-300 select-none cursor-pointer">
              I currently work here
            </label>
          </div>

          {/* Description & AI Enhance */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Key Responsibilities & Impact
              </label>
              <button
                type="button"
                onClick={handleEnhanceDescription}
                disabled={enhancing || !description.trim()}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 disabled:opacity-50 transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{enhancing ? 'Enhancing...' : 'AI Enhance'}</span>
                {aiSuccess && <CheckCircle2 className="w-3.5 h-3.5 text-[#00BFA6]" />}
              </button>
            </div>
            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="• Architected and shipped scalable web features reducing latency by 40%&#10;• Collaborated with cross-functional teams to deliver customer-facing solutions"
              className="w-full p-3.5 text-sm bg-slate-50 dark:bg-slate-900 border border-[#D8E4EA] dark:border-[#1F2D3D] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 resize-none leading-relaxed"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-[#D8E4EA] dark:border-[#1F2D3D]">
            {experience && onDelete ? (
              <button
                type="button"
                onClick={async () => {
                  if (window.confirm('Delete this experience entry?')) {
                    await onDelete(experience.id);
                    onClose();
                  }
                }}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400"
              >
                Delete
              </button>
            ) : <div />}
            <div className="flex items-center gap-3">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={saving}>
                {experience ? 'Save Changes' : 'Add Experience'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
