import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useZcashAPI, Block } from "@/hooks/useZcashAPI";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Box, ArrowRight, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
};

const formatSize = (bytes?: number) => {
  if (!bytes) return "N/A";
  return `${(bytes / 1024).toFixed(0)} KB`;
};

export const RecentBlocks = () => {
  const { getLatestBlocks } = useZcashAPI();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBlocks = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setRefreshing(true);
    else setLoading(true);

    const data = await getLatestBlocks(5);
    setBlocks(data);

    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchBlocks();

    // Refresh every 30 seconds
    const interval = setInterval(() => fetchBlocks(true), 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Box className="w-6 h-6 text-accent" />
            Recent Blocks
          </h2>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Box className="w-6 h-6 text-accent" />
          Recent Blocks
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchBlocks(true)}
          disabled={refreshing}
          className="border-accent/30"
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4">
        {blocks.map((block) => (
          <Link key={block.height} to={`/block/${block.height}`}>
            <Card className="card-glow bg-card/50 backdrop-blur-sm p-4 hover:bg-card/70 transition-all cursor-pointer border-accent/10 group">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-accent/10 border border-accent/20 group-hover:bg-accent/20 transition-colors shrink-0">
                    <Box className="w-6 h-6 text-accent" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-semibold text-foreground">
                        Block #{block.height.toLocaleString()}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {formatTime(block.timestamp)}
                      </div>
                    </div>

                    <p className="font-mono text-xs text-muted-foreground truncate opacity-70 mb-2">
                      {block.hash}
                    </p>

                    <div className="flex flex-wrap gap-3 text-xs">
                      <Badge
                        variant="outline"
                        className="h-5 px-1.5 border-accent/20 text-accent/80 font-normal"
                      >
                        {block.tx_count} txns
                      </Badge>
                      {block.size && (
                        <span className="text-muted-foreground self-center">
                          {formatSize(block.size)}
                        </span>
                      )}
                      {block.difficulty && (
                        <span className="text-muted-foreground self-center hidden sm:inline">
                          Diff: {(block.difficulty / 1e6).toFixed(2)}M
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <ArrowRight className="w-5 h-5 text-accent hidden md:block opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {blocks.length === 0 && (
        <Card className="p-8 text-center text-muted-foreground">
          <p>No blocks found. The blockchain might still be syncing.</p>
        </Card>
      )}
    </div>
  );
};
