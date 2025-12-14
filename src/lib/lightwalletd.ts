/**
 * Lightwalletd Service
 *
 * Handles fetching compact blocks via the zcash-api Supabase function.
 * This acts as a proxy to the actual lightwalletd (or Cipherscan API).
 */

export interface CompactBlock {
  height: string; // API returns string height
  hash: string;
  time: number;
  vtx: CompactTx[];
}

export interface CompactTx {
  index: string;
  hash: string;
  actions?: CompactOrchardAction[];
  outputs?: CompactOutput[];
}

export interface CompactOutput {
  cmu: string;
  ephemeralKey: string;
  ciphertext: string;
}

export interface CompactOrchardAction {
  nullifier: string;
  cmx: string;
  ephemeralKey: string;
  ciphertext: string;
}

export interface SyncProgress {
  currentHeight: number;
  targetHeight: number;
  percentage: number;
  blocksPerSecond: number;
  estimatedTimeRemaining: number; // seconds
  status: "idle" | "syncing" | "scanning" | "complete" | "error";
  error?: string;
  matchesFound: number;
}

export type SyncCallback = (progress: SyncProgress) => void;

class LightwalletdService {
  private syncInProgress: boolean = false;
  private syncCallbacks: Set<SyncCallback> = new Set();
  private abortController: AbortController | null = null;

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
   * Subscribe to sync progress updates
   */
  onSyncProgress(callback: SyncCallback): () => void {
    this.syncCallbacks.add(callback);
    return () => this.syncCallbacks.delete(callback);
  }

  /**
   * Notify all sync progress listeners
   */
  private notifyProgress(progress: SyncProgress): void {
    this.syncCallbacks.forEach((callback) => callback(progress));
  }

  /**
   * Start syncing the blockchain from a given height
   * @deprecated Use scanWallet from scanner-api instead
   */
  async startSync(
    startHeight: number,
    viewingKey: string,
    onTransaction: (tx: any) => void
  ): Promise<void> {
    console.warn(
      "lightwalletd.startSync is deprecated. Use scanner-api instead."
    );
    return Promise.resolve();
  }

  /**
   * Stop ongoing sync
   */
  stopSync(): void {}

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
