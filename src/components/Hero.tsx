import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Key, Eye, BarChart3, Zap, Lock } from "lucide-react";

export const Hero = () => {
  const scrollToExplorer = () => {
    document.getElementById("explorer")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
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

      {/* Content */}
      <div className="container relative z-10 px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/80 backdrop-blur-sm border border-accent/20 mb-8 animate-fade-in">
          <Shield className="w-4 h-4 text-accent" />
          <span className="text-sm font-mono text-muted-foreground">
            Privacy-First Blockchain Explorer
          </span>
          <span className="w-2 h-2 bg-terminal-green rounded-full animate-pulse" />
        </div>

        <h1
          className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in"
          style={{ animationDelay: "0.1s" }}
        >
          Explore Zcash
          <br />
          <span className="text-gradient glow-text">With Full Privacy</span>
        </h1>

        <p
          className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto animate-fade-in"
          style={{ animationDelay: "0.2s" }}
        >
          Bring your own viewing keys. Decrypt shielded transactions
          client-side. Your privacy stays on your device, not our servers.
        </p>

        <div
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16 animate-fade-in"
          style={{ animationDelay: "0.3s" }}
        >
          <Button
            size="lg"
            className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all hover:scale-105"
            onClick={scrollToExplorer}
          >
            <Eye className="mr-2 h-5 w-5" />
            Start Exploring
          </Button>
          <Link to="/dashboard">
            <Button
              size="lg"
              variant="outline"
              className="border-accent/50 hover:bg-accent/10 font-semibold px-8 py-6 text-lg hover:scale-105 transition-all"
            >
              <BarChart3 className="mr-2 h-5 w-5" />
              View Dashboard
            </Button>
          </Link>
        </div>

        {/* Feature cards */}
        <div
          className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto animate-fade-in"
          style={{ animationDelay: "0.4s" }}
        >
          <div className="card-glow bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-border group hover:border-accent/30 transition-all">
            <div className="w-14 h-14 rounded-lg bg-accent/20 flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
              <Lock className="w-7 h-7 text-accent" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Client-Side Only</h3>
            <p className="text-muted-foreground">
              All decryption happens in your browser. Your keys never leave your
              device.
            </p>
          </div>

          <div className="card-glow bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-border group hover:border-terminal-green/30 transition-all">
            <div className="w-14 h-14 rounded-lg bg-terminal-green/20 flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
              <Key className="w-7 h-7 text-terminal-green" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Your Keys, Your Data</h3>
            <p className="text-muted-foreground">
              Import viewing keys to see all transactions related to your
              addresses.
            </p>
          </div>

          <div className="card-glow bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-border group hover:border-purple-400/30 transition-all">
            <div className="w-14 h-14 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
              <Zap className="w-7 h-7 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Real-Time Analytics</h3>
            <p className="text-muted-foreground">
              Personal spending insights, transaction history, and pool
              analytics.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
