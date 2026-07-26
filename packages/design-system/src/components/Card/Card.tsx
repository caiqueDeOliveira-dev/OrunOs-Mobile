import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "../../utils/cn";

export interface CardProps extends HTMLMotionProps<"div"> {
  interactive?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingMap = {
  none: "p-0",
  sm: "p-3",
  md: "p-5",
  lg: "p-7",
};

/** Base surface container. Use GlassCard for translucent/blurred variants. */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, interactive = false, padding = "md", children, ...props }, ref) => (
    <motion.div
      ref={ref}
      whileHover={interactive ? { y: -2, transition: { duration: 0.15 } } : undefined}
      className={cn(
        "rounded-lg bg-surface border border-surface-border/8 shadow-panel",
        interactive && "cursor-pointer hover:border-accent/30 transition-colors duration-150",
        paddingMap[padding],
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  )
);

Card.displayName = "Card";
