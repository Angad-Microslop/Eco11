/**
 * Eco11 P2P Protocol — Message Envelope
 *
 * Every frame exchanged over the encrypted WebSocket / WebRTC DataChannel
 * is wrapped in an `EcoFrame`. The envelope is intentionally small, binary
 * friendly and versioned so the two peers can negotiate compatibility.
 *
 * Wire format (JSON for control frames, binary for streaming chunks):
 *   { v: 1, id, src, dst, nonce, ts, type, payload }
 *
 * `nonce` is a 16-byte base64url random value used for replay protection
 * and duplicate suppression at the receiver.
 */

export const PROTOCOL_VERSION = 1 as const;

/** 16-byte nonce -> base64url (22 chars). */
export function makeNonce(): string {
  const bytes = new Uint8Array(16);
  // crypto.getRandomValues is available in browsers, Tauri webviews and Node.
  const g = (globalThis as any).crypto;
  if (g && typeof g.getRandomValues === 'function') {
    g.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export type DeviceRole = 'phone' | 'desktop';

export interface EcoFrame<T = unknown> {
  v: typeof PROTOCOL_VERSION;
  id: string;            // unique frame id (nonce-derived)
  src: DeviceRole;       // sender role
  dst: DeviceRole;       // intended receiver role ('both' = broadcast)
  nonce: string;         // 16-byte base64url
  ts: number;            // epoch ms
  type: string;          // message type, see MESSAGE_TYPES
  payload: T;
}

export function makeFrame<T>(type: string, payload: T, src: DeviceRole, dst: DeviceRole = 'both'): EcoFrame<T> {
  const nonce = makeNonce();
  return {
    v: PROTOCOL_VERSION,
    id: nonce,
    src,
    dst,
    nonce,
    ts: Date.now(),
    type,
    payload,
  };
}

/** Serialize a frame to a compact JSON string for transport. */
export function encodeFrame<T>(frame: EcoFrame<T>): string {
  return JSON.stringify(frame);
}

/** Deserialize and validate the protocol version. */
export function decodeFrame(raw: string): EcoFrame | null {
  let obj: any;
  try { obj = JSON.parse(raw); } catch { return null; }
  if (!obj || typeof obj !== 'object') return null;
  if (obj.v !== PROTOCOL_VERSION) return null;
  if (typeof obj.type !== 'string') return null;
  return obj as EcoFrame;
}