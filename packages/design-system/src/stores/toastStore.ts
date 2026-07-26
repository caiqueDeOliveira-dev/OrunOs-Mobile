import { create } from "zustand";
import type { StatusKind } from "../types";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  kind: StatusKind;
  duration: number;
}

interface ToastStore {
  toasts: ToastItem[];
  push: (toast: Omit<ToastItem, "id" | "duration"> & { duration?: number }) => void;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  push: (toast) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        { ...toast, id: crypto.randomUUID(), duration: toast.duration ?? 4000 },
      ],
    })),
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

/** Convenience helper: toast.success("Salvo"), toast.error("Falhou", "Detalhe") */
export const toast = {
  success: (title: string, description?: string) =>
    useToastStore.getState().push({ title, description, kind: "success" }),
  error: (title: string, description?: string) =>
    useToastStore.getState().push({ title, description, kind: "danger" }),
  info: (title: string, description?: string) =>
    useToastStore.getState().push({ title, description, kind: "info" }),
  warning: (title: string, description?: string) =>
    useToastStore.getState().push({ title, description, kind: "warning" }),
};
