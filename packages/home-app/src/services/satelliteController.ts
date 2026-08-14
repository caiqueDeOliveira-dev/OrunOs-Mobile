// Orun Home — satellite controller (hub-and-spoke)
//
// The tablet runs as a satellite of type "home" in the ecosystem hub
// (tables `devices`/`commands`, migration 0007_ecosystem.sql). Desktop and
// mobile (hubs) write commands with target='home' via sendCommand(); this
// module heartbeats the device row and polls pending commands, executing
// them locally and reporting back the status — mirroring the desktop
// satelliteController.ts contract, but for React Native.

import { supabase } from "./supabaseClient";
import { useHomeStore } from "../stores/homeStore";
import type { SatelliteStatus } from "../types";

export const SATELLITE_TYPE = "home";
export const SATELLITE_VERSION = "0.1.0";
export const DEVICE_ID_STORAGE_KEY = "orun_home_device_id";

const HEARTBEAT_MS = 30_000;
const POLL_MS = 5_000;

let deviceId: string | null = null;
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;
let started = false;

function generateDeviceId(): string {
  const cryptoObj = (globalThis as any).crypto;
  if (cryptoObj && typeof cryptoObj.randomUUID === "function") return cryptoObj.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function loadOrCreateDeviceId(): Promise<string> {
  const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
  const existing = await AsyncStorage.getItem(DEVICE_ID_STORAGE_KEY);
  if (existing) return existing;
  const fresh = generateDeviceId();
  await AsyncStorage.setItem(DEVICE_ID_STORAGE_KEY, fresh);
  return fresh;
}

async function upsertDevice(): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await supabase.from("devices").upsert(
      {
        id: deviceId,
        tipo: SATELLITE_TYPE,
        nome: "Orun Home (Tablet)",
        versao: SATELLITE_VERSION,
        online: true,
        ultimo_seen: new Date().toISOString(),
      },
      { onConflict: "id" }
    );
    return error ? { ok: false, error: error.message } : { ok: true };
  } catch (e: any) {
    return { ok: false, error: String(e?.message || e) };
  }
}

async function heartbeat(): Promise<void> {
  if (!deviceId) return;
  try {
    await supabase.from("devices").update({ online: true, ultimo_seen: new Date().toISOString() }).eq("id", deviceId);
  } catch {
    /* retry on next tick */
  }
}

interface CommandRow {
  id: string;
  target: string;
  device_id: string | null;
  action: string;
  params: Record<string, any>;
  status: string;
}

/**
 * Maps a hub command action to a local home-store operation.
 * Actions follow the desktop home-actions.ts contract so the same
 * command surface works for TV/Shield ("power"/"volume"/...) and for
 * the home satellite ("toggle_device", "set_brightness", ...).
 */
