import React, { useEffect, useRef, useState } from "react";
import { MobileShell } from "../../layouts/MobileShell";
import { MOBILE_TABS, MobileScreenProps } from "./HomeMobile";
import { ChatInput } from "../../components/ChatInput";
import { MessageBubble } from "../../components/MessageBubble";
import { HamptonScene } from "../../components/HamptonScene";
import { useChatStore } from "../../stores/chatStore";

/**
 * Chat Mobile — mobile counterpart of the desktop Chat screen. Same
 * chatStore, same MessageBubble/ChatInput/HamptonScene components as
 * desktop — only the chrome (MobileShell instead of DesktopShell) differs.
 */
export function ChatMobile({ activeTab, onTabChange }: MobileScreenProps) {
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
    <MobileShell
      title="Chat"
      tabs={MOBILE_TABS}
      activeTab={activeTab}
      onTabChange={onTabChange}
      rightAction={<HamptonScene mood={mood} size={32} className="rounded-full overflow-hidden" />}
    >
      <div className="flex h-full flex-col">
        <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center px-4">
              <HamptonScene mood="idle" size={140} />
              <p className="text-sm text-text-muted">
                Comece uma conversa. Hampton reage em tempo real.
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
        <div className="shrink-0 px-4 pb-3">
          <ChatInput
            value={draft}
            onChange={setDraft}
            onSend={handleSend}
            onVoiceStart={() => {}}
            isStreaming={mood === "thinking" || mood === "speaking"}
            placeholder="Fale com o Hampton..."
          />
        </div>
      </div>
    </MobileShell>
  );
}
