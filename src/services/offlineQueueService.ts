/**
 * ==============================================================================
 * Offline Queue & PWA Sync Service
 * 
 * Strict Policy Enforcement:
 * 1. ONLY chat messages and idea drafts are queued when offline.
 * 2. All other writes MUST NEVER pretend to succeed while offline; they throw an
 *    explicit OfflineWriteError so the user is informed with clear feedback.
 * 3. Automatic synchronization when returning online.
 * ==============================================================================
 */

export interface QueuedChatMessage {
  id: string;
  teamId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderRole: string;
  text: string;
  attachments?: { name: string; url: string; type: 'link' | 'image' | 'code' }[];
  queuedAt: string;
}

export interface QueuedIdeaDraft {
  id: string;
  userId: string;
  draftData: any;
  queuedAt: string;
}

const CHAT_QUEUE_KEY = 'iedc_offline_chat_queue';
const DRAFT_QUEUE_KEY = 'iedc_offline_draft_queue';
const OFFLINE_EVENT = 'iedc_offline_queue_changed';

const memoryStore = new Map<string, string>();
const getSafeStorage = () => {
  if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
  if (typeof globalThis !== 'undefined' && (globalThis as any).localStorage) return (globalThis as any).localStorage;
  return {
    getItem: (k: string) => memoryStore.get(k) || null,
    setItem: (k: string, v: string) => memoryStore.set(k, v),
    removeItem: (k: string) => memoryStore.delete(k),
    clear: () => memoryStore.clear()
  };
};

export class OfflineWriteError extends Error {
  public isOfflineError = true;
  constructor(actionName: string) {
    super(`Offline: Cannot perform "${actionName}" while offline. Writes are disabled except for idea drafts and chat messages.`);
    this.name = 'OfflineWriteError';
  }
}

