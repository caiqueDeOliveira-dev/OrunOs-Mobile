import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "../../utils/cn";

export interface GlassCardProps extends HTMLMotionProps<"div"> {
  glow?: boolean;
  border?: boolean;
}

/**
 * Frosted glass surface — used for floating panels over the 3D Hampton scene,
 * command palettes, and overlays where content behind should stay visible.
 */
export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, glow = false, border = true, children, ...props }, ref) => (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "rounded-xl bg-bg-elevated/60 backdrop-blur-glass",
        border && "border border-surface-border/10",
        glow && "shadow-glow",
        "shadow-panel",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  )
);

GlassCard.displayName = "GlassCard";
