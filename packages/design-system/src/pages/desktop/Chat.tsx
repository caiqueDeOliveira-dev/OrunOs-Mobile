import React, { useEffect, useRef, useState } from "react";
import { Bell, Settings } from "lucide-react";
import { DesktopShell } from "../../layouts/DesktopShell";
import { ChatInput } from "../../components/ChatInput";
import { MessageBubble } from "../../components/MessageBubble";
import { HamptonScene } from "../../components/HamptonScene";
import { useChatStore } from "../../stores/chatStore";

/**
 * Chat — screen 3/20. Uses DesktopShell (no duplicated layout code).
 * HamptonScene's mood updates live as messages stream.
 */
export function Chat() {
  const { messages, mood, sendMessage } = useChatStore();
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function handleSend() {
    if (!draft.trim()) return;
    sendMessage(draft.trim());
    setDraft("");
  }

  return (
    <DesktopShell
      activeId="chat"
      crumbs={[{ label: "Orun OS" }, { label: "Chat" }]}
      navActions={
        <div className="flex items-center gap-2">
          <HamptonScene mood={mood} size={36} className="rounded-full overflow-hidden" />
          <button className="rounded-md p-2 text-text-muted hover:bg-surface-hover hover:text-text-primary">
            <Bell size={17} />
          </button>
          <button className="rounded-md p-2 text-text-muted hover:bg-surface-hover hover:text-text-primary">
            <Settings size={17} />
          </button>
        </div>
      }
      contentClassName="flex flex-col"
    >
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-6 py-6 space-y-5">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <HamptonScene mood="idle" size={160} />
            <p className="text-sm text-text-muted max-w-xs">
              Comece uma conversa. Hampton reage em tempo real enquanto processa e responde.
            </p>
          </div>
        ) : (
          messages.map((m) => (
            <MessageBubble
              key={m.id}
              role={m.role}
              agentName={m.agentName}
              content={m.content}
              timestamp={m.timestamp}
              isStreaming={m.isStreaming}
            />
          ))
        )}
      </div>

      <div className="shrink-0 px-6 pb-6">
        <ChatInput
          value={draft}
          onChange={setDraft}
          onSend={handleSend}
          onAttach={() => {}}
          onVoiceStart={() => {}}
          isStreaming={mood === "thinking" || mood === "speaking"}
          placeholder="Fale com o Hampton..."
        />
      </div>
    </DesktopShell>
  );
}
