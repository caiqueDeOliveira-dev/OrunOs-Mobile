export type Size = "xs" | "sm" | "md" | "lg" | "xl";
export type Variant = "primary" | "secondary" | "ghost" | "danger" | "gold" | "outline";
export type StatusKind = "success" | "warning" | "danger" | "info" | "neutral";

export interface OrunAgent {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string;
  status: "online" | "busy" | "offline";
  isCore?: boolean;
}

export type HamptonMood = "idle" | "listening" | "thinking" | "speaking";

export interface ChatMessage {
  id: string;
  conversation_id: string;
  seq: number;
  role: "user" | "assistant" | "system";
  agent_id: string | null;
  content: string;
  provider: string | null;
  model: string | null;
  created_at: string;
}

export interface ConversationSummary {
  id: string;
  title: string;
  agent_id: string | null;
  updated_at: string;
}

export interface Automation {
  id: string;
  name: string;
  kind: string;
  enabled: boolean;
  config: Record<string, unknown>;
  updated_at: string;
}

export interface AgentConfig {
  id: string;
  name: string;
  default_provider: string | null;
  default_model: string | null;
  persona_prompt: string | null;
}
