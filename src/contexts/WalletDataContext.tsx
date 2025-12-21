import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  DecryptedTransaction,
  WalletBalance,
  calculateBalance,
  generateAnalytics,
  parseViewingKey,
  ViewingKeyInfo,
} from "@/lib/zcash-crypto";
import {
  initScanner,
  startSync,
  getOverview,
  getSyncStatus,
  ScannerTxReport,
} from "@/lib/scanner-api";
import { lightwalletd } from "@/lib/lightwalletd";

export interface WalletData {
  transactions: DecryptedTransaction[];
  balance: WalletBalance;
  scannerBalance: WalletBalance | null;
  analytics: ReturnType<typeof generateAnalytics> | null;
  viewingKeyInfo: ViewingKeyInfo | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => void;
  syncStatus: {
    currentHeight: number;
    networkHeight: number;
    isSyncing: boolean;
    progress: number;
    message: string;
  };
}

const WalletDataContext = createContext<WalletData | null>(null);

export function WalletDataProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { viewingKey, isConnected, getBirthdayHeight } = useAuth();
  const [transactions, setTransactions] = useState<DecryptedTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [networkHeight, setNetworkHeight] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentSyncHeight, setCurrentSyncHeight] = useState(0);
  const loadingRef = useRef(false);
  const [scannerBalance, setScannerBalance] = useState<WalletBalance | null>(
    null
  );

  const viewingKeyInfo = useMemo(() => {
    if (!viewingKey) return null;
    return parseViewingKey(viewingKey);
  }, [viewingKey]);

  const balance = useMemo(() => {
    if (scannerBalance) return scannerBalance;
    return calculateBalance(transactions);
  }, [scannerBalance, transactions]);

  const analytics = useMemo(() => {
    if (transactions.length === 0) return null;
    return generateAnalytics(transactions);
  }, [transactions]);

  const [syncProgress, setSyncProgress] = useState(0);

  const syncStatus = useMemo(() => {
    if (!isConnected) {
      return {
        currentHeight: 0,
        networkHeight: 0,
        isSyncing: false,
        progress: 0,
        message: "Not connected",
      };
    }

    if (isSyncing) {
      return {
        currentHeight: currentSyncHeight,
        networkHeight,
        isSyncing: true,
        progress: syncProgress,
        message: syncMessage || `Syncing with blockchain...`,
      };
    }

    return {
      currentHeight: networkHeight > 0 ? networkHeight : currentSyncHeight,
      networkHeight,
      isSyncing: false,
      progress: 100,
      message:
        transactions.length > 0
          ? `Synced. Found ${transactions.length} transactions.`
          : "Synced. No transactions found.",
    };
  }, [
    isConnected,
    isSyncing,
    networkHeight,
    currentSyncHeight,
    syncProgress,
    transactions.length,
    syncMessage,
  ]);

  const loadWalletData = useCallback(
    async (isBackground = false) => {
      if (!viewingKey || !isConnected || loadingRef.current) {
        return;
      }

      loadingRef.current = true;
      if (!isBackground) {
        setIsLoading(true);
        setError(null);
      }
      setIsSyncing(true);
      if (typeof setSyncMessage === "function") setSyncMessage("Syncing...");

      try {
        const birthday = getBirthdayHeight();

        // 1. Initialize Scanner Session
        // Use provided birthday height if available, otherwise default logic inside initScanner
        await initScanner(viewingKey, birthday || undefined);

        // 2. Start Sync
        await startSync();

        // Poll for sync completion
        let isSyncing = true;
        while (isSyncing) {
          try {
            const status = await getSyncStatus();
            // Update sync status in UI
            if (status) {
              const isCompleted =
                status.status === "complete" &&
                status.percent_scanned === 100.0;

              // Update internal loop flag
              isSyncing = !isCompleted;

              // Update UI state
              setIsSyncing(!isCompleted);

              // Map new fields
              if (status.percent_scanned !== undefined) {
                setSyncProgress(status.percent_scanned);
              }
              if (status.blocks_scanned !== undefined) {
                // If currentHeight is not accurate from other fields, use blocks_scanned as relative or absolute
                // Ideally the API would give current_block. If not, we might trust blocks_scanned if it represents height
                // But based on "blocks_scanned: 0", it might be a count.
                // Let's rely on percent_scanned for the bar.
              }

              // Check for not_running status indicating session death
              if (status.status === "not_running") {
                console.warn(
                  "Scanner unexpectedly stopped. Reloading to restart session..."
                );
                window.location.reload();
                return;
              }

              if (status.status === "error" || status.error) {
                console.error("Sync error:", status.error);
                break;
              }
            }
          } catch (e) {
            console.warn("Error polling sync status:", e);
            // Don't break immediately on network glitch, maybe retry
          }

          if (isSyncing) {
            await new Promise((resolve) => setTimeout(resolve, 2000)); // Poll every 2s
          }
        }

        // 3. Get Overview Data
        const response = await getOverview();

        let newBalance: WalletBalance | null = null;
        if (response && response.balances) {
          newBalance = {
            total:
              (response.balances.sapling_balance +
                response.balances.orchard_balance +
                response.balances.transparent_balance) /
              100000000,
            shielded:
              (response.balances.sapling_balance +
                response.balances.orchard_balance) /
              100000000,
            transparent: response.balances.transparent_balance / 100000000,
            sapling: response.balances.sapling_balance / 100000000,
            orchard: response.balances.orchard_balance / 100000000,
            pending: 0,
          };
          setScannerBalance(newBalance);
        }

        let sortedTxs: DecryptedTransaction[] = [];
        if (response && response.transactions) {
          const newTxs: DecryptedTransaction[] = response.transactions.map(
            (r: ScannerTxReport) => {
              const isIncoming = r.kind === "Received";
              const amount = r.value / 100000000;
              let date = new Date();
              try {
                date = new Date(r.datetime);
                if (isNaN(date.getTime())) date = new Date();
              } catch (e) {}

              return {
                txid: r.txid,
                timestamp: date,
                amount: isIncoming ? amount : -amount,
                memo:
                  r.memos && r.memos.length > 0
                    ? r.memos
                        .map((m) =>
                          typeof m === "string" ? m : JSON.stringify(m, null, 2)
                        )
                        .join("\n\n")
                    : (r as any).memo
                    ? typeof (r as any).memo === "string"
                      ? (r as any).memo
                      : JSON.stringify((r as any).memo, null, 2)
                    : "",
                type: isIncoming ? "incoming" : "outgoing",
                pool: "orchard", // Default to orchard/shielded
                height: 0,
                fee: r.fee ? r.fee / 100000000 : 0,
              };
            }
          );

          sortedTxs = newTxs.sort(
            (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
          );

          setTransactions(sortedTxs);

          // Cache the result
          if (viewingKey) {
            try {
              const cacheData = {
                transactions: sortedTxs,
                scannerBalance: newBalance,
                lastUpdated: new Date(),
              };
              localStorage.setItem(
                `zcash_wallet_cache_v2_${viewingKey}`,
                JSON.stringify(cacheData)
              );
            } catch (e) {
              console.error("Failed to save wallet cache", e);
            }
          }
        }

        // Final sync status check (already updated in loop, but ensuring consistency)
        setLastUpdated(new Date());
      } catch (err) {
        console.error("Error loading wallet data:", err);
        if (!isBackground) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load wallet data from scanner API."
          );
        }
      } finally {
        setIsLoading(false);
        loadingRef.current = false;
        setIsSyncing(false);
        if (typeof setSyncMessage === "function") setSyncMessage("Synced");
      }
    },
    [viewingKey, isConnected, getBirthdayHeight]
  );

  const refresh = useCallback(() => {
    // Public refresh method forces a background reload
    loadWalletData(true);
  }, [loadWalletData]);

  // Ref to track which key we have currently loaded/synced to avoid loops
  const loadedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    // If viewing key changes, try to load from cache first
    if (!viewingKey || !isConnected) {
      setTransactions([]);
      setScannerBalance(null);
      loadedKeyRef.current = null;
      return;
    }

    // prevent double-firing if key hasn't changed
    if (loadedKeyRef.current === viewingKey) {
      return;
    }

    loadedKeyRef.current = viewingKey;
    loadingRef.current = false;

    if (viewingKey) {
      const cacheKey = `zcash_wallet_cache_v2_${viewingKey}`;
      const cachedStr = localStorage.getItem(cacheKey);
      let loadedFromCache = false;
      let shouldSync = true;

      if (cachedStr) {
        try {
          const cached = JSON.parse(cachedStr);
          // Hydrate Dates
          if (cached.transactions) {
            const hydratedTxs = cached.transactions.map((t: any) => ({
              ...t,
              timestamp: new Date(t.timestamp),
            }));
            setTransactions(hydratedTxs);
          }
          if (cached.scannerBalance) {
            setScannerBalance(cached.scannerBalance);
          }
          if (cached.lastUpdated) {
            const lastUpdateDate = new Date(cached.lastUpdated);
            setLastUpdated(lastUpdateDate);

            // Check if cache is fresh (less than 2 minutes old)
            const now = new Date();
            const diff = now.getTime() - lastUpdateDate.getTime();
            if (diff < 2 * 60 * 1000) {
              shouldSync = false;
            }
          }

          setIsLoading(false); // Show cached data immediately
          loadedFromCache = true;
        } catch (e) {
          console.error("Failed to load cache:", e);
        }
      }

      if (loadedFromCache) {
        if (shouldSync) {
          loadWalletData(true);
        }
      } else {
        // No cache, full load
        setTransactions([]);
        setScannerBalance(null);
        loadWalletData(false);
      }
    }
  }, [viewingKey, isConnected, loadWalletData]);

  // Periodically fetch network height
  useEffect(() => {
    if (!isConnected) return;
    const fetchHeight = async () => {
      try {
        const height = await lightwalletd.getLatestBlockHeight();
        setNetworkHeight(height);
      } catch (err) {
        console.error("Failed to fetch network height:", err);
      }
    };
    fetchHeight();
    const interval = setInterval(fetchHeight, 30000);
    return () => clearInterval(interval);
  }, [isConnected]);

  // Automatic background sync every 2 minutes
  useEffect(() => {
    if (!isConnected || !viewingKey) return;

    // Initial load handled by separate effect.
    // This interval just keeps it fresh.
    const interval = setInterval(() => {
      loadWalletData(true);
    }, 2 * 60 * 1000); // 2 minutes

    return () => clearInterval(interval);
  }, [isConnected, viewingKey, loadWalletData]);

  const value: WalletData = {
    transactions,
    balance,
    scannerBalance,
    analytics,
    viewingKeyInfo,
    isLoading,
    error,
    lastUpdated,
    refresh,
    syncStatus,
  };

  return (
    <WalletDataContext.Provider value={value}>
      {children}
    </WalletDataContext.Provider>
  );
}

export function useWalletContext() {
  const context = useContext(WalletDataContext);
  if (!context) {
    throw new Error(
      "useWalletContext must be used within a WalletDataProvider"
    );
  }
  return context;
}
