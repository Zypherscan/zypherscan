import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Box, ArrowRight } from "lucide-react";

interface Block {
  height: number;
  hash: string;
  timestamp: number;
  transactions: number;
  size: number;
}

const mockBlocks: Block[] = [
  {
    height: 2345678,
    hash: "0000000000034a8f3e9c0ac...",
    timestamp: Date.now() - 30000,
    transactions: 245,
    size: 1254000,
  },
  {
    height: 2345677,
    hash: "00000000000a2b5d8f7c1bd...",
    timestamp: Date.now() - 180000,
    transactions: 189,
    size: 985000,
  },
  {
    height: 2345676,
    hash: "0000000000123c4e9a8f7ed...",
    timestamp: Date.now() - 330000,
    transactions: 312,
    size: 1456000,
  },
];

const formatTime = (timestamp: number) => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
};

const formatSize = (bytes: number) => {
  return `${(bytes / 1024).toFixed(0)} KB`;
};

export const RecentBlocks = () => {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <Box className="w-6 h-6 text-accent" />
        Recent Blocks
      </h2>
      
      <div className="grid gap-4">
        {mockBlocks.map((block) => (
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
                      <span className="text-foreground font-semibold">{block.transactions}</span> transactions
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
