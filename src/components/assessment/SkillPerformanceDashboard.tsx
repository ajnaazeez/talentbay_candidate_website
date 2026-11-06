import React from 'react';
import {
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Layers,
  RotateCcw,
} from 'lucide-react';
import { Badge, type BadgeVariant } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import type { SkillPerformanceSummary, AssessmentResult, ProficiencyLevel } from '@/types/assessment';

interface SkillPerformanceDashboardProps {
  summary: SkillPerformanceSummary;
  results: AssessmentResult[];
  onStartAssessment: (skill: string) => void;
}

export const SkillPerformanceDashboard: React.FC<SkillPerformanceDashboardProps> = ({
  summary,
  results,
  onStartAssessment,
}) => {
  const getProficiencyVariant = (level: ProficiencyLevel): BadgeVariant => {
    switch (level) {
      case 'Expert':
        return 'success';
      case 'Advanced':
        return 'brand';
      case 'Intermediate':
        return 'bronze';
      default:
        return 'danger';
    }
  };

  const hasAssessments = results.length > 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#0E2233] p-5 rounded-2xl border border-[#D8E4EA] dark:border-[#1F2D3D] shadow-sm">
          <div className="flex items-center justify-between text-[#6B8699] dark:text-[#8CA6B7] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Average Score</span>
            <TrendingUp className="w-4 h-4 text-[#00BFA6]" />
          </div>
          <div className="text-2xl font-bold text-[#1F2D3D] dark:text-white">
            {hasAssessments ? `${summary.averageScore}%` : 'N/A'}
          </div>
          <p className="text-xs text-[#6B8699] dark:text-[#8CA6B7] mt-1">
            Across {Object.keys(summary.skillScores).length} assessed skills
          </p>
        </div>

        <div className="bg-white dark:bg-[#0E2233] p-5 rounded-2xl border border-[#D8E4EA] dark:border-[#1F2D3D] shadow-sm">
          <div className="flex items-center justify-between text-[#6B8699] dark:text-[#8CA6B7] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Tests</span>
            <Layers className="w-4 h-4 text-[#00BFA6]" />
          </div>
          <div className="text-2xl font-bold text-[#1F2D3D] dark:text-white">
            {summary.totalAssessments}
          </div>
          <p className="text-xs text-[#6B8699] dark:text-[#8CA6B7] mt-1">Completed assessments</p>
        </div>

        <div className="bg-white dark:bg-[#0E2233] p-5 rounded-2xl border border-[#D8E4EA] dark:border-[#1F2D3D] shadow-sm">
          <div className="flex items-center justify-between text-[#6B8699] dark:text-[#8CA6B7] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Strongest Skills</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {summary.strongestSkills.length}
          </div>
          <p className="text-xs text-[#6B8699] dark:text-[#8CA6B7] mt-1">Scored 70% or higher</p>
        </div>

        <div className="bg-white dark:bg-[#0E2233] p-5 rounded-2xl border border-[#D8E4EA] dark:border-[#1F2D3D] shadow-sm">
          <div className="flex items-center justify-between text-[#6B8699] dark:text-[#8CA6B7] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Needs Work</span>
            <AlertCircle className="w-4 h-4 text-[#00BFA6]" />
          </div>
          <div className="text-2xl font-bold text-[#00BFA6]">
            {summary.skillsRequiringImprovement.length}
          </div>
          <p className="text-xs text-[#6B8699] dark:text-[#8CA6B7] mt-1">Opportunities to level up</p>
        </div>
      </div>

      {/* Strongest Skills & Needs Improvement Row */}
      {hasAssessments && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Strongest Skills Card */}
          <div className="bg-white dark:bg-[#0E2233] p-6 rounded-2xl border border-[#D8E4EA] dark:border-[#1F2D3D] shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-[#1F2D3D] dark:text-white">Strongest Skills</h3>
                <p className="text-xs text-[#6B8699] dark:text-[#8CA6B7]">
                  Your top technical strengths verified through assessment
                </p>
              </div>
            </div>

            {summary.strongestSkills.length > 0 ? (
              <div className="space-y-3 pt-2">
                {summary.strongestSkills.map((item) => (
                  <div
                    key={item.skill}
                    className="p-3.5 rounded-xl border border-[#D8E4EA] dark:border-[#1F2D3D] bg-[#E8F1F5]/50 dark:bg-[#0A1A27]/50 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-sm text-[#1F2D3D] dark:text-white flex items-center gap-2">
                        {item.skill}
                        {item.isPrimary && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#00BFA6]/15 text-[#00BFA6] border border-[#00BFA6]/30">
                            Primary
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[#6B8699] dark:text-[#8CA6B7]">
                        {item.assessmentsCount} {item.assessmentsCount === 1 ? 'assessment' : 'assessments'} taken
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getProficiencyVariant(item.level)} size="sm">
                        {item.level} ({item.score}%)
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#6B8699] dark:text-[#8CA6B7] py-4 text-center">
                Score 70% or higher on any assessment to showcase your strengths here.
              </p>
            )}
          </div>

          {/* Skills Requiring Improvement Card */}
          <div className="bg-white dark:bg-[#0E2233] p-6 rounded-2xl border border-[#D8E4EA] dark:border-[#1F2D3D] shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#00BFA6]/15 text-[#00BFA6] flex items-center justify-center">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-[#1F2D3D] dark:text-white">Skills Requiring Improvement</h3>
                <p className="text-xs text-[#6B8699] dark:text-[#8CA6B7]">
                  Targeted areas where retaking assessments will boost your job matches
                </p>
              </div>
            </div>

            {summary.skillsRequiringImprovement.length > 0 ? (
              <div className="space-y-3 pt-2">
                {summary.skillsRequiringImprovement.map((item) => (
                  <div
                    key={item.skill}
                    className="p-3.5 rounded-xl border border-[#D8E4EA] dark:border-[#1F2D3D] bg-[#E8F1F5]/50 dark:bg-[#0A1A27]/50 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-sm text-[#1F2D3D] dark:text-white">
                        {item.skill}
                      </div>
                      <div className="text-xs text-[#6B8699] dark:text-[#8CA6B7]">Current score: {item.score}%</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onStartAssessment(item.skill)}
                      leftIcon={<RotateCcw className="w-3.5 h-3.5 text-[#00BFA6]" />}
                    >
                      Retake
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#6B8699] dark:text-[#8CA6B7] py-4 text-center">
                Great job! All your assessed skills are currently at 70% or higher.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Primary & Secondary Profile Skills Breakdown */}
      <div className="bg-white dark:bg-[#0E2233] p-6 rounded-2xl border border-[#D8E4EA] dark:border-[#1F2D3D] shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-bold text-[#1F2D3D] dark:text-white">
            Assessed Skills & Proficiency Levels
          </h3>
          <p className="text-xs sm:text-sm text-[#6B8699] dark:text-[#8CA6B7]">
            Real scores from your completed AI skill tests
          </p>
        </div>

        {Object.keys(summary.skillScores).length > 0 ? (
          <div className="space-y-4">
            {Object.entries(summary.skillScores).map(([skill, score]) => {
              const level = summary.assessedProficiency[skill] || 'Beginner';
              const isPrimary = summary.primarySkills.some((p) => p.toLowerCase() === skill.toLowerCase());

              return (
                <div key={skill} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#1F2D3D] dark:text-white">{skill}</span>
                      {isPrimary && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#00BFA6]/15 text-[#00BFA6] border border-[#00BFA6]/30">
                          Primary
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getProficiencyVariant(level)} size="sm">
                        {level}
                      </Badge>
                      <span className="font-bold text-[#1F2D3D] dark:text-white w-10 text-right">
                        {score}%
                      </span>
                    </div>
                  </div>
                  <div className="bg-[#D8E4EA] dark:bg-[#132B3E] h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        score >= 80
                          ? 'bg-emerald-500'
                          : score >= 50
                          ? 'bg-[#00BFA6]'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#E8F1F5] dark:bg-[#132B3E] flex items-center justify-center text-[#6B8699] dark:text-[#8CA6B7] mx-auto">
              <Layers className="w-6 h-6" />
            </div>
            <p className="text-sm text-[#6B8699] dark:text-[#8CA6B7]">
              No skill assessments completed yet. Take your first test to measure your proficiency!
            </p>
          </div>
        )}
      </div>

      {/* Historical Performance Timeline */}
      {hasAssessments && (
        <div className="bg-white dark:bg-[#0E2233] p-6 rounded-2xl border border-[#D8E4EA] dark:border-[#1F2D3D] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-[#1F2D3D] dark:text-white">
                Assessment History & Progress
              </h3>
              <p className="text-xs sm:text-sm text-[#6B8699] dark:text-[#8CA6B7]">
                Chronological record of completed technical assessments
              </p>
            </div>
          </div>

          <div className="divide-y divide-[#D8E4EA] dark:divide-[#1F2D3D]">
            {results.map((item) => {
              const pct = Math.round((item.score / Math.max(item.totalQuestions, 1)) * 100);
              const formattedDate = new Date(item.completedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              return (
                <div
                  key={item.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#00BFA6]/15 text-[#00BFA6] flex items-center justify-center font-bold text-sm shrink-0">
                      {item.skill.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-[#1F2D3D] dark:text-white flex items-center gap-2">
                        {item.skill}
                        <Badge variant="neutral" size="sm">
                          {item.difficulty}
                        </Badge>
                      </div>
                      <div className="text-xs text-[#6B8699] dark:text-[#8CA6B7] flex items-center gap-2 mt-0.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formattedDate}</span>
                        <span>•</span>
                        <span>
                          {item.score} / {item.totalQuestions} correct
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <Badge variant={getProficiencyVariant(item.proficiencyLevel)} size="md">
                      {item.proficiencyLevel} ({pct}%)
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onStartAssessment(item.skill)}
                      leftIcon={<RotateCcw className="w-3.5 h-3.5 text-[#00BFA6]" />}
                    >
                      Retake
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
