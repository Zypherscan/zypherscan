// WASM Loader for Zcash memo decryption
// This wrapper handles dynamic loading of the WASM module

let wasmModule: any = null;
let wasmInitialized = false;

export interface DecryptedOutput {
  memo: string;
  amount: number; // Amount in ZEC
}

export interface DecryptedOutputWithAccount {
  memo: string;
  amount: number;
  account_index: number;
  pool: string; // "orchard" or "sapling"
}

export interface ZcashWasm {
  test_wasm: () => string;
  detect_key_type: (viewingKey: string) => string;
  decrypt_memo: (txHex: string, viewingKey: string) => string;
  decrypt_with_multi_account: (
    txHex: string,
    seedPhrase: string,
    network: string
  ) => string;
  decrypt_compact_output: (
    nullifierHex: string,
    cmxHex: string,
    ephemeralKeyHex: string,
    ciphertextHex: string,
    viewingKey: string
  ) => string;
  batch_filter_compact_outputs: (
    outputsJson: string,
    viewingKey: string
  ) => string;
  // Seed phrase derivation functions
  derive_ufvk_from_seed: (
    seedPhrase: string,
    accountIndex: number,
    network: string
  ) => string;
  validate_seed_phrase: (seedPhrase: string) => boolean;
  get_seed_word_count: (seedPhrase: string) => number;
  derive_spending_key_from_seed: (
    seedPhrase: string,
    accountIndex: number
  ) => string;
}

/**
 * Load and initialize the WASM module
 * @returns Promise<ZcashWasm> - The initialized WASM module
 */
export async function loadWasm(): Promise<ZcashWasm> {
  if (wasmModule && wasmInitialized) {
    return wasmModule;
  }

  try {
    // Use dynamic import to load the wasm-bindgen generated JS
    const wasmInit = await import("./wasm/zcash_wasm.js");

    // Fetch the WASM file and initialize
    const wasmUrl = "/wasm/zcash_wasm_bg.wasm";
    const response = await fetch(wasmUrl);
    const wasmBytes = await response.arrayBuffer();

    // Initialize with the fetched bytes
    await wasmInit.default(wasmBytes);

    // Extract the exported functions
    wasmModule = {
      test_wasm: wasmInit.test_wasm,
      detect_key_type: wasmInit.detect_key_type,
      decrypt_memo: wasmInit.decrypt_memo,
      decrypt_with_multi_account: wasmInit.decrypt_with_multi_account,
      decrypt_compact_output: wasmInit.decrypt_compact_output,
      batch_filter_compact_outputs: wasmInit.batch_filter_compact_outputs,
      // Seed phrase derivation functions
      derive_ufvk_from_seed: wasmInit.derive_ufvk_from_seed,
      validate_seed_phrase: wasmInit.validate_seed_phrase,
      get_seed_word_count: wasmInit.get_seed_word_count,
      derive_spending_key_from_seed: wasmInit.derive_spending_key_from_seed,
    };

    wasmInitialized = true;
    console.log("✅ WASM module loaded successfully");
    return wasmModule;
  } catch (error) {
    console.error("❌ Failed to load WASM:", error);
    throw error;
  }
}

/**
 * Test if WASM is working
 */
export async function testWasm(): Promise<string> {
  const wasm = await loadWasm();
  return wasm.test_wasm();
}

/**
 * Detect the type of viewing key
 */
export async function detectKeyType(viewingKey: string): Promise<string> {
  const wasm = await loadWasm();
  return wasm.detect_key_type(viewingKey);
}

/**
 * Decrypt a memo from a transaction hex
 * @returns DecryptedOutput with memo and amount
 */
export async function decryptMemo(
  txHex: string,
  viewingKey: string
): Promise<DecryptedOutput> {
  try {
    console.log("=== WASM Decryption Debug ===");
    console.log("1. Loading WASM module...");
    const wasm = await loadWasm();
    console.log("✓ WASM loaded");

    console.log("2. Input validation:");
    console.log("   - TX hex length:", txHex.length);
    console.log("   - TX hex prefix:", txHex.substring(0, 20));
    console.log("   - Viewing key length:", viewingKey.length);
    console.log(
      "   - Viewing key prefix:",
      viewingKey.substring(0, 20) + "..."
    );

    console.log("3. Calling WASM decrypt_memo...");
    const startTime = performance.now();

    const result = wasm.decrypt_memo(txHex, viewingKey);

    const elapsed = performance.now() - startTime;
    console.log(`✓ WASM decrypt_memo completed in ${elapsed.toFixed(2)}ms`);
    console.log("4. Raw WASM result:", result);

    // Parse JSON response from WASM
    const parsed = JSON.parse(result);
    console.log("5. Parsed result:", parsed);
    console.log("   - Memo:", parsed.memo);
    console.log("   - Amount:", parsed.amount, "ZEC");
    console.log("=== Decryption Success ===");

    return parsed;
  } catch (error) {
    console.error("=== WASM Decryption Failed ===");
    console.error("Error type:", typeof error);
    console.error("Error object:", error);

    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    } else {
      console.error("Error string:", String(error));
    }

    // Try to extract more details from the error
    const errorStr = String(error);
    console.error("Error details:", {
      isUFVKError: errorStr.includes("UFVK"),
      isFVKError: errorStr.includes("FVK"),
      isOrchardError: errorStr.includes("Orchard"),
      isNoMemoError: errorStr.includes("No memo"),
      isParseError: errorStr.includes("parse"),
      fullError: errorStr,
    });

    throw error;
  }
}

