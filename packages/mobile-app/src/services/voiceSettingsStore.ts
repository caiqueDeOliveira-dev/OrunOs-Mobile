// Orun OS — Voice settings store
//
// Persists voice configuration (pitch, rate, voice) so the TTS always
// uses the user's preferred voice. Default: masculine wolf voice (low pitch).
// On Android, pitch 0.75 + a male voice identifier gives a deep masculine sound.

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import * as Speech from "expo-speech";

const STORAGE_KEY = "orun.voice.settings";

export interface VoiceSettings {
  pitch: number;    // 0.5 – 2.0  (lower = deeper/masculine)
  rate: number;     // 0.5 – 2.0  (speaking speed)
  voice: string;    // voice identifier (empty = system default)
  label: string;    // human-readable name for the preset
}

const PRESETS: Record<string, VoiceSettings> = {
  wolf: {
    pitch: 0.6,
    rate: 0.9,
    voice: "",
    label: "Lobisomem (grave)",
  },
  wolf_fast: {
    pitch: 0.6,
    rate: 1.1,
    voice: "",
    label: "Lobisomem (rápido)",
  },
  deep: {
    pitch: 0.5,
    rate: 0.85,
    voice: "",
    label: "Grave",
  },
  neutral: {
    pitch: 1.0,
    rate: 1.0,
    voice: "",
    label: "Neutro",
  },
  female: {
    pitch: 1.25,
    rate: 1.0,
    voice: "",
    label: "Feminino",
  },
  female_fast: {
    pitch: 1.25,
    rate: 1.15,
    voice: "",
    label: "Feminino (rápido)",
  },
};

const DEFAULT_KEY = "wolf"; // masculine wolf voice

let cached: VoiceSettings | null = null;
let maleVoiceId: string | null = null;
let voiceDetectionDone = false;

export function getPresets(): Record<string, VoiceSettings> {
  return PRESETS;
}

export function getPresetKeys(): string[] {
  return Object.keys(PRESETS);
}

/**
 * On Android, try to find a male Portuguese voice identifier.
 * This makes pitch actually work on Xiaomi/Poco where the default Mi TTS
 * ignores the pitch parameter.
 */
async function detectMaleVoice(): Promise<string | null> {
  if (voiceDetectionDone) return maleVoiceId;
  voiceDetectionDone = true;

  if (Platform.OS !== "android") return null;

  try {
    const voices = await Speech.getAvailableVoicesAsync();
    // Look for male Portuguese voices (Google PT-BR male, etc.)
    const maleVoice = voices.find((v) => {
      const lang = v.language?.toLowerCase() ?? "";
      const name = v.name?.toLowerCase() ?? "";
      const isPortuguese = lang.includes("pt") || lang.includes("bra");
      const isMale = name.includes("male") || name.includes("masculino") || name.includes("homem");
      return isPortuguese && isMale;
    });
    if (maleVoice) {
      maleVoiceId = maleVoice.identifier;
      return maleVoiceId;
    }

    // Fallback: any male voice
    const anyMale = voices.find((v) => {
      const name = v.name?.toLowerCase() ?? "";
      return name.includes("male") || name.includes("masculino");
    });
    if (anyMale) {
      maleVoiceId = anyMale.identifier;
      return maleVoiceId;
    }
  } catch {
    // voice detection failed — use default
  }
  return null;
}

export async function loadVoiceSettings(): Promise<VoiceSettings> {
  if (cached) return cached;

  // Try to detect a male voice on Android (one-time)
  await detectMaleVoice();

  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      cached = JSON.parse(raw);
      // Auto-set male voice if none configured
      if (!cached!.voice && maleVoiceId) {
        cached!.voice = maleVoiceId;
      }
      return cached!;
    }
  } catch { /* ignore */ }

  const defaults = { ...PRESETS[DEFAULT_KEY] };
  if (maleVoiceId) defaults.voice = maleVoiceId;
  return defaults;
}

export async function saveVoiceSettings(settings: VoiceSettings): Promise<void> {
  cached = settings;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export async function setVoicePreset(presetKey: string): Promise<VoiceSettings> {
  const preset = PRESETS[presetKey];
  if (!preset) throw new Error(`Preset "${presetKey}" não existe. Opções: ${Object.keys(PRESETS).join(", ")}`);
  const withVoice = { ...preset };
  if (maleVoiceId && !withVoice.voice) withVoice.voice = maleVoiceId;
  await saveVoiceSettings(withVoice);
  return withVoice;
}

/** Get the current cached settings (synchronous, for hot path). Returns default if not loaded yet. */
export function getCachedVoiceSettings(): VoiceSettings {
  return cached ?? PRESETS[DEFAULT_KEY];
}
