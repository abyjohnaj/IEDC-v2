import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  offlineQueueService, 
  OfflineWriteError 
} from './offlineQueueService';
import { ideaBoxService } from './ideaBoxService';
import { hackathonService } from './hackathonService';
import * as supabaseClientModule from './supabaseClient';

// Mock localStorage for node test runner
const storageMap = new Map<string, string>();
const mockLocalStorage = {
  getItem: (key: string) => storageMap.get(key) || null,
  setItem: (key: string, value: string) => storageMap.set(key, value),
  removeItem: (key: string) => storageMap.delete(key),
  clear: () => storageMap.clear()
};

if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as any).localStorage = mockLocalStorage;
}

describe('PWA Offline Queue & Strict Write Enforcement', () => {
  beforeEach(() => {
    storageMap.clear();
    offlineQueueService.clearChatQueue();
    offlineQueueService.clearDraftQueue();
    offlineQueueService.setOnlineForTesting(true);
    vi.restoreAllMocks();
  });

  describe('Online/Offline Detection & Notifications', () => {
    it('detects online state correctly and notifies listeners on change', () => {
      let reportedStatus = false;
      const unsub = offlineQueueService.onStatusChange(status => {
        reportedStatus = status;
      });

      expect(reportedStatus).toBe(true);

      offlineQueueService.setOnlineForTesting(false);
      expect(reportedStatus).toBe(false);
      expect(offlineQueueService.isOnline()).toBe(false);

      offlineQueueService.setOnlineForTesting(true);
      expect(reportedStatus).toBe(true);
      expect(offlineQueueService.isOnline()).toBe(true);

      unsub();
    });
  });

  describe('Strict Offline Write Policy (Must never pretend to succeed)', () => {
    it('allows assertOnlineForWrite to pass when online', () => {
      offlineQueueService.setOnlineForTesting(true);
      expect(() => offlineQueueService.assertOnlineForWrite('Test Action')).not.toThrow();
    });

    it('throws explicit OfflineWriteError when offline', () => {
      offlineQueueService.setOnlineForTesting(false);
      expect(() => offlineQueueService.assertOnlineForWrite('Submitting an idea')).toThrow(OfflineWriteError);
      expect(() => offlineQueueService.assertOnlineForWrite('Creating a forum post')).toThrow(
        /Cannot perform "Creating a forum post" while offline/
      );
    });

    it('rejects idea submission when offline and does not fake success', async () => {
      offlineQueueService.setOnlineForTesting(false);

      await expect(
        ideaBoxService.submitIdea({
          title: 'Offline Idea',
          domain: 'AgriTech & AI',
          elevatorPitch: 'Pitch',
          problemStatement: 'Problem',
          proposedSolution: 'Solution',
          techStack: ['React'],
          stage: 'Ideation',
          targetAudience: 'Everyone',
          authorId: 'usr_test',
          authorName: 'Tester',
          authorEmail: 'test@bmce.ac.in',
          authorAvatar: '',
          authorRole: 'Student'
        })
      ).rejects.toThrow(OfflineWriteError);
    });

    it('rejects team creation when offline', () => {
      offlineQueueService.setOnlineForTesting(false);

      expect(() =>
        hackathonService.createTeam({
          hackathonId: 'hack-01',
          hackathonTitle: 'HackBMCE',
          name: 'Offline Squad',
          tagline: 'We build offline',
          track: 'AI',
          isOpen: true,
          rolesNeeded: [],
          leader: {
            id: 'usr_lead',
            fullName: 'Leader',
            email: 'lead@bmce.ac.in',
            avatar: '',
            role: 'Student'
          } as any
        })
      ).toThrow(OfflineWriteError);
    });
  });

  describe('Allowed Offline Queues (Chat messages & Idea drafts ONLY)', () => {
    it('queues chat messages in local storage when offline', () => {
      offlineQueueService.setOnlineForTesting(false);

      const queuedMsg = offlineQueueService.enqueueChatMessage({
        teamId: 'team-neuralnova',
        senderId: 'usr_test',
        senderName: 'Test User',
        senderAvatar: '',
        senderRole: 'Developer',
        text: 'This message was drafted offline!'
      });

      expect(queuedMsg.id).toContain('offline_chat_');
      const counts = offlineQueueService.getPendingQueueCounts();
      expect(counts.chatCount).toBe(1);
      expect(counts.draftCount).toBe(0);
      expect(counts.total).toBe(1);

      const items = offlineQueueService.getQueuedChatMessages();
      expect(items[0].text).toBe('This message was drafted offline!');
    });

    it('queues idea drafts when offline via ideaBoxService.saveIdeaDraft', async () => {
      offlineQueueService.setOnlineForTesting(false);

      await ideaBoxService.saveIdeaDraft({
        authorId: 'usr_test',
        title: 'Drafted Offline Idea',
        domain: 'CleanTech',
        elevatorPitch: 'Drafted while disconnected',
        problemStatement: 'No internet',
        proposedSolution: 'Save locally and queue',
        techStackInput: 'PWA, ServiceWorker',
        stage: 'Ideation',
        targetAudience: 'All students'
      });

      const counts = offlineQueueService.getPendingQueueCounts();
      expect(counts.draftCount).toBe(1);

      const retrievedDraft = await ideaBoxService.getIdeaDraft();
      expect(retrievedDraft?.title).toBe('Drafted Offline Idea');
    });

    it('syncs queued drafts and messages upon coming back online', async () => {
      offlineQueueService.setOnlineForTesting(false);

      // Queue 1 chat and 1 draft
      offlineQueueService.enqueueChatMessage({
        teamId: 'team-neuralnova',
        senderId: 'usr_test',
        senderName: 'Test User',
        senderAvatar: '',
        senderRole: 'Developer',
        text: 'Sync me'
      });

      offlineQueueService.enqueueIdeaDraft('usr_test', {
        authorId: 'usr_test',
        title: 'Queued Draft',
        domain: 'AI',
        savedAt: new Date().toISOString()
      });

      expect(offlineQueueService.getPendingQueueCounts().total).toBe(2);

      // Mock successful Supabase sync calls
      const mockRpc = vi.fn().mockResolvedValue({ data: null, error: null });
      const mockInsert = vi.fn().mockResolvedValue({ error: null });

      vi.spyOn(supabaseClientModule, 'getSupabase').mockReturnValue({
        rpc: mockRpc,
        from: vi.fn().mockReturnValue({ insert: mockInsert })
      } as any);

      // Trigger online transition which triggers auto-sync
      offlineQueueService.setOnlineForTesting(true);
      await offlineQueueService.syncPendingQueues();

      expect(mockRpc).toHaveBeenCalled();
      expect(offlineQueueService.getPendingQueueCounts().total).toBe(0);
    });
  });
});
