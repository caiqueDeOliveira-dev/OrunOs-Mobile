import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import { cn } from "../../utils/cn";

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  side?: "left" | "right" | "bottom";
  children: React.ReactNode;
  className?: string;
}

const sideVariants = {
  left: { closed: { x: "-100%" }, open: { x: 0 }, className: "left-0 top-0 h-full w-80" },
  right: { closed: { x: "100%" }, open: { x: 0 }, className: "right-0 top-0 h-full w-80" },
  bottom: { closed: { y: "100%" }, open: { y: 0 }, className: "bottom-0 left-0 w-full max-h-[85vh] rounded-t-2xl" },
};

/** Slide-in drawer. `bottom` is the standard mobile sheet; `left`/`right` for desktop detail panels. */
export function Drawer({ open, onClose, side = "right", children, className }: DrawerProps) {
  if (typeof document === "undefined") return null;
  const variant = sideVariants[side];

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            onClick={onClose}
          />
          <motion.div
            initial={variant.closed}
            animate={variant.open}
            exit={variant.closed}
            transition={{ type: "spring", stiffness: 360, damping: 38 }}
            className={cn(
              "absolute bg-bg-elevated border-surface-border/10 shadow-panel overflow-y-auto",
              side === "left" && "border-r",
              side === "right" && "border-l",
              side === "bottom" && "border-t",
              variant.className,
              className
            )}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
