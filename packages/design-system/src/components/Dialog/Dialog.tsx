import React from "react";
import { X } from "lucide-react";
import { Modal } from "../Modal";
import { Button } from "../Button";
import type { Size } from "../../types";

export interface DialogAction {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  loading?: boolean;
}

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  actions?: DialogAction[];
  size?: Size;
}

/** Confirm / alert / form dialog. For arbitrary floating panels, use Modal directly. */
export function Dialog({ open, onClose, title, description, children, actions, size = "sm" }: DialogProps) {
  return (
    <Modal open={open} onClose={onClose} size={size}>
      <div className="flex items-start justify-between px-5 pt-5">
        <div>
          <h2 className="text-base font-semibold text-text-primary">{title}</h2>
          {description && <p className="mt-1 text-sm text-text-secondary">{description}</p>}
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-text-muted hover:bg-surface-hover hover:text-text-primary transition-colors"
          aria-label="Fechar"
        >
          <X size={16} />
        </button>
      </div>
      {children && <div className="px-5 py-4">{children}</div>}
      {actions && actions.length > 0 && (
        <div className="flex items-center justify-end gap-2 px-5 pb-5 pt-2">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant={action.variant ?? "secondary"}
              size="sm"
              loading={action.loading}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </Modal>
  );
}
