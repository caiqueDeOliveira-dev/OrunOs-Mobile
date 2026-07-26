import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@sentry/react-native", () => ({
  default: {
    init: vi.fn(),
    captureException: vi.fn(),
    captureMessage: vi.fn(),
    withScope: vi.fn((_cb: any) => {}),
  },
}));

const { initSentry, captureError, captureMessage } = await import("./sentryService");

describe("sentryService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initSentry does not throw when DSN is empty", () => {
    expect(() => initSentry()).not.toThrow();
  });

  it("captureError is a noop when DSN is empty", () => {
    expect(() => captureError(new Error("test"))).not.toThrow();
  });

  it("captureMessage is a noop when DSN is empty", () => {
    expect(() => captureMessage("test message")).not.toThrow();
    expect(() => captureMessage("test", "error")).not.toThrow();
  });
});
