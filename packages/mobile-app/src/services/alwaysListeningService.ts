// Orun OS — Always-listening VAD service
//
// Replaces the Picovoice Porcupine wake word (Picovoice discontinued its free
// tier on 2026-06-30; no free AccessKeys anymore).
//
// How it works: while active, the microphone records continuously. An
// energy-based VAD (audio metering) detects when the user starts speaking;
// after a short silence the utterance is transcribed via ai-relay (Groq
// Whisper — free, already configured) and handed to the voice assistant,
// which only acts when the phrase starts with "orun".
//
// The mic is owned by this module while running; the voice assistant stops
// it before speaking (so its own replies are never transcribed) and restarts
// it afterwards.

import { Audio } from "expo-av";
import { transcribeAudio, createRecordingWithRetry } from "./voiceService";

// ─── VAD tuning ─────────────────────────────────────────────────────
const SPEECH_THRESHOLD_DB = -42;
const SILENCE_TO_STOP_MS = 1_000; // silence after speech → end utterance
const MIN_SPOKEN_MS = 500; // ignore clicks/coughs
const MAX_UTTERANCE_MS = 15_000; // hard cap per utterance
const IDLE_RESET_MS = 8_000; // long silence → drop capture (no speech yet)
const MIN_TEXT_LEN = 2;

type UtteranceHandler = (text: string) => void;
type ErrorHandler = (message: string) => void;

let active = false;
let generation = 0; // invalidates stale capture loops
let recordingRef: Audio.Recording | null = null;
let finishResolve: ((text: string | null) => void) | null = null;
let pendingCapture: Promise<void> | null = null; // in-flight _capture, awaited on stop
let onUtterance: UtteranceHandler | null = null;
let onError: ErrorHandler | null = null;

/** Always available — this is the built-in (free) listener. */
export function isListeningConfigured(): boolean {
  return true;
}

/**
 * Registers the utterance handler. Called once when the assistant starts.
 * Resolves true (always — no native module or key required).
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
  // Wait for the in-flight capture to fully release the native recorder, so a
  // later startListening / capture never races with an unloaded one.
  const p = pendingCapture;
  pendingCapture = null;
  if (p) await p;
}

export function releaseAlwaysListening(): void {
  onUtterance = null;
  onError = null;
}

// ─── Capture loop ───────────────────────────────────────────────────

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

/** Records one utterance (speech + trailing silence) and transcribes it. */
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
      ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
      isMeteringEnabled: true,
    };
    recording = await createRecordingWithRetry(options, onStatus, 250);
    if (gen !== generation || !active) {
      // A stop happened while the recorder was being prepared — release it
      // right away so a later start/capture can record again.
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

  const startedAt = Date.now();
  let spokenMs = 0;
  let silentMs = 0;
  let idleMs = 0;
  let lastLevel: number | null = null;

  async function onStatus(status: Audio.RecordingStatus) {
    if (!active || gen !== generation || !status.isRecording) {
      finishCapture(null);
      return;
    }

    const level = typeof status.metering === "number" ? status.metering : lastLevel;
    lastLevel = level;

    const elapsed = Date.now() - startedAt;
    const isSpeech = level !== null ? level > SPEECH_THRESHOLD_DB : elapsed < MIN_SPOKEN_MS;

    if (isSpeech) {
      spokenMs = elapsed;
      silentMs = 0;
      idleMs = 0;
    } else if (spokenMs >= MIN_SPOKEN_MS) {
      silentMs += 250;
    } else {
      idleMs += 250;
    }

    // Long silence with no speech yet → drop this capture, listen again.
    if (idleMs >= IDLE_RESET_MS) {
      await recording.stopAndUnloadAsync().catch(() => {});
      finishCapture(null);
      return;
    }

    const shouldStop =
      elapsed >= MAX_UTTERANCE_MS ||
      (silentMs >= SILENCE_TO_STOP_MS && spokenMs >= MIN_SPOKEN_MS);

    if (!shouldStop) return;

    await recording.stopAndUnloadAsync().catch(() => {});
    const uri = recording.getURI();
    if (!uri) {
      finishCapture(null);
      return;
    }

    let text: string | null = null;
    try {
      const result = await transcribeAudio(uri);
      text = result?.text ?? null;
    } catch (err) {
      onError?.(`Falha ao transcrever: ${(err as Error).message}`);
    }

    const clean = text?.trim() ?? "";
    finishCapture(clean.length >= MIN_TEXT_LEN ? clean : null);
  }
}
