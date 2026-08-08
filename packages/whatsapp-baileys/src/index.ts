// Orun OS — WhatsApp Baileys Gateway
//
// Connects directly to WhatsApp Web (no Meta API needed).
// Routes messages to agents by group_jid or keyword.
// Calls Supabase ai-relay Edge Function for AI responses.
//
// Usage:
//   SUPABASE_URL=https://xxx.supabase.co \
//   SUPABASE_SERVICE_ROLE_KEY=xxx \
//   npm start
//
// First run: scan the QR code with WhatsApp to link.
// Session is saved to ./auth_state so you only scan once.

import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  isJidUser,
  isJidGroup,
  jidNormalizedUser,
  proto,
} from "@whiskeysockets/baileys";
import type { WASocket } from "@whiskeysockets/baileys";
import pino from "pino";
import qrcode from "qrcode-terminal";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ─── Config ────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const AUTH_DIR = process.env.AUTH_DIR ?? "./auth_state";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase: SupabaseClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const logger = pino({ level: "error" });

// ─── Routing ───────────────────────────────────────────────────────

interface RoutingRule {
  id: string;
  agent: string;
  user_id: string;
  keywords: string[];
  group_jid: string | null;
  channel: string;
  action: string;
}

/**
 * Routes an incoming message to the correct agent.
 * Priority: group_jid match > keyword match > null (no match).
 */
async function routeMessage(
  chatJid: string,
  senderJid: string,
  text: string,
): Promise<{ agentId: string; userId: string } | null> {
  const { data: rules } = await supabase
    .from("whatsapp_keyword_rules")
    .select("agent, user_id, keywords, group_jid, channel")
    .eq("enabled", true)
    .is("deleted_at", null);

  if (!rules || rules.length === 0) return null;

  const isGroup = isJidGroup(chatJid);
  const normalizedChat = jidNormalizedUser(chatJid);

  // 1) Group match — exact group_jid
  if (isGroup) {
    const groupRule = rules.find(
      (r) => r.group_jid && jidNormalizedUser(r.group_jid) === normalizedChat,
    );
    if (groupRule) {
      return { agentId: groupRule.agent, userId: groupRule.user_id };
    }
  }

  // 2) Keyword match (DM or group fallback)
  for (const rule of rules) {
    if (rule.group_jid) continue; // skip group-only rules for keyword matching
    const keywords = (rule.keywords as string[]) ?? [];
    if (keywords.some((kw) => text.toLowerCase().includes(kw.toLowerCase()))) {
      return { agentId: rule.agent, userId: rule.user_id };
    }
  }

  return null;
}

// ─── AI Relay call ─────────────────────────────────────────────────

/**
 * Calls the Supabase ai-relay Edge Function to get an AI response.
 * This is the same function the mobile app calls.
 */
async function callAiRelay(
  conversationId: string,
  agentId: string,
  content: string,
  userToken: string,
): Promise<string> {
  const { data, error } = await supabase.functions.invoke("ai-relay", {
    body: { conversationId, agentId, content },
    headers: { Authorization: `Bearer ${userToken}` },
  });

  if (error) throw new Error(`ai-relay error: ${error.message}`);
  if (data?.error) throw new Error(data.error);
  return data?.content ?? "";
}

/**
 * Fallback: calls the AI provider directly without the Edge Function.
 * Used when we don't have a user JWT for the ai-relay.
 */
