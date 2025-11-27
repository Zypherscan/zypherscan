import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Hero } from "@/components/Hero";
import { SearchBar } from "@/components/SearchBar";
import { NetworkStats } from "@/components/NetworkStats";
import { RecentBlocks } from "@/components/RecentBlocks";
import { ViewingKeyDialog } from "@/components/ViewingKeyDialog";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      // Redirect to auth if not logged in
      navigate("/auth");
    }
  }, [user, loading, navigate]);

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

  if (!user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-background">
      {/* User Menu */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <div className="bg-card/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-accent/20 flex items-center gap-2">
          <User className="w-4 h-4 text-accent" />
          <span className="text-sm font-mono text-muted-foreground">{user.email}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={signOut}
          className="border-accent/50 hover:bg-accent/10"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>

      <Hero />
      
      <main id="explorer" className="container px-6 py-20 space-y-16">
        {/* Search Section */}
        <section className="space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
            <h2 className="text-3xl font-bold">Block Explorer</h2>
            <ViewingKeyDialog />
          </div>
          <SearchBar />
        </section>

        {/* Network Stats */}
        <section>
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
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>© 2024 Zcash Privacy Explorer. Built with the cypherpunk ethos.</p>
            <p className="font-mono">Client-side decryption • Zero knowledge • Full privacy</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
