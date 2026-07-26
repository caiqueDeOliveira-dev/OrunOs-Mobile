import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../utils/cn";

export interface ProgressProps {
  value: number; // 0-100
  className?: string;
  variant?: "linear" | "circular";
  size?: number; // circular diameter in px
  showLabel?: boolean;
}

/** Determinate progress — model downloads, TTS synthesis, file uploads. */
export function Progress({ value, className, variant = "linear", size = 48, showLabel = false }: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value));

  if (variant === "circular") {
    const radius = (size - 6) / 2;
    const circumference = 2 * Math.PI * radius;
    return (
      <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={4} className="stroke-surface-border/10" fill="none" />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={4}
            className="stroke-accent"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - (clamped / 100) * circumference }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </svg>
        {showLabel && (
          <span className="absolute text-xs font-semibold text-text-primary">{Math.round(clamped)}%</span>
        )}
      </div>
    );
  }

  return (
    <div className={cn("w-full h-1.5 rounded-full bg-surface-active overflow-hidden", className)}>
      <motion.div
        className="h-full rounded-full bg-accent shadow-glow"
        initial={{ width: 0 }}
        animate={{ width: `${clamped}%` }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      />
    </div>
  );
}
