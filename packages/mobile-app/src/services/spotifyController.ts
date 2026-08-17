// Orun OS — Spotify voice commands (full control)
//
// Commands:
//   "abre o spotify"               → opens the native Spotify app
//   "conectar spotify"             → OAuth connect flow
//   "toca <música>"                → search + play track
//   "abre a playlist <nome>"       → search + play playlist
//   "pausa" / "para a música"      → pause playback
//   "toca" / "dar play"            → resume playback
//   "pula a música" / "próxima"    → next track
//   "volta a música" / "anterior"  → previous track
//   "o que tá tocando"             → current track info
//   "volume 50" / "volume máximo"  → set volume (0-100)
//   "troca pro celular"            → switch playback device
//   "desliga o spotify"            → pause + confirm

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
  searchPlaylist,
  playPlaylist,
  setVolume,
  getDevices,
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
    /pausa|pausar|parar a música|para a música/.test(n) &&
    (n.includes("música") || n.includes("musica") || n.includes("spotify") || /^pausa/.test(n))
  );
}

function wantsStop(n: string): boolean {
  return (
    /desligar|desliga|fechar|fecha|encerrar|encerra|desligue|feche|parar tudo|para tudo/.test(n) &&
    (n.includes("spotify") || n.includes("música") || n.includes("musica"))
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
    /voltar|volta a música|volta a musica|anterior|música anterior|musica anterior|retroceder/.test(n) &&
    (n.includes("música") || n.includes("musica") || n.includes("faixa") || n.includes("anterior"))
  );
}

function wantsStatus(n: string): boolean {
  return /o que (tá|está|ta) tocando|que música|qual música|tocando agora|agora tá tocando/.test(n);
}

function wantsVolume(n: string): boolean {
  return /volume/.test(n);
}

function wantsDevice(n: string): boolean {
  return /troca|alternar|muda|mudar|conectar|conecta/.test(n) && /celular|fone|speaker|computador|pc|tv|tablet/.test(n);
}

function wantsPlaylist(n: string): boolean {
  return /playlist/.test(n) && /abre|abrir|toca|toque|tocar|coloca|coloque|play/.test(n);
}

const isMusicIntent = (n: string): boolean =>
  /spotify|música|musica|tocando|faixa|play|pular|pula|próxima|proxima|próximo|proximo|toca|toque|tocar|dar play|retomar|voltar|pausa|pausar|liga a música|liga a musica|playlist|volume|desligar|desliga/.test(n);

const PLAY_QUERY_RE = /(?:toca|toque|toque a|toque o|dar play em|play)\s+(.+)/;
const PLAYLIST_QUERY_RE = /(?:playlist|plalist)\s+(.+)/;
const VOLUME_RE = /volume\s*(?:em|para|pra|no)?\s*(\d+|máximo|mximo|max|minimo|minimo|zero)/;

function extractSearchQuery(n: string): string | null {
  const m = n.match(PLAY_QUERY_RE);
  if (!m) return null;
  const q = m[1]
    .replace(/^(?:no|na|o|a|no spotify|na música|na musica|a música|a musica)\s+/i, "")
    .trim();
  if (!q || /^(música|musica|spotify|play|playlist)$/i.test(q)) return null;
  return q;
}

function extractPlaylistQuery(n: string): string | null {
  const m = n.match(PLAYLIST_QUERY_RE);
  if (!m) return null;
  return m[1]
    .replace(/^(?:no|na|o|a|do|da|de)\s+/i, "")
    .trim() || null;
}

function extractVolume(n: string): number | null {
  const m = n.match(VOLUME_RE);
  if (!m) return null;
  const val = m[1].toLowerCase();
  if (val === "máximo" || val === "mximo" || val === "max") return 100;
  if (val === "minimo" || val === "minimno" || val === "min" || val === "zero") return 0;
  const num = parseInt(val, 10);
  return isNaN(num) ? null : Math.min(100, Math.max(0, num));
}

function extractDeviceTarget(n: string): string | null {
  if (/celular|phone|telemóvel/.test(n)) return "smartphone";
  if (/fone|headphone|fone de ouvido|airpod/.test(n)) return "headphone";
  if (/speaker|caixa|caixa de som|bluetooth/.test(n)) return "speaker";
  if (/computador|pc|computer/.test(n)) return "computer";
  if (/tv|televisão/.test(n)) return "tv";
  if (/tablet|ipad/.test(n)) return "tablet";
  return null;
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

    if (wantsOpen(n)) {
      const ok = await openSpotifyApp();
      return ok
        ? "Abrindo o Spotify."
        : "Não consegui abrir o Spotify. Confirma se o app está instalado?";
    }

    if (!isMusicIntent(n)) return null;

    if (!isSpotifyConfigured()) return NOT_CONFIGURED;
    if (!(await isSpotifyConnected())) return NOT_CONNECTED;

    // Volume control
    if (wantsVolume(n)) {
      const vol = extractVolume(n);
      if (vol === null) return "Não entendi o volume. Diga um número de 0 a 100.";
      const err = await tryPlayback(() => setVolume(vol));
      return err ?? `Volume ajustado para ${vol}%.`;
    }

    // Device switching
    if (wantsDevice(n)) {
      const target = extractDeviceTarget(n);
      if (!target) return "Não entendi qual dispositivo. Fala: celular, fone, speaker, computador ou tv.";
      try {
        const devices = await getDevices();
        const match = devices.find((d) =>
          d.name.toLowerCase().includes(target) || d.type.toLowerCase().includes(target)
        );
        if (!match) return `Não encontrei um dispositivo "${target}" ativo. Abre o Spotify nele primeiro.`;
        // The device switching requires the device to be active first
        return `Encontrei o dispositivo "${match.name}". Abre o Spotify nele e me pede pra tocar de novo.`;
      } catch {
        return "Não consegui listar os dispositivos. Tenta de novo.";
      }
    }

    // Status
    if (wantsStatus(n)) {
      const now = await getCurrentlyPlaying();
      if (!now?.item) return NOT_PLAYING;
      const track = now.item;
      const progress = Math.floor(now.progress_ms / 1000);
      const duration = Math.floor(now.duration_ms / 1000);
      const min = Math.floor(progress / 60);
      const sec = progress % 60;
      return `Está tocando ${track.name}, de ${track.artists.map((a) => a.name).join(" e ")}. ${min}:${String(sec).padStart(2, "0")} de ${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, "0")}.`;
    }

    // Playlist
    if (wantsPlaylist(n)) {
      const query = extractPlaylistQuery(n);
      if (!query) return "Qual playlist você quer? Fala: abre a playlist + nome.";
      try {
        const playlist = await searchPlaylist(query);
        if (!playlist) return `Não encontrei a playlist "${query}".`;
        await playPlaylist(playlist.uri);
        return `Tocando a playlist ${playlist.name}.`;
      } catch {
        return "Não consegui tocar essa playlist. Tenta de novo.";
      }
    }

    // Play (resume or search)
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

    // Pause
    if (wantsPause(n)) {
      const err = await tryPlayback(spotifyPause);
      return err ?? "Música pausada.";
    }

    // Stop (pause + confirm)
    if (wantsStop(n)) {
      const err = await tryPlayback(spotifyPause);
      return err ?? "Spotify desligado. Música pausada.";
    }

    // Next
    if (wantsNext(n)) {
      const err = await tryPlayback(spotifyNext);
      return err ?? "Pulando para a próxima música.";
    }

    // Previous
    if (wantsPrevious(n)) {
      const err = await tryPlayback(spotifyPrevious);
      return err ?? "Voltando para a música anterior.";
    }

    return null;
  });
}
