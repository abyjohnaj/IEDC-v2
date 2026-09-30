import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ideaBoxService } from '../services/ideaBoxService';
import { 
  IdeaBoxSubmission, 
  IdeaComment, 
  IdeaStatus, 
  IdeaStage,
  ReviewCriterion,
  IdeaReview,
  IdeaAggregateScore,
  IdeaMilestone,
  Mentor,
  MentorAssignment,
  IdeaDraftData
} from '../types';

export interface IdeaFilters {
  domain?: string;
  stage?: string;
  status?: string;
  searchQuery?: string;
}

export const IDEAS_QUERY_KEY = ['ideas'] as const;

/**
 * Hook to fetch ideas from Supabase with optional filters
 */
export function useIdeas(filters?: IdeaFilters) {
  return useQuery<IdeaBoxSubmission[], Error>({
    queryKey: [...IDEAS_QUERY_KEY, filters],
    queryFn: () => ideaBoxService.getAllIdeas(filters),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Hook to fetch a single idea by ID
 */
export function useIdea(id?: string) {
  return useQuery<IdeaBoxSubmission | null, Error>({
    queryKey: ['idea', id],
    queryFn: () => (id ? ideaBoxService.getIdeaById(id) : null),
    enabled: Boolean(id),
  });
}

/**
 * Mutation to submit a new idea with cache invalidation
 */
export function useSubmitIdea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newIdea: Omit<IdeaBoxSubmission, 'id' | 'upvotes' | 'upvoters' | 'commentsCount' | 'comments' | 'status' | 'createdAt'>) =>
      ideaBoxService.submitIdea(newIdea),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: IDEAS_QUERY_KEY });
    },
  });
}

/**
 * Mutation to upvote an idea with OPTIMISTIC UPDATES
 */
export function useVoteIdea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ideaId, userId }: { ideaId: string; userId: string }) =>
      ideaBoxService.toggleUpvote(ideaId, userId),

    onMutate: async ({ ideaId, userId }) => {
      // 1. Cancel ongoing queries to avoid overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey: IDEAS_QUERY_KEY });

      // 2. Snapshot previous cache entries
      const previousQueries = queryClient.getQueriesData<IdeaBoxSubmission[]>({ queryKey: IDEAS_QUERY_KEY });

      // 3. Optimistically update all matching ideas cache lists
      queryClient.setQueriesData<IdeaBoxSubmission[]>({ queryKey: IDEAS_QUERY_KEY }, (oldData) => {
        if (!oldData) return [];
        return oldData.map((idea) => {
          if (idea.id === ideaId) {
            const hasVoted = idea.upvoters?.includes(userId) ?? false;
            const newUpvotes = hasVoted ? Math.max(0, idea.upvotes - 1) : idea.upvotes + 1;
            const newUpvoters = hasVoted
              ? idea.upvoters.filter((id) => id !== userId)
              : [...(idea.upvoters || []), userId];

            return {
              ...idea,
              upvotes: newUpvotes,
              upvoters: newUpvoters,
            };
          }
          return idea;
        });
      });

      return { previousQueries };
    },

    onError: (_err, _vars, context) => {
      // Rollback to snapshot on error
      if (context?.previousQueries) {
        context.previousQueries.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
    },

    onSettled: () => {
      // Always resync with the server
      queryClient.invalidateQueries({ queryKey: IDEAS_QUERY_KEY });
    },
  });
}

/**
 * Mutation to add a comment to an idea
 */
export function useAddIdeaComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ideaId, comment }: { ideaId: string; comment: Omit<IdeaComment, 'id' | 'createdAt'> }) =>
      ideaBoxService.addComment(ideaId, comment),
    onSuccess: (_data, { ideaId }) => {
      queryClient.invalidateQueries({ queryKey: IDEAS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['idea', ideaId] });
    },
  });
}

/**
 * Mutation for administrative jury evaluation
 */
export function useEvaluateIdea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      ideaId,
      review,
    }: {
      ideaId: string;
      review: {
        status: IdeaStatus;
        rating: number;
        feedback: string;
        reviewerName: string;
        incubatorTrack?: string;
      };
    }) => ideaBoxService.adminReviewIdea(ideaId, review),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: IDEAS_QUERY_KEY });
    },
  });
}

/**
 * Mutation to delete an idea
 */
export function useDeleteIdea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ideaId: string) => ideaBoxService.deleteIdea(ideaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: IDEAS_QUERY_KEY });
    },
  });
}

/**
 * Hook to fetch rubric review criteria
 */
export function useReviewCriteria() {
  return useQuery<ReviewCriterion[], Error>({
    queryKey: ['review-criteria'],
    queryFn: () => ideaBoxService.getReviewCriteria(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Hook to fetch all assigned reviews & rubric scores for an idea
 */
export function useIdeaReviews(ideaId?: string) {
  return useQuery<IdeaReview[], Error>({
    queryKey: ['idea-reviews', ideaId],
    queryFn: () => (ideaId ? ideaBoxService.getIdeaReviews(ideaId) : Promise.resolve([])),
    enabled: Boolean(ideaId),
  });
}

/**
 * Hook to fetch weighted aggregate score for an idea
 */
export function useIdeaAggregateScore(ideaId?: string) {
  return useQuery<IdeaAggregateScore | null, Error>({
    queryKey: ['idea-aggregate-score', ideaId],
    queryFn: () => (ideaId ? ideaBoxService.getIdeaAggregateScore(ideaId) : Promise.resolve(null)),
    enabled: Boolean(ideaId),
  });
}

/**
 * Mutation to assign multiple reviewers to an idea
 */
export function useAssignReviewers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ideaId, reviewerIds }: { ideaId: string; reviewerIds: string[] }) =>
      ideaBoxService.assignReviewers(ideaId, reviewerIds),
    onSuccess: (_data, { ideaId }) => {
      queryClient.invalidateQueries({ queryKey: ['idea-reviews', ideaId] });
      queryClient.invalidateQueries({ queryKey: IDEAS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['idea', ideaId] });
    },
  });
}

