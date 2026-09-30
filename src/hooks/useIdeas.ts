import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ideaBoxService } from '../services/ideaBoxService';
import { IdeaBoxSubmission, IdeaComment, IdeaStatus, IdeaStage } from '../types';

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
