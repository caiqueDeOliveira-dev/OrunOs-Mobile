// Orun OS — Quick Settings Tile bridge (JS side)
//
// Communicates with the native Android Quick Settings Tile to toggle
// the voice assistant on/off from the notification shade.

import { Platform } from "react-native";

let NativeModule: any = null;

if (Platform.OS === "android") {
  try {
    NativeModule = require("expo-modules-core").requireNativeModule("VoiceTile");
  } catch {
    // Module not available (dev build or iOS)
  }
}

export function isTileAvailable(): boolean {
  return NativeModule !== null && Platform.OS === "android";
}

export function setTileActive(active: boolean): void {
  NativeModule?.setTileActive(active);
}

export async function getTileState(): Promise<boolean> {
  if (!NativeModule) return false;
  return await NativeModule.getTileState();
}

export function onTileToggle(callback: () => void): () => void {
  if (!NativeModule) return () => {};

  const sub = NativeModule.addListener("onTileToggle", callback);
  return () => sub?.remove?.();
}

export function onTileStatusChange(callback: (active: boolean) => void): () => void {
  if (!NativeModule) return () => {};

  const sub = NativeModule.addListener("onStatusChange", (event: { active: boolean }) => {
    callback(event.active);
  });
  return () => sub?.remove?.();
}

export async function registerTileReceiver(): Promise<boolean> {
  if (!NativeModule) return false;
  return await NativeModule.registerReceiver();
}