class OfflineQueueService {
  private onlineStatus: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private activeSyncPromise: Promise<{ syncedChats: number; syncedDrafts: number }> | null = null;
  private listeners: Set<(isOnline: boolean) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnlineStateChange(true));
      window.addEventListener('offline', () => this.handleOnlineStateChange(false));
    }
  }

  public isOnline(): boolean {
    return this.onlineStatus;
  }

  /**
   * For testing or manual override
   */
  public setOnlineForTesting(status: boolean): void {
    this.handleOnlineStateChange(status);
  }

  private handleOnlineStateChange(status: boolean): void {
    if (this.onlineStatus === status) {
      return;
    }
    this.onlineStatus = status;
    this.notifyListeners();
    this.dispatchChangeEvent();

    if (status) {
      this.syncPendingQueues().catch(err => {
        console.warn('Auto sync on online trigger encountered an issue:', err);
      });
    }
  }

  public onStatusChange(callback: (isOnline: boolean) => void): () => void {
    this.listeners.add(callback);
    callback(this.onlineStatus);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    this.listeners.forEach(cb => cb(this.onlineStatus));
  }

  private dispatchChangeEvent(): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(OFFLINE_EVENT, { 
        detail: { 
          isOnline: this.onlineStatus,
          counts: this.getPendingQueueCounts() 
        } 
      }));
    }
  }

  /**
   * Enforces that disallowed writes must never pretend to succeed while offline.
   * Throws an explicit OfflineWriteError if called while offline.
   */
  public assertOnlineForWrite(actionName: string): void {
    if (!this.isOnline()) {
      throw new OfflineWriteError(actionName);
    }
  }

  // --------------------------------------------------------------------------
  // Chat Message Queue (Allowed offline)
  // --------------------------------------------------------------------------

  public enqueueChatMessage(msg: Omit<QueuedChatMessage, 'id' | 'queuedAt'>): QueuedChatMessage {
    const queue = this.getQueuedChatMessages();
    const queuedItem: QueuedChatMessage = {
      ...msg,
      id: `offline_chat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      queuedAt: new Date().toISOString()
    };

    queue.push(queuedItem);
    try {
      getSafeStorage().setItem(CHAT_QUEUE_KEY, JSON.stringify(queue));
      this.dispatchChangeEvent();
    } catch (e) {
      console.error('Failed to persist queued chat message:', e);
    }

    return queuedItem;
  }

  public getQueuedChatMessages(): QueuedChatMessage[] {
    try {
      const raw = getSafeStorage().getItem(CHAT_QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public clearChatQueue(): void {
    getSafeStorage().removeItem(CHAT_QUEUE_KEY);
    this.dispatchChangeEvent();
  }

  // --------------------------------------------------------------------------
  // Idea Draft Queue (Allowed offline)
  // --------------------------------------------------------------------------

  public enqueueIdeaDraft(userId: string, draftData: any): QueuedIdeaDraft {
    const queue = this.getQueuedIdeaDrafts();
    // Only keep the latest draft per user
    const filtered = queue.filter(item => item.userId !== userId);

    const queuedItem: QueuedIdeaDraft = {
      id: `offline_draft_${userId}_${Date.now()}`,
      userId,
      draftData,
      queuedAt: new Date().toISOString()
    };

    filtered.push(queuedItem);
    try {
      getSafeStorage().setItem(DRAFT_QUEUE_KEY, JSON.stringify(filtered));
      this.dispatchChangeEvent();
    } catch (e) {
      console.error('Failed to persist queued idea draft:', e);
    }

    return queuedItem;
  }

  public getQueuedIdeaDrafts(): QueuedIdeaDraft[] {
    try {
      const raw = getSafeStorage().getItem(DRAFT_QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public clearDraftQueue(): void {
    getSafeStorage().removeItem(DRAFT_QUEUE_KEY);
    this.dispatchChangeEvent();
  }

  // --------------------------------------------------------------------------
  // Aggregated Counters
  // --------------------------------------------------------------------------

  public getPendingQueueCounts(): { chatCount: number; draftCount: number; total: number } {
    const chats = this.getQueuedChatMessages().length;
    const drafts = this.getQueuedIdeaDrafts().length;
    return {
      chatCount: chats,
      draftCount: drafts,
      total: chats + drafts
    };
  }

  // --------------------------------------------------------------------------
  // Synchronization
  // --------------------------------------------------------------------------

  public async syncPendingQueues(): Promise<{ syncedChats: number; syncedDrafts: number }> {
    if (!this.isOnline()) {
      return { syncedChats: 0, syncedDrafts: 0 };
    }

    if (this.activeSyncPromise) {
      await this.activeSyncPromise;
      if (!this.isOnline() || this.getPendingQueueCounts().total === 0) {
        return { syncedChats: 0, syncedDrafts: 0 };
      }
    }

    this.activeSyncPromise = this.executeSync();
    try {
      return await this.activeSyncPromise;
    } finally {
      this.activeSyncPromise = null;
    }
  }

  private async executeSync(): Promise<{ syncedChats: number; syncedDrafts: number }> {
    let syncedChats = 0;
    let syncedDrafts = 0;

    try {
      const chats = this.getQueuedChatMessages();
      const drafts = this.getQueuedIdeaDrafts();

      const { getSupabase } = await import('./supabaseClient');
      const sb = getSupabase();

      // Sync idea drafts
      if (drafts.length > 0) {
        for (const draft of drafts) {
          try {
            if (sb) {
              await sb.rpc('autosave_idea_draft', {
                p_draft_data: draft.draftData
              });
            }
            syncedDrafts++;
          } catch (err) {
            console.warn(`Failed to sync queued draft for user ${draft.userId}:`, err);
          }
        }
        this.clearDraftQueue();
      }

      // Sync chat messages
      if (chats.length > 0) {
        for (const chat of chats) {
          try {
            if (sb && !chat.senderId.startsWith('usr_')) {
              await sb.from('team_chat_messages').insert([{
                team_id: chat.teamId,
                sender_id: chat.senderId,
                sender_name: chat.senderName,
                sender_avatar: chat.senderAvatar,
                sender_role: chat.senderRole,
                text: chat.text,
                attachments: chat.attachments,
                created_at: chat.queuedAt
              }]);
            }
            syncedChats++;
          } catch (err) {
            console.warn('Failed to sync queued chat message to server:', err);
          }
        }
        this.clearChatQueue();
      }
    } finally {
      this.dispatchChangeEvent();
    }

    return { syncedChats, syncedDrafts };
  }
}

export const offlineQueueService = new OfflineQueueService();
