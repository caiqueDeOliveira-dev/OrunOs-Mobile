// Orun OS — Voice settings store
//
// Persists voice configuration (pitch, rate, voice) so the TTS always
// uses the user's preferred voice. Default: masculine wolf voice (low pitch).

import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "orun.voice.settings";

export interface VoiceSettings {
  pitch: number;    // 0.5 – 2.0  (lower = deeper/masculine)
  rate: number;     // 0.5 – 2.0  (speaking speed)
  voice: string;    // voice identifier (empty = system default)
  label: string;    // human-readable name for the preset
}

const PRESETS: Record<string, VoiceSettings> = {
  wolf: {
    pitch: 0.75,
    rate: 0.95,
    voice: "",
    label: "Lobisomem (grave)",
  },
  wolf_fast: {
    pitch: 0.75,
    rate: 1.1,
    voice: "",
    label: "Lobisomem (rápido)",
  },
  deep: {
    pitch: 0.6,
    rate: 0.9,
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

export function getPresets(): Record<string, VoiceSettings> {
  return PRESETS;
}

export function getPresetKeys(): string[] {
  return Object.keys(PRESETS);
}

export async function loadVoiceSettings(): Promise<VoiceSettings> {
  if (cached) return cached;

  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      cached = JSON.parse(raw);
      return cached!;
    }
  } catch { /* ignore */ }

  return PRESETS[DEFAULT_KEY];
}

export async function saveVoiceSettings(settings: VoiceSettings): Promise<void> {
  cached = settings;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export async function setVoicePreset(presetKey: string): Promise<VoiceSettings> {
  const preset = PRESETS[presetKey];
  if (!preset) throw new Error(`Preset "${presetKey}" não existe. Opções: ${Object.keys(PRESETS).join(", ")}`);
  await saveVoiceSettings(preset);
  return preset;
}

/** Get the current cached settings (synchronous, for hot path). Returns default if not loaded yet. */
export function getCachedVoiceSettings(): VoiceSettings {
  return cached ?? PRESETS[DEFAULT_KEY];
}
