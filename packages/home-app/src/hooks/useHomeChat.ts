// Orun Home — useChat hook for the embedded Home IA agent (no offline queue).

import { useState, useEffect, useCallback, useRef } from "react";
import type { ChatMessage } from "../services/chatService";
import { loadMessages, sendMessage as apiSendMessage, subscribeToMessages, getOrCreateConversation } from "../services/chatService";

export interface UseChatReturn {
  messages: ChatMessage[];
  conversationId: string | null;
  sending: boolean;
  loading: boolean;
  error: string | null;
  send: (content: string) => Promise<void>;
}

export function useHomeChat(agentId: string = "home-ia"): UseChatReturn {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const sendingRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const id = await getOrCreateConversation(agentId);
        if (mountedRef.current) setConversationId(id);
        const msgs = await loadMessages(id);
        if (mountedRef.current) {
          setMessages(msgs.filter((m) => !(m.role === "system" && m.content?.startsWith("[Tool:"))));
        }
      } catch (err) {
        if (mountedRef.current) setError((err as Error).message);
      }
      if (mountedRef.current) setLoading(false);
    })();
  }, [agentId]);

  useEffect(() => {
    if (!conversationId) return;
    const unsubscribe = subscribeToMessages(conversationId, (message) => {
      if (mountedRef.current) {
        if (message.role === "system" && message.content?.startsWith("[Tool:")) return;
        setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
      }
    });
    return unsubscribe;
  }, [conversationId]);

  const send = useCallback(
    async (content: string) => {
      if (!content.trim() || !conversationId || sendingRef.current) return;
      sendingRef.current = true;
      setSending(true);
      setError(null);

      const optimistic: ChatMessage = {
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
      setMessages((prev) => [...prev, optimistic]);

      try {
        const result = await apiSendMessage(conversationId, agentId, content);
        if (mountedRef.current && result) {
          setMessages((prev) => {
            const withoutOptimistic = prev.filter((m) => m.id !== optimistic.id);
            const userMsg: ChatMessage = {
              id: result.userMessageId,
              conversation_id: conversationId,
              seq: -1,
              role: "user",
              agent_id: agentId,
              content: content.trim(),
              provider: null,
              model: null,
              created_at: optimistic.created_at,
            };
            const assistantMsg: ChatMessage = {
              id: result.replyId,
              conversation_id: conversationId,
              seq: 0,
              role: "assistant",
              agent_id: agentId,
              content: result.content,
              provider: result.provider,
              model: result.model,
              created_at: new Date().toISOString(),
            };
            return [...withoutOptimistic, userMsg, assistantMsg];
          });
        }
      } catch (err) {
        const errMsg = (err as Error).message || "Erro desconhecido";
        if (mountedRef.current) setError(errMsg);
      } finally {
        if (mountedRef.current) {
          sendingRef.current = false;
          setSending(false);
        }
      }
    },
    [conversationId, agentId]
  );

  return { messages, conversationId, sending, loading, error, send };
}
