import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Clock, RefreshCw, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ShieldedTransaction {
  txid: string;
  type: "partial" | "fully-shielded" | "mixed";
  hasOrchard?: boolean;
  hasSapling?: boolean;
  orchardActions?: number;
  shieldedSpends?: number;
  shieldedOutputs?: number;
  timestamp: number;
  block_height?: number;
  fee?: number;
}

const formatTime = (timestamp: number) => {
  const now = Date.now();
  const diff = now - timestamp * 1000;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

const getTransactionTypeInfo = (tx: ShieldedTransaction) => {
  // Match Cipherscan's labeling
  if (tx.type === "fully-shielded") {
    return {
      label: "Fully Shielded",
      className:
        "bg-terminal-green/20 text-terminal-green border-terminal-green/30",
    };
  } else if (tx.type === "partial") {
    return {
      label: "MIXED",
      className: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
    };
  } else {
    return {
      label: tx.type.toUpperCase(),
      className: "bg-blue-500/20 text-blue-500 border-blue-500/30",
    };
  }
};

const getPoolInfo = (tx: ShieldedTransaction) => {
  const pools = [];
  if (tx.hasOrchard) pools.push("Orchard");
  if (tx.hasSapling) pools.push("Sapling");
  return pools.length > 0 ? pools.join(" + ") : null;
};

import { useZcashAPI } from "@/hooks/useZcashAPI";

export const ShieldedActivityList = () => {
  const [transactions, setTransactions] = useState<ShieldedTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { getRecentShieldedTransactions } = useZcashAPI();

  const fetchTxs = useCallback(
    async (forceRefresh = false) => {
      if (forceRefresh) setRefreshing(true);

      try {
        const data: any[] = await getRecentShieldedTransactions(5);

        if (data) {
          const shieldedTxs = data.map((tx: any) => ({
            txid: tx.txid,
            type: tx.type || "partial",
            hasOrchard: tx.hasOrchard,
            hasSapling: tx.hasSapling,
            orchardActions: tx.orchardActions,
            shieldedSpends: tx.shieldedSpends,
            shieldedOutputs: tx.shieldedOutputs,
            timestamp: tx.blockTime || tx.time || Date.now() / 1000,
            block_height: tx.blockHeight || tx.height,
            fee: tx.fee,
          }));
          setTransactions(shieldedTxs);
        }
      } catch (error) {
        console.error("Failed to fetch shielded transactions:", error);
      } finally {
        if (forceRefresh) setRefreshing(false);
        setLoading(false);
      }
    },
    [getRecentShieldedTransactions]
  );

  useEffect(() => {
    fetchTxs();
    const interval = setInterval(() => fetchTxs(true), 30000);
    return () => clearInterval(interval);
  }, [fetchTxs]);

  if (loading) {
    return (
      <div className="space-y-4 min-h-[600px] flex flex-col">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-terminal-green" />
            Shielded Activity
          </h2>
        </div>
        <div className="grid gap-4 flex-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 min-h-[600px] flex flex-col">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="w-6 h-6 text-terminal-green" />
          Shielded Activity
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchTxs(true)}
          disabled={refreshing}
          className="border-accent/30"
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 flex-1">
        {transactions.map((tx) => (
          <Link key={tx.txid} to={`/tx/${tx.txid}`}>
            <Card className="card-glow bg-card/50 backdrop-blur-sm p-4 hover:bg-card/70 transition-all cursor-pointer border-accent/10 group">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center justify-center w-12 h-12 rounded-full bg-terminal-green/10 border border-terminal-green/20 group-hover:bg-terminal-green/20 transition-colors shrink-0">
                    <Shield className="w-6 h-6 text-terminal-green" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-semibold text-foreground">
                        {tx.txid.slice(0, 10)}...{tx.txid.slice(-10)}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {formatTime(tx.timestamp)}
                      </div>
                    </div>

                    <p className="font-mono text-xs text-muted-foreground truncate opacity-70 mb-2">
                      {tx.txid}
                    </p>

                    <div className="flex flex-wrap gap-3 text-xs">
                      {(() => {
                        const typeInfo = getTransactionTypeInfo(tx);
                        return (
                          <Badge
                            variant="outline"
                            className={`h-5 px-1.5 font-normal ${typeInfo.className}`}
                          >
                            {typeInfo.label}
                          </Badge>
                        );
                      })()}
                      {getPoolInfo(tx) && (
                        <span className="text-muted-foreground self-center">
                          {getPoolInfo(tx)}
                        </span>
                      )}
                      {tx.block_height && (
                        <span className="text-muted-foreground self-center">
                          Block #{tx.block_height.toLocaleString()}
                        </span>
                      )}
                      {tx.orchardActions !== undefined &&
                        tx.orchardActions > 0 && (
                          <span className="text-muted-foreground self-center">
                            {tx.orchardActions} Orchard
                          </span>
                        )}
                    </div>
                  </div>
                </div>

                <ArrowRight className="w-5 h-5 text-accent hidden md:block opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Card>
          </Link>
        ))}

        {transactions.length === 0 && (
          <Card className="p-8 text-center text-muted-foreground">
            <p>No recent shielded transactions found.</p>
          </Card>
        )}
      </div>
    </div>
  );
};
