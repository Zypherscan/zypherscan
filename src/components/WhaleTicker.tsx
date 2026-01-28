import { useEffect, useState } from "react";
import { Block, NetworkStats, ShieldedTransaction } from "@/hooks/useZcashAPI";
import {
  Zap,
  Box,
  ArrowRightLeft,
  ShieldAlert,
  BadgeDollarSign,
  Siren,
} from "lucide-react";

interface WhaleTickerProps {
  blocks: Block[];
  stats: NetworkStats | null;
  transactions?: ShieldedTransaction[];
}

export const WhaleTicker = ({
  blocks,
  stats,
  transactions = [],
}: WhaleTickerProps) => {
  const [items, setItems] = useState<string[]>([]);

  useEffect(() => {
    if (!blocks || blocks.length === 0) return;

    const newItems: { label: string; type: string; height: number }[] = [];

    // 1. Latest Block Info & Highest Value
    const latestBlock = blocks[0];
    if (latestBlock) {
      const blockVal =
        typeof latestBlock.value === "string"
          ? parseFloat(latestBlock.value)
          : latestBlock.value || 0;
      const normalizedBlockVal =
        blockVal > 100000000 ? blockVal / 100000000 : blockVal;

      let blockLabel = `LATEST BLOCK: #${latestBlock.height}`;
      if (normalizedBlockVal > 0) {
        blockLabel += ` (Max Tx: ${normalizedBlockVal.toLocaleString(undefined, { maximumFractionDigits: 2 })} ZEC)`;
      }
      newItems.push({
        label: blockLabel,
        type: "block",
        height: latestBlock.height,
      });
    }

    // 2. Network Info (from stats)
    if (stats) {
      if (stats.mining && stats.mining.avgBlockTime) {
        newItems.push({
          label: `AVG BLOCK TIME: ${stats.mining.avgBlockTime.toFixed(1)}s`,
          type: "stat",
          height: 0,
        });
      }
      newItems.push({
        label: `N/W HASH RATE: ${(stats.hashrate / 1000000000).toFixed(2)} GS/s`,
        type: "stat",
        height: 0,
      });
      newItems.push({
        label: `SHIELDED POOL: ${(stats.supply.totalShielded / 1000000).toFixed(2)}M ZEC`,
        type: "stat",
        height: 0,
      });
      newItems.push({
        label: `SHIELDED PERCENTAGE: ${stats.supply.shieldedPercentage.toFixed(2)}%`,
        type: "stat",
        height: 0,
      });
    }

    // 3. Whale & Shielded Alerts (from transactions)
    if (transactions && transactions.length > 0) {
      transactions.slice(0, 3).forEach((tx: any) => {
        const rawVal =
          tx.value || tx.amount || tx.valueBalance || tx.value_balance || 0;
        const val = typeof rawVal === "string" ? parseFloat(rawVal) : rawVal;
        const normalizedVal = val > 100000000 ? val / 100000000 : val;

        if (normalizedVal >= 1000) {
          newItems.push({
            label: `🚨 MEGA WHALE ALERT: ${normalizedVal.toLocaleString(undefined, { maximumFractionDigits: 2 })} ZEC`,
            type: "whale-mega",
            height: 0,
          });
        } else if (normalizedVal >= 500) {
          newItems.push({
            label: `🐋 WHALE ALERT: ${normalizedVal.toLocaleString(undefined, { maximumFractionDigits: 2 })} ZEC`,
            type: "whale",
            height: 0,
          });
        } else if (normalizedVal >= 100) {
          newItems.push({
            label: `🛡️ SHIELDED ALERT: ${normalizedVal.toLocaleString(undefined, { maximumFractionDigits: 2 })} ZEC`,
            type: "shielded",
            height: 0,
          });
        }
      });
    }

    setItems(newItems.map((i) => i.label));
  }, [blocks, stats, transactions]);

  if (items.length === 0) return null;

  return (
    <div className="w-full bg-accent/5 border-y border-accent/10 overflow-hidden h-8 flex items-center">
      <div className="animate-marquee whitespace-nowrap flex items-center gap-12 text-xs font-mono text-muted-foreground">
        {items.map((item, i) => (
          <span key={i} className="flex items-center gap-2">
            {item.includes("MEGA") || item.includes("🚨") ? (
              <Siren className="w-3 h-3 text-destructive animate-pulse" />
            ) : item.includes("WHALE ALERT") || item.includes("🐋") ? (
              <BadgeDollarSign className="w-3 h-3 text-yellow-400" />
            ) : item.includes("SHIELDED ALERT") || item.includes("🛡️") ? (
              <ShieldAlert className="w-3 h-3 text-terminal-green" />
            ) : item.includes("HASH RATE") ? (
              <ArrowRightLeft className="w-3 h-3 text-terminal-green" />
            ) : item.includes("BLOCK") ? (
              <Box className="w-3 h-3 text-accent" />
            ) : (
              <Zap className="w-3 h-3 text-accent" />
            )}
            <span
              className={
                item.includes("MEGA") || item.includes("🚨")
                  ? "text-destructive font-bold"
                  : item.includes("WHALE ALERT") || item.includes("🐋")
                    ? "text-yellow-400 font-bold"
                    : item.includes("SHIELDED ALERT")
                      ? "text-terminal-green font-bold"
                      : "text-muted-foreground"
              }
            >
              {item}
            </span>
          </span>
        ))}
        {/* Duplicate for seamless loop */}
        {items.map((item, i) => (
          <span key={`dup-${i}`} className="flex items-center gap-2">
            {item.includes("MEGA") || item.includes("🚨") ? (
              <Siren className="w-3 h-3 text-destructive animate-pulse" />
            ) : item.includes("WHALE ALERT") || item.includes("🐋") ? (
              <BadgeDollarSign className="w-3 h-3 text-yellow-400" />
            ) : item.includes("SHIELDED ALERT") || item.includes("🛡️") ? (
              <ShieldAlert className="w-3 h-3 text-terminal-green" />
            ) : item.includes("HASH RATE") ? (
              <ArrowRightLeft className="w-3 h-3 text-terminal-green" />
            ) : item.includes("BLOCK") ? (
              <Box className="w-3 h-3 text-accent" />
            ) : (
              <Zap className="w-3 h-3 text-accent" />
            )}
            <span
              className={
                item.includes("MEGA") || item.includes("🚨")
                  ? "text-destructive font-bold"
                  : item.includes("WHALE ALERT") || item.includes("🐋")
                    ? "text-yellow-400 font-bold"
                    : item.includes("SHIELDED ALERT")
                      ? "text-terminal-green font-bold"
                      : "text-muted-foreground"
              }
            >
              {item}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
};
