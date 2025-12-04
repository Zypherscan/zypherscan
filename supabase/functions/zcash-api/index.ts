import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Zebra node RPC endpoint
const ZEBRA_RPC_URL = "https://zebra.up.railway.app";

// Helper function to make JSON-RPC calls to Zebra
async function zebraRPC(method: string, params: any[] = []) {
  console.log(`Zebra RPC call: ${method}`, params);
  const response = await fetch(ZEBRA_RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method,
      params,
    }),
  });
  
  const data = await response.json();
  console.log(`Zebra RPC response for ${method}:`, JSON.stringify(data).slice(0, 500));
  
  if (data.error) {
    throw new Error(data.error.message || 'RPC Error');
  }
  return data.result;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, limit, id, txid, query } = await req.json();
    
    console.log('Zcash API Request:', { action, limit, id, txid, query });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    switch (action) {
      case 'getLatestBlocks': {
        const blockLimit = limit || 10;
        
        // First try to get from cache
        const { data: cachedBlocks, error: cacheError } = await supabase
          .from('blocks')
          .select('*')
          .order('height', { ascending: false })
          .limit(blockLimit);

        if (cachedBlocks && cachedBlocks.length > 0) {
          console.log('Returning cached blocks:', cachedBlocks.length);
          return new Response(
            JSON.stringify({ success: true, blocks: cachedBlocks }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get blockchain info to find latest height
        const blockchainInfo = await zebraRPC('getblockchaininfo');
        const latestHeight = blockchainInfo.blocks;
        
        console.log('Latest block height:', latestHeight);

        // Fetch the latest blocks
        const blocks = [];
        for (let i = 0; i < blockLimit && latestHeight - i >= 0; i++) {
          const height = latestHeight - i;
          const blockHash = await zebraRPC('getblockhash', [height]);
          const block = await zebraRPC('getblock', [blockHash, 1]); // verbosity 1 for JSON
          
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
        
        console.log('Fetched blocks from Zebra:', blocks.length);
        
        // Cache blocks in database
        if (blocks.length > 0) {
          const { error: insertError } = await supabase
            .from('blocks')
            .upsert(blocks, { onConflict: 'height' });

          if (insertError) {
            console.error('Error caching blocks:', insertError);
          } else {
            console.log('Cached blocks successfully');
          }
        }

        return new Response(
          JSON.stringify({ success: true, blocks }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'getBlock': {
        const heightOrHash = id;
        if (!heightOrHash) {
          return new Response(
            JSON.stringify({ success: false, error: 'Block ID required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Try cache first
        const { data: cachedBlock } = await supabase
          .from('blocks')
          .select('*')
          .or(`height.eq.${heightOrHash},hash.eq.${heightOrHash}`)
          .maybeSingle();

        if (cachedBlock) {
          console.log('Returning cached block:', cachedBlock.height);
          return new Response(
            JSON.stringify({ success: true, block: cachedBlock }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Fetch from Zebra
        let blockHash = heightOrHash;
        if (/^\d+$/.test(heightOrHash)) {
          // It's a height, get the hash first
          blockHash = await zebraRPC('getblockhash', [parseInt(heightOrHash)]);
        }
        
        const block = await zebraRPC('getblock', [blockHash, 1]);

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
        await supabase.from('blocks').upsert(blockToCache, { onConflict: 'height' });

        return new Response(
          JSON.stringify({ success: true, block: blockToCache }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'getTransaction': {
        if (!txid) {
          return new Response(
            JSON.stringify({ success: false, error: 'Transaction ID required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Try cache first
        const { data: cachedTx } = await supabase
          .from('transactions')
          .select('*')
          .eq('txid', txid)
          .maybeSingle();

        if (cachedTx) {
          console.log('Returning cached transaction:', txid);
          return new Response(
            JSON.stringify({ success: true, transaction: cachedTx }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Fetch from Zebra
        const transaction = await zebraRPC('getrawtransaction', [txid, 1]); // verbosity 1 for JSON

        const txToCache = {
          txid: transaction.txid,
          block_height: transaction.height,
          version: transaction.version,
          locktime: transaction.locktime,
          vin_count: transaction.vin ? transaction.vin.length : 0,
          vout_count: transaction.vout ? transaction.vout.length : 0,
          shielded_inputs: transaction.vShieldedSpend ? transaction.vShieldedSpend.length : 0,
          shielded_outputs: transaction.vShieldedOutput ? transaction.vShieldedOutput.length : 0,
          value_balance: transaction.valueBalance || 0,
          timestamp: transaction.time ? new Date(transaction.time * 1000).toISOString() : null,
        };

        // Cache it
        await supabase.from('transactions').upsert(txToCache, { onConflict: 'txid' });

        return new Response(
          JSON.stringify({ success: true, transaction: { ...transaction, ...txToCache } }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'search': {
        if (!query) {
          return new Response(
            JSON.stringify({ success: false, error: 'Search query required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('Searching for:', query);

        // Check if it's a block height (number)
        if (/^\d+$/.test(query)) {
          try {
            const blockHash = await zebraRPC('getblockhash', [parseInt(query)]);
            const block = await zebraRPC('getblock', [blockHash, 1]);
            return new Response(
              JSON.stringify({ success: true, type: 'block', result: block }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          } catch (e) {
            console.log('Not a valid block height');
          }
        }

        // Try as block hash (64 char hex)
        if (/^[0-9a-fA-F]{64}$/.test(query)) {
          try {
            const block = await zebraRPC('getblock', [query, 1]);
            return new Response(
              JSON.stringify({ success: true, type: 'block', result: block }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          } catch (e) {
            console.log('Not a valid block hash, trying as transaction');
          }

          // Try as transaction hash
          try {
            const transaction = await zebraRPC('getrawtransaction', [query, 1]);
            return new Response(
              JSON.stringify({ success: true, type: 'transaction', result: transaction }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          } catch (e) {
            console.log('Not a valid transaction hash');
          }
        }

        return new Response(
          JSON.stringify({ success: false, error: 'No results found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'getBlockchainInfo': {
        const info = await zebraRPC('getblockchaininfo');
        return new Response(
          JSON.stringify({ success: true, info }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('Error in zcash-api function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
