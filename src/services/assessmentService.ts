import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '@/lib/firebase';
import { COLLECTIONS } from '@/utils/constants';
import type {
  AssessmentDifficulty,
  AssessmentQuestion,
  AssessmentResult,
  CareerReadinessGuidance,
  ProficiencyLevel,
  SkillPerformanceMetric,
  SkillPerformanceSummary,
  AICareerReadinessResponse,
} from '@/types/assessment';
import type { CandidateModel } from '@/types/candidate';
import { candidateService } from './candidateService';

export function calculateProficiencyLevel(percentage: number): ProficiencyLevel {
  if (percentage >= 90) return 'Expert';
  if (percentage >= 75) return 'Advanced';
  if (percentage >= 60) return 'Intermediate';
  return 'Beginner';
}

export const POPULAR_ASSESSMENT_SKILLS = [
  'React',
  'TypeScript',
  'JavaScript',
  'Node.js',
  'Python',
  'SQL',
  'HTML/CSS',
  'Flutter',
  'Java',
  'AWS',
  'Docker',
  'Git',
  'GraphQL',
  'Tailwind CSS',
  'Next.js',
  'MongoDB',
  'PostgreSQL',
  'Data Structures & Algorithms',
  'REST APIs',
  'System Design',
];

export const assessmentService = {
  /**
   * Generates MCQ questions for a skill using existing Firebase Cloud Function `generateAssessmentQuestions`.
   */
  async generateQuestions(
    skill: string,
    difficulty: AssessmentDifficulty = 'Medium',
    count: number = 10
  ): Promise<AssessmentQuestion[]> {
    const trimmedSkill = skill.trim();
    if (!trimmedSkill) {
      throw new Error('Skill name is required to generate questions.');
    }

    try {
      const callable = httpsCallable<
        { skill: string; difficulty: string; count: number },
        { questions?: AssessmentQuestion[] }
      >(functions, 'generateAssessmentQuestions');

      const response = await callable({
        skill: trimmedSkill,
        difficulty,
        count: Math.min(Math.max(count, 5), 15),
      });

      const questions = response.data?.questions;
      if (Array.isArray(questions) && questions.length > 0) {
        return questions.map((q, idx) => ({
          id: q.id || `${trimmedSkill.toLowerCase()}_q_${idx}_${Date.now()}`,
          question: q.question,
          options: q.options || [],
          correctAnswerIndex: typeof q.correctAnswerIndex === 'number' ? q.correctAnswerIndex : 0,
          skill: trimmedSkill,
          difficulty: q.difficulty || difficulty,
        }));
      }

      throw new Error('No assessment questions returned from AI service.');
    } catch (err: any) {
      console.error('[assessmentService] generateAssessmentQuestions error:', err);
      const msg = err?.message || '';
      if (msg.includes('daily usage limit') || msg.includes('quota') || msg.includes('resource-exhausted')) {
        throw new Error('The AI assessment service daily quota has been reached. Please try again later.');
      }
      if (msg.includes('subscription or free trial') || msg.includes('permission-denied')) {
        throw new Error('An active subscription or free trial is required to generate AI skill assessments.');
      }
      if (msg.includes('high demand') || msg.includes('unavailable')) {
        throw new Error('AI assessment engine is currently experiencing high demand. Please try again in a few moments.');
      }
      throw new Error('Failed to generate assessment questions. Please try again.');
    }
  },

  /**
   * Suggests related skills based on current candidate skills via `getRelatedSkills` Cloud Function.
   */
  async getRelatedSkills(currentSkills: string[]): Promise<string[]> {
    if (!currentSkills || currentSkills.length === 0) return [];

    try {
      const callable = httpsCallable<
        { currentSkills: string[] },
        { relatedSkills?: string[] }
      >(functions, 'getRelatedSkills');

      const response = await callable({ currentSkills });
      const rawRelated = response.data?.relatedSkills;

      if (Array.isArray(rawRelated)) {
        const lowerCurrent = new Set(currentSkills.map((s) => s.toLowerCase().trim()));
        const related = rawRelated
          .map((s) => String(s).trim())
          .filter((s) => s.length > 0 && !lowerCurrent.has(s.toLowerCase()));

        return related.slice(0, 5);
      }
      return [];
    } catch (e) {
      console.warn('[assessmentService] getRelatedSkills error:', e);
      return [];
    }
  },

  /**
   * Saves an assessment result to the `assessmentResults` collection and syncs to candidate profile.
   */
  async saveAssessmentResult(params: {
    candidateId: string;
    skill: string;
    questions: AssessmentQuestion[];
    userAnswers: number[];
    score: number;
    totalQuestions: number;
    difficulty: AssessmentDifficulty;
  }): Promise<AssessmentResult> {
    const { candidateId, skill, questions, userAnswers, score, totalQuestions, difficulty } = params;

    if (!candidateId) throw new Error('Candidate ID is required to save assessment.');
    if (!skill) throw new Error('Skill name is required to save assessment.');

    const percentage = Math.round((score / Math.max(totalQuestions, 1)) * 100);
    const proficiencyLevel = calculateProficiencyLevel(percentage);
    const completedAt = new Date().toISOString();

    // Check if an assessment for this skill AND difficulty already exists, and clean it up
    try {
      const existingQuery = query(
        collection(db, COLLECTIONS.ASSESSMENT_RESULTS),
        where('candidateId', '==', candidateId),
        where('skill', '==', skill.trim()),
        where('difficulty', '==', difficulty)
      );
      const existingDocs = await getDocs(existingQuery);
      if (!existingDocs.empty) {
        const batch = writeBatch(db);
        existingDocs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
    } catch (cleanErr) {
      console.warn('[assessmentService] cleanup existing assessment error:', cleanErr);
    }

    const resultDocRef = doc(collection(db, COLLECTIONS.ASSESSMENT_RESULTS));
    const resultId = resultDocRef.id;

    const assessmentResult: AssessmentResult = {
      id: resultId,
      candidateId,
      skill: skill.trim(),
      questions,
      userAnswers,
      score,
      totalQuestions,
      completedAt,
      proficiencyLevel,
      difficulty,
    };

    // 1. Write to assessmentResults collection
    await setDoc(resultDocRef, assessmentResult);

    // 2. Synchronize proficiency to candidate profile
    try {
      const candidate = await candidateService.getCandidate(candidateId);
      if (candidate) {
        const currentSkills = Array.isArray(candidate.skills) ? [...candidate.skills] : [];
        const normSkill = skill.trim().toLowerCase();
        const existingIdx = currentSkills.findIndex(
          (s) => s.name.trim().toLowerCase() === normSkill
        );

        if (existingIdx >= 0) {
          currentSkills[existingIdx] = {
            ...currentSkills[existingIdx],
            level: proficiencyLevel,
          };
        } else {
          currentSkills.push({
            name: skill.trim(),
            level: proficiencyLevel,
            type: 'Technical',
          });
        }

        await candidateService.updateCandidate(candidateId, { skills: currentSkills });
      }
    } catch (syncErr) {
      console.warn('[assessmentService] Error updating candidate skills profile:', syncErr);
    }

    return assessmentResult;
  },

  /**
   * Fetches all assessment results for a candidate, sorted latest first.
   */
  async getCandidateAssessments(candidateId: string): Promise<AssessmentResult[]> {
    if (!candidateId) return [];

    try {
      const q = query(
        collection(db, COLLECTIONS.ASSESSMENT_RESULTS),
        where('candidateId', '==', candidateId)
      );

      const snapshot = await getDocs(q);
      const list: AssessmentResult[] = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          candidateId: data.candidateId,
          skill: data.skill || '',
          questions: Array.isArray(data.questions) ? data.questions : [],
          userAnswers: Array.isArray(data.userAnswers) ? data.userAnswers : [],
          score: typeof data.score === 'number' ? data.score : 0,
          totalQuestions: typeof data.totalQuestions === 'number' ? data.totalQuestions : (data.questions?.length || 1),
          completedAt: typeof data.completedAt === 'string' ? data.completedAt : new Date().toISOString(),
          proficiencyLevel: data.proficiencyLevel || calculateProficiencyLevel(
            Math.round(((data.score || 0) / Math.max(data.totalQuestions || data.questions?.length || 1, 1)) * 100)
          ),
          difficulty: data.difficulty || 'Medium',
        });
      });

      // Sort latest first
      list.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

      return list;
    } catch (err) {
      console.error('[assessmentService] getCandidateAssessments error:', err);
      return [];
    }
  },

  /**
   * Extracts the latest score percentage for each assessed skill.
   */
  extractLatestSkillScores(results: AssessmentResult[]): Record<string, number> {
    const scores: Record<string, number> = {};
    const sorted = [...results].sort(
      (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    );

    for (const res of sorted) {
      const key = res.skill.trim();
      if (key && !(key in scores)) {
        const pct = Math.round((res.score / Math.max(res.totalQuestions, 1)) * 100);
        scores[key] = pct;
      }
    }

    return scores;
  },

  /**
   * Builds complete Skill Performance Summary for candidate without fake scores.
   */
  calculateSkillPerformanceSummary(
    candidate: CandidateModel | null,
    results: AssessmentResult[]
  ): SkillPerformanceSummary {
    const skillScores = this.extractLatestSkillScores(results);
    const assessedProficiency: Record<string, ProficiencyLevel> = {};
    const skillMetricsMap: Record<string, { count: number; latestDate: string }> = {};

    results.forEach((r) => {
      const key = r.skill.trim();
      if (!skillMetricsMap[key]) {
        skillMetricsMap[key] = { count: 0, latestDate: r.completedAt };
      }
      skillMetricsMap[key].count += 1;
      if (new Date(r.completedAt).getTime() > new Date(skillMetricsMap[key].latestDate).getTime()) {
        skillMetricsMap[key].latestDate = r.completedAt;
      }
    });

    Object.entries(skillScores).forEach(([skill, score]) => {
      assessedProficiency[skill] = calculateProficiencyLevel(score);
    });

    const candidateSkills = Array.isArray(candidate?.skills) ? candidate.skills : [];
    const primarySkills = candidateSkills
      .filter((s) => s.type === 'Primary' || s.type === 'Technical' || s.level === 'Expert' || s.level === 'Advanced')
      .map((s) => s.name)
      .slice(0, 6);

    const secondarySkills = candidateSkills
      .filter((s) => !primarySkills.includes(s.name))
      .map((s) => s.name);

    // Create metrics list
    const allMetrics: SkillPerformanceMetric[] = Object.entries(skillScores).map(([skill, score]) => {
      const isPrimary = primarySkills.some((p) => p.toLowerCase() === skill.toLowerCase());
      return {
        skill,
        score,
        level: assessedProficiency[skill] || 'Beginner',
        assessmentsCount: skillMetricsMap[skill]?.count || 1,
        lastAssessedAt: skillMetricsMap[skill]?.latestDate || new Date().toISOString(),
        isPrimary,
      };
    });

    // Sort strongest (highest score) and needing improvement (< 70)
    const strongestSkills = allMetrics
      .filter((m) => m.score >= 70)
      .sort((a, b) => b.score - a.score);

    const skillsRequiringImprovement = allMetrics
      .filter((m) => m.score < 70)
      .sort((a, b) => a.score - b.score);

    const totalScores = Object.values(skillScores);
    const averageScore = totalScores.length > 0
      ? Math.round(totalScores.reduce((acc, curr) => acc + curr, 0) / totalScores.length)
      : 0;

    return {
      primarySkills,
      secondarySkills,
      skillScores,
      assessedProficiency,
      totalAssessments: results.length,
      averageScore,
      strongestSkills,
      skillsRequiringImprovement,
    };
  },

  /**
   * Fetches AI Career Readiness Guidance via `getCareerReadinessGuidance` Cloud Function.
   */
  async getCareerReadiness(params: {
    skillScores: Record<string, number>;
    targetJobTitle?: string;
    targetJobSkills?: string[];
    forceRefresh?: boolean;
  }): Promise<CareerReadinessGuidance> {
    const { skillScores, targetJobTitle, targetJobSkills = [], forceRefresh = false } = params;

    try {
      const callable = httpsCallable<
        {
          skillScores: Record<string, number>;
          targetJobTitle?: string;
          targetJobSkills?: string[];
          forceRefresh?: boolean;
        },
        AICareerReadinessResponse
      >(functions, 'getCareerReadinessGuidance');

      const response = await callable({
        skillScores,
        targetJobTitle: targetJobTitle || '',
        targetJobSkills,
        forceRefresh,
      });

      const data = response.data;
      if (!data) {
        throw new Error('Empty response from AI Career Readiness guidance service.');
      }

      // Compute readiness overall score based on assessed skills & target job
      const scores = Object.values(skillScores);
      const avgScore = scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;

      // Extract strengths: skills with >= 75%
      const strengths = Object.entries(skillScores)
        .filter(([_, score]) => score >= 70)
        .map(([skill]) => skill);

      if (strengths.length === 0 && scores.length > 0) {
        strengths.push(...Object.keys(skillScores).slice(0, 2));
      }

      // Compute skill gaps against target job skills
      const skillGaps = targetJobSkills.map((reqSkill) => {
        const normReq = reqSkill.toLowerCase().trim();
        const foundKey = Object.keys(skillScores).find(
          (k) => k.toLowerCase().trim() === normReq || k.toLowerCase().includes(normReq)
        );
        const current = foundKey ? skillScores[foundKey] : 0;
        const required = 75;
        const priority: 'High' | 'Medium' | 'Low' = current < 50 ? 'High' : current < 75 ? 'Medium' : 'Low';
        return {
          skill: reqSkill,
          currentScore: current,
          requiredScore: required,
          priority,
        };
      });

      // Recommended steps from AI roadmap
      const recommendedSteps: string[] = [];
      data.skillsToStrengthen?.forEach((s) => {
        s.roadmapSteps?.forEach((step) => {
          if (step.actionItems && step.actionItems.length > 0) {
            recommendedSteps.push(`${s.skill}: ${step.actionItems[0]}`);
          }
        });
      });

      const interviewPrep = [
        {
          phase: 'Phase 1: Core Fundamentals',
          description: `Deepen your foundational mastery in ${strengths.slice(0, 2).join(' and ') || 'primary technical skills'}.`,
          timeline: 'Week 1 - 2',
          actionItems: [
            'Review syntax, runtime lifecycle, and standard design patterns.',
            'Solve 15-20 live coding challenges on data structures and algorithms.',
          ],
        },
        {
          phase: 'Phase 2: Architectural & System Design',
          description: 'Focus on high-level architecture, state handling, and scalability scenarios.',
          timeline: 'Week 3 - 4',
          actionItems: [
            'Design scalable microservices or modular frontend architectures.',
            'Practice explaining trade-offs between latency, caching, and database consistency.',
          ],
        },
        {
          phase: 'Phase 3: Behavioral & Mock Interviews',
          description: 'Align past experiences with the STAR methodology and simulate technical rounds.',
          timeline: 'Week 5',
          actionItems: [
            'Prepare 4-5 impact stories covering technical leadership, conflict resolution, and deadline delivery.',
            'Conduct timed mock interviews with peers or mentors.',
          ],
        },
      ];

      return {
        overallScore: avgScore,
        targetJobTitle,
        overallSummary: data.overallSummary || 'Solid foundation with key opportunities for career advancement.',
        jobMatchAdvice: data.jobMatchAdvice || '',
        skillsToStrengthen: Array.isArray(data.skillsToStrengthen) ? data.skillsToStrengthen : [],
        strengths,
        skillGaps,
        recommendedSteps: recommendedSteps.slice(0, 6),
        interviewPreparationPlan: interviewPrep,
      };
    } catch (err: any) {
      console.warn('[assessmentService] getCareerReadiness notice:', err);

      // Graceful fallback calculation if AI function fails or times out
      const scores = Object.values(skillScores);
      const avgScore = scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;

      const strengths = Object.entries(skillScores)
        .filter(([_, score]) => score >= 70)
        .map(([skill]) => skill);

      const skillGaps = targetJobSkills.map((reqSkill) => {
        const normReq = reqSkill.toLowerCase().trim();
        const foundKey = Object.keys(skillScores).find(
          (k) => k.toLowerCase().trim() === normReq || k.toLowerCase().includes(normReq)
        );
        const current = foundKey ? skillScores[foundKey] : 0;
        return {
          skill: reqSkill,
          currentScore: current,
          requiredScore: 75,
          priority: (current < 50 ? 'High' : current < 75 ? 'Medium' : 'Low') as 'High' | 'Medium' | 'Low',
        };
      });

      return {
        overallScore: avgScore,
        targetJobTitle,
        overallSummary:
          scores.length > 0
            ? `You have assessed ${scores.length} skills with an average score of ${avgScore}%. Focused preparation on weaker areas will significantly boost your interview outcomes.`
            : 'Complete your first skill assessment to unlock personalized career readiness guidance and learning roadmaps.',
        jobMatchAdvice:
          targetJobTitle
            ? `To qualify for ${targetJobTitle}, ensure all core required competencies meet at least Intermediate (60%+) or Advanced (75%+) proficiency.`
            : 'Explore active jobs and add target roles to receive customized match guidance.',
        skillsToStrengthen: Object.entries(skillScores)
          .filter(([_, score]) => score < 75)
          .map(([skill, score]) => ({
            skill,
            score,
            guidance: `Focus on mastering key paradigms and hands-on coding patterns in ${skill}.`,
            roadmapSteps: [
              {
                stepNumber: 1,
                title: 'Review Core Concepts',
                description: `Solidify basic principles and commonly tested syntax in ${skill}.`,
                actionHeader: 'LEARN',
                actionItems: [`Study documentation and core mechanics of ${skill}`],
              },
              {
                stepNumber: 2,
                title: 'Practical Hands-on Projects',
                description: 'Build real-world components or endpoints using best practices.',
                actionHeader: 'DO',
                actionItems: [`Create a portfolio project incorporating ${skill}`],
              },
            ],
          })),
        strengths,
        skillGaps,
        recommendedSteps: [
          'Take skill assessments for unassessed required competencies',
          'Build end-to-end projects demonstrating your technical stack',
          'Prepare for technical questions using real-world architectural scenarios',
        ],
        interviewPreparationPlan: [
          {
            phase: 'Phase 1: Fundamentals Refinement',
            description: 'Refine core principles and technical vocabulary.',
            timeline: 'Week 1',
            actionItems: ['Practice coding challenges and review API documentation.'],
          },
          {
            phase: 'Phase 2: Project Architecture',
            description: 'Learn to articulate high-level design choices and trade-offs.',
            timeline: 'Week 2',
            actionItems: ['Document architectural decisions for your top projects.'],
          },
        ],
      };
    }
  },
};
