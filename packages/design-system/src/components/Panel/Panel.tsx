import React from "react";
import { cn } from "../../utils/cn";

export interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  actions?: React.ReactNode;
  bordered?: boolean;
}

/** Structural section container — e.g. a column inside Studio or Settings. */
export const Panel = React.forwardRef<HTMLDivElement, PanelProps>(
  ({ className, title, actions, bordered = true, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col bg-bg-elevated rounded-lg",
        bordered && "border border-surface-border/8",
        className
      )}
      {...props}
    >
      {(title || actions) && (
        <div className="flex items-center justify-between px-4 h-11 border-b border-surface-border/8 shrink-0">
          {title && (
            <h3 className="text-sm font-semibold text-text-primary tracking-tight">{title}</h3>
          )}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  )
);

Panel.displayName = "Panel";
