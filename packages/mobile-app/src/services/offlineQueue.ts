import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabaseClient";

const QUEUE_KEY = "orun-offline-queue";
const CACHE_PREFIX = "orun-cache-conversation-";

export interface QueuedMessage {
  id: string;
  conversationId: string;
  agentId: string;
  content: string;
  timestamp: string;
  retries: number;
}

// ─── Offline Queue ───────────────────────────────────────────────

export async function enqueueMessage(
  conversationId: string,
  agentId: string,
  content: string
): Promise<QueuedMessage> {
  const queue = await getQueue();
  const msg: QueuedMessage = {
    id: `offline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    conversationId,
    agentId,
    content,
    timestamp: new Date().toISOString(),
    retries: 0,
  };
  queue.push(msg);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  return msg;
}

export async function getQueue(): Promise<QueuedMessage[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function removeMessage(id: string): Promise<void> {
  const queue = await getQueue();
  const filtered = queue.filter((m) => m.id !== id);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
}

export async function processQueue(
  onResult?: (msg: QueuedMessage, success: boolean) => void
): Promise<{ sent: number; failed: number }> {
  const queue = await getQueue();
  if (queue.length === 0) return { sent: 0, failed: 0 };

  let sent = 0;
  let failed = 0;
  const remaining: QueuedMessage[] = [];

  for (const msg of queue) {
    try {
      await supabase.functions.invoke("ai-relay", {
        body: {
          conversationId: msg.conversationId,
          agentId: msg.agentId,
          content: msg.content,
        },
      });
      sent++;
      onResult?.(msg, true);
    } catch {
      msg.retries++;
      if (msg.retries < 3) {
        remaining.push(msg);
      } else {
        failed++;
        onResult?.(msg, false);
      }
    }
  }

  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
  return { sent, failed };
}

export async function getQueueCount(): Promise<number> {
  const queue = await getQueue();
  return queue.length;
}

// ─── Conversation Cache ──────────────────────────────────────────

interface CachedConversation {
  id: string;
  title: string;
  agentId: string;
  messages: any[];
  lastUpdated: string;
}

export async function cacheConversation(
  conversationId: string,
  title: string,
  agentId: string,
  messages: any[]
): Promise<void> {
  const cache: CachedConversation = {
    id: conversationId,
    title,
    agentId,
    messages,
    lastUpdated: new Date().toISOString(),
  };
  await AsyncStorage.setItem(`${CACHE_PREFIX}${conversationId}`, JSON.stringify(cache));
}

export async function getCachedConversation(
  conversationId: string
): Promise<CachedConversation | null> {
  try {
    const raw = await AsyncStorage.getItem(`${CACHE_PREFIX}${conversationId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function getCachedConversations(): Promise<CachedConversation[]> {
  const keys = await AsyncStorage.getAllKeys();
  const cacheKeys = keys.filter((k) => k.startsWith(CACHE_PREFIX));
  if (cacheKeys.length === 0) return [];

  const raw = await AsyncStorage.multiGet(cacheKeys);
  return raw
    .map(([, value]) => {
      try {
        return value ? JSON.parse(value) : null;
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .sort(
      (a, b) =>
        new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
    );
}

export async function removeCachedConversation(conversationId: string): Promise<void> {
  await AsyncStorage.removeItem(`${CACHE_PREFIX}${conversationId}`);
}

export async function clearAllCache(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const cacheKeys = keys.filter((k) => k.startsWith(CACHE_PREFIX));
  await AsyncStorage.multiRemove(cacheKeys);
}
