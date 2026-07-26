import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemeName, themes, ThemeColors } from "./tokens";

const THEME_KEY = "orun-theme";
const THEME_MODE_KEY = "orun-theme-mode";

type ThemeMode = "system" | "light" | "dark" | "manual";

interface ThemeContextValue {
  themeName: ThemeName;
  colors: ThemeColors;
  isDark: boolean;
  themeMode: ThemeMode;
  setTheme: (name: ThemeName) => void;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  themeName: "bloodred",
  colors: themes.bloodred,
  isDark: true,
  themeMode: "system",
  setTheme: () => {},
  setThemeMode: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [themeName, setThemeName] = useState<ThemeName>("bloodred");
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(THEME_KEY),
      AsyncStorage.getItem(THEME_MODE_KEY),
    ]).then(([storedTheme, storedMode]) => {
      if (storedMode && ["system", "light", "dark", "manual"].includes(storedMode)) {
        setThemeModeState(storedMode as ThemeMode);
      }
      if (storedTheme && storedTheme in themes) {
        setThemeName(storedTheme as ThemeName);
      }
    });
  }, []);

  // When system scheme changes and mode is "system", auto-switch theme
  useEffect(() => {
    if (themeMode === "system") {
      setThemeName(systemScheme === "dark" ? "dark" : "minimal");
    }
  }, [systemScheme, themeMode]);

  const setTheme = useCallback((name: ThemeName) => {
    setThemeName(name);
    setThemeModeState("manual");
    AsyncStorage.setItem(THEME_KEY, name);
    AsyncStorage.setItem(THEME_MODE_KEY, "manual");
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    AsyncStorage.setItem(THEME_MODE_KEY, mode);
    if (mode === "system") {
      const sysTheme = useColorScheme() === "dark" ? "dark" : "minimal";
      setThemeName(sysTheme);
      AsyncStorage.setItem(THEME_KEY, sysTheme);
    }
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      themeName,
      colors: themes[themeName],
      isDark: systemScheme !== "light" || themeName !== "minimal",
      themeMode,
      setTheme,
      setThemeMode,
    }),
    [themeName, systemScheme, themeMode, setTheme, setThemeMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
