import React, { useState } from 'react';
import {
  X,
  Search,
  Zap,
  Sparkles,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { POPULAR_ASSESSMENT_SKILLS } from '@/services/assessmentService';
import type { AssessmentDifficulty } from '@/types/assessment';
import type { CandidateModel } from '@/types/candidate';

interface SkillSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartAssessment: (skill: string, difficulty: AssessmentDifficulty) => void;
  candidate: CandidateModel | null;
  assessedScores?: Record<string, number>;
  loading?: boolean;
}

export const SkillSelectorModal: React.FC<SkillSelectorModalProps> = ({
  isOpen,
  onClose,
  onStartAssessment,
  candidate,
  assessedScores = {},
  loading = false,
}) => {
  const [search, setSearch] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [difficulty, setDifficulty] = useState<AssessmentDifficulty>('Medium');

  if (!isOpen) return null;

  const candidateSkills = Array.isArray(candidate?.skills) ? candidate.skills : [];

  // Filter skills based on search
  const filteredCandidateSkills = candidateSkills.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredPopularSkills = POPULAR_ASSESSMENT_SKILLS.filter(
    (skill) =>
      skill.toLowerCase().includes(search.toLowerCase()) &&
      !candidateSkills.some((cs) => cs.name.toLowerCase() === skill.toLowerCase())
  );

  const handleStart = () => {
    const skillToTest = selectedSkill.trim() || search.trim();
    if (!skillToTest) return;
    onStartAssessment(skillToTest, difficulty);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#111827] w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-[#1f293d] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-[#1f293d] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Start AI Skill Assessment
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Select a skill to test your technical proficiency with AI-generated questions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1f293d] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Search or Custom Skill Input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Search or Enter Skill Name
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="e.g. React, Python, Docker, SQL..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSelectedSkill(e.target.value);
                }}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-[#1f293d] text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Difficulty Level Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Select Difficulty Level
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['Easy', 'Medium', 'Hard'] as AssessmentDifficulty[]).map((level) => {
                const isSelected = difficulty === level;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setDifficulty(level)}
                    className={`py-2.5 px-3 rounded-xl border text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                      isSelected
                        ? 'border-brand-600 bg-brand-50/70 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 ring-2 ring-brand-500/20'
                        : 'border-slate-200 dark:border-[#1f293d] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1a2333]'
                    }`}
                  >
                    <span>{level}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Candidate Profile Skills */}
          {candidateSkills.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-brand-500" />
                  Your Profile Skills
                </span>
                <span className="text-xs text-slate-400">
                  {candidateSkills.length} available
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {filteredCandidateSkills.map((s) => {
                  const isSelected = selectedSkill.toLowerCase() === s.name.toLowerCase();
                  const score = assessedScores[s.name.trim()];
                  return (
                    <button
                      key={s.name}
                      type="button"
                      onClick={() => {
                        setSelectedSkill(s.name);
                        setSearch(s.name);
                      }}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                        isSelected
                          ? 'border-brand-600 bg-brand-50/60 dark:bg-brand-950/30 text-brand-800 dark:text-brand-200'
                          : 'border-slate-200 dark:border-[#1f293d] hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-[#111827]'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                          {s.name}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {s.level || 'Intermediate'} • {s.type || 'Technical'}
                        </div>
                      </div>
                      {typeof score === 'number' ? (
                        <Badge variant="default" size="sm">
                          {score}%
                        </Badge>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">Unassessed</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Popular Industry Skills */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Popular In-Demand Skills
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {filteredPopularSkills.slice(0, 12).map((skill) => {
                const isSelected = selectedSkill.toLowerCase() === skill.toLowerCase();
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => {
                      setSelectedSkill(skill);
                      setSearch(skill);
                    }}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                      isSelected
                        ? 'border-brand-600 bg-brand-500 text-white'
                        : 'border-slate-200 dark:border-[#1f293d] text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-[#0b0f19] hover:bg-slate-100 dark:hover:bg-[#1a2333]'
                    }`}
                  >
                    {skill}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-slate-200 dark:border-[#1f293d] bg-slate-50 dark:bg-[#0b0f19]/50 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
            {selectedSkill ? (
              <span>
                Selected: <strong className="text-slate-900 dark:text-slate-100">{selectedSkill}</strong> ({difficulty})
              </span>
            ) : (
              <span>Choose or type a skill to continue</span>
            )}
          </div>
          <div className="flex items-center gap-2.5 ml-auto">
            <Button variant="secondary" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleStart}
              disabled={!(selectedSkill || search).trim() || loading}
              isLoading={loading}
              rightIcon={<ChevronRight className="w-4 h-4" />}
            >
              Start Assessment
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
