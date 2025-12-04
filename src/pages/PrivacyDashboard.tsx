import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useZcashAPI } from "@/hooks/useZcashAPI";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Shield,
  Activity,
  TrendingUp,
  Layers,
  Lock,
  Eye,
  PieChart,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from "recharts";

interface ShieldedPoolData {
  sapling: number;
  orchard: number;
  total: number;
  saplingPct: number;
  orchardPct: number;
}

const PrivacyDashboard = () => {
  const { isConnected, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { getBlockchainInfo } = useZcashAPI();

  const [blockchainInfo, setBlockchainInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [poolData, setPoolData] = useState<ShieldedPoolData | null>(null);

  useEffect(() => {
    if (!authLoading && !isConnected) {
      navigate("/auth");
    }
  }, [isConnected, authLoading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const info = await getBlockchainInfo();
        setBlockchainInfo(info);

        // Calculate pool data
        if (info?.valuePools) {
          const sapling =
            info.valuePools.find((p: any) => p.id === "sapling")?.chainValue ||
            0;
          const orchard =
            info.valuePools.find((p: any) => p.id === "orchard")?.chainValue ||
            0;
          const total = sapling + orchard;

          setPoolData({
            sapling: sapling, // chainValue is already in ZEC
            orchard: orchard,
            total: total,
            saplingPct: total > 0 ? (sapling / total) * 100 : 0,
            orchardPct: total > 0 ? (orchard / total) * 100 : 0,
          });
        }
      } catch (err) {
        console.error("Failed to fetch blockchain info:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  // Mock historical data for shielded pool growth chart
  const historicalData = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    const baseValue = poolData?.total || 5000000;
    const variation = Math.sin(i * 0.3) * 50000 + i * 1500;
    return {
      date: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      value: Math.max(0, baseValue - (29 - i) * 3000 + variation),
    };
  });

  const pieData = poolData
    ? [
        { name: "Orchard", value: poolData.orchardPct, color: "#a855f7" },
        { name: "Sapling", value: poolData.saplingPct, color: "#3b82f6" },
      ].filter((d) => d.value > 0)
    : [];

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <main className="container px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <PieChart className="w-8 h-8 text-accent" />
            Privacy Dashboard
          </h1>
          <p className="text-muted-foreground">
            Network-wide shielded pool statistics and privacy metrics
          </p>
        </div>

        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
            <Skeleton className="h-80" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="card-glow bg-gradient-to-br from-terminal-green/20 via-card to-card p-6 border-terminal-green/30">
                <div className="flex items-center justify-between mb-4">
                  <Shield className="w-6 h-6 text-terminal-green" />
                  <span className="text-xs text-terminal-green font-medium px-2 py-1 bg-terminal-green/20 rounded-full">
                    Total Shielded
                  </span>
                </div>
                <p className="text-3xl font-bold font-mono mb-1">
                  {poolData
                    ? `${(poolData.total / 1000000).toFixed(2)}M`
                    : "N/A"}
                </p>
                <p className="text-sm text-muted-foreground">
                  ZEC in shielded pools
                </p>
              </Card>

              <Card className="card-glow bg-card/50 backdrop-blur-sm p-6 border-purple-500/20">
                <div className="flex items-center justify-between mb-4">
                  <Layers className="w-6 h-6 text-purple-400" />
                  <span className="text-xs text-purple-400 font-medium">
                    Orchard Pool
                  </span>
                </div>
                <p className="text-2xl font-bold font-mono mb-1">
                  {poolData
                    ? `${(poolData.orchard / 1000000).toFixed(2)}M`
                    : "N/A"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {poolData
                    ? `${poolData.orchardPct.toFixed(1)}% of total`
                    : "ZEC"}
                </p>
              </Card>

              <Card className="card-glow bg-card/50 backdrop-blur-sm p-6 border-blue-500/20">
                <div className="flex items-center justify-between mb-4">
                  <Lock className="w-6 h-6 text-blue-400" />
                  <span className="text-xs text-blue-400 font-medium">
                    Sapling Pool
                  </span>
                </div>
                <p className="text-2xl font-bold font-mono mb-1">
                  {poolData
                    ? `${(poolData.sapling / 1000000).toFixed(2)}M`
                    : "N/A"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {poolData
                    ? `${poolData.saplingPct.toFixed(1)}% of total`
                    : "ZEC"}
                </p>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Shielded Pool Growth */}
              <Card className="lg:col-span-2 card-glow bg-card/50 backdrop-blur-sm border-accent/10">
                <div className="p-6 border-b border-border">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-accent" />
                    Shielded Pool Growth
                  </h2>
                  <p className="text-sm text-muted-foreground">30-day trend</p>
                </div>
                <div className="p-6">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={historicalData}>
                        <defs>
                          <linearGradient
                            id="shieldedGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="hsl(var(--terminal-green))"
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="95%"
                              stopColor="hsl(var(--terminal-green))"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="hsl(var(--border))"
                        />
                        <XAxis
                          dataKey="date"
                          tick={{
                            fill: "hsl(var(--muted-foreground))",
                            fontSize: 12,
                          }}
                          interval="preserveStartEnd"
                        />
                        <YAxis
                          tick={{
                            fill: "hsl(var(--muted-foreground))",
                            fontSize: 12,
                          }}
                          tickFormatter={(val) =>
                            `${(val / 1000000).toFixed(1)}M`
                          }
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                          formatter={(value: number) => [
                            `${(value / 1000000).toFixed(2)}M ZEC`,
                            "Shielded",
                          ]}
                        />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="hsl(var(--terminal-green))"
                          strokeWidth={2}
                          fill="url(#shieldedGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </Card>

              {/* Pool Distribution */}
              <Card className="card-glow bg-card/50 backdrop-blur-sm border-accent/10">
                <div className="p-6 border-b border-border">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-accent" />
                    Pool Distribution
                  </h2>
                </div>
                <div className="p-6">
                  <div className="h-48">
                    {pieData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={70}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: number) => [
                              `${value.toFixed(1)}%`,
                              "",
                            ]}
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                            }}
                          />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground">
                        No data available
                      </div>
                    )}
                  </div>
                  <div className="flex justify-center gap-6 mt-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-purple-500" />
                      <span className="text-sm text-muted-foreground">
                        Orchard
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className="text-sm text-muted-foreground">
                        Sapling
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Privacy Info */}
            <Card className="card-glow bg-card/50 backdrop-blur-sm border-accent/10 p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
                  <Eye className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">
                    Understanding Shielded Pools
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Zcash's shielded pools protect user privacy through
                    zero-knowledge proofs.
                    <strong className="text-foreground"> Sapling</strong>{" "}
                    (activated 2018) provides efficient shielded transactions,
                    while
                    <strong className="text-foreground"> Orchard</strong>{" "}
                    (activated 2022) offers enhanced privacy and the latest
                    cryptographic improvements. The more value in shielded
                    pools, the stronger the anonymity set for all users.
                  </p>
                </div>
              </div>
            </Card>

            {/* Network Info */}
            {blockchainInfo && (
              <Card className="card-glow bg-card/50 backdrop-blur-sm border-accent/10">
                <div className="p-6 border-b border-border">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Activity className="w-5 h-5 text-accent" />
                    Network Status
                  </h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
                  <div className="p-6 text-center">
                    <p className="text-2xl font-bold font-mono">
                      {blockchainInfo.blocks?.toLocaleString() || "N/A"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Block Height
                    </p>
                  </div>
                  <div className="p-6 text-center">
                    <p className="text-2xl font-bold font-mono capitalize">
                      {blockchainInfo.chain || "N/A"}
                    </p>
                    <p className="text-sm text-muted-foreground">Network</p>
                  </div>
                  <div className="p-6 text-center">
                    <p className="text-2xl font-bold font-mono">
                      {blockchainInfo.difficulty
                        ? `${(blockchainInfo.difficulty / 1e6).toFixed(1)}M`
                        : "N/A"}
                    </p>
                    <p className="text-sm text-muted-foreground">Difficulty</p>
                  </div>
                  <div className="p-6 text-center">
                    <p className="text-2xl font-bold font-mono text-terminal-green">
                      Active
                    </p>
                    <p className="text-sm text-muted-foreground">Status</p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12">
        <div className="container px-6 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>© 2024 ZShield Explorer. Built with the cypherpunk ethos.</p>
            <p className="font-mono">
              Privacy-first • Decentralized • Open Source
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyDashboard;
