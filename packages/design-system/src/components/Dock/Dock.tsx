import React, { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "../../utils/cn";
import { Avatar } from "../Avatar";
import type { OrunAgent } from "../../types";

export interface DockProps {
  agents: OrunAgent[];
  activeId?: string;
  onSelect: (id: string) => void;
  className?: string;
}

/**
 * Floating desktop dock for switching between agents. Hampton (isCore) is
 * always rendered first, visually larger, with a persistent gold glow —
 * the interface revolves around him.
 */
export function Dock({ agents, activeId, onSelect, className }: DockProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const ordered = [...agents].sort((a, b) => (b.isCore ? 1 : 0) - (a.isCore ? 1 : 0));

  return (
    <div
      className={cn(
        "flex items-end gap-2 rounded-2xl bg-bg-elevated/70 backdrop-blur-glass",
        "border border-surface-border/10 px-3 py-2 shadow-panel",
        className
      )}
    >
      {ordered.map((agent) => {
        const isHovered = hovered === agent.id;
        const scale = agent.isCore ? 1.15 : isHovered ? 1.12 : 1;
        return (
          <motion.button
            key={agent.id}
            onMouseEnter={() => setHovered(agent.id)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onSelect(agent.id)}
            animate={{ scale, y: isHovered || agent.isCore ? -4 : 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            className="relative flex flex-col items-center"
          >
            <Avatar
              name={agent.name}
              src={agent.avatarUrl}
              size={agent.isCore ? "lg" : "md"}
              status={agent.status}
              isCore={agent.isCore}
            />
            {activeId === agent.id && (
              <motion.span layoutId="orun-dock-active" className="mt-1 h-1 w-1 rounded-full bg-accent" />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
