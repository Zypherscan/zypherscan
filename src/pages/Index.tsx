import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Hero } from "@/components/Hero";
import { SearchBar } from "@/components/SearchBar";
import { NetworkStats } from "@/components/NetworkStats";
import { RecentBlocks } from "@/components/RecentBlocks";
import { ViewingKeyDialog } from "@/components/ViewingKeyDialog";
import { Button } from "@/components/ui/button";
import { Shield, BarChart3, Activity, TrendingUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { isConnected, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isConnected) {
      navigate("/auth");
    }
  }, [isConnected, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Hero />

      <main id="explorer" className="container px-6 py-20 space-y-16">
        {/* Search Section */}
        <section className="space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Block Explorer</h2>
              <p className="text-muted-foreground">
                Search for blocks, transactions, and addresses
              </p>
            </div>
            <div className="flex items-center gap-3">
              <ViewingKeyDialog />
              <Link to="/dashboard">
                <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  View Analytics
                </Button>
              </Link>
            </div>
          </div>
          <SearchBar />
        </section>

        {/* Quick Access Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link to="/dashboard" className="group">
            <div className="card-glow bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-accent/10 transition-all group-hover:border-accent/30">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold">Personal Analytics</h3>
                  <p className="text-sm text-muted-foreground">
                    View your transaction history
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Decrypt and analyze your shielded transactions with detailed
                charts and insights.
              </p>
            </div>
          </Link>

          <div className="card-glow bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-accent/10">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-terminal-green/20 flex items-center justify-center">
                <Activity className="w-6 h-6 text-terminal-green" />
              </div>
              <div>
                <h3 className="font-semibold">Live Blockchain</h3>
                <p className="text-sm text-muted-foreground">
                  Real-time block updates
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Monitor the Zcash blockchain with live block and transaction data
              from Zebrad.
            </p>
          </div>

          <Link to="/privacy" className="group">
            <div className="card-glow bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-accent/10 transition-all group-hover:border-purple-500/30">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Pool Statistics</h3>
                  <p className="text-sm text-muted-foreground">
                    Shielded pool metrics
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Track Sapling and Orchard pool values and network shielded
                adoption trends.
              </p>
            </div>
          </Link>
        </section>

        {/* Network Stats */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Activity className="w-6 h-6 text-accent" />
              Network Statistics
            </h2>
          </div>
          <NetworkStats />
        </section>

        {/* Recent Blocks */}
        <section>
          <RecentBlocks />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-20">
        <div className="container px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Shield className="w-8 h-8 text-accent" />
              <div>
                <p className="font-semibold">ZShield Explorer</p>
                <p className="text-sm text-muted-foreground">
                  Privacy-first blockchain explorer
                </p>
              </div>
            </div>
            <div className="text-center md:text-right">
              <p className="text-sm text-muted-foreground">
                © 2024 ZShield Explorer. Built with the cypherpunk ethos.
              </p>
              <p className="text-xs font-mono text-muted-foreground mt-1">
                Client-side decryption • Zero knowledge • Full privacy
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
