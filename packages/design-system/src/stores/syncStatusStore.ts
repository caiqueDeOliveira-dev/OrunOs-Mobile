import { create } from "zustand";

export interface SyncStatus {
  pending: number;
  deadLetterCount: number;
  lastSuccessAt: string | null;
  lastError: string | null;
  isRunning: boolean;
  realtimeEnabled: boolean;
}

interface SyncStatusStore {
  status: SyncStatus;
  setStatus: (status: SyncStatus) => void;
}

const emptyStatus: SyncStatus = {
  pending: 0,
  deadLetterCount: 0,
  lastSuccessAt: null,
  lastError: null,
  isRunning: false,
  realtimeEnabled: false,
};

/**
 * Mirrors `SyncService.getSyncStatus()` from the main process (orun-supabase-sync
 * package). This store holds no logic of its own — the renderer is expected
 * to poll IPC every few seconds and call `setStatus`:
 *
 *   setInterval(async () => {
 *     const status = await window.orunAPI.getSyncStatus(); // exposed via contextBridge
 *     useSyncStatusStore.getState().setStatus(status);
 *   }, 5000);
 *
 * Until that's wired up, screens using this store show the empty/idle state
 * below — never fake numbers, so it's obvious in the UI that sync isn't
 * connected yet rather than looking like everything is fine.
 */
export const useSyncStatusStore = create<SyncStatusStore>((set) => ({
  status: emptyStatus,
  setStatus: (status) => set({ status }),
}));
