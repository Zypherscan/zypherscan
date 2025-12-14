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
import { scanWallet } from "@/lib/scanner-api";
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

  const syncStatus = useMemo(() => {
    if (!isConnected) {
      return {
        currentHeight: 0,
        networkHeight: 0,
        isSyncing: false,
        message: "Not connected",
      };
    }

    if (isSyncing) {
      return {
        currentHeight: 0,
        networkHeight,
        isSyncing: true,
        message: syncMessage || `Syncing with blockchain...`,
      };
    }

    return {
      currentHeight: networkHeight,
      networkHeight,
      isSyncing: false,
      message:
        transactions.length > 0
          ? `Synced. Found ${transactions.length} transactions.`
          : "Synced. No transactions found.",
    };
  }, [isConnected, isSyncing, networkHeight, transactions.length]);

  const loadWalletData = useCallback(
    async (isBackground = false) => {
      if (!viewingKey || !isConnected || loadingRef.current) {
        return;
      }

      loadingRef.current = true;
      // Only set FULL loading if not background refresh
      if (!isBackground) {
        setIsLoading(true);
        setError(null);
      }
      // Always set syncing state for UI feedback
      setIsSyncing(true);
      if (typeof setSyncMessage === "function") setSyncMessage("Syncing...");

      try {
        const birthday = getBirthdayHeight();
        console.log(
          `[WalletContext] Starting ${
            isBackground ? "background" : "initial"
          } scan...`
        );

        const response = await scanWallet(viewingKey, birthday, "all");
        console.log("[WalletContext] Scanner Response:", response);

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
        if (response && response.history) {
          const newTxs: DecryptedTransaction[] = response.history.map(
            (r: any) => {
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
                memo: r.memos ? r.memos.join("\n") : "",
                type: isIncoming ? "incoming" : "outgoing",
                pool: "orchard", // Scanner doesn't report pool per-tx yet easily, default to orchard for now
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
                scannerBalance: newBalance, // Use new balance if available
                lastUpdated: new Date(),
              };
              localStorage.setItem(
                `zcash_wallet_cache_${viewingKey}`,
                JSON.stringify(cacheData)
              );
            } catch (e) {
              console.error("Failed to save wallet cache", e);
            }
          }
        }

        setLastUpdated(new Date());
      } catch (err) {
        console.error("Error loading wallet data:", err);
        // Only show error if hard failure on initial load?
        // Or set error state but keep old data?
        if (!isBackground) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load wallet data from local scanner."
          );
        }
      } finally {
        setIsLoading(false);
        loadingRef.current = false;
        setIsSyncing(false);
        if (typeof setSyncMessage === "function") setSyncMessage("Synced");
      }
    },
    [viewingKey, isConnected, getBirthdayHeight] // Dependencies
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
      const cacheKey = `zcash_wallet_cache_${viewingKey}`;
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
              console.log(
                `[WalletContext] Cache is fresh (${Math.round(
                  diff / 1000
                )}s old). Skipping initial background sync.`
              );
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
          console.log(
            "[WalletContext] Cache loaded but stale, starting background sync..."
          );
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
      console.log("[WalletContext] Triggering automatic background sync...");
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
