import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Key, Shield, AlertCircle, Eye, EyeOff, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { z } from "zod";

const viewingKeySchema = z.string()
  .min(10, "Viewing key is too short")
  .refine(
    (val) => val.startsWith("uview") || val.startsWith("zxview") || val.startsWith("sapling"),
    "Invalid viewing key format"
  );

export const ViewingKeyDialog = () => {
  const { viewingKey, getViewingKey } = useAuth();
  const [newKey, setNewKey] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);

  const truncateKey = (key: string | null) => {
    if (!key) return "Not set";
    if (showKey) return key;
    return `${key.slice(0, 12)}${"•".repeat(20)}${key.slice(-8)}`;
  };

  const handleCopy = async () => {
    const key = getViewingKey();
    if (key) {
      await navigator.clipboard.writeText(key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Viewing key copied to clipboard");
    }
  };

  const handleUpdateKey = () => {
    const result = viewingKeySchema.safeParse(newKey.trim());
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    localStorage.setItem("zcash_viewing_key", newKey.trim());
    toast.success("Viewing key updated");
    setNewKey("");
    setIsOpen(false);
    window.location.reload(); // Reload to refresh with new key
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-accent/50 hover:bg-accent/10">
          <Key className="mr-2 h-4 w-4" />
          Viewing Key
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] bg-card border-accent/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Key className="h-6 w-6 text-accent" />
            Your Viewing Key
          </DialogTitle>
          <DialogDescription className="text-base">
            Manage your Zcash viewing key. All decryption happens locally in your browser.
          </DialogDescription>
        </DialogHeader>

        <Alert className="bg-accent/5 border-accent/20">
          <Shield className="h-4 w-4 text-accent" />
          <AlertDescription className="text-sm">
            <strong className="text-accent">Privacy Guaranteed:</strong> Your viewing key never leaves your device.
            All transaction decryption is performed client-side.
          </AlertDescription>
        </Alert>

        <div className="space-y-4 py-4">
          {/* Current Key Display */}
          <div className="space-y-2">
            <Label className="text-base">Current Viewing Key</Label>
            <div className="flex gap-2">
              <div className="flex-1 bg-secondary rounded-md px-3 py-2 font-mono text-sm break-all">
                {truncateKey(viewingKey)}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowKey(!showKey)}
                title={showKey ? "Hide key" : "Show key"}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopy}
                title="Copy key"
              >
                {copied ? <Check className="w-4 h-4 text-terminal-green" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Update Key Section */}
          <div className="space-y-2 pt-4 border-t border-border">
            <Label htmlFor="new-viewing-key" className="text-base">
              Update Viewing Key
            </Label>
            <Input
              id="new-viewing-key"
              type="password"
              placeholder="uview1..."
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              className="font-mono bg-secondary border-accent/20 focus:border-accent"
            />
            <p className="text-xs text-muted-foreground">
              Enter a new unified viewing key to replace the current one
            </p>
          </div>

          <Alert className="bg-muted/50 border-border">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>What can I do with a viewing key?</strong>
              <ul className="mt-2 space-y-1 list-disc list-inside">
                <li>View incoming and outgoing shielded transactions</li>
                <li>See transaction amounts and memos</li>
                <li>Verify your transaction history</li>
                <li>Audit your private balances</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Close
          </Button>
          <Button 
            onClick={handleUpdateKey}
            disabled={!newKey}
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            <Key className="mr-2 h-4 w-4" />
            Update Key
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
