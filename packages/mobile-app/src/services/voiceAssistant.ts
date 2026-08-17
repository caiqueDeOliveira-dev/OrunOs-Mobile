// Orun OS — Voice assistant (hands-free)
//
// Machine: the always-listening VAD engine continuously transcribes ambient
// speech; when the phrase starts with "orun" ("orun, toca lofi") the rest is
// executed as a command. "Orun" alone → greeting + captures the spoken
// command (simple silence detection). Routes through executeVoiceCommand,
// speaks the reply, listens again.
//
// The mic is owned by alwaysListeningService while "listening" and by expo-av
// while "capturing". Everything else is orchestrated here.

import { Audio } from "expo-av";
import { speak, stopSpeaking, transcribeAudio, createRecordingWithRetry, VOICE_RECORDING_OPTIONS } from "./voiceService";
import { executeVoiceCommand } from "./commandRouter";
import {
  initAlwaysListening,
  startListening,
  stopListening,
  releaseAlwaysListening,
} from "./alwaysListeningService";
import { setupSpotifyVoiceCommands } from "./spotifyController";
import { initWhatsAppAssistant } from "./whatsappAssistant";

export type AssistantState =
  | "off"          // disabled
  | "idle"         // running but waiting for manual trigger (no wake word)
  | "listening"    // wake word active
  | "waking"       // wake word heard — preparing
  | "greeting"     // speaking the greeting
  | "capturing"    // recording the command
  | "transcribing" // sending audio to ai-relay
  | "thinking"     // routing / agent is replying
  | "speaking";    // speaking the reply

export interface AssistantSnapshot {
  state: AssistantState;
  transcript: string | null;
  reply: string | null;
  wakeAvailable: boolean;
  error: string | null;
}

type Listener = (snapshot: AssistantSnapshot) => void;

const GREETING = "O que o Sr precisa hoje, Caique?";
const FAREWELL = "Até mais! Estou aqui quando precisar.";

// ─── End-phrase detection (conversational mode) ──────────────────────
const END_PHRASE_RE =
  /\b(?:obrigad[oa]|valeu|pode dormir|pode parar|encerrar|até mais|tchau|flw|falou|até logo|nos vemos|pode desligar)\b/i;

function isEndCommand(text: string): boolean {
  return END_PHRASE_RE.test(text.trim());
}

// Phrases that activate the assistant — phonetic variants of "orun" as the
// STT often hears them (Groq transcribes this user's "ok orun" as "oram" or
// "ouru"). Returns the command part, or null if the phrase is not addressed
// to Orun (empty string means "Orun" alone → greet & capture).
//
// Anti-false-positive (desktop lesson v0.6.18): unambiguous variants
// (orun/ourun/orum/ouru/...) trigger alone; ambiguous ones ("oram" is how
// "foram" is also transcribed, "oran", "oron", ...) only count when preceded
// by a strong prefix like "ok"/"oi"/"hey" so everyday speech doesn't wake it.
const STRONG_PREFIX_RE = /^(?:ok|okay|okei|oi|hey|ei|ô|oh)[\s,.:;!?-]+/i;
const ORUN_STRONG_RE =
  /^(?:orun|órun|óron|ourun|orún|orum|ouru)[\s,.:;!?-]*(.*)$/i;
const ORUN_ANY_RE =
  /^(?:orun|órun|óron|ourun|orún|orum|ouru|oram|oran|oron|aron|eron|órson|orim|oreu|oriã|orã)[\s,.:;!?-]*(.*)$/i;

export function extractOrunCommand(text: string): string | null {
  const t = text.trim();

  const direct = t.match(ORUN_STRONG_RE);
  if (direct) return direct[1].trim();

  // Ambiguous variants only count after a strong prefix ("ok oram" ✓,
  // "foram embora" ✗).
  const rest = t.replace(STRONG_PREFIX_RE, "");
  if (rest !== t) {
    const m = rest.match(ORUN_ANY_RE);
    if (m) return m[1].trim();
  }
  return null;
}

