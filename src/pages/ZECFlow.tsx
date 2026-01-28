import { useEffect, useState } from "react";
import { useNetwork } from "@/contexts/NetworkContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowUpRight,
  ArrowDownRight,
  ArrowRightLeft,
  Activity,
  TrendingUp,
  Globe,
  Clock,
  ExternalLink,
  Zap,
} from "lucide-react";
import { formatZEC } from "@/lib/zcash-crypto";
import { cn } from "@/lib/utils";

interface FlowStat {
  chain: string;
  symbol: string;
  name: string;
  color: string;
  volumeUsd: number;
  volumeZec: number;
  count: number;
}

interface Swap {
  id: string;
  timestamp: number;
  fromChain: string;
  toChain: string;
  fromAmount: number;
  fromSymbol: string;
  toAmount: number;
  toSymbol: string;
  amountUsd: number;
  direction: "in" | "out";
  status: string;
}

interface CrossChainStats {
  success: boolean;
  totalVolume24h: number;
  totalInflow24h: number;
  totalOutflow24h: number;
  totalSwaps24h: number;
  inflows: FlowStat[];
  outflows: FlowStat[];
  recentSwaps: Swap[];
  lastUpdated: string;
  chainConfig: Record<string, { color: string; symbol: string; name: string }>;
}

