import { describe, it, expect, vi, beforeEach } from "vitest";

const mockChain = {
  select: vi.fn().mockReturnThis(),
  is: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockResolvedValue({ data: null, error: null }),
};

vi.mock("../services/supabaseClient", () => ({
  supabase: {
    from: vi.fn(() => mockChain),
  },
}));

import { loadRecentConversations } from "../services/memoryService";

describe("memoryService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockChain.limit.mockResolvedValue({ data: null, error: null });
  });

  it("exports loadRecentConversations", () => {
    expect(typeof loadRecentConversations).toBe("function");
  });

  it("returns conversations from supabase", async () => {
    const mockData = [
      { id: "1", title: "Test", agent_id: "hampton", updated_at: new Date().toISOString() },
    ];
    mockChain.limit.mockResolvedValue({ data: mockData, error: null });
    const result = await loadRecentConversations();
    expect(result).toEqual(mockData);
  });

  it("returns empty array when no conversations", async () => {
    mockChain.limit.mockResolvedValue({ data: [], error: null });
    const result = await loadRecentConversations();
    expect(result).toEqual([]);
  });

  it("throws on supabase error", async () => {
    mockChain.limit.mockResolvedValue({ data: null, error: { message: "fail" } });
    await expect(loadRecentConversations()).rejects.toThrow("Failed to load conversations: fail");
  });

  it("queries conversations table", async () => {
    await loadRecentConversations();
    expect(mockChain.select).toHaveBeenCalledWith("id, title, agent_id, updated_at");
  });
});
