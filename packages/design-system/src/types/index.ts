import type { ReactNode } from "react";

export type Size = "xs" | "sm" | "md" | "lg" | "xl";
export type Variant = "primary" | "secondary" | "ghost" | "danger" | "gold" | "outline";
export type StatusKind = "success" | "warning" | "danger" | "info" | "neutral";

export interface WithChildren {
  children?: ReactNode;
}

export interface BaseComponentProps {
  className?: string;
  "data-testid"?: string;
}

/** A single agent in the Orun OS agent roster (used across Sidebar, Dock, Chat). */
export interface OrunAgent {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string;
  status: "online" | "busy" | "offline";
  isCore?: boolean; // true for Hampton — the central agent
}
