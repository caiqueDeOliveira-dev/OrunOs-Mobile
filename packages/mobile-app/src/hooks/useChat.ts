import { useState, useEffect, useCallback, useRef } from "react";
import NetInfo from "@react-native-community/netinfo";
import { ChatMessage } from "../types";
import { supabase } from "../services/supabaseClient";
import { loadMessages, loadMessagesBefore, sendMessage as apiSendMessage, subscribeToMessages } from "../services/chatService";
import { enqueueMessage, processQueue, getQueueCount, cacheConversation } from "../services/offlineQueue";
import { trackChatSent } from "../services/analyticsService";
import { t } from "../i18n";
import { getUserId } from "../stores/authStore";

const HAMPTON_AGENT_ID = "hampton";

/**
 * Filters out tool call trace messages from the display.
 * The autonomous loop stores tool calls as system messages — these are
 * internal traces that the user doesn't need to see.
 */
function filterDisplayMessages(messages: ChatMessage[]): ChatMessage[] {
  return messages.filter((m) => {
    if (m.role === "system" && m.content?.startsWith("[Tool:")) return false;
    return true;
  });
}

let conversationCreationPromise: Promise<string> | null = null;

async function getOrCreateConversation(agentId: string): Promise<string> {
  if (conversationCreationPromise) return conversationCreationPromise;

  conversationCreationPromise = (async () => {
    const userId = getUserId();

    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing?.id) return existing.id;

    const { data: created, error: createErr } = await supabase
      .from("conversations")
      .insert({ title: t("chat.newConversation"), agent_id: agentId, user_id: userId })
      .select("id")
      .single();

    if (createErr) throw new Error(`Failed to create conversation: ${createErr.message}`);
    return created.id;
  })();

  const result = await conversationCreationPromise;
  conversationCreationPromise = null;
  return result;
}

interface UseChatOptions {
  conversationId?: string;
  agentId?: string;
}

interface UseChatReturn {
  messages: ChatMessage[];
  conversationId: string | null;
  sending: boolean;
  loading: boolean;
  error: string | null;
  isOnline: boolean;
  queuedCount: number;
  hasMore: boolean;
  send: (content: string) => Promise<void>;
  loadMore: () => Promise<void>;
}

export function useChat({ conversationId: forcedId, agentId = HAMPTON_AGENT_ID }: UseChatOptions = {}): UseChatReturn {
  const [conversationId, setConversationId] = useState<string | null>(forcedId ?? null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [queuedCount, setQueuedCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const mountedRef = useRef(true);
  const messagesRef = useRef<ChatMessage[]>([]);

  messagesRef.current = messages;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Network status listener
  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      const online = state.isConnected ?? true;
      if (mountedRef.current) setIsOnline(online);

      if (online) {
        processQueue().then(({ sent }) => {
          if (sent > 0 && mountedRef.current) {
            getQueueCount().then((c) => setQueuedCount(c));
          }
        });
      }
    });
    return unsub;
  }, []);

  // Check Supabase connectivity on mount
  useEffect(() => {
    (async () => {
      try {
        const { error } = await supabase.from("conversations").select("id").limit(1);
        if (error && mountedRef.current) {
          console.warn("[useChat] Supabase connectivity check failed:", error.message);
        }
      } catch {
        // Ignore connectivity check errors
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const id = forcedId ?? await getOrCreateConversation(agentId);
        if (mountedRef.current) setConversationId(id);
        const msgs = await loadMessages(id);
        if (mountedRef.current) {
          setMessages(filterDisplayMessages(msgs));
          setHasMore(msgs.length >= 30);
        }
      } catch (err) {
        if (mountedRef.current) setError((err as Error).message);
      }
      if (mountedRef.current) setLoading(false);
    })();
  }, [forcedId, agentId]);

  useEffect(() => {
    if (!conversationId) return;
    const unsubscribe = subscribeToMessages(conversationId, (message) => {
      if (mountedRef.current) {
        // Filter out tool call traces from display
        if (message.role === "system" && message.content?.startsWith("[Tool:")) return;
        setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
      }
    });
    return unsubscribe;
  }, [conversationId]);

  const send = useCallback(
    async (content: string) => {
      if (!content.trim() || !conversationId || sending) return;
      setSending(true);
      setError(null);

      const optimisticMsg: ChatMessage = {
        id: `temp-${Date.now()}`,
        conversation_id: conversationId,
        seq: -1,
        role: "user",
        agent_id: agentId,
        content: content.trim(),
        provider: null,
        model: null,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimisticMsg]);

      if (!isOnline) {
        await enqueueMessage(conversationId, agentId, content);
        const count = await getQueueCount();
        if (mountedRef.current) setQueuedCount(count);
        setSending(false);
        return;
      }

      try {
        await apiSendMessage(conversationId, agentId, content);
        trackChatSent(agentId, "cloud");
      } catch (err) {
        const errMsg = (err as Error).message || "Erro desconhecido";
        const isRelayError = errMsg.includes("ai-relay") || errMsg.includes("Failed to fetch") || errMsg.includes("404");
        const isNetworkError = errMsg.includes("Network") || errMsg.includes("timeout") || errMsg.includes("abort");
        await enqueueMessage(conversationId, agentId, content);
        const count = await getQueueCount();
        if (mountedRef.current) {
          setQueuedCount(count);
          if (isRelayError) {
            setError(`Servidor AI offline. Deploy ai-relay no Supabase. (${errMsg})`);
          } else if (isNetworkError) {
            setError(`Sem conexao com o servidor. Verifique sua internet. (${errMsg})`);
          } else {
            setError(`${t("chat.queuedForLater")} (${errMsg})`);
          }
        }
      } finally {
        if (mountedRef.current) {
          cacheConversation(conversationId!, t("chat.conversationLabel"), agentId, messagesRef.current);
          setSending(false);
        }
      }
    },
    [conversationId, agentId, sending, isOnline]
  );

  const loadMore = useCallback(async () => {
    if (!conversationId || !hasMore || messagesRef.current.length === 0) return;

    const oldestSeq = messagesRef.current[0]?.seq;
    if (!oldestSeq || oldestSeq <= 1) {
      setHasMore(false);
      return;
    }

    try {
      const olderMessages = await loadMessagesBefore(conversationId, oldestSeq);
      if (mountedRef.current) {
        const filtered = filterDisplayMessages(olderMessages);
        if (filtered.length === 0) {
          setHasMore(false);
        } else {
          setMessages((prev) => [...filtered, ...prev]);
          setHasMore(olderMessages.length >= 30);
        }
      }
    } catch (err) {
      if (mountedRef.current) setError((err as Error).message);
    }
  }, [conversationId, hasMore]);

  return { messages, conversationId, sending, loading, error, isOnline, queuedCount, hasMore, send, loadMore };
}
