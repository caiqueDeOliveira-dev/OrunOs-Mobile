import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../utils/cn";

export interface BottomNavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

export interface BottomNavigationProps {
  items: BottomNavItem[];
  activeId: string;
  onSelect: (id: string) => void;
  className?: string;
}

/** Mobile primary tab bar — fixed to the bottom edge, safe-area aware. */
export function BottomNavigation({ items, activeId, onSelect, className }: BottomNavigationProps) {
  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around",
        "bg-bg-elevated/90 backdrop-blur-glass border-t border-surface-border/8",
        "pb-[env(safe-area-inset-bottom)] h-16",
        className
      )}
    >
      {items.map((item) => {
        const active = item.id === activeId;
        return (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className="relative flex flex-1 flex-col items-center justify-center gap-1 h-full"
          >
            {active && (
              <motion.span
                layoutId="orun-bottomnav-active"
                className="absolute top-0 h-0.5 w-8 rounded-full bg-accent"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className={cn(active ? "text-accent" : "text-text-muted")}>{item.icon}</span>
            <span className={cn("text-[10px]", active ? "text-accent font-medium" : "text-text-muted")}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
