import { useNavigate, Link } from "react-router-dom";
import { SearchBar } from "@/components/SearchBar";
import { RecentBlocks } from "@/components/RecentBlocks";
import { ShieldedActivityList } from "@/components/ShieldedActivityList";
import { MarketStatsBanner } from "@/components/MarketStatsBanner";
import { Shield, BarChart3 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

const Index = () => {
  console.log("Hello Everyone! Madhu S Gowda here, Creator of Zypherscan. Here is my X: https://x.com/madhusgowda_ ");
  const { isConnected } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 100);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero / Header Section */}
      <section className="relative items-center justify-center overflow-hidden border-b border-border/40 pb-20 pt-20">
        {/* Animated Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-accent/10 via-transparent to-transparent opacity-50" />

          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px),
                               linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px)`,
              backgroundSize: "60px 60px",
            }}
          />

          {/* Floating particles effect */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse" />
          <div
            className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-terminal-green/5 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          />
        </div>

        <div className="container relative z-10 px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/80 backdrop-blur-sm border border-accent/20 mb-8 animate-fade-in">
            <Shield className="w-4 h-4 text-accent" />
            <span className="text-sm font-mono text-muted-foreground">
              Privacy-First Blockchain Explorer
            </span>
            <span className="w-2 h-2 bg-terminal-green rounded-full animate-pulse" />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in">
            Explore ZCash
            <br />
            <span className="text-gradient glow-text">With Full Privacy</span>
          </h1>
          Bring your own viewing keys to unlock shielded transactions. A
          seamless, view-only explorer for your private ZCash history.
          <div className="max-w-xl mx-auto pt-4 animate-fade-in">
            <SearchBar />
          </div>
        </div>
      </section>

      <main className="container px-6 py-12 space-y-12">
        {/* Market Stats */}
        <section>
          <MarketStatsBanner />
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
