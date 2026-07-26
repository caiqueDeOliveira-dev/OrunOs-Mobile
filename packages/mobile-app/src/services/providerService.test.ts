import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./supabaseClient", () => ({
  supabase: {
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(() => Promise.resolve({ data: { default_provider: "groq", default_model: "llama-3.3-70b-versatile" } })),
        })),
      })),
    })),
  },
}));

const { getAllProviders, getFreeProviders, getFreeModels, setAgentProvider, getAgentProvider } = await import("./providerService");

describe("providerService", () => {
  describe("getAllProviders", () => {
    it("returns 6 providers", () => {
      const providers = getAllProviders();
      expect(providers).toHaveLength(6);
    });

    it("all providers marked as configured", () => {
      const providers = getAllProviders();
      expect(providers.every((p) => p.configured === true)).toBe(true);
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

  describe("getFreeProviders", () => {
    it("returns providers with free models", () => {
      const providers = getFreeProviders();
      expect(providers.length).toBeGreaterThan(0);
      expect(providers.every((p) => p.models.some((m) => m.free))).toBe(true);
    });
  });

  describe("getFreeModels", () => {
    it("returns free models for groq", () => {
      const models = getFreeModels("groq");
      expect(models.length).toBeGreaterThan(0);
      expect(models.every((m) => m.free)).toBe(true);
    });

    it("returns free models for openrouter", () => {
      const models = getFreeModels("openrouter");
      expect(models.length).toBeGreaterThan(0);
    });

    it("returns empty array for non-existent provider", () => {
      const models = getFreeModels("nonexistent");
      expect(models).toHaveLength(0);
    });
  });

  describe("setAgentProvider", () => {
    it("calls supabase update", async () => {
      await setAgentProvider("hampton", "groq", "llama-3.3-70b-versatile");
      // No error thrown means success
    });
  });

  describe("getAgentProvider", () => {
    it("returns provider and model", async () => {
      const result = await getAgentProvider("hampton");
      expect(result).toEqual({ provider: "groq", model: "llama-3.3-70b-versatile" });
    });
  });
});