async function callAiDirect(
  agentId: string,
  content: string,
  conversationId: string,
): Promise<string> {
  const { data: agent } = await supabase
    .from("agents")
    .select("id, name, default_provider, default_model, persona_prompt")
    .eq("id", agentId)
    .maybeSingle();

  if (!agent?.default_provider || !agent?.default_model) {
    throw new Error(`Agent "${agentId}" has no provider configured`);
  }

  const PROVIDER_ENV: Record<string, string> = {
    groq: "GROQ_API_KEY",
    openai: "OPENAI_API_KEY",
    claude: "ANTHROPIC_API_KEY",
    openrouter: "OPENROUTER_API_KEY",
    github: "GITHUB_MODELS_TOKEN",
  };

  const envKey = PROVIDER_ENV[agent.default_provider];
  const apiKey = envKey ? process.env[envKey] : null;
  if (!apiKey) throw new Error(`${envKey} not set in environment`);

  // Store user message
  const now = new Date().toISOString();
  const { data: seqRow } = await supabase
    .from("messages")
    .select("seq")
    .eq("conversation_id", conversationId)
    .order("seq", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextSeq = (seqRow?.seq ?? 0) + 1;

  await supabase.from("messages").insert({
    conversation_id: conversationId,
    seq: nextSeq,
    role: "user",
    agent_id: agentId,
    content,
    created_at: now,
    updated_at: now,
  });

  // Call provider directly
  const ENDPOINTS: Record<string, string> = {
    groq: "https://api.groq.com/openai/v1/chat/completions",
    openai: "https://api.openai.com/v1/chat/completions",
    claude: "https://api.anthropic.com/v1/messages",
    openrouter: "https://openrouter.ai/api/v1/chat/completions",
  };

  const endpoint = ENDPOINTS[agent.default_provider];
  if (!endpoint) throw new Error(`Provider "${agent.default_provider}" not supported`);

  const body = agent.default_provider === "claude"
    ? {
        model: agent.default_model,
        max_tokens: 1024,
        system: agent.persona_prompt ?? "Voce e um assistente util.",
        messages: [{ role: "user", content }],
      }
    : {
        model: agent.default_model,
        messages: [
          { role: "system", content: agent.persona_prompt ?? "Voce e um assistente util." },
          { role: "user", content },
        ],
      };

  const headers: Record<string, string> = { "content-type": "application/json" };
  if (agent.default_provider === "claude") {
    headers["x-api-key"] = apiKey;
    headers["anthropic-version"] = "2023-06-01";
  } else {
    headers.authorization = `Bearer ${apiKey}`;
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) throw new Error(`Provider error ${res.status}: ${await res.text()}`);
  const data = await res.json();

  let reply: string;
  if (agent.default_provider === "claude") {
    reply = data.content?.find((b: any) => b.type === "text")?.text ?? "";
  } else {
    reply = data.choices?.[0]?.message?.content ?? "";
  }

  // Store assistant reply
  const replyNow = new Date().toISOString();
  await supabase.from("messages").insert({
    conversation_id: conversationId,
    seq: nextSeq + 1,
    role: "assistant",
    agent_id: agentId,
    provider: agent.default_provider,
    model: agent.default_model,
    content: reply,
    created_at: replyNow,
    updated_at: replyNow,
  });

  return reply;
}

// ─── Message handler ───────────────────────────────────────────────

async function handleMessage(sock: WASocket, msg: proto.IWebMessageInfo) {
  if (!msg.message || msg.key.fromMe) return;

  const chatJid = msg.key.remoteJid!;
  const senderJid = msg.key.participant ?? msg.key.remoteJid!;
  const text =
    msg.message.conversation ??
    msg.message.extendedTextMessage?.text ??
    "";

  if (!text.trim()) return;

  console.log(`[MSG] ${isJidGroup(chatJid) ? "GROUP" : "DM"} ${chatJid} from ${senderJid}: ${text.slice(0, 80)}`);

  // Route to agent
  const route = await routeMessage(chatJid, senderJid, text);
  if (!route) {
    await sock.sendMessage(chatJid, {
      text: "Nenhuma regra de roteamento configurada para este chat. Configure no app Orun OS.",
    });
    return;
  }

  // Create or find conversation
  const convTitle = isJidGroup(chatJid)
    ? `WA Group: ${chatJid}`
    : `WA: ${text.slice(0, 50)}`;

  const { data: conv } = await supabase
    .from("conversations")
    .insert({ title: convTitle, agent_id: route.agentId, user_id: route.userId })
    .select("id")
    .single();

  if (!conv) {
    await sock.sendMessage(chatJid, { text: "Erro ao criar conversa." });
    return;
  }

  // Send "typing" indicator
  await sock.sendPresenceUpdate("composing", chatJid);

  try {
    const reply = await callAiDirect(route.agentId, text, conv.id);
    await sock.sendMessage(chatJid, { text: reply });
  } catch (err) {
    const errMsg = (err as Error).message;
    console.error(`[ERROR] ${errMsg}`);
    await sock.sendMessage(chatJid, {
      text: `Erro: ${errMsg}`,
    });
  } finally {
    await sock.sendPresenceUpdate("paused", chatJid);
  }
}

// ─── Main ──────────────────────────────────────────────────────────

async function main() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger as any),
    },
    logger: logger as any,
    printQRInTerminal: false,
    generateHighQualityLinkPreview: false,
    syncFullHistory: false,
  });

  // QR code for linking
  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log("\nEscaneie este QR code com seu WhatsApp:\n");
      qrcode.generate(qr, { small: true });
      console.log(`\nOu abra: https://wa.me/qr\n`);
    }

    if (connection === "close") {
      const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      console.log(`[CONN] Fechado (code: ${statusCode}). Reconectando: ${shouldReconnect}`);
      if (shouldReconnect) {
        main();
      } else {
        console.log("[CONN] Deslogado. Delete a pasta auth_state e reinicie.");
        process.exit(1);
      }
    }

    if (connection === "open") {
      console.log("[CONN] Conectado ao WhatsApp!");
    }
  });

  // Save credentials on update
  sock.ev.on("creds.update", saveCreds);

  // Handle incoming messages
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;
    for (const msg of messages) {
      try {
        await handleMessage(sock, msg);
      } catch (err) {
        console.error("[HANDLER ERROR]", err);
      }
    }
  });

  console.log("[INIT] WhatsApp Baileys Gateway iniciado");
  console.log(`[INIT] Supabase: ${SUPABASE_URL}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
