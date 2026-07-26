import React, { ButtonHTMLAttributes, forwardRef } from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "../../utils/cn";
import type { Size, Variant } from "../../types";

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onDrag" | "onDragEnd" | "onDragStart" | "onAnimationStart"> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  glow?: boolean;
  fullWidth?: boolean;
}

const sizeMap: Record<Size, string> = {
  xs: "h-7 px-2.5 text-xs gap-1.5",
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-5 text-base gap-2",
  xl: "h-14 px-6 text-lg gap-2.5",
};

const variantMap: Record<Variant, string> = {
  primary:
    "bg-accent text-text-inverted hover:bg-accent-hover active:bg-accent shadow-inset border border-transparent",
  secondary:
    "bg-surface text-text-primary hover:bg-surface-hover active:bg-surface-active border border-surface-border/10",
  ghost:
    "bg-transparent text-text-secondary hover:bg-surface-hover hover:text-text-primary border border-transparent",
  outline:
    "bg-transparent text-text-primary hover:bg-surface-hover border border-surface-border/20",
  danger:
    "bg-status-danger text-white hover:bg-status-danger/90 border border-transparent",
  gold:
    "bg-gold text-text-inverted hover:bg-gold/90 border border-transparent",
};

/**
 * Orun OS primary Button.
 * Every clickable action in the app should route through this component —
 * never hand-roll a <button> with ad-hoc Tailwind classes.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      iconPosition = "left",
      glow = false,
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <motion.button
        ref={ref}
        whileTap={!isDisabled ? { scale: 0.97 } : undefined}
        whileHover={!isDisabled ? { scale: 1.015 } : undefined}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        disabled={isDisabled}
        className={cn(
          "relative inline-flex items-center justify-center rounded-md font-medium",
          "transition-colors duration-150 select-none outline-none",
          "focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base",
          "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100",
          sizeMap[size],
          variantMap[variant],
          glow && !isDisabled && "shadow-glow",
          fullWidth && "w-full",
          className
        )}
        {...(props as HTMLMotionProps<"button">)}
      >
        {loading ? (
          <Loader2 className="animate-spin" size={size === "xs" || size === "sm" ? 14 : 16} />
        ) : (
          icon && iconPosition === "left" && <span className="inline-flex shrink-0">{icon}</span>
        )}
        {children && <span className="truncate">{children}</span>}
        {!loading && icon && iconPosition === "right" && (
          <span className="inline-flex shrink-0">{icon}</span>
        )}
      </motion.button>
    );
  }
);

Button.displayName = "Button";