const ZECFlow = () => {
  const { apiBase } = useNetwork();
  const [stats, setStats] = useState<CrossChainStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${apiBase}/crosschain/stats`);
        const data = await response.json();
        if (data.success) {
          setStats(data);
        } else {
          setError("Failed to load cross-chain data");
        }
      } catch (err) {
        setError("Network error fetching cross-chain stats");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const formatUsd = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-8 animate-pulse">
        <div className="space-y-4">
          <Skeleton className="h-10 w-48 bg-muted/40" />
          <Skeleton className="h-6 w-96 bg-muted/20" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton
              key={i}
              className="h-32 bg-card/40 border border-border/50"
            />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Skeleton className="h-96 bg-card/40 border border-border/50" />
          <Skeleton className="h-96 bg-card/40 border border-border/50" />
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center">
        <Activity className="w-16 h-16 text-destructive/50 mb-4" />
        <h2 className="text-2xl font-bold text-foreground mb-2">Sync Error</h2>
        <p className="text-muted-foreground">
          {error || "Could not retrieve stats"}
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8 space-y-8 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Globe className="w-8 h-8 text-accent" />
            <h1 className="text-3xl font-bold text-foreground">
              Cross-Chain Flow
            </h1>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            Real-time monitoring of Zcash (ZEC) flow across major ecosystems via
            cross-chain bridges and swaps.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground bg-card/50 px-3 py-1.5 rounded-full border border-white/10">
          <Clock className="w-3.5 h-3.5" />
          LAST UPDATED: {new Date(stats.lastUpdated).toLocaleTimeString()}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 bg-card/50 border border-accent/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp className="w-12 h-12" />
          </div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
            Total Volume (24h)
          </p>
          <p className="text-3xl font-bold text-foreground">
            {formatUsd(stats.totalVolume24h)}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <Badge className="bg-accent/10 text-accent border-accent/20 text-[9px] font-bold">
              {stats.totalSwaps24h} SWAPS
            </Badge>
          </div>
        </Card>

        <Card className="p-6 bg-card/50 border border-accent/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-terminal-green">
            <ArrowDownRight className="w-12 h-12" />
          </div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
            Total Inflow (24h)
          </p>
          <p className="text-3xl font-bold text-terminal-green">
            {formatUsd(stats.totalInflow24h)}
          </p>
          <div className="h-1 w-full bg-white/5 mt-4 rounded-full overflow-hidden">
            <div
              className="h-full bg-terminal-green shadow-[0_0_8px_rgba(0,255,153,0.5)]"
              style={{
                width: `${(stats.totalInflow24h / stats.totalVolume24h) * 100}%`,
              }}
            />
          </div>
        </Card>

        <Card className="p-6 bg-card/50 border border-accent/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-red-500">
            <ArrowUpRight className="w-12 h-12" />
          </div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
            Total Outflow (24h)
          </p>
          <p className="text-3xl font-bold text-red-500">
            {formatUsd(stats.totalOutflow24h)}
          </p>
          <div className="h-1 w-full bg-white/5 mt-4 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
              style={{
                width: `${(stats.totalOutflow24h / stats.totalVolume24h) * 100}%`,
              }}
            />
          </div>
        </Card>

        <Card className="p-6 bg-card/50 border border-accent/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-terminal-cyan">
            <ArrowRightLeft className="w-12 h-12" />
          </div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
            Avg Swap Size
          </p>
          <p className="text-3xl font-bold text-accent">
            {formatUsd(stats.totalVolume24h / stats.totalSwaps24h)}
          </p>
          <p className="text-[10px] text-muted-foreground mt-2 font-mono uppercase tracking-tighter italic">
            Normalized across chains
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Inflows breakdown */}
        <Card className="bg-card/50 border border-accent/10 overflow-hidden">
          <div className="p-6 border-b border-border bg-accent/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-terminal-green animate-pulse" />
              <h3 className="font-bold text-foreground flex items-center gap-2 uppercase tracking-wide">
                Incoming ZEC Flow{" "}
                <span className="text-xs text-muted-foreground font-normal">
                  (by Chain)
                </span>
              </h3>
            </div>
            <ArrowDownRight className="w-4 h-4 text-terminal-green" />
          </div>
          <div className="p-0">
            {stats.inflows.map((item, idx) => (
              <div
                key={item.chain}
                className={cn(
                  "p-4 flex items-center justify-between hover:bg-white/5 transition-colors border-b border-white/5 last:border-0",
                  "relative group",
                )}
              >
                <div className="flex items-center gap-4 z-10">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: item.color }}
                  >
                    {item.symbol[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground leading-tight">
                      {item.name}
                    </h4>
                    <p className="text-xs text-muted-foreground font-mono">
                      {item.count} Swaps
                    </p>
                  </div>
                </div>
                <div className="text-right z-10">
                  <p className="font-bold text-terminal-green">
                    {formatUsd(item.volumeUsd)}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {item.volumeZec.toFixed(2)} ZEC
                  </p>
                </div>
                {/* Visual percentage background */}
                <div
                  className="absolute left-0 top-0 bottom-0 opacity-5 pointer-events-none transition-all group-hover:opacity-10"
                  style={{
                    backgroundColor: item.color,
                    width: `${(item.volumeUsd / stats.totalInflow24h) * 100}%`,
                  }}
                />
              </div>
            ))}
          </div>
        </Card>

        {/* Outflows breakdown */}
        <Card className="bg-card/50 border border-accent/10 overflow-hidden">
          <div className="p-6 border-b border-border bg-accent/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <h3 className="font-bold text-foreground flex items-center gap-2 uppercase tracking-wide">
                Outgoing ZEC Flow{" "}
                <span className="text-xs text-muted-foreground font-normal">
                  (by Chain)
                </span>
              </h3>
            </div>
            <ArrowUpRight className="w-4 h-4 text-red-500" />
          </div>
          <div className="p-0">
            {stats.outflows.map((item, idx) => (
              <div
                key={item.chain}
                className={cn(
                  "p-4 flex items-center justify-between hover:bg-white/5 transition-colors border-b border-white/5 last:border-0",
                  "relative group",
                )}
              >
                <div className="flex items-center gap-4 z-10">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: item.color }}
                  >
                    {item.symbol[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground leading-tight">
                      {item.name}
                    </h4>
                    <p className="text-xs text-muted-foreground font-mono">
                      {item.count} Swaps
                    </p>
                  </div>
                </div>
                <div className="text-right z-10">
                  <p className="font-bold text-red-400">
                    {formatUsd(item.volumeUsd)}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {item.volumeZec.toFixed(2)} ZEC
                  </p>
                </div>
                <div
                  className="absolute left-0 top-0 bottom-0 opacity-5 pointer-events-none transition-all group-hover:opacity-10"
                  style={{
                    backgroundColor: item.color,
                    width: `${(item.volumeUsd / stats.totalOutflow24h) * 100}%`,
                  }}
                />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Swaps */}
      <Card className="bg-card/50 border border-accent/10 overflow-hidden">
        <div className="p-6 border-b border-border bg-accent/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-accent" />
            <h3 className="font-bold text-foreground uppercase tracking-wide">
              Recent Cross-Chain Swaps
            </h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-muted-foreground border-b border-border bg-accent/5 font-mono text-xs uppercase tracking-widest">
              <tr>
                <th className="p-4">Transaction ID</th>
                <th className="p-4 text-center">Route</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Time</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentSwaps.map((swap) => (
                <tr
                  key={swap.id}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors group"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-mono text-accent truncate max-w-[120px]">
                        {swap.id}
                      </p>
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-50" />
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold text-white shadow-lg"
                          style={{
                            backgroundColor:
                              stats.chainConfig[swap.fromChain]?.color ||
                              "#888",
                          }}
                        >
                          {swap.fromChain.substring(0, 2).toUpperCase()}
                        </div>
                        <p className="text-[10px] mt-1 text-muted-foreground font-mono">
                          {swap.fromChain}
                        </p>
                      </div>
                      <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
                      <div className="flex flex-col items-center">
                        <div
                          className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold text-white shadow-lg"
                          style={{
                            backgroundColor:
                              stats.chainConfig[swap.toChain]?.color || "#888",
                          }}
                        >
                          {swap.toChain.substring(0, 2).toUpperCase()}
                        </div>
                        <p className="text-[10px] mt-1 text-muted-foreground font-mono">
                          {swap.toChain}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="text-sm font-bold text-foreground">
                      {swap.toAmount.toFixed(4)} {swap.toSymbol}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {formatUsd(swap.amountUsd)}
                    </p>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground font-mono">
                    {getTimeAgo(swap.timestamp)}
                  </td>
                  <td className="p-4">
                    <Badge
                      className={cn(
                        "text-[10px] px-2 py-0 border-none font-bold",
                        swap.status === "SUCCESS"
                          ? "bg-terminal-green/20 text-terminal-green"
                          : "bg-yellow-500/20 text-yellow-500",
                      )}
                    >
                      {swap.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default ZECFlow;
