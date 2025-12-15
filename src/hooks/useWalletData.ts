import { useMemo } from "react";
import { useWalletContext, WalletData } from "@/contexts/WalletDataContext";
import { DecryptedTransaction } from "@/lib/zcash-crypto";

export function useWalletData(): WalletData {
  // Proxy to context
  const context = useWalletContext();
  return context;
}

// Transaction filtering hook (logic remains local as it's derived view)
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
  // Logic copied from previous implementation or just keep it
  // Actually, I can just copy the previous implementation of useFilteredTransactions here
  // since `useWalletData` is now just a context consumer.

  // NOTE: React hooks rules say useMemo must be inside component/hook
  // So we re-export the helper hooks

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
