import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAuth } from "./useAuth";
import {
  DecryptedTransaction,
  WalletBalance,
  calculateBalance,
  generateAnalytics,
  parseViewingKey,
  ViewingKeyInfo,
  initZcashWasm,
  isWasmLoaded,
} from "@/lib/zcash-crypto";
import { lightwalletd } from "@/lib/lightwalletd";

export interface WalletData {
  transactions: DecryptedTransaction[];
  balance: WalletBalance;
  analytics: ReturnType<typeof generateAnalytics> | null;
  viewingKeyInfo: ViewingKeyInfo | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => void;
  syncStatus: {
    isWasmReady: boolean;
    currentHeight: number;
    networkHeight: number;
    isSyncing: boolean;
    message: string;
  };
}

const emptyBalance: WalletBalance = {
  total: 0,
  shielded: 0,
  transparent: 0,
  sapling: 0,
  orchard: 0,
  pending: 0,
};

// Generate demo transactions for testing/demo purposes
function generateDemoTransactions(): DecryptedTransaction[] {
  const now = Date.now();
  const demoTxs: DecryptedTransaction[] = [];

  // Generate 10 sample transactions over the past month
  for (let i = 0; i < 10; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const amount = (Math.random() * 5 + 0.1).toFixed(8);
    const isIncoming = Math.random() > 0.3;

    demoTxs.push({
      txid: `demo${i}_${Math.random().toString(36).substring(7)}`,
      timestamp: new Date(now - daysAgo * 24 * 60 * 60 * 1000),
      amount: parseFloat(amount) * (isIncoming ? 1 : -1),
      memo: i % 3 === 0 ? `Demo transaction #${i + 1}` : "",
      type: isIncoming ? "incoming" : "outgoing",
      pool: "orchard",
      height: 3157000 + i * 100,
    });
  }

  return demoTxs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

export function useWalletData(): WalletData {
  const { viewingKey, isConnected, getBirthdayHeight } = useAuth();
  const [transactions, setTransactions] = useState<DecryptedTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [wasmReady, setWasmReady] = useState(false);
  const [networkHeight, setNetworkHeight] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentSyncHeight, setCurrentSyncHeight] = useState(0);
  const loadingRef = useRef(false); // Track if already loading

  const viewingKeyInfo = useMemo(() => {
    if (!viewingKey) return null;
    return parseViewingKey(viewingKey);
  }, [viewingKey]);

  const balance = useMemo(() => {
    return calculateBalance(transactions);
  }, [transactions]);

  const analytics = useMemo(() => {
    if (transactions.length === 0) return null;
    return generateAnalytics(transactions);
  }, [transactions]);

  const syncStatus = useMemo(() => {
    if (!isConnected) {
      return {
        isWasmReady: false,
        currentHeight: 0,
        networkHeight: 0,
        isSyncing: false,
        message: "Not connected",
      };
    }

    if (!wasmReady) {
      return {
        isWasmReady: false,
        currentHeight: 0,
        networkHeight,
        isSyncing: false,
        message:
          "WASM not loaded. Real wallet data requires librustzcash WASM bindings.",
      };
    }

    if (isSyncing) {
      const progress =
        networkHeight > 0 ? (currentSyncHeight / networkHeight) * 100 : 0;
      return {
        isWasmReady: true,
        currentHeight: currentSyncHeight,
        networkHeight,
        isSyncing: true,
        message: `Scanning blockchain: ${currentSyncHeight}/${networkHeight} (${progress.toFixed(
          2
        )}%)`,
      };
    }

    return {
      isWasmReady: true,
      currentHeight: networkHeight,
      networkHeight,
      isSyncing: false,
      message:
        transactions.length > 0
          ? `Found ${transactions.length} transactions`
          : "No transactions found for this viewing key",
    };
  }, [
    isConnected,
    wasmReady,
    isSyncing,
    networkHeight,
    currentSyncHeight,
    transactions.length,
  ]);

  const loadWalletData = useCallback(async () => {
    if (!viewingKey || !isConnected || loadingRef.current) {
      return;
    }

    loadingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      // Try to initialize WASM
      const wasmLoaded = await initZcashWasm();
      setWasmReady(wasmLoaded);

      // Get network height from lightwalletd
      const height = await lightwalletd.getLatestBlockHeight();
      setNetworkHeight(height);

      if (wasmLoaded) {
        // Start syncing from a reasonable height (e.g. Sapling activation or recent blocks)
        // For demo purposes, we'll scan the last 1000 blocks or from a known height
        // In production, this should be persisted or user-configurable
        const birthday = getBirthdayHeight();
        const lastSyncHeight = parseInt(
          localStorage.getItem(`zcash_last_sync_${viewingKey}`) || "0"
        );

        // Start syncing from last sync height (minus buffer) or birthday or default
        let startHeight = birthday || Math.max(0, height - 500000);

        if (lastSyncHeight > startHeight) {
          startHeight = Math.max(startHeight, lastSyncHeight - 100); // 100 block safety buffer
        }

        setIsSyncing(true);
        setCurrentSyncHeight(startHeight); // Initialize current sync height

        // Subscribe to progress
        lightwalletd.onSyncProgress((progress) => {
          if (progress.currentHeight > 0) {
            localStorage.setItem(
              `zcash_last_sync_${viewingKey}`,
              progress.currentHeight.toString()
            );
            setCurrentSyncHeight(progress.currentHeight);
          }

          if (progress.status === "complete" || progress.status === "error") {
            setIsSyncing(false);
          }
        });

        // Start the sync
        lightwalletd
          .startSync(startHeight, viewingKey, (tx) => {
            setTransactions((prev) => {
              // Avoid duplicates
              if (prev.some((t) => t.txid === tx.txid)) return prev;
              return [...prev, tx].sort(
                (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
              );
            });
          })
          .catch((err) => {
            console.error("Sync failed:", err);
            setTransactions(generateDemoTransactions());
            setIsSyncing(false);
          });
      } else {
        // WASM not available - load demo transactions
        setTransactions(generateDemoTransactions());
      }

      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error loading wallet data:", err);
      setTransactions(generateDemoTransactions());
      setError(
        err instanceof Error ? err.message : "Failed to load wallet data"
      );
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, [viewingKey, isConnected]); // Removed getBirthdayHeight from dependencies

  useEffect(() => {
    loadWalletData();
  }, [loadWalletData]);

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

    const interval = setInterval(fetchHeight, 30000);
    return () => clearInterval(interval);
  }, [isConnected]);

  return {
    transactions,
    balance,
    analytics,
    viewingKeyInfo,
    isLoading,
    error,
    lastUpdated,
    refresh: loadWalletData,
    syncStatus,
  };
}

