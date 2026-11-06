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

  // 10 minutes total timer matching Flutter assessment_screen.dart
  const totalSeconds = 600;
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
      <div className="bg-white dark:bg-[#202A27] rounded-2xl p-5 border border-zinc-200/90 dark:border-[#2e3b37] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-lg">
            {skill.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{skill}</h1>
              <Badge variant="neutral" size="sm">{difficulty}</Badge>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
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
                : 'bg-zinc-50 dark:bg-[#141a18] text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-[#2e3b37]'
            }`}
          >
            <Clock className={`w-4 h-4 ${isTimeCritical ? 'text-rose-500' : 'text-zinc-400'}`} />
            <span>{timerDisplay}</span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={isSubmitting}
            className="text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400"
          >
            Exit
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-zinc-200 dark:bg-[#2e3b37] h-2 rounded-full overflow-hidden">
        <div
          className="bg-amber-400 h-full transition-all duration-300 ease-out"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Question Card */}
      <div className="bg-white dark:bg-[#202A27] rounded-2xl p-6 sm:p-8 border border-zinc-200/90 dark:border-[#2e3b37] shadow-xs space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Question {currentIndex + 1}
            </span>
            <h2 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100 leading-relaxed">
              {currentQuestion?.question}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => toggleFlag(currentIndex)}
            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
              flagged[currentIndex]
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-600 dark:text-amber-400'
                : 'border-zinc-200 dark:border-[#2e3b37] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'
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
                className={`w-full p-4 rounded-xl border text-left flex items-start gap-3.5 transition-all cursor-pointer group ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500/10 text-zinc-900 dark:text-white ring-2 ring-amber-500/20 shadow-xs'
                    : 'border-zinc-200/90 dark:border-[#2e3b37] hover:border-zinc-400 dark:hover:border-zinc-700 bg-white dark:bg-[#202A27] text-zinc-800 dark:text-zinc-200'
                }`}
              >
                <span
                  className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 transition-colors ${
                    isSelected
                      ? 'bg-amber-500 text-white'
                      : 'bg-zinc-100 dark:bg-[#141a18] text-zinc-500 dark:text-zinc-400 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-800'
                  }`}
                >
                  {optionLetters[idx] || idx + 1}
                </span>
                <span className="text-sm font-medium pt-0.5 leading-relaxed">{option}</span>
              </button>
            );
          })}
        </div>

        {/* Navigation Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-[#2e3b37]">
          <Button
            variant="secondary"
            size="md"
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
                size="md"
                onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                rightIcon={<ChevronRight className="w-4 h-4" />}
              >
                Next
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                onClick={() => setShowConfirmModal(true)}
                isLoading={isSubmitting}
                rightIcon={<Send className="w-4 h-4" />}
                className="bg-amber-500 hover:bg-amber-600 text-white"
              >
                Submit Assessment
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Question Quick Palette */}
      <div className="bg-white dark:bg-[#202A27] rounded-2xl p-5 border border-zinc-200/90 dark:border-[#2e3b37] shadow-xs">
        <div className="flex items-center justify-between mb-3 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="font-bold uppercase tracking-wider">Question Navigator</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Answered
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-200 dark:bg-zinc-700" /> Pending
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {questions.map((_, idx) => {
            const isAnswered = answers[idx] !== -1;
            const isCurrent = currentIndex === idx;
            const isFlagged = flagged[idx];

            return (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`w-9 h-9 rounded-xl font-mono text-xs font-bold transition-all relative cursor-pointer ${
                  isCurrent
                    ? 'ring-2 ring-amber-500 ring-offset-2 dark:ring-offset-[#202A27]'
                    : ''
                } ${
                  isAnswered
                    ? 'bg-amber-500 text-white'
                    : 'bg-zinc-100 dark:bg-[#141a18] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                }`}
              >
                {idx + 1}
                {isFlagged && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-[#202A27]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#202A27] w-full max-w-md rounded-2xl shadow-xl border border-zinc-200 dark:border-[#2e3b37] p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Ready to Submit?
              </h3>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
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
                className="bg-amber-500 hover:bg-amber-600 text-white"
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
