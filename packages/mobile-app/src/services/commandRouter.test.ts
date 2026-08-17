import { describe, it, expect, vi, beforeEach } from "vitest";

const pushMock = vi.fn();

vi.mock("expo-router", () => ({
  router: { push: (...args: any[]) => pushMock(...args) },
}));

vi.mock("expo-linking", () => ({
  default: { openURL: vi.fn(async () => true) },
  openURL: vi.fn(async () => true),
}));

vi.mock("expo-notifications", () => ({
  setNotificationHandler: vi.fn(),
  scheduleNotificationAsync: vi.fn(async () => "notif-id"),
}));

vi.mock("react-native", async () => {
  const actual = await vi.importActual("react-native");
  return { ...actual, Platform: { OS: "android", select: (o: any) => o.android ?? o.default } };
});

vi.mock("./chatService", () => ({
  sendVoiceMessage: vi.fn(async (agentId: string, content: string) => ({
    conversationId: "conv-1",
    reply: `agente respondeu: ${content}`,
  })),
}));

const { executeVoiceCommand, registerVoiceCommandHandler } = await import("./commandRouter");

describe("executeVoiceCommand", () => {
  beforeEach(() => pushMock.mockReset());

  it("answers the time", async () => {
    const res = await executeVoiceCommand("que horas são?");
    expect(res.handled).toBe(true);
    expect(res.reply).toMatch(/São \d+/);
  });

  it("answers the date", async () => {
    const res = await executeVoiceCommand("que dia é hoje");
    expect(res.reply).toMatch(/Hoje é /);
  });

  it("interrupts on cancel", async () => {
    const res = await executeVoiceCommand("cancelar");
    expect(res.reply).toBe("OK, interrompendo.");
  });

  it("navigates to the chat screen", async () => {
    const res = await executeVoiceCommand("abre o chat");
    expect(res.reply).toContain("Abrindo chat");
    expect(pushMock).toHaveBeenCalledWith("/(tabs)/chat");
  });

  it("navigates to settings", async () => {
    const res = await executeVoiceCommand("vai para as configurações");
    expect(res.reply).toContain("Abrindo configurações");
    expect(pushMock).toHaveBeenCalledWith("/(tabs)/settings");
  });

  it("does not navigate on a plain mention of a screen name", async () => {
    const res = await executeVoiceCommand("o que você acha do chat?");
    expect(res.viaAgent).toBe(true);
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("calls registered handlers before falling back to the agent", async () => {
    registerVoiceCommandHandler((text) => (text.includes("spotify") ? "Spotify conectado." : null));

    const res = await executeVoiceCommand("liga o spotify");
    expect(res.reply).toBe("Spotify conectado.");
    expect(res.viaAgent).toBeUndefined();
  });

  it("falls back to the Hampton agent", async () => {
    const res = await executeVoiceCommand("me conte uma piada");
    expect(res.viaAgent).toBe(true);
    expect(res.reply).toContain("agente respondeu");
  });

  it("returns a reply for empty input", async () => {
    const res = await executeVoiceCommand("   ");
    expect(res.handled).toBe(true);
    expect(res.reply).toContain("Não entendi");
  });
});
