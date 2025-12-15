/**
 * Lightwalletd Service
 *
 * Handles fetching compact blocks via the zcash-api Supabase function.
 * This acts as a proxy to the actual lightwalletd (or Cipherscan API).
 */

export class LightwalletdService {
  /**
   * Get the current blockchain height
   */
  async getLatestBlockHeight(): Promise<number> {
    try {
      // Use local proxy defined in vite.config.ts to avoid CORS
      const rpcUrl = "/zebra";

      const response = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "getblockchaininfo",
          params: [],
          id: 1,
        }),
      });

      if (!response.ok) {
        // fallback or throw?
        throw new Error(response.statusText);
      }

      const json = await response.json();
      if (json.error) throw new Error(json.error.message);

      return json.result?.blocks || 0;
    } catch (error) {
      console.error("Failed to get latest block height:", error);
      return 0;
    }
  }

  /**
   * Check if sync is in progress
   */
  isSyncing(): boolean {
    return false;
  }
}

// Singleton instance
export const lightwalletd = new LightwalletdService();

export default lightwalletd;
