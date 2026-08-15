// Orun OS — Spotify voice commands
//
// Plugs into the voice command router:
//   "abre o spotify" / "liga o spotify"  → opens the native Spotify app (no OAuth needed)
//   "conectar spotify"                    → OAuth connect flow
//   "pausa a música", "pula a música",
//   "volta a música", "o que tá tocando",
//   "toca <música>"                       → Spotify Web API (needs Premium + connect)

import * as Linking from "expo-linking";
import { registerVoiceCommandHandler } from "./commandRouter";
import {
  isSpotifyConfigured,
  isSpotifyConnected,
  connectSpotify,
  spotifyPlay,
  spotifyPause,
  spotifyNext,
  spotifyPrevious,
  getCurrentlyPlaying,
  playTrackByName,
} from "./spotifyService";

const NOT_CONFIGURED =
  "O Spotify ainda não foi configurado. Adicione o EXPO_PUBLIC_SPOTIFY_CLIENT_ID no arquivo .env do app e reconecte.";
const NOT_CONNECTED =
  "Você ainda não conectou o Spotify. Me diga: conectar spotify.";
const NOT_PLAYING = "Nenhuma música tocando no momento.";
const NO_ACTIVE_DEVICE =
  "Não encontrei um dispositivo do Spotify ativo. Abre o Spotify no celular, dá play e tenta de novo.";

function wantsConnect(n: string): boolean {
  return /conecta|conectar|conecte/.test(n) && n.includes("spotify");
}

/** "abre o spotify" / "liga o spotify" — opens the native app, no OAuth needed. */
function wantsOpen(n: string): boolean {
  return /(?:abre|abrir|inicia|iniciar|liga|ligar)\s+(?:o|a)?\s*spotify/.test(n);
}

function wantsPlay(n: string): boolean {
  return (
    /(?:^|\s)(?:tocar|toca|toque|dar play|retomar|continue|continuar)(?=\s|$)/.test(n) ||
    /liga a música|liga a musica/.test(n)
  );
}

function wantsPause(n: string): boolean {
  return (
    /pausa|pausar|parar a música|para a música|stop/.test(n) &&
    (n.includes("música") || n.includes("musica") || n.includes("spotify") || /^pausa/.test(n))
  );
}

function wantsNext(n: string): boolean {
  return (
    /pular|pula|próxima|proxima|avança|avanca|avançar|próximo|proximo/.test(n) &&
    (n.includes("música") || n.includes("musica") || n.includes("faixa") || n.includes("spotify") || n.includes("pular") || n.includes("pula"))
  );
}

function wantsPrevious(n: string): boolean {
  return (
    /voltar|volta a música|anterior|música anterior|retroceder/.test(n) &&
    (n.includes("música") || n.includes("musica") || n.includes("faixa") || n.includes("anterior"))
  );
}

function wantsStatus(n: string): boolean {
  return /o que (tá|está|ta) tocando|que música|qual música|tocando agora|agora tá tocando/.test(n);
}

const isMusicIntent = (n: string): boolean =>
  /spotify|música|musica|tocando|faixa|play|pular|pula|próxima|proxima|próximo|proximo|toca|toque|tocar|dar play|retomar|voltar|pausa|pausar|liga a música|liga a musica/.test(n);

const PLAY_QUERY_RE = /(?:toca|toque|toque a|toque o|dar play em|play)\s+(.+)/;

function extractSearchQuery(n: string): string | null {
  const m = n.match(PLAY_QUERY_RE);
  if (!m) return null;
  const q = m[1]
    .replace(/^(?:no|na|o|a|no spotify|na música|na musica|a música|a musica)\s+/i, "")
    .trim();
  if (!q || /^(música|musica|spotify|play)$/i.test(q)) return null;
  return q;
}

async function openSpotifyApp(): Promise<boolean> {
  try {
    await Linking.openURL("spotify://");
    return true;
  } catch (err) {
    console.warn("[spotify] open app failed:", (err as Error).message);
    return false;
  }
}

/** Runs a playback call; returns a spoken error message (or null on success). */
async function tryPlayback(action: () => Promise<void>): Promise<string | null> {
  try {
    await action();
    return null;
  } catch (err) {
    const msg = (err as Error).message;
    if (msg.includes("spotify_reauth_required")) {
      return "A conexão com o Spotify expirou. Me diga: conectar spotify.";
    }
    if (/spotify_error:404|spotify_error:403|spotify_not_connected/.test(msg)) {
      return NO_ACTIVE_DEVICE;
    }
    return "Não consegui fazer isso no Spotify agora. Tenta de novo.";
  }
}

export function setupSpotifyVoiceCommands(): void {
  registerVoiceCommandHandler(async (text) => {
    const n = text.toLowerCase();

    if (wantsConnect(n)) {
      if (!isSpotifyConfigured()) return NOT_CONFIGURED;
      const ok = await connectSpotify();
      return ok
        ? "Spotify conectado. Pode pedir para tocar música."
        : "Login do Spotify não foi concluído.";
    }

    // Opening the native app works even before OAuth.
    if (wantsOpen(n)) {
      const ok = await openSpotifyApp();
      return ok
        ? "Abrindo o Spotify."
        : "Não consegui abrir o Spotify. Confirma se o app está instalado?";
    }

    if (!isMusicIntent(n)) return null;

    if (!isSpotifyConfigured()) return NOT_CONFIGURED;
    if (!(await isSpotifyConnected())) return NOT_CONNECTED;

    if (wantsStatus(n)) {
      const now = await getCurrentlyPlaying();
      if (!now?.item) return NOT_PLAYING;
      const track = now.item;
      return `Está tocando ${track.name}, de ${track.artists.map((a) => a.name).join(" e ")}.`;
    }

    if (wantsPlay(n)) {
      const query = extractSearchQuery(n);
      if (query) {
        try {
          const track = await playTrackByName(query);
          return track
            ? `Tocando ${track.name}, de ${track.artists}.`
            : `Não encontrei a música ${query}.`;
        } catch {
          return "Não consegui tocar essa música no Spotify.";
        }
      }
      const err = await tryPlayback(spotifyPlay);
      return err ?? "Tocando.";
    }

    if (wantsPause(n)) {
      const err = await tryPlayback(spotifyPause);
      return err ?? "Música pausada.";
    }

    if (wantsNext(n)) {
      const err = await tryPlayback(spotifyNext);
      return err ?? "Pulando para a próxima música.";
    }

    if (wantsPrevious(n)) {
      const err = await tryPlayback(spotifyPrevious);
      return err ?? "Voltando para a música anterior.";
    }

    return null;
  });
}
