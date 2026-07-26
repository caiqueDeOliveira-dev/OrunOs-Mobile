import { supabase } from "./supabaseClient";

export interface ProviderInfo {
  id: string;
  name: string;
  envKey: string;
  configured: boolean;
  models: string[];
}

const PROVIDERS: Omit<ProviderInfo, "configured">[] = [
  {
    id: "groq",
    name: "Groq",
    envKey: "GROQ_API_KEY",
    models: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "whisper-large-v3"],
  },
  {
    id: "openai",
    name: "OpenAI",
    envKey: "OPENAI_API_KEY",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "dall-e-3"],
  },
  {
    id: "claude",
    name: "Anthropic Claude",
    envKey: "ANTHROPIC_API_KEY",
    models: ["claude-sonnet-4-20250514", "claude-3-5-haiku-20241022", "claude-3-opus-20240229"],
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    envKey: "OPENROUTER_API_KEY",
    models: ["meta-llama/llama-3.3-70b-instruct", "anthropic/claude-sonnet-4", "google/gemini-2.0-flash"],
  },
  {
    id: "github",
    name: "GitHub Models",
    envKey: "GITHUB_MODELS_TOKEN",
    models: ["gpt-4o", "gpt-4o-mini", "Phi-4", "Llama-3.3-70B"],
  },
  {
    id: "opencode",
    name: "OpenCode Zen",
    envKey: "OPENCODE_API_KEY",
    models: ["various models"],
  },
];

/**
 * Checks which providers have their API key configured on the server.
 * Uses a lightweight ai-relay call with a minimal prompt to test connectivity.
 * In production, you'd have a dedicated health endpoint — for now we
 * check by querying the agents table for which providers are in use.
 */
export async function checkProviders(): Promise<ProviderInfo[]> {
  const { data: agents } = await supabase
    .from("agents")
    .select("default_provider")
    .not("default_provider", "is", null);

  const usedProviders = new Set(agents?.map((a) => a.default_provider) ?? []);

  return PROVIDERS.map((p) => ({
    ...p,
    configured: usedProviders.has(p.id),
  }));
}

/**
 * Returns the list of all supported cloud providers for display purposes.
 */
export function getAllProviders(): ProviderInfo[] {
  return PROVIDERS.map((p) => ({
    ...p,
    configured: false,
  }));
}
