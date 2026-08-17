import { describe, it, expect, vi } from "vitest";

vi.mock("./supabaseClient", () => ({
  supabase: {
    channel: () => ({ on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }) }),
  },
}));

vi.mock("expo-router", () => ({
  router: { push: vi.fn(), back: vi.fn() },
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

vi.mock("./voiceAssistant", () => ({
  announceExternally: vi.fn(async () => true),
}));

vi.mock("./chatService", () => ({
  sendMessage: vi.fn(async () => ({ content: "ok" })),
}));

const { matchesReadText, extractReplyText } = await import("./whatsappAssistant");

describe("whatsappAssistant voice matching", () => {
  describe("matchesReadText", () => {
    it.each([
      "ler o whatsapp",
      "lê o whatsapp",
      "ler whatsapp",
      "ler as mensagens do whatsapp",
      "ler a última mensagem",
      "ler ultima mensagem",
      "ler mensagens",
      "qual foi a última mensagem",
      "qual é a ultima msg",
    ])("matches read command: %s", (cmd) => {
      expect(matchesReadText(cmd)).toBe(true);
    });

    it.each([
      "toca uma música",
      "liga o spotify",
      "que horas são",
      "responde o whatsapp que vou chegar atrasado",
    ])("does not match: %s", (cmd) => {
      expect(matchesReadText(cmd)).toBe(false);
    });
  });

  describe("extractReplyText", () => {
    it("extracts reply after 'responde o whatsapp'", () => {
      expect(extractReplyText("responde o whatsapp que vou chegar atrasado")).toBe(
        "que vou chegar atrasado",
      );
    });

    it("extracts reply after 'responde pra ele'", () => {
      expect(extractReplyText("responde pra ele sim, pode confirmar")).toBe(
        "sim, pode confirmar",
      );
    });

    it("extracts reply after 'responder whatsapp' with colon", () => {
      expect(extractReplyText("responder whatsapp: obrigado pela resposta")).toBe(
        "obrigado pela resposta",
      );
    });

    it("returns null when there is no reply text", () => {
      expect(extractReplyText("responde o whatsapp")).toBeNull();
      expect(extractReplyText("toca lofi")).toBeNull();
    });
  });
});
