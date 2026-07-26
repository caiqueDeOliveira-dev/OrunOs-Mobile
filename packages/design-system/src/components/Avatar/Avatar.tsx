import React, { useState } from "react";
import { cn } from "../../utils/cn";
import type { Size } from "../../types";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  name: string;
  size?: Size;
  status?: "online" | "busy" | "offline";
  isCore?: boolean; // Hampton — the central agent gets a distinct gold ring
}

const sizeMap: Record<Size, string> = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
  xl: "h-20 w-20 text-xl",
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "").concat(parts.length > 1 ? parts[parts.length - 1][0] : "").toUpperCase();
}

const statusColor: Record<NonNullable<AvatarProps["status"]>, string> = {
  online: "bg-status-success",
  busy: "bg-status-warning",
  offline: "bg-text-muted",
};

/** Avatar for a user or an Orun agent. Hampton (isCore) renders a gold glow ring. */
export function Avatar({ className, src, name, size = "md", status, isCore = false, ...props }: AvatarProps) {
  const [errored, setErrored] = useState(false);

  return (
    <div className={cn("relative inline-flex shrink-0", className)} {...props}>
      <div
        className={cn(
          "rounded-full flex items-center justify-center font-semibold overflow-hidden",
          "bg-surface-active text-text-primary",
          sizeMap[size],
          isCore && "ring-2 ring-gold shadow-glow"
        )}
      >
        {src && !errored ? (
          <img
            src={src}
            alt={name}
            className="h-full w-full object-cover"
            onError={() => setErrored(true)}
          />
        ) : (
          <span>{initials(name)}</span>
        )}
      </div>
      {status && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full ring-2 ring-bg-base",
            statusColor[status],
            size === "xs" || size === "sm" ? "h-2 w-2" : "h-3 w-3"
          )}
        />
      )}
    </div>
  );
}
