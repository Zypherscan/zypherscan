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

// Zcash unified viewing key validation (starts with 'uview' for mainnet)
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
    },
  );

const Auth = () => {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const { login } = useAuth();
  const { network } = useNetwork();
  const [viewingKey, setViewingKey] = useState("");
  const [birthdayHeight, setBirthdayHeight] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasExtension, setHasExtension] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already connected
    const connected = localStorage.getItem("zcash_connected") === "true";
    const storedKey = localStorage.getItem("zcash_viewing_key");
    if (connected && storedKey) {
      navigate("/dashboard");
    }

    // Check for Zucchini wallet
    const checkExtension = () => {
      // @ts-ignore
      const hasZucchini = !!window.zucchini;
      setHasExtension(hasZucchini);
    };

    checkExtension();
    window.addEventListener("load", checkExtension);
    return () => window.removeEventListener("load", checkExtension);
  }, [navigate]);

  const handleZucchiniConnect = async () => {
    // @ts-ignore
    if (window.zucchini) {
      try {
        setLoading(true);
        // 1. Establish connection
        // @ts-ignore
        await window.zucchini.request({
          method: "connect",
          params: { permissions: ["view_keys"] },
        });

        // 2. Fetch the viewing key
        // @ts-ignore
        const result = await window.zucchini.request({
          method: "getUniversalViewingKey",
        });

        if (result) {
          if (result.error) {
            throw new Error(result.error);
          }
          // Handle both simple string response or object with viewingKey property
          const key = typeof result === "string" ? result : result.viewingKey;

          if (key) {
            login(key, 3150000);
            toast({
              title: "Wallet Connected",
              description: "Connected to Zucchini wallet successfully",
            });
            navigate("/dashboard");
          }
        }
      } catch (error) {
        console.error("Connection failed", error);
        toast({
          title: "Connection Failed",
          description: "Could not connect to Zucchini wallet",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
  };

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
    <div className="min-h-screen flex flex-col px-6 py-12">
      <div className="container mx-auto max-w-5xl flex-1 flex flex-col justify-center">
        <Button
          variant="ghost"
          className="self-start mb-8 text-muted-foreground hover:text-foreground pl-0"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Explorer
        </Button>

        <div className="flex flex-col items-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-center bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground">
            Connect Your Wallet
          </h1>
          <p className="text-lg text-muted-foreground text-center max-w-2xl">
            Choose how you want to connect to Zypherscan to view your shielded
            transaction history securely.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* Option 1: Zucchini Wallet */}
          <Card
            className={`relative overflow-hidden group border-2 transition-all duration-300 ${
              hasExtension
                ? "border-green-500/20 hover:border-green-500/50 hover:shadow-lg hover:shadow-green-500/10"
                : "border-accent/10 hover:border-accent/30"
            } flex flex-col`}
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Shield className="w-32 h-32 text-foreground" />
            </div>

            <div className="p-8 flex flex-col h-full relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center p-2">
                  <img
                    src="https://zucchinifi.xyz/icon-128.png"
                    alt="Zucchini Wallet"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Zucchini Wallet</h2>
                  <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
                    Recommended
                  </span>
                </div>
              </div>

              <div className="space-y-4 flex-1">
                <p className="text-muted-foreground leading-relaxed">
                  The privacy-first Zcash wallet for your browser. Connect
                  instantly without copy-pasting sensitive keys.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground/80">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    One-click connection
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    Auto-detects viewing keys
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    Secure
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-border/50">
                {hasExtension ? (
                  <Button
                    onClick={handleZucchiniConnect}
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-700 text-white shadow-md shadow-green-500/20"
                  >
                    {loading ? "Connecting..." : "Connect Zucchini Wallet"}
                  </Button>
                ) : (
                  <a
                    href="https://chromewebstore.google.com/detail/zucchini/khaifnjdhfaadfhgbilokobnaalmimad"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 bg-green-600 hover:bg-green-700 text-white shadow-md shadow-green-500/20"
                  >
                    Install Zucchini Wallet
                  </a>
                )}
              </div>
            </div>
          </Card>

          {/* Option 2: Manual Input */}
          <Card className="border-2 border-accent/10 hover:border-accent/30 transition-all duration-300 flex flex-col">
            <div className="p-8 flex flex-col h-full">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Key className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Manual Entry</h2>
                  <span className="text-xs font-medium text-muted-foreground bg-accent/10 px-2 py-0.5 rounded-full">
                    Advanced
                  </span>
                </div>
              </div>

              <div className="space-y-4 flex-1">
                <p className="text-muted-foreground leading-relaxed">
                  Manually enter your Unified Viewing Key (starts with{" "}
                  <code>uview</code>) to access your data.
                </p>

                <form
                  id="manual-connect-form"
                  onSubmit={handleManualConnect}
                  className="space-y-4 mt-6"
                >
                  <div className="space-y-2">
                    <Label
                      htmlFor="viewingKey"
                      className="text-xs uppercase tracking-wider text-muted-foreground font-semibold"
                    >
                      Unified Viewing Key
                    </Label>
                    <div className="relative">
                      <Input
                        id="viewingKey"
                        type={showKey ? "text" : "password"}
                        placeholder="uview1..."
                        value={viewingKey}
                        onChange={(e) => setViewingKey(e.target.value)}
                        className="bg-secondary/50 border-border focus:border-accent font-mono text-sm pr-10 transition-all focus:bg-background"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showKey ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="birthdayHeight"
                      className="text-xs uppercase tracking-wider text-muted-foreground font-semibold"
                    >
                      Birthday Height{" "}
                      <span className="text-muted-foreground/50 lowercase font-normal">
                        (optional)
                      </span>
                    </Label>
                    <Input
                      id="birthdayHeight"
                      type="number"
                      placeholder="e.g. 2500000"
                      value={birthdayHeight}
                      onChange={(e) => setBirthdayHeight(e.target.value)}
                      className="bg-secondary/50 border-border focus:border-accent font-mono text-sm transition-all focus:bg-background"
                    />
                  </div>
                </form>
              </div>

              <div className="mt-8 pt-6 border-t border-border/50">
                <Button
                  type="submit"
                  form="manual-connect-form"
                  disabled={loading || !viewingKey}
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  {loading ? "Connecting..." : "Connect Manually"}
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-12 text-center text-sm text-muted-foreground/60 space-y-1">
          <p className="flex items-center justify-center gap-2">
            <Shield className="w-3 h-3" />
            Your keys are stored locally and never transmitted to any server.
          </p>
          <p>Decryption happens entirely client-side for maximum privacy.</p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
