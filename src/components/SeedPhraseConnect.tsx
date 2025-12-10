import { useState } from "react";
import {
  deriveUFVKFromSeed,
  validateSeedPhrase,
  getSeedWordCount,
} from "@/lib/seed-phrase-utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  AlertTriangle,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  Shield,
} from "lucide-react";

interface SeedPhraseConnectProps {
  onConnect: (ufvk: string) => void;
  onCancel?: () => void;
}

export function SeedPhraseConnect({
  onConnect,
  onCancel,
}: SeedPhraseConnectProps) {
  const [step, setStep] = useState<"warning" | "input">("warning");
  const [seedPhrase, setSeedPhrase] = useState("");
  const [accountIndex, setAccountIndex] = useState(0);
  const [network, setNetwork] = useState<"mainnet" | "testnet">("mainnet");
  const [showSeed, setShowSeed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationStatus, setValidationStatus] = useState<
    "idle" | "valid" | "invalid"
  >("idle");

  // Validate seed phrase as user types
  const handleSeedChange = async (value: string) => {
    setSeedPhrase(value);
    setError("");

    const trimmed = value.trim();
    if (!trimmed) {
      setValidationStatus("idle");
      return;
    }

    // Check if it looks like a complete seed phrase
    const words = trimmed.split(/\s+/).filter((w) => w.length > 0);
    const wordCount = words.length;

    if (wordCount === 12 || wordCount === 24) {
      try {
        const isValid = await validateSeedPhrase(trimmed);
        setValidationStatus(isValid ? "valid" : "invalid");
        if (!isValid) {
          setError(
            `Invalid seed phrase. Please check your ${wordCount} words are correct BIP39 words.`
          );
        }
      } catch (err) {
        console.error("Validation error:", err);
        setValidationStatus("invalid");
        setError("Error validating seed phrase. Make sure WASM is loaded.");
      }
    } else {
      setValidationStatus("idle");
      if (wordCount > 0) {
        setError(
          `Seed phrase should have 12 or 24 words. Currently: ${wordCount} words.`
        );
      }
    }
  };

  const handleDerive = async () => {
    setLoading(true);
    setError("");

    try {
      // Final validation
      const isValid = await validateSeedPhrase(seedPhrase.trim());
      if (!isValid) {
        setError("Invalid seed phrase. Please check and try again.");
        return;
      }

      // Get word count for logging
      const wordCount = await getSeedWordCount(seedPhrase.trim());

      // Derive UFVK
      const ufvk = await deriveUFVKFromSeed(
        seedPhrase.trim(),
        accountIndex,
        network
      );

      // Clear seed phrase immediately
      setSeedPhrase("");

      // Connect with derived UFVK
      onConnect(ufvk);
    } catch (err: any) {
      console.error("Derivation error:", err);
      setError(
        err.message ||
          "Failed to derive viewing key. Please check your seed phrase."
      );
    } finally {
      setLoading(false);
    }
  };

  if (step === "warning") {
    return (
      <Card className="p-6 border-2 border-destructive">
        <div className="space-y-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-8 h-8 text-destructive flex-shrink-0 mt-1" />
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-destructive">
                ⚠️ SECURITY WARNING ⚠️
              </h2>

              <div className="space-y-3 text-sm">
                <p className="font-semibold text-base">
                  Your seed phrase gives{" "}
                  <span className="text-destructive">FULL ACCESS</span> to your
                  funds!
                </p>

                <div className="bg-destructive/10 p-4 rounded-lg space-y-2">
                  <p className="font-semibold">
                    Only enter your seed phrase if:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>You trust this device completely</li>
                    <li>You're on a secure, private network</li>
                    <li>You understand the security risks</li>
                    <li>You have no other option (viewing key preferred)</li>
                  </ul>
                </div>

                <div className="bg-terminal-green/10 p-4 rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-terminal-green" />
                    <p className="font-semibold">What we do to protect you:</p>
                  </div>
                  <ul className="list-disc list-inside space-y-1 ml-2 text-xs">
                    <li>Seed phrase is used ONLY to derive a viewing key</li>
                    <li>Seed phrase is NOT stored anywhere</li>
                    <li>Seed phrase is cleared from memory immediately</li>
                    <li>Only the viewing key is saved (can't spend funds)</li>
                    <li>All processing happens locally in your browser</li>
                  </ul>
                </div>

                <Alert>
                  <AlertDescription className="text-xs">
                    <strong>Recommended:</strong> Use a viewing key instead of
                    seed phrase. Export your viewing key from your wallet
                    (YWallet, Zingo, etc.) and use that to connect.
                  </AlertDescription>
                </Alert>
              </div>

              <div className="flex gap-3 pt-4">
                {onCancel && (
                  <Button
                    variant="outline"
                    onClick={onCancel}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  variant="destructive"
                  onClick={() => setStep("input")}
                  className="flex-1"
                >
                  I Understand, Continue
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold mb-2">Enter Seed Phrase</h2>
          <p className="text-sm text-muted-foreground">
            Your seed phrase will be used to derive a viewing key and then
            immediately cleared.
          </p>
        </div>

        <div className="space-y-4">
          {/* Seed Phrase Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="seedPhrase" className="flex items-center gap-2">
                Seed Phrase (12 or 24 words)
                {validationStatus === "valid" && (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                )}
              </Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSeed(!showSeed)}
                className="h-8"
              >
                {showSeed ? (
                  <>
                    <EyeOff className="w-4 h-4 mr-1" />
                    Hide
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-1" />
                    Show
                  </>
                )}
              </Button>
            </div>
            <Textarea
              id="seedPhrase"
              placeholder="word1 word2 word3 word4 word5 word6 ..."
              value={seedPhrase}
              onChange={(e) => handleSeedChange(e.target.value)}
              className={`font-mono text-sm ${
                validationStatus === "valid"
                  ? "border-green-500"
                  : validationStatus === "invalid"
                  ? "border-destructive"
                  : ""
              }`}
              rows={4}
              style={
                {
                  WebkitTextSecurity: showSeed ? "none" : "disc",
                  fontFamily: showSeed ? "monospace" : "monospace",
                } as React.CSSProperties
              }
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter your 12 or 24 word BIP39 seed phrase, separated by spaces.
            </p>
          </div>

          {/* Account Index */}
          <div>
            <Label htmlFor="accountIndex">Account Index</Label>
            <Input
              id="accountIndex"
              type="number"
              min={0}
              max={100}
              value={accountIndex}
              onChange={(e) => setAccountIndex(parseInt(e.target.value) || 0)}
              className="w-32"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Usually 0 for the first account. Increase if you have multiple
              accounts in your wallet.
            </p>
          </div>

          {/* Network Selection */}
          <div>
            <Label>Network</Label>
            <div className="flex gap-2 mt-2">
              <Button
                variant={network === "mainnet" ? "default" : "outline"}
                onClick={() => setNetwork("mainnet")}
                className="flex-1"
              >
                Mainnet (ZEC)
              </Button>
              <Button
                variant={network === "testnet" ? "default" : "outline"}
                onClick={() => setNetwork("testnet")}
                className="flex-1"
              >
                Testnet (TAZ)
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Select the network that matches your wallet and transactions.
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setStep("warning")}
              disabled={loading}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              onClick={handleDerive}
              disabled={
                !seedPhrase.trim() || validationStatus === "invalid" || loading
              }
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deriving...
                </>
              ) : (
                "Derive & Connect"
              )}
            </Button>
          </div>

          {/* Security Reminder */}
          <Alert>
            <Shield className="w-4 h-4" />
            <AlertDescription className="text-xs">
              <strong>Remember:</strong> Your seed phrase will be cleared
              immediately after deriving the viewing key. Only the viewing key
              (which cannot spend funds) will be stored.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </Card>
  );
}
