import React from "react";
import { cn } from "../../utils/cn";
import type { StatusKind } from "../../types";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  kind?: StatusKind;
  dot?: boolean;
}

const kindMap: Record<StatusKind, string> = {
  success: "bg-status-success/15 text-status-success",
  warning: "bg-status-warning/15 text-status-warning",
  danger: "bg-status-danger/15 text-status-danger",
  info: "bg-status-info/15 text-status-info",
  neutral: "bg-surface-hover text-text-secondary",
};

/** Small static label — counts, tags, categories. For live status use StatusChip. */
export function Badge({ className, kind = "neutral", dot = false, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
        kindMap[kind],
        className
      )}
      {...props}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", kindMap[kind].split(" ")[1])} style={{ backgroundColor: "currentColor" }} />}
      {children}
    </span>
  );
}
