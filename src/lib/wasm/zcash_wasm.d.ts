/* tslint:disable */
/* eslint-disable */

/**
 * Batch filter compact outputs (MUCH FASTER!)
 * Takes JSON array of outputs and returns JSON array of matching indices
 */
export function batch_filter_compact_outputs(outputs_json: string, viewing_key: string): string;

/**
 * Decrypt a compact block output (from Lightwalletd)
 * This is MUCH faster than decrypt_memo because it doesn't need the full TX
 */
export function decrypt_compact_output(nullifier_hex: string, cmx_hex: string, ephemeral_key_hex: string, ciphertext_hex: string, viewing_key: string): string;

/**
 * Orchard memo decryption - The Official Way™
 */
export function decrypt_memo(tx_hex: string, viewing_key: string): string;

/**
 * 🎯 NEW: Multi-Account Decryption
 * Tries to decrypt a transaction using multiple account indices (0-9)
 * Returns the first successful decryption with account info
 */
export function decrypt_with_multi_account(tx_hex: string, seed_phrase: string, network: string): string;

/**
 * Derive spending key from seed (for advanced users)
 * Returns hex-encoded spending key
 */
export function derive_spending_key_from_seed(seed_phrase: string, account_index: number): string;

/**
 * Derive Unified Full Viewing Key from BIP39 seed phrase
 * 
 * SECURITY WARNING: This function handles sensitive seed phrase data.
 * The seed phrase is used ONLY for key derivation and is NOT stored.
 * 
 * # Arguments
 * * `seed_phrase` - 12 or 24 word BIP39 mnemonic
 * * `account_index` - Account index (usually 0 for first account)
 * * `network` - "mainnet" or "testnet"
 * 
 * # Returns
 * * Bech32m-encoded UFVK (starts with "uview" or "uviewtest")
 */
export function derive_ufvk_from_seed(seed_phrase: string, account_index: number, network: string): string;

export function detect_key_type(viewing_key: string): string;

/**
 * Get the word count of a seed phrase
 * 
 * # Arguments
 * * `seed_phrase` - The seed phrase to check
 * 
 * # Returns
 * * Number of words (12, 15, 18, 21, or 24)
 */
export function get_seed_word_count(seed_phrase: string): number;

export function main(): void;

export function test_wasm(): string;

/**
 * Validate a BIP39 seed phrase
 * 
 * # Arguments
 * * `seed_phrase` - The seed phrase to validate
 * 
 * # Returns
 * * `true` if valid, `false` otherwise
 */
export function validate_seed_phrase(seed_phrase: string): boolean;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly batch_filter_compact_outputs: (a: number, b: number, c: number, d: number) => [number, number, number, number];
  readonly decrypt_compact_output: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number) => [number, number, number, number];
  readonly decrypt_memo: (a: number, b: number, c: number, d: number) => [number, number, number, number];
  readonly decrypt_with_multi_account: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number, number, number];
  readonly derive_spending_key_from_seed: (a: number, b: number, c: number) => [number, number, number, number];
  readonly derive_ufvk_from_seed: (a: number, b: number, c: number, d: number, e: number) => [number, number, number, number];
  readonly detect_key_type: (a: number, b: number) => [number, number];
  readonly get_seed_word_count: (a: number, b: number) => [number, number, number];
  readonly main: () => void;
  readonly test_wasm: () => [number, number];
  readonly validate_seed_phrase: (a: number, b: number) => number;
  readonly __wbindgen_externrefs: WebAssembly.Table;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __externref_table_dealloc: (a: number) => void;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
