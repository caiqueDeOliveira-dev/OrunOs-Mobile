// Orun Home — chat service for the embedded Home IA agent.
// Talks to the shared Supabase project via the ai-relay Edge Function,
// exactly like the mobile-app chatService.

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

const HOME_AGENT_ID = "home-ia";

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

export interface SendMessageResult {
  userMessageId: string;
  replyId: string;
  content: string;
  provider: string;
  model: string;
  toolCalls?: number;
  iterations?: number;
}

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

const conversationPromises = new Map<string, Promise<string>>();

export async function getOrCreateConversation(agentId: string = HOME_AGENT_ID): Promise<string> {
  const existing = conversationPromises.get(agentId);
  if (existing) return existing;

  const promise = (async () => {
    const userId = getUserId();

    const { data: existingConv } = await supabase
      .from("conversations")
      .select("id")
      .eq("agent_id", agentId)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingConv?.id) return existingConv.id;

    const { data: created, error: createErr } = await supabase
      .from("conversations")
      .insert({ title: "Home IA", agent_id: agentId, user_id: userId })
      .select("id")
      .single();

    if (createErr) throw new Error(`Failed to create conversation: ${createErr.message}`);
    return created.id;
  })();

  conversationPromises.set(agentId, promise);
  try {
    return await promise;
  } finally {
    conversationPromises.delete(agentId);
  }
}

const activeMessageChannels = new Map<string, ReturnType<typeof supabase.channel>>();

export function subscribeToMessages(conversationId: string, onInsert: (message: ChatMessage) => void) {
  const topic = `home:${conversationId}`;
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
