import {
  AppNotification,
  NotificationPreference,
  NotificationChannel,
  NotificationCategory,
  SendNotificationPayload,
  NotificationType
} from '../types';
import { getSupabase } from './supabaseClient';

const NOTIFICATIONS_STORAGE_PREFIX = 'iedc_notifications_';
const PREFERENCES_STORAGE_PREFIX = 'iedc_notif_prefs_';
const NOTIFICATION_EVENT = 'iedc_notifications_updated';

// Mock Initial Notifications for Demo / Offline Experience
const INITIAL_MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    userId: 'usr_student_01',
    type: 'hackathon_deadline_24h',
    title: '⏳ 24 Hours Left: BMCE GENAI & HARDWARE HACKATHON 2026',
    body: 'Submissions strictly lock in 24 hours. Ensure your GitHub repository URL, commit SHA, and demo video are saved before the deadline!',
    link: '/hackathons',
    readAt: null,
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    metadata: { hackathonTitle: 'BMCE GENAI & HARDWARE HACKATHON 2026' }
  },
  {
    id: 'notif-2',
    userId: 'usr_student_01',
    type: 'team_join_request',
    title: '🚀 New Teammate Request for "NeuralNova"',
    body: 'Arun Kumar requested to join your squad as Hardware / IoT engineer with message: "Calibrated optical flow sensors ready for flight testing".',
    link: '/hackathons',
    readAt: null,
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    metadata: { applicantName: 'Arun Kumar', requestedRole: 'Hardware / IoT' }
  },
  {
    id: 'notif-3',
    userId: 'usr_student_01',
    type: 'kyc_approved',
    title: '🎉 KYC Identity Verification Approved!',
    body: 'Your KTU student credentials have been officially verified. Your role is now elevated to Innovator with access to hackathon registrations and seed grants.',
    link: '/profile?tab=kyc',
    readAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'notif-4',
    userId: 'usr_student_01',
    type: 'idea_status_changed',
    title: '💡 Idea Status Updated: "AgriDrone AI"',
    body: 'Your proposal has been moved to "Incubation Approved". Seed grant allocation approved from IEDC BMCE prototyping fund.',
    link: '/ideabox?idea=idea-agridrone-01',
    readAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    metadata: { newStatus: 'Incubation Approved' }
  }
];

const DEFAULT_CATEGORIES: NotificationCategory[] = ['kyc', 'idea', 'team', 'hackathon', 'general'];

function getLocalNotifications(userId: string): AppNotification[] {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_PREFIX + userId);
    if (!raw) {
      localStorage.setItem(NOTIFICATIONS_STORAGE_PREFIX + userId, JSON.stringify(INITIAL_MOCK_NOTIFICATIONS));
      return INITIAL_MOCK_NOTIFICATIONS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_MOCK_NOTIFICATIONS;
  }
}

function saveLocalNotifications(userId: string, list: AppNotification[]): void {
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_PREFIX + userId, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent(NOTIFICATION_EVENT, { detail: { userId, count: list.length } }));
  } catch (err) {
    console.error('Failed to save local notifications:', err);
  }
}

