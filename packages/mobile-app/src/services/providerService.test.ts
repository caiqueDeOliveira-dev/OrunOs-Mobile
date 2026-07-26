import { describe, it, expect, vi, beforeEach } from "vitest";

const { checkProviders, getAllProviders } = await import("./providerService");

describe("providerService", () => {
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
    it("returns all 6 providers as configured", async () => {
      const providers = await checkProviders();
      expect(providers).toHaveLength(6);
      expect(providers.every((p) => p.configured === true)).toBe(true);
    });

    it("includes all cloud-reachable providers", async () => {
      const providers = await checkProviders();
      const ids = providers.map((p) => p.id);
      expect(ids).toContain("groq");
      expect(ids).toContain("openai");
      expect(ids).toContain("claude");
      expect(ids).toContain("openrouter");
      expect(ids).toContain("github");
      expect(ids).toContain("opencode");
    });
  });
});
