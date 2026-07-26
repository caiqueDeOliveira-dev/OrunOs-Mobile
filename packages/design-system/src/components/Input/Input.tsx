import React, { InputHTMLAttributes, forwardRef, useId } from "react";
import { cn } from "../../utils/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftIcon, rightIcon, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-text-secondary">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3 flex items-center text-text-muted pointer-events-none">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full h-10 rounded-md bg-bg-sunken border border-surface-border/10 px-3 text-sm text-text-primary",
              "placeholder:text-text-muted outline-none transition-all duration-150",
              "focus:border-accent/60 focus:ring-2 focus:ring-accent/20",
              error && "border-status-danger/60 focus:border-status-danger focus:ring-status-danger/20",
              leftIcon && "pl-9",
              rightIcon && "pr-9",
              className
            )}
            aria-invalid={!!error}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 flex items-center text-text-muted">{rightIcon}</span>
          )}
        </div>
        {error ? (
          <span className="text-xs text-status-danger">{error}</span>
        ) : hint ? (
          <span className="text-xs text-text-muted">{hint}</span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
