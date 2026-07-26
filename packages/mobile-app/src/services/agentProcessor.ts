// Orun OS — Agent Processor
//
// Client-side logic that extracts structured data from AI replies.
// When an agent's response contains a JSON block (e.g., for meal logging,
// transaction creation, campaign setup), this processor parses it and
// sends it to the appropriate service.

export interface ParsedToolCall {
  tool: string;
  args: Record<string, unknown>;
}

/**
 * Extracts JSON blocks from an AI response.
 * Looks for patterns like:
 *   {"calories": 500, "protein_g": 30, ...}
 *   {"metric": "peso", "value": 80, "unit": "kg"}
 *
 * Returns an array of parsed JSON objects found in the text.
 */
export function extractJsonBlocks(text: string): Record<string, unknown>[] {
  const blocks: Record<string, unknown>[] = [];
  // Match JSON objects that are on their own line or at the end of text
  const jsonRegex = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g;
  const matches = text.match(jsonRegex) ?? [];

  for (const match of matches) {
    try {
      const parsed = JSON.parse(match);
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        blocks.push(parsed);
      }
    } catch {
      // Not valid JSON — skip
    }
  }

  return blocks;
}

/**
 * Detects which tool the AI is trying to invoke based on the JSON content.
 * This is a heuristic — the autonomous loop handles tool calls server-side,
 * but this is useful for client-side processing when the loop isn't active.
 */
export function detectToolFromJson(json: Record<string, unknown>): string | null {
  // Health — meal
  if ("calories" in json && ("protein_g" in json || "carbs_g" in json || "fat_g" in json)) {
    return "log_meal";
  }
  // Health — workout
  if ("exercise_name" in json && "duration_min" in json) {
    return "log_workout";
  }
  // Health — metric
  if ("metric" in json && "value" in json && "unit" in json) {
    return "log_metric";
  }
  // Finance — transaction
  if ("amount" in json && "category" in json && "type" in json) {
    return "add_transaction";
  }
  // Marketing — campaign
  if ("campaign_name" in json) {
    return "add_campaign";
  }
  // Marketing — social post
  if ("platform" in json && "hook" in json) {
    return "create_post";
  }
  // Designer — image generation
  if ("engine" in json && "prompt" in json && "model_used" in json) {
    return "generate_image";
  }
  // Memory
  if ("key" in json && "content" in json && !("amount" in json)) {
    return "memory_save";
  }
  return null;
}

/**
 * Returns a human-readable summary of what the AI did.
 */
export function summarizeToolCalls(
  toolCalls: Array<{ name: string; args: Record<string, unknown>; result: { success: boolean; error?: string } }>
): string[] {
  const summaries: string[] = [];
  for (const tc of toolCalls) {
    const status = tc.result.success ? "✅" : "❌";
    let description = tc.name;

    switch (tc.name) {
      case "log_meal":
        description = `Refeicao: ${tc.args.description ?? "sem descricao"} (${tc.args.calories ?? 0} kcal)`;
        break;
      case "log_workout":
        description = `Treino: ${tc.args.exercise_name ?? "exercicio"} (${tc.args.duration_min ?? 0} min)`;
        break;
      case "log_metric":
        description = `Metrica: ${tc.args.metric} = ${tc.args.value} ${tc.args.unit}`;
        break;
      case "add_transaction":
        description = `Transacao: ${tc.args.description} — R$ ${tc.args.amount}`;
        break;
      case "add_campaign":
        description = `Campanha: ${tc.args.campaign_name}`;
        break;
      case "memory_save":
        description = `Memoria: ${tc.args.key}`;
        break;
      case "notify":
        description = `Notificacao: ${tc.args.title}`;
        break;
      case "trigger_agent":
        description = `Agente disparado: ${tc.args.agent}`;
        break;
      case "web_search":
        description = `Busca web: ${tc.args.query}`;
        break;
    }

    summaries.push(`${status} ${description}`);
  }
  return summaries;
}
