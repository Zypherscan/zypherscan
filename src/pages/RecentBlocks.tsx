import { useEffect, useState } from "react";
import { useZcashAPI } from "@/hooks/useZcashAPI";
import { Card } from "@/components/ui/card";
import { Loader2, Box, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const RecentBlocks = () => {
  const { getLatestBlocks } = useZcashAPI();
  const [loading, setLoading] = useState(true);
  const [blocks, setBlocks] = useState<any[]>([]);

  useEffect(() => {
    const fetchBlocks = async () => {
      setLoading(true);
      try {
        const result = (await getLatestBlocks(20)) as any; // Fetch 20 blocks
        if (result && result.blocks) {
          setBlocks(result.blocks);
        }
      } catch (error) {
        console.error("Failed to fetch blocks:", error);
        // Optionally, handle error state for UI, e.g., setBlocks([])
      } finally {
        setLoading(false);
      }
    };

    fetchBlocks();
    const interval = setInterval(fetchBlocks, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [getLatestBlocks]);

  return (
    <div className="container px-6 py-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Box className="w-8 h-8 text-accent" />
          Recent Blocks
        </h1>
        <p className="text-muted-foreground">
          The latest blocks mined on the Zcash network.
        </p>
      </div>

      {loading && blocks.length === 0 ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      ) : (
        <Card className="bg-card/50 border-accent/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-muted-foreground border-b border-border bg-accent/5">
                <tr>
                  <th className="py-3 pl-6">Height</th>
                  <th className="py-3">Hash</th>
                  <th className="py-3">Time</th>
                  <th className="py-3">TXs</th>
                  <th className="py-3">Size</th>
                  <th className="py-3 pr-6"></th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {blocks.map((block) => (
                  <tr
                    key={block.hash}
                    className="border-b border-border/50 last:border-0 hover:bg-accent/5 transition-colors"
                  >
                    <td className="py-3 pl-6 font-bold text-accent">
                      <Link
                        to={`/block/${block.height}`}
                        className="hover:underline"
                      >
                        {block.height}
                      </Link>
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {block.hash.substring(0, 16)}...
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {new Date(block.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3">{block.tx_count}</td>
                    <td className="py-3">
                      {(block.size / 1024).toFixed(2)} KB
                    </td>
                    <td className="py-3 pr-6 text-right">
                      <Link to={`/block/${block.height}`}>
                        <ArrowRight className="w-4 h-4 text-muted-foreground hover:text-accent inline-block" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default RecentBlocks;
