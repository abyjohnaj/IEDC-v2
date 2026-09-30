import { describe, it, expect } from 'vitest';
import {
  canTransitionIdeaStatus,
  getAllowedTransitions,
  validateIdeaTransition,
  ALLOWED_STATUS_TRANSITIONS,
} from './ideaTransitionRules';
import { IdeaStatus } from '../types';

describe('Idea Status Transition Rules State Machine', () => {
  describe('Standard Forward Progression', () => {
    it('allows Pending to transition to Under Review', () => {
      expect(canTransitionIdeaStatus('Pending', 'Under Review')).toBe(true);
      expect(validateIdeaTransition('Pending', 'Under Review').valid).toBe(true);
    });

    it('allows Under Review to transition to Shortlisted', () => {
      expect(canTransitionIdeaStatus('Under Review', 'Shortlisted')).toBe(true);
      expect(validateIdeaTransition('Under Review', 'Shortlisted').valid).toBe(true);
    });

    it('allows Shortlisted to transition to Incubation Approved', () => {
      expect(canTransitionIdeaStatus('Shortlisted', 'Incubation Approved')).toBe(true);
      expect(validateIdeaTransition('Shortlisted', 'Incubation Approved').valid).toBe(true);
    });

    it('allows Incubation Approved to transition to Mentorship Assigned', () => {
      expect(canTransitionIdeaStatus('Incubation Approved', 'Mentorship Assigned')).toBe(true);
      expect(validateIdeaTransition('Incubation Approved', 'Mentorship Assigned').valid).toBe(true);
    });
  });

  describe('Rejection Transitions', () => {
    const rejectableStatuses: IdeaStatus[] = [
      'Pending',
      'Under Review',
      'Needs Revision',
      'Shortlisted',
      'Incubation Approved',
      'Mentorship Assigned',
    ];

    rejectableStatuses.forEach((status) => {
      it(`allows ${status} to transition directly to Rejected`, () => {
        expect(canTransitionIdeaStatus(status, 'Rejected')).toBe(true);
        expect(validateIdeaTransition(status, 'Rejected').valid).toBe(true);
      });
    });
  });

  describe('Needs Revision & Resubmission Loops', () => {
    it('allows Under Review and Shortlisted to request revision', () => {
      expect(canTransitionIdeaStatus('Under Review', 'Needs Revision')).toBe(true);
      expect(canTransitionIdeaStatus('Shortlisted', 'Needs Revision')).toBe(true);
    });

    it('allows Needs Revision to resubmit back to Under Review or Pending', () => {
      expect(canTransitionIdeaStatus('Needs Revision', 'Under Review')).toBe(true);
      expect(canTransitionIdeaStatus('Needs Revision', 'Pending')).toBe(true);
    });
  });

  describe('Forbidden Transitions & Skipping Steps', () => {
    it('forbids jumping directly from Pending to Incubation Approved', () => {
      const res = validateIdeaTransition('Pending', 'Incubation Approved');
      expect(res.valid).toBe(false);
      expect(res.error).toContain('Cannot move idea from "Pending" to "Incubation Approved"');
    });

    it('forbids jumping directly from Pending to Shortlisted', () => {
      expect(canTransitionIdeaStatus('Pending', 'Shortlisted')).toBe(false);
    });

    it('forbids transitioning from Rejected (terminal state)', () => {
      expect(canTransitionIdeaStatus('Rejected', 'Under Review')).toBe(false);
      expect(canTransitionIdeaStatus('Rejected', 'Incubation Approved')).toBe(false);
      expect(canTransitionIdeaStatus('Rejected', 'Pending')).toBe(false);
      const res = validateIdeaTransition('Rejected', 'Pending');
      expect(res.valid).toBe(false);
    });

    it('forbids jumping from Under Review directly to Mentorship Assigned', () => {
      expect(canTransitionIdeaStatus('Under Review', 'Mentorship Assigned')).toBe(false);
    });
  });

  describe('Self Transitions & Helper Functions', () => {
    it('treats transition to identical status as valid no-op', () => {
      expect(canTransitionIdeaStatus('Under Review', 'Under Review')).toBe(true);
      expect(validateIdeaTransition('Shortlisted', 'Shortlisted').valid).toBe(true);
    });

    it('correctly returns allowed next transitions array', () => {
      expect(getAllowedTransitions('Pending')).toEqual(['Under Review', 'Rejected']);
      expect(getAllowedTransitions('Rejected')).toEqual([]);
    });
  });
});
