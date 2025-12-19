import forge from "node-forge";

export interface CryptoPayload {
  encrypted_uvk: string;
  encrypted_key: string;
  iv: string;
}

export function performClientEncryption(
  uvk: string,
  serverPublicKeyPem: string
): CryptoPayload {
  // 1. Generate AES Key (32 bytes) and IV (12 bytes)
  const aesKey = forge.random.getBytesSync(32);
  const iv = forge.random.getBytesSync(12);

  // 2. Encrypt UVK with AES-GCM
  // Note: forge.cipher.createCipher('AES-GCM', ...) expects the key as a binary string/buffer
  const cipher = forge.cipher.createCipher("AES-GCM", aesKey);
  cipher.start({
    iv: iv,
    tagLength: 128, // 128 bit tag = 16 bytes
  });
  cipher.update(forge.util.createBuffer(uvk, "utf8"));
  cipher.finish();

  const encryptedUvk = cipher.output.getBytes();
  const tag = cipher.mode.tag.getBytes();

  // Rust aes-gcm expects Ciphertext + Tag concated
  const combined = encryptedUvk + tag;
  const finalEncryptedUvk = forge.util.encode64(combined);

  // 3. Encrypt AES Key with RSA
  const publicKey = forge.pki.publicKeyFromPem(serverPublicKeyPem);
  // encrypt method defaults to RSAES-PKCS1-V1_5 which matches Node's RSA_PKCS1_PADDING
  const encryptedKey = publicKey.encrypt(aesKey);
  const finalEncryptedKey = forge.util.encode64(encryptedKey);

  // 4. Encode IV
  const finalIv = forge.util.encode64(iv);

  return {
    encrypted_uvk: finalEncryptedUvk,
    encrypted_key: finalEncryptedKey,
    iv: finalIv,
  };
}
