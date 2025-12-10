import { useCallback } from "react";

// Types for API responses
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
  tx?: string[];
}

export interface ShieldedTransaction {
  txid: string;
  block_height: number;
  timestamp: string;
  pool: string;
  type: string;
  fee?: number;
  value?: number;
}

// Helper to normalize transaction IDs from various API response formats
const normalizeTxIds = (blockData: any): string[] => {
  const raw = blockData.tx || blockData.transactions;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item: any) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object" && item.txid) return item.txid;
      return null;
    })
    .filter((id): id is string => !!id);
};

// Helper to normalize Cipherscan transaction data to standard RPC format
const normalizeTransaction = (tx: any) => {
  const normalized = { ...tx };

  // Normalize inputs (vin)
  if (tx.inputs && !tx.vin) {
    normalized.vin = tx.inputs.map((input: any) => ({
      txid: input.prevout_hash || input.txid, // Handle varying names
      vout: input.prevout_n !== undefined ? input.prevout_n : input.vout,
      scriptSig: input.scriptSig,
      sequence: input.sequence,
      // If it's a coinbase/empty input from indexer
      coinbase: input.coinbase,
      value: input.value ? parseInt(input.value) / 100000000 : undefined,
    }));
  }

  // Normalize outputs (vout)
  if (tx.outputs && !tx.vout) {
    normalized.vout = tx.outputs.map((output: any) => ({
      value: output.valueZat
        ? output.valueZat / 100000000
        : Number(output.value) / 100000000, // Handle satoshis string
      n: output.vout_index !== undefined ? output.vout_index : output.n,
      scriptPubKey: {
        addresses: output.address ? [output.address] : undefined,
        type: output.type || "pubkeyhash",
        asm: output.script || "",
      },
    }));
  }

  // Normalize timestamp
  if (!normalized.time && normalized.block_time) {
    normalized.time = normalized.block_time;
  }
  if (!normalized.time && normalized.timestamp) {
    normalized.time = normalized.timestamp;
  }

  return normalized;
};

export interface NetworkStats {
  height: number;
  difficulty: number;
  hashrate: number;
  mempool_size: number;
  mempool_bytes: number;
  supply: {
    total: number;
    transparent: number;
    sapling: number;
    orchard: number;
    sprout: number;
    lockbox?: number;
    totalShielded: number;
    shieldedPercentage: number;
    activeUpgrade?: string;
  };
  circulating_supply?: number;
  size_on_disk: number;
  peers: number;
  protocol_version: number;
  subversion: string;
  mining: {
    avgBlockTime: number;
    blocks24h: number;
    blockReward: number;
    dailyRevenue: number;
  };
  blockchain: {
    tx24h: number;
    latestBlockTime: number;
    syncProgress: number;
  };
}

export interface ZecPrice {
  usd: number;
  usd_24h_change: number;
}

const ZEBRA_RPC_URL = "/zebra/";
const CIPHERSCAN_API_BASE = "/api";

