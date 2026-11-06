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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#142B3B] w-full max-w-2xl rounded-2xl shadow-2xl border border-[#DCE5EB] dark:border-[#243746] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-[#DCE5EB] dark:border-[#243746] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#16B8A6]/15 text-[#16B8A6] flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#243746] dark:text-white">
                Start AI Skill Assessment
              </h2>
              <p className="text-xs sm:text-sm text-[#6B8699] dark:text-[#8CA6B7]">
                Select any skill to test your technical proficiency with AI-generated questions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#8CA6B7] hover:text-[#243746] dark:hover:text-white rounded-lg hover:bg-[#E7EFF3] dark:hover:bg-[#1A374B] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Search or Custom Skill Input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B8699] dark:text-[#8CA6B7] mb-2">
              Search or Enter Skill Name
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8CA6B7]" />
              <input
                type="text"
                placeholder="e.g. React, Flutter, Python, Docker, SQL..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSelectedSkill(e.target.value);
                }}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#E7EFF3] dark:bg-[#102230] border border-[#DCE5EB] dark:border-[#243746] text-sm text-[#243746] dark:text-[#E7EFF3] focus:outline-none focus:ring-2 focus:ring-[#16B8A6]/20 focus:border-[#16B8A6] transition-all placeholder:text-[#8CA6B7]"
              />
            </div>
          </div>

          {/* Difficulty Level Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B8699] dark:text-[#8CA6B7] mb-2">
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
                    className={`py-2.5 px-3 rounded-xl border text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      isSelected
                        ? 'border-[#16B8A6] bg-[#16B8A6]/15 text-[#16B8A6] ring-2 ring-[#16B8A6]/20'
                        : 'border-[#DCE5EB] dark:border-[#243746] text-[#243746] dark:text-[#BACDD8] hover:bg-[#E7EFF3] dark:hover:bg-[#1A374B]'
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
                <span className="text-xs font-semibold uppercase tracking-wider text-[#6B8699] dark:text-[#8CA6B7] flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-[#16B8A6]" />
                  Your Profile Skills
                </span>
                <span className="text-xs text-[#8CA6B7]">
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
                      className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#16B8A6] bg-[#16B8A6]/10 text-[#243746] dark:text-white ring-2 ring-[#16B8A6]/20'
                          : 'border-[#DCE5EB] dark:border-[#243746] hover:border-[#16B8A6]/60 bg-white dark:bg-[#142B3B]'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-sm text-[#243746] dark:text-white">
                          {s.name}
                        </div>
                        <div className="text-xs text-[#6B8699] dark:text-[#8CA6B7]">
                          {s.level || 'Intermediate'} • {s.type || 'Primary'}
                        </div>
                      </div>
                      {typeof score === 'number' ? (
                        <Badge variant="default" size="sm">
                          {score}%
                        </Badge>
                      ) : (
                        <span className="text-xs text-[#8CA6B7] font-medium">Unassessed</span>
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
              <Sparkles className="w-3.5 h-3.5 text-[#16B8A6]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#6B8699] dark:text-[#8CA6B7]">
                Popular In-Demand Skills
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {filteredPopularSkills.slice(0, 14).map((skill) => {
                const isSelected = selectedSkill.toLowerCase() === skill.toLowerCase();
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => {
                      setSelectedSkill(skill);
                      setSearch(skill);
                    }}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#16B8A6] bg-[#16B8A6] text-white'
                        : 'border-[#DCE5EB] dark:border-[#243746] text-[#243746] dark:text-[#BACDD8] bg-[#E7EFF3] dark:bg-[#102230] hover:bg-[#DCE5EB] dark:hover:bg-[#1A374B]'
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
        <div className="p-4 sm:p-6 border-t border-[#DCE5EB] dark:border-[#243746] bg-[#E7EFF3]/50 dark:bg-[#102230]/50 flex items-center justify-between gap-3">
          <div className="text-xs text-[#6B8699] dark:text-[#8CA6B7] hidden sm:block">
            {selectedSkill ? (
              <span>
                Selected: <strong className="text-[#243746] dark:text-white">{selectedSkill}</strong> ({difficulty})
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
