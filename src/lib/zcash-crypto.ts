// Utility types and functions for ZCash wallet data
export interface DecryptedTransaction {
  txid: string;
  timestamp: Date;
  amount: number;
  memo?: string;
  type: "incoming" | "outgoing" | "internal";
  pool?: "sapling" | "orchard" | "transparent";
  height: number;
  address?: string;
  fee?: number;
  confirmations?: number;
}

export const formatZEC = (value: number | undefined | null): string => {
  if (value === undefined || value === null) return "0.00";
  // Assuming input is already in ZEC units (e.g. 1.25)
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
  });
};

export interface WalletBalance {
  total: number;
  shielded: number;
  transparent: number;
  sapling: number;
  orchard: number;
  pending: number;
}

export interface ViewingKeyInfo {
  network: "mainnet" | "testnet";
  type: "unified" | "sapling" | "orchard";
  components: {
    hasOrchard: boolean;
    hasSapling: boolean;
    hasTransparent: boolean;
  };
}

export const parseViewingKey = (key: string): ViewingKeyInfo => {
  // Simple check for now based on prefix
  if (key.startsWith("uview")) {
    return {
      network: "mainnet",
      type: "unified",
      components: { hasOrchard: true, hasSapling: true, hasTransparent: true },
    };
  } else if (key.startsWith("zview")) {
    return {
      network: "mainnet",
      type: "sapling",
      components: {
        hasOrchard: false,
        hasSapling: true,
        hasTransparent: false,
      },
    };
  }
  return {
    network: "mainnet",
    type: "unified",
    components: { hasOrchard: true, hasSapling: true, hasTransparent: true },
  };
};

export const calculateBalance = (
  transactions: DecryptedTransaction[]
): WalletBalance => {
  let total = 0;
  // This is a naive calculation based on transaction history if balance isn't provided by scanner
  // Real balance should come from scanner-api response
  transactions.forEach((tx) => {
    total += tx.amount;
  });

  return {
    total,
    shielded: total, // Default assumption if pools not separated
    transparent: 0,
    sapling: 0,
    orchard: 0,
    pending: 0,
  };
};

export const generateAnalytics = (transactions: DecryptedTransaction[]) => {
  if (!transactions.length) return null;

  const totalTransactions = transactions.length;
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const weeklyTransactions = transactions.filter(
    (tx) => tx.timestamp >= weekAgo
  ).length;

  const totalVolume = transactions.reduce(
    (acc, tx) => acc + Math.abs(tx.amount),
    0
  );
  const averageTransactionSize = totalVolume / totalTransactions;

  const totalFees = transactions.reduce((acc, tx) => acc + (tx.fee || 0), 0);

  const totalReceived = transactions
    .filter((tx) => tx.type === "incoming")
    .reduce((acc, tx) => acc + tx.amount, 0);

  const totalSent = transactions
    .filter((tx) => tx.type === "outgoing")
    .reduce((acc, tx) => acc + Math.abs(tx.amount), 0);

  // Activity map for most active day
  // Activity map for most active day (specific date)
  const activityMap = new Map<string, number>();
  const dateObjMap = new Map<string, Date>();

  transactions.forEach((tx) => {
    // Use toDateString for unique daily accounting (e.g., "Wed Dec 04 2025")
    const dateKey = tx.timestamp.toDateString();
    activityMap.set(dateKey, (activityMap.get(dateKey) || 0) + 1);
    if (!dateObjMap.has(dateKey)) {
      dateObjMap.set(dateKey, tx.timestamp);
    }
  });

  let mostActiveDay = "N/A";
  let maxActivity = 0;

  activityMap.forEach((count, key) => {
    if (count > maxActivity) {
      maxActivity = count;
      const dateObj = dateObjMap.get(key);
      if (dateObj) {
        // Format: "Wednesday (3 Dec 2025)"
        const weekday = dateObj.toLocaleDateString(undefined, {
          weekday: "long",
        });
        const datePart = dateObj.toLocaleDateString(undefined, {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
        mostActiveDay = `${weekday} (${datePart})`;
      }
    }
  });

  // Daily Volume
  const volumeMap = new Map<string, { incoming: number; outgoing: number }>();
  transactions.forEach((tx) => {
    const dateStr = tx.timestamp.toISOString().split("T")[0];
    if (!volumeMap.has(dateStr)) {
      volumeMap.set(dateStr, { incoming: 0, outgoing: 0 });
    }
    const entry = volumeMap.get(dateStr)!;
    // Store in zatoshis because AnalyticsCharts divides by 10^8
    if (tx.type === "incoming") entry.incoming += tx.amount * 100000000;
    if (tx.type === "outgoing")
      entry.outgoing += Math.abs(tx.amount) * 100000000;
  });

  const dailyVolume = Array.from(volumeMap.entries())
    .map(([date, vol]) => ({
      date,
      incoming: vol.incoming,
      outgoing: vol.outgoing,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Pool Distribution
  let saplingPool = 0;
  let orchardPool = 0;
  transactions.forEach((tx) => {
    if (tx.pool === "sapling") saplingPool++;
    if (tx.pool === "orchard") orchardPool++;
  });

  // Tx Types
  let incomingCount = 0;
  let outgoingCount = 0;
  let internalCount = 0;
  transactions.forEach((tx) => {
    if (tx.type === "incoming") incomingCount++;
    if (tx.type === "outgoing") outgoingCount++;
    if (tx.type === "internal") internalCount++;
  });

  return {
    totalTransactions,
    weeklyTransactions,
    averageTransactionSize,
    mostActiveDay,
    totalFees,
    totalReceived,
    totalSent,
    dailyVolume,
    poolDistribution: {
      sapling: saplingPool,
      orchard: orchardPool,
    },
    txTypes: {
      incoming: incomingCount,
      outgoing: outgoingCount,
      internal: internalCount,
    },
    totalVolume,
    activity: [], // Deprecated but kept for type safety if needed
  };
};
