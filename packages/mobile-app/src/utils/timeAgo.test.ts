import { describe, it, expect, beforeEach } from "vitest";
import { timeAgo } from "./index";
import { setLocale } from "../i18n";

describe("timeAgo", () => {
  beforeEach(() => {
    setLocale("pt-BR");
  });

  it("returns 'agora' for recent timestamps", () => {
    const now = new Date().toISOString();
    expect(timeAgo(now)).toBe("agora");
  });

  it("returns minutes in pt-BR", () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60000).toISOString();
    expect(timeAgo(fiveMinAgo)).toBe("há 5 min");
  });

  it("returns hours in pt-BR", () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 3600000).toISOString();
    expect(timeAgo(twoHoursAgo)).toBe("há 2h");
  });

  it("returns days in pt-BR", () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString();
    expect(timeAgo(threeDaysAgo)).toBe("há 3d");
  });

  it("uses English locale", () => {
    setLocale("en");
    const fiveMinAgo = new Date(Date.now() - 5 * 60000).toISOString();
    expect(timeAgo(fiveMinAgo)).toBe("5 min ago");
  });
});
