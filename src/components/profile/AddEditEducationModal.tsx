import React, { useState } from 'react';
import { X, GraduationCap } from 'lucide-react';
import { Button } from '@/components/common/Button';
import type { Education } from '@/types';

interface AddEditEducationModalProps {
  isOpen: boolean;
  onClose: () => void;
  education?: Education | null;
  onSave: (edu: Education) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export const AddEditEducationModal: React.FC<AddEditEducationModalProps> = ({
  isOpen,
  onClose,
  education,
  onSave,
  onDelete,
}) => {
  const [degree, setDegree] = useState(education?.degree || '');
  const [institution, setInstitution] = useState(education?.institution || '');
  const [fieldOfStudy, setFieldOfStudy] = useState(education?.fieldOfStudy || '');
  const [startYear, setStartYear] = useState<number>(education?.startYear || new Date().getFullYear() - 4);
  const [endYear, setEndYear] = useState<number>(education?.endYear || new Date().getFullYear());
  const [grade, setGrade] = useState(education?.grade || '');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!degree.trim() || !institution.trim() || !fieldOfStudy.trim()) {
      setError('Degree, Institution, and Field of Study are required.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await onSave({
        id: education?.id || `edu_${Date.now()}`,
        degree: degree.trim(),
        institution: institution.trim(),
        fieldOfStudy: fieldOfStudy.trim(),
        startYear: Number(startYear) || 2018,
        endYear: Number(endYear) || 2022,
        grade: grade.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setError((err as Error).message || 'Failed to save education.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white dark:bg-[#0E2233] rounded-3xl border border-[#D8E4EA] dark:border-[#1F2D3D] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#D8E4EA] dark:border-[#1F2D3D]">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-brand-600" />
            {education ? 'Edit Education' : 'Add Education'}
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

          {/* Degree */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Degree / Qualification <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={degree}
              onChange={(e) => setDegree(e.target.value)}
              placeholder="e.g. Bachelor of Technology (B.Tech), Master of Science (M.S.)"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Institution */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              College / University / School <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder="e.g. Indian Institute of Technology, Delhi"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Field of Study */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Field of Study / Major <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={fieldOfStudy}
              onChange={(e) => setFieldOfStudy(e.target.value)}
              placeholder="e.g. Computer Science and Engineering"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Years & Grade */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Start Year
              </label>
              <input
                type="number"
                value={startYear}
                onChange={(e) => setStartYear(Number(e.target.value))}
                min={1970}
                max={2035}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                End Year
              </label>
              <input
                type="number"
                value={endYear}
                onChange={(e) => setEndYear(Number(e.target.value))}
                min={1970}
                max={2035}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Grade / CGPA
              </label>
              <input
                type="text"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="e.g. 8.5 CGPA"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-[#D8E4EA] dark:border-[#1F2D3D]">
            {education && onDelete ? (
              <button
                type="button"
                onClick={async () => {
                  if (window.confirm('Delete this education entry?')) {
                    await onDelete(education.id);
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
                {education ? 'Save Changes' : 'Add Education'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
