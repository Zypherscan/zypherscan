import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useZcashAPI } from "@/hooks/useZcashAPI";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
} from "lucide-react";
import { toast } from "sonner";

interface TransactionDetails {
  txid: string;
  hex?: string; // Raw transaction hex for decryption
  blockhash?: string;
  blockheight?: number;
  height?: number; // API returns "height" instead of "blockheight"
  confirmations?: number;
  time?: number;
  version: number;
  locktime: number;
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
  vShieldedSpend?: {
    cv: string;
    anchor: string;
    nullifier: string;
  }[];
  vShieldedOutput?: {
    cv: string;
    cmu: string;
    ephemeralKey: string;
  }[];
  valueBalance?: number;
  size?: number;
  overwintered?: boolean;
  expiryHeight?: number;
  orchard?: {
    actions: {
      cv: string;
      nullifier: string;
      cmx: string;
      encryptedNote: {
        epk: string;
        encCiphertext: string;
        outCiphertext: string;
      };
    }[];
    flags: number;
    valueBalance: number;
    valueBalanceOrchard: number;
  };
}

const TransactionDetails = () => {
  const { txid } = useParams<{ txid: string }>();
  const navigate = useNavigate();
  const {
    isConnected,
    viewingKey,
    loading: authLoading,
    disconnect,
  } = useAuth();
  const { searchBlockchain } = useZcashAPI();

  const [transaction, setTransaction] = useState<TransactionDetails | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedTxid, setCopiedTxid] = useState(false);

  useEffect(() => {
    if (!authLoading && !isConnected) {
      navigate("/auth");
    }
  }, [isConnected, authLoading, navigate]);

  useEffect(() => {
    const fetchTransaction = async () => {
      if (!txid) return;

      setLoading(true);
      setError(null);

      try {
        const result = await searchBlockchain(txid);
        if (result.success && result.type === "transaction") {
          setTransaction(result.result);
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
    return date.toLocaleString();
  };

  const hasShieldedActivity = (tx: TransactionDetails) => {
    return (
      (tx.vShieldedSpend && tx.vShieldedSpend.length > 0) ||
      (tx.vShieldedOutput && tx.vShieldedOutput.length > 0) ||
      (tx.orchard && tx.orchard.actions && tx.orchard.actions.length > 0)
    );
  };

  const getTransactionType = (tx: TransactionDetails) => {
    const hasTransparentIn = tx.vin && tx.vin.some((v) => v.txid);
    const hasTransparentOut = tx.vout && tx.vout.some((v) => v.value > 0);
    const hasShieldedIn =
      (tx.vShieldedSpend && tx.vShieldedSpend.length > 0) ||
      (tx.orchard && tx.orchard.actions && tx.orchard.actions.length > 0); // Orchard actions are both spend/output
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
        label: "Fully Shielded",
        className:
          "bg-terminal-green/20 text-terminal-green border-terminal-green/30",
      },
      "t-to-z": {
        label: "Shielding",
        className: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      },
      "z-to-t": {
        label: "Deshielding",
        className: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
      },
      "t-to-t": {
        label: "Transparent",
        className: "bg-gray-500/20 text-gray-300 border-gray-500/30",
      },
      mixed: {
        label: "Mixed",
        className: "bg-purple-500/20 text-purple-300 border-purple-500/30",
      },
    };
    const badge = badges[type] || badges.mixed;
    return (
      <Badge variant="outline" className={badge.className}>
        {badge.label}
      </Badge>
    );
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  // Get block height from either 'height' or 'blockheight' field
  const blockHeight = transaction?.height || transaction?.blockheight;

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <main className="container px-6 py-8">
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="mb-6 border-accent/50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {loading ? (
          <div className="space-y-6">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : error ? (
          <Card className="p-8 text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => navigate("/")} variant="outline">
              Return to Explorer
            </Button>
          </Card>
        ) : transaction ? (
          <div className="space-y-6">
            {/* Transaction Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-xl bg-accent/20 flex items-center justify-center">
                  <Activity className="w-8 h-8 text-accent" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-2xl font-bold">Transaction</h1>
                    {getTypeBadge(getTransactionType(transaction))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-muted-foreground break-all">
                      {txid?.slice(0, 20)}...{txid?.slice(-10)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={handleCopyTxid}
                    >
                      {copiedTxid ? (
                        <Check className="w-4 h-4 text-terminal-green" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {blockHeight && (
                <Link to={`/block/${blockHeight}`}>
                  <Button variant="outline" className="border-accent/30">
                    <Box className="w-4 h-4 mr-2" />
                    Block #{blockHeight.toLocaleString()}
                  </Button>
                </Link>
              )}
            </div>

            {/* Shielded Activity Notice */}
            {hasShieldedActivity(transaction) && (
              <Alert className="bg-accent/5 border-accent/20">
                <Shield className="h-5 w-5 text-accent" />
                <AlertDescription className="ml-2">
                  <p className="font-medium text-accent">
                    This transaction contains shielded activity
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {viewingKey
                      ? "Your viewing key can decrypt outputs belonging to your addresses."
                      : "Connect your viewing key to decrypt shielded outputs that belong to you."}
                  </p>
                </AlertDescription>
              </Alert>
            )}

            {/* Transaction Details */}
            <Card className="card-glow bg-card/50 backdrop-blur-sm border-accent/10 overflow-hidden">
              <div className="p-6 border-b border-border">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Layers className="w-5 h-5 text-accent" />
                  Transaction Details
                </h2>
              </div>

              <div className="divide-y divide-border">
                {/* Confirmations */}
                {transaction.confirmations !== undefined && (
                  <div className="p-4 flex items-center justify-between">
                    <span className="text-muted-foreground">Confirmations</span>
                    <Badge
                      className={
                        transaction.confirmations < 10
                          ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                          : "bg-terminal-green/20 text-terminal-green border-terminal-green/30"
                      }
                    >
                      {transaction.confirmations.toLocaleString()}
                    </Badge>
                  </div>
                )}

                {/* Timestamp */}
                {transaction.time && (
                  <div className="p-4 flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Timestamp
                    </span>
                    <span>{formatTimestamp(transaction.time)}</span>
                  </div>
                )}

                {/* Value Balance (for Sapling) */}
                {transaction.valueBalance !== undefined &&
                  transaction.valueBalance !== 0 && (
                    <div className="p-4 flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Sapling Value Balance
                      </span>
                      <span
                        className={`font-mono ${
                          transaction.valueBalance > 0
                            ? "text-terminal-green"
                            : "text-red-400"
                        }`}
                      >
                        {transaction.valueBalance > 0 ? "+" : ""}
                        {transaction.valueBalance.toFixed(8)} ZEC
                      </span>
                    </div>
                  )}

                {/* Value Balance (for Orchard) */}
                {transaction.orchard &&
                  transaction.orchard.valueBalanceOrchard !== undefined &&
                  transaction.orchard.valueBalanceOrchard !== 0 && (
                    <div className="p-4 flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Orchard Value Balance
                      </span>
                      <span
                        className={`font-mono ${
                          transaction.orchard.valueBalanceOrchard > 0
                            ? "text-terminal-green"
                            : "text-red-400"
                        }`}
                      >
                        {transaction.orchard.valueBalanceOrchard > 0 ? "+" : ""}
                        {transaction.orchard.valueBalanceOrchard.toFixed(8)} ZEC
                      </span>
                    </div>
                  )}

                {/* Size */}
                {transaction.size && (
                  <div className="p-4 flex items-center justify-between">
                    <span className="text-muted-foreground">Size</span>
                    <span className="font-mono">
                      {transaction.size.toLocaleString()} bytes
                    </span>
                  </div>
                )}

                {/* Lock Time */}
                <div className="p-4 flex items-center justify-between">
                  <span className="text-muted-foreground">Lock Time</span>
                  <span className="font-mono">{transaction.locktime}</span>
                </div>

                {/* Version */}
                <div className="p-4 flex items-center justify-between">
                  <span className="text-muted-foreground">Version</span>
                  <span className="font-mono">{transaction.version}</span>
                </div>

                {/* Expiry Height */}
                {transaction.expiryHeight && (
                  <div className="p-4 flex items-center justify-between">
                    <span className="text-muted-foreground">Expiry Height</span>
                    <span className="font-mono">
                      {transaction.expiryHeight.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </Card>

            {/* Shielded Spends */}
            {transaction.vShieldedSpend &&
              transaction.vShieldedSpend.length > 0 && (
                <Card className="card-glow bg-card/50 backdrop-blur-sm border-accent/10">
                  <div className="p-6 border-b border-border">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <Lock className="w-5 h-5 text-blue-400" />
                      Shielded Inputs ({transaction.vShieldedSpend.length})
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Sapling spends - amounts hidden
                    </p>
                  </div>
                  <div className="divide-y divide-border">
                    {transaction.vShieldedSpend.slice(0, 10).map((spend, i) => (
                      <div key={i} className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            variant="outline"
                            className="border-blue-400/30 text-blue-300"
                          >
                            Input #{i + 1}
                          </Badge>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-start justify-between gap-4">
                            <span className="text-muted-foreground shrink-0">
                              Nullifier
                            </span>
                            <span className="font-mono text-xs break-all opacity-75">
                              {spend.nullifier}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

            {/* Shielded Outputs */}
            {transaction.vShieldedOutput &&
              transaction.vShieldedOutput.length > 0 && (
                <Card className="card-glow bg-card/50 backdrop-blur-sm border-accent/10">
                  <div className="p-6 border-b border-border">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <Unlock className="w-5 h-5 text-terminal-green" />
                      Shielded Outputs ({transaction.vShieldedOutput.length})
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Sapling outputs - decryptable with viewing key
                    </p>
                  </div>
                  <div className="divide-y divide-border">
                    {transaction.vShieldedOutput
                      .slice(0, 10)
                      .map((output, i) => (
                        <div key={i} className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge
                              variant="outline"
                              className="border-terminal-green/30 text-terminal-green"
                            >
                              Output #{i + 1}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="border-accent/30"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              Encrypted
                            </Badge>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-start justify-between gap-4">
                              <span className="text-muted-foreground shrink-0">
                                Note Commitment
                              </span>
                              <span className="font-mono text-xs break-all opacity-75">
                                {output.cmu}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </Card>
              )}

            {/* Orchard Actions */}
            {transaction.orchard &&
              transaction.orchard.actions &&
              transaction.orchard.actions.length > 0 && (
                <Card className="card-glow bg-card/50 backdrop-blur-sm border-accent/10">
                  <div className="p-6 border-b border-border">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <Shield className="w-5 h-5 text-purple-400" />
                      Orchard Actions ({transaction.orchard.actions.length})
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Orchard actions (Spend + Output)
                    </p>
                  </div>
                  <div className="divide-y divide-border">
                    {transaction.orchard.actions
                      .slice(0, 10)
                      .map((action, i) => (
                        <div key={i} className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge
                              variant="outline"
                              className="border-purple-400/30 text-purple-300"
                            >
                              Action #{i + 1}
                            </Badge>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-start justify-between gap-4">
                              <span className="text-muted-foreground shrink-0">
                                Nullifier
                              </span>
                              <span className="font-mono text-xs break-all opacity-75">
                                {action.nullifier}
                              </span>
                            </div>
                            <div className="flex items-start justify-between gap-4">
                              <span className="text-muted-foreground shrink-0">
                                Commitment
                              </span>
                              <span className="font-mono text-xs break-all opacity-75">
                                {action.cmx}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </Card>
              )}

            {/* Transparent Inputs */}
            {transaction.vin &&
              transaction.vin.filter((v) => v.txid).length > 0 && (
                <Card className="card-glow bg-card/50 backdrop-blur-sm border-accent/10">
                  <div className="p-6 border-b border-border">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <ArrowDownRight className="w-5 h-5 text-accent" />
                      Transparent Inputs (
                      {transaction.vin.filter((v) => v.txid).length})
                    </h2>
                  </div>
                  <div className="divide-y divide-border">
                    {transaction.vin
                      .filter((v) => v.txid)
                      .slice(0, 10)
                      .map((input, i) => (
                        <div key={i} className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <Badge
                                variant="outline"
                                className="border-accent/30 mb-2"
                              >
                                Input #{i + 1}
                              </Badge>
                              <p className="font-mono text-sm truncate max-w-[400px]">
                                {input.txid}:{input.vout}
                              </p>
                            </div>
                            <Link
                              to={`/tx/${input.txid}`}
                              className="text-accent hover:underline text-sm"
                            >
                              View Source
                            </Link>
                          </div>
                        </div>
                      ))}
                  </div>
                </Card>
              )}

            {/* Transparent Outputs */}
            {transaction.vout &&
              transaction.vout.filter((v) => v.value > 0).length > 0 && (
                <Card className="card-glow bg-card/50 backdrop-blur-sm border-accent/10">
                  <div className="p-6 border-b border-border">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <ArrowUpRight className="w-5 h-5 text-terminal-green" />
                      Transparent Outputs (
                      {transaction.vout.filter((v) => v.value > 0).length})
                    </h2>
                  </div>
                  <div className="divide-y divide-border">
                    {transaction.vout
                      .filter((v) => v.value > 0)
                      .slice(0, 10)
                      .map((output, i) => (
                        <div key={i} className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <Badge
                                variant="outline"
                                className="border-terminal-green/30 text-terminal-green mb-2"
                              >
                                Output #{output.n}
                              </Badge>
                              {output.scriptPubKey?.addresses && (
                                <p className="font-mono text-sm truncate max-w-[400px]">
                                  {output.scriptPubKey.addresses[0]}
                                </p>
                              )}
                            </div>
                            <span className="font-mono font-bold text-terminal-green">
                              {output.value.toFixed(8)} ZEC
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </Card>
              )}
          </div>
        ) : null}
      </main>
    </div>
  );
};

export default TransactionDetails;
