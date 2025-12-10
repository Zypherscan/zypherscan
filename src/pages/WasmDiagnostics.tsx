import { useState } from "react";
import { testWasm, detectKeyType, decryptMemo } from "@/lib/wasm-loader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Loader2, AlertCircle } from "lucide-react";

export default function WasmDiagnostics() {
  const [wasmStatus, setWasmStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [wasmMessage, setWasmMessage] = useState("");

  const [viewingKey, setViewingKey] = useState("");
  const [keyType, setKeyType] = useState("");
  const [keyTestLoading, setKeyTestLoading] = useState(false);

  const [txHex, setTxHex] = useState("");
  const [decryptResult, setDecryptResult] = useState<any>(null);
  const [decryptError, setDecryptError] = useState("");
  const [decryptLoading, setDecryptLoading] = useState(false);

  const handleTestWasm = async () => {
    setWasmStatus("loading");
    setWasmMessage("Loading WASM module...");

    try {
      const result = await testWasm();
      setWasmStatus("success");
      setWasmMessage(`✅ WASM Module Loaded: ${result}`);
      console.log("WASM test result:", result);
    } catch (err: any) {
      setWasmStatus("error");
      setWasmMessage(`❌ WASM Error: ${err.message}`);
      console.error("WASM test error:", err);
    }
  };

  const handleTestKey = async () => {
    if (!viewingKey) return;

    setKeyTestLoading(true);
    setKeyType("");

    try {
      const type = await detectKeyType(viewingKey);
      setKeyType(`✅ Key Type: ${type}`);
      console.log("Key type:", type);
    } catch (err: any) {
      setKeyType(`❌ Error: ${err.message}`);
      console.error("Key detection error:", err);
    } finally {
      setKeyTestLoading(false);
    }
  };

  const handleDecrypt = async () => {
    if (!txHex || !viewingKey) {
      setDecryptError("Please provide both transaction hex and viewing key");
      return;
    }

    setDecryptLoading(true);
    setDecryptError("");
    setDecryptResult(null);

    try {
      console.log("Attempting decryption...");
      console.log("TX hex length:", txHex.length);
      console.log("Viewing key prefix:", viewingKey.substring(0, 20));

      const result = await decryptMemo(txHex, viewingKey);
      console.log("Decryption result:", result);

      setDecryptResult(result);
    } catch (err: any) {
      console.error("Decryption error:", err);
      setDecryptError(err.message || String(err));
    } finally {
      setDecryptLoading(false);
    }
  };

  const loadFromLocalStorage = () => {
    const storedKey = localStorage.getItem("zcash_viewing_key");
    if (storedKey) {
      setViewingKey(storedKey);
      setKeyType("Loaded from localStorage");
    } else {
      setKeyType("❌ No viewing key found in localStorage");
    }
  };

  return (
    <div className="container px-6 py-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">WASM Decryption Diagnostics</h1>
        <p className="text-muted-foreground">
          Test WASM loading, viewing key detection, and memo decryption
        </p>
      </div>

      <div className="space-y-6">
        {/* WASM Status Test */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">1. WASM Module Test</h2>
          <div className="space-y-4">
            <Button
              onClick={handleTestWasm}
              disabled={wasmStatus === "loading"}
            >
              {wasmStatus === "loading" ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                "Test WASM Loading"
              )}
            </Button>

            {wasmMessage && (
              <Alert
                variant={wasmStatus === "error" ? "destructive" : "default"}
              >
                <div className="flex items-start gap-2">
                  {wasmStatus === "success" && (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  )}
                  {wasmStatus === "error" && <XCircle className="w-5 h-5" />}
                  {wasmStatus === "loading" && (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  )}
                  <AlertDescription className="font-mono text-sm">
                    {wasmMessage}
                  </AlertDescription>
                </div>
              </Alert>
            )}
          </div>
        </Card>

        {/* Viewing Key Test */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">2. Viewing Key Test</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="viewingKey">Viewing Key</Label>
              <div className="flex gap-2">
                <Input
                  id="viewingKey"
                  type="text"
                  placeholder="uviewtest... or uview..."
                  value={viewingKey}
                  onChange={(e) => setViewingKey(e.target.value)}
                  className="font-mono text-sm"
                />
                <Button variant="outline" onClick={loadFromLocalStorage}>
                  Load from Storage
                </Button>
              </div>
            </div>

            <Button
              onClick={handleTestKey}
              disabled={!viewingKey || keyTestLoading}
            >
              {keyTestLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Detecting...
                </>
              ) : (
                "Detect Key Type"
              )}
            </Button>

            {keyType && (
              <Alert>
                <AlertDescription className="font-mono text-sm">
                  {keyType}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </Card>

        {/* Decryption Test */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">3. Memo Decryption Test</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="txHex">Transaction Hex (Raw)</Label>
              <Textarea
                id="txHex"
                placeholder="Paste raw transaction hex here..."
                value={txHex}
                onChange={(e) => setTxHex(e.target.value)}
                className="font-mono text-xs h-32"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Get this from: curl -X POST https://zebra.up.railway.app -d
                '&#123;"method":"getrawtransaction","params":["TXID",0]&#125;'
              </p>
            </div>

            <Button
              onClick={handleDecrypt}
              disabled={!txHex || !viewingKey || decryptLoading}
            >
              {decryptLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Decrypting...
                </>
              ) : (
                "Decrypt Memo"
              )}
            </Button>

            {decryptError && (
              <Alert variant="destructive">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription className="whitespace-pre-wrap">
                  {decryptError}
                </AlertDescription>
              </Alert>
            )}

            {decryptResult && (
              <Alert>
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <AlertDescription>
                  <div className="space-y-2">
                    <div>
                      <strong>Amount:</strong> {decryptResult.amount} ZEC
                    </div>
                    <div>
                      <strong>Memo:</strong>
                      <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto">
                        {decryptResult.memo}
                      </pre>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </Card>

        {/* Quick Test Transactions */}
        <Card className="p-6 bg-blue-500/10 border-blue-500/20">
          <h2 className="text-xl font-bold mb-4">Quick Test Transactions</h2>
          <div className="space-y-2 text-sm">
            <p>
              <strong>TX 1:</strong>{" "}
              <code className="text-xs">
                a5dbd801cd70289d1a07964313518f9bee22f548ea987ff773f918f8a553fb89
              </code>
            </p>
            <p>
              <strong>TX 2:</strong>{" "}
              <code className="text-xs">
                6a2b45beb2b3fffb42e938b4d41fa1760af23bf03bfb7c16dc203bfa1f1f3a68
              </code>
            </p>
            <p className="text-muted-foreground mt-4">
              Both are Orchard transactions. If decryption fails, check:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Viewing key matches the RECEIVING address</li>
              <li>Viewing key format is correct (uviewtest... or uview...)</li>
              <li>Transaction was actually sent to your address</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}
