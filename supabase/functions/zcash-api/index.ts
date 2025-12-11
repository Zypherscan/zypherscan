import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Zebra node RPC endpoint
const ZEBRA_RPC_URL = Deno.env.get("VITE_ZEBRA_RPC_URL") || "";

// Helper function to make JSON-RPC calls to Zebra
async function zebraRPC(method: string, params: any[] = []) {
  const response = await fetch(ZEBRA_RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method,
      params,
    }),
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message || "RPC Error");
  }
  return data.result;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, limit, id, txid, query, startHeight, endHeight, network } =
      await req.json();

    // Determine Cipherscan API URL based on network
    const cipherscanBaseUrl =
      network === "testnet"
        ? Deno.env.get("VITE_CIPHERSCAN_TESTNET_API_URL") || ""
        : Deno.env.get("VITE_CIPHERSCAN_MAINNET_API_URL") || ""; // Default to Mainnet

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    switch (action) {
      case "getLatestBlocks": {
        const blockLimit = limit || 10;

        // First try to get from cache
        const { data: cachedBlocks, error: cacheError } = await supabase
          .from("blocks")
          .select("*")
          .order("height", { ascending: false })
          .limit(blockLimit);

        if (cachedBlocks && cachedBlocks.length > 0) {
          return new Response(
            JSON.stringify({ success: true, blocks: cachedBlocks }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        try {
          // Get blockchain info to find latest height
          const blockchainInfo = await zebraRPC("getblockchaininfo");
          const latestHeight = blockchainInfo.blocks;

          const limit = req.limit || 10;
          const blocks = [];
          for (let i = 0; i < limit && latestHeight - i >= 0; i++) {
            const height = latestHeight - i;
            const blockHash = await zebraRPC("getblockhash", [height]);
            const block = await zebraRPC("getblock", [blockHash, 1]);

            blocks.push({
              height: block.height,
              hash: block.hash,
              version: block.version,
              merkle_root: block.merkleroot,
              timestamp: new Date(block.time * 1000).toISOString(),
              nonce: block.nonce,
              difficulty: block.difficulty,
              size: block.size,
              tx_count: block.tx ? block.tx.length : 0,
            });
          }

          if (blocks.length > 0) {
            const { error: insertError } = await supabase
              .from("blocks")
              .upsert(blocks, { onConflict: "height" });

            if (insertError) {
              console.error("Error caching blocks:", insertError);
            }
          }

          return new Response(JSON.stringify({ success: true, blocks }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } catch (error) {
          try {
            const infoResponse = await fetch(`${cipherscanBaseUrl}/info`);
            const infoData = await infoResponse.json();
            const latestHeight = parseInt(infoData.height);

            const blocks = [];
            const limit = req.limit || 10;

            for (let i = 0; i < limit && latestHeight - i >= 0; i++) {
              const height = latestHeight - i;
              const blockResponse = await fetch(
                `${cipherscanBaseUrl}/block/${height}`
              );
              if (blockResponse.ok) {
                const data = await blockResponse.json();
                blocks.push({
                  height: parseInt(data.height),
                  hash: data.hash,
                  timestamp: new Date(
                    Number(data.timestamp) * 1000
                  ).toISOString(),
                  size: data.size,
                  difficulty: parseFloat(data.difficulty),
                  tx_count: data.transaction_count,
                  merkle_root: data.merkle_root,
                  nonce: data.nonce,
                  version: data.version,
                });
              }
            }

            return new Response(JSON.stringify({ success: true, blocks }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          } catch (fallbackError) {
            console.error("Fallback failed:", fallbackError);
            return new Response(
              JSON.stringify({
                success: false,
                error: "Failed to fetch blocks",
              }),
              {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          }
        }
      }

      case "getBlock": {
        const heightOrHash = id;
        if (!heightOrHash) {
          return new Response(
            JSON.stringify({ success: false, error: "Block ID required" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Try cache first
        const { data: cachedBlock } = await supabase
          .from("blocks")
          .select("*")
          .or(`height.eq.${heightOrHash},hash.eq.${heightOrHash}`)
          .maybeSingle();

        if (cachedBlock) {
          return new Response(
            JSON.stringify({ success: true, block: cachedBlock }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        try {
          // Fetch from Zebra
          let blockHash = heightOrHash;
          if (/^\d+$/.test(heightOrHash)) {
            // It's a height, get the hash first
            blockHash = await zebraRPC("getblockhash", [
              parseInt(heightOrHash),
            ]);
          }

          const block = await zebraRPC("getblock", [blockHash, 1]);

          const blockToCache = {
            height: block.height,
            hash: block.hash,
            version: block.version,
            merkle_root: block.merkleroot,
            timestamp: new Date(block.time * 1000).toISOString(),
            nonce: block.nonce,
            difficulty: block.difficulty,
            size: block.size,
            tx_count: block.tx ? block.tx.length : 0,
          };

          // Cache it
          await supabase
            .from("blocks")
            .upsert(blockToCache, { onConflict: "height" });

          return new Response(
            JSON.stringify({ success: true, block: blockToCache }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } catch (error) {
          console.log("Zebra RPC failed for getBlock, trying Scan API");
          try {
            const response = await fetch(
              `${cipherscanBaseUrl}/block/${heightOrHash}`
            );
            if (response.ok) {
              const data = await response.json();
              const blockToCache = {
                height: parseInt(data.height),
                hash: data.hash,
                version: data.version,
                merkle_root: data.merkle_root,
                timestamp: new Date(
                  Number(data.timestamp) * 1000
                ).toISOString(),
                nonce: data.nonce,
                difficulty: parseFloat(data.difficulty),
                size: data.size,
                tx_count: data.transaction_count,
              };

              // Cache it
              await supabase
                .from("blocks")
                .upsert(blockToCache, { onConflict: "height" });

              return new Response(
                JSON.stringify({ success: true, block: blockToCache }),
                {
                  headers: {
                    ...corsHeaders,
                    "Content-Type": "application/json",
                  },
                }
              );
            }
          } catch (e) {
            console.error("Cipherscan fallback failed:", e);
          }

          return new Response(
            JSON.stringify({ success: false, error: "Block not found" }),
            {
              status: 404,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
      }

      case "getTransaction": {
        if (!txid) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Transaction ID required",
            }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Try cache first
        const { data: cachedTx } = await supabase
          .from("transactions")
          .select("*")
          .eq("txid", txid)
          .maybeSingle();

        if (cachedTx) {
          return new Response(
            JSON.stringify({ success: true, transaction: cachedTx }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        try {
          // Fetch from Zebra
          const transaction = await zebraRPC("getrawtransaction", [txid, 1]); // verbosity 1 for JSON

          const txToCache = {
            txid: transaction.txid,
            block_height: transaction.height,
            version: transaction.version,
            locktime: transaction.locktime,
            vin_count: transaction.vin ? transaction.vin.length : 0,
            vout_count: transaction.vout ? transaction.vout.length : 0,
            shielded_inputs: transaction.vShieldedSpend
              ? transaction.vShieldedSpend.length
              : 0,
            shielded_outputs: transaction.vShieldedOutput
              ? transaction.vShieldedOutput.length
              : 0,
            value_balance: transaction.valueBalance || 0,
            timestamp: transaction.time
              ? new Date(transaction.time * 1000).toISOString()
              : null,
          };

          // Cache it
          await supabase
            .from("transactions")
            .upsert(txToCache, { onConflict: "txid" });

          return new Response(
            JSON.stringify({
              success: true,
              transaction: { ...transaction, ...txToCache },
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } catch (error) {
          console.log("Zebra RPC failed for getTransaction, trying Scan API");
          try {
            const response = await fetch(
              `${cipherscanBaseUrl}/transaction/${txid}`
            );
            if (response.ok) {
              const data = await response.json();

              // Map Cipherscan format to Zebra format
              const transaction = {
                txid: data.txid,
                height: parseInt(data.block_height),
                version: data.version,
                locktime: parseInt(data.locktime),
                vin: data.inputs,
                vout: data.outputs,
                size: data.size,
                time: data.block_time,
                // Cipherscan might not provide detailed shielded info in the same structure
                // But we can try to map what we have
                vShieldedSpend: [], // Placeholder
                vShieldedOutput: [], // Placeholder
                valueBalance: 0,
              };

              const txToCache = {
                txid: transaction.txid,
                block_height: transaction.height,
                version: transaction.version,
                locktime: transaction.locktime,
                vin_count: transaction.vin ? transaction.vin.length : 0,
                vout_count: transaction.vout ? transaction.vout.length : 0,
                shielded_inputs: 0,
                shielded_outputs: 0,
                value_balance: 0,
                timestamp: transaction.time
                  ? new Date(transaction.time * 1000).toISOString()
                  : null,
              };

              // Cache it
              await supabase
                .from("transactions")
                .upsert(txToCache, { onConflict: "txid" });

              return new Response(
                JSON.stringify({
                  success: true,
                  transaction: { ...transaction, ...txToCache },
                }),
                {
                  headers: {
                    ...corsHeaders,
                    "Content-Type": "application/json",
                  },
                }
              );
            }
          } catch (e) {
            console.error("Cipherscan fallback failed:", e);
          }

          return new Response(
            JSON.stringify({ success: false, error: "Transaction not found" }),
            {
              status: 404,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
      }

      case "getRawTransaction": {
        if (!txid) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Transaction ID required",
            }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        try {
          // Fetch raw transaction hex from Zebra (verbosity 0 for hex)
          const txHex = await zebraRPC("getrawtransaction", [txid, 0]);

          return new Response(JSON.stringify({ success: true, hex: txHex }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } catch (error) {
          console.log(
            "Zebra RPC failed for getRawTransaction, trying Scan API"
          );

          // Try Scan API fallback
          try {
            const response = await fetch(
              `${cipherscanBaseUrl}/transaction/${txid}`
            );
            if (response.ok) {
              const data = await response.json();
              if (data.hex) {
                return new Response(
                  JSON.stringify({ success: true, hex: data.hex }),
                  {
                    headers: {
                      ...corsHeaders,
                      "Content-Type": "application/json",
                    },
                  }
                );
              }
            }
          } catch (e) {
            console.error("Cipherscan fallback failed:", e);
          }

          return new Response(
            JSON.stringify({
              success: false,
              error: "Transaction hex not available",
            }),
            {
              status: 404,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
      }

      case "search": {
        if (!query) {
          return new Response(
            JSON.stringify({ success: false, error: "Search query required" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Check if it's a block height (number)
        if (/^\d+$/.test(query)) {
          try {
            const blockHash = await zebraRPC("getblockhash", [parseInt(query)]);
            const block = await zebraRPC("getblock", [blockHash, 1]);
            const mappedBlock = {
              height: block.height,
              hash: block.hash,
              version: block.version,
              merkle_root: block.merkleroot,
              timestamp: new Date(block.time * 1000).toISOString(),
              nonce: block.nonce,
              difficulty: block.difficulty,
              size: block.size,
              tx_count: block.tx ? block.tx.length : 0,
              tx: block.tx,
              previousblockhash: block.previousblockhash,
              nextblockhash: block.nextblockhash,
              confirmations: block.confirmations,
            };
            return new Response(
              JSON.stringify({
                success: true,
                type: "block",
                result: mappedBlock,
              }),
              {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          } catch (e) {
            console.log("Zebra RPC failed for height, trying Scan API");
            try {
              const response = await fetch(
                `${cipherscanBaseUrl}/block/${query}`
              );
              if (response.ok) {
                const data = await response.json();
                const block = {
                  height: parseInt(data.height),
                  hash: data.hash,
                  timestamp: new Date(
                    Number(data.timestamp) * 1000
                  ).toISOString(),
                  size: data.size,
                  difficulty: parseFloat(data.difficulty),
                  tx_count: data.transaction_count,
                  tx: data.transactions.map((t: any) => t.txid),
                  previousblockhash: data.previous_block_hash,
                  nextblockhash: data.next_block_hash,
                  merkle_root: data.merkle_root,
                  nonce: data.nonce,
                  version: data.version,
                  confirmations: data.confirmations,
                };
                return new Response(
                  JSON.stringify({
                    success: true,
                    type: "block",
                    result: block,
                  }),
                  {
                    headers: {
                      ...corsHeaders,
                      "Content-Type": "application/json",
                    },
                  }
                );
              }
            } catch (err) {
              console.log("Scan API failed:", err);
            }
          }
        }

        // Try as block hash (64 char hex)
        if (/^[0-9a-fA-F]{64}$/.test(query)) {
          try {
            const block = await zebraRPC("getblock", [query, 1]);
            const mappedBlock = {
              height: block.height,
              hash: block.hash,
              version: block.version,
              merkle_root: block.merkleroot,
              timestamp: new Date(block.time * 1000).toISOString(),
              nonce: block.nonce,
              difficulty: block.difficulty,
              size: block.size,
              tx_count: block.tx ? block.tx.length : 0,
              tx: block.tx,
              previousblockhash: block.previousblockhash,
              nextblockhash: block.nextblockhash,
              confirmations: block.confirmations,
            };
            return new Response(
              JSON.stringify({
                success: true,
                type: "block",
                result: mappedBlock,
              }),
              {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          } catch (e) {
            console.log("Zebra RPC failed for hash, trying Scan API");
            try {
              const response = await fetch(
                `${cipherscanBaseUrl}/block/${query}`
              );
              if (response.ok) {
                const data = await response.json();
                const block = {
                  height: parseInt(data.height),
                  hash: data.hash,
                  timestamp: new Date(
                    Number(data.timestamp) * 1000
                  ).toISOString(),
                  size: data.size,
                  difficulty: parseFloat(data.difficulty),
                  tx_count: data.transaction_count,
                  tx: data.transactions.map((t: any) => t.txid),
                  previousblockhash: data.previous_block_hash,
                  nextblockhash: data.next_block_hash,
                  merkle_root: data.merkle_root,
                  nonce: data.nonce,
                  version: data.version,
                  confirmations: data.confirmations,
                };
                return new Response(
                  JSON.stringify({
                    success: true,
                    type: "block",
                    result: block,
                  }),
                  {
                    headers: {
                      ...corsHeaders,
                      "Content-Type": "application/json",
                    },
                  }
                );
              }
            } catch (err) {
              console.log("Scan API failed:", err);
            }
          }

          // Try as transaction hash
          try {
            const transaction = await zebraRPC("getrawtransaction", [query, 1]);
            return new Response(
              JSON.stringify({
                success: true,
                type: "transaction",
                result: transaction,
              }),
              {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          } catch (e) {
            console.log("Not a valid transaction hash");
            // Fallback for transaction
            try {
              const response = await fetch(
                `${cipherscanBaseUrl}/transaction/${query}`
              );
              if (response.ok) {
                const data = await response.json();
                // Map Cipherscan tx to Zebra format if needed, or just return as is
                // Cipherscan returns full tx details
                return new Response(
                  JSON.stringify({
                    success: true,
                    type: "transaction",
                    result: {
                      txid: data.txid,
                      height: parseInt(data.block_height),
                      time: data.block_time,
                      size: data.size,
                      version: data.version,
                      locktime: parseInt(data.locktime),
                      vin: data.inputs,
                      vout: data.outputs,
                      // Add other fields as needed
                    },
                  }),
                  {
                    headers: {
                      ...corsHeaders,
                      "Content-Type": "application/json",
                    },
                  }
                );
              }
            } catch (err) {
              console.log("Scan API failed for tx:", err);
            }
          }
        }

        return new Response(
          JSON.stringify({ success: false, error: "No results found" }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      case "scan": {
        if (startHeight === undefined || endHeight === undefined) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "startHeight and endHeight required",
            }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        const response = await fetch(`${cipherscanBaseUrl}/lightwalletd/scan`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ startHeight, endHeight }),
        });

        if (!response.ok) {
          throw new Error(`Upstream API error: ${response.status}`);
        }

        const data = await response.json();

        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "mempool": {
        try {
          // 1. Get all txids
          const txids = await zebraRPC("getrawmempool", []);

          // 2. Limit to 20 for performance
          const recentTxids = txids.slice(0, 20);

          // 3. Fetch details for each
          const transactions = await Promise.all(
            recentTxids.map(async (txid: string) => {
              try {
                const tx = await zebraRPC("getrawtransaction", [txid, 1]);

                // Determine type
                const hasShielded =
                  (tx.vShieldedSpend && tx.vShieldedSpend.length > 0) ||
                  (tx.vShieldedOutput && tx.vShieldedOutput.length > 0) ||
                  (tx.vJoinSplit && tx.vJoinSplit.length > 0) ||
                  (tx.orchard &&
                    tx.orchard.actions &&
                    tx.orchard.actions.length > 0);

                const hasTransparent =
                  (tx.vin && tx.vin.length > 0 && !tx.vin[0].coinbase) ||
                  (tx.vout && tx.vout.length > 0);

                let type = "transparent";
                if (hasShielded && hasTransparent) type = "mixed";
                else if (hasShielded) type = "shielded";

                return {
                  txid: tx.txid,
                  size: tx.size,
                  time: tx.time || Math.floor(Date.now() / 1000),
                  type,
                  fee: 0, // TODO: Calculate fee if possible
                  version: tx.version,
                };
              } catch (e) {
                return null;
              }
            })
          );

          return new Response(
            JSON.stringify({
              count: txids.length,
              transactions: transactions.filter((t) => t !== null),
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } catch (error) {
          console.log("Zebra RPC failed for mempool, returning empty");
          // Return empty mempool instead of error to prevent UI crash
          return new Response(
            JSON.stringify({
              count: 0,
              transactions: [],
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
      case "network": {
        try {
          const getSafe = async (method: string) => {
            try {
              return await zebraRPC(method, []);
            } catch (e) {
              console.error(`Failed to fetch ${method}:`, e);
              return null;
            }
          };

          const [blockchainInfo, networkInfo, mempoolInfo, peerInfo] =
            await Promise.all([
              getSafe("getblockchaininfo"),
              getSafe("getnetworkinfo"),
              getSafe("getmempoolinfo"),
              getSafe("getpeerinfo"),
            ]);

          // If blockchainInfo is null, try Cipherscan
          let finalBlockchainInfo = blockchainInfo;
          if (!finalBlockchainInfo) {
            try {
              const response = await fetch(`${cipherscanBaseUrl}/info`);
              if (response.ok) {
                const data = await response.json();
                finalBlockchainInfo = {
                  chain: "main",
                  blocks: parseInt(data.height),
                  difficulty: parseFloat(data.difficulty),
                  size_on_disk: 0, // Not available
                };
              }
            } catch (e) {
              console.error("Cipherscan fallback failed:", e);
            }
          }

          return new Response(
            JSON.stringify({
              blockchain: finalBlockchainInfo || {
                chain: "unknown",
                blocks: 0,
                difficulty: 0,
                size_on_disk: 0,
              },
              network: networkInfo || {
                version: 0,
                protocolversion: 0,
                connections: 0,
                subversion: "unknown",
              },
              mempool: mempoolInfo || { size: 0, bytes: 0, usage: 0 },
              peers: peerInfo ? peerInfo.length : 0,
              peerDetails: peerInfo ? peerInfo.slice(0, 10) : [],
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } catch (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      case "getBlockchainInfo": {
        try {
          const info = await zebraRPC("getblockchaininfo");
          return new Response(JSON.stringify({ success: true, info }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } catch (e) {
          console.log("Zebra RPC failed, trying Scan API");
          const response = await fetch(`${cipherscanBaseUrl}/info`);
          const data = await response.json();
          return new Response(
            JSON.stringify({
              success: true,
              info: { blocks: parseInt(data.height) },
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: "Invalid action" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
    }
  } catch (error) {
    console.error("Error in zcash-api function:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
