/**
 * Application configuration
 *
 * These settings control connections to Zcash infrastructure
 */

export const config = {
  // Zebra JSON-RPC endpoint for block/transaction data
  zebraRpcUrl:
    import.meta.env.VITE_ZEBRA_RPC_URL || "https://zebra.up.railway.app",

  // Lightwalletd gRPC endpoint for wallet syncing
  lightwalletdUrl:
    import.meta.env.VITE_LIGHTWALLETD_GRPC_URL ||
    "http://yamanote.proxy.rlwy.net:54918",

  // Supabase configuration (for caching)
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || "",
    anonKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "",
  },

  // App settings
  app: {
    name: "ZShield Explorer",
    version: "1.0.0",
  },

  // Sync settings
  sync: {
    // How often to check for new blocks (ms)
    pollInterval: 30000,
    // Batch size for transaction scanning
    scanBatchSize: 1000,
    // Number of blocks to confirm before considering final
    confirmationBlocks: 10,
  },

  // Storage keys
  storage: {
    viewingKey: "zcash_viewing_key",
    addressBook: "zcash_address_book",
    syncState: "zcash_sync_state",
    transactions: "zcash_transactions",
  },
} as const;

export type Config = typeof config;
