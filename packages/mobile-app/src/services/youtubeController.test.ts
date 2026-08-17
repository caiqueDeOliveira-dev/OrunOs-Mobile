import { describe, it, expect, vi, beforeEach } from "vitest";

const openURLMock = vi.fn(async () => true);

vi.mock("expo-linking", () => ({
  default: { openURL: (...args: any[]) => openURLMock(...args) },
  openURL: (...args: any[]) => openURLMock(...args),
}));

let capturedHandler: ((text: string) => Promise<string | null>) | null = null;

vi.mock("./commandRouter", () => ({
  registerVoiceCommandHandler: vi.fn((handler: any) => {
    capturedHandler = handler;
    return () => {};
  }),
}));

describe("setupYouTubeVoiceCommands", () => {
  beforeEach(async () => {
    openURLMock.mockReset();
    capturedHandler = null;
    vi.resetModules();
    const { setupYouTubeVoiceCommands } = await import("./youtubeController");
    setupYouTubeVoiceCommands();
  });

  it("opens YouTube app", async () => {
    openURLMock.mockResolvedValueOnce(true);
    const reply = await capturedHandler!("abre o youtube");
    expect(reply).toBe("Abrindo o YouTube.");
    expect(openURLMock).toHaveBeenCalledWith("youtube://");
  });

  it("opens YouTube via fallback URL", async () => {
    openURLMock.mockRejectedValueOnce(new Error("no app"));
    openURLMock.mockResolvedValueOnce(true);
    const reply = await capturedHandler!("abre o youtube");
    expect(reply).toBe("Abrindo o YouTube.");
    expect(openURLMock).toHaveBeenCalledWith("https://www.youtube.com");
  });

  it("reports failure when YouTube not installed", async () => {
    openURLMock.mockRejectedValue(new Error("no app"));
    const reply = await capturedHandler!("abre o youtube");
    expect(reply).toContain("Não consegui abrir");
  });

  it("searches on YouTube with deep link", async () => {
    openURLMock.mockResolvedValue(true);
    const reply = await capturedHandler!("pesquisa no youtube receita de bolo");
    expect(reply).toContain("Pesquisando");
    expect(reply).toContain("receita de bolo");
    expect(openURLMock).toHaveBeenCalledWith(expect.stringContaining("youtube://results?search_query="));
  });

  it("searches via web fallback", async () => {
    openURLMock.mockRejectedValueOnce(new Error("no app"));
    openURLMock.mockResolvedValueOnce(true);
    const reply = await capturedHandler!("pesquisa no youtube musicas relaxantes");
    expect(reply).toContain("Pesquisando");
    expect(openURLMock).toHaveBeenCalledWith(expect.stringContaining("https://www.youtube.com/results?search_query="));
  });

  it("searches with simplified syntax", async () => {
    openURLMock.mockResolvedValue(true);
    const reply = await capturedHandler!("youtube lofi beats");
    expect(reply).toContain("Pesquisando");
    expect(reply).toContain("lofi beats");
  });

  it("asks for query when empty", async () => {
    const reply = await capturedHandler!("pesquisa no youtube");
    expect(reply).toContain("O que você quer pesquisar");
  });

  it("ignores non-YouTube commands", async () => {
    const reply = await capturedHandler!("abre o spotify");
    expect(reply).toBeNull();
  });
});
