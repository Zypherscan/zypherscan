import { useEffect, useState } from "react";
import { useZcashAPI } from "@/hooks/useZcashAPI";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Server, Globe, Cpu, Database, Network } from "lucide-react";

const NetworkStatus = () => {
  const { getNetworkStatus } = useZcashAPI();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      setLoading(true);
      try {
        const result = await getNetworkStatus();
        setData(result);
      } catch (error) {
        console.error("Failed to fetch network status:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [getNetworkStatus]);

  if (loading && !data) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container px-6 py-8 text-center">
        <p className="text-muted-foreground">Failed to load network status.</p>
      </div>
    );
  }

  return (
    <div className="container px-6 py-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Server className="w-8 h-8 text-accent" />
          Network Status
        </h1>
        <p className="text-muted-foreground">
          Real-time information from your Zcash node.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card className="p-6 bg-card/50 border-accent/10">
          <div className="flex items-center gap-3 mb-4">
            <Globe className="w-5 h-5 text-accent" />
            <h3 className="font-medium">Blockchain Info</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Chain</span>
              <span className="font-mono">{data.blockchain.chain}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Blocks</span>
              <span className="font-mono">{data.blockchain.blocks}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Difficulty</span>
              <span className="font-mono">
                {data.blockchain.difficulty.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Size</span>
              <span className="font-mono">
                {(data.blockchain.size_on_disk / 1024 / 1024 / 1024).toFixed(2)}{" "}
                GB
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-card/50 border-accent/10">
          <div className="flex items-center gap-3 mb-4">
            <Cpu className="w-5 h-5 text-accent" />
            <h3 className="font-medium">Node Info</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Version</span>
              <span className="font-mono">{data.network.version}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Protocol</span>
              <span className="font-mono">{data.network.protocolversion}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Connections</span>
              <span className="font-mono">{data.network.connections}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subversion</span>
              <span className="font-mono">{data.network.subversion}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-card/50 border-accent/10">
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-5 h-5 text-accent" />
            <h3 className="font-medium">Mempool Info</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Size</span>
              <span className="font-mono">{data.mempool.size} txs</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Bytes</span>
              <span className="font-mono">{data.mempool.bytes} bytes</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Usage</span>
              <span className="font-mono">
                {(data.mempool.usage / 1024).toFixed(2)} KB
              </span>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-card/50 border-accent/10">
        <div className="flex items-center gap-3 mb-6">
          <Network className="w-5 h-5 text-accent" />
          <h3 className="font-medium">Connected Peers ({data.peers})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-muted-foreground border-b border-border">
              <tr>
                <th className="pb-3 pl-4">Address</th>
                <th className="pb-3">Connection Type</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {data.peerDetails.map((peer: any, i: number) => (
                <tr
                  key={i}
                  className="border-b border-border/50 last:border-0 hover:bg-accent/5"
                >
                  <td className="py-3 pl-4">{peer.addr || "N/A"}</td>
                  <td className="py-3">
                    <Badge variant={peer.inbound ? "secondary" : "default"}>
                      {peer.inbound ? "Inbound" : "Outbound"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          Note: Zebra only provides peer addresses and connection direction.
          Version and ping data are not available.
        </p>
      </Card>
    </div>
  );
};

export default NetworkStatus;
