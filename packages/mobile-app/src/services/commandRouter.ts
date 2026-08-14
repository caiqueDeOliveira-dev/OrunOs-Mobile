// Orun OS — Voice command router
//
// Turns a spoken command into an action. Order matters:
//   1. system commands (time, date, cancel)
//   2. navigation (open screens via expo-router)
//   3. registered external handlers (Spotify, WhatsApp, ...)
//   4. fallback: send to the Hampton agent and return its reply
//
// Handlers plug in via registerVoiceCommandHandler — each returns a spoken
// reply or null when it doesn't recognize the command.

import { router } from "expo-router";
import { sendVoiceMessage } from "./chatService";

export interface VoiceCommandHandler {
  /** Returns a spoken reply, or null if this handler doesn't own the command. */
  (text: string): Promise<string | null> | string | null;
}

const handlers: VoiceCommandHandler[] = [];

export function registerVoiceCommandHandler(handler: VoiceCommandHandler): () => void {
  handlers.push(handler);
  return () => {
    const i = handlers.indexOf(handler);
    if (i >= 0) handlers.splice(i, 1);
  };
}

const NAVIGATION_MAP: Array<{ keys: string[]; route: string; label: string }> = [
  { keys: ["inicio", "início", "home", "principal", "tela inicial"], route: "/(tabs)", label: "início" },
  { keys: ["chat", "conversas", "mensagens"], route: "/(tabs)/chat", label: "chat" },
  { keys: ["agentes", "assistentes"], route: "/(tabs)/agents", label: "agentes" },
  { keys: ["voz"], route: "/(tabs)/voice", label: "voz" },
  { keys: ["memoria", "memória", "historico", "histórico"], route: "/(tabs)/memory", label: "memória" },
  { keys: ["automações", "automacoes", "rotinas"], route: "/(tabs)/automations", label: "automações" },
  { keys: ["configurações", "configuracoes", "config", "ajustes", "settings"], route: "/(tabs)/settings", label: "configurações" },
  { keys: ["provedores", "modelos", "providers"], route: "/(tabs)/providers", label: "provedores" },
];

function normalize(text: string): string {
  return text.toLowerCase().replace(/[.,!?]/g, "").trim();
}

async function handleNavigation(text: string): Promise<string | null> {
  const normalized = normalize(text);

  for (const nav of NAVIGATION_MAP) {
    const match = nav.keys.find((key) => normalized.includes(key));
    if (!match) continue;

    const verbPresent =
      normalized.startsWith("abre") ||
      normalized.startsWith("abrir") ||
      normalized.startsWith("vai") ||
      normalized.startsWith("ir") ||
      normalized.startsWith("mostra") ||
      normalized.startsWith("mostrar") ||
      normalized.startsWith("leva") ||
      normalized.startsWith("navega");

    if (verbPresent) {
      try {
        router.push(nav.route as never);
      } catch {
        // navigation failed — fall through to agent
        return null;
      }
      return `Abrindo ${nav.label}.`;
    }
  }
  return null;
}

async function handleSystem(text: string): Promise<string | null> {
  const normalized = normalize(text);

  if (normalized.includes("cancelar") || normalized === "para" || normalized === "parar" || normalized === "sai") {
    return "OK, interrompendo.";
  }

  if (normalized.includes("que horas") || normalized.includes("que horas sao") || normalized.includes("hora e") || normalized.includes("horas sao")) {
    const now = new Date();
    const hh = now.getHours();
    const mm = now.getMinutes().toString().padStart(2, "0");
    return `Agora são ${hh} e ${mm}.`;
  }

  if (normalized.includes("que dia") || normalized.includes("dia e hoje") || normalized.includes("que data")) {
    return `Hoje é ${new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}.`;
  }

  return null;
}

export interface CommandResult {
  reply: string;
  handled: boolean;
  viaAgent?: boolean;
}

/**
 * Executes a spoken command and returns what the assistant should say back.
 */
export async function executeVoiceCommand(text: string): Promise<CommandResult> {
  const trimmed = text.trim();
  if (!trimmed) return { reply: "Não entendi. Pode repetir?", handled: true };

  const system = await handleSystem(trimmed);
  if (system) {
    return { reply: system, handled: system !== "OK, interrompendo." };
  }

  const navigation = await handleNavigation(trimmed);
  if (navigation) return { reply: navigation, handled: true };

  for (const handler of handlers) {
    try {
      const reply = await handler(trimmed);
      if (reply) return { reply, handled: true };
    } catch (err) {
      console.warn("[command] handler failed:", err);
    }
  }

  // Fallback: Hampton agent (same as the Voice screen)
  try {
    const { reply } = await sendVoiceMessage("hampton", trimmed);
    return { reply, handled: true, viaAgent: true };
  } catch (err) {
    console.warn("[command] agent fallback failed:", err);
    return {
      reply: "Não consegui responder agora. Pode tentar de novo?",
      handled: true,
    };
  }
}
