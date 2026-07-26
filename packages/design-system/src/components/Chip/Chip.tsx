import React from "react";
import { X } from "lucide-react";
import { cn } from "../../utils/cn";

export interface ChipProps extends React.HTMLAttributes<HTMLDivElement> {
  selected?: boolean;
  onRemove?: () => void;
  icon?: React.ReactNode;
}

/** Filter/selection chip — e.g. active model tags, project labels. */
export function Chip({ className, selected = false, onRemove, icon, children, ...props }: ChipProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 h-7 text-xs font-medium cursor-pointer select-none",
        "border transition-colors duration-150",
        selected
          ? "bg-accent/15 border-accent/40 text-accent"
          : "bg-surface border-surface-border/10 text-text-secondary hover:bg-surface-hover",
        className
      )}
      {...props}
    >
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 rounded-full hover:bg-surface-active p-0.5 -mr-1"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}
