import { describe, it, expect, vi, beforeEach } from "vitest";
import { fakeQueryResult } from "../test/supabaseMock";

const fromMock = vi.fn();
const invokeMock = vi.fn();
const onMock = vi.fn();
const subscribeMock = vi.fn();
const channelMock = vi.fn();
const removeChannelMock = vi.fn();

vi.mock("./supabaseClient", () => ({
  supabase: {
    from: (...args: any[]) => fromMock(...args),
    functions: { invoke: (...args: any[]) => invokeMock(...args) },
    channel: (...args: any[]) => channelMock(...args),
    removeChannel: (...args: any[]) => removeChannelMock(...args),
  },
}));

const { loadMessages, sendMessage, subscribeToMessages } = await import("./chatService");

describe("loadMessages", () => {
  beforeEach(() => fromMock.mockReset());

  it("returns messages ordered from Supabase", async () => {
    const rows = [{ id: "m1", conversation_id: "c1", seq: 1, role: "user", content: "oi", created_at: "2026-01-01" }];
    fromMock.mockReturnValue(fakeQueryResult({ data: rows, error: null }));

    const result = await loadMessages("c1");
    expect(result).toEqual(rows);
    expect(fromMock).toHaveBeenCalledWith("messages");
  });

  it("throws a descriptive error on failure", async () => {
    fromMock.mockReturnValue(fakeQueryResult({ data: null, error: { message: "timeout" } }));
    await expect(loadMessages("c1")).rejects.toThrow(/timeout/);
  });
});

describe("sendMessage", () => {
  beforeEach(() => invokeMock.mockReset());

  it("calls the ai-relay function with the right payload and returns its result", async () => {
    const relayResult = { userMessageId: "u1", replyId: "r1", content: "olá!", provider: "claude", model: "claude-sonnet-5" };
    invokeMock.mockResolvedValue({ data: relayResult, error: null });

    const result = await sendMessage("c1", "hampton", "oi");

    expect(invokeMock).toHaveBeenCalledWith("ai-relay", {
      body: { conversationId: "c1", agentId: "hampton", content: "oi" },
    });
    expect(result).toEqual(relayResult);
  });

  it("throws when the function invocation itself errors (e.g. network failure)", async () => {
    invokeMock.mockResolvedValue({ data: null, error: { message: "failed to fetch" } });
    await expect(sendMessage("c1", "hampton", "oi")).rejects.toThrow(/failed to fetch/);
  });

  it("throws when the function responds successfully but with an application-level error", async () => {
    // e.g. ai-relay validated the request fine at the HTTP layer, but the
    // agent itself was misconfigured (Ollama, missing provider, etc).
    invokeMock.mockResolvedValue({ data: { error: "Provider not reachable from ai-relay" }, error: null });
    await expect(sendMessage("c1", "hampton", "oi")).rejects.toThrow(/not reachable/);
  });
});

describe("subscribeToMessages", () => {
  beforeEach(() => {
    onMock.mockReset();
    subscribeMock.mockReset();
    channelMock.mockReset();
    removeChannelMock.mockReset();
  });

  it("subscribes to postgres_changes filtered by conversation_id, and unsubscribe removes the channel", () => {
    const fakeChannel: any = {};
    fakeChannel.on = onMock.mockReturnValue(fakeChannel);
    fakeChannel.subscribe = subscribeMock.mockReturnValue(fakeChannel);
    channelMock.mockReturnValue(fakeChannel);

    const onInsert = vi.fn();
    const unsubscribe = subscribeToMessages("c1", onInsert);

    expect(channelMock).toHaveBeenCalledWith("messages:c1");
    expect(onMock).toHaveBeenCalledWith(
      "postgres_changes",
      expect.objectContaining({ event: "INSERT", table: "messages", filter: "conversation_id=eq.c1" }),
      expect.any(Function)
    );
    expect(subscribeMock).toHaveBeenCalled();

    unsubscribe();
    expect(removeChannelMock).toHaveBeenCalledWith(fakeChannel);
  });

  it("calls onInsert with the new row when the postgres_changes callback fires", () => {
    const fakeChannel: any = {};
    let capturedCallback: (payload: any) => void = () => {};
    fakeChannel.on = vi.fn((_event: string, _filter: any, cb: (payload: any) => void) => {
      capturedCallback = cb;
      return fakeChannel;
    });
    fakeChannel.subscribe = vi.fn().mockReturnValue(fakeChannel);
    channelMock.mockReturnValue(fakeChannel);

    const onInsert = vi.fn();
    subscribeToMessages("c1", onInsert);

    const newMessage = { id: "m2", content: "nova mensagem" };
    capturedCallback({ new: newMessage });

    expect(onInsert).toHaveBeenCalledWith(newMessage);
  });
});
