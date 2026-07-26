import { describe, it, expect, vi, beforeEach } from "vitest";
import { triggerN8nWorkflow, publishToSocial, sendN8nNotification } from "./n8nService";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

describe("triggerN8nWorkflow", () => {
  it("sends POST to webhook URL with payload", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ runId: "run-123" }),
    });

    const result = await triggerN8nWorkflow("https://n8n.example.com/webhook/test", { action: "test" });
    expect(result.success).toBe(true);
    expect(result.runId).toBe("run-123");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://n8n.example.com/webhook/test",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("returns error on non-OK response", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500 });
    const result = await triggerN8nWorkflow("https://n8n.example.com/webhook/test", {});
    expect(result.success).toBe(false);
    expect(result.error).toContain("500");
  });

  it("returns error on network failure", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));
    const result = await triggerN8nWorkflow("https://n8n.example.com/webhook/test", {});
    expect(result.success).toBe(false);
    expect(result.error).toBe("Network error");
  });
});

describe("publishToSocial", () => {
  it("sends correct payload for Instagram", async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
    await publishToSocial("instagram", { text: "Hello!", hashtags: ["test"] }, "https://n8n.example.com/publish");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://n8n.example.com/publish",
      expect.objectContaining({
        body: JSON.stringify({
          action: "publish",
          platform: "instagram",
          content: { text: "Hello!", image_url: undefined, hashtags: ["test"] },
        }),
      }),
    );
  });

  it("sends correct payload for TikTok", async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
    await publishToSocial("tiktok", { text: "Video caption" }, "https://n8n.example.com/publish");
    expect(mockFetch).toHaveBeenCalled();
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.platform).toBe("tiktok");
  });
});

describe("sendN8nNotification", () => {
  it("sends notification payload", async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
    await sendN8nNotification("https://n8n.example.com/notify", "Alerta", "Teste");
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.action).toBe("notify");
    expect(body.title).toBe("Alerta");
    expect(body.body).toBe("Teste");
  });
});
