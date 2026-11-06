import React, { useState } from 'react';
import { X, Sparkles, FileText, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { aiService } from '@/services/aiService';
import type { CandidateModel } from '@/types';

interface EditHeadlineSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: CandidateModel;
  onSave: (updated: Partial<CandidateModel>) => Promise<void>;
}

export const EditHeadlineSummaryModal: React.FC<EditHeadlineSummaryModalProps> = ({
  isOpen,
  onClose,
  candidate,
  onSave,
}) => {
  const [bio, setBio] = useState(candidate.bio || '');
  const [aboutMe, setAboutMe] = useState(candidate.aboutMe || '');

  const [enhancingHeadline, setEnhancingHeadline] = useState(false);
  const [enhancingSummary, setEnhancingSummary] = useState(false);
  const [headlineAiSuccess, setHeadlineAiSuccess] = useState(false);
  const [summaryAiSuccess, setSummaryAiSuccess] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleEnhanceHeadline = async () => {
    if (!bio.trim()) {
      setError('Please write a draft headline before using AI enhancement.');
      return;
    }
    try {
      setError(null);
      setEnhancingHeadline(true);
      const enhanced = await aiService.enhanceText({
        text: bio,
        type: 'headline',
        context: { role: candidate.designation || 'Professional' },
      });
      setBio(enhanced);
      setHeadlineAiSuccess(true);
      setTimeout(() => setHeadlineAiSuccess(false), 3000);
    } catch (err) {
      setError((err as Error).message || 'AI Enhancement failed.');
    } finally {
      setEnhancingHeadline(false);
    }
  };

  const handleEnhanceSummary = async () => {
    if (!aboutMe.trim()) {
      setError('Please write a draft summary before using AI enhancement.');
      return;
    }
    try {
      setError(null);
      setEnhancingSummary(true);
      const enhanced = await aiService.enhanceText({
        text: aboutMe,
        type: 'summary',
        context: { role: candidate.designation || 'Professional' },
      });
      setAboutMe(enhanced);
      setSummaryAiSuccess(true);
      setTimeout(() => setSummaryAiSuccess(false), 3000);
    } catch (err) {
      setError((err as Error).message || 'AI Enhancement failed.');
    } finally {
      setEnhancingSummary(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      await onSave({
        bio: bio.trim() || undefined,
        aboutMe: aboutMe.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setError((err as Error).message || 'Failed to save summary.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white dark:bg-[#142B3B] rounded-3xl border border-[#DCE5EB] dark:border-[#243746] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DCE5EB] dark:border-[#243746]">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-600" />
            Headline & Professional Summary
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs text-rose-700 dark:text-rose-300">
              {error}
            </div>
          )}

          {/* Headline */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Professional Headline (Short Bio)
              </label>
              <button
                type="button"
                onClick={handleEnhanceHeadline}
                disabled={enhancingHeadline || !bio.trim()}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 disabled:opacity-50 transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{enhancingHeadline ? 'Enhancing...' : 'AI Enhance'}</span>
                {headlineAiSuccess && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
              </button>
            </div>
            <input
              type="text"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="e.g. Senior Full-Stack Engineer | React, Node.js & Cloud Architecture"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 font-medium"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              A high-impact 1-line headline displayed under your name on search results and your CV.
            </p>
          </div>

          {/* About Me */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                About Me (Career Summary)
              </label>
              <button
                type="button"
                onClick={handleEnhanceSummary}
                disabled={enhancingSummary || !aboutMe.trim()}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 disabled:opacity-50 transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{enhancingSummary ? 'Enhancing...' : 'AI Enhance'}</span>
                {summaryAiSuccess && <CheckCircle2 className="w-3.5 h-3.5 text-[#16B8A6]" />}
              </button>
            </div>
            <textarea
              rows={6}
              value={aboutMe}
              onChange={(e) => setAboutMe(e.target.value)}
              placeholder="Write a concise overview of your professional career, key accomplishments, domain expertise, and the value you bring to engineering and product teams..."
              className="w-full p-3.5 text-sm bg-slate-50 dark:bg-slate-900 border border-[#DCE5EB] dark:border-[#243746] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 resize-none leading-relaxed"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#DCE5EB] dark:border-[#243746]">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={saving}>
              Save Summary
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
