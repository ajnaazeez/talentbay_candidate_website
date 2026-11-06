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
import { ModalPortal } from '@/components/common/Modal';
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
      <div className="bg-white dark:bg-[#0E2233] rounded-2xl p-5 border border-[#D8E4EA] dark:border-[#1F2D3D] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#00BFA6]/15 text-[#00BFA6] flex items-center justify-center font-bold text-lg">
            {skill.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-[#1F2D3D] dark:text-white">{skill}</h1>
              <Badge variant="neutral" size="sm">{difficulty}</Badge>
            </div>
            <p className="text-xs text-[#6B8699] dark:text-[#8CA6B7]">
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
                : 'bg-[#E8F1F5] dark:bg-[#0A1A27] text-[#1F2D3D] dark:text-[#E8F1F5] border-[#D8E4EA] dark:border-[#1F2D3D]'
            }`}
          >
            <Clock className={`w-4 h-4 ${isTimeCritical ? 'text-rose-500' : 'text-[#8CA6B7]'}`} />
            <span>{timerDisplay}</span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={isSubmitting}
            className="text-[#6B8699] dark:text-[#8CA6B7] hover:text-rose-600 dark:hover:text-rose-400"
          >
            Exit
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-[#D8E4EA] dark:bg-[#132B3E] h-2 rounded-full overflow-hidden">
        <div
          className="bg-[#00BFA6] h-full transition-all duration-300 ease-out"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Question Card */}
      <div className="bg-white dark:bg-[#0E2233] rounded-2xl p-6 sm:p-8 border border-[#D8E4EA] dark:border-[#1F2D3D] shadow-xs space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#00BFA6]">
              Question {currentIndex + 1}
            </span>
            <h2 className="text-base sm:text-lg font-semibold text-[#1F2D3D] dark:text-white leading-relaxed">
              {currentQuestion?.question}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => toggleFlag(currentIndex)}
            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
              flagged[currentIndex]
                ? 'bg-[#00BFA6]/15 border-[#00BFA6]/40 text-[#00BFA6]'
                : 'border-[#D8E4EA] dark:border-[#1F2D3D] text-[#8CA6B7] hover:text-[#1F2D3D] dark:hover:text-white'
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
                    ? 'border-[#00BFA6] bg-[#00BFA6]/10 text-[#1F2D3D] dark:text-white ring-2 ring-[#00BFA6]/20 shadow-xs'
                    : 'border-[#D8E4EA] dark:border-[#1F2D3D] hover:border-[#00BFA6]/60 bg-white dark:bg-[#0E2233] text-[#1F2D3D] dark:text-[#BACDD8]'
                }`}
              >
                <span
                  className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 transition-colors ${
                    isSelected
                      ? 'bg-[#00BFA6] text-white'
                      : 'bg-[#E8F1F5] dark:bg-[#0A1A27] text-[#6B8699] dark:text-[#8CA6B7] group-hover:bg-[#D8E4EA] dark:group-hover:bg-[#132B3E]'
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
        <div className="flex items-center justify-between pt-4 border-t border-[#D8E4EA] dark:border-[#1F2D3D]">
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
      <div className="bg-white dark:bg-[#0E2233] rounded-2xl p-5 border border-[#D8E4EA] dark:border-[#1F2D3D] shadow-xs">
        <div className="flex items-center justify-between mb-3 text-xs text-[#6B8699] dark:text-[#8CA6B7]">
          <span className="font-bold uppercase tracking-wider">Question Navigator</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00BFA6]" /> Answered
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D8E4EA] dark:bg-[#132B3E]" /> Pending
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
                    ? 'ring-2 ring-[#00BFA6] ring-offset-2 dark:ring-offset-[#0E2233]'
                    : ''
                } ${
                  isAnswered
                    ? 'bg-[#00BFA6] text-white'
                    : 'bg-[#E8F1F5] dark:bg-[#0A1A27] text-[#1F2D3D] dark:text-[#BACDD8] hover:bg-[#D8E4EA] dark:hover:bg-[#132B3E]'
                }`}
              >
                {idx + 1}
                {isFlagged && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-[#0E2233]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <ModalPortal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#0E2233] w-full max-w-md rounded-3xl shadow-2xl border border-[#D8E4EA] dark:border-[#1F2D3D] p-6 space-y-4 my-auto animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#00BFA6]/15 text-[#00BFA6] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-[#1F2D3D] dark:text-white">
                Ready to Submit?
              </h3>
              <p className="text-xs sm:text-sm text-[#6B8699] dark:text-[#8CA6B7] mt-1">
                You have answered <strong>{answeredCount}</strong> of{' '}
                <strong>{questions.length}</strong> questions.
                {answeredCount < questions.length && (
                  <span className="block text-[#00BFA6] mt-1 font-medium">
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
        </ModalPortal>
      )}
    </div>
  );
};
