import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hackathonService } from '../services/hackathonService';
import {
  HackathonEvent,
  HackathonTeam,
  TeamChatMessage,
  ProjectSubmission,
  TeamInvite,
  HackathonCriterion,
  HackathonJudge,
  HackathonLeaderboardRow,
  TeamMatchSuggestion
} from '../types';

export const HACKATHONS_QUERY_KEY = ['hackathons'] as const;
export const TEAMS_QUERY_KEY = ['teams'] as const;
export const LEADERBOARD_QUERY_KEY = ['hackathon-leaderboard'] as const;

/**
 * Hook to fetch all hackathons
 */
export function useHackathons() {
  return useQuery<HackathonEvent[], Error>({
    queryKey: HACKATHONS_QUERY_KEY,
    queryFn: () => hackathonService.getHackathons(),
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook to fetch teams for an event
 */
export function useTeams(hackathonId?: string) {
  return useQuery<HackathonTeam[], Error>({
    queryKey: [...TEAMS_QUERY_KEY, hackathonId],
    queryFn: () => hackathonService.getAllTeams(hackathonId),
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Hook to fetch single team
 */
export function useTeam(teamId?: string) {
  return useQuery<HackathonTeam | null, Error>({
    queryKey: ['team', teamId],
    queryFn: () => (teamId ? hackathonService.getTeamById(teamId) : Promise.resolve(null)),
    enabled: Boolean(teamId),
  });
}

/**
 * Mutation to generate team invite
 */
export function useCreateTeamInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      teamId,
      hoursValid = 48,
      maxUses = 4,
    }: {
      teamId: string;
      hoursValid?: number;
      maxUses?: number;
    }) => hackathonService.createTeamInvite(teamId, hoursValid, maxUses),
    onSuccess: (_data, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: ['team', teamId] });
    },
  });
}

/**
 * Mutation to join team with invite code
 */
export function useJoinTeamWithInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ code, roleInTeam }: { code: string; roleInTeam?: string }) =>
      hackathonService.joinTeamWithInvite(code, roleInTeam),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['team', data.team_id] });
      queryClient.invalidateQueries({ queryKey: TEAMS_QUERY_KEY });
    },
  });
}

/**
 * Mutation to submit project with deadline check and snapshot
 */
export function useSubmitProjectWithDeadline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      teamId,
      submission,
    }: {
      teamId: string;
      submission: ProjectSubmission & { commitSha?: string };
    }) => hackathonService.submitProjectWithDeadlineCheck(teamId, submission),
    onSuccess: (_data, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: ['team', teamId] });
      queryClient.invalidateQueries({ queryKey: TEAMS_QUERY_KEY });
    },
  });
}

/**
 * Hook to fetch official hackathon leaderboard (restricted to admins until published)
 */
export function useHackathonLeaderboard(hackathonId?: string) {
  return useQuery<HackathonLeaderboardRow[], Error>({
    queryKey: [...LEADERBOARD_QUERY_KEY, hackathonId],
    queryFn: () => (hackathonId ? hackathonService.getLeaderboard(hackathonId) : Promise.resolve([])),
    enabled: Boolean(hackathonId),
    retry: false, // Don't retry if permission is denied / confidential
  });
}

/**
 * Hook to fetch judging criteria
 */
export function useJudgingCriteria() {
  return useQuery<HackathonCriterion[], Error>({
    queryKey: ['hackathon-criteria'],
    queryFn: () => hackathonService.getJudgingCriteria(),
    staleTime: 1000 * 60 * 10,
  });
}

/**
 * Hook to fetch judges
 */
export function useJudges() {
  return useQuery<HackathonJudge[], Error>({
    queryKey: ['judges'],
    queryFn: () => hackathonService.getJudges(),
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Mutation to submit judge score (conflict of interest blocked)
 */
export function useSubmitJudgeScore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      teamId,
      judgeId,
      criterionId,
      score,
      feedback,
    }: {
      teamId: string;
      judgeId: string;
      criterionId: string;
      score: number;
      feedback?: string;
    }) => hackathonService.submitJudgeScore(teamId, judgeId, criterionId, score, feedback),
    onSuccess: (_data, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: ['team', teamId] });
      queryClient.invalidateQueries({ queryKey: LEADERBOARD_QUERY_KEY });
    },
  });
}

/**
 * Hook to fetch skill match suggestions for team recruitment
 */
export function useSkillMatchSuggestions(teamId?: string) {
  return useQuery<TeamMatchSuggestion[], Error>({
    queryKey: ['team-skill-matches', teamId],
    queryFn: () => (teamId ? hackathonService.getSkillMatchSuggestions(teamId) : Promise.resolve([])),
    enabled: Boolean(teamId),
  });
}

/**
 * Optimistic Team Chat Hook
 */
export function useSendTeamMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teamId, message }: { teamId: string; message: Omit<TeamChatMessage, 'id' | 'timestamp'> }) =>
      Promise.resolve(hackathonService.sendTeamChatMessage(teamId, message)),
    onMutate: async ({ teamId, message }) => {
      await queryClient.cancelQueries({ queryKey: ['team-chat', teamId] });
      const previousMessages = queryClient.getQueryData<TeamChatMessage[]>(['team-chat', teamId]) || [];

      const optimisticMsg: TeamChatMessage = {
        ...message,
        id: `optimistic_${Date.now()}`,
        timestamp: new Date().toISOString(),
      };

      queryClient.setQueryData<TeamChatMessage[]>(['team-chat', teamId], (old = []) => [...old, optimisticMsg]);
      return { previousMessages };
    },
    onError: (_err, { teamId }, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(['team-chat', teamId], context.previousMessages);
      }
    },
    onSettled: (_data, _err, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: ['team-chat', teamId] });
    },
  });
}
