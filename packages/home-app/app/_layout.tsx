// Orun Home — root layout. Locks to LANDSCAPE fullscreen (tablet dashboard),
// hydrates the home store and starts the ecosystem satellite on boot.

import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as ScreenOrientation from "expo-screen-orientation";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useHomeStore } from "../src/stores/homeStore";
import { startSatellite, stopSatellite } from "../src/services/satelliteController";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const hydrate = useHomeStore((s) => s.hydrate);

  useEffect(() => {
    (async () => {
      // Landscape fullscreen — the tablet dashboard is designed sideways.
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      await hydrate();
      // Best-effort: connect to the ecosystem hub as satellite "home".
      try {
        await startSatellite();
      } catch {
        /* offline — retry handled by satellite interval */
      }
      await SplashScreen.hideAsync();
    })();
    return () => {
      stopSatellite();
    };
  }, [hydrate]);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#050505" } }} />
    </SafeAreaProvider>
  );
}
