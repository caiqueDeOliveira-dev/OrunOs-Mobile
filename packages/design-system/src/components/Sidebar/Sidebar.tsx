import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../utils/cn";

export interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number | string;
}

export interface SidebarProps {
  items: SidebarItem[];
  activeId: string;
  onSelect: (id: string) => void;
  collapsed?: boolean;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

/** Desktop primary navigation rail — left edge of the Electron shell. */
export function Sidebar({ items, activeId, onSelect, collapsed = false, header, footer, className }: SidebarProps) {
  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ type: "spring", stiffness: 300, damping: 32 }}
      className={cn(
        "flex h-full flex-col bg-bg-sunken border-r border-surface-border/8 overflow-hidden",
        className
      )}
    >
      {header && <div className="shrink-0 px-3 py-4">{header}</div>}
      <nav className="flex-1 min-h-0 overflow-y-auto px-2 space-y-1">
        {items.map((item) => {
          const active = item.id === activeId;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={cn(
                "relative flex w-full items-center gap-3 rounded-md px-3 h-10 text-sm font-medium transition-colors",
                active
                  ? "bg-accent/12 text-accent"
                  : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
              )}
            >
              {active && (
                <motion.span
                  layoutId="orun-sidebar-active"
                  className="absolute left-0 h-6 w-0.5 rounded-full bg-accent"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="shrink-0">{item.icon}</span>
              {!collapsed && <span className="truncate">{item.label}</span>}
              {!collapsed && item.badge !== undefined && (
                <span className="ml-auto rounded-full bg-surface-active px-1.5 py-0.5 text-[10px] text-text-secondary">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
      {footer && <div className="shrink-0 border-t border-surface-border/8 px-3 py-3">{footer}</div>}
    </motion.aside>
  );
}
