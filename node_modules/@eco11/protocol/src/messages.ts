/**
 * Eco11 Protocol — Message Catalogue
 *
 * Every feature in the ecosystem maps to one or more message types.
 * Payloads are plain JSON so the Rust and TS sides share a single schema.
 *
 * Categories:
 *   handshake  - pairing, key exchange, presence
 *   control    - mirroring gestures, keyboard, clipboard
 *   media     - screen stream control, audio routing
 *   notify    - notification sync + action
 *   call      - telephony handoff
 *   file      - EcoDrop transfer
 *   state     - battery / network / proximity tiles
 */

export const MESSAGE_TYPES = {
  // ---- handshake / pairing ---------------------------------------------
  HELLO: 'hello',                 // announce self + capabilities
  CHALLENGE: 'challenge',          // ECDH public key
  KEY_EXCHANGE: 'key_exchange',    // confirm session key established
  PING: 'ping',
  PONG: 'pong',
  PAIR_REQUEST: 'pair_request',
  PAIR_ACCEPT: 'pair_accept',
  PAIR_DENY: 'pair_deny',
  UNPAIR: 'unpair',

  // ---- control / mirroring ---------------------------------------------
  CLIPBOARD_PUSH: 'clipboard_push',          // payload: { mime, data, source }
  CLIPBOARD_PULL: 'clipboard_pull',
  SCREEN_FRAME: 'screen_frame',              // payload: { codec, w, h, frame }
  SCREEN_CONTROL: 'screen_control',          // { x, y, button, action }
  KEY_EVENT: 'key_event',                    // { keyCode, modifiers, action }
  GESTURE: 'gesture',                        // swipe / back / home / recents
  INPUT_FOCUS: 'input_focus',                // which field is active
  DEVICE_COMMAND: 'device_command',          // power/volume/brightness

  // ---- notifications ----------------------------------------------------
  NOTIFICATION: 'notification',              // full notification object
  NOTIFICATION_ACTION: 'notification_action', // user tapped an action
  NOTIFICATION_FILTER: 'notification_filter', // app allow-list update

  // ---- calls ------------------------------------------------------------
  CALL_DIAL: 'call_dial',                    // { number }
  CALL_ACCEPT: 'call_accept',
  CALL_END: 'call_end',
  CALL_KEYPAD: 'call_keypad',                // { dtmf }
  CALL_AUDIO: 'call_audio',                  // { micMuted, speakerOn }
  CALL_BRIDGE: 'call_bridge',                // WebRTC offer/answer for audio

  // ---- files (EcoDrop) --------------------------------------------------
  FILE_OFFER: 'file_offer',                  // { id, name, size, mime }
  FILE_CHUNK: 'file_chunk',                  // { id, offset, data }
  FILE_CANCEL: 'file_cancel',
  FILE_COMPLETE: 'file_complete',

  // ---- media / camera ---------------------------------------------------
  CAMERA_SWITCH: 'camera_switch',            // { facing: front|back|ultrawide }
  AUDIO_ROUTE: 'audio_route',                // route phone audio to PC
  MEDIA_CONTROL: 'media_control',            // play/pause/next/prev/volume

  // ---- state / tiles ----------------------------------------------------
  STATE_BATTERY: 'state_battery',            // { pct, charging }
  STATE_NETWORK: 'state_network',            // { type, signal, hotspot }
  STATE_PROXIMITY: 'state_proximity',        // { present: bool }
} as const;

export type MessageType = (typeof MESSAGE_TYPES)[keyof typeof MESSAGE_TYPES];

/** Capability flags advertised in HELLO. */
export interface Capabilities {
  screenStream: boolean;
  clipboard: boolean;
  notifications: boolean;
  calls: boolean;
  fileTransfer: boolean;
  camera: boolean;
  audioRouting: boolean;
  autoUnlock: boolean;
}

export const ALL_CAPABILITIES: Capabilities = {
  screenStream: true,
  clipboard: true,
  notifications: true,
  calls: true,
  fileTransfer: true,
  camera: true,
  audioRouting: true,
  autoUnlock: true,
};