import { describe, it, expect, vi, beforeEach } from "vitest";

const { registerTaskMock, unregisterTaskMock, isRegisteredMock, defineTaskMock } = vi.hoisted(() => ({
  registerTaskMock: vi.fn().mockResolvedValue(undefined),
  unregisterTaskMock: vi.fn().mockResolvedValue(undefined),
  isRegisteredMock: vi.fn().mockResolvedValue(false),
  defineTaskMock: vi.fn(),
}));

vi.mock("expo-background-fetch", () => ({
  BackgroundFetchResult: { NoData: 0, NewData: 1, Failed: 2 },
  registerTaskAsync: (...args: any[]) => registerTaskMock(...args),
  unregisterTaskAsync: (...args: any[]) => unregisterTaskMock(...args),
}));

vi.mock("expo-task-manager", () => ({
  defineTask: (...args: any[]) => defineTaskMock(...args),
  isTaskRegisteredAsync: (...args: any[]) => isRegisteredMock(...args),
}));

vi.mock("./supabaseClient", () => ({
  supabase: {
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }) },
    from: vi.fn(),
  },
}));

const { registerBackgroundTask, unregisterBackgroundTask } = await import("./backgroundService");

describe("backgroundService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isRegisteredMock.mockResolvedValue(false);
  });

  describe("registerBackgroundTask", () => {
    it("registers the task if not already registered", async () => {
      const result = await registerBackgroundTask();
      expect(result).toBe(true);
      expect(registerTaskMock).toHaveBeenCalledWith("BACKGROUND_AUTOMATION", {
        minimumInterval: 15 * 60,
        stopOnTerminate: false,
        startOnBoot: true,
      });
    });

    it("skips registration if already registered", async () => {
      isRegisteredMock.mockResolvedValue(true);
      const result = await registerBackgroundTask();
      expect(result).toBe(true);
      expect(registerTaskMock).not.toHaveBeenCalled();
    });

    it("returns false on error", async () => {
      registerTaskMock.mockRejectedValueOnce(new Error("fail"));
      const result = await registerBackgroundTask();
      expect(result).toBe(false);
    });
  });

  describe("unregisterBackgroundTask", () => {
    it("unregisters if registered", async () => {
      isRegisteredMock.mockResolvedValue(true);
      await unregisterBackgroundTask();
      expect(unregisterTaskMock).toHaveBeenCalledWith("BACKGROUND_AUTOMATION");
    });

    it("does nothing if not registered", async () => {
      isRegisteredMock.mockResolvedValue(false);
      await unregisterBackgroundTask();
      expect(unregisterTaskMock).not.toHaveBeenCalled();
    });

    it("does not throw on error", async () => {
      isRegisteredMock.mockRejectedValueOnce(new Error("fail"));
      await expect(unregisterBackgroundTask()).resolves.toBeUndefined();
    });
  });
});
