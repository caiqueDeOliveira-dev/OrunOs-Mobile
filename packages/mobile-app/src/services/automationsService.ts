import { supabase } from "./supabaseClient";

export interface Automation {
  id: string;
  name: string;
  kind: string;
  enabled: boolean;
  config: Record<string, unknown>;
  updated_at: string;
}

/**
 * Automations are just rows with an `enabled` flag — no AI call involved,
 * so (unlike chat) this reads/writes Supabase directly, no Edge Function
 * needed. Whatever runs the actual automation (n8n webhook, WhatsApp/Baileys,
 * node-cron) still lives on the desktop and checks this same flag — toggling
 * it from the phone doesn't execute anything by itself, it just flips the
 * switch the desktop already reads.
 */
export async function loadAutomations(): Promise<Automation[]> {
  const { data, error } = await supabase
    .from("automations")
    .select("*")
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (error) throw new Error(`Failed to load automations: ${error.message}`);
  return data as Automation[];
}

export async function setAutomationEnabled(id: string, enabled: boolean): Promise<void> {
  const { error } = await supabase
    .from("automations")
    .update({ enabled, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(`Failed to update automation: ${error.message}`);
}
