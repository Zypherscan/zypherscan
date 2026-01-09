import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useZcashAPI, NetworkStats } from "@/hooks/useZcashAPI";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Server,
  Globe,
  Database,
  Network,
  Shield,
  Zap,
  Box,
  Clock,
  Briefcase,
  TrendingUp,
  HardDrive,
  ArrowLeft,
} from "lucide-react";
import { useNetwork } from "@/contexts/NetworkContext";

// Helper to format large numbers
const formatNumber = (num: number, maximumFractionDigits = 2) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(maximumFractionDigits) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(maximumFractionDigits) + "K";
  }
  return num.toLocaleString(undefined, { maximumFractionDigits });
};

// Helper for relative time
const timeAgo = (timestamp?: number) => {
  if (!timestamp) return "-";
  const seconds = Math.floor(Date.now() / 1000 - timestamp);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
};

// Helper to format hashrate
const formatHashrate = (hashrate: number) => {
  if (hashrate >= 1e18) return `${(hashrate / 1e18).toFixed(2)} EH/s`;
  if (hashrate >= 1e15) return `${(hashrate / 1e15).toFixed(2)} PH/s`;
  if (hashrate >= 1e12) return `${(hashrate / 1e12).toFixed(2)} TH/s`;
  if (hashrate >= 1e9) return `${(hashrate / 1e9).toFixed(2)} GH/s`;
  if (hashrate >= 1e6) return `${(hashrate / 1e6).toFixed(2)} MH/s`;
  if (hashrate >= 1e3) return `${(hashrate / 1e3).toFixed(2)} kH/s`;
  return `${hashrate.toFixed(2)} H/s`;
};

