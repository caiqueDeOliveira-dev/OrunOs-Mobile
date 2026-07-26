import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../utils/cn";
import { Avatar } from "../Avatar";
import type { StatusKind } from "../../types";

export interface NotificationItemProps {
  title: string;
  description?: string;
  timestamp: string;
  read?: boolean;
  kind?: StatusKind;
  agentName?: string;
  agentAvatarUrl?: string;
  onClick?: () => void;
}

const dotColor: Record<StatusKind, string> = {
  success: "bg-status-success",
  warning: "bg-status-warning",
  danger: "bg-status-danger",
  info: "bg-status-info",
  neutral: "bg-text-muted",
};

/** Single row inside the Notification Center (Notifications screen). */
export function NotificationItem({
  title,
  description,
  timestamp,
  read = false,
  kind = "info",
  agentName,
  agentAvatarUrl,
  onClick,
}: NotificationItemProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ backgroundColor: "rgb(var(--orun-surface-hover))" }}
      className={cn(
        "flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition-colors",
        !read && "bg-surface/60"
      )}
    >
      {agentName ? (
        <Avatar name={agentName} src={agentAvatarUrl} size="sm" />
      ) : (
        <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", dotColor[kind])} />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={cn("text-sm truncate", read ? "text-text-secondary" : "text-text-primary font-medium")}>
            {title}
          </p>
          <span className="shrink-0 text-[11px] text-text-muted">{timestamp}</span>
        </div>
        {description && <p className="mt-0.5 text-xs text-text-muted line-clamp-2">{description}</p>}
      </div>
      {!read && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />}
    </motion.button>
  );
}
