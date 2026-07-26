import { describe, it, expect, vi, beforeEach } from "vitest";
import { fakeQueryResult } from "../test/supabaseMock";

const fromMock = vi.fn();

vi.mock("./supabaseClient", () => ({
  supabase: {
    from: (...args: any[]) => fromMock(...args),
  },
}));

const { checkProviders, getAllProviders } = await import("./providerService");

describe("providerService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAllProviders", () => {
    it("returns 6 providers", () => {
      const providers = getAllProviders();
      expect(providers).toHaveLength(6);
    });

    it("all providers marked as not configured", () => {
      const providers = getAllProviders();
      expect(providers.every((p) => p.configured === false)).toBe(true);
    });

    it("includes groq, openai, claude, openrouter, github, opencode", () => {
      const providers = getAllProviders();
      const ids = providers.map((p) => p.id);
      expect(ids).toContain("groq");
      expect(ids).toContain("openai");
      expect(ids).toContain("claude");
      expect(ids).toContain("openrouter");
      expect(ids).toContain("github");
      expect(ids).toContain("opencode");
    });

    it("each provider has an envKey", () => {
      const providers = getAllProviders();
      expect(providers.every((p) => p.envKey.length > 0)).toBe(true);
    });

    it("each provider has at least one model", () => {
      const providers = getAllProviders();
      expect(providers.every((p) => p.models.length > 0)).toBe(true);
    });
  });

  describe("checkProviders", () => {
    it("queries the agents table for default_provider", async () => {
      fromMock.mockReturnValue(fakeQueryResult({ data: [], error: null }));
      await checkProviders();
      expect(fromMock).toHaveBeenCalledWith("agents");
    });

    it("marks providers that have agents as configured", async () => {
      fromMock.mockReturnValue(
        fakeQueryResult({
          data: [{ default_provider: "groq" }, { default_provider: "claude" }],
          error: null,
        })
      );

      const providers = await checkProviders();
      expect(providers.find((p) => p.id === "groq")?.configured).toBe(true);
      expect(providers.find((p) => p.id === "claude")?.configured).toBe(true);
      expect(providers.find((p) => p.id === "openai")?.configured).toBe(false);
    });

    it("handles null agents gracefully", async () => {
      fromMock.mockReturnValue(fakeQueryResult({ data: null, error: null }));
      const providers = await checkProviders();
      expect(providers).toHaveLength(6);
      expect(providers.every((p) => p.configured === false)).toBe(true);
    });

    it("handles empty agents list", async () => {
      fromMock.mockReturnValue(fakeQueryResult({ data: [], error: null }));
      const providers = await checkProviders();
      expect(providers.every((p) => p.configured === false)).toBe(true);
    });
  });
});
