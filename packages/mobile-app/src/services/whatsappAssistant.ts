// Orun OS — WhatsApp voice assistant (mobile side)
//
// Listens to Supabase Realtime for inbound WhatsApp messages and:
//   1. announces them with sender name: "Caique, mensagem do João no WhatsApp: ..."
//   2. remembers the latest one so voice commands can read it back
//   3. lets the user reply by voice
//   4. lets the user mute/unmute groups by voice
//
// Voice commands:
//   "Orun, ler mensagens do whatsapp"
//   "Orun, ler a última mensagem"
//   "Orun, quem mandou a última mensagem?"
//   "Orun, responde o whatsapp: <mensagem>"
//   "Orun, responde pra ele: <mensagem>"
//   "Orun, não me avisa mais desse grupo"
//   "Orun, para de avisar do grupo X"
//   "Orun, volta a avisar do grupo X"
//   "Orun, mutar grupo X"

import { supabase } from "./supabaseClient";
import { announceExternally, speakText } from "./voiceAssistant";
import { sendMessage } from "./chatService";
import { registerVoiceCommandHandler } from "./commandRouter";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface WhatsAppInbound {
  conversationId: string;
  agentId: string;
  text: string;
  chatLabel: string;
  senderName: string;
  isGroup: boolean;
  groupName: string;
  receivedAt: string;
}

const MUTED_GROUPS_KEY = "orun.whatsapp.muted_groups";
const LAST_INBOUND_KEY = "orun.whatsapp.last_inbound";

let lastInbound: WhatsAppInbound | null = null;
let mutedGroups: Set<string> = new Set();
let ready = false;

const NO_PENDING = "Não há mensagens do WhatsApp para ler.";
const SENT_OK = "Mensagem enviada para o WhatsApp.";
const ASK_AGAIN =
  "Fale a mensagem junto com o comando. Por exemplo: Orun, responde o whatsapp que vou chegar atrasado.";

export function initWhatsAppAssistant(): void {
  if (ready) return;
  ready = true;
  loadMutedGroups();
  loadLastInbound();
  subscribeRealtime();
  registerVoiceCommands();
}

// ─── Persistence ────────────────────────────────────────────────────

async function loadMutedGroups(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(MUTED_GROUPS_KEY);
    if (raw) mutedGroups = new Set(JSON.parse(raw));
  } catch { /* ignore */ }
}

async function saveMutedGroups(): Promise<void> {
  await AsyncStorage.setItem(MUTED_GROUPS_KEY, JSON.stringify([...mutedGroups]));
}

async function loadLastInbound(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(LAST_INBOUND_KEY);
    if (raw) lastInbound = JSON.parse(raw);
  } catch { /* ignore */ }
}

async function saveLastInbound(): Promise<void> {
  if (lastInbound) {
    await AsyncStorage.setItem(LAST_INBOUND_KEY, JSON.stringify(lastInbound));
  }
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
          .select("id, channel_id, external_conversation_id, agent_id, metadata")
          .eq("id", msg.conversation_id)
          .maybeSingle();

        if (!conv || conv.channel_id !== "whatsapp" || !conv.external_conversation_id) return;

        const meta = (conv.metadata ?? {}) as Record<string, any>;
        const isGroup = Boolean(meta.is_group);
        const groupName = meta.group_name ?? "";
        const senderName = meta.sender_name ?? conv.external_conversation_id;

        // Check if group is muted
        const groupKey = isGroup ? groupName.toLowerCase() : "";
        if (isGroup && groupKey && mutedGroups.has(groupKey)) {
          // Still store but don't announce
          lastInbound = {
            conversationId: conv.id,
            agentId: conv.agent_id ?? "",
            text: String(msg.content),
            chatLabel: conv.external_conversation_id,
            senderName,
            isGroup,
            groupName,
            receivedAt: new Date().toISOString(),
          };
          await saveLastInbound();
          return;
        }

        lastInbound = {
          conversationId: conv.id,
          agentId: conv.agent_id ?? "",
          text: String(msg.content),
          chatLabel: conv.external_conversation_id,
          senderName,
          isGroup,
          groupName,
          receivedAt: new Date().toISOString(),
        };
        await saveLastInbound();

        const snippet = lastInbound.text.slice(0, 140);
        const context = isGroup ? ` no grupo ${groupName}` : "";
        const announcement = `Caique, mensagem de ${senderName}${context} no WhatsApp: ${snippet}`;
        await announceExternally(announcement);
      },
    )
    .subscribe();
}

