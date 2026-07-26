import { describe, it, expect, vi, beforeEach } from "vitest";
import { fakeQueryResult } from "../test/supabaseMock";

const fromMock = vi.fn();

vi.mock("./supabaseClient", () => ({
  supabase: { from: (...args: any[]) => fromMock(...args) },
}));

// Imported AFTER the mock is registered so the module under test picks up the fake client.
const { loadAutomations, setAutomationEnabled } = await import("./automationsService");

describe("loadAutomations", () => {
  beforeEach(() => fromMock.mockReset());

  it("returns the automations on success", async () => {
    const rows = [{ id: "a1", name: "n8n", kind: "n8n_webhook", enabled: true, config: {}, updated_at: "2026-01-01" }];
    fromMock.mockReturnValue(fakeQueryResult({ data: rows, error: null }));

    const result = await loadAutomations();
    expect(result).toEqual(rows);
    expect(fromMock).toHaveBeenCalledWith("automations");
  });

  it("throws a descriptive error when Supabase returns an error", async () => {
    fromMock.mockReturnValue(fakeQueryResult({ data: null, error: { message: "network down" } }));
    await expect(loadAutomations()).rejects.toThrow(/network down/);
  });
});

describe("setAutomationEnabled", () => {
  beforeEach(() => fromMock.mockReset());

  it("resolves without throwing on success", async () => {
    fromMock.mockReturnValue(fakeQueryResult({ data: null, error: null }));
    await expect(setAutomationEnabled("a1", false)).resolves.toBeUndefined();
  });

  it("throws a descriptive error when the update fails", async () => {
    fromMock.mockReturnValue(fakeQueryResult({ data: null, error: { message: "row not found" } }));
    await expect(setAutomationEnabled("a1", true)).rejects.toThrow(/row not found/);
  });
});
