import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Shield, ArrowLeft, Key, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

import { useAuth } from "@/hooks/useAuth";
import { parseViewingKey } from "@/lib/zcash-crypto";
import { useNetwork } from "@/contexts/NetworkContext";

// ZCash unified viewing key validation (starts with 'uview' for mainnet)
const viewingKeySchema = z
  .string()
  .min(100, "Viewing key is too short")
  .max(1000, "Viewing key is too long")
  .refine(
    (key) =>
      key.startsWith("uview") ||
      key.startsWith("zview") ||
      key.startsWith("utest") ||
      key.startsWith("ztest"),
    {
      message:
        "Invalid viewing key format. Must start with 'uview', 'zview', 'utest', or 'ztest'",
    }
  );

const Auth = () => {
  const { login } = useAuth();
  const { network } = useNetwork();
  const [viewingKey, setViewingKey] = useState("");
  const [birthdayHeight, setBirthdayHeight] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already connected
    const connected = localStorage.getItem("zcash_connected") === "true";
    const storedKey = localStorage.getItem("zcash_viewing_key");
    if (connected && storedKey) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const validateAndConnect = (key: string) => {
    try {
      // 1. Basic Format Validation
      viewingKeySchema.parse(key.trim());

      // 2. Network Compatibility Check
      const keyInfo = parseViewingKey(key.trim());
      if (keyInfo.network !== network) {
        toast({
          title: "Network Mismatch",
          description: `This key is for ${keyInfo.network}, but you are currently on ${network}. Please switch networks in the header.`,
          variant: "destructive",
        });
        return;
      }

      // Use context login to update state globally
      if (birthdayHeight) {
        login(key.trim(), parseInt(birthdayHeight));
      } else {
        login(key.trim());
      }

      toast({
        title: "Wallet Connected",
        description: "Your viewing key has been securely stored locally",
      });
      navigate("/dashboard");
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Invalid Viewing Key",
          description: error.errors[0].message,
          variant: "destructive",
        });
      }
    }
  };

  const handleManualConnect = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    validateAndConnect(viewingKey);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md space-y-6">
        <Button
          variant="outline"
          className="border-accent/50"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Explorer
        </Button>

        <Card className="card-glow bg-card/50 backdrop-blur-sm p-8 border-accent/10">
          <div className="flex flex-col items-center mb-8">
            <Shield className="w-16 h-16 text-accent mb-4" />
            <h1 className="text-3xl font-bold mb-2 text-center">
              Connect Wallet
            </h1>
            <p className="text-muted-foreground text-center">
              Provide your unified viewing key to access your shielded
              transactions
            </p>
          </div>

          <form onSubmit={handleManualConnect} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="viewingKey">Unified Viewing Key</Label>
              <div className="relative">
                <Input
                  id="viewingKey"
                  type={showKey ? "text" : "password"}
                  placeholder="uview1..."
                  value={viewingKey}
                  onChange={(e) => setViewingKey(e.target.value)}
                  className="bg-secondary border-accent/20 focus:border-accent pr-10 font-mono text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showKey ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Your viewing key never leaves your device
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthdayHeight">Birthday Height (Optional)</Label>
              <Input
                id="birthdayHeight"
                type="number"
                placeholder="e.g. 2500000"
                value={birthdayHeight}
                onChange={(e) => setBirthdayHeight(e.target.value)}
                className="bg-secondary border-accent/20 focus:border-accent font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Scanning will start from this block height. Defaults to 500,000
                blocks ago.
              </p>
            </div>

            <Button
              type="submit"
              disabled={loading || !viewingKey}
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              {loading ? "Connecting..." : "Connect"}
            </Button>
          </form>
        </Card>

        <div className="text-center text-sm text-muted-foreground space-y-2">
          <p>🔒 Your viewing key is stored locally and never transmitted</p>
          <p>✅ All transaction decryption happens client-side</p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
