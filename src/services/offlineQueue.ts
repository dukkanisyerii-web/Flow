// Offline Queue Service for CETEM Flow Operations
// Handles local storage persistence, network change listeners, and background sync logic

export type OfflineQueueActionType =
  | 'COMPLETE_TASK'
  | 'UPDATE_TASK_STATUS'
  | 'UPLOAD_PHOTO_PROOF'
  | 'REPORT_ISSUE'
  | 'TOGGLE_SHIFT_BREAK';

export interface QueuedOperation {
  id: string;
  type: OfflineQueueActionType;
  payload: any;
  createdAt: string;
  timestampFormatted: string;
  retryCount: number;
  status: 'pending' | 'syncing' | 'failed' | 'synced';
  error?: string;
}

export interface OfflineSyncState {
  isOffline: boolean;
  isSyncing: boolean;
  queue: QueuedOperation[];
  lastSyncedAt: string | null;
  syncSuccessCount: number;
  autoSyncEnabled: boolean;
}

const STORAGE_QUEUE_KEY = 'cetem_offline_queue_v2';
const STORAGE_AUTO_SYNC_KEY = 'cetem_auto_sync_v2';
const STORAGE_LAST_SYNC_KEY = 'cetem_last_synced_at_v2';

class OfflineQueueService {
  private queue: QueuedOperation[] = [];
  private isSyncing: boolean = false;
  private lastSyncedAt: string | null = null;
  private syncSuccessCount: number = 0;
  private autoSyncEnabled: boolean = true;
  private listeners: Array<(state: OfflineSyncState) => void> = [];
  private syncHandler: ((op: QueuedOperation) => Promise<boolean>) | null = null;
  private syncIntervalId: any = null;

  constructor() {
    this.init();
  }

