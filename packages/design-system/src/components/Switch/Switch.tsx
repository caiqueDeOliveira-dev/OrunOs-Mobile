import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../utils/cn";

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

/** Boolean toggle — Settings, Automation triggers, Plugin enable/disable. */
export function Switch({ checked, onChange, label, description, disabled, className }: SwitchProps) {
  return (
    <label className={cn("flex items-center justify-between gap-4 cursor-pointer", disabled && "opacity-40 cursor-not-allowed", className)}>
      {(label || description) && (
        <span className="flex flex-col">
          {label && <span className="text-sm text-text-primary">{label}</span>}
          {description && <span className="text-xs text-text-muted">{description}</span>}
        </span>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200",
          checked ? "bg-accent" : "bg-surface-active"
        )}
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 500, damping: 32 }}
          className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow"
          style={{ left: checked ? "calc(100% - 22px)" : "2px" }}
        />
      </button>
    </label>
  );
}
