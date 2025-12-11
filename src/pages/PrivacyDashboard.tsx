import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useZcashAPI, ShieldedTransaction } from "@/hooks/useZcashAPI";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Activity,
  TrendingUp,
  TrendingDown,
  Layers,
  Lock,
  Eye,
  PieChart,
  ArrowUpRight,
  ArrowLeft,
  ArrowRight,
  Zap,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface PrivacyStats {
  totals: {
    shieldedTx: number;
    transparentTx: number;
    fullyShieldedTx: number;
  };
  shieldedPool: {
    sapling: number;
    orchard: number;
    sprout: number;
    transparent: number;
    chainSupply: number;
  };
  metrics: {
    privacyScore: number;
    shieldedPercentage: number;
    adoptionTrend: string;
  };
  trends: {
    daily: {
      date: string;
      shielded: number;
      transparent: number;
      shieldedPercentage: number;
      privacyScore: number;
    }[];
  };
}

const PrivacyDashboard = () => {
  const navigate = useNavigate();
  const { getPrivacyStats, getRecentShieldedTransactions, getBlockchainInfo } =
    useZcashAPI();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PrivacyStats | null>(null);
  const [blockchainInfo, setBlockchainInfo] = useState<any>(null);
  const [recentTxs, setRecentTxs] = useState<ShieldedTransaction[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [privacyData, chainInfo, recentShielded] = await Promise.all([
          getPrivacyStats(),
          getBlockchainInfo(),
          getRecentShieldedTransactions(5),
        ]);

        setStats(privacyData);
        setBlockchainInfo(chainInfo);
        setRecentTxs(recentShielded);
      } catch (err) {
        console.error("Failed to fetch privacy data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [getBlockchainInfo, getPrivacyStats, getRecentShieldedTransactions]);

  // Derived metrics
  const totalTransactions = stats?.totals
    ? (stats.totals.shieldedTx || 0) + (stats.totals.transparentTx || 0)
    : 0;

  const shieldedTxPercentage =
    totalTransactions > 0
      ? ((stats?.totals?.shieldedTx || 0) / totalTransactions) * 100
      : 0;

  const fullyShieldedCount = stats?.totals?.fullyShieldedTx || 0;

  const fullyShieldedPercentage =
    totalTransactions > 0 ? (fullyShieldedCount / totalTransactions) * 100 : 0;

  const supplyShieldedPercentage =
    blockchainInfo?.supply?.shieldedPercentage || 0;

  const adoptionTrend =
    stats?.trends?.daily?.slice(0, 30).map((d) => ({
      ...d,
      formattedDate: d.date
        ? new Date(d.date).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })
        : "",
    })) || [];

  const isTrendUp =
    adoptionTrend.length >= 2
      ? adoptionTrend[0].shieldedPercentage >
        adoptionTrend[adoptionTrend.length - 1].shieldedPercentage
      : false;

  const handleTimestamp = (tx: any) => {
    // API returns blockTime (seconds) or timestamp
    const ts = tx.timestamp || tx.blockTime;
    if (!ts) return "N/A";
    try {
      const date = new Date(
        typeof ts === "number" && ts < 10000000000 ? ts * 1000 : ts
      );
      if (isNaN(date.getTime())) return "N/A";
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return "N/A";
    }
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container px-6 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-accent transition-colors mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        {/* Header */}
        <div className="mb-8 text-center pt-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="w-8 h-8 text-accent" />
            <h1 className="text-3xl font-bold tracking-tight">
              Zcash Privacy Metrics
            </h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Live privacy statistics for the Zcash blockchain. Track shielded
            adoption, privacy score, and transparency trends.
          </p>
        </div>

        {/* Top Section: Score & Recent TXs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Privacy Score Card */}
          <Card className="lg:col-span-1 bg-[#1a1b26] border-accents/20 p-8 flex flex-col justify-center items-center text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-accent opacity-50"></div>
            <div className="z-10 w-full">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-gray-400" />
                <h3 className="text-gray-400 font-medium tracking-wide text-sm uppercase">
                  Privacy Score
                </h3>
              </div>

              <div className="text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400 mb-2 font-mono">
                {stats?.metrics?.privacyScore || 0}
                <span className="text-2xl text-gray-500">/100</span>
              </div>

              <div className="w-full max-w-[200px] h-2 bg-gray-800 rounded-full mx-auto mb-6 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-1000"
                  style={{ width: `${stats?.metrics?.privacyScore || 0}%` }}
                ></div>
              </div>

              <p className="text-xs text-gray-500 max-w-[250px] mx-auto">
                Shielded Tx Adoption ({shieldedTxPercentage.toFixed(0)}%), Fully
                Shielded Rate ({fullyShieldedPercentage.toFixed(0)}%), Pool Size
                Growtth
              </p>
            </div>
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-purple-500/10 blur-[50px] rounded-full"></div>
          </Card>

          {/* Recent Shielded Transactions */}
          <Card className="lg:col-span-2 bg-[#1a1b26] border-accents/20 p-0 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-400" />
                <h3 className="font-medium text-gray-200">
                  Recent Shielded TXs
                </h3>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                LIVE
              </div>
            </div>
            <div className="divide-y divide-gray-800/50 flex-1">
              {recentTxs.length > 0 ? (
                recentTxs.map((tx) => (
                  <div
                    key={tx.txid}
                    className="p-4 hover:bg-white/5 transition-colors group flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center shrink-0">
                        <Lock className="w-4 h-4 text-purple-400" />
                      </div>
                      <div className="max-w-[180px] sm:max-w-xs">
                        <Link
                          to={`/tx/${tx.txid}`}
                          className="text-sm font-mono text-purple-300 hover:text-purple-200 block truncate"
                        >
                          {tx.txid}
                        </Link>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                          <span>
                            Block: #{tx.block_height || (tx as any).blockHeight}
                          </span>
                          <span className="text-gray-700 mx-1">•</span>
                          <Badge
                            variant="secondary"
                            className="text-[10px] h-4 px-1.5 bg-gray-800 text-gray-400"
                          >
                            {tx.pool?.toUpperCase() || "SHIELDED"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 font-mono text-right">
                      {handleTimestamp(tx)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500 text-sm">
                  Loading recent transactions...
                </div>
              )}
            </div>
            <div className="p-3 bg-gray-900/50 text-center border-t border-gray-800">
              <Link
                to="/blocks"
                className="text-xs text-purple-400 hover:text-purple-300 inline-flex items-center gap-1 transition-colors"
              >
                View Blockchain Activity <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </Card>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-[#1a1b26] border-gray-800 p-5">
            <div className="flex items-center gap-2 mb-1 text-xs text-gray-400 uppercase tracking-wider">
              <Lock className="w-3 h-3" /> Shielded TX %
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {shieldedTxPercentage.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500">
              {(stats?.totals?.shieldedTx || 0).toLocaleString()} txs
            </p>
          </Card>

          <Card className="bg-[#1a1b26] border-gray-800 p-5">
            <div className="flex items-center gap-2 mb-1 text-xs text-gray-400 uppercase tracking-wider">
              <PieChart className="w-3 h-3" /> Supply Shielded
            </div>
            <div className="text-2xl font-bold text-purple-400 mb-1">
              {supplyShieldedPercentage.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500">
              {blockchainInfo?.supply?.totalShielded
                ? `${(blockchainInfo.supply.totalShielded / 1000000).toFixed(
                    2
                  )}M / ${21}M`
                : "Loading..."}
            </p>
          </Card>

          <Card className="bg-[#1a1b26] border-gray-800 p-5">
            <div className="flex items-center gap-2 mb-1 text-xs text-gray-400 uppercase tracking-wider">
              <TrendingUp className="w-3 h-3" /> Adoption Trend
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {isTrendUp ? "Rising" : "Declining"}
            </div>
            <p className="text-xs text-gray-500">30 Day Avg</p>
          </Card>

          <Card className="bg-[#1a1b26] border-gray-800 p-5">
            <div className="flex items-center gap-2 mb-1 text-xs text-gray-400 uppercase tracking-wider">
              <Eye className="w-3 h-3" /> Fully Shielded
            </div>
            <div className="text-2xl font-bold text-green-400 mb-1">
              {(stats?.totals?.fullyShieldedTx || 0).toLocaleString()}
            </div>
            <p className="text-xs text-gray-500">Fully Private Transactions</p>
          </Card>
        </div>

        {/* Transaction Types & Pool Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Transaction Types */}
          <Card className="bg-[#1a1b26] border-gray-800 p-6">
            <h3 className="text-sm font-medium text-gray-200 mb-6 flex items-center gap-2">
              <Layers className="w-4 h-4 text-gray-400" /> Transaction Types
            </h3>

            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-purple-300 flex items-center gap-2">
                    <Lock className="w-3 h-3" /> Shielded (
                    {(stats?.totals?.shieldedTx || 0).toLocaleString()})
                  </span>
                  <span className="text-white font-mono">
                    {shieldedTxPercentage.toFixed(1)}%
                  </span>
                </div>
                <Progress
                  value={shieldedTxPercentage}
                  className="h-2 bg-gray-800"
                  indicatorClassName="bg-purple-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400 flex items-center gap-2">
                    <Eye className="w-3 h-3" /> Transparent (
                    {(stats?.totals?.transparentTx || 0).toLocaleString()})
                  </span>
                  <span className="text-white font-mono">
                    {(100 - shieldedTxPercentage).toFixed(1)}%
                  </span>
                </div>
                <Progress
                  value={100 - shieldedTxPercentage}
                  className="h-2 bg-gray-800"
                  indicatorClassName="bg-gray-600"
                />
              </div>
            </div>
          </Card>

          {/* Shielded Pool Breakdown */}
          <Card className="bg-[#1a1b26] border-gray-800 p-6">
            <h3 className="text-sm font-medium text-gray-200 mb-6 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-gray-400" /> Shielded Pool
              Breakdown
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-900/30 border border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                  <span className="text-sm text-purple-400 font-medium">
                    Sapling
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono text-white">
                    {((blockchainInfo?.supply?.sapling || 0) / 1000000).toFixed(
                      2
                    )}
                    M ZEC
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-900/30 border border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                  <span className="text-sm text-yellow-500 font-medium">
                    Sprout
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono text-white">
                    {((blockchainInfo?.supply?.sprout || 0) / 1000000).toFixed(
                      3
                    )}
                    M ZEC
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-900/30 border border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-sm text-green-500 font-medium">
                    Orchard
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono text-white">
                    {((blockchainInfo?.supply?.orchard || 0) / 1000000).toFixed(
                      3
                    )}
                    M ZEC
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-800 pt-3 flex justify-between items-center px-3">
                <span className="text-sm text-gray-400">Total Shielded</span>
                <span className="text-sm font-bold text-white font-mono">
                  {(
                    (blockchainInfo?.supply?.totalShielded || 0) / 1000000
                  ).toFixed(2)}
                  M ZEC
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Adoption Chart */}
        <Card className="bg-[#1a1b26] border-gray-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-accent" />
                Adoption Trend
              </h3>
              <p className="text-xs text-gray-500">
                Shielded transaction percentage over time
              </p>
            </div>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={adoptionTrend}>
                <defs>
                  <linearGradient
                    id="chartGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#2e2e2e"
                  vertical={false}
                />
                <XAxis
                  dataKey="formattedDate"
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                  minTickGap={30}
                />
                <YAxis
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1b26",
                    borderColor: "#374151",
                    color: "#f3f4f6",
                    borderRadius: "8px",
                  }}
                  itemStyle={{ color: "#a78bfa" }}
                  formatter={(value: number) => [
                    `${value.toFixed(2)}%`,
                    "Shielded %",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="shieldedPercentage"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fill="url(#chartGradient)"
                  activeDot={{ r: 6, fill: "#8b5cf6", stroke: "#fff" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default PrivacyDashboard;
