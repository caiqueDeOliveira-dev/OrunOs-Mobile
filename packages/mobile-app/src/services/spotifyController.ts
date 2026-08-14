// Orun OS — Spotify voice commands
//
// Plugs into the voice command router: "liga o spotify", "pausa a música",
// "pula a música", "volta a música", "o que tá tocando", "toca <música>".

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

function wantsConnect(n: string): boolean {
  return /conecta|conectar|conecte/.test(n) && n.includes("spotify");
}

function wantsPlay(n: string): boolean {
  return (
    /ligar|liga|toca|toque|dar play|play|retomar|continue/.test(n) &&
    (n.includes("spotify") || n.includes("música") || n.includes("musica") || n.includes("play"))
  );
}

function wantsPause(n: string): boolean {
  return (
    /pausa|pausar|parar a música|para a música|stop|pausar a música/.test(n) &&
    (n.includes("música") || n.includes("musica") || n.includes("spotify") || /^pausa/.test(n))
  );
}

function wantsNext(n: string): boolean {
  return /pular|pula|próxima|proxima|avança|avanca|avançar|próximo|proximo/.test(n) &&
    (n.includes("música") || n.includes("musica") || n.includes("faixa") || n.includes("spotify") || n.includes("pular"));
}

function wantsPrevious(n: string): boolean {
  return /voltar|volta a música|anterior|música anterior|retroceder/.test(n) &&
    (n.includes("música") || n.includes("musica") || n.includes("faixa") || n.includes("anterior"));
}

function wantsStatus(n: string): boolean {
  return /o que (tá|está|ta) tocando|que música|qual música|tocando agora|agora tá tocando/.test(n);
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

    const musicIntent =
      n.includes("spotify") ||
      n.includes("música") ||
      n.includes("musica") ||
      n.includes("tocando") ||
      n.includes("faixa") ||
      n.includes("play") ||
      n.includes("pular") ||
      n.includes("próxima") ||
      n.includes("proxima");

    if (!musicIntent) return null;

    if (!isSpotifyConfigured()) return NOT_CONFIGURED;
    if (!(await isSpotifyConnected())) return NOT_CONNECTED;

    if (wantsStatus(n)) {
      const now = await getCurrentlyPlaying();
      if (!now?.item) return NOT_PLAYING;
      const track = now.item;
      return `Está tocando ${track.name}, de ${track.artists.map((a) => a.name).join(" e ")}.`;
    }

    if (wantsPlay(n)) {
      await spotifyPlay();
      return "Tocando.";
    }

    if (wantsPause(n)) {
      await spotifyPause();
      return "Música pausada.";
    }

    if (wantsNext(n)) {
      await spotifyNext();
      return "Pulando para a próxima música.";
    }

    if (wantsPrevious(n)) {
      await spotifyPrevious();
      return "Voltando para a música anterior.";
    }

    // "toca <algo>" — treat the tail as a search query.
    const playMatch = n.match(/(?:toca|toque|toque a|play)\s+(.+)/);
    if (playMatch) {
      const query = playMatch[1].replace(/^(no|na|no spotify|a música)\s+/i, "").trim();
      if (query && !/^(spotify|play)$/.test(query)) {
        const track = await playTrackByName(query);
        return track
          ? `Tocando ${track.name}, de ${track.artists}.`
          : `Não encontrei a música ${query}.`;
      }
    }

    return null;
  });
}
