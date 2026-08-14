// Orun Home — optional Home Assistant REST client
//
// When the user configures a Home Assistant instance (host + long-lived
// access token), the app can read the real state instead of the local mock.
// Mirrors the desktop `orun.homeAssistant` bridge contract.

import { useHomeStore } from "../stores/homeStore";
import type { HomeConfig, HomeRoom, HomeDevice, HomeAutomation } from "../types";

function baseUrl(host: string): string {
  return host.replace(/\/+$/, "");
}

async function haFetch(path: string, init?: RequestInit): Promise<any> {
  const cfg = useHomeStore.getState().config;
  if (!cfg.host || !cfg.token) throw new Error("Home Assistant not configured");
  const res = await fetch(`${baseUrl(cfg.host)}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`Home Assistant HTTP ${res.status}`);
  return res.json();
}

export async function testConnection(): Promise<HomeConfig> {
  const cfg = useHomeStore.getState().config;
  try {
    await haFetch("/api/");
    const updated: HomeConfig = { ...cfg, mode: "ha", connected: true, error: undefined };
    useHomeStore.setState({ config: updated });
    return updated;
  } catch (e: any) {
    const updated: HomeConfig = { ...cfg, mode: "ha", connected: false, error: String(e?.message || e) };
    useHomeStore.setState({ config: updated });
    return updated;
  }
}

/** Reads the HA `states` endpoint and maps to the local HomeRoom shape. */
export async function getStates(): Promise<HomeRoom[]> {
  const states = await haFetch("/api/states");
  const lights = states.filter((s: any) => s.entity_id.startsWith("light."));
  const switches = states.filter((s: any) => s.entity_id.startsWith("switch."));
  const climates = states.filter((s: any) => s.entity_id.startsWith("climate."));
  const locks = states.filter((s: any) => s.entity_id.startsWith("lock."));
  const sensors = states.filter((s: any) => s.entity_id.startsWith("sensor."));

  const mapDevice = (s: any, type: HomeDevice["type"], name: string): HomeDevice => ({
    id: s.entity_id,
    name: s.attributes?.friendly_name || name,
    type,
    icon: "Circle",
    state: s.state === "on" || s.state === "open" || s.state === "locked" || s.state === "playing",
    value: s.state,
    brightness: s.attributes?.brightness ? Math.round((s.attributes.brightness / 255) * 100) : undefined,
    temperature: s.attributes?.temperature ?? s.attributes?.current_temperature,
  });

  const roomDevices: HomeDevice[] = [
    ...lights.map((s: any) => mapDevice(s, "light", "Luz")),
    ...switches.map((s: any) => mapDevice(s, "switch", "Tomada")),
    ...climates.map((s: any) => mapDevice(s, "climate", "Ar-Condicionado")),
    ...locks.map((s: any) => mapDevice(s, "lock", "Fechadura")),
    ...sensors.map((s: any) => mapDevice(s, "sensor", s.attributes?.friendly_name || "Sensor")),
  ];

  return [
    {
      id: "real",
      name: "Dispositivos Reais",
      icon: "Server",
      devices: roomDevices,
    },
  ];
}

/** Calls a Home Assistant service: /api/services/{domain}/{service}. */
export async function callService(
  entityId: string,
  action: string,
  data: Record<string, any> = {}
): Promise<{ success: boolean }> {
  const domain = entityId.split(".")[0] || "homeassistant";
  const serviceMap: Record<string, string> = {
    toggle: "toggle",
    set_brightness: "turn_on",
    set_temperature: "set_temperature",
    lock: "lock",
    unlock: "unlock",
    open: "open_cover",
    close: "close_cover",
  };
  const service = serviceMap[action] || action;
  const body = { entity_id: entityId, ...data };
  try {
    await haFetch(`/api/services/${domain}/${service}`, { method: "POST", body: JSON.stringify(body) });
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function getAutomations(): Promise<HomeAutomation[]> {
  try {
    const states = await haFetch("/api/states");
    return states
      .filter((s: any) => s.entity_id.startsWith("automation."))
      .map((s: any) => ({
        id: s.entity_id,
        name: s.attributes?.friendly_name || s.entity_id,
        description: s.attributes?.description || "",
        icon: "Zap",
        enabled: s.state === "on",
        lastRun: s.attributes?.last_triggered || null,
        steps: [],
      }));
  } catch {
    return [];
  }
}
