import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trophy,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Badge, type BadgeVariant } from '@/components/common/Badge';
import { ROUTES } from '@/utils/constants';
import type { AssessmentResult, ProficiencyLevel } from '@/types/assessment';

interface AssessmentResultSummaryProps {
  result: AssessmentResult;
  onRetake: () => void;
}

export const AssessmentResultSummary: React.FC<AssessmentResultSummaryProps> = ({
  result,
  onRetake,
}) => {
  const navigate = useNavigate();
  const [showReview, setShowReview] = useState(true);

  const percentage = Math.round((result.score / Math.max(result.totalQuestions, 1)) * 100);

  const getProficiencyTheme = (level: ProficiencyLevel): {
    textColor: string;
    bgColor: string;
    borderColor: string;
    badgeVariant: BadgeVariant;
    description: string;
  } => {
    switch (level) {
      case 'Expert':
        return {
          textColor: 'text-emerald-600 dark:text-emerald-400',
          bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
          borderColor: 'border-emerald-200 dark:border-emerald-900/60',
          badgeVariant: 'success',
          description: 'Outstanding mastery! You demonstrate deep technical expertise in this domain.',
        };
      case 'Advanced':
        return {
          textColor: 'text-[#B87355]',
          bgColor: 'bg-[#B87355]/15',
          borderColor: 'border-[#B87355]/30',
          badgeVariant: 'brand',
          description: 'Strong competence! You are well-prepared for complex real-world challenges.',
        };
      case 'Intermediate':
        return {
          textColor: 'text-[#B87355]',
          bgColor: 'bg-[#B87355]/10',
          borderColor: 'border-[#B87355]/25',
          badgeVariant: 'bronze',
          description: 'Good foundation. Focused practice will help bridge remaining skill gaps.',
        };
      default:
        return {
          textColor: 'text-rose-600 dark:text-rose-400',
          bgColor: 'bg-rose-50 dark:bg-rose-950/40',
          borderColor: 'border-rose-200 dark:border-rose-900/60',
          badgeVariant: 'danger',
          description: 'Foundational stage. Review key core concepts and retake to improve.',
        };
    }
  };

  const theme = getProficiencyTheme(result.proficiencyLevel);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Top Hero Score Card */}
      <div className={`p-8 rounded-3xl border ${theme.borderColor} ${theme.bgColor} text-center space-y-6 relative overflow-hidden shadow-sm`}>
        <div className="w-16 h-16 rounded-2xl bg-white dark:bg-[#222023] shadow-md mx-auto flex items-center justify-center text-[#B87355]">
          <Trophy className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <Badge variant={theme.badgeVariant} size="lg">
            {result.proficiencyLevel} Level
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#29272A] dark:text-white">
            {result.skill} Assessment Complete
          </h1>
          <p className="text-sm sm:text-base text-[#494448] dark:text-[#D4CDC7] max-w-xl mx-auto">
            {theme.description}
          </p>
        </div>

        {/* Big Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto pt-2">
          <div className="bg-white/80 dark:bg-[#222023]/80 backdrop-blur-sm rounded-2xl p-4 border border-[#E6DFD8] dark:border-[#494448]">
            <div className="text-2xl sm:text-3xl font-extrabold text-[#29272A] dark:text-white">
              {percentage}%
            </div>
            <div className="text-xs text-[#736B70] dark:text-[#A49D9E] font-medium mt-0.5">
              Final Score
            </div>
          </div>

          <div className="bg-white/80 dark:bg-[#222023]/80 backdrop-blur-sm rounded-2xl p-4 border border-[#E6DFD8] dark:border-[#494448]">
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {result.score}/{result.totalQuestions}
            </div>
            <div className="text-xs text-[#736B70] dark:text-[#A49D9E] font-medium mt-0.5">
              Correct Answers
            </div>
          </div>

          <div className="bg-white/80 dark:bg-[#222023]/80 backdrop-blur-sm rounded-2xl p-4 border border-[#E6DFD8] dark:border-[#494448]">
            <div className="text-2xl sm:text-3xl font-extrabold text-[#29272A] dark:text-white">
              {result.difficulty}
            </div>
            <div className="text-xs text-[#736B70] dark:text-[#A49D9E] font-medium mt-0.5">
              Difficulty
            </div>
          </div>

          <div className="bg-white/80 dark:bg-[#222023]/80 backdrop-blur-sm rounded-2xl p-4 border border-[#E6DFD8] dark:border-[#494448]">
            <div className="text-2xl sm:text-3xl font-extrabold text-[#B87355]">
              Saved
            </div>
            <div className="text-xs text-[#736B70] dark:text-[#A49D9E] font-medium mt-0.5">
              Profile Synced
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          <Button
            variant="secondary"
            onClick={onRetake}
            leftIcon={<RotateCcw className="w-4 h-4" />}
          >
            Retake Assessment
          </Button>

          <Button
            variant="primary"
            onClick={() => navigate(ROUTES.CAREER_READINESS)}
            leftIcon={<Sparkles className="w-4 h-4" />}
          >
            View Career Readiness
          </Button>

          <Button
            variant="ghost"
            onClick={() => navigate(ROUTES.ASSESSMENTS)}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Assessments Dashboard
          </Button>
        </div>
      </div>

      {/* Question Breakdown Accordion Header */}
      <div className="bg-white dark:bg-[#222023] rounded-2xl border border-[#E6DFD8] dark:border-[#494448] overflow-hidden shadow-sm">
        <button
          type="button"
          onClick={() => setShowReview(!showReview)}
          className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-[#F5F1EA]/60 dark:hover:bg-[#383439]/60 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#F5F1EA] dark:bg-[#383439] flex items-center justify-center text-[#29272A] dark:text-[#F5F1EA] font-bold">
              {result.questions.length}
            </div>
            <div>
              <h3 className="font-bold text-[#29272A] dark:text-white">
                Detailed Question & Answer Review
              </h3>
              <p className="text-xs text-[#736B70] dark:text-[#A49D9E]">
                Review your selections, correct answers, and learning takeaways
              </p>
            </div>
          </div>
          {showReview ? (
            <ChevronUp className="w-5 h-5 text-[#A49D9E]" />
          ) : (
            <ChevronDown className="w-5 h-5 text-[#A49D9E]" />
          )}
        </button>

        {/* Questions List */}
        {showReview && (
          <div className="p-5 sm:p-6 pt-0 space-y-4 border-t border-[#E6DFD8] dark:border-[#494448]">
            {result.questions.map((q, idx) => {
              const userAnswer = result.userAnswers[idx];
              const isCorrect = userAnswer === q.correctAnswerIndex;
              const isSkipped = userAnswer === -1 || userAnswer === undefined;

              return (
                <div
                  key={idx}
                  className={`p-5 rounded-2xl border transition-all ${
                    isCorrect
                      ? 'border-emerald-200 dark:border-emerald-950 bg-emerald-50/30 dark:bg-emerald-950/10'
                      : 'border-rose-200 dark:border-rose-950 bg-rose-50/30 dark:bg-rose-950/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#736B70] dark:text-[#A49D9E]">
                        Question {idx + 1}
                      </span>
                      {isCorrect ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                        </span>
                      ) : isSkipped ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#B87355]">
                          <AlertTriangle className="w-3.5 h-3.5" /> Unanswered
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400">
                          <XCircle className="w-3.5 h-3.5" /> Incorrect
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-sm sm:text-base font-semibold text-[#29272A] dark:text-white mb-4 leading-relaxed">
                    {q.question}
                  </p>

                  <div className="space-y-2">
                    {q.options.map((opt, oIdx) => {
                      const isCandidatePick = userAnswer === oIdx;
                      const isActualCorrect = q.correctAnswerIndex === oIdx;

                      let optClasses = 'border-[#E6DFD8] dark:border-[#494448] bg-white dark:bg-[#222023] text-[#494448] dark:text-[#D4CDC7]';
                      if (isActualCorrect) {
                        optClasses = 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-semibold ring-1 ring-emerald-500/30';
                      } else if (isCandidatePick && !isCorrect) {
                        optClasses = 'border-rose-400 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 font-semibold ring-1 ring-rose-500/30';
                      }

                      return (
                        <div
                          key={oIdx}
                          className={`p-3 rounded-xl border text-xs sm:text-sm flex items-center justify-between ${optClasses}`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-5 h-5 rounded-md bg-[#F5F1EA] dark:bg-[#383439] flex items-center justify-center font-bold text-xs shrink-0">
                              {['A', 'B', 'C', 'D'][oIdx] || oIdx + 1}
                            </span>
                            <span>{opt}</span>
                          </div>

                          <div className="shrink-0 flex items-center gap-2 text-xs">
                            {isActualCorrect && (
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Correct Answer
                              </span>
                            )}
                            {isCandidatePick && !isCorrect && (
                              <span className="text-rose-600 dark:text-rose-400 font-medium">
                                Your Pick
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
