/**
 * Lightwalletd Service
 *
 * Handles fetching compact blocks via the zcash-api Supabase function.
 * This acts as a proxy to the actual lightwalletd (or Cipherscan API).
 */

import { supabase } from "./supabase";

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
      const { data, error } = await supabase.functions.invoke("zcash-api", {
        body: { action: "getBlockchainInfo" },
      });

      if (error) throw error;
      return data.info?.blocks || 0;
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
   */
  async startSync(
    startHeight: number,
    viewingKey: string,
    onTransaction: (tx: any) => void
  ): Promise<void> {
    if (this.syncInProgress) {
      console.warn("Sync already in progress");
      return;
    }

    this.syncInProgress = true;
    this.abortController = new AbortController();

    const targetHeight = await this.getLatestBlockHeight();

    if (targetHeight <= 0) {
      console.error("Invalid target height:", targetHeight);
      this.syncInProgress = false;
      return;
    }

    // Sanity check for startHeight
    if (startHeight < 0) {
      startHeight = Math.max(0, targetHeight - 10000);
    }

    const startTime = Date.now();
    let currentHeight = startHeight;
    let blocksProcessed = 0;
    let matchesFound = 0;

    // Dynamically import WASM functions to avoid loading if not needed
    const { decryptTransactions } = await import("./zcash-crypto");

    try {
      this.notifyProgress({
        currentHeight,
        targetHeight,
        percentage: 0,
        blocksPerSecond: 0,
        estimatedTimeRemaining: 0,
        status: "syncing",
        matchesFound: 0,
      });

      const BATCH_SIZE = 5000; // Increased batch size to reduce API calls

      while (
        currentHeight < targetHeight &&
        !this.abortController.signal.aborted
      ) {
        const batchEnd = Math.min(currentHeight + BATCH_SIZE, targetHeight);

        console.log(`Scanning blocks ${currentHeight} to ${batchEnd}...`);

        // Fetch compact blocks via Supabase Proxy
        const { data, error } = await supabase.functions.invoke("zcash-api", {
          body: {
            action: "scan",
            startHeight: currentHeight,
            endHeight: batchEnd,
          },
        });

        if (error) throw error;
        if (!data.success && data.error) throw new Error(data.error);

        const compactBlocks = (data.blocks || []).map((b: any) => ({
          ...b,
          height: parseInt(b.height),
          vtx: b.vtx.map((tx: any) => ({
            ...tx,
            actions: tx.actions || [],
            outputs: tx.outputs || [],
          })),
        }));

        // Decrypt transactions in this batch
        if (compactBlocks.length > 0) {
          const decryptedTxs = await decryptTransactions(
            viewingKey,
            compactBlocks
          );

          if (decryptedTxs.length > 0) {
            console.log(`Found ${decryptedTxs.length} transactions!`);
            matchesFound += decryptedTxs.length;
            decryptedTxs.forEach((tx) => onTransaction(tx));
          }
        }

        blocksProcessed += batchEnd - currentHeight;
        currentHeight = batchEnd;

        const elapsed = (Date.now() - startTime) / 1000;
        const blocksPerSecond = blocksProcessed / (elapsed || 1);
        const remainingBlocks = targetHeight - currentHeight;
        const estimatedTimeRemaining = remainingBlocks / blocksPerSecond;

        const percentage =
          ((currentHeight - startHeight) / (targetHeight - startHeight)) * 100;

        this.notifyProgress({
          currentHeight,
          targetHeight,
          percentage,
          blocksPerSecond,
          estimatedTimeRemaining,
          status: "syncing",
          matchesFound,
        });

        // Add delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      this.notifyProgress({
        currentHeight: targetHeight,
        targetHeight,
        percentage: 100,
        blocksPerSecond: 0,
        estimatedTimeRemaining: 0,
        status: "complete",
        matchesFound,
      });
    } catch (error) {
      console.error("Sync error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.notifyProgress({
        currentHeight,
        targetHeight,
        percentage: (currentHeight / targetHeight) * 100,
        blocksPerSecond: 0,
        estimatedTimeRemaining: 0,
        status: "error",
        error: errorMessage,
        matchesFound,
      });
      throw error;
    } finally {
      this.syncInProgress = false;
      this.abortController = null;
    }
  }

  /**
   * Stop ongoing sync
   */
  stopSync(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
    this.syncInProgress = false;
  }

  /**
   * Check if sync is in progress
   */
  isSyncing(): boolean {
    return this.syncInProgress;
  }
}

// Singleton instance
export const lightwalletd = new LightwalletdService();

export default lightwalletd;
