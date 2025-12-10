import { useEffect, useState } from "react";
import { testWasm, detectKeyType } from "@/lib/wasm-loader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function WasmTest() {
  const [wasmStatus, setWasmStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [wasmMessage, setWasmMessage] = useState("Initializing WASM module...");
  const [testKey, setTestKey] = useState("");
  const [keyType, setKeyType] = useState("");
  const [keyTestLoading, setKeyTestLoading] = useState(false);

  useEffect(() => {
    testWasm()
      .then((result) => {
        setWasmStatus("success");
        setWasmMessage(`✅ WASM Module Loaded: ${result}`);
        console.log("WASM test result:", result);
      })
      .catch((err) => {
        setWasmStatus("error");
        setWasmMessage(`❌ WASM Error: ${err.message}`);
        console.error("WASM test error:", err);
      });
  }, []);

  const handleTestKey = async () => {
    if (!testKey) return;

    setKeyTestLoading(true);
    setKeyType("");

    try {
      const type = await detectKeyType(testKey);
      setKeyType(`Key Type: ${type}`);
    } catch (err: any) {
      setKeyType(`Error: ${err.message}`);
    } finally {
      setKeyTestLoading(false);
    }
  };

  return (
    <div className="container px-6 py-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">WASM Integration Test</h1>
        <p className="text-muted-foreground">
          Testing client-side Orchard memo decryption from CipherScan
        </p>
      </div>

      <div className="space-y-6">
        {/* WASM Status Card */}
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              {wasmStatus === "loading" && (
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              )}
              {wasmStatus === "success" && (
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              )}
              {wasmStatus === "error" && (
                <XCircle className="w-8 h-8 text-red-500" />
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-2">WASM Module Status</h2>
              <p className="text-sm text-muted-foreground font-mono whitespace-pre-wrap">
                {wasmMessage}
              </p>
            </div>
          </div>
        </Card>

        {/* Key Type Detection Test */}
        {wasmStatus === "success" && (
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">
              Test Viewing Key Detection
            </h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="testKey">Enter a Viewing Key</Label>
                <Input
                  id="testKey"
                  type="text"
                  placeholder="uviewtest... or uview..."
                  value={testKey}
                  onChange={(e) => setTestKey(e.target.value)}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Example: uviewtest1... (testnet) or uview1... (mainnet)
                </p>
              </div>

              <Button
                onClick={handleTestKey}
                disabled={!testKey || keyTestLoading}
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
                <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                  <p className="font-mono text-sm">{keyType}</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Integration Info */}
        <Card className="p-6 bg-blue-500/10 border-blue-500/20">
          <h2 className="text-xl font-bold mb-2">
            ✨ CipherScan Features Integrated
          </h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>✅ Client-side Orchard memo decryption (WASM)</li>
            <li>✅ Batch transaction scanning</li>
            <li>✅ Transaction fetching from TXID</li>
            <li>✅ Viewing key type detection</li>
            <li>✅ Utility functions (formatZcash, formatTimestamp)</li>
          </ul>
          <p className="mt-4 text-sm">
            See <code className="text-accent">CIPHERSCAN_INTEGRATION.md</code>{" "}
            for full integration guide.
          </p>
        </Card>

        {/* Next Steps */}
        {wasmStatus === "success" && (
          <Card className="p-6 bg-green-500/10 border-green-500/20">
            <h2 className="text-xl font-bold mb-2">🚀 Next Steps</h2>
            <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
              <li>Test decryption on the Decrypt Tool page</li>
              <li>Implement batch transaction scanner (Inbox feature)</li>
              <li>Enhance Privacy Dashboard with CipherScan metrics</li>
              <li>Add Mempool viewer</li>
              <li>Implement WebSocket real-time updates (optional)</li>
            </ol>
          </Card>
        )}

        {wasmStatus === "error" && (
          <Card className="p-6 bg-red-500/10 border-red-500/20">
            <h2 className="text-xl font-bold mb-2">🐛 Troubleshooting</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                • Check that <code>/public/wasm/zcash_wasm.js</code> and{" "}
                <code>/public/wasm/zcash_wasm_bg.wasm</code> exist
              </li>
              <li>• Verify your Vite config allows WASM imports</li>
              <li>• Check browser console for detailed error messages</li>
              <li>• Ensure you're running the dev server (npm run dev)</li>
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
}
