// Orun OS — Spotify service
//
// OAuth 2.0 Authorization Code + PKCE (no client secret needed), tokens kept
// in AsyncStorage, auto-refresh, and a thin wrapper over the Spotify Web API
// for playback control (play/pause/next/previous/play track).
//
// Setup (one time):
//   1. https://developer.spotify.com/dashboard → Create App
//   2. Redirect URIs: orun-os://spotify  and  orun-os://spotify-callback
//   3. EXPO_PUBLIC_SPOTIFY_CLIENT_ID=... in the mobile-app .env
//
// Playback control requires a Spotify Premium account.

import * as AuthSession from "expo-auth-session";
import { exchangeCodeAsync } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import AsyncStorage from "@react-native-async-storage/async-storage";

WebBrowser.maybeCompleteAuthSession();

const CLIENT_ID = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID ?? "";

const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token";

const DISCOVERY: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: "https://accounts.spotify.com/authorize",
  tokenEndpoint: TOKEN_ENDPOINT,
  revocationEndpoint: "https://accounts.spotify.com/api/token/revoke",
};

const SCOPES = [
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing",
];

const API_BASE = "https://api.spotify.com/v1";
const STORAGE_KEY = "orun.spotify.tokens";

interface StoredTokens {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number;
  connectedAt: string;
}

export function isSpotifyConfigured(): boolean {
  return CLIENT_ID.length > 0;
}

export async function isSpotifyConnected(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return false;
  try {
    const tokens: StoredTokens = JSON.parse(raw);
    return Boolean(tokens.accessToken);
  } catch {
    return false;
  }
}

async function loadTokens(): Promise<StoredTokens | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredTokens;
  } catch {
    return null;
  }
}

async function saveTokens(tokens: StoredTokens): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
}

async function clearTokens(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

function redirectUri(): string {
  return AuthSession.makeRedirectUri({ scheme: "orun-os", path: "spotify" });
}

function newAuthRequest(): AuthSession.AuthRequest {
  return new AuthSession.AuthRequest({
    clientId: CLIENT_ID,
    scopes: SCOPES,
    redirectUri: redirectUri(),
    usePKCE: true,
  });
}

/**
 * Opens the Spotify login flow and stores the tokens.
 * Uses Authorization Code + PKCE: the authorize step returns a `code` that
 * must be exchanged for access/refresh tokens before they can be stored.
 * Returns true when the user finished the flow with a token.
 */
export async function connectSpotify(): Promise<boolean> {
  if (!isSpotifyConfigured()) return false;

  const request = newAuthRequest();
  const result = await request.promptAsync(DISCOVERY);

  if (result.type !== "success") return false;

  const code = result.params.code;
  if (!code) return false;

  let tokenResponse: AuthSession.TokenResponse;
  try {
    tokenResponse = await exchangeCodeAsync(
      {
        clientId: CLIENT_ID,
        code,
        redirectUri: redirectUri(),
        extraParams: request.codeVerifier
          ? { code_verifier: request.codeVerifier }
          : undefined,
      },
      { tokenEndpoint: TOKEN_ENDPOINT }
    );
  } catch (err) {
    console.warn("[spotify] Token exchange failed:", err);
    return false;
  }

  await saveTokens({
    accessToken: tokenResponse.accessToken,
    refreshToken: tokenResponse.refreshToken ?? null,
    expiresAt: Date.now() + (tokenResponse.expiresIn ?? 3600) * 1000,
    connectedAt: new Date().toISOString(),
  });

  return true;
}

export async function disconnectSpotify(): Promise<void> {
  await clearTokens();
}

async function refreshAccessToken(tokens: StoredTokens): Promise<string | null> {
  if (!tokens.refreshToken) return null;

  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: tokens.refreshToken,
    client_id: CLIENT_ID,
  });

  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) {
    await clearTokens();
    return null;
  }

  const data = await res.json();
  const accessToken = data.access_token as string | undefined;
  if (!accessToken) {
    await clearTokens();
    return null;
  }

  const updated: StoredTokens = {
    ...tokens,
    accessToken,
    expiresAt: Date.now() + Number(data.expires_in ?? 3600) * 1000,
  };
  await saveTokens(updated);
  return accessToken;
}

