import React, { useRef, useState, KeyboardEvent } from "react";
import { motion } from "framer-motion";
import { ArrowUp, Mic, Paperclip, Square } from "lucide-react";
import { cn } from "../../utils/cn";

export interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onAttach?: () => void;
  onVoiceStart?: () => void;
  isStreaming?: boolean;
  onStop?: () => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * The single, canonical message composer for Orun OS. Used verbatim across
 * Chat, Voice Mode (as fallback text entry), Developer console prompts, and
 * every specialized agent screen — never re-implemented per screen.
 */
export function ChatInput({
  value,
  onChange,
  onSend,
  onAttach,
  onVoiceStart,
  isStreaming = false,
  onStop,
  placeholder = "Fale com o Hampton...",
  className,
  disabled = false,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [focused, setFocused] = useState(false);

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isStreaming) onSend();
    }
  }

  function autoGrow() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  return (
    <motion.div
      animate={{
        borderColor: focused ? "rgb(var(--orun-accent) / 0.5)" : "rgb(var(--orun-surface-border) / 0.1)",
        boxShadow: focused ? "0 0 0 3px rgb(var(--orun-accent) / 0.12)" : "none",
      }}
      transition={{ duration: 0.15 }}
      className={cn(
        "flex items-end gap-2 rounded-xl bg-bg-sunken border px-3 py-2.5",
        className
      )}
    >
      {onAttach && (
        <button
          onClick={onAttach}
          disabled={disabled}
          className="mb-0.5 shrink-0 rounded-md p-1.5 text-text-muted hover:bg-surface-hover hover:text-text-primary transition-colors disabled:opacity-40"
        >
          <Paperclip size={18} />
        </button>
      )}
      <textarea
        ref={textareaRef}
        rows={1}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => {
          onChange(e.target.value);
          autoGrow();
        }}
        onKeyDown={handleKeyDown}
        className="flex-1 resize-none bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none max-h-40 py-1"
      />
      {onVoiceStart && !value.trim() && (
        <button
          onClick={onVoiceStart}
          disabled={disabled}
          className="mb-0.5 shrink-0 rounded-md p-1.5 text-text-muted hover:bg-surface-hover hover:text-text-primary transition-colors disabled:opacity-40"
        >
          <Mic size={18} />
        </button>
      )}
      {isStreaming ? (
        <button
          onClick={onStop}
          className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-active text-text-primary hover:bg-surface-hover"
        >
          <Square size={13} fill="currentColor" />
        </button>
      ) : (
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={onSend}
          disabled={disabled || !value.trim()}
          className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-text-inverted disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
        >
          <ArrowUp size={16} />
        </motion.button>
      )}
    </motion.div>
  );
}
