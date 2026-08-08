/**
 * Orun OS Mobile — Theme Tokens
 *
 * Shared color palette with the desktop design system.
 * Uses hex values instead of CSS variables (React Native doesn't support CSS vars).
 * Maps directly from packages/design-system/src/theme/tokens.ts "bloodred" theme.
 */

export type ThemeName = "dark" | "bloodred" | "premium" | "minimal" | "neon";

export interface ThemeColors {
  bgBase: string;
  bgElevated: string;
  bgOverlay: string;
  bgSunken: string;
  surface: string;
  surfaceHover: string;
  surfaceActive: string;
  surfaceBorder: string;
  accent: string;
  accentHover: string;
  accentMuted: string;
  accentGlow: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverted: string;
  gold: string;
  goldMuted: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
}

const shared: Pick<ThemeColors, "success" | "warning" | "danger" | "info"> = {
  success: "#34c759",
  warning: "#ffb020",
  danger: "#ff453a",
  info: "#409cff",
};

export const themes: Record<ThemeName, ThemeColors> = {
  dark: {
    ...shared,
    bgBase: "#0a0a0c",
    bgElevated: "#121215",
    bgOverlay: "#18181c",
    bgSunken: "#060607",
    surface: "#16161a",
    surfaceHover: "#1e1e23",
    surfaceActive: "#26262c",
    surfaceBorder: "#ffffff",
    accent: "#a8202a",
    accentHover: "#c42832",
    accentMuted: "#5a181e",
    accentGlow: "#dc323c",
    textPrimary: "#f5f5f7",
    textSecondary: "#a8a8b0",
    textMuted: "#6e6e76",
    textInverted: "#0a0a0c",
    gold: "#d4af64",
    goldMuted: "#786441",
  },
  bloodred: {
    ...shared,
    bgBase: "#080607",
    bgElevated: "#10090a",
    bgOverlay: "#160c0d",
    bgSunken: "#040303",
    surface: "#140b0c",
    surfaceHover: "#1e0f10",
    surfaceActive: "#2a1214",
    surfaceBorder: "#ff5a5a",
    accent: "#8b0014",
    accentHover: "#b00a1c",
    accentMuted: "#500a12",
    accentGlow: "#ff1e2d",
    textPrimary: "#f8f0f0",
    textSecondary: "#c4a0a0",
    textMuted: "#785a5a",
    textInverted: "#080607",
    gold: "#d4af64",
    goldMuted: "#786441",
  },
  premium: {
    ...shared,
    bgBase: "#0c0b09",
    bgElevated: "#14120f",
    bgOverlay: "#1a1713",
    bgSunken: "#070605",
    surface: "#181511",
    surfaceHover: "#221e18",
    surfaceActive: "#2c261e",
    surfaceBorder: "#d4af64",
    accent: "#d4af64",
    accentHover: "#e6c382",
    accentMuted: "#786441",
    accentGlow: "#e6c382",
    textPrimary: "#f8f4ec",
    textSecondary: "#c4baa5",
    textMuted: "#827864",
    textInverted: "#0c0b09",
    gold: "#e6c382",
    goldMuted: "#967d55",
  },
  minimal: {
    ...shared,
    bgBase: "#0e0e0f",
    bgElevated: "#141416",
    bgOverlay: "#1a1a1c",
    bgSunken: "#09090a",
    surface: "#141416",
    surfaceHover: "#1a1a1d",
    surfaceActive: "#202024",
    surfaceBorder: "#ffffff",
    accent: "#96969e",
    accentHover: "#b4b4bc",
    accentMuted: "#505056",
    accentGlow: "#96969e",
    textPrimary: "#eeeeef",
    textSecondary: "#a0a0a6",
    textMuted: "#64646a",
    textInverted: "#0e0e0f",
    gold: "#aaa596",
    goldMuted: "#6e695f",
  },
  neon: {
    ...shared,
    bgBase: "#050208",
    bgElevated: "#0c0512",
    bgOverlay: "#120a1c",
    bgSunken: "#03010a",
    surface: "#0f0718",
    surfaceHover: "#190b26",
    surfaceActive: "#241034",
    surfaceBorder: "#ff2d6f",
    accent: "#c3002f",
    accentHover: "#ff1e56",
    accentMuted: "#4a0a22",
    accentGlow: "#ff2d6f",
    textPrimary: "#fbf6ff",
    textSecondary: "#c9b8d9",
    textMuted: "#7d6b8f",
    textInverted: "#050208",
    gold: "#ffd166",
    goldMuted: "#a8843a",
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const TYPOGRAPHY = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  title: 28,
  hero: 34,
} as const;

export const FONT_WEIGHT = {
  regular: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
};

/**
 * Neon/Glass — gradient & glow presets for the futuristic look.
 * Always used with expo-linear-gradient + expo-blur.
 */
export const NEON = {
  bg: "#050208",
  gradient: {
    background: ["#050208", "#0a0216", "#140326"] as const,
    card: ["rgba(30,12,48,0.55)", "rgba(10,4,20,0.65)"] as const,
    accent: ["#ff1e56", "#c3002f"] as const,
    gold: ["#ffd166", "#ff7a1a"] as const,
    chip: ["rgba(255,45,111,0.16)", "rgba(195,0,47,0.06)"] as const,
  },
  glow: {
    red: "#ff2d6f",
    gold: "#ffd166",
    soft: "rgba(255,45,111,0.25)",
  },
  glass: {
    blur: 18,
    tint: "dark" as const,
  },
} as const;
