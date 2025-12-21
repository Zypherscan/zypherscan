import { ReactNode, useRef, useEffect } from "react";
import QRCode from "qrcode";
import { Copy } from "lucide-react";
import copy from "copy-to-clipboard";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";

const PaymentQRCode = ({
  value,
  logoUrl,
}: {
  value: string;
  logoUrl: string;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        value,
        {
          width: 220,
          margin: 2,
          errorCorrectionLevel: "H",
          color: {
            dark: "#000000",
            light: "#ffffff",
          },
        },
        (err) => {
          if (err) console.error(err);
          // Draw logo
          const canvas = canvasRef.current;
          if (!canvas) return;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;

          const img = new Image();
          img.src = logoUrl;
          img.onload = () => {
            const size = 48; // Logo size
            const x = (canvas.width - size) / 2;
            const y = (canvas.height - size) / 2;

            ctx.drawImage(img, x, y, size, size);
          };
        }
      );
    }
  }, [value, logoUrl]);

  return <canvas ref={canvasRef} className="rounded-lg" />;
};

interface SupportDialogProps {
  children: ReactNode;
}

export const SupportDialog = ({ children }: SupportDialogProps) => {
  const { toast } = useToast();

  const handleCopyAddress = (address: string) => {
    const isCopied = copy(address);
    if (isCopied) {
      toast({
        title: "Address Copied",
        description: "Zcash Unified Address copied to clipboard",
      });
    } else {
      toast({
        title: "Copy Failed",
        description: "Please manually copy the address",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="bg-[#12171d] border-border/20 text-foreground w-[90vw] sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">
            Support Zypherscan
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground pt-2">
            Your donation is private and encrypted.
            <br />
            Thank you for support! 🙏
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-6 py-4">
          <div className="p-4 bg-white rounded-xl shadow-lg shadow-black/20">
            <PaymentQRCode
              value="u1htqcdyp8lp9l3t0z4929zgc4fk7xnrk96s4rg6fwnev6l99zuy7nh6e73s67s24cvz7ra8897wu074tegslrq6e5f3nd7tz0sr4w8hz7rhafezu53p9dt9jfrj04ydjf8akadhjr08ztcznjynq2nqkuwv78a8cfsckfp8eps4309h9sjvx3rvauw8v50ef6up6alhllawf65ny69yk"
              logoUrl="/logo.png"
            />
          </div>
          <div className="w-full space-y-2">
            <p className="text-xs text-center text-muted-foreground uppercase tracking-wider font-semibold">
              Donation Address (Unified & Shielded)
            </p>
            <button
              onClick={() =>
                handleCopyAddress(
                  "u1htqcdyp8lp9l3t0z4929zgc4fk7xnrk96s4rg6fwnev6l99zuy7nh6e73s67s24cvz7ra8897wu074tegslrq6e5f3nd7tz0sr4w8hz7rhafezu53p9dt9jfrj04ydjf8akadhjr08ztcznjynq2nqkuwv78a8cfsckfp8eps4309h9sjvx3rvauw8v50ef6up6alhllawf65ny69yk"
                )
              }
              className="w-full relative group text-[10px] font-mono text-muted-foreground/80 break-all text-center bg-black/20 p-3 rounded-lg border border-white/5 hover:bg-black/30 transition-all cursor-pointer flex flex-col items-center gap-2"
            >
              <span className="leading-relaxed">
                u1htqcdyp8lp9l3t0z4929zgc4fk7xnrk96s4rg6fwnev6l99zuy7nh6e73s67s24cvz7ra8897wu074tegslrq6e5f3nd7tz0sr4w8hz7rhafezu53p9dt9jfrj04ydjf8akadhjr08ztcznjynq2nqkuwv78a8cfsckfp8eps4309h9sjvx3rvauw8v50ef6up6alhllawf65ny69yk
              </span>

              <div className="flex items-center gap-1.5 text-xs font-semibold text-accent/80 bg-accent/10 px-3 py-1.5 rounded-full border border-accent/20 mt-2">
                <Copy className="w-3.5 h-3.5" />
                Tap to Copy Address
              </div>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