// ─── Capture tuning ─────────────────────────────────────────────────
const MAX_CAPTURE_MS = 12_000;
const SPEECH_THRESHOLD_DB = -42;
const SILENCE_TO_STOP_MS = 1_200;
const MIN_SPOKEN_MS = 600;

let state: AssistantState = "off";
let wakeAvailable = false;
let transcript: string | null = null;
let reply: string | null = null;
let error: string | null = null;

const listeners = new Set<Listener>();
let session = 0; // increments to invalidate stale async flows
let integrationsReady = false;

function ensureIntegrations() {
  if (integrationsReady) return;
  integrationsReady = true;
  setupSpotifyVoiceCommands();
  initWhatsAppAssistant();
}

export function getAssistantSnapshot(): AssistantSnapshot {
  return { state, transcript, reply, wakeAvailable, error };
}

function emit() {
  const snapshot = getAssistantSnapshot();
  listeners.forEach((l) => {
    try {
      l(snapshot);
    } catch {
      // ignore listener errors
    }
  });
}

export function subscribeAssistant(listener: Listener): () => void {
  listeners.add(listener);
  listener(getAssistantSnapshot());
  return () => listeners.delete(listener);
}

function setState(next: AssistantState) {
  state = next;
  emit();
}

// ─── Public API ─────────────────────────────────────────────────────

export async function startAssistant(): Promise<void> {
  if (state !== "off") return;
  session += 1;
  ensureIntegrations();

  const mic = await Audio.requestPermissionsAsync();
  if (!mic.granted) {
    error = "Permissão de microfone negada.";
    wakeAvailable = false;
    setState("idle");
    return;
  }

  await initAlwaysListening(onUtterance, (msg) => {
    error = msg;
    emit();
  });
  wakeAvailable = true;
  error = null;
  await startListening();
  setState("listening");
}

export async function stopAssistant(): Promise<void> {
  session += 1;
  await stopSpeaking();
  await stopListening();
  releaseAlwaysListening();
  wakeAvailable = false;
  setState("off");
}

/**
 * Speaks an external announcement (e.g. "chegou mensagem no WhatsApp") only
 * when the assistant is idle or silently listening for the wake word, so we
 * never talk over a command capture or another reply. Returns false if the
 * assistant was busy and the announcement was skipped.
 */
export async function announceExternally(text: string): Promise<boolean> {
  if (state === "off") return false;

  const wasListening = state === "listening";
  const wasIdle = state === "idle";
  if (!wasListening && !wasIdle) return false;

  if (wasListening) {
    await stopListening().catch(() => {});
  }

  setState("speaking");
  await speak(text, { language: "pt-BR", rate: 1.0 });

  if (state === "speaking") {
    if (wakeAvailable) {
      await startListening().catch(() => {});
      setState("listening");
    } else {
      setState("idle");
    }
  }
  return true;
}

/** Manual wake — the floating mic button. Works with or without wake word. */
export async function manualWake(): Promise<void> {
  if (state === "capturing" || state === "transcribing" || state === "thinking") return;
  await stopListening();
  const mySession = ++session;
  await _greetAndCapture(mySession);
}

function onUtterance(text: string) {
  if (state !== "listening") return;
  void _handleUtterance(text);
}

async function _handleUtterance(text: string) {
  const command = extractOrunCommand(text);
  if (command === null) return; // not addressed to Orun — keep listening

  const mySession = ++session;
  await stopListening().catch(() => {});

  if (!command) {
    // "Orun" alone → greet and wait for the spoken command.
    await _greetAndCapture(mySession);
    return;
  }

  // Full phrase ("orun, toca lofi") → execute directly, no greeting.
  transcript = command;
  reply = null;
  error = null;
  setState("transcribing");
  setState("thinking");

  const result = await executeVoiceCommand(command);
  if (mySession !== session) return;

  reply = result.reply;
  if (result.reply === "OK, interrompendo.") {
    await _resumeListening();
    return;
  }

  setState("speaking");
  await speak(result.reply, { language: "pt-BR", rate: 1.0 });
  if (mySession !== session) return;

  await _resumeListening();
}

// ─── Flow ───────────────────────────────────────────────────────────

