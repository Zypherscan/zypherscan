import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Activity, TrendingUp, Zap, Shield } from "lucide-react";
import { useZcashAPI } from "@/hooks/useZcashAPI";
import { Skeleton } from "@/components/ui/skeleton";

interface BlockchainInfo {
  blocks: number;
  difficulty: number;
  chain: string;
  chainwork: string;
  estimatedheight: number;
  valuePools?: {
    id: string;
    chainValue: number;
  }[];
}

export const NetworkStats = () => {
  const { getBlockchainInfo } = useZcashAPI();
  const [info, setInfo] = useState<BlockchainInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInfo = async () => {
      setLoading(true);
      const data = await getBlockchainInfo();
      setInfo(data);
      setLoading(false);
    };

    fetchInfo();
    const interval = setInterval(fetchInfo, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const formatDifficulty = (diff: number) => {
    if (diff >= 1e9) return `${(diff / 1e9).toFixed(2)}B`;
    if (diff >= 1e6) return `${(diff / 1e6).toFixed(2)}M`;
    if (diff >= 1e3) return `${(diff / 1e3).toFixed(2)}K`;
    return diff.toFixed(2);
  };

  const getShieldedPool = () => {
    if (!info?.valuePools) return "N/A";
    const sapling = info.valuePools.find(p => p.id === "sapling");
    const orchard = info.valuePools.find(p => p.id === "orchard");
    const total = (sapling?.chainValue || 0) + (orchard?.chainValue || 0);
    return `${(total / 1e8).toFixed(2)}M ZEC`;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  const stats = [
    {
      label: "Block Height",
      value: info ? formatNumber(info.blocks) : "N/A",
      icon: Activity,
    },
    {
      label: "Difficulty",
      value: info ? formatDifficulty(info.difficulty) : "N/A",
      icon: Zap,
    },
    {
      label: "Shielded Pool",
      value: getShieldedPool(),
      icon: Shield,
    },
    {
      label: "Network",
      value: info?.chain === "main" ? "Mainnet" : info?.chain || "N/A",
      icon: TrendingUp,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card 
          key={stat.label}
          className="card-glow bg-card/50 backdrop-blur-sm p-6 border-accent/10"
        >
          <div className="flex items-center justify-between mb-2">
            <stat.icon className="w-5 h-5 text-accent" />
          </div>
          <p className="text-2xl font-bold mb-1 font-mono">{stat.value}</p>
          <p className="text-sm text-muted-foreground">{stat.label}</p>
        </Card>
      ))}
    </div>
  );
};
