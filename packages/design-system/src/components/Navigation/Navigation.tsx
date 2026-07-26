import React from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "../../utils/cn";

export interface NavigationCrumb {
  label: string;
  onClick?: () => void;
}

export interface NavigationProps {
  crumbs: NavigationCrumb[];
  actions?: React.ReactNode;
  className?: string;
}

/** Top bar: breadcrumb trail + contextual actions. Sits above every screen's content area. */
export function Navigation({ crumbs, actions, className }: NavigationProps) {
  return (
    <header
      className={cn(
        "flex h-14 shrink-0 items-center justify-between border-b border-surface-border/8 bg-bg-base/80 backdrop-blur-glass px-5",
        className
      )}
    >
      <div className="flex items-center gap-1.5 text-sm">
        {crumbs.map((crumb, i) => (
          <React.Fragment key={i}>
            {i > 0 && <ChevronRight size={14} className="text-text-muted" />}
            <button
              onClick={crumb.onClick}
              disabled={!crumb.onClick}
              className={cn(
                i === crumbs.length - 1
                  ? "text-text-primary font-semibold"
                  : "text-text-muted hover:text-text-secondary transition-colors disabled:cursor-default"
              )}
            >
              {crumb.label}
            </button>
          </React.Fragment>
        ))}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
