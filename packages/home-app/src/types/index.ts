// Orun Home — types (ported from desktop workspace-home-ia/home-types.ts)

export interface HomeDevice {
  id: string;
  name: string;
  type:
    | "light"
    | "switch"
    | "climate"
    | "lock"
    | "cover"
    | "sensor"
    | "binary_sensor"
    | "camera"
    | "media_player";
  icon: string;
  state: boolean;
  value: string | number;
  brightness?: number;
  temperature?: number;
  locked?: boolean;
}

export interface HomeRoom {
  id: string;
  name: string;
  icon: string;
  devices: HomeDevice[];
}

export interface HomeAutomation {
  id: string;
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
  lastRun: string | null;
  steps: { deviceId: string; action: string; brightness?: number }[];
}

export interface HomeScene {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface HomeStatus {
  rooms: { id: string; name: string; icon: string; devicesOn: number; devices: number }[];
  devices: {
    total: number;
    on: number;
    open: number;
    lights: number;
    lightsOn: number;
    locks: number;
    locked: number;
    sensors: number;
    alerts: number;
  };
  energy: { lights: string; climate: string; total: string };
  automations: { total: number; enabled: number; ranToday: number };
  updatedAt: string;
}

export interface HomeConfig {
  /** Fonte de dados: "local" = este tablet (satelite Orun, sem HA); "ha" = Home Assistant. */
  mode: "local" | "ha";
  host: string;
  token: string;
  name: string;
  /** true quando o Home Assistant (mode "ha") esta conectado. */
  connected: boolean;
  error?: string;
}

export interface SatelliteStatus {
  connected: boolean;
  lastSeen: string | null;
  pendingCommands: number;
  deviceId: string;
  version: string;
  error?: string;
}
