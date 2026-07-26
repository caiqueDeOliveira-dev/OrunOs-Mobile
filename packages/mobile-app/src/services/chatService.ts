import { supabase } from "./supabaseClient";
import { getUserId } from "../stores/authStore";

export interface ChatMessage {
  id: string;
  conversation_id: string;
  seq: number;
  role: "user" | "assistant" | "system";
  agent_id: string | null;
  content: string;
  provider: string | null;
  model: string | null;
  created_at: string;
}

/**
 * Loads a conversation's messages straight from Supabase — no relay needed
 * for reads, since the mobile app is a fully authenticated client (RLS
 * allows it). This is the same data the desktop app syncs down via
 * SyncService — both sides read/write the same rows.
 */
export async function loadMessages(conversationId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .is("deleted_at", null)
    .order("seq", { ascending: true });

  if (error) throw new Error(`Failed to load messages: ${error.message}`);
  return data as ChatMessage[];
}

/**
 * Loads older messages using cursor-based pagination.
 * Returns messages older than the given seq (exclusive).
 */
export async function loadMessagesBefore(
  conversationId: string,
  beforeSeq: number,
  limit: number = 30
): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .is("deleted_at", null)
    .lt("seq", beforeSeq)
    .order("seq", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to load older messages: ${error.message}`);
  return (data as ChatMessage[]).reverse();
}

export interface SendMessageResult {
  userMessageId: string;
  replyId: string;
  content: string;
  provider: string;
  model: string;
  toolCalls?: number;
  iterations?: number;
}

/**
 * Sends a message by calling the ai-relay Edge Function — NOT by writing to
 * the `messages` table directly and hoping something else replies. The
 * function does: store the user's message, call the actual AI provider,
 * store the reply, return it. This is what makes chat work with the
 * desktop app fully powered off: the AI call happens on Supabase's
 * infrastructure, not the user's PC.
 */
export async function sendMessage(
  conversationId: string,
  agentId: string,
  content: string
): Promise<SendMessageResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45_000);

  try {
    const { data, error } = await supabase.functions.invoke("ai-relay", {
      body: { conversationId, agentId, content },
      signal: controller.signal,
    });

    if (error) throw new Error(`ai-relay call failed: ${error.message}`);
    if (data?.error) throw new Error(data.error);
    return data as SendMessageResult;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Sends a voice message: creates a new conversation, stores the user's
 * transcribed text, calls the AI provider via ai-relay, and returns the
 * reply content. This is what makes the Voice screen work with the PC
 * turned off.
 */
export async function sendVoiceMessage(
  agentId: string,
  content: string
): Promise<{ conversationId: string; reply: string }> {
  const { data: conv, error: convError } = await supabase
    .from("conversations")
    .insert({ title: content.slice(0, 60), user_id: getUserId() })
    .select("id")
    .single();

  if (convError) throw new Error(`Failed to create conversation: ${convError.message}`);

  const result = await sendMessage(conv.id, agentId, content);
  return { conversationId: conv.id, reply: result.content };
}

/**
 * Subscribes to new messages in a conversation via Supabase Realtime, so
 * the screen updates live if a message arrives from elsewhere (e.g. the
 * desktop app, once it's back online and synced up). Returns an unsubscribe
 * function.
 */
const activeMessageChannels = new Map<string, ReturnType<typeof supabase.channel>>();

export function subscribeToMessages(conversationId: string, onInsert: (message: ChatMessage) => void) {
  const topic = `messages:${conversationId}`;

  // Remove any existing channel for this conversation first
  const existing = activeMessageChannels.get(topic);
  if (existing) {
    supabase.removeChannel(existing);
    activeMessageChannels.delete(topic);
  }

  const channel = supabase
    .channel(topic)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
      (payload) => onInsert(payload.new as ChatMessage)
    )
    .subscribe();

  activeMessageChannels.set(topic, channel);

  return () => {
    supabase.removeChannel(channel);
    activeMessageChannels.delete(topic);
  };
}
