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
    <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-in fade-in duration-300">
      {/* Header */}
      <div className="pt-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Assessments
        </h1>
        <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
          Validate your skills with AI-powered multiple-choice quizzes to stand out to employers.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-xs uppercase font-bold underline hover:text-rose-900 dark:hover:text-rose-100 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Assessment Stats Box (Matching Flutter exactly with Recruiter Web design) */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="grid grid-cols-3 text-center divide-x divide-slate-100 dark:divide-slate-800">
          <div>
            <div className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {completedCount}
            </div>
            <div className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-1">
              COMPLETED
            </div>
          </div>

          <div>
            <div className={`text-3xl md:text-4xl font-extrabold tracking-tight ${getScoreColorClass(averageScore)}`}>
              {averageScore}%
            </div>
            <div className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-1">
              AVG SCORE
            </div>
          </div>

          <div>
            <div className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {skillsCount}
            </div>
            <div className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-1">
              SKILLS
            </div>
          </div>
        </div>

        {/* AI-POWERED ASSESSMENTS ACTIVE Banner */}
        <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/20 p-2.5 flex items-center justify-center gap-2 text-center">
          <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
            AI-POWERED ASSESSMENTS ACTIVE
          </span>
        </div>

        {/* HOW AM I PERFORMING? Button */}
        <div>
          <button
            type="button"
            onClick={() => navigate(ROUTES.CAREER_READINESS)}
            className="w-full py-3 px-4 rounded-xl border border-indigo-600/40 hover:border-indigo-600 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider cursor-pointer shadow-xs"
          >
            <BarChart2 className="w-4 h-4" />
            <span>HOW AM I PERFORMING?</span>
          </button>
        </div>
      </div>

      {/* YOUR SKILLS Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-1">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            Your Skills
          </h2>
          <span className="text-xs font-medium text-slate-400">
            {candidateSkills.length} {candidateSkills.length === 1 ? 'skill' : 'skills'} added
          </span>
        </div>

        {candidateSkills.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {candidateSkills.map((sk) => {
              const skillName = sk.name;
              const bestAssessment = getBestAssessment(skillName);
              const hasAssessment = Boolean(bestAssessment);

              return (
                <div
                  key={skillName}
                  onClick={() => handleOpenDifficulty(skillName)}
                  className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-5 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-card-hover transition-all duration-200 cursor-pointer flex items-center justify-between group shadow-xs"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2.5">
                      <span className="text-base font-bold text-slate-900 dark:text-white truncate">
                        {skillName}
                      </span>
                      <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">
                        Added
                      </span>
                    </div>

                    {hasAssessment && bestAssessment ? (
                      <div className="flex items-center gap-2 text-xs font-semibold">
                        <span className="text-slate-600 dark:text-slate-300">
                          {bestAssessment.proficiencyLevel}
                        </span>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <span className={getScoreColorClass(getResultPercentage(bestAssessment))}>
                          {getResultPercentage(bestAssessment)}% score
                        </span>
                        <span className="border border-slate-200 dark:border-slate-700 uppercase px-1.5 py-0.5 text-[9px] font-bold text-slate-600 dark:text-slate-400 rounded-md">
                          {bestAssessment.difficulty}
                        </span>
                      </div>
                    ) : (
                      <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        15 questions • ~10 min
                      </div>
                    )}
                  </div>

                  <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all shrink-0">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
            No profile skills added yet. Add skills to your profile to take assessments.
          </div>
        )}
      </div>

      {/* RECOMMENDED FOR YOU (Related Skills) Section */}
      {(relatedSkills.length > 0 || loadingRelated) && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between pb-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Recommended for You
            </h2>
            <span className="text-xs font-medium text-slate-400">
              Related to your technical profile
            </span>
          </div>

          {loadingRelated ? (
            <div className="py-6 flex justify-center">
              <LoadingSpinner size="sm" label="Loading related skills..." />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {relatedSkills.map((relSkill) => {
                const bestAssessment = getBestAssessment(relSkill);
                const hasAssessment = Boolean(bestAssessment);

                return (
                  <div
                    key={relSkill}
                    onClick={() => handleOpenDifficulty(relSkill)}
                    className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-5 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-card-hover transition-all duration-200 cursor-pointer flex items-center justify-between group shadow-xs"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <span className="text-base font-bold text-slate-900 dark:text-white truncate block">
                        {relSkill}
                      </span>

                      {hasAssessment && bestAssessment ? (
                        <div className="flex items-center gap-2 text-xs font-semibold">
                          <span className="text-slate-600 dark:text-slate-300">
                            {bestAssessment.proficiencyLevel}
                          </span>
                          <span className="text-slate-300 dark:text-slate-700">•</span>
                          <span className={getScoreColorClass(getResultPercentage(bestAssessment))}>
                            {getResultPercentage(bestAssessment)}% score
                          </span>
                          <span className="border border-slate-200 dark:border-slate-700 uppercase px-1.5 py-0.5 text-[9px] font-bold text-slate-600 dark:text-slate-400 rounded-md">
                            {bestAssessment.difficulty}
                          </span>
                        </div>
                      ) : (
                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          15 questions • ~10 min
                        </div>
                      )}
                    </div>

                    <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all shrink-0">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SELECT DIFFICULTY Modal */}
      {selectedSkill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 sm:p-8 space-y-6 relative shadow-2xl">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setSelectedSkill(null)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                {selectedSkill}
              </span>
              <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
                SELECT DIFFICULTY
              </h3>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 pt-2">
              {/* Easy */}
              <div
                onClick={() => !isEasyDone && handleStartQuiz(selectedSkill, 'Easy')}
                className={`py-4 flex items-center justify-between ${
                  isEasyDone ? 'opacity-60 cursor-default' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer rounded-xl px-2'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
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
                    ? 'opacity-40 cursor-not-allowed px-2'
                    : isMediumDone
                    ? 'opacity-60 cursor-default px-2'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer rounded-xl px-2'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
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
                    ? 'opacity-40 cursor-not-allowed px-2'
                    : isHardDone
                    ? 'opacity-60 cursor-default px-2'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer rounded-xl px-2'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
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
                    ? 'opacity-40 cursor-not-allowed px-2'
                    : isMixedDone
                    ? 'opacity-60 cursor-default px-2'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer rounded-xl px-2'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      MIXED
                    </span>
                    {isMixedDone && <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}
                    {!isHardDone && <Lock className="w-3.5 h-3.5 text-slate-400" />}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Comprehensive evaluation across all difficulty levels.
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
