import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("posthog-react-native", () => ({
  default: vi.fn().mockImplementation(() => ({
    identify: vi.fn(),
    capture: vi.fn(),
    screen: vi.fn(),
    flush: vi.fn(),
    shutdown: vi.fn(),
  })),
}));

const { initAnalytics, identify, track, trackScreen, trackChatSent, trackVoiceRecorded, trackAutomationTriggered, flush, shutdown } = await import("./analyticsService");

describe("analyticsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initAnalytics does not throw when POSTHOG_KEY is empty", async () => {
    await expect(initAnalytics()).resolves.toBeUndefined();
  });

  it("identify is a noop", () => {
    expect(() => identify("user-1")).not.toThrow();
    expect(() => identify("user-1", { name: "test" })).not.toThrow();
  });

  it("track is a noop", () => {
    expect(() => track("event")).not.toThrow();
    expect(() => track("event", { key: "val" })).not.toThrow();
  });

  it("trackScreen is a noop", () => {
    expect(() => trackScreen("Home")).not.toThrow();
  });

  it("trackChatSent is a noop", () => {
    expect(() => trackChatSent("hampton", "groq")).not.toThrow();
  });

  it("trackVoiceRecorded is a noop", () => {
    expect(() => trackVoiceRecorded(5)).not.toThrow();
  });

  it("trackAutomationTriggered is a noop", () => {
    expect(() => trackAutomationTriggered("auto-1", "cron")).not.toThrow();
  });

  it("flush is a noop", () => {
    expect(() => flush()).not.toThrow();
  });

  it("shutdown is a noop", () => {
    expect(() => shutdown()).not.toThrow();
  });
});
