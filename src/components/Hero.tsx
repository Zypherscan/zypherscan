import { Button } from "@/components/ui/button";
import { Shield, Key, Eye } from "lucide-react";
import heroImage from "@/assets/hero-privacy.jpg";

export const Hero = () => {
  const scrollToExplorer = () => {
    document.getElementById('explorer')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background image with overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroImage} 
          alt="Privacy-focused blockchain" 
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background"></div>
      </div>

      {/* Content */}
      <div className="container relative z-10 px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-accent/20 mb-8 animate-fade-in">
          <Shield className="w-4 h-4 text-accent" />
          <span className="text-sm font-mono text-muted-foreground">Privacy-First Blockchain Explorer</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          Explore Zcash
          <br />
          <span className="text-gradient glow-text">Without Compromise</span>
        </h1>

        <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: '0.2s' }}>
          Bring your own viewing keys. Decrypt shielded transactions client-side. 
          Your privacy stays on your device, not our servers.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <Button 
            size="lg" 
            className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all"
            onClick={scrollToExplorer}
          >
            <Eye className="mr-2 h-5 w-5" />
            Start Exploring
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="border-accent/50 hover:bg-accent/10 font-semibold px-8 py-6 text-lg"
          >
            <Key className="mr-2 h-5 w-5" />
            Import Viewing Key
          </Button>
        </div>

        {/* Feature cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="card-glow bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-border">
            <Shield className="w-12 h-12 text-accent mb-4 mx-auto" />
            <h3 className="text-xl font-semibold mb-2">Client-Side Only</h3>
            <p className="text-muted-foreground">
              All decryption happens in your browser. Your keys never leave your device.
            </p>
          </div>
          
          <div className="card-glow bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-border">
            <Key className="w-12 h-12 text-accent mb-4 mx-auto" />
            <h3 className="text-xl font-semibold mb-2">Your Keys, Your Data</h3>
            <p className="text-muted-foreground">
              Import viewing keys to see all transactions related to your addresses.
            </p>
          </div>
          
          <div className="card-glow bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-border">
            <Eye className="w-12 h-12 text-accent mb-4 mx-auto" />
            <h3 className="text-xl font-semibold mb-2">True Transparency</h3>
            <p className="text-muted-foreground">
              Verify and audit private transactions while preserving the cypherpunk ethos.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
