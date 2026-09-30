import { HackathonCriterion } from '../types';

/**
 * Validates a team invite code against expiration, maximum usage, and team size limits.
 */
export function validateTeamInvite(params: {
  expiresAt: string | Date;
  usedCount: number;
  maxUses: number;
  currentTeamSize: number;
  maxTeamSize: number;
  now?: Date;
}): { valid: boolean; error?: string } {
  const currentTime = params.now ? params.now.getTime() : Date.now();
  const expiryTime = new Date(params.expiresAt).getTime();

  if (currentTime > expiryTime) {
    return { valid: false, error: 'Invite code has expired.' };
  }

  if (params.usedCount >= params.maxUses) {
    return { valid: false, error: 'Invite code maximum usage limit reached.' };
  }

  if (params.currentTeamSize >= params.maxTeamSize) {
    return { valid: false, error: `Team is full (maximum ${params.maxTeamSize} members allowed).` };
  }

  return { valid: true };
}

/**
 * Checks whether a project submission attempt is strictly before or past the event deadline.
 */
export function checkSubmissionDeadline(
  deadline: string | Date | null | undefined,
  now: Date = new Date()
): { allowed: boolean; error?: string } {
  if (!deadline) {
    return { allowed: true };
  }

  const deadlineTime = new Date(deadline).getTime();
  if (now.getTime() > deadlineTime) {
    return {
      allowed: false,
      error: `Submission deadline passed on ${new Date(deadline).toISOString()}. Submissions are strictly locked.`,
    };
  }

  return { allowed: true };
}

/**
 * Checks for conflict of interest before a judge evaluates a hackathon team.
 */
export function canJudgeScoreTeam(params: {
  judgeUserId: string;
  hasConflictFlag: boolean;
  teamMemberUserIds: string[];
}): { allowed: boolean; error?: string } {
  if (params.hasConflictFlag) {
    return {
      allowed: false,
      error: 'Scoring blocked: Judge has an active conflict of interest flag.',
    };
  }

  if (params.teamMemberUserIds.includes(params.judgeUserId)) {
    return {
      allowed: false,
      error: 'Conflict of Interest: A judge cannot score their own hackathon team.',
    };
  }

  return { allowed: true };
}

/**
 * Computes weighted total scores for judging criteria.
 */
export function computeWeightedTotalScore(
  scores: Array<{ criterionId: string; score: number }>,
  criteria: HackathonCriterion[]
): number {
  if (scores.length === 0 || criteria.length === 0) return 0;

  const criteriaMap = new Map<string, number>(criteria.map((c) => [c.id, Number(c.weight)]));

  let totalWeightedScore = 0;
  let totalWeight = 0;

  scores.forEach(({ criterionId, score }) => {
    const weight = criteriaMap.get(criterionId) ?? 1.0;
    totalWeightedScore += score * weight;
    totalWeight += weight;
  });

  return totalWeight > 0 ? Number((totalWeightedScore / totalWeight).toFixed(2)) : 0;
}

/**
 * Computes candidate skill overlap against team needed roles or skills.
 */
export function computeSkillOverlap(
  candidateSkills: string[],
  neededRolesOrSkills: string[]
): { overlapCount: number; matchingSkills: string[] } {
  const neededSet = new Set(neededRolesOrSkills.map((s) => s.toLowerCase().trim()));
  const matches = candidateSkills.filter((skill) => neededSet.has(skill.toLowerCase().trim()));

  return {
    overlapCount: matches.length,
    matchingSkills: matches,
  };
}
