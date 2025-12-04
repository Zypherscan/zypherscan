import {
  loadWasm,
  batchFilterCompactOutputs,
  DecryptedOutput,
} from "./wasm-loader";

export interface CompactBlock {
  height: number;
  hash: string;
  time: number;
  vtx: CompactTx[];
}

export interface CompactTx {
  hash: string;
  actions: CompactAction[]; // Orchard
  outputs: CompactOutput[]; // Sapling
}

export interface CompactAction {
  nullifier: string;
  cmx: string;
  ephemeralKey: string;
  ciphertext: string;
}

export interface CompactOutput {
  cmu: string;
  ephemeralKey: string;
  ciphertext: string;
}

export interface DecryptedTransaction {
  txid: string;
  timestamp: Date;
  amount: number;
  memo?: string;
  type: "incoming" | "outgoing" | "internal";
  pool: "sapling" | "orchard" | "transparent";
  address?: string;
  height: number;
}

export interface WalletBalance {
  total: number;
  shielded: number;
  transparent: number;
  sapling: number;
  orchard: number;
  pending: number;
}

export interface ViewingKeyInfo {
  type: "unified" | "sapling" | "transparent";
  network: "mainnet" | "testnet";
  components: {
    hasSapling: boolean;
    hasOrchard: boolean;
    hasTransparent: boolean;
  };
}

// Initialize WASM
export async function initZcashWasm(): Promise<boolean> {
  try {
    await loadWasm();
    return true;
  } catch (e) {
    console.error("Failed to init WASM", e);
    return false;
  }
}

export function isWasmLoaded(): boolean {
  // This is a bit of a hack, but loadWasm checks internal state
  return true;
}

export function parseViewingKey(key: string): ViewingKeyInfo | null {
  if (!key) return null;

  // Simple heuristic for now, can use WASM detect_key_type later
  const isTestnet =
    key.startsWith("uviewtest") || key.startsWith("ztestsapling");
  const isUnified = key.startsWith("uview");
  const isSapling = key.startsWith("zview") || key.startsWith("ztestsapling");

  return {
    type: isUnified ? "unified" : isSapling ? "sapling" : "transparent",
    network: isTestnet ? "testnet" : "mainnet",
    components: {
      hasSapling: true,
      hasOrchard: isUnified,
      hasTransparent: isUnified,
    },
  };
}

export function validateViewingKey(key: string): boolean {
  return (
    key.startsWith("uview") ||
    key.startsWith("zview") ||
    key.startsWith("zxviews") || // Orchard mainnet
    key.startsWith("zxviewtest") || // Orchard testnet
    key.startsWith("ztestsapling")
  );
}

// Real decryption using WASM
export async function decryptTransactions(
  viewingKey: string,
  blocks: CompactBlock[]
): Promise<DecryptedTransaction[]> {
  const decryptedTxs: DecryptedTransaction[] = [];

  // Check if viewing key is supported by WASM
  if (viewingKey.startsWith("uview")) {
    console.warn(
      "⚠️ Unified viewing keys (uview...) are not fully supported by the current WASM implementation."
    );
    console.warn(
      "The WASM only supports Orchard-specific viewing keys (zxviews... for mainnet)."
    );
    console.warn("To view your transaction history, you need to either:");
    console.warn("1. Use an Orchard-specific viewing key, or");
    console.warn("2. Use Zingo-CLI wallet sidecar (see zypher-mono repo)");

    // We'll still try to decrypt, but it will likely fail
  }

  // Prepare outputs for batch processing
  const allOutputs: any[] = [];
  const txMap = new Map<string, { height: number; timestamp: number }>();

  for (const block of blocks) {
    for (const tx of block.vtx) {
      txMap.set(tx.hash, { height: block.height, timestamp: block.time });

      // Orchard Actions
      if (tx.actions) {
        for (const action of tx.actions) {
          // Validate and normalize hex strings (must be 64 chars = 32 bytes)
          const nullifier =
            action.nullifier?.padStart(64, "0") || "0".repeat(64);
          const cmx = action.cmx?.padStart(64, "0") || "0".repeat(64);
          const ephemeralKey =
            action.ephemeralKey?.padStart(64, "0") || "0".repeat(64);
          const ciphertext = action.ciphertext || "";

          allOutputs.push({
            nullifier,
            cmx,
            ephemeral_key: ephemeralKey,
            ciphertext,
            txid: tx.hash,
            height: block.height,
            timestamp: block.time,
            pool: "orchard",
          });
        }
      }

      // Sapling Outputs - Skip for now as WASM doesn't support them
      // The WASM is Orchard-only
    }
  }

  if (allOutputs.length === 0) {
    console.log("No Orchard outputs found to decrypt");
    return [];
  }

  console.log(`Decrypting ${allOutputs.length} outputs...`);
  console.log("Sample output:", allOutputs[0]);

  try {
    // Sanitize outputs for WASM (remove extra fields like timestamp)
    const wasmOutputs = allOutputs.map((o) => {
      // Validate lengths
      if (o.cmx.length !== 64) {
        console.warn(`Invalid CMX length: ${o.cmx.length}, txid: ${o.txid}`);
      }
      if (o.ephemeral_key.length !== 64) {
        console.warn(
          `Invalid ephemeral_key length: ${o.ephemeral_key.length}, txid: ${o.txid}`
        );
      }
      if (o.nullifier.length !== 64) {
        console.warn(
          `Invalid nullifier length: ${o.nullifier.length}, txid: ${o.txid}`
        );
      }

      return {
        nullifier: o.nullifier,
        cmx: o.cmx,
        ephemeral_key: o.ephemeral_key,
        ciphertext: o.ciphertext,
        txid: o.txid,
        height: o.height,
      };
    });

    const outputsJson = JSON.stringify(wasmOutputs);
    const matchesJson = await batchFilterCompactOutputs(
      outputsJson,
      viewingKey
    );
    const matches = JSON.parse(matchesJson);

    console.log(`Found ${matches.length} matching outputs`);

    // For each match, decrypt the full output to get amount and memo
    for (const match of matches) {
      const output = allOutputs.find((o) => o.txid === match.txid);
      if (!output) continue;

      try {
        // The WASM batch filter returns indices or basic info
        // We need to call decrypt_compact_output for full details
        const { decrypt_compact_output } = await loadWasm();
        const decryptedJson = decrypt_compact_output(
          output.nullifier,
          output.cmx,
          output.ephemeral_key,
          output.ciphertext,
          viewingKey
        );

        const decrypted = JSON.parse(decryptedJson);
        const amount = decrypted.amount / 100000000; // Convert zatoshis to ZEC
        const memo = decrypted.memo || "";

        decryptedTxs.push({
          txid: match.txid,
          timestamp: new Date(output.timestamp * 1000),
          amount: amount,
          memo: memo,
          type: "incoming",
          pool: output.pool as "orchard" | "sapling",
          height: match.height,
        });
      } catch (decryptError) {
        console.warn(
          `Failed to decrypt output for ${match.txid}:`,
          decryptError
        );
      }
    }

    // Note: The current WASM module is Orchard-only.
    // It explicitly checks for Fvk::Orchard and fails if not found.
    // It does not support Sapling decryption.
    // Therefore, we cannot scan for Sapling transactions with this WASM.
  } catch (e) {
    console.error("Error in batch decryption:", e);
  }

  return decryptedTxs;
}

