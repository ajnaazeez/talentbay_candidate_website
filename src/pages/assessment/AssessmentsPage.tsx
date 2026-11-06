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
  Plus,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { candidateService } from '@/services/candidateService';
import { assessmentService } from '@/services/assessmentService';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { AssessmentQuiz } from '@/components/assessment/AssessmentQuiz';
import { AssessmentResultSummary } from '@/components/assessment/AssessmentResultSummary';
import { SkillSelectorModal } from '@/components/assessment/SkillSelectorModal';
import { ROUTES } from '@/utils/constants';
import { hasAssessmentAccess } from '@/utils/subscriptionUtils';
import type {
  AssessmentDifficulty,
  AssessmentQuestion,
  AssessmentResult,
} from '@/types/assessment';
import type { CandidateModel } from '@/types/candidate';

type ViewMode = 'list' | 'generating' | 'quiz' | 'result';

export const AssessmentsPage: React.FC = () => {
  const { user, candidate: authCandidate, initialLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [candidate, setCandidate] = useState<CandidateModel | null>(authCandidate || null);
  const [assessmentResults, setAssessmentResults] = useState<AssessmentResult[]>([]);
  const [relatedSkills, setRelatedSkills] = useState<string[]>([]);

  // Skill Selector Modal (Search & Explore Any Skill)
  const [isSkillSelectorOpen, setIsSkillSelectorOpen] = useState(false);

  // Difficulty Selection Modal State
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);

  // Quiz & Result State
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [activeSkill, setActiveSkill] = useState('');
  const [activeDifficulty, setActiveDifficulty] = useState<AssessmentDifficulty>('Medium');
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [latestResult, setLatestResult] = useState<AssessmentResult | null>(null);

  // Load candidate profile & assessments
  const loadData = useCallback(async () => {
    if (!user?.uid) {
      if (!initialLoading) {
        setLoading(false);
      }
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [candData, resultsData] = await Promise.all([
        candidateService.getCandidate(user.uid),
        assessmentService.getCandidateAssessments(user.uid),
      ]);

      setCandidate(candData || authCandidate || null);
      setAssessmentResults(resultsData);

      // Load related skills (matches Flutter: loads in background and presents when ready)
      const candSkillNames = (candData?.skills || []).map((s) => s.name);
      if (candSkillNames.length > 0) {
        assessmentService
          .getRelatedSkills(candSkillNames)
          .then((rel) => setRelatedSkills(rel))
          .catch((e) => console.warn('Failed to load related skills:', e));
      }
    } catch (err: any) {
      console.error('Error loading assessments:', err);
      setError('Unable to load assessments data. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, [user?.uid, initialLoading, authCandidate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle URL skill param if any (e.g. from Career Readiness or Job Details)
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

  // Calculate statistics
  const completedCount = assessmentResults.length;
  const averageScore =
    completedCount > 0
      ? Math.round(
          assessmentResults.reduce((sum, a) => {
            const pct = (a.score / Math.max(a.totalQuestions, 1)) * 100;
            return sum + pct;
          }, 0) / completedCount
        )
      : 0;

  const candidateSkills = Array.isArray(candidate?.skills) ? candidate.skills : [];
  const skillsCount = candidateSkills.length;

  const getBestAssessment = (skillName: string): AssessmentResult | null => {
    const list = assessmentMap[skillName.toLowerCase().trim()] || [];
    if (!list.length) return null;
    return [...list].sort((a, b) => {
      const pctA = a.score / Math.max(a.totalQuestions, 1);
      const pctB = b.score / Math.max(b.totalQuestions, 1);
      return pctB - pctA;
    })[0];
  };

  const getResultPercentage = (a: AssessmentResult): number => {
    return Math.round((a.score / Math.max(a.totalQuestions, 1)) * 100);
  };

  const getScoreColorClass = (pct: number): string => {
    if (pct >= 75) return 'text-emerald-600 dark:text-emerald-400';
    if (pct >= 50) return 'text-[#00BFA6]';
    return 'text-rose-600 dark:text-rose-400';
  };

  // Open Difficulty Modal
  const handleOpenDifficulty = (skillName: string) => {
    setSelectedSkill(skillName);
  };

  // Start Assessment Flow
  const handleStartQuiz = async (
    skillName: string,
    difficulty: AssessmentDifficulty
  ) => {
    setSelectedSkill(null);
    setIsSkillSelectorOpen(false);

    // Subscription gate verification
    const hasAccess = hasAssessmentAccess(candidate);
    if (!hasAccess) {
      navigate(ROUTES.SUBSCRIPTION);
      return;
    }

    try {
      setActiveSkill(skillName);
      setActiveDifficulty(difficulty);
      setViewMode('generating');

      // Call real Cloud Function to generate questions
      const generatedQuestions = await assessmentService.generateQuestions(
        skillName,
        difficulty
      );

      setQuestions(generatedQuestions);
      setViewMode('quiz');
    } catch (err: any) {
      console.error('Failed to start assessment:', err);
      setError(err?.message || 'Failed to generate assessment questions. Please try again.');
      setViewMode('list');
    }
  };

  // Submit Quiz Callback
  const handleSubmitQuiz = async (answers: number[], timeSpentSeconds: number) => {
    if (!user?.uid || !candidate) return;

    try {
      // Calculate real score
      let correct = 0;
      questions.forEach((q, idx) => {
        if (answers[idx] === q.correctAnswerIndex) {
          correct++;
        }
      });

      const newResult = await assessmentService.submitAssessment(
        user.uid,
        activeSkill,
        activeDifficulty,
        correct,
        questions.length,
        questions,
        answers,
        timeSpentSeconds
      );

      setLatestResult(newResult);
      setViewMode('result');

      // Reload fresh data from Firestore
      await loadData();
    } catch (err: any) {
      console.error('Failed to save assessment result:', err);
      setError(err?.message || 'Failed to submit assessment results.');
    }
  };

  if (initialLoading || (loading && !candidate && !assessmentResults.length)) {
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
        <h3 className="text-base font-bold uppercase tracking-wider text-[#1F2D3D] dark:text-white">
          Generating your assessment questions...
        </h3>
        <p className="text-xs text-[#6B8699] dark:text-[#8CA6B7] max-w-sm">
          Curating genuine multiple-choice technical questions for {activeSkill} ({activeDifficulty}) via Cloud AI
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
          onComplete={handleSubmitQuiz}
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
      (a) => a.difficulty.toLowerCase().trim() === diff.toLowerCase().trim()
    );
  };

  const isEasyDone = isLevelCompleted('Easy');
  const isMediumDone = isLevelCompleted('Medium');
  const isHardDone = isLevelCompleted('Hard');
  const isMixedDone = isLevelCompleted('Mixed');

  const assessedScoresMap = assessmentService.extractLatestSkillScores(assessmentResults);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F2D3D] dark:text-white tracking-tight flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-[#00BFA6]" />
            Skill Assessments
          </h1>
          <p className="text-xs sm:text-sm font-medium text-[#6B8699] dark:text-[#8CA6B7] mt-1">
            Validate your technical proficiency with AI-powered skill evaluations and earn verified badges.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsSkillSelectorOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0E2233] text-white hover:bg-[#163248] active:bg-[#0A1A27] border border-[#00BFA6]/40 hover:border-[#00BFA6] text-xs font-bold uppercase tracking-wider transition shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Assess Any Skill</span>
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
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

      {/* Assessment Stats Box */}
      <div className="rounded-2xl border border-[#D8E4EA] dark:border-[#1F2D3D] bg-white dark:bg-[#0E2233] p-6 sm:p-8 shadow-xs space-y-6">
        <div className="grid grid-cols-3 text-center divide-x divide-[#D8E4EA] dark:divide-[#1F2D3D]">
          <div>
            <div className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#1F2D3D] dark:text-white">
              {completedCount}
            </div>
            <div className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-[#6B8699] dark:text-[#8CA6B7] mt-1">
              COMPLETED
            </div>
          </div>

          <div>
            <div className={`text-3xl md:text-4xl font-extrabold tracking-tight ${getScoreColorClass(averageScore)}`}>
              {averageScore}%
            </div>
            <div className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-[#6B8699] dark:text-[#8CA6B7] mt-1">
              AVG SCORE
            </div>
          </div>

          <div>
            <div className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#1F2D3D] dark:text-white">
              {skillsCount}
            </div>
            <div className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-[#6B8699] dark:text-[#8CA6B7] mt-1">
              SKILLS
            </div>
          </div>
        </div>

        {/* AI-POWERED ASSESSMENTS ACTIVE Banner */}
        <div className="rounded-xl border border-[#00BFA6]/30 bg-[#00BFA6]/10 p-2.5 flex items-center justify-center gap-2 text-center">
          <Sparkles className="w-4 h-4 text-[#00BFA6]" />
          <span className="text-xs font-bold text-[#00BFA6]">
            AI-POWERED ASSESSMENTS ACTIVE
          </span>
        </div>

        {/* HOW AM I PERFORMING? Button */}
        <div>
          <button
            type="button"
            onClick={() => navigate(ROUTES.CAREER_READINESS)}
            className="w-full py-3 px-4 rounded-xl border border-[#D8E4EA] dark:border-[#1F2D3D] hover:border-[#00BFA6] text-[#1F2D3D] dark:text-white hover:bg-[#E8F1F5] dark:hover:bg-[#132B3E] transition flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider cursor-pointer shadow-xs"
          >
            <BarChart2 className="w-4 h-4 text-[#00BFA6]" />
            <span>HOW AM I PERFORMING?</span>
          </button>
        </div>
      </div>

      {/* YOUR SKILLS Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-1">
          <h2 className="text-lg font-bold text-[#1F2D3D] dark:text-white tracking-tight">
            Your Skills
          </h2>
          <span className="text-xs font-medium text-[#6B8699] dark:text-[#8CA6B7]">
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
                  className="rounded-2xl bg-white dark:bg-[#0E2233] border border-[#D8E4EA] dark:border-[#1F2D3D] p-5 hover:border-[#00BFA6]/60 hover:shadow-md transition-all duration-200 cursor-pointer flex items-center justify-between group"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2.5">
                      <span className="text-base font-bold text-[#1F2D3D] dark:text-white truncate">
                        {skillName}
                      </span>
                      <span className="bg-[#E8F1F5] text-[#1F2D3D] dark:bg-[#132B3E] dark:text-[#BACDD8] text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border border-[#D8E4EA] dark:border-[#1F2D3D]">
                        Added
                      </span>
                    </div>

                    {hasAssessment && bestAssessment ? (
                      <div className="flex items-center gap-2 text-xs font-semibold">
                        <span className="text-[#1F2D3D] dark:text-[#BACDD8]">
                          {bestAssessment.proficiencyLevel}
                        </span>
                        <span className="text-[#8CA6B7]">•</span>
                        <span className={getScoreColorClass(getResultPercentage(bestAssessment))}>
                          {getResultPercentage(bestAssessment)}% score
                        </span>
                        <span className="border border-[#D8E4EA] dark:border-[#1F2D3D] uppercase px-1.5 py-0.5 text-[9px] font-bold text-[#6B8699] dark:text-[#8CA6B7] rounded-md">
                          {bestAssessment.difficulty}
                        </span>
                      </div>
                    ) : (
                      <div className="text-xs font-medium text-[#6B8699] dark:text-[#8CA6B7]">
                        15 questions • ~10 min
                      </div>
                    )}
                  </div>

                  <div className="w-8 h-8 rounded-xl bg-[#E8F1F5] dark:bg-[#0A1A27] flex items-center justify-center text-[#8CA6B7] group-hover:text-[#00BFA6] group-hover:translate-x-0.5 transition-all shrink-0">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 rounded-2xl border border-dashed border-[#D8E4EA] dark:border-[#1F2D3D] bg-white dark:bg-[#0E2233] text-center space-y-3">
            <p className="text-xs text-[#6B8699] dark:text-[#8CA6B7]">
              No skills added to your profile yet. You can assess any skill right now:
            </p>
            <button
              type="button"
              onClick={() => setIsSkillSelectorOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0E2233] text-white hover:bg-[#163248] border border-[#00BFA6]/40 hover:border-[#00BFA6] text-xs font-bold uppercase transition shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Choose a Skill to Assess</span>
            </button>
          </div>
        )}
      </div>

      {/* RECOMMENDED FOR YOU (Related Skills) Section - Matches Flutter: renders seamlessly when skills are available */}
      {relatedSkills.length > 0 && (
        <div className="space-y-4 pt-2 transition-opacity duration-300">
          <div className="flex items-center justify-between pb-1">
            <h2 className="text-lg font-bold text-[#1F2D3D] dark:text-white tracking-tight">
              Recommended for You
            </h2>
            <span className="text-xs font-medium text-[#6B8699] dark:text-[#8CA6B7]">
              Related to your technical profile
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {relatedSkills.map((relSkill) => {
                const bestAssessment = getBestAssessment(relSkill);
                const hasAssessment = Boolean(bestAssessment);

                return (
                  <div
                    key={relSkill}
                    onClick={() => handleOpenDifficulty(relSkill)}
                    className="rounded-2xl bg-white dark:bg-[#0E2233] border border-[#D8E4EA] dark:border-[#1F2D3D] p-5 hover:border-[#00BFA6]/60 hover:shadow-md transition-all duration-200 cursor-pointer flex items-center justify-between group"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <span className="text-base font-bold text-[#1F2D3D] dark:text-white truncate block">
                        {relSkill}
                      </span>

                      {hasAssessment && bestAssessment ? (
                        <div className="flex items-center gap-2 text-xs font-semibold">
                          <span className="text-[#1F2D3D] dark:text-[#BACDD8]">
                            {bestAssessment.proficiencyLevel}
                          </span>
                          <span className="text-[#8CA6B7]">•</span>
                          <span className={getScoreColorClass(getResultPercentage(bestAssessment))}>
                            {getResultPercentage(bestAssessment)}% score
                          </span>
                          <span className="border border-[#D8E4EA] dark:border-[#1F2D3D] uppercase px-1.5 py-0.5 text-[9px] font-bold text-[#6B8699] dark:text-[#8CA6B7] rounded-md">
                            {bestAssessment.difficulty}
                          </span>
                        </div>
                      ) : (
                        <div className="text-xs font-medium text-[#6B8699] dark:text-[#8CA6B7]">
                          15 questions • ~10 min
                        </div>
                      )}
                    </div>

                    <div className="w-8 h-8 rounded-xl bg-[#E8F1F5] dark:bg-[#0A1A27] flex items-center justify-center text-[#8CA6B7] group-hover:text-[#00BFA6] group-hover:translate-x-0.5 transition-all shrink-0">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                );
              })}
            </div>
        </div>
      )}

      {/* SELECT DIFFICULTY Modal */}
      {selectedSkill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#0E2233] border border-[#D8E4EA] dark:border-[#1F2D3D] rounded-2xl w-full max-w-lg p-6 sm:p-8 space-y-6 relative shadow-2xl">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setSelectedSkill(null)}
              className="absolute top-6 right-6 text-[#8CA6B7] hover:text-[#1F2D3D] dark:hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#00BFA6]">
                {selectedSkill}
              </span>
              <h3 className="text-2xl font-black uppercase tracking-tight text-[#1F2D3D] dark:text-white">
                SELECT DIFFICULTY
              </h3>
            </div>

            <div className="divide-y divide-[#D8E4EA] dark:divide-[#1F2D3D] pt-2">
              {/* Easy */}
              <div
                onClick={() => !isEasyDone && handleStartQuiz(selectedSkill, 'Easy')}
                className={`py-4 flex items-center justify-between ${
                  isEasyDone ? 'opacity-60 cursor-default' : 'hover:bg-[#E8F1F5] dark:hover:bg-[#132B3E] cursor-pointer rounded-xl px-2'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#1F2D3D] dark:text-white">
                      EASY
                    </span>
                    {isEasyDone && <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}
                  </div>
                  <p className="text-xs text-[#6B8699] dark:text-[#8CA6B7] mt-0.5">
                    Perfect for beginners starting their journey.
                  </p>
                </div>
                {!isEasyDone && <ArrowRight className="w-4 h-4 text-[#1F2D3D] dark:text-white" />}
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
                    : 'hover:bg-[#E8F1F5] dark:hover:bg-[#132B3E] cursor-pointer rounded-xl px-2'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#1F2D3D] dark:text-white">
                      MEDIUM
                    </span>
                    {isMediumDone && <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}
                    {!isEasyDone && <Lock className="w-3.5 h-3.5 text-[#8CA6B7]" />}
                  </div>
                  <p className="text-xs text-[#6B8699] dark:text-[#8CA6B7] mt-0.5">
                    Test your core knowledge and practical skills.
                  </p>
                </div>
                {isEasyDone && !isMediumDone && (
                  <ArrowRight className="w-4 h-4 text-[#1F2D3D] dark:text-white" />
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
                    : 'hover:bg-[#E8F1F5] dark:hover:bg-[#132B3E] cursor-pointer rounded-xl px-2'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#1F2D3D] dark:text-white">
                      HARD
                    </span>
                    {isHardDone && <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}
                    {!isMediumDone && <Lock className="w-3.5 h-3.5 text-[#8CA6B7]" />}
                  </div>
                  <p className="text-xs text-[#6B8699] dark:text-[#8CA6B7] mt-0.5">
                    Challenge yourself with advanced complex concepts.
                  </p>
                </div>
                {isMediumDone && !isHardDone && (
                  <ArrowRight className="w-4 h-4 text-[#1F2D3D] dark:text-white" />
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
                    : 'hover:bg-[#E8F1F5] dark:hover:bg-[#132B3E] cursor-pointer rounded-xl px-2'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#1F2D3D] dark:text-white">
                      MIXED
                    </span>
                    {isMixedDone && <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}
                    {!isHardDone && <Lock className="w-3.5 h-3.5 text-[#8CA6B7]" />}
                  </div>
                  <p className="text-xs text-[#6B8699] dark:text-[#8CA6B7] mt-0.5">
                    Comprehensive evaluation across all difficulty levels.
                  </p>
                </div>
                {isHardDone && !isMixedDone && (
                  <ArrowRight className="w-4 h-4 text-[#1F2D3D] dark:text-white" />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Skill Selector Modal (Explore & Assess Any Skill) */}
      <SkillSelectorModal
        isOpen={isSkillSelectorOpen}
        onClose={() => setIsSkillSelectorOpen(false)}
        onStartAssessment={handleStartQuiz}
        candidate={candidate}
        assessedScores={assessedScoresMap}
      />
    </div>
  );
};

export default AssessmentsPage;
