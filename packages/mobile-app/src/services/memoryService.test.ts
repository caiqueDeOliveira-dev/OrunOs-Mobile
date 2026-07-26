import { describe, it, expect, vi, beforeEach } from "vitest";
import { fakeQueryResult } from "../test/supabaseMock";

const fromMock = vi.fn();

vi.mock("./supabaseClient", () => ({
  supabase: { from: (...args: any[]) => fromMock(...args) },
}));

const { loadRecentConversations } = await import("./memoryService");

describe("loadRecentConversations", () => {
  beforeEach(() => fromMock.mockReset());

  it("returns conversations on success", async () => {
    const rows = [{ id: "c1", title: "Teste", agent_id: "hampton", updated_at: "2026-01-01" }];
    fromMock.mockReturnValue(fakeQueryResult({ data: rows, error: null }));

    const result = await loadRecentConversations();
    expect(result).toEqual(rows);
    expect(fromMock).toHaveBeenCalledWith("conversations");
  });

  it("throws a descriptive error when Supabase returns an error", async () => {
    fromMock.mockReturnValue(fakeQueryResult({ data: null, error: { message: "unauthorized" } }));
    await expect(loadRecentConversations()).rejects.toThrow(/unauthorized/);
  });
});
