import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../utils/cn";
import { Avatar } from "../Avatar";
import { Loader } from "../Loader";

export interface MessageBubbleProps {
  role: "user" | "agent";
  agentName?: string;
  agentAvatarUrl?: string;
  isCore?: boolean;
  content: string;
  timestamp?: string;
  isStreaming?: boolean;
}

/**
 * Single message row in Chat / Developer console / any agent conversation.
 * Content is rendered as plain text on purpose — markdown rendering is a
 * concern for a future `MarkdownRenderer` util, kept out of this primitive.
 */
export function MessageBubble({
  role,
  agentName = "Hampton",
  agentAvatarUrl,
  isCore = true,
  content,
  timestamp,
  isStreaming = false,
}: MessageBubbleProps) {
  const isUser = role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn("flex gap-3 px-1", isUser && "flex-row-reverse")}
    >
      {!isUser && <Avatar name={agentName} src={agentAvatarUrl} size="sm" isCore={isCore} />}
      <div className={cn("flex max-w-[72%] flex-col gap-1", isUser && "items-end")}>
        {!isUser && <span className="text-xs font-medium text-text-secondary px-1">{agentName}</span>}
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words",
            isUser
              ? "bg-accent text-text-inverted rounded-tr-sm"
              : "bg-surface text-text-primary border border-surface-border/8 rounded-tl-sm"
          )}
        >
          {content}
          {isStreaming && (
            <span className="ml-1.5 inline-flex align-middle">
              <Loader variant="dots" size="xs" />
            </span>
          )}
        </div>
        {timestamp && <span className="px-1 text-[11px] text-text-muted">{timestamp}</span>}
      </div>
    </motion.div>
  );
}
