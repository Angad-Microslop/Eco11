/**
 * @eco11/crypto — TypeScript facade
 *
 * The heavy lifting (X25519 ECDH + AES-256-GCM) happens in Rust inside the
 * Tauri process. This module is a thin typed wrapper around the Tauri
 * commands exposed by `eco11-crypto-core`. It also provides a pure-JS
 * fallback for testing and for environments where the native module is
 * unavailable (e.g. unit tests in Node).
 *
 * On Android, the same Rust crate is compiled into the Tauri APK via the
 * mobile target, so the API surface is identical on both platforms.
 */

export interface CryptoProvider {
  /** Generate an X25519 keypair. Returns base64url-encoded public key. */
  generateKeyPair(): Promise<{ publicKey: string; privateKey: string }>;
  /**
   * Derive a shared AES-256 key from our private key + peer's public key.
   * Returns base64url of the 32-byte shared secret (raw, before HKDF).
   */
  deriveShared(privateKeyB64: string, peerPublicKeyB64: string): Promise<string>;
  /**
   * Encrypt a plaintext string with AES-256-GCM using the derived session key.
   * Returns base64url { nonce(16) + ciphertext + tag(16) }.
   */
  encrypt(keyB64: string, plaintext: string): Promise<string>;
  /** Decrypt an output of encrypt(). */
  decrypt(keyB64: string, ciphertextB64: string): Promise<string>;
}

/** Pure-JS fallback using WebCrypto (available in browsers + Node 18+). */
export class WebCryptoProvider implements CryptoProvider {
  async generateKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
    const subtle = (globalThis as any).crypto?.subtle;
    if (!subtle) throw new Error('WebCrypto unavailable');
    const kp = await subtle.generateKey(
      { name: 'ECDH', namedCurve: 'X25519' },
      true,
      ['deriveBits'],
    );
    const pub = await subtle.exportKey('raw', kp.publicKey);
    const priv = await subtle.exportKey('pkcs8', kp.privateKey);
    return { publicKey: b64url(new Uint8Array(pub)), privateKey: b64url(new Uint8Array(priv)) };
  }

  async deriveShared(privateKeyB64: string, peerPublicKeyB64: string): Promise<string> {
    const subtle = (globalThis as any).crypto?.subtle;
    const privKey = await subtle.importKey(
      'pkcs8',
      b64urlDecode(privateKeyB64),
      { name: 'ECDH', namedCurve: 'X25519' },
      false,
      ['deriveBits'],
    );
    const peerPub = await subtle.importKey(
      'raw',
      b64urlDecode(peerPublicKeyB64),
      { name: 'ECDH', namedCurve: 'X25519' },
      false,
      [],
    );
    const bits = await subtle.deriveBits(
      { name: 'ECDH', public: peerPub },
      privKey,
      256,
    );
    return b64url(new Uint8Array(bits));
  }

  async encrypt(keyB64: string, plaintext: string): Promise<string> {
    const subtle = (globalThis as any).crypto?.subtle;
    const key = await subtle.importKey('raw', b64urlDecode(keyB64), 'AES-GCM', false, [
      'encrypt',
      'decrypt',
    ]);
    const nonce = (globalThis as any).crypto?.getRandomValues(new Uint8Array(12));
    const enc = await subtle.encrypt(
      { name: 'AES-GCM', iv: nonce },
      key,
      new TextEncoder().encode(plaintext),
    );
    const out = new Uint8Array(nonce.length + enc.byteLength);
    out.set(nonce, 0);
    out.set(new Uint8Array(enc), nonce.length);
    return b64url(out);
  }

  async decrypt(keyB64: string, ciphertextB64: string): Promise<string> {
    const subtle = (globalThis as any).crypto?.subtle;
    const key = await subtle.importKey('raw', b64urlDecode(keyB64), 'AES-GCM', false, [
      'encrypt',
      'decrypt',
    ]);
    const blob = b64urlDecode(ciphertextB64);
    const nonce = blob.slice(0, 12);
    const data = blob.slice(12);
    const dec = await subtle.decrypt({ name: 'AES-GCM', iv: nonce }, key, data);
    return new TextDecoder().decode(dec);
  }
}

function b64url(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function b64urlDecode(s: string): Uint8Array {
  const pad = s.replace(/-/g, '+').replace(/_/g, '/').padEnd(
    Math.ceil((s.length + 3) / 4) * 4,
    '=',
  );
  const bin = atob(pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}