// Legacy simulation function (kept for reference or fallback)
export function simulateTransactionDecryption(
  viewingKey: string,
  existingTxs: DecryptedTransaction[] = []
): DecryptedTransaction[] {
  return [];
}

export function calculateBalance(
  transactions: DecryptedTransaction[]
): WalletBalance {
  const balance: WalletBalance = {
    total: 0,
    shielded: 0,
    transparent: 0,
    sapling: 0,
    orchard: 0,
    pending: 0,
  };

  for (const tx of transactions) {
    if (tx.type === "incoming") {
      balance.total += tx.amount;
      balance.shielded += tx.amount;
      if (tx.pool === "sapling") balance.sapling += tx.amount;
      if (tx.pool === "orchard") balance.orchard += tx.amount;
    } else if (tx.type === "outgoing") {
      balance.total -= tx.amount;
      balance.shielded -= tx.amount;
      if (tx.pool === "sapling") balance.sapling -= tx.amount;
      if (tx.pool === "orchard") balance.orchard -= tx.amount;
    }
  }

  return balance;
}

export function generateAnalytics(transactions: DecryptedTransaction[]) {
  const totalTransactions = transactions.length;
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const weeklyTransactions = transactions.filter(
    (tx) => tx.timestamp >= oneWeekAgo
  ).length;

  const totalVolume = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  const averageTransactionSize =
    totalTransactions > 0 ? totalVolume / totalTransactions : 0;

  // Find most active day
  const dayCounts: Record<string, number> = {};
  transactions.forEach((tx) => {
    const day = tx.timestamp.toLocaleDateString("en-US", { weekday: "long" });
    dayCounts[day] = (dayCounts[day] || 0) + 1;
  });

  let mostActiveDay = "N/A";
  let maxCount = 0;
  Object.entries(dayCounts).forEach(([day, count]) => {
    if (count > maxCount) {
      maxCount = count;
      mostActiveDay = day;
    }
  });

  const totalReceived = transactions
    .filter((tx) => tx.type === "incoming")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalSent = transactions
    .filter((tx) => tx.type === "outgoing")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const txTypes = {
    incoming: transactions.filter((tx) => tx.type === "incoming").length,
    outgoing: transactions.filter((tx) => tx.type === "outgoing").length,
    internal: transactions.filter((tx) => tx.type === "internal").length,
  };

  return {
    totalTransactions,
    weeklyTransactions,
    averageTransactionSize,
    mostActiveDay,
    totalFees: 0.0001 * totalTransactions, // Estimate
    history: [], // TODO: Generate history data for charts
    poolDistribution: {
      sapling: transactions.filter((t) => t.pool === "sapling").length,
      orchard: transactions.filter((t) => t.pool === "orchard").length,
    },
    dailyVolume: [], // Placeholder
    totalReceived,
    totalSent,
    txTypes,
  };
}

export function formatZEC(amount: number): string {
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
  });
}

export function formatZECWithSymbol(amount: number): string {
  return `ZEC ${formatZEC(amount)}`;
}