/**
 * Decrypt a memo from a transaction ID (fetches raw hex first)
 * @returns DecryptedOutput with memo and amount
 */
export async function decryptMemoFromTxid(
  txid: string,
  viewingKey: string
): Promise<DecryptedOutput> {
  // Use Supabase edge function to fetch raw transaction
  const apiUrl = `${
    import.meta.env.VITE_SUPABASE_URL
  }/functions/v1/zcash-api/tx/${txid}/raw`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch transaction: ${response.status}`);
    }

    const txData = await response.json();

    // Check if we have raw hex
    if (txData.hex) {
      return decryptMemo(txData.hex, viewingKey);
    }

    throw new Error("Transaction data does not include raw hex");
  } catch (error) {
    console.error("Error fetching transaction:", error);
    throw new Error(
      "Could not fetch transaction. Please provide the raw transaction hex instead."
    );
  }
}

/**
 * Filter compact block outputs to find which ones belong to the viewing key (BATCH VERSION - FAST!)
 * Returns the TXIDs that match (without decrypting the full memo)
 */
export async function filterCompactOutputsBatch(
  compactBlocks: any[],
  viewingKey: string,
  onProgress?: (
    blocksProcessed: number,
    totalBlocks: number,
    matchesFound: number
  ) => void,
  shouldCancel?: () => boolean
): Promise<{ txid: string; height: number; timestamp: number }[]> {
  console.log(
    `🚀 [BATCH FILTER] Starting BATCH filtering of ${compactBlocks.length} compact blocks...`
  );

  const wasm = await loadWasm();
  const totalBlocks = compactBlocks.length;
  const matchingTxs: { txid: string; height: number; timestamp: number }[] = [];
  const txMap = new Map<
    string,
    { txid: string; height: number; timestamp: number }
  >();

  // Process in SMALLER chunks to keep UI responsive (10k blocks = ~1-2 seconds each)
  const CHUNK_SIZE = 10000;

  for (let chunkStart = 0; chunkStart < totalBlocks; chunkStart += CHUNK_SIZE) {
    // Check for cancellation before each chunk
    if (shouldCancel && shouldCancel()) {
      console.log("🛑 [BATCH FILTER] Cancelled by user");
      throw new Error("Scan cancelled by user");
    }

    const chunkEnd = Math.min(chunkStart + CHUNK_SIZE, totalBlocks);
    const chunk = compactBlocks.slice(chunkStart, chunkEnd);

    console.log(
      `🚀 [BATCH FILTER] Processing chunk ${
        Math.floor(chunkStart / CHUNK_SIZE) + 1
      }: blocks ${chunkStart} to ${chunkEnd}`
    );

    // Extract all Orchard outputs from this chunk
    const allOutputs: any[] = [];

    for (const block of chunk) {
      for (const tx of block.vtx || []) {
        for (const action of tx.actions || []) {
          allOutputs.push({
            nullifier: action.nullifier,
            cmx: action.cmx,
            ephemeral_key: action.ephemeralKey,
            ciphertext: action.ciphertext,
            txid: tx.hash,
            height: parseInt(block.height),
            timestamp: block.time,
          });
        }
      }
    }

    if (allOutputs.length === 0) {
      // No outputs in this chunk, update progress and continue
      if (onProgress) {
        onProgress(chunkEnd, totalBlocks, matchingTxs.length);
      }
      continue;
    }

    console.log(
      `🚀 [BATCH FILTER] Chunk has ${allOutputs.length} Orchard outputs`
    );

    // Call WASM batch API for this chunk
    const outputsJson = JSON.stringify(allOutputs);
    const startTime = Date.now();

    const matchesJson = wasm.batch_filter_compact_outputs(
      outputsJson,
      viewingKey
    );
    const matches = JSON.parse(matchesJson);

    const elapsed = Date.now() - startTime;
    console.log(
      `✅ [BATCH FILTER] Chunk filtered in ${elapsed}ms! Found ${matches.length} new matches`
    );

    // Convert matches to TXIDs (deduplicate)
    for (const match of matches) {
      const output = allOutputs[match.index];
      if (!txMap.has(output.txid)) {
        const tx = {
          txid: output.txid,
          height: output.height,
          timestamp: output.timestamp,
        };
        txMap.set(output.txid, tx);
        matchingTxs.push(tx);
        console.log(
          `✅ [BATCH FILTER] Found matching TX: ${output.txid.slice(
            0,
            8
          )}... at block ${output.height} (${match.scope} scope)`
        );
      }
    }

    // Update progress after each chunk and let React re-render + browser repaint
    if (onProgress) {
      onProgress(chunkEnd, totalBlocks, matchingTxs.length);
      // CRITICAL: Wait for React to update the UI AND browser to repaint
      await new Promise((resolve) => {
        requestAnimationFrame(() => {
          setTimeout(resolve, 10); // Extra 10ms to ensure UI update
        });
      });
    }
  }

  console.log(
    `✅ [BATCH FILTER] Filtering complete! Checked ${compactBlocks.length} blocks, found ${matchingTxs.length} matches`
  );
  return matchingTxs;
}

/**
 * Batch filter compact outputs (legacy function name)
 */
export async function batchFilterCompactOutputs(
  outputsJson: string,
  viewingKey: string
): Promise<any> {
  const wasm = await loadWasm();
  return wasm.batch_filter_compact_outputs(outputsJson, viewingKey);
}

/**
 * Format amount from zatoshi to ZEC
 */
export function formatZcash(zatoshi: number): string {
  return (zatoshi / 100000000).toFixed(8);
}

/**
 * Format timestamp to readable date
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString();
}
