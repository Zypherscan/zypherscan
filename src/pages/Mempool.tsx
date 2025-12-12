import { useEffect, useState } from "react";
import { useZcashAPI } from "@/hooks/useZcashAPI";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Activity, Shield, Box, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const Mempool = () => {
  const navigate = useNavigate();
  const { getMempool } = useZcashAPI();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ count: number; transactions: any[] }>({
    count: 0,
    transactions: [],
  });

  useEffect(() => {
    const fetchMempool = async () => {
      setLoading(true);
      try {
        const result = await getMempool();
        setData(result);
      } catch (error) {
        console.error("Failed to fetch mempool:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMempool();
    const interval = setInterval(fetchMempool, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, [getMempool]);

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case "shielded":
        return "default"; // Primary color
      case "mixed":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="container px-6 py-8 max-w-5xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-muted-foreground hover:text-accent transition-colors mb-4"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back</span>
      </button>

      <div className="mb-8 flex items-center justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Activity className="w-8 h-8 text-accent" />
            Mempool
          </h1>
          <p className="text-muted-foreground">
            Live transactions waiting to be mined.
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-accent">{data.count}</p>
          <p className="text-xs text-muted-foreground">Pending Transactions</p>
        </div>
      </div>

      {loading && data.transactions.length === 0 ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      ) : (
        <div className="grid gap-4">
          {data.transactions.length === 0 ? (
            <Card className="p-8 text-center bg-card/50 border-accent/10">
              <p className="text-muted-foreground">
                Mempool is currently empty.
              </p>
            </Card>
          ) : (
            data.transactions.map((tx) => (
              <Card
                key={tx.txid}
                className="p-4 bg-card/50 border-accent/10 hover:bg-accent/5 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div
                      className={`p-2 rounded-full ${
                        tx.type === "shielded"
                          ? "bg-accent/20 text-accent"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {tx.type === "shielded" ? (
                        <Shield className="w-4 h-4" />
                      ) : (
                        <Box className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <Link
                        to={`/tx/${tx.txid}`}
                        className="font-mono text-sm hover:text-accent break-all w-full block"
                      >
                        {tx.txid}
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant={getBadgeVariant(tx.type)}
                          className="text-[10px] uppercase"
                        >
                          {tx.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(tx.time * 1000).toLocaleTimeString()}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {tx.size} bytes
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Mempool;
