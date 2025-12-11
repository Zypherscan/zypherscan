import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useZcashAPI, Block } from "@/hooks/useZcashAPI";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  ArrowRight,
  Box,
  Clock,
  Hash,
  Layers,
  Activity,
  Copy,
  Check,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";

interface TransactionSummary {
  txid: string;
  type: "coinbase" | "regular" | "shielded" | "mixed";
  from: string;
  to: string;
  value: number;
  fee: number;
  ins: number;
  outs: number;
  size: number;
}

interface BlockDetails extends Block {
  previousblockhash?: string;
  nextblockhash?: string;
  confirmations?: number;
  tx?: any[]; // Can be strings or full transaction objects
  transactions?: any[]; // Alternative field name
  chainwork?: string;
  bits?: string;
  merkle_root?: string;
  finalsaplingroot?: string;
  finalSaplingRoot?: string; // Alternative casing
  // Add enriched tx data
  detailedTxs?: TransactionSummary[];
}

const BlockDetails = () => {
  const { height } = useParams<{ height: string }>();
  const navigate = useNavigate();
  const { isConnected, loading: authLoading } = useAuth();
  const { searchBlockchain } = useZcashAPI();

  const [block, setBlock] = useState<BlockDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [enrichedTxs, setEnrichedTxs] = useState<TransactionSummary[]>([]);

  useEffect(() => {
    const fetchBlock = async () => {
      if (!height) return;

      setLoading(true);
      setError(null);

      try {
        const result = await searchBlockchain(height);
        if (result.success && result.type === "block") {
          setBlock(result.result as unknown as BlockDetails);
        } else {
          setError("Block not found");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load block");
      } finally {
        setLoading(false);
      }
    };

    fetchBlock();
  }, [height, searchBlockchain]);

  // New effect to process transactions from block data
  useEffect(() => {
    if (!block) return;

    // Check if block has embedded transaction objects
    const txData = block.transactions || block.tx;
    if (!txData || txData.length === 0) return;

    const processTxDetails = () => {
      const results: TransactionSummary[] = [];

      for (let i = 0; i < Math.min(txData.length, 50); i++) {
        const t = txData[i];

        // If it's just a string (txid), we need to fetch - but Cipherscan API gives us full objects
        if (typeof t === "string") {
          results.push({
            txid: t,
            type: "regular",
            from: "...",
            to: "...",
            value: 0,
            fee: 0,
            ins: 0,
            outs: 0,
            size: 0,
          });
          continue;
        }

        // Process full transaction object
        const isCoinbase = t.inputs?.[0]?.coinbase || t.vin?.[0]?.coinbase;

        // Type detection - check for shielded components
        const hasShielded =
          t.has_sapling === true ||
          t.has_orchard === true ||
          Number(t.value_balance || 0) !== 0;

        // Check if there are transparent components
        const hasTransparentInputs =
          t.inputs?.length > 0 && !t.inputs[0]?.coinbase;
        const hasTransparentOutputs = t.outputs?.length > 0;

        let type: "coinbase" | "regular" | "shielded" | "mixed" = "regular";
        if (isCoinbase) {
          type = "coinbase";
        } else if (
          hasShielded &&
          (hasTransparentInputs || hasTransparentOutputs)
        ) {
          // Mixed: has both shielded and transparent components
          type = "mixed";
        } else if (hasShielded) {
          // Fully shielded
          type = "shielded";
        }

        // From/To addresses
        let from = "Unknown";
        let to = "Unknown";

        if (isCoinbase) {
          from = "Block Reward";
          to = t.outputs?.[0]?.scriptPubKey?.addresses?.[0] || "Pool";
        } else if (type === "shielded") {
          // Fully shielded transaction
          from = "Shielded Pool";
          to = "Shielded Pool";
        } else if (type === "mixed") {
          // Mixed transaction - extract addresses from transparent side
          from = t.inputs?.[0]?.address || "Shielded";
          to =
            t.outputs?.[0]?.scriptPubKey?.addresses?.[0] ||
            t.outputs?.[0]?.address ||
            "Shielded";
        } else {
          // Regular transparent transaction
          from = t.inputs?.[0]?.address || "Block Reward";
          to =
            t.outputs?.[0]?.scriptPubKey?.addresses?.[0] ||
            t.outputs?.[0]?.address ||
            "Block Reward";
        }

        // Calculate value (sum of outputs)
        const totalValue =
          t.outputs?.reduce(
            (sum: number, out: any) => sum + (Number(out.value) || 0),
            0
          ) || 0;

        // Calculate fee with shielded value balance consideration
        const inputSum =
          t.inputs?.reduce(
            (sum: number, inp: any) => sum + (Number(inp.value) || 0),
            0
          ) || 0;
        const outputSum = totalValue;

        // Handle value_balance for shielded transactions
        // value_balance is in satoshis, represents net flow to shielded pool
        // Keep in satoshis for calculation to avoid unit mixing
        let valueBalanceSat = 0;
        if (t.value_balance) {
          valueBalanceSat = Math.abs(Number(t.value_balance));
        }

        // Calculate fee (all values in satoshis, then convert to ZEC)
        const feeInSatoshis = isCoinbase
          ? 0
          : Math.max(0, inputSum - outputSum - valueBalanceSat);
        const fee = feeInSatoshis / 1e8; // Convert satoshis to ZEC

        results.push({
          txid: t.txid,
          type,
          from:
            from?.length > 15
              ? from.substring(0, 8) + "..." + from.substring(from.length - 6)
              : from,
          to:
            to?.length > 15
              ? to.substring(0, 8) + "..." + to.substring(to.length - 6)
              : to,
          value: totalValue / 1e8, // Also convert value to ZEC
          fee,
          ins: t.vin_count || t.inputs?.length || 0,
          outs: t.vout_count || t.outputs?.length || 0,
          size: t.size || 0,
        });
      }

      setEnrichedTxs(results);
    };

    processTxDetails();
  }, [block]);

  const handleCopyHash = async (hash: string) => {
    await navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    toast.success("Block hash copied");
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const formatTimestamp = (timestamp: string | number) => {
    if (!timestamp) return "Unknown Date";

    let date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      const seconds = Number(timestamp);
      if (!isNaN(seconds)) {
        date = new Date(seconds > 100000000000 ? seconds : seconds * 1000);
      }
    }

    // Format "1 min ago (Dec 10, 2025)"
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    let ago = "";
    if (diffSeconds < 60) ago = `${diffSeconds} secs ago`;
    else if (diffSeconds < 3600)
      ago = `${Math.floor(diffSeconds / 60)} min ago`;
    else if (diffSeconds < 86400)
      ago = `${Math.floor(diffSeconds / 3600)} hr ago`;
    else ago = `${Math.floor(diffSeconds / 86400)} days ago`;

    return `${ago} (${date.toLocaleString()})`;
  };

  const formatHashrate = (difficulty: number) => {
    if (difficulty >= 1e12) return `${(difficulty / 1e12).toFixed(2)} TH/s`;
    if (difficulty >= 1e9) return `${(difficulty / 1e9).toFixed(2)} GH/s`;
    if (difficulty >= 1e6) return `${(difficulty / 1e6).toFixed(2)} MH/s`;
    return `${difficulty.toFixed(2)} H/s`;
  };

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
            <Activity className="w-12 h-12 text-destructive mx-auto mb-4" />
            <p className="text-xl font-bold text-destructive mb-2">
              Block Not Found
            </p>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => navigate("/")} variant="outline">
              Return to Explorer
            </Button>
          </Card>
        ) : block ? (
          <div className="space-y-6">
            {/* Back Button */}
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-muted-foreground hover:text-accent transition-colors mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>

            {/* Block Header */}
            <div>
              <div className="flex items-center gap-2 mb-4 text-sm text-gray-400">
                <Box className="w-4 h-4" /> Block
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* Prev Button */}
                  {block.height > 0 && (
                    <button
                      onClick={() => navigate(`/block/${block.height - 1}`)}
                      className="text-gray-500 hover:text-white transition-colors p-1"
                    >
                      <ArrowLeft className="w-6 h-6" />
                    </button>
                  )}
                  <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                    <span className="text-gray-500 text-2xl">#</span>
                    {block.height.toLocaleString()}
                  </h1>
                  {/* Next Button */}
                  <button
                    onClick={() => navigate(`/block/${block.height + 1}`)}
                    className="text-gray-500 hover:text-white transition-colors p-1 ml-2"
                  >
                    <ArrowRight className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>

            {/* Block Details Card */}
            <Card className="bg-[#0f1016] border-gray-800 p-0 overflow-hidden">
              <div className="p-6 space-y-6">
                {/* Timestamp */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center border-b border-gray-800/50 pb-4">
                  <span className="text-gray-400 text-sm flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Timestamp
                  </span>
                  <div className="md:col-span-3 text-white text-sm">
                    {formatTimestamp(block.timestamp)}
                  </div>
                </div>

                {/* Transactions Count */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center border-b border-gray-800/50 pb-4">
                  <span className="text-gray-400 text-sm flex items-center gap-2">
                    <Layers className="w-4 h-4" /> Transactions
                  </span>
                  <div className="md:col-span-3">
                    <Link
                      to="#transactions"
                      className="text-accent hover:text-accent/80 text-sm decoration-accent/30 underline-offset-4 hover:underline"
                    >
                      {block.tx_count} transactions in this block
                    </Link>
                  </div>
                </div>

                {/* Confirmations */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center border-b border-gray-800/50 pb-4">
                  <span className="text-gray-400 text-sm flex items-center gap-2">
                    <Check className="w-4 h-4" /> Confirmations
                  </span>
                  <div className="md:col-span-3">
                    <Badge className="bg-terminal-green/20 text-terminal-green border-terminal-green/30 px-2 py-0.5 text-xs font-mono">
                      {block.confirmations && block.confirmations > 0
                        ? block.confirmations.toLocaleString()
                        : "1+"}
                    </Badge>
                  </div>
                </div>

                {/* Size */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center border-b border-gray-800/50 pb-4">
                  <span className="text-gray-400 text-sm flex items-center gap-2">
                    <Box className="w-4 h-4" /> Block Size
                  </span>
                  <div className="md:col-span-3 text-white text-sm">
                    {block.size
                      ? `${(block.size / 1024).toFixed(2)} KB`
                      : "N/A"}
                  </div>
                </div>

                {/* Transaction Fees */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center border-b border-gray-800/50 pb-4">
                  <span className="text-gray-400 text-sm flex items-center gap-2">
                    <Box className="w-4 h-4" /> Transaction Fees
                  </span>
                  <div className="md:col-span-3 text-white text-sm">
                    {enrichedTxs.length > 0
                      ? enrichedTxs
                          .reduce((sum, tx) => sum + (tx.fee || 0), 0)
                          .toFixed(8) + " ZEC"
                      : "Calculating..."}
                  </div>
                </div>

                {/* Block Hash */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start border-b border-gray-800/50 pb-4">
                  <span className="text-gray-400 text-sm flex items-center gap-2 mt-1">
                    <Hash className="w-4 h-4" /> Block Hash
                  </span>
                  <div className="md:col-span-3">
                    <div className="flex items-center gap-2 bg-black/40 p-3 rounded-lg border border-gray-800">
                      <code className="text-accent font-mono text-xs sm:text-sm break-all flex-1">
                        {block.hash}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-gray-500 hover:text-white"
                        onClick={() => handleCopyHash(block.hash)}
                      >
                        {copiedHash ? (
                          <Check className="w-3 h-3 text-green-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Expandable Details */}
                <div className="pt-2">
                  <button
                    onClick={() => setShowMoreDetails(!showMoreDetails)}
                    className="flex items-center gap-2 text-accent hover:text-accent/80 text-sm font-medium transition-colors border border-accent/30 rounded px-3 py-1.5 bg-accent/10"
                  >
                    {showMoreDetails ? (
                      <ChevronDown className="w-3 h-3 rotate-180 transition-transform" />
                    ) : (
                      <ChevronDown className="w-3 h-3 transition-transform" />
                    )}
                    {showMoreDetails
                      ? "Hide More Details"
                      : "Show More Details"}
                  </button>

                  {showMoreDetails && (
                    <div className="mt-6 space-y-6 animate-in slide-in-from-top-2">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center border-b border-gray-800/50 pb-4">
                        <span className="text-gray-400 text-sm font-mono">
                          &lt;/&gt; Difficulty
                        </span>
                        <div className="md:col-span-3 text-white text-sm font-mono">
                          {block.difficulty?.toLocaleString()}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center border-b border-gray-800/50 pb-4">
                        <span className="text-gray-400 text-sm font-mono">
                          &lt;/&gt; Version
                        </span>
                        <div className="md:col-span-3 text-white text-sm font-mono">
                          {block.version}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center border-b border-gray-800/50 pb-4">
                        <span className="text-gray-400 text-sm font-mono">
                          &lt;/&gt; Bits
                        </span>
                        <div className="md:col-span-3 text-white text-sm font-mono">
                          {block.bits || "N/A"}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center border-b border-gray-800/50 pb-4">
                        <span className="text-gray-400 text-sm font-mono">
                          &lt;/&gt; Nonce
                        </span>
                        <div className="md:col-span-3 text-white text-sm font-mono break-all opacity-75">
                          {block.nonce}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center border-b border-gray-800/50 pb-4">
                        <span className="text-gray-400 text-sm font-mono">
                          &lt;/&gt; Merkle Root
                        </span>
                        <div className="md:col-span-3 text-white text-sm font-mono break-all opacity-75">
                          {block.merkle_root}
                        </div>
                      </div>
                      {/* Final Sapling Root - Explicit display logic */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center border-b border-gray-800/50 pb-4">
                        <span className="text-gray-400 text-sm font-mono">
                          &lt;/&gt; Final Sapling Root
                        </span>
                        <div className="md:col-span-3 text-purple-300 text-sm font-mono break-all opacity-75">
                          {block.finalsaplingroot ||
                            block.finalSaplingRoot ||
                            "N/A"}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Transactions Table Section */}
            <div id="transactions">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-lg font-bold text-gray-200">
                  TRANSACTIONS
                </h3>
                <Badge
                  variant="secondary"
                  className="bg-accent/20 text-accent border-none"
                >
                  {block.tx_count}
                </Badge>
              </div>

              <Card className="bg-[#0f1016] border-gray-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-[#12131a] text-gray-400 text-xs uppercase font-medium border-b border-gray-800">
                      <tr>
                        <th className="px-6 py-4">#</th>
                        <th className="px-6 py-4">Type</th>
                        <th className="px-6 py-4">Hash</th>
                        <th className="px-6 py-4">From</th>
                        <th className="px-6 py-4">To</th>
                        <th className="px-6 py-4 text-center">Ins</th>
                        <th className="px-6 py-4 text-center">Outs</th>
                        <th className="px-6 py-4">Size</th>
                        <th className="px-6 py-4 text-right">Amount (ZEC)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/30">
                      {enrichedTxs.length > 0
                        ? enrichedTxs.map((tx, i) => (
                            <tr
                              key={`block-tx-${i}`}
                              className="hover:bg-white/5 transition-colors"
                            >
                              <td className="px-6 py-4 text-gray-500 font-mono">
                                #{i + 1}
                              </td>
                              <td className="px-6 py-4">
                                <Badge
                                  variant="outline"
                                  className={
                                    tx.type === "coinbase"
                                      ? "bg-terminal-green/10 text-terminal-green border-terminal-green/20"
                                      : tx.type === "shielded"
                                      ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                                      : tx.type === "mixed"
                                      ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                                      : "bg-gray-800 text-gray-400 border-gray-700 font-normal"
                                  }
                                >
                                  {tx.type === "coinbase"
                                    ? "COINBASE"
                                    : tx.type === "shielded"
                                    ? "SHIELDED"
                                    : tx.type === "mixed"
                                    ? "MIXED"
                                    : "Regular"}
                                </Badge>
                              </td>
                              <td className="px-6 py-4">
                                <Link
                                  to={`/tx/${tx.txid}`}
                                  className="text-accent hover:text-accent/80 font-mono truncate max-w-[150px] block"
                                >
                                  {tx.txid}
                                </Link>
                              </td>
                              <td className="px-6 py-4 text-gray-400 font-mono text-xs truncate max-w-[120px]">
                                {tx.from}
                              </td>
                              <td className="px-6 py-4 text-gray-400 font-mono text-xs truncate max-w-[120px]">
                                {tx.to}
                              </td>
                              <td className="px-6 py-4 text-center text-gray-400 font-mono text-xs">
                                {tx.ins}
                              </td>
                              <td className="px-6 py-4 text-center text-gray-400 font-mono text-xs">
                                {tx.outs}
                              </td>
                              <td className="px-6 py-4 text-gray-400 font-mono text-xs">
                                {tx.size} B
                              </td>
                              <td className="px-6 py-4 text-right text-white font-mono font-medium">
                                {tx.value.toFixed(4)}
                              </td>
                            </tr>
                          ))
                        : // Fallback loading state for updated txs
                          block.tx?.slice(0, 10).map((txid, i) => (
                            <tr
                              key={`loading-tx-${i}`}
                              className="hover:bg-white/5 transition-colors animate-pulse"
                            >
                              <td className="px-6 py-4 text-gray-500 font-mono">
                                #{i + 1}
                              </td>
                              <td className="px-6 py-4">
                                <div className="h-4 w-16 bg-gray-800 rounded"></div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="h-4 w-24 bg-gray-800 rounded"></div>
                              </td>
                              <td className="px-6 py-4" colSpan={6}>
                                <span className="text-gray-600 text-xs">
                                  Loading details...
                                </span>
                              </td>
                            </tr>
                          ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
};

export default BlockDetails;
