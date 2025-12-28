import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
// import { supabase } from "@/integrations/supabase/client";
// import { decryptMemo, DecryptedOutput } from "@/lib/wasm-loader";
import { DecryptedOutput } from "@/lib/wasm-loader"; // Keep type if needed, or define locally
import { formatZEC } from "@/lib/zcash-crypto";
import { useAuth } from "@/hooks/useAuth";
import { useWalletData } from "@/hooks/useWalletData";
import { useZcashAPI } from "@/hooks/useZcashAPI";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  ArrowDownRight,
  ArrowUpRight,
  Activity,
  Clock,
  Hash,
  Layers,
  Shield,
  Copy,
  Check,
  Box,
  Lock,
  Unlock,
  Eye,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface TransactionDetails {
  txid: string;
  hex?: string;
  // Cipherscan API uses camelCase
  blockhash?: string;
  blockHash?: string;
  blockheight?: number;
  blockHeight?: string | number;
  height?: number;
  confirmations?: number;
  time?: number;
  blockTime?: string | number;
  timestamp?: number;
  version: number;
  locktime: number | string;
  // Old format (vin/vout)
  vin?: {
    txid?: string;
    vout?: number;
    scriptSig?: { asm: string; hex: string };
    sequence?: number;
  }[];
  vout?: {
    value: number;
    n: number;
    scriptPubKey?: {
      asm: string;
      type: string;
      addresses?: string[];
    };
  }[];
  // Cipherscan API format (new fields)
  inputCount?: number;
  outputCount?: number;
  vShieldedSpend?: any[];
  vShieldedOutput?: any[];
  valueBalance?: number;
  valueBalanceSapling?: number;
  valueBalanceOrchard?: number;
  hasSapling?: boolean;
  hasOrchard?: boolean;
  hasSprout?: boolean;
  orchardActions?: number;
  shieldedSpends?: number;
  shieldedOutputs?: number;
  size?: number;
  overwintered?: boolean;
  expiryHeight?: number;
  orchard?: {
    actions: any[];
    flags: number;
    valueBalance: number;
    valueBalanceOrchard: number;
  };
  // Additional fields for accurate display
  fee?: number;
  value?: number;
}

