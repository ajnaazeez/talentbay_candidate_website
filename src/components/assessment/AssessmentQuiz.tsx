import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Send,
  CheckCircle2,
  Flag,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import type { AssessmentQuestion, AssessmentDifficulty } from '@/types/assessment';

interface AssessmentQuizProps {
  skill: string;
  difficulty: AssessmentDifficulty;
  questions: AssessmentQuestion[];
  onSubmit: (answers: number[]) => Promise<void>;
  onCancel: () => void;
}

export const AssessmentQuiz: React.FC<AssessmentQuizProps> = ({
  skill,
  difficulty,
  questions,
  onSubmit,
  onCancel,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>(() =>
    new Array(questions.length).fill(-1)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [flagged, setFlagged] = useState<Record<number, boolean>>({});

  // 60 seconds per question total timer
  const totalSeconds = questions.length * 60;
  const [secondsRemaining, setSecondsRemaining] = useState(totalSeconds);
  const isExpiredRef = useRef(false);

  // Auto-submit on timer expiry
  const handleFinalSubmit = useCallback(async () => {
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      await onSubmit(answers);
    } catch (err) {
      console.error('Submission failed:', err);
      setIsSubmitting(false);
    }
  }, [answers, isSubmitting, onSubmit]);

  useEffect(() => {
    if (secondsRemaining <= 0) {
      if (!isExpiredRef.current) {
        isExpiredRef.current = true;
        handleFinalSubmit();
      }
      return;
    }

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsRemaining, handleFinalSubmit]);

  const currentQuestion = questions[currentIndex];
  const answeredCount = answers.filter((a) => a !== -1).length;
  const progressPercentage = Math.round((answeredCount / questions.length) * 100);

  // Format timer MM:SS
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timerDisplay = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  const isTimeCritical = secondsRemaining <= 60;

  const handleSelectOption = (optionIndex: number) => {
    if (isSubmitting) return;
    setAnswers((prev) => {
      const copy = [...prev];
      copy[currentIndex] = optionIndex;
      return copy;
    });
  };

  const toggleFlag = (index: number) => {
    setFlagged((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl p-5 border border-slate-200 dark:border-[#1f293d] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-lg">
            {skill.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">{skill}</h1>
              <Badge variant="neutral" size="sm">{difficulty}</Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Question {currentIndex + 1} of {questions.length} • {answeredCount} answered
            </p>
          </div>
        </div>

        {/* Countdown Timer */}
        <div className="flex items-center gap-4 self-end md:self-auto">
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold text-sm border transition-colors ${
              isTimeCritical
                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/60 animate-pulse'
                : 'bg-slate-50 dark:bg-[#0b0f19] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#1f293d]'
            }`}
          >
            <Clock className={`w-4 h-4 ${isTimeCritical ? 'text-rose-500' : 'text-slate-400'}`} />
            <span>{timerDisplay}</span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
          >
            Exit
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-slate-200 dark:bg-[#1f293d] h-2 rounded-full overflow-hidden">
        <div
          className="bg-brand-500 h-full transition-all duration-300 ease-out"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Question Card */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-[#1f293d] shadow-sm space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              Question {currentIndex + 1}
            </span>
            <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">
              {currentQuestion?.question}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => toggleFlag(currentIndex)}
            className={`p-2 rounded-lg border transition-colors ${
              flagged[currentIndex]
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-600 dark:text-amber-400'
                : 'border-slate-200 dark:border-[#1f293d] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
            title="Flag question for review"
          >
            <Flag className="w-4 h-4" />
          </button>
        </div>

        {/* Options List */}
        <div className="space-y-3 pt-2">
          {currentQuestion?.options.map((option, idx) => {
            const isSelected = answers[currentIndex] === idx;
            const optionLetters = ['A', 'B', 'C', 'D'];
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectOption(idx)}
                className={`w-full p-4 rounded-xl border text-left flex items-start gap-3.5 transition-all group ${
                  isSelected
                    ? 'border-brand-600 bg-brand-50/70 dark:bg-brand-950/40 text-brand-900 dark:text-brand-100 ring-2 ring-brand-500/20 shadow-sm'
                    : 'border-slate-200 dark:border-[#1f293d] hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-[#111827] text-slate-800 dark:text-slate-200'
                }`}
              >
                <span
                  className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 transition-colors ${
                    isSelected
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-100 dark:bg-[#1a2333] text-slate-500 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-[#253248]'
                  }`}
                >
                  {optionLetters[idx] || idx + 1}
                </span>
                <span className="text-sm font-medium leading-relaxed pt-0.5">{option}</span>
              </button>
            );
          })}
        </div>

        {/* Question Navigation Controls */}
        <div className="pt-4 border-t border-slate-100 dark:border-[#1f293d] flex items-center justify-between gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentIndex === 0 || isSubmitting}
            leftIcon={<ChevronLeft className="w-4 h-4" />}
          >
            Previous
          </Button>

          <div className="flex items-center gap-2">
            {currentIndex < questions.length - 1 ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                disabled={isSubmitting}
                rightIcon={<ChevronRight className="w-4 h-4" />}
              >
                Next
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowConfirmModal(true)}
                isLoading={isSubmitting}
                leftIcon={<Send className="w-4 h-4" />}
              >
                Submit Assessment
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Question Palette Grid */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl p-5 border border-slate-200 dark:border-[#1f293d] shadow-sm">
        <div className="flex items-center justify-between mb-3 text-xs text-slate-500 dark:text-slate-400 font-medium">
          <span>Question Navigation</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-500 inline-block" /> Answered
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-[#1f293d] inline-block" /> Unanswered
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> Flagged
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {questions.map((_, idx) => {
            const isAnswered = answers[idx] !== -1;
            const isCurrent = idx === currentIndex;
            const isFlagged = flagged[idx];
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`w-9 h-9 rounded-xl text-xs font-semibold transition-all relative ${
                  isCurrent
                    ? 'ring-2 ring-brand-500 ring-offset-2 dark:ring-offset-[#111827]'
                    : ''
                } ${
                  isAnswered
                    ? 'bg-brand-500 text-white'
                    : 'bg-slate-100 dark:bg-[#1a2333] text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-[#253248]'
                }`}
              >
                {idx + 1}
                {isFlagged && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border-2 border-white dark:border-[#111827]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#111827] w-full max-w-md rounded-2xl shadow-xl border border-slate-200 dark:border-[#1f293d] p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Ready to Submit?
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                You have answered <strong>{answeredCount}</strong> of{' '}
                <strong>{questions.length}</strong> questions.
                {answeredCount < questions.length && (
                  <span className="block text-amber-600 dark:text-amber-400 mt-1 font-medium">
                    ⚠️ You still have {questions.length - answeredCount} unanswered questions!
                  </span>
                )}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                variant="secondary"
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
              >
                Review Answers
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setShowConfirmModal(false);
                  handleFinalSubmit();
                }}
                isLoading={isSubmitting}
              >
                Confirm Submit
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
