import type { Config } from "tailwindcss";

/**
 * Orun OS — Tailwind Theme
 * Themes: Dark (default), Blood Red, Premium/Luxury, Minimal
 * All components consume these tokens via CSS variables so themes
 * can be swapped at runtime without rebuilding (see src/theme/tokens.ts).
 */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Semantic tokens — resolved via CSS variables set by ThemeProvider
        bg: {
          base: "rgb(var(--orun-bg-base) / <alpha-value>)",
          elevated: "rgb(var(--orun-bg-elevated) / <alpha-value>)",
          overlay: "rgb(var(--orun-bg-overlay) / <alpha-value>)",
          sunken: "rgb(var(--orun-bg-sunken) / <alpha-value>)",
        },
        surface: {
          DEFAULT: "rgb(var(--orun-surface) / <alpha-value>)",
          hover: "rgb(var(--orun-surface-hover) / <alpha-value>)",
          active: "rgb(var(--orun-surface-active) / <alpha-value>)",
          border: "rgb(var(--orun-surface-border) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--orun-accent) / <alpha-value>)",
          hover: "rgb(var(--orun-accent-hover) / <alpha-value>)",
          muted: "rgb(var(--orun-accent-muted) / <alpha-value>)",
          glow: "rgb(var(--orun-accent-glow) / <alpha-value>)",
        },
        text: {
          primary: "rgb(var(--orun-text-primary) / <alpha-value>)",
          secondary: "rgb(var(--orun-text-secondary) / <alpha-value>)",
          muted: "rgb(var(--orun-text-muted) / <alpha-value>)",
          inverted: "rgb(var(--orun-text-inverted) / <alpha-value>)",
        },
        status: {
          success: "rgb(var(--orun-success) / <alpha-value>)",
          warning: "rgb(var(--orun-warning) / <alpha-value>)",
          danger: "rgb(var(--orun-danger) / <alpha-value>)",
          info: "rgb(var(--orun-info) / <alpha-value>)",
        },
        gold: {
          DEFAULT: "rgb(var(--orun-gold) / <alpha-value>)",
          muted: "rgb(var(--orun-gold-muted) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: ["Inter", "SF Pro Display", "system-ui", "sans-serif"],
        display: ["Cormorant Garamond", "Playfair Display", "serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "16px",
        xl: "24px",
        "2xl": "32px",
      },
      boxShadow: {
        glow: "0 0 24px 2px rgb(var(--orun-accent-glow) / 0.35)",
        "glow-lg": "0 0 48px 8px rgb(var(--orun-accent-glow) / 0.30)",
        panel: "0 8px 32px rgba(0,0,0,0.45)",
        inset: "inset 0 1px 0 rgba(255,255,255,0.04)",
      },
      backdropBlur: {
        xs: "2px",
        glass: "18px",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { opacity: "0.6", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.04)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "pulse-glow": "pulse-glow 2.4s ease-in-out infinite",
        "fade-in": "fade-in 0.2s ease-out",
        shimmer: "shimmer 2s linear infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
