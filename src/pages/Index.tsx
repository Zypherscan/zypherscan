import { useNavigate, Link } from "react-router-dom";
import { SearchBar } from "@/components/SearchBar";
import { RecentBlocks } from "@/components/RecentBlocks";
import { ShieldedActivityList } from "@/components/ShieldedActivityList";
import { PrivacyMetricsDashboard } from "@/components/PrivacyMetricsDashboard";
import { Shield, BarChart3, ArrowRight, Activity } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useZcashAPI, Block, NetworkStats } from "@/hooks/useZcashAPI";
import { NetworkCharts } from "@/components/NetworkCharts";
import { MatrixBackground } from "@/components/MatrixBackground";
import { WhaleTicker } from "@/components/WhaleTicker";

const Index = () => {
  console.log(
    "Hello Everyone! Madhu S Gowda here, Creator of Zypherscan. Here is my X: https://x.com/madhusgowda_ ",
  );
  const { isConnected } = useAuth();
  const navigate = useNavigate();
  const { getLatestBlocks, getNetworkStatus, getRecentShieldedTransactions } =
    useZcashAPI();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [networkStats, setNetworkStats] = useState<NetworkStats | null>(null);
  const [shieldedTxs, setShieldedTxs] = useState<any[]>([]);

  useEffect(() => {
    const fetchBlocks = async () => {
      const data = await getLatestBlocks(50);
      setBlocks(data);
      const stats = await getNetworkStatus();
      setNetworkStats(stats);
      const txs = await getRecentShieldedTransactions(15);
      setShieldedTxs(txs);
    };
    fetchBlocks();
    // Poll every minute
    const interval = setInterval(fetchBlocks, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 100);
  }, []);

  return (
    <div className="min-h-screen">
      <WhaleTicker
        blocks={blocks}
        stats={networkStats}
        transactions={shieldedTxs}
      />
      {/* Hero / Header Section */}
      <section className="relative items-center justify-center overflow-hidden pb-20 pt-20">
        <div className="container relative z-10 px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 border border-white/10 mb-8 animate-fade-in">
            <Shield className="w-4 h-4 text-accent" />
            <span className="text-sm font-mono text-muted-foreground">
              ZEC Blockchain Explorer
            </span>
            <span className="w-2 h-2 bg-terminal-green rounded-full animate-pulse" />
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold mb-6 animate-fade-in">
            Explore ZCash
            <br />
            <span className="text-gradient glow-text">
              With Uncompromised Privacy
            </span>
          </h1>
          <p className="max-w-2xl mx-auto text-muted-foreground mb-8 text-lg font-light animate-fade-in">
            The most advanced explorer for the Zcash network. Bring your viewing
            keys to decode the unseen while keeping your data private.
          </p>
          <div className="max-w-xl mx-auto pt-4 animate-fade-in flex flex-col gap-4">
            <SearchBar />

            {/* Search Helper Chips */}
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
              <span className="font-bold uppercase tracking-wider">TRY:</span>
              <button
                className="bg-muted/30 hover:bg-muted/50 border border-border/50 px-2 py-1 rounded transition-colors"
                onClick={() => navigate("/block/354939")}
              >
                Block #354939
              </button>
              <button className="bg-muted/30 hover:bg-muted/50 border border-border/50 px-2 py-1 rounded transition-colors">
                t-address
              </button>
              <button className="bg-muted/30 hover:bg-muted/50 border border-border/50 px-2 py-1 rounded transition-colors flex items-center gap-1">
                z-address <Shield className="w-3 h-3 text-terminal-green" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <main className="container px-4 py-12 space-y-12">
        {/* Privacy Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">
            <Shield className="w-3 h-3" />
            Privacy Metrics & Education
          </div>
          <PrivacyMetricsDashboard stats={networkStats} />
        </section>

        {/* Network Activity Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">
            <Activity className="w-3 h-3" />
            Network Activity
          </div>
          <NetworkCharts blocks={blocks} />
        </section>

        {/* Dual Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Recent Blocks */}
          <section>
            <RecentBlocks />
          </section>

          {/* Right: Shielded Activity */}
          <section>
            <ShieldedActivityList />
          </section>
        </div>
      </main>
    </div>
  );
};

export default Index;
