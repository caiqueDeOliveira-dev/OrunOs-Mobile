// Orun OS — WhatsApp Webhook Handler
//
// Receives incoming WhatsApp messages via the Cloud API webhook,
// routes them to the appropriate agent based on keyword rules,
// and sends replies back via the WhatsApp Cloud API.
//
// Deploy: supabase functions deploy whatsapp-webhook
// Env vars needed: WHATSAPP_TOKEN, WHATSAPP_VERIFY_TOKEN

import { createClient } from "jsr:@supabase/supabase-js@2";
import { runAutonomousLoop } from "../ai-relay/autonomousLoop.ts";
import { PROVIDER_ENV_KEY } from "../ai-relay/logic.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WHATSAPP_TOKEN = Deno.env.get("WHATSAPP_TOKEN");
const WHATSAPP_VERIFY_TOKEN = Deno.env.get("WHATSAPP_VERIFY_TOKEN");

interface WhatsAppMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string };
}

/**
 * Verifies the webhook for WhatsApp Cloud API setup.
 * GET /whatsapp-webhook?hub.mode=subscribe&hub.verify_token=...&hub.challenge=...
 */
function handleVerify(req: Request): Response {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

/**
 * Sends a text message back via WhatsApp Cloud API.
 */
async function sendWhatsAppMessage(to: string, text: string): Promise<void> {
  if (!WHATSAPP_TOKEN) {
    console.log(`[WhatsApp] No token configured — would send to ${to}: ${text.slice(0, 100)}`);
    return;
  }

  await fetch(`https://graph.facebook.com/v18.0/me/messages`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${WHATSAPP_TOKEN}`,
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text },
    }),
  });
}

/**
 * Routes a WhatsApp message to the correct agent based on keyword rules.
 */
async function routeMessage(supabase: any, userPhone: string, text: string): Promise<{ agentId: string; userId: string } | null> {
  // Find the user who owns this phone number (stored in settings or a mapping table)
  // For now, we match by keyword rules — the first rule that matches determines the agent
  const { data: rules } = await supabase
    .from("whatsapp_keyword_rules")
    .select("agent, user_id, keywords")
    .eq("enabled", true)
    .is("deleted_at", null);

  if (!rules || rules.length === 0) return null;

  for (const rule of rules) {
    const keywords = (rule.keywords as string[]) ?? [];
    if (keywords.some((kw) => text.toLowerCase().includes(kw.toLowerCase()))) {
      return { agentId: rule.agent, userId: rule.user_id };
    }
  }

  return null;
}

Deno.serve(async (req: Request) => {
  // Webhook verification
  if (req.method === "GET") return handleVerify(req);
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const body = await req.json();

  // Parse WhatsApp webhook payload
  const entries = body.entry ?? [];
  for (const entry of entries) {
    const changes = entry.changes ?? [];
    for (const change of changes) {
      const messages: WhatsAppMessage[] = change.value?.messages ?? [];

      for (const msg of messages) {
        if (msg.type !== "text" || !msg.text?.body) continue;

        const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

        // Route to agent
        const route = await routeMessage(supabase, msg.from, msg.text.body);
        if (!route) {
          await sendWhatsAppMessage(msg.from, "Desculpe, nao consegui processar sua mensagem. Configure regras de palavras-chave no app para direcionar mensagens aos agentes.");
          continue;
        }

        // Create conversation + send to ai-relay
        const { data: conv } = await supabase
          .from("conversations")
          .insert({ title: `WhatsApp: ${msg.text.body.slice(0, 50)}`, user_id: route.userId })
          .select("id")
          .single();

        if (!conv) continue;

        // Call ai-relay logic directly (same as the Edge Function does)
        const { data: agent } = await supabase
          .from("agents")
          .select("id, name, default_provider, default_model, persona_prompt")
          .eq("id", route.agentId)
          .maybeSingle();

        if (!agent) continue;

        // Store user message
        const now = new Date().toISOString();
        await supabase.from("messages").insert({
          conversation_id: conv.id,
          seq: 1,
          role: "user",
          agent_id: route.agentId,
          content: msg.text.body,
          user_id: route.userId,
          created_at: now,
          updated_at: now,
        });

        // Get API key for the agent's provider
        const providerKey = PROVIDER_ENV_KEY[agent.default_provider!];
        const apiKey = providerKey ? Deno.env.get(providerKey) : null;
        if (!apiKey || !agent.default_provider || !agent.default_model) {
          await sendWhatsAppMessage(msg.from, `[${agent.name}] Provider nao configurado. Configure a chave de API no Supabase.`);
          continue;
        }

        // Run autonomous loop
        try {
          const result = await runAutonomousLoop(
            agent.default_provider,
            agent.default_model,
            agent.persona_prompt ?? "Voce e um assistente util.",
            [{ role: "user", content: msg.text.body }],
            { userId: route.userId, agentId: route.agentId, conversationId: conv.id, supabase },
            apiKey,
          );

          // Store reply
          const replyNow = new Date().toISOString();
          await supabase.from("messages").insert({
            conversation_id: conv.id,
            seq: 2,
            role: "assistant",
            agent_id: route.agentId,
            provider: agent.default_provider,
            model: agent.default_model,
            content: result.finalContent,
            user_id: route.userId,
            created_at: replyNow,
            updated_at: replyNow,
          });

          await sendWhatsAppMessage(msg.from, result.finalContent);
        } catch (err) {
          await sendWhatsAppMessage(msg.from, `[${agent.name}] Erro ao processar: ${(err as Error).message}`);
        }
      }
    }
  }

  return new Response("OK", { status: 200 });
});
