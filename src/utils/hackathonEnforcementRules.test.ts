import { describe, it, expect } from 'vitest';
import {
  validateTeamInvite,
  checkSubmissionDeadline,
  canJudgeScoreTeam,
  computeWeightedTotalScore,
  computeSkillOverlap,
} from './hackathonEnforcementRules';
import { HackathonCriterion } from '../types';

describe('Hackathon Enforcement & Auditing Business Rules', () => {

  describe('Team Invite Validation', () => {
    const futureDate = new Date(Date.now() + 24 * 3600 * 1000);
    const pastDate = new Date(Date.now() - 3600 * 1000);

    it('allows valid invite code within expiry and under max uses', () => {
      const res = validateTeamInvite({
        expiresAt: futureDate,
        usedCount: 1,
        maxUses: 4,
        currentTeamSize: 2,
        maxTeamSize: 4,
      });
      expect(res.valid).toBe(true);
    });

    it('rejects expired invite code', () => {
      const res = validateTeamInvite({
        expiresAt: pastDate,
        usedCount: 0,
        maxUses: 4,
        currentTeamSize: 2,
        maxTeamSize: 4,
      });
      expect(res.valid).toBe(false);
      expect(res.error).toContain('Invite code has expired');
    });

    it('rejects invite when maximum usage limit reached', () => {
      const res = validateTeamInvite({
        expiresAt: futureDate,
        usedCount: 4,
        maxUses: 4,
        currentTeamSize: 3,
        maxTeamSize: 4,
      });
      expect(res.valid).toBe(false);
      expect(res.error).toContain('usage limit reached');
    });

    it('rejects join when team is already at max size limit', () => {
      const res = validateTeamInvite({
        expiresAt: futureDate,
        usedCount: 1,
        maxUses: 4,
        currentTeamSize: 4,
        maxTeamSize: 4,
      });
      expect(res.valid).toBe(false);
      expect(res.error).toContain('Team is full');
    });
  });

  describe('Submission Deadline Gating', () => {
    it('allows submission strictly before deadline', () => {
      const futureDeadline = new Date(Date.now() + 10 * 3600 * 1000);
      const res = checkSubmissionDeadline(futureDeadline);
      expect(res.allowed).toBe(true);
    });

    it('blocks submission strictly past deadline', () => {
      const pastDeadline = new Date(Date.now() - 1000);
      const res = checkSubmissionDeadline(pastDeadline);
      expect(res.allowed).toBe(false);
      expect(res.error).toContain('deadline passed');
    });
  });

  describe('Judge Conflict of Interest Protection', () => {
    it('blocks scoring if judge has an active conflict of interest flag', () => {
      const res = canJudgeScoreTeam({
        judgeUserId: 'usr_judge_01',
        hasConflictFlag: true,
        teamMemberUserIds: ['usr_student_02', 'usr_student_03'],
      });
      expect(res.allowed).toBe(false);
      expect(res.error).toContain('conflict of interest flag');
    });

    it('blocks scoring if judge is a member of the team being scored', () => {
      const res = canJudgeScoreTeam({
        judgeUserId: 'usr_student_02',
        hasConflictFlag: false,
        teamMemberUserIds: ['usr_student_02', 'usr_student_03'],
      });
      expect(res.allowed).toBe(false);
      expect(res.error).toContain('cannot score their own hackathon team');
    });

    it('allows scoring when judge is neutral and has no conflicts', () => {
      const res = canJudgeScoreTeam({
        judgeUserId: 'usr_judge_external',
        hasConflictFlag: false,
        teamMemberUserIds: ['usr_student_02', 'usr_student_03'],
      });
      expect(res.allowed).toBe(true);
    });
  });

  describe('Weighted Score Calculation', () => {
    const criteria: HackathonCriterion[] = [
      { id: 'c1', name: 'Innovation', weight: 1.5 },
      { id: 'c2', name: 'Technical', weight: 1.5 },
      { id: 'c3', name: 'UI/UX', weight: 1.0 },
      { id: 'c4', name: 'Pitch', weight: 1.0 },
    ];

    it('computes weighted aggregate score accurately', () => {
      const scores = [
        { criterionId: 'c1', score: 8 }, // 8 * 1.5 = 12
        { criterionId: 'c2', score: 10 }, // 10 * 1.5 = 15
        { criterionId: 'c3', score: 7 },  // 7 * 1.0 = 7
        { criterionId: 'c4', score: 9 },  // 9 * 1.0 = 9
      ];
      // Total weighted: 12 + 15 + 7 + 9 = 43
      // Total weight: 1.5 + 1.5 + 1.0 + 1.0 = 5.0
      // 43 / 5.0 = 8.6
      const result = computeWeightedTotalScore(scores, criteria);
      expect(result).toBe(8.6);
    });
  });

  describe('Skill Overlap & Applicant Matching', () => {
    it('correctly ranks applicant skills against team needed roles', () => {
      const candidateSkills = ['React', 'TypeScript', 'PyTorch', 'ROS 2'];
      const needed = ['PyTorch', 'ROS 2', 'Embedded C'];

      const res = computeSkillOverlap(candidateSkills, needed);
      expect(res.overlapCount).toBe(2);
      expect(res.matchingSkills).toEqual(['PyTorch', 'ROS 2']);
    });
  });
});
