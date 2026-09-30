import { NotificationType, NotificationCategory, NotificationChannel, NotificationPreference } from '../types';

/**
 * Maps specific notification event types to general preference categories
 */
export function mapNotificationTypeToCategory(type: NotificationType): NotificationCategory {
  if (type.startsWith('kyc')) return 'kyc';
  if (type.startsWith('idea')) return 'idea';
  if (type.startsWith('team')) return 'team';
  if (type.startsWith('hackathon') || type === 'results_published') return 'hackathon';
  return 'general';
}

/**
 * Evaluates whether a notification channel is enabled according to user preferences
 */
export function shouldDeliverNotification(params: {
  channel: NotificationChannel;
  type: NotificationType;
  preferences: NotificationPreference[];
}): boolean {
  const category = mapNotificationTypeToCategory(params.type);
  const pref = params.preferences.find(
    (p) => p.channel === params.channel && p.type === category
  );

  // If no explicit preference record exists, default to true
  return pref !== undefined ? pref.enabled : true;
}

/**
 * Formats notification copy based on type and metadata
 */
export function generateNotificationText(
  type: NotificationType,
  metadata: Record<string, any> = {}
): { title: string; body: string; link: string } {
  switch (type) {
    case 'kyc_approved':
      return {
        title: '🎉 KYC Identity Verification Approved!',
        body: 'Congratulations! Your student credentials have been officially verified. Your role has been elevated to Innovator with access to hackathon registrations and seed grants.',
        link: '/profile?tab=kyc',
      };
    case 'kyc_rejected':
      return {
        title: '⚠️ KYC Verification Requires Attention',
        body: `Your KYC application could not be verified.${
          metadata.rejection_reason ? ` Reason: ${metadata.rejection_reason}.` : ''
        } Please resubmit your document in the KYC Hub.`,
        link: '/profile?tab=kyc',
      };
    case 'idea_status_changed':
      return {
        title: `💡 Idea Status Updated: "${metadata.ideaTitle || 'Your Innovation'}"`,
        body: `Your submission has moved to "${metadata.newStatus}". ${
          metadata.reason ? `Notes: "${metadata.reason}".` : 'Check the IdeaBox portal for next steps.'
        }`,
        link: metadata.ideaId ? `/ideabox?idea=${metadata.ideaId}` : '/ideabox',
      };
    case 'team_join_request':
      return {
        title: `🚀 New Teammate Request for "${metadata.teamName || 'Your Squad'}"`,
        body: `${metadata.applicantName || 'A builder'} requested to join your squad for role: ${
          metadata.requestedRole || 'Developer'
        }.${metadata.message ? ` Message: "${metadata.message}"` : ''}`,
        link: '/hackathons',
      };
    case 'hackathon_deadline_24h':
      return {
        title: `⏳ 24 Hours Left: ${metadata.hackathonTitle || 'BMCE Hackathon'}`,
        body: 'Submissions strictly lock in 24 hours. Ensure your GitHub repo URL, commit SHA, and demo video are saved before the deadline!',
        link: '/hackathons',
      };
    case 'results_published':
      return {
        title: `🏆 Official Results Published: ${metadata.hackathonTitle || 'Hackathon'}`,
        body: 'The jury has finalized evaluation scores and published the official leaderboard rankings. View the results now!',
        link: '/hackathons',
      };
    default:
      return {
        title: 'IEDC Portal Notification',
        body: 'You have a new update in your IEDC Portal.',
        link: '/',
      };
  }
}