// ─── Voice commands ─────────────────────────────────────────────────

export function matchesReadText(text: string): boolean {
  return (
    /^(ler|lê|leia|ler as)\s+(o\s+)?(whatsapp|whats)\b/i.test(text) ||
    /^(ler|lê|leia)\s+(a|as)?\s*(última|ultima|nova|proxima|próxima)?\s*(mensagem|mensagens)/i.test(text) ||
    /^qual (foi|é) a (última|ultima) (mensagem|msg)/i.test(text) ||
    /^quem mandou/i.test(text)
  );
}

export function extractReplyText(text: string): string | null {
  const m = text.match(
    /^(respond(e|er)?|responde)\s+(o\s+)?(whatsapp\b|whats\b|pra\s+(ele|ela|ele\.))\s*[:\-]?\s*(.+)$/i,
  );
  return m?.[6]?.trim() ?? null;
}

function wantsMuteGroup(n: string): boolean {
  return /mutar|mudo|muda|silenciar|silencio|não\s+avisa|nao\s+avisa|para\s+de\s+avisar|para\s+aviso/.test(n) &&
    /grupo|group/.test(n);
}

function wantsUnmuteGroup(n: string): boolean {
  return /desmutar|desmudo|voltar a avisar|volta a avisar|ativa.*aviso|ligar.*aviso|habilitar/.test(n) &&
    /grupo|group/.test(n);
}

function wantsReadLast(n: string): boolean {
  return /quem mandou|qual.*última|qual.*ultima|quem.*mensagem/i.test(n);
}

function extractMuteGroupName(n: string): string | null {
  const m = n.match(/(?:mutar|mudo|muda|silenciar|silencio|não\s+avisa|nao\s+avisa|para\s+de\s+avisar|para\s+aviso|desmutar|desmudo|voltar a avisar|volta a avisar|ativa.*aviso|ligar.*aviso|habilitar).*?(?:do\s+grupo|do\s+group|grupo|group)\s+(.+)/i);
  return m?.[1]?.trim() ?? null;
}

function registerVoiceCommands(): void {
  registerVoiceCommandHandler(async (text) => {
    const n = text.toLowerCase();

    if (!n.includes("whatsapp") && !n.includes("whats") && !n.includes("mensagem") && !n.includes("grupo")) return null;

    // Mute group
    if (wantsMuteGroup(n)) {
      const groupName = extractMuteGroupName(n);
      if (!groupName) return "Qual grupo você quer mutar? Fala: mutar grupo + nome.";
      mutedGroups.add(groupName.toLowerCase());
      await saveMutedGroups();
      return `Grupo "${groupName}" mutado. Não vou mais te avisar de mensagens desse grupo.`;
    }

    // Unmute group
    if (wantsUnmuteGroup(n)) {
      const groupName = extractMuteGroupName(n);
      if (!groupName) return "Qual grupo você quer desmutar? Fala: desmutar grupo + nome.";
      mutedGroups.delete(groupName.toLowerCase());
      await saveMutedGroups();
      return `Grupo "${groupName}" desmutado. Voltou a te avisar.`;
    }

    // Read last message info
    if (wantsReadLast(n)) {
      if (!lastInbound) return NO_PENDING;
      const who = lastInbound.senderName;
      const where = lastInbound.isGroup ? ` no grupo ${lastInbound.groupName}` : "";
      return `Última mensagem de ${who}${where}: ${lastInbound.text}`;
    }

    // Read messages
    if (matchesReadText(n)) {
      if (!lastInbound) return NO_PENDING;
      const who = lastInbound.senderName;
      const where = lastInbound.isGroup ? ` no grupo ${lastInbound.groupName}` : "";
      const fullMessage = `Mensagem de ${who}${where}: ${lastInbound.text}`;
      // Also read aloud
      await speakText(fullMessage);
      return fullMessage;
    }

    // Reply
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
