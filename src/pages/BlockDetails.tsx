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
} from "lucide-react";
import { toast } from "sonner";

interface BlockDetails extends Block {
  previousblockhash?: string;
  nextblockhash?: string;
  confirmations?: number;
  tx?: string[];
  chainwork?: string;
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

  useEffect(() => {
    if (!authLoading && !isConnected) {
      navigate("/auth");
    }
  }, [isConnected, authLoading, navigate]);

  useEffect(() => {
    const fetchBlock = async () => {
      if (!height) return;

      setLoading(true);
      setError(null);

      try {
        const result = await searchBlockchain(height);
        if (result.success && result.type === "block") {
          console.log("Block data:", result.result);
          setBlock(result.result);
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

  const handleCopyHash = async (hash: string) => {
    await navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    toast.success("Block hash copied");
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const formatTimestamp = (timestamp: string | number) => {
    if (!timestamp) return "Unknown Date";

    let date = new Date(timestamp);

    // If invalid, try parsing as Unix timestamp (seconds)
    if (isNaN(date.getTime())) {
      const seconds = Number(timestamp);
      if (!isNaN(seconds)) {
        // Check if it's seconds or milliseconds
        // If > 100000000000, assume milliseconds, else seconds
        date = new Date(seconds > 100000000000 ? seconds : seconds * 1000);
      }
    }

    return isNaN(date.getTime()) ? "Invalid Date" : date.toLocaleString();
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
        ) : block ? (
          <div className="space-y-6">
            {/* Block Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-accent/20 flex items-center justify-center">
                  <Box className="w-8 h-8 text-accent" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">
                    Block #{block.height.toLocaleString()}
                  </h1>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {formatTimestamp(block.timestamp)}
                  </p>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center gap-2">
                {block.previousblockhash && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/block/${block.height - 1}`)}
                    className="border-accent/30"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Prev
                  </Button>
                )}
                {block.nextblockhash && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/block/${block.height + 1}`)}
                    className="border-accent/30"
                  >
                    Next
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </div>
            </div>

            {/* Block Details */}
            <Card className="card-glow bg-card/50 backdrop-blur-sm border-accent/10 overflow-hidden">
              <div className="p-6 border-b border-border">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Layers className="w-5 h-5 text-accent" />
                  Block Details
                </h2>
              </div>

              <div className="divide-y divide-border">
                {/* Hash */}
                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Hash className="w-4 h-4" />
                    Block Hash
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm break-all">
                      {block.hash}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={() => handleCopyHash(block.hash)}
                    >
                      {copiedHash ? (
                        <Check className="w-4 h-4 text-terminal-green" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Confirmations */}
                {block.confirmations !== undefined && (
                  <div className="p-4 flex items-center justify-between">
                    <span className="text-muted-foreground">Confirmations</span>
                    <Badge className="bg-terminal-green/20 text-terminal-green border-terminal-green/30">
                      {block.confirmations.toLocaleString()}
                    </Badge>
                  </div>
                )}

                {/* Transactions */}
                <div className="p-4 flex items-center justify-between">
                  <span className="text-muted-foreground">Transactions</span>
                  <span className="font-mono">{block.tx_count} txs</span>
                </div>

                {/* Size */}
                <div className="p-4 flex items-center justify-between">
                  <span className="text-muted-foreground">Size</span>
                  <span className="font-mono">
                    {block.size
                      ? `${(block.size / 1024).toFixed(2)} KB`
                      : "N/A"}
                  </span>
                </div>

                {/* Difficulty */}
                <div className="p-4 flex items-center justify-between">
                  <span className="text-muted-foreground">Difficulty</span>
                  <span className="font-mono">
                    {block.difficulty?.toLocaleString() || "N/A"}
                  </span>
                </div>

                {/* Merkle Root */}
                {block.merkle_root && (
                  <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-muted-foreground">Merkle Root</span>
                    <span className="font-mono text-sm break-all opacity-75">
                      {block.merkle_root}
                    </span>
                  </div>
                )}

                {/* Nonce */}
                {block.nonce && (
                  <div className="p-4 flex items-center justify-between">
                    <span className="text-muted-foreground">Nonce</span>
                    <span className="font-mono">{block.nonce}</span>
                  </div>
                )}

                {/* Version */}
                <div className="p-4 flex items-center justify-between">
                  <span className="text-muted-foreground">Version</span>
                  <span className="font-mono">{block.version}</span>
                </div>
              </div>
            </Card>

            {/* Transactions */}
            {block.tx && block.tx.length > 0 && (
              <Card className="card-glow bg-card/50 backdrop-blur-sm border-accent/10">
                <div className="p-6 border-b border-border">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Activity className="w-5 h-5 text-accent" />
                    Transactions ({block.tx.length})
                  </h2>
                </div>
                <div className="divide-y divide-border max-h-96 overflow-y-auto">
                  {block.tx.slice(0, 50).map((txid, i) => (
                    <Link
                      key={txid}
                      to={`/tx/${txid}`}
                      className="p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground text-sm">
                          #{i + 1}
                        </span>
                        <span className="font-mono text-sm truncate max-w-[300px] sm:max-w-[500px]">
                          {txid}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </Link>
                  ))}
                  {block.tx.length > 50 && (
                    <div className="p-4 text-center text-muted-foreground">
                      ... and {block.tx.length - 50} more transactions
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
};

export default BlockDetails;
