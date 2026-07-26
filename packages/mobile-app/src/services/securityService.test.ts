import { describe, it, expect, vi, beforeEach } from "vitest";

const isRootedMock = vi.fn().mockResolvedValue(false);

vi.mock("expo-device", () => ({
  isRootedExperimentalAsync: (...args: any[]) => isRootedMock(...args),
}));

vi.mock("expo-haptics", () => ({
  notificationAsync: vi.fn(),
  NotificationFeedbackType: { Warning: "warning" },
}));

vi.mock("react-native", () => ({
  Platform: { OS: "ios" },
  Alert: { alert: vi.fn() },
}));

const { checkDeviceSecurity, isRooted } = await import("./securityService");

describe("securityService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isRootedMock.mockResolvedValue(false);
  });

  it("isRooted returns false by default", () => {
    expect(isRooted()).toBe(false);
  });

  it("checkDeviceSecurity returns rooted: false when device is clean", async () => {
    const result = await checkDeviceSecurity();
    expect(result.rooted).toBe(false);
    expect(result.warning).toBeNull();
  });

  it("checkDeviceSecurity returns warning when device is rooted", async () => {
    isRootedMock.mockResolvedValue(true);
    const result = await checkDeviceSecurity();
    expect(result.rooted).toBe(true);
    expect(result.warning).toContain("jailbreak");
  });

  it("checkDeviceSecurity handles expo-device errors gracefully", async () => {
    isRootedMock.mockRejectedValue(new Error("not supported"));
    const result = await checkDeviceSecurity();
    expect(result.rooted).toBe(false);
    expect(result.warning).toBeNull();
  });
});
