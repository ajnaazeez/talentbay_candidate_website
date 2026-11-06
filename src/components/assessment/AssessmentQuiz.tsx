import React, { useState, useEffect, useCallback } from 'react';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Flag,
  CheckCircle2,
  Send,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import type { AssessmentQuestion } from '@/services/assessmentService';

interface AssessmentQuizProps {
  skill: string;
  difficulty: string;
  questions: AssessmentQuestion[];
  timeLimitMinutes?: number;
  onComplete: (answers: number[], timeSpentSeconds: number) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const AssessmentQuiz: React.FC<AssessmentQuizProps> = ({
  skill,
  difficulty,
  questions,
  timeLimitMinutes = 15,
  onComplete,
  onCancel,
  isSubmitting = false,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>(() =>
    new Array(questions.length).fill(-1)
  );
  const [flagged, setFlagged] = useState<Record<number, boolean>>({});
  const [secondsRemaining, setSecondsRemaining] = useState(timeLimitMinutes * 60);
  const [timeSpent, setTimeSpent] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const currentQuestion = questions[currentIndex];
  const answeredCount = answers.filter((a) => a !== -1).length;
  const progressPercentage = Math.round((answeredCount / questions.length) * 100);

  // Auto-submit handler
  const handleFinalSubmit = useCallback(async () => {
    await onComplete(answers, timeSpent);
  }, [answers, timeSpent, onComplete]);

  // Countdown timer
  useEffect(() => {
    if (secondsRemaining <= 0) {
      handleFinalSubmit();
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
      setTimeSpent((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsRemaining, handleFinalSubmit]);

  // Format timer MM:SS
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timerDisplay = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  const isTimeCritical = secondsRemaining < 120; // under 2 mins

  const handleSelectOption = (optionIndex: number) => {
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
      <div className="bg-white dark:bg-[#222023] rounded-2xl p-5 border border-[#E6DFD8] dark:border-[#494448] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#B87355]/15 text-[#B87355] flex items-center justify-center font-bold text-lg">
            {skill.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-[#29272A] dark:text-white">{skill}</h1>
              <Badge variant="neutral" size="sm">{difficulty}</Badge>
            </div>
            <p className="text-xs text-[#736B70] dark:text-[#A49D9E]">
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
                : 'bg-[#F5F1EA] dark:bg-[#1F1D20] text-[#29272A] dark:text-[#F5F1EA] border-[#E6DFD8] dark:border-[#494448]'
            }`}
          >
            <Clock className={`w-4 h-4 ${isTimeCritical ? 'text-rose-500' : 'text-[#A49D9E]'}`} />
            <span>{timerDisplay}</span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={isSubmitting}
            className="text-[#736B70] dark:text-[#A49D9E] hover:text-rose-600 dark:hover:text-rose-400"
          >
            Exit
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-[#E6DFD8] dark:bg-[#383439] h-2 rounded-full overflow-hidden">
        <div
          className="bg-[#B87355] h-full transition-all duration-300 ease-out"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Question Card */}
      <div className="bg-white dark:bg-[#222023] rounded-2xl p-6 sm:p-8 border border-[#E6DFD8] dark:border-[#494448] shadow-xs space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#B87355]">
              Question {currentIndex + 1}
            </span>
            <h2 className="text-base sm:text-lg font-semibold text-[#29272A] dark:text-white leading-relaxed">
              {currentQuestion?.question}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => toggleFlag(currentIndex)}
            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
              flagged[currentIndex]
                ? 'bg-[#B87355]/15 border-[#B87355]/40 text-[#B87355]'
                : 'border-[#E6DFD8] dark:border-[#494448] text-[#A49D9E] hover:text-[#29272A] dark:hover:text-white'
            }`}
            title="Flag question for review"
          >
            <Flag className="w-4 h-4" />
          </button>
        </div>

        {/* Options List */}
        <div className="space-y-3 pt-2">
          {currentQuestion?.options.map((option: string, idx: number) => {
            const isSelected = answers[currentIndex] === idx;
            const optionLetters = ['A', 'B', 'C', 'D'];
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectOption(idx)}
                className={`w-full p-4 rounded-xl border text-left flex items-start gap-3.5 transition-all cursor-pointer group ${
                  isSelected
                    ? 'border-[#B87355] bg-[#B87355]/10 text-[#29272A] dark:text-white ring-2 ring-[#B87355]/20 shadow-xs'
                    : 'border-[#E6DFD8] dark:border-[#494448] hover:border-[#B87355]/60 bg-white dark:bg-[#222023] text-[#29272A] dark:text-[#D4CDC7]'
                }`}
              >
                <span
                  className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 transition-colors ${
                    isSelected
                      ? 'bg-[#B87355] text-white'
                      : 'bg-[#F5F1EA] dark:bg-[#1F1D20] text-[#736B70] dark:text-[#A49D9E] group-hover:bg-[#E6DFD8] dark:group-hover:bg-[#383439]'
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
        <div className="flex items-center justify-between pt-4 border-t border-[#E6DFD8] dark:border-[#494448]">
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
              >
                Submit Assessment
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Question Quick Palette */}
      <div className="bg-white dark:bg-[#222023] rounded-2xl p-5 border border-[#E6DFD8] dark:border-[#494448] shadow-xs">
        <div className="flex items-center justify-between mb-3 text-xs text-[#736B70] dark:text-[#A49D9E]">
          <span className="font-bold uppercase tracking-wider">Question Navigator</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#B87355]" /> Answered
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E6DFD8] dark:bg-[#383439]" /> Pending
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
                    ? 'ring-2 ring-[#B87355] ring-offset-2 dark:ring-offset-[#222023]'
                    : ''
                } ${
                  isAnswered
                    ? 'bg-[#B87355] text-white'
                    : 'bg-[#F5F1EA] dark:bg-[#1F1D20] text-[#494448] dark:text-[#D4CDC7] hover:bg-[#E6DFD8] dark:hover:bg-[#383439]'
                }`}
              >
                {idx + 1}
                {isFlagged && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-[#222023]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#222023] w-full max-w-md rounded-2xl shadow-xl border border-[#E6DFD8] dark:border-[#494448] p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#B87355]/15 text-[#B87355] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-[#29272A] dark:text-white">
                Ready to Submit?
              </h3>
              <p className="text-xs sm:text-sm text-[#736B70] dark:text-[#A49D9E] mt-1">
                You have answered <strong>{answeredCount}</strong> of{' '}
                <strong>{questions.length}</strong> questions.
                {answeredCount < questions.length && (
                  <span className="block text-[#B87355] mt-1 font-medium">
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
