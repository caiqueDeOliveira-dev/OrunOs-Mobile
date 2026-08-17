// Orun OS — Quick Settings Tile bridge (JS side)
//
// Communicates with the native Android Quick Settings Tile via broadcasts.
// The tile sends ACTION_TOGGLE when tapped, and the app sends
// ACTION_STATUS_UPDATE back to keep the tile in sync.

import { Platform, DeviceEventEmitter } from "react-native";

const ACTION_TOGGLE = "com.orun.os.ACTION_TOGGLE_VOICE";
const ACTION_STATUS_UPDATE = "com.orun.os.ACTION_VOICE_STATUS";
const EXTRA_IS_ACTIVE = "is_active";

let subscription: any = null;
let onToggleCallback: (() => void) | null = null;

/**
 * Check if the tile is available (Android only, after prebuild).
 */
export function isTileAvailable(): boolean {
  return Platform.OS === "android";
}

/**
 * Listen for tile toggle broadcasts. Returns a cleanup function.
 */
export function onTileToggle(callback: () => void): () => void {
  onToggleCallback = callback;

  // Listen for native broadcast via DeviceEventEmitter
  // The native side needs to emit this event
  if (Platform.OS === "android") {
    subscription = DeviceEventEmitter.addListener(ACTION_TOGGLE, () => {
      onToggleCallback?.();
    });
  }

  return () => {
    subscription?.remove();
    subscription = null;
    onToggleCallback = null;
  };
}

/**
 * Send status update to the tile so it stays in sync.
 * Native side should listen for this and update the tile state.
 */
export function setTileActive(active: boolean): void {
  // This would need a native module to send the broadcast
  // For now, we rely on the tile's own state management
}
