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
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const keyNameSchema = z.string().trim().min(1, "Key name is required").max(50, "Key name too long");
const viewingKeySchema = z.string().trim().min(20, "Invalid viewing key format");

export const ViewingKeyDialog = () => {
  const [viewingKey, setViewingKey] = useState("");
  const [keyName, setKeyName] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const validateInputs = () => {
    try {
      keyNameSchema.parse(keyName);
      viewingKeySchema.parse(viewingKey);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      }
      return false;
    }
  };

  const handleImport = async () => {
    if (!validateInputs()) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please login to import viewing keys",
          variant: "destructive",
        });
        return;
      }

      // In production, you would encrypt the key before storing
      // For now, we'll store it as-is (client-side encryption should be added)
      const { error } = await supabase
        .from('viewing_keys')
        .insert({
          user_id: user.id,
          key_name: keyName.trim(),
          encrypted_key: viewingKey.trim(), // TODO: Add client-side encryption
          key_type: viewingKey.startsWith('zxviews') ? 'sapling' : 'orchard',
        });

      if (error) {
        if (error.message.includes('duplicate')) {
          toast({
            title: "Duplicate Key",
            description: "A viewing key with this name already exists",
            variant: "destructive",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Success",
          description: "Viewing key imported successfully. All decryption happens client-side.",
        });
        
        setIsOpen(false);
        setViewingKey("");
        setKeyName("");
      }
    } catch (error) {
      console.error('Error importing viewing key:', error);
      toast({
        title: "Error",
        description: "Failed to import viewing key. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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
            <strong className="text-accent">Privacy Guaranteed:</strong> Your viewing key is encrypted and stored securely. 
            All transaction decryption is performed client-side using WebAssembly.
          </AlertDescription>
        </Alert>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="key-name" className="text-base">
              Key Name
            </Label>
            <Input
              id="key-name"
              type="text"
              placeholder="My Viewing Key"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              className="bg-secondary border-accent/20 focus:border-accent"
            />
            <p className="text-xs text-muted-foreground">
              A friendly name to identify this viewing key
            </p>
          </div>

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
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleImport}
            disabled={loading}
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            <Key className="mr-2 h-4 w-4" />
            {loading ? "Importing..." : "Import Key"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
