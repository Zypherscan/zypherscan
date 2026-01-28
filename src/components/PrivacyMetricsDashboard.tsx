import { Shield, Lock, Activity, Database, Blocks } from "lucide-react";
import { NetworkStats } from "@/hooks/useZcashAPI";
import { Skeleton } from "@/components/ui/skeleton";

interface PrivacyMetricsProps {
  stats: NetworkStats | null;
}

export const PrivacyMetricsDashboard = ({ stats }: PrivacyMetricsProps) => {
  if (!stats) {
    return (
      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 rounded-xl bg-card/50" />
        ))}
      </div>
    );
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 2,
    }).format(num);
  };

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-fade-in delay-100">
      {/* Block Height */}
      <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4 flex flex-col gap-2 hover:border-accent/50 transition-colors group">
        <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase font-bold tracking-wider">
          <Blocks className="w-3.5 h-3.5 group-hover:text-accent transition-colors" />
          <span>Network Height</span>
        </div>
        <div className="flex items-end gap-2">
          <span className="text-3xl font-bold font-mono text-foreground">
            {stats.height.toLocaleString()}
          </span>
        </div>
        <div className="w-full bg-muted/20 h-1 rounded-full mt-2 overflow-hidden">
          <div className="h-full bg-accent w-full animate-pulse" />
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          Latest Block Mined
        </div>
      </div>

      {/* Shielded Pool */}
      <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4 flex flex-col gap-2 hover:border-terminal-green/50 transition-colors group">
        <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase font-bold tracking-wider">
          <Lock className="w-3.5 h-3.5 group-hover:text-terminal-green transition-colors" />
          <span>Shielded Pool</span>
        </div>
        <div className="flex items-end gap-2">
          <span className="text-3xl font-bold font-mono text-terminal-green">
            {formatNumber(stats.supply.totalShielded)}
          </span>
          <span className="text-sm text-muted-foreground mb-1">ZEC</span>
        </div>
        <div className="w-full bg-muted/20 h-1 rounded-full mt-2 overflow-hidden">
          <div
            className="h-full bg-terminal-green"
            style={{ width: `${stats.supply.shieldedPercentage}%` }}
          />
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {stats.supply.shieldedPercentage.toFixed(1)}% of Supply Shielded
        </div>
      </div>

      {/* Shielded Txs Estimate */}
      <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4 flex flex-col gap-2 hover:border-terminal-green/50 transition-colors group">
        <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase font-bold tracking-wider">
          <Shield className="w-3.5 h-3.5 group-hover:text-terminal-green transition-colors" />
          <span>Shielded Txns</span>
        </div>
        <div className="flex items-end gap-2">
          <span className="text-3xl font-bold font-mono text-blue-400">
            ~{formatNumber(stats.blockchain.tx24h * 0.15)}
          </span>
          <span className="text-sm text-muted-foreground mb-1">24h</span>
        </div>
        <div className="text-xs text-muted-foreground mt-auto">
          Est. Shielded Activity (~15%)
        </div>
      </div>

      {/* Total Txs */}
      <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4 flex flex-col gap-2 hover:border-terminal-green/50 transition-colors group">
        <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase font-bold tracking-wider">
          <Database className="w-3.5 h-3.5 group-hover:text-terminal-green transition-colors" />
          <span>Total Txns</span>
        </div>
        <div className="flex items-end gap-2">
          <span className="text-3xl font-bold font-mono text-foreground">
            {formatNumber(stats.blockchain.tx24h)}
          </span>
          <span className="text-sm text-muted-foreground mb-1">24h</span>
        </div>
        <div className="text-xs text-muted-foreground mt-auto">
          Transactions in last 24 hours
        </div>
      </div>
    </div>
  );
};
