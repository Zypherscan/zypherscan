import { useEffect, useState } from "react";
import { useZcashAPI, Block } from "@/hooks/useZcashAPI";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Box, ArrowRight } from "lucide-react";
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

  useEffect(() => {
    const fetchBlocks = async () => {
      setLoading(true);
      const data = await getLatestBlocks(3);
      setBlocks(data);
      setLoading(false);
    };

    fetchBlocks();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchBlocks, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Box className="w-6 h-6 text-accent" />
          Recent Blocks
        </h2>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <Box className="w-6 h-6 text-accent" />
        Recent Blocks
      </h2>
      
      <div className="grid gap-4">
        {blocks.map((block) => (
          <Card 
            key={block.height}
            className="card-glow bg-card/50 backdrop-blur-sm p-4 hover:bg-card/70 transition-all cursor-pointer border-accent/10"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center justify-center w-20 h-20 rounded-lg bg-accent/10 border border-accent/20">
                  <Box className="w-6 h-6 text-accent mb-1" />
                  <span className="text-xs font-mono text-accent">{block.height}</span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs font-mono border-accent/30">
                      Block #{block.height}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {formatTime(block.timestamp)}
                    </div>
                  </div>
                  
                  <p className="font-mono text-sm text-muted-foreground truncate">
                    {block.hash}
                  </p>
                  
                  <div className="flex gap-4 mt-2 text-sm">
                    <span className="text-muted-foreground">
                      <span className="text-foreground font-semibold">{block.tx_count}</span> transactions
                    </span>
                    <span className="text-muted-foreground">
                      <span className="text-foreground font-semibold">{formatSize(block.size)}</span>
                    </span>
                  </div>
                </div>
              </div>
              
              <ArrowRight className="w-5 h-5 text-accent hidden md:block" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
