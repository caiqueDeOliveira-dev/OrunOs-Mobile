import React from "react";
import { cn } from "../../utils/cn";

export type LiveStatus = "online" | "busy" | "offline" | "connecting";

export interface StatusChipProps extends React.HTMLAttributes<HTMLDivElement> {
  status: LiveStatus;
  label?: string;
  pulse?: boolean;
}

const statusMap: Record<LiveStatus, { color: string; text: string }> = {
  online: { color: "bg-status-success", text: "Online" },
  busy: { color: "bg-status-warning", text: "Ocupado" },
  offline: { color: "bg-text-muted", text: "Offline" },
  connecting: { color: "bg-status-info", text: "Conectando" },
};

/** Live status indicator — agent presence, provider connectivity, sync state. */
export function StatusChip({ status, label, pulse = status === "online", className, ...props }: StatusChipProps) {
  const info = statusMap[status];
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-surface px-2 py-0.5 text-xs text-text-secondary",
        className
      )}
      {...props}
    >
      <span className="relative flex h-1.5 w-1.5">
        {pulse && (
          <span className={cn("absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping", info.color)} />
        )}
        <span className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", info.color)} />
      </span>
      {label ?? info.text}
    </div>
  );
}
