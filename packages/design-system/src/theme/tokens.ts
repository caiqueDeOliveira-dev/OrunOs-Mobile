/**
 * Orun OS — Theme Tokens
 *
 * Each theme is a flat map of CSS variable name -> "r g b" (space separated,
 * no commas) so Tailwind's `rgb(var(--x) / <alpha-value>)` pattern works and
 * opacity utilities (e.g. bg-accent/40) keep working across themes.
 *
 * Themes:
 *  - dark     : default OS shell, neutral premium dark
 *  - bloodred : Orun signature theme — near-black with deep red accent
 *  - premium  : warm dark + gold accents, used for Studio/Luxury surfaces
 *  - minimal  : low-contrast, reduced glow, for accessibility / focus mode
 */

export type OrunThemeName = "dark" | "bloodred" | "premium" | "minimal";

export type ThemeTokens = Record<string, string>;

const shared = {
  "--orun-success": "52 199 89",
  "--orun-warning": "255 176 32",
  "--orun-danger": "255 69 58",
  "--orun-info": "64 156 255",
};

export const themes: Record<OrunThemeName, ThemeTokens> = {
  dark: {
    ...shared,
    "--orun-bg-base": "10 10 12",
    "--orun-bg-elevated": "18 18 21",
    "--orun-bg-overlay": "24 24 28",
    "--orun-bg-sunken": "6 6 7",
    "--orun-surface": "22 22 26",
    "--orun-surface-hover": "30 30 35",
    "--orun-surface-active": "38 38 44",
    "--orun-surface-border": "255 255 255", // used at low alpha (e.g. /8)
    "--orun-accent": "168 32 42",
    "--orun-accent-hover": "196 40 50",
    "--orun-accent-muted": "90 24 30",
    "--orun-accent-glow": "220 50 60",
    "--orun-text-primary": "245 245 247",
    "--orun-text-secondary": "168 168 176",
    "--orun-text-muted": "110 110 118",
    "--orun-text-inverted": "10 10 12",
    "--orun-gold": "212 175 100",
    "--orun-gold-muted": "120 100 65",
  },
  bloodred: {
    ...shared,
    "--orun-bg-base": "8 6 7",
    "--orun-bg-elevated": "16 9 10",
    "--orun-bg-overlay": "22 12 13",
    "--orun-bg-sunken": "4 3 3",
    "--orun-surface": "20 11 12",
    "--orun-surface-hover": "30 15 16",
    "--orun-surface-active": "42 18 20",
    "--orun-surface-border": "255 90 90",
    "--orun-accent": "139 0 20",
    "--orun-accent-hover": "176 10 28",
    "--orun-accent-muted": "80 10 18",
    "--orun-accent-glow": "255 30 45",
    "--orun-text-primary": "248 240 240",
    "--orun-text-secondary": "196 160 160",
    "--orun-text-muted": "120 90 90",
    "--orun-text-inverted": "8 6 7",
    "--orun-gold": "212 175 100",
    "--orun-gold-muted": "120 100 65",
  },
  premium: {
    ...shared,
    "--orun-bg-base": "12 11 9",
    "--orun-bg-elevated": "20 18 15",
    "--orun-bg-overlay": "26 23 19",
    "--orun-bg-sunken": "7 6 5",
    "--orun-surface": "24 21 17",
    "--orun-surface-hover": "34 30 24",
    "--orun-surface-active": "44 38 30",
    "--orun-surface-border": "212 175 100",
    "--orun-accent": "212 175 100",
    "--orun-accent-hover": "230 195 130",
    "--orun-accent-muted": "120 100 65",
    "--orun-accent-glow": "230 195 130",
    "--orun-text-primary": "248 244 236",
    "--orun-text-secondary": "196 186 165",
    "--orun-text-muted": "130 120 100",
    "--orun-text-inverted": "12 11 9",
    "--orun-gold": "230 195 130",
    "--orun-gold-muted": "150 125 85",
  },
  minimal: {
    ...shared,
    "--orun-bg-base": "14 14 15",
    "--orun-bg-elevated": "20 20 22",
    "--orun-bg-overlay": "26 26 28",
    "--orun-bg-sunken": "9 9 10",
    "--orun-surface": "20 20 22",
    "--orun-surface-hover": "26 26 29",
    "--orun-surface-active": "32 32 36",
    "--orun-surface-border": "255 255 255",
    "--orun-accent": "150 150 158",
    "--orun-accent-hover": "180 180 188",
    "--orun-accent-muted": "80 80 86",
    "--orun-accent-glow": "150 150 158",
    "--orun-text-primary": "238 238 240",
    "--orun-text-secondary": "160 160 166",
    "--orun-text-muted": "100 100 106",
    "--orun-text-inverted": "14 14 15",
    "--orun-gold": "170 165 150",
    "--orun-gold-muted": "110 105 95",
  },
};

export function applyTheme(name: OrunThemeName, root: HTMLElement = document.documentElement) {
  const tokens = themes[name];
  Object.entries(tokens).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
  root.dataset.orunTheme = name;
}
