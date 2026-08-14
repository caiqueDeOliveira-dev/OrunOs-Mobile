// Orun Home — state store (ported from desktop workspace-home-ia/home-store.ts)
// Uses AsyncStorage instead of localStorage; zustand for reactivity.

import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  HomeRoom,
  HomeAutomation,
  HomeScene,
  HomeStatus,
  HomeConfig,
  HomeDevice,
} from "../types";

const STORAGE_KEY = "orun_home_state";

const MOCK_ROOMS: HomeRoom[] = [
  {
    id: "sala",
    name: "Sala de Estar",
    icon: "Sofa",
    devices: [
      { id: "luz_sala", name: "Luz de Teto", type: "light", icon: "Lightbulb", state: true, value: 80, brightness: 80 },
      { id: "abajur_sala", name: "Abajur", type: "light", icon: "Lamp", state: false, value: 40, brightness: 40 },
      { id: "ar_sala", name: "Ar-Condicionado", type: "climate", icon: "Snowflake", state: true, value: 23, temperature: 23 },
      { id: "tv_sala", name: "Smart TV", type: "media_player", icon: "Tv", state: false, value: "desligada" },
      { id: "presenca_sala", name: "Sensor de Presenca", type: "binary_sensor", icon: "Radar", state: false, value: "sem movimento" },
    ],
  },
  {
    id: "quarto",
    name: "Quarto",
    icon: "Bed",
    devices: [
      { id: "luz_quarto", name: "Luz do Quarto", type: "light", icon: "Lightbulb", state: false, value: 60, brightness: 60 },
      { id: "termostato_quarto", name: "Termostato", type: "climate", icon: "Thermometer", state: true, value: 22, temperature: 22 },
      { id: "temp_quarto", name: "Sensor de Temperatura", type: "sensor", icon: "ThermometerSun", state: true, value: "22.4 °C" },
      { id: "umid_quarto", name: "Sensor de Umidade", type: "sensor", icon: "Droplets", state: true, value: "48%" },
      { id: "alarme", name: "Alarme", type: "lock", icon: "Lock", state: true, value: "armado", locked: true },
    ],
  },
  {
    id: "cozinha",
    name: "Cozinha",
    icon: "ChefHat",
    devices: [
      { id: "luz_cozinha", name: "Luz da Cozinha", type: "light", icon: "Lightbulb", state: false, value: 90, brightness: 90 },
      { id: "cafeteira", name: "Cafeteira", type: "switch", icon: "Coffee", state: false, value: "desligada" },
      { id: "geladeira", name: "Geladeira", type: "switch", icon: "Refrigerator", state: true, value: "ligada" },
      { id: "fumaca_cozinha", name: "Sensor de Fumaca", type: "binary_sensor", icon: "Flame", state: false, value: "sem fumaca" },
    ],
  },
  {
    id: "garagem",
    name: "Garagem / Entrada",
    icon: "Car",
    devices: [
      { id: "portao", name: "Portao da Garagem", type: "cover", icon: "DoorOpen", state: false, value: "fechado", locked: false },
      { id: "luz_garagem", name: "Luz da Garagem", type: "light", icon: "Lightbulb", state: false, value: 100, brightness: 100 },
      { id: "porta_entrada", name: "Porta de Entrada", type: "lock", icon: "Lock", state: true, value: "trancada", locked: true },
      { id: "cam_garagem", name: "Camera de Seguranca", type: "camera", icon: "Cctv", state: true, value: "gravando" },
    ],
  },
];

const MOCK_AUTOMATIONS: HomeAutomation[] = [
  { id: "autom_chegar_casa", name: "Chegar em Casa", description: "Abre o portao, liga a luz da sala e ajusta o ar-condicionado", icon: "Home", enabled: true, lastRun: null, steps: [{ deviceId: "portao", action: "open" }, { deviceId: "luz_sala", action: "on" }, { deviceId: "ar_sala", action: "on" }] },
  { id: "autom_boa_noite", name: "Boa Noite", description: "Desliga as luzes, tranca portas e arma o alarme", icon: "Moon", enabled: true, lastRun: null, steps: [{ deviceId: "luz_sala", action: "off" }, { deviceId: "luz_quarto", action: "off" }, { deviceId: "tv_sala", action: "off" }, { deviceId: "porta_entrada", action: "lock" }, { deviceId: "alarme", action: "arm" }] },
  { id: "autom_acordar", name: "Acordar", description: "Liga a cafeteira, abre o portao e liga a luz do quarto em 40%", icon: "Sunrise", enabled: true, lastRun: null, steps: [{ deviceId: "cafeteira", action: "on" }, { deviceId: "luz_quarto", action: "on", brightness: 40 }, { deviceId: "portao", action: "open" }] },
  { id: "autom_sair_casa", name: "Sair de Casa", description: "Desliga tudo, tranca a porta e arma o alarme", icon: "DoorClosed", enabled: true, lastRun: null, steps: [{ deviceId: "luz_sala", action: "off" }, { deviceId: "luz_cozinha", action: "off" }, { deviceId: "tv_sala", action: "off" }, { deviceId: "ar_sala", action: "off" }, { deviceId: "porta_entrada", action: "lock" }, { deviceId: "alarme", action: "arm" }] },
];

