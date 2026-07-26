import { describe, it, expect, vi } from "vitest";
import { describeCron } from "./schedulerService";

vi.mock("../stores/authStore", () => ({
  getUserId: () => "test-user-123",
}));

vi.mock("./supabaseClient", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      data: [],
      error: null,
    })),
  },
}));

describe("describeCron", () => {
  it("describes every minute", () => {
    expect(describeCron("* * * * *")).toBe("A cada minuto");
  });

  it("describes every hour", () => {
    expect(describeCron("0 * * * *")).toBe("A cada hora");
  });

  it("describes specific time", () => {
    expect(describeCron("30 14 * * *")).toBe("14:30 todos os dias");
  });

  it("describes weekdays", () => {
    expect(describeCron("0 9 * * 1-5")).toBe("As 9h dias de semana");
  });

  it("describes weekends", () => {
    expect(describeCron("0 10 * * 0,6")).toBe("As 10h fins de semana");
  });

  it("returns raw expression for invalid format", () => {
    expect(describeCron("invalid")).toBe("invalid");
  });

  it("describes hourly with specific minute", () => {
    expect(describeCron("15 * * * *")).toBe("A cada hora no minuto :15");
  });
});