// Transaction filtering hook
export function useFilteredTransactions(
  transactions: DecryptedTransaction[],
  filters: {
    type?: "incoming" | "outgoing" | "internal" | "all";
    pool?: "sapling" | "orchard" | "all";
    dateRange?: { start: Date; end: Date };
    minAmount?: number;
    maxAmount?: number;
    searchQuery?: string;
  }
) {
  return useMemo(() => {
    let filtered = [...transactions];

    if (filters.type && filters.type !== "all") {
      filtered = filtered.filter((tx) => tx.type === filters.type);
    }

    if (filters.pool && filters.pool !== "all") {
      filtered = filtered.filter((tx) => tx.pool === filters.pool);
    }

    if (filters.dateRange) {
      filtered = filtered.filter(
        (tx) =>
          tx.timestamp >= filters.dateRange!.start &&
          tx.timestamp <= filters.dateRange!.end
      );
    }

    if (filters.minAmount !== undefined) {
      filtered = filtered.filter((tx) => tx.amount >= filters.minAmount!);
    }

    if (filters.maxAmount !== undefined) {
      filtered = filtered.filter((tx) => tx.amount <= filters.maxAmount!);
    }

    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (tx) =>
          tx.txid.toLowerCase().includes(query) ||
          tx.memo?.toLowerCase().includes(query) ||
          tx.address?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [transactions, filters]);
}

// Transaction statistics hook
export function useTransactionStats(transactions: DecryptedTransaction[]) {
  return useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const todayTxs = transactions.filter((tx) => tx.timestamp >= today);
    const weekTxs = transactions.filter((tx) => tx.timestamp >= thisWeek);
    const monthTxs = transactions.filter((tx) => tx.timestamp >= thisMonth);

    const todayVolume = todayTxs.reduce((sum, tx) => sum + tx.amount, 0);
    const weekVolume = weekTxs.reduce((sum, tx) => sum + tx.amount, 0);
    const monthVolume = monthTxs.reduce((sum, tx) => sum + tx.amount, 0);

    return {
      today: { count: todayTxs.length, volume: todayVolume },
      week: { count: weekTxs.length, volume: weekVolume },
      month: { count: monthTxs.length, volume: monthVolume },
      total: {
        count: transactions.length,
        volume: transactions.reduce((sum, tx) => sum + tx.amount, 0),
      },
    };
  }, [transactions]);
}
