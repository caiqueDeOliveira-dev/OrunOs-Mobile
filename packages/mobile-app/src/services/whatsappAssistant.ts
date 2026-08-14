// Orun OS — WhatsApp voice assistant (mobile side)
//
// Listens to Supabase Realtime for inbound WhatsApp messages (written by the
// Baileys gateway with direction='inbound') and:
//   1. announces them out loud: "Sr. Caique, chegou mensagem no WhatsApp: ..."
//   2. remembers the latest one so voice commands can read it back
//   3. lets the user reply by voice — the reply goes through ai-relay and the
//      gateway's sender loop relays it to the actual WhatsApp chat.
//
// Voice commands:
//   "Orun, ler mensagens do whatsapp"
//   "Orun, responde o whatsapp: <mensagem>"
//   "Orun, responde pra ele: <mensagem>"

import { supabase } from "./supabaseClient";
import { announceExternally } from "./voiceAssistant";
import { sendMessage } from "./chatService";
import { registerVoiceCommandHandler } from "./commandRouter";

interface WhatsAppInbound {
  conversationId: string;
  agentId: string;
  text: string;
  chatLabel: string;
  receivedAt: string;
}

let lastInbound: WhatsAppInbound | null = null;
let ready = false;

const NO_PENDING = "Não há mensagens do WhatsApp para ler.";
const SENT_OK = "Mensagem enviada para o WhatsApp.";
const ASK_AGAIN =
  "Fale a mensagem junto com o comando. Por exemplo: Orun, responde o whatsapp que vou chegar atrasado.";

export function initWhatsAppAssistant(): void {
  if (ready) return;
  ready = true;
  subscribeRealtime();
  registerVoiceCommands();
}

// ─── Realtime inbound watcher ───────────────────────────────────────

function subscribeRealtime(): void {
  supabase
    .channel("wa-voice-inbound")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: "direction=eq.inbound",
      },
      async (payload) => {
        const msg = payload.new as Record<string, any>;
        if (!msg?.conversation_id || !msg?.content) return;

        const { data: conv } = await supabase
          .from("conversations")
          .select("id, channel_id, external_conversation_id, agent_id")
          .eq("id", msg.conversation_id)
          .maybeSingle();

        if (!conv || conv.channel_id !== "whatsapp" || !conv.external_conversation_id) return;

        lastInbound = {
          conversationId: conv.id,
          agentId: conv.agent_id ?? "",
          text: String(msg.content),
          chatLabel: conv.external_conversation_id,
          receivedAt: new Date().toISOString(),
        };

        const snippet = lastInbound.text.slice(0, 140);
        await announceExternally(`Sr. Caique, chegou mensagem no WhatsApp: ${snippet}`);
      },
    )
    .subscribe();
}

// ─── Voice commands ─────────────────────────────────────────────────

export function matchesReadText(text: string): boolean {
  return (
    /^(ler|lê|leia|ler as)\s+(o\s+)?(whatsapp|whats)\b/i.test(text) ||
    /^(ler|lê|leia)\s+(a|as)?\s*(última|ultima|nova|proxima|próxima)?\s*(mensagem|mensagens)/i.test(text) ||
    /^qual (foi|é) a (última|ultima) (mensagem|msg)/i.test(text)
  );
}

export function extractReplyText(text: string): string | null {
  const m = text.match(
    /^(respond(e|er)?|responde)\s+(o\s+)?(whatsapp\b|whats\b|pra\s+(ele|ela|ele\.))\s*[:\-]?\s*(.+)$/i,
  );
  return m?.[6]?.trim() ?? null;
}

function registerVoiceCommands(): void {
  registerVoiceCommandHandler(async (text) => {
    const n = text.toLowerCase();

    if (!n.includes("whatsapp") && !n.includes("whats") && !n.includes("mensagem")) return null;

    if (matchesReadText(n)) {
      if (!lastInbound) return NO_PENDING;
      return `Mensagem do WhatsApp: ${lastInbound.text}`;
    }

    const replyText = extractReplyText(n);
    if (replyText !== null) {
      if (!lastInbound) return NO_PENDING;
      if (!replyText) return ASK_AGAIN;
      try {
        await sendMessage(lastInbound.conversationId, lastInbound.agentId, replyText);
        return SENT_OK;
      } catch (err) {
        return `Não consegui enviar a mensagem: ${(err as Error).message}`;
      }
    }

    return null;
  });
}
