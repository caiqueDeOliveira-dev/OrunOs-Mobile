// Orun OS — Foreground notification for voice assistant
//
// Shows a persistent notification while the voice assistant is active.
// Works like Spotify's media notification on Android.

import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";

const CHANNEL_ID = "orun-voice-active";
const CHANNEL_NAME = "Orun Voice Assistant";

let notificationId: string | null = null;
let isShowing = false;

// Callbacks set by the voice assistant
let onPause: (() => void) | null = null;
let onResume: (() => void) | null = null;
let onStop: (() => void) | null = null;

export function setNotificationActions(callbacks: {
  onPause?: () => void;
  onResume?: () => void;
  onStop?: () => void;
}): void {
  if (callbacks.onPause) onPause = callbacks.onPause;
  if (callbacks.onResume) onResume = callbacks.onResume;
  if (callbacks.onStop) onStop = callbacks.onStop;
}

async function ensureChannel(): Promise<void> {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: CHANNEL_NAME,
    importance: Notifications.AndroidImportance.LOW,
    sound: undefined,
    vibrationPattern: undefined,
    enableLights: false,
    enableVibrate: false,
    showBadge: false,
  });
}

export async function showVoiceNotification(
  state: "listening" | "speaking" | "paused"
): Promise<void> {
  if (!Device.isDevice) return;

  await ensureChannel();

  const isListening = state === "listening" || state === "speaking";
  const title = isListening ? "🐺 Orun ouvindo" : "🐺 Orun pausado";
  const body = isListening
    ? "Diga 'Ok Orun' ou toque para falar"
    : "Toque para retomar";

  try {
    if (notificationId) {
      await Notifications.dismissNotificationAsync(notificationId);
    }

    notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sticky: true,
        autoDismiss: false,
      },
      trigger: null,
    });
    isShowing = true;
  } catch (err) {
    console.warn("[notification] show failed:", (err as Error).message);
  }
}

export async function updateVoiceNotification(
  state: "listening" | "speaking" | "paused"
): Promise<void> {
  if (!isShowing) {
    await showVoiceNotification(state);
    return;
  }
  await showVoiceNotification(state);
}

export async function hideVoiceNotification(): Promise<void> {
  if (!notificationId) return;

  try {
    await Notifications.dismissNotificationAsync(notificationId);
  } catch { /* ignore */ }

  notificationId = null;
  isShowing = false;
}

export function isVoiceNotificationShowing(): boolean {
  return isShowing;
}

/**
 * Setup response handler — call this once at app startup to handle
 * notification taps.
 */
export function setupNotificationResponseHandler(): void {
  Notifications.addNotificationResponseReceivedListener((response) => {
    // When user taps the notification, toggle the assistant
    const request = response.notification.request;
    const content = request.content;

    if (content.title?.includes("pausado") && onResume) {
      onResume();
    } else if (content.title?.includes("ouvindo") && onPause) {
      onPause();
    }
  });
}
