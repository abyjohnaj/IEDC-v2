import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { notificationService } from '../services/notificationService';
import {
  AppNotification,
  NotificationPreference,
  NotificationChannel,
  NotificationCategory,
  SendNotificationPayload
} from '../types';

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (userId?: string) => ['notifications', 'list', userId] as const,
  unreadCount: (userId?: string) => ['notifications', 'unread', userId] as const,
  preferences: (userId?: string) => ['notifications', 'preferences', userId] as const,
};

/**
 * Fetch all notifications for user with realtime sync
 */
export function useNotifications(userId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    // Subscribe to realtime postgres updates
    const unsub = notificationService.subscribeRealtime(userId, newNotif => {
      // Prepend newly received notification optimistically
      queryClient.setQueryData<AppNotification[]>(notificationKeys.list(userId), old => {
        if (!old) return [newNotif];
        if (old.some(n => n.id === newNotif.id)) return old;
        return [newNotif, ...old];
      });
      // Invalidate unread counter
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount(userId) });
    });

    return () => unsub();
  }, [userId, queryClient]);

  return useQuery({
    queryKey: notificationKeys.list(userId),
    queryFn: () => (userId ? notificationService.fetchNotifications(userId) : Promise.resolve([])),
    enabled: !!userId,
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch count of unread notifications
 */
export function useUnreadNotificationsCount(userId?: string) {
  return useQuery({
    queryKey: notificationKeys.unreadCount(userId),
    queryFn: () => (userId ? notificationService.getUnreadCount(userId) : Promise.resolve(0)),
    enabled: !!userId,
    refetchInterval: 60 * 1000,
  });
}

/**
 * Mark a single notification as read with optimistic update
 */
export function useMarkNotificationRead(userId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ notificationId }: { notificationId: string }) => {
      if (!userId) throw new Error('User not logged in');
      return notificationService.markAsRead(userId, notificationId);
    },
    onMutate: async ({ notificationId }) => {
      if (!userId) return;
      await queryClient.cancelQueries({ queryKey: notificationKeys.list(userId) });
      const previous = queryClient.getQueryData<AppNotification[]>(notificationKeys.list(userId));

      if (previous) {
        queryClient.setQueryData<AppNotification[]>(
          notificationKeys.list(userId),
          previous.map(n => (n.id === notificationId ? { ...n, readAt: new Date().toISOString() } : n))
        );
      }

      // Optimistically decrement count
      queryClient.setQueryData<number>(notificationKeys.unreadCount(userId), old => Math.max(0, (old || 1) - 1));

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous && userId) {
        queryClient.setQueryData(notificationKeys.list(userId), context.previous);
      }
    },
    onSettled: () => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: notificationKeys.list(userId) });
        queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount(userId) });
      }
    },
  });
}

/**
 * Mark all notifications as read
 */
export function useMarkAllNotificationsRead(userId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      if (!userId) throw new Error('User not logged in');
      return notificationService.markAllAsRead(userId);
    },
    onMutate: async () => {
      if (!userId) return;
      await queryClient.cancelQueries({ queryKey: notificationKeys.list(userId) });
      const previous = queryClient.getQueryData<AppNotification[]>(notificationKeys.list(userId));

      if (previous) {
        queryClient.setQueryData<AppNotification[]>(
          notificationKeys.list(userId),
          previous.map(n => ({ ...n, readAt: n.readAt || new Date().toISOString() }))
        );
      }

      queryClient.setQueryData<number>(notificationKeys.unreadCount(userId), 0);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous && userId) {
        queryClient.setQueryData(notificationKeys.list(userId), context.previous);
      }
    },
    onSettled: () => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: notificationKeys.list(userId) });
        queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount(userId) });
      }
    },
  });
}

/**
 * Fetch notification preferences
 */
export function useNotificationPreferences(userId?: string) {
  return useQuery({
    queryKey: notificationKeys.preferences(userId),
    queryFn: () => (userId ? notificationService.fetchPreferences(userId) : Promise.resolve([])),
    enabled: !!userId,
  });
}

/**
 * Update a notification preference
 */
export function useUpdateNotificationPreference(userId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      channel,
      type,
      enabled,
    }: {
      channel: NotificationChannel;
      type: NotificationCategory;
      enabled: boolean;
    }) => {
      if (!userId) throw new Error('User not logged in');
      return notificationService.updatePreference(userId, channel, type, enabled);
    },
    onSuccess: () => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: notificationKeys.preferences(userId) });
      }
    },
  });
}

/**
 * Trigger send-notification Edge Function
 */
export function useSendNotification() {
  return useMutation({
    mutationFn: (payload: SendNotificationPayload) => notificationService.sendNotification(payload),
  });
}