const MOCK_SCENES: HomeScene[] = [
  { id: "cena_cinema", name: "Modo Cinema", icon: "Clapperboard", description: "Luz da sala a 20% e TV ligada" },
  { id: "cena_jantar", name: "Modo Jantar", icon: "Utensils", description: "Luz da cozinha e sala em tons quentes" },
  { id: "cena_festa", name: "Modo Festa", icon: "PartyPopper", description: "Todas as luzes em 100%" },
  { id: "cena_economia", name: "Modo Economia", icon: "Leaf", description: "Reduz todas as luzes para 30%" },
];

function computeStatus(rooms: HomeRoom[], automations: HomeAutomation[]): HomeStatus {
  const all = rooms.flatMap((r) => r.devices);
  const lights = all.filter((d) => d.type === "light");
  const lightsOn = lights.filter((d) => d.state).length;
  const locks = all.filter((d) => d.type === "lock" || d.type === "cover");
  return {
    rooms: rooms.map((r) => ({ id: r.id, name: r.name, icon: r.icon, devicesOn: r.devices.filter((d) => d.state).length, devices: r.devices.length })),
    devices: {
      total: all.length,
      on: all.filter((d) => d.state).length,
      open: all.filter((d) => d.state).length,
      lights: lights.length,
      lightsOn,
      locks: locks.length,
      locked: locks.filter((d) => d.locked).length,
      sensors: all.filter((d) => d.type === "sensor" || d.type === "binary_sensor").length,
      alerts: all.filter((d) => d.type === "binary_sensor" && d.state).length,
    },
    energy: {
      lights: `${Math.round(lightsOn * 9)} W`,
      climate: all.some((d) => d.type === "climate" && d.state) ? "1.2 kW" : "0 W",
      total: all.some((d) => d.type === "climate" && d.state) ? "1.3 kW" : "90 W",
    },
    automations: {
      total: automations.length,
      enabled: automations.filter((a) => a.enabled).length,
      ranToday: automations.filter((a) => a.lastRun && new Date(a.lastRun).toDateString() === new Date().toDateString()).length,
    },
    updatedAt: new Date().toISOString(),
  };
}

async function loadPersisted() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return {};
}

const DEFAULT_CONFIG: HomeConfig = { mode: "local", host: "", token: "", name: "Orun Home", connected: false };

/**
 * Normalizes a persisted config (may come from an older build that used
 * `mode: "simulated"`) into the current contract. Unknown/old modes become
 * "local" (this tablet + satellite is the source of truth, no Home Assistant).
 */
function normalizeConfig(cfg: any): HomeConfig {
  if (!cfg || typeof cfg !== "object") return { ...DEFAULT_CONFIG };
  const mode: HomeConfig["mode"] = cfg.mode === "ha" ? "ha" : "local";
  return {
    mode,
    host: typeof cfg.host === "string" ? cfg.host : "",
    token: typeof cfg.token === "string" ? cfg.token : "",
    name: typeof cfg.name === "string" && cfg.name ? cfg.name : "Orun Home",
    connected: cfg.connected === true,
    error: typeof cfg.error === "string" ? cfg.error : undefined,
  };
}

interface HomeStore {
  rooms: HomeRoom[];
  automations: HomeAutomation[];
  scenes: HomeScene[];
  config: HomeConfig;
  status: HomeStatus;
  loading: boolean;
  error: string | null;
  hydrate: () => Promise<void>;
  persist: () => Promise<void>;
  toggleDevice: (deviceId: string) => Promise<{ success: boolean }>;
  setBrightness: (deviceId: string, brightness: number) => Promise<{ success: boolean }>;
  setTemperature: (deviceId: string, temperature: number) => Promise<{ success: boolean }>;
  lockDevice: (deviceId: string, locked: boolean) => Promise<{ success: boolean }>;
  runAutomation: (automationId: string) => Promise<{ success: boolean; data?: any }>;
  toggleAutomation: (automationId: string) => Promise<{ success: boolean }>;
  activateScene: (sceneId: string) => Promise<{ success: boolean }>;
  saveConfig: (cfg: Partial<HomeConfig>) => Promise<HomeConfig>;
  refreshStatus: () => void;
}

