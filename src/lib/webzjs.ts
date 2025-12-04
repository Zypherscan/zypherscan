/**
 * WebZjs Integration Service
 *
 * This module provides integration with ChainSafe's WebZjs library
 * for real WASM-based Zcash wallet functionality.
 *
 * WebZjs uses librustzcash compiled to WebAssembly to perform:
 * - Trial decryption of shielded outputs
 * - Balance calculation
 * - Transaction scanning
 *
 * Note: The @chainsafe/webzjs-wallet package must be built from source
 * as it's not published to npm. See: https://github.com/ChainSafe/WebZjs
 *
 * ChainSafe hosts a gRPC-web proxy at: https://zcash-mainnet.chainsafe.dev
 */

// Type definitions for WebZjs (when the package is available)
export interface WebZjsWallet {
  create_account(
    seedPhrase: string,
    accountIndex: number,
    birthdayHeight: number
  ): Promise<void>;
  import_ufvk(ufvk: string, birthdayHeight: number): Promise<void>;
  sync(): Promise<void>;
  get_balance(): Promise<WalletBalance>;
  get_transactions(): Promise<Transaction[]>;
  get_addresses(): Promise<string[]>;
}

export interface WalletBalance {
  orchard_balance: bigint;
  sapling_balance: bigint;
  transparent_balance: bigint;
  total_balance: bigint;
  pending_balance: bigint;
}

export interface Transaction {
  txid: string;
  block_height: number;
  timestamp: number;
  amount: bigint;
  memo: string | null;
  pool: "sapling" | "orchard" | "transparent";
  direction: "incoming" | "outgoing";
}

// ChainSafe's hosted gRPC-web proxy for lightwalletd
export const CHAINSAFE_GRPC_WEB_PROXY = "https://zcash-mainnet.chainsafe.dev";

// WebZjs initialization state
let webZjsInitialized = false;
let webZjsWallet: WebZjsWallet | null = null;

/**
 * Check if WebZjs is available
 */
export function isWebZjsAvailable(): boolean {
  try {
    // Check if the WebZjs module is loaded
    // This would be: import { WebWallet } from '@chainsafe/webzjs-wallet';
    return typeof window !== "undefined" && "WebWallet" in window;
  } catch {
    return false;
  }
}

/**
 * Initialize WebZjs WASM module
 *
 * This must be called exactly once per page load before using
 * any WebZjs functionality.
 */
export async function initWebZjs(): Promise<boolean> {
  if (webZjsInitialized) return true;

  try {
    // When WebZjs is available:
    // import initWasm, { initThreadPool, WebWallet } from '@chainsafe/webzjs-wallet';
    // await initWasm();
    // await initThreadPool(navigator.hardwareConcurrency || 4);

    console.log(
      "[WebZjs] WASM module not available - package must be built from source"
    );
    console.log("[WebZjs] See: https://github.com/ChainSafe/WebZjs");

    return false;
  } catch (error) {
    console.error("[WebZjs] Failed to initialize:", error);
    return false;
  }
}

/**
 * Create or get the WebZjs wallet instance
 */
export async function getWebZjsWallet(): Promise<WebZjsWallet | null> {
  if (webZjsWallet) return webZjsWallet;

  if (!webZjsInitialized) {
    const initialized = await initWebZjs();
    if (!initialized) return null;
  }

  try {
    // When WebZjs is available:
    // const { WebWallet } = await import('@chainsafe/webzjs-wallet');
    // webZjsWallet = new WebWallet('main', CHAINSAFE_GRPC_WEB_PROXY, 1);
    // return webZjsWallet;

    return null;
  } catch (error) {
    console.error("[WebZjs] Failed to create wallet:", error);
    return null;
  }
}

/**
 * Import a viewing key and sync the wallet
 *
 * @param viewingKey - Unified Full Viewing Key (UFVK) or Unified Viewing Key (UVK)
 * @param birthdayHeight - Block height when the wallet was created (optional, defaults to Sapling activation)
 */
export async function syncWithViewingKey(
  viewingKey: string,
  birthdayHeight: number = 419200 // Sapling activation height
): Promise<{
  success: boolean;
  balance?: WalletBalance;
  transactions?: Transaction[];
  error?: string;
}> {
  const wallet = await getWebZjsWallet();

  if (!wallet) {
    return {
      success: false,
      error:
        "WebZjs not available. The @chainsafe/webzjs-wallet package must be built from source. See https://github.com/ChainSafe/WebZjs",
    };
  }

  try {
    // Import the viewing key
    await wallet.import_ufvk(viewingKey, birthdayHeight);

    // Sync with the network (this runs in a web worker)
    await wallet.sync();

    // Get balance and transactions
    const balance = await wallet.get_balance();
    const transactions = await wallet.get_transactions();

    return {
      success: true,
      balance,
      transactions,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to sync wallet",
    };
  }
}

/**
 * Get installation instructions for WebZjs
 */
export function getWebZjsInstallInstructions(): string {
  return `
# WebZjs Installation

WebZjs provides real WASM-based Zcash wallet functionality.
The package must be built from source as it's not published to npm.

## Prerequisites
- Rust and Cargo (https://rustup.rs)
- wasm-pack (https://rustwasm.github.io/wasm-pack/installer/)
- clang 17+ (for WASM compilation)
- just command runner (cargo install just)

## Build Steps

1. Clone the repository:
   git clone https://github.com/ChainSafe/WebZjs.git
   cd WebZjs

2. Build the WASM packages:
   just build

3. Install dependencies:
   yarn install

4. The built packages are in:
   - packages/webzjs-wallet
   - packages/webzjs-keys

5. Link or copy to your project:
   cd packages/webzjs-wallet
   npm link
   
   # In your project:
   npm link @chainsafe/webzjs-wallet

## Usage

import initWasm, { initThreadPool, WebWallet } from '@chainsafe/webzjs-wallet';

// Initialize exactly once per page load
await initWasm();
await initThreadPool(navigator.hardwareConcurrency);

// Create wallet with gRPC-web proxy
const wallet = new WebWallet('main', 'https://zcash-mainnet.chainsafe.dev', 1);

// Import viewing key and sync
await wallet.import_ufvk(viewingKey, birthdayHeight);
await wallet.sync();

// Get balance
const balance = await wallet.get_balance();
`;
}

export default {
  isWebZjsAvailable,
  initWebZjs,
  getWebZjsWallet,
  syncWithViewingKey,
  getWebZjsInstallInstructions,
  CHAINSAFE_GRPC_WEB_PROXY,
};
