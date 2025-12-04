import { useState, useEffect, useCallback } from "react";
import { lightwalletd, SyncProgress } from "@/lib/lightwalletd";
import { useAuth } from "./useAuth";

export interface UseSyncReturn {
  syncProgress: SyncProgress | null;
  isLoading: boolean;
  startSync: () => Promise<void>;
  stopSync: () => void;
  retrySync: () => Promise<void>;
}

export function useSync(): UseSyncReturn {
  const { viewingKey, isConnected } = useAuth();
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Subscribe to sync progress updates
  useEffect(() => {
    const unsubscribe = lightwalletd.onSyncProgress((progress) => {
      setSyncProgress(progress);
      setIsLoading(
        progress.status === "syncing" || progress.status === "scanning"
      );
    });

    return unsubscribe;
  }, []);

  const startSync = useCallback(async () => {
    if (!viewingKey || !isConnected) {
      console.warn("Cannot start sync: no viewing key");
      return;
    }

    if (lightwalletd.isSyncing()) {
      console.warn("Sync already in progress");
      return;
    }

    setIsLoading(true);

    try {
      // Get the last synced height from localStorage
      const lastSyncedHeight = localStorage.getItem("zcash_last_synced_height");
      let startHeight = 419200;

      if (lastSyncedHeight) {
        startHeight = parseInt(lastSyncedHeight, 10);
      } else {
        // If no history, scan last 10k blocks by default for better UX
        const latestHeight = await lightwalletd.getLatestBlockHeight();
        startHeight = Math.max(419200, latestHeight - 10000);
      }

      await lightwalletd.startSync(startHeight, viewingKey, (tx) => {
        // Handle discovered transactions
        console.log("Discovered transaction:", tx);
      });

      // Save the last synced height
      if (syncProgress) {
        localStorage.setItem(
          "zcash_last_synced_height",
          syncProgress.currentHeight.toString()
        );
      }
    } catch (error) {
      console.error("Sync failed:", error);
    } finally {
      setIsLoading(false);
    }
  }, [viewingKey, isConnected, syncProgress]);

  const stopSync = useCallback(() => {
    lightwalletd.stopSync();
    setIsLoading(false);
  }, []);

  const retrySync = useCallback(async () => {
    stopSync();
    await new Promise((resolve) => setTimeout(resolve, 500));
    await startSync();
  }, [startSync, stopSync]);

  return {
    syncProgress,
    isLoading,
    startSync,
    stopSync,
    retrySync,
  };
}

export default useSync;
