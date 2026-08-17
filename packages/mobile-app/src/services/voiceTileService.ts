// Orun OS — Quick Settings Tile bridge (JS side)
//
// Communicates with the native Android Quick Settings Tile via the
// VoiceTile Expo module. When the user taps the tile, the native side
// emits "onTileToggle" with { isActive }. We forward this to the
// voice assistant to start/stop listening.

import { Platform } from "react-native";
import * as DeviceEventEmitter from "expo-modules-core";

type TileToggleEvent = { isActive: boolean };

let NativeVoiceTile: any = null;
try {
  NativeVoiceTile = require("../../modules/voice-tile").default;
} catch {
  // Module not linked (dev / non-Android)
}

let subscription: any = null;
let onToggleCallback: ((active: boolean) => void) | null = null;

export function isTileAvailable(): boolean {
  return Platform.OS === "android" && NativeVoiceTile != null;
}

/**
 * Listen for tile toggle events. Calls `callback(isActive)` when the
 * tile is tapped. Returns a cleanup function.
 */
export function onTileToggle(callback: (active: boolean) => void): () => void {
  onToggleCallback = callback;

  if (NativeVoiceTile) {
    subscription = NativeVoiceTile.addListener("onTileToggle", (event: TileToggleEvent) => {
      onToggleCallback?.(event.isActive);
    });
  }

  return () => {
    subscription?.remove();
    subscription = null;
    onToggleCallback = null;
  };
}

/**
 * Push current assistant state to the tile so its icon stays in sync.
 */
export async function setTileActive(active: boolean): Promise<void> {
  if (NativeVoiceTile) {
    await NativeVoiceTile.setTileActive(active);
  }
}

export async function getTileActive(): Promise<boolean> {
  if (NativeVoiceTile) {
    return await NativeVoiceTile.isTileActive();
  }
  return false;
}
