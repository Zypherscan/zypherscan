import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Zcash blockchain API - using public Zcash block explorer API
const ZCASH_API_BASE = "https://api.zcha.in/v2/mainnet";

interface BlockResponse {
  height: number;
  hash: string;
  version: number;
  merkleRoot: string;
  timestamp: number;
  nonce: string;
  difficulty: number;
  size: number;
  transactions: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace('/zcash-api/', '');
    const action = url.searchParams.get('action');
    
    console.log('Zcash API Request:', { path, action });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    switch (action) {
      case 'getLatestBlocks': {
        const limit = parseInt(url.searchParams.get('limit') || '10');
        
        // First try to get from cache
        const { data: cachedBlocks, error: cacheError } = await supabase
          .from('blocks')
          .select('*')
          .order('height', { ascending: false })
          .limit(limit);

        if (cachedBlocks && cachedBlocks.length > 0) {
          console.log('Returning cached blocks:', cachedBlocks.length);
          return new Response(
            JSON.stringify({ success: true, blocks: cachedBlocks }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // If no cache, fetch from API and cache it
        const response = await fetch(`${ZCASH_API_BASE}/blocks?limit=${limit}`);
        const blocks = await response.json();
        
        console.log('Fetched blocks from API:', blocks.length);
        
        // Cache blocks in database
        if (blocks && Array.isArray(blocks)) {
          const blocksToInsert = blocks.map((block: any) => ({
            height: block.height,
            hash: block.hash,
            version: block.version,
            merkle_root: block.merkleroot,
            timestamp: new Date(block.timestamp * 1000).toISOString(),
            nonce: block.nonce,
            difficulty: block.difficulty,
            size: block.size,
            tx_count: block.tx ? block.tx.length : 0,
          }));

          const { error: insertError } = await supabase
            .from('blocks')
            .upsert(blocksToInsert, { onConflict: 'height' });

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
        const heightOrHash = url.searchParams.get('id');
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
          .single();

        if (cachedBlock) {
          console.log('Returning cached block:', cachedBlock.height);
          return new Response(
            JSON.stringify({ success: true, block: cachedBlock }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Fetch from API
        const response = await fetch(`${ZCASH_API_BASE}/blocks/${heightOrHash}`);
        const block = await response.json();

        // Cache it
        if (block) {
          const blockToInsert = {
            height: block.height,
            hash: block.hash,
            version: block.version,
            merkle_root: block.merkleroot,
            timestamp: new Date(block.timestamp * 1000).toISOString(),
            nonce: block.nonce,
            difficulty: block.difficulty,
            size: block.size,
            tx_count: block.tx ? block.tx.length : 0,
          };

          await supabase.from('blocks').upsert(blockToInsert, { onConflict: 'height' });
        }

        return new Response(
          JSON.stringify({ success: true, block }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'getTransaction': {
        const txid = url.searchParams.get('txid');
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
          .single();

        if (cachedTx) {
          console.log('Returning cached transaction:', txid);
          return new Response(
            JSON.stringify({ success: true, transaction: cachedTx }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Fetch from API
        const response = await fetch(`${ZCASH_API_BASE}/transactions/${txid}`);
        const transaction = await response.json();

        // Cache it
        if (transaction) {
          const txToInsert = {
            txid: transaction.hash,
            block_height: transaction.blockheight,
            version: transaction.version,
            locktime: transaction.locktime,
            vin_count: transaction.vin ? transaction.vin.length : 0,
            vout_count: transaction.vout ? transaction.vout.length : 0,
            shielded_inputs: transaction.vShieldedSpend ? transaction.vShieldedSpend.length : 0,
            shielded_outputs: transaction.vShieldedOutput ? transaction.vShieldedOutput.length : 0,
            value_balance: transaction.valueBalance || 0,
            timestamp: transaction.timestamp ? new Date(transaction.timestamp * 1000).toISOString() : null,
          };

          await supabase.from('transactions').upsert(txToInsert, { onConflict: 'txid' });
        }

        return new Response(
          JSON.stringify({ success: true, transaction }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'search': {
        const query = url.searchParams.get('query');
        if (!query) {
          return new Response(
            JSON.stringify({ success: false, error: 'Search query required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('Searching for:', query);

        // Check if it's a block height (number)
        if (/^\d+$/.test(query)) {
          const response = await fetch(`${ZCASH_API_BASE}/blocks/${query}`);
          if (response.ok) {
            const block = await response.json();
            return new Response(
              JSON.stringify({ success: true, type: 'block', result: block }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }

        // Try as transaction hash
        const txResponse = await fetch(`${ZCASH_API_BASE}/transactions/${query}`);
        if (txResponse.ok) {
          const transaction = await txResponse.json();
          return new Response(
            JSON.stringify({ success: true, type: 'transaction', result: transaction }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Try as block hash
        const blockResponse = await fetch(`${ZCASH_API_BASE}/blocks/${query}`);
        if (blockResponse.ok) {
          const block = await blockResponse.json();
          return new Response(
            JSON.stringify({ success: true, type: 'block', result: block }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: false, error: 'No results found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
