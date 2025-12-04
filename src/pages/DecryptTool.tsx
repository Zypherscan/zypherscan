import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useZcashAPI } from "@/hooks/useZcashAPI";
import { decryptMemo } from "@/lib/wasm-loader";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, Unlock, ArrowRight } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const DecryptTool = () => {
  const { viewingKey, isConnected } = useAuth();
  const { searchBlockchain } = useZcashAPI();
  const { toast } = useToast();

  const [txid, setTxid] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ memo: string; amount: number } | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const handleDecrypt = async () => {
    if (!txid) return;
    if (!isConnected || !viewingKey) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your viewing key first.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log("Fetching raw transaction hex for:", txid);

      // Fetch raw transaction hex via Supabase zcash-api
      // Note: Cipherscan doesn't provide raw hex, only metadata
      const response = await supabase.functions.invoke("zcash-api", {
        body: { action: "getRawTransaction", txid },
      });

      console.log("API response:", response);

      if (response.error) {
        console.error("API error:", response.error);
        throw new Error(
          "Failed to fetch transaction. This requires a working Zcash RPC node.\n\n" +
            "Please ensure:\n" +
            "1. The zcash-api Supabase function is deployed\n" +
            "2. Your Zebra RPC node is running and accessible\n" +
            "3. The transaction ID is correct"
        );
      }

      if (!response.data?.hex) {
        console.error("No hex in response:", response.data);
        throw new Error(
          "Transaction hex not available. The transaction might not exist or the RPC node is not responding."
        );
      }

      const txHex = response.data.hex;
      console.log("✓ Got transaction hex, length:", txHex.length);

      // Decrypt using WASM
      console.log("Attempting to decrypt transaction...");

      try {
        const decrypted = await decryptMemo(txHex, viewingKey);
        console.log("Decryption result:", decrypted);

        if (decrypted && (decrypted.memo || decrypted.amount > 0)) {
          setResult({
            memo: decrypted.memo || "No memo",
            amount: decrypted.amount,
          });
          toast({
            title: "Success!",
            description: "Transaction decrypted successfully.",
          });
        } else {
          setError(
            "Could not decrypt this transaction with your viewing key.\n\n" +
              "This transaction may:\n" +
              "• Not be sent to your address\n" +
              "• Not be an Orchard transaction\n" +
              "• Be encrypted for a different viewing key"
          );
        }
      } catch (decryptError) {
        console.log("WASM decryption error:", decryptError);
        const errorMsg =
          decryptError instanceof Error
            ? decryptError.message
            : String(decryptError);

        if (
          errorMsg.includes("No memo found") ||
          errorMsg.includes("viewing key doesn't match")
        ) {
          setError(
            "This transaction is not encrypted for your viewing key.\n\n" +
              "Possible reasons:\n" +
              "• The transaction was sent to a different address\n" +
              "• You're using the wrong viewing key\n" +
              "• The transaction only has transparent or Sapling outputs (not Orchard)"
          );
        } else {
          setError(`Decryption error: ${errorMsg}`);
        }
      }
    } catch (err) {
      console.error("Decryption failed:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch transaction";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container px-6 py-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Unlock className="w-8 h-8 text-accent" />
          Decrypt Transaction
        </h1>
        <p className="text-muted-foreground">
          Manually decrypt a transaction to view its memo and amount.
          <br />
          <span className="text-yellow-500 text-sm">
            Note: Only Orchard transactions are currently supported.
          </span>
        </p>
      </div>

      <Card className="p-6 bg-card/50 backdrop-blur-sm border-accent/10">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="txid">Transaction ID</Label>
            <div className="flex gap-2">
              <Input
                id="txid"
                placeholder="Enter TXID..."
                value={txid}
                onChange={(e) => setTxid(e.target.value)}
                className="font-mono"
              />
              <Button onClick={handleDecrypt} disabled={loading || !txid}>
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm whitespace-pre-wrap">
              {error}
            </div>
          )}

          {result && (
            <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Amount
                </h3>
                <p className="text-2xl font-bold font-mono text-accent">
                  {result.amount.toFixed(8)} ZEC
                </p>
              </div>

              <div className="p-4 rounded-lg bg-card border border-border">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Memo
                </h3>
                <p className="font-mono text-sm whitespace-pre-wrap break-all">
                  {result.memo}
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default DecryptTool;
