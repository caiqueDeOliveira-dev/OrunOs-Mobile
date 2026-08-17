// Orun OS — YouTube voice commands
//
//   "abre o youtube"                        → opens YouTube app
//   "pesquisa no youtube X" / "busca no youtube X" → search for X
//   "youtube X"                             → search for X
//   "abre o vídeo X no youtube"             → search + open first result

import * as Linking from "expo-linking";
import { registerVoiceCommandHandler } from "./commandRouter";

function wantsYouTube(n: string): boolean {
  return /youtube|youtuve|you tube/.test(n);
}

function wantsOpen(n: string): boolean {
  return /(?:abre|abrir|inicia|iniciar|liga|ligar|abre o|abre a)\s+(?:o|a)?\s*youtube/.test(n);
}

function wantsSearch(n: string): boolean {
  return /(?:pesquisa|busca|procura|procurar|pesquisar|buscar|search|procure|pesquise)\s+(?:no\s+)?youtube/.test(n) ||
    /^youtube\s+(.+)/.test(n);
}

const SEARCH_QUERY_RE = /(?:pesquisa|busca|procura|procurar|pesquisar|buscar|search|procure|pesquise)\s+(?:no\s+)?youtube\s+(?:por\s+|sobre\s+|a respeito de\s+)?(.+)/i;
const SEARCH_QUERY_ALT_RE = /^youtube\s+(.+)/i;

function extractSearchQuery(n: string): string | null {
  const m = n.match(SEARCH_QUERY_RE) ?? n.match(SEARCH_QUERY_ALT_RE);
  if (!m) return null;
  return m[1]
    .replace(/^(?:no|na|o|a|por|sobre|a respeito de)\s+/i, "")
    .trim() || null;
}

async function openYouTubeApp(): Promise<boolean> {
  try {
    await Linking.openURL("youtube://");
    return true;
  } catch {
    try {
      await Linking.openURL("https://www.youtube.com");
      return true;
    } catch {
      return false;
    }
  }
}

async function searchYouTube(query: string): Promise<boolean> {
  const encoded = encodeURIComponent(query);
  try {
    // Try YouTube app deep link first
    await Linking.openURL(`youtube://results?search_query=${encoded}`);
    return true;
  } catch {
    try {
      // Fallback to web
      await Linking.openURL(`https://www.youtube.com/results?search_query=${encoded}`);
      return true;
    } catch {
      return false;
    }
  }
}

export function setupYouTubeVoiceCommands(): void {
  registerVoiceCommandHandler(async (text) => {
    const n = text.toLowerCase();

    if (!wantsYouTube(n)) return null;

    if (wantsOpen(n)) {
      const ok = await openYouTubeApp();
      return ok
        ? "Abrindo o YouTube."
        : "Não consegui abrir o YouTube. Confirma se o app está instalado?";
    }

    if (wantsSearch(n)) {
      const query = extractSearchQuery(n);
      if (!query) return "O que você quer pesquisar no YouTube? Fala: pesquisa no YouTube + assunto.";
      const ok = await searchYouTube(query);
      return ok
        ? `Pesquisando "${query}" no YouTube.`
        : "Não consegui abrir a pesquisa. Tenta de novo.";
    }

    // If they just say "youtube X" without a verb, treat as search
    const simpleMatch = n.match(/^youtube\s+(.+)/i);
    if (simpleMatch) {
      const query = simpleMatch[1].trim();
      if (!query) return "O que você quer pesquisar no YouTube?";
      const ok = await searchYouTube(query);
      return ok
        ? `Pesquisando "${query}" no YouTube.`
        : "Não consegui abrir a pesquisa. Tenta de novo.";
    }

    return null;
  });
}