export const notificationService = {
  /**
   * Subscribe to local UI notification state changes
   */
  subscribe(callback: (userId?: string) => void): () => void {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<{ userId: string }>;
      callback(customEvent.detail?.userId);
    };
    window.addEventListener(NOTIFICATION_EVENT, handler);
    return () => window.removeEventListener(NOTIFICATION_EVENT, handler);
  },

  /**
   * Subscribe to Supabase Realtime channel for live in-app notifications
   */
  subscribeRealtime(userId: string, onNewNotification: (notif: AppNotification) => void): () => void {
    const sb = getSupabase();
    if (!sb || !userId) {
      return this.subscribe(() => {
        const notifs = getLocalNotifications(userId);
        if (notifs[0]) onNewNotification(notifs[0]);
      });
    }

    const channelName = `user-notifications-${userId}`;
    const channel = sb
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        payload => {
          const row = payload.new as any;
          const notif: AppNotification = {
            id: row.id,
            userId: row.user_id,
            type: row.type as NotificationType,
            title: row.title,
            body: row.body,
            link: row.link,
            readAt: row.read_at,
            metadata: row.metadata,
            createdAt: row.created_at
          };
          onNewNotification(notif);
        }
      )
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
  },

  /**
   * Fetch all notifications for the given user (ordered newest first)
   */
  async fetchNotifications(userId: string): Promise<AppNotification[]> {
    const sb = getSupabase();
    if (!sb) {
      return getLocalNotifications(userId);
    }

    try {
      const { data, error } = await sb
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error || !data) {
        return getLocalNotifications(userId);
      }

      return data.map((r: any) => ({
        id: r.id,
        userId: r.user_id,
        type: r.type as NotificationType,
        title: r.title,
        body: r.body,
        link: r.link,
        readAt: r.read_at,
        metadata: r.metadata,
        createdAt: r.created_at
      }));
    } catch {
      return getLocalNotifications(userId);
    }
  },

  /**
   * Get unread notifications count
   */
  async getUnreadCount(userId: string): Promise<number> {
    const sb = getSupabase();
    if (!sb) {
      const local = getLocalNotifications(userId);
      return local.filter(n => !n.readAt).length;
    }

    try {
      const { count, error } = await sb
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .is('read_at', null);

      if (error || count === null) {
        const local = getLocalNotifications(userId);
        return local.filter(n => !n.readAt).length;
      }

      return count;
    } catch {
      const local = getLocalNotifications(userId);
      return local.filter(n => !n.readAt).length;
    }
  },

  /**
   * Mark a specific notification as read
   */
  async markAsRead(userId: string, notificationId: string): Promise<void> {
    const sb = getSupabase();
    if (sb) {
      try {
        await sb.rpc('mark_notification_read', { p_notification_id: notificationId });
      } catch (err) {
        console.warn('RPC mark_notification_read fallback to direct update:', err);
        await sb
          .from('notifications')
          .update({ read_at: new Date().toISOString() })
          .eq('id', notificationId)
          .eq('user_id', userId);
      }
    }

    // Local mirror update
    const list = getLocalNotifications(userId);
    const updated = list.map(n => (n.id === notificationId ? { ...n, readAt: new Date().toISOString() } : n));
    saveLocalNotifications(userId, updated);
  },

  /**
   * Mark all notifications as read for current user
   */
  async markAllAsRead(userId: string): Promise<void> {
    const sb = getSupabase();
    if (sb) {
      try {
        await sb.rpc('mark_all_notifications_read');
      } catch (err) {
        console.warn('RPC mark_all_notifications_read fallback:', err);
        await sb
          .from('notifications')
          .update({ read_at: new Date().toISOString() })
          .eq('user_id', userId)
          .is('read_at', null);
      }
    }

    // Local mirror update
    const list = getLocalNotifications(userId);
    const updated = list.map(n => ({ ...n, readAt: n.readAt || new Date().toISOString() }));
    saveLocalNotifications(userId, updated);
  },

  /**
   * Fetch notification preferences
   */
  async fetchPreferences(userId: string): Promise<NotificationPreference[]> {
    const sb = getSupabase();
    if (sb) {
      try {
        const { data, error } = await sb
          .from('notification_preferences')
          .select('*')
          .eq('user_id', userId);

        if (!error && data && data.length > 0) {
          return data.map((d: any) => ({
            id: d.id,
            userId: d.user_id,
            channel: d.channel as NotificationChannel,
            type: d.type as NotificationCategory,
            enabled: d.enabled,
            createdAt: d.created_at,
            updatedAt: d.updated_at
          }));
        }
      } catch (err) {
        console.warn('Preferences fetch error:', err);
      }
    }

    // Default preferences: all enabled
    const defaults: NotificationPreference[] = [];
    (['in_app', 'email'] as NotificationChannel[]).forEach(channel => {
      DEFAULT_CATEGORIES.forEach(type => {
        defaults.push({
          userId,
          channel,
          type,
          enabled: true
        });
      });
    });

    return defaults;
  },

  /**
   * Update a notification preference
   */
  async updatePreference(
    userId: string,
    channel: NotificationChannel,
    type: NotificationCategory,
    enabled: boolean
  ): Promise<void> {
    const sb = getSupabase();
    if (sb) {
      try {
        await sb.from('notification_preferences').upsert(
          {
            user_id: userId,
            channel,
            type,
            enabled,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'user_id,channel,type' }
        );
      } catch (err) {
        console.warn('Could not upsert notification_preferences:', err);
      }
    }
  },

  /**
   * Dispatch a notification using the send-notification Edge Function
   */
  async sendNotification(payload: SendNotificationPayload): Promise<{ success: boolean; inAppCreated?: boolean; emailSent?: boolean }> {
    const sb = getSupabase();
    if (sb) {
      try {
        const { data, error } = await sb.functions.invoke('send-notification', {
          body: payload
        });

        if (!error && data) {
          return data;
        }
      } catch (err) {
        console.warn('Edge Function send-notification invoke exception:', err);
      }
    }

    // Local in-app fallback
    const list = getLocalNotifications(payload.userId);
    const newNotif: AppNotification = {
      id: `notif_${Date.now()}`,
      userId: payload.userId,
      type: payload.type,
      title: payload.title || 'IEDC Update',
      body: payload.body || 'You have a new update in your IEDC Portal.',
      link: payload.link || '/',
      readAt: null,
      metadata: payload.metadata,
      createdAt: new Date().toISOString()
    };

    saveLocalNotifications(payload.userId, [newNotif, ...list]);
    return { success: true, inAppCreated: true, emailSent: false };
  }
};
