use wasm_bindgen::prelude::*;
use bip39::{Mnemonic, Language};
use orchard::keys::{SpendingKey, FullViewingKey};
use zcash_address::unified::{Encoding, Fvk, Ufvk};

/// Derive Unified Full Viewing Key from BIP39 seed phrase
/// 
/// SECURITY WARNING: This function handles sensitive seed phrase data.
/// The seed phrase is used ONLY for key derivation and is NOT stored.
/// 
/// # Arguments
/// * `seed_phrase` - 12 or 24 word BIP39 mnemonic
/// * `account_index` - Account index (usually 0 for first account)
/// * `network` - "mainnet" or "testnet"
/// 
/// # Returns
/// * Bech32m-encoded UFVK (starts with "uview" or "uviewtest")
#[wasm_bindgen]
pub fn derive_ufvk_from_seed(
    seed_phrase: &str,
    account_index: u32,
    network: &str,
) -> Result<String, String> {
    // Step 1: Parse and validate BIP39 mnemonic
    let mnemonic = Mnemonic::parse_in(Language::English, seed_phrase.trim())
        .map_err(|e| format!("Invalid seed phrase: {:?}. Please check your words.", e))?;
    
    // Step 2: Generate seed from mnemonic (with empty passphrase)
    let seed = mnemonic.to_seed("");
    
    // Step 3: Derive Orchard spending key
    // For Orchard, we use a simplified derivation:
    // Take first 32 bytes of seed and mix with account index
    let mut key_material = [0u8; 32];
    
    // Mix seed with account index for different accounts
    for i in 0..32 {
        key_material[i] = seed[i] ^ ((account_index >> (i % 4 * 8)) as u8);
    }
    
    let spending_key = SpendingKey::from_bytes(key_material)
        .into_option()
        .ok_or("Failed to derive spending key from seed")?;
    
    // Step 4: Derive full viewing key from spending key
    let fvk = FullViewingKey::from(&spending_key);
    let fvk_bytes = fvk.to_bytes();
    
    // Step 5: Create UFVK with Orchard component
    let ufvk = Ufvk::try_from_items(vec![
        Fvk::Orchard(fvk_bytes)
    ]).map_err(|e| format!("Failed to create UFVK: {:?}", e))?;
    
    // Step 6: Encode as bech32m
    #[allow(deprecated)]
    let zcash_network = match network {
        "mainnet" => zcash_address::Network::Main,
        "testnet" => zcash_address::Network::Test,
        _ => return Err(format!("Invalid network: {}. Use 'mainnet' or 'testnet'", network)),
    };
    
    let encoded = ufvk.encode(&zcash_network);
    
    Ok(encoded)
}

/// Validate a BIP39 seed phrase
/// 
/// # Arguments
/// * `seed_phrase` - The seed phrase to validate
/// 
/// # Returns
/// * `true` if valid, `false` otherwise
#[wasm_bindgen]
pub fn validate_seed_phrase(seed_phrase: &str) -> bool {
    Mnemonic::parse_in(Language::English, seed_phrase.trim()).is_ok()
}

/// Get the word count of a seed phrase
/// 
/// # Arguments
/// * `seed_phrase` - The seed phrase to check
/// 
/// # Returns
/// * Number of words (12, 15, 18, 21, or 24)
#[wasm_bindgen]
pub fn get_seed_word_count(seed_phrase: &str) -> Result<usize, String> {
    let mnemonic = Mnemonic::parse_in(Language::English, seed_phrase.trim())
        .map_err(|_| "Invalid seed phrase".to_string())?;
    
    Ok(mnemonic.word_count())
}

/// Derive spending key from seed (for advanced users)
/// Returns hex-encoded spending key
#[wasm_bindgen]
pub fn derive_spending_key_from_seed(
    seed_phrase: &str,
    account_index: u32,
) -> Result<String, String> {
    let mnemonic = Mnemonic::parse_in(Language::English, seed_phrase.trim())
        .map_err(|e| format!("Invalid seed phrase: {:?}", e))?;
    
    let seed = mnemonic.to_seed("");
    
    let mut key_material = [0u8; 32];
    for i in 0..32 {
        key_material[i] = seed[i] ^ ((account_index >> (i % 4 * 8)) as u8);
    }
    
    let spending_key = SpendingKey::from_bytes(key_material)
        .into_option()
        .ok_or("Failed to derive spending key")?;
    
    Ok(hex::encode(spending_key.to_bytes()))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_seed_phrase() {
        // Valid 12-word seed
        let valid_seed = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
        assert!(validate_seed_phrase(valid_seed));
        
        // Invalid seed
        let invalid_seed = "invalid seed phrase test";
        assert!(!validate_seed_phrase(invalid_seed));
    }

    #[test]
    fn test_derive_ufvk() {
        let seed = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
        let result = derive_ufvk_from_seed(seed, 0, "testnet");
        assert!(result.is_ok());
        
        let ufvk = result.unwrap();
        assert!(ufvk.starts_with("uviewtest"));
    }
}
