import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../utils/cn";
import type { Size } from "../../types";

export interface LoaderProps {
  size?: Size;
  variant?: "spinner" | "dots" | "pulse";
  className?: string;
  label?: string;
}

const pxMap: Record<Size, number> = { xs: 14, sm: 18, md: 24, lg: 32, xl: 44 };

/** Loading indicator. `pulse` variant echoes Hampton's idle breathing animation. */
export function Loader({ size = "md", variant = "spinner", className, label }: LoaderProps) {
  const px = pxMap[size];

  if (variant === "dots") {
    return (
      <div className={cn("inline-flex items-center gap-1", className)} role="status" aria-label={label ?? "Carregando"}>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="rounded-full bg-accent"
            style={{ width: px / 4, height: px / 4 }}
            animate={{ y: [0, -px / 4, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.12, ease: "easeInOut" }}
          />
        ))}
      </div>
    );
  }

  if (variant === "pulse") {
    return (
      <motion.div
        className={cn("rounded-full bg-accent", className)}
        style={{ width: px, height: px }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        role="status"
        aria-label={label ?? "Carregando"}
      />
    );
  }

  return (
    <motion.div
      className={cn("rounded-full border-2 border-surface-border/20 border-t-accent", className)}
      style={{ width: px, height: px }}
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
      role="status"
      aria-label={label ?? "Carregando"}
    />
  );
}
