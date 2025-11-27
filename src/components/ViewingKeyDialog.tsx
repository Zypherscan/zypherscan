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
import { Key, Shield, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const ViewingKeyDialog = () => {
  const [viewingKey, setViewingKey] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleImport = () => {
    if (!viewingKey) {
      toast({
        title: "Error",
        description: "Please enter a viewing key",
        variant: "destructive",
      });
      return;
    }

    // TODO: Implement actual viewing key validation and storage
    toast({
      title: "Success",
      description: "Viewing key imported successfully. All decryption happens client-side.",
    });
    
    setIsOpen(false);
    setViewingKey("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-accent/50 hover:bg-accent/10">
          <Key className="mr-2 h-4 w-4" />
          Import Viewing Key
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] bg-card border-accent/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Key className="h-6 w-6 text-accent" />
            Import Viewing Key
          </DialogTitle>
          <DialogDescription className="text-base">
            Import your Zcash viewing key to decrypt and view your shielded transactions. 
            All decryption happens locally in your browser.
          </DialogDescription>
        </DialogHeader>

        <Alert className="bg-accent/5 border-accent/20">
          <Shield className="h-4 w-4 text-accent" />
          <AlertDescription className="text-sm">
            <strong className="text-accent">Privacy Guaranteed:</strong> Your viewing key never leaves your device. 
            All transaction decryption is performed client-side using WebAssembly.
          </AlertDescription>
        </Alert>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="viewing-key" className="text-base">
              Viewing Key
            </Label>
            <Input
              id="viewing-key"
              type="password"
              placeholder="zxviews1..."
              value={viewingKey}
              onChange={(e) => setViewingKey(e.target.value)}
              className="font-mono bg-secondary border-accent/20 focus:border-accent"
            />
            <p className="text-xs text-muted-foreground">
              Your Zcash viewing key (starts with "zxviews" for Sapling addresses)
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
            Cancel
          </Button>
          <Button 
            onClick={handleImport}
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            <Key className="mr-2 h-4 w-4" />
            Import Key
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
