import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Sparkles,
  BarChart2,
  ArrowRight,
  CheckCircle,
  Lock,
  X,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { candidateService } from '@/services/candidateService';
import { assessmentService } from '@/services/assessmentService';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { AssessmentQuiz } from '@/components/assessment/AssessmentQuiz';
import { AssessmentResultSummary } from '@/components/assessment/AssessmentResultSummary';
import { ROUTES } from '@/utils/constants';
import type {
  AssessmentDifficulty,
  AssessmentQuestion,
  AssessmentResult,
} from '@/types/assessment';
import type { CandidateModel } from '@/types/candidate';

type ViewMode = 'list' | 'generating' | 'quiz' | 'result';

export const AssessmentsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [candidate, setCandidate] = useState<CandidateModel | null>(null);
  const [assessmentResults, setAssessmentResults] = useState<AssessmentResult[]>([]);
  const [relatedSkills, setRelatedSkills] = useState<string[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);

  // Difficulty Selection Modal State
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);

  // Quiz & Result State
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [activeSkill, setActiveSkill] = useState('');
  const [activeDifficulty, setActiveDifficulty] = useState<AssessmentDifficulty>('Medium');
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [latestResult, setLatestResult] = useState<AssessmentResult | null>(null);

  // Load candidate and assessments
  const loadData = useCallback(async () => {
    if (!user?.uid) return;
    try {
      setLoading(true);
      setError(null);

      const [candData, resultsData] = await Promise.all([
        candidateService.getCandidate(user.uid),
        assessmentService.getCandidateAssessments(user.uid),
      ]);

      setCandidate(candData);
      setAssessmentResults(resultsData);

      // Load related skills
      const candSkillNames = (candData?.skills || []).map((s) => s.name);
      if (candSkillNames.length > 0) {
        setLoadingRelated(true);
        assessmentService
          .getRelatedSkills(candSkillNames)
          .then((rel) => setRelatedSkills(rel))
          .catch((e) => console.warn('Failed to load related skills:', e))
          .finally(() => setLoadingRelated(false));
      }
    } catch (err: any) {
      console.error('Error loading assessments:', err);
      setError('Unable to load assessments data. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle URL skill param if any
  useEffect(() => {
    const urlSkill = searchParams.get('skill');
    if (urlSkill && viewMode === 'list') {
      setSelectedSkill(decodeURIComponent(urlSkill));
    }
  }, [searchParams, viewMode]);

  // Group assessments by skill (case-insensitive)
  const assessmentMap: Record<string, AssessmentResult[]> = {};
  assessmentResults.forEach((a) => {
    const key = a.skill.toLowerCase().trim();
    if (!assessmentMap[key]) {
      assessmentMap[key] = [];
    }
    assessmentMap[key].push(a);
  });

  // Best assessment helper for a skill
  const getResultPercentage = (a: AssessmentResult): number => {
    if (typeof a.percentage === 'number') return Math.round(a.percentage);
    return Math.round((a.score / Math.max(a.totalQuestions, 1)) * 100);
  };

  // Calculate statistics
  const completedCount = assessmentResults.length;
  const averageScore =
    completedCount === 0
      ? 0
      : Math.round(
          assessmentResults.reduce((acc, a) => acc + getResultPercentage(a), 0) /
            completedCount
        );

  const candidateSkills = candidate?.skills || [];
  const skillsCount = candidateSkills.length;

  // Best assessment helper for a skill
  const getBestAssessment = (skillName: string): AssessmentResult | undefined => {
    const list = assessmentMap[skillName.toLowerCase().trim()] || [];
    if (list.length === 0) return undefined;

    // Difficulty ordering: Mixed > Hard > Medium > Easy
    const difficultyOrder: Record<string, number> = {
      mixed: 4,
      hard: 3,
      medium: 2,
      easy: 1,
    };

    const sorted = [...list].sort((a, b) => {
      const diffA = difficultyOrder[a.difficulty.toLowerCase()] || 0;
      const diffB = difficultyOrder[b.difficulty.toLowerCase()] || 0;
      return diffB - diffA;
    });

    return sorted[0];
  };

  // Helper color for score
  const getScoreColorClass = (score: number): string => {
    if (score >= 75) return 'text-emerald-500';
    if (score >= 50) return 'text-amber-500';
    return 'text-rose-500';
  };

  // Open difficulty selection for a skill
  const handleOpenDifficulty = (skill: string) => {
    if (candidate && !candidate.isPremium) {
      navigate(ROUTES.SUBSCRIPTION);
      return;
    }
    setSelectedSkill(skill);
  };

  // Start assessment quiz
  const handleStartQuiz = async (skill: string, difficulty: AssessmentDifficulty) => {
    setSelectedSkill(null);
    setActiveSkill(skill);
    setActiveDifficulty(difficulty);
    setViewMode('generating');
    setError(null);

    try {
      const generatedQuestions = await assessmentService.generateQuestions(skill, difficulty, 15);
      setQuestions(generatedQuestions);
      setViewMode('quiz');
    } catch (err: any) {
      console.error('Failed to generate questions:', err);
      setError(err?.message || 'Failed to generate assessment questions. Please try again.');
      setViewMode('list');
    }
  };

  // Submit assessment quiz
  const handleSubmitQuiz = async (answers: number[]) => {
    if (!user?.uid) return;
    try {
      let score = 0;
      questions.forEach((q, idx) => {
        if (answers[idx] === q.correctAnswerIndex) {
          score += 1;
        }
      });

      const res = await assessmentService.saveAssessmentResult({
        candidateId: user.uid,
        skill: activeSkill,
        questions,
        userAnswers: answers,
        score,
        totalQuestions: questions.length,
        difficulty: activeDifficulty,
      });

      setLatestResult(res);
      setViewMode('result');
      // Refresh assessments list in background
      loadData();
    } catch (err: any) {
      console.error('Failed to save assessment result:', err);
      setError(err?.message || 'Failed to submit assessment results.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" label="Loading Assessments..." />
      </div>
    );
  }

  // View: Generating questions
  if (viewMode === 'generating') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <LoadingSpinner size="lg" />
        <h3 className="text-base font-bold uppercase tracking-wider text-slate-900 dark:text-white">
          Generating your assessment questions...
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
          Curating custom multiple-choice questions for {activeSkill} ({activeDifficulty})
        </p>
      </div>
    );
  }

  // View: Active Quiz
  if (viewMode === 'quiz' && questions.length > 0) {
    return (
      <div className="py-4">
        <AssessmentQuiz
          skill={activeSkill}
          difficulty={activeDifficulty}
          questions={questions}
          onSubmit={handleSubmitQuiz}
          onCancel={() => setViewMode('list')}
        />
      </div>
    );
  }

  // View: Result Screen
  if (viewMode === 'result' && latestResult) {
    return (
      <div className="py-4">
        <AssessmentResultSummary
          result={latestResult}
          onRetake={() => handleStartQuiz(latestResult.skill, latestResult.difficulty)}
        />
      </div>
    );
  }

  // Completed difficulties for selected skill in modal
  const selectedSkillAssessments = selectedSkill
    ? assessmentMap[selectedSkill.toLowerCase().trim()] || []
    : [];

  const isLevelCompleted = (diff: string): boolean => {
    return selectedSkillAssessments.some(
      (a) => a.difficulty.toLowerCase() === diff.toLowerCase()
    );
  };

  const isEasyDone = isLevelCompleted('Easy');
  const isMediumDone = isLevelCompleted('Medium');
  const isHardDone = isLevelCompleted('Hard');
  const isMixedDone = isLevelCompleted('Mixed');

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black uppercase tracking-[2px] text-slate-900 dark:text-white font-futura">
          ASSESSMENTS
        </h1>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-none bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-xs uppercase font-bold underline hover:text-rose-900 dark:hover:text-rose-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Assessment Stats Box (Matching Flutter exactly) */}
      <div className="border border-teal-500/20 bg-teal-500/[0.02] dark:bg-slate-900/40 p-6 md:p-8 space-y-6">
        <div className="grid grid-cols-3 text-center divide-x divide-slate-100 dark:divide-slate-800">
          <div>
            <div className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
              {completedCount}
            </div>
            <div className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-1">
              COMPLETED
            </div>
          </div>

          <div>
            <div className={`text-3xl md:text-4xl font-black tracking-tight ${getScoreColorClass(averageScore)}`}>
              {averageScore}%
            </div>
            <div className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-1">
              AVG SCORE
            </div>
          </div>

          <div>
            <div className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
              {skillsCount}
            </div>
            <div className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-1">
              SKILLS
            </div>
          </div>
        </div>

        {/* AI-POWERED ASSESSMENTS ACTIVE Banner */}
        <div className="border border-teal-500/30 p-2.5 flex items-center justify-center gap-2 text-center">
          <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
          <span className="text-[10px] font-black uppercase tracking-[1.5px] text-slate-800 dark:text-slate-200">
            AI-POWERED ASSESSMENTS ACTIVE
          </span>
        </div>

        {/* HOW AM I PERFORMING? Button */}
        <div>
          <button
            type="button"
            onClick={() => navigate(ROUTES.CAREER_READINESS)}
            className="w-full py-2.5 px-4 rounded-full border border-teal-600/50 hover:border-teal-600 text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/20 transition flex items-center justify-center gap-2 text-xs font-black tracking-wider uppercase cursor-pointer"
          >
            <BarChart2 className="w-4 h-4" />
            HOW AM I PERFORMING?
          </button>
        </div>
      </div>

      {/* YOUR SKILLS Section */}
      <div className="space-y-3">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">
          YOUR SKILLS
        </h2>

        {candidateSkills.length > 0 ? (
          <div className="space-y-3">
            {candidateSkills.map((sk) => {
              const skillName = sk.name;
              const bestAssessment = getBestAssessment(skillName);
              const hasAssessment = Boolean(bestAssessment);

              return (
                <div
                  key={skillName}
                  onClick={() => handleOpenDifficulty(skillName)}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 hover:border-slate-300 dark:hover:border-slate-700 transition cursor-pointer flex items-center justify-between group"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                        {skillName}
                      </span>
                      <span className="bg-teal-600 text-white text-[9px] font-bold uppercase px-1.5 py-0.5 tracking-wider">
                        ADDED
                      </span>
                    </div>

                    {hasAssessment && bestAssessment ? (
                      <div className="flex items-center gap-2 text-[11px] font-bold">
                        <span className="uppercase text-slate-700 dark:text-slate-300">
                          {bestAssessment.proficiencyLevel}
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className={getScoreColorClass(getResultPercentage(bestAssessment))}>
                          {getResultPercentage(bestAssessment)}% SCORE
                        </span>
                        <span className="border border-slate-300 dark:border-slate-700 uppercase px-1 py-0.5 text-[8px] font-black text-slate-700 dark:text-slate-300">
                          {bestAssessment.difficulty}
                        </span>
                      </div>
                    ) : (
                      <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        15 QUESTIONS • ~10 MIN
                      </div>
                    )}
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-900 dark:text-white group-hover:translate-x-1 transition-transform" />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
            No profile skills added yet. Add skills to your profile to take assessments.
          </div>
        )}
      </div>

      {/* RECOMMENDED FOR YOU (Related Skills) Section */}
      {(relatedSkills.length > 0 || loadingRelated) && (
        <div className="space-y-3 pt-2">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">
            RECOMMENDED FOR YOU
          </h2>

          {loadingRelated ? (
            <div className="py-6 flex justify-center">
              <LoadingSpinner size="sm" label="Loading related skills..." />
            </div>
          ) : (
            <div className="space-y-3">
              {relatedSkills.map((relSkill) => {
                const bestAssessment = getBestAssessment(relSkill);
                const hasAssessment = Boolean(bestAssessment);

                return (
                  <div
                    key={relSkill}
                    onClick={() => handleOpenDifficulty(relSkill)}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 hover:border-slate-300 dark:hover:border-slate-700 transition cursor-pointer flex items-center justify-between group"
                  >
                    <div className="space-y-1.5">
                      <span className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                        {relSkill}
                      </span>

                      {hasAssessment && bestAssessment ? (
                        <div className="flex items-center gap-2 text-[11px] font-bold">
                          <span className="uppercase text-slate-700 dark:text-slate-300">
                            {bestAssessment.proficiencyLevel}
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className={getScoreColorClass(getResultPercentage(bestAssessment))}>
                            {getResultPercentage(bestAssessment)}% SCORE
                          </span>
                          <span className="border border-slate-300 dark:border-slate-700 uppercase px-1 py-0.5 text-[8px] font-black text-slate-700 dark:text-slate-300">
                            {bestAssessment.difficulty}
                          </span>
                        </div>
                      ) : (
                        <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                          15 QUESTIONS • ~10 MIN
                        </div>
                      )}
                    </div>

                    <ArrowRight className="w-4 h-4 text-slate-900 dark:text-white group-hover:translate-x-1 transition-transform" />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SELECT DIFFICULTY Modal */}
      {selectedSkill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg p-6 sm:p-8 space-y-6 relative shadow-2xl">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setSelectedSkill(null)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="text-xs font-black uppercase tracking-[1.5px] text-slate-400">
                {selectedSkill}
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white font-futura">
                SELECT DIFFICULTY
              </h3>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 pt-2">
              {/* Easy */}
              <div
                onClick={() => !isEasyDone && handleStartQuiz(selectedSkill, 'Easy')}
                className={`py-4 flex items-center justify-between ${
                  isEasyDone ? 'opacity-60 cursor-default' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      EASY
                    </span>
                    {isEasyDone && <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Perfect for beginners starting their journey.
                  </p>
                </div>
                {!isEasyDone && <ArrowRight className="w-4 h-4 text-slate-900 dark:text-white" />}
              </div>

              {/* Medium */}
              <div
                onClick={() =>
                  isEasyDone && !isMediumDone && handleStartQuiz(selectedSkill, 'Medium')
                }
                className={`py-4 flex items-center justify-between ${
                  !isEasyDone
                    ? 'opacity-40 cursor-not-allowed'
                    : isMediumDone
                    ? 'opacity-60 cursor-default'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      MEDIUM
                    </span>
                    {isMediumDone && <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}
                    {!isEasyDone && <Lock className="w-3.5 h-3.5 text-slate-400" />}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Test your core knowledge and practical skills.
                  </p>
                </div>
                {isEasyDone && !isMediumDone && (
                  <ArrowRight className="w-4 h-4 text-slate-900 dark:text-white" />
                )}
              </div>

              {/* Hard */}
              <div
                onClick={() =>
                  isMediumDone && !isHardDone && handleStartQuiz(selectedSkill, 'Hard')
                }
                className={`py-4 flex items-center justify-between ${
                  !isMediumDone
                    ? 'opacity-40 cursor-not-allowed'
                    : isHardDone
                    ? 'opacity-60 cursor-default'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      HARD
                    </span>
                    {isHardDone && <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}
                    {!isMediumDone && <Lock className="w-3.5 h-3.5 text-slate-400" />}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Challenge yourself with advanced complex concepts.
                  </p>
                </div>
                {isMediumDone && !isHardDone && (
                  <ArrowRight className="w-4 h-4 text-slate-900 dark:text-white" />
                )}
              </div>

              {/* Mixed */}
              <div
                onClick={() =>
                  isHardDone && !isMixedDone && handleStartQuiz(selectedSkill, 'Mixed')
                }
                className={`py-4 flex items-center justify-between ${
                  !isHardDone
                    ? 'opacity-40 cursor-not-allowed'
                    : isMixedDone
                    ? 'opacity-60 cursor-default'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      MIXED
                    </span>
                    {isMixedDone && <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}
                    {!isHardDone && <Lock className="w-3.5 h-3.5 text-slate-400" />}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    A balanced set of questions across all levels.
                  </p>
                </div>
                {isHardDone && !isMixedDone && (
                  <ArrowRight className="w-4 h-4 text-slate-900 dark:text-white" />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssessmentsPage;
