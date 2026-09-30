import { IdeaStatus } from '../types';

/**
 * State machine defining valid idea status transitions.
 * Strictly mirrors the database RPC `public.set_idea_status`.
 */
export const ALLOWED_STATUS_TRANSITIONS: Record<IdeaStatus, readonly IdeaStatus[]> = {
  'Pending': ['Under Review', 'Rejected'],
  'Under Review': ['Shortlisted', 'Needs Revision', 'Rejected'],
  'Needs Revision': ['Under Review', 'Pending', 'Rejected'],
  'Shortlisted': ['Incubation Approved', 'Needs Revision', 'Rejected'],
  'Incubation Approved': ['Mentorship Assigned', 'Rejected'],
  'Mentorship Assigned': ['Incubation Approved', 'Rejected'],
  'Rejected': [] // Terminal state
};

/**
 * Determines whether transitioning from currentStatus to targetStatus is permitted.
 */
export function canTransitionIdeaStatus(
  currentStatus: IdeaStatus,
  targetStatus: IdeaStatus
): boolean {
  if (currentStatus === targetStatus) {
    return true; // No-op is valid
  }
  const allowed = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];
  return allowed.includes(targetStatus);
}

/**
 * Retrieves the list of valid next statuses for a given status.
 */
export function getAllowedTransitions(currentStatus: IdeaStatus): readonly IdeaStatus[] {
  return ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];
}

/**
 * Validates a transition and returns an error explanation if invalid.
 */
export function validateIdeaTransition(
  currentStatus: IdeaStatus,
  targetStatus: IdeaStatus
): { valid: boolean; error?: string } {
  if (currentStatus === targetStatus) {
    return { valid: true };
  }

  const allowed = ALLOWED_STATUS_TRANSITIONS[currentStatus];
  if (!allowed || !allowed.includes(targetStatus)) {
    return {
      valid: false,
      error: `Invalid transition: Cannot move idea from "${currentStatus}" to "${targetStatus}". Allowed next states: [${(allowed || []).join(', ')}]`,
    };
  }

  return { valid: true };
}