const TransactionDetails = () => {
  // ...
  const { txid } = useParams<{ txid: string }>();
  const navigate = useNavigate();
  const {
    isConnected,
    viewingKey,
    loading: authLoading,
    disconnect,
    getBirthdayHeight,
    login,
  } = useAuth();

  const { searchBlockchain } = useZcashAPI();
  const { transactions } = useWalletData(); // Consume context

  const [transaction, setTransaction] = useState<TransactionDetails | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedTxid, setCopiedTxid] = useState(false);
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptedData, setDecryptedData] = useState<DecryptedOutput | null>(
    null
  );
  const [showKeyDialog, setShowKeyDialog] = useState(false);
  const [manualKey, setManualKey] = useState("");
  const [manualBirthday, setManualBirthday] = useState("");

  useEffect(() => {
    const fetchTransaction = async () => {
      if (!txid) return;

      setLoading(true);
      setError(null);

      try {
        const result = await searchBlockchain(txid);
        if (result.success && result.type === "transaction") {
          // Force cast as we know it's a transaction result matching our interface
          const txData = result.result as unknown as TransactionDetails;
          setTransaction(txData);
        } else {
          setError("Transaction not found");
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load transaction"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTransaction();
  }, [txid, searchBlockchain]);

  const handleCopyTxid = async () => {
    if (!txid) return;
    await navigator.clipboard.writeText(txid);
    setCopiedTxid(true);
    toast.success("Transaction ID copied");
    setTimeout(() => setCopiedTxid(false), 2000);
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    // Format: "2 minutes ago (Dec 10, 2025, 10:25:32 PM GMT+5:30)" style
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    let ago = "";
    if (diffSeconds < 60) ago = `${diffSeconds} seconds ago`;
    else if (diffSeconds < 3600)
      ago = `${Math.floor(diffSeconds / 60)} minutes ago`;
    else if (diffSeconds < 86400)
      ago = `${Math.floor(diffSeconds / 3600)} hours ago`;
    else ago = `${Math.floor(diffSeconds / 86400)} days ago`;

    return `${ago} (${date.toLocaleString()})`;
  };

  // Watch for transaction in global context
  useEffect(() => {
    if (isDecrypting && transactions.length > 0) {
      const found = transactions.find((t) => t.txid === txid);
      if (found) {
        setDecryptedData({
          amount: Math.abs(found.amount),
          memo: found.memo || "",
        } as any);
        toast.success("Transaction decrypted successfully!");
        setShowKeyDialog(false);
        setIsDecrypting(false);
      }
    }
  }, [isDecrypting, transactions, txid]);

  const handleDecrypt = () => {
    if (!txid) return;

    // Check if we already have it in history (if connected)
    if (transactions.length > 0) {
      const found = transactions.find((t) => t.txid === txid);
      if (found) {
        setDecryptedData({
          amount: Math.abs(found.amount),
          memo: found.memo || "",
        } as any);
        toast.success("Transaction decrypted successfully!");
        return;
      }
    }

    if (viewingKey) {
      // Connected but transaction not in list?
      // Might be out of sync or stale.
      // Trigger refresh?
      toast.info(
        "Transaction not found in current wallet history. Try refreshing."
      );
    } else {
      setShowKeyDialog(true);
    }
  };

  const handleManualDecrypt = () => {
    if (!manualKey) {
      toast.error("Please enter a viewing key");
      return;
    }

    // 1. Log in with the key (starts background sync in Context)
    const birthday = manualBirthday ? parseInt(manualBirthday) : undefined;
    login(manualKey, birthday);

    // 2. Set loading state to wait for sync
    setIsDecrypting(true);
    toast.info("Syncing wallet to find transaction... this may take a moment.");
  };

  const hasShieldedActivity = (tx: TransactionDetails) => {
    // Check explicit flags first (Cipherscan often provides these)
    if (tx.hasSapling || tx.hasOrchard || tx.hasSprout) return true;

    // Check array lengths (handling various naming conventions like camelCase vs snake_case)
    const hasSaplingSpend =
      (tx.vShieldedSpend?.length || 0) > 0 ||
      ((tx as any).v_shielded_spend?.length || 0) > 0 ||
      ((tx as any).shieldedSpends?.length || 0) > 0;

    const hasSaplingOutput =
      (tx.vShieldedOutput?.length || 0) > 0 ||
      ((tx as any).v_shielded_output?.length || 0) > 0 ||
      ((tx as any).shieldedOutputs?.length || 0) > 0;

    const hasOrchardAction =
      (tx.orchard?.actions?.length || 0) > 0 || (tx.orchardActions || 0) > 0;

    return hasSaplingSpend || hasSaplingOutput || hasOrchardAction;
  };

  const getTransactionType = (tx: TransactionDetails) => {
    const hasTransparentIn = tx.vin && tx.vin.some((v) => v.txid);
    const hasTransparentOut = tx.vout && tx.vout.some((v) => v.value > 0);
    const hasShieldedIn =
      (tx.vShieldedSpend && tx.vShieldedSpend.length > 0) ||
      (tx.orchard && tx.orchard.actions && tx.orchard.actions.length > 0);
    const hasShieldedOut =
      (tx.vShieldedOutput && tx.vShieldedOutput.length > 0) ||
      (tx.orchard && tx.orchard.actions && tx.orchard.actions.length > 0);

    if (
      hasShieldedIn &&
      hasShieldedOut &&
      !hasTransparentIn &&
      !hasTransparentOut
    ) {
      return "z-to-z";
    } else if (hasTransparentIn && hasShieldedOut) {
      return "t-to-z";
    } else if (hasShieldedIn && hasTransparentOut) {
      return "z-to-t";
    } else if (hasTransparentIn && hasTransparentOut) {
      return "t-to-t";
    } else {
      return "mixed";
    }
  };

  const getTypeBadge = (type: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      "z-to-z": {
        label: "FULLY SHIELDED",
        className:
          "bg-terminal-green/20 text-terminal-green border-terminal-green/30",
      },
      "t-to-z": {
        label: "SHIELDING",
        className: "bg-accent/20 text-accent border-accent/30",
      },
      "z-to-t": {
        label: "DESHIELDING",
        className: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
      },
      "t-to-t": {
        label: "TRANSPARENT",
        className: "bg-gray-500/20 text-gray-300 border-gray-500/30",
      },
      mixed: {
        label: "MIXED",
        className: "bg-accent/20 text-accent border-accent/30",
      },
    };
    const badge = badges[type] || badges.mixed;
    return (
      <Badge
        variant="outline"
        className={`${badge.className} ml-3 uppercase text-xs tracking-wider px-2 py-0.5`}
      >
        {badge.label}
      </Badge>
    );
  };

  const getTypeDescription = (type: string) => {
    switch (type) {
      case "z-to-z":
        return "Shielded transaction: inputs -> shielded outputs";
      case "t-to-z":
        return "Shielding transaction: transparent inputs -> shielded outputs";
      case "z-to-t":
        return "Deshielding transaction: shielded inputs -> transparent outputs";
      case "t-to-t":
        return "Transparent transaction: inputs -> outputs";
      case "mixed":
        return "Mixed transaction: complex inputs -> outputs";
      default:
        return "Transaction details";
    }
  };

  // Get block height from either 'height' or 'blockheight' field
  const blockHeight = transaction?.blockHeight
    ? typeof transaction.blockHeight === "string"
      ? parseInt(transaction.blockHeight)
      : transaction.blockHeight
    : transaction?.height || transaction?.blockheight;
  const txType = transaction ? getTransactionType(transaction) : "mixed";

  useEffect(() => {
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 100);
  }, [transaction]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <main className="container px-4 md:px-6 py-8 max-w-6xl mx-auto">
        {loading ? (
          <div className="space-y-6">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : error ? (
          <Card className="p-8 text-center bg-card/40 border-destructive/30">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <p className="text-xl font-bold text-destructive mb-2">
              Transaction Not Found
            </p>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => navigate("/")} variant="outline">
              Return to Explorer
            </Button>
          </Card>
        ) : transaction ? (
          <div className="space-y-6">
            {/* Back Button */}
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-muted-foreground hover:text-accent transition-colors mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>

            {/* Header */}
            <div className="flex items-center mb-2">
              <h1 className="text-3xl font-bold text-foreground">
                Transaction Details
              </h1>
              {getTypeBadge(txType)}
            </div>

            {/* Info Box (Theme) */}
            <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-accent mt-0.5" />
              <span className="text-muted-foreground text-sm">
                <strong className="font-semibold text-foreground">
                  {txType === "mixed"
                    ? "Mixed transaction"
                    : "Transaction info"}
                  :
                </strong>{" "}
                {getTypeDescription(txType)}
              </span>
            </div>

            {/* Decrypt Banner (Purple) */}
            {hasShieldedActivity(transaction) && !decryptedData && (
              <div className="bg-card border border-purple-500/30 rounded-lg p-6 flex flex-col md:flex-row items-center justify-between gap-4 card-glow relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
                <div className="flex items-start gap-4 z-10">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                    <Lock className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-purple-100 font-semibold mb-1">
                      Is this your transaction?
                    </h3>
                    <p className="text-sm text-purple-300/70">
                      Use your viewing key to decrypt shielded amounts and memos
                      client-side
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleDecrypt}
                  disabled={isDecrypting}
                  className="bg-purple-600 hover:bg-purple-700 text-white border-none z-10 shrink-0 min-w-[140px]"
                >
                  {isDecrypting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Unlock className="w-4 h-4 mr-2" />
                  )}
                  {isDecrypting ? "Decrypting..." : "Decrypt This TX"}
                </Button>
              </div>
            )}

            {/* Decrypted Results Banner (Success) */}
            {decryptedData && (
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-6 animate-in fade-in slide-in-from-top-4">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                    <Unlock className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-green-100 font-semibold mb-1">
                      Transaction Decrypted Successfully
                    </h3>
                    <p className="text-sm text-green-300/70">
                      The following information was recovered using your viewing
                      key
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-muted/40 p-4 rounded-lg border border-green-500/20">
                    <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider">
                      Amount
                    </p>
                    <p className="text-2xl font-mono font-bold text-green-400">
                      {formatZEC(decryptedData.amount)} ZEC
                    </p>
                  </div>
                  <div className="bg-muted/40 p-4 rounded-lg border border-green-500/20">
                    <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider">
                      Memo
                    </p>
                    <p className="text-sm font-mono text-gray-300 break-all whitespace-pre-wrap">
                      {decryptedData.memo || "(No memo)"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Main Details Card */}
            <Card className="bg-card border-border p-0 overflow-hidden">
              <div className="p-6 space-y-6">
                {/* Hash */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-400 text-sm font-medium">
                    <Hash className="w-4 h-4" /> Transaction Hash
                  </div>
                  <div className="flex items-center gap-2 bg-muted/40 p-3 rounded-lg border border-border">
                    <code className="text-accent font-mono text-sm break-all flex-1">
                      {transaction.txid}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-500 hover:text-white"
                      onClick={handleCopyTxid}
                    >
                      {copiedTxid ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid gap-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <span className="text-gray-400 text-sm flex items-center gap-2">
                      <Activity className="w-4 h-4" /> Status
                    </span>
                    <div className="md:col-span-3">
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 px-3 py-1">
                        <Check className="w-3 h-3 mr-1" /> Success
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <span className="text-gray-400 text-sm flex items-center gap-2">
                      <Box className="w-4 h-4" /> Block
                    </span>
                    <div className="md:col-span-3 flex items-center gap-2">
                      <Link
                        to={`/block/${blockHeight}`}
                        className="text-accent hover:underline font-mono"
                      >
                        #{blockHeight?.toLocaleString()}
                      </Link>
                      <span className="text-gray-500 text-sm">
                        ({transaction.confirmations} confirmations)
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <span className="text-gray-400 text-sm flex items-center gap-2">
                      <Clock className="w-4 h-4" /> Timestamp
                    </span>
                    <div className="md:col-span-3 text-foreground text-sm">
                      {(() => {
                        const timestamp =
                          transaction.blockTime ||
                          transaction.time ||
                          transaction.timestamp;
                        if (!timestamp) return "N/A";
                        // Parse to number
                        let numTimestamp =
                          typeof timestamp === "string"
                            ? parseInt(timestamp)
                            : timestamp;
                        // If timestamp is in milliseconds (> year 2100 in seconds), convert to seconds
                        if (numTimestamp > 4102444800) {
                          numTimestamp = Math.floor(numTimestamp / 1000);
                        }
                        return formatTimestamp(numTimestamp);
                      })()}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <span className="text-gray-400 text-sm flex items-center gap-2">
                      Transaction Fee
                    </span>
                    <div className="md:col-span-3 text-foreground font-mono text-sm">
                      {transaction.fee
                        ? `${formatZEC(transaction.fee)} ZEC`
                        : "0.00000000 ZEC"}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <span className="text-gray-400 text-sm flex items-center gap-2">
                      Value
                    </span>
                    <div className="md:col-span-3 text-foreground font-mono text-sm font-bold">
                      {transaction.value !== undefined &&
                      transaction.value !== null
                        ? `${formatZEC(transaction.value)} ZEC`
                        : "0.00000000 ZEC"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Show More Details */}
              <div className="border-t border-border">
                <button
                  onClick={() => setShowMoreDetails(!showMoreDetails)}
                  className="w-full flex items-center gap-2 p-4 text-accent hover:text-accent/80 text-sm font-medium transition-colors"
                >
                  {showMoreDetails ? (
                    <ArrowDownRight className="w-4 h-4 rotate-180 transition-transform" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 transition-transform" />
                  )}
                  {showMoreDetails ? "Hide Details" : "Show More Details"}
                </button>
                {showMoreDetails && (
                  <div className="p-6 bg-muted/20 space-y-4 border-t border-border animate-in slide-in-from-top-2">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <span className="text-muted-foreground text-sm">
                        Version
                      </span>
                      <span className="text-foreground font-mono text-sm">
                        {transaction.version}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <span className="text-muted-foreground text-sm">
                        Lock Time
                      </span>
                      <span className="text-foreground font-mono text-sm">
                        {transaction.locktime}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <span className="text-muted-foreground text-sm">
                        Size
                      </span>
                      <span className="text-foreground font-mono text-sm">
                        {transaction.size} bytes
                      </span>
                    </div>
                    {transaction.hasOrchard && transaction.orchardActions && (
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <span className="text-muted-foreground text-sm">
                          Orchard Actions
                        </span>
                        <span className="text-foreground font-mono text-sm">
                          {transaction.orchardActions}
                        </span>
                      </div>
                    )}
                    {transaction.valueBalanceOrchard &&
                      Number(transaction.valueBalanceOrchard) !== 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <span className="text-muted-foreground text-sm">
                            Orchard Value Balance
                          </span>
                          <span className="text-purple-600 dark:text-purple-400 font-mono text-sm font-bold">
                            {Number(transaction.valueBalanceOrchard) > 0
                              ? "+"
                              : ""}
                            {formatZEC(Number(transaction.valueBalanceOrchard))}{" "}
                            ZEC
                          </span>
                        </div>
                      )}
                    {(transaction.blockhash || transaction.blockHash) && (
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <span className="text-muted-foreground text-sm">
                          Block Hash
                        </span>
                        <span className="text-foreground font-mono text-sm truncate block md:col-span-3">
                          {transaction.blockhash || transaction.blockHash}
                        </span>
                      </div>
                    )}
                    {transaction.expiryHeight && (
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <span className="text-muted-foreground text-sm">
                          Expiry Height
                        </span>
                        <span className="text-foreground font-mono text-sm">
                          {transaction.expiryHeight}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>

            {/* Inputs & Outputs Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Inputs */}
              <Card className="bg-card border-border p-0">
                <div className="p-4 border-b border-border flex justify-between items-center">
                  <h3 className="font-bold text-foreground flex items-center gap-2">
                    <ArrowDownRight className="w-5 h-5 text-gray-400" /> Inputs
                  </h3>
                  <Badge
                    variant="secondary"
                    className="bg-muted text-muted-foreground"
                  >
                    {(transaction.inputCount || 0) +
                      (transaction.orchardActions || 0) ||
                      (transaction.vin?.length || 0) +
                        (transaction.vShieldedSpend?.length || 0) +
                        (transaction.orchard?.actions?.length || 0)}
                  </Badge>
                </div>
                <div className="divide-y divide-border/50">
                  {/* Shielded Spends (Sapling) */}
                  {transaction.vShieldedSpend?.map((spend, i) => (
                    <div
                      key={`sapling-spend-${i}`}
                      className="p-4 flex items-center gap-3 group hover:bg-muted/50 transition-colors"
                    >
                      <Shield className="w-5 h-5 text-purple-400" />
                      <div>
                        <p className="text-sm text-purple-400 font-bold">
                          (amount hidden)
                        </p>
                        <p className="text-xs text-gray-500 font-mono">
                          Sapling Spend
                        </p>
                      </div>
                    </div>
                  ))}
                  {/* Orchard Actions (Spend side) */}
                  {transaction.orchard?.actions?.map((action, i) => (
                    <div
                      key={`orchard-spend-${i}`}
                      className="p-4 flex items-center gap-3 group hover:bg-white/5 transition-colors"
                    >
                      <Shield className="w-5 h-5 text-purple-400" />
                      <div>
                        <p className="text-sm text-purple-400 font-bold">
                          (amount hidden)
                        </p>
                        <p className="text-xs text-gray-500 font-mono">
                          Orchard Action
                        </p>
                      </div>
                    </div>
                  ))}
                  {/* Transparent Inputs */}
                  {transaction.vin
                    ?.filter((v) => v.txid)
                    .map((input, i) => (
                      <div
                        key={`vin-${i}`}
                        className="p-4 flex justify-between group hover:bg-muted/50 transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge
                              variant="outline"
                              className="text-[10px] h-5 px-1 bg-transparent border-gray-700 text-gray-400"
                            >
                              VIN #{i}
                            </Badge>
                            <Link
                              to={`/tx/${input.txid}`}
                              className="text-accent hover:underline text-sm truncate block max-w-[150px] font-mono"
                            >
                              {input.txid?.slice(0, 16)}...
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </Card>

              {/* Outputs */}
              <Card className="bg-card border-border p-0">
                <div className="p-4 border-b border-border flex justify-between items-center">
                  <h3 className="font-bold text-foreground flex items-center gap-2">
                    <ArrowUpRight className="w-5 h-5 text-gray-400" /> Outputs
                  </h3>
                  <Badge
                    variant="secondary"
                    className="bg-muted text-muted-foreground"
                  >
                    {(transaction.outputCount || 0) +
                      (transaction.orchardActions || 0) ||
                      (transaction.vout?.length || 0) +
                        (transaction.vShieldedOutput?.length || 0) +
                        (transaction.orchard?.actions?.length || 0)}
                  </Badge>
                </div>
                <div className="divide-y divide-border/50">
                  {/* Shielded Outputs (Sapling) */}
                  {transaction.vShieldedOutput?.map((output, i) => (
                    <div
                      key={`sapling-output-${i}`}
                      className="p-4 flex items-center gap-3 group hover:bg-muted/50 transition-colors"
                    >
                      <Shield className="w-5 h-5 text-purple-400" />
                      <div>
                        <p className="text-sm text-purple-400 font-bold">
                          (amount hidden)
                        </p>
                        <p className="text-xs text-gray-500 font-mono">
                          Sapling Output
                        </p>
                      </div>
                    </div>
                  ))}
                  {/* Shielded Outputs (Orchard) */}
                  {transaction.orchard?.actions?.map((action, i) => (
                    <div
                      key={`orchard-output-${i}`}
                      className="p-4 flex items-center gap-3 group hover:bg-white/5 transition-colors"
                    >
                      <Shield className="w-5 h-5 text-purple-400" />
                      <div>
                        <p className="text-sm text-purple-400 font-bold">
                          (amount hidden)
                        </p>
                        <p className="text-xs text-gray-500 font-mono">
                          Orchard Output
                        </p>
                      </div>
                    </div>
                  ))}
                  {/* Transparent Outputs */}
                  {transaction.vout?.map((output, i) => (
                    <div
                      key={`vout-${i}`}
                      className="p-4 flex justify-between group hover:bg-white/5 transition-colors"
                    >
                      <div className="min-w-0 flex-1 mr-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant="outline"
                            className="text-[10px] h-5 px-1 bg-transparent border-gray-700 text-gray-400"
                          >
                            #{output.n}
                          </Badge>
                          {output.scriptPubKey?.addresses?.[0] ? (
                            <Link
                              to={`/address/${output.scriptPubKey.addresses[0]}`}
                              className="text-accent hover:underline text-sm truncate block font-mono"
                            >
                              {output.scriptPubKey.addresses[0]}
                            </Link>
                          ) : (
                            <span className="text-gray-500 text-sm italic">
                              OpReturn / Non-standard
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-white font-mono font-bold text-sm">
                          {formatZEC(output.value)} ZEC
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        ) : null}

        {/* Manual Key Dialog */}
        <Dialog open={showKeyDialog} onOpenChange={setShowKeyDialog}>
          <DialogContent className="bg-[#1a1b26] border-purple-500/20 text-white">
            <DialogHeader>
              <DialogTitle>Enter View Key</DialogTitle>
              <DialogDescription>
                Please enter your Unified Viewing Key (UVK) to decrypt this
                transaction.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="viewKey">Viewing Key</Label>
                <Input
                  id="viewKey"
                  placeholder="uview..."
                  value={manualKey}
                  onChange={(e) => setManualKey(e.target.value)}
                  className="bg-black/40 border-purple-500/20 font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthday">Birthday Height (Optional)</Label>
                <Input
                  id="birthday"
                  type="number"
                  placeholder="e.g. 2500000"
                  value={manualBirthday}
                  onChange={(e) => setManualBirthday(e.target.value)}
                  className="bg-black/40 border-purple-500/20 font-mono text-sm"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowKeyDialog(false)}
                className="border-gray-700 hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button
                onClick={handleManualDecrypt}
                className="bg-purple-600 hover:bg-purple-700"
                disabled={!manualKey || isDecrypting}
              >
                {isDecrypting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Unlock className="w-4 h-4 mr-2" />
                )}
                Decrypt
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default TransactionDetails;
