import { Audio } from "expo-av";
import * as Speech from "expo-speech";
import * as Haptics from "expo-haptics";
import * as FileSystem from "expo-file-system";
import { supabase } from "./supabaseClient";
import { trackVoiceRecorded } from "./analyticsService";
import { getCachedVoiceSettings, loadVoiceSettings, type VoiceSettings } from "./voiceSettingsStore";

export interface TranscriptResult {
  text: string;
  confidence?: number;
}

export interface TTSOptions {
  language?: string;
  rate?: number;
  pitch?: number;
  voice?: string;
}

// ─── Recording preset ─────────────────────────────────────────────

/**
 * Speech-optimized recording preset (mono 16kHz, low bitrate) used for STT
 * captures. Keeps files tiny so even a 15s utterance stays well under the
 * ai-relay 256KB body limit (HIGH_QUALITY at 128kbps could exceed it).
 */
export const VOICE_RECORDING_OPTIONS: Audio.RecordingOptions = {
  isMeteringEnabled: true,
  android: {
    extension: ".m4a",
    outputFormat: Audio.AndroidOutputFormat.MPEG_4,
    audioEncoder: Audio.AndroidAudioEncoder.AAC,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 32000,
  },
  ios: {
    extension: ".m4a",
    outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
    audioQuality: Audio.IOSAudioQuality.MEDIUM,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 32000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: "audio/webm",
    bitsPerSecond: 32000,
  },
};

// ─── Speech-to-Text ──────────────────────────────────────────────

let activeRecording: Audio.Recording | null = null;

export async function requestMicPermission(): Promise<boolean> {
  const perm = await Audio.requestPermissionsAsync();
  return perm.granted;
}

/**
 * expo-av only allows a single Recording prepared at a time (module-level
 * flag). Any leftover/racing recorder makes createAsync throw; retry briefly
 * before giving up so voice flows never break on transient conflicts.
 */
export async function createRecordingWithRetry(
  options: Audio.RecordingOptions,
  onStatusUpdate?: (status: Audio.RecordingStatus) => void,
  progressUpdateIntervalMillis = 250
): Promise<Audio.Recording> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const { recording } = await Audio.Recording.createAsync(
        options,
        onStatusUpdate,
        progressUpdateIntervalMillis
      );
      return recording;
    } catch (err) {
      const conflict =
        /prepared at a given time|already prepared/i.test((err as Error).message);
      if (conflict && attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
  throw new Error("Não consegui iniciar a gravação de áudio.");
}

export async function startRecording(): Promise<Audio.Recording> {
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
  });

  const recording = await createRecordingWithRetry(VOICE_RECORDING_OPTIONS);
  activeRecording = recording;
  return recording;
}

export async function stopRecording(): Promise<{ uri: string; duration: number }> {
  if (!activeRecording) throw new Error("No active recording");

  await activeRecording.stopAndUnloadAsync();
  const uri = activeRecording.getURI()!;
  const status = await activeRecording.getStatusAsync();
  const duration = Math.floor((status.durationMillis ?? 0) / 1000);
  activeRecording = null;

  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
  });

  return { uri, duration };
}

/**
 * Transcribe audio by sending it to the ai-relay Edge Function.
 * The edge function handles the actual STT call to the configured provider.
 * Returns null when no text was produced. Real failures (network/function
 * errors) are surfaced through `onError` so the caller can show feedback.
 */
export async function transcribeAudio(
  audioUri: string,
  onError?: (message: string) => void
): Promise<TranscriptResult | null> {
  try {
    const file = new FileSystem.File(audioUri);
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const chars = new Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
      chars[i] = String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(chars.join(""));

    const { data, error } = await supabase.functions.invoke("ai-relay", {
      body: {
        action: "transcribe",
        audio: base64,
        mimeType: "audio/m4a",
      },
    });

    if (error) {
      console.warn("[voice] Transcription not available:", error.message);
      onError?.(`Falha ao transcrever: ${error.message}`);
      return null;
    }

    if (data?.text) {
      trackVoiceRecorded(0);
      return { text: data.text, confidence: data.confidence };
    }

    return null;
  } catch (err) {
    console.warn("[voice] Transcription failed:", err);
    onError?.("Falha ao transcrever: " + ((err as Error).message ?? "erro de áudio"));
    return null;
  }
}

// ─── Text-to-Speech ──────────────────────────────────────────────

let ttsPlaying = false;

export async function speak(text: string, options: TTSOptions = {}): Promise<void> {
  if (ttsPlaying) await stopSpeaking();

  // Ensure voice settings are loaded
  const settings = getCachedVoiceSettings();
  if (!settings) await loadVoiceSettings();
  const vs = getCachedVoiceSettings();

  ttsPlaying = true;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

  return new Promise((resolve) => {
    Speech.speak(text, {
      language: options.language ?? "pt-BR",
      rate: options.rate ?? vs.rate,
      pitch: options.pitch ?? vs.pitch,
      voice: options.voice || vs.voice || undefined,
      onDone: () => {
        ttsPlaying = false;
        resolve();
      },
      onStopped: () => {
        ttsPlaying = false;
        resolve();
      },
      onError: () => {
        ttsPlaying = false;
        resolve();
      },
    });
  });
}

export async function stopSpeaking(): Promise<void> {
  if (!ttsPlaying) return;
  await Speech.stop();
  ttsPlaying = false;
}

export function isSpeaking(): boolean {
  return ttsPlaying;
}

export async function getAvailableVoices() {
  const voices = await Speech.getAvailableVoicesAsync();
  return voices.filter(
    (v: any) =>
      v.language?.startsWith("pt") ||
      v.language?.startsWith("en") ||
      v.language?.startsWith("es") ||
      v.language?.startsWith("fr")
  );
}

// ─── Combined: record → transcribe ───────────────────────────────

export async function recordAndTranscribe(
  onProgress?: (duration: number) => void
): Promise<TranscriptResult | null> {
  const recording = await startRecording();

  // Track duration
  const interval = setInterval(async () => {
    if (!activeRecording) {
      clearInterval(interval);
      return;
    }
    const status = await activeRecording.getStatusAsync();
    onProgress?.(Math.floor((status.durationMillis ?? 0) / 1000));
  }, 500);

  const { uri } = await stopRecording();
  clearInterval(interval);

  return transcribeAudio(uri);
}
