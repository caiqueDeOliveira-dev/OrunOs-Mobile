import { describe, it, expect, vi, beforeEach } from "vitest";

const mockChain = {
  select: vi.fn().mockReturnThis(),
  is: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  eq: vi.fn().mockResolvedValue({ error: null }),
};

vi.mock("../services/supabaseClient", () => ({
  supabase: {
    from: vi.fn(() => mockChain),
  },
}));

import { loadAutomations, setAutomationEnabled } from "../services/automationsService";

describe("automationsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exports loadAutomations and setAutomationEnabled", () => {
    expect(typeof loadAutomations).toBe("function");
    expect(typeof setAutomationEnabled).toBe("function");
  });

  it("returns automations from supabase", async () => {
    const mockData = [
      { id: "1", name: "Test", kind: "n8n_webhook", enabled: true, config: {}, updated_at: new Date().toISOString() },
    ];
    mockChain.order.mockResolvedValue({ data: mockData, error: null });
    const result = await loadAutomations();
    expect(result).toEqual(mockData);
  });

  it("throws on supabase error", async () => {
    mockChain.order.mockResolvedValue({ data: null, error: { message: "fail" } });
    await expect(loadAutomations()).rejects.toThrow("Failed to load automations: fail");
  });

  it("queries automations table", async () => {
    mockChain.order.mockResolvedValue({ data: [], error: null });
    await loadAutomations();
    expect(mockChain.select).toHaveBeenCalledWith("*");
  });

  it("sets automation enabled", async () => {
    await setAutomationEnabled("1", true);
    expect(mockChain.update).toHaveBeenCalledWith(expect.objectContaining({ enabled: true }));
    expect(mockChain.eq).toHaveBeenCalledWith("id", "1");
  });

  it("throws on update error", async () => {
    mockChain.eq.mockResolvedValue({ error: { message: "update fail" } });
    await expect(setAutomationEnabled("1", false)).rejects.toThrow("Failed to update automation: update fail");
  });
});
