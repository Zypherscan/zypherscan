// WASM Loader for Zcash memo decryption
// This wrapper handles dynamic loading of the WASM module

let wasmModule: any = null;
let wasmInitialized = false;

export interface DecryptedOutput {
  memo: string;
  amount: number; // Amount in ZEC
}

export interface ZcashWasm {
  test_wasm: () => string;
  detect_key_type: (viewingKey: string) => string;
  decrypt_memo: (txHex: string, viewingKey: string) => string;
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

    // Initialize the WASM (this loads the .wasm file from public/wasm/zcash_wasm_bg.wasm)
    // The generated JS usually expects the wasm file relative to itself or at a specific path
    await wasmInit.default("/wasm/zcash_wasm_bg.wasm");

    // Extract the exported functions
    wasmModule = {
      test_wasm: wasmInit.test_wasm,
      detect_key_type: wasmInit.detect_key_type,
      decrypt_memo: wasmInit.decrypt_memo,
      decrypt_compact_output: wasmInit.decrypt_compact_output,
      batch_filter_compact_outputs: wasmInit.batch_filter_compact_outputs,
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
    const wasm = await loadWasm();
    console.log("Calling WASM decrypt_memo with:");
    console.log("- TX hex length:", txHex.length);
    console.log("- Viewing key length:", viewingKey.length);
    console.log("- Viewing key prefix:", viewingKey.substring(0, 20) + "...");

    const result = wasm.decrypt_memo(txHex, viewingKey);
    console.log("WASM decrypt_memo raw result:", result);

    // Parse JSON response from WASM
    const parsed = JSON.parse(result);
    console.log("Parsed result:", parsed);

    return parsed;
  } catch (error) {
    console.error("decryptMemo error:", error);
    console.error("Error type:", typeof error);
    console.error("Error details:", error);
    throw error;
  }
}

/**
 * Batch filter compact outputs
 */
export async function batchFilterCompactOutputs(
  outputsJson: string,
  viewingKey: string
): Promise<any> {
  const wasm = await loadWasm();
  return wasm.batch_filter_compact_outputs(outputsJson, viewingKey);
}
