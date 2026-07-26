import { describe, it, expect, vi } from "vitest";

const fromMock = vi.fn();

vi.mock("./supabaseClient", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { user: { id: "user-1" } } },
      }),
    },
    from: (...args: any[]) => fromMock(...args),
  },
}));

vi.mock("expo-haptics", () => ({
  notificationAsync: vi.fn(),
  NotificationFeedbackType: { Success: "success" },
}));

const { processSharedContent } = await import("./shareExtensionService");

describe("shareExtensionService", () => {
  it("processSharedContent creates conversation and message from text", async () => {
    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { id: "msg-1" }, error: null }),
      }),
    });
    fromMock.mockReturnValue({
      insert: mockInsert,
    });

    const result = await processSharedContent({ text: "Hello from share" });
    expect(result.success).toBe(true);
    expect(result.messageId).toBe("msg-1");
  });

  it("returns error when not authenticated", async () => {
    const { supabase } = await import("./supabaseClient");
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: null },
    });

    const result = await processSharedContent({ text: "test" });
    expect(result.success).toBe(false);
    expect(result.error).toBe("Not authenticated");

    // Restore for other tests
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: { user: { id: "user-1" } } },
    });
  });

  it("returns error when no content provided", async () => {
    const result = await processSharedContent({});
    expect(result.success).toBe(false);
    expect(result.error).toBe("No content to share");
  });

  it("uses url as fallback when text is missing", async () => {
    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { id: "msg-2" }, error: null }),
      }),
    });
    fromMock.mockReturnValue({ insert: mockInsert });

    const result = await processSharedContent({ url: "https://example.com" });
    expect(result.success).toBe(true);
  });

  it("handles conversation creation error", async () => {
    fromMock.mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: { message: "db error" } }),
        }),
      }),
    });

    const result = await processSharedContent({ text: "test" });
    expect(result.success).toBe(false);
    expect(result.error).toBe("db error");
  });
});
