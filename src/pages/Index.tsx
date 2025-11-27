import { Hero } from "@/components/Hero";
import { SearchBar } from "@/components/SearchBar";
import { NetworkStats } from "@/components/NetworkStats";
import { RecentBlocks } from "@/components/RecentBlocks";
import { ViewingKeyDialog } from "@/components/ViewingKeyDialog";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
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
