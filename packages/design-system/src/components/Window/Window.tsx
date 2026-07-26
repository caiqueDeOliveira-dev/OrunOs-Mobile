import React, { useRef } from "react";
import { motion, useDragControls } from "framer-motion";
import { Minus, Square, X } from "lucide-react";
import { cn } from "../../utils/cn";

export interface WindowProps {
  title: string;
  icon?: React.ReactNode;
  onClose?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  children: React.ReactNode;
  className?: string;
  initialPosition?: { x: number; y: number };
  width?: number;
  height?: number;
}

/**
 * OS-style window chrome — used for floating panels inside the Electron shell
 * (e.g. a detached Studio preview, Developer console, Plugin inspector).
 * Native window controls (the actual app frame) are handled by Electron itself;
 * this is for in-app "virtual windows".
 */
export function Window({
  title,
  icon,
  onClose,
  onMinimize,
  onMaximize,
  children,
  className,
  initialPosition = { x: 80, y: 80 },
  width = 480,
  height = 360,
}: WindowProps) {
  const dragControls = useDragControls();
  const constraintsRef = useRef(null);

  return (
    <motion.div
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      dragConstraints={constraintsRef}
      initial={{ opacity: 0, scale: 0.97, x: initialPosition.x, y: initialPosition.y }}
      animate={{ opacity: 1, scale: 1 }}
      style={{ width, height, position: "absolute" }}
      className={cn(
        "flex flex-col rounded-lg bg-bg-elevated border border-surface-border/10 shadow-panel overflow-hidden",
        className
      )}
    >
      <div
        onPointerDown={(e) => dragControls.start(e)}
        className="flex h-9 shrink-0 cursor-grab select-none items-center justify-between border-b border-surface-border/8 bg-bg-overlay px-3 active:cursor-grabbing"
      >
        <div className="flex items-center gap-2 text-xs font-medium text-text-secondary">
          {icon}
          <span className="truncate">{title}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {onMinimize && (
            <button onClick={onMinimize} className="rounded p-1 text-text-muted hover:bg-surface-hover hover:text-text-primary">
              <Minus size={12} />
            </button>
          )}
          {onMaximize && (
            <button onClick={onMaximize} className="rounded p-1 text-text-muted hover:bg-surface-hover hover:text-text-primary">
              <Square size={11} />
            </button>
          )}
          {onClose && (
            <button onClick={onClose} className="rounded p-1 text-text-muted hover:bg-status-danger hover:text-white">
              <X size={12} />
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-auto">{children}</div>
    </motion.div>
  );
}
