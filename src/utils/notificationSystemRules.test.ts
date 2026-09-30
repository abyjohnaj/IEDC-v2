import { describe, it, expect } from 'vitest';
import {
  mapNotificationTypeToCategory,
  shouldDeliverNotification,
  generateNotificationText
} from './notificationSystemRules';
import { NotificationPreference } from '../types';

describe('Unified Notification System Business Rules', () => {

  describe('Notification Category Mapping', () => {
    it('maps kyc types to kyc category', () => {
      expect(mapNotificationTypeToCategory('kyc_approved')).toBe('kyc');
      expect(mapNotificationTypeToCategory('kyc_rejected')).toBe('kyc');
    });

    it('maps idea types to idea category', () => {
      expect(mapNotificationTypeToCategory('idea_status_changed')).toBe('idea');
    });

    it('maps team types to team category', () => {
      expect(mapNotificationTypeToCategory('team_join_request')).toBe('team');
    });

    it('maps hackathon types and results to hackathon category', () => {
      expect(mapNotificationTypeToCategory('hackathon_deadline_24h')).toBe('hackathon');
      expect(mapNotificationTypeToCategory('results_published')).toBe('hackathon');
    });
  });

  describe('User Preference Delivery Checks', () => {
    it('defaults to allowed (true) when no explicit preference exists', () => {
      const allowed = shouldDeliverNotification({
        channel: 'email',
        type: 'idea_status_changed',
        preferences: [],
      });
      expect(allowed).toBe(true);
    });

    it('respects user disabling a channel for a specific category', () => {
      const prefs: NotificationPreference[] = [
        {
          userId: 'usr_01',
          channel: 'email',
          type: 'idea',
          enabled: false,
        },
        {
          userId: 'usr_01',
          channel: 'in_app',
          type: 'idea',
          enabled: true,
        },
      ];

      const emailAllowed = shouldDeliverNotification({
        channel: 'email',
        type: 'idea_status_changed',
        preferences: prefs,
      });
      const inAppAllowed = shouldDeliverNotification({
        channel: 'in_app',
        type: 'idea_status_changed',
        preferences: prefs,
      });

      expect(emailAllowed).toBe(false);
      expect(inAppAllowed).toBe(true);
    });

    it('allows delivering other categories when one is disabled', () => {
      const prefs: NotificationPreference[] = [
        {
          userId: 'usr_01',
          channel: 'email',
          type: 'hackathon',
          enabled: false,
        },
      ];

      const kycEmailAllowed = shouldDeliverNotification({
        channel: 'email',
        type: 'kyc_approved',
        preferences: prefs,
      });
      expect(kycEmailAllowed).toBe(true);
    });
  });

  describe('Notification Template Rendering', () => {
    it('renders KYC approved template with route link', () => {
      const rendered = generateNotificationText('kyc_approved');
      expect(rendered.title).toContain('Approved');
      expect(rendered.body).toContain('Innovator');
      expect(rendered.link).toBe('/profile?tab=kyc');
    });

    it('renders KYC rejected template with rejection reason', () => {
      const rendered = generateNotificationText('kyc_rejected', {
        rejection_reason: 'Blurry photo on ID card',
      });
      expect(rendered.title).toContain('Attention');
      expect(rendered.body).toContain('Blurry photo on ID card');
    });

    it('renders idea status change with updated status and title', () => {
      const rendered = generateNotificationText('idea_status_changed', {
        ideaTitle: 'BioRobotics Arm',
        newStatus: 'Shortlisted',
        ideaId: 'idea-123',
      });
      expect(rendered.title).toContain('BioRobotics Arm');
      expect(rendered.body).toContain('Shortlisted');
      expect(rendered.link).toBe('/ideabox?idea=idea-123');
    });

    it('renders team join request with applicant and squad name', () => {
      const rendered = generateNotificationText('team_join_request', {
        teamName: 'CyberNova',
        applicantName: 'Devika Suresh',
        requestedRole: 'AI / ML Engineer',
      });
      expect(rendered.title).toContain('CyberNova');
      expect(rendered.body).toContain('Devika Suresh');
      expect(rendered.body).toContain('AI / ML Engineer');
    });

    it('renders 24-hour hackathon countdown warning', () => {
      const rendered = generateNotificationText('hackathon_deadline_24h', {
        hackathonTitle: 'BMCE Hack 2026',
      });
      expect(rendered.title).toContain('24 Hours');
      expect(rendered.body).toContain('commit SHA');
    });

    it('renders results published template', () => {
      const rendered = generateNotificationText('results_published', {
        hackathonTitle: 'BMCE Hack 2026',
      });
      expect(rendered.title).toContain('Results Published');
      expect(rendered.body).toContain('leaderboard');
    });
  });
});
