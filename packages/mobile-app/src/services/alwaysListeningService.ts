// Orun OS — Always-listening VAD service (time-based)
//
// Records short fixed-duration windows and transcribes each one via
// Groq Whisper. The text is handed to the voice assistant which only
// acts when the phrase starts with "orun".
//
// This approach works reliably on ALL Android devices (Xiaomi, Samsung,
// Pixel...) because it doesn't depend on expo-av metering which can be
// null or inaccurate on some devices.

import { Audio } from "expo-av";
import { transcribeAudio, createRecordingWithRetry, VOICE_RECORDING_OPTIONS } from "./voiceService";

// ─── Config ─────────────────────────────────────────────────────
const RECORD_MS = 3_000;    // record 3 seconds per window
const PAUSE_MS = 300;       // brief pause between windows
const MIN_TEXT_LEN = 2;

type UtteranceHandler = (text: string) => void;
type ErrorHandler = (message: string) => void;

let active = false;
let generation = 0;
let recordingRef: Audio.Recording | null = null;
let finishResolve: ((text: string | null) => void) | null = null;
let pendingCapture: Promise<void> | null = null;
let onUtterance: UtteranceHandler | null = null;
let onError: ErrorHandler | null = null;

/** Always available — this is the built-in (free) listener. */
export function isListeningConfigured(): boolean {
  return true;
}

/**
 * Registers the utterance handler. Called once when the assistant starts.
 */
export async function initAlwaysListening(
  utterance: UtteranceHandler,
  err: ErrorHandler,
): Promise<boolean> {
  onUtterance = utterance;
  onError = err;
  return true;
}

export async function startListening(): Promise<void> {
  if (active) return;
  const gen = ++generation;
  active = true;
  void runLoop(gen);
}

export async function stopListening(): Promise<void> {
  generation += 1;
  active = false;
  await stopCurrentRecording();
  const p = pendingCapture;
  pendingCapture = null;
  if (p) await p;
}

export function releaseAlwaysListening(): void {
  onUtterance = null;
  onError = null;
}

// ─── Capture loop ───────────────────────────────────────────────

async function runLoop(gen: number): Promise<void> {
  while (active && gen === generation) {
    const text = await captureUtterance(gen);
    if (!active || gen !== generation) break;
    if (text && onUtterance) {
      try {
        onUtterance(text);
      } catch {
        // listener errors are ignored
      }
    }
    // Brief pause between windows to release the mic
    await sleep(PAUSE_MS);
  }
}

function finishCapture(text: string | null): void {
  const resolve = finishResolve;
  finishResolve = null;
  resolve?.(text);
}

async function stopCurrentRecording(): Promise<void> {
  const rec = recordingRef;
  recordingRef = null;
  if (rec) {
    try {
      await rec.stopAndUnloadAsync();
    } catch {
      // already stopped
    }
  }
  finishCapture(null);
}

/** Records one fixed-duration window and transcribes it. */
async function captureUtterance(gen: number): Promise<string | null> {
  if (finishResolve) return null;
  return await new Promise<string | null>((resolve) => {
    finishResolve = resolve;
    pendingCapture = _capture(resolve, gen);
  });
}

async function _capture(
  resolve: (text: string | null) => void,
  gen: number
): Promise<void> {
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
    shouldDuckAndroid: true,
  });

  let recording: Audio.Recording;
  try {
    const options: Audio.RecordingOptions = {
      ...VOICE_RECORDING_OPTIONS,
      isMeteringEnabled: false,
    };
    recording = await createRecordingWithRetry(options, undefined, 0);
    if (gen !== generation || !active) {
      await recording.stopAndUnloadAsync().catch(() => {});
      finishCapture(null);
      return;
    }
    recordingRef = recording;
  } catch (err) {
    onError?.(`Não consegui abrir o microfone: ${(err as Error).message}`);
    finishCapture(null);
    return;
  }

  // Wait the fixed recording duration, checking for stop signal
  const endAt = Date.now() + RECORD_MS;
  while (Date.now() < endAt && active && gen === generation) {
    await sleep(250);
  }

  // Stop recording
  if (!active || gen !== generation) {
    await recording.stopAndUnloadAsync().catch(() => {});
    finishCapture(null);
    return;
  }

  try {
    await recording.stopAndUnloadAsync();
  } catch {
    finishCapture(null);
    return;
  }

  const uri = recording.getURI();
  recordingRef = null;
  if (!uri) {
    finishCapture(null);
    return;
  }

  // Transcribe
  let text: string | null = null;
  try {
    const result = await transcribeAudio(uri, (msg) => onError?.(msg));
    text = result?.text ?? null;
  } catch (err) {
    onError?.(`Falha ao transcrever: ${(err as Error).message}`);
  }

  const clean = text?.trim() ?? "";
  finishCapture(clean.length >= MIN_TEXT_LEN ? clean : null);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
