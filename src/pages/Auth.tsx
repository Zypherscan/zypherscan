import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, ArrowLeft, Upload, Key, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

// Zcash unified viewing key validation (starts with 'uview' for mainnet)
const viewingKeySchema = z
  .string()
  .min(100, "Viewing key is too short")
  .max(1000, "Viewing key is too long")
  .refine((key) => key.startsWith("uview") || key.startsWith("zview"), {
    message: "Invalid viewing key format. Must start with 'uview' or 'zview'",
  });

const Auth = () => {
  const [viewingKey, setViewingKey] = useState("");
  const [birthdayHeight, setBirthdayHeight] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already connected
    const connected = localStorage.getItem("zcash_connected") === "true";
    const storedKey = localStorage.getItem("zcash_viewing_key");
    if (connected && storedKey) {
      navigate("/");
    }
  }, [navigate]);

  const validateAndConnect = (key: string) => {
    try {
      viewingKeySchema.parse(key.trim());

      // Store viewing key client-side only
      localStorage.setItem("zcash_viewing_key", key.trim());
      localStorage.setItem("zcash_connected", "true");
      if (birthdayHeight) {
        localStorage.setItem("zcash_birthday_height", birthdayHeight);
      } else {
        localStorage.removeItem("zcash_birthday_height");
      }

      toast({
        title: "Wallet Connected",
        description: "Your viewing key has been securely stored locally",
      });
      navigate("/");
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

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;

      try {
        // Try parsing as JSON first
        const json = JSON.parse(content);
        const key =
          json.viewing_key || json.viewingKey || json.key || json.ufvk;
        if (key) {
          validateAndConnect(key);
        } else {
          toast({
            title: "Invalid File",
            description: "Could not find viewing key in JSON file",
            variant: "destructive",
          });
        }
      } catch {
        // If not JSON, treat as plain text
        validateAndConnect(content.trim());
      }
    };
    reader.readAsText(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
              Connect With UFVK or Wallet
            </h1>
            <p className="text-muted-foreground text-center">
              Provide your unified viewing key to access your shielded
              transactions
            </p>
          </div>

          <Tabs defaultValue="manual" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="manual" className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                <span className="hidden sm:inline">Manual</span>
              </TabsTrigger>
              <TabsTrigger value="file" className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">File</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="manual">
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
                  <Label htmlFor="birthdayHeight">
                    Birthday Height (Optional)
                  </Label>
                  <Input
                    id="birthdayHeight"
                    type="number"
                    placeholder="e.g. 2500000"
                    value={birthdayHeight}
                    onChange={(e) => setBirthdayHeight(e.target.value)}
                    className="bg-secondary border-accent/20 focus:border-accent font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Scanning will start from this block height. Defaults to
                    500,000 blocks ago.
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
            </TabsContent>

            <TabsContent value="file">
              <div className="space-y-6">
                <div className="border-2 border-dashed border-accent/30 rounded-lg p-8 text-center hover:border-accent/50 transition-colors">
                  <Upload className="w-12 h-12 text-accent mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Import a JSON or TXT file containing your viewing key
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,.txt"
                    onChange={handleFileImport}
                    className="hidden"
                    id="file-upload"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="border-accent/50"
                  >
                    Choose File
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Supported formats: JSON (with viewing_key field) or plain text
                </p>
              </div>
            </TabsContent>
          </Tabs>
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
