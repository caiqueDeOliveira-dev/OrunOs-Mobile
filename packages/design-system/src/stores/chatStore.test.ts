import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { useChatStore } from "./chatStore";

describe("chatStore", () => {
  beforeEach(() => {
    useChatStore.setState({ messages: [], mood: "idle", activeAgentId: "hampton" });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("adds a user message and an empty streaming agent reply immediately", () => {
    useChatStore.getState().sendMessage("Oi Hampton");
    const { messages, mood } = useChatStore.getState();

    expect(messages).toHaveLength(2);
    expect(messages[0]).toMatchObject({ role: "user", content: "Oi Hampton" });
    expect(messages[1]).toMatchObject({ role: "agent", content: "", isStreaming: true });
    expect(mood).toBe("thinking");
  });

  it("streams the reply content over time and settles back to idle", () => {
    useChatStore.getState().sendMessage("Teste");

    vi.advanceTimersByTime(24);
    let reply = useChatStore.getState().messages[1];
    expect(reply.content.length).toBeGreaterThan(0);
    expect(useChatStore.getState().mood).toBe("speaking");

    // Advance well past the full reply length so streaming completes.
    vi.advanceTimersByTime(5000);
    reply = useChatStore.getState().messages[1];
    expect(reply.isStreaming).toBe(false);
    expect(useChatStore.getState().mood).toBe("idle");
  });

  it("setMood and setActiveAgent update state directly", () => {
    useChatStore.getState().setMood("listening");
    expect(useChatStore.getState().mood).toBe("listening");

    useChatStore.getState().setActiveAgent("nutritionist");
    expect(useChatStore.getState().activeAgentId).toBe("nutritionist");
  });
});