async function executeCommand(cmd: CommandRow): Promise<{ ok: boolean; data?: any; error?: string }> {
  const store = useHomeStore.getState();
  const params = cmd.params || {};
  const deviceIdParam = String(params.deviceId || params.id || "");

  try {
    const run = async (fn: () => Promise<{ success: boolean; data?: any }>) => {
      const res = await fn();
      return res.success ? { ok: true, data: res.data } : { ok: false, error: "action failed" };
    };

    switch (cmd.action) {
      case "toggle_device":
        if (!deviceIdParam) return { ok: false, error: "deviceId is required" };
        return await run(() => store.toggleDevice(deviceIdParam));
      case "set_brightness": {
        if (!deviceIdParam) return { ok: false, error: "deviceId is required" };
        const brightness = Number(params.brightness ?? params.value ?? NaN);
        if (Number.isNaN(brightness)) return { ok: false, error: "brightness is required" };
        return await run(() => store.setBrightness(deviceIdParam, Math.max(0, Math.min(100, brightness))));
      }
      case "set_temperature": {
        if (!deviceIdParam) return { ok: false, error: "deviceId is required" };
        const temperature = Number(params.temperature ?? params.value ?? NaN);
        if (Number.isNaN(temperature)) return { ok: false, error: "temperature is required" };
        return await run(() => store.setTemperature(deviceIdParam, temperature));
      }
      case "lock_door": {
        if (!deviceIdParam) return { ok: false, error: "deviceId is required" };
        const locked = params.locked !== false;
        return await run(() => store.lockDevice(deviceIdParam, locked));
      }
      case "run_automation": {
        const automationId = String(params.automationId || params.id || "");
        if (!automationId) return { ok: false, error: "automationId is required" };
        return await run(() => store.runAutomation(automationId));
      }
      case "toggle_automation": {
        const automationId = String(params.automationId || params.id || "");
        if (!automationId) return { ok: false, error: "automationId is required" };
        return await run(() => store.toggleAutomation(automationId));
      }
      case "activate_scene": {
        const sceneId = String(params.sceneId || params.id || "");
        if (!sceneId) return { ok: false, error: "sceneId is required" };
        return await run(() => store.activateScene(sceneId));
      }
      case "get_home_status":
        store.refreshStatus();
        return { ok: true, data: useHomeStore.getState().status };
      case "list_devices": {
        const roomFilter = String(params.room || "").toLowerCase();
        let devices: any[] = useHomeStore.getState().rooms.flatMap((r) => r.devices.map((d) => ({ room: r.id, ...d })));
        if (roomFilter) devices = devices.filter((d) => String(d.room).toLowerCase().includes(roomFilter));
        return { ok: true, data: devices };
      }
      default:
        return { ok: false, error: `Unsupported home action: ${cmd.action}` };
    }
  } catch (e: any) {
    return { ok: false, error: String(e?.message || e) };
  }
}

async function pollCommands(): Promise<void> {
  if (!deviceId) return;
  try {
    const { data, error } = await supabase
      .from("commands")
      .select("*")
      .eq("target", SATELLITE_TYPE)
      .eq("status", "pending")
      .or(`device_id.eq.${deviceId},device_id.is.null`)
      .order("created_at", { ascending: true })
      .limit(10);

    if (error || !data) return;
    for (const cmd of data as CommandRow[]) {
      try {
        await supabase.from("commands").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", cmd.id);
        const result = await executeCommand(cmd);
        await supabase
          .from("commands")
          .update({
            status: result.ok ? "done" : "failed",
            response: result.ok ? (result.data ?? {}) : { error: result.error },
            completed_at: new Date().toISOString(),
          })
          .eq("id", cmd.id);
      } catch {
        await supabase
          .from("commands")
          .update({ status: "failed", response: { error: "poll error" }, completed_at: new Date().toISOString() })
          .eq("id", cmd.id);
      }
    }
  } catch {
    /* offline — retry next tick */
  }
}

export async function startSatellite(): Promise<SatelliteStatus> {
  deviceId = await loadOrCreateDeviceId();

  const upsert = await upsertDevice();
  if (!upsert.ok) {
    return {
      connected: false,
      lastSeen: null,
      pendingCommands: 0,
      deviceId,
      version: SATELLITE_VERSION,
      error: upsert.error,
    };
  }

  if (!started) {
    started = true;
    heartbeatTimer = setInterval(heartbeat, HEARTBEAT_MS);
    pollTimer = setInterval(pollCommands, POLL_MS);
  }

  return { connected: true, lastSeen: new Date().toISOString(), pendingCommands: 0, deviceId, version: SATELLITE_VERSION };
}

export async function stopSatellite(): Promise<void> {
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  if (pollTimer) clearInterval(pollTimer);
  heartbeatTimer = null;
  pollTimer = null;
  started = false;
  if (deviceId) {
    try {
      await supabase.from("devices").update({ online: false }).eq("id", deviceId);
    } catch {
      /* ignore */
    }
  }
  deviceId = null;
}

export function getDeviceId(): string | null {
  return deviceId;
}
