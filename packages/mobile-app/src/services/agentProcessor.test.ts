import { describe, it, expect } from "vitest";
import {
  extractJsonBlocks,
  detectToolFromJson,
  summarizeToolCalls,
} from "./agentProcessor";

describe("extractJsonBlocks", () => {
  it("extracts a single JSON block", () => {
    const text = "Aqui esta a analise:\n{\"calories\": 500, \"protein_g\": 30}";
    const blocks = extractJsonBlocks(text);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toEqual({ calories: 500, protein_g: 30 });
  });

  it("extracts multiple JSON blocks", () => {
    const text = '{"metric": "peso", "value": 80, "unit": "kg"}\n{"metric": "pressao", "value": 120, "unit": "mmHg"}';
    const blocks = extractJsonBlocks(text);
    expect(blocks).toHaveLength(2);
  });

  it("ignores invalid JSON", () => {
    const text = "Isso nao e JSON: {not valid}\n{\"key\": \"value\"}";
    const blocks = extractJsonBlocks(text);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toEqual({ key: "value" });
  });

  it("returns empty array when no JSON found", () => {
    const blocks = extractJsonBlocks("Nenhum JSON aqui.");
    expect(blocks).toHaveLength(0);
  });

  it("ignores arrays", () => {
    const text = "[1, 2, 3]\n{\"key\": \"value\"}";
    const blocks = extractJsonBlocks(text);
    expect(blocks).toHaveLength(1);
  });
});

describe("detectToolFromJson", () => {
  it("detects log_meal", () => {
    expect(detectToolFromJson({ calories: 500, protein_g: 30, carbs_g: 50, fat_g: 20 })).toBe("log_meal");
  });

  it("detects log_workout", () => {
    expect(detectToolFromJson({ exercise_name: "Supino", duration_min: 45 })).toBe("log_workout");
  });

  it("detects log_metric", () => {
    expect(detectToolFromJson({ metric: "peso", value: 80, unit: "kg" })).toBe("log_metric");
  });

  it("detects add_transaction", () => {
    expect(detectToolFromJson({ amount: 50, category: "food", type: "expense", description: "Almoco" })).toBe("add_transaction");
  });

  it("detects add_campaign", () => {
    expect(detectToolFromJson({ campaign_name: "Black Friday" })).toBe("add_campaign");
  });

  it("detects create_post", () => {
    expect(detectToolFromJson({ platform: "instagram", hook: "Promocao!" })).toBe("create_post");
  });

  it("detects generate_image", () => {
    expect(detectToolFromJson({ engine: "fal", prompt: "a cat", model_used: "flux-schnell" })).toBe("generate_image");
  });

  it("detects memory_save", () => {
    expect(detectToolFromJson({ key: "preferencia", content: "Gosta de pizza" })).toBe("memory_save");
  });

  it("returns null for unrecognized JSON", () => {
    expect(detectToolFromJson({ foo: "bar" })).toBeNull();
  });
});

describe("summarizeToolCalls", () => {
  it("summarizes successful tool calls", () => {
    const calls = [
      { name: "log_meal", args: { description: "Almoco", calories: 500 }, result: { success: true } },
      { name: "log_metric", args: { metric: "peso", value: 80, unit: "kg" }, result: { success: true } },
    ];
    const summaries = summarizeToolCalls(calls);
    expect(summaries).toHaveLength(2);
    expect(summaries[0]).toContain("Refeicao: Almoco");
    expect(summaries[0]).toContain("✅");
    expect(summaries[1]).toContain("Metrica: peso = 80 kg");
  });

  it("marks failed tool calls", () => {
    const calls = [
      { name: "log_meal", args: { description: "Almoco" }, result: { success: false, error: "DB error" } },
    ];
    const summaries = summarizeToolCalls(calls);
    expect(summaries[0]).toContain("❌");
  });

  it("returns empty array for no calls", () => {
    expect(summarizeToolCalls([])).toHaveLength(0);
  });
});
