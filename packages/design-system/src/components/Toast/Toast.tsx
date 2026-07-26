import React, { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";
import { createPortal } from "react-dom";
import { cn } from "../../utils/cn";
import { useToastStore, ToastItem } from "../../stores/toastStore";
import type { StatusKind } from "../../types";

const iconMap: Record<StatusKind, React.ReactNode> = {
  success: <CheckCircle2 size={18} className="text-status-success" />,
  warning: <AlertTriangle size={18} className="text-status-warning" />,
  danger: <XCircle size={18} className="text-status-danger" />,
  info: <Info size={18} className="text-status-info" />,
  neutral: <Info size={18} className="text-text-secondary" />,
};

function ToastCard({ item }: { item: ToastItem }) {
  const dismiss = useToastStore((s) => s.dismiss);

  useEffect(() => {
    const t = setTimeout(() => dismiss(item.id), item.duration);
    return () => clearTimeout(t);
  }, [item, dismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 40, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 32 }}
      className={cn(
        "flex items-start gap-3 w-80 rounded-lg bg-bg-elevated border border-surface-border/10",
        "shadow-panel px-4 py-3"
      )}
    >
      <span className="mt-0.5 shrink-0">{iconMap[item.kind]}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary">{item.title}</p>
        {item.description && <p className="mt-0.5 text-xs text-text-secondary">{item.description}</p>}
      </div>
      <button
        onClick={() => dismiss(item.id)}
        className="text-text-muted hover:text-text-primary transition-colors"
        aria-label="Dispensar"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}

/** Mount this once near the root of the app (Desktop shell + Mobile shell). */
export function ToastViewport() {
  const toasts = useToastStore((s) => s.toasts);
  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <ToastCard key={t.id} item={t} />
        ))}
      </AnimatePresence>
    </div>,
    document.body
  );
}
