import type { Skill, SkillMatchResult } from '@/types';

/**
 * Normalizes skill strings for case-insensitive and punctuation-tolerant matching.
 */
function normalizeSkill(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[._\-/\\]/g, ' ')
    .replace(/\s+/g, ' ');
}

/**
 * Calculates candidate skill match against job required skills,
 * matching the TalentBay Candidate Mobile App algorithm.
 */
export function calculateJobSkillMatch(
  candidateSkills: Skill[] = [],
  requiredSkills: string[] = [],
  assessedScores?: Record<string, number>
): SkillMatchResult {
  if (!requiredSkills || requiredSkills.length === 0) {
    return {
      matchPercentage: 100,
      matchingSkills: [],
      missingSkills: [],
      totalRequired: 0,
      hasMatch: true,
    };
  }

  // 1. Build lookup dictionary from candidate skills
  const candidateSkillMap: Record<string, { level: string; score: number }> = {};

  candidateSkills.forEach((s) => {
    const key = normalizeSkill(s.name);
    let defaultScore = 80;
    if (s.level === 'Expert') defaultScore = 95;
    else if (s.level === 'Intermediate') defaultScore = 80;
    else if (s.level === 'Beginner') defaultScore = 65;

    candidateSkillMap[key] = {
      level: s.level,
      score: defaultScore,
    };
  });

  // 2. Incorporate assessed scores if available
  if (assessedScores) {
    Object.entries(assessedScores).forEach(([skill, score]) => {
      const key = normalizeSkill(skill);
      if (candidateSkillMap[key]) {
        candidateSkillMap[key].score = score;
      } else {
        candidateSkillMap[key] = {
          level: score >= 80 ? 'Expert' : score >= 60 ? 'Intermediate' : 'Beginner',
          score,
        };
      }
    });
  }

  // 3. Evaluate each required skill
  const matchingSkills: string[] = [];
  const missingSkills: string[] = [];
  let totalScore = 0;

  requiredSkills.forEach((req) => {
    const normReq = normalizeSkill(req);

    // Direct match or partial match (e.g. "React.js" vs "React")
    const matchedKey = Object.keys(candidateSkillMap).find(
      (cand) => cand === normReq || cand.includes(normReq) || normReq.includes(cand)
    );

    if (matchedKey) {
      matchingSkills.push(req);
      totalScore += candidateSkillMap[matchedKey].score;
    } else {
      missingSkills.push(req);
      totalScore += 0;
    }
  });

  const matchPercentage = Math.min(100, Math.round(totalScore / requiredSkills.length));

  return {
    matchPercentage,
    matchingSkills,
    missingSkills,
    totalRequired: requiredSkills.length,
    hasMatch: matchingSkills.length > 0,
  };
}
