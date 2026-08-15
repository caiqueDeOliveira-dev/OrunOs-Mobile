import { describe, it, expect, vi } from "vitest";

vi.mock("expo-av", () => ({
  Audio: {
    requestPermissionsAsync: vi.fn(async () => ({ granted: true })),
    setAudioModeAsync: vi.fn(async () => {}),
    Recording: { createAsync: vi.fn(async () => ({ recording: {} })) },
    RecordingOptionsPresets: { HIGH_QUALITY: {} },
  },
}));

vi.mock("./voiceService", () => ({
  speak: vi.fn(async () => {}),
  stopSpeaking: vi.fn(async () => {}),
  transcribeAudio: vi.fn(async () => null),
  VOICE_RECORDING_OPTIONS: {},
}));

vi.mock("./commandRouter", () => ({
  executeVoiceCommand: vi.fn(async (text: string) => ({ handled: true, reply: `ok: ${text}` })),
}));

vi.mock("./alwaysListeningService", () => ({
  initAlwaysListening: vi.fn(async () => true),
  startListening: vi.fn(async () => {}),
  stopListening: vi.fn(async () => {}),
  releaseAlwaysListening: vi.fn(),
}));

vi.mock("./spotifyController", () => ({
  setupSpotifyVoiceCommands: vi.fn(),
}));

vi.mock("./whatsappAssistant", () => ({
  initWhatsAppAssistant: vi.fn(),
}));

const { extractOrunCommand } = await import("./voiceAssistant");

describe("extractOrunCommand", () => {
  it.each([
    ["orun, toca lofi", "toca lofi"],
    ["ok orun toca lofi", "toca lofi"],
    ["okay orun, toca lofi", "toca lofi"],
    ["ok, orun pausa a música", "pausa a música"],
    ["hey orun, que horas são?", "que horas são?"],
    ["ei orun, abre o spotify", "abre o spotify"],
    ["orum, pula a música", "pula a música"],
    ["Oi orun, que horas são?", "que horas são?"],
    ["Orun o que tá tocando?", "o que tá tocando?"],
    ["oran, pausa a música", "pausa a música"],
    ["oron, pula a música", "pula a música"],
    ["orun", ""],
    ["ok orun", ""],
    ["toca lofi", null],
    ["o orun é bonito", null],
    ["oram, não era isso", null],
  ])("extractOrunCommand(%s) → %s", (input, expected) => {
    expect(extractOrunCommand(input)).toBe(expected);
  });
});