/**
 * Mutation to submit a completed rubric review evaluation
 */
export function useSubmitIdeaReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      reviewId,
      ideaId,
      overallFeedback,
      scores,
    }: {
      reviewId: string;
      ideaId: string;
      overallFeedback: string;
      scores: { criterion_id: string; score: number; comment?: string }[];
    }) => ideaBoxService.submitIdeaReview(reviewId, overallFeedback, scores),
    onSuccess: (_data, { ideaId }) => {
      queryClient.invalidateQueries({ queryKey: ['idea-reviews', ideaId] });
      queryClient.invalidateQueries({ queryKey: ['idea-aggregate-score', ideaId] });
      queryClient.invalidateQueries({ queryKey: IDEAS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['idea', ideaId] });
    },
  });
}

/**
 * Mutation to transition idea status via RPC set_idea_status
 */
export function useSetIdeaStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ideaId, status, reason }: { ideaId: string; status: IdeaStatus; reason?: string }) =>
      ideaBoxService.setIdeaStatus(ideaId, status, reason),
    onSuccess: (_data, { ideaId }) => {
      queryClient.invalidateQueries({ queryKey: IDEAS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['idea', ideaId] });
    },
  });
}

/**
 * Hook to fetch idea milestones
 */
export function useIdeaMilestones(ideaId?: string) {
  return useQuery<IdeaMilestone[], Error>({
    queryKey: ['idea-milestones', ideaId],
    queryFn: () => (ideaId ? ideaBoxService.getIdeaMilestones(ideaId) : Promise.resolve([])),
    enabled: Boolean(ideaId),
  });
}

/**
 * Mutation to create a new milestone
 */
export function useCreateIdeaMilestone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (milestone: Omit<IdeaMilestone, 'id' | 'createdAt'>) =>
      ideaBoxService.createIdeaMilestone(milestone),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['idea-milestones', data.ideaId] });
    },
  });
}

/**
 * Mutation to update milestone status/details
 */
export function useUpdateIdeaMilestone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      milestoneId,
      ideaId,
      updates,
    }: {
      milestoneId: string;
      ideaId: string;
      updates: Partial<Pick<IdeaMilestone, 'status' | 'completedAt' | 'title' | 'description' | 'fundingTranche'>>;
    }) => ideaBoxService.updateIdeaMilestone(milestoneId, updates),
    onSuccess: (_data, { ideaId }) => {
      queryClient.invalidateQueries({ queryKey: ['idea-milestones', ideaId] });
    },
  });
}

/**
 * Hook to fetch all active mentors
 */
export function useMentors() {
  return useQuery<Mentor[], Error>({
    queryKey: ['mentors'],
    queryFn: () => ideaBoxService.getMentors(),
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook to fetch mentor assignments for an idea
 */
export function useIdeaMentorAssignments(ideaId?: string) {
  return useQuery<MentorAssignment[], Error>({
    queryKey: ['mentor-assignments', ideaId],
    queryFn: () => (ideaId ? ideaBoxService.getIdeaMentorAssignments(ideaId) : Promise.resolve([])),
    enabled: Boolean(ideaId),
  });
}

/**
 * Mutation to assign a mentor to an idea
 */
export function useAssignMentor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ideaId, mentorId }: { ideaId: string; mentorId: string }) =>
      ideaBoxService.assignMentor(ideaId, mentorId),
    onSuccess: (_data, { ideaId }) => {
      queryClient.invalidateQueries({ queryKey: ['mentor-assignments', ideaId] });
      queryClient.invalidateQueries({ queryKey: IDEAS_QUERY_KEY });
    },
  });
}

/**
 * Mutation for mentor to accept or decline assignment
 */
export function useRespondMentorAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      assignmentId,
      decision,
      notes,
    }: {
      assignmentId: string;
      ideaId: string;
      decision: 'accepted' | 'declined';
      notes?: string;
    }) => ideaBoxService.respondMentorAssignment(assignmentId, decision, notes),
    onSuccess: (_data, { ideaId }) => {
      queryClient.invalidateQueries({ queryKey: ['mentor-assignments', ideaId] });
      queryClient.invalidateQueries({ queryKey: IDEAS_QUERY_KEY });
    },
  });
}

/**
 * Hook to fetch current user's autosaved idea draft
 */
export function useIdeaDraft() {
  return useQuery<IdeaDraftData | null, Error>({
    queryKey: ['idea-draft'],
    queryFn: () => ideaBoxService.getIdeaDraft(),
    staleTime: 0,
  });
}

/**
 * Mutation to autosave draft
 */
export function useSaveIdeaDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (draftData: IdeaDraftData) => ideaBoxService.saveIdeaDraft(draftData),
    onSuccess: (_data, draftData) => {
      queryClient.setQueryData(['idea-draft'], draftData);
    },
  });
}

/**
 * Mutation to delete draft
 */
export function useDeleteIdeaDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => ideaBoxService.deleteIdeaDraft(),
    onSuccess: () => {
      queryClient.setQueryData(['idea-draft'], null);
    },
  });
}

