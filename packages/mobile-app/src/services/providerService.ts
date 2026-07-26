import { supabase } from "./supabaseClient";

export interface ProviderInfo {
  id: string;
  name: string;
  envKey: string;
  configured: boolean;
  models: ModelInfo[];
}

export interface ModelInfo {
  id: string;
  name: string;
  free: boolean;
  description: string;
}

const PROVIDERS: ProviderInfo[] = [
  {
    id: "groq",
    name: "Groq",
    envKey: "GROQ_API_KEY",
    configured: true,
    models: [
      { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B", free: true, description: "Mais inteligente, 50k req/dia gratis" },
      { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B", free: true, description: "Mais rapido, 50k req/dia gratis" },
      { id: "gemma2-9b-it", name: "Gemma 2 9B", free: true, description: "Bom para chat, 50k req/dia gratis" },
      { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B", free: true, description: "Bom para raciocinio, 50k req/dia gratis" },
    ],
  },
  {
    id: "opencode",
    name: "OpenCode Zen",
    envKey: "OPENCODE_API_KEY",
    configured: true,
    models: [
      { id: "big-pickle", name: "Big Pickle", free: true, description: "Modelo principal do OpenCode" },
    ],
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    envKey: "OPENROUTER_API_KEY",
    configured: true,
    models: [
      { id: "meta-llama/llama-3.3-70b-instruct", name: "Llama 3.3 70B", free: true, description: "Gratis via OpenRouter" },
      { id: "google/gemini-2.0-flash-exp:free", name: "Gemini 2.0 Flash", free: true, description: "Gratis, muito rapido" },
      { id: "deepseek/deepseek-chat-v3-0324:free", name: "DeepSeek V3", free: true, description: "Gratis, otimo para codigo" },
      { id: "qwen/qwen-2.5-72b-instruct:free", name: "Qwen 2.5 72B", free: true, description: "Gratis, multilingue" },
      { id: "anthropic/claude-sonnet-4", name: "Claude Sonnet 4", free: false, description: "Pago, $0.003/1k tokens" },
      { id: "openai/gpt-4o", name: "GPT-4o", free: false, description: "Pago, $0.0025/1k tokens" },
    ],
  },
  {
    id: "openai",
    name: "OpenAI",
    envKey: "OPENAI_API_KEY",
    configured: true,
    models: [
      { id: "gpt-4o", name: "GPT-4o", free: false, description: "Mais inteligente, $0.0025/1k tokens" },
      { id: "gpt-4o-mini", name: "GPT-4o Mini", free: false, description: "Rapido e barato, $0.00015/1k tokens" },
      { id: "gpt-4-turbo", name: "GPT-4 Turbo", free: false, description: "Otimo para analise, $0.01/1k tokens" },
    ],
  },
  {
    id: "claude",
    name: "Anthropic Claude",
    envKey: "ANTHROPIC_API_KEY",
    configured: true,
    models: [
      { id: "claude-sonnet-4-20250514", name: "Claude Sonnet 4", free: false, description: "Otimo equilibrio, $0.003/1k tokens" },
      { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku", free: false, description: "Mais rapido, $0.001/1k tokens" },
      { id: "claude-3-opus-20240229", name: "Claude 3 Opus", free: false, description: "Mais inteligente, $0.015/1k tokens" },
    ],
  },
  {
    id: "github",
    name: "GitHub Models",
    envKey: "GITHUB_MODELS_TOKEN",
    configured: true,
    models: [
      { id: "gpt-4o", name: "GPT-4o", free: true, description: "Gratis com GitHub token" },
      { id: "gpt-4o-mini", name: "GPT-4o Mini", free: true, description: "Gratis com GitHub token" },
      { id: "Phi-4", name: "Phi-4", free: true, description: "Gratis, leve" },
      { id: "Llama-3.3-70B", name: "Llama 3.3 70B", free: true, description: "Gratis com GitHub token" },
    ],
  },
];

/**
 * Returns all providers with their models.
 */
export function getAllProviders(): ProviderInfo[] {
  return PROVIDERS;
}

/**
 * Returns only providers that have free models.
 */
export function getFreeProviders(): ProviderInfo[] {
  return PROVIDERS.filter((p) => p.models.some((m) => m.free));
}

/**
 * Returns free models for a specific provider.
 */
export function getFreeModels(providerId: string): ModelInfo[] {
  const provider = PROVIDERS.find((p) => p.id === providerId);
  return provider?.models.filter((m) => m.free) ?? [];
}

/**
 * Changes the default provider and model for an agent.
 */
export async function setAgentProvider(
  agentId: string,
  providerId: string,
  modelId: string,
): Promise<void> {
  const { error } = await supabase
    .from("agents")
    .update({
      default_provider: providerId,
      default_model: modelId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", agentId);

  if (error) throw new Error(`Failed to update agent provider: ${error.message}`);
}

/**
 * Gets the current provider and model for an agent.
 */
export async function getAgentProvider(agentId: string): Promise<{ provider: string; model: string } | null> {
  const { data } = await supabase
    .from("agents")
    .select("default_provider, default_model")
    .eq("id", agentId)
    .maybeSingle();

  if (!data) return null;
  return { provider: data.default_provider, model: data.default_model };
}