const NetworkStatus = () => {
  const navigate = useNavigate();
  const { getNetworkStatus } = useZcashAPI();
  const { network } = useNetwork();

  const { data, isLoading: loading } = useQuery({
    queryKey: ["networkStatus"],
    queryFn: getNetworkStatus,
    refetchInterval: 30000,
  });

  if (loading && !data) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-accent" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container px-6 py-8 text-center">
        <p className="text-muted-foreground">Failed to load network status.</p>
      </div>
    );
  }

  return (
    <div className="container px-4 md:px-6 py-8 max-w-7xl mx-auto space-y-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-muted-foreground hover:text-accent transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back</span>
      </button>

      {/* Header Section */}
      <div className="flex flex-col items-center text-center space-y-2">
        <Globe className="w-10 h-10 text-accent mb-2" />
        <h1 className="text-4xl font-bold tracking-tight">
          Network Statistics
        </h1>
        <p className="text-muted-foreground text-lg capitalize">
          Real-time ZCash {network} metrics. Mining stats, network health, and
          blockchain data.
        </p>
      </div>

      {/* Node Status Bar */}
      <div className="bg-card/50 border border-terminal-green/20 rounded-lg p-4 flex flex-col md:flex-row items-center justify-between gap-4 card-glow">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-terminal-green/20 text-terminal-green">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">Node Status:</span>
              <span className="text-terminal-green font-bold text-sm">
                Healthy
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="font-bold text-sm">Sync:</span>
              <span className="text-terminal-green font-bold text-sm">
                Ready
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {data.subversion?.replace(/\//g, "") || "Zebra"} • Protocol{" "}
              {data.protocol_version}
            </div>
          </div>
        </div>
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-terminal-green animate-pulse"></div>
          Live Network Data
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Supply Distribution */}
        <Card className="p-6 bg-card/50 border-accent/10">
          <div className="flex items-center gap-2 mb-6 text-purple-400">
            <Database className="w-5 h-5" />
            <h3 className="font-bold text-lg">Supply Distribution</h3>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-end mb-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-terminal-green" />
                  <span className="text-sm font-medium">
                    Shielded (Orchard + Sapling + Sprout)
                  </span>
                </div>
                <span className="font-bold font-mono text-terminal-green">
                  {data.supply.shieldedPercentage.toFixed(1)}%
                </span>
              </div>

              {/* Main Bar */}
              <div className="h-4 w-full bg-secondary rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-terminal-green"
                  style={{ width: `${data.supply.shieldedPercentage}%` }}
                ></div>
                {/* Remainder is transparent (gray/secondary) */}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-2 font-mono">
                <span>
                  {formatNumber(data.supply.totalShielded)} ZEC shielded
                </span>
                <span>
                  {formatNumber(data.supply.transparent)} ZEC transparent
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/50">
              <div className="text-center">
                <p className="font-mono text-xl font-bold text-terminal-green">
                  {formatNumber(data.supply.orchard)}
                </p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <div className="w-2 h-2 rounded-full bg-terminal-green"></div>
                  <span className="text-xs text-muted-foreground">Orchard</span>
                </div>
              </div>
              <div className="text-center">
                <p className="font-mono text-xl font-bold text-purple-400">
                  {formatNumber(data.supply.sapling)}
                </p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                  <span className="text-xs text-muted-foreground">Sapling</span>
                </div>
              </div>
              <div className="text-center">
                <p className="font-mono text-xl font-bold text-yellow-500">
                  {formatNumber(data.supply.sprout)}
                </p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                  <span className="text-xs text-muted-foreground">Sprout</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Chain Statistics */}
        <Card className="p-6 bg-card/50 border-accent/10">
          <div className="flex items-center gap-2 mb-6 text-accent">
            <Network className="w-5 h-5" />
            <h3 className="font-bold text-lg">Chain Statistics</h3>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-muted-foreground">Total Supply</span>
              <span className="font-mono font-bold text-xl">
                {formatNumber(data.supply.total)} ZEC
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-muted-foreground flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-yellow-500" />
                Lockbox (Dev Fund)
              </span>
              <div>
                <span className="font-mono font-bold text-yellow-500">
                  {formatNumber(data.supply.lockbox || 0)} ZEC
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Network Upgrade</span>
              <span className="font-mono font-bold text-terminal-green">
                {data.supply.activeUpgrade || "NU6"}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* 3 Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-card/50 border-accent/10">
          <div className="flex items-center gap-2 text-muted-foreground mb-4">
            <Box className="w-4 h-4 text-accent" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Current Height
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-mono font-bold">
              {formatNumber(data.height, 2)}
            </p>
            <p className="text-sm text-muted-foreground">
              {data.height.toLocaleString()} blocks
            </p>
          </div>
        </Card>

        <Card className="p-6 bg-card/50 border-accent/10">
          <div className="flex items-center gap-2 text-muted-foreground mb-4">
            <TrendingUp className="w-4 h-4 text-accent" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Transactions (24h)
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-mono font-bold">
              {formatNumber(data.blockchain.tx24h, 2)}
            </p>
            <p className="text-sm text-muted-foreground">
              {data.blockchain.tx24h.toLocaleString()} transactions
            </p>
          </div>
        </Card>

        <Card className="p-6 bg-card/50 border-accent/10">
          <div className="flex items-center gap-2 text-muted-foreground mb-4">
            <Network className="w-4 h-4 text-terminal-green" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Connected Peers
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-mono font-bold">{data.peers}</p>
            <p className="text-sm text-muted-foreground">Direct connections</p>
          </div>
        </Card>
      </div>

      {/* Mining & Performance */}
      <div>
        <div className="flex items-center gap-2 mb-4 text-muted-foreground">
          <Zap className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider">
            Mining & Performance
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="p-4 bg-card/30 border-accent/5">
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <Zap className="w-3 h-3 text-accent" /> Hashrate
            </p>
            <p className="font-mono font-bold text-lg">
              {formatHashrate(data.hashrate)}
            </p>
          </Card>
          <Card className="p-4 bg-card/30 border-accent/5">
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <Shield className="w-3 h-3 text-accent" /> Difficulty
            </p>
            <p className="font-mono font-bold text-lg">
              {formatNumber(data.difficulty, 0)}
            </p>
          </Card>
          <Card className="p-4 bg-card/30 border-accent/5">
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <Clock className="w-3 h-3 text-terminal-green" /> Block Time
            </p>
            <p className="font-mono font-bold text-lg text-terminal-green">
              {data.mining.avgBlockTime}s
            </p>
            <p className="text-[10px] text-muted-foreground">Target: 75s</p>
          </Card>
          <Card className="p-4 bg-card/30 border-accent/5">
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <Box className="w-3 h-3 text-accent" /> Blocks (24h)
            </p>
            <p className="font-mono font-bold text-lg">
              {data.mining.blocks24h}
            </p>
          </Card>
          <Card className="p-4 bg-card/30 border-accent/5">
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-accent" /> Block Reward
            </p>
            <p className="font-mono font-bold text-lg">
              {data.mining.blockReward} ZEC
            </p>
            <p className="text-[10px] text-muted-foreground">
              Daily: {formatNumber(data.mining.dailyRevenue)} ZEC
            </p>
          </Card>
        </div>
      </div>

      {/* Blockchain */}
      <div>
        <div className="flex items-center gap-2 mb-4 text-muted-foreground">
          <Database className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider">
            Blockchain
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4 bg-card/30 border-accent/5">
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <HardDrive className="w-3 h-3 text-accent" /> Blockchain Size
            </p>
            <p className="font-mono font-bold text-lg">
              {((data.size_on_disk || 0) / 1024 / 1024 / 1024).toFixed(2)} GB
            </p>
          </Card>
          <Card className="p-4 bg-card/30 border-accent/5">
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <Clock className="w-3 h-3 text-accent" /> Latest Block
            </p>
            <p className="font-mono font-bold text-lg">
              {timeAgo(data.blockchain.latestBlockTime)}
            </p>
          </Card>
          <Card className="p-4 bg-card/30 border-accent/5">
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-accent" /> TX Per Block
            </p>
            <p className="font-mono font-bold text-lg">
              {(data.blockchain.tx24h / data.mining.blocks24h).toFixed(1)}
            </p>
            <p className="text-[10px] text-muted-foreground">24h average</p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NetworkStatus;