async function _greetAndCapture(mySession: number) {
  setState("waking");
  transcript = null;
  reply = null;
  error = null;

  setState("greeting");
  await speak(GREETING, { language: "pt-BR", rate: 1.0 });
  if (mySession !== session) return;

  // ─── Conversational loop ──────────────────────────────────────────
  // After executing a command, capture the next one immediately so the
  // user doesn't have to say "ok orun" again. The loop ends when:
  //   • the VAD times out (20 s of silence),
  //   • the user says an end-phrase ("obrigado", "pode dormir"…), or
  //   • the session is invalidated (wake word, manual wake, stop).
  try {
    while (mySession === session) {
      setState("capturing");
      const text = await _captureCommand(mySession);
      if (mySession !== session) return;

      if (!text) break; // VAD timeout → end session

      if (isEndCommand(text)) {
        setState("speaking");
        await speak(FAREWELL, { language: "pt-BR", rate: 1.0 });
        if (mySession !== session) return;
        break;
      }

      transcript = text;
      setState("transcribing");
      setState("thinking");

      const result = await executeVoiceCommand(text);
      if (mySession !== session) return;

      reply = result.reply;
      if (result.reply === "OK, interrompendo.") break;

      setState("speaking");
      await speak(result.reply, { language: "pt-BR", rate: 1.0 });
      if (mySession !== session) return;

      // Loop back → capture next command
    }
  } catch (err) {
    error = `Erro: ${(err as Error).message}`;
    emit();
  }

  await _resumeListening();
}

async function _resumeListening() {
  if (!wakeAvailable) {
    setState("idle");
    return;
  }
  try {
    await startListening();
    setState("listening");
  } catch (err) {
    error = (err as Error).message;
    setState("idle");
  }
}

async function _captureCommand(mySession: number): Promise<string | null> {
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
    shouldDuckAndroid: true,
  });

  // VAD state declared BEFORE the recorder starts — expo-av fires the status
  // callback synchronously inside createAsync (prepare + start), so using
  // variables declared afterwards would throw in the temporal dead zone.
  const startedAt = Date.now();
  let spokenMs = 0;
  let silentMs = 0;
  let lastLevel: number | null = null;

  let recording: Audio.Recording | null = null;
  let finishResolve: (() => void) | null = null;

  const finish = () => {
    finishResolve?.();
    finishResolve = null;
  };

  const onStatusUpdate = async (status: Audio.RecordingStatus) => {
    if (mySession !== session) {
      if (recording) await recording.stopAndUnloadAsync().catch(() => {});
      finish();
      return;
    }
    if (!status.isRecording) return; // prepare-status — not a real stop

    const level = typeof status.metering === "number" ? status.metering : lastLevel;
    lastLevel = level;

    const elapsed = Date.now() - startedAt;
    const isSpeech = level !== null ? level > SPEECH_THRESHOLD_DB : elapsed < MIN_SPOKEN_MS;

    if (isSpeech) {
      spokenMs = elapsed;
      silentMs = 0;
    } else if (spokenMs > MIN_SPOKEN_MS) {
      silentMs += 250;
    }

    const shouldStop =
      elapsed >= MAX_CAPTURE_MS ||
      (silentMs >= SILENCE_TO_STOP_MS && spokenMs >= MIN_SPOKEN_MS);

    if (shouldStop) {
      if (recording) await recording.stopAndUnloadAsync().catch(() => {});
      finish();
    }
  };

  try {
    const options: Audio.RecordingOptions = {
      ...VOICE_RECORDING_OPTIONS,
      isMeteringEnabled: true,
    };

    recording = await createRecordingWithRetry(options, onStatusUpdate, 250);
  } catch (err) {
    error = `Não consegui abrir o microfone: ${(err as Error).message}`;
    emit();
    return null;
  }

  // Block until the recording stops (VAD decision, timeout, or session death).
  await new Promise<void>((resolve) => {
    finishResolve = resolve;
  });

  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
  });

  const uri = recording!.getURI();
  if (!uri) return null;

  const result = await transcribeAudio(uri, (msg) => {
    error = msg;
    emit();
  });
  return result?.text ?? null;
}
