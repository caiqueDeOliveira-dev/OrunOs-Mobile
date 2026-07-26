import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "../../utils/cn";

export interface FloatingButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  icon: React.ReactNode;
  label?: string; // visually hidden, for a11y
  glow?: boolean;
}

/** Floating action button — mobile primary action, desktop overlay shortcuts (e.g. summon Hampton). */
export const FloatingButton = React.forwardRef<HTMLButtonElement, FloatingButtonProps>(
  ({ className, icon, label, glow = true, ...props }, ref) => (
    <motion.button
      ref={ref}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      animate={glow ? { boxShadow: ["0 0 0px rgb(var(--orun-accent-glow)/0)", "0 0 28px 4px rgb(var(--orun-accent-glow)/0.4)", "0 0 0px rgb(var(--orun-accent-glow)/0)"] } : undefined}
      transition={glow ? { duration: 2.8, repeat: Infinity, ease: "easeInOut" } : { type: "spring", stiffness: 500, damping: 30 }}
      className={cn(
        "fixed z-40 flex h-14 w-14 items-center justify-center rounded-full",
        "bg-accent text-text-inverted shadow-panel",
        className
      )}
      {...props}
    >
      {icon}
      {label && <span className="sr-only">{label}</span>}
    </motion.button>
  )
);

FloatingButton.displayName = "FloatingButton";
