// Orun Home — premium design system (ported from desktop workspace premium.tsx)
// Palette mirrors the desktop `P` object exactly so both apps look identical.

export const P = {
  bg: "#050505",
  panel: "#0A0A0C",
  card: "#141414",
  card2: "#1C1C1C",
  border: "#252525",
  borderHi: "#383838",
  text: "#FFFFFF",
  sub: "#A0A0A0",
  dim: "#5C5C5C",
  primary: "#C3002F",
  success: "#00D26A",
  alert: "#FFB547",
  error: "#FF4B4B",
  info: "#4DA3FF",
  violet: "#8B5CF6",
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const RADIUS = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  full: 9999,
} as const;

export const TYPE = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  title: 28,
  hero: 34,
} as const;

export const FW = {
  regular: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
};

export const GLOW = {
  primarySoft: "rgba(195,0,47,0.14)",
  primaryBorder: "rgba(195,0,47,0.35)",
  primaryText: "#C3002F",
  shadow: "rgba(195,0,47,0.08)",
} as const;
