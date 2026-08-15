import { describe, it, expect, vi, beforeEach } from "vitest";

const openURLMock = vi.fn(async () => {});

vi.mock("expo-linking", () => ({
  openURL: (...args: unknown[]) => openURLMock(...args),
}));

const spotifyMock = {
  isSpotifyConfigured: vi.fn(() => true),
  isSpotifyConnected: vi.fn(async () => true),
  connectSpotify: vi.fn(async () => true),
  spotifyPlay: vi.fn(async () => {}),
  spotifyPause: vi.fn(async () => {}),
  spotifyNext: vi.fn(async () => {}),
  spotifyPrevious: vi.fn(async () => {}),
  getCurrentlyPlaying: vi.fn(async () => null),
  playTrackByName: vi.fn(async () => null),
};

vi.mock("./spotifyService", () => spotifyMock);

let handler: ((text: string) => Promise<string | null> | string | null) | null = null;

vi.mock("./commandRouter", () => ({
  registerVoiceCommandHandler: (fn: (text: string) => Promise<string | null> | string | null) => {
    handler = fn;
  },
}));

const { setupSpotifyVoiceCommands } = await import("./spotifyController");

beforeEach(() => {
  openURLMock.mockReset();
  openURLMock.mockResolvedValue(undefined);
  Object.values(spotifyMock).forEach((fn) => fn.mockClear?.());
  spotifyMock.isSpotifyConfigured.mockReturnValue(true);
  spotifyMock.isSpotifyConnected.mockResolvedValue(true);
  setupSpotifyVoiceCommands();
});

async function run(text: string): Promise<string | null> {
  if (!handler) throw new Error("handler not registered");
  return handler(text);
}

describe("setupSpotifyVoiceCommands", () => {
  it('opens the Spotify app on "abre o spotify"', async () => {
    const reply = await run("abre o spotify");
    expect(reply).toContain("Abrindo o Spotify");
    expect(openURLMock).toHaveBeenCalledWith("spotify://");
  });

  it('opens the Spotify app on "liga o spotify" without needing OAuth', async () => {
    spotifyMock.isSpotifyConnected.mockResolvedValue(false);
    const reply = await run("liga o spotify");
    expect(reply).toContain("Abrindo o Spotify");
    expect(openURLMock).toHaveBeenCalledWith("spotify://");
  });

  it("reports when the Spotify app cannot be opened", async () => {
    openURLMock.mockRejectedValue(new Error("no handler"));
    const reply = await run("abre o spotify");
    expect(reply).toContain("Não consegui abrir o Spotify");
  });

  it('skips a command with "spotify" but no open verb', async () => {
    const reply = await run("o que você acha do spotify?");
    expect(reply).toBeNull();
  });

  it('skips a command without any music intent', async () => {
    const reply = await run("me conta uma piada");
    expect(reply).toBeNull();
  });

  it("returns NOT_CONNECTED for playback commands when disconnected", async () => {
    spotifyMock.isSpotifyConnected.mockResolvedValue(false);
    const reply = await run("pula a música");
    expect(reply).toContain("conectar spotify");
    expect(spotifyMock.spotifyNext).not.toHaveBeenCalled();
  });

  it("plays on 'dar play'", async () => {
    const reply = await run("dar play");
    expect(reply).toBe("Tocando.");
    expect(spotifyMock.spotifyPlay).toHaveBeenCalled();
  });

  it('pauses on "pausa a música"', async () => {
    const reply = await run("pausa a música");
    expect(reply).toBe("Música pausada.");
    expect(spotifyMock.spotifyPause).toHaveBeenCalled();
  });

  it('skips on "pula a música"', async () => {
    const reply = await run("pula a música");
    expect(reply).toBe("Pulando para a próxima música.");
    expect(spotifyMock.spotifyNext).toHaveBeenCalled();
  });

  it('goes back on "volta a música"', async () => {
    const reply = await run("volta a música");
    expect(reply).toBe("Voltando para a música anterior.");
    expect(spotifyMock.spotifyPrevious).toHaveBeenCalled();
  });

  it('searches and plays on "toca lofi"', async () => {
    spotifyMock.playTrackByName.mockResolvedValue({
      name: "Lofi Study",
      artists: "Lofi Girl",
    });
    const reply = await run("toca lofi");
    expect(spotifyMock.playTrackByName).toHaveBeenCalledWith("lofi");
    expect(reply).toBe("Tocando Lofi Study, de Lofi Girl.");
  });

  it('resumes playback on "toca a música" instead of searching', async () => {
    const reply = await run("toca a música");
    expect(reply).toBe("Tocando.");
    expect(spotifyMock.playTrackByName).not.toHaveBeenCalled();
    expect(spotifyMock.spotifyPlay).toHaveBeenCalled();
  });

  it("reports when no active device is found", async () => {
    spotifyMock.spotifyNext.mockRejectedValue(new Error("spotify_error:404"));
    const reply = await run("pula a música");
    expect(reply).toContain("dispositivo do Spotify ativo");
  });

  it("asks to reconnect when the token expired", async () => {
    spotifyMock.spotifyNext.mockRejectedValue(new Error("spotify_reauth_required"));
    const reply = await run("pula a música");
    expect(reply).toContain("conectar spotify");
  });

  it("says what is playing", async () => {
    spotifyMock.getCurrentlyPlaying.mockResolvedValue({
      is_playing: true,
      item: { name: "Blinding Lights", artists: [{ name: "The Weeknd" }] },
      progress_ms: 1000,
      duration_ms: 200000,
    });
    const reply = await run("o que tá tocando?");
    expect(reply).toBe("Está tocando Blinding Lights, de The Weeknd.");
  });

  it('runs the connect flow on "conectar spotify"', async () => {
    const reply = await run("conectar spotify");
    expect(reply).toBe("Spotify conectado. Pode pedir para tocar música.");
    expect(spotifyMock.connectSpotify).toHaveBeenCalled();
  });
});
