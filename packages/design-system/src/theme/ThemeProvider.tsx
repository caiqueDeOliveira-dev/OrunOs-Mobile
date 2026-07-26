import React, { createContext, useContext, useEffect } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { applyTheme, OrunThemeName } from "./tokens";

interface ThemeStore {
  theme: OrunThemeName;
  setTheme: (theme: OrunThemeName) => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: "bloodred",
      setTheme: (theme) => set({ theme }),
    }),
    { name: "orun-theme" }
  )
);

const ThemeContext = createContext<{ theme: OrunThemeName } | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return <ThemeContext.Provider value={{ theme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