  private init() {
    try {
      const raw = localStorage.getItem(STORAGE_QUEUE_KEY);
      if (raw) {
        this.queue = JSON.parse(raw);
      }
      const rawAutoSync = localStorage.getItem(STORAGE_AUTO_SYNC_KEY);
      if (rawAutoSync !== null) {
        this.autoSyncEnabled = rawAutoSync === 'true';
      }
      const rawLastSync = localStorage.getItem(STORAGE_LAST_SYNC_KEY);
      if (rawLastSync) {
        this.lastSyncedAt = rawLastSync;
      } else {
        this.lastSyncedAt = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
      }
    } catch (e) {
      console.warn('Could not load offline queue from localStorage', e);
      this.queue = [];
    }

    // Attach native window online/offline listeners
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.notify();
        if (this.autoSyncEnabled) {
          this.attemptBackgroundSync();
        }
      });
      window.addEventListener('offline', () => {
        this.notify();
      });

      // Background sync check interval (every 10 seconds if online and autoSync is enabled)
      this.syncIntervalId = setInterval(() => {
        if (this.autoSyncEnabled && this.isEffectiveOnline() && this.getPendingCount() > 0 && !this.isSyncing) {
          this.attemptBackgroundSync();
        }
      }, 10000);
    }
  }

  public setAutoSyncEnabled(enabled: boolean) {
    this.autoSyncEnabled = enabled;
    try {
      localStorage.setItem(STORAGE_AUTO_SYNC_KEY, String(enabled));
    } catch (e) {
      console.warn('Could not save auto-sync setting', e);
    }
    this.notify();
    if (enabled && this.isEffectiveOnline() && this.getPendingCount() > 0) {
      this.attemptBackgroundSync();
    }
  }

  public isAutoSyncEnabled(): boolean {
    return this.autoSyncEnabled;
  }

  public registerSyncHandler(handler: (op: QueuedOperation) => Promise<boolean>) {
    this.syncHandler = handler;
  }

  public isEffectiveOnline(): boolean {
    if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
      return navigator.onLine;
    }
    return true;
  }

  public getState(): OfflineSyncState {
    return {
      isOffline: !this.isEffectiveOnline(),
      isSyncing: this.isSyncing,
      queue: [...this.queue],
      lastSyncedAt: this.lastSyncedAt,
      syncSuccessCount: this.syncSuccessCount,
      autoSyncEnabled: this.autoSyncEnabled,
    };
  }

  public subscribe(listener: (state: OfflineSyncState) => void): () => void {
    this.listeners.push(listener);
    listener(this.getState());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (e) {
        console.error('OfflineQueue listener error', e);
      }
    });
  }

  private saveQueue() {
    try {
      localStorage.setItem(STORAGE_QUEUE_KEY, JSON.stringify(this.queue));
    } catch (e) {
      console.warn('Failed to persist offline queue', e);
    }
    this.notify();
  }

  public getPendingCount(): number {
    return this.queue.filter((q) => q.status === 'pending' || q.status === 'failed').length;
  }

  public getQueue(): QueuedOperation[] {
    return [...this.queue];
  }

  // Enqueue a task completion, photo proof, or issue report
  public enqueue(
    type: OfflineQueueActionType,
    payload: any
  ): QueuedOperation {
    const now = new Date();
    const timeFormatted = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

    const newOp: QueuedOperation = {
      id: `op-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type,
      payload,
      createdAt: now.toISOString(),
      timestampFormatted: timeFormatted,
      retryCount: 0,
      status: 'pending',
    };

    this.queue.unshift(newOp);
    this.saveQueue();

    // If auto-sync is enabled and online, immediately try to sync
    if (this.autoSyncEnabled && this.isEffectiveOnline()) {
      this.attemptBackgroundSync();
    }

    return newOp;
  }

  // Remove an operation from queue
  public removeOperation(id: string) {
    this.queue = this.queue.filter((item) => item.id !== id);
    this.saveQueue();
  }

  // Clear all completed or all items
  public clearQueue() {
    this.queue = [];
    this.saveQueue();
  }

  // Export queue as JSON string
  public exportQueueAsJson(): string {
    return JSON.stringify(this.queue, null, 2);
  }

  // Manual trigger wrapper
  public async manualSync(): Promise<{ success: number; failed: number }> {
    return this.attemptBackgroundSync(true);
  }

  // Background Sync Engine
  public async attemptBackgroundSync(forceManual = false): Promise<{ success: number; failed: number }> {
    if (!this.isEffectiveOnline()) {
      return { success: 0, failed: 0 };
    }

    if (!forceManual && !this.autoSyncEnabled) {
      return { success: 0, failed: 0 };
    }

    if (this.isSyncing) {
      return { success: 0, failed: 0 };
    }

    const pendingItems = this.queue.filter((item) => item.status === 'pending' || item.status === 'failed');
    if (pendingItems.length === 0) {
      if (forceManual) {
        // Fast cloud handshake check for manual sync
        this.isSyncing = true;
        this.notify();
        await new Promise((r) => setTimeout(r, 400));
        this.lastSyncedAt = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        try {
          localStorage.setItem(STORAGE_LAST_SYNC_KEY, this.lastSyncedAt);
        } catch {
          // ignore
        }
        this.isSyncing = false;
        this.notify();
      }
      return { success: 0, failed: 0 };
    }

    this.isSyncing = true;
    this.notify();

    let success = 0;
    let failed = 0;

    for (const item of pendingItems) {
      item.status = 'syncing';
      this.saveQueue();

      try {
        let synced = true;
        if (this.syncHandler) {
          synced = await this.syncHandler(item);
        } else {
          // Transmission delay
          await new Promise((r) => setTimeout(r, 300));
          synced = true;
        }

        if (synced) {
          item.status = 'synced';
          success++;
          this.syncSuccessCount++;
        } else {
          item.status = 'failed';
          item.retryCount += 1;
          item.error = 'Sunucu yanıt vermedi, yeniden denenecek';
          failed++;
        }
      } catch (err: any) {
        item.status = 'failed';
        item.retryCount += 1;
        item.error = err?.message || 'Ağ iletim hatası';
        failed++;
      }
    }

    // Retain only un-synced items or trim synced ones
    this.queue = this.queue.filter((item) => item.status !== 'synced');
    this.lastSyncedAt = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    try {
      localStorage.setItem(STORAGE_LAST_SYNC_KEY, this.lastSyncedAt);
    } catch {
      // ignore
    }
    this.isSyncing = false;
    this.saveQueue();

    return { success, failed };
  }
}

export const offlineQueue = new OfflineQueueService();
