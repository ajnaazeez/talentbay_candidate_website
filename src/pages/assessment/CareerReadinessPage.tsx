import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Target,
  Sparkles,
  CheckCircle2,
  BookOpen,
  Calendar,
  Briefcase,
  RotateCw,
  Zap,
  Layers,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { candidateService } from '@/services/candidateService';
import { assessmentService } from '@/services/assessmentService';
import { jobService } from '@/services/jobService';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ROUTES } from '@/utils/constants';
import type { CareerReadinessGuidance, AssessmentResult } from '@/types/assessment';
import type { CandidateModel } from '@/types/candidate';
import type { Job } from '@/types/job';

export const CareerReadinessPage: React.FC = () => {
  const { user, candidate: authCandidate, initialLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlJobId = searchParams.get('jobId');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [candidate, setCandidate] = useState<CandidateModel | null>(authCandidate || null);
  const [assessmentResults, setAssessmentResults] = useState<AssessmentResult[]>([]);
  const [availableJobs, setAvailableJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>(urlJobId || 'custom');
  const [customJobTitle, setCustomJobTitle] = useState<string>('');

  const [guidance, setGuidance] = useState<CareerReadinessGuidance | null>(null);

  // Load candidate profile, assessments & active jobs
  const loadInitialData = useCallback(async () => {
    if (!user?.uid) {
      if (!initialLoading) setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [candData, resultsData, jobsData] = await Promise.all([
        candidateService.getCandidate(user.uid),
        assessmentService.getCandidateAssessments(user.uid),
        jobService.getJobs(),
      ]);

      const activeCandidate = candData || authCandidate || null;
      setCandidate(activeCandidate);
      setAssessmentResults(resultsData);
      setAvailableJobs(jobsData);

      // Default target job role
      let targetTitle = activeCandidate?.jobPreference?.role || activeCandidate?.designation || activeCandidate?.bio || 'Software Engineer';
      let targetSkills = activeCandidate?.skills?.map((s) => s.name).slice(0, 5) || [];

      // If opened through Job Details PREPARE action, fetch the specific target job
      if (urlJobId) {
        let matchingJob = jobsData.find((j) => j.id === urlJobId || j.jobId === urlJobId);
        if (!matchingJob) {
          try {
            matchingJob = (await jobService.getJobById(urlJobId)) || undefined;
          } catch (jobErr) {
            console.warn('[CareerReadiness] Error fetching direct job by ID:', jobErr);
          }
        }

        if (matchingJob) {
          setSelectedJobId(matchingJob.id || matchingJob.jobId);
          targetTitle = matchingJob.roleName || matchingJob.title || targetTitle;
          targetSkills = [
            ...(matchingJob.skillsRequired || []),
            ...(matchingJob.mustHaveSkills || []),
          ];
        }
      }

      setCustomJobTitle(targetTitle);

      const latestScores = assessmentService.extractLatestSkillScores(resultsData);

      // Generate Career Readiness guidance
      const res = await assessmentService.getCareerReadiness({
        skillScores: latestScores,
        targetJobTitle: targetTitle,
        targetJobSkills: targetSkills,
        forceRefresh: false,
      });

      setGuidance(res);
    } catch (err: any) {
      console.error('Error loading career readiness:', err);
      setError('Unable to load Career Readiness analysis. Please try refreshing.');
    } finally {
      setLoading(false);
    }
  }, [user?.uid, urlJobId, initialLoading, authCandidate]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Handle changing target job
  const handleJobChange = async (jobId: string) => {
    setSelectedJobId(jobId);
    if (!user?.uid) return;

    try {
      setRefreshing(true);
      setError(null);

      let targetTitle = customJobTitle;
      let targetSkills: string[] = [];

      if (jobId !== 'custom') {
        const found = availableJobs.find((j) => (j.id || j.jobId) === jobId);
        if (found) {
          targetTitle = found.roleName || found.title || targetTitle;
          targetSkills = [
            ...(found.skillsRequired || []),
            ...(found.mustHaveSkills || []),
          ];
        }
      } else {
        targetSkills = candidate?.skills?.map((s) => s.name).slice(0, 5) || [];
      }

      const latestScores = assessmentService.extractLatestSkillScores(assessmentResults);

      const res = await assessmentService.getCareerReadiness({
        skillScores: latestScores,
        targetJobTitle: targetTitle,
        targetJobSkills: targetSkills,
        forceRefresh: true,
      });

      setGuidance(res);
    } catch (err: any) {
      console.error('Error switching target job:', err);
      setError('Failed to recalculate guidance for this position.');
    } finally {
      setRefreshing(false);
    }
  };

  // Force Refresh AI guidance
  const handleForceRefresh = async () => {
    if (!user?.uid) return;
    try {
      setRefreshing(true);
      setError(null);

      let targetTitle = customJobTitle;
      let targetSkills: string[] = [];

      if (selectedJobId !== 'custom') {
        const found = availableJobs.find((j) => (j.id || j.jobId) === selectedJobId);
        if (found) {
          targetTitle = found.roleName || found.title || targetTitle;
          targetSkills = [
            ...(found.skillsRequired || []),
            ...(found.mustHaveSkills || []),
          ];
        }
      } else {
        targetSkills = candidate?.skills?.map((s) => s.name).slice(0, 5) || [];
      }

      const latestScores = assessmentService.extractLatestSkillScores(assessmentResults);

      const res = await assessmentService.getCareerReadiness({
        skillScores: latestScores,
        targetJobTitle: targetTitle,
        targetJobSkills: targetSkills,
        forceRefresh: true,
      });

      setGuidance(res);
    } catch (err: any) {
      console.error('Error refreshing guidance:', err);
      setError('Failed to refresh AI analysis.');
    } finally {
      setRefreshing(false);
    }
  };

  if (initialLoading || (loading && !guidance)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" label="Analyzing Career Readiness & Diagnostics..." />
      </div>
    );
  }

  const readinessScore = guidance?.overallScore ?? 0;
  const latestScores = assessmentService.extractLatestSkillScores(assessmentResults);

  return (
    <div className="max-w-5xl mx-auto w-full min-w-0 space-y-8 pb-20 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F2D3D] dark:text-white tracking-tight flex items-center gap-3">
            <Target className="w-8 h-8 text-[#00BFA6]" />
            Career Readiness & Diagnostics
          </h1>
          <p className="text-xs sm:text-sm font-medium text-[#6B8699] dark:text-[#8CA6B7] mt-1">
            Real performance analysis, skill gap diagnostics, and interview roadmaps backed by your verified scores.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <Button
            variant="secondary"
            onClick={handleForceRefresh}
            isLoading={refreshing}
            leftIcon={<RotateCw className="w-4 h-4 text-[#00BFA6]" />}
          >
            Refresh Guidance
          </Button>
          <Button
            variant="primary"
            onClick={() => navigate(ROUTES.ASSESSMENTS)}
            leftIcon={<Zap className="w-4 h-4" />}
          >
            Take Skill Assessment
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-xs uppercase font-bold underline hover:text-rose-900 dark:hover:text-rose-100 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Target Job Role Selector Card */}
      <div className="bg-white dark:bg-[#0E2233] p-6 rounded-2xl border border-[#D8E4EA] dark:border-[#1F2D3D] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#00BFA6]/15 text-[#00BFA6] flex items-center justify-center font-bold">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#1F2D3D] dark:text-white">
              Target Position for Analysis
            </h2>
            <p className="text-xs text-[#6B8699] dark:text-[#8CA6B7]">
              Select an open job or analyze against your preferred target role
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <select
            value={selectedJobId}
            onChange={(e) => handleJobChange(e.target.value)}
            disabled={refreshing}
            className="px-3.5 py-2.5 rounded-xl bg-[#E8F1F5] dark:bg-[#0A1A27] border border-[#D8E4EA] dark:border-[#1F2D3D] text-xs sm:text-sm font-medium text-[#1F2D3D] dark:text-[#E8F1F5] focus:outline-none focus:ring-2 focus:ring-[#00BFA6]/20 cursor-pointer"
          >
            <option value="custom">General Profile: {customJobTitle || 'Software Engineer'}</option>
            {availableJobs.map((j) => (
              <option key={j.id || j.jobId} value={j.id || j.jobId}>
                {j.roleName || j.title || 'Job Opening'} ({j.companyName})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Hero Readiness Overview Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score Dial Card */}
        <div className="bg-white dark:bg-[#0E2233] p-6 rounded-2xl border border-[#D8E4EA] dark:border-[#1F2D3D] shadow-xs flex flex-col items-center justify-center text-center space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-[#6B8699] dark:text-[#8CA6B7]">
            Overall Career Readiness Score
          </span>

          <div className="relative w-36 h-36 flex items-center justify-center">
            {/* SVG Progress Circle */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="50"
                className="stroke-[#D8E4EA] dark:stroke-[#132B3E]"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="60"
                cy="60"
                r="50"
                className="stroke-[#00BFA6] transition-all duration-1000 ease-out"
                strokeWidth="10"
                strokeDasharray={314.159}
                strokeDashoffset={314.159 - (314.159 * readinessScore) / 100}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold text-[#1F2D3D] dark:text-white">
                {readinessScore}%
              </span>
              <span className="text-[10px] uppercase font-bold text-[#6B8699] dark:text-[#8CA6B7]">Readiness</span>
            </div>
          </div>

          <Badge
            variant={readinessScore >= 75 ? 'success' : readinessScore >= 60 ? 'brand' : 'default'}
            size="md"
          >
            {readinessScore >= 85
              ? 'Job Ready'
              : readinessScore >= 70
              ? 'Strong Competency'
              : readinessScore >= 50
              ? 'Developing'
              : 'Early Stage'}
          </Badge>

          <p className="text-xs text-[#6B8699] dark:text-[#8CA6B7] max-w-xs">
            Calculated across {Object.keys(latestScores).length} assessed skills using genuine candidate performance data
          </p>
        </div>

        {/* AI Guidance Summary & Strengths Card */}
        <div className="lg:col-span-2 bg-white dark:bg-[#0E2233] p-6 rounded-2xl border border-[#D8E4EA] dark:border-[#1F2D3D] shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#00BFA6]" />
              <h3 className="font-bold text-[#1F2D3D] dark:text-white text-base">
                AI Career Assessment Summary
              </h3>
            </div>
            <p className="text-sm text-[#1F2D3D] dark:text-[#BACDD8] leading-relaxed bg-[#E8F1F5]/80 dark:bg-[#0A1A27] p-4 rounded-xl border border-[#D8E4EA] dark:border-[#1F2D3D]">
              {guidance?.overallSummary || 'Complete technical assessments to unlock detailed career guidance.'}
            </p>
          </div>

          {/* Strengths Showcase */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#6B8699] dark:text-[#8CA6B7] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Key Technical Strengths
            </span>
            <div className="flex flex-wrap gap-2">
              {guidance?.strengths && guidance.strengths.length > 0 ? (
                guidance.strengths.map((str) => (
                  <span
                    key={str}
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    {str}
                  </span>
                ))
              ) : (
                <span className="text-xs text-[#8CA6B7]">
                  Assess skills at 70%+ to showcase verified strengths.
                </span>
              )}
            </div>
          </div>

          {/* Target Job Advice */}
          {guidance?.jobMatchAdvice && (
            <div className="pt-2 text-xs text-[#6B8699] dark:text-[#8CA6B7] border-t border-[#D8E4EA] dark:border-[#1F2D3D]">
              <strong>Role Focus:</strong> {guidance.jobMatchAdvice}
            </div>
          )}
        </div>
      </div>

      {/* AI SKILL GAP DIAGNOSTICS */}
      <div className="bg-white dark:bg-[#0E2233] p-6 rounded-2xl border border-[#D8E4EA] dark:border-[#1F2D3D] shadow-xs space-y-6">
        <div>
          <h3 className="text-lg font-bold text-[#1F2D3D] dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#00BFA6]" />
            AI Skill Gap Diagnostics
          </h3>
          <p className="text-xs sm:text-sm text-[#6B8699] dark:text-[#8CA6B7]">
            Comparing your assessed capabilities against requirements for your target role
          </p>
        </div>

        {guidance?.skillGaps && guidance.skillGaps.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {guidance.skillGaps.map((gap) => {
              const isAssessed = gap.currentScore > 0;
              const hasMetRequirement = gap.currentScore >= gap.requiredScore;

              return (
                <div
                  key={gap.skill}
                  className="p-4 rounded-xl border border-[#D8E4EA] dark:border-[#1F2D3D] bg-[#E8F1F5]/50 dark:bg-[#0A1A27]/50 flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-sm text-[#1F2D3D] dark:text-white">
                        {gap.skill}
                      </span>
                      <Badge
                        variant={gap.priority === 'High' ? 'danger' : gap.priority === 'Medium' ? 'brand' : 'default'}
                        size="sm"
                      >
                        {gap.priority} Priority
                      </Badge>
                    </div>

                    <div className="text-xs text-[#6B8699] dark:text-[#8CA6B7] flex items-center justify-between pt-1">
                      <span>Current: <strong>{isAssessed ? `${gap.currentScore}%` : 'Unassessed'}</strong></span>
                      <span>Target: <strong>{gap.requiredScore}%</strong></span>
                    </div>

                    <div className="bg-[#D8E4EA] dark:bg-[#132B3E] h-2 rounded-full overflow-hidden mt-1">
                      <div
                        className={`h-full rounded-full transition-all ${
                          hasMetRequirement ? 'bg-emerald-500' : 'bg-[#00BFA6]'
                        }`}
                        style={{ width: `${Math.min(100, gap.currentScore)}%` }}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate(`${ROUTES.ASSESSMENTS}?skill=${encodeURIComponent(gap.skill)}`)}
                    className="w-full py-2 px-3 rounded-lg border border-[#D8E4EA] dark:border-[#1F2D3D] hover:border-[#00BFA6] text-[#1F2D3D] dark:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer hover:bg-[#E8F1F5] dark:hover:bg-[#132B3E]"
                  >
                    <Zap className="w-3.5 h-3.5 text-[#00BFA6]" />
                    <span>{isAssessed ? 'Retake Test' : 'Take Assessment'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-[#6B8699] dark:text-[#8CA6B7] py-4 text-center">
            No specific skill gaps detected for this selection. Select another job to analyze different requirements.
          </p>
        )}
      </div>

      {/* PERSONALIZED LEARNING ROADMAP */}
      <div className="bg-white dark:bg-[#0E2233] p-6 rounded-2xl border border-[#D8E4EA] dark:border-[#1F2D3D] shadow-xs space-y-6">
        <div>
          <h3 className="text-lg font-bold text-[#1F2D3D] dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#00BFA6]" />
            Personalized Learning Roadmap
          </h3>
          <p className="text-xs sm:text-sm text-[#6B8699] dark:text-[#8CA6B7]">
            Actionable step-by-step roadmap to eliminate skill gaps and prepare for technical interviews
          </p>
        </div>

        {guidance?.skillsToStrengthen && guidance.skillsToStrengthen.length > 0 ? (
          <div className="space-y-6">
            {guidance.skillsToStrengthen.map((skillItem) => (
              <div
                key={skillItem.skill}
                className="p-5 rounded-2xl border border-[#D8E4EA] dark:border-[#1F2D3D] bg-[#E8F1F5]/30 dark:bg-[#0A1A27]/30 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-[#1F2D3D] dark:text-white text-base">
                      {skillItem.skill}
                    </h4>
                    <p className="text-xs text-[#6B8699] dark:text-[#8CA6B7] mt-0.5">
                      {skillItem.guidance}
                    </p>
                  </div>
                  <Badge variant="brand" size="sm">
                    Current: {skillItem.score}%
                  </Badge>
                </div>

                {/* Steps Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                  {skillItem.roadmapSteps.map((step) => (
                    <div
                      key={step.stepNumber}
                      className="bg-white dark:bg-[#0E2233] p-4 rounded-xl border border-[#D8E4EA] dark:border-[#1F2D3D] space-y-2 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#00BFA6] bg-[#00BFA6]/15 px-2 py-0.5 rounded">
                            Step {step.stepNumber}
                          </span>
                          <span className="text-[10px] font-bold text-[#6B8699] dark:text-[#8CA6B7]">
                            {step.actionHeader}
                          </span>
                        </div>
                        <h5 className="font-bold text-xs text-[#1F2D3D] dark:text-white">
                          {step.title}
                        </h5>
                        <p className="text-[11px] text-[#6B8699] dark:text-[#8CA6B7] mt-1">
                          {step.description}
                        </p>
                      </div>

                      <ul className="space-y-1 pt-2 border-t border-[#D8E4EA] dark:border-[#1F2D3D] mt-2">
                        {step.actionItems?.map((item, idx) => (
                          <li
                            key={idx}
                            className="text-[10px] text-[#1F2D3D] dark:text-[#BACDD8] flex items-start gap-1"
                          >
                            <span className="text-[#00BFA6] shrink-0">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#6B8699] dark:text-[#8CA6B7] py-4 text-center">
            No specific weak areas detected. You are in good standing across your evaluated skills!
          </p>
        )}
      </div>

      {/* INTERVIEW PREPARATION PLAN */}
      <div className="bg-white dark:bg-[#0E2233] p-6 rounded-2xl border border-[#D8E4EA] dark:border-[#1F2D3D] shadow-xs space-y-6">
        <div>
          <h3 className="text-lg font-bold text-[#1F2D3D] dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#00BFA6]" />
            Interview Preparation Plan
          </h3>
          <p className="text-xs sm:text-sm text-[#6B8699] dark:text-[#8CA6B7]">
            Structured milestone framework to ace candidate screening and technical rounds
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {guidance?.interviewPreparationPlan?.map((plan, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl border border-[#D8E4EA] dark:border-[#1F2D3D] bg-white dark:bg-[#0E2233] space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#00BFA6] bg-[#00BFA6]/15 px-2.5 py-1 rounded-lg">
                  {plan.timeline}
                </span>
                <span className="text-xs text-[#6B8699] dark:text-[#8CA6B7] font-semibold">Phase {idx + 1}</span>
              </div>

              <div>
                <h4 className="font-bold text-sm text-[#1F2D3D] dark:text-white">
                  {plan.phase}
                </h4>
                <p className="text-xs text-[#6B8699] dark:text-[#8CA6B7] mt-1">
                  {plan.description}
                </p>
              </div>

              {plan.actionItems && plan.actionItems.length > 0 && (
                <ul className="space-y-1.5 pt-2 border-t border-[#D8E4EA] dark:border-[#1F2D3D]">
                  {plan.actionItems.map((act, aIdx) => (
                    <li
                      key={aIdx}
                      className="text-xs text-[#1F2D3D] dark:text-[#BACDD8] flex items-start gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#00BFA6] shrink-0 mt-0.5" />
                      <span>{act}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CareerReadinessPage;
