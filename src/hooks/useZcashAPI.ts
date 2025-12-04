import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Block {
  height: number;
  hash: string;
  version: number;
  merkle_root?: string;
  timestamp: string;
  nonce?: string;
  difficulty?: number;
  size?: number;
  tx_count: number;
}

export const useZcashAPI = () => {
  const getLatestBlocks = useCallback(
    async (limit: number = 10): Promise<Block[]> => {
      try {
        const { data, error } = await supabase.functions.invoke("zcash-api", {
          body: { action: "getLatestBlocks", limit },
        });

        if (error) throw error;
        if (data.blocks && data.blocks.length > 0) return data.blocks;
        throw new Error("No blocks returned from API");
      } catch (error) {
        console.warn(
          "Zcash API failed for blocks, trying Cipherscan fallback:",
          error
        );
        try {
          const infoResponse = await fetch(
            "https://api.mainnet.cipherscan.app/api/info"
          );
          if (!infoResponse.ok) throw new Error("Cipherscan info failed");
          const infoData = await infoResponse.json();
          const latestHeight = parseInt(infoData.height);

          const blocks: Block[] = [];
          for (let i = 0; i < limit; i++) {
            const height = latestHeight - i;
            if (height < 0) break;
            const blockResponse = await fetch(
              `https://api.mainnet.cipherscan.app/api/block/${height}`
            );
            if (blockResponse.ok) {
              const b = await blockResponse.json();
              blocks.push({
                height: parseInt(b.height),
                hash: b.hash,
                version: b.version,
                merkle_root: b.merkle_root,
                timestamp: new Date(Number(b.timestamp) * 1000).toISOString(),
                nonce: b.nonce,
                difficulty: parseFloat(b.difficulty),
                size: b.size,
                tx_count: b.transaction_count,
              });
            }
          }
          return blocks;
        } catch (fallbackError) {
          console.error("Fallback failed:", fallbackError);
          return [];
        }
      }
    },
    []
  );

  const searchBlockchain = useCallback(async (query: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("zcash-api", {
        body: { action: "search", query },
      });

      if (error) throw error;
      if (data.success) return data;
      throw new Error("Search failed");
    } catch (error) {
      console.warn("Search API failed, trying Cipherscan fallback:", error);

      // Try as block height
      if (/^\d+$/.test(query)) {
        try {
          console.log("Trying Cipherscan for block height:", query);
          const response = await fetch(
            `https://api.mainnet.cipherscan.app/api/block/${query}`
          );
          console.log("Cipherscan block response status:", response.status);
          if (response.ok) {
            const b = await response.json();
            console.log("Cipherscan block data:", b);
            return {
              success: true,
              type: "block",
              result: {
                height: parseInt(b.height),
                hash: b.hash,
                version: b.version,
                merkle_root: b.merkle_root,
                timestamp: new Date(Number(b.timestamp) * 1000).toISOString(),
                nonce: b.nonce,
                difficulty: parseFloat(b.difficulty),
                size: b.size,
                tx_count: b.transaction_count,
              },
            };
          }
        } catch (e) {
          console.error("Cipherscan block height fetch failed:", e);
        }
      }

      // Try as block hash
      try {
        console.log("Trying Cipherscan for block hash:", query);
        const response = await fetch(
          `https://api.mainnet.cipherscan.app/api/block/${query}`
        );
        if (response.ok) {
          const b = await response.json();
          console.log("Cipherscan block (by hash) data:", b);
          return {
            success: true,
            type: "block",
            result: {
              height: parseInt(b.height),
              hash: b.hash,
              version: b.version,
              merkle_root: b.merkle_root,
              timestamp: new Date(Number(b.timestamp) * 1000).toISOString(),
              nonce: b.nonce,
              difficulty: parseFloat(b.difficulty),
              size: b.size,
              tx_count: b.transaction_count,
            },
          };
        }
      } catch (e) {
        console.error("Cipherscan block hash fetch failed:", e);
      }

      // Try as transaction hash
      try {
        console.log("Trying Cipherscan for transaction:", query);
        const response = await fetch(
          `https://api.mainnet.cipherscan.app/api/transaction/${query}`
        );
        if (response.ok) {
          const t = await response.json();
          console.log("Cipherscan transaction data:", t);
          return {
            success: true,
            type: "transaction",
            result: {
              txid: t.txid,
              block_height: parseInt(t.block_height),
              version: t.version,
              locktime: parseInt(t.locktime),
              vin: t.inputs,
              vout: t.outputs,
              size: t.size,
              timestamp: new Date(Number(t.block_time) * 1000).toISOString(),
              fee: 0, // Not easily available
            },
          };
        }
      } catch (e) {
        console.error("Cipherscan transaction fetch failed:", e);
      }

      throw error;
    }
  }, []);

  const getBlockchainInfo = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("zcash-api", {
        body: { action: "getBlockchainInfo" },
      });

      if (error) throw error;
      return data.info || null;
    } catch (error) {
      console.error("Error fetching blockchain info:", error);
      // Fallback
      try {
        const response = await fetch(
          "https://api.mainnet.cipherscan.app/api/info"
        );
        if (response.ok) {
          const data = await response.json();
          return {
            blocks: parseInt(data.height),
            difficulty: parseFloat(data.difficulty),
            chain: "main",
          };
        }
      } catch (e) {
        console.error("Fallback failed:", e);
      }
      return null;
    }
  }, []);

  const getMempool = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("zcash-api", {
        body: { action: "mempool" },
      });
      if (error) throw error;
      return data;
    } catch (err) {
      console.error("Mempool fetch failed:", err);
      return { count: 0, transactions: [] };
    }
  }, []);

  const getNetworkStatus = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("zcash-api", {
        body: { action: "network" },
      });
      if (error) throw error;
      // Check if data is valid (not just defaults)
      if (data && data.blockchain && data.blockchain.chain !== "unknown") {
        return data;
      }
      throw new Error("Invalid network data");
    } catch (err) {
      console.warn("Network status fetch failed, trying fallback:", err);
      try {
        const response = await fetch(
          "https://api.mainnet.cipherscan.app/api/info"
        );
        if (response.ok) {
          const data = await response.json();
          return {
            blockchain: {
              chain: "main",
              blocks: parseInt(data.height),
              difficulty: parseFloat(data.difficulty),
              size_on_disk: 0,
            },
            network: {
              version: 0,
              protocolversion: 0,
              connections: 0,
              subversion: "Cipherscan Fallback",
            },
            mempool: { size: 0, bytes: 0, usage: 0 },
            peers: 0,
            peerDetails: [],
          };
        }
      } catch (e) {
        console.error("Fallback failed:", e);
      }
      return null;
    }
  }, []);

  // Add getBlock and getTransaction if they are missing from the hook but used in pages
  // But wait, the hook didn't export them before?
  // Checking previous file content... it didn't export getBlock or getTransaction!
  // But BlockDetails.tsx uses getBlock?
  // Let's check BlockDetails.tsx imports.

  return {
    getLatestBlocks,
    searchBlockchain,
    getBlockchainInfo,
    getMempool,
    getNetworkStatus,
  };
};