export const useZcashAPI = () => {
  // Helper for fetching from Cipherscan
  const fetchCipherscan = async (endpoint: string) => {
    try {
      const response = await fetch(`${CIPHERSCAN_API_BASE}${endpoint}`, {
        headers: {
          Accept: "application/json",
        },
      });
      // Return null for 404 or 400 (Bad Request) - let caller try other endpoints
      if (response.status === 404 || response.status === 400) return null;
      if (!response.ok) {
        throw new Error(`Cipherscan API error: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Failed to fetch from Cipherscan (${endpoint}):`, error);
      return null;
    }
  };

  // Helper for fetching from Zebra RPC (Fallback)
  const fetchRPC = async (method: string, params: any[] = []) => {
    try {
      const response = await fetch(ZEBRA_RPC_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method,
          params,
          id: Date.now(),
        }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      return data.result;
    } catch (error) {
      console.warn(`RPC call failed (${method}):`, error);
      return null;
    }
  };

  const getNetworkStatus =
    useCallback(async (): Promise<NetworkStats | null> => {
      const data = await fetchCipherscan("/network/stats");
      // Map new Cipherscan structure

      const basicStats = data
        ? {
            height: data.network?.height || data.blockchain?.height || 0,
            difficulty: data.mining?.difficulty || 0,
            hashrate: data.mining?.networkHashrateRaw || 0,
            size_on_disk: data.blockchain?.sizeBytes || 0,
            peers: data.network?.peers || 0,
            protocol_version: data.network?.protocolVersion || 0,
            subversion: data.network?.subversion || "",
            supply: {
              total: data.supply?.chainSupply || 0,
              transparent: data.supply?.transparent || 0,
              sapling: data.supply?.sapling || 0,
              orchard: data.supply?.orchard || 0,
              sprout: data.supply?.sprout || 0,
              lockbox: data.supply?.lockbox || 0,
              totalShielded: data.supply?.totalShielded || 0,
              shieldedPercentage: data.supply?.shieldedPercentage || 0,
              activeUpgrade: data.supply?.activeUpgrade || "NU6",
            },
            circulating_supply: data.supply?.chainSupply,
            mempool_size: 0,
            mempool_bytes: 0,
            mining: {
              avgBlockTime: data.mining?.avgBlockTime || 75,
              blocks24h: data.mining?.blocks24h || 0,
              blockReward: data.mining?.blockReward || 3.125,
              dailyRevenue: data.mining?.dailyRevenue || 0,
            },
            blockchain: {
              tx24h: data.blockchain?.tx24h || 0,
              latestBlockTime:
                data.blockchain?.latestBlockTime || Date.now() / 1000,
              syncProgress: data.blockchain?.syncProgress || 100,
            },
          }
        : {
            height: 0,
            difficulty: 0,
            hashrate: 0,
            mempool_size: 0,
            mempool_bytes: 0,
            size_on_disk: 0,
            peers: 0,
            protocol_version: 0,
            subversion: "",
            supply: {
              total: 0,
              transparent: 0,
              sapling: 0,
              orchard: 0,
              sprout: 0,
              lockbox: 0,
              totalShielded: 0,
              shieldedPercentage: 0,
              activeUpgrade: "",
            },
            circulating_supply: 0,
            mining: {
              avgBlockTime: 0,
              blocks24h: 0,
              blockReward: 0,
              dailyRevenue: 0,
            },
            blockchain: { tx24h: 0, latestBlockTime: 0, syncProgress: 0 },
          };

      // Try to get live mempool info too since /network/stats might miss it
      try {
        const mempoolResp = await fetchCipherscan("/mempool");
        if (mempoolResp && mempoolResp.stats) {
          return {
            ...basicStats,
            mempool_size: mempoolResp.stats.total || mempoolResp.count || 0,
            mempool_bytes: mempoolResp.stats.bytes || 0,
          };
        } else if (mempoolResp && Array.isArray(mempoolResp.transactions)) {
          return {
            ...basicStats,
            mempool_size: mempoolResp.transactions.length,
          };
        }
      } catch (e) {
        // ignore mempool fetch fail
      }

      return basicStats;
    }, []);

  const getLatestBlocks = useCallback(
    async (limit: number = 10): Promise<Block[]> => {
      try {
        const stats = await getNetworkStatus();
        if (!stats || !stats.height) return [];

        const latestHeight = stats.height;
        const promises = [];

        for (let i = 0; i < limit; i++) {
          const height = latestHeight - i;
          if (height < 0) break;
          promises.push(fetchCipherscan(`/block/${height}`));
        }

        const results = await Promise.allSettled(promises);
        const blocks: Block[] = [];

        for (const result of results) {
          if (result.status === "fulfilled" && result.value) {
            const b = result.value;
            // Block data from Cipherscan seems flat based on /block/{id} endpoint check locally if possible
            // Assuming standard fields
            if (b && b.height) {
              blocks.push({
                height: parseInt(b.height),
                hash: b.hash,
                version: b.version,
                merkle_root: b.merkle_root,
                timestamp: new Date(Number(b.timestamp) * 1000).toISOString(),
                nonce: b.nonce,
                difficulty: parseFloat(b.difficulty),
                size: b.size,
                tx_count: b.transaction_count || (b.tx ? b.tx.length : 0),
                tx: normalizeTxIds(b), // Include transaction IDs
              });
            }
          }
        }
        return blocks;
      } catch (error) {
        console.error("Failed to fetch latest blocks:", error);
        return [];
      }
    },
    [getNetworkStatus]
  );

  const getRecentShieldedTransactions = useCallback(
    async (limit: number = 10) => {
      // Preferred: Orchard fully shielded
      const endpoint = `/tx/shielded?pool=orchard&type=fully-shielded&limit=${limit}`;
      let data = await fetchCipherscan(endpoint);

      // Cipherscan returns { transactions: [...] }
      if (data && data.transactions) {
        return data.transactions;
      }

      // Fallback or retry
      if (!data || !data.transactions || data.transactions.length === 0) {
        data = await fetchCipherscan(`/tx/shielded?limit=${limit}`);
        if (data && data.transactions) return data.transactions;
      }

      return [];
    },
    []
  );

  const searchBlockchain = useCallback(async (query: string) => {
    // 1. Try as Block Height
    if (/^\d+$/.test(query)) {
      const b = await fetchCipherscan(`/block/${query}`);
      if (b) {
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
            previousblockhash: b.previousblockhash,
            nextblockhash: b.nextblockhash,
            bits: b.bits,
            chainwork: b.chainwork,
            finalsaplingroot: b.finalsaplingroot || b.final_sapling_root,
            tx: b.tx || b.transactions || normalizeTxIds(b),
            transactions: b.transactions || b.tx,
          },
        };
      }
    }

    // 2. Try as Block Hash or Transaction ID (both 64 chars)
    if (query.length === 64) {
      // A. Try Block Hash
      const b = await fetchCipherscan(`/block/${query}`);
      // Validate that the returned block hash actually matches the query (Cipherscan API might return latest block for invalid hash)
      if (b && b.hash && b.hash.toLowerCase() === query.toLowerCase()) {
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
            previousblockhash: b.previousblockhash,
            nextblockhash: b.nextblockhash,
            bits: b.bits,
            chainwork: b.chainwork,
            finalsaplingroot: b.finalsaplingroot || b.final_sapling_root,
            tx: b.tx || b.transactions || normalizeTxIds(b),
            transactions: b.transactions || b.tx,
          },
        };
      }

      // B. Try Transaction ID (Preferred Cipherscan)
      let t = await fetchCipherscan(`/tx/${query}`);

      // Fallback: Zebra RPC for Mempool transactions not yet in Cipherscan
      if (!t) {
        console.log("Transaction not in Scan API, trying Zebra RPC...");
        try {
          t = await fetchRPC("getrawtransaction", [query, 1]);
        } catch (e) {
          console.warn("Zebra RPC also failed", e);
        }
      }

      if (t) {
        const tNormalized = normalizeTransaction(t);
        return {
          success: true,
          type: "transaction",
          result: {
            // Pass through all original fields from Cipherscan API
            ...t,
            // Also include normalized fields for backwards compatibility
            txid: tNormalized.txid,
            blockheight: tNormalized.height
              ? parseInt(tNormalized.height)
              : tNormalized.blockheight || undefined, // Handle varying formats
            height: tNormalized.height
              ? parseInt(tNormalized.height)
              : tNormalized.blockheight || undefined,
            blockhash: tNormalized.block_hash || tNormalized.blockhash, // normalize
            version: tNormalized.version,
            locktime: tNormalized.locktime,
            vin: tNormalized.vin,
            vout: tNormalized.vout,
            size: tNormalized.size,
            timestamp: tNormalized.time
              ? new Date(Number(tNormalized.time) * 1000).toISOString()
              : new Date().toISOString(),
            fee: tNormalized.fee,
            value_balance:
              tNormalized.value_balance || tNormalized.valueBalance,
            vshielded_spend:
              tNormalized.shielded_spends || tNormalized.vShieldedSpend,
            vshielded_output:
              tNormalized.shielded_outputs || tNormalized.vShieldedOutput,
            orchard: tNormalized.orchard || { actions: [] },
            hex: tNormalized.hex,
          },
        };
      }
    }

    return { success: false, error: "Not found" };
  }, []);

  const getMempool = useCallback(async () => {
    const data = await fetchCipherscan("/mempool");

    // Cipherscan response is object with transactions array
    if (data && Array.isArray(data.transactions)) {
      return {
        count: data.count || data.transactions.length,
        transactions: data.transactions,
      };
    }

    // Legacy fallback or weird formats
    if (Array.isArray(data)) {
      return { count: data.length, transactions: data };
    }

    return { count: 0, transactions: [] };
  }, []);

  const getPrivacyStats = useCallback(async () => {
    return await fetchCipherscan("/privacy-stats");
  }, []);

  const getZecPrice = useCallback(async (): Promise<ZecPrice | null> => {
    try {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=zcash&vs_currencies=usd&include_24hr_change=true"
      );
      if (!response.ok) throw new Error("CoinGecko API error");
      const data = await response.json();
      return {
        usd: data.zcash.usd,
        usd_24h_change: data.zcash.usd_24h_change,
      };
    } catch (err) {
      console.error("ZEC price fetch failed:", err);
      return null;
    }
  }, []);

  const getBlockchainInfo = getNetworkStatus;

  return {
    getLatestBlocks,
    searchBlockchain,
    getBlockchainInfo,
    getMempool,
    getNetworkStatus,
    getRecentShieldedTransactions,
    getPrivacyStats,
    getZecPrice,
  };
};
