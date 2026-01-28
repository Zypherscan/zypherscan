/**
 * Zcash Network Configuration
 * Adapted from CipherScan for zypherscan
 * Provides network detection and RPC configuration
 */

// Auto-detect network based on domain or env variable
function detectNetwork(): "mainnet" | "testnet" {
  // First check explicit env variable
  if (import.meta.env.VITE_NETWORK === "mainnet") return "mainnet";
  if (import.meta.env.VITE_NETWORK === "testnet") return "testnet";

  // Auto-detect from domain (client-side only)
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname.includes("testnet.")) return "testnet";
    if (hostname.includes("mainnet.")) return "mainnet";
  }

  // Default to testnet for local dev
  return "testnet";
}

// Network configuration
export const NETWORK = detectNetwork();

export const isMainnet = NETWORK === "mainnet";
export const isTestnet = NETWORK === "testnet";

// Currency display
export const CURRENCY = isMainnet ? "ZEC" : "TAZ";

// Network display
export const NETWORK_LABEL = isMainnet ? "MAINNET" : "TESTNET";

// RPC config (server-side only)
export const RPC_CONFIG = {
  url:
    import.meta.env.VITE_ZCASH_RPC_URL ||
    import.meta.env.VITE_ZEBRA_RPC_URL ||
    (isMainnet ? "http://localhost:8232" : "http://localhost:18232"),
  lightwalletd:
    import.meta.env.VITE_LIGHTWALLETD_GRPC_URL ||
    (isMainnet
      ? "https://mainnet.lightwalletd.com:9067"
      : "https://testnet.lightwalletd.com:9067"),
  user: import.meta.env.VITE_ZCASH_RPC_USER || "",
  password: import.meta.env.VITE_ZCASH_RPC_PASSWORD || "",
};

// Network colors for UI
export const NETWORK_COLOR = isMainnet ? "text-green-500" : "text-gray-400";

// Supabase configuration
export const SUPABASE_CONFIG = {
  url: import.meta.env.VITE_SUPABASE_URL || "",
  anonKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "",
};

/**
 * Detect address type from its prefix
 */
export function detectAddressType(
  address: string
): "shielded" | "transparent" | "unified" | "invalid" {
  if (address.startsWith("utest") || address.startsWith("u1")) {
    return "unified";
  }
  if (address.startsWith("ztestsapling") || address.startsWith("zs")) {
    return "shielded";
  }
  // Transparent addresses: tm (testnet P2PKH), t1 (mainnet P2PKH), t2 (testnet P2SH), t3 (mainnet P2SH)
  if (
    address.startsWith("tm") ||
    address.startsWith("t1") ||
    address.startsWith("t2") ||
    address.startsWith("t3")
  ) {
    return "transparent";
  }
  return "invalid";
}

/**
 * Format amount from zatoshi to ZEC/TAZ
 */
export function formatAmount(zatoshi: number): string {
  return `${(zatoshi / 100000000).toFixed(8)} ${CURRENCY}`;
}

/**
 * Format timestamp to readable date
 */
export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString();
}

/**
 * Get block explorer URL for transaction
 */
export function getTxExplorerUrl(txid: string): string {
  if (isMainnet) {
    return `https://explorer.zcha.in/transactions/${txid}`;
  }
  return `https://explorer.zcha.in/transactions/${txid}?network=testnet`;
}

/**
 * Get block explorer URL for address
 */
export function getAddressExplorerUrl(address: string): string {
  if (isMainnet) {
    return `https://explorer.zcha.in/accounts/${address}`;
  }
  return `https://explorer.zcha.in/accounts/${address}?network=testnet`;
}

/**
 * Get block explorer URL for block
 */
export function getBlockExplorerUrl(height: number): string {
  if (isMainnet) {
    return `https://explorer.zcha.in/blocks/${height}`;
  }
  return `https://explorer.zcha.in/blocks/${height}?network=testnet`;
}
