import { useEffect, useState, useMemo } from "react";
import { useZcashAPI } from "@/hooks/useZcashAPI";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Box,
  ArrowRight,
  ArrowLeft,
  ArrowUpDown,
  Download,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const RecentBlocks = () => {
  const navigate = useNavigate();
  const { getLatestBlocks } = useZcashAPI();
  const [loading, setLoading] = useState(true);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  const sortedBlocks = useMemo(() => {
    let sortableItems = [...blocks];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [blocks, sortConfig]);

  const requestSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const downloadCSV = () => {
    if (sortedBlocks.length === 0) return;

    const headers = [
      "Height",
      "Hash",
      "Time",
      "Transactions",
      "Size (Bytes)",
      "Raw Data",
    ];

    const csvContent = [
      headers.join(","),
      ...sortedBlocks.map((block) =>
        [
          block.height,
          block.hash,
          new Date(block.timestamp).toISOString(),
          block.tx_count,
          block.size,
          `"${JSON.stringify(block).replace(/"/g, '""')}"`,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `zypherscan-recent_blocks.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  useEffect(() => {
    const fetchBlocks = async () => {
      setLoading(true);
      try {
        const result = await getLatestBlocks(20);
        if (Array.isArray(result)) {
          setBlocks(result);
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
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-muted-foreground hover:text-accent transition-colors mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back</span>
      </button>

      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Box className="w-8 h-8 text-accent" />
            Recent Blocks
          </h1>
          <p className="text-muted-foreground">
            The latest blocks mined on the ZCash network.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={downloadCSV}
          className="gap-2 border-accent/20 hover:bg-accent/10"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      {loading && blocks.length === 0 ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      ) : (
        <Card className="bg-card/50 border-accent/10 overflow-hidden min-h-[600px] flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-muted-foreground border-b border-border bg-accent/5">
                <tr>
                  <th
                    className="py-3 pl-6 pr-2 cursor-pointer hover:text-foreground transition-colors group"
                    onClick={() => requestSort("height")}
                  >
                    <div className="flex items-center gap-1">
                      Height
                      <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </th>
                  <th className="py-3 px-2">Hash</th>
                  <th
                    className="py-3 px-2 cursor-pointer hover:text-foreground transition-colors group"
                    onClick={() => requestSort("timestamp")}
                  >
                    <div className="flex items-center gap-1">
                      Time
                      <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </th>
                  <th
                    className="py-3 px-2 cursor-pointer hover:text-foreground transition-colors group"
                    onClick={() => requestSort("tx_count")}
                  >
                    <div className="flex items-center gap-1">
                      TXs
                      <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </th>
                  <th
                    className="py-3 px-2 cursor-pointer hover:text-foreground transition-colors group"
                    onClick={() => requestSort("size")}
                  >
                    <div className="flex items-center gap-1">
                      Size
                      <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </th>
                  <th className="py-3 pr-6 pl-3 hidden md:block"></th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {sortedBlocks.map((block) => (
                  <tr
                    key={block.hash}
                    className="border-b border-border/50 last:border-0 hover:bg-accent/5 transition-colors"
                  >
                    <td className="py-3 pl-6 pr-2 font-bold text-accent">
                      <Link
                        to={`/block/${block.height}`}
                        className="hover:underline"
                      >
                        {block.height}
                      </Link>
                    </td>
                    <td className="py-3 px-2 text-muted-foreground">
                      {block.hash.substring(0, 16)}...
                    </td>
                    <td className="py-3 px-2 text-muted-foreground whitespace-nowrap">
                      {new Date(block.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-2">{block.tx_count}</td>
                    <td className="py-3 px-2 whitespace-nowrap">
                      {(block.size / 1024).toFixed(2)} KB
                    </td>
                    <td className="py-3 pl-2 pr-6 text-right hidden md:block">
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
