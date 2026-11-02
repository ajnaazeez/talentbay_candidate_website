import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  GraduationCap,
  Sparkles,
  Plus,
  Search,
  Zap,
  RotateCcw,
  BookOpen,
  Award,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { candidateService } from '@/services/candidateService';
import { assessmentService, POPULAR_ASSESSMENT_SKILLS } from '@/services/assessmentService';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { SkillSelectorModal } from '@/components/assessment/SkillSelectorModal';
import { AssessmentQuiz } from '@/components/assessment/AssessmentQuiz';
import { AssessmentResultSummary } from '@/components/assessment/AssessmentResultSummary';
import { SkillPerformanceDashboard } from '@/components/assessment/SkillPerformanceDashboard';
import type {
  AssessmentDifficulty,
  AssessmentQuestion,
  AssessmentResult,
  SkillPerformanceSummary,
} from '@/types/assessment';
import type { CandidateModel } from '@/types/candidate';

type PageViewMode = 'dashboard' | 'quiz' | 'result';

export const AssessmentsPage: React.FC = () => {
  const { user } = useAuth();
  const { skill: routeSkill } = useParams<{ skill?: string }>();
  const [searchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState<'browse' | 'performance'>('browse');
  const [candidate, setCandidate] = useState<CandidateModel | null>(null);
  const [assessmentResults, setAssessmentResults] = useState<AssessmentResult[]>([]);
  const [performanceSummary, setPerformanceSummary] = useState<SkillPerformanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal & Quiz runner states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<PageViewMode>('dashboard');
  const [currentSkill, setCurrentSkill] = useState('');
  const [currentDifficulty, setCurrentDifficulty] = useState<AssessmentDifficulty>('Medium');
  const [quizQuestions, setQuizQuestions] = useState<AssessmentQuestion[]>([]);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [latestResult, setLatestResult] = useState<AssessmentResult | null>(null);

  // Search filter for available skills
  const [searchQuery, setSearchQuery] = useState('');

  // Load candidate profile & assessments
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

      const summary = assessmentService.calculateSkillPerformanceSummary(candData, resultsData);
      setPerformanceSummary(summary);
    } catch (err: any) {
      console.error('Error loading assessments data:', err);
      setError('Unable to load assessment records. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle route param or query param /assessments/:skill
  useEffect(() => {
    const targetSkill = routeSkill || searchParams.get('skill');
    if (targetSkill && viewMode === 'dashboard') {
      setCurrentSkill(decodeURIComponent(targetSkill));
      setIsModalOpen(true);
    }
  }, [routeSkill, searchParams, viewMode]);

  // Start assessment handler
  const handleStartAssessment = async (skillToTest: string, diff: AssessmentDifficulty = 'Medium') => {
    if (!user?.uid) return;
    try {
      setGeneratingQuestions(true);
      setError(null);
      setCurrentSkill(skillToTest);
      setCurrentDifficulty(diff);

      const questions = await assessmentService.generateQuestions(skillToTest, diff, 10);
      setQuizQuestions(questions);
      setIsModalOpen(false);
      setViewMode('quiz');
    } catch (err: any) {
      setError(err?.message || 'Failed to generate assessment questions. Please try again.');
    } finally {
      setGeneratingQuestions(false);
    }
  };

  // Submit assessment handler
  const handleSubmitQuiz = async (userAnswers: number[]) => {
    if (!user?.uid) return;
    try {
      // Calculate score
      let score = 0;
      quizQuestions.forEach((q, idx) => {
        if (userAnswers[idx] === q.correctAnswerIndex) {
          score += 1;
        }
      });

      const savedResult = await assessmentService.saveAssessmentResult({
        candidateId: user.uid,
        skill: currentSkill,
        questions: quizQuestions,
        userAnswers,
        score,
        totalQuestions: quizQuestions.length,
        difficulty: currentDifficulty,
      });

      setLatestResult(savedResult);
      setViewMode('result');
      // Refresh background data
      loadData();
    } catch (err: any) {
      console.error('Error submitting assessment:', err);
      setError(err?.message || 'Failed to save assessment results.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" label="Loading Skill Assessments..." />
      </div>
    );
  }

  // Render Active Quiz
  if (viewMode === 'quiz' && quizQuestions.length > 0) {
    return (
      <div className="py-6">
        <AssessmentQuiz
          skill={currentSkill}
          difficulty={currentDifficulty}
          questions={quizQuestions}
          onSubmit={handleSubmitQuiz}
          onCancel={() => setViewMode('dashboard')}
        />
      </div>
    );
  }

  // Render Result Summary
  if (viewMode === 'result' && latestResult) {
    return (
      <div className="py-6">
        <AssessmentResultSummary
          result={latestResult}
          onRetake={() => handleStartAssessment(latestResult.skill, latestResult.difficulty)}
        />
      </div>
    );
  }

  const candidateSkills = Array.isArray(candidate?.skills) ? candidate.skills : [];
  const latestScores = performanceSummary?.skillScores || {};

  // Skills filtered by search
  const filteredCandidateSkills = candidateSkills.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const availablePopularSkills = POPULAR_ASSESSMENT_SKILLS.filter(
    (s) =>
      s.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !candidateSkills.some((cs) => cs.name.toLowerCase() === s.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-brand-600 dark:text-brand-400" />
            AI Skill Assessments
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Validate your technical proficiency with AI-evaluated tests and showcase verified badges to recruiters
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Take New Assessment
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-xs underline hover:text-rose-800 dark:hover:text-rose-200"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-[#1f293d]">
        <button
          onClick={() => setActiveTab('browse')}
          className={`pb-3.5 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'browse'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Available Skills ({candidateSkills.length + POPULAR_ASSESSMENT_SKILLS.length})
        </button>
        <button
          onClick={() => setActiveTab('performance')}
          className={`pb-3.5 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'performance'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Award className="w-4 h-4" />
          Skill Performance & History ({assessmentResults.length})
        </button>
      </div>

      {/* TAB 1: BROWSE AVAILABLE SKILLS */}
      {activeTab === 'browse' && (
        <div className="space-y-8">
          {/* Search bar */}
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search skills to assess..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#1f293d] text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all placeholder:text-slate-400 shadow-sm"
            />
          </div>

          {/* Section: Your Profile Skills */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                  Skills from Your Profile
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Assess and verify the skills listed on your candidate profile
                </p>
              </div>
            </div>

            {filteredCandidateSkills.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCandidateSkills.map((skill) => {
                  const score = latestScores[skill.name.trim()];
                  const isAssessed = typeof score === 'number';

                  return (
                    <div
                      key={skill.name}
                      className="bg-white dark:bg-[#111827] p-5 rounded-2xl border border-slate-200 dark:border-[#1f293d] shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                            {skill.name}
                          </h3>
                          {isAssessed ? (
                            <Badge variant={score >= 75 ? 'success' : score >= 60 ? 'warning' : 'danger'} size="sm">
                              {score}%
                            </Badge>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium">Unverified</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {skill.type || 'Technical'} • Profile level: {skill.level || 'Intermediate'}
                        </p>
                      </div>

                      <div className="pt-5 border-t border-slate-100 dark:border-[#1f293d] mt-4 flex items-center justify-between">
                        <span className="text-xs text-slate-400">10 MCQ questions</span>
                        <Button
                          variant={isAssessed ? 'secondary' : 'primary'}
                          size="sm"
                          onClick={() => {
                            setCurrentSkill(skill.name);
                            setIsModalOpen(true);
                          }}
                          leftIcon={isAssessed ? <RotateCcw className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
                        >
                          {isAssessed ? 'Retake' : 'Start Assessment'}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={<BookOpen className="w-8 h-8 text-slate-400" />}
                title="No profile skills matched"
                description="Try another search term or explore in-demand skills below."
              />
            )}
          </div>

          {/* Section: In-Demand Tech Skills */}
          <div className="space-y-4 pt-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Popular Technical Skills
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Take assessments in high-demand technologies to boost your employer profile
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {availablePopularSkills.map((skill) => {
                const score = latestScores[skill.trim()];
                const isAssessed = typeof score === 'number';

                return (
                  <div
                    key={skill}
                    className="bg-white dark:bg-[#111827] p-5 rounded-2xl border border-slate-200 dark:border-[#1f293d] shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                          {skill}
                        </h3>
                        {isAssessed && (
                          <Badge variant="default" size="sm">
                            {score}%
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        In-demand competency requested by top recruiters
                      </p>
                    </div>

                    <div className="pt-5 border-t border-slate-100 dark:border-[#1f293d] mt-4 flex items-center justify-between">
                      <span className="text-xs text-slate-400">10 Questions • Timed</span>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setCurrentSkill(skill);
                          setIsModalOpen(true);
                        }}
                        leftIcon={<Zap className="w-3.5 h-3.5" />}
                      >
                        Assess Skill
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SKILL PERFORMANCE & HISTORY DASHBOARD */}
      {activeTab === 'performance' && performanceSummary && (
        <SkillPerformanceDashboard
          summary={performanceSummary}
          results={assessmentResults}
          onStartAssessment={(s) => {
            setCurrentSkill(s);
            setIsModalOpen(true);
          }}
        />
      )}

      {/* Skill Selector Modal */}
      <SkillSelectorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onStartAssessment={handleStartAssessment}
        candidate={candidate}
        assessedScores={latestScores}
        loading={generatingQuestions}
      />
    </div>
  );
};
