import React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../utils/cn";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  label?: string;
  className?: string;
}

/** Styled dropdown — provider/model pickers in Settings, Developer, Studio. */
export function Select({ value, onChange, options, label, className }: SelectProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && <span className="text-xs font-medium text-text-secondary">{label}</span>}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "w-full h-10 appearance-none rounded-md bg-bg-sunken border border-surface-border/10",
            "pl-3 pr-9 text-sm text-text-primary outline-none transition-colors",
            "focus:border-accent/60 focus:ring-2 focus:ring-accent/20"
          )}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-muted" />
      </div>
    </div>
  );
}
