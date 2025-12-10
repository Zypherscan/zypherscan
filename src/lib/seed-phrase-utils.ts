import { loadWasm } from "./wasm-loader";

/**
 * Derive Unified Full Viewing Key from BIP39 seed phrase
 *
 * SECURITY WARNING: The seed phrase is used ONLY for key derivation
 * and is NOT stored. It will be cleared from memory after use.
 *
 * @param seedPhrase - 12 or 24 word BIP39 mnemonic
 * @param accountIndex - Account index (usually 0 for first account)
 * @param network - "mainnet" or "testnet"
 * @returns Promise<string> - Bech32m-encoded UFVK
 */
export async function deriveUFVKFromSeed(
  seedPhrase: string,
  accountIndex: number = 0,
  network: "mainnet" | "testnet" = "mainnet"
): Promise<string> {
  try {
    const wasm = await loadWasm();
    const ufvk = wasm.derive_ufvk_from_seed(
      seedPhrase.trim(),
      accountIndex,
      network
    );

    return ufvk;
  } catch (error) {
    console.error("❌ Failed to derive UFVK:", error);
    throw error;
  } finally {
    // Clear seed phrase from memory (best effort)
    seedPhrase = "";
  }
}

/**
 * Validate a BIP39 seed phrase
 *
 * @param seedPhrase - The seed phrase to validate
 * @returns Promise<boolean> - true if valid, false otherwise
 */
export async function validateSeedPhrase(seedPhrase: string): Promise<boolean> {
  try {
    const wasm = await loadWasm();
    return wasm.validate_seed_phrase(seedPhrase.trim());
  } catch (error) {
    console.error("Error validating seed phrase:", error);
    return false;
  }
}

/**
 * Get the word count of a seed phrase
 *
 * @param seedPhrase - The seed phrase to check
 * @returns Promise<number> - Number of words (12, 15, 18, 21, or 24)
 */
export async function getSeedWordCount(seedPhrase: string): Promise<number> {
  const wasm = await loadWasm();
  return wasm.get_seed_word_count(seedPhrase.trim());
}

/**
 * Derive spending key from seed phrase (ADVANCED - USE WITH CAUTION)
 *
 * WARNING: Spending keys give full control over funds!
 *
 * @param seedPhrase - BIP39 mnemonic
 * @param accountIndex - Account index
 * @returns Promise<string> - Hex-encoded spending key
 */
export async function deriveSpendingKeyFromSeed(
  seedPhrase: string,
  accountIndex: number = 0
): Promise<string> {
  const wasm = await loadWasm();
  return wasm.derive_spending_key_from_seed(seedPhrase.trim(), accountIndex);
}
