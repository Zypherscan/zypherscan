import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useZcashAPI } from "@/hooks/useZcashAPI";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Copy,
  Check,
  AlertCircle,
  ExternalLink,
  Wallet,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  Database,
  Search,
  Shield,
  ArrowRight,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import { formatZEC } from "@/lib/zcash-crypto";

interface AddressDetails {
  address: string;
  balance: number;
  totalReceived?: number;
  totalSent?: number;
  tx_count?: number;
  transaction_count?: number;
  unconfirmed_limit?: number;
  unconfirmed_balance?: number;
  first_encoded_at?: number; // timestamp or block height
  last_encoded_at?: number;
  firstTx?: {
    txid: string;
    timestamp: number;
  };
  lastTx?: {
    txid: string;
    timestamp: number;
  };
  transactions?: AddressTransaction[];
}

interface AddressTransaction {
  txid: string;
  blockHeight: number;
  blockTime: number;
  timestamp?: number;
  value: number; // positive for receive, negative for send (or check inputs/outputs)
  fee?: number;
  type?: "in" | "out" | "mixed"; // We might need to derive this
  from?: string; // simplified for UI
  to?: string; // simplified for UI
}

const AddressDetails = () => {
  const { address } = useParams<{ address: string }>();
  const navigate = useNavigate();
  const { getAddressDetails, getZecPrice, decodeUnifiedAddress } =
    useZcashAPI();

  const [details, setDetails] = useState<AddressDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [zecPrice, setZecPrice] = useState<number | null>(null);
  const [decodedUA, setDecodedUA] = useState<{
    orchard?: string;
    sapling?: string;
    transparent?: string;
  } | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!address) return;

      setLoading(true);
      setError(null);

      try {
        const promises: Promise<any>[] = [getAddressDetails(address)];

        // If Unified Address, try to decode it
        if (address.startsWith("u1") || address.startsWith("utest")) {
          promises.push(decodeUnifiedAddress(address));
        }

        const results = await Promise.all(promises);
        const addrData = results[0];
        const decodeData = results.length > 1 ? results[1] : undefined;

        if (decodeData) {
          setDecodedUA(decodeData);
        }

        if (addrData && !addrData.error) {
          // Normalize data structure if needed
          // Cipherscan API might vary. Assuming structure based on usage.
          const normalized: AddressDetails = {
            ...addrData,
            address: address, // Ensure address is present
            balance: addrData.balanceZat
              ? addrData.balanceZat / 100000000
              : addrData.balance
              ? addrData.balance / 100000000
              : 0,
            tx_count:
              addrData.tx_count ||
              addrData.transaction_count ||
              (addrData.transactions ? addrData.transactions.length : 0),
          };

          // If transactions are present, try to find first/last
          if (addrData.transactions && addrData.transactions.length > 0) {
            // Assuming transactions are sorted desc
            const txs = addrData.transactions;
            const last = txs[0];
            const first = txs[txs.length - 1];

            // Populate first/last if not explicitly provided
            if (!normalized.lastTx) {
              normalized.lastTx = {
                txid: last.txid || last.hash,
                timestamp: last.timestamp || last.time || last.blockTime,
              };
            }
            if (!normalized.firstTx) {
              normalized.firstTx = {
                txid: first.txid || first.hash,
                timestamp: first.timestamp || first.time || first.blockTime,
              };
            }
          }

          setDetails(normalized);
        } else {
          // Even if address fetch fails (e.g. no tx history), we might still have valid decoded data for UA
          if (decodeData) {
            // Create a "ghost" details object just to show the decoded parts
            setDetails({
              address: address,
              balance: 0,
              tx_count: 0,
            });
          } else {
            setError("Address not found or invalid");
          }
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load address details"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [address, getAddressDetails, decodeUnifiedAddress]);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const priceData = await getZecPrice();
        if (priceData) {
          setZecPrice(priceData.usd);
        }
      } catch (err) {
        console.error("Failed to fetch ZEC price:", err);
      }
    };
    fetchPrice();
  }, [getZecPrice]);

  const handleCopyAddress = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopiedAddress(true);
    toast.success("Address copied to clipboard");
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const getAddressType = (addr: string) => {
    if (addr.startsWith("t1") || addr.startsWith("t3") || addr.startsWith("tm"))
      return "TRANSPARENT";
    if (addr.startsWith("zs") || addr.startsWith("ztestsapling"))
      return "SAPLING (SHIELDED)";
    if (addr.startsWith("u1") || addr.startsWith("utest")) return "UNIFIED";
    return "UNKNOWN";
  };

  const formatTimeAgo = (timestamp?: number) => {
    if (!timestamp) return "N/A";
    const now = Date.now();
    // timestamp from API might be in seconds or ms
    const tsMs = timestamp > 10000000000 ? timestamp : timestamp * 1000;
    const diff = now - tsMs;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours === 0) {
        const minutes = Math.floor(diff / (1000 * 60));
        return `${minutes} mins ago`;
      }
      return `${hours} hours ago`;
    }
    return `${days} days ago`;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "TRANSPARENT":
        return "text-blue-400 border-blue-500/30 bg-blue-500/10";
      case "SHIELDED":
        return "text-terminal-green border-terminal-green/30 bg-terminal-green/10";
      case "UNIFIED":
        return "text-purple-400 border-purple-500/30 bg-purple-500/10";
      default:
        return "text-gray-400 border-gray-500/30 bg-gray-500/10";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20 pt-8">
        <div className="container px-4 max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-12 w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center bg-card/40 border-destructive/30 max-w-md">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <p className="text-xl font-bold text-destructive mb-2">
            Address Not Found
          </p>
          <p className="text-muted-foreground mb-6">
            {error || "Could not retrieve address details."}
          </p>
          <Button onClick={() => navigate("/")} variant="outline">
            Return to Explorer
          </Button>
        </Card>
      </div>
    );
  }

  const addrType = getAddressType(details.address);
  const isShieldedAddress =
    addrType === "SAPLING (SHIELDED)" || addrType === "UNIFIED";

  return (
    <div className="min-h-screen bg-background pb-20 pt-8">
      <main className="container px-4 md:px-6 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h1 className="text-3xl font-bold text-foreground">
              Address Details
            </h1>
            <Badge variant="outline" className={`${getTypeColor(addrType)}`}>
              <Shield className="w-3 h-3 mr-1" />
              {addrType}
            </Badge>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground break-all">
            <span className="font-mono text-sm md:text-base">
              {details.address}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 hover:text-foreground"
              onClick={handleCopyAddress}
            >
              {copiedAddress ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Decoded Unified Address Components */}
        {decodedUA && (
          <div className="mb-6 p-6 bg-card border border-border rounded-lg">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5 text-accent" /> Unified Address
              Receivers
            </h3>
            <div className="space-y-4">
              {decodedUA.orchard && (
                <div className="p-4 bg-muted/40 rounded border border-border break-all group hover:border-terminal-green/30 transition-colors relative">
                  <div className="text-xs text-muted-foreground uppercase mb-2 flex items-center gap-2 font-bold tracking-wider">
                    <Shield className="w-3 h-3 text-terminal-green" /> Orchard
                    Receiver (Main)
                  </div>
                  <div className="font-mono text-sm text-terminal-green/90 select-all pr-8">
                    <Link
                      to={`/address/${decodedUA.orchard}`}
                      className="hover:underline"
                    >
                      {decodedUA.orchard}
                    </Link>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => {
                      navigator.clipboard.writeText(decodedUA.orchard || "");
                      toast.success("Orchard receiver copied");
                    }}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              )}
              {decodedUA.sapling && (
                <div className="p-4 bg-muted/40 rounded border border-border break-all group hover:border-purple-500/30 transition-colors relative">
                  <div className="text-xs text-muted-foreground uppercase mb-2 flex items-center gap-2 font-bold tracking-wider">
                    <Shield className="w-3 h-3 text-purple-400" /> Sapling
                    Receiver
                  </div>
                  <div className="font-mono text-sm text-purple-400/90 select-all pr-8">
                    <Link
                      to={`/address/${decodedUA.sapling}`}
                      className="hover:underline"
                    >
                      {decodedUA.sapling}
                    </Link>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => {
                      navigator.clipboard.writeText(decodedUA.sapling || "");
                      toast.success("Sapling receiver copied");
                    }}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              )}
              {decodedUA.transparent && (
                <div className="p-4 bg-muted/40 rounded border border-border break-all group hover:border-blue-500/30 transition-colors relative">
                  <div className="text-xs text-muted-foreground uppercase mb-2 flex items-center gap-2 font-bold tracking-wider">
                    <Database className="w-3 h-3 text-blue-400" /> Transparent
                    Receiver
                  </div>
                  <div className="font-mono text-sm text-blue-400/90 select-all pr-8">
                    <Link
                      to={`/address/${decodedUA.transparent}`}
                      className="hover:underline"
                    >
                      {decodedUA.transparent}
                    </Link>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        decodedUA.transparent || ""
                      );
                      toast.success("Transparent receiver copied");
                    }}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {isShieldedAddress ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <Card className="p-8 bg-card border-border border-l-4 border-l-terminal-green">
              <div className="flex flex-col gap-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
                    <Shield className="w-6 h-6 text-terminal-green" />
                    Shielded Address Detected
                  </h2>
                  <p className="text-lg text-muted-foreground">
                    This is a shielded address. Balance and transaction history
                    are private by default.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      ZCash shielded addresses use zero-knowledge proofs to
                      encrypt transaction data on the blockchain. This means
                      that while transactions are verified, the sender,
                      receiver, and amount remain private.
                    </p>
                    <div className="bg-muted/20 p-4 rounded-lg border border-border">
                      <h3 className="text-sm font-semibold text-foreground mb-3">
                        Privacy Features:
                      </h3>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-terminal-green" />
                          Balance is encrypted
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-terminal-green" />
                          Transaction amounts are hidden
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-terminal-green" />
                          Sender and receiver are private
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-terminal-green" />
                          Optional encrypted memos
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex flex-col justify-center gap-4 bg-terminal-green/5 p-6 rounded-lg border border-terminal-green/10">
                    <div>
                      <h3 className="text-lg font-semibold text-terminal-green mb-2">
                        Want to View Your Transactions?
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Use your Unified Full Viewing Key (UFVK) to decrypt
                        transactions sent to this address to unlock shielded
                        Transactions.
                      </p>
                    </div>

                    <div className="flex flex-col gap-3">
                      <div className="text-xs text-yellow-500/80 bg-yellow-500/10 p-3 rounded border border-yellow-500/20">
                        Note: If this address belongs to you, please import your
                        unified viewing key (UVK) using the wallet connection
                        button to check transactions and balance in the
                        dashboard.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Balance */}
              <Card className="p-6 bg-card border-border relative overflow-hidden group hover:border-accent/30 transition-colors">
                <div className="flex flex-col h-full justify-between gap-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium uppercase tracking-wider">
                    <Wallet className="w-4 h-4" /> ZEC Balance
                  </div>
                  <div>
                    <div className="text-3xl font-mono font-bold text-foreground mb-1">
                      {formatZEC(details.balance)}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Value */}
              <Card className="p-6 bg-card border-border relative overflow-hidden group hover:border-accent/30 transition-colors">
                <div className="flex flex-col h-full justify-between gap-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium uppercase tracking-wider">
                    <Database className="w-4 h-4" /> ZEC Value
                  </div>
                  <div>
                    <div className="text-3xl font-mono font-bold text-foreground mb-1">
                      $
                      {details.balance && zecPrice
                        ? (details.balance * zecPrice).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        : "0.00"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      (@ ${zecPrice?.toLocaleString()}/ZEC)
                    </div>
                  </div>
                </div>
              </Card>

              {/* Type & Stats */}
              <Card className="p-6 bg-card border-border relative overflow-hidden group hover:border-accent/30 transition-colors">
                <div className="flex flex-col h-full gap-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium uppercase tracking-wider">
                    <Shield className="w-4 h-4" /> Address Type
                  </div>
                  <div>
                    <div className="text-xl font-bold text-foreground mb-1">
                      {addrType}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Public address - all transactions are visible
                    </div>
                  </div>
                </div>
              </Card>

              {/* Total Txs */}
              <Card className="p-6 bg-card border-border relative overflow-hidden group hover:border-accent/30 transition-colors">
                <div className="flex flex-col h-full gap-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium uppercase tracking-wider">
                    <Database className="w-4 h-4" /> Total Transactions
                  </div>
                  <div className="text-3xl font-mono font-bold text-foreground">
                    {details.tx_count || 0}
                  </div>
                </div>
              </Card>

              {/* First Tx */}
              <Card className="p-6 bg-card border-border relative overflow-hidden group hover:border-accent/30 transition-colors">
                <div className="flex flex-col h-full gap-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium uppercase tracking-wider">
                    <Clock className="w-4 h-4" /> First Transaction
                  </div>
                  <div className="min-w-0">
                    {details.firstTx ? (
                      <>
                        <Link
                          to={`/tx/${details.firstTx.txid}`}
                          className="block text-accent hover:underline font-mono text-sm truncate mb-1"
                        >
                          {details.firstTx.txid}
                        </Link>
                        <div className="text-sm text-muted-foreground">
                          {formatTimeAgo(details.firstTx.timestamp)}
                        </div>
                      </>
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </div>
                </div>
              </Card>

              {/* Latest Tx */}
              <Card className="p-6 bg-card border-border relative overflow-hidden group hover:border-accent/30 transition-colors">
                <div className="flex flex-col h-full gap-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium uppercase tracking-wider">
                    <Clock className="w-4 h-4" /> Latest Transaction
                  </div>
                  <div className="min-w-0">
                    {details.lastTx ? (
                      <>
                        <Link
                          to={`/tx/${details.lastTx.txid}`}
                          className="block text-accent hover:underline font-mono text-sm truncate mb-1"
                        >
                          {details.lastTx.txid}
                        </Link>
                        <div className="text-sm text-muted-foreground">
                          {formatTimeAgo(details.lastTx.timestamp)}
                        </div>
                      </>
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </div>
                </div>
              </Card>
            </div>

            {/* Transactions List */}
            <div>
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Database className="w-5 h-5" /> Transactions{" "}
                <span className="text-base font-normal text-muted-foreground">
                  (Latest {details.transactions?.length || 0})
                </span>
              </h2>
              <div className="rounded-lg border border-border bg-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-muted/40 text-xs uppercase text-muted-foreground font-medium tracking-wider">
                      <tr>
                        <th className="p-4 border-b border-border">Type</th>
                        <th className="p-4 border-b border-border">
                          Transaction Hash
                        </th>
                        <th className="p-4 border-b border-border">Block</th>
                        <th className="p-4 border-b border-border">Age</th>
                        <th className="p-4 border-b border-border">
                          From / To
                        </th>
                        <th className="p-4 border-b border-border text-right">
                          Amount (ZEC)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {details.transactions?.map((tx, idx) => {
                        // Robust extraction of value
                        let rawValue = 0;
                        if ((tx as any).netChange !== undefined) {
                          rawValue =
                            Math.abs((tx as any).netChange) / 100000000;
                        } else if (tx.value !== undefined) {
                          rawValue = tx.value;
                        } else if ((tx as any).valueZat !== undefined) {
                          rawValue = (tx as any).valueZat / 100000000;
                        } else if ((tx as any).amount !== undefined) {
                          rawValue = (tx as any).amount;
                        }

                        const isReceive =
                          (tx as any).netChange !== undefined
                            ? (tx as any).netChange > 0
                            : rawValue > 0;
                        return (
                          <tr
                            key={tx.txid + idx}
                            className="hover:bg-muted/5 transition-colors"
                          >
                            <td className="p-4">
                              <Badge
                                variant="outline"
                                className={`font-mono text-xs ${
                                  isReceive
                                    ? "bg-green-500/20 text-green-400 border-green-500/30"
                                    : "bg-red-500/20 text-red-400 border-red-500/30"
                                }`}
                              >
                                {isReceive ? (
                                  <ArrowDownLeft className="w-3 h-3 mr-1" />
                                ) : (
                                  <ArrowUpRight className="w-3 h-3 mr-1" />
                                )}
                                {isReceive ? "IN" : "OUT"}
                              </Badge>
                            </td>
                            <td className="p-4">
                              <Link
                                to={`/tx/${tx.txid}`}
                                className="text-accent hover:underline font-mono text-sm max-w-[150px] truncate block"
                              >
                                {tx.txid}
                              </Link>
                            </td>
                            <td className="p-4">
                              <Link
                                to={`/block/${tx.blockHeight}`}
                                className="text-accent hover:underline font-mono text-sm"
                              >
                                #{tx.blockHeight}
                              </Link>
                            </td>
                            <td className="p-4 text-sm text-muted-foreground">
                              {formatTimeAgo(tx.timestamp || tx.blockTime)}
                            </td>
                            <td className="p-4 text-sm font-mono text-muted-foreground">
                              {isReceive ? (
                                <div className="flex items-center gap-1">
                                  <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs border border-blue-500/30">
                                    Shielded
                                  </span>
                                  <ArrowRight className="w-3 h-3 text-muted-foreground" />
                                  <Link
                                    to={`/address/${details.address}`}
                                    className="truncate max-w-[100px] text-accent hover:underline"
                                  >
                                    {details.address.slice(0, 8)}...
                                  </Link>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <Link
                                    to={`/address/${details.address}`}
                                    className="truncate max-w-[100px] text-accent hover:underline"
                                  >
                                    {details.address.slice(0, 8)}...
                                  </Link>
                                  <ArrowRight className="w-3 h-3 text-muted-foreground" />
                                  <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs border border-blue-500/30">
                                    Shielded
                                  </span>
                                </div>
                              )}
                            </td>
                            <td
                              className={`p-4 text-right font-mono font-bold text-sm ${
                                isReceive
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-red-600 dark:text-red-400"
                              }`}
                            >
                              {isReceive ? "+" : ""}
                              {formatZEC(rawValue)}
                            </td>
                          </tr>
                        );
                      })}
                      {!details.transactions?.length && (
                        <tr>
                          <td
                            colSpan={6}
                            className="p-8 text-center text-muted-foreground"
                          >
                            No recent transactions found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default AddressDetails;
