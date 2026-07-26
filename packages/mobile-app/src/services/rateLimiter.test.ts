import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit, getRateLimitRemaining, resetRateLimit } from "./rateLimiter";

describe("rateLimiter", () => {
  beforeEach(() => {
    resetRateLimit("test-key");
  });

  it("allows requests under the limit", () => {
    expect(checkRateLimit("test-key", { maxPerMinute: 5 })).toBe(true);
  });

  it("blocks requests over the limit", () => {
    for (let i = 0; i < 5; i++) {
      checkRateLimit("test-key", { maxPerMinute: 5 });
    }
    expect(checkRateLimit("test-key", { maxPerMinute: 5 })).toBe(false);
  });

  it("tracks remaining correctly", () => {
    const config = { maxPerMinute: 10 };
    checkRateLimit("test-key", config);
    checkRateLimit("test-key", config);
    expect(getRateLimitRemaining("test-key", config)).toBe(8);
  });

  it("resets correctly", () => {
    const config = { maxPerMinute: 3 };
    checkRateLimit("test-key", config);
    checkRateLimit("test-key", config);
    checkRateLimit("test-key", config);
    expect(checkRateLimit("test-key", config)).toBe(false);
    resetRateLimit("test-key");
    expect(checkRateLimit("test-key", config)).toBe(true);
  });

  it("returns full remaining for unknown keys", () => {
    expect(getRateLimitRemaining("unknown-key")).toBe(20);
  });
});
