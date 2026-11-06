import React, { useState } from 'react';
import { X, Sparkles, Plus, Trash2, Award } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { aiService } from '@/services/aiService';
import type { Skill } from '@/types';

interface EditSkillsModalProps {
  isOpen: boolean;
  onClose: () => void;
  skills: Skill[];
  onSave: (skills: Skill[]) => Promise<void>;
}

export const EditSkillsModal: React.FC<EditSkillsModalProps> = ({
  isOpen,
  onClose,
  skills: initialSkills,
  onSave,
}) => {
  const [skills, setSkills] = useState<Skill[]>(initialSkills || []);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillType, setNewSkillType] = useState<'Primary' | 'Secondary' | 'Tool'>('Primary');
  const [newSkillLevel, setNewSkillLevel] = useState<'Beginner' | 'Intermediate' | 'Expert'>('Intermediate');

  const [recommendedSkills, setRecommendedSkills] = useState<string[]>([]);
  const [fetchingAiSkills, setFetchingAiSkills] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddSkill = (nameToAdd?: string) => {
    const targetName = (nameToAdd || newSkillName).trim();
    if (!targetName) return;

    if (skills.some((s) => s.name.toLowerCase() === targetName.toLowerCase())) {
      setError(`Skill "${targetName}" is already in your profile.`);
      return;
    }

    setError(null);
    setSkills([
      ...skills,
      {
        name: targetName,
        type: newSkillType,
        level: newSkillLevel,
      },
    ]);

    if (!nameToAdd) {
      setNewSkillName('');
    } else {
      setRecommendedSkills(recommendedSkills.filter((r) => r.toLowerCase() !== targetName.toLowerCase()));
    }
  };

  const handleRemoveSkill = (skillName: string) => {
    setSkills(skills.filter((s) => s.name !== skillName));
  };

  const handleFetchAiSkills = async () => {
    const skillNames = skills.map((s) => s.name);
    if (skillNames.length === 0) {
      setError('Please add at least one skill first so AI can suggest relevant recommendations.');
      return;
    }

    try {
      setError(null);
      setFetchingAiSkills(true);
      const suggestions = await aiService.getRelatedSkills(skillNames);
      setRecommendedSkills(suggestions);
    } catch (err) {
      console.warn('AI suggestions error:', err);
    } finally {
      setFetchingAiSkills(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      await onSave(skills);
      onClose();
    } catch (err) {
      setError((err as Error).message || 'Failed to save skills.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white dark:bg-[#0E2233] rounded-3xl border border-[#D8E4EA] dark:border-[#1F2D3D] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#D8E4EA] dark:border-[#1F2D3D]">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Award className="w-5 h-5 text-brand-600" />
            Skills & Competencies
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs text-rose-700 dark:text-rose-300">
              {error}
            </div>
          )}

          {/* Add Skill Row */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Add New Skill
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              <input
                type="text"
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
                placeholder="e.g. React.js, Python, Figma"
                className="sm:col-span-5 px-3.5 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
              />
              <select
                value={newSkillType}
                onChange={(e) => setNewSkillType(e.target.value as 'Primary' | 'Secondary' | 'Tool')}
                className="sm:col-span-3 px-3 py-2 text-xs font-semibold bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
              >
                <option value="Primary">Primary</option>
                <option value="Secondary">Secondary</option>
                <option value="Tool">Tool / Tech</option>
              </select>
              <select
                value={newSkillLevel}
                onChange={(e) => setNewSkillLevel(e.target.value as 'Beginner' | 'Intermediate' | 'Expert')}
                className="sm:col-span-2 px-2.5 py-2 text-xs font-semibold bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermed.</option>
                <option value="Expert">Expert</option>
              </select>
              <Button
                type="button"
                variant="primary"
                onClick={() => handleAddSkill()}
                className="sm:col-span-2 w-full text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </Button>
            </div>
          </div>

          {/* AI Suggestions Row */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                AI Recommended Skills
              </span>
              <button
                type="button"
                onClick={handleFetchAiSkills}
                disabled={fetchingAiSkills || skills.length === 0}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 disabled:opacity-50 transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{fetchingAiSkills ? 'Generating...' : 'Get AI Suggestions'}</span>
              </button>
            </div>
            {recommendedSkills.length > 0 ? (
              <div className="flex flex-wrap gap-2 p-3 bg-brand-50/50 dark:bg-brand-950/20 rounded-2xl border border-brand-200/60 dark:border-brand-900/40">
                {recommendedSkills.map((rec) => (
                  <button
                    key={rec}
                    type="button"
                    onClick={() => handleAddSkill(rec)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 hover:bg-brand-100 dark:hover:bg-brand-900/50 shadow-xs transition"
                  >
                    <Plus className="w-3 h-3 text-brand-500" />
                    <span>{rec}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400">
                Click "Get AI Suggestions" to receive tailored recommendations based on your skillset.
              </p>
            )}
          </div>

          {/* Current Skills List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Your Skills ({skills.length})
              </span>
            </div>

            {skills.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                No skills added yet. Add your core competencies above.
              </p>
            ) : (
              <div className="space-y-2">
                {skills.map((skill, index) => (
                  <div
                    key={`${skill.name}-${index}`}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800"
                  >
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {skill.name}
                      </span>
                      <Badge
                        variant={skill.type === 'Primary' ? 'brand' : skill.type === 'Secondary' ? 'bronze' : 'neutral'}
                        size="sm"
                      >
                        {skill.type}
                      </Badge>
                      <Badge
                        variant={skill.level === 'Expert' ? 'brand' : skill.level === 'Intermediate' ? 'bronze' : 'neutral'}
                        size="sm"
                      >
                        {skill.level}
                      </Badge>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill.name)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition"
                      title="Remove skill"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#D8E4EA] dark:border-[#1F2D3D]">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" variant="primary" isLoading={saving} onClick={handleSubmit}>
            Save Skills
          </Button>
        </div>
      </div>
    </div>
  );
};
