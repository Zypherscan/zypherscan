import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useZcashAPI, NetworkStats, ZecPrice } from "@/hooks/useZcashAPI";
import { DollarSign, Activity, Cpu, Globe } from "lucide-react";

export function MarketStatsBanner() {
  const { getZecPrice, getNetworkStatus, getPrivacyStats } = useZcashAPI();
  const [zecPrice, setZecPrice] = useState<ZecPrice | null>(null);
  const [networkStats, setNetworkStats] = useState<NetworkStats | null>(null);
  const [privacyStats, setPrivacyStats] = useState<any | null>(null);

  useEffect(() => {
    const fetchMarketData = async () => {
      const price = await getZecPrice();
      setZecPrice(price);
      const network = await getNetworkStatus();
      setNetworkStats(network);
      const privacy = await getPrivacyStats();
      setPrivacyStats(privacy);
    };

    fetchMarketData();
    const interval = setInterval(fetchMarketData, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [getZecPrice, getNetworkStatus, getPrivacyStats]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <Card className="p-4 bg-card/40 border-accent/20 flex flex-col justify-between">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <DollarSign className="w-4 h-4" />
          <span className="text-xs font-medium">ZEC Price</span>
        </div>
        {zecPrice ? (
          <div>
            <span className="text-xl font-bold font-mono">
              ${zecPrice.usd.toFixed(2)}
            </span>
            <span
              className={`text-xs ml-2 ${
                zecPrice.usd_24h_change >= 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {zecPrice.usd_24h_change >= 0 ? "+" : ""}
              {zecPrice.usd_24h_change.toFixed(2)}%
            </span>
          </div>
        ) : (
          <Skeleton className="h-6 w-24" />
        )}
      </Card>

      <Card className="p-4 bg-card/40 border-accent/20 flex flex-col justify-between">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <Activity className="w-4 h-4" />
          <span className="text-xs font-medium">Network Height</span>
        </div>
        {networkStats ? (
          <span className="text-xl font-bold font-mono">
            {networkStats.height.toLocaleString()}
          </span>
        ) : (
          <Skeleton className="h-6 w-24" />
        )}
      </Card>

      <Card className="p-4 bg-card/40 border-accent/20 flex flex-col justify-between">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <Cpu className="w-4 h-4" />
          <span className="text-xs font-medium">Difficulty</span>
        </div>
        {networkStats ? (
          <span className="text-xl font-bold font-mono">
            {(networkStats.difficulty / 1000000).toFixed(2)}M
          </span>
        ) : (
          <Skeleton className="h-6 w-24" />
        )}
      </Card>

      <Card className="p-4 bg-card/40 border-accent/20 flex flex-col justify-between">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <Globe className="w-4 h-4" />
          <span className="text-xs font-medium">Fully Shielded</span>
        </div>
        {privacyStats ? (
          <span className="text-xl font-bold font-mono text-purple-400">
            {privacyStats?.metrics?.shieldedPercentage
              ? `${privacyStats.metrics.shieldedPercentage.toFixed(2)}%`
              : "—"}
          </span>
        ) : (
          <Skeleton className="h-6 w-24" />
        )}
      </Card>
    </div>
  );
}
