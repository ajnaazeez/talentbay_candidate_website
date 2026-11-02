import React, { useState } from 'react';
import { X, Briefcase, Plus } from 'lucide-react';
import { Button } from '@/components/common/Button';
import type { JobPreference } from '@/types';

interface EditJobPreferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobPreference?: JobPreference | null;
  onSave: (pref: JobPreference) => Promise<void>;
}

export const EditJobPreferenceModal: React.FC<EditJobPreferenceModalProps> = ({
  isOpen,
  onClose,
  jobPreference,
  onSave,
}) => {
  const [role, setRole] = useState(jobPreference?.role || '');
  const [employmentType, setEmploymentType] = useState(jobPreference?.employmentType || 'Full-time');
  const [workMode, setWorkMode] = useState(jobPreference?.workMode || 'Remote');
  const [preferredIndustry, setPreferredIndustry] = useState(jobPreference?.preferredIndustry || 'Information Technology');
  const [preferredLocations, setPreferredLocations] = useState<string[]>(
    jobPreference?.preferredLocations || []
  );
  const [newLocation, setNewLocation] = useState('');
  const [salaryCurrency, setSalaryCurrency] = useState(jobPreference?.salaryCurrency || 'INR');
  const [salaryMin, setSalaryMin] = useState<number>(jobPreference?.salaryMin || 0);
  const [salaryMax, setSalaryMax] = useState<number>(jobPreference?.salaryMax || 0);
  const [noticePeriod, setNoticePeriod] = useState(jobPreference?.noticePeriod || 'Immediate');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddLocation = (_e?: React.KeyboardEvent | React.MouseEvent) => {
    if (newLocation.trim()) {
      if (!preferredLocations.includes(newLocation.trim())) {
        setPreferredLocations([...preferredLocations, newLocation.trim()]);
      }
      setNewLocation('');
    }
  };

  const handleRemoveLocation = (loc: string) => {
    setPreferredLocations(preferredLocations.filter((l) => l !== loc));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role.trim()) {
      setError('Desired Role is required.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await onSave({
        role: role.trim(),
        employmentType,
        workMode,
        preferredLocations,
        preferredIndustry: preferredIndustry.trim(),
        salaryCurrency,
        salaryMin: Number(salaryMin) || 0,
        salaryMax: Number(salaryMax) || 0,
        noticePeriod,
      });
      onClose();
    } catch (err) {
      setError((err as Error).message || 'Failed to save job preferences.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white dark:bg-[#111827] rounded-3xl border border-slate-200 dark:border-[#1f293d] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#1f293d]">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-brand-600" />
            Job Preferences
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

          {/* Desired Role */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Desired Role / Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Senior Frontend Developer"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Employment Type & Work Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <option value="Internship">Internship</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Work Mode
              </label>
              <select
                value={workMode}
                onChange={(e) => setWorkMode(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
              >
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
                <option value="On-site">On-site</option>
              </select>
            </div>
          </div>

          {/* Preferred Industry & Notice Period */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Preferred Industry
              </label>
              <input
                type="text"
                value={preferredIndustry}
                onChange={(e) => setPreferredIndustry(e.target.value)}
                placeholder="e.g. Fintech, SaaS, Healthcare"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Notice Period
              </label>
              <select
                value={noticePeriod}
                onChange={(e) => setNoticePeriod(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
              >
                <option value="Immediate">Immediate</option>
                <option value="15 Days">15 Days</option>
                <option value="1 Month">1 Month</option>
                <option value="2 Months">2 Months</option>
                <option value="3 Months">3 Months</option>
              </select>
            </div>
          </div>

          {/* Preferred Locations */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Target Locations
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddLocation(e);
                  }
                }}
                placeholder="Add city or region (e.g. Bangalore, Mumbai, Remote)"
                className="flex-1 px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
              />
              <Button type="button" variant="secondary" onClick={handleAddLocation}>
                <Plus className="w-4 h-4" />
                Add
              </Button>
            </div>
            {preferredLocations.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {preferredLocations.map((loc) => (
                  <span
                    key={loc}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                  >
                    {loc}
                    <button
                      type="button"
                      onClick={() => handleRemoveLocation(loc)}
                      className="text-slate-400 hover:text-rose-500 transition"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Expected Salary */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Expected Salary Range (Annual CTC)
            </label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <select
                  value={salaryCurrency}
                  onChange={(e) => setSalaryCurrency(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="AED">AED (د.إ)</option>
                </select>
              </div>
              <div>
                <input
                  type="number"
                  value={salaryMin || ''}
                  onChange={(e) => setSalaryMin(Number(e.target.value))}
                  placeholder="Min (e.g. 800000)"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <input
                  type="number"
                  value={salaryMax || ''}
                  onChange={(e) => setSalaryMax(Number(e.target.value))}
                  placeholder="Max (e.g. 1500000)"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-[#1f293d]">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={saving}>
              Save Preferences
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