export const useHomeStore = create<HomeStore>((set, get) => {
  const applyToDevice = (deviceId: string, fn: (d: HomeDevice) => void) => {
    const s = get();
    const rooms = s.rooms.map((room) => ({
      ...room,
      devices: room.devices.map((d) => {
        if (d.id !== deviceId) return d;
        const copy = { ...d };
        fn(copy);
        return copy;
      }),
    }));
    set({ rooms, status: computeStatus(rooms, s.automations) });
    get().persist();
  };

  return {
    rooms: MOCK_ROOMS,
    automations: MOCK_AUTOMATIONS,
    scenes: MOCK_SCENES,
    config: { ...DEFAULT_CONFIG },
    status: computeStatus(MOCK_ROOMS, MOCK_AUTOMATIONS),
    loading: true,
    error: null,

    hydrate: async () => {
      try {
        const persisted = await loadPersisted();
        const rooms = persisted.rooms?.length ? persisted.rooms : MOCK_ROOMS;
        const automations = persisted.automations?.length ? persisted.automations : MOCK_AUTOMATIONS;
        const config = normalizeConfig(persisted.config);
        set({ rooms, automations, config, status: computeStatus(rooms, automations), loading: false });
      } catch {
        set({ loading: false });
      }
    },

    persist: async () => {
      try {
        const s = get();
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ rooms: s.rooms, automations: s.automations, config: s.config }));
      } catch {
        /* ignore */
      }
    },

    toggleDevice: async (deviceId) => {
      applyToDevice(deviceId, (d) => {
        d.state = !d.state;
        d.value = d.state ? (typeof d.value === "number" ? d.brightness ?? d.value : "ligado") : "desligado";
      });
      return { success: true };
    },

    setBrightness: async (deviceId, brightness) => {
      applyToDevice(deviceId, (d) => {
        d.brightness = brightness;
        d.state = brightness > 0;
        d.value = brightness;
      });
      return { success: true };
    },

    setTemperature: async (deviceId, temperature) => {
      applyToDevice(deviceId, (d) => {
        d.temperature = temperature;
        d.value = temperature;
      });
      return { success: true };
    },

    lockDevice: async (deviceId, locked) => {
      applyToDevice(deviceId, (d) => {
        d.locked = locked;
        d.state = locked;
        d.value = locked ? "trancado" : "destrancado";
      });
      return { success: true };
    },

    runAutomation: async (automationId) => {
      const s = get();
      const automations = s.automations.map((a) => (a.id === automationId ? { ...a, lastRun: new Date().toISOString() } : a));
      set({ automations, status: computeStatus(s.rooms, automations) });
      get().persist();
      return { success: true, data: automations.find((a) => a.id === automationId) };
    },

    toggleAutomation: async (automationId) => {
      const s = get();
      const automations = s.automations.map((a) => (a.id === automationId ? { ...a, enabled: !a.enabled } : a));
      set({ automations });
      get().persist();
      return { success: true };
    },

    activateScene: async (sceneId) => {
      const s = get();
      const rooms = s.rooms.map((room) => ({
        ...room,
        devices: room.devices.map((d) => {
          if (d.type !== "light") return d;
          const copy = { ...d };
          if (sceneId === "cena_cinema") {
            copy.state = d.id === "luz_sala";
            copy.brightness = d.id === "luz_sala" ? 20 : 0;
            copy.value = copy.brightness;
            if (d.id === "tv_sala") {
              copy.state = true;
              copy.value = "tocando";
            }
          } else if (sceneId === "cena_jantar") {
            copy.state = true;
            copy.brightness = 55;
            copy.value = 55;
          } else if (sceneId === "cena_festa") {
            copy.state = true;
            copy.brightness = 100;
            copy.value = 100;
          } else if (sceneId === "cena_economia") {
            copy.state = true;
            copy.brightness = 30;
            copy.value = 30;
          }
          return copy;
        }),
      }));
      set({ rooms, status: computeStatus(rooms, s.automations) });
      get().persist();
      return { success: true };
    },

    saveConfig: async (cfg) => {
      const prev = get().config;
      const mode: HomeConfig["mode"] = cfg.mode ?? prev.mode;
      const updated: HomeConfig = {
        ...prev,
        ...cfg,
        mode,
        // "connected" only means Home Assistant connectivity; "local" mode never claims HA.
        connected: mode === "ha" ? (cfg.connected ?? prev.connected ?? false) : false,
        error: cfg.error !== undefined ? cfg.error : prev.error,
      };
      set({ config: updated });
      get().persist();
      return updated;
    },

    refreshStatus: () => {
      const s = get();
      set({ status: computeStatus(s.rooms, s.automations) });
    },
  };
});
