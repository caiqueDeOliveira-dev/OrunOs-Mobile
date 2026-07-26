import { supabase } from "./supabaseClient";

export interface ConversationSummary {
  id: string;
  title: string;
  agent_id: string | null;
  updated_at: string;
}

/**
 * "Memory" from the mobile app's perspective is access to the same
 * conversation history the desktop app has — same `conversations` table,
 * same rows, kept in sync by SyncService when the desktop is on. This is
 * intentionally just a list (no AI-generated summaries/preferences like the
 * desktop's Memory screen mockup shows) — that richer view isn't backed by
 * a real table yet on either side, so it's not faked here either.
 */
export async function loadRecentConversations(limit = 30): Promise<ConversationSummary[]> {
  const { data, error } = await supabase
    .from("conversations")
    .select("id, title, agent_id, updated_at")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to load conversations: ${error.message}`);
  return data as ConversationSummary[];
}
