import { describe, it, expect, vi, beforeEach } from "vitest";

const openURLMock = vi.fn(async () => true);
vi.mock("expo-linking", () => ({
  default: { openURL: (...a: any[]) => openURLMock(...a) },
  openURL: (...a: any[]) => openURLMock(...a),
}));

const scheduleMock = vi.fn(async () => "notif-id");
vi.mock("expo-notifications", () => ({
  setNotificationHandler: vi.fn(),
  scheduleNotificationAsync: (...a: any[]) => scheduleMock(...a),
}));

vi.mock("react-native", async () => {
  const actual = await vi.importActual("react-native");
  return { ...actual, Platform: { OS: "android", select: (o: any) => o.android ?? o.default } };
});

const { appLauncherHandler } = await import("./appLauncherController");
const { reminderHandler } = await import("./reminderController");
const { phoneHandler } = await import("./phoneController");
const { systemInfoHandler } = await import("./systemController");
const { settingsHandler } = await import("./settingsController");

beforeEach(() => {
  openURLMock.mockReset();
  scheduleMock.mockReset();
});

describe("appLauncherHandler", () => {
  it("opens WhatsApp", () => {
    expect(appLauncherHandler("abre o whatsapp")).toContain("Abrindo whatsapp");
    expect(openURLMock).toHaveBeenCalledWith("whatsapp://");
  });

  it("opens YouTube", () => {
    expect(appLauncherHandler("abre o youtube")).toContain("Abrindo youtube");
    expect(openURLMock).toHaveBeenCalledWith("vnd.youtube://");
  });

  it("opens Instagram", () => {
    expect(appLauncherHandler("abre o instagram")).toContain("Abrindo instagram");
  });

  it("opens Telegram", () => {
    expect(appLauncherHandler("abrir o telegram")).toContain("Abrindo telegram");
  });

  it("opens Google Maps", () => {
    expect(appLauncherHandler("abre o google maps")).toContain("Abrindo google maps");
  });

  it("opens Waze", () => {
    expect(appLauncherHandler("abre o waze")).toContain("Abrindo waze");
  });

  it("opens Netflix", () => {
    expect(appLauncherHandler("liga o netflix")).toContain("Abrindo netflix");
  });

  it("returns null for non-matching text", () => {
    expect(appLauncherHandler("qual é a Capital da França")).toBeNull();
  });

  it("returns null for 'abre o chat' (internal navigation)", () => {
    expect(appLauncherHandler("abre o chat")).toBeNull();
  });
});

describe("reminderHandler", () => {
  it("schedules a reminder in minutes", () => {
    const res = reminderHandler("me lembra de ligar pro João em 30 minutos");
    expect(res).toContain("Lembrete agendado");
    expect(res).toContain("ligar pro joão");
    expect(scheduleMock).toHaveBeenCalled();
  });

  it("schedules a reminder in hours", () => {
    const res = reminderHandler("lembrete de comprar pão em 2 horas");
    expect(res).toContain("Lembrete agendado");
  });

  it("asks what to remember when content is missing", () => {
    expect(reminderHandler("me lembra")).toContain("O que você quer");
  });

  it("returns null for non-matching text", () => {
    expect(reminderHandler("abre o whatsapp")).toBeNull();
  });
});

describe("phoneHandler", () => {
  it("opens dialer for a call", () => {
    const res = phoneHandler("liga pro João");
    expect(res).toContain("discador");
    expect(res).toContain("joão");
    expect(openURLMock).toHaveBeenCalledWith("tel:");
  });

  it("opens SMS for a message", () => {
    const res = phoneHandler("manda mensagem pro Pedro");
    expect(res).toContain("mensagens");
    expect(res).toContain("pedro");
    expect(openURLMock).toHaveBeenCalledWith("sms:");
  });

  it("returns null for non-matching text", () => {
    expect(phoneHandler("abre o youtube")).toBeNull();
  });
});

describe("systemInfoHandler", () => {
  it("returns the current time", () => {
    const res = systemInfoHandler("que horas são?");
    expect(res).toMatch(/São \d+/);
  });

  it("returns the current date", () => {
    const res = systemInfoHandler("que dia é hoje?");
    expect(res).toContain("Hoje é");
  });

  it("calculates simple math", () => {
    const res = systemInfoHandler("quanto é 2 + 3");
    expect(res).toContain("5");
  });

  it("calculates multiplication", () => {
    const res = systemInfoHandler("quanto é 7 x 8");
    expect(res).toContain("56");
  });

  it("returns null for non-matching text", () => {
    expect(systemInfoHandler("abre o whatsapp")).toBeNull();
  });
});

describe("settingsHandler", () => {
  it("opens WiFi settings", () => {
    const res = settingsHandler("liga o WiFi");
    expect(res).toContain("WiFi");
    expect(openURLMock).toHaveBeenCalledWith("android.settings.WIFI_SETTINGS");
  });

  it("opens Bluetooth settings", () => {
    const res = settingsHandler("liga o bluetooth");
    expect(res).toContain("Bluetooth");
    expect(openURLMock).toHaveBeenCalledWith("android.settings.BLUETOOTH_SETTINGS");
  });

  it("opens display settings for brightness", () => {
    const res = settingsHandler("abre o brilho");
    expect(res).toContain("brilho");
    expect(openURLMock).toHaveBeenCalledWith("android.settings.DISPLAY_SETTINGS");
  });

  it("opens sound settings for volume", () => {
    const res = settingsHandler("ajusta o volume");
    expect(res).toContain("som");
    expect(openURLMock).toHaveBeenCalledWith("android.settings.SOUND_SETTINGS");
  });

  it("returns null for non-matching text", () => {
    expect(settingsHandler("que horas são")).toBeNull();
  });
});