async function getValidAccessToken(): Promise<string | null> {
  const tokens = await loadTokens();
  if (!tokens) return null;

  if (tokens.expiresAt > Date.now() + 30_000) return tokens.accessToken;

  if (tokens.refreshToken) {
    const refreshed = await refreshAccessToken(tokens);
    if (refreshed) return refreshed;
    return null;
  }

  await clearTokens();
  return null;
}

async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = await getValidAccessToken();
  if (!token) throw new Error("spotify_not_connected");

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (res.status === 401) {
    // Token expired after all — force reconnect on next command.
    await clearTokens();
    throw new Error("spotify_reauth_required");
  }
  if (res.status === 204) return undefined as T;

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`spotify_error:${res.status}`);
  }
  return (text ? JSON.parse(text) : undefined) as T;
}

// ─── Playback API ───────────────────────────────────────────────────

export interface SpotifyDevice {
  id: string | null;
  is_active: boolean;
  is_private_session: boolean;
  name: string;
  type: string;
}

export interface CurrentlyPlaying {
  is_playing: boolean;
  item: {
    name: string;
    artists: Array<{ name: string }>;
  } | null;
  progress_ms: number;
  duration_ms: number;
}

export async function getPlayerState(): Promise<{ device: SpotifyDevice | null; is_playing: boolean }> {
  const data = await api<{ device: SpotifyDevice | null; is_playing: boolean }>("GET", "/me/player");
  return data ?? { device: null, is_playing: false };
}

export async function getCurrentlyPlaying(): Promise<CurrentlyPlaying | null> {
  try {
    return await api<CurrentlyPlaying>("GET", "/me/player/currently-playing");
  } catch {
    return null;
  }
}

export async function spotifyPlay(): Promise<void> {
  await api("PUT", "/me/player/play");
}

export async function spotifyPause(): Promise<void> {
  await api("PUT", "/me/player/pause");
}

export async function spotifyNext(): Promise<void> {
  await api("POST", "/me/player/next");
}

export async function spotifyPrevious(): Promise<void> {
  await api("POST", "/me/player/previous");
}

export async function playTrackByName(query: string): Promise<{ name: string; artists: string } | null> {
  const search = await api<{ tracks: { items: Array<{ name: string; uri: string; artists: Array<{ name: string }> }> } }>(
    "GET",
    `/search?type=track&limit=1&q=${encodeURIComponent(query)}`
  );
  const track = search?.tracks?.items?.[0];
  if (!track) return null;

  await api("PUT", "/me/player/play", { uris: [track.uri] });
  return { name: track.name, artists: track.artists.map((a) => a.name).join(", ") };
}

export async function searchPlaylist(query: string): Promise<{ name: string; uri: string; id: string } | null> {
  const search = await api<{ playlists: { items: Array<{ name: string; uri: string; id: string }> } }>(
    "GET",
    `/search?type=playlist&limit=3&q=${encodeURIComponent(query)}`
  );
  return search?.playlists?.items?.[0] ?? null;
}

export async function playPlaylist(playlistUri: string): Promise<void> {
  await api("PUT", "/me/player/play", { context_uri: playlistUri });
}

export async function setVolume(percent: number): Promise<void> {
  await api("PUT", `/me/player/volume?volume=${Math.min(100, Math.max(0, percent))}`);
}

export async function getDevices(): Promise<SpotifyDevice[]> {
  const data = await api<{ devices: SpotifyDevice[] }>("GET", "/me/player/devices");
  return data?.devices ?? [];
}

export async function transferDevice(deviceId: string): Promise<void> {
  await api("PUT", "/me/player", { device_ids: [deviceId] });
}
