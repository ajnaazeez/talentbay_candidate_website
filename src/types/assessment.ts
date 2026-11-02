export type ProficiencyLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

export type AssessmentDifficulty = 'Easy' | 'Medium' | 'Hard';

export interface AssessmentQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  skill: string;
  difficulty: AssessmentDifficulty;
}

export interface AssessmentResult {
  id: string;
  candidateId: string;
  skill: string;
  questions: AssessmentQuestion[];
  userAnswers: number[];
  score: number;
  totalQuestions: number;
  completedAt: string;
  proficiencyLevel: ProficiencyLevel;
  difficulty: AssessmentDifficulty;
}

export interface RoadmapStep {
  stepNumber: number;
  title: string;
  description: string;
  actionHeader: string;
  actionItems: string[];
}

export interface SkillToStrengthen {
  skill: string;
  score: number;
  guidance: string;
  roadmapSteps: RoadmapStep[];
}

export interface AICareerReadinessResponse {
  overallSummary: string;
  skillsToStrengthen: SkillToStrengthen[];
  jobMatchAdvice: string;
}

export interface CareerReadinessGuidance {
  overallScore: number;
  targetJobTitle?: string;
  overallSummary: string;
  jobMatchAdvice: string;
  skillsToStrengthen: SkillToStrengthen[];
  strengths: string[];
  skillGaps: Array<{
    skill: string;
    currentScore: number;
    requiredScore: number;
    priority: 'High' | 'Medium' | 'Low';
  }>;
  recommendedSteps: string[];
  interviewPreparationPlan: Array<{
    phase: string;
    description: string;
    timeline: string;
    actionItems?: string[];
  }>;
}

export interface SkillPerformanceMetric {
  skill: string;
  score: number;
  level: ProficiencyLevel;
  assessmentsCount: number;
  lastAssessedAt: string;
  isPrimary?: boolean;
}

export interface SkillPerformanceSummary {
  primarySkills: string[];
  secondarySkills: string[];
  skillScores: Record<string, number>;
  assessedProficiency: Record<string, ProficiencyLevel>;
  totalAssessments: number;
  averageScore: number;
  strongestSkills: SkillPerformanceMetric[];
  skillsRequiringImprovement: SkillPerformanceMetric[];
}
