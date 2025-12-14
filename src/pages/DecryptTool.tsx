import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useWalletData } from "@/hooks/useWalletData";
import { useZcashAPI } from "@/hooks/useZcashAPI";
// import { decryptMemo } from "@/lib/wasm-loader"; // Removed WASM
// import { supabase } from "@/integrations/supabase/client"; // Removed Supabase
import { scanWallet } from "@/lib/scanner-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, Unlock, ArrowRight, ArrowLeft } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const DecryptTool = () => {
  const navigate = useNavigate();
  const { viewingKey, isConnected, getBirthdayHeight } = useAuth();
  const { transactions } = useWalletData(); // Uses context now
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

    // OPTIMIZATION: Check if we already have this transaction in our history
    // This assumes the user has already synced on the Dashboard.
    if (transactions.length > 0) {
      const found = transactions.find((t) => t.txid === txid);
      if (found) {
        console.log(
          "[DecryptTool] Found transaction in history cache! Skipping scan."
        );
        setResult({
          memo: found.memo || "No memo found.",
          amount: Math.abs(found.amount),
        });
        toast({
          title: "Success",
          description: "Transaction decrypted.",
        });
        setLoading(false);
        return;
      }
    }

    // If not found, fall back to scanning specifically for this TXID
    try {
      const birthday = getBirthdayHeight();
      const response = await scanWallet(viewingKey, birthday, "memo", txid);

      if (response.raw) {
        // Parse raw output for "Memo <n>: <content>"
        const raw = response.raw;
        if (raw.includes("Transaction not found")) {
          throw new Error(
            "Transaction not found in history. Ensure the wallet is synced."
          );
        }

        // ... rest of parsing logic ...
        if (raw.includes("No memos found")) {
          setResult({
            memo: "No memos found for this transaction.",
            amount: 0,
          });
          return;
        }

        const lines = raw.split("\n");
        const memoLines = lines.filter((l) => l.trim().startsWith("Memo"));
        const memoText = memoLines
          .map((l) => l.replace(/^Memo \d+: /, ""))
          .join("\n\n");

        if (memoText) {
          setResult({
            memo: memoText,
            amount: 0,
          });
          toast({
            title: "Success!",
            description: "Transaction decrypted successfully.",
          });
        } else {
          throw new Error("Could not parse memos from output.");
        }
      } else {
        throw new Error("No response from scanner.");
      }
    } catch (err) {
      console.error("Decryption failed:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to decrypt transaction";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container px-6 py-8 max-w-2xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-muted-foreground hover:text-accent transition-colors mb-4"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back</span>
      </button>

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